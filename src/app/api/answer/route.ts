import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server";
import { checkAnswer, ORDER } from "@/lib/game/engine.server";
import { GAME_CONTENT } from "@/lib/game/content.server";
import { readFullTeamSession, UnauthorizedError } from "@/lib/session.server";
import { checkRateLimit, getClientIp, RATE_LIMIT_CONFIG } from "@/lib/rate-limits";

export const dynamic = "force-dynamic";

const SubmitAnswerBodySchema = z.object({
  questionId: z.string().min(1, "Question ID is required").max(10, "Invalid question ID length"),
  answer: z
    .string({ required_error: "Answer is required" })
    .max(200, "Answer cannot exceed 200 characters"),
});

interface RpcResponse {
  success: boolean;
  error?: string;
  message?: string;
  is_correct?: boolean;
  progress?: number;
  finished?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate team session via signed cookie
    let teamId: string;
    let currentMemberId: string | undefined;

    try {
      const session = await readFullTeamSession();
      if (!session || !session.teamId) {
        throw new UnauthorizedError("Session missing or expired");
      }
      teamId = session.teamId;
      currentMemberId = session.memberId;
    } catch (authErr) {
      if (authErr instanceof UnauthorizedError) {
        return NextResponse.json({ error: authErr.message }, { status: 401 });
      }
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    // 2. Enforce atomic rate limits
    const ip = getClientIp(req);

    const teamRateLimit = await checkRateLimit(
      `ans_team:${teamId}`,
      RATE_LIMIT_CONFIG.ANSWER_PER_TEAM.max,
      RATE_LIMIT_CONFIG.ANSWER_PER_TEAM.windowSeconds
    );
    if (teamRateLimit) {
      return teamRateLimit;
    }

    const ipRateLimit = await checkRateLimit(
      `ans_ip:${ip}`,
      RATE_LIMIT_CONFIG.ANSWER_PER_IP.max,
      RATE_LIMIT_CONFIG.ANSWER_PER_IP.windowSeconds
    );
    if (ipRateLimit) {
      return ipRateLimit;
    }

    // 3. Parse and validate payload
    const rawBody = await req.json().catch(() => null);
    const parsed = SubmitAnswerBodySchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { questionId, answer } = parsed.data;

    // 4. Validate that questionId belongs to valid questions
    const questionIndex = ORDER.indexOf(questionId as (typeof ORDER)[number]);
    if (questionIndex === -1) {
      return NextResponse.json(
        { error: "Invalid question identifier" },
        { status: 400 }
      );
    }

    const roomIndex = Math.floor(questionIndex / 4);
    const room = GAME_CONTENT.rooms[roomIndex];
    const question = room?.questions.find((q) => q.id === questionId);

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    const supabase = getServerClient();

    // Verify global game state is actively running
    const { data: gameState } = await supabase
      .from("game_state")
      .select("status")
      .eq("id", 1)
      .single();

    if (gameState?.status !== "running") {
      return NextResponse.json(
        {
          error: `Submissions rejected: system is ${gameState?.status ?? "offline"}`,
          isPaused: gameState?.status === "paused",
        },
        { status: 409 }
      );
    }

    // 5. Squad Co-op Turn Verification (Rounds 1–4 & Round 5 Distributed Objectives)
    const [teamRes, membersRes] = await Promise.all([
      supabase
        .from("teams")
        .select("progress, lobby_ready, finished_at, started_at, current_round_started_at")
        .eq("id", teamId)
        .single(),
      supabase
        .from("team_members")
        .select("id, member_index, name, assigned_round, round5_question_id, round5_submitted")
        .eq("team_id", teamId),
    ]);

    const teamData = teamRes.data;

    // Hard-lock: If squad has already finished, reject any attempt to submit answers
    if (teamData?.finished_at || (teamData?.progress ?? 0) >= 20) {
      return NextResponse.json(
        {
          error: "INVESTIGATION CONCLUDED: All 20 directives are finalized. No further submissions are accepted.",
          finished: true,
        },
        { status: 403 }
      );
    }

    const members = membersRes.data ?? [];
    const currentMember =
      members.find((m) => m.id === currentMemberId) ??
      members.find((m) => m.member_index === 1);

    const currentRound = Math.min(5, Math.floor((teamData?.progress ?? 0) / 4) + 1);

    if (members.length === 4 && currentMember) {
      // In Rounds 1..4: verify it is this player's assigned turn
      if (currentRound < 5) {
        if (currentMember.assigned_round !== currentRound) {
          const scheduled = members.find((m) => m.assigned_round === currentRound);
          return NextResponse.json(
            {
              error: `THIS IS NOT YOUR TURN. ACTIVE OPERATOR: ${scheduled?.name ?? "Assigned Agent"}`,
              notYourTurn: true,
              activeOperator: scheduled?.name ?? "Assigned Agent",
            },
            { status: 403 }
          );
        }
      }

      // In Round 5: verify player is submitting their designated objective
      if (currentRound === 5) {
        if (questionId !== currentMember.round5_question_id) {
          return NextResponse.json(
            {
              error: `ACCESS RESTRICTED: You are assigned Objective ${currentMember.round5_question_id}`,
              wrongObjective: true,
              assignedObjective: currentMember.round5_question_id,
            },
            { status: 403 }
          );
        }
      }
    }

    // 6. Evaluate answer correctness on the server
    const { correct: isCorrect } = checkAnswer(questionId, answer);

    // Special handling for Round 5 distributed co-op
    if (currentRound === 5 && members.length === 4 && currentMember) {
      // Log attempt
      await supabase.from("attempts").insert({
        team_id: teamId,
        question_id: questionId,
        answer_given: answer,
        is_correct: isCorrect,
      });

      if (!isCorrect) {
        return NextResponse.json(
          {
            correct: false,
            feedback: question.wrongFeedback,
          },
          { status: 200 }
        );
      }

      // Mark this member's objective as submitted & correct
      await supabase
        .from("team_members")
        .update({
          round5_submitted: true,
          round5_answer_correct: true,
        })
        .eq("id", currentMember.id);

      // Check how many other members have already submitted
      const otherSubmittedCount = members.filter(
        (m) => m.id !== currentMember.id && m.round5_submitted
      ).length;

      const totalSubmitted = otherSubmittedCount + 1;
      const isLastSubmitter = totalSubmitted === 4;

      if (isLastSubmitter) {
        // All 4 objectives secured! Finalize the competition for this team
        const nowIso = new Date().toISOString();

        // Compute Round 5 duration with time debt inherited from Round 4
        const r5StartMs = teamData?.current_round_started_at
          ? new Date(teamData.current_round_started_at).getTime()
          : Date.now();
        const r5Elapsed = Math.max(0, Math.floor((Date.now() - r5StartMs) / 1000));
        const r5Actual = Math.min(r5Elapsed, 600);

        await supabase.from("attempts").insert({
          team_id: teamId,
          question_id: "ROUND_5_RECORD",
          answer_given: JSON.stringify({
            round: 5,
            durationSeconds: r5Actual,
            debtSeconds: 0,
            effectiveBudgetSeconds: 600,
          }),
          is_correct: true,
        });

        await supabase
          .from("teams")
          .update({
            progress: 20,
            finished_at: nowIso,
            started_at: teamData?.started_at ?? nowIso,
          })
          .eq("id", teamId);

        return NextResponse.json({
          correct: true,
          finished: true,
          newProgress: 20,
          revealText: question.revealAfterCorrect ?? null,
          isLastSubmitter: true,
          allObjectivesComplete: true,
        });
      }

      // 1st, 2nd, or 3rd member submitted
      return NextResponse.json({
        correct: true,
        finished: false,
        revealText: question.revealAfterCorrect ?? null,
        isLastSubmitter: false,
        submittedCount: totalSubmitted,
        waitingForTeammates: true,
      });
    }

    // 7. Standard/Legacy RPC execution for Rounds 1–4
    let { data, error } = await supabase.rpc("submit_answer", {
      p_team_id: teamId,
      p_question_id: questionId,
      p_answer_given: answer,
      p_is_correct: isCorrect,
    });

    let result = data as RpcResponse;

    // If game was still waiting but squad is lobby_ready, auto-activate running status and retry
    if (result && !result.success && result.error === "GAME_NOT_RUNNING" && teamData?.lobby_ready) {
      await supabase
        .from("game_state")
        .update({ status: "running", started_at: new Date().toISOString() })
        .eq("id", 1)
        .eq("status", "waiting");

      const retry = await supabase.rpc("submit_answer", {
        p_team_id: teamId,
        p_question_id: questionId,
        p_answer_given: answer,
        p_is_correct: isCorrect,
      });
      data = retry.data;
      error = retry.error;
      result = data as RpcResponse;
    }

    if (error) {
      return NextResponse.json(
        { error: "Database transaction failed", details: error.message },
        { status: 500 }
      );
    }

    if (!result || !result.success) {
      const errorCode = result?.error;
      const statusCode =
        errorCode === "TEAM_NOT_FOUND"
          ? 404
          : errorCode === "TEAM_DISQUALIFIED"
          ? 403
          : errorCode === "GAME_NOT_RUNNING"
          ? 409
          : 400;

      return NextResponse.json(
        { error: result?.message ?? "Submission rejected by system" },
        { status: statusCode }
      );
    }

    if (!isCorrect) {
      return NextResponse.json(
        {
          correct: false,
          feedback: question.wrongFeedback,
        },
        { status: 200 }
      );
    }

    // If this solved the 4th question of the round (e.g. 1.4, 2.4, 3.4, 4.4),
    // record round duration with overtime/time debt, and reset current_round_started_at
    // to null so the next round's operator gets description reading time!
    const newProgress = result.progress ?? 0;
    if (newProgress % 4 === 0 && newProgress > 0 && newProgress < 20) {
      const completedRound = newProgress / 4;
      const roundStartMs = teamData?.current_round_started_at
        ? new Date(teamData.current_round_started_at).getTime()
        : Date.now();
      const elapsedSec = Math.max(0, Math.floor((Date.now() - roundStartMs) / 1000));

      const actualDuration = Math.min(elapsedSec, 600);

      await supabase.from("attempts").insert({
        team_id: teamId,
        question_id: `ROUND_${completedRound}_RECORD`,
        answer_given: JSON.stringify({
          round: completedRound,
          durationSeconds: actualDuration,
          debtSeconds: 0,
          effectiveBudgetSeconds: 600,
        }),
        is_correct: true,
      });

      await supabase
        .from("teams")
        .update({ current_round_started_at: null })
        .eq("id", teamId);
    }

    return NextResponse.json(
      {
        correct: true,
        newProgress: result.progress,
        finished: result.finished ?? false,
        revealText: question.revealAfterCorrect ?? null,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: "Failed to process answer submission", details: message }, { status: 500 });
  }
}

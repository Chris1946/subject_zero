import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import {
  getCurrentQuestion,
  getUnlockedStory,
  getCaseFileDossier,
  ORDER,
} from "@/lib/game/engine.server";
import { GAME_CONTENT } from "@/lib/game/content.server";
import { readFullTeamSession, UnauthorizedError } from "@/lib/session.server";
import { checkRateLimit, getClientIp, RATE_LIMIT_CONFIG } from "@/lib/rate-limits";
import { computeRoundDurations, sumRoundDurations, formatDurationMmSs, RoundBreakdown } from "@/lib/game/admin-utils";
import { MASTER_ANSWER_KEY } from "@/lib/game/answers.server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // 1. Check state rate limit per IP
    const ip = getClientIp(req);
    const rateLimitResponse = await checkRateLimit(
      `state_ip:${ip}`,
      RATE_LIMIT_CONFIG.STATE_PER_IP.max,
      RATE_LIMIT_CONFIG.STATE_PER_IP.windowSeconds
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 2. Authenticate team session via signed cookie
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

    const supabase = getServerClient();
    const serverTime = new Date().toISOString();

    // 3. Fetch global game status, team records, and squad members in parallel
    let gameRes = await supabase
      .from("game_state")
      .select("status, started_at, paused_at, paused_total_seconds, tools_enabled")
      .eq("id", 1)
      .single();

    if (gameRes.error && (gameRes.error.code === "42703" || gameRes.error.message?.includes("tools_enabled"))) {
      gameRes = await supabase
        .from("game_state")
        .select("status, started_at, paused_at, paused_total_seconds")
        .eq("id", 1)
        .single();
    }

    const [teamRes, membersRes] = await Promise.all([
      supabase
        .from("teams")
        .select("id, name, join_code, progress, disqualified, started_at, finished_at, round_duration_seconds, current_round_started_at, lobby_ready")
        .eq("id", teamId)
        .single(),
      supabase
        .from("team_members")
        .select("id, member_index, name, email, assigned_round, round5_question_id, round5_submitted, round5_answer_correct, is_connected")
        .eq("team_id", teamId)
        .order("member_index", { ascending: true }),
    ]);

    if (teamRes.error || !teamRes.data) {
      return NextResponse.json(
        { error: "Team record not found" },
        { status: 404 }
      );
    }

    const team = teamRes.data;
    const gameStatus = gameRes.data?.status ?? "waiting";
    const gameStartedAt = gameRes.data?.started_at ?? null;
    const basePausedTotalSeconds = gameRes.data?.paused_total_seconds ?? 0;
    const pausedAtMs = gameRes.data?.paused_at ? new Date(gameRes.data.paused_at).getTime() : null;
    const isPaused = gameStatus === "paused";
    let currentPauseDuration = 0;
    if (isPaused && pausedAtMs) {
      currentPauseDuration = Math.max(0, Math.floor((Date.now() - pausedAtMs) / 1000));
    }
    const pausedTotalSeconds = basePausedTotalSeconds + currentPauseDuration;
    const toolsEnabled = gameRes.data?.tools_enabled !== false;
    const members = membersRes.data ?? [];

    if (team.disqualified) {
      return NextResponse.json(
        {
          error: "Team is disqualified from competition",
          disqualified: true,
          gameStatus,
          gameStartedAt,
          pausedTotalSeconds,
          serverTime,
          teamId: team.id,
          teamName: team.name,
        },
        { status: 403 }
      );
    }

    // Identify current squad member
    const currentMember =
      members.find((m) => m.id === currentMemberId) ??
      members.find((m) => m.member_index === 1) ??
      null;

    // Check if team is still in lobby
    const inLobby = !team.lobby_ready;

    let progress = team.progress;
    let finished = team.finished_at !== null || progress >= ORDER.length;

    let currentRound = Math.min(5, Math.floor(progress / 4) + 1);
    const roundDuration = team.round_duration_seconds || 600; // 10 mins default (600s)

    const baseRoundBudget = roundDuration; // 600s (10 minutes strict allocation)
    const effectiveBudget = baseRoundBudget; // Each round has a strict 10-minute budget

    const roundStarted = Boolean(team.current_round_started_at);
    const roundStartedAt = team.current_round_started_at
      ? new Date(team.current_round_started_at).getTime()
      : null;

    let roundRemainingSeconds = effectiveBudget;
    const isOvertime = false;
    const overtimeSeconds = 0;

    if (roundStartedAt) {
      const rawElapsedSeconds = Math.max(0, Math.floor((Date.now() - roundStartedAt) / 1000));
      // Deduct ongoing pause time so the round timer is frozen during pause
      const effectiveElapsed = Math.max(0, rawElapsedSeconds - currentPauseDuration);

      if (effectiveElapsed < effectiveBudget) {
        roundRemainingSeconds = Math.max(0, effectiveBudget - effectiveElapsed);
      } else {
        roundRemainingSeconds = 0;
      }

      // Check for round expiration (strict 10-minute cutoff: auto-pass to next operative)
      if (
        effectiveElapsed >= effectiveBudget &&
        gameStatus === "running" &&
        team.lobby_ready &&
        !finished
      ) {
        const nowIso = new Date().toISOString();
        if (currentRound < 5) {
          const nextProgress = currentRound * 4;

          // Record round timeout (duration = 600s, debt = 0)
          await supabase.from("attempts").insert({
            team_id: team.id,
            question_id: `ROUND_${currentRound}_RECORD`,
            answer_given: JSON.stringify({
              round: currentRound,
              durationSeconds: effectiveBudget,
              debtSeconds: 0,
              effectiveBudgetSeconds: effectiveBudget,
            }),
            is_correct: true,
          });

          await supabase
            .from("teams")
            .update({
              progress: nextProgress,
              current_round_started_at: null, // Allow next operator to read description first!
            })
            .eq("id", teamId);

          progress = nextProgress;
          currentRound = Math.min(5, Math.floor(progress / 4) + 1);
          roundRemainingSeconds = effectiveBudget;
        } else if (currentRound === 5) {
          // Round 5 timeout concludes the game
          await supabase.from("attempts").insert({
            team_id: team.id,
            question_id: "ROUND_5_RECORD",
            answer_given: JSON.stringify({
              round: 5,
              durationSeconds: effectiveBudget,
              debtSeconds: 0,
              effectiveBudgetSeconds: effectiveBudget,
            }),
            is_correct: true,
          });

          await supabase
            .from("teams")
            .update({
              finished_at: nowIso,
            })
            .eq("id", teamId);

          finished = true;
          roundRemainingSeconds = 0;
        }
      }
    }

    // Determine active scheduled operator for Rounds 1..4
    const activeOperator = members.find((m) => m.assigned_round === currentRound);

    // Turn check: In Round 5 all members can play; in 1..4 only assigned operator
    let isMyTurn = true;
    if (currentRound < 5 && members.length > 0) {
      isMyTurn = currentMember ? currentMember.assigned_round === currentRound : true;
    }

    // Round 5 distributed question details
    const round5Objective = currentMember?.round5_question_id ?? "5.1";
    const round5Submitted = currentMember?.round5_submitted ?? false;
    const round5SubmittedCount = members.filter((m) => m.round5_submitted).length;
    const allRound5Submitted = round5SubmittedCount === 4;

    // Conclude game immediately when all 4 squad members have finished Round 5
    if (allRound5Submitted && !finished) {
      finished = true;
      const nowIso = new Date().toISOString();
      await supabase
        .from("teams")
        .update({
          progress: 20,
          finished_at: nowIso,
          started_at: team.started_at ?? nowIso,
        })
        .eq("id", team.id);
      team.finished_at = nowIso;
      team.progress = 20;
      progress = 20;
    }

    // Freeze round countdown timer at official finish time once concluded
    if (finished && team.finished_at && roundStartedAt) {
      const finishTime = new Date(team.finished_at).getTime();
      const elapsedSeconds = Math.max(0, Math.floor((finishTime - roundStartedAt) / 1000));
      roundRemainingSeconds = Math.max(0, roundDuration - elapsedSeconds);
    }

    // If game is waiting, sanitize story to prevent leaks
    if (gameStatus === "waiting") {
      return NextResponse.json({
        gameStatus: "waiting",
        gameStartedAt,
        pausedTotalSeconds,
        serverTime,
        teamId: team.id,
        teamName: team.name,
        joinCode: team.join_code,
        progress,
        currentQuestion: null,
        unlockedStory: null,
        finished,
        inLobby,
        toolsEnabled,
        currentRound,
        activeOperator: activeOperator ? { name: activeOperator.name, round: currentRound } : null,
        isMyTurn,
        roundRemainingSeconds,
        currentMember,
        members,
      });
    }

    // Retrieve unlocked narrative, case file dossier, and current question
    const unlockedStory = getUnlockedStory(progress);
    // Case file dossier is strictly for the active assigned player; non-assigned members do not receive it
    const caseFile = isMyTurn ? getCaseFileDossier(progress) : null;
    let currentQuestion = getCurrentQuestion(progress, toolsEnabled);

    // If in Round 5, ensure player gets their specific assigned question details
    if (currentRound === 5 && !finished) {
      const room5 = GAME_CONTENT.rooms[4];
      const assignedQ = room5.questions.find((q) => q.id === round5Objective);
      if (assignedQ) {
        const qIdx = ORDER.indexOf(assignedQ.id as (typeof ORDER)[number]);
        currentQuestion = {
          id: assignedQ.id,
          title: assignedQ.title,
          prompt: assignedQ.prompt,
          answerFormatHint: assignedQ.answerFormatHint,
          room: {
            id: room5.id,
            location: room5.location,
            connectionStatus: room5.connectionStatus,
          },
          index: qIdx >= 0 ? qIdx + 1 : 17,
          total: ORDER.length,
        };
      }
    }

    let roundBreakdown: RoundBreakdown[] = [];
    let totalDurationFormatted: string | null = null;

    if (finished && team.started_at) {
      const { data: correctAttempts } = await supabase
        .from("attempts")
        .select("question_id, created_at")
        .eq("team_id", team.id)
        .eq("is_correct", true);

      roundBreakdown = computeRoundDurations(
        team.started_at,
        team.finished_at,
        correctAttempts || [],
        roundDuration
      );

      if (team.finished_at) {
        const totalSecs = sumRoundDurations(roundBreakdown);
        totalDurationFormatted = formatDurationMmSs(totalSecs);
      }
    }

    // Recovered Answers Log for Standby Hub (All solved questions up to progress)
    const recoveredAnswers: Array<{
      questionId: string;
      roundNumber: number;
      questionIndexInRound: number;
      title: string;
      answer: string;
      revealText?: string;
    }> = [];

    const totalSolved = Math.min(progress, ORDER.length);
    for (let p = 0; p < totalSolved; p++) {
      const qId = ORDER[p];
      const rIdx = Math.floor(p / 4);
      const room = GAME_CONTENT.rooms[rIdx];
      const q = room?.questions.find((item) => item.id === qId);
      recoveredAnswers.push({
        questionId: qId,
        roundNumber: rIdx + 1,
        questionIndexInRound: (p % 4) + 1,
        title: q?.title ?? `Question ${qId}`,
        answer: MASTER_ANSWER_KEY[qId] ?? "",
        revealText: q?.revealAfterCorrect,
      });
    }

    // Round 5 Gate Authorizations (4 unique clicks required to enter Round 5)
    let round5ReadyMemberIds: string[] = [];
    if (progress >= 16) {
      const { data: gateAttempts } = await supabase
        .from("attempts")
        .select("answer_given")
        .eq("team_id", team.id)
        .eq("question_id", "GATE_5_READY");

      if (gateAttempts) {
        round5ReadyMemberIds = Array.from(new Set(gateAttempts.map((g) => g.answer_given)));
      }
    }
    const round5Authorized = round5ReadyMemberIds.length >= 4;

    return NextResponse.json({
      gameStatus,
      gameStartedAt,
      pausedTotalSeconds,
      serverTime,
      teamId: team.id,
      teamName: team.name,
      joinCode: team.join_code,
      progress,
      finished,
      teamStartedAt: team.started_at,
      teamFinishedAt: team.finished_at,
      currentQuestion,
      unlockedStory,
      caseFile,
      toolsEnabled,
      roundBreakdown,
      totalDurationFormatted,
      recoveredAnswers,
      round5ReadyMemberIds,
      round5Authorized,
      // Squad Co-op metadata
      inLobby,
      currentRound,
      roundStarted,
      roundRemainingSeconds,
      roundDurationSeconds: roundDuration,
      roundEffectiveBudgetSeconds: effectiveBudget,
      roundIncomingDebtSeconds: 0,
      isOvertime,
      overtimeSeconds,
      maxOvertimeSeconds: 0,
      activeOperator: activeOperator
        ? { id: activeOperator.id, name: activeOperator.name, round: currentRound }
        : null,
      isMyTurn,
      currentMember,
      members,
      // Round 5 specifics
      round5Objective,
      round5Submitted,
      round5SubmittedCount,
      allRound5Submitted,
      canEndGame: (round5SubmittedCount === 3 && !round5Submitted) || allRound5Submitted,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: "Failed to fetch game state", details: message }, { status: 500 });
  }
}

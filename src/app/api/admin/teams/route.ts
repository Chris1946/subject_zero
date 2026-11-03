import { NextResponse } from "next/server";
import { requireAdmin, UnauthorizedError } from "@/lib/session.server";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    try {
      await requireAdmin();
    } catch (authErr) {
      if (authErr instanceof UnauthorizedError) {
        return NextResponse.json({ error: authErr.message }, { status: 401 });
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getServerClient();

    const [teamsRes, attemptsRes, membersRes] = await Promise.all([
      supabase
        .from("teams")
        .select("id, name, join_code, progress, attempts, started_at, finished_at, disqualified, created_at, lobby_ready")
        .order("progress", { ascending: false })
        .order("attempts", { ascending: true }),
      supabase
        .from("attempts")
        .select("team_id, question_id, is_correct, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("team_members")
        .select("id, team_id, member_index, name, email, is_connected, assigned_round, round5_submitted")
        .order("member_index", { ascending: true }),
    ]);

    if (teamsRes.error) {
      return NextResponse.json(
        { error: "Failed to fetch teams", details: teamsRes.error.message },
        { status: 500 }
      );
    }

    const lastAttemptMap = new Map<string, string>();
    const wrongAttemptsByTeamAndQuestion = new Map<string, number>();
    const membersByTeam = new Map<
      string,
      Array<{
        id: string;
        team_id: string;
        member_index: number;
        name: string;
        email: string;
        is_connected: boolean;
        assigned_round: number;
        round5_submitted: boolean;
      }>
    >();

    for (const m of membersRes.data || []) {
      const arr = membersByTeam.get(m.team_id) || [];
      arr.push(m);
      membersByTeam.set(m.team_id, arr);
    }

    for (const att of attemptsRes.data || []) {
      if (!lastAttemptMap.has(att.team_id)) {
        lastAttemptMap.set(att.team_id, att.created_at);
      }
      if (!att.is_correct) {
        const key = `${att.team_id}:${att.question_id}`;
        wrongAttemptsByTeamAndQuestion.set(
          key,
          (wrongAttemptsByTeamAndQuestion.get(key) || 0) + 1
        );
      }
    }

    const teams = (teamsRes.data || []).map((t) => {
      let currentQuestionWrongAttempts = 0;
      if (t.progress < 20) {
        const roomNum = Math.floor(t.progress / 4) + 1;
        const qNum = (t.progress % 4) + 1;
        const currentQId = `${roomNum}.${qNum}`;
        currentQuestionWrongAttempts =
          wrongAttemptsByTeamAndQuestion.get(`${t.id}:${currentQId}`) || 0;
      }

      return {
        id: t.id,
        name: t.name,
        join_code: t.join_code,
        progress: t.progress,
        attempts: t.attempts,
        started_at: t.started_at,
        finished_at: t.finished_at,
        disqualified: t.disqualified,
        created_at: t.created_at,
        last_attempt_at: lastAttemptMap.get(t.id) ?? null,
        current_question_wrong_attempts: currentQuestionWrongAttempts,
        lobby_ready: t.lobby_ready ?? false,
        members: membersByTeam.get(t.id) || [],
      };
    });

    return NextResponse.json({ teams }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: "Failed to retrieve teams list", details: message },
      { status: 500 }
    );
  }
}

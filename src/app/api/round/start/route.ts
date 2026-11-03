import { NextResponse } from "next/server";
import { readFullTeamSession } from "@/lib/session.server";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await readFullTeamSession();
    if (!session?.teamId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getServerClient();

    // Verify game status is actively running
    const { data: gameState } = await supabase
      .from("game_state")
      .select("status")
      .eq("id", 1)
      .single();

    if (gameState?.status !== "running") {
      return NextResponse.json(
        { error: `Cannot start round: investigation is ${gameState?.status ?? "offline"}` },
        { status: 409 }
      );
    }

    // Fetch team and members
    const [teamRes, membersRes] = await Promise.all([
      supabase
        .from("teams")
        .select("id, progress, current_round_started_at, lobby_ready, finished_at")
        .eq("id", session.teamId)
        .single(),
      supabase
        .from("team_members")
        .select("id, member_index, assigned_round")
        .eq("team_id", session.teamId),
    ]);

    const team = teamRes.data;
    if (!team || team.finished_at || !team.lobby_ready) {
      return NextResponse.json({ error: "Invalid squad state" }, { status: 400 });
    }

    // Determine current round
    const currentRound = Math.min(5, Math.floor((team.progress ?? 0) / 4) + 1);
    const members = membersRes.data ?? [];
    const currentMember =
      members.find((m) => m.id === session.memberId) ??
      members.find((m) => m.member_index === (session.memberIndex ?? 1)) ??
      null;

    // Verify turn: in Rounds 1..4, ONLY the playing user can start the round timer
    if (currentRound < 5 && members.length > 0 && currentMember) {
      if (currentMember.assigned_round !== currentRound) {
        return NextResponse.json(
          { error: "Access restricted: only the active assigned operator can start the round timer." },
          { status: 403 }
        );
      }
    }

    // If timer has not started yet for this round, activate it!
    if (!team.current_round_started_at) {
      const nowIso = new Date().toISOString();
      await supabase
        .from("teams")
        .update({ current_round_started_at: nowIso })
        .eq("id", session.teamId);

      return NextResponse.json({ success: true, startedAt: nowIso, currentRound });
    }

    return NextResponse.json({
      success: true,
      startedAt: team.current_round_started_at,
      currentRound,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: "Failed to start round", details: message }, { status: 500 });
  }
}

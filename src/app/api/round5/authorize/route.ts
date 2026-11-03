import { NextResponse } from "next/server";
import { readFullTeamSession, UnauthorizedError } from "@/lib/session.server";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    let teamId: string;
    let memberId: string | undefined;

    try {
      const session = await readFullTeamSession();
      if (!session || !session.teamId || !session.memberId) {
        throw new UnauthorizedError("Session missing or invalid member");
      }
      teamId = session.teamId;
      memberId = session.memberId;
    } catch (authErr) {
      if (authErr instanceof UnauthorizedError) {
        return NextResponse.json({ error: authErr.message }, { status: 401 });
      }
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    const supabase = getServerClient();

    // Verify game status is running
    const { data: gameState } = await supabase
      .from("game_state")
      .select("status")
      .eq("id", 1)
      .single();

    if (gameState?.status !== "running") {
      return NextResponse.json(
        { error: `Cannot authorize: investigation is ${gameState?.status ?? "offline"}` },
        { status: 409 }
      );
    }

    // Verify team is at Round 5 boundary (progress >= 16)
    const { data: team, error: teamErr } = await supabase
      .from("teams")
      .select("id, progress, finished_at")
      .eq("id", teamId)
      .single();

    if (teamErr || !team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    if (team.progress < 16) {
      return NextResponse.json(
        { error: "Cannot authorize Round 5: Round 4 has not been completed yet" },
        { status: 400 }
      );
    }

    if (team.finished_at) {
      return NextResponse.json(
        { error: "Investigation has already concluded" },
        { status: 400 }
      );
    }

    // Query existing authorizations for this team
    const { data: existingAttempts } = await supabase
      .from("attempts")
      .select("answer_given")
      .eq("team_id", teamId)
      .eq("question_id", "GATE_5_READY");

    const existingMemberIds = new Set(
      (existingAttempts || []).map((a) => a.answer_given)
    );

    // If this member already authorized, don't re-insert, just return status
    if (!existingMemberIds.has(memberId)) {
      await supabase.from("attempts").insert({
        team_id: teamId,
        question_id: "GATE_5_READY",
        answer_given: memberId,
        is_correct: true,
      });
      existingMemberIds.add(memberId);
    }

    const readyCount = existingMemberIds.size;
    const allAuthorized = readyCount >= 4;

    return NextResponse.json({
      success: true,
      memberId,
      readyCount,
      allAuthorized,
      readyMemberIds: Array.from(existingMemberIds),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: "Failed to process authorization", details: message },
      { status: 500 }
    );
  }
}

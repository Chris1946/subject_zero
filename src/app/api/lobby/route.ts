import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server";
import { requireTeamMember, UnauthorizedError } from "@/lib/session.server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let teamId: string;
    let currentMemberId: string | undefined;

    try {
      const session = await requireTeamMember();
      teamId = session.teamId;
      currentMemberId = session.memberId;
    } catch (authErr) {
      if (authErr instanceof UnauthorizedError) {
        return NextResponse.json({ error: authErr.message }, { status: 401 });
      }
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
    }

    const supabase = getServerClient();

    // Fetch team and global game state
    const [teamRes, gameRes, membersRes] = await Promise.all([
      supabase
        .from("teams")
        .select("id, name, join_code, progress, lobby_ready, disqualified, started_at, round_duration_seconds")
        .eq("id", teamId)
        .single(),
      supabase
        .from("game_state")
        .select("status, started_at")
        .eq("id", 1)
        .single(),
      supabase
        .from("team_members")
        .select("id, member_index, name, email, assigned_round, round5_question_id, is_connected, last_seen_at")
        .eq("team_id", teamId)
        .order("member_index", { ascending: true }),
    ]);

    if (teamRes.error || !teamRes.data) {
      return NextResponse.json({ error: "Squad not found" }, { status: 404 });
    }

    const team = teamRes.data;
    const globalStatus = gameRes.data?.status ?? "waiting";
    const members = membersRes.data ?? [];

    const connectedCount = members.filter((m) => m.is_connected).length;
    const allConnected = members.length === 4 && connectedCount === 4;

    // Check if rounds 1, 2, 3, 4 are uniquely assigned
    const assignedRounds = members.map((m) => m.assigned_round).filter(Boolean);
    const uniqueRounds = new Set(assignedRounds);
    const allAssigned = uniqueRounds.size === 4 && [1, 2, 3, 4].every((r) => uniqueRounds.has(r));

    const canStart = allConnected && allAssigned;
    const currentMember = members.find((m) => m.id === currentMemberId) ?? members[0];

    return NextResponse.json({
      teamId: team.id,
      teamName: team.name,
      joinCode: team.join_code,
      lobbyReady: team.lobby_ready,
      globalStatus,
      allConnected,
      allAssigned,
      canStart,
      connectedCount,
      totalCount: members.length || 4,
      roundDurationSeconds: team.round_duration_seconds || 600,
      currentMember,
      members,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: "Failed to fetch lobby data", details: message }, { status: 500 });
  }
}

const AssignRoundsSchema = z.object({
  assignments: z.array(
    z.object({
      memberId: z.string().uuid(),
      assignedRound: z.number().int().min(1).max(4).nullable(),
    })
  ),
});

// PATCH /api/lobby -> Updates round assignments (1..4)
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireTeamMember();
    const supabase = getServerClient();

    const body = await req.json().catch(() => null);
    const parsed = AssignRoundsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid round assignments" }, { status: 400 });
    }

    const { assignments } = parsed.data;

    // Check for collisions among non-null rounds
    const nonNullRounds = assignments
      .map((a) => a.assignedRound)
      .filter((r): r is number => r !== null);
    const uniqueRounds = new Set(nonNullRounds);
    if (uniqueRounds.size !== nonNullRounds.length) {
      return NextResponse.json(
        { error: "Collision detected: Two agents cannot select the same round." },
        { status: 400 }
      );
    }

    // Update each member
    for (const item of assignments) {
      await supabase
        .from("team_members")
        .update({ assigned_round: item.assignedRound })
        .eq("id", item.memberId)
        .eq("team_id", session.teamId);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: "Failed to update assignments", details: message }, { status: 500 });
  }
}

// POST /api/lobby -> Starts game when all 4 are joined (idempotent / first-click-wins)
export async function POST() {
  try {
    const session = await requireTeamMember();
    const supabase = getServerClient();

    // 1. Fast check: If the squad is already marked lobby_ready, return success immediately
    const { data: existingTeam } = await supabase
      .from("teams")
      .select("id, lobby_ready, started_at")
      .eq("id", session.teamId)
      .single();

    if (existingTeam?.lobby_ready) {
      return NextResponse.json({
        success: true,
        alreadyStarted: true,
        startedAt: existingTeam.started_at,
      });
    }

    // 2. Verify all 4 are connected
    const { data: members } = await supabase
      .from("team_members")
      .select("id, is_connected, assigned_round, member_index")
      .eq("team_id", session.teamId);

    if (!members || members.length !== 4 || !members.every((m) => m.is_connected)) {
      return NextResponse.json(
        { error: "Cannot launch investigation: All 4 squad members must be connected." },
        { status: 400 }
      );
    }

    // Ensure every member has their assigned round (defaults to member_index 1..4)
    for (const m of members) {
      if (!m.assigned_round) {
        await supabase
          .from("team_members")
          .update({ assigned_round: m.member_index })
          .eq("id", m.id);
        m.assigned_round = m.member_index;
      }
    }

    const assignedRounds = new Set(members.map((m) => m.assigned_round || m.member_index));
    if (assignedRounds.size !== 4) {
      return NextResponse.json(
        { error: "Cannot launch: Each member must be assigned a distinct round (1–4)." },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();

    // 3. Atomic database update: Only update if lobby_ready is FALSE
    const { data: updatedTeam, error: teamError } = await supabase
      .from("teams")
      .update({
        lobby_ready: true,
        current_round_started_at: null,
        started_at: nowIso,
      })
      .eq("id", session.teamId)
      .eq("lobby_ready", false)
      .select("id, started_at");

    if (teamError) {
      return NextResponse.json({ error: "Failed to initialize squad game" }, { status: 500 });
    }

    // If 0 rows updated, a simultaneous click by a teammate already won the race
    if (!updatedTeam || updatedTeam.length === 0) {
      const { data: winningTeam } = await supabase
        .from("teams")
        .select("started_at")
        .eq("id", session.teamId)
        .single();

      return NextResponse.json({
        success: true,
        alreadyStarted: true,
        startedAt: winningTeam?.started_at || nowIso,
      });
    }

    // 4. Auto-transition global system to running if waiting or ended
    await supabase
      .from("game_state")
      .update({
        status: "running",
        started_at: nowIso,
      })
      .eq("id", 1)
      .in("status", ["waiting", "ended"]);

    return NextResponse.json({ success: true, startedAt: nowIso });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: "Failed to start squad game", details: message }, { status: 500 });
  }
}

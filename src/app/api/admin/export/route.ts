import { NextResponse } from "next/server";
import { requireAdmin, UnauthorizedError } from "@/lib/session.server";
import { getServerClient } from "@/lib/supabase/server";
import {
  escapeCsvCell,
  PublicTeamProgress,
  rankLeaderboardTeams,
} from "@/lib/game/admin-utils";

export const dynamic = "force-dynamic";

interface TeamExportRow {
  id: string;
  name: string;
  progress: number;
  attempts: number;
  finished_at: string | null;
  disqualified: boolean;
  duration_seconds: number | null;
}

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

    // Fetch game state, all teams, and squad members
    const [gameRes, teamsRes, membersRes] = await Promise.all([
      supabase
        .from("game_state")
        .select("started_at, paused_total_seconds")
        .eq("id", 1)
        .single(),
      supabase
        .from("teams")
        .select("id, name, join_code, progress, attempts, finished_at, disqualified"),
      supabase
        .from("team_members")
        .select("team_id, member_index, name, email")
        .order("member_index", { ascending: true }),
    ]);

    if (teamsRes.error || !teamsRes.data) {
      return NextResponse.json(
        { error: "Failed to fetch team records", details: teamsRes.error?.message },
        { status: 500 }
      );
    }

    const membersByTeam = new Map<string, Array<{ name: string; email: string }>>();
    for (const m of membersRes.data || []) {
      const arr = membersByTeam.get(m.team_id) || [];
      arr.push({ name: m.name, email: m.email });
      membersByTeam.set(m.team_id, arr);
    }

    const startedAt = gameRes.data?.started_at ? new Date(gameRes.data.started_at).getTime() : null;
    const pausedSeconds = gameRes.data?.paused_total_seconds || 0;

    const rawTeams: TeamExportRow[] = teamsRes.data.map((t) => {
      let durationSec: number | null = null;
      if (t.finished_at && startedAt) {
        const finishMs = new Date(t.finished_at).getTime();
        durationSec = Math.max(0, Math.floor((finishMs - startedAt) / 1000) - pausedSeconds);
      }
      return {
        id: t.id,
        name: t.name,
        progress: t.progress,
        attempts: t.attempts,
        finished_at: t.finished_at,
        disqualified: t.disqualified,
        duration_seconds: durationSec,
      };
    });

    // Qualified teams
    const qualifiedTeams = rawTeams.filter((t) => !t.disqualified);
    const disqualifiedTeams = rawTeams.filter((t) => t.disqualified);

    const { finishedTeams, inProgressTeams } = rankLeaderboardTeams(
      qualifiedTeams as PublicTeamProgress[]
    );

    // Build CSV lines
    const csvHeader = [
      "rank",
      "team",
      "join_code",
      "member_1",
      "member_2",
      "member_3",
      "member_4",
      "duration",
      "duration_seconds",
      "wrong_attempts",
      "finished_at",
      "disqualified",
    ];

    const lines: string[] = [csvHeader.join(",")];

    const formatMember = (m?: { name: string; email: string }) =>
      m ? `${m.name} (${m.email})` : "";

    // Finished ranked teams
    for (const f of finishedTeams) {
      const teamObj = teamsRes.data.find((t) => t.name === f.name);
      const mList = teamObj ? membersByTeam.get(teamObj.id) || [] : [];
      lines.push(
        [
          escapeCsvCell(f.rank),
          escapeCsvCell(f.name),
          escapeCsvCell(teamObj?.join_code || ""),
          escapeCsvCell(formatMember(mList[0])),
          escapeCsvCell(formatMember(mList[1])),
          escapeCsvCell(formatMember(mList[2])),
          escapeCsvCell(formatMember(mList[3])),
          escapeCsvCell(f.formattedTime),
          escapeCsvCell(f.duration_seconds),
          escapeCsvCell(f.attempts),
          escapeCsvCell(f.finished_at),
          escapeCsvCell(false),
        ].join(",")
      );
    }

    // In-progress teams
    for (const p of inProgressTeams) {
      const teamObj = teamsRes.data.find((t) => t.name === p.name);
      const mList = teamObj ? membersByTeam.get(teamObj.id) || [] : [];
      lines.push(
        [
          escapeCsvCell("-"),
          escapeCsvCell(p.name),
          escapeCsvCell(teamObj?.join_code || ""),
          escapeCsvCell(formatMember(mList[0])),
          escapeCsvCell(formatMember(mList[1])),
          escapeCsvCell(formatMember(mList[2])),
          escapeCsvCell(formatMember(mList[3])),
          escapeCsvCell(`IN PROGRESS (${p.progress}/20)`),
          escapeCsvCell(""),
          escapeCsvCell(p.attempts),
          escapeCsvCell(""),
          escapeCsvCell(false),
        ].join(",")
      );
    }

    // Disqualified teams
    for (const d of disqualifiedTeams) {
      const teamObj = teamsRes.data.find((t) => t.name === d.name);
      const mList = teamObj ? membersByTeam.get(teamObj.id) || [] : [];
      lines.push(
        [
          escapeCsvCell("DQ"),
          escapeCsvCell(d.name),
          escapeCsvCell(teamObj?.join_code || ""),
          escapeCsvCell(formatMember(mList[0])),
          escapeCsvCell(formatMember(mList[1])),
          escapeCsvCell(formatMember(mList[2])),
          escapeCsvCell(formatMember(mList[3])),
          escapeCsvCell("DISQUALIFIED"),
          escapeCsvCell(""),
          escapeCsvCell(d.attempts),
          escapeCsvCell(d.finished_at || ""),
          escapeCsvCell(true),
        ].join(",")
      );
    }

    // Audit log
    await supabase.from("admin_log").insert({
      action: "export_results",
      detail: { exportedRows: lines.length - 1 },
    });

    const csvContent = lines.join("\r\n");

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="subject-zero-results.csv"',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: "Failed to generate CSV export", details: message },
      { status: 500 }
    );
  }
}

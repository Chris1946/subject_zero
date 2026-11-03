import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, UnauthorizedError } from "@/lib/session.server";
import { getServerClient } from "@/lib/supabase/server";
import { generateJoinCode } from "@/lib/game/control.server";

export const dynamic = "force-dynamic";

const MemberSchema = z.object({
  name: z.string().trim().min(1, "Agent name is required").max(60),
  email: z.string().trim().email("Valid email required").toLowerCase(),
});

const SquadWithMembersSchema = z.object({
  teamName: z.string().trim().min(1, "Squad name is required").max(100),
  members: z.array(MemberSchema).min(1).max(4),
});

const SingleTeamSchema = z.object({
  name: z.string().trim().min(1, "Team name is required").max(100),
});

const BatchTeamsSchema = z.object({
  names: z.array(z.string().trim().min(1).max(100)).min(1).max(200),
});

export async function POST(req: NextRequest) {
  try {
    try {
      await requireAdmin();
    } catch (authErr) {
      if (authErr instanceof UnauthorizedError) {
        return NextResponse.json({ error: authErr.message }, { status: 401 });
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await req.json().catch(() => null);
    if (!rawBody) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const supabase = getServerClient();

    // 1. Squad with 4 Members Form: { teamName, members: [{ name, email }, ...] }
    const squadParse = SquadWithMembersSchema.safeParse(rawBody);
    if (squadParse.success) {
      const { teamName, members } = squadParse.data;

      // Generate unique 6-character code
      const { data: existingTeams } = await supabase.from("teams").select("join_code");
      const existingCodes = new Set((existingTeams || []).map((t: { join_code: string }) => t.join_code));

      let joinCode = generateJoinCode();
      while (existingCodes.has(joinCode)) {
        joinCode = generateJoinCode();
      }

      // Create team
      const { data: createdTeam, error: teamErr } = await supabase
        .from("teams")
        .insert({
          name: teamName.trim(),
          join_code: joinCode,
          progress: 0,
          attempts: 0,
          lobby_ready: false,
          round_duration_seconds: 600,
        })
        .select("id, name, join_code")
        .single();

      if (teamErr || !createdTeam) {
        const isDuplicateName =
          teamErr?.message?.includes("teams_name_key") ||
          teamErr?.message?.toLowerCase().includes("unique");
        return NextResponse.json(
          {
            error: isDuplicateName
              ? `Squad name "${teamName.trim()}" is already in use. Please choose a different name.`
              : "Failed to create squad in database",
            details: teamErr?.message,
          },
          { status: isDuplicateName ? 409 : 500 }
        );
      }

      // Create the squad members in team_members table
      const memberRows = members.map((m, idx) => ({
        team_id: createdTeam.id,
        member_index: idx + 1,
        name: m.name.trim(),
        email: m.email.trim().toLowerCase(),
        assigned_round: idx + 1,
        round5_question_id: `5.${idx + 1}`,
        is_connected: false,
      }));

      const { data: createdMembers, error: membersErr } = await supabase
        .from("team_members")
        .insert(memberRows)
        .select("id, member_index, name, email, assigned_round");

      if (membersErr) {
        // Rollback team creation to prevent orphaned team rows without members
        await supabase.from("teams").delete().eq("id", createdTeam.id);
        const isDuplicateEmail =
          membersErr.message.includes("uq_team_members_team_email") ||
          membersErr.message.toLowerCase().includes("unique");
        return NextResponse.json(
          {
            error: isDuplicateEmail
              ? "Duplicate email detected within squad roster. Each operative must have a unique email."
              : "Failed to provision squad roster",
            details: membersErr.message,
          },
          { status: isDuplicateEmail ? 400 : 500 }
        );
      }

      await supabase.from("admin_log").insert({
        action: "squad_provisioned",
        detail: { teamId: createdTeam.id, teamName: createdTeam.name, joinCode, memberCount: members.length },
      });

      return NextResponse.json(
        {
          success: true,
          team: {
            id: createdTeam.id,
            name: createdTeam.name,
            joinCode: createdTeam.join_code,
            members: createdMembers,
          },
        },
        { status: 201 }
      );
    }

    // 2. Batch Creation: { names: string[] }
    const batchParse = BatchTeamsSchema.safeParse(rawBody);
    if (batchParse.success) {
      const { names } = batchParse.data;
      const { data: existingTeams } = await supabase.from("teams").select("join_code");
      const existingCodes = new Set((existingTeams || []).map((t: { join_code: string }) => t.join_code));

      const newRows: Array<{
        name: string;
        join_code: string;
        progress: number;
        attempts: number;
        lobby_ready: boolean;
        round_duration_seconds: number;
      }> = [];

      for (const rawName of names) {
        const cleanName = rawName.trim();
        if (!cleanName) continue;
        let code = generateJoinCode();
        while (existingCodes.has(code)) {
          code = generateJoinCode();
        }
        existingCodes.add(code);
        newRows.push({
          name: cleanName,
          join_code: code,
          progress: 0,
          attempts: 0,
          lobby_ready: false,
          round_duration_seconds: 600,
        });
      }

      const { data: created, error } = await supabase
        .from("teams")
        .insert(newRows)
        .select("id, name, join_code");

      if (error || !created) {
        return NextResponse.json(
          { error: "Failed to create teams in database", details: error?.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          teams: created.map((t: { id: string; name: string; join_code: string }) => ({
            id: t.id,
            name: t.name,
            joinCode: t.join_code,
          })),
        },
        { status: 201 }
      );
    }

    // 3. Simple Single Team: { name: string }
    const singleParse = SingleTeamSchema.safeParse(rawBody);
    if (singleParse.success) {
      const targetName = singleParse.data.name;

      const { data: existingTeams } = await supabase.from("teams").select("join_code");
      const existingCodes = new Set((existingTeams || []).map((t: { join_code: string }) => t.join_code));

      let joinCode = generateJoinCode();
      while (existingCodes.has(joinCode)) {
        joinCode = generateJoinCode();
      }

      const { data: createdTeam, error: teamErr } = await supabase
        .from("teams")
        .insert({
          name: targetName.trim(),
          join_code: joinCode,
          progress: 0,
          attempts: 0,
          lobby_ready: false,
          round_duration_seconds: 600,
        })
        .select("id, name, join_code")
        .single();

      if (teamErr || !createdTeam) {
        return NextResponse.json(
          { error: "Failed to create team", details: teamErr?.message },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          team: {
            id: createdTeam.id,
            name: createdTeam.name,
            joinCode: createdTeam.join_code,
          },
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { error: "Invalid squad payload. Required: teamName and members." },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: "Failed to process team creation", details: message },
      { status: 500 }
    );
  }
}

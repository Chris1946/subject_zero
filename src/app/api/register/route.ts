import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server";
import { generateJoinCode } from "@/lib/game/control.server";
import { createTeamSession } from "@/lib/session.server";
import { checkRateLimit, getClientIp, RATE_LIMIT_CONFIG } from "@/lib/rate-limits";

export const dynamic = "force-dynamic";

const MemberInputSchema = z.object({
  name: z.string().trim().min(1, "Agent name is required").max(50, "Name too long"),
  email: z.string().trim().email("Valid email is required").toLowerCase(),
});

const RegisterSquadSchema = z.object({
  teamName: z
    .string()
    .trim()
    .min(2, "Squad name must be at least 2 characters")
    .max(50, "Squad name too long"),
  members: z.array(MemberInputSchema).length(4, "Exactly 4 squad members are required"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // Rate limit registration requests using the join rate limit config
    const rateLimitResponse = await checkRateLimit(
      `join_ip:${ip}`,
      RATE_LIMIT_CONFIG.JOIN_PER_IP.max,
      RATE_LIMIT_CONFIG.JOIN_PER_IP.windowSeconds
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await req.json().catch(() => null);
    const parsed = RegisterSquadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid squad registration data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { teamName, members } = parsed.data;

    // Check for duplicate emails within the squad
    const emails = members.map((m) => m.email);
    const uniqueEmails = new Set(emails);
    if (uniqueEmails.size !== 4) {
      return NextResponse.json(
        { error: "Each squad member must have a distinct email address" },
        { status: 400 }
      );
    }

    const supabase = getServerClient();

    // Check if any email is already registered in an existing squad
    const { data: existingMembers } = await supabase
      .from("team_members")
      .select("email")
      .in("email", emails);

    if (existingMembers && existingMembers.length > 0) {
      const duplicateEmails = Array.from(
        new Set(existingMembers.map((m) => m.email))
      ).join(", ");
      return NextResponse.json(
        {
          error: `AGENT EMAIL ALREADY REGISTERED: ${duplicateEmails} is already registered in an existing squad. Each operative may only participate in one squad.`,
        },
        { status: 409 }
      );
    }

    // Check if team name already exists
    const { data: existingTeam } = await supabase
      .from("teams")
      .select("id")
      .ilike("name", teamName)
      .maybeSingle();

    if (existingTeam) {
      return NextResponse.json(
        { error: "A squad with this name already exists. Choose a unique name." },
        { status: 409 }
      );
    }

    // Generate unique 6-character join code
    let joinCode = generateJoinCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      const { data: codeCheck } = await supabase
        .from("teams")
        .select("id")
        .eq("join_code", joinCode)
        .maybeSingle();

      if (!codeCheck) {
        isUnique = true;
      } else {
        joinCode = generateJoinCode();
        attempts++;
      }
    }

    // Create the team
    const insertPayload: Record<string, unknown> = {
      name: teamName,
      join_code: joinCode,
      progress: 0,
      attempts: 0,
      round_duration_seconds: 600,
      lobby_ready: false,
    };

    let newTeamResult = await supabase
      .from("teams")
      .insert(insertPayload)
      .select("id, name, join_code")
      .single();

    // Fallback if migration 0007 hasn't added round_duration_seconds/lobby_ready yet
    if (newTeamResult.error && newTeamResult.error.message.includes("column")) {
      console.warn(
        "[REGISTER WARNING] squads columns missing in teams table. Retrying with basic columns. Please run migration 0007_squad_coop.sql!"
      );
      newTeamResult = await supabase
        .from("teams")
        .insert({
          name: teamName,
          join_code: joinCode,
          progress: 0,
          attempts: 0,
        })
        .select("id, name, join_code")
        .single();
    }

    const { data: newTeam, error: teamError } = newTeamResult;

    if (teamError || !newTeam) {
      console.error("[REGISTER ERROR] Failed to create team:", teamError);
      return NextResponse.json(
        {
          error: "Failed to create squad in database",
          details:
            teamError?.message.includes("relation") || teamError?.message.includes("column")
              ? "Database schema outdated. Please run supabase/migrations/0007_squad_coop.sql in Supabase SQL Editor."
              : teamError?.message,
        },
        { status: 500 }
      );
    }

    // Shuffle Round 5 questions randomly across the 4 members
    const round5Questions = ["5.1", "5.2", "5.3", "5.4"].sort(() => Math.random() - 0.5);

    // Prepare 4 squad member records: Agent 1 -> Round 1, Agent 2 -> Round 2, Agent 3 -> Round 3, Agent 4 -> Round 4
    const memberRows = members.map((m, idx) => ({
      team_id: newTeam.id,
      member_index: idx + 1,
      name: m.name,
      email: m.email,
      assigned_round: idx + 1,
      round5_question_id: round5Questions[idx],
      round5_submitted: false,
      round5_answer_correct: false,
      is_connected: idx === 0,
      last_seen_at: new Date().toISOString(),
    }));

    const { data: insertedMembers, error: membersError } = await supabase
      .from("team_members")
      .insert(memberRows)
      .select("id, member_index, name, email, assigned_round, round5_question_id, is_connected")
      .order("member_index", { ascending: true });

    if (membersError || !insertedMembers) {
      console.error("[REGISTER ERROR] Failed to create team_members:", membersError);
      // Rollback team creation if members insertion fails
      await supabase.from("teams").delete().eq("id", newTeam.id);
      return NextResponse.json(
        {
          error: "Failed to initialize squad members",
          details:
            membersError?.message.includes("relation") || membersError?.message.includes("does not exist")
              ? "Table 'team_members' missing. Please run supabase/migrations/0007_squad_coop.sql in Supabase SQL Editor."
              : membersError?.message,
        },
        { status: 500 }
      );
    }

    const member1 = insertedMembers[0];

    // Establish session cookie for Member 1
    await createTeamSession(newTeam.id, member1.id, 1);

    return NextResponse.json({
      success: true,
      teamId: newTeam.id,
      teamName: newTeam.name,
      joinCode: newTeam.join_code,
      currentMember: member1,
      members: insertedMembers,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

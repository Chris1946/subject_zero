import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server";
import { createTeamSession } from "@/lib/session.server";
import { checkRateLimit, getClientIp, RATE_LIMIT_CONFIG } from "@/lib/rate-limits";

export const dynamic = "force-dynamic";

const JoinBodySchema = z.object({
  joinCode: z.string().trim().min(1, "Join code is required").max(50, "Join code too long"),
  email: z.string().trim().min(1, "Email is required").email("Valid email required").optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);

    // 1. Check per-IP join rate limit
    const ipRateLimitResponse = await checkRateLimit(
      `join_ip:${ip}`,
      RATE_LIMIT_CONFIG.JOIN_PER_IP.max,
      RATE_LIMIT_CONFIG.JOIN_PER_IP.windowSeconds
    );
    if (ipRateLimitResponse) {
      return ipRateLimitResponse;
    }

    const supabase = getServerClient();

    // Helper to record failed join attempts against global limit
    const recordFailedAttempt = async () => {
      await supabase.rpc("hit_rate_limit", {
        p_key: "join_failures_global",
        p_max: RATE_LIMIT_CONFIG.JOIN_FAILURES_GLOBAL.max,
        p_window_seconds: RATE_LIMIT_CONFIG.JOIN_FAILURES_GLOBAL.windowSeconds,
      });
    };

    const rawBody = await req.json().catch(() => null);
    const parsed = JoinBodySchema.safeParse(rawBody);

    if (!parsed.success) {
      await recordFailedAttempt();
      return NextResponse.json({ error: "Invalid code or email format" }, { status: 400 });
    }

    const normalizedCode = parsed.data.joinCode.trim().toUpperCase();
    const providedEmail = parsed.data.email ? parsed.data.email.trim().toLowerCase() : null;

    // Look up the team
    const { data: team, error } = await supabase
      .from("teams")
      .select("id, name, disqualified, lobby_ready, finished_at, progress")
      .eq("join_code", normalizedCode)
      .single();

    if (error || !team) {
      await recordFailedAttempt();
      return NextResponse.json({ error: "INVALID SQUAD CODE. PLEASE VERIFY AND RETRY." }, { status: 401 });
    }

    if (team.disqualified) {
      return NextResponse.json(
        { error: "Squad is disqualified from competition", disqualified: true },
        { status: 403 }
      );
    }

    const isFinished = team.finished_at !== null || (team.progress ?? 0) >= 20;

    // Check registered squad members for this team
    const { data: members } = await supabase
      .from("team_members")
      .select("id, member_index, name, email, assigned_round, is_connected")
      .eq("team_id", team.id)
      .order("member_index", { ascending: true });

    // If squad has registered members (4-agent team), email verification is STRICTLY REQUIRED
    if (members && members.length > 0) {
      if (!providedEmail) {
        return NextResponse.json(
          { error: "AGENT EMAIL REQUIRED: Please enter the email registered with this squad code." },
          { status: 400 }
        );
      }

      // Check if provided email matches one of the squad members
      const matchedMember = members.find(
        (m) => m.email.toLowerCase() === providedEmail
      );

      if (!matchedMember) {
        await recordFailedAttempt();
        return NextResponse.json(
          {
            error: "ACCESS DENIED: This email address is not registered under squad code " + normalizedCode + ".",
          },
          { status: 403 }
        );
      }

      // If the squad has already finished the game, establish session and redirect straight to leaderboard
      if (isFinished) {
        await createTeamSession(team.id, matchedMember.id, matchedMember.member_index);
        return NextResponse.json({
          success: true,
          teamName: team.name,
          alreadyFinished: true,
          redirect: "/leaderboard",
          message: "SQUAD PROTOCOL CONCLUDED: Your squad record is already finalized. Redirecting to official leaderboard standings...",
        });
      }

      // Verified! Mark member connected
      await supabase
        .from("team_members")
        .update({ is_connected: true, last_seen_at: new Date().toISOString() })
        .eq("id", matchedMember.id);

      await createTeamSession(team.id, matchedMember.id, matchedMember.member_index);

      return NextResponse.json({
        success: true,
        teamName: team.name,
        currentMember: {
          id: matchedMember.id,
          name: matchedMember.name,
          email: matchedMember.email,
          member_index: matchedMember.member_index,
          assigned_round: matchedMember.assigned_round,
        },
        lobbyReady: team.lobby_ready,
      });
    }

    // Legacy fallback for teams created without member rosters
    await createTeamSession(team.id);
    if (isFinished) {
      return NextResponse.json({
        success: true,
        teamName: team.name,
        alreadyFinished: true,
        redirect: "/leaderboard",
      });
    }
    return NextResponse.json({ success: true, teamName: team.name }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: "Failed to process join request", details: message }, { status: 500 });
  }
}

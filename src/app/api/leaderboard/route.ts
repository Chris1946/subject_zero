import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { readTeamSession } from "@/lib/session.server";
import { checkRateLimit, getClientIp, RATE_LIMIT_CONFIG } from "@/lib/rate-limits";
import {
  shouldHideLeaderboard,
  rankLeaderboardTeams,
  formatDurationMmSs,
  computeRoundDurations,
  sumRoundDurations,
  LeaderboardResponse,
  PublicTeamProgress,
  MyTeamResult,
  RoundBreakdown,
} from "@/lib/game/admin-utils";

export const dynamic = "force-dynamic";

interface CacheEntry {
  timestamp: number;
  data: LeaderboardResponse;
}

let cachedLeaderboard: CacheEntry | null = null;
const CACHE_TTL_MS = 2000; // 2-second in-memory cache to absorb traffic bursts

export async function GET(req: NextRequest) {
  try {
    // 1. Rate limit per IP (600/min in onsite mode, 30/min in remote mode)
    const ip = getClientIp(req);
    const rateLimitResponse = await checkRateLimit(
      "leaderboard_ip:" + ip,
      RATE_LIMIT_CONFIG.LEADERBOARD_PER_IP.max,
      RATE_LIMIT_CONFIG.LEADERBOARD_PER_IP.windowSeconds
    );
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const now = Date.now();
    const teamId = await readTeamSession();

    // 2. Return cached response for unauthenticated visitors if within 2-second TTL
    if (!teamId && cachedLeaderboard && now - cachedLeaderboard.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cachedLeaderboard.data, {
        status: 200,
        headers: { "X-Cache": "HIT" },
      });
    }

    const supabase = getServerClient();

    // 3. Query game_state for visibility setting and current status
    const { data: gameState, error: gameErr } = await supabase
      .from("game_state")
      .select("status, leaderboard_visible, paused_at, paused_total_seconds")
      .eq("id", 1)
      .single();

    if (gameErr || !gameState) {
      return NextResponse.json(
        { error: "Failed to query system status" },
        { status: 500 }
      );
    }

    const gameStatus = gameState.status ?? "waiting";
    const leaderboardVisible = Boolean(gameState.leaderboard_visible);

    // 4. Check if requesting client is a team that has finished the game
    let isTeamFinished = false;
    let myTeamRecord: {
      id: string;
      name: string;
      progress: number;
      attempts: number;
      started_at: string | null;
      finished_at: string | null;
    } | null = null;

    if (teamId) {
      const { data: teamData } = await supabase
        .from("teams")
        .select("id, name, progress, attempts, started_at, finished_at")
        .eq("id", teamId)
        .single();

      if (teamData) {
        myTeamRecord = teamData;
        isTeamFinished = teamData.finished_at !== null || teamData.progress >= 20;
      }
    }

    // 5. If hidden, return classified screen
    if (shouldHideLeaderboard(leaderboardVisible, gameStatus)) {
      let myTeamResult: MyTeamResult | null = null;
      if (myTeamRecord && isTeamFinished && myTeamRecord.started_at && myTeamRecord.finished_at) {
        const { data: myAtts } = await supabase
          .from("attempts")
          .select("question_id, created_at, answer_given")
          .eq("team_id", myTeamRecord.id);

        const roundBreakdown = computeRoundDurations(
          myTeamRecord.started_at,
          myTeamRecord.finished_at,
          myAtts || []
        );

        const durationSec = sumRoundDurations(roundBreakdown);

        myTeamResult = {
          rank: 0,
          name: myTeamRecord.name,
          durationSeconds: durationSec,
          formattedTime: formatDurationMmSs(durationSec),
          attempts: myTeamRecord.attempts,
          finished: true,
          roundBreakdown,
        };
      }

      const hiddenResponse: LeaderboardResponse = {
        hidden: true,
        gameStatus,
        myTeamResult,
      };
      if (!teamId) {
        cachedLeaderboard = { timestamp: now, data: hiddenResponse };
      }
      return NextResponse.json(hiddenResponse, { status: 200 });
    }

    // 6. Query sanitized team records (NO join codes, NO internal IDs, NO emails, NO answers)
    const { data: teamsData, error: teamsErr } = await supabase
      .from("teams")
      .select("id, name, progress, attempts, started_at, finished_at")
      .eq("disqualified", false);

    if (teamsErr) {
      return NextResponse.json(
        { error: "Failed to query leaderboard rankings", details: teamsErr.message },
        { status: 500 }
      );
    }

    const finishedTeamsList = (teamsData || []).filter(
      (t) => t.started_at && t.finished_at
    );
    const finishedTeamIds = finishedTeamsList.map((t) => t.id);

    const attemptsByTeam = new Map<
      string,
      Array<{ question_id: string; created_at: string; answer_given?: string | null }>
    >();

    if (finishedTeamIds.length > 0) {
      const { data: allAtts } = await supabase
        .from("attempts")
        .select("team_id, question_id, created_at, answer_given")
        .in("team_id", finishedTeamIds);

      for (const att of allAtts || []) {
        const list = attemptsByTeam.get(att.team_id) || [];
        list.push(att);
        attemptsByTeam.set(att.team_id, list);
      }
    }

    // Calculate duration strictly as sum of each round's duration
    const publicTeams: PublicTeamProgress[] = (teamsData || []).map((t) => {
      let duration_seconds: number | null = null;
      if (t.started_at && t.finished_at) {
        const teamAtts = attemptsByTeam.get(t.id) || [];
        const breakdowns = computeRoundDurations(t.started_at, t.finished_at, teamAtts);
        duration_seconds = sumRoundDurations(breakdowns);
      }
      return {
        name: t.name,
        progress: t.progress,
        attempts: t.attempts,
        finished_at: t.finished_at,
        duration_seconds,
      };
    });

    const { finishedTeams, inProgressTeams } = rankLeaderboardTeams(publicTeams);

    // Determine if requesting team has an individual result
    let myTeamResult: MyTeamResult | null = null;
    if (myTeamRecord && isTeamFinished) {
      const myRankEntry = finishedTeams.find((t) => t.name === myTeamRecord.name);
      const myRank = myRankEntry ? myRankEntry.rank : 1;

      let roundBreakdown: RoundBreakdown[] = [];
      if (myTeamRecord.started_at) {
        const teamAtts = attemptsByTeam.get(myTeamRecord.id);
        let myAtts = teamAtts;
        if (!myAtts) {
          const { data: fetchedAtts } = await supabase
            .from("attempts")
            .select("question_id, created_at, answer_given")
            .eq("team_id", myTeamRecord.id);
          myAtts = fetchedAtts || [];
        }

        roundBreakdown = computeRoundDurations(
          myTeamRecord.started_at,
          myTeamRecord.finished_at,
          myAtts || []
        );
      }

      const durationSeconds = sumRoundDurations(roundBreakdown);

      myTeamResult = {
        rank: myRank,
        name: myTeamRecord.name,
        durationSeconds,
        formattedTime: formatDurationMmSs(durationSeconds),
        attempts: myTeamRecord.attempts,
        finished: true,
        roundBreakdown,
      };
    }

    // If global leaderboard is classified, omit in-progress teams for fairness
    const isGloballyPublic = !shouldHideLeaderboard(leaderboardVisible, gameStatus);

    const fullResponse: LeaderboardResponse = {
      hidden: false,
      gameStatus,
      finishedTeams,
      inProgressTeams: isGloballyPublic ? inProgressTeams : [],
      myTeamResult,
    };

    if (!teamId && isGloballyPublic) {
      cachedLeaderboard = { timestamp: now, data: fullResponse };
    }

    return NextResponse.json(fullResponse, {
      status: 200,
      headers: { "X-Cache": "MISS" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: "Failed to load public leaderboard", details: message },
      { status: 500 }
    );
  }
}

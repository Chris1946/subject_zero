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
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

    let gameRes = await supabase
      .from("game_state")
      .select("status, started_at, paused_at, paused_total_seconds, leaderboard_visible, tools_enabled")
      .eq("id", 1)
      .single();

    // Fallback if tools_enabled migration has not been applied yet
    if (gameRes.error && (gameRes.error.code === "42703" || gameRes.error.message?.includes("tools_enabled"))) {
      gameRes = await supabase
        .from("game_state")
        .select("status, started_at, paused_at, paused_total_seconds, leaderboard_visible")
        .eq("id", 1)
        .single();
    }

    const [teamsRes, attemptsRecentRes, attemptsWrongRes] = await Promise.all([
      supabase
        .from("teams")
        .select("id, name, progress, finished_at, disqualified"),
      supabase
        .from("attempts")
        .select("id", { count: "exact", head: true })
        .gte("created_at", fiveMinutesAgo),
      supabase
        .from("attempts")
        .select("id", { count: "exact", head: true })
        .eq("is_correct", false),
    ]);

    if (gameRes.error || !gameRes.data) {
      return NextResponse.json({ error: "Failed to load game state" }, { status: 500 });
    }

    const gameState = gameRes.data;
    const teams = teamsRes.data || [];

    const teamsTotal = teams.length;
    const teamsFinished = teams.filter((t) => t.finished_at !== null).length;

    // Room breakdown (progress 0..3 -> Room 1; 4..7 -> Room 2; 8..11 -> Room 3; 12..15 -> Room 4; 16..19 -> Room 5; 20 -> Finished)
    const teamsPerRoom = {
      room1: 0,
      room2: 0,
      room3: 0,
      room4: 0,
      room5: 0,
      finished: 0,
    };

    teams.forEach((t) => {
      if (t.finished_at !== null || t.progress >= 20) {
        teamsPerRoom.finished++;
      } else {
        const roomIdx = Math.min(4, Math.floor(t.progress / 4));
        const key = `room${roomIdx + 1}` as keyof typeof teamsPerRoom;
        teamsPerRoom[key]++;
      }
    });

    // Elapsed game time excluding pauses
    let elapsedGameSeconds = 0;
    if (gameState.started_at) {
      const startMs = new Date(gameState.started_at).getTime();
      let endMs = now.getTime();
      if (gameState.status === "paused" && gameState.paused_at) {
        endMs = new Date(gameState.paused_at).getTime();
      }
      const rawElapsed = Math.max(0, Math.floor((endMs - startMs) / 1000));
      elapsedGameSeconds = Math.max(0, rawElapsed - (gameState.paused_total_seconds || 0));
    }

    return NextResponse.json(
      {
        gameStatus: gameState.status,
        startedAt: gameState.started_at,
        pausedAt: gameState.paused_at,
        pausedTotalSeconds: gameState.paused_total_seconds || 0,
        leaderboardVisible: Boolean(gameState.leaderboard_visible),
        toolsEnabled: gameState.tools_enabled !== false,
        teamsTotal,
        teamsFinished,
        teamsPerRoom,
        totalWrongAttempts: attemptsWrongRes.count ?? 0,
        attemptsLast5Min: attemptsRecentRes.count ?? 0,
        elapsedGameSeconds,
        serverTime: now.toISOString(),
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: "Failed to load admin stats", details: message },
      { status: 500 }
    );
  }
}

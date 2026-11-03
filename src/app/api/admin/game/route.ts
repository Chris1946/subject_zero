import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, UnauthorizedError } from "@/lib/session.server";
import { getServerClient } from "@/lib/supabase/server";
import {
  evaluateGameTransition,
  AdminGameAction,
  GameStateRecord,
} from "@/lib/game/control.server";

export const dynamic = "force-dynamic";

const AdminGameBodySchema = z.object({
  action: z.enum(["start", "pause", "resume", "end", "reset"] as const),
  confirm: z.string().optional(),
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
    const parsed = AdminGameBodySchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid action payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { action, confirm } = parsed.data;
    const supabase = getServerClient();

    // Fetch current game state
    const { data: currentState, error: fetchErr } = await supabase
      .from("game_state")
      .select("id, status, started_at, paused_at, paused_total_seconds")
      .eq("id", 1)
      .single();

    if (fetchErr || !currentState) {
      return NextResponse.json(
        { error: "Failed to read game state from database" },
        { status: 500 }
      );
    }

    const stateRecord = currentState as GameStateRecord;

    // Evaluate state machine transition
    const transition = evaluateGameTransition(stateRecord.status, action as AdminGameAction, {
      confirm,
      now: new Date(),
      pausedAt: stateRecord.paused_at,
    });

    if (!transition.valid || !transition.nextState) {
      return NextResponse.json(
        { error: transition.error ?? "Invalid game transition" },
        { status: 409 }
      );
    }

    if (action === "resume") {
      const additionalSeconds = transition.additionalPausedSeconds || 0;
      const newPausedTotal =
        (stateRecord.paused_total_seconds || 0) + additionalSeconds;

      const { error: updateErr } = await supabase
        .from("game_state")
        .update({
          status: "running",
          paused_at: null,
          paused_total_seconds: newPausedTotal,
        })
        .eq("id", 1);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      // Shift current_round_started_at forward by the pause duration for all teams currently in an active round
      if (additionalSeconds > 0) {
        const { data: activeTeams } = await supabase
          .from("teams")
          .select("id, current_round_started_at")
          .not("current_round_started_at", "is", null);

        if (activeTeams && activeTeams.length > 0) {
          await Promise.all(
            activeTeams.map((t) => {
              const originalMs = new Date(t.current_round_started_at).getTime();
              const adjustedIso = new Date(originalMs + additionalSeconds * 1000).toISOString();
              return supabase
                .from("teams")
                .update({ current_round_started_at: adjustedIso })
                .eq("id", t.id);
            })
          );
        }
      }
    } else if (action === "reset") {
      // 1. Reset game_state to waiting
      const { error: resetStateErr } = await supabase
        .from("game_state")
        .update(transition.nextState)
        .eq("id", 1);

      if (resetStateErr) {
        return NextResponse.json({ error: resetStateErr.message }, { status: 500 });
      }

      // 2. Reset all teams
      const { error: resetTeamsErr } = await supabase
        .from("teams")
        .update({
          progress: 0,
          attempts: 0,
          started_at: null,
          finished_at: null,
        })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (resetTeamsErr) {
        return NextResponse.json({ error: resetTeamsErr.message }, { status: 500 });
      }

      // 3. Clear attempts log
      const { error: clearAttemptsErr } = await supabase
        .from("attempts")
        .delete()
        .neq("id", -1);

      if (clearAttemptsErr) {
        return NextResponse.json({ error: clearAttemptsErr.message }, { status: 500 });
      }
    } else {
      const { error: updateErr } = await supabase
        .from("game_state")
        .update(transition.nextState)
        .eq("id", 1);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
    }

    // Write audit log
    await supabase.from("admin_log").insert({
      action: `game_${action}`,
      detail: {
        previousStatus: stateRecord.status,
        nextStatus: transition.nextStatus,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({ ok: true, status: transition.nextStatus }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: "Game control action failed", details: message },
      { status: 500 }
    );
  }
}

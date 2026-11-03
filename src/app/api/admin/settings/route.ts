import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, UnauthorizedError } from "@/lib/session.server";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SettingsBodySchema = z.object({
  leaderboardVisible: z.boolean(),
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
    const parsed = SettingsBodySchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid settings payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { leaderboardVisible } = parsed.data;
    const supabase = getServerClient();

    const { error } = await supabase
      .from("game_state")
      .update({ leaderboard_visible: leaderboardVisible })
      .eq("id", 1);

    if (error) {
      return NextResponse.json(
        { error: "Failed to update leaderboard visibility setting", details: error.message },
        { status: 500 }
      );
    }

    // Write audit log
    await supabase.from("admin_log").insert({
      action: "toggle_leaderboard",
      detail: { leaderboardVisible },
    });

    return NextResponse.json({ ok: true, leaderboardVisible }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: "Failed to update settings", details: message },
      { status: 500 }
    );
  }
}

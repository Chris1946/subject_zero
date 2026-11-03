import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, UnauthorizedError } from "@/lib/session.server";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const AdminTeamActionSchema = z.object({
  teamId: z.string().uuid("Invalid teamId format"),
  action: z.enum(["disqualify", "reinstate", "reset-progress", "delete"] as const),
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
    const parsed = AdminTeamActionSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid action payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { teamId, action } = parsed.data;
    const supabase = getServerClient();

    if (action === "delete") {
      const { data: teamToDelete } = await supabase
        .from("teams")
        .select("id, name")
        .eq("id", teamId)
        .single();

      const { error: delErr } = await supabase
        .from("teams")
        .delete()
        .eq("id", teamId);

      if (delErr) {
        return NextResponse.json(
          { error: "Failed to delete team", details: delErr.message },
          { status: 400 }
        );
      }

      await supabase.from("admin_log").insert({
        action: "team_delete",
        detail: { teamId, teamName: teamToDelete?.name || "Unknown" },
      });

      return NextResponse.json({ ok: true, deleted: true }, { status: 200 });
    }

    let updateFields: Record<string, unknown> = {};

    if (action === "disqualify") {
      updateFields = { disqualified: true };
    } else if (action === "reinstate") {
      updateFields = { disqualified: false };
    } else if (action === "reset-progress") {
      updateFields = { progress: 0, finished_at: null };
    }

    const { data: updated, error } = await supabase
      .from("teams")
      .update(updateFields)
      .eq("id", teamId)
      .select("id, name, progress, disqualified")
      .single();

    if (error || !updated) {
      return NextResponse.json(
        { error: "Failed to update team", details: error?.message },
        { status: 400 }
      );
    }

    // Write audit log
    await supabase.from("admin_log").insert({
      action: `team_${action}`,
      detail: { teamId, teamName: updated.name },
    });

    return NextResponse.json({ ok: true, team: updated }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: "Team management action failed", details: message },
      { status: 500 }
    );
  }
}

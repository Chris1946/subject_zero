import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function runCleanup() {
  console.log("🧹 Initializing database reset on Supabase:", supabaseUrl);

  // 1. Delete attempts
  const { error: attErr } = await supabase.from("attempts").delete().neq("id", -999999);
  if (attErr) console.warn("Notice deleting attempts:", attErr.message);

  // 2. Delete team_members
  const { error: memErr } = await supabase.from("team_members").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (memErr) console.warn("Notice deleting team_members:", memErr.message);

  // 3. Delete teams
  const { error: teamErr } = await supabase.from("teams").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (teamErr) console.warn("Notice deleting teams:", teamErr.message);

  // 4. Delete rate limit hits
  const { error: rlErr } = await supabase.from("rate_limit_hits").delete().neq("key", "__none__");
  if (rlErr) console.warn("Notice deleting rate_limit_hits:", rlErr.message);

  // 5. Delete admin log
  const { error: logErr } = await supabase.from("admin_log").delete().neq("id", -999999);
  if (logErr) console.warn("Notice deleting admin_log:", logErr.message);

  // 6. Reset singleton game_state
  const { error: stateErr } = await supabase
    .from("game_state")
    .update({
      status: "waiting",
      started_at: null,
      paused_at: null,
      paused_total_seconds: 0,
      leaderboard_visible: false,
    })
    .eq("id", 1);

  if (stateErr) {
    console.error("Error resetting game_state:", stateErr.message);
    process.exit(1);
  }

  // 7. Verification
  const { data: stateData } = await supabase.from("game_state").select("*").eq("id", 1).single();
  const { count: teamCount } = await supabase.from("teams").select("*", { count: "exact", head: true });
  const { count: memberCount } = await supabase.from("team_members").select("*", { count: "exact", head: true });
  const { count: attemptCount } = await supabase.from("attempts").select("*", { count: "exact", head: true });

  console.log("✅ Database reset complete!");
  console.log("   - Game status:", stateData?.status, "(waiting for start)");
  console.log("   - Remaining teams:", teamCount ?? 0);
  console.log("   - Remaining members:", memberCount ?? 0);
  console.log("   - Remaining attempts:", attemptCount ?? 0);
}

runCleanup().catch((err) => {
  console.error("Fatal cleanup failure:", err);
  process.exit(1);
});

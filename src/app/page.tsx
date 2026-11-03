import Link from "next/link";
import { redirect } from "next/navigation";
import { readTeamSession, clearSession, TEAM_COOKIE_NAME } from "@/lib/session.server";
import { getServerClient } from "@/lib/supabase/server";
import { JoinForm } from "./join-form";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const teamId = await readTeamSession();
  if (teamId) {
    const supabase = getServerClient();
    const { data: team } = await supabase
      .from("teams")
      .select("id")
      .eq("id", teamId)
      .single();

    if (team) {
      redirect("/play");
    } else {
      // Team no longer exists in DB (e.g. database reset/cleaned). Clear stale cookie.
      await clearSession(TEAM_COOKIE_NAME);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-text selection:bg-cold-blue selection:text-background">
      <div className="w-full max-w-md text-center mb-6">
        <p className="text-xs text-text/40 font-mono uppercase tracking-widest mb-1">
          HOLLOWAY RESEARCH FACILITY // NET-OP-01
        </p>
        <h2 className="text-sm font-bold font-mono text-cold-blue tracking-widest">
          SUBJECT ZERO — UNKNOWN SOURCE CONNECTED
        </h2>
      </div>

      <JoinForm />

      <div className="mt-6 flex items-center justify-center gap-4 text-xs font-mono">
        <Link
          href="/leaderboard"
          className="px-4 py-2 border border-panel hover:border-cold-blue text-text/70 hover:text-cold-blue transition-colors flex items-center gap-2"
        >
          <span>🏆</span>
          <span>VIEW LIVE LEADERBOARD</span>
        </Link>
      </div>

      <footer className="mt-8 text-[10px] text-text/30 font-mono uppercase tracking-widest text-center">
        RESTRICTED TERMINAL INTERFACE // AUTHORISED PERSONNEL ONLY
      </footer>
    </main>
  );
}

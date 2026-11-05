import Link from "next/link";
import { redirect } from "next/navigation";
import { readTeamSession, clearSession, TEAM_COOKIE_NAME } from "@/lib/session.server";
import { getServerClient } from "@/lib/supabase/server";
import { JoinForm } from "./join-form";
import { PixelPumpkin } from "@/components/PixelPumpkin";

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
      await clearSession(TEAM_COOKIE_NAME);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-text selection:bg-accent selection:text-background overflow-hidden relative">

      {/* ── Pumpkin pattern background ── */}
      <div className="fixed inset-0 halloween-bg-pattern opacity-50 pointer-events-none" aria-hidden="true" />

      {/* ── Atmospheric blood-red radial glow ── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(140,10,10,0.14) 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      {/* ── INTERACTIVE PIXEL PUMPKIN (background) ── */}
      <div
        className="fixed pointer-events-none z-0"
        style={{ top: "50%", left: "50%", transform: "translate(-50%, -58%)" }}
        aria-hidden="true"
      >
        <PixelPumpkin
          size={420}
          opacity={0.38}
          className="pumpkin-emerge"
        />
      </div>

      {/* ── Top bar: location + event + year ── */}
      <div className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-3 border-b border-[#5c1a1a]/40 bg-[#0e0103]/80 backdrop-blur-sm">
        <span className="font-pixel text-[8px] text-[#ff4500]/70 tracking-widest">NEW YORK</span>
        <div className="flex items-center gap-4">
          <span className="text-[#5c1a1a] text-xs">+</span>
          <span className="font-pixel text-[8px] text-[#ff4500]/70 tracking-widest">HALLOWEEN</span>
          <span className="text-[#5c1a1a] text-xs">+</span>
        </div>
        <span className="font-pixel text-[8px] text-[#ff4500]/70 tracking-widest">2026</span>
      </div>

      {/* ── Pixel corner brackets ── */}
      <div className="fixed top-10 left-3 pointer-events-none z-10" aria-hidden="true">
        <div className="w-4 h-[1px] bg-[#ff4500]/40" />
        <div className="w-[1px] h-4 bg-[#ff4500]/40" />
      </div>
      <div className="fixed top-10 right-3 pointer-events-none z-10 flex flex-col items-end" aria-hidden="true">
        <div className="w-4 h-[1px] bg-[#ff4500]/40" />
        <div className="w-[1px] h-4 bg-[#ff4500]/40" />
      </div>

      {/* ── Main content (above pumpkin) ── */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-5 mt-8">

        {/* Title */}
        <div className="text-center space-y-1">
          <p className="font-pixel text-[8px] text-[#ff4500]/50 tracking-[0.3em] uppercase mb-3">
            HOLLOWAY RESEARCH FACILITY // NET-OP-01
          </p>

          <div className="relative">
            <h1
              className="font-pixel text-[22px] leading-tight pixel-text-glow"
              style={{ color: "#ff4500" }}
            >
              SUBJECT
            </h1>
            <div className="flex items-center justify-center gap-3">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#ff4500]/60" />
              <span
                className="font-pixel text-[32px] leading-none pixel-text-glow"
                style={{ color: "#ff4500" }}
              >
                ZERO
              </span>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#ff4500]/60" />
            </div>
          </div>

          {/* Badge */}
          <div
            className="inline-block mt-2 px-3 py-1 border border-[#ff4500]/60 pixel-corners"
            style={{ background: "rgba(14,1,3,0.85)" }}
          >
            <span className="font-pixel text-[7px] text-[#ff8c00] tracking-widest">
              UNKNOWN SOURCE CONNECTED
            </span>
          </div>

          {/* Timestamp */}
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="font-pixel text-[18px] pixel-text-glow" style={{ color: "#ff4500" }}>
              00:00
            </span>
          </div>
          <p className="font-pixel text-[7px] text-[#b87070]/80 tracking-widest uppercase">
            OCTOBER 31 // AFTER DARK
          </p>
        </div>

        {/* Icons row */}
        <div
          className="flex items-center justify-center gap-6 px-6 py-3 border border-[#5c1a1a]/60 pixel-corners"
          style={{ background: "rgba(26,4,7,0.8)" }}
        >
          <span className="text-[#ff4500] text-2xl" aria-hidden="true">🔥</span>
          <span className="text-[#ff4500]/60 font-pixel text-xs">✛</span>
          <span className="text-[#ff8c00] text-xl" aria-hidden="true">🌙</span>
        </div>

        {/* Join Form */}
        <JoinForm />

        {/* Tagline */}
        <p className="font-pixel text-[7px] text-center text-[#b87070]/70 tracking-widest leading-relaxed px-4 max-w-xs">
          &ldquo;ENTER YOUR SQUAD CODE TO BEGIN THE INVESTIGATION&rdquo;
        </p>

        {/* Bottom nav */}
        <div className="w-full border-t border-[#5c1a1a]/40 pt-4">
          <div className="flex items-center justify-between gap-2 text-[7px] font-pixel text-[#ff4500]/50 tracking-widest flex-wrap">
            <span>THE MOON</span>
            <span>THE SHADOW</span>
            <Link
              href="/leaderboard"
              className="text-[#ff4500]/80 hover:text-[#ff4500] transition-colors underline underline-offset-2"
            >
              THE CALL
            </Link>
            <span>THE DOOR</span>
            <span>THE UNKNOWN</span>
          </div>
          <p className="text-center font-pixel text-[6px] text-[#5c1a1a] mt-3 tracking-widest">
            — EVERYTHING CHANGES AFTER MIDNIGHT —
          </p>
        </div>
      </div>

      {/* ── Floating embers ── */}
      <div className="fixed bottom-16 left-1/4 pointer-events-none z-0" aria-hidden="true">
        <div
          className="ember-particle pixelated w-1 h-1 bg-[#ff6b00]"
          style={{ "--ember-dur": "3.5s", "--drift-x": "10px", "--drift-x2": "-5px" } as React.CSSProperties}
        />
      </div>
      <div className="fixed bottom-24 right-1/3 pointer-events-none z-0" aria-hidden="true">
        <div
          className="ember-particle pixelated w-1 h-1 bg-[#ff3300]"
          style={{ "--ember-dur": "2.8s", "--drift-x": "-8px", "--drift-x2": "12px", animationDelay: "1.2s" } as React.CSSProperties}
        />
      </div>

      {/* ── Footer ── */}
      <footer className="fixed bottom-0 left-0 right-0 text-center py-2 font-pixel text-[6px] text-[#5c1a1a]/60 tracking-widest border-t border-[#5c1a1a]/20 bg-[#0e0103]/60 backdrop-blur-sm z-10">
        RESTRICTED TERMINAL INTERFACE // AUTHORISED PERSONNEL ONLY
      </footer>
    </main>
  );
}

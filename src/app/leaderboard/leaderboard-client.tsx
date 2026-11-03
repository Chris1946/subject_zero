"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LeaderboardResponse, RankedFinishedTeam, RankedInProgressTeam } from "@/lib/game/admin-utils";

export function LeaderboardClient() {
  const searchParams = useSearchParams();
  const isDisplayMode = searchParams.get("display") === "1";

  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch("/api/leaderboard", { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 429) {
          setError("RATE LIMIT EXCEEDED. RETRYING SHORTLY...");
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const json: LeaderboardResponse = await res.json();
      setData(json);
      setError(null);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {
      setError("COMMUNICATION INTERRUPTION. RETRYING...");
    }
  }, []);

  // Polling every 5 seconds, paused when tab is hidden
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        if (!document.hidden) {
          void fetchLeaderboard();
        }
      }, 5000);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void fetchLeaderboard();
        startPolling();
      } else {
        if (timer) clearInterval(timer);
      }
    };

    const initialTimer = setTimeout(() => {
      void fetchLeaderboard();
    }, 0);

    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(initialTimer);
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchLeaderboard]);

  // Projector auto-scrolling logic (when display=1)
  useEffect(() => {
    if (!isDisplayMode) return;

    let animationFrameId: number;
    let scrollDirection = 1; // 1 = down, -1 = up
    let pauseCounter = 0;

    const scrollLoop = () => {
      const el = scrollContainerRef.current;
      if (el) {
        const maxScroll = el.scrollHeight - el.clientHeight;
        if (maxScroll > 10) {
          if (pauseCounter > 0) {
            pauseCounter--;
          } else {
            el.scrollTop += scrollDirection * 0.75;
            if (el.scrollTop >= maxScroll) {
              scrollDirection = -1;
              pauseCounter = 120; // pause at bottom ~2s
            } else if (el.scrollTop <= 0) {
              scrollDirection = 1;
              pauseCounter = 120; // pause at top ~2s
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(scrollLoop);
    };

    animationFrameId = requestAnimationFrame(scrollLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isDisplayMode, data]);

  useEffect(() => {
    if (data?.myTeamResult?.finished && typeof window !== "undefined") {
      try {
        sessionStorage.setItem("squad_investigation_concluded", "true");
      } catch {
        // ignore storage errors
      }
    }
  }, [data?.myTeamResult?.finished]);

  // Hidden State
  if (data?.hidden) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-text font-mono select-none">
        <div className="w-full max-w-xl border border-primary/40 bg-panel/80 p-8 shadow-2xl text-center space-y-6">
          <div className="text-xs text-primary/80 uppercase tracking-widest font-bold">
            FACILITY ARCHIVE // RESTRICTED ACCESS
          </div>
          <h1 className="text-base sm:text-lg font-bold tracking-widest text-text uppercase">
            RESULTS CLASSIFIED UNTIL THE INVESTIGATION CLOSES.
          </h1>
          <p className="text-xs text-text/60 leading-relaxed">
            All team records and operation timelines remain sealed under quarantine protocol.
            Public verification will become available once the research director concludes the test
            or unlocks the public leaderboard.
          </p>
          {data.myTeamResult?.finished && (
            <div className="p-4 bg-background/80 border border-success/40 text-left space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text/60 uppercase">YOUR SQUAD STATUS:</span>
                <span className="text-success font-bold font-mono">COMPLETED (20/20)</span>
              </div>
              <div className="flex items-center justify-between font-bold text-sm">
                <span className="text-cold-blue uppercase">{data.myTeamResult.name}</span>
                <span className="text-text font-mono">TOTAL TIME: {data.myTeamResult.formattedTime}</span>
              </div>
              {data.myTeamResult.roundBreakdown && data.myTeamResult.roundBreakdown.length > 0 && (
                <div className="pt-2 border-t border-panel/60">
                  <span className="text-[10px] text-text/40 uppercase tracking-widest font-bold block mb-1.5">
                    ROUND DURATION BREAKDOWN:
                  </span>
                  <div className="grid grid-cols-5 gap-1.5 text-center text-xs font-mono">
                    {data.myTeamResult.roundBreakdown.map((rb) => (
                      <div key={rb.round} className="p-1.5 bg-panel/30 border border-panel/50">
                        <span className="text-[9px] text-text/50 uppercase block">R{rb.round}</span>
                        <span className="text-cold-blue font-bold text-xs">{rb.formattedTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-[11px] text-text/50">
                Standings and final rankings will be declassified once the director concludes the competition for all units.
              </p>
            </div>
          )}
          <div className="text-[11px] text-text/40 pt-2 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary/70 animate-pulse" />
            STANDBY REFRESH ACTIVE · AUTO-UPDATES EVERY 5S
          </div>
          {!isDisplayMode && (
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              {data.myTeamResult?.finished ? (
                <span className="text-emerald-400 font-bold border border-emerald-500/40 bg-emerald-950/30 px-3 py-1.5 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  ✓ PROTOCOL CONCLUDED · FINAL RECORD SEALED
                </span>
              ) : (
                <>
                  <Link
                    href="/play"
                    className="px-4 py-2 border border-border text-xs text-text/80 hover:text-text hover:border-primary transition-colors"
                  >
                    RETURN TO TERMINAL
                  </Link>
                  <Link
                    href="/"
                    className="px-4 py-2 border border-border text-xs text-text/60 hover:text-text hover:border-primary transition-colors"
                  >
                    HOME / JOIN
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    );
  }

  const finishedTeams: RankedFinishedTeam[] = data?.finishedTeams || [];
  const inProgressTeams: RankedInProgressTeam[] = data?.inProgressTeams || [];

  return (
    <div
      ref={scrollContainerRef}
      className={`min-h-screen bg-background text-text font-mono select-none ${
        isDisplayMode ? "h-screen overflow-y-auto p-8 lg:p-12" : "p-4 sm:p-8 max-w-5xl mx-auto"
      }`}
    >
      {/* Top Banner */}
      <header className={`border-b border-border pb-4 mb-6 ${isDisplayMode ? "mb-8 pb-6" : ""}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-xs text-primary font-bold tracking-widest uppercase">
              SUBJECT ZERO // RECORD ARCHIVE
            </div>
            <h1
              className={`font-bold tracking-wider text-text uppercase ${
                isDisplayMode ? "text-3xl lg:text-4xl" : "text-xl sm:text-2xl"
              }`}
            >
              FINAL INVESTIGATION STANDINGS
            </h1>
          </div>
          {!isDisplayMode && (
            <div className="flex items-center gap-3 text-xs text-text/60">
              {lastUpdated && <span>UPDATED: {lastUpdated}</span>}
              {data?.myTeamResult?.finished ? (
                <span className="text-emerald-400 font-bold border border-emerald-500/40 bg-emerald-950/30 px-3 py-1 text-[11px] uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  ✓ PROTOCOL CONCLUDED · FINAL RECORD SEALED
                </span>
              ) : (
                <>
                  <Link
                    href="/play"
                    className="px-3 py-1.5 border border-border text-text/80 hover:text-text hover:border-primary transition-colors"
                  >
                    RETURN TO GAME
                  </Link>
                  <Link
                    href="/"
                    className="px-3 py-1.5 border border-border text-text/60 hover:text-text hover:border-primary transition-colors"
                  >
                    HOME / JOIN
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
        {error && (
          <div className="mt-3 text-xs text-emergency-red tracking-wider">
            [WARNING: {error}]
          </div>
        )}
      </header>

      {/* Finished Team Personal Result Card */}
      {data?.myTeamResult && (
        <section className="mb-8 border border-cold-blue/60 bg-panel/90 p-5 shadow-2xl font-mono text-xs">
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-cold-blue/30 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-cold-blue font-bold tracking-widest uppercase">
                ★ YOUR SQUAD FINAL RECORD
              </span>
              <span className="px-2 py-0.5 bg-cold-blue text-background font-bold text-[11px] uppercase tracking-wider">
                RANK #{data.myTeamResult.rank}
              </span>
            </div>
            <span className="text-[11px] text-success font-bold tracking-widest">
              PROTOCOL CONCLUDED (20/20) ✓
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
            <div>
              <span className="text-text/40 block text-[10px] uppercase">OPERATING UNIT</span>
              <span className="font-bold text-cold-blue text-sm truncate block">
                {data.myTeamResult.name}
              </span>
            </div>
            <div>
              <span className="text-text/40 block text-[10px] uppercase">FINAL COMPLETION TIME</span>
              <span className="font-bold text-primary text-sm block">
                {data.myTeamResult.formattedTime}
              </span>
            </div>
            <div>
              <span className="text-text/40 block text-[10px] uppercase">SUBMISSION ATTEMPTS</span>
              <span className="font-bold text-text text-sm block">
                {data.myTeamResult.attempts}
              </span>
            </div>
            <div>
              <span className="text-text/40 block text-[10px] uppercase">PODIUM STATUS</span>
              <span className="font-bold text-text text-sm block">
                {data.myTeamResult.rank === 1
                  ? "🥇 1ST PLACE"
                  : data.myTeamResult.rank === 2
                  ? "🥈 2ND PLACE"
                  : data.myTeamResult.rank === 3
                  ? "🥉 3RD PLACE"
                  : `POSITION #${data.myTeamResult.rank}`}
              </span>
            </div>
          </div>

          {/* Round-by-Round Performance Breakdown */}
          {data.myTeamResult.roundBreakdown && data.myTeamResult.roundBreakdown.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border">
              <span className="text-[10px] text-text/40 uppercase tracking-widest font-bold block mb-2">
                ROUND DURATION BREAKDOWN:
              </span>
              <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono">
                {data.myTeamResult.roundBreakdown.map((rb) => (
                  <div key={rb.round} className="p-2 bg-background/50 border border-border/60">
                    <span className="text-[9px] text-text/50 uppercase block font-bold">ROUND {rb.round}</span>
                    <span className="text-cold-blue font-bold text-xs">{rb.formattedTime}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Finished Teams Table */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className={`font-bold tracking-widest text-text uppercase ${isDisplayMode ? "text-xl" : "text-sm"}`}>
            CONCLUDED INVESTIGATIONS ({finishedTeams.length})
          </h2>
          <span className="text-xs text-text/50">RANKED BY TIME & ACCURACY</span>
        </div>

        {finishedTeams.length === 0 ? (
          <div className="border border-border/60 bg-panel/40 p-6 text-center text-xs text-text/50">
            NO UNITS HAVE CONCLUDED INVESTIGATION PROTOCOL YET.
          </div>
        ) : (
          <div className="border border-border/80 bg-panel/60 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/80 bg-panel/90 text-text/50 text-[11px] sm:text-xs tracking-wider uppercase">
                  <th className="py-2.5 px-3 sm:px-4 w-16">RANK</th>
                  <th className="py-2.5 px-3 sm:px-4">TEAM DESIGNATION</th>
                  <th className="py-2.5 px-3 sm:px-4 text-right">TIME</th>
                  <th className="py-2.5 px-3 sm:px-4 text-right">WRONG ATTEMPTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs sm:text-sm">
                {finishedTeams.map((team) => {
                  const isMyTeam = data?.myTeamResult?.name === team.name;
                  let podiumClass = "text-text/90";
                  let rankBadge = `#${team.rank}`;

                  if (team.rank === 1) {
                    podiumClass = "text-amber-300 font-bold bg-amber-950/15 border-l-2 border-l-amber-400";
                    rankBadge = "01 [1ST]";
                  } else if (team.rank === 2) {
                    podiumClass = "text-slate-200 font-semibold bg-slate-900/30 border-l-2 border-l-slate-400";
                    rankBadge = "02 [2ND]";
                  } else if (team.rank === 3) {
                    podiumClass = "text-amber-600/90 font-medium bg-amber-950/10 border-l-2 border-l-amber-700/60";
                    rankBadge = "03 [3RD]";
                  }

                  return (
                    <tr
                      key={team.name}
                      className={`transition-colors hover:bg-panel/90 ${podiumClass} ${
                        isMyTeam ? "ring-1 ring-cold-blue bg-cold-blue/15" : ""
                      } ${
                        isDisplayMode ? "text-xl lg:text-2xl py-4" : ""
                      }`}
                    >
                      <td className="py-3 px-3 sm:px-4 font-mono font-bold whitespace-nowrap">
                        {rankBadge}
                      </td>
                      <td className="py-3 px-3 sm:px-4 tracking-wider flex items-center gap-2">
                        <span>{team.name}</span>
                        {isMyTeam && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-cold-blue text-background font-bold uppercase tracking-wider">
                            YOUR SQUAD
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-right font-mono font-bold tracking-widest text-primary">
                        {team.formattedTime}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-right font-mono text-text/70">
                        {team.attempts}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* In-Progress Units */}
      {inProgressTeams.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-3">
            <h2 className={`font-bold tracking-widest text-text/80 uppercase ${isDisplayMode ? "text-xl" : "text-sm"}`}>
              ACTIVE INVESTIGATION UNITS ({inProgressTeams.length})
            </h2>
            <span className="text-xs text-text/40">TIMERS HIDDEN UNTIL CONCLUSION</span>
          </div>

          <div className="border border-border/60 bg-panel/40 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-panel/70 text-text/40 text-[11px] sm:text-xs tracking-wider uppercase">
                  <th className="py-2 px-3 sm:px-4">TEAM DESIGNATION</th>
                  <th className="py-2 px-3 sm:px-4 text-center">STATUS</th>
                  <th className="py-2 px-3 sm:px-4 text-right">WRONG ATTEMPTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 text-xs sm:text-sm">
                {inProgressTeams.map((team) => (
                  <tr
                    key={team.name}
                    className={`text-text/70 hover:bg-panel/70 transition-colors ${
                      isDisplayMode ? "text-lg lg:text-xl py-3" : ""
                    }`}
                  >
                    <td className="py-2.5 px-3 sm:px-4 font-mono">
                      {team.name}
                    </td>
                    <td className="py-2.5 px-3 sm:px-4 text-center font-mono text-text/60">
                      IN PROGRESS {team.progress}/20
                    </td>
                    <td className="py-2.5 px-3 sm:px-4 text-right font-mono text-text/50">
                      {team.attempts}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Footer / Status */}
      <footer className="pt-4 border-t border-border/40 text-center text-xs text-text/40 tracking-widest uppercase">
        ARCHIVE PROTOCOL SZ-7 · OFFICIAL ESCAPE ROOM COMPETITION AUDIT
      </footer>
    </div>
  );
}

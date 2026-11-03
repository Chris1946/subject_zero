"use client";

import { useState } from "react";
import { formatDurationMmSs } from "@/lib/game/admin-utils";

export interface OverviewStats {
  gameStatus: string;
  startedAt: string | null;
  pausedAt: string | null;
  pausedTotalSeconds: number;
  leaderboardVisible: boolean;
  toolsEnabled?: boolean;
  teamsTotal: number;
  teamsFinished: number;
  teamsPerRoom: {
    room1: number;
    room2: number;
    room3: number;
    room4: number;
    room5: number;
    finished: number;
  };
  totalWrongAttempts: number;
  attemptsLast5Min: number;
  elapsedGameSeconds: number;
  serverTime: string;
}

interface TabOverviewProps {
  stats: OverviewStats | null;
  onRefresh: () => Promise<void>;
}

export function TabOverview({ stats, onRefresh }: TabOverviewProps) {
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Collapsible Reset State
  const [resetOpen, setResetOpen] = useState(false);
  const [resetConfirmInput, setResetConfirmInput] = useState("");

  const status = stats?.gameStatus ?? "waiting";

  async function handleGameAction(action: "start" | "pause" | "resume" | "end") {
    const ok = window.confirm(`Are you sure you want to ${action.toUpperCase()} the investigation?`);
    if (!ok) return;

    setActing(true);
    setActionError(null);

    try {
      const res = await fetch("/api/admin/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setActionError(data?.error || `Failed to execute ${action}`);
      }
      await onRefresh();
    } catch {
      setActionError(`Network communication error during ${action}`);
    } finally {
      setActing(false);
    }
  }

  async function handleResetGame() {
    if (resetConfirmInput !== "RESET") return;

    const ok = window.confirm(
      "CRITICAL WARNING: This will reset all teams to progress 0, wipe all attempts, and return game status to WAITING. Proceed?"
    );
    if (!ok) return;

    setActing(true);
    setActionError(null);

    try {
      const res = await fetch("/api/admin/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", confirm: "RESET" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setActionError(data?.error || "Failed to reset game");
      } else {
        setResetConfirmInput("");
        setResetOpen(false);
        await onRefresh();
      }
    } catch {
      setActionError("Network communication error during reset");
    } finally {
      setActing(false);
    }
  }

  // Room progress calculation
  const totalTeams = Math.max(1, stats?.teamsTotal ?? 0);
  const roomData = [
    { label: "ROOM 1 · SUB-BASEMENT ARCHIVE", count: stats?.teamsPerRoom.room1 ?? 0 },
    { label: "ROOM 2 · CONTAINMENT MONITORING", count: stats?.teamsPerRoom.room2 ?? 0 },
    { label: "ROOM 3 · CHIEF ANALYST DESK", count: stats?.teamsPerRoom.room3 ?? 0 },
    { label: "ROOM 4 · DATA CENTER MAINFRAME", count: stats?.teamsPerRoom.room4 ?? 0 },
    { label: "ROOM 5 · COLD STORAGE CRYPT", count: stats?.teamsPerRoom.room5 ?? 0 },
    { label: "CONCLUDED · ALL ROOMS SOLVED", count: stats?.teamsPerRoom.finished ?? 0 },
  ];

  return (
    <div className="space-y-8">
      {/* Action Error Banner */}
      {actionError && (
        <div
          role="alert"
          className="border border-emergency-red bg-emergency-red/10 p-3 text-xs text-emergency-red font-mono"
        >
          [SYSTEM FAULT: {actionError}]
        </div>
      )}

      {/* Top Controls */}
      <section className="border border-border bg-panel/40 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xs uppercase tracking-widest text-text/50 font-bold">
              INVESTIGATION CONTROLS
            </h2>
            <p className="text-xs text-text/70 mt-0.5">
              Current Status: <span className="text-text font-bold uppercase">{status}</span>
              {stats?.startedAt && (
                <span className="ml-3 text-primary">
                  [TIME: {formatDurationMmSs(stats.elapsedGameSeconds)}]
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <button
            type="button"
            onClick={() => handleGameAction("start")}
            disabled={acting || (status !== "waiting" && status !== "ended")}
            className="px-4 py-2 border border-success/70 bg-success/10 text-success hover:bg-success/20 text-xs uppercase tracking-widest font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {status === "ended" ? "▶ RE-OPEN / START GAME" : "▶ START GAME"}
          </button>

          <button
            type="button"
            onClick={() => handleGameAction("pause")}
            disabled={acting || status !== "running"}
            className="px-4 py-2 border border-amber-500/70 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs uppercase tracking-widest font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ⏸ PAUSE GAME
          </button>

          <button
            type="button"
            onClick={() => handleGameAction("resume")}
            disabled={acting || status !== "paused"}
            className="px-4 py-2 border border-primary/70 bg-primary/10 text-primary hover:bg-primary/20 text-xs uppercase tracking-widest font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ▶ RESUME GAME
          </button>

          <button
            type="button"
            onClick={() => handleGameAction("end")}
            disabled={acting || (status !== "running" && status !== "paused")}
            className="px-4 py-2 border border-emergency-red/70 bg-emergency-red/10 text-emergency-red hover:bg-emergency-red/20 text-xs uppercase tracking-widest font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ⏹ END GAME
          </button>

          {/* Quick Leaderboard Toggle */}
          <button
            type="button"
            onClick={async () => {
              try {
                setActing(true);
                const res = await fetch("/api/admin/settings", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ leaderboardVisible: !stats?.leaderboardVisible }),
                });
                if (res.ok) {
                  await onRefresh();
                }
              } finally {
                setActing(false);
              }
            }}
            disabled={acting}
            className={`px-4 py-2 border text-xs uppercase tracking-widest font-bold transition-colors ${
              stats?.leaderboardVisible
                ? "border-primary bg-primary/20 text-primary hover:bg-primary/30"
                : "border-border bg-background text-text/50 hover:text-text hover:border-primary"
            }`}
            title="Toggle public visibility of the leaderboard"
          >
            {stats?.leaderboardVisible ? "● LEADERBOARD: PUBLIC (CLICK TO HIDE)" : "○ LEADERBOARD: HIDDEN (CLICK TO SHOW)"}
          </button>
        </div>

        {/* Collapsible Reset Section */}
        <div className="mt-6 pt-4 border-t border-border/40">
          <button
            type="button"
            onClick={() => setResetOpen(!resetOpen)}
            className="text-[11px] text-text/50 hover:text-emergency-red uppercase tracking-wider flex items-center gap-1.5 transition-colors"
          >
            <span>{resetOpen ? "▼" : "▶"}</span>
            <span>DANGEROUS ACTION: EMERGENCY RESET PROTOCOL</span>
          </button>

          {resetOpen && (
            <div className="mt-3 p-4 border border-emergency-red/50 bg-emergency-red/5 space-y-3">
              <p className="text-xs text-emergency-red leading-relaxed">
                Resetting the game will erase all team progress, attempt logs, and returned times.
                To confirm this irreversible action, type <strong className="font-mono text-text">RESET</strong> in the input below:
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-md">
                <input
                  type="text"
                  value={resetConfirmInput}
                  onChange={(e) => setResetConfirmInput(e.target.value)}
                  placeholder='Type "RESET"'
                  className="bg-background border border-border px-3 py-1.5 text-xs text-text font-mono focus:outline-none focus:border-emergency-red flex-1"
                />
                <button
                  type="button"
                  onClick={handleResetGame}
                  disabled={acting || resetConfirmInput !== "RESET"}
                  className="px-4 py-1.5 border border-emergency-red bg-emergency-red text-white hover:bg-emergency-red/90 text-xs uppercase tracking-widest font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  CONFIRM RESET
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Stats Cards */}
      <section>
        <h2 className="text-xs uppercase tracking-widest text-text/50 font-bold mb-3">
          SITUATIONAL METRICS
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border border-border bg-panel/60 p-4">
            <div className="text-[11px] text-text/50 uppercase tracking-wider">TEAMS REGISTERED</div>
            <div className="text-2xl font-bold font-mono text-text mt-1">{stats?.teamsTotal ?? 0}</div>
          </div>
          <div className="border border-border bg-panel/60 p-4">
            <div className="text-[11px] text-text/50 uppercase tracking-wider">TEAMS FINISHED</div>
            <div className="text-2xl font-bold font-mono text-success mt-1">{stats?.teamsFinished ?? 0}</div>
          </div>
          <div className="border border-border bg-panel/60 p-4">
            <div className="text-[11px] text-text/50 uppercase tracking-wider">TOTAL WRONG ATTEMPTS</div>
            <div className="text-2xl font-bold font-mono text-emergency-red mt-1">{stats?.totalWrongAttempts ?? 0}</div>
          </div>
          <div className="border border-border bg-panel/60 p-4">
            <div className="text-[11px] text-text/50 uppercase tracking-wider">WRONG (LAST 5 MIN)</div>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{stats?.attemptsLast5Min ?? 0}</div>
          </div>
        </div>
      </section>

      {/* Visual Progress Distribution */}
      <section className="border border-border bg-panel/50 p-4 sm:p-6">
        <h2 className="text-xs uppercase tracking-widest text-text/50 font-bold mb-4">
          ROOM OCCUPANCY DISTRIBUTION
        </h2>

        <div className="space-y-4">
          {roomData.map((room) => {
            const percentage = ((room.count / totalTeams) * 100).toFixed(0);
            return (
              <div key={room.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text/70 font-mono tracking-wider">{room.label}</span>
                  <span className="text-text font-mono font-bold">
                    {room.count} <span className="text-text/40 font-normal">({percentage}%)</span>
                  </span>
                </div>
                <div className="w-full bg-background border border-border h-3 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

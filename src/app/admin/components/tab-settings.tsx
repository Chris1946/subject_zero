"use client";

import { useState, useEffect } from "react";

export interface AdminLogItem {
  id: number;
  action: string;
  detail: Record<string, unknown> | null;
  created_at: string;
}

interface TabSettingsProps {
  leaderboardVisible: boolean;
  toolsEnabled?: boolean;
  onRefresh: () => Promise<void>;
}

export function TabSettings({
  leaderboardVisible,
  toolsEnabled = true,
  onRefresh,
}: TabSettingsProps) {
  const [togglingLeaderboard, setTogglingLeaderboard] = useState(false);
  const [togglingTools, setTogglingTools] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<AdminLogItem[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  async function handleToggleLeaderboard() {
    setTogglingLeaderboard(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaderboardVisible: !leaderboardVisible }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to update leaderboard visibility");
      } else {
        await onRefresh();
      }
    } catch {
      setError("Network communication error updating settings");
    } finally {
      setTogglingLeaderboard(false);
    }
  }

  async function handleToggleTools() {
    setTogglingTools(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolsEnabled: !toolsEnabled }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Failed to toggle puzzle tools");
      } else {
        await onRefresh();
        void fetchLogs();
      }
    } catch {
      setError("Network communication error updating tools switch");
    } finally {
      setTogglingTools(false);
    }
  }

  async function fetchLogs() {
    setLoadingLogs(true);
    try {
      const res = await fetch("/api/admin/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingLogs(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchLogs();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-8 font-mono">
      {error && (
        <div className="border border-emergency-red bg-emergency-red/10 p-3 text-xs text-emergency-red">
          [SETTINGS ERROR: {error}]
        </div>
      )}

      {/* Control Settings Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Leaderboard Visibility Toggle */}
        <div className="border border-border bg-panel/50 p-6 space-y-4">
          <div>
            <h2 className="text-xs uppercase tracking-widest text-text font-bold">
              PUBLIC LEADERBOARD ACCESS
            </h2>
            <p className="text-xs text-text/60 mt-1">
              When hidden, participants and spectators see classified protocol notices.
              When visible, ranked scores update publicly.
            </p>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleToggleLeaderboard}
              disabled={togglingLeaderboard}
              className={`px-4 py-2 border text-xs uppercase tracking-widest font-bold transition-colors disabled:opacity-40 ${
                leaderboardVisible
                  ? "border-success bg-success/15 text-success hover:bg-success/25"
                  : "border-border bg-background text-text/50 hover:text-text hover:border-border/80"
              }`}
            >
              {togglingLeaderboard
                ? "UPDATING..."
                : leaderboardVisible
                ? "● VISIBLE (UNLOCKED)"
                : "○ CLASSIFIED (HIDDEN)"}
            </button>
            <span className="text-[11px] text-text/50">
              STATUS: {leaderboardVisible ? "PUBLIC" : "RESTRICTED"}
            </span>
          </div>
        </div>

        {/* Puzzle Tools Emergency Kill Switch */}
        <div className="border border-border bg-panel/50 p-6 space-y-4">
          <div>
            <h2 className="text-xs uppercase tracking-widest text-text font-bold">
              PUZZLE TOOLS EMERGENCY SWITCH
            </h2>
            <p className="text-xs text-text/60 mt-1">
              When enabled, interactive puzzle tools render. When disabled, all rooms fall back to plain-text questions (1.1 prints binary directly).
            </p>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleToggleTools}
              disabled={togglingTools}
              className={`px-4 py-2 border text-xs uppercase tracking-widest font-bold transition-colors disabled:opacity-40 ${
                toolsEnabled
                  ? "border-emerald-500 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                  : "border-amber-500 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
              }`}
            >
              {togglingTools
                ? "SWITCHING..."
                : toolsEnabled
                ? "● TOOLS ACTIVE (ON)"
                : "○ PLAIN TEXT ONLY (OFF)"}
            </button>
            <span className="text-[11px] text-text/50">
              STATE: {toolsEnabled ? "ONLINE" : "KILL-SWITCH"}
            </span>
          </div>
        </div>

        {/* Export Results CSV */}
        <div className="border border-border bg-panel/50 p-6 space-y-4">
          <div>
            <h2 className="text-xs uppercase tracking-widest text-text font-bold">
              EXPORT FINAL INVESTIGATION DATA
            </h2>
            <p className="text-xs text-text/60 mt-1">
              Generates sanitized CSV with ranks, team names, progress, total attempts, finish timestamps,
              and calculated durations with formula-injection escaping.
            </p>
          </div>

          <div className="pt-2">
            <a
              href="/api/admin/export"
              download
              className="inline-block px-4 py-2 border border-primary bg-primary/10 text-primary hover:bg-primary/20 text-xs uppercase tracking-widest font-bold transition-colors"
            >
              📥 EXPORT RESULTS CSV
            </a>
          </div>
        </div>
      </section>

      {/* Admin Action Audit Log Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h2 className="text-xs uppercase tracking-widest text-text font-bold">
            RESEARCH DIRECTOR AUDIT LOG
          </h2>
          <button
            type="button"
            onClick={fetchLogs}
            disabled={loadingLogs}
            className="text-[11px] text-primary hover:text-primary/80 disabled:opacity-40"
          >
            {loadingLogs ? "REFRESHING..." : "⟳ REFRESH LOGS"}
          </button>
        </div>

        <div className="border border-border bg-panel/30 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-panel/60 text-[10px] text-text/50 uppercase tracking-widest">
                <th className="p-3">ID</th>
                <th className="p-3">TIMESTAMP</th>
                <th className="p-3">ACTION</th>
                <th className="p-3">DETAILS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-text/40 italic">
                    [NO AUDIT ACTIONS RECORDED]
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-panel/40">
                    <td className="p-3 font-mono text-text/60">#{log.id}</td>
                    <td className="p-3 tabular-nums text-text/70">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </td>
                    <td className="p-3 font-bold text-cold-blue tracking-wider">
                      {log.action.toUpperCase()}
                    </td>
                    <td className="p-3 font-mono text-text/80 text-[11px]">
                      {log.detail ? JSON.stringify(log.detail) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

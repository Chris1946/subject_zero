"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AdminHeader, AdminTab } from "./components/admin-header";
import { TabOverview, OverviewStats } from "./components/tab-overview";
import { TabTeams, AdminTeamRecord } from "./components/tab-teams";
import { TabAttempts } from "./components/tab-attempts";
import { TabSettings } from "./components/tab-settings";

export function AdminClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("OVERVIEW");
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [teams, setTeams] = useState<AdminTeamRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchLiveState = useCallback(async () => {
    try {
      const [statsRes, teamsRes] = await Promise.all([
        fetch("/api/admin/stats", { cache: "no-store" }),
        fetch("/api/admin/teams", { cache: "no-store" }),
      ]);

      if (!statsRes.ok || !teamsRes.ok) {
        if (statsRes.status === 401 || teamsRes.status === 401) {
          router.push("/admin/login");
          return;
        }
        throw new Error("HTTP state fetch error");
      }

      const statsData = await statsRes.json();
      const teamsData = await teamsRes.json();

      setStats(statsData);
      setTeams(teamsData.teams || []);
      setError(null);
    } catch {
      setError("COMMUNICATION INTERRUPTED: RETRYING AUTOMATICALLY...");
    }
  }, [router]);

  // Poll every 3 seconds for live situational awareness, paused when tab is hidden
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const startPolling = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        if (!document.hidden) {
          void fetchLiveState();
        }
      }, 3000);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void fetchLiveState();
        startPolling();
      } else {
        if (timer) clearInterval(timer);
      }
    };

    const initialTimer = setTimeout(() => {
      void fetchLiveState();
    }, 0);

    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(initialTimer);
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchLiveState]);

  const currentStatus = stats?.gameStatus ?? "waiting";

  return (
    <div className="min-h-screen bg-background text-text font-mono flex flex-col">
      {/* Persistent Header */}
      <AdminHeader
        currentStatus={currentStatus}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Tab Area */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        {error && (
          <div className="mb-6 border border-emergency-red/60 bg-emergency-red/10 p-2.5 text-xs text-emergency-red">
            [WARNING: {error}]
          </div>
        )}

        {activeTab === "OVERVIEW" && (
          <TabOverview stats={stats} onRefresh={fetchLiveState} />
        )}

        {activeTab === "TEAMS" && (
          <TabTeams
            teams={teams}
            gameStatus={currentStatus}
            serverTime={stats?.serverTime}
            onRefresh={fetchLiveState}
          />
        )}

        {activeTab === "ATTEMPTS" && <TabAttempts teams={teams} />}

        {activeTab === "SETTINGS" && (
          <TabSettings
            leaderboardVisible={Boolean(stats?.leaderboardVisible)}
            toolsEnabled={stats?.toolsEnabled !== false}
            onRefresh={fetchLiveState}
          />
        )}
      </main>

      {/* Sub-footer */}
      <footer className="border-t border-border/40 py-3 text-center text-[11px] text-text/40 tracking-wider uppercase select-none">
        RESEARCH DIRECTOR TERMINAL · REFRESH FREQUENCY 3000MS · CLASSIFIED CLEARANCE ACTIVE
      </footer>
    </div>
  );
}

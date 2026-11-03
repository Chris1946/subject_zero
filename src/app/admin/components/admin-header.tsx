"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type AdminTab = "OVERVIEW" | "TEAMS" | "ATTEMPTS" | "SETTINGS";

interface AdminHeaderProps {
  currentStatus: string;
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

export function AdminHeader({
  currentStatus,
  activeTab,
  onTabChange,
}: AdminHeaderProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // Continue to redirect regardless
    }
    router.push("/admin/login");
  }

  // Status Badge styling:
  // green WAITING, pulse red RUNNING, amber PAUSED, dim grey ENDED
  let badgeClasses = "border-panel text-text/50";
  let statusText = "DISCONNECTED";

  switch (currentStatus) {
    case "waiting":
      badgeClasses = "border-success/60 text-success bg-success/10";
      statusText = "WAITING";
      break;
    case "running":
      badgeClasses = "border-emergency-red text-emergency-red bg-emergency-red/10 animate-pulse";
      statusText = "RUNNING";
      break;
    case "paused":
      badgeClasses = "border-amber-500/80 text-amber-400 bg-amber-500/10";
      statusText = "PAUSED";
      break;
    case "ended":
      badgeClasses = "border-border text-text/40 bg-panel/30";
      statusText = "ENDED";
      break;
  }

  const tabs: AdminTab[] = ["OVERVIEW", "TEAMS", "ATTEMPTS", "SETTINGS"];

  return (
    <header className="border-b border-border bg-panel/80 px-4 sm:px-8 py-3.5 select-none sticky top-0 z-40 backdrop-blur-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Title & Status Badge */}
        <div className="flex items-center gap-3">
          <div>
            <div className="text-[10px] text-emergency-red font-bold uppercase tracking-widest">
              SUBJECT ZERO // DIRECTOR CONTROL
            </div>
            <h1 className="text-sm sm:text-base font-bold text-text uppercase tracking-wider">
              FACILITY CONTROLLER
            </h1>
          </div>

          <div
            className={`px-2.5 py-1 text-[11px] font-mono font-bold tracking-widest border uppercase flex items-center gap-1.5 ${badgeClasses}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {statusText}
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0" aria-label="Admin Navigation Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onTabChange(tab)}
                className={`px-3 py-1.5 text-xs font-mono font-semibold tracking-wider uppercase transition-colors border ${
                  isActive
                    ? "border-emergency-red bg-emergency-red/10 text-text"
                    : "border-transparent text-text/60 hover:text-text hover:bg-panel"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </nav>

        {/* Sign Out Button */}
        <div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="px-3 py-1 text-xs border border-border text-text/60 hover:text-emergency-red hover:border-emergency-red/60 transition-colors uppercase tracking-widest disabled:opacity-40"
          >
            {loggingOut ? "TERMINATING..." : "SIGN OUT"}
          </button>
        </div>
      </div>
    </header>
  );
}

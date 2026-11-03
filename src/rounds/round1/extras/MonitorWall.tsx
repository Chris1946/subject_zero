"use client";

import React from "react";

export interface MonitorWallProps {
  serverProgress?: number; // Raw progress from server (0..20)
  className?: string;
  [key: string]: unknown;
}

export function MonitorWall({ serverProgress = 0, className = "" }: MonitorWallProps) {
  // Round 1 monitors correspond to questions 1.1 (prog>=1), 1.2 (prog>=2), 1.3 (prog>=3), 1.4 (prog>=4)
  const monitors = [
    { id: 1, label: "CAM 01 // ENTRY", solved: serverProgress >= 1 },
    { id: 2, label: "CAM 02 // LOG RACK", solved: serverProgress >= 2 },
    { id: 3, label: "CAM 03 // RELAY", solved: serverProgress >= 3 },
    { id: 4, label: "CAM 04 // CONTAINMENT", solved: serverProgress >= 4 },
  ];

  return (
    <div
      className={`w-full border border-[var(--panel-border)] bg-[var(--panel)]/70 p-2 sm:p-3 rounded-xs font-mono select-none ${className}`}
      aria-label="Sector 1 CCTV Monitor Wall Progress"
    >
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[var(--panel-border)]/50 text-[10px] tracking-widest uppercase">
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-muted)] font-bold">
            MONITOR WALL // POWER-ON TELEMETRY:
          </span>
          <span className="text-[var(--accent)] font-semibold">
            [{monitors.filter((m) => m.solved).length} / 4 POWERED]
          </span>
        </div>

        {/* Small orange warning light blinks very slowly (>= 2s per cycle, static under reduced motion) */}
        <div
          className="flex items-center gap-1.5"
          title="Facility Sector Status Indicator"
        >
          <span className="w-2 h-2 rounded-full bg-[#ff7a1a] shadow-[0_0_6px_#ff7a1a] r1-slow-warn-light" />
          <span className="text-[9px] text-[#ff7a1a] font-semibold hidden sm:inline">
            AUX WARN
          </span>
        </div>
      </div>

      {/* 4 Monitor Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {monitors.map((mon) => (
          <div
            key={mon.id}
            className={`p-2 border rounded-xs transition-all duration-700 flex flex-col justify-between h-16 sm:h-20 ${
              mon.solved
                ? "border-[var(--accent)]/70 bg-[#051f28]/90 text-[var(--accent)] shadow-[0_0_12px_rgba(62,230,200,0.2)]"
                : "border-[var(--panel-border)]/60 bg-[#03080b]/90 text-[var(--text-muted)]/40"
            }`}
          >
            <div className="flex items-center justify-between text-[8px] sm:text-[9px] tracking-wider uppercase font-semibold">
              <span className="truncate">{mon.label}</span>
              <span>{mon.solved ? "● ON" : "○ OFF"}</span>
            </div>

            {/* Monitor Screen Area */}
            <div className="flex-1 flex items-center justify-center my-1 overflow-hidden relative">
              {mon.solved ? (
                /* Frozen corridor placeholder SVG schematic */
                <svg
                  className="w-full h-full opacity-60"
                  viewBox="0 0 100 40"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Perspective corridor lines */}
                  <line x1="0" y1="0" x2="35" y2="15" stroke="currentColor" strokeWidth="0.8" />
                  <line x1="100" y1="0" x2="65" y2="15" stroke="currentColor" strokeWidth="0.8" />
                  <line x1="0" y1="40" x2="35" y2="25" stroke="currentColor" strokeWidth="0.8" />
                  <line x1="100" y1="40" x2="65" y2="25" stroke="currentColor" strokeWidth="0.8" />
                  {/* End doorway */}
                  <rect
                    x="35"
                    y="15"
                    width="30"
                    height="10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.8"
                  />
                  <line x1="50" y1="15" x2="50" y2="25" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" />
                </svg>
              ) : (
                /* Static offline bar */
                <div className="text-[8px] text-[var(--text-muted)]/30 tracking-widest">
                  [STANDBY]
                </div>
              )}
            </div>

            <div className="text-[7px] sm:text-[8px] tracking-widest text-right opacity-60">
              {mon.solved ? "FEED ARCHIVED" : "NO SIGNAL"}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes slowWarnBlink {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }
        .r1-slow-warn-light {
          animation: slowWarnBlink 2.5s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .r1-slow-warn-light {
            animation: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}

export default MonitorWall;

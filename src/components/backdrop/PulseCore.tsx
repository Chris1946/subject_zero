import React from "react";

export function PulseCore() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none flex items-center justify-center">
      {/* Central Heartbeat Radial Glow Ring 1 */}
      <div
        className="pulse-core-ring absolute rounded-full w-[480px] h-[480px] sm:w-[680px] sm:h-[680px]"
        style={{
          background: `radial-gradient(circle, var(--theme-accent, #7dffb0) 0%, transparent 70%)`,
          opacity: 0.08,
          filter: "blur(40px)",
        }}
      />

      {/* Heartbeat Wave Ring 2 (Inner pulse) */}
      <div
        className="pulse-core-wave absolute rounded-full w-[260px] h-[260px] sm:w-[380px] sm:h-[380px]"
        style={{
          border: "1px solid var(--theme-accent, #7dffb0)",
          opacity: 0.12,
        }}
      />

      {/* Cyber AI Reticle SVG */}
      <svg
        className="absolute w-64 h-64 opacity-[0.08] pointer-events-none"
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        <circle cx="50" cy="50" r="42" fill="none" stroke="var(--theme-accent, #7dffb0)" strokeWidth="0.5" strokeDasharray="4 4" />
        <circle cx="50" cy="50" r="28" fill="none" stroke="var(--theme-accent, #7dffb0)" strokeWidth="0.5" strokeDasharray="2 6" />
        <line x1="50" y1="5" x2="50" y2="20" stroke="var(--theme-accent, #7dffb0)" strokeWidth="0.5" />
        <line x1="50" y1="80" x2="50" y2="95" stroke="var(--theme-accent, #7dffb0)" strokeWidth="0.5" />
        <line x1="5" y1="50" x2="20" y2="50" stroke="var(--theme-accent, #7dffb0)" strokeWidth="0.5" />
        <line x1="80" y1="50" x2="95" y2="50" stroke="var(--theme-accent, #7dffb0)" strokeWidth="0.5" />
      </svg>
    </div>
  );
}

export default PulseCore;

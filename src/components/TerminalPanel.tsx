"use client";

import React from "react";

interface TerminalPanelProps {
  children: React.ReactNode;
  className?: string;
  suppressHydrationWarning?: boolean;
}

export function TerminalPanel({
  children,
  className = "",
  suppressHydrationWarning,
}: TerminalPanelProps) {
  return (
    <div
      suppressHydrationWarning={suppressHydrationWarning}
      className={`relative border border-[var(--panel-border)] bg-[var(--panel)]/80 p-6 md:p-8 shadow-2xl backdrop-blur-xs overflow-hidden transition-all duration-300 ${className}`}
      style={{
        boxShadow:
          "0 0 var(--theme-glow-radius, 12px) rgba(0,0,0,0.5), inset 0 0 1px var(--panel-border)",
      }}
    >
      {/* Subtle CRT scanline overlay scaled by theme effects */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,22,27,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px]"
        style={{ opacity: "var(--theme-scanline-opacity, 0.1)" }}
      />

      {/* Subtle vignette shadow scaled by theme effects */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          boxShadow:
            "inset 0 0 calc(var(--theme-vignette-strength, 0.6) * 80px) rgba(0, 0, 0, 0.7)",
        }}
      />

      {/* Content wrapper */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

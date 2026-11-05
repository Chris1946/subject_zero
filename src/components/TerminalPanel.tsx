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
      className={`relative border border-[var(--panel-border)] bg-[var(--panel)]/90 p-6 md:p-8 shadow-2xl backdrop-blur-xs overflow-hidden transition-all duration-300 pixel-corners ${className}`}
      style={{
        boxShadow:
          "0 0 var(--theme-glow-radius, 14px) rgba(80,0,0,0.4), inset 0 0 1px rgba(255,69,0,0.3), 0 0 40px rgba(120,0,0,0.15)",
      }}
    >
      {/* Halloween warm scanline overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(rgba(50,0,0,0) 50%, rgba(10,0,0,0.35) 50%)",
          backgroundSize: "100% 4px",
          opacity: "var(--theme-scanline-opacity, 0.12)",
        }}
      />

      {/* Subtle 8-bit pixel grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(80,0,0,0.05) 1px, transparent 1px), linear-gradient(rgba(80,0,0,0.05) 1px, transparent 1px)",
          backgroundSize: "8px 8px",
          opacity: 0.6,
        }}
      />

      {/* Vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          boxShadow:
            "inset 0 0 calc(var(--theme-vignette-strength, 0.7) * 80px) rgba(0, 0, 0, 0.8)",
        }}
      />

      {/* Pixel corner accent brackets */}
      <div aria-hidden="true" className="pointer-events-none absolute top-0 left-0 w-3 h-[1px] bg-accent opacity-50" />
      <div aria-hidden="true" className="pointer-events-none absolute top-0 left-0 w-[1px] h-3 bg-accent opacity-50" />
      <div aria-hidden="true" className="pointer-events-none absolute top-0 right-0 w-3 h-[1px] bg-accent opacity-50" />
      <div aria-hidden="true" className="pointer-events-none absolute top-0 right-0 w-[1px] h-3 bg-accent opacity-50" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 w-3 h-[1px] bg-accent opacity-50" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 w-[1px] h-3 bg-accent opacity-50" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 w-3 h-[1px] bg-accent opacity-50" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-0 w-[1px] h-3 bg-accent opacity-50" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

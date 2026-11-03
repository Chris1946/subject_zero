"use client";

import React from "react";

export interface Round2SceneProps {
  imageSrc?: string;
  className?: string;
  alt?: string;
}

export function Round2Scene({
  imageSrc,
  className = "",
  alt = "Network Infrastructure Hub",
}: Round2SceneProps) {
  if (imageSrc) {
    return (
      <div className={`relative w-full h-48 sm:h-56 md:h-64 overflow-hidden border border-[var(--panel-border)] ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt={alt}
          className="w-full h-full object-cover object-center filter contrast-125 brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-transparent to-transparent opacity-80" />
      </div>
    );
  }

  // Atmospheric CSS/SVG Network Infrastructure Hub fallback scene
  return (
    <div
      className={`relative w-full h-48 sm:h-56 md:h-64 overflow-hidden border border-[var(--panel-border)] bg-[#0d0620] select-none ${className}`}
      aria-label={alt}
      role="img"
    >
      <svg
        viewBox="0 0 800 300"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full opacity-65"
      >
        <defs>
          <linearGradient id="netHubGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0d0620" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Network Switches Left */}
        <g stroke="#381775" strokeWidth="1.5" fill="#120826">
          <rect x="50" y="40" width="100" height="220" rx="2" />
          <line x1="50" y1="80" x2="150" y2="80" />
          <line x1="50" y1="120" x2="150" y2="120" />
          <line x1="50" y1="160" x2="150" y2="160" />
          <line x1="50" y1="200" x2="150" y2="200" />
          <circle cx="70" cy="60" r="2.5" fill="#c084fc" />
          <circle cx="85" cy="60" r="2.5" fill="#38bdf8" />
          <circle cx="100" cy="60" r="2.5" fill="#4ade80" />
        </g>

        {/* Network Switches Right */}
        <g stroke="#381775" strokeWidth="1.5" fill="#120826">
          <rect x="650" y="40" width="100" height="220" rx="2" />
          <line x1="650" y1="80" x2="750" y2="80" />
          <line x1="650" y1="120" x2="750" y2="120" />
          <line x1="650" y1="160" x2="750" y2="160" />
          <line x1="650" y1="200" x2="750" y2="200" />
          <circle cx="670" cy="60" r="2.5" fill="#c084fc" />
          <circle cx="685" cy="60" r="2.5" fill="#38bdf8" />
        </g>

        {/* Central Fiber Optic Router Terminal */}
        <rect x="300" y="70" width="200" height="160" fill="url(#netHubGlow)" stroke="#c084fc" strokeWidth="1.5" rx="3" />
        <circle cx="400" cy="150" r="45" fill="#180b33" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 3" />
        <circle cx="400" cy="150" r="20" fill="#c084fc" opacity="0.8" className="animate-pulse" />

        {/* Data bus routing traces */}
        <path d="M150 100 C 220 100, 260 120, 300 120" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 4" opacity="0.7" />
        <path d="M150 180 C 220 180, 260 160, 300 160" fill="none" stroke="#c084fc" strokeWidth="1.5" strokeDasharray="3 4" opacity="0.7" />
        <path d="M650 100 C 580 100, 540 120, 500 120" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 4" opacity="0.7" />
        <path d="M650 180 C 580 180, 540 160, 500 160" fill="none" stroke="#c084fc" strokeWidth="1.5" strokeDasharray="3 4" opacity="0.7" />
      </svg>

      {/* Narrative Badge */}
      <div className="absolute top-2.5 left-3 px-2 py-0.5 bg-[var(--bg)]/90 border border-[var(--panel-border)] text-[9px] font-mono text-[var(--accent)] uppercase tracking-widest">
        SEC-02 // FIBER NETWORK HUB
      </div>
    </div>
  );
}

export default Round2Scene;

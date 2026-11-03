"use client";

import React from "react";

export interface Round3SceneProps {
  imageSrc?: string;
  className?: string;
  alt?: string;
}

export function Round3Scene({
  imageSrc,
  className = "",
  alt = "Central AI Core Security Overview",
}: Round3SceneProps) {
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

  // Atmospheric CSS/SVG Central AI Core fallback scene
  return (
    <div
      className={`relative w-full h-48 sm:h-56 md:h-64 overflow-hidden border border-[var(--panel-border)] bg-[#021a0c] select-none ${className}`}
      aria-label={alt}
      role="img"
    >
      <svg
        viewBox="0 0 800 300"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full opacity-70"
      >
        <defs>
          <linearGradient id="aiCoreGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7dffb0" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#021a0c" stopOpacity="0.9" />
          </linearGradient>
          <radialGradient id="aiPulseCenter" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7dffb0" stopOpacity="0.8" />
            <stop offset="40%" stopColor="#0a3d1f" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#021a0c" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Server Racks Left */}
        <g stroke="#124e29" strokeWidth="1.5" fill="#041d0e">
          <rect x="60" y="40" width="80" height="220" rx="2" />
          <line x1="60" y1="80" x2="140" y2="80" />
          <line x1="60" y1="120" x2="140" y2="120" />
          <line x1="60" y1="160" x2="140" y2="160" />
          <line x1="60" y1="200" x2="140" y2="200" />
          {/* Server LEDs */}
          <circle cx="75" cy="60" r="2" fill="#7dffb0" />
          <circle cx="85" cy="60" r="2" fill="#7dffb0" />
          <circle cx="75" cy="100" r="2" fill="#ff7a1a" />
          <circle cx="85" cy="100" r="2" fill="#7dffb0" />
        </g>

        {/* Server Racks Right */}
        <g stroke="#124e29" strokeWidth="1.5" fill="#041d0e">
          <rect x="660" y="40" width="80" height="220" rx="2" />
          <line x1="660" y1="80" x2="740" y2="80" />
          <line x1="660" y1="120" x2="740" y2="120" />
          <line x1="660" y1="160" x2="740" y2="160" />
          <line x1="660" y1="200" x2="740" y2="200" />
          <circle cx="675" cy="60" r="2" fill="#7dffb0" />
          <circle cx="685" cy="60" r="2" fill="#7dffb0" />
          <circle cx="675" cy="140" r="2" fill="#7dffb0" />
        </g>

        {/* Central Cylindrical AI Reactor Core */}
        <ellipse cx="400" cy="80" rx="90" ry="25" fill="#052613" stroke="#7dffb0" strokeWidth="2" />
        <rect x="310" y="80" width="180" height="150" fill="url(#aiCoreGlow)" stroke="#124e29" strokeWidth="1.5" />
        <ellipse cx="400" cy="230" rx="90" ry="25" fill="#041d0e" stroke="#7dffb0" strokeWidth="2" />

        {/* Central Pulsing Heartbeat Aura */}
        <circle cx="400" cy="155" r="70" fill="url(#aiPulseCenter)" className="animate-pulse" />

        {/* Optical Conduit Streams */}
        <path d="M140 100 Q 250 80, 310 120" fill="none" stroke="#7dffb0" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.7" />
        <path d="M660 100 Q 550 80, 490 120" fill="none" stroke="#7dffb0" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.7" />
        <path d="M140 180 Q 250 200, 310 170" fill="none" stroke="#7dffb0" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.7" />
        <path d="M660 180 Q 550 200, 490 170" fill="none" stroke="#7dffb0" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.7" />
      </svg>

      {/* Narrative Overlay Badge */}
      <div className="absolute top-2.5 left-3 px-2 py-0.5 bg-[var(--bg)]/90 border border-[var(--panel-border)] text-[9px] font-mono text-[var(--accent)] uppercase tracking-widest">
        SEC-03 // AI CORE DATA ARCHIVE
      </div>
    </div>
  );
}

export default Round3Scene;

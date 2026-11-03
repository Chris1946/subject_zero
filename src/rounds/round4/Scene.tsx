"use client";

import React from "react";

export interface Round4SceneProps {
  imageSrc?: string;
  className?: string;
  alt?: string;
}

export function Round4Scene({
  imageSrc,
  className = "",
  alt = "Classified Archive & Mainframe Crypt",
}: Round4SceneProps) {
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

  // Atmospheric CSS/SVG Classified Research Archive fallback scene
  return (
    <div
      className={`relative w-full h-48 sm:h-56 md:h-64 overflow-hidden border border-[var(--panel-border)] bg-[#100903] select-none ${className}`}
      aria-label={alt}
      role="img"
    >
      <svg
        viewBox="0 0 800 300"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full opacity-60"
      >
        <defs>
          <linearGradient id="archiveDust" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffb020" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#100903" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Archive Shelving Stacks Left */}
        <g stroke="#4a2a11" strokeWidth="1.5" fill="#1f1307">
          <rect x="40" y="30" width="120" height="240" rx="2" />
          <line x1="40" y1="70" x2="160" y2="70" />
          <line x1="40" y1="110" x2="160" y2="110" />
          <line x1="40" y1="150" x2="160" y2="150" />
          <line x1="40" y1="190" x2="160" y2="190" />
          <line x1="40" y1="230" x2="160" y2="230" />
          {/* File Dossier Boxes */}
          <rect x="50" y="40" width="20" height="25" fill="#3a2008" />
          <rect x="75" y="40" width="20" height="25" fill="#3a2008" />
          <rect x="50" y="80" width="25" height="25" fill="#ffb020" fillOpacity="0.3" />
        </g>

        {/* Archive Shelving Stacks Right */}
        <g stroke="#4a2a11" strokeWidth="1.5" fill="#1f1307">
          <rect x="640" y="30" width="120" height="240" rx="2" />
          <line x1="640" y1="70" x2="760" y2="70" />
          <line x1="640" y1="110" x2="760" y2="110" />
          <line x1="640" y1="150" x2="760" y2="150" />
          <line x1="640" y1="190" x2="760" y2="190" />
        </g>

        {/* Center Crypt Vault Door */}
        <circle cx="400" cy="150" r="85" fill="#180e05" stroke="#ffb020" strokeWidth="2" strokeDasharray="6 4" />
        <circle cx="400" cy="150" r="50" fill="#0d0702" stroke="#4a2a11" strokeWidth="3" />
        <line x1="400" y1="70" x2="400" y2="230" stroke="#ffb020" strokeWidth="1.5" opacity="0.4" />
        <line x1="320" y1="150" x2="480" y2="150" stroke="#ffb020" strokeWidth="1.5" opacity="0.4" />
      </svg>

      {/* Narrative Badge */}
      <div className="absolute top-2.5 left-3 px-2 py-0.5 bg-[var(--bg)]/90 border border-[var(--panel-border)] text-[9px] font-mono text-[var(--accent)] uppercase tracking-widest">
        SEC-04 // CLASSIFIED ARCHIVE CRYPT
      </div>
    </div>
  );
}

export default Round4Scene;

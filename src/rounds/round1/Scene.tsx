"use client";

import React, { useState } from "react";

interface SceneProps {
  imageSrc?: string;
  alt?: string;
  className?: string;
}

export function Round1Scene({
  imageSrc,
  alt = "Monitoring Station Security Overview",
  className = "",
}: SceneProps) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div
      className={`relative w-full h-48 sm:h-64 md:h-72 border border-[var(--panel-border)] bg-[#040e14] overflow-hidden rounded-xs select-none ${className}`}
      role="img"
      aria-label={alt}
    >
      {/* If real image provided and hasn't failed to load, show it */}
      {imageSrc && !imgFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={alt}
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        /* CSS & SVG-drawn Atmospheric Placeholder Scene */
        /* Rows of dark monitors, one glowing terminal, dust motes */
        <div className="absolute inset-0 flex flex-col justify-between p-4 overflow-hidden">
          {/* Subtle CRT raster background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(rgba(18,22,27,0) 50%, rgba(0,0,0,0.5) 50%)",
              backgroundSize: "100% 4px",
            }}
          />

          {/* Wall of Dark Monitors SVG Grid */}
          <svg
            className="absolute inset-0 w-full h-full opacity-60"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <pattern
                id="r1-monitor-grid"
                width="80"
                height="50"
                patternUnits="userSpaceOnUse"
              >
                {/* Monitor frame */}
                <rect
                  x="4"
                  y="4"
                  width="72"
                  height="42"
                  rx="3"
                  fill="#061219"
                  stroke="#102a35"
                  strokeWidth="1.5"
                />
                {/* Powered-off screen inner glass */}
                <rect
                  x="8"
                  y="8"
                  width="64"
                  height="34"
                  rx="1"
                  fill="#03080b"
                />
                {/* Faint static horizontal scan line */}
                <line
                  x1="8"
                  y1="25"
                  x2="72"
                  y2="25"
                  stroke="#081e28"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#r1-monitor-grid)" />
          </svg>

          {/* ONE Active Glowing Terminal in the Center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 sm:w-56 h-28 sm:h-36 bg-[#03151b] border-2 border-[#3ee6c8]/80 rounded-sm shadow-[0_0_24px_rgba(62,230,200,0.35)] flex flex-col justify-between p-2.5 z-10 font-mono text-[9px] sm:text-[10px]">
            <div className="flex items-center justify-between text-[#3ee6c8]/80 border-b border-[#3ee6c8]/30 pb-1">
              <span className="font-bold tracking-wider">TERMINAL 01</span>
              <span className="animate-pulse">● LIVE</span>
            </div>

            <div className="text-[#3ee6c8] space-y-1 my-auto">
              <div className="font-bold tracking-widest text-xs">
                TIMESTAMP: 23:47:12
              </div>
              <div className="text-[8px] sm:text-[9px] text-[#3ee6c8]/70">
                CONTAINMENT SUBNET: ACTIVE
              </div>
              <div className="text-[8px] sm:text-[9px] text-[#ff7a1a] flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ff7a1a] animate-pulse" />
                <span>SEC-OVERRIDE DETECTED</span>
              </div>
            </div>

            <div className="text-[8px] text-[#3ee6c8]/50 flex justify-between tracking-widest">
              <span>LOC: R01-MONITOR</span>
              <span>STANDBY</span>
            </div>
          </div>

          {/* Vignette Shadow */}
          <div
            className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.9)]"
            aria-hidden="true"
          />

          {/* Dust & Desolation Label */}
          <div className="relative z-20 flex justify-between items-end text-[9px] tracking-widest text-[var(--text-muted)]/60 uppercase">
            <span>HOLLOWAY // SECTOR 1 MONITORS</span>
            <span>POWER LEVEL: 12%</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Round1Scene;

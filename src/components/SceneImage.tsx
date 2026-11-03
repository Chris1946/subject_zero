"use client";

import React, { useState } from "react";
import Image from "next/image";
import { getSceneConfig } from "@/lib/scenes";
import { Round1Scene } from "@/rounds/round1/Scene";

interface SceneImageProps {
  sceneKey?: string;
  title?: string;
  priority?: boolean;
  className?: string;
}

export function SceneImage({
  sceneKey,
  title,
  priority = false,
  className = "",
}: SceneImageProps) {
  const [loadError, setLoadError] = useState(false);
  const scene = getSceneConfig(sceneKey);

  // Round 1 Monitoring Station: Uses the CSS/SVG-drawn placeholder scene fallback
  if (sceneKey === "round1_monitoring_station") {
    return (
      <Round1Scene
        imageSrc={scene && !loadError ? scene.src : undefined}
        alt={title || "Monitoring Station Security Overview"}
        className={className}
      />
    );
  }

  // Fallback gradient display when image is missing or failed to load
  if (!scene || loadError) {
    return (
      <div
        className={`w-full h-48 sm:h-64 border border-[var(--panel-border)] bg-gradient-to-b from-[var(--bg)] via-[var(--panel)]/40 to-[var(--bg)] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden select-none ${className}`}
        role="img"
        aria-label={title || "Facility Security Feed"}
      >
        {/* Subtle scanline overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40" />
        <div className="relative z-10 space-y-1.5">
          <span className="text-[10px] sm:text-xs text-[var(--accent)] uppercase tracking-widest block font-mono font-bold">
            [FACILITY MONITORING FEED // STANDBY]
          </span>
          <span className="text-sm sm:text-base font-bold text-[var(--text)] uppercase tracking-wider font-mono">
            {title || sceneKey?.replace(/_/g, " ").toUpperCase() || "HOLLOWAY RESEARCH ARCHIVE"}
          </span>
          <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest block font-mono">
            OPTICAL FEED RESTRICTED · RECOVERING SIGNAL
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full h-48 sm:h-64 border border-[var(--panel-border)] relative overflow-hidden bg-[var(--bg)] select-none ${className}`}
    >
      {/* Background Image with subtle cinematic zoom (disabled under prefers-reduced-motion) */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={scene.src}
          alt={scene.alt}
          width={1600}
          height={900}
          priority={priority}
          onError={() => setLoadError(true)}
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iOSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTYiIGhlaWdodD0iOSIgZmlsbD0iIzBhMGIwZSIvPjwvc3ZnPg=="
          className="w-full h-full object-cover opacity-85 transition-transform duration-1000 motion-safe:scale-105 motion-safe:animate-[pulse_10s_ease-in-out_infinite]"
        />
      </div>

      {/* Atmospheric Vignette Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(10,11,14,0.9)_100%)] pointer-events-none" />

      {/* Subtle Scanlines Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] pointer-events-none opacity-40" />

      {/* Overlay Text Gradient backing ensuring >= 4.5:1 contrast */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)]/80 to-transparent p-4 pointer-events-none">
        <div className="flex items-center justify-between text-[11px] font-mono tracking-wider">
          <span className="text-[var(--accent)] uppercase font-bold drop-shadow-sm">
            {scene.title}
          </span>
          <span className="text-[var(--text-muted)] uppercase text-[10px] hidden sm:inline">
            ARCHIVE FEED SZ-7
          </span>
        </div>
      </div>
    </div>
  );
}

export default SceneImage;

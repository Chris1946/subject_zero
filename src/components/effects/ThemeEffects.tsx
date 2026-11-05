"use client";

import React, { useEffect, useState, useRef } from "react";
import { ThemeEffects as ThemeEffectsType } from "@/theme/rounds";

interface ThemeEffectsProps {
  effects: ThemeEffectsType;
  reducedMotion?: boolean;
}

export function ThemeEffects({ effects, reducedMotion = false }: ThemeEffectsProps) {
  const [flickering, setFlickering] = useState(false);
  const lastTypingTimeRef = useRef<number>(0);

  const isFlickeringActive = !reducedMotion && effects.flickerLevel > 0 && flickering;

  // Track typing to suppress flicker during input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        lastTypingTimeRef.current = Date.now();
      }
    };
    window.addEventListener("keydown", handleKeyDown, { passive: true });
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Flicker interval
  useEffect(() => {
    if (reducedMotion || effects.flickerLevel === 0) return;

    const baseIntervalMs =
      effects.flickerLevel === 1 ? 60000 :
      effects.flickerLevel === 2 ? 40000 : 25000;

    let timeoutId: NodeJS.Timeout | null = null;
    let resetTimerId: NodeJS.Timeout | null = null;

    const scheduleNextFlicker = () => {
      const jitter = (Math.random() - 0.5) * 0.3 * baseIntervalMs;
      const delay = Math.max(20000, baseIntervalMs + jitter);

      timeoutId = setTimeout(() => {
        const timeSinceTyping = Date.now() - lastTypingTimeRef.current;
        if (timeSinceTyping > 3000 && !document.hidden) {
          setFlickering(true);
          resetTimerId = setTimeout(() => setFlickering(false), 75);
        }
        scheduleNextFlicker();
      }, delay);
    };

    scheduleNextFlicker();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (resetTimerId) clearTimeout(resetTimerId);
    };
  }, [effects.flickerLevel, reducedMotion]);

  return (
    <>
      {/* 1. Halloween Scanlines — warm blood-red tint */}
      <div
        className="fixed inset-0 pointer-events-none z-10 select-none"
        style={{
          opacity: reducedMotion ? 0 : effects.scanlineOpacity,
          backgroundImage:
            "linear-gradient(rgba(80, 0, 0, 0) 50%, rgba(20, 0, 0, 0.5) 50%)",
          backgroundSize: "100% 4px",
        }}
        aria-hidden="true"
      />

      {/* 2. Pixel grid overlay — subtle 8-bit grid feel */}
      <div
        className="fixed inset-0 pointer-events-none z-10 select-none"
        style={{
          opacity: reducedMotion ? 0 : effects.scanlineOpacity * 0.4,
          backgroundImage:
            "linear-gradient(90deg, rgba(80,0,0,0.08) 1px, transparent 1px), linear-gradient(rgba(80,0,0,0.08) 1px, transparent 1px)",
          backgroundSize: "8px 8px",
        }}
        aria-hidden="true"
      />

      {/* 3. Deep vignette — corner darkness */}
      <div
        className="fixed inset-0 pointer-events-none z-10 select-none"
        style={{
          boxShadow: `inset 0 0 calc(${effects.vignetteStrength} * 160px) rgba(0, 0, 0, 0.92)`,
        }}
        aria-hidden="true"
      />

      {/* 4. Film grain — warm orange-tinted noise */}
      <div
        className="fixed inset-0 pointer-events-none z-10 select-none"
        style={{
          opacity: reducedMotion ? 0 : effects.grainOpacity,
          mixBlendMode: "screen",
        }}
        aria-hidden="true"
      >
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <filter id="theme-film-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.75"
              numOctaves="4"
              stitchTiles="stitch"
            />
            <feColorMatrix
              type="matrix"
              values="1.2 0 0 0 0.15
                      0 0.6 0 0 0
                      0 0 0.4 0 0
                      0 0 0  18 -7"
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#theme-film-grain)" />
        </svg>
      </div>

      {/* 5. CRT scan band — slow moving bright line */}
      {!reducedMotion && (
        <div
          className="crt-scan-band fixed left-0 right-0 h-[3px] pointer-events-none z-10 select-none"
          style={{
            background:
              "linear-gradient(transparent, rgba(255, 80, 0, 0.06) 50%, transparent)",
            height: "80px",
            top: 0,
          }}
          aria-hidden="true"
        />
      )}

      {/* 6. Voltage flicker overlay */}
      <div
        className={`fixed inset-0 pointer-events-none z-20 transition-opacity duration-75 select-none ${
          isFlickeringActive ? "opacity-100" : "opacity-0"
        }`}
        style={{ backgroundColor: "rgba(80, 0, 0, 0.08)" }}
        aria-hidden="true"
      />

      {/* 7. Corner pixel brackets — Halloween terminal frame */}
      {!reducedMotion && (
        <>
          {/* Top-left */}
          <div className="fixed top-3 left-3 pointer-events-none z-10 select-none" aria-hidden="true">
            <div className="w-5 h-[2px] bg-[#ff4500] opacity-30" />
            <div className="w-[2px] h-5 bg-[#ff4500] opacity-30 mt-0" />
          </div>
          {/* Top-right */}
          <div className="fixed top-3 right-3 pointer-events-none z-10 select-none flex flex-col items-end" aria-hidden="true">
            <div className="w-5 h-[2px] bg-[#ff4500] opacity-30" />
            <div className="w-[2px] h-5 bg-[#ff4500] opacity-30" />
          </div>
          {/* Bottom-left */}
          <div className="fixed bottom-3 left-3 pointer-events-none z-10 select-none flex flex-col-reverse" aria-hidden="true">
            <div className="w-5 h-[2px] bg-[#ff4500] opacity-30" />
            <div className="w-[2px] h-5 bg-[#ff4500] opacity-30" />
          </div>
          {/* Bottom-right */}
          <div className="fixed bottom-3 right-3 pointer-events-none z-10 select-none flex flex-col-reverse items-end" aria-hidden="true">
            <div className="w-5 h-[2px] bg-[#ff4500] opacity-30" />
            <div className="w-[2px] h-5 bg-[#ff4500] opacity-30" />
          </div>
        </>
      )}
    </>
  );
}

export default ThemeEffects;

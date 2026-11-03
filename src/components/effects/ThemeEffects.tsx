"use client";

import React, { useEffect, useState, useRef } from "react";
import { ThemeEffects as ThemeEffectsType } from "@/theme/rounds";

interface ThemeEffectsProps {
  effects: ThemeEffectsType;
  reducedMotion?: boolean;
}

export function ThemeEffects({ effects, reducedMotion = false }: ThemeEffectsProps) {
  // Flicker state (brightness dip < 10%)
  const [flickering, setFlickering] = useState(false);
  const lastTypingTimeRef = useRef<number>(0);

  // Active flicker check respects reduced motion and level 0
  const isFlickeringActive = !reducedMotion && effects.flickerLevel > 0 && flickering;

  // Track user typing to guarantee NO flicker during typing
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
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Flicker interval timer
  useEffect(() => {
    if (reducedMotion || effects.flickerLevel === 0) {
      return;
    }

    // Interval based on flicker level (Level 1: ~60s, Level 2: ~40s, Level 3: ~25s)
    const baseIntervalMs =
      effects.flickerLevel === 1
        ? 60000
        : effects.flickerLevel === 2
        ? 40000
        : 25000;

    let timeoutId: NodeJS.Timeout | null = null;
    let resetTimerId: NodeJS.Timeout | null = null;

    const scheduleNextFlicker = () => {
      // Jitter by +/- 15% to feel organic rather than metronomic
      const jitter = (Math.random() - 0.5) * 0.3 * baseIntervalMs;
      const delay = Math.max(20000, baseIntervalMs + jitter);

      timeoutId = setTimeout(() => {
        // Never flicker if typing occurred in the last 3000ms
        const timeSinceTyping = Date.now() - lastTypingTimeRef.current;
        if (timeSinceTyping > 3000 && !document.hidden) {
          setFlickering(true);
          // Very brief 75ms brightness dip (under 10% brightness reduction)
          resetTimerId = setTimeout(() => {
            setFlickering(false);
          }, 75);
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
      {/* 1. CRT Scanlines Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-10 select-none"
        style={{
          opacity: reducedMotion ? 0 : effects.scanlineOpacity,
          backgroundImage:
            "linear-gradient(rgba(18, 22, 27, 0) 50%, rgba(0, 0, 0, 0.4) 50%)",
          backgroundSize: "100% 4px",
        }}
        aria-hidden="true"
      />

      {/* 2. Vignette Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-10 select-none"
        style={{
          boxShadow: `inset 0 0 calc(${effects.vignetteStrength} * 140px) rgba(0, 0, 0, 0.85)`,
        }}
        aria-hidden="true"
      />

      {/* 3. Subtle Film Grain (SVG feTurbulence) */}
      <div
        className="fixed inset-0 pointer-events-none z-10 select-none"
        style={{
          opacity: reducedMotion ? 0 : effects.grainOpacity,
        }}
        aria-hidden="true"
      >
        <svg
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <filter id="theme-film-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.8"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#theme-film-grain)" />
        </svg>
      </div>

      {/* 4. Rare Voltage Flicker Overlay (Under 10% brightness change: 6% dip) */}
      <div
        className={`fixed inset-0 pointer-events-none z-20 transition-opacity duration-75 select-none ${
          isFlickeringActive ? "opacity-100" : "opacity-0"
        }`}
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.06)",
        }}
        aria-hidden="true"
      />
    </>
  );
}

export default ThemeEffects;

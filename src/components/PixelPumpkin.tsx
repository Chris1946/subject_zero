"use client";

import React, { useEffect, useState } from "react";

interface PixelPumpkinProps {
  className?: string;
  size?: number;
  opacity?: number;
}

export function PixelPumpkin({ className = "", size = 320, opacity = 1 }: PixelPumpkinProps) {
  const [eyeIntensity, setEyeIntensity] = useState(0.55);
  const [hovered, setHovered] = useState(false);

  /* ── Autonomous eye flicker ── */
  useEffect(() => {
    let outerTimer: ReturnType<typeof setTimeout>;

    const runFlicker = () => {
      const base = hovered ? 0.9 : 0.55;
      const frames: { v: number; ms: number }[] = [
        { v: 0.08, ms: 55 },
        { v: base + 0.35, ms: 45 },
        { v: 0.04, ms: 40 },
        { v: 1.0, ms: 110 },
        { v: base + 0.15, ms: 70 },
        { v: base, ms: 0 },
      ];
      let delay = 0;
      frames.forEach(({ v, ms }) => {
        setTimeout(() => setEyeIntensity(v), delay);
        delay += ms;
      });
      outerTimer = setTimeout(runFlicker, delay + 1800 + Math.random() * 3800);
    };

    outerTimer = setTimeout(runFlicker, 1200 + Math.random() * 2000);
    return () => clearTimeout(outerTimer);
  }, [hovered]);

  /* Derived colours */
  const eyeMain  = `rgba(255, 140,  0, ${eyeIntensity})`;
  const eyeOuter = `rgba(255,  60,  0, ${eyeIntensity * 0.55})`;
  const eyeInner = `rgba(255, 230, 50, ${eyeIntensity * 0.95})`;
  const glowBlur = hovered ? "10" : "6";

  return (
    <div
      className={`pumpkin-float select-none ${className}`}
      style={{ opacity, width: size, height: size * 0.95 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-hidden="true"
    >
      <svg
        width={size}
        height={size * 0.95}
        viewBox="0 0 220 210"
        style={{ shapeRendering: "crispEdges", imageRendering: "pixelated" }}
      >
        <defs>
          {/* Outer body glow */}
          <filter id="bodyGlow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation={glowBlur} result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1.6 0 0 0 0.3  0.4 0.1 0 0 0  0 0 0 0 0  0 0 0 0.85 0"
              result="cb"
            />
            <feMerge>
              <feMergeNode in="cb" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Eye glow */}
          <filter id="eyeGl" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Flame glow */}
          <filter id="flameGl" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1.2 0 0 0 0.4  0.5 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="cb"
            />
            <feMerge>
              <feMergeNode in="cb" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Atmospheric halo ── */}
        <ellipse
          cx="110" cy="130"
          rx={hovered ? 95 : 80} ry={hovered ? 72 : 60}
          fill={hovered ? "rgba(200,70,0,0.18)" : "rgba(160,40,0,0.12)"}
          filter="url(#bodyGlow)"
          style={{ transition: "all 0.6s ease" }}
        />

        {/* ══════════ STEM ══════════ */}
        <rect x="100" y="2"  width="8"  height="8"  fill="#1a4a0a" />
        <rect x="100" y="10" width="12" height="10" fill="#1a4a0a" />
        <rect x="96"  y="20" width="16" height="8"  fill="#1a4a0a" />
        <rect x="94"  y="28" width="12" height="6"  fill="#2d6b15" />
        {/* leaf */}
        <rect x="84"  y="12" width="16" height="8"  fill="#1a4a0a" />
        <rect x="80"  y="20" width="14" height="6"  fill="#2d6b15" />

        {/* ══════════ FLAME (top of stem) ══════════ */}
        <rect x="104" y="0"  width="4"  height="4"  fill="#ffcc00" filter="url(#flameGl)" />
        <rect x="102" y="4"  width="8"  height="4"  fill="#ff8800" filter="url(#flameGl)" />

        {/* ══════════ THREE TOP BUMPS ══════════ */}
        {/* left bump */}
        <rect x="4"   y="44" width="68" height="8"  fill="#bf4300" />
        <rect x="0"   y="52" width="80" height="8"  fill="#bf4300" />
        {/* centre bump (tallest) */}
        <rect x="78"  y="30" width="64" height="8"  fill="#bf4300" />
        <rect x="70"  y="38" width="80" height="8"  fill="#bf4300" />
        <rect x="64"  y="46" width="92" height="8"  fill="#bf4300" />
        {/* right bump */}
        <rect x="148" y="44" width="68" height="8"  fill="#bf4300" />
        <rect x="140" y="52" width="80" height="8"  fill="#bf4300" />

        {/* ══════════ MAIN BODY ══════════ */}
        <rect x="0"   y="60" width="220" height="92" fill="#bf4300" />

        {/* Pumpkin ridge stripes */}
        <rect x="62"  y="60" width="6"  height="92" fill="#963800" opacity={0.45} />
        <rect x="152" y="60" width="6"  height="92" fill="#963800" opacity={0.45} />
        <rect x="108" y="60" width="4"  height="92" fill="#963800" opacity={0.3}  />

        {/* Top-left highlight */}
        <rect x="8"   y="62" width="52" height="18" fill="#d95800" opacity={0.5} />
        <rect x="10"  y="80" width="26" height="10" fill="#d95800" opacity={0.3} />

        {/* Bottom-right shadow */}
        <rect x="150" y="118" width="58" height="20" fill="#8c3200" opacity={0.38} />

        {/* ══════════ BODY TAPER ══════════ */}
        <rect x="8"   y="152" width="204" height="8" fill="#bf4300" />
        <rect x="20"  y="160" width="180" height="8" fill="#bf4300" />
        <rect x="36"  y="168" width="148" height="8" fill="#a83800" />
        <rect x="56"  y="176" width="108" height="8" fill="#8c3200" />
        <rect x="78"  y="184" width="64"  height="6" fill="#6e2600" />
        <rect x="96"  y="190" width="28"  height="4" fill="#561e00" />

        {/* ══════════ LEFT EYE (downward triangle) ══════════ */}
        {/* Black shape */}
        <rect x="46"  y="78" width="8"  height="8"  fill="#030000" />
        <rect x="38"  y="86" width="24" height="10" fill="#030000" />
        <rect x="30"  y="96" width="40" height="10" fill="#030000" />
        {/* Glow overlays */}
        <rect x="46"  y="78" width="8"  height="8"  fill={eyeMain}  filter="url(#eyeGl)" />
        <rect x="38"  y="86" width="24" height="10" fill={eyeOuter} />
        <rect x="30"  y="96" width="40" height="10" fill={eyeOuter} />
        {/* Inner bright */}
        <rect x="44"  y="90" width="8"  height="6"  fill={eyeInner} />

        {/* ══════════ RIGHT EYE (mirror) ══════════ */}
        <rect x="166" y="78" width="8"  height="8"  fill="#030000" />
        <rect x="158" y="86" width="24" height="10" fill="#030000" />
        <rect x="150" y="96" width="40" height="10" fill="#030000" />
        <rect x="166" y="78" width="8"  height="8"  fill={eyeMain}  filter="url(#eyeGl)" />
        <rect x="158" y="86" width="24" height="10" fill={eyeOuter} />
        <rect x="150" y="96" width="40" height="10" fill={eyeOuter} />
        <rect x="168" y="90" width="8"  height="6"  fill={eyeInner} />

        {/* ══════════ MOUTH ══════════ */}
        {/* Black cavity */}
        <rect x="20"  y="118" width="180" height="40" fill="#030000" />
        {/* Upper teeth (orange over black) */}
        <rect x="40"  y="118" width="20" height="24" fill="#bf4300" />
        <rect x="80"  y="118" width="20" height="24" fill="#bf4300" />
        <rect x="120" y="118" width="20" height="24" fill="#bf4300" />
        <rect x="160" y="118" width="20" height="24" fill="#bf4300" />
        {/* Inner mouth glow / inner fire tinge */}
        <rect x="20"  y="132" width="180" height="16" fill="rgba(80, 8, 0, 0.6)" />
        {/* Tooth highlights */}
        <rect x="40"  y="118" width="4"  height="12" fill="#d95800" opacity={0.5} />
        <rect x="80"  y="118" width="4"  height="12" fill="#d95800" opacity={0.5} />
        <rect x="120" y="118" width="4"  height="12" fill="#d95800" opacity={0.5} />
        <rect x="160" y="118" width="4"  height="12" fill="#d95800" opacity={0.5} />

        {/* ── Inner eye-light cast on body (spill) ── */}
        <rect x="22"  y="104" width="60" height="14" fill={eyeOuter} opacity={eyeIntensity * 0.3} />
        <rect x="138" y="104" width="60" height="14" fill={eyeOuter} opacity={eyeIntensity * 0.3} />

        {/* ── Mouth inner fire glow at night ── */}
        <rect x="40"  y="140" width="140" height="8"
          fill={`rgba(255,80,0,${eyeIntensity * 0.25})`}
          filter="url(#flameGl)"
        />
      </svg>
    </div>
  );
}

export default PixelPumpkin;

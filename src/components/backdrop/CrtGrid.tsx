import React from "react";

export function CrtGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Perspective Grid via SVG */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.14]"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="crt-grid-pattern"
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke="var(--theme-accent, #3ee6c8)"
              strokeWidth="0.75"
              strokeDasharray="2, 4"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#crt-grid-pattern)" />
      </svg>

      {/* Horizon perspective lines fading upwards */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background: `linear-gradient(to top, transparent 40%, rgba(0, 0, 0, 0.8) 100%)`,
        }}
      />

      {/* Slow horizontal scan band */}
      <div
        className="crt-scan-band absolute left-0 right-0 h-24 pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, transparent, var(--theme-accent, #3ee6c8), transparent)`,
          opacity: 0.06,
        }}
      />
    </div>
  );
}

export default CrtGrid;

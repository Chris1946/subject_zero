import React from "react";

// 16 warm dust motes
const DUST_MOTES = [
  { left: "8%", top: "15%", size: 3, delay: "0s", duration: "18s" },
  { left: "18%", top: "45%", size: 2, delay: "3s", duration: "22s" },
  { left: "28%", top: "75%", size: 2.5, delay: "7s", duration: "16s" },
  { left: "38%", top: "25%", size: 3, delay: "2s", duration: "20s" },
  { left: "48%", top: "60%", size: 2, delay: "9s", duration: "24s" },
  { left: "55%", top: "10%", size: 3.5, delay: "4s", duration: "19s" },
  { left: "65%", top: "80%", size: 2, delay: "1s", duration: "17s" },
  { left: "75%", top: "35%", size: 2.5, delay: "8s", duration: "21s" },
  { left: "85%", top: "65%", size: 3, delay: "5s", duration: "23s" },
  { left: "92%", top: "20%", size: 2, delay: "11s", duration: "15s" },
  { left: "14%", top: "85%", size: 2.5, delay: "6s", duration: "20s" },
  { left: "80%", top: "90%", size: 2, delay: "10s", duration: "18s" },
];

export function DossierDust() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Paper texture via SVG feTurbulence */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.035] pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <filter id="dossier-paper-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0
                    0 0.8 0 0 0
                    0 0 0.5 0 0
                    0 0 0 1 0"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#dossier-paper-noise)" />
      </svg>

      {/* Floating warm dust motes */}
      {DUST_MOTES.map((mote, i) => (
        <div
          key={i}
          className="dossier-dust-mote absolute rounded-full"
          style={{
            left: mote.left,
            top: mote.top,
            width: `${mote.size}px`,
            height: `${mote.size}px`,
            backgroundColor: "var(--theme-accent, #ffb020)",
            opacity: 0.18,
            boxShadow: "0 0 4px var(--theme-accent, #ffb020)",
            animationDelay: mote.delay,
            animationDuration: mote.duration,
          }}
        />
      ))}
    </div>
  );
}

export default DossierDust;

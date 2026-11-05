import React from "react";

export function LobbyFog() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Halloween Pumpkin Pixel Background Pattern */}
      <div
        className="absolute inset-0 halloween-bg-pattern"
        style={{ opacity: 0.6 }}
      />

      {/* Blood-red fog orb — upper left */}
      <div
        className="lobby-fog-orb-1 absolute w-[700px] h-[700px] rounded-full"
        style={{
          top: "-15%",
          left: "-5%",
          background: "radial-gradient(circle, rgba(180, 20, 0, 0.18) 0%, rgba(120, 0, 0, 0.08) 50%, transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* Deep crimson orb — lower right */}
      <div
        className="lobby-fog-orb-2 absolute w-[800px] h-[800px] rounded-full"
        style={{
          bottom: "-20%",
          right: "-5%",
          background: "radial-gradient(circle, rgba(150, 10, 10, 0.15) 0%, rgba(80, 0, 0, 0.07) 55%, transparent 75%)",
          filter: "blur(90px)",
        }}
      />

      {/* Amber ember glow — center subtle */}
      <div
        className="lobby-fog-orb-3 absolute w-[500px] h-[500px] rounded-full"
        style={{
          top: "30%",
          left: "35%",
          background: "radial-gradient(circle, rgba(255, 69, 0, 0.07) 0%, rgba(180, 30, 0, 0.04) 50%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Pixel sparkle stars */}
      {[
        { top: "12%", left: "18%", dur: "2.4s", delay: "0s",   size: 6 },
        { top: "22%", left: "75%", dur: "3.1s", delay: "0.8s", size: 4 },
        { top: "55%", left: "8%",  dur: "2.8s", delay: "1.4s", size: 5 },
        { top: "68%", left: "88%", dur: "2.2s", delay: "0.3s", size: 4 },
        { top: "82%", left: "42%", dur: "3.5s", delay: "1.1s", size: 6 },
        { top: "38%", left: "92%", dur: "2.0s", delay: "0.6s", size: 3 },
        { top: "90%", left: "15%", dur: "2.9s", delay: "1.8s", size: 4 },
      ].map((s, i) => (
        <div
          key={i}
          className="sparkle absolute pixelated"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            backgroundColor: "#ff4500",
            boxShadow: `0 0 ${s.size * 2}px ${s.size}px rgba(255,100,0,0.6)`,
            "--sparkle-dur": s.dur,
            animationDelay: s.delay,
          } as React.CSSProperties}
        />
      ))}

      {/* Floating ember particles */}
      {[
        { bottom: "10%", left: "20%", dur: "3.2s", delay: "0s",   dx: "14px",  dx2: "-8px" },
        { bottom: "15%", left: "45%", dur: "4.0s", delay: "1.2s", dx: "-10px", dx2: "6px"  },
        { bottom: "8%",  left: "70%", dur: "2.8s", delay: "0.5s", dx: "8px",   dx2: "-4px" },
        { bottom: "20%", left: "85%", dur: "3.6s", delay: "1.8s", dx: "-12px", dx2: "10px" },
      ].map((e, i) => (
        <div
          key={i}
          className="ember-particle absolute pixelated"
          style={{
            bottom: e.bottom,
            left: e.left,
            width: 4,
            height: 4,
            backgroundColor: i % 2 === 0 ? "#ff6b00" : "#ff3300",
            boxShadow: "0 0 6px 2px rgba(255,80,0,0.7)",
            "--ember-dur": e.dur,
            "--drift-x": e.dx,
            "--drift-x2": e.dx2,
            animationDelay: e.delay,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

export default LobbyFog;

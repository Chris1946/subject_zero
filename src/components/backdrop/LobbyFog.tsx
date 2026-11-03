import React from "react";

export function LobbyFog() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Fog Orb 1: Upper left drifting to center */}
      <div
        className="lobby-fog-orb-1 absolute w-[600px] h-[600px] rounded-full"
        style={{
          top: "-10%",
          left: "5%",
          background: "radial-gradient(circle, rgba(111, 168, 220, 0.08) 0%, transparent 65%)",
          filter: "blur(60px)",
        }}
      />

      {/* Fog Orb 2: Lower right drifting towards center-left */}
      <div
        className="lobby-fog-orb-2 absolute w-[700px] h-[700px] rounded-full"
        style={{
          bottom: "-15%",
          right: "0%",
          background: "radial-gradient(circle, rgba(74, 114, 172, 0.07) 0%, transparent 70%)",
          filter: "blur(70px)",
        }}
      />
    </div>
  );
}

export default LobbyFog;

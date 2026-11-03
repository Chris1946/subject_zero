import React from "react";

export function EmergencyPulse() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
      {/* Edge vignette with red emergency alert sweep */}
      <div
        className="emergency-sweep-top absolute top-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, rgba(255, 45, 61, 0.12), transparent)",
        }}
      />
      <div
        className="emergency-sweep-bottom absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: "linear-gradient(to top, rgba(255, 45, 61, 0.12), transparent)",
        }}
      />
      <div
        className="emergency-sweep-left absolute top-0 bottom-0 left-0 w-32 pointer-events-none"
        style={{
          background: "linear-gradient(to right, rgba(255, 45, 61, 0.1), transparent)",
        }}
      />
      <div
        className="emergency-sweep-right absolute top-0 bottom-0 right-0 w-32 pointer-events-none"
        style={{
          background: "linear-gradient(to left, rgba(255, 45, 61, 0.1), transparent)",
        }}
      />

      {/* Rotating emergency sweep beacon */}
      <div
        className="emergency-beacon absolute -inset-[50%] opacity-15 pointer-events-none"
        style={{
          background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255, 45, 61, 0.15) 60deg, transparent 90deg, transparent 360deg)`,
        }}
      />
    </div>
  );
}

export default EmergencyPulse;

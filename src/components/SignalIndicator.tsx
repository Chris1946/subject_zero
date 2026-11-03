"use client";

import React from "react";

interface SignalIndicatorProps {
  status: string;
}

export function SignalIndicator({ status }: SignalIndicatorProps) {
  let activeBars = 1;
  let barColor = "bg-cold-blue";
  let pulse = false;

  switch (status) {
    case "DEGRADED":
      activeBars = 2;
      barColor = "bg-cold-blue/70";
      break;
    case "MEMORY FAILURE":
      activeBars = 2;
      barColor = "bg-emergency-red/80";
      pulse = true;
      break;
    case "CRITICAL":
      activeBars = 1;
      barColor = "bg-emergency-red";
      pulse = true;
      break;
    case "CONNECTION CRITICAL":
      activeBars = 1;
      barColor = "bg-emergency-red animate-ping";
      pulse = true;
      break;
    case "UNSTABLE":
    default:
      activeBars = 3;
      barColor = "bg-cold-blue";
      break;
  }

  return (
    <div
      className="flex items-end gap-1 h-4"
      aria-label={`Signal strength: ${status}`}
      title={`Connection: ${status}`}
    >
      {[1, 2, 3, 4].map((bar) => {
        const isActive = bar <= activeBars;
        const heightClass =
          bar === 1 ? "h-1.5" : bar === 2 ? "h-2.5" : bar === 3 ? "h-3.5" : "h-4";

        return (
          <span
            key={bar}
            className={`w-1 rounded-xs transition-colors duration-300 ${heightClass} ${
              isActive
                ? `${barColor} ${pulse ? "opacity-90" : "opacity-100"}`
                : "bg-panel/80 opacity-30"
            }`}
          />
        );
      })}
    </div>
  );
}

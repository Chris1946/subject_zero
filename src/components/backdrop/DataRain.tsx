import React from "react";

// Max 18 sparse streams to stay strictly within budget (< 20 elements)
const STREAMS = [
  { left: "4%", delay: "0s", duration: "14s", text: "010011 7F E4" },
  { left: "10%", delay: "4s", duration: "18s", text: "SZ-PROTOCOL" },
  { left: "16%", delay: "1.5s", duration: "12s", text: "NET-OP // 02" },
  { left: "23%", delay: "6s", duration: "16s", text: "4F 4C 44" },
  { left: "29%", delay: "3s", duration: "15s", text: "01100111" },
  { left: "37%", delay: "8s", duration: "13s", text: "ENCR:AES-256" },
  { left: "44%", delay: "2s", duration: "17s", text: "110010 8B" },
  { left: "51%", delay: "5s", duration: "14s", text: "MEM:0x7FF0" },
  { left: "58%", delay: "9s", duration: "19s", text: "PORT:8080" },
  { left: "64%", delay: "1s", duration: "13s", text: "ROUTER_GATE" },
  { left: "71%", delay: "7s", duration: "16s", text: "SYS_FAULT_04" },
  { left: "77%", delay: "3.5s", duration: "15s", text: "PKT_DROP_21" },
  { left: "84%", delay: "6.5s", duration: "18s", text: "NODE_AUTH" },
  { left: "90%", delay: "2.5s", duration: "14s", text: "011010 9C" },
  { left: "95%", delay: "10s", duration: "16s", text: "TERM_SYNC" },
];

export function DataRain() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none font-mono">
      {STREAMS.map((st, i) => (
        <div
          key={i}
          className="data-rain-stream absolute text-[10px] tracking-widest leading-loose"
          style={{
            left: st.left,
            animationDelay: st.delay,
            animationDuration: st.duration,
            color: "var(--theme-accent, #c084fc)",
            opacity: 0.12,
            writingMode: "vertical-rl",
            textOrientation: "upright",
          }}
        >
          {st.text}
        </div>
      ))}
    </div>
  );
}

export default DataRain;

"use client";

import React from "react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark font-mono">
      <body className="min-h-[100dvh] flex items-center justify-center p-6 bg-[#0a0b0e] text-[#e6edf3] font-mono select-none">
        <div className="w-full max-w-md border border-[#c0392b]/60 bg-[#12161f] p-8 shadow-2xl text-center space-y-6">
          <div className="flex justify-center">
            <span className="w-3 h-3 rounded-full bg-[#c0392b] animate-ping" />
          </div>

          <div className="space-y-2">
            <div className="text-[10px] text-[#c0392b] uppercase tracking-widest font-bold">
              ROOT EXCEPTION // SYSTEM CRASH
            </div>
            <h1 className="text-sm sm:text-base font-bold text-[#e6edf3] uppercase tracking-wider">
              SYSTEM FAULT. RELOAD THE TERMINAL.
            </h1>
            <p className="text-xs text-[#8b949e] leading-relaxed">
              An unhandled hardware or layout exception interrupted the root execution environment.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="w-full min-h-[44px] py-2.5 px-4 bg-[#c0392b]/20 border border-[#c0392b] text-[#c0392b] hover:bg-[#c0392b] hover:text-white font-mono text-xs uppercase tracking-widest font-bold transition-colors"
            >
              RELOAD TERMINAL
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

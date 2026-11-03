"use client";

import React, { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Record internal error digest without leaking stack to DOM
    if (process.env.NODE_ENV !== "production") {
      console.error("Facility Controller Error:", error);
    }
  }, [error]);

  return (
    <main className="min-h-[100dvh] flex items-center justify-center p-6 bg-background text-text font-mono select-none">
      <div className="w-full max-w-md border border-emergency-red/60 bg-panel/90 p-8 shadow-2xl text-center space-y-6">
        <div className="flex justify-center">
          <span className="w-3 h-3 rounded-full bg-emergency-red animate-ping" />
        </div>

        <div className="space-y-2">
          <div className="text-[10px] text-emergency-red uppercase tracking-widest font-bold">
            CRITICAL EXCEPTION // PROTOCOL INTERRUPT
          </div>
          <h1 className="text-sm sm:text-base font-bold text-text uppercase tracking-wider">
            SYSTEM FAULT. RELOAD THE TERMINAL.
          </h1>
          <p className="text-xs text-text/50 leading-relaxed">
            The terminal execution stream encountered an unrecoverable exception.
            No facility security records were compromised.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full min-h-[44px] py-2.5 px-4 bg-emergency-red/20 border border-emergency-red text-emergency-red hover:bg-emergency-red hover:text-white font-mono text-xs uppercase tracking-widest font-bold transition-colors"
          >
            RELOAD TERMINAL
          </button>
        </div>
      </div>
    </main>
  );
}

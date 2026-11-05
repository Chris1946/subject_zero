"use client";

import React, { useState, useSyncExternalStore, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TerminalPanel } from "@/components/TerminalPanel";
import { MUTED_STORAGE_KEY } from "@/lib/sound/engine";

const subscribeStorage = (callback: () => void) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
};

const getMuteSnapshot = (): boolean => {
  if (typeof window === "undefined") return true;
  try {
    const stored = localStorage.getItem(MUTED_STORAGE_KEY);
    return stored !== null ? stored === "true" : true;
  } catch {
    return true;
  }
};

const getServerMuteSnapshot = (): boolean => true;

function JoinFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCode = (searchParams.get("code") || "").toUpperCase();

  const [joinCode, setJoinCode] = useState(initialCode);
  const [email, setEmail] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Halloween click burst state
  const [btnBurst, setBtnBurst] = useState(false);
  const [screenFlash, setScreenFlash] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number; size: number }[]>([]);
  const rippleCounter = React.useRef(0);

  const triggerBurst = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Fire ripple from click position
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 1.6;
    const id = ++rippleCounter.current;
    setRipples((prev) => [...prev, { id, x, y, size }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);

    // Button burst glow
    setBtnBurst(true);
    setTimeout(() => setBtnBurst(false), 520);

    // Screen flash
    setScreenFlash(true);
    setTimeout(() => setScreenFlash(false), 500);
  };

  // Audio Toggle synchronized with localStorage via React's useSyncExternalStore (SSR-safe, zero hydration mismatch)
  const audioMutedFromStore = useSyncExternalStore(
    subscribeStorage,
    getMuteSnapshot,
    getServerMuteSnapshot
  );
  const [localMuted, setLocalMuted] = useState<boolean | null>(null);
  const audioMuted = localMuted !== null ? localMuted : audioMutedFromStore;

  const handleAudioToggle = (newMuted: boolean) => {
    setLocalMuted(newMuted);
    try {
      localStorage.setItem(MUTED_STORAGE_KEY, String(newMuted));
      window.dispatchEvent(new Event("storage"));
    } catch {}
  };

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.trim().toUpperCase();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanCode || isAuthenticating) return;

    setIsAuthenticating(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          joinCode: cleanCode,
          email: cleanEmail || undefined,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setErrorMessage(data?.error ?? "AUTHENTICATION FAILED. CHECK SQUAD CODE AND EMAIL.");
        return;
      }

      if (data?.redirect) {
        router.push(data.redirect);
        router.refresh();
        return;
      }

      // Successful verification -> redirect to facility terminal
      router.push("/play");
      router.refresh();
    } catch {
      setErrorMessage("COMMUNICATION FAULT. PLEASE RETRY.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <>
      {/* Full-screen Halloween flash on button click */}
      {screenFlash && (
        <div
          className="halloween-screen-flash fixed inset-0 pointer-events-none z-50"
          style={{ background: "radial-gradient(ellipse at center, rgba(255,80,0,0.18) 0%, rgba(120,0,0,0.1) 60%, transparent 100%)" }}
          aria-hidden="true"
        />
      )}
    <TerminalPanel className="w-full max-w-md" suppressHydrationWarning>
      {/* Terminal Title Bar */}
      <div
        className="flex items-center justify-between border-b border-panel-border pb-3 mb-6 text-xs text-text/50 uppercase tracking-widest font-mono"
        suppressHydrationWarning
      >
        <span suppressHydrationWarning>SECURITY CLEARANCE: LEVEL 0</span>
        <span className="text-accent animate-pulse pixel-text-glow">● SECURE VERIFICATION</span>
      </div>

      <form onSubmit={handleAuthenticate} className="space-y-5 font-mono">
        <div className="space-y-1 mb-2">
          <h1 className="text-base font-bold tracking-tight text-text font-mono uppercase">
            OPERATIVE AUTHENTICATION
          </h1>
          <p className="text-xs text-text/60 leading-relaxed font-mono">
            Enter your 6-character squad code and the email address registered by your team coordinator.
          </p>
        </div>

        {/* Squad Access Code */}
        <div>
          <label
            htmlFor="joinCode"
            className="block text-[11px] font-pixel uppercase tracking-widest text-accent mb-1.5 pixel-text-glow"
          >
            SQUAD ACCESS CODE:
          </label>
          <input
            id="joinCode"
            type="text"
            required
            maxLength={6}
            value={joinCode}
            disabled={isAuthenticating}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="XXXXXX"
            className="w-full min-h-[46px] bg-background border border-panel-border px-4 py-2 font-pixel text-center text-xl tracking-[0.3em] text-accent uppercase placeholder:text-text/20 focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50 pixel-border-glow pixel-corners"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            autoFocus
          />
        </div>

        {/* Registered Agent Email */}
        <div>
          <label
            htmlFor="agentEmail"
            className="block text-[11px] font-pixel uppercase tracking-widest text-accent mb-1.5 pixel-text-glow"
          >
            REGISTERED AGENT EMAIL:
          </label>
          <input
            id="agentEmail"
            type="email"
            required
            value={email}
            disabled={isAuthenticating}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="agent@example.com"
            className="w-full min-h-[42px] bg-background border border-panel-border px-3 py-2 font-mono text-sm text-text placeholder:text-text/30 focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50 pixel-border-glow"
            autoComplete="email"
            spellCheck={false}
          />
          <span className="text-[10px] text-text/40 block mt-1">
            Must match the email registered on this squad&apos;s roster.
          </span>
        </div>

        {errorMessage && (
          <div
            role="alert"
            aria-live="polite"
            className="text-xs text-rose-300 font-mono tracking-wider uppercase text-center p-3 bg-rose-950/60 border border-rose-500/60 flex items-center justify-center gap-2"
          >
            <span className="inline-block w-1.5 h-1.5 bg-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isAuthenticating || joinCode.trim().length === 0 || email.trim().length === 0}
          onMouseDown={triggerBurst}
          className={`w-full min-h-[46px] font-pixel text-[9px] uppercase tracking-[0.15em] transition-all focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer pixel-corners pixel-fire-glow relative overflow-hidden ${
            btnBurst ? "halloween-btn-burst" : ""
          }`}
          style={{
            background: isAuthenticating
              ? "linear-gradient(135deg, #6b1a1a, #3a0808)"
              : "linear-gradient(135deg, #cc2200, #ff4500)",
            color: "#fdeeed",
          }}
        >
          {/* Fire ripples */}
          {ripples.map((r) => (
            <span
              key={r.id}
              className="fire-ripple"
              style={{
                width: r.size,
                height: r.size,
                left: r.x - r.size / 2,
                top: r.y - r.size / 2,
              }}
              aria-hidden="true"
            />
          ))}
          <span className="relative z-10">
            {isAuthenticating ? "VERIFYING CREDENTIALS..." : "▶ ENTER FACILITY"}
          </span>
        </button>

        {/* Audio Mute & Ambient Hint */}
        <div className="pt-3 border-t border-panel-border/40 flex items-center justify-between text-xs text-text/40 font-mono">
          <div className="flex items-center gap-2">
            <span>AUDIO ATMOSPHERE:</span>
            <button
              type="button"
              onClick={(e) => {
                handleAudioToggle(!audioMuted);
                // small burst on audio toggle too
                const btn = e.currentTarget;
                btn.classList.add("halloween-btn-burst");
                setTimeout(() => btn.classList.remove("halloween-btn-burst"), 520);
              }}
              suppressHydrationWarning
              className="text-text/70 hover:text-accent underline focus-visible:outline-none transition-colors relative"
            >
              {audioMuted ? "MUTED [OFF]" : "ACTIVE [ON]"}
            </button>
          </div>
          <span className="text-[10px] text-[#5c1a1a]">CLEARANCE VERIFICATION</span>
        </div>
      </form>
    </TerminalPanel>
    </>
  );
}

export function JoinForm() {
  return (
    <Suspense
      fallback={
        <TerminalPanel className="w-full max-w-md">
          <div className="text-center py-8 text-xs font-mono text-text/50 uppercase tracking-widest animate-pulse">
            INITIALIZING SECURITY GATEWAY...
          </div>
        </TerminalPanel>
      }
    >
      <JoinFormContent />
    </Suspense>
  );
}

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
    <TerminalPanel className="w-full max-w-md" suppressHydrationWarning>
      {/* Terminal Title Bar */}
      <div
        className="flex items-center justify-between border-b border-panel pb-3 mb-6 text-xs text-text/50 uppercase tracking-widest font-mono"
        suppressHydrationWarning
      >
        <span suppressHydrationWarning>SECURITY CLEARANCE: LEVEL 0</span>
        <span className="text-cyan-400 animate-pulse">● SECURE VERIFICATION</span>
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
            className="block text-[11px] font-mono uppercase tracking-widest text-cyan-400 mb-1.5 font-bold"
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
            className="w-full min-h-[46px] bg-background border border-panel px-4 py-2 font-mono text-center text-2xl tracking-[0.3em] font-bold text-text uppercase placeholder:text-text/20 focus-visible:outline-2 focus-visible:outline-cyan-400 disabled:opacity-50"
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
            className="block text-[11px] font-mono uppercase tracking-widest text-cyan-400 mb-1.5 font-bold"
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
            className="w-full min-h-[42px] bg-background border border-panel px-3 py-2 font-mono text-xs text-text placeholder:text-text/30 focus-visible:outline-2 focus-visible:outline-cyan-400 disabled:opacity-50"
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
          className="w-full min-h-[46px] bg-cyan-400 text-black hover:bg-cyan-300 font-mono text-xs font-black uppercase tracking-[0.2em] transition-all focus-visible:outline-2 focus-visible:outline-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer"
        >
          {isAuthenticating ? "VERIFYING CREDENTIALS..." : "VERIFY & ENTER FACILITY →"}
        </button>

        {/* Audio Mute & Ambient Hint */}
        <div className="pt-3 border-t border-panel/50 flex items-center justify-between text-xs text-text/40 font-mono">
          <div className="flex items-center gap-2">
            <span>AUDIO ATMOSPHERE:</span>
            <button
              type="button"
              onClick={() => handleAudioToggle(!audioMuted)}
              suppressHydrationWarning
              className="text-text/70 hover:text-cyan-400 underline focus-visible:outline-none"
            >
              {audioMuted ? "MUTED [OFF]" : "ACTIVE [ON]"}
            </button>
          </div>
          <span className="text-[10px] text-text/30">SECURITY CLEARANCE VERIFICATION</span>
        </div>
      </form>
    </TerminalPanel>
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

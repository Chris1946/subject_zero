"use client";

import React, { useState, useEffect } from "react";
import { TerminalPanel } from "@/components/TerminalPanel";

interface SquadMember {
  id: string;
  member_index: number;
  name: string;
  email: string;
  assigned_round: number | null;
  is_connected: boolean;
}

interface SquadLobbyProps {
  teamName: string;
  joinCode: string;
  currentMember?: {
    id: string;
    name: string;
    member_index: number;
  } | null;
  onGameReady: () => void;
}

export function SquadLobby({
  teamName,
  joinCode,
  currentMember,
  onGameReady,
}: SquadLobbyProps) {
  const [code, setCode] = useState(joinCode);
  const [members, setMembers] = useState<SquadMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function poll() {
      try {
        const res = await fetch("/api/lobby");
        if (res.ok && isMounted) {
          const data = await res.json();
          setMembers(data.members || []);
          if (data.joinCode) {
            setCode(data.joinCode);
          }
          if (data.lobbyReady) {
            onGameReady();
          }
        }
      } catch {
        // Ignore network flutter during polling
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    poll();
    const interval = setInterval(poll, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [onGameReady]);

  const effectiveCode = code || joinCode;

  const handleCopyInvite = async () => {
    if (typeof window === "undefined") return;
    const inviteText = `Join squad "${teamName}" in Subject Zero! Go to ${window.location.origin} and enter code: ${effectiveCode}`;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteText);
      } else {
        throw new Error("Clipboard unavailable");
      }
    } catch {
      // Fallback using textarea for browsers/contexts with clipboard restrictions
      const el = document.createElement("textarea");
      el.value = inviteText;
      el.setAttribute("readonly", "");
      el.style.position = "absolute";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleStartGame = async () => {
    if (isStarting) return;
    setIsStarting(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/lobby", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (res.ok || data?.alreadyStarted) {
        onGameReady();
      } else {
        setErrorMsg(data?.error ?? "Cannot start investigation yet.");
        setIsStarting(false);
      }
    } catch {
      setErrorMsg("Failed to initialize squad investigation.");
      setIsStarting(false);
    }
  };

  const connectedCount = members.filter((m) => m.is_connected).length;
  const allConnected = members.length === 4 && connectedCount === 4;
  const canStart = allConnected;

  return (
    <TerminalPanel className="w-full max-w-2xl mx-auto p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between border-b border-panel pb-4 gap-4">
        <div>
          <span className="text-[10px] text-text/40 uppercase tracking-widest font-mono block">
            FACILITY CONTAINMENT // SQUAD ASSEMBLY
          </span>
          <h1 className="text-lg font-bold font-mono text-text uppercase tracking-tight">
            SQUAD: <span className="text-cold-blue">{teamName}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-background border border-cold-blue/60 text-cold-blue font-mono text-sm tracking-[0.2em] font-bold">
            CODE: {effectiveCode || "..."}
          </div>
          <button
            type="button"
            onClick={handleCopyInvite}
            className="px-3 py-1.5 bg-panel border border-panel hover:border-cold-blue text-xs font-mono text-text transition-colors"
          >
            {copied ? "COPIED ✓" : "SHARE INVITE"}
          </button>
          <a
            href="/leaderboard"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-panel border border-panel hover:border-cold-blue text-xs font-mono text-text/80 hover:text-cold-blue transition-colors"
            title="Open Leaderboard in a new tab"
          >
            LEADERBOARD
          </a>
        </div>
      </div>

      {/* Connection Progress */}
      <div className="p-3 bg-panel/30 border border-panel flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              allConnected ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
            }`}
          />
          <span className="text-text/70 uppercase">
            SQUAD READINESS:{" "}
            <strong className="text-text">
              [{connectedCount} / 4] AGENTS CONNECTED
            </strong>
          </span>
        </div>
        <span className="text-text/40 text-[11px]">
          {allConnected
            ? "ALL AGENTS PRESENT"
            : "WAITING FOR TEAMMATES TO CONNECT..."}
        </span>
      </div>

      {/* Instructions */}
      <div className="text-xs text-text/60 font-mono leading-relaxed bg-background/50 p-3 border border-panel/50 space-y-1">
        <p className="text-cold-blue font-bold uppercase tracking-wider">
          CO-OP DEPLOYMENT PROTOCOL:
        </p>
        <p>• 4 agents must connect using the 6-character access code.</p>
        <p>• Assign each agent to lead one investigative round (10-min timer per round).</p>
        <p>• In Rounds 1–4, only the designated agent interacts while teammates observe telemetry.</p>
        <p>• In Round 5, all 4 agents work simultaneously on distributed reboot directives.</p>
      </div>

      {/* 4 Agent Cards */}
      <div className="space-y-3">
        <div className="text-[11px] font-mono text-text/40 uppercase tracking-widest border-b border-panel pb-1">
          ASSIGNED INVESTIGATION ROUNDS
        </div>

        {isLoading ? (
          <div className="text-center py-6 text-xs font-mono text-text/40 animate-pulse">
            SYNCHRONIZING SQUAD ROSTER...
          </div>
        ) : (
          members.map((member) => {
            const isMe = currentMember?.id === member.id;
            return (
              <div
                key={member.id}
                className={`p-3 border transition-colors flex flex-wrap items-center justify-between gap-3 ${
                  isMe
                    ? "border-cold-blue/60 bg-panel/60"
                    : "border-panel bg-panel/20"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-text uppercase">
                      AGENT {member.member_index}: {member.name}
                    </span>
                    {isMe && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 bg-cold-blue/20 text-cold-blue border border-cold-blue/40 uppercase">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-text/40 mt-0.5">
                    {member.email}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Status Indicator */}
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        member.is_connected
                          ? "bg-emerald-400"
                          : "bg-amber-400/80 animate-pulse"
                      }`}
                    />
                    <span
                      className={
                        member.is_connected
                          ? "text-emerald-400"
                          : "text-amber-400/80"
                      }
                    >
                      {member.is_connected ? "ONLINE" : "OFFLINE"}
                    </span>
                  </div>

                  {/* Round Assignment Static Badge */}
                  <span className="px-3 py-1 bg-cold-blue/10 border border-cold-blue/60 text-cold-blue font-mono text-xs font-bold uppercase tracking-widest">
                    ROUND {member.assigned_round || member.member_index}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="text-xs text-emergency-red font-mono text-center tracking-wider uppercase border border-emergency-red/40 p-2 bg-emergency-red/10"
        >
          ⚠ {errorMsg}
        </div>
      )}

      {/* Start Button */}
      <button
        type="button"
        disabled={!canStart || isStarting}
        onClick={handleStartGame}
        className="w-full py-4 bg-panel border border-cold-blue hover:bg-cold-blue hover:text-background text-cold-blue font-mono text-sm font-bold uppercase tracking-[0.2em] transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-panel disabled:hover:text-cold-blue shadow-lg"
      >
        {isStarting
          ? "INITIALIZING FACILITY BREACH..."
          : canStart
          ? "COMMENCE SQUAD INVESTIGATION →"
          : `WAITING FOR ALL 4 AGENTS TO CONNECT (${connectedCount}/4)...`}
      </button>
    </TerminalPanel>
  );
}

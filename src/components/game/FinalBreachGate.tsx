"use client";

import React from "react";

export interface FinalBreachGateMember {
  id: string;
  name: string;
  member_index: number;
  email?: string;
}

interface FinalBreachGateProps {
  teamName: string;
  members: FinalBreachGateMember[];
  currentMemberId?: string;
  readyMemberIds?: string[];
  onAuthorize: () => Promise<void>;
  isAuthorizing?: boolean;
}

export function FinalBreachGate({
  teamName,
  members = [],
  currentMemberId,
  readyMemberIds = [],
  onAuthorize,
  isAuthorizing = false,
}: FinalBreachGateProps) {
  const readyCount = readyMemberIds.length;
  const targetCount = 4;
  const percentage = Math.min(100, Math.round((readyCount / targetCount) * 100));

  // Determine if the currently logged-in user has already authorized
  const hasUserAuthorized = Boolean(
    currentMemberId && readyMemberIds.includes(currentMemberId)
  );

  const allAuthorized = readyCount >= 4;

  return (
    <div className="w-full max-w-4xl mx-auto font-mono select-none space-y-6 animate-in fade-in duration-300">
      {/* Header Card matching Terminal CSI Atmosphere */}
      <div className="border border-rose-500/60 bg-[var(--panel)]/95 p-6 sm:p-8 rounded-xs shadow-2xl space-y-4 relative overflow-hidden">
        {/* Subtle red emergency pulse top stripe */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent animate-pulse" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--panel-border)]/70 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-400 tracking-widest uppercase">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
              <span>FINAL PROTOCOL // SECTOR 05 CONTAINMENT AIRLOCK</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-wider text-[var(--text)] uppercase">
              {teamName} {"//"} ALL-SQUAD SYNCHRONIZATION GATE
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              GATE LOCK: <span className="text-rose-300 font-bold">4-OPERATOR AUTHORIZATION REQUIRED</span>
            </p>
          </div>

          <div className="px-3.5 py-1.5 bg-rose-950/40 border border-rose-500/50 rounded-xs text-center min-w-[130px]">
            <span className="text-[10px] text-rose-300/80 uppercase font-semibold block">
              STATUS
            </span>
            <span className="text-sm font-bold tracking-widest text-rose-400 uppercase">
              {allAuthorized ? "GATE UNLOCKED" : "LOCKED"}
            </span>
          </div>
        </div>

        {/* Operational Directive */}
        <p className="text-xs sm:text-sm text-[var(--text)] leading-relaxed">
          Round 4 investigation has concluded. Sector 5 contains the central core and requires 
          <strong> simultaneous 4-agent synchronization</strong>. Each member must click below once to confirm readiness. Once all 4 operatives authorize, the final room will deploy for all agents simultaneously.
        </p>
      </div>

      {/* 4-Step Progress Bar Section */}
      <div className="border border-[var(--panel-border)] bg-[var(--panel)]/80 p-5 sm:p-6 rounded-xs shadow-lg space-y-4">
        <div className="flex items-center justify-between text-xs tracking-wider uppercase font-bold">
          <span className="text-[var(--text)] flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full" />
            SYNCHRONIZATION PROGRESS:
          </span>
          <span className="text-emerald-400 font-bold tabular-nums text-sm">
            {readyCount} / {targetCount} OPERATORS READY ({percentage}%)
          </span>
        </div>

        {/* 4-Segment Visual Bar */}
        <div className="grid grid-cols-4 gap-2 h-4 sm:h-5 bg-[var(--bg)]/90 p-1 border border-[var(--panel-border)] rounded-xs">
          {[1, 2, 3, 4].map((step) => {
            const isFilled = readyCount >= step;
            return (
              <div
                key={`progress-segment-${step}`}
                className={`h-full rounded-2xs transition-all duration-500 ${
                  isFilled
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]"
                    : "bg-white/[0.04] border border-white/[0.06]"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Roster of 4 Operators: Authorized (Green) vs Remaining (Red) */}
      <div className="border border-[var(--panel-border)] bg-[var(--panel)]/80 p-5 sm:p-6 rounded-xs shadow-lg space-y-4">
        <div className="flex items-center justify-between text-xs tracking-wider uppercase font-bold text-[var(--accent)] border-b border-[var(--panel-border)]/50 pb-2">
          <span>OPERATOR READINESS ROSTER</span>
          <span className="text-[10px] text-[var(--text-muted)] font-normal">
            GREEN = READY · RED = AWAITING CLICK
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {members.map((member) => {
            const isReady = readyMemberIds.includes(member.id);
            const isMe = member.id === currentMemberId;

            return (
              <div
                key={`gate-member-${member.id}`}
                className={`p-4 border rounded-xs flex items-center justify-between gap-3 transition-colors ${
                  isReady
                    ? "border-emerald-500/80 bg-emerald-950/25 text-emerald-300 shadow-xs"
                    : "border-rose-500/70 bg-rose-950/25 text-rose-300"
                }`}
              >
                <div className="space-y-1 truncate">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold tracking-wider truncate">
                      {member.name}
                    </span>
                    {isMe && (
                      <span className="px-1.5 py-0.2 bg-[var(--accent)] text-[var(--bg)] font-bold rounded-2xs text-[9px] uppercase">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] tracking-wider uppercase">
                    OPERATOR {member.member_index}
                  </div>
                </div>

                {/* Status Badge: Green (Ready) vs Red (Pending) */}
                <div className="shrink-0">
                  {isReady ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/80 border border-emerald-500/70 text-emerald-400 font-bold text-[11px] uppercase rounded-xs">
                      <span>✓</span>
                      <span>READY</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-950/80 border border-rose-500/70 text-rose-400 font-bold text-[11px] uppercase rounded-xs animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <span>PENDING</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Button: Single-click enforced */}
      <div className="border border-[var(--panel-border)] bg-[var(--panel)]/90 p-5 sm:p-6 rounded-xs shadow-xl text-center space-y-3">
        {allAuthorized ? (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/80 text-emerald-400 font-bold text-xs uppercase tracking-widest rounded-xs animate-pulse">
            ✓ ALL 4 OPERATORS AUTHORIZED. INITIALIZING SECTOR 5 PROTOCOL...
          </div>
        ) : hasUserAuthorized ? (
          <div className="space-y-2">
            <button
              type="button"
              disabled={true}
              className="w-full sm:w-auto px-10 py-3 bg-emerald-950/60 border border-emerald-500/60 text-emerald-400 font-bold text-xs uppercase tracking-widest rounded-xs opacity-90 cursor-not-allowed shadow-xs"
            >
              ✓ YOUR AUTHORIZATION RECORDED (1/1) — WAITING FOR TEAMMATES
            </button>
            <p className="text-[11px] text-[var(--text-muted)]">
              You have completed your single authorization click. Waiting for remaining squad members in red to click.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={onAuthorize}
              disabled={isAuthorizing}
              className="w-full sm:w-auto px-12 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-[var(--bg)] font-bold text-xs sm:text-sm uppercase tracking-widest rounded-xs transition-all cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95 focus-visible:outline-2 focus-visible:outline-emerald-400"
            >
              {isAuthorizing ? "RECORDING AUTHORIZATION..." : "AUTHORIZE FINAL BREACH [ CLICK ONCE ]"}
            </button>
            <p className="text-[11px] text-[var(--text-muted)]">
              Notice: Each operative can authorize only once. Multiple clicks are restricted.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FinalBreachGate;

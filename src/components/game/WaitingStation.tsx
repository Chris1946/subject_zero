"use client";

import React from "react";
import { formatDurationMmSs } from "@/lib/game/admin-utils";

export interface RecoveredAnswerItem {
  questionId: string;
  roundNumber: number;
  questionIndexInRound: number;
  title: string;
  answer: string;
  revealText?: string;
}

export interface WaitingStationMember {
  id: string;
  name: string;
  member_index: number;
  assigned_round: number;
  is_connected?: boolean;
}

interface WaitingStationProps {
  teamName: string;
  activeOperatorName?: string;
  activeRound: number;
  roundRemainingSeconds?: number | null;
  roundStarted?: boolean;
  members: WaitingStationMember[];
  currentMemberId?: string;
  recoveredAnswers?: RecoveredAnswerItem[];
  locationName?: string;
  isOvertime?: boolean;
  overtimeSeconds?: number;
  roundEffectiveBudgetSeconds?: number;
  roundIncomingDebtSeconds?: number;
}

export function WaitingStation({
  teamName,
  activeOperatorName = "Assigned Agent",
  activeRound,
  roundRemainingSeconds,
  roundStarted = false,
  members = [],
  currentMemberId,
  recoveredAnswers = [],
  locationName = "Holloway Research Facility",
  isOvertime = false,
  overtimeSeconds = 0,
  roundEffectiveBudgetSeconds = 600,
  roundIncomingDebtSeconds = 0,
}: WaitingStationProps) {
  // Group recovered answers by round
  const answersByRound: Record<number, RecoveredAnswerItem[]> = {};
  for (const item of recoveredAnswers) {
    if (!answersByRound[item.roundNumber]) {
      answersByRound[item.roundNumber] = [];
    }
    answersByRound[item.roundNumber].push(item);
  }

  const roomNames: Record<number, string> = {
    1: "Sub-Level 01: Systems Control",
    2: "Server Hub 02: Network Archives",
    3: "Mainframe Lab 03: Memory Core",
    4: "Archive Vault 04: Incident Records",
  };

  return (
    <div className="w-full max-w-5xl mx-auto font-mono select-none space-y-6 animate-in fade-in duration-300">
      {/* Top Banner: Mission Control Header */}
      <div className="border border-[var(--accent)]/50 bg-[var(--panel)]/90 p-5 sm:p-6 rounded-xs shadow-xl relative overflow-hidden">
        {/* Subtle decorative scanning line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent animate-pulse" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--panel-border)]/60 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] text-[var(--accent)] tracking-widest font-bold uppercase">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
              <span>COMMAND WAITING STATION · SECTOR {activeRound}</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold tracking-wider text-[var(--text)] uppercase">
              {teamName} {"//"} OVERWATCH TERMINAL
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              LOCATION: <span className="text-[var(--text)]">{locationName}</span>
            </p>
          </div>

          {/* Active Field Operative Status Pill */}
          <div
            className={`flex flex-col items-start sm:items-end gap-1.5 p-3 rounded-xs shadow-xs min-w-[220px] transition-colors ${
              isOvertime
                ? "bg-red-950/70 border border-red-500/80 text-red-300"
                : "bg-[var(--bg)]/90 border border-[var(--panel-border)]"
            }`}
          >
            <span className="text-[10px] text-[var(--text-muted)] tracking-wider uppercase font-semibold">
              FIELD OPERATIVE IN SECTOR:
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isOvertime ? "bg-red-500 animate-ping" : "bg-emerald-400 animate-pulse"
                }`}
              />
              <span
                className={`text-sm font-bold tracking-wider uppercase ${
                  isOvertime ? "text-red-400" : "text-emerald-400"
                }`}
              >
                {activeOperatorName}
              </span>
            </div>
            <div
              className={`text-[11px] font-mono tracking-widest font-bold ${
                isOvertime ? "text-red-400 animate-pulse" : "text-[var(--accent)]"
              }`}
            >
              {!roundStarted
                ? `ROUND TIMER: ${formatDurationMmSs(roundEffectiveBudgetSeconds)} [STANDBY]`
                : isOvertime
                ? `⚠️ OVERTIME: +${formatDurationMmSs(overtimeSeconds)} / 05:00 MAX`
                : typeof roundRemainingSeconds === "number"
                ? `ROUND TIMER: ${formatDurationMmSs(roundRemainingSeconds)}`
                : "ROUND TIMER: 10:00"}
            </div>
          </div>
        </div>

        {/* Status Callout Banner */}
        {isOvertime ? (
          <div className="mt-4 p-3 bg-red-950/60 border border-red-500/80 rounded-xs flex items-center gap-3 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            <span className="text-xl text-red-400">⚠️</span>
            <div className="text-xs text-red-200 leading-relaxed font-mono">
              <strong>CRITICAL WARNING — EMERGENCY OVERTIME:</strong> Operative <strong>{activeOperatorName}</strong> has exceeded the 10-minute round budget. Up to 5:00 minutes of emergency overtime is currently active. Every second spent in overtime is being borrowed directly from subsequent squad members&apos; round time!
            </div>
          </div>
        ) : roundIncomingDebtSeconds > 0 ? (
          <div className="mt-4 p-3 bg-amber-950/40 border border-amber-500/50 rounded-xs flex items-center gap-3">
            <span className="text-base text-amber-400">⚠️</span>
            <div className="text-xs text-amber-200/90 leading-relaxed font-mono">
              <strong>TIME DEBT IN EFFECT:</strong> Previous round overtime resulted in a <strong>-{Math.round(roundIncomingDebtSeconds / 60)} minute</strong> budget penalty. Current operative has an effective round budget of <strong>{formatDurationMmSs(roundEffectiveBudgetSeconds)}</strong>.
            </div>
          </div>
        ) : (
          <div className="mt-4 p-3 bg-amber-950/30 border border-amber-500/40 rounded-xs flex items-center gap-3">
            <span className="text-base text-amber-400">ℹ</span>
            <div className="text-xs text-amber-200/90 leading-relaxed">
              <strong>STANDBY OVERWATCH ACTIVE:</strong> You are currently stationed in the Squad Control Room. 
              When your assigned sector rotation arrives, your terminal will automatically deploy into the field.
            </div>
          </div>
        )}
      </div>

      {/* Squad Rotation Schedule Grid */}
      <div className="border border-[var(--panel-border)] bg-[var(--panel)]/70 p-4 sm:p-5 rounded-xs shadow-md space-y-3">
        <div className="flex items-center justify-between text-xs tracking-wider uppercase font-bold text-[var(--accent)]">
          <span className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
            SQUAD ROTATION SCHEDULE
          </span>
          <span className="text-[11px] text-[var(--text-muted)] font-normal">
            4-OPERATOR STAGED DEPLOYMENT
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((roundNum) => {
            const member = members.find((m) => m.assigned_round === roundNum);
            const isCompleted = activeRound > roundNum;
            const isCurrent = activeRound === roundNum;
            const isMe = member?.id === currentMemberId;

            return (
              <div
                key={`round-slot-${roundNum}`}
                className={`p-3.5 border rounded-xs flex flex-col justify-between gap-3 transition-colors ${
                  isCurrent
                    ? "border-emerald-500/80 bg-emerald-950/25 shadow-md shadow-emerald-950/30 ring-1 ring-emerald-500/30"
                    : isCompleted
                    ? "border-[var(--accent)]/30 bg-[var(--bg)]/70 opacity-80"
                    : "border-[var(--panel-border)]/70 bg-[var(--bg)]/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-wider mb-1">
                    <span className="text-[var(--text-muted)] font-bold">ROUND {roundNum}</span>
                    {isMe && (
                      <span className="px-1.5 py-0.2 bg-[var(--accent)] text-[var(--bg)] font-bold rounded-2xs text-[9px]">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-[var(--text)] tracking-wider truncate">
                    {member?.name || `Agent ${roundNum}`}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">
                    {roomNames[roundNum] || `Sector ${roundNum}`}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="pt-2 border-t border-[var(--panel-border)]/40">
                  {isCompleted ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-[var(--accent)] font-semibold uppercase">
                      <span>✓</span>
                      <span>COMPLETED</span>
                    </span>
                  ) : isCurrent ? (
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold uppercase animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>DEPLOYED IN SECTOR</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-semibold uppercase">
                      <span>⏳</span>
                      <span>STANDBY</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recovered Answers Key Vault (As requested by user: Keep previous answers here to assist active player!) */}
      <div className="border border-[var(--panel-border)] bg-[var(--panel)]/70 p-4 sm:p-5 rounded-xs shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 border-b border-[var(--panel-border)]/50 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-[var(--accent)] uppercase">
            <span className="text-sm">🔑</span>
            <span>RECOVERED ARCHIVE KEYS & PREVIOUS SOLUTIONS</span>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] uppercase">
            COMMUNICATE THESE KEYS TO HELP YOUR ACTIVE OPERATIVE
          </span>
        </div>

        {recoveredAnswers.length === 0 ? (
          <div className="text-center py-8 text-xs text-[var(--text-muted)]/70 border border-dashed border-[var(--panel-border)]/60 rounded-xs space-y-2">
            <span className="text-xl inline-block">📡</span>
            <p className="font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Awaiting First Archive Recovery
            </p>
            <p className="text-[11px] text-[var(--text-muted)]/60 max-w-md mx-auto">
              Operative {activeOperatorName} is currently investigating Sector 1. As questions are solved, all recovered keys and codes will populate here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(answersByRound).map(([roundStr, items]) => {
              const rNum = parseInt(roundStr, 10);
              return (
                <div key={`round-answers-${rNum}`} className="space-y-2">
                  <div className="text-[11px] text-[var(--accent)] font-bold tracking-wider uppercase flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                    <span>ROUND {rNum} {"//"} {roomNames[rNum] || `SECTOR ${rNum}`}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {items.map((item) => (
                      <div
                        key={`recovered-q-${item.questionId}`}
                        className="border border-[var(--panel-border)] bg-[var(--bg)]/90 p-3 rounded-xs space-y-2 shadow-xs hover:border-[var(--accent)]/70 transition-colors"
                      >
                        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                          <span className="font-bold tracking-widest text-[var(--accent)]">
                            Q{item.questionId}
                          </span>
                          <span className="truncate max-w-[120px]" title={item.title}>
                            {item.title}
                          </span>
                        </div>

                        {/* Bold Glowing Answer String */}
                        <div className="bg-[var(--panel)]/90 border border-[var(--accent)]/40 px-2.5 py-1.5 rounded-2xs text-center">
                          <span className="text-xs sm:text-sm font-bold tracking-widest text-[var(--accent2)] font-mono selection:bg-[var(--accent)] selection:text-[var(--bg)]">
                            {item.answer}
                          </span>
                        </div>

                        {item.revealText && (
                          <p className="text-[10px] text-[var(--text-muted)]/80 line-clamp-2 leading-tight">
                            {item.revealText}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tactical Advice Reminder */}
        <div className="p-3 bg-[var(--bg)]/60 border border-[var(--panel-border)]/70 rounded-xs text-[11px] text-[var(--text-muted)] leading-relaxed">
          <strong className="text-[var(--accent)]">TACTICAL TIP:</strong> Questions in later rounds (such as Question 1.4, 2.4, 3.4, and 4.4) require combining previous keys recovered from earlier sub-questions. Keep these keys ready on voice or room chat to guide your operative!
        </div>
      </div>
    </div>
  );
}

export default WaitingStation;

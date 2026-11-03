"use client";

import React from "react";
import Link from "next/link";
import { TerminalPanel } from "@/components/TerminalPanel";

export interface Round5WaitingRoomMember {
  id: string;
  member_index: number;
  name: string;
  email?: string;
  assigned_round: number;
  is_connected?: boolean;
  round5_submitted?: boolean;
  round5_question_id?: string;
}

interface Round5WaitingRoomProps {
  teamName: string;
  members: Round5WaitingRoomMember[];
  currentMemberId?: string;
  round5SubmittedCount: number;
  allSubmitted: boolean;
  totalDurationFormatted?: string;
  roundBreakdown?: Array<{ round: number; durationSeconds: number; formattedTime: string }>;
}

export function Round5WaitingRoom({
  teamName,
  members,
  currentMemberId,
  round5SubmittedCount,
  allSubmitted,
  totalDurationFormatted,
  roundBreakdown,
}: Round5WaitingRoomProps) {
  const currentMember = members.find((m) => m.id === currentMemberId);
  const totalCount = members.length || 4;

  return (
    <TerminalPanel className="w-full max-w-4xl mx-auto my-4 p-6 sm:p-8 space-y-6 font-mono">
      {/* Top Chamber Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-[var(--panel-border)] pb-4 gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              allSubmitted ? "bg-emerald-400 animate-pulse" : "bg-amber-400 animate-ping"
            }`}
          />
          <span className="text-xs uppercase tracking-widest text-[var(--text-muted)] font-bold">
            CONTAINMENT CHAMBER 05 // DECOMPRESSION BUFFER
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider border ${
              allSubmitted
                ? "border-emerald-500/60 bg-emerald-950/40 text-emerald-300"
                : "border-amber-500/60 bg-amber-950/40 text-amber-300"
            }`}
          >
            {allSubmitted
              ? "✓ ALL 4 DIRECTIVES RESOLVED"
              : `STANDBY: [ ${round5SubmittedCount} / ${totalCount} SECURED ]`}
          </span>
        </div>
      </div>

      {/* Main Narrative Message */}
      <div className="space-y-3 py-2">
        <h1 className="text-lg sm:text-xl font-bold uppercase tracking-tight text-[var(--text)]">
          {allSubmitted
            ? "ALL 4 SQUAD DIRECTIVES SECURED! SUBJECT ZERO HAS BEEN CONTAINED."
            : "DIRECTIVE COMPLETED. WAIT HERE, OTHERS ARE COMING..."}
        </h1>

        <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
          {allSubmitted
            ? "Every operative has successfully solved and committed their containment code. The lockdown is lifted and squad performance telemetry has been archived."
            : `Your portion of the containment code has been successfully verified. Maintain your telemetry link in this buffer while the rest of squad "${teamName}" completes their directives.`}
        </p>

        {currentMember && (
          <div className="text-[11px] text-[var(--accent)] font-semibold pt-1">
            OPERATIVE IDENTIFIER: <span className="underline">{currentMember.name}</span> (ROUND 5 DIRECTIVE {currentMember.round5_question_id || `5.${currentMember.member_index}`})
          </div>
        )}
      </div>

      {/* 4 Operatives Live Telemetry Matrix */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold">
          <span>SQUAD SYNCHRONIZATION STATUS:</span>
          <span className={allSubmitted ? "text-emerald-400" : "text-amber-400"}>
            [{round5SubmittedCount} / {totalCount} DIRECTIVES FINISHED]
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {members.map((m) => {
            const isCompleted = Boolean(m.round5_submitted);
            const isSelf = m.id === currentMemberId;
            const directiveCode = m.round5_question_id || `5.${m.member_index}`;

            return (
              <div
                key={m.id}
                className={`p-3.5 border transition-all ${
                  isCompleted
                    ? "border-emerald-500/60 bg-emerald-950/20 shadow-xs"
                    : "border-amber-500/40 bg-amber-950/15"
                } ${isSelf ? "ring-1 ring-[var(--accent)]/50" : ""}`}
              >
                <div className="flex items-center justify-between text-[11px] border-b border-[var(--panel-border)]/50 pb-1.5 mb-2">
                  <span className="font-bold text-[var(--text)]">
                    OPERATIVE {m.member_index} {isSelf && <span className="text-[var(--accent)]">(YOU)</span>}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    DIRECTIVE {directiveCode}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--text)] truncate max-w-[150px]">
                    {m.name}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                        <span>✓</span>
                        <span>COMPLETED</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-950/80 border border-amber-500/60 text-amber-300 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping inline-block" />
                        <span>WORKING...</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* When All 4 Submitted: Performance Breakdown & Leaderboard Link */}
      {allSubmitted && (
        <div className="space-y-5 pt-4 border-t border-[var(--panel-border)] animate-in fade-in duration-500">
          {/* Round Breakdown Cards */}
          {roundBreakdown && roundBreakdown.length > 0 && (
            <div className="p-4 bg-[var(--bg)]/80 border border-[var(--panel-border)] space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--panel-border)]/50 pb-2">
                <span className="text-[11px] uppercase tracking-widest text-[var(--text-muted)] font-bold">
                  SQUAD TIMING TELEMETRY (BY ROUND)
                </span>
                {totalDurationFormatted && (
                  <span className="text-xs font-bold text-[var(--accent)]">
                    TOTAL TIME: {totalDurationFormatted}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                {roundBreakdown.map((rb) => {
                  const assignedMember = members.find((m) => m.assigned_round === rb.round);
                  return (
                    <div
                      key={rb.round}
                      className="p-2 border border-[var(--panel-border)] bg-[var(--panel)]/40 space-y-1"
                    >
                      <div className="text-[10px] text-[var(--text-muted)] uppercase font-bold">
                        ROUND {rb.round}
                      </div>
                      <div className="text-sm font-bold text-emerald-400">
                        {rb.formattedTime}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] truncate">
                        {rb.round === 5 ? "ALL SQUAD" : assignedMember?.name ?? `Agent ${rb.round}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Link: Leaderboard */}
          <div className="text-center pt-2">
            <Link
              href="/leaderboard"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-400 hover:bg-emerald-300 text-black text-xs sm:text-sm font-black uppercase tracking-[0.2em] shadow-2xl transition-all focus-visible:outline-2 focus-visible:outline-emerald-400 cursor-pointer"
            >
              <span>🏆</span>
              <span>VIEW LEADERBOARD & PODIUM RANKINGS →</span>
            </Link>
          </div>
        </div>
      )}
    </TerminalPanel>
  );
}

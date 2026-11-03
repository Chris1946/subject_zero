"use client";

import React, { useState, useEffect } from "react";
import { useSound } from "./SoundProvider";
import { formatDurationMmSs } from "@/lib/game/admin-utils";

interface GameHeaderProps {
  teamName: string;
  inGameClock?: string;
  roundRemainingSeconds?: number | null;
  roundStarted?: boolean;
  universalSeconds?: number | null;
  currentRound?: number | null;
  roomNumber?: number;
  questionNumber?: number;
  onLeave: () => Promise<void>;
  memberName?: string;
  joinCode?: string;
  statusBadge?: string;
  isMyTurn?: boolean;
  activeOperatorName?: string;
  isSquadFinished?: boolean;
  isOvertime?: boolean;
  overtimeSeconds?: number;
  roundEffectiveBudgetSeconds?: number;
  roundIncomingDebtSeconds?: number;
}

export function GameHeader({
  teamName,
  roundRemainingSeconds,
  roundStarted = false,
  universalSeconds,
  currentRound,
  roomNumber,
  questionNumber,
  onLeave,
  memberName,
  joinCode,
  statusBadge,
  isMyTurn = true,
  activeOperatorName,
  isSquadFinished = false,
  isOvertime = false,
  overtimeSeconds = 0,
  roundEffectiveBudgetSeconds = 600,
  roundIncomingDebtSeconds = 0,
}: GameHeaderProps) {
  const { isMuted, volume, toggleMute, setVolume } = useSound();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Fullscreen support state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenSupported] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return Boolean(document.fullscreenEnabled);
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      const handleFullscreenChange = () => {
        setIsFullscreen(Boolean(document.fullscreenElement));
      };

      document.addEventListener("fullscreenchange", handleFullscreenChange);
      return () => {
        document.removeEventListener("fullscreenchange", handleFullscreenChange);
      };
    }
  }, []);

  const toggleFullscreen = async () => {
    if (!fullscreenSupported || typeof document === "undefined") return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Ignore user gesture rejection
    }
  };

  const handleConfirmLeave = async () => {
    setIsLeaving(true);
    await onLeave();
  };

  return (
    <>
      <header className="w-full border-b border-[var(--panel-border)] bg-[var(--panel)]/85 backdrop-blur-xs px-3 sm:px-4 py-2 flex items-center justify-between text-xs tracking-wider uppercase font-mono select-none z-30 transition-colors duration-300">
        {/* Left: Team, Join Code, Member Username, Location badge */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[var(--text-muted)]/60 font-bold hidden md:inline">
              SQUAD:
            </span>
            <span className="text-[var(--accent)] font-bold tracking-widest truncate max-w-[120px] sm:max-w-xs">
              {teamName}
            </span>
          </div>

          {joinCode && (
            <span
              className="px-1.5 py-0.5 bg-[var(--bg)] border border-[var(--accent)]/50 text-[var(--accent)] text-[10px] font-bold tracking-widest"
              title="Squad Access Code"
            >
              CODE: {joinCode}
            </span>
          )}

          {memberName && (
            <span
              className="text-emerald-400 font-semibold text-[11px] truncate max-w-[110px] sm:max-w-xs flex items-center gap-1 bg-emerald-950/20 px-1.5 py-0.5 border border-emerald-500/30"
              title="Your Agent Username"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              <span>{memberName}</span>
            </span>
          )}

          {statusBadge ? (
            <>
              <span className="hidden lg:inline text-[var(--text-muted)]/40">|</span>
              <span className="text-[var(--text-muted)] text-[11px] hidden lg:inline">
                {statusBadge}
              </span>
            </>
          ) : roomNumber && questionNumber ? (
            <>
              <span className="hidden lg:inline text-[var(--text-muted)]/40">|</span>
              <span className="text-[var(--text-muted)] hidden lg:inline text-[11px]">
                ROOM {roomNumber} OF 5 · Q{questionNumber} OF 4
              </span>
            </>
          ) : null}
        </div>

        {/* Center: Total Stopwatch + Round Countdown Timer */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
          {/* Total Investigation Stopwatch (Runs during active play, stops and freezes when all 4 complete) */}
          {typeof universalSeconds === "number" && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 border rounded-xs shadow-xs transition-colors ${
                isSquadFinished
                  ? "bg-emerald-950/40 border-emerald-500/60 text-emerald-300"
                  : "bg-amber-950/40 border-amber-500/50"
              }`}
              title={isSquadFinished ? "Official Final Squad Time (Concluded)" : "Official Competition Total Time"}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isSquadFinished ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
                }`}
              />
              <span
                className={`text-[10px] font-bold hidden sm:inline ${
                  isSquadFinished ? "text-emerald-400" : "text-amber-400/90"
                }`}
              >
                {isSquadFinished ? "FINAL TIME:" : "TOTAL:"}
              </span>
              <span
                className={`font-bold tabular-nums tracking-widest text-[11px] sm:text-xs ${
                  isSquadFinished ? "text-emerald-300" : "text-amber-300"
                }`}
              >
                {formatDurationMmSs(universalSeconds)}
              </span>
            </div>
          )}

          {/* Round Countdown Timer / Overtime Badge */}
          {isMyTurn && (typeof roundRemainingSeconds === "number" || isOvertime) && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xs transition-colors ${
                isSquadFinished
                  ? "bg-emerald-950/40 border border-emerald-500/60 text-emerald-400"
                  : isOvertime
                  ? "border border-red-500 bg-red-950/60 text-red-400 animate-pulse font-extrabold shadow-[0_0_12px_rgba(239,68,68,0.5)]"
                  : roundStarted && roundRemainingSeconds !== null && roundRemainingSeconds !== undefined && roundRemainingSeconds < 120
                  ? "border border-[var(--danger)] bg-[var(--danger)]/10 text-[var(--danger)] animate-pulse"
                  : "border border-[var(--panel-border)] bg-[var(--bg)]/90 text-[var(--accent)]"
              }`}
              title={
                isSquadFinished
                  ? "Round 5 Objectives Resolved"
                  : isOvertime
                  ? "Emergency overtime active (+5m max). Borrowing from next operative's round budget!"
                  : roundIncomingDebtSeconds > 0
                  ? `Sector timer reduced due to previous round debt (-${Math.round(roundIncomingDebtSeconds / 60)}m)`
                  : "Round sector timer"
              }
            >
              <span className="text-[10px] text-[var(--text-muted)] font-bold hidden sm:inline">
                {isOvertime ? "⚠️ OVERTIME:" : `ROUND ${currentRound ?? 1} TIMER:`}
              </span>
              <span className="font-bold tabular-nums tracking-widest text-[11px] sm:text-xs">
                {isSquadFinished
                  ? "✓ CONCLUDED"
                  : !roundStarted
                  ? `${formatDurationMmSs(roundEffectiveBudgetSeconds)} [STANDBY]`
                  : isOvertime
                  ? `+${formatDurationMmSs(overtimeSeconds)} / 05:00 MAX`
                  : formatDurationMmSs(roundRemainingSeconds ?? 0)}
              </span>
            </div>
          )}

          {/* Spectator Status Badge (When watching teammate play) */}
          {!isMyTurn && activeOperatorName && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 border rounded-xs text-[11px] ${
                isOvertime
                  ? "border-red-500 bg-red-950/50 text-red-400 animate-pulse"
                  : "border-[var(--panel-border)] bg-[var(--bg)]/80"
              }`}
              title={
                isOvertime
                  ? "Teammate is currently in overtime borrowing time from subsequent rounds"
                  : "Observation Mode: Teammate is active"
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isOvertime ? "bg-red-500" : "bg-[var(--warn)]"
                }`}
              />
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold">OPERATOR:</span>
              <span className="text-[var(--accent)] font-bold tracking-wider">{activeOperatorName}</span>
              {isOvertime && (
                <span className="text-red-400 font-bold ml-1 text-[10px]">
                  [OVERTIME +{formatDurationMmSs(overtimeSeconds)}]
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Leaderboard, Audio control, Fullscreen, and Leave terminal */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Leaderboard link */}
          <a
            href="/leaderboard"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] px-2.5 py-1 text-[var(--accent)]/80 hover:text-[var(--accent)] border border-transparent hover:border-[var(--panel-border)] rounded-xs focus-visible:outline-2 focus-visible:outline-[var(--accent)] transition-colors flex items-center justify-center text-[11px]"
            title="Open Live Standings in a new tab"
          >
            [LEADERBOARD]
          </a>

          {/* Audio Controls */}
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={toggleMute}
              className="min-h-[44px] min-w-[44px] px-2.5 py-1 text-[var(--text-muted)] hover:text-[var(--text)] border border-transparent hover:border-[var(--panel-border)] rounded-xs focus-visible:outline-2 focus-visible:outline-[var(--accent)] transition-colors flex items-center justify-center gap-1 text-[11px]"
              title={isMuted ? "Unmute terminal ambience" : "Mute terminal ambience"}
              aria-label={isMuted ? "Unmute terminal ambience" : "Mute terminal ambience"}
            >
              <span>{isMuted ? "🔇" : "🔊"}</span>
              <span className="hidden md:inline">{isMuted ? "[MUTED]" : "[AUDIO ON]"}</span>
            </button>

            {/* Volume toggle slider */}
            <button
              type="button"
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              className="min-h-[44px] px-1 text-[var(--text-muted)]/60 hover:text-[var(--text)] text-[10px]"
              title="Volume control"
              aria-label="Adjust volume"
            >
              ⚙
            </button>

            {showVolumeSlider && (
              <div
                role="dialog"
                aria-label="Volume adjustment"
                className="absolute right-0 top-12 z-50 p-3 bg-[var(--panel)] border border-[var(--panel-border)] shadow-2xl flex flex-col gap-2 min-w-[160px]"
              >
                <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                  <span>VOLUME</span>
                  <span>{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-[var(--accent)] cursor-pointer h-2 bg-[var(--bg)] rounded-none"
                  aria-label="Master volume slider"
                />
              </div>
            )}
          </div>

          {/* Fullscreen Toggle (Hidden if unsupported) */}
          {fullscreenSupported && (
            <button
              type="button"
              onClick={toggleFullscreen}
              className="min-h-[44px] min-w-[44px] px-2.5 py-1 text-[var(--text-muted)] hover:text-[var(--text)] border border-transparent hover:border-[var(--panel-border)] rounded-xs focus-visible:outline-2 focus-visible:outline-[var(--accent)] transition-colors flex items-center justify-center text-[11px]"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              <span className="hidden sm:inline">[{isFullscreen ? "WINDOW" : "EXPAND"}]</span>
              <span className="sm:hidden">{isFullscreen ? "🗗" : "🗖"}</span>
            </button>
          )}

          {/* Leave Button */}
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="min-h-[44px] min-w-[44px] px-2.5 py-1 text-[var(--danger)]/80 hover:text-[var(--danger)] border border-transparent hover:border-[var(--panel-border)] rounded-xs focus-visible:outline-2 focus-visible:outline-[var(--danger)] transition-colors flex items-center justify-center text-[11px]"
            title="Leave terminal session"
          >
            [LEAVE]
          </button>
        </div>
      </header>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-leave-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg)]/85 backdrop-blur-xs"
        >
          <div className="w-full max-w-sm border border-[var(--danger)]/60 bg-[var(--panel)] p-6 shadow-2xl font-mono text-xs">
            <h2 id="confirm-leave-title" className="text-sm font-bold text-[var(--danger)] mb-3">
              DISCONNECT TERMINAL?
            </h2>
            <p className="text-[var(--text)]/80 mb-6 leading-relaxed">
              Your session will end. Team progress remains recorded in facility containment.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isLeaving}
                className="min-h-[44px] px-4 py-2 border border-[var(--panel-border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirmLeave}
                disabled={isLeaving}
                className="min-h-[44px] px-4 py-2 bg-[var(--danger)]/20 border border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-[var(--bg)] focus-visible:outline-2 focus-visible:outline-[var(--danger)] font-bold transition-colors"
              >
                {isLeaving ? "EXITING..." : "CONFIRM DISCONNECT"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

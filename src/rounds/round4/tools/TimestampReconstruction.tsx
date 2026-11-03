"use client";

import React, { useState } from "react";
import { ToolProps } from "@/rounds/types";

export interface TimestampCardItem {
  id: number;
  timestamp: string;
  letter: string;
}

const DEFAULT_ITEMS: TimestampCardItem[] = [
  { id: 1, timestamp: "23:17:42", letter: "U" },
  { id: 2, timestamp: "23:12:08", letter: "T" },
  { id: 3, timestamp: "23:19:55", letter: "H" },
  { id: 4, timestamp: "23:14:31", letter: "R" },
  { id: 5, timestamp: "23:18:16", letter: "T" },
];

export interface TimestampReconstructionProps extends ToolProps<unknown> {
  onAnswerSubmit?: (answer: string) => Promise<unknown> | void;
  standalone?: boolean;
}

export function TimestampReconstruction({
  disabled = false,
  onAnswerSubmit,
}: TimestampReconstructionProps) {
  const [cards, setCards] = useState<TimestampCardItem[]>(DEFAULT_ITEMS);
  const [showLetters, setShowLetters] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Swap card with left neighbor
  const handleMoveLeft = (index: number) => {
    if (index <= 0 || disabled) return;
    setCards((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
    setFeedback(null);
  };

  // Swap card with right neighbor
  const handleMoveRight = (index: number) => {
    if (index >= cards.length - 1 || disabled) return;
    setCards((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
    setFeedback(null);
  };

  const currentOrder = cards.map((c) => c.letter).join("");

  const handleSubmit = async () => {
    if (disabled || isSubmitting) return;

    // Check if timestamps are arranged chronologically from earliest to latest
    const outOfOrderIndex = cards.findIndex((card, i) => {
      if (i === 0) return false;
      return card.timestamp < cards[i - 1].timestamp;
    });

    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (outOfOrderIndex !== -1) {
        const prevCard = cards[outOfOrderIndex - 1];
        const currCard = cards[outOfOrderIndex];
        // Send attempt to server validator if attached
        if (onAnswerSubmit) {
          const res = await onAnswerSubmit(currentOrder);
          const resObj = (res && typeof res === "object" ? res : {}) as { correct?: boolean; feedback?: string };
          setFeedback({
            type: "error",
            message:
              resObj.feedback ||
              `INCORRECT SEQUENCE: "${currentOrder}". TIMESTAMPS NOT CHRONOLOGICAL (${prevCard.timestamp} COMES AFTER ${currCard.timestamp}). ARRANGE FROM EARLIEST TO LATEST.`,
          });
        } else {
          setFeedback({
            type: "error",
            message: `INCORRECT SEQUENCE: "${currentOrder}". TIMESTAMPS NOT CHRONOLOGICAL (${prevCard.timestamp} COMES AFTER ${currCard.timestamp}). ARRANGE FROM EARLIEST TO LATEST.`,
          });
        }
        return;
      }

      // Timestamps are chronologically arranged
      if (onAnswerSubmit) {
        const res = await onAnswerSubmit(currentOrder);
        const resObj = (res && typeof res === "object" ? res : {}) as { correct?: boolean; feedback?: string };
        if (resObj.correct === false) {
          setFeedback({
            type: "error",
            message: resObj.feedback || `INCORRECT SEQUENCE: "${currentOrder}". ARRANGE TIMESTAMPS CHRONOLOGICALLY.`,
          });
        } else {
          setFeedback({
            type: "success",
            message: "✓ ARCHIVE RECORD RECONSTRUCTED: TRANSMISSION ACCEPTED.",
          });
        }
      } else {
        setFeedback({
          type: "success",
          message: "✓ ARCHIVE RECORD RECONSTRUCTED: TRANSMISSION ACCEPTED.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "TRANSMISSION ERROR. RETRY SUBMISSION.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full font-mono select-none space-y-6">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between border-b border-[var(--panel-border)]/70 pb-2">
        <h2 className="text-sm sm:text-base font-bold text-[var(--accent)] tracking-widest uppercase flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-[var(--accent)] animate-pulse" />
          ARCHIVE TERMINAL 01: TIMESTAMP RECONSTRUCTION · Q4.1
        </h2>
        <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline uppercase">
          SEC-04 // RECORDS: 5
        </span>
      </div>

      {/* Top Grid: Plain Table on Left, Instructions & Hint on Right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Original Plain Table */}
        <div className="border border-[var(--panel-border)] bg-[var(--panel)]/70 p-4 sm:p-5 font-mono text-xs sm:text-sm shadow-md flex flex-col justify-center">
          <div className="text-[var(--text-muted)] pb-2 font-semibold border-b border-[var(--panel-border)]/50 flex justify-between">
            <span>Timestamp</span>
            <span>Letter</span>
          </div>
          <div className="divide-y divide-[var(--panel-border)]/30 text-[var(--text)] pt-1 space-y-1">
            <div className="flex justify-between py-1">
              <span>23:17:42</span>
              <span className="text-[var(--accent2)] font-bold">U</span>
            </div>
            <div className="flex justify-between py-1">
              <span>23:12:08</span>
              <span className="text-[var(--accent2)] font-bold">T</span>
            </div>
            <div className="flex justify-between py-1">
              <span>23:19:55</span>
              <span className="text-[var(--accent2)] font-bold">H</span>
            </div>
            <div className="flex justify-between py-1">
              <span>23:14:31</span>
              <span className="text-[var(--accent2)] font-bold">R</span>
            </div>
            <div className="flex justify-between py-1">
              <span>23:18:16</span>
              <span className="text-[var(--accent2)] font-bold">T</span>
            </div>
          </div>
        </div>

        {/* Right: Instructions & Hint Cards */}
        <div className="flex flex-col gap-3">
          {/* INSTRUCTIONS */}
          <div className="border border-[var(--panel-border)] bg-[var(--panel)]/60 p-4 space-y-2 text-xs shadow-md">
            <div className="text-[var(--accent)] font-bold tracking-wider uppercase flex items-center gap-1.5 text-xs">
              <span>ⓘ</span>
              <span>INSTRUCTIONS</span>
            </div>
            <p className="text-[var(--text)] leading-relaxed">
              Arrange the timestamps from earliest to latest and read the letters in that order.
            </p>
            <p className="text-[var(--text-muted)] text-[11px]">
              Use the arrow buttons to rearrange the cards, then submit the reconstructed sequence.
            </p>
          </div>

          {/* HINT */}
          <div className="border border-[var(--panel-border)] bg-[var(--panel)]/60 p-4 space-y-2 text-xs shadow-md">
            <div className="text-[var(--accent)] font-bold tracking-wider uppercase flex items-center gap-1.5 text-xs">
              <span>🎯</span>
              <span>HINT</span>
            </div>
            <p className="text-[var(--text-muted)] text-[11px] leading-relaxed">
              Use the arrow buttons to rearrange the cards. The letters will be revealed on each card.
            </p>
          </div>
        </div>
      </div>

      {/* Middle Section: TIMESTAMP CARDS */}
      <div className="border border-[var(--panel-border)] bg-[var(--panel)]/50 p-4 sm:p-5 shadow-lg space-y-4">
        {/* Section Header */}
        <div className="text-xs text-[var(--accent)] tracking-wider">
          <span className="font-bold">TIMESTAMP CARDS</span> · Use the arrows to reorder the cards.
        </div>

        {/* 5 Timestamp Cards in a horizontal row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {cards.map((card, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === cards.length - 1;

            return (
              <div
                key={`card-${card.id}`}
                className="border border-[var(--accent)]/40 bg-[var(--bg)]/90 p-3 sm:p-4 rounded-sm flex flex-col items-center justify-between text-center gap-3 shadow-md hover:border-[var(--accent)] transition-colors"
              >
                {/* Timestamp */}
                <div className="text-xs font-mono font-semibold text-[var(--text)] tracking-wider">
                  {card.timestamp}
                </div>

                {/* Glowing Purple Letter */}
                <div className="h-10 flex items-center justify-center">
                  {showLetters ? (
                    <span className="text-2xl sm:text-3xl font-bold text-[#c084fc] drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]">
                      {card.letter}
                    </span>
                  ) : (
                    <span className="text-xl font-bold text-[var(--text-muted)]/40">
                      ?
                    </span>
                  )}
                </div>

                {/* Left and Right Arrow Buttons */}
                <div className="flex items-center gap-2 w-full justify-center">
                  <button
                    type="button"
                    onClick={() => handleMoveLeft(idx)}
                    disabled={isFirst || disabled}
                    className="w-10 h-8 flex items-center justify-center border border-[var(--panel-border)] bg-[var(--panel)]/70 hover:bg-[var(--panel)] text-[var(--accent)] hover:text-[var(--accent2)] disabled:opacity-30 disabled:cursor-not-allowed text-xs transition-colors cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                    title="Move Left"
                    aria-label={`Move ${card.timestamp} Left`}
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveRight(idx)}
                    disabled={isLast || disabled}
                    className="w-10 h-8 flex items-center justify-center border border-[var(--panel-border)] bg-[var(--panel)]/70 hover:bg-[var(--panel)] text-[var(--accent)] hover:text-[var(--accent2)] disabled:opacity-30 disabled:cursor-not-allowed text-xs transition-colors cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                    title="Move Right"
                    aria-label={`Move ${card.timestamp} Right`}
                  >
                    ▶
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Hide All Letters Accessibility Button */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowLetters(!showLetters)}
            className="px-4 py-2 border border-[var(--panel-border)] bg-[var(--bg)]/80 hover:bg-[var(--panel)] text-[var(--accent)] text-xs tracking-wider transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
          >
            {showLetters ? "Hide all letters (accessibility)" : "Show all letters (accessibility)"}
          </button>
        </div>

        {/* Current Order Reads Display */}
        <div className="border border-[var(--panel-border)]/80 bg-[var(--bg)]/70 p-3 text-xs tracking-wider flex items-center gap-2">
          <span className="text-[var(--text-muted)]">Current order reads:</span>
          <span className="font-bold text-[var(--text)] tracking-[0.2em] underline">
            {currentOrder}
          </span>
        </div>
      </div>

      {/* Bottom Section: SEQUENCE SUBMISSION (Derived directly from arranged cards) */}
      <div className="border border-[var(--panel-border)] bg-[var(--panel)]/60 p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-[var(--accent)] font-bold uppercase text-xs tracking-wider flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-pulse" />
            RECONSTRUCTED SEQUENCE SUBMISSION
          </div>
          <span className="text-[11px] text-[var(--text-muted)] font-mono uppercase hidden sm:inline">
            ORDER DETERMINED BY CARDS ABOVE
          </span>
        </div>

        {/* Live arranged letters display and Submit Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-[var(--bg)]/80 border border-[var(--panel-border)]/70 rounded-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-[var(--text-muted)] font-semibold uppercase tracking-wider">
              Sequence:
            </span>
            <div className="flex items-center gap-1.5">
              {cards.map((card, idx) => (
                <div
                  key={`seq-tile-${card.id}-${idx}`}
                  className="w-9 h-9 border border-[var(--accent)]/60 bg-[var(--panel)]/90 flex items-center justify-center font-bold text-sm text-[var(--accent2)] shadow-xs transition-transform"
                >
                  {showLetters ? card.letter : "?"}
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled || isSubmitting}
            className="w-full sm:w-auto px-8 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent2)] disabled:opacity-40 text-[var(--bg)] font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-[var(--accent)] active:scale-95"
          >
            {isSubmitting ? "CHECKING SEQUENCE..." : `SUBMIT [ ${currentOrder} ]`}
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 text-xs border font-mono animate-in fade-in duration-150 ${
              feedback.type === "success"
                ? "border-[var(--success)]/70 bg-[var(--success)]/10 text-[var(--success)]"
                : "border-[var(--danger)]/70 bg-[var(--danger)]/10 text-[var(--danger)]"
            }`}
          >
            {feedback.message}
          </div>
        )}
      </div>
    </div>
  );
}

export default TimestampReconstruction;

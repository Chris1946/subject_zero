"use client";

import React, { useState, useRef } from "react";
import { ToolProps } from "@/rounds/types";

export interface DataReconstructionProps extends ToolProps<unknown> {
  onAnswerSubmit?: (answer: string) => Promise<unknown> | void;
  standalone?: boolean;
}

export function DataReconstruction({
  disabled = false,
  onAnswerSubmit,
}: DataReconstructionProps) {
  // Four bit boxes: bit 0, 1, 2, 3
  const [bits, setBits] = useState<string[]>(["", "", "", ""]);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Input refs for automatic focus progression
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleBitChange = (index: number, val: string) => {
    if (disabled || isSubmitting) return;

    // Only allow 0 or 1
    const clean = val.replace(/[^01]/g, "");
    if (!clean) {
      setBits((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
      return;
    }

    const char = clean[clean.length - 1]; // Take the last valid digit
    setBits((prev) => {
      const next = [...prev];
      next[index] = char;
      return next;
    });
    setFeedback(null);

    // Auto-advance to next input box
    if (index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !bits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs[index - 1].current?.focus();
    } else if (e.key === "ArrowRight" && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/[^01]/g, "");
    if (!pasteData) return;

    const next = ["", "", "", ""];
    for (let i = 0; i < 4 && i < pasteData.length; i++) {
      next[i] = pasteData[i];
    }
    setBits(next);
    setFeedback(null);

    const focusIdx = Math.min(3, pasteData.length);
    inputRefs[focusIdx].current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || isSubmitting) return;

    const answerStr = bits.join("");
    if (answerStr.length < 4) {
      setFeedback({
        type: "error",
        message: "ENTER ALL 4 BITS (0 OR 1) BEFORE SUBMITTING.",
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (onAnswerSubmit) {
        const res = await onAnswerSubmit(answerStr);
        const resObj = (res && typeof res === "object" ? res : {}) as { correct?: boolean; feedback?: string };
        if (resObj.correct === false) {
          setFeedback({
            type: "error",
            message: resObj.feedback || "DATA FRAGMENT INVALID. CHECK EACH XOR OPERATION.",
          });
        } else {
          setFeedback({
            type: "success",
            message: "✓ DATA FRAGMENT RECONSTRUCTED: VERIFIED.",
          });
        }
      } else {
        setFeedback({
          type: "success",
          message: "✓ DATA FRAGMENT RECONSTRUCTED: VERIFIED.",
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
      {/* Terminal Title Bar matching Screenshot */}
      <div className="flex items-center justify-between border-b border-[var(--panel-border)]/70 pb-2">
        <h2 className="text-sm sm:text-base font-bold text-[var(--accent)] tracking-widest uppercase flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-[var(--accent)] animate-pulse" />
          NETWORK TERMINAL 02 : DATA RECONSTRUCTION
        </h2>
        <span className="text-sm sm:text-base font-bold text-[var(--accent)] uppercase">
          Q2.2
        </span>
      </div>

      {/* Main Grid: Left (Task + XOR Reference) & Right (Table + Stacked Calculation) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: TASK and XOR Reference Cards (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* TASK Card */}
          <div className="border border-[var(--panel-border)] bg-[var(--panel)]/70 p-4 sm:p-5 rounded-sm shadow-md space-y-2">
            <div className="text-[var(--accent)] font-bold tracking-wider uppercase flex items-center gap-2 text-xs">
              <span className="text-sm">🗄</span>
              <span>TASK</span>
            </div>
            <p className="text-xs text-[var(--text)] leading-relaxed">
              Use XOR to combine the binary data from sessions A, C and F.
            </p>
          </div>

          {/* XOR (bitwise) REFERENCE Card */}
          <div className="border border-[var(--panel-border)] bg-[var(--panel)]/70 p-4 sm:p-5 rounded-sm shadow-md space-y-3 flex-1 flex flex-col justify-center">
            <div className="text-[var(--accent)] font-bold tracking-wider uppercase flex items-center gap-2 text-xs">
              <span>ⓘ</span>
              <span>XOR (bitwise) REFERENCE</span>
            </div>

            <div className="space-y-1.5 font-mono text-xs pl-2">
              <div className="flex items-center gap-2">
                <span className="text-[var(--text)]">0 XOR 0</span>
                <span className="text-[var(--success)] font-bold">= 0</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--text)]">0 XOR 1</span>
                <span className="text-[var(--success)] font-bold">= 1</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--text)]">1 XOR 0</span>
                <span className="text-[var(--success)] font-bold">= 1</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--text)]">1 XOR 1</span>
                <span className="text-[var(--success)] font-bold">= 0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Session Data Table + Arrow + Stacked Calculation (7 cols on lg) */}
        <div className="lg:col-span-7 border border-[var(--panel-border)] bg-[var(--panel)]/60 p-4 sm:p-5 rounded-sm shadow-md flex flex-col sm:flex-row items-center justify-around gap-4">
          {/* Session Data Table Card */}
          <div className="w-full sm:w-[48%] border border-[var(--panel-border)]/70 bg-[var(--bg)]/80 p-3 sm:p-4 rounded-xs shadow-inner space-y-2.5">
            <div className="grid grid-cols-2 text-[var(--accent)] font-bold text-xs pb-1 border-b border-[var(--panel-border)]/40 px-2 tracking-wider">
              <span>Session</span>
              <span className="text-right">Data (4-bit)</span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="grid grid-cols-2 p-2 border border-[var(--panel-border)]/60 bg-[var(--panel)]/40 rounded-xs items-center px-3">
                <span className="font-bold text-[var(--text)]">A</span>
                <span className="text-right tracking-[0.2em] font-bold text-[var(--text)]">1010</span>
              </div>
              <div className="grid grid-cols-2 p-2 border border-[var(--panel-border)]/60 bg-[var(--panel)]/40 rounded-xs items-center px-3">
                <span className="font-bold text-[var(--text)]">C</span>
                <span className="text-right tracking-[0.2em] font-bold text-[var(--text)]">1100</span>
              </div>
              <div className="grid grid-cols-2 p-2 border border-[var(--panel-border)]/60 bg-[var(--panel)]/40 rounded-xs items-center px-3">
                <span className="font-bold text-[var(--text)]">F</span>
                <span className="text-right tracking-[0.2em] font-bold text-[var(--text)]">0011</span>
              </div>
            </div>
          </div>

          {/* Transfer Arrow */}
          <div className="text-[var(--accent)] text-2xl font-bold px-1 select-none">
            →
          </div>

          {/* Stacked XOR Calculation Card */}
          <div className="w-full sm:w-[45%] border border-[var(--accent)]/50 bg-[var(--bg)]/90 p-4 rounded-xs shadow-lg space-y-3">
            <div className="text-[var(--accent)] font-bold text-xs text-center border-b border-[var(--panel-border)]/60 pb-1.5 uppercase tracking-wider">
              XOR (bitwise)
            </div>

            <div className="font-mono text-sm tracking-[0.25em] text-right space-y-1.5 pr-2">
              <div className="text-[var(--text)] font-bold">1 0 1 0</div>
              <div className="text-[var(--text)] font-bold flex justify-between">
                <span className="text-[11px] text-[var(--accent)] tracking-normal">XOR</span>
                <span>1 1 0 0</span>
              </div>
              <div className="text-[var(--text)] font-bold flex justify-between">
                <span className="text-[11px] text-[var(--accent)] tracking-normal">XOR</span>
                <span>0 0 1 1</span>
              </div>
              <div className="border-t-2 border-[var(--accent)]/60 pt-2 text-center text-[var(--success)] font-extrabold text-base tracking-[0.3em] drop-shadow-[0_0_6px_rgba(74,222,128,0.5)]">
                ? ? ? ?
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bit Entry and Submission Bar matching Screenshot */}
      <div className="border border-[var(--panel-border)] bg-[var(--panel)]/60 p-4 sm:p-5 rounded-sm shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left Label and 4 Bit Inputs */}
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-[var(--text)] font-semibold whitespace-nowrap">
            Enter the resulting four-bit sequence:
          </span>

          <div className="flex items-center gap-2">
            {bits.map((bit, idx) => (
              <input
                key={`bit-${idx}`}
                ref={inputRefs[idx]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={bit}
                onChange={(e) => handleBitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={idx === 0 ? handlePaste : undefined}
                disabled={disabled || isSubmitting}
                className="w-9 h-9 sm:w-10 sm:h-10 text-center font-mono font-bold text-base sm:text-lg border border-[var(--accent)] bg-[var(--bg)] text-[var(--accent2)] rounded-xs focus-visible:outline-2 focus-visible:outline-[var(--accent)] shadow-xs transition-colors"
                autoComplete="off"
                spellCheck={false}
              />
            ))}
          </div>
        </form>

        {/* SUBMIT Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || isSubmitting}
          className="w-full sm:w-auto px-8 py-2.5 border border-[var(--accent)] bg-transparent hover:bg-[var(--accent)] text-[var(--accent)] hover:text-[var(--bg)] disabled:opacity-40 font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-[var(--accent)] active:scale-95"
        >
          {isSubmitting ? "TRANSMITTING..." : "SUBMIT"}
        </button>
      </div>

      {/* Feedback Message */}
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

      {/* Bottom Hint Banner matching Screenshot */}
      <div className="border border-[var(--panel-border)]/70 bg-[var(--bg)]/60 p-3 rounded-xs flex items-center gap-2 text-xs text-[var(--accent)] tracking-wider">
        <span className="text-sm">ⓘ</span>
        <span>HINT: Perform XOR on each bit position (left to right) using the three session data values.</span>
      </div>
    </div>
  );
}

export default DataReconstruction;

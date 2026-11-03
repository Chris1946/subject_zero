"use client";

import React, { useState } from "react";
import { ToolProps } from "@/rounds/types";

export interface VaultDialsProps extends ToolProps<unknown> {
  onAnswerSubmit?: (answer: string) => Promise<unknown> | void;
  standalone?: boolean;
}

const BIT_VALUES = [8, 4, 2, 1];

export function VaultDials({
  disabled = false,
  onAnswerSubmit,
}: VaultDialsProps) {
  // Dial A bits [8, 4, 2, 1]
  const [dialA, setDialA] = useState<number[]>([0, 0, 0, 0]);
  // Dial B bits [8, 4, 2, 1]
  const [dialB, setDialB] = useState<number[]>([0, 0, 0, 0]);

  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const toggleDialA = (index: number) => {
    if (disabled || isSubmitting) return;
    setDialA((prev) => {
      const next = [...prev];
      next[index] = next[index] === 1 ? 0 : 1;
      return next;
    });
    setFeedback(null);
  };

  const toggleDialB = (index: number) => {
    if (disabled || isSubmitting) return;
    setDialB((prev) => {
      const next = [...prev];
      next[index] = next[index] === 1 ? 0 : 1;
      return next;
    });
    setFeedback(null);
  };

  // Decimal calculations
  const decA = dialA.reduce((sum, bit, idx) => sum + bit * BIT_VALUES[idx], 0);
  const decB = dialB.reduce((sum, bit, idx) => sum + bit * BIT_VALUES[idx], 0);

  // Bitwise XOR per bit position
  const xorBits = dialA.map((bitA, idx) => bitA ^ dialB[idx]);
  const xorBinary = xorBits.join("");
  const xorDecimal = xorBits.reduce((sum, bit, idx) => sum + bit * BIT_VALUES[idx], 0);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (disabled || isSubmitting) return;

    setIsSubmitting(true);
    setFeedback(null);

    const answerStr = String(xorDecimal);

    try {
      if (onAnswerSubmit) {
        const res = await onAnswerSubmit(answerStr);
        const resObj = (res && typeof res === "object" ? res : {}) as { correct?: boolean; feedback?: string };
        if (resObj.correct === false) {
          setFeedback({
            type: "error",
            message: resObj.feedback || "KEY REJECTED. CHECK THE FOUR-BIT CONVERSION.",
          });
        } else {
          setFeedback({
            type: "success",
            message: "✓ ACCESS KEY VERIFIED: 8 ACCEPTED.",
          });
        }
      } else {
        // Standalone or demo validation
        if (answerStr === "8") {
          setFeedback({
            type: "success",
            message: "✓ ACCESS KEY VERIFIED: 8 ACCEPTED.",
          });
        } else {
          setFeedback({
            type: "error",
            message: "KEY REJECTED. CHECK THE FOUR-BIT CONVERSION.",
          });
        }
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
          VAULT KEY RECOVERY · Q2.3
        </h2>
        <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline uppercase">
          PROTOCOL: 4-BIT BINARY XOR
        </span>
      </div>

      {/* HOW TO PLAY THIS TERMINAL (Instructions Box matching screenshot) */}
      <div className="border border-[var(--panel-border)] bg-[var(--panel)]/80 p-4 sm:p-5 space-y-3 shadow-md">
        <div className="text-[var(--accent)] font-bold tracking-wider uppercase text-xs flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
          HOW TO PLAY THIS TERMINAL
        </div>
        <ol className="space-y-2 text-xs text-[var(--text)] leading-relaxed list-decimal list-inside pl-1">
          <li>
            Find the <strong className="text-[var(--accent)]">signature</strong> from Round 1 in your case file (Signature = 13).
          </li>
          <li>
            Set it on <strong>Dial A</strong> as four binary switches (place values 8, 4, 2, 1). Set your fragment from Terminal 02 on <strong>Dial B</strong>.
          </li>
          <li>
            The result lamps show the XOR. Read its decimal value and click <strong>Submit Access Key</strong> below (no typing required).
          </li>
        </ol>
      </div>

      {/* QUESTION BRIEFING CARD */}
      <div className="border border-[var(--panel-border)]/70 bg-[var(--bg)]/70 p-4 space-y-2 text-xs">
        <p className="text-[var(--text)] leading-relaxed">
          Convert the authentication signature from the Monitoring Station into four-bit binary, then XOR it with your recovered fragment. Convert the result into decimal.
        </p>
        <p className="text-[var(--text-muted)] text-[11px] font-semibold">
          Adjust the dials below to calculate the result automatically.
        </p>
      </div>

      {/* VAULT DIALS INTERACTIVE CARD */}
      <div className="border border-[var(--panel-border)] bg-[var(--panel)]/90 p-5 sm:p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--panel-border)]/60 pb-3">
          <div className="text-xs text-[var(--accent)] font-bold tracking-wider uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <span>VAULT DIALS · 4-BIT XOR LOGIC UNIT</span>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] uppercase">
            Click switches to toggle bits
          </span>
        </div>

        {/* Collapsible XOR Help Section */}
        <div className="border border-[var(--panel-border)]/60 bg-[var(--bg)]/50 rounded-xs overflow-hidden">
          <button
            type="button"
            onClick={() => setIsHelpOpen((prev) => !prev)}
            className="w-full px-3.5 py-2 flex items-center justify-between text-left text-xs text-[var(--accent)] hover:text-[var(--accent2)] font-semibold transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span>{isHelpOpen ? "▼" : "▶"}</span>
              <span>? What is XOR (help)</span>
            </span>
            <span className="text-[10px] text-[var(--text-muted)] uppercase">
              {isHelpOpen ? "HIDE REFERENCE" : "VIEW REFERENCE"}
            </span>
          </button>

          {isHelpOpen && (
            <div className="px-4 py-3 border-t border-[var(--panel-border)]/40 text-[11px] text-[var(--text-muted)] space-y-2 leading-relaxed bg-[var(--bg)]/80 animate-in fade-in duration-200">
              <p>
                <strong>XOR (Exclusive OR)</strong> produces <span className="text-[var(--accent)] font-bold">1</span> if the bits are different, and <span className="text-[var(--text-muted)] font-bold">0</span> if they are identical:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-center">
                <div className="p-1.5 border border-[var(--panel-border)] bg-[var(--panel)]/60">
                  0 ⊕ 0 = <strong className="text-[var(--text)]">0</strong>
                </div>
                <div className="p-1.5 border border-[var(--panel-border)] bg-[var(--panel)]/60">
                  0 ⊕ 1 = <strong className="text-[var(--accent)]">1</strong>
                </div>
                <div className="p-1.5 border border-[var(--panel-border)] bg-[var(--panel)]/60">
                  1 ⊕ 0 = <strong className="text-[var(--accent)]">1</strong>
                </div>
                <div className="p-1.5 border border-[var(--panel-border)] bg-[var(--panel)]/60">
                  1 ⊕ 1 = <strong className="text-[var(--text)]">0</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dials Container */}
        <div className="space-y-6 max-w-lg mx-auto py-2">
          {/* DIAL A */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs tracking-wider uppercase">
              <span className="font-bold text-[var(--accent)]">DIAL A (SIGNATURE)</span>
              <span className="text-[var(--text-muted)] font-mono text-[11px]">
                VALUE: <strong className="text-[var(--text)] text-sm">{decA}</strong>
              </span>
            </div>

            <div className="grid grid-cols-4 gap-3 text-center font-mono">
              {dialA.map((bit, idx) => (
                <div key={`dial-a-${idx}`} className="space-y-1.5">
                  <span className="text-[10px] text-[var(--text-muted)] font-bold block">
                    {BIT_VALUES[idx]}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleDialA(idx)}
                    disabled={disabled || isSubmitting}
                    className={`w-full py-4 sm:py-5 border text-base sm:text-lg font-bold transition-all cursor-pointer rounded-xs focus-visible:outline-2 focus-visible:outline-[var(--accent)] active:scale-95 ${
                      bit === 1
                        ? "border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--accent)] shadow-[0_0_12px_rgba(192,132,252,0.35)]"
                        : "border-[var(--panel-border)] bg-[var(--bg)]/90 text-[var(--text-muted)] hover:border-[var(--accent)]/50 hover:text-[var(--text)]"
                    }`}
                    title={`Dial A Bit ${BIT_VALUES[idx]}: Click to toggle`}
                  >
                    {bit}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* DIAL B */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs tracking-wider uppercase">
              <span className="font-bold text-[var(--accent)]">DIAL B (FRAGMENT)</span>
              <span className="text-[var(--text-muted)] font-mono text-[11px]">
                VALUE: <strong className="text-[var(--text)] text-sm">{decB}</strong>
              </span>
            </div>

            <div className="grid grid-cols-4 gap-3 text-center font-mono">
              {dialB.map((bit, idx) => (
                <div key={`dial-b-${idx}`} className="space-y-1.5">
                  <span className="text-[10px] text-[var(--text-muted)] font-bold block">
                    {BIT_VALUES[idx]}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleDialB(idx)}
                    disabled={disabled || isSubmitting}
                    className={`w-full py-4 sm:py-5 border text-base sm:text-lg font-bold transition-all cursor-pointer rounded-xs focus-visible:outline-2 focus-visible:outline-[var(--accent)] active:scale-95 ${
                      bit === 1
                        ? "border-[var(--accent)] bg-[var(--accent)]/20 text-[var(--accent)] shadow-[0_0_12px_rgba(192,132,252,0.35)]"
                        : "border-[var(--panel-border)] bg-[var(--bg)]/90 text-[var(--text-muted)] hover:border-[var(--accent)]/50 hover:text-[var(--text)]"
                    }`}
                    title={`Dial B Bit ${BIT_VALUES[idx]}: Click to toggle`}
                  >
                    {bit}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* XOR Result Lamps (Circular indicators matching screenshot) */}
          <div className="space-y-3 pt-3 border-t border-[var(--panel-border)]/60">
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider text-center font-semibold">
              XOR BITWISE LAMPS (DIAL A ⊕ DIAL B)
            </div>

            <div className="grid grid-cols-4 gap-3 text-center font-mono">
              {xorBits.map((bit, idx) => (
                <div key={`lamp-${idx}`} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center font-bold text-sm sm:text-base transition-all ${
                      bit === 1
                        ? "border-emerald-400 bg-emerald-950/80 text-emerald-300 shadow-[0_0_16px_rgba(52,211,153,0.6)] animate-pulse"
                        : "border-[var(--panel-border)]/80 bg-[var(--bg)]/90 text-[var(--text-muted)]/60"
                    }`}
                  >
                    {bit}
                  </div>
                  <span className="text-[9px] text-[var(--text-muted)]/70">
                    2^{3 - idx}
                  </span>
                </div>
              ))}
            </div>

            {/* Result Readout Banner matching screenshot */}
            <div className="py-3 px-4 border border-[var(--accent)]/40 bg-[var(--bg)]/90 text-center font-mono text-sm tracking-wider">
              <span className="text-[var(--text-muted)]">Result: </span>
              <span className="text-emerald-400 font-bold">{xorBinary}</span>
              <span className="text-[var(--text-muted)]"> = decimal </span>
              <strong className="text-[#facc15] font-bold text-base">{xorDecimal}</strong>
            </div>
          </div>
        </div>

        {/* Action Panel: One-Click Direct Submission (No Text Area Required!) */}
        <div className="pt-2 border-t border-[var(--panel-border)]/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[var(--text-muted)] text-center sm:text-left">
            Configured Output: <strong className="text-[var(--accent)] font-mono">{xorBinary}</strong> (Decimal: <strong className="text-[#facc15] font-mono">{xorDecimal}</strong>)
          </div>

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={disabled || isSubmitting}
            className="w-full sm:w-auto px-8 py-3 bg-[var(--accent)] hover:bg-[var(--accent2)] disabled:opacity-40 text-[var(--bg)] font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg focus-visible:outline-2 focus-visible:outline-[var(--accent)] active:scale-95 shrink-0 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>TRANSMITTING...</span>
            ) : (
              <span>SUBMIT ACCESS KEY ({xorDecimal})</span>
            )}
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

export default VaultDials;

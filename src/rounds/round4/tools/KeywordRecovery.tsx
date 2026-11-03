"use client";

import React, { useState } from "react";
import { ToolProps } from "@/rounds/types";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const STEP_DEG = 360 / 26; // ~13.846 deg

export interface KeywordRecoveryProps extends ToolProps<unknown> {
  onAnswerSubmit?: (answer: string) => Promise<unknown> | void;
  standalone?: boolean;
}

export function KeywordRecovery({
  disabled = false,
  onAnswerSubmit,
}: KeywordRecoveryProps) {
  // Current shift value. Default is 0 so player manually works out the shift
  const [shift, setShift] = useState<number>(0);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // Player answer state
  const [answerInput, setAnswerInput] = useState<string>("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Decrement shift (BACK)
  const handleBack = () => {
    setShift((prev) => (prev <= 0 ? 25 : prev - 1));
    setFeedback(null);
  };

  // Increment shift (FORWARD)
  const handleForward = () => {
    setShift((prev) => (prev >= 25 ? 0 : prev + 1));
    setFeedback(null);
  };

  // Rotation angle for inner ring:
  // Rotating clockwise by `shift * STEP_DEG` aligns outer ciphertext letter with inner letter shifted backwards by `shift`
  const innerRotationDeg = (shift % 26) * STEP_DEG;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || isSubmitting) return;

    const cleanAnswer = answerInput.trim().toUpperCase();
    if (!cleanAnswer) {
      setFeedback({
        type: "error",
        message: "PLEASE ENTER THE RECOVERED WORD.",
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (onAnswerSubmit) {
        const res = await onAnswerSubmit(cleanAnswer);
        const resObj = (res && typeof res === "object" ? res : {}) as { correct?: boolean; feedback?: string };
        if (resObj.correct === false) {
          setFeedback({
            type: "error",
            message: resObj.feedback || "KEYWORD NOT RECOGNISED. USE THE PREVIOUSLY RECOVERED WORD.",
          });
        } else {
          setFeedback({
            type: "success",
            message: "✓ KEYWORD RECOVERED: TRANSMISSION ACCEPTED.",
          });
        }
      } else {
        setFeedback({
          type: "success",
          message: "✓ KEYWORD RECOVERED: TRANSMISSION ACCEPTED.",
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
          ARCHIVE TERMINAL 03: FINAL KEYWORD · Q4.3
        </h2>
        <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline uppercase">
          SEC-04 // CIPHER: CAESAR
        </span>
      </div>

      {/* Top Question Panel */}
      <div className="border border-[var(--panel-border)] bg-[var(--panel)]/70 p-5 sm:p-6 space-y-4 text-xs sm:text-sm text-[var(--text)] leading-relaxed shadow-lg">
        <p>
          Use the number of letters in the word from Terminal 01 as your Caesar shift.
          Shift each letter <strong className="text-[var(--accent)]">BACKWARDS</strong>.
        </p>

        <div className="flex items-center gap-3 pt-1">
          <span className="text-xs text-[var(--text)] font-semibold">Decode:</span>
          <span className="px-3 py-1 bg-[var(--bg)]/90 border border-[var(--accent)] text-[var(--accent2)] font-bold text-sm tracking-[0.25em] shadow-inner">
            FQNAJ
          </span>
        </div>

        <p className="text-[var(--text-muted)]">Enter the recovered word.</p>
      </div>

      {/* Cipher Wheel Section */}
      <div className="border border-[var(--panel-border)] bg-[var(--panel)]/50 p-4 sm:p-6 shadow-md space-y-4">
        {/* Subtitle */}
        <div className="text-xs text-[var(--text-muted)] tracking-wider">
          <span className="font-bold text-[var(--accent)]">CIPHER WHEEL</span> · turn the inner ring. It only shows the text for your chosen shift.
        </div>

        {/* Collapsible Help Section */}
        <div className="border border-[var(--panel-border)] bg-[var(--bg)]/40 p-3 text-xs">
          <button
            type="button"
            onClick={() => setIsHelpOpen(!isHelpOpen)}
            className="flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent2)] font-bold tracking-wider uppercase transition-colors focus-visible:outline-none"
          >
            <span>{isHelpOpen ? "▼" : "▶"}</span>
            <span>? Shifting backwards (help)</span>
          </button>

          {isHelpOpen && (
            <div className="mt-3 pt-3 border-t border-[var(--panel-border)]/60 text-xs text-[var(--text-muted)] space-y-2 leading-relaxed animate-in fade-in duration-200">
              <p>
                In a backward Caesar shift, each letter is displaced earlier in the alphabet by the key amount.
              </p>
              <p className="text-[11px] text-[var(--text)]/80">
                Determine the length of the word recovered in Terminal 01, rotate the inner wheel by that shift, and read off the corresponding inner letters for each character in FQNAJ.
              </p>
            </div>
          )}
        </div>

        {/* Circular Caesar Cipher Wheel */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="relative w-[300px] h-[300px] sm:w-[360px] sm:h-[360px]">
            <svg
              viewBox="0 0 400 400"
              className="w-full h-full drop-shadow-[0_0_15px_rgba(255,176,32,0.15)]"
              aria-label={`Caesar Cipher Wheel at Shift ${shift}`}
            >
              {/* Outer Ring Background */}
              <circle
                cx="200"
                cy="200"
                r="190"
                fill="rgba(16, 9, 3, 0.85)"
                stroke="var(--panel-border)"
                strokeWidth="2"
              />

              {/* Inner Ring Background Track */}
              <circle
                cx="200"
                cy="200"
                r="140"
                fill="rgba(24, 14, 5, 0.95)"
                stroke="var(--panel-border)"
                strokeWidth="1.5"
              />

              {/* Decorative Concentric Rings */}
              <circle
                cx="200"
                cy="200"
                r="185"
                fill="none"
                stroke="rgba(255, 176, 32, 0.25)"
                strokeWidth="1"
                strokeDasharray="2 4"
              />
              <circle
                cx="200"
                cy="200"
                r="135"
                fill="none"
                stroke="rgba(255, 176, 32, 0.25)"
                strokeWidth="1"
                strokeDasharray="2 4"
              />

              {/* Top Indicator Triangle (Yellow Marker at 12 o'clock) */}
              <polygon
                points="193,8 207,8 200,22"
                fill="#ffb020"
                stroke="rgba(0,0,0,0.7)"
                strokeWidth="1"
              />

              {/* Fixed Outer Alphabet Ring (A at 12 o'clock, B clockwise) */}
              <g id="keyword-outer-ring">
                {ALPHABET.map((letter, idx) => {
                  const angle = idx * STEP_DEG;
                  return (
                    <text
                      key={`outer-${letter}`}
                      transform={`rotate(${angle}, 200, 200) translate(200, 42)`}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-[var(--text)] font-mono text-sm font-bold"
                      style={{ fontSize: "14px" }}
                    >
                      {letter}
                    </text>
                  );
                })}
              </g>

              {/* Rotatable Inner Alphabet Ring */}
              <g
                id="keyword-inner-ring"
                style={{
                  transformOrigin: "200px 200px",
                  transform: `rotate(${innerRotationDeg}deg)`,
                  transition: "transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
                }}
              >
                {ALPHABET.map((letter, idx) => {
                  const angle = idx * STEP_DEG;
                  return (
                    <text
                      key={`inner-${letter}`}
                      transform={`rotate(${angle}, 200, 200) translate(200, 92)`}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-[#b57cff] font-mono text-sm font-bold"
                      style={{ fontSize: "13px" }}
                    >
                      {letter}
                    </text>
                  );
                })}
              </g>

              {/* Center Shift Indicator Disc */}
              <circle
                cx="200"
                cy="200"
                r="60"
                fill="#120803"
                stroke="var(--panel-border)"
                strokeWidth="2"
              />
              <circle
                cx="200"
                cy="200"
                r="54"
                fill="none"
                stroke="rgba(255, 176, 32, 0.4)"
                strokeWidth="1"
                strokeDasharray="2 3"
              />

              <text
                x="200"
                y="190"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-[var(--text-muted)] font-mono text-[10px] font-bold tracking-[0.2em] uppercase"
              >
                SHIFT
              </text>

              <text
                x="200"
                y="214"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-[var(--accent)] font-mono text-xl font-bold tracking-wider"
                style={{ fontSize: "22px" }}
              >
                {shift}
              </text>
            </svg>
          </div>

          {/* BACK and FORWARD Controls */}
          <div className="flex items-center gap-4 mt-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={disabled}
              className="w-12 h-10 flex items-center justify-center border border-[var(--panel-border)] bg-[var(--bg)]/80 hover:bg-[var(--panel)] text-[var(--accent)] hover:text-[var(--accent2)] text-base font-bold transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] cursor-pointer shadow-xs active:scale-95"
              title="Rotate Back (-1 Shift)"
              aria-label="Rotate Back"
            >
              ◀
            </button>
            <button
              type="button"
              onClick={handleForward}
              disabled={disabled}
              className="w-12 h-10 flex items-center justify-center border border-[var(--panel-border)] bg-[var(--bg)]/80 hover:bg-[var(--panel)] text-[var(--accent)] hover:text-[var(--accent2)] text-base font-bold transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] cursor-pointer shadow-xs active:scale-95"
              title="Rotate Forward (+1 Shift)"
              aria-label="Rotate Forward"
            >
              ▶
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: ANSWER Panel */}
      <div className="border border-[var(--panel-border)] bg-[var(--panel)]/60 p-4 sm:p-5 shadow-lg space-y-3">
        <div className="text-[var(--accent)] font-bold uppercase text-xs tracking-wider">
          ANSWER
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={answerInput}
            onChange={(e) => {
              setAnswerInput(e.target.value);
              setFeedback(null);
            }}
            placeholder="Enter the recovered word"
            disabled={disabled || isSubmitting}
            className="flex-1 bg-[var(--bg)] border border-[var(--accent)]/50 px-4 py-2.5 text-xs sm:text-sm text-[var(--text)] font-mono tracking-widest placeholder:text-[var(--text-muted)]/50 focus-visible:outline-2 focus-visible:outline-[var(--accent)] uppercase"
            autoComplete="off"
            spellCheck={false}
          />

          <button
            type="submit"
            disabled={disabled || isSubmitting}
            className="px-8 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent2)] disabled:opacity-40 text-[var(--bg)] font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-[var(--accent)] active:scale-95"
          >
            {isSubmitting ? "TRANSMITTING..." : "SUBMIT"}
          </button>
        </form>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-2.5 text-xs border font-mono animate-in fade-in duration-150 ${
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

export default KeywordRecovery;

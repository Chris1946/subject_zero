"use client";

import React, { useState } from "react";
import { ToolProps } from "@/rounds/types";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const STEP_DEG = 360 / 26; // ~13.846 deg
const CIPHERTEXT = "YLZAVYL";

export interface CommandRecoveryProps extends ToolProps<unknown> {
  onAnswerSubmit?: (answer: string) => Promise<unknown> | void;
  standalone?: boolean;
}

export function CommandRecovery({
  disabled = false,
  onAnswerSubmit,
}: CommandRecoveryProps) {
  // Shift state: 0 to 25 (matches CaesarWheel in Q3.1)
  const [shift, setShift] = useState<number>(0);
  const [answerInput, setAnswerInput] = useState<string>("");

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Handle Forward (increment shift, rotates clockwise)
  const handleForward = () => {
    setShift((prev) => (prev + 1) % 26);
    setFeedback(null);
  };

  // Handle Back (decrement shift, rotates counter-clockwise)
  const handleBack = () => {
    setShift((prev) => (prev - 1 + 26) % 26);
    setFeedback(null);
  };

  const handleReset = () => {
    setShift(0);
    setFeedback(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (disabled || isSubmitting) return;
    if (e.deltaY > 0) {
      handleBack();
    } else if (e.deltaY < 0) {
      handleForward();
    }
  };

  // Rotation angle for inner ring: identical to CaesarWheel in Q3.1
  const innerRotationDeg = shift * STEP_DEG;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (disabled || isSubmitting) return;

    const clean = answerInput.trim().toUpperCase();
    if (!clean) {
      setFeedback({
        type: "error",
        message: "ENTER THE RECOVERED COMMAND BEFORE TRANSMITTING.",
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (onAnswerSubmit) {
        const res = await onAnswerSubmit(clean);
        const resObj = (res && typeof res === "object" ? res : {}) as { correct?: boolean; feedback?: string };
        if (resObj.correct === false) {
          setFeedback({
            type: "error",
            message: resObj.feedback || "COMMAND NOT RECOGNISED. CHECK THE SHIFT VALUE.",
          });
        } else {
          setFeedback({
            type: "success",
            message: "✓ COMMAND VERIFIED: TRANSMISSION ACCEPTED.",
          });
        }
      } else {
        setFeedback({
          type: "success",
          message: "✓ COMMAND VERIFIED: TRANSMISSION ACCEPTED.",
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
      {/* Terminal Heading */}
      <div className="flex items-center justify-between border-b border-[var(--panel-border)]/70 pb-2">
        <h2 className="text-sm sm:text-base font-bold text-[var(--accent)] tracking-widest uppercase flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-[var(--accent)] animate-pulse" />
          COMMAND RECOVERY TERMINAL · Q3.3
        </h2>
        <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline uppercase">
          FRAGMENT: 2 OF 2 // SECTOR KEY: 7
        </span>
      </div>

      {/* Main Container: 3 Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Left Column: QUESTION and HELP Cards (4 cols on lg) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* QUESTION Card */}
          <div className="border border-[var(--panel-border)] bg-[var(--panel)]/70 p-4 sm:p-5 space-y-3 shadow-md">
            <div className="text-[var(--accent)] font-bold tracking-wider uppercase text-xs">
              QUESTION
            </div>
            <p className="text-xs text-[var(--text)] leading-relaxed">
              The corrupted sector label contained 7 letters.
              <br />
              Shift each letter <strong className="text-[var(--accent2)]">BACKWARDS</strong> by 7 positions.
            </p>
            <div className="pt-1 flex items-center gap-2">
              <span className="text-xs text-[var(--text)] font-semibold">Decode:</span>
              <span className="px-3 py-1 bg-[var(--bg)]/90 border border-[var(--accent)] text-[var(--accent2)] font-bold text-sm tracking-[0.25em] shadow-inner">
                {CIPHERTEXT}
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] pt-1">
              Rotate the wheel to align, manually decode each letter, and submit the recovered command in the text area below.
            </p>
          </div>

          {/* HELP Card */}
          <div className="border border-[var(--panel-border)] bg-[var(--panel)]/60 p-4 space-y-2 text-xs shadow-md">
            <div className="text-[var(--accent)] font-bold tracking-wider uppercase flex items-center gap-1.5 text-xs">
              <span>ⓘ</span>
              <span>HELP: CAESAR CIPHER (BACKWARD SHIFT)</span>
            </div>
            <ul className="space-y-1.5 text-[var(--text-muted)] text-[11px] leading-relaxed pt-1">
              <li className="flex items-start gap-1.5">
                <span className="text-[var(--accent)]">•</span>
                <span>Each letter is moved N positions back in the alphabet.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[var(--accent)]">•</span>
                <span>
                  Example (shift 7): <strong className="text-[var(--text)]">H → A</strong>,{" "}
                  <strong className="text-[var(--text)]">O → H</strong>
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[var(--accent)]">•</span>
                <span>Rotate the wheel using the controls or your mouse wheel.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Center Column: Caesar Cipher Wheel (5 cols on lg) */}
        <div
          className="lg:col-span-5 flex flex-col items-center justify-center py-2"
          onWheel={handleWheel}
        >
          <div className="relative w-[300px] h-[300px] sm:w-[340px] sm:h-[340px] cursor-grab active:cursor-grabbing">
            <svg
              viewBox="0 0 400 400"
              className="w-full h-full drop-shadow-[0_0_15px_rgba(56,189,248,0.15)]"
              aria-label={`Manual Caesar Cipher Wheel with shift ${shift}`}
            >
              {/* Outer Ring Background */}
              <circle
                cx="200"
                cy="200"
                r="192"
                fill="#070d14"
                stroke="var(--panel-border)"
                strokeWidth="2"
              />

              {/* Decorative Concentric Rings */}
              <circle
                cx="200"
                cy="200"
                r="185"
                fill="none"
                stroke="rgba(56, 189, 248, 0.25)"
                strokeWidth="1"
              />
              <circle
                cx="200"
                cy="200"
                r="140"
                fill="#0a1520"
                stroke="rgba(56, 189, 248, 0.4)"
                strokeWidth="1.5"
              />

              {/* Top Pointer Triangle (Yellow marker at 12 o'clock matching screenshot) */}
              <polygon
                points="193,6 207,6 200,20"
                fill="#facc15"
                stroke="#000000"
                strokeWidth="1"
              />

              {/* Fixed Outer Alphabet Ring (A at 12 o'clock, B clockwise) */}
              <g id="manual-outer-ring">
                {ALPHABET.map((letter, idx) => {
                  const angle = idx * STEP_DEG;
                  return (
                    <text
                      key={`outer-letter-${letter}`}
                      transform={`rotate(${angle}, 200, 200) translate(200, 42)`}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-[var(--text)] font-mono text-sm font-bold tracking-tight"
                      style={{ fontSize: "14px" }}
                    >
                      {letter}
                    </text>
                  );
                })}
              </g>

              {/* Inner Rotatable Alphabet Ring */}
              <g
                id="manual-inner-ring"
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
                      key={`inner-letter-${letter}`}
                      transform={`rotate(${angle}, 200, 200) translate(200, 92)`}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-[var(--accent)] font-mono text-sm font-bold"
                      style={{ fontSize: "13px" }}
                    >
                      {letter}
                    </text>
                  );
                })}
              </g>

              {/* Center Shift Display Disc */}
              <circle
                cx="200"
                cy="200"
                r="60"
                fill="#050a10"
                stroke="rgba(56, 189, 248, 0.6)"
                strokeWidth="2"
              />
              <circle
                cx="200"
                cy="200"
                r="54"
                fill="none"
                stroke="rgba(56, 189, 248, 0.3)"
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
                className="fill-[#facc15] font-mono text-xl font-bold tracking-wider"
                style={{ fontSize: "22px" }}
              >
                {shift}
              </text>
            </svg>
          </div>
        </div>

        {/* Right Column: SHIFT CONTROL Card (3 cols on lg) */}
        <div className="lg:col-span-3 border border-[var(--panel-border)] bg-[var(--panel)]/70 p-4 space-y-4 shadow-md text-center">
          <div className="text-[var(--accent)] font-bold tracking-wider uppercase text-xs text-left">
            SHIFT CONTROL
          </div>

          {/* BACK and FORWARD Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleBack}
              disabled={disabled}
              className="py-2.5 px-2 border border-[var(--panel-border)] bg-[var(--bg)]/90 hover:bg-[var(--panel)] text-[var(--accent)] hover:text-[var(--accent2)] text-xs font-bold uppercase transition-all cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-[var(--accent)] flex flex-col items-center justify-center gap-1"
              title="Rotate Back (-1)"
            >
              <span className="text-base leading-none">←</span>
              <span className="text-[10px] tracking-wider">BACK (-1)</span>
            </button>

            <button
              type="button"
              onClick={handleForward}
              disabled={disabled}
              className="py-2.5 px-2 border border-[var(--panel-border)] bg-[var(--bg)]/90 hover:bg-[var(--panel)] text-[var(--accent)] hover:text-[var(--accent2)] text-xs font-bold uppercase transition-all cursor-pointer active:scale-95 focus-visible:outline-2 focus-visible:outline-[var(--accent)] flex flex-col items-center justify-center gap-1"
              title="Rotate Forward (+1)"
            >
              <span className="text-base leading-none">→</span>
              <span className="text-[10px] tracking-wider">FORWARD (+1)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            disabled={disabled || shift === 0}
            className="w-full py-1.5 border border-[var(--panel-border)]/60 bg-[var(--bg)]/50 hover:bg-[var(--panel)] text-[var(--text-muted)] hover:text-[var(--text)] text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40"
          >
            RESET TO 0
          </button>

          {/* CURRENT SHIFT Display Box */}
          <div className="space-y-1.5 pt-2 border-t border-[var(--panel-border)]/50">
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
              CURRENT SHIFT
            </div>
            <div className="py-2 px-4 border border-[var(--accent)]/50 bg-[var(--bg)] text-[#facc15] font-bold text-lg tracking-widest">
              {shift}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: SUBMISSION PANEL (Manual Wheel Reference + Text Area Submission) */}
      <form
        onSubmit={handleSubmit}
        className="border border-[var(--panel-border)] bg-[var(--panel)]/70 p-4 sm:p-5 shadow-lg space-y-3"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[var(--accent)] font-bold uppercase text-xs tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
              <span>COMMAND SUBMISSION TERMINAL</span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Rotate the wheel to backward shift 7 to manually decode each letter of <strong>{CIPHERTEXT}</strong>, then enter the recovered word below.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <div className="flex-1">
            <textarea
              value={answerInput}
              onChange={(e) => {
                setAnswerInput(e.target.value.toUpperCase());
                setFeedback(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSubmit();
                }
              }}
              disabled={disabled || isSubmitting}
              placeholder="ENTER DECODED COMMAND..."
              rows={2}
              aria-label="Recovered Command Input Area"
              className="w-full px-4 py-2.5 bg-[var(--bg)] border border-[var(--panel-border)] focus:border-[var(--accent)] text-[var(--text)] font-mono text-sm tracking-widest uppercase placeholder:text-[var(--text-muted)]/50 focus-visible:outline-2 focus-visible:outline-[var(--accent)] transition-all resize-none shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={disabled || isSubmitting || !answerInput.trim()}
            className="w-full sm:w-auto px-8 py-3 bg-[var(--accent)] hover:bg-[var(--accent2)] disabled:opacity-40 text-[var(--bg)] font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-md focus-visible:outline-2 focus-visible:outline-[var(--accent)] active:scale-95 shrink-0 flex items-center justify-center gap-2 self-stretch sm:self-auto"
          >
            {isSubmitting ? "TRANSMITTING..." : "SUBMIT COMMAND"}
          </button>
        </div>

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
      </form>
    </div>
  );
}

export default CommandRecovery;

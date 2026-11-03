"use client";

import React, { useState } from "react";
import { ToolProps } from "@/rounds/types";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const STEP_DEG = 360 / 26;

export interface CipherToolData {
  ciphertext?: string;
  defaultShift?: number;
  [key: string]: unknown;
}

export interface CaesarWheelProps extends ToolProps<unknown> {
  onAnswerSubmit?: (answer: string) => Promise<unknown> | void;
  disabled?: boolean;
  standalone?: boolean;
}

export function CaesarWheel({
  data,
  disabled = false,
  onAnswerSubmit,
}: CaesarWheelProps) {
  const toolData = (data && typeof data === "object" ? data : {}) as CipherToolData;
  const ciphertext = (toolData.ciphertext || "KWZZCXB").toUpperCase();

  // Shift state: 0 to 25
  const [shift, setShift] = useState<number>(toolData.defaultShift ?? 0);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Single answer submission state
  const [answerInput, setAnswerInput] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle Forward (increment shift)
  const handleForward = () => {
    setShift((prev) => (prev + 1) % 26);
    setFeedback(null);
  };

  // Handle Back (decrement shift)
  const handleBack = () => {
    setShift((prev) => (prev - 1 + 26) % 26);
    setFeedback(null);
  };

  // Rotation angle for inner ring
  const innerRotationDeg = shift * STEP_DEG;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || isSubmitting) return;

    const clean = answerInput.trim().toUpperCase();
    if (!clean) {
      setFeedback({
        type: "error",
        message: "ENTER THE RECOVERED WORD BEFORE SUBMITTING.",
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (onAnswerSubmit) {
        const res = await onAnswerSubmit(clean);
        const resObj = (res && typeof res === "object" ? res : {}) as {
          correct?: boolean;
          feedback?: string;
        };

        if (resObj.correct === false) {
          setFeedback({
            type: "error",
            message: resObj.feedback || "SECTOR LABEL NOT RECOGNISED. CHECK THE SHIFT VALUE.",
          });
        } else {
          setFeedback({
            type: "success",
            message: "✓ SECTOR RECOVERED: TRANSMISSION ACCEPTED.",
          });
        }
      } else {
        setFeedback({
          type: "success",
          message: "✓ SECTOR RECOVERED: TRANSMISSION ACCEPTED.",
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
    <div className="w-full my-4 font-mono select-none space-y-5">
      {/* Question Panel */}
      <div className="border border-[var(--panel-border)] bg-[var(--bg)]/50 p-4 sm:p-5 space-y-3 text-xs leading-relaxed">
        <p className="text-[var(--text)]">
          The previous room provided the recovery key. Use a Caesar cipher and shift each letter{" "}
          <strong className="text-[var(--accent)] font-bold">BACKWARDS</strong> by that many positions.
        </p>
        <div className="space-y-1 font-mono pt-1">
          <div className="text-xs text-[var(--text)]">
            Decode:{" "}
            <span className="font-bold tracking-widest text-[var(--accent)] bg-[var(--panel)] px-2 py-1 border border-[var(--panel-border)]">
              {ciphertext}
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)] pt-1">
            Enter the recovered word.
          </div>
        </div>
      </div>

      {/* Header text */}
      <div className="text-xs text-[var(--text-muted)] tracking-wider">
        <span className="font-bold text-[var(--accent)]">CIPHER WHEEL</span> · Turn the inner ring to manually look up letters.
      </div>

      {/* Collapsible Help Section */}
      <div className="border border-[var(--panel-border)] bg-[var(--bg)]/40 p-3 text-xs">
        <button
          type="button"
          onClick={() => setIsHelpOpen(!isHelpOpen)}
          className="flex items-center gap-2 text-[var(--accent)] hover:text-[var(--accent2)] font-bold tracking-wider uppercase transition-colors focus-visible:outline-hidden cursor-pointer"
        >
          <span>{isHelpOpen ? "▼" : "▶"}</span>
          <span>? Shifting backwards (help)</span>
        </button>

        {isHelpOpen && (
          <div className="mt-3 pt-3 border-t border-[var(--panel-border)]/60 text-xs text-[var(--text-muted)] space-y-2 leading-relaxed animate-in fade-in duration-200">
            <p>
              In a Caesar cipher, shifting <strong className="text-[var(--text)]">BACKWARDS</strong> moves each letter in the ciphertext earlier in the alphabet by the recovery key number.
            </p>
            <p className="text-[11px] text-[var(--text)]/80">
              For example, shifting backwards by 8: K (-8) becomes C, W (-8) becomes O, and Z (-8) becomes R.
              Turn the wheel until the shift indicator reaches your key, and look up each letter on the wheel.
            </p>
          </div>
        )}
      </div>

      {/* The Caesar Cipher Wheel Canvas (Manual Reference Only) */}
      <div className="flex flex-col items-center justify-center py-4 bg-[var(--panel)]/30 border border-[var(--panel-border)]/50 rounded-xs">
        <div className="relative w-[320px] h-[320px] sm:w-[380px] sm:h-[380px]">
          <svg
            viewBox="0 0 400 400"
            className="w-full h-full"
            aria-label={`Caesar Cipher Wheel at Shift ${shift}`}
          >
            {/* Outer Ring Background Disk */}
            <circle
              cx="200"
              cy="200"
              r="190"
              fill="rgba(0, 0, 0, 0.5)"
              stroke="var(--panel-border)"
              strokeWidth="2"
            />

            {/* Inner Ring Background Track */}
            <circle
              cx="200"
              cy="200"
              r="140"
              fill="rgba(0, 0, 0, 0.6)"
              stroke="var(--panel-border)"
              strokeWidth="1.5"
            />

            {/* Concentric Decorative Rings */}
            <circle
              cx="200"
              cy="200"
              r="185"
              fill="none"
              stroke="var(--panel-border)"
              strokeWidth="1"
              strokeDasharray="2 4"
              opacity="0.6"
            />
            <circle
              cx="200"
              cy="200"
              r="135"
              fill="none"
              stroke="var(--panel-border)"
              strokeWidth="1"
              strokeDasharray="2 4"
              opacity="0.6"
            />

            {/* Top Indicator Triangle (Red Marker at 12 o'clock) */}
            <polygon
              points="193,8 207,8 200,22"
              fill="var(--warn, #ff7a1a)"
              stroke="rgba(0,0,0,0.5)"
              strokeWidth="1"
            />

            {/* Outer Alphabet Ring (Fixed A-Z, A at 12 o'clock) */}
            <g id="outer-ring">
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

            {/* Inner Alphabet Ring (Rotatable group) */}
            <g
              id="inner-ring"
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
                    className="fill-[var(--accent)] font-mono text-sm font-bold"
                    style={{ fontSize: "13px" }}
                  >
                    {letter}
                  </text>
                );
              })}
            </g>

            {/* Center Disk (Displays SHIFT X) */}
            <circle
              cx="200"
              cy="200"
              r="60"
              fill="#06090e"
              stroke="var(--panel-border)"
              strokeWidth="2"
            />
            <circle
              cx="200"
              cy="200"
              r="54"
              fill="none"
              stroke="var(--panel-border)"
              strokeWidth="1"
              strokeDasharray="2 3"
              opacity="0.5"
            />
            <text
              x="200"
              y="204"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-[var(--text)] font-mono text-xs font-bold tracking-widest"
              style={{ fontSize: "12px", letterSpacing: "0.15em" }}
            >
              SHIFT {shift}
            </text>
          </svg>
        </div>

        {/* Back and Forward Controls */}
        <div className="flex items-center gap-4 mt-4">
          <button
            type="button"
            onClick={handleBack}
            className="w-14 h-11 flex items-center justify-center border border-[var(--panel-border)] bg-[var(--bg)] hover:bg-[var(--panel)] text-[var(--accent)] hover:text-[var(--accent2)] text-base font-bold transition-all focus-visible:outline-2 focus-visible:outline-[var(--accent)] cursor-pointer shadow-xs active:scale-95 rounded-xs"
            title="Rotate Back (-1 Shift)"
            aria-label="Rotate Back"
          >
            ◀ BACK
          </button>
          <button
            type="button"
            onClick={handleForward}
            className="w-14 h-11 flex items-center justify-center border border-[var(--panel-border)] bg-[var(--bg)] hover:bg-[var(--panel)] text-[var(--accent)] hover:text-[var(--accent2)] text-base font-bold transition-all focus-visible:outline-2 focus-visible:outline-[var(--accent)] cursor-pointer shadow-xs active:scale-95 rounded-xs"
            title="Rotate Forward (+1 Shift)"
            aria-label="Rotate Forward"
          >
            FORWARD ▶
          </button>
        </div>
      </div>

      {/* Single Answer Submission Area */}
      <form onSubmit={handleSubmit} className="border border-[var(--panel-border)] bg-[var(--panel)]/70 p-4 sm:p-5 space-y-3 rounded-xs">
        <div className="text-[11px] text-[var(--accent)] uppercase tracking-wider font-bold">
          ANSWER:
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={answerInput}
            onChange={(e) => {
              setAnswerInput(e.target.value.toUpperCase());
              setFeedback(null);
            }}
            placeholder="Enter the recovered word"
            disabled={disabled || isSubmitting}
            className="flex-1 bg-[var(--bg)] border border-[var(--panel-border)] px-4 py-2.5 text-xs text-[var(--text)] font-mono tracking-widest placeholder:text-[var(--text-muted)]/40 focus-visible:outline-2 focus-visible:outline-[var(--accent)] uppercase rounded-xs"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={disabled || isSubmitting || !answerInput.trim()}
            className="px-8 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-[var(--bg)] font-bold text-xs uppercase tracking-widest transition-colors shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed rounded-xs"
          >
            {isSubmitting ? "TRANSMITTING..." : "SUBMIT"}
          </button>
        </div>

        {feedback && (
          <div
            role="alert"
            className={`p-2.5 text-xs font-mono tracking-wider uppercase border rounded-xs ${
              feedback.type === "success"
                ? "border-[var(--success)] bg-[var(--success)]/10 text-[var(--success)]"
                : "border-[var(--danger)] bg-[var(--danger)]/10 text-[var(--danger)]"
            }`}
          >
            {feedback.message}
          </div>
        )}
      </form>
    </div>
  );
}

export default CaesarWheel;

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ToolProps } from "@/rounds/types";

export interface SignalToolData {
  bits?: string; // e.g. "01010011 01011010"
}

export interface SignalLampProps extends ToolProps<unknown> {
  onAnswerSubmit?: (answer: string) => Promise<unknown> | void;
  standalone?: boolean;
}

export function SignalLamp({
  data,
  disabled = false,
  onAnswerSubmit,
}: SignalLampProps) {
  const signalData = (data && typeof data === "object" ? data : {}) as SignalToolData;
  const bitsString = signalData?.bits || "";
  // Clean bits into two 8-character arrays
  const cleanBits = bitsString.replace(/\s+/g, "");
  const byte1Str = cleanBits.slice(0, 8);
  const byte2Str = cleanBits.slice(8, 16);

  // Flash player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [lampOn, setLampOn] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number | null>(null);

  // Fallback text state
  const [showTextFallback, setShowTextFallback] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
    return false;
  });

  // Check prefers-reduced-motion
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      const listener = (e: MediaQueryListEvent) => {
        if (e.matches) setShowTextFallback(true);
      };
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, []);

  // Transcription switches: two rows of 8 bits
  const [byte1Switches, setByte1Switches] = useState<boolean[]>(Array(8).fill(false));
  const [byte2Switches, setByte2Switches] = useState<boolean[]>(Array(8).fill(false));

  // Submission & feedback state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Compute decimal and ASCII character for transcription switches
  const computeByteValue = (switches: boolean[]): { decimal: number; char: string; isValidChar: boolean } => {
    const val = switches.reduce((acc, bit, idx) => acc + (bit ? Math.pow(2, 7 - idx) : 0), 0);
    // Standard printable ASCII range (32 to 126)
    const isPrintable = val >= 32 && val <= 126;
    const char = isPrintable ? String.fromCharCode(val) : "·";
    return { decimal: val, char, isValidChar: isPrintable };
  };

  const byte1Result = computeByteValue(byte1Switches);
  const byte2Result = computeByteValue(byte2Switches);

  // Flash timing specification:
  // - Bit 1: LONG flash = 700 ms
  // - Bit 0: SHORT flash = 250 ms
  // - 480 ms gap between flashes
  // - 1300 ms gap between the two bytes
  const stopPlayback = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsPlaying(false);
    setLampOn(false);
    setCurrentStepIndex(null);
  }, []);

  const playSequence = useCallback(() => {
    stopPlayback();
    setIsPlaying(true);

    const sequence: { isFlash: boolean; duration: number; bitIndex?: number }[] = [];

    // Byte 1
    for (let i = 0; i < byte1Str.length; i++) {
      const bit = byte1Str[i];
      sequence.push({ isFlash: true, duration: bit === "1" ? 700 : 250, bitIndex: i });
      if (i < byte1Str.length - 1) {
        sequence.push({ isFlash: false, duration: 480 });
      }
    }

    // Gap between bytes
    sequence.push({ isFlash: false, duration: 1300 });

    // Byte 2
    for (let i = 0; i < byte2Str.length; i++) {
      const bit = byte2Str[i];
      sequence.push({ isFlash: true, duration: bit === "1" ? 700 : 250, bitIndex: 8 + i });
      if (i < byte2Str.length - 1) {
        sequence.push({ isFlash: false, duration: 480 });
      }
    }

    let step = 0;

    const executeStep = () => {
      if (step >= sequence.length) {
        stopPlayback();
        return;
      }

      const item = sequence[step];
      setLampOn(item.isFlash);
      setCurrentStepIndex(item.bitIndex ?? null);

      step++;
      timeoutRef.current = setTimeout(executeStep, item.duration);
    };

    executeStep();
  }, [byte1Str, byte2Str, stopPlayback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Free interactive toggles - never blocked so player can always decode and test
  const toggleByte1 = (idx: number) => {
    setByte1Switches((prev) => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
    setFeedback(null);
  };

  const toggleByte2 = (idx: number) => {
    setByte2Switches((prev) => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
    setFeedback(null);
  };

  const handleResetSwitches = () => {
    setByte1Switches(Array(8).fill(false));
    setByte2Switches(Array(8).fill(false));
    setFeedback(null);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (disabled) {
      setFeedback({
        type: "error",
        message: "ACCESS RESTRICTED: THIS TERMINAL IS LOCKED TO OPERATOR 1.",
      });
      return;
    }

    if (!byte1Result.isValidChar || !byte2Result.isValidChar) {
      setFeedback({
        type: "error",
        message: "INCOMPLETE SEQUENCE: ARRANGE THE BINARY SWITCHES TO DECODE PRINTABLE ASCII CHARACTERS.",
      });
      return;
    }

    const answerStr = `${byte1Result.char}${byte2Result.char}`;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (onAnswerSubmit) {
        const res = await onAnswerSubmit(answerStr);
        const resObj = (res && typeof res === "object" ? res : {}) as {
          correct?: boolean;
          feedback?: string;
        };

        if (resObj.correct === false) {
          setFeedback({
            type: "error",
            message:
              resObj.feedback ||
              `IDENTIFIER "${answerStr}" REJECTED. CHECK EACH BIT AGAINST THE SIGNAL SEQUENCE.`,
          });
        } else {
          setFeedback({
            type: "success",
            message: `✓ IDENTIFIER "${answerStr}" ACCEPTED. ACCESS GRANTED.`,
          });
        }
      } else {
        // Standalone or local testing
        if (answerStr.toUpperCase() === "SZ") {
          setFeedback({
            type: "success",
            message: "✓ IDENTIFIER 'SZ' ACCEPTED. ACCESS GRANTED.",
          });
        } else {
          setFeedback({
            type: "error",
            message: `IDENTIFIER "${answerStr}" REJECTED. CHECK EACH BIT AGAINST THE SIGNAL.`,
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

  const currentByte1Bits = byte1Switches.map((b) => (b ? "1" : "0")).join("");
  const currentByte2Bits = byte2Switches.map((b) => (b ? "1" : "0")).join("");

  return (
    <div className="w-full border border-[var(--panel-border)] bg-[var(--bg)]/95 p-4 sm:p-5 rounded-xs space-y-5 font-mono select-none">
      {/* Terminal Title Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-[var(--panel-border)]/60 pb-3 gap-2">
        <div>
          <span className="text-xs sm:text-sm font-bold text-[var(--accent)] tracking-widest uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            OPTICAL SIGNAL RECEIVER // TRANSMISSION 1.1
          </span>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
            Long flash = 1 (700ms) · Short flash = 0 (250ms) · Gap = 480ms · Byte gap = 1300ms
          </p>
        </div>

        {/* Fallback Toggle */}
        <button
          type="button"
          onClick={() => setShowTextFallback((prev) => !prev)}
          className="min-h-[44px] px-3 py-1.5 border border-[var(--panel-border)] hover:border-[var(--accent)] text-[11px] text-[var(--text-muted)] hover:text-[var(--accent)] rounded-xs uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)] cursor-pointer"
        >
          {showTextFallback ? "HIDE PATTERN AS TEXT" : "SHOW PATTERN AS TEXT"}
        </button>
      </div>

      {/* Task Description Panel */}
      <div className="border border-[var(--panel-border)]/80 bg-[var(--panel)]/50 p-3.5 rounded-xs space-y-1.5">
        <div className="text-[11px] font-bold text-[var(--accent)] tracking-wider uppercase flex items-center gap-2">
          <span>🗄</span>
          <span>TASK: BINARY SIGNAL TRANSCRIPTION</span>
        </div>
        <p className="text-xs text-[var(--text)] leading-relaxed">
          An optical indicator on the terminal display flashes a binary transmission. Click any switch box below to toggle bits (0 ↔ 1), or type the 8-bit binary pattern directly into the field. The resulting ASCII characters form the two-letter project identifier required for database access.
        </p>
      </div>

      {/* Mandatory Fallback Box */}
      {showTextFallback && (
        <div
          role="region"
          aria-label="Direct text fallback for binary sequence"
          className="p-3 border border-[var(--accent)]/50 bg-[var(--panel)]/90 text-xs text-[var(--text)] space-y-1 rounded-xs"
        >
          <div className="text-[10px] text-[var(--accent)] font-bold tracking-widest uppercase">
            [ACCESSIBILITY FALLBACK: UNENCODED TRANSMISSION PATTERN]
          </div>
          <div className="text-sm font-bold tracking-[0.3em] text-[var(--accent)] py-1 font-mono">
            {byte1Str} {byte2Str}
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">
            Transcribe into two ASCII characters using the switch decoder below.
          </div>
        </div>
      )}

      {/* Signal Lamp Display Area */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-3 bg-[var(--panel)]/50 border border-[var(--panel-border)]/60 p-4 rounded-xs">
        {/* The Lamp (modest size, max 96x96px) */}
        <div className="flex flex-col items-center gap-2">
          <div
            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 transition-all duration-75 flex items-center justify-center ${
              lampOn
                ? "border-[var(--accent)] bg-[var(--accent)] shadow-[0_0_35px_var(--accent),inset_0_0_15px_#ffffff]"
                : "border-[#163847] bg-[#020b10] shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]"
            }`}
            aria-live="polite"
            aria-label={lampOn ? "Optical signal lamp: FLASHING ON" : "Optical signal lamp: OFF"}
          >
            <div
              className={`w-10 h-10 rounded-full transition-opacity duration-75 ${
                lampOn ? "bg-white opacity-95" : "bg-transparent opacity-0"
              }`}
            />
          </div>

          <span className="text-[10px] text-[var(--text-muted)] tracking-widest uppercase">
            {lampOn ? "SIGNAL: PULSE" : isPlaying ? "SIGNAL: GAP" : "STANDBY"}
          </span>
        </div>

        {/* Controls & Progress Indicator */}
        <div className="flex flex-col items-center sm:items-start gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={playSequence}
              disabled={isPlaying}
              className="min-h-[44px] min-w-[44px] px-5 py-2.5 bg-[var(--accent)] text-[var(--bg)] font-bold text-xs uppercase tracking-widest rounded-xs hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--accent)] transition-all shadow-md active:scale-95 cursor-pointer"
            >
              {isPlaying ? "PLAYING SIGNAL..." : "PLAY SIGNAL"}
            </button>

            {isPlaying && (
              <button
                type="button"
                onClick={stopPlayback}
                className="min-h-[44px] min-w-[44px] px-4 py-2.5 border border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-[var(--bg)] font-bold text-xs uppercase tracking-widest rounded-xs focus-visible:outline-2 focus-visible:outline-[var(--danger)] transition-colors cursor-pointer"
              >
                STOP
              </button>
            )}
          </div>

          {/* 16-Dot Transmission Monitor */}
          <div className="flex items-center gap-1 pt-1">
            <span className="text-[9px] text-[var(--text-muted)] mr-1">BYTE 1:</span>
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                className={`w-2.5 h-2.5 rounded-full border border-[var(--panel-border)] transition-colors ${
                  currentStepIndex === i
                    ? "bg-[var(--accent)] shadow-[0_0_6px_var(--accent)]"
                    : "bg-[var(--bg)]"
                }`}
              />
            ))}
            <span className="text-[9px] text-[var(--text-muted)] ml-2 mr-1">BYTE 2:</span>
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i + 8}
                className={`w-2.5 h-2.5 rounded-full border border-[var(--panel-border)] transition-colors ${
                  currentStepIndex === i + 8
                    ? "bg-[var(--accent)] shadow-[0_0_6px_var(--accent)]"
                    : "bg-[var(--bg)]"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Transcription Switches: 16 toggle switches in two rows of 8 */}
      <div className="border border-[var(--panel-border)] bg-[var(--panel)]/40 p-3.5 sm:p-4 rounded-xs space-y-5">
        <div className="flex items-center justify-between text-xs border-b border-[var(--panel-border)]/50 pb-2">
          <span className="font-bold text-[var(--accent)] tracking-widest uppercase flex items-center gap-1.5">
            <span>⚡</span>
            TRANSCRIPTION SWITCHES // BIT DECODER
          </span>
          <button
            type="button"
            onClick={handleResetSwitches}
            className="text-[10px] text-[var(--text-muted)] hover:text-[var(--danger)] uppercase tracking-wider transition-colors cursor-pointer"
          >
            [RESET ALL BITS]
          </button>
        </div>

        {/* ROW 1: BYTE 1 */}
        <div className="space-y-2 p-3 bg-[var(--panel)]/30 border border-[var(--panel-border)]/50 rounded-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--accent)] tracking-wider">BYTE 1 (BITS 7 → 0):</span>
              <span className="font-mono text-xs font-bold tracking-widest text-[var(--accent)] px-2 py-0.5 bg-[var(--bg)] border border-[var(--panel-border)] rounded-xs">
                {currentByte1Bits}
              </span>
            </div>
            <span className="font-mono text-[var(--text)]">
              DEC: <strong className="text-[var(--text)]">{byte1Result.decimal}</strong> · ASCII: &ldquo;
              <strong className="text-[var(--accent)] font-mono text-base">
                {byte1Result.isValidChar ? byte1Result.char : "·"}
              </strong>
              &rdquo;
            </span>
          </div>

          <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
            {byte1Switches.map((bit, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => toggleByte1(idx)}
                className={`min-h-[46px] min-w-[36px] flex flex-col items-center justify-center p-1 border rounded-xs font-mono transition-all focus-visible:outline-2 focus-visible:outline-[var(--accent)] cursor-pointer active:scale-95 ${
                  bit
                    ? "border-[var(--accent)] bg-[var(--accent)]/25 text-[var(--accent)] font-bold shadow-[0_0_10px_var(--accent)/40]"
                    : "border-[var(--panel-border)] bg-[var(--bg)] text-[var(--text-muted)] hover:border-[var(--accent)]/60 hover:text-[var(--text)]"
                }`}
                aria-label={`Byte 1, Bit ${7 - idx} (Value ${Math.pow(2, 7 - idx)}): currently ${bit ? "1" : "0"}. Click to toggle.`}
              >
                <span className="text-sm font-bold">{bit ? "1" : "0"}</span>
                <span className="text-[8px] text-[var(--text-muted)]/70">{Math.pow(2, 7 - idx)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ROW 2: BYTE 2 */}
        <div className="space-y-2 p-3 bg-[var(--panel)]/30 border border-[var(--panel-border)]/50 rounded-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--accent)] tracking-wider">BYTE 2 (BITS 7 → 0):</span>
              <span className="font-mono text-xs font-bold tracking-widest text-[var(--accent)] px-2 py-0.5 bg-[var(--bg)] border border-[var(--panel-border)] rounded-xs">
                {currentByte2Bits}
              </span>
            </div>
            <span className="font-mono text-[var(--text)]">
              DEC: <strong className="text-[var(--text)]">{byte2Result.decimal}</strong> · ASCII: &ldquo;
              <strong className="text-[var(--accent)] font-mono text-base">
                {byte2Result.isValidChar ? byte2Result.char : "·"}
              </strong>
              &rdquo;
            </span>
          </div>

          <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
            {byte2Switches.map((bit, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => toggleByte2(idx)}
                className={`min-h-[46px] min-w-[36px] flex flex-col items-center justify-center p-1 border rounded-xs font-mono transition-all focus-visible:outline-2 focus-visible:outline-[var(--accent)] cursor-pointer active:scale-95 ${
                  bit
                    ? "border-[var(--accent)] bg-[var(--accent)]/25 text-[var(--accent)] font-bold shadow-[0_0_10px_var(--accent)/40]"
                    : "border-[var(--panel-border)] bg-[var(--bg)] text-[var(--text-muted)] hover:border-[var(--accent)]/60 hover:text-[var(--text)]"
                }`}
                aria-label={`Byte 2, Bit ${7 - idx} (Value ${Math.pow(2, 7 - idx)}): currently ${bit ? "1" : "0"}. Click to toggle.`}
              >
                <span className="text-sm font-bold">{bit ? "1" : "0"}</span>
                <span className="text-[8px] text-[var(--text-muted)]/70">{Math.pow(2, 7 - idx)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LIVE DECODED READOUT & SUBMISSION PANEL */}
      <div className="border border-[var(--panel-border)] bg-[var(--panel)]/70 p-4 sm:p-5 rounded-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--panel-border)]/50 pb-2">
          <span className="text-xs font-bold text-[var(--accent)] tracking-widest uppercase flex items-center gap-2">
            <span>⚙</span> DECODED PROJECT IDENTIFIER (DERIVED FROM BINARY)
          </span>
          <span className="text-[10px] text-[var(--text-muted)]">
            [Characters update live as you toggle or type bits]
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Visual Letters Readout */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">
              OUTPUT:
            </span>
            <div className="flex items-center gap-2">
              {/* Byte 1 Decoded Character */}
              <div className="w-14 h-14 flex flex-col items-center justify-center border-2 border-[var(--accent)]/80 bg-[var(--bg)] rounded-xs shadow-[0_0_12px_var(--accent)/20]">
                <span
                  className={`text-2xl font-bold ${
                    byte1Result.isValidChar ? "text-[var(--accent)] animate-pulse" : "text-[var(--text-muted)]/50"
                  }`}
                >
                  {byte1Result.isValidChar ? byte1Result.char : "?"}
                </span>
                <span className="text-[8px] text-[var(--text-muted)] tracking-wider">BYTE 1</span>
              </div>

              <span className="text-[var(--text-muted)] text-base font-bold">+</span>

              {/* Byte 2 Decoded Character */}
              <div className="w-14 h-14 flex flex-col items-center justify-center border-2 border-[var(--accent)]/80 bg-[var(--bg)] rounded-xs shadow-[0_0_12px_var(--accent)/20]">
                <span
                  className={`text-2xl font-bold ${
                    byte2Result.isValidChar ? "text-[var(--accent)] animate-pulse" : "text-[var(--text-muted)]/50"
                  }`}
                >
                  {byte2Result.isValidChar ? byte2Result.char : "?"}
                </span>
                <span className="text-[8px] text-[var(--text-muted)] tracking-wider">BYTE 2</span>
              </div>
            </div>

            <div className="text-xs font-mono text-[var(--text-muted)] pl-2">
              RESULT: &ldquo;
              <strong className="text-[var(--accent)] font-mono text-base tracking-widest">
                {byte1Result.isValidChar && byte2Result.isValidChar
                  ? `${byte1Result.char}${byte2Result.char}`
                  : "--"}
              </strong>
              &rdquo;
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !byte1Result.isValidChar || !byte2Result.isValidChar}
            className="w-full sm:w-auto min-h-[44px] px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-[var(--bg)] font-mono text-xs font-bold uppercase tracking-widest rounded-xs shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? "TRANSMITTING..." : "SUBMIT IDENTIFIER"}
          </button>
        </div>

        {/* Feedback Display */}
        {feedback && (
          <div
            role="alert"
            className={`text-xs font-mono tracking-wider uppercase p-2.5 border rounded-xs ${
              feedback.type === "success"
                ? "border-[var(--success)] bg-[var(--success)]/10 text-[var(--success)]"
                : "border-[var(--danger)] bg-[var(--danger)]/10 text-[var(--danger)]"
            }`}
          >
            {feedback.message}
          </div>
        )}

        <div className="text-[10px] text-[var(--text-muted)]/70 pt-1">
          ⓘ Click any bit box to toggle 0 ↔ 1, or type 8 bits in the text box. Arrange bits to produce the required project identifier.
        </div>
      </div>
    </div>
  );
}

export default SignalLamp;

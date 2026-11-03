"use client";

import React, { useState, useRef, useCallback } from "react";
import { ToolProps } from "@/rounds/types";

export interface NetworkSession {
  session: string;
  processId: number;
  port: number;
  data: string;
}

const SESSIONS: NetworkSession[] = [
  { session: "A", processId: 314, port: 443, data: "1010" },
  { session: "B", processId: 721, port: 22, data: "0111" },
  { session: "C", processId: 314, port: 443, data: "1100" },
  { session: "D", processId: 830, port: 443, data: "0011" },
  { session: "E", processId: 428, port: 22, data: "1110" },
  { session: "F", processId: 314, port: 443, data: "0011" },
];

export interface NetworkSessionFilterProps extends ToolProps<unknown> {
  onAnswerSubmit?: (answer: string) => Promise<unknown> | void;
  standalone?: boolean;
}

export function NetworkSessionFilter({
  disabled = false,
  onAnswerSubmit,
}: NetworkSessionFilterProps) {
  // Cursor / Spotlight coordinates relative to table container (null until pointer reaches)
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Selected session letters (e.g. ["A", "C", "F"])
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Update spotlight position on mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    setCursorPos({ x, y });
  }, []);

  // Update spotlight on touch drag
  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.touches.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(0, Math.min(rect.width, touch.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, touch.clientY - rect.top));
    setCursorPos({ x, y });
  }, []);

  const toggleSession = (letter: string) => {
    if (disabled || isSubmitting) return;
    setSelectedSessions((prev) => {
      if (prev.includes(letter)) {
        return prev.filter((s) => s !== letter);
      } else {
        return [...prev, letter].sort();
      }
    });
    setFeedback(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || isSubmitting) return;

    if (selectedSessions.length === 0) {
      setFeedback({
        type: "error",
        message: "SELECT AT LEAST ONE MATCHING SESSION BEFORE SUBMITTING.",
      });
      return;
    }

    const answerStr = selectedSessions.slice().sort().join("");
    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (onAnswerSubmit) {
        const res = await onAnswerSubmit(answerStr);
        const resObj = (res && typeof res === "object" ? res : {}) as { correct?: boolean; feedback?: string };
        if (resObj.correct === false) {
          setFeedback({
            type: "error",
            message: resObj.feedback || "CRITERIA NOT MET. IDENTIFY SESSIONS WITH PID 314 AND PORT 443.",
          });
        } else {
          setFeedback({
            type: "success",
            message: "✓ SESSIONS VERIFIED: A, C, AND F ACCEPTED.",
          });
        }
      } else {
        if (answerStr === "ACF") {
          setFeedback({
            type: "success",
            message: "✓ SESSIONS VERIFIED: A, C, AND F ACCEPTED.",
          });
        } else {
          setFeedback({
            type: "error",
            message: "CRITERIA NOT MET. IDENTIFY SESSIONS WITH PID 314 AND PORT 443.",
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

  // 3 Selected display slots matching screenshot: [ - ] [ - ] [ - ]
  const selectedSlots = [
    selectedSessions[0] || "-",
    selectedSessions[1] || "-",
    selectedSessions[2] || "-",
  ];

  return (
    <div className="w-full font-mono select-none space-y-6">
      {/* Terminal Title Bar matching Screenshot */}
      <div className="flex items-center justify-between border-b border-[var(--panel-border)]/70 pb-2">
        <h2 className="text-sm sm:text-base font-bold text-[var(--accent)] tracking-widest uppercase flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-[var(--accent)] animate-pulse" />
          NETWORK TERMINAL 01 : SESSION FILTER
        </h2>
        <span className="text-sm sm:text-base font-bold text-[var(--accent)] uppercase">
          Q2.1
        </span>
      </div>

      {/* Main Grid: Spotlight Table on Left, Task and Selection on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Network Session Table with Spotlight Effect (7 cols on lg) */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseMove}
          onTouchStart={handleTouchMove}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => setCursorPos(null)}
          onMouseLeave={() => setCursorPos(null)}
          className="lg:col-span-7 border border-[var(--panel-border)] bg-black p-4 sm:p-5 rounded-sm relative overflow-hidden shadow-2xl cursor-crosshair min-h-[300px]"
          style={{ backgroundColor: "#000000" }}
        >
          {/* Subtle Scanline Overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-10 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.8)_3px)] z-20"
            aria-hidden="true"
          />

          {/* Masked Content Layer: 100% pitch black until pointer reaches there */}
          <div
            className="relative"
            style={{
              clipPath: cursorPos
                ? `circle(85px at ${cursorPos.x}px ${cursorPos.y}px)`
                : "circle(0px at 0px 0px)",
              WebkitClipPath: cursorPos
                ? `circle(85px at ${cursorPos.x}px ${cursorPos.y}px)`
                : "circle(0px at 0px 0px)",
              maskImage: cursorPos
                ? `radial-gradient(circle 85px at ${cursorPos.x}px ${cursorPos.y}px, black 0%, black 50px, transparent 85px)`
                : "none",
              WebkitMaskImage: cursorPos
                ? `radial-gradient(circle 85px at ${cursorPos.x}px ${cursorPos.y}px, black 0%, black 50px, transparent 85px)`
                : "none",
              opacity: cursorPos ? 1 : 0,
              pointerEvents: cursorPos ? "auto" : "none",
              transition: "opacity 100ms ease",
            }}
          >
            {/* Table Header */}
            <div className="grid grid-cols-12 text-[11px] text-[var(--accent)] font-bold pb-3 mb-2 border-b border-[var(--panel-border)]/40 px-2 tracking-wider uppercase">
              <span className="col-span-2 text-center"></span>
              <span className="col-span-2 text-center">Session</span>
              <span className="col-span-3 text-center">Process ID</span>
              <span className="col-span-2 text-center">Port</span>
              <span className="col-span-3 text-right pr-2">Data</span>
            </div>

            {/* Table Rows (Revealed exclusively inside flashlight beam) */}
            <div className="space-y-1">
              {SESSIONS.map((row) => {
                const isSelected = selectedSessions.includes(row.session);

                return (
                  <div
                    key={`session-${row.session}`}
                    onClick={() => toggleSession(row.session)}
                    className={`grid grid-cols-12 items-center p-2.5 rounded-xs transition-colors cursor-pointer border ${
                      isSelected
                        ? "border-[var(--accent)]/80 bg-[var(--accent)]/15"
                        : "border-transparent hover:bg-white/[0.04]"
                    }`}
                  >
                    {/* Checkbox */}
                    <div className="col-span-2 flex justify-center">
                      <div
                        className={`w-4 h-4 rounded-xs border flex items-center justify-center text-[10px] font-bold ${
                          isSelected
                            ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]"
                            : "border-[var(--panel-border)] bg-[var(--bg)]/80 text-transparent"
                        }`}
                      >
                        ✓
                      </div>
                    </div>

                    {/* Session Letter */}
                    <div className="col-span-2 text-center font-bold text-xs text-[var(--text)]">
                      {row.session}
                    </div>

                    {/* Process ID */}
                    <div className="col-span-3 text-center font-bold text-sm tracking-wider text-[var(--accent)]">
                      {row.processId}
                    </div>

                    {/* Port */}
                    <div className="col-span-2 text-center text-xs text-[var(--text)]">
                      {row.port}
                    </div>

                    {/* Data */}
                    <div className="col-span-3 text-right pr-2 font-mono text-xs tracking-widest text-[var(--text-muted)]">
                      {row.data}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Spotlight Glow Circle at Cursor Position */}
          {cursorPos && (
            <div
              className="absolute pointer-events-none z-30 rounded-full"
              style={{
                width: "170px",
                height: "170px",
                left: `${cursorPos.x - 85}px`,
                top: `${cursorPos.y - 85}px`,
                background:
                  "radial-gradient(circle, rgba(74, 222, 128, 0.22) 0%, rgba(56, 189, 248, 0.1) 50%, transparent 75%)",
                boxShadow: "0 0 25px 6px rgba(74, 222, 128, 0.18)",
                border: "1px solid rgba(74, 222, 128, 0.28)",
              }}
            />
          )}
        </div>

        {/* Right Column: Task card and Submit Bar (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* TASK Card matching Screenshot */}
          <div className="border border-[var(--panel-border)] bg-[var(--panel)]/70 p-5 space-y-3 shadow-md rounded-sm">
            <div className="text-[var(--accent)] font-bold tracking-wider uppercase flex items-center gap-2 text-xs">
              <span className="text-sm">🎯</span>
              <span>TASK</span>
            </div>

            <p className="text-xs text-[var(--text)] leading-relaxed">
              Find all sessions meeting <strong className="text-[var(--text)]">BOTH</strong> conditions:
            </p>

            <ul className="space-y-1.5 text-xs text-[var(--text)] pl-3">
              <li className="flex items-center gap-2">
                <span className="text-[var(--accent)]">•</span>
                <span>Process ID: <strong className="text-[var(--accent2)]">314</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--accent)]">•</span>
                <span>Port: <strong className="text-[var(--accent2)]">443</strong></span>
              </li>
            </ul>

            <p className="text-[11px] text-[var(--text-muted)] pt-1">
              Select the matching session letters and submit.
            </p>
          </div>

          {/* Selected Slots and SUBMIT Bar matching Screenshot */}
          <div className="border border-[var(--panel-border)] bg-[var(--panel)]/60 p-4 rounded-sm shadow-md flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-[var(--text)] font-semibold">Selected:</span>
              <div className="flex items-center gap-1.5">
                {selectedSlots.map((slot, i) => (
                  <div
                    key={`slot-${i}`}
                    className={`w-7 h-7 rounded-xs border flex items-center justify-center font-bold text-xs ${
                      slot !== "-"
                        ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)] shadow-xs"
                        : "border-[var(--panel-border)] bg-[var(--bg)]/80 text-[var(--text-muted)]/50"
                    }`}
                  >
                    {slot}
                  </div>
                ))}
              </div>
            </div>

            {/* SUBMIT Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={disabled || isSubmitting}
              className="px-6 py-2 border border-[var(--accent)] bg-transparent hover:bg-[var(--accent)] text-[var(--accent)] hover:text-[var(--bg)] disabled:opacity-40 font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-[var(--accent)] active:scale-95"
            >
              {isSubmitting ? "CHECKING..." : "SUBMIT"}
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

      {/* Bottom Hint Banner matching Screenshot */}
      <div className="border border-[var(--panel-border)]/70 bg-[var(--bg)]/60 p-3 rounded-xs flex items-center gap-2 text-xs text-[var(--accent)] tracking-wider">
        <span className="text-sm">ⓘ</span>
        <span>HINT: Move your cursor to inspect the records. Select the matching sessions.</span>
      </div>
    </div>
  );
}

export default NetworkSessionFilter;

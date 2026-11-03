"use client";

import React, { useState } from "react";
import { ToolProps } from "@/rounds/types";

export interface AccessRecordItem {
  id: string;
  timestamp: string;
  status: "SUCCESS" | "FAILED";
  percent: number; // Percentage offset along the timeline
}

const RECORDS: AccessRecordItem[] = [
  { id: "A", timestamp: "22:58:31", status: "SUCCESS", percent: 15 },
  { id: "B", timestamp: "23:02:14", status: "FAILED", percent: 38 },
  { id: "C", timestamp: "23:05:42", status: "SUCCESS", percent: 60 },
  { id: "D", timestamp: "23:08:19", status: "SUCCESS", percent: 76 },
  { id: "E", timestamp: "23:10:01", status: "FAILED", percent: 89 },
];

export interface AccessRecordsProps extends ToolProps<unknown> {
  onAnswerSubmit?: (answer: string) => Promise<unknown> | void;
  standalone?: boolean;
}

export function AccessRecords({
  disabled = false,
  onAnswerSubmit,
}: AccessRecordsProps) {
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const toggleRecord = (id: string) => {
    if (disabled || isSubmitting) return;
    setSelectedRecords((prev) => {
      if (prev.includes(id)) {
        return prev.filter((r) => r !== id);
      } else {
        return [...prev, id].sort();
      }
    });
    setFeedback(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || isSubmitting) return;

    if (selectedRecords.length === 0) {
      setFeedback({
        type: "error",
        message: "SELECT AT LEAST ONE ACCESS RECORD BEFORE SUBMITTING.",
      });
      return;
    }

    const answerStr = selectedRecords.slice().sort().join(" ");
    setIsSubmitting(true);
    setFeedback(null);

    try {
      if (onAnswerSubmit) {
        const res = await onAnswerSubmit(answerStr);
        const resObj = (res && typeof res === "object" ? res : {}) as { correct?: boolean; feedback?: string };
        if (resObj.correct === false) {
          setFeedback({
            type: "error",
            message: resObj.feedback || "COUNT ONLY SUCCESSFUL EVENTS AFTER 23:00.",
          });
        } else {
          setFeedback({
            type: "success",
            message: "✓ SELECTION VERIFIED: RECORDS C AND D ACCEPTED.",
          });
        }
      } else {
        const isCorrect =
          selectedRecords.length === 2 &&
          selectedRecords.includes("C") &&
          selectedRecords.includes("D");

        if (isCorrect) {
          setFeedback({
            type: "success",
            message: "✓ SELECTION VERIFIED: RECORDS C AND D ACCEPTED.",
          });
        } else {
          setFeedback({
            type: "error",
            message: "COUNT ONLY SUCCESSFUL EVENTS AFTER 23:00.",
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
          ARCHIVE TERMINAL 02: ACCESS RECORD ANALYSIS · Q4.2
        </h2>
        <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline uppercase">
          LOG REVIEW // SHUTDOWN: 23:00
        </span>
      </div>

      {/* Top Grid: Record Table on Left, Instructions & Note on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Original Record Table (7 cols on lg) */}
        <div className="lg:col-span-7 border border-[var(--panel-border)] bg-[var(--panel)]/70 p-4 sm:p-5 font-mono text-xs shadow-md space-y-3">
          <p className="text-xs text-[var(--text)] leading-relaxed">
            The official shutdown time was recorded as <strong className="text-[var(--accent)] font-bold">23:00</strong>.
          </p>

          <div className="border border-[var(--panel-border)]/60 bg-[var(--bg)]/70 overflow-hidden">
            <div className="grid grid-cols-3 text-[var(--text-muted)] font-semibold p-2.5 border-b border-[var(--panel-border)]/50 text-[11px] uppercase">
              <span>Record</span>
              <span className="text-center">Timestamp</span>
              <span className="text-right">Status</span>
            </div>
            <div className="divide-y divide-[var(--panel-border)]/30 text-xs">
              {RECORDS.map((record) => (
                <div
                  key={`tbl-${record.id}`}
                  className="grid grid-cols-3 p-2.5 items-center font-mono"
                >
                  <span className="font-bold text-[var(--text)]">{record.id}</span>
                  <span className="text-center text-[var(--text-muted)]">{record.timestamp}</span>
                  <span
                    className={`text-right font-bold tracking-wider ${
                      record.status === "SUCCESS"
                        ? "text-[var(--success)]"
                        : "text-[var(--danger)]"
                    }`}
                  >
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Instructions & Note (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* INSTRUCTIONS */}
          <div className="border border-[var(--panel-border)] bg-[var(--panel)]/60 p-4 space-y-2 text-xs shadow-md">
            <div className="text-[var(--accent)] font-bold tracking-wider uppercase flex items-center gap-1.5 text-xs">
              <span>ⓘ</span>
              <span>INSTRUCTIONS</span>
            </div>
            <ul className="space-y-1.5 text-[var(--text-muted)] text-[11px] leading-relaxed pt-1">
              <li className="flex items-start gap-1.5">
                <span className="text-[var(--accent)]">•</span>
                <span>Review the access records.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[var(--accent)]">•</span>
                <span>
                  Select (tap) the records that are <strong className="text-[var(--text)]">successful</strong> and occurred <strong className="text-[var(--text)]">after 23:00</strong>.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[var(--accent)]">•</span>
                <span>
                  When the correct records are selected, click <strong className="text-[var(--accent)]">SUBMIT</strong> to proceed.
                </span>
              </li>
            </ul>
          </div>

          {/* NOTE */}
          <div className="border border-[var(--panel-border)] bg-[var(--panel)]/60 p-4 space-y-1.5 text-xs shadow-md">
            <div className="text-[var(--accent)] font-bold tracking-wider uppercase flex items-center gap-1.5 text-xs">
              <span>🎯</span>
              <span>NOTE</span>
            </div>
            <p className="text-[var(--text-muted)] text-[11px] leading-relaxed">
              Select only the relevant records. No manual number input is required.
            </p>
          </div>
        </div>
      </div>

      {/* Middle Section: TIMELINE Panel */}
      <div className="border border-[var(--panel-border)] bg-[var(--panel)]/50 p-4 sm:p-6 shadow-lg space-y-6">
        {/* Section Header */}
        <div className="text-xs text-[var(--accent)] tracking-wider">
          <span className="font-bold">TIMELINE</span> · The dashed line is the official shutdown. Tap a record to select or unselect it.
        </div>

        {/* Interactive Timeline Track */}
        <div className="relative w-full pt-16 pb-12 overflow-x-auto min-h-[160px]">
          <div className="relative w-full min-w-[580px] h-20 flex items-center">
            {/* Horizontal Timeline Base Line */}
            <div className="absolute left-4 right-4 h-0.5 bg-[var(--accent)]/40" />

            {/* Dashed Red Vertical Line marking SHUTDOWN 23:00 at ~25% */}
            <div
              className="absolute flex flex-col items-center pointer-events-none z-10"
              style={{ left: "25%", transform: "translateX(-50%)", top: "-54px", bottom: "-24px" }}
            >
              {/* Badge */}
              <div className="px-2.5 py-0.5 border border-[var(--danger)] bg-[var(--bg)] text-[var(--danger)] text-[10px] font-bold tracking-wider rounded-xs whitespace-nowrap mb-1 shadow-sm">
                SHUTDOWN 23:00
              </div>
              {/* Vertical Dashed Line */}
              <div className="w-0.5 flex-1 border-r-2 border-dashed border-[var(--danger)] opacity-80" />
            </div>

            {/* Records A to E plotted along the timeline */}
            {RECORDS.map((record) => {
              const isSelected = selectedRecords.includes(record.id);

              return (
                <div
                  key={`timeline-${record.id}`}
                  style={{ left: `${record.percent}%` }}
                  className="absolute -translate-x-1/2 flex flex-col items-center cursor-pointer group"
                  onClick={() => toggleRecord(record.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleRecord(record.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-pressed={isSelected}
                  aria-label={`Toggle record ${record.id} at ${record.timestamp}, status ${record.status}`}
                >
                  {/* Timestamp and Status (Above Node) */}
                  <div className="absolute -top-11 flex flex-col items-center pointer-events-none whitespace-nowrap">
                    <span className="text-[11px] font-mono text-[var(--text)] group-hover:text-[var(--accent2)] transition-colors">
                      {record.timestamp}
                    </span>
                    <span
                      className={`text-[10px] font-bold tracking-wider ${
                        record.status === "SUCCESS"
                          ? "text-[var(--success)]"
                          : "text-[var(--danger)]"
                      }`}
                    >
                      {record.status}
                    </span>
                  </div>

                  {/* Interactive Circular Node */}
                  <div
                    className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-all duration-200 select-none ${
                      isSelected
                        ? "bg-[#062312] border-2 border-[var(--success)] text-[var(--success)] shadow-[0_0_15px_rgba(74,222,128,0.7)] scale-110"
                        : "bg-[var(--bg)] border-2 border-[var(--accent)] text-[var(--accent)] group-hover:scale-105 group-hover:border-[var(--accent2)]"
                    }`}
                  >
                    <span>{record.id}</span>

                    {/* Small Green Checkmark Badge on Top-Right Corner */}
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--success)] text-[var(--bg)] rounded-full text-[9px] font-black flex items-center justify-center shadow-xs animate-in zoom-in-50 duration-150">
                        ✓
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row: Selected Status and Submit Button matching Screenshot */}
      <div className="border border-[var(--panel-border)] bg-[var(--panel)]/60 p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Selected List */}
        <div className="flex items-center gap-2 text-xs font-mono tracking-wider w-full sm:w-auto">
          <span className="text-[var(--text)] font-semibold">Selected:</span>
          {selectedRecords.length > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {selectedRecords.map((id) => (
                <span
                  key={`sel-${id}`}
                  className="px-2.5 py-0.5 border border-[var(--success)] bg-[var(--success)]/10 text-[var(--success)] font-bold text-xs rounded-xs shadow-xs"
                >
                  {id}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-[var(--text-muted)] italic text-xs">None</span>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || isSubmitting}
          className="w-full sm:w-auto px-10 py-2.5 border border-[var(--accent)] bg-transparent hover:bg-[var(--accent)] text-[var(--accent)] hover:text-[var(--bg)] disabled:opacity-40 font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-[var(--accent)] active:scale-95"
        >
          {isSubmitting ? "VERIFYING..." : "SUBMIT"}
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
    </div>
  );
}

export default AccessRecords;

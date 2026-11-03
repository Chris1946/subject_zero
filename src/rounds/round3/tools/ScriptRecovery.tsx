"use client";

import React, { useState } from "react";
import { ToolProps } from "@/rounds/types";

const DATA = [4, 7, 2, 9, 5, 8, 3];
const TOTAL_ITERATIONS = 7;

interface RowState {
  i: string;
  dataVal: string;
  op: string;
  result: string;
}

const INITIAL_ROW_STATE: RowState = {
  i: "",
  dataVal: "",
  op: "",
  result: "",
};

export interface ScriptRecoveryProps extends ToolProps<unknown> {
  onAnswerSubmit?: (answer: string) => Promise<unknown> | void;
  onFinalAnswerSubmit?: (answer: string) => void;
  standalone?: boolean;
}

export function ScriptRecovery({
  disabled = false,
  onAnswerSubmit,
  onFinalAnswerSubmit,
}: ScriptRecoveryProps) {
  // Current active iteration: 0 to 6 (represented as 1 to 7 to player)
  const [currentIteration, setCurrentIteration] = useState(0);

  // Completed rows history
  const [completedRows, setCompletedRows] = useState<RowState[]>([]);

  // Current row input values
  const [currentRow, setCurrentRow] = useState<RowState>(INITIAL_ROW_STATE);

  // UI status and feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalOutput, setFinalOutput] = useState<number | null>(null);

  // Final answer submission state (enabled strictly after all 7 iterations are complete)
  const [answerInput, setAnswerInput] = useState("");
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
  const [finalSubmitFeedback, setFinalSubmitFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Prevent paste, drag, and context menu for anti-cheating
  const antiCheatHandlers = {
    onPaste: (e: React.ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
    },
  };

  // Local authoritative validator (fallback if network is unreachable)
  const validateLocally = (step: number, row: RowState) => {
    let localResult = 0;
    for (let s = 0; s <= step; s++) {
      const op = s % 2 === 0 ? "+" : "-";
      if (op === "+") {
        localResult += DATA[s];
      } else {
        localResult -= DATA[s];
      }
    }

    const expectedI = step;
    const expectedDataVal = DATA[step];
    const expectedOp = step % 2 === 0 ? "+" : "-";

    const cleanOp = row.op.trim();
    const opMatches = cleanOp === expectedOp || (expectedOp === "-" && cleanOp === "−");

    const valid =
      Number(row.i) === expectedI &&
      Number(row.dataVal) === expectedDataVal &&
      opMatches &&
      Number(row.result) === localResult;

    let err: string | null = null;
    if (!valid) {
      if (Number(row.i) !== expectedI) err = "CHECK LOOP INDEX (i).";
      else if (Number(row.dataVal) !== expectedDataVal) err = "CHECK LIST VALUE data[i].";
      else if (!opMatches) err = "CHECK BRANCH CONDITION (i % 2 == 0).";
      else if (Number(row.result) !== localResult) err = "INCORRECT RESULT ARITHMETIC.";
    }

    return { valid, error: err, finalOutput: localResult };
  };

  const handleSubmitCurrentRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || isCompleted || isSubmitting) return;

    if (!currentRow.i || !currentRow.dataVal || !currentRow.op || !currentRow.result) {
      setErrorMsg("ALL FOUR VALUES (i, data[i], op, result) ARE REQUIRED.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Validate with server endpoint first
      const res = await fetch("/api/round3/validate-iteration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          iterationIndex: currentIteration,
          i: currentRow.i,
          dataVal: currentRow.dataVal,
          op: currentRow.op,
          result: currentRow.result,
        }),
      });

      let data: { valid: boolean; error?: string; isComplete?: boolean; finalOutput?: number };

      if (res.ok) {
        data = await res.json();
      } else {
        // Fallback to local calculation
        const local = validateLocally(currentIteration, currentRow);
        data = {
          valid: local.valid,
          error: local.error ?? undefined,
          isComplete: local.valid && currentIteration === TOTAL_ITERATIONS - 1,
          finalOutput: local.finalOutput,
        };
      }

      if (data.valid) {
        // Lock this row and progress
        const updatedCompleted = [...completedRows, currentRow];
        setCompletedRows(updatedCompleted);
        setCurrentRow(INITIAL_ROW_STATE);

        if (currentIteration === TOTAL_ITERATIONS - 1) {
          setIsCompleted(true);
          const out = data.finalOutput ?? -10;
          setFinalOutput(out);
          setAnswerInput(out.toString());
        } else {
          setCurrentIteration((prev) => prev + 1);
        }
      } else {
        setErrorMsg(data.error || "EXECUTION VALUES DO NOT MATCH PYTHON LOGIC.");
      }
    } catch {
      // Fallback to offline validator
      const local = validateLocally(currentIteration, currentRow);
      if (local.valid) {
        const updatedCompleted = [...completedRows, currentRow];
        setCompletedRows(updatedCompleted);
        setCurrentRow(INITIAL_ROW_STATE);
        if (currentIteration === TOTAL_ITERATIONS - 1) {
          setIsCompleted(true);
          setFinalOutput(local.finalOutput);
          setAnswerInput(local.finalOutput.toString());
        } else {
          setCurrentIteration((prev) => prev + 1);
        }
      } else {
        setErrorMsg(local.error || "EXECUTION VALUES DO NOT MATCH PYTHON LOGIC.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (isCompleted) return;
    setCurrentRow(INITIAL_ROW_STATE);
    setErrorMsg(null);
  };

  const handleResetAll = () => {
    setCurrentIteration(0);
    setCompletedRows([]);
    setCurrentRow(INITIAL_ROW_STATE);
    setErrorMsg(null);
    setIsCompleted(false);
    setFinalOutput(null);
    setAnswerInput("");
    setFinalSubmitFeedback(null);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCompleted || disabled || isSubmittingFinal) return;

    const clean = answerInput.trim();
    if (!clean) {
      setFinalSubmitFeedback({
        type: "error",
        message: "ENTER THE FINAL COMPUTED RESULT TO SUBMIT.",
      });
      return;
    }

    setIsSubmittingFinal(true);
    setFinalSubmitFeedback(null);

    try {
      const submitFn = onAnswerSubmit || onFinalAnswerSubmit;
      if (submitFn) {
        const res = await submitFn(clean);
        const resObj = (res && typeof res === "object" ? res : {}) as {
          correct?: boolean;
          feedback?: string;
        };
        if (resObj.correct === false) {
          setFinalSubmitFeedback({
            type: "error",
            message: resObj.feedback || "OUTPUT DOES NOT MATCH PYTHON LOGIC. VERIFY ITERATIONS.",
          });
        } else {
          setFinalSubmitFeedback({
            type: "success",
            message: "✓ FINAL OUTPUT VERIFIED: -10 ACCEPTED.",
          });
        }
      } else {
        if (clean === "-10") {
          setFinalSubmitFeedback({
            type: "success",
            message: "✓ ACCESS GRANTED: -10 IS ACCEPTED.",
          });
        } else {
          setFinalSubmitFeedback({
            type: "error",
            message: "OUTPUT DOES NOT MATCH. CHECK THE ITERATION TABLE.",
          });
        }
      }
    } catch {
      setFinalSubmitFeedback({
        type: "error",
        message: "TRANSMISSION ERROR. RETRY SUBMISSION.",
      });
    } finally {
      setIsSubmittingFinal(false);
    }
  };

  const ordinalText = (idx: number) => {
    const ords = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh"];
    return ords[idx] || `iteration ${idx + 1}`;
  };

  return (
    <div className="w-full font-mono select-none space-y-6">
      {/* Top Header / Title */}
      <div className="flex items-center justify-between border-b border-[var(--panel-border)]/70 pb-2">
        <h2 className="text-sm sm:text-base font-bold text-[var(--accent)] tracking-widest uppercase flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-[var(--accent)] animate-pulse" />
          SCRIPT RECOVERY ENGINE · Q3.2
        </h2>
        <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline uppercase">
          PYTHON TRACE // LEN: 7
        </span>
      </div>

      {/* Top Grid: Code on left, Task & Rules on right */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Python Code Panel */}
        <div className="border border-[var(--panel-border)] bg-[var(--panel)]/70 p-4 sm:p-5 text-xs sm:text-sm font-mono leading-relaxed overflow-x-auto text-[var(--text)]">
          <pre className="text-[var(--text)] whitespace-pre">
            <span className="text-[var(--accent2)]">data</span> = [4,7,2,9,5,8,3]
            {"\n"}
            <span className="text-[var(--accent2)]">result</span> = 0
            {"\n"}
            <span className="text-[var(--warn)]">for</span> i{" "}
            <span className="text-[var(--warn)]">in</span>{" "}
            <span className="text-[var(--accent)]">range</span>(len(data)):
            {"\n"}    <span className="text-[var(--warn)]">if</span> i % 2 == 0:
            {"\n"}        result += data[i]
            {"\n"}    <span className="text-[var(--warn)]">else</span>:
            {"\n"}        result -= data[i]
            {"\n"}
            <span className="text-[var(--accent)]">print</span>(result)
          </pre>
        </div>

        {/* Right: Task and Rules */}
        <div className="flex flex-col gap-3">
          {/* TASK Card */}
          <div className="border border-[var(--panel-border)] bg-[var(--panel)]/60 p-4 space-y-2 text-xs">
            <div className="text-[var(--accent)] font-bold tracking-wider uppercase text-xs">
              TASK
            </div>
            <p className="text-[var(--text)] leading-relaxed">
              Reconstruct the execution step by step.
            </p>
            <p className="text-[var(--text-muted)]">
              Fill the {ordinalText(currentIteration)} iteration in the tracker with the correct values.
            </p>
          </div>

          {/* RULES Card */}
          <div className="border border-[var(--panel-border)] bg-[var(--panel)]/60 p-4 space-y-2 text-xs">
            <div className="text-[var(--accent)] font-bold tracking-wider uppercase text-xs">
              RULES
            </div>
            <ul className="space-y-1.5 text-[var(--text-muted)] text-[11px] leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-[var(--accent)]">•</span>
                <span>Decide the value of i, data[i] and the operation (+ or −).</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[var(--accent)]">•</span>
                <span>Compute the result for this iteration.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[var(--accent)]">•</span>
                <span>You must complete all 7 iterations to get the final output.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[var(--warn)]">•</span>
                <span>Pasting is disabled.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Section: EXECUTION TRACKER Panel */}
      <div className="border border-[var(--panel-border)] bg-[var(--panel)]/50 p-4 sm:p-5 shadow-lg space-y-4">
        {/* Tracker Panel Header */}
        <div className="flex items-center justify-between border-b border-[var(--panel-border)]/60 pb-3 text-xs tracking-wider">
          <div className="text-[var(--accent)] font-bold uppercase">
            EXECUTION TRACKER
          </div>
          <div className="text-[var(--text)] font-semibold uppercase">
            Iteration:{" "}
            <span className="text-[var(--accent)]">
              {isCompleted ? "7 / 7 (COMPLETE)" : `${currentIteration + 1} / ${TOTAL_ITERATIONS}`}
            </span>
          </div>
        </div>

        {/* Tracker Grid: Table on Left, Current State & Form on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Table (7 Cols / Left Side) */}
          <div className="lg:col-span-7 overflow-x-auto">
            <table className="w-full text-xs font-mono text-center border-collapse">
              <thead>
                <tr className="border-b border-[var(--panel-border)] text-[var(--accent)] text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-2 text-center w-10">#</th>
                  <th className="py-2.5 px-2 text-center">i</th>
                  <th className="py-2.5 px-2 text-center">data[i]</th>
                  <th className="py-2.5 px-2 text-center">Operation</th>
                  <th className="py-2.5 px-2 text-center">result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--panel-border)]/40">
                {Array.from({ length: TOTAL_ITERATIONS }).map((_, idx) => {
                  const isPast = idx < completedRows.length;
                  const isActive = idx === currentIteration && !isCompleted;
                  const pastRow = completedRows[idx];

                  return (
                    <tr
                      key={`iter-${idx}`}
                      className={`transition-colors ${
                        isActive
                          ? "bg-[var(--accent)]/10 border-l-2 border-l-[var(--accent)]"
                          : isPast
                          ? "bg-[var(--bg)]/30 text-[var(--text)]"
                          : "text-[var(--text-muted)]/40"
                      }`}
                    >
                      {/* # Number */}
                      <td
                        className={`py-2 px-2 font-bold ${
                          isActive
                            ? "text-[var(--accent)]"
                            : isPast
                            ? "text-[var(--success)]"
                            : "text-[var(--text-muted)]/50"
                        }`}
                      >
                        {idx + 1}
                      </td>

                      {/* i */}
                      <td className="py-2 px-2">
                        {isPast ? (
                          <span className="font-bold text-[var(--text)]">{pastRow.i}</span>
                        ) : isActive ? (
                          <input
                            type="text"
                            inputMode="numeric"
                            value={currentRow.i}
                            onChange={(e) => {
                              setCurrentRow((prev) => ({ ...prev, i: e.target.value.trim() }));
                              setErrorMsg(null);
                            }}
                            placeholder="? ?"
                            {...antiCheatHandlers}
                            autoComplete="off"
                            spellCheck={false}
                            className="w-14 sm:w-16 h-8 text-center bg-[var(--bg)] border border-[var(--accent)] text-[var(--text)] font-bold text-xs focus-visible:outline-2 focus-visible:outline-[var(--accent2)]"
                          />
                        ) : (
                          <span>-</span>
                        )}
                      </td>

                      {/* data[i] */}
                      <td className="py-2 px-2">
                        {isPast ? (
                          <span className="font-bold text-[var(--text)]">{pastRow.dataVal}</span>
                        ) : isActive ? (
                          <input
                            type="text"
                            inputMode="numeric"
                            value={currentRow.dataVal}
                            onChange={(e) => {
                              setCurrentRow((prev) => ({
                                ...prev,
                                dataVal: e.target.value.trim(),
                              }));
                              setErrorMsg(null);
                            }}
                            placeholder="?"
                            {...antiCheatHandlers}
                            autoComplete="off"
                            spellCheck={false}
                            className="w-12 sm:w-14 h-8 text-center bg-[var(--bg)] border border-[var(--accent)] text-[var(--text)] font-bold text-xs focus-visible:outline-2 focus-visible:outline-[var(--accent2)]"
                          />
                        ) : (
                          <span>-</span>
                        )}
                      </td>

                      {/* Operation */}
                      <td className="py-2 px-2">
                        {isPast ? (
                          <span className="font-bold text-[var(--accent)]">{pastRow.op}</span>
                        ) : isActive ? (
                          <select
                            value={currentRow.op}
                            onChange={(e) => {
                              setCurrentRow((prev) => ({ ...prev, op: e.target.value }));
                              setErrorMsg(null);
                            }}
                            className="h-8 px-2 bg-[var(--bg)] border border-[var(--accent)] text-[var(--text)] font-bold text-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--accent2)]"
                          >
                            <option value="">Select ⌵</option>
                            <option value="+">+</option>
                            <option value="-">−</option>
                          </select>
                        ) : (
                          <span>-</span>
                        )}
                      </td>

                      {/* result */}
                      <td className="py-2 px-2">
                        {isPast ? (
                          <span className="font-bold text-[var(--success)]">{pastRow.result}</span>
                        ) : isActive ? (
                          <input
                            type="text"
                            inputMode="numeric"
                            value={currentRow.result}
                            onChange={(e) => {
                              setCurrentRow((prev) => ({
                                ...prev,
                                result: e.target.value.trim(),
                              }));
                              setErrorMsg(null);
                            }}
                            placeholder="?"
                            {...antiCheatHandlers}
                            autoComplete="off"
                            spellCheck={false}
                            className="w-12 sm:w-14 h-8 text-center bg-[var(--bg)] border border-[var(--accent)] text-[var(--text)] font-bold text-xs focus-visible:outline-2 focus-visible:outline-[var(--accent2)]"
                          />
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Right Side: CURRENT STATE, Instructions, Controls (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="text-[var(--accent)] font-bold uppercase text-xs">
              CURRENT STATE
            </div>

            {/* Initial Result & Data Chips */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="border border-[var(--panel-border)] bg-[var(--bg)]/60 p-2.5 text-center">
                <span className="text-[10px] text-[var(--text-muted)] block uppercase">
                  Initial result
                </span>
                <span className="font-bold text-[var(--text)] text-sm">0</span>
              </div>
              <div className="border border-[var(--panel-border)] bg-[var(--bg)]/60 p-2.5 text-center">
                <span className="text-[10px] text-[var(--text-muted)] block uppercase">
                  data list
                </span>
                <span className="font-bold text-[var(--text)] text-[11px] tracking-tight">
                  [4, 7, 2, 9, 5, 8, 3]
                </span>
              </div>
            </div>

            {/* Instruction Checklist */}
            <div className="text-xs space-y-2 text-[var(--text-muted)]">
              <div className="font-semibold text-[var(--text)] flex items-center gap-1.5">
                <span className="text-[var(--accent)]">▶</span>
                <span>
                  {isCompleted
                    ? "All iterations completed!"
                    : `Fill the ${ordinalText(currentIteration)} iteration values:`}
                </span>
              </div>
              <ul className="space-y-1 text-[11px] pl-4 list-disc marker:text-[var(--accent)]">
                <li>
                  <strong className="text-[var(--text)]">i</strong> : index for this iteration
                </li>
                <li>
                  <strong className="text-[var(--text)]">data[i]</strong> : value from the list
                </li>
                <li>
                  <strong className="text-[var(--text)]">Operation</strong> : choose + (add) or − (subtract)
                </li>
                <li>
                  <strong className="text-[var(--text)]">result</strong> : value of result after this iteration
                </li>
              </ul>
            </div>

            {/* Error Message Feedback */}
            {errorMsg && (
              <div className="p-2.5 border border-[var(--danger)]/80 bg-[var(--danger)]/10 text-[var(--danger)] text-xs font-mono animate-in fade-in duration-150">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Completion Banner */}
            {isCompleted && (
              <div className="p-3 border border-[var(--success)]/80 bg-[var(--success)]/10 text-[var(--success)] text-xs font-mono space-y-1 animate-in fade-in duration-200">
                <div className="font-bold tracking-wider uppercase">
                  ✓ ALL 7 ITERATIONS RECONSTRUCTED!
                </div>
                <div>
                  FINAL SCRIPT OUTPUT:{" "}
                  <strong className="text-sm font-bold underline">{finalOutput}</strong>
                </div>
              </div>
            )}

            {/* Action Buttons: SUBMIT & RESET */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSubmitCurrentRow}
                disabled={disabled || isCompleted || isSubmitting}
                className="flex-1 py-2 px-4 bg-[var(--accent)] hover:bg-[var(--accent2)] disabled:opacity-40 text-[var(--bg)] font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-[var(--accent)] active:scale-95"
              >
                {isSubmitting ? "VALIDATING..." : isCompleted ? "COMPLETED" : "SUBMIT"}
              </button>

              <button
                type="button"
                onClick={handleReset}
                disabled={isCompleted}
                className="py-2 px-5 border border-[var(--panel-border)] bg-[var(--bg)]/80 hover:bg-[var(--panel)] text-[var(--text-muted)] hover:text-[var(--text)] font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                RESET
              </button>

              {/* Dev helper to restart if testing */}
              {isCompleted && (
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="py-2 px-3 border border-[var(--panel-border)] text-[10px] text-[var(--text-muted)] hover:text-[var(--warn)] uppercase"
                  title="Re-run tracker from iteration 1"
                >
                  RETRY
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Final Answer Submission Area: Strictly enabled ONLY after filling all 7 iterations */}
      <div className="border border-[var(--panel-border)] bg-[var(--panel)]/70 p-4 sm:p-5 space-y-3 rounded-xs shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-[var(--accent)] tracking-wider uppercase flex items-center gap-1.5">
            <span>⚙</span>
            TERMINAL 02 FINAL OUTPUT SUBMISSION
          </span>
          <span
            className={`text-[10px] tracking-wider uppercase font-semibold ${
              isCompleted ? "text-[var(--success)] font-bold" : "text-[var(--text-muted)]"
            }`}
          >
            {isCompleted
              ? "✓ ALL 7 ITERATIONS COMPLETE — SUBMISSION UNLOCKED"
              : `[LOCKED — COMPLETE ITERATIONS IN TABLE: ${completedRows.length}/7]`}
          </span>
        </div>

        <form onSubmit={handleFinalSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={answerInput}
            onChange={(e) => {
              setAnswerInput(e.target.value.trim());
              setFinalSubmitFeedback(null);
            }}
            placeholder={
              isCompleted
                ? "Enter final output (e.g. -10)"
                : `Locked: Complete all 7 iterations in tracker above (${completedRows.length}/7 filled)`
            }
            disabled={!isCompleted || disabled || isSubmittingFinal}
            {...antiCheatHandlers}
            autoComplete="off"
            spellCheck={false}
            className={`flex-1 bg-[var(--bg)] border px-4 py-2.5 text-xs text-[var(--text)] font-mono tracking-widest placeholder:text-[var(--text-muted)]/40 focus-visible:outline-2 focus-visible:outline-[var(--accent)] rounded-xs transition-all ${
              isCompleted
                ? "border-[var(--accent)] text-[var(--accent)] font-bold shadow-[0_0_10px_var(--accent)/25]"
                : "border-[var(--panel-border)] opacity-40 cursor-not-allowed bg-[var(--bg)]/50"
            }`}
          />
          <button
            type="submit"
            disabled={!isCompleted || disabled || isSubmittingFinal || !answerInput.trim()}
            className={`px-8 py-2.5 font-bold text-xs uppercase tracking-widest transition-all shadow-md rounded-xs ${
              isCompleted
                ? "bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-[var(--bg)] cursor-pointer active:scale-95"
                : "bg-[var(--panel-border)]/50 text-[var(--text-muted)] opacity-40 cursor-not-allowed"
            }`}
          >
            {isSubmittingFinal ? "TRANSMITTING..." : "SUBMIT FINAL OUTPUT"}
          </button>
        </form>

        {finalSubmitFeedback && (
          <div
            role="alert"
            className={`p-2.5 text-xs font-mono tracking-wider uppercase border rounded-xs ${
              finalSubmitFeedback.type === "success"
                ? "border-[var(--success)] bg-[var(--success)]/10 text-[var(--success)]"
                : "border-[var(--danger)] bg-[var(--danger)]/10 text-[var(--danger)]"
            }`}
          >
            {finalSubmitFeedback.message}
          </div>
        )}

        {!isCompleted && (
          <p className="text-[10px] text-[var(--text-muted)]">
            ⓘ Notice: The final output submission text box is locked. You must reconstruct all 7 iterations in the execution tracker above to unlock submission.
          </p>
        )}
      </div>
    </div>
  );
}

export default ScriptRecovery;

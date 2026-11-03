"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { TerminalPanel } from "./TerminalPanel";
import { AnswerInput } from "./AnswerInput";
import { CaseFile, CaseFileItems } from "./CaseFile";
import { ToolErrorBoundary } from "./ToolErrorBoundary";
import { useSound } from "./SoundProvider";
import { RoundDefinition } from "@/rounds/types";

interface QuestionViewProps {
  question: {
    id: string;
    title: string;
    prompt: string;
    answerFormatHint?: string;
    room: {
      id: number;
      location: string;
      connectionStatus: string;
    };
    tool?: {
      type: string;
      data: Record<string, unknown>;
    };
  };
  // Round Framework Props
  roundDef?: RoundDefinition;
  serverProgress?: number;
  caseFile?: CaseFileItems;
  // Squad Co-op Props
  isMyTurn?: boolean;
  activeOperatorName?: string;
  currentRound?: number;
  round5Objective?: string;
  round5SubmittedCount?: number;
  canEndGame?: boolean;
  isLastSubmitter?: boolean;
  onAnswerSubmit: (answer: string) => Promise<{
    correct: boolean;
    feedback?: string;
    reveal?: string | null;
    rateLimitSeconds?: number;
    networkError?: boolean;
    finished?: boolean;
    isLastSubmitter?: boolean;
  }>;
  onAdvanceQuestion: () => void;
  onExecuteEndGame?: () => void;
}

export function QuestionView({
  question,
  roundDef,
  serverProgress = 0,
  caseFile,
  isMyTurn = true,
  activeOperatorName,
  currentRound = 1,
  round5Objective,
  round5SubmittedCount = 0,
  canEndGame = false,
  onAnswerSubmit,
  onAdvanceQuestion,
  onExecuteEndGame,
}: QuestionViewProps) {
  const { play } = useSound();
  const [answer, setAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);
  const [showEndButton, setShowEndButton] = useState(false);
  const [revealState, setRevealState] = useState<{
    active: boolean;
    revealText: string | null;
  } | null>(null);

  // Rate limiting lockout countdown
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setErrorMessage(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  // Reset when question ID changes
  const [prevQuestionId, setPrevQuestionId] = useState(question.id);
  if (prevQuestionId !== question.id) {
    setPrevQuestionId(question.id);
    setAnswer("");
    setErrorMessage(null);
    setRevealState(null);
    setShowEndButton(false);
  }

  const handleSubmit = async () => {
    if (isSubmitting || lockoutSeconds > 0 || !answer.trim() || !isMyTurn) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await onAnswerSubmit(answer.trim());

      if (result.networkError) {
        setErrorMessage("TRANSMISSION FAILED. RETRYING LOCAL BUFFER…");
        setIsSubmitting(false);
        return;
      }

      if (result.rateLimitSeconds && result.rateLimitSeconds > 0) {
        setLockoutSeconds(result.rateLimitSeconds);
        setErrorMessage(
          result.feedback || `SECURITY LOCKOUT: TOO MANY ATTEMPTS. RETRY IN ${result.rateLimitSeconds}s.`
        );
        play("wrong");
        setIsSubmitting(false);
        return;
      }

      if (result.correct) {
        play("correct");
        setErrorMessage(null);

        // Check if finished or is round 5 end condition
        if (result.finished || result.isLastSubmitter) {
          setShowEndButton(true);
        }

        // Show reveal screen if text exists
        if (result.reveal) {
          setRevealState({
            active: true,
            revealText: result.reveal,
          });
        } else {
          // No reveal screen -> advance question immediately
          setAnswer("");
          onAdvanceQuestion();
        }
      } else {
        // Incorrect answer
        play("wrong");
        setErrorMessage(result.feedback || "CREDENTIAL REJECTED. ACCESS DENIED.");
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch {
      setErrorMessage("TRANSMISSION ERROR. VERIFY NETWORK AND RETRY.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    setRevealState(null);
    setAnswer("");
    onAdvanceQuestion();
  };

  const ToolComponent =
    question.tool && roundDef?.toolRegistry
      ? roundDef.toolRegistry[question.tool.type]
      : undefined;

  const hasIntegratedAnswerInput =
    question.tool?.type === "vault_dials" ||
    question.tool?.type === "command_recovery" ||
    question.tool?.type === "timestamp_reconstruction" ||
    question.tool?.type === "access_records" ||
    question.tool?.type === "keyword_recovery" ||
    question.tool?.type === "network_session_filter" ||
    question.tool?.type === "data_reconstruction" ||
    question.tool?.type === "signal" ||
    question.tool?.type === "cipher" ||
    question.tool?.type === "script_recovery";

  const handleToolAnswerSubmit = async (ans: string) => {
    setAnswer(ans);
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const result = await onAnswerSubmit(ans.trim());
      if (result.networkError) {
        setErrorMessage("TRANSMISSION FAILED. RETRYING LOCAL BUFFER…");
        setIsSubmitting(false);
        return result;
      }
      if (result.rateLimitSeconds && result.rateLimitSeconds > 0) {
        setLockoutSeconds(result.rateLimitSeconds);
        setErrorMessage(
          result.feedback || `SECURITY LOCKOUT: TOO MANY ATTEMPTS. RETRY IN ${result.rateLimitSeconds}s.`
        );
        play("wrong");
        setIsSubmitting(false);
        return result;
      }
      if (result.correct) {
        play("correct");
        setErrorMessage(null);
        if (result.finished || result.isLastSubmitter) {
          setShowEndButton(true);
        }
        if (result.reveal) {
          setRevealState({
            active: true,
            revealText: result.reveal,
          });
        } else {
          setAnswer("");
          onAdvanceQuestion();
        }
      } else {
        play("wrong");
        setErrorMessage(result.feedback || "COMMAND NOT RECOGNISED. CHECK THE SHIFT VALUE.");
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
      return result;
    } catch {
      setErrorMessage("TRANSMISSION ERROR. VERIFY NETWORK AND RETRY.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const MonitorWallExtra = roundDef?.extras?.MonitorWall;

  return (
    <TerminalPanel className="w-full max-w-4xl mx-auto my-4">
      {/* Terminal Title Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-[var(--panel-border)] pb-3 mb-6 text-xs text-[var(--text-muted)] uppercase tracking-widest font-mono gap-2">
        <span className="text-[var(--accent)] font-bold flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-[var(--accent)] animate-pulse" />
          {question.title.toUpperCase()}
        </span>

        <span className="text-[var(--text-muted)]/70">{question.room.location}</span>
      </div>

      {/* Atmospheric Power-On Progress Monitor Wall (Driven strictly by server progress) */}
      {MonitorWallExtra && (
        <div className="mb-6">
          <MonitorWallExtra serverProgress={serverProgress} />
        </div>
      )}

      {/* SQUAD CO-OP: OBSERVATION MODE BANNER (When it's not my turn) */}
      {!isMyTurn && (
        <div className="border border-[var(--warn)]/80 bg-[var(--warn)]/10 p-4 font-mono text-xs text-[var(--warn)] tracking-wider uppercase space-y-1 mb-6 rounded-none">
          <div className="flex items-center gap-2 font-bold text-[var(--warn)]">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--warn)] animate-pulse" />
            ACCESS RESTRICTED — THIS IS NOT YOUR TURN
          </div>
          <div className="text-[11px] text-[var(--text)]/80 pt-1">
            SCHEDULED OPERATOR:{" "}
            <strong className="text-[var(--accent)] font-bold">
              {activeOperatorName ?? "Assigned Teammate"}
            </strong>{" "}
            (ROUND {currentRound})
          </div>
          <p className="text-[10px] text-[var(--text-muted)] pt-1">
            OBSERVATION TELEMETRY ACTIVE: You are viewing live terminal data. Communicate with your squad verbally!
          </p>
        </div>
      )}

      {/* ROUND 5 ALL-HANDS-ON-DECK BANNER */}
      {currentRound === 5 && (
        <div className="border border-[var(--accent)]/60 bg-[var(--accent)]/10 p-4 font-mono text-xs text-[var(--accent)] tracking-wider uppercase space-y-2 mb-6">
          <div className="flex flex-wrap items-center justify-between font-bold gap-2">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-ping" />
              ROUND 5: ALL SQUAD AGENTS ACTIVE SIMULTANEOUSLY
            </span>
            <span className="text-[var(--success)] font-bold border border-[var(--success)]/40 px-2 py-0.5 bg-[var(--panel)]">
              SQUAD OBJECTIVES: [{round5SubmittedCount} / 4] SUBMITTED
            </span>
          </div>
          <div className="text-[var(--text)]/80 text-[11px]">
            YOUR DESIGNATED DIRECTIVE:{" "}
            <strong className="text-[var(--accent2)]">
              {round5Objective ? `OBJECTIVE ${round5Objective} : ` : ""}{question.id} — {question.title}
            </strong>
          </div>
        </div>
      )}

      {/* Correct Reveal Screen */}
      {revealState?.active ? (
        <div className="space-y-6 py-4 animate-in fade-in duration-300">
          <div className="border border-[var(--success)]/60 bg-[var(--success)]/10 p-4 text-xs font-bold text-[var(--success)] tracking-widest uppercase">
            ✓ ACCESS GRANTED — CREDENTIAL ACCEPTED
          </div>

          {revealState.revealText && (
            <div className="border border-[var(--panel-border)] bg-[var(--bg)]/80 p-5 font-mono text-sm leading-relaxed text-[var(--text)] whitespace-pre-wrap">
              {revealState.revealText}
            </div>
          )}

          {/* If final objective completed in Round 5, show the glowing End Button */}
          {showEndButton || canEndGame ? (
            <div className="pt-4 text-center">
              <button
                type="button"
                onClick={onExecuteEndGame ?? handleContinue}
                className="w-full py-4 bg-[var(--accent)] hover:bg-[var(--accent2)] text-[var(--bg)] font-mono text-sm font-bold uppercase tracking-[0.25em] shadow-2xl animate-pulse transition-all focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
              >
                [ EXECUTE FINAL SYSTEM REBOOT / END PROTOCOL ]
              </button>
            </div>
          ) : (
            revealState.revealText && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleContinue}
                  className="px-8 py-3 bg-[var(--success)] text-[var(--bg)] font-mono text-xs font-bold uppercase tracking-widest hover:opacity-90 focus-visible:outline-2 focus-visible:outline-[var(--success)] transition-opacity"
                >
                  CONTINUE →
                </button>
              </div>
            )
          )}
        </div>
      ) : (
        /* Question Form */
        <div className="space-y-6">
          {!hasIntegratedAnswerInput && (
            <div
              className="font-mono text-sm sm:text-base leading-relaxed text-[var(--text)] whitespace-pre-wrap bg-[var(--bg)]/50 border border-[var(--panel-border)]/60 p-4 sm:p-6 overflow-x-auto selection:bg-[var(--accent)] selection:text-[var(--bg)]"
              style={{ whiteSpace: "pre-wrap" }}
            >
              {question.prompt}
            </div>
          )}

          {/* Lazy-Loaded Interactive Round Tool (with ToolErrorBoundary & Suspense) */}
          {ToolComponent && question.tool && (
            <ToolErrorBoundary toolName={question.tool.type}>
              <Suspense
                fallback={
                  <div className="p-4 border border-[var(--panel-border)] bg-[var(--bg)]/80 text-xs text-[var(--accent)] animate-pulse rounded-xs my-3 font-mono">
                    [INITIALIZING TOOL TELEMETRY BUFFER...]
                  </div>
                }
              >
                <ToolComponent
                  data={question.tool.data}
                  disabled={!isMyTurn || lockoutSeconds > 0}
                  onAnswerSubmit={hasIntegratedAnswerInput ? handleToolAnswerSubmit : undefined}
                />
              </Suspense>
            </ToolErrorBoundary>
          )}

          {/* Case File Evidence Dossier (Question 1.4 or when caseFile items exist) - strictly for active player */}
          {isMyTurn && caseFile && (question.id.startsWith("1.") || question.room.id === 1) && (
            <CaseFile
              items={caseFile}
              initiallyOpen={question.id === "1.4"}
            />
          )}

          {question.answerFormatHint && !hasIntegratedAnswerInput && (
            <p className="text-xs text-[var(--text-muted)] tracking-wider uppercase font-mono">
              [REQUIRED FORMAT: {question.answerFormatHint}]
            </p>
          )}

          {/* Answer Input (Omitted if tool has integrated answer input) */}
          {!hasIntegratedAnswerInput && (
            <motion.div
              animate={shake ? { x: [-6, 6, -4, 4, -2, 2, 0] } : {}}
              transition={{ duration: 0.4 }}
            >
              <AnswerInput
                value={answer}
                onChange={setAnswer}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                isDisabled={!isMyTurn || lockoutSeconds > 0}
                placeholder={
                  !isMyTurn
                    ? `TERMINAL LOCKED TO OPERATOR: ${activeOperatorName ?? "TEAMMATE"}`
                    : lockoutSeconds > 0
                    ? `TERMINAL LOCKED (${lockoutSeconds}s)`
                    : question.answerFormatHint
                    ? `FORMAT: ${question.answerFormatHint}`
                    : "ENTER ANSWER"
                }
              />
            </motion.div>
          )}

          {errorMessage && (
            <div
              role="alert"
              aria-live="polite"
              className="text-xs text-[var(--danger)] font-mono tracking-wider uppercase flex items-center gap-2 pt-1"
            >
              <span className="inline-block w-1.5 h-1.5 bg-[var(--danger)]" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}
    </TerminalPanel>
  );
}

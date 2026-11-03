"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSound } from "./SoundProvider";
import { SceneImage } from "./SceneImage";

export interface StoryOverlayData {
  id: string; // e.g. "prologue", "room_1_entrance", "room_1_discovery", "final_cinematic"
  type: "prologue" | "room_entrance" | "discovery" | "final_cinematic";
  title: string;
  narratorText?: string;
  bodyText?: string;
  imageKey?: string;
  imageSrc?: string;
  overlayLines?: string[];
  transitionText?: string;
}

interface StoryOverlayProps {
  data: StoryOverlayData;
  onDismiss: () => void;
}

export function StoryOverlay({ data, onDismiss }: StoryOverlayProps) {
  const { play } = useSound();
  const [displayedTextLength, setDisplayedTextLength] = useState<number>(0);
  const [isFinishedTyping, setIsFinishedTyping] = useState<boolean>(() => {
    if (data.type === "final_cinematic") {
      return !data.overlayLines || data.overlayLines.length === 0;
    }
    return !data.narratorText && !data.bodyText && !data.transitionText;
  });
  const [cinematicLineIndex, setCinematicLineIndex] = useState<number>(0);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Combine narrator + body text
  const fullText = [data.narratorText, data.bodyText, data.transitionText]
    .filter(Boolean)
    .join("\n\n");

  const skipTypewriter = useCallback(() => {
    if (data.type === "final_cinematic") {
      setCinematicLineIndex((data.overlayLines?.length || 1) - 1);
    } else {
      setDisplayedTextLength(fullText.length);
    }
    setIsFinishedTyping(true);
  }, [data.type, data.overlayLines, fullText.length]);

  useEffect(() => {
    play(
      data.type === "room_entrance"
        ? "room-enter"
        : data.type === "final_cinematic"
        ? "final"
        : "message"
    );
  }, [data.type, play]);

  // Trap focus
  useEffect(() => {
    dialogRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disallow closing via Escape
      if (e.key === "Escape") {
        e.preventDefault();
        return;
      }
      // Any key skips typewriter
      if (!isFinishedTyping && e.key !== "Tab") {
        skipTypewriter();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFinishedTyping, skipTypewriter]);

  // Typewriter effect
  useEffect(() => {
    if (data.type === "final_cinematic") {
      if (!data.overlayLines || data.overlayLines.length === 0) {
        return;
      }
      const interval = setInterval(() => {
        setCinematicLineIndex((prev) => {
          if (prev >= (data.overlayLines?.length || 1) - 1) {
            clearInterval(interval);
            setIsFinishedTyping(true);
            return prev;
          }
          return prev + 1;
        });
      }, 700);
      return () => clearInterval(interval);
    }

    // Standard text typewriter
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion || !fullText) {
      const skipTimer = setTimeout(skipTypewriter, 0);
      return () => clearTimeout(skipTimer);
    }

    const interval = setInterval(() => {
      setDisplayedTextLength((prev) => {
        if (prev >= fullText.length) {
          clearInterval(interval);
          setIsFinishedTyping(true);
          return prev;
        }
        return Math.min(prev + 3, fullText.length);
      });
    }, 15);

    return () => clearInterval(interval);
  }, [fullText, data.type, data.overlayLines, skipTypewriter]);

  const isFinal = data.type === "final_cinematic";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={data.title}
      ref={dialogRef}
      tabIndex={-1}
      onClick={skipTypewriter}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none ${
        isFinal ? "bg-black" : "bg-[var(--bg)]/90 backdrop-blur-md"
      }`}
    >
      <div
        className={`w-full max-w-3xl border ${
          isFinal
            ? "border-[var(--danger)]/50 bg-black/95 text-[var(--danger)]"
            : "border-[var(--panel-border)] bg-[var(--panel)]/95 text-[var(--text)]"
        } p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto font-mono text-xs sm:text-sm transition-colors duration-300`}
        style={{
          boxShadow: isFinal
            ? "0 0 30px rgba(255, 45, 61, 0.25)"
            : "0 0 var(--theme-glow-radius, 12px) var(--accent)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-[var(--panel-border)]/50 pb-3 mb-6 tracking-widest uppercase text-xs opacity-80">
          <span>{data.title}</span>
          <span className="text-[var(--accent)] animate-pulse">● TRANSMISSION ACTIVE</span>
        </div>

        {/* Room Entrance or Prologue Scene Image */}
        {(data.type === "room_entrance" || data.type === "prologue") && (
          <SceneImage
            sceneKey={data.imageKey || (data.type === "prologue" ? "prologue" : undefined)}
            title={data.title}
            priority={true}
            className="mb-6"
          />
        )}

        {/* Final Cinematic Overlay Display */}
        {isFinal ? (
          <div className="space-y-4 py-8 text-center font-mono">
            {data.overlayLines?.slice(0, cinematicLineIndex + 1).map((line, idx) => (
              <p
                key={idx}
                className={`tracking-widest uppercase ${
                  line.includes("WRONG SUBJECT")
                    ? "text-base sm:text-lg font-bold text-[var(--danger)] animate-pulse"
                    : "text-xs sm:text-sm text-[var(--text-muted)]"
                }`}
              >
                {line}
              </p>
            ))}
          </div>
        ) : (
          /* Standard Story Monospace Content */
          <div className="leading-relaxed whitespace-pre-wrap font-mono text-[var(--text)] space-y-4">
            <p>{fullText.slice(0, displayedTextLength)}</p>
            {!isFinishedTyping && (
              <span className="inline-block w-2 h-4 bg-[var(--accent)] animate-pulse align-middle ml-1" />
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-8 pt-4 border-t border-[var(--panel-border)]/50 flex items-center justify-between">
          <span className="text-xs text-[var(--text-muted)]/70 tracking-wider">
            {!isFinishedTyping ? "[CLICK ANYWHERE TO SKIP]" : "[TRANSMISSION COMPLETE]"}
          </span>

          {isFinishedTyping && (
            <button
              type="button"
              onClick={onDismiss}
              className={`px-6 py-2.5 font-mono text-xs font-bold uppercase tracking-widest border transition-all ${
                isFinal
                  ? "bg-[var(--danger)] text-black border-[var(--danger)] hover:bg-[var(--danger)]/80 focus-visible:outline-2 focus-visible:outline-[var(--danger)]"
                  : "bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
              }`}
            >
              CONTINUE →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

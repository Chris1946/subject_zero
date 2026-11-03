"use client";

import React, { useRef, useEffect } from "react";
import { useSound } from "./SoundProvider";

interface AnswerInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  isDisabled: boolean;
  placeholder?: string;
  buttonLabel?: string;
}

export function AnswerInput({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  isDisabled,
  placeholder = "ENTER CREDENTIAL / RESPONSE",
  buttonLabel = "SUBMIT",
}: AnswerInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { play } = useSound();

  useEffect(() => {
    if (!isDisabled && !isSubmitting) {
      inputRef.current?.focus();
    }
  }, [isDisabled, isSubmitting]);

  // Warn with beforeunload only while an answer input has unsaved text
  useEffect(() => {
    if (!value.trim()) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    play("typing");
    onChange(val);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDisabled && !isSubmitting && value.trim()) {
      onSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col sm:flex-row gap-3 pt-2">
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          value={value}
          maxLength={200}
          disabled={isDisabled || isSubmitting}
          onChange={handleChange}
          placeholder={placeholder}
          // Input font size >= 16px (text-base) on mobile to prevent iOS zoom, touch target >= 44px
          className="w-full min-h-[44px] bg-[var(--bg)] border border-[var(--panel-border)] px-4 py-3 font-mono text-base sm:text-sm tracking-widest text-[var(--text)] uppercase placeholder:text-[var(--text-muted)]/50 focus-visible:outline-2 focus-visible:outline-[var(--accent)] disabled:opacity-50 disabled:cursor-not-allowed selection:bg-[var(--accent)] selection:text-[var(--bg)] transition-colors"
          style={{
            boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5)",
          }}
          aria-label="Terminal response input"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
        />
      </div>

      <button
        type="submit"
        disabled={isDisabled || isSubmitting || !value.trim()}
        // Minimum touch target >= 44px
        className="min-h-[44px] min-w-[44px] px-6 py-3 bg-[var(--panel)] border border-[var(--accent)]/60 hover:bg-[var(--accent)] hover:text-[var(--bg)] text-[var(--accent)] font-mono text-xs font-bold uppercase tracking-widest transition-all duration-200 focus-visible:outline-2 focus-visible:outline-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[var(--panel)] disabled:hover:text-[var(--accent)] active:scale-[0.98]"
        style={{
          boxShadow: !isDisabled && value.trim() ? "0 0 10px var(--accent)" : "none",
        }}
      >
        {isSubmitting ? "PROCESSING..." : buttonLabel}
      </button>
    </form>
  );
}

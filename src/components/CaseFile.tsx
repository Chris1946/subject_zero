"use client";

import React, { useState } from "react";

export interface CaseFileItems {
  projectIdentifier?: string | null;
  processId?: string | null;
  signature?: string | null;
}

interface CaseFileProps {
  items: CaseFileItems;
  initiallyOpen?: boolean;
  className?: string;
}

export function CaseFile({
  items,
  initiallyOpen = true,
  className = "",
}: CaseFileProps) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);

  const solvedCount = [
    items.projectIdentifier,
    items.processId,
    items.signature,
  ].filter(Boolean).length;

  return (
    <div
      className={`border border-[var(--panel-border)] bg-[var(--bg)]/90 font-mono text-xs shadow-xl transition-all rounded-xs overflow-hidden ${className}`}
    >
      {/* Header bar with toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="case-file-content"
        className="w-full min-h-[44px] px-3.5 py-2.5 bg-[var(--panel)]/70 hover:bg-[var(--panel)] flex items-center justify-between text-left text-[11px] text-[var(--accent)] font-bold tracking-widest uppercase transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
          <span>CASE FILE // EVIDENCE DOSSIER</span>
          <span className="text-[10px] text-[var(--text-muted)] font-normal">
            [{solvedCount} / 3 RECOVERED]
          </span>
        </div>
        <span className="text-[var(--text-muted)] text-xs">
          {isOpen ? "▲ [HIDE]" : "▼ [EXPAND]"}
        </span>
      </button>

      {/* Collapsible dossier content */}
      {isOpen && (
        <div
          id="case-file-content"
          className="p-3.5 sm:p-4 space-y-3 border-t border-[var(--panel-border)]/60 text-xs"
        >
          <div className="text-[10px] text-[var(--text-muted)] tracking-wider uppercase mb-1">
            RECOVERED DOSSIER TELEMETRY (VERIFIED ON CONTAINMENT SERVER):
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 1. Project Identifier */}
            <div className="p-2.5 bg-[var(--panel)]/40 border border-[var(--panel-border)] rounded-xs space-y-1">
              <span className="text-[9px] text-[var(--text-muted)] uppercase block font-semibold">
                PROJECT IDENTIFIER (1.1)
              </span>
              {items.projectIdentifier ? (
                <span className="text-sm font-bold text-[var(--accent)] tracking-widest block font-mono">
                  {items.projectIdentifier}
                </span>
              ) : (
                <span className="text-[11px] text-[var(--text-muted)]/40 italic block tracking-wider">
                  [REDACTED / UNSOLVED]
                </span>
              )}
            </div>

            {/* 2. Process ID */}
            <div className="p-2.5 bg-[var(--panel)]/40 border border-[var(--panel-border)] rounded-xs space-y-1">
              <span className="text-[9px] text-[var(--text-muted)] uppercase block font-semibold">
                PROCESS ID (1.2)
              </span>
              {items.processId ? (
                <span className="text-sm font-bold text-[var(--accent)] tracking-widest block font-mono">
                  {items.processId}
                </span>
              ) : (
                <span className="text-[11px] text-[var(--text-muted)]/40 italic block tracking-wider">
                  [REDACTED / UNSOLVED]
                </span>
              )}
            </div>

            {/* 3. Authentication Signature */}
            <div className="p-2.5 bg-[var(--panel)]/40 border border-[var(--panel-border)] rounded-xs space-y-1">
              <span className="text-[9px] text-[var(--text-muted)] uppercase block font-semibold">
                AUTH SIGNATURE (1.3)
              </span>
              {items.signature ? (
                <span className="text-sm font-bold text-[var(--accent)] tracking-widest block font-mono">
                  {items.signature}
                </span>
              ) : (
                <span className="text-[11px] text-[var(--text-muted)]/40 italic block tracking-wider">
                  [REDACTED / UNSOLVED]
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CaseFile;

"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  toolName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ToolErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ToolErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 border border-[var(--warn)]/60 bg-[var(--warn)]/10 text-xs font-mono text-[var(--warn)] space-y-1 rounded-xs my-3">
          <div className="font-bold flex items-center gap-2">
            <span>⚠ TOOL UNAVAILABLE // FALLBACK MODE ACTIVE</span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)]">
            The interactive {this.props.toolName || "tool"} encountered a render fault. Terminal input remains fully operational below.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ToolErrorBoundary;

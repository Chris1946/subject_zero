import React from "react";
import { ThemeId } from "@/theme/rounds";

export type ToolType = string;

export interface ToolProps<T = unknown> {
  data?: T;
  disabled?: boolean;
  onAction?: (action: string, payload?: unknown) => void;
  onAnswerSubmit?: (answer: string) => Promise<unknown> | void;
  className?: string;
  [key: string]: unknown;
}

export interface RoundDefinition {
  id: number;
  themeKey: ThemeId;
  Scene: React.ComponentType<{ imageSrc?: string; className?: string }>;
  toolRegistry: Record<
    ToolType,
    | React.LazyExoticComponent<React.ComponentType<ToolProps<unknown>>>
    | React.ComponentType<ToolProps<unknown>>
  >;
  extras?: Record<string, React.ComponentType<{ serverProgress?: number; [key: string]: unknown }>>;
}

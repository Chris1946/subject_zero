"use client";

import React from "react";
import { ROUND_THEMES, ThemeId, getThemeGradientCss } from "@/theme/rounds";

interface ThemeBackgroundProps {
  currentThemeId: ThemeId;
  reducedMotion?: boolean;
}

export function ThemeBackground({ currentThemeId, reducedMotion = false }: ThemeBackgroundProps) {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {(Object.keys(ROUND_THEMES) as ThemeId[]).map((id) => {
        const theme = ROUND_THEMES[id];
        const isActive = id === currentThemeId;
        return (
          <div
            key={id}
            className={`theme-bg-layer absolute inset-0 ${
              reducedMotion
                ? isActive
                  ? "opacity-100"
                  : "opacity-0"
                : "transition-opacity duration-[1200ms] ease-in-out"
            } ${isActive ? "opacity-100" : "opacity-0"}`}
            style={{
              background: getThemeGradientCss(theme),
            }}
          />
        );
      })}
    </div>
  );
}

export default ThemeBackground;

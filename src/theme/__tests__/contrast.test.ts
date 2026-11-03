import { describe, it, expect } from "vitest";
import { ROUND_THEMES, ThemeId } from "../rounds";

function sRGBtoLin(c: number): number {
  c = c / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function getLuminance(hex: string): number {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return 0.2126 * sRGBtoLin(r) + 0.7152 * sRGBtoLin(g) + 0.0722 * sRGBtoLin(b);
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("WCAG Contrast & Theme Quality Gates", () => {
  const themeIds = Object.keys(ROUND_THEMES) as ThemeId[];

  it.each(themeIds)("Theme [%s]: body text on panel must have >= 4.5:1 contrast", (id) => {
    const theme = ROUND_THEMES[id];
    const ratio = getContrastRatio(theme.text, theme.panel);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it.each(themeIds)("Theme [%s]: muted text on panel must have >= 4.5:1 contrast", (id) => {
    const theme = ROUND_THEMES[id];
    const ratio = getContrastRatio(theme.textMuted, theme.panel);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it.each(themeIds)("Theme [%s]: accent on panel must have >= 3.0:1 contrast for UI components", (id) => {
    const theme = ROUND_THEMES[id];
    const ratio = getContrastRatio(theme.accent, theme.panel);
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });

  it.each(themeIds)("Theme [%s]: danger text on panel must have >= 4.5:1 contrast", (id) => {
    const theme = ROUND_THEMES[id];
    const ratio = getContrastRatio(theme.danger, theme.panel);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it.each(themeIds)("Theme [%s]: success text on panel must have >= 4.5:1 contrast", (id) => {
    const theme = ROUND_THEMES[id];
    const ratio = getContrastRatio(theme.success, theme.panel);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("every theme defines a valid backdrop type", () => {
    const validBackdrops = [
      "crt-grid",
      "data-rain",
      "pulse-core",
      "dossier-dust",
      "emergency-pulse",
      "lobby-fog",
    ];
    for (const theme of Object.values(ROUND_THEMES)) {
      expect(validBackdrops).toContain(theme.backdrop);
    }
  });

  it("every theme defines flickerLevel between 0 and 3", () => {
    for (const theme of Object.values(ROUND_THEMES)) {
      expect(theme.effects.flickerLevel).toBeGreaterThanOrEqual(0);
      expect(theme.effects.flickerLevel).toBeLessThanOrEqual(3);
    }
  });
});

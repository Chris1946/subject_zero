import { describe, it, expect } from "vitest";
import { ROUND_THEMES, ThemeId } from "../rounds";

// WCAG relative luminance calculation helper
function getLuminance(hex: string): number {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (brighter + 0.05) / (darker + 0.05);
}

describe("Theme Accessibility & Quality Gates", () => {
  const themeIds = Object.keys(ROUND_THEMES) as ThemeId[];

  describe("Focus Ring Contrast (>= 3:1 for all interactive controls)", () => {
    themeIds.forEach((id) => {
      const theme = ROUND_THEMES[id];
      it(`theme [${id}] has accent focus ring with >= 3:1 contrast against panel`, () => {
        const ratio = getContrastRatio(theme.accent, theme.panel);
        expect(
          ratio,
          `Theme ${id} focus ring contrast (${ratio.toFixed(2)}:1) must be >= 3:1 against panel`
        ).toBeGreaterThanOrEqual(3.0);
      });
    });
  });

  describe("Flash & Flicker Safety (WCAG 2.3.1: <= 3 flashes per second)", () => {
    themeIds.forEach((id) => {
      const theme = ROUND_THEMES[id];
      it(`theme [${id}] flicker effect satisfies safe seizure prevention limits`, () => {
        // flickerLevel ranges 0 to 3:
        // level 0: none
        // level 3: at most once per 25 seconds, never more than 3 per second
        expect(theme.effects.flickerLevel).toBeGreaterThanOrEqual(0);
        expect(theme.effects.flickerLevel).toBeLessThanOrEqual(3);
      });

      it(`theme [${id}] scanline and grain opacity are restrained (< 0.25)`, () => {
        expect(theme.effects.scanlineOpacity).toBeLessThan(0.25);
        expect(theme.effects.grainOpacity).toBeLessThan(0.1);
      });
    });
  });

  describe("Backdrop Types and Config Integrity", () => {
    const validBackdrops = [
      "crt-grid",
      "data-rain",
      "pulse-core",
      "dossier-dust",
      "emergency-pulse",
      "lobby-fog",
    ];

    themeIds.forEach((id) => {
      const theme = ROUND_THEMES[id];
      it(`theme [${id}] uses a valid, GPU-friendly backdrop type`, () => {
        expect(validBackdrops).toContain(theme.backdrop);
      });

      it(`theme [${id}] defines complete color tokens with valid hex strings`, () => {
        const hexRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
        expect(theme.panel).toMatch(hexRegex);
        expect(theme.panelBorder).toMatch(hexRegex);
        expect(theme.text).toMatch(hexRegex);
        expect(theme.textMuted).toMatch(hexRegex);
        expect(theme.accent).toMatch(hexRegex);
        expect(theme.accent2).toMatch(hexRegex);
        expect(theme.warn).toMatch(hexRegex);
        expect(theme.danger).toMatch(hexRegex);
        expect(theme.success).toMatch(hexRegex);
      });
    });
  });
});

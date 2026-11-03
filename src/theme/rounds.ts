export type ThemeId = "lobby" | "round1" | "round2" | "round3" | "round4" | "round5";

export type BackdropType =
  | "crt-grid"
  | "data-rain"
  | "pulse-core"
  | "dossier-dust"
  | "emergency-pulse"
  | "lobby-fog";

export interface ThemeEffects {
  scanlineOpacity: number;
  vignetteStrength: number;
  grainOpacity: number;
  fogOpacity: number;
  flickerLevel: 0 | 1 | 2 | 3;
  glowRadius: string;
}

export interface BgGradient {
  angle: string;
  stops: [string, string, string?];
}

export interface RoundTheme {
  id: ThemeId;
  name: string;
  roomName: string;
  bgGradient: BgGradient;
  panel: string;
  panelBorder: string;
  text: string;
  textMuted: string;
  accent: string;
  accent2: string;
  warn: string;
  danger: string;
  success: string;
  effects: ThemeEffects;
  backdrop: BackdropType;
}

export const ROUND_THEMES: Record<ThemeId, RoundTheme> = {
  lobby: {
    id: "lobby",
    name: "Lobby & Assembly",
    roomName: "Facility Quarantine Entrance",
    bgGradient: {
      angle: "135deg",
      stops: ["#07080c", "#151a2b"],
    },
    panel: "#0b0f1a",
    panelBorder: "#1f283d",
    text: "#e8edf8",
    textMuted: "#9aa8c2",
    accent: "#6fa8dc",
    accent2: "#93c5fd",
    warn: "#ff7a1a",
    danger: "#ff5c6a",
    success: "#4ade80",
    effects: {
      scanlineOpacity: 0.08,
      vignetteStrength: 0.55,
      grainOpacity: 0.03,
      fogOpacity: 0.3,
      flickerLevel: 0,
      glowRadius: "10px",
    },
    backdrop: "lobby-fog",
  },
  round1: {
    id: "round1",
    name: "Round 1",
    roomName: "Sub-Basement Archive & Monitoring",
    bgGradient: {
      angle: "135deg",
      stops: ["#04141c", "#0b2a35"],
    },
    panel: "#07161f",
    panelBorder: "#163847",
    text: "#e8edf2",
    textMuted: "#94a9b8",
    accent: "#3ee6c8",
    accent2: "#7fffd4",
    warn: "#ff7a1a",
    danger: "#ff5c6a",
    success: "#3ee6c8",
    effects: {
      scanlineOpacity: 0.12,
      vignetteStrength: 0.65,
      grainOpacity: 0.04,
      fogOpacity: 0.15,
      flickerLevel: 1,
      glowRadius: "12px",
    },
    backdrop: "crt-grid",
  },
  round2: {
    id: "round2",
    name: "Round 2",
    roomName: "Network Operations & Containment Monitoring",
    bgGradient: {
      angle: "140deg",
      stops: ["#0d0620", "#2a0f5c"],
    },
    panel: "#120826",
    panelBorder: "#381775",
    text: "#f1ebfc",
    textMuted: "#b1a2ce",
    accent: "#c084fc",
    accent2: "#ff2bd6",
    warn: "#ffb347",
    danger: "#ff5c8a",
    success: "#4ade80",
    effects: {
      scanlineOpacity: 0.14,
      vignetteStrength: 0.7,
      grainOpacity: 0.035,
      fogOpacity: 0.2,
      flickerLevel: 1,
      glowRadius: "14px",
    },
    backdrop: "data-rain",
  },
  round3: {
    id: "round3",
    name: "Round 3",
    roomName: "Central AI Core & Chief Analyst Desk",
    bgGradient: {
      angle: "135deg",
      stops: ["#021a0c", "#0a3d1f"],
    },
    panel: "#041d0e",
    panelBorder: "#124e29",
    text: "#ebfdf2",
    textMuted: "#93c2a4",
    accent: "#7dffb0",
    accent2: "#c8ffd9",
    warn: "#ff7a1a",
    danger: "#ff5c6a",
    success: "#7dffb0",
    effects: {
      scanlineOpacity: 0.1,
      vignetteStrength: 0.75,
      grainOpacity: 0.04,
      fogOpacity: 0.25,
      flickerLevel: 2,
      glowRadius: "15px",
    },
    backdrop: "pulse-core",
  },
  round4: {
    id: "round4",
    name: "Round 4",
    roomName: "Classified Archive & Mainframe Crypt",
    bgGradient: {
      angle: "135deg",
      stops: ["#1a0f05", "#3a2008"],
    },
    panel: "#1f1307",
    panelBorder: "#4a2a11",
    text: "#fdf6ee",
    textMuted: "#c4ad95",
    accent: "#ffb020",
    accent2: "#b57cff",
    warn: "#ff7a1a",
    danger: "#ff5c5c",
    success: "#4ade80",
    effects: {
      scanlineOpacity: 0.08,
      vignetteStrength: 0.8,
      grainOpacity: 0.05,
      fogOpacity: 0.2,
      flickerLevel: 1,
      glowRadius: "12px",
    },
    backdrop: "dossier-dust",
  },
  round5: {
    id: "round5",
    name: "Round 5",
    roomName: "Cold Storage Containment Chamber",
    bgGradient: {
      angle: "140deg",
      stops: ["#120305", "#3b0710"],
    },
    panel: "#1c050a",
    panelBorder: "#4d0e19",
    text: "#fdeeed",
    textMuted: "#caa0a4",
    accent: "#ff4d5e",
    accent2: "#e8f4ff",
    warn: "#ffb020",
    danger: "#ff4d5e",
    success: "#4ade80",
    effects: {
      scanlineOpacity: 0.16,
      vignetteStrength: 0.85,
      grainOpacity: 0.055,
      fogOpacity: 0.35,
      flickerLevel: 3,
      glowRadius: "16px",
    },
    backdrop: "emergency-pulse",
  },
};

/**
 * Maps a numeric round (1-5), null/undefined, or "lobby" to the corresponding typed theme.
 */
export function getThemeForRound(round?: number | ThemeId | null): RoundTheme {
  if (!round || round === "lobby") return ROUND_THEMES.lobby;
  if (typeof round === "string" && round in ROUND_THEMES) {
    return ROUND_THEMES[round as ThemeId];
  }
  const roundNum = Number(round);
  switch (roundNum) {
    case 1:
      return ROUND_THEMES.round1;
    case 2:
      return ROUND_THEMES.round2;
    case 3:
      return ROUND_THEMES.round3;
    case 4:
      return ROUND_THEMES.round4;
    case 5:
      return ROUND_THEMES.round5;
    default:
      return ROUND_THEMES.lobby;
  }
}

/**
 * Returns CSS string for a theme's background linear gradient.
 */
export function getThemeGradientCss(theme: RoundTheme): string {
  const { angle, stops } = theme.bgGradient;
  return `linear-gradient(${angle}, ${stops.filter(Boolean).join(", ")})`;
}

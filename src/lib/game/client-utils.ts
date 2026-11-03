export interface ClientGameState {
  gameStatus: "waiting" | "running" | "paused" | "ended";
  gameStartedAt: string | null;
  pausedTotalSeconds: number;
  serverTime: string;
  teamId: string;
  teamName: string;
  progress: number;
  currentQuestion: {
    id: string;
    title: string;
    prompt: string;
    answerFormatHint?: string;
    room: {
      id: number;
      location: string;
      connectionStatus: string;
    };
    index: number;
    total: number;
    tool?: {
      type: string;
      data: Record<string, unknown>;
    };
  } | null;
  unlockedStory: {
    prologue: {
      connectionStatus: string;
      briefing: string;
      sidebarMessages: string[];
      transitionToRound1: string;
    };
    rooms: Array<{
      id: number;
      location: string;
      connectionStatus: string;
      entranceImageKey: string;
      entranceMessage: string;
      entrySidebarMessage: string;
      isCompleted: boolean;
      discoveryFile?: string;
      afterDiscoverySidebarMessage?: string;
      transitionToNextRoom?: string;
    }>;
    reveals: Array<{
      questionId: string;
      reveal: string;
    }>;
    finalCinematic?: {
      narratorText: string;
      overlayLines: string[];
    };
  } | null;
  caseFile?: {
    projectIdentifier?: string | null;
    processId?: string | null;
    signature?: string | null;
  };
  toolsEnabled?: boolean;
  finished: boolean;
  teamStartedAt?: string | null;
  teamFinishedAt?: string | null;
  // Squad Co-op metadata
  joinCode?: string;
  inLobby?: boolean;
  currentRound?: number;
  roundStarted?: boolean;
  roundRemainingSeconds?: number;
  roundDurationSeconds?: number;
  roundEffectiveBudgetSeconds?: number;
  roundIncomingDebtSeconds?: number;
  isOvertime?: boolean;
  overtimeSeconds?: number;
  maxOvertimeSeconds?: number;
  activeOperator?: { id?: string; name: string; round: number } | null;
  isMyTurn?: boolean;
  currentMember?: { id: string; name: string; email: string; member_index: number } | null;
  members?: Array<{
    id: string;
    member_index: number;
    name: string;
    email: string;
    assigned_round: number;
    is_connected: boolean;
    round5_submitted?: boolean;
    round5_question_id?: string;
  }>;
  round5Objective?: string;
  round5Submitted?: boolean;
  round5SubmittedCount?: number;
  allRound5Submitted?: boolean;
  canEndGame?: boolean;
  roundBreakdown?: Array<{ round: number; durationSeconds: number; formattedTime: string }>;
  totalDurationFormatted?: string;
  recoveredAnswers?: Array<{
    questionId: string;
    roundNumber: number;
    questionIndexInRound: number;
    title: string;
    answer: string;
    revealText?: string;
  }>;
  round5ReadyMemberIds?: string[];
  round5Authorized?: boolean;
}

/**
 * Parses "HH:MM:SS" into total seconds since midnight.
 */
export function parseTimeToSeconds(timeStr: string): number {
  const parts = timeStr.split(":").map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some(isNaN)) {
    return 85636; // 23:47:16 fallback
  }
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

/**
 * Formats seconds since midnight into "HH:MM:SS".
 */
export function formatSecondsToTime(totalSeconds: number): string {
  const normalized = ((Math.floor(totalSeconds) % 86400) + 86400) % 86400;
  const hours = Math.floor(normalized / 3600);
  const minutes = Math.floor((normalized % 3600) / 60);
  const seconds = normalized % 60;
  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    seconds.toString().padStart(2, "0"),
  ].join(":");
}

/**
 * Computes official in-game clock based on server offset, elapsed game time, and paused time.
 * Base time defaults to 23:47:16.
 */
export function computeInGameClock(options: {
  gameStartedAt: string | null;
  pausedTotalSeconds: number;
  serverTime: string;
  clientReceivedTimeMs: number;
  currentClientTimeMs?: number;
  isPaused?: boolean;
  baseTime?: string;
}): string {
  const baseSeconds = parseTimeToSeconds(options.baseTime ?? "23:47:16");

  if (!options.gameStartedAt) {
    return formatSecondsToTime(baseSeconds);
  }

  const serverTimeMs = new Date(options.serverTime).getTime();
  const clockOffsetMs = serverTimeMs - options.clientReceivedTimeMs;
  const nowMs = options.isPaused
    ? serverTimeMs
    : (options.currentClientTimeMs ?? Date.now()) + clockOffsetMs;
  const startMs = new Date(options.gameStartedAt).getTime();

  const elapsedRawSeconds = Math.max(0, Math.floor((nowMs - startMs) / 1000));
  const activeElapsedSeconds = Math.max(
    0,
    elapsedRawSeconds - (options.pausedTotalSeconds || 0)
  );

  return formatSecondsToTime(baseSeconds + activeElapsedSeconds);
}

/**
 * Deterministic PRNG based on Mulberry32 for repeatable degradation.
 */
function mulberry32(a: number): () => number {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Degrades message text subtly based on connection status.
 * - Deterministic for a given (text, status, seed)
 * - Safe: never alters more than 8% of characters
 * - Never alters whitespace or important formatting
 */
export function degradeMessageText(
  text: string,
  connectionStatus: string,
  seed = 42
): string {
  let dropRate = 0;
  switch (connectionStatus) {
    case "DEGRADED":
      dropRate = 0.02;
      break;
    case "MEMORY FAILURE":
      dropRate = 0.04;
      break;
    case "CRITICAL":
      dropRate = 0.06;
      break;
    case "CONNECTION CRITICAL":
      dropRate = 0.08;
      break;
    case "UNSTABLE":
    default:
      dropRate = 0;
      break;
  }

  if (dropRate === 0 || text.length <= 4) {
    return text;
  }

  const rand = mulberry32(seed + text.length);
  const chars = text.split("");
  const glitchGlyphs = [".", "_", "·", "?", " "];
  let droppedCount = 0;
  const maxDrops = Math.floor(chars.length * 0.08); // hard cap at 8%

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    // Preserve whitespace, linebreaks, and numbers
    if (ch === " " || ch === "\n" || (ch >= "0" && ch <= "9")) {
      continue;
    }

    if (rand() < dropRate && droppedCount < maxDrops) {
      chars[i] = glitchGlyphs[Math.floor(rand() * glitchGlyphs.length)];
      droppedCount++;
    }
  }

  return chars.join("");
}

/**
 * LocalStorage helpers for tracking seen story elements per team.
 */
export function getSeenStoryIds(teamId: string): Set<string> {
  if (typeof window === "undefined" || !teamId) {
    return new Set<string>();
  }
  try {
    const raw = window.localStorage.getItem(`sz_seen_${teamId}`);
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw);
    return new Set<string>(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set<string>();
  }
}

export function markStoryIdSeen(teamId: string, id: string): void {
  if (typeof window === "undefined" || !teamId || !id) {
    return;
  }
  try {
    const seen = getSeenStoryIds(teamId);
    seen.add(id);
    window.localStorage.setItem(
      `sz_seen_${teamId}`,
      JSON.stringify(Array.from(seen))
    );
  } catch {
    // Ignore storage quota errors
  }
}

import "server-only";
import crypto from "node:crypto";

export type GameStatus = "waiting" | "running" | "paused" | "ended";
export type AdminGameAction = "start" | "pause" | "resume" | "end" | "reset";

export interface GameStateRecord {
  id: number;
  status: GameStatus;
  started_at: string | null;
  paused_at: string | null;
  paused_total_seconds: number;
}

export interface TransitionResult {
  valid: boolean;
  error?: string;
  nextStatus?: GameStatus;
  nextState?: Partial<GameStateRecord>;
  additionalPausedSeconds?: number;
}

/**
 * Pure state machine transition evaluator for game control.
 */
export function evaluateGameTransition(
  currentStatus: GameStatus,
  action: AdminGameAction,
  options?: {
    confirm?: string;
    now?: Date;
    pausedAt?: string | null;
  }
): TransitionResult {
  const now = options?.now ?? new Date();

  switch (action) {
    case "start":
      if (currentStatus !== "waiting" && currentStatus !== "ended") {
        return {
          valid: false,
          error: `Cannot start game: current status is '${currentStatus}' (must be 'waiting' or 'ended')`,
        };
      }
      return {
        valid: true,
        nextStatus: "running",
        nextState: {
          status: "running",
          started_at: now.toISOString(),
          paused_at: null,
          paused_total_seconds: 0,
        },
      };

    case "pause":
      if (currentStatus !== "running") {
        return {
          valid: false,
          error: `Cannot pause game: current status is '${currentStatus}' (must be 'running')`,
        };
      }
      return {
        valid: true,
        nextStatus: "paused",
        nextState: {
          status: "paused",
          paused_at: now.toISOString(),
        },
      };

    case "resume": {
      if (currentStatus !== "paused") {
        return {
          valid: false,
          error: `Cannot resume game: current status is '${currentStatus}' (must be 'paused')`,
        };
      }

      let additionalSeconds = 0;
      if (options?.pausedAt) {
        const pauseTime = new Date(options.pausedAt).getTime();
        const diffMs = Math.max(0, now.getTime() - pauseTime);
        additionalSeconds = Math.floor(diffMs / 1000);
      }

      return {
        valid: true,
        nextStatus: "running",
        nextState: {
          status: "running",
          paused_at: null,
        },
        additionalPausedSeconds: additionalSeconds,
      };
    }

    case "end":
      if (currentStatus === "ended") {
        return {
          valid: false,
          error: "Game has already ended",
        };
      }
      return {
        valid: true,
        nextStatus: "ended",
        nextState: {
          status: "ended",
        },
      };

    case "reset":
      if (options?.confirm !== "RESET") {
        return {
          valid: false,
          error: "Game reset requires confirmation string 'RESET'",
        };
      }
      return {
        valid: true,
        nextStatus: "waiting",
        nextState: {
          status: "waiting",
          started_at: null,
          paused_at: null,
          paused_total_seconds: 0,
        },
      };

    default:
      return {
        valid: false,
        error: `Unknown action '${action as string}'`,
      };
  }
}

/**
 * Calculates official elapsed competition duration in seconds:
 * (finished_at - started_at) - paused_total_seconds
 */
export function calculateDurationSeconds(
  startedAt: string | Date,
  finishedAt: string | Date,
  pausedTotalSeconds = 0
): number {
  const startMs = new Date(startedAt).getTime();
  const finishMs = new Date(finishedAt).getTime();
  const totalDurationSeconds = Math.floor((finishMs - startMs) / 1000);
  return Math.max(0, totalDurationSeconds - pausedTotalSeconds);
}

// 32-character unambiguous charset omitting 0, O, 1, I, L
export const UNAMBIGUOUS_JOIN_CODE_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/**
 * Generates an uppercase 6-character random join code with unambiguous characters.
 */
export function generateJoinCode(length = 6): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    const idx = crypto.randomInt(0, UNAMBIGUOUS_JOIN_CODE_CHARS.length);
    result += UNAMBIGUOUS_JOIN_CODE_CHARS[idx];
  }
  return result;
}

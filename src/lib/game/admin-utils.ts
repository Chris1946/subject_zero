export interface PublicTeamProgress {
  name: string;
  progress: number;
  attempts: number;
  finished_at: string | null;
  duration_seconds: number | null;
}

export interface RankedFinishedTeam {
  rank: number;
  name: string;
  formattedTime: string;
  duration_seconds: number;
  attempts: number;
  finished_at: string;
}

export interface RankedInProgressTeam {
  name: string;
  progress: number;
  attempts: number;
}

export interface RoundBreakdown {
  round: number;
  durationSeconds: number;
  formattedTime: string;
  debtSeconds?: number;
  effectiveBudgetSeconds?: number;
  overtimeSeconds?: number;
}

export interface MyTeamResult {
  rank: number;
  name: string;
  durationSeconds: number;
  formattedTime: string;
  attempts: number;
  finished: boolean;
  roundBreakdown?: RoundBreakdown[];
}

export interface LeaderboardResponse {
  hidden: boolean;
  gameStatus?: string;
  finishedTeams?: RankedFinishedTeam[];
  inProgressTeams?: RankedInProgressTeam[];
  myTeamResult?: MyTeamResult | null;
}

/**
 * Determines if public leaderboard data should be hidden.
 * Hidden if leaderboard_visible is false AND game is not 'ended'.
 * Even if a team has finished, the full standings remain classified until the
 * entire competition has ended or the director reveals them.
 */
export function shouldHideLeaderboard(
  leaderboardVisible: boolean,
  gameStatus: string
): boolean {
  if (gameStatus === "ended" || leaderboardVisible) {
    return false;
  }
  return true;
}

/**
 * Formats duration in seconds into MM:SS (or HH:MM:SS if >= 1 hour).
 */
export function formatDurationMmSs(totalSeconds: number): string {
  const norm = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(norm / 3600);
  const minutes = Math.floor((norm % 3600) / 60);
  const seconds = norm % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Calculates total completion time by strictly summing each individual round's completion time.
 */
export function sumRoundDurations(breakdown: RoundBreakdown[]): number {
  return breakdown.reduce((sum, item) => sum + item.durationSeconds, 0);
}

/**
 * Computes individual elapsed time spent per round for a team based on attempt timestamps or explicit records.
 * Incorporates Emergency Overtime (+5m max) and Time Debt deduction across consecutive rounds.
 */
export function computeRoundDurations(
  startedAt: string | null,
  finishedAt: string | null,
  attempts: Array<{ question_id: string; created_at: string; answer_given?: string | null }>,
  roundDurationSeconds: number = 600
): RoundBreakdown[] {
  if (!startedAt) return [];

  const MAX_OVERTIME = 300; // 5 minutes (300s) maximum overtime

  // 1. Check for explicit round record attempts (saved on round completion / timeout)
  const recordedRounds = new Map<
    number,
    { durationSeconds: number; debtSeconds: number; effectiveBudgetSeconds: number }
  >();

  for (const att of attempts) {
    if (att.question_id && att.question_id.startsWith("ROUND_") && att.question_id.endsWith("_RECORD")) {
      try {
        const parsed = JSON.parse(att.answer_given || "{}");
        if (parsed && typeof parsed.round === "number" && typeof parsed.durationSeconds === "number") {
          recordedRounds.set(parsed.round, {
            durationSeconds: parsed.durationSeconds,
            debtSeconds: parsed.debtSeconds || 0,
            effectiveBudgetSeconds: parsed.effectiveBudgetSeconds || roundDurationSeconds,
          });
        }
      } catch {
        // ignore parse errors
      }
    }
  }

  const startMs = new Date(startedAt).getTime();
  const finishMs = finishedAt ? new Date(finishedAt).getTime() : Date.now();

  const getEndMs = (qId: string, fallbackMs: number) => {
    const att = attempts.find((a) => a.question_id === qId);
    return att ? new Date(att.created_at).getTime() : fallbackMs;
  };

  const results: RoundBreakdown[] = [];
  let previousEndMs = startMs;
  let currentIncomingDebt = 0;

  for (let r = 1; r <= 5; r++) {
    const baseBudget = Math.max(0, roundDurationSeconds - currentIncomingDebt);
    const maxAllowed = baseBudget + MAX_OVERTIME;

    // Use explicit persisted record if available
    if (recordedRounds.has(r)) {
      const rec = recordedRounds.get(r)!;
      const dur = Math.min(rec.durationSeconds, maxAllowed);
      currentIncomingDebt = Math.min(MAX_OVERTIME, Math.max(0, dur - baseBudget));
      results.push({
        round: r,
        durationSeconds: dur,
        formattedTime: formatDurationMmSs(dur),
        debtSeconds: currentIncomingDebt,
        effectiveBudgetSeconds: baseBudget,
        overtimeSeconds: Math.max(0, dur - baseBudget),
      });
      continue;
    }

    // Fallback: compute from question attempt timestamps
    const rawEndMs =
      r < 5 ? getEndMs(`${r}.4`, previousEndMs + baseBudget * 1000) : finishMs;

    const roundEndMs = Math.min(rawEndMs, finishMs);
    const rawDuration = Math.max(0, Math.floor((roundEndMs - previousEndMs) / 1000));
    const duration = Math.min(rawDuration, maxAllowed);
    currentIncomingDebt = Math.min(MAX_OVERTIME, Math.max(0, duration - baseBudget));
    previousEndMs = roundEndMs;

    results.push({
      round: r,
      durationSeconds: duration,
      formattedTime: formatDurationMmSs(duration),
      debtSeconds: currentIncomingDebt,
      effectiveBudgetSeconds: baseBudget,
      overtimeSeconds: Math.max(0, duration - baseBudget),
    });
  }

  return results;
}

/**
 * Sorts public teams into:
 * 1. Finished teams ranked by duration_seconds asc, attempts asc, finished_at asc.
 * 2. In-progress teams ranked by progress desc, attempts asc.
 */
export function rankLeaderboardTeams(teams: PublicTeamProgress[]): {
  finishedTeams: RankedFinishedTeam[];
  inProgressTeams: RankedInProgressTeam[];
} {
  const finishedList = teams.filter(
    (t) => t.finished_at !== null && t.duration_seconds !== null
  );
  const inProgressList = teams.filter((t) => t.finished_at === null);

  // 1. Sort finished teams
  finishedList.sort((a, b) => {
    const durA = a.duration_seconds ?? Infinity;
    const durB = b.duration_seconds ?? Infinity;
    if (durA !== durB) return durA - durB;

    if (a.attempts !== b.attempts) return a.attempts - b.attempts;

    const timeA = a.finished_at ? new Date(a.finished_at).getTime() : 0;
    const timeB = b.finished_at ? new Date(b.finished_at).getTime() : 0;
    return timeA - timeB;
  });

  const rankedFinished: RankedFinishedTeam[] = finishedList.map((t, index) => ({
    rank: index + 1,
    name: t.name,
    formattedTime: formatDurationMmSs(t.duration_seconds ?? 0),
    duration_seconds: t.duration_seconds ?? 0,
    attempts: t.attempts,
    finished_at: t.finished_at!,
  }));

  // 2. Sort in-progress teams
  inProgressList.sort((a, b) => {
    if (b.progress !== a.progress) return b.progress - a.progress;
    return a.attempts - b.attempts;
  });

  const rankedInProgress: RankedInProgressTeam[] = inProgressList.map((t) => ({
    name: t.name,
    progress: t.progress,
    attempts: t.attempts,
  }));

  return {
    finishedTeams: rankedFinished,
    inProgressTeams: rankedInProgress,
  };
}

/**
 * Formula-injection escaping for CSV exports.
 * If cell starts with '=', '+', '-', or '@', prefixes with a single quote.
 * Quotes and escapes cells containing commas, quotes, or newlines.
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  let str = String(value);

  // Formula injection check: prefix with single quote if formula trigger character
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }

  // If string contains comma, quote, or newline, escape double quotes and wrap in quotes
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Checks if a team has been inactive for > threshold (default 5 mins) while game is running.
 */
export function isTeamStalled(
  lastActivityAt: string | null,
  gameStatus: string,
  nowMs: number = Date.now(),
  thresholdMs: number = 5 * 60 * 1000
): boolean {
  if (gameStatus !== "running" || !lastActivityAt) {
    return false;
  }
  const lastMs = new Date(lastActivityAt).getTime();
  return nowMs - lastMs > thresholdMs;
}

/**
 * Checks if a team has more than threshold (default 15) wrong attempts on current question.
 */
export function isTeamBruteForcing(
  wrongAttemptsOnCurrentQuestion: number,
  threshold: number = 15
): boolean {
  return wrongAttemptsOnCurrentQuestion > threshold;
}

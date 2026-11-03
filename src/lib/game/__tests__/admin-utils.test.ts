import { describe, it, expect } from "vitest";
import {
  shouldHideLeaderboard,
  formatDurationMmSs,
  rankLeaderboardTeams,
  escapeCsvCell,
  isTeamStalled,
  isTeamBruteForcing,
  computeRoundDurations,
  sumRoundDurations,
  PublicTeamProgress,
} from "../admin-utils";

describe("Admin & Leaderboard Utilities", () => {
  describe("shouldHideLeaderboard", () => {
    it("hides leaderboard when not visible and game is waiting", () => {
      expect(shouldHideLeaderboard(false, "waiting")).toBe(true);
    });

    it("hides leaderboard when not visible and game is running", () => {
      expect(shouldHideLeaderboard(false, "running")).toBe(true);
    });

    it("hides leaderboard when not visible and game is paused", () => {
      expect(shouldHideLeaderboard(false, "paused")).toBe(true);
    });

    it("shows leaderboard when explicitly set visible regardless of game status", () => {
      expect(shouldHideLeaderboard(true, "waiting")).toBe(false);
      expect(shouldHideLeaderboard(true, "running")).toBe(false);
      expect(shouldHideLeaderboard(true, "paused")).toBe(false);
    });

    it("always shows leaderboard when game status is ended, even if leaderboard_visible is false", () => {
      expect(shouldHideLeaderboard(false, "ended")).toBe(false);
      expect(shouldHideLeaderboard(true, "ended")).toBe(false);
    });

    it("keeps leaderboard hidden until competition ends even if team has concluded its investigation", () => {
      expect(shouldHideLeaderboard(false, "running")).toBe(true);
      expect(shouldHideLeaderboard(false, "waiting")).toBe(true);
      expect(shouldHideLeaderboard(false, "paused")).toBe(true);
      expect(shouldHideLeaderboard(false, "ended")).toBe(false);
    });
  });

  describe("formatDurationMmSs", () => {
    it("formats 0 seconds as 00:00", () => {
      expect(formatDurationMmSs(0)).toBe("00:00");
    });

    it("formats sub-minute times correctly", () => {
      expect(formatDurationMmSs(45)).toBe("00:45");
    });

    it("formats minutes and seconds under an hour", () => {
      expect(formatDurationMmSs(65)).toBe("01:05");
      expect(formatDurationMmSs(1820)).toBe("30:20");
      expect(formatDurationMmSs(3599)).toBe("59:59");
    });

    it("formats times exceeding 1 hour as HH:MM:SS", () => {
      expect(formatDurationMmSs(3600)).toBe("01:00:00");
      expect(formatDurationMmSs(3665)).toBe("01:01:05");
      expect(formatDurationMmSs(7325)).toBe("02:02:05");
    });

    it("handles negative values by clamping to 00:00", () => {
      expect(formatDurationMmSs(-10)).toBe("00:00");
    });
  });

  describe("rankLeaderboardTeams", () => {
    it("ranks finished teams by duration_seconds asc", () => {
      const teams: PublicTeamProgress[] = [
        {
          name: "Team Beta",
          progress: 20,
          attempts: 25,
          finished_at: "2026-10-31T20:45:00Z",
          duration_seconds: 2400,
        },
        {
          name: "Team Alpha",
          progress: 20,
          attempts: 25,
          finished_at: "2026-10-31T20:30:00Z",
          duration_seconds: 1800,
        },
      ];

      const { finishedTeams } = rankLeaderboardTeams(teams);
      expect(finishedTeams).toHaveLength(2);
      expect(finishedTeams[0].name).toBe("Team Alpha");
      expect(finishedTeams[0].rank).toBe(1);
      expect(finishedTeams[0].formattedTime).toBe("30:00");
      expect(finishedTeams[1].name).toBe("Team Beta");
      expect(finishedTeams[1].rank).toBe(2);
    });

    it("breaks duration ties using attempts ascending", () => {
      const teams: PublicTeamProgress[] = [
        {
          name: "Team Clumsy",
          progress: 20,
          attempts: 35,
          finished_at: "2026-10-31T20:30:00Z",
          duration_seconds: 1800,
        },
        {
          name: "Team Precise",
          progress: 20,
          attempts: 21,
          finished_at: "2026-10-31T20:30:00Z",
          duration_seconds: 1800,
        },
      ];

      const { finishedTeams } = rankLeaderboardTeams(teams);
      expect(finishedTeams[0].name).toBe("Team Precise");
      expect(finishedTeams[0].rank).toBe(1);
      expect(finishedTeams[1].name).toBe("Team Clumsy");
      expect(finishedTeams[1].rank).toBe(2);
    });

    it("breaks duration and attempt ties using finished_at ascending", () => {
      const teams: PublicTeamProgress[] = [
        {
          name: "Team Later",
          progress: 20,
          attempts: 25,
          finished_at: "2026-10-31T20:40:00Z",
          duration_seconds: 1800,
        },
        {
          name: "Team Earlier",
          progress: 20,
          attempts: 25,
          finished_at: "2026-10-31T20:20:00Z",
          duration_seconds: 1800,
        },
      ];

      const { finishedTeams } = rankLeaderboardTeams(teams);
      expect(finishedTeams[0].name).toBe("Team Earlier");
      expect(finishedTeams[1].name).toBe("Team Later");
    });

    it("ranks in-progress teams below finished teams, ordered by progress desc then attempts asc", () => {
      const teams: PublicTeamProgress[] = [
        {
          name: "Team Finished",
          progress: 20,
          attempts: 22,
          finished_at: "2026-10-31T20:30:00Z",
          duration_seconds: 1800,
        },
        {
          name: "Team Slow Progress",
          progress: 5,
          attempts: 10,
          finished_at: null,
          duration_seconds: null,
        },
        {
          name: "Team High Progress",
          progress: 18,
          attempts: 24,
          finished_at: null,
          duration_seconds: null,
        },
        {
          name: "Team High Progress Cleaner",
          progress: 18,
          attempts: 19,
          finished_at: null,
          duration_seconds: null,
        },
      ];

      const { finishedTeams, inProgressTeams } = rankLeaderboardTeams(teams);
      expect(finishedTeams).toHaveLength(1);
      expect(finishedTeams[0].name).toBe("Team Finished");

      expect(inProgressTeams).toHaveLength(3);
      expect(inProgressTeams[0].name).toBe("Team High Progress Cleaner");
      expect(inProgressTeams[1].name).toBe("Team High Progress");
      expect(inProgressTeams[2].name).toBe("Team Slow Progress");
    });
  });

  describe("escapeCsvCell", () => {
    it("handles null and undefined safely", () => {
      expect(escapeCsvCell(null)).toBe("");
      expect(escapeCsvCell(undefined)).toBe("");
    });

    it("leaves safe numbers and strings untouched", () => {
      expect(escapeCsvCell("Team Omega")).toBe("Team Omega");
      expect(escapeCsvCell(42)).toBe("42");
    });

    it("escapes formula injection characters (=, +, -, @) with a leading single quote", () => {
      expect(escapeCsvCell("=1+1")).toBe("'=1+1");
      expect(escapeCsvCell("+SUM(A1:A10)")).toBe("'+SUM(A1:A10)");
      expect(escapeCsvCell("-2+5")).toBe("'-2+5");
      expect(escapeCsvCell("@cmd")).toBe("'@cmd");
    });

    it("quotes cells containing commas, double quotes, or newlines", () => {
      expect(escapeCsvCell("Alpha, Beta")).toBe('"Alpha, Beta"');
      expect(escapeCsvCell('Team "Zero"')).toBe('"Team ""Zero"""');
      expect(escapeCsvCell("Line1\nLine2")).toBe('"Line1\nLine2"');
    });

    it("handles combination of formula character and comma/quote", () => {
      expect(escapeCsvCell("=HYPERLINK(\"http://evil.com\", \"click\")")).toBe(
        `"'=HYPERLINK(""http://evil.com"", ""click"")"`
      );
    });
  });

  describe("isTeamStalled", () => {
    const thresholdMs = 5 * 60 * 1000; // 5 minutes
    const now = 10000000;

    it("returns false if game is not running", () => {
      const inactiveTime = new Date(now - thresholdMs - 10000).toISOString();
      expect(isTeamStalled(inactiveTime, "waiting", now)).toBe(false);
      expect(isTeamStalled(inactiveTime, "paused", now)).toBe(false);
      expect(isTeamStalled(inactiveTime, "ended", now)).toBe(false);
    });

    it("returns false if team has no recorded activity", () => {
      expect(isTeamStalled(null, "running", now)).toBe(false);
    });

    it("returns false if team was active recently within 5 minutes", () => {
      const recentActivity = new Date(now - 2 * 60 * 1000).toISOString();
      expect(isTeamStalled(recentActivity, "running", now, thresholdMs)).toBe(false);
    });

    it("returns true if team was inactive for > 5 minutes during running game", () => {
      const oldActivity = new Date(now - 6 * 60 * 1000).toISOString();
      expect(isTeamStalled(oldActivity, "running", now, thresholdMs)).toBe(true);
    });
  });

  describe("isTeamBruteForcing", () => {
    it("returns false when wrong attempts are 15 or fewer", () => {
      expect(isTeamBruteForcing(0)).toBe(false);
      expect(isTeamBruteForcing(10)).toBe(false);
      expect(isTeamBruteForcing(15)).toBe(false);
    });

    it("returns true when wrong attempts strictly exceed 15", () => {
      expect(isTeamBruteForcing(16)).toBe(true);
      expect(isTeamBruteForcing(25)).toBe(true);
    });

  describe("computeRoundDurations", () => {
    it("returns empty array if startedAt is null", () => {
      expect(computeRoundDurations(null, null, [])).toEqual([]);
    });

    it("calculates accurate duration per round based on correct attempts", () => {
      const start = new Date("2026-11-01T10:00:00Z").toISOString();
      const q1_4 = new Date("2026-11-01T10:03:00Z").toISOString(); // +180s (Round 1)
      const q2_4 = new Date("2026-11-01T10:05:00Z").toISOString(); // +120s (Round 2)
      const q3_4 = new Date("2026-11-01T10:08:00Z").toISOString(); // +180s (Round 3)
      const q4_4 = new Date("2026-11-01T10:09:00Z").toISOString(); // +60s  (Round 4)
      const finish = new Date("2026-11-01T10:11:00Z").toISOString(); // +120s (Round 5)

      const correctAttempts = [
        { question_id: "1.4", created_at: q1_4 },
        { question_id: "2.4", created_at: q2_4 },
        { question_id: "3.4", created_at: q3_4 },
        { question_id: "4.4", created_at: q4_4 },
      ];

      const breakdown = computeRoundDurations(start, finish, correctAttempts, 600);
      expect(breakdown).toHaveLength(5);
      expect(breakdown[0]).toMatchObject({ round: 1, durationSeconds: 180, formattedTime: "03:00" });
      expect(breakdown[1]).toMatchObject({ round: 2, durationSeconds: 120, formattedTime: "02:00" });
      expect(breakdown[2]).toMatchObject({ round: 3, durationSeconds: 180, formattedTime: "03:00" });
      expect(breakdown[3]).toMatchObject({ round: 4, durationSeconds: 60, formattedTime: "01:00" });
      expect(breakdown[4]).toMatchObject({ round: 5, durationSeconds: 120, formattedTime: "02:00" });

      // Verifies final completion time is strictly calculated by summing round durations
      const totalSum = sumRoundDurations(breakdown);
      expect(totalSum).toBe(180 + 120 + 180 + 60 + 120);
      expect(formatDurationMmSs(totalSum)).toBe("11:00");
    });

    it("handles 10m round with emergency overtime and debt inheritance (13m -> 7m)", () => {
      const start = new Date("2026-11-01T10:00:00Z").toISOString();
      // Round 1: takes 10m (600s)
      const q1_4 = new Date("2026-11-01T10:10:00Z").toISOString();
      // Round 2: takes 10m (600s)
      const q2_4 = new Date("2026-11-01T10:20:00Z").toISOString();
      // Round 3: takes 13m (780s -> 180s overtime debt)
      const q3_4 = new Date("2026-11-01T10:33:00Z").toISOString();
      // Round 4: budget reduced to 7m (420s). Solves in 5m (300s -> 0 new debt)
      const q4_4 = new Date("2026-11-01T10:38:00Z").toISOString();
      // Round 5: gets full 10m (600s). Solves in 3m (180s)
      const finish = new Date("2026-11-01T10:41:00Z").toISOString();

      const attempts = [
        { question_id: "1.4", created_at: q1_4 },
        { question_id: "2.4", created_at: q2_4 },
        { question_id: "3.4", created_at: q3_4 },
        { question_id: "4.4", created_at: q4_4 },
      ];

      const breakdown = computeRoundDurations(start, finish, attempts, 600);
      expect(breakdown).toHaveLength(5);
      expect(breakdown[2]).toMatchObject({
        round: 3,
        durationSeconds: 780, // 13:00
        formattedTime: "13:00",
        debtSeconds: 180, // 3m debt passed to next player
      });
      expect(breakdown[3]).toMatchObject({
        round: 4,
        durationSeconds: 300, // 05:00
        formattedTime: "05:00",
        effectiveBudgetSeconds: 420, // 10m - 3m debt = 7m
        debtSeconds: 0,
      });
      expect(breakdown[4]).toMatchObject({
        round: 5,
        durationSeconds: 180,
        formattedTime: "03:00",
        effectiveBudgetSeconds: 600,
      });

      const total = sumRoundDurations(breakdown);
      expect(total).toBe(600 + 600 + 780 + 300 + 180);
      expect(formatDurationMmSs(total)).toBe("41:00");
    });

    it("enforces 15-minute hard maximum cutoff (effectiveBudget + 5m max overtime)", () => {
      const start = new Date("2026-11-01T10:00:00Z").toISOString();
      // Round 1 attempts to take 18 minutes (1080s)
      const q1_4 = new Date("2026-11-01T10:18:00Z").toISOString();
      const finish = new Date("2026-11-01T10:20:00Z").toISOString();

      const attempts = [{ question_id: "1.4", created_at: q1_4 }];
      const breakdown = computeRoundDurations(start, finish, attempts, 600);

      // Round 1 must be strictly capped at 15:00 (900s)
      expect(breakdown[0].durationSeconds).toBe(900);
      expect(breakdown[0].formattedTime).toBe("15:00");
      expect(breakdown[0].overtimeSeconds).toBe(300); // capped at 5 mins
      expect(breakdown[0].debtSeconds).toBe(300); // capped at 5 mins

      // Round 2 gets 600 - 300 = 300s (5m) budget
      expect(breakdown[1].effectiveBudgetSeconds).toBe(300);
    });

    it("inherits time debt from Round 4 into Round 5", () => {
      const start = new Date("2026-11-01T10:00:00Z").toISOString();
      const q1_4 = new Date("2026-11-01T10:05:00Z").toISOString();
      const q2_4 = new Date("2026-11-01T10:10:00Z").toISOString();
      const q3_4 = new Date("2026-11-01T10:15:00Z").toISOString();
      // Round 4 takes 13 minutes (780s) -> 180s debt
      const q4_4 = new Date("2026-11-01T10:28:00Z").toISOString();
      // Round 5 solves in 4 minutes (240s)
      const finish = new Date("2026-11-01T10:32:00Z").toISOString();

      const attempts = [
        { question_id: "1.4", created_at: q1_4 },
        { question_id: "2.4", created_at: q2_4 },
        { question_id: "3.4", created_at: q3_4 },
        { question_id: "4.4", created_at: q4_4 },
      ];

      const breakdown = computeRoundDurations(start, finish, attempts, 600);
      expect(breakdown[3].debtSeconds).toBe(180);
      // Round 5 inherits debt from Round 4 (600 - 180 = 420s = 7m)
      expect(breakdown[4].effectiveBudgetSeconds).toBe(420);
    });
  });
});
});

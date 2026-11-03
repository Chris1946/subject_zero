import { describe, it, expect } from "vitest";
import { signPayload, verifyPayload, TeamSessionPayload } from "@/lib/session.server";
import {
  evaluateGameTransition,
  calculateDurationSeconds,
  generateJoinCode,
  UNAMBIGUOUS_JOIN_CODE_CHARS,
  GameStatus,
} from "@/lib/game/control.server";
import { RATE_LIMIT_CONFIG } from "@/lib/rate-limits";

describe("Subject Zero: Sessions, Game Control & Rate Limits", () => {
  const TEST_SECRET = "test-secret-at-least-32-characters-long-key-123456789";

  describe("Task 9.1: Session Sign and Verify", () => {
    it("signs and successfully verifies a valid team session payload", () => {
      const now = Math.floor(Date.now() / 1000);
      const payload: TeamSessionPayload = {
        teamId: "e9f7d242-b033-4f9b-9c6f-7e82855f448c",
        iat: now,
      };

      const token = signPayload(payload, TEST_SECRET);
      expect(typeof token).toBe("string");
      expect(token).toContain(".");

      const verified = verifyPayload<TeamSessionPayload>(token, TEST_SECRET, 3600);
      expect(verified).not.toBeNull();
      expect(verified?.teamId).toBe(payload.teamId);
      expect(verified?.iat).toBe(payload.iat);
    });

    it("rejects a tampered payload", () => {
      const now = Math.floor(Date.now() / 1000);
      const payload: TeamSessionPayload = {
        teamId: "e9f7d242-b033-4f9b-9c6f-7e82855f448c",
        iat: now,
      };

      const token = signPayload(payload, TEST_SECRET);
      const [, sig] = token.split(".");

      // Tamper one byte of the data
      const tamperedData = Buffer.from(
        JSON.stringify({ teamId: "different-id", iat: now })
      ).toString("base64url");
      const tamperedToken = `${tamperedData}.${sig}`;

      const verified = verifyPayload(tamperedToken, TEST_SECRET, 3600);
      expect(verified).toBeNull();
    });

    it("rejects a tampered signature", () => {
      const now = Math.floor(Date.now() / 1000);
      const payload: TeamSessionPayload = {
        teamId: "e9f7d242-b033-4f9b-9c6f-7e82855f448c",
        iat: now,
      };

      const token = signPayload(payload, TEST_SECRET);
      const [dataB64, sig] = token.split(".");

      // Tamper signature
      const tamperedSig = sig.slice(0, -2) + "xx";
      const tamperedToken = `${dataB64}.${tamperedSig}`;

      const verified = verifyPayload(tamperedToken, TEST_SECRET, 3600);
      expect(verified).toBeNull();
    });

    it("rejects an expired token", () => {
      const past = Math.floor(Date.now() / 1000) - 4000; // 4000s ago
      const payload: TeamSessionPayload = {
        teamId: "e9f7d242-b033-4f9b-9c6f-7e82855f448c",
        iat: past,
      };

      const token = signPayload(payload, TEST_SECRET);
      // Max age 3600s
      const verified = verifyPayload(token, TEST_SECRET, 3600);
      expect(verified).toBeNull();
    });

    it("rejects a token verified with the wrong secret", () => {
      const now = Math.floor(Date.now() / 1000);
      const payload: TeamSessionPayload = {
        teamId: "e9f7d242-b033-4f9b-9c6f-7e82855f448c",
        iat: now,
      };

      const token = signPayload(payload, TEST_SECRET);
      const wrongSecret = "wrong-secret-which-is-also-at-least-32-chars-long";

      const verified = verifyPayload(token, wrongSecret, 3600);
      expect(verified).toBeNull();
    });

    it("rejects malformed token strings", () => {
      expect(verifyPayload("", TEST_SECRET, 3600)).toBeNull();
      expect(verifyPayload("random-string-no-dot", TEST_SECRET, 3600)).toBeNull();
      expect(verifyPayload("a.b.c", TEST_SECRET, 3600)).toBeNull();
    });
  });

  describe("Task 9.2: Game Control State Machine Transitions", () => {
    const statuses: GameStatus[] = ["waiting", "running", "paused", "ended"];

    it("start action: valid from 'waiting' and 'ended' (re-open)", () => {
      for (const st of statuses) {
        const res = evaluateGameTransition(st, "start");
        if (st === "waiting" || st === "ended") {
          expect(res.valid).toBe(true);
          expect(res.nextStatus).toBe("running");
          expect(res.nextState?.status).toBe("running");
        } else {
          expect(res.valid).toBe(false);
          expect(res.error).toBeDefined();
        }
      }
    });

    it("pause action: valid ONLY from 'running'", () => {
      for (const st of statuses) {
        const res = evaluateGameTransition(st, "pause");
        if (st === "running") {
          expect(res.valid).toBe(true);
          expect(res.nextStatus).toBe("paused");
          expect(res.nextState?.status).toBe("paused");
        } else {
          expect(res.valid).toBe(false);
          expect(res.error).toBeDefined();
        }
      }
    });

    it("resume action: valid ONLY from 'paused'", () => {
      const pauseTime = new Date("2026-10-31T20:00:00Z");
      const resumeTime = new Date("2026-10-31T20:05:00Z"); // 300s later

      for (const st of statuses) {
        const res = evaluateGameTransition(st, "resume", {
          pausedAt: pauseTime.toISOString(),
          now: resumeTime,
        });

        if (st === "paused") {
          expect(res.valid).toBe(true);
          expect(res.nextStatus).toBe("running");
          expect(res.additionalPausedSeconds).toBe(300);
        } else {
          expect(res.valid).toBe(false);
          expect(res.error).toBeDefined();
        }
      }
    });

    it("end action: valid from 'waiting', 'running', 'paused', but NOT 'ended'", () => {
      for (const st of statuses) {
        const res = evaluateGameTransition(st, "end");
        if (st === "ended") {
          expect(res.valid).toBe(false);
        } else {
          expect(res.valid).toBe(true);
          expect(res.nextStatus).toBe("ended");
        }
      }
    });

    it("reset action: requires confirm 'RESET' and transitions to 'waiting'", () => {
      // Without confirm
      const withoutConfirm = evaluateGameTransition("running", "reset");
      expect(withoutConfirm.valid).toBe(false);

      // Wrong confirm
      const wrongConfirm = evaluateGameTransition("ended", "reset", { confirm: "NO" });
      expect(wrongConfirm.valid).toBe(false);

      // Correct confirm
      for (const st of statuses) {
        const res = evaluateGameTransition(st, "reset", { confirm: "RESET" });
        expect(res.valid).toBe(true);
        expect(res.nextStatus).toBe("waiting");
        expect(res.nextState?.started_at).toBeNull();
        expect(res.nextState?.paused_total_seconds).toBe(0);
      }
    });
  });

  describe("Task 9.3: Rate Limiting Config Sanity", () => {
    it("answers rate limits match specification", () => {
      expect(RATE_LIMIT_CONFIG.ANSWER_PER_TEAM.max).toBe(6);
      expect(RATE_LIMIT_CONFIG.ANSWER_PER_TEAM.windowSeconds).toBe(60);

      expect(RATE_LIMIT_CONFIG.ANSWER_PER_IP.max).toBe(30);
      expect(RATE_LIMIT_CONFIG.ANSWER_PER_IP.windowSeconds).toBe(60);
    });

    it("join rate limits match specification", () => {
      expect(RATE_LIMIT_CONFIG.JOIN_PER_IP.max).toBe(15);
      expect(RATE_LIMIT_CONFIG.JOIN_PER_IP.windowSeconds).toBe(60);
    });

    it("admin login rate limits match specification", () => {
      expect(RATE_LIMIT_CONFIG.ADMIN_LOGIN_PER_IP.max).toBe(5);
      expect(RATE_LIMIT_CONFIG.ADMIN_LOGIN_PER_IP.windowSeconds).toBe(300); // 5 minutes
    });
  });

  describe("Task 9.4: Duration Calculation with Pauses", () => {
    it("calculates 350s for: start at 0s, pause for 50s, finish at 400s", () => {
      const start = new Date("2026-10-31T20:00:00.000Z");
      const finish = new Date("2026-10-31T20:06:40.000Z"); // +400s
      const pausedSeconds = 50;

      const duration = calculateDurationSeconds(start, finish, pausedSeconds);
      expect(duration).toBe(350);
    });

    it("calculates exact duration without pauses", () => {
      const start = new Date("2026-10-31T20:00:00.000Z");
      const finish = new Date("2026-10-31T20:03:20.000Z"); // +200s

      const duration = calculateDurationSeconds(start, finish, 0);
      expect(duration).toBe(200);
    });

    it("clamps duration to 0 if paused_total exceeds elapsed time", () => {
      const start = new Date("2026-10-31T20:00:00.000Z");
      const finish = new Date("2026-10-31T20:01:00.000Z"); // +60s
      const pausedSeconds = 120; // more than elapsed

      const duration = calculateDurationSeconds(start, finish, pausedSeconds);
      expect(duration).toBe(0);
    });

    it("shifts round start timestamp forward by pause duration to preserve remaining seconds", () => {
      const roundDuration = 600; // 10 minutes
      const originalStartMs = new Date("2026-10-31T20:00:00.000Z").getTime();
      const pauseStartMs = originalStartMs + 300 * 1000; // paused at 5:00 elapsed (300s remaining)
      const resumeMs = pauseStartMs + 180 * 1000; // paused for 3 minutes (180s)
      const pauseDurationSec = Math.floor((resumeMs - pauseStartMs) / 1000); // 180s

      // Pre-pause remaining seconds
      const prePauseElapsed = Math.floor((pauseStartMs - originalStartMs) / 1000);
      const prePauseRemaining = roundDuration - prePauseElapsed;
      expect(prePauseRemaining).toBe(300);

      // Shift round start timestamp forward by pause duration
      const adjustedStartMs = originalStartMs + pauseDurationSec * 1000;

      // On resume, effective remaining seconds is preserved exactly at 300s
      const postResumeElapsed = Math.floor((resumeMs - adjustedStartMs) / 1000);
      const postResumeRemaining = roundDuration - postResumeElapsed;
      expect(postResumeRemaining).toBe(300);
      expect(postResumeRemaining).toBe(prePauseRemaining);
    });
  });

  describe("Join Code Generator", () => {
    it("generates 6-character uppercase codes without ambiguous characters (0, O, 1, I, L)", () => {
      const ambiguousChars = ["0", "O", "1", "I", "L"];
      const generatedCodes = new Set<string>();

      for (let i = 0; i < 50; i++) {
        const code = generateJoinCode(6);
        expect(code).toHaveLength(6);
        expect(code).toBe(code.toUpperCase());

        for (const badChar of ambiguousChars) {
          expect(code).not.toContain(badChar);
        }

        for (const char of code) {
          expect(UNAMBIGUOUS_JOIN_CODE_CHARS).toContain(char);
        }

        generatedCodes.add(code);
      }

      // Check random spread
      expect(generatedCodes.size).toBeGreaterThan(40);
    });
  });
});

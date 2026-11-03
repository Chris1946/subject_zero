import { describe, it, expect, beforeEach } from "vitest";
import {
  computeInGameClock,
  degradeMessageText,
  formatSecondsToTime,
  parseTimeToSeconds,
  getSeenStoryIds,
  markStoryIdSeen,
} from "@/lib/game/client-utils";

describe("Client Utilities & Game Logic", () => {
  describe("Task 9.1: In-Game Clock Calculation", () => {
    it("parses HH:MM:SS and formats back accurately", () => {
      const seconds = parseTimeToSeconds("23:47:16");
      expect(seconds).toBe(23 * 3600 + 47 * 60 + 16);
      expect(formatSecondsToTime(seconds)).toBe("23:47:16");
    });

    it("returns base time 23:47:16 when game has not started", () => {
      const clock = computeInGameClock({
        gameStartedAt: null,
        pausedTotalSeconds: 0,
        serverTime: "2026-10-31T20:00:00.000Z",
        clientReceivedTimeMs: Date.now(),
      });
      expect(clock).toBe("23:47:16");
    });

    it("advances clock by elapsed game seconds", () => {
      const startTime = new Date("2026-10-31T20:00:00.000Z");
      const currentTime = new Date("2026-10-31T20:01:40.000Z"); // +100s

      const clock = computeInGameClock({
        gameStartedAt: startTime.toISOString(),
        pausedTotalSeconds: 0,
        serverTime: currentTime.toISOString(),
        clientReceivedTimeMs: 1000,
        currentClientTimeMs: 1000, // no drift
      });

      // 23:47:16 + 100s = 23:48:56
      expect(clock).toBe("23:48:56");
    });

    it("deducts pausedTotalSeconds from elapsed time", () => {
      const startTime = new Date("2026-10-31T20:00:00.000Z");
      const currentTime = new Date("2026-10-31T20:02:30.000Z"); // +150s

      const clock = computeInGameClock({
        gameStartedAt: startTime.toISOString(),
        pausedTotalSeconds: 50, // 150s - 50s = 100s active
        serverTime: currentTime.toISOString(),
        clientReceivedTimeMs: 1000,
        currentClientTimeMs: 1000,
      });

      // 23:47:16 + 100s = 23:48:56
      expect(clock).toBe("23:48:56");
    });
  });

  describe("Task 9.2: Deterministic Message Text Degradation", () => {
    const testMessage =
      "Subject Zero was designed to recognise human behaviour and retain information from researchers.";

    it("leaves text completely untouched when status is UNSTABLE", () => {
      const res = degradeMessageText(testMessage, "UNSTABLE", 123);
      expect(res).toBe(testMessage);
    });

    it("is strictly deterministic for identical text, status, and seed", () => {
      const run1 = degradeMessageText(testMessage, "CRITICAL", 999);
      const run2 = degradeMessageText(testMessage, "CRITICAL", 999);
      expect(run1).toBe(run2);
    });

    it("never removes or alters more than a safe fraction (<= 8%) of characters", () => {
      const statuses = [
        "DEGRADED",
        "MEMORY FAILURE",
        "CRITICAL",
        "CONNECTION CRITICAL",
      ];

      for (const st of statuses) {
        for (let seed = 1; seed <= 20; seed++) {
          const degraded = degradeMessageText(testMessage, st, seed);
          expect(degraded).toHaveLength(testMessage.length);

          let diffCount = 0;
          for (let i = 0; i < testMessage.length; i++) {
            if (testMessage[i] !== degraded[i]) {
              diffCount++;
            }
          }

          const ratio = diffCount / testMessage.length;
          expect(ratio).toBeLessThanOrEqual(0.08); // strictly <= 8%
        }
      }
    });

    it("preserves spaces, linebreaks, and digits", () => {
      const complex = "Session 314 on port 443 at 23:07:48.\nLine 2 with spaces.";
      const degraded = degradeMessageText(complex, "CONNECTION CRITICAL", 42);

      // Check digits preserved
      for (let i = 0; i < complex.length; i++) {
        const c = complex[i];
        if (c >= "0" && c <= "9") {
          expect(degraded[i]).toBe(c);
        }
        if (c === " " || c === "\n") {
          expect(degraded[i]).toBe(c);
        }
      }
    });
  });

  describe("Task 9.3: Story-Seen Tracking", () => {
    let mockStorage: Record<string, string> = {};

    beforeEach(() => {
      mockStorage = {};
      Object.defineProperty(globalThis, "window", {
        value: {
          localStorage: {
            getItem: (key: string) => mockStorage[key] ?? null,
            setItem: (key: string, val: string) => {
              mockStorage[key] = val;
            },
          },
        },
        writable: true,
      });
    });

    it("returns empty set when no items have been marked seen", () => {
      const seen = getSeenStoryIds("team_alpha");
      expect(seen.size).toBe(0);
    });

    it("marks and persists seen story IDs per teamId", () => {
      markStoryIdSeen("team_alpha", "prologue");
      markStoryIdSeen("team_alpha", "room_1_entrance");

      const seenAlpha = getSeenStoryIds("team_alpha");
      expect(seenAlpha.has("prologue")).toBe(true);
      expect(seenAlpha.has("room_1_entrance")).toBe(true);
      expect(seenAlpha.has("room_2_entrance")).toBe(false);

      // Other team has separate state
      const seenBeta = getSeenStoryIds("team_beta");
      expect(seenBeta.size).toBe(0);
    });
  });
});

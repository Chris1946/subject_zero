import { describe, it, expect, vi } from "vitest";
import { getRateLimitConfig } from "../../rate-limits";

describe("Rate Limiting Configuration", () => {
  it("uses remote mode defaults when EVENT_MODE is remote", () => {
    vi.stubEnv("EVENT_MODE", "remote");
    const config = getRateLimitConfig();
    expect(config.EVENT_MODE).toBe("remote");
    expect(config.ANSWER_PER_TEAM.max).toBe(6);
    expect(config.ANSWER_PER_IP.max).toBe(30);
    expect(config.JOIN_PER_IP.max).toBe(15);
    expect(config.LEADERBOARD_PER_IP.max).toBe(30);
    expect(config.STATE_PER_IP.max).toBe(60);
    expect(config.JOIN_FAILURES_GLOBAL.max).toBe(60);
    expect(config.ADMIN_LOGIN_PER_IP.max).toBe(5);
    vi.unstubAllEnvs();
  });

  it("scales up per-IP limits in onsite mode to support ~100 players on shared venue IP", () => {
    vi.stubEnv("EVENT_MODE", "onsite");
    const config = getRateLimitConfig();
    expect(config.EVENT_MODE).toBe("onsite");
    // Per-team limit stays strict (6/min)
    expect(config.ANSWER_PER_TEAM.max).toBe(6);
    // Scaled IP limits
    expect(config.ANSWER_PER_IP.max).toBe(600);
    expect(config.JOIN_PER_IP.max).toBe(300);
    expect(config.LEADERBOARD_PER_IP.max).toBe(600);
    expect(config.STATE_PER_IP.max).toBe(1200);
    // Admin login stays strict
    expect(config.ADMIN_LOGIN_PER_IP.max).toBe(5);
    // Global join failure limit
    expect(config.JOIN_FAILURES_GLOBAL.max).toBe(60);
    vi.unstubAllEnvs();
  });

  it("respects explicit environment overrides", () => {
    vi.stubEnv("EVENT_MODE", "onsite");
    vi.stubEnv("RATE_LIMIT_ANSWERS_PER_IP", "999");
    const config = getRateLimitConfig();
    expect(config.ANSWER_PER_IP.max).toBe(999);
    vi.unstubAllEnvs();
  });
});

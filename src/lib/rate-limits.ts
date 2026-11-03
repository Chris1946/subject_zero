import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export interface RateLimitRule {
  max: number;
  windowSeconds: number;
}

/**
 * Returns dynamic rate limit configurations based on EVENT_MODE ("onsite" vs "remote").
 * In "onsite" mode, ~100 participants share 1 public IP, so IP limits are scaled up significantly.
 * Per-team limits remain unchanged to prevent brute-forcing.
 */
export function getRateLimitConfig() {
  const mode = process.env.EVENT_MODE === "onsite" ? "onsite" : "remote";
  const isOnsite = mode === "onsite";

  const customAnswers = process.env.RATE_LIMIT_ANSWERS_PER_IP
    ? parseInt(process.env.RATE_LIMIT_ANSWERS_PER_IP, 10)
    : undefined;
  const customJoin = process.env.RATE_LIMIT_JOIN_PER_IP
    ? parseInt(process.env.RATE_LIMIT_JOIN_PER_IP, 10)
    : undefined;
  const customLeaderboard = process.env.RATE_LIMIT_LEADERBOARD_PER_IP
    ? parseInt(process.env.RATE_LIMIT_LEADERBOARD_PER_IP, 10)
    : undefined;
  const customState = process.env.RATE_LIMIT_STATE_PER_IP
    ? parseInt(process.env.RATE_LIMIT_STATE_PER_IP, 10)
    : undefined;

  return {
    EVENT_MODE: mode,
    ANSWER_PER_TEAM: {
      max: 6,
      windowSeconds: 60,
    },
    ANSWER_PER_IP: {
      max: customAnswers ?? (isOnsite ? 600 : 30),
      windowSeconds: 60,
    },
    JOIN_PER_IP: {
      max: customJoin ?? (isOnsite ? 300 : 15),
      windowSeconds: 60,
    },
    JOIN_FAILURES_GLOBAL: {
      max: 60,
      windowSeconds: 60,
    },
    LEADERBOARD_PER_IP: {
      max: customLeaderboard ?? (isOnsite ? 600 : 30),
      windowSeconds: 60,
    },
    STATE_PER_IP: {
      max: customState ?? (isOnsite ? 1200 : 60),
      windowSeconds: 60,
    },
    ADMIN_LOGIN_PER_IP: {
      max: 5,
      windowSeconds: 5 * 60, // 5 minutes
    },
  };
}

// Proxied export for backward-compatibility with existing routes
export const RATE_LIMIT_CONFIG = new Proxy({} as ReturnType<typeof getRateLimitConfig>, {
  get(_target, prop: string) {
    const config = getRateLimitConfig();
    return config[prop as keyof typeof config];
  },
});

/**
 * Extracts client IP from request headers.
 * Note: On Vercel, the 'x-forwarded-for' header is securely populated and sanitized
 * by the edge platform reverse proxy.
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "unknown";
}

/**
 * Evaluates rate limit against Postgres atomic hit_rate_limit RPC.
 * Returns null if request is allowed; returns 429 response if limit is exceeded.
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowSeconds: number
): Promise<NextResponse | null> {
  try {
    const supabase = getServerClient();
    const { data: isAllowed, error } = await supabase.rpc("hit_rate_limit", {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      console.error("[RateLimit RPC Error]:", error.message);
      return null;
    }

    if (isAllowed === false) {
      return NextResponse.json(
        { error: `TERMINAL LOCKED. RETRY IN ${windowSeconds} SECONDS.` },
        {
          status: 429,
          headers: {
            "Retry-After": windowSeconds.toString(),
          },
        }
      );
    }

    return null;
  } catch (err: unknown) {
    console.error("[RateLimit Exception]:", err);
    return null;
  }
}

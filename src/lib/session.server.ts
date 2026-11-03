import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { env } from "@/lib/env.server";

export const TEAM_COOKIE_NAME = "sz_team";
export const ADMIN_COOKIE_NAME = "sz_admin";

export const TEAM_MAX_AGE_SECONDS = 12 * 60 * 60; // 12 hours
export const ADMIN_MAX_AGE_SECONDS = 6 * 60 * 60; // 6 hours

export interface TeamSessionPayload {
  teamId: string;
  memberId?: string;
  memberIndex?: number;
  iat: number;
}

export interface AdminSessionPayload {
  admin: true;
  iat: number;
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Pure function: Signs a JSON serializable payload with HMAC-SHA256.
 */
export function signPayload(payload: object, secret: string): string {
  const dataB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(dataB64)
    .digest("base64url");
  return `${dataB64}.${signature}`;
}

/**
 * Pure function: Verifies HMAC-SHA256 signature and validates expiration.
 * Returns null if token is tampered, expired, or malformed.
 */
export function verifyPayload<T extends { iat: number }>(
  token: string,
  secret: string,
  maxAgeSeconds: number
): T | null {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [dataB64, sigB64] = parts;
  if (!dataB64 || !sigB64) {
    return null;
  }

  try {
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(dataB64)
      .digest();
    const actualSig = Buffer.from(sigB64, "base64url");

    if (expectedSig.length !== actualSig.length) {
      return null;
    }

    if (!crypto.timingSafeEqual(expectedSig, actualSig)) {
      return null;
    }

    const payload = JSON.parse(
      Buffer.from(dataB64, "base64url").toString("utf8")
    ) as T;

    if (!payload || typeof payload.iat !== "number") {
      return null;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    // Reject expired cookies, or cookies dated more than 60s in the future (clock skew)
    if (nowSeconds - payload.iat > maxAgeSeconds || payload.iat > nowSeconds + 60) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Sets the signed team session cookie in the Next.js cookie store.
 */
export async function createTeamSession(
  teamId: string,
  memberId?: string,
  memberIndex?: number
): Promise<string> {
  const payload: TeamSessionPayload = {
    teamId,
    memberId,
    memberIndex,
    iat: Math.floor(Date.now() / 1000),
  };
  const token = signPayload(payload, env.SESSION_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(TEAM_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TEAM_MAX_AGE_SECONDS,
  });

  return token;
}

/**
 * Reads and verifies the full team session cookie with squad member information.
 */
export async function readFullTeamSession(rawCookieValue?: string): Promise<TeamSessionPayload | null> {
  let token = rawCookieValue;
  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get(TEAM_COOKIE_NAME)?.value;
  }

  if (!token) {
    return null;
  }

  return verifyPayload<TeamSessionPayload>(
    token,
    env.SESSION_SECRET,
    TEAM_MAX_AGE_SECONDS
  );
}

/**
 * Reads and verifies the team session cookie. Returns the teamId or null.
 */
export async function readTeamSession(rawCookieValue?: string): Promise<string | null> {
  const session = await readFullTeamSession(rawCookieValue);
  return session?.teamId ?? null;
}

/**
 * Sets the signed admin session cookie in the Next.js cookie store.
 */
export async function createAdminSession(): Promise<string> {
  const payload: AdminSessionPayload = {
    admin: true,
    iat: Math.floor(Date.now() / 1000),
  };
  const token = signPayload(payload, env.SESSION_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_MAX_AGE_SECONDS,
  });

  return token;
}

/**
 * Reads and verifies the admin session cookie. Returns true if valid, false otherwise.
 */
export async function readAdminSession(rawCookieValue?: string): Promise<boolean> {
  let token = rawCookieValue;
  if (!token) {
    const cookieStore = await cookies();
    token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  }

  if (!token) {
    return null !== null; // false
  }

  const verified = verifyPayload<AdminSessionPayload>(
    token,
    env.SESSION_SECRET,
    ADMIN_MAX_AGE_SECONDS
  );

  return Boolean(verified?.admin);
}

/**
 * Clears a specific session cookie.
 */
export async function clearSession(cookieName: typeof TEAM_COOKIE_NAME | typeof ADMIN_COOKIE_NAME): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Guards routes requiring an authenticated team session.
 */
export async function requireTeam(): Promise<{ teamId: string }> {
  const teamId = await readTeamSession();
  if (!teamId) {
    throw new UnauthorizedError("Authentication required: team session missing or expired");
  }
  return { teamId };
}

/**
 * Guards routes requiring an authenticated team session with member metadata.
 */
export async function requireTeamMember(): Promise<{ teamId: string; memberId?: string; memberIndex?: number }> {
  const session = await readFullTeamSession();
  if (!session || !session.teamId) {
    throw new UnauthorizedError("Authentication required: team session missing or expired");
  }
  return { teamId: session.teamId, memberId: session.memberId, memberIndex: session.memberIndex };
}

/**
 * Guards routes requiring an authenticated admin session.
 */
export async function requireAdmin(): Promise<void> {
  const isAdmin = await readAdminSession();
  if (!isAdmin) {
    throw new UnauthorizedError("Authentication required: admin session missing or expired");
  }
}

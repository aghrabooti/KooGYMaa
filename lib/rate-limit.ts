import "server-only";

import type { NextRequest } from "next/server";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
};

const globalForRateLimit = globalThis as unknown as {
  authRateLimits?: Map<string, RateLimitEntry>;
};

const entries = globalForRateLimit.authRateLimits ?? new Map<string, RateLimitEntry>();
globalForRateLimit.authRateLimits = entries;

function pruneExpiredEntries(now: number) {
  if (entries.size < 1_000) return;

  for (const [key, entry] of entries) {
    if (entry.resetAt <= now) entries.delete(key);
  }

  while (entries.size >= 10_000) {
    const oldestKey = entries.keys().next().value;
    if (!oldestKey) break;
    entries.delete(oldestKey);
  }
}

export function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  pruneExpiredEntries(now);
  const current = entries.get(key);

  if (!current || current.resetAt <= now) {
    entries.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }

  current.count += 1;
  entries.set(key, current);

  const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
  return {
    allowed: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
    retryAfter,
  };
}

export function clearRateLimit(key: string) {
  entries.delete(key);
}

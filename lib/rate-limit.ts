import "server-only";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

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
  generalRateLimits?: Map<string, RateLimitEntry>;
};

const entries = globalForRateLimit.authRateLimits ?? new Map<string, RateLimitEntry>();
globalForRateLimit.authRateLimits = entries;

const general = globalForRateLimit.generalRateLimits ?? new Map<string, RateLimitEntry>();
globalForRateLimit.generalRateLimits = general;

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

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

function checkBucket(store: Map<string, RateLimitEntry>, key: string, limit: number, windowMs: number, now: number): RateLimitResult {
  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: 0 };
  }
  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
  }
  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, retryAfter: 0 };
}

export function checkAuthRateLimit(request: NextRequest, limit = 20, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  pruneExpiredEntries(now);
  return checkBucket(entries, `auth:${getClientIp(request)}`, limit, windowMs, now);
}

/** General API throttling: 120 req/min per IP by default. */
export function checkGeneralRateLimit(request: NextRequest, limit = 120, windowMs = 60_000): RateLimitResult {
  return checkBucket(general, `api:${getClientIp(request)}`, limit, windowMs, now());
}

function now() {
  return Date.now();
}

export function rateLimitResponse(result: RateLimitResult) {
  return NextResponse.json(
    { error: "درخواست‌های شما بیش از حد مجاز است. لطفاً کمی بعد تلاش کنید." },
    { status: 429, headers: { "Retry-After": String(result.retryAfter), "Cache-Control": "no-store" } },
  );
}

// ── Back-compat key-based API (used by auth routes) ──
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const nowMs = Date.now();
  pruneExpiredEntries(nowMs);
  return checkBucket(entries, key, limit, windowMs, nowMs);
}

export function clearRateLimit(key: string) {
  entries.delete(key);
}

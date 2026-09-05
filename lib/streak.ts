// Correct streak + nearest-expiry calculations (Asia/Tehran day boundaries).
export function tehranDayKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  return parts; // YYYY-MM-DD
}

function addDaysTehran(dayKey: string, delta: number): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d) + delta * 86_400_000;
  const dt = new Date(utc);
  const y2 = dt.getUTCFullYear();
  const m2 = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d2 = String(dt.getUTCDate()).padStart(2, "0");
  return `${y2}-${m2}-${d2}`;
}

/** Consecutive active days ending today (or yesterday if today is empty — keeps streak alive). */
export function calcStreak(activeDates: Array<Date | string | number>, now = new Date()): number {
  const days = new Set<string>();
  for (const v of activeDates) {
    const d = v instanceof Date ? v : new Date(v);
    if (!Number.isNaN(d.getTime())) days.add(tehranDayKey(d));
  }
  if (!days.size) return 0;
  let cursor = tehranDayKey(now);
  if (!days.has(cursor)) cursor = addDaysTehran(cursor, -1);
  if (!days.has(cursor)) return 0;
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDaysTehran(cursor, -1);
  }
  return streak;
}

/** Nearest upcoming expiry among active dated items. Returns null when none. */
export function nearestExpiry<T extends { endDate?: Date | string | null; expiresAt?: Date | string | null }>(items: T[], now = new Date()): T | null {
  let best: T | null = null;
  let bestTime = Infinity;
  for (const item of items) {
    const raw = item.endDate ?? item.expiresAt ?? null;
    if (!raw) continue;
    const t = (raw instanceof Date ? raw : new Date(raw)).getTime();
    if (Number.isNaN(t) || t <= now.getTime()) continue;
    if (t < bestTime) {
      bestTime = t;
      best = item;
    }
  }
  return best;
}

export function daysUntil(date: Date | string, now = new Date()): number {
  const t = (date instanceof Date ? date : new Date(date)).getTime();
  return Math.max(0, Math.ceil((t - now.getTime()) / 86_400_000));
}

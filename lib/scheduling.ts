// Overlap / conflict helpers for trainer AND athlete calendars.
export type Interval = { startsAt: Date; endsAt: Date };

export function toInterval(startsAt: Date | string, endsAt: Date | string): Interval | null {
  const s = startsAt instanceof Date ? startsAt : new Date(startsAt);
  const e = endsAt instanceof Date ? endsAt : new Date(endsAt);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e <= s) return null;
  return { startsAt: s, endsAt: e };
}

export function intervalsOverlap(a: Interval, b: Interval): boolean {
  return a.startsAt < b.endsAt && b.startsAt < a.endsAt;
}

/** Return existing sessions conflicting with the candidate (trainer OR athlete overlap). */
export function findConflicts<T extends { id?: string; startsAt: Date | string; endsAt: Date | string }>(
  candidate: { startsAt: Date | string; endsAt: Date | string; id?: string },
  existing: T[],
): T[] {
  const cand = toInterval(candidate.startsAt, candidate.endsAt);
  if (!cand) return [];
  return existing.filter((item) => {
    if (candidate.id && item.id === candidate.id) return false;
    const iv = toInterval(item.startsAt, item.endsAt);
    return iv ? intervalsOverlap(cand, iv) : false;
  });
}

export function isWithinAvailability(
  startsAt: Date,
  endsAt: Date,
  slots: Array<{ dayOfWeek: number; startMinutes: number; endMinutes: number }>,
): boolean {
  if (!slots.length) return true;
  // Compare in Tehran wall-clock.
  const weekday = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tehran", weekday: "short" }).formatToParts(startsAt).find((p) => p.type === "weekday")?.value);
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dow = dayMap[String(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tehran", weekday: "short" }).format(startsAt))] ?? startsAt.getDay();
  void weekday;
  const mins = (d: Date) => {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
    const [h, m] = parts.split(":").map(Number);
    return h * 60 + m;
  };
  const s = mins(startsAt);
  const e = mins(endsAt);
  return slots.some((slot) => slot.dayOfWeek === dow && slot.startMinutes <= s && e <= slot.endMinutes);
}

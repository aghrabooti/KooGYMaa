// Client engagement: low-active students, unanswered threads, reminder prefs.
export type ActivityRow = { userId: string; lastActiveAt: Date | string | null };
export type ThreadRow = { id: string; authorId: string; recipientId: string; createdAt: Date | string; replies: Array<{ authorId: string; createdAt: Date | string }> };

export function lowActiveStudents(rows: ActivityRow[], inactiveDays = 7, now = new Date()): string[] {
  const cutoff = now.getTime() - inactiveDays * 86_400_000;
  return rows.filter((r) => !r.lastActiveAt || new Date(r.lastActiveAt).getTime() < cutoff).map((r) => r.userId);
}

export function unansweredThreads(threads: ThreadRow[], viewerId: string, waitHours = 24, now = new Date()): ThreadRow[] {
  const cutoff = now.getTime() - waitHours * 3_600_000;
  return threads.filter((t) => {
    if (new Date(t.createdAt).getTime() > cutoff) return false;
    const lastReply = t.replies[t.replies.length - 1];
    // Needs viewer's answer: last message is from the other side and viewer hasn't replied.
    if (lastReply && lastReply.authorId === viewerId) return false;
    if (!lastReply && t.authorId === viewerId) return false;
    return true;
  });
}

export type ReminderPrefs = {
  sessionReminderHours: number;
  expiryReminderDays: number;
  inactivityNudgeDays: number;
  enabled: boolean;
};

export const DEFAULT_REMINDER_PREFS: ReminderPrefs = {
  sessionReminderHours: 24,
  expiryReminderDays: 3,
  inactivityNudgeDays: 7,
  enabled: true,
};

export function validateReminderPrefs(value: unknown): { ok: true; data: ReminderPrefs } | { ok: false; error: string } {
  if (typeof value !== "object" || value === null) return { ok: false, error: "تنظیمات نامعتبر است." };
  const v = value as Record<string, unknown>;
  const num = (x: unknown, min: number, max: number, fallback: number) =>
    typeof x === "number" && Number.isFinite(x) && x >= min && x <= max ? Math.floor(x) : fallback;
  return {
    ok: true,
    data: {
      sessionReminderHours: num(v.sessionReminderHours, 1, 72, 24),
      expiryReminderDays: num(v.expiryReminderDays, 1, 30, 3),
      inactivityNudgeDays: num(v.inactivityNudgeDays, 1, 30, 7),
      enabled: v.enabled !== false,
    },
  };
}

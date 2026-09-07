import "server-only";
import { prisma } from "@/lib/prisma";
import { DEFAULT_REMINDER_PREFS, type ReminderPrefs } from "@/lib/engagement";

export async function ensurePrefsTable() {
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "NotificationPreference" (
    "userId" TEXT NOT NULL PRIMARY KEY REFERENCES "User"("id") ON DELETE CASCADE,
    "sessionReminderHours" INTEGER NOT NULL DEFAULT 24,
    "expiryReminderDays" INTEGER NOT NULL DEFAULT 3,
    "inactivityNudgeDays" INTEGER NOT NULL DEFAULT 7,
    "enabled" INTEGER NOT NULL DEFAULT 1
  )`);
}

export async function getPrefs(userId: string): Promise<ReminderPrefs> {
  await ensurePrefsTable();
  const rows = (await prisma.$queryRawUnsafe(`SELECT * FROM "NotificationPreference" WHERE "userId" = ?`, userId)) as Array<Record<string, unknown>>;
  const r = rows[0];
  if (!r) return { ...DEFAULT_REMINDER_PREFS };
  return {
    sessionReminderHours: Number(r.sessionReminderHours ?? 24),
    expiryReminderDays: Number(r.expiryReminderDays ?? 3),
    inactivityNudgeDays: Number(r.inactivityNudgeDays ?? 7),
    enabled: Number(r.enabled ?? 1) === 1,
  };
}

export async function savePrefs(userId: string, prefs: ReminderPrefs) {
  await ensurePrefsTable();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "NotificationPreference" ("userId","sessionReminderHours","expiryReminderDays","inactivityNudgeDays","enabled")
     VALUES (?,?,?,?,?)
     ON CONFLICT("userId") DO UPDATE SET "sessionReminderHours"=excluded."sessionReminderHours","expiryReminderDays"=excluded."expiryReminderDays","inactivityNudgeDays"=excluded."inactivityNudgeDays","enabled"=excluded."enabled"`,
    userId, prefs.sessionReminderHours, prefs.expiryReminderDays, prefs.inactivityNudgeDays, prefs.enabled ? 1 : 0,
  );
  return prefs;
}

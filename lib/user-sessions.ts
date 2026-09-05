import "server-only";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

export type UserSessionRow = {
  id: string;
  userId: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date;
  lastSeenAt: Date;
  revokedAt: Date | null;
};

async function ensureTable() {
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "UserSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" DATETIME
  )`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "UserSession_userId_idx" ON "UserSession"("userId")`);
}

export async function createUserSession(userId: string, ip: string | null, userAgent: string | null): Promise<string> {
  await ensureTable();
  const id = randomUUID();
  await prisma.$executeRawUnsafe(`INSERT INTO "UserSession" ("id","userId","ip","userAgent") VALUES (?,?,?,?)`, id, userId, ip, userAgent);
  return id;
}

export async function touchUserSession(id: string) {
  try {
    await prisma.$executeRawUnsafe(`UPDATE "UserSession" SET "lastSeenAt" = CURRENT_TIMESTAMP WHERE "id" = ?`, id);
  } catch { /* best effort */ }
}

export async function listUserSessions(userId: string): Promise<UserSessionRow[]> {
  await ensureTable();
  const rows = (await prisma.$queryRawUnsafe(`SELECT * FROM "UserSession" WHERE "userId" = ? ORDER BY "lastSeenAt" DESC LIMIT 20`, userId)) as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: String(r.id),
    userId: String(r.userId),
    ip: (r.ip as string | null) ?? null,
    userAgent: (r.userAgent as string | null) ?? null,
    createdAt: new Date(String(r.createdAt)),
    lastSeenAt: new Date(String(r.lastSeenAt)),
    revokedAt: r.revokedAt ? new Date(String(r.revokedAt)) : null,
  }));
}

export async function revokeUserSession(userId: string, sessionId: string): Promise<boolean> {
  await ensureTable();
  const n = await prisma.$executeRawUnsafe(`UPDATE "UserSession" SET "revokedAt" = CURRENT_TIMESTAMP WHERE "id" = ? AND "userId" = ? AND "revokedAt" IS NULL`, sessionId, userId);
  return Number(n) > 0;
}

export async function revokeAllOtherSessions(userId: string, exceptId: string) {
  await ensureTable();
  await prisma.$executeRawUnsafe(`UPDATE "UserSession" SET "revokedAt" = CURRENT_TIMESTAMP WHERE "userId" = ? AND "id" != ? AND "revokedAt" IS NULL`, userId, exceptId);
}

export async function isSessionRevoked(sessionId: string): Promise<boolean> {
  try {
    const rows = (await prisma.$queryRawUnsafe(`SELECT "revokedAt" FROM "UserSession" WHERE "id" = ?`, sessionId)) as Array<{ revokedAt: unknown }>;
    if (!rows.length) return false; // legacy sessions without a row stay valid
    return rows[0].revokedAt !== null;
  } catch {
    return false;
  }
}

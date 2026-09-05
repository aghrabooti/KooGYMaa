import "server-only";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

export type FitnessGoal = {
  id: string;
  userId: string;
  kind: string;
  target: number;
  unit: string;
  deadline: string | null;
  createdAt: string;
};

export async function ensureGoalsTable() {
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "FitnessGoal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "kind" TEXT NOT NULL,
    "target" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "deadline" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
}

export async function listGoals(userId: string): Promise<FitnessGoal[]> {
  await ensureGoalsTable();
  const rows = (await prisma.$queryRawUnsafe(`SELECT * FROM "FitnessGoal" WHERE "userId" = ? ORDER BY "createdAt" DESC`, userId)) as Array<Record<string, unknown>>;
  return rows.map((r) => ({
    id: String(r.id),
    userId: String(r.userId),
    kind: String(r.kind),
    target: Number(r.target),
    unit: String(r.unit),
    deadline: r.deadline ? String(r.deadline) : null,
    createdAt: String(r.createdAt),
  }));
}

export async function createGoal(userId: string, input: { kind: string; target: number; unit: string; deadline?: string | null }): Promise<FitnessGoal> {
  await ensureGoalsTable();
  const id = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "FitnessGoal" ("id","userId","kind","target","unit","deadline") VALUES (?,?,?,?,?,?)`,
    id, userId, input.kind.slice(0, 40), input.target, input.unit.slice(0, 20), input.deadline || null,
  );
  const rows = (await prisma.$queryRawUnsafe(`SELECT * FROM "FitnessGoal" WHERE "id" = ?`, id)) as Array<Record<string, unknown>>;
  const r = rows[0];
  return { id: String(r.id), userId: String(r.userId), kind: String(r.kind), target: Number(r.target), unit: String(r.unit), deadline: r.deadline ? String(r.deadline) : null, createdAt: String(r.createdAt) };
}

export async function deleteGoal(userId: string, goalId: string): Promise<boolean> {
  await ensureGoalsTable();
  const n = await prisma.$executeRawUnsafe(`DELETE FROM "FitnessGoal" WHERE "id" = ? AND "userId" = ?`, goalId, userId);
  return Number(n) > 0;
}

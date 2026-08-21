import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { validateWorkoutLogUpdate } from "@/lib/progress-validation";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ logId: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const authorization = await authorizeApiRequest(request, ["USER"]);
  if (!authorization.ok) return authorization.response;
  const log = await prisma.workoutLog.findFirst({
    where: { id: (await params).logId, userId: authorization.user.id },
    select: { id: true, status: true, startedAt: true, completedAt: true, perceivedEffort: true, notes: true, workoutDay: { select: { id: true, name: true, notes: true, plan: { select: { title: true, version: true } } } }, exerciseLogs: { orderBy: { exercise: { order: "asc" } }, select: { id: true, exerciseId: true, completed: true, actualSets: true, actualReps: true, actualWeight: true, actualDurationSeconds: true, actualDistanceMeters: true, rpe: true, notes: true, exercise: { select: { name: true, sets: true, reps: true, weight: true, tempo: true, restSeconds: true, durationSeconds: true, distanceMeters: true, notes: true } } } } },
  });
  if (!log) return NextResponse.json({ error: "Workout log not found." }, { status: 404 });
  return NextResponse.json({ log }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const authorization = await authorizeApiRequest(request, ["USER"]);
  if (!authorization.ok) return authorization.response;
  const { logId } = await params;
  const validation = validateWorkoutLogUpdate(await request.json().catch(() => null));
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  const existing = await prisma.workoutLog.findFirst({ where: { id: logId, userId: authorization.user.id }, select: { id: true, exerciseLogs: { select: { exerciseId: true } } } });
  if (!existing) return NextResponse.json({ error: "Workout log not found." }, { status: 404 });
  const allowed = new Set(existing.exerciseLogs.map((item) => item.exerciseId));
  if (validation.data.exercises?.some((item) => !allowed.has(item.exerciseId))) return NextResponse.json({ error: "Exercise does not belong to this workout log." }, { status: 403 });

  const log = await prisma.$transaction(async (transaction) => {
    if (validation.data.exercises) {
      for (const exercise of validation.data.exercises) {
        await transaction.exerciseLog.update({ where: { workoutLogId_exerciseId: { workoutLogId: existing.id, exerciseId: exercise.exerciseId } }, data: { completed: exercise.completed, actualSets: exercise.actualSets, actualReps: exercise.actualReps, actualWeight: exercise.actualWeight, actualDurationSeconds: exercise.actualDurationSeconds, actualDistanceMeters: exercise.actualDistanceMeters, rpe: exercise.rpe, notes: exercise.notes } });
      }
    }
    return transaction.workoutLog.update({
      where: { id: existing.id },
      data: { ...(validation.data.status ? { status: validation.data.status, completedAt: validation.data.status === "COMPLETED" ? new Date() : null } : {}), ...(validation.data.perceivedEffort !== undefined ? { perceivedEffort: validation.data.perceivedEffort } : {}), ...(validation.data.notes !== undefined ? { notes: validation.data.notes } : {}) },
      select: { id: true, status: true, completedAt: true, perceivedEffort: true },
    });
  });
  return NextResponse.json({ log });
}

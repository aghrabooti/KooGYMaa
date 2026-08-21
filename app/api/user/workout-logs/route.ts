import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { validateStartLog } from "@/lib/progress-validation";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authorization = await authorizeApiRequest(request, ["USER"]);
  if (!authorization.ok) return authorization.response;
  const logs = await prisma.workoutLog.findMany({
    where: { userId: authorization.user.id },
    select: { id: true, status: true, startedAt: true, completedAt: true, perceivedEffort: true, notes: true, workoutDay: { select: { name: true, plan: { select: { title: true, version: true } } } }, _count: { select: { exerciseLogs: true } } },
    orderBy: { startedAt: "desc" }, take: 50,
  });
  return NextResponse.json({ logs }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const authorization = await authorizeApiRequest(request, ["USER"]);
  if (!authorization.ok) return authorization.response;
  const validation = validateStartLog(await request.json().catch(() => null));
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  const assignment = await prisma.workoutAssignment.findFirst({
    where: { id: validation.data.assignmentId, userId: authorization.user.id, status: "ACTIVE", plan: { days: { some: { id: validation.data.dayId } } } },
    select: { id: true, plan: { select: { days: { where: { id: validation.data.dayId }, select: { id: true, exercises: { select: { id: true } } }, take: 1 } } } },
  });
  const day = assignment?.plan.days[0];
  if (!assignment || !day) return NextResponse.json({ error: "Active workout assignment or day not found." }, { status: 404 });

  const log = await prisma.workoutLog.create({
    data: { assignmentId: assignment.id, userId: authorization.user.id, workoutDayId: day.id, status: "IN_PROGRESS", exerciseLogs: { create: day.exercises.map((exercise) => ({ exerciseId: exercise.id })) } },
    select: { id: true, status: true, startedAt: true },
  });
  return NextResponse.json({ log }, { status: 201 });
}

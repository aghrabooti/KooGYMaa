import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { authorizeTrainerRequest } from "@/lib/trainer-access";
import { validateCloneMode } from "@/lib/plan-validation";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ planId: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const authorization = await authorizeTrainerRequest(request);
  if (!authorization.ok) return authorization.response;
  const { planId } = await params;
  const validation = validateCloneMode(await request.json().catch(() => null));
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  const source = await prisma.workoutPlan.findFirst({
    where: { id: planId, trainerId: authorization.access.profile.id },
    select: {
      id: true, familyId: true, gymId: true, title: true, description: true, isTemplate: true,
      days: { orderBy: { dayNumber: "asc" }, select: { name: true, notes: true, exercises: { orderBy: { order: "asc" }, select: { name: true, sets: true, reps: true, weight: true, tempo: true, restSeconds: true, durationSeconds: true, distanceMeters: true, notes: true } } } },
    },
  });
  if (!source) return NextResponse.json({ error: "Workout plan not found." }, { status: 404 });

  const nextVersion = validation.data.mode === "version"
    ? ((await prisma.workoutPlan.aggregate({ where: { familyId: source.familyId }, _max: { version: true } }))._max.version || 0) + 1
    : 1;
  try {
    const plan = await prisma.workoutPlan.create({
      data: {
        trainerId: authorization.access.profile.id,
        gymId: source.gymId,
        familyId: validation.data.mode === "version" ? source.familyId : randomUUID(),
        sourcePlanId: source.id,
        title: validation.data.mode === "version" ? source.title : `${source.title} Copy`,
        description: source.description,
        status: "DRAFT",
        version: nextVersion,
        isTemplate: source.isTemplate,
        days: { create: source.days.map((day, dayIndex) => ({ dayNumber: dayIndex + 1, name: day.name, notes: day.notes, exercises: { create: day.exercises.map((exercise, exerciseIndex) => ({ ...exercise, order: exerciseIndex + 1 })) } })) },
      },
      select: { id: true, title: true, version: true, status: true },
    });
    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") return NextResponse.json({ error: "A newer version was created. Refresh and try again." }, { status: 409 });
    throw error;
  }
}

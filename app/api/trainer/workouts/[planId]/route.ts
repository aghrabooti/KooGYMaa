import { NextResponse, type NextRequest } from "next/server";
import { authorizeTrainerRequest } from "@/lib/trainer-access";
import { validatePlanStatus, validateWorkoutPlan } from "@/lib/plan-validation";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ planId: string }> };

async function ownedPlan(trainerId: string, planId: string) {
  return prisma.workoutPlan.findFirst({
    where: { id: planId, trainerId },
    select: {
      id: true, familyId: true, sourcePlanId: true, title: true, description: true, status: true,
      version: true, isTemplate: true, publishedAt: true, gymId: true,
      gym: { select: { id: true, name: true } },
      days: { orderBy: { dayNumber: "asc" }, select: { id: true, dayNumber: true, name: true, notes: true, exercises: { orderBy: { order: "asc" }, select: { id: true, order: true, name: true, sets: true, reps: true, weight: true, tempo: true, restSeconds: true, durationSeconds: true, distanceMeters: true, notes: true } } } },
      assignments: { orderBy: { assignedAt: "desc" }, select: { id: true, status: true, assignedAt: true, startDate: true, endDate: true, trainerClient: { select: { id: true, user: { select: { name: true, email: true } } } } } },
      _count: { select: { assignments: true } },
    },
  });
}

export async function GET(request: NextRequest, { params }: Context) {
  const authorization = await authorizeTrainerRequest(request);
  if (!authorization.ok) return authorization.response;
  const { planId } = await params;
  const plan = await ownedPlan(authorization.access.profile.id, planId);
  if (!plan) return NextResponse.json({ error: "Workout plan not found." }, { status: 404 });
  return NextResponse.json({ plan }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: NextRequest, { params }: Context) {
  const authorization = await authorizeTrainerRequest(request);
  if (!authorization.ok) return authorization.response;
  const { planId } = await params;
  const current = await prisma.workoutPlan.findFirst({ where: { id: planId, trainerId: authorization.access.profile.id }, select: { id: true, status: true, _count: { select: { assignments: true } } } });
  if (!current) return NextResponse.json({ error: "Workout plan not found." }, { status: 404 });
  if (current.status !== "DRAFT" || current._count.assignments > 0) return NextResponse.json({ error: "Assigned or published plans are immutable. Create a new version to edit them." }, { status: 409 });

  const body = await request.json().catch(() => null);
  const validation = validateWorkoutPlan(body);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  if (validation.data.gymId) {
    const membership = await prisma.gymTrainer.findUnique({ where: { gymId_trainerId: { gymId: validation.data.gymId, trainerId: authorization.access.profile.id } }, select: { status: true } });
    if (membership?.status !== "ACTIVE") return NextResponse.json({ error: "You are not active at the selected gym." }, { status: 403 });
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.workoutDay.deleteMany({ where: { planId: current.id } });
    await transaction.workoutPlan.update({
      where: { id: current.id },
      data: {
        title: validation.data.title, description: validation.data.description, gymId: validation.data.gymId, isTemplate: validation.data.isTemplate,
        days: { create: validation.data.days.map((day, dayIndex) => ({ dayNumber: dayIndex + 1, name: day.name, notes: day.notes, exercises: { create: day.exercises.map((exercise, exerciseIndex) => ({ ...exercise, order: exerciseIndex + 1 })) } })) },
      },
    });
  });
  return NextResponse.json({ message: "Workout plan saved." });
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const authorization = await authorizeTrainerRequest(request);
  if (!authorization.ok) return authorization.response;
  const { planId } = await params;
  const current = await prisma.workoutPlan.findFirst({ where: { id: planId, trainerId: authorization.access.profile.id }, select: { id: true, status: true, _count: { select: { days: true, assignments: true } } } });
  if (!current) return NextResponse.json({ error: "Workout plan not found." }, { status: 404 });
  const validation = validatePlanStatus(await request.json().catch(() => null));
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  if (validation.data.status === "ACTIVE") {
    const exerciseCount = await prisma.workoutExercise.count({ where: { day: { planId: current.id } } });
    if (current._count.days === 0 || exerciseCount === 0) return NextResponse.json({ error: "Add at least one day and exercise before publishing." }, { status: 409 });
  }
  if (validation.data.status === "DRAFT" && current._count.assignments > 0) return NextResponse.json({ error: "Assigned plans cannot return to draft." }, { status: 409 });
  const plan = await prisma.workoutPlan.update({ where: { id: current.id }, data: { status: validation.data.status, ...(validation.data.status === "ACTIVE" ? { publishedAt: new Date() } : {}) }, select: { id: true, status: true, publishedAt: true } });
  return NextResponse.json({ plan });
}

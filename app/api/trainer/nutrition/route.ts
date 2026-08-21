import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { authorizeTrainerRequest } from "@/lib/trainer-access";
import { validateDietPlan } from "@/lib/plan-validation";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authorization = await authorizeTrainerRequest(request);
  if (!authorization.ok) return authorization.response;
  const plans = await prisma.dietPlan.findMany({
    where: { trainerId: authorization.access.profile.id },
    select: {
      id: true, familyId: true, title: true, description: true, dailyCalories: true,
      dietaryRestrictions: true, status: true, version: true, isTemplate: true,
      publishedAt: true, updatedAt: true, gym: { select: { id: true, name: true } },
      _count: { select: { days: true, assignments: true, derivedPlans: true } },
    },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });
  return NextResponse.json({ plans }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const authorization = await authorizeTrainerRequest(request);
  if (!authorization.ok) return authorization.response;
  const validation = validateDietPlan(await request.json().catch(() => null));
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  if (validation.data.gymId) {
    const membership = await prisma.gymTrainer.findUnique({ where: { gymId_trainerId: { gymId: validation.data.gymId, trainerId: authorization.access.profile.id } }, select: { status: true } });
    if (membership?.status !== "ACTIVE") return NextResponse.json({ error: "You are not active at the selected gym." }, { status: 403 });
  }

  const plan = await prisma.dietPlan.create({
    data: {
      trainerId: authorization.access.profile.id, gymId: validation.data.gymId, familyId: randomUUID(),
      title: validation.data.title, description: validation.data.description,
      dietaryRestrictions: validation.data.dietaryRestrictions, dailyCalories: validation.data.dailyCalories,
      isTemplate: validation.data.isTemplate, status: "DRAFT",
      days: { create: validation.data.days.map((day, dayIndex) => ({
        dayNumber: dayIndex + 1, name: day.name, notes: day.notes,
        targetCalories: day.targetCalories, targetProtein: day.targetProtein, targetCarbs: day.targetCarbs, targetFat: day.targetFat,
        meals: { create: day.meals.map((meal, mealIndex) => ({ name: meal.name, order: mealIndex + 1, scheduledTime: meal.scheduledTime, notes: meal.notes, foodItems: { create: meal.foodItems.map((food, foodIndex) => ({ ...food, order: foodIndex + 1 })) } })) },
      })) },
    },
    select: { id: true, title: true, status: true, version: true },
  });
  return NextResponse.json({ plan }, { status: 201 });
}

import { NextResponse, type NextRequest } from "next/server";
import { authorizeTrainerRequest } from "@/lib/trainer-access";
import { validateDietPlan, validatePlanStatus } from "@/lib/plan-validation";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ planId: string }> };

async function ownedPlan(trainerId: string, planId: string) {
  return prisma.dietPlan.findFirst({
    where: { id: planId, trainerId },
    select: {
      id: true, familyId: true, sourcePlanId: true, title: true, description: true,
      dietaryRestrictions: true, dailyCalories: true, status: true, version: true,
      isTemplate: true, publishedAt: true, gymId: true, gym: { select: { id: true, name: true } },
      days: { orderBy: { dayNumber: "asc" }, select: {
        id: true, dayNumber: true, name: true, notes: true, targetCalories: true,
        targetProtein: true, targetCarbs: true, targetFat: true,
        meals: { orderBy: { order: "asc" }, select: { id: true, order: true, name: true, scheduledTime: true, notes: true, foodItems: { orderBy: { order: "asc" }, select: { id: true, order: true, name: true, quantity: true, unit: true, calories: true, protein: true, carbs: true, fat: true, notes: true } } } },
      } },
      assignments: { orderBy: { assignedAt: "desc" }, select: { id: true, status: true, assignedAt: true, startDate: true, endDate: true, trainerClient: { select: { id: true, user: { select: { name: true, email: true } } } } } },
      _count: { select: { assignments: true } },
    },
  });
}

export async function GET(request: NextRequest, { params }: Context) {
  const authorization = await authorizeTrainerRequest(request);
  if (!authorization.ok) return authorization.response;
  const plan = await ownedPlan(authorization.access.profile.id, (await params).planId);
  if (!plan) return NextResponse.json({ error: "Nutrition plan not found." }, { status: 404 });
  return NextResponse.json({ plan }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: NextRequest, { params }: Context) {
  const authorization = await authorizeTrainerRequest(request);
  if (!authorization.ok) return authorization.response;
  const { planId } = await params;
  const current = await prisma.dietPlan.findFirst({ where: { id: planId, trainerId: authorization.access.profile.id }, select: { id: true, status: true, _count: { select: { assignments: true } } } });
  if (!current) return NextResponse.json({ error: "Nutrition plan not found." }, { status: 404 });
  if (current.status !== "DRAFT" || current._count.assignments > 0) return NextResponse.json({ error: "Assigned or published plans are immutable. Create a new version to edit them." }, { status: 409 });
  const validation = validateDietPlan(await request.json().catch(() => null));
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  if (validation.data.gymId) {
    const membership = await prisma.gymTrainer.findUnique({ where: { gymId_trainerId: { gymId: validation.data.gymId, trainerId: authorization.access.profile.id } }, select: { status: true } });
    if (membership?.status !== "ACTIVE") return NextResponse.json({ error: "You are not active at the selected gym." }, { status: 403 });
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.dietDay.deleteMany({ where: { planId: current.id } });
    await transaction.dietPlan.update({
      where: { id: current.id },
      data: {
        title: validation.data.title, description: validation.data.description, dietaryRestrictions: validation.data.dietaryRestrictions,
        dailyCalories: validation.data.dailyCalories, gymId: validation.data.gymId, isTemplate: validation.data.isTemplate,
        days: { create: validation.data.days.map((day, dayIndex) => ({ dayNumber: dayIndex + 1, name: day.name, notes: day.notes, targetCalories: day.targetCalories, targetProtein: day.targetProtein, targetCarbs: day.targetCarbs, targetFat: day.targetFat, meals: { create: day.meals.map((meal, mealIndex) => ({ name: meal.name, order: mealIndex + 1, scheduledTime: meal.scheduledTime, notes: meal.notes, foodItems: { create: meal.foodItems.map((food, foodIndex) => ({ ...food, order: foodIndex + 1 })) } })) } })) },
      },
    });
  });
  return NextResponse.json({ message: "Nutrition plan saved." });
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const authorization = await authorizeTrainerRequest(request);
  if (!authorization.ok) return authorization.response;
  const { planId } = await params;
  const current = await prisma.dietPlan.findFirst({ where: { id: planId, trainerId: authorization.access.profile.id }, select: { id: true, _count: { select: { days: true, assignments: true } } } });
  if (!current) return NextResponse.json({ error: "Nutrition plan not found." }, { status: 404 });
  const validation = validatePlanStatus(await request.json().catch(() => null));
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  if (validation.data.status === "ACTIVE") {
    const foodCount = await prisma.foodItem.count({ where: { meal: { day: { planId: current.id } } } });
    if (current._count.days === 0 || foodCount === 0) return NextResponse.json({ error: "Add at least one day, meal, and food item before publishing." }, { status: 409 });
  }
  if (validation.data.status === "DRAFT" && current._count.assignments > 0) return NextResponse.json({ error: "Assigned plans cannot return to draft." }, { status: 409 });
  const plan = await prisma.dietPlan.update({ where: { id: current.id }, data: { status: validation.data.status, ...(validation.data.status === "ACTIVE" ? { publishedAt: new Date() } : {}) }, select: { id: true, status: true, publishedAt: true } });
  return NextResponse.json({ plan });
}

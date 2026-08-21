import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { validateNutritionLogUpdate } from "@/lib/progress-validation";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ logId: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const authorization = await authorizeApiRequest(request, ["USER"]);
  if (!authorization.ok) return authorization.response;
  const log = await prisma.nutritionLog.findFirst({
    where: { id: (await params).logId, userId: authorization.user.id },
    select: {
      id: true,
      logDate: true,
      completedAt: true,
      hungerRating: true,
      energyRating: true,
      notes: true,
      dietDay: {
        select: {
          name: true,
          targetCalories: true,
          targetProtein: true,
          targetCarbs: true,
          targetFat: true,
          plan: { select: { title: true, version: true } },
        },
      },
      mealLogs: {
        orderBy: { meal: { order: "asc" } },
        select: {
          id: true,
          mealId: true,
          completed: true,
          actualPortion: true,
          substitution: true,
          notes: true,
          meal: {
            select: {
              name: true,
              scheduledTime: true,
              notes: true,
              foodItems: {
                orderBy: { order: "asc" },
                select: {
                  id: true,
                  name: true,
                  quantity: true,
                  unit: true,
                  calories: true,
                  protein: true,
                  carbs: true,
                  fat: true,
                },
              },
            },
          },
        },
      },
    },
  });
  if (!log) return NextResponse.json({ error: "Nutrition log not found." }, { status: 404 });
  return NextResponse.json({ log }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const authorization = await authorizeApiRequest(request, ["USER"]);
  if (!authorization.ok) return authorization.response;
  const { logId } = await params;
  const validation = validateNutritionLogUpdate(await request.json().catch(() => null));
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  const existing = await prisma.nutritionLog.findFirst({
    where: { id: logId, userId: authorization.user.id },
    select: { id: true, mealLogs: { select: { mealId: true } } },
  });
  if (!existing) return NextResponse.json({ error: "Nutrition log not found." }, { status: 404 });
  const allowed = new Set(existing.mealLogs.map((item) => item.mealId));
  if (validation.data.meals.some((item) => !allowed.has(item.mealId))) {
    return NextResponse.json({ error: "Meal does not belong to this nutrition log." }, { status: 403 });
  }

  const log = await prisma.$transaction(async (transaction) => {
    for (const meal of validation.data.meals) {
      await transaction.mealLog.update({
        where: { nutritionLogId_mealId: { nutritionLogId: existing.id, mealId: meal.mealId } },
        data: {
          completed: meal.completed,
          actualPortion: meal.actualPortion,
          substitution: meal.substitution,
          notes: meal.notes,
        },
      });
    }
    return transaction.nutritionLog.update({
      where: { id: existing.id },
      data: {
        hungerRating: validation.data.hungerRating,
        energyRating: validation.data.energyRating,
        notes: validation.data.notes,
        completedAt: validation.data.completed ? new Date() : null,
      },
      select: { id: true, completedAt: true, hungerRating: true, energyRating: true },
    });
  });
  return NextResponse.json({ log });
}

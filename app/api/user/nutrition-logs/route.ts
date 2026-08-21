import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { validateStartLog } from "@/lib/progress-validation";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authorization = await authorizeApiRequest(request, ["USER"]);
  if (!authorization.ok) return authorization.response;
  const logs = await prisma.nutritionLog.findMany({ where: { userId: authorization.user.id }, select: { id: true, logDate: true, completedAt: true, hungerRating: true, energyRating: true, dietDay: { select: { name: true, plan: { select: { title: true, version: true } } } }, mealLogs: { select: { completed: true } } }, orderBy: { logDate: "desc" }, take: 60 });
  return NextResponse.json({ logs }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const authorization = await authorizeApiRequest(request, ["USER"]);
  if (!authorization.ok) return authorization.response;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const validation = validateStartLog(body);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  const rawDate = body?.logDate ? new Date(String(body.logDate)) : new Date();
  if (Number.isNaN(rawDate.getTime())) return NextResponse.json({ error: "Log date is invalid." }, { status: 400 });
  const logDate = new Date(Date.UTC(rawDate.getUTCFullYear(), rawDate.getUTCMonth(), rawDate.getUTCDate()));

  const assignment = await prisma.dietAssignment.findFirst({
    where: { id: validation.data.assignmentId, userId: authorization.user.id, status: "ACTIVE", plan: { days: { some: { id: validation.data.dayId } } } },
    select: { id: true, plan: { select: { days: { where: { id: validation.data.dayId }, select: { id: true, meals: { select: { id: true } } }, take: 1 } } } },
  });
  const day = assignment?.plan.days[0];
  if (!assignment || !day) return NextResponse.json({ error: "Active nutrition assignment or day not found." }, { status: 404 });

  const log = await prisma.nutritionLog.upsert({
    where: { assignmentId_dietDayId_logDate: { assignmentId: assignment.id, dietDayId: day.id, logDate } },
    update: {},
    create: { assignmentId: assignment.id, userId: authorization.user.id, dietDayId: day.id, logDate, mealLogs: { create: day.meals.map((meal) => ({ mealId: meal.id })) } },
    select: { id: true, logDate: true, completedAt: true },
  });
  return NextResponse.json({ log }, { status: 201 });
}

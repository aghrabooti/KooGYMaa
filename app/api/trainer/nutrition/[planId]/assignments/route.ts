import { NextResponse, type NextRequest } from "next/server";
import { authorizeTrainerRequest } from "@/lib/trainer-access";
import { validatePlanAssignment } from "@/lib/plan-validation";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ planId: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const authorization = await authorizeTrainerRequest(request);
  if (!authorization.ok) return authorization.response;
  const { planId } = await params;
  const validation = validatePlanAssignment(await request.json().catch(() => null));
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  const [plan, client] = await Promise.all([
    prisma.dietPlan.findFirst({ where: { id: planId, trainerId: authorization.access.profile.id, status: "ACTIVE" }, select: { id: true, title: true } }),
    prisma.trainerClient.findFirst({ where: { id: validation.data.trainerClientId, trainerId: authorization.access.profile.id, status: "ACTIVE" }, select: { id: true, userId: true } }),
  ]);
  if (!plan) return NextResponse.json({ error: "Publish this nutrition plan before assigning it." }, { status: 409 });
  if (!client) return NextResponse.json({ error: "Choose one of your active students." }, { status: 404 });

  const assignment = await prisma.$transaction(async (transaction) => {
    await transaction.dietAssignment.updateMany({ where: { trainerClientId: client.id, status: { in: ["ASSIGNED", "ACTIVE"] } }, data: { status: "CANCELLED" } });
    const created = await transaction.dietAssignment.upsert({
      where: { planId_userId: { planId: plan.id, userId: client.userId } },
      update: { trainerClientId: client.id, status: "ACTIVE", assignedAt: new Date(), startDate: validation.data.startDate ?? new Date(), endDate: validation.data.endDate },
      create: { planId: plan.id, userId: client.userId, trainerClientId: client.id, status: "ACTIVE", startDate: validation.data.startDate ?? new Date(), endDate: validation.data.endDate },
      select: { id: true, status: true, assignedAt: true },
    });
    await transaction.notification.create({ data: { userId: client.userId, type: "PLAN_ASSIGNED", title: "New nutrition plan", message: `${plan.title} is ready for you.`, href: "/user/nutrition" } });
    return created;
  });
  return NextResponse.json({ assignment }, { status: 201 });
}

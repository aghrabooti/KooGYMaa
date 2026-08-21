import { NextResponse, type NextRequest } from "next/server";
import { authorizeGymAdminRequest } from "@/lib/admin-access";
import { validateSubscriptionCreate } from "@/lib/admin-validation";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ gymId: string }> };

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function GET(request: NextRequest, { params }: Context) {
  const { gymId } = await params;
  const authorization = await authorizeGymAdminRequest(request, gymId);
  if (!authorization.ok) return authorization.response;

  const subscriptions = await prisma.subscription.findMany({
    where: { gymId },
    select: {
      id: true,
      status: true,
      pricePaid: true,
      currency: true,
      startDate: true,
      endDate: true,
      autoRenew: true,
      cancelledAt: true,
      subscriber: {
        select: { id: true, name: true, email: true, role: true, status: true },
      },
      plan: {
        select: { id: true, name: true, audience: true, durationDays: true },
      },
    },
    orderBy: [{ status: "asc" }, { endDate: "asc" }],
  });

  return NextResponse.json({ subscriptions }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest, { params }: Context) {
  const { gymId } = await params;
  const authorization = await authorizeGymAdminRequest(request, gymId);
  if (!authorization.ok) return authorization.response;

  const body = await request.json().catch(() => null);
  const validation = validateSubscriptionCreate(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const plan = await prisma.subscriptionPlan.findFirst({
    where: { id: validation.data.planId, gymId, isActive: true },
    select: {
      id: true,
      audience: true,
      price: true,
      currency: true,
      durationDays: true,
    },
  });
  if (!plan) {
    return NextResponse.json({ error: "Active subscription plan not found in this gym." }, { status: 404 });
  }

  const expectedRole = plan.audience === "TRAINER" ? "TRAINER" : "USER";
  const subscriber = await prisma.user.findFirst({
    where: {
      email: validation.data.subscriberEmail,
      role: expectedRole,
      status: "ACTIVE",
    },
    select: {
      id: true,
      trainerProfile: { select: { id: true } },
    },
  });
  if (!subscriber || (plan.audience === "TRAINER" && !subscriber.trainerProfile)) {
    return NextResponse.json(
      { error: `No active ${plan.audience.toLowerCase()} account was found for this email.` },
      { status: 404 },
    );
  }

  const now = new Date();
  const endDate = addDays(now, plan.durationDays);
  const subscription = await prisma.$transaction(async (transaction) => {
    const created = await transaction.subscription.create({
      data: {
        subscriberId: subscriber.id,
        gymId,
        planId: plan.id,
        status: "ACTIVE",
        pricePaid: plan.price,
        currency: plan.currency,
        startDate: now,
        endDate,
        autoRenew: validation.data.autoRenew,
      },
      select: { id: true, status: true, startDate: true, endDate: true },
    });

    if (plan.audience === "MEMBER") {
      await transaction.gymMembership.upsert({
        where: { gymId_userId: { gymId, userId: subscriber.id } },
        update: {
          status: "ACTIVE",
          reviewedAt: now,
          reviewedById: authorization.access.user.id,
          startedAt: now,
          expiresAt: endDate,
          endedAt: null,
        },
        create: {
          gymId,
          userId: subscriber.id,
          status: "ACTIVE",
          reviewedAt: now,
          reviewedById: authorization.access.user.id,
          startedAt: now,
          expiresAt: endDate,
        },
      });
    } else if (subscriber.trainerProfile) {
      await transaction.gymTrainer.upsert({
        where: {
          gymId_trainerId: {
            gymId,
            trainerId: subscriber.trainerProfile.id,
          },
        },
        update: {
          status: "ACTIVE",
          reviewedAt: now,
          reviewedById: authorization.access.user.id,
          startedAt: now,
          endedAt: null,
        },
        create: {
          gymId,
          trainerId: subscriber.trainerProfile.id,
          status: "ACTIVE",
          reviewedAt: now,
          reviewedById: authorization.access.user.id,
          startedAt: now,
        },
      });
    }

    return created;
  });

  return NextResponse.json({ subscription }, { status: 201 });
}

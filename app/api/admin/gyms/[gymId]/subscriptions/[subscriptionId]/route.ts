import { NextResponse, type NextRequest } from "next/server";
import { authorizeGymAdminRequest } from "@/lib/admin-access";
import { validateSubscriptionUpdate } from "@/lib/admin-validation";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";

type Context = { params: Promise<{ gymId: string; subscriptionId: string }> };

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { gymId, subscriptionId } = await params;
  const authorization = await authorizeGymAdminRequest(request, gymId);
  if (!authorization.ok) return authorization.response;

  const body = await request.json().catch(() => null);
  const validation = validateSubscriptionUpdate(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const existing = await prisma.subscription.findFirst({
    where: { id: subscriptionId, gymId },
    select: {
      id: true,
      subscriberId: true,
      endDate: true,
      plan: { select: { audience: true } },
      subscriber: { select: { trainerProfile: { select: { id: true } } } },
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "Subscription not found in this gym." }, { status: 404 });
  }

  const now = new Date();
  const endDate = validation.data.extendDays
    ? addDays(existing.endDate > now ? existing.endDate : now, validation.data.extendDays)
    : existing.endDate;
  const requestedStatus = validation.data.status;

  const subscription = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.subscription.update({
      where: { id: existing.id },
      data: {
        ...(requestedStatus ? { status: requestedStatus } : {}),
        ...(validation.data.autoRenew !== undefined
          ? { autoRenew: validation.data.autoRenew }
          : {}),
        ...(validation.data.extendDays ? { endDate, status: "ACTIVE" } : {}),
        ...(requestedStatus === "CANCELLED" ? { cancelledAt: now } : {}),
        ...(requestedStatus === "ACTIVE" ? { cancelledAt: null } : {}),
      },
      select: {
        id: true,
        status: true,
        endDate: true,
        autoRenew: true,
        cancelledAt: true,
      },
    });

    const activatesAccess = updated.status === "ACTIVE";
    if (existing.plan.audience === "MEMBER") {
      if (activatesAccess) {
        await transaction.gymMembership.updateMany({
          where: { gymId, userId: existing.subscriberId },
          data: { status: "ACTIVE", expiresAt: endDate, endedAt: null },
        });
      } else if (updated.status === "CANCELLED" || updated.status === "EXPIRED") {
        const otherActive = await transaction.subscription.count({
          where: {
            id: { not: existing.id },
            gymId,
            subscriberId: existing.subscriberId,
            status: "ACTIVE",
            endDate: { gt: now },
            plan: { audience: "MEMBER" },
          },
        });
        if (otherActive === 0) {
          await transaction.gymMembership.updateMany({
            where: { gymId, userId: existing.subscriberId },
            data: { status: updated.status, endedAt: now },
          });
        }
      }
    } else if (existing.subscriber.trainerProfile) {
      const trainerId = existing.subscriber.trainerProfile.id;
      if (activatesAccess) {
        await transaction.gymTrainer.updateMany({
          where: { gymId, trainerId },
          data: { status: "ACTIVE", endedAt: null },
        });
      } else if (updated.status === "CANCELLED" || updated.status === "EXPIRED") {
        const otherActive = await transaction.subscription.count({
          where: {
            id: { not: existing.id },
            gymId,
            subscriberId: existing.subscriberId,
            status: "ACTIVE",
            endDate: { gt: now },
            plan: { audience: "TRAINER" },
          },
        });
        if (otherActive === 0) {
          await transaction.gymTrainer.updateMany({
            where: { gymId, trainerId },
            data: { status: updated.status, endedAt: now },
          });
        }
      }
    }

    return updated;
  });

  await recordAudit({ action: "SUBSCRIPTION_UPDATED", actorId: authorization.access.user.id, actorRole: authorization.access.user.role, gymId, entityType: "Subscription", entityId: subscription.id, metadata: { status: subscription.status, extendDays: validation.data.extendDays || null }, request });
  return NextResponse.json({ subscription });
}

import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ subscriptionId: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const authorization = await authorizeApiRequest(request, ["USER"]);
  if (!authorization.ok) return authorization.response;
  const { subscriptionId } = await params;
  const subscription = await prisma.subscription.findFirst({ where: { id: subscriptionId, subscriberId: authorization.user.id, status: { in: ["PENDING", "ACTIVE", "PAST_DUE"] } }, select: { id: true, gymId: true } });
  if (!subscription) return NextResponse.json({ error: "Cancellable subscription not found." }, { status: 404 });
  const now = new Date();
  await prisma.$transaction(async (transaction) => {
    await transaction.subscription.update({ where: { id: subscription.id }, data: { status: "CANCELLED", cancelledAt: now, autoRenew: false } });
    await transaction.payment.updateMany({ where: { subscriptionId: subscription.id, status: { in: ["PENDING", "PROCESSING"] } }, data: { status: "CANCELLED" } });
    const other = await transaction.subscription.count({ where: { id: { not: subscription.id }, subscriberId: authorization.user.id, gymId: subscription.gymId, status: "ACTIVE", endDate: { gt: now } } });
    if (!other) await transaction.gymMembership.updateMany({ where: { gymId: subscription.gymId, userId: authorization.user.id }, data: { status: "CANCELLED", endedAt: now } });
    await transaction.auditLog.create({ data: { actorId: authorization.user.id, actorRole: "USER", gymId: subscription.gymId, action: "SUBSCRIPTION_CANCELLED", entityType: "Subscription", entityId: subscription.id } });
  });
  return NextResponse.json({ message: "Subscription cancelled." });
}

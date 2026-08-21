import "server-only";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { demoCheckoutUrl, getPaymentProvider, verifyCheckoutToken } from "@/lib/payments/provider";

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 86_400_000);
}

export async function createSubscriptionCheckout(input: {
  idempotencyKey: string;
  planId: string;
  renewalSubscriptionId?: string | null;
  userId: string;
}) {
  const existingPayment = await prisma.payment.findUnique({ where: { idempotencyKey: input.idempotencyKey }, select: { id: true, userId: true, status: true, provider: true } });
  if (existingPayment) {
    if (existingPayment.userId !== input.userId) throw new Error("IDEMPOTENCY_CONFLICT");
    return { payment: existingPayment, checkoutUrl: existingPayment.provider === "demo" ? demoCheckoutUrl(existingPayment.id) : null, reused: true };
  }

  const plan = await prisma.subscriptionPlan.findFirst({
    where: { id: input.planId, isActive: true, audience: "MEMBER", gym: { status: "ACTIVE" } },
    select: { id: true, name: true, price: true, currency: true, durationDays: true, gymId: true },
  });
  if (!plan) throw new Error("PLAN_NOT_FOUND");

  let subscriptionId = input.renewalSubscriptionId || randomUUID();
  if (input.renewalSubscriptionId) {
    const renewal = await prisma.subscription.findFirst({ where: { id: input.renewalSubscriptionId, subscriberId: input.userId, planId: plan.id, gymId: plan.gymId }, select: { id: true } });
    if (!renewal) throw new Error("SUBSCRIPTION_NOT_FOUND");
    subscriptionId = renewal.id;
  }

  const paymentId = randomUUID();
  const provider = getPaymentProvider();
  const checkout = await provider.createCheckout({ paymentId, amount: plan.price, currency: plan.currency, description: plan.name });
  const now = new Date();
  const payment = await prisma.$transaction(async (transaction) => {
    if (!input.renewalSubscriptionId) {
      await transaction.subscription.create({
        data: { id: subscriptionId, subscriberId: input.userId, gymId: plan.gymId, planId: plan.id, status: "PENDING", pricePaid: plan.price, currency: plan.currency, startDate: now, endDate: addDays(now, plan.durationDays) },
      });
    }
    const created = await transaction.payment.create({
      data: {
        id: paymentId,
        userId: input.userId,
        gymId: plan.gymId,
        planId: plan.id,
        subscriptionId,
        type: input.renewalSubscriptionId ? "RENEWAL" : "SUBSCRIPTION",
        status: "PENDING",
        amount: plan.price,
        currency: plan.currency,
        provider: checkout.provider,
        providerReference: checkout.providerReference,
        idempotencyKey: input.idempotencyKey,
        checkoutTokenHash: checkout.checkoutTokenHash,
      },
      select: { id: true, status: true, amount: true, currency: true, provider: true, subscriptionId: true },
    });
    await transaction.auditLog.create({ data: { actorId: input.userId, actorRole: "USER", gymId: plan.gymId, action: "PAYMENT_CHECKOUT_CREATED", entityType: "Payment", entityId: created.id, metadata: JSON.stringify({ planId: plan.id, type: input.renewalSubscriptionId ? "RENEWAL" : "SUBSCRIPTION" }) } });
    return created;
  });
  return { payment, checkoutUrl: checkout.checkoutUrl, reused: false };
}

export async function confirmDemoPayment(input: { paymentId: string; token: string; userId: string }) {
  const payment = await prisma.payment.findFirst({ where: { id: input.paymentId, userId: input.userId, provider: "demo" }, select: { id: true, checkoutTokenHash: true } });
  if (!payment) throw new Error("PAYMENT_NOT_FOUND");
  if (!verifyCheckoutToken(input.token, payment.checkoutTokenHash)) throw new Error("INVALID_CHECKOUT_TOKEN");
  return finalizeSuccessfulPayment(payment.id, { actorId: input.userId, actorRole: "USER" });
}

export async function finalizeSuccessfulPayment(paymentId: string, actor?: { actorId?: string | null; actorRole?: string | null }) {
  const current = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { id: true, status: true, type: true, userId: true, gymId: true, subscriptionId: true, plan: { select: { name: true, durationDays: true } }, subscription: { select: { endDate: true } } },
  });
  if (!current) throw new Error("PAYMENT_NOT_FOUND");
  if (current.status === "SUCCEEDED") return current;
  if (!["PENDING", "PROCESSING", "FAILED"].includes(current.status)) throw new Error("PAYMENT_NOT_PAYABLE");
  const now = new Date();
  const start = current.type === "RENEWAL" && current.subscription.endDate > now ? current.subscription.endDate : now;
  const endDate = addDays(start, current.plan.durationDays);

  return prisma.$transaction(async (transaction) => {
    const updated = await transaction.payment.update({ where: { id: current.id }, data: { status: "SUCCEEDED", paidAt: now, failureCode: null, failureMessage: null }, select: { id: true, status: true, paidAt: true, subscriptionId: true } });
    await transaction.subscription.update({ where: { id: current.subscriptionId }, data: { status: "ACTIVE", startDate: current.type === "SUBSCRIPTION" ? now : undefined, endDate, cancelledAt: null } });
    await transaction.gymMembership.upsert({
      where: { gymId_userId: { gymId: current.gymId, userId: current.userId } },
      update: { status: "ACTIVE", startedAt: now, expiresAt: endDate, endedAt: null },
      create: { gymId: current.gymId, userId: current.userId, status: "ACTIVE", startedAt: now, expiresAt: endDate },
    });
    await transaction.notification.create({ data: { userId: current.userId, type: "GENERAL", title: "Payment successful", message: `${current.plan.name} is active until ${endDate.toLocaleDateString()}.`, href: "/user/subscriptions" } });
    await transaction.auditLog.create({ data: { actorId: actor?.actorId ?? null, actorRole: actor?.actorRole ?? "SYSTEM", gymId: current.gymId, action: "PAYMENT_SUCCEEDED", entityType: "Payment", entityId: current.id, metadata: JSON.stringify({ subscriptionId: current.subscriptionId, endDate: endDate.toISOString() }) } });
    return updated;
  });
}

export async function failPayment(paymentId: string, code = "DEMO_DECLINED") {
  return prisma.payment.update({ where: { id: paymentId }, data: { status: "FAILED", failureCode: code, failureMessage: "The payment was declined by the provider." }, select: { id: true, status: true, failureCode: true } });
}

export async function refundPayment(input: { actorId: string; actorRole: string; gymId: string; paymentId: string }) {
  const payment = await prisma.payment.findFirst({ where: { id: input.paymentId, gymId: input.gymId, status: "SUCCEEDED" }, select: { id: true, userId: true, subscriptionId: true } });
  if (!payment) throw new Error("PAYMENT_NOT_REFUNDABLE");
  const now = new Date();
  return prisma.$transaction(async (transaction) => {
    const refunded = await transaction.payment.update({ where: { id: payment.id }, data: { status: "REFUNDED", refundedAt: now }, select: { id: true, status: true, refundedAt: true } });
    await transaction.subscription.update({ where: { id: payment.subscriptionId }, data: { status: "CANCELLED", cancelledAt: now, autoRenew: false } });
    const otherActive = await transaction.subscription.count({ where: { id: { not: payment.subscriptionId }, subscriberId: payment.userId, gymId: input.gymId, status: "ACTIVE", endDate: { gt: now } } });
    if (!otherActive) await transaction.gymMembership.updateMany({ where: { gymId: input.gymId, userId: payment.userId }, data: { status: "CANCELLED", endedAt: now } });
    await transaction.notification.create({ data: { userId: payment.userId, type: "GENERAL", title: "Payment refunded", message: "Your payment was refunded and the related subscription was cancelled.", href: "/user/subscriptions" } });
    await transaction.auditLog.create({ data: { actorId: input.actorId, actorRole: input.actorRole, gymId: input.gymId, action: "PAYMENT_REFUNDED", entityType: "Payment", entityId: payment.id, metadata: JSON.stringify({ subscriptionId: payment.subscriptionId }) } });
    return refunded;
  });
}

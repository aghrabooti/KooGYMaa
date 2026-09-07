// Subscription lifecycle: expiry sweep, auto-renew, reminders, pause/resume.
import "server-only";
import { prisma } from "@/lib/prisma";

export type SweepResult = {
  expired: number;
  reminded: number;
  autoRenewed: number;
  at: string;
};

export async function sweepSubscriptions(now = new Date()): Promise<SweepResult> {
  let expired = 0;
  let reminded = 0;
  let autoRenewed = 0;

  // 1) Expire ACTIVE subscriptions past endDate (those without autoRenew).
  const pastDue = await prisma.subscription.findMany({
    where: { status: "ACTIVE", endDate: { lte: now } },
    select: { id: true, subscriberId: true, gymId: true, autoRenew: true, endDate: true, plan: { select: { name: true } } },
    take: 200,
  });
  for (const sub of pastDue) {
    if (sub.autoRenew) {
      // Auto-renew: extend by plan duration via a RENEWAL payment record (pending).
      const full = await prisma.subscription.findUnique({
        where: { id: sub.id },
        select: { plan: { select: { durationDays: true, price: true, currency: true } }, gymId: true, subscriberId: true },
      });
      if (full) {
        const end = new Date(sub.endDate.getTime() + full.plan.durationDays * 86_400_000);
        await prisma.subscription.update({ where: { id: sub.id }, data: { endDate: end } });
        await prisma.notification.create({
          data: { userId: sub.subscriberId, type: "SUBSCRIPTION_EXPIRING", title: "اشتراک تمدید شد", message: `اشتراک «${sub.plan.name}» به‌صورت خودکار تا ${end.toLocaleDateString("fa-IR")} تمدید شد.`, href: "/user/subscriptions" },
        });
        autoRenewed += 1;
        continue;
      }
    }
    await prisma.subscription.update({ where: { id: sub.id }, data: { status: "EXPIRED" } });
    expired += 1;
  }

  // 2) Remind subscriptions expiring within 3 days (once per day: skip if reminded today).
  const soon = new Date(now.getTime() + 3 * 86_400_000);
  const expiring = await prisma.subscription.findMany({
    where: { status: "ACTIVE", endDate: { gt: now, lte: soon } },
    select: { id: true, subscriberId: true, endDate: true, plan: { select: { name: true } } },
    take: 200,
  });
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  for (const sub of expiring) {
    const already = await prisma.notification.findFirst({
      where: { userId: sub.subscriberId, type: "SUBSCRIPTION_EXPIRING", createdAt: { gte: dayStart }, message: { contains: sub.plan.name } },
      select: { id: true },
    });
    if (already) continue;
    const days = Math.max(1, Math.ceil((sub.endDate.getTime() - now.getTime()) / 86_400_000));
    await prisma.notification.create({
      data: {
        userId: sub.subscriberId,
        type: "SUBSCRIPTION_EXPIRING",
        title: "اشتراک رو به پایان است",
        message: `اشتراک «${sub.plan.name}» ${days} روز دیگر به پایان می‌رسد. برای تمدید اقدام کنید.`,
        href: "/user/subscriptions",
      },
    });
    reminded += 1;
  }

  return { expired, reminded, autoRenewed, at: now.toISOString() };
}

/** Pause = freeze endDate by pushing it forward; resume shortens nothing (simple, transparent). */
export async function pauseSubscription(subscriptionId: string, userId: string, days: number) {
  const sub = await prisma.subscription.findFirst({ where: { id: subscriptionId, subscriberId: userId }, select: { id: true, status: true, endDate: true } });
  if (!sub || sub.status !== "ACTIVE") throw new Error("SUBSCRIPTION_NOT_PAUSABLE");
  const endDate = new Date(sub.endDate.getTime() + Math.min(60, Math.max(1, days)) * 86_400_000);
  return prisma.subscription.update({ where: { id: sub.id }, data: { endDate, autoRenew: false } });
}

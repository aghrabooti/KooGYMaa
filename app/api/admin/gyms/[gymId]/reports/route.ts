import { NextResponse, type NextRequest } from "next/server";
import { authorizeGymAdminRequest } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { summarizePayments, monthlyRevenue } from "@/lib/finance";

// Item 13: useful operational reports (single JSON for dashboards/exports).
export async function GET(request: NextRequest, { params }: { params: Promise<{ gymId: string }> }) {
  const { gymId } = await params;
  const auth = await authorizeGymAdminRequest(request, gymId);
  if (!auth.ok) return auth.response;
  const now = new Date();
  const [payments, memberships, trainers, sessions, plans] = await Promise.all([
    prisma.payment.findMany({ where: { gymId }, select: { status: true, type: true, amount: true, currency: true, paidAt: true, createdAt: true } }),
    prisma.gymMembership.groupBy({ by: ["status"], where: { gymId }, _count: { _all: true } }),
    prisma.gymTrainer.groupBy({ by: ["status"], where: { gymId }, _count: { _all: true } }),
    prisma.trainingSession.findMany({ where: { gymId, startsAt: { gte: new Date(now.getTime() - 30 * 86_400_000) } }, select: { status: true, startsAt: true } }),
    prisma.subscriptionPlan.findMany({ where: { gymId }, select: { id: true, name: true, audience: true, price: true, currency: true, isActive: true, _count: { select: { subscriptions: true } } } }),
  ]);
  const finance = summarizePayments(payments.map((p: any) => ({ ...p, currency: p.currency })));
  const upcomingSessions = await prisma.trainingSession.count({ where: { gymId, status: "SCHEDULED", startsAt: { gte: now } } });
  const expiringSoon = await prisma.subscription.count({ where: { gymId, status: "ACTIVE", endDate: { gt: now, lte: new Date(now.getTime() + 7 * 86_400_000) } } });
  return NextResponse.json({
    finance,
    revenueTrend: monthlyRevenue(payments.map((p: any) => ({ ...p })), 6, now),
    memberships: Object.fromEntries(memberships.map((m: any) => [m.status, m._count._all])),
    trainers: Object.fromEntries(trainers.map((t: any) => [t.status, t._count._all])),
    sessionsLast30d: sessions.length,
    sessionsCompleted30d: sessions.filter((s: any) => s.status === "COMPLETED").length,
    upcomingSessions,
    expiringSoon,
    plans: plans.map((p: any) => ({ id: p.id, name: p.name, audience: p.audience, price: p.price, currency: p.currency, isActive: p.isActive, subscriptions: p._count.subscriptions })),
  }, { headers: { "Cache-Control": "no-store" } });
}

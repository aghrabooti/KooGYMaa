import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ subscriptionId: string }> };

// Item 4: temporary pause (tوقف موقت) — pushes endDate forward, disables auto-renew transparently.
export async function POST(request: NextRequest, { params }: Ctx) {
  const auth = await authorizeApiRequest(request, ["USER"]);
  if (!auth.ok) return auth.response;
  const { subscriptionId } = await params;
  const body = await request.json().catch(() => null) as { days?: unknown } | null;
  const days = Math.min(60, Math.max(1, typeof body?.days === "number" ? Math.floor(body.days) : 7));
  const sub = await prisma.subscription.findFirst({
    where: { id: subscriptionId, subscriberId: auth.user.id, status: "ACTIVE" },
    select: { id: true, endDate: true, gymId: true },
  });
  if (!sub) return NextResponse.json({ error: "اشتراک فعال یافت نشد." }, { status: 404 });
  const endDate = new Date(sub.endDate.getTime() + days * 86_400_000);
  await prisma.$transaction(async (tx: any) => {
    await tx.subscription.update({ where: { id: sub.id }, data: { endDate, autoRenew: false } });
    await tx.auditLog.create({
      data: { actorId: auth.user.id, actorRole: "USER", gymId: sub.gymId, action: "SUBSCRIPTION_PAUSED", entityType: "Subscription", entityId: sub.id, metadata: JSON.stringify({ days, endDate: endDate.toISOString() }) },
    });
  });
  return NextResponse.json({ ok: true, endDate, message: `اشتراک ${days} روز متوقف شد.` });
}

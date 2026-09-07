import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ subscriptionId: string }> };

// Item 4: resume — re-enable auto-renew optionally.
export async function POST(request: NextRequest, { params }: Ctx) {
  const auth = await authorizeApiRequest(request, ["USER"]);
  if (!auth.ok) return auth.response;
  const { subscriptionId } = await params;
  const body = await request.json().catch(() => null) as { autoRenew?: unknown } | null;
  const sub = await prisma.subscription.findFirst({
    where: { id: subscriptionId, subscriberId: auth.user.id, status: "ACTIVE" },
    select: { id: true, gymId: true },
  });
  if (!sub) return NextResponse.json({ error: "اشتراک فعال یافت نشد." }, { status: 404 });
  const updated = await prisma.subscription.update({
    where: { id: sub.id },
    data: { autoRenew: body?.autoRenew === true },
    select: { id: true, autoRenew: true, endDate: true },
  });
  return NextResponse.json({ ok: true, subscription: updated });
}

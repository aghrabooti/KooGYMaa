import { NextResponse, type NextRequest } from "next/server";
import { authorizeGymAdminRequest } from "@/lib/admin-access";
import { parseBulkIds } from "@/lib/api-pagination";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";

type Ctx = { params: Promise<{ gymId: string }> };

// Item 13: bulk subscription cancellation (transparent + audited).
export async function POST(request: NextRequest, { params }: Ctx) {
  const { gymId } = await params;
  const auth = await authorizeGymAdminRequest(request, gymId);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null);
  const ids = parseBulkIds(body);
  const action = (body as Record<string, unknown>)?.status;
  if (!ids || action !== "CANCELLED") return NextResponse.json({ error: "فقط لغو گروهی پشتیبانی می‌شود." }, { status: 400 });
  const now = new Date();
  const result = await prisma.subscription.updateMany({ where: { gymId, id: { in: ids }, status: { in: ["PENDING", "ACTIVE", "PAST_DUE"] } }, data: { status: "CANCELLED", cancelledAt: now, autoRenew: false } });
  await recordAudit({ action: "SUBSCRIPTION_BULK_CANCEL", actorId: auth.access.user.id, actorRole: "ADMIN", entityId: gymId, entityType: "Gym", gymId, metadata: { count: result.count }, request });
  return NextResponse.json({ updated: result.count });
}

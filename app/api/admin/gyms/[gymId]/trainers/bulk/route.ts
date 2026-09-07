import { NextResponse, type NextRequest } from "next/server";
import { authorizeGymAdminRequest } from "@/lib/admin-access";
import { validateMembershipDecision } from "@/lib/admin-validation";
import { parseBulkIds } from "@/lib/api-pagination";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";

type Ctx = { params: Promise<{ gymId: string }> };

// Item 13: bulk trainer-application decisions.
export async function POST(request: NextRequest, { params }: Ctx) {
  const { gymId } = await params;
  const auth = await authorizeGymAdminRequest(request, gymId);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null);
  const ids = parseBulkIds(body);
  if (!ids) return NextResponse.json({ error: "شناسه‌ها را ارسال کنید." }, { status: 400 });
  const validation = validateMembershipDecision({ status: (body as Record<string, unknown>)?.status });
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  const result = await prisma.gymTrainer.updateMany({ where: { gymId, id: { in: ids } }, data: { status: validation.data.status, reviewedAt: new Date(), reviewedById: auth.access.user.id } });
  await recordAudit({ action: "TRAINER_BULK_UPDATE", actorId: auth.access.user.id, actorRole: "ADMIN", entityId: gymId, entityType: "Gym", gymId, metadata: { count: result.count, status: validation.data.status }, request });
  return NextResponse.json({ updated: result.count });
}

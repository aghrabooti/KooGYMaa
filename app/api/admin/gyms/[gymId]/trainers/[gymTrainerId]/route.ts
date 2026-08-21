import { NextResponse, type NextRequest } from "next/server";
import { authorizeGymAdminRequest } from "@/lib/admin-access";
import { validateMembershipDecision } from "@/lib/admin-validation";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";

type Context = { params: Promise<{ gymId: string; gymTrainerId: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const { gymId, gymTrainerId } = await params;
  const authorization = await authorizeGymAdminRequest(request, gymId);
  if (!authorization.ok) return authorization.response;

  const body = await request.json().catch(() => null);
  const validation = validateMembershipDecision(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const existing = await prisma.gymTrainer.findFirst({
    where: { id: gymTrainerId, gymId },
    select: { id: true, startedAt: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Trainer membership not found in this gym." }, { status: 404 });
  }

  const now = new Date();
  const closesMembership = ["REJECTED", "EXPIRED", "CANCELLED"].includes(validation.data.status);
  const gymTrainer = await prisma.gymTrainer.update({
    where: { id: existing.id },
    data: {
      status: validation.data.status,
      reviewedAt: now,
      reviewedById: authorization.access.user.id,
      ...(validation.data.status === "ACTIVE"
        ? { startedAt: existing.startedAt ?? now, endedAt: null }
        : {}),
      ...(closesMembership ? { endedAt: now } : {}),
    },
    select: {
      id: true,
      status: true,
      reviewedAt: true,
      startedAt: true,
      endedAt: true,
    },
  });

  await recordAudit({ action: "TRAINER_STATUS_CHANGED", actorId: authorization.access.user.id, actorRole: authorization.access.user.role, gymId, entityType: "GymTrainer", entityId: gymTrainer.id, metadata: { status: gymTrainer.status }, request });
  return NextResponse.json({ gymTrainer });
}

import "server-only";

import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/rate-limit";

export async function recordAudit(input: {
  action: string;
  actorId?: string | null;
  actorRole?: string | null;
  entityId: string;
  entityType: string;
  gymId?: string | null;
  metadata?: Record<string, unknown>;
  request?: NextRequest;
}) {
  await prisma.auditLog.create({
    data: {
      action: input.action,
      actorId: input.actorId ?? null,
      actorRole: input.actorRole ?? null,
      entityId: input.entityId,
      entityType: input.entityType,
      gymId: input.gymId ?? null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      ipAddress: input.request ? getClientIp(input.request) : null,
    },
  });
}

import { NextResponse, type NextRequest } from "next/server";
import { authorizeTrainerRequest } from "@/lib/trainer-access";
import { validateTrainerClientStatus } from "@/lib/trainer-validation";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ clientId: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const authorization = await authorizeTrainerRequest(request);
  if (!authorization.ok) return authorization.response;
  const { clientId } = await params;
  const body = await request.json().catch(() => null);
  const validation = validateTrainerClientStatus(body);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  const existing = await prisma.trainerClient.findFirst({
    where: { id: clientId, trainerId: authorization.access.profile.id },
    select: { id: true, startedAt: true },
  });
  if (!existing) return NextResponse.json({ error: "Student relationship not found." }, { status: 404 });

  const now = new Date();
  const client = await prisma.trainerClient.update({
    where: { id: existing.id },
    data: {
      status: validation.data.status,
      ...(validation.data.status === "ACTIVE" ? { startedAt: existing.startedAt ?? now, endedAt: null } : {}),
      ...(["REJECTED", "ENDED"].includes(validation.data.status) ? { endedAt: now } : {}),
    },
    select: { id: true, status: true, startedAt: true, endedAt: true },
  });
  return NextResponse.json({ client });
}

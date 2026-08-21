import { NextResponse, type NextRequest } from "next/server";
import { authorizeTrainerRequest } from "@/lib/trainer-access";
import { validateSessionInput } from "@/lib/trainer-validation";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ sessionId: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const authorization = await authorizeTrainerRequest(request);
  if (!authorization.ok) return authorization.response;
  const { sessionId } = await params;

  const existing = await prisma.trainingSession.findFirst({
    where: { id: sessionId, trainerId: authorization.access.profile.id },
    select: {
      id: true,
      trainerClientId: true,
      gymId: true,
      title: true,
      startsAt: true,
      endsAt: true,
      status: true,
      notes: true,
    },
  });
  if (!existing) return NextResponse.json({ error: "Training session not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const validation = validateSessionInput({
    trainerClientId: existing.trainerClientId,
    gymId: existing.gymId,
    title: existing.title,
    startsAt: existing.startsAt,
    endsAt: existing.endsAt,
    status: existing.status,
    notes: existing.notes,
    ...body,
  });
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  const client = await prisma.trainerClient.findFirst({
    where: { id: validation.data.trainerClientId!, trainerId: authorization.access.profile.id, status: "ACTIVE" },
    select: { id: true },
  });
  if (!client) return NextResponse.json({ error: "Choose one of your active students." }, { status: 404 });

  if (validation.data.gymId) {
    const gym = await prisma.gymTrainer.findUnique({
      where: { gymId_trainerId: { gymId: validation.data.gymId, trainerId: authorization.access.profile.id } },
      select: { status: true },
    });
    if (gym?.status !== "ACTIVE") return NextResponse.json({ error: "You are not active at the selected gym." }, { status: 403 });
  }

  if (validation.data.status === "SCHEDULED") {
    const conflict = await prisma.trainingSession.findFirst({
      where: {
        id: { not: existing.id },
        trainerId: authorization.access.profile.id,
        status: "SCHEDULED",
        startsAt: { lt: validation.data.endsAt! },
        endsAt: { gt: validation.data.startsAt! },
      },
      select: { id: true },
    });
    if (conflict) return NextResponse.json({ error: "This session overlaps another scheduled session." }, { status: 409 });
  }

  const session = await prisma.trainingSession.update({
    where: { id: existing.id },
    data: {
      trainerClientId: client.id,
      gymId: validation.data.gymId,
      title: validation.data.title!,
      startsAt: validation.data.startsAt!,
      endsAt: validation.data.endsAt!,
      status: validation.data.status,
      notes: validation.data.notes,
    },
    select: { id: true, title: true, startsAt: true, endsAt: true, status: true, notes: true },
  });
  return NextResponse.json({ session });
}

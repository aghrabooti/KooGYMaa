import { NextResponse, type NextRequest } from "next/server";
import { authorizeTrainerRequest } from "@/lib/trainer-access";
import { validateSessionInput } from "@/lib/trainer-validation";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authorization = await authorizeTrainerRequest(request);
  if (!authorization.ok) return authorization.response;
  const fromValue = request.nextUrl.searchParams.get("from");
  const toValue = request.nextUrl.searchParams.get("to");
  const from = fromValue ? new Date(fromValue) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const to = toValue ? new Date(toValue) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from) {
    return NextResponse.json({ error: "Invalid schedule date range." }, { status: 400 });
  }

  const sessions = await prisma.trainingSession.findMany({
    where: { trainerId: authorization.access.profile.id, startsAt: { gte: from, lte: to } },
    select: {
      id: true,
      title: true,
      startsAt: true,
      endsAt: true,
      status: true,
      notes: true,
      gym: { select: { id: true, name: true } },
      trainerClient: { select: { id: true, user: { select: { id: true, name: true, email: true } } } },
    },
    orderBy: { startsAt: "asc" },
  });
  return NextResponse.json({ sessions }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const authorization = await authorizeTrainerRequest(request);
  if (!authorization.ok) return authorization.response;
  const body = await request.json().catch(() => null);
  const validation = validateSessionInput(body);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  const { trainerClientId, title, startsAt, endsAt } = validation.data;

  const client = await prisma.trainerClient.findFirst({
    where: { id: trainerClientId!, trainerId: authorization.access.profile.id, status: "ACTIVE" },
    select: { id: true, userId: true },
  });
  if (!client) return NextResponse.json({ error: "Choose one of your active students." }, { status: 404 });

  if (validation.data.gymId) {
    const gym = await prisma.gymTrainer.findUnique({
      where: { gymId_trainerId: { gymId: validation.data.gymId, trainerId: authorization.access.profile.id } },
      select: { status: true },
    });
    if (gym?.status !== "ACTIVE") return NextResponse.json({ error: "You are not active at the selected gym." }, { status: 403 });
  }

  const conflict = await prisma.trainingSession.findFirst({
    where: {
      trainerId: authorization.access.profile.id,
      status: "SCHEDULED",
      startsAt: { lt: endsAt! },
      endsAt: { gt: startsAt! },
    },
    select: { id: true },
  });
  if (conflict) return NextResponse.json({ error: "This session overlaps another scheduled session." }, { status: 409 });

  const session = await prisma.$transaction(async (transaction) => {
    const created = await transaction.trainingSession.create({
      data: {
        trainerId: authorization.access.profile.id,
        trainerClientId: client.id,
        gymId: validation.data.gymId,
        title: title!,
        startsAt: startsAt!,
        endsAt: endsAt!,
        status: validation.data.status ?? "SCHEDULED",
        notes: validation.data.notes,
      },
      select: { id: true, title: true, startsAt: true, endsAt: true, status: true },
    });
    await transaction.notification.create({ data: { userId: client.userId, type: "SESSION_REMINDER", title: "New coaching session", message: `${title} has been scheduled.`, href: "/user/progress" } });
    return created;
  });
  return NextResponse.json({ session }, { status: 201 });
}

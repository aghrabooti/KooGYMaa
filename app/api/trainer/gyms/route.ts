import { NextResponse, type NextRequest } from "next/server";
import { authorizeTrainerRequest } from "@/lib/trainer-access";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authorization = await authorizeTrainerRequest(request);
  if (!authorization.ok) return authorization.response;
  const query = request.nextUrl.searchParams.get("q")?.trim();

  const gyms = await prisma.gym.findMany({
    where: {
      status: "ACTIVE",
      ...(query ? { OR: [{ name: { contains: query } }, { city: { contains: query } }] } : {}),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      city: true,
      country: true,
      status: true,
      trainers: {
        where: { trainerId: authorization.access.profile.id },
        select: { id: true, status: true, requestedAt: true, startedAt: true },
        take: 1,
      },
      _count: {
        select: {
          memberships: { where: { status: "ACTIVE" } },
          trainers: { where: { status: "ACTIVE" } },
        },
      },
    },
    orderBy: { name: "asc" },
    take: 100,
  });

  return NextResponse.json({ gyms }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const authorization = await authorizeTrainerRequest(request);
  if (!authorization.ok) return authorization.response;

  const body = await request.json().catch(() => null) as { gymId?: unknown } | null;
  const gymId = typeof body?.gymId === "string" ? body.gymId.trim() : "";
  if (!gymId) return NextResponse.json({ error: "Choose a gym." }, { status: 400 });

  const gym = await prisma.gym.findFirst({ where: { id: gymId, status: "ACTIVE" }, select: { id: true } });
  if (!gym) return NextResponse.json({ error: "This gym is not accepting applications." }, { status: 404 });

  const current = await prisma.gymTrainer.findUnique({
    where: { gymId_trainerId: { gymId, trainerId: authorization.access.profile.id } },
    select: { id: true, status: true },
  });
  if (current?.status === "ACTIVE" || current?.status === "PENDING") {
    return NextResponse.json({ error: current.status === "ACTIVE" ? "You already belong to this gym." : "Your application is already pending." }, { status: 409 });
  }

  const application = await prisma.gymTrainer.upsert({
    where: { gymId_trainerId: { gymId, trainerId: authorization.access.profile.id } },
    update: {
      status: "PENDING",
      requestedAt: new Date(),
      reviewedAt: null,
      reviewedById: null,
      startedAt: null,
      endedAt: null,
    },
    create: {
      gymId,
      trainerId: authorization.access.profile.id,
      status: "PENDING",
    },
    select: { id: true, status: true, requestedAt: true },
  });

  return NextResponse.json({ application }, { status: 201 });
}

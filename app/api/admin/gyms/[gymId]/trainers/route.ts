import { NextResponse, type NextRequest } from "next/server";
import { authorizeGymAdminRequest } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ gymId: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { gymId } = await params;
  const authorization = await authorizeGymAdminRequest(request, gymId);
  if (!authorization.ok) return authorization.response;

  const trainers = await prisma.gymTrainer.findMany({
    where: { gymId },
    select: {
      id: true,
      status: true,
      requestedAt: true,
      startedAt: true,
      trainer: {
        select: {
          id: true,
          specialty: true,
          experienceYears: true,
          isAvailable: true,
          user: {
            select: { id: true, name: true, email: true, phone: true, status: true },
          },
          _count: { select: { clients: { where: { status: "ACTIVE" } } } },
        },
      },
    },
    orderBy: [{ status: "asc" }, { requestedAt: "desc" }],
  });

  return NextResponse.json({ trainers }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest, { params }: Context) {
  const { gymId } = await params;
  const authorization = await authorizeGymAdminRequest(request, gymId);
  if (!authorization.ok) return authorization.response;

  const body = await request.json().catch(() => null) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid trainer email." }, { status: 400 });
  }

  const trainer = await prisma.trainerProfile.findFirst({
    where: { user: { email, role: "TRAINER", status: "ACTIVE" } },
    select: { id: true },
  });
  if (!trainer) {
    return NextResponse.json({ error: "No active trainer account was found for this email." }, { status: 404 });
  }

  const now = new Date();
  const gymTrainer = await prisma.gymTrainer.upsert({
    where: { gymId_trainerId: { gymId, trainerId: trainer.id } },
    update: {
      status: "ACTIVE",
      reviewedAt: now,
      reviewedById: authorization.access.user.id,
      startedAt: now,
      endedAt: null,
    },
    create: {
      gymId,
      trainerId: trainer.id,
      status: "ACTIVE",
      reviewedAt: now,
      reviewedById: authorization.access.user.id,
      startedAt: now,
    },
    select: { id: true, status: true },
  });

  return NextResponse.json({ gymTrainer }, { status: 201 });
}

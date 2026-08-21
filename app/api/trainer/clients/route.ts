import { NextResponse, type NextRequest } from "next/server";
import { authorizeTrainerRequest } from "@/lib/trainer-access";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authorization = await authorizeTrainerRequest(request);
  if (!authorization.ok) return authorization.response;

  const clients = await prisma.trainerClient.findMany({
    where: { trainerId: authorization.access.profile.id },
    select: {
      id: true,
      status: true,
      requestedAt: true,
      startedAt: true,
      user: { select: { id: true, name: true, email: true, phone: true, status: true } },
      gym: { select: { id: true, name: true } },
      _count: { select: { workoutAssignments: true, dietAssignments: true, sessions: true } },
    },
    orderBy: [{ status: "asc" }, { requestedAt: "desc" }],
  });

  return NextResponse.json({ clients }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const authorization = await authorizeTrainerRequest(request);
  if (!authorization.ok) return authorization.response;

  const body = await request.json().catch(() => null) as { email?: unknown; gymId?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const gymId = typeof body?.gymId === "string" && body.gymId.trim() ? body.gymId.trim() : null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid member email." }, { status: 400 });
  }

  if (gymId) {
    const gymAccess = await prisma.gymTrainer.findUnique({
      where: { gymId_trainerId: { gymId, trainerId: authorization.access.profile.id } },
      select: { status: true },
    });
    if (gymAccess?.status !== "ACTIVE") return NextResponse.json({ error: "You are not active at this gym." }, { status: 403 });
  }

  const user = await prisma.user.findFirst({
    where: { email, role: "USER", status: "ACTIVE" },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "No active member account was found for this email." }, { status: 404 });

  const current = await prisma.trainerClient.findUnique({
    where: { trainerId_userId: { trainerId: authorization.access.profile.id, userId: user.id } },
    select: { status: true },
  });
  if (current?.status === "ACTIVE" || current?.status === "PENDING") {
    return NextResponse.json({ error: current.status === "ACTIVE" ? "This member is already your student." : "An invitation is already pending." }, { status: 409 });
  }

  const client = await prisma.trainerClient.upsert({
    where: { trainerId_userId: { trainerId: authorization.access.profile.id, userId: user.id } },
    update: { gymId, status: "PENDING", requestedAt: new Date(), startedAt: null, endedAt: null },
    create: { trainerId: authorization.access.profile.id, userId: user.id, gymId, status: "PENDING" },
    select: { id: true, status: true },
  });
  return NextResponse.json({ client }, { status: 201 });
}

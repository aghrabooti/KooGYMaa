import { NextResponse, type NextRequest } from "next/server";
import { authorizeGymAdminRequest } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { accountIdentifierWhere } from "@/lib/accounts";
import { parseAccountIdentifier } from "@/lib/auth-validation";

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

  const body = await request.json().catch(() => null);
  const identifier = parseAccountIdentifier(body?.identifier ?? body?.email);
  if (!identifier) {
    return NextResponse.json({ error: "نام کاربری یا ایمیل مربی را درست وارد کنید." }, { status: 400 });
  }

  const trainer = await prisma.trainerProfile.findFirst({
    where: { user: { ...accountIdentifierWhere(identifier), role: "TRAINER", status: "ACTIVE" } },
    select: { id: true },
  });
  if (!trainer) {
    return NextResponse.json({ error: "حساب فعال مربی با این نام کاربری یا ایمیل پیدا نشد." }, { status: 404 });
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

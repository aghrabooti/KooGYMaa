import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { validateTrainerRequest } from "@/lib/member-validation";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ trainerId: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const authorization = await authorizeApiRequest(request, ["USER"]);
  if (!authorization.ok) return authorization.response;
  const { trainerId } = await params;
  const validation = validateTrainerRequest(await request.json().catch(() => null));
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  const trainer = await prisma.trainerProfile.findFirst({ where: { id: trainerId, isAvailable: true, user: { status: "ACTIVE", role: "TRAINER" } }, select: { id: true, user: { select: { name: true } } } });
  if (!trainer) return NextResponse.json({ error: "This trainer is not accepting requests." }, { status: 404 });

  if (validation.data.gymId) {
    const [trainerGym, memberGym] = await Promise.all([
      prisma.gymTrainer.findUnique({ where: { gymId_trainerId: { gymId: validation.data.gymId, trainerId } }, select: { status: true } }),
      prisma.gymMembership.findUnique({ where: { gymId_userId: { gymId: validation.data.gymId, userId: authorization.user.id } }, select: { status: true } }),
    ]);
    if (trainerGym?.status !== "ACTIVE" || memberGym?.status !== "ACTIVE") return NextResponse.json({ error: "Both you and the trainer must be active at the selected gym." }, { status: 403 });
  }

  const current = await prisma.trainerClient.findUnique({ where: { trainerId_userId: { trainerId, userId: authorization.user.id } }, select: { id: true, status: true } });
  if (current?.status === "ACTIVE" || current?.status === "PENDING") return NextResponse.json({ error: current.status === "ACTIVE" ? "This trainer already coaches you." : "Your coaching request is already pending." }, { status: 409 });
  const relationship = await prisma.trainerClient.upsert({ where: { trainerId_userId: { trainerId, userId: authorization.user.id } }, update: { gymId: validation.data.gymId, status: "PENDING", requestedAt: new Date(), startedAt: null, endedAt: null }, create: { trainerId, userId: authorization.user.id, gymId: validation.data.gymId, status: "PENDING" }, select: { id: true, status: true, requestedAt: true } });
  return NextResponse.json({ relationship, message: `Request sent to ${trainer.user.name}.` }, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const authorization = await authorizeApiRequest(request, ["USER"]);
  if (!authorization.ok) return authorization.response;
  const { trainerId } = await params;
  const current = await prisma.trainerClient.findUnique({ where: { trainerId_userId: { trainerId, userId: authorization.user.id } }, select: { id: true } });
  if (!current) return NextResponse.json({ error: "Coaching relationship not found." }, { status: 404 });
  const relationship = await prisma.trainerClient.update({ where: { id: current.id }, data: { status: "ENDED", endedAt: new Date() }, select: { id: true, status: true } });
  return NextResponse.json({ relationship });
}

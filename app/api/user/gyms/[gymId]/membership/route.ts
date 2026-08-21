import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ gymId: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const authorization = await authorizeApiRequest(request, ["USER"]);
  if (!authorization.ok) return authorization.response;
  const { gymId } = await params;
  const gym = await prisma.gym.findFirst({ where: { id: gymId, status: "ACTIVE" }, select: { id: true, name: true } });
  if (!gym) return NextResponse.json({ error: "This gym is not accepting applications." }, { status: 404 });
  const current = await prisma.gymMembership.findUnique({ where: { gymId_userId: { gymId, userId: authorization.user.id } }, select: { id: true, status: true } });
  if (current?.status === "ACTIVE" || current?.status === "PENDING") return NextResponse.json({ error: current.status === "ACTIVE" ? "You are already a member of this gym." : "Your application is already pending." }, { status: 409 });
  if (current?.status === "SUSPENDED") return NextResponse.json({ error: "Contact the gym to resolve your suspended membership." }, { status: 409 });
  const membership = await prisma.gymMembership.upsert({ where: { gymId_userId: { gymId, userId: authorization.user.id } }, update: { status: "PENDING", requestedAt: new Date(), reviewedAt: null, reviewedById: null, startedAt: null, expiresAt: null, endedAt: null }, create: { gymId, userId: authorization.user.id, status: "PENDING" }, select: { id: true, status: true, requestedAt: true } });
  return NextResponse.json({ membership, message: `Application sent to ${gym.name}.` }, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const authorization = await authorizeApiRequest(request, ["USER"]);
  if (!authorization.ok) return authorization.response;
  const { gymId } = await params;
  const current = await prisma.gymMembership.findUnique({ where: { gymId_userId: { gymId, userId: authorization.user.id } }, select: { id: true, status: true } });
  if (!current) return NextResponse.json({ error: "Gym membership not found." }, { status: 404 });
  const membership = await prisma.gymMembership.update({ where: { id: current.id }, data: { status: "CANCELLED", endedAt: new Date() }, select: { id: true, status: true } });
  return NextResponse.json({ membership });
}

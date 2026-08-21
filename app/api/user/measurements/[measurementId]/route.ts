import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { validateMeasurement } from "@/lib/progress-validation";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ measurementId: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const authorization = await authorizeApiRequest(request, ["USER"]);
  if (!authorization.ok) return authorization.response;
  const { measurementId } = await params;
  const existing = await prisma.bodyMeasurement.findFirst({ where: { id: measurementId, userId: authorization.user.id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Measurement not found." }, { status: 404 });
  const validation = validateMeasurement(await request.json().catch(() => null));
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  const measurement = await prisma.bodyMeasurement.update({ where: { id: existing.id }, data: validation.data, select: { id: true, recordedAt: true, weightKg: true, bodyFatPercent: true } });
  return NextResponse.json({ measurement });
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const authorization = await authorizeApiRequest(request, ["USER"]);
  if (!authorization.ok) return authorization.response;
  const { measurementId } = await params;
  const existing = await prisma.bodyMeasurement.findFirst({ where: { id: measurementId, userId: authorization.user.id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Measurement not found." }, { status: 404 });
  await prisma.bodyMeasurement.delete({ where: { id: existing.id } });
  return NextResponse.json({ message: "Measurement deleted." });
}

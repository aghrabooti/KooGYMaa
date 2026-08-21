import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { validateMeasurement } from "@/lib/progress-validation";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authorization = await authorizeApiRequest(request, ["USER"]);
  if (!authorization.ok) return authorization.response;
  const measurements = await prisma.bodyMeasurement.findMany({ where: { userId: authorization.user.id }, select: { id: true, recordedAt: true, weightKg: true, bodyFatPercent: true, waistCm: true, chestCm: true, armCm: true, hipsCm: true, thighCm: true, notes: true, photos: { select: { id: true, imageUrl: true, pose: true, createdAt: true } } }, orderBy: { recordedAt: "asc" }, take: 200 });
  return NextResponse.json({ measurements }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const authorization = await authorizeApiRequest(request, ["USER"]);
  if (!authorization.ok) return authorization.response;
  const validation = validateMeasurement(await request.json().catch(() => null));
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  const measurement = await prisma.bodyMeasurement.create({ data: { userId: authorization.user.id, ...validation.data }, select: { id: true, recordedAt: true, weightKg: true, bodyFatPercent: true, waistCm: true } });
  return NextResponse.json({ measurement }, { status: 201 });
}

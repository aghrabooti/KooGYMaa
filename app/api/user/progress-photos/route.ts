import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const authorization = await authorizeApiRequest(request, ["USER"]);
  if (!authorization.ok) return authorization.response;
  const body = await request.json().catch(() => null) as { imageUrl?: unknown; measurementId?: unknown; pose?: unknown } | null;
  const imageUrl = typeof body?.imageUrl === "string" ? body.imageUrl.trim().slice(0, 2_000) : "";
  const measurementId = typeof body?.measurementId === "string" && body.measurementId ? body.measurementId : null;
  const pose = typeof body?.pose === "string" ? body.pose.trim().slice(0, 50) || null : null;
  try { const parsed = new URL(imageUrl); if (!["http:", "https:"].includes(parsed.protocol)) throw new Error(); } catch { return NextResponse.json({ error: "Enter a valid HTTPS image URL." }, { status: 400 }); }
  if (measurementId) {
    const measurement = await prisma.bodyMeasurement.findFirst({ where: { id: measurementId, userId: authorization.user.id }, select: { id: true } });
    if (!measurement) return NextResponse.json({ error: "Measurement not found." }, { status: 404 });
  }
  const photo = await prisma.progressPhoto.create({ data: { userId: authorization.user.id, measurementId, imageUrl, pose }, select: { id: true, imageUrl: true, pose: true, createdAt: true } });
  return NextResponse.json({ photo }, { status: 201 });
}

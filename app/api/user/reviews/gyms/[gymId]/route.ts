import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { validateReview } from "@/lib/review-validation";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ gymId: string }> };

export async function PUT(request: NextRequest, { params }: Context) {
  const authorization = await authorizeApiRequest(request, ["USER"]);
  if (!authorization.ok) return authorization.response;
  const { gymId } = await params;
  const validation = validateReview(await request.json().catch(() => null));
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  const membership = await prisma.gymMembership.findUnique({ where: { gymId_userId: { gymId, userId: authorization.user.id } }, select: { startedAt: true } });
  if (!membership?.startedAt) return NextResponse.json({ error: "Only verified gym members can leave a review." }, { status: 403 });
  const review = await prisma.gymReview.upsert({ where: { authorId_gymId: { authorId: authorization.user.id, gymId } }, update: { ...validation.data, verified: true }, create: { authorId: authorization.user.id, gymId, ...validation.data, verified: true }, select: { id: true, score: true, comment: true, verified: true, updatedAt: true } });
  return NextResponse.json({ review });
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const authorization = await authorizeApiRequest(request, ["USER"]);
  if (!authorization.ok) return authorization.response;
  const { gymId } = await params;
  const review = await prisma.gymReview.findUnique({ where: { authorId_gymId: { authorId: authorization.user.id, gymId } }, select: { id: true } });
  if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });
  await prisma.gymReview.delete({ where: { id: review.id } });
  return NextResponse.json({ message: "Review deleted." });
}

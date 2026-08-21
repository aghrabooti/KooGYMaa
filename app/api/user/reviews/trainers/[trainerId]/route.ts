import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { validateReview } from "@/lib/review-validation";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ trainerId: string }> };

export async function PUT(request: NextRequest, { params }: Context) {
  const authorization = await authorizeApiRequest(request, ["USER"]);
  if (!authorization.ok) return authorization.response;
  const { trainerId } = await params;
  const validation = validateReview(await request.json().catch(() => null));
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  const relationship = await prisma.trainerClient.findUnique({ where: { trainerId_userId: { trainerId, userId: authorization.user.id } }, select: { startedAt: true } });
  if (!relationship?.startedAt) return NextResponse.json({ error: "Only verified coaching clients can leave a review." }, { status: 403 });
  const review = await prisma.trainerReview.upsert({ where: { authorId_trainerId: { authorId: authorization.user.id, trainerId } }, update: { ...validation.data, verified: true }, create: { authorId: authorization.user.id, trainerId, ...validation.data, verified: true }, select: { id: true, score: true, comment: true, verified: true, updatedAt: true } });
  return NextResponse.json({ review });
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const authorization = await authorizeApiRequest(request, ["USER"]);
  if (!authorization.ok) return authorization.response;
  const { trainerId } = await params;
  const review = await prisma.trainerReview.findUnique({ where: { authorId_trainerId: { authorId: authorization.user.id, trainerId } }, select: { id: true } });
  if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });
  await prisma.trainerReview.delete({ where: { id: review.id } });
  return NextResponse.json({ message: "Review deleted." });
}

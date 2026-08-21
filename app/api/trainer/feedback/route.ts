import { NextResponse, type NextRequest } from "next/server";
import { authorizeTrainerRequest } from "@/lib/trainer-access";
import { validateFeedback } from "@/lib/progress-validation";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authorization = await authorizeTrainerRequest(request);
  if (!authorization.ok) return authorization.response;
  const feedback = await prisma.feedback.findMany({ where: { authorId: authorization.access.user.id, parentId: null }, select: { id: true, type: true, content: true, createdAt: true, readAt: true, recipient: { select: { name: true } }, replies: { select: { id: true, content: true, createdAt: true, author: { select: { name: true } } }, orderBy: { createdAt: "asc" } } }, orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ feedback }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const authorization = await authorizeTrainerRequest(request);
  if (!authorization.ok) return authorization.response;
  const validation = validateFeedback(await request.json().catch(() => null));
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  const client = await prisma.trainerClient.findFirst({ where: { id: validation.data.trainerClientId, trainerId: authorization.access.profile.id, status: { in: ["ACTIVE", "PAUSED"] } }, select: { id: true, userId: true } });
  if (!client) return NextResponse.json({ error: "Student relationship not found." }, { status: 404 });

  if (validation.data.workoutLogId) {
    const log = await prisma.workoutLog.findFirst({ where: { id: validation.data.workoutLogId, userId: client.userId, assignment: { trainerClientId: client.id } }, select: { id: true } });
    if (!log) return NextResponse.json({ error: "Workout log does not belong to this student." }, { status: 403 });
  }
  if (validation.data.nutritionLogId) {
    const log = await prisma.nutritionLog.findFirst({ where: { id: validation.data.nutritionLogId, userId: client.userId, assignment: { trainerClientId: client.id } }, select: { id: true } });
    if (!log) return NextResponse.json({ error: "Nutrition log does not belong to this student." }, { status: 403 });
  }

  const feedback = await prisma.$transaction(async (transaction) => {
    const created = await transaction.feedback.create({ data: { authorId: authorization.access.user.id, recipientId: client.userId, trainerClientId: client.id, workoutLogId: validation.data.workoutLogId, nutritionLogId: validation.data.nutritionLogId, type: validation.data.type, content: validation.data.content }, select: { id: true, type: true, content: true, createdAt: true } });
    await transaction.notification.create({ data: { userId: client.userId, type: "FEEDBACK", title: "New trainer feedback", message: validation.data.content.slice(0, 160), href: "/user/progress" } });
    return created;
  });
  return NextResponse.json({ feedback }, { status: 201 });
}

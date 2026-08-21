import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ feedbackId: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const authorization = await authorizeApiRequest(request, ["USER"]);
  if (!authorization.ok) return authorization.response;
  const content = ((await request.json().catch(() => null)) as { content?: unknown } | null)?.content;
  const message = typeof content === "string" ? content.trim().slice(0, 2_000) : "";
  if (message.length < 2) return NextResponse.json({ error: "Reply must contain at least 2 characters." }, { status: 400 });
  const parent = await prisma.feedback.findFirst({ where: { id: (await params).feedbackId, recipientId: authorization.user.id, parentId: null }, select: { id: true, authorId: true, trainerClientId: true, type: true } });
  if (!parent) return NextResponse.json({ error: "Feedback thread not found." }, { status: 404 });
  const reply = await prisma.$transaction(async (transaction) => {
    const created = await transaction.feedback.create({ data: { authorId: authorization.user.id, recipientId: parent.authorId, trainerClientId: parent.trainerClientId, parentId: parent.id, type: parent.type, content: message }, select: { id: true, content: true, createdAt: true } });
    await transaction.feedback.update({ where: { id: parent.id }, data: { readAt: new Date() } });
    await transaction.notification.create({ data: { userId: parent.authorId, type: "FEEDBACK", title: "Student replied to feedback", message: message.slice(0, 160), href: "/trainer/progress" } });
    return created;
  });
  return NextResponse.json({ reply }, { status: 201 });
}

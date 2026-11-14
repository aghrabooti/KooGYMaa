import { NextResponse, type NextRequest } from "next/server";
import { authorizeTrainerRequest } from "@/lib/trainer-access";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ clientId: string }> };

// پیگیری شاگرد کمفعال — a nudge now lands in the shared Messages hub too,
// so the student can answer the coach in the same conversation.
export async function POST(request: NextRequest, { params }: Ctx) {
  const auth = await authorizeTrainerRequest(request);
  if (!auth.ok) return auth.response;
  const { clientId } = await params;
  const body = await request.json().catch(() => null) as { message?: unknown } | null;
  const message = typeof body?.message === "string" && body.message.trim()
    ? body.message.trim().slice(0, 500)
    : "مدتی است فعالیتی از شما ندیدهام. برنامهتان را ادامه دهید — مربی شما پیگیر است.";

  const client = await prisma.trainerClient.findFirst({
    where: { id: clientId, trainerId: auth.access.profile.id, status: "ACTIVE" },
    select: { id: true, userId: true, user: { select: { name: true } } },
  });
  if (!client) return NextResponse.json({ error: "شاگرد فعال یافت نشد." }, { status: 404 });

  await prisma.$transaction(async (transaction) => {
    await transaction.feedback.create({
      data: {
        authorId: auth.access.user.id,
        recipientId: client.userId,
        trainerClientId: client.id,
        type: "GENERAL",
        content: message,
      },
    });
    await transaction.notification.create({
      data: {
        userId: client.userId,
        type: "GENERAL",
        title: "پیام مربی شما",
        message: message.slice(0, 160),
        href: "/user/messages",
      },
    });
  });

  return NextResponse.json({ ok: true, message: "یادآوری ارسال شد." });
}

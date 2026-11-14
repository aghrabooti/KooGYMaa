import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { checkGeneralRateLimit, rateLimitResponse } from "@/lib/rate-limit";

// ارتباط مربی و شاگرد — send one message inside a coaching relationship.
// A message is a Feedback row (type GENERAL, no parent), bound to the
// TrainerClient relationship. Older feedback/replies show up in the same chat.
const MAX_LENGTH = 2_000;

export async function POST(request: NextRequest) {
  const limit = checkGeneralRateLimit(request, 60, 60_000);
  if (!limit.allowed) return rateLimitResponse(limit);

  const auth = await authorizeApiRequest(request, ["TRAINER", "USER"]);
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => null)) as
    | { relationshipId?: unknown; content?: unknown }
    | null;
  const relationshipId =
    typeof body?.relationshipId === "string" ? body.relationshipId.trim() : "";
  const content = typeof body?.content === "string" ? body.content.trim() : "";

  if (!relationshipId) {
    return NextResponse.json({ error: "گفتگویی انتخاب نشده است." }, { status: 400 });
  }
  if (content.length < 2 || content.length > MAX_LENGTH) {
    return NextResponse.json(
      { error: "پیام باید بین ۲ تا ۲۰۰۰ کاراکتر باشد." },
      { status: 400 },
    );
  }

  const relationship = await prisma.trainerClient.findFirst({
    where: { id: relationshipId },
    select: {
      id: true,
      status: true,
      userId: true,
      trainer: { select: { userId: true, user: { select: { name: true } } } },
      user: { select: { name: true } },
    },
  });
  if (!relationship) {
    return NextResponse.json({ error: "گفتگو یافت نشد." }, { status: 404 });
  }

  const viewerId = auth.user.id;
  const isTrainer =
    auth.user.role === "TRAINER" && relationship.trainer.userId === viewerId;
  const isMember = auth.user.role === "USER" && relationship.userId === viewerId;
  if (!isTrainer && !isMember) {
    return NextResponse.json(
      { error: "شما به این گفتگو دسترسی ندارید." },
      { status: 403 },
    );
  }
  if (relationship.status !== "ACTIVE" && relationship.status !== "PAUSED") {
    return NextResponse.json(
      { error: "این ارتباط مربیگری فعال نیست." },
      { status: 403 },
    );
  }

  const recipientId = isTrainer ? relationship.userId : relationship.trainer.userId;
  const senderName = isTrainer
    ? relationship.trainer.user.name
    : relationship.user.name;

  const message = await prisma.$transaction(async (transaction) => {
    const created = await transaction.feedback.create({
      data: {
        authorId: viewerId,
        recipientId,
        trainerClientId: relationship.id,
        type: "GENERAL",
        content,
      },
      select: { id: true, content: true, createdAt: true },
    });
    await transaction.notification.create({
      data: {
        userId: recipientId,
        type: "FEEDBACK",
        title: isTrainer
          ? `پیام تازه از مربی ${senderName}`
          : `پیام تازه از ${senderName}`,
        message: content.slice(0, 160),
        href: isTrainer ? "/user/messages" : "/trainer/messages",
      },
    });
    return created;
  });

  return NextResponse.json({ message }, { status: 201 });
}

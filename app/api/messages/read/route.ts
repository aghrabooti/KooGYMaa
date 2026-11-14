import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// Mark the messages addressed to the viewer in one conversation as read.
export async function POST(request: NextRequest) {
  const auth = await authorizeApiRequest(request, ["TRAINER", "USER"]);
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => null)) as
    | { relationshipId?: unknown }
    | null;
  const relationshipId =
    typeof body?.relationshipId === "string" ? body.relationshipId.trim() : "";
  if (!relationshipId) {
    return NextResponse.json({ error: "گفتگویی انتخاب نشده است." }, { status: 400 });
  }

  const relationship = await prisma.trainerClient.findFirst({
    where: {
      id: relationshipId,
      OR: [
        { userId: auth.user.id },
        { trainer: { userId: auth.user.id } },
      ],
    },
    select: { id: true },
  });
  if (!relationship) {
    return NextResponse.json({ error: "گفتگو یافت نشد." }, { status: 404 });
  }

  const result = await prisma.feedback.updateMany({
    where: {
      trainerClientId: relationship.id,
      recipientId: auth.user.id,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true, updated: result.count });
}

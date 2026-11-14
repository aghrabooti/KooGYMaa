import type { Metadata } from "next";
import { MessageInbox } from "@/components/messages/message-inbox";
import { requireCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  buildConversations,
  type RawMessage,
  type RelationshipView,
} from "@/lib/messages";

export const metadata: Metadata = { title: "پیام‌ها | فضای عضو" };

export default async function UserMessagesPage() {
  const user = await requireCurrentUser(["USER"]);

  const coaches = await prisma.trainerClient.findMany({
    where: {
      userId: user.id,
      status: { in: ["ACTIVE", "PAUSED"] },
    },
    select: {
      id: true,
      status: true,
      trainer: {
        select: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      gym: { select: { name: true } },
    },
    orderBy: { requestedAt: "desc" },
    take: 50,
  });

  const relationships: RelationshipView[] = coaches.map((coach) => ({
    id: coach.id,
    partnerId: coach.trainer.user.id,
    partnerName: coach.trainer.user.name,
    partnerEmail: coach.trainer.user.email,
    gymName: coach.gym?.name ?? null,
    status: coach.status,
    href: "/user/progress",
  }));

  const ids = relationships.map((item) => item.id);
  const messages = ids.length
    ? await prisma.feedback.findMany({
        where: { trainerClientId: { in: ids } },
        select: {
          id: true,
          trainerClientId: true,
          authorId: true,
          recipientId: true,
          content: true,
          createdAt: true,
          readAt: true,
          type: true,
          author: { select: { name: true } },
        },
        orderBy: { createdAt: "asc" },
        take: 600,
      })
    : [];

  const conversations = buildConversations(
    relationships,
    messages as RawMessage[],
    user.id,
  );

  return (
    <div className="member-page">
      <MessageInbox
        role="user"
        conversations={conversations}
        viewerId={user.id}
      />
    </div>
  );
}

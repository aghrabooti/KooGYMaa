import type { Metadata } from "next";
import { MessageInbox } from "@/components/messages/message-inbox";
import { requireTrainerAccess } from "@/lib/trainer-access";
import { prisma } from "@/lib/prisma";
import {
  buildConversations,
  type RawMessage,
  type RelationshipView,
} from "@/lib/messages";

export const metadata: Metadata = { title: "پیام‌ها | فضای مربی" };

type PageProps = { searchParams: Promise<{ student?: string }> };

export default async function TrainerMessagesPage({ searchParams }: PageProps) {
  const access = await requireTrainerAccess();
  const { student } = await searchParams;

  const clients = await prisma.trainerClient.findMany({
    where: {
      trainerId: access.profile.id,
      status: { in: ["ACTIVE", "PAUSED"] },
    },
    select: {
      id: true,
      status: true,
      user: { select: { id: true, name: true, email: true } },
      gym: { select: { name: true } },
    },
    orderBy: { user: { name: "asc" } },
    take: 200,
  });

  const relationships: RelationshipView[] = clients.map((client) => ({
    id: client.id,
    partnerId: client.user.id,
    partnerName: client.user.name,
    partnerEmail: client.user.email,
    gymName: client.gym?.name ?? null,
    status: client.status,
    href: `/trainer/progress/${client.id}`,
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
        take: 1_000,
      })
    : [];

  const conversations = buildConversations(
    relationships,
    messages as RawMessage[],
    access.user.id,
  );

  return (
    <div className="trainer-page">
      <MessageInbox
        role="trainer"
        conversations={conversations}
        viewerId={access.user.id}
        initialId={student || undefined}
      />
    </div>
  );
}

import type { ReactNode } from "react";
import { TrainerNav } from "@/components/trainer/trainer-nav";
import { requireTrainerAccess } from "@/lib/trainer-access";
import { prisma } from "@/lib/prisma";

export default async function TrainerLayout({ children }: { children: ReactNode }) {
  const access = await requireTrainerAccess();
  const [pendingStudents, unreadMessages] = await Promise.all([
    prisma.trainerClient.count({
      where: { trainerId: access.profile.id, status: "PENDING" },
    }),
    // Every unread Feedback row (messages, feedback threads and replies)
    // addressed to this trainer feeds the "پیام‌ها" badge.
    prisma.feedback.count({
      where: { recipientId: access.user.id, readAt: null },
    }),
  ]);

  return <main className="trainer-shell"><TrainerNav pendingStudents={pendingStudents} unreadMessages={unreadMessages} user={access.user} /><section className="trainer-main">{children}</section></main>;
}

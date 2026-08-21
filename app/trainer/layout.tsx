import type { ReactNode } from "react";
import { TrainerNav } from "@/components/trainer/trainer-nav";
import { requireTrainerAccess } from "@/lib/trainer-access";
import { prisma } from "@/lib/prisma";

export default async function TrainerLayout({ children }: { children: ReactNode }) {
  const access = await requireTrainerAccess();
  const pendingStudents = await prisma.trainerClient.count({
    where: { trainerId: access.profile.id, status: "PENDING" },
  });

  return <main className="trainer-shell"><TrainerNav pendingStudents={pendingStudents} user={access.user} /><section className="trainer-main">{children}</section></main>;
}

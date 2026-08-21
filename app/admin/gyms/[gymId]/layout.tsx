import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireGymAdminAccess } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

export default async function GymAdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ gymId: string }>;
}) {
  const { gymId } = await params;
  const access = await requireGymAdminAccess(gymId);
  const [pendingMembers, pendingTrainers] = await Promise.all([
    prisma.gymMembership.count({ where: { gymId, status: "PENDING" } }),
    prisma.gymTrainer.count({ where: { gymId, status: "PENDING" } }),
  ]);

  return (
    <main className="admin-shell">
      <AdminNav
        gym={access.gym}
        pendingCount={pendingMembers + pendingTrainers}
        user={access.user}
      />
      <section className="admin-main">{children}</section>
    </main>
  );
}

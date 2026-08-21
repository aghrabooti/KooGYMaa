import type { ReactNode } from "react";
import { UserNav } from "@/components/user/user-nav";
import { requireCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function UserLayout({ children }: { children: ReactNode }) {
  const user = await requireCurrentUser(["USER"]);
  const unread = await prisma.notification.count({ where: { userId: user.id, readAt: null } });
  return <main className="member-shell"><UserNav name={user.name} unread={unread} /><section className="member-main">{children}</section></main>;
}

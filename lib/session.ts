import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  type AppRole,
  isAppRole,
  SESSION_COOKIE_NAME,
  verifyToken,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  email: string;
  id: string;
  name: string;
  role: AppRole;
};

export async function getUserFromSessionToken(
  token: string | null | undefined,
): Promise<SessionUser | null> {
  const claims = verifyToken(token);
  if (!claims) return null;

  const user = await prisma.user.findUnique({
    where: { id: claims.userId },
    select: {
      email: true,
      id: true,
      name: true,
      role: true,
      status: true,
    },
  });

  if (!user || user.status !== "ACTIVE" || !isAppRole(user.role)) return null;

  return {
    email: user.email,
    id: user.id,
    name: user.name,
    role: user.role,
  };
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  return getUserFromSessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
});

export async function requireCurrentUser(
  allowedRoles?: readonly AppRole[],
): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect("/dashboard");
  }

  return user;
}

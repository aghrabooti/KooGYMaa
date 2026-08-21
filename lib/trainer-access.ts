import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { authorizeApiRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser, type SessionUser } from "@/lib/session";

export type TrainerAccess = {
  profile: {
    id: string;
    specialty: string | null;
  };
  user: SessionUser;
};

async function findProfile(userId: string) {
  return prisma.trainerProfile.findUnique({
    where: { userId },
    select: { id: true, specialty: true },
  });
}

export async function requireTrainerAccess(): Promise<TrainerAccess> {
  const user = await requireCurrentUser(["TRAINER"]);
  const profile = await findProfile(user.id);
  if (!profile) redirect("/login");
  return { profile, user };
}

type ApiTrainerAccess =
  | { access: TrainerAccess; ok: true }
  | { ok: false; response: NextResponse };

export async function authorizeTrainerRequest(request: NextRequest): Promise<ApiTrainerAccess> {
  const authorization = await authorizeApiRequest(request, ["TRAINER"]);
  if (!authorization.ok) return authorization;

  const profile = await findProfile(authorization.user.id);
  if (!profile) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Trainer profile not found." },
        { status: 403 },
      ),
    };
  }

  return {
    access: { profile, user: authorization.user },
    ok: true,
  };
}

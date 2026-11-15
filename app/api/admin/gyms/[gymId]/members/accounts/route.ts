import type { NextRequest } from "next/server";
import { createManagedAccount } from "@/lib/accounts";
import { authorizeGymAdminRequest } from "@/lib/admin-access";

type Context = { params: Promise<{ gymId: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  const { gymId } = await params;
  const authorization = await authorizeGymAdminRequest(request, gymId);
  if (!authorization.ok) return authorization.response;

  const body = await request.json().catch(() => null);
  const now = new Date();
  return createManagedAccount(body, "USER", {
    gymMemberships: {
      create: {
        gym: { connect: { id: gymId } },
        reviewedBy: { connect: { id: authorization.access.user.id } },
        status: "ACTIVE",
        reviewedAt: now,
        startedAt: now,
      },
    },
  });
}

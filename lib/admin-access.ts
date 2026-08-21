import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { authorizeApiRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser, type SessionUser } from "@/lib/session";

export type GymAdminAccess = {
  gym: {
    city: string | null;
    id: string;
    name: string;
    slug: string;
    status: "DRAFT" | "ACTIVE" | "SUSPENDED" | "ARCHIVED";
  };
  staffRole: "OWNER" | "MANAGER";
  user: SessionUser;
};

export async function getAdminGyms(userId: string) {
  return prisma.gymStaff.findMany({
    where: {
      userId,
      status: "ACTIVE",
    },
    select: {
      role: true,
      gym: {
        select: {
          city: true,
          id: true,
          name: true,
          slug: true,
          status: true,
        },
      },
    },
    orderBy: { gym: { name: "asc" } },
  });
}

export async function requireGymAdminAccess(gymId: string): Promise<GymAdminAccess> {
  const user = await requireCurrentUser(["ADMIN"]);
  const staff = await prisma.gymStaff.findUnique({
    where: { gymId_userId: { gymId, userId: user.id } },
    select: {
      role: true,
      status: true,
      gym: {
        select: {
          city: true,
          id: true,
          name: true,
          slug: true,
          status: true,
        },
      },
    },
  });

  if (!staff || staff.status !== "ACTIVE") {
    redirect("/admin/gyms?error=access-denied");
  }

  return { gym: staff.gym, staffRole: staff.role, user };
}

type ApiGymAccessSuccess = {
  access: GymAdminAccess;
  ok: true;
};

type ApiGymAccessFailure = {
  ok: false;
  response: NextResponse;
};

export async function authorizeGymAdminRequest(
  request: NextRequest,
  gymId: string,
): Promise<ApiGymAccessSuccess | ApiGymAccessFailure> {
  const authorization = await authorizeApiRequest(request, ["ADMIN"]);
  if (!authorization.ok) return authorization;

  const staff = await prisma.gymStaff.findUnique({
    where: {
      gymId_userId: {
        gymId,
        userId: authorization.user.id,
      },
    },
    select: {
      role: true,
      status: true,
      gym: {
        select: {
          city: true,
          id: true,
          name: true,
          slug: true,
          status: true,
        },
      },
    },
  });

  if (!staff || staff.status !== "ACTIVE") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "You do not have access to this gym." },
        { status: 403 },
      ),
    };
  }

  return {
    ok: true,
    access: {
      gym: staff.gym,
      staffRole: staff.role,
      user: authorization.user,
    },
  };
}

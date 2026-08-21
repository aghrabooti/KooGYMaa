import { NextResponse, type NextRequest } from "next/server";
import { authorizeGymAdminRequest } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ gymId: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { gymId } = await params;
  const authorization = await authorizeGymAdminRequest(request, gymId);
  if (!authorization.ok) return authorization.response;

  const status = request.nextUrl.searchParams.get("status");
  const validStatuses = new Set(["PENDING", "ACTIVE", "REJECTED", "SUSPENDED", "EXPIRED", "CANCELLED"]);

  const memberships = await prisma.gymMembership.findMany({
    where: {
      gymId,
      ...(status && validStatuses.has(status)
        ? { status: status as "PENDING" | "ACTIVE" | "REJECTED" | "SUSPENDED" | "EXPIRED" | "CANCELLED" }
        : {}),
    },
    select: {
      id: true,
      status: true,
      requestedAt: true,
      startedAt: true,
      expiresAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { requestedAt: "desc" }],
  });

  return NextResponse.json({ memberships }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest, { params }: Context) {
  const { gymId } = await params;
  const authorization = await authorizeGymAdminRequest(request, gymId);
  if (!authorization.ok) return authorization.response;

  const body = await request.json().catch(() => null) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid member email." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true, status: true },
  });
  if (!user || user.role !== "USER" || user.status !== "ACTIVE") {
    return NextResponse.json({ error: "No active member account was found for this email." }, { status: 404 });
  }

  const now = new Date();
  const membership = await prisma.gymMembership.upsert({
    where: { gymId_userId: { gymId, userId: user.id } },
    update: {
      status: "ACTIVE",
      reviewedAt: now,
      reviewedById: authorization.access.user.id,
      startedAt: now,
      endedAt: null,
    },
    create: {
      gymId,
      userId: user.id,
      status: "ACTIVE",
      reviewedAt: now,
      reviewedById: authorization.access.user.id,
      startedAt: now,
    },
    select: { id: true, status: true },
  });

  return NextResponse.json({ membership }, { status: 201 });
}

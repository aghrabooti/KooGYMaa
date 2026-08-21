import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { validateGymInput } from "@/lib/admin-validation";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";

function isUniqueError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function GET(request: NextRequest) {
  const authorization = await authorizeApiRequest(request, ["ADMIN"]);
  if (!authorization.ok) return authorization.response;

  const gyms = await prisma.gymStaff.findMany({
    where: { userId: authorization.user.id, status: "ACTIVE" },
    select: {
      role: true,
      gym: {
        select: {
          id: true,
          name: true,
          slug: true,
          city: true,
          status: true,
          _count: {
            select: {
              memberships: { where: { status: "ACTIVE" } },
              trainers: { where: { status: "ACTIVE" } },
            },
          },
        },
      },
    },
    orderBy: { gym: { name: "asc" } },
  });

  return NextResponse.json({ gyms }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const authorization = await authorizeApiRequest(request, ["ADMIN"]);
  if (!authorization.ok) return authorization.response;

  const body = await request.json().catch(() => null);
  const validation = validateGymInput(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const gym = await prisma.gym.create({
      data: {
        name: validation.data.name!,
        slug: validation.data.slug!,
        address: validation.data.address,
        city: validation.data.city,
        country: validation.data.country,
        description: validation.data.description,
        email: validation.data.email,
        phone: validation.data.phone,
        status: validation.data.status ?? "ACTIVE",
        staff: {
          create: {
            userId: authorization.user.id,
            role: "OWNER",
            status: "ACTIVE",
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        city: true,
        status: true,
      },
    });

    await recordAudit({ action: "GYM_CREATED", actorId: authorization.user.id, actorRole: authorization.user.role, gymId: gym.id, entityType: "Gym", entityId: gym.id, request });
    return NextResponse.json({ gym }, { status: 201 });
  } catch (error) {
    if (isUniqueError(error)) {
      return NextResponse.json({ error: "A gym with this URL slug already exists." }, { status: 409 });
    }
    console.error("Gym creation failed:", error);
    return NextResponse.json({ error: "Unable to create the gym right now." }, { status: 500 });
  }
}

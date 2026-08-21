import { NextResponse, type NextRequest } from "next/server";
import { authorizeGymAdminRequest } from "@/lib/admin-access";
import { validateGymInput } from "@/lib/admin-validation";
import { prisma } from "@/lib/prisma";
import { recordAudit } from "@/lib/audit";

type Context = { params: Promise<{ gymId: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { gymId } = await params;
  const authorization = await authorizeGymAdminRequest(request, gymId);
  if (!authorization.ok) return authorization.response;

  const gym = await prisma.gym.findUnique({
    where: { id: gymId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      country: true,
      latitude: true,
      longitude: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ gym }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: NextRequest, { params }: Context) {
  const { gymId } = await params;
  const authorization = await authorizeGymAdminRequest(request, gymId);
  if (!authorization.ok) return authorization.response;

  const body = await request.json().catch(() => null);
  const validation = validateGymInput(body, true);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  if (validation.data.status === "ARCHIVED" && authorization.access.staffRole !== "OWNER") {
    return NextResponse.json({ error: "Only a gym owner can archive this workspace." }, { status: 403 });
  }

  try {
    const gym = await prisma.gym.update({
      where: { id: gymId },
      data: validation.data,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        status: true,
      },
    });

    await recordAudit({ action: "GYM_UPDATED", actorId: authorization.access.user.id, actorRole: authorization.access.user.role, gymId, entityType: "Gym", entityId: gymId, metadata: { fields: Object.keys(validation.data) }, request });
    return NextResponse.json({ gym });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "A gym with this URL slug already exists." }, { status: 409 });
    }
    console.error("Gym update failed:", error);
    return NextResponse.json({ error: "Unable to update the gym right now." }, { status: 500 });
  }
}

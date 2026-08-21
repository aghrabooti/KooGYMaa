import { NextResponse, type NextRequest } from "next/server";
import { authorizeGymAdminRequest } from "@/lib/admin-access";
import { validatePlanInput } from "@/lib/admin-validation";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ gymId: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  const { gymId } = await params;
  const authorization = await authorizeGymAdminRequest(request, gymId);
  if (!authorization.ok) return authorization.response;

  const plans = await prisma.subscriptionPlan.findMany({
    where: { gymId },
    select: {
      id: true,
      name: true,
      description: true,
      audience: true,
      price: true,
      currency: true,
      durationDays: true,
      isActive: true,
      _count: { select: { subscriptions: true } },
    },
    orderBy: [{ isActive: "desc" }, { audience: "asc" }, { price: "asc" }],
  });

  return NextResponse.json({ plans }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest, { params }: Context) {
  const { gymId } = await params;
  const authorization = await authorizeGymAdminRequest(request, gymId);
  if (!authorization.ok) return authorization.response;

  const body = await request.json().catch(() => null);
  const validation = validatePlanInput(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const plan = await prisma.subscriptionPlan.create({
      data: {
        gymId,
        name: validation.data.name!,
        audience: validation.data.audience!,
        price: validation.data.price!,
        currency: validation.data.currency!,
        durationDays: validation.data.durationDays!,
        description: validation.data.description,
        isActive: validation.data.isActive,
      },
      select: {
        id: true,
        name: true,
        audience: true,
        price: true,
        currency: true,
        durationDays: true,
        isActive: true,
      },
    });
    return NextResponse.json({ plan }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "A plan with this name and audience already exists." }, { status: 409 });
    }
    console.error("Plan creation failed:", error);
    return NextResponse.json({ error: "Unable to create the plan right now." }, { status: 500 });
  }
}

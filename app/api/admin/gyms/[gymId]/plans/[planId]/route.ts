import { NextResponse, type NextRequest } from "next/server";
import { authorizeGymAdminRequest } from "@/lib/admin-access";
import { validatePlanInput } from "@/lib/admin-validation";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ gymId: string; planId: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const { gymId, planId } = await params;
  const authorization = await authorizeGymAdminRequest(request, gymId);
  if (!authorization.ok) return authorization.response;

  const existing = await prisma.subscriptionPlan.findFirst({
    where: { id: planId, gymId },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Subscription plan not found in this gym." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const validation = validatePlanInput(body, true);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const plan = await prisma.subscriptionPlan.update({
      where: { id: existing.id },
      data: validation.data,
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
    return NextResponse.json({ plan });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "A plan with this name and audience already exists." }, { status: 409 });
    }
    console.error("Plan update failed:", error);
    return NextResponse.json({ error: "Unable to update the plan right now." }, { status: 500 });
  }
}

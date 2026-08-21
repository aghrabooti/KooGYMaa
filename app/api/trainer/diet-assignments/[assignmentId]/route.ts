import { NextResponse, type NextRequest } from "next/server";
import { authorizeTrainerRequest } from "@/lib/trainer-access";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ assignmentId: string }> };

export async function PATCH(request: NextRequest, { params }: Context) {
  const authorization = await authorizeTrainerRequest(request);
  if (!authorization.ok) return authorization.response;
  const { assignmentId } = await params;
  const body = await request.json().catch(() => null) as { status?: unknown } | null;
  const statuses = ["ASSIGNED", "ACTIVE", "COMPLETED", "CANCELLED"] as const;
  if (!statuses.includes(body?.status as (typeof statuses)[number])) return NextResponse.json({ error: "Choose a valid assignment status." }, { status: 400 });
  const existing = await prisma.dietAssignment.findFirst({ where: { id: assignmentId, plan: { trainerId: authorization.access.profile.id } }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Nutrition assignment not found." }, { status: 404 });
  const assignment = await prisma.dietAssignment.update({ where: { id: existing.id }, data: { status: body!.status as (typeof statuses)[number] }, select: { id: true, status: true } });
  return NextResponse.json({ assignment });
}

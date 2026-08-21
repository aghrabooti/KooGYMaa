import { NextResponse, type NextRequest } from "next/server";
import { authorizeTrainerRequest } from "@/lib/trainer-access";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ gymTrainerId: string }> };

export async function DELETE(request: NextRequest, { params }: Context) {
  const authorization = await authorizeTrainerRequest(request);
  if (!authorization.ok) return authorization.response;
  const { gymTrainerId } = await params;

  const membership = await prisma.gymTrainer.findFirst({
    where: { id: gymTrainerId, trainerId: authorization.access.profile.id },
    select: { id: true },
  });
  if (!membership) return NextResponse.json({ error: "Gym membership not found." }, { status: 404 });

  const updated = await prisma.gymTrainer.update({
    where: { id: membership.id },
    data: { status: "CANCELLED", endedAt: new Date() },
    select: { id: true, status: true },
  });
  return NextResponse.json({ membership: updated });
}

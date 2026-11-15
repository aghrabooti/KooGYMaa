import { NextResponse, type NextRequest } from "next/server";
import { createManagedAccount } from "@/lib/accounts";
import { prisma } from "@/lib/prisma";
import { authorizeTrainerRequest } from "@/lib/trainer-access";

export async function POST(request: NextRequest) {
  const authorization = await authorizeTrainerRequest(request);
  if (!authorization.ok) return authorization.response;

  const body = await request.json().catch(() => null);
  const trainerId = authorization.access.profile.id;
  const gymId = typeof body?.gymId === "string" ? body.gymId.trim() : "";

  if (gymId) {
    const affiliation = await prisma.gymTrainer.findUnique({
      where: { gymId_trainerId: { gymId, trainerId } },
      select: { status: true },
    });
    if (affiliation?.status !== "ACTIVE") {
      return NextResponse.json({ error: "فقط در باشگاهی که مربی فعال آن هستید می‌توانید شاگرد ثبت کنید." }, { status: 403 });
    }
  }

  return createManagedAccount(body, "USER", {
    trainerRelationships: {
      create: {
        trainer: { connect: { id: trainerId } },
        ...(gymId ? { gym: { connect: { id: gymId } } } : {}),
        status: "ACTIVE",
        startedAt: new Date(),
      },
    },
  });
}

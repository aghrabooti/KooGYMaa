import { NextResponse, type NextRequest } from "next/server";
import { authorizeTrainerRequest } from "@/lib/trainer-access";
import { validateAvailability } from "@/lib/trainer-validation";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authorization = await authorizeTrainerRequest(request);
  if (!authorization.ok) return authorization.response;
  const slots = await prisma.trainerAvailability.findMany({
    where: { trainerId: authorization.access.profile.id, isActive: true },
    select: { id: true, dayOfWeek: true, startMinutes: true, endMinutes: true, timezone: true },
    orderBy: [{ dayOfWeek: "asc" }, { startMinutes: "asc" }],
  });
  return NextResponse.json({ slots }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: NextRequest) {
  const authorization = await authorizeTrainerRequest(request);
  if (!authorization.ok) return authorization.response;
  const body = await request.json().catch(() => null);
  const validation = validateAvailability(body);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  await prisma.$transaction(async (transaction) => {
    await transaction.trainerAvailability.deleteMany({
      where: { trainerId: authorization.access.profile.id },
    });
    if (validation.data.slots.length) {
      await transaction.trainerAvailability.createMany({
        data: validation.data.slots.map((slot) => ({
          ...slot,
          trainerId: authorization.access.profile.id,
          timezone: validation.data.timezone,
          isActive: true,
        })),
      });
    }
  });

  return NextResponse.json({ message: "Availability updated." });
}

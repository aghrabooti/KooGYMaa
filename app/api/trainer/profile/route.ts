import { NextResponse, type NextRequest } from "next/server";
import { authorizeTrainerRequest } from "@/lib/trainer-access";
import { validateTrainerProfile } from "@/lib/trainer-validation";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authorization = await authorizeTrainerRequest(request);
  if (!authorization.ok) return authorization.response;

  const profile = await prisma.trainerProfile.findUnique({
    where: { id: authorization.access.profile.id },
    select: {
      id: true,
      bio: true,
      specialty: true,
      experienceYears: true,
      hourlyRate: true,
      currency: true,
      isAvailable: true,
      user: { select: { name: true, email: true, phone: true } },
    },
  });
  return NextResponse.json({ profile }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: NextRequest) {
  const authorization = await authorizeTrainerRequest(request);
  if (!authorization.ok) return authorization.response;

  const body = await request.json().catch(() => null);
  const validation = validateTrainerProfile(body);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  const profile = await prisma.trainerProfile.update({
    where: { id: authorization.access.profile.id },
    data: validation.data,
    select: {
      id: true,
      bio: true,
      specialty: true,
      experienceYears: true,
      hourlyRate: true,
      currency: true,
      isAvailable: true,
    },
  });
  return NextResponse.json({ profile });
}

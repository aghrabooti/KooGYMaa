import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authorizeApiRequest } from "@/lib/api-auth";
import { calculateMonthsAsStudent, calculateDaysAsStudent, formatJourneyDuration, buildNimaJourney } from "@/lib/journey";

export async function GET(request: NextRequest) {
  const auth = await authorizeApiRequest(request, ["USER"]);
  if (!auth.ok) return auth.response;

  const userId = auth.user.id;

  // Get all trainer relationships
  const clients = await prisma.trainerClient.findMany({
    where: { userId, status: "ACTIVE" },
    include: {
      trainer: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: { startedAt: "asc" },
  });

  // Get body measurements for progress
  const measurements = await prisma.bodyMeasurement.findMany({
    where: { userId },
    orderBy: { recordedAt: "asc" },
    select: {
      id: true,
      recordedAt: true,
      weightKg: true,
      bodyFatPercent: true,
      waistCm: true,
      chestCm: true,
      armCm: true,
      notes: true,
    },
  });

  // Get workout assignments count
  const workoutAssignments = await prisma.workoutAssignment.count({ where: { userId, status: "ACTIVE" } });
  const dietAssignments = await prisma.dietAssignment.count({ where: { userId, status: "ACTIVE" } });
  const workoutLogs = await prisma.workoutLog.count({ where: { userId } });
  const feedbackCount = await prisma.feedback.count({ where: { recipientId: userId } });

  const journeyData = clients.map((client) => {
    const startedAt = client.startedAt || client.createdAt;
    const months = calculateMonthsAsStudent(startedAt);
    const days = calculateDaysAsStudent(startedAt);
    const duration = formatJourneyDuration(startedAt);

    return {
      trainerId: client.trainerId,
      trainerName: client.trainer.user.name,
      trainerEmail: client.trainer.user.email,
      startedAt: startedAt.toISOString(),
      monthsAsStudent: months,
      daysAsStudent: days,
      durationFa: duration,
      status: client.status,
    };
  });

  // Special handling for Nima - if email is member@koogymaa.test, include detailed 6-month journey
  const isNima = auth.user.email === "member@koogymaa.test";
  const detailedJourney = isNima ? buildNimaJourney() : null;

  // Calculate overall progress if measurements exist
  let progress = null;
  if (measurements.length >= 2) {
    const first = measurements[0];
    const latest = measurements[measurements.length - 1];
    progress = {
      weightChange: latest.weightKg && first.weightKg ? latest.weightKg - first.weightKg : null,
      bodyFatChange: latest.bodyFatPercent && first.bodyFatPercent ? latest.bodyFatPercent - first.bodyFatPercent : null,
      waistChange: latest.waistCm && first.waistCm ? latest.waistCm - first.waistCm : null,
      totalMeasurements: measurements.length,
      firstDate: first.recordedAt.toISOString(),
      latestDate: latest.recordedAt.toISOString(),
    };
  }

  return NextResponse.json(
    {
      user: {
        id: userId,
        email: auth.user.email,
      },
      journey: journeyData,
      isNima,
      detailedJourney,
      measurements: measurements.map((m) => ({
        ...m,
        recordedAt: m.recordedAt.toISOString(),
      })),
      stats: {
        activeWorkoutPlans: workoutAssignments,
        activeDietPlans: dietAssignments,
        totalWorkoutLogs: workoutLogs,
        totalFeedback: feedbackCount,
      },
      progress,
      message: journeyData.length
        ? `شما ${journeyData[0].durationFa} شاگرد ${journeyData[0].trainerName} هستید`
        : "هنوز شاگرد مربی‌ای نیستید",
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

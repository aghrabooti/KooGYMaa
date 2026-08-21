export async function seedProgress(prisma, context) {
  const {
    ids,
    member,
    workoutPlan,
    workoutAssignment,
    dietPlan,
    dietAssignment,
    yesterday,
    yesterdayEnd,
    now,
    addDays,
  } = context;

  const workoutDay = await prisma.workoutDay.findFirstOrThrow({
    where: { planId: workoutPlan.id },
    orderBy: { dayNumber: "asc" },
    include: { exercises: { orderBy: { order: "asc" } } },
  });
  const workoutLog = await prisma.workoutLog.upsert({
    where: { id: ids.workoutLog },
    update: { status: "COMPLETED", completedAt: yesterdayEnd, perceivedEffort: 7 },
    create: {
      id: ids.workoutLog,
      assignmentId: workoutAssignment.id,
      userId: member.id,
      workoutDayId: workoutDay.id,
      status: "COMPLETED",
      startedAt: yesterday,
      completedAt: yesterdayEnd,
      perceivedEffort: 7,
      notes: "Felt strong and controlled throughout the session.",
      exerciseLogs: {
        create: workoutDay.exercises.map((exercise) => ({
          exerciseId: exercise.id,
          completed: true,
          actualSets: exercise.sets,
          actualReps: exercise.reps,
          actualWeight: exercise.name === "Back Squat" ? "70 kg" : null,
          rpe: 7,
        })),
      },
    },
  });

  const dietDay = await prisma.dietDay.findFirstOrThrow({
    where: { planId: dietPlan.id },
    orderBy: { dayNumber: "asc" },
    include: { meals: { orderBy: { order: "asc" } } },
  });
  await prisma.nutritionLog.upsert({
    where: { id: ids.nutritionLog },
    update: { completedAt: yesterdayEnd, hungerRating: 4, energyRating: 8 },
    create: {
      id: ids.nutritionLog,
      assignmentId: dietAssignment.id,
      userId: member.id,
      dietDayId: dietDay.id,
      logDate: new Date(Date.UTC(yesterday.getUTCFullYear(), yesterday.getUTCMonth(), yesterday.getUTCDate())),
      completedAt: yesterdayEnd,
      hungerRating: 4,
      energyRating: 8,
      notes: "Good energy through the afternoon workout.",
      mealLogs: {
        create: dietDay.meals.map((meal) => ({
          mealId: meal.id,
          completed: true,
          actualPortion: "As prescribed",
        })),
      },
    },
  });

  const startingMeasurement = await prisma.bodyMeasurement.upsert({
    where: { id: ids.measurementStart },
    update: {},
    create: {
      id: ids.measurementStart,
      userId: member.id,
      recordedAt: addDays(now, -30),
      weightKg: 82.4,
      bodyFatPercent: 19.5,
      waistCm: 88,
      chestCm: 101,
      armCm: 34.5,
    },
  });
  await prisma.bodyMeasurement.upsert({
    where: { id: ids.measurementLatest },
    update: { recordedAt: now, weightKg: 80.8, bodyFatPercent: 18.2, waistCm: 85.5 },
    create: {
      id: ids.measurementLatest,
      userId: member.id,
      recordedAt: now,
      weightKg: 80.8,
      bodyFatPercent: 18.2,
      waistCm: 85.5,
      chestCm: 102,
      armCm: 35.2,
      notes: "End of first training block.",
    },
  });
  await prisma.progressPhoto.upsert({
    where: { id: ids.progressPhoto },
    update: {},
    create: {
      id: ids.progressPhoto,
      userId: member.id,
      measurementId: startingMeasurement.id,
      imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e",
      pose: "Front",
    },
  });
  await prisma.notification.upsert({
    where: { id: ids.notificationPlan },
    update: {},
    create: {
      id: ids.notificationPlan,
      userId: member.id,
      type: "PLAN_ASSIGNED",
      title: "Your plans are ready",
      message: "Sara assigned your workout and nutrition plans.",
      href: "/user/workouts",
    },
  });

  return { workoutLog };
}

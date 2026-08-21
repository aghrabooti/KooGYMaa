import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import { seedProgress } from "./seed-progress.mjs";

if (process.env.NODE_ENV === "production" && process.env.ALLOW_PRODUCTION_SEED !== "true") {
  throw new Error("Refusing to seed production without ALLOW_PRODUCTION_SEED=true.");
}

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

const ids = {
  admin: "seed-user-admin",
  trainer: "seed-user-trainer",
  member: "seed-user-member",
  pendingMember: "seed-user-pending-member",
  pendingTrainer: "seed-user-pending-trainer",
  trainerProfile: "seed-trainer-profile",
  pendingTrainerProfile: "seed-pending-trainer-profile",
  gym: "seed-gym-central",
  secondGym: "seed-gym-atlas",
  staff: "seed-gym-owner",
  secondStaff: "seed-gym-atlas-owner",
  gymTrainer: "seed-gym-trainer",
  gymMembership: "seed-gym-membership",
  pendingGymMembership: "seed-pending-gym-membership",
  pendingGymTrainer: "seed-pending-gym-trainer",
  secondGymTrainer: "seed-atlas-gym-trainer",
  trainerClient: "seed-trainer-client",
  memberPlan: "seed-plan-member-monthly",
  trainerPlan: "seed-plan-trainer-monthly",
  secondMemberPlan: "seed-plan-atlas-member",
  memberSubscription: "seed-subscription-member",
  trainerSubscription: "seed-subscription-trainer",
  workoutPlan: "seed-workout-plan",
  workoutAssignment: "seed-workout-assignment",
  dietPlan: "seed-diet-plan",
  dietAssignment: "seed-diet-assignment",
  feedback: "seed-feedback",
  gymReview: "seed-gym-review",
  trainerReview: "seed-trainer-review",
  availabilityMonday: "seed-availability-monday",
  availabilityWednesday: "seed-availability-wednesday",
  availabilityFriday: "seed-availability-friday",
  sessionUpcoming: "seed-session-upcoming",
  sessionCompleted: "seed-session-completed",
  workoutLog: "seed-workout-log",
  nutritionLog: "seed-nutrition-log",
  measurementStart: "seed-measurement-start",
  measurementLatest: "seed-measurement-latest",
  progressPhoto: "seed-progress-photo",
  notificationPlan: "seed-notification-plan",
  paymentMember: "seed-payment-member",
  auditSeed: "seed-audit-payment",
};

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

async function upsertUser({ id, email, name, role, password }) {
  return prisma.user.upsert({
    where: { email },
    update: {
      name,
      role,
      status: "ACTIVE",
    },
    create: {
      id,
      email,
      name,
      password,
      role,
      status: "ACTIVE",
    },
  });
}

async function main() {
  const seedPassword = process.env.SEED_PASSWORD || "KooGYMaa123!";
  const password = await bcrypt.hash(seedPassword, 12);
  const now = new Date();
  const monthEnd = addDays(now, 30);

  const admin = await upsertUser({
    id: ids.admin,
    email: "admin@koogymaa.test",
    name: "KooGYMaa Admin",
    password,
    role: "ADMIN",
  });
  const trainerUser = await upsertUser({
    id: ids.trainer,
    email: "trainer@koogymaa.test",
    name: "Sara Trainer",
    password,
    role: "TRAINER",
  });
  const member = await upsertUser({
    id: ids.member,
    email: "member@koogymaa.test",
    name: "Nima Member",
    password,
    role: "USER",
  });
  const pendingMember = await upsertUser({
    id: ids.pendingMember,
    email: "pending.member@koogymaa.test",
    name: "Arman Applicant",
    password,
    role: "USER",
  });
  const pendingTrainerUser = await upsertUser({
    id: ids.pendingTrainer,
    email: "pending.trainer@koogymaa.test",
    name: "Leila Coach",
    password,
    role: "TRAINER",
  });

  const trainer = await prisma.trainerProfile.upsert({
    where: { userId: trainerUser.id },
    update: {
      bio: "Strength and mobility coach focused on sustainable progress.",
      currency: "IRR",
      experienceYears: 8,
      hourlyRate: 8_000_000,
      isAvailable: true,
      specialty: "Strength & Mobility",
    },
    create: {
      id: ids.trainerProfile,
      userId: trainerUser.id,
      bio: "Strength and mobility coach focused on sustainable progress.",
      currency: "IRR",
      experienceYears: 8,
      hourlyRate: 8_000_000,
      isAvailable: true,
      specialty: "Strength & Mobility",
    },
  });

  const pendingTrainer = await prisma.trainerProfile.upsert({
    where: { userId: pendingTrainerUser.id },
    update: {
      bio: "Functional fitness coach applying to join the gym.",
      currency: "IRR",
      experienceYears: 4,
      hourlyRate: 5_500_000,
      isAvailable: true,
      specialty: "Functional Fitness",
    },
    create: {
      id: ids.pendingTrainerProfile,
      userId: pendingTrainerUser.id,
      bio: "Functional fitness coach applying to join the gym.",
      currency: "IRR",
      experienceYears: 4,
      hourlyRate: 5_500_000,
      isAvailable: true,
      specialty: "Functional Fitness",
    },
  });

  const gym = await prisma.gym.upsert({
    where: { slug: "koogymaa-central" },
    update: {
      address: "Valiasr Street",
      city: "Tehran",
      country: "IR",
      description: "A modern strength, conditioning, and recovery space.",
      email: "central@koogymaa.test",
      name: "KooGYMaa Central",
      phone: "+98-21-5555-0101",
      status: "ACTIVE",
    },
    create: {
      id: ids.gym,
      address: "Valiasr Street",
      city: "Tehran",
      country: "IR",
      description: "A modern strength, conditioning, and recovery space.",
      email: "central@koogymaa.test",
      name: "KooGYMaa Central",
      phone: "+98-21-5555-0101",
      slug: "koogymaa-central",
      status: "ACTIVE",
    },
  });

  const secondGym = await prisma.gym.upsert({
    where: { slug: "atlas-fitness-north" },
    update: { name: "Atlas Fitness North", city: "Tehran", country: "IR", status: "ACTIVE" },
    create: {
      id: ids.secondGym,
      name: "Atlas Fitness North",
      slug: "atlas-fitness-north",
      description: "A bright neighborhood gym focused on functional training and community classes.",
      city: "Tehran",
      country: "IR",
      address: "Shariati Street",
      email: "north@atlas-fitness.test",
      phone: "+98-21-5555-0202",
      status: "ACTIVE",
    },
  });

  await prisma.gymStaff.upsert({
    where: { gymId_userId: { gymId: gym.id, userId: admin.id } },
    update: { role: "OWNER", status: "ACTIVE" },
    create: {
      id: ids.staff,
      gymId: gym.id,
      userId: admin.id,
      role: "OWNER",
      status: "ACTIVE",
    },
  });

  await prisma.gymStaff.upsert({
    where: { gymId_userId: { gymId: secondGym.id, userId: admin.id } },
    update: { role: "OWNER", status: "ACTIVE" },
    create: { id: ids.secondStaff, gymId: secondGym.id, userId: admin.id, role: "OWNER", status: "ACTIVE" },
  });

  await prisma.gymTrainer.upsert({
    where: { gymId_trainerId: { gymId: gym.id, trainerId: trainer.id } },
    update: {
      reviewedAt: now,
      reviewedById: admin.id,
      startedAt: now,
      status: "ACTIVE",
    },
    create: {
      id: ids.gymTrainer,
      gymId: gym.id,
      trainerId: trainer.id,
      reviewedAt: now,
      reviewedById: admin.id,
      startedAt: now,
      status: "ACTIVE",
    },
  });

  await prisma.gymTrainer.upsert({
    where: { gymId_trainerId: { gymId: gym.id, trainerId: pendingTrainer.id } },
    update: { status: "PENDING", reviewedAt: null, reviewedById: null, startedAt: null },
    create: {
      id: ids.pendingGymTrainer,
      gymId: gym.id,
      trainerId: pendingTrainer.id,
      status: "PENDING",
    },
  });

  await prisma.gymTrainer.upsert({
    where: { gymId_trainerId: { gymId: secondGym.id, trainerId: pendingTrainer.id } },
    update: { status: "ACTIVE", reviewedAt: now, reviewedById: admin.id, startedAt: now },
    create: { id: ids.secondGymTrainer, gymId: secondGym.id, trainerId: pendingTrainer.id, status: "ACTIVE", reviewedAt: now, reviewedById: admin.id, startedAt: now },
  });

  await prisma.gymMembership.upsert({
    where: { gymId_userId: { gymId: gym.id, userId: member.id } },
    update: {
      expiresAt: monthEnd,
      reviewedAt: now,
      reviewedById: admin.id,
      startedAt: now,
      status: "ACTIVE",
    },
    create: {
      id: ids.gymMembership,
      gymId: gym.id,
      userId: member.id,
      expiresAt: monthEnd,
      reviewedAt: now,
      reviewedById: admin.id,
      startedAt: now,
      status: "ACTIVE",
    },
  });

  await prisma.gymMembership.upsert({
    where: { gymId_userId: { gymId: gym.id, userId: pendingMember.id } },
    update: {
      status: "PENDING",
      reviewedAt: null,
      reviewedById: null,
      startedAt: null,
      expiresAt: null,
    },
    create: {
      id: ids.pendingGymMembership,
      gymId: gym.id,
      userId: pendingMember.id,
      status: "PENDING",
    },
  });

  const trainerClient = await prisma.trainerClient.upsert({
    where: { trainerId_userId: { trainerId: trainer.id, userId: member.id } },
    update: { gymId: gym.id, startedAt: now, status: "ACTIVE" },
    create: {
      id: ids.trainerClient,
      trainerId: trainer.id,
      userId: member.id,
      gymId: gym.id,
      startedAt: now,
      status: "ACTIVE",
    },
  });

  const availabilitySlots = [
    { id: ids.availabilityMonday, dayOfWeek: 1, startMinutes: 540, endMinutes: 780 },
    { id: ids.availabilityWednesday, dayOfWeek: 3, startMinutes: 540, endMinutes: 780 },
    { id: ids.availabilityFriday, dayOfWeek: 5, startMinutes: 600, endMinutes: 840 },
  ];
  for (const slot of availabilitySlots) {
    await prisma.trainerAvailability.upsert({
      where: { id: slot.id },
      update: { ...slot, isActive: true, timezone: "Asia/Tehran" },
      create: { ...slot, trainerId: trainer.id, isActive: true, timezone: "Asia/Tehran" },
    });
  }

  const tomorrow = addDays(now, 1);
  tomorrow.setHours(10, 30, 0, 0);
  const tomorrowEnd = new Date(tomorrow.getTime() + 60 * 60 * 1000);
  const yesterday = addDays(now, -1);
  yesterday.setHours(16, 0, 0, 0);
  const yesterdayEnd = new Date(yesterday.getTime() + 60 * 60 * 1000);

  await prisma.trainingSession.upsert({
    where: { id: ids.sessionUpcoming },
    update: { startsAt: tomorrow, endsAt: tomorrowEnd, status: "SCHEDULED" },
    create: {
      id: ids.sessionUpcoming,
      trainerId: trainer.id,
      trainerClientId: trainerClient.id,
      gymId: gym.id,
      title: "Strength Fundamentals",
      startsAt: tomorrow,
      endsAt: tomorrowEnd,
      status: "SCHEDULED",
      notes: "Focus on squat depth and controlled tempo.",
    },
  });

  await prisma.trainingSession.upsert({
    where: { id: ids.sessionCompleted },
    update: { startsAt: yesterday, endsAt: yesterdayEnd, status: "COMPLETED" },
    create: {
      id: ids.sessionCompleted,
      trainerId: trainer.id,
      trainerClientId: trainerClient.id,
      gymId: gym.id,
      title: "Mobility & Recovery",
      startsAt: yesterday,
      endsAt: yesterdayEnd,
      status: "COMPLETED",
      notes: "Hip mobility improved from last week.",
    },
  });

  const memberPlan = await prisma.subscriptionPlan.upsert({
    where: {
      gymId_name_audience: {
        gymId: gym.id,
        name: "Monthly Member",
        audience: "MEMBER",
      },
    },
    update: { currency: "IRR", durationDays: 30, isActive: true, price: 15_000_000 },
    create: {
      id: ids.memberPlan,
      gymId: gym.id,
      name: "Monthly Member",
      audience: "MEMBER",
      description: "Full gym access for thirty days.",
      currency: "IRR",
      durationDays: 30,
      isActive: true,
      price: 15_000_000,
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { gymId_name_audience: { gymId: secondGym.id, name: "Atlas Monthly", audience: "MEMBER" } },
    update: { price: 12_000_000, durationDays: 30, isActive: true },
    create: {
      id: ids.secondMemberPlan,
      gymId: secondGym.id,
      name: "Atlas Monthly",
      description: "Open-gym access and community classes for thirty days.",
      audience: "MEMBER",
      price: 12_000_000,
      currency: "IRR",
      durationDays: 30,
      isActive: true,
    },
  });

  const trainerPlan = await prisma.subscriptionPlan.upsert({
    where: {
      gymId_name_audience: {
        gymId: gym.id,
        name: "Monthly Trainer",
        audience: "TRAINER",
      },
    },
    update: { currency: "IRR", durationDays: 30, isActive: true, price: 25_000_000 },
    create: {
      id: ids.trainerPlan,
      gymId: gym.id,
      name: "Monthly Trainer",
      audience: "TRAINER",
      description: "Trainer floor access and client management for thirty days.",
      currency: "IRR",
      durationDays: 30,
      isActive: true,
      price: 25_000_000,
    },
  });

  const memberSubscription = await prisma.subscription.upsert({
    where: { id: ids.memberSubscription },
    update: { endDate: monthEnd, startDate: now, status: "ACTIVE" },
    create: {
      id: ids.memberSubscription,
      subscriberId: member.id,
      gymId: gym.id,
      planId: memberPlan.id,
      status: "ACTIVE",
      pricePaid: memberPlan.price,
      currency: memberPlan.currency,
      startDate: now,
      endDate: monthEnd,
    },
  });

  await prisma.subscription.upsert({
    where: { id: ids.trainerSubscription },
    update: { endDate: monthEnd, startDate: now, status: "ACTIVE" },
    create: {
      id: ids.trainerSubscription,
      subscriberId: trainerUser.id,
      gymId: gym.id,
      planId: trainerPlan.id,
      status: "ACTIVE",
      pricePaid: trainerPlan.price,
      currency: trainerPlan.currency,
      startDate: now,
      endDate: monthEnd,
    },
  });

  await prisma.payment.upsert({
    where: { id: ids.paymentMember },
    update: { status: "SUCCEEDED", paidAt: now },
    create: {
      id: ids.paymentMember,
      userId: member.id,
      gymId: gym.id,
      planId: memberPlan.id,
      subscriptionId: memberSubscription.id,
      type: "SUBSCRIPTION",
      status: "SUCCEEDED",
      amount: memberPlan.price,
      currency: memberPlan.currency,
      provider: "demo",
      providerReference: "demo_seed_payment",
      idempotencyKey: "seed-member-subscription-payment",
      paidAt: now,
    },
  });
  await prisma.auditLog.upsert({
    where: { id: ids.auditSeed },
    update: {},
    create: { id: ids.auditSeed, actorId: admin.id, actorRole: "ADMIN", gymId: gym.id, action: "SEED_PAYMENT_RECORDED", entityType: "Payment", entityId: ids.paymentMember },
  });

  const workoutPlan = await prisma.workoutPlan.upsert({
    where: { id: ids.workoutPlan },
    update: { status: "ACTIVE", version: 1 },
    create: {
      id: ids.workoutPlan,
      trainerId: trainer.id,
      gymId: gym.id,
      familyId: ids.workoutPlan,
      title: "Foundation Strength",
      description: "A four-week full-body strength foundation.",
      status: "ACTIVE",
      version: 1,
      publishedAt: now,
      days: {
        create: [
          {
            dayNumber: 1,
            name: "Full Body A",
            notes: "Controlled tempo and clean technique.",
            exercises: { create: [
              { order: 1, name: "Back Squat", sets: 4, reps: "6–8", tempo: "3-1-1", restSeconds: 120 },
              { order: 2, name: "Bench Press", sets: 4, reps: "6–8", restSeconds: 90 },
              { order: 3, name: "Cable Row", sets: 3, reps: "10–12", restSeconds: 75 },
            ] },
          },
          {
            dayNumber: 2,
            name: "Full Body B",
            exercises: { create: [
              { order: 1, name: "Romanian Deadlift", sets: 4, reps: "8", restSeconds: 120 },
              { order: 2, name: "Overhead Press", sets: 3, reps: "8–10", restSeconds: 90 },
              { order: 3, name: "Walking Lunge", sets: 3, reps: "10 / side", restSeconds: 75 },
            ] },
          },
        ],
      },
      legacyExercises: JSON.stringify(["Squat", "Bench press", "Row"]),
    },
  });

  const workoutAssignment = await prisma.workoutAssignment.upsert({
    where: { planId_userId: { planId: workoutPlan.id, userId: member.id } },
    update: { startDate: now, status: "ACTIVE", trainerClientId: trainerClient.id },
    create: {
      id: ids.workoutAssignment,
      planId: workoutPlan.id,
      userId: member.id,
      trainerClientId: trainerClient.id,
      status: "ACTIVE",
      startDate: now,
    },
  });

  const dietPlan = await prisma.dietPlan.upsert({
    where: { id: ids.dietPlan },
    update: { status: "ACTIVE", version: 1 },
    create: {
      id: ids.dietPlan,
      trainerId: trainer.id,
      gymId: gym.id,
      familyId: ids.dietPlan,
      title: "Balanced Performance",
      description: "Simple nutrition guidance to support training and recovery.",
      dietaryRestrictions: "Adjust portions for individual energy needs.",
      dailyCalories: 2_400,
      status: "ACTIVE",
      version: 1,
      publishedAt: now,
      days: {
        create: [{
          dayNumber: 1,
          name: "Training Day",
          targetCalories: 2_400,
          targetProtein: 170,
          targetCarbs: 260,
          targetFat: 70,
          meals: { create: [
            { order: 1, name: "Breakfast", scheduledTime: "08:00", foodItems: { create: [
              { order: 1, name: "Oats", quantity: 80, unit: "g", calories: 310, protein: 10, carbs: 53, fat: 6 },
              { order: 2, name: "Greek Yogurt", quantity: 200, unit: "g", calories: 140, protein: 20, carbs: 8, fat: 2 },
            ] } },
            { order: 2, name: "Lunch", scheduledTime: "13:00", foodItems: { create: [
              { order: 1, name: "Grilled Chicken", quantity: 180, unit: "g", calories: 300, protein: 55, carbs: 0, fat: 7 },
              { order: 2, name: "Cooked Rice", quantity: 250, unit: "g", calories: 325, protein: 6, carbs: 70, fat: 1 },
            ] } },
          ] },
        }],
      },
      legacyMeals: JSON.stringify(["Breakfast", "Lunch", "Dinner", "Recovery snack"]),
    },
  });

  const dietAssignment = await prisma.dietAssignment.upsert({
    where: { planId_userId: { planId: dietPlan.id, userId: member.id } },
    update: { startDate: now, status: "ACTIVE", trainerClientId: trainerClient.id },
    create: {
      id: ids.dietAssignment,
      planId: dietPlan.id,
      userId: member.id,
      trainerClientId: trainerClient.id,
      status: "ACTIVE",
      startDate: now,
    },
  });

  const { workoutLog } = await seedProgress(prisma, {
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
  });

  await prisma.feedback.upsert({
    where: { id: ids.feedback },
    update: { content: "Strong first week. Keep the tempo controlled on every squat.", workoutLogId: workoutLog.id },
    create: {
      id: ids.feedback,
      authorId: trainerUser.id,
      recipientId: member.id,
      trainerClientId: trainerClient.id,
      workoutAssignmentId: workoutAssignment.id,
      workoutLogId: workoutLog.id,
      type: "WORKOUT",
      content: "Strong first week. Keep the tempo controlled on every squat.",
    },
  });

  await prisma.gymReview.upsert({
    where: { authorId_gymId: { authorId: member.id, gymId: gym.id } },
    update: { comment: "Clean space, helpful staff, and excellent equipment.", score: 5, verified: true },
    create: {
      id: ids.gymReview,
      authorId: member.id,
      gymId: gym.id,
      comment: "Clean space, helpful staff, and excellent equipment.",
      score: 5,
      verified: true,
    },
  });

  await prisma.trainerReview.upsert({
    where: { authorId_trainerId: { authorId: member.id, trainerId: trainer.id } },
    update: { comment: "Clear coaching and a plan that feels achievable.", score: 5, verified: true },
    create: {
      id: ids.trainerReview,
      authorId: member.id,
      trainerId: trainer.id,
      comment: "Clear coaching and a plan that feels achievable.",
      score: 5,
      verified: true,
    },
  });

  console.log("Seeded KooGYMaa development data:");
  console.log("  admin@koogymaa.test");
  console.log("  trainer@koogymaa.test");
  console.log("  member@koogymaa.test");
  console.log("Set SEED_PASSWORD to override the development password.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

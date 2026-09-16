import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import { seedProgress } from "./seed-progress.mjs";

if (process.env.NODE_ENV === "production" && process.env.ALLOW_PRODUCTION_SEED !== "true") {
  throw new Error("Refusing to seed production without ALLOW_PRODUCTION_SEED=true.");
}

// Demo project: Turso credentials are embedded so the seed runs with no
// environment configuration. Env vars still override these if set.
const EMBEDDED_TURSO_URL = "libsql://koogymaa-aghrabooti.aws-us-east-2.turso.io";
const EMBEDDED_TURSO_TOKEN =
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODczMjcwMzIsImlkIjoiMDFhMDI0ZmUtMGIwMS03NmE2LTg0MmYtMzUwZWVkMmFmNmExIiwia2lkIjoiRXFGT284TVNSTEh4Vl9ETy1uSUNTUU5wNC1rSTBSVTJNYjdMVVpDaDNDSSIsInJpZCI6IjhjY2FiNDM0LTJiYzYtNGVlMy1iZDMzLWM0ZGYzNzc1NDhhZiJ9.D8SM0SyTzlpQ577bCGLs0qRIWhlEK1qEsC1DG_tH2T0li9KIKNFiiqkx7UQ8XicsZG7YpqpFWZnAQTxgRgcYCw";

const databaseUrl = (
  process.env.LIBSQL_DATABASE_URL ||
  process.env.TURSO_DATABASE_URL ||
  process.env.DATABASE_URL ||
  EMBEDDED_TURSO_URL
).trim();

const adapter = new PrismaLibSql({
  url: databaseUrl,
  // Required for hosted libSQL (e.g. Turso). Leave unset for local file:./dev.db.
  authToken:
    process.env.LIBSQL_DATABASE_AUTH_TOKEN ||
    process.env.TURSO_AUTH_TOKEN ||
    process.env.DATABASE_AUTH_TOKEN ||
    EMBEDDED_TURSO_TOKEN,
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
  // Sara extended programs
  saharUser: "seed-user-sahar",
  rezaUser: "seed-user-reza",
  parisaUser: "seed-user-parisa",
  saharClient: "seed-trainer-client-sahar",
  rezaClient: "seed-trainer-client-reza",
  parisaClient: "seed-trainer-client-parisa",
  armanClient: "seed-trainer-client-arman",
  wpHypertrophy: "sara-wp-hypertrophy",
  wpFatloss: "sara-wp-fatloss-hiit",
  wpStrengthL2: "sara-wp-strength-l2",
  wpMobility: "sara-wp-mobility",
  wpWomen: "sara-wp-women-fullbody",
  dpBulk: "sara-dp-bulk-3000",
  dpCut: "sara-dp-cut-2000",
  dpWomen: "sara-dp-women-1800",
  dpMaintain: "sara-dp-maintain-2400",
};

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
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

  // === EXTENDED SEED FOR SARA AND NIMA (6-month journey) ===
  console.log("Extending seed for Sara's programs and Nima's 6-month journey...");

  // Additional students for Sara
  const sahar = await upsertUser({
    id: ids.saharUser,
    email: "sahar.student@koogymaa.test",
    name: "Sahar Student",
    password,
    role: "USER",
  });
  const reza = await upsertUser({
    id: ids.rezaUser,
    email: "reza.student@koogymaa.test",
    name: "Reza Student",
    password,
    role: "USER",
  });
  const parisa = await upsertUser({
    id: ids.parisaUser,
    email: "parisa.student@koogymaa.test",
    name: "Parisa Student",
    password,
    role: "USER",
  });

  // Make gym memberships ACTIVE for new students + Arman
  const extraUsers = [sahar, reza, parisa, pendingMember];
  for (const u of extraUsers) {
    await prisma.gymMembership.upsert({
      where: { gymId_userId: { gymId: gym.id, userId: u.id } },
      update: { status: "ACTIVE", startedAt: addMonths(now, -2), reviewedAt: now, reviewedById: admin.id, expiresAt: monthEnd },
      create: {
        id: `gym-membership-${u.id}`,
        gymId: gym.id,
        userId: u.id,
        status: "ACTIVE",
        startedAt: addMonths(now, -2),
        reviewedAt: now,
        reviewedById: admin.id,
        expiresAt: monthEnd,
      },
    });
  }

  // Update Nima's TrainerClient to 6 months ago
  const sixMonthsAgo = addMonths(now, -6);
  await prisma.trainerClient.update({
    where: { id: trainerClient.id },
    data: { startedAt: sixMonthsAgo, status: "ACTIVE" },
  });

  // Create TrainerClient for others
  const clientData = [
    { id: ids.saharClient, userId: sahar.id, startedAt: addMonths(now, -4) },
    { id: ids.rezaClient, userId: reza.id, startedAt: addMonths(now, -3) },
    { id: ids.parisaClient, userId: parisa.id, startedAt: addMonths(now, -1) },
    { id: ids.armanClient, userId: pendingMember.id, startedAt: addMonths(now, -2) },
  ];
  for (const c of clientData) {
    await prisma.trainerClient.upsert({
      where: { trainerId_userId: { trainerId: trainer.id, userId: c.userId } },
      update: { startedAt: c.startedAt, status: "ACTIVE", gymId: gym.id },
      create: { id: c.id, trainerId: trainer.id, userId: c.userId, gymId: gym.id, status: "ACTIVE", startedAt: c.startedAt },
    });
  }

  // Helper to create workout plan if not exists
  async function createWorkoutPlanExtended({ id, title, description, days }) {
    const exists = await prisma.workoutPlan.findUnique({ where: { id } });
    if (exists) {
      await prisma.workoutDay.deleteMany({ where: { planId: id } });
      await prisma.workoutPlan.update({ where: { id }, data: { title, description, status: "ACTIVE", publishedAt: now } });
    } else {
      await prisma.workoutPlan.create({
        data: {
          id,
          trainerId: trainer.id,
          gymId: gym.id,
          familyId: id,
          title,
          description,
          status: "ACTIVE",
          version: 1,
          isTemplate: false,
          publishedAt: now,
          legacyExercises: JSON.stringify(days.flatMap(d => d.exercises.map(e => e.name))),
        },
      });
    }
    for (let di = 0; di < days.length; di++) {
      const day = days[di];
      const dayId = `${id}-day-${di + 1}`;
      await prisma.workoutDay.create({
        data: {
          id: dayId,
          planId: id,
          dayNumber: di + 1,
          name: day.name,
          notes: day.notes || null,
          exercises: {
            create: day.exercises.map((ex, ei) => ({
              id: `${dayId}-ex-${ei + 1}`,
              order: ei + 1,
              name: ex.name,
              sets: ex.sets || null,
              reps: ex.reps || null,
              restSeconds: ex.restSeconds || null,
              tempo: ex.tempo || null,
              weight: ex.weight || null,
              notes: ex.notes || null,
              durationSeconds: ex.durationSeconds || null,
              distanceMeters: ex.distanceMeters || null,
            })),
          },
        },
      });
    }
  }

  async function createDietPlanExtended({ id, title, description, dailyCalories, dietaryRestrictions, days }) {
    const exists = await prisma.dietPlan.findUnique({ where: { id } });
    if (exists) {
      await prisma.dietDay.deleteMany({ where: { planId: id } });
      await prisma.dietPlan.update({ where: { id }, data: { title, description, dailyCalories, dietaryRestrictions, status: "ACTIVE", publishedAt: now } });
    } else {
      await prisma.dietPlan.create({
        data: {
          id,
          trainerId: trainer.id,
          gymId: gym.id,
          familyId: id,
          title,
          description,
          dietaryRestrictions,
          dailyCalories,
          status: "ACTIVE",
          version: 1,
          isTemplate: false,
          publishedAt: now,
          legacyMeals: JSON.stringify(["صبحانه", "ناهار", "شام"]),
        },
      });
    }
    for (let di = 0; di < days.length; di++) {
      const day = days[di];
      const dayId = `${id}-day-${di + 1}`;
      await prisma.dietDay.create({
        data: {
          id: dayId,
          planId: id,
          dayNumber: di + 1,
          name: day.name,
          targetCalories: day.targetCalories || null,
          targetProtein: day.targetProtein || null,
          targetCarbs: day.targetCarbs || null,
          targetFat: day.targetFat || null,
          notes: day.notes || null,
          meals: {
            create: day.meals.map((meal, mi) => ({
              id: `${dayId}-meal-${mi + 1}`,
              order: mi + 1,
              name: meal.name,
              scheduledTime: meal.scheduledTime || null,
              notes: meal.notes || null,
              foodItems: {
                create: meal.foodItems.map((food, fi) => ({
                  id: `${dayId}-meal-${mi + 1}-food-${fi + 1}`,
                  order: fi + 1,
                  name: food.name,
                  quantity: food.quantity || null,
                  unit: food.unit || null,
                  calories: food.calories || null,
                  protein: food.protein || null,
                  carbs: food.carbs || null,
                  fat: food.fat || null,
                })),
              },
            })),
          },
        },
      });
    }
  }

  // Create 5 workout plans for Sara
  await createWorkoutPlanExtended({
    id: ids.wpHypertrophy,
    title: "حجم عضلانی - هایپرتروفی ۴ روزه",
    description: "برنامه ۴ روزه تخصصی افزایش حجم عضلانی با تمرکز بر فشار مکانیکی. مناسب برای نیما، رضا، آرمان.",
    days: [
      { name: "روز ۱ - سینه و پشت بازو", exercises: [
        { name: "پرس سینه هالتر", sets: 4, reps: "8-10", restSeconds: 90, tempo: "2-1-2" },
        { name: "پرس بالا سینه دمبل", sets: 4, reps: "10-12", restSeconds: 75 },
        { name: "فلای سینه", sets: 3, reps: "12-15", restSeconds: 60 },
        { name: "پشت بازو سیم کش", sets: 4, reps: "10-12", restSeconds: 60 },
      ]},
      { name: "روز ۲ - پا و شکم", exercises: [
        { name: "اسکوات هالتر", sets: 5, reps: "6-8", restSeconds: 120, tempo: "3-1-1" },
        { name: "ددلیفت رومانیایی", sets: 4, reps: "8-10", restSeconds: 90 },
        { name: "پرس پا", sets: 4, reps: "10-12", restSeconds: 90 },
        { name: "ساق پا ایستاده", sets: 4, reps: "15-20", restSeconds: 45 },
      ]},
      { name: "روز ۳ - پشت و جلو بازو", exercises: [
        { name: "بارفیکس", sets: 4, reps: "6-10", restSeconds: 90 },
        { name: "زیر بغل هالتر خم", sets: 4, reps: "8-10", restSeconds: 90 },
        { name: "جلو بازو هالتر", sets: 4, reps: "8-10", restSeconds: 60 },
      ]},
      { name: "روز ۴ - سرشانه", exercises: [
        { name: "پرس سرشانه", sets: 4, reps: "8-10", restSeconds: 90 },
        { name: "نشر جانب", sets: 4, reps: "12-15", restSeconds: 60 },
        { name: "ددلیفت", sets: 3, reps: "6", restSeconds: 120 },
      ]},
    ],
  });

  await createWorkoutPlanExtended({
    id: ids.wpFatloss,
    title: "چربی سوزی و کاندیشننگ - HIIT",
    description: "برنامه ۳ روزه HIIT و قدرتی برای چربی سوزی. مناسب برای سحر، پریسا، نیما.",
    days: [
      { name: "روز ۱ - HIIT فول بادی", exercises: [
        { name: "برپی", sets: 5, reps: "15", restSeconds: 45 },
        { name: "اسکوات پرشی", sets: 4, reps: "20", restSeconds: 30 },
        { name: "کتل بل سوئینگ", sets: 4, reps: "20", restSeconds: 45 },
        { name: "طناب زنی", sets: 3, reps: "2 دقیقه", durationSeconds: 120, restSeconds: 30 },
      ]},
      { name: "روز ۲ - قدرتی چربی سوز", exercises: [
        { name: "اسکوات", sets: 4, reps: "15", restSeconds: 45 },
        { name: "پرس سینه", sets: 4, reps: "15", restSeconds: 45 },
        { name: "لانج", sets: 3, reps: "12 هر پا", restSeconds: 30 },
      ]},
      { name: "روز ۳ - کور و کاندیشننگ", exercises: [
        { name: "ددلیفت", sets: 4, reps: "12", restSeconds: 60 },
        { name: "روئینگ 1000 متر", sets: 1, distanceMeters: 1000, durationSeconds: 300 },
        { name: "کرانچ", sets: 4, reps: "20", restSeconds: 30 },
      ]},
    ],
  });

  await createWorkoutPlanExtended({
    id: ids.wpStrengthL2,
    title: "قدرت پایه پیشرفته - سطح ۲",
    description: "ادامه Foundation Strength برای افزایش قدرت. مناسب برای نیما و رضا.",
    days: [
      { name: "روز A - پایین تنه", notes: "سنگین", exercises: [
        { name: "Back Squat", sets: 5, reps: "5", restSeconds: 180, tempo: "3-1-1" },
        { name: "Romanian Deadlift", sets: 4, reps: "6", restSeconds: 120 },
        { name: "Bulgarian Split Squat", sets: 3, reps: "8 هر پا", restSeconds: 75 },
      ]},
      { name: "روز B - بالا تنه", exercises: [
        { name: "Bench Press", sets: 5, reps: "5", restSeconds: 180 },
        { name: "Barbell Row", sets: 4, reps: "6", restSeconds: 120 },
        { name: "Overhead Press", sets: 4, reps: "6", restSeconds: 120 },
      ]},
      { name: "روز C - قدرت کامل", exercises: [
        { name: "Deadlift", sets: 5, reps: "3", restSeconds: 180 },
        { name: "Incline Bench", sets: 3, reps: "8", restSeconds: 90 },
        { name: "Plank", sets: 3, reps: "60s", durationSeconds: 60, restSeconds: 45 },
      ]},
    ],
  });

  await createWorkoutPlanExtended({
    id: ids.wpMobility,
    title: "موبیلیتی و ریکاوری",
    description: "برنامه ریکاوری و موبیلیتی تخصص سارا. برای تمام شاگردان.",
    days: [
      { name: "موبیلیتی پایین تنه", exercises: [
        { name: "Hip 90/90 Stretch", sets: 2, reps: "60s", durationSeconds: 60, restSeconds: 15 },
        { name: "Deep Squat Hold", sets: 3, reps: "45s", durationSeconds: 45, restSeconds: 30 },
        { name: "Foam Rolling", sets: 1, reps: "5 دقیقه", durationSeconds: 300 },
      ]},
      { name: "موبیلیتی بالا تنه", exercises: [
        { name: "Thoracic Rotation", sets: 3, reps: "10", restSeconds: 30 },
        { name: "Band Pull Apart", sets: 3, reps: "15", restSeconds: 30 },
        { name: "Breathing", sets: 3, reps: "4-4-4-4", durationSeconds: 60 },
      ]},
    ],
  });

  await createWorkoutPlanExtended({
    id: ids.wpWomen,
    title: "فول بادی بانوان - تناسب اندام",
    description: "برنامه ۳ روزه بانوان برای فرم دهی پا و باسن. مناسب سحر و پریسا.",
    days: [
      { name: "روز ۱ - پا و باسن", exercises: [
        { name: "Hip Thrust", sets: 4, reps: "12", restSeconds: 75 },
        { name: "Squat", sets: 4, reps: "12", restSeconds: 75 },
        { name: "Kickback", sets: 3, reps: "15 هر پا", restSeconds: 45 },
      ]},
      { name: "روز ۲ - بالا تنه و شکم", exercises: [
        { name: "Lat Pulldown", sets: 3, reps: "12", restSeconds: 60 },
        { name: "Push Up", sets: 3, reps: "10", restSeconds: 45 },
        { name: "Russian Twist", sets: 3, reps: "20", restSeconds: 30 },
      ]},
      { name: "روز ۳ - فول بادی چربی سوز", exercises: [
        { name: "Deadlift", sets: 3, reps: "12", restSeconds: 60 },
        { name: "Lunge", sets: 3, reps: "12 هر پا", restSeconds: 45 },
        { name: "Treadmill", sets: 1, reps: "20 دقیقه", durationSeconds: 1200 },
      ]},
    ],
  });

  // Diet plans
  await createDietPlanExtended({
    id: ids.dpBulk,
    title: "رژیم افزایش وزن سالم - ۳۰۰۰ کالری",
    description: "افزایش حجم با ۳۰۰۰ کالری و ۱۸۰ گرم پروتئین",
    dailyCalories: 3000,
    dietaryRestrictions: "پروتئین بالا",
    days: [{
      name: "روز تمرین",
      targetCalories: 3000, targetProtein: 180, targetCarbs: 380, targetFat: 85,
      meals: [
        { name: "صبحانه ۸:۰۰", scheduledTime: "08:00", foodItems: [
          { name: "تخم مرغ", quantity: 3, unit: "عدد", calories: 210, protein: 18, carbs: 1, fat: 15 },
          { name: "نان تست", quantity: 2, unit: "برش", calories: 160, protein: 6, carbs: 30, fat: 2 },
          { name: "موز", quantity: 1, unit: "عدد", calories: 105, protein: 1, carbs: 27, fat: 0 },
        ]},
        { name: "ناهار ۱۳:۳۰", scheduledTime: "13:30", foodItems: [
          { name: "سینه مرغ", quantity: 200, unit: "g", calories: 330, protein: 62, carbs: 0, fat: 7 },
          { name: "برنج", quantity: 300, unit: "g", calories: 390, protein: 7, carbs: 84, fat: 1 },
        ]},
        { name: "شام ۲۰:۰۰", scheduledTime: "20:00", foodItems: [
          { name: "گوشت قرمز", quantity: 180, unit: "g", calories: 320, protein: 45, carbs: 0, fat: 14 },
          { name: "سیب زمینی", quantity: 250, unit: "g", calories: 200, protein: 5, carbs: 45, fat: 0 },
        ]},
      ],
    }],
  });

  await createDietPlanExtended({
    id: ids.dpCut,
    title: "رژیم کات و چربی سوزی - ۲۰۰۰ کالری",
    description: "کات با پروتئین بالا برای نیما ماه ۳-۶",
    dailyCalories: 2000,
    dietaryRestrictions: "کربوهیدرات کنترل شده",
    days: [{
      name: "روز کات",
      targetCalories: 2000, targetProtein: 170, targetCarbs: 180, targetFat: 65,
      meals: [
        { name: "صبحانه", scheduledTime: "08:00", foodItems: [
          { name: "سفیده تخم مرغ", quantity: 4, unit: "عدد", calories: 70, protein: 14, carbs: 1, fat: 0 },
          { name: "جو دوسر", quantity: 50, unit: "g", calories: 190, protein: 6, carbs: 32, fat: 3 },
        ]},
        { name: "ناهار", scheduledTime: "13:00", foodItems: [
          { name: "سینه مرغ", quantity: 180, unit: "g", calories: 300, protein: 55, carbs: 0, fat: 6 },
          { name: "برنج قهوه ای", quantity: 150, unit: "g", calories: 170, protein: 4, carbs: 35, fat: 1 },
        ]},
        { name: "شام", scheduledTime: "20:00", foodItems: [
          { name: "ماهی سالمون", quantity: 150, unit: "g", calories: 280, protein: 30, carbs: 0, fat: 16 },
          { name: "سالاد", quantity: 200, unit: "g", calories: 40, protein: 2, carbs: 8, fat: 0 },
        ]},
      ],
    }],
  });

  await createDietPlanExtended({
    id: ids.dpWomen,
    title: "رژیم متعادل بانوان - ۱۸۰۰ کالری",
    description: "۱۸۰۰ کالری متعادل برای سحر و پریسا",
    dailyCalories: 1800,
    dietaryRestrictions: "متعادل بانوان",
    days: [{
      name: "روز متعادل",
      targetCalories: 1800, targetProtein: 110, targetCarbs: 200, targetFat: 60,
      meals: [
        { name: "صبحانه", scheduledTime: "08:30", foodItems: [
          { name: "تخم مرغ", quantity: 2, unit: "عدد", calories: 140, protein: 12, carbs: 1, fat: 10 },
          { name: "نان جو", quantity: 1, unit: "برش", calories: 80, protein: 3, carbs: 15, fat: 1 },
        ]},
        { name: "ناهار", scheduledTime: "13:30", foodItems: [
          { name: "سینه مرغ", quantity: 120, unit: "g", calories: 200, protein: 36, carbs: 0, fat: 4 },
          { name: "کینوا", quantity: 120, unit: "g", calories: 140, protein: 5, carbs: 26, fat: 2 },
        ]},
        { name: "شام", scheduledTime: "19:30", foodItems: [
          { name: "ماهی", quantity: 120, unit: "g", calories: 180, protein: 26, carbs: 0, fat: 8 },
          { name: "سبزیجات", quantity: 200, unit: "g", calories: 70, protein: 3, carbs: 14, fat: 0 },
        ]},
      ],
    }],
  });

  await createDietPlanExtended({
    id: ids.dpMaintain,
    title: "رژیم نگهدارنده - ۲۴۰۰ کالری",
    description: "نگهدارنده متعادل برای تمام شاگردان",
    dailyCalories: 2400,
    dietaryRestrictions: "متعادل",
    days: [{
      name: "روز نگهدارنده",
      targetCalories: 2400, targetProtein: 140, targetCarbs: 300, targetFat: 70,
      meals: [
        { name: "صبحانه", scheduledTime: "08:00", foodItems: [
          { name: "نان سنگک", quantity: 1, unit: "برش", calories: 120, protein: 4, carbs: 24, fat: 1 },
          { name: "پنیر", quantity: 50, unit: "g", calories: 80, protein: 10, carbs: 2, fat: 4 },
        ]},
        { name: "ناهار", scheduledTime: "13:00", foodItems: [
          { name: "چلو کباب", quantity: 1, unit: "پرس", calories: 600, protein: 35, carbs: 60, fat: 25 },
        ]},
        { name: "شام", scheduledTime: "20:00", foodItems: [
          { name: "خوراک مرغ", quantity: 1, unit: "پرس", calories: 400, protein: 35, carbs: 30, fat: 15 },
        ]},
      ],
    }],
  });

  // Assign workouts and diets
  const allStudents = [
    { userId: member.id, clientId: trainerClient.id },
    { userId: sahar.id, clientId: ids.saharClient },
    { userId: reza.id, clientId: ids.rezaClient },
    { userId: parisa.id, clientId: ids.parisaClient },
    { userId: pendingMember.id, clientId: ids.armanClient },
  ];

  const workoutAssignmentsExt = [
    { planId: ids.wpStrengthL2, userIds: [member.id, reza.id] },
    { planId: ids.wpHypertrophy, userIds: [member.id, reza.id, pendingMember.id] },
    { planId: ids.wpFatloss, userIds: [member.id, sahar.id, parisa.id] },
    { planId: ids.wpWomen, userIds: [sahar.id, parisa.id] },
    { planId: ids.wpMobility, userIds: [member.id, sahar.id, reza.id, parisa.id, pendingMember.id] },
  ];

  for (const wa of workoutAssignmentsExt) {
    for (const uid of wa.userIds) {
      const st = allStudents.find(s => s.userId === uid);
      if (!st) continue;
      await prisma.workoutAssignment.upsert({
        where: { planId_userId: { planId: wa.planId, userId: uid } },
        update: { status: "ACTIVE", trainerClientId: st.clientId, startDate: now },
        create: { id: `wa-${wa.planId}-${uid}`, planId: wa.planId, userId: uid, trainerClientId: st.clientId, status: "ACTIVE", startDate: now },
      });
    }
  }

  const dietAssignmentsExt = [
    { planId: ids.dpBulk, userIds: [reza.id, pendingMember.id] },
    { planId: ids.dpCut, userIds: [member.id] },
    { planId: ids.dpWomen, userIds: [sahar.id, parisa.id] },
    { planId: ids.dpMaintain, userIds: [member.id, sahar.id, reza.id, parisa.id, pendingMember.id] },
  ];

  for (const da of dietAssignmentsExt) {
    for (const uid of da.userIds) {
      const st = allStudents.find(s => s.userId === uid);
      if (!st) continue;
      await prisma.dietAssignment.upsert({
        where: { planId_userId: { planId: da.planId, userId: uid } },
        update: { status: "ACTIVE", trainerClientId: st.clientId, startDate: now },
        create: { id: `da-${da.planId}-${uid}`, planId: da.planId, userId: uid, trainerClientId: st.clientId, status: "ACTIVE", startDate: now },
      });
    }
  }

  // Nima 6-month measurements
  const nimaMeasurements = [
    { id: "nima-m-1", date: addMonths(now, -6), weight: 85.2, bodyFat: 22.5, waist: 92, chest: 100, arm: 33, notes: "ماه ۱ - شروع" },
    { id: "nima-m-2", date: addMonths(now, -5), weight: 84.0, bodyFat: 21.0, waist: 90, chest: 100.5, arm: 33.5, notes: "ماه ۲ - کاهش ۱.۲ کیلو" },
    { id: "nima-m-3", date: addMonths(now, -4), weight: 82.8, bodyFat: 19.8, waist: 88.5, chest: 101, arm: 34, notes: "ماه ۳ - پایان قدرت پایه" },
    { id: "nima-m-4", date: addMonths(now, -3), weight: 81.5, bodyFat: 18.5, waist: 87, chest: 101.5, arm: 34.5, notes: "ماه ۴ - هایپرتروفی" },
    { id: "nima-m-5", date: addMonths(now, -2), weight: 80.8, bodyFat: 17.2, waist: 85.5, chest: 102, arm: 35, notes: "ماه ۵ - کات" },
    { id: "nima-m-6", date: now, weight: 80.0, bodyFat: 16.0, waist: 84, chest: 102.5, arm: 35.5, notes: "ماه ۶ - الان، ۵.۲ کیلو کم، ۶.۵٪ چربی کم" },
  ];

  for (const m of nimaMeasurements) {
    await prisma.bodyMeasurement.upsert({
      where: { id: m.id },
      update: { weightKg: m.weight, bodyFatPercent: m.bodyFat, waistCm: m.waist, chestCm: m.chest, armCm: m.arm, notes: m.notes, recordedAt: m.date },
      create: { id: m.id, userId: member.id, recordedAt: m.date, weightKg: m.weight, bodyFatPercent: m.bodyFat, waistCm: m.waist, chestCm: m.chest, armCm: m.arm, notes: m.notes },
    });
  }

  // Nima progress photos
  const photos = [
    { id: "nima-photo-m1", measurementId: "nima-m-1", url: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e", pose: "Front - Month 1" },
    { id: "nima-photo-m6", measurementId: "nima-m-6", url: "https://images.unsplash.com/photo-1534367610401-9f5ed68180aa", pose: "Front - Month 6" },
  ];
  for (const p of photos) {
    await prisma.progressPhoto.upsert({
      where: { id: p.id },
      update: { imageUrl: p.url, pose: p.pose, measurementId: p.measurementId },
      create: { id: p.id, userId: member.id, measurementId: p.measurementId, imageUrl: p.url, pose: p.pose },
    });
  }

  // Feedback for Nima's journey
  const fbList = [
    { id: "nima-fb-m1", content: "ماه اول عالی بود! فرم اسکواتت بهتر شده.", date: addMonths(now, -5) },
    { id: "nima-fb-m3", content: "ماه سوم: پایان فاز قدرت پایه. آماده‌ای برای هایپرتروفی؟", date: addMonths(now, -3) },
    { id: "nima-fb-m6", content: "ماه ششم: نیما تو الان ۶ ماهه شاگرد منی! ۵.۲ کیلو چربی کم کردی 💪", date: now },
  ];
  for (const fb of fbList) {
    await prisma.feedback.upsert({
      where: { id: fb.id },
      update: { content: fb.content },
      create: { id: fb.id, authorId: trainerUser.id, recipientId: member.id, trainerClientId: trainerClient.id, type: "PROGRESS", content: fb.content, createdAt: fb.date, updatedAt: fb.date },
    });
  }

  // Notifications for Nima
  const notifs = [
    { id: "nima-notif-1", title: "برنامه جدید قدرت سطح ۲", message: "سارا برنامه قدرت پیشرفته سطح ۲ رو برات فعال کرد", href: "/user/workouts", date: addMonths(now, -3) },
    { id: "nima-notif-4", title: "۶ ماهگی شاگردی!", message: "تبریک! ۶ ماهه که با سارا تمرین می‌کنی", href: "/user/progress", date: now },
  ];
  for (const n of notifs) {
    await prisma.notification.upsert({
      where: { id: n.id },
      update: { title: n.title, message: n.message },
      create: { id: n.id, userId: member.id, type: "GENERAL", title: n.title, message: n.message, href: n.href, createdAt: n.date },
    });
  }

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

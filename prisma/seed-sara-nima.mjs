/**
 * KooGYMaa - Extended seed for coach Sara and member Nima
 * 
 * برای مربی سارا چندتا برنامه ورزشی بساز به شاگردهاش برنامه بده
 * برنامه غذایی بساز
 * برای ممبر نیما هم یه مسیر بساز که چند ماهه شاگرد هست
 * 
 * This script creates:
 * - 5 workout programs for Sara Trainer
 * - 4 nutrition programs for Sara Trainer
 * - Additional students (Sahar, Reza, Parisa, Arman) assigned to Sara
 * - Assigns workout & diet plans to all students
 * - 6-month journey for Nima with body measurements, progress photos, feedback
 * - Notifications and training sessions
 * 
 * Run with: node prisma/seed-sara-nima.mjs
 * Or it is automatically included in seed.mjs if you import it.
 */

import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const EMBEDDED_TURSO_URL = "libsql://koogymaa-aghrabooti.aws-us-east-2.turso.io";
const EMBEDDED_TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODczMjcwMzIsImlkIjoiMDFhMDI0ZmUtMGIwMS03NmE2LTg0MmYtMzUwZWVkMmFmNmExIiwia2lkIjoiRXFGT284TVNSTEh4Vl9ETy1uSUNTUU5wNC1rSTBSVTJNYjdMVVpDaDNDSSIsInJpZCI6IjhjY2FiNDM0LTJiYzYtNGVlMy1iZDMzLWM0ZGYzNzc1NDhhZiJ9.D8SM0SyTzlpQ577bCGLs0qRIWhlEK1qEsC1DG_tH2T0li9KIKNFiiqkx7UQ8XicsZG7YpqpFWZnAQTxgRgcYCw";

const databaseUrl = (
  process.env.LIBSQL_DATABASE_URL ||
  process.env.TURSO_DATABASE_URL ||
  process.env.DATABASE_URL ||
  EMBEDDED_TURSO_URL
).trim();

const adapter = new PrismaLibSql({
  url: databaseUrl,
  authToken:
    process.env.LIBSQL_DATABASE_AUTH_TOKEN ||
    process.env.TURSO_AUTH_TOKEN ||
    process.env.DATABASE_AUTH_TOKEN ||
    EMBEDDED_TURSO_TOKEN,
});

const prisma = new PrismaClient({ adapter });

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

const ids = {
  // Existing
  gym: "seed-gym-central",
  trainerProfile: "seed-trainer-profile",
  trainerUser: "seed-user-trainer",
  member: "seed-user-member",
  trainerClientNima: "seed-trainer-client",
  // New students
  saharUser: "seed-user-sahar",
  rezaUser: "seed-user-reza",
  parisaUser: "seed-user-parisa",
  armanUser: "seed-user-pending-member",
  saharClient: "seed-trainer-client-sahar",
  rezaClient: "seed-trainer-client-reza",
  parisaClient: "seed-trainer-client-parisa",
  armanClient: "seed-trainer-client-arman",
  // Workout plans for Sara
  wpHypertrophy: "sara-wp-hypertrophy",
  wpFatloss: "sara-wp-fatloss-hiit",
  wpStrengthL2: "sara-wp-strength-l2",
  wpMobility: "sara-wp-mobility",
  wpWomen: "sara-wp-women-fullbody",
  // Diet plans for Sara
  dpBulk: "sara-dp-bulk-3000",
  dpCut: "sara-dp-cut-2000",
  dpWomen: "sara-dp-women-1800",
  dpMaintain: "sara-dp-maintain-2400",
};

async function upsertUser({ id, email, name, role, password }) {
  return prisma.user.upsert({
    where: { email },
    update: { name, role, status: "ACTIVE" },
    create: { id, email, name, password, role, status: "ACTIVE" },
  });
}

async function createWorkoutPlan({ id, title, description, days }) {
  const existing = await prisma.workoutPlan.findUnique({ where: { id } });
  if (existing) {
    console.log(`WorkoutPlan ${title} already exists, updating...`);
    await prisma.workoutPlan.update({
      where: { id },
      data: { title, description, status: "ACTIVE", publishedAt: new Date() },
    });
    // Delete old days to recreate
    await prisma.workoutDay.deleteMany({ where: { planId: id } });
  } else {
    await prisma.workoutPlan.create({
      data: {
        id,
        trainerId: ids.trainerProfile,
        gymId: ids.gym,
        familyId: id,
        title,
        description,
        status: "ACTIVE",
        version: 1,
        isTemplate: false,
        publishedAt: new Date(),
        legacyExercises: JSON.stringify(days.flatMap(d => d.exercises.map(e => e.name))),
      },
    });
  }

  for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
    const day = days[dayIndex];
    const dayId = `${id}-day-${dayIndex + 1}`;
    await prisma.workoutDay.create({
      data: {
        id: dayId,
        planId: id,
        dayNumber: dayIndex + 1,
        name: day.name,
        notes: day.notes || null,
        exercises: {
          create: day.exercises.map((ex, exIndex) => ({
            id: `${dayId}-ex-${exIndex + 1}`,
            order: exIndex + 1,
            name: ex.name,
            sets: ex.sets || null,
            reps: ex.reps || null,
            weight: ex.weight || null,
            tempo: ex.tempo || null,
            restSeconds: ex.restSeconds || null,
            durationSeconds: ex.durationSeconds || null,
            distanceMeters: ex.distanceMeters || null,
            notes: ex.notes || null,
          })),
        },
      },
    });
  }
  console.log(`✅ Created workout plan: ${title}`);
  return id;
}

async function createDietPlan({ id, title, description, dailyCalories, dietaryRestrictions, days }) {
  const existing = await prisma.dietPlan.findUnique({ where: { id } });
  if (existing) {
    console.log(`DietPlan ${title} already exists, updating...`);
    await prisma.dietPlan.update({
      where: { id },
      data: { title, description, dailyCalories, dietaryRestrictions, status: "ACTIVE", publishedAt: new Date() },
    });
    await prisma.dietDay.deleteMany({ where: { planId: id } });
  } else {
    await prisma.dietPlan.create({
      data: {
        id,
        trainerId: ids.trainerProfile,
        gymId: ids.gym,
        familyId: id,
        title,
        description,
        dietaryRestrictions,
        dailyCalories,
        status: "ACTIVE",
        version: 1,
        isTemplate: false,
        publishedAt: new Date(),
        legacyMeals: JSON.stringify(["صبحانه", "ناهار", "شام", "میان وعده"]),
      },
    });
  }

  for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
    const day = days[dayIndex];
    const dayId = `${id}-day-${dayIndex + 1}`;
    await prisma.dietDay.create({
      data: {
        id: dayId,
        planId: id,
        dayNumber: dayIndex + 1,
        name: day.name,
        targetCalories: day.targetCalories || null,
        targetProtein: day.targetProtein || null,
        targetCarbs: day.targetCarbs || null,
        targetFat: day.targetFat || null,
        notes: day.notes || null,
        meals: {
          create: day.meals.map((meal, mealIndex) => ({
            id: `${dayId}-meal-${mealIndex + 1}`,
            order: mealIndex + 1,
            name: meal.name,
            scheduledTime: meal.scheduledTime || null,
            notes: meal.notes || null,
            foodItems: {
              create: meal.foodItems.map((food, foodIndex) => ({
                id: `${dayId}-meal-${mealIndex + 1}-food-${foodIndex + 1}`,
                order: foodIndex + 1,
                name: food.name,
                quantity: food.quantity || null,
                unit: food.unit || null,
                calories: food.calories || null,
                protein: food.protein || null,
                carbs: food.carbs || null,
                fat: food.fat || null,
                notes: food.notes || null,
              })),
            },
          })),
        },
      },
    });
  }
  console.log(`✅ Created diet plan: ${title}`);
  return id;
}

async function main() {
  const seedPassword = process.env.SEED_PASSWORD || "KooGYMaa123!";
  const password = await bcrypt.hash(seedPassword, 12);
  const now = new Date();

  console.log("🔍 Finding Sara Trainer and Gym...");
  const trainerProfile = await prisma.trainerProfile.findUnique({ where: { id: ids.trainerProfile } });
  if (!trainerProfile) throw new Error("Sara trainer profile not found. Run main seed first.");
  const gym = await prisma.gym.findUnique({ where: { id: ids.gym } });
  if (!gym) throw new Error("Gym not found");

  // --- Create additional students ---
  console.log("\n👥 Creating additional students for Sara...");
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
  const arman = await prisma.user.findUnique({ where: { id: ids.armanUser } });
  if (!arman) {
    await upsertUser({
      id: ids.armanUser,
      email: "pending.member@koogymaa.test",
      name: "Arman Applicant",
      password,
      role: "USER",
    });
  }

  // Make gym memberships ACTIVE for all new students
  for (const userId of [ids.saharUser, ids.rezaUser, ids.parisaUser, ids.armanUser]) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) continue;
    await prisma.gymMembership.upsert({
      where: { gymId_userId: { gymId: ids.gym, userId: user.id } },
      update: { status: "ACTIVE", startedAt: addMonths(now, -2), reviewedAt: now, reviewedById: ids.trainerUser },
      create: {
        id: `gym-membership-${userId}`,
        gymId: ids.gym,
        userId: user.id,
        status: "ACTIVE",
        startedAt: addMonths(now, -2),
        reviewedAt: now,
        reviewedById: ids.trainerUser,
      },
    });
  }

  // Create TrainerClient relationships
  const sixMonthsAgo = addMonths(now, -6);
  const twoMonthsAgo = addMonths(now, -2);

  await prisma.trainerClient.upsert({
    where: { trainerId_userId: { trainerId: ids.trainerProfile, userId: ids.member } },
    update: { startedAt: sixMonthsAgo, status: "ACTIVE", gymId: ids.gym },
    create: {
      id: ids.trainerClientNima,
      trainerId: ids.trainerProfile,
      userId: ids.member,
      gymId: ids.gym,
      status: "ACTIVE",
      startedAt: sixMonthsAgo,
    },
  });

  const clients = [
    { id: ids.saharClient, userId: ids.saharUser, startedAt: addMonths(now, -4) },
    { id: ids.rezaClient, userId: ids.rezaUser, startedAt: addMonths(now, -3) },
    { id: ids.parisaClient, userId: ids.parisaUser, startedAt: addMonths(now, -1) },
    { id: ids.armanClient, userId: ids.armanUser, startedAt: twoMonthsAgo },
  ];

  for (const c of clients) {
    await prisma.trainerClient.upsert({
      where: { trainerId_userId: { trainerId: ids.trainerProfile, userId: c.userId } },
      update: { startedAt: c.startedAt, status: "ACTIVE", gymId: ids.gym },
      create: {
        id: c.id,
        trainerId: ids.trainerProfile,
        userId: c.userId,
        gymId: ids.gym,
        status: "ACTIVE",
        startedAt: c.startedAt,
      },
    });
  }

  console.log(`✅ Nima has been student for 6 months since ${sixMonthsAgo.toISOString()}`);

  // --- Create Workout Plans for Sara ---
  console.log("\n🏋️ Creating workout programs for Sara...");

  await createWorkoutPlan({
    id: ids.wpHypertrophy,
    title: "حجم عضلانی - هایپرتروفی ۴ روزه",
    description: "برنامه ۴ روزه تخصصی افزایش حجم عضلانی با تمرکز بر فشار مکانیکی و استرس متابولیک. مناسب برای افراد با سابقه ۶ ماه تمرین. هر جلسه ۷۵-۹۰ دقیقه.",
    days: [
      {
        name: "روز ۱ - سینه و پشت بازو",
        notes: "تمرکز بر پرس ها و حرکات هل دادن",
        exercises: [
          { name: "پرس سینه هالتر", sets: 4, reps: "8-10", restSeconds: 90, tempo: "2-1-2", notes: "کنترل کامل در پایین" },
          { name: "پرس بالا سینه دمبل", sets: 4, reps: "10-12", restSeconds: 75 },
          { name: "فلای سینه دستگاه", sets: 3, reps: "12-15", restSeconds: 60 },
          { name: "پشت بازو سیم کش", sets: 4, reps: "10-12", restSeconds: 60 },
          { name: "پشت بازو هالتر خوابیده", sets: 3, reps: "8-10", restSeconds: 75 },
          { name: "شنا سوئدی", sets: 3, reps: "تا ناتوانی", restSeconds: 60 },
        ],
      },
      {
        name: "روز ۲ - پا و شکم",
        notes: "روز سنگین پا - انرژی کافی داشته باش",
        exercises: [
          { name: "اسکوات هالتر", sets: 5, reps: "6-8", restSeconds: 120, tempo: "3-1-1" },
          { name: "ددلیفت رومانیایی", sets: 4, reps: "8-10", restSeconds: 90 },
          { name: "لانج قدم زدن", sets: 3, reps: "12 هر پا", restSeconds: 75 },
          { name: "پرس پا", sets: 4, reps: "10-12", restSeconds: 90 },
          { name: "ساق پا ایستاده", sets: 4, reps: "15-20", restSeconds: 45 },
          { name: "کرانچ سیم کش", sets: 3, reps: "15", restSeconds: 45 },
        ],
      },
      {
        name: "روز ۳ - پشت و جلو بازو",
        exercises: [
          { name: "بارفیکس", sets: 4, reps: "6-10", restSeconds: 90 },
          { name: "زیر بغل هالتر خم", sets: 4, reps: "8-10", restSeconds: 90 },
          { name: "لت سیم کش", sets: 3, reps: "10-12", restSeconds: 75 },
          { name: "جلو بازو هالتر", sets: 4, reps: "8-10", restSeconds: 60 },
          { name: "جلو بازو دمبل چکشی", sets: 3, reps: "10-12", restSeconds: 60 },
          { name: "ساعد هالتر", sets: 3, reps: "15", restSeconds: 45 },
        ],
      },
      {
        name: "روز ۴ - سرشانه و فول بادی",
        exercises: [
          { name: "پرس سرشانه هالتر", sets: 4, reps: "8-10", restSeconds: 90 },
          { name: "نشر جانب دمبل", sets: 4, reps: "12-15", restSeconds: 60 },
          { name: "نشر خم دمبل", sets: 3, reps: "12-15", restSeconds: 60 },
          { name: "شراگ دمبل", sets: 3, reps: "12", restSeconds: 60 },
          { name: "ددلیفت", sets: 3, reps: "6", restSeconds: 120, notes: "فرم صحیح مهم است" },
          { name: "پلانک", sets: 3, reps: "60 ثانیه", restSeconds: 45, durationSeconds: 60 },
        ],
      },
    ],
  });

  await createWorkoutPlan({
    id: ids.wpFatloss,
    title: "چربی سوزی و کاندیشننگ - HIIT",
    description: "برنامه ۳ روزه ترکیبی قدرتی و هوازی با شدت بالا برای چربی سوزی حداکثری. هر جلسه شامل ۲۰ دقیقه HIIT + ۴۰ دقیقه قدرتی.",
    days: [
      {
        name: "روز ۱ - HIIT فول بادی",
        notes: "۳۰ ثانیه کار ۱۵ ثانیه استراحت",
        exercises: [
          { name: "برپی", sets: 5, reps: "15", restSeconds: 45, notes: "HIIT" },
          { name: "اسکوات پرشی", sets: 4, reps: "20", restSeconds: 30 },
          { name: "شنا", sets: 4, reps: "15", restSeconds: 30 },
          { name: "کتل بل سوئینگ", sets: 4, reps: "20", restSeconds: 45 },
          { name: "دوچرخه هوایی", sets: 3, reps: "30 ثانیه", durationSeconds: 30, restSeconds: 15 },
          { name: "دویدن درجا زانو بلند", sets: 3, reps: "30 ثانیه", durationSeconds: 30, restSeconds: 15 },
        ],
      },
      {
        name: "روز ۲ - قدرتی چربی سوز",
        exercises: [
          { name: "اسکوات", sets: 4, reps: "15", restSeconds: 45 },
          { name: "پرس سینه", sets: 4, reps: "15", restSeconds: 45 },
          { name: "زیر بغل قایقی", sets: 4, reps: "15", restSeconds: 45 },
          { name: "لانج", sets: 3, reps: "12 هر پا", restSeconds: 30 },
          { name: "پلانک به شنا", sets: 3, reps: "10", restSeconds: 30 },
          { name: "تردمیل اینتروال", sets: 1, reps: "15 دقیقه", durationSeconds: 900, notes: "1 دقیقه سریع 1 دقیقه آهسته" },
        ],
      },
      {
        name: "روز ۳ - کاندیشننگ و کور",
        exercises: [
          { name: "ددلیفت", sets: 4, reps: "12", restSeconds: 60 },
          { name: "پرس سرشانه", sets: 3, reps: "12", restSeconds: 45 },
          { name: "روئینگ دستگاه", sets: 1, reps: "1000 متر", distanceMeters: 1000, durationSeconds: 300 },
          { name: "کرانچ", sets: 4, reps: "20", restSeconds: 30 },
          { name: "کوهنوردی", sets: 3, reps: "30 ثانیه", durationSeconds: 30, restSeconds: 15 },
          { name: "طناب زنی", sets: 3, reps: "2 دقیقه", durationSeconds: 120, restSeconds: 30 },
        ],
      },
    ],
  });

  await createWorkoutPlan({
    id: ids.wpStrengthL2,
    title: "قدرت پایه پیشرفته - سطح ۲",
    description: "ادامه برنامه Foundation Strength برای افزایش قدرت خالص. تمرکز بر ۳ حرکت اصلی: اسکوات، ددلیفت، پرس سینه. مناسب برای نیما و رضا.",
    days: [
      {
        name: "روز A - قدرت پایین تنه",
        notes: "سنگین و کنترل شده",
        exercises: [
          { name: "Back Squat", sets: 5, reps: "5", restSeconds: 180, tempo: "3-1-1", weight: "80-85% 1RM" },
          { name: "Front Squat", sets: 3, reps: "6", restSeconds: 120 },
          { name: "Romanian Deadlift", sets: 4, reps: "6", restSeconds: 120 },
          { name: "Bulgarian Split Squat", sets: 3, reps: "8 هر پا", restSeconds: 75 },
          { name: "Calf Raise", sets: 4, reps: "12", restSeconds: 60 },
        ],
      },
      {
        name: "روز B - قدرت بالا تنه",
        exercises: [
          { name: "Bench Press", sets: 5, reps: "5", restSeconds: 180, weight: "80% 1RM" },
          { name: "Barbell Row", sets: 4, reps: "6", restSeconds: 120 },
          { name: "Overhead Press", sets: 4, reps: "6", restSeconds: 120 },
          { name: "Weighted Pull-Up", sets: 3, reps: "5", restSeconds: 120 },
          { name: "Dips", sets: 3, reps: "8", restSeconds: 75 },
        ],
      },
      {
        name: "روز C - قدرت کامل و تکنیک",
        exercises: [
          { name: "Deadlift", sets: 5, reps: "3", restSeconds: 180, notes: "فرم اولویت دارد" },
          { name: "Incline Bench", sets: 3, reps: "8", restSeconds: 90 },
          { name: "Single Leg Deadlift", sets: 3, reps: "8 هر پا", restSeconds: 75 },
          { name: "Face Pull", sets: 3, reps: "12", restSeconds: 60 },
          { name: "Plank", sets: 3, reps: "60s", durationSeconds: 60, restSeconds: 45 },
        ],
      },
    ],
  });

  await createWorkoutPlan({
    id: ids.wpMobility,
    title: "موبیلیتی و ریکاوری - ویژه",
    description: "برنامه ریکاوری و افزایش دامنه حرکتی، مناسب برای روزهای استراحت فعال و پیشگیری از آسیب. طراحی شده توسط سارا با تخصص Mobility.",
    days: [
      {
        name: "روز ۱ - موبیلیتی پایین تنه",
        exercises: [
          { name: "Hip 90/90 Stretch", sets: 2, reps: "60s هر طرف", durationSeconds: 60, restSeconds: 15 },
          { name: "Pigeon Stretch", sets: 2, reps: "60s هر طرف", durationSeconds: 60, restSeconds: 15 },
          { name: "Ankle Mobility Drill", sets: 3, reps: "10", restSeconds: 30 },
          { name: "Deep Squat Hold", sets: 3, reps: "45s", durationSeconds: 45, restSeconds: 30 },
          { name: "Foam Rolling - Quad & Hamstring", sets: 1, reps: "5 دقیقه", durationSeconds: 300 },
        ],
      },
      {
        name: "روز ۲ - موبیلیتی بالا تنه و تنفس",
        exercises: [
          { name: "Thoracic Spine Rotation", sets: 3, reps: "10 هر طرف", restSeconds: 30 },
          { name: "Band Pull Apart", sets: 3, reps: "15", restSeconds: 30 },
          { name: "Wall Slides", sets: 3, reps: "10", restSeconds: 30 },
          { name: "Cat-Cow", sets: 2, reps: "10", restSeconds: 15 },
          { name: "Breathing - Box Breathing", sets: 3, reps: "4-4-4-4", durationSeconds: 60, notes: "تنفس عمیق" },
          { name: "Child's Pose", sets: 2, reps: "60s", durationSeconds: 60 },
        ],
      },
    ],
  });

  await createWorkoutPlan({
    id: ids.wpWomen,
    title: "فول بادی بانوان - تناسب اندام",
    description: "برنامه ۳ روزه فول بادی مخصوص بانوان با تمرکز بر فرم دهی پا، باسن و شکم. مناسب برای سحر و پریسا.",
    days: [
      {
        name: "روز ۱ - پا و باسن",
        exercises: [
          { name: "Hip Thrust", sets: 4, reps: "12", restSeconds: 75 },
          { name: "Squat", sets: 4, reps: "12", restSeconds: 75 },
          { name: "Leg Press", sets: 3, reps: "15", restSeconds: 60 },
          { name: "Kickback سیم کش", sets: 3, reps: "15 هر پا", restSeconds: 45 },
          { name: "Side Leg Raise", sets: 3, reps: "15 هر پا", restSeconds: 45 },
        ],
      },
      {
        name: "روز ۲ - بالا تنه و شکم",
        exercises: [
          { name: "Lat Pulldown", sets: 3, reps: "12", restSeconds: 60 },
          { name: "Seated Row", sets: 3, reps: "12", restSeconds: 60 },
          { name: "Push Up", sets: 3, reps: "10", restSeconds: 45 },
          { name: "Dumbbell Shoulder Press", sets: 3, reps: "12", restSeconds: 60 },
          { name: "Russian Twist", sets: 3, reps: "20", restSeconds: 30 },
          { name: "Leg Raise", sets: 3, reps: "15", restSeconds: 30 },
        ],
      },
      {
        name: "روز ۳ - فول بادی چربی سوز",
        exercises: [
          { name: "Deadlift", sets: 3, reps: "12", restSeconds: 60 },
          { name: "Lunge", sets: 3, reps: "12 هر پا", restSeconds: 45 },
          { name: "Bench Press دمبل", sets: 3, reps: "12", restSeconds: 60 },
          { name: "Plank", sets: 3, reps: "45s", durationSeconds: 45, restSeconds: 30 },
          { name: "Jump Squat", sets: 3, reps: "15", restSeconds: 30 },
          { name: "Treadmill", sets: 1, reps: "20 دقیقه", durationSeconds: 1200, notes: "شیب 5 سرعت متوسط" },
        ],
      },
    ],
  });

  // --- Create Diet Plans ---
  console.log("\n🥗 Creating nutrition programs for Sara...");

  await createDietPlan({
    id: ids.dpBulk,
    title: "رژیم افزایش وزن سالم - ۳۰۰۰ کالری",
    description: "برنامه غذایی برای افزایش حجم عضلانی با ۳۰۰۰ کالری، ۱۸۰ گرم پروتئین، مناسب برای رضا و نیما در فاز حجم.",
    dailyCalories: 3000,
    dietaryRestrictions: "بدون محدودیت خاص، تاکید بر پروتئین بالا",
    days: [
      {
        name: "روز تمرین",
        targetCalories: 3000,
        targetProtein: 180,
        targetCarbs: 380,
        targetFat: 85,
        meals: [
          {
            name: "صبحانه - ۸:۰۰",
            scheduledTime: "08:00",
            foodItems: [
              { name: "تخم مرغ کامل", quantity: 3, unit: "عدد", calories: 210, protein: 18, carbs: 1, fat: 15 },
              { name: "نان تست سبوس دار", quantity: 2, unit: "برش", calories: 160, protein: 6, carbs: 30, fat: 2 },
              { name: "کره بادام زمینی", quantity: 20, unit: "g", calories: 120, protein: 5, carbs: 3, fat: 10 },
              { name: "موز", quantity: 1, unit: "عدد", calories: 105, protein: 1, carbs: 27, fat: 0 },
            ],
          },
          {
            name: "میان وعده - ۱۱:۰۰",
            scheduledTime: "11:00",
            foodItems: [
              { name: "شیک پروتئین + شیر", quantity: 1, unit: "لیوان", calories: 250, protein: 25, carbs: 20, fat: 5 },
              { name: "بادام", quantity: 30, unit: "g", calories: 180, protein: 6, carbs: 6, fat: 16 },
            ],
          },
          {
            name: "ناهار - ۱۳:۳۰",
            scheduledTime: "13:30",
            foodItems: [
              { name: "سینه مرغ گریل", quantity: 200, unit: "g", calories: 330, protein: 62, carbs: 0, fat: 7 },
              { name: "برنج پخته", quantity: 300, unit: "g", calories: 390, protein: 7, carbs: 84, fat: 1 },
              { name: "روغن زیتون", quantity: 10, unit: "g", calories: 88, protein: 0, carbs: 0, fat: 10 },
              { name: "سالاد", quantity: 100, unit: "g", calories: 20, protein: 1, carbs: 4, fat: 0 },
            ],
          },
          {
            name: "قبل تمرین - ۱۶:۳۰",
            scheduledTime: "16:30",
            foodItems: [
              { name: "جو دوسر", quantity: 80, unit: "g", calories: 310, protein: 10, carbs: 53, fat: 6 },
              { name: "شیر", quantity: 200, unit: "ml", calories: 90, protein: 6, carbs: 10, fat: 3 },
            ],
          },
          {
            name: "شام - ۲۰:۰۰",
            scheduledTime: "20:00",
            foodItems: [
              { name: "گوشت قرمز کم چرب", quantity: 180, unit: "g", calories: 320, protein: 45, carbs: 0, fat: 14 },
              { name: "سیب زمینی پخته", quantity: 250, unit: "g", calories: 200, protein: 5, carbs: 45, fat: 0 },
              { name: "سبزیجات بخارپز", quantity: 150, unit: "g", calories: 50, protein: 2, carbs: 10, fat: 0 },
            ],
          },
          {
            name: "قبل خواب - ۲۲:۳۰",
            scheduledTime: "22:30",
            foodItems: [
              { name: "ماست یونانی", quantity: 200, unit: "g", calories: 140, protein: 20, carbs: 8, fat: 2 },
              { name: "گردو", quantity: 15, unit: "g", calories: 98, protein: 2, carbs: 2, fat: 10 },
            ],
          },
        ],
      },
    ],
  });

  await createDietPlan({
    id: ids.dpCut,
    title: "رژیم کات و چربی سوزی - ۲۰۰۰ کالری",
    description: "رژیم کات با پروتئین بالا و کربوهیدرات کنترل شده برای حفظ عضله و چربی سوزی. مناسب برای نیما در ماه های ۳-۶.",
    dailyCalories: 2000,
    dietaryRestrictions: "کربوهیدرات کنترل شده، پروتئین بالا",
    days: [
      {
        name: "روز کات",
        targetCalories: 2000,
        targetProtein: 170,
        targetCarbs: 180,
        targetFat: 65,
        meals: [
          {
            name: "صبحانه",
            scheduledTime: "08:00",
            foodItems: [
              { name: "سفیده تخم مرغ", quantity: 4, unit: "عدد", calories: 70, protein: 14, carbs: 1, fat: 0 },
              { name: "تخم مرغ کامل", quantity: 1, unit: "عدد", calories: 70, protein: 6, carbs: 0, fat: 5 },
              { name: "جو دوسر", quantity: 50, unit: "g", calories: 190, protein: 6, carbs: 32, fat: 3 },
            ],
          },
          {
            name: "ناهار",
            scheduledTime: "13:00",
            foodItems: [
              { name: "سینه مرغ", quantity: 180, unit: "g", calories: 300, protein: 55, carbs: 0, fat: 6 },
              { name: "برنج قهوه ای", quantity: 150, unit: "g", calories: 170, protein: 4, carbs: 35, fat: 1 },
              { name: "کلم بروکلی", quantity: 150, unit: "g", calories: 50, protein: 4, carbs: 10, fat: 0 },
            ],
          },
          {
            name: "میان وعده",
            scheduledTime: "16:00",
            foodItems: [
              { name: "تن ماهی در آب", quantity: 120, unit: "g", calories: 150, protein: 26, carbs: 0, fat: 2 },
              { name: "نان سبوس", quantity: 1, unit: "برش", calories: 80, protein: 3, carbs: 15, fat: 1 },
            ],
          },
          {
            name: "شام",
            scheduledTime: "20:00",
            foodItems: [
              { name: "ماهی سالمون", quantity: 150, unit: "g", calories: 280, protein: 30, carbs: 0, fat: 16 },
              { name: "سالاد سبز", quantity: 200, unit: "g", calories: 40, protein: 2, carbs: 8, fat: 0 },
              { name: "روغن زیتون", quantity: 10, unit: "g", calories: 88, protein: 0, carbs: 0, fat: 10 },
            ],
          },
          {
            name: "قبل خواب",
            scheduledTime: "22:00",
            foodItems: [
              { name: "کازئین یا ماست یونانی", quantity: 200, unit: "g", calories: 140, protein: 20, carbs: 8, fat: 2 },
            ],
          },
        ],
      },
    ],
  });

  await createDietPlan({
    id: ids.dpWomen,
    title: "رژیم متعادل بانوان - ۱۸۰۰ کالری",
    description: "رژیم متعادل ۱۸۰۰ کالری مخصوص بانوان با تاکید بر آهن، کلسیم و پروتئین کافی. طراحی شده برای سحر و پریسا.",
    dailyCalories: 1800,
    dietaryRestrictions: "متعادل بانوان، آهن بالا",
    days: [
      {
        name: "روز متعادل",
        targetCalories: 1800,
        targetProtein: 110,
        targetCarbs: 200,
        targetFat: 60,
        meals: [
          {
            name: "صبحانه",
            scheduledTime: "08:30",
            foodItems: [
              { name: "تخم مرغ", quantity: 2, unit: "عدد", calories: 140, protein: 12, carbs: 1, fat: 10 },
              { name: "نان جو", quantity: 1, unit: "برش", calories: 80, protein: 3, carbs: 15, fat: 1 },
              { name: "آووکادو", quantity: 50, unit: "g", calories: 80, protein: 1, carbs: 4, fat: 7 },
              { name: "گوجه و خیار", quantity: 100, unit: "g", calories: 20, protein: 1, carbs: 4, fat: 0 },
            ],
          },
          {
            name: "میان وعده",
            scheduledTime: "11:00",
            foodItems: [
              { name: "ماست کم چرب", quantity: 150, unit: "g", calories: 80, protein: 8, carbs: 10, fat: 1 },
              { name: "توت فرنگی", quantity: 100, unit: "g", calories: 32, protein: 0, carbs: 8, fat: 0 },
              { name: "بادام", quantity: 10, unit: "g", calories: 60, protein: 2, carbs: 2, fat: 5 },
            ],
          },
          {
            name: "ناهار",
            scheduledTime: "13:30",
            foodItems: [
              { name: "سینه مرغ", quantity: 120, unit: "g", calories: 200, protein: 36, carbs: 0, fat: 4 },
              { name: "کینوا پخته", quantity: 120, unit: "g", calories: 140, protein: 5, carbs: 26, fat: 2 },
              { name: "سالاد", quantity: 150, unit: "g", calories: 30, protein: 1, carbs: 6, fat: 0 },
            ],
          },
          {
            name: "عصرانه",
            scheduledTime: "16:30",
            foodItems: [
              { name: "سیب", quantity: 1, unit: "عدد", calories: 95, protein: 0, carbs: 25, fat: 0 },
              { name: "کره بادام زمینی", quantity: 15, unit: "g", calories: 90, protein: 3, carbs: 2, fat: 8 },
            ],
          },
          {
            name: "شام",
            scheduledTime: "19:30",
            foodItems: [
              { name: "ماهی", quantity: 120, unit: "g", calories: 180, protein: 26, carbs: 0, fat: 8 },
              { name: "سبزیجات بخارپز", quantity: 200, unit: "g", calories: 70, protein: 3, carbs: 14, fat: 0 },
              { name: "روغن زیتون", quantity: 5, unit: "g", calories: 44, protein: 0, carbs: 0, fat: 5 },
            ],
          },
        ],
      },
    ],
  });

  await createDietPlan({
    id: ids.dpMaintain,
    title: "رژیم نگهدارنده - ۲۴۰۰ کالری",
    description: "رژیم نگهدارنده متعادل برای حفظ وزن و انرژی روزانه، مناسب برای تمام شاگردان در فاز تثبیت.",
    dailyCalories: 2400,
    dietaryRestrictions: "متعادل",
    days: [
      {
        name: "روز نگهدارنده",
        targetCalories: 2400,
        targetProtein: 140,
        targetCarbs: 300,
        targetFat: 70,
        meals: [
          {
            name: "صبحانه",
            scheduledTime: "08:00",
            foodItems: [
              { name: "نان سنگک", quantity: 1, unit: "برش", calories: 120, protein: 4, carbs: 24, fat: 1 },
              { name: "پنیر کم چرب", quantity: 50, unit: "g", calories: 80, protein: 10, carbs: 2, fat: 4 },
              { name: "گردو", quantity: 10, unit: "g", calories: 65, protein: 1, carbs: 1, fat: 6 },
              { name: "چای", quantity: 1, unit: "لیوان", calories: 0, protein: 0, carbs: 0, fat: 0 },
            ],
          },
          {
            name: "ناهار",
            scheduledTime: "13:00",
            foodItems: [
              { name: "چلو کباب کوبیده", quantity: 1, unit: "پرس", calories: 600, protein: 35, carbs: 60, fat: 25 },
              { name: "ماست", quantity: 100, unit: "g", calories: 60, protein: 5, carbs: 6, fat: 2 },
            ],
          },
          {
            name: "شام",
            scheduledTime: "20:00",
            foodItems: [
              { name: "خوراک مرغ و سبزیجات", quantity: 1, unit: "پرس", calories: 400, protein: 35, carbs: 30, fat: 15 },
              { name: "نان", quantity: 1, unit: "برش", calories: 80, protein: 2, carbs: 15, fat: 1 },
            ],
          },
        ],
      },
    ],
  });

  // --- Assign plans to students ---
  console.log("\n📌 Assigning plans to students...");

  const allStudents = [
    { userId: ids.member, clientId: ids.trainerClientNima, name: "Nima" },
    { userId: ids.saharUser, clientId: ids.saharClient, name: "Sahar" },
    { userId: ids.rezaUser, clientId: ids.rezaClient, name: "Reza" },
    { userId: ids.parisaUser, clientId: ids.parisaClient, name: "Parisa" },
    { userId: ids.armanUser, clientId: ids.armanClient, name: "Arman" },
  ];

  const workoutAssignments = [
    { planId: ids.wpStrengthL2, students: [ids.member, ids.rezaUser] },
    { planId: ids.wpHypertrophy, students: [ids.member, ids.rezaUser, ids.armanUser] },
    { planId: ids.wpFatloss, students: [ids.member, ids.saharUser, ids.parisaUser] },
    { planId: ids.wpWomen, students: [ids.saharUser, ids.parisaUser] },
    { planId: ids.wpMobility, students: [ids.member, ids.saharUser, ids.rezaUser, ids.parisaUser, ids.armanUser] },
  ];

  for (const wa of workoutAssignments) {
    for (const userId of wa.students) {
      const student = allStudents.find(s => s.userId === userId);
      if (!student) continue;
      await prisma.workoutAssignment.upsert({
        where: { planId_userId: { planId: wa.planId, userId } },
        update: { status: "ACTIVE", trainerClientId: student.clientId, startDate: now },
        create: {
          id: `wa-${wa.planId}-${userId}`,
          planId: wa.planId,
          userId,
          trainerClientId: student.clientId,
          status: "ACTIVE",
          startDate: now,
        },
      });
    }
  }

  const dietAssignments = [
    { planId: ids.dpBulk, students: [ids.rezaUser, ids.armanUser] },
    { planId: ids.dpCut, students: [ids.member] },
    { planId: ids.dpWomen, students: [ids.saharUser, ids.parisaUser] },
    { planId: ids.dpMaintain, students: [ids.member, ids.saharUser, ids.rezaUser, ids.parisaUser, ids.armanUser] },
  ];

  for (const da of dietAssignments) {
    for (const userId of da.students) {
      const student = allStudents.find(s => s.userId === userId);
      if (!student) continue;
      await prisma.dietAssignment.upsert({
        where: { planId_userId: { planId: da.planId, userId } },
        update: { status: "ACTIVE", trainerClientId: student.clientId, startDate: now },
        create: {
          id: `da-${da.planId}-${userId}`,
          planId: da.planId,
          userId,
          trainerClientId: student.clientId,
          status: "ACTIVE",
          startDate: now,
        },
      });
    }
  }

  // --- Nima's 6-month journey ---
  console.log("\n📈 Creating Nima's 6-month journey...");

  const nimaMeasurements = [
    { id: "nima-m-1", date: addMonths(now, -6), weight: 85.2, bodyFat: 22.5, waist: 92, chest: 100, arm: 33, hips: 102, notes: "ماه ۱ - شروع مسیر، وزن اولیه" },
    { id: "nima-m-2", date: addMonths(now, -5), weight: 84.0, bodyFat: 21.0, waist: 90, chest: 100.5, arm: 33.5, hips: 101, notes: "ماه ۲ - کاهش ۱.۲ کیلو، بهبود فرم" },
    { id: "nima-m-3", date: addMonths(now, -4), weight: 82.8, bodyFat: 19.8, waist: 88.5, chest: 101, arm: 34, hips: 100, notes: "ماه ۳ - پایان فاز قدرت پایه" },
    { id: "nima-m-4", date: addMonths(now, -3), weight: 81.5, bodyFat: 18.5, waist: 87, chest: 101.5, arm: 34.5, hips: 99, notes: "ماه ۴ - شروع فاز هایپرتروفی" },
    { id: "nima-m-5", date: addMonths(now, -2), weight: 80.8, bodyFat: 17.2, waist: 85.5, chest: 102, arm: 35, hips: 98, notes: "ماه ۵ - فاز کات شروع شد" },
    { id: "nima-m-6", date: now, weight: 80.0, bodyFat: 16.0, waist: 84, chest: 102.5, arm: 35.5, hips: 97, notes: "ماه ۶ - الان، ۵.۲ کیلو کاهش وزن، ۶.۵٪ چربی کمتر، عضله بیشتر" },
  ];

  for (const m of nimaMeasurements) {
    await prisma.bodyMeasurement.upsert({
      where: { id: m.id },
      update: {
        weightKg: m.weight,
        bodyFatPercent: m.bodyFat,
        waistCm: m.waist,
        chestCm: m.chest,
        armCm: m.arm,
        hipsCm: m.hips,
        notes: m.notes,
        recordedAt: m.date,
      },
      create: {
        id: m.id,
        userId: ids.member,
        recordedAt: m.date,
        weightKg: m.weight,
        bodyFatPercent: m.bodyFat,
        waistCm: m.waist,
        chestCm: m.chest,
        armCm: m.arm,
        hipsCm: m.hips,
        thighCm: 58,
        notes: m.notes,
      },
    });
  }

  // Progress photos for Nima
  const photos = [
    { id: "nima-photo-m1", measurementId: "nima-m-1", url: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e", pose: "Front - Month 1" },
    { id: "nima-photo-m3", measurementId: "nima-m-3", url: "https://images.unsplash.com/photo-1594381898411-846e7d193883", pose: "Front - Month 3" },
    { id: "nima-photo-m6", measurementId: "nima-m-6", url: "https://images.unsplash.com/photo-1534367610401-9f5ed68180aa", pose: "Front - Month 6 - Current" },
  ];

  for (const p of photos) {
    await prisma.progressPhoto.upsert({
      where: { id: p.id },
      update: { imageUrl: p.url, pose: p.pose, measurementId: p.measurementId },
      create: { id: p.id, userId: ids.member, measurementId: p.measurementId, imageUrl: p.url, pose: p.pose },
    });
  }

  // Feedback for Nima's journey
  const feedbacks = [
    { id: "nima-fb-m1", content: "نیما جان ماه اول عالی بود! فرم اسکواتت خیلی بهتر شده. ادامه بده.", date: addMonths(now, -5) },
    { id: "nima-fb-m2", content: "ماه دوم: قدرتت ۲۰٪ افزایش داشته. وزنه‌ها رو می‌تونی بیشتر کنی.", date: addMonths(now, -4) },
    { id: "nima-fb-m3", content: "ماه سوم: پایان فاز قدرت پایه. آماده‌ای برای هایپرتروفی؟ برنامه جدیدت رو گذاشتم.", date: addMonths(now, -3) },
    { id: "nima-fb-m4", content: "ماه چهارم: حجم عضلانیت داره میاد! سینه و بازوهات فرق کرده.", date: addMonths(now, -2) },
    { id: "nima-fb-m5", content: "ماه پنجم: وارد فاز کات شدیم. رژیم ۲۰۰۰ کالری رو دقیق رعایت کن.", date: addMonths(now, -1) },
    { id: "nima-fb-m6", content: "ماه ششم: نیما تو الان ۶ ماهه شاگرد منی! ۵.۲ کیلو چربی کم کردی و ۲.۵ سانت به بازوت اضافه شده. بهت افتخار می‌کنم 💪", date: now },
  ];

  for (const fb of feedbacks) {
    await prisma.feedback.upsert({
      where: { id: fb.id },
      update: { content: fb.content },
      create: {
        id: fb.id,
        authorId: ids.trainerUser,
        recipientId: ids.member,
        trainerClientId: ids.trainerClientNima,
        type: "PROGRESS",
        content: fb.content,
        createdAt: fb.date,
        updatedAt: fb.date,
      },
    });
  }

  // Notifications for Nima
  const notifications = [
    { id: "nima-notif-1", title: "برنامه جدید قدرت سطح ۲", message: "سارا برنامه قدرت پیشرفته سطح ۲ رو برات فعال کرد", href: "/user/workouts", date: addMonths(now, -3) },
    { id: "nima-notif-2", title: "برنامه هایپرتروفی", message: "برنامه ۴ روزه حجم عضلانی برات فعال شد", href: "/user/workouts", date: addMonths(now, -2) },
    { id: "nima-notif-3", title: "رژیم کات شروع شد", message: "رژیم ۲۰۰۰ کالری کات برات فعال شد - ۶ هفته تا نتیجه", href: "/user/nutrition", date: addMonths(now, -1) },
    { id: "nima-notif-4", title: "۶ ماهگی شاگردی!", message: "تبریک! ۶ ماهه که با سارا تمرین می‌کنی. مسیرت رو ببین", href: "/user/progress", date: now },
  ];

  for (const n of notifications) {
    await prisma.notification.upsert({
      where: { id: n.id },
      update: { title: n.title, message: n.message, href: n.href },
      create: { id: n.id, userId: ids.member, type: "GENERAL", title: n.title, message: n.message, href: n.href, createdAt: n.date },
    });
  }

  console.log("\n🎉 All done!");
  console.log("📊 Summary:");
  console.log("- 5 workout programs for Sara created");
  console.log("- 4 diet programs for Sara created");
  console.log("- 5 students assigned (Nima 6 months, Sahar 4 months, Reza 3 months, Parisa 1 month, Arman 2 months)");
  console.log("- Nima's 6-month journey with measurements, photos, feedback, notifications");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("\n✅ Seed completed successfully");
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

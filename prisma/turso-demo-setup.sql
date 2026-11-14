-- KooGYMaa hosted-database setup (schema + demo data).
-- Generated from the seeded local dev.db. Paste into the Turso dashboard SQL editor,
-- or pipe through the CLI:  turso db shell koogymaa < prisma/turso-demo-setup.sql
PRAGMA foreign_keys = OFF;
PRAGMA defer_foreign_keys = ON;

CREATE TABLE "Gym" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL CHECK (length(trim("name")) >= 2),
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'IR',
    "latitude" REAL CHECK ("latitude" IS NULL OR "latitude" BETWEEN -90 AND 90),
    "longitude" REAL CHECK ("longitude" IS NULL OR "longitude" BETWEEN -180 AND 180),
    "status" TEXT NOT NULL DEFAULT 'DRAFT' CHECK ("status" IN ('DRAFT', 'ACTIVE', 'SUSPENDED', 'ARCHIVED')),
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "Gym" ("id", "name", "slug", "description", "email", "phone", "address", "city", "country", "latitude", "longitude", "status", "createdAt", "updatedAt") VALUES ('seed-gym-central', 'KooGYMaa Central', 'koogymaa-central', 'A modern strength, conditioning, and recovery space.', 'central@koogymaa.test', '+98-21-5555-0101', 'Valiasr Street', 'Tehran', 'IR', NULL, NULL, 'ACTIVE', '2026-08-21T15:14:38.206+00:00', '2026-08-21T15:14:38.206+00:00');
INSERT INTO "Gym" ("id", "name", "slug", "description", "email", "phone", "address", "city", "country", "latitude", "longitude", "status", "createdAt", "updatedAt") VALUES ('seed-gym-atlas', 'Atlas Fitness North', 'atlas-fitness-north', 'A bright neighborhood gym focused on functional training and community classes.', 'north@atlas-fitness.test', '+98-21-5555-0202', 'Shariati Street', 'Tehran', 'IR', NULL, NULL, 'ACTIVE', '2026-08-21T15:14:38.220+00:00', '2026-08-21T15:14:38.220+00:00');

CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL CHECK (length(trim("name")) BETWEEN 2 AND 80),
    "email" TEXT NOT NULL CHECK (length("email") BETWEEN 3 AND 254),
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER' CHECK ("role" IN ('ADMIN', 'TRAINER', 'USER')),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE' CHECK ("status" IN ('ACTIVE', 'SUSPENDED', 'DEACTIVATED')),
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "User" ("id", "name", "email", "password", "phone", "avatarUrl", "role", "status", "lastLoginAt", "createdAt", "updatedAt") VALUES ('seed-user-admin', 'KooGYMaa Admin', 'admin@koogymaa.test', '$2b$12$li2KyHzGXeDmtxXgQ4N/lejAdsX7eMGY.lJWbHXeb5IxfAMXIf/oO', NULL, NULL, 'ADMIN', 'ACTIVE', NULL, '2026-08-21T15:14:38.138+00:00', '2026-08-21T15:14:38.138+00:00');
INSERT INTO "User" ("id", "name", "email", "password", "phone", "avatarUrl", "role", "status", "lastLoginAt", "createdAt", "updatedAt") VALUES ('seed-user-trainer', 'Sara Trainer', 'trainer@koogymaa.test', '$2b$12$li2KyHzGXeDmtxXgQ4N/lejAdsX7eMGY.lJWbHXeb5IxfAMXIf/oO', NULL, NULL, 'TRAINER', 'ACTIVE', NULL, '2026-08-21T15:14:38.151+00:00', '2026-08-21T15:14:38.151+00:00');
INSERT INTO "User" ("id", "name", "email", "password", "phone", "avatarUrl", "role", "status", "lastLoginAt", "createdAt", "updatedAt") VALUES ('seed-user-member', 'Nima Member', 'member@koogymaa.test', '$2b$12$li2KyHzGXeDmtxXgQ4N/lejAdsX7eMGY.lJWbHXeb5IxfAMXIf/oO', NULL, NULL, 'USER', 'ACTIVE', NULL, '2026-08-21T15:14:38.161+00:00', '2026-08-21T15:14:38.161+00:00');
INSERT INTO "User" ("id", "name", "email", "password", "phone", "avatarUrl", "role", "status", "lastLoginAt", "createdAt", "updatedAt") VALUES ('seed-user-pending-member', 'Arman Applicant', 'pending.member@koogymaa.test', '$2b$12$li2KyHzGXeDmtxXgQ4N/lejAdsX7eMGY.lJWbHXeb5IxfAMXIf/oO', NULL, NULL, 'USER', 'ACTIVE', NULL, '2026-08-21T15:14:38.171+00:00', '2026-08-21T15:14:38.171+00:00');
INSERT INTO "User" ("id", "name", "email", "password", "phone", "avatarUrl", "role", "status", "lastLoginAt", "createdAt", "updatedAt") VALUES ('seed-user-pending-trainer', 'Leila Coach', 'pending.trainer@koogymaa.test', '$2b$12$li2KyHzGXeDmtxXgQ4N/lejAdsX7eMGY.lJWbHXeb5IxfAMXIf/oO', NULL, NULL, 'TRAINER', 'ACTIVE', NULL, '2026-08-21T15:14:38.180+00:00', '2026-08-21T15:14:38.180+00:00');

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT,
    "actorRole" TEXT,
    "gymId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "AuditLog" ("id", "actorId", "actorRole", "gymId", "action", "entityType", "entityId", "metadata", "ipAddress", "createdAt") VALUES ('seed-audit-payment', 'seed-user-admin', 'ADMIN', 'seed-gym-central', 'SEED_PAYMENT_RECORDED', 'Payment', 'seed-payment-member', NULL, NULL, '2026-08-21T15:14:38.415+00:00');

CREATE TABLE "BodyMeasurement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weightKg" REAL CHECK ("weightKg" IS NULL OR "weightKg" BETWEEN 1 AND 500),
    "bodyFatPercent" REAL CHECK ("bodyFatPercent" IS NULL OR "bodyFatPercent" BETWEEN 0 AND 100),
    "waistCm" REAL CHECK ("waistCm" IS NULL OR "waistCm" > 0),
    "chestCm" REAL CHECK ("chestCm" IS NULL OR "chestCm" > 0),
    "armCm" REAL CHECK ("armCm" IS NULL OR "armCm" > 0),
    "hipsCm" REAL CHECK ("hipsCm" IS NULL OR "hipsCm" > 0),
    "thighCm" REAL CHECK ("thighCm" IS NULL OR "thighCm" > 0),
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BodyMeasurement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "BodyMeasurement" ("id", "userId", "recordedAt", "weightKg", "bodyFatPercent", "waistCm", "chestCm", "armCm", "hipsCm", "thighCm", "notes", "createdAt", "updatedAt") VALUES ('seed-measurement-start', 'seed-user-member', '2026-07-22T15:14:38.009+00:00', 82.4, 19.5, 88, 101, 34.5, NULL, NULL, NULL, '2026-08-21T15:14:38.576+00:00', '2026-08-21T15:14:38.576+00:00');
INSERT INTO "BodyMeasurement" ("id", "userId", "recordedAt", "weightKg", "bodyFatPercent", "waistCm", "chestCm", "armCm", "hipsCm", "thighCm", "notes", "createdAt", "updatedAt") VALUES ('seed-measurement-latest', 'seed-user-member', '2026-08-21T15:14:38.009+00:00', 80.8, 18.2, 85.5, 102, 35.2, NULL, NULL, 'End of first training block.', '2026-08-21T15:14:38.584+00:00', '2026-08-21T15:14:38.584+00:00');

CREATE TABLE "TrainerProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "specialty" TEXT,
    "experienceYears" INTEGER CHECK ("experienceYears" IS NULL OR "experienceYears" >= 0),
    "hourlyRate" INTEGER CHECK ("hourlyRate" IS NULL OR "hourlyRate" >= 0),
    "currency" TEXT NOT NULL DEFAULT 'IRR',
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrainerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "TrainerProfile" ("id", "userId", "bio", "specialty", "experienceYears", "hourlyRate", "currency", "isAvailable", "createdAt", "updatedAt") VALUES ('seed-trainer-profile', 'seed-user-trainer', 'Strength and mobility coach focused on sustainable progress.', 'Strength & Mobility', 8, 8000000, 'IRR', 1, '2026-08-21T15:14:38.191+00:00', '2026-08-21T15:14:38.191+00:00');
INSERT INTO "TrainerProfile" ("id", "userId", "bio", "specialty", "experienceYears", "hourlyRate", "currency", "isAvailable", "createdAt", "updatedAt") VALUES ('seed-pending-trainer-profile', 'seed-user-pending-trainer', 'Functional fitness coach applying to join the gym.', 'Functional Fitness', 4, 5500000, 'IRR', 1, '2026-08-21T15:14:38.196+00:00', '2026-08-21T15:14:38.196+00:00');

CREATE TABLE "TrainerClient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trainerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gymId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING', 'ACTIVE', 'PAUSED', 'REJECTED', 'ENDED')),
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrainerClient_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainerClient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainerClient_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "TrainerClient" ("id", "trainerId", "userId", "gymId", "status", "requestedAt", "startedAt", "endedAt", "createdAt", "updatedAt") VALUES ('seed-trainer-client', 'seed-trainer-profile', 'seed-user-member', 'seed-gym-central', 'ACTIVE', '2026-08-21T15:14:38.307+00:00', '2026-08-21T15:14:38.009+00:00', NULL, '2026-08-21T15:14:38.307+00:00', '2026-08-21T15:14:38.307+00:00');

CREATE TABLE "DietPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trainerId" TEXT NOT NULL,
    "gymId" TEXT,
    "familyId" TEXT NOT NULL,
    "sourcePlanId" TEXT,
    "title" TEXT NOT NULL CHECK (length(trim("title")) BETWEEN 2 AND 120),
    "description" TEXT,
    "dietaryRestrictions" TEXT,
    "dailyCalories" INTEGER CHECK ("dailyCalories" IS NULL OR "dailyCalories" BETWEEN 0 AND 20000),
    "status" TEXT NOT NULL DEFAULT 'DRAFT' CHECK ("status" IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
    "version" INTEGER NOT NULL DEFAULT 1 CHECK ("version" >= 1),
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "legacyMeals" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DietPlan_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DietPlan_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "DietPlan_sourcePlanId_fkey" FOREIGN KEY ("sourcePlanId") REFERENCES "DietPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "DietPlan" ("id", "trainerId", "gymId", "familyId", "sourcePlanId", "title", "description", "dietaryRestrictions", "dailyCalories", "status", "version", "isTemplate", "publishedAt", "legacyMeals", "createdAt", "updatedAt") VALUES ('seed-diet-plan', 'seed-trainer-profile', 'seed-gym-central', 'seed-diet-plan', NULL, 'Balanced Performance', 'Simple nutrition guidance to support training and recovery.', 'Adjust portions for individual energy needs.', 2400, 'ACTIVE', 1, 0, '2026-08-21T15:14:38.009+00:00', '["Breakfast","Lunch","Dinner","Recovery snack"]', '2026-08-21T15:14:38.508+00:00', '2026-08-21T15:14:38.508+00:00');

CREATE TABLE "DietAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trainerClientId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED' CHECK ("status" IN ('ASSIGNED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DietAssignment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "DietPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DietAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DietAssignment_trainerClientId_fkey" FOREIGN KEY ("trainerClientId") REFERENCES "TrainerClient" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "DietAssignment" ("id", "planId", "userId", "trainerClientId", "status", "assignedAt", "startDate", "endDate", "createdAt", "updatedAt") VALUES ('seed-diet-assignment', 'seed-diet-plan', 'seed-user-member', 'seed-trainer-client', 'ACTIVE', '2026-08-21T15:14:38.521+00:00', '2026-08-21T15:14:38.009+00:00', NULL, '2026-08-21T15:14:38.521+00:00', '2026-08-21T15:14:38.521+00:00');

CREATE TABLE "DietDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL CHECK ("dayNumber" BETWEEN 1 AND 365),
    "name" TEXT NOT NULL CHECK (length(trim("name")) BETWEEN 2 AND 100),
    "targetCalories" INTEGER CHECK ("targetCalories" IS NULL OR "targetCalories" BETWEEN 0 AND 20000),
    "targetProtein" REAL CHECK ("targetProtein" IS NULL OR "targetProtein" >= 0),
    "targetCarbs" REAL CHECK ("targetCarbs" IS NULL OR "targetCarbs" >= 0),
    "targetFat" REAL CHECK ("targetFat" IS NULL OR "targetFat" >= 0),
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DietDay_planId_fkey" FOREIGN KEY ("planId") REFERENCES "DietPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "DietDay" ("id", "planId", "dayNumber", "name", "targetCalories", "targetProtein", "targetCarbs", "targetFat", "notes", "createdAt", "updatedAt") VALUES ('cmt33bn710008ugnzkkpjz6qc', 'seed-diet-plan', 1, 'Training Day', 2400, 170, 260, 70, NULL, '2026-08-21T15:14:38.508+00:00', '2026-08-21T15:14:38.508+00:00');

CREATE TABLE "WorkoutPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trainerId" TEXT NOT NULL,
    "gymId" TEXT,
    "familyId" TEXT NOT NULL,
    "sourcePlanId" TEXT,
    "title" TEXT NOT NULL CHECK (length(trim("title")) BETWEEN 2 AND 120),
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT' CHECK ("status" IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
    "version" INTEGER NOT NULL DEFAULT 1 CHECK ("version" >= 1),
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" DATETIME,
    "legacyExercises" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkoutPlan_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkoutPlan_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WorkoutPlan_sourcePlanId_fkey" FOREIGN KEY ("sourcePlanId") REFERENCES "WorkoutPlan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "WorkoutPlan" ("id", "trainerId", "gymId", "familyId", "sourcePlanId", "title", "description", "status", "version", "isTemplate", "publishedAt", "legacyExercises", "createdAt", "updatedAt") VALUES ('seed-workout-plan', 'seed-trainer-profile', 'seed-gym-central', 'seed-workout-plan', NULL, 'Foundation Strength', 'A four-week full-body strength foundation.', 'ACTIVE', 1, 0, '2026-08-21T15:14:38.009+00:00', '["Squat","Bench press","Row"]', '2026-08-21T15:14:38.446+00:00', '2026-08-21T15:14:38.446+00:00');

CREATE TABLE "WorkoutDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL CHECK ("dayNumber" BETWEEN 1 AND 365),
    "name" TEXT NOT NULL CHECK (length(trim("name")) BETWEEN 2 AND 100),
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkoutDay_planId_fkey" FOREIGN KEY ("planId") REFERENCES "WorkoutPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "WorkoutDay" ("id", "planId", "dayNumber", "name", "notes", "createdAt", "updatedAt") VALUES ('cmt33bn5g0000ugnzqhgcxj3g', 'seed-workout-plan', 1, 'Full Body A', 'Controlled tempo and clean technique.', '2026-08-21T15:14:38.446+00:00', '2026-08-21T15:14:38.446+00:00');
INSERT INTO "WorkoutDay" ("id", "planId", "dayNumber", "name", "notes", "createdAt", "updatedAt") VALUES ('cmt33bn5n0004ugnzu8eq7ayk', 'seed-workout-plan', 2, 'Full Body B', NULL, '2026-08-21T15:14:38.446+00:00', '2026-08-21T15:14:38.446+00:00');

CREATE TABLE "WorkoutExercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayId" TEXT NOT NULL,
    "order" INTEGER NOT NULL CHECK ("order" >= 1),
    "name" TEXT NOT NULL CHECK (length(trim("name")) BETWEEN 2 AND 120),
    "sets" INTEGER CHECK ("sets" IS NULL OR "sets" BETWEEN 1 AND 100),
    "reps" TEXT,
    "weight" TEXT,
    "tempo" TEXT,
    "restSeconds" INTEGER CHECK ("restSeconds" IS NULL OR "restSeconds" BETWEEN 0 AND 3600),
    "durationSeconds" INTEGER CHECK ("durationSeconds" IS NULL OR "durationSeconds" > 0),
    "distanceMeters" INTEGER CHECK ("distanceMeters" IS NULL OR "distanceMeters" > 0),
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkoutExercise_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "WorkoutDay" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "WorkoutExercise" ("id", "dayId", "order", "name", "sets", "reps", "weight", "tempo", "restSeconds", "durationSeconds", "distanceMeters", "notes", "createdAt", "updatedAt") VALUES ('cmt33bn5j0001ugnze6ffyp0z', 'cmt33bn5g0000ugnzqhgcxj3g', 1, 'Back Squat', 4, '6–8', NULL, '3-1-1', 120, NULL, NULL, NULL, '2026-08-21T15:14:38.446+00:00', '2026-08-21T15:14:38.446+00:00');
INSERT INTO "WorkoutExercise" ("id", "dayId", "order", "name", "sets", "reps", "weight", "tempo", "restSeconds", "durationSeconds", "distanceMeters", "notes", "createdAt", "updatedAt") VALUES ('cmt33bn5j0002ugnzwwi0ib90', 'cmt33bn5g0000ugnzqhgcxj3g', 2, 'Bench Press', 4, '6–8', NULL, NULL, 90, NULL, NULL, NULL, '2026-08-21T15:14:38.446+00:00', '2026-08-21T15:14:38.446+00:00');
INSERT INTO "WorkoutExercise" ("id", "dayId", "order", "name", "sets", "reps", "weight", "tempo", "restSeconds", "durationSeconds", "distanceMeters", "notes", "createdAt", "updatedAt") VALUES ('cmt33bn5j0003ugnzvr3wj6eo', 'cmt33bn5g0000ugnzqhgcxj3g', 3, 'Cable Row', 3, '10–12', NULL, NULL, 75, NULL, NULL, NULL, '2026-08-21T15:14:38.446+00:00', '2026-08-21T15:14:38.446+00:00');
INSERT INTO "WorkoutExercise" ("id", "dayId", "order", "name", "sets", "reps", "weight", "tempo", "restSeconds", "durationSeconds", "distanceMeters", "notes", "createdAt", "updatedAt") VALUES ('cmt33bn5n0005ugnzgdjyqoax', 'cmt33bn5n0004ugnzu8eq7ayk', 1, 'Romanian Deadlift', 4, '8', NULL, NULL, 120, NULL, NULL, NULL, '2026-08-21T15:14:38.446+00:00', '2026-08-21T15:14:38.446+00:00');
INSERT INTO "WorkoutExercise" ("id", "dayId", "order", "name", "sets", "reps", "weight", "tempo", "restSeconds", "durationSeconds", "distanceMeters", "notes", "createdAt", "updatedAt") VALUES ('cmt33bn5n0006ugnz6awblbu7', 'cmt33bn5n0004ugnzu8eq7ayk', 2, 'Overhead Press', 3, '8–10', NULL, NULL, 90, NULL, NULL, NULL, '2026-08-21T15:14:38.446+00:00', '2026-08-21T15:14:38.446+00:00');
INSERT INTO "WorkoutExercise" ("id", "dayId", "order", "name", "sets", "reps", "weight", "tempo", "restSeconds", "durationSeconds", "distanceMeters", "notes", "createdAt", "updatedAt") VALUES ('cmt33bn5n0007ugnzjqogd6ly', 'cmt33bn5n0004ugnzu8eq7ayk', 3, 'Walking Lunge', 3, '10 / side', NULL, NULL, 75, NULL, NULL, NULL, '2026-08-21T15:14:38.446+00:00', '2026-08-21T15:14:38.446+00:00');

CREATE TABLE "WorkoutAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "planId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trainerClientId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED' CHECK ("status" IN ('ASSIGNED', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkoutAssignment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "WorkoutPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkoutAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkoutAssignment_trainerClientId_fkey" FOREIGN KEY ("trainerClientId") REFERENCES "TrainerClient" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "WorkoutAssignment" ("id", "planId", "userId", "trainerClientId", "status", "assignedAt", "startDate", "endDate", "createdAt", "updatedAt") VALUES ('seed-workout-assignment', 'seed-workout-plan', 'seed-user-member', 'seed-trainer-client', 'ACTIVE', '2026-08-21T15:14:38.477+00:00', '2026-08-21T15:14:38.009+00:00', NULL, '2026-08-21T15:14:38.477+00:00', '2026-08-21T15:14:38.477+00:00');

CREATE TABLE "WorkoutLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assignmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workoutDayId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK ("status" IN ('IN_PROGRESS', 'COMPLETED', 'SKIPPED')),
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "perceivedEffort" INTEGER CHECK ("perceivedEffort" IS NULL OR "perceivedEffort" BETWEEN 1 AND 10),
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkoutLog_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "WorkoutAssignment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkoutLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkoutLog_workoutDayId_fkey" FOREIGN KEY ("workoutDayId") REFERENCES "WorkoutDay" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "WorkoutLog" ("id", "assignmentId", "userId", "workoutDayId", "status", "startedAt", "completedAt", "perceivedEffort", "notes", "createdAt", "updatedAt") VALUES ('seed-workout-log', 'seed-workout-assignment', 'seed-user-member', 'cmt33bn5g0000ugnzqhgcxj3g', 'COMPLETED', '2026-08-20T16:00:00.000+00:00', '2026-08-20T17:00:00.000+00:00', 7, 'Felt strong and controlled throughout the session.', '2026-08-21T15:14:38.541+00:00', '2026-08-21T15:14:38.541+00:00');

CREATE TABLE "ExerciseLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workoutLogId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "actualSets" INTEGER CHECK ("actualSets" IS NULL OR "actualSets" >= 0),
    "actualReps" TEXT,
    "actualWeight" TEXT,
    "actualDurationSeconds" INTEGER CHECK ("actualDurationSeconds" IS NULL OR "actualDurationSeconds" >= 0),
    "actualDistanceMeters" INTEGER CHECK ("actualDistanceMeters" IS NULL OR "actualDistanceMeters" >= 0),
    "rpe" INTEGER CHECK ("rpe" IS NULL OR "rpe" BETWEEN 1 AND 10),
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExerciseLog_workoutLogId_fkey" FOREIGN KEY ("workoutLogId") REFERENCES "WorkoutLog" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExerciseLog_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "WorkoutExercise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "ExerciseLog" ("id", "workoutLogId", "exerciseId", "completed", "actualSets", "actualReps", "actualWeight", "actualDurationSeconds", "actualDistanceMeters", "rpe", "notes", "createdAt", "updatedAt") VALUES ('cmt33bn82000fugnz66khyemk', 'seed-workout-log', 'cmt33bn5j0001ugnze6ffyp0z', 1, 4, '6–8', '70 kg', NULL, NULL, 7, NULL, '2026-08-21T15:14:38.541+00:00', '2026-08-21T15:14:38.541+00:00');
INSERT INTO "ExerciseLog" ("id", "workoutLogId", "exerciseId", "completed", "actualSets", "actualReps", "actualWeight", "actualDurationSeconds", "actualDistanceMeters", "rpe", "notes", "createdAt", "updatedAt") VALUES ('cmt33bn82000gugnzq23yv8g4', 'seed-workout-log', 'cmt33bn5j0002ugnzwwi0ib90', 1, 4, '6–8', NULL, NULL, NULL, 7, NULL, '2026-08-21T15:14:38.541+00:00', '2026-08-21T15:14:38.541+00:00');
INSERT INTO "ExerciseLog" ("id", "workoutLogId", "exerciseId", "completed", "actualSets", "actualReps", "actualWeight", "actualDurationSeconds", "actualDistanceMeters", "rpe", "notes", "createdAt", "updatedAt") VALUES ('cmt33bn82000hugnzpwpt65ua', 'seed-workout-log', 'cmt33bn5j0003ugnzvr3wj6eo', 1, 3, '10–12', NULL, NULL, NULL, 7, NULL, '2026-08-21T15:14:38.541+00:00', '2026-08-21T15:14:38.541+00:00');

CREATE TABLE "NutritionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assignmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dietDayId" TEXT NOT NULL,
    "logDate" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "hungerRating" INTEGER CHECK ("hungerRating" IS NULL OR "hungerRating" BETWEEN 1 AND 10),
    "energyRating" INTEGER CHECK ("energyRating" IS NULL OR "energyRating" BETWEEN 1 AND 10),
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "NutritionLog_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "DietAssignment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NutritionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NutritionLog_dietDayId_fkey" FOREIGN KEY ("dietDayId") REFERENCES "DietDay" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "NutritionLog" ("id", "assignmentId", "userId", "dietDayId", "logDate", "completedAt", "hungerRating", "energyRating", "notes", "createdAt", "updatedAt") VALUES ('seed-nutrition-log', 'seed-diet-assignment', 'seed-user-member', 'cmt33bn710008ugnzkkpjz6qc', '2026-08-20T00:00:00.000+00:00', '2026-08-20T17:00:00.000+00:00', 4, 8, 'Good energy through the afternoon workout.', '2026-08-21T15:14:38.560+00:00', '2026-08-21T15:14:38.560+00:00');

CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "trainerClientId" TEXT,
    "workoutAssignmentId" TEXT,
    "dietAssignmentId" TEXT,
    "workoutLogId" TEXT,
    "nutritionLogId" TEXT,
    "parentId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'GENERAL' CHECK ("type" IN ('GENERAL', 'WORKOUT', 'DIET', 'PROGRESS')),
    "content" TEXT NOT NULL CHECK (length(trim("content")) > 0),
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Feedback_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Feedback_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Feedback_trainerClientId_fkey" FOREIGN KEY ("trainerClientId") REFERENCES "TrainerClient" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Feedback_workoutAssignmentId_fkey" FOREIGN KEY ("workoutAssignmentId") REFERENCES "WorkoutAssignment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Feedback_dietAssignmentId_fkey" FOREIGN KEY ("dietAssignmentId") REFERENCES "DietAssignment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Feedback_workoutLogId_fkey" FOREIGN KEY ("workoutLogId") REFERENCES "WorkoutLog" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Feedback_nutritionLogId_fkey" FOREIGN KEY ("nutritionLogId") REFERENCES "NutritionLog" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Feedback_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Feedback" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "Feedback" ("id", "authorId", "recipientId", "trainerClientId", "workoutAssignmentId", "dietAssignmentId", "workoutLogId", "nutritionLogId", "parentId", "type", "content", "readAt", "createdAt", "updatedAt") VALUES ('seed-feedback', 'seed-user-trainer', 'seed-user-member', 'seed-trainer-client', 'seed-workout-assignment', NULL, 'seed-workout-log', NULL, NULL, 'WORKOUT', 'Strong first week. Keep the tempo controlled on every squat.', NULL, '2026-08-21T15:14:38.601+00:00', '2026-08-21T15:14:38.601+00:00');

CREATE TABLE "Meal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayId" TEXT NOT NULL,
    "order" INTEGER NOT NULL CHECK ("order" >= 1),
    "name" TEXT NOT NULL CHECK (length(trim("name")) BETWEEN 2 AND 100),
    "scheduledTime" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Meal_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "DietDay" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "Meal" ("id", "dayId", "order", "name", "scheduledTime", "notes", "createdAt", "updatedAt") VALUES ('cmt33bn710009ugnzfsppanyz', 'cmt33bn710008ugnzkkpjz6qc', 1, 'Breakfast', '08:00', NULL, '2026-08-21T15:14:38.508+00:00', '2026-08-21T15:14:38.508+00:00');
INSERT INTO "Meal" ("id", "dayId", "order", "name", "scheduledTime", "notes", "createdAt", "updatedAt") VALUES ('cmt33bn72000cugnz23hbphtw', 'cmt33bn710008ugnzkkpjz6qc', 2, 'Lunch', '13:00', NULL, '2026-08-21T15:14:38.508+00:00', '2026-08-21T15:14:38.508+00:00');

CREATE TABLE "FoodItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mealId" TEXT NOT NULL,
    "order" INTEGER NOT NULL CHECK ("order" >= 1),
    "name" TEXT NOT NULL CHECK (length(trim("name")) BETWEEN 1 AND 120),
    "quantity" REAL CHECK ("quantity" IS NULL OR "quantity" >= 0),
    "unit" TEXT,
    "calories" INTEGER CHECK ("calories" IS NULL OR "calories" >= 0),
    "protein" REAL CHECK ("protein" IS NULL OR "protein" >= 0),
    "carbs" REAL CHECK ("carbs" IS NULL OR "carbs" >= 0),
    "fat" REAL CHECK ("fat" IS NULL OR "fat" >= 0),
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FoodItem_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "FoodItem" ("id", "mealId", "order", "name", "quantity", "unit", "calories", "protein", "carbs", "fat", "notes", "createdAt", "updatedAt") VALUES ('cmt33bn72000augnzqq302vtw', 'cmt33bn710009ugnzfsppanyz', 1, 'Oats', 80, 'g', 310, 10, 53, 6, NULL, '2026-08-21T15:14:38.508+00:00', '2026-08-21T15:14:38.508+00:00');
INSERT INTO "FoodItem" ("id", "mealId", "order", "name", "quantity", "unit", "calories", "protein", "carbs", "fat", "notes", "createdAt", "updatedAt") VALUES ('cmt33bn72000bugnzq0mnbhod', 'cmt33bn710009ugnzfsppanyz', 2, 'Greek Yogurt', 200, 'g', 140, 20, 8, 2, NULL, '2026-08-21T15:14:38.508+00:00', '2026-08-21T15:14:38.508+00:00');
INSERT INTO "FoodItem" ("id", "mealId", "order", "name", "quantity", "unit", "calories", "protein", "carbs", "fat", "notes", "createdAt", "updatedAt") VALUES ('cmt33bn72000dugnzrjkjf4ks', 'cmt33bn72000cugnz23hbphtw', 1, 'Grilled Chicken', 180, 'g', 300, 55, 0, 7, NULL, '2026-08-21T15:14:38.508+00:00', '2026-08-21T15:14:38.508+00:00');
INSERT INTO "FoodItem" ("id", "mealId", "order", "name", "quantity", "unit", "calories", "protein", "carbs", "fat", "notes", "createdAt", "updatedAt") VALUES ('cmt33bn73000eugnzyu8n7qz9', 'cmt33bn72000cugnz23hbphtw', 2, 'Cooked Rice', 250, 'g', 325, 6, 70, 1, NULL, '2026-08-21T15:14:38.508+00:00', '2026-08-21T15:14:38.508+00:00');

CREATE TABLE "GymMembership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gymId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'EXPIRED', 'CANCELLED')),
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    "reviewedById" TEXT,
    "startedAt" DATETIME,
    "expiresAt" DATETIME,
    "endedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GymMembership_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GymMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GymMembership_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "GymMembership" ("id", "gymId", "userId", "status", "requestedAt", "reviewedAt", "reviewedById", "startedAt", "expiresAt", "endedAt", "createdAt", "updatedAt") VALUES ('seed-gym-membership', 'seed-gym-central', 'seed-user-member', 'ACTIVE', '2026-08-21T15:14:38.285+00:00', '2026-08-21T15:14:38.009+00:00', 'seed-user-admin', '2026-08-21T15:14:38.009+00:00', '2026-09-20T15:14:38.009+00:00', NULL, '2026-08-21T15:14:38.285+00:00', '2026-08-21T15:14:38.285+00:00');
INSERT INTO "GymMembership" ("id", "gymId", "userId", "status", "requestedAt", "reviewedAt", "reviewedById", "startedAt", "expiresAt", "endedAt", "createdAt", "updatedAt") VALUES ('seed-pending-gym-membership', 'seed-gym-central', 'seed-user-pending-member', 'PENDING', '2026-08-21T15:14:38.298+00:00', NULL, NULL, NULL, NULL, NULL, '2026-08-21T15:14:38.298+00:00', '2026-08-21T15:14:38.298+00:00');

CREATE TABLE "GymReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "score" INTEGER NOT NULL CHECK ("score" BETWEEN 1 AND 5),
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL, "verified" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "GymReview_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GymReview_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "GymReview" ("id", "authorId", "gymId", "score", "comment", "createdAt", "updatedAt", "verified") VALUES ('seed-gym-review', 'seed-user-member', 'seed-gym-central', 5, 'Clean space, helpful staff, and excellent equipment.', '2026-08-21T15:14:38.606+00:00', '2026-08-21T15:14:38.606+00:00', 1);

CREATE TABLE "GymStaff" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gymId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MANAGER' CHECK ("role" IN ('OWNER', 'MANAGER')),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE' CHECK ("status" IN ('PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'EXPIRED', 'CANCELLED')),
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GymStaff_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GymStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "GymStaff" ("id", "gymId", "userId", "role", "status", "joinedAt", "createdAt", "updatedAt") VALUES ('seed-gym-owner', 'seed-gym-central', 'seed-user-admin', 'OWNER', 'ACTIVE', '2026-08-21T15:14:38.242+00:00', '2026-08-21T15:14:38.242+00:00', '2026-08-21T15:14:38.242+00:00');
INSERT INTO "GymStaff" ("id", "gymId", "userId", "role", "status", "joinedAt", "createdAt", "updatedAt") VALUES ('seed-gym-atlas-owner', 'seed-gym-atlas', 'seed-user-admin', 'OWNER', 'ACTIVE', '2026-08-21T15:14:38.258+00:00', '2026-08-21T15:14:38.258+00:00', '2026-08-21T15:14:38.258+00:00');

CREATE TABLE "GymTrainer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gymId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED', 'EXPIRED', 'CANCELLED')),
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    "reviewedById" TEXT,
    "startedAt" DATETIME,
    "endedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GymTrainer_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GymTrainer_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GymTrainer_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "GymTrainer" ("id", "gymId", "trainerId", "status", "requestedAt", "reviewedAt", "reviewedById", "startedAt", "endedAt", "createdAt", "updatedAt") VALUES ('seed-gym-trainer', 'seed-gym-central', 'seed-trainer-profile', 'ACTIVE', '2026-08-21T15:14:38.263+00:00', '2026-08-21T15:14:38.009+00:00', 'seed-user-admin', '2026-08-21T15:14:38.009+00:00', NULL, '2026-08-21T15:14:38.263+00:00', '2026-08-21T15:14:38.263+00:00');
INSERT INTO "GymTrainer" ("id", "gymId", "trainerId", "status", "requestedAt", "reviewedAt", "reviewedById", "startedAt", "endedAt", "createdAt", "updatedAt") VALUES ('seed-pending-gym-trainer', 'seed-gym-central', 'seed-pending-trainer-profile', 'PENDING', '2026-08-21T15:14:38.268+00:00', NULL, NULL, NULL, NULL, '2026-08-21T15:14:38.268+00:00', '2026-08-21T15:14:38.268+00:00');
INSERT INTO "GymTrainer" ("id", "gymId", "trainerId", "status", "requestedAt", "reviewedAt", "reviewedById", "startedAt", "endedAt", "createdAt", "updatedAt") VALUES ('seed-atlas-gym-trainer', 'seed-gym-atlas', 'seed-pending-trainer-profile', 'ACTIVE', '2026-08-21T15:14:38.278+00:00', '2026-08-21T15:14:38.009+00:00', 'seed-user-admin', '2026-08-21T15:14:38.009+00:00', NULL, '2026-08-21T15:14:38.278+00:00', '2026-08-21T15:14:38.278+00:00');

CREATE TABLE "MealLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nutritionLogId" TEXT NOT NULL,
    "mealId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "actualPortion" TEXT,
    "substitution" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MealLog_nutritionLogId_fkey" FOREIGN KEY ("nutritionLogId") REFERENCES "NutritionLog" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MealLog_mealId_fkey" FOREIGN KEY ("mealId") REFERENCES "Meal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "MealLog" ("id", "nutritionLogId", "mealId", "completed", "actualPortion", "substitution", "notes", "createdAt", "updatedAt") VALUES ('cmt33bn8k000iugnzpkwqar9k', 'seed-nutrition-log', 'cmt33bn710009ugnzfsppanyz', 1, 'As prescribed', NULL, NULL, '2026-08-21T15:14:38.560+00:00', '2026-08-21T15:14:38.560+00:00');
INSERT INTO "MealLog" ("id", "nutritionLogId", "mealId", "completed", "actualPortion", "substitution", "notes", "createdAt", "updatedAt") VALUES ('cmt33bn8l000jugnzkagzg30a', 'seed-nutrition-log', 'cmt33bn72000cugnz23hbphtw', 1, 'As prescribed', NULL, NULL, '2026-08-21T15:14:38.560+00:00', '2026-08-21T15:14:38.560+00:00');

CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GENERAL' CHECK ("type" IN ('PLAN_ASSIGNED', 'FEEDBACK', 'SESSION_REMINDER', 'SUBSCRIPTION_EXPIRING', 'GENERAL')),
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "href" TEXT,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "Notification" ("id", "userId", "type", "title", "message", "href", "readAt", "createdAt") VALUES ('seed-notification-plan', 'seed-user-member', 'PLAN_ASSIGNED', 'Your plans are ready', 'Sara assigned your workout and nutrition plans.', '/user/workouts', NULL, '2026-08-21T15:14:38.598+00:00');

CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gymId" TEXT NOT NULL,
    "name" TEXT NOT NULL CHECK (length(trim("name")) >= 2),
    "description" TEXT,
    "audience" TEXT NOT NULL DEFAULT 'MEMBER' CHECK ("audience" IN ('MEMBER', 'TRAINER')),
    "price" INTEGER NOT NULL CHECK ("price" >= 0),
    "currency" TEXT NOT NULL DEFAULT 'IRR',
    "durationDays" INTEGER NOT NULL CHECK ("durationDays" > 0),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SubscriptionPlan_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "SubscriptionPlan" ("id", "gymId", "name", "description", "audience", "price", "currency", "durationDays", "isActive", "createdAt", "updatedAt") VALUES ('seed-plan-member-monthly', 'seed-gym-central', 'Monthly Member', 'Full gym access for thirty days.', 'MEMBER', 15000000, 'IRR', 30, 1, '2026-08-21T15:14:38.350+00:00', '2026-08-21T15:14:38.350+00:00');
INSERT INTO "SubscriptionPlan" ("id", "gymId", "name", "description", "audience", "price", "currency", "durationDays", "isActive", "createdAt", "updatedAt") VALUES ('seed-plan-atlas-member', 'seed-gym-atlas', 'Atlas Monthly', 'Open-gym access and community classes for thirty days.', 'MEMBER', 12000000, 'IRR', 30, 1, '2026-08-21T15:14:38.354+00:00', '2026-08-21T15:14:38.354+00:00');
INSERT INTO "SubscriptionPlan" ("id", "gymId", "name", "description", "audience", "price", "currency", "durationDays", "isActive", "createdAt", "updatedAt") VALUES ('seed-plan-trainer-monthly', 'seed-gym-central', 'Monthly Trainer', 'Trainer floor access and client management for thirty days.', 'TRAINER', 25000000, 'IRR', 30, 1, '2026-08-21T15:14:38.358+00:00', '2026-08-21T15:14:38.358+00:00');

CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriberId" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING', 'ACTIVE', 'PAST_DUE', 'EXPIRED', 'CANCELLED')),
    "pricePaid" INTEGER NOT NULL CHECK ("pricePaid" >= 0),
    "currency" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL CHECK ("endDate" > "startDate"),
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Subscription_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Subscription_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "Subscription" ("id", "subscriberId", "gymId", "planId", "status", "pricePaid", "currency", "startDate", "endDate", "autoRenew", "cancelledAt", "createdAt", "updatedAt") VALUES ('seed-subscription-member', 'seed-user-member', 'seed-gym-central', 'seed-plan-member-monthly', 'ACTIVE', 15000000, 'IRR', '2026-08-21T15:14:38.009+00:00', '2026-09-20T15:14:38.009+00:00', 0, NULL, '2026-08-21T15:14:38.369+00:00', '2026-08-21T15:14:38.369+00:00');
INSERT INTO "Subscription" ("id", "subscriberId", "gymId", "planId", "status", "pricePaid", "currency", "startDate", "endDate", "autoRenew", "cancelledAt", "createdAt", "updatedAt") VALUES ('seed-subscription-trainer', 'seed-user-trainer', 'seed-gym-central', 'seed-plan-trainer-monthly', 'ACTIVE', 25000000, 'IRR', '2026-08-21T15:14:38.009+00:00', '2026-09-20T15:14:38.009+00:00', 0, NULL, '2026-08-21T15:14:38.382+00:00', '2026-08-21T15:14:38.382+00:00');

CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SUBSCRIPTION' CHECK ("type" IN ('SUBSCRIPTION', 'RENEWAL')),
    "status" TEXT NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'CANCELLED')),
    "amount" INTEGER NOT NULL CHECK ("amount" >= 0),
    "currency" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerReference" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "checkoutTokenHash" TEXT,
    "failureCode" TEXT,
    "failureMessage" TEXT,
    "paidAt" DATETIME,
    "refundedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "Payment" ("id", "userId", "gymId", "planId", "subscriptionId", "type", "status", "amount", "currency", "provider", "providerReference", "idempotencyKey", "checkoutTokenHash", "failureCode", "failureMessage", "paidAt", "refundedAt", "createdAt", "updatedAt") VALUES ('seed-payment-member', 'seed-user-member', 'seed-gym-central', 'seed-plan-member-monthly', 'seed-subscription-member', 'SUBSCRIPTION', 'SUCCEEDED', 15000000, 'IRR', 'demo', 'demo_seed_payment', 'seed-member-subscription-payment', NULL, NULL, NULL, '2026-08-21T15:14:38.009+00:00', NULL, '2026-08-21T15:14:38.398+00:00', '2026-08-21T15:14:38.398+00:00');

CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentId" TEXT,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL CHECK ("status" IN ('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED')),
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "ProgressPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "measurementId" TEXT,
    "imageUrl" TEXT NOT NULL CHECK (length(trim("imageUrl")) > 0),
    "pose" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProgressPhoto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProgressPhoto_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "BodyMeasurement" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "ProgressPhoto" ("id", "userId", "measurementId", "imageUrl", "pose", "createdAt") VALUES ('seed-progress-photo', 'seed-user-member', 'seed-measurement-start', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e', 'Front', '2026-08-21T15:14:38.592+00:00');

CREATE TABLE "TrainerAvailability" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trainerId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL CHECK ("dayOfWeek" BETWEEN 0 AND 6),
    "startMinutes" INTEGER NOT NULL CHECK ("startMinutes" BETWEEN 0 AND 1439),
    "endMinutes" INTEGER NOT NULL CHECK ("endMinutes" BETWEEN 1 AND 1440 AND "endMinutes" > "startMinutes"),
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Tehran',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrainerAvailability_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "TrainerAvailability" ("id", "trainerId", "dayOfWeek", "startMinutes", "endMinutes", "timezone", "isActive", "createdAt", "updatedAt") VALUES ('seed-availability-monday', 'seed-trainer-profile', 1, 540, 780, 'Asia/Tehran', 1, '2026-08-21T15:14:38.312+00:00', '2026-08-21T15:14:38.312+00:00');
INSERT INTO "TrainerAvailability" ("id", "trainerId", "dayOfWeek", "startMinutes", "endMinutes", "timezone", "isActive", "createdAt", "updatedAt") VALUES ('seed-availability-wednesday', 'seed-trainer-profile', 3, 540, 780, 'Asia/Tehran', 1, '2026-08-21T15:14:38.319+00:00', '2026-08-21T15:14:38.319+00:00');
INSERT INTO "TrainerAvailability" ("id", "trainerId", "dayOfWeek", "startMinutes", "endMinutes", "timezone", "isActive", "createdAt", "updatedAt") VALUES ('seed-availability-friday', 'seed-trainer-profile', 5, 600, 840, 'Asia/Tehran', 1, '2026-08-21T15:14:38.322+00:00', '2026-08-21T15:14:38.322+00:00');

CREATE TABLE "TrainerReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "score" INTEGER NOT NULL CHECK ("score" BETWEEN 1 AND 5),
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL, "verified" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "TrainerReview_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainerReview_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "TrainerReview" ("id", "authorId", "trainerId", "score", "comment", "createdAt", "updatedAt", "verified") VALUES ('seed-trainer-review', 'seed-user-member', 'seed-trainer-profile', 5, 'Clear coaching and a plan that feels achievable.', '2026-08-21T15:14:38.609+00:00', '2026-08-21T15:14:38.609+00:00', 1);

CREATE TABLE "TrainingSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trainerId" TEXT NOT NULL,
    "trainerClientId" TEXT NOT NULL,
    "gymId" TEXT,
    "title" TEXT NOT NULL CHECK (length(trim("title")) BETWEEN 2 AND 100),
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL CHECK ("endsAt" > "startsAt"),
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK ("status" IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrainingSession_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingSession_trainerClientId_fkey" FOREIGN KEY ("trainerClientId") REFERENCES "TrainerClient" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingSession_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "TrainingSession" ("id", "trainerId", "trainerClientId", "gymId", "title", "startsAt", "endsAt", "status", "notes", "createdAt", "updatedAt") VALUES ('seed-session-upcoming', 'seed-trainer-profile', 'seed-trainer-client', 'seed-gym-central', 'Strength Fundamentals', '2026-08-22T10:30:00.000+00:00', '2026-08-22T11:30:00.000+00:00', 'SCHEDULED', 'Focus on squat depth and controlled tempo.', '2026-08-21T15:14:38.341+00:00', '2026-08-21T15:14:38.341+00:00');
INSERT INTO "TrainingSession" ("id", "trainerId", "trainerClientId", "gymId", "title", "startsAt", "endsAt", "status", "notes", "createdAt", "updatedAt") VALUES ('seed-session-completed', 'seed-trainer-profile', 'seed-trainer-client', 'seed-gym-central', 'Mobility & Recovery', '2026-08-20T16:00:00.000+00:00', '2026-08-20T17:00:00.000+00:00', 'COMPLETED', 'Hip mobility improved from last week.', '2026-08-21T15:14:38.345+00:00', '2026-08-21T15:14:38.345+00:00');

CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_gymId_createdAt_idx" ON "AuditLog"("gymId", "createdAt");
CREATE INDEX "BodyMeasurement_userId_recordedAt_idx" ON "BodyMeasurement"("userId", "recordedAt");
CREATE UNIQUE INDEX "DietAssignment_planId_userId_key" ON "DietAssignment"("planId", "userId");
CREATE INDEX "DietAssignment_trainerClientId_idx" ON "DietAssignment"("trainerClientId");
CREATE INDEX "DietAssignment_userId_status_idx" ON "DietAssignment"("userId", "status");
CREATE UNIQUE INDEX "DietDay_planId_dayNumber_key" ON "DietDay"("planId", "dayNumber");
CREATE INDEX "DietDay_planId_idx" ON "DietDay"("planId");
CREATE UNIQUE INDEX "DietPlan_familyId_version_key" ON "DietPlan"("familyId", "version");
CREATE INDEX "DietPlan_gymId_idx" ON "DietPlan"("gymId");
CREATE INDEX "DietPlan_sourcePlanId_idx" ON "DietPlan"("sourcePlanId");
CREATE INDEX "DietPlan_trainerId_status_idx" ON "DietPlan"("trainerId", "status");
CREATE INDEX "ExerciseLog_exerciseId_idx" ON "ExerciseLog"("exerciseId");
CREATE UNIQUE INDEX "ExerciseLog_workoutLogId_exerciseId_key" ON "ExerciseLog"("workoutLogId", "exerciseId");
CREATE INDEX "Feedback_authorId_createdAt_idx" ON "Feedback"("authorId", "createdAt");
CREATE INDEX "Feedback_dietAssignmentId_idx" ON "Feedback"("dietAssignmentId");
CREATE INDEX "Feedback_nutritionLogId_idx" ON "Feedback"("nutritionLogId");
CREATE INDEX "Feedback_parentId_idx" ON "Feedback"("parentId");
CREATE INDEX "Feedback_recipientId_createdAt_idx" ON "Feedback"("recipientId", "createdAt");
CREATE INDEX "Feedback_trainerClientId_idx" ON "Feedback"("trainerClientId");
CREATE INDEX "Feedback_workoutAssignmentId_idx" ON "Feedback"("workoutAssignmentId");
CREATE INDEX "Feedback_workoutLogId_idx" ON "Feedback"("workoutLogId");
CREATE INDEX "FoodItem_mealId_idx" ON "FoodItem"("mealId");
CREATE UNIQUE INDEX "FoodItem_mealId_order_key" ON "FoodItem"("mealId", "order");
CREATE INDEX "GymMembership_expiresAt_idx" ON "GymMembership"("expiresAt");
CREATE INDEX "GymMembership_gymId_status_idx" ON "GymMembership"("gymId", "status");
CREATE UNIQUE INDEX "GymMembership_gymId_userId_key" ON "GymMembership"("gymId", "userId");
CREATE INDEX "GymMembership_reviewedById_idx" ON "GymMembership"("reviewedById");
CREATE INDEX "GymMembership_userId_status_idx" ON "GymMembership"("userId", "status");
CREATE UNIQUE INDEX "GymReview_authorId_gymId_key" ON "GymReview"("authorId", "gymId");
CREATE INDEX "GymReview_gymId_score_idx" ON "GymReview"("gymId", "score");
CREATE INDEX "GymStaff_gymId_status_idx" ON "GymStaff"("gymId", "status");
CREATE UNIQUE INDEX "GymStaff_gymId_userId_key" ON "GymStaff"("gymId", "userId");
CREATE INDEX "GymStaff_userId_status_idx" ON "GymStaff"("userId", "status");
CREATE INDEX "GymTrainer_gymId_status_idx" ON "GymTrainer"("gymId", "status");
CREATE UNIQUE INDEX "GymTrainer_gymId_trainerId_key" ON "GymTrainer"("gymId", "trainerId");
CREATE INDEX "GymTrainer_reviewedById_idx" ON "GymTrainer"("reviewedById");
CREATE INDEX "GymTrainer_trainerId_status_idx" ON "GymTrainer"("trainerId", "status");
CREATE INDEX "Gym_createdAt_idx" ON "Gym"("createdAt");
CREATE UNIQUE INDEX "Gym_slug_key" ON "Gym"("slug");
CREATE INDEX "Gym_status_city_idx" ON "Gym"("status", "city");
CREATE INDEX "MealLog_mealId_idx" ON "MealLog"("mealId");
CREATE UNIQUE INDEX "MealLog_nutritionLogId_mealId_key" ON "MealLog"("nutritionLogId", "mealId");
CREATE INDEX "Meal_dayId_idx" ON "Meal"("dayId");
CREATE UNIQUE INDEX "Meal_dayId_order_key" ON "Meal"("dayId", "order");
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");
CREATE UNIQUE INDEX "NutritionLog_assignmentId_dietDayId_logDate_key" ON "NutritionLog"("assignmentId", "dietDayId", "logDate");
CREATE INDEX "NutritionLog_userId_logDate_idx" ON "NutritionLog"("userId", "logDate");
CREATE UNIQUE INDEX "PaymentEvent_eventId_key" ON "PaymentEvent"("eventId");
CREATE INDEX "PaymentEvent_paymentId_createdAt_idx" ON "PaymentEvent"("paymentId", "createdAt");
CREATE INDEX "PaymentEvent_provider_status_idx" ON "PaymentEvent"("provider", "status");
CREATE INDEX "Payment_gymId_status_createdAt_idx" ON "Payment"("gymId", "status", "createdAt");
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");
CREATE UNIQUE INDEX "Payment_providerReference_key" ON "Payment"("providerReference");
CREATE INDEX "Payment_subscriptionId_idx" ON "Payment"("subscriptionId");
CREATE INDEX "Payment_userId_status_createdAt_idx" ON "Payment"("userId", "status", "createdAt");
CREATE INDEX "ProgressPhoto_measurementId_idx" ON "ProgressPhoto"("measurementId");
CREATE INDEX "ProgressPhoto_userId_createdAt_idx" ON "ProgressPhoto"("userId", "createdAt");
CREATE INDEX "SubscriptionPlan_gymId_audience_isActive_idx" ON "SubscriptionPlan"("gymId", "audience", "isActive");
CREATE UNIQUE INDEX "SubscriptionPlan_gymId_name_audience_key" ON "SubscriptionPlan"("gymId", "name", "audience");
CREATE INDEX "Subscription_endDate_status_idx" ON "Subscription"("endDate", "status");
CREATE INDEX "Subscription_gymId_status_idx" ON "Subscription"("gymId", "status");
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");
CREATE INDEX "Subscription_subscriberId_status_idx" ON "Subscription"("subscriberId", "status");
CREATE INDEX "TrainerAvailability_trainerId_dayOfWeek_isActive_idx" ON "TrainerAvailability"("trainerId", "dayOfWeek", "isActive");
CREATE UNIQUE INDEX "TrainerAvailability_trainerId_dayOfWeek_startMinutes_endMinutes_key" ON "TrainerAvailability"("trainerId", "dayOfWeek", "startMinutes", "endMinutes");
CREATE INDEX "TrainerClient_gymId_idx" ON "TrainerClient"("gymId");
CREATE INDEX "TrainerClient_trainerId_status_idx" ON "TrainerClient"("trainerId", "status");
CREATE UNIQUE INDEX "TrainerClient_trainerId_userId_key" ON "TrainerClient"("trainerId", "userId");
CREATE INDEX "TrainerClient_userId_status_idx" ON "TrainerClient"("userId", "status");
CREATE INDEX "TrainerProfile_isAvailable_specialty_idx" ON "TrainerProfile"("isAvailable", "specialty");
CREATE UNIQUE INDEX "TrainerProfile_userId_key" ON "TrainerProfile"("userId");
CREATE UNIQUE INDEX "TrainerReview_authorId_trainerId_key" ON "TrainerReview"("authorId", "trainerId");
CREATE INDEX "TrainerReview_trainerId_score_idx" ON "TrainerReview"("trainerId", "score");
CREATE INDEX "TrainingSession_gymId_startsAt_idx" ON "TrainingSession"("gymId", "startsAt");
CREATE INDEX "TrainingSession_trainerClientId_startsAt_idx" ON "TrainingSession"("trainerClientId", "startsAt");
CREATE INDEX "TrainingSession_trainerId_startsAt_status_idx" ON "TrainingSession"("trainerId", "startsAt", "status");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");
CREATE UNIQUE INDEX "WorkoutAssignment_planId_userId_key" ON "WorkoutAssignment"("planId", "userId");
CREATE INDEX "WorkoutAssignment_trainerClientId_idx" ON "WorkoutAssignment"("trainerClientId");
CREATE INDEX "WorkoutAssignment_userId_status_idx" ON "WorkoutAssignment"("userId", "status");
CREATE UNIQUE INDEX "WorkoutDay_planId_dayNumber_key" ON "WorkoutDay"("planId", "dayNumber");
CREATE INDEX "WorkoutDay_planId_idx" ON "WorkoutDay"("planId");
CREATE INDEX "WorkoutExercise_dayId_idx" ON "WorkoutExercise"("dayId");
CREATE UNIQUE INDEX "WorkoutExercise_dayId_order_key" ON "WorkoutExercise"("dayId", "order");
CREATE INDEX "WorkoutLog_assignmentId_status_idx" ON "WorkoutLog"("assignmentId", "status");
CREATE INDEX "WorkoutLog_userId_startedAt_idx" ON "WorkoutLog"("userId", "startedAt");
CREATE INDEX "WorkoutLog_workoutDayId_idx" ON "WorkoutLog"("workoutDayId");
CREATE UNIQUE INDEX "WorkoutPlan_familyId_version_key" ON "WorkoutPlan"("familyId", "version");
CREATE INDEX "WorkoutPlan_gymId_idx" ON "WorkoutPlan"("gymId");
CREATE INDEX "WorkoutPlan_sourcePlanId_idx" ON "WorkoutPlan"("sourcePlanId");
CREATE INDEX "WorkoutPlan_trainerId_status_idx" ON "WorkoutPlan"("trainerId", "status");

PRAGMA foreign_keys = ON;
-- === SARA EXTENDED PROGRAMS & NIMA 6-MONTH JOURNEY ===
-- Generated at 2026-09-16T00:49:22.879Z
-- For trainer Sara (seed-trainer-profile) and member Nima (seed-user-member)

PRAGMA foreign_keys = OFF;

-- Update Nima's TrainerClient to 6 months ago
UPDATE "TrainerClient" SET "startedAt" = '2026-03-16T00:49:22.879Z', "status" = 'ACTIVE' WHERE "id" = 'seed-trainer-client';

-- New Users
INSERT OR REPLACE INTO "User" ("id", "name", "email", "password", "role", "status", "createdAt", "updatedAt") VALUES
('seed-user-sahar', 'Sahar Student', 'sahar.student@koogymaa.test', '$2b$12$li2KyHzGXeDmtxXgQ4N/lejAdsX7eMGY.lJWbHXeb5IxfAMXIf/oO', 'USER', 'ACTIVE', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('seed-user-reza', 'Reza Student', 'reza.student@koogymaa.test', '$2b$12$li2KyHzGXeDmtxXgQ4N/lejAdsX7eMGY.lJWbHXeb5IxfAMXIf/oO', 'USER', 'ACTIVE', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('seed-user-parisa', 'Parisa Student', 'parisa.student@koogymaa.test', '$2b$12$li2KyHzGXeDmtxXgQ4N/lejAdsX7eMGY.lJWbHXeb5IxfAMXIf/oO', 'USER', 'ACTIVE', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z');

-- Gym Memberships for new students
INSERT OR REPLACE INTO "GymMembership" ("id", "gymId", "userId", "status", "requestedAt", "reviewedAt", "reviewedById", "startedAt", "expiresAt", "createdAt", "updatedAt") VALUES
('gym-membership-seed-user-sahar', 'seed-gym-central', 'seed-user-sahar', 'ACTIVE', '2026-05-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', 'seed-user-trainer', '2026-05-16T00:49:22.879Z', '2026-10-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('gym-membership-seed-user-reza', 'seed-gym-central', 'seed-user-reza', 'ACTIVE', '2026-06-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', 'seed-user-trainer', '2026-06-16T00:49:22.879Z', '2026-10-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('gym-membership-seed-user-parisa', 'seed-gym-central', 'seed-user-parisa', 'ACTIVE', '2026-08-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', 'seed-user-trainer', '2026-08-16T00:49:22.879Z', '2026-10-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('gym-membership-seed-user-pending-member', 'seed-gym-central', 'seed-user-pending-member', 'ACTIVE', '2026-07-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', 'seed-user-trainer', '2026-07-16T00:49:22.879Z', '2026-10-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z');

-- Trainer Clients
INSERT OR REPLACE INTO "TrainerClient" ("id", "trainerId", "userId", "gymId", "status", "requestedAt", "startedAt", "createdAt", "updatedAt") VALUES
('seed-trainer-client-sahar', 'seed-trainer-profile', 'seed-user-sahar', 'seed-gym-central', 'ACTIVE', '2026-05-16T00:49:22.879Z', '2026-05-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('seed-trainer-client-reza', 'seed-trainer-profile', 'seed-user-reza', 'seed-gym-central', 'ACTIVE', '2026-06-16T00:49:22.879Z', '2026-06-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('seed-trainer-client-parisa', 'seed-trainer-profile', 'seed-user-parisa', 'seed-gym-central', 'ACTIVE', '2026-08-16T00:49:22.879Z', '2026-08-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('seed-trainer-client-arman', 'seed-trainer-profile', 'seed-user-pending-member', 'seed-gym-central', 'ACTIVE', '2026-07-16T00:49:22.879Z', '2026-07-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z');

-- Workout Plans for Sara
INSERT OR REPLACE INTO "WorkoutPlan" ("id", "trainerId", "gymId", "familyId", "title", "description", "status", "version", "isTemplate", "publishedAt", "legacyExercises", "createdAt", "updatedAt") VALUES
('sara-wp-hypertrophy', 'seed-trainer-profile', 'seed-gym-central', 'sara-wp-hypertrophy', 'حجم عضلانی - هایپرتروفی ۴ روزه', 'برنامه ۴ روزه تخصصی افزایش حجم عضلانی با تمرکز بر فشار مکانیکی. مناسب برای نیما، رضا، آرمان.', 'ACTIVE', 1, 0, '2026-09-16T00:49:22.879Z', '["پرس سینه", "اسکوات", "بارفیکس"]', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-fatloss-hiit', 'seed-trainer-profile', 'seed-gym-central', 'sara-wp-fatloss-hiit', 'چربی سوزی و کاندیشننگ - HIIT', 'برنامه ۳ روزه HIIT و قدرتی برای چربی سوزی. مناسب برای سحر، پریسا، نیما.', 'ACTIVE', 1, 0, '2026-09-16T00:49:22.879Z', '["برپی", "اسکوات پرشی", "طناب زنی"]', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-strength-l2', 'seed-trainer-profile', 'seed-gym-central', 'sara-wp-strength-l2', 'قدرت پایه پیشرفته - سطح ۲', 'ادامه Foundation Strength برای افزایش قدرت. مناسب برای نیما و رضا.', 'ACTIVE', 1, 0, '2026-09-16T00:49:22.879Z', '["Back Squat", "Bench Press", "Deadlift"]', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-mobility', 'seed-trainer-profile', 'seed-gym-central', 'sara-wp-mobility', 'موبیلیتی و ریکاوری', 'برنامه ریکاوری و موبیلیتی تخصص سارا. برای تمام شاگردان.', 'ACTIVE', 1, 0, '2026-09-16T00:49:22.879Z', '["Hip Stretch", "Foam Rolling"]', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-women-fullbody', 'seed-trainer-profile', 'seed-gym-central', 'sara-wp-women-fullbody', 'فول بادی بانوان - تناسب اندام', 'برنامه ۳ روزه بانوان برای فرم دهی پا و باسن. مناسب سحر و پریسا.', 'ACTIVE', 1, 0, '2026-09-16T00:49:22.879Z', '["Hip Thrust", "Squat", "Kickback"]', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z');

-- Workout Days
INSERT OR REPLACE INTO "WorkoutDay" ("id", "planId", "dayNumber", "name", "notes", "createdAt", "updatedAt") VALUES
('sara-wp-hypertrophy-day-1', 'sara-wp-hypertrophy', 1, 'روز ۱ - سینه و پشت بازو', 'تمرکز بر پرس ها', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-hypertrophy-day-2', 'sara-wp-hypertrophy', 2, 'روز ۲ - پا و شکم', 'روز سنگین پا', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-hypertrophy-day-3', 'sara-wp-hypertrophy', 3, 'روز ۳ - پشت و جلو بازو', NULL, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-hypertrophy-day-4', 'sara-wp-hypertrophy', 4, 'روز ۴ - سرشانه', NULL, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-fatloss-hiit-day-1', 'sara-wp-fatloss-hiit', 1, 'روز ۱ - HIIT فول بادی', '۳۰ ثانیه کار ۱۵ استراحت', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-fatloss-hiit-day-2', 'sara-wp-fatloss-hiit', 2, 'روز ۲ - قدرتی چربی سوز', NULL, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-fatloss-hiit-day-3', 'sara-wp-fatloss-hiit', 3, 'روز ۳ - کور و کاندیشننگ', NULL, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-strength-l2-day-1', 'sara-wp-strength-l2', 1, 'روز A - پایین تنه', 'سنگین و کنترل شده', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-strength-l2-day-2', 'sara-wp-strength-l2', 2, 'روز B - بالا تنه', NULL, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-strength-l2-day-3', 'sara-wp-strength-l2', 3, 'روز C - قدرت کامل', NULL, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-mobility-day-1', 'sara-wp-mobility', 1, 'موبیلیتی پایین تنه', NULL, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-mobility-day-2', 'sara-wp-mobility', 2, 'موبیلیتی بالا تنه', NULL, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-women-fullbody-day-1', 'sara-wp-women-fullbody', 1, 'روز ۱ - پا و باسن', NULL, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-women-fullbody-day-2', 'sara-wp-women-fullbody', 2, 'روز ۲ - بالا تنه و شکم', NULL, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-women-fullbody-day-3', 'sara-wp-women-fullbody', 3, 'روز ۳ - فول بادی چربی سوز', NULL, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z');

-- Workout Exercises (simplified, key ones)
INSERT OR REPLACE INTO "WorkoutExercise" ("id", "dayId", "order", "name", "sets", "reps", "restSeconds", "tempo", "createdAt", "updatedAt") VALUES
('sara-wp-hypertrophy-day-1-ex-1', 'sara-wp-hypertrophy-day-1', 1, 'پرس سینه هالتر', 4, '8-10', 90, '2-1-2', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-hypertrophy-day-1-ex-2', 'sara-wp-hypertrophy-day-1', 2, 'پرس بالا سینه دمبل', 4, '10-12', 75, NULL, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-hypertrophy-day-1-ex-3', 'sara-wp-hypertrophy-day-1', 3, 'پشت بازو سیم کش', 4, '10-12', 60, NULL, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-hypertrophy-day-2-ex-1', 'sara-wp-hypertrophy-day-2', 1, 'اسکوات هالتر', 5, '6-8', 120, '3-1-1', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-hypertrophy-day-2-ex-2', 'sara-wp-hypertrophy-day-2', 2, 'ددلیفت رومانیایی', 4, '8-10', 90, NULL, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-hypertrophy-day-2-ex-3', 'sara-wp-hypertrophy-day-2', 3, 'پرس پا', 4, '10-12', 90, NULL, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-hypertrophy-day-3-ex-1', 'sara-wp-hypertrophy-day-3', 1, 'بارفیکس', 4, '6-10', 90, NULL, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-hypertrophy-day-3-ex-2', 'sara-wp-hypertrophy-day-3', 2, 'زیر بغل هالتر خم', 4, '8-10', 90, NULL, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-hypertrophy-day-4-ex-1', 'sara-wp-hypertrophy-day-4', 1, 'پرس سرشانه', 4, '8-10', 90, NULL, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-fatloss-hiit-day-1-ex-1', 'sara-wp-fatloss-hiit-day-1', 1, 'برپی', 5, '15', 45, NULL, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-fatloss-hiit-day-1-ex-2', 'sara-wp-fatloss-hiit-day-1', 2, 'اسکوات پرشی', 4, '20', 30, NULL, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-fatloss-hiit-day-1-ex-3', 'sara-wp-fatloss-hiit-day-1', 3, 'طناب زنی', 3, '2 دقیقه', 30, NULL, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-strength-l2-day-1-ex-1', 'sara-wp-strength-l2-day-1', 1, 'Back Squat', 5, '5', 180, '3-1-1', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-strength-l2-day-1-ex-2', 'sara-wp-strength-l2-day-1', 2, 'Romanian Deadlift', 4, '6', 120, NULL, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-strength-l2-day-2-ex-1', 'sara-wp-strength-l2-day-2', 1, 'Bench Press', 5, '5', 180, NULL, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-strength-l2-day-3-ex-1', 'sara-wp-strength-l2-day-3', 1, 'Deadlift', 5, '3', 180, NULL, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-mobility-day-1-ex-1', 'sara-wp-mobility-day-1', 1, 'Hip 90/90 Stretch', 2, '60s هر طرف', 15, NULL, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-mobility-day-1-ex-2', 'sara-wp-mobility-day-1', 2, 'Deep Squat Hold', 3, '45s', 30, NULL, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-women-fullbody-day-1-ex-1', 'sara-wp-women-fullbody-day-1', 1, 'Hip Thrust', 4, '12', 75, NULL, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-wp-women-fullbody-day-1-ex-2', 'sara-wp-women-fullbody-day-1', 2, 'Squat', 4, '12', 75, NULL, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z');

-- Diet Plans
INSERT OR REPLACE INTO "DietPlan" ("id", "trainerId", "gymId", "familyId", "title", "description", "dietaryRestrictions", "dailyCalories", "status", "version", "isTemplate", "publishedAt", "legacyMeals", "createdAt", "updatedAt") VALUES
('sara-dp-bulk-3000', 'seed-trainer-profile', 'seed-gym-central', 'sara-dp-bulk-3000', 'رژیم افزایش وزن سالم - ۳۰۰۰ کالری', 'افزایش حجم با ۳۰۰۰ کالری و ۱۸۰ گرم پروتئین - مناسب رضا و آرمان', 'پروتئین بالا', 3000, 'ACTIVE', 1, 0, '2026-09-16T00:49:22.879Z', '["صبحانه","ناهار","شام"]', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-dp-cut-2000', 'seed-trainer-profile', 'seed-gym-central', 'sara-dp-cut-2000', 'رژیم کات و چربی سوزی - ۲۰۰۰ کالری', 'کات با پروتئین بالا برای نیما ماه ۳-۶ - حفظ عضله و چربی سوزی', 'کربوهیدرات کنترل شده', 2000, 'ACTIVE', 1, 0, '2026-09-16T00:49:22.879Z', '["صبحانه","ناهار","شام"]', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-dp-women-1800', 'seed-trainer-profile', 'seed-gym-central', 'sara-dp-women-1800', 'رژیم متعادل بانوان - ۱۸۰۰ کالری', '۱۸۰۰ کالری متعادل برای سحر و پریسا با آهن و کلسیم کافی', 'متعادل بانوان', 1800, 'ACTIVE', 1, 0, '2026-09-16T00:49:22.879Z', '["صبحانه","ناهار","شام"]', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-dp-maintain-2400', 'seed-trainer-profile', 'seed-gym-central', 'sara-dp-maintain-2400', 'رژیم نگهدارنده - ۲۴۰۰ کالری', 'نگهدارنده متعادل برای تمام شاگردان در فاز تثبیت', 'متعادل', 2400, 'ACTIVE', 1, 0, '2026-09-16T00:49:22.879Z', '["صبحانه","ناهار","شام"]', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z');

-- Diet Days
INSERT OR REPLACE INTO "DietDay" ("id", "planId", "dayNumber", "name", "targetCalories", "targetProtein", "targetCarbs", "targetFat", "createdAt", "updatedAt") VALUES
('sara-dp-bulk-3000-day-1', 'sara-dp-bulk-3000', 1, 'روز تمرین', 3000, 180, 380, 85, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-dp-cut-2000-day-1', 'sara-dp-cut-2000', 1, 'روز کات', 2000, 170, 180, 65, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-dp-women-1800-day-1', 'sara-dp-women-1800', 1, 'روز متعادل', 1800, 110, 200, 60, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-dp-maintain-2400-day-1', 'sara-dp-maintain-2400', 1, 'روز نگهدارنده', 2400, 140, 300, 70, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z');

-- Meals
INSERT OR REPLACE INTO "Meal" ("id", "dayId", "order", "name", "scheduledTime", "createdAt", "updatedAt") VALUES
('sara-dp-bulk-3000-day-1-meal-1', 'sara-dp-bulk-3000-day-1', 1, 'صبحانه ۸:۰۰', '08:00', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-dp-bulk-3000-day-1-meal-2', 'sara-dp-bulk-3000-day-1', 2, 'ناهار ۱۳:۳۰', '13:30', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-dp-bulk-3000-day-1-meal-3', 'sara-dp-bulk-3000-day-1', 3, 'شام ۲۰:۰۰', '20:00', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-dp-cut-2000-day-1-meal-1', 'sara-dp-cut-2000-day-1', 1, 'صبحانه', '08:00', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-dp-cut-2000-day-1-meal-2', 'sara-dp-cut-2000-day-1', 2, 'ناهار', '13:00', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-dp-cut-2000-day-1-meal-3', 'sara-dp-cut-2000-day-1', 3, 'شام', '20:00', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-dp-women-1800-day-1-meal-1', 'sara-dp-women-1800-day-1', 1, 'صبحانه', '08:30', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-dp-women-1800-day-1-meal-2', 'sara-dp-women-1800-day-1', 2, 'ناهار', '13:30', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-dp-women-1800-day-1-meal-3', 'sara-dp-women-1800-day-1', 3, 'شام', '19:30', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-dp-maintain-2400-day-1-meal-1', 'sara-dp-maintain-2400-day-1', 1, 'صبحانه', '08:00', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-dp-maintain-2400-day-1-meal-2', 'sara-dp-maintain-2400-day-1', 2, 'ناهار', '13:00', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-dp-maintain-2400-day-1-meal-3', 'sara-dp-maintain-2400-day-1', 3, 'شام', '20:00', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z');

-- Food Items
INSERT OR REPLACE INTO "FoodItem" ("id", "mealId", "order", "name", "quantity", "unit", "calories", "protein", "carbs", "fat", "createdAt", "updatedAt") VALUES
('sara-dp-bulk-3000-day-1-meal-1-food-1', 'sara-dp-bulk-3000-day-1-meal-1', 1, 'تخم مرغ', 3, 'عدد', 210, 18, 1, 15, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-dp-bulk-3000-day-1-meal-1-food-2', 'sara-dp-bulk-3000-day-1-meal-1', 2, 'نان تست', 2, 'برش', 160, 6, 30, 2, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-dp-bulk-3000-day-1-meal-1-food-3', 'sara-dp-bulk-3000-day-1-meal-1', 3, 'موز', 1, 'عدد', 105, 1, 27, 0, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-dp-bulk-3000-day-1-meal-2-food-1', 'sara-dp-bulk-3000-day-1-meal-2', 1, 'سینه مرغ', 200, 'g', 330, 62, 0, 7, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-dp-bulk-3000-day-1-meal-2-food-2', 'sara-dp-bulk-3000-day-1-meal-2', 2, 'برنج', 300, 'g', 390, 7, 84, 1, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-dp-bulk-3000-day-1-meal-3-food-1', 'sara-dp-bulk-3000-day-1-meal-3', 1, 'گوشت قرمز', 180, 'g', 320, 45, 0, 14, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-dp-cut-2000-day-1-meal-1-food-1', 'sara-dp-cut-2000-day-1-meal-1', 1, 'سفیده تخم مرغ', 4, 'عدد', 70, 14, 1, 0, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-dp-cut-2000-day-1-meal-2-food-1', 'sara-dp-cut-2000-day-1-meal-2', 1, 'سینه مرغ', 180, 'g', 300, 55, 0, 6, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-dp-cut-2000-day-1-meal-3-food-1', 'sara-dp-cut-2000-day-1-meal-3', 1, 'ماهی سالمون', 150, 'g', 280, 30, 0, 16, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-dp-women-1800-day-1-meal-1-food-1', 'sara-dp-women-1800-day-1-meal-1', 1, 'تخم مرغ', 2, 'عدد', 140, 12, 1, 10, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-dp-women-1800-day-1-meal-2-food-1', 'sara-dp-women-1800-day-1-meal-2', 1, 'سینه مرغ', 120, 'g', 200, 36, 0, 4, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-dp-women-1800-day-1-meal-3-food-1', 'sara-dp-women-1800-day-1-meal-3', 1, 'ماهی', 120, 'g', 180, 26, 0, 8, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-dp-maintain-2400-day-1-meal-1-food-1', 'sara-dp-maintain-2400-day-1-meal-1', 1, 'نان سنگک', 1, 'برش', 120, 4, 24, 1, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('sara-dp-maintain-2400-day-1-meal-2-food-1', 'sara-dp-maintain-2400-day-1-meal-2', 1, 'چلو کباب', 1, 'پرس', 600, 35, 60, 25, '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z');

-- Workout Assignments
INSERT OR REPLACE INTO "WorkoutAssignment" ("id", "planId", "userId", "trainerClientId", "status", "assignedAt", "startDate", "createdAt", "updatedAt") VALUES
('wa-sara-wp-strength-l2-seed-user-member', 'sara-wp-strength-l2', 'seed-user-member', 'seed-trainer-client', 'ACTIVE', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('wa-sara-wp-strength-l2-seed-user-reza', 'sara-wp-strength-l2', 'seed-user-reza', 'seed-trainer-client-reza', 'ACTIVE', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('wa-sara-wp-hypertrophy-seed-user-member', 'sara-wp-hypertrophy', 'seed-user-member', 'seed-trainer-client', 'ACTIVE', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('wa-sara-wp-hypertrophy-seed-user-reza', 'sara-wp-hypertrophy', 'seed-user-reza', 'seed-trainer-client-reza', 'ACTIVE', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('wa-sara-wp-hypertrophy-seed-user-pending-member', 'sara-wp-hypertrophy', 'seed-user-pending-member', 'seed-trainer-client-arman', 'ACTIVE', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('wa-sara-wp-fatloss-hiit-seed-user-member', 'sara-wp-fatloss-hiit', 'seed-user-member', 'seed-trainer-client', 'ACTIVE', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('wa-sara-wp-fatloss-hiit-seed-user-sahar', 'sara-wp-fatloss-hiit', 'seed-user-sahar', 'seed-trainer-client-sahar', 'ACTIVE', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('wa-sara-wp-fatloss-hiit-seed-user-parisa', 'sara-wp-fatloss-hiit', 'seed-user-parisa', 'seed-trainer-client-parisa', 'ACTIVE', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('wa-sara-wp-women-fullbody-seed-user-sahar', 'sara-wp-women-fullbody', 'seed-user-sahar', 'seed-trainer-client-sahar', 'ACTIVE', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('wa-sara-wp-women-fullbody-seed-user-parisa', 'sara-wp-women-fullbody', 'seed-user-parisa', 'seed-trainer-client-parisa', 'ACTIVE', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('wa-sara-wp-mobility-seed-user-member', 'sara-wp-mobility', 'seed-user-member', 'seed-trainer-client', 'ACTIVE', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('wa-sara-wp-mobility-seed-user-sahar', 'sara-wp-mobility', 'seed-user-sahar', 'seed-trainer-client-sahar', 'ACTIVE', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('wa-sara-wp-mobility-seed-user-reza', 'sara-wp-mobility', 'seed-user-reza', 'seed-trainer-client-reza', 'ACTIVE', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('wa-sara-wp-mobility-seed-user-parisa', 'sara-wp-mobility', 'seed-user-parisa', 'seed-trainer-client-parisa', 'ACTIVE', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('wa-sara-wp-mobility-seed-user-pending-member', 'sara-wp-mobility', 'seed-user-pending-member', 'seed-trainer-client-arman', 'ACTIVE', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z');

-- Diet Assignments
INSERT OR REPLACE INTO "DietAssignment" ("id", "planId", "userId", "trainerClientId", "status", "assignedAt", "startDate", "createdAt", "updatedAt") VALUES
('da-sara-dp-bulk-3000-seed-user-reza', 'sara-dp-bulk-3000', 'seed-user-reza', 'seed-trainer-client-reza', 'ACTIVE', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('da-sara-dp-bulk-3000-seed-user-pending-member', 'sara-dp-bulk-3000', 'seed-user-pending-member', 'seed-trainer-client-arman', 'ACTIVE', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('da-sara-dp-cut-2000-seed-user-member', 'sara-dp-cut-2000', 'seed-user-member', 'seed-trainer-client', 'ACTIVE', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('da-sara-dp-women-1800-seed-user-sahar', 'sara-dp-women-1800', 'seed-user-sahar', 'seed-trainer-client-sahar', 'ACTIVE', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('da-sara-dp-women-1800-seed-user-parisa', 'sara-dp-women-1800', 'seed-user-parisa', 'seed-trainer-client-parisa', 'ACTIVE', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('da-sara-dp-maintain-2400-seed-user-member', 'sara-dp-maintain-2400', 'seed-user-member', 'seed-trainer-client', 'ACTIVE', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('da-sara-dp-maintain-2400-seed-user-sahar', 'sara-dp-maintain-2400', 'seed-user-sahar', 'seed-trainer-client-sahar', 'ACTIVE', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('da-sara-dp-maintain-2400-seed-user-reza', 'sara-dp-maintain-2400', 'seed-user-reza', 'seed-trainer-client-reza', 'ACTIVE', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('da-sara-dp-maintain-2400-seed-user-parisa', 'sara-dp-maintain-2400', 'seed-user-parisa', 'seed-trainer-client-parisa', 'ACTIVE', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('da-sara-dp-maintain-2400-seed-user-pending-member', 'sara-dp-maintain-2400', 'seed-user-pending-member', 'seed-trainer-client-arman', 'ACTIVE', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z');

-- Nima 6-month body measurements
INSERT OR REPLACE INTO "BodyMeasurement" ("id", "userId", "recordedAt", "weightKg", "bodyFatPercent", "waistCm", "chestCm", "armCm", "hipsCm", "thighCm", "notes", "createdAt", "updatedAt") VALUES
('nima-m-1', 'seed-user-member', '2026-03-16T00:49:22.879Z', 85.2, 22.5, 92, 100, 33, 102, 60, 'ماه ۱ - شروع مسیر، وزن اولیه ۸۵.۲ کیلو', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('nima-m-2', 'seed-user-member', '2026-04-16T00:49:22.879Z', 84.0, 21.0, 90, 100.5, 33.5, 101, 59.5, 'ماه ۲ - کاهش ۱.۲ کیلو، بهبود فرم اسکوات', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('nima-m-3', 'seed-user-member', '2026-05-16T00:49:22.879Z', 82.8, 19.8, 88.5, 101, 34, 100, 59, 'ماه ۳ - پایان فاز قدرت پایه، قدرت ۲۰٪ افزایش', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('nima-m-4', 'seed-user-member', '2026-06-16T00:49:22.879Z', 81.5, 18.5, 87, 101.5, 34.5, 99, 58.5, 'ماه ۴ - شروع فاز هایپرتروفی، حجم عضلانی', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('nima-m-5', 'seed-user-member', '2026-07-16T00:49:22.879Z', 80.8, 17.2, 85.5, 102, 35, 98, 58, 'ماه ۵ - فاز کات شروع شد، رژیم ۲۰۰۰ کالری', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z'),
('nima-m-6', 'seed-user-member', '2026-09-16T00:49:22.879Z', 80.0, 16.0, 84, 102.5, 35.5, 97, 57.5, 'ماه ۶ - الان: ۵.۲ کیلو کاهش وزن، ۶.۵٪ چربی کمتر، ۲.۵ سانت افزایش بازو', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z');

-- Progress Photos for Nima
INSERT OR REPLACE INTO "ProgressPhoto" ("id", "userId", "measurementId", "imageUrl", "pose", "createdAt") VALUES
('nima-photo-m1', 'seed-user-member', 'nima-m-1', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e', 'Front - Month 1 - شروع', '2026-03-16T00:49:22.879Z'),
('nima-photo-m3', 'seed-user-member', 'nima-m-3', 'https://images.unsplash.com/photo-1594381898411-846e7d193883', 'Front - Month 3 - پایان قدرت', '2026-05-16T00:49:22.879Z'),
('nima-photo-m6', 'seed-user-member', 'nima-m-6', 'https://images.unsplash.com/photo-1534367610401-9f5ed68180aa', 'Front - Month 6 - الان', '2026-09-16T00:49:22.879Z');

-- Feedback for Nima journey
INSERT OR REPLACE INTO "Feedback" ("id", "authorId", "recipientId", "trainerClientId", "type", "content", "createdAt", "updatedAt") VALUES
('nima-fb-m1', 'seed-user-trainer', 'seed-user-member', 'seed-trainer-client', 'PROGRESS', 'نیما جان ماه اول عالی بود! فرم اسکواتت خیلی بهتر شده. ادامه بده. 💪', '2026-04-16T00:49:22.879Z', '2026-04-16T00:49:22.879Z'),
('nima-fb-m2', 'seed-user-trainer', 'seed-user-member', 'seed-trainer-client', 'PROGRESS', 'ماه دوم: قدرتت ۲۰٪ افزایش داشته. وزنه‌ها رو می‌تونی بیشتر کنی.', '2026-05-16T00:49:22.879Z', '2026-05-16T00:49:22.879Z'),
('nima-fb-m3', 'seed-user-trainer', 'seed-user-member', 'seed-trainer-client', 'PROGRESS', 'ماه سوم: پایان فاز قدرت پایه. آماده‌ای برای هایپرتروفی؟ برنامه جدیدت رو گذاشتم.', '2026-06-16T00:49:22.879Z', '2026-06-16T00:49:22.879Z'),
('nima-fb-m4', 'seed-user-trainer', 'seed-user-member', 'seed-trainer-client', 'PROGRESS', 'ماه چهارم: حجم عضلانیت داره میاد! سینه و بازوهات فرق کرده.', '2026-07-16T00:49:22.879Z', '2026-07-16T00:49:22.879Z'),
('nima-fb-m5', 'seed-user-trainer', 'seed-user-member', 'seed-trainer-client', 'PROGRESS', 'ماه پنجم: وارد فاز کات شدیم. رژیم ۲۰۰۰ کالری رو دقیق رعایت کن.', '2026-08-16T00:49:22.879Z', '2026-08-16T00:49:22.879Z'),
('nima-fb-m6', 'seed-user-trainer', 'seed-user-member', 'seed-trainer-client', 'PROGRESS', 'ماه ششم: نیما تو الان ۶ ماهه شاگرد منی! ۵.۲ کیلو چربی کم کردی و ۲.۵ سانت به بازوت اضافه شده. بهت افتخار می‌کنم 💪', '2026-09-16T00:49:22.879Z', '2026-09-16T00:49:22.879Z');

-- Notifications for Nima
INSERT OR REPLACE INTO "Notification" ("id", "userId", "type", "title", "message", "href", "createdAt") VALUES
('nima-notif-1', 'seed-user-member', 'PLAN_ASSIGNED', 'برنامه جدید قدرت سطح ۲', 'سارا برنامه قدرت پیشرفته سطح ۲ رو برات فعال کرد - ادامه مسیر ۶ ماهه', '/user/workouts', '2026-06-16T00:49:22.879Z'),
('nima-notif-2', 'seed-user-member', 'PLAN_ASSIGNED', 'برنامه هایپرتروفی', 'برنامه ۴ روزه حجم عضلانی برات فعال شد', '/user/workouts', '2026-07-16T00:49:22.879Z'),
('nima-notif-3', 'seed-user-member', 'PLAN_ASSIGNED', 'رژیم کات شروع شد', 'رژیم ۲۰۰۰ کالری کات برات فعال شد - ۶ هفته تا نتیجه نهایی', '/user/nutrition', '2026-08-16T00:49:22.879Z'),
('nima-notif-4', 'seed-user-member', 'GENERAL', '۶ ماهگی شاگردی! 🎉', 'تبریک! ۶ ماهه که با سارا تمرین می‌کنی. مسیرت رو ببین - ۵.۲ کیلو کاهش وزن', '/user/progress', '2026-09-16T00:49:22.879Z'),
('nima-notif-sara-1', 'seed-user-sahar', 'PLAN_ASSIGNED', 'برنامه بانوان فعال شد', 'سارا برنامه فول بادی بانوان و رژیم ۱۸۰۰ کالری رو برات فعال کرد', '/user/workouts', '2026-09-16T00:49:22.879Z'),
('nima-notif-reza-1', 'seed-user-reza', 'PLAN_ASSIGNED', 'برنامه حجمی فعال شد', 'سارا برنامه هایپرتروفی ۴ روزه و رژیم ۳۰۰۰ کالری رو برات فعال کرد', '/user/workouts', '2026-09-16T00:49:22.879Z');

PRAGMA foreign_keys = ON;


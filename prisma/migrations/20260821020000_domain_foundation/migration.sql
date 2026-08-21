PRAGMA foreign_keys=OFF;
PRAGMA legacy_alter_table=ON;

-- Preserve the original MVP tables while the normalized domain model is created.
ALTER TABLE "Rating" RENAME TO "__old_Rating";
ALTER TABLE "Feedback" RENAME TO "__old_Feedback";
ALTER TABLE "DietPlan" RENAME TO "__old_DietPlan";
ALTER TABLE "WorkoutPlan" RENAME TO "__old_WorkoutPlan";
ALTER TABLE "Subscription" RENAME TO "__old_Subscription";
ALTER TABLE "GymMember" RENAME TO "__old_GymMember";
ALTER TABLE "TrainerProfile" RENAME TO "__old_TrainerProfile";
ALTER TABLE "Gym" RENAME TO "__old_Gym";
ALTER TABLE "User" RENAME TO "__old_User";

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

CREATE TABLE "WorkoutPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trainerId" TEXT NOT NULL,
    "gymId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT' CHECK ("status" IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
    "version" INTEGER NOT NULL DEFAULT 1 CHECK ("version" >= 1),
    "legacyExercises" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkoutPlan_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkoutPlan_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

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

CREATE TABLE "DietPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trainerId" TEXT NOT NULL,
    "gymId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT' CHECK ("status" IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
    "version" INTEGER NOT NULL DEFAULT 1 CHECK ("version" >= 1),
    "legacyMeals" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DietPlan_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DietPlan_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

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

CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "trainerClientId" TEXT,
    "workoutAssignmentId" TEXT,
    "dietAssignmentId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'GENERAL' CHECK ("type" IN ('GENERAL', 'WORKOUT', 'DIET', 'PROGRESS')),
    "content" TEXT NOT NULL CHECK (length(trim("content")) > 0),
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Feedback_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Feedback_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Feedback_trainerClientId_fkey" FOREIGN KEY ("trainerClientId") REFERENCES "TrainerClient" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Feedback_workoutAssignmentId_fkey" FOREIGN KEY ("workoutAssignmentId") REFERENCES "WorkoutAssignment" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Feedback_dietAssignmentId_fkey" FOREIGN KEY ("dietAssignmentId") REFERENCES "DietAssignment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "GymReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "gymId" TEXT NOT NULL,
    "score" INTEGER NOT NULL CHECK ("score" BETWEEN 1 AND 5),
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GymReview_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GymReview_gymId_fkey" FOREIGN KEY ("gymId") REFERENCES "Gym" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "TrainerReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "authorId" TEXT NOT NULL,
    "trainerId" TEXT NOT NULL,
    "score" INTEGER NOT NULL CHECK ("score" BETWEEN 1 AND 5),
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TrainerReview_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainerReview_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "TrainerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Migrate existing users and domain data without exposing or resetting credentials.
INSERT INTO "User" ("id", "name", "email", "password", "role", "status", "createdAt", "updatedAt")
SELECT "id", "name", lower(trim("email")), "password", "role", 'ACTIVE', "createdAt", "updatedAt"
FROM "__old_User";

INSERT INTO "Gym" ("id", "name", "slug", "description", "phone", "address", "status", "createdAt", "updatedAt")
SELECT "id", "name", 'gym-' || "id", "description", "phone", "address", 'ACTIVE', "createdAt", "updatedAt"
FROM "__old_Gym";

INSERT INTO "TrainerProfile" ("id", "userId", "bio", "specialty", "experienceYears", "hourlyRate", "currency", "isAvailable", "createdAt", "updatedAt")
SELECT "id", "userId", "bio", "specialty", "experience",
       CASE WHEN "hourlyRate" IS NULL THEN NULL ELSE CAST(round("hourlyRate" * 100) AS INTEGER) END,
       'USD', true, "createdAt", "updatedAt"
FROM "__old_TrainerProfile";

INSERT OR IGNORE INTO "TrainerProfile" ("id", "userId", "currency", "isAvailable", "createdAt", "updatedAt")
SELECT 'profile-' || "id", "id", 'IRR', true, "createdAt", "updatedAt"
FROM "User"
WHERE "role" = 'TRAINER';

INSERT OR IGNORE INTO "GymTrainer" ("id", "gymId", "trainerId", "status", "requestedAt", "reviewedAt", "startedAt", "createdAt", "updatedAt")
SELECT 'gym-trainer-' || "id", "gymId", "id", 'ACTIVE', "createdAt", "createdAt", "createdAt", "createdAt", "updatedAt"
FROM "__old_TrainerProfile"
WHERE "gymId" IS NOT NULL;

INSERT OR IGNORE INTO "GymMembership" ("id", "gymId", "userId", "status", "requestedAt", "startedAt", "expiresAt", "endedAt", "createdAt", "updatedAt")
SELECT "id", "gymId", "userId", CASE WHEN "active" THEN 'ACTIVE' ELSE 'CANCELLED' END,
       "createdAt", "startDate", "endDate", CASE WHEN "active" THEN NULL ELSE "endDate" END,
       "createdAt", "createdAt"
FROM "__old_GymMember";

INSERT OR IGNORE INTO "TrainerClient" ("id", "trainerId", "userId", "gymId", "status", "requestedAt", "startedAt", "endedAt", "createdAt", "updatedAt")
SELECT 'trainer-client-' || "id", "trainerId", "userId", "gymId",
       CASE WHEN "active" THEN 'ACTIVE' ELSE 'ENDED' END,
       "createdAt", "startDate", CASE WHEN "active" THEN NULL ELSE "endDate" END,
       "createdAt", "createdAt"
FROM "__old_GymMember"
WHERE "trainerId" IS NOT NULL;

INSERT INTO "SubscriptionPlan" ("id", "gymId", "name", "audience", "price", "currency", "durationDays", "isActive", "createdAt", "updatedAt")
SELECT 'legacy-plan-' || "id", "gymId", "plan" || ' · ' || substr("id", -6), 'MEMBER',
       CAST(round("price" * 100) AS INTEGER), 'USD',
       CASE WHEN "endDate" IS NULL THEN 30 ELSE max(1, CAST(julianday("endDate") - julianday("startDate") AS INTEGER)) END,
       "active", "createdAt", "createdAt"
FROM "__old_Subscription";

INSERT INTO "Subscription" ("id", "subscriberId", "gymId", "planId", "status", "pricePaid", "currency", "startDate", "endDate", "createdAt", "updatedAt")
SELECT "id", "userId", "gymId", 'legacy-plan-' || "id",
       CASE WHEN "active" THEN 'ACTIVE' ELSE 'CANCELLED' END,
       CAST(round("price" * 100) AS INTEGER), 'USD', "startDate",
       COALESCE("endDate", datetime("startDate", '+30 days')), "createdAt", "createdAt"
FROM "__old_Subscription";

INSERT INTO "WorkoutPlan" ("id", "trainerId", "title", "description", "status", "version", "legacyExercises", "createdAt", "updatedAt")
SELECT "id", "trainerId", "title", "description", 'ACTIVE', 1, "exercises", "createdAt", "updatedAt"
FROM "__old_WorkoutPlan";

INSERT INTO "WorkoutAssignment" ("id", "planId", "userId", "status", "assignedAt", "startDate", "createdAt", "updatedAt")
SELECT 'workout-assignment-' || "id", "id", "userId", 'ACTIVE', "createdAt", "createdAt", "createdAt", "updatedAt"
FROM "__old_WorkoutPlan";

INSERT INTO "DietPlan" ("id", "trainerId", "title", "description", "status", "version", "legacyMeals", "createdAt", "updatedAt")
SELECT "id", "trainerId", "title", "description", 'ACTIVE', 1, "meals", "createdAt", "updatedAt"
FROM "__old_DietPlan";

INSERT INTO "DietAssignment" ("id", "planId", "userId", "status", "assignedAt", "startDate", "createdAt", "updatedAt")
SELECT 'diet-assignment-' || "id", "id", "userId", 'ACTIVE', "createdAt", "createdAt", "createdAt", "updatedAt"
FROM "__old_DietPlan";

INSERT INTO "Feedback" ("id", "authorId", "recipientId", "type", "content", "createdAt", "updatedAt")
SELECT "id", "fromUserId", "toUserId", 'GENERAL', "content", "createdAt", "createdAt"
FROM "__old_Feedback";

INSERT OR IGNORE INTO "GymReview" ("id", "authorId", "gymId", "score", "comment", "createdAt", "updatedAt")
SELECT "id", "fromUserId", "gymId", min(5, max(1, "score")), "comment", "createdAt", "createdAt"
FROM "__old_Rating"
WHERE "gymId" IS NOT NULL;

INSERT OR IGNORE INTO "TrainerReview" ("id", "authorId", "trainerId", "score", "comment", "createdAt", "updatedAt")
SELECT r."id", r."fromUserId", t."id", min(5, max(1, r."score")), r."comment", r."createdAt", r."createdAt"
FROM "__old_Rating" r
JOIN "TrainerProfile" t ON t."userId" = r."toUserId"
WHERE r."toUserId" IS NOT NULL;

DROP TABLE "__old_Rating";
DROP TABLE "__old_Feedback";
DROP TABLE "__old_DietPlan";
DROP TABLE "__old_WorkoutPlan";
DROP TABLE "__old_Subscription";
DROP TABLE "__old_GymMember";
DROP TABLE "__old_TrainerProfile";
DROP TABLE "__old_Gym";
DROP TABLE "__old_User";

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
CREATE UNIQUE INDEX "Gym_slug_key" ON "Gym"("slug");
CREATE INDEX "Gym_status_city_idx" ON "Gym"("status", "city");
CREATE INDEX "Gym_createdAt_idx" ON "Gym"("createdAt");
CREATE UNIQUE INDEX "TrainerProfile_userId_key" ON "TrainerProfile"("userId");
CREATE INDEX "TrainerProfile_isAvailable_specialty_idx" ON "TrainerProfile"("isAvailable", "specialty");
CREATE UNIQUE INDEX "GymStaff_gymId_userId_key" ON "GymStaff"("gymId", "userId");
CREATE INDEX "GymStaff_userId_status_idx" ON "GymStaff"("userId", "status");
CREATE INDEX "GymStaff_gymId_status_idx" ON "GymStaff"("gymId", "status");
CREATE UNIQUE INDEX "GymTrainer_gymId_trainerId_key" ON "GymTrainer"("gymId", "trainerId");
CREATE INDEX "GymTrainer_trainerId_status_idx" ON "GymTrainer"("trainerId", "status");
CREATE INDEX "GymTrainer_gymId_status_idx" ON "GymTrainer"("gymId", "status");
CREATE INDEX "GymTrainer_reviewedById_idx" ON "GymTrainer"("reviewedById");
CREATE UNIQUE INDEX "GymMembership_gymId_userId_key" ON "GymMembership"("gymId", "userId");
CREATE INDEX "GymMembership_userId_status_idx" ON "GymMembership"("userId", "status");
CREATE INDEX "GymMembership_gymId_status_idx" ON "GymMembership"("gymId", "status");
CREATE INDEX "GymMembership_reviewedById_idx" ON "GymMembership"("reviewedById");
CREATE INDEX "GymMembership_expiresAt_idx" ON "GymMembership"("expiresAt");
CREATE UNIQUE INDEX "TrainerClient_trainerId_userId_key" ON "TrainerClient"("trainerId", "userId");
CREATE INDEX "TrainerClient_userId_status_idx" ON "TrainerClient"("userId", "status");
CREATE INDEX "TrainerClient_trainerId_status_idx" ON "TrainerClient"("trainerId", "status");
CREATE INDEX "TrainerClient_gymId_idx" ON "TrainerClient"("gymId");
CREATE UNIQUE INDEX "SubscriptionPlan_gymId_name_audience_key" ON "SubscriptionPlan"("gymId", "name", "audience");
CREATE INDEX "SubscriptionPlan_gymId_audience_isActive_idx" ON "SubscriptionPlan"("gymId", "audience", "isActive");
CREATE INDEX "Subscription_subscriberId_status_idx" ON "Subscription"("subscriberId", "status");
CREATE INDEX "Subscription_gymId_status_idx" ON "Subscription"("gymId", "status");
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");
CREATE INDEX "Subscription_endDate_status_idx" ON "Subscription"("endDate", "status");
CREATE INDEX "WorkoutPlan_trainerId_status_idx" ON "WorkoutPlan"("trainerId", "status");
CREATE INDEX "WorkoutPlan_gymId_idx" ON "WorkoutPlan"("gymId");
CREATE UNIQUE INDEX "WorkoutAssignment_planId_userId_key" ON "WorkoutAssignment"("planId", "userId");
CREATE INDEX "WorkoutAssignment_userId_status_idx" ON "WorkoutAssignment"("userId", "status");
CREATE INDEX "WorkoutAssignment_trainerClientId_idx" ON "WorkoutAssignment"("trainerClientId");
CREATE INDEX "DietPlan_trainerId_status_idx" ON "DietPlan"("trainerId", "status");
CREATE INDEX "DietPlan_gymId_idx" ON "DietPlan"("gymId");
CREATE UNIQUE INDEX "DietAssignment_planId_userId_key" ON "DietAssignment"("planId", "userId");
CREATE INDEX "DietAssignment_userId_status_idx" ON "DietAssignment"("userId", "status");
CREATE INDEX "DietAssignment_trainerClientId_idx" ON "DietAssignment"("trainerClientId");
CREATE INDEX "Feedback_recipientId_createdAt_idx" ON "Feedback"("recipientId", "createdAt");
CREATE INDEX "Feedback_authorId_createdAt_idx" ON "Feedback"("authorId", "createdAt");
CREATE INDEX "Feedback_trainerClientId_idx" ON "Feedback"("trainerClientId");
CREATE INDEX "Feedback_workoutAssignmentId_idx" ON "Feedback"("workoutAssignmentId");
CREATE INDEX "Feedback_dietAssignmentId_idx" ON "Feedback"("dietAssignmentId");
CREATE UNIQUE INDEX "GymReview_authorId_gymId_key" ON "GymReview"("authorId", "gymId");
CREATE INDEX "GymReview_gymId_score_idx" ON "GymReview"("gymId", "score");
CREATE UNIQUE INDEX "TrainerReview_authorId_trainerId_key" ON "TrainerReview"("authorId", "trainerId");
CREATE INDEX "TrainerReview_trainerId_score_idx" ON "TrainerReview"("trainerId", "score");

PRAGMA legacy_alter_table=OFF;
PRAGMA foreign_keys=ON;
PRAGMA foreign_key_check;

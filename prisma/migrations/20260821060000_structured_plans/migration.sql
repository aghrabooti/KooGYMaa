PRAGMA foreign_keys=OFF;
PRAGMA legacy_alter_table=ON;

ALTER TABLE "WorkoutAssignment" RENAME TO "__old_WorkoutAssignment";
ALTER TABLE "WorkoutPlan" RENAME TO "__old_WorkoutPlan";
ALTER TABLE "DietAssignment" RENAME TO "__old_DietAssignment";
ALTER TABLE "DietPlan" RENAME TO "__old_DietPlan";

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

INSERT INTO "WorkoutPlan" ("id", "trainerId", "gymId", "familyId", "title", "description", "status", "version", "isTemplate", "publishedAt", "legacyExercises", "createdAt", "updatedAt")
SELECT "id", "trainerId", "gymId", "id", "title", "description", "status", "version", false,
       CASE WHEN "status" = 'ACTIVE' THEN "createdAt" ELSE NULL END,
       "legacyExercises", "createdAt", "updatedAt"
FROM "__old_WorkoutPlan";

INSERT INTO "WorkoutAssignment" ("id", "planId", "userId", "trainerClientId", "status", "assignedAt", "startDate", "endDate", "createdAt", "updatedAt")
SELECT "id", "planId", "userId", "trainerClientId", "status", "assignedAt", "startDate", "endDate", "createdAt", "updatedAt"
FROM "__old_WorkoutAssignment";

INSERT INTO "DietPlan" ("id", "trainerId", "gymId", "familyId", "title", "description", "status", "version", "isTemplate", "publishedAt", "legacyMeals", "createdAt", "updatedAt")
SELECT "id", "trainerId", "gymId", "id", "title", "description", "status", "version", false,
       CASE WHEN "status" = 'ACTIVE' THEN "createdAt" ELSE NULL END,
       "legacyMeals", "createdAt", "updatedAt"
FROM "__old_DietPlan";

INSERT INTO "DietAssignment" ("id", "planId", "userId", "trainerClientId", "status", "assignedAt", "startDate", "endDate", "createdAt", "updatedAt")
SELECT "id", "planId", "userId", "trainerClientId", "status", "assignedAt", "startDate", "endDate", "createdAt", "updatedAt"
FROM "__old_DietAssignment";

DROP TABLE "__old_WorkoutAssignment";
DROP TABLE "__old_WorkoutPlan";
DROP TABLE "__old_DietAssignment";
DROP TABLE "__old_DietPlan";

CREATE UNIQUE INDEX "WorkoutPlan_familyId_version_key" ON "WorkoutPlan"("familyId", "version");
CREATE INDEX "WorkoutPlan_trainerId_status_idx" ON "WorkoutPlan"("trainerId", "status");
CREATE INDEX "WorkoutPlan_gymId_idx" ON "WorkoutPlan"("gymId");
CREATE INDEX "WorkoutPlan_sourcePlanId_idx" ON "WorkoutPlan"("sourcePlanId");
CREATE UNIQUE INDEX "WorkoutDay_planId_dayNumber_key" ON "WorkoutDay"("planId", "dayNumber");
CREATE INDEX "WorkoutDay_planId_idx" ON "WorkoutDay"("planId");
CREATE UNIQUE INDEX "WorkoutExercise_dayId_order_key" ON "WorkoutExercise"("dayId", "order");
CREATE INDEX "WorkoutExercise_dayId_idx" ON "WorkoutExercise"("dayId");
CREATE UNIQUE INDEX "WorkoutAssignment_planId_userId_key" ON "WorkoutAssignment"("planId", "userId");
CREATE INDEX "WorkoutAssignment_userId_status_idx" ON "WorkoutAssignment"("userId", "status");
CREATE INDEX "WorkoutAssignment_trainerClientId_idx" ON "WorkoutAssignment"("trainerClientId");
CREATE UNIQUE INDEX "DietPlan_familyId_version_key" ON "DietPlan"("familyId", "version");
CREATE INDEX "DietPlan_trainerId_status_idx" ON "DietPlan"("trainerId", "status");
CREATE INDEX "DietPlan_gymId_idx" ON "DietPlan"("gymId");
CREATE INDEX "DietPlan_sourcePlanId_idx" ON "DietPlan"("sourcePlanId");
CREATE UNIQUE INDEX "DietDay_planId_dayNumber_key" ON "DietDay"("planId", "dayNumber");
CREATE INDEX "DietDay_planId_idx" ON "DietDay"("planId");
CREATE UNIQUE INDEX "Meal_dayId_order_key" ON "Meal"("dayId", "order");
CREATE INDEX "Meal_dayId_idx" ON "Meal"("dayId");
CREATE UNIQUE INDEX "FoodItem_mealId_order_key" ON "FoodItem"("mealId", "order");
CREATE INDEX "FoodItem_mealId_idx" ON "FoodItem"("mealId");
CREATE UNIQUE INDEX "DietAssignment_planId_userId_key" ON "DietAssignment"("planId", "userId");
CREATE INDEX "DietAssignment_userId_status_idx" ON "DietAssignment"("userId", "status");
CREATE INDEX "DietAssignment_trainerClientId_idx" ON "DietAssignment"("trainerClientId");

PRAGMA legacy_alter_table=OFF;
PRAGMA foreign_keys=ON;
PRAGMA foreign_key_check;

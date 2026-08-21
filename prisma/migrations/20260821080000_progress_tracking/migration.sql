PRAGMA foreign_keys=OFF;
PRAGMA legacy_alter_table=ON;

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

ALTER TABLE "Feedback" RENAME TO "__old_Feedback";

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

INSERT INTO "Feedback" ("id", "authorId", "recipientId", "trainerClientId", "workoutAssignmentId", "dietAssignmentId", "type", "content", "createdAt", "updatedAt")
SELECT "id", "authorId", "recipientId", "trainerClientId", "workoutAssignmentId", "dietAssignmentId", "type", "content", "createdAt", "updatedAt"
FROM "__old_Feedback";

DROP TABLE "__old_Feedback";

CREATE INDEX "WorkoutLog_userId_startedAt_idx" ON "WorkoutLog"("userId", "startedAt");
CREATE INDEX "WorkoutLog_assignmentId_status_idx" ON "WorkoutLog"("assignmentId", "status");
CREATE INDEX "WorkoutLog_workoutDayId_idx" ON "WorkoutLog"("workoutDayId");
CREATE UNIQUE INDEX "ExerciseLog_workoutLogId_exerciseId_key" ON "ExerciseLog"("workoutLogId", "exerciseId");
CREATE INDEX "ExerciseLog_exerciseId_idx" ON "ExerciseLog"("exerciseId");
CREATE UNIQUE INDEX "NutritionLog_assignmentId_dietDayId_logDate_key" ON "NutritionLog"("assignmentId", "dietDayId", "logDate");
CREATE INDEX "NutritionLog_userId_logDate_idx" ON "NutritionLog"("userId", "logDate");
CREATE UNIQUE INDEX "MealLog_nutritionLogId_mealId_key" ON "MealLog"("nutritionLogId", "mealId");
CREATE INDEX "MealLog_mealId_idx" ON "MealLog"("mealId");
CREATE INDEX "BodyMeasurement_userId_recordedAt_idx" ON "BodyMeasurement"("userId", "recordedAt");
CREATE INDEX "ProgressPhoto_userId_createdAt_idx" ON "ProgressPhoto"("userId", "createdAt");
CREATE INDEX "ProgressPhoto_measurementId_idx" ON "ProgressPhoto"("measurementId");
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");
CREATE INDEX "Feedback_recipientId_createdAt_idx" ON "Feedback"("recipientId", "createdAt");
CREATE INDEX "Feedback_authorId_createdAt_idx" ON "Feedback"("authorId", "createdAt");
CREATE INDEX "Feedback_trainerClientId_idx" ON "Feedback"("trainerClientId");
CREATE INDEX "Feedback_workoutAssignmentId_idx" ON "Feedback"("workoutAssignmentId");
CREATE INDEX "Feedback_dietAssignmentId_idx" ON "Feedback"("dietAssignmentId");
CREATE INDEX "Feedback_workoutLogId_idx" ON "Feedback"("workoutLogId");
CREATE INDEX "Feedback_nutritionLogId_idx" ON "Feedback"("nutritionLogId");
CREATE INDEX "Feedback_parentId_idx" ON "Feedback"("parentId");

PRAGMA legacy_alter_table=OFF;
PRAGMA foreign_keys=ON;
PRAGMA foreign_key_check;

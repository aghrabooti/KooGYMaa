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

CREATE UNIQUE INDEX "TrainerAvailability_trainerId_dayOfWeek_startMinutes_endMinutes_key" ON "TrainerAvailability"("trainerId", "dayOfWeek", "startMinutes", "endMinutes");
CREATE INDEX "TrainerAvailability_trainerId_dayOfWeek_isActive_idx" ON "TrainerAvailability"("trainerId", "dayOfWeek", "isActive");
CREATE INDEX "TrainingSession_trainerId_startsAt_status_idx" ON "TrainingSession"("trainerId", "startsAt", "status");
CREATE INDEX "TrainingSession_trainerClientId_startsAt_idx" ON "TrainingSession"("trainerClientId", "startsAt");
CREATE INDEX "TrainingSession_gymId_startsAt_idx" ON "TrainingSession"("gymId", "startsAt");

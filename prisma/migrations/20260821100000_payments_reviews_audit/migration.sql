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

ALTER TABLE "GymReview" ADD COLUMN "verified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "TrainerReview" ADD COLUMN "verified" BOOLEAN NOT NULL DEFAULT false;

UPDATE "GymReview"
SET "verified" = true
WHERE EXISTS (
    SELECT 1 FROM "GymMembership"
    WHERE "GymMembership"."gymId" = "GymReview"."gymId"
      AND "GymMembership"."userId" = "GymReview"."authorId"
      AND "GymMembership"."startedAt" IS NOT NULL
);

UPDATE "TrainerReview"
SET "verified" = true
WHERE EXISTS (
    SELECT 1 FROM "TrainerClient"
    WHERE "TrainerClient"."trainerId" = "TrainerReview"."trainerId"
      AND "TrainerClient"."userId" = "TrainerReview"."authorId"
      AND "TrainerClient"."startedAt" IS NOT NULL
);

CREATE UNIQUE INDEX "Payment_providerReference_key" ON "Payment"("providerReference");
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");
CREATE INDEX "Payment_userId_status_createdAt_idx" ON "Payment"("userId", "status", "createdAt");
CREATE INDEX "Payment_gymId_status_createdAt_idx" ON "Payment"("gymId", "status", "createdAt");
CREATE INDEX "Payment_subscriptionId_idx" ON "Payment"("subscriptionId");
CREATE UNIQUE INDEX "PaymentEvent_eventId_key" ON "PaymentEvent"("eventId");
CREATE INDEX "PaymentEvent_paymentId_createdAt_idx" ON "PaymentEvent"("paymentId", "createdAt");
CREATE INDEX "PaymentEvent_provider_status_idx" ON "PaymentEvent"("provider", "status");
CREATE INDEX "AuditLog_gymId_createdAt_idx" ON "AuditLog"("gymId", "createdAt");
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

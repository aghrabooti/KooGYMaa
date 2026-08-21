import { readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createClient, type Client } from "@libsql/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const initialMigration = "prisma/migrations/20260820224056_init/migration.sql";
const domainMigration = "prisma/migrations/20260821020000_domain_foundation/migration.sql";
const trainerMigration = "prisma/migrations/20260821040000_trainer_scheduling/migration.sql";
const plansMigration = "prisma/migrations/20260821060000_structured_plans/migration.sql";
const progressMigration = "prisma/migrations/20260821080000_progress_tracking/migration.sql";
const commerceMigration = "prisma/migrations/20260821100000_payments_reviews_audit/migration.sql";
const databasePath = join(tmpdir(), `koogymaa-schema-${randomUUID()}.db`);
let database: Client;

beforeAll(async () => {
  database = createClient({ url: `file:${databasePath}` });
  await database.executeMultiple(await readFile(initialMigration, "utf8"));
  await database.execute({
    sql: `INSERT INTO User (id, name, email, password, role, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    args: ["legacy-user", "Legacy User", "LEGACY@EXAMPLE.TEST", "hash", "USER"],
  });
  await database.executeMultiple(await readFile(domainMigration, "utf8"));
  await database.executeMultiple(await readFile(trainerMigration, "utf8"));
  await database.executeMultiple(await readFile(plansMigration, "utf8"));
  await database.executeMultiple(await readFile(progressMigration, "utf8"));
  await database.executeMultiple(await readFile(commerceMigration, "utf8"));
});

afterAll(async () => {
  database.close();
  await rm(databasePath, { force: true });
});

describe("domain foundation migration", () => {
  it("preserves users while normalizing identity fields", async () => {
    const result = await database.execute({
      sql: "SELECT email, role, status FROM User WHERE id = ?",
      args: ["legacy-user"],
    });

    expect(result.rows[0]).toMatchObject({
      email: "legacy@example.test",
      role: "USER",
      status: "ACTIVE",
    });
  });

  it("creates the complete domain table set", async () => {
    const result = await database.execute(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    );
    const names = result.rows.map((row) => String(row.name));

    expect(names).toEqual(expect.arrayContaining([
      "AuditLog",
      "BodyMeasurement",
      "DietAssignment",
      "DietDay",
      "DietPlan",
      "ExerciseLog",
      "FoodItem",
      "Feedback",
      "Gym",
      "GymMembership",
      "GymReview",
      "GymStaff",
      "GymTrainer",
      "Meal",
      "MealLog",
      "Notification",
      "NutritionLog",
      "Payment",
      "PaymentEvent",
      "ProgressPhoto",
      "Subscription",
      "SubscriptionPlan",
      "TrainerAvailability",
      "TrainerClient",
      "TrainerProfile",
      "TrainerReview",
      "TrainingSession",
      "User",
      "WorkoutAssignment",
      "WorkoutDay",
      "WorkoutExercise",
      "WorkoutLog",
      "WorkoutPlan",
    ]));
  });

  it("enforces rating and status constraints in SQLite", async () => {
    await database.execute({
      sql: `INSERT INTO Gym (id, name, slug, status, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      args: ["gym-1", "Test Gym", "test-gym", "ACTIVE"],
    });

    await expect(database.execute({
      sql: `INSERT INTO GymReview (id, authorId, gymId, score, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      args: ["review-1", "legacy-user", "gym-1", 6],
    })).rejects.toThrow();

    await expect(database.execute({
      sql: `INSERT INTO GymMembership (id, gymId, userId, status, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      args: ["membership-1", "gym-1", "legacy-user", "UNKNOWN"],
    })).rejects.toThrow();

    await database.execute({
      sql: `INSERT INTO User (id, name, email, password, role, status, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, 'TRAINER', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      args: ["trainer-user", "Test Trainer", "trainer@example.test", "hash"],
    });
    await database.execute({
      sql: `INSERT INTO TrainerProfile (id, userId, currency, isAvailable, createdAt, updatedAt)
            VALUES (?, ?, 'IRR', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      args: ["trainer-profile", "trainer-user"],
    });
    await expect(database.execute({
      sql: `INSERT INTO TrainerAvailability (id, trainerId, dayOfWeek, startMinutes, endMinutes, createdAt, updatedAt)
            VALUES (?, ?, 7, 540, 600, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      args: ["bad-slot", "trainer-profile"],
    })).rejects.toThrow();
  });

  it("has no broken foreign keys", async () => {
    const result = await database.execute("PRAGMA foreign_key_check");
    expect(result.rows).toHaveLength(0);
  });
});

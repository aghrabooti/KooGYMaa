#!/usr/bin/env node
/**
 * Enrich the local demo database so the presentation screenshots show a
 * realistic, populated gym instead of empty zero-state dashboards.
 *
 * Safe + idempotent: every row is inserted with a stable `demo-*` id using
 * INSERT ... ON CONFLICT DO UPDATE, so re-running it just refreshes the same records.
 * It ONLY targets a local SQLite file — it refuses to run against libsql://.
 *
 *   node docs/presentation/demo-data.mjs
 */
import { createRequire } from "node:module";
import crypto from "node:crypto";

const require = createRequire(import.meta.url);
const { createClient } = require("@libsql/client");

const url =
  process.env.DEMO_DB_URL ||
  process.env.LIBSQL_DATABASE_URL ||
  "file:./prisma/dev.db";

if (!url.startsWith("file:")) {
  console.error("✖ Refusing to run against a hosted database:", url);
  console.error("  This script is for the local demo SQLite file only.");
  process.exit(1);
}

const db = createClient({ url });
const now = new Date();
const iso = (d) => new Date(d).toISOString().replace("T", " ").slice(0, 23);
const day = (n) => iso(new Date(now.getTime() + n * 86400000));

const ATLAS = "seed-gym-atlas";
const CENTRAL = "seed-gym-central";
const TRAINER = "seed-trainer-profile";
const TRAINER2 = "seed-pending-trainer-profile";
const ADMIN = "seed-user-admin";
const MEMBER = "seed-user-member";

// A password hash is required by the schema; reuse the existing member's.
const { rows: pwRows } = await db.execute(
  `SELECT password FROM "User" WHERE id = '${MEMBER}'`
);
const PW = pwRows[0]?.password;
if (!PW) { console.error("✖ Seed data missing — run the base setup first."); process.exit(1); }

const run = async (sql, args = []) => db.execute({ sql, args });

/**
 * Upsert by primary key. `INSERT OR REPLACE` would DELETE the existing row
 * first, cascading to children (logs, payments, sessions), so we use an
 * explicit ON CONFLICT DO UPDATE instead.
 */
const upsert = async (table, cols, values) => {
  const ph = cols.map(() => "?").join(",");
  const set = cols.filter((c) => c !== "id").map((c) => `"${c}"=excluded."${c}"`).join(",");
  await run(
    `INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(",")}) VALUES (${ph})
     ON CONFLICT("id") DO UPDATE SET ${set}`,
    values
  );
};

// ---------------------------------------------------------------- members
const people = [
  ["ava",    "Ava Rahimi",     "ava.rahimi@koogymaa.test",     -190, 71.4],
  ["reza",   "Reza Karimi",    "reza.karimi@koogymaa.test",    -165, 88.2],
  ["sana",   "Sana Moradi",    "sana.moradi@koogymaa.test",    -140, 63.8],
  ["omid",   "Omid Tabrizi",   "omid.tabrizi@koogymaa.test",   -120, 94.1],
  ["parisa", "Parisa Ahmadi",  "parisa.ahmadi@koogymaa.test",   -95, 58.6],
  ["kian",   "Kian Nouri",     "kian.nouri@koogymaa.test",      -80, 79.0],
  ["mahsa",  "Mahsa Sadeghi",  "mahsa.sadeghi@koogymaa.test",   -62, 66.3],
  ["arash",  "Arash Jafari",   "arash.jafari@koogymaa.test",    -48, 83.7],
  ["nika",   "Nika Ebrahimi",  "nika.ebrahimi@koogymaa.test",   -33, 61.2],
  ["sepehr", "Sepehr Alavi",   "sepehr.alavi@koogymaa.test",    -21, 90.5],
  ["yasmin", "Yasmin Hosseini","yasmin.hosseini@koogymaa.test", -14, 57.9],
  ["borna",  "Borna Rostami",  "borna.rostami@koogymaa.test",    -6, 75.6],
];

for (const [key, name, email, joined] of people) {
  await upsert("User",
    ["id", "name", "email", "password", "phone", "role", "status", "lastLoginAt", "createdAt", "updatedAt"],
    [`demo-user-${key}`,
     name,
     email,
     PW,
     "+98 912 000 0000",
     'USER',
     'ACTIVE',
     day(-1),
     day(joined),
     iso(now)]);
}

// Memberships: 10 active at Atlas, 2 pending (approval demo)
people.forEach(() => {});
const memberships = people.map(([key, , , joined], i) => ({
  key, joined,
  status: i >= 10 ? "PENDING" : "ACTIVE",
}));
for (const m of memberships) {
  await upsert("GymMembership",
    ["id", "gymId", "userId", "status", "requestedAt", "reviewedAt", "reviewedById", "startedAt", "expiresAt", "createdAt", "updatedAt"],
    [`demo-mem-${m.key}`, ATLAS, `demo-user-${m.key}`, m.status,
     day(m.joined),
     m.status === "ACTIVE" ? day(m.joined + 1) : null,
     m.status === "ACTIVE" ? ADMIN : null,
     m.status === "ACTIVE" ? day(m.joined + 1) : null,
     m.status === "ACTIVE" ? day(m.joined + 1 + 365) : null,
     day(m.joined), iso(now)]);
}

// ---------------------------------------------------------------- plans
const plans = [
  ["atlas-basic",   "Atlas Basic",    "Open-gym access, locker, and community classes.",            "MEMBER",  9000000, 30],
  ["atlas-plus",    "Atlas Plus",     "Open gym plus two coached sessions every week.",             "MEMBER", 18000000, 30],
  ["atlas-quarter", "Atlas Quarterly","Three months of full access at a reduced monthly rate.",     "MEMBER", 45000000, 90],
  ["atlas-coach",   "Coach Residency","Studio access and client management tools for trainers.",    "TRAINER",25000000, 30],
];
for (const [key, name, description, audience, price, durationDays] of plans) {
  await upsert("SubscriptionPlan",
    ["id", "gymId", "name", "description", "audience", "price", "currency", "durationDays", "isActive", "createdAt", "updatedAt"],
    [`demo-plan-${key}`,
     ATLAS,
     name,
     description,
     audience,
     price,
     'IRR',
     durationDays,
     1,
     day(-200),
     iso(now)]);
}

// ------------------------------------------------- subscriptions + payments
const planFor = (i) =>
  i % 4 === 0 ? ["demo-plan-atlas-quarter", 45000000, 90]
  : i % 3 === 0 ? ["demo-plan-atlas-plus", 18000000, 30]
  : ["demo-plan-atlas-basic", 9000000, 30];

let paidTotal = 0;
const activeMembers = memberships.filter((m) => m.status === "ACTIVE");

for (let i = 0; i < activeMembers.length; i++) {
  const m = activeMembers[i];
  const [planId, price, days] = planFor(i);
  // spread start dates over the last six months so the revenue chart has shape
  const startOffset = [-160, -150, -132, -118, -96, -84, -61, -47, -32, -20][i] ?? -30;
  const endOffset = startOffset + days * (days === 90 ? 2 : 4); // some renewals
  const expiresSoon = i < 3;                        // a few expiring this week
  const end = expiresSoon ? [2, 4, 6][i] : endOffset;
  const status = "ACTIVE";

  await upsert("Subscription",
    ["id", "subscriberId", "gymId", "planId", "status", "pricePaid", "currency", "startDate", "endDate", "autoRenew", "createdAt", "updatedAt"],
    [`demo-sub-${m.key}`,
     `demo-user-${m.key}`,
     ATLAS,
     planId,
     status,
     price,
     'IRR',
     day(startOffset),
     day(end),
     i % 2 === 0 ? 1 : 0,
     day(startOffset),
     iso(now)]);

  // initial payment + a renewal for roughly half the members
  const payments = [["SUBSCRIPTION", startOffset]];
  if (i % 2 === 0) payments.push(["RENEWAL", Math.round(startOffset / 2)]);

  for (let p = 0; p < payments.length; p++) {
    const [type, off] = payments[p];
    // one failed and one refunded payment make the ledger realistic
    const status =
      i === 7 && p === 0 ? "FAILED" : i === 9 && p === 0 ? "REFUNDED" : "SUCCEEDED";
    if (status === "SUCCEEDED") paidTotal += price;
    const id = `demo-pay-${m.key}-${p}`;
    await upsert("Payment",
    ["id", "userId", "gymId", "planId", "subscriptionId", "type", "status", "amount", "currency", "provider", "providerReference", "idempotencyKey", "paidAt", "refundedAt", "failureCode", "failureMessage", "createdAt", "updatedAt"],
    [id,
     `demo-user-${m.key}`,
     ATLAS,
     planId,
     `demo-sub-${m.key}`,
     type,
     status,
     price,
     'IRR',
     'demo',
     `demo_${crypto.createHash("md5").update(id).digest("hex").slice(0, 16)}`,
     `idem_${id}`,
     status === "FAILED" ? null : day(off),
     status === "REFUNDED" ? day(off + 5) : null,
     status === "FAILED" ? "card_declined" : null,
     status === "FAILED" ? "The card issuer declined the transaction." : null,
     day(off),
     iso(now)]);
    await upsert("PaymentEvent",
    ["id", "paymentId", "provider", "eventId", "type", "payload", "status", "processedAt", "createdAt"],
    [`demo-evt-${m.key}-${p}`,
     id,
     'demo',
     `evt_${id}`,
     status === "SUCCEEDED" ? "payment.succeeded"
         : status === "FAILED" ? "payment.failed" : "payment.refunded",
     JSON.stringify({ id, amount: price, currency: "IRR" }),
     'PROCESSED',
     day(off),
     day(off)]);
  }
}

// ---------------------------------------------------------------- coaching
const clients = ["ava", "reza", "sana", "omid", "parisa", "kian"];
for (let i = 0; i < clients.length; i++) {
  const key = clients[i];
  await upsert("TrainerClient",
    ["id", "trainerId", "userId", "gymId", "status", "requestedAt", "startedAt", "createdAt", "updatedAt"],
    [`demo-tc-${key}`, TRAINER, `demo-user-${key}`, ATLAS,
     i === 5 ? "PENDING" : "ACTIVE",
     day(-60 + i * 7), i === 5 ? null : day(-58 + i * 7), day(-60 + i * 7), iso(now)]);
}

// trainer availability (weekly slots)
const slots = [[1, 540, 780], [1, 960, 1200], [3, 540, 780], [3, 960, 1200], [5, 600, 840]];
for (let i = 0; i < slots.length; i++) {
  const [dow, s, e] = slots[i];
  await upsert("TrainerAvailability",
    ["id", "trainerId", "dayOfWeek", "startMinutes", "endMinutes", "timezone", "isActive", "createdAt", "updatedAt"],
    [`demo-avail-${i}`,
     TRAINER,
     dow,
     s,
     e,
     'Asia/Tehran',
     1,
     day(-90),
     iso(now)]);
}

// sessions: past (completed) + upcoming (scheduled)
const sessionPlan = [
  ["ava",    -12, "COMPLETED", "Lower body strength"],
  ["reza",   -10, "COMPLETED", "Push day technique"],
  ["sana",    -8, "COMPLETED", "Mobility and core"],
  ["omid",    -5, "NO_SHOW",   "Conditioning intervals"],
  ["parisa",  -3, "COMPLETED", "Full body assessment"],
  ["ava",      1, "SCHEDULED", "Squat progression"],
  ["reza",     1, "SCHEDULED", "Bench press block"],
  ["sana",     2, "SCHEDULED", "Posterior chain"],
  ["omid",     3, "SCHEDULED", "Conditioning intervals"],
  ["parisa",   4, "SCHEDULED", "Upper body hypertrophy"],
  ["ava",      6, "SCHEDULED", "Deadlift technique"],
];
for (let i = 0; i < sessionPlan.length; i++) {
  const [key, off, status, title] = sessionPlan[i];
  const start = new Date(now.getTime() + off * 86400000);
  start.setHours(9 + (i % 6), 0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60000);
  await upsert("TrainingSession",
    ["id", "trainerId", "trainerClientId", "gymId", "title", "startsAt", "endsAt", "status", "notes", "createdAt", "updatedAt"],
    [`demo-sess-${i}`, TRAINER, `demo-tc-${key}`, ATLAS, title,
     iso(start), iso(end), status, null, day(off - 7), iso(now)]);
}

// ---------------------------------------------------------------- progress
// A richer body-measurement history for the primary member (nice chart).
const series = [
  [-180, 86.4, 27.5, 96, 104], [-165, 85.6, 27.0, 95, 104], [-150, 84.9, 26.4, 94, 104],
  [-135, 84.1, 25.9, 93, 105], [-120, 83.4, 25.3, 92, 105], [-105, 82.6, 24.8, 91, 105],
  [-90,  82.0, 24.2, 90, 106], [-75,  81.3, 23.7, 89, 106], [-60,  80.8, 23.1, 88, 106],
  [-45,  80.2, 22.6, 88, 107], [-30,  79.5, 22.0, 87, 107], [-15,  78.9, 21.5, 86, 107],
  [-2,   78.3, 21.0, 86, 108],
];
for (let i = 0; i < series.length; i++) {
  const [off, weightKg, bf, waist, chest] = series[i];
  await upsert("BodyMeasurement",
    ["id", "userId", "recordedAt", "weightKg", "bodyFatPercent", "waistCm", "chestCm", "notes", "createdAt", "updatedAt"],
    [`demo-bm-${i}`, MEMBER, day(off), weightKg, bf, waist, chest,
     i === series.length - 1 ? "Feeling strong, sleep is consistent." : null,
     day(off), iso(now)]);
}

// Workout logs across the last 8 weeks → streak + adherence metrics.
const { rows: assignRows } = await db.execute(
  `SELECT id FROM "WorkoutAssignment" WHERE userId = '${MEMBER}' LIMIT 1`
);
const { rows: dayRows } = await db.execute(
  `SELECT id FROM "WorkoutDay" ORDER BY dayNumber LIMIT 2`
);
const { rows: exRows } = await db.execute(`SELECT id FROM "WorkoutExercise" LIMIT 6`);

if (assignRows[0] && dayRows.length) {
  const assignmentId = assignRows[0].id;
  let n = 0;
  for (let w = 8; w >= 0; w--) {
    for (const d of [0, 3]) {
      const off = -(w * 7 + d);
      if (off > 0) continue;
      const wd = dayRows[n % dayRows.length].id;
      const logId = `demo-wl-${n}`;
      const start = new Date(now.getTime() + off * 86400000);
      start.setHours(18, 0, 0, 0);
      const skipped = n % 11 === 0 && n !== 0;
      await upsert("WorkoutLog",
    ["id", "assignmentId", "userId", "workoutDayId", "status", "startedAt", "completedAt", "perceivedEffort", "notes", "createdAt", "updatedAt"],
    [logId, assignmentId, MEMBER, wd, skipped ? "SKIPPED" : "COMPLETED",
         iso(start), skipped ? null : iso(new Date(start.getTime() + 65 * 60000)),
         skipped ? null : 6 + (n % 4), null, iso(start), iso(now)]);
      for (let e = 0; e < exRows.length; e++) {
        await upsert("ExerciseLog",
    ["id", "workoutLogId", "exerciseId", "completed", "actualSets", "actualReps", "actualWeight", "rpe", "notes", "createdAt", "updatedAt"],
    [`demo-el-${n}-${e}`, logId, exRows[e].id, skipped ? 0 : 1,
           skipped ? null : 3 + (e % 2),
           skipped ? null : String(8 + (e % 5)),
           skipped ? null : String(40 + e * 7 + Math.round(w * 0.5)),
           skipped ? null : 6 + (e % 4), null, iso(start), iso(now)]);
      }
      n++;
    }
  }
}

// ---------------------------------------------------------------- trust
const reviews = [
  ["ava",    5, "Clean equipment, friendly staff, and the coaching team actually follows up."],
  ["reza",   5, "Best value in the neighbourhood. The plan builder keeps me accountable."],
  ["sana",   4, "Great classes. Peak hours can get busy but the schedule tool helps."],
  ["omid",   5, "Progress tracking changed how I train — I can finally see the trend."],
  ["parisa", 4, "Nice space and helpful trainers. Would love more evening slots."],
];
for (const [key, score, comment] of reviews) {
  await upsert("GymReview",
    ["id", "authorId", "gymId", "score", "comment", "verified", "createdAt", "updatedAt"],
    [`demo-grev-${key}`,
     `demo-user-${key}`,
     ATLAS,
     score,
     comment,
     1,
     day(-40),
     iso(now)]);
}
const trainerReviews = [
  ["ava",    5, "Sara adapts every block to how my week actually went."],
  ["reza",   5, "Technique cues are precise and the feedback loop is fast."],
  ["sana",   4, "Patient, structured, and always on time."],
  ["omid",   5, "Down 9 kg in five months with a plan I can sustain."],
];
for (const [key, score, comment] of trainerReviews) {
  await upsert("TrainerReview",
    ["id", "authorId", "trainerId", "score", "comment", "verified", "createdAt", "updatedAt"],
    [`demo-trev-${key}`,
     `demo-user-${key}`,
     TRAINER,
     score,
     comment,
     1,
     day(-35),
     iso(now)]);
}

// ---------------------------------------------------------------- comms
const notifications = [
  ["PLAN_ASSIGNED",         "New workout plan assigned", "Sara Trainer assigned \"Foundation Strength v2\" to you.", "/user/workouts", null],
  ["SESSION_REMINDER",      "Session tomorrow at 10:00", "Squat progression with Sara Trainer at Atlas Fitness North.", "/user/schedule", null],
  ["FEEDBACK",              "New feedback on your log",  "Sara Trainer commented on your last lower-body session.", "/user/progress", null],
  ["SUBSCRIPTION_EXPIRING", "Membership expires soon",   "Your Atlas Plus membership renews in 5 days.", "/user/subscriptions", -1],
];
for (let i = 0; i < notifications.length; i++) {
  const [type, title, message, href, read] = notifications[i];
  await upsert("Notification",
    ["id", "userId", "type", "title", "message", "href", "readAt", "createdAt"],
    [`demo-notif-${i}`, MEMBER, type, title, message, href,
     read ? day(read) : null, day(-i - 1)]);
}

// audit trail for the admin "sensitive actions" panel
const audits = [
  ["subscription.refund",  "Payment",      "demo-pay-sepehr-0"],
  ["membership.approve",   "GymMembership","demo-mem-borna"],
  ["plan.update",          "SubscriptionPlan", "demo-plan-atlas-plus"],
  ["membership.suspend",   "GymMembership","demo-mem-kian"],
  ["gym.settings.update",  "Gym",          ATLAS],
];
for (let i = 0; i < audits.length; i++) {
  const [action, entityType, entityId] = audits[i];
  await upsert("AuditLog",
    ["id", "actorId", "actorRole", "gymId", "action", "entityType", "entityId", "metadata", "ipAddress", "createdAt"],
    [`demo-audit-${i}`,
     ADMIN,
     'ADMIN',
     ATLAS,
     action,
     entityType,
     entityId,
     JSON.stringify({ source: "admin-ui" }),
     "10.0.0.11",
     day(-i - 1)]);
}

// feedback thread between trainer and member
await upsert("Feedback",
    ["id", "authorId", "recipientId", "trainerClientId", "type", "content", "createdAt", "updatedAt"],
    ["demo-fb-1",
     "seed-user-trainer",
     MEMBER,
     "seed-trainer-client",
     'WORKOUT',
     "Strong session. Your bar path on the last two squat sets drifted forward — keep the brace tight and we will add load next week.",
     day(-2),
     iso(now)]);
await upsert("Feedback",
    ["id", "authorId", "recipientId", "trainerClientId", "parentId", "type", "content", "createdAt", "updatedAt"],
    ["demo-fb-2",
     MEMBER,
     "seed-user-trainer",
     "seed-trainer-client",
     "demo-fb-1",
     'WORKOUT',
     "Got it — I felt that on set four. I will film the next one so you can check the depth.",
     day(-1),
     iso(now)]);

// second trainer active at Atlas so the coaching team is not a single card
await upsert("GymTrainer",
    ["id", "gymId", "trainerId", "status", "requestedAt", "reviewedAt", "reviewedById", "startedAt", "createdAt", "updatedAt"],
    ["demo-gymtrainer-sara",
     ATLAS,
     TRAINER,
     'ACTIVE',
     day(-200),
     day(-199),
     ADMIN,
     day(-199),
     day(-200),
     iso(now)]);

// make the gym look alive on public pages
await run(
  `UPDATE "Gym" SET description = ?, email = ?, phone = ?, address = ?, updatedAt = ?
   WHERE id = ?`,
  ["A bright neighbourhood gym focused on functional training, strength coaching, and community classes. Open 6am to 11pm, seven days a week.",
   "hello@atlasfitness.test", "+98 21 8800 1200",
   "No. 14, Shariati Street, Tehran", iso(now), ATLAS]
);
await run(
  `UPDATE "TrainerProfile" SET bio = ?, specialty = ?, experienceYears = 8,
     hourlyRate = 4500000, isAvailable = 1, updatedAt = ?
   WHERE id = ?`,
  ["Strength and mobility coach working with beginners and returning athletes. Every block is built around what you can sustain, then progressed with data.",
   "Strength & Mobility", iso(now), TRAINER]
);
await run(
  `UPDATE "TrainerProfile" SET bio = ?, specialty = ?, experienceYears = 5,
     hourlyRate = 3200000, isAvailable = 1, updatedAt = ?
   WHERE id = ?`,
  ["Functional fitness coach focused on conditioning, movement quality, and sustainable habits.",
   "Functional Fitness", iso(now), TRAINER2]
);

const { rows: counts } = await db.execute(`
  SELECT
    (SELECT COUNT(*) FROM "GymMembership" WHERE gymId='${ATLAS}' AND status='ACTIVE') activeMembers,
    (SELECT COUNT(*) FROM "GymMembership" WHERE gymId='${ATLAS}' AND status='PENDING') pending,
    (SELECT COUNT(*) FROM "Subscription"  WHERE gymId='${ATLAS}' AND status='ACTIVE') subs,
    (SELECT COUNT(*) FROM "Payment"       WHERE gymId='${ATLAS}' AND status='SUCCEEDED') paid,
    (SELECT COUNT(*) FROM "TrainingSession") sessions,
    (SELECT COUNT(*) FROM "WorkoutLog") logs
`);
console.log("✓ demo data ready:", counts[0]);

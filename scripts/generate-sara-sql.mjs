#!/usr/bin/env node
// Generate SQL for Sara's programs and Nima's journey

const now = new Date();
function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}
function iso(d) {
  return d.toISOString();
}

const sixMonthsAgo = addMonths(now, -6);

let sql = `-- === SARA EXTENDED PROGRAMS & NIMA 6-MONTH JOURNEY ===
-- Generated at ${now.toISOString()}
-- For trainer Sara (seed-trainer-profile) and member Nima (seed-user-member)

PRAGMA foreign_keys = OFF;

-- Update Nima's TrainerClient to 6 months ago
UPDATE "TrainerClient" SET "startedAt" = '${iso(sixMonthsAgo)}', "status" = 'ACTIVE' WHERE "id" = 'seed-trainer-client';

-- New Users
INSERT OR REPLACE INTO "User" ("id", "name", "email", "password", "role", "status", "createdAt", "updatedAt") VALUES
('seed-user-sahar', 'Sahar Student', 'sahar.student@koogymaa.test', '$2b$12$li2KyHzGXeDmtxXgQ4N/lejAdsX7eMGY.lJWbHXeb5IxfAMXIf/oO', 'USER', 'ACTIVE', '${iso(now)}', '${iso(now)}'),
('seed-user-reza', 'Reza Student', 'reza.student@koogymaa.test', '$2b$12$li2KyHzGXeDmtxXgQ4N/lejAdsX7eMGY.lJWbHXeb5IxfAMXIf/oO', 'USER', 'ACTIVE', '${iso(now)}', '${iso(now)}'),
('seed-user-parisa', 'Parisa Student', 'parisa.student@koogymaa.test', '$2b$12$li2KyHzGXeDmtxXgQ4N/lejAdsX7eMGY.lJWbHXeb5IxfAMXIf/oO', 'USER', 'ACTIVE', '${iso(now)}', '${iso(now)}');

-- Gym Memberships for new students
INSERT OR REPLACE INTO "GymMembership" ("id", "gymId", "userId", "status", "requestedAt", "reviewedAt", "reviewedById", "startedAt", "expiresAt", "createdAt", "updatedAt") VALUES
('gym-membership-seed-user-sahar', 'seed-gym-central', 'seed-user-sahar', 'ACTIVE', '${iso(addMonths(now, -4))}', '${iso(now)}', 'seed-user-trainer', '${iso(addMonths(now, -4))}', '${iso(addMonths(now, 1))}', '${iso(now)}', '${iso(now)}'),
('gym-membership-seed-user-reza', 'seed-gym-central', 'seed-user-reza', 'ACTIVE', '${iso(addMonths(now, -3))}', '${iso(now)}', 'seed-user-trainer', '${iso(addMonths(now, -3))}', '${iso(addMonths(now, 1))}', '${iso(now)}', '${iso(now)}'),
('gym-membership-seed-user-parisa', 'seed-gym-central', 'seed-user-parisa', 'ACTIVE', '${iso(addMonths(now, -1))}', '${iso(now)}', 'seed-user-trainer', '${iso(addMonths(now, -1))}', '${iso(addMonths(now, 1))}', '${iso(now)}', '${iso(now)}'),
('gym-membership-seed-user-pending-member', 'seed-gym-central', 'seed-user-pending-member', 'ACTIVE', '${iso(addMonths(now, -2))}', '${iso(now)}', 'seed-user-trainer', '${iso(addMonths(now, -2))}', '${iso(addMonths(now, 1))}', '${iso(now)}', '${iso(now)}');

-- Trainer Clients
INSERT OR REPLACE INTO "TrainerClient" ("id", "trainerId", "userId", "gymId", "status", "requestedAt", "startedAt", "createdAt", "updatedAt") VALUES
('seed-trainer-client-sahar', 'seed-trainer-profile', 'seed-user-sahar', 'seed-gym-central', 'ACTIVE', '${iso(addMonths(now, -4))}', '${iso(addMonths(now, -4))}', '${iso(now)}', '${iso(now)}'),
('seed-trainer-client-reza', 'seed-trainer-profile', 'seed-user-reza', 'seed-gym-central', 'ACTIVE', '${iso(addMonths(now, -3))}', '${iso(addMonths(now, -3))}', '${iso(now)}', '${iso(now)}'),
('seed-trainer-client-parisa', 'seed-trainer-profile', 'seed-user-parisa', 'seed-gym-central', 'ACTIVE', '${iso(addMonths(now, -1))}', '${iso(addMonths(now, -1))}', '${iso(now)}', '${iso(now)}'),
('seed-trainer-client-arman', 'seed-trainer-profile', 'seed-user-pending-member', 'seed-gym-central', 'ACTIVE', '${iso(addMonths(now, -2))}', '${iso(addMonths(now, -2))}', '${iso(now)}', '${iso(now)}');

-- Workout Plans for Sara
INSERT OR REPLACE INTO "WorkoutPlan" ("id", "trainerId", "gymId", "familyId", "title", "description", "status", "version", "isTemplate", "publishedAt", "legacyExercises", "createdAt", "updatedAt") VALUES
('sara-wp-hypertrophy', 'seed-trainer-profile', 'seed-gym-central', 'sara-wp-hypertrophy', 'حجم عضلانی - هایپرتروفی ۴ روزه', 'برنامه ۴ روزه تخصصی افزایش حجم عضلانی با تمرکز بر فشار مکانیکی. مناسب برای نیما، رضا، آرمان.', 'ACTIVE', 1, 0, '${iso(now)}', '["پرس سینه", "اسکوات", "بارفیکس"]', '${iso(now)}', '${iso(now)}'),
('sara-wp-fatloss-hiit', 'seed-trainer-profile', 'seed-gym-central', 'sara-wp-fatloss-hiit', 'چربی سوزی و کاندیشننگ - HIIT', 'برنامه ۳ روزه HIIT و قدرتی برای چربی سوزی. مناسب برای سحر، پریسا، نیما.', 'ACTIVE', 1, 0, '${iso(now)}', '["برپی", "اسکوات پرشی", "طناب زنی"]', '${iso(now)}', '${iso(now)}'),
('sara-wp-strength-l2', 'seed-trainer-profile', 'seed-gym-central', 'sara-wp-strength-l2', 'قدرت پایه پیشرفته - سطح ۲', 'ادامه Foundation Strength برای افزایش قدرت. مناسب برای نیما و رضا.', 'ACTIVE', 1, 0, '${iso(now)}', '["Back Squat", "Bench Press", "Deadlift"]', '${iso(now)}', '${iso(now)}'),
('sara-wp-mobility', 'seed-trainer-profile', 'seed-gym-central', 'sara-wp-mobility', 'موبیلیتی و ریکاوری', 'برنامه ریکاوری و موبیلیتی تخصص سارا. برای تمام شاگردان.', 'ACTIVE', 1, 0, '${iso(now)}', '["Hip Stretch", "Foam Rolling"]', '${iso(now)}', '${iso(now)}'),
('sara-wp-women-fullbody', 'seed-trainer-profile', 'seed-gym-central', 'sara-wp-women-fullbody', 'فول بادی بانوان - تناسب اندام', 'برنامه ۳ روزه بانوان برای فرم دهی پا و باسن. مناسب سحر و پریسا.', 'ACTIVE', 1, 0, '${iso(now)}', '["Hip Thrust", "Squat", "Kickback"]', '${iso(now)}', '${iso(now)}');

-- Workout Days
INSERT OR REPLACE INTO "WorkoutDay" ("id", "planId", "dayNumber", "name", "notes", "createdAt", "updatedAt") VALUES
('sara-wp-hypertrophy-day-1', 'sara-wp-hypertrophy', 1, 'روز ۱ - سینه و پشت بازو', 'تمرکز بر پرس ها', '${iso(now)}', '${iso(now)}'),
('sara-wp-hypertrophy-day-2', 'sara-wp-hypertrophy', 2, 'روز ۲ - پا و شکم', 'روز سنگین پا', '${iso(now)}', '${iso(now)}'),
('sara-wp-hypertrophy-day-3', 'sara-wp-hypertrophy', 3, 'روز ۳ - پشت و جلو بازو', NULL, '${iso(now)}', '${iso(now)}'),
('sara-wp-hypertrophy-day-4', 'sara-wp-hypertrophy', 4, 'روز ۴ - سرشانه', NULL, '${iso(now)}', '${iso(now)}'),
('sara-wp-fatloss-hiit-day-1', 'sara-wp-fatloss-hiit', 1, 'روز ۱ - HIIT فول بادی', '۳۰ ثانیه کار ۱۵ استراحت', '${iso(now)}', '${iso(now)}'),
('sara-wp-fatloss-hiit-day-2', 'sara-wp-fatloss-hiit', 2, 'روز ۲ - قدرتی چربی سوز', NULL, '${iso(now)}', '${iso(now)}'),
('sara-wp-fatloss-hiit-day-3', 'sara-wp-fatloss-hiit', 3, 'روز ۳ - کور و کاندیشننگ', NULL, '${iso(now)}', '${iso(now)}'),
('sara-wp-strength-l2-day-1', 'sara-wp-strength-l2', 1, 'روز A - پایین تنه', 'سنگین و کنترل شده', '${iso(now)}', '${iso(now)}'),
('sara-wp-strength-l2-day-2', 'sara-wp-strength-l2', 2, 'روز B - بالا تنه', NULL, '${iso(now)}', '${iso(now)}'),
('sara-wp-strength-l2-day-3', 'sara-wp-strength-l2', 3, 'روز C - قدرت کامل', NULL, '${iso(now)}', '${iso(now)}'),
('sara-wp-mobility-day-1', 'sara-wp-mobility', 1, 'موبیلیتی پایین تنه', NULL, '${iso(now)}', '${iso(now)}'),
('sara-wp-mobility-day-2', 'sara-wp-mobility', 2, 'موبیلیتی بالا تنه', NULL, '${iso(now)}', '${iso(now)}'),
('sara-wp-women-fullbody-day-1', 'sara-wp-women-fullbody', 1, 'روز ۱ - پا و باسن', NULL, '${iso(now)}', '${iso(now)}'),
('sara-wp-women-fullbody-day-2', 'sara-wp-women-fullbody', 2, 'روز ۲ - بالا تنه و شکم', NULL, '${iso(now)}', '${iso(now)}'),
('sara-wp-women-fullbody-day-3', 'sara-wp-women-fullbody', 3, 'روز ۳ - فول بادی چربی سوز', NULL, '${iso(now)}', '${iso(now)}');

-- Workout Exercises (simplified, key ones)
INSERT OR REPLACE INTO "WorkoutExercise" ("id", "dayId", "order", "name", "sets", "reps", "restSeconds", "tempo", "createdAt", "updatedAt") VALUES
('sara-wp-hypertrophy-day-1-ex-1', 'sara-wp-hypertrophy-day-1', 1, 'پرس سینه هالتر', 4, '8-10', 90, '2-1-2', '${iso(now)}', '${iso(now)}'),
('sara-wp-hypertrophy-day-1-ex-2', 'sara-wp-hypertrophy-day-1', 2, 'پرس بالا سینه دمبل', 4, '10-12', 75, NULL, '${iso(now)}', '${iso(now)}'),
('sara-wp-hypertrophy-day-1-ex-3', 'sara-wp-hypertrophy-day-1', 3, 'پشت بازو سیم کش', 4, '10-12', 60, NULL, '${iso(now)}', '${iso(now)}'),
('sara-wp-hypertrophy-day-2-ex-1', 'sara-wp-hypertrophy-day-2', 1, 'اسکوات هالتر', 5, '6-8', 120, '3-1-1', '${iso(now)}', '${iso(now)}'),
('sara-wp-hypertrophy-day-2-ex-2', 'sara-wp-hypertrophy-day-2', 2, 'ددلیفت رومانیایی', 4, '8-10', 90, NULL, '${iso(now)}', '${iso(now)}'),
('sara-wp-hypertrophy-day-2-ex-3', 'sara-wp-hypertrophy-day-2', 3, 'پرس پا', 4, '10-12', 90, NULL, '${iso(now)}', '${iso(now)}'),
('sara-wp-hypertrophy-day-3-ex-1', 'sara-wp-hypertrophy-day-3', 1, 'بارفیکس', 4, '6-10', 90, NULL, '${iso(now)}', '${iso(now)}'),
('sara-wp-hypertrophy-day-3-ex-2', 'sara-wp-hypertrophy-day-3', 2, 'زیر بغل هالتر خم', 4, '8-10', 90, NULL, '${iso(now)}', '${iso(now)}'),
('sara-wp-hypertrophy-day-4-ex-1', 'sara-wp-hypertrophy-day-4', 1, 'پرس سرشانه', 4, '8-10', 90, NULL, '${iso(now)}', '${iso(now)}'),
('sara-wp-fatloss-hiit-day-1-ex-1', 'sara-wp-fatloss-hiit-day-1', 1, 'برپی', 5, '15', 45, NULL, '${iso(now)}', '${iso(now)}'),
('sara-wp-fatloss-hiit-day-1-ex-2', 'sara-wp-fatloss-hiit-day-1', 2, 'اسکوات پرشی', 4, '20', 30, NULL, '${iso(now)}', '${iso(now)}'),
('sara-wp-fatloss-hiit-day-1-ex-3', 'sara-wp-fatloss-hiit-day-1', 3, 'طناب زنی', 3, '2 دقیقه', 30, NULL, '${iso(now)}', '${iso(now)}'),
('sara-wp-strength-l2-day-1-ex-1', 'sara-wp-strength-l2-day-1', 1, 'Back Squat', 5, '5', 180, '3-1-1', '${iso(now)}', '${iso(now)}'),
('sara-wp-strength-l2-day-1-ex-2', 'sara-wp-strength-l2-day-1', 2, 'Romanian Deadlift', 4, '6', 120, NULL, '${iso(now)}', '${iso(now)}'),
('sara-wp-strength-l2-day-2-ex-1', 'sara-wp-strength-l2-day-2', 1, 'Bench Press', 5, '5', 180, NULL, '${iso(now)}', '${iso(now)}'),
('sara-wp-strength-l2-day-3-ex-1', 'sara-wp-strength-l2-day-3', 1, 'Deadlift', 5, '3', 180, NULL, '${iso(now)}', '${iso(now)}'),
('sara-wp-mobility-day-1-ex-1', 'sara-wp-mobility-day-1', 1, 'Hip 90/90 Stretch', 2, '60s هر طرف', 15, NULL, '${iso(now)}', '${iso(now)}'),
('sara-wp-mobility-day-1-ex-2', 'sara-wp-mobility-day-1', 2, 'Deep Squat Hold', 3, '45s', 30, NULL, '${iso(now)}', '${iso(now)}'),
('sara-wp-women-fullbody-day-1-ex-1', 'sara-wp-women-fullbody-day-1', 1, 'Hip Thrust', 4, '12', 75, NULL, '${iso(now)}', '${iso(now)}'),
('sara-wp-women-fullbody-day-1-ex-2', 'sara-wp-women-fullbody-day-1', 2, 'Squat', 4, '12', 75, NULL, '${iso(now)}', '${iso(now)}');

-- Diet Plans
INSERT OR REPLACE INTO "DietPlan" ("id", "trainerId", "gymId", "familyId", "title", "description", "dietaryRestrictions", "dailyCalories", "status", "version", "isTemplate", "publishedAt", "legacyMeals", "createdAt", "updatedAt") VALUES
('sara-dp-bulk-3000', 'seed-trainer-profile', 'seed-gym-central', 'sara-dp-bulk-3000', 'رژیم افزایش وزن سالم - ۳۰۰۰ کالری', 'افزایش حجم با ۳۰۰۰ کالری و ۱۸۰ گرم پروتئین - مناسب رضا و آرمان', 'پروتئین بالا', 3000, 'ACTIVE', 1, 0, '${iso(now)}', '["صبحانه","ناهار","شام"]', '${iso(now)}', '${iso(now)}'),
('sara-dp-cut-2000', 'seed-trainer-profile', 'seed-gym-central', 'sara-dp-cut-2000', 'رژیم کات و چربی سوزی - ۲۰۰۰ کالری', 'کات با پروتئین بالا برای نیما ماه ۳-۶ - حفظ عضله و چربی سوزی', 'کربوهیدرات کنترل شده', 2000, 'ACTIVE', 1, 0, '${iso(now)}', '["صبحانه","ناهار","شام"]', '${iso(now)}', '${iso(now)}'),
('sara-dp-women-1800', 'seed-trainer-profile', 'seed-gym-central', 'sara-dp-women-1800', 'رژیم متعادل بانوان - ۱۸۰۰ کالری', '۱۸۰۰ کالری متعادل برای سحر و پریسا با آهن و کلسیم کافی', 'متعادل بانوان', 1800, 'ACTIVE', 1, 0, '${iso(now)}', '["صبحانه","ناهار","شام"]', '${iso(now)}', '${iso(now)}'),
('sara-dp-maintain-2400', 'seed-trainer-profile', 'seed-gym-central', 'sara-dp-maintain-2400', 'رژیم نگهدارنده - ۲۴۰۰ کالری', 'نگهدارنده متعادل برای تمام شاگردان در فاز تثبیت', 'متعادل', 2400, 'ACTIVE', 1, 0, '${iso(now)}', '["صبحانه","ناهار","شام"]', '${iso(now)}', '${iso(now)}');

-- Diet Days
INSERT OR REPLACE INTO "DietDay" ("id", "planId", "dayNumber", "name", "targetCalories", "targetProtein", "targetCarbs", "targetFat", "createdAt", "updatedAt") VALUES
('sara-dp-bulk-3000-day-1', 'sara-dp-bulk-3000', 1, 'روز تمرین', 3000, 180, 380, 85, '${iso(now)}', '${iso(now)}'),
('sara-dp-cut-2000-day-1', 'sara-dp-cut-2000', 1, 'روز کات', 2000, 170, 180, 65, '${iso(now)}', '${iso(now)}'),
('sara-dp-women-1800-day-1', 'sara-dp-women-1800', 1, 'روز متعادل', 1800, 110, 200, 60, '${iso(now)}', '${iso(now)}'),
('sara-dp-maintain-2400-day-1', 'sara-dp-maintain-2400', 1, 'روز نگهدارنده', 2400, 140, 300, 70, '${iso(now)}', '${iso(now)}');

-- Meals
INSERT OR REPLACE INTO "Meal" ("id", "dayId", "order", "name", "scheduledTime", "createdAt", "updatedAt") VALUES
('sara-dp-bulk-3000-day-1-meal-1', 'sara-dp-bulk-3000-day-1', 1, 'صبحانه ۸:۰۰', '08:00', '${iso(now)}', '${iso(now)}'),
('sara-dp-bulk-3000-day-1-meal-2', 'sara-dp-bulk-3000-day-1', 2, 'ناهار ۱۳:۳۰', '13:30', '${iso(now)}', '${iso(now)}'),
('sara-dp-bulk-3000-day-1-meal-3', 'sara-dp-bulk-3000-day-1', 3, 'شام ۲۰:۰۰', '20:00', '${iso(now)}', '${iso(now)}'),
('sara-dp-cut-2000-day-1-meal-1', 'sara-dp-cut-2000-day-1', 1, 'صبحانه', '08:00', '${iso(now)}', '${iso(now)}'),
('sara-dp-cut-2000-day-1-meal-2', 'sara-dp-cut-2000-day-1', 2, 'ناهار', '13:00', '${iso(now)}', '${iso(now)}'),
('sara-dp-cut-2000-day-1-meal-3', 'sara-dp-cut-2000-day-1', 3, 'شام', '20:00', '${iso(now)}', '${iso(now)}'),
('sara-dp-women-1800-day-1-meal-1', 'sara-dp-women-1800-day-1', 1, 'صبحانه', '08:30', '${iso(now)}', '${iso(now)}'),
('sara-dp-women-1800-day-1-meal-2', 'sara-dp-women-1800-day-1', 2, 'ناهار', '13:30', '${iso(now)}', '${iso(now)}'),
('sara-dp-women-1800-day-1-meal-3', 'sara-dp-women-1800-day-1', 3, 'شام', '19:30', '${iso(now)}', '${iso(now)}'),
('sara-dp-maintain-2400-day-1-meal-1', 'sara-dp-maintain-2400-day-1', 1, 'صبحانه', '08:00', '${iso(now)}', '${iso(now)}'),
('sara-dp-maintain-2400-day-1-meal-2', 'sara-dp-maintain-2400-day-1', 2, 'ناهار', '13:00', '${iso(now)}', '${iso(now)}'),
('sara-dp-maintain-2400-day-1-meal-3', 'sara-dp-maintain-2400-day-1', 3, 'شام', '20:00', '${iso(now)}', '${iso(now)}');

-- Food Items
INSERT OR REPLACE INTO "FoodItem" ("id", "mealId", "order", "name", "quantity", "unit", "calories", "protein", "carbs", "fat", "createdAt", "updatedAt") VALUES
('sara-dp-bulk-3000-day-1-meal-1-food-1', 'sara-dp-bulk-3000-day-1-meal-1', 1, 'تخم مرغ', 3, 'عدد', 210, 18, 1, 15, '${iso(now)}', '${iso(now)}'),
('sara-dp-bulk-3000-day-1-meal-1-food-2', 'sara-dp-bulk-3000-day-1-meal-1', 2, 'نان تست', 2, 'برش', 160, 6, 30, 2, '${iso(now)}', '${iso(now)}'),
('sara-dp-bulk-3000-day-1-meal-1-food-3', 'sara-dp-bulk-3000-day-1-meal-1', 3, 'موز', 1, 'عدد', 105, 1, 27, 0, '${iso(now)}', '${iso(now)}'),
('sara-dp-bulk-3000-day-1-meal-2-food-1', 'sara-dp-bulk-3000-day-1-meal-2', 1, 'سینه مرغ', 200, 'g', 330, 62, 0, 7, '${iso(now)}', '${iso(now)}'),
('sara-dp-bulk-3000-day-1-meal-2-food-2', 'sara-dp-bulk-3000-day-1-meal-2', 2, 'برنج', 300, 'g', 390, 7, 84, 1, '${iso(now)}', '${iso(now)}'),
('sara-dp-bulk-3000-day-1-meal-3-food-1', 'sara-dp-bulk-3000-day-1-meal-3', 1, 'گوشت قرمز', 180, 'g', 320, 45, 0, 14, '${iso(now)}', '${iso(now)}'),
('sara-dp-cut-2000-day-1-meal-1-food-1', 'sara-dp-cut-2000-day-1-meal-1', 1, 'سفیده تخم مرغ', 4, 'عدد', 70, 14, 1, 0, '${iso(now)}', '${iso(now)}'),
('sara-dp-cut-2000-day-1-meal-2-food-1', 'sara-dp-cut-2000-day-1-meal-2', 1, 'سینه مرغ', 180, 'g', 300, 55, 0, 6, '${iso(now)}', '${iso(now)}'),
('sara-dp-cut-2000-day-1-meal-3-food-1', 'sara-dp-cut-2000-day-1-meal-3', 1, 'ماهی سالمون', 150, 'g', 280, 30, 0, 16, '${iso(now)}', '${iso(now)}'),
('sara-dp-women-1800-day-1-meal-1-food-1', 'sara-dp-women-1800-day-1-meal-1', 1, 'تخم مرغ', 2, 'عدد', 140, 12, 1, 10, '${iso(now)}', '${iso(now)}'),
('sara-dp-women-1800-day-1-meal-2-food-1', 'sara-dp-women-1800-day-1-meal-2', 1, 'سینه مرغ', 120, 'g', 200, 36, 0, 4, '${iso(now)}', '${iso(now)}'),
('sara-dp-women-1800-day-1-meal-3-food-1', 'sara-dp-women-1800-day-1-meal-3', 1, 'ماهی', 120, 'g', 180, 26, 0, 8, '${iso(now)}', '${iso(now)}'),
('sara-dp-maintain-2400-day-1-meal-1-food-1', 'sara-dp-maintain-2400-day-1-meal-1', 1, 'نان سنگک', 1, 'برش', 120, 4, 24, 1, '${iso(now)}', '${iso(now)}'),
('sara-dp-maintain-2400-day-1-meal-2-food-1', 'sara-dp-maintain-2400-day-1-meal-2', 1, 'چلو کباب', 1, 'پرس', 600, 35, 60, 25, '${iso(now)}', '${iso(now)}');

-- Workout Assignments
INSERT OR REPLACE INTO "WorkoutAssignment" ("id", "planId", "userId", "trainerClientId", "status", "assignedAt", "startDate", "createdAt", "updatedAt") VALUES
('wa-sara-wp-strength-l2-seed-user-member', 'sara-wp-strength-l2', 'seed-user-member', 'seed-trainer-client', 'ACTIVE', '${iso(now)}', '${iso(now)}', '${iso(now)}', '${iso(now)}'),
('wa-sara-wp-strength-l2-seed-user-reza', 'sara-wp-strength-l2', 'seed-user-reza', 'seed-trainer-client-reza', 'ACTIVE', '${iso(now)}', '${iso(now)}', '${iso(now)}', '${iso(now)}'),
('wa-sara-wp-hypertrophy-seed-user-member', 'sara-wp-hypertrophy', 'seed-user-member', 'seed-trainer-client', 'ACTIVE', '${iso(now)}', '${iso(now)}', '${iso(now)}', '${iso(now)}'),
('wa-sara-wp-hypertrophy-seed-user-reza', 'sara-wp-hypertrophy', 'seed-user-reza', 'seed-trainer-client-reza', 'ACTIVE', '${iso(now)}', '${iso(now)}', '${iso(now)}', '${iso(now)}'),
('wa-sara-wp-hypertrophy-seed-user-pending-member', 'sara-wp-hypertrophy', 'seed-user-pending-member', 'seed-trainer-client-arman', 'ACTIVE', '${iso(now)}', '${iso(now)}', '${iso(now)}', '${iso(now)}'),
('wa-sara-wp-fatloss-hiit-seed-user-member', 'sara-wp-fatloss-hiit', 'seed-user-member', 'seed-trainer-client', 'ACTIVE', '${iso(now)}', '${iso(now)}', '${iso(now)}', '${iso(now)}'),
('wa-sara-wp-fatloss-hiit-seed-user-sahar', 'sara-wp-fatloss-hiit', 'seed-user-sahar', 'seed-trainer-client-sahar', 'ACTIVE', '${iso(now)}', '${iso(now)}', '${iso(now)}', '${iso(now)}'),
('wa-sara-wp-fatloss-hiit-seed-user-parisa', 'sara-wp-fatloss-hiit', 'seed-user-parisa', 'seed-trainer-client-parisa', 'ACTIVE', '${iso(now)}', '${iso(now)}', '${iso(now)}', '${iso(now)}'),
('wa-sara-wp-women-fullbody-seed-user-sahar', 'sara-wp-women-fullbody', 'seed-user-sahar', 'seed-trainer-client-sahar', 'ACTIVE', '${iso(now)}', '${iso(now)}', '${iso(now)}', '${iso(now)}'),
('wa-sara-wp-women-fullbody-seed-user-parisa', 'sara-wp-women-fullbody', 'seed-user-parisa', 'seed-trainer-client-parisa', 'ACTIVE', '${iso(now)}', '${iso(now)}', '${iso(now)}', '${iso(now)}'),
('wa-sara-wp-mobility-seed-user-member', 'sara-wp-mobility', 'seed-user-member', 'seed-trainer-client', 'ACTIVE', '${iso(now)}', '${iso(now)}', '${iso(now)}', '${iso(now)}'),
('wa-sara-wp-mobility-seed-user-sahar', 'sara-wp-mobility', 'seed-user-sahar', 'seed-trainer-client-sahar', 'ACTIVE', '${iso(now)}', '${iso(now)}', '${iso(now)}', '${iso(now)}'),
('wa-sara-wp-mobility-seed-user-reza', 'sara-wp-mobility', 'seed-user-reza', 'seed-trainer-client-reza', 'ACTIVE', '${iso(now)}', '${iso(now)}', '${iso(now)}', '${iso(now)}'),
('wa-sara-wp-mobility-seed-user-parisa', 'sara-wp-mobility', 'seed-user-parisa', 'seed-trainer-client-parisa', 'ACTIVE', '${iso(now)}', '${iso(now)}', '${iso(now)}', '${iso(now)}'),
('wa-sara-wp-mobility-seed-user-pending-member', 'sara-wp-mobility', 'seed-user-pending-member', 'seed-trainer-client-arman', 'ACTIVE', '${iso(now)}', '${iso(now)}', '${iso(now)}', '${iso(now)}');

-- Diet Assignments
INSERT OR REPLACE INTO "DietAssignment" ("id", "planId", "userId", "trainerClientId", "status", "assignedAt", "startDate", "createdAt", "updatedAt") VALUES
('da-sara-dp-bulk-3000-seed-user-reza', 'sara-dp-bulk-3000', 'seed-user-reza', 'seed-trainer-client-reza', 'ACTIVE', '${iso(now)}', '${iso(now)}', '${iso(now)}', '${iso(now)}'),
('da-sara-dp-bulk-3000-seed-user-pending-member', 'sara-dp-bulk-3000', 'seed-user-pending-member', 'seed-trainer-client-arman', 'ACTIVE', '${iso(now)}', '${iso(now)}', '${iso(now)}', '${iso(now)}'),
('da-sara-dp-cut-2000-seed-user-member', 'sara-dp-cut-2000', 'seed-user-member', 'seed-trainer-client', 'ACTIVE', '${iso(now)}', '${iso(now)}', '${iso(now)}', '${iso(now)}'),
('da-sara-dp-women-1800-seed-user-sahar', 'sara-dp-women-1800', 'seed-user-sahar', 'seed-trainer-client-sahar', 'ACTIVE', '${iso(now)}', '${iso(now)}', '${iso(now)}', '${iso(now)}'),
('da-sara-dp-women-1800-seed-user-parisa', 'sara-dp-women-1800', 'seed-user-parisa', 'seed-trainer-client-parisa', 'ACTIVE', '${iso(now)}', '${iso(now)}', '${iso(now)}', '${iso(now)}'),
('da-sara-dp-maintain-2400-seed-user-member', 'sara-dp-maintain-2400', 'seed-user-member', 'seed-trainer-client', 'ACTIVE', '${iso(now)}', '${iso(now)}', '${iso(now)}', '${iso(now)}'),
('da-sara-dp-maintain-2400-seed-user-sahar', 'sara-dp-maintain-2400', 'seed-user-sahar', 'seed-trainer-client-sahar', 'ACTIVE', '${iso(now)}', '${iso(now)}', '${iso(now)}', '${iso(now)}'),
('da-sara-dp-maintain-2400-seed-user-reza', 'sara-dp-maintain-2400', 'seed-user-reza', 'seed-trainer-client-reza', 'ACTIVE', '${iso(now)}', '${iso(now)}', '${iso(now)}', '${iso(now)}'),
('da-sara-dp-maintain-2400-seed-user-parisa', 'sara-dp-maintain-2400', 'seed-user-parisa', 'seed-trainer-client-parisa', 'ACTIVE', '${iso(now)}', '${iso(now)}', '${iso(now)}', '${iso(now)}'),
('da-sara-dp-maintain-2400-seed-user-pending-member', 'sara-dp-maintain-2400', 'seed-user-pending-member', 'seed-trainer-client-arman', 'ACTIVE', '${iso(now)}', '${iso(now)}', '${iso(now)}', '${iso(now)}');

-- Nima 6-month body measurements
INSERT OR REPLACE INTO "BodyMeasurement" ("id", "userId", "recordedAt", "weightKg", "bodyFatPercent", "waistCm", "chestCm", "armCm", "hipsCm", "thighCm", "notes", "createdAt", "updatedAt") VALUES
('nima-m-1', 'seed-user-member', '${iso(addMonths(now, -6))}', 85.2, 22.5, 92, 100, 33, 102, 60, 'ماه ۱ - شروع مسیر، وزن اولیه ۸۵.۲ کیلو', '${iso(now)}', '${iso(now)}'),
('nima-m-2', 'seed-user-member', '${iso(addMonths(now, -5))}', 84.0, 21.0, 90, 100.5, 33.5, 101, 59.5, 'ماه ۲ - کاهش ۱.۲ کیلو، بهبود فرم اسکوات', '${iso(now)}', '${iso(now)}'),
('nima-m-3', 'seed-user-member', '${iso(addMonths(now, -4))}', 82.8, 19.8, 88.5, 101, 34, 100, 59, 'ماه ۳ - پایان فاز قدرت پایه، قدرت ۲۰٪ افزایش', '${iso(now)}', '${iso(now)}'),
('nima-m-4', 'seed-user-member', '${iso(addMonths(now, -3))}', 81.5, 18.5, 87, 101.5, 34.5, 99, 58.5, 'ماه ۴ - شروع فاز هایپرتروفی، حجم عضلانی', '${iso(now)}', '${iso(now)}'),
('nima-m-5', 'seed-user-member', '${iso(addMonths(now, -2))}', 80.8, 17.2, 85.5, 102, 35, 98, 58, 'ماه ۵ - فاز کات شروع شد، رژیم ۲۰۰۰ کالری', '${iso(now)}', '${iso(now)}'),
('nima-m-6', 'seed-user-member', '${iso(now)}', 80.0, 16.0, 84, 102.5, 35.5, 97, 57.5, 'ماه ۶ - الان: ۵.۲ کیلو کاهش وزن، ۶.۵٪ چربی کمتر، ۲.۵ سانت افزایش بازو', '${iso(now)}', '${iso(now)}');

-- Progress Photos for Nima
INSERT OR REPLACE INTO "ProgressPhoto" ("id", "userId", "measurementId", "imageUrl", "pose", "createdAt") VALUES
('nima-photo-m1', 'seed-user-member', 'nima-m-1', 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e', 'Front - Month 1 - شروع', '${iso(addMonths(now, -6))}'),
('nima-photo-m3', 'seed-user-member', 'nima-m-3', 'https://images.unsplash.com/photo-1594381898411-846e7d193883', 'Front - Month 3 - پایان قدرت', '${iso(addMonths(now, -4))}'),
('nima-photo-m6', 'seed-user-member', 'nima-m-6', 'https://images.unsplash.com/photo-1534367610401-9f5ed68180aa', 'Front - Month 6 - الان', '${iso(now)}');

-- Feedback for Nima journey
INSERT OR REPLACE INTO "Feedback" ("id", "authorId", "recipientId", "trainerClientId", "type", "content", "createdAt", "updatedAt") VALUES
('nima-fb-m1', 'seed-user-trainer', 'seed-user-member', 'seed-trainer-client', 'PROGRESS', 'نیما جان ماه اول عالی بود! فرم اسکواتت خیلی بهتر شده. ادامه بده. 💪', '${iso(addMonths(now, -5))}', '${iso(addMonths(now, -5))}'),
('nima-fb-m2', 'seed-user-trainer', 'seed-user-member', 'seed-trainer-client', 'PROGRESS', 'ماه دوم: قدرتت ۲۰٪ افزایش داشته. وزنه‌ها رو می‌تونی بیشتر کنی.', '${iso(addMonths(now, -4))}', '${iso(addMonths(now, -4))}'),
('nima-fb-m3', 'seed-user-trainer', 'seed-user-member', 'seed-trainer-client', 'PROGRESS', 'ماه سوم: پایان فاز قدرت پایه. آماده‌ای برای هایپرتروفی؟ برنامه جدیدت رو گذاشتم.', '${iso(addMonths(now, -3))}', '${iso(addMonths(now, -3))}'),
('nima-fb-m4', 'seed-user-trainer', 'seed-user-member', 'seed-trainer-client', 'PROGRESS', 'ماه چهارم: حجم عضلانیت داره میاد! سینه و بازوهات فرق کرده.', '${iso(addMonths(now, -2))}', '${iso(addMonths(now, -2))}'),
('nima-fb-m5', 'seed-user-trainer', 'seed-user-member', 'seed-trainer-client', 'PROGRESS', 'ماه پنجم: وارد فاز کات شدیم. رژیم ۲۰۰۰ کالری رو دقیق رعایت کن.', '${iso(addMonths(now, -1))}', '${iso(addMonths(now, -1))}'),
('nima-fb-m6', 'seed-user-trainer', 'seed-user-member', 'seed-trainer-client', 'PROGRESS', 'ماه ششم: نیما تو الان ۶ ماهه شاگرد منی! ۵.۲ کیلو چربی کم کردی و ۲.۵ سانت به بازوت اضافه شده. بهت افتخار می‌کنم 💪', '${iso(now)}', '${iso(now)}');

-- Notifications for Nima
INSERT OR REPLACE INTO "Notification" ("id", "userId", "type", "title", "message", "href", "createdAt") VALUES
('nima-notif-1', 'seed-user-member', 'PLAN_ASSIGNED', 'برنامه جدید قدرت سطح ۲', 'سارا برنامه قدرت پیشرفته سطح ۲ رو برات فعال کرد - ادامه مسیر ۶ ماهه', '/user/workouts', '${iso(addMonths(now, -3))}'),
('nima-notif-2', 'seed-user-member', 'PLAN_ASSIGNED', 'برنامه هایپرتروفی', 'برنامه ۴ روزه حجم عضلانی برات فعال شد', '/user/workouts', '${iso(addMonths(now, -2))}'),
('nima-notif-3', 'seed-user-member', 'PLAN_ASSIGNED', 'رژیم کات شروع شد', 'رژیم ۲۰۰۰ کالری کات برات فعال شد - ۶ هفته تا نتیجه نهایی', '/user/nutrition', '${iso(addMonths(now, -1))}'),
('nima-notif-4', 'seed-user-member', 'GENERAL', '۶ ماهگی شاگردی! 🎉', 'تبریک! ۶ ماهه که با سارا تمرین می‌کنی. مسیرت رو ببین - ۵.۲ کیلو کاهش وزن', '/user/progress', '${iso(now)}'),
('nima-notif-sara-1', 'seed-user-sahar', 'PLAN_ASSIGNED', 'برنامه بانوان فعال شد', 'سارا برنامه فول بادی بانوان و رژیم ۱۸۰۰ کالری رو برات فعال کرد', '/user/workouts', '${iso(now)}'),
('nima-notif-reza-1', 'seed-user-reza', 'PLAN_ASSIGNED', 'برنامه حجمی فعال شد', 'سارا برنامه هایپرتروفی ۴ روزه و رژیم ۳۰۰۰ کالری رو برات فعال کرد', '/user/workouts', '${iso(now)}');

PRAGMA foreign_keys = ON;
`;

console.log(sql);

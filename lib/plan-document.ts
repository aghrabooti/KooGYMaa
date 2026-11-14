import { toFaDigits } from "@/lib/fa";

/** The two kinds of structured plans that can be printed as a PDF. */
export type PlanKind = "workouts" | "nutrition";

export type PlanWorkoutExercise = {
  name: string;
  sets: number | null;
  reps: string | null;
  weight: string | null;
  tempo: string | null;
  restSeconds: number | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  notes: string | null;
};

export type PlanWorkoutDay = {
  id: string;
  dayNumber: number;
  name: string;
  notes: string | null;
  exercises: PlanWorkoutExercise[];
};

export type PlanFoodItem = {
  name: string;
  quantity: number | null;
  unit: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  notes: string | null;
};

export type PlanMeal = {
  id: string;
  name: string;
  scheduledTime: string | null;
  notes: string | null;
  foodItems: PlanFoodItem[];
};

export type PlanNutritionDay = {
  id: string;
  dayNumber: number;
  name: string;
  notes: string | null;
  targetCalories: number | null;
  targetProtein: number | null;
  targetCarbs: number | null;
  targetFat: number | null;
  meals: PlanMeal[];
};

type DocumentBase = {
  planId: string;
  title: string;
  description: string | null;
  status: string;
  version: number;
  isTemplate: boolean;
  gymName: string | null;
  trainerName: string;
  trainerSpecialty: string | null;
  studentName: string;
  studentEmail: string | null;
  /** Stable identifier used in the download name so per-student exports do not collide. */
  studentId: string | null;
  /** ISO timestamp — the Jalali issue date is derived from it on render. */
  issuedAt: string;
  startDate: string | null;
  endDate: string | null;
  /** No student was chosen: this is a generic trainer preview. */
  genericPreview: boolean;
};

export type WorkoutDocument = DocumentBase & {
  kind: "workouts";
  days: PlanWorkoutDay[];
};

export type NutritionDocument = DocumentBase & {
  kind: "nutrition";
  dailyCalories: number | null;
  dietaryRestrictions: string | null;
  days: PlanNutritionDay[];
};

export type PlanDocumentData = WorkoutDocument | NutritionDocument;

export const PLAN_KIND_LABEL: Record<PlanKind, string> = {
  workouts: "برنامهٔ تمرینی",
  nutrition: "برنامهٔ تغذیه",
};

export const PLAN_KIND_SHORT: Record<PlanKind, string> = {
  workouts: "تمرین",
  nutrition: "تغذیه",
};

export const PLAN_STATUS_LABEL: Record<string, string> = {
  DRAFT: "پیشنویس",
  ACTIVE: "فعال",
  ARCHIVED: "بایگانیشده",
};

/**
 * Jalali date in Persian digits, computed in Tehran time (UTC+03:30).
 * The header of every exported PDF carries this value.
 */
export function formatPersianDate(value: Date | string | number): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    timeZone: "Asia/Tehran",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatPersianDateTime(value: Date | string | number): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const day = formatPersianDate(date);
  const time = new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `${day}، ساعت ${time}`;
}

export function faNumber(value: number | string | null | undefined, fallback = "—"): string {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "number") return new Intl.NumberFormat("fa-IR").format(value);
  return toFaDigits(String(value));
}

/** Stable, ASCII-safe download name (Persian file names break some browsers). */
export function pdfFilename(doc: PlanDocumentData): string {
  const kind = doc.kind === "workouts" ? "workout" : "nutrition";
  const planSuffix = doc.planId.replace(/[^a-zA-Z0-9]/g, "").slice(-8) || "plan";
  const studentSuffix = doc.studentId
    ? `-${doc.studentId.replace(/[^a-zA-Z0-9]/g, "").slice(-8) || "student"}`
    : "";
  return `KooGYMaa-${kind}-${planSuffix}${studentSuffix}.pdf`;
}

export function planTotals(doc: PlanDocumentData): Array<{ label: string; value: string }> {
  if (doc.kind === "workouts") {
    const exercises = doc.days.reduce((sum, day) => sum + day.exercises.length, 0);
    const sets = doc.days.reduce(
      (sum, day) => sum + day.exercises.reduce((inner, exercise) => inner + (exercise.sets ?? 0), 0),
      0,
    );
    return [
      { label: "روزهای تمرین", value: faNumber(doc.days.length) },
      { label: "حرکتهای ثبتشده", value: faNumber(exercises) },
      { label: "مجموع ستثها", value: faNumber(sets) },
      { label: "شمارهٔ نسخه", value: faNumber(doc.version) },
    ];
  }
  const meals = doc.days.reduce((sum, day) => sum + day.meals.length, 0);
  const foods = doc.days.reduce(
    (sum, day) => sum + day.meals.reduce((inner, meal) => inner + meal.foodItems.length, 0),
    0,
  );
  return [
    { label: "روزهای برنامه", value: faNumber(doc.days.length) },
    { label: "وعدههای غذایی", value: faNumber(meals) },
    { label: "مواد غذایی", value: faNumber(foods) },
    { label: "هدف کالری روزانه", value: doc.dailyCalories ? faNumber(doc.dailyCalories) : "منعطف" },
  ];
}

/** Compact one-line header repeated on every PDF page after the first. */
export function runningHeaderLine(doc: PlanDocumentData): string {
  return `${PLAN_KIND_LABEL[doc.kind]} «${doc.title}» · شاگرد: ${doc.studentName} · مربی: ${doc.trainerName} · ${formatPersianDate(doc.issuedAt)}`;
}

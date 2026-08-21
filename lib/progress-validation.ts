type Success<T> = { data: T; ok: true };
type Failure = { error: string; ok: false };
type Result<T> = Success<T> | Failure;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function text(value: unknown, max: number) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function numberValue(value: unknown) { if (value === null || value === undefined || value === "") return null; const parsed = Number(value); return Number.isFinite(parsed) ? parsed : Number.NaN; }
function intValue(value: unknown) { const parsed = numberValue(value); return parsed === null || Number.isInteger(parsed) ? parsed : Number.NaN; }

export function validateStartLog(value: unknown): Result<{ assignmentId: string; dayId: string }> {
  if (!record(value)) return { error: "Invalid log request.", ok: false };
  const assignmentId = text(value.assignmentId, 100); const dayId = text(value.dayId, 100);
  if (!assignmentId || !dayId) return { error: "Choose an assigned plan day.", ok: false };
  return { data: { assignmentId, dayId }, ok: true };
}

export type ExerciseLogInput = { exerciseId: string; completed: boolean; actualSets: number | null; actualReps: string | null; actualWeight: string | null; actualDurationSeconds: number | null; actualDistanceMeters: number | null; rpe: number | null; notes: string | null };

export function validateWorkoutLogUpdate(value: unknown): Result<{ status?: "IN_PROGRESS" | "COMPLETED" | "SKIPPED"; perceivedEffort?: number | null; notes?: string | null; exercises?: ExerciseLogInput[] }> {
  if (!record(value)) return { error: "Invalid workout log.", ok: false };
  const data: { status?: "IN_PROGRESS" | "COMPLETED" | "SKIPPED"; perceivedEffort?: number | null; notes?: string | null; exercises?: ExerciseLogInput[] } = {};
  if (value.status !== undefined) { if (!["IN_PROGRESS", "COMPLETED", "SKIPPED"].includes(String(value.status))) return { error: "Choose a valid workout status.", ok: false }; data.status = value.status as typeof data.status; }
  if (value.perceivedEffort !== undefined) { const effort = intValue(value.perceivedEffort); if (effort !== null && (!Number.isInteger(effort) || effort < 1 || effort > 10)) return { error: "Effort must be between 1 and 10.", ok: false }; data.perceivedEffort = effort; }
  if (value.notes !== undefined) data.notes = text(value.notes, 1000) || null;
  if (value.exercises !== undefined) {
    if (!Array.isArray(value.exercises) || value.exercises.length > 50) return { error: "Exercise log is invalid.", ok: false };
    const exercises: ExerciseLogInput[] = [];
    for (const item of value.exercises) {
      if (!record(item)) return { error: "Exercise log is invalid.", ok: false };
      const exerciseId = text(item.exerciseId, 100); const actualSets = intValue(item.actualSets); const actualDurationSeconds = intValue(item.actualDurationSeconds); const actualDistanceMeters = intValue(item.actualDistanceMeters); const rpe = intValue(item.rpe);
      if (!exerciseId) return { error: "Exercise reference is missing.", ok: false };
      if ([actualSets, actualDurationSeconds, actualDistanceMeters].some((entry) => entry !== null && (!Number.isInteger(entry) || entry < 0))) return { error: "Exercise values cannot be negative.", ok: false };
      if (rpe !== null && (!Number.isInteger(rpe) || rpe < 1 || rpe > 10)) return { error: "Exercise RPE must be between 1 and 10.", ok: false };
      exercises.push({ exerciseId, completed: item.completed === true, actualSets, actualReps: text(item.actualReps, 80) || null, actualWeight: text(item.actualWeight, 80) || null, actualDurationSeconds, actualDistanceMeters, rpe, notes: text(item.notes, 500) || null });
    }
    data.exercises = exercises;
  }
  if (!Object.keys(data).length) return { error: "Provide workout progress to update.", ok: false };
  return { data, ok: true };
}

export type MealLogInput = { mealId: string; completed: boolean; actualPortion: string | null; substitution: string | null; notes: string | null };
export function validateNutritionLogUpdate(value: unknown): Result<{ completed: boolean; hungerRating: number | null; energyRating: number | null; notes: string | null; meals: MealLogInput[] }> {
  if (!record(value) || !Array.isArray(value.meals) || value.meals.length > 30) return { error: "Invalid nutrition log.", ok: false };
  const hungerRating = intValue(value.hungerRating); const energyRating = intValue(value.energyRating);
  if ([hungerRating, energyRating].some((entry) => entry !== null && (!Number.isInteger(entry) || entry < 1 || entry > 10))) return { error: "Hunger and energy ratings must be between 1 and 10.", ok: false };
  const meals: MealLogInput[] = [];
  for (const item of value.meals) {
    if (!record(item)) return { error: "Meal log is invalid.", ok: false };
    const mealId = text(item.mealId, 100); if (!mealId) return { error: "Meal reference is missing.", ok: false };
    meals.push({ mealId, completed: item.completed === true, actualPortion: text(item.actualPortion, 100) || null, substitution: text(item.substitution, 300) || null, notes: text(item.notes, 500) || null });
  }
  return { data: { completed: value.completed === true, hungerRating, energyRating, notes: text(value.notes, 1000) || null, meals }, ok: true };
}

export function validateMeasurement(value: unknown): Result<{ recordedAt: Date; weightKg: number | null; bodyFatPercent: number | null; waistCm: number | null; chestCm: number | null; armCm: number | null; hipsCm: number | null; thighCm: number | null; notes: string | null }> {
  if (!record(value)) return { error: "Invalid measurement.", ok: false };
  const recordedAt = value.recordedAt ? new Date(String(value.recordedAt)) : new Date(); if (Number.isNaN(recordedAt.getTime())) return { error: "Measurement date is invalid.", ok: false };
  const values = { weightKg: numberValue(value.weightKg), bodyFatPercent: numberValue(value.bodyFatPercent), waistCm: numberValue(value.waistCm), chestCm: numberValue(value.chestCm), armCm: numberValue(value.armCm), hipsCm: numberValue(value.hipsCm), thighCm: numberValue(value.thighCm) };
  if (values.weightKg !== null && (!Number.isFinite(values.weightKg) || values.weightKg < 1 || values.weightKg > 500)) return { error: "Weight must be between 1 and 500 kg.", ok: false };
  if (values.bodyFatPercent !== null && (!Number.isFinite(values.bodyFatPercent) || values.bodyFatPercent < 0 || values.bodyFatPercent > 100)) return { error: "Body fat must be between 0 and 100%.", ok: false };
  if ([values.waistCm, values.chestCm, values.armCm, values.hipsCm, values.thighCm].some((entry) => entry !== null && (!Number.isFinite(entry) || entry <= 0))) return { error: "Body measurements must be positive.", ok: false };
  if (Object.values(values).every((entry) => entry === null)) return { error: "Add at least one measurement value.", ok: false };
  return { data: { recordedAt, ...values, notes: text(value.notes, 1000) || null }, ok: true };
}

export function validateFeedback(value: unknown): Result<{ trainerClientId: string; workoutLogId: string | null; nutritionLogId: string | null; type: "GENERAL" | "WORKOUT" | "DIET" | "PROGRESS"; content: string }> {
  if (!record(value)) return { error: "Invalid feedback.", ok: false };
  const trainerClientId = text(value.trainerClientId, 100); const content = text(value.content, 2000); const types = ["GENERAL", "WORKOUT", "DIET", "PROGRESS"];
  if (!trainerClientId) return { error: "Choose a student.", ok: false };
  if (content.length < 2) return { error: "Feedback must contain at least 2 characters.", ok: false };
  if (!types.includes(String(value.type))) return { error: "Choose a feedback type.", ok: false };
  return { data: { trainerClientId, workoutLogId: text(value.workoutLogId, 100) || null, nutritionLogId: text(value.nutritionLogId, 100) || null, type: value.type as "GENERAL" | "WORKOUT" | "DIET" | "PROGRESS", content }, ok: true };
}

type Success<T> = { data: T; ok: true };
type Failure = { error: string; ok: false };
type Result<T> = Success<T> | Failure;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function integer(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

function decimal(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export type WorkoutExerciseInput = {
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

export type WorkoutDayInput = {
  name: string;
  notes: string | null;
  exercises: WorkoutExerciseInput[];
};

export function validateWorkoutPlan(value: unknown): Result<{
  description: string | null;
  gymId: string | null;
  isTemplate: boolean;
  title: string;
  days: WorkoutDayInput[];
}> {
  if (!isRecord(value) || !Array.isArray(value.days)) return { error: "Provide workout-plan details and days.", ok: false };
  const title = text(value.title, 120);
  if (title.length < 2) return { error: "Plan title must contain at least 2 characters.", ok: false };
  if (value.days.length > 14) return { error: "Workout plans are limited to 14 days.", ok: false };
  const days: WorkoutDayInput[] = [];

  for (const [dayIndex, rawDay] of value.days.entries()) {
    if (!isRecord(rawDay) || !Array.isArray(rawDay.exercises)) return { error: `Day ${dayIndex + 1} is invalid.`, ok: false };
    const name = text(rawDay.name, 100);
    if (name.length < 2) return { error: `Day ${dayIndex + 1} needs a name.`, ok: false };
    if (rawDay.exercises.length > 30) return { error: `Day ${dayIndex + 1} has too many exercises.`, ok: false };
    const exercises: WorkoutExerciseInput[] = [];

    for (const [exerciseIndex, rawExercise] of rawDay.exercises.entries()) {
      if (!isRecord(rawExercise)) return { error: `Exercise ${exerciseIndex + 1} on day ${dayIndex + 1} is invalid.`, ok: false };
      const exerciseName = text(rawExercise.name, 120);
      if (exerciseName.length < 2) return { error: `Exercise ${exerciseIndex + 1} on day ${dayIndex + 1} needs a name.`, ok: false };
      const sets = integer(rawExercise.sets);
      const restSeconds = integer(rawExercise.restSeconds);
      const durationSeconds = integer(rawExercise.durationSeconds);
      const distanceMeters = integer(rawExercise.distanceMeters);
      if (sets !== null && (!Number.isInteger(sets) || sets < 1 || sets > 100)) return { error: `${exerciseName}: sets must be between 1 and 100.`, ok: false };
      if (restSeconds !== null && (!Number.isInteger(restSeconds) || restSeconds < 0 || restSeconds > 3_600)) return { error: `${exerciseName}: rest must be between 0 and 3600 seconds.`, ok: false };
      if (durationSeconds !== null && (!Number.isInteger(durationSeconds) || durationSeconds < 1)) return { error: `${exerciseName}: duration must be positive.`, ok: false };
      if (distanceMeters !== null && (!Number.isInteger(distanceMeters) || distanceMeters < 1)) return { error: `${exerciseName}: distance must be positive.`, ok: false };
      exercises.push({
        name: exerciseName,
        sets,
        reps: text(rawExercise.reps, 40) || null,
        weight: text(rawExercise.weight, 40) || null,
        tempo: text(rawExercise.tempo, 30) || null,
        restSeconds,
        durationSeconds,
        distanceMeters,
        notes: text(rawExercise.notes, 500) || null,
      });
    }
    days.push({ name, notes: text(rawDay.notes, 500) || null, exercises });
  }

  return {
    data: {
      title,
      description: text(value.description, 1_000) || null,
      gymId: text(value.gymId, 100) || null,
      isTemplate: value.isTemplate === true,
      days,
    },
    ok: true,
  };
}

export type FoodItemInput = {
  name: string;
  quantity: number | null;
  unit: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  notes: string | null;
};

export type MealInput = {
  name: string;
  scheduledTime: string | null;
  notes: string | null;
  foodItems: FoodItemInput[];
};

export type DietDayInput = {
  name: string;
  targetCalories: number | null;
  targetProtein: number | null;
  targetCarbs: number | null;
  targetFat: number | null;
  notes: string | null;
  meals: MealInput[];
};

export function validateDietPlan(value: unknown): Result<{
  dailyCalories: number | null;
  description: string | null;
  dietaryRestrictions: string | null;
  gymId: string | null;
  isTemplate: boolean;
  title: string;
  days: DietDayInput[];
}> {
  if (!isRecord(value) || !Array.isArray(value.days)) return { error: "Provide nutrition-plan details and days.", ok: false };
  const title = text(value.title, 120);
  if (title.length < 2) return { error: "Plan title must contain at least 2 characters.", ok: false };
  if (value.days.length > 14) return { error: "Nutrition plans are limited to 14 days.", ok: false };
  const dailyCalories = integer(value.dailyCalories);
  if (dailyCalories !== null && (!Number.isInteger(dailyCalories) || dailyCalories < 0 || dailyCalories > 20_000)) return { error: "Daily calories must be between 0 and 20,000.", ok: false };
  const days: DietDayInput[] = [];

  for (const [dayIndex, rawDay] of value.days.entries()) {
    if (!isRecord(rawDay) || !Array.isArray(rawDay.meals)) return { error: `Day ${dayIndex + 1} is invalid.`, ok: false };
    const name = text(rawDay.name, 100);
    if (name.length < 2) return { error: `Day ${dayIndex + 1} needs a name.`, ok: false };
    if (rawDay.meals.length > 12) return { error: `Day ${dayIndex + 1} has too many meals.`, ok: false };
    const targets = {
      targetCalories: integer(rawDay.targetCalories),
      targetProtein: decimal(rawDay.targetProtein),
      targetCarbs: decimal(rawDay.targetCarbs),
      targetFat: decimal(rawDay.targetFat),
    };
    if (targets.targetCalories !== null && (!Number.isInteger(targets.targetCalories) || targets.targetCalories < 0 || targets.targetCalories > 20_000)) return { error: `${name}: calorie target is invalid.`, ok: false };
    if ([targets.targetProtein, targets.targetCarbs, targets.targetFat].some((item) => item !== null && (!Number.isFinite(item) || item < 0))) return { error: `${name}: macro targets cannot be negative.`, ok: false };
    const meals: MealInput[] = [];

    for (const [mealIndex, rawMeal] of rawDay.meals.entries()) {
      if (!isRecord(rawMeal) || !Array.isArray(rawMeal.foodItems)) return { error: `Meal ${mealIndex + 1} on day ${dayIndex + 1} is invalid.`, ok: false };
      const mealName = text(rawMeal.name, 100);
      if (mealName.length < 2) return { error: `Meal ${mealIndex + 1} on day ${dayIndex + 1} needs a name.`, ok: false };
      if (rawMeal.foodItems.length > 30) return { error: `${mealName} has too many food items.`, ok: false };
      const foodItems: FoodItemInput[] = [];
      for (const [foodIndex, rawFood] of rawMeal.foodItems.entries()) {
        if (!isRecord(rawFood)) return { error: `Food item ${foodIndex + 1} in ${mealName} is invalid.`, ok: false };
        const foodName = text(rawFood.name, 120);
        if (!foodName) return { error: `Food item ${foodIndex + 1} in ${mealName} needs a name.`, ok: false };
        const nutrition = {
          quantity: decimal(rawFood.quantity),
          calories: integer(rawFood.calories),
          protein: decimal(rawFood.protein),
          carbs: decimal(rawFood.carbs),
          fat: decimal(rawFood.fat),
        };
        if (Object.values(nutrition).some((item) => item !== null && (!Number.isFinite(item) || item < 0))) return { error: `${foodName}: nutrition values cannot be negative.`, ok: false };
        foodItems.push({
          name: foodName,
          ...nutrition,
          unit: text(rawFood.unit, 30) || null,
          notes: text(rawFood.notes, 300) || null,
        });
      }
      meals.push({ name: mealName, scheduledTime: text(rawMeal.scheduledTime, 10) || null, notes: text(rawMeal.notes, 300) || null, foodItems });
    }
    days.push({ name, ...targets, notes: text(rawDay.notes, 500) || null, meals });
  }

  return {
    data: {
      title,
      description: text(value.description, 1_000) || null,
      dietaryRestrictions: text(value.dietaryRestrictions, 1_000) || null,
      dailyCalories,
      gymId: text(value.gymId, 100) || null,
      isTemplate: value.isTemplate === true,
      days,
    },
    ok: true,
  };
}

export function validatePlanStatus(value: unknown): Result<{ status: "DRAFT" | "ACTIVE" | "ARCHIVED" }> {
  if (!isRecord(value) || !["DRAFT", "ACTIVE", "ARCHIVED"].includes(String(value.status))) return { error: "Choose a valid plan status.", ok: false };
  return { data: { status: value.status as "DRAFT" | "ACTIVE" | "ARCHIVED" }, ok: true };
}

export function validatePlanAssignment(value: unknown): Result<{ trainerClientId: string; startDate: Date | null; endDate: Date | null }> {
  if (!isRecord(value)) return { error: "Invalid assignment request.", ok: false };
  const trainerClientId = text(value.trainerClientId, 100);
  if (!trainerClientId) return { error: "Choose an active student.", ok: false };
  const startDate = value.startDate ? new Date(String(value.startDate)) : null;
  const endDate = value.endDate ? new Date(String(value.endDate)) : null;
  if (startDate && Number.isNaN(startDate.getTime())) return { error: "Start date is invalid.", ok: false };
  if (endDate && Number.isNaN(endDate.getTime())) return { error: "End date is invalid.", ok: false };
  if (startDate && endDate && endDate <= startDate) return { error: "End date must follow start date.", ok: false };
  return { data: { trainerClientId, startDate, endDate }, ok: true };
}

export function validateCloneMode(value: unknown): Result<{ mode: "duplicate" | "version" }> {
  if (!isRecord(value) || (value.mode !== "duplicate" && value.mode !== "version")) return { error: "Choose duplicate or version mode.", ok: false };
  return { data: { mode: value.mode }, ok: true };
}

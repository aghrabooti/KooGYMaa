import catalog from "./exercise-catalog.json";

export type ExerciseDemo = { url: string; kind: "gif" | "photo" };

export type ExerciseRef = {
  id: string;
  nameEn: string;
  nameFa?: string;
  muscle: MuscleGroup;
  equipment: string | null;
  level: "beginner" | "intermediate" | "advanced";
  demo?: ExerciseDemo;
};

export const MUSCLE_GROUPS = {
  chest: "سینه", back: "پشت", legs: "پا", shoulders: "سرشانه", arms: "بازو و ساعد",
  core: "شکم و میان‌تنه", glutes: "باسن", cardio: "هوازی", "full-body": "کل بدن",
  mobility: "کشش و انعطاف", neck: "گردن",
} as const;

type MuscleGroup = keyof typeof MUSCLE_GROUPS;
type ImportedExercise = {
  id: string; name: string; target: string; category: string; equipment: string | null;
  level: string; guide?: string; photo?: string;
};

const originalLibrary: Omit<ExerciseRef, "demo">[] = [
  { id: "bench-press", nameEn: "Bench Press", nameFa: "پرس سینه هالتر", muscle: "chest", equipment: "Barbell", level: "intermediate" },
  { id: "push-up", nameEn: "Push-Up", nameFa: "شنا سوئدی", muscle: "chest", equipment: "Bodyweight", level: "beginner" },
  { id: "incline-dumbbell", nameEn: "Incline Dumbbell Press", nameFa: "پرس بالا سینه دمبل", muscle: "chest", equipment: "Dumbbell", level: "intermediate" },
  { id: "deadlift", nameEn: "Deadlift", nameFa: "ددلیفت", muscle: "back", equipment: "Barbell", level: "advanced" },
  { id: "pull-up", nameEn: "Pull-Up", nameFa: "بارفیکس", muscle: "back", equipment: "Bodyweight", level: "intermediate" },
  { id: "bent-row", nameEn: "Bent-Over Row", nameFa: "زیربغل خم", muscle: "back", equipment: "Barbell", level: "intermediate" },
  { id: "lat-pulldown", nameEn: "Lat Pulldown", nameFa: "لت از جلو", muscle: "back", equipment: "Cable", level: "beginner" },
  { id: "squat", nameEn: "Back Squat", nameFa: "اسکوات هالتر", muscle: "legs", equipment: "Barbell", level: "intermediate" },
  { id: "leg-press", nameEn: "Leg Press", nameFa: "پرس پا", muscle: "legs", equipment: "Machine", level: "beginner" },
  { id: "lunge", nameEn: "Walking Lunge", nameFa: "لانج راه‌رونده", muscle: "legs", equipment: "Dumbbell", level: "beginner" },
  { id: "leg-curl", nameEn: "Lying Leg Curl", nameFa: "پشت پا خوابیده", muscle: "legs", equipment: "Machine", level: "beginner" },
  { id: "ohp", nameEn: "Overhead Press", nameFa: "پرس سرشانه", muscle: "shoulders", equipment: "Barbell", level: "intermediate" },
  { id: "lateral-raise", nameEn: "Lateral Raise", nameFa: "نشر جانب", muscle: "shoulders", equipment: "Dumbbell", level: "beginner" },
  { id: "face-pull", nameEn: "Face Pull", nameFa: "فیس‌پول", muscle: "shoulders", equipment: "Cable", level: "beginner" },
  { id: "biceps-curl", nameEn: "Dumbbell Curl", nameFa: "جلو بازو دمبل", muscle: "arms", equipment: "Dumbbell", level: "beginner" },
  { id: "triceps-pushdown", nameEn: "Triceps Pushdown", nameFa: "پشت بازو سیم‌کش", muscle: "arms", equipment: "Cable", level: "beginner" },
  { id: "plank", nameEn: "Plank", nameFa: "پلانک", muscle: "core", equipment: "Bodyweight", level: "beginner" },
  { id: "crunch", nameEn: "Cable Crunch", nameFa: "کرانچ سیم‌کش", muscle: "core", equipment: "Cable", level: "beginner" },
  { id: "russian-twist", nameEn: "Russian Twist", nameFa: "چرخش روسی", muscle: "core", equipment: "Bodyweight", level: "intermediate" },
  { id: "hip-thrust", nameEn: "Hip Thrust", nameFa: "هیپ‌تراست", muscle: "glutes", equipment: "Barbell", level: "intermediate" },
  { id: "rdl", nameEn: "Romanian Deadlift", nameFa: "ددلیفت رومانیایی", muscle: "glutes", equipment: "Barbell", level: "intermediate" },
  { id: "treadmill", nameEn: "Treadmill Run", nameFa: "دو تردمیل", muscle: "cardio", equipment: "Machine", level: "beginner" },
  { id: "row-erg", nameEn: "Rowing Erg", nameFa: "روئینگ هوازی", muscle: "cardio", equipment: "Machine", level: "beginner" },
  { id: "burpee", nameEn: "Burpee", nameFa: "بورپی", muscle: "full-body", equipment: "Bodyweight", level: "advanced" },
  { id: "kettlebell-swing", nameEn: "Kettlebell Swing", nameFa: "سوینگ کتل‌بل", muscle: "full-body", equipment: "Kettlebell", level: "intermediate" },
];

const originalSources: Record<string, string> = {
  "bench-press": "Barbell_Bench_Press_-_Medium_Grip", "push-up": "Pushups",
  "incline-dumbbell": "Incline_Dumbbell_Press", deadlift: "Barbell_Deadlift", "pull-up": "Pullups",
  "bent-row": "Bent_Over_Barbell_Row", "lat-pulldown": "Wide-Grip_Lat_Pulldown", squat: "Barbell_Squat",
  "leg-press": "Leg_Press", "leg-curl": "Lying_Leg_Curls", ohp: "Standing_Military_Press",
  "lateral-raise": "Side_Lateral_Raise", "face-pull": "Face_Pull", "biceps-curl": "Dumbbell_Bicep_Curl",
  "triceps-pushdown": "Triceps_Pushdown", plank: "Plank", crunch: "Cable_Crunch",
  "russian-twist": "Russian_Twist", "hip-thrust": "Barbell_Hip_Thrust", rdl: "Romanian_Deadlift",
  treadmill: "Running_Treadmill", "row-erg": "Rowing_Stationary",
};

const targetGroups: Record<string, MuscleGroup> = {
  chest: "chest", shoulders: "shoulders", abdominals: "core", glutes: "glutes", neck: "neck",
  lats: "back", traps: "back", "middle back": "back", "lower back": "back",
  biceps: "arms", triceps: "arms", forearms: "arms",
  hamstrings: "legs", quadriceps: "legs", adductors: "legs", abductors: "legs", calves: "legs",
};

const translatedNames: Record<string, string> = {
  Air_Bike: "کرانچ دوچرخه", Barbell_Curl: "جلو بازو هالتر",
  Box_Jump_Multiple_Response: "پرش پی‌درپی روی جعبه", "Chin-Up": "بارفیکس دست برعکس",
  Dumbbell_Bench_Press: "پرس سینه دمبل", Dumbbell_Flyes: "فلای سینه دمبل",
  Dumbbell_Shoulder_Press: "پرس سرشانه دمبل", Dumbbell_Step_Ups: "استپ‌آپ با دمبل",
  Goblet_Squat: "اسکوات جام", Hammer_Curls: "جلو بازو چکشی",
  Hyperextensions_Back_Extensions: "فیله کمر", Leg_Extensions: "جلو پا دستگاه",
  Mountain_Climbers: "کوه‌نوردی", Seated_Cable_Rows: "قایقی سیم‌کش نشسته",
  Seated_Calf_Raise: "ساق پا نشسته", Smith_Machine_Squat: "اسکوات دستگاه اسمیت",
  Standing_Calf_Raises: "ساق پا ایستاده", Superman: "سوپرمن",
};

const equipmentNames: Record<string, string> = {
  "body only": "وزن بدن", bodyweight: "وزن بدن", barbell: "هالتر", dumbbell: "دمبل",
  cable: "سیم‌کش", machine: "دستگاه", kettlebell: "کتل‌بل", kettlebells: "کتل‌بل",
  bands: "کش تمرینی", "medicine ball": "توپ طبی", "exercise ball": "توپ تمرینی",
  "foam roll": "فوم رول", "e-z curl bar": "هالتر خم", other: "ابزار دیگر",
};

export function exerciseEquipmentLabel(equipment: string | null) {
  return equipment ? equipmentNames[equipment.toLowerCase()] ?? equipment : "";
}

function demoFor(exercise?: Pick<ImportedExercise, "guide" | "photo">): ExerciseDemo | undefined {
  if (exercise?.guide) return { url: `https://fitexercisedb.com/en/exercises/${exercise.guide}`, kind: "gif" };
  if (exercise?.photo) {
    const path = exercise.photo.split("/").map(encodeURIComponent).join("/");
    return { url: `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${path}`, kind: "photo" };
  }
}

function importedMuscle(exercise: ImportedExercise): MuscleGroup {
  if (exercise.category === "cardio") return "cardio";
  if (exercise.category === "stretching") return "mobility";
  if (exercise.category === "olympic weightlifting") return "full-body";
  return targetGroups[exercise.target] ?? "full-body";
}

// Movement metadata and still photos: https://github.com/yuhonas/free-exercise-db (Unlicense).
// GIF guides link to matching public exercise pages on FitExerciseDB.
const imported: ImportedExercise[] = catalog;
const importedById = new Map(imported.map((exercise) => [exercise.id, exercise]));
const replaced = new Set(Object.values(originalSources));

export const EXERCISE_LIBRARY: ExerciseRef[] = [
  ...originalLibrary.map((exercise) => ({
    ...exercise,
    demo: exercise.id === "burpee" ? demoFor({ guide: "1160-burpee" })
      : exercise.id === "kettlebell-swing" ? demoFor({ guide: "0549-kettlebell-swing" })
        : demoFor(importedById.get(originalSources[exercise.id])),
  })),
  ...imported.filter((exercise) => !replaced.has(exercise.id)).map((exercise): ExerciseRef => ({
    id: exercise.id,
    nameEn: exercise.name,
    nameFa: translatedNames[exercise.id],
    muscle: importedMuscle(exercise),
    equipment: exercise.equipment,
    level: exercise.level === "expert" ? "advanced" : exercise.level === "intermediate" ? "intermediate" : "beginner",
    demo: demoFor(exercise),
  })),
];

function normalize(value: string) {
  return value.toLowerCase().replace(/ي|ى/g, "ی").replace(/ك/g, "ک")
    .replace(/[\u064B-\u065F]/g, "").replace(/[\s\u200C\u200D_-]+/g, " ").trim();
}

const searchIndex = EXERCISE_LIBRARY.map((exercise) => ({
  exercise,
  label: normalize([
    exercise.nameFa, exercise.nameEn, exercise.equipment,
    exerciseEquipmentLabel(exercise.equipment), MUSCLE_GROUPS[exercise.muscle],
  ].filter(Boolean).join(" ")),
}));

const demosByName = new Map<string, ExerciseDemo>();
for (const { nameFa, nameEn, demo } of EXERCISE_LIBRARY) {
  if (!demo) continue;
  for (const name of [nameFa, nameEn]) {
    if (name && !demosByName.has(normalize(name))) demosByName.set(normalize(name), demo);
  }
}

export function findExerciseDemo(name: string) {
  return demosByName.get(normalize(name));
}

export function searchExercises(query: string, muscle?: string): ExerciseRef[] {
  const terms = normalize(query).split(" ").filter(Boolean);
  return searchIndex
    .filter(({ exercise, label }) => (!muscle || exercise.muscle === muscle) && terms.every((term) => label.includes(term)))
    .map(({ exercise }) => exercise);
}

// Exercise library for the trainer plan builder: bilingual names, muscle groups,
// equipment, difficulty, and optional demo-video URLs.
export type ExerciseRef = {
  id: string;
  nameEn: string;
  nameFa: string;
  muscle: string;
  muscleFa: string;
  equipment: string;
  level: "beginner" | "intermediate" | "advanced";
  videoUrl?: string;
};

export const MUSCLE_GROUPS = ["chest","back","legs","shoulders","arms","core","glutes","cardio","full-body"] as const;

export const EXERCISE_LIBRARY: ExerciseRef[] = [
  { id: "bench-press", nameEn: "Bench Press", nameFa: "پرس سینه هالتر", muscle: "chest", muscleFa: "سینه", equipment: "Barbell", level: "intermediate", videoUrl: "https://www.youtube.com/results?search_query=bench+press+tutorial" },
  { id: "push-up", nameEn: "Push-Up", nameFa: "شنا سوئدی", muscle: "chest", muscleFa: "سینه", equipment: "Bodyweight", level: "beginner" },
  { id: "incline-dumbbell", nameEn: "Incline Dumbbell Press", nameFa: "پرس بالا سینه دمبل", muscle: "chest", muscleFa: "سینه", equipment: "Dumbbell", level: "intermediate" },
  { id: "deadlift", nameEn: "Deadlift", nameFa: "ددلیفت", muscle: "back", muscleFa: "پشت", equipment: "Barbell", level: "advanced", videoUrl: "https://www.youtube.com/results?search_query=deadlift+tutorial" },
  { id: "pull-up", nameEn: "Pull-Up", nameFa: "بارفیکس", muscle: "back", muscleFa: "پشت", equipment: "Bodyweight", level: "intermediate" },
  { id: "bent-row", nameEn: "Bent-Over Row", nameFa: "زیربغل خم", muscle: "back", muscleFa: "پشت", equipment: "Barbell", level: "intermediate" },
  { id: "lat-pulldown", nameEn: "Lat Pulldown", nameFa: "لت از جلو", muscle: "back", muscleFa: "پشت", equipment: "Cable", level: "beginner" },
  { id: "squat", nameEn: "Back Squat", nameFa: "اسکوات هالتر", muscle: "legs", muscleFa: "پا", equipment: "Barbell", level: "intermediate", videoUrl: "https://www.youtube.com/results?search_query=back+squat+tutorial" },
  { id: "leg-press", nameEn: "Leg Press", nameFa: "پرس پا", muscle: "legs", muscleFa: "پا", equipment: "Machine", level: "beginner" },
  { id: "lunge", nameEn: "Walking Lunge", nameFa: "لانج راه‌رونده", muscle: "legs", muscleFa: "پا", equipment: "Dumbbell", level: "beginner" },
  { id: "leg-curl", nameEn: "Lying Leg Curl", nameFa: "پشت پا خوابیده", muscle: "legs", muscleFa: "پا", equipment: "Machine", level: "beginner" },
  { id: "ohp", nameEn: "Overhead Press", nameFa: "پرس سرشانه", muscle: "shoulders", muscleFa: "سرشانه", equipment: "Barbell", level: "intermediate" },
  { id: "lateral-raise", nameEn: "Lateral Raise", nameFa: "نشر جانب", muscle: "shoulders", muscleFa: "سرشانه", equipment: "Dumbbell", level: "beginner" },
  { id: "face-pull", nameEn: "Face Pull", nameFa: "فیس‌پول", muscle: "shoulders", muscleFa: "سرشانه", equipment: "Cable", level: "beginner" },
  { id: "biceps-curl", nameEn: "Dumbbell Curl", nameFa: "جلو بازو دمبل", muscle: "arms", muscleFa: "بازو", equipment: "Dumbbell", level: "beginner" },
  { id: "triceps-pushdown", nameEn: "Triceps Pushdown", nameFa: "پشت بازو سیم‌کش", muscle: "arms", muscleFa: "بازو", equipment: "Cable", level: "beginner" },
  { id: "plank", nameEn: "Plank", nameFa: "پلانک", muscle: "core", muscleFa: "شکم", equipment: "Bodyweight", level: "beginner" },
  { id: "crunch", nameEn: "Cable Crunch", nameFa: "کرانچ سیم‌کش", muscle: "core", muscleFa: "شکم", equipment: "Cable", level: "beginner" },
  { id: "russian-twist", nameEn: "Russian Twist", nameFa: "چرخش روسی", muscle: "core", muscleFa: "شکم", equipment: "Bodyweight", level: "intermediate" },
  { id: "hip-thrust", nameEn: "Hip Thrust", nameFa: "هیپ‌تراست", muscle: "glutes", muscleFa: "باسن", equipment: "Barbell", level: "intermediate" },
  { id: "rdl", nameEn: "Romanian Deadlift", nameFa: "ددلیفت رومانیایی", muscle: "glutes", muscleFa: "باسن", equipment: "Barbell", level: "intermediate" },
  { id: "treadmill", nameEn: "Treadmill Run", nameFa: "دو تردمیل", muscle: "cardio", muscleFa: "هوازی", equipment: "Machine", level: "beginner" },
  { id: "row-erg", nameEn: "Rowing Erg", nameFa: "روئینگ هوازی", muscle: "cardio", muscleFa: "هوازی", equipment: "Machine", level: "beginner" },
  { id: "burpee", nameEn: "Burpee", nameFa: "بورپی", muscle: "full-body", muscleFa: "کل بدن", equipment: "Bodyweight", level: "advanced" },
  { id: "kettlebell-swing", nameEn: "Kettlebell Swing", nameFa: "سوینگ کتل‌بل", muscle: "full-body", muscleFa: "کل بدن", equipment: "Kettlebell", level: "intermediate" },
];

export function searchExercises(query: string, muscle?: string): ExerciseRef[] {
  const q = query.trim().toLowerCase();
  return EXERCISE_LIBRARY.filter((e) => {
    if (muscle && e.muscle !== muscle) return false;
    if (!q) return true;
    return e.nameEn.toLowerCase().includes(q) || e.nameFa.includes(query.trim()) || e.equipment.toLowerCase().includes(q);
  });
}

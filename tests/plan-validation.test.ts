import { describe, expect, it } from "vitest";
import {
  validateCloneMode,
  validateDietPlan,
  validatePlanAssignment,
  validateWorkoutPlan,
} from "@/lib/plan-validation";

describe("structured plan validation", () => {
  it("accepts a structured workout day", () => {
    const result = validateWorkoutPlan({
      title: "Foundation Strength",
      description: "Build a base",
      days: [{
        name: "Day 1",
        notes: "Technique first",
        exercises: [{ name: "Back Squat", sets: 4, reps: "6–8", restSeconds: 120 }],
      }],
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.days[0].exercises[0]).toMatchObject({ name: "Back Squat", sets: 4, reps: "6–8" });
  });

  it("rejects invalid workout prescriptions", () => {
    expect(validateWorkoutPlan({ title: "Plan", days: [{ name: "Day 1", exercises: [{ name: "Squat", sets: 0 }] }] }).ok).toBe(false);
    expect(validateWorkoutPlan({ title: "Plan", days: [{ name: "Day 1", exercises: Array.from({ length: 31 }, () => ({ name: "Exercise" })) }] }).ok).toBe(false);
  });

  it("accepts meals, food items, and macro targets", () => {
    const result = validateDietPlan({
      title: "Balanced Performance",
      dailyCalories: 2400,
      dietaryRestrictions: "No peanuts",
      days: [{
        name: "Training Day",
        targetProtein: 170,
        meals: [{
          name: "Breakfast",
          scheduledTime: "08:00",
          foodItems: [{ name: "Oats", quantity: 80, unit: "g", calories: 310, protein: 10, carbs: 53, fat: 6 }],
        }],
      }],
    });
    expect(result.ok).toBe(true);
  });

  it("rejects negative nutrition values", () => {
    expect(validateDietPlan({
      title: "Bad Plan",
      days: [{ name: "Day 1", meals: [{ name: "Meal", foodItems: [{ name: "Food", calories: -1 }] }] }],
    }).ok).toBe(false);
  });

  it("validates assignment dates and clone modes", () => {
    expect(validatePlanAssignment({ trainerClientId: "client-1", startDate: "2026-08-21", endDate: "2026-09-21" }).ok).toBe(true);
    expect(validatePlanAssignment({ trainerClientId: "client-1", startDate: "2026-09-21", endDate: "2026-08-21" }).ok).toBe(false);
    expect(validateCloneMode({ mode: "version" }).ok).toBe(true);
    expect(validateCloneMode({ mode: "fork" }).ok).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import {
  validateFeedback,
  validateMeasurement,
  validateNutritionLogUpdate,
  validateWorkoutLogUpdate,
} from "@/lib/progress-validation";

describe("progress validation", () => {
  it("accepts realistic workout execution", () => {
    expect(validateWorkoutLogUpdate({ status: "COMPLETED", perceivedEffort: 8, exercises: [{ exerciseId: "exercise-1", completed: true, actualSets: 4, actualReps: "8", actualWeight: "70 kg", rpe: 8 }] }).ok).toBe(true);
  });
  it("rejects invalid RPE values", () => {
    expect(validateWorkoutLogUpdate({ perceivedEffort: 11 }).ok).toBe(false);
    expect(validateWorkoutLogUpdate({ exercises: [{ exerciseId: "exercise-1", rpe: 0 }] }).ok).toBe(false);
  });
  it("accepts meal completion and ratings", () => {
    expect(validateNutritionLogUpdate({ completed: true, hungerRating: 4, energyRating: 8, meals: [{ mealId: "meal-1", completed: true, actualPortion: "As prescribed" }] }).ok).toBe(true);
  });
  it("requires valid body measurements", () => {
    expect(validateMeasurement({ weightKg: 80.5, waistCm: 85 }).ok).toBe(true);
    expect(validateMeasurement({ weightKg: 0 }).ok).toBe(false);
    expect(validateMeasurement({ notes: "No values" }).ok).toBe(false);
  });
  it("validates trainer feedback context", () => {
    expect(validateFeedback({ trainerClientId: "client-1", type: "WORKOUT", content: "Keep your tempo controlled." }).ok).toBe(true);
    expect(validateFeedback({ trainerClientId: "", type: "WORKOUT", content: "x" }).ok).toBe(false);
  });
});

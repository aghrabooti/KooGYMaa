import { describe, expect, it } from "vitest";
import { EXERCISE_LIBRARY, findExerciseDemo, searchExercises } from "@/lib/exercises";

describe("exercise catalog", () => {
  it("includes the expanded library without duplicate IDs or YouTube links", () => {
    const ids = EXERCISE_LIBRARY.map(({ id }) => id);
    expect(ids.length).toBeGreaterThan(800);
    expect(new Set(ids).size).toBe(ids.length);
    expect(EXERCISE_LIBRARY.filter(({ demo }) => demo?.kind === "gif").length).toBeGreaterThan(200);
    expect(EXERCISE_LIBRARY.some(({ demo }) => demo?.url.includes("youtube"))).toBe(false);
  });

  it("finds movements by Persian or English name, muscle group and equipment", () => {
    expect(searchExercises("پرس سينه هالتر", "chest")[0]?.id).toBe("bench-press");
    expect(searchExercises("bench press دمبل", "chest").some(({ id }) => id === "Dumbbell_Bench_Press")).toBe(true);
    expect(searchExercises("bench press", "cardio")).toEqual([]);
  });

  it("finds a guide for both names of a saved movement", () => {
    const expected = { kind: "gif", url: "https://fitexercisedb.com/en/exercises/0025-barbell-bench-press" };
    expect(findExerciseDemo("پرس سینه هالتر")).toEqual(expected);
    expect(findExerciseDemo("Bench Press")).toEqual(expected);
    expect(findExerciseDemo("حرکت سفارشی بدون راهنما")).toBeUndefined();
  });
});

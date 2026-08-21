import { describe, expect, it } from "vitest";
import { validateReview } from "@/lib/review-validation";

describe("review validation", () => {
  it("accepts scores from one to five", () => {
    expect(validateReview({ score: 5, comment: "Excellent coaching." })).toEqual({ ok: true, data: { score: 5, comment: "Excellent coaching." } });
    expect(validateReview({ score: "1", comment: "" })).toEqual({ ok: true, data: { score: 1, comment: null } });
  });
  it("rejects invalid scores", () => {
    expect(validateReview({ score: 0 }).ok).toBe(false);
    expect(validateReview({ score: 6 }).ok).toBe(false);
    expect(validateReview({ score: 4.5 }).ok).toBe(false);
  });
  it("limits comment size", () => {
    const result = validateReview({ score: 4, comment: "a".repeat(1_200) });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.comment).toHaveLength(1_000);
  });
});

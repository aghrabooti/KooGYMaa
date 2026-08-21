type Result = { ok: true; data: { score: number; comment: string | null } } | { ok: false; error: string };

export function validateReview(value: unknown): Result {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return { ok: false, error: "Invalid review." };
  const input = value as Record<string, unknown>;
  const score = typeof input.score === "number" ? input.score : Number(input.score);
  const comment = typeof input.comment === "string" ? input.comment.trim().slice(0, 1_000) : "";
  if (!Number.isInteger(score) || score < 1 || score > 5) return { ok: false, error: "Rating must be between 1 and 5." };
  return { ok: true, data: { score, comment: comment || null } };
}

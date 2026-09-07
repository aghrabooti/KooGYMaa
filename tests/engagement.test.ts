import { describe, expect, it } from "vitest";
import { lowActiveStudents, unansweredThreads, validateReminderPrefs } from "@/lib/engagement";

describe("lowActiveStudents", () => {
  it("flags students idle beyond the threshold", () => {
    const now = new Date("2026-09-05T12:00:00Z");
    const rows = [
      { userId: "a", lastActiveAt: new Date("2026-09-04T12:00:00Z") },
      { userId: "b", lastActiveAt: new Date("2026-08-20T12:00:00Z") },
      { userId: "c", lastActiveAt: null },
    ];
    expect(lowActiveStudents(rows, 7, now).sort()).toEqual(["b", "c"]);
  });
});

describe("unansweredThreads", () => {
  it("finds threads waiting on the viewer", () => {
    const now = new Date("2026-09-05T12:00:00Z");
    const threads = [
      { id: "t1", authorId: "student", recipientId: "coach", createdAt: new Date("2026-09-01T12:00:00Z"), replies: [] },
      { id: "t2", authorId: "student", recipientId: "coach", createdAt: new Date("2026-09-01T12:00:00Z"), replies: [{ authorId: "coach", createdAt: new Date("2026-09-02T12:00:00Z") }] },
    ];
    expect(unansweredThreads(threads, "coach", 24, now).map((t) => t.id)).toEqual(["t1"]);
  });
});

describe("validateReminderPrefs", () => {
  it("accepts and clamps preferences", () => {
    const r = validateReminderPrefs({ sessionReminderHours: 12, expiryReminderDays: 5, inactivityNudgeDays: 3, enabled: true });
    expect(r.ok).toBe(true);
    expect(validateReminderPrefs(null).ok).toBe(false);
  });
});

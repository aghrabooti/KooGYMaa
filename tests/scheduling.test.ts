import { describe, expect, it } from "vitest";
import { findConflicts, intervalsOverlap } from "@/lib/scheduling";

describe("intervalsOverlap", () => {
  it("detects overlapping and adjacent sessions", () => {
    const a = { startsAt: new Date("2026-09-05T10:00:00Z"), endsAt: new Date("2026-09-05T11:00:00Z") };
    expect(intervalsOverlap(a, { startsAt: new Date("2026-09-05T10:30:00Z"), endsAt: new Date("2026-09-05T11:30:00Z") })).toBe(true);
    expect(intervalsOverlap(a, { startsAt: new Date("2026-09-05T11:00:00Z"), endsAt: new Date("2026-09-05T12:00:00Z") })).toBe(false);
  });
});

describe("findConflicts", () => {
  it("returns conflicting sessions for trainer or athlete calendars", () => {
    const existing = [
      { id: "1", startsAt: "2026-09-05T10:00:00Z", endsAt: "2026-09-05T11:00:00Z" },
      { id: "2", startsAt: "2026-09-05T14:00:00Z", endsAt: "2026-09-05T15:00:00Z" },
    ];
    expect(findConflicts({ startsAt: "2026-09-05T10:30:00Z", endsAt: "2026-09-05T11:30:00Z" }, existing).map((s) => s.id)).toEqual(["1"]);
    expect(findConflicts({ startsAt: "2026-09-05T12:00:00Z", endsAt: "2026-09-05T13:00:00Z" }, existing)).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { calcStreak, daysUntil, nearestExpiry } from "@/lib/streak";

const noon = (iso: string) => new Date(`${iso}T12:00:00+03:30`);

describe("calcStreak", () => {
  it("counts consecutive days ending today", () => {
    const now = noon("2026-09-05");
    expect(calcStreak([noon("2026-09-05"), noon("2026-09-04"), noon("2026-09-03")], now)).toBe(3);
  });
  it("keeps the streak alive when today is empty but yesterday is active", () => {
    const now = noon("2026-09-05");
    expect(calcStreak([noon("2026-09-04"), noon("2026-09-03")], now)).toBe(2);
  });
  it("breaks on a gap", () => {
    const now = noon("2026-09-05");
    expect(calcStreak([noon("2026-09-05"), noon("2026-09-03")], now)).toBe(1);
  });
  it("returns 0 without activity", () => {
    expect(calcStreak([], noon("2026-09-05"))).toBe(0);
  });
});

describe("nearestExpiry", () => {
  it("picks the closest future end date", () => {
    const now = noon("2026-09-05");
    const a = { endDate: noon("2026-09-20") };
    const b = { endDate: noon("2026-09-08") };
    const past = { endDate: noon("2026-09-01") };
    expect(nearestExpiry([a, b, past], now)).toBe(b);
  });
  it("returns null when nothing is upcoming", () => {
    expect(nearestExpiry([{ endDate: noon("2026-09-01") }], noon("2026-09-05"))).toBeNull();
  });
  it("computes whole days until expiry", () => {
    expect(daysUntil(noon("2026-09-08"), noon("2026-09-05"))).toBe(3);
  });
});

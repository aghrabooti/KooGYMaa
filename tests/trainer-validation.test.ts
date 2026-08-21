import { describe, expect, it } from "vitest";
import {
  validateAvailability,
  validateSessionInput,
  validateTrainerClientStatus,
  validateTrainerProfile,
} from "@/lib/trainer-validation";

describe("trainer validation", () => {
  it("normalizes a trainer profile", () => {
    expect(validateTrainerProfile({
      bio: "  Strength coach  ",
      specialty: " Mobility ",
      experienceYears: "8",
      hourlyRate: "5000000",
      currency: "irr",
      isAvailable: true,
    })).toEqual({
      ok: true,
      data: {
        bio: "Strength coach",
        specialty: "Mobility",
        experienceYears: 8,
        hourlyRate: 5_000_000,
        currency: "IRR",
        isAvailable: true,
      },
    });
  });

  it("rejects invalid experience and student states", () => {
    expect(validateTrainerProfile({ experienceYears: 81 }).ok).toBe(false);
    expect(validateTrainerClientStatus({ status: "SUSPENDED" }).ok).toBe(false);
    expect(validateTrainerClientStatus({ status: "ACTIVE" }).ok).toBe(true);
  });

  it("validates session timing", () => {
    const startsAt = new Date("2026-08-22T10:00:00.000Z");
    const endsAt = new Date("2026-08-22T11:00:00.000Z");
    expect(validateSessionInput({
      trainerClientId: "client-1",
      title: "Strength session",
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
    }).ok).toBe(true);
    expect(validateSessionInput({
      trainerClientId: "client-1",
      title: "Strength session",
      startsAt: endsAt.toISOString(),
      endsAt: startsAt.toISOString(),
    }).ok).toBe(false);
  });

  it("accepts non-overlapping availability", () => {
    expect(validateAvailability({
      timezone: "Asia/Tehran",
      slots: [
        { dayOfWeek: 1, startMinutes: 540, endMinutes: 720 },
        { dayOfWeek: 1, startMinutes: 720, endMinutes: 900 },
      ],
    }).ok).toBe(true);
  });

  it("rejects overlapping or out-of-range availability", () => {
    expect(validateAvailability({
      slots: [
        { dayOfWeek: 1, startMinutes: 540, endMinutes: 750 },
        { dayOfWeek: 1, startMinutes: 700, endMinutes: 900 },
      ],
    }).ok).toBe(false);
    expect(validateAvailability({
      slots: [{ dayOfWeek: 8, startMinutes: 540, endMinutes: 600 }],
    }).ok).toBe(false);
  });
});

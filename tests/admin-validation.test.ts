import { describe, expect, it } from "vitest";
import {
  slugify,
  validateGymInput,
  validateMembershipDecision,
  validatePlanInput,
  validateSubscriptionCreate,
  validateSubscriptionUpdate,
} from "@/lib/admin-validation";

describe("gym admin validation", () => {
  it("creates stable URL slugs", () => {
    expect(slugify("  KooGYMaa Central__Club  ")).toBe("koogymaa-central-club");
  });

  it("validates and normalizes gym data", () => {
    const result = validateGymInput({
      name: " Central Strength ",
      city: " Tehran ",
      country: "ir",
      email: "hello@example.com",
      status: "ACTIVE",
    });

    expect(result).toEqual({
      ok: true,
      data: {
        name: "Central Strength",
        slug: "central-strength",
        city: "Tehran",
        country: "IR",
        email: "hello@example.com",
        status: "ACTIVE",
      },
    });
  });

  it("rejects invalid membership transitions", () => {
    expect(validateMembershipDecision({ status: "UNKNOWN" }).ok).toBe(false);
    expect(validateMembershipDecision({ status: "ACTIVE", expiresAt: "not-a-date" }).ok).toBe(false);
  });

  it("validates whole-unit subscription prices", () => {
    expect(validatePlanInput({
      name: "Monthly Member",
      audience: "MEMBER",
      price: 15_000_000,
      currency: "irr",
      durationDays: 30,
    })).toMatchObject({ ok: true });

    expect(validatePlanInput({
      name: "Bad Price",
      audience: "MEMBER",
      price: 1.5,
      currency: "IRR",
      durationDays: 30,
    }).ok).toBe(false);
  });

  it("validates subscription creation and updates", () => {
    expect(validateSubscriptionCreate({
      subscriberEmail: " MEMBER@EXAMPLE.COM ",
      planId: "plan-1",
      autoRenew: true,
    })).toEqual({
      ok: true,
      data: {
        subscriberEmail: "member@example.com",
        planId: "plan-1",
        autoRenew: true,
      },
    });

    expect(validateSubscriptionUpdate({ extendDays: 30 })).toEqual({
      ok: true,
      data: { extendDays: 30 },
    });
    expect(validateSubscriptionUpdate({ extendDays: 0 }).ok).toBe(false);
  });
});

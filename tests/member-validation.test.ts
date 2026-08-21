import { describe, expect, it } from "vitest";
import { validateMemberProfile, validateTrainerRequest } from "@/lib/member-validation";

describe("member validation", () => {
  it("normalizes profile fields", () => {
    expect(validateMemberProfile({ name: "  Nima   Member ", phone: "+98 912 555 0101", avatarUrl: "https://example.com/avatar.jpg" })).toEqual({ ok: true, data: { name: "Nima Member", phone: "+98 912 555 0101", avatarUrl: "https://example.com/avatar.jpg" } });
  });
  it("rejects invalid phone and avatar values", () => {
    expect(validateMemberProfile({ phone: "abc" }).ok).toBe(false);
    expect(validateMemberProfile({ avatarUrl: "javascript:alert(1)" }).ok).toBe(false);
  });
  it("accepts independent and gym coaching requests", () => {
    expect(validateTrainerRequest({ gymId: null })).toEqual({ ok: true, data: { gymId: null } });
    expect(validateTrainerRequest({ gymId: "gym-1" })).toEqual({ ok: true, data: { gymId: "gym-1" } });
  });
});

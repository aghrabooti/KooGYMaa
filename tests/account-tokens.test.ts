import { describe, expect, it } from "vitest";
import { signResetToken, signVerifyToken, verifyResetToken, verifyVerifyToken } from "@/lib/account-tokens";

describe("account tokens", () => {
  it("round-trips password-reset tokens", () => {
    const token = signResetToken("user-1", "a@b.test");
    expect(verifyResetToken(token)).toEqual({ userId: "user-1", email: "a@b.test" });
    expect(verifyVerifyToken(token)).toBeNull();
  });
  it("round-trips email-verification tokens", () => {
    const token = signVerifyToken("user-2", "c@d.test");
    expect(verifyVerifyToken(token)).toEqual({ userId: "user-2", email: "c@d.test" });
    expect(verifyResetToken(token)).toBeNull();
  });
  it("rejects garbage", () => {
    expect(verifyResetToken("nope")).toBeNull();
    expect(verifyVerifyToken("")).toBeNull();
  });
});

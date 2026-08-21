import { describe, expect, it } from "vitest";
import {
  validateLoginInput,
  validateRegisterInput,
} from "@/lib/auth-validation";

describe("registration validation", () => {
  it("normalizes valid member data", () => {
    expect(validateRegisterInput({
      email: "  MEMBER@Example.COM ",
      name: "  Mina    Ahmadi ",
      password: "Strongpass1",
      role: "USER",
    })).toEqual({
      data: {
        email: "member@example.com",
        name: "Mina Ahmadi",
        password: "Strongpass1",
        role: "USER",
      },
      ok: true,
    });
  });

  it.each(["ADMIN", "OWNER", "", null])(
    "rejects the self-service role %s",
    (role) => {
      const result = validateRegisterInput({
        email: "member@example.com",
        name: "Mina Ahmadi",
        password: "Strongpass1",
        role,
      });

      expect(result.ok).toBe(false);
    },
  );

  it.each(["short1", "onlyletters", "12345678"])(
    "rejects the weak password %s",
    (password) => {
      const result = validateRegisterInput({
        email: "member@example.com",
        name: "Mina Ahmadi",
        password,
        role: "USER",
      });

      expect(result.ok).toBe(false);
    },
  );
});

describe("login validation", () => {
  it("normalizes email and preserves remember-me", () => {
    expect(validateLoginInput({
      email: " USER@Example.com ",
      password: "password",
      remember: true,
    })).toEqual({
      data: {
        email: "user@example.com",
        password: "password",
        remember: true,
      },
      ok: true,
    });
  });

  it("rejects malformed or oversized credentials", () => {
    expect(validateLoginInput({ email: "not-an-email", password: "" }).ok).toBe(false);
    expect(validateLoginInput({
      email: "user@example.com",
      password: "a".repeat(73),
    }).ok).toBe(false);
  });
});

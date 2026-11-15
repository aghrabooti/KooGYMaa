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
      username: "  Mina.Ahmadi ",
    })).toEqual({
      data: {
        email: "member@example.com",
        name: "Mina Ahmadi",
        password: "Strongpass1",
        role: "USER",
        username: "mina.ahmadi",
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
        username: "mina.ahmadi",
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
        username: "mina.ahmadi",
      });

      expect(result.ok).toBe(false);
    },
  );

  it("accepts a username-only account and rejects usernames that look like emails", () => {
    const account = { name: "Mina Ahmadi", username: "mina-ahmadi", password: "Strongpass1", role: "USER" };
    expect(validateRegisterInput(account)).toMatchObject({ ok: true, data: { email: null, username: "mina-ahmadi" } });
    expect(validateRegisterInput({ ...account, username: "mina@example.test" }).ok).toBe(false);
    expect(validateRegisterInput({ ...account, username: "" }).ok).toBe(false);
  });
});

describe("login validation", () => {
  it("normalizes email and preserves remember-me", () => {
    expect(validateLoginInput({
      email: " USER@Example.com ",
      password: "password",
      remember: true,
    })).toEqual({
      data: {
        identifier: "user@example.com",
        password: "password",
        remember: true,
      },
      ok: true,
    });
  });

  it("normalizes usernames for login", () => {
    expect(validateLoginInput({ identifier: "  Mina.Ahmadi ", password: "Strongpass1" })).toEqual({
      ok: true,
      data: { identifier: "mina.ahmadi", password: "Strongpass1", remember: false },
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

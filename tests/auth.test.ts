import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";
import {
  hashPassword,
  SESSION_COOKIE_NAME,
  signToken,
  verifyPassword,
  verifyPasswordForUser,
  verifyToken,
} from "@/lib/auth";
import { proxy } from "@/proxy";

const TEST_SECRET = "test-secret-with-at-least-thirty-two-characters";

beforeEach(() => {
  process.env.JWT_SECRET = TEST_SECRET;
});

describe("password security", () => {
  it("hashes and verifies valid passwords", async () => {
    const hash = await hashPassword("Strongpass1");

    expect(hash).not.toBe("Strongpass1");
    await expect(verifyPassword("Strongpass1", hash)).resolves.toBe(true);
    await expect(verifyPassword("Wrongpass1", hash)).resolves.toBe(false);
  });

  it("performs a safe comparison when an account is missing", async () => {
    await expect(verifyPasswordForUser("Strongpass1", null)).resolves.toBe(false);
  });
});

describe("session tokens", () => {
  it("round-trips minimal signed claims", () => {
    const token = signToken("user-123", "TRAINER", 60);

    expect(verifyToken(token)).toEqual({
      role: "TRAINER",
      userId: "user-123",
    });
  });

  it("rejects tampered and expired tokens", () => {
    const token = signToken("user-123", "USER", 60);
    const tampered = `${token.slice(0, -1)}${token.endsWith("a") ? "b" : "a"}`;

    expect(verifyToken(tampered)).toBeNull();
    expect(verifyToken(signToken("user-123", "USER", -1))).toBeNull();
  });

  it("rejects unsupported roles", () => {
    const token = jwt.sign(
      { role: "OWNER" },
      TEST_SECRET,
      {
        algorithm: "HS256",
        audience: "koogymaa-web",
        expiresIn: 60,
        issuer: "koogymaa",
        subject: "user-123",
      },
    );

    expect(verifyToken(token)).toBeNull();
  });
});

it("keeps sign-in accessible with a signed cookie, including a revoked session", () => {
  const token = signToken("user-123", "USER", 60, "previous-session");
  const response = proxy(new NextRequest("https://example.com/login", {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
  }));
  expect(response.status).toBe(200);
  expect(response.headers.get("location")).toBeNull();
  expect(response.cookies.get(SESSION_COOKIE_NAME)).toBeUndefined();
});

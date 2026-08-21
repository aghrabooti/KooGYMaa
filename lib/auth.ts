import "server-only";

import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";

export const APP_ROLES = ["ADMIN", "TRAINER", "USER"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export const SESSION_COOKIE_NAME = "koogymaa_session";
export const LEGACY_SESSION_COOKIE_NAME = "token";
export const SHORT_SESSION_SECONDS = 24 * 60 * 60;
export const LONG_SESSION_SECONDS = 7 * 24 * 60 * 60;

const JWT_ISSUER = "koogymaa";
const JWT_AUDIENCE = "koogymaa-web";
const DEVELOPMENT_SECRET = "koogymaa-development-only-secret-change-me";
const INVALID_PASSWORD_HASH = "$2b$12$yfFuN.vNwQh8E6DzztDN6OeQgKBST37TNgKxagxgIrBIgsRtAwx3K";

type SessionPayload = JwtPayload & {
  role?: unknown;
};

export type SessionClaims = {
  userId: string;
  role: AppRole;
};

// Demo project: a secret is embedded so sessions work with no environment
// configuration. Set JWT_SECRET to override it for a real deployment.
const EMBEDDED_JWT_SECRET = "TT1zvOx1kt+8L/hu/YJ1RJ3eundPa5Ibf1mqvIxRuyQ=";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret) {
    // No env var: use an embedded demo secret in any environment.
    return process.env.NODE_ENV === "production"
      ? EMBEDDED_JWT_SECRET
      : DEVELOPMENT_SECRET;
  }

  if (process.env.NODE_ENV === "production" && secret.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters in production.");
  }

  return secret;
}

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && APP_ROLES.includes(value as AppRole);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

export async function verifyPasswordForUser(
  password: string,
  passwordHash: string | null | undefined,
): Promise<boolean> {
  const isValid = await verifyPassword(password, passwordHash ?? INVALID_PASSWORD_HASH);
  return Boolean(passwordHash) && isValid;
}

export function signToken(
  userId: string,
  role: AppRole,
  expiresInSeconds = LONG_SESSION_SECONDS,
): string {
  return jwt.sign(
    { role },
    getJwtSecret(),
    {
      algorithm: "HS256",
      audience: JWT_AUDIENCE,
      expiresIn: expiresInSeconds,
      issuer: JWT_ISSUER,
      subject: userId,
    },
  );
}

export function verifyToken(token: string | null | undefined): SessionClaims | null {
  if (!token) return null;

  const secret = getJwtSecret();

  try {
    const payload = jwt.verify(token, secret, {
      algorithms: ["HS256"],
      audience: JWT_AUDIENCE,
      issuer: JWT_ISSUER,
    }) as SessionPayload;

    if (!payload.sub || !isAppRole(payload.role)) return null;

    return {
      userId: payload.sub,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

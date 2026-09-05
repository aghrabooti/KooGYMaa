import "server-only";
import jwt from "jsonwebtoken";

const DEV = "koogymaa-development-only-secret-change-me";
const EMBEDDED = "TT1zvOx1kt+8L/hu/YJ1RJ3eundPa5Ibf1mqvIxRuyQ=";

function secret(): string {
  return process.env.JWT_SECRET?.trim() || (process.env.NODE_ENV === "production" ? EMBEDDED : DEV);
}

export function signResetToken(userId: string, email: string): string {
  return jwt.sign({ purpose: "reset", email }, secret(), { algorithm: "HS256", issuer: "koogymaa", audience: "koogymaa-web", subject: userId, expiresIn: 60 * 60 });
}

export function verifyResetToken(token: string): { userId: string; email: string } | null {
  try {
    const p = jwt.verify(token, secret(), { algorithms: ["HS256"], issuer: "koogymaa", audience: "koogymaa-web" }) as Record<string, unknown>;
    if (p.purpose !== "reset" || typeof p.sub !== "string" || typeof p.email !== "string") return null;
    return { userId: p.sub, email: p.email };
  } catch {
    return null;
  }
}

export function signVerifyToken(userId: string, email: string): string {
  return jwt.sign({ purpose: "verify", email }, secret(), { algorithm: "HS256", issuer: "koogymaa", audience: "koogymaa-web", subject: userId, expiresIn: 24 * 60 * 60 });
}

export function verifyVerifyToken(token: string): { userId: string; email: string } | null {
  try {
    const p = jwt.verify(token, secret(), { algorithms: ["HS256"], issuer: "koogymaa", audience: "koogymaa-web" }) as Record<string, unknown>;
    if (p.purpose !== "verify" || typeof p.sub !== "string" || typeof p.email !== "string") return null;
    return { userId: p.sub, email: p.email };
  } catch {
    return null;
  }
}

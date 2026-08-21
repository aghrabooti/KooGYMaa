import type { NextResponse } from "next/server";
import {
  LEGACY_SESSION_COOKIE_NAME,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

export function sessionCookieOptions(maxAge: number) {
  return {
    expires: new Date(Date.now() + maxAge * 1000),
    httpOnly: true,
    maxAge,
    path: "/",
    priority: "high" as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export function setSessionCookie(
  response: NextResponse,
  token: string,
  maxAge: number,
) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    ...sessionCookieOptions(maxAge),
  });

  // Remove cookies created by older client-side authentication code.
  response.cookies.delete(LEGACY_SESSION_COOKIE_NAME);
}

export function clearSessionCookies(response: NextResponse) {
  for (const name of [SESSION_COOKIE_NAME, LEGACY_SESSION_COOKIE_NAME]) {
    response.cookies.delete(name);
  }
}

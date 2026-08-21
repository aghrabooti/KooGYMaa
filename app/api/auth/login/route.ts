import { NextResponse, type NextRequest } from "next/server";
import {
  isAppRole,
  LONG_SESSION_SECONDS,
  SHORT_SESSION_SECONDS,
  signToken,
  verifyPasswordForUser,
} from "@/lib/auth";
import { validateLoginInput } from "@/lib/auth-validation";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  clearRateLimit,
  getClientIp,
} from "@/lib/rate-limit";
import { setSessionCookie } from "@/lib/session-cookie";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function rateLimitedResponse(retryAfter: number) {
  return NextResponse.json(
    { error: "Too many login attempts. Please try again later." },
    {
      headers: { "Retry-After": String(retryAfter) },
      status: 429,
    },
  );
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const ipKey = `login:ip:${ip}`;
  const ipLimit = checkRateLimit(ipKey, 20, LOGIN_WINDOW_MS);

  if (!ipLimit.allowed) return rateLimitedResponse(ipLimit.retryAfter);

  try {
    const body = await request.json().catch(() => null);
    const validation = validateLoginInput(body);

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { email, password, remember } = validation.data;
    const accountKey = `login:account:${email}`;
    const accountLimit = checkRateLimit(accountKey, 8, LOGIN_WINDOW_MS);

    if (!accountLimit.allowed) {
      return rateLimitedResponse(accountLimit.retryAfter);
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        email: true,
        id: true,
        name: true,
        password: true,
        role: true,
        status: true,
      },
    });

    const isValid = await verifyPasswordForUser(password, user?.password);

    if (!user || !isValid || !isAppRole(user.role)) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This account is not currently active." },
        { status: 403 },
      );
    }

    clearRateLimit(accountKey);
    clearRateLimit(ipKey);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const maxAge = remember ? LONG_SESSION_SECONDS : SHORT_SESSION_SECONDS;
    const token = signToken(user.id, user.role, maxAge);
    const response = NextResponse.json({
      user: {
        email: user.email,
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });

    response.headers.set("Cache-Control", "no-store");
    setSessionCookie(response, token, maxAge);
    return response;
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json(
      { error: "Unable to sign in right now. Please try again." },
      { status: 500 },
    );
  }
}

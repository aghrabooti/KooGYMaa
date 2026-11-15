import { NextResponse, type NextRequest } from "next/server";
import {
  isAppRole,
  LONG_SESSION_SECONDS,
  SHORT_SESSION_SECONDS,
  signToken,
  verifyPasswordForUser,
} from "@/lib/auth";
import { validateLoginInput } from "@/lib/auth-validation";
import { accountIdentifierWhere } from "@/lib/accounts";
import { prisma } from "@/lib/prisma";
import {
  checkRateLimit,
  clearRateLimit,
  getClientIp,
} from "@/lib/rate-limit";
import { setSessionCookie } from "@/lib/session-cookie";
import { createUserSession, touchUserSession } from "@/lib/user-sessions";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function rateLimitedResponse(retryAfter: number) {
  return NextResponse.json(
    { error: "تلاش‌های زیادی برای ورود انجام شده است. کمی بعد دوباره امتحان کنید." },
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

    const { identifier, password, remember } = validation.data;

    const user = await prisma.user.findUnique({
      where: accountIdentifierWhere(identifier),
      select: {
        email: true,
        id: true,
        name: true,
        password: true,
        role: true,
        status: true,
        username: true,
      },
    });

    const accountKey = `login:account:${user?.id ?? identifier}`;
    const accountLimit = checkRateLimit(accountKey, 8, LOGIN_WINDOW_MS);
    if (!accountLimit.allowed) return rateLimitedResponse(accountLimit.retryAfter);

    const isValid = await verifyPasswordForUser(password, user?.password);

    if (!user || !isValid || !isAppRole(user.role)) {
      return NextResponse.json(
        { error: "نام کاربری، ایمیل یا گذرواژه درست نیست." },
        { status: 401 },
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "این حساب فعال نیست." },
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
    let sessionId: string | undefined;
    try {
      sessionId = await createUserSession(user.id, getClientIp(request), request.headers.get("user-agent"));
    } catch {
      sessionId = undefined;
    }
    const token = signToken(user.id, user.role, maxAge, sessionId);
    if (sessionId) {
      touchUserSession(sessionId).catch(() => undefined);
    }
    const response = NextResponse.json({
      user: {
        email: user.email,
        id: user.id,
        name: user.name,
        role: user.role,
        username: user.username,
      },
    });

    response.headers.set("Cache-Control", "no-store");
    setSessionCookie(response, token, maxAge);
    return response;
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json(
      { error: "ورود انجام نشد. دوباره تلاش کنید." },
      { status: 500 },
    );
  }
}

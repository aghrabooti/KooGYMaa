import { NextResponse, type NextRequest } from "next/server";
import {
  isAppRole,
  LONG_SESSION_SECONDS,
  signToken,
} from "@/lib/auth";
import { accountCreationError, createAccount } from "@/lib/accounts";
import { validateRegisterInput } from "@/lib/auth-validation";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { setSessionCookie } from "@/lib/session-cookie";
import { createUserSession } from "@/lib/user-sessions";

const REGISTER_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(
    `register:${getClientIp(request)}`,
    5,
    REGISTER_WINDOW_MS,
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many accounts created. Please try again later." },
      {
        headers: { "Retry-After": String(rateLimit.retryAfter) },
        status: 429,
      },
    );
  }

  try {
    const body = await request.json().catch(() => null);
    const validation = validateRegisterInput(body);

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { role } = validation.data;
    const user = await createAccount(validation.data, role, role === "TRAINER" ? { trainerProfile: { create: {} } } : {});

    if (!isAppRole(user.role)) {
      throw new Error("User was created with an unsupported role.");
    }

    let sessionId: string | undefined;
    try {
      sessionId = await createUserSession(user.id, getClientIp(request), request.headers.get("user-agent"));
    } catch {
      sessionId = undefined;
    }
    const token = signToken(user.id, user.role, LONG_SESSION_SECONDS, sessionId);
    const response = NextResponse.json(
      { user },
      { status: 201 },
    );

    response.headers.set("Cache-Control", "no-store");
    setSessionCookie(response, token, LONG_SESSION_SECONDS);
    return response;
  } catch (error) {
    return accountCreationError(error);
  }
}

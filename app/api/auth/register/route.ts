import { NextResponse, type NextRequest } from "next/server";
import {
  isAppRole,
  LONG_SESSION_SECONDS,
  signToken,
  hashPassword,
} from "@/lib/auth";
import { validateRegisterInput } from "@/lib/auth-validation";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { setSessionCookie } from "@/lib/session-cookie";

const REGISTER_WINDOW_MS = 60 * 60 * 1000;

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

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

    const { email, name, password, role } = validation.data;
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: passwordHash,
        role,
        ...(role === "TRAINER"
          ? { trainerProfile: { create: {} } }
          : {}),
      },
      select: {
        email: true,
        id: true,
        name: true,
        role: true,
      },
    });

    if (!isAppRole(user.role)) {
      throw new Error("User was created with an unsupported role.");
    }

    const token = signToken(user.id, user.role, LONG_SESSION_SECONDS);
    const response = NextResponse.json(
      { user },
      { status: 201 },
    );

    response.headers.set("Cache-Control", "no-store");
    setSessionCookie(response, token, LONG_SESSION_SECONDS);
    return response;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    console.error("Registration failed:", error);
    return NextResponse.json(
      { error: "Unable to create your account right now. Please try again." },
      { status: 500 },
    );
  }
}

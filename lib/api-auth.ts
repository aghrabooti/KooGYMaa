import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import {
  type AppRole,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import {
  getUserFromSessionToken,
  type SessionUser,
} from "@/lib/session";

type AuthorizationSuccess = {
  ok: true;
  user: SessionUser;
};

type AuthorizationFailure = {
  ok: false;
  response: NextResponse;
};

export type AuthorizationResult = AuthorizationSuccess | AuthorizationFailure;

export async function authorizeApiRequest(
  request: NextRequest,
  allowedRoles?: readonly AppRole[],
): Promise<AuthorizationResult> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = await getUserFromSessionToken(token);

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Authentication required." },
        {
          headers: { "Cache-Control": "no-store" },
          status: 401,
        },
      ),
    };
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "You do not have permission to perform this action." },
        {
          headers: { "Cache-Control": "no-store" },
          status: 403,
        },
      ),
    };
  }

  return { ok: true, user };
}

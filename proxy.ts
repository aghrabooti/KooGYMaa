import { NextResponse, type NextRequest } from "next/server";
import {
  type AppRole,
  LEGACY_SESSION_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  verifyToken,
} from "@/lib/auth";

const AUTH_ROUTES = new Set(["/login", "/register"]);
const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/trainer", "/user"];
const ROLE_PREFIXES: Array<{ prefix: string; role: AppRole }> = [
  { prefix: "/admin", role: "ADMIN" },
  { prefix: "/trainer", role: "TRAINER" },
  { prefix: "/user", role: "USER" },
];

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function expireInvalidCookies(response: NextResponse) {
  for (const name of [SESSION_COOKIE_NAME, LEGACY_SESSION_COOKIE_NAME]) {
    response.cookies.delete(name);
  }

  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = verifyToken(token);
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    matchesPrefix(pathname, prefix),
  );

  if (isProtected && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return expireInvalidCookies(NextResponse.redirect(loginUrl));
  }

  if (AUTH_ROUTES.has(pathname) && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (session) {
    const restrictedArea = ROLE_PREFIXES.find(({ prefix }) =>
      matchesPrefix(pathname, prefix),
    );

    if (restrictedArea && restrictedArea.role !== session.role) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  const response = NextResponse.next();

  if (token && !session) expireInvalidCookies(response);

  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

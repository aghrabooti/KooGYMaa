import { NextResponse, type NextRequest } from "next/server";
import {
  type AppRole,
  LEGACY_SESSION_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  verifyToken,
} from "@/lib/auth";

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
  // A signed cookie can outlive its database session. Keep sign-in reachable
  // when a previous session sends the user back here.
  const session = pathname === "/login" ? null : verifyToken(token);
  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    matchesPrefix(pathname, prefix),
  );

  if (isProtected && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return expireInvalidCookies(NextResponse.redirect(loginUrl));
  }

  if (pathname === "/register" && session) {
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

  if (pathname !== "/login" && token && !session) expireInvalidCookies(response);

  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Content-Type-Options", "nosniff");
  // The embedded live preview (PREVIEW_MODE=1) is shown inside an iframe;
  // production keeps the strict clickjacking header.
  if (process.env.PREVIEW_MODE !== "1") response.headers.set("X-Frame-Options", "DENY");
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

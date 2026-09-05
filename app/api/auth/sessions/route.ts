import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifyToken } from "@/lib/auth";
import { authorizeApiRequest } from "@/lib/api-auth";
import { listUserSessions, revokeAllOtherSessions } from "@/lib/user-sessions";

// Item 1: active-session management.
export async function GET(request: NextRequest) {
  const auth = await authorizeApiRequest(request);
  if (!auth.ok) return auth.response;
  const cookieStore = await cookies();
  const current = verifyToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  const sessions = await listUserSessions(auth.user.id);
  return NextResponse.json({
    currentId: current?.sessionId ?? null,
    sessions: sessions.filter((s) => !s.revokedAt).map((s) => ({
      id: s.id,
      ip: s.ip,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      lastSeenAt: s.lastSeenAt,
      current: current?.sessionId === s.id,
    })),
  });
}

// DELETE → revoke all other sessions (keep current).
export async function DELETE(request: NextRequest) {
  const auth = await authorizeApiRequest(request);
  if (!auth.ok) return auth.response;
  const cookieStore = await cookies();
  const current = verifyToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (current?.sessionId) {
    await revokeAllOtherSessions(auth.user.id, current.sessionId);
  }
  return NextResponse.json({ ok: true, message: "سایر نشست‌ها بسته شدند." });
}

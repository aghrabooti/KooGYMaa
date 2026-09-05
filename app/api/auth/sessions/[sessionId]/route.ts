import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { revokeUserSession } from "@/lib/user-sessions";

type Ctx = { params: Promise<{ sessionId: string }> };

// DELETE → revoke one session.
export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const auth = await authorizeApiRequest(_request);
  if (!auth.ok) return auth.response;
  const { sessionId } = await params;
  const ok = await revokeUserSession(auth.user.id, sessionId);
  if (!ok) return NextResponse.json({ error: "نشست یافت نشد." }, { status: 404 });
  return NextResponse.json({ ok: true, message: "نشست بسته شد." });
}

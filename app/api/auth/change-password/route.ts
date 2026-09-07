import { NextResponse, type NextRequest } from "next/server";
import { hashPassword, verifyPasswordForUser } from "@/lib/auth";
import { authorizeApiRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// Item 1: password change for signed-in users (current + new, Persian errors).
export async function POST(request: NextRequest) {
  const auth = await authorizeApiRequest(request);
  if (!auth.ok) return auth.response;
  const body = await request.json().catch(() => null);
  if (!isRecord(body)) return NextResponse.json({ error: "درخواست نامعتبر است." }, { status: 400 });
  const current = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const next = typeof body.newPassword === "string" ? body.newPassword : "";
  if (!current) return NextResponse.json({ error: "گذرواژه فعلی را وارد کنید." }, { status: 400 });
  if (next.length < 8 || !/[A-Za-z]/.test(next) || !/\d/.test(next) || Buffer.byteLength(next, "utf8") > 72) {
    return NextResponse.json({ error: "گذرواژه جدید باید ۸ تا ۷۲ کاراکتر و شامل حرف و عدد باشد." }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { id: auth.user.id }, select: { password: true } });
  if (!user || !(await verifyPasswordForUser(current, user.password))) {
    return NextResponse.json({ error: "گذرواژه فعلی نادرست است." }, { status: 401 });
  }
  await prisma.user.update({ where: { id: auth.user.id }, data: { password: await hashPassword(next) } });
  await prisma.auditLog.create({
    data: { actorId: auth.user.id, actorRole: auth.user.role, action: "PASSWORD_CHANGED", entityType: "User", entityId: auth.user.id },
  });
  return NextResponse.json({ ok: true, message: "گذرواژه با موفقیت تغییر کرد." });
}

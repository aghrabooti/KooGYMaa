import { NextResponse, type NextRequest } from "next/server";
import { hashPassword } from "@/lib/auth";
import { verifyResetToken } from "@/lib/account-tokens";
import { prisma } from "@/lib/prisma";

// Item 1: complete password recovery with the emailed token.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const next = typeof body?.newPassword === "string" ? body.newPassword : "";
  const claims = verifyResetToken(token);
  if (!claims) return NextResponse.json({ error: "لینک بازیابی نامعتبر یا منقضی است. دوباره درخواست دهید." }, { status: 400 });
  if (next.length < 8 || !/[A-Za-z]/.test(next) || !/\d/.test(next) || Buffer.byteLength(next, "utf8") > 72) {
    return NextResponse.json({ error: "گذرواژه جدید باید ۸ تا ۷۲ کاراکتر و شامل حرف و عدد باشد." }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { id: claims.userId }, select: { id: true, email: true } });
  if (!user || user.email.toLowerCase() !== claims.email.toLowerCase()) {
    return NextResponse.json({ error: "لینک بازیابی نامعتبر است." }, { status: 400 });
  }
  await prisma.user.update({ where: { id: user.id }, data: { password: await hashPassword(next) } });
  await prisma.auditLog.create({
    data: { actorId: user.id, actorRole: null, action: "PASSWORD_RESET_COMPLETED", entityType: "User", entityId: user.id },
  });
  return NextResponse.json({ ok: true, message: "گذرواژه با موفقیت بازنشانی شد. وارد شوید." });
}

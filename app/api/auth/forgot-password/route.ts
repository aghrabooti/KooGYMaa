import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { signResetToken } from "@/lib/account-tokens";

// Item 1: password recovery. Always responds 200 (no account enumeration).
// In this demo the reset token is returned directly; with SMTP configured it would be emailed.
export async function POST(request: NextRequest) {
  const limit = checkRateLimit(`forgot:${getClientIp(request)}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "درخواست‌های شما بیش از حد مجاز است. لطفاً کمی بعد تلاش کنید." }, { status: 429 });
  }
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ ok: true, message: "اگر حسابی با این ایمیل وجود داشته باشد، لینک بازیابی ارسال می‌شود." });
  }
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });
  if (!user) {
    return NextResponse.json({ ok: true, message: "اگر حسابی با این ایمیل وجود داشته باشد، لینک بازیابی ارسال می‌شود." });
  }
  const token = signResetToken(user.id, user.email);
  await prisma.auditLog.create({
    data: { actorId: user.id, actorRole: null, action: "PASSWORD_RESET_REQUESTED", entityType: "User", entityId: user.id },
  });
  return NextResponse.json({
    ok: true,
    message: "اگر حسابی با این ایمیل وجود داشته باشد، لینک بازیابی ارسال می‌شود.",
    // Demo convenience: real deployments email `${APP_URL}/reset-password?token=…` instead.
    resetToken: process.env.NODE_ENV === "production" && process.env.SMTP_HOST ? undefined : token,
  });
}

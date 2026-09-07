import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { signVerifyToken, verifyVerifyToken } from "@/lib/account-tokens";

// Item 1: email verification (stateless signed tokens + EmailVerification ledger).
async function ensureTable() {
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "EmailVerification" (
    "userId" TEXT NOT NULL PRIMARY KEY REFERENCES "User"("id") ON DELETE CASCADE,
    "verifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
}

// POST → issue a verification token for the signed-in user.
export async function POST(request: NextRequest) {
  const auth = await authorizeApiRequest(request);
  if (!auth.ok) return auth.response;
  const user = await prisma.user.findUnique({ where: { id: auth.user.id }, select: { id: true, email: true } });
  if (!user) return NextResponse.json({ error: "کاربر یافت نشد." }, { status: 404 });
  const token = signVerifyToken(user.id, user.email);
  return NextResponse.json({
    ok: true,
    message: "لینک تأیید ایمیل صادر شد.",
    verifyToken: process.env.NODE_ENV === "production" && process.env.SMTP_HOST ? undefined : token,
  });
}

// PUT { token } → confirm verification.
export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const claims = verifyVerifyToken(token);
  if (!claims) return NextResponse.json({ error: "لینک تأیید نامعتبر یا منقضی است." }, { status: 400 });
  await ensureTable();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "EmailVerification" ("userId") VALUES (?) ON CONFLICT("userId") DO UPDATE SET "verifiedAt"=CURRENT_TIMESTAMP`,
    claims.userId,
  );
  await prisma.auditLog.create({
    data: { actorId: claims.userId, actorRole: null, action: "EMAIL_VERIFIED", entityType: "User", entityId: claims.userId },
  });
  return NextResponse.json({ ok: true, message: "ایمیل با موفقیت تأیید شد." });
}

// GET → verification status of the signed-in user.
export async function GET(request: NextRequest) {
  const auth = await authorizeApiRequest(request);
  if (!auth.ok) return auth.response;
  try {
    await ensureTable();
    const rows = (await prisma.$queryRawUnsafe(`SELECT "verifiedAt" FROM "EmailVerification" WHERE "userId" = ?`, auth.user.id)) as Array<{ verifiedAt: unknown }>;
    return NextResponse.json({ verified: rows.length > 0, verifiedAt: rows[0]?.verifiedAt ?? null });
  } catch {
    return NextResponse.json({ verified: false, verifiedAt: null });
  }
}

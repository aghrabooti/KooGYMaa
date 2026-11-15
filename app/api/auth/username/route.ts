import { NextResponse, type NextRequest } from "next/server";
import { isAccountConflict } from "@/lib/accounts";
import { authorizeApiRequest } from "@/lib/api-auth";
import { validateUsername } from "@/lib/auth-validation";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  const authorization = await authorizeApiRequest(request);
  if (!authorization.ok) return authorization.response;

  const body = await request.json().catch(() => null);
  const validation = validateUsername(body?.username);
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  try {
    const user = await prisma.user.update({
      where: { id: authorization.user.id },
      data: { username: validation.data },
      select: { username: true },
    });
    return NextResponse.json(user);
  } catch (error) {
    if (isAccountConflict(error)) {
      return NextResponse.json({ error: "این نام کاربری قبلاً ثبت شده است." }, { status: 409 });
    }
    console.error("Username update failed:", error);
    return NextResponse.json({ error: "نام کاربری ذخیره نشد. دوباره تلاش کنید." }, { status: 500 });
  }
}

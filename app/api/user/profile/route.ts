import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { validateMemberProfile } from "@/lib/member-validation";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authorization = await authorizeApiRequest(request, ["USER"]);
  if (!authorization.ok) return authorization.response;
  const user = await prisma.user.findUnique({ where: { id: authorization.user.id }, select: { id: true, name: true, email: true, phone: true, avatarUrl: true, createdAt: true } });
  return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: NextRequest) {
  const authorization = await authorizeApiRequest(request, ["USER"]);
  if (!authorization.ok) return authorization.response;
  const validation = validateMemberProfile(await request.json().catch(() => null));
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });
  const user = await prisma.user.update({ where: { id: authorization.user.id }, data: validation.data, select: { id: true, name: true, email: true, phone: true, avatarUrl: true } });
  return NextResponse.json({ user });
}

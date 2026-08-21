import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authorization = await authorizeApiRequest(request, ["USER"]);
  if (!authorization.ok) return authorization.response;
  const notifications = await prisma.notification.findMany({ where: { userId: authorization.user.id }, select: { id: true, type: true, title: true, message: true, href: true, readAt: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ notifications, unread: notifications.filter((item) => !item.readAt).length }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: NextRequest) {
  const authorization = await authorizeApiRequest(request, ["USER"]);
  if (!authorization.ok) return authorization.response;
  const body = await request.json().catch(() => null) as { all?: unknown; ids?: unknown } | null;
  const ids = Array.isArray(body?.ids) ? body.ids.filter((id): id is string => typeof id === "string").slice(0, 100) : [];
  if (body?.all !== true && !ids.length) return NextResponse.json({ error: "Choose notifications to mark as read." }, { status: 400 });
  const result = await prisma.notification.updateMany({ where: { userId: authorization.user.id, ...(body?.all === true ? {} : { id: { in: ids } }), readAt: null }, data: { readAt: new Date() } });
  return NextResponse.json({ updated: result.count });
}

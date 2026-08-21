import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authorization = await authorizeApiRequest(request, ["USER"]);
  if (!authorization.ok) return authorization.response;
  const feedback = await prisma.feedback.findMany({
    where: { recipientId: authorization.user.id, parentId: null },
    select: { id: true, type: true, content: true, readAt: true, createdAt: true, author: { select: { id: true, name: true } }, workoutLog: { select: { id: true, workoutDay: { select: { name: true, plan: { select: { title: true } } } } } }, nutritionLog: { select: { id: true, dietDay: { select: { name: true, plan: { select: { title: true } } } } } }, replies: { select: { id: true, content: true, createdAt: true, author: { select: { name: true } } }, orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" }, take: 100,
  });
  return NextResponse.json({ feedback }, { headers: { "Cache-Control": "no-store" } });
}

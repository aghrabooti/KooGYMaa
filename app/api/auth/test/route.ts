import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authorization = await authorizeApiRequest(request, ["ADMIN"]);
  if (!authorization.ok) return authorization.response;

  const userCount = await prisma.user.count();

  return NextResponse.json(
    {
      database: "connected",
      userCount,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

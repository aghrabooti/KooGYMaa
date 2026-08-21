import { NextResponse, type NextRequest } from "next/server";
import { authorizeApiRequest } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const authorization = await authorizeApiRequest(request);
  if (!authorization.ok) return authorization.response;

  return NextResponse.json(
    { user: authorization.user },
    { headers: { "Cache-Control": "no-store" } },
  );
}

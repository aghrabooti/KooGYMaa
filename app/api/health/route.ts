import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.count();
    return NextResponse.json(
      { ok: true, database: "connected", users },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { ok: false, database: "error", error: message.slice(0, 300) },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
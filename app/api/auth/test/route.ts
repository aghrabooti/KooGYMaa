import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany();
    return NextResponse.json({ message: "DB works", users });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
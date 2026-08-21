import { NextResponse } from "next/server";
import { clearSessionCookies } from "@/lib/session-cookie";

export async function POST() {
  const response = NextResponse.json({ message: "Signed out successfully." });
  response.headers.set("Cache-Control", "no-store");
  clearSessionCookies(response);
  return response;
}

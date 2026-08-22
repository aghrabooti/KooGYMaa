import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Reports which database-related environment variables are present (never
// their values) so a misconfigured deployment can be diagnosed from the
// browser instead of digging through serverless logs.
function envPresence() {
  const names = [
    "LIBSQL_DATABASE_URL",
    "TURSO_DATABASE_URL",
    "DATABASE_URL",
    "LIBSQL_DATABASE_AUTH_TOKEN",
    "TURSO_AUTH_TOKEN",
    "DATABASE_AUTH_TOKEN",
    "JWT_SECRET",
  ] as const;

  return Object.fromEntries(names.map((name) => [name, Boolean(process.env[name])]));
}

function resolvedUrlKind() {
  const url = (
    process.env.LIBSQL_DATABASE_URL ||
    process.env.TURSO_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "file:./dev.db"
  ).trim();

  if (url.startsWith("libsql://") || url.startsWith("https://")) return "libsql (hosted)";
  if (url.startsWith("postgres")) return "postgres (unsupported)";
  if (url.startsWith("file:")) return "file (local SQLite)";
  return "unknown";
}

export async function GET() {
  try {
    const users = await prisma.user.count();
    return NextResponse.json(
      {
        ok: true,
        database: "connected",
        databaseUrl: resolvedUrlKind(),
        users,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        ok: false,
        database: "error",
        databaseUrl: resolvedUrlKind(),
        env: envPresence(),
        vercel: process.env.VERCEL === "1",
        error: message.slice(0, 300),
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

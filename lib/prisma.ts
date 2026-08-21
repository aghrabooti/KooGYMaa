import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl =
  process.env.LIBSQL_DATABASE_URL || process.env.DATABASE_URL || "file:./dev.db";

if (databaseUrl.startsWith("postgres")) {
  throw new Error(
    "KooGYMaa requires a libSQL/SQLite database, but the database URL points to PostgreSQL " +
      `(${databaseUrl.slice(0, 14)}...). On Vercel this is usually a leftover Postgres ` +
      "integration variable: set LIBSQL_DATABASE_URL to your libsql:// URL (it takes " +
      "priority over DATABASE_URL), or delete the postgres DATABASE_URL in " +
      "Settings → Environment Variables."
  );
}

// Serverless filesystems are read-only, so a file: URL on Vercel means every
// login/register write fails with a confusing 500. Fail fast with guidance.
if (process.env.VERCEL === "1" && databaseUrl.startsWith("file:")) {
  throw new Error(
    "KooGYMaa cannot use a local SQLite file on Vercel (read-only filesystem). " +
      "Create a hosted libSQL database (Turso), apply prisma/turso-demo-setup.sql, " +
      "then set LIBSQL_DATABASE_URL (libsql://...), LIBSQL_DATABASE_AUTH_TOKEN, and " +
      "JWT_SECRET in Vercel → Settings → Environment Variables. See docs/deployment.md."
  );
}

const adapter = new PrismaLibSql({
  url: databaseUrl,
  authToken:
    process.env.LIBSQL_DATABASE_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN,
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
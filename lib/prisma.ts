import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl =
  process.env.LIBSQL_DATABASE_UR || process.env.DATABASE_URL || "file:./dev.db";

if (databaseUrl.startsWith("postgres")) {
  throw new Error(
    "KooGYMaa requires a libSQL/SQLite database, but the database URL points to PostgreSQL " +
      `(${databaseUrl.slice(0, 14)}...). On Vercel this is usually a leftover Postgres ` +
      "integration variable: set LIBSQL_DATABASE_URL to your libsql:// URL (it takes " +
      "priority over DATABASE_URL), or delete the postgres DATABASE_URL in " +
      "Settings → Environment Variables."
  );
}

const adapter = new PrismaLibSql({
  url: databaseUrl,
  authToken:
    process.env.LIBSQL_DATABASE_AUTH_TOKE || process.env.DATABASE_AUTH_TOKEN,
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
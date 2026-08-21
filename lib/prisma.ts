import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl =
  process.env.LIBSQL_DATABASE_URL || process.env.DATABASE_URL || "file:./dev.db";

// Detect configurations that can never serve queries and describe the fix with
// an actionable message. These do NOT throw at module load: Next.js imports
// every route module while collecting page data at build time, so throwing
// here turns a runtime configuration issue into a cryptic
// "Failed to collect configuration" build error on Vercel. Instead the first
// actual database use throws the descriptive message (Vercel function logs
// and /api/health both surface it).
function getConfigurationError(): string | null {
  if (databaseUrl.startsWith("postgres")) {
    return (
      "KooGYMaa requires a libSQL/SQLite database, but the database URL points to PostgreSQL " +
      `(${databaseUrl.slice(0, 14)}...). On Vercel this is usually a leftover Postgres ` +
      "integration variable: set LIBSQL_DATABASE_URL to your libsql:// URL (it takes " +
      "priority over DATABASE_URL), or delete the postgres DATABASE_URL in " +
      "Settings → Environment Variables. Set it for both Production and Preview, then redeploy."
    );
  }

  // Serverless filesystems are read-only, so a file: URL on Vercel means every
  // login/register write fails.
  if (process.env.VERCEL === "1" && databaseUrl.startsWith("file:")) {
    return (
      "KooGYMaa cannot use a local SQLite file on Vercel (read-only filesystem). " +
      "Create a hosted libSQL database (Turso), apply prisma/turso-demo-setup.sql, " +
      "then set LIBSQL_DATABASE_URL (libsql://...), LIBSQL_DATABASE_AUTH_TOKEN, and " +
      "JWT_SECRET in Vercel → Settings → Environment Variables (enable them for both " +
      "Production and Preview), and redeploy. See docs/deployment.md."
    );
  }

  return null;
}

const configurationError = getConfigurationError();

function createPrismaClient(): PrismaClient {
  if (configurationError) {
    console.error(`[koogymaa] Database misconfiguration: ${configurationError}`);
    return new Proxy({} as PrismaClient, {
      get() {
        throw new Error(`KooGYMaa database misconfiguration: ${configurationError}`);
      },
    });
  }

  const adapter = new PrismaLibSql({
    url: databaseUrl,
    authToken:
      process.env.LIBSQL_DATABASE_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN,
  });

  return globalForPrisma.prisma ?? new PrismaClient({ adapter });
}

export const prisma = createPrismaClient();

if (!configurationError && process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

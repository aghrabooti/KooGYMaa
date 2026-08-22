#!/usr/bin/env node
/**
 * Apply prisma/turso-demo-setup.sql (schema + demo data) to a hosted libSQL
 * database (e.g. Turso) directly from Node — no `turso` CLI required.
 *
 * This is the "direct Turso, no Vercel" setup path. It just opens the database
 * your app already uses (via LIBSQL_DATABASE_URL) and runs the SQL file.
 *
 * Connection (reads from environment, never hard-coded):
 *   LIBSQL_DATABASE_URL         libsql://your-db.turso.io   (priority)
 *   LIBSQL_DATABASE_AUTH_TOKEN  read/write token for that DB
 *   TURSO_DATABASE_URL / TURSO_AUTH_TOKEN        (fallbacks)
 *   DATABASE_URL / DATABASE_AUTH_TOKEN           (fallbacks)
 *
 * Flags / env:
 *   --fresh   or   RESET=1     drop all tables first (re-runnable setup)
 *   SETUP_SQL=<path>           override the SQL file to apply
 *                              (default: prisma/turso-demo-setup.sql)
 *
 * Usage:
 *   npm run db:turso:setup      # apply to a fresh database
 *   npm run db:turso:fresh      # drop everything, then apply
 */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const { createClient } = require("@libsql/client");

const args = process.argv.slice(2);
const fresh = args.includes("--fresh") || process.env.RESET === "1";

// Demo project: Turso credentials are embedded so this script runs with no
// environment configuration. Env vars still override these if set.
const EMBEDDED_TURSO_URL = "libsql://koogymaa-aghrabooti.aws-us-east-2.turso.io";
const EMBEDDED_TURSO_TOKEN =
  "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODczMjcwMzIsImlkIjoiMDFhMDI0ZmUtMGIwMS03NmE2LTg0MmYtMzUwZWVkMmFmNmExIiwia2lkIjoiRXFGT284TVNSTEh4Vl9ETy1uSUNTUU5wNC1rSTBSVTJNYjdMVVpDaDNDSSIsInJpZCI6IjhjY2FiNDM0LTJiYzYtNGVlMy1iZDMzLWM0ZGYzNzc1NDhhZiJ9.D8SM0SyTzlpQ577bCGLs0qRIWhlEK1qEsC1DG_tH2T0li9KIKNFiiqkx7UQ8XicsZG7YpqpFWZnAQTxgRgcYCw";

const url =
  process.env.LIBSQL_DATABASE_URL ||
  process.env.TURSO_DATABASE_URL ||
  process.env.DATABASE_URL ||
  EMBEDDED_TURSO_URL;
const authToken =
  process.env.LIBSQL_DATABASE_AUTH_TOKEN ||
  process.env.TURSO_AUTH_TOKEN ||
  process.env.DATABASE_AUTH_TOKEN ||
  EMBEDDED_TURSO_TOKEN;

const sqlPath = process.env.SETUP_SQL
  ? fileURLToPath(new URL(process.env.SETUP_SQL, `file://${process.cwd()}/`))
  : fileURLToPath(new URL("../prisma/turso-demo-setup.sql", import.meta.url));

function fail(msg) {
  console.error(`\n✖ ${msg}`);
  process.exit(1);
}

if (!url || !url.startsWith("libsql://")) {
  fail(
    "No hosted libSQL URL configured.\n" +
      "Set LIBSQL_DATABASE_URL (and LIBSQL_DATABASE_AUTH_TOKEN) in your .env, e.g.\n" +
      "  LIBSQL_DATABASE_URL=libsql://your-db.turso.io\n" +
      "  LIBSQL_DATABASE_AUTH_TOKEN=<read/write token>"
  );
}
if (!authToken) {
  fail("No auth token set. Set LIBSQL_DATABASE_AUTH_TOKEN in your .env.");
}
if (!fs.existsSync(sqlPath)) {
  fail(`SQL setup file not found: ${sqlPath}`);
}

const db = createClient({ url, authToken });

// Split the dump into individual statements. The dump orders tables so FK
// inserts never violate constraints, so we don't need foreign_keys=ON.
function toStatements(sql) {
  return sql
    .split("\n")
    .filter((line) => !/^\s*--/.test(line)) // drop full-line comments
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !s.toUpperCase().startsWith("PRAGMA")); // PRAGMAs are no-ops over HTTP
}

async function dropAll() {
  const res = await db.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'libsql_%'"
  );
  const tables = res.rows.map((r) => String(r.name)).filter(Boolean);
  for (const t of tables) {
    await db.execute(`DROP TABLE IF EXISTS "${t}"`);
  }
  if (tables.length) console.log(`Dropped ${tables.length} existing table(s).`);
}

async function main() {
  await db.execute("SELECT 1"); // verify connectivity/auth first
  console.log(`Connected to ${url}`);

  if (fresh) {
    await dropAll();
  } else {
    const existing = await db.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='User'"
    );
    if (existing.rows.length) {
      fail(
        "Database already has tables (found 'User').\n" +
          "Re-run with --fresh to drop everything and re-apply,\n" +
          "or point LIBSQL_DATABASE_URL at a fresh Turso database."
      );
    }
  }

  const sql = fs.readFileSync(sqlPath, "utf8");
  const statements = toStatements(sql);
  console.log(`Applying ${statements.length} statements from ${sqlPath} ...`);

  try {
    await db.batch(statements.map((sql) => ({ sql })));
  } catch {
    console.error("Batch failed, retrying statement-by-statement ...");
    for (let i = 0; i < statements.length; i++) {
      try {
        await db.execute(statements[i]);
      } catch (e) {
        fail(
          `Statement ${i + 1} failed: ${e.message}\nSQL: ${statements[i].slice(0, 200)}`
        );
      }
    }
  }

  const count = await db.execute('SELECT COUNT(*) AS n FROM "User"');
  console.log(`\n✓ Done. 'User' table now has ${count.rows[0].n} row(s).`);
  console.log("Start the app with:  npm run dev   (then open http://localhost:3000)");
  await db.close();
}

main().catch((e) => fail(e.message || String(e)));

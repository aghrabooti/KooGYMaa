import { readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { createClient, type Client } from "@libsql/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const setupPath = "prisma/turso-demo-setup.sql";
const migrationsDir = "prisma/migrations";

// The hosted database is initialized by pasting prisma/turso-demo-setup.sql
// into the Turso SQL editor. If that file drifts from the migration chain,
// the live site gets a schema that does not match what Prisma Client expects
// (login/register break with 500s). Guard the contract here.

const migrationsDbPath = join(tmpdir(), `koogymaa-mig-${randomUUID()}.db`);
const hostedDbPath = join(tmpdir(), `koogymaa-hosted-${randomUUID()}.db`);
let migrationsDb: Client;
let hostedDb: Client;

async function catalog(client: Client) {
  const result = await client.execute(
    "SELECT type, name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND type IN ('table', 'index') ORDER BY type, name",
  );

  return result.rows.map((row) => ({
    key: `${String(row.type)}:${String(row.name)}`,
    sql: String(row.sql ?? "").replace(/\s+/g, " ").replace(/"/g, "").trim().toLowerCase(),
  }));
}

beforeAll(async () => {
  migrationsDb = createClient({ url: `file:${migrationsDbPath}` });
  const migrationDirs = (await readdir(migrationsDir)).filter((name) => /\d+_.+/.test(name)).sort();
  for (const dir of migrationDirs) {
    await migrationsDb.executeMultiple(
      await readFile(join(migrationsDir, dir, "migration.sql"), "utf8"),
    );
  }

  hostedDb = createClient({ url: `file:${hostedDbPath}` });
  await hostedDb.executeMultiple(await readFile(setupPath, "utf8"));
});

afterAll(async () => {
  migrationsDb.close();
  hostedDb.close();
  await rm(migrationsDbPath, { force: true });
  await rm(hostedDbPath, { force: true });
});

describe("hosted setup SQL", () => {
  it("contains no statements besides the expected DDL and seed INSERTs", async () => {
    const raw = await readFile(setupPath, "utf8");
    const statements = raw
      .split(/;\s*(?:\r?\n|$)/)
      .map((statement) => statement.trim())
      .filter(Boolean)
      .filter((statement) => !statement.startsWith("--"));

    for (const statement of statements) {
      expect(statement.split("\n")[0]).toMatch(
        /^(PRAGMA foreign_keys|PRAGMA defer_foreign_keys|CREATE TABLE|CREATE (UNIQUE )?INDEX|INSERT INTO) /,
      );
    }
  });

  it("produces a schema identical to the migration chain", async () => {
    const expected = await catalog(migrationsDb);
    const actual = await catalog(hostedDb);

    expect(actual.map((entry) => entry.key)).toEqual(expected.map((entry) => entry.key));
    expect(actual.map((entry) => entry.sql)).toEqual(expected.map((entry) => entry.sql));
  });

  it("seeds usable demo accounts and gyms", async () => {
    const users = await hostedDb.execute(
      "SELECT role, status, COUNT(*) AS count FROM User GROUP BY role, status ORDER BY role",
    );
    expect(users.rows.length).toBeGreaterThan(0);
    for (const row of users.rows) {
      expect(String(row.status)).toBe("ACTIVE");
    }

    const gyms = await hostedDb.execute("SELECT COUNT(*) AS count FROM Gym WHERE status = 'ACTIVE'");
    expect(Number(gyms.rows[0].count)).toBeGreaterThan(0);
  });

  it("has no broken foreign keys in the seed data", async () => {
    const result = await hostedDb.execute("PRAGMA foreign_key_check");
    expect(result.rows).toHaveLength(0);
  });
});

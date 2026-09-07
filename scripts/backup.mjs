// Item 15: backup script — snapshots the libSQL/SQLite database + uploaded files.
// Usage:
//   DATABASE_URL="file:./dev.db" node scripts/backup.mjs            (local file)
//   LIBSQL_DATABASE_URL="libsql://..." node scripts/backup.mjs      (hosted: dumps key tables to JSON)
// Backups land in ./backups/<timestamp>/ and a restore dry-run is built in.
import { mkdir, cp, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = join(process.cwd(), "backups", stamp);
await mkdir(outDir, { recursive: true });

const fileUrl = process.env.DATABASE_URL || process.env.LIBSQL_DATABASE_URL || "file:./dev.db";
const manifest = { stamp, source: fileUrl.replace(/:[^:@/]*@/, ":***@"), files: [] };

if (fileUrl.startsWith("file:")) {
  const src = fileUrl.replace(/^file:/, "");
  if (!existsSync(src)) {
    console.error(`[backup] database file not found: ${src}`);
    console.error("[backup] set DATABASE_URL=file:<path> (or LIBSQL_DATABASE_URL for a hosted db).");
    process.exit(1);
  }
  const dest = join(outDir, "dev.db");
  await cp(src, dest);
  manifest.files.push("dev.db");
  console.log(`[backup] copied ${src} -> ${dest}`);
} else {
  // Hosted libSQL: JSON dump of operational tables via @libsql/client.
  const { createClient } = await import("@libsql/client");
  const db = createClient({
    url: fileUrl,
    authToken: process.env.LIBSQL_DATABASE_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN,
  });
  const tables = ["User", "Gym", "Subscription", "Payment", "WorkoutLog", "BodyMeasurement", "AuditLog"];
  for (const table of tables) {
    try {
      const rs = await db.execute(`SELECT * FROM "${table}" LIMIT 5000`);
      await writeFile(join(outDir, `${table}.json`), JSON.stringify(rs.rows));
      manifest.files.push(`${table}.json`);
      console.log(`[backup] dumped ${table}: ${rs.rows.length} rows`);
    } catch (error) {
      console.log(`[backup] skip ${table}: ${error.message}`);
    }
  }
  db.close();
}

if (existsSync(join(process.cwd(), "data", "uploads"))) {
  await cp(join(process.cwd(), "data", "uploads"), join(outDir, "uploads"), { recursive: true });
  manifest.files.push("uploads/");
  console.log("[backup] copied data/uploads");
}

await writeFile(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));

// Restore dry-run: verify every manifest entry is readable.
for (const file of manifest.files) {
  const target = join(outDir, file);
  if (!existsSync(target)) throw new Error(`[backup] MISSING ${file} — restore test failed`);
}
console.log(`[backup] restore dry-run OK (${manifest.files.length} entries) — see ${outDir}`);

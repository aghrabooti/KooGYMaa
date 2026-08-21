#!/usr/bin/env node
// Dumps the local SQLite database (schema + data) into prisma/turso-demo-setup.sql,
// ready for a hosted libSQL database (e.g. Turso): FK-safe table order, verified
// against the source by docs/deployment.md's Vercel setup flow.
//
// Usage:  [DATABASE_URL=file:./dev.db] node scripts/dump-hosted-sql.mjs
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const { createClient } = require("@libsql/client");

const OUT_PATH = fileURLToPath(new URL("../prisma/turso-demo-setup.sql", import.meta.url));

const esc = (v) => {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number" || typeof v === "bigint") return String(v);
  if (v instanceof Uint8Array) return "X'" + Buffer.from(v).toString("hex") + "'";
  if (typeof v === "boolean") return v ? "1" : "0";
  return "'" + String(v).replace(/'/g, "''") + "'";
};

const db = createClient({ url: process.env.DATABASE_URL || "file:./dev.db" });
const master = await db.execute(
  "SELECT name, sql, type FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE 'libsql_%' ORDER BY name"
);
const tables = master.rows.filter((r) => r.type === "table").map((r) => String(r.name));

// Topological order by FK dependencies so batched inserts never violate FKs
const deps = {};
for (const t of tables) {
  const fks = await db.execute(`PRAGMA foreign_key_list("${t}")`);
  deps[t] = [...new Set(fks.rows.map((r) => String(r.table)).filter((p) => p !== t && tables.includes(p)))];
}
const ordered = [];
const seen = new Set();
const visit = (t, stack = []) => {
  if (seen.has(t)) return;
  if (stack.includes(t)) { seen.add(t); ordered.push(t); return; } // cycle -> dump anyway
  for (const d of deps[t]) visit(d, [...stack, t]);
  seen.add(t); ordered.push(t);
};
tables.forEach((t) => visit(t));

let out = "-- KooGYMaa hosted-database setup (schema + demo data).\n";
out += "-- Generated from the seeded local dev.db. Paste into the Turso dashboard SQL editor,\n";
out += "-- or pipe through the CLI:  turso db shell koogymaa < prisma/turso-demo-setup.sql\n";
out += "PRAGMA foreign_keys = OFF;\nPRAGMA defer_foreign_keys = ON;\n\n";

for (const t of ordered) {
  const ddl = master.rows.find((r) => r.name === t && r.type === "table");
  out += ddl.sql + ";\n";
  const rows = await db.execute(`SELECT * FROM "${t}"`);
  if (rows.rows.length) {
    const cols = rows.columns.map((c) => `"${c}"`).join(", ");
    for (const r of rows.rows) {
      out += `INSERT INTO "${t}" (${cols}) VALUES (${rows.columns.map((c) => esc(r[c])).join(", ")});\n`;
    }
  }
  out += "\n";
}
for (const r of master.rows.filter((r) => ["index", "trigger", "view"].includes(r.type) && r.sql)) {
  out += r.sql + ";\n";
}
out += "\nPRAGMA foreign_keys = ON;\n";
await db.close();

fs.writeFileSync(OUT_PATH, out);
console.log(`written ${OUT_PATH} (${Math.round(fs.statSync(OUT_PATH).size / 1024)} KB)`);

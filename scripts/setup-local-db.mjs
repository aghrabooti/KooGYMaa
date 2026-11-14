#!/usr/bin/env node
/**
 * Create a local demo database from prisma/turso-demo-setup.sql.
 *
 * Useful for a fully offline preview (no Turso needed):
 *
 *   node scripts/setup-local-db.mjs
 *   DATABASE_URL=file:./dev.db npm run dev
 *
 * Demo accounts: admin@koogymaa.test / trainer@koogymaa.test /
 * member@koogymaa.test — password: KooGYMaa123!
 */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const { createClient } = require("@libsql/client");

const url = process.env.DATABASE_URL || "file:./dev.db";
const sqlPath = fileURLToPath(new URL("../prisma/turso-demo-setup.sql", import.meta.url));
const sql = fs.readFileSync(sqlPath, "utf8");

const client = createClient({ url });
await client.executeMultiple(sql);
await client.close();
console.log(`✔ پایگاه داده نمونه ساخته شد: ${url}`);
console.log("  ورود: trainer@koogymaa.test / member@koogymaa.test — گذرواژه: KooGYMaa123!");

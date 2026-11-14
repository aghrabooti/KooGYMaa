#!/usr/bin/env node
/**
 * Build a versioned ZIP of the whole project and register it in the release
 * manifest served by scripts/release-server.mjs.
 *
 * Naming convention (the file name changes after every change):
 *   v1   → first release
 *   v1.1 → small follow-up change   (npm run release:minor)
 *   v1.2 → another small change
 *   v2   → a big change / new feature (npm run release:major)
 *
 * Usage:
 *   npm run release              # next minor: v1 → v1.1
 *   npm run release:minor        # same as above
 *   npm run release:major        # v1.1 → v2
 *   npm run release -- --note "توضیح تغییرات" --bump minor
 *   npm run release -- --version v2.3 --note "..."   # explicit version
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const RELEASES = path.join(ROOT, "releases");
const MANIFEST = path.join(RELEASES, "VERSIONS.json");
const CHANGELOG = path.join(RELEASES, "CHANGELOG.md");

function arg(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function readManifest() {
  if (!fs.existsSync(MANIFEST)) return { project: "KooGYMaa", latest: null, releases: [] };
  return JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
}

function parseVersion(version) {
  const match = /^v(\d+)(?:\.(\d+))?$/.exec(version.trim());
  if (!match) throw new Error(`نسخه نامعتبر است: ${version} (مثال: v1 یا v1.1 یا v2)`);
  return { major: Number(match[1]), minor: Number(match[2] ?? 0) };
}

function formatVersion({ major, minor }) {
  return minor === 0 ? `v${major}` : `v${major}.${minor}`;
}

function nextVersion(latest, bump) {
  if (!latest) return "v1";
  const parsed = parseVersion(latest);
  if (bump === "major") return formatVersion({ major: parsed.major + 1, minor: 0 });
  return formatVersion({ major: parsed.major, minor: parsed.minor + 1 });
}

function faDate(date = new Date()) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Tehran",
  }).format(date);
}

const explicit = arg("--version", null);
const bump = arg("--bump", "minor");
if (!["minor", "major"].includes(bump)) throw new Error("--bump باید minor یا major باشد.");
const note = arg("--note", "نسخه کامل پروژه شامل کد، مستندات، پایگاه داده نمونه و اسکریپتها.");
const replace = process.argv.includes("--replace");

const manifest = readManifest();
const version = explicit ? formatVersion(parseVersion(explicit)) : nextVersion(manifest.latest, bump);
const file = `KooGYMaa-${version}.zip`;
const output = path.join(RELEASES, file);

if (fs.existsSync(output) && !replace) {
  console.error(`✖ فایل ${file} از قبل وجود دارد. برای ساخت دوباره از --replace استفاده کنید یا نسخه را افزایش دهید.`);
  process.exit(1);
}

fs.mkdirSync(RELEASES, { recursive: true });

// Everything in the working tree except build output, dependencies, secrets,
// local databases and previously generated ZIPs.
const exclude = [
  ".git/*", "node_modules/*", ".next/*", "out/*", "build/*", "dist/*",
  "coverage/*", ".turbo/*", ".vercel/*", ".cache/*", "app/generated/prisma/*",
  // releases/ holds generated output (ZIPs + manifest), not project source.
  "backups/*", "data/*", "releases/*", "*.db", "*.db-journal", "*.db-shm",
  "*.db-wal", ".env", ".env.*", "*.tsbuildinfo", "npm-debug.log*", ".DS_Store",
];

const zipArgs = ["-r", "-q", "-X", output, "."];
for (const pattern of exclude) zipArgs.push("-x", pattern);
execFileSync("zip", zipArgs, { cwd: ROOT, stdio: "inherit" });
// .env.example is a template, not a secret — add it back explicitly.
if (fs.existsSync(path.join(ROOT, ".env.example"))) {
  execFileSync("zip", ["-q", "-X", output, ".env.example"], { cwd: ROOT, stdio: "inherit" });
}

const buffer = fs.readFileSync(output);
const sha256 = createHash("sha256").update(buffer).digest("hex");
let fileCount = 0;
try {
  fileCount = execFileSync("unzip", ["-Z1", output], { encoding: "utf8" }).trim().split("\n").filter(Boolean).length;
} catch { /* fileCount is cosmetic */ }

const entry = {
  version,
  file,
  createdAt: new Date().toISOString(),
  createdAtFa: faDate(),
  size: buffer.length,
  sha256,
  files: fileCount,
  note,
};

manifest.project = "KooGYMaa";
manifest.naming = "v1 → v1.1 → v2 (هر تغییر، نام فایل تازه)";
manifest.latest = version;
manifest.releases = [entry, ...(manifest.releases || []).filter((item) => item.version !== version)];
fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);

// Rebuild the changelog from the (deduplicated) manifest so --replace never
// leaves a duplicate section behind.
const changelogHeader = `# تغییرات نسخههای کوجیما\n\nهر بار که تغییری اعمال میشود، یک فایل ZIP تازه با نام نسخه جدید ساخته میشود: \`v1\` → \`v1.1\` → \`v2\`.\n`;
const blocks = manifest.releases
  .map((item) => `\n## ${item.version} — ${item.createdAtFa}\n\n- ${item.note}\n- فایل: \`${item.file}\`\n- حجم: ${(item.size / 1024).toFixed(1)} کیلوبایت · ${item.files} فایل\n- SHA-256: \`${item.sha256}\`\n`)
  .join("");
fs.writeFileSync(CHANGELOG, changelogHeader + blocks);

console.log(`\n✔ نسخه ${version} ساخته شد`);
console.log(`  فایل: releases/${file}`);
console.log(`  حجم: ${(entry.size / 1024).toFixed(1)} کیلوبایت · ${entry.files} فایل`);
console.log(`  SHA-256: ${sha256}`);
console.log(`  نسخه بعدی کوچک: ${nextVersion(version, "minor")} · نسخه بعدی بزرگ: ${nextVersion(version, "major")}\n`);

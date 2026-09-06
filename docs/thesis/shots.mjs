import path from "node:path";
import { fileURLToPath } from "node:url";
const TOOLS = process.env.THESIS_TOOLS || "/tmp/tools";          // dir containing node_modules with playwright, @sparticuz/chromium, pagedjs, mermaid
const HERE = path.dirname(fileURLToPath(import.meta.url));
const { chromium } = await import(path.join(TOOLS, "node_modules/playwright/index.mjs"));
const c = (await import(path.join(TOOLS, "node_modules/@sparticuz/chromium/build/index.js"))).default;
const C = c.default || c; const BASE = "http://localhost:3107";
const emails = { admin: "admin@koogymaa.test", trainer: "trainer@koogymaa.test", member: "member@koogymaa.test" };
const jobs = [
  // [name, role, path, width, mode]
  ["landing", "none", "/", 1280, "fold"], ["landing-full", "none", "/", 1280, "full"],
  ["gyms-public", "none", "/gyms", 1280, "fold"], ["trainers-public", "none", "/trainers", 1280, "fold"],
  ["register", "none", "/register", 1280, "fold"], ["login", "none", "/login", 1280, "fold"], ["forgot", "none", "/forgot-password", 1280, "fold"],
  ["admin-gyms", "admin", "/admin/gyms", 1280, "fold"], ["admin-overview", "admin", "/admin/gyms/seed-gym-atlas", 1280, "full"],
  ["admin-members", "admin", "/admin/gyms/seed-gym-atlas/members", 1280, "full"], ["admin-trainers", "admin", "/admin/gyms/seed-gym-atlas/trainers", 1280, "full"],
  ["admin-plans", "admin", "/admin/gyms/seed-gym-atlas/plans", 1280, "full"], ["admin-subscriptions", "admin", "/admin/gyms/seed-gym-atlas/subscriptions", 1280, "full"],
  ["admin-payments", "admin", "/admin/gyms/seed-gym-atlas/payments", 1280, "full"], ["admin-settings", "admin", "/admin/gyms/seed-gym-atlas/settings", 1280, "full"],
  ["trainer-overview", "trainer", "/trainer", 1280, "full"], ["trainer-students", "trainer", "/trainer/students", 1280, "full"],
  ["trainer-progress", "trainer", "/trainer/progress", 1280, "full"], ["trainer-gyms", "trainer", "/trainer/gyms", 1280, "full"],
  ["trainer-workouts", "trainer", "/trainer/workouts", 1280, "full"], ["trainer-nutrition", "trainer", "/trainer/nutrition", 1280, "full"],
  ["trainer-schedule", "trainer", "/trainer/schedule", 1280, "full"], ["trainer-profile", "trainer", "/trainer/profile", 1280, "full"],
  ["member-overview", "member", "/user", 1280, "full"], ["member-gyms", "member", "/user/gyms", 1280, "full"],
  ["member-trainers", "member", "/user/trainers", 1280, "full"], ["member-workouts", "member", "/user/workouts", 1280, "full"],
  ["member-nutrition", "member", "/user/nutrition", 1280, "full"], ["member-schedule", "member", "/user/schedule", 1280, "full"],
  ["member-progress", "member", "/user/progress", 1280, "full"], ["member-subscriptions", "member", "/user/subscriptions", 1280, "full"],
  ["member-notifications", "member", "/user/notifications", 1280, "full"], ["member-profile", "member", "/user/profile", 1280, "full"],
  ["mobile-member", "member", "/user", 390, "fold"], ["mobile-menu", "member", "/user", 390, "click:.hamburger"],
  ["dark-admin", "admin", "/admin/gyms/seed-gym-atlas", 1280, "fold:dark"],
];
const browser = await chromium.launch({ executablePath: await C.executablePath(), args: ["--no-sandbox","--disable-gpu","--disable-dev-shm-usage"], env: { ...process.env, LD_LIBRARY_PATH: process.env.LD_LIBRARY_PATH || "/tmp/al2023/lib:/tmp" } });
for (const [name, role, path, width, mode] of jobs) {
  const theme = mode.endsWith(":dark") ? "dark" : "light";
  const ctx = await browser.newContext({ viewport: { width, height: width < 800 ? 844 : 800 }, deviceScaleFactor: 2, isMobile: width < 800, hasTouch: width < 800 });
  await ctx.addCookies([{ name: "locale", value: "fa", url: BASE }, { name: "theme", value: theme, url: BASE }]);
  const page = await ctx.newPage();
  if (emails[role]) await page.request.post(`${BASE}/api/auth/login`, { data: { email: emails[role], password: "KooGYMaa123!", remember: true } });
  await page.goto(BASE + path, { waitUntil: "networkidle" }); await page.waitForTimeout(700);
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  if (mode.startsWith("click:")) { await page.click(mode.slice(6)); await page.waitForTimeout(600); }
  const full = mode.startsWith("full");
  await page.screenshot({ path: path.join(HERE, `shots/${name}.png`), fullPage: full });
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  console.log(name.padEnd(22), full ? `full h=${h}` : "fold");
  await ctx.close();
}
await browser.close();

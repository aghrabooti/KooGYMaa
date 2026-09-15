// Capture ENGLISH UI screenshots for the presentation deck.
// Requires the dev server running on BASE and THESIS_TOOLS with playwright.
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
const TOOLS = process.env.THESIS_TOOLS || "/tmp/tools";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const { chromium } = await import(path.join(TOOLS, "node_modules/playwright/index.mjs"));
const c = (await import(path.join(TOOLS, "node_modules/@sparticuz/chromium/build/index.js"))).default;
const C = c.default || c;
const BASE = process.env.APP_URL || "http://localhost:3107";
const OUT = path.join(HERE, "assets");
fs.mkdirSync(OUT, { recursive: true });

const emails = { admin: "admin@koogymaa.test", trainer: "trainer@koogymaa.test", member: "member@koogymaa.test" };

// [name, role, path, width, mode]  mode: fold | full | fold:dark | click:<sel>
const jobs = [
  ["landing",              "none",    "/",                                          1440, "fold"],
  ["login",                "none",    "/login",                                     1440, "fold"],
  ["gyms-public",          "none",    "/gyms",                                      1440, "fold"],
  ["trainers-public",      "none",    "/trainers",                                  1440, "fold"],
  ["member-overview",      "member",  "/user",                                      1440, "fold"],
  ["member-gyms",          "member",  "/user/gyms",                                 1440, "fold"],
  ["member-workouts",      "member",  "/user/workouts",                             1440, "fold"],
  ["member-nutrition",     "member",  "/user/nutrition",                            1440, "fold"],
  ["member-progress",      "member",  "/user/progress",                             1440, "fold"],
  ["member-subscriptions", "member",  "/user/subscriptions",                        1440, "fold"],
  ["trainer-overview",     "trainer", "/trainer",                                   1440, "fold"],
  ["trainer-students",     "trainer", "/trainer/students",                          1440, "fold"],
  ["trainer-workouts",     "trainer", "/trainer/workouts",                          1440, "fold"],
  ["trainer-schedule",     "trainer", "/trainer/schedule",                          1440, "fold"],
  ["trainer-progress",     "trainer", "/trainer/progress",                          1440, "fold"],
  ["admin-overview",       "admin",   "/admin/gyms/seed-gym-atlas",                 1440, "fold"],
  ["admin-members",        "admin",   "/admin/gyms/seed-gym-atlas/members",         1440, "fold"],
  ["admin-plans",          "admin",   "/admin/gyms/seed-gym-atlas/plans",           1440, "fold"],
  ["admin-payments",       "admin",   "/admin/gyms/seed-gym-atlas/payments",        1440, "fold"],
  ["admin-subscriptions",  "admin",   "/admin/gyms/seed-gym-atlas/subscriptions",   1440, "fold"],
  ["dark-member",          "member",  "/user",                                      1440, "fold:dark"],
  ["mobile-member",        "member",  "/user",                                       390, "fold"],
];

// Role dashboards still contain hard-coded Persian copy (only public pages and
// the shared chrome are localized). For an English deck we translate the
// rendered DOM at capture time using the project dictionary plus a curated
// supplement — the app itself is left untouched.
const dict = JSON.parse(fs.readFileSync(path.join(HERE, "fa2en.json"), "utf8"));
const fromProject = JSON.parse(
  fs.readFileSync(path.join(HERE, "fa2en-dict.json"), "utf8")
);
const FA2EN = { ...fromProject, ...dict };

const browser = await chromium.launch({
  executablePath: await C.executablePath(),
  args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  env: { ...process.env, LD_LIBRARY_PATH: process.env.LD_LIBRARY_PATH || "/tmp/al2023/lib:/tmp" },
});

const only = process.argv.slice(2);
for (const [name, role, p, width, mode] of jobs) {
  if (only.length && !only.includes(name)) continue;
  const theme = mode.endsWith(":dark") ? "dark" : "light";
  const mobile = width < 800;
  const ctx = await browser.newContext({
    viewport: { width, height: mobile ? 844 : 900 },
    deviceScaleFactor: 1.25, isMobile: mobile, hasTouch: mobile,
  });
  // locale=en → English UI, LTR
  await ctx.addCookies([
    { name: "locale", value: "en", url: BASE },
    { name: "theme", value: theme, url: BASE },
  ]);
  const page = await ctx.newPage();
  if (emails[role]) {
    await page.request.post(`${BASE}/api/auth/login`, {
      data: { email: emails[role], password: process.env.SEED_PASSWORD || "KooGYMaa123!", remember: true },
    });
  }
  try {
    await page.goto(BASE + p, { waitUntil: "networkidle", timeout: 90000 });
  } catch { await page.waitForTimeout(2000); }
  await page.waitForTimeout(1200);
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });

  // Translate any remaining Persian text nodes / attributes to English.
  await page.evaluate((map) => {
    const FA_LETTER = /[\u0621-\u06CC\u0670-\u06D3\u200C]/;
    const HAS_FA = /[\u0600-\u06FF]/;
    const keys = Object.keys(map).sort((a, b) => b.length - a.length);

    // Jalali → Gregorian (the UI formats dates with the Persian calendar).
    // Jalali → Gregorian via Intl (authoritative), precomputed as a lookup.
    const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const JMAP = (() => {
      const fmt = new Intl.DateTimeFormat("en-u-ca-persian-nu-latn", {
        year: "numeric", month: "numeric", day: "numeric", timeZone: "UTC" });
      const map = {};
      for (let t = Date.UTC(2023, 0, 1); t < Date.UTC(2029, 0, 1); t += 86400000) {
        const d = new Date(t);
        const parts = fmt.formatToParts(d);
        const g = (k) => +parts.find((x) => x.type === k).value;
        map[`${g("year")}/${g("month")}/${g("day")}`] =
          `${d.getUTCDate()} ${MON[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
      }
      return map;
    })();
    const JNOW = +new Intl.DateTimeFormat("en-u-ca-persian-nu-latn", { year: "numeric" })
      .format(new Date());

    function numerals(s) {
      return s
        .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
        .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
        .replace(/\u066C/g, ",")   // Arabic thousands separator
        .replace(/\u066B/g, ".")   // Arabic decimal separator
        .replace(/\u200F|\u200E|\u061C/g, "");
    }

    const JMONTH = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور",
                    "مهر","آبان","آذر","دی","بهمن","اسفند"];
    function dates(s) {
      // "1405/6/22"
      let out = s.replace(/\b(1[34]\d{2})\/(\d{1,2})\/(\d{1,2})\b/g,
        (m, y, mo, d) => JMAP[`${+y}/${+mo}/${+d}`] || m);
      // "22 آبان 1405"
      out = out.replace(
        new RegExp(`(\\d{1,2})\\s+(${JMONTH.join("|")})\\s+(1[34]\\d{2})`, "g"),
        (m, d, mon, y) => JMAP[`${+y}/${JMONTH.indexOf(mon) + 1}/${+d}`] || m);
      // "22 آبان" (current Jalali year implied)
      out = out.replace(
        new RegExp(`(\\d{1,2})\\s+(${JMONTH.join("|")})(?!\\s+\\d)`, "g"),
        (m, d, mon) => {
          const full = JMAP[`${JNOW}/${JMONTH.indexOf(mon) + 1}/${+d}`];
          return full ? full.split(" ").slice(0, 2).join(" ") : m;
        });
      return out;
    }

    function translate(raw) {
      if (!raw || !HAS_FA.test(raw)) return null;
      const trimmed = raw.trim();
      if (!trimmed) return null;

      // 1. exact match wins — never corrupts surrounding words
      if (map[trimmed] !== undefined) return raw.replace(trimmed, map[trimmed]);

      // 2. dates first: Persian month names must be read as dates, not words
      let out = dates(numerals(raw));
      if (map[out.trim()] !== undefined) return out.replace(out.trim(), map[out.trim()]);

      // 3. substring replacement, but only at Persian word boundaries so that
      //    e.g. "و" (and) never splits "کیلوگرم".
      for (const k of keys) {
        if (k.length < 2) continue;
        let idx = 0;
        while ((idx = out.indexOf(k, idx)) !== -1) {
          const before = out[idx - 1];
          const after = out[idx + k.length];
          const okBefore = before === undefined || !FA_LETTER.test(before);
          const okAfter = after === undefined || !FA_LETTER.test(after);
          if (okBefore && okAfter) {
            out = out.slice(0, idx) + map[k] + out.slice(idx + k.length);
            idx += map[k].length;
          } else {
            idx += k.length;
          }
        }
      }
      return out !== raw ? out : null;
    }

    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let n; while ((n = w.nextNode())) nodes.push(n);
    for (const node of nodes) {
      if (node.parentElement && /SCRIPT|STYLE/.test(node.parentElement.tagName)) continue;
      const v = translate(node.nodeValue);
      if (v !== null) node.nodeValue = v;
      else if (node.nodeValue) {
        const conv = dates(numerals(node.nodeValue));
        if (conv !== node.nodeValue) node.nodeValue = conv;
      }
    }
    document.querySelectorAll("[placeholder],[title],[aria-label],[value]").forEach((e) => {
      ["placeholder", "title", "aria-label", "value"].forEach((a) => {
        const v = e.getAttribute(a);
        if (!v) return;
        const t = translate(v);
        e.setAttribute(a, t !== null ? t : dates(numerals(v)));
      });
    });
    document.querySelectorAll("option").forEach((o) => {
      const t = translate(o.textContent);
      if (t !== null) o.textContent = t;
    });
    document.documentElement.setAttribute("dir", "ltr");
    document.documentElement.setAttribute("lang", "en");
  }, FA2EN);
  await page.waitForTimeout(400);
  if (mode.startsWith("click:")) { await page.click(mode.slice(6)); await page.waitForTimeout(700); }
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: mode.startsWith("full") });
  console.log("✓", name);
  await ctx.close();
}
await browser.close();

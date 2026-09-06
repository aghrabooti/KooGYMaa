// HTML → PDF through paged.js (footnotes, right-page chapter starts) + DOM post-pass for page labels & TOC numbers.
import path from "node:path";
import { fileURLToPath } from "node:url";
const TOOLS = process.env.THESIS_TOOLS || "/tmp/tools";          // dir containing node_modules with playwright, @sparticuz/chromium, pagedjs, mermaid
const HERE = path.dirname(fileURLToPath(import.meta.url));
const { chromium } = await import(path.join(TOOLS, "node_modules/playwright/index.mjs"));
const c = (await import(path.join(TOOLS, "node_modules/@sparticuz/chromium/build/index.js"))).default;
import fs from "node:fs";
const C = c.default || c;
const [,, input, output, mapOut] = process.argv;
const browser = await chromium.launch({ executablePath: await C.executablePath(), args: ["--no-sandbox","--disable-gpu","--disable-dev-shm-usage","--allow-file-access-from-files"], env: { ...process.env, LD_LIBRARY_PATH: process.env.LD_LIBRARY_PATH || "/tmp/al2023/lib:/tmp" } });
const page = await browser.newPage();
page.on("pageerror", e => console.log("pageerror:", String(e).slice(0, 300)));
await page.goto("file://" + input, { waitUntil: "networkidle" });
await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
await page.evaluate(() => { window.PagedConfig = { auto: true, after: (flow) => { window.__pagedDone = flow.total; } }; });
const t0 = Date.now();
await page.addScriptTag({ path: path.join(TOOLS, "node_modules/pagedjs/dist/paged.polyfill.js") });
await page.waitForFunction(() => window.__pagedDone !== undefined, null, { timeout: 1800000 });
console.log("paged.js layout:", await page.evaluate(() => window.__pagedDone), "pages in", ((Date.now() - t0) / 1000).toFixed(1), "s");
const map = await page.evaluate(() => {
  const FA = "۰۱۲۳۴۵۶۷۸۹"; const fa = n => String(n).replace(/\d/g, d => FA[d]);
  const ABJAD = ["الف","ب","ج","د","ه","و","ز","ح","ط","ی","ک","ل","م","ن","س","ع","ف","ص","ق","ر","ش","ت","ث","خ","ذ","ض","ظ","غ"];
  const pages = [...document.querySelectorAll(".pagedjs_page")];
  const first = pages.findIndex(p => p.querySelector("#bismillah"));
  const ch1 = pages.findIndex(p => p.querySelector("#ch1"));
  const labels = pages.map((p, i) => i < first ? "" : i < ch1 ? (ABJAD[i - first] || "?") : fa(i - ch1 + 1));
  const printed = pages.map((p, i) => (labels[i] && !p.classList.contains("pagedjs_blank_page") && !p.querySelector("[data-nonum]")) ? labels[i] : "");
  const st = document.createElement("style"); st.textContent = ".pagedjs_margin-content::after{content:none!important}"; document.head.appendChild(st);
  pages.forEach((p, i) => { const box = p.querySelector(".pagedjs_margin-bottom-center .pagedjs_margin-content"); if (box) box.textContent = printed[i]; });
  const missing = [], targets = {};
  document.querySelectorAll("[data-target]").forEach(el => {
    const id = el.dataset.target; const t = document.getElementById(id);
    if (!t) { missing.push(id); return; }
    const i = pages.indexOf(t.closest(".pagedjs_page")); el.textContent = labels[i]; targets[id] = i;
  });
  const ids = {}; document.querySelectorAll(".pagedjs_page [id]").forEach(el => { if (!(el.id in ids) && !el.id.startsWith("page-")) ids[el.id] = pages.indexOf(el.closest(".pagedjs_page")); });
  return { total: pages.length, first, ch1, labels, printed, missing, targets, ids, blank: pages.map(p => p.classList.contains("pagedjs_blank_page")) };
});
console.log("pages:", map.total, "front from", map.first, "ch1 at", map.ch1, "missing targets:", map.missing);
if (mapOut) fs.writeFileSync(mapOut, JSON.stringify(map));
await page.pdf({ path: output, printBackground: true, preferCSSPageSize: true });
await browser.close(); console.log("wrote", output);

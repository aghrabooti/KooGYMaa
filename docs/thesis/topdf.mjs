import path from "node:path";
import { fileURLToPath } from "node:url";
const TOOLS = process.env.THESIS_TOOLS || "/tmp/tools";          // dir containing node_modules with playwright, @sparticuz/chromium, pagedjs, mermaid
const HERE = path.dirname(fileURLToPath(import.meta.url));
const { chromium } = await import(path.join(TOOLS, "node_modules/playwright/index.mjs"));
const c = (await import(path.join(TOOLS, "node_modules/@sparticuz/chromium/build/index.js"))).default;
const C = c.default || c;
const [,, input, output, ...rest] = process.argv;
const browser = await chromium.launch({ executablePath: await C.executablePath(), args: ["--no-sandbox","--disable-gpu","--disable-dev-shm-usage","--allow-file-access-from-files"], env: { ...process.env, LD_LIBRARY_PATH: process.env.LD_LIBRARY_PATH || "/tmp/al2023/lib:/tmp" } });
const page = await browser.newPage();
await page.goto("file://" + input, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
if (rest.includes("--png")) { await page.setViewportSize({ width: 794, height: 1123 }); await page.screenshot({ path: output, fullPage: true }); }
else await page.pdf({ path: output, format: "A4", printBackground: true, preferCSSPageSize: true });
await browser.close(); console.log("wrote", output);

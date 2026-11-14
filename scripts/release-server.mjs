#!/usr/bin/env node
/**
 * Live download server for versioned KooGYMaa ZIP releases.
 *
 *   npm run releases:serve            # http://0.0.0.0:4173
 *   PORT=8080 npm run releases:serve  # custom port
 *
 * Reads releases/VERSIONS.json on every request, so a new ZIP made with
 * `npm run release` appears immediately without restarting the server.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const RELEASES = path.join(ROOT, "releases");
const MANIFEST = path.join(RELEASES, "VERSIONS.json");
const PORT = Number(process.env.PORT || 4173);
const HOST = "0.0.0.0";

function readManifest() {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  } catch {
    return { project: "KooGYMaa", latest: null, releases: [] };
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

function faNumber(value) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

function faDate(iso) {
  try {
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      dateStyle: "long", timeStyle: "short", timeZone: "Asia/Tehran",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatSize(bytes) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} مگابایت`
    : `${(bytes / 1024).toFixed(1)} کیلوبایت`;
}

function renderPage(manifest) {
  const releases = [...(manifest.releases || [])];
  const latest = releases.find((item) => item.version === manifest.latest) || releases[0] || null;
  const cards = releases.map((item, index) => `
      <article class="card${index === 0 ? " card--latest" : ""}">
        <div class="card__top">
          <span class="version">${escapeHtml(item.version)}</span>
          ${index === 0 ? '<span class="pill">آخرین نسخه</span>' : ""}
        </div>
        <p class="note">${escapeHtml(item.note || "نسخه کامل پروژه")}</p>
        <dl>
          <div><dt>تاریخ</dt><dd>${escapeHtml(item.createdAtFa || faDate(item.createdAt))}</dd></div>
          <div><dt>حجم</dt><dd>${formatSize(item.size || 0)}</dd></div>
          <div><dt>تعداد فایلها</dt><dd>${faNumber(item.files || 0)}</dd></div>
        </dl>
        <code class="hash" dir="ltr">${escapeHtml(String(item.sha256 || "").slice(0, 24))}…</code>
        <a class="download" href="/download/${encodeURIComponent(item.file)}">دانلود ${escapeHtml(item.file)} <span aria-hidden="true">↓</span></a>
      </article>`).join("");

  return `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>بایگانی نسخههای کوجیما | دانلود ZIP</title>
<style>
  :root { --ink:#151b15; --muted:#6d786c; --line:#e2e6dc; --paper:#f6f7f2; --lime:#c9f36b; --green:#24321d; }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--paper); color:var(--ink); font-family:Tahoma,"Segoe UI",system-ui,sans-serif; line-height:1.8; }
  a { color:inherit; text-decoration:none; }
  .wrap { margin:0 auto; max-width:1080px; padding:0 20px 60px; }
  header.hero { background:linear-gradient(115deg,#1d261c,#33462a); color:#fff; padding:34px 0 76px; }
  .hero .wrap { padding-bottom:0; }
  .brand { align-items:center; display:flex; gap:11px; font-size:14px; font-weight:700; letter-spacing:.2px; }
  .brand i { align-items:center; background:var(--lime); border-radius:10px; color:#24301e; display:flex; font-style:normal; font-weight:900; height:38px; justify-content:center; width:38px; }
  .brand small { color:#b9c8b3; font-size:12px; font-weight:400; margin-inline-start:auto; }
  .hero h1 { font-size:clamp(28px,5vw,46px); line-height:1.25; margin:38px 0 10px; }
  .hero p { color:#c9d5c5; font-size:15px; margin:0; max-width:680px; }
  .hero-stat { align-items:center; background:rgba(255,255,255,.09); border:1px solid rgba(255,255,255,.18); border-radius:14px; display:inline-flex; gap:18px; margin-top:26px; padding:12px 18px; }
  .hero-stat b { color:var(--lime); font-size:22px; }
  .hero-stat small { color:#c9d5c5; display:block; font-size:11px; }
  main { margin-top:-46px; position:relative; }
  .panel { background:#fff; border:1px solid var(--line); border-radius:18px; box-shadow:0 18px 50px rgba(20,30,20,.08); padding:24px; }
  h2 { font-size:20px; margin:0 0 4px; }
  .sub { color:var(--muted); font-size:13px; margin:0 0 18px; }
  .grid { display:grid; gap:14px; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); }
  .card { background:#fbfcf8; border:1px solid var(--line); border-radius:14px; display:flex; flex-direction:column; padding:18px; }
  .card--latest { border-color:#a8cd63; box-shadow:inset 0 0 0 1px #a8cd63; }
  .card__top { align-items:center; display:flex; gap:9px; justify-content:space-between; }
  .version { font-size:24px; font-weight:900; }
  .pill { background:#eaf7d0; border-radius:999px; color:#3d5922; font-size:11px; font-weight:700; padding:4px 10px; }
  .note { color:#4c584b; font-size:13px; margin:10px 0 14px; min-height:46px; }
  dl { display:grid; gap:8px; margin:0 0 12px; }
  dl > div { display:flex; font-size:12px; justify-content:space-between; }
  dt { color:var(--muted); }
  dd { font-weight:700; margin:0; }
  .hash { background:#f1f3ed; border-radius:7px; color:#6c7a68; display:block; font-size:11px; margin-bottom:14px; overflow:hidden; padding:6px 9px; text-overflow:ellipsis; white-space:nowrap; }
  .download { align-items:center; background:var(--green); border-radius:9px; color:#fff; display:flex; font-size:13px; font-weight:700; gap:8px; justify-content:center; min-height:44px; margin-top:auto; }
  .download:hover { background:#3a4d2c; }
  .download span { font-size:18px; }
  section.rules { margin-top:26px; }
  table { border-collapse:collapse; font-size:13px; width:100%; }
  th, td { border-bottom:1px solid var(--line); padding:10px 8px; text-align:right; }
  th { color:var(--muted); font-size:12px; font-weight:600; }
  td code, pre code { background:#f1f3ed; border-radius:6px; color:#3f5924; font-family:ui-monospace,monospace; padding:3px 7px; }
  pre { background:#1d261c; border-radius:12px; color:#e5eddf; direction:ltr; font-size:13px; line-height:1.9; overflow-x:auto; padding:16px 18px; text-align:left; }
  pre code { background:none; color:inherit; padding:0; }
  .steps { color:#485447; font-size:13.5px; margin:12px 0 0; padding-inline-start:20px; }
  .steps li { margin-bottom:6px; }
  footer { color:var(--muted); font-size:12px; margin-top:28px; text-align:center; }
  @media (max-width:600px) { .hero-stat { flex-wrap:wrap; } .wrap { padding-inline:14px; } }
</style>
</head>
<body>
<header class="hero">
  <div class="wrap">
    <div class="brand"><i>K</i> کوجیما <small>بایگانی نسخهها · لایو سرور</small></div>
    <h1>دانلود نسخه ZIP کل پروژه</h1>
    <p>هر بار که تغییری در پروژه داده شود، یک فایل تازه با شماره نسخه جدید ساخته میشود؛ در نتیجه نام فایلها همیشه تغییر میکند: v1، سپس v1.1، سپس v2.</p>
    <div class="hero-stat">
      <div><b>${escapeHtml(latest?.version || "—")}</b><small>آخرین نسخه</small></div>
      <div><b>${faNumber(releases.length)}</b><small>نسخه قابل دانلود</small></div>
      <div><b>${latest ? formatSize(latest.size || 0) : "—"}</b><small>حجم آخرین فایل</small></div>
    </div>
  </div>
</header>
<main class="wrap">
  <div class="panel">
    <h2>نسخههای قابل دانلود</h2>
    <p class="sub">فایلها شامل کل پروژه (کد، مستندات، اسکریپتها و تنظیمات) هستند و وابستگیها، پوشه git و پایگاهداده محلی از آنها حذف شدهاند.</p>
    <div class="grid">${cards || '<p class="sub">هنوز نسخهای ساخته نشده است. دستور <code>npm run release</code> را اجرا کنید.</p>'}</div>

    <section class="rules">
      <h2>قانون نامگذاری فایلها</h2>
      <p class="sub">بعد از هر تغییر، نسخه بالا میرود و نام فایل عوض میشود.</p>
      <table>
        <thead><tr><th>نسخه</th><th>نام فایل</th><th>چه زمانی</th></tr></thead>
        <tbody>
          <tr><td><code>v1</code></td><td dir="ltr">KooGYMaa-v1.zip</td><td>نسخه نخست</td></tr>
          <tr><td><code>v1.1</code></td><td dir="ltr">KooGYMaa-v1.1.zip</td><td>یک تغییر کوچک بعدی (اصلاح رابط، متن، استایل)</td></tr>
          <tr><td><code>v1.2</code></td><td dir="ltr">KooGYMaa-v1.2.zip</td><td>تغییر کوچک بعد از آن</td></tr>
          <tr><td><code>v2</code></td><td dir="ltr">KooGYMaa-v2.zip</td><td>قابلیت بزرگ یا بازطراحی اساسی</td></tr>
        </tbody>
      </table>
      <h2 style="margin-top:26px">ساخت نسخه بعدی</h2>
      <pre dir="ltr"><code>npm run release          # v1 → v1.1
npm run release:minor    # همان کار، تغییر کوچک
npm run release:major    # v1.1 → v2
npm run releases:serve   # اجرای همین لایو سرور</code></pre>
      <ol class="steps">
        <li>تغییرات را در پروژه اعمال کنید.</li>
        <li><code>npm run release:minor</code> (یا <code>release:major</code>) را اجرا کنید؛ فایل ZIP تازه با نام جدید ساخته میشود.</li>
        <li>مانیفست <code>releases/VERSIONS.json</code> و <code>CHANGELOG.md</code> بهصورت خودکار بهروز میشوند و نسخه جدید بلافاصله در همین صفحه ظاهر میشود.</li>
      </ol>
    </section>
  </div>
  <footer>کوجیما · فارسی بهعنوان زبان پیشفرض · <a href="/api/versions">مشاهده مانیفست JSON</a></footer>
</main>
</body>
</html>`;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", ...headers });
  res.end(body);
}

function serveZip(res, filename) {
  const safe = path.basename(filename);
  if (!/^[\w.-]+\.zip$/.test(safe)) return send(res, 400, "<h1>درخواست نامعتبر</h1>");
  const filePath = path.join(RELEASES, safe);
  if (!filePath.startsWith(RELEASES + path.sep) || !fs.existsSync(filePath)) {
    return send(res, 404, "<h1>فایل پیدا نشد</h1>");
  }
  const stat = fs.statSync(filePath);
  res.writeHead(200, {
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="${safe}"`,
    "Content-Length": stat.size,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url || "/", "http://localhost").pathname);
  } catch {
    return send(response, 400, "<h1>درخواست نامعتبر</h1>");
  }

  if (pathname === "/" || pathname === "/index.html") {
    return send(response, 200, renderPage(readManifest()));
  }
  if (pathname === "/api/versions") {
    return send(response, 200, JSON.stringify(readManifest(), null, 2), {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    });
  }
  if (pathname === "/health") {
    return send(response, 200, "ok", { "Content-Type": "text/plain; charset=utf-8" });
  }
  if (pathname.startsWith("/download/")) {
    return serveZip(response, pathname.slice("/download/".length));
  }
  if (pathname.endsWith(".zip")) {
    return serveZip(response, pathname.slice(1));
  }
  return send(response, 404, '<h1>۴۰۴ — صفحهای پیدا نشد</h1><p><a href="/">بازگشت به بایگانی</a></p>');
});

server.listen(PORT, HOST, () => {
  console.log(`✔ لایو سرور نسخهها: http://${HOST}:${PORT}`);
  console.log("  مانیفست:", MANIFEST);
});

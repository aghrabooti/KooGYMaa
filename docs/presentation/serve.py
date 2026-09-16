#!/usr/bin/env python3
"""Tiny download server for the presentation deliverables.

    python3 docs/presentation/serve.py [--port 8000]

Serves a small landing page with download links for the deck and its
source files. Binds to 0.0.0.0 so it works from outside the sandbox.
"""
import argparse
import html
import io
import mimetypes
import os
import socketserver
import zipfile
from http.server import BaseHTTPRequestHandler

HERE = os.path.dirname(os.path.abspath(__file__))

mimetypes.add_type(
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".pptx",
)

# label -> (relative path, description)
FILES = {
    "KooGYMaa.pptx": ("KooGYMaa.pptx", "The 18-slide English deck, with speaker notes"),
    "talk-track-fa.pdf": (
        "talk-track-fa.pdf",
        "متن شفاهی — ۵ دقیقه بک‌اند و ۵ دقیقه فرانت‌اند، به‌همراه سؤال‌های محتمل داور",
    ),
    "talk-track-fa.md": ("talk-track-fa.md", "Same talk track, Markdown source"),
    "README.md": ("README.md", "Slide outline, timings, and rebuild instructions"),
    "build_deck.py": ("build_deck.py", "Deck generator"),
    "shots-en.mjs": ("shots-en.mjs", "English screenshot capture script"),
    "demo-data.mjs": ("demo-data.mjs", "Idempotent local demo data"),
}

# Rendered as large highlighted cards rather than plain rows.
FEATURED = ("KooGYMaa.pptx", "talk-track-fa.pdf")

PAGE = """<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>KooGYMaa — presentation download</title>
<style>
  :root {{ color-scheme: dark; }}
  * {{ box-sizing: border-box; }}
  body {{
    margin: 0; min-height: 100vh; padding: 48px 24px;
    background: radial-gradient(900px 600px at 12% 88%, #1b2a12 0%, #0c100e 60%), #0c100e;
    color: #f5f7f4;
    font: 16px/1.55 "Segoe UI", system-ui, -apple-system, sans-serif;
    display: flex; justify-content: center;
  }}
  .wrap {{ width: 100%; max-width: 680px; }}
  .kicker {{
    color: #a8e063; font-size: 12px; font-weight: 700;
    letter-spacing: .14em; text-transform: uppercase; margin-bottom: 14px;
  }}
  h1 {{ margin: 0 0 6px; font-size: 40px; letter-spacing: -.02em; }}
  .sub {{ color: #9aa59d; margin: 0 0 8px; font-size: 17px; }}
  .rule {{ width: 58px; height: 4px; background: #a8e063; border-radius: 2px; margin: 26px 0 30px; }}
  .primary {{
    display: flex; align-items: center; gap: 18px; text-decoration: none;
    background: #a8e063; color: #0c100e; border-radius: 14px;
    padding: 22px 26px; margin-bottom: 14px; transition: transform .12s ease, filter .12s ease;
  }}
  .primary:hover {{ transform: translateY(-2px); filter: brightness(1.05); }}
  .primary .t {{ font-size: 21px; font-weight: 700; }}
  .primary .d {{ font-size: 13.5px; opacity: .78; }}
  .primary .sz {{ margin-left: auto; font-size: 13px; font-weight: 700; opacity: .7; white-space: nowrap; }}
  .primary.alt {{
    background: #172018; color: #f5f7f4; border: 1px solid #4d6b2e;
  }}
  .primary.alt .t {{ color: #a8e063; }}
  .primary.alt .d {{ opacity: .72; }}
  .primary.alt .sz {{ opacity: .55; }}
  .rtl {{ direction: rtl; text-align: right; font-size: 13.5px; }}
  .row {{
    display: flex; align-items: center; gap: 16px; text-decoration: none;
    color: inherit; border: 1px solid #27302a; background: #141a17;
    border-radius: 11px; padding: 15px 20px; margin-bottom: 9px;
    transition: border-color .12s ease, background .12s ease;
  }}
  .row:hover {{ border-color: #4d6b2e; background: #172018; }}
  .row .t {{ font-weight: 600; font-size: 15px; }}
  .row .d {{ color: #9aa59d; font-size: 12.5px; }}
  .row .sz {{ margin-left: auto; color: #66716a; font-size: 12px; white-space: nowrap; }}
  .note {{ color: #66716a; font-size: 12.5px; margin-top: 30px; line-height: 1.7; }}
  .note code {{ color: #9aa59d; }}
</style></head>
<body><div class="wrap">
  <div class="kicker">B.Sc. thesis defence · 15 minutes</div>
  <h1>KooGYMaa</h1>
  <p class="sub">An Integrated Platform for Gyms, Trainers and Athletes</p>
  <div class="rule"></div>
  {links}
  <p class="note">
    The deck is 18 slides, English, headline-only. Every slide carries a speaker
    note with a running clock, so you can rehearse against the timer in
    presenter view. Fill in your name and supervisor on slide&nbsp;1.<br>
    Stop this server with <code>Ctrl&nbsp;+&nbsp;C</code>.
  </p>
</div></body></html>
"""


def human(n):
    for unit in ("B", "KB", "MB"):
        if n < 1024 or unit == "MB":
            return f"{n:.0f} {unit}" if unit == "B" else f"{n/1:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} MB"


def size_of(path):
    b = os.path.getsize(path)
    if b < 1024:
        return f"{b} B"
    if b < 1024 * 1024:
        return f"{b/1024:.0f} KB"
    return f"{b/1024/1024:.1f} MB"


class Handler(BaseHTTPRequestHandler):
    server_version = "KooGYMaaDownload/1.0"

    def log_message(self, fmt, *args):
        print(f"  {self.address_string()} — {fmt % args}")

    def _send(self, code, body, ctype, extra=None):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = self.path.split("?")[0].lstrip("/")

        if path in ("", "index.html"):
            return self._send(200, self.index().encode(), "text/html; charset=utf-8")

        if path == "all.zip":
            return self.send_zip()

        if path in FILES:
            rel, _ = FILES[path]
            full = os.path.join(HERE, rel)
            if os.path.isfile(full):
                ctype = mimetypes.guess_type(full)[0] or "application/octet-stream"
                # Persian text turns into mojibake without an explicit charset.
                if ctype.startswith("text/") or ctype == "application/json":
                    ctype += "; charset=utf-8"
                with open(full, "rb") as fh:
                    data = fh.read()
                return self._send(200, data, ctype, {
                    "Content-Disposition": f'attachment; filename="{os.path.basename(rel)}"'
                })

        self._send(404, b"Not found", "text/plain; charset=utf-8")

    def send_zip(self):
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
            for name, (rel, _) in FILES.items():
                full = os.path.join(HERE, rel)
                if os.path.isfile(full):
                    z.write(full, os.path.basename(rel))
        data = buf.getvalue()
        self._send(200, data, "application/zip", {
            "Content-Disposition": 'attachment; filename="KooGYMaa-presentation.zip"'
        })

    def index(self):
        rows = []

        deck = os.path.join(HERE, "KooGYMaa.pptx")
        if os.path.isfile(deck):
            rows.append(
                '<a class="primary" href="/KooGYMaa.pptx" download>'
                '<div><div class="t">Download KooGYMaa.pptx</div>'
                '<div class="d">18 slides · English · speaker notes with timings</div></div>'
                f'<div class="sz">{size_of(deck)}</div></a>'
            )

        track = os.path.join(HERE, "talk-track-fa.pdf")
        if os.path.isfile(track):
            rows.append(
                '<a class="primary alt" href="/talk-track-fa.pdf" download>'
                '<div><div class="t">talk-track-fa.pdf</div>'
                '<div class="d rtl">متن شفاهی — ۵ دقیقه بک‌اند و ۵ دقیقه فرانت‌اند</div></div>'
                f'<div class="sz">{size_of(track)}</div></a>'
            )

        for name, (rel, desc) in FILES.items():
            if name in FEATURED:
                continue
            full = os.path.join(HERE, rel)
            if not os.path.isfile(full):
                continue
            rows.append(
                f'<a class="row" href="/{html.escape(name)}" download>'
                f'<div><div class="t">{html.escape(name)}</div>'
                f'<div class="d">{html.escape(desc)}</div></div>'
                f'<div class="sz">{size_of(full)}</div></a>'
            )
        rows.append(
            '<a class="row" href="/all.zip" download>'
            '<div><div class="t">all.zip</div>'
            '<div class="d">Everything above in one archive</div></div>'
            '<div class="sz">zip</div></a>'
        )
        return PAGE.format(links="\n  ".join(rows))


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=int(os.environ.get("PORT", 8000)))
    ap.add_argument("--host", default="0.0.0.0")
    args = ap.parse_args()

    with Server((args.host, args.port), Handler) as httpd:
        print(f"Serving {HERE}")
        print(f"  → http://{args.host}:{args.port}/   (Ctrl+C to stop)")
        httpd.serve_forever()


if __name__ == "__main__":
    main()

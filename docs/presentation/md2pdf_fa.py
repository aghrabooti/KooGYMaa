#!/usr/bin/env python3
"""Render the Persian talk track (Markdown) to a right-to-left PDF.

    python3 docs/presentation/md2pdf_fa.py [input.md] [output.pdf]

Why this exists instead of `pandoc`/`weasyprint`: neither is available here,
and generic Markdown-to-PDF tools tend to mangle Persian anyway. Correct
output needs three things that must happen in the right order:

  1. line breaking on the *logical* string (before reordering),
  2. Arabic/Persian glyph shaping (letters join and change form),
  3. the bidirectional algorithm, applied per visual line.

Inline styling is preserved by shaping each styled run as its own bidi
paragraph and then reversing the run order, which is what an RTL base
direction implies. Marking spans inline with sentinel characters does not
work: private-use codepoints carry Bidi class L and shatter the Arabic run,
while bidi-transparent ones are dropped by the algorithm.
"""
from __future__ import annotations

import os
import re
import sys

import arabic_reshaper
from bidi.algorithm import get_display
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))

# ── palette (matches the deck) ────────────────────────────────────────────
INK = HexColor("#171b17")
MUTED = HexColor("#697168")
ACCENT = HexColor("#4d7a16")
RULE = HexColor("#dedfd7")
CODE_BG = HexColor("#f2f4ef")
CODE_INK = HexColor("#2f3a2a")
QUOTE_BG = HexColor("#f7f9f4")

PAGE_W, PAGE_H = A4
M_TOP, M_BOT = 58, 52
M_L, M_R = 56, 56
CONTENT_W = PAGE_W - M_L - M_R

REG, BOLD, MONO = "Vazirmatn", "Vazirmatn-Bold", "Courier"

def register_fonts(reg_path: str, bold_path: str) -> None:
    pdfmetrics.registerFont(TTFont(REG, reg_path))
    pdfmetrics.registerFont(TTFont(BOLD, bold_path))


# ── inline parsing ────────────────────────────────────────────────────────
TOKEN = re.compile(r"\*\*(.+?)\*\*|`([^`]+)`")


def parse_inline(text: str):
    """Split a line into [(text, style)] where style is plain|bold|code."""
    out, pos = [], 0
    for m in TOKEN.finditer(text):
        if m.start() > pos:
            out.append((text[pos:m.start()], "plain"))
        if m.group(1) is not None:
            out.append((m.group(1), "bold"))
        else:
            out.append((m.group(2), "code"))
        pos = m.end()
    if pos < len(text):
        out.append((text[pos:], "plain"))
    return [(t, s) for t, s in out if t]


def font_for(style: str) -> str:
    return {"bold": BOLD, "code": MONO}.get(style, REG)


# Vazirmatn has no U+2192. Substituting a drawn arrow keeps the PDF free of a
# second font just for two characters. ASCII "->" would be reordered by the
# bidi pass into "<-", which is worse than a missing glyph.
ARROW = "\u2192"
# Deliberately outside the sentinel block (PUA..PUA+0xFF) so strip_pua()
# leaves it alone; it is consumed later, at draw time.
ARROW_SUB = "\uE500"


def shape(s: str) -> str:
    """Glyph-shape + reorder a single visual line (RTL base)."""
    return _shape_run(s, "R")


def measure(runs, size) -> float:
    """Width of shaped runs, measured per run in its own font.

    Arrow placeholders have no glyph, so their painted width is added
    explicitly — otherwise wrapping would under-measure the line.
    """
    total = 0.0
    for text, style in runs:
        arrows = text.count(ARROW_SUB)
        if arrows:
            total += arrows * size * 0.78
            text = text.replace(ARROW_SUB, "")
        total += pdfmetrics.stringWidth(text, font_for(style), size)
    return total


# ── line breaking, done on the logical string ─────────────────────────────
def wrap_runs(runs, size, max_w):
    """Greedy word wrap over styled runs, still in logical order."""
    lines, cur = [], []

    def width(rs):
        return measure([(shape(t), s) for t, s in rs], size)

    for text, style in runs:
        # keep separators so spacing is preserved when re-joining
        for word in re.split(r"(\s+)", text):
            if not word:
                continue
            if word.isspace():
                if cur:
                    cur.append((word, style))
                continue
            trial = cur + [(word, style)]
            if cur and width(trial) > max_w:
                while cur and cur[-1][0].isspace():
                    cur.pop()
                lines.append(cur)
                cur = [(word, style)]
            else:
                cur = trial
    while cur and cur[-1][0].isspace():
        cur.pop()
    if cur:
        lines.append(cur)
    return lines


def reorder_line(runs):
    """Reshape+bidi a logical line, returning styled runs in visual order.

    Each styled run is treated as its own bidi paragraph and the run *order*
    is then reversed, because the base direction of the document is RTL.

    An earlier version marked styled spans with private-use sentinels and
    reordered the whole line at once. That is subtly wrong: PUA codepoints
    carry Bidi class L, so every sentinel split the surrounding Arabic into
    separate runs and the line came out word-reversed. Characters that are
    bidi-transparent (U+2060 and friends) get dropped by the algorithm, so
    they cannot carry the markers either.

    Latin/code runs are resolved with an explicit LTR base so that trailing
    neutrals stay attached the way a reader expects — `lib/` must not render
    as `/lib`.
    """
    merged: list[list] = []
    for text, style in runs:
        if merged and merged[-1][1] == style:
            merged[-1][0] += text
        else:
            merged.append([text, style])

    out = []
    for text, style in merged:
        base = "L" if style == "code" or _is_latin(text) else "R"
        out.append((_shape_run(text, base), style))

    # single run: already correct; multiple: reverse into RTL visual order
    return out if len(out) == 1 else list(reversed(out))


def _is_latin(text: str) -> bool:
    """True when a run is Latin script — it must resolve with an LTR base.

    Digits and punctuation alone do not qualify: a run like "۳. " is neutral
    and belongs to the surrounding Persian paragraph, so it has to keep the
    document's RTL base.
    """
    if any("\u0600" <= ch <= "\u06FF" for ch in text):
        return False
    return any(ch.isascii() and ch.isalpha() for ch in text)


def _shape_run(text: str, base: str) -> str:
    """Reshape + reorder one run.

    The arrow is swapped for its placeholder *after* the bidi pass: U+2192 is
    an Other Neutral and resolves to the correct side on its own, whereas the
    private-use placeholder carries class L and would drag itself out of the
    Persian run.
    """
    out = get_display(arabic_reshaper.reshape(text), base_dir=base)
    return out.replace(ARROW, ARROW_SUB)


# ── document model ────────────────────────────────────────────────────────
def parse_markdown(md: str):
    blocks, lines, i = [], md.splitlines(), 0
    while i < len(lines):
        raw = lines[i]
        line = raw.rstrip()

        if not line.strip():
            i += 1
            continue

        if line.startswith("```"):
            body, i = [], i + 1
            while i < len(lines) and not lines[i].startswith("```"):
                body.append(lines[i])
                i += 1
            blocks.append(("code", body))
            i += 1
            continue

        if re.match(r"^(-{3,}|\*{3,})$", line.strip()):
            blocks.append(("hr", None))
            i += 1
            continue

        m = re.match(r"^(#{1,6})\s+(.*)$", line)
        if m:
            blocks.append((f"h{len(m.group(1))}", m.group(2).strip()))
            i += 1
            continue

        if line.lstrip().startswith(">"):
            body = []
            while i < len(lines) and lines[i].lstrip().startswith(">"):
                body.append(lines[i].lstrip()[1:].strip())
                i += 1
            blocks.append(("quote", " ".join(body)))
            continue

        m = re.match(r"^(\s*)([-*])\s+(.*)$", raw)
        if m:
            indent = len(m.group(1)) // 2
            text = m.group(3).strip()
            i += 1
            # continuation lines of the same bullet
            while i < len(lines) and lines[i].strip() and not re.match(
                r"^\s*([-*]|\d+\.)\s+|^#{1,6}\s|^```|^>", lines[i]
            ) and lines[i].startswith(" "):
                text += " " + lines[i].strip()
                i += 1
            blocks.append(("li", (indent, None, text)))
            continue

        m = re.match(r"^(\s*)(\d+)[.)]\s+(.*)$", raw)
        if m:
            indent = len(m.group(1)) // 2
            text = m.group(3).strip()
            num = m.group(2)
            i += 1
            while i < len(lines) and lines[i].strip() and not re.match(
                r"^\s*([-*]|\d+\.)\s+|^#{1,6}\s|^```|^>", lines[i]
            ) and lines[i].startswith(" "):
                text += " " + lines[i].strip()
                i += 1
            blocks.append(("li", (indent, num, text)))
            continue

        para = [line.strip()]
        i += 1
        while i < len(lines) and lines[i].strip() and not re.match(
            r"^\s*([-*]|\d+\.)\s+|^#{1,6}\s|^```|^>|^(-{3,})$", lines[i]
        ):
            para.append(lines[i].strip())
            i += 1
        blocks.append(("p", " ".join(para)))
    return blocks


# ── rendering ─────────────────────────────────────────────────────────────
STYLES = {
    "h1": (20, 1.35, 16, 10, BOLD, INK),
    "h2": (15.5, 1.35, 18, 8, BOLD, ACCENT),
    "h3": (12.5, 1.35, 13, 5, BOLD, INK),
    "h4": (11.5, 1.35, 10, 4, BOLD, INK),
    "p": (10.5, 1.75, 0, 7, REG, INK),
    "li": (10.5, 1.70, 0, 5, REG, INK),
    "quote": (10, 1.7, 4, 8, REG, MUTED),
    "code": (8.8, 1.45, 4, 9, MONO, CODE_INK),
}


class Renderer:
    def __init__(self, c, title):
        self.c = c
        self.y = M_TOP
        self.page = 1
        self.title = title
        self._page_header()

    # y grows downward; convert when drawing
    def _ty(self, y=None):
        return PAGE_H - (self.y if y is None else y)

    def _page_header(self):
        c = self.c
        c.setFont(REG, 8)
        c.setFillColor(MUTED)
        c.drawRightString(PAGE_W - M_R, PAGE_H - 34, shape(self.title))
        c.setStrokeColor(RULE)
        c.setLineWidth(0.6)
        c.line(M_L, PAGE_H - 42, PAGE_W - M_R, PAGE_H - 42)

    def _page_footer(self):
        c = self.c
        c.setFont(REG, 8)
        c.setFillColor(MUTED)
        c.drawCentredString(PAGE_W / 2, 28, shape(str(self.page)))

    def need(self, h):
        if self.y + h > PAGE_H - M_BOT:
            self.new_page()

    def new_page(self):
        self._page_footer()
        self.c.showPage()
        self.page += 1
        self.y = M_TOP
        self._page_header()

    def _draw_arrow(self, x, baseline, size, color):
        """Paint a left-pointing arrow (RTL reading order) as vector art."""
        c = self.c
        w = size * 0.78
        y = baseline + size * 0.30
        c.saveState()
        c.setStrokeColor(color)
        c.setFillColor(color)
        c.setLineWidth(max(0.6, size * 0.055))
        c.setLineCap(1)
        c.line(x + w * 0.12, y, x + w * 0.92, y)
        head = size * 0.20
        p = c.beginPath()
        p.moveTo(x, y)
        p.lineTo(x + head, y + head * 0.55)
        p.lineTo(x + head, y - head * 0.55)
        p.close()
        c.drawPath(p, stroke=0, fill=1)
        c.restoreState()
        return w

    def draw_line(self, pieces, size, right_edge, leading):
        """Draw visual-order runs, right-aligned so the line ends at `right_edge`.

        `pieces` are already in visual order (leftmost first), so drawing walks
        left to right from a computed start x rather than backwards from the
        right margin.
        """
        c = self.c

        # flatten: arrows become their own pieces, painted rather than typeset
        flat = []
        for text, style in pieces:
            for part in re.split(f"({ARROW_SUB})", text):
                if part:
                    flat.append((part, style))

        total = measure(
            [(t if t != ARROW_SUB else ARROW_SUB, s) for t, s in flat], size
        )
        x = right_edge - total

        for part, style in flat:
            if part == ARROW_SUB:
                x += self._draw_arrow(x, self._ty(), size, c._fillColorObj)
                continue
            w = pdfmetrics.stringWidth(part, font_for(style), size)
            if style == "code":
                fill = c._fillColorObj
                c.setFillColor(CODE_BG)
                c.rect(x - 1.5, self._ty() - size * 0.26, w + 3,
                       size * 1.16, stroke=0, fill=1)
                c.setFillColor(CODE_INK)
                c.setFont(MONO, size)
                c.drawString(x, self._ty(), part)
                c.setFillColor(fill)
            else:
                c.setFont(font_for(style), size)
                c.drawString(x, self._ty(), part)
            x += w
        self.y += leading

    def block(self, kind, payload):
        c = self.c

        if kind == "hr":
            self.need(18)
            self.y += 6
            c.setStrokeColor(RULE)
            c.setLineWidth(0.8)
            c.line(M_L, self._ty(), PAGE_W - M_R, self._ty())
            self.y += 12
            return

        if kind == "code":
            size, lead_f, before, after, _, col = STYLES["code"]
            lead = size * lead_f
            body = payload
            h = lead * len(body) + 14
            self.need(h + before)
            self.y += before
            c.setFillColor(CODE_BG)
            c.rect(M_L, self._ty() - lead * len(body) - 2,
                   CONTENT_W, h, stroke=0, fill=1)
            self.y += 8
            c.setFillColor(col)
            for ln in body:
                c.setFont(MONO, size)
                # code stays LTR and left-aligned
                c.drawString(M_L + 10, self._ty(), ln)
                self.y += lead
            self.y += 6 + after
            return

        if kind == "quote":
            size, lead_f, before, after, fnt, col = STYLES["quote"]
            lead = size * lead_f
            runs = parse_inline(payload)
            lines = wrap_runs(runs, size, CONTENT_W - 22)
            h = lead * len(lines) + 12
            self.need(h + before)
            self.y += before
            top = self._ty() + size
            c.setFillColor(QUOTE_BG)
            c.rect(M_L, top - h, CONTENT_W, h, stroke=0, fill=1)
            c.setFillColor(ACCENT)
            c.rect(PAGE_W - M_R - 3, top - h, 3, h, stroke=0, fill=1)
            self.y += 7
            for ln in lines:
                c.setFillColor(col)
                self.draw_line(reorder_line(ln), size, PAGE_W - M_R - 12, lead)
            self.y += 5 + after
            return

        if kind == "li":
            indent, num, text = payload
            size, lead_f, before, after, fnt, col = STYLES["li"]
            lead = size * lead_f
            pad = 14 + indent * 16
            right = PAGE_W - M_R - pad
            runs = parse_inline(text)
            lines = wrap_runs(runs, size, CONTENT_W - pad)
            self.need(lead)
            marker = f"{num}." if num else "•"
            c.setFillColor(ACCENT if not num else MUTED)
            c.setFont(BOLD if not num else REG, size)
            c.drawRightString(PAGE_W - M_R - indent * 16, self._ty(), shape(marker))
            for k, ln in enumerate(lines):
                if k:
                    self.need(lead)
                c.setFillColor(col)
                self.draw_line(reorder_line(ln), size, right, lead)
            self.y += after
            return

        # headings + paragraphs
        size, lead_f, before, after, fnt, col = STYLES[kind]
        lead = size * lead_f
        runs = parse_inline(payload)
        lines = wrap_runs(runs, size, CONTENT_W)
        self.need(lead + before)
        self.y += before
        for ln in lines:
            self.need(lead)
            c.setFillColor(col)
            if kind.startswith("h"):
                # headings render in one weight
                ln = [(t, "bold" if fnt == BOLD else s) for t, s in ln]
            self.draw_line(reorder_line(ln), size, PAGE_W - M_R, lead)
        if kind == "h2":
            self.y += 2
            c.setStrokeColor(ACCENT)
            c.setLineWidth(1.4)
            c.line(PAGE_W - M_R - 46, self._ty(), PAGE_W - M_R, self._ty())
            self.y += 6
        self.y += after

    def finish(self):
        self._page_footer()
        self.c.save()


def build(md_path: str, pdf_path: str) -> None:
    md = open(md_path, encoding="utf-8").read()
    blocks = parse_markdown(md)

    title = next((p for k, p in blocks if k == "h1"), "KooGYMaa")

    c = canvas.Canvas(pdf_path, pagesize=A4)
    c.setTitle(title)
    c.setAuthor("KooGYMaa")
    c.setSubject("Talk track — backend and frontend")

    r = Renderer(c, title)
    for kind, payload in blocks:
        r.block(kind, payload)
    r.finish()


def main() -> None:
    src = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "talk-track-fa.md")
    dst = sys.argv[2] if len(sys.argv) > 2 else os.path.splitext(src)[0] + ".pdf"

    reg = os.environ.get("FA_FONT_REGULAR", "/tmp/fonts/Vazirmatn-Regular.ttf")
    bold = os.environ.get("FA_FONT_BOLD", "/tmp/fonts/Vazirmatn-Bold.ttf")
    for p in (reg, bold):
        if not os.path.isfile(p):
            sys.exit(
                f"missing font: {p}\n"
                "Generate the static instances first:\n"
                "  python3 docs/presentation/make_fa_fonts.py"
            )
    register_fonts(reg, bold)

    build(src, dst)
    print(f"wrote {dst} ({os.path.getsize(dst)/1024:.0f} KB)")


if __name__ == "__main__":
    main()

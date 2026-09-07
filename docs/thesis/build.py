# -*- coding: utf-8 -*-
"""Build the KooGYMaa thesis HTML (Semnan University format), then render with Chromium.
Chapters live in ch1.py … ch4.py + appendix.py as functions returning HTML strings.
Figure/table numbering: 'شکل ۳-۴' = 4th figure of chapter 3 (guide §2-2-ب)."""
import re, json, subprocess, sys, os
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

FA_DIGITS = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")
def fa(n): return str(n).translate(FA_DIGITS)

class Numbering:
    def __init__(self): self.ch = 0; self.fig = 0; self.tab = 0; self.eq = 0; self.figs = []; self.tabs = []
    def chapter(self, n): self.ch = n; self.fig = 0; self.tab = 0; self.eq = 0
    def figure(self, caption):
        self.fig += 1; label = f"شکل {fa(self.ch)}-{fa(self.fig)}"; self.figs.append((label, caption)); return label
    def table(self, caption):
        self.tab += 1; label = f"جدول {fa(self.ch)}-{fa(self.tab)}"; self.tabs.append((label, caption)); return label

N = Numbering()

def fig(src, caption, cls="", shot=False, style=""):
    label = N.figure(caption)
    c = ("shot " if shot else "") + cls
    st = f' style="{style}"' if style else ""
    return f'<figure class="{c.strip()}" id="fig{len(N.figs)-1}" data-fig="{label}"><img src="{src}"{st} alt=""><figcaption><span class="n">{label}</span> {caption}</figcaption></figure>'

def two_up(src1, src2, caption, w="48%"):
    label = N.figure(caption)
    return f'<figure class="shot" id="fig{len(N.figs)-1}"><div class="two-up"><img src="{src1}" style="max-width:{w}" alt=""><img src="{src2}" style="max-width:{w}" alt=""></div><figcaption><span class="n">{label}</span> {caption}</figcaption></figure>'

def mobile_pair(src1, src2, caption):
    label = N.figure(caption)
    return f'<figure class="shot" id="fig{len(N.figs)-1}"><div class="mobile-pair"><img src="{src1}" alt=""><img src="{src2}" alt=""></div><figcaption><span class="n">{label}</span> {caption}</figcaption></figure>'

def table(caption, header, rows, widths=None, cls=""):
    label = N.table(caption)
    ths = ""
    for i, h in enumerate(header):
        w = (' style="width:%s"' % widths[i]) if widths else ""
        ths += "<th" + w + ">" + h + "</th>"
    trs = "".join("<tr>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>" for r in rows)
    keep = " keep" if len(rows) <= 9 else ""
    return f'<div class="tbl-wrap{keep}" id="tab{len(N.tabs)-1}"><table class="{cls}" data-tab="{label}"><caption><span class="n">{label}</span> {caption}</caption><thead><tr>{ths}</tr></thead><tbody>{trs}</tbody></table></div>'

def en(s): return f'<span class="en">{s}</span>'
def code(s): return f'<code>{s}</code>'
def p(s, cls=""): return f'<p class="{cls}">{s}</p>' if cls else f"<p>{s}</p>"
def ul(items): return "<ul>" + "".join(f"<li>{i}</li>" for i in items) + "</ul>"
def ol(items, cls="steps"):
    # explicit Persian numbering (CSS counters are rewritten by paged.js)
    return f'<ol class="{cls}">' + "".join(f'<li><span class="num">{fa(k)}.</span> {i}</li>' for k, i in enumerate(items, 1)) + "</ol>"
def h2(num, title): return f'<h2 id="s{num.replace("-", "_")}" data-toc="2" data-num="{fa(num)}">{fa(num)}- {title}</h2>'
def h3(num, title): return f'<h3 id="s{num.replace("-", "_")}" data-toc="3" data-num="{fa(num)}">{fa(num)}- {title}</h3>'
def h4(title): return f"<h4>{title}</h4>"
def chapter(n, title):
    N.chapter(n)
    names = {1: "اول", 2: "دوم", 3: "سوم", 4: "چهارم", 5: "پنجم"}
    return f'<section class="chapter-start" data-chapter="{n}"><div class="chapter-head" id="ch{n}" data-toc="1" data-title="{title}"><div class="chapter-num">فصل {names[n]}</div><div class="chapter-title">{title}</div></div>'
def end_chapter(): return "</section>"
def fn(n): return f'<sup class="fn">{fa(n)}</sup>'   # legacy marker (replaced by inline_footnotes)
def ref(key): return f"[{key}]"

FN_RE = re.compile(r'<sup class="fn">([۰-۹]+)</sup>')
FNBLOCK_RE = re.compile(r'<div class="footnotes"></div>((?:<div class="fnline"><sup>\d+</sup> .*?</div>)+)')
FNLINE_RE = re.compile(r'<div class="fnline"><sup>(\d+)</sup> (.*?)</div>')
def inline_footnotes(html):
    """Chapters were written with <sup class="fn">۱</sup> markers + a trailing block of .fnline definitions.
    Rewrite each marker into an inline <span class="note"> so paged.js floats it to the page footer."""
    pos = 0; out = []
    for m in FNBLOCK_RE.finditer(html):
        seg = html[pos:m.start()]
        defs = {int(n): t for n, t in FNLINE_RE.findall(m.group(1))}
        def repl(mm):
            n = int(mm.group(1).translate(str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789")))
            t = defs.pop(n, None)
            return f'<span class="fnote">{t}</span>' if t is not None else mm.group(0)
        seg = FN_RE.sub(repl, seg)
        # any unmatched definitions: keep as inline notes at the end of the segment
        seg += "".join(f'<span class="fnote">{t}</span>' for t in defs.values())
        out.append(seg); pos = m.end()
    out.append(html[pos:])
    return "".join(out)

def toc_pages(N, html):
    """فهرست مطالب + فهرست شکل‌ها + فهرست جدول‌ها (page numbers resolved after layout via data-target)."""
    rows = ['<div class="page toc-page"><div class="front-title">فهرست مطالب</div><div class="toc">',
            '<div class="hdr"><span>عنوان</span><span>صفحه</span></div>',
            '<div class="row l1"><span class="t">چکیده</span><span class="dots"></span><span class="p" data-target="abstract"></span></div>']
    for m in re.finditer(r'<div class="chapter-head" id="([^"]+)" data-toc="1" data-title="([^"]+)"[^>]*>|<h([23]) id="([^"]+)" data-toc="\d" data-num="([^"]+)">(?:[^<]*?)- ([^<]+)</h[23]>', html):
        if m.group(1):
            rows.append(f'<div class="row l1"><span class="t">{m.group(2)}</span><span class="dots"></span><span class="p" data-target="{m.group(1)}"></span></div>')
        else:
            lvl = "l2" if m.group(3) == "2" else "l3"
            rows.append(f'<div class="row {lvl}"><span class="t">{m.group(5)}- {m.group(6)}</span><span class="dots"></span><span class="p" data-target="{m.group(4)}"></span></div>')
    rows.append('<div class="row l1"><span class="t">چکیدهٔ انگلیسی</span><span class="dots"></span><span class="p" data-target="abstract-en"></span></div>')
    rows.append("</div></div>")
    figs = ['<div class="page toc-page"><div class="front-title">فهرست شکل‌ها</div><div class="toc toc-fig"><div class="hdr"><span>عنوان</span><span>صفحه</span></div>']
    for i, (label, cap) in enumerate(N.figs):
        figs.append(f'<div class="row l2"><span class="t">{label}: {cap}</span><span class="dots"></span><span class="p" data-target="fig{i}"></span></div>')
    figs.append("</div></div>")
    tabs = ['<div class="page toc-page"><div class="front-title">فهرست جدول‌ها</div><div class="toc toc-fig"><div class="hdr"><span>عنوان</span><span>صفحه</span></div>']
    for i, (label, cap) in enumerate(N.tabs):
        tabs.append(f'<div class="row l2"><span class="t">{label}: {cap}</span><span class="dots"></span><span class="p" data-target="tab{i}"></span></div>')
    tabs.append("</div></div>")
    return "\n".join(rows + figs + tabs)

# ---------------------------------------------------------------------------
def build():
    import ch1, ch2, ch3, ch4, front, back   # they do `from build import …` → same module object / same N
    body = []
    body.append(front.cover_and_front(N))          # جلد راست … فهرست‌ها (placeholder for TOC filled later)
    body.append(ch1.render(N))
    body.append(ch2.render(N))
    body.append(ch3.render(N))
    body.append(ch4.render(N))
    body.append(back.appendices(N))
    body.append(back.references(N))
    body.append(back.english_back(N))
    html = "\n".join(body)
    html = html.replace('<div id="toc-placeholder"></div>', toc_pages(N, html))
    html = inline_footnotes(html)
    html = ("<!doctype html><html lang=\"fa\"><head><meta charset=\"utf-8\"><title>پایان‌نامهٔ کوجیما</title><link rel=\"stylesheet\" href=\"style.css\"></head>"
            "<body><div class=\"thesis\" dir=\"rtl\">" + html + "</div></body></html>")
    open(os.path.join(HERE, "thesis.html"), "w", encoding="utf-8").write(html)
    left = len(FN_RE.findall(html)); print("unresolved footnote markers:", left)
    json.dump({"figs": N.figs, "tabs": N.tabs}, open(os.path.join(HERE, "numbering.json"), "w"), ensure_ascii=False)
    print("figures:", len(N.figs), "tables:", len(N.tabs))

if __name__ == "__main__":
    import build as B   # run through the importable module so chapter modules share its Numbering instance
    B.build()

# KooGYMaa — defence presentation

**`KooGYMaa.pptx`** — 18 slides, English, paced for a **15-minute** talk.
Every slide carries a speaker note with a running clock (`[7:20] Member
journey — 1:20`), so you can rehearse against the timer in presenter view.

The slides are deliberately **headline-only**: a title, a short kicker, and a
real screenshot or diagram. The detail lives in the notes, not on the wall.

## Deck outline

| # | Slide | Budget |
| --- | --- | --- |
| 1 | Title | 0:20 |
| 2 | Agenda | 0:20 |
| 3 | The problem | 1:20 |
| 4 | One platform, three roles | 1:10 |
| 5 | Scope of the system | 0:50 |
| 6 | Technology stack | 0:40 |
| 7 | Architecture | 1:00 |
| 8 | Data model | 1:00 |
| 9 | The product (landing) | 0:40 |
| 10 | Member journey | 1:20 |
| 11 | Progress tracking | 1:10 |
| 12 | Trainer workspace | 1:10 |
| 13 | Gym owner workspace | 1:10 |
| 14 | Payments & subscriptions | 0:50 |
| 15 | Security & quality | 0:50 |
| 16 | Built for real users | 0:30 |
| 17 | Results & future work | 0:30 |
| 18 | Thank you | 0:10 |

Fill in your name and supervisor on slide 1 (the blanks are placeholders).

## Downloading the deck

Start the bundled download server and open it in a browser:

```bash
python3 docs/presentation/serve.py            # → http://0.0.0.0:8000/
python3 docs/presentation/serve.py --port 9000
```

It serves a small landing page with a direct link to `KooGYMaa.pptx`
(correct MIME type, so browsers download rather than display it), the
source scripts, and an `all.zip` with everything. Stop it with `Ctrl+C`.

## The talk track

`talk-track-fa.md` is the spoken script: five minutes on the backend, five on
the frontend, plus likely examiner questions. `talk-track-fa.pdf` is the same
content typeset right-to-left:

```bash
python3 docs/presentation/make_fa_fonts.py   # fetch Vazirmatn TTFs -> /tmp/fonts
python3 docs/presentation/md2pdf_fa.py       # -> talk-track-fa.pdf
```

Persian needs glyph shaping and the bidirectional algorithm, which ReportLab
does not do, so `md2pdf_fa.py` reshapes and reorders the text itself. Two
things are worth knowing if you touch it:

* it uses **Vazirmatn**, not the Estedad file in `public/fonts` — Estedad
  maps the Unicode presentation forms to empty glyphs and relies on a real
  shaping engine, so under ReportLab it renders dotless and half-blank;
* styled spans are shaped per run and the run order is reversed, rather than
  marking spans inline. Private-use sentinels carry Bidi class L and shatter
  the Arabic run; bidi-transparent characters get dropped entirely.

## Rebuilding the deck

```bash
pip install python-pptx
python3 docs/presentation/build_deck.py     # → docs/presentation/KooGYMaa.pptx
```

`preview.py` renders a rough PNG of every slide for layout checks (it is a
crude renderer — useful for spotting overflow, not for final fidelity):

```bash
python3 docs/presentation/preview.py        # → /tmp/deck-preview/slide-NN.png
```

## Regenerating the screenshots

The deck uses **English** screenshots of the real running app, captured into
`assets/`.

```bash
# 1. point the app at a local SQLite file (see .env.example) and apply the schema
node scripts/setup-turso.mjs            # or the local variant for a file: URL

# 2. load realistic demo data (12 members, subscriptions, payments,
#    sessions, 9 weeks of workout logs, reviews, audit trail)
node docs/presentation/demo-data.mjs

# 3. run the app
npm run dev -- -p 3107

# 4. capture (needs playwright + @sparticuz/chromium in $THESIS_TOOLS)
THESIS_TOOLS=/tmp/tools node docs/presentation/shots-en.mjs
```

### Why there is a translation step

Only the public pages and the shared navigation go through
`lib/i18n/translations.ts`; the three role dashboards still contain hard-coded
Persian copy. Rather than rewrite the app for the deck, `shots-en.mjs`
translates the rendered DOM at capture time:

- `fa2en-dict.json` — pairs extracted automatically from the project's own
  `en`/`fa` dictionaries;
- `fa2en.json` — a curated supplement for the dashboard strings that are not
  in the dictionary;
- Persian/Arabic numerals become Latin, and Jalali dates are converted to
  Gregorian via `Intl` with the `persian` calendar.

If you later localize the dashboards properly, delete the `page.evaluate`
translation block in `shots-en.mjs` and the two JSON files.

## Files

| File | Purpose |
| --- | --- |
| `KooGYMaa.pptx` | The deliverable |
| `build_deck.py` | Deck generator (layout, palette, speaker notes) |
| `preview.py` | Rough PPTX → PNG renderer for layout checks |
| `serve.py` | Local download server for the deliverables |
| `talk-track-fa.md` / `.pdf` | Spoken script: 5 min backend + 5 min frontend |
| `md2pdf_fa.py` | Right-to-left Markdown → PDF renderer |
| `make_fa_fonts.py` | Fetches the Persian TTFs used by the PDF renderer |
| `shots-en.mjs` | Captures English screenshots from the running app |
| `demo-data.mjs` | Idempotent demo data for populated dashboards |
| `fa2en.json`, `fa2en-dict.json` | Capture-time translation tables |
| `assets/` | Images used by the deck used by the deck |

`demo-data.mjs` refuses to run against a hosted `libsql://` database — it is
local-only by design.

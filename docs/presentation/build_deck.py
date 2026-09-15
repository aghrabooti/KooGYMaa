# -*- coding: utf-8 -*-
"""Build the KooGYMaa English defense deck (15-minute talk, ~16 slides).

Usage:  python3 docs/presentation/build_deck.py
Output: docs/presentation/KooGYMaa.pptx
"""
import os
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "assets")
OUT = os.path.join(HERE, "KooGYMaa.pptx")

# ---------------------------------------------------------------- palette
BG        = RGBColor(0x0C, 0x10, 0x0E)   # near-black green
BG_SOFT   = RGBColor(0x14, 0x1A, 0x17)   # card
LIME      = RGBColor(0xA8, 0xE0, 0x63)   # brand accent
LIME_DK   = RGBColor(0x6F, 0xA8, 0x36)
WHITE     = RGBColor(0xF5, 0xF7, 0xF4)
MUTED     = RGBColor(0x9A, 0xA5, 0x9D)
LINE      = RGBColor(0x27, 0x30, 0x2A)

FONT      = "Segoe UI"
FONT_B    = "Segoe UI Semibold"

W, H = Inches(13.333), Inches(7.5)


# ---------------------------------------------------------------- helpers
def new_deck():
    prs = Presentation()
    prs.slide_width, prs.slide_height = W, H
    return prs


def blank(prs):
    return prs.slides.add_slide(prs.slide_layouts[6])


def rect(slide, x, y, w, h, fill=None, line=None, lw=1.0, shape=MSO_SHAPE.RECTANGLE,
         adj=None):
    s = slide.shapes.add_shape(shape, x, y, w, h)
    if fill is None:
        s.fill.background()
    else:
        s.fill.solid()
        s.fill.fore_color.rgb = fill
    if line is None:
        s.line.fill.background()
    else:
        s.line.color.rgb = line
        s.line.width = Pt(lw)
    s.shadow.inherit = False
    if adj is not None:
        try:
            s.adjustments[0] = adj
        except Exception:
            pass
    s.text_frame.word_wrap = True
    return s


def set_alpha(shape, pct):
    """Apply transparency (0-100 = opacity percent) to a solid-filled shape."""
    from lxml import etree
    clr = shape.fill.fore_color._xFill.find(qn('a:srgbClr'))
    a = etree.SubElement(clr, qn('a:alpha'))
    a.set('val', str(int(pct * 1000)))
    return shape


def bg(slide, image=None):
    if image and os.path.exists(image):
        slide.shapes.add_picture(image, 0, 0, width=W, height=H)
    else:
        rect(slide, 0, 0, W, H, fill=BG)


def txt(slide, x, y, w, h, text, size=18, color=WHITE, bold=False, font=FONT,
        align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, spacing=1.0, space_after=0):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = anchor
    lines = text.split("\n")
    for i, ln in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.line_spacing = spacing
        p.space_after = Pt(space_after)
        r = p.add_run()
        r.text = ln
        r.font.size = Pt(size)
        r.font.bold = bold
        r.font.color.rgb = color
        r.font.name = font
    return tb


def title(slide, text, kicker=None, sub=None):
    """Standard content-slide header."""
    y = Inches(0.62)
    if kicker:
        txt(slide, Inches(0.85), Inches(0.46), Inches(10), Inches(0.3),
            kicker.upper(), size=11, color=LIME, bold=True, font=FONT_B)
        y = Inches(0.86)
    txt(slide, Inches(0.85), y, Inches(11.6), Inches(0.9), text,
        size=34, color=WHITE, bold=True, font=FONT_B)
    rect(slide, Inches(0.85), y + Inches(0.72), Inches(0.62), Pt(3.5), fill=LIME)
    if sub:
        txt(slide, Inches(0.85), y + Inches(0.95), Inches(11.4), Inches(0.5), sub,
            size=15, color=MUTED)
    return y


def footer(slide, n, label="KooGYMaa"):
    txt(slide, Inches(0.85), Inches(6.86), Inches(6), Inches(0.3), label,
        size=10, color=RGBColor(0x5C, 0x66, 0x5E), font=FONT_B)
    txt(slide, Inches(11.6), Inches(6.86), Inches(0.9), Inches(0.3), f"{n:02d}",
        size=10, color=RGBColor(0x5C, 0x66, 0x5E), align=PP_ALIGN.RIGHT, font=FONT_B)


def bullets(slide, x, y, w, items, size=19, gap=Inches(0.72), color=WHITE,
            marker=True, sub_size=13):
    """items: list of str, or (str, str) for headline + small note."""
    for i, it in enumerate(items):
        head, note = (it, None) if isinstance(it, str) else it
        yy = y + i * gap
        if marker:
            rect(slide, x, yy + Inches(0.12), Inches(0.11), Inches(0.11), fill=LIME)
        tx = x + (Inches(0.34) if marker else 0)
        txt(slide, tx, yy, w, Inches(0.4), head, size=size, color=color, bold=True,
            font=FONT_B)
        if note:
            txt(slide, tx, yy + Inches(0.32), w, Inches(0.3), note,
                size=sub_size, color=MUTED)


def card(slide, x, y, w, h, heading, body=None, big=None, accent=False):
    c = rect(slide, x, y, w, h, fill=BG_SOFT, line=LINE, lw=0.75)
    pad = Inches(0.32)
    cy = y + pad
    if big:
        txt(slide, x + pad, cy, w - 2 * pad, Inches(0.7), big, size=40,
            color=LIME if accent else WHITE, bold=True, font=FONT_B)
        cy += Inches(0.78)
    txt(slide, x + pad, cy, w - 2 * pad, Inches(0.4), heading, size=16,
        color=WHITE, bold=True, font=FONT_B)
    if body:
        txt(slide, x + pad, cy + Inches(0.33), w - 2 * pad, h - (cy - y) - Inches(0.4),
            body, size=12.5, color=MUTED, spacing=1.15)
    return c


def chip(slide, x, y, text, size=12, pad=Inches(0.20), h=Inches(0.36),
         fill=BG_SOFT, color=WHITE, line=LINE):
    w = Inches(0.11 * len(text)) + 2 * pad
    s = rect(slide, x, y, w, h, fill=fill, line=line, lw=0.75,
             shape=MSO_SHAPE.ROUNDED_RECTANGLE, adj=0.5)
    tf = s.text_frame
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = text
    r.font.size = Pt(size)
    r.font.color.rgb = color
    r.font.name = FONT_B
    r.font.bold = True
    return x + w + Inches(0.14)


def shot(slide, name, x, y, w=None, h=None, caption=None, caption_y=None):
    """Place a screenshot, framed, fitted into the given box."""
    path = os.path.join(ASSETS, name + ".png")
    iw, ih = Image.open(path).size
    ar = iw / ih
    if w and h:
        if w / h > ar:
            w = Emu(int(h * ar))
        else:
            h = Emu(int(w / ar))
    elif w:
        h = Emu(int(w / ar))
    else:
        w = Emu(int(h * ar))
    b = Inches(0.045)
    rect(slide, x - b, y - b, w + 2 * b, h + 2 * b, fill=LINE)
    slide.shapes.add_picture(path, x, y, width=w, height=h)
    if caption:
        cy = caption_y if caption_y is not None else y + h + Inches(0.16)
        txt(slide, x, cy, w, Inches(0.3), caption, size=11,
            color=MUTED, align=PP_ALIGN.CENTER)
    return w, h


def flow_box(slide, x, y, w, h, label, note=None, accent=False):
    s = rect(slide, x, y, w, h, fill=BG_SOFT if not accent else RGBColor(0x1C, 0x2A, 0x18),
             line=LIME if accent else LINE, lw=1.0,
             shape=MSO_SHAPE.ROUNDED_RECTANGLE, adj=0.12)
    tf = s.text_frame
    tf.margin_left = tf.margin_right = Inches(0.08)
    tf.margin_top = tf.margin_bottom = Inches(0.04)
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = label
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.name = FONT_B
    r.font.color.rgb = LIME if accent else WHITE
    if note:
        p2 = tf.add_paragraph()
        p2.alignment = PP_ALIGN.CENTER
        r2 = p2.add_run()
        r2.text = note
        r2.font.size = Pt(10)
        r2.font.name = FONT
        r2.font.color.rgb = MUTED
    return s


def arrow(slide, x, y, w, vertical=False, length=None):
    if vertical:
        s = rect(slide, x, y, Inches(0.09), length, fill=LIME_DK,
                 shape=MSO_SHAPE.DOWN_ARROW)
    else:
        s = rect(slide, x, y, w, Inches(0.16), fill=LIME_DK,
                 shape=MSO_SHAPE.RIGHT_ARROW)
    return s


# ------------------------------------------------------- speaker notes
# Budget: 15 minutes. Keep slides 9-13 (the demo) the longest.
NOTES = [
 ("0:00", "Title — 20s",
  "Good morning. I'm presenting KooGYMaa, an integrated platform for gyms, "
  "trainers and athletes. It is a full-stack web application built with "
  "Next.js 16, React 19, TypeScript and Prisma."),
 ("0:20", "Agenda — 20s",
  "Fifteen minutes: the problem, the solution, how it is built, a walkthrough "
  "of all three roles, then security, quality and future work."),
 ("0:40", "The problem — 1:20",
  "Gyms run on paper and spreadsheets. Coaches send plans as photos in chat "
  "apps. Athletes have no progress history. And owners have no visibility into "
  "revenue, retention or expiries. Three worlds that never talk to each other."),
 ("2:00", "Solution — 1:10",
  "One platform, three roles. Members train and track. Trainers coach and "
  "assign. Owners operate and monetise. The key point: every action one role "
  "takes is immediately visible to the other two."),
 ("3:10", "Scope — 50s",
  "In numbers: 33 database models, 76 API routes, three role workspaces and 73 "
  "automated tests. Bilingual English/Persian with full RTL, light and dark "
  "themes, responsive to mobile."),
 ("4:00", "Stack — 40s",
  "Next.js App Router with React Server Components on the front, route handlers "
  "and a separate domain layer on the back, Prisma over SQLite locally and "
  "Turso libSQL in the cloud."),
 ("4:40", "Architecture — 1:00",
  "One deployable Next.js application. Requests hit either a server page or an "
  "API route; both pass through the auth layer, which validates the JWT session "
  "cookie and the role. Business rules live in the domain layer, never in the "
  "components. A daily scheduler handles expiries and renewals."),
 ("5:40", "Data model — 1:00",
  "33 models in four groups. The important design decision: relationships carry "
  "the business rules, not boolean flags. A membership is a row with a status "
  "and a lifecycle, not a flag on a user. Money is stored as integers in the "
  "smallest currency unit, and plans become immutable once assigned."),
 ("6:40", "The product — 40s",
  "This is the public side: anyone can browse gyms and trainers before signing "
  "up, in English or Persian, light or dark."),
 ("7:20", "Member journey — 1:20",
  "The member discovers a gym, subscribes and pays, requests a trainer, follows "
  "the assigned plan and logs every session. The dashboard on the left is live "
  "data: streaks, adherence, next session, active services."),
 ("8:40", "Progress — 1:10",
  "This is the part that matters most. Workout logs compare prescribed against "
  "actual load and RPE. Nutrition logs track completion and substitutions. Body "
  "check-ins record weight, body fat and measurements. And the trainer can "
  "attach feedback to one specific log — a two-way thread."),
 ("9:50", "Trainer workspace — 1:10",
  "Trainers build reusable, versioned plans. Publishing locks a version; 'New "
  "version' keeps the family and increments. Scheduling checks for conflicts "
  "and only allows sessions with active students at a shared gym."),
 ("11:00", "Gym owner — 1:10",
  "The owner approves applications, prices subscription plans, and reconciles "
  "payments. These are real KPIs computed from the database: active members, "
  "net revenue after refunds, expiries this week. Sensitive actions are audited."),
 ("12:10", "Payments — 50s",
  "Checkout is idempotent, so the same cart is never charged twice. The provider "
  "calls back through a signed webhook, and only a confirmed payment activates "
  "the subscription. Refunds reconcile access automatically."),
 ("13:00", "Security & quality — 50s",
  "Authorisation is re-checked server-side on every mutation — middleware is "
  "only an optimistic first layer. Sessions are signed, HttpOnly and revocable. "
  "73 tests, strict TypeScript and CI on every push."),
 ("13:50", "Real users — 30s",
  "Bilingual with a mirrored RTL layout, Jalali dates and Persian numerals, and "
  "it works down to a phone."),
 ("14:20", "Results & future — 30s",
  "Delivered: a working end-to-end platform with a real commerce and trust "
  "layer. Next: a production payment gateway, a mobile app with push "
  "reminders, and analytics."),
 ("14:50", "Thank you — 10s",
  "Thank you. I am happy to take questions, and the app is running live if you "
  "would like to see anything specific."),
]


def add_notes(prs):
    for i, slide in enumerate(prs.slides):
        if i >= len(NOTES):
            break
        clock, label, body = NOTES[i]
        slide.notes_slide.notes_text_frame.text = f"[{clock}] {label}\n\n{body}"


# ---------------------------------------------------------------- slides
def build():
    prs = new_deck()
    n = 0

    # 1 — Title ------------------------------------------------------------
    s = blank(prs)
    bg(s, os.path.join(ASSETS, "bg-title.png"))
    set_alpha(rect(s, 0, 0, W, H, fill=BG), 55)
    txt(s, Inches(1.1), Inches(2.05), Inches(8), Inches(0.35),
        "B.Sc. THESIS DEFENCE  ·  SOFTWARE ENGINEERING", size=12, color=LIME,
        bold=True, font=FONT_B)
    txt(s, Inches(1.1), Inches(2.55), Inches(10.6), Inches(2.0),
        "KooGYMaa", size=68, color=WHITE, bold=True, font=FONT_B)
    txt(s, Inches(1.1), Inches(3.68), Inches(11.0), Inches(0.9),
        "An Integrated Platform for Gyms, Trainers and Athletes",
        size=25, color=WHITE, spacing=1.15)
    rect(s, Inches(1.13), Inches(4.62), Inches(0.9), Pt(4), fill=LIME)
    txt(s, Inches(1.1), Inches(4.95), Inches(9.6), Inches(0.9),
        "Next.js 16  ·  React 19  ·  TypeScript  ·  Prisma  ·  SQLite / Turso",
        size=14, color=MUTED)
    txt(s, Inches(1.1), Inches(6.3), Inches(6), Inches(0.6),
        "Author:  ____________________\nSupervisor:  ____________________",
        size=12, color=MUTED, spacing=1.35)
    txt(s, Inches(9.4), Inches(6.3), Inches(2.9), Inches(0.6),
        "Faculty of Electrical & Computer Engineering\nSemnan University",
        size=11, color=MUTED, align=PP_ALIGN.RIGHT, spacing=1.35)

    # 2 — Agenda -----------------------------------------------------------
    n += 1
    s = blank(prs); bg(s)
    title(s, "Agenda", kicker="15 minutes")
    items = [("1.  The problem", "Why gyms still run on paper and chat apps"),
             ("2.  The solution", "One platform, three roles"),
             ("3.  Architecture & data model", "How it is built"),
             ("4.  Live walkthrough", "Member → Trainer → Gym owner"),
             ("5.  Security & quality", "Access control, payments, tests"),
             ("6.  Results & future work", "")]
    for i, (h_, nt) in enumerate(items):
        col = 0 if i < 3 else 1
        row = i % 3
        x = Inches(0.9) + col * Inches(6.0)
        y = Inches(2.35) + row * Inches(1.25)
        rect(s, x, y, Inches(5.5), Inches(0.03), fill=LINE)
        txt(s, x, y + Inches(0.22), Inches(5.4), Inches(0.4), h_, size=21,
            color=WHITE, bold=True, font=FONT_B)
        if nt:
            txt(s, x, y + Inches(0.66), Inches(5.4), Inches(0.35), nt, size=12.5,
                color=MUTED)
    footer(s, n)

    # 3 — Problem ----------------------------------------------------------
    n += 1
    s = blank(prs); bg(s)
    title(s, "The problem", kicker="Context",
          sub="Gym operations, coaching and athlete progress live in three disconnected worlds.")
    data = [("Paper & spreadsheets", "Memberships, renewals and cash tracked by hand"),
            ("Chat apps as a coaching tool", "Plans sent as photos and PDFs, lost in scroll"),
            ("No progress history", "Nothing to compare, nothing to prove"),
            ("Blind business decisions", "No revenue, retention or expiry visibility")]
    for i, (h_, nt) in enumerate(data):
        x = Inches(0.85) + (i % 2) * Inches(5.95)
        y = Inches(2.55) + (i // 2) * Inches(1.75)
        card(s, x, y, Inches(5.5), Inches(1.45), h_, nt)
    footer(s, n)

    # 4 — Solution ---------------------------------------------------------
    n += 1
    s = blank(prs); bg(s)
    title(s, "One platform, three roles", kicker="The solution")
    roles = [("MEMBER", "Train & track",
              "Find a gym, subscribe, follow plans,\nlog workouts, meals and body metrics"),
             ("TRAINER", "Coach & assign",
              "Build reusable workout and diet plans,\nmanage clients, sessions and feedback"),
             ("GYM OWNER", "Operate & sell",
              "Approve members and trainers, sell plans,\ntrack subscriptions, payments, revenue")]
    for i, (tag, head, body) in enumerate(roles):
        x = Inches(0.85) + i * Inches(3.95)
        c = rect(s, x, Inches(2.45), Inches(3.6), Inches(3.3), fill=BG_SOFT,
                 line=LINE, lw=0.75)
        rect(s, x, Inches(2.45), Inches(3.6), Pt(3.5), fill=LIME)
        txt(s, x + Inches(0.35), Inches(2.82), Inches(3), Inches(0.3), tag,
            size=11, color=LIME, bold=True, font=FONT_B)
        txt(s, x + Inches(0.35), Inches(3.22), Inches(3), Inches(0.5), head,
            size=24, color=WHITE, bold=True, font=FONT_B)
        txt(s, x + Inches(0.35), Inches(3.95), Inches(3), Inches(1.4), body,
            size=13, color=MUTED, spacing=1.3)
    txt(s, Inches(0.85), Inches(6.25), Inches(11.5), Inches(0.4),
        "Every action one role takes becomes visible to the other two — in real time.",
        size=14, color=WHITE)
    footer(s, n)

    # 5 — Scope in numbers -------------------------------------------------
    n += 1
    s = blank(prs); bg(s)
    title(s, "Scope of the system", kicker="At a glance")
    nums = [("33", "database models", "16 enums, fully relational"),
            ("76", "API routes", "all validated server-side"),
            ("3", "role workspaces", "admin · trainer · member"),
            ("73", "automated tests", "typecheck + build green")]
    for i, (big, head, body) in enumerate(nums):
        x = Inches(0.85) + i * Inches(2.98)
        card(s, x, Inches(2.6), Inches(2.72), Inches(2.4), head, body, big=big,
             accent=True)
    txt(s, Inches(0.85), Inches(5.45), Inches(11.5), Inches(0.4),
        "Bilingual UI (English / Persian with full RTL), light & dark theme, responsive down to mobile.",
        size=14, color=MUTED)
    footer(s, n)

    # 6 — Tech stack -------------------------------------------------------
    n += 1
    s = blank(prs); bg(s)
    title(s, "Technology stack", kicker="How it is built")
    groups = [("Frontend", ["Next.js 16 App Router", "React 19", "TypeScript", "Tailwind CSS 4"]),
              ("Backend", ["Route Handlers", "Server Components", "Domain layer (lib/)"]),
              ("Data", ["Prisma ORM 7", "SQLite (dev)", "Turso / libSQL (cloud)"]),
              ("Platform", ["JWT + HttpOnly cookies", "Vitest", "GitHub Actions CI"])]
    y = Inches(2.5)
    for gname, chips in groups:
        txt(s, Inches(0.85), y + Inches(0.05), Inches(1.9), Inches(0.4), gname,
            size=15, color=LIME, bold=True, font=FONT_B)
        x = Inches(2.85)
        for c in chips:
            x = chip(s, x, y, c, size=12.5)
        y += Inches(0.95)
    footer(s, n)

    # 7 — Architecture -----------------------------------------------------
    n += 1
    s = blank(prs); bg(s)
    title(s, "Architecture", kicker="System design",
          sub="A single Next.js application: rendering, API and domain logic in one deployable unit.")
    lay = [("Browser  ·  React 19 UI", "Server Components + Client Components", Inches(2.45)),
           ("Next.js App Router", "app/**/page.tsx   ·   app/api/**/route.ts", Inches(3.35)),
           ("Auth & session layer", "JWT in HttpOnly cookie  ·  role guard on every route", Inches(4.25)),
           ("Domain layer (lib/)", "auth · payments · subscriptions · finance · scheduling · validation", Inches(5.15)),
           ("Prisma ORM 7  →  SQLite / Turso libSQL", "33 models  ·  migrations as source of truth", Inches(6.05))]
    for i, (lbl, note, y) in enumerate(lay):
        flow_box(s, Inches(1.6), y, Inches(7.2), Inches(0.72), lbl, note,
                 accent=(i in (2, 4)))
        if i < len(lay) - 1:
            arrow(s, Inches(5.1), y + Inches(0.74), None, vertical=True,
                  length=Inches(0.15))
    flow_box(s, Inches(9.3), Inches(4.25), Inches(3.0), Inches(0.72),
             "Payment gateway", "checkout · webhook · refund")
    flow_box(s, Inches(9.3), Inches(5.15), Inches(3.0), Inches(0.72),
             "Daily scheduler", "/api/cron/subscriptions")
    footer(s, n)

    # 8 — Data model -------------------------------------------------------
    n += 1
    s = blank(prs); bg(s)
    title(s, "Data model", kicker="33 models",
          sub="Relationships — not flags — carry the business rules.")
    cols = [("Identity & access",
             "User  ·  TrainerProfile\nGymStaff  ·  Session\nAuditLog"),
            ("Gym & commerce",
             "Gym  ·  GymMembership\nGymTrainer  ·  SubscriptionPlan\nSubscription  ·  Payment  ·  PaymentEvent"),
            ("Coaching & content",
             "TrainerClient  ·  WorkoutPlan\nDietPlan  ·  PlanDay  ·  Exercise\nMeal  ·  FoodItem  ·  Assignment"),
            ("Progress & trust",
             "WorkoutLog  ·  NutritionLog\nBodyCheckIn  ·  Feedback\nGymReview  ·  TrainerReview  ·  Notification")]
    for i, (h_, body) in enumerate(cols):
        x = Inches(0.85) + i * Inches(2.98)
        c = rect(s, x, Inches(2.75), Inches(2.72), Inches(2.6), fill=BG_SOFT,
                 line=LINE, lw=0.75)
        rect(s, x, Inches(2.75), Pt(3.5), Inches(2.6), fill=LIME)
        txt(s, x + Inches(0.3), Inches(3.05), Inches(2.3), Inches(0.4), h_,
            size=15, color=LIME, bold=True, font=FONT_B)
        txt(s, x + Inches(0.3), Inches(3.5), Inches(2.3), Inches(1.7), body,
            size=11.5, color=WHITE, spacing=1.45)
    txt(s, Inches(0.85), Inches(5.7), Inches(11.5), Inches(0.5),
        "Money is stored as integers in the smallest currency unit  ·  plans are versioned and immutable once assigned.",
        size=13, color=MUTED)
    footer(s, n)

    # 9 — Landing / entry --------------------------------------------------
    n += 1
    s = blank(prs); bg(s)
    title(s, "The product", kicker="Walkthrough")
    shot(s, "landing", Inches(0.85), Inches(2.2), w=Inches(7.3))
    bullets(s, Inches(8.7), Inches(2.45), Inches(3.8),
            [("Public marketplace", "Browse gyms and trainers before signing up"),
             ("Self-service sign-up", "Member or trainer, in one step"),
             ("EN / فارسی", "Full RTL layout, Jalali dates"),
             ("Light & dark", "Persisted per user")], size=16, gap=Inches(0.92))
    footer(s, n)

    # 10 — Member journey --------------------------------------------------
    n += 1
    s = blank(prs); bg(s)
    title(s, "Member journey", kicker="Walkthrough · 1 of 3")
    shot(s, "member-overview", Inches(0.85), Inches(2.32), w=Inches(5.9),
         caption="Member dashboard", caption_y=Inches(6.02))
    shot(s, "member-workouts", Inches(7.05), Inches(2.32), w=Inches(5.4),
         caption="Assigned workout plan", caption_y=Inches(6.02))
    txt(s, Inches(0.85), Inches(6.42), Inches(11.5), Inches(0.4),
        "Discover a gym  →  subscribe & pay  →  request a trainer  →  follow the plan  →  log every session",
        size=14, color=WHITE)
    footer(s, n)

    # 11 — Progress --------------------------------------------------------
    n += 1
    s = blank(prs); bg(s)
    title(s, "Progress that is actually measured", kicker="Walkthrough · 1 of 3")
    shot(s, "member-progress", Inches(0.85), Inches(2.25), w=Inches(7.3))
    bullets(s, Inches(8.7), Inches(2.45), Inches(3.9),
            [("Workout logs", "Prescribed vs. actual sets, load, RPE"),
             ("Nutrition logs", "Meal completion, portions, substitutions"),
             ("Body check-ins", "Weight, body fat, measurements, photos"),
             ("Two-way feedback", "Trainer comments on a specific log")],
            size=16, gap=Inches(0.92))
    footer(s, n)

    # 12 — Trainer ---------------------------------------------------------
    n += 1
    s = blank(prs); bg(s)
    title(s, "Trainer workspace", kicker="Walkthrough · 2 of 3")
    shot(s, "trainer-workouts", Inches(0.85), Inches(2.32), w=Inches(5.9),
         caption="Plan builder — days, exercises, versions", caption_y=Inches(6.02))
    shot(s, "trainer-schedule", Inches(7.05), Inches(2.32), w=Inches(5.4),
         caption="Availability & sessions", caption_y=Inches(6.02))
    txt(s, Inches(0.85), Inches(6.42), Inches(11.5), Inches(0.4),
        "Reusable plans  ·  versioning & duplication  ·  conflict-checked scheduling  ·  client progress review",
        size=14, color=WHITE)
    footer(s, n)

    # 13 — Admin -----------------------------------------------------------
    n += 1
    s = blank(prs); bg(s)
    title(s, "Gym owner workspace", kicker="Walkthrough · 3 of 3")
    shot(s, "admin-overview", Inches(0.85), Inches(2.32), w=Inches(5.9),
         caption="Live KPIs: members, trainers, revenue, expiries", caption_y=Inches(6.02))
    shot(s, "admin-payments", Inches(7.05), Inches(2.32), w=Inches(5.4),
         caption="Payment ledger & refunds", caption_y=Inches(6.02))
    txt(s, Inches(0.85), Inches(6.42), Inches(11.5), Inches(0.4),
        "Approve applications  ·  price subscription plans  ·  reconcile payments  ·  audited actions",
        size=14, color=WHITE)
    footer(s, n)

    # 14 — Payments flow ---------------------------------------------------
    n += 1
    s = blank(prs); bg(s)
    title(s, "Payments & subscriptions", kicker="Core flow",
          sub="Idempotent checkout, signed webhooks, and access that follows the money.")
    steps = ["Checkout\ncreated", "Provider\nredirect", "Signed\nwebhook",
             "Payment\nconfirmed", "Subscription\nactive"]
    x = Inches(0.9)
    for i, st in enumerate(steps):
        flow_box(s, x, Inches(3.1), Inches(1.95), Inches(1.15), st.split("\n")[0],
                 st.split("\n")[1], accent=(i == 4))
        if i < len(steps) - 1:
            arrow(s, x + Inches(2.0), Inches(3.58), Inches(0.35))
        x += Inches(2.45)
    extras = [("Idempotency", "The same checkout is never charged twice"),
              ("Refunds", "Owner-initiated, access reconciled automatically"),
              ("Daily cron", "Expiry, renewal and notification sweep")]
    for i, (h_, nt) in enumerate(extras):
        card(s, Inches(0.9) + i * Inches(3.92), Inches(4.85), Inches(3.6),
             Inches(1.3), h_, nt)
    footer(s, n)

    # 15 — Security & quality ---------------------------------------------
    n += 1
    s = blank(prs); bg(s)
    title(s, "Security & quality", kicker="Non-negotiables")
    left = [("Server-side authorisation", "Every mutation re-checks role and ownership"),
            ("Signed HttpOnly sessions", "JWT, revocable, suspended users locked out"),
            ("Hardened headers", "CSP, HSTS, no external font or script hosts"),
            ("Audit log", "Sensitive admin and payment actions recorded")]
    right = [("73 automated tests", "Validation, auth, scheduling, finance, schema"),
             ("Strict TypeScript", "tsc --noEmit clean, ESLint enforced"),
             ("CI on every push", "GitHub Actions: lint → test → typecheck → build"),
             ("Reproducible data", "Migrations + idempotent seed script")]
    bullets(s, Inches(0.85), Inches(2.5), Inches(5.2), left, size=17, gap=Inches(1.05))
    bullets(s, Inches(6.9), Inches(2.5), Inches(5.2), right, size=17, gap=Inches(1.05))
    footer(s, n)

    # 16 — Localisation / UX ----------------------------------------------
    n += 1
    s = blank(prs); bg(s)
    title(s, "Built for real users", kicker="Experience")
    shot(s, "dark-member", Inches(0.85), Inches(2.4), w=Inches(6.0),
         caption="Dark theme", caption_y=Inches(6.18))
    shot(s, "mobile-member", Inches(7.35), Inches(2.4), h=Inches(3.6),
         caption="Responsive", caption_y=Inches(6.18))
    bullets(s, Inches(9.55), Inches(2.55), Inches(2.95),
            [("Bilingual", "EN · فارسی, one dictionary"),
             ("RTL-aware", "Layout mirrors, not just text"),
             ("Jalali dates", "Persian numerals & currency"),
             ("Accessible", "Keyboard, contrast, states")],
            size=15, gap=Inches(0.88), sub_size=11)
    footer(s, n)

    # 17 — Results & future -----------------------------------------------
    n += 1
    s = blank(prs); bg(s)
    title(s, "Results & future work", kicker="Conclusion")
    txt(s, Inches(0.85), Inches(2.35), Inches(5.3), Inches(0.35),
        "DELIVERED", size=12, color=LIME, bold=True, font=FONT_B)
    bullets(s, Inches(0.85), Inches(2.85), Inches(5.0),
            [("End-to-end working platform", "All three roles, deployed and seeded"),
             ("Commerce layer", "Plans, checkout, webhooks, refunds"),
             ("Verified trust layer", "Reviews only from real members and clients")],
            size=16, gap=Inches(0.95))
    txt(s, Inches(6.9), Inches(2.35), Inches(5.3), Inches(0.35),
        "NEXT", size=12, color=LIME, bold=True, font=FONT_B)
    bullets(s, Inches(6.9), Inches(2.85), Inches(5.0),
            [("Real payment provider", "Swap the demo adapter for a local gateway"),
             ("Mobile app & notifications", "Push reminders for sessions and plans"),
             ("Analytics & recommendations", "Retention insight, plan suggestions")],
            size=16, gap=Inches(0.95))
    footer(s, n)

    # 18 — Thanks ----------------------------------------------------------
    n += 1
    s = blank(prs)
    bg(s, os.path.join(ASSETS, "bg-title.png"))
    txt(s, Inches(1.1), Inches(2.9), Inches(10), Inches(1.2), "Thank you",
        size=60, color=WHITE, bold=True, font=FONT_B)
    rect(s, Inches(1.13), Inches(4.15), Inches(0.9), Pt(4), fill=LIME)
    txt(s, Inches(1.1), Inches(4.45), Inches(9), Inches(0.6),
        "Questions & live demo", size=22, color=MUTED)
    txt(s, Inches(1.1), Inches(6.35), Inches(9), Inches(0.4),
        "KooGYMaa  ·  github.com/aghrabooti/KooGYMaa", size=12, color=MUTED)

    add_notes(prs)
    prs.save(OUT)
    print("saved:", OUT, "| slides:", len(prs.slides.__iter__.__self__._sldIdLst))





if __name__ == "__main__":
    build()

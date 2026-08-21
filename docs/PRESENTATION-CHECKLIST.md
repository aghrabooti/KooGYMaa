# KooGYMaa Presentation To-Do List

Goal: demo **every** feature, in a narrative order that makes sense (Member → Trainer → Admin).
Everything below is implemented in the app today — this list maps 1:1 to the real routes.

---

## Phase 0 — Demo setup (do the day before, re-verify 1 hour before)

- [x] ~~Start the app: `npm run dev`~~ ✅ dev server is running live on port 3000
- [x] ~~Verify DB is seeded: `npm run db:seed`~~ ✅ seeded (all 5 demo accounts ready)
- [ ] Have these accounts on a "cheat sheet" card next to you — password for all: **`KooGYMaa123!`**
  - `member@koogymaa.test` → **Member** (primary user)
  - `trainer@koogymaa.test` → **Trainer**
  - `admin@koogymaa.test` → **Admin / Gym Owner**
  - `pending.member@koogymaa.test` → member with a *pending* membership (for approval demo)
  - `pending.trainer@koogymaa.test` → trainer with a *pending* gym request (for approval demo)
- [ ] Open 3 private/incognito windows (one per role) — sessions are per-cookie, so you can be logged in as all 3 roles simultaneously. Screenshot-worthy moment: same app, 3 different dashboards.
- [ ] Prepare one fake photo file (any gym selfie) for the progress-photo upload demo
- [ ] Laptop charged, notifications silenced, browser zoomed to 110% so the back row can read it
- [ ] Close every tab except the app

---

## Phase 1 — Opening: the product in 30 seconds

- [ ] Show the **landing page** (`/`) — name, tagline, "one platform for gyms, trainers and members"
- [ ] Say the one-liner: *"Three roles, one system: members train, trainers coach, gym owners run the business."*
- [ ] Mention the stack briefly: Next.js 16 + React 19, TypeScript, Prisma + SQLite/Turso, JWT session cookies

## Phase 2 — Member journey (register → train → pay)

- [ ] **Register a brand-new account** (don't pre-create it — doing sign-up live proves it works), show you're redirected to the member area
- [ ] `/user` — **Member dashboard**: today's schedule, active subscription, current plans at a glance
- [ ] `/user/gyms` — **Gym discovery**: browse gyms, open `/user/gyms/[gymId]` detail (trainers, plans, reviews)
- [ ] **Request membership** to a gym → point out it's now *pending* (sets up the admin approval beat later)
- [ ] `/user/subscriptions` — **Subscription plans**: pick a plan, start checkout
- [ ] `/user/checkout/[paymentId]` — **Payment flow**: confirm payment → subscription turns active (mention webhooks + refund support for the techies)
- [ ] `/user/trainers` + `/user/trainers/[trainerId]` — **Trainer discovery**: ratings/reviews, specializations; **send a training request**
- [ ] **Leave a review** on the gym and on a trainer (shows the review system both places)
- [ ] `/user/workouts` — **Assigned workout plan**: day-by-day structure, exercises with sets/reps; **log a completed workout** (per-exercise logging)
- [ ] `/user/nutrition` — **Assigned diet plan**: meals & food items per day; **log what you actually ate**
- [ ] `/user/progress` — **Progress tracking**: add a **body measurement** (weight/waist/etc.), upload a **progress photo**, point at the history/chart
- [ ] `/user/schedule` — **My training sessions**: upcoming/past sessions with the trainer
- [ ] `/user/notifications` — **Notifications**: membership approval, payment, session updates all land here
- [ ] `/user/profile` — **Profile management**
- [ ] **Feedback**: send feedback, show that threads support **replies** (two-way messaging)

## Phase 3 — Trainer journey (coach's side)

- [ ] Log in as `trainer@koogymaa.test` → `/trainer` **Trainer dashboard** (active clients, today's sessions)
- [ ] `/trainer/gyms` — **Gym associations**: gyms they train at / requested to join
- [ ] `/trainer/students` — **Client management**: **accept the request you just sent as the member** ← this is the callback moment, the member's notification appears live
- [ ] `/trainer/schedule` — **Availability editor**: set weekly availability slots; **book/confirm a session** with the client
- [ ] `/trainer/workouts` — **Workout plan builder**: create a plan → open `/trainer/workouts/[planId]` to add **days → exercises (sets/reps/notes)** → **assign it to the client**; show **clone plan** (reuse for another client)
- [ ] `/trainer/nutrition` — **Diet plan builder**: meals + food items, assign to client, clone
- [ ] `/trainer/progress` → `/trainer/progress/[clientId]` — **Client progress review**: see the measurements/photos/workout logs the member just entered (another live callback!)
- [ ] `/trainer/profile` — **Trainer profile**: bio, specializations, pricing visible to members
- [ ] `/trainer/feedback` — **Reply to the member's feedback** from Phase 2

## Phase 4 — Admin / gym-owner journey (running the business)

- [ ] Log in as `admin@koogymaa.test` → `/admin` **Admin dashboard** (all gyms, KPIs)
- [ ] `/admin/gyms` — **Gym management**: create a new gym (or open the existing one) → `/admin/gymId` overview (revenue, members, trainers, plans)
- [ ] **Members tab** — **approve the pending membership** from `pending.member@...` (and optionally the one you created in Phase 2); show reject/suspend controls exist
- [ ] **Trainers tab** — **approve the pending gym-trainer request**
- [ ] **Plans tab** — **Subscription plan CRUD**: create/edit a plan (name, price, duration)
- [ ] **Subscriptions tab** — see the member subscription bought in Phase 2; cancel/expire controls
- [ ] **Payments tab** — payment ledger, then **issue a refund** ← strong "we handle real money" beat
- [ ] **Settings tab** — gym settings (edit details, archive/suspend gym lifecycle)

## Phase 5 — Cross-cutting & "under the hood" (for technical audiences)

- [ ] **Security**: role-based access is enforced server-side — demo by pasting `/admin` while logged in as member → bounced away; middleware protects all routes; hardened security headers (CSP etc.)
- [ ] **Audit log**: sensitive admin actions are recorded (`AuditLog` in the DB)
- [ ] **Payments architecture**: checkout → confirm → webhook endpoint (`/api/webhooks/payments/[provider]`) → payment event history
- [ ] **60+ API endpoints**, all server-validated (mention `docs/` folder: database.md, payments.md, operations.md)
- [ ] **Quality**: `npm test` — 47 tests, `tsc --noEmit` clean, production build green

## Phase 6 — Closing

- [ ] Recap in one sentence per role: member trains and tracks, trainer coaches and assigns, owner operates and monetizes
- [ ] "What you saw took ~15 minutes; the same flows on real data take a member 5 minutes a day" 
- [ ] Q&A — keep the dev DB open; if someone asks "can it do X", check this list before improvising

## Backup plan (if the live demo breaks)

- [ ] Screenshots folder of every page (take during rehearsal)
- [ ] If DB state gets messy mid-demo, reset between beats: `npm run db:seed`
- [ ] If Vercel is down: the local dev server is the fallback → rehearse once fully offline
- [ ] Never demo the *pending* accounts' login screens as "errors" — the pending state is intentional (it's the approval story)

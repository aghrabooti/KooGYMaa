# KooGYMaa

A web-based gym management platform for gym administrators, trainers, and members.

## Authentication

KooGYMaa uses signed, server-validated sessions stored in an `HttpOnly` cookie. Three roles are supported:

- `ADMIN` — gym administration routes under `/admin`
- `TRAINER` — trainer routes under `/trainer`
- `USER` — member routes under `/user`

Public registration can only create `TRAINER` and `USER` accounts. Administrator accounts must be provisioned separately. Suspended or deactivated users cannot create or reuse a session.

## Domain model

The Prisma schema models the complete gym relationship foundation:

- `GymStaff` connects owners and managers to one or more gyms.
- `GymTrainer` handles trainer applications and membership status per gym.
- `GymMembership` handles member applications, approval, suspension, and expiry.
- `TrainerClient` tracks the direct trainer–student relationship.
- `SubscriptionPlan` and `Subscription` support separate member and trainer plans.
- Workout and diet plans are reusable and assigned through dedicated assignment records.
- Gym and trainer reviews are separate, uniquely constrained models.
- Feedback can target a coaching relationship, workout assignment, or diet assignment.

Money values are stored as integers in the currency's smallest unit. Local `.db` files are intentionally ignored; migrations and the seed script are the reproducible source of database state.

## Local setup

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Copy the environment template and set a strong JWT secret:

   ```bash
   cp .env.example .env
   openssl rand -base64 32
   ```

3. Generate Prisma Client and apply migrations:

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. Optionally load realistic development data:

   ```bash
   npm run db:seed
   ```

   The seed is idempotent and creates example admin, trainer, and member accounts. Set `SEED_PASSWORD` in `.env` before running it.

5. Start the application:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Quickstart: Turso only (no Vercel)

If you just want the app to read and write a hosted libSQL database directly —
no Vercel, no local SQLite file — point the project at your Turso database and
apply the schema. The app already supports this natively (`lib/prisma.ts`
reads `LIBSQL_DATABASE_URL` / `LIBSQL_DATABASE_AUTH_TOKEN`).

1. *(Optional)* Configure the database. The Turso URL, auth token, JWT secret,
   and demo payment settings are **embedded in the code** (`lib/prisma.ts`,
   `lib/auth.ts`, `lib/env.ts`), so the app reads/writes Turso with **no
   environment variables at all**. To point at a different database, override
   them via `.env` (see `.env.example`):

   ```env
   LIBSQL_DATABASE_URL=libsql://your-db.turso.io
   LIBSQL_DATABASE_AUTH_TOKEN=<read/write token>
   JWT_SECRET=<openssl rand -base64 32>
   ```

2. Install dependencies and generate the Prisma client:

   ```bash
   npm ci
   ```

3. Apply the schema **and** demo data to Turso in one step (no `turso` CLI
   needed — it uses the libSQL client already in `node_modules`):

   ```bash
   npm run db:turso:setup     # fresh database
   # npm run db:turso:fresh   # drop everything first, then re-apply
   ```

4. Run the app — it talks to Turso directly:

   ```bash
   npm run dev
   ```

   Verify health at [http://localhost:3000/api/health](http://localhost:3000/api/health):
   it reports `database: "connected"` and the hosted database URL kind.

Seed accounts after setup: `admin@koogymaa.test`, `trainer@koogymaa.test`,
`member@koogymaa.test` (password `SEED_PASSWORD`, default `KooGYMaa123!`).

To apply schema changes later, edit the migration SQL and regenerate the hosted
setup file (`node scripts/dump-hosted-sql.mjs`), or re-run `npm run db:turso:fresh`.

## Internationalization (Persian + English)

The UI ships with English and Persian (فارسی), switchable from the language
toggle (EN | فا) shown in the navigation, the auth screens, and the landing
page header. The choice is saved in a `locale` cookie and flips the page
direction to RTL for Persian.

- Translations live in `lib/i18n/translations.ts` — the `en` and `fa` objects
  must stay in key parity. Add a key to both, then use `t("your.key")` in a
  Client Component or `createT(await getLocale())` in a Server Component.
- `lib/i18n/language-provider.tsx` provides `useT()` / `useI18n()`;
  `lib/i18n/server.ts` exposes `getLocale()` for Server Components;
  `components/language-switcher.tsx` is the toggle.
- Persian text uses a Tahoma-based system font stack (the CSP blocks external
  font hosts). For nicer Persian, add Vazirmatn via `next/font` and extend the
  `html.locale-fa` rule in `app/globals.css`.

The nav bars, auth screens, landing page, and dashboard are localized. Inner
page content reuses the same dictionary and can be translated incrementally by
wrapping strings in `t(...)`.

## Theme & typography

- A light/dark toggle (sun/moon) sits next to the language switcher in the nav
  and headers; the choice persists in a `theme` cookie and adds `.theme-dark` to
  `<html>`. The dark palette overrides live in `app/globals.css` under
  `.theme-dark`.
- Persian text uses **Vazirmatn** (loaded via `next/font`, self-hosted so it
  respects the CSP). It is applied automatically whenever the locale is فارسی.
- The brand's Persian name is **کوجیما** (not کوگیما) — shown under the wordmark
  on the auth screen.

## Quality checks

```bash
npm run lint
npm test
npm run typecheck
npm run db:validate
npm run build
```

## Gym administration

Authenticated gym owners and managers use `/admin/gyms`. Every database mutation checks both the global `ADMIN` role and an active `GymStaff` relationship for the target gym.

The administration workspace includes:

- live membership, trainer, subscription, revenue, rating, and expiry metrics;
- member and trainer application approval, rejection, suspension, and restoration;
- member/trainer assignment by existing account email;
- member and trainer subscription-plan management;
- subscription activation, 30-day extension, cancellation, and auto-renew controls;
- gym profile, contact information, visibility, and workspace creation.

## Trainer workspace

Authenticated trainers use `/trainer`. The workspace includes:

- a live coaching overview with student, gym, rating, plan, and session metrics;
- a public profile editor for specialty, bio, experience, rate, currency, and availability;
- gym discovery, applications, membership status, and voluntary departure;
- student invitations and coaching-relationship lifecycle controls;
- training-session creation, conflict detection, completion, cancellation, and no-show tracking;
- reusable weekly availability slots with overlap validation.

Every trainer API verifies the authenticated trainer profile and scopes resource mutations to that trainer. Sessions can only be created for active students and active gym memberships.

## Workout and nutrition plans

Trainers can build reusable and student-specific plans under `/trainer/workouts` and `/trainer/nutrition`:

- workouts are structured into days and ordered exercises with sets, reps, weight/RPE, tempo, rest, duration, distance, and notes;
- nutrition plans are structured into days, meals, and food items with portions, calories, protein, carbohydrates, and fat;
- drafts can be edited freely, while published or assigned versions are immutable;
- `New version` preserves the plan family and increments its version number;
- `Duplicate` creates an independent plan family from the same content;
- publishing requires meaningful structured content;
- assigning a published plan replaces the student's previous active plan of the same type while preserving history.

All plan, version, and assignment APIs verify trainer ownership and active student relationships.

## Progress execution and feedback

Members can execute assigned plans under `/user/workouts`, `/user/nutrition`, and `/user/progress`:

- workout logs compare prescribed and actual sets, reps, load, duration, distance, and RPE;
- nutrition logs track meal completion, portions, substitutions, hunger, and energy;
- body check-ins record weight, body fat, measurements, notes, and optional progress-photo URLs;
- trainers review client compliance under `/trainer/progress` and attach feedback to specific logs;
- members can reply in feedback threads;
- plan assignments, feedback, and scheduled sessions create member notifications.

All execution APIs enforce member ownership. Trainer feedback APIs verify the coaching relationship and log ownership before exposing or mutating progress data.

## Member workspace and discovery

The complete member workspace starts at `/user` and includes:

- a live dashboard for compliance, active plans, gym, trainer, sessions, subscription expiry, feedback, and notifications;
- gym search and filters for city, rating, and plan price;
- gym detail pages with plans, coaching teams, contact information, and reviews;
- gym membership applications, reapplications, and cancellations;
- trainer search and filters for specialty, gym, rating, availability, and rate;
- trainer profiles with availability, active gyms, rates, reviews, and coaching requests;
- coaching requests for independent services or a shared active gym;
- member session schedule and history;
- subscription history and renewal state;
- editable member name, phone, and avatar URL.

Marketplace mutations enforce the `USER` role, active public resources, and shared-gym membership where applicable.

## Reviews, payments, and production

The MVP commerce and trust layer includes:

- verified gym reviews for members with a started membership;
- verified trainer reviews for clients with a started coaching relationship;
- review creation, editing, deletion, and rating summaries;
- idempotent checkout creation and transaction history;
- pending, successful, failed, refunded, and cancelled payment states;
- subscription activation and renewal only after payment confirmation;
- signed, idempotent webhook processing;
- gym-owner refunds with access reconciliation;
- audit records for payments and sensitive administration actions;
- security headers, production environment checks, error/loading states, and GitHub Actions CI.

The built-in demo provider performs no financial transaction. Production must install a real provider adapter unless demo payments are explicitly enabled. See `docs/payments.md`, `docs/deployment.md`, and `docs/operations.md`.

## Database commands

| Command | Purpose |
| --- | --- |
| `npm run db:generate` | Regenerate Prisma Client after schema changes |
| `npm run db:validate` | Validate Prisma models and relations |
| `npm run db:migrate` | Create/apply development migrations |
| `npm run db:seed` | Load idempotent development data |
| `npm run db:studio` | Inspect the local database |

## Auth endpoints

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/auth/register` | `POST` | Create a member or trainer account and session |
| `/api/auth/login` | `POST` | Validate credentials and create a session |
| `/api/auth/logout` | `POST` | Delete the current session |
| `/api/auth/me` | `GET` | Return the authenticated user DTO |

Sensitive routes must use the authorization helpers in `lib/session.ts` or `lib/api-auth.ts`; Proxy checks are only an optimistic first layer.

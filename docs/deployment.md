# Production deployment

## Vercel (recommended host)

Vercel **cannot serve the local `dev.db` file** — serverless functions have a read-only filesystem, and runtime-opened files are not bundled. Use a hosted libSQL database (Turso):

1. Create the database — pick one:
   - **Dashboard, no CLI:** sign in at `app.turso.tech` → *Create Database* (name: `koogymaa`). On the database page, copy the `libsql://koogymaa-....turso.io` URL and click *Generate Token*.
   - **CLI:** `turso db create koogymaa` → `turso db show koogymaa --url` → `turso db tokens create koogymaa`.

2. Apply schema **and** demo data in one step — pick one:
   - **Dashboard:** open the database's *SQL Editor*, paste the contents of `prisma/turso-demo-setup.sql`, run it.
   - **CLI:** `turso db shell koogymaa < prisma/turso-demo-setup.sql`

   The file is generated from the seeded local dev database and contains all 33 tables plus the
   demo accounts (member/trainer/admin@koogymaa.test, password `KooGYMaa123!`). Regenerate it
   any time with `node scripts/dump-hosted-sql.mjs`. For an empty production DB with no demo
   data, instead run: `cat prisma/migrations/*/migration.sql | turso db shell koogymaa`

3. In **Vercel → Project → Settings → Environment Variables** (Production):

   ```env
   LIBSQL_DATABASE_URL=libsql://koogymaa-....turso.io
   LIBSQL_DATABASE_AUTH_TOKEN=<token from step 1>
   JWT_SECRET=<random 32+ character secret>
   APP_URL=https://<your-vercel-domain>
   PAYMENT_PROVIDER=demo            # or your real provider
   PAYMENT_WEBHOOK_SECRET=<random 32+ character secret>
   ALLOW_DEMO_PAYMENTS=false        # true only to demo the demo provider
   ```

   Prefer the `LIBSQL_` names: `LIBSQL_DATABASE_URL` takes priority over `DATABASE_URL`,
   so a leftover Postgres `DATABASE_URL` from a Vercel integration can never shadow the
   live database. (`DATABASE_URL` + `DATABASE_AUTH_TOKEN` pointing at libSQL also work.)

4. Redeploy. `npm run build` already runs `prisma generate` before `next build`; generate does not need database access — only runtime does.

## Requirements

- Node.js 22
- A persistent libSQL-compatible database (local SQLite is development-only)
- HTTPS application URL
- A 32+ character JWT secret
- A 32+ character payment-webhook secret
- A configured payment-provider adapter

## Environment

Copy `.env.example` into the deployment secret manager. In production:

```env
NODE_ENV=production
LIBSQL_DATABASE_URL=libsql://your-database-host
LIBSQL_DATABASE_AUTH_TOKEN=<libSQL auth token>
JWT_SECRET=<random 32+ character secret>
APP_URL=https://your-domain.example
PAYMENT_PROVIDER=<installed provider name>
PAYMENT_WEBHOOK_SECRET=<random 32+ character secret>
ALLOW_DEMO_PAYMENTS=false
```

Never commit production secrets or database files.

## Release procedure

```bash
npm ci
npm run db:generate
npm test
npm run build
npm start
```

### Applying schema changes to the hosted database

`prisma migrate dev` / `migrate deploy` only work against local `file:` databases —
the Prisma CLI in this project is not wired to a libSQL driver adapter, so it cannot
run migrations against the hosted `libsql://` URL. Apply hosted schema changes the
same way the initial setup is applied: as SQL.

1. Author and test the migration locally against a file database:

   ```bash
   npm run db:migrate
   ```

2. Generate a fresh hosted setup file (keeps `prisma/turso-demo-setup.sql` in sync;
   `tests/hosted-sql.test.ts` verifies it matches the migration chain):

   ```bash
   npm run db:seed            # refresh local demo data first
   node scripts/dump-hosted-sql.mjs
   ```

3. Apply only the **new** migration files to the hosted database:

   ```bash
   turso db shell koogymaa < prisma/migrations/<new_migration_dir>/migration.sql
   ```

   Or paste the file's contents into the database's SQL editor in the Turso dashboard.

Back up the hosted database before destructive migrations (`turso db shell koogymaa ".backup backup.db"`).

## Health verification

After deployment, verify:

1. `/` returns 200 over HTTPS.
2. Login creates an `HttpOnly`, `Secure`, `SameSite=Lax` session cookie.
3. Role-restricted pages reject the wrong role.
4. A sandbox payment creates a signed webhook event and activates the expected subscription.
5. Security headers are present.

## Payment adapter

The built-in `demo` provider is intended for local development. Production startup rejects it unless `ALLOW_DEMO_PAYMENTS=true` is explicitly set. Implement the `PaymentProvider` interface in `lib/payments/provider.ts`, store provider credentials only in the deployment secret manager, and validate all webhook signatures against the raw body.

## Troubleshooting authentication on the live site

Login and registration both return HTTP 500 ("Unable to sign in right now" / "Unable to create your account right now") when the runtime environment is wrong — the UI deliberately shows a generic message. Check, in order:

1. **Database URL** — `/api/health` reports `{ ok, database, users }`. `database: "error"` means the app cannot reach the hosted DB. The URL must start with `libsql://` (a `postgres...` URL is rejected at startup; a `file:` URL on Vercel is rejected because serverless filesystems are read-only and every write fails).
2. **`JWT_SECRET`** — must exist and be at least 32 characters in production. Missing or short secrets make every login/register throw before a response is produced. Generate one with `openssl rand -base64 32`.
3. **Auth token** — `DATABASE_AUTH_TOKEN` (or `LIBSQL_DATABASE_AUTH_TOKEN`) must match a token generated for the same hosted database.
4. **Schema drift** — if the hosted schema was created by hand or from an older file, re-apply `prisma/turso-demo-setup.sql` on a fresh database. `tests/hosted-sql.test.ts` keeps that file provably in sync with the migration chain.
5. After changing any variable, **redeploy** — serverless functions copy env at boot.
   Vercel scopes variables per environment: a branch deploy is a *Preview* deployment,
   so variables set only for *Production* are invisible to it. Enable the database
   variables for **both Production and Preview** (or a branch deploy renders pages but
   every database call fails — `/api/health` explains the exact cause).

# Production deployment

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
DATABASE_URL=libsql://your-database-host
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
npx prisma migrate deploy
npm test
npm run build
npm start
```

Run migrations once per release before increasing application traffic. Back up the database before destructive migrations.

## Health verification

After deployment, verify:

1. `/` returns 200 over HTTPS.
2. Login creates an `HttpOnly`, `Secure`, `SameSite=Lax` session cookie.
3. Role-restricted pages reject the wrong role.
4. A sandbox payment creates a signed webhook event and activates the expected subscription.
5. Security headers are present.

## Payment adapter

The built-in `demo` provider is intended for local development. Production startup rejects it unless `ALLOW_DEMO_PAYMENTS=true` is explicitly set. Implement the `PaymentProvider` interface in `lib/payments/provider.ts`, store provider credentials only in the deployment secret manager, and validate all webhook signatures against the raw body.

# Operations runbook

## Backups

For local SQLite, stop writes before copying the database:

```bash
sqlite3 dev.db ".backup backups/koogymaa-$(date +%F).db"
```

For hosted libSQL, use the provider's point-in-time recovery or snapshot feature. Keep encrypted backups in a separate account and test restoration regularly.

## Restore test

1. Restore into a non-production database.
2. Set `DATABASE_URL` to the restored copy.
3. Run `npx prisma migrate status`.
4. Run the automated tests and a role-based login smoke test.
5. Check `PRAGMA foreign_key_check` for SQLite/libSQL.

## Payment incident handling

- Webhooks are idempotent by `PaymentEvent.eventId`.
- Never mark a subscription active from a browser callback alone for a real provider; process a verified webhook.
- Compare provider settlements with successful `Payment` records.
- Refunds require an active gym-owner relationship and create audit records.
- Preserve failed payment and webhook records for investigation.

## Security incident handling

1. Rotate `JWT_SECRET` to invalidate all sessions.
2. Rotate provider and webhook credentials.
3. Review `AuditLog`, authentication logs, and provider events.
4. Suspend affected accounts rather than deleting evidence.
5. Restore from backup only after preserving forensic copies.

## Scheduled jobs

Before production scale, configure a scheduled worker to:

- mark elapsed subscriptions and memberships expired;
- create seven-day and one-day expiry notifications;
- trigger provider renewals for opted-in subscriptions;
- prune old read notifications and rate-limit state;
- verify payment reconciliation.

## Subscription lifecycle automation (new)

- `POST /api/cron/subscriptions` (and `GET` for schedulers without POST support)
  expires past-due `ACTIVE` subscriptions, extends `autoRenew` ones, and sends
  expiring-soon reminders. Protect with `CRON_SECRET` (`Authorization: Bearer …`).
- Recommended schedule: daily, e.g. Vercel Cron `0 2 * * *` → `/api/cron/subscriptions`.
- Reminder cadence is per-user configurable at `/api/user/notifications/settings`
  (`sessionReminderHours`, `expiryReminderDays`, `inactivityNudgeDays`, `enabled`).
- Health: `/api/health` reports `subscriptionsPastDue` (should return to 0 after
  each sweep) plus the 5 most recent monitored errors.

## Backups (script)

- `npm run db:backup` snapshots the database (`file:` copy, or JSON table dumps
  for hosted libSQL) plus `data/uploads/`, writes `backups/<timestamp>/manifest.json`,
  and runs a restore dry-run (every manifest entry must be readable).
- `.gitignore`d `data/` and `backups/` never enter Git; copy them to separate storage.
- Restore test procedure from the runbook above still applies quarterly.

## Rate limiting & monitoring

- Auth routes keep key-based limits; general write endpoints (`/api/user/checkout`,
  photo upload, trainer session booking) use `checkGeneralRateLimit` (30–120 req/min/IP).
- `lib/monitoring.ts` keeps a 50-entry server error ring buffer surfaced via
  `/api/health` (`recentErrors`). Wire alerts on `recentErrors` growth in production.

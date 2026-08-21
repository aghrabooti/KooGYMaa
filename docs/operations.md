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

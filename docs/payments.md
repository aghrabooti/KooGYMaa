# Payment architecture

KooGYMaa separates checkout creation, provider communication, webhook processing, and subscription activation.

## Flow

1. The member selects a gym plan.
2. `POST /api/user/checkout` creates a pending subscription and payment using an idempotency key.
3. The provider returns a checkout URL and reference.
4. A successful provider event is signature-verified and stored in `PaymentEvent`.
5. The payment is marked successful and the subscription and gym membership are activated atomically.
6. The member receives a notification and the action is added to `AuditLog`.

Renewals extend the existing subscription from its current end date. Refunds cancel the related subscription and revoke gym access only when no other active subscription exists.

## Demo provider

The demo provider generates deterministic signed checkout tokens and supports successful and declined outcomes. It performs no financial transaction. It is useful for local UI and integration tests but must not be presented as real payment processing.

## Adding a provider

Implement `PaymentProvider.createCheckout` in `lib/payments/provider.ts`, map provider statuses to the internal `PaymentStatus` enum, and add raw-body signature verification in the webhook route. Provider event IDs must remain unique for idempotency. Do not trust amount, currency, user, or plan values sent by the browser; load them from the database.

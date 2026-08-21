# Security policy

## Reporting

Do not open a public issue for a suspected vulnerability. Contact the repository owner privately with reproduction steps, affected routes, impact, and any suggested mitigation. Avoid accessing data that does not belong to your test account.

## Supported version

Security fixes target the latest `main` branch until formal releases are introduced.

## Current controls

- `HttpOnly`, `Secure` production session cookies with strict JWT validation
- database-backed role and ownership authorization
- input validation and authentication rate limiting
- verified service-history requirements for reviews
- idempotent payment creation and webhook events
- raw-payload webhook signature verification
- owner-only refunds and persistent audit records
- production secret and HTTPS validation
- response security headers and CSP

## Deployment responsibilities

Operators must use a persistent hosted database, store all secrets in a secret manager, replace in-memory rate limiting with shared infrastructure when running multiple instances, install a real payment adapter, configure backups, and monitor authentication, webhook, payment, and audit logs.

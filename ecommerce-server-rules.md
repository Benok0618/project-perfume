---
name: ecommerce-server-rules
description: Use when writing server routes or database code for products, cart, checkout, orders, auth, or order tracking.
---

## Trust
- Never trust prices, totals, or stock sent by the client. Look up each product and size in the database and recompute everything on the server.
- Validate every body, query, and param with Zod. Reject unknown fields.

## Database
- Use `@libsql/client` with `drizzle-orm/libsql`. There is no better-sqlite3; every query is async, so `await` it and never use `.get()`, `.all()`, or `.run()`.
- Connection settings come from runtime config: `NUXT_DATABASE_URL` (a `file:` URL locally, a Turso `libsql://` URL in production) and `NUXT_DATABASE_AUTH_TOKEN` (Turso only). Never hardcode a URL or token.
- Read one row with `.limit(1)` and destructure; read lists by awaiting the query directly.
- Nitro plugins and routes may use `useRuntimeConfig`; standalone scripts such as the seed must fall back to `process.env`.

## Orders
- Create the order, items, stock decrement, status event, and cart clearing in one `db.transaction(async (tx) => ...)`. This is supported over Turso's HTTP protocol, so keep it a single transaction; never split it into separate statements.
- Check stock inside the transaction with a conditional decrement: `UPDATE product_sizes SET stock = stock - ? WHERE ... AND stock >= ?` with `RETURNING`. If no row comes back, throw and let the whole transaction roll back. Do not read stock and then write back a computed value.
- Keep delta writes (cart quantity changes) inside a transaction as well; SQLite serialises writers, so a read-then-write in the same transaction is safe, but never update stock outside one.
- Generate a readable order number such as PP-2026-000123.
- Order status changes only forward through: placed, confirmed, packed, shipped, out_for_delivery, delivered. Guard the update with the current status and log a timestamp per change.

## Auth and access
- Use nuxt-auth-utils: hashPassword and verifyPassword, setUserSession, requireUserSession.
- Every order and cart route requires a session and filters by the session user id. A user must never read another user's order.
- Rate limit login and register. Return generic error messages. Enforce a minimum password length.
- The rate limiter is in-memory and per instance. It is best-effort on serverless: each instance keeps its own counters and they reset on cold starts. Use it to slow casual abuse, not as a security boundary.
- The admin status endpoint requires an admin flag on the user.

## Payments and data
- Payments are mocked. Never store card numbers, CVV, or expiry.
- Never return password hashes or internal fields in API responses.
- Keep secrets in env vars. NUXT_APP_SECRET must be at least 32 characters. Database and site URLs follow the `NUXT_*` runtime config names above.

---
name: ecommerce-server-rules
description: Use when writing server routes or database code for products, cart, checkout, orders, auth, or order tracking.
---

## Trust
- Never trust prices, totals, or stock sent by the client. Look up each product and size in the database and recompute everything on the server.
- Validate every body, query, and param with Zod. Reject unknown fields.

## Orders
- Create the order, order_items, stock decrement, and cart clearing in one database transaction.
- With better-sqlite3 and Drizzle, transactions are synchronous. Do not use async callbacks inside db.transaction.
- Check stock inside the transaction and fail the whole order if any item is short.
- Generate a readable order number such as AN-2026-000123.
- Order status changes only forward through: placed, confirmed, packed, shipped, out_for_delivery, delivered. Log a timestamp per change.

## Auth and access
- Use nuxt-auth-utils: hashPassword and verifyPassword, setUserSession, requireUserSession.
- Every order and cart route requires a session and filters by the session user id. A user must never read another user's order.
- Rate limit login and register. Return generic error messages. Enforce a minimum password length.
- The admin status endpoint requires an admin flag on the user.

## Payments and data
- Payments are mocked. Never store card numbers, CVV, or expiry.
- Never return password hashes or internal fields in API responses.
- Keep secrets in env vars. NUXT_SESSION_PASSWORD must be at least 32 characters.
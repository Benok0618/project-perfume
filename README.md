# project-perfume

A luxury fragrance storefront built with Nuxt 4, Nuxt UI, and SQLite. The site carries three audience themes (Men, Women, Unisex) that re-skin the whole storefront from a cookie, so the server renders the correct theme with no flash.

All marketing copy is lorem ipsum placeholder text kept in `app/content/copy.ts`. Functional labels, navigation, validation messages, order statuses, and scent family names stay in real English.

## Stack

- Nuxt 4 (Vue 3, TypeScript) with Nitro server routes
- Nuxt UI + Tailwind CSS v4 (CSS-first tokens in `app/assets/css/main.css`)
- Pinia, `@vueuse/nuxt`, `@nuxt/image`, `@nuxt/fonts`
- Drizzle ORM + SQLite (`better-sqlite3`)
- `nuxt-auth-utils` for session auth, Zod for request validation
- GSAP + Lenis for animation (client-only)

## Requirements

- Node 22 or newer
- pnpm 12 (`packageManager` is pinned to 12.15.0)
- A C++ toolchain is not needed: `better-sqlite3` ships prebuilt binaries, and its build script is allowed in `pnpm-workspace.yaml`.

## Setup

```bash
pnpm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Then fill in the values:

| Variable | Required | Purpose |
| --- | --- | --- |
| `NUXT_APP_SECRET` | yes | Seals the session cookie. At least 32 characters. Generate one with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"`. |
| `NUXT_DATABASE_URL` | no | SQLite file path. Defaults to `.data/app.db`. |
| `NUXT_ADMIN_EMAIL` | no | Email for the optional seeded admin account. |
| `NUXT_ADMIN_PASSWORD` | no | Password for the optional seeded admin account. |

`nuxt-auth-utils` 0.6 replaced `NUXT_SESSION_PASSWORD` with `NUXT_APP_SECRET`; the old variable is ignored and only triggers a warning. Set `NUXT_APP_SECRET`.

No default credentials are shipped. The admin account is only created when both `NUXT_ADMIN_EMAIL` and `NUXT_ADMIN_PASSWORD` are set before running the seed.

## Database

```bash
pnpm db:generate   # create a SQL migration from server/db/schema.ts
pnpm db:migrate    # apply migrations to .data/app.db
pnpm db:seed       # upsert 12 lorem products (4 men, 4 women, 4 unisex) and 3 sizes each
```

The seed is idempotent: products are upserted by slug, sizes by product and volume, and the admin user by email. Re-running it refreshes prices and stock without creating duplicates.

## Demo order tracking

Checkout, order history, and order tracking are behind sign-in. Sign in with the seeded admin account (the `NUXT_ADMIN_EMAIL` / `NUXT_ADMIN_PASSWORD` pair set before seeding) to see demo controls on an order page; they advance that order one status and store a tracking number once it reaches Shipped. The same action is available at `POST /api/orders/:id/status` with an admin session and a body such as `{ "status": "shipped", "trackingNumber": "PP-TRACK-0001" }`. Order statuses only move forward.

## Scent quiz

`/quiz` runs the seven-question "Find your scent" flow, preceded by an optional audience question that switches the active theme. Question and answer copy lives in `app/content/copy.ts`; option ids and weights live in `app/config/quiz.ts`.

The browser posts the completed answers to `POST /api/quiz/result`. The server validates them with Zod, scores every in-stock product in the selected audience scope (Men and Women include Unisex, Unisex only shows Unisex), and returns a top match plus two runner-ups with match percentages. Ties fall back to featured products and then product id; fewer than three matches simply return fewer cards.

The last result is stored in `localStorage` under `project-perfume-quiz`, so `/quiz` offers View last result and Retake. Signed-in submissions are also written to the `quiz_results` table with the answers, family scores, and top product.

## Development


```bash
pnpm dev        # http://localhost:3000
pnpm lint       # eslint .
pnpm typecheck  # nuxt typecheck
pnpm build
pnpm preview
```

CI runs `pnpm lint` and then `pnpm typecheck`. There is no test runner configured.

## Themes

The active audience is stored in an `audience` cookie and exposed as `data-theme` on `<html>`. Every color, font, radius, shadow, and easing comes from the token blocks in `app/assets/css/themes.css`; components must not hardcode visual values. The same tokens are mapped onto Nuxt UI's `--ui-*` variables so modals, drawers, forms, and buttons follow the active theme.

## Notes

- The auth rate limiter is in-memory and per process. It resets when the server restarts and is not shared between instances, so a multi-instance deployment needs a shared store instead.
- Product images referenced by the seed (`/media/products/*.svg`) are placeholders added with the shop phase.

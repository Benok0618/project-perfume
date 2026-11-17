# project-perfume

A luxury fragrance storefront built with Nuxt 4, Nuxt UI, and libSQL. The site carries three audience themes (Men, Women, Unisex) that re-skin the whole storefront from a cookie, so the server renders the correct theme with no flash.

All marketing copy is lorem ipsum placeholder text kept in `app/content/copy.ts`. Functional labels, navigation, validation messages, order statuses, and scent family names stay in real English.

## Stack

- Nuxt 4 (Vue 3, TypeScript) with Nitro server routes
- Nuxt UI + Tailwind CSS v4 (CSS-first tokens in `app/assets/css/main.css`)
- Pinia, `@vueuse/nuxt`, `@nuxt/image`, `@nuxt/fonts`
- Drizzle ORM + libSQL (`@libsql/client`): a local SQLite file in development, Turso in production
- `nuxt-auth-utils` for session auth, Zod for request validation
- GSAP + Lenis for animation (client-only)

## Requirements

- Node 22 or newer
- pnpm 12 (`packageManager` is pinned to 12.15.0)

No C++ toolchain is required. `@libsql/client` uses prebuilt native binaries for local files and plain HTTPS for Turso.

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
| `NUXT_PUBLIC_SITE_URL` | yes in production | Canonical site origin used by the sitemap and page SEO tags. Defaults to `https://project-perfume.example.com` in `app/config/site.ts`. Exposed to the client through runtime config. |
| `NUXT_DATABASE_URL` | no | Database URL. Defaults to `file:.data/app.db`. Production uses a Turso `libsql://` URL. |
| `NUXT_DATABASE_AUTH_TOKEN` | no | Turso auth token. Required when `NUXT_DATABASE_URL` points at Turso, unused for a local file. |
| `NUXT_ADMIN_EMAIL` | no | Email for the optional seeded admin account. |
| `NUXT_ADMIN_PASSWORD` | no | Password for the optional seeded admin account. |

`NUXT_DATABASE_URL` and `NUXT_DATABASE_AUTH_TOKEN` map to the `databaseUrl` and `databaseAuthToken` runtime config keys in `nuxt.config.ts`; environment variables take precedence so deployments can swap databases without rebuilding. `nuxt-auth-utils` 0.6 replaced `NUXT_SESSION_PASSWORD` with `NUXT_APP_SECRET`; the old variable is ignored and only triggers a warning. Set `NUXT_APP_SECRET`.

No default credentials are shipped. The admin account is only created when both `NUXT_ADMIN_EMAIL` and `NUXT_ADMIN_PASSWORD` are set before running the seed.

## Database

```bash
pnpm db:generate   # create a SQL migration from server/db/schema.ts
pnpm db:migrate    # apply migrations to NUXT_DATABASE_URL
pnpm db:seed       # upsert 12 lorem products (4 men, 4 women, 4 unisex) and 3 sizes each
```

The scripts load `.env` themselves, so they do not depend on your shell environment. They work against both the local file and Turso:

```bash
# local
NUXT_DATABASE_URL=file:.data/app.db pnpm db:migrate

# Turso
turso db create project-perfume
NUXT_DATABASE_URL="$(turso db show project-perfume --url)" \
NUXT_DATABASE_AUTH_TOKEN="$(turso db tokens create project-perfume)" \
pnpm db:migrate
```

Run the same pair of commands with `pnpm db:seed` to load the catalog and optional admin user. The seed is idempotent: products are upserted by slug, sizes by product and volume, and the admin user by email. Re-running it refreshes prices and stock without creating duplicates.

Migrations are plain SQL and are shared by both targets. `drizzle.config.ts` normalises a bare path such as `.data/app.db` into a `file:` URL, so either form works.

## Deploying to Vercel

Vercel's filesystem is read-only and ephemeral, so a SQLite file cannot persist there. Point the app at Turso instead.

1. Create a Turso database and copy its URL and a token (see above).
2. Import the repository into Vercel. Nuxt is detected automatically and Nitro builds with the `vercel` preset; no extra config is needed. To check locally, run `NITRO_PRESET=vercel pnpm build`.
3. Set these environment variables for Production and Preview:
   - `NUXT_APP_SECRET`
   - `NUXT_PUBLIC_SITE_URL` (the deployed origin, e.g. `https://project-perfume.vercel.app`, or the custom domain)
   - `NUXT_DATABASE_URL` (`libsql://...`)
   - `NUXT_DATABASE_AUTH_TOKEN`
   - optionally `NUXT_ADMIN_EMAIL` and `NUXT_ADMIN_PASSWORD` before the first seed
4. Apply migrations once against Turso with `pnpm db:migrate` before the first deployment, then seed if needed. Deploys do not run migrations.

The sitemap and page canonical/Open Graph URLs come from `NUXT_PUBLIC_SITE_URL`, so set it in Vercel rather than editing `app/config/site.ts`.

Rate limiting is best-effort on serverless: the limiter in `server/utils/rate-limit.ts` keeps counters in process memory. Each function instance has its own counters and they reset on cold starts, so limits are per-instance rather than global. That is acceptable for slowing down casual abuse, but a production deployment that needs reliable limits should move the counters to a shared store (for example Upstash Redis or Turso) behind the same `assertRateLimit` helper.

## Demo order tracking

Checkout, order history, and order tracking are behind sign-in. Sign in with the seeded admin account (the `NUXT_ADMIN_EMAIL` / `NUXT_ADMIN_PASSWORD` pair set before seeding) to see demo controls on an order page; they advance that order one status and store a tracking number once it reaches Shipped. The same action is available at `POST /api/orders/:id/status` with an admin session and a body such as `{ "status": "shipped", "trackingNumber": "PP-TRACK-0001" }`. Order statuses only move forward.

Order creation is one libSQL transaction: stock is decremented with a conditional update (`stock >= quantity`), then the order, items, status event, and cart clearing are written together. If any line is short, the whole transaction rolls back.

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

## Hero media

The landing hero scrubs `public/media/hero/hero.mp4` with scroll and shows `public/media/hero/poster.jpg` before the video is ready, on phones, and when reduced motion is preferred. Every audience theme points at the same pair through `HERO_MEDIA` in `app/config/themes.ts`, so replacing both files updates all themes without touching components.

Prepare a replacement with ffmpeg (1920x1080, 24 fps, no audio, every frame a keyframe so seeking stays smooth):

```bash
ffmpeg -i source.mp4 \
  -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=24" \
  -an -c:v libx264 -preset slow -crf 20 -g 1 -movflags +faststart \
  public/media/hero/hero.mp4

ffmpeg -i source.mp4 -frames:v 1 -q:v 3 public/media/hero/poster.jpg
```

## Themes

The active audience is stored in an `audience` cookie and exposed as `data-theme` on `<html>`. Every color, font, radius, shadow, and easing comes from the token blocks in `app/assets/css/themes.css`; components must not hardcode visual values. The same tokens are mapped onto Nuxt UI's `--ui-*` variables so modals, drawers, forms, and buttons follow the active theme.

## Notes

- Product images referenced by the seed (`/media/products/*.svg`) are placeholders added with the shop phase.
- The supplied hero poster and video are a temporary mock-up and must be replaced before launch.

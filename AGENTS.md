# AGENTS.md

Luxury fragrance storefront being built on the Nuxt UI starter template. `prompt.md` is the product spec (routes, data model, phase plan). The root-level rule files below are binding conventions, but they are plain docs — not `.opencode/skills` — so read them directly when the task touches their area.

## Current state
- Still the unmodified Nuxt UI starter: `app/app.vue` and `app/pages/index.vue` are template boilerplate, not product code.
- The spec stack is **not installed yet** (Pinia, Drizzle + better-sqlite3, nuxt-auth-utils, Zod, @nuxt/image, @vueuse/nuxt, GSAP, Lenis). `package.json` has only Nuxt 4, `@nuxt/ui`, and Tailwind v4.
- No `server/` or `shared/` directory exists yet.

## Commands
```bash
pnpm install    # postinstall runs `nuxt prepare`; required before lint/typecheck work
pnpm dev        # http://localhost:3000
pnpm lint       # eslint .
pnpm typecheck  # nuxt typecheck (vue-tsc)
pnpm build
pnpm preview
```
- CI (`.github/workflows/ci.yml`) runs lint, then typecheck, on Node 24 with pnpm 12.15.0 (`packageManager`). Match that order locally.
- Focused lint: `pnpm exec eslint app/pages/index.vue`. Typecheck has no per-file mode; it checks the whole project.
- There is no test runner configured. Do not claim test coverage or add a framework unprompted.

## Phase gate
`verify-phase.md` defines "done" for a build phase: lint → typecheck → production build, then load every touched page in the dev server, in all three themes (men/women/unisex) at mobile and desktop widths, with clean console/server logs and working reduced-motion. Report and stop before starting the next phase, per the workflow in `prompt.md`.

## Toolchain quirks
- `pnpm-workspace.yaml` sets `allowBuilds: false` for native deps. Adding `better-sqlite3` (planned) requires allowing its build script there, or the native binding will not compile.
- Tailwind is v4 CSS-first: tokens live in `app/assets/css/main.css` via `@theme`. There is no `tailwind.config.*`.
- `eslint.config.mjs` runs `eslint-plugin-better-tailwindcss` against `app/assets/css/main.css` and also lints Tailwind class strings inside Nuxt UI `:ui="{...}"` object values. Misspelled or unknown classes fail `pnpm lint`.
- Formatting comes from `@nuxt/eslint` stylistic rules (no Prettier config): no trailing commas, 1tbs braces, 2-space indent, LF line endings (`.editorconfig`).

## Nuxt UI
- Prefer Nuxt UI components (UModal, USlideover, UForm, UInput, USelect, UButton) over custom builds.
- Map theme tokens onto Nuxt UI's CSS variables (--ui-*) per [data-theme] so components follow the audience theme.
- Do not add Prettier; formatting comes from @nuxt/eslint.
- Read nuxt-conventions.md before touching pages, components, composables, or server routes.

## Conventions
- `theme-tokens.md`: every color, font, radius, shadow, and easing comes from `[data-theme="men|women|unisex"]` CSS variables; audience is stored in a cookie so SSR renders the correct theme without a flash.
- `a11y-checklist.md`: modals/drawers trap focus and restore it, icon-only controls need `aria-label`, WCAG AA contrast in all three themes.
- `ecommerce-server-rules.md`: Zod on every route, recompute prices and stock server-side, one synchronous better-sqlite3 transaction per order (no async callback), forward-only order statuses, every cart/order query scoped to the session user id.
- `gsap-scrolltrigger-nuxt.md`: GSAP and Lenis only in `.client` plugins, animations inside `gsap.context` with `ctx.revert()` on unmount, `gsap.matchMedia` for reduced motion.
- Placeholder rule from `prompt.md`: all marketing copy is lorem ipsum in one content config (e.g. `app/content/copy.ts`); buttons, nav, form labels, validation messages, and scent-family names stay real English.
- Spec style rule: no code comments unless the logic is genuinely non-obvious.

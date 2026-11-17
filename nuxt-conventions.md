---
name: nuxt-conventions
description: Use when writing or editing any Nuxt 4 code in this project, including pages, components, composables, plugins, middleware, or server routes.
---

## Layout
- Client code lives in app/, server code in server/, shared types and utils in shared/. Never put pages or components at the repo root.
- Rely on auto-imports for Vue, Nuxt composables, and components. Do not add manual imports for them.

## Data fetching
- Use useFetch or useAsyncData for page data so it renders on the server. Use $fetch only for user-triggered actions like button clicks and form submits.
- In Nuxt 4, data from useFetch is undefined until loaded, not null. Handle the pending and error states.
- Use a stable key for useAsyncData and pass reactive query params through the query option so it refetches on change.

## Server routes
- Files in server/api use method suffixes: index.get.ts, index.post.ts, [slug].get.ts.
- Use defineEventHandler, readValidatedBody and getValidatedQuery with Zod schemas. Throw createError with a statusCode for failures.
- Share Zod schemas and types through shared/.

## Client-only code
- Anything touching window, document, localStorage, GSAP, or Lenis goes in a .client.ts plugin or inside onMounted, or in <ClientOnly>.
- Avoid hydration mismatches: no random values or Date.now() in render.

## State
- Pinia stores in app/stores. Persist only the cart. Never store secrets or tokens in client state.

## Routing
- Protect routes with named route middleware in app/middleware and definePageMeta.
- Use useSeoMeta on every page.

## Nuxt UI `:ui` classes
- eslint-plugin-better-tailwindcss also lints Tailwind class strings inside Nuxt UI `:ui="{ ... }"` object values, not just the class attribute.
- Misspelled or unknown utilities in those values fail `pnpm lint`, so treat `:ui` classes with the same care as markup classes.
- Tailwind tokens resolve from app/assets/css/main.css; a class only validates if it maps to a real theme token or utility.
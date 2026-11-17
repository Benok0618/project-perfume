Build a luxury fragrance e-commerce web app with Nuxt 4 (Vue 3, TypeScript). Original design, do not copy any existing brand or site. Project name and site title: "project-perfume" (used for the header logo, browser tab title, meta tags, and package name; renamable from one config file).

PLACEHOLDER CONTENT RULE
- All display and marketing copy is lorem ipsum placeholder text: hero headlines and subtext, taglines, product names, product descriptions, section headings and paragraphs, footer text, quiz question text, quiz answer text, and quiz result explanations.
- Keep functional UI labels in real English: buttons (Add to bag, Checkout, Place order), nav links, form field labels, filter and sort names, validation and error messages, order status names, and scent family names (floral, woody, oriental/amber, fresh/citrus, gourmand, aromatic).
- Put all placeholder copy in one content config file (e.g. app/content/copy.ts) so it can be replaced later without touching components.
- Product names use short lorem-style names (e.g. "Lorem Ipsum No. 1").

Read AGENTS.md first. If skills exist in .opencode/skills, load the relevant ones before each phase.

STACK
- Nuxt 4 with its directory layout: client code in app/, server code in server/, shared types and utils in shared/
- Nitro server routes as the backend
- Nuxt UI (already installed) + Tailwind v4 (CSS-first, tokens in app/assets/css/main.css), @nuxt/image, @vueuse/nuxt
- Use Nuxt UI components (UModal, USlideover, UForm, UInput, USelect, UButton) for the product modal, cart drawer, forms, and filters. Layer GSAP animations on top.- GSAP + ScrollTrigger for animation, Lenis (package "lenis") for smooth scroll, both client-only
- Pinia for cart/UI state (cart persisted to localStorage)
- Drizzle ORM + SQLite (better-sqlite3); seed script with 12 products (4 men, 4 women, 4 unisex)
- nuxt-auth-utils for session auth (email + password using its hashPassword/verifyPassword)
- Zod for validation on every server route

DESIGN DIRECTION
- Default (Unisex) theme: dark, cinematic, editorial. Men and Women themes are defined in AUDIENCE THEMES.
- Design tokens as CSS variables from the start, with data-theme attribute support.
- Thin hairline borders, uppercase tracked micro-labels, generous spacing.
- Respect prefers-reduced-motion: disable scroll-scrubbing and heavy transitions.
- Fully responsive, mobile first.

AUDIENCE THEMES (Men / Women / Unisex)
Add an audience switcher that re-themes the whole site, not just the product filter.

Switcher
- Three options: Men, Women, Unisex. Placed in the header and at the top of /shop as a prominent segmented control.
- Selection persists (cookie so SSR renders the right theme with no flash, plus Pinia store). Default is Unisex.
- Syncs to URL (?audience=men|women|unisex) and filters products: Men shows men + unisex products, Women shows women + unisex, Unisex shows only unisex.
- Switching triggers an animated theme transition (about 600ms crossfade or circular reveal wipe from the switcher), no hard flash.

Implementation
- Theming via CSS variables on a data-theme attribute on <html>. Components consume tokens only, never hardcoded colors or fonts.
- Tokens per theme: background, surface, text, muted text, accent, accent hover, border, heading font, body font, border radius, button style, shadow style, image treatment, motion easing.
- Layout and components stay identical across themes. Only tokens, typography, imagery, and motion feel change.
- Product data has an audience field: "men" | "women" | "unisex".
- Each theme has its own hero media, background texture, and product imagery treatment, configured in one theme config file.

Men theme
- Deep charcoal/near-black base, steel and slate surfaces, accent in muted bronze or deep amber.
- Strong condensed or geometric sans-serif headings (e.g. Oswald or Barlow Condensed), tight tracking.
- Sharp corners (0-2px radius), thick hairlines, angular dividers.
- Motion is quick and decisive: snappy ease-out, short durations, slide and clip-path reveals.
- Imagery: darker, high contrast, smoky, leather or wood textures.

Women theme
- Soft ivory/blush or deep plum base, rose-gold or champagne accent.
- Elegant high-contrast serif headings (e.g. Cormorant Garamond or Playfair Display), airy letter-spacing, italic accents.
- Rounded corners (16-24px radius), soft shadows, delicate thin lines.
- Motion is slow and fluid: long easing curves, gentle fades, floating parallax.
- Imagery: soft light, florals, silk and petal textures.

Unisex theme
- Neutral midnight or stone base, muted gold or sage accent.
- Serif headings with clean sans body.
- Medium corner radius (6-8px), balanced shadows.
- Motion is smooth and moderate, in between the other two.
- Imagery: monochrome, minimal, abstract glass and light.

Rules
- Product modal, cart, checkout, orders, and quiz all inherit the active theme.
- Contrast must pass WCAG AA in all three themes.
- Respect prefers-reduced-motion in the theme transition.

PAGES / ROUTES
1. / (Home): scroll-driven hero. A pinned section where scroll progress scrubs a video or canvas image sequence (tied to ScrollTrigger), with a progress counter, headline text that fades/reveals per scroll stage (lorem ipsum), then featured products, a "Find your scent" CTA, and footer. Placeholder media in public/, paths configurable.
2. /shop: product list with grid, search, filters, sort, skeleton loaders.
3. /shop?product=slug: product quick-view modal. Also /product/[slug] for SEO rendering the same content.
4. /quiz: "What perfume is good for you" flow.
5. /cart: cart page (plus slide-in cart drawer from the header).
6. /checkout: protected, place order.
7. /orders and /orders/[id]: protected, order history and tracking.
8. /login and /register.

PRODUCT DATA
- Fields: id, slug, name, tagline, description, audience, price, sizes (30ml/50ml/100ml with prices), scentFamily (floral, woody, oriental/amber, fresh/citrus, gourmand, aromatic), topNotes, heartNotes, baseNotes, intensity (1-5), occasion tags (day, night, date, office, formal), season tags, images[], stock.
- name, tagline, and description are lorem ipsum in the seed data.

PRODUCT LIST + FILTERS
- Search: debounced text search across name, notes, description.
- Filters: audience, scent family (multi-select chips), price range slider, size, intensity, occasion. Filters and search sync to URL query params so links are shareable and back button works.
- Sort: featured, price asc/desc, newest.
- Animated grid: staggered reveal on load, smooth layout transition when filtering (TransitionGroup).
- Empty state when nothing matches.

PRODUCT MODAL
- Clicking a product card opens a modal (Teleport, focus trap, ESC to close, click-outside to close, body scroll lock).
- Animate open with a shared-element feel: image scales from the card position if feasible, otherwise fade/scale.
- Left: large preview image with thumbnail gallery that swaps the main image. Right: name, scent family badge, price, size selector, notes pyramid (top/heart/base), description, quantity stepper, "Add to bag" button.
- URL updates to ?product=slug when open, closing removes it, opening that URL directly opens the modal.
- Add to bag triggers a small animation and opens/updates the cart drawer.

CART
- Add, remove, change quantity, change size. Line totals, subtotal, shipping estimate, total.
- Persists across reloads. On login, merge guest cart into the user's server-side cart.
- Slide-in drawer + full /cart page.

AUTH
- Register, login, logout, session via nuxt-auth-utils.
- Route middleware protecting /checkout and /orders, with redirect back to the intended page after login.
- Basic rate limiting on auth endpoints, generic error messages, password rules.

CHECKOUT + ORDERS
- Checkout form: shipping address (name, phone, address lines, city, postal code), delivery method, payment method (mock only: Cash on Delivery and "Card (demo)"; no real payment integration, no card data stored).
- Server validates stock and recomputes all prices; never trust client totals.
- Placing an order creates order + order_items in a transaction, decrements stock, clears cart, generates a readable order number (e.g. PP-2026-000123).
- Order confirmation page.
- Order tracking: status timeline (Placed, Confirmed, Packed, Shipped, Out for delivery, Delivered) with timestamps, animated progress line, tracking number field. Include an admin-only endpoint or seed script to advance order status for demoing.
- Order history list with status badges.

"WHAT PERFUME IS GOOD FOR YOU" QUIZ
- Full-screen, one question per step, animated transitions, progress bar, back button, keyboard support.
- 7 questions, each answer maps to weighted scores on scent families and attributes: time of day, favorite season, personality/vibe, favorite place, occasion, intensity preference (subtle to bold), fragrances to avoid. Optional audience question first. Question and answer text is lorem ipsum, while the underlying scoring keys stay structured (e.g. each option has an id and weights).
- Scoring lives in a single typed config file (questions, options, weights).
- Result screen: top match as a hero card with match % and a lorem ipsum "why it matches" blurb, plus 2 runner-ups. Buttons: Add to bag, View details (opens product modal), Retake quiz.
- Save last result in localStorage, and to the user's profile if logged in.

ANIMATION REQUIREMENTS
- Lenis smooth scroll integrated with ScrollTrigger (single RAF loop via gsap.ticker).
- Hero scroll-scrub with a lightweight static-image fallback on low-power/mobile or reduced motion.
- Text reveals (split lines, masked slide-up), parallax on product imagery, magnetic/hover effect on primary buttons, page transitions between routes.
- Clean up all ScrollTriggers and tweens on unmount. No layout shift.
- Lazy load heavy media, preload hero poster.

PROJECT STRUCTURE (Nuxt 4)
- app/ (components/{ui,product,cart,quiz,layout}, composables/, pages/, layouts/, middleware/, plugins/, assets/, stores/, content/, app.vue, app.config.ts)
- server/ (api/, db/ with schema and seed, utils/)
- shared/ (types and utils used by both app and server)
- config files for site name, themes, copy, and quiz data
- Strict TypeScript. ESLint (@nuxt/eslint). No code comments unless logic is genuinely non-obvious.

QUALITY BAR
- Accessible: semantic HTML, focus states, aria labels, modal focus trap, color contrast.
- SEO: per-page useSeoMeta with title "project-perfume", OG tags, sitemap.
- Error and loading states on every async action.
- README with setup, env vars (including NUXT_SESSION_PASSWORD), seed, and run commands.

WORKFLOW
Before writing code, show me the planned folder structure and DB schema in a short summary and wait for my confirmation. Then build in phases and stop after each for review:
 Phase 1: project setup, design tokens (CSS variables with theme support), layout, DB schema, seed data
 Phase 2: shop page, search, filters, product modal
 Phase 2.5: audience theme system and switcher; verify every page in all three themes before continuing
 Phase 3: cart + auth
 Phase 4: checkout, orders, tracking
 Phase 5: quiz
 Phase 6: home page hero scroll animation, page transitions, polish
Run the dev server and fix type/lint errors before declaring each phase done.
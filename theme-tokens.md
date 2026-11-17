---
name: theme-tokens
description: Use when writing any styles, components, or layout so colors, fonts, radius, shadows, and motion come from audience theme tokens (men, women, unisex).
---

## Rules
- All visual values come from CSS variables defined per [data-theme="men|women|unisex"] on <html>. Never hardcode colors, fonts, radii, shadows, or easings in components.
- Map the variables into Tailwind's theme (colors, fontFamily, borderRadius, boxShadow) so utilities like bg-surface and text-muted work.
- Required tokens: bg, surface, text, muted, accent, accent-hover, border, font-heading, font-body, radius, shadow, ease, duration, image-filter.

## Theme switching
- Store the audience in a cookie read on the server so SSR renders the correct data-theme with no flash.
- Switching updates the cookie, the Pinia store, and the ?audience query param together.
- Animate the change with a crossfade or circular reveal of about 600ms. Skip it under reduced motion.

## Consistency
- Layout and components are identical across themes. Only tokens, typography, imagery, and motion differ.
- Check contrast (WCAG AA) for text, muted text, and accent on every theme background.
- When adding a component, view it in all three themes before finishing.

## Nuxt UI mapping
- Map each theme's tokens onto Nuxt UI's CSS variables (--ui-bg, --ui-text, --ui-text-muted, --ui-border, --ui-primary, --ui-radius) inside each [data-theme] block so UModal, USlideover, UForm, and other components follow the active audience theme.
- Check the installed Nuxt UI version's theming docs for the exact variable names before mapping.
- Tailwind v4: define tokens with @theme in app/assets/css/main.css. There is no tailwind.config.
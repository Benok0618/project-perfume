---
name: a11y-checklist
description: Use when building or reviewing modals, drawers, forms, buttons, navigation, the quiz, or any interactive element.
---

## Modals and drawers
- Teleport to body, set role="dialog" and aria-modal="true", and label with aria-labelledby.
- Trap focus, close on ESC, restore focus to the trigger on close, lock body scroll.

## Controls
- Use real buttons and links. Every icon-only control gets an aria-label.
- Visible focus style on every interactive element using the accent token.
- Filter chips and the audience switcher use aria-pressed or radio semantics.

## Forms
- Every input has a label, an error message tied with aria-describedby, and correct autocomplete and inputmode.

## Quiz and flows
- Support keyboard navigation (arrow keys and Enter), announce step changes with an aria-live region, and keep the progress bar labeled.

## Visual
- Text contrast of at least 4.5:1 in all three themes.
- All meaningful images have alt text. Decorative ones use empty alt.
- Respect prefers-reduced-motion everywhere.
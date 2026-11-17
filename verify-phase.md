---
name: verify-phase
description: Use at the end of every build phase, before telling the user the phase is done.
---

## Checklist
1. Run pnpm lint, then pnpm typecheck, then pnpm build. Fix every error. Do not suppress them.
2. Start the dev server and load every page touched in this phase.
3. Check each page in all three themes (men, women, unisex) and at mobile and desktop widths.
4. Check browser console and server logs for errors and hydration warnings.
5. Test the main flow of the phase end to end: filters and modal, cart, login redirect, checkout, order tracking, quiz.
6. Confirm animations clean up when navigating away and back, and that reduced motion disables them.

## Report
- Summarize what was built, what was verified, and anything unfinished, in a few lines.
- Stop and wait for approval before starting the next phase.
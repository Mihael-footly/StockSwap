# StockSwap Hero Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the supplied sunrise image as a responsive, readable hero background on the existing StockSwap swap screen.

**Architecture:** Keep the current React page and swap card intact. Add the image under `public/` and use CSS pseudo-elements on `.swap-page` for the full-bleed artwork, contrast gradient, and fade into the existing dark page background.

**Tech Stack:** Next.js App Router, React, native CSS, existing DM Sans/Manrope fonts.

---

### Task 1: Add the supplied hero asset

**Files:**
- Create: `public/stockswap-hero.png`

- [x] Copy the supplied panoramic image into `public/stockswap-hero.png` and verify it is a readable PNG.

### Task 2: Style the hero layer

**Files:**
- Modify: `app/globals.css` at the `.swap-page` rules and responsive media queries.

- [x] Add a viewport-width pseudo-element with the supplied image, a dark forest gradient, and a bottom fade into `--bg`.
- [x] Keep the hero layer behind all existing interactive content using `isolation` and stacking order.
- [x] Add a darker mobile crop and preserve the existing reduced-motion media query.

### Task 3: Verify and push

**Files:**
- Verify: `public/stockswap-hero.png`, `app/globals.css`

- [x] Run `npm test`.
- [x] Run `npm run typecheck`.
- [x] Run `npm run build`, restore generated `next-env.d.ts` if changed, and run `git diff --check`.
- [ ] Commit the hero asset and styles, then push `main` to GitHub.

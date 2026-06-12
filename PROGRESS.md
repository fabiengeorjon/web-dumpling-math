# 🥟 Dumpling Mathematics — Progress Log

A running record of what has been built and changed. Most recent at the top.

---

## Status: ✅ Functional, deployed on Vercel

- **Repo:** `fabiengeorjon/web-dumpling-math`
- **Working branch:** `claude/charming-rubin-dxtuc1` (also the repo's default branch)
- **Hosting:** Vercel (static site, no build step) — production deploys come from the
  default branch. Live `.vercel.app` URL serves the latest deployed commit.

---

## Changelog

### 2026-06-12 — Install prompt is now a one-time centered popup
- Replaced the fixed install bar/card entirely with a **centered modal popup** (reuses the
  app's modal system, so it floats above everything and never affects layout → no overlap).
- Shows **only once** (tracked via `localStorage` key `dumpling-math:install-shown`), 1.5s
  after launch, and only when on the main screen with no other modal open.
- Closable three ways: **Maybe later**, the **Install** button, or tapping the backdrop.

### 2026-06-12 — Install prompt moved to a bottom action bar (no overlap)
- Install prompt is now a **full-width bar pinned to the very bottom**, below the menu.
- Added `body.has-install` which applies bottom padding to the app shell, lifting the
  content and tab bar above the bar so **nothing is ever overlapped**.
- Bar layout: emoji + text + Install button + circular ✕, with safe-area padding.

### 2026-06-12 — Install prompt repositioned (vertical, right side) + dismiss fix
- Moved the "Install Dumpling Math" PWA prompt to a **vertical card pinned to the right
  edge**, vertically centered, so it no longer overlaps the top bar or the bottom tab bar.
- On narrow screens (≤620px) it docks to the **bottom-right corner** above the tab bar.
- The **✕ close button** is now a distinct circular target at the card's top-left corner
  with its own z-index, `stopPropagation`, and a remembered "dismissed" flag in
  `localStorage` (`dumpling-math:install-dismissed`) so it stays closed once dismissed.

### 2026-06-12 — Install banner overlap (first attempt)
- Moved the install banner from the bottom (overlapping the tab bar) to the top with a
  drop-in animation and a larger dismiss target. *(Superseded by the right-side card above.)*

### 2026-06-12 — Initial build of the full PWA
Complete offline-first "Dumpling Mathematics" app built from scratch:
- **Sibling profiles** persisted in `localStorage` (level, XP, coins, streaks, inventory).
- **Adaptive math engine** — addition, subtraction, multiplication, division, algebra;
  6 difficulty tiers that scale with answer streaks; answers keymapped to 1–4; animated
  step-by-step hint popups.
- **Dumpling house** — 25 collectibles across 5 rarities (Common → Mythic), bamboo-basket
  gacha reveals with celebratory animation; mythic glow shading.
- **Market** — snacks (eaten in the sandbox to grow dumplings) and toys (trampolines,
  fans, magnets, elastic balls).
- **Physics sandbox** — custom canvas 2D engine: gravity, walls, mass-weighted elastic
  circle-to-circle collisions, drag/fling with real momentum, jelly squish on impact,
  snack-seeking & eating, interactive toys.
- **Expressive faces** — blink, wink, sleep (Zzz), eat, surprise, silly.
- **Juice** — confetti, bubble streams, tap ripples, synthesized Web Audio SFX (no files).
- **PWA** — manifest, maskable SVG icons, offline-first service worker, install prompt.
- Fixed: answer-value parsing colliding with the keyboard-hint digit (now via `data-val`).

---

## File map

```
index.html              app shell, SVG gooey filter, install card
manifest.webmanifest    PWA manifest (SVG icons)
sw.js                   offline-first service worker (precache + runtime cache)
css/styles.css          design system + all component styles
icons/                  icon.svg, icon-maskable.svg
js/
  app.js                routing, screens, UI glue, PWA + install wiring
  store.js              localStorage persistence, profiles, economy
  data.js               dumplings, snacks, toys, skills, rarities
  math.js               adaptive question generator + hints
  dumpling.js           canvas face rendering + SVG thumbnails
  physics.js            custom 2D physics sandbox
  particles.js          confetti / bubbles / ripples
  sound.js              synthesized Web Audio SFX
```

## Notes / next ideas
- No `main` branch exists; the working branch is the repo default and Vercel's production
  branch. If a conventional `main` is desired, create it from this branch.
- All gameplay is client-side — zero API calls, fully playable offline.

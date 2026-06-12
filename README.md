# 🥟 Dumpling Mathematics

A warm, offline-first educational **Progressive Web App** — a children's math game with
sibling profiles, an adaptive math engine, a collectible dumpling house, a toys & snacks
market, and a squishy, physics-driven dumpling sandbox.

Everything runs **100% client-side** — zero API calls, fully playable offline.

## ✨ Features

- **Sibling profiles** — create/edit multiple players, each with their own level, XP,
  coins, streaks, unlocked dumplings and inventory (saved to `localStorage`).
- **Adaptive math engine** — Addition, Subtraction, Multiplication, Division and Algebra.
  Difficulty (6 tiers) scales up/down with the player's answer streak. Bouncy multiple-choice
  buttons keymapped to **1–4**, with an animated step-by-step hint helper.
- **Dumpling house** — 25 collectible dumplings across 5 rarities (Common → Mythic).
  Spend coins to "steam a bamboo basket" and reveal a random species, with a celebratory
  reveal animation. Mythic dumplings have a special glow.
- **Market** — buy **snacks** (eaten in the sandbox to grow dumplings) and **toys**
  (trampolines, fans, magnets, elastic balls) to drop into the playground.
- **Physics sandbox** — a custom canvas 2D engine: gravity, walls, elastic circle-to-circle
  collisions with mass & momentum, drag-and-fling with real velocity, jelly **squish** on
  impact, snack-seeking & eating, and interactive toys.
- **Expressive faces** — dumplings blink, wink, sleep (with Zzz), smile when fed, and look
  surprised when flung fast or silly when dragged.
- **Juice** — confetti on correct answers, bubble streams on level-up, tap ripples,
  and synthesized (file-free) sound effects via the Web Audio API.
- **Full PWA** — installable, with a service worker that precaches the whole bundle for
  instant offline loads.

## 🚀 Running

It's a static site — serve the folder with any static server:

```bash
# Python
python3 -m http.server 8080
# or Node
npx serve .
```

Then open `http://localhost:8080`. A service worker requires `http(s)` (or `localhost`) —
opening `index.html` via `file://` won't register the SW, but the game still plays.

## 📁 Structure

```
index.html              app shell + SVG gooey filter + install toast
manifest.webmanifest    PWA manifest
sw.js                   offline-first service worker
css/styles.css          full design system (warm pastel, Material-3-ish)
icons/                  SVG app icons (standard + maskable)
js/
  app.js                routing, screens, UI glue, PWA wiring
  store.js              localStorage persistence & profile/economy logic
  data.js               dumpling catalog, snacks, toys, skills, rarities
  math.js               adaptive question generator + hints
  dumpling.js           canvas face rendering + SVG thumbnails
  physics.js            custom 2D physics sandbox engine
  particles.js          confetti / bubbles / ripples
  sound.js              synthesized Web Audio sound effects
```

All gameplay logic, math, and graphics are computed on-device. No network required to play.

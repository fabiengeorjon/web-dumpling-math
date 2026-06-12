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

### 2026-06-12 — Press-to-squish "tickle" coin reward
- Pressing a dumpling now has an **18% chance** to drop a small coin reward (1–~7 by
  rarity) with a floating `+N 🪙` that drifts up and fades, a sparkle and a coin chime.
- Kept playful, not farmable: **650ms anti-spam cooldown** + **40-coin cap per sandbox
  visit** (resets each time you open the Sandbox). Physics passes the press coordinates to
  `onPoke`; `floatText` renders the rising number.
- Cache bumped to `v5`.

### 2026-06-12 — Persistent feeding, squishier design, press-to-squish sounds
- **Feeding now persists.** Eating in the sandbox stores the dumpling's exact size
  (`store.setDumplingSize`), spawns at the saved fractional size, and the save is flushed
  (`saveNow`) when leaving the Sandbox tab — growth survives navigation/closing.
- **Squishier dumpling art.** Rewrote the canvas body: plump, bottom-heavy silhouette with a
  scalloped/pleated crown, pleat creases, translucent bottom shading, soft rim shadow and a
  jelly sheen. Matching scalloped SVG thumbnail for the collection/Hall of Fame.
- **Press to squish + unique sound.** Pressing a dumpling squishes it and plays a distinct
  "boing" pitched per-dumpling (stable hash → pentatonic note) via `squishSound`; the
  physics `_down` handler triggers the squish + `onPoke` callback.
- Size model unified: `BASE_R × size`, cap 2.6, +0.16 per snack. Cache bumped to `v4`.

### 2026-06-12 — Hall of Fame + mastery-exclusive dumplings
- New **Hall of Fame** card on Home: total **👑 crowns / 30 levels** with a progress bar and
  a row of special-dumpling slots (earned thumbnails vs locked silhouettes with hints).
- Added **6 mastery-exclusive dumplings** (new "Master" rarity, gold): one per skill
  (Plus Paragon, Minus Maestro, Times Titan, Divide Diva, Algebra Ace) earned by mastering
  all 6 of that skill's levels, plus the rainbow **Grandmaster Glow** for 100% mastery.
- These are **never obtainable from baskets** (gacha excludes `exclusive` dumplings).
- Earning one triggers a dedicated gold reveal (chained if several), shown right after the
  results screen; the results banner teases "a special buddy unlocked".
- Collection shows them under a new **Master** filter with a 👑 locked state + mastery hint.
- Cache bumped to `v3`.

### 2026-06-12 — Best score per level + ★★★ Mastery badges
- Tracks **best score** and a **mastered** flag (perfect 8/8) per skill per level in
  `profile.levelStats` (`store.recordLevelResult` / `getLevelStat` / `masteredCount`).
- **Level Select** chips now show each level's best (`Best 6/8` / `New!`) and a gold
  **👑 ★★★** badge + crown corner once mastered.
- **Home** skill cards show a **👑 n/6** mastered tally.
- Acing a level the first time grants a **+30 🪙 mastery bonus**, a "Mastered!" results
  screen, and a double confetti + level-up celebration. New personal bests are called out too.

### 2026-06-12 — Replayable levels with reduced replay rewards
- Tapping a skill now opens a **Level Select** (Levels 1–6): the highest unlocked level is
  the **Challenge** (full coins/XP); already-beaten levels can be **replayed for less**
  (40% coins, 50% XP) so practice stays available without being the fastest way to earn.
- Clearing the challenge level with **≥6/8 correct** unlocks the next level (with a
  celebration + "Next Level →" button). Higher levels are locked until unlocked.
- Quiz header shows the level and a 🔁 Replay pill; the results screen shows unlock progress
  or a replay reminder. Difficulty is now an explicit per-level choice (replaces the old
  silent auto-adapt), via `generateQuestion(skill, profile, tierOverride)`.

### 2026-06-12 — Worldwide leaderboard + richer login
- **Login now collects first name, age, class, school** (in the create/edit player form).
- **New "Ranks" tab (🏆)** showing a global Top-100 leaderboard plus the player's own rank,
  ranked by **Brain Points** = `level×100 + correctAnswers×5 + bestStreak×2`.
- Public board shows **first name + class + school** (age stays private).
- Backend: `api/leaderboard.mjs` — a Vercel Serverless Function backed by **Vercel KV**
  (Upstash Redis) via REST, **zero npm deps**. Credentials are server-side only.
  - Needs env vars `KV_REST_API_URL` + `KV_REST_API_TOKEN` (auto-added when a KV store is
    connected to the Vercel project). Returns `503` until configured; UI degrades gracefully.
  - Data: `ZSET lb:scores` (member=playerId, score=points) + `HASH lb:meta` (JSON snapshot).
  - Server-side input validation/clamping on all fields.
- Scores are pushed best-effort on launch, after each quiz round, on profile create/edit,
  and when opening the Ranks tab — all wrapped in try/catch so **offline play is unaffected**.
- Service worker: `/api/*` is always network (never cached); cache bumped to `v2`.

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

/* ============================================================
   Custom 2D physics sandbox.
   - Gravity, bounded walls, circle-circle elastic collisions
   - Drag & fling with momentum, jelly squish on impact
   - Snacks (sought & eaten), toys (trampoline, fan, magnet, ball)
   ============================================================ */

import { drawDumpling } from './dumpling.js';

const BASE_R = 28;       // radius at size 1
const SIZE_CAP = 2.6;    // max growth
const GROW_STEP = 0.16;  // growth per snack eaten

export class Sandbox {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cb = callbacks; // { onEat(bodyDumplingId), onSound(name) }
    this.bodies = [];     // dumplings + balls + snacks
    this.toys = [];       // trampolines, fans, magnets
    this.dpr = 1;
    this.W = 0; this.H = 0;
    this.gravity = 1500;
    this.time = 0;
    this.running = false;

    this.dragged = null;
    this.pointer = { x: 0, y: 0, down: false };
    this.pointerHist = [];

    this.placeMode = null; // 'snack'|'toy' pending placement
    this.placePayload = null;

    this._bind();
    this.resize();
  }

  _bind() {
    const c = this.canvas;
    this._resizeHandler = () => this.resize();
    window.addEventListener('resize', this._resizeHandler);
    c.addEventListener('pointerdown', (e) => this._down(e));
    c.addEventListener('pointermove', (e) => this._move(e));
    window.addEventListener('pointerup', (e) => this._up(e));
    c.addEventListener('pointercancel', () => this._up());
  }

  destroy() {
    this.running = false;
    window.removeEventListener('resize', this._resizeHandler);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, rect.width * this.dpr);
    this.canvas.height = Math.max(1, rect.height * this.dpr);
    this.W = rect.width; this.H = rect.height;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  _localPoint(e) {
    const r = this.canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  /* ---------- Spawning ---------- */
  spawnDumpling(d, size = 1) {
    const s = Math.max(1, Math.min(SIZE_CAP, size || 1));
    const r = BASE_R * s;
    this.bodies.push({
      kind: 'dumpling',
      d, size: s,
      x: 30 + Math.random() * (this.W - 60),
      y: -r - Math.random() * 120,
      vx: (Math.random() - 0.5) * 120, vy: 0,
      r, mass: r * r,
      rest: 0.55,
      squishX: 1, squishY: 1, squishVX: 0, squishVY: 0,
      rot: 0,
      blink: 0, blinkTimer: 1 + Math.random() * 3, winkTimer: 4 + Math.random() * 6, wink: false,
      sleepTimer: 0, expr: d.mood || 'happy', exprTimer: 0,
      seekSnack: null,
    });
    this._ensureRun();
  }

  spawnBall() {
    const r = 24;
    this.bodies.push({
      kind: 'ball', x: this.W / 2, y: 60, vx: (Math.random() - 0.5) * 200, vy: 0,
      r, mass: r * r * 0.8, rest: 0.82, squishX: 1, squishY: 1, squishVX: 0, squishVY: 0, rot: 0,
    });
    this._ensureRun();
  }

  dropSnack(snack, x, y) {
    const r = 18;
    this.bodies.push({
      kind: 'snack', snack, emoji: snack.emoji,
      x: x ?? (30 + Math.random() * (this.W - 60)), y: y ?? 20,
      vx: 0, vy: 0, r, mass: r * r * 0.5, rest: 0.3,
      squishX: 1, squishY: 1, squishVX: 0, squishVY: 0, rot: 0, life: 0,
    });
    this._ensureRun();
  }

  placeToy(toy, x, y) {
    if (toy.id === 'ball') { this.spawnBall(); return; }
    const t = { id: toy.id, emoji: toy.emoji, x, y, t: 0 };
    if (toy.id === 'trampoline') { t.w = 90; t.h = 18; }
    if (toy.id === 'fan') { t.w = 70; t.h = 60; }
    if (toy.id === 'magnet') { t.radius = 130; }
    this.toys.push(t);
    this._ensureRun();
  }

  clear() { this.bodies = this.bodies.filter(b => b.kind === 'dumpling'); this.toys = []; }

  /* ---------- Pointer ---------- */
  _down(e) {
    const p = this._localPoint(e);
    this.pointer.x = p.x; this.pointer.y = p.y; this.pointer.down = true;

    // Placement mode (drop snack / place toy at tap)
    if (this.placeMode === 'snack') { this.dropSnack(this.placePayload, p.x, p.y); this._clearPlace(); return; }
    if (this.placeMode === 'toy') { this.placeToy(this.placePayload, p.x, p.y); this._clearPlace(); return; }

    // Grab nearest body
    let best = null, bestD = Infinity;
    for (const b of this.bodies) {
      const dx = b.x - p.x, dy = b.y - p.y, dist = Math.hypot(dx, dy);
      if (dist < b.r + 12 && dist < bestD) { best = b; bestD = dist; }
    }
    if (best) {
      this.dragged = best;
      best.grabbed = true;
      // squish on press + a poke reaction
      best.squishX = 1.32; best.squishY = 0.72; best.squishVX = 0; best.squishVY = 0;
      if (best.kind === 'dumpling') {
        best.expr = 'drag'; best.exprTimer = 0.5;
        if (this.cb.onPoke) this.cb.onPoke(best.d);
      } else if (this.cb.onSound) {
        this.cb.onSound('pop');
      }
      this.pointerHist = [{ x: p.x, y: p.y, t: performance.now() }];
    }
    this._ensureRun();
  }

  _move(e) {
    const p = this._localPoint(e);
    this.pointer.x = p.x; this.pointer.y = p.y;
    if (this.dragged) {
      this.pointerHist.push({ x: p.x, y: p.y, t: performance.now() });
      if (this.pointerHist.length > 6) this.pointerHist.shift();
    }
  }

  _up() {
    this.pointer.down = false;
    if (this.dragged) {
      const b = this.dragged;
      b.grabbed = false;
      // fling velocity from recent pointer history
      const hist = this.pointerHist;
      if (hist.length >= 2) {
        const a = hist[0], z = hist[hist.length - 1];
        const dt = Math.max(0.016, (z.t - a.t) / 1000);
        b.vx = (z.x - a.x) / dt;
        b.vy = (z.y - a.y) / dt;
        const sp = Math.hypot(b.vx, b.vy);
        if (b.kind === 'dumpling' && sp > 600) { b.expr = 'surprised'; b.exprTimer = 0.6; }
      }
      this.dragged = null;
    }
  }

  /* ---------- Placement helpers ---------- */
  beginPlace(mode, payload) { this.placeMode = mode; this.placePayload = payload; }
  _clearPlace() { this.placeMode = null; this.placePayload = null; if (this.cb.onPlaced) this.cb.onPlaced(); }

  /* ---------- Loop ---------- */
  _ensureRun() {
    if (this.running) return;
    this.running = true;
    this._last = performance.now();
    requestAnimationFrame((t) => this._frame(t));
  }

  _frame(now) {
    if (!this.running) return;
    let dt = (now - this._last) / 1000;
    this._last = now;
    dt = Math.min(dt, 0.033);
    this.time += dt;

    // a couple of substeps for stable collisions
    const steps = 2;
    for (let s = 0; s < steps; s++) this._step(dt / steps);

    this._render();

    // keep running while there is motion or interaction
    requestAnimationFrame((t) => this._frame(t));
  }

  _step(dt) {
    const bodies = this.bodies;

    // toy forces
    for (const toy of this.toys) {
      toy.t += dt;
      if (toy.id === 'fan') {
        for (const b of bodies) {
          if (b.x > toy.x - toy.w / 2 && b.x < toy.x + toy.w / 2 && b.y < toy.y && b.y > toy.y - 320) {
            b.vy -= 2600 * dt; // strong upward gust
            b.vx += Math.sin(toy.t * 8 + b.y * 0.05) * 120 * dt;
            if (b.kind === 'dumpling') { b.expr = 'surprised'; b.exprTimer = 0.2; }
          }
        }
      } else if (toy.id === 'magnet') {
        for (const b of bodies) {
          const dx = toy.x - b.x, dy = toy.y - b.y, dist = Math.hypot(dx, dy);
          if (dist < toy.radius && dist > 5) {
            const f = (1 - dist / toy.radius) * 1400;
            b.vx += (dx / dist) * f * dt;
            b.vy += (dy / dist) * f * dt;
          }
        }
      }
    }

    // integrate
    for (const b of bodies) {
      if (b === this.dragged) {
        // follow pointer; derive velocity for face reaction
        b.vx = (this.pointer.x - b.x) / Math.max(dt, 0.001);
        b.vy = (this.pointer.y - b.y) / Math.max(dt, 0.001);
        b.x = this.pointer.x; b.y = this.pointer.y;
      } else {
        b.vy += this.gravity * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        // air drag
        b.vx *= 0.995;
      }
      // squish spring relax
      this._relaxSquish(b, dt);
    }

    // snack seeking by dumplings
    this._seekSnacks(dt);

    // walls
    for (const b of bodies) this._walls(b);

    // pairwise collisions
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        this._collide(bodies[i], bodies[j]);
      }
    }

    // face animation timers
    for (const b of bodies) if (b.kind === 'dumpling') this._animFace(b, dt);

    // age snacks (gentle fade if untouched too long)
    for (let i = bodies.length - 1; i >= 0; i--) {
      const b = bodies[i];
      if (b.kind === 'snack') { b.life += dt; }
    }
  }

  _relaxSquish(b, dt) {
    // spring back toward 1,1
    const k = 220, damp = 14;
    b.squishVX += (-(b.squishX - 1) * k - b.squishVX * damp) * dt;
    b.squishVY += (-(b.squishY - 1) * k - b.squishVY * damp) * dt;
    b.squishX += b.squishVX * dt;
    b.squishY += b.squishVY * dt;
  }

  _applySquish(b, impact, nx, ny) {
    // compress along the impact normal
    const amt = Math.min(0.4, impact / 1400);
    if (Math.abs(ny) > Math.abs(nx)) { b.squishY = 1 - amt; b.squishX = 1 + amt * 0.7; }
    else { b.squishX = 1 - amt; b.squishY = 1 + amt * 0.7; }
  }

  _walls(b) {
    const e = b.rest;
    if (b.x - b.r < 0) { b.x = b.r; if (b.vx < 0) { this._applySquish(b, Math.abs(b.vx), 1, 0); b.vx = -b.vx * e; } }
    if (b.x + b.r > this.W) { b.x = this.W - b.r; if (b.vx > 0) { this._applySquish(b, Math.abs(b.vx), 1, 0); b.vx = -b.vx * e; } }
    if (b.y + b.r > this.H) {
      b.y = this.H - b.r;
      if (b.vy > 0) {
        this._applySquish(b, Math.abs(b.vy), 0, 1);
        if (Math.abs(b.vy) > 200 && this.cb.onSound) this.cb.onSound('bounce');
        b.vy = -b.vy * e;
      }
      b.vx *= 0.9; // floor friction
    }
    if (b.y - b.r < -200) { b.y = -200; b.vy = Math.max(b.vy, 0); }

    // trampolines (extra bounce)
    for (const toy of this.toys) {
      if (toy.id !== 'trampoline') continue;
      if (b.x > toy.x - toy.w / 2 && b.x < toy.x + toy.w / 2 &&
          b.y + b.r > toy.y - toy.h / 2 && b.y < toy.y && b.vy > 0) {
        b.y = toy.y - toy.h / 2 - b.r;
        b.vy = -Math.max(700, Math.abs(b.vy) * 1.35);
        this._applySquish(b, 1200, 0, 1);
        toy.squash = 1;
        if (this.cb.onSound) this.cb.onSound('boing');
        if (b.kind === 'dumpling') { b.expr = 'surprised'; b.exprTimer = 0.5; }
      }
    }
  }

  _collide(a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    let dist = Math.hypot(dx, dy);
    const minD = a.r + b.r;
    if (dist === 0) dist = 0.01;
    if (dist >= minD) return;

    // snack being eaten by a dumpling
    if ((a.kind === 'dumpling' && b.kind === 'snack') || (a.kind === 'snack' && b.kind === 'dumpling')) {
      const dump = a.kind === 'dumpling' ? a : b;
      const snk = a.kind === 'snack' ? a : b;
      this._eat(dump, snk);
      return;
    }

    const nx = dx / dist, ny = dy / dist;
    const overlap = minD - dist;

    // positional correction (split by inverse mass)
    const invA = a === this.dragged ? 0 : 1 / a.mass;
    const invB = b === this.dragged ? 0 : 1 / b.mass;
    const invSum = invA + invB || 1;
    a.x -= nx * overlap * (invA / invSum);
    a.y -= ny * overlap * (invA / invSum);
    b.x += nx * overlap * (invB / invSum);
    b.y += ny * overlap * (invB / invSum);

    // relative velocity along normal
    const rvx = b.vx - a.vx, rvy = b.vy - a.vy;
    const velN = rvx * nx + rvy * ny;
    if (velN > 0) return; // separating

    const e = Math.min(a.rest, b.rest);
    const jImp = -(1 + e) * velN / invSum;
    const ix = jImp * nx, iy = jImp * ny;
    a.vx -= ix * invA; a.vy -= iy * invA;
    b.vx += ix * invB; b.vy += iy * invB;

    const impact = Math.abs(velN);
    if (impact > 120) {
      this._applySquish(a, impact, nx, ny);
      this._applySquish(b, impact, nx, ny);
      if (impact > 320 && this.cb.onSound) this.cb.onSound('bump');
    }
  }

  _seekSnacks(dt) {
    const snacks = this.bodies.filter(b => b.kind === 'snack');
    if (!snacks.length) return;
    for (const b of this.bodies) {
      if (b.kind !== 'dumpling' || b === this.dragged) continue;
      // find nearest snack
      let near = null, nd = Infinity;
      for (const s of snacks) {
        const d = Math.hypot(s.x - b.x, s.y - b.y);
        if (d < nd) { nd = d; near = s; }
      }
      if (near && nd < 220) {
        const dx = near.x - b.x;
        b.vx += Math.sign(dx) * Math.min(Math.abs(dx), 60) * 6 * dt;
        b.expr = 'happy';
      }
    }
  }

  _eat(dump, snk) {
    const idx = this.bodies.indexOf(snk);
    if (idx === -1) return;
    this.bodies.splice(idx, 1);
    // grow (persisted exactly so it survives leaving the tab)
    dump.size = Math.min(SIZE_CAP, (dump.size || 1) + GROW_STEP);
    dump.r = BASE_R * dump.size; dump.mass = dump.r * dump.r;
    dump.expr = 'eat'; dump.exprTimer = 0.6;
    dump.squishX = 1.3; dump.squishY = 0.74; dump.squishVX = 0; dump.squishVY = 0;
    if (this.cb.onSound) this.cb.onSound('munch');
    if (this.cb.onEat) this.cb.onEat(dump.d.id, dump.size, { x: dump.x, y: dump.y });
  }

  _animFace(b, dt) {
    // blink
    b.blinkTimer -= dt;
    if (b.blinkTimer <= 0) { b.blink = 1; if (b.blinkTimer < -0.12) { b.blink = 0; b.blinkTimer = 2 + Math.random() * 4; } }
    // wink
    b.winkTimer -= dt;
    if (b.winkTimer <= 0) { b.wink = true; if (b.winkTimer < -0.3) { b.wink = false; b.winkTimer = 5 + Math.random() * 7; } }
    // expression timer
    if (b.exprTimer > 0) { b.exprTimer -= dt; if (b.exprTimer <= 0) b.expr = b.d.mood || 'happy'; }
    // sleepy if very still for a while
    const sp = Math.hypot(b.vx, b.vy);
    if (sp < 18 && b.exprTimer <= 0 && b !== this.dragged) {
      b.sleepTimer += dt;
      if (b.sleepTimer > 4) b.expr = 'sleepy';
    } else { b.sleepTimer = 0; if (b.expr === 'sleepy') b.expr = b.d.mood || 'happy'; }
    // fast = surprised
    if (sp > 650 && b.exprTimer <= 0) { b.expr = 'surprised'; }
  }

  /* ---------- Render ---------- */
  _render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);

    // floor shading
    const g = ctx.createLinearGradient(0, this.H - 60, 0, this.H);
    g.addColorStop(0, 'rgba(201,182,255,0)');
    g.addColorStop(1, 'rgba(201,182,255,0.25)');
    ctx.fillStyle = g;
    ctx.fillRect(0, this.H - 60, this.W, 60);

    // toys
    for (const toy of this.toys) this._drawToy(ctx, toy);

    // bodies
    for (const b of this.bodies) {
      if (b.kind === 'dumpling') {
        const speed = Math.hypot(b.vx, b.vy) / 100;
        drawDumpling(ctx, b.x, b.y, b.r, b.d, {
          squish: { sx: b.squishX, sy: b.squishY },
          expression: b.expr, blink: b.blink, wink: b.wink, speed, t: this.time,
        });
      } else if (b.kind === 'ball') {
        this._drawBall(ctx, b);
      } else if (b.kind === 'snack') {
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.scale(b.squishX, b.squishY);
        ctx.font = `${b.r * 2}px serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(b.emoji, 0, 2);
        ctx.restore();
      }
    }

    // placement ghost
    if (this.placeMode) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.font = '30px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(this.placePayload.emoji, this.pointer.x || this.W / 2, this.pointer.y || this.H / 2);
      ctx.restore();
    }
  }

  _drawBall(ctx, b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.scale(b.squishX, b.squishY);
    const g = ctx.createRadialGradient(-b.r * 0.3, -b.r * 0.3, b.r * 0.2, 0, 0, b.r);
    g.addColorStop(0, '#fff'); g.addColorStop(1, '#ff9e6e');
    ctx.beginPath(); ctx.arc(0, 0, b.r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  _drawToy(ctx, toy) {
    ctx.save();
    if (toy.id === 'trampoline') {
      const sq = toy.squash ? Math.min(1, toy.squash) : 0;
      toy.squash = Math.max(0, (toy.squash || 0) - 0.06);
      ctx.translate(toy.x, toy.y + sq * 6);
      ctx.fillStyle = '#a98bff';
      roundRect(ctx, -toy.w / 2, -toy.h / 2, toy.w, toy.h, 9); ctx.fill();
      ctx.fillStyle = '#7c5ce0';
      roundRect(ctx, -toy.w / 2, toy.h / 2 - 4, toy.w, 8, 4); ctx.fill();
    } else if (toy.id === 'fan') {
      ctx.translate(toy.x, toy.y);
      // gust
      ctx.globalAlpha = 0.18; ctx.fillStyle = '#5fb0f5';
      for (let i = 0; i < 3; i++) {
        const yy = -((toy.t * 160 + i * 90) % 300);
        ctx.beginPath(); ctx.ellipse((i - 1) * 16, yy, 10, 26, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.font = `${toy.w}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.save(); ctx.rotate(toy.t * 10); ctx.fillText('🌀', 0, 0); ctx.restore();
    } else if (toy.id === 'magnet') {
      ctx.translate(toy.x, toy.y);
      ctx.globalAlpha = 0.12 + Math.sin(toy.t * 4) * 0.05; ctx.fillStyle = '#ff6fa5';
      ctx.beginPath(); ctx.arc(0, 0, toy.radius, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.font = '38px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🧲', 0, 0);
    }
    ctx.restore();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

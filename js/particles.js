/* ============================================================
   Juice layer: confetti, bubble streams, ripple taps.
   Renders onto the full-screen #fx-layer canvas.
   ============================================================ */

let canvas, ctx, dpr = 1;
let particles = [];
let running = false;

export function initFx() {
  canvas = document.getElementById('fx-layer');
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
  // Global ripple on any tap
  window.addEventListener('pointerdown', (e) => ripple(e.clientX, e.clientY), { passive: true });
}

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function ensureLoop() {
  if (running) return;
  running = true;
  requestAnimationFrame(loop);
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update(dt);
    p.draw(ctx);
    if (p.dead) particles.splice(i, 1);
  }

  if (particles.length > 0) {
    requestAnimationFrame(loop);
  } else {
    running = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

const CONFETTI_COLORS = ['#ff6fa5', '#ffd23f', '#a98bff', '#4fd0a0', '#5fb0f5', '#ff9e6e'];

/* ---------- Confetti burst ---------- */
export function confetti(x, y, count = 80) {
  x = x ?? window.innerWidth / 2;
  y = y ?? window.innerHeight / 2;
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 200 + Math.random() * 480;
    particles.push(new Confetti(x, y, Math.cos(ang) * spd, Math.sin(ang) * spd - 220));
  }
  ensureLoop();
}

class Confetti {
  constructor(x, y, vx, vy) {
    this.x = x; this.y = y; this.vx = vx; this.vy = vy;
    this.life = 0; this.max = 1.4 + Math.random() * 0.8;
    this.size = 6 + Math.random() * 8;
    this.color = CONFETTI_COLORS[(Math.random() * CONFETTI_COLORS.length) | 0];
    this.rot = Math.random() * Math.PI; this.vr = (Math.random() - 0.5) * 12;
    this.dead = false; this.shape = Math.random() < 0.5 ? 'rect' : 'circle';
  }
  update(dt) {
    this.vy += 900 * dt;
    this.vx *= 0.99;
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.rot += this.vr * dt;
    this.life += dt;
    if (this.life > this.max || this.y > window.innerHeight + 40) this.dead = true;
  }
  draw(ctx) {
    const a = Math.max(0, 1 - this.life / this.max);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(this.x, this.y); ctx.rotate(this.rot);
    ctx.fillStyle = this.color;
    if (this.shape === 'rect') ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
    else { ctx.beginPath(); ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
}

/* ---------- Bubble stream (level up) ---------- */
export function bubbles(x, y, count = 26) {
  x = x ?? window.innerWidth / 2;
  y = y ?? window.innerHeight / 2;
  for (let i = 0; i < count; i++) {
    particles.push(new Bubble(x + (Math.random() - 0.5) * 120, y + Math.random() * 40));
  }
  ensureLoop();
}

class Bubble {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.vy = -(80 + Math.random() * 160);
    this.size = 10 + Math.random() * 26;
    this.life = 0; this.max = 2 + Math.random() * 1.5;
    this.sway = Math.random() * Math.PI * 2; this.dead = false;
    this.hue = ['#ffd9e3', '#c9b6ff', '#9ce8c9', '#a7d8ff'][(Math.random() * 4) | 0];
  }
  update(dt) {
    this.life += dt;
    this.sway += dt * 3;
    this.x += Math.sin(this.sway) * 26 * dt;
    this.y += this.vy * dt;
    if (this.life > this.max) this.dead = true;
  }
  draw(ctx) {
    const a = Math.max(0, 1 - this.life / this.max) * 0.8;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.hue; ctx.fill();
    ctx.globalAlpha = a * 0.9;
    ctx.beginPath(); ctx.arc(this.x - this.size * 0.3, this.y - this.size * 0.3, this.size * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill();
    ctx.restore();
  }
}

/* ---------- Tap ripple ---------- */
export function ripple(x, y) {
  particles.push(new Ripple(x, y));
  ensureLoop();
}

class Ripple {
  constructor(x, y) { this.x = x; this.y = y; this.life = 0; this.max = 0.5; this.dead = false; }
  update(dt) { this.life += dt; if (this.life > this.max) this.dead = true; }
  draw(ctx) {
    const p = this.life / this.max;
    ctx.save();
    ctx.globalAlpha = (1 - p) * 0.4;
    ctx.beginPath(); ctx.arc(this.x, this.y, 8 + p * 46, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff6fa5'; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }
}

/* ---------- Star pop (small reward at a point) ---------- */
export function starPop(x, y, n = 12) {
  for (let i = 0; i < n; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 80 + Math.random() * 160;
    particles.push(new Confetti(x, y, Math.cos(ang) * spd, Math.sin(ang) * spd - 60));
  }
  ensureLoop();
}

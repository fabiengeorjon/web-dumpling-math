/* ============================================================
   Tiny synthesized sound engine (WebAudio). No audio files —
   keeps the bundle fully offline & lightweight.
   ============================================================ */

let ctx = null;
let enabled = true;

function ac() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { enabled = false; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function setSoundEnabled(v) { enabled = v; }
export function isSoundEnabled() { return enabled; }

function tone(freq, dur, type = 'sine', gain = 0.12, slideTo = null) {
  if (!enabled) return;
  const a = ac(); if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, a.currentTime + dur);
  g.gain.setValueAtTime(gain, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  o.connect(g); g.connect(a.destination);
  o.start(); o.stop(a.currentTime + dur);
}

export const sfx = {
  tap() { tone(520, 0.08, 'sine', 0.05); },
  correct() {
    tone(660, 0.12, 'triangle', 0.12);
    setTimeout(() => tone(880, 0.16, 'triangle', 0.12), 90);
    setTimeout(() => tone(1180, 0.2, 'triangle', 0.1), 190);
  },
  wrong() { tone(220, 0.25, 'sawtooth', 0.08, 130); },
  levelUp() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.12), i * 110));
  },
  coin() { tone(987, 0.08, 'square', 0.07); setTimeout(() => tone(1318, 0.12, 'square', 0.06), 70); },
  reveal() {
    [392, 523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'sine', 0.1), i * 80));
  },
  munch() { tone(180, 0.1, 'sawtooth', 0.09, 90); },
  boing() { tone(300, 0.22, 'sine', 0.12, 720); },
  bounce() { tone(420, 0.06, 'sine', 0.04); },
  bump() { tone(160, 0.05, 'square', 0.03); },
  pop() { tone(700, 0.07, 'triangle', 0.08, 1100); },
};

/** Map physics engine sound names to sfx. */
export function physicsSound(name) {
  if (sfx[name]) sfx[name]();
}

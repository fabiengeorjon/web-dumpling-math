/* ============================================================
   Adaptive math question generator.
   Difficulty scales with the player's per-skill level, which is
   nudged up/down by answer streaks.
   ============================================================ */

const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Effective difficulty tier (1..6) for a skill given the profile. */
function tier(skillLevel) {
  return Math.max(1, Math.min(6, skillLevel));
}

/* Each generator returns { question, answer, operands, op, skill } */
const generators = {
  add(t) {
    const cap = [10, 20, 40, 80, 150, 300][t - 1];
    const a = rnd(1, cap), b = rnd(1, cap);
    return { a, b, op: '+', answer: a + b, text: `${a} + ${b}` };
  },
  sub(t) {
    const cap = [10, 20, 40, 80, 150, 300][t - 1];
    let a = rnd(1, cap), b = rnd(1, cap);
    if (b > a) [a, b] = [b, a];
    return { a, b, op: '−', answer: a - b, text: `${a} − ${b}` };
  },
  mul(t) {
    const cap = [5, 9, 12, 15, 20, 25][t - 1];
    const a = rnd(2, cap), b = rnd(2, cap);
    return { a, b, op: '×', answer: a * b, text: `${a} × ${b}` };
  },
  div(t) {
    const cap = [5, 9, 12, 15, 20, 25][t - 1];
    const b = rnd(2, cap), q = rnd(2, cap);
    const a = b * q;
    return { a, b, op: '÷', answer: q, text: `${a} ÷ ${b}` };
  },
  alg(t) {
    const cap = [10, 15, 25, 40, 70, 120][t - 1];
    const form = pick(['x_plus', 'x_minus', 'blank_sub', 'coef']);
    if (form === 'x_plus') {
      const x = rnd(1, cap), b = rnd(1, cap);
      return { answer: x, text: `x + ${b} = ${x + b}`, sub: 'Find x' };
    } else if (form === 'x_minus') {
      const x = rnd(1, cap), b = rnd(1, Math.min(x, cap));
      return { answer: x, text: `x − ${b} = ${x - b}`, sub: 'Find x' };
    } else if (form === 'blank_sub') {
      const a = rnd(cap, cap * 2), r = rnd(1, cap);
      return { answer: a - r, text: `${a} − ? = ${r}`, sub: 'Find ?' };
    } else {
      const c = rnd(2, Math.min(6, 2 + t)), x = rnd(1, Math.ceil(cap / c));
      return { answer: x, text: `${c}x = ${c * x}`, sub: 'Find x' };
    }
  },
};

/** Build 4 plausible options around the answer. */
function buildOptions(answer) {
  const opts = new Set([answer]);
  const spread = Math.max(2, Math.round(Math.abs(answer) * 0.25) + 1);
  let guard = 0;
  while (opts.size < 4 && guard++ < 50) {
    const delta = rnd(-spread, spread);
    if (delta === 0) continue;
    const cand = answer + delta;
    if (cand < 0) continue;
    opts.add(cand);
  }
  // Fallbacks if numbers collide (e.g. small answers)
  let bump = 1;
  while (opts.size < 4) { opts.add(answer + bump); bump++; }
  return shuffle([...opts]);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Generate a question for a given skill + profile. */
export function generateQuestion(skillId, profile) {
  const t = tier(profile.skillLevels[skillId] || 1);
  const g = generators[skillId](t);
  return {
    skill: skillId,
    tier: t,
    text: g.text,
    sub: g.sub || null,
    answer: g.answer,
    operands: { a: g.a, b: g.b, op: g.op },
    options: buildOptions(g.answer),
  };
}

/* ---------- Adaptive difficulty adjustment ---------- */
/** Adjust the per-skill level based on rolling correctness. */
export function adaptDifficulty(profile, skillId, correct, streak) {
  const cur = profile.skillLevels[skillId] || 1;
  if (correct && streak > 0 && streak % 3 === 0) {
    profile.skillLevels[skillId] = Math.min(6, cur + 1);
  } else if (!correct && cur > 1) {
    profile.skillLevels[skillId] = Math.max(1, cur - 1);
  }
  return profile.skillLevels[skillId];
}

/* ---------- Hint builder ---------- */
/** Returns a structured explanation for the hint modal. */
export function buildHint(q) {
  const { a, b, op } = q.operands;
  const visual = (n, emoji) => Array.from({ length: Math.min(n, 12) }, () => emoji);

  if (op === '+' && a != null) {
    return {
      title: 'Add them up! ➕',
      groups: [
        { items: visual(a, '⭐'), op: '+' },
        { items: visual(b, '🌟'), op: '=' },
      ],
      steps: [
        `Start with ${a} stars.`,
        `Add ${b} more stars.`,
        `Count them all → ${q.answer}! 🎉`,
      ],
      result: q.answer,
    };
  }
  if (op === '−' && a != null) {
    return {
      title: 'Take some away! ➖',
      groups: [{ items: visual(a, '🍬'), op: '−' }],
      steps: [
        `Begin with ${a} candies.`,
        `Give away ${b} candies.`,
        `${a} − ${b} = ${q.answer} left! 😋`,
      ],
      result: q.answer,
    };
  }
  if (op === '×' && a != null) {
    return {
      title: 'Groups of things! ✖️',
      groups: Array.from({ length: Math.min(a, 6) }, () => ({ items: visual(b, '🟣'), op: '' })),
      steps: [
        `Make ${a} groups.`,
        `Put ${b} in each group.`,
        `${a} × ${b} = ${q.answer} total! ✨`,
      ],
      result: q.answer,
    };
  }
  if (op === '÷' && a != null) {
    return {
      title: 'Share it equally! ➗',
      groups: [{ items: visual(a, '🍪'), op: '÷' }],
      steps: [
        `Take ${a} cookies.`,
        `Share into ${b} equal plates.`,
        `Each plate gets ${q.answer}! 🍽️`,
      ],
      result: q.answer,
    };
  }
  // Algebra / generic
  return {
    title: 'Balance the puzzle! ⭐',
    groups: [],
    steps: [
      `We need the mystery number.`,
      `Keep both sides equal.`,
      `The answer is ${q.answer}! 🧠`,
    ],
    result: q.answer,
  };
}

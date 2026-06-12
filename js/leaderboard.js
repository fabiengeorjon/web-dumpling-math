/* ============================================================
   Global leaderboard client.
   Talks to /api/leaderboard. All game features stay fully
   offline — every call here is best-effort and fails silently
   so the app keeps working without a network.
   ============================================================ */

const API = '/api/leaderboard';

/** Composite "Brain Points" — rewards practice, accuracy streaks & progress. */
export function brainPoints(p) {
  return (p.level || 1) * 100 + (p.totalCorrect || 0) * 5 + (p.bestStreak || 0) * 2;
}

/** Use only the first name for the public board. */
export function firstName(name) {
  return String(name || 'Player').trim().split(/\s+/)[0].slice(0, 24) || 'Player';
}

let lastSubmit = 0;

/** Push the active profile's score to the global board (best effort). */
export async function submitScore(p, { force = false } = {}) {
  if (!p) return false;
  const now = Date.now();
  if (!force && now - lastSubmit < 4000) return false; // light throttle
  lastSubmit = now;
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: p.id,
        name: firstName(p.name),
        age: p.age || '',
        klass: p.klass || '',
        school: p.school || '',
        level: p.level || 1,
        score: brainPoints(p),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Fetch the top players (+ the current player's own rank). */
export async function fetchTop(myId) {
  const url = myId ? `${API}?id=${encodeURIComponent(myId)}` : API;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const err = new Error('leaderboard_error');
    err.status = res.status;
    throw err;
  }
  return res.json();
}

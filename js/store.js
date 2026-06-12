/* ============================================================
   Persistence layer (localStorage). Tracks sibling profiles &
   the active profile. All game state lives client-side.
   ============================================================ */

import { STARTER_DUMPLING, SKILLS } from './data.js';

const KEY = 'dumpling-math:v1';

const DEFAULT_STATE = () => ({
  activeId: null,
  profiles: [],
});

function makeSkillLevels() {
  return Object.fromEntries(SKILLS.map(s => [s.id, 1]));
}

export function newProfile(name, avatar, color, meta = {}) {
  return {
    id: 'p_' + Math.random().toString(36).slice(2, 9),
    name: name || 'Player',
    avatar: avatar || '🥟',
    color: color || '#ffd9e3',
    // leaderboard identity
    age: meta.age || '',
    klass: meta.klass || '',
    school: meta.school || '',
    level: 1,
    xp: 0,
    coins: 50,
    streak: 0,
    bestStreak: 0,
    totalCorrect: 0,
    totalAnswered: 0,
    skillLevels: makeSkillLevels(),
    // per-level results: { [skillId]: { [tier]: { best, mastered } } }
    levelStats: {},
    // unlocked dumplings: { [id]: { size: 1 } }
    dumplings: { [STARTER_DUMPLING]: { size: 1 } },
    // owned snacks: { [id]: count }
    snacks: {},
    // owned toys: { [id]: count }
    toys: {},
    created: Date.now(),
  };
}

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE();
    const parsed = JSON.parse(raw);
    if (!parsed.profiles) return DEFAULT_STATE();
    return parsed;
  } catch {
    return DEFAULT_STATE();
  }
}

let saveTimer = null;
export function save() {
  // Debounced write to avoid hammering localStorage during physics ticks.
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }, 120);
}

export function saveNow() {
  clearTimeout(saveTimer);
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}

/* ---------- Profile management ---------- */
export const getProfiles = () => state.profiles;
export const getActive = () => state.profiles.find(p => p.id === state.activeId) || null;
export const setActive = (id) => { state.activeId = id; saveNow(); };

export function addProfile(name, avatar, color, meta = {}) {
  const p = newProfile(name, avatar, color, meta);
  state.profiles.push(p);
  state.activeId = p.id;
  saveNow();
  return p;
}

export function updateProfile(id, patch) {
  const p = state.profiles.find(x => x.id === id);
  if (p) Object.assign(p, patch);
  saveNow();
}

export function deleteProfile(id) {
  state.profiles = state.profiles.filter(p => p.id !== id);
  if (state.activeId === id) state.activeId = null;
  saveNow();
}

/* ---------- XP / level / coins ---------- */
export const xpForLevel = (lvl) => 50 + (lvl - 1) * 40;

/** Returns { leveledUp:boolean, newLevel } */
export function grantXp(p, amount) {
  p.xp += amount;
  let leveledUp = false;
  while (p.xp >= xpForLevel(p.level)) {
    p.xp -= xpForLevel(p.level);
    p.level += 1;
    leveledUp = true;
  }
  save();
  return { leveledUp, newLevel: p.level };
}

export function addCoins(p, amount) { p.coins = Math.max(0, p.coins + amount); save(); }
export function spendCoins(p, amount) {
  if (p.coins < amount) return false;
  p.coins -= amount; save(); return true;
}

/* ---------- Dumplings ---------- */
export function unlockDumpling(p, id) {
  if (!p.dumplings[id]) { p.dumplings[id] = { size: 1 }; save(); return true; }
  return false;
}
export function growDumpling(p, id, by = 0.06) {
  if (p.dumplings[id]) {
    p.dumplings[id].size = Math.min(2.2, (p.dumplings[id].size || 1) + by);
    save();
  }
}

/* ---------- Inventory ---------- */
export function addSnack(p, id, n = 1) { p.snacks[id] = (p.snacks[id] || 0) + n; save(); }
export function useSnack(p, id) {
  if ((p.snacks[id] || 0) > 0) { p.snacks[id]--; if (!p.snacks[id]) delete p.snacks[id]; save(); return true; }
  return false;
}
export function addToy(p, id, n = 1) { p.toys[id] = (p.toys[id] || 0) + n; save(); }

/* ---------- Per-level best scores & mastery ---------- */
export function getLevelStat(p, skillId, tier) {
  return (p.levelStats?.[skillId]?.[tier]) || { best: 0, mastered: false };
}

/** Record a finished round for a level. Returns { best, mastered, newBest, justMastered }. */
export function recordLevelResult(p, skillId, tier, correct, total) {
  if (!p.levelStats) p.levelStats = {};
  if (!p.levelStats[skillId]) p.levelStats[skillId] = {};
  const cur = p.levelStats[skillId][tier] || { best: 0, mastered: false };
  const newBest = correct > cur.best;
  const justMastered = correct >= total && !cur.mastered;
  cur.best = Math.max(cur.best, correct);
  if (correct >= total) cur.mastered = true;
  p.levelStats[skillId][tier] = cur;
  save();
  return { best: cur.best, mastered: cur.mastered, newBest, justMastered };
}

/** Count mastered levels for a skill (for the Home badge). */
export function masteredCount(p, skillId) {
  const s = p.levelStats?.[skillId];
  if (!s) return 0;
  return Object.values(s).filter(x => x.mastered).length;
}

export function recordAnswer(p, correct) {
  p.totalAnswered++;
  if (correct) {
    p.totalCorrect++;
    p.streak++;
    p.bestStreak = Math.max(p.bestStreak, p.streak);
  } else {
    p.streak = 0;
  }
  save();
}

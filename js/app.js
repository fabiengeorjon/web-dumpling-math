/* ============================================================
   Dumpling Mathematics — app shell, routing, screens & glue.
   ============================================================ */

import * as store from './store.js';
import {
  SKILLS, SKILL_BY_ID, DUMPLINGS, DUMPLING_BY_ID, RARITIES, RARITY_ORDER,
  SNACKS, TOYS, TOY_BY_ID, SNACK_BY_ID, AVATARS, AVATAR_COLORS, STEAM_COST,
} from './data.js';
import { generateQuestion, adaptDifficulty, buildHint } from './math.js';
import { dumplingSVG } from './dumpling.js';
import { Sandbox } from './physics.js';
import { initFx, confetti, bubbles, starPop } from './particles.js';
import { sfx, physicsSound } from './sound.js';

const app = document.getElementById('app');

/* ---------- tiny helpers ---------- */
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

let toastTimer;
function toast(msg) {
  let t = $('.toast');
  if (!t) { t = h(`<div class="toast"></div>`); document.body.appendChild(t); }
  t.textContent = msg;
  requestAnimationFrame(() => t.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}

let modalEl = null;
function openModal(node) {
  closeModal();
  const scrim = h(`<div class="modal-scrim"></div>`);
  scrim.appendChild(node);
  scrim.addEventListener('pointerdown', (e) => { if (e.target === scrim) closeModal(); });
  document.body.appendChild(scrim);
  modalEl = scrim;
  return scrim;
}
function closeModal() { if (modalEl) { modalEl.remove(); modalEl = null; } }

const coinDot = `<span class="coin"></span>`;

/* ---------- app state ---------- */
const view = { screen: 'lobby', tab: 'home', marketTab: 'snacks', rarityFilter: 'all' };
let sandbox = null;

function render() {
  // tear down sandbox if we navigate away
  if (sandbox && !(view.screen === 'main' && view.tab === 'sandbox')) {
    sandbox.destroy(); sandbox = null;
  }
  if (view.screen === 'lobby') return renderLobby();
  if (view.screen === 'quiz') return renderQuiz();
  return renderMain();
}

/* ============================================================
   LOBBY
   ============================================================ */
function renderLobby() {
  const profiles = store.getProfiles();
  app.innerHTML = '';
  const wrap = h(`
    <div class="lobby fade-enter">
      <div class="lobby-logo">
        <span class="big-bao">🥟</span>
        <h1>Dumpling Math</h1>
        <p>Pick your dumpling buddy to begin!</p>
      </div>
      <div class="profile-grid"></div>
    </div>`);
  const grid = $('.profile-grid', wrap);

  profiles.forEach(p => {
    const card = h(`
      <div class="profile-card">
        <div class="edit-dot">✏️</div>
        <div class="pc-face" style="background:${p.color}">${p.avatar}</div>
        <div class="pc-name">${escapeHtml(p.name)}</div>
        <div class="pc-sub">Level ${p.level} • ${Object.keys(p.dumplings).length}/${DUMPLINGS.length} 🥟</div>
        <div class="pc-streak">🔥 ${p.streak} streak</div>
      </div>`);
    $('.edit-dot', card).addEventListener('click', (e) => { e.stopPropagation(); profileForm(p); });
    card.addEventListener('click', () => { sfx.tap(); store.setActive(p.id); view.screen = 'main'; view.tab = 'home'; render(); });
    grid.appendChild(card);
  });

  const add = h(`<div class="profile-card add"><div class="plus">＋</div><div class="pc-name">New Player</div></div>`);
  add.addEventListener('click', () => { sfx.tap(); profileForm(null); });
  grid.appendChild(add);

  app.appendChild(wrap);
}

function profileForm(existing) {
  let avatar = existing?.avatar || AVATARS[0];
  let color = existing?.color || AVATAR_COLORS[0];
  const modal = h(`
    <div class="modal">
      <h3>${existing ? 'Edit Player' : 'New Player'}</h3>
      <div class="form-field">
        <label>Name</label>
        <input id="pf-name" maxlength="14" placeholder="e.g. Lucas" value="${existing ? escapeHtml(existing.name) : ''}" />
      </div>
      <div class="form-field">
        <label>Choose an avatar</label>
        <div class="avatar-picker">${AVATARS.map(a => `<button class="opt ${a === avatar ? 'sel' : ''}" data-a="${a}">${a}</button>`).join('')}</div>
      </div>
      <div class="form-field">
        <label>Favourite colour</label>
        <div class="color-picker">${AVATAR_COLORS.map(c => `<button class="opt ${c === color ? 'sel' : ''}" data-c="${c}" style="background:${c}"></button>`).join('')}</div>
      </div>
      <div class="modal-actions">
        ${existing ? `<button class="btn btn-ghost" id="pf-del">Delete</button>` : ''}
        <button class="btn btn-primary" id="pf-save">${existing ? 'Save' : 'Create 🎉'}</button>
      </div>
    </div>`);

  $$('.avatar-picker .opt', modal).forEach(b => b.addEventListener('click', () => {
    avatar = b.dataset.a; $$('.avatar-picker .opt', modal).forEach(x => x.classList.toggle('sel', x === b)); sfx.tap();
  }));
  $$('.color-picker .opt', modal).forEach(b => b.addEventListener('click', () => {
    color = b.dataset.c; $$('.color-picker .opt', modal).forEach(x => x.classList.toggle('sel', x === b)); sfx.tap();
  }));
  $('#pf-save', modal).addEventListener('click', () => {
    const name = $('#pf-name', modal).value.trim() || 'Player';
    if (existing) { store.updateProfile(existing.id, { name, avatar, color }); }
    else { store.addProfile(name, avatar, color); confetti(); }
    closeModal();
    if (existing) renderLobby(); else { view.screen = 'main'; view.tab = 'home'; render(); }
  });
  const del = $('#pf-del', modal);
  if (del) del.addEventListener('click', () => {
    if (confirm(`Delete ${existing.name}? This cannot be undone.`)) { store.deleteProfile(existing.id); closeModal(); renderLobby(); }
  });
  openModal(modal);
  setTimeout(() => $('#pf-name', modal)?.focus(), 100);
}

/* ============================================================
   MAIN SHELL (tabs)
   ============================================================ */
function renderMain() {
  const p = store.getActive();
  if (!p) { view.screen = 'lobby'; return renderLobby(); }

  app.innerHTML = '';
  app.appendChild(topbar(p));

  const screen = h(`<div class="screen fade-enter"></div>`);
  app.appendChild(screen);

  if (view.tab === 'home') renderHome(screen, p);
  else if (view.tab === 'collection') renderCollection(screen, p);
  else if (view.tab === 'market') renderMarket(screen, p);
  else if (view.tab === 'sandbox') renderSandbox(screen, p);

  app.appendChild(tabbar());
}

function topbar(p) {
  const bar = h(`
    <div class="topbar">
      <div class="avatar-chip" id="tb-profile">
        <div class="face" style="background:${p.color}">${p.avatar}</div>
        <div class="meta"><b>${escapeHtml(p.name)}</b><small>Level ${p.level} • 🔥 ${p.streak}</small></div>
      </div>
      <div class="spacer"></div>
      <div class="coin-pill">${coinDot}<span id="tb-coins">${p.coins}</span></div>
    </div>`);
  $('#tb-profile', bar).addEventListener('click', () => { sfx.tap(); view.screen = 'lobby'; render(); });
  return bar;
}

function tabbar() {
  const tabs = [
    { id: 'home', ic: '🏠', label: 'Play' },
    { id: 'collection', ic: '🥟', label: 'House' },
    { id: 'market', ic: '🛒', label: 'Market' },
    { id: 'sandbox', ic: '🪀', label: 'Sandbox' },
  ];
  const bar = h(`<div class="tabbar"></div>`);
  tabs.forEach(t => {
    const b = h(`<button class="tab-btn ${view.tab === t.id ? 'active' : ''}"><span class="ti">${t.ic}</span><span>${t.label}</span></button>`);
    b.addEventListener('click', () => { if (view.tab !== t.id) { sfx.tap(); view.tab = t.id; render(); } });
    bar.appendChild(b);
  });
  return bar;
}

/* ============================================================
   HOME / DASHBOARD
   ============================================================ */
function renderHome(screen, p) {
  const need = store.xpForLevel(p.level);
  const pct = Math.min(100, (p.xp / need) * 100);
  const acc = p.totalAnswered ? Math.round((p.totalCorrect / p.totalAnswered) * 100) : 0;

  const body = h(`<div class="scroll-area"></div>`);
  body.appendChild(h(`
    <div class="hero-card">
      <div class="lvl-row">
        <div class="lvl-badge"><small>LVL</small><b>${p.level}</b></div>
        <div style="flex:1">
          <h3>Hi, ${escapeHtml(p.name)}! 👋</h3>
          <div class="xp-track"><div class="xp-fill" style="width:${pct}%"></div></div>
          <small style="color:var(--c-ink-soft);font-weight:700">${p.xp} / ${need} XP to next level</small>
        </div>
      </div>
      <div class="stat-row">
        <div class="stat-chip"><b>🔥 ${p.streak}</b><small>Streak</small></div>
        <div class="stat-chip"><b>${acc}%</b><small>Accuracy</small></div>
        <div class="stat-chip"><b>${Object.keys(p.dumplings).length}</b><small>Dumplings</small></div>
      </div>
    </div>`));

  body.appendChild(h(`<div class="section-title">Choose a challenge ✨</div>`));
  const grid = h(`<div class="skill-grid"></div>`);
  const cls = { add: 'add', sub: 'sub', mul: 'mul', div: 'div', alg: 'alg' };
  SKILLS.forEach(s => {
    const lvl = p.skillLevels[s.id] || 1;
    const card = h(`
      <div class="skill-card ${cls[s.id]}">
        <div class="sk-emoji">${s.emoji}</div>
        <div>
          <div class="sk-name">${s.name}</div>
          <div class="sk-lvl">Difficulty ${'★'.repeat(lvl)}${'☆'.repeat(6 - lvl)}</div>
        </div>
      </div>`);
    card.addEventListener('click', () => { sfx.tap(); startQuiz(s.id); });
    grid.appendChild(card);
  });
  body.appendChild(grid);
  screen.appendChild(body);
}

/* ============================================================
   QUIZ
   ============================================================ */
const QUIZ_LEN = 8;
let quiz = null;

function startQuiz(skillId) {
  quiz = { skillId, index: 0, correctCount: 0, coinsEarned: 0, current: null, answered: false };
  view.screen = 'quiz';
  render();
}

function renderQuiz() {
  const p = store.getActive();
  if (!quiz.current) quiz.current = generateQuestion(quiz.skillId, p);
  const q = quiz.current;
  const skill = SKILL_BY_ID[quiz.skillId];
  const progPct = (quiz.index / QUIZ_LEN) * 100;

  app.innerHTML = '';
  const node = h(`
    <div class="quiz fade-enter">
      <div class="quiz-top">
        <button class="btn btn-ghost btn-tiny" id="q-quit">✕</button>
        <div class="q-progress"><span style="width:${progPct}%"></span></div>
        <div class="streak-flame">🔥 ${p.streak}</div>
      </div>
      <div class="q-card">
        <div class="q-skill-tag">${skill.emoji} ${q.sub || skill.name}</div>
        <div class="q-text">${q.text}${q.sub ? '' : ' = ?'}</div>
        <div class="q-visual"></div>
      </div>
      <div class="answers"></div>
      <div class="quiz-foot">
        <button class="btn btn-lilac btn-block" id="q-hint">💡 Show me how</button>
      </div>
    </div>`);

  // little visual sprinkle for low-tier add/sub
  const vis = $('.q-visual', node);
  if (!q.sub && q.operands.a != null && q.operands.a <= 10 && q.operands.b <= 10 && (q.operands.op === '+' || q.operands.op === '−')) {
    const emoji = q.operands.op === '+' ? '⭐' : '🍬';
    let html = '';
    for (let i = 0; i < q.operands.a; i++) html += `<span style="animation-delay:${i * 0.04}s">${emoji}</span>`;
    if (q.operands.op === '+') { html += `<span class="hint-op">+</span>`; for (let i = 0; i < q.operands.b; i++) html += `<span style="animation-delay:${(q.operands.a + i) * 0.04}s">🌟</span>`; }
    vis.innerHTML = html;
  }

  const ans = $('.answers', node);
  q.options.forEach((opt, i) => {
    const b = h(`<button class="ans-btn" data-val="${opt}"><span class="key-hint">${i + 1}</span>${opt}</button>`);
    b.addEventListener('click', () => answer(b, opt, node));
    ans.appendChild(b);
  });

  $('#q-quit', node).addEventListener('click', () => { sfx.tap(); quiz = null; view.screen = 'main'; render(); });
  $('#q-hint', node).addEventListener('click', () => { sfx.tap(); showHint(q); });

  app.appendChild(node);

  // keyboard 1-4
  document.onkeydown = (e) => {
    if (view.screen !== 'quiz' || quiz.answered) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 4) { const btns = $$('.ans-btn', node); if (btns[n - 1]) btns[n - 1].click(); }
  };
}

function answer(btn, value, node) {
  if (quiz.answered) return;
  quiz.answered = true;
  const p = store.getActive();
  const q = quiz.current;
  const correct = value === q.answer;

  store.recordAnswer(p, correct);
  const newSkillLvl = adaptDifficulty(p, quiz.skillId, correct, p.streak);

  $$('.ans-btn', node).forEach(b => {
    const v = parseInt(b.dataset.val, 10);
    if (v === q.answer) b.classList.add('correct');
    else if (b === btn) b.classList.add('wrong');
    else b.classList.add('dimmed');
    b.style.pointerEvents = 'none';
  });

  if (correct) {
    quiz.correctCount++;
    const reward = 6 + q.tier * 2 + Math.min(p.streak, 10);
    quiz.coinsEarned += reward;
    store.addCoins(p, reward);
    const res = store.grantXp(p, 8 + q.tier * 3);
    sfx.correct();
    const rect = btn.getBoundingClientRect();
    confetti(rect.left + rect.width / 2, rect.top + rect.height / 2, 60);
    if (res.leveledUp) { setTimeout(() => levelUpCelebration(p), 500); }
    updateCoinsUI(p);
  } else {
    sfx.wrong();
    if ('vibrate' in navigator) navigator.vibrate(120);
  }

  setTimeout(() => nextQuestion(), correct ? 900 : 1400);
}

function nextQuestion() {
  quiz.index++;
  quiz.answered = false;
  quiz.current = null;
  if (quiz.index >= QUIZ_LEN) return finishQuiz();
  renderQuiz();
}

function finishQuiz() {
  const p = store.getActive();
  const stars = Math.round((quiz.correctCount / QUIZ_LEN) * 3);
  const modal = h(`
    <div class="modal" style="text-align:center">
      <div style="font-size:60px">${quiz.correctCount >= QUIZ_LEN * 0.7 ? '🏆' : '🌱'}</div>
      <h3>Round Complete!</h3>
      <div style="font-size:30px;margin:8px 0">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
      <p style="font-weight:700;color:var(--c-ink-soft)">You got <b style="color:var(--c-mint-deep)">${quiz.correctCount}/${QUIZ_LEN}</b> correct!</p>
      <div class="price-tag" style="margin:6px auto 0">${coinDot} +${quiz.coinsEarned} coins</div>
      <div class="modal-actions">
        <button class="btn btn-ghost" id="fq-home">Home</button>
        <button class="btn btn-primary" id="fq-again">Play Again</button>
      </div>
    </div>`);
  $('#fq-home', modal).addEventListener('click', () => { sfx.tap(); closeModal(); quiz = null; view.screen = 'main'; render(); });
  $('#fq-again', modal).addEventListener('click', () => { sfx.tap(); const sk = quiz.skillId; closeModal(); startQuiz(sk); });
  openModal(modal);
  if (quiz.correctCount >= QUIZ_LEN * 0.7) confetti();
}

function levelUpCelebration(p) {
  bubbles();
  sfx.levelUp();
  toast(`🎉 Level Up! You're now level ${p.level}!`);
}

function showHint(q) {
  const hint = buildHint(q);
  const groupsHtml = hint.groups.map(g => `
    <div class="hint-group">${g.items.map((it, i) => `<span style="animation-delay:${i * 0.05}s">${it}</span>`).join('')}</div>
    ${g.op ? `<span class="hint-op">${g.op}</span>` : ''}`).join('');
  const modal = h(`
    <div class="modal">
      <h3>${hint.title}</h3>
      ${hint.groups.length ? `<div class="hint-visual">${groupsHtml}<span class="hint-op">=</span><div class="hint-group"><span style="font-family:var(--font-display);font-size:1.6rem;color:var(--c-mint-deep)">${hint.result}</span></div></div>` : ''}
      ${hint.steps.map((s, i) => `<div class="hint-step">${i + 1}. ${s}</div>`).join('')}
      <div class="modal-actions"><button class="btn btn-primary" id="hint-ok">Got it! 👍</button></div>
    </div>`);
  $('#hint-ok', modal).addEventListener('click', () => { sfx.tap(); closeModal(); });
  openModal(modal);
}

/* ============================================================
   COLLECTION / DUMPLING HOUSE
   ============================================================ */
function renderCollection(screen, p) {
  const owned = Object.keys(p.dumplings).length;
  const body = h(`<div class="scroll-area"></div>`);

  body.appendChild(h(`
    <div class="steam-card">
      <div class="basket">🧺</div>
      <div class="meta">
        <b>Steam a Basket!</b>
        <small>Reveal a random dumpling · ${owned}/${DUMPLINGS.length} collected</small>
      </div>
      <button class="btn btn-primary" id="steam-btn" ${p.coins < STEAM_COST ? 'disabled' : ''}>
        ${coinDot} ${STEAM_COST}
      </button>
    </div>`));
  $('#steam-btn', body).addEventListener('click', () => steamBasket(p));

  // rarity filter
  const filterBar = h(`<div class="rarity-bar"></div>`);
  const filters = ['all', ...RARITY_ORDER];
  filters.forEach(f => {
    const active = view.rarityFilter === f;
    const color = f === 'all' ? 'var(--c-pink-deep)' : RARITIES[f].color;
    const chip = h(`<button class="rarity-chip ${active ? 'active' : ''}" style="${active ? `background:${color}` : ''}">${f === 'all' ? 'All' : RARITIES[f].name}</button>`);
    chip.addEventListener('click', () => { sfx.tap(); view.rarityFilter = f; renderMain(); });
    filterBar.appendChild(chip);
  });
  body.appendChild(filterBar);

  const grid = h(`<div class="dump-grid"></div>`);
  const list = DUMPLINGS.filter(d => view.rarityFilter === 'all' || d.rarity === view.rarityFilter);
  list.forEach(d => {
    const owned = p.dumplings[d.id];
    const r = RARITIES[d.rarity];
    if (owned) {
      const cell = h(`
        <div class="dump-cell ${d.glow ? 'mythic-glow' : ''}">
          <span class="rarity-dot" style="background:${r.color}"></span>
          <div class="dump-thumb">${dumplingSVG(d, 70)}</div>
          <div class="dump-name">${d.name}</div>
        </div>`);
      cell.addEventListener('click', () => { sfx.tap(); dumplingDetail(d, owned); });
      grid.appendChild(cell);
    } else {
      const cell = h(`<div class="dump-cell locked"><span class="lock-ic">🔒</span><span class="rarity-dot" style="background:${r.color}"></span></div>`);
      cell.addEventListener('click', () => { sfx.tap(); toast(`${r.name} dumpling — steam a basket to unlock!`); });
      grid.appendChild(cell);
    }
  });
  body.appendChild(grid);
  screen.appendChild(body);
}

function dumplingDetail(d, owned) {
  const r = RARITIES[d.rarity];
  const modal = h(`
    <div class="modal" style="text-align:center">
      <div class="reveal-rarity" style="color:${r.color}">${r.name}</div>
      <div style="width:140px;margin:6px auto">${dumplingSVG(d, 140)}</div>
      <h3>${d.name}</h3>
      <p style="font-weight:700;color:var(--c-ink-soft)">Size level: ${(owned.size || 1).toFixed(2)} · feed snacks in the sandbox to grow! 🍪</p>
      <div class="modal-actions"><button class="btn btn-primary" id="dd-ok">Close</button></div>
    </div>`);
  $('#dd-ok', modal).addEventListener('click', () => { sfx.tap(); closeModal(); });
  openModal(modal);
}

function weightedRandomDumpling(p) {
  // bias toward unowned; fall back to any
  const unowned = DUMPLINGS.filter(d => !p.dumplings[d.id]);
  const pool = unowned.length ? unowned : DUMPLINGS;
  const total = pool.reduce((s, d) => s + RARITIES[d.rarity].weight, 0);
  let roll = Math.random() * total;
  for (const d of pool) { roll -= RARITIES[d.rarity].weight; if (roll <= 0) return d; }
  return pool[0];
}

function steamBasket(p) {
  if (!store.spendCoins(p, STEAM_COST)) { toast('Not enough coins! Play math to earn more 🪙'); return; }
  sfx.coin();
  const d = weightedRandomDumpling(p);
  const isNew = !p.dumplings[d.id];
  if (isNew) store.unlockDumpling(p, d.id); else store.addCoins(p, RARITIES[d.rarity].value);
  const r = RARITIES[d.rarity];

  const modal = h(`
    <div class="modal">
      <div class="reveal-stage">
        <div style="font-size:50px">🧺💨</div>
      </div>
    </div>`);
  openModal(modal);

  setTimeout(() => {
    sfx.reveal();
    if (d.rarity === 'epic' || d.rarity === 'mythic') confetti(); else starPop(window.innerWidth / 2, window.innerHeight / 2, 20);
    $('.modal', modalEl).innerHTML = `
      <div class="reveal-stage">
        <div class="reveal-dump">${dumplingSVG(d, 150)}</div>
        <div class="reveal-rarity" style="color:${r.color}">${r.name}</div>
        <div class="reveal-name">${d.name}</div>
        <p style="font-weight:700;color:var(--c-ink-soft);margin-top:6px">${isNew ? '✨ New dumpling unlocked!' : `Duplicate — +${r.value} coins!`}</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" id="rv-close">Done</button>
          <button class="btn btn-primary" id="rv-again" ${p.coins < STEAM_COST ? 'disabled' : ''}>${coinDot} Again (${STEAM_COST})</button>
        </div>
      </div>`;
    $('#rv-close', modalEl).addEventListener('click', () => { sfx.tap(); closeModal(); renderMain(); });
    $('#rv-again', modalEl).addEventListener('click', () => { sfx.tap(); closeModal(); steamBasket(p); });
    updateCoinsUI(p);
  }, 850);
}

/* ============================================================
   MARKET
   ============================================================ */
function renderMarket(screen, p) {
  const body = h(`<div class="scroll-area"></div>`);
  const tabs = h(`
    <div class="market-tabs">
      <button class="mt ${view.marketTab === 'snacks' ? 'active' : ''}" data-t="snacks">🍪 Snacks</button>
      <button class="mt ${view.marketTab === 'toys' ? 'active' : ''}" data-t="toys">🪀 Toys</button>
    </div>`);
  $$('.mt', tabs).forEach(b => b.addEventListener('click', () => { sfx.tap(); view.marketTab = b.dataset.t; renderMain(); }));
  body.appendChild(tabs);

  const grid = h(`<div class="shop-grid"></div>`);
  const items = view.marketTab === 'snacks' ? SNACKS : TOYS;
  items.forEach(it => {
    const ownedCount = view.marketTab === 'snacks' ? (p.snacks[it.id] || 0) : (p.toys[it.id] || 0);
    const card = h(`
      <div class="shop-card">
        ${ownedCount ? `<span class="owned-badge">×${ownedCount}</span>` : ''}
        <div class="si">${it.emoji}</div>
        <div class="sn">${it.name}</div>
        <div class="sd">${it.desc}</div>
        <button class="price-tag">${coinDot} ${it.price}</button>
      </div>`);
    $('.price-tag', card).addEventListener('click', () => buyItem(p, it));
    grid.appendChild(card);
  });
  body.appendChild(grid);
  body.appendChild(h(`<p class="empty-note">Buy snacks & toys, then head to the <b>Sandbox</b> to play with your dumplings! 🪀</p>`));
  screen.appendChild(body);
}

function buyItem(p, it) {
  if (!store.spendCoins(p, it.price)) { toast('Not enough coins! 🪙'); sfx.wrong(); return; }
  sfx.coin();
  if (view.marketTab === 'snacks') store.addSnack(p, it.id); else store.addToy(p, it.id);
  toast(`${it.emoji} ${it.name} purchased!`);
  starPop(window.innerWidth / 2, window.innerHeight / 2, 10);
  renderMain();
}

/* ============================================================
   SANDBOX
   ============================================================ */
function renderSandbox(screen, p) {
  const wrap = h(`
    <div class="sandbox-screen">
      <div class="sandbox-wrap">
        <canvas id="sandbox-canvas"></canvas>
        <div class="sandbox-hint" id="sb-hint">Drag & fling your dumplings! 🥟</div>
      </div>
      <div class="sandbox-toolbar"></div>
    </div>`);
  screen.appendChild(wrap);

  const canvas = $('#sandbox-canvas', wrap);
  // wait a frame so layout gives canvas size
  requestAnimationFrame(() => {
    sandbox = new Sandbox(canvas, {
      onSound: (n) => physicsSound(n),
      onEat: (id, pos) => {
        store.growDumpling(p, id, 0.05);
        starPop((window.innerWidth / 2), pos ? pos.y : window.innerHeight / 2, 8);
      },
      onPlaced: () => refreshTools(),
    });
    // spawn owned dumplings
    Object.entries(p.dumplings).forEach(([id, info], i) => {
      const d = DUMPLING_BY_ID[id];
      if (d) setTimeout(() => sandbox.spawnDumpling(d, Math.round(info.size || 1)), i * 160);
    });
    hideHintSoon();
  });

  const toolbar = $('.sandbox-toolbar', wrap);
  refreshTools = () => buildTools(toolbar, p);
  buildTools(toolbar, p);
}

let refreshTools = () => {};

function buildTools(toolbar, p) {
  toolbar.innerHTML = '';
  // shake / reset
  const reset = h(`<button class="tool-btn"><span class="tic">🔄</span>Reset</button>`);
  reset.addEventListener('click', () => { sfx.tap(); if (sandbox) { sandbox.clear(); respawn(p); } });
  toolbar.appendChild(reset);

  // shake
  const shake = h(`<button class="tool-btn"><span class="tic">🌪️</span>Shake</button>`);
  shake.addEventListener('click', () => { sfx.boing(); if (sandbox) sandbox.bodies.forEach(b => { b.vy = -700 - Math.random() * 400; b.vx = (Math.random() - 0.5) * 800; }); });
  toolbar.appendChild(shake);

  // snacks owned
  Object.entries(p.snacks).forEach(([id, count]) => {
    const s = SNACK_BY_ID[id]; if (!s || count <= 0) return;
    const b = h(`<button class="tool-btn"><span class="tic">${s.emoji}</span>${s.name} ×${count}</button>`);
    b.addEventListener('click', () => {
      if (store.useSnack(p, id)) { sfx.pop(); sandbox.dropSnack(s); buildTools(toolbar, p); updateCoinsUI(p); }
    });
    toolbar.appendChild(b);
  });

  // toys owned (tap to enter placement mode)
  Object.entries(p.toys).forEach(([id, count]) => {
    const t = TOY_BY_ID[id]; if (!t || count <= 0) return;
    const b = h(`<button class="tool-btn"><span class="tic">${t.emoji}</span>${t.name} ×${count}</button>`);
    b.addEventListener('click', () => {
      sfx.tap();
      if (t.id === 'ball') { sandbox.placeToy(t, 0, 0); return; }
      sandbox.beginPlace('toy', t);
      sandboxTip(`Tap in the sandbox to place your ${t.name}!`);
    });
    toolbar.appendChild(b);
  });

  if (!Object.keys(p.snacks).length && !Object.keys(p.toys).length) {
    const note = h(`<button class="tool-btn disabled"><span class="tic">🛒</span>Buy in Market</button>`);
    toolbar.appendChild(note);
  }
}

function respawn(p) {
  Object.entries(p.dumplings).forEach(([id, info], i) => {
    const d = DUMPLING_BY_ID[id];
    if (d) setTimeout(() => sandbox.spawnDumpling(d, Math.round(info.size || 1)), i * 120);
  });
}

function hideHintSoon() {
  setTimeout(() => { const hint = $('#sb-hint'); if (hint) hint.style.opacity = '0'; }, 3500);
}

function sandboxTip(text) {
  const hint = $('#sb-hint');
  if (hint) { hint.textContent = text; hint.style.opacity = '1'; hideHintSoon(); }
}

/* ---------- shared UI updates ---------- */
function updateCoinsUI(p) {
  const c = $('#tb-coins'); if (c) c.textContent = p.coins;
  const sb = $('#steam-btn'); if (sb) sb.disabled = p.coins < STEAM_COST;
}

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])); }

/* ============================================================
   PWA: service worker + install prompt
   ============================================================ */
function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
}

let deferredInstall = null;
const INSTALL_DISMISS_KEY = 'dumpling-math:install-dismissed';
function setupInstall() {
  const toastEl = $('#install-toast');
  const hide = () => { if (toastEl) toastEl.hidden = true; document.body.classList.remove('has-install'); };
  const show = () => { if (toastEl) { toastEl.hidden = false; document.body.classList.add('has-install'); } };
  const dismissed = () => { try { return localStorage.getItem(INSTALL_DISMISS_KEY) === '1'; } catch { return false; } };

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstall = e;
    if (!dismissed()) show();
  });
  $('#install-btn')?.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!deferredInstall) { hide(); return; }
    deferredInstall.prompt();
    await deferredInstall.userChoice;
    deferredInstall = null;
    hide();
  });
  // Dismiss: close the card and remember the choice so it stays closed.
  $('#install-dismiss')?.addEventListener('click', (e) => {
    e.stopPropagation();
    hide();
    try { localStorage.setItem(INSTALL_DISMISS_KEY, '1'); } catch {}
  });
  window.addEventListener('appinstalled', () => { hide(); toast('Installed! Play offline anytime 🥟'); });
}

/* ============================================================
   BOOT
   ============================================================ */
function boot() {
  initFx();
  registerSW();
  setupInstall();
  const profiles = store.getProfiles();
  view.screen = profiles.length && store.getActive() ? 'main' : 'lobby';
  render();
}

boot();

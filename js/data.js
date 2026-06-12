/* ============================================================
   Static game data: dumpling catalog, snacks, toys, rarities.
   ============================================================ */

export const RARITIES = {
  common:   { name: 'Common',   color: '#b9c4d0', weight: 50, value: 10,  steamChance: 0.50 },
  uncommon: { name: 'Uncommon', color: '#6fd6a6', weight: 26, value: 25,  steamChance: 0.26 },
  rare:     { name: 'Rare',     color: '#5cb6ff', weight: 14, value: 60,  steamChance: 0.14 },
  epic:     { name: 'Epic',     color: '#b78bff', weight: 7,  value: 150, steamChance: 0.07 },
  mythic:   { name: 'Mythic',   color: '#ff8fd0', weight: 3,  value: 400, steamChance: 0.03 },
};

export const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'mythic'];

/* Each dumpling: id, name, rarity, two-tone body colors, cheek color, expression mood.
   `glow` flags the mythic shimmer treatment. */
export const DUMPLINGS = [
  // ----- Common -----
  { id: 'baby_bao',     name: 'Baby Bao',     rarity: 'common',   c1: '#fff6ef', c2: '#ffe6d2', cheek: '#ffc2c2', mood: 'happy' },
  { id: 'mint_bun',     name: 'Mint Bun',     rarity: 'common',   c1: '#e6fff4', c2: '#bdf2dc', cheek: '#9ce0c2', mood: 'calm' },
  { id: 'salty_shao',   name: 'Salty Shao',   rarity: 'common',   c1: '#fff8e8', c2: '#f3e2b8', cheek: '#ffd6a8', mood: 'silly' },
  { id: 'berry_gyoza',  name: 'Berry Gyoza',  rarity: 'common',   c1: '#ffe9f1', c2: '#ffc2d8', cheek: '#ff9ec4', mood: 'happy' },
  { id: 'matcha_momo',  name: 'Matcha Momo',  rarity: 'common',   c1: '#eef6d8', c2: '#cfe39a', cheek: '#bcd87f', mood: 'calm' },

  // ----- Uncommon -----
  { id: 'ocean_wonton', name: 'Ocean Wonton', rarity: 'uncommon', c1: '#e3f6ff', c2: '#aadfff', cheek: '#86c8f5', mood: 'surprised' },
  { id: 'citrus_siu',   name: 'Citrus Siu',   rarity: 'uncommon', c1: '#fff7d6', c2: '#ffe27a', cheek: '#ffcf4d', mood: 'happy' },
  { id: 'lilac_jiao',   name: 'Lilac Jiao',   rarity: 'uncommon', c1: '#f3eaff', c2: '#d6bfff', cheek: '#c9b6ff', mood: 'calm' },
  { id: 'peach_pot',    name: 'Peach Potsticker', rarity: 'uncommon', c1: '#ffeee2', c2: '#ffcaa3', cheek: '#ffb38a', mood: 'silly' },
  { id: 'cocoa_cloud',  name: 'Cocoa Cloud',  rarity: 'uncommon', c1: '#f3e6da', c2: '#cda680', cheek: '#e0b58f', mood: 'sleepy' },

  // ----- Rare -----
  { id: 'plum_pearl',   name: 'Plum Pearl',   rarity: 'rare',     c1: '#f7e6f0', c2: '#d98fb8', cheek: '#c76fa0', mood: 'happy' },
  { id: 'aqua_aura',    name: 'Aqua Aura',    rarity: 'rare',     c1: '#dcfbff', c2: '#86eaf0', cheek: '#5fd6dd', mood: 'surprised' },
  { id: 'spicy_srir',   name: 'Spicy Sriracha', rarity: 'rare',   c1: '#ffe0d8', c2: '#ff8a6a', cheek: '#ff6b4a', mood: 'silly' },
  { id: 'cosmic_cream', name: 'Cosmic Cream', rarity: 'rare',     c1: '#ece7ff', c2: '#b3a6f0', cheek: '#9d8be0', mood: 'calm' },
  { id: 'sunny_sun',    name: 'Sunny Sunshine', rarity: 'rare',   c1: '#fff4cf', c2: '#ffd23f', cheek: '#ffb700', mood: 'happy' },

  // ----- Epic -----
  { id: 'ruby_roy',     name: 'Ruby Roy',     rarity: 'epic',     c1: '#ffd9e0', c2: '#ff4f7a', cheek: '#e23a64', mood: 'happy',   glow: true },
  { id: 'emerald_elx',  name: 'Emerald Elixir', rarity: 'epic',   c1: '#d4ffe9', c2: '#2fd98a', cheek: '#16c275', mood: 'calm',    glow: true },
  { id: 'sapphire_star',name: 'Sapphire Star', rarity: 'epic',    c1: '#d8e6ff', c2: '#4f7bff', cheek: '#3a5fe0', mood: 'surprised',glow: true },
  { id: 'gold_sov',     name: 'Gold Sovereign', rarity: 'epic',   c1: '#fff3cc', c2: '#ffc107', cheek: '#e0a000', mood: 'happy',   glow: true },
  { id: 'dreamy_twi',   name: 'Dreamy Twilight', rarity: 'epic',  c1: '#e6ddff', c2: '#8a6fe0', cheek: '#6f54c2', mood: 'sleepy',  glow: true },

  // ----- Mythic -----
  { id: 'mythic_mystic',name: 'Mythic Mystic', rarity: 'mythic',  c1: '#f0e0ff', c2: '#b06fff', cheek: '#9b4fff', mood: 'calm',     glow: true },
  { id: 'celestial',    name: 'Celestial Comet', rarity: 'mythic',c1: '#dff0ff', c2: '#5fa8ff', cheek: '#7fd0ff', mood: 'surprised',glow: true },
  { id: 'solar_flare',  name: 'Solar Flare',  rarity: 'mythic',   c1: '#ffeac2', c2: '#ff8a2a', cheek: '#ff5e2a', mood: 'happy',    glow: true },
  { id: 'rainbow_uni',  name: 'Rainbow Unicorn', rarity: 'mythic',c1: '#ffe6f5', c2: '#ff9ed8', cheek: '#a6e0ff', mood: 'silly',    glow: true, rainbow: true },
  { id: 'omni_overlord',name: 'Omnipresent Overlord', rarity: 'mythic', c1: '#e8e4ff', c2: '#6a4fff', cheek: '#ffd23f', mood: 'surprised', glow: true, rainbow: true },
];

export const DUMPLING_BY_ID = Object.fromEntries(DUMPLINGS.map(d => [d.id, d]));

/* Starter dumpling everyone owns. */
export const STARTER_DUMPLING = 'baby_bao';

export const STEAM_COST = 40;

/* ----- Snacks: dropped into sandbox, eaten to grow dumplings ----- */
export const SNACKS = [
  { id: 'cookie',  name: 'Cookie',      emoji: '🍪', price: 12, desc: 'A crunchy classic treat.' },
  { id: 'donut',   name: 'Donut',       emoji: '🍩', price: 18, desc: 'Sweet, sprinkly & round.' },
  { id: 'pastry',  name: 'Pastry',      emoji: '🥐', price: 22, desc: 'Flaky and buttery.' },
  { id: 'star',    name: 'Star Pastry', emoji: '⭐', price: 30, desc: 'A shimmering sweet star.' },
  { id: 'tea',     name: 'Bubble Tea',  emoji: '🧋', price: 26, desc: 'Chewy, slurpy & happy.' },
  { id: 'cake',    name: 'Cake Slice',  emoji: '🍰', price: 35, desc: 'Fluffy celebration cake.' },
];
export const SNACK_BY_ID = Object.fromEntries(SNACKS.map(s => [s.id, s]));

/* ----- Toys: placeable interactables in the sandbox ----- */
export const TOYS = [
  { id: 'trampoline', name: 'Trampoline', emoji: '🪀', price: 60,  desc: 'Bouncy! Sends dumplings flying.' },
  { id: 'fan',        name: 'Wind Fan',   emoji: '🌀', price: 80,  desc: 'Blows dumplings upward.' },
  { id: 'magnet',     name: 'Magnet',     emoji: '🧲', price: 100, desc: 'Pulls dumplings together.' },
  { id: 'ball',       name: 'Elastic Ball', emoji: '⚽', price: 50, desc: 'A bouncy playmate.' },
];
export const TOY_BY_ID = Object.fromEntries(TOYS.map(t => [t.id, t]));

/* ----- Math skills ----- */
export const SKILLS = [
  { id: 'add', name: 'Addition',       emoji: '➕', op: '+' },
  { id: 'sub', name: 'Subtraction',    emoji: '➖', op: '−' },
  { id: 'mul', name: 'Multiplication', emoji: '✖️', op: '×' },
  { id: 'div', name: 'Division',       emoji: '➗', op: '÷' },
  { id: 'alg', name: 'Algebra',        emoji: '⭐', op: '=' },
];
export const SKILL_BY_ID = Object.fromEntries(SKILLS.map(s => [s.id, s]));

/* Avatar choices for sibling profiles */
export const AVATARS = ['🥟', '🐣', '🦊', '🐼', '🐸', '🦄', '🐙', '🐰', '🦖', '🐧', '🐯', '🦋'];
export const AVATAR_COLORS = ['#ffd9e3', '#c9b6ff', '#9ce8c9', '#a7d8ff', '#ffe08a', '#ffc7a3'];

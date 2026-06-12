/* ============================================================
   Global leaderboard API (Vercel Serverless Function).
   Backed by Vercel KV (Upstash Redis) via its REST API — no npm
   dependencies, uses built-in fetch on the Vercel Node runtime.

   Required environment variables (auto-added when you connect a
   Vercel KV store to the project):
     KV_REST_API_URL
     KV_REST_API_TOKEN

   Data model:
     ZSET  lb:scores   member = playerId, score = brain points
     HASH  lb:meta      field  = playerId, value = JSON profile snapshot
   ============================================================ */

const ZSET = 'lb:scores';
const HASH = 'lb:meta';
const TOP_N = 100;

function kvConfigured() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/** Run a pipeline of Redis commands against the Upstash REST API. */
async function kv(commands) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  const res = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`KV ${res.status}: ${text}`);
  }
  return res.json(); // -> [{ result }, ...]
}

const clampStr = (v, max) => String(v == null ? '' : v).slice(0, max).trim();
const clampInt = (v, min, max) => {
  const n = Math.round(Number(v) || 0);
  return Math.max(min, Math.min(max, n));
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!kvConfigured()) {
    return res.status(503).json({ error: 'leaderboard_unconfigured', message: 'KV store not connected.' });
  }

  try {
    if (req.method === 'POST') return await handlePost(req, res);
    if (req.method === 'GET') return await handleGet(req, res);
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  } catch (err) {
    return res.status(500).json({ error: 'server_error', message: String(err.message || err) });
  }
}

async function handlePost(req, res) {
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const id = clampStr(body.id, 40);
  if (!id) return res.status(400).json({ error: 'missing_id' });

  const entry = {
    id,
    name: clampStr(body.name, 24) || 'Player',
    age: clampInt(body.age, 0, 120) || '',
    klass: clampStr(body.klass, 40),
    school: clampStr(body.school, 80),
    level: clampInt(body.level, 1, 9999),
    score: clampInt(body.score, 0, 10_000_000),
    ts: Date.now(),
  };

  await kv([
    ['ZADD', ZSET, String(entry.score), id],
    ['HSET', HASH, id, JSON.stringify(entry)],
  ]);

  return res.status(200).json({ ok: true, score: entry.score });
}

async function handleGet(req, res) {
  const myId = clampStr(req.query?.id, 40);

  const range = await kv([['ZREVRANGE', ZSET, '0', String(TOP_N - 1), 'WITHSCORES']]);
  const flat = range[0]?.result || []; // [id, score, id, score, ...]

  const ids = [];
  const scoreById = {};
  for (let i = 0; i < flat.length; i += 2) { ids.push(flat[i]); scoreById[flat[i]] = Number(flat[i + 1]); }

  let metas = [];
  if (ids.length) {
    const m = await kv([['HMGET', HASH, ...ids]]);
    metas = m[0]?.result || [];
  }

  const entries = ids.map((id, i) => {
    let meta = {};
    try { meta = JSON.parse(metas[i] || '{}'); } catch {}
    return {
      rank: i + 1,
      id,
      name: meta.name || 'Player',
      age: meta.age || '',
      klass: meta.klass || '',
      school: meta.school || '',
      level: meta.level || 1,
      score: scoreById[id] ?? meta.score ?? 0,
    };
  });

  const payload = { entries, total: entries.length };

  // Include the requesting player's own rank even if outside the top list.
  if (myId) {
    const r = await kv([
      ['ZREVRANK', ZSET, myId],
      ['ZSCORE', ZSET, myId],
      ['ZCARD', ZSET],
    ]);
    const rank = r[0]?.result;
    payload.you = {
      id: myId,
      rank: rank == null ? null : Number(rank) + 1,
      score: r[1]?.result == null ? null : Number(r[1].result),
      totalPlayers: Number(r[2]?.result || entries.length),
    };
  }

  return res.status(200).json(payload);
}

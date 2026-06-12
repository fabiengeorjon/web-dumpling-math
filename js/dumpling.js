/* ============================================================
   Dumpling rendering — expressive animated faces on canvas,
   plus static SVG thumbnails for the collection grid.
   ============================================================ */

/* ---------- Canvas: squishy body + animated face ----------
   opts: {
     squish: {sx, sy},      // scale distortion for jelly stretch
     expression,            // 'happy'|'calm'|'silly'|'surprised'|'sleepy'|'eat'|'drag'
     blink (0..1),          // eyelid amount
     wink: bool,
     speed,                 // current velocity magnitude (drives surprise)
     t,                     // time seconds (for Zzz etc.)
   }
*/
export function drawDumpling(ctx, x, y, r, d, opts = {}) {
  const sx = opts.squish?.sx ?? 1;
  const sy = opts.squish?.sy ?? 1;
  const t = opts.t ?? 0;

  ctx.save();
  ctx.translate(x, y);

  // gentle idle wobble
  const wob = Math.sin(t * 2 + (x % 10)) * 0.03;
  ctx.scale(sx, sy);
  ctx.rotate((opts.rot ?? 0) + wob * 0.2);

  // ----- body -----
  const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.4, r * 0.2, 0, 0, r * 1.15);
  if (d.rainbow) {
    const hue = (t * 40) % 360;
    grad.addColorStop(0, `hsl(${hue}, 100%, 92%)`);
    grad.addColorStop(0.6, `hsl(${(hue + 60) % 360}, 90%, 80%)`);
    grad.addColorStop(1, `hsl(${(hue + 140) % 360}, 85%, 70%)`);
  } else {
    grad.addColorStop(0, d.c1);
    grad.addColorStop(1, d.c2);
  }

  // soft drop shadow
  ctx.beginPath();
  ctx.ellipse(0, r * 0.9, r * 0.8, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(120,90,150,0.12)';
  ctx.fill();

  // pleated dumpling body (rounded top, little pleats)
  bodyPath(ctx, r);
  ctx.fillStyle = grad;
  ctx.fill();

  // glossy highlight
  ctx.beginPath();
  ctx.ellipse(-r * 0.32, -r * 0.42, r * 0.34, r * 0.22, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fill();

  // mythic shimmer ring
  if (d.glow) {
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.04, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${0.35 + Math.sin(t * 3) * 0.2})`;
    ctx.lineWidth = r * 0.07;
    ctx.stroke();
  }

  drawFace(ctx, r, d, opts, t);
  ctx.restore();
}

function bodyPath(ctx, r) {
  // a rounded dumpling: circle with a slightly flat, pleated crown
  ctx.beginPath();
  ctx.moveTo(-r, 0);
  ctx.bezierCurveTo(-r, -r * 0.95, -r * 0.55, -r * 1.12, 0, -r * 1.05);
  ctx.bezierCurveTo(r * 0.55, -r * 1.12, r, -r * 0.95, r, 0);
  ctx.bezierCurveTo(r, r * 0.62, r * 0.62, r, 0, r);
  ctx.bezierCurveTo(-r * 0.62, r, -r, r * 0.62, -r, 0);
  ctx.closePath();
}

function drawFace(ctx, r, d, opts, t) {
  const expr = opts.expression || d.mood || 'happy';
  const eyeY = -r * 0.05;
  const eyeX = r * 0.4;
  const eyeR = r * 0.16;

  const cheekColor = d.cheek || '#ffb3c8';

  // ----- cheeks -----
  ctx.fillStyle = cheekColor;
  ctx.globalAlpha = 0.55;
  ctx.beginPath(); ctx.arc(-eyeX - r * 0.08, eyeY + r * 0.3, r * 0.16, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(eyeX + r * 0.08, eyeY + r * 0.3, r * 0.16, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#4a3f55';
  ctx.strokeStyle = '#4a3f55';
  ctx.lineWidth = r * 0.09;
  ctx.lineCap = 'round';

  const blink = opts.blink ?? 0;
  const surprised = expr === 'surprised' || (opts.speed ?? 0) > 7;

  // ----- eyes -----
  if (expr === 'sleepy') {
    // closed, gentle arcs
    sleepyEye(ctx, -eyeX, eyeY, eyeR);
    sleepyEye(ctx, eyeX, eyeY, eyeR);
    drawZzz(ctx, r, t);
  } else {
    const leftClosed = blink > 0.6;
    const rightClosed = opts.wink ? true : blink > 0.6;
    eye(ctx, -eyeX, eyeY, eyeR, surprised, leftClosed);
    eye(ctx, eyeX, eyeY, eyeR, surprised, rightClosed);
  }

  // ----- mouth -----
  ctx.beginPath();
  const my = eyeY + r * 0.5;
  if (expr === 'eat' || expr === 'surprised' || surprised) {
    // open O mouth
    const mr = r * (expr === 'eat' ? 0.22 : 0.16);
    ctx.fillStyle = '#d96a86';
    ctx.beginPath(); ctx.ellipse(0, my, mr * 0.8, mr, 0, 0, Math.PI * 2); ctx.fill();
  } else if (expr === 'silly' || expr === 'drag') {
    // tongue out
    ctx.beginPath();
    ctx.arc(0, my - r * 0.05, r * 0.22, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
    ctx.fillStyle = '#ff8fa8';
    ctx.beginPath(); ctx.ellipse(r * 0.06, my + r * 0.16, r * 0.1, r * 0.13, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    // happy smile
    ctx.beginPath();
    ctx.arc(0, my - r * 0.12, r * 0.26, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
}

function eye(ctx, x, y, r, big, closed) {
  ctx.fillStyle = '#4a3f55';
  if (closed) {
    ctx.lineWidth = r * 0.4;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.7, y);
    ctx.quadraticCurveTo(x, y + r * 0.5, x + r * 0.7, y);
    ctx.stroke();
    return;
  }
  const rr = big ? r * 1.25 : r;
  ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
  // sparkle
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x - rr * 0.3, y - rr * 0.3, rr * 0.32, 0, Math.PI * 2); ctx.fill();
}

function sleepyEye(ctx, x, y, r) {
  ctx.lineWidth = r * 0.35;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.8, y - r * 0.1);
  ctx.quadraticCurveTo(x, y + r * 0.45, x + r * 0.8, y - r * 0.1);
  ctx.stroke();
}

function drawZzz(ctx, r, t) {
  ctx.save();
  ctx.fillStyle = 'rgba(120,100,160,0.8)';
  ctx.font = `bold ${r * 0.4}px Baloo 2, sans-serif`;
  const float = (t % 3) / 3;
  for (let i = 0; i < 3; i++) {
    const p = (float + i * 0.33) % 1;
    ctx.globalAlpha = 1 - p;
    ctx.fillText('z', r * (0.6 + i * 0.25), -r * (0.9 + p * 1.2));
  }
  ctx.restore();
}

/* ---------- SVG thumbnail for collection / reveal / avatars ---------- */
export function dumplingSVG(d, size = 100) {
  const id = 'g_' + d.id;
  const fill = d.rainbow
    ? `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
         <stop offset="0%" stop-color="#ffd9f5"/><stop offset="50%" stop-color="#c9b6ff"/><stop offset="100%" stop-color="#a7d8ff"/>
       </linearGradient>`
    : `<radialGradient id="${id}" cx="35%" cy="30%" r="80%">
         <stop offset="0%" stop-color="${d.c1}"/><stop offset="100%" stop-color="${d.c2}"/>
       </radialGradient>`;
  const glow = d.glow
    ? `<circle cx="50" cy="50" r="46" fill="none" stroke="#fff" stroke-opacity="0.6" stroke-width="3">
         <animate attributeName="stroke-opacity" values="0.2;0.8;0.2" dur="2s" repeatCount="indefinite"/>
       </circle>` : '';
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>${fill}</defs>
    <ellipse cx="50" cy="86" rx="30" ry="7" fill="#7a5a96" opacity="0.12"/>
    <path d="M8 50 C8 16 28 6 50 8 C72 6 92 16 92 50 C92 74 74 92 50 92 C26 92 8 74 8 50 Z" fill="url(#${id})"/>
    <ellipse cx="36" cy="34" rx="13" ry="8" fill="#fff" opacity="0.45"/>
    ${glow}
    <circle cx="30" cy="56" r="6.5" fill="${d.cheek}" opacity="0.5"/>
    <circle cx="70" cy="56" r="6.5" fill="${d.cheek}" opacity="0.5"/>
    <circle cx="37" cy="48" r="6" fill="#4a3f55"/>
    <circle cx="63" cy="48" r="6" fill="#4a3f55"/>
    <circle cx="35" cy="46" r="2" fill="#fff"/>
    <circle cx="61" cy="46" r="2" fill="#fff"/>
    <path d="M40 64 Q50 74 60 64" fill="none" stroke="#4a3f55" stroke-width="3.5" stroke-linecap="round"/>
  </svg>`;
}

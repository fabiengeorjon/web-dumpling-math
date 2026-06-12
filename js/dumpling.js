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

  // ----- body fill: bottom-heavy, plump, jelly-like -----
  const grad = ctx.createRadialGradient(-r * 0.32, -r * 0.5, r * 0.15, 0, r * 0.1, r * 1.25);
  if (d.rainbow) {
    const hue = (t * 40) % 360;
    grad.addColorStop(0, `hsl(${hue}, 100%, 94%)`);
    grad.addColorStop(0.55, `hsl(${(hue + 60) % 360}, 92%, 82%)`);
    grad.addColorStop(1, `hsl(${(hue + 140) % 360}, 85%, 70%)`);
  } else {
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.28, d.c1);
    grad.addColorStop(1, d.c2);
  }

  // soft contact shadow on the floor
  ctx.beginPath();
  ctx.ellipse(0, r * 1.0, r * 0.82, r * 0.2, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(120,90,150,0.13)';
  ctx.fill();

  // squishy pleated dumpling body
  bodyPath(ctx, r);
  ctx.save();
  // a faint rim for definition
  ctx.shadowColor = 'rgba(120,90,150,0.18)';
  ctx.shadowBlur = r * 0.18;
  ctx.shadowOffsetY = r * 0.06;
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();

  // inner bottom shading to look plump & translucent
  ctx.save();
  bodyPath(ctx, r);
  ctx.clip();
  const shade = ctx.createLinearGradient(0, r * 0.2, 0, r * 1.05);
  shade.addColorStop(0, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(90,60,120,0.16)');
  ctx.fillStyle = shade;
  ctx.fillRect(-r * 1.2, -r * 1.2, r * 2.4, r * 2.4);

  // pleat creases fanning from the top
  ctx.strokeStyle = 'rgba(120,90,150,0.16)';
  ctx.lineWidth = r * 0.045;
  ctx.lineCap = 'round';
  for (let i = -2; i <= 2; i++) {
    const topX = i * r * 0.3;
    ctx.beginPath();
    ctx.moveTo(topX, -r * 0.92);
    ctx.quadraticCurveTo(topX * 1.2, -r * 0.4, topX * 0.6, -r * 0.1);
    ctx.stroke();
  }
  ctx.restore();

  // big glossy highlight (top-left) — the squishy sheen
  ctx.beginPath();
  ctx.ellipse(-r * 0.34, -r * 0.46, r * 0.36, r * 0.24, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fill();
  // small secondary sparkle
  ctx.beginPath();
  ctx.ellipse(r * 0.28, -r * 0.18, r * 0.12, r * 0.08, -0.4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fill();

  // mythic shimmer ring
  if (d.glow) {
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.06, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${0.35 + Math.sin(t * 3) * 0.2})`;
    ctx.lineWidth = r * 0.07;
    ctx.stroke();
  }

  drawFace(ctx, r, d, opts, t);
  ctx.restore();
}

function bodyPath(ctx, r) {
  // A plump, bottom-heavy dumpling with a softly scalloped (pleated) crown.
  ctx.beginPath();
  ctx.moveTo(-r, r * 0.12);
  // left shoulder up to the crown
  ctx.bezierCurveTo(-r, -r * 0.62, -r * 0.86, -r * 0.92, -r * 0.52, -r * 0.9);
  // three little pleat bumps across the top
  ctx.quadraticCurveTo(-r * 0.34, -r * 1.04, -r * 0.17, -r * 0.9);
  ctx.quadraticCurveTo(0, -r * 1.05, r * 0.17, -r * 0.9);
  ctx.quadraticCurveTo(r * 0.34, -r * 1.04, r * 0.52, -r * 0.9);
  // right shoulder down
  ctx.bezierCurveTo(r * 0.86, -r * 0.92, r, -r * 0.62, r, r * 0.12);
  // plump rounded bottom
  ctx.bezierCurveTo(r, r * 0.78, r * 0.62, r * 1.06, 0, r * 1.06);
  ctx.bezierCurveTo(-r * 0.62, r * 1.06, -r, r * 0.78, -r, r * 0.12);
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
    <ellipse cx="50" cy="90" rx="30" ry="6.5" fill="#7a5a96" opacity="0.12"/>
    <path d="M10 56 C10 28 22 14 36 16 Q43 5 50 15 Q57 5 64 16 C78 14 90 28 90 56 C90 80 72 95 50 95 C28 95 10 80 10 56 Z" fill="url(#${id})"/>
    <ellipse cx="36" cy="36" rx="13" ry="8" fill="#fff" opacity="0.5"/>
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

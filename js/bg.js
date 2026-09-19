/* ============================================================
   Catwalk Sterren — decors (settings) achter het model

   Het podium is 480 x 720; het model staat met de voeten op y ≈ 654.
   Waar het kan gebruiken we uitsneden uit de Sterreneiland-illustraties
   (assets/bg/<id>.jpg), soms met een sfeerlaag erover (nacht, regen,
   sneeuw, slingers). De rest wordt hier getekend in dezelfde zachte stijl.

   Backgrounds.draw(ctx, id, w, h) -> true als alles getekend is
                                      (false: afbeelding laadt nog, er
                                      komt vanzelf een nieuwe tekenbeurt)
   Backgrounds.thumb(id)           -> <canvas>-string met een miniatuur
   ============================================================ */

const Backgrounds = (() => {
  const IMAGES = {};
  function img(id) {
    if (!IMAGES[id]) {
      const im = new Image();
      im.onload = () => { im.ok = true; schedule(); if (window.Avatar) Avatar.mountAll(); };
      im.onerror = () => { im.bad = true; };
      im.src = `assets/bg/${id}.jpg`;
      IMAGES[id] = im;
    }
    return IMAGES[id];
  }
  const HAS_IMAGE = ['kamer', 'feestkamer', 'kerst', 'park', 'kasteeltuin', 'manege', 'bos', 'spookhuis', 'sportveld', 'stad', 'regen', 'strand', 'zwembad'];
  const preload = () => HAS_IMAGE.forEach(img);

  /* ---------- hulpjes ---------- */
  const GROUND = 560;                 // waar de vloer begint
  const rnd = seed => { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };
  const hex2rgb = h => { h = h.replace('#', ''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const rgba = (h, a) => { const [r, g, b] = hex2rgb(h); return `rgba(${r},${g},${b},${a})`; };
  const mix = (a, b, t) => { const A = hex2rgb(a), B = hex2rgb(b); return '#' + [0, 1, 2].map(i => Math.round(A[i] + (B[i] - A[i]) * t).toString(16).padStart(2, '0')).join(''); };
  const light = (c, t = .3) => mix(c, '#ffffff', t), dark = (c, t = .25) => mix(c, '#000000', t);
  const em = (g, ch, x, y, size, o) => Avatar.emoji(g, ch, x, y, size, o);

  function sky(g, w, h, a, b, y1 = h) { const lg = g.createLinearGradient(0, 0, 0, y1); lg.addColorStop(0, a); lg.addColorStop(1, b); g.fillStyle = lg; g.fillRect(0, 0, w, h); }
  function floor(g, w, h, y, a, b, planks = false) {
    const lg = g.createLinearGradient(0, y, 0, h); lg.addColorStop(0, a); lg.addColorStop(1, b); g.fillStyle = lg; g.fillRect(0, y, w, h - y);
    if (planks) { g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 2; for (let i = 1; i < 6; i++) { const yy = y + (h - y) * (i / 6) ** 1.4; g.beginPath(); g.moveTo(0, yy); g.lineTo(w, yy); g.stroke(); } }
    g.save(); const sh = g.createLinearGradient(0, y - 30, 0, y + 40); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.08)'); g.fillStyle = sh; g.fillRect(0, y - 30, w, 70); g.restore();
  }
  function wallLine(g, w, y, c) { g.fillStyle = c; g.fillRect(0, y - 6, w, 12); }
  function glow(g, x, y, r, c, a = .5) { const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, rgba(c, a)); rg.addColorStop(1, rgba(c, 0)); g.fillStyle = rg; g.fillRect(x - r, y - r, r * 2, r * 2); }
  function sun(g, x, y, r, c = '#ffd23f') { glow(g, x, y, r * 3, '#fff3b0', .55); Avatar.blob(g, x, y, r, r, c); }
  function cloud(g, x, y, s = 1, c = '#ffffff') { [[0, 0, 40, 22], [-26, 4, 22, 16], [24, 2, 26, 18], [4, -12, 26, 20]].forEach(([dx, dy, rx, ry]) => Avatar.blob(g, x + dx * s, y + dy * s, rx * s, ry * s, c)); }
  function spot(g, x0, x1, hw, c, a = .35, top = -40, bottom = GROUND + 40) {
    g.save(); g.globalAlpha = a; const lg = g.createLinearGradient(0, top, 0, bottom); lg.addColorStop(0, c); lg.addColorStop(1, rgba(c, 0));
    g.fillStyle = lg; g.beginPath(); g.moveTo(x0 - 12, top); g.lineTo(x0 + 12, top); g.lineTo(x1 + hw, bottom); g.lineTo(x1 - hw, bottom); g.closePath(); g.fill(); g.restore();
  }
  function tint(g, w, h, c, a, mode = 'multiply') { g.save(); g.globalCompositeOperation = mode; g.globalAlpha = a; g.fillStyle = c; g.fillRect(0, 0, w, h); g.restore(); }
  function stars(g, w, h, n, seed, maxY = h) { const r = rnd(seed); for (let i = 0; i < n; i++) { const x = r() * w, y = r() * maxY, s = .6 + r() * 1.6; g.save(); g.globalAlpha = .5 + r() * .5; g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, s, 0, 7); g.fill(); g.restore(); } }
  function sparkles(g, w, h, n, seed, c = '#fff', maxY = h) { const r = rnd(seed); for (let i = 0; i < n; i++) { const x = r() * w, y = r() * maxY, s = 2 + r() * 5; g.save(); g.globalAlpha = .4 + r() * .6; g.fillStyle = c; g.beginPath(); for (let k = 0; k < 8; k++) { const a = Math.PI / 4 * k, rr = k % 2 ? s * .35 : s; g[k ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); g.restore(); } }
  function vignette(g, w, h, a = .18) { const rg = g.createRadialGradient(w / 2, h / 2, h * .3, w / 2, h / 2, h * .75); rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, `rgba(20,10,40,${a})`); g.fillStyle = rg; g.fillRect(0, 0, w, h); }
  function drawImage(g, id, w, h) { const im = img(id); if (!im.ok) { sky(g, w, h, '#efe7fa', '#d8c9ee'); return false; } g.drawImage(im, 0, 0, w, h); return true; }
  function confetti(g, w, h, seed, n = 40) { const r = rnd(seed), cols = ['#ff5da2', '#7c5cff', '#ffc531', '#3ddcb0', '#5aaeff', '#ff8c42']; for (let i = 0; i < n; i++) { g.save(); g.translate(r() * w, r() * h * .8); g.rotate(r() * 6); g.fillStyle = cols[i % cols.length]; g.globalAlpha = .85; g.fillRect(-4, -6, 8, 12); g.restore(); } }
  function garland(g, w, y, seed) { const r = rnd(seed), cols = ['#ff5da2', '#ffc531', '#3ddcb0', '#5aaeff', '#c47bff']; g.strokeStyle = 'rgba(90,70,110,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, y); g.quadraticCurveTo(w / 2, y + 60, w, y); g.stroke(); for (let i = 1; i < 12; i++) { const t = i / 12, x = t * w, yy = y + 4 * t * (1 - t) * 60 + 6; g.beginPath(); g.moveTo(x - 8, yy); g.lineTo(x + 8, yy); g.lineTo(x, yy + 18); g.closePath(); g.fillStyle = cols[i % cols.length]; g.fill(); } }
  function balloons(g, seed, list) { list.forEach(([x, y, c]) => { g.strokeStyle = 'rgba(90,70,110,.5)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y + 34); ctxCurve(g, x, y + 34, x + 6, y + 120); g.stroke(); Avatar.blob(g, x, y, 26, 32, c); g.fillStyle = dark(c, .2); g.beginPath(); g.moveTo(x - 4, y + 32); g.lineTo(x + 4, y + 32); g.lineTo(x, y + 38); g.fill(); }); }
  const ctxCurve = (g, x0, y0, x1, y1) => g.quadraticCurveTo(x0 + 14, (y0 + y1) / 2, x1, y1);
  function rain(g, w, h, seed) { const r = rnd(seed); g.strokeStyle = 'rgba(220,235,255,.55)'; g.lineWidth = 1.6; for (let i = 0; i < 140; i++) { const x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 3, y + 16); g.stroke(); } }
  function snow(g, w, h, seed, n = 90) { const r = rnd(seed); for (let i = 0; i < n; i++) { g.save(); g.globalAlpha = .55 + r() * .45; g.fillStyle = '#fff'; g.beginPath(); g.arc(r() * w, r() * h, 1.5 + r() * 3, 0, 7); g.fill(); g.restore(); } }
  function moon(g, x, y, r) { glow(g, x, y, r * 3, '#fff6d6', .35); Avatar.blob(g, x, y, r, r, '#fff6d6'); }
  function tiles(g, w, y0, y1, c1, c2, size = 40) { for (let y = y0; y < y1; y += size) for (let x = -size; x < w + size; x += size) { g.fillStyle = ((x + y) / size) % 2 ? c1 : c2; g.fillRect(x, y, size, size); } }
  function curtain(g, x, w, h, c) { const lg = g.createLinearGradient(x, 0, x + w, 0); for (let i = 0; i <= 6; i++) lg.addColorStop(i / 6, i % 2 ? c : dark(c, .3)); g.fillStyle = lg; g.fillRect(x, 0, w, h); }

  /* ---------- de settings ---------- */
  const SCENES = {
    kamer: (g, w, h) => drawImage(g, 'kamer', w, h),
    feestkamer: (g, w, h) => { const ok = drawImage(g, 'feestkamer', w, h); garland(g, w, 40, 3); balloons(g, 5, [[60, 250, '#ff5da2'], [96, 214, '#ffc531'], [420, 240, '#5aaeff'], [452, 290, '#3ddcb0']]); confetti(g, w, h, 9, 30); em(g, '🎂', 92, 470, 70); em(g, '🎁', 420, 520, 64); return ok; },
    kerst: (g, w, h) => { const ok = drawImage(g, 'kerst', w, h); tint(g, w, h, '#ffd9b0', .18); em(g, '🎄', 386, 470, 190); em(g, '🎁', 340, 560, 56); em(g, '🎁', 440, 575, 48); em(g, '⭐', 386, 372, 40); glow(g, 386, 470, 140, '#ffd23f', .18); return ok; },
    park: (g, w, h) => { const ok = drawImage(g, 'park', w, h); glow(g, 380, 60, 200, '#fff3b0', .35); em(g, '🦋', 90, 150, 44); em(g, '🐝', 400, 300, 30); return ok; },
    kasteeltuin: (g, w, h) => { const ok = drawImage(g, 'kasteeltuin', w, h); em(g, '🫖', 70, 600, 56); em(g, '🧁', 130, 606, 40); em(g, '🦢', 420, 610, 56); return ok; },
    manege: (g, w, h) => { const ok = drawImage(g, 'manege', w, h); em(g, '🐴', 396, 470, 150); em(g, '🌾', 70, 640, 70); em(g, '🌾', 120, 660, 56); return ok; },
    bos: (g, w, h) => { const ok = drawImage(g, 'bos', w, h); tint(g, w, h, '#7a5bc4', .55); tint(g, w, h, '#2a1b55', .35); sparkles(g, w, h, 40, 21, '#fff6b0'); glow(g, 120, 420, 60, '#fff3b0', .4); glow(g, 400, 300, 50, '#b8f3ff', .4); em(g, '🧚', 110, 400, 56); em(g, '🍄', 60, 630, 48); em(g, '🍄', 430, 645, 40); return ok; },
    spookhuis: (g, w, h) => { const ok = drawImage(g, 'spookhuis', w, h); tint(g, w, h, '#24143f', .68); tint(g, w, h, '#0c0620', .25); moon(g, 90, 80, 34); stars(g, w, h, 40, 31, 300); em(g, '🎃', 70, 630, 70); em(g, '🎃', 420, 640, 56); em(g, '👻', 380, 200, 64, { alpha: .85 }); em(g, '🦇', 300, 120, 36); em(g, '🦇', 160, 170, 28); return ok; },
    sportveld: (g, w, h) => { const ok = drawImage(g, 'sportveld', w, h); em(g, '🥅', 400, 520, 120); em(g, '⚽', 80, 650, 46); return ok; },
    stad: (g, w, h) => { const ok = drawImage(g, 'stad', w, h); tint(g, w, h, '#2b3a8a', .7); tint(g, w, h, '#0b1230', .4); stars(g, w, h, 50, 41, 260); moon(g, 400, 70, 28); em(g, '🏙️', 240, 300, 0); em(g, '🚦', 60, 560, 70); em(g, '💡', 430, 380, 40); glow(g, 430, 380, 90, '#ffe27a', .35); return ok; },
    regen: (g, w, h) => { const ok = drawImage(g, 'regen', w, h); tint(g, w, h, '#7b8aa8', .55); rain(g, w, h, 51); em(g, '🌧️', 90, 90, 80); em(g, '🌧️', 380, 130, 64); g.fillStyle = 'rgba(200,220,240,.45)'; g.beginPath(); g.ellipse(120, 680, 80, 12, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(400, 690, 60, 9, 0, 0, 7); g.fill(); return ok; },
    strand: (g, w, h) => { const ok = drawImage(g, 'strand', w, h); const lg = g.createLinearGradient(0, 520, 0, h); lg.addColorStop(0, 'rgba(246,222,170,0)'); lg.addColorStop(.25, '#f3d9a4'); lg.addColorStop(1, '#e6c07a'); g.fillStyle = lg; g.fillRect(0, 520, w, h - 520); sun(g, 410, 70, 34); em(g, '🐚', 70, 660, 36); em(g, '⭐', 420, 680, 30, { color: '#ff8c42' }); em(g, '🏖️', 80, 520, 90); return ok; },
    zwembad: (g, w, h) => { const ok = drawImage(g, 'zwembad', w, h); tiles(g, w, 500, 560, '#d9e6f2', '#c5d6e8', 30); const lg = g.createLinearGradient(0, 560, 0, h); lg.addColorStop(0, '#7fd3ff'); lg.addColorStop(1, '#3b9ee6'); g.fillStyle = lg; g.fillRect(0, 560, w, h - 560); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 3; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(0, 590 + i * 28); for (let x = 0; x <= w; x += 30) g.quadraticCurveTo(x + 15, 590 + i * 28 - 8, x + 30, 590 + i * 28); g.stroke(); } em(g, '🛟', 90, 600, 60); em(g, '🦆', 400, 600, 44); sun(g, 60, 70, 30); return ok; },

    catwalk: (g, w, h) => { sky(g, w, h, '#2a1b3d', '#4a2a6a'); spot(g, 90, 200, 120, '#ffffff', .18); spot(g, 390, 280, 120, '#ffffff', .18); spot(g, 240, 240, 90, '#ff9ad5', .18); const lg = g.createLinearGradient(0, GROUND, 0, h); lg.addColorStop(0, '#ff8fcf'); lg.addColorStop(1, '#ff5da2'); g.fillStyle = lg; g.beginPath(); g.moveTo(120, GROUND); g.lineTo(360, GROUND); g.lineTo(480, h); g.lineTo(0, h); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, GROUND - 4, w, 6); [40, 440].forEach(x => { for (let i = 0; i < 3; i++) em(g, '📸', x + (i - 1) * 6, 600 + i * 30, 26, { alpha: .8 }); }); sparkles(g, w, h, 30, 61, '#fff', GROUND); em(g, '✨', 60, 120, 40); em(g, '✨', 420, 160, 34); vignette(g, w, h, .3); return true; },
    balletzaal: (g, w, h) => { sky(g, w, h, '#fff4f8', '#fbe4ec', GROUND); floor(g, w, h, GROUND, '#e8c9a8', '#cfa67e', true); g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(40, 60, 400, 420); g.strokeStyle = '#d9c2cf'; g.lineWidth = 6; g.strokeRect(40, 60, 400, 420); g.strokeStyle = '#c99a6a'; g.lineWidth = 8; g.beginPath(); g.moveTo(0, 400); g.lineTo(w, 400); g.stroke(); [60, 420].forEach(x => { g.beginPath(); g.moveTo(x, 400); g.lineTo(x, GROUND); g.stroke(); }); em(g, '🩰', 70, 620, 56); em(g, '🎀', 420, 110, 44); em(g, '🎵', 400, 250, 34, { alpha: .6 }); return true; },
    turnzaal: (g, w, h) => { sky(g, w, h, '#f6e9d8', '#efdcc4', GROUND); floor(g, w, h, GROUND, '#e3cfb4', '#c9b08d', true); g.fillStyle = '#9fd8ff'; [20, 130, 240, 350].forEach(x => { g.beginPath(); g.roundRect(x, 30, 90, 70, 8); g.fill(); }); g.strokeStyle = '#b58b55'; g.lineWidth = 6; for (let y = 160; y < GROUND; y += 40) { g.beginPath(); g.moveTo(20, y); g.lineTo(120, y); g.stroke(); } g.beginPath(); g.moveTo(20, 150); g.lineTo(20, GROUND); g.moveTo(120, 150); g.lineTo(120, GROUND); g.stroke(); g.fillStyle = '#5aaeff'; g.beginPath(); g.roundRect(300, GROUND + 40, 200, 40, 10); g.fill(); em(g, '🏅', 420, 200, 56); em(g, '🤸', 400, 460, 0); return true; },
    disco: (g, w, h) => { sky(g, w, h, '#1a0f3a', '#3a1f6a', GROUND); [['#ff5da2', 40, 120], ['#5aaeff', 440, 360], ['#ffd23f', 240, 60], ['#3ddcb0', 240, 420]].forEach(([c, x1]) => spot(g, 240, x1, 90, c, .35, 60)); em(g, '🪩', 240, 70, 110); glow(g, 240, 70, 120, '#ffffff', .3); tiles(g, w, GROUND, h, '#ff5da2', '#ffd23f', 60); tint(g, w, h, '#000', .0); g.save(); g.globalAlpha = .35; tiles(g, w, GROUND, h, '#5aaeff', '#c47bff', 60); g.restore(); sparkles(g, w, h, 40, 71, '#fff', GROUND); em(g, '🎶', 80, 300, 40); em(g, '🎶', 400, 260, 34); return true; },
    sneeuw: (g, w, h) => { sky(g, w, h, '#c9dff5', '#f2f7fb', GROUND); [[80, 520, 1.1], [400, 540, .9], [240, 470, .6]].forEach(([x, y, s]) => { Avatar.blob(g, x, y - 80 * s, 46 * s, 92 * s, '#2e6b56'); Avatar.blob(g, x, y - 40 * s, 60 * s, 40 * s, '#3a8a6a'); Avatar.blob(g, x, y - 92 * s, 30 * s, 22 * s, '#ffffff'); }); const lg = g.createLinearGradient(0, GROUND - 40, 0, h); lg.addColorStop(0, '#ffffff'); lg.addColorStop(1, '#dbe8f5'); g.fillStyle = lg; g.beginPath(); g.moveTo(0, GROUND); g.quadraticCurveTo(120, GROUND - 40, 240, GROUND); g.quadraticCurveTo(360, GROUND + 30, w, GROUND - 10); g.lineTo(w, h); g.lineTo(0, h); g.fill(); em(g, '⛄', 90, 600, 90); snow(g, w, h, 81, 120); return true; },
    ijspaleis: (g, w, h) => { sky(g, w, h, '#dcefff', '#f5fbff', GROUND); [60, 420].forEach(x => { g.fillStyle = '#bfe3ff'; g.beginPath(); g.roundRect(x - 40, 150, 80, GROUND - 150, 10); g.fill(); g.beginPath(); g.moveTo(x - 46, 160); g.lineTo(x, 40); g.lineTo(x + 46, 160); g.fill(); }); g.fillStyle = '#a5d3f5'; g.beginPath(); g.roundRect(120, 220, 240, GROUND - 220, 12); g.fill(); g.beginPath(); g.moveTo(110, 230); g.lineTo(240, 110); g.lineTo(370, 230); g.fill(); g.fillStyle = '#8cc4ee'; g.beginPath(); g.moveTo(190, 230); g.lineTo(240, 170); g.lineTo(290, 230); g.fill(); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 3; [150, 200, 280, 330].forEach(x => { g.beginPath(); g.moveTo(x, 250); g.lineTo(x, GROUND); g.stroke(); }); floor(g, w, h, GROUND, '#e8f4ff', '#bfe3ff'); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 2; [[40, 600, 120, 690], [330, 590, 440, 700]].forEach(([a, b, c, d]) => { g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke(); }); sparkles(g, w, h, 30, 91, '#fff', GROUND); em(g, '❄️', 70, 90, 44); em(g, '❄️', 420, 60, 36); em(g, '❄️', 400, 330, 28); return true; },
    balzaal: (g, w, h) => { sky(g, w, h, '#f7e6ff', '#e9d3ff', GROUND); curtain(g, 0, 70, GROUND, '#c47bff'); curtain(g, w - 70, 70, GROUND, '#c47bff'); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.roundRect(150, 120, 180, 300, 90); g.fill(); g.strokeStyle = '#f1c232'; g.lineWidth = 6; g.stroke(); glow(g, 240, 60, 120, '#fff3b0', .6); g.strokeStyle = '#f1c232'; g.lineWidth = 4; g.beginPath(); g.moveTo(240, 0); g.lineTo(240, 30); g.stroke(); [0, 1, 2].forEach(i => { g.beginPath(); g.ellipse(240, 40 + i * 16, 50 + i * 24, 12 + i * 4, 0, 0, Math.PI); g.stroke(); }); for (let i = 0; i < 9; i++) em(g, '💡', 240 + (i - 4) * 24, 72 + Math.abs(i - 4) * 4, 14, { shadow: false }); floor(g, w, h, GROUND, '#f4ecf9', '#d9c6ea'); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; [60, 180, 300, 420].forEach(x => { g.beginPath(); g.moveTo(x, GROUND); g.lineTo(x + (x < 240 ? -40 : 40), h); g.stroke(); }); sparkles(g, w, h, 25, 101, '#fff6d6', GROUND); return true; },
    podium: (g, w, h) => { sky(g, w, h, '#1a1030', '#3a1f5a', GROUND); spot(g, 60, 200, 100, '#ff5da2', .3); spot(g, 420, 280, 100, '#5aaeff', .3); spot(g, 240, 240, 80, '#ffd23f', .25); const lg = g.createLinearGradient(0, GROUND, 0, h); lg.addColorStop(0, '#3a2a55'); lg.addColorStop(1, '#1a1030'); g.fillStyle = lg; g.fillRect(0, GROUND, w, h - GROUND); g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(0, GROUND - 3, w, 5); for (let i = 0; i < 12; i++) { g.fillStyle = ['#ff5da2', '#ffd23f', '#5aaeff', '#3ddcb0'][i % 4]; g.beginPath(); g.arc(20 + i * 40, GROUND + 22, 5, 0, 7); g.fill(); } em(g, '🎤', 70, 500, 60, { alpha: .9 }); em(g, '🔊', 430, 520, 64); em(g, '🎶', 100, 200, 40); em(g, '🎵', 400, 260, 34); sparkles(g, w, h, 30, 111, '#fff', GROUND); vignette(g, w, h, .3); return true; },
    ruimte: (g, w, h) => { sky(g, w, h, '#04061a', '#141545'); stars(g, w, h, 120, 121); em(g, '🪐', 380, 110, 110); em(g, '🌍', 90, 160, 80); em(g, '🚀', 400, 360, 70, { rot: -0.6 }); em(g, '⭐', 60, 380, 30); em(g, '🌙', 240, 60, 40); const lg = g.createLinearGradient(0, GROUND, 0, h); lg.addColorStop(0, '#c9cfe0'); lg.addColorStop(1, '#7d86a8'); g.fillStyle = lg; g.beginPath(); g.moveTo(0, GROUND + 20); g.quadraticCurveTo(240, GROUND - 40, w, GROUND + 20); g.lineTo(w, h); g.lineTo(0, h); g.fill(); g.fillStyle = 'rgba(0,0,0,.15)'; [[80, 640, 30, 10], [380, 680, 40, 12], [220, 700, 24, 8]].forEach(([x, y, rx, ry]) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); }); return true; },
    parijs: (g, w, h) => { sky(g, w, h, '#ffd1dc', '#ffe9a8', GROUND); sun(g, 380, 90, 30, '#fff3b0'); cloud(g, 100, 110, .8); em(g, '🗼', 300, 380, 300); floor(g, w, h, GROUND, '#e9d8c8', '#c9ad95'); em(g, '🥐', 70, 640, 44); em(g, '☕', 120, 660, 40); em(g, '🌹', 420, 660, 44); em(g, '🕊️', 80, 260, 36); return true; },
    regenboog: (g, w, h) => { sky(g, w, h, '#bfe6ff', '#eaf7ff', GROUND); const cols = ['#ff5c5c', '#ffb347', '#ffe94d', '#5fe38a', '#5aaeff', '#c47bff']; cols.forEach((c, i) => { g.strokeStyle = c; g.lineWidth = 24; g.beginPath(); g.arc(240, GROUND + 60, 330 - i * 24, Math.PI, 0); g.stroke(); }); cloud(g, 40, 520, 1.4); cloud(g, 440, 540, 1.4); cloud(g, 90, 110, .8); cloud(g, 380, 160, .7); floor(g, w, h, GROUND, '#8fe08f', '#5cc46a'); em(g, '🌸', 60, 600, 40); em(g, '🌼', 420, 620, 40); em(g, '🦄', 400, 520, 70); em(g, '🍭', 80, 660, 40); return true; },
    schip: (g, w, h) => { sky(g, w, h, '#f6b26b', '#ffd9a0', 420); sun(g, 80, 110, 36, '#ffe27a'); cloud(g, 360, 90, .8, '#ffe9c9'); const sea = g.createLinearGradient(0, 380, 0, 520); sea.addColorStop(0, '#2a6f97'); sea.addColorStop(1, '#4a9cc9'); g.fillStyle = sea; g.fillRect(0, 380, w, 160); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2.5; [410, 450, 490].forEach(y => { g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 40) g.quadraticCurveTo(x + 20, y - 8, x + 40, y); g.stroke(); }); floor(g, w, h, 520, '#b5804d', '#8a5a2b', true); g.strokeStyle = '#6e4520'; g.lineWidth = 10; g.beginPath(); g.moveTo(0, 520); g.lineTo(w, 520); g.stroke(); [20, 120, 360, 460].forEach(x => { g.beginPath(); g.moveTo(x, 470); g.lineTo(x, 520); g.stroke(); }); g.fillStyle = '#5c3a17'; g.fillRect(232, 0, 16, 520); em(g, '🏴‍☠️', 300, 90, 90); em(g, '⚓', 70, 620, 56); em(g, '🦜', 420, 300, 60); em(g, '🗺️', 420, 650, 50); return true; },
  };

  function draw(g, id, w, h) {
    g.save();
    const fn = SCENES[id] || SCENES.kamer;
    let ok = true;
    try { ok = fn(g, w, h) !== false; } catch (e) { console.warn('decor', id, e); sky(g, w, h, '#efe7fa', '#d8c9ee'); }
    g.restore();
    return ok;
  }

  /* ---------- miniaturen ---------- */
  let uid = 0; const pending = new Map();
  function thumb(id) { const k = ++uid; pending.set(k, id); return `<canvas class="bg-thumb" data-bg="${k}" width="160" height="240" aria-hidden="true"></canvas>`; }
  let scheduled = false;
  function mount() {
    scheduled = false;
    document.querySelectorAll('canvas[data-bg]:not([data-ok])').forEach(cv => {
      const id = pending.get(+cv.dataset.bg); if (!id) { cv.dataset.ok = '1'; return; }
      const big = document.createElement('canvas'); big.width = 480; big.height = 720;
      const ok = draw(big.getContext('2d'), id, 480, 720);
      const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height); g.drawImage(big, 0, 0, cv.width, cv.height);
      if (ok) { cv.dataset.ok = '1'; pending.delete(+cv.dataset.bg); }
    });
  }
  function schedule() { if (scheduled) return; scheduled = true; setTimeout(mount, 0); }
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  preload();

  return { draw, thumb, preload, GROUND };
})();

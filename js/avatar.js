/* ============================================================
   Catwalk Sterren — het model tekenen met de Sterreneiland-sprites

   Het poppetje is opgebouwd uit lagen uit assets/doll.png (zie
   tools/build-assets.py). Elke laag is grijs en wordt hier met een
   kleur vermenigvuldigd: huid, ogen, haar en stof krijgen zo elk hun
   eigen kleur, met de schaduwen van de 3D-illustratie erin.

   Coördinaten: frame van 400 x 400, nek op y = 180, voeten op y = 390,
   midden x = 200. Hoedjes, brillen, sieraden, tassen, spulletjes in je
   hand, vleugels en huisdieren zijn emoji (in de stijl van Sterreneiland)
   of kleine getekende 'klei'-vormpjes, geplaatst op de ogen/mond/hand-
   posities uit het manifest.

   API (dezelfde als vroeger, geeft HTML-strings terug):
     Avatar.render(look, outfit, opts)  -> <canvas> met het hele model
         opts.bg   : setting-id (decor erachter) of false
         opts.head : alleen het hoofd (voor het HUD-rondje)
         opts.items: losse items die niet in de catalogus staan
     Avatar.thumb(item, look)           -> <canvas> met alleen dit item
     Avatar.compose(look, outfit, opts) -> echt canvas-element (400x400) voor het dorp
     Avatar.stage(look, outfit, bgId)   -> canvas met decor + model (voor de foto)
   De canvassen worden getekend zodra ze in de pagina staan (MutationObserver).
   ============================================================ */

const Avatar = (() => {
  const M = DOLL_MANIFEST, F = M.frame, NECK = M.neck, FEET = M.feet;
  const HAIR_SPRITE = {
    bob: 0, staartjes: 1, krullen: 2, knot: 3, kort: 4, lang: 5, golvend: 6, staart: 7, zijstaart: 8, vlechten: 9,
    zijvlecht: 10, kroonvlecht: 11, afro: 12, afro_puffs: 13, spacebuns: 14, kort_krul: 15, bob_pony: 16, lang_pony: 17, halfop: 18, opgestoken: 19,
  };
  const HAND_R = [296, 296], HAND_L = [104, 296];
  const TOP = 90;                       // extra ruimte boven het frame voor hoge hoedjes
  const CH = F + TOP;                   // hoogte van een model-canvas
  const STAGE = { w: 480, h: 720, scale: 1.45, feet: 654 };
  const EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif';

  /* ---------- atlas ---------- */
  const atlas = new Image();
  let ready = false;
  atlas.onload = () => { ready = true; mountAll(); };
  atlas.onerror = () => console.warn('Poppetje laden mislukt: assets/doll.png');
  atlas.src = 'assets/doll.png';

  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const scratch = mk(F, F);

  /* ---------- kleurhulpjes ---------- */
  const hex2rgb = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const rgb2hex = (r, g, b) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { if (!/^#/.test(a)) return a; const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); };
  const light = (c, t = 0.3) => mix(c, '#ffffff', t);
  const dark = (c, t = 0.25) => mix(c, '#000000', t);
  const RAINBOW = ['#ff5c5c', '#ffb347', '#ffe94d', '#5fe38a', '#5aaeff', '#c47bff'];
  const isRainbow = c => c === 'rainbow';

  /* ---------- vormhulpjes ---------- */
  function starPath(ctx, cx, cy, r, ri = r * 0.45, n = 5) {
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) { const a = Math.PI / n * i - Math.PI / 2, rr = i % 2 ? ri : r; ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    ctx.closePath();
  }
  function heartPath(ctx, cx, cy, s) {
    ctx.beginPath(); ctx.moveTo(cx, cy + s * 0.9);
    ctx.bezierCurveTo(cx - s * 1.7, cy - s * 0.2, cx - s * 0.7, cy - s * 1.3, cx, cy - s * 0.35);
    ctx.bezierCurveTo(cx + s * 0.7, cy - s * 1.3, cx + s * 1.7, cy - s * 0.2, cx, cy + s * 0.9); ctx.closePath();
  }
  function ellipse(ctx, x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); ctx.closePath(); }
  function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.closePath(); }
  // 'klei'-bol: zachte 3D-schaduw zoals de illustraties
  function blob(ctx, x, y, rx, ry, c, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const g = ctx.createRadialGradient(-rx * 0.35, -ry * 0.4, Math.min(rx, ry) * 0.05, 0, 0, Math.max(rx, ry) * 1.15);
    g.addColorStop(0, light(c, .5)); g.addColorStop(.5, c); g.addColorStop(1, dark(c, .32));
    ctx.fillStyle = g; ellipse(ctx, 0, 0, rx, ry); ctx.fill(); ctx.restore();
  }
  // vult het huidige pad met een licht-naar-donker verloop over een kader
  function clayFill(ctx, c, x0, y0, x1, y1) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, light(c, .4)); g.addColorStop(.55, c); g.addColorStop(1, dark(c, .3));
    ctx.fillStyle = g; ctx.fill();
  }
  function sparkle(ctx, x, y, r, c = '#fff', a = .9) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = c; starPath(ctx, x, y, r, r * .35, 4); ctx.fill(); ctx.restore(); }
  function seeded(seed) { let s = seed; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

  /* ---------- emoji tekenen, eventueel in een andere kleur ---------- */
  const emojiCache = new Map();
  function emojiCanvas(ch, size, color) {
    const key = ch + '|' + size + '|' + (color || '');
    if (emojiCache.has(key)) return emojiCache.get(key);
    const pad = Math.ceil(size * 0.35), S = Math.ceil(size + pad * 2);
    const c = mk(S, S), g = c.getContext('2d');
    g.font = `${size}px ${EMOJI_FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(ch, S / 2, S / 2 + size * 0.04);
    if (color && /^#/.test(color)) recolor(g, S, S, color);
    emojiCache.set(key, c);
    return c;
  }
  // gekleurde delen van een emoji krijgen de doelkleur, wit/zwart/grijs blijft (schaduwen blijven)
  function recolor(g, w, h, hex) {
    let img; try { img = g.getImageData(0, 0, w, h); } catch (e) { return; }
    const d = img.data, T = hex2rgb(hex);
    const [th, ts, tl] = rgb2hsl(...T);
    const ls = [];
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 40) continue; const [, s, l] = rgb2hsl(d[i], d[i + 1], d[i + 2]); if (s > 0.22 && l > 0.1 && l < 0.93) ls.push(l); }
    if (!ls.length) return;
    ls.sort((a, b) => a - b); const med = ls[ls.length >> 1];
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 40) continue;
      const [, s, l] = rgb2hsl(d[i], d[i + 1], d[i + 2]);
      if (!(s > 0.22 && l > 0.1 && l < 0.93)) continue;
      const nl = Math.max(0.04, Math.min(0.97, tl + (l - med) * 0.9));
      const [r, gg, b] = hsl2rgb(th, ts < 0.08 ? 0 : Math.min(1, ts * (0.85 + s * 0.3)), nl);
      d[i] = r; d[i + 1] = gg; d[i + 2] = b;
    }
    g.putImageData(img, 0, 0);
  }
  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
    if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
    return [h, s, l];
  }
  function hsl2rgb(h, s, l) {
    if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = t => { t = (t + 1) % 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
    return [Math.round(f(h + 1 / 3) * 255), Math.round(f(h) * 255), Math.round(f(h - 1 / 3) * 255)];
  }
  // tekent een emoji met het midden op (x, y); geeft het kader terug
  function emoji(ctx, ch, x, y, size, o = {}) {
    const c = emojiCanvas(ch, size, o.color);
    ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); if (o.flip) ctx.scale(-1, 1); if (o.alpha != null) ctx.globalAlpha = o.alpha;
    if (o.shadow !== false) { ctx.shadowColor = 'rgba(40,20,60,.28)'; ctx.shadowBlur = size * 0.12; ctx.shadowOffsetY = size * 0.05; }
    ctx.drawImage(c, -c.width / 2, -c.height / 2); ctx.restore();
    const r = size * 0.6; return [x - r, y - r, x + r, y + r];
  }

  /* ---------- verf: kleur of patroon dat over een grijze laag wordt vermenigvuldigd ---------- */
  function designOf(it) { return { c: it.c && it.c.length ? it.c : ['#ffffff'], pattern: it.pattern || null }; }
  function paintDesign(g, d, w, h, ox, oy) {
    const c0 = d.c[0], c1 = d.c[1] || dark(c0, .2);
    g.save(); g.translate(-ox, -oy);            // patronen in frame-coördinaten, dan sluiten lagen op elkaar aan
    if (d.pattern === 'rainbow' || isRainbow(c0)) {
      const lg = g.createLinearGradient(0, oy, 0, oy + h);
      RAINBOW.forEach((c, i) => { lg.addColorStop(i / 6, c); lg.addColorStop((i + 1) / 6 - 0.001, c); });
      g.fillStyle = lg; g.fillRect(ox, oy, w, h); g.restore(); return;
    }
    g.fillStyle = c0; g.fillRect(ox, oy, w, h);
    g.fillStyle = c1; g.strokeStyle = c1;
    const x0 = Math.floor(ox / 24) * 24 - 24, y0 = Math.floor(oy / 24) * 24 - 24, x1 = ox + w + 24, y1 = oy + h + 24;
    switch (d.pattern) {
      case 'stripes': for (let y = y0; y < y1; y += 18) g.fillRect(x0, y, x1 - x0, 8); break;
      case 'dots': for (let y = y0; y < y1; y += 15) for (let x = x0; x < x1; x += 15) { g.beginPath(); g.arc(x + (y / 15 % 2) * 7, y, 3, 0, 7); g.fill(); } break;
      case 'hearts': for (let y = y0; y < y1; y += 20) for (let x = x0; x < x1; x += 20) { heartPath(g, x + (y / 20 % 2) * 10, y, 4.5); g.fill(); } break;
      case 'stars': for (let y = y0; y < y1; y += 22) for (let x = x0; x < x1; x += 22) { starPath(g, x + (y / 22 % 2) * 11, y, 5.5); g.fill(); } break;
      case 'checks': for (let y = y0; y < y1; y += 16) for (let x = x0; x < x1; x += 16) { if (((x + y) / 16) % 2 === 0) g.fillRect(x, y, 16, 16); } break;
      case 'scales': g.lineWidth = 2; for (let y = y0; y < y1; y += 12) for (let x = x0; x < x1; x += 16) { g.beginPath(); g.arc(x + (y / 12 % 2) * 8, y, 8, 0, Math.PI); g.stroke(); } break;
      case 'flowers': for (let y = y0; y < y1; y += 26) for (let x = x0; x < x1; x += 26) { const fx = x + (y / 26 % 2) * 13; for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; g.beginPath(); g.arc(fx + Math.cos(a) * 4, y + Math.sin(a) * 4, 3, 0, 7); g.fill(); } g.fillStyle = '#ffe27a'; g.beginPath(); g.arc(fx, y, 2.2, 0, 7); g.fill(); g.fillStyle = c1; } break;
      case 'glitter': { const r = seeded(7); for (let i = 0; i < 90; i++) { const x = ox + r() * w, y = oy + r() * h; g.fillStyle = i % 3 ? '#ffffff' : light(c1, .5); starPath(g, x, y, 2 + r() * 3, 1, 4); g.fill(); } break; }
    }
    g.restore();
  }
  // tekent één atlaslaag; fill = null (kleur laten), een kleurstring, of een design-object
  function drawLayer(ctx, name, fill) {
    const L = M.layers[name]; if (!L) return;
    const [ax, ay, w, h, ox, oy] = L;
    if (!fill) { ctx.drawImage(atlas, ax, ay, w, h, ox, oy, w, h); return; }
    const g = scratch.getContext('2d');
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, w, h);
    g.drawImage(atlas, ax, ay, w, h, 0, 0, w, h);
    g.globalCompositeOperation = 'multiply';
    if (typeof fill === 'string') { g.fillStyle = fill; g.fillRect(0, 0, w, h); } else paintDesign(g, fill, w, h, ox, oy);
    g.globalCompositeOperation = 'destination-in'; g.drawImage(atlas, ax, ay, w, h, 0, 0, w, h);
    g.restore();
    ctx.drawImage(scratch, 0, 0, w, h, ox, oy, w, h);
  }
  const layerBox = name => { const L = M.layers[name]; return L ? [L[4], L[5], L[4] + L[2], L[5] + L[3]] : null; };
  const union = boxes => { const b = boxes.filter(Boolean); if (!b.length) return null; return [Math.min(...b.map(x => x[0])), Math.min(...b.map(x => x[1])), Math.max(...b.map(x => x[2])), Math.max(...b.map(x => x[3]))]; };

  /* ---------- welke sprite hoort bij welke kledingvorm ---------- */
  // een 'stap' is { k: laagsleutel, d: design, sx: extra breedte } ; k = T0..T3 tops, B0..B7 broeken/rokken, J1..J3 jasjes, S0..S3 schoenen, D jurk
  const second = (it, fb = '#ffffff') => ({ c: [it.c[1] || fb] });
  const TOP_RECIPES = {
    tshirt: it => [{ k: 'T0', d: designOf(it) }],
    tank: it => [{ k: 'T0', d: designOf(it) }],
    sportshirt: it => [{ k: 'T0', d: designOf(it) }],
    leotard: it => [{ k: 'T0', d: designOf(it) }],
    sweater: it => [{ k: 'T2', d: designOf(it) }],
    turtleneck: it => [{ k: 'T2', d: designOf(it) }],
    hero: it => [{ k: 'T2', d: designOf(it) }],
    polo: it => [{ k: 'T3', d: designOf(it) }],
    blouse: it => [{ k: 'T3', d: designOf(it) }],
    pirateshirt: it => [{ k: 'T3', d: designOf(it) }],
    hoodie: it => [{ k: 'T0', d: second(it) }, { k: 'J2', d: designOf(it) }],
    trackjacket: it => [{ k: 'T0', d: second(it) }, { k: 'J2', d: designOf(it) }],
    cardigan: it => [{ k: 'T0', d: second(it) }, { k: 'J1', d: designOf(it) }],
    leather: it => [{ k: 'T0', d: second(it, '#eeeeee') }, { k: 'J1', d: designOf(it) }],
    puffer: it => [{ k: 'T2', d: second(it) }, { k: 'J3', d: designOf(it) }],
    raincoat: it => [{ k: 'T2', d: { c: ['#ffffff'] } }, { k: 'J3', d: designOf(it) }],
    tuxedo: it => [{ k: 'T3', d: second(it) }, { k: 'J3', d: designOf(it) }],
    spacesuit: it => [{ k: 'T2', d: designOf(it) }, { k: 'J3', d: designOf(it) }],
  };
  const BOTTOM_KEY = { pants: 'B0', joggers: 'B0', shorts: 'B1', sportshorts: 'B1', legging: 'B3', skirt: 'B4', pleated: 'B5', tutu: 'B6' };
  const BOTTOM_BY_ID = { bot_rok_spijker: 'B7', bot_baggy: 'B2', bot_jogging_grijs: 'B2', bot_jogging_zwart: 'B2', bot_jogging_roze: 'B2' };
  const bottomRecipe = it => it.shape === 'wideleg' ? [{ k: 'Bwide', d: designOf(it), custom: 'wideleg' }] : [{ k: BOTTOM_BY_ID[it.id] || BOTTOM_KEY[it.shape] || 'B0', d: designOf(it) }];
  const DRESS_RECIPES = {
    aline: it => [{ k: 'D', d: designOf(it) }],
    sundress: it => [{ k: 'D', d: designOf(it) }],
    witch: it => [{ k: 'D', d: designOf(it) }],
    ballgown: it => [{ k: 'D', d: designOf(it) }, { k: 'B6', d: designOf(it), sx: 1.22, fab: true }],
    princess: it => [{ k: 'D', d: designOf(it) }, { k: 'B5', d: designOf(it), sx: 1.18, fab: true }],
    mermaid: it => [{ k: 'B3', d: designOf(it) }, { k: 'D', d: designOf(it) }],
    jumpsuit: it => [{ k: 'B2', d: designOf(it) }, { k: 'T2', d: designOf(it) }],
    onesie: it => [{ k: 'B2', d: designOf(it) }, { k: 'T2', d: designOf(it) }],
    overall: it => [{ k: 'B0', d: designOf(it) }, { k: 'T0', d: second(it) }],
    swimsuit: it => [{ k: 'B1', d: designOf(it) }, { k: 'T0', d: designOf(it) }],
  };
  const SHOE_KEY = { sneaker: 'S0', boot: 'S1', rainboot: 'S1', snowboot: 'S1', monster: 'S1', bunny: 'S1', pirateboot: 'S2', spaceboot: 'S2', heels: 'S3', dress: 'S3', ballet: 'S3', flipflop: 'S3', clog: 'S3', sandal: 'S3', elf: 'S3', platform: 'S3' };
  const SHOE_BY_ID = { sh_rijlaarzen: 'S2', sh_cowboy: 'S2', sh_boots: 'S2', sh_hightops: 'S1' };
  const shoeRecipe = it => ['pumps', 'heels'].includes(it.shape) ? [{ k: 'Spumps', d: designOf(it), custom: 'pumps' }] : [{ k: SHOE_BY_ID[it.id] || SHOE_KEY[it.shape] || 'S0', d: designOf(it) }];
  const SUBLAYERS = { T: ['skin', 'fab', 'keep'], B: ['skin', 'fab', 'keep'], D: ['skin', 'fab', 'keep'], J: ['fab', 'skin'], S: ['fab', 'keep'] };

  // Eigen silhouetten, gedeeld door de miniaturen en het aangeklede model.
  function drawTailored(ctx, step, skin) {
    const color = step.d.c[0];
    if (step.custom === 'wideleg') {
      if (!step.fab) drawLayer(ctx, 'B0_skin', skin);
      ctx.beginPath(); ctx.moveTo(157, 239); ctx.lineTo(240, 239);
      ctx.quadraticCurveTo(241, 292, 259, 372);
      ctx.quadraticCurveTo(233, 378, 207, 372);
      ctx.lineTo(200, 289); ctx.lineTo(193, 372);
      ctx.quadraticCurveTo(168, 378, 140, 372);
      ctx.quadraticCurveTo(155, 292, 157, 239); ctx.closePath();
      ctx.save(); ctx.clip();
      ctx.save(); ctx.translate(138, 239);
      paintDesign(ctx, step.d, 124, 140, 138, 239);
      ctx.restore();
      const shade = ctx.createLinearGradient(140, 0, 260, 0);
      [[0,'#00000055'],[.22,'#ffffff22'],[.47,'#00000044'],[.55,'#00000033'],[.78,'#ffffff22'],[1,'#00000055']].forEach(([p,c])=>shade.addColorStop(p,c));
      ctx.fillStyle = shade; ctx.fillRect(138, 239, 124, 140);
      ctx.strokeStyle = dark(color, .22); ctx.lineWidth = 1.5;
      [177, 222].forEach(x=>{ctx.beginPath();ctx.moveTo(x,256);ctx.lineTo(x+(x<200?-7:7),369);ctx.stroke();});
      ctx.strokeStyle = light(color, .25); ctx.beginPath();ctx.moveTo(153,251);ctx.lineTo(244,251);ctx.stroke();
      ctx.restore();
      blob(ctx, 200, 246, 2.5, 2.5, '#c5b68d');
      return;
    }
    [-1, 1].forEach(side => {
      ctx.save(); ctx.translate(200, 0); ctx.scale(side, 1);
      // Three-quarter pumps: the block heel and the arch remain visible below the upper.
      rrect(ctx, 9, 379, 9, 14, 2); clayFill(ctx, dark(color,.25), 9,379,18,393);
      ctx.beginPath();ctx.moveTo(9,363);ctx.quadraticCurveTo(17,367,24,363);
      ctx.quadraticCurveTo(28,373,42,378);ctx.quadraticCurveTo(50,382,43,388);
      ctx.lineTo(31,390);ctx.quadraticCurveTo(23,378,10,382);ctx.closePath();
      clayFill(ctx,color,10,361,44,389);
      ctx.strokeStyle=dark(color,.45);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(31,390);ctx.quadraticCurveTo(45,389,47,385);ctx.stroke();
      ctx.strokeStyle=light(color,.5);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(28,377);ctx.quadraticCurveTo(35,378,40,382);ctx.stroke();
      ctx.restore();
    });
  }
  function drawStep(ctx, step, skin) {
    if (step.custom) { ctx.save(); drawTailored(ctx, step, skin); ctx.restore(); return; }
    const subs = step.fab ? ['fab'] : SUBLAYERS[step.k[0]];
    ctx.save();
    if (step.sx && step.sx !== 1) { ctx.translate(200, 0); ctx.scale(step.sx, 1); ctx.translate(-200, 0); }
    subs.forEach(s => drawLayer(ctx, `${step.k}_${s}`, s === 'skin' ? skin : s === 'fab' ? step.d : null));
    ctx.restore();
  }
  const stepBox = step => step.custom === 'wideleg' ? [138, 239, 260, 375] : step.custom === 'pumps' ? [152, 357, 247, 394] : union(SUBLAYERS[step.k[0]].map(s => layerBox(`${step.k}_${s}`)));

  /* ---------- hoofd ---------- */
  const headIndex = hairItem => HAIR_SPRITE[(hairItem || {}).shape] ?? 5;
  function headGeo(hi) {
    const H = M.heads[hi];
    const [x0, y0, x1, y1] = H.box, [fx0, fy0, fx1, fy1] = H.face;
    return { hi, eyes: H.eyes, iris: H.iris, mouth: H.mouth, top: H.top, box: H.box, face: H.face, cx: (fx0 + fx1) / 2, faceW: fx1 - fx0, headW: x1 - x0, eyeY: (H.eyes[0][1] + H.eyes[1][1]) / 2 };
  }
  function hairDesign(look) {
    const hc = HAIR_COLORS.find(h => h.id === look.hairColor) || HAIR_COLORS[2];
    return isRainbow(hc.c) ? { c: ['rainbow'] } : hc.c;
  }
  function drawHead(ctx, geo, look, o = {}) {
    const skin = (SKINS.find(s => s.id === look.skin) || SKINS[1]).c;
    const eye = (EYES.find(e => e.id === look.eyes) || EYES[0]).c;
    const h = `H${geo.hi}_`;
    drawLayer(ctx, h + 'skin', skin);
    drawLayer(ctx, h + 'eye', eye);
    drawLayer(ctx, h + 'keep', null);
    if (!o.noHair) drawLayer(ctx, h + 'hair', hairDesign(look));
  }

  /* ---------- accessoires ---------- */
  // Elke tekenfunctie krijgt (ctx, item, geo) en geeft het kader [x0, y0, x1, y1] terug.
  const c0 = it => it.c[0] || '#ff5da2', c1 = it => it.c[1] || dark(it.c[0] || '#ff5da2', .25);
  const E = (ch, x, y, size, o) => (ctx, it, g) => emoji(ctx, ch, typeof x === 'function' ? x(g) : x, typeof y === 'function' ? y(g) : y, size, Object.assign({}, o, o && o.tint != null ? { color: it.c[o.tint] } : {}));

  function dome(ctx, g, c, lift = 0, w = 1) {                          // koepel op het hoofd (muts, helm)
    const top = g.top - lift, cy = top + 46, rx = g.headW / 2 * w + 4;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, F, cy); ctx.clip(); blob(ctx, g.cx, cy, rx, 52, c); ctx.restore();
    return [g.cx - rx, top - 6, g.cx + rx, cy];
  }
  function cone(ctx, g, c, h, halfBase, tilt = 0, shade = true) {          // punthoed / feesthoed
    const bx = g.cx, by = g.top + 14;
    ctx.beginPath(); ctx.moveTo(bx - halfBase, by); ctx.quadraticCurveTo(bx - halfBase * 0.2, by - h * 0.55, bx + tilt, by - h); ctx.quadraticCurveTo(bx + halfBase * 0.55, by - h * 0.5, bx + halfBase, by); ctx.closePath();
    if (shade) clayFill(ctx, c, bx - halfBase, by - h, bx + halfBase, by); else { ctx.fillStyle = c; ctx.fill(); }
    return [bx - halfBase, by - h - 6, bx + halfBase + Math.max(0, tilt), by + 4];
  }
  function brim(ctx, g, c, rx, ry, dy = 22) { blob(ctx, g.cx, g.top + dy, rx, ry, c); return [g.cx - rx, g.top + dy - ry, g.cx + rx, g.top + dy + ry]; }

  const HATS = {
    butterflyclip: E('🦋', g => g.cx + 54, g => g.top + 42, 45, { tint: 0, rot: .25 }),
    daisyclip: E('🌼', g => g.cx - 54, g => g.top + 42, 38),
    starclips: (ctx, it, g) => { [-1, 1].forEach(s => { starPath(ctx, g.cx + s * 55, g.top + 42, 15); clayFill(ctx, c0(it), g.cx - 70, g.top + 27, g.cx + 70, g.top + 57); }); return [g.cx - 72, g.top + 25, g.cx + 72, g.top + 59]; },
    bowband: E('🎀', g => g.cx + g.headW * 0.28, g => g.top + 22, 62, { tint: 0, rot: 0.25 }),
    cap: E('🧢', g => g.cx, g => g.top + 12, 120, { tint: 0 }),
    crown: E('👑', g => g.cx, g => g.top - 4, 96, { tint: 0 }),
    sunhat: E('👒', g => g.cx, g => g.top + 4, 150),
    headphones: E('🎧', g => g.cx, g => g.eyeY - 40, 150, { tint: 0 }),
    santa: (ctx, it, g) => { const b = dome(ctx, g, c0(it), 6); ctx.save(); ctx.translate(g.cx + 60, g.top + 4); ctx.rotate(0.5); blob(ctx, 0, 0, 34, 16, c0(it)); ctx.restore(); blob(ctx, g.cx + 92, g.top + 26, 14, 14, '#ffffff'); rrect(ctx, g.cx - g.headW / 2 - 6, g.top + 30, g.headW + 12, 18, 9); clayFill(ctx, '#ffffff', 0, g.top + 30, 0, g.top + 48); return union([b, [g.cx + 70, g.top - 10, g.cx + 108, g.top + 42]]); },
    beanie: (ctx, it, g) => { const b = dome(ctx, g, c0(it), 10); rrect(ctx, g.cx - g.headW / 2 - 6, g.top + 26, g.headW + 12, 20, 10); clayFill(ctx, c1(it), 0, g.top + 26, 0, g.top + 46); blob(ctx, g.cx, g.top - 10, 17, 17, c1(it)); return union([b, [g.cx - 20, g.top - 28, g.cx + 20, g.top]]); },
    helmet: (ctx, it, g) => { const b = dome(ctx, g, c0(it), 6, 1.05); rrect(ctx, g.cx - g.headW / 2 - 4, g.top + 34, g.headW + 8, 12, 6); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fill(); return b; },
    swimcap: (ctx, it, g) => { const cy = g.eyeY - 30; ctx.save(); ctx.beginPath(); ctx.rect(0, 0, F, cy + 4); ctx.clip(); blob(ctx, g.cx, cy, g.faceW / 2 + 22, cy - g.top + 40, c0(it)); ctx.restore(); emoji(ctx, '🌼', g.cx + 38, g.top + 40, 34, { shadow: false }); return [g.cx - g.faceW / 2 - 22, g.top - 6, g.cx + g.faceW / 2 + 22, cy + 4]; },
    rainhat: (ctx, it, g) => { const br = brim(ctx, g, c0(it), g.headW / 2 + 30, 20, 40); const d = dome(ctx, g, c0(it), 0, 0.85); return union([br, d]); },
    bucket: (ctx, it, g) => { const b = dome(ctx, g, c0(it), 0, 0.9); ctx.beginPath(); ctx.moveTo(g.cx - g.headW / 2 - 24, g.top + 48); ctx.lineTo(g.cx - g.headW / 2 + 4, g.top + 32); ctx.lineTo(g.cx + g.headW / 2 - 4, g.top + 32); ctx.lineTo(g.cx + g.headW / 2 + 24, g.top + 48); ctx.quadraticCurveTo(g.cx, g.top + 60, g.cx - g.headW / 2 - 24, g.top + 48); ctx.closePath(); clayFill(ctx, c1(it), g.cx - 60, g.top + 30, g.cx + 60, g.top + 60); return union([b, [g.cx - g.headW / 2 - 24, g.top + 30, g.cx + g.headW / 2 + 24, g.top + 60]]); },
    beret: (ctx, it, g) => { blob(ctx, g.cx + 14, g.top + 14, 74, 26, c0(it), -0.14); blob(ctx, g.cx + 10, g.top - 8, 5, 6, dark(c0(it), .3)); return [g.cx - 62, g.top - 16, g.cx + 90, g.top + 42]; },
    witchhat: (ctx, it, g) => { const br = brim(ctx, g, c0(it), g.headW / 2 + 28, 16, 20); const co = cone(ctx, g, c0(it), 96, 46, -24); rrect(ctx, g.cx - 44, g.top - 4, 88, 16, 6); clayFill(ctx, c1(it), 0, g.top - 4, 0, g.top + 12); return union([br, co]); },
    partyhat: (ctx, it, g) => { const co = cone(ctx, g, c0(it), 84, 32, 0); ctx.save(); ctx.clip(); ctx.fillStyle = c1(it); for (let y = g.top - 90; y < g.top + 20; y += 22) { ctx.beginPath(); ctx.moveTo(g.cx - 50, y + 12); ctx.lineTo(g.cx + 50, y - 4); ctx.lineTo(g.cx + 50, y + 6); ctx.lineTo(g.cx - 50, y + 22); ctx.fill(); } ctx.restore(); blob(ctx, g.cx, g.top - 72, 11, 11, c1(it)); return union([co, [g.cx - 12, g.top - 84, g.cx + 12, g.top]]); },
    hennin: (ctx, it, g) => { ctx.save(); ctx.globalAlpha = .55; ctx.fillStyle = c1(it); ctx.beginPath(); ctx.moveTo(g.cx + 8, g.top - 88); ctx.quadraticCurveTo(g.cx + 90, g.top - 30, g.cx + 70, g.top + 120); ctx.quadraticCurveTo(g.cx + 40, g.top + 40, g.cx + 8, g.top - 88); ctx.fill(); ctx.restore(); const co = cone(ctx, g, c0(it), 100, 30, 8); return union([co, [g.cx, g.top - 90, g.cx + 92, g.top + 120]]); },
    tiara: (ctx, it, g) => { const y = g.top + 22; ctx.beginPath(); ctx.moveTo(g.cx - 44, y + 8); for (let i = -2; i <= 2; i++) { ctx.lineTo(g.cx + i * 22 - 11, y + 8); ctx.lineTo(g.cx + i * 22, y - (i === 0 ? 26 : 16)); } ctx.lineTo(g.cx + 44, y + 8); ctx.lineTo(g.cx + 40, y + 14); ctx.lineTo(g.cx - 40, y + 14); ctx.closePath(); clayFill(ctx, c0(it), g.cx - 44, y - 26, g.cx + 44, y + 14); blob(ctx, g.cx, y - 14, 6, 6, c1(it)); blob(ctx, g.cx - 22, y - 6, 4, 4, c1(it)); blob(ctx, g.cx + 22, y - 6, 4, 4, c1(it)); return [g.cx - 46, y - 30, g.cx + 46, y + 16]; },
    catears: (ctx, it, g) => { [-1, 1].forEach(s => { const x = g.cx + s * g.headW * 0.3, y = g.top + 16; ctx.beginPath(); ctx.moveTo(x - 22, y + 6); ctx.lineTo(x + s * 4, y - 40); ctx.lineTo(x + 22, y + 6); ctx.closePath(); clayFill(ctx, c0(it), x - 22, y - 40, x + 22, y + 6); ctx.beginPath(); ctx.moveTo(x - 11, y + 2); ctx.lineTo(x + s * 2, y - 24); ctx.lineTo(x + 11, y + 2); ctx.closePath(); ctx.fillStyle = c1(it); ctx.fill(); }); return [g.cx - g.headW * 0.3 - 24, g.top - 26, g.cx + g.headW * 0.3 + 24, g.top + 24]; },
    bunnyears: (ctx, it, g) => { [-1, 1].forEach(s => { const x = g.cx + s * 34; blob(ctx, x, g.top - 24, 17, 52, c0(it), s * 0.14); blob(ctx, x, g.top - 22, 8, 38, c1(it), s * 0.14); }); return [g.cx - 60, g.top - 80, g.cx + 60, g.top + 30]; },
    flowercrown: (ctx, it, g) => { const cols = ['🌸', '🌼', '🌺', '🌼', '🌸']; cols.forEach((f, i) => { const a = (i - 2) / 2; emoji(ctx, f, g.cx + a * g.headW * 0.42, g.top + 24 - Math.cos(a * 1.3) * 12, 32, { shadow: false }); }); return [g.cx - g.headW * 0.5, g.top - 6, g.cx + g.headW * 0.5, g.top + 44]; },
    unicorn: (ctx, it, g) => { const b = cone(ctx, g, c0(it), 72, 14, 0); ctx.strokeStyle = c1(it); ctx.lineWidth = 3; for (let i = 1; i < 5; i++) { const y = g.top + 14 - i * 13, w = 14 * (1 - i / 5.5); ctx.beginPath(); ctx.moveTo(g.cx - w, y + 3); ctx.lineTo(g.cx + w, y - 3); ctx.stroke(); } emoji(ctx, '🌸', g.cx - 26, g.top + 18, 26, { shadow: false }); emoji(ctx, '🌼', g.cx + 26, g.top + 18, 26, { shadow: false }); return union([b, [g.cx - 40, g.top - 80, g.cx + 40, g.top + 32]]); },
    spacehelmet: (ctx, it, g) => { const cy = (g.top + g.mouth[1]) / 2 + 6, r = Math.max(g.headW, g.mouth[1] - g.top) / 2 + 18; ctx.save(); ctx.globalAlpha = .28; blob(ctx, g.cx, cy, r, r, '#bfe3ff'); ctx.restore(); ctx.lineWidth = 8; ctx.strokeStyle = c0(it); ellipse(ctx, g.cx, cy, r, r); ctx.stroke(); ctx.save(); ctx.globalAlpha = .5; ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(g.cx - r * 0.3, cy - r * 0.3, r * 0.55, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke(); ctx.restore(); return [g.cx - r - 6, cy - r - 6, g.cx + r + 6, cy + r + 6]; },
    bandana: (ctx, it, g) => { const y = g.top + 10; ctx.beginPath(); ctx.moveTo(g.cx - g.headW / 2 - 6, y + 30); ctx.quadraticCurveTo(g.cx, y - 22, g.cx + g.headW / 2 + 6, y + 30); ctx.quadraticCurveTo(g.cx, y + 44, g.cx - g.headW / 2 - 6, y + 30); ctx.closePath(); clayFill(ctx, c0(it), g.cx - 60, y - 20, g.cx + 60, y + 40); ctx.save(); ctx.clip(); ctx.fillStyle = c1(it); for (let yy = y - 20; yy < y + 44; yy += 12) for (let x = g.cx - 90; x < g.cx + 90; x += 12) { ctx.beginPath(); ctx.arc(x + (yy % 24 ? 6 : 0), yy, 2.4, 0, 7); ctx.fill(); } ctx.restore(); blob(ctx, g.cx + g.headW / 2 + 12, y + 34, 12, 8, c0(it), 0.5); return [g.cx - g.headW / 2 - 8, y - 22, g.cx + g.headW / 2 + 26, y + 46]; },
    sweatband: (ctx, it, g) => { const y = g.eyeY - 40; rrect(ctx, g.cx - g.faceW / 2 - 4, y - 9, g.faceW + 8, 18, 9); clayFill(ctx, c0(it), 0, y - 9, 0, y + 9); return [g.cx - g.faceW / 2 - 4, y - 10, g.cx + g.faceW / 2 + 4, y + 10]; },
    piratehat: (ctx, it, g) => { const y = g.top + 20; ctx.beginPath(); ctx.moveTo(g.cx - g.headW / 2 - 30, y + 12); ctx.quadraticCurveTo(g.cx - 40, y - 60, g.cx, y - 36); ctx.quadraticCurveTo(g.cx + 40, y - 60, g.cx + g.headW / 2 + 30, y + 12); ctx.quadraticCurveTo(g.cx, y + 30, g.cx - g.headW / 2 - 30, y + 12); ctx.closePath(); clayFill(ctx, c0(it), g.cx - 60, y - 60, g.cx + 60, y + 30); emoji(ctx, '☠️', g.cx, y - 12, 30, { shadow: false }); return [g.cx - g.headW / 2 - 32, y - 62, g.cx + g.headW / 2 + 32, y + 32]; },
    veil: (ctx, it, g) => { ctx.save(); ctx.globalAlpha = .45; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(g.cx - g.headW / 2 - 10, g.top + 20); ctx.quadraticCurveTo(g.cx - g.headW / 2 - 60, 250, g.cx - g.headW / 2 - 20, 350); ctx.lineTo(g.cx + g.headW / 2 + 20, 350); ctx.quadraticCurveTo(g.cx + g.headW / 2 + 60, 250, g.cx + g.headW / 2 + 10, g.top + 20); ctx.quadraticCurveTo(g.cx, g.top - 10, g.cx - g.headW / 2 - 10, g.top + 20); ctx.fill(); ctx.restore(); HATS.tiara(ctx, { c: [c1(it), '#ffffff'] }, g); return [g.cx - g.headW / 2 - 60, g.top - 30, g.cx + g.headW / 2 + 60, 350]; },
  };

  const GLASSES = {
    round: (ctx, it, g) => { const r = g.iris + 7; ctx.lineWidth = 5; ctx.strokeStyle = c0(it); g.eyes.forEach(([x, y]) => { ellipse(ctx, x, y, r, r); ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fill(); ctx.restore(); ctx.stroke(); }); ctx.beginPath(); ctx.moveTo(g.eyes[0][0] + r, g.eyeY); ctx.lineTo(g.eyes[1][0] - r, g.eyeY); ctx.stroke(); return [g.eyes[0][0] - r - 4, g.eyeY - r - 4, g.eyes[1][0] + r + 4, g.eyeY + r + 4]; },
    sunglasses: (ctx, it, g) => { const r = g.iris + 8; g.eyes.forEach(([x, y]) => { rrect(ctx, x - r, y - r * 0.8, r * 2, r * 1.7, 10); clayFill(ctx, c0(it), x - r, y - r, x + r, y + r); ctx.save(); ctx.globalAlpha = .35; ctx.fillStyle = '#fff'; ellipse(ctx, x - r * 0.35, y - r * 0.35, r * 0.4, r * 0.2, -0.5); ctx.fill(); ctx.restore(); }); ctx.lineWidth = 5; ctx.strokeStyle = c0(it); ctx.beginPath(); ctx.moveTo(g.eyes[0][0] + r, g.eyeY - 4); ctx.lineTo(g.eyes[1][0] - r, g.eyeY - 4); ctx.stroke(); return [g.eyes[0][0] - r - 4, g.eyeY - r - 4, g.eyes[1][0] + r + 4, g.eyeY + r + 4]; },
    goggles: (ctx, it, g) => { const r = g.iris + 10, x0 = g.eyes[0][0] - r, x1 = g.eyes[1][0] + r; rrect(ctx, x0 - 4, g.eyeY - r - 2, x1 - x0 + 8, r * 2 + 4, 18); clayFill(ctx, c0(it), x0, g.eyeY - r, x1, g.eyeY + r); rrect(ctx, x0 + 4, g.eyeY - r + 6, x1 - x0 - 8, r * 2 - 12, 12); ctx.fillStyle = 'rgba(190,230,255,.55)'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = c0(it); ctx.beginPath(); ctx.moveTo(x0, g.eyeY); ctx.lineTo(g.cx - g.headW / 2, g.eyeY - 6); ctx.moveTo(x1, g.eyeY); ctx.lineTo(g.cx + g.headW / 2, g.eyeY - 6); ctx.stroke(); return [x0 - 6, g.eyeY - r - 4, x1 + 6, g.eyeY + r + 4]; },
    stars: (ctx, it, g) => { const r = g.iris + 12; ctx.save(); ctx.globalAlpha = .9; g.eyes.forEach(([x, y]) => { starPath(ctx, x, y, r, r * .5); clayFill(ctx, c0(it), x - r, y - r, x + r, y + r); }); ctx.restore(); ctx.lineWidth = 4; ctx.strokeStyle = c0(it); ctx.beginPath(); ctx.moveTo(g.eyes[0][0] + r * .6, g.eyeY); ctx.lineTo(g.eyes[1][0] - r * .6, g.eyeY); ctx.stroke(); return [g.eyes[0][0] - r, g.eyeY - r, g.eyes[1][0] + r, g.eyeY + r]; },
    hearts: (ctx, it, g) => { const r = g.iris + 4; ctx.save(); ctx.globalAlpha = .9; g.eyes.forEach(([x, y]) => { heartPath(ctx, x, y + 2, r); clayFill(ctx, c0(it), x - r, y - r, x + r, y + r); }); ctx.restore(); ctx.lineWidth = 4; ctx.strokeStyle = c0(it); ctx.beginPath(); ctx.moveTo(g.eyes[0][0] + r * 1.3, g.eyeY); ctx.lineTo(g.eyes[1][0] - r * 1.3, g.eyeY); ctx.stroke(); return [g.eyes[0][0] - r * 2, g.eyeY - r * 1.5, g.eyes[1][0] + r * 2, g.eyeY + r * 1.5]; },
    heromask: (ctx, it, g) => { const r = g.iris + 6, x0 = g.eyes[0][0] - r - 16, x1 = g.eyes[1][0] + r + 16; ctx.beginPath(); ctx.moveTo(x0, g.eyeY - 4); ctx.quadraticCurveTo(g.cx, g.eyeY - r - 26, x1, g.eyeY - 4); ctx.quadraticCurveTo(x1 + 6, g.eyeY + r + 6, g.cx, g.eyeY + r); ctx.quadraticCurveTo(x0 - 6, g.eyeY + r + 6, x0, g.eyeY - 4); ctx.closePath(); g.eyes.forEach(([x, y]) => { ctx.moveTo(x + r, y); ctx.ellipse(x, y, r, r * 0.85, 0, 0, Math.PI * 2); }); const lg = ctx.createLinearGradient(x0, g.eyeY - 30, x1, g.eyeY + 20); lg.addColorStop(0, light(c0(it), .35)); lg.addColorStop(1, dark(c0(it), .3)); ctx.fillStyle = lg; ctx.fill('evenodd'); return [x0 - 6, g.eyeY - r - 26, x1 + 6, g.eyeY + r + 8]; },
    eyepatch: (ctx, it, g) => { const [x, y] = g.eyes[1], r = g.iris + 8; ctx.lineWidth = 4; ctx.strokeStyle = c0(it); ctx.beginPath(); ctx.moveTo(g.cx - g.headW / 2 + 4, g.eyeY - 30); ctx.lineTo(x, y - r); ctx.lineTo(g.cx + g.headW / 2 - 4, y - 22); ctx.stroke(); blob(ctx, x, y, r, r * 0.9, c0(it)); return [g.cx - g.headW / 2, g.eyeY - 32, g.cx + g.headW / 2, y + r]; },
    skigoggles: (ctx, it, g) => GLASSES.goggles(ctx, it, g),
  };

  const NY = 204;   // hoogte van de halslijn
  const NECKS = {
    pendant: (ctx, it, g) => { ctx.lineWidth = 2.5; ctx.strokeStyle = c0(it); ctx.beginPath(); ctx.moveTo(g.cx - 26, NY - 6); ctx.quadraticCurveTo(g.cx, NY + 30, g.cx + 26, NY - 6); ctx.stroke(); if (it.deco === 'star') { starPath(ctx, g.cx, NY + 20, 9); clayFill(ctx, c1(it), g.cx - 9, NY + 11, g.cx + 9, NY + 29); } else { heartPath(ctx, g.cx, NY + 18, 7); clayFill(ctx, c1(it), g.cx - 8, NY + 10, g.cx + 8, NY + 26); } return [g.cx - 28, NY - 8, g.cx + 28, NY + 32]; },
    diamond: (ctx, it, g) => { ctx.lineWidth = 2.5; ctx.strokeStyle = c0(it); ctx.beginPath(); ctx.moveTo(g.cx - 26, NY - 6); ctx.quadraticCurveTo(g.cx, NY + 30, g.cx + 26, NY - 6); ctx.stroke(); emoji(ctx, '💎', g.cx, NY + 20, 24, { shadow: false }); return [g.cx - 28, NY - 8, g.cx + 28, NY + 34]; },
    lei: (ctx, it, g) => { ['🌸', '🌼', '🌺', '🌼', '🌸', '🌺', '🌸'].forEach((f, i) => { const a = (i - 3) / 3; emoji(ctx, f, g.cx + a * 46, NY + 6 + (1 - a * a) * 28, 26, { shadow: false }); }); return [g.cx - 60, NY - 8, g.cx + 60, NY + 50]; },
    medal: (ctx, it, g) => { ctx.lineWidth = 7; ctx.strokeStyle = c0(it); ctx.beginPath(); ctx.moveTo(g.cx - 24, NY - 4); ctx.lineTo(g.cx, NY + 34); ctx.lineTo(g.cx + 24, NY - 4); ctx.stroke(); blob(ctx, g.cx, NY + 40, 14, 14, c1(it)); ctx.fillStyle = dark(c1(it), .3); ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('1', g.cx, NY + 41); return [g.cx - 28, NY - 8, g.cx + 28, NY + 56]; },
    scarf: (ctx, it, g) => { rrect(ctx, g.cx - 44, NY - 12, 88, 30, 15); clayFill(ctx, c0(it), g.cx - 44, NY - 12, g.cx + 44, NY + 18); rrect(ctx, g.cx + 6, NY + 6, 28, 70, 10); clayFill(ctx, c0(it), g.cx + 6, NY, g.cx + 34, NY + 76); if (it.pattern === 'stripes') { ctx.fillStyle = c1(it); for (let y = NY + 14; y < NY + 74; y += 14) ctx.fillRect(g.cx + 6, y, 28, 6); } ctx.strokeStyle = dark(c0(it), .3); ctx.lineWidth = 2; for (let x = g.cx + 10; x < g.cx + 34; x += 6) { ctx.beginPath(); ctx.moveTo(x, NY + 70); ctx.lineTo(x, NY + 82); ctx.stroke(); } return [g.cx - 46, NY - 14, g.cx + 46, NY + 84]; },
    pearls: (ctx, it, g) => { for (let i = 0; i <= 12; i++) { const a = (i - 6) / 6; blob(ctx, g.cx + a * 44, NY + 2 + (1 - a * a) * 22, 4.5, 4.5, c0(it)); } return [g.cx - 50, NY - 4, g.cx + 50, NY + 30]; },
    bowtie: (ctx, it, g) => { const y = NY + 4; ctx.beginPath(); ctx.moveTo(g.cx, y); ctx.lineTo(g.cx - 22, y - 12); ctx.lineTo(g.cx - 22, y + 12); ctx.closePath(); ctx.moveTo(g.cx, y); ctx.lineTo(g.cx + 22, y - 12); ctx.lineTo(g.cx + 22, y + 12); ctx.closePath(); clayFill(ctx, c0(it), g.cx - 22, y - 12, g.cx + 22, y + 12); blob(ctx, g.cx, y, 6, 7, c0(it)); return [g.cx - 24, y - 14, g.cx + 24, y + 14]; },
    tie: (ctx, it, g) => { const y = NY; blob(ctx, g.cx, y + 2, 8, 6, c0(it)); ctx.beginPath(); ctx.moveTo(g.cx - 7, y + 6); ctx.lineTo(g.cx + 7, y + 6); ctx.lineTo(g.cx + 11, y + 54); ctx.lineTo(g.cx, y + 66); ctx.lineTo(g.cx - 11, y + 54); ctx.closePath(); clayFill(ctx, c0(it), g.cx - 11, y, g.cx + 11, y + 66); return [g.cx - 13, y - 6, g.cx + 13, y + 68]; },
    choker: (ctx, it, g) => { rrect(ctx, g.cx - 30, NY - 8, 60, 12, 6); clayFill(ctx, c0(it), 0, NY - 8, 0, NY + 4); for (let x = g.cx - 22; x <= g.cx + 22; x += 11) { ctx.beginPath(); ctx.moveTo(x - 4, NY + 4); ctx.lineTo(x, NY + 13); ctx.lineTo(x + 4, NY + 4); ctx.closePath(); ctx.fillStyle = c1(it); ctx.fill(); } return [g.cx - 32, NY - 10, g.cx + 32, NY + 15]; },
    silkscarf: (ctx, it, g) => { const y = NY - 2; blob(ctx, g.cx, y, 40, 12, c0(it)); blob(ctx, g.cx + 26, y + 26, 12, 22, c0(it), -0.4); blob(ctx, g.cx + 36, y + 20, 10, 18, c0(it), 0.5); blob(ctx, g.cx + 26, y + 8, 8, 8, c0(it)); if (it.pattern === 'dots') { ctx.fillStyle = c1(it); for (let x = g.cx - 34; x < g.cx + 40; x += 9) { ctx.beginPath(); ctx.arc(x, y + ((x / 9) % 2) * 5 - 2, 2.2, 0, 7); ctx.fill(); } } return [g.cx - 42, y - 14, g.cx + 48, y + 50]; },
  };

  function charmBag(ctx, it, shape) {
    const x = HAND_L[0] - 2, y = HAND_L[1] + 32;
    ctx.strokeStyle = c1(it); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x - 22, y - 10);
    ctx.quadraticCurveTo(x, y - 66, x + 22, y - 10); ctx.stroke();
    if (shape === 'heart') heartPath(ctx, x, y, 25);
    else starPath(ctx, x, y, 34, 19);
    clayFill(ctx, c0(it), x - 34, y - 34, x + 34, y + 34);
    blob(ctx, x, y - 4, 4, 4, c1(it));
    return [x - 38, y - 44, x + 38, y + 38];
  }
  const BAGS = {
    heartbag: { front: (ctx, it) => charmBag(ctx, it, 'heart') },
    starbag: { front: (ctx, it) => charmBag(ctx, it, 'star') },
    backpack: { back: E('🎒', 262, 236, 96, { tint: 0 }) },
    tote: { front: E('🛍️', HAND_L[0] - 6, HAND_L[1] + 30, 80, { tint: 0 }) },
    handbag: { front: E('👜', HAND_R[0] + 6, HAND_R[1] + 30, 74, { tint: 0 }) },
    basket: { front: E('🧺', HAND_R[0] + 8, HAND_R[1] + 30, 76) },
    chainbag: { front: (ctx, it, g) => { ctx.strokeStyle = c1(it); ctx.lineWidth = 3; ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.moveTo(g.cx + 40, 206); ctx.lineTo(HAND_R[0] + 6, HAND_R[1] + 4); ctx.stroke(); ctx.setLineDash([]); return union([emoji(ctx, '👝', HAND_R[0] + 8, HAND_R[1] + 28, 66, { color: c0(it) }), [g.cx + 40, 200, HAND_R[0] + 10, HAND_R[1]]]); } },
  };

  const HAND = {
    camera: E('📷', HAND_R[0] + 6, HAND_R[1] + 14, 60),
    paintbrush: E('🖌️', HAND_R[0] + 6, HAND_R[1] - 20, 65),
    lollipop: E('🍭', HAND_R[0] + 6, HAND_R[1] - 22, 65, { tint: 0 }),
    fan: E('🪭', HAND_R[0] + 10, HAND_R[1] - 8, 80, { tint: 0 }),
    lantern: E('🏮', HAND_R[0] + 8, HAND_R[1] + 26, 72, { tint: 0 }),
    teddy: E('🧸', HAND_R[0] + 8, HAND_R[1] + 22, 74, { tint: 0 }),
    icecream: E('🍦', HAND_R[0] + 6, HAND_R[1] - 20, 70, { tint: 0 }),
    beachball: E('🏐', HAND_R[0] + 14, HAND_R[1] + 20, 76),
    swimring: E('🛟', 200, 292, 190),
    football: E('⚽', HAND_R[0] + 20, FEET - 24, 64),
    racket: (ctx, it, g) => { const x = HAND_R[0] + 10, y = HAND_R[1] - 60; ctx.save(); ctx.translate(x, y); ctx.rotate(0.35); ellipse(ctx, 0, -8, 30, 40); ctx.lineWidth = 7; ctx.strokeStyle = c0(it); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.5; for (let i = -24; i <= 24; i += 8) { ctx.beginPath(); ctx.moveTo(i, -44); ctx.lineTo(i, 28); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-28, i - 8); ctx.lineTo(28, i - 8); ctx.stroke(); } rrect(ctx, -5, 30, 10, 44, 4); clayFill(ctx, dark(c0(it), .3), -5, 30, 5, 74); ctx.restore(); return [x - 45, y - 60, x + 45, y + 80]; },
    hockeystick: E('🏑', HAND_R[0] + 10, HAND_R[1] + 10, 120, { rot: 0.2 }),
    jumprope: (ctx, it, g) => { ctx.lineWidth = 4; ctx.strokeStyle = c0(it); ctx.beginPath(); ctx.moveTo(HAND_L[0], HAND_L[1]); ctx.quadraticCurveTo(200, FEET + 60, HAND_R[0], HAND_R[1]); ctx.stroke(); [HAND_L, HAND_R].forEach(([x, y]) => { rrect(ctx, x - 6, y - 26, 12, 34, 5); clayFill(ctx, dark(c0(it), .35), x - 6, y - 26, x + 6, y + 8); }); return [HAND_L[0] - 8, HAND_L[1] - 28, HAND_R[0] + 8, FEET + 8]; },
    pompoms: (ctx, it, g) => { [[HAND_L, c0(it)], [HAND_R, c1(it)]].forEach(([[x, y], c]) => { const r = seeded(x); for (let i = 0; i < 26; i++) { const a = r() * Math.PI * 2, d = r() * 28; blob(ctx, x + Math.cos(a) * d, y + 8 + Math.sin(a) * d, 7, 7, c); } }); return [HAND_L[0] - 36, HAND_L[1] - 30, HAND_R[0] + 36, HAND_R[1] + 44]; },
    ribbon: (ctx, it, g) => { ctx.lineWidth = 6; ctx.strokeStyle = c0(it); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(HAND_R[0] + 4, HAND_R[1] - 6); let x = HAND_R[0] + 20, y = HAND_R[1] - 40; for (let i = 0; i < 6; i++) { ctx.quadraticCurveTo(x + 40, y - 10, x + 10, y - 34); x += 8; y -= 36; } ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(HAND_R[0] + 4, HAND_R[1] - 6); ctx.lineTo(HAND_R[0] - 2, HAND_R[1] + 20); ctx.stroke(); return [HAND_R[0] - 10, HAND_R[1] - 260, HAND_R[0] + 80, HAND_R[1] + 24]; },
    umbrella: (ctx, it, g) => { const b = emoji(ctx, '☂️', HAND_R[0] + 10, HAND_R[1] - 96, 150, { color: c0(it) }); return b; },
    guitar: E('🎸', 236, 286, 130, { rot: -0.2 }),
    wand: E('🪄', HAND_R[0] + 14, HAND_R[1] - 26, 76, { rot: 0.4 }),
    pumpkin: E('🎃', HAND_R[0] + 10, HAND_R[1] + 22, 64),
    telescope: E('🔭', HAND_R[0] + 14, HAND_R[1] - 20, 84),
    gift: E('🎁', HAND_R[0] + 10, HAND_R[1] + 20, 70, { tint: 0 }),
    balloons: (ctx, it, g) => { const cols = it.c; ctx.lineWidth = 1.5; ctx.strokeStyle = '#8c8ca0'; cols.forEach((c, i) => { const x = HAND_R[0] + 14 + (i - 1) * 30, y = HAND_R[1] - 120 - (i % 2) * 26; ctx.beginPath(); ctx.moveTo(HAND_R[0] + 2, HAND_R[1] - 4); ctx.quadraticCurveTo(x, y + 60, x, y + 28); ctx.stroke(); blob(ctx, x, y, 24, 30, c); ctx.beginPath(); ctx.moveTo(x - 4, y + 30); ctx.lineTo(x + 4, y + 30); ctx.lineTo(x, y + 36); ctx.closePath(); ctx.fillStyle = dark(c, .2); ctx.fill(); }); return [HAND_R[0] - 44, HAND_R[1] - 186, HAND_R[0] + 74, HAND_R[1]]; },
    sword: E('🗡️', HAND_R[0] + 20, HAND_R[1] - 30, 96, { rot: -0.5 }),
    mic: E('🎤', HAND_R[0] + 10, HAND_R[1] - 6, 66, { rot: -0.4 }),
    bouquet: E('💐', HAND_R[0] + 4, HAND_R[1] - 4, 96),
    carrot: E('🥕', HAND_R[0] + 10, HAND_R[1] - 4, 64, { rot: 0.6 }),
  };

  const BACK = {
    fairywings: (ctx, it, g) => { ctx.save(); ctx.globalAlpha = .82; [-1, 1].forEach(s => { blob(ctx, 200 + s * 62, 226, 44, 62, c0(it), s * 0.55); blob(ctx, 200 + s * 52, 286, 30, 40, c1(it), -s * 0.4); ctx.save(); ctx.globalAlpha = .5; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; [0, 1, 2].forEach(k => { ctx.beginPath(); ctx.moveTo(200 + s * 14, 220); ctx.quadraticCurveTo(200 + s * 60, 200 + k * 26, 200 + s * (90 - k * 10), 180 + k * 40); ctx.stroke(); }); ctx.restore(); }); ctx.restore(); return [80, 160, 320, 330]; },
    angelwings: (ctx, it, g) => { [-1, 1].forEach(s => { for (let k = 0; k < 5; k++) blob(ctx, 200 + s * (60 + k * 16), 214 + k * 22, 18, 60 - k * 6, c0(it), s * (0.7 + k * 0.12)); }); ctx.save(); ctx.globalAlpha = .6; ctx.strokeStyle = c1(it); ctx.lineWidth = 3; ellipse(ctx, 200, g.top - 14, 40, 9); ctx.stroke(); ctx.restore(); return [60, g.top - 26, 340, 330]; },
    cape: (ctx, it, g) => { ctx.beginPath(); ctx.moveTo(200 - 78, 202); ctx.lineTo(200 + 78, 202); ctx.quadraticCurveTo(200 + 150, 300, 200 + 132, FEET - 6); ctx.quadraticCurveTo(200, FEET + 12, 200 - 132, FEET - 6); ctx.quadraticCurveTo(200 - 150, 300, 200 - 78, 202); ctx.closePath(); clayFill(ctx, c0(it), 60, 200, 340, FEET); ctx.save(); ctx.clip(); ctx.fillStyle = c1(it); ctx.globalAlpha = .55; ctx.fillRect(60, 200, 22, FEET); ctx.fillRect(318, 200, 22, FEET); ctx.restore(); return [60, 196, 340, FEET + 12]; },
    butterfly: E('🦋', 200, 262, 230, { tint: 0 }),
    jetpack: (ctx, it, g) => { [-1, 1].forEach(s => { rrect(ctx, 200 + s * 34 - 20, 196, 40, 110, 16); clayFill(ctx, c0(it), 200 + s * 34 - 20, 196, 200 + s * 34 + 20, 306); rrect(ctx, 200 + s * 34 - 12, 190, 24, 14, 6); clayFill(ctx, c1(it), 0, 190, 0, 204); emoji(ctx, '🔥', 200 + s * 34, 324, 40, { shadow: false }); }); return [140, 186, 260, 348]; },
  };
  // capes en vleugels tekenen we achter het lijf; een klein stukje van de cape komt als kraag voor de schouders
  const BACK_FRONT = {
    cape: (ctx, it, g) => { rrect(ctx, 200 - 60, 196, 120, 12, 6); clayFill(ctx, c1(it), 0, 196, 0, 208); blob(ctx, 200, 204, 8, 8, c0(it)); return null; },
  };

  const PETS = {
    fox: E('🦊', 332, 350, 76), owl: E('🦉', 332, 350, 76), butterfly: E('🦋', 330, 230, 60, { tint: 0 }),
    puppy: E('🐶', 332, 350, 80, { tint: 0 }), kitten: E('🐱', 332, 352, 76, { tint: 0 }), rabbit: E('🐰', 332, 352, 76),
    pony: E('🐴', 336, 346, 88, { tint: 0 }), unicorn: E('🦄', 336, 346, 88), penguin: E('🐧', 330, 352, 76),
    parrot: E('🦜', 250, 200, 70), dragon: E('🐉', 336, 346, 90, { tint: 0 }),
  };

  const MAKEUP = {
    eyeshadow: (ctx, it, g) => { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .55; ctx.fillStyle = c0(it); g.eyes.forEach(([x, y]) => { ellipse(ctx, x, y - g.iris * 0.95, g.iris * 1.45, g.iris * 0.75); ctx.fill(); }); ctx.restore(); if (it.deco === 'glitter') g.eyes.forEach(([x, y]) => { for (let k = 0; k < 5; k++) sparkle(ctx, x - g.iris + k * g.iris * 0.5, y - g.iris * 1.3 - (k % 2) * 6, 3); }); return [g.eyes[0][0] - g.iris * 1.6, g.eyeY - g.iris * 1.9, g.eyes[1][0] + g.iris * 1.6, g.eyeY]; },
    lips: (ctx, it, g) => { const [mx, my] = g.mouth, w = 15, h = 6; ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = .85; ctx.fillStyle = c0(it); ctx.beginPath(); ctx.moveTo(mx - w, my); ctx.quadraticCurveTo(mx - w / 2, my - h - 1, mx, my - 2); ctx.quadraticCurveTo(mx + w / 2, my - h - 1, mx + w, my); ctx.quadraticCurveTo(mx, my + h + 3, mx - w, my); ctx.closePath(); ctx.fill(); ctx.restore(); ctx.save(); ctx.globalAlpha = .45; ctx.fillStyle = '#fff'; ellipse(ctx, mx, my + 1.5, w * 0.35, 1.6); ctx.fill(); ctx.restore(); return [mx - w - 4, my - h - 6, mx + w + 4, my + h + 6]; },
    blush: (ctx, it, g) => { ctx.save(); ctx.globalCompositeOperation = 'multiply'; g.eyes.forEach(([x, y], i) => { const cx = x + (i ? 1 : -1) * g.iris * 0.6, cy = y + g.iris * 1.9; const rg = ctx.createRadialGradient(cx, cy, 2, cx, cy, g.iris * 1.4); rg.addColorStop(0, c0(it)); rg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = rg; ctx.globalAlpha = .55; ellipse(ctx, cx, cy, g.iris * 1.4, g.iris * 1.1); ctx.fill(); }); ctx.restore(); return [g.eyes[0][0] - g.iris * 2, g.eyeY, g.eyes[1][0] + g.iris * 2, g.eyeY + g.iris * 3.2]; },
    freckles: (ctx, it, g) => { ctx.fillStyle = c0(it); ctx.save(); ctx.globalAlpha = .7; g.eyes.forEach(([x, y], i) => { const r = seeded(3 + i); for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.arc(x + (i ? 1 : -1) * (r() * 20 - 4), y + g.iris * 1.5 + r() * 16, 1.6 + r(), 0, 7); ctx.fill(); } }); ctx.restore(); return [g.eyes[0][0] - 20, g.eyeY + g.iris, g.eyes[1][0] + 20, g.eyeY + g.iris * 2.5 + 16]; },
    facestars: (ctx, it, g) => { g.eyes.forEach(([x, y], i) => emoji(ctx, '⭐', x + (i ? 1 : -1) * (g.iris + 16), y + g.iris * 1.7, 20, { shadow: false })); return [g.eyes[0][0] - g.iris - 28, g.eyeY + g.iris * 0.8, g.eyes[1][0] + g.iris + 28, g.eyeY + g.iris * 2.6]; },
    facehearts: (ctx, it, g) => { g.eyes.forEach(([x, y], i) => emoji(ctx, '💗', x + (i ? 1 : -1) * (g.iris + 16), y + g.iris * 1.7, 20, { shadow: false })); return [g.eyes[0][0] - g.iris - 28, g.eyeY + g.iris * 0.8, g.eyes[1][0] + g.iris + 28, g.eyeY + g.iris * 2.6]; },
    faceflower: (ctx, it, g) => { const [x, y] = g.eyes[1]; return emoji(ctx, '🌸', x + g.iris + 18, y - g.iris * 1.2, 30, { shadow: false }); },
    faceglitter: (ctx, it, g) => { g.eyes.forEach(([x, y], i) => { const r = seeded(11 + i); for (let k = 0; k < 7; k++) sparkle(ctx, x + (i ? 1 : -1) * (r() * 24), y + g.iris * 1.4 + r() * 18, 2 + r() * 2.5, c0(it)); }); return [g.eyes[0][0] - 28, g.eyeY + g.iris, g.eyes[1][0] + 28, g.eyeY + g.iris * 2.6 + 18]; },
    lightning: (ctx, it, g) => { const [x, y] = g.eyes[1]; return emoji(ctx, '⚡', x + g.iris + 16, y + 4, 26, { shadow: false }); },
    whiskers: (ctx, it, g) => { const [mx, my] = g.mouth; ctx.strokeStyle = c0(it); ctx.lineWidth = 2; ctx.lineCap = 'round'; [-1, 1].forEach(s => { for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(mx + s * 14, my - 6 + k * 3); ctx.lineTo(mx + s * 42, my - 8 + k * 9); ctx.stroke(); } }); blob(ctx, mx, my - 14, 5, 4, c0(it)); return [mx - 44, my - 20, mx + 44, my + 6]; },
    beard: (ctx, it, g) => { const [mx, my] = g.mouth; blob(ctx, mx, my + 16, 30, 16, c0(it)); blob(ctx, mx - 12, my - 5, 12, 4, c0(it), 0.25); blob(ctx, mx + 12, my - 5, 12, 4, c0(it), -0.25); ctx.save(); ctx.globalAlpha = .85; ctx.fillStyle = '#ff9a9a'; ellipse(ctx, mx, my, 7, 3); ctx.fill(); ctx.restore(); return [mx - 32, my - 12, mx + 32, my + 34]; },
  };

  const ACC = { back: BACK, hat: HATS, glasses: GLASSES, neck: NECKS, hand: HAND, pet: PETS, mk_eyes: MAKEUP, mk_lips: MAKEUP, mk_blush: MAKEUP, mk_face: MAKEUP };
  function drawAcc(ctx, it, geo) {
    if (!it) return null;
    const fn = ACC[it.cat] && ACC[it.cat][it.shape];
    if (!fn) return null;
    ctx.save(); const b = fn(ctx, it, geo); ctx.restore(); return b;
  }

  /* ---------- het hele model samenstellen ---------- */
  const buildScale = b => 0.88 + Math.max(0, Math.min(100, typeof b === 'number' ? b : 40)) / 100 * 0.3;
  const cache = new Map();
  function compose(look, outfit, opts = {}) {
    const key = JSON.stringify([look.skin, look.eyes, look.hairColor, look.build, outfit, opts.items ? Object.values(opts.items) : 0]);
    if (cache.has(key)) return cache.get(key);
    const get = slot => outfit[slot] ? ((opts.items && opts.items[outfit[slot]]) || ITEM_BY_ID[outfit[slot]]) : null;
    const hi = headIndex(get('hair') || ITEM_BY_ID.hair_lang), geo = headGeo(hi);
    const skin = (SKINS.find(s => s.id === look.skin) || SKINS[1]).c;
    const c = mk(F, CH), ctx = c.getContext('2d');
    ctx.translate(0, TOP);
    const back = get('back'), bag = get('bag');
    const dress = get('dress'), top = get('top'), bottom = get('bottom'), shoes = get('shoes');
    // 1. achter het lijf
    if (back && BACK[back.shape]) drawAcc(ctx, back, geo) || null;
    if (bag && BAGS[bag.shape] && BAGS[bag.shape].back) { ctx.save(); BAGS[bag.shape].back(ctx, bag, geo); ctx.restore(); }
    // 2. hoofd (boven de nek), daarna kleding eroverheen zodat kragen de hals bedekken
    drawHead(ctx, geo, look);
    // 3. het lijf: schaal voor het postuur
    const sx = buildScale(look.build);
    ctx.save(); ctx.translate(200, 0); ctx.scale(sx, 1); ctx.translate(-200, 0);
    const steps = [];
    if (dress) steps.push(...(DRESS_RECIPES[dress.shape] || DRESS_RECIPES.aline)(dress));
    else {
      if (bottom) steps.push(...bottomRecipe(bottom));
      else if (top && top.full) steps.push({ k: 'B1', d: designOf(top) });
      else steps.push({ k: 'B1', d: { c: ['#f4f4f8'] } });
    }
    const shoeSteps = shoes ? shoeRecipe(shoes) : [];
    // schoenen vóór de top zodat lange jassen eroverheen vallen, maar ná broek/rok
    const bottomSteps = steps.filter(s => s.k[0] === 'B' || s.k === 'D'), rest = steps.filter(s => !(s.k[0] === 'B' || s.k === 'D'));
    if (bottom && bottom.shape === 'wideleg' && !dress) {
      shoeSteps.forEach(s => drawStep(ctx, s, skin));
      bottomSteps.forEach(s => drawStep(ctx, s, skin));
    } else {
      bottomSteps.forEach(s => drawStep(ctx, s, skin));
      shoeSteps.forEach(s => drawStep(ctx, s, skin));
    }
    rest.forEach(s => drawStep(ctx, s, skin));
    if (!dress) {
      if (top) (TOP_RECIPES[top.shape] || TOP_RECIPES.tshirt)(top).forEach(s => drawStep(ctx, s, skin));
      else drawStep(ctx, { k: 'T0', d: { c: ['#ffffff'] } }, skin);
    }
    ctx.restore();
    // 4. haar dat over de schouders valt
    drawLayer(ctx, `H${hi}_low`, hairDesign(look));

    // 5. voor het lijf
    if (back && BACK_FRONT[back.shape]) { ctx.save(); BACK_FRONT[back.shape](ctx, back, geo); ctx.restore(); }
    drawAcc(ctx, get('neck'), geo);
    if (bag && BAGS[bag.shape] && BAGS[bag.shape].front) { ctx.save(); BAGS[bag.shape].front(ctx, bag, geo); ctx.restore(); }
    drawAcc(ctx, get('hand'), geo);
    // 6. make-up, bril, hoedje, huisdier
    ['mk_blush', 'mk_eyes', 'mk_lips', 'mk_face'].forEach(s => drawAcc(ctx, get(s), geo));
    drawAcc(ctx, get('glasses'), geo);
    drawAcc(ctx, get('hat'), geo);
    drawAcc(ctx, get('pet'), geo);
    if (cache.size > 80) cache.delete(cache.keys().next().value);
    cache.set(key, c);
    return c;
  }

  /* ---------- miniatuur van één item ---------- */
  function drawThumbInto(target, item, look) {
    const c = mk(F, CH), ctx = c.getContext('2d');
    ctx.translate(0, TOP);
    let box = null;
    const hairIt = look._hairItem || ITEM_BY_ID[look._hair] || ITEM_BY_ID.hair_lang;
    if (item.cat === 'hair') {
      const geo = headGeo(headIndex(item));
      drawHead(ctx, geo, { ...look, hairColor: look.hairColor });
      box = geo.box;
    } else if (item.cat.startsWith('mk_')) {
      const geo = headGeo(headIndex(hairIt));
      drawHead(ctx, geo, look);
      drawAcc(ctx, item, geo);
      box = geo.face;
    } else if (item.cat === 'top' || item.cat === 'bottom' || item.cat === 'dress' || item.cat === 'shoes') {
      const skin = (SKINS.find(s => s.id === look.skin) || SKINS[1]).c;
      const steps = item.cat === 'top' ? (TOP_RECIPES[item.shape] || TOP_RECIPES.tshirt)(item) : item.cat === 'bottom' ? bottomRecipe(item)
        : item.cat === 'dress' ? (DRESS_RECIPES[item.shape] || DRESS_RECIPES.aline)(item) : shoeRecipe(item);
      steps.forEach(s => drawStep(ctx, { ...s, fab: true }, skin));
      box = union(steps.map(stepBox));
      if (item.cat === 'top' && item.full) box = union([box, layerBox('B1_fab')]);
    } else {
      const geo = headGeo(headIndex(hairIt));
      if (item.cat === 'back') { box = drawAcc(ctx, item, geo); if (BACK_FRONT[item.shape]) BACK_FRONT[item.shape](ctx, item, geo); }
      else if (item.cat === 'bag') { const B = BAGS[item.shape]; const bs = []; if (B && B.back) bs.push(B.back(ctx, item, geo)); if (B && B.front) bs.push(B.front(ctx, item, geo)); box = union(bs); }
      else box = drawAcc(ctx, item, geo);
    }
    if (!box) box = [100, 100, 300, 300];
    const pad = 10, w = box[2] - box[0] + pad * 2, h = box[3] - box[1] + pad * 2, s = Math.max(w, h);
    const sx = box[0] - pad - (s - w) / 2, sy = box[1] + TOP - pad - (s - h) / 2;
    const g = target.getContext('2d'); g.clearRect(0, 0, target.width, target.height);
    g.drawImage(c, sx, sy, s, s, 0, 0, target.width, target.height);
  }

  /* ---------- canvassen in de pagina vullen ---------- */
  let uid = 0; const specs = new Map();
  function tag(spec, w, h, cls) { const id = ++uid; specs.set(id, spec); return `<canvas class="doll ${cls || ''}" data-doll="${id}" width="${w}" height="${h}" aria-hidden="true"></canvas>`; }
  function fill(canvas, spec) {
    const g = canvas.getContext('2d'); g.clearRect(0, 0, canvas.width, canvas.height);
    if (spec.kind === 'thumb') { drawThumbInto(canvas, spec.item, spec.look); return true; }
    const doll = compose(spec.look, spec.outfit, spec.opts);
    if (spec.kind === 'head') {
      const geo = headGeo(headIndex(spec.opts.items && spec.opts.items[spec.outfit.hair] || ITEM_BY_ID[spec.outfit.hair] || ITEM_BY_ID.hair_lang));
      const [x0, y0, x1, y1] = geo.face, s = Math.max(x1 - x0, y1 - y0) * 1.25, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 - 4 + TOP;
      g.drawImage(doll, cx - s / 2, cy - s / 2, s, s, 0, 0, canvas.width, canvas.height); return true;
    }
    if (spec.kind === 'stage') {
      const ok = Backgrounds.draw(g, spec.bg, canvas.width, canvas.height);
      const S = STAGE.scale;
      g.save(); g.fillStyle = 'rgba(40,20,60,.2)'; ellipse(g, canvas.width / 2, STAGE.feet + 2, 88, 13); g.fill(); g.restore();
      g.drawImage(doll, canvas.width / 2 - 200 * S, STAGE.feet - (FEET + TOP) * S, F * S, CH * S);
      return ok;
    }
    g.drawImage(doll, 0, 0, canvas.width, canvas.height); return true;
  }
  let scheduled = false;
  function mountAll() {
    scheduled = false;
    if (!ready) return;
    document.querySelectorAll('canvas[data-doll]:not([data-ok])').forEach(cv => {
      const spec = specs.get(+cv.dataset.doll); if (!spec) { cv.dataset.ok = '1'; return; }
      let ok = true;
      try { ok = fill(cv, spec); } catch (e) { console.warn('tekenen mislukt', e); }
      if (ok) { cv.dataset.ok = '1'; if (spec.kind !== 'stage') specs.delete(+cv.dataset.doll); }
    });
    // opruimen: specs van canvassen die niet meer in de pagina staan
    if (specs.size > 400) for (const id of specs.keys()) if (!document.querySelector(`canvas[data-doll="${id}"]`)) specs.delete(id);
  }
  function schedule() { if (scheduled) return; scheduled = true; setTimeout(mountAll, 0); }
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });

  /* ---------- publieke API ---------- */
  function render(look, outfit, opts = {}) {
    if (opts.head) return tag({ kind: 'head', look, outfit, opts }, 160, 160, 'doll-head');
    if (opts.bg === false || !opts.bg && !outfit.bg) return tag({ kind: 'doll', look, outfit, opts }, F, CH, 'doll-only');
    return tag({ kind: 'stage', look, outfit, opts, bg: opts.bg || outfit.bg }, STAGE.w, STAGE.h, 'doll-stage');
  }
  function thumb(item, look) {
    if (item.cat === 'bg') return Backgrounds.thumb(item.shape || item.id);
    return tag({ kind: 'thumb', item, look }, 160, 160, 'doll-thumb');
  }
  function stage(look, outfit, bg) {
    const c = mk(STAGE.w, STAGE.h); fill(c, { kind: 'stage', look, outfit, opts: {}, bg }); return c;
  }
  const headThumb = () => '';
  return { render, thumb, headThumb, compose, stage, mountAll, light, dark, emoji, blob, isReady: () => ready, FRAME: F, TOP, HEIGHT: CH, STAGE };
})();

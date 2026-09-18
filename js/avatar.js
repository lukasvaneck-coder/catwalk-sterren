/* ============================================================
   Catwalk Sterren — het model tekenen (SVG, 300 x 520)
   Vaste maten:
     hoofd  middelpunt (150,100), rx 54, ry 60   ogen (128,106) (172,106)
     nek    x 138-162, y 145-182                  schouders y 176, x 106-194
     taille y 258, x 118-182                      heupen y 298, x 110-190
     armen  (112,184)→(96,242)→(91,296)           handen (91,302) (209,302)
     benen  (133,296)→(131,456)                   voeten (129,466) (171,466), grond ≈ 476
   ============================================================ */

const Avatar = (() => {
  let uid = 0;

  /* ---------- kleurhulpjes ---------- */
  const hex2rgb = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const rgb2hex = (r, g, b) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { if (!/^#/.test(a)) return a; const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); };
  const light = (c, t = 0.3) => mix(c, '#ffffff', t);
  const dark = (c, t = 0.25) => mix(c, '#000000', t);

  /* ---------- vormhulpjes ---------- */
  function starPath(cx, cy, r, ri = r * 0.45, n = 5) {
    let d = '';
    for (let i = 0; i < n * 2; i++) {
      const a = Math.PI / n * i - Math.PI / 2, rr = i % 2 ? ri : r;
      d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1);
    }
    return d + 'Z';
  }
  function heartPath(cx, cy, s) {
    return `M${cx} ${cy + s * 0.9} C${cx - s * 1.7} ${cy - s * 0.2} ${cx - s * 0.7} ${cy - s * 1.3} ${cx} ${cy - s * 0.35} C${cx + s * 0.7} ${cy - s * 1.3} ${cx + s * 1.7} ${cy - s * 0.2} ${cx} ${cy + s * 0.9}Z`;
  }
  function flower(x, y, r, c, center = '#ffe27a') {
    x = +x; y = +y;
    let s = `<g fill="${c}">`;
    for (let i = 0; i < 5; i++) { const a = Math.PI * 2 / 5 * i - Math.PI / 2; s += `<circle cx="${(x + Math.cos(a) * r).toFixed(1)}" cy="${(y + Math.sin(a) * r).toFixed(1)}" r="${(r * 0.75).toFixed(1)}"/>`; }
    return s + `</g><circle cx="${x}" cy="${y}" r="${(r * 0.6).toFixed(1)}" fill="${center}"/>`;
  }
  const mirror = s => `<g transform="translate(300 0) scale(-1 1)">${s}</g>`;
  // punt op een kwadratische curve
  const q = (p0, p1, p2, t) => [(1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]];
  const sparkles = (pts, c = '#fff', r = 4) => pts.map(([x, y]) => `<path d="${starPath(x, y, r, r * 0.35, 4)}" fill="${c}" opacity=".9"/>`).join('');

  /* ---------- patronen ---------- */
  const PATTERNS = {
    stripes: (id, c1, c2) => `<pattern id="${id}" width="20" height="16" patternUnits="userSpaceOnUse"><rect width="20" height="16" fill="${c1}"/><rect width="20" height="8" fill="${c2}"/></pattern>`,
    dots: (id, c1, c2) => `<pattern id="${id}" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="${c1}"/><circle cx="8" cy="8" r="3.2" fill="${c2}"/></pattern>`,
    hearts: (id, c1, c2) => `<pattern id="${id}" width="22" height="22" patternUnits="userSpaceOnUse"><rect width="22" height="22" fill="${c1}"/><path d="${heartPath(11, 11, 5)}" fill="${c2}"/></pattern>`,
    stars: (id, c1, c2) => `<pattern id="${id}" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="${c1}"/><path d="${starPath(12, 12, 6)}" fill="${c2}"/></pattern>`,
    checks: (id, c1, c2) => `<pattern id="${id}" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="${c1}"/><rect width="9" height="9" fill="${c2}"/><rect x="9" y="9" width="9" height="9" fill="${c2}"/></pattern>`,
    scales: (id, c1, c2) => `<pattern id="${id}" width="20" height="16" patternUnits="userSpaceOnUse"><rect width="20" height="16" fill="${c1}"/><path d="M0 8 A10 10 0 0 0 20 8 M-10 16 A10 10 0 0 0 10 16 M10 16 A10 10 0 0 0 30 16" fill="none" stroke="${c2}" stroke-width="2"/></pattern>`,
    flowers: (id, c1, c2) => `<pattern id="${id}" width="28" height="28" patternUnits="userSpaceOnUse"><rect width="28" height="28" fill="${c1}"/>${flower(14, 14, 5, c2)}</pattern>`,
    glitter: (id, c1, c2) => `<pattern id="${id}" width="18" height="18" patternUnits="userSpaceOnUse"><rect width="18" height="18" fill="${c1}"/><circle cx="4" cy="5" r="1.4" fill="${c2}"/><circle cx="13" cy="11" r="1.8" fill="${c2}"/><circle cx="8" cy="15" r="1.1" fill="${c2}"/><circle cx="15" cy="3" r="1" fill="#fff"/></pattern>`,
    rainbow: (id) => `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5c5c"/><stop offset=".2" stop-color="#ffb347"/><stop offset=".4" stop-color="#ffe94d"/><stop offset=".6" stop-color="#5fe38a"/><stop offset=".8" stop-color="#5aaeff"/><stop offset="1" stop-color="#c47bff"/></linearGradient>`,
  };

  function makeCtx(look, opts = {}) {
    const id = ++uid;
    const defs = [];
    const skin = SKINS.find(s => s.id === look.skin) || SKINS[0];
    const eye = EYES.find(e => e.id === look.eyes) || EYES[0];
    const hc = HAIR_COLORS.find(h => h.id === look.hairColor) || HAIR_COLORS[0];
    const ctx = { id, defs, skin: skin.c, skinShade: skin.shade, eye: eye.c, expr: opts.expr || 'smile', face: FACES[look.face] ? look.face : 'ovaal', sx: buildScale(look.build) };
    ctx.hx = HAIR_SCALE[ctx.face] || 1;
    ctx.hairWrap = s => (!s || ctx.hx === 1) ? s : `<g transform="translate(150 0) scale(${ctx.hx} 1) translate(-150 0)">${s}</g>`;
    ctx.pat = (type, c1, c2) => { const pid = `p${id}_${defs.length}`; defs.push(PATTERNS[type](pid, c1, c2)); return `url(#${pid})`; };
    ctx.grad = (c1, c2, horiz = false) => { const gid = `g${id}_${defs.length}`; defs.push(`<linearGradient id="${gid}" x1="0" y1="0" x2="${horiz ? 1 : 0}" y2="${horiz ? 0 : 1}"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>`); return `url(#${gid})`; };
    ctx.rgrad = (c1, c2) => { const gid = `g${id}_${defs.length}`; defs.push(`<radialGradient id="${gid}"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient>`); return `url(#${gid})`; };
    if (hc.c === 'rainbow') { ctx.hairFill = ctx.pat('rainbow'); ctx.hairBase = '#c47bff'; }
    else { ctx.hairFill = hc.c; ctx.hairBase = hc.c; }
    ctx.hairHi = light(ctx.hairBase, 0.28);
    ctx.hairDk = dark(ctx.hairBase, 0.25);
    return ctx;
  }
  const fillOf = (ctx, it) => it.pattern ? ctx.pat(it.pattern, it.c[0], it.c[1] || dark(it.c[0])) : it.c[0];
  const c1of = it => it.c[0];
  const c2of = it => it.c[1] || dark(it.c[0]);

  /* ---------- gezichtsvormen & postuur ---------- */
  const FACES = {
    ovaal:    '<ellipse cx="150" cy="100" rx="54" ry="60"/>',
    rond:     '<ellipse cx="150" cy="102" rx="58" ry="58"/>',
    hart:     '<path d="M150 162 Q100 142 96 96 Q100 46 150 42 Q200 46 204 96 Q200 142 150 162 Z"/>',
    vierkant: '<path d="M100 110 Q98 44 150 40 Q202 44 200 110 Q200 140 188 160 Q170 166 150 166 Q130 166 112 160 Q100 140 100 110 Z"/>',
    smal:     '<ellipse cx="150" cy="100" rx="49" ry="62"/>',
  };
  // haar en hoedjes schalen mee met de breedte van het hoofd
  const HAIR_SCALE = { ovaal: 1, rond: 1.04, hart: 1, vierkant: 1, smal: 0.9 };
  // postuur 0 (dun) … 100 (dik) → horizontale schaal van lichaam en kleding; 40 = normaal
  function buildScale(b) {
    const v = typeof b === 'number' && !isNaN(b) ? Math.max(0, Math.min(100, b)) : 40;
    return v <= 40 ? +(0.82 + (v / 40) * 0.18).toFixed(3) : +(1 + ((v - 40) / 60) * 0.26).toFixed(3);
  }

  /* ---------- lichaam ---------- */
  function body(ctx) {
    const s = ctx.skin, sh = ctx.skinShade;
    return `<g>
      <path d="M133 296 L131 456" stroke="${s}" stroke-width="28" stroke-linecap="round" fill="none"/>
      <path d="M167 296 L169 456" stroke="${s}" stroke-width="28" stroke-linecap="round" fill="none"/>
      <ellipse cx="129" cy="466" rx="18" ry="10" fill="${s}"/><ellipse cx="171" cy="466" rx="18" ry="10" fill="${s}"/>
      <path d="M112 184 L96 242 L91 296" stroke="${s}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path d="M188 184 L204 242 L209 296" stroke="${s}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <circle cx="91" cy="302" r="12" fill="${s}"/><circle cx="209" cy="302" r="12" fill="${s}"/>
      <path d="M106 176 Q150 170 194 176 Q192 220 184 258 Q190 280 190 298 L110 298 Q110 280 116 258 Q108 220 106 176 Z" fill="${s}"/>
      <rect x="138" y="140" width="24" height="42" rx="10" fill="${sh}"/>
    </g>`;
  }
  function headOnly(ctx) {
    const s = ctx.skin;
    return `<circle cx="97" cy="108" r="10" fill="${s}"/><circle cx="203" cy="108" r="10" fill="${s}"/>
      <circle cx="97" cy="108" r="4" fill="${ctx.skinShade}"/><circle cx="203" cy="108" r="4" fill="${ctx.skinShade}"/>
      <g fill="${s}">${FACES[ctx.face] || FACES.ovaal}</g>`;
  }

  /* ---------- gezicht + make-up ---------- */
  function face(ctx, outfit = {}) {
    const g = slot => outfit[slot] ? ITEM_BY_ID[outfit[slot]] : null;
    const eyes = g('mk_eyes'), lips = g('mk_lips'), blush = g('mk_blush'), deco = g('mk_face');
    let s = '';
    // wenkbrauwen
    s += `<path d="M116 92 Q128 85 140 91" stroke="${ctx.hairDk}" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M160 91 Q172 85 184 92" stroke="${ctx.hairDk}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    // oogschaduw
    if (eyes) {
      s += `<path d="M114 106 Q116 88 128 87 Q140 88 142 106 Z" fill="${eyes.c[0]}" opacity=".8"/><path d="M158 106 Q160 88 172 87 Q184 88 186 106 Z" fill="${eyes.c[0]}" opacity=".8"/>`;
      if (eyes.deco === 'glitter') s += `<g fill="#fff"><circle cx="120" cy="95" r="1.3"/><circle cx="132" cy="91" r="1.5"/><circle cx="126" cy="99" r="1"/><circle cx="164" cy="95" r="1.3"/><circle cx="176" cy="91" r="1.5"/><circle cx="170" cy="99" r="1"/></g>`;
    }
    // ogen
    const eye = cx => `<ellipse cx="${cx}" cy="106" rx="11" ry="13" fill="#fff"/><circle cx="${cx}" cy="108" r="7.5" fill="${ctx.eye}"/><circle cx="${cx}" cy="108" r="3.8" fill="#1d1a22"/><circle cx="${cx - 3}" cy="103" r="2.6" fill="#fff"/><path d="M${cx - 11} 100 Q${cx} 91 ${cx + 11} 100" stroke="#2a2230" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    s += eye(128) + eye(172);
    // wimpers
    s += `<path d="M116 99 L112 95 M184 99 L188 95" stroke="#2a2230" stroke-width="2" stroke-linecap="round"/>`;
    // neus
    s += `<path d="M146 122 Q150 127 154 122" stroke="${ctx.skinShade}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    // blush
    if (blush) s += `<ellipse cx="116" cy="125" rx="10" ry="6" fill="${blush.c[0]}" opacity=".45"/><ellipse cx="184" cy="125" rx="10" ry="6" fill="${blush.c[0]}" opacity=".45"/>`;
    // mond
    const lipC = lips ? lips.c[0] : null;
    if (ctx.expr === 'grin') {
      s += `<path d="M135 133 Q150 154 165 133 Z" fill="${lipC || '#8a3a4f'}"/><path d="M139 135 Q150 140 161 135 L160 138 Q150 143 140 138 Z" fill="#fff"/><ellipse cx="150" cy="147" rx="5" ry="3" fill="#ff7a90"/>`;
    } else if (ctx.expr === 'wow') {
      s += `<ellipse cx="150" cy="139" rx="7" ry="9" fill="${lipC || '#8a3a4f'}"/>`;
    } else if (lipC) {
      s += `<path d="M137 134 Q143 129 150 133 Q157 129 163 134 Q150 149 137 134 Z" fill="${lipC}"/><path d="M141 134 Q150 137 159 134" stroke="${dark(lipC, .3)}" stroke-width="1.2" fill="none"/>`;
    } else {
      s += `<path d="M138 134 Q150 147 162 134" stroke="#b5566b" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    }
    // versiering
    if (deco) s += FACE_DECO[deco.shape](ctx, deco);
    return s;
  }
  const FACE_DECO = {
    freckles: (ctx, it) => `<g fill="${it.c[0]}" opacity=".7"><circle cx="116" cy="121" r="1.6"/><circle cx="122" cy="127" r="1.4"/><circle cx="110" cy="128" r="1.4"/><circle cx="184" cy="121" r="1.6"/><circle cx="178" cy="127" r="1.4"/><circle cx="190" cy="128" r="1.4"/></g>`,
    facestars: (ctx, it) => `<path d="${starPath(111, 124, 6)}" fill="${it.c[0]}"/><path d="${starPath(189, 124, 6)}" fill="${it.c[0]}"/><path d="${starPath(120, 132, 3)}" fill="${it.c[0]}"/><path d="${starPath(180, 132, 3)}" fill="${it.c[0]}"/>`,
    whiskers: (ctx, it) => `<ellipse cx="150" cy="124" rx="4.5" ry="3.2" fill="${it.c[0]}"/><g stroke="${it.c[0]}" stroke-width="1.8" stroke-linecap="round"><path d="M138 122 L112 118 M138 126 L112 128 M162 122 L188 118 M162 126 L188 128"/></g>`,
    facehearts: (ctx, it) => `<path d="${heartPath(112, 124, 4.5)}" fill="${it.c[0]}"/><path d="${heartPath(188, 124, 4.5)}" fill="${it.c[0]}"/>`,
    faceflower: (ctx, it) => flower(188, 122, 5, it.c[0], it.c[1]),
    faceglitter: (ctx, it) => `<g fill="${it.c[0]}" opacity=".9"><circle cx="112" cy="120" r="1.6"/><circle cx="118" cy="128" r="1.2"/><circle cx="108" cy="130" r="1.3"/><circle cx="122" cy="118" r="1"/><circle cx="188" cy="120" r="1.6"/><circle cx="182" cy="128" r="1.2"/><circle cx="192" cy="130" r="1.3"/><circle cx="178" cy="118" r="1"/><circle cx="150" cy="70" r="1.2"/><circle cx="140" cy="76" r="1"/><circle cx="160" cy="76" r="1"/></g>`,
    lightning: (ctx, it) => `<path d="M188 108 L178 124 L185 124 L178 140 L192 121 L185 121 Z" fill="${it.c[0]}" stroke="${dark(it.c[0])}" stroke-width="1"/>`,
    beard: (ctx, it) => `<path d="M108 124 Q118 168 150 174 Q182 168 192 124 L192 140 Q182 158 150 160 Q118 158 108 140 Z" fill="${it.c[0]}"/>`,
  };

  /* ---------- haar ---------- */
  const CAP = 'M92 104 A58 66 0 0 1 208 104';
  const HAIR_OLD = {
    kort: { front: c => `<path d="${CAP} Q202 74 150 66 Q98 74 92 104 Z" fill="${c.hairFill}"/><path d="M112 60 Q130 44 150 46 Q170 44 188 60" stroke="${c.hairHi}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".6"/>` },
    bob: {
      back: c => `<path d="${CAP} L214 170 Q150 186 86 170 Z" fill="${c.hairFill}"/>`,
      front: c => `<path d="${CAP} Q150 66 92 104 Z" fill="${c.hairFill}"/><path d="M116 58 Q150 46 184 58" stroke="${c.hairHi}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".6"/>`,
    },
    lang: {
      back: c => `<path d="${CAP} L220 274 Q150 294 80 274 Z" fill="${c.hairFill}"/><path d="M104 130 L96 260 M196 130 L204 260" stroke="${c.hairDk}" stroke-width="3" fill="none" opacity=".35"/>`,
      front: c => `<path d="${CAP} Q206 68 152 60 Q94 68 92 104 Z" fill="${c.hairFill}"/><path d="M150 42 L150 62" stroke="${c.hairDk}" stroke-width="2.5" opacity=".5"/><path d="M110 60 Q128 48 146 50" stroke="${c.hairHi}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".6"/>`,
    },
    staart: {
      back: c => `<path d="M194 58 Q244 96 230 196" stroke="${c.hairFill}" stroke-width="24" stroke-linecap="round" fill="none"/>`,
      front: c => `<path d="${CAP} Q198 72 150 68 Q102 72 92 104 Z" fill="${c.hairFill}"/><circle cx="200" cy="62" r="7" fill="#ff5da2"/><path d="M118 56 Q150 44 182 56" stroke="${c.hairHi}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".6"/>`,
    },
    staartjes: {
      back: c => `<path d="M90 102 Q60 150 72 208 M210 102 Q240 150 228 208" stroke="${c.hairFill}" stroke-width="24" stroke-linecap="round" fill="none"/>`,
      front: c => `<path d="${CAP} Q150 64 92 104 Z" fill="${c.hairFill}"/><path d="M84 108 Q70 140 74 170" stroke="${c.hairFill}" stroke-width="22" stroke-linecap="round" fill="none"/><path d="M216 108 Q230 140 226 170" stroke="${c.hairFill}" stroke-width="22" stroke-linecap="round" fill="none"/><ellipse cx="86" cy="110" rx="9" ry="6" fill="#ff5da2" transform="rotate(20 86 110)"/><ellipse cx="214" cy="110" rx="9" ry="6" fill="#ff5da2" transform="rotate(-20 214 110)"/>`,
    },
    krullen: {
      back: c => `<g fill="${c.hairFill}"><circle cx="96" cy="72" r="18"/><circle cx="86" cy="104" r="18"/><circle cx="88" cy="136" r="18"/><circle cx="98" cy="166" r="17"/><circle cx="204" cy="72" r="18"/><circle cx="214" cy="104" r="18"/><circle cx="212" cy="136" r="18"/><circle cx="202" cy="166" r="17"/><circle cx="116" cy="50" r="18"/><circle cx="150" cy="40" r="20"/><circle cx="184" cy="50" r="18"/></g>`,
      front: c => `<path d="${CAP} Q150 78 92 104 Z" fill="${c.hairFill}"/><g fill="${c.hairFill}"><circle cx="106" cy="92" r="13"/><circle cx="124" cy="76" r="13"/><circle cx="150" cy="70" r="14"/><circle cx="176" cy="76" r="13"/><circle cx="194" cy="92" r="13"/></g><g fill="${c.hairHi}" opacity=".5"><circle cx="120" cy="72" r="4"/><circle cx="148" cy="64" r="4"/></g>`,
    },
    knot: { front: c => `<circle cx="150" cy="34" r="22" fill="${c.hairFill}"/><path d="${CAP} Q198 72 150 68 Q102 72 92 104 Z" fill="${c.hairFill}"/><path d="M134 40 Q150 30 166 40" stroke="${c.hairHi}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".6"/><path d="M128 50 Q150 42 172 50" stroke="#ff5da2" stroke-width="4" fill="none"/>` },
    vlechten: {
      back: c => { let s = `<g fill="${c.hairFill}">`; for (let i = 0; i < 7; i++) { const t = i / 6; s += `<circle cx="${(96 - 12 * t + (i % 2 ? 3 : -3)).toFixed(1)}" cy="${(120 + 112 * t).toFixed(1)}" r="10"/><circle cx="${(204 + 12 * t + (i % 2 ? -3 : 3)).toFixed(1)}" cy="${(120 + 112 * t).toFixed(1)}" r="10"/>`; } return s + `</g><circle cx="84" cy="236" r="5" fill="#ff5da2"/><circle cx="216" cy="236" r="5" fill="#ff5da2"/>`; },
      front: c => `<path d="${CAP} Q206 68 152 60 Q94 68 92 104 Z" fill="${c.hairFill}"/><path d="M150 42 L150 62" stroke="${c.hairDk}" stroke-width="2.5" opacity=".5"/>`,
    },
    golvend: {
      back: c => `<path d="${CAP} Q224 160 216 200 Q234 240 220 282 Q150 302 80 282 Q66 240 84 200 Q76 160 92 104 Z" fill="${c.hairFill}"/><path d="M100 150 Q92 190 104 230 Q96 260 106 280 M200 150 Q208 190 196 230 Q204 260 194 280" stroke="${c.hairHi}" stroke-width="4" fill="none" opacity=".45"/>`,
      front: c => `<path d="${CAP} Q200 76 172 82 Q150 94 128 74 Q104 68 92 104 Z" fill="${c.hairFill}"/>`,
    },
    afro: {
      back: c => `<circle cx="150" cy="92" r="90" fill="${c.hairFill}"/><g fill="${c.hairFill}"><circle cx="72" cy="60" r="22"/><circle cx="228" cy="60" r="22"/><circle cx="150" cy="8" r="20"/><circle cx="100" cy="20" r="20"/><circle cx="200" cy="20" r="20"/><circle cx="66" cy="120" r="20"/><circle cx="234" cy="120" r="20"/></g><g fill="${c.hairHi}" opacity=".35"><circle cx="110" cy="40" r="8"/><circle cx="80" cy="90" r="6"/><circle cx="200" cy="34" r="7"/></g>`,
      front: c => `<path d="${CAP} Q150 82 92 104 Z" fill="${c.hairFill}"/>`,
    },
    spacebuns: { front: c => `<circle cx="98" cy="44" r="20" fill="${c.hairFill}"/><circle cx="202" cy="44" r="20" fill="${c.hairFill}"/><path d="${CAP} Q150 66 92 104 Z" fill="${c.hairFill}"/><path d="M86 48 Q98 34 110 48" stroke="${c.hairHi}" stroke-width="4" fill="none" opacity=".6"/><path d="M190 48 Q202 34 214 48" stroke="${c.hairHi}" stroke-width="4" fill="none" opacity=".6"/><circle cx="106" cy="58" r="5" fill="#ff5da2"/><circle cx="194" cy="58" r="5" fill="#ff5da2"/>` },
    hanenkam: { front: c => `<path d="M98 92 L110 42 L124 78 L138 22 L150 70 L162 18 L176 76 L190 36 L202 92 Q150 72 98 92 Z" fill="${c.hairFill}"/><path d="M110 88 Q150 76 190 88" stroke="${c.hairDk}" stroke-width="3" fill="none" opacity=".4"/>` },
    prinses: {
      back: c => { let s = `<path d="${CAP} L222 250 Q150 270 78 250 Z" fill="${c.hairFill}"/><g fill="${c.hairFill}">`; [[84, 252], [108, 262], [136, 266], [164, 266], [192, 262], [216, 252], [96, 228], [204, 228]].forEach(([x, y]) => s += `<circle cx="${x}" cy="${y}" r="15"/>`); return s + `</g><g fill="${c.hairHi}" opacity=".45"><circle cx="104" cy="256" r="5"/><circle cx="196" cy="256" r="5"/><circle cx="150" cy="260" r="5"/></g>`; },
      front: c => `<path d="${CAP} Q200 72 150 70 Q100 72 92 104 Z" fill="${c.hairFill}"/><circle cx="102" cy="112" r="11" fill="${c.hairFill}"/><circle cx="198" cy="112" r="11" fill="${c.hairFill}"/><path d="${starPath(184, 54, 8)}" fill="#ffd23f"/>`,
    },
  };

  // haarlokken en glans geven de kapsels meer tekening
  const strands = (c, d) => `<path d="${d}" stroke="${c.hairDk}" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".35"/>`;
  const shine = (c, d) => `<path d="${d}" stroke="${c.hairHi}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".55"/>`;
  const detail = (base, fd, bd) => { const o = { front: c => base.front(c) + (fd ? strands(c, fd) : '') }; if (base.back) o.back = c => base.back(c) + (bd ? strands(c, bd) : ''); return o; };
  const H0 = HAIR_OLD;
  const HAIR = {
    kort: detail(H0.kort, 'M118 66 Q124 52 132 46 M150 60 L150 44 M182 66 Q176 52 168 46 M104 90 Q108 76 118 70'),
    pixie: { front: c => `<path d="${CAP} Q212 86 192 86 Q160 94 130 70 Q104 64 92 104 Z" fill="${c.hairFill}"/><path d="M96 60 L104 44 L110 58 M120 46 L130 34 L134 50 M150 40 L158 30 L160 46" stroke="${c.hairFill}" stroke-width="8" stroke-linecap="round" fill="none"/>${strands(c, 'M110 78 Q126 66 140 72 M128 60 Q146 52 162 62 M170 80 Q180 76 190 84')}${shine(c, 'M116 56 Q134 42 154 44')}` },
    bob: { back: c => `<path d="${CAP} L214 170 Q150 186 86 170 Z" fill="${c.hairFill}"/>${strands(c, 'M100 120 Q98 150 102 168 M200 120 Q202 150 198 168')}`, front: c => `<path d="${CAP} Q206 68 158 60 Q100 70 92 104 Z" fill="${c.hairFill}"/><path d="M158 42 L158 62" stroke="${c.hairDk}" stroke-width="2.5" opacity=".5"/>${strands(c, 'M120 72 Q136 60 150 62 M172 66 Q186 70 196 84')}${shine(c, 'M112 62 Q130 50 148 52')}` },
    bob_pony: detail(H0.bob, 'M118 82 Q118 62 126 50 M150 80 L150 48 M182 82 Q182 62 174 50', 'M100 120 Q98 150 102 168 M200 120 Q202 150 198 168'),
    lang: detail(H0.lang, 'M124 66 Q120 54 128 46 M176 66 Q180 54 172 46', 'M110 140 Q102 200 106 262 M190 140 Q198 200 194 262'),
    lang_pony: { back: H0.lang.back, front: c => `<path d="${CAP} Q150 64 92 104 Z" fill="${c.hairFill}"/>${strands(c, 'M116 84 Q116 62 124 50 M138 80 L138 50 M162 80 L162 50 M184 84 Q184 62 176 50')}${shine(c, 'M116 58 Q150 46 184 58')}` },
    halflang: { back: c => `<path d="${CAP} L218 216 Q150 236 82 216 Z" fill="${c.hairFill}"/>${strands(c, 'M102 130 Q98 170 100 210 M198 130 Q202 170 200 210')}`, front: c => `<path d="${CAP} Q206 68 156 60 Q98 70 92 104 Z" fill="${c.hairFill}"/><path d="M156 42 L156 62" stroke="${c.hairDk}" stroke-width="2.5" opacity=".5"/>${strands(c, 'M120 72 Q136 60 150 62 M170 66 Q186 72 196 84')}${shine(c, 'M112 62 Q130 50 148 52')}` },
    staart: detail(H0.staart, 'M120 66 Q136 56 150 58 M164 58 Q180 60 190 70', 'M212 90 Q244 120 236 180'),
    hoge_staart: { front: c => `<path d="M150 40 Q232 36 240 160" stroke="${c.hairFill}" stroke-width="26" stroke-linecap="round" fill="none"/>${shine(c, 'M168 46 Q222 52 232 120')}<path d="${CAP} Q198 72 150 68 Q102 72 92 104 Z" fill="${c.hairFill}"/><circle cx="152" cy="44" r="8" fill="#ff5da2"/>${strands(c, 'M120 70 Q136 58 150 56 M180 70 Q166 58 152 56 M108 90 Q118 76 130 70')}` },
    staartjes: detail(H0.staartjes, 'M120 80 Q120 62 128 50 M150 78 L150 48 M180 80 Q180 62 172 50', 'M84 130 Q70 160 78 200 M216 130 Q230 160 222 200'),
    kort_krul: { back: c => `<g fill="${c.hairFill}"><circle cx="94" cy="108" r="13"/><circle cx="206" cy="108" r="13"/><circle cx="100" cy="76" r="14"/><circle cx="200" cy="76" r="14"/></g>`, front: c => `<path d="${CAP} Q150 80 92 104 Z" fill="${c.hairFill}"/><g fill="${c.hairFill}"><circle cx="106" cy="94" r="12"/><circle cx="118" cy="74" r="12"/><circle cx="134" cy="60" r="12"/><circle cx="150" cy="56" r="12"/><circle cx="166" cy="60" r="12"/><circle cx="182" cy="74" r="12"/><circle cx="194" cy="94" r="12"/></g><g fill="${c.hairHi}" opacity=".5"><circle cx="122" cy="70" r="4"/><circle cx="150" cy="52" r="4"/><circle cx="178" cy="70" r="4"/></g>` },
    golvend_kort: { back: c => `<path d="${CAP} Q224 150 214 202 Q150 222 86 202 Q76 150 92 104 Z" fill="${c.hairFill}"/>${strands(c, 'M104 130 Q96 160 104 196 M196 130 Q204 160 196 196')}${shine(c, 'M108 140 Q100 170 108 190')}`, front: c => `<path d="${CAP} Q200 76 172 82 Q150 94 128 74 Q104 68 92 104 Z" fill="${c.hairFill}"/>${strands(c, 'M118 72 Q134 60 150 66 M176 78 Q188 70 196 84')}` },
    krullen: detail(H0.krullen, 'M116 78 Q120 68 128 66 M150 66 Q150 58 154 54'),
    zijstaart: { front: c => `<path d="${CAP} Q198 72 150 68 Q102 72 92 104 Z" fill="${c.hairFill}"/><path d="M206 92 Q248 140 222 256" stroke="${c.hairFill}" stroke-width="24" stroke-linecap="round" fill="none"/>${shine(c, 'M214 108 Q238 150 224 230')}<ellipse cx="210" cy="98" rx="7" ry="10" fill="#ff5da2" transform="rotate(-35 210 98)"/>${strands(c, 'M120 70 Q136 58 150 56 M112 88 Q120 74 132 68')}` },
    vlechten: detail(H0.vlechten, 'M124 66 Q120 54 128 46 M176 66 Q180 54 172 46'),
    knot: detail(H0.knot, 'M120 70 Q136 60 150 58 M180 70 Q166 60 152 58 M108 90 Q118 76 130 70'),
    afro_puffs: { front: c => `<circle cx="96" cy="60" r="28" fill="${c.hairFill}"/><circle cx="204" cy="60" r="28" fill="${c.hairFill}"/><g fill="${c.hairFill}"><circle cx="80" cy="44" r="12"/><circle cx="112" cy="36" r="12"/><circle cx="220" cy="44" r="12"/><circle cx="188" cy="36" r="12"/></g><path d="${CAP} Q150 78 92 104 Z" fill="${c.hairFill}"/><g fill="${c.hairHi}" opacity=".4"><circle cx="90" cy="52" r="6"/><circle cx="198" cy="52" r="6"/></g><path d="M118 88 Q118 78 110 70 M182 88 Q182 78 190 70" stroke="#ff5da2" stroke-width="4" fill="none"/>` },
    golvend: detail(H0.golvend, 'M116 78 Q130 66 148 70 M176 82 Q188 76 196 88'),
    afro: detail(H0.afro, 'M120 92 Q130 84 142 86 M158 86 Q170 84 180 92'),
    dreads: { back: c => { let s = `<g stroke="${c.hairFill}" stroke-width="13" stroke-linecap="round" fill="none">`; [[96, 112, 84, 240], [108, 116, 100, 246], [192, 116, 200, 246], [204, 112, 216, 240], [122, 120, 118, 236], [178, 120, 182, 236]].forEach(([x1, y1, x2, y2]) => { s += `<path d="M${x1} ${y1} Q${(x1 + x2) / 2 + (x1 < 150 ? -6 : 6)} ${(y1 + y2) / 2} ${x2} ${y2}"/>`; }); return s + `</g><g stroke="${c.hairDk}" stroke-width="2" opacity=".35"><path d="M86 160 L98 164 M88 200 L100 204 M202 160 L214 164 M200 200 L212 204"/></g>`; }, front: c => `<path d="${CAP} Q150 74 92 104 Z" fill="${c.hairFill}"/>${strands(c, 'M110 90 Q112 60 126 46 M132 82 Q132 52 142 42 M168 82 Q168 52 158 42 M190 90 Q188 60 174 46')}` },
    spacebuns: detail(H0.spacebuns, 'M120 80 Q120 62 128 50 M150 78 L150 48 M180 80 Q180 62 172 50'),
    zijvlecht: { front: c => { let s = `<path d="${CAP} Q206 68 156 60 Q98 70 92 104 Z" fill="${c.hairFill}"/><g fill="${c.hairFill}">`; for (let i = 0; i < 8; i++) { const t = i / 7; s += `<circle cx="${(196 + 16 * t + (i % 2 ? 4 : -4)).toFixed(1)}" cy="${(96 + 160 * t).toFixed(1)}" r="11"/>`; } return s + `</g><circle cx="214" cy="262" r="6" fill="#ff5da2"/>${strands(c, 'M120 72 Q136 60 150 62 M170 66 Q186 72 196 84')}`; } },
    krullen_lang: { back: c => { let s = `<path d="${CAP} L222 250 Q150 270 78 250 Z" fill="${c.hairFill}"/><g fill="${c.hairFill}">`; [[84, 252], [110, 262], [138, 266], [164, 266], [192, 262], [216, 252], [92, 210], [208, 210], [88, 170], [212, 170]].forEach(([x, y]) => { s += `<circle cx="${x}" cy="${y}" r="15"/>`; }); return s + `</g><g fill="${c.hairHi}" opacity=".4"><circle cx="100" cy="256" r="5"/><circle cx="200" cy="256" r="5"/><circle cx="94" cy="174" r="4"/><circle cx="206" cy="174" r="4"/></g>`; }, front: c => `<path d="${CAP} Q150 80 92 104 Z" fill="${c.hairFill}"/><g fill="${c.hairFill}"><circle cx="106" cy="94" r="12"/><circle cx="122" cy="74" r="12"/><circle cx="150" cy="64" r="13"/><circle cx="178" cy="74" r="12"/><circle cx="194" cy="94" r="12"/></g><g fill="${c.hairHi}" opacity=".5"><circle cx="124" cy="70" r="4"/><circle cx="176" cy="70" r="4"/></g>` },
    hanenkam: detail(H0.hanenkam, 'M112 60 L118 44 M138 50 L142 32 M162 46 L160 30 M186 60 L182 44'),
    opgestoken: { front: c => `<circle cx="150" cy="34" r="26" fill="${c.hairFill}"/><path d="${CAP} Q198 72 150 68 Q102 72 92 104 Z" fill="${c.hairFill}"/><path d="M98 112 Q86 134 96 156 M202 112 Q214 134 204 156" stroke="${c.hairFill}" stroke-width="6" stroke-linecap="round" fill="none"/>${strands(c, 'M130 40 Q150 22 170 40 M136 52 Q150 44 164 52 M120 70 Q136 58 150 56 M180 70 Q166 58 152 56')}${shine(c, 'M136 26 Q150 18 164 26')}${flower(128, 44, 5, '#ff8fab')}${flower(172, 44, 5, '#ff8fab')}` },
    prinses: detail(H0.prinses, 'M120 78 Q134 66 150 68 M180 78 Q166 66 150 68'),
    kroonvlecht: { back: H0.lang.back, front: c => { let s = `<path d="${CAP} Q206 68 156 60 Q98 70 92 104 Z" fill="${c.hairFill}"/><g fill="${c.hairFill}" stroke="${c.hairDk}" stroke-width="1" stroke-opacity=".3">`; for (let i = 0; i <= 10; i++) { const a = Math.PI + Math.PI * i / 10; s += `<circle cx="${(150 + 56 * Math.cos(a)).toFixed(1)}" cy="${(104 + 62 * Math.sin(a)).toFixed(1)}" r="9"/>`; } return s + `</g>${flower(118, 60, 4, '#ff8fab')}${flower(182, 60, 4, '#ff8fab')}${flower(150, 42, 4, '#7cc4ff')}`; } },
  };

  /* ---------- kleding: tops ---------- */
  const TORSO ='M102 176 L134 176 Q150 194 166 176 L198 176 L192 214 L186 270 Q150 278 114 270 L108 214 Z';
  const TORSO_LONG = 'M100 176 L134 176 Q150 194 166 176 L200 176 L206 306 L94 306 Z';
  const SL = {
    short: f => `<path d="M113 190 L103 218" stroke="${f}" stroke-width="28" stroke-linecap="round" fill="none"/><path d="M187 190 L197 218" stroke="${f}" stroke-width="28" stroke-linecap="round" fill="none"/>`,
    long: (f, w = 26) => `<path d="M113 190 L96 242 L91 282" stroke="${f}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M187 190 L204 242 L209 282" stroke="${f}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`,
    cuffs: c => `<path d="M93 274 L91 282 M207 274 L209 282" stroke="${c}" stroke-width="26" stroke-linecap="round"/>`,
  };
  const TOP_DECO = {
    skull: c => `<circle cx="150" cy="222" r="14" fill="${c}"/><rect x="142" y="232" width="16" height="10" rx="3" fill="${c}"/><circle cx="144" cy="220" r="4" fill="#23202a"/><circle cx="156" cy="220" r="4" fill="#23202a"/><path d="M147 232 L150 228 L153 232 Z" fill="#23202a"/>`,
    leaves: c => `<g fill="${c}"><path d="M120 206 Q136 196 146 214 Q130 222 120 206Z"/><path d="M180 206 Q164 196 154 214 Q170 222 180 206Z"/><path d="M134 244 Q150 234 160 252 Q144 260 134 244Z"/></g>`,
    skeleton: c => `<g stroke="${c}" stroke-width="5" stroke-linecap="round" fill="none"><path d="M150 196 L150 262"/><path d="M128 208 Q150 216 172 208 M126 222 Q150 230 174 222 M130 236 Q150 244 170 236 M134 250 Q150 256 166 250"/><path d="M113 196 L98 240 M187 196 L202 240"/></g>`,
    bolt: c => `<path d="M156 196 L136 232 L150 232 L142 262 L166 222 L152 222 Z" fill="${c}"/>`,
    nordic: c => `<g fill="${c}"><path d="M110 206 L190 206 L190 212 L110 212 Z M112 236 L188 236 L188 240 L112 240 Z"/>${[122, 136, 150, 164, 178].map(x => `<path d="M${x} 224 L${x - 5} 219 L${x} 214 L${x + 5} 219 Z"/>`).join('')}${[118, 134, 150, 166, 182].map(x => `<circle cx="${x}" cy="250" r="2.5"/>`).join('')}</g>`,
    xmas: c => `<path d="M150 200 L134 236 L166 236 Z" fill="#2d9a6a"/><path d="M150 212 L140 236 L160 236 Z" fill="#3fbf63"/><path d="${starPath(150, 200, 5)}" fill="#ffd23f"/><g fill="${c}"><circle cx="122" cy="214" r="3"/><circle cx="178" cy="214" r="3"/><circle cx="118" cy="250" r="3"/><circle cx="182" cy="250" r="3"/><circle cx="150" cy="262" r="3"/></g>`,
  };
  const TOPS = {
    tshirt: (ctx, it) => { const f = fillOf(ctx, it); return SL.short(f) + `<path d="${TORSO}" fill="${f}"/>` + (it.deco ? TOP_DECO[it.deco](c2of(it)) : ''); },
    tank: (ctx, it) => { const f = fillOf(ctx, it); return `<path d="M112 176 L122 176 L130 200 L170 200 L178 176 L188 176 L192 214 L186 270 Q150 278 114 270 L108 214 Z" fill="${f}"/>` + (it.deco ? TOP_DECO[it.deco](c2of(it)) : ''); },
    sweater: (ctx, it) => { const f = fillOf(ctx, it), c2 = it.pattern ? dark(c1of(it), .2) : c2of(it); return SL.long(f) + SL.cuffs(it.pattern === 'rainbow' ? '#ffb347' : c2) + `<path d="${TORSO}" fill="${f}"/><path d="M114 264 L186 264 L186 272 Q150 280 114 272 Z" fill="${it.pattern === 'rainbow' ? '#c47bff' : c2}"/>` + (it.deco ? TOP_DECO[it.deco](c2of(it)) : ''); },
    turtleneck: (ctx, it) => { const f = fillOf(ctx, it), c2 = dark(c1of(it), .2); return SL.long(f) + SL.cuffs(c2) + `<path d="${TORSO}" fill="${f}"/><rect x="132" y="148" width="36" height="34" rx="10" fill="${f}"/><path d="M132 158 L168 158" stroke="${c2}" stroke-width="2" opacity=".5"/>`; },
    sportshirt: (ctx, it) => { const c1 = c1of(it), c2 = c2of(it); return SL.short(c1) + `<path d="M113 190 L103 218" stroke="${c2}" stroke-width="6" stroke-linecap="round"/><path d="M187 190 L197 218" stroke="${c2}" stroke-width="6" stroke-linecap="round"/><path d="${TORSO}" fill="${c1}"/><path d="M110 216 L190 216" stroke="${c2}" stroke-width="6"/><text x="150" y="252" font-size="26" font-weight="800" text-anchor="middle" fill="${c2}" font-family="Baloo 2, Nunito, sans-serif">7</text>`; },
    trackjacket: (ctx, it) => { const c1 = c1of(it), c2 = c2of(it); return SL.long(c1) + `<path d="M108 208 L96 242 M192 208 L204 242" stroke="${c2}" stroke-width="5" stroke-linecap="round"/><path d="${TORSO}" fill="${c1}"/><path d="M150 190 L150 270" stroke="${c2}" stroke-width="3"/><path d="M134 176 Q150 194 166 176 L170 170 Q150 184 130 170 Z" fill="${c2}"/>`; },
    puffer: (ctx, it) => { const c1 = c1of(it), d = dark(c1, .18); return SL.long(c1, 32) + `<path d="M98 176 L134 176 Q150 194 166 176 L202 176 L206 302 L94 302 Z" fill="${c1}"/><g stroke="${d}" stroke-width="2" fill="none" opacity=".5"><path d="M98 204 Q150 212 202 204 M96 232 Q150 240 204 232 M95 260 Q150 268 205 260 M94 288 Q150 296 206 288"/></g><path d="M150 182 L150 300" stroke="${d}" stroke-width="3"/><path d="M126 176 Q150 192 174 176 L178 168 Q150 182 122 168 Z" fill="${d}"/>`; },
    blouse: (ctx, it) => { const f = fillOf(ctx, it), c2 = it.pattern ? dark(c1of(it), .3) : c2of(it); return SL.short(f) + `<path d="${TORSO}" fill="${f}"/><path d="M132 176 L150 200 L168 176 L176 184 L150 212 L124 184 Z" fill="${it.pattern ? '#fff' : f}" stroke="${c2}" stroke-width="2"/><g fill="${c2}"><circle cx="150" cy="222" r="2.5"/><circle cx="150" cy="238" r="2.5"/><circle cx="150" cy="254" r="2.5"/></g>`; },
    tuxedo: (ctx, it) => { const c1 = c1of(it), c2 = c2of(it); return SL.long(c1) + `<path d="${TORSO}" fill="${c1}"/><path d="M136 176 L164 176 L162 268 L138 268 Z" fill="${c2}"/><path d="M134 176 L150 232 L120 186 Z M166 176 L150 232 L180 186 Z" fill="${dark(c1, .3)}"/><circle cx="150" cy="240" r="2.5" fill="${c1}"/><circle cx="150" cy="254" r="2.5" fill="${c1}"/>`; },
    raincoat: (ctx, it) => { const c1 = c1of(it), d = dark(c1, .2); return SL.long(c1, 28) + `<path d="${TORSO_LONG}" fill="${c1}"/><path d="M116 176 Q150 202 184 176 L188 166 Q150 150 112 166 Z" fill="${d}"/><g fill="${d}"><circle cx="150" cy="212" r="4"/><circle cx="150" cy="238" r="4"/><circle cx="150" cy="264" r="4"/><circle cx="150" cy="290" r="4"/></g><rect x="108" y="252" width="26" height="24" rx="4" fill="${d}" opacity=".6"/><rect x="166" y="252" width="26" height="24" rx="4" fill="${d}" opacity=".6"/>`; },
    leather: (ctx, it) => { const c1 = c1of(it), c2 = c2of(it); return SL.long(c1) + `<path d="${TORSO}" fill="${c1}"/><path d="M134 176 L150 210 L118 194 Z M166 176 L150 210 L182 194 Z" fill="${dark(c1, .4)}" stroke="${c2}" stroke-width="1.5"/><path d="M150 210 L150 268" stroke="${c2}" stroke-width="3"/><path d="M120 236 L134 236 M166 236 L180 236" stroke="${c2}" stroke-width="3"/><path d="M104 190 Q100 210 106 226 M196 190 Q200 210 194 226" stroke="${c2}" stroke-width="2" fill="none"/>`; },
    spacesuit: (ctx, it) => { const c1 = c1of(it), c2 = c2of(it), d = dark(c1, .2); return SL.long(c1, 32) + `<path d="M98 176 L134 176 Q150 194 166 176 L202 176 L206 302 L94 302 Z" fill="${c1}"/><ellipse cx="150" cy="178" rx="34" ry="9" fill="${d}"/><rect x="128" y="206" width="44" height="34" rx="6" fill="${c2}"/><rect x="134" y="212" width="32" height="8" rx="2" fill="${d}"/><g fill="${d}"><circle cx="138" cy="230" r="3"/><circle cx="150" cy="230" r="3"/><circle cx="162" cy="230" r="3"/></g><path d="M98 260 L202 260" stroke="${c2}" stroke-width="6"/><path d="M104 196 L98 240 M196 196 L202 240" stroke="${c2}" stroke-width="4"/>`; },
    hero: (ctx, it) => { const c1 = c1of(it), c2 = c2of(it); return SL.long(c1) + `<path d="${TORSO}" fill="${c1}"/><path d="${starPath(150, 226, 22, 10)}" fill="${c2}"/><path d="M102 176 L134 176 Q150 194 166 176 L198 176 L194 196 Q150 208 106 196 Z" fill="${dark(c1, .3)}"/>`; },
    hoodie: (ctx, it) => { const c1 = c1of(it), c2 = c2of(it), d = dark(c1, .15); return SL.long(c1) + SL.cuffs(d) + `<path d="${TORSO}" fill="${c1}"/><path d="M114 264 L186 264 L186 272 Q150 280 114 272 Z" fill="${d}"/><path d="M116 176 Q150 206 184 176 L190 166 Q150 148 110 166 Z" fill="${d}"/><path d="M126 238 L174 238 L170 268 L130 268 Z" fill="${d}" opacity=".7"/><path d="M142 190 L139 220 M158 190 L161 220" stroke="${c2}" stroke-width="3" stroke-linecap="round"/><circle cx="139" cy="222" r="2.5" fill="${c2}"/><circle cx="161" cy="222" r="2.5" fill="${c2}"/>`; },
    polo: (ctx, it) => { const c1 = c1of(it), c2 = c2of(it), d = dark(c1, .25); return SL.short(c1) + `<path d="M96 214 Q103 220 110 214 M190 214 Q197 220 204 214" stroke="${c2}" stroke-width="3" fill="none"/><path d="${TORSO}" fill="${c1}"/><path d="M132 176 L150 198 L168 176 L174 184 L150 208 L126 184 Z" fill="${c1}" stroke="${d}" stroke-width="2"/><path d="M150 198 L150 224" stroke="${d}" stroke-width="2"/><circle cx="150" cy="210" r="2.5" fill="${c2}"/><circle cx="150" cy="220" r="2.5" fill="${c2}"/>`; },
    cardigan: (ctx, it) => { const c1 = c1of(it), c2 = c2of(it), d = dark(c1, .2); return `<path d="M134 176 L166 176 L164 270 L136 270 Z" fill="${c2}"/>` + SL.long(c1) + SL.cuffs(d) + `<path d="M102 176 L134 176 L140 270 Q124 278 114 270 L108 214 Z" fill="${c1}"/><path d="M198 176 L166 176 L160 270 Q176 278 186 270 L192 214 Z" fill="${c1}"/><path d="M134 176 L140 270 M166 176 L160 270" stroke="${d}" stroke-width="2"/><g fill="${d}"><circle cx="144" cy="200" r="2.5"/><circle cx="145" cy="222" r="2.5"/><circle cx="146" cy="244" r="2.5"/></g>`; },
    leotard: (ctx, it) => { const f = fillOf(ctx, it), c1 = c1of(it); return `<path d="M112 176 L122 176 L130 200 L170 200 L178 176 L188 176 L192 214 L190 298 Q150 308 110 298 L108 214 Z" fill="${f}"/><path d="M130 200 Q150 190 170 200" stroke="${dark(c1, .2)}" stroke-width="2" fill="none"/>${it.pattern ? '' : `<path d="M116 230 Q150 244 184 230" stroke="${light(c1, .35)}" stroke-width="2" fill="none" opacity=".7"/>`}`; },
    pirateshirt: (ctx, it) => { const c1 = c1of(it), c2 = c2of(it); return SL.long(c1, 32) + SL.cuffs(c2) + `<path d="${TORSO}" fill="${c1}"/><path d="M134 176 L150 220 L166 176" fill="none" stroke="${c2}" stroke-width="2"/><path d="M140 184 L160 184 M138 194 L162 194 M142 204 L158 204" stroke="${c2}" stroke-width="2"/><path d="M104 200 L196 262 L192 276 L102 216 Z" fill="${c2}"/>`; },
  };

  /* ---------- kleding: broeken & rokken ---------- */
  const BOTTOMS = {
    pants: (ctx, it) => { const f = fillOf(ctx, it), c2 = it.pattern ? dark(c1of(it), .3) : c2of(it); return `<path d="M110 290 L190 290 L188 452 L157 452 L150 335 L143 452 L112 452 Z" fill="${f}"/><rect x="110" y="288" width="80" height="12" rx="3" fill="${c2}"/><path d="M118 304 Q126 316 134 304 M166 304 Q174 316 182 304" stroke="${c2}" stroke-width="2" fill="none" opacity=".6"/>`; },
    shorts: (ctx, it) => { const f = fillOf(ctx, it), c2 = it.pattern ? dark(c1of(it), .3) : c2of(it); return `<path d="M110 290 L190 290 L193 352 L157 352 L150 322 L143 352 L107 352 Z" fill="${f}"/><rect x="110" y="288" width="80" height="12" rx="3" fill="${c2}"/>`; },
    sportshorts: (ctx, it) => { const c1 = c1of(it), c2 = c2of(it); return `<path d="M110 290 L190 290 L193 352 L157 352 L150 322 L143 352 L107 352 Z" fill="${c1}"/><rect x="110" y="288" width="80" height="12" rx="3" fill="${c2}"/><path d="M114 302 L110 350 M186 302 L190 350" stroke="${c2}" stroke-width="5" stroke-linecap="round"/>`; },
    legging: (ctx, it) => { const c1 = c1of(it), f = fillOf(ctx, it); let s = `<path d="M112 290 L188 290 L184 454 L157 454 L150 335 L143 454 L116 454 Z" fill="${f}"/><rect x="112" y="288" width="76" height="10" rx="3" fill="${dark(c1, .3)}"/>`; if (it.deco === 'rips') s += `<g stroke="${ctx.skin}" stroke-width="3" stroke-linecap="round"><path d="M124 360 L140 362 M128 372 L138 373 M162 396 L176 398"/></g>`; if (it.deco === 'belt') s += `<rect x="110" y="292" width="80" height="14" rx="4" fill="${c2of(it)}"/><rect x="142" y="290" width="16" height="18" rx="3" fill="${dark(c2of(it), .3)}"/>`; return s; },
    skirt: (ctx, it) => { const f = fillOf(ctx, it), c2 = it.pattern ? dark(c1of(it), .3) : c2of(it); let s = `<path d="M112 292 L188 292 L204 374 Q150 388 96 374 Z" fill="${f}"/><rect x="112" y="288" width="76" height="10" rx="3" fill="${it.pattern === 'rainbow' ? '#ff5c5c' : c2}"/>`; if (it.deco === 'web') s += `<g stroke="${c2}" stroke-width="1.5" fill="none" opacity=".8"><path d="M150 300 L150 384 M150 300 L104 372 M150 300 L196 372 M150 300 L118 380 M150 300 L182 380"/><path d="M138 320 Q150 326 162 320 M128 342 Q150 352 172 342 M118 364 Q150 378 182 364"/></g>`; return s; },
    pleated: (ctx, it) => { const c1 = c1of(it), c2 = c2of(it); return `<path d="M112 292 L188 292 L206 376 Q150 390 94 376 Z" fill="${c1}"/><g stroke="${dark(c1, .25)}" stroke-width="2.5" fill="none"><path d="M124 300 L116 378 M137 300 L133 382 M150 300 L150 384 M163 300 L167 382 M176 300 L184 378"/></g><rect x="112" y="288" width="76" height="10" rx="3" fill="${c2}"/>`; },
    joggers: (ctx, it) => { const c1 = c1of(it), c2 = c2of(it); return `<path d="M110 290 L190 290 L188 446 L157 446 L150 335 L143 446 L112 446 Z" fill="${c1}"/><rect x="110" y="288" width="80" height="12" rx="3" fill="${dark(c1, .2)}"/><path d="M144 300 L141 318 M156 300 L159 318" stroke="${c2}" stroke-width="3" stroke-linecap="round"/><rect x="112" y="444" width="31" height="10" rx="3" fill="${c2}"/><rect x="157" y="444" width="31" height="10" rx="3" fill="${c2}"/><path d="M116 304 L114 440 M184 304 L186 440" stroke="${c2}" stroke-width="4"/>`; },
    tutu: (ctx, it) => { const c1 = c1of(it), hi = light(c1, .35); const layer = (dy, op) => `<path transform="translate(0 ${dy})" d="M108 292 L192 292 Q214 330 220 352 Q204 342 192 358 Q176 342 162 360 Q150 344 138 360 Q124 342 108 358 Q96 342 80 352 Q86 330 108 292 Z" fill="${hi}" opacity="${op}"/>`; return `<path d="M112 292 L188 292 L200 350 Q150 362 100 350 Z" fill="${c1}"/>${layer(0, .55)}${layer(10, .5)}${layer(-6, .45)}<rect x="112" y="288" width="76" height="10" rx="3" fill="${dark(c1, .2)}"/>`; },
  };

  /* ---------- kleding: jurken ---------- */
  const BODICE = 'M104 176 L134 176 Q150 194 166 176 L196 176 L190 214 L184 258 L116 258 L110 214 Z';
  const DRESSES = {
    aline: (ctx, it) => { const f = fillOf(ctx, it), c2 = it.pattern ? dark(c1of(it), .25) : c2of(it); let s = SL.short(f) + `<path d="${BODICE}" fill="${f}"/><path d="M116 256 L184 256 L210 392 Q150 406 90 392 Z" fill="${f}"/><path d="M116 254 L184 254 L184 262 L116 262 Z" fill="${it.pattern === 'rainbow' ? '#5fe38a' : c2}"/>`; if (it.deco === 'trim') s += `<path d="M90 392 Q150 406 210 392 L208 380 Q150 394 92 380 Z" fill="${c2}"/><path d="M103 218 L103 218" stroke="${c2}" stroke-width="28" stroke-linecap="round"/><path d="M197 218 L197 218" stroke="${c2}" stroke-width="28" stroke-linecap="round"/>`; return s; },
    sundress: (ctx, it) => { const f = fillOf(ctx, it), c1 = c1of(it); return `<path d="M120 176 L127 200 M180 176 L173 200" stroke="${c1}" stroke-width="6" stroke-linecap="round"/><path d="M112 198 L188 198 L184 258 L116 258 Z" fill="${f}"/><path d="M116 256 L184 256 L206 372 Q192 380 178 372 Q164 380 150 372 Q136 380 122 372 Q108 380 94 372 Z" fill="${f}"/><path d="M116 254 L184 254 L184 262 L116 262 Z" fill="${dark(c1, .2)}"/>`; },
    ballgown: (ctx, it) => { const f = fillOf(ctx, it), c1 = c1of(it), c2 = c2of(it); return `<path d="M118 178 L122 196 M182 178 L178 196" stroke="${c1}" stroke-width="4" stroke-linecap="round"/><path d="M112 192 Q150 176 188 192 L184 258 L116 258 Z" fill="${f}"/><path d="M116 256 L184 256 Q244 340 260 464 Q150 488 40 464 Q56 340 116 256 Z" fill="${f}"/><path d="M116 256 Q120 360 84 460 M184 256 Q180 360 216 460" stroke="${c2}" stroke-width="3" fill="none" opacity=".6"/><path d="M116 254 L184 254 L184 262 L116 262 Z" fill="${c2}"/>${sparkles([[110, 340], [190, 320], [150, 400], [80, 430], [222, 420]], '#fff', 5)}`; },
    princess: (ctx, it) => { const c1 = c1of(it), c2 = c2of(it), hi = light(c1, .3); return `<circle cx="106" cy="192" r="17" fill="${hi}"/><circle cx="194" cy="192" r="17" fill="${hi}"/><path d="M112 192 Q150 176 188 192 L184 258 L116 258 Z" fill="${c1}"/><path d="M116 256 L184 256 Q244 340 260 464 Q150 488 40 464 Q56 340 116 256 Z" fill="${c1}"/><path d="M150 256 Q150 360 150 468" stroke="${hi}" stroke-width="30" opacity=".7"/><path d="M40 464 Q150 488 260 464 L258 452 Q150 476 42 452 Z" fill="${c2}"/><path d="M116 254 L184 254 L184 262 L116 262 Z" fill="${c2}"/><path d="M150 258 L136 246 L138 262 Z M150 258 L164 246 L162 262 Z" fill="${c2}"/><circle cx="150" cy="258" r="4" fill="${dark(c2, .15)}"/>${sparkles([[110, 340], [190, 320], [100, 420], [200, 430], [150, 380]], '#fff', 4)}`; },
    witch: (ctx, it) => { const c1 = c1of(it), c2 = c2of(it); return SL.long(c1) + `<path d="${BODICE}" fill="${c1}"/><path d="M116 256 L184 256 L214 442 L200 422 L190 454 L176 430 L160 458 L148 432 L134 458 L120 430 L108 454 L96 424 L86 442 Z" fill="${c1}"/><path d="M116 252 L184 252 L184 264 L116 264 Z" fill="${c2}"/><rect x="142" y="250" width="16" height="16" rx="3" fill="#f1c232"/><path d="M96 280 Q150 300 204 280" stroke="${c2}" stroke-width="2" fill="none" opacity=".6"/>`; },
    overall: (ctx, it) => { const c1 = c1of(it), c2 = c2of(it), d = dark(c1, .2); return SL.short(c2) + `<path d="${TORSO}" fill="${c2}"/><path d="M110 290 L190 290 L188 452 L157 452 L150 335 L143 452 L112 452 Z" fill="${c1}"/><path d="M124 200 L176 200 L180 296 L120 296 Z" fill="${c1}"/><path d="M128 200 L118 176 M172 200 L182 176" stroke="${c1}" stroke-width="9" stroke-linecap="round"/><path d="M136 222 L164 222 L162 246 L138 246 Z" fill="${d}"/><circle cx="128" cy="204" r="3.5" fill="#f1c232"/><circle cx="172" cy="204" r="3.5" fill="#f1c232"/><path d="M110 290 L190 290" stroke="${d}" stroke-width="3"/><path d="M118 306 Q126 318 134 306 M166 306 Q174 318 182 306" stroke="${d}" stroke-width="2" fill="none" opacity=".6"/>`; },
    onesie: (ctx, it) => { const f = fillOf(ctx, it), c1 = c1of(it), c2 = c2of(it), d = dark(c1, .12); return SL.long(f, 30) + `<path d="M100 176 L134 176 Q150 194 166 176 L200 176 L204 300 L96 300 Z" fill="${f}"/><path d="M110 296 L190 296 L188 452 L157 452 L150 335 L143 452 L112 452 Z" fill="${f}"/><path d="M116 176 Q150 206 184 176 L190 166 Q150 148 110 166 Z" fill="${c2}"/><path d="M150 190 L150 300" stroke="${d}" stroke-width="3"/><ellipse cx="150" cy="250" rx="26" ry="20" fill="${c2}" opacity=".9"/><path d="M112 452 L143 452 L143 460 L112 460 Z M157 452 L188 452 L188 460 L157 460 Z" fill="${c2}"/>`; },
    swimsuit: (ctx, it) => { const f = fillOf(ctx, it), c1 = c1of(it); return `<path d="M112 176 L122 176 L130 200 L170 200 L178 176 L188 176 L192 214 L188 300 L157 300 L150 292 L143 300 L112 300 L108 214 Z" fill="${f}"/><path d="M130 200 Q150 190 170 200" stroke="${dark(c1, .2)}" stroke-width="2" fill="none"/>`; },
    jumpsuit: (ctx, it) => { const f = fillOf(ctx, it), c1 = c1of(it), c2 = c2of(it); return `<path d="M118 176 L124 198 M182 176 L176 198" stroke="${c1}" stroke-width="5" stroke-linecap="round"/><path d="M112 196 L188 196 L186 258 L114 258 Z" fill="${f}"/><path d="M112 256 L188 256 L190 452 L157 452 L150 335 L143 452 L110 452 Z" fill="${f}"/><rect x="112" y="252" width="76" height="12" rx="4" fill="${c2}"/><rect x="142" y="250" width="16" height="16" rx="3" fill="${dark(c2, .25)}"/>`; },
    mermaid: (ctx, it) => { const f = fillOf(ctx, it), c1 = c1of(it), c2 = c2of(it); return `<path d="M112 192 Q150 176 188 192 L184 258 L116 258 Z" fill="${f}"/><path d="M116 256 L184 256 L188 382 Q150 398 112 382 Z" fill="${f}"/><path d="M112 382 Q150 398 188 382 Q226 436 238 470 Q150 490 62 470 Q74 436 112 382 Z" fill="${c2}"/><path d="M150 396 L150 480 M124 400 L92 468 M176 400 L208 468" stroke="${light(c2, .3)}" stroke-width="2" fill="none" opacity=".6"/><path d="M116 254 L184 254 L184 262 L116 262 Z" fill="${c2}"/>${sparkles([[130, 300], [170, 340], [150, 440]], '#fff', 4)}`; },
  };

  /* ---------- schoenen ---------- */
  const feet = fn => fn(129) + fn(171);
  const SOLE = (cx, c) => `<path d="M${cx - 20} 468 L${cx + 20} 468 L${cx + 20} 476 Q${cx} 483 ${cx - 20} 476 Z" fill="${c}"/>`;
  const SHOES = {
    sneaker: (ctx, it) => feet(cx => `<rect x="${cx - 19}" y="448" width="38" height="30" rx="14" fill="${it.c[0]}"/>${SOLE(cx, '#f4f4f4')}<path d="M${cx - 19} 460 Q${cx} 452 ${cx + 19} 460" stroke="${c2of(it)}" stroke-width="4" fill="none"/><path d="M${cx - 7} 456 L${cx + 7} 456 M${cx - 7} 462 L${cx + 7} 462" stroke="${dark(it.c[0], .3)}" stroke-width="1.5"/>`),
    boot: (ctx, it) => feet(cx => `<rect x="${cx - 18}" y="406" width="36" height="72" rx="10" fill="${it.c[0]}"/><rect x="${cx - 18}" y="406" width="36" height="12" rx="6" fill="${c2of(it)}"/>${SOLE(cx, c2of(it))}<path d="M${cx - 6} 430 L${cx + 6} 430 M${cx - 6} 440 L${cx + 6} 440 M${cx - 6} 450 L${cx + 6} 450" stroke="${dark(it.c[0], .4)}" stroke-width="1.5"/>`),
    rainboot: (ctx, it) => feet(cx => `<rect x="${cx - 18}" y="394" width="36" height="84" rx="10" fill="${it.c[0]}"/>${SOLE(cx, c2of(it))}<path d="M${cx - 10} 404 L${cx - 10} 450" stroke="${light(it.c[0], .4)}" stroke-width="4" stroke-linecap="round" opacity=".7"/><rect x="${cx - 18}" y="394" width="36" height="8" rx="4" fill="${dark(it.c[0], .2)}"/>`),
    snowboot: (ctx, it) => feet(cx => `<rect x="${cx - 18}" y="412" width="36" height="66" rx="10" fill="${it.c[0]}"/><rect x="${cx - 21}" y="412" width="42" height="16" rx="8" fill="${c2of(it)}"/>${SOLE(cx, dark(it.c[0], .3))}<path d="M${cx - 6} 436 L${cx + 6} 440 M${cx - 6} 446 L${cx + 6} 450" stroke="${c2of(it)}" stroke-width="2"/>`),
    heels: (ctx, it) => feet(cx => `<path d="M${cx - 18} 477 Q${cx - 12} 458 ${cx + 6} 461 Q${cx + 18} 464 ${cx + 18} 477 Z" fill="${it.c[0]}"/><path d="M${cx - 16} 463 L${cx + 12} 461" stroke="${it.c[0]}" stroke-width="3"/><rect x="${cx + 10}" y="476" width="5" height="9" rx="1" fill="${dark(it.c[0], .2)}"/>${it.c[1] && it.c[1] !== it.c[0] ? `<g fill="#fff"><circle cx="${cx - 8}" cy="470" r="1.3"/><circle cx="${cx + 2}" cy="466" r="1.3"/><circle cx="${cx + 10}" cy="471" r="1.3"/></g>` : `<path d="M${cx - 10} 468 Q${cx} 474 ${cx + 10} 468" stroke="${light(it.c[0], .4)}" stroke-width="1.5" fill="none"/>`}`),
    dress: (ctx, it) => feet(cx => `<path d="M${cx - 19} 478 Q${cx - 19} 458 ${cx} 457 Q${cx + 19} 458 ${cx + 19} 478 Z" fill="${it.c[0]}"/><path d="M${cx - 10} 466 Q${cx} 462 ${cx + 8} 466" stroke="${light(it.c[0], .5)}" stroke-width="2" fill="none" opacity=".7"/>`),
    flipflop: (ctx, it) => feet(cx => `<ellipse cx="${cx}" cy="474" rx="21" ry="7" fill="${it.c[0]}"/><path d="M${cx} 464 L${cx - 13} 474 M${cx} 464 L${cx + 13} 474" stroke="${c2of(it)}" stroke-width="3.5" stroke-linecap="round"/>`),
    sandal: (ctx, it) => feet(cx => `<ellipse cx="${cx}" cy="475" rx="21" ry="6" fill="${it.c[0]}"/><path d="M${cx - 16} 468 L${cx + 16} 468 M${cx - 13} 460 L${cx + 13} 460" stroke="${c2of(it)}" stroke-width="4" stroke-linecap="round"/>`),
    ballet: (ctx, it) => feet(cx => `<path d="M${cx - 8} 462 L${cx - 5} 436 M${cx + 8} 462 L${cx + 5} 436" stroke="${it.c[0]}" stroke-width="3"/><path d="M${cx - 19} 478 Q${cx - 19} 461 ${cx} 461 Q${cx + 19} 461 ${cx + 19} 478 Z" fill="${it.c[0]}"/><path d="M${cx} 464 L${cx - 6} 459 L${cx - 5} 467 Z M${cx} 464 L${cx + 6} 459 L${cx + 5} 467 Z" fill="${dark(it.c[0], .2)}"/>`),
    bunny: (ctx, it) => feet(cx => `<ellipse cx="${cx - 7}" cy="450" rx="5" ry="12" fill="${it.c[0]}"/><ellipse cx="${cx + 7}" cy="450" rx="5" ry="12" fill="${it.c[0]}"/><ellipse cx="${cx - 7}" cy="451" rx="2.5" ry="8" fill="${it.c[1]}"/><ellipse cx="${cx + 7}" cy="451" rx="2.5" ry="8" fill="${it.c[1]}"/><ellipse cx="${cx}" cy="468" rx="22" ry="12" fill="${it.c[0]}"/><circle cx="${cx - 6}" cy="466" r="2" fill="#222"/><circle cx="${cx + 6}" cy="466" r="2" fill="#222"/><ellipse cx="${cx}" cy="471" rx="3" ry="2" fill="${it.c[1]}"/>`),
    monster: (ctx, it) => feet(cx => `<ellipse cx="${cx}" cy="466" rx="22" ry="14" fill="${it.c[0]}"/><path d="M${cx - 22} 460 L${cx - 18} 450 L${cx - 12} 458 L${cx - 6} 448 L${cx} 458 L${cx + 6} 448 L${cx + 12} 458 L${cx + 18} 450 L${cx + 22} 460" fill="${it.c[0]}"/><circle cx="${cx - 7}" cy="462" r="5" fill="#fff"/><circle cx="${cx + 7}" cy="462" r="5" fill="#fff"/><circle cx="${cx - 6}" cy="463" r="2.5" fill="#222"/><circle cx="${cx + 8}" cy="463" r="2.5" fill="#222"/><path d="M${cx - 8} 472 L${cx - 5} 476 L${cx - 2} 472 L${cx + 1} 476 L${cx + 4} 472 L${cx + 7} 476 L${cx + 9} 472" fill="#fff"/>`),
    spaceboot: (ctx, it) => feet(cx => `<rect x="${cx - 18}" y="406" width="36" height="72" rx="10" fill="${it.c[0]}"/><rect x="${cx - 19}" y="438" width="38" height="7" fill="${c2of(it)}"/>${SOLE(cx, c2of(it))}<path d="M${cx - 10} 414 L${cx - 10} 432" stroke="#fff" stroke-width="3" opacity=".8" stroke-linecap="round"/>`),
    elf: (ctx, it) => feet(cx => `<path d="M${cx - 19} 478 Q${cx - 19} 461 ${cx} 461 Q${cx + 19} 461 ${cx + 19} 478 Z" fill="${it.c[0]}"/><path d="M${cx + 16} 470 Q${cx + 32} 462 ${cx + 26} 450" stroke="${it.c[0]}" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="${cx + 26}" cy="449" r="4.5" fill="${c2of(it)}"/>`),
    pirateboot: (ctx, it) => feet(cx => `<rect x="${cx - 18}" y="404" width="36" height="74" rx="10" fill="${it.c[0]}"/><rect x="${cx - 21}" y="404" width="42" height="16" rx="6" fill="${c2of(it)}"/>${SOLE(cx, dark(it.c[0], .4))}<rect x="${cx - 5}" y="440" width="10" height="8" rx="2" fill="#f1c232"/>`),
    clog: (ctx, it) => feet(cx => `<path d="M${cx - 20} 478 Q${cx - 22} 456 ${cx} 452 Q${cx + 22} 456 ${cx + 20} 478 Z" fill="${it.c[0]}"/><path d="M${cx - 18} 466 Q${cx} 472 ${cx + 18} 466" stroke="${c2of(it)}" stroke-width="3" fill="none"/><g fill="${c2of(it)}"><circle cx="${cx - 8}" cy="460" r="1.8"/><circle cx="${cx}" cy="458" r="1.8"/><circle cx="${cx + 8}" cy="460" r="1.8"/></g>`),
    platform: (ctx, it) => feet(cx => `<rect x="${cx - 19}" y="446" width="38" height="24" rx="10" fill="${ctx.pat('glitter', it.c[0], it.c[1] || '#fff')}"/><rect x="${cx - 20}" y="464" width="40" height="16" rx="4" fill="${c2of(it)}"/><rect x="${cx - 20}" y="470" width="40" height="3" fill="${dark(it.c[0], .2)}"/>`),
  };

  /* ---------- hoedjes ---------- */
  const HATS = {
    bowband: (ctx, it) => { const c = it.c[0]; return `<path d="M96 82 Q150 40 204 82" stroke="${c}" stroke-width="8" fill="none"/><path d="M190 56 L174 46 L177 66 Z M190 56 L206 46 L203 66 Z" fill="${c}"/><circle cx="190" cy="56" r="4.5" fill="${dark(c)}"/>`; },
    sunhat: (ctx, it) => { const c = it.c[0], c2 = c2of(it); return `<path d="M56 76 Q150 100 244 76 Q150 88 56 76 Z" fill="${dark(c, .3)}"/><ellipse cx="150" cy="76" rx="94" ry="16" fill="${c}"/><path d="M100 76 Q104 26 150 24 Q196 26 200 76 Z" fill="${c}"/><path d="M100 76 Q150 62 200 76 L200 66 Q150 52 100 66 Z" fill="${c2}"/><path d="M196 70 L206 60 L210 72 Z" fill="${c2}"/>`; },
    cap: (ctx, it) => { const c = it.c[0], d = dark(c, .25); return `<ellipse cx="150" cy="78" rx="66" ry="9" fill="${d}"/><path d="M94 80 Q94 28 150 26 Q206 28 206 80 Z" fill="${c}"/><path d="M150 26 L150 80 M120 34 Q118 60 116 80 M180 34 Q182 60 184 80" stroke="${d}" stroke-width="1.5" fill="none" opacity=".6"/><circle cx="150" cy="27" r="4" fill="${d}"/>`; },
    sweatband: (ctx, it) => `<path d="M96 90 Q150 70 204 90 L204 100 Q150 80 96 100 Z" fill="${it.c[0]}"/><path d="M110 88 Q150 76 190 88" stroke="#fff" stroke-width="1.5" fill="none" opacity=".6"/>`,
    beanie: (ctx, it) => { const c = it.c[0], c2 = c2of(it); return `<path d="M92 86 Q92 24 150 20 Q208 24 208 86 Z" fill="${c}"/><g stroke="${dark(c, .2)}" stroke-width="2" fill="none" opacity=".5"><path d="M110 40 Q112 60 110 78 M130 30 Q130 55 130 76 M150 26 L150 76 M170 30 Q170 55 170 76 M190 40 Q188 60 190 78"/></g><rect x="90" y="74" width="120" height="17" rx="8" fill="${c2}"/><circle cx="150" cy="20" r="12" fill="${c2}"/>`; },
    catears: (ctx, it) => { const c = it.c[0], c2 = c2of(it); const ear = `<path d="M98 72 L104 30 L134 56 Z" fill="${c}"/><path d="M105 66 L108 42 L126 58 Z" fill="${c2}"/>`; return `<path d="M98 72 Q150 46 202 72" stroke="${c}" stroke-width="5" fill="none"/>${ear}${mirror(ear)}`; },
    tiara: (ctx, it) => { const c = it.c[0], c2 = c2of(it); return `<path d="M108 68 Q150 26 192 68" stroke="${c}" stroke-width="5" fill="none"/><path d="M122 52 L128 38 L134 50 M166 50 L172 38 L178 52" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="${starPath(150, 40, 10)}" fill="${c2}"/><circle cx="130" cy="50" r="3.5" fill="${c2}"/><circle cx="170" cy="50" r="3.5" fill="${c2}"/>`; },
    rainhat: (ctx, it) => { const c = it.c[0], d = dark(c, .2); return `<path d="M70 76 Q150 58 230 76 Q230 94 150 84 Q70 94 70 76 Z" fill="${c}"/><path d="M98 76 Q102 26 150 24 Q198 26 202 76 Z" fill="${c}"/><path d="M98 76 Q150 66 202 76" stroke="${d}" stroke-width="3" fill="none"/><path d="M70 76 Q150 96 230 76" stroke="${d}" stroke-width="2" fill="none"/>`; },
    bandana: (ctx, it) => { const f = fillOf(ctx, it); return `<path d="M94 94 Q150 62 206 94 L206 104 Q150 78 94 104 Z" fill="${f}"/><circle cx="208" cy="98" r="6" fill="${f}"/><path d="M210 102 L228 120 M210 102 L232 108" stroke="${f}" stroke-width="6" stroke-linecap="round"/>`; },
    flowercrown: (ctx, it) => { const pts = [[100, 88], [116, 64], [134, 50], [152, 46], [170, 50], [186, 64], [200, 88]]; const cols = [it.c[0], '#fff', it.c[1], it.c[0], it.c[1], '#fff', it.c[0]]; return `<path d="M96 92 Q150 44 204 92" stroke="#4caf50" stroke-width="5" fill="none"/><g fill="#4caf50"><ellipse cx="108" cy="74" rx="6" ry="3" transform="rotate(-50 108 74)"/><ellipse cx="192" cy="74" rx="6" ry="3" transform="rotate(50 192 74)"/><ellipse cx="143" cy="46" rx="6" ry="3"/></g>` + pts.map((p, i) => flower(p[0], p[1], 5.5, cols[i])).join(''); },
    crown: (ctx, it) => { const c = it.c[0], c2 = c2of(it); return `<path d="M104 74 L104 34 L124 54 L150 20 L176 54 L196 34 L196 74 Z" fill="${c}" stroke="${dark(c, .3)}" stroke-width="2" stroke-linejoin="round"/><rect x="104" y="66" width="92" height="8" fill="${dark(c, .2)}"/><circle cx="124" cy="60" r="4" fill="${c2}"/><circle cx="150" cy="56" r="5" fill="#3a86ff"/><circle cx="176" cy="60" r="4" fill="${c2}"/><circle cx="150" cy="20" r="4" fill="${c2}"/>`; },
    unicorn: (ctx, it) => { const c = it.c[0], c2 = c2of(it); return `<path d="M96 88 Q150 44 204 88" stroke="#ffb3d9" stroke-width="5" fill="none"/><path d="M110 64 L116 36 L132 58 Z" fill="${c}"/><path d="M190 64 L184 36 L168 58 Z" fill="${c}"/><path d="M114 60 L117 44 L126 56 Z" fill="#ffb3d9"/><path d="M186 60 L183 44 L174 56 Z" fill="#ffb3d9"/><path d="M138 52 L150 2 L162 52 Z" fill="${c2}"/><g stroke="${dark(c2, .2)}" stroke-width="2"><path d="M141 42 L159 42 M144 30 L156 30 M147 18 L153 18"/></g>${flower(122, 70, 5, '#ff8fab')}${flower(178, 70, 5, '#ff8fab')}${flower(150, 58, 4.5, '#7cc4ff')}`; },
    witchhat: (ctx, it) => { const c = it.c[0], c2 = c2of(it); return `<ellipse cx="150" cy="66" rx="82" ry="15" fill="${c}"/><path d="M112 66 Q140 30 160 2 Q152 42 188 66 Z" fill="${c}"/><path d="M116 64 Q150 56 184 64 L182 56 Q150 48 118 56 Z" fill="${c2}"/><rect x="146" y="50" width="10" height="12" rx="2" fill="#f1c232"/>`; },
    spacehelmet: (ctx, it) => { const c = it.c[0]; return `<ellipse cx="150" cy="100" rx="72" ry="78" fill="rgba(200,230,255,0.25)" stroke="${c}" stroke-width="7"/><path d="M102 76 Q116 42 148 32" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".75"/><ellipse cx="150" cy="176" rx="42" ry="10" fill="${dark(c, .2)}"/><circle cx="212" cy="120" r="5" fill="#ff8c42"/>`; },
    santa: (ctx, it) => { const c = it.c[0], c2 = c2of(it); return `<path d="M94 82 Q100 28 150 22 Q198 12 226 46 Q188 44 208 82 Z" fill="${c}"/><rect x="90" y="72" width="122" height="18" rx="9" fill="${c2}"/><circle cx="228" cy="46" r="11" fill="${c2}"/>`; },
    beret: (ctx, it) => { const c = it.c[0]; return `<g transform="rotate(-8 150 54)"><ellipse cx="150" cy="70" rx="46" ry="8" fill="${dark(c, .3)}"/><ellipse cx="150" cy="54" rx="60" ry="20" fill="${c}"/><path d="M150 34 L150 42" stroke="${c}" stroke-width="5" stroke-linecap="round"/></g>`; },
    partyhat: (ctx, it) => { const f = fillOf(ctx, it), c2 = c2of(it); return `<path d="M150 8 L120 68 L180 68 Z" fill="${f}"/><circle cx="150" cy="9" r="7" fill="${c2}"/><path d="M120 68 Q150 60 180 68" stroke="${c2}" stroke-width="3" fill="none"/>`; },
    piratehat: (ctx, it) => { const c = it.c[0], c2 = c2of(it); return `<path d="M82 78 Q94 26 150 24 Q206 26 218 78 Q150 60 82 78 Z" fill="${c}"/><path d="M82 78 Q150 60 218 78" stroke="${c2}" stroke-width="2.5" fill="none"/><circle cx="150" cy="46" r="8" fill="${c2}"/><circle cx="147" cy="45" r="1.8" fill="${c}"/><circle cx="153" cy="45" r="1.8" fill="${c}"/><path d="M140 58 L160 62 M160 58 L140 62" stroke="${c2}" stroke-width="3" stroke-linecap="round"/>`; },
    headphones: (ctx, it) => { const c = it.c[0], c2 = c2of(it); return `<path d="M92 106 Q90 22 150 20 Q210 22 208 106" stroke="${c2}" stroke-width="8" fill="none"/><rect x="78" y="88" width="26" height="36" rx="10" fill="${c}"/><rect x="196" y="88" width="26" height="36" rx="10" fill="${c}"/><circle cx="91" cy="106" r="6" fill="${c2}"/><circle cx="209" cy="106" r="6" fill="${c2}"/>`; },
    bucket: (ctx, it) => { const c = it.c[0], c2 = c2of(it); return `<path d="M104 80 Q108 28 150 26 Q192 28 196 80 Z" fill="${c}"/><path d="M68 82 Q150 64 232 82 L226 94 Q150 78 74 94 Z" fill="${c}"/><path d="M104 72 Q150 62 196 72" stroke="${c2}" stroke-width="4" fill="none"/>`; },
    swimcap: (ctx, it) => `<path d="M92 92 Q92 26 150 22 Q208 26 208 92 Q150 78 92 92 Z" fill="${it.c[0]}"/><path d="M110 50 Q130 32 156 32" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".6"/>`,
    helmet: (ctx, it) => { const c = it.c[0], d = dark(c, .3); return `<path d="M92 86 Q92 24 150 22 Q208 24 208 86 Z" fill="${c}"/><ellipse cx="150" cy="86" rx="60" ry="8" fill="${d}"/><path d="M112 82 Q150 100 188 82" stroke="${d}" stroke-width="6" fill="none"/><path d="M150 22 L150 84 M118 34 Q114 60 116 84 M182 34 Q186 60 184 84" stroke="${d}" stroke-width="1.5" fill="none" opacity=".5"/>`; },
    hennin: (ctx, it) => ({ back: `<path d="M150 4 Q246 90 234 236 Q206 200 186 150 Q170 100 150 4 Z" fill="rgba(255,255,255,0.55)" stroke="#fff" stroke-width="2"/>`, front: `<path d="M150 4 L122 70 L178 70 Z" fill="${it.c[0]}"/><path d="M150 4 L136 70 L150 70 Z" fill="${light(it.c[0], .3)}" opacity=".6"/><path d="M122 70 Q150 60 178 70 L178 76 Q150 66 122 76 Z" fill="${c2of(it)}"/>${flower(150, 12, 4, '#fff')}` }),
    bunnyears: (ctx, it) => { const c = it.c[0], c2 = c2of(it); return `<path d="M98 74 Q150 48 202 74" stroke="${c}" stroke-width="5" fill="none"/><ellipse cx="118" cy="36" rx="12" ry="34" fill="${c}" transform="rotate(-10 118 36)"/><ellipse cx="182" cy="36" rx="12" ry="34" fill="${c}" transform="rotate(10 182 36)"/><ellipse cx="118" cy="38" rx="6" ry="24" fill="${c2}" transform="rotate(-10 118 38)"/><ellipse cx="182" cy="38" rx="6" ry="24" fill="${c2}" transform="rotate(10 182 38)"/>`; },
    veil: (ctx, it) => ({
      back: `<path d="M100 58 Q150 36 200 58 L240 304 Q150 340 60 304 Z" fill="rgba(255,255,255,0.55)" stroke="#fff" stroke-width="2"/>`,
      front: `<path d="M108 68 Q150 30 192 68" stroke="${c2of(it)}" stroke-width="4" fill="none"/>${flower(122, 52, 5, '#fff')}${flower(150, 40, 6, '#fff')}${flower(178, 52, 5, '#fff')}`,
    }),
  };

  /* ---------- brillen ---------- */
  const GLASSES = {
    round: (ctx, it) => { const c = it.c[0]; return `<g stroke="${c}" stroke-width="3" fill="rgba(255,255,255,0.18)"><circle cx="128" cy="106" r="16"/><circle cx="172" cy="106" r="16"/></g><path d="M144 106 L156 106 M112 104 L98 100 M188 104 L202 100" stroke="${c}" stroke-width="3" fill="none"/>`; },
    sunglasses: (ctx, it) => { const c = it.c[0]; return `<rect x="109" y="94" width="38" height="25" rx="11" fill="${c}"/><rect x="153" y="94" width="38" height="25" rx="11" fill="${c}"/><path d="M147 102 L153 102 M109 100 L97 98 M191 100 L203 98" stroke="${c}" stroke-width="3"/><path d="M116 101 L124 98 M160 101 L168 98" stroke="#fff" stroke-width="2" opacity=".5" stroke-linecap="round"/>`; },
    hearts: (ctx, it) => { const c = it.c[0]; return `<path d="${heartPath(128, 108, 15)}" fill="${c}" opacity=".85"/><path d="${heartPath(172, 108, 15)}" fill="${c}" opacity=".85"/><path d="M144 102 L156 102 M108 100 L97 98 M192 100 L203 98" stroke="${c}" stroke-width="3"/>`; },
    stars: (ctx, it) => { const c = it.c[0]; return `<path d="${starPath(128, 106, 20, 10)}" fill="${c}" opacity=".9"/><path d="${starPath(172, 106, 20, 10)}" fill="${c}" opacity=".9"/><circle cx="128" cy="106" r="9" fill="rgba(255,255,255,0.35)"/><circle cx="172" cy="106" r="9" fill="rgba(255,255,255,0.35)"/><path d="M144 104 L156 104" stroke="${c}" stroke-width="3"/>`; },
    heromask: (ctx, it) => { const c = it.c[0], m = `m${ctx.id}`; ctx.defs.push(`<mask id="${m}"><rect width="300" height="520" fill="#fff"/><ellipse cx="128" cy="106" rx="13" ry="12" fill="#000"/><ellipse cx="172" cy="106" rx="13" ry="12" fill="#000"/></mask>`); return `<path d="M98 96 Q150 76 202 96 L202 122 Q150 134 98 122 Z" fill="${c}" mask="url(#${m})"/>`; },
    goggles: (ctx, it) => { const c = it.c[0]; return `<path d="M98 96 L110 100 M202 96 L190 100" stroke="${c}" stroke-width="4"/><rect x="110" y="94" width="36" height="24" rx="9" fill="rgba(120,200,255,0.5)" stroke="${c}" stroke-width="3.5"/><rect x="154" y="94" width="36" height="24" rx="9" fill="rgba(120,200,255,0.5)" stroke="${c}" stroke-width="3.5"/><path d="M146 104 L154 104" stroke="${c}" stroke-width="4"/>`; },
    skigoggles: (ctx, it) => { const c = it.c[0]; return `<path d="M96 100 L104 104 M204 100 L196 104" stroke="${c}" stroke-width="6"/><rect x="102" y="88" width="96" height="34" rx="15" fill="${c}"/><rect x="108" y="93" width="84" height="24" rx="11" fill="${ctx.grad('#ffd1ec', '#7cc4ff', true)}"/><path d="M114 98 L130 96" stroke="#fff" stroke-width="2" opacity=".7" stroke-linecap="round"/>`; },
    eyepatch: (ctx, it) => { const c = it.c[0]; return `<path d="M98 92 L158 100 M186 100 L206 92" stroke="${c}" stroke-width="3"/><circle cx="172" cy="106" r="17" fill="${c}"/>`; },
  };

  /* ---------- om de nek ---------- */
  const NECK = {
    lei: (ctx, it) => { let s = ''; const cols = [it.c[0], it.c[1], '#fff']; for (let i = 0; i <= 8; i++) { const p = q([124, 180], [150, 232], [176, 180], i / 8); s += flower(p[0].toFixed(1), p[1].toFixed(1), 4.5, cols[i % 3]); } return s; },
    medal: (ctx, it) => `<path d="M134 178 L150 214 L166 178" stroke="${it.c[0]}" stroke-width="7" fill="none" stroke-linejoin="round"/><circle cx="150" cy="219" r="13" fill="${it.c[1]}" stroke="${dark(it.c[1], .25)}" stroke-width="2"/><text x="150" y="224" font-size="13" font-weight="800" text-anchor="middle" fill="${dark(it.c[1], .4)}" font-family="Baloo 2, Nunito, sans-serif">1</text>`,
    scarf: (ctx, it) => { const f = fillOf(ctx, it), c = it.c[0]; return `<path d="M124 180 Q150 204 176 180" stroke="${f}" stroke-width="20" fill="none" stroke-linecap="round"/><path d="M158 192 L166 252 L146 256 L142 198 Z" fill="${f}"/><path d="M148 256 L146 266 M154 255 L153 266 M160 254 L162 265" stroke="${dark(c, .2)}" stroke-width="2.5" stroke-linecap="round"/>`; },
    pearls: (ctx, it) => { let s = ''; for (let i = 0; i <= 8; i++) { const p = q([128, 178], [150, 208], [172, 178], i / 8); s += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="4.5" fill="${it.c[0]}" stroke="#ddd" stroke-width="1"/>`; } return s; },
    bowtie: (ctx, it) => `<path d="M132 176 L150 185 L132 194 Z M168 176 L150 185 L168 194 Z" fill="${it.c[0]}"/><rect x="146" y="180" width="8" height="10" rx="2" fill="${dark(it.c[0], .3)}"/>`,
    choker: (ctx, it) => `<path d="M130 176 Q150 190 170 176" stroke="${it.c[0]}" stroke-width="8" fill="none"/><path d="M137 178 L139 168 L142 180 M147 182 L150 171 L153 182 M158 180 L161 168 L163 178" fill="${it.c[1]}"/>`,
    pendant: (ctx, it) => `<path d="M130 178 Q150 204 170 178" stroke="${it.c[0]}" stroke-width="2" fill="none"/>` + (it.deco === 'star' ? `<path d="${starPath(150, 200, 8)}" fill="${it.c[1]}"/>` : `<path d="${heartPath(150, 199, 7)}" fill="${it.c[1]}"/>`),
    silkscarf: (ctx, it) => { const f = fillOf(ctx, it); return `<path d="M126 180 Q150 198 174 180" stroke="${f}" stroke-width="12" fill="none" stroke-linecap="round"/><circle cx="172" cy="188" r="6" fill="${f}"/><path d="M172 188 L188 218 L176 220 Z M172 188 L194 208 L186 216 Z" fill="${f}"/>`; },
    diamond: (ctx, it) => { let s = `<path d="M130 178 Q150 204 170 178" stroke="${it.c[0]}" stroke-width="2" fill="none"/>`; for (let i = 1; i < 8; i++) { const p = q([130, 178], [150, 204], [170, 178], i / 8); s += `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2" fill="${it.c[1]}"/>`; } return s + `<path d="M150 192 L159 201 L150 216 L141 201 Z" fill="${it.c[1]}" stroke="#fff" stroke-width="1.5"/>`; },
  };

  /* ---------- tassen ---------- */
  const BAGS = {
    backpack: (ctx, it) => ({ back: `<rect x="100" y="186" width="100" height="118" rx="20" fill="${it.c[0]}"/><rect x="118" y="250" width="64" height="40" rx="10" fill="${dark(it.c[0], .2)}"/>`, front: `<path d="M119 180 L124 254 M181 180 L176 254" stroke="${it.c[1]}" stroke-width="9" stroke-linecap="round"/>` }),
    tote: (ctx, it) => { const f = fillOf(ctx, it); return `<path d="M72 306 Q86 282 100 306" stroke="${dark(it.c[1] || it.c[0], .2)}" stroke-width="4" fill="none"/><path d="M58 306 L112 306 L106 366 L66 366 Z" fill="${f}"/><path d="M58 306 L112 306 L111 314 L59 314 Z" fill="${dark(it.c[1] || it.c[0], .2)}"/>`; },
    handbag: (ctx, it) => { const f = fillOf(ctx, it); return `<path d="M209 304 Q222 316 226 330" stroke="#5c3a17" stroke-width="3" fill="none"/><rect x="206" y="328" width="42" height="34" rx="9" fill="${f}"/><rect x="206" y="328" width="42" height="10" rx="5" fill="${dark(it.c[0], .25)}"/><circle cx="227" cy="340" r="4" fill="${it.c[1]}"/>`; },
    basket: (ctx, it) => { const c = it.c[0], c2 = it.c[1]; return `<path d="M72 306 Q89 280 106 306" stroke="${c}" stroke-width="5" fill="none"/><path d="M58 318 L120 318 L113 358 L65 358 Z" fill="${c}"/><g stroke="${dark(c, .25)}" stroke-width="1.5" opacity=".7"><path d="M60 328 L118 328 M62 338 L116 338 M64 348 L114 348 M74 318 L76 358 M89 318 L89 358 M104 318 L102 358"/></g><path d="M60 318 L118 318 L116 330 L62 330 Z" fill="${ctx.pat('checks', '#fff', c2)}"/><circle cx="96" cy="314" r="6" fill="#e63946"/>`; },
    chainbag: (ctx, it) => `<path d="M168 178 L232 330" stroke="${it.c[1]}" stroke-width="2.5" stroke-dasharray="4 3"/><rect x="212" y="326" width="42" height="32" rx="8" fill="${it.c[0]}"/><path d="M212 340 L254 340" stroke="${dark(it.c[0], .3)}" stroke-width="1.5"/><rect x="228" y="334" width="10" height="10" rx="2" fill="${it.c[1]}"/>`,
  };

  /* ---------- in je hand ---------- */
  const HAND = {
    teddy: (ctx, it) => { const c = it.c[0], hi = light(c, .35); return `<circle cx="76" cy="304" r="7" fill="${c}"/><circle cx="100" cy="304" r="7" fill="${c}"/><ellipse cx="88" cy="340" rx="15" ry="17" fill="${c}"/><circle cx="72" cy="332" r="6" fill="${c}"/><circle cx="104" cy="332" r="6" fill="${c}"/><circle cx="80" cy="354" r="6" fill="${c}"/><circle cx="96" cy="354" r="6" fill="${c}"/><circle cx="88" cy="314" r="13" fill="${c}"/><ellipse cx="88" cy="326" rx="7" ry="6" fill="${hi}"/><ellipse cx="88" cy="319" rx="5" ry="4" fill="${hi}"/><circle cx="88" cy="318" r="2" fill="#222"/><circle cx="83" cy="311" r="1.8" fill="#222"/><circle cx="93" cy="311" r="1.8" fill="#222"/>`; },
    icecream: (ctx, it) => `<path d="M80 306 L102 306 L91 342 Z" fill="#e0a866"/><path d="M84 314 L98 314 M86 322 L96 322 M88 330 L94 330" stroke="#b97f3e" stroke-width="1.5"/><circle cx="91" cy="298" r="11" fill="${it.c[0]}"/><circle cx="91" cy="284" r="10" fill="${it.c[1]}"/><circle cx="91" cy="272" r="4" fill="#e63946"/>`,
    beachball: (ctx, it) => { const c1 = it.c[0], c2 = it.c[1]; return `<circle cx="72" cy="322" r="24" fill="#fff"/><path d="M72 298 A24 24 0 0 1 96 322 L72 322 Z" fill="${c1}"/><path d="M96 322 A24 24 0 0 1 72 346 L72 322 Z" fill="#ffd23f"/><path d="M72 346 A24 24 0 0 1 48 322 L72 322 Z" fill="${c2}"/><circle cx="64" cy="312" r="5" fill="#fff" opacity=".7"/>`; },
    football: (ctx, it) => `<circle cx="74" cy="322" r="20" fill="#fff" stroke="#333" stroke-width="2"/><path d="M74 314 L81 319 L78 328 L70 328 L67 319 Z" fill="#333"/><path d="M74 314 L74 304 M81 319 L90 316 M78 328 L84 336 M70 328 L64 336 M67 319 L58 316" stroke="#333" stroke-width="1.5"/>`,
    umbrella: (ctx, it) => { const f = fillOf(ctx, it); return `<path d="M91 300 L54 200" stroke="#5c3a17" stroke-width="4"/><path d="M91 300 Q99 312 90 320" stroke="#5c3a17" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M4 206 Q54 140 104 206 Q92 198 79 206 Q67 198 54 206 Q41 198 29 206 Q17 198 4 206 Z" fill="${f}"/><path d="M54 150 L54 206" stroke="${dark(it.c[0], .2)}" stroke-width="1.5"/><circle cx="54" cy="150" r="3" fill="#5c3a17"/>`; },
    guitar: (ctx, it) => { const c1 = it.c[0], c2 = it.c[1]; return `<g transform="translate(152 302) rotate(-34)"><rect x="-5" y="-124" width="10" height="120" fill="${c2}"/><path d="M-27 -30 Q-42 0 -27 26 Q0 46 27 26 Q42 0 27 -30 Q0 -46 -27 -30Z" fill="${c1}"/><circle cx="0" cy="-2" r="9" fill="#222"/><rect x="-12" y="18" width="24" height="5" rx="2" fill="#222"/><path d="M-2.5 -122 L-2.5 20 M0 -122 L0 20 M2.5 -122 L2.5 20" stroke="#eee" stroke-width=".8"/><rect x="-9" y="-142" width="18" height="22" rx="4" fill="${c2}"/><g fill="#ddd"><circle cx="-11" cy="-136" r="2"/><circle cx="-11" cy="-128" r="2"/><circle cx="11" cy="-136" r="2"/><circle cx="11" cy="-128" r="2"/></g></g>`; },
    wand: (ctx, it) => `<path d="M209 300 L243 226" stroke="${it.c[0]}" stroke-width="5" stroke-linecap="round"/><path d="${starPath(246, 220, 13, 6)}" fill="${it.c[1]}"/>${sparkles([[230, 204], [264, 214], [258, 240]], '#fff', 4)}`,
    pumpkin: (ctx, it) => { const c = it.c[0]; return `<path d="M72 308 Q86 288 100 308" stroke="#222" stroke-width="3" fill="none"/><ellipse cx="86" cy="330" rx="21" ry="18" fill="${c}"/><path d="M78 314 Q74 330 78 346 M94 314 Q98 330 94 346" stroke="${dark(c, .2)}" stroke-width="2" fill="none"/><path d="M76 324 L82 330 L70 330 Z M96 324 L102 330 L90 330 Z M76 338 L96 338 L92 344 L80 344 Z" fill="#222"/><rect x="83" y="308" width="6" height="7" rx="2" fill="#4caf50"/>`; },
    telescope: (ctx, it) => `<path d="M209 300 L248 236" stroke="${it.c[0]}" stroke-width="12" stroke-linecap="round"/><path d="M240 250 L256 224" stroke="${it.c[1]}" stroke-width="15" stroke-linecap="round"/><path d="M224 274 L232 262" stroke="${it.c[1]}" stroke-width="3"/>${sparkles([[268, 206], [280, 226]], '#ffd23f', 4)}`,
    gift: (ctx, it) => { const c1 = it.c[0], c2 = it.c[1]; return `<rect x="64" y="312" width="40" height="34" rx="4" fill="${c1}"/><rect x="80" y="312" width="8" height="34" fill="${c2}"/><rect x="64" y="325" width="40" height="8" fill="${c2}"/><circle cx="77" cy="308" r="6" fill="none" stroke="${c2}" stroke-width="3"/><circle cx="91" cy="308" r="6" fill="none" stroke="${c2}" stroke-width="3"/>`; },
    balloons: (ctx, it) => { const [a, b, c] = it.c; const bal = (x, y, col) => `<path d="M209 300 L${x} ${y + 20}" stroke="#888" stroke-width="1.5"/><ellipse cx="${x}" cy="${y}" rx="16" ry="20" fill="${col}"/><path d="M${x - 3} ${y + 20} L${x + 3} ${y + 20} L${x} ${y + 25} Z" fill="${dark(col)}"/><ellipse cx="${x - 5}" cy="${y - 8}" rx="4" ry="6" fill="#fff" opacity=".5"/>`; return bal(230, 244, c) + bal(262, 236, b) + bal(238, 210, a); },
    sword: (ctx, it) => `<path d="M209 296 L247 226" stroke="${it.c[0]}" stroke-width="7" stroke-linecap="round"/><path d="M212 292 L246 230" stroke="#fff" stroke-width="1.5" opacity=".7"/><path d="M198 286 L222 300" stroke="#f1c232" stroke-width="5" stroke-linecap="round"/><path d="M209 296 L200 314" stroke="${it.c[1]}" stroke-width="7" stroke-linecap="round"/>`,
    mic: (ctx, it) => `<path d="M209 300 L224 262" stroke="${it.c[0]}" stroke-width="9" stroke-linecap="round"/><circle cx="227" cy="254" r="14" fill="${it.c[1]}"/><g stroke="${dark(it.c[1], .35)}" stroke-width="1.2"><path d="M215 250 L239 250 M214 256 L240 256 M217 262 L237 262 M221 242 L221 266 M227 240 L227 268 M233 242 L233 266"/></g>`,
    racket: (ctx, it) => `<path d="M209 300 L232 252" stroke="#5c3a17" stroke-width="5" stroke-linecap="round"/><ellipse cx="242" cy="230" rx="20" ry="27" fill="rgba(255,255,255,0.5)" stroke="${it.c[0]}" stroke-width="5"/><g stroke="#ddd" stroke-width="1"><path d="M228 220 L256 220 M226 230 L258 230 M228 240 L256 240 M234 206 L234 254 M242 204 L242 256 M250 206 L250 254"/></g>`,
    hockeystick: (ctx, it) => `<path d="M209 300 L238 206" stroke="${it.c[0]}" stroke-width="7" stroke-linecap="round"/><path d="M209 300 Q204 324 186 322" stroke="${it.c[0]}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M228 238 L234 220" stroke="#fff" stroke-width="2" opacity=".7"/><circle cx="176" cy="326" r="6" fill="#fff" stroke="#999"/>`,
    jumprope: (ctx, it) => `<path d="M91 300 Q150 540 209 300" stroke="${it.c[0]}" stroke-width="3.5" fill="none"/><path d="M91 300 L86 322 M209 300 L214 322" stroke="${dark(it.c[0], .3)}" stroke-width="9" stroke-linecap="round"/>`,
    pompoms: (ctx, it) => { const pom = (x, y) => { let s = ''; for (let i = 0; i < 16; i++) { const a = Math.PI * 2 * i / 16; s += `<path d="M${x} ${y} L${(x + Math.cos(a) * 26).toFixed(1)} ${(y + Math.sin(a) * 26).toFixed(1)}" stroke="${i % 2 ? it.c[0] : it.c[1]}" stroke-width="3.5" stroke-linecap="round"/>`; } return s; }; return pom(84, 318) + pom(216, 318); },
    ribbon: (ctx, it) => `<path d="M209 300 L236 252" stroke="#ddd" stroke-width="3" stroke-linecap="round"/><path d="M236 252 Q276 224 250 192 Q226 162 268 126 Q286 106 274 84" stroke="${it.c[0]}" stroke-width="6" fill="none" stroke-linecap="round"/>`,
    swimring: (ctx, it) => `<ellipse cx="150" cy="292" rx="66" ry="22" fill="none" stroke="${it.c[0]}" stroke-width="20"/><g stroke="${it.c[1]}" stroke-width="20" fill="none"><path d="M96 280 Q102 270 118 274"/><path d="M204 280 Q198 270 182 274"/><path d="M128 312 Q150 316 172 312"/></g><path d="M100 286 Q150 262 200 286" stroke="#fff" stroke-width="3" fill="none" opacity=".6"/>`,
    carrot: (ctx, it) => `<path d="M84 300 L98 300 L91 348 Z" fill="${it.c[0]}"/><path d="M86 312 L96 312 M88 324 L94 324" stroke="${dark(it.c[0], .2)}" stroke-width="1.5"/><path d="M91 300 L84 282 M91 300 L92 280 M91 300 L100 284" stroke="${it.c[1]}" stroke-width="4" stroke-linecap="round"/>`,
    bouquet: (ctx, it) => `<path d="M91 300 L86 270 M91 300 L96 268 M91 300 L78 276 M91 300 L104 278" stroke="#4caf50" stroke-width="3" stroke-linecap="round"/><path d="M84 300 L98 300" stroke="#ffb3d9" stroke-width="5"/>${flower(84, 262, 7, it.c[0])}${flower(98, 258, 7, it.c[1])}${flower(74, 274, 6, it.c[1])}${flower(106, 276, 6, it.c[0])}${flower(91, 274, 5, '#ffd23f', it.c[1])}`,
  };
  // uitsnede voor de miniaturen van handspullen
  const HAND_BOX = { racket: '196 196 76 116', hockeystick: '166 196 84 140', jumprope: '70 280 160 150', pompoms: '50 284 200 70', ribbon: '196 76 100 236', swimring: '76 262 148 60', carrot: '74 274 36 80', teddy: '46 280 84 84', icecream: '56 262 70 90', beachball: '40 290 66 66', football: '46 294 58 58', umbrella: '0 136 116 190', guitar: '60 150 190 200', wand: '196 196 84 114', pumpkin: '58 282 58 70', telescope: '196 196 96 116', gift: '56 296 56 56', balloons: '206 186 80 130', sword: '188 216 70 108', mic: '198 234 50 76', bouquet: '60 246 60 62' };
  const BAG_BOX = { backpack: '90 176 120 140', tote: '50 276 70 96', handbag: '198 296 60 74', basket: '50 272 78 94', chainbag: '160 170 104 200' };

  /* ---------- op je rug ---------- */
  const BACK = {
    fairywings: (ctx, it) => ({ back: `<g fill="${it.c[0]}" opacity=".8" stroke="${it.c[1]}" stroke-width="2"><ellipse cx="88" cy="198" rx="50" ry="30" transform="rotate(-28 88 198)"/><ellipse cx="98" cy="254" rx="34" ry="24" transform="rotate(18 98 254)"/><ellipse cx="212" cy="198" rx="50" ry="30" transform="rotate(28 212 198)"/><ellipse cx="202" cy="254" rx="34" ry="24" transform="rotate(-18 202 254)"/></g>${sparkles([[60, 190], [76, 258], [240, 190], [224, 258]], '#fff', 4)}` }),
    butterfly: (ctx, it) => ({ back: `<g stroke="#23202a" stroke-width="2.5"><ellipse cx="84" cy="200" rx="56" ry="36" transform="rotate(-24 84 200)" fill="${it.c[0]}"/><ellipse cx="96" cy="262" rx="38" ry="28" transform="rotate(16 96 262)" fill="${it.c[1]}"/><ellipse cx="216" cy="200" rx="56" ry="36" transform="rotate(24 216 200)" fill="${it.c[0]}"/><ellipse cx="204" cy="262" rx="38" ry="28" transform="rotate(-16 204 262)" fill="${it.c[1]}"/></g><g fill="#fff" opacity=".85"><circle cx="66" cy="196" r="9"/><circle cx="234" cy="196" r="9"/><circle cx="84" cy="266" r="6"/><circle cx="216" cy="266" r="6"/></g><g fill="#5aaeff" opacity=".8"><circle cx="90" cy="184" r="5"/><circle cx="210" cy="184" r="5"/></g>` }),
    cape: (ctx, it) => ({ back: `<path d="M106 180 L194 180 L230 426 Q150 450 70 426 Z" fill="${it.c[0]}"/><path d="M106 180 L120 420 M194 180 L180 420" stroke="${it.c[1]}" stroke-width="3" fill="none" opacity=".5"/>`, front: `<path d="M118 178 Q150 200 182 178" stroke="${it.c[0]}" stroke-width="9" fill="none"/><circle cx="150" cy="191" r="5.5" fill="${it.c[1]}"/>` }),
    jetpack: (ctx, it) => { const c1 = it.c[0], c2 = it.c[1]; const side = x => `<rect x="${x}" y="186" width="30" height="92" rx="12" fill="${c1}"/><rect x="${x + 4}" y="274" width="22" height="10" fill="#555"/><path d="M${x + 2} 284 L${x + 15} 322 L${x + 28} 284 Z" fill="${c2}"/><path d="M${x + 8} 284 L${x + 15} 306 L${x + 22} 284 Z" fill="#ffd23f"/><rect x="${x + 8}" y="196" width="14" height="30" rx="4" fill="${dark(c1, .25)}"/>`; return { back: side(98) + side(172), front: `<path d="M119 180 L124 250 M181 180 L176 250" stroke="#555" stroke-width="7" stroke-linecap="round"/>` }; },
    angelwings: (ctx, it) => { const w = `<path d="M110 186 Q60 150 28 196 Q52 200 44 230 Q66 226 60 256 Q84 250 82 280 Q104 268 112 250 Z" fill="${it.c[0]}" stroke="${it.c[1]}" stroke-width="1.5"/><path d="M96 200 Q66 196 50 214 M92 224 Q72 228 66 246" stroke="${it.c[1]}" stroke-width="1.5" fill="none" opacity=".6"/>`; return { back: w + mirror(w) }; },
  };

  /* ---------- huisdieren ---------- */
  const PETS = {
    puppy: (ctx, it) => { const c = it.c[0], w = it.c[1]; return `<path d="M218 452 Q204 438 212 428" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round"/><ellipse cx="240" cy="458" rx="23" ry="15" fill="${c}"/><rect x="224" y="464" width="9" height="13" rx="4" fill="${c}"/><rect x="246" y="464" width="9" height="13" rx="4" fill="${c}"/><ellipse cx="240" cy="466" rx="12" ry="7" fill="${w}"/><circle cx="262" cy="442" r="15" fill="${c}"/><ellipse cx="251" cy="438" rx="6" ry="12" fill="${dark(c, .25)}"/><ellipse cx="274" cy="438" rx="6" ry="12" fill="${dark(c, .25)}"/><ellipse cx="266" cy="449" rx="8" ry="6" fill="${w}"/><ellipse cx="267" cy="446" rx="3" ry="2.5" fill="#222"/><circle cx="258" cy="440" r="2" fill="#222"/><circle cx="268" cy="439" r="2" fill="#222"/><path d="M264 452 Q267 456 271 452" stroke="#222" stroke-width="1.5" fill="none"/>`; },
    kitten: (ctx, it) => { const c = it.c[0], w = it.c[1]; return `<path d="M70 468 Q94 468 90 444" stroke="${c}" stroke-width="7" fill="none" stroke-linecap="round"/><ellipse cx="56" cy="458" rx="17" ry="19" fill="${c}"/><ellipse cx="56" cy="464" rx="9" ry="12" fill="${w}"/><rect x="44" y="466" width="8" height="12" rx="4" fill="${c}"/><rect x="60" y="466" width="8" height="12" rx="4" fill="${c}"/><path d="M44 428 L46 412 L56 424 Z M68 428 L66 412 L56 424 Z" fill="${c}"/><circle cx="56" cy="434" r="14" fill="${c}"/><path d="M46 428 L48 416 L54 424 Z M66 428 L64 416 L58 424 Z" fill="#ffb3d9"/><ellipse cx="51" cy="432" rx="2.5" ry="3.5" fill="#3fbf63"/><ellipse cx="61" cy="432" rx="2.5" ry="3.5" fill="#3fbf63"/><circle cx="51" cy="433" r="1.2" fill="#111"/><circle cx="61" cy="433" r="1.2" fill="#111"/><path d="M54 439 L58 439 L56 442 Z" fill="#ffb3d9"/><path d="M40 438 L50 440 M40 444 L50 442 M72 438 L62 440 M72 444 L62 442" stroke="#555" stroke-width="1"/>`; },
    unicorn: (ctx, it) => { const c = it.c[0], m = it.c[1]; return `<path d="M216 454 Q198 448 202 430" stroke="${m}" stroke-width="7" fill="none" stroke-linecap="round"/><ellipse cx="240" cy="456" rx="24" ry="15" fill="${c}"/><rect x="222" y="464" width="9" height="14" rx="4" fill="${c}"/><rect x="248" y="464" width="9" height="14" rx="4" fill="${c}"/><rect x="256" y="436" width="14" height="24" rx="6" fill="${c}"/><circle cx="266" cy="434" r="13" fill="${c}"/><path d="M262 422 L268 400 L274 422 Z" fill="#f1c232"/><path d="M256 424 Q246 430 250 446" stroke="${m}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M252 448 Q244 452 248 460" stroke="#7cc4ff" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="270" cy="433" r="2.2" fill="#222"/><ellipse cx="276" cy="440" rx="3" ry="2" fill="#ffb3d9"/><path d="M258 426 L262 418 L266 426 Z" fill="${c}"/>`; },
    penguin: (ctx, it) => { const c = it.c[0], w = it.c[1]; return `<ellipse cx="58" cy="452" rx="19" ry="25" fill="${c}"/><ellipse cx="58" cy="458" rx="12" ry="17" fill="${w}"/><ellipse cx="40" cy="452" rx="5" ry="14" fill="${c}" transform="rotate(12 40 452)"/><ellipse cx="76" cy="452" rx="5" ry="14" fill="${c}" transform="rotate(-12 76 452)"/><circle cx="51" cy="438" r="4" fill="#fff"/><circle cx="65" cy="438" r="4" fill="#fff"/><circle cx="52" cy="439" r="2" fill="#111"/><circle cx="66" cy="439" r="2" fill="#111"/><path d="M52 446 L64 446 L58 452 Z" fill="#ff8c42"/><path d="M46 476 L56 476 L51 480 Z M60 476 L70 476 L65 480 Z" fill="#ff8c42"/><path d="M40 428 Q58 418 76 428" stroke="#e63946" stroke-width="6" fill="none"/>`; },
    parrot: (ctx, it) => { const c = it.c[0], b = it.c[1]; return `<path d="M240 468 L232 488 M246 468 L248 490 M252 466 L260 486" stroke="${b}" stroke-width="4" stroke-linecap="round"/><ellipse cx="244" cy="452" rx="13" ry="19" fill="${c}"/><ellipse cx="252" cy="452" rx="6" ry="14" fill="${b}"/><circle cx="242" cy="430" r="10" fill="${c}"/><path d="M233 428 L222 434 L234 438 Z" fill="#ffd23f"/><circle cx="244" cy="428" r="3" fill="#fff"/><circle cx="245" cy="428" r="1.5" fill="#111"/><path d="M240 470 L238 478 M248 470 L250 478" stroke="#ffd23f" stroke-width="2.5"/>`; },
    rabbit: (ctx, it) => { const c = it.c[0], p = it.c[1]; return `<ellipse cx="58" cy="458" rx="18" ry="16" fill="${c}"/><ellipse cx="58" cy="464" rx="9" ry="8" fill="${p}" opacity=".5"/><ellipse cx="50" cy="412" rx="6" ry="18" fill="${c}" transform="rotate(-8 50 412)"/><ellipse cx="66" cy="412" rx="6" ry="18" fill="${c}" transform="rotate(8 66 412)"/><ellipse cx="50" cy="414" rx="3" ry="12" fill="${p}" transform="rotate(-8 50 414)"/><ellipse cx="66" cy="414" rx="3" ry="12" fill="${p}" transform="rotate(8 66 414)"/><circle cx="58" cy="438" r="14" fill="${c}"/><circle cx="53" cy="436" r="2" fill="#222"/><circle cx="63" cy="436" r="2" fill="#222"/><ellipse cx="58" cy="442" rx="3" ry="2" fill="${p}"/><path d="M44 442 L50 443 M44 447 L50 445 M72 442 L66 443 M72 447 L66 445" stroke="#888" stroke-width="1"/><rect x="46" y="468" width="10" height="9" rx="4" fill="${c}"/><rect x="60" y="468" width="10" height="9" rx="4" fill="${c}"/><circle cx="76" cy="460" r="6" fill="${c}"/>`; },
    pony: (ctx, it) => { const c = it.c[0], m = it.c[1]; return `<path d="M216 454 Q198 448 202 430" stroke="${m}" stroke-width="7" fill="none" stroke-linecap="round"/><ellipse cx="240" cy="456" rx="24" ry="15" fill="${c}"/><rect x="222" y="464" width="9" height="14" rx="4" fill="${c}"/><rect x="248" y="464" width="9" height="14" rx="4" fill="${c}"/><rect x="256" y="436" width="14" height="24" rx="6" fill="${c}"/><circle cx="266" cy="434" r="13" fill="${c}"/><path d="M258 424 Q248 432 252 448" stroke="${m}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M258 426 L262 416 L266 426 Z M268 424 L272 414 L276 426 Z" fill="${c}"/><circle cx="270" cy="433" r="2.2" fill="#222"/><ellipse cx="277" cy="440" rx="3" ry="2" fill="${dark(c, .3)}"/><path d="M230 470 L230 478 M254 470 L254 478" stroke="${dark(c, .4)}" stroke-width="3"/>`; },
    dragon: (ctx, it) => { const c = it.c[0], o = it.c[1]; return `<path d="M216 456 Q194 456 200 438" stroke="${c}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M198 442 L192 430 L206 436 Z" fill="${o}"/><path d="M230 446 L212 418 L246 440 Z" fill="${o}" opacity=".9"/><ellipse cx="240" cy="458" rx="24" ry="15" fill="${c}"/><ellipse cx="242" cy="464" rx="14" ry="8" fill="${light(c, .4)}"/><rect x="224" y="466" width="9" height="12" rx="4" fill="${c}"/><rect x="248" y="466" width="9" height="12" rx="4" fill="${c}"/><circle cx="266" cy="440" r="14" fill="${c}"/><path d="M258 430 L256 418 L264 428 Z M272 428 L276 416 L278 430 Z" fill="${o}"/><circle cx="270" cy="438" r="3" fill="#fff"/><circle cx="271" cy="438" r="1.6" fill="#111"/><path d="M278 446 L292 440 L284 452 Z" fill="${o}"/><path d="M284 444 L294 442 L288 450 Z" fill="#ffd23f"/>`; },
  };

  const SHAPES = { top: TOPS, bottom: BOTTOMS, dress: DRESSES, shoes: SHOES, hat: HATS, glasses: GLASSES, neck: NECK, bag: BAGS, hand: HAND, back: BACK, pet: PETS };

  /* ---------- miniatuur-uitsneden ---------- */
  const THUMB_BOX = {
    hair: '30 0 240 300', top: '68 150 164 160', bottom: '78 275 144 190', dress: '30 160 240 336',
    shoes: '96 380 108 108', hat: '58 0 184 132', glasses: '90 74 120 60', neck: '106 160 88 112',
    bag: '40 160 220 220', hand: '0 180 300 200', back: '10 130 280 330', pet: '10 380 280 120',
    mk_eyes: '88 50 124 124', mk_lips: '88 50 124 124', mk_blush: '88 50 124 124', mk_face: '88 50 124 124', bg: '0 0 300 520',
  };
  function thumbBox(item) {
    if (item.cat === 'hand') return HAND_BOX[item.shape] || THUMB_BOX.hand;
    if (item.cat === 'bag') return BAG_BOX[item.shape] || THUMB_BOX.bag;
    if (item.cat === 'shoes' && ['boot', 'rainboot', 'snowboot', 'spaceboot', 'pirateboot'].includes(item.shape)) return '96 380 108 108';
    if (item.cat === 'hair' && !HAIR[item.shape].back) return ['hoge_staart', 'zijstaart', 'zijvlecht'].includes(item.shape) ? '40 0 220 280' : '60 0 180 200';
    if (item.cat === 'hat' && item.shape === 'hennin') return '60 0 200 250';
    if (item.cat === 'back' && (item.shape === 'cape')) return '50 160 200 300';
    if (item.cat === 'hat' && item.shape === 'veil') return '40 20 220 330';
    return THUMB_BOX[item.cat];
  }

  function partOf(ctx, item, which) {
    if (!item) return '';
    const fn = SHAPES[item.cat] && SHAPES[item.cat][item.shape];
    if (!fn) return '';
    const r = fn(ctx, item);
    if (typeof r === 'string') return which === 'front' ? r : '';
    return r[which] || '';
  }

  /* ---------- het hele model ---------- */
  function render(look, outfit, opts = {}) {
    const ctx = makeCtx(look, opts);
    const get = slot => outfit[slot] ? ITEM_BY_ID[outfit[slot]] : null;
    const hairIt = get('hair') || ITEM_BY_ID.hair_kort;
    const H = HAIR[hairIt.shape] || HAIR.kort;
    const dress = get('dress'), top = get('top');
    // lichaam en kleding worden horizontaal geschaald voor het postuur; hoofd, haar en hoedjes niet
    const sx = ctx.sx;
    const S = parts => { const s = parts.join(''); return sx === 1 ? s : `<g transform="translate(150 0) scale(${sx} 1) translate(-150 0)">${s}</g>`; };
    const L = [];
    if (opts.bg !== false) { const b = outfit.bg ? SETTING_BY_ID[outfit.bg] : null; L.push(b && Backgrounds[b.shape] ? Backgrounds[b.shape](ctx) : `<rect width="300" height="520" fill="${opts.plainBg || 'transparent'}"/>`); }
    L.push(S([partOf(ctx, get('back'), 'back'), partOf(ctx, get('bag'), 'back')]));
    L.push(ctx.hairWrap(partOf(ctx, get('hat'), 'back')));
    L.push(ctx.hairWrap(H.back ? H.back(ctx) : ''));
    const bodyParts = [body(ctx)];
    // niets aan? dan een simpel wit hemdje en short
    if (!dress && !get('bottom') && !(top && top.full)) bodyParts.push(BOTTOMS.shorts(ctx, { c: ['#fdfdfd', '#e6e6ee'] }));
    if (!dress) bodyParts.push(partOf(ctx, get('bottom'), 'front'));
    bodyParts.push(partOf(ctx, get('shoes'), 'front'));
    if (!dress && !top) bodyParts.push(TOPS.tank(ctx, { c: ['#fdfdfd'] }));
    bodyParts.push(dress ? partOf(ctx, dress, 'front') : partOf(ctx, top, 'front'));
    bodyParts.push(partOf(ctx, get('back'), 'front'), partOf(ctx, get('bag'), 'front'), partOf(ctx, get('neck'), 'front'), partOf(ctx, get('hand'), 'front'));
    L.push(S(bodyParts));
    L.push(headOnly(ctx));
    L.push(face(ctx, outfit));
    L.push(ctx.hairWrap(H.front(ctx)));
    L.push(ctx.hairWrap(partOf(ctx, get('hat'), 'front')), partOf(ctx, get('glasses'), 'front'), partOf(ctx, get('pet'), 'front'));
    const cls = opts.className ? ` class="${opts.className}"` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 520"${cls} role="img" aria-label="Jouw model"><defs>${ctx.defs.join('')}</defs>${L.join('')}</svg>`;
  }

  /* ---------- miniatuur van één item ---------- */
  function thumb(item, look) {
    const ctx = makeCtx(look);
    let inner = '';
    if (item.cat === 'hair') {
      const H = HAIR[item.shape];
      inner = ctx.hairWrap(H.back ? H.back(ctx) : '') + headOnly(ctx) + ctx.hairWrap(H.front(ctx));
    } else if (item.cat === 'bg') {
      inner = Backgrounds[item.shape] ? Backgrounds[item.shape](ctx) : '';
    } else if (item.cat.startsWith('mk_')) {
      inner = headOnly(ctx) + ctx.hairWrap(HAIR.kort.front(ctx)) + face(ctx, { [item.cat]: item.id });
    } else {
      inner = partOf(ctx, item, 'back') + partOf(ctx, item, 'front');
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${thumbBox(item)}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><defs>${ctx.defs.join('')}</defs>${inner}</svg>`;
  }

  /* ---------- alleen het hoofd (voor gezichtsvorm kiezen) ---------- */
  function headThumb(look) {
    const ctx = makeCtx(look);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="82 30 136 146" aria-hidden="true"><defs>${ctx.defs.join('')}</defs>${headOnly(ctx)}${face(ctx, {})}</svg>`;
  }

  return { render, thumb, headThumb, light, dark, starPath, heartPath, flower };
})();

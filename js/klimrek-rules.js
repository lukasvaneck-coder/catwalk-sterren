/* Binnenspeeltuin: het Klimrek-doolhof met de golvende glijbaan. Pure regels, zonder browser
   te controleren (node tools/test-speeltuin.js).
   Het doolhof is een raster van vakjes; rij 0 is boven. Je begint linksonder, de uitgang naar
   de glijbaan is rechtsboven. Onderweg pak je letters: samen zijn ze de code voor de extra
   lange glijbaan. Op de glijbaan (zijaanzicht, afstand x, hoogte z boven de baan) spring je
   over jongetjes die naar boven klimmen. */
const KlimrekRules = (() => {
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const rng = seed => { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
  // klein: letters in elke volgorde. groot: de letters vormen een woord dat je bovenaan zelf legt.
  const MODES = {
    klein: { cols: 5, rows: 4, shiftEvery: 14, words: ['BAL', 'ZON', 'VIS', 'KAT', 'BOS', 'TAS', 'KIP', 'POP'] },
    groot: { cols: 6, rows: 5, shiftEvery: 11, words: ['STER', 'BOOT', 'HUIS', 'TENT', 'SPEL', 'BLOK', 'KAAS', 'ROOS'] },
  };
  const MOVE = .2, WARN = 1.6, TRIES = 3;
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const SLIDE = { normal: 3000, long: 6200, drop: 300, wave: 44, waveLength: 560, base: 330, lift: 380, vmin: 150, vmax: 620, ease: 2.2,
    hopV: 470, hopG: 1500, hitDx: 36, hitZ: 28, climb: 55, slow: .45, boys: { normal: 4, long: 8 }, catch: 30 };

  /* ---------------------------------------------------------------- doolhof */
  const key = (a, b) => a < b ? a + '-' + b : b + '-' + a;
  const idx = (s, c, r) => r * s.cols + c;
  const isOpen = (s, c, r, dir) => {
    const [dc, dr] = DIRS[dir], nc = c + dc, nr = r + dr;
    return nc >= 0 && nr >= 0 && nc < s.cols && nr < s.rows && s.links.has(key(idx(s, c, r), idx(s, nc, nr)));
  };
  const neighbours = (s, i) => {
    const c = i % s.cols, r = Math.floor(i / s.cols), out = [];
    for (const [dc, dr] of Object.values(DIRS)) { const nc = c + dc, nr = r + dr; if (nc >= 0 && nr >= 0 && nc < s.cols && nr < s.rows) out.push(idx(s, nc, nr)); }
    return out;
  };
  function maze(s, r) {
    // recursieve backtracker: elk vakje is bereikbaar; daarna een paar extra gaten zodat het minder streng is
    const seen = new Set([0]), stack = [0];
    while (stack.length) {
      const cur = stack[stack.length - 1], next = neighbours(s, cur).filter(n => !seen.has(n));
      if (!next.length) { stack.pop(); continue; }
      const n = next[Math.floor(r() * next.length)];
      s.links.add(key(cur, n)); seen.add(n); stack.push(n);
    }
    for (let i = 0; i < s.cols * s.rows; i++) if (r() < .14) {
      const closed = neighbours(s, i).filter(n => !s.links.has(key(i, n)));
      if (closed.length) s.links.add(key(i, closed[Math.floor(r() * closed.length)]));
    }
  }
  function reachable(s, from) {
    const seen = new Set([from]), queue = [from];
    while (queue.length) { const cur = queue.shift(); for (const n of neighbours(s, cur)) if (!seen.has(n) && s.links.has(key(cur, n))) { seen.add(n); queue.push(n); } }
    return seen;
  }
  // Het klimrek verandert: een paar gangetjes gaan dicht en elders gaan er nieuwe open. Het rek
  // blijft één geheel, dus de uitgang en alle letters zijn altijd bereikbaar. Rond de speler
  // verandert niets, zodat je nooit midden in een stap vast komt te zitten.
  function shift(s) {
    const p = s.player, near = new Set([idx(s, p.c, p.r), idx(s, p.fc, p.fr)]);
    const free = k => k.split('-').every(i => !near.has(+i));
    let changed = 0;
    for (let tries = 0; tries < 40 && changed < 3; tries++) {
      const open = [...s.links].filter(free);
      if (!open.length) break;
      const pick = open[Math.floor(s.rnd() * open.length)];
      s.links.delete(pick);
      const part = reachable(s, idx(s, p.c, p.r)), options = [];
      for (let i = 0; i < s.cols * s.rows; i++) for (const n of neighbours(s, i)) {
        const k = key(i, n);
        // losgeraakt? dan precies een brug tussen de twee helften; anders ergens een nieuw gangetje
        if (k !== pick && !s.links.has(k) && free(k) && (part.size === s.cols * s.rows || part.has(i) !== part.has(n))) options.push(k);
      }
      if (!options.length) { s.links.add(pick); continue; }
      s.links.add(options[Math.floor(s.rnd() * options.length)]); changed++;
    }
    s.shifts++; return changed;
  }

  function create(seed = 1, mode = 'klein') {
    const m = MODES[mode] || MODES.klein, r = rng(seed);
    const s = { game: 'klimrek', mode: MODES[mode] ? mode : 'klein', time: 0, countdown: 3, finished: false, success: false, phase: 'maze', rnd: r,
      cols: m.cols, rows: m.rows, links: new Set(), player: { c: 0, r: m.rows - 1, fc: 0, fr: m.rows - 1, t: 1 },
      exit: { c: m.cols - 1, r: 0 }, queued: null, armed: true, shiftIn: m.shiftEvery, shifts: 0, notice: '', noticeTime: 0, events: [],
      word: m.words[Math.floor(r() * m.words.length)], letters: [], order: [], tries: 0, long: false, slide: null };
    maze(s, r);
    // letters op verschillende plekken, niet te dicht bij elkaar
    const cells = [];
    for (let rr = 0; rr < s.rows; rr++) for (let c = 0; c < s.cols; c++) if (!(c === 0 && rr === s.rows - 1) && !(c === s.exit.c && rr === s.exit.r)) cells.push({ c, r: rr });
    for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [cells[i], cells[j]] = [cells[j], cells[i]]; }
    for (const ch of s.word) {
      const spot = cells.find(p => s.letters.every(l => Math.abs(l.c - p.c) + Math.abs(l.r - p.r) >= 2)) || cells[0];
      cells.splice(cells.indexOf(spot), 1); s.letters.push({ ch, c: spot.c, r: spot.r, got: false });
    }
    return s;
  }
  const allLetters = s => s.letters.every(l => l.got);
  // richting vanuit een veeg, tik of pijltjestoets; ingedrukt houden blijft lopen
  function queue(s, dir) { if (DIRS[dir] && s.phase === 'maze') s.queued = dir; }
  function arrive(s) {
    const p = s.player;
    const letter = s.letters.find(l => !l.got && l.c === p.c && l.r === p.r);
    if (letter) { letter.got = true; s.order.push(letter.ch); s.events.push('letter'); note(s, allLetters(s) ? 'Alle letters! Klim naar de glijbaan ↗' : `Letter ${letter.ch}! Nog ${s.letters.filter(l => !l.got).length} te gaan`, 1.4); }
    if (p.c === s.exit.c && p.r === s.exit.r && s.armed) { s.armed = false; gate(s); }
  }
  const note = (s, text, t = 1.2) => { s.notice = text; s.noticeTime = t; };
  function gate(s) {
    if (!allLetters(s)) { s.phase = 'gate'; return; }                 // de speler kiest: toch glijden of letters zoeken
    if (s.mode === 'klein') { startSlide(s, true); note(s, 'Code compleet! De extra lange glijbaan! 🎉', 2); return; }
    s.phase = 'code';
  }
  // bij de uitgang zonder alle letters: true = toch glijden (gewone glijbaan), false = verder zoeken
  function leaveGate(s, slide) {
    if (s.phase !== 'gate') return;
    if (slide) startSlide(s, false); else { s.phase = 'maze'; note(s, 'Zoek de andere letters!'); }
  }
  // woordpuzzel: answer is de gelegde volgorde (string). Drie pogingen; daarna de gewone glijbaan.
  function answer(s, text) {
    if (s.phase !== 'code') return null;
    if (text.toUpperCase() === s.word) { s.events.push('code'); startSlide(s, true); note(s, `${s.word}! De extra lange glijbaan gaat open! 🎉`, 2); return true; }
    s.tries++; s.events.push('fout');
    if (s.tries >= TRIES) { startSlide(s, false); note(s, `Het woord was ${s.word}. Op naar de gewone glijbaan!`, 2.4); }
    return false;
  }
  function stepMaze(s, dt, input) {
    const p = s.player;
    s.shiftIn -= dt;
    if (s.shiftIn <= 0) { shift(s); s.shiftIn = MODES[s.mode].shiftEvery; s.events.push('shift'); note(s, 'Het klimrek is veranderd!'); }
    if (p.t < 1) { p.t = Math.min(1, p.t + dt / MOVE); if (p.t >= 1) arrive(s); return; }
    const dir = s.queued || input.dir;
    if (!dir) return;
    s.queued = null;
    if (!isOpen(s, p.c, p.r, dir)) { if (!input.dir) s.events.push('bonk'); return; }
    const [dc, dr] = DIRS[dir];
    p.fc = p.c; p.fr = p.r; p.c += dc; p.r += dr; p.t = 0;
    if (!(p.c === s.exit.c && p.r === s.exit.r)) s.armed = true;          // weer bij de uitgang komen vraagt opnieuw
  }

  /* ---------------------------------------------------------------- glijbaan */
  const slideLength = s => s.slide.long ? SLIDE.long : SLIDE.normal;
  // hoogte van de baan: van boven naar beneden, met golven die bij begin en eind uitlopen
  function height(x, length) {
    const fade = clamp(Math.min(x - 150, length - 260 - x) / 300, 0, 1);
    return SLIDE.drop * (1 - x / length) + SLIDE.wave * Math.sin(2 * Math.PI * x / SLIDE.waveLength) * fade;
  }
  const slope = (x, length) => (height(x + 2, length) - height(x - 2, length)) / 4;
  function startSlide(s, long) {
    const length = long ? SLIDE.long : SLIDE.normal, r = s.rnd, n = long ? SLIDE.boys.long : SLIDE.boys.normal;
    const boys = [], stars = [], gap = (length - 1100) / n;
    for (let i = 0; i < n; i++) boys.push({ x: 900 + i * gap + r() * gap * .4, hit: false, passed: false, fly: null, look: Math.floor(r() * 3) });
    for (let x = 300; x < length - 200; x += 230) {
      const near = boys.some(b => Math.abs(b.x - 60 - x) < 120);
      stars.push({ x, z: near ? 62 : 8, got: false });
    }
    s.long = long; s.phase = 'slide';
    s.slide = { long, x: 0, z: 0, vz: 0, v: SLIDE.base * .6, boys, stars, hits: 0, dodged: 0, collected: 0, total: stars.length, length };
  }
  function hop(s) {
    const sl = s.slide;
    if (s.phase !== 'slide' || s.countdown > 0 || sl.z > 0) return false;
    sl.vz = SLIDE.hopV; s.events.push('hop'); return true;
  }
  function stepSlide(s, dt) {
    const sl = s.slide, len = sl.length;
    // snelheid volgt de helling: bergaf sneller, tegen een golf op even trager
    const target = clamp(SLIDE.base - slope(sl.x, len) * SLIDE.lift, SLIDE.vmin, SLIDE.vmax);
    sl.v += (target - sl.v) * Math.min(1, SLIDE.ease * dt);
    sl.x += sl.v * dt;
    if (sl.z > 0 || sl.vz > 0) { sl.vz -= SLIDE.hopG * dt; sl.z = Math.max(0, sl.z + sl.vz * dt); if (sl.z === 0) sl.vz = 0; }
    for (const b of sl.boys) {
      if (b.fly) { b.fly.t += dt; continue; }
      if (b.x - sl.x < 900) b.x -= SLIDE.climb * dt;                     // klimt naar boven zodra je eraan komt
      if (!b.hit && Math.abs(b.x - sl.x) < SLIDE.hitDx && sl.z < SLIDE.hitZ) {
        b.hit = true; b.fly = { t: 0, dir: s.rnd() < .5 ? -1 : 1 }; sl.hits++; sl.v *= SLIDE.slow;
        s.events.push('boem'); note(s, 'Boem! Hij vliegt weg… maar jij gaat trager.', 1.4);
      } else if (!b.hit && !b.passed && b.x < sl.x - SLIDE.hitDx) { b.passed = true; sl.dodged++; }
    }
    for (const st of sl.stars) if (!st.got && Math.abs(st.x - sl.x) < SLIDE.catch && Math.abs(st.z - sl.z) < 34) { st.got = true; sl.collected++; s.events.push('ster'); }
    if (sl.x >= len) { sl.x = len; s.phase = 'done'; s.finished = true; s.success = true; }
  }

  function step(s, dt, input = {}) {
    if (s.finished) return;
    dt = clamp(dt, 0, 1 / 30);
    if (s.countdown > 0) { s.countdown = Math.max(0, s.countdown - dt); return; }
    s.noticeTime = Math.max(0, s.noticeTime - dt);
    if (s.phase === 'gate' || s.phase === 'code') return;               // wacht op een keuze; de tijd staat stil
    s.time += dt;
    if (s.phase === 'maze') stepMaze(s, dt, input); else if (s.phase === 'slide') stepSlide(s, dt);
  }
  const press = s => s.phase === 'slide' ? hop(s) : false;
  // ⭐ beneden gekomen · ⭐ code goed = extra lange glijbaan · ⭐ hoogstens één jongetje geraakt
  const starsFor = s => !s.success ? 0 : 1 + (s.long ? 1 : 0) + (s.slide.hits <= 1 ? 1 : 0);
  const warning = s => s.phase === 'maze' && s.shiftIn <= WARN;
  return { MODES, SLIDE, MOVE, DIRS, TRIES, create, step, press, queue, leaveGate, answer, starsFor, isOpen, reachable, shift, height, slope, startSlide, allLetters, warning, idx };
})();

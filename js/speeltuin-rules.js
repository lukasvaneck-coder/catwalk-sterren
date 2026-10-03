/* Binnenspeeltuin: pure spelregels voor de Springbaan en de Trampoline.
   Ook zonder browser te controleren (node tools/test-speeltuin.js).
   Afstanden zijn spelpixels; hoogtes (h) tellen vanaf de vloer omhoog. */
const SpeeltuinRules = (() => {
  const games = [
    { id: 'springbaan', icon: '🧱', sprite: 'blok', name: 'Springbaan',
      desc: 'Je rent vanzelf door de speelhal. Spring over blokken, pionnen en rollende ballen en pak onderweg de sterren. Hoge torens? Spring nog een keer in de lucht! Je hebt drie hartjes.',
      rules: ['⭐ Finish gehaald', '⭐ Niets geraakt', '⭐ Minstens 60% van de sterren'] },
    { id: 'trampoline', icon: '🤸', sprite: 'trampoline', name: 'Trampolinesterren',
      desc: 'Stuiter op de trampoline en vang zoveel mogelijk sterren in 40 seconden. Druk op Spring precies als je de mat raakt, dan stuiter je steeds hoger. Te vroeg? Dan zak je weer wat.',
      rules: ['⭐⭐⭐ 25 sterren', '⭐⭐ 15 sterren', '⭐ 6 sterren'] },
  ];
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  // kleine voorspelbare dobbelsteen, zodat een baan met dezelfde seed altijd gelijk is
  const rng = seed => { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };

  /* ---------------------------------------------------------------- Springbaan */
  const RUN = { length: 7600, gravity: 2600, jump: 940, doubleJump: 820, buffer: .12, immune: 1.1, playerW: 34, playerH: 88, catch: 40 };
  const SHAPES = {
    blok:  { w: 58, h: 58 },
    kegel: { w: 44, h: 54 },
    toren: { w: 58, h: 118 },
    bal:   { w: 56, h: 56, roll: 150 },
  };
  function course(seed) {
    const r = rng(seed), obstacles = [], stars = [];
    // boogje sterren op sprinthoogte: wie mooi over de hindernis springt, pakt ze mee
    const arc = (x, top) => [[-80, top - 45], [0, top], [80, top - 45]].forEach(([dx, h]) => stars.push({ x: x + dx, h }));
    for (let x = 900; x < RUN.length - 500;) {
      const roll = r();
      if (roll < .3) { obstacles.push({ kind: 'blok', x }); arc(x, 205); }
      else if (roll < .55) { obstacles.push({ kind: 'kegel', x }); arc(x, 200); }
      else if (roll < .72) { obstacles.push({ kind: 'bal', x }); [-260, -200, -140].forEach(dx => stars.push({ x: x + dx, h: 30 })); }
      else if (roll < .87) { obstacles.push({ kind: 'toren', x }); arc(x, 250); }
      else { obstacles.push({ kind: 'blok', x }, { kind: 'blok', x: x + 300 }); arc(x, 205); arc(x + 300, 205); x += 300; }
      x += 520 + r() * 260;
    }
    return { obstacles: obstacles.map(o => ({ ...o, ...SHAPES[o.kind], start: o.x, hit: false })), stars: stars.map(s => ({ ...s, got: false })) };
  }
  function createRun(seed = 1) {
    const c = course(seed);
    return { game: 'springbaan', time: 0, countdown: 3, finished: false, success: false,
      player: { x: 0, h: 0, vy: 0, jumps: 0 }, hearts: 3, hits: 0, immune: 0, buffered: -1, notice: '', noticeTime: 0,
      obstacles: c.obstacles, stars: c.stars, collected: 0, total: c.stars.length, length: RUN.length };
  }
  const runSpeed = s => 300 + clamp(s.player.x / RUN.length, 0, 1) * 130;
  function runJump(s) {
    if (s.finished || s.countdown > 0) return false;
    const p = s.player;
    if (p.h <= 0) { p.vy = RUN.jump; p.jumps = 1; return true; }
    if (p.jumps < 2) { p.vy = RUN.doubleJump; p.jumps = 2; return true; }
    s.buffered = RUN.buffer;                                  // te vroeg gedrukt: springt bij de landing
    return false;
  }
  const overlaps = (s, o) => {
    const p = s.player;
    return p.x + RUN.playerW / 2 > o.x - o.w / 2 && p.x - RUN.playerW / 2 < o.x + o.w / 2 && p.h < o.h && p.h + RUN.playerH > 0;
  };
  function stepRun(s, dt) {
    if (s.finished) return;
    dt = clamp(dt, 0, 1 / 30);
    if (s.countdown > 0) { s.countdown = Math.max(0, s.countdown - dt); return; }
    const p = s.player;
    s.time += dt; s.immune = Math.max(0, s.immune - dt); s.noticeTime = Math.max(0, s.noticeTime - dt);
    p.x += runSpeed(s) * dt;
    p.vy -= RUN.gravity * dt; p.h += p.vy * dt;
    if (p.h <= 0) {
      p.h = 0; p.vy = 0; p.jumps = 0;
      if (s.buffered > 0) { s.buffered = -1; runJump(s); }
    }
    s.buffered -= dt;
    for (const o of s.obstacles) {
      if (o.roll && o.x - p.x < 650) o.x -= o.roll * dt;         // de bal rolt naar je toe als je dichtbij komt
      if (!o.hit && s.immune <= 0 && overlaps(s, o)) {
        o.hit = true; s.hits++; s.hearts--; s.immune = RUN.immune;
        s.notice = s.hearts ? 'Au! Nog ' + s.hearts + (s.hearts === 1 ? ' hartje.' : ' hartjes.') : 'Oei, geen hartjes meer!'; s.noticeTime = 1.4;
      }
    }
    for (const st of s.stars) {
      if (!st.got && Math.hypot(st.x - p.x, st.h - (p.h + RUN.playerH / 2)) < RUN.catch) { st.got = true; s.collected++; }
    }
    if (s.hearts <= 0) { s.finished = true; s.success = false; }
    else if (p.x >= RUN.length) { s.finished = true; s.success = true; }
  }
  function runStars(s) {
    if (!s.success) return 0;
    return 1 + (s.hits === 0 ? 1 : 0) + (s.collected >= Math.ceil(s.total * .6) ? 1 : 0);
  }

  /* ---------------------------------------------------------------- Trampoline */
  const TRAMP = { width: 720, left: 200, right: 520, gravity: 1500, heights: [0, 70, 120, 175, 230, 285], dip: .14, window: .25,
    duration: 40, steer: 320, catch: 36, playerH: 124, starLife: 7, onScreen: 2, respawn: 1.0, starGoals: [25, 15, 6] };
  const launchSpeed = level => Math.sqrt(2 * TRAMP.gravity * TRAMP.heights[level]);
  function createTramp(seed = 1) {
    const s = { game: 'trampoline', time: 0, countdown: 3, finished: false, success: false, rnd: rng(seed),
      player: { x: 360, h: 0, vy: launchSpeed(1) }, level: 1, dip: 0, boost: false, early: false, lastPress: -9,
      stars: [], collected: 0, respawn: [], notice: '', noticeTime: 0, best: 1, superBounces: 0 };
    for (let i = 0; i < TRAMP.onScreen; i++) spawnStar(s);
    return s;
  }
  function spawnStar(s) {
    // gelijk verdeeld over de vijf niveaus: hoe hoger je stuitert, hoe meer sterren je kunt halen
    const tier = 1 + Math.floor(s.rnd() * 5);
    // hoogte van de ster gemeten zoals het vangen: vanaf het midden van het poppetje
    const c = TRAMP.playerH / 2, lo = c + (tier === 1 ? -8 : TRAMP.heights[tier - 1] - 18), hi = c + TRAMP.heights[tier] - 8;
    s.stars.push({ x: TRAMP.left + 10 + s.rnd() * (TRAMP.right - TRAMP.left - 20), h: lo + s.rnd() * (hi - lo), tier, age: 0 });
  }
  const timeToLanding = p => p.vy * p.vy + 2 * TRAMP.gravity * p.h >= 0 ? (p.vy + Math.sqrt(p.vy * p.vy + 2 * TRAMP.gravity * p.h)) / TRAMP.gravity : 0;
  function trampPress(s) {
    if (s.finished || s.countdown > 0) return false;
    if (s.dip > 0) { if (!s.early) s.boost = true; return true; }
    if (timeToLanding(s.player) > TRAMP.window) s.early = true;   // veel te vroeg: deze stuiter telt niet
    s.lastPress = s.time;
    return true;
  }
  function stepTramp(s, dt, input = {}) {
    if (s.finished) return;
    dt = clamp(dt, 0, 1 / 30);
    if (s.countdown > 0) { s.countdown = Math.max(0, s.countdown - dt); return; }
    const p = s.player;
    s.time += dt; s.noticeTime = Math.max(0, s.noticeTime - dt);
    if (s.dip > 0) {
      s.dip -= dt;
      if (s.dip <= 0) {
        const before = s.level;
        s.level = clamp(s.level + (s.boost ? 1 : -1), 1, 5);
        if (s.boost) { s.superBounces++; s.notice = s.level === 5 && before === 5 ? 'Superhoog! 🚀' : 'Super! Hoger! ⤴'; s.noticeTime = .9; }
        else if (s.level < before) { s.notice = s.early ? 'Te vroeg… wacht tot je de mat raakt' : 'Druk als je de mat raakt!'; s.noticeTime = 1.1; }
        s.best = Math.max(s.best, s.level);
        p.vy = launchSpeed(s.level); s.boost = false; s.early = false;
      }
    } else {
      const dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      p.x = clamp(p.x + dx * TRAMP.steer * dt, TRAMP.left, TRAMP.right);
      p.vy -= TRAMP.gravity * dt; p.h += p.vy * dt;
      if (p.h <= 0) {
        p.h = 0; p.vy = 0; s.dip = TRAMP.dip;
        s.boost = !s.early && s.time - s.lastPress <= TRAMP.window;
      }
    }
    for (let i = s.stars.length - 1; i >= 0; i--) {
      const st = s.stars[i];
      st.age += dt;
      if (Math.hypot(st.x - p.x, st.h - (p.h + TRAMP.playerH / 2)) < TRAMP.catch) { s.stars.splice(i, 1); s.collected++; s.respawn.push(TRAMP.respawn); }
      else if (st.age > TRAMP.starLife) { s.stars.splice(i, 1); s.respawn.push(.2); }   // te lang niet gepakt: komt ergens anders terug
    }
    s.respawn = s.respawn.map(t => t - dt).filter(t => { if (t <= 0) { spawnStar(s); return false; } return true; });
    if (s.time >= TRAMP.duration) { s.finished = true; s.success = s.collected >= TRAMP.starGoals[2]; }
  }
  const trampStars = s => TRAMP.starGoals.findIndex(g => s.collected >= g) === -1 ? 0 : 3 - TRAMP.starGoals.findIndex(g => s.collected >= g);

  /* ---------------------------------------------------------------- samen */
  const create = (id, seed) => id === 'springbaan' ? createRun(seed) : createTramp(seed);
  const step = (s, dt, input) => s.game === 'springbaan' ? stepRun(s, dt) : stepTramp(s, dt, input);
  const press = s => s.game === 'springbaan' ? runJump(s) : trampPress(s);
  const starsFor = s => s.game === 'springbaan' ? runStars(s) : trampStars(s);
  return { games, RUN, SHAPES, TRAMP, create, step, press, starsFor, runSpeed, launchSpeed, timeToLanding, course };
})();

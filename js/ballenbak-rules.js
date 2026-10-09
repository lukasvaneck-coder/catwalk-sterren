/* Binnenspeeltuin: Ballenbak-mikken. Pure regels, zonder browser te controleren
   (node tools/test-speeltuin.js).
   De speler gooit vanaf de voorkant de bak in. x is links/rechts (-1..1), d is de diepte
   (0 = bij jou, 1 = achterin). Je mikt op een drijvende bak (1 punt) of op het hoofd van
   papa of mama (2 punten). Drie keer achter elkaar mis = ballenregen: 3 seconden niet gooien. */
const BallenbakRules = (() => {
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const rng = seed => { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
  const BB = { duration: 45, cooldown: .75, maxDepth: 1.3, missesForRain: 3, rain: 3, goals: [30, 16, 6],
    bak: { d: .52, halfX: .2, halfD: .11, amp: .42, speed: .5, points: 1 },
    head: { d: .92, rx: .13, rd: .1, amp: .5, speed: .75, points: 2 } };
  const flight = d => .42 + .3 * clamp(d, 0, BB.maxDepth);
  // beide doelen bewegen rustig heen en weer, elk in een eigen tempo
  const bakX = s => BB.bak.amp * Math.sin(s.time * BB.bak.speed + s.phase);
  const headX = s => BB.head.amp * Math.sin(s.time * BB.head.speed + s.phase * 2 + 2);

  function create(seed = 1, parent = 'papa') {
    const r = rng(seed);
    return { game: 'ballenbak', parent: parent === 'mama' ? 'mama' : 'papa', time: 0, countdown: 3, finished: false, success: false,
      phase: r() * Math.PI * 2, score: 0, hits: 0, heads: 0, throws: 0, streak: 0, rain: 0, rains: 0, cooldown: 0, balls: [], landed: [],
      events: [], notice: '', noticeTime: 0, ouch: 0 };
  }
  // landt de bal op (x, d) als hij nu gegooid wordt? Handig voor bots en het richtpuntje.
  function where(s, x, d, after = flight(d)) {
    const later = { ...s, time: s.time + after };
    const hx = headX(later), bx = bakX(later);
    if (((x - hx) / BB.head.rx) ** 2 + ((d - BB.head.d) / BB.head.rd) ** 2 <= 1) return 'head';
    if (Math.abs(x - bx) <= BB.bak.halfX && Math.abs(d - BB.bak.d) <= BB.bak.halfD) return 'bak';
    return 'mis';
  }
  const canThrow = s => !s.finished && s.countdown <= 0 && s.rain <= 0 && s.cooldown <= 0;
  function throwBall(s, x, d) {
    if (!canThrow(s)) return false;
    x = clamp(x, -1.6, 1.6); d = clamp(d, 0, BB.maxDepth + .4);
    s.balls.push({ x, d, t: 0, dur: flight(d) }); s.throws++; s.cooldown = BB.cooldown; s.events.push('gooi');
    return true;
  }
  function land(s, b) {
    const hit = where(s, b.x, b.d, 0);
    if (hit === 'head') { s.score += BB.head.points; s.heads++; s.hits++; s.streak = 0; s.ouch = .7; s.events.push('hoofd'); note(s, s.parent === 'papa' ? 'Bonk! Raak op papa’s hoofd! +2' : 'Bonk! Raak op mama’s hoofd! +2'); }
    else if (hit === 'bak') { s.score += BB.bak.points; s.hits++; s.streak = 0; s.events.push('bak'); note(s, 'In de bak! +1'); }
    else {
      s.streak++; s.events.push('mis');
      if (s.streak >= BB.missesForRain) { s.streak = 0; s.rain = BB.rain; s.rains++; s.events.push('regen'); note(s, 'Ballenregen! 3 seconden wachten…', BB.rain); }
      else note(s, `Mis! Nog ${BB.missesForRain - s.streak} keer mis = ballenregen`);
    }
    s.landed.push({ x: b.x, d: b.d, hit, age: 0 });
    if (s.landed.length > 14) s.landed.shift();
  }
  const note = (s, text, t = 1.1) => { s.notice = text; s.noticeTime = t; };
  function step(s, dt) {
    if (s.finished) return;
    dt = clamp(dt, 0, 1 / 30);
    if (s.countdown > 0) { s.countdown = Math.max(0, s.countdown - dt); return; }
    s.time += dt; s.noticeTime = Math.max(0, s.noticeTime - dt);
    s.cooldown = Math.max(0, s.cooldown - dt); s.rain = Math.max(0, s.rain - dt); s.ouch = Math.max(0, s.ouch - dt);
    for (const b of s.balls) { b.t += dt; if (b.t >= b.dur) land(s, b); }
    s.balls = s.balls.filter(b => b.t < b.dur);
    for (const l of s.landed) l.age += dt;
    if (s.time >= BB.duration) { s.finished = true; s.success = s.score >= BB.goals[2]; }
  }
  const starsFor = s => { const i = BB.goals.findIndex(g => s.score >= g); return i < 0 ? 0 : 3 - i; };
  return { BB, create, step, throwBall, canThrow, where, flight, bakX, headX, starsFor };
})();

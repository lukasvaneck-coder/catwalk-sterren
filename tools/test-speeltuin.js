// Controleert de spelregels van de binnenspeeltuin: node tools/test-speeltuin.js
const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const path = require('node:path'), root = path.join(__dirname, '..');
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, 'js/speeltuin-rules.js'), 'utf8'), ctx);
const R = vm.runInContext('SpeeltuinRules', ctx);
const DT = 1 / 120;
const run = (s, seconds, each = () => ({})) => { for (let i = 0; i < Math.round(seconds * 120) && !s.finished; i++) R.step(s, DT, each(s)); };

/* ---------- Springbaan ---------- */
// aftellen: niets beweegt en springen kan nog niet
const wait = R.create('springbaan', 1);
assert(!R.press(wait)); run(wait, 2.9); assert.equal(wait.player.x, 0); assert.equal(wait.time, 0);

// zelfde seed = zelfde baan, andere seed = andere baan
assert.deepEqual(R.course(4).obstacles.map(o => o.x), R.course(4).obstacles.map(o => o.x));
assert.notDeepEqual(R.course(4).obstacles.map(o => o.x), R.course(5).obstacles.map(o => o.x));
for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
  const c = R.course(seed).obstacles;
  assert(c.length >= 9, 'genoeg hindernissen');
  for (let i = 1; i < c.length; i++) assert(c[i].x - c[i - 1].x >= 300, 'hindernissen niet te dicht op elkaar');
}

// sprong en dubbele sprong; een derde druk in de lucht wordt bewaard tot de landing
const hop = R.create('springbaan', 1); hop.countdown = 0;
assert(R.press(hop)); run(hop, .05); assert(hop.player.h > 0);
assert(R.press(hop)); assert.equal(hop.player.jumps, 2);
const fallTo = (s, h) => { for (let i = 0; i < 600 && !(s.player.vy < 0 && s.player.h < h); i++) R.step(s, DT); };
fallTo(hop, 25); assert(!R.press(hop), 'derde druk in de lucht is geen sprong');
for (let i = 0; i < 30 && hop.player.jumps !== 1; i++) R.step(hop, DT);
assert.equal(hop.player.jumps, 1, 'net voor de landing gedrukt: springt meteen weer');
const tooSoon = R.create('springbaan', 1); tooSoon.countdown = 0; R.press(tooSoon); R.step(tooSoon, DT); R.press(tooSoon);
fallTo(tooSoon, 200); R.press(tooSoon); run(tooSoon, .6); assert.equal(tooSoon.player.h, 0, 'veel te vroeg gedrukt: geen sprong bij de landing');
const maxH = R.RUN.jump ** 2 / (2 * R.RUN.gravity);
assert(maxH > R.SHAPES.toren.h, 'een toren is met één goede sprong te halen');

// wie nooit springt, verliest drie hartjes en haalt de finish niet
const lazy = R.create('springbaan', 3); lazy.countdown = 0; run(lazy, 60);
assert(lazy.finished && !lazy.success); assert.equal(lazy.hearts, 0); assert.equal(R.starsFor(lazy), 0);

// geraakt worden: één hartje per hindernis, daarna even onkwetsbaar
const bump = R.create('springbaan', 3); bump.countdown = 0;
const first = bump.obstacles[0]; bump.player.x = first.x - 20; R.step(bump, DT);
assert.equal(bump.hearts, 2); assert(bump.immune > 1); R.step(bump, DT); assert.equal(bump.hearts, 2);

// een goede speler: springt als de volgende hindernis dichtbij is, dubbel bij torens
function runBot(s) {
  const p = s.player, ahead = s.obstacles.filter(o => o.x + o.w / 2 > p.x - 17).sort((a, b) => a.x - b.x)[0];
  if (ahead) {
    const dist = ahead.x - p.x, speed = R.runSpeed(s) + (ahead.roll && ahead.x - p.x < 650 ? ahead.roll : 0);
    const lead = ahead.kind === 'toren' ? .16 : .12;
    if (p.h === 0 && dist < speed * (lead + .2) && dist > 0) R.press(s);
    if (ahead.kind === 'toren' && p.jumps === 1 && p.vy < 120 && dist < 120) R.press(s);
  }
  return {};
}
const results = [];
for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
  const s = R.create('springbaan', seed); s.countdown = 0; run(s, 60, runBot);
  assert(s.success, `seed ${seed}: de baan moet uit te spelen zijn (${s.hits} keer geraakt)`);
  assert(s.time > 15 && s.time < 26, `seed ${seed}: een ronde duurt 15-26 s (${s.time.toFixed(1)})`);
  results.push(s);
}
assert(results.every(s => s.hits === 0), 'een goede speler kan zonder botsen finishen');
const gotStars = results.map(s => s.collected / s.total);
// sterren: finish + niets geraakt + 60% van de sterren
const three = R.create('springbaan', 1); Object.assign(three, { finished: true, success: true, hits: 0, collected: three.total });
assert.equal(R.starsFor(three), 3);
three.hits = 1; assert.equal(R.starsFor(three), 2);
three.collected = Math.ceil(three.total * .6) - 1; assert.equal(R.starsFor(three), 1);
three.success = false; assert.equal(R.starsFor(three), 0);
console.log(`Springbaan OK: aftellen, seeds, (dubbel)sprong, hartjes, bot finisht 10 banen zonder botsen in ${Math.min(...results.map(s => s.time)).toFixed(1)}-${Math.max(...results.map(s => s.time)).toFixed(1)} s, vangt ${Math.round(Math.min(...gotStars) * 100)}-${Math.round(Math.max(...gotStars) * 100)}% van de sterren.`);

/* ---------- Trampoline ---------- */
const T = R.TRAMP;
const bounceTop = level => T.heights[level];
assert(Math.abs(R.launchSpeed(3) ** 2 / (2 * T.gravity) - bounceTop(3)) < 1e-6);

// timing: drukken bij de landing = hoger, niet drukken = lager, veel te vroeg = telt niet
function untilDip(s) { for (let i = 0; i < 2400 && s.dip <= 0; i++) R.step(s, DT); }
function finishDip(s) { for (let i = 0; i < 120 && s.dip > 0; i++) R.step(s, DT); }
const good = R.create('trampoline', 1); good.countdown = 0;
for (let i = 0; i < 4; i++) { untilDip(good); R.press(good); finishDip(good); }
assert.equal(good.level, 5, 'vier goede stuiters: niveau 5');
untilDip(good); finishDip(good); assert.equal(good.level, 4, 'niet drukken: een niveau lager');
const early = R.create('trampoline', 1); early.countdown = 0; early.level = 3;
for (let i = 0; i < 6; i++) R.step(early, DT);
R.press(early); untilDip(early); R.press(early); finishDip(early);
assert.equal(early.level, 2, 'te vroeg drukken telt niet, ook niet als je daarna nog drukt');
const justBefore = R.create('trampoline', 1); justBefore.countdown = 0;
for (let i = 0; i < 2400 && R.timeToLanding(justBefore.player) > .1; i++) R.step(justBefore, DT);
R.press(justBefore); untilDip(justBefore); finishDip(justBefore); assert.equal(justBefore.level, 2, 'net voor de landing drukken telt ook');

// sturen blijft op de trampoline
const edge = R.create('trampoline', 1); edge.countdown = 0; run(edge, 3, () => ({ left: true }));
assert.equal(edge.player.x, T.left);

// bots: goede speler (timing + sturen naar de best bereikbare ster), alleen sturen, en rammelen
function trampBot(timing) {
  return s => {
    const p = s.player, reach = T.heights[Math.min(5, s.level + (timing ? 1 : 0))] + T.playerH / 2;
    const target = s.stars.filter(st => st.h <= reach).sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
    if (timing && s.dip > 0 && !s.boost) R.press(s);
    return target ? { left: target.x < p.x - 6, right: target.x > p.x + 6 } : {};
  };
}
const masher = s => { if (Math.round(s.time * 120) % 6 === 0) R.press(s); return {}; };
// een gewoon kind: drukt rond de landing met een slordigheid van -0,3..+0,2 s en kiest pas na 0,4 s een nieuwe ster
function childBot(seed) {
  let r = seed * 7919 % 1000 / 1000; const noise = () => (r = (r * 9301 + 49297) % 233280 / 233280);
  let pressAt = null, target = null, pick = 0;
  return s => {
    const p = s.player;
    if (pressAt === null && p.vy < 0 && s.dip <= 0) pressAt = s.time + R.timeToLanding(p) - .3 + noise() * .5;
    if (pressAt !== null && s.time >= pressAt) { R.press(s); pressAt = null; }
    if (s.time >= pick || !s.stars.includes(target)) { pick = s.time + .4; target = s.stars.slice().sort((a, b) => a.h - b.h)[0]; }
    return target ? { left: target.x < p.x - 10, right: target.x > p.x + 10 } : {};
  };
}
const scores = { good: [], child: [], steer: [], mash: [] };
for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
  for (const [key, bot] of [['good', trampBot(true)], ['child', childBot(seed)], ['steer', trampBot(false)], ['mash', masher]]) {
    const s = R.create('trampoline', seed); s.countdown = 0; run(s, 45, bot);
    assert(s.finished); assert(Math.abs(s.time - T.duration) < .02);
    scores[key].push(s.collected);
  }
}
const lo = a => Math.min(...a), hi = a => Math.max(...a);
assert(lo(scores.good) >= T.starGoals[0], `goede speler haalt 3 sterren (${scores.good})`);
assert(lo(scores.child) >= T.starGoals[0], `kind met redelijke timing haalt 3 sterren (${scores.child})`);
assert(hi(scores.steer) < T.starGoals[1], `zonder timing hooguit 1 ster (${scores.steer})`);
assert(hi(scores.mash) < T.starGoals[1], `rammelen levert hooguit 1 ster op (${scores.mash})`);
const tr = R.create('trampoline', 1);
for (const [n, want] of [[25, 3], [24, 2], [15, 2], [14, 1], [6, 1], [5, 0]]) { tr.collected = n; assert.equal(R.starsFor(tr), want, `${n} sterren`); }
console.log(`Trampoline OK: niveaus, timing, te vroeg, sturen. Sterren gevangen - perfect: ${lo(scores.good)}-${hi(scores.good)}, kind: ${lo(scores.child)}-${hi(scores.child)}, alleen sturen: ${lo(scores.steer)}-${hi(scores.steer)}, rammelen: ${lo(scores.mash)}-${hi(scores.mash)}.`);

/* ---------- Klimrek-doolhof ---------- */
for (const file of ['js/klimrek-rules.js', 'js/ballenbak-rules.js']) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), ctx);
const K = vm.runInContext('KlimrekRules', ctx), BB = vm.runInContext('BallenbakRules', ctx);
const runWith = rules => (s, seconds, each = () => ({})) => { for (let i = 0; i < Math.round(seconds * 120) && !s.finished; i++) rules.step(s, DT, each(s)); };
const runK = runWith(K), runB = runWith(BB);
const whole = s => K.reachable(s, 0).size === s.cols * s.rows;
const around = s => Object.keys(K.DIRS).map(d => K.isOpen(s, s.player.c, s.player.r, d)).join();
// kortste route naar het dichtstbijzijnde doel (de letters, daarna de uitgang)
function route(s, goals) {
  const start = K.idx(s, s.player.c, s.player.r), prev = new Map([[start, null]]), queue = [start];
  while (queue.length) {
    const cur = queue.shift();
    if (goals.includes(cur)) { let n = cur; while (prev.get(n) !== start && prev.get(n) !== null) n = prev.get(n); const c = n % s.cols, r = Math.floor(n / s.cols); return c > s.player.c ? 'right' : c < s.player.c ? 'left' : r > s.player.r ? 'down' : 'up'; }
    const c = cur % s.cols, r = Math.floor(cur / s.cols);
    for (const [d, [dc, dr]] of Object.entries(K.DIRS)) { if (!K.isOpen(s, c, r, d)) continue; const n = K.idx(s, c + dc, r + dr); if (!prev.has(n)) { prev.set(n, cur); queue.push(n); } }
  }
  return null;
}
const climber = (letters = true) => s => {
  if (s.phase === 'maze' && s.player.t >= 1) {
    const goals = letters ? s.letters.filter(l => !l.got).map(l => K.idx(s, l.c, l.r)) : [];
    K.queue(s, route(s, goals.length ? goals : [K.idx(s, s.exit.c, s.exit.r)]));
  }
  return {};
};
// onderweg door de uitgang terwijl er nog letters liggen? Dan kiest de bot 'letters zoeken'
const untilPhase = (s, bot, search = true) => {
  for (let i = 0; i < 120 * 120 && (s.phase === 'maze' || (search && s.phase === 'gate' && !K.allLetters(s))); i++) {
    if (s.phase === 'gate') K.leaveGate(s, false);
    K.step(s, DT, bot(s));
  }
};
for (const mode of ['klein', 'groot']) for (let seed = 1; seed <= 20; seed++) {
  const s = K.create(seed, mode), m = K.MODES[mode];
  assert(whole(s), `${mode} ${seed}: elk vakje van het doolhof is bereikbaar`);
  assert(m.words.includes(s.word) && s.letters.length === s.word.length);
  assert(new Set(s.letters.map(l => l.c + ',' + l.r)).size === s.letters.length, 'letters op verschillende plekken');
  assert(s.letters.every(l => !(l.c === 0 && l.r === s.rows - 1) && !(l.c === s.exit.c && l.r === s.exit.r)), 'geen letter op start of uitgang');
}
assert.notDeepEqual([...K.create(1, 'klein').links], [...K.create(2, 'klein').links], 'elk potje een ander doolhof');
// het klimrek verandert: blijft één geheel, en rond de speler verandert niets
const moving = K.create(5, 'groot'); let changedWalls = 0;
for (let i = 0; i < 60; i++) {
  const before = around(moving), links = [...moving.links].sort().join(); K.shift(moving);
  assert(whole(moving), 'na een verandering is alles bereikbaar'); assert.equal(around(moving), before, 'muurtjes rond de speler blijven');
  if ([...moving.links].sort().join() !== links) changedWalls++;
}
assert(changedWalls > 50, 'het klimrek verandert echt');
const timed = K.create(2, 'klein'); timed.countdown = 0; runK(timed, K.MODES.klein.shiftEvery + .5); assert.equal(timed.shifts, 1, 'na de wachttijd verandert het klimrek vanzelf');
const counting = K.create(3, 'klein'); K.queue(counting, 'up'); K.queue(counting, 'right'); runK(counting, 2.5);
assert.equal(counting.time, 0); assert.equal(counting.player.t, 1, 'tijdens het aftellen klim je nog niet');
// makkelijk: alle letters pakken = vanzelf de extra lange glijbaan
const mazeTimes = [];
for (let seed = 1; seed <= 10; seed++) {
  const easy = K.create(seed, 'klein'); easy.countdown = 0; untilPhase(easy, climber());
  assert(easy.phase === 'slide' && easy.long && K.allLetters(easy), `klein ${seed}: alle letters → extra lange glijbaan`);
  assert.equal(easy.order.length, easy.word.length); mazeTimes.push(easy.time);
}
// woordpuzzel: eerst het woord leggen; fout kost een poging, goed opent de lange glijbaan
const word = K.create(4, 'groot'); word.countdown = 0; untilPhase(word, climber());
assert.equal(word.phase, 'code'); assert.equal(K.answer(word, 'XXXX'), false); assert.equal(word.tries, 1);
const paused = word.time; runK(word, 1); assert.equal(word.time, paused, 'tijdens de puzzel staat de tijd stil');
assert.equal(K.answer(word, word.word.toLowerCase()), true); assert(word.phase === 'slide' && word.long);
const wrong = K.create(4, 'groot'); wrong.countdown = 0; untilPhase(wrong, climber());
for (let i = 0; i < K.TRIES; i++) K.answer(wrong, 'XXXX');
assert(wrong.phase === 'slide' && !wrong.long, 'drie keer fout: de gewone glijbaan');
// zonder letters naar de uitgang: kiezen tussen zoeken en toch glijden
const hurry = K.create(6, 'klein'); hurry.countdown = 0; untilPhase(hurry, climber(false), false);
assert.equal(hurry.phase, 'gate'); K.leaveGate(hurry, false); assert.equal(hurry.phase, 'maze');
runK(hurry, 1); assert.equal(hurry.phase, 'maze', 'op de uitgang blijven staan vraagt niet steeds opnieuw');
K.queue(hurry, ['left', 'down'].find(d => K.isOpen(hurry, hurry.player.c, hurry.player.r, d))); runK(hurry, .4); untilPhase(hurry, climber(false), false);
assert.equal(hurry.phase, 'gate', 'terugkomen bij de uitgang vraagt weer'); K.leaveGate(hurry, true); assert(hurry.phase === 'slide' && !hurry.long);
console.log(`Klimrek OK: doolhoven altijd bereikbaar, veranderend klimrek, letters, woordpuzzel (3 pogingen), uitgang zonder letters. Doolhof met bot: ${Math.min(...mazeTimes).toFixed(1)}-${Math.max(...mazeTimes).toFixed(1)} s`);

/* ---------- Golvende glijbaan ---------- */
const slider = timing => s => {
  const sl = s.slide, b = sl.boys.find(b => !b.hit && b.x > sl.x - 36);
  if (timing && b && sl.z === 0) { const t = (b.x - sl.x) / (sl.v + K.SLIDE.climb); if (t < .3 && t > .13) K.press(s); }
  return {};
};
const slideRun = (seed, long, bot) => { const s = K.create(seed, 'klein'); s.countdown = 0; K.startSlide(s, long); runK(s, 60, bot); return s; };
const slides = { good: [], none: [] };
for (let seed = 1; seed <= 8; seed++) for (const long of [false, true]) {
  const good = slideRun(seed, long, slider(true)), none = slideRun(seed, long, slider(false));
  assert(good.finished && good.success && good.slide.hits === 0, `glijbaan ${seed}: met goede sprongen geen jongetje geraakt (${good.slide.hits})`);
  assert.equal(none.slide.hits, none.slide.boys.length, 'zonder springen raak je elk jongetje');
  assert(none.time > good.time, 'botsen kost snelheid');
  const [min, max] = long ? [14, 28] : [6, 14];
  assert(good.time > min && good.time < max, `glijbaan duurt ${min}-${max} s (${good.time.toFixed(1)})`);
  slides.good.push(good.time); slides.none.push(none.time);
}
const bumped = K.create(1, 'klein'); bumped.countdown = 0; K.startSlide(bumped, false); const boy = bumped.slide.boys[0];
bumped.slide.x = boy.x - 5; bumped.slide.v = 400; K.step(bumped, DT);
assert(boy.hit && boy.fly && bumped.slide.v < 200, 'een jongetje raken: hij vliegt weg en jij gaat trager');
const air = K.create(1, 'klein'); air.countdown = 0; K.startSlide(air, false); assert(K.press(air)); K.step(air, DT); assert(!K.press(air), 'in de lucht spring je niet nog een keer');
const rated = K.create(1, 'klein'); K.startSlide(rated, true); Object.assign(rated, { finished: true, success: true }); rated.slide.hits = 0;
assert.equal(K.starsFor(rated), 3); rated.slide.hits = 2; assert.equal(K.starsFor(rated), 2);
rated.long = false; assert.equal(K.starsFor(rated), 1); rated.slide.hits = 1; assert.equal(K.starsFor(rated), 2);
console.log(`Glijbaan OK: springen over jongetjes, botsen remt af, sterren. Glijtijd ${Math.min(...slides.good).toFixed(1)}-${Math.max(...slides.good).toFixed(1)} s (met botsen tot ${Math.max(...slides.none).toFixed(1)} s)`);

/* ---------- Ballenbak-mikken ---------- */
const pit = BB.create(1); assert(!BB.throwBall(pit, 0, .5), 'tijdens het aftellen gooi je nog niet');
pit.countdown = 0;
const bakAim = s => ({ x: BB.bakX({ ...s, time: s.time + BB.flight(BB.BB.bak.d) }), d: BB.BB.bak.d });
const aimed = bakAim(pit); assert.equal(BB.where(pit, aimed.x, aimed.d), 'bak'); assert(BB.throwBall(pit, aimed.x, aimed.d));
assert(!BB.throwBall(pit, aimed.x, aimed.d), 'na een worp even wachten'); runB(pit, 1); assert.equal(pit.score, 1);
BB.throwBall(pit, BB.headX({ ...pit, time: pit.time + BB.flight(BB.BB.head.d) }), BB.BB.head.d); runB(pit, 1);
assert(pit.score === 3 && pit.heads === 1, 'raak op het hoofd = 2 punten');
for (let i = 0; i < 3; i++) { BB.throwBall(pit, 1.5, .1); runB(pit, .9); }
assert(pit.rain > 1.5 && pit.rains === 1, 'drie keer mis = ballenregen'); assert(!BB.throwBall(pit, 0, .5), 'tijdens de ballenregen gooi je niet');
runB(pit, BB.BB.rain); assert(BB.canThrow(pit), 'na 3 seconden mag je weer');
const gauss = r => Math.sqrt(-2 * Math.log(r() + 1e-9)) * Math.cos(2 * Math.PI * r());
const thrower = (noise, head, seed) => {
  let x = seed * 7919 % 233280; const r = () => (x = (x * 9301 + 49297) % 233280) / 233280; let next = 0;
  return s => {
    if (s.time >= next && BB.canThrow(s)) {
      if (noise > 5) BB.throwBall(s, r() * 2 - 1, r() * 1.2);
      else {
        const t = head ? { x: BB.headX({ ...s, time: s.time + BB.flight(BB.BB.head.d) }), d: BB.BB.head.d } : { x: BB.bakX(s), d: BB.BB.bak.d };
        BB.throwBall(s, t.x + gauss(r) * noise, t.d + gauss(r) * noise);
      }
      next = s.time + (head ? .2 : .35);
    }
    return {};
  };
};
const pits = { perfect: [], good: [], child: [], random: [] };
for (let seed = 1; seed <= 8; seed++) for (const [k, noise, head] of [['perfect', 0, true], ['good', .07, false], ['child', .12, false], ['random', 9, false]]) {
  const s = BB.create(seed); s.countdown = 0; runB(s, 50, thrower(noise, head, seed));
  assert(s.finished && Math.abs(s.time - BB.BB.duration) < .02); pits[k].push(s.score);
}
const median = a => a.slice().sort((x, y) => x - y)[a.length >> 1];
assert(lo(pits.perfect) >= BB.BB.goals[0] && lo(pits.good) >= BB.BB.goals[0], `goede mikkers halen 3 sterren (${pits.good})`);
assert(median(pits.child) >= BB.BB.goals[1], `een kind dat redelijk mikt haalt meestal 2 sterren (${pits.child})`);
assert(hi(pits.random) < BB.BB.goals[2], `zomaar gooien levert niets op (${pits.random})`);
const rate = BB.create(1);
for (const [n, want] of [[30, 3], [29, 2], [16, 2], [15, 1], [6, 1], [5, 0]]) { rate.score = n; assert.equal(BB.starsFor(rate), want, `${n} punten`); }
console.log(`Ballenbak OK: bak 1 punt, hoofd 2, wachttijd, ballenregen na 3 keer mis. Punten - goed: ${lo(pits.good)}-${hi(pits.good)}, kind: ${lo(pits.child)}-${hi(pits.child)}, zomaar: ${hi(pits.random)}`);

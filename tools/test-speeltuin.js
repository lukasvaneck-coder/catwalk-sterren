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

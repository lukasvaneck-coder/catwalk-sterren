// Speelt beide spelletjes van de binnenspeeltuin echt uit in de browser, met een bot die
// via het testhaakje Speeltuin._state() kijkt en via het toetsenbord speelt.
//   playwright-cli -s=speeltuin open http://127.0.0.1:4173 --browser=chrome
//   playwright-cli -s=speeltuin run-code --filename=tools/test-speeltuin-browser.js
//   playwright-cli -s=speeltuin close
// Gebruikt een eigen browsercontext, dus bestaande spelers blijven onaangeroerd.
async page => {
  const context = await page.context().browser().newContext({ viewport: { width: 1280, height: 800 } });
  const t = await context.newPage();
  const errors = [], checks = [];
  t.on('pageerror', e => errors.push(e.message));
  t.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const assert = (value, message) => { if (!value) throw new Error(message); checks.push(message); };
  const profile = () => t.evaluate(() => JSON.parse(localStorage.getItem('catwalk-sterren-v1')).profiles[0]);
  try {
    await t.goto(page.url());
    await t.locator('#profiles .new').click();
    await t.locator('#name-input').fill('Speeltuintest');
    await t.locator('#create-done').click();
    await t.waitForFunction(() => Avatar.isReady());
    await t.locator('#world-menu-toggle').click().catch(() => {});
    await t.locator('#btn-world-speeltuin').click();
    assert(await t.locator('#speeltuin h1').isVisible(), 'lobby van de binnenspeeltuin opent vanuit het dorp');
    assert(await t.evaluate(() => [...document.querySelectorAll('.st-game img')].every(i => i.complete && i.naturalWidth > 0)), 'Blender-plaatjes in de lobby laden');

    /* ---------- Springbaan met een goede bot ---------- */
    const before = await profile();
    await t.locator('[data-play="springbaan"]').click();
    await t.evaluate(() => {
      const key = k => window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
      window.__bot = setInterval(() => {
        const s = Speeltuin._state(); if (!s || s.game !== 'springbaan' || s.finished || s.countdown > 0) return;
        const R = SpeeltuinRules, p = s.player, ahead = s.obstacles.filter(o => o.x + o.w / 2 > p.x - 17).sort((a, b) => a.x - b.x)[0];
        if (!ahead) return;
        const dist = ahead.x - p.x, speed = R.runSpeed(s) + (ahead.roll && dist < 650 ? ahead.roll : 0), lead = ahead.kind === 'toren' ? .16 : .12;
        if (p.h === 0 && dist < speed * (lead + .2) && dist > 0) key(' ');
        if (ahead.kind === 'toren' && p.jumps === 1 && p.vy < 120 && dist < 120) key(' ');
      }, 8);
    });
    await t.waitForFunction(() => Speeltuin._state()?.countdown === 0 && Speeltuin._state().player.x > 900, null, { timeout: 15000 });
    await t.screenshot({ path: 'test-results/speeltuin/springbaan.png' });
    await t.waitForSelector('#st-result .pk-finish', { timeout: 40000 });
    await t.evaluate(() => clearInterval(window.__bot));
    const run = await t.evaluate(() => { const s = Speeltuin._state(); return { success: s.success, hits: s.hits, collected: s.collected, total: s.total, stars: SpeeltuinRules.starsFor(s) }; });
    assert(run.success && run.hits === 0, `springbaan uitgespeeld zonder botsen (${run.collected}/${run.total} sterren)`);
    await t.screenshot({ path: 'test-results/speeltuin/springbaan-klaar.png' });
    const afterRun = await profile();
    assert(afterRun.xp > before.xp && afterRun.coins > before.coins && afterRun.stars === before.stars + run.stars, `beloning: +${afterRun.xp - before.xp} XP, +${afterRun.coins - before.coins} munten, +${run.stars} sterren`);
    assert(afterRun.speeltuin.records.springbaan.best === run.collected && afterRun.done.speeltuin_springbaan === run.stars, 'record en voortgang bewaard');

    /* ---------- Trampoline met timing en sturen ---------- */
    await t.locator('#st-lobby').click();
    await t.locator('[data-play="trampoline"]').click();
    await t.evaluate(() => {
      const down = k => window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
      const up = k => window.dispatchEvent(new KeyboardEvent('keyup', { key: k, bubbles: true }));
      let held = null;
      const hold = k => { if (held === k) return; if (held) up(held); held = k; if (k) down(k); };
      window.__bot = setInterval(() => {
        const s = Speeltuin._state(); if (!s || s.game !== 'trampoline' || s.finished || s.countdown > 0) { hold(null); return; }
        const T = SpeeltuinRules.TRAMP, p = s.player;
        if (s.dip > 0 && !s.boost) down(' ');
        const reach = T.heights[Math.min(5, s.level + 1)] + T.playerH / 2;
        const target = s.stars.filter(st => st.h <= reach).sort((a, b) => Math.abs(a.x - p.x) - Math.abs(b.x - p.x))[0];
        hold(!target ? null : target.x < p.x - 8 ? 'ArrowLeft' : target.x > p.x + 8 ? 'ArrowRight' : null);
      }, 8);
    });
    await t.waitForFunction(() => Speeltuin._state()?.level >= 4, null, { timeout: 20000 });
    await t.screenshot({ path: 'test-results/speeltuin/trampoline.png' });
    await t.waitForSelector('#st-result .pk-finish', { timeout: 60000 });
    await t.evaluate(() => clearInterval(window.__bot));
    const tramp = await t.evaluate(() => { const s = Speeltuin._state(); return { collected: s.collected, best: s.best, stars: SpeeltuinRules.starsFor(s) }; });
    assert(tramp.stars === 3 && tramp.best === 5, `trampoline: ${tramp.collected} sterren gevangen, niveau ${tramp.best}`);
    await t.screenshot({ path: 'test-results/speeltuin/trampoline-klaar.png' });

    /* ---------- Klimrek-doolhof: letters zoeken, woord leggen, glijden ---------- */
    await t.locator('#st-lobby').click();
    await t.locator('[data-play="klimrek"][data-mode="groot"]').click();
    await t.evaluate(() => {
      const tap = k => { window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })); window.dispatchEvent(new KeyboardEvent('keyup', { key: k, bubbles: true })); };
      let typed = 0, wrongDone = false;
      window.__bot = setInterval(() => {
        const s = Speeltuin._state(), K = KlimrekRules; if (!s || s.game !== 'klimrek' || s.finished || s.countdown > 0) return;
        if (s.phase === 'gate') { document.querySelector('#st-gate-search')?.click(); return; }
        if (s.phase === 'code') {                                        // eerst één keer fout, daarna goed
          const tiles = [...document.querySelectorAll('.st-tile:not([disabled])')]; if (!tiles.length) return;
          const want = wrongDone ? s.word[typed] : tiles[0].textContent, tile = tiles.find(b => b.textContent === want);
          tile.click(); typed++;
          if (typed === s.word.length) { typed = 0; wrongDone = true; }
          return;
        }
        if (s.phase === 'slide') {
          const sl = s.slide, b = sl.boys.find(b => !b.hit && b.x > sl.x - 36);
          if (b && sl.z === 0) { const tt = (b.x - sl.x) / (sl.v + K.SLIDE.climb); if (tt < .3 && tt > .13) tap(' '); }
          return;
        }
        if (s.player.t < 1 || s.queued) return;
        const goals = s.letters.filter(l => !l.got).map(l => K.idx(s, l.c, l.r));
        if (!goals.length) goals.push(K.idx(s, s.exit.c, s.exit.r));
        const start = K.idx(s, s.player.c, s.player.r), prev = new Map([[start, null]]), q = [start];
        while (q.length) {
          const cur = q.shift();
          if (goals.includes(cur)) { let n = cur; while (prev.get(n) !== start && prev.get(n) !== null) n = prev.get(n); const c = n % s.cols, r = Math.floor(n / s.cols); tap(c > s.player.c ? 'ArrowRight' : c < s.player.c ? 'ArrowLeft' : r > s.player.r ? 'ArrowDown' : 'ArrowUp'); return; }
          const c = cur % s.cols, r = Math.floor(cur / s.cols);
          for (const [d, [dc, dr]] of Object.entries(K.DIRS)) { if (!K.isOpen(s, c, r, d)) continue; const n = K.idx(s, c + dc, r + dr); if (!prev.has(n)) { prev.set(n, cur); q.push(n); } }
        }
      }, 30);
    });
    await t.waitForFunction(() => Speeltuin._state()?.phase === 'code', null, { timeout: 30000 });
    await t.screenshot({ path: 'test-results/speeltuin/klimrek-woord.png' });
    await t.waitForFunction(() => Speeltuin._state()?.phase === 'slide', null, { timeout: 10000 });
    const code = await t.evaluate(() => { const s = Speeltuin._state(); return { long: s.long, tries: s.tries }; });
    assert(code.long && code.tries === 1, 'klimrek: alle letters, één foute poging, daarna het woord → extra lange glijbaan');
    await t.waitForFunction(() => Speeltuin._state()?.slide?.x > 1500, null, { timeout: 15000 });
    await t.screenshot({ path: 'test-results/speeltuin/glijbaan.png' });
    await t.waitForSelector('#st-result .pk-finish', { timeout: 40000 });
    await t.evaluate(() => clearInterval(window.__bot));
    const climb = await t.evaluate(() => { const s = Speeltuin._state(); return { hits: s.slide.hits, collected: s.slide.collected, stars: KlimrekRules.starsFor(s) }; });
    const afterClimb = await profile();
    assert(climb.stars === 3 && climb.hits === 0 && afterClimb.speeltuin.records.klimrek.best === climb.collected && afterClimb.done.speeltuin_klimrek === 3,
      `glijbaan zonder botsen: 3 sterren, ${climb.collected} glijsterren als record`);

    /* ---------- Ballenbak-mikken: vegen naar de bak, ballenregen ---------- */
    await t.locator('#st-lobby').click();
    await t.locator('[data-parent="mama"]').click();
    await t.locator('[data-play="ballenbak"]').click();
    await t.waitForFunction(() => Speeltuin._state()?.countdown === 0, null, { timeout: 6000 });
    // veeg rustig van de bal in je hand naar de bak; aan het eind even stilhouden = geen extra vaart
    const swipeTo = async which => {
      const pts = await t.evaluate(w => {
        const s = Speeltuin._state(), B = BallenbakRules, P = SpeeltuinExtra._proj, c = document.querySelector('#st-canvas').getBoundingClientRect();
        const vw = s && c.width ? c.width : 1, view = { width: Math.max(640, 540 * c.width / c.height), height: Math.max(640, 540 * c.width / c.height) / (c.width / c.height) };
        const later = { ...s, time: s.time + B.flight(.52) + .45 }, x = w === 'mis' ? 1.5 : B.bakX(later), d = w === 'mis' ? .05 : B.BB.bak.d;
        const T = P.proj(view, x, d), from = { x: view.width / 2, y: view.height * .93 }, end = { x: from.x + (T.x - from.x) / .9, y: from.y + (T.y - from.y) / .9 };
        const px = p => ({ x: c.left + p.x / view.width * c.width, y: c.top + p.y / view.height * c.height });
        return { from: px(from), end: px(end) };
      }, which);
      await t.mouse.move(pts.from.x, pts.from.y); await t.mouse.down();
      await t.mouse.move(pts.end.x, pts.end.y, { steps: 6 }); await t.waitForTimeout(160); await t.mouse.up();
    };
    for (let i = 0; i < 10; i++) { await swipeTo('bak'); await t.waitForTimeout(820); }
    await t.screenshot({ path: 'test-results/speeltuin/ballenbak.png' });
    const pit = await t.evaluate(() => { const s = Speeltuin._state(); return { score: s.score, throws: s.throws, parent: s.parent }; });
    assert(pit.throws === 10 && pit.score >= 7 && pit.parent === 'mama', `ballenbak: vegen naar de bak raakt (${pit.score} van ${pit.throws}), met mama`);
    for (let i = 0; i < 3; i++) { await swipeTo('mis'); await t.waitForTimeout(820); }
    assert(await t.evaluate(() => Speeltuin._state().rain > 0 && document.querySelector('#st-jump').disabled), 'drie keer mis: ballenregen en even niet gooien');
    await t.screenshot({ path: 'test-results/speeltuin/ballenregen.png' });
    await t.evaluate(() => { Speeltuin._state().time = BallenbakRules.BB.duration - .2; });
    await t.waitForSelector('#st-result .pk-finish', { timeout: 5000 });
    const afterPit = await profile();
    assert(afterPit.speeltuin.records.ballenbak.best === pit.score && afterPit.speeltuin.parent === 'mama', 'ballenbak: record en keuze voor mama bewaard');

    /* ---------- telefoon staand: speelveld en knop passen zonder scrollen ---------- */
    await t.setViewportSize({ width: 375, height: 667 });
    await t.locator('#st-lobby').click();
    await t.locator('[data-play="springbaan"]').click();
    const fit = await t.evaluate(() => {
      const c = document.querySelector('#st-canvas').getBoundingClientRect(), b = document.querySelector('#st-jump').getBoundingClientRect();
      return { canvas: Math.round(c.height), buttonBottom: Math.round(b.bottom), vh: innerHeight, scroll: document.documentElement.scrollHeight };
    });
    assert(fit.canvas > 250 && fit.buttonBottom <= fit.vh && fit.scroll <= fit.vh + 1, `telefoon: speelveld ${fit.canvas}px hoog, springknop in beeld`);
    await t.waitForFunction(() => Speeltuin._state()?.countdown === 0, null, { timeout: 6000 });
    await t.locator('#st-jump').tap?.().catch(() => {});
    await t.locator('#st-jump').dispatchEvent('pointerdown', { pointerType: 'touch' });
    await t.waitForTimeout(80);
    assert(await t.evaluate(() => Speeltuin._state().player.h > 0), 'springknop werkt met aanraken');
    await t.screenshot({ path: 'test-results/speeltuin/telefoon.png' });
    await t.locator('#st-pause').click();
    const frozen = await t.evaluate(() => Speeltuin._state().time);
    await t.waitForTimeout(400);
    assert(await t.evaluate(x => Speeltuin._state().time === x, frozen), 'pauze zet het spel stil');
    await t.locator('#st-back').click();
    for (const play of ['[data-play="klimrek"][data-mode="klein"]', '[data-play="ballenbak"]']) {
      await t.locator(play).click();
      const phone = await t.evaluate(() => {
        const c = document.querySelector('#st-canvas').getBoundingClientRect(), last = [...document.querySelectorAll('.st-controls button')].filter(b => !b.hidden && b.offsetParent).pop().getBoundingClientRect();
        return { canvas: Math.round(c.height), bottom: Math.round(last.bottom), vh: innerHeight, scroll: document.documentElement.scrollHeight };
      });
      assert(phone.canvas > 250 && phone.bottom <= phone.vh && phone.scroll <= phone.vh + 1, `telefoon: ${play.includes('klimrek') ? 'klimrek' : 'ballenbak'} ${phone.canvas}px hoog, knoppen in beeld`);
      await t.screenshot({ path: `test-results/speeltuin/telefoon-${play.includes('klimrek') ? 'klimrek' : 'ballenbak'}.png` });
      await t.locator('#st-back').click();
    }
    await t.locator('#st-exit').click();
    assert(await t.evaluate(() => document.body.dataset.screen === 'screen-world'), 'terug naar het dorp');

    assert(errors.length === 0, 'geen fouten in de console');
    return { passed: checks, errors };
  } finally {
    await context.close();
  }
}

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
    await t.locator('#st-exit').click();
    assert(await t.evaluate(() => document.body.dataset.screen === 'screen-world'), 'terug naar het dorp');

    assert(errors.length === 0, 'geen fouten in de console');
    return { passed: checks, errors };
  } finally {
    await context.close();
  }
}

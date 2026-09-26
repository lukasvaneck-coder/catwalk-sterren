// Run against a local game opened with playwright-cli:
// playwright-cli run-code --filename=tools/test-mobile-portrait.js
// Uses a separate browser context, so existing player saves stay untouched.
async page => {
  const context = await page.context().browser().newContext({
    viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true,
    deviceScaleFactor: 1,
  });
  const testPage = await context.newPage();
  const warnings = [], errors = [], checks = [];
  testPage.on('pageerror', e => errors.push(e.message));
  testPage.on('console', m => { if (['warning', 'error'].includes(m.type())) warnings.push(m.text()); });
  const assert = (value, message) => { if (!value) throw new Error(message); };
  try {
    await testPage.bringToFront();
    await testPage.goto(page.url());
    await testPage.locator('#profiles .new').tap();
    await testPage.locator('#name-input').fill('Mobiele test');
    await testPage.locator('#create-done').tap();
    await testPage.waitForFunction(() => Avatar.isReady());

    for (let visit = 0; visit < 2; visit++) {
      await testPage.locator('#world-menu-toggle').tap();
      await testPage.locator('#btn-world-learning').tap();
      assert((await testPage.locator('.modal').boundingBox()).y >= 0, 'Top of learning dialog is clipped');
      await testPage.locator('[data-lesson="weer_fris"]').tap();
      await testPage.locator('#game-menu-toggle').tap();
      await testPage.locator('#btn-world').tap();
      await testPage.waitForFunction(() => {
        const avatar = document.querySelector('#village-avatar');
        return avatar.style.left && avatar.style.top;
      });
    }
    checks.push('Tall modal and village re-entry');

    await testPage.locator('#world-menu-toggle').tap();
    await testPage.locator('#btn-world-learning').tap();
    await testPage.locator('[data-lesson="weer_fris"]').tap();
    const layouts = [];
    for (const [width, height] of [[320,568],[375,667],[412,839]]) {
      await testPage.setViewportSize({width,height});
      await testPage.locator('#tabs button').first().tap();
      const before = await testPage.locator('#stage').boundingBox();
      await testPage.locator('#grid').evaluate(e => e.scrollTop = e.scrollHeight);
      const after = await testPage.locator('#stage').boundingBox();
      const grid = await testPage.locator('#grid').boundingBox();
      const jury = await testPage.locator('#btn-jury').boundingBox();
      assert(before.y === after.y && before.height === after.height, 'Model moved while scrolling clothes');
      assert(after.y >= 0 && after.y + after.height < height, 'Model is clipped');
      assert(grid.y + grid.height <= jury.y, 'Jury button covers clothes');
      assert(jury.y + jury.height <= height, 'Jury button is outside the screen');
      assert(await testPage.evaluate(() => document.documentElement.scrollWidth === innerWidth && scrollY === 0), 'Page overflow');
      await testPage.locator('#challenge-toggle').tap();
      assert(await testPage.locator('#challenge-dialog').evaluate(e => e.open), 'Challenge did not open');
      await testPage.getByRole('button',{name:'Opdracht sluiten',exact:true}).tap();
      await testPage.locator('#game-menu-toggle').tap();
      await testPage.keyboard.press('Escape');
      await testPage.waitForFunction(() => !document.querySelector('#game-menu').open && document.querySelector('#game-menu-toggle').getAttribute('aria-expanded') === 'false');
      layouts.push({width,height,model:after,grid,jury});
    }
    checks.push('Visible model, separate closet scrolling, unobstructed jury at three portrait sizes');
    checks.push('Challenge, menu and Escape dismissal');
    await testPage.locator('#game-menu-toggle').tap();
    await testPage.locator('#btn-world').tap();

    const backgrounds = await testPage.evaluate(() => {
      const canvas = document.createElement('canvas'); canvas.width = 480; canvas.height = 720;
      const ctx = canvas.getContext('2d');
      Backgrounds.draw(ctx, 'stad', 480, 720);
      Backgrounds.draw(ctx, 'turnzaal', 480, 720);
      return ctx.getTransform().isIdentity;
    });
    assert(backgrounds, 'Drawing left an unbalanced canvas transform');
    checks.push('City and gym backgrounds');

    await testPage.locator('#world-menu-toggle').tap();
    await testPage.locator('#btn-world-parkour').tap();
    await testPage.locator('[data-course="rain"]').tap();
    // Observe real simulation state; movement and jumping use browser input.
    await testPage.evaluate(() => {
      const create = ParkourRules.create;
      ParkourRules.create = (...args) => (window.__portraitRace = create(...args));
    });
    await testPage.locator('#pk-start').tap();
    await testPage.waitForFunction(() => window.__portraitRace.countdown === 0);
    const canvas = await testPage.locator('#pk-canvas').boundingBox();
    const jumpButton = await testPage.locator('#pk-jump').boundingBox();
    assert(canvas.height > testPage.viewportSize().height * .5, 'Race field is too small');
    assert(jumpButton.y >= canvas.y + canvas.height && jumpButton.y + jumpButton.height <= testPage.viewportSize().height, 'Race controls overlap or fall outside the screen');
    checks.push('Portrait race field and controls');

    if (context.browser().browserType().name() === 'chromium') {
      const cdp = await context.newCDPSession(testPage);
      const arrowBox = await testPage.locator('[data-move="right"]').boundingBox();
      const jumpBox = await testPage.locator('#pk-jump').boundingBox();
      const arrow = { id: 1, x: arrowBox.x + arrowBox.width / 2, y: arrowBox.y + arrowBox.height / 2 };
      const jump = { id: 2, x: jumpBox.x + jumpBox.width / 2, y: jumpBox.y + jumpBox.height / 2 };
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [arrow] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [arrow, jump] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [jump] });
      assert(await testPage.evaluate(() => window.__portraitRace.jump > 0), 'Jump failed while holding a movement arrow');
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      checks.push('Two-finger movement and jump');
    } else {
      await testPage.locator('#pk-jump').tap();
      assert(await testPage.evaluate(() => window.__portraitRace.jump > 0), 'Touch jump failed');
      checks.push('Touch jump (multitouch requires Chromium CDP)');
    }
    await testPage.locator('#pk-pause').tap();
    const clock = await testPage.locator('#pk-clock').innerText();
    await testPage.waitForTimeout(350);
    assert(await testPage.locator('#pk-clock').innerText() === clock, 'Paused clock changed');
    await testPage.locator('#pk-resume').tap();
    checks.push('Pause and resume');
    assert(!errors.length && !warnings.length, JSON.stringify({ errors, warnings }));
    return { passed: checks, layouts, race:canvas, errors, warnings };
  } finally {
    await context.close();
  }
}

// playwright-cli -s=atelier run-code --filename=tools/test-designer-browser.js
// Een eigen browsercontext: de echte spelers en hun opgeslagen voortgang blijven intact.
async page => {
  const context = await page.context().browser().newContext({ viewport: { width: 1280, height: 900 }, hasTouch: true });
  const p = await context.newPage(), errors = [], checks = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (['warning', 'error'].includes(m.type())) errors.push(m.text()); });
  const assert = (value, message) => { if (!value) throw new Error(message); };
  const saved = () => p.evaluate(() => JSON.parse(localStorage.getItem('catwalk-sterren-v1')).profiles[0]);
  const worldShortcut = async id => { if (!await p.locator(id).isVisible()) await p.locator('#world-menu-toggle').click(); await p.locator(id).click(); };
  const painted = async () => { await p.waitForFunction(() => Avatar.isReady()); await p.waitForFunction(() => [...document.querySelectorAll('#design-model canvas,#design-fabric canvas')].every(c => c.dataset.ok)); };
  const pixels = async () => { await painted(); return p.locator('#design-fabric canvas').evaluate(c => c.toDataURL()); };
  const slide = async (key, value) => p.locator('#design-sticker-' + key).evaluate((el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, String(value));
  try {
    await p.goto(page.url().split('/').slice(0, 3).join('/') + '/');
    await p.locator('#profiles .new').click(); await p.locator('#name-input').fill('Ateliertest'); await p.locator('#create-done').click();
    await worldShortcut('#btn-world-learning'); await p.locator('[data-lesson="weer_fris"]').click();
    await p.locator('#tabs').getByRole('button', { name: 'Extra', exact: false }).click();
    await p.locator('#grid button[title="Coco · knuffelkonijn"]').click();
    await p.locator('#grid button[title="Pip · hamster"]').click();
    assert((await saved()).outfit.hand === 'hd_coco' && (await saved()).outfit.pet === 'pt_pip', 'Coco and Pip are not immediately wearable');
    await p.locator('#btn-designer').click(); await painted();
    assert(await p.locator('#design-model canvas').count() === 1, 'Designer has no preview');
    await p.locator('#design-shape').selectOption('sweater');
    await p.locator('[data-design-color="0"][data-color="#a68bd5"]').click();
    await p.locator('[data-pattern="stars"]').click();
    const noSticker = await pixels();
    await p.locator('[data-add-sticker="bunny"]').click(); await slide('x', 60); await slide('y', 45); await slide('size', 30); await slide('rotation', -15);
    const bunny = await pixels(); assert(noSticker !== bunny, 'Sticker did not change rendered fabric');
    await p.locator('[data-add-sticker="heart"]').click(); await slide('x', 15); await slide('size', 15);
    await p.locator('#design-name').fill('Lavendel met konijntje');
    await p.locator('#design-workspace').evaluate(el => el.scrollTop = 0); await painted();
    await p.screenshot({ path: 'test-results/designer/desktop.png' });
    const beforeCoins = (await saved()).coins;
    await p.locator('#design-save').click(); await painted();
    let profile = await saved(), id = profile.customDesigns[0].id;
    assert(profile.customDesigns.length === 1 && profile.outfit.top === id && profile.owned.includes(id), 'Save did not add and equip design');
    assert(profile.coins === beforeCoins && profile.customDesigns[0].stickers.length === 2, 'Save cost money or lost stickers');
    await p.locator('#design-save').click(); assert((await saved()).customDesigns.length === 1, 'Double saving duplicated the design');
    checks.push('Coco + Pip, live preview, patterned fabric, positioned stickers, free save and equip');

    // A decal must show up on every silhouette, including the shirt under an open hoodie.
    const renderChecks = await p.evaluate(async () => {
      const box = document.createElement('div'); box.hidden = true; document.body.appendChild(box);
      const look = { skin: 's2', eyes: 'e1', hairColor: 'bruin', build: 40 };
      const cases = ClothingDesigns.TYPES.flatMap(t => t.shapes.map(s => ({ cat: t.id, shape: s[0] })));
      for (const spec of cases) {
        const plain = ClothingDesigns.item({ ...spec, c: ['#a68bd5', '#fff1c9'] }, 'plain', 'test');
        const sticker = { ...plain, stickers: [{ kind: 'star', x: 35, y: 40, size: 28, rotation: 0 }] };
        box.innerHTML = Avatar.thumb(plain, look) + Avatar.thumb(sticker, look); Avatar.mountAll();
        const cvs = box.querySelectorAll('canvas');
        if (cvs[0].toDataURL() === cvs[1].toDataURL()) throw new Error('Invisible sticker on ' + spec.shape);
        for (const build of [0, 50, 100]) {
          const it = { ...sticker, id: 'render_test' };
          Avatar.compose({ ...look, build }, { hair: 'hair_knot', [it.cat]: it.id }, { items: { [it.id]: it } });
        }
      }
      box.remove(); return cases.length;
    });
    assert(renderChecks === 16, 'Missing clothing silhouette');
    checks.push('All 16 silhouettes render stickers at three body sizes');

    // Quota/storage failure must not claim success or overwrite the saved design.
    await p.locator('#design-name').fill('Opslagfout-test');
    await p.evaluate(() => { window.originalSetItem = Storage.prototype.setItem; Storage.prototype.setItem = () => { throw new Error('Quota test'); }; });
    await p.locator('#design-save').click();
    assert((await p.locator('#design-status').textContent()).includes('niet gelukt'), 'Missing save failure feedback');
    assert((await saved()).customDesigns[0].name === 'Lavendel met konijntje', 'Failed save overwrote existing design');
    await p.evaluate(() => { Storage.prototype.setItem = window.originalSetItem; });
    await p.locator('#design-name').fill('Lavendel met konijntje'); await p.locator('#design-save').click();
    checks.push('Failed storage write retains draft and previous saved item');

    await p.locator('#design-back').click();
    assert(await p.locator(`#grid [title="Lavendel met konijntje"]`).count() === 1, 'Design missing from closet');
    await p.reload(); await p.locator('#profiles .profile').first().click(); await worldShortcut('#btn-world-designer');
    await p.locator(`[data-edit-design="${id}"]`).click();
    assert(await p.locator('#design-shape').inputValue() === 'sweater', 'Saved shape lost after reload');
    assert(await p.locator('[data-sticker-index]').count() === 2, 'Saved stickers lost after reload');
    const originalPixels = await pixels();
    await p.locator('[data-design-color="0"][data-color="#6eb6db"]').click();
    await p.locator('#design-save').click();
    assert(originalPixels !== await pixels(), 'Edited color is hidden by stale render cache');
    assert((await saved()).customDesigns.length === 1, 'Editing should retain the original id');
    await p.locator('#design-copy').click(); assert((await saved()).customDesigns.length === 2, 'Save as new must create a separate design');
    checks.push('Closet, reload, edit, render cache and copy');

    // All type transitions use the correct outfit slots; changes are only applied at save.
    await p.locator('[data-design-type="dress"]').click(); await p.locator('#design-shape').selectOption('ballgown');
    const beforeDress = await saved(); assert(beforeDress.outfit.top, 'Unsaved preview changed the outfit');
    await p.locator('#design-save').click();
    profile = await saved(); assert(profile.outfit.dress && !profile.outfit.top && !profile.outfit.bottom, 'Dress failed to replace top and bottom');
    await p.locator('[data-design-type="bottom"]').click(); await p.locator('#design-shape').selectOption('wideleg'); await p.locator('#design-save').click();
    profile = await saved(); assert(profile.outfit.bottom && !profile.outfit.dress, 'Bottom failed to remove dress');
    await p.locator('[data-design-type="shoes"]').click(); await p.locator('#design-shape').selectOption('boot'); await p.locator('#design-save').click();
    profile = await saved(); assert(profile.outfit.shoes && !profile.outfit.bottom, 'Type edit left an item in the wrong old slot');
    await p.locator('[data-design-type="top"]').click(); await p.locator('#design-shape').selectOption('sweater');
    await p.locator('#design-name').fill('<b>Eigen label</b>'); await p.locator('#design-save').click();
    assert(await p.locator('#design-preview-name b').count() === 0, 'Custom name interpreted as HTML');
    checks.push('Top, dress, wide trousers, shoes, slot cleanup and safe label text');

    for (let i = 0; i < 3; i++) await p.locator('[data-add-sticker="star"]').click();
    assert(await p.locator('[data-add-sticker="star"]').isDisabled(), 'Sticker limit is not enforced');
    await p.locator('#design-remove-sticker').click(); assert(await p.locator('[data-add-sticker="star"]').isEnabled(), 'Removing a sticker should free a slot');
    await p.locator('#design-name').fill('Mobiel ontwerp');
    for (const [width, height] of [[320,568],[375,667],[412,839],[667,375]]) {
      await p.setViewportSize({ width, height }); await painted();
      const model = await p.locator('.design-preview').boundingBox(), button = await p.locator('#design-save').boundingBox();
      await p.locator('#design-workspace').evaluate(el => el.scrollTop = el.scrollHeight);
      const after = await p.locator('.design-preview').boundingBox();
      assert(model.y === after.y && model.height === after.height, 'Preview scrolls away');
      assert(button.y >= 0 && button.y + button.height <= height, 'Save button is offscreen');
      assert(await p.evaluate(() => document.documentElement.scrollWidth === innerWidth && scrollY === 0), 'Horizontal overflow or page scrolling');
      await p.locator('[data-edit-design]').first().scrollIntoViewIfNeeded();
      await p.locator('#design-workspace').evaluate(el => el.scrollTop = 0);
      await p.screenshot({ path: `test-results/designer/mobile-${width}.png` });
    }
    await p.setViewportSize({ width: 375, height: 667 });
    await p.locator('[data-add-sticker="flower"]').tap(); await slide('rotation', 60); await painted();
    await p.screenshot({ path: 'test-results/designer/mobile-stickers.png' });
    await p.locator('#design-back').tap(); await p.locator('#world-menu-toggle').tap(); await p.locator('#btn-world-designer').tap();
    assert(await p.locator('#design-name').inputValue() === 'Mobiel ontwerp', 'Returning lost the unfinished draft');
    checks.push('Sticker limit and removal, four mobile layouts, touch input and draft recovery');
    await p.locator('#design-save').tap(); await p.locator('#design-back').tap();
    await p.locator('#world-menu-toggle').tap(); await p.locator('#btn-world-players').tap();
    await p.locator('#profiles .new').tap(); await p.locator('#name-input').fill('Tweede speler'); await p.locator('#create-done').tap();
    await p.locator('#world-menu-toggle').tap(); await p.locator('#btn-world-designer').tap();
    assert(await p.locator('[data-edit-design]').count() === 0, 'Another player sees private designs');
    checks.push('Separate collections for different players');
    assert(errors.length === 0, errors.join('\n'));
    return { passed: checks, errors };
  } finally { await context.close(); }
}

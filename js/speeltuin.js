/* Binnenspeeltuin: lobby, canvas en bediening voor de Springbaan en de Trampoline.
   Regels in speeltuin-rules.js; beloning en opslaan gaan via game.js (callbacks).
   Plaatjes komen uit Blender (tools/blender/speeltuin-*.py) en staan in assets/speeltuin/. */
const Speeltuin = (() => {
  const R = SpeeltuinRules, $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const IMG = {};
  const img = file => {
    if (!IMG[file]) { const im = new Image(); im.onload = () => { im.ok = true; }; im.src = `assets/speeltuin/${file}`; IMG[file] = im; }
    return IMG[file];
  };
  const ready = file => img(file).ok;
  ['hal.jpg', 'blok.png', 'toren.png', 'bal.png', 'kegel.png', 'ster.png', 'trampoline.png'].forEach(img);

  const DOLL_W = 92, DOLL_H = 113;
  const ZOOM = { springbaan: 1.4, trampoline: 1 };   // spelwereld vergroot rond de vloerlijn, zodat poppetje en hal kloppen
  const TRAMP_DOLL = 1.3;                            // op de trampoline alleen het poppetje groter (hoogtes blijven in beeld)
  const WALL = '#ecfefe';                            // muurkleur bovenin de hal (uit hal.jpg)
  const MAT_COLORS = ['#ff6fae', '#ffc531', '#3ddcb0', '#5aaeff', '#a36bff', '#ff8c42'];
  let profile, cb = {}, game = 'springbaan', state = null, frame = 0, last = 0, paused = false, active = false;
  let doll = null, listeners = null, observer = null, popups = [], seen = 0, view = { width: 960, height: 540 };
  const keys = new Set();

  function show(p, callbacks) {
    hide(); profile = p; cb = callbacks || {}; active = true;
    profile.speeltuin = profile.speeltuin || { records: {} };
    profile.speeltuin.records = profile.speeltuin.records || {};
    window.addEventListener('keydown', keyDown); window.addEventListener('keyup', keyUp);
    window.addEventListener('blur', autoPause); document.addEventListener('visibilitychange', visibility);
    lobby();
  }
  function hide() {
    document.body.classList.remove('in-speeltuin'); observer?.disconnect(); listeners?.abort();
    active = false; cancelAnimationFrame(frame); frame = 0; keys.clear(); state = null;
    window.removeEventListener('keydown', keyDown); window.removeEventListener('keyup', keyUp);
    window.removeEventListener('blur', autoPause); document.removeEventListener('visibilitychange', visibility);
  }

  /* ---------------------------------------------------------------- lobby */
  function recordText(g) {
    const rec = profile.speeltuin.records[g.id];
    if (!rec) return 'Nog niet gespeeld';
    return `${'⭐'.repeat(rec.stars) || 'Nog geen ster'} · record ${rec.best} ${rec.best === 1 ? 'ster' : 'sterren'} gevangen`;
  }
  function lobby() {
    document.body.classList.remove('in-speeltuin'); observer?.disconnect(); listeners?.abort();
    cancelAnimationFrame(frame); state = null; keys.clear();
    window.scrollTo(0, 0);
    $('#speeltuin').innerHTML = `
      <div class="pk-heading"><div><p class="eyebrow">CATWALK STERREN · BINNENSPEELTUIN</p><h1>🛝 Springen, stuiteren, sterren vangen!</h1><p>Kies een spelletje. De sterren die je verdient tellen mee voor je level.</p></div><button class="btn ghost" id="st-exit" type="button">🏡 Dorp</button></div>
      <div class="st-hero" role="img" aria-label="De speelhal met een ballenbak, regenboog, klimmuur en een klimrek met glijbaan"></div>
      <div class="st-games">${R.games.map(g => `
        <section class="card st-game">
          <img src="assets/speeltuin/${g.sprite}.png" alt="" width="128" height="${g.sprite === 'trampoline' ? 64 : 128}">
          <div>
            <h2>${g.icon} ${g.name}</h2>
            <p>${g.desc}</p>
            <div class="pk-times">${g.rules.map(r => `<span>${r}</span>`).join('')}</div>
            <p class="pk-note">${recordText(g)}</p>
            <p class="pk-note">${g.id === 'springbaan' ? 'Spatie, pijltje omhoog, tik op het speelveld of de Spring-knop = springen. In de lucht nog een keer = dubbele sprong.' : 'Pijltjes of A/D = naar links en rechts. Spatie of Spring precies als je de mat raakt = hoger. P = pauze.'}</p>
            <button class="btn big" data-play="${g.id}" type="button">▶ Spelen</button>
          </div>
        </section>`).join('')}</div>`;
    $('#st-exit').onclick = () => { hide(); cb.exit?.(); };
    document.querySelectorAll('[data-play]').forEach(b => b.onclick = () => { game = b.dataset.play; start(); });
  }

  /* ---------------------------------------------------------------- spelen */
  function start() {
    if (!Avatar.isReady()) { const b = $(`[data-play="${game}"]`); if (b) b.textContent = 'Het poppetje laadt nog… probeer zo opnieuw'; return; }
    state = R.create(game, (Date.now() % 100000) + 1); paused = false; keys.clear(); popups = []; seen = 0;
    doll = Avatar.compose(profile.look, profile.outfit);
    const g = R.games.find(x => x.id === game), tramp = game === 'trampoline';
    document.body.classList.add('in-speeltuin');
    $('#speeltuin').innerHTML = `
      <div class="pk-race-head"><button class="btn ghost sm" id="st-back" type="button">← Spelletjes</button><b>${g.icon} ${g.name}</b><button class="btn ghost sm" id="st-pause" type="button">⏸ Pauze</button></div>
      <div class="pk-live"><strong id="st-main" aria-label="${tramp ? 'Tijd' : 'Hartjes'}"></strong><span id="st-stars"></span><span id="st-progress"></span></div>
      <div class="pk-canvas-wrap"><canvas id="st-canvas" class="${tramp ? 'tramp' : 'run'}" width="960" height="540" tabindex="0" aria-label="${tramp ? 'Trampoline. Stuur met de pijltjes en druk op Spring als je de mat raakt.' : 'Springbaan. Druk op Spring of tik op het speelveld om over de hindernissen te springen.'}"></canvas>
        <div id="st-pause-panel" hidden><h2>Even pauze</h2><p>Het spel staat stil.</p><button class="btn" id="st-resume" type="button">Verder spelen</button></div></div>
      <p id="st-message" class="pk-message" role="status"></p>
      <div class="pk-controls st-controls">
        ${tramp ? '<div class="pk-arrows"><button data-move="left" aria-label="Links" type="button">←</button><button data-move="right" aria-label="Rechts" type="button">→</button></div>' : ''}
        <button class="btn mint" id="st-jump" type="button">Spring ⤴ <small>spatie</small></button>
      </div>
      <div id="st-result" role="status"></div>`;
    $('#st-back').onclick = lobby; $('#st-pause').onclick = () => setPaused(!paused); $('#st-resume').onclick = () => setPaused(false);
    listeners = new AbortController(); const signal = listeners.signal;
    const press = e => { e?.preventDefault(); if (!paused && R.press(state) && game === 'springbaan') Sound.play('klik'); };
    // pointerdown (niet click): een tweede vinger werkt terwijl de andere een pijl vasthoudt
    $('#st-jump').addEventListener('pointerdown', press, { signal });
    $('#st-jump').addEventListener('click', e => { if (e.detail === 0) press(e); }, { signal });   // toetsenbord op de knop
    if (!tramp) $('#st-canvas').addEventListener('pointerdown', press, { signal });
    document.querySelectorAll('.st-controls [data-move]').forEach(b => {
      b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture(e.pointerId); keys.add(b.dataset.move); }, { signal });
      for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(type, () => keys.delete(b.dataset.move), { signal });
    });
    observer?.disconnect();
    observer = new ResizeObserver(() => { if (state && $('#st-canvas')) { resize(); draw(); } });
    observer.observe($('#st-canvas'));
    resize(); window.scrollTo(0, 0); $('#st-canvas').focus({ preventScroll: true });
    last = performance.now(); frame = requestAnimationFrame(tick);
  }
  function setPaused(value) {
    if (!state || state.finished) return;
    paused = value; keys.clear(); $('#st-pause-panel').hidden = !paused; $('#st-pause').textContent = paused ? '▶ Verder' : '⏸ Pauze';
    last = performance.now();
  }
  const autoPause = () => { if (state && !state.finished) setPaused(true); };
  const visibility = () => { if (document.hidden) autoPause(); };
  const moveKeys = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right' };
  function keyDown(e) {
    if (!active || !state || state.finished) return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const button = e.target.closest?.('button');
    if (button && ['Enter', ' '].includes(key)) return;                 // knoppen doen het zelf
    if (moveKeys[key] || [' ', 'ArrowUp', 'w', 'Escape', 'p'].includes(key)) e.preventDefault();
    if ((key === 'Escape' || key === 'p') && !e.repeat) { setPaused(!paused); return; }
    if (paused) return;
    if (moveKeys[key]) keys.add(moveKeys[key]);
    if ([' ', 'ArrowUp', 'w'].includes(key) && !e.repeat && R.press(state) && game === 'springbaan') Sound.play('klik');
  }
  function keyUp(e) { keys.delete(moveKeys[e.key.length === 1 ? e.key.toLowerCase() : e.key]); }

  function tick(now) {
    if (!active || !state) return;
    let dt = Math.min((now - last) / 1000, .25); last = now;
    if (!paused) {
      const before = { hits: state.hits, level: state.level, superBounces: state.superBounces };
      const input = { left: keys.has('left'), right: keys.has('right') };
      while (dt > 0 && !state.finished) { const part = Math.min(dt, 1 / 120); R.step(state, part, input); dt -= part; }
      if (state.hits > (before.hits || 0)) Sound.play('fout');
      if (state.superBounces > (before.superBounces || 0)) Sound.play('pop');
      if (state.collected > seen) { for (let i = seen; i < state.collected; i++) popups.push({ t: 0, ...playerScreen() }); seen = state.collected; Sound.play('ster'); }
      popups.forEach(p => { p.t += 1 / 60; }); popups = popups.filter(p => p.t < .8);
    }
    draw(); hud();
    if (state.finished) { finish(); return; }
    frame = requestAnimationFrame(tick);
  }
  function hud() {
    const s = state, tramp = game === 'trampoline';
    $('#st-main').textContent = tramp ? `${Math.max(0, Math.ceil(R.TRAMP.duration - s.time))} s` : '❤️'.repeat(s.hearts) + '🤍'.repeat(3 - s.hearts);
    $('#st-stars').textContent = tramp ? `⭐ ${s.collected}` : `⭐ ${s.collected}/${s.total}`;
    $('#st-progress').textContent = tramp ? `Niveau ${s.level}/5` : `${Math.min(100, Math.round(s.player.x / s.length * 100))}%`;
    const text = s.countdown > 0 ? `Start over ${Math.ceil(s.countdown)}…`
      : s.noticeTime > 0 ? s.notice
      : tramp ? (timingNow() ? 'Nu! Druk op Spring!' : view.portrait ? 'Stuur met ← →. Druk op Spring als je de mat raakt.' : 'Stuur met ← →. Spatie als je de mat raakt!')
      : s.player.h > 0 ? 'Hop! In de lucht nog een keer = dubbele sprong' : 'Spring over de blokken, pionnen en ballen!';
    if ($('#st-message').textContent !== text) $('#st-message').textContent = text;
    $('#st-jump').disabled = paused || s.countdown > 0;
    $('#st-jump').classList.toggle('now', tramp && timingNow());
  }
  const timingNow = () => state && state.game === 'trampoline' && state.countdown <= 0 && (state.dip > 0 || (state.player.vy < 0 && R.timeToLanding(state.player) <= R.TRAMP.window));

  function finish() {
    document.body.classList.remove('in-speeltuin');
    keys.clear(); listeners?.abort(); $('#st-pause').disabled = true; $('#st-jump').disabled = true;
    const stars = R.starsFor(state), id = game;
    // een record telt alleen als de ronde af is (springbaan: finish gehaald)
    const counts = id === 'trampoline' || state.success;
    const rec = profile.speeltuin.records[id], record = counts && state.collected > (rec?.best || 0);
    if (counts) profile.speeltuin.records[id] = { stars: Math.max(rec?.stars || 0, stars), best: Math.max(rec?.best || 0, state.collected) };
    const reward = stars ? cb.reward?.(stars, id) : null;
    cb.save?.();
    Sound.play(stars ? 'tada' : 'fout');
    const detail = id === 'springbaan'
      ? `${state.collected} van de ${state.total} sterren · ${state.hits === 0 ? 'niets geraakt' : state.hits + ' keer geraakt'}`
      : `${state.collected} sterren gevangen · hoogste niveau ${state.best}`;
    const title = stars ? ['', 'Goed gedaan!', 'Heel goed!', 'Super gesprongen!'][stars]
      : id === 'springbaan' ? (state.success ? 'Gehaald!' : 'Oei, je hartjes zijn op') : 'Nog een keer proberen?';
    const tip = id === 'springbaan' ? 'Tip: spring als de hindernis bijna bij je is. Bij een hoge toren spring je in de lucht nog een keer.'
      : 'Tip: wacht tot je voeten de mat raken en druk dan pas. De knop licht op als het moment er is.';
    $('#st-result').innerHTML = `<div class="card pk-finish"><h2>${stars ? '⭐'.repeat(stars) : '🛝'}</h2><h3>${title}</h3><p>${detail}</p>${record ? '<b>🎉 Nieuw record!</b>' : ''}
      ${reward ? `<p>+${reward.xp} XP · +${reward.coins} munten · +${stars} ${stars === 1 ? 'ster' : 'sterren'}</p>${reward.extra || ''}` : `<p>${tip}</p>`}
      <div class="row wrap"><button class="btn" id="st-retry" type="button">Nog een keer</button><button class="btn ghost" id="st-lobby" type="button">Andere spelletjes</button></div></div>`;
    $('#st-retry').onclick = start; $('#st-lobby').onclick = lobby;
    $('#st-result').scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
  }

  /* ---------------------------------------------------------------- tekenen */
  function resize() {
    const canvas = $('#st-canvas'), w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    const ratio = w / h, minW = game === 'trampoline' ? 720 : 640;
    view = { width: Math.max(minW, 540 * ratio), portrait: matchMedia('(max-width: 760px) and (orientation: portrait)').matches };
    view.height = view.width / ratio;
    const dpr = Math.min(devicePixelRatio || 1, 2), pw = Math.round(w * dpr), ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
  }
  const groundY = () => view.height - 66;                       // springbaan: waar de voeten staan
  const matY = () => view.height - 100;                         // trampoline: bovenkant van de springmat
  const trampX = () => (view.width - R.TRAMP.width) / 2;
  const runScreenX = () => Math.min(170, view.width * (view.portrait ? .16 : .24));   // staand: meer zicht vooruit
  function playerScreen() {
    const p = state.player;
    const z = ZOOM[game];
    return game === 'springbaan' ? { x: runScreenX(), y: groundY() - (p.h + DOLL_H * .6) * z } : { x: trampX() + p.x, y: matY() - p.h - DOLL_H * TRAMP_DOLL * .6 };
  }

  function hall(g, offset) {
    const { width, height } = view, im = img('hal.jpg');
    g.fillStyle = WALL; g.fillRect(0, -height, width, height * 3);       // ook boven de hal als de camera meeklimt
    if (!im.ok) return;
    const th = 540, tw = th * im.width / im.height, top = height - th - 10;
    for (let x = -(((offset % tw) + tw) % tw); x < width; x += tw) g.drawImage(im, x, top, tw + 1, th);
    if (top > -60) {                                                   // bovenrand van de hal laten overlopen in de muur
      const fade = g.createLinearGradient(0, top, 0, top + 70);
      fade.addColorStop(0, WALL); fade.addColorStop(1, 'rgba(236,254,254,0)');
      g.fillStyle = fade; g.fillRect(0, top - 1, width, 71);
    }
  }
  function mat(g, offset, y) {
    const { width, height } = view, tile = 84;
    for (let i = Math.floor(offset / tile) - 1, x = -(((offset % tile) + tile) % tile) - tile; x < width; i++, x += tile) {
      g.fillStyle = MAT_COLORS[((i % 6) + 6) % 6]; g.fillRect(x, y, tile + 1, height - y);
      g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x, y, tile, 6);
      g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(x + tile - 3, y, 3, height - y);
    }
    g.fillStyle = 'rgba(60,40,90,.18)'; g.fillRect(0, y, width, 3);
  }
  function drawDoll(g, x, feet, h, opts = {}) {
    const shadowScale = Math.max(.4, 1 - h / 300), z = opts.zoom || 1;
    g.fillStyle = 'rgba(64,57,87,.22)'; g.beginPath(); g.ellipse(x, opts.shadowY ?? feet + h, 26 * shadowScale * z, 8 * shadowScale * z, 0, 0, 7); g.fill();
    g.save();
    if (opts.flicker) g.globalAlpha = .45 + .35 * Math.sin(state.time * 22);
    g.translate(x, feet);
    if (z !== 1) g.scale(z, z);
    if (opts.squash) g.scale(1 + opts.squash * .5, 1 - opts.squash);
    if (opts.tilt) g.rotate(opts.tilt);
    g.drawImage(doll, -DOLL_W / 2, -DOLL_H, DOLL_W, DOLL_H);
    g.restore();
  }
  function sprite(g, name, cx, cy, size, angle = 0, alpha = 1) {
    const im = img(name + '.png');
    if (!im.ok) { g.fillStyle = '#ff6fae'; g.fillRect(cx - size / 2.4, cy - size / 2.4, size / 1.2, size / 1.2); return; }
    g.save(); g.globalAlpha = alpha; g.translate(cx, cy); if (angle) g.rotate(angle);
    g.drawImage(im, -size / 2, -size / 2, size, size); g.restore();
  }
  function starPopups(g) {
    g.font = 'bold 20px system-ui'; g.textAlign = 'center';
    for (const p of popups) { g.globalAlpha = 1 - p.t / .8; g.fillStyle = '#e49b00'; g.fillText('+1 ⭐', p.x, p.y - p.t * 60); }
    g.globalAlpha = 1;
  }
  function countdown(g) {
    if (state.countdown <= 0) return;
    g.fillStyle = 'rgba(64,48,90,.4)'; g.fillRect(0, 0, view.width, view.height);
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = 'bold 84px system-ui'; g.fillText(Math.ceil(state.countdown), view.width / 2, view.height / 2 + 28);
  }

  function drawRun(g) {
    const s = state, p = s.player, gy = groundY(), sx = runScreenX(), z = ZOOM.springbaan;
    const X = x => sx + (x - p.x) * z;                                // spelwereld -> scherm
    // bij een hoge (dubbele) sprong klimt de camera mee, zodat het hoofd in beeld blijft
    const camY = Math.max(0, (p.h + DOLL_H) * z - (gy - 24));
    g.save(); g.translate(0, camY);
    hall(g, p.x * z * .55); mat(g, p.x * z, gy - 4);
    // finishpoort
    const fx = X(s.length);
    if (fx > -120 && fx < view.width + 120) {
      const u = 14 * z;
      g.fillStyle = '#a36bff'; g.fillRect(fx - 5 * u, gy - 14 * u, u, 14 * u); g.fillRect(fx + 4 * u, gy - 14 * u, u, 14 * u);
      for (let i = 0; i < 10; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#fff' : '#5b4a8a'; g.fillRect(fx - 5 * u + i * u, gy - 15.7 * u + j * u, u, u); }
      g.fillStyle = '#5b4a8a'; g.font = `bold ${Math.round(16 * z)}px system-ui`; g.textAlign = 'center'; g.fillText('FINISH', fx, gy - 16.3 * u);
    }
    for (const st of s.stars) {
      if (st.got) continue;
      const x = X(st.x); if (x < -40 || x > view.width + 40) continue;
      sprite(g, 'ster', x, gy - (st.h + (reduced() ? 0 : Math.sin(s.time * 4 + st.x) * 4)) * z, 36 * z);
    }
    for (const o of s.obstacles) {
      const x = X(o.x); if (x < -120 || x > view.width + 120) continue;
      g.fillStyle = 'rgba(64,57,87,.18)'; g.beginPath(); g.ellipse(x, gy, o.w * .55 * z, 7 * z, 0, 0, 7); g.fill();
      sprite(g, o.kind, x, gy - o.h / 2 * z, Math.max(o.w, o.h) * 1.1 * z, o.roll ? -(o.start - o.x) / (o.w / 2) : 0, o.hit ? .55 : 1);
    }
    const run = p.h === 0 && s.countdown <= 0 && !reduced();
    drawDoll(g, sx, gy - (p.h + (run ? Math.abs(Math.sin(s.time * 13)) * 4 : 0)) * z, p.h,
      { zoom: z, flicker: s.immune > 0, shadowY: gy, tilt: run ? Math.sin(s.time * 13) * .04 : p.h > 0 ? -.08 : 0 });
    starPopups(g);
    g.restore();
    if (s.countdown <= 0 && s.player.x < 600) {                        // korte uitleg in beeld bij de start
      g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.roundRect(view.width / 2 - 150, 18, 300, 40, 16); g.fill();
      g.fillStyle = '#62488b'; g.font = 'bold 16px system-ui'; g.textAlign = 'center'; g.fillText('Tik of spatie = springen ⤴', view.width / 2, 44);
    }
    countdown(g);
  }

  function drawTramp(g) {
    const s = state, p = s.player, T = R.TRAMP, ox = trampX(), my = matY(), floor = my + 88;
    const im = img('hal.jpg'), tw = im.ok ? 540 * im.width / im.height : 1080;
    hall(g, tw / 3 - view.width / 2);                                 // regenboog in het midden
    mat(g, 0, floor);
    // hoogtelijnen per niveau
    g.setLineDash([6, 8]); g.lineWidth = 2; g.font = 'bold 13px system-ui'; g.textAlign = 'left';
    for (let k = 1; k <= 5; k++) {
      const y = my - T.heights[k] - T.playerH / 2;
      g.strokeStyle = k <= s.level ? 'rgba(163,107,255,.55)' : 'rgba(91,74,138,.18)';
      g.beginPath(); g.moveTo(ox + 150, y); g.lineTo(ox + T.width - 150, y); g.stroke();
      g.fillStyle = k <= s.level ? '#7c4fd6' : 'rgba(91,74,138,.45)'; g.fillText(String(k), ox + 132, y + 5);
    }
    g.setLineDash([]);
    // trampoline (de mat zakt mee tijdens de dip)
    const tim = img('trampoline.png'), w = 470, h = w / 2, dip = s.dip > 0 ? Math.sin((1 - s.dip / T.dip) * Math.PI) * 10 : 0;
    if (tim.ok) g.drawImage(tim, ox + T.width / 2 - w / 2, my - h * .44 + dip * .4, w, h);
    for (const st of s.stars) {
      const blink = st.age > T.starLife - 1.5 && !reduced() ? .4 + .6 * Math.abs(Math.sin(st.age * 9)) : 1;
      sprite(g, 'ster', ox + st.x, my - st.h + (reduced() ? 0 : Math.sin(s.time * 3 + st.x) * 3), 40, 0, blink);
    }
    if (timingNow()) {                                                // nu drukken!
      g.strokeStyle = '#ffc531'; g.lineWidth = 5; g.beginPath(); g.ellipse(ox + p.x, my + dip, 44, 13, 0, 0, 7); g.stroke();
    }
    drawDoll(g, ox + p.x, my - p.h + dip, 0, { zoom: TRAMP_DOLL, squash: s.dip > 0 ? Math.sin((1 - s.dip / T.dip) * Math.PI) * .12 : 0, shadowY: my + dip });
    // niveaumeter
    const mx = ox + T.width - 92, mh = 150, my0 = 70;
    g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.roundRect(mx - 8, my0 - 30, 64, mh + 48, 16); g.fill();
    g.fillStyle = '#62488b'; g.font = 'bold 12px system-ui'; g.textAlign = 'center'; g.fillText('NIVEAU', mx + 24, my0 - 12);
    for (let k = 1; k <= 5; k++) {
      g.fillStyle = k <= s.level ? MAT_COLORS[k - 1] : '#ece6f5';
      g.beginPath(); g.roundRect(mx + 4, my0 + mh - k * 30 + 4, 40, 24, 8); g.fill();
    }
    starPopups(g);
    countdown(g);
  }

  function draw() {
    const canvas = $('#st-canvas'); if (!canvas || !state) return;
    const g = canvas.getContext('2d');
    g.setTransform(canvas.width / view.width, 0, 0, canvas.height / view.height, 0, 0);
    g.clearRect(0, 0, view.width, view.height);
    if (game === 'springbaan') drawRun(g); else drawTramp(g);
  }

  // _state is een testhaakje (zoals World._tick): een browsertest kan zo de baan 'zien' en goed spelen
  return { show, hide, _state: () => state };
})();

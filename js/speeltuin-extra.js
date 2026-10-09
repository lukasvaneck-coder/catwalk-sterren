/* Binnenspeeltuin: Klimrek-doolhof en Ballenbak-mikken. Bediening en tekenen; de regels staan in
   klimrek-rules.js en ballenbak-rules.js. speeltuin.js regelt lobby, pauze, beloning en opslaan
   en geeft een 'kit' met tekenhulpjes (hal, poppetje, plaatjes, aftellen).
   Eigen plaatjes in assets/speeltuin/ (klimrek.png, doelbak.png, ballenbak.jpg) worden gebruikt zodra ze
   in ASSETS staan; anders tekent het spel alles zelf. */
const SpeeltuinExtra = (() => {
  const K = KlimrekRules, B = BallenbakRules;
  // Eigen plaatjes voor deze spellen (zie README): zet de bestandsnaam hier zodra het plaatje in
  // assets/speeltuin/ staat. Tot die tijd tekent het spel ze zelf en vraagt het niets op.
  const ASSETS = new Set(['klimrek.png', 'doelbak.png', 'ballenbak.jpg']);
  const art = (kit, name) => ASSETS.has(name) ? kit.img(name) : { ok: false };
  const COLORS = ['#ff6fae', '#ffc531', '#3ddcb0', '#5aaeff', '#a36bff', '#ff8c42'];
  const HINTS = { BAL: '⚽', ZON: '☀️', VIS: '🐟', KAT: '🐱', BOS: '🌳', TAS: '👜', KIP: '🐔', POP: '🪆',
    STER: '⭐', BOOT: '⛵', HUIS: '🏠', TENT: '⛺', SPEL: '🎲', BLOK: '🧱', KAAS: '🧀', ROOS: '🌹' };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lerp = (a, b, t) => a + (b - a) * t;
  const games = [
    { id: 'klimrek', icon: '🧗', sprite: ASSETS.has('klimrek.png') ? 'klimrek' : 'toren', name: 'Klimrek-doolhof',
      desc: 'Klim door het doolhof naar de golvende glijbaan rechtsboven. Pak onderweg de letters: dat is de code voor de extra lange glijbaan! Het klimrek verandert soms. Op de glijbaan spring je over de jongetjes die naar boven klimmen.',
      rules: ['⭐ Beneden gekomen', '⭐ Code goed = extra lange glijbaan', '⭐ Hoogstens één jongetje geraakt'],
      help: 'Pijltjes of WASD, veeg of tik naar een vakje = klimmen. Op de glijbaan: spatie, tik of Spring = springen. P = pauze.',
      modes: [['klein', '▶ Makkelijk', 'Letters in elke volgorde'], ['groot', '▶ Woordpuzzel', 'Leg zelf het woord']] },
    { id: 'ballenbak', icon: '🎯', sprite: ASSETS.has('doelbak.png') ? 'doelbak' : 'bal', name: 'Ballenbak-mikken',
      desc: 'Veeg de bal omhoog, net als in Pokémon Go. In de bak is 1 punt, op het hoofd van papa of mama 2 punten! Je hebt 45 seconden. Drie keer achter elkaar mis? Dan komt er een ballenregen en ben je 3 seconden kwijt.',
      rules: ['⭐⭐⭐ 30 punten', '⭐⭐ 16 punten', '⭐ 6 punten'], unit: 'punten',
      help: 'Veeg met je vinger of muis omhoog: hoe harder, hoe verder. Of mik met de pijltjes en gooi met spatie. P = pauze.',
      parents: [['papa', '👨 Papa'], ['mama', '👩 Mama']] },
  ];
  const ball = (g, x, y, r, c) => {
    const gr = g.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r);
    gr.addColorStop(0, '#ffffffcc'); gr.addColorStop(.25, c); gr.addColorStop(1, shade(c));
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  };
  const shade = c => { const n = parseInt(c.slice(1), 16); return '#' + [16, 8, 0].map(s => Math.round((n >> s & 255) * .7).toString(16).padStart(2, '0')).join(''); };
  // poppetjes voor papa, mama en de jongetjes: dezelfde stijl als de speler (zoals papa bij de race)
  const PAPA = { look: { skin: 's3', eyes: 'e1', hairColor: 'donker', build: 65 }, outfit: { hair: 'hair_kort', top: 'top_tshirt_blauw', bottom: 'bot_jeans', shoes: 'sh_sneakers' } };
  const MAMA = { look: { skin: 's2', eyes: 'e3', hairColor: 'blond', build: 50 }, outfit: { hair: 'hair_lang', dress: 'dr_roze', shoes: 'sh_sneakers', ears: 'ear_parels' } };
  const BOYS = [['s1', 'blond', 'top_tshirt_rood'], ['s4', 'zwart', 'top_tshirt_groen'], ['s2', 'rood', 'top_streep']]
    .map(([skin, hairColor, top]) => ({ look: { skin, eyes: 'e2', hairColor, build: 45 }, outfit: { hair: 'hair_kort', top, bottom: 'bot_korte_broek', shoes: 'sh_sneakers', hat: 'hat_pet' } }));

  /* ================================================================ Klimrek-doolhof */
  let boyDolls = [], panelPhase = '', answer = [];
  const dirKeys = { ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right' };
  function geo(s, view) {
    const top = 78, bottom = 22, room = view.width - 120;
    const cell = Math.min(room / (s.cols + .9), (view.height - top - bottom) / s.rows, 130);
    const w = cell * s.cols, h = cell * s.rows;
    return { cell, x0: (view.width - w - cell * .9) / 2, y0: top + (view.height - top - bottom - h) / 2, w, h };
  }
  const klimrek = {
    minWidth: 640, moveKeys: dirKeys, canvasClass: 'run',
    label: 'Klimrek-doolhof. Klim met de pijltjes of tik naar een vakje. Op de glijbaan druk je op spatie om te springen.',
    create(seed, opts) { boyDolls = BOYS.map(b => Avatar.compose(b.look, b.outfit)); panelPhase = ''; answer = []; return K.create(seed, opts.mode); },
    controls: () => `<div class="pk-arrows st-pad"><button data-move="up" aria-label="Omhoog" type="button">↑</button><button data-move="left" aria-label="Links" type="button">←</button><button data-move="down" aria-label="Omlaag" type="button">↓</button><button data-move="right" aria-label="Rechts" type="button">→</button></div>
      <button class="btn mint" id="st-jump" type="button" hidden>Spring ⤴ <small>spatie</small></button>`,
    press: s => K.press(s),
    nudge: (s, dir) => K.queue(s, dir),
    step: (s, dt, input) => K.step(s, dt, input),
    input(keys) { const dir = [...keys].reverse().find(k => K.DIRS[k]); return { dir }; },
    keyDown(s, key, repeat) {
      if ([' ', 'Enter'].includes(key) && !repeat && s.phase === 'slide') { K.press(s); return true; }
      if (dirKeys[key] && !repeat) K.queue(s, dirKeys[key]);            // ook een heel korte tik telt als stap
      return !!dirKeys[key];
    },
    bind(canvas, signal, kit) {
      let start = null;
      canvas.addEventListener('pointerdown', e => {
        const s = kit.state(); if (!s || kit.paused()) return;
        if (s.phase === 'slide') { e.preventDefault(); K.press(s); return; }
        start = kit.point(e);
      }, { signal });
      canvas.addEventListener('pointerup', e => {
        const s = kit.state(); if (!start || !s || s.phase !== 'maze' || kit.paused()) { start = null; return; }
        const end = kit.point(e), dx = end.x - start.x, dy = end.y - start.y;
        let vx = dx, vy = dy;
        if (Math.hypot(dx, dy) < 24) {                                   // tik: één stapje in de richting van de tik
          const gm = geo(s, kit.view()), p = playerCell(s, gm);
          vx = end.x - p.x; vy = end.y - p.y;
        }
        K.queue(s, Math.abs(vx) > Math.abs(vy) ? (vx > 0 ? 'right' : 'left') : (vy > 0 ? 'down' : 'up'));
        start = null;
      }, { signal });
    },
    sound: e => ({ letter: 'ster', ster: 'ster', code: 'tada', fout: 'fout', boem: 'fout', hop: 'klik', shift: 'pop', bonk: 'klik' }[e]),
    hud(s) {
      const got = s.letters.filter(l => l.got).length, slide = s.phase === 'slide' || s.phase === 'done';
      const sl = s.slide;
      return { pad: !slide,
        main: slide ? `💥 ${sl.hits}` : `🔤 ${got}/${s.letters.length}`, mainLabel: slide ? 'Jongetjes geraakt' : 'Letters',
        stars: slide ? `⭐ ${sl.collected}/${sl.total}` : (s.mode === 'klein' ? 'Makkelijk' : 'Woordpuzzel'),
        progress: slide ? `${Math.min(100, Math.round(sl.x / sl.length * 100))}%` : (s.long ? 'Extra lang!' : 'Doolhof'),
        message: s.countdown > 0 ? `Start over ${Math.ceil(s.countdown)}…` : s.noticeTime > 0 ? s.notice
          : K.warning(s) ? 'Let op! Het klimrek gaat veranderen…'
          : slide ? 'Tik of spatie = springen over de jongetjes!'
          : K.allLetters(s) ? 'Alle letters! Klim naar de glijbaan rechtsboven ↗' : 'Zoek de letters en klim naar de glijbaan rechtsboven ↗',
        jump: slide,
      };
    },
    ui(s, kit) {
      const panel = kit.panel(), phase = s.phase === 'gate' || s.phase === 'code' ? s.phase + s.tries : '';
      if (phase === panelPhase) return;
      panelPhase = phase; panel.hidden = !phase;
      if (!phase) { panel.innerHTML = ''; return; }
      if (s.phase === 'gate') {
        const got = s.letters.filter(l => l.got).length;
        panel.innerHTML = `<h2>🛝 De glijbaan!</h2><p>Je hebt ${got} van de ${s.letters.length} letters. Met alle letters gaat de <b>extra lange glijbaan</b> open.</p>
          <div class="row wrap"><button class="btn ghost" id="st-gate-search" type="button">🔍 Letters zoeken</button><button class="btn" id="st-gate-slide" type="button">🛝 Toch glijden</button></div>`;
        panel.querySelector('#st-gate-search').onclick = () => { K.leaveGate(s, false); kit.refresh(); };
        panel.querySelector('#st-gate-slide').onclick = () => { K.leaveGate(s, true); kit.refresh(); };
        panel.querySelector('#st-gate-slide').focus();
        return;
      }
      answer = [];
      const tiles = s.order.map((ch, i) => ({ ch, i })).sort((a, b) => ((a.i * 7 + 3) % 5) - ((b.i * 7 + 3) % 5));
      const draw = () => {
        panel.innerHTML = `<h2>🔐 Leg het woord! <span aria-hidden="true">${HINTS[s.word] || ''}</span></h2>
          <p>Tik de letters in de goede volgorde. ${s.tries ? `Nog ${K.TRIES - s.tries} ${K.TRIES - s.tries === 1 ? 'poging' : 'pogingen'}.` : 'Je hebt drie pogingen.'}</p>
          <div class="st-word" aria-label="Jouw woord">${s.word.split('').map((_, i) => `<span>${answer[i] ? esc(answer[i].ch) : ''}</span>`).join('')}</div>
          <div class="st-tiles">${tiles.map(t => `<button type="button" class="st-tile" data-tile="${t.i}" ${answer.includes(t) ? 'disabled' : ''}>${esc(t.ch)}</button>`).join('')}</div>
          <button class="btn ghost sm" id="st-word-clear" type="button">↺ Opnieuw leggen</button>`;
        panel.querySelectorAll('[data-tile]').forEach(b => b.onclick = () => {
          answer.push(tiles.find(t => t.i === +b.dataset.tile));
          if (answer.length < s.word.length) { draw(); panel.querySelector('.st-tile:not([disabled])')?.focus(); return; }
          const ok = K.answer(s, answer.map(t => t.ch).join(''));
          answer = []; kit.refresh();
          if (ok === false && s.phase === 'code') { panelPhase = ''; klimrek.ui(s, kit); panel.querySelector('.st-word')?.classList.add('wrong'); }
        });
        panel.querySelector('#st-word-clear').onclick = () => { answer = []; draw(); };
      };
      draw(); panel.querySelector('.st-tile')?.focus();
    },
    result(s) {
      const got = s.letters.filter(l => l.got).length, sl = s.slide;
      return { stars: K.starsFor(s), best: sl.collected, counts: true,
        detail: `${got} van de ${s.letters.length} letters · ${s.long ? 'extra lange glijbaan' : 'gewone glijbaan'} · ${sl.hits === 0 ? 'geen jongetje geraakt' : sl.hits + ' ' + (sl.hits === 1 ? 'jongetje' : 'jongetjes') + ' geraakt'} · ${sl.collected} sterren`,
        tip: s.long ? 'Tip: spring net voordat een jongetje bij je is. Dan vlieg je er mooi overheen.' : 'Tip: pak alle letters voordat je naar de glijbaan gaat. Dan mag je op de extra lange glijbaan!' };
    },
    draw(g, s, kit) { if (s.phase === 'slide' || s.phase === 'done') drawSlide(g, s, kit); else drawMaze(g, s, kit); },
  };
  function playerCell(s, gm) {
    const p = s.player, t = p.t < 1 ? p.t * p.t * (3 - 2 * p.t) : 1;
    return { x: gm.x0 + (lerp(p.fc, p.c, t) + .5) * gm.cell, y: gm.y0 + (lerp(p.fr, p.r, t) + .5) * gm.cell, t };
  }
  function bar(g, x1, y1, x2, y2, w, c) {
    g.lineCap = 'round'; g.strokeStyle = shade(c); g.lineWidth = w; g.beginPath(); g.moveTo(x1, y1 + 2); g.lineTo(x2, y2 + 2); g.stroke();
    g.strokeStyle = c; g.lineWidth = w * .82; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    g.strokeStyle = '#ffffff66'; g.lineWidth = w * .22; g.beginPath(); g.moveTo(x1 + (y1 !== y2 ? -w * .15 : 0), y1 - (y1 === y2 ? w * .15 : 0)); g.lineTo(x2 + (y1 !== y2 ? -w * .15 : 0), y2 - (y1 === y2 ? w * .15 : 0)); g.stroke();
  }
  function drawMaze(g, s, kit) {
    const view = kit.view(), gm = geo(s, view), { cell, x0, y0, w, h } = gm, t = s.time;
    kit.hall(g, 0);
    g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(0, 0, view.width, view.height);
    const wobble = K.warning(s) && !kit.reduced() ? Math.sin(t * 38) * 2.2 : 0;
    // achterwand van het klimrek met netjes
    g.fillStyle = '#fffaf0'; g.beginPath(); g.roundRect(x0 - 16, y0 - 16, w + 32, h + 32, 22); g.fill();
    for (let r = 0; r < s.rows; r++) for (let c = 0; c < s.cols; c++) {
      g.fillStyle = (r + c) % 2 ? '#f3ecff' : '#e9fbf5'; g.fillRect(x0 + c * cell, y0 + r * cell, cell, cell);
    }
    g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip(); g.strokeStyle = 'rgba(120,90,170,.13)'; g.lineWidth = 2;
    for (let k = -h; k < w + h; k += 22) { g.beginPath(); g.moveTo(x0 + k, y0); g.lineTo(x0 + k + h, y0 + h); g.moveTo(x0 + k + h, y0); g.lineTo(x0 + k, y0 + h); g.stroke(); }
    g.restore();
    // uitgang rechtsboven en het begin van de glijbaan
    const ex = x0 + w, ey = y0 + cell * .5, glow = .5 + .5 * Math.sin(t * 4);
    g.fillStyle = `rgba(255,197,49,${.25 + glow * .25})`; g.fillRect(x0 + (s.cols - 1) * cell, y0, cell, cell);
    g.fillStyle = '#ff9a52'; g.beginPath(); g.moveTo(ex, ey - cell * .2); g.quadraticCurveTo(ex + cell * .5, ey, ex + cell * .85, ey + cell * .9); g.lineTo(ex + cell * .62, ey + cell * .98); g.quadraticCurveTo(ex + cell * .35, ey + cell * .25, ex, ey + cell * .2); g.closePath(); g.fill();
    g.fillStyle = '#62488b'; g.font = `bold ${Math.round(cell * .17)}px system-ui`; g.textAlign = 'center'; g.fillText('🛝 Glijbaan', ex + cell * .45, y0 - 22);
    if (x0 > 80) { g.textAlign = 'right'; g.fillText('Start ▶', x0 - 18, y0 + h - cell * .42); } else g.fillText('▲ Start', x0 + cell * .5, y0 + h + 30);
    // muurtjes: gekleurde schuimbalken; bij een verandering trillen ze even
    const bw = Math.max(8, cell * .15);
    g.save(); g.translate(wobble, 0);
    for (let r = 0; r < s.rows; r++) for (let c = 0; c < s.cols; c++) {
      const x = x0 + c * cell, y = y0 + r * cell, col = COLORS[(c * 2 + r) % COLORS.length];
      if (c < s.cols - 1 && !K.isOpen(s, c, r, 'right')) bar(g, x + cell, y, x + cell, y + cell, bw, col);
      if (r < s.rows - 1 && !K.isOpen(s, c, r, 'down')) bar(g, x, y + cell, x + cell, y + cell, bw, COLORS[(c + r * 3 + 1) % COLORS.length]);
    }
    g.restore();
    const pole = '#ffc531';
    bar(g, x0, y0, x0 + w, y0, bw * 1.2, pole); bar(g, x0, y0 + h, x0 + w, y0 + h, bw * 1.2, pole);
    bar(g, x0, y0, x0, y0 + h, bw * 1.2, pole); bar(g, x0 + w, y0 + cell, x0 + w, y0 + h, bw * 1.2, pole);
    for (let r = 0; r <= s.rows; r++) for (let c = 0; c <= s.cols; c++) { g.fillStyle = '#ffd96a'; g.beginPath(); g.arc(x0 + c * cell + wobble, y0 + r * cell, bw * .55, 0, 7); g.fill(); }
    // letters als schuimblokjes
    s.letters.forEach((l, i) => {
      if (l.got) return;
      const size = cell * .46, bob = kit.reduced() ? 0 : Math.sin(t * 3 + i) * cell * .04;
      const cx = x0 + (l.c + .5) * cell, cy = y0 + (l.r + .5) * cell + bob;
      g.fillStyle = shade(COLORS[i % COLORS.length]); g.beginPath(); g.roundRect(cx - size / 2, cy - size / 2 + 4, size, size, size * .22); g.fill();
      g.fillStyle = COLORS[i % COLORS.length]; g.beginPath(); g.roundRect(cx - size / 2, cy - size / 2, size, size, size * .22); g.fill();
      g.fillStyle = '#fff'; g.font = `900 ${Math.round(size * .66)}px system-ui`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(l.ch, cx, cy + 1); g.textBaseline = 'alphabetic';
    });
    // de speler: klimt van vakje naar vakje
    const p = playerCell(s, gm), lift = Math.sin(Math.PI * p.t) * cell * .14;
    kit.drawDoll(g, p.x, p.y + cell * .4 - lift, 0, { zoom: cell * .78 / kit.DOLL_H, shadowY: p.y + cell * .4 });
    // code-balk bovenin
    const slots = s.letters.length, sw = 38, bx = view.width / 2 - (slots * (sw + 8)) / 2 - 40;
    g.fillStyle = 'rgba(255,255,255,.94)'; g.beginPath(); g.roundRect(bx - 12, 12, slots * (sw + 8) + 104, 50, 18); g.fill();
    g.fillStyle = '#62488b'; g.font = 'bold 15px system-ui'; g.textAlign = 'left'; g.fillText('Code', bx, 43);
    for (let i = 0; i < slots; i++) {
      const x = bx + 50 + i * (sw + 8);
      g.fillStyle = s.order[i] ? COLORS[s.letters.findIndex(l => l.ch === s.order[i]) % COLORS.length] : '#ece6f5';
      g.beginPath(); g.roundRect(x, 19, sw, 36, 9); g.fill();
      if (s.order[i]) { g.fillStyle = '#fff'; g.font = '900 22px system-ui'; g.textAlign = 'center'; g.fillText(s.order[i], x + sw / 2, 45); }
    }
    if (s.mode === 'klein') { g.font = '26px system-ui'; g.textAlign = 'left'; g.fillText(HINTS[s.word] || '', bx + 54 + slots * (sw + 8), 46); }
    kit.countdown(g);
  }
  function drawSlide(g, s, kit) {
    const view = kit.view(), sl = s.slide, len = sl.length, px = view.width * .3, py = view.height * .5, t = s.time;
    const hP = K.height(sl.x, len), X = x => px + (x - sl.x), Y = (x, up = 0) => py - (K.height(x, len) - hP) - up;
    g.save(); g.translate(0, Math.min(0, (hP - K.SLIDE.drop) * .25)); kit.hall(g, sl.x * .35); g.restore();
    // steunpalen en de glijbaan zelf
    const x1 = sl.x - px - 40, x2 = sl.x + view.width - px + 40;
    g.strokeStyle = '#ffc531'; g.lineWidth = 10;
    for (let x = Math.floor(x1 / 420) * 420; x < Math.min(x2, len); x += 420) if (x > 0) { g.beginPath(); g.moveTo(X(x), Y(x) + 18); g.lineTo(X(x), view.height + 10); g.stroke(); }
    g.beginPath();
    for (let x = Math.max(0, x1); x <= Math.min(len, x2); x += 8) g.lineTo(X(x), Y(x));
    for (let x = Math.min(len, x2); x >= Math.max(0, x1); x -= 8) g.lineTo(X(x), Y(x) + 26);
    g.closePath(); g.fillStyle = '#ff9a52'; g.fill();
    g.strokeStyle = '#ffd08a'; g.lineWidth = 5; g.beginPath();
    for (let x = Math.max(0, x1); x <= Math.min(len, x2); x += 8) g.lineTo(X(x), Y(x) + 1);
    g.stroke();
    g.beginPath();                                                       // zijkant van de glijbaan, half doorzichtig
    for (let x = Math.max(0, x1); x <= Math.min(len, x2); x += 8) g.lineTo(X(x), Y(x) - 14);
    for (let x = Math.min(len, x2); x >= Math.max(0, x1); x -= 8) g.lineTo(X(x), Y(x));
    g.closePath(); g.fillStyle = 'rgba(255,154,82,.35)'; g.fill();
    // beneden wacht de ballenbak
    const ex = X(len), ey = Y(len) + 30;
    if (ex < view.width + 300) {
      g.fillStyle = '#5aaeff'; g.beginPath(); g.roundRect(ex - 20, ey - 10, 300, view.height, 18); g.fill();
      for (let i = 0; i < 40; i++) ball(g, ex + (i * 37 % 270), ey + 4 + (i * 13 % 26), 11, COLORS[i % COLORS.length]);
    }
    for (const st of sl.stars) if (!st.got) { const x = X(st.x); if (x > -40 && x < view.width + 40) kit.sprite(g, 'ster', x, Y(st.x, st.z + 26), 34); }
    // jongetjes die naar boven klimmen (of wegvliegen)
    for (const b of sl.boys) {
      const doll = boyDolls[b.look]; if (!doll) continue;
      const bx = X(b.x); if (bx < -160 || bx > view.width + 160) continue;
      const ang = Math.atan(-K.slope(b.x, len));
      g.save();
      if (b.fly) {
        const ft = b.fly.t; if (ft > 1.6) { g.restore(); continue; }
        g.globalAlpha = Math.max(0, 1 - ft / 1.6);
        g.translate(bx + b.fly.dir * 40 + 260 * ft, Y(b.x) - 420 * ft + 520 * ft * ft); g.rotate(ft * 9 * b.fly.dir);
        g.drawImage(doll, -46, -100, 92, 113);
      } else {
        const climb = kit.reduced() ? 0 : Math.sin(t * 9 + b.x) * .12;
        g.translate(bx, Y(b.x) + 4); g.rotate(ang - .5 + climb);
        g.drawImage(doll, -46, -110, 92, 113);
      }
      g.restore();
    }
    // de speler glijdt op de golven
    const ang = Math.atan(-K.slope(sl.x, len));
    kit.drawDoll(g, px, Y(sl.x, sl.z) + 6, sl.z, { zoom: 1.15, tilt: ang - .42, shadowY: Y(sl.x) + 4 });
    if (s.noticeTime > 0 && s.notice.startsWith('Boem')) { g.font = 'bold 26px system-ui'; g.textAlign = 'center'; g.fillStyle = '#e8467c'; g.fillText('BOEM!', px + 40, Y(sl.x) - 150); }
    kit.countdown(g);
  }

  /* ================================================================ Ballenbak-mikken */
  const PB = { far: .24, near: .95, k: 1.5, back: 1.3 };
  const sc = d => 1 / (1 + PB.k * d);
  const fz = d => (1 - sc(d)) / (1 - sc(PB.back));
  const half = view => Math.max(view.width * .62, view.height * .75);   // staand op de telefoon: doelen groter
  const proj = (view, x, d) => ({ x: view.width / 2 + x * half(view) * sc(d), y: view.height * PB.near - view.height * (PB.near - PB.far) * fz(d), s: sc(d) });
  function unproj(view, sx, sy) {
    const f = (view.height * PB.near - sy) / (view.height * (PB.near - PB.far)), q = 1 - f * (1 - sc(PB.back));
    const d = q <= .15 ? 3 : Math.max(0, (1 / q - 1) / PB.k);
    return { x: (sx - view.width / 2) / (half(view) * sc(d)), d };
  }
  const hand = view => ({ x: view.width / 2, y: view.height * .93 });
  let parentDoll = null, field = [], drag = null, aim = { x: 0, d: B.BB.bak.d, shown: false };
  // veeg -> waar de bal naartoe gaat: de richting van de veeg, en een snelle veeg gaat verder
  function target(view, start, end, speed) {
    const gain = Math.min(2.4, Math.max(.9, .9 + speed / 1800));
    return { x: start.x + (end.x - start.x) * gain, y: start.y + (end.y - start.y) * gain };
  }
  const ballenbak = {
    minWidth: 640, canvasClass: 'tramp', moveKeys: dirKeys,
    label: 'Ballenbak-mikken. Veeg omhoog om te gooien, of mik met de pijltjes en gooi met spatie.',
    create(seed, opts, profile) {
      const who = opts.parent === 'mama' ? MAMA : { ...PAPA, outfit: profile?.parkour?.dadOutfit || PAPA.outfit };
      parentDoll = Avatar.compose(who.look, who.outfit);
      let r = seed; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
      field = Array.from({ length: 900 }, (_, i) => ({ x: rnd() * 3.2 - 1.6, d: rnd() * PB.back, c: COLORS[i % COLORS.length] })).sort((a, b) => b.d - a.d);
      layers = null;
      drag = null; aim = { x: 0, d: B.BB.bak.d, shown: false };
      return B.create(seed, opts.parent);
    },
    controls: () => `<button class="btn mint" id="st-jump" type="button">Gooi 🎯 <small>spatie</small></button>`,
    press(s) { aim.shown = true; return B.throwBall(s, aim.x, aim.d); },
    input(keys) { return { left: keys.has('left'), right: keys.has('right'), up: keys.has('up'), down: keys.has('down') }; },
    step(s, dt, input) {
      if (input.left || input.right || input.up || input.down) aim.shown = true;
      aim.x = Math.max(-1.2, Math.min(1.2, aim.x + ((input.right ? 1 : 0) - (input.left ? 1 : 0)) * 1.1 * dt));
      aim.d = Math.max(.1, Math.min(1.25, aim.d + ((input.up ? 1 : 0) - (input.down ? 1 : 0)) * .8 * dt));
      B.step(s, dt);
    },
    keyDown(s, key, repeat) {
      if ([' ', 'Enter'].includes(key)) { if (!repeat) ballenbak.press(s); return true; }
      return !!dirKeys[key];
    },
    bind(canvas, signal, kit) {
      canvas.addEventListener('pointerdown', e => {
        if (kit.paused()) return;
        e.preventDefault(); canvas.setPointerCapture?.(e.pointerId);
        const p = kit.point(e); drag = { start: p, now: p, trail: [{ ...p, t: performance.now() }] };
      }, { signal });
      canvas.addEventListener('pointermove', e => {
        if (!drag) return;
        const p = kit.point(e); drag.now = p; drag.trail.push({ ...p, t: performance.now() });
        drag.trail = drag.trail.filter(q => performance.now() - q.t < 120);
      }, { signal });
      const release = e => {
        const s = kit.state(); if (!drag || !s) { drag = null; return; }
        // vaart van het laatste stukje van de veeg: wie stilhoudt voor het loslaten, gooit precies tot de vinger
        const end = kit.point(e), dy = end.y - drag.start.y, now = performance.now(), recent = drag.trail.filter(q => now - q.t < 120);
        const first = recent[0], speed = first ? Math.hypot(end.x - first.x, end.y - first.y) / Math.max(.016, (now - first.t) / 1000) : 0;
        if (dy < -30 && !kit.paused()) {
          const T = target(kit.view(), drag.start, end, speed), w = unproj(kit.view(), T.x, T.y);
          aim.shown = false; B.throwBall(s, w.x, w.d);
        }
        drag = null;
      };
      canvas.addEventListener('pointerup', release, { signal });
      canvas.addEventListener('pointercancel', () => { drag = null; }, { signal });
    },
    sound: e => ({ gooi: 'klik', bak: 'ster', hoofd: 'pop', mis: 'fout', regen: 'fout' }[e]),
    hud(s) {
      return { main: `${Math.max(0, Math.ceil(B.BB.duration - s.time))} s`, mainLabel: 'Tijd', stars: `🎯 ${s.score} ${s.score === 1 ? 'punt' : 'punten'}`,
        progress: `Raak ${s.hits}/${s.throws}`,
        message: s.countdown > 0 ? `Start over ${Math.ceil(s.countdown)}…` : s.rain > 0 ? `Ballenregen! Nog ${Math.ceil(s.rain)} s wachten…`
          : s.noticeTime > 0 ? s.notice : `Veeg omhoog naar de bak (1 punt) of ${s.parent === 'mama' ? 'mama' : 'papa'}s hoofd (2 punten)!`,
        jump: true, jumpDisabled: !B.canThrow(s) };
    },
    ui() {},
    result(s) {
      return { stars: B.starsFor(s), best: s.score, counts: true,
        detail: `${s.score} ${s.score === 1 ? 'punt' : 'punten'} · ${s.hits} van de ${s.throws} raak · ${s.heads}× op het hoofd${s.rains ? ` · ${s.rains}× ballenregen` : ''}`,
        tip: 'Tip: veeg rustig in de richting van de bak. Een snelle veeg gaat verder, dus voor het hoofd veeg je iets harder.' };
    },
    draw: drawPit,
  };
  // Het ballenveld ligt stil: het wordt één keer per schermmaat in drie lagen getekend
  // (achter papa/mama, tussen papa/mama en de bak, en vooraan) en daarna alleen nog geplakt.
  let layers = null;
  function pitLayers(view, scale, kit) {
    const key = `${view.width}x${view.height}x${scale}x${field.length}x${kit.img('hal.jpg').ok}x${art(kit, 'ballenbak.jpg').ok}`;
    if (layers?.key === key) return layers;
    const W = view.width, H = view.height, make = () => { const c = document.createElement('canvas'); c.width = Math.ceil(W * scale); c.height = Math.ceil(H * scale); const g = c.getContext('2d'); g.scale(scale, scale); return [c, g]; };
    const [back, gb] = make(), [mid, gm] = make(), [near, gn] = make();
    // achterwand: de speelhal (of een eigen plaatje); de vloer valt samen met de achterkant van de bak
    gb.fillStyle = '#ecfefe'; gb.fillRect(0, 0, W, H);
    const edge = proj(view, 0, PB.back).y, bg = art(kit, 'ballenbak.jpg'), hal = kit.img('hal.jpg');
    if (bg.ok) { const k = Math.max(W / bg.width, (edge + 12) / bg.height), bw = bg.width * k, bh = bg.height * k; gb.drawImage(bg, (W - bw) / 2, edge + 12 - bh, bw, bh); }
    else if (hal.ok) { const hw = Math.max(W, (edge + 40) * 2), hh = hw / 2; gb.drawImage(hal, (W - hw) / 2, edge + 40 - hh * .9, hw, hh); }
    const pts = [proj(view, -1.6, 0), proj(view, -1.6, PB.back), proj(view, 1.6, PB.back), proj(view, 1.6, 0)];
    gb.fillStyle = '#c9bbff'; gb.beginPath(); gb.moveTo(pts[0].x, H + 20); pts.forEach(p => gb.lineTo(p.x, p.y)); gb.lineTo(pts[3].x, H + 20); gb.closePath(); gb.fill();
    gb.fillStyle = '#5aaeff'; gb.beginPath(); gb.roundRect(pts[1].x - 8, pts[1].y - 16, pts[2].x - pts[1].x + 16, 22, 10); gb.fill();
    const split1 = B.BB.head.d - .07, split2 = B.BB.bak.d - .03;
    for (const b of field) {
      const p = proj(view, b.x, b.d); if (p.x < -30 || p.x > W + 30) continue;
      ball(b.d >= split1 ? gb : b.d >= split2 ? gm : gn, p.x, p.y, pitBall(view, b.d), b.c);
    }
    layers = { key, back, mid, near };
    return layers;
  }
  const pitBall = (view, d) => .034 * half(view) * sc(d);
  function drawPit(g, s, kit) {
    const view = kit.view(), W = view.width, H = view.height, t = s.time, L = pitLayers(view, g.getTransform().a, kit);
    g.drawImage(L.back, 0, 0, W, H);
    // papa of mama zit tot de borst in de ballen; het hoofd is het doel
    const hx = B.headX(s), head = proj(view, hx, B.BB.head.d);
    const dw = 2 * B.BB.head.rx * half(view) * head.s / .34, dh = dw * 490 / 400, chest = head.y + dh * .2;
    if (parentDoll) {
      g.save(); g.beginPath(); g.rect(0, 0, W, chest); g.clip(); g.translate(head.x, head.y);
      if (s.ouch > 0 && !kit.reduced()) g.rotate(Math.sin(s.ouch * 30) * .12 * s.ouch);
      g.drawImage(parentDoll, -dw / 2, -dh * .42, dw, dh); g.restore();
    }
    const r = pitBall(view, B.BB.head.d) * 1.15;
    for (let i = 0; i < 14; i++) { const a = i / 13 - .5; ball(g, head.x + a * dw * .7, chest - r * .4 + (i % 2) * r * .7, r, COLORS[(i * 5) % 6]); }
    if (s.ouch > 0) { g.font = 'bold 22px system-ui'; g.textAlign = 'center'; g.fillStyle = '#fff'; g.beginPath(); g.roundRect(head.x + dw * .25, head.y - dh * .32, 54, 32, 12); g.fill(); g.fillStyle = '#e8467c'; g.fillText('Au!', head.x + dw * .25 + 27, head.y - dh * .32 + 23); }
    g.drawImage(L.mid, 0, 0, W, H);
    // de doelbak drijft heen en weer
    const bp = proj(view, B.bakX(s), B.BB.bak.d), bw = 2 * B.BB.bak.halfX * half(view) * bp.s * 1.12, bh = bw * .42;
    const sprite = art(kit, 'doelbak.png');
    if (sprite.ok) g.drawImage(sprite, bp.x - bw * .6, bp.y - bh * .95, bw * 1.2, bw * 1.2 * sprite.height / sprite.width);
    else {
      g.fillStyle = '#c94d86'; g.beginPath(); g.ellipse(bp.x, bp.y - bh * .35, bw / 2, bh * .32, 0, 0, 7); g.fill();
      for (let i = 0; i < 14; i++) ball(g, bp.x + ((i * 37 % 100) / 100 - .5) * bw * .75, bp.y - bh * .4 + (i % 3) * 3, bw * .06, COLORS[i % 6]);
      g.fillStyle = '#ff6fae'; g.beginPath(); g.moveTo(bp.x - bw / 2, bp.y - bh * .35); g.ellipse(bp.x, bp.y - bh * .35, bw / 2, bh * .32, 0, Math.PI, 0, true);
      g.lineTo(bp.x + bw * .44, bp.y + bh * .4); g.quadraticCurveTo(bp.x, bp.y + bh * .62, bp.x - bw * .44, bp.y + bh * .4); g.closePath(); g.fill();
      g.strokeStyle = '#ffd1e6'; g.lineWidth = Math.max(3, bw * .05); g.beginPath(); g.ellipse(bp.x, bp.y - bh * .35, bw / 2, bh * .32, 0, 0, 7); g.stroke();
      g.fillStyle = '#fff'; g.font = `bold ${Math.round(bw * .16)}px system-ui`; g.textAlign = 'center'; g.fillText('+1', bp.x, bp.y + bh * .22);
    }
    g.drawImage(L.near, 0, 0, W, H);
    // gegooide ballen die liggen, en de punten die erbij komen
    for (const l of s.landed) {
      if (l.age > 2.2) continue;
      const p = proj(view, l.x, Math.min(l.d, PB.back));
      if (l.hit === 'mis') { g.globalAlpha = Math.max(0, 1 - l.age / 2.2); ball(g, p.x, p.y - 4, pitBall(view, l.d) * 1.4, '#ffffff'); g.globalAlpha = 1; continue; }
      if (l.age < 1) { g.globalAlpha = 1 - l.age; g.font = 'bold 26px system-ui'; g.textAlign = 'center'; g.fillStyle = l.hit === 'head' ? '#e8467c' : '#e49b00'; g.fillText(l.hit === 'head' ? 'Bonk! +2' : '+1', p.x, p.y - 30 - l.age * 50); g.globalAlpha = 1; }
    }
    // ballen in de lucht: van je hand naar het mikpunt, met een boogje
    const from = hand(view);
    for (const b of s.balls) {
      const k = b.t / b.dur, end = proj(view, b.x, Math.min(b.d, PB.back + .1));
      ball(g, lerp(from.x, end.x, k), lerp(from.y, end.y, k) - Math.sin(Math.PI * k) * (110 + 90 * Math.min(b.d, 1.3)), lerp(30, pitBall(view, b.d) * 1.5, k), '#ff6fae');
    }
    // mikken: een stippellijn tijdens het vegen, of het kruisje van de pijltjes
    if (drag && drag.now.y < drag.start.y - 10) {
      const now = performance.now(), first = drag.trail.find(q => now - q.t < 120);
      const T = target(view, drag.start, drag.now, first ? Math.hypot(drag.now.x - first.x, drag.now.y - first.y) / Math.max(.016, (now - first.t) / 1000) : 0);
      g.setLineDash([6, 10]); g.strokeStyle = 'rgba(98,72,139,.6)'; g.lineWidth = 4; g.beginPath(); g.moveTo(from.x, from.y); g.lineTo(T.x, T.y); g.stroke(); g.setLineDash([]);
      g.strokeStyle = '#62488b'; g.lineWidth = 3; g.beginPath(); g.arc(T.x, T.y, 14, 0, 7); g.stroke();
    } else if (aim.shown) {
      const a = proj(view, aim.x, aim.d);
      g.strokeStyle = '#62488b'; g.lineWidth = 3; g.beginPath(); g.arc(a.x, a.y, 16, 0, 7); g.moveTo(a.x - 24, a.y); g.lineTo(a.x + 24, a.y); g.moveTo(a.x, a.y - 24); g.lineTo(a.x, a.y + 24); g.stroke();
    }
    // de bal in je hand
    if (drag) ball(g, drag.now.x, drag.now.y, 30, '#ff6fae');
    else if (B.canThrow(s)) ball(g, from.x, from.y + (kit.reduced() ? 0 : Math.sin(t * 5) * 3), 30, '#ff6fae');
    // ballenregen: drie seconden lang regent het ballen
    if (s.rain > 0) {
      g.fillStyle = 'rgba(64,48,90,.18)'; g.fillRect(0, 0, W, H);
      const fall = B.BB.rain - s.rain;
      for (let i = 0; i < 70; i++) { const x = (i * 137) % W, y = ((fall * 520 + i * 61) % (H + 120)) - 60; ball(g, x, y, 14 + (i % 4) * 3, COLORS[i % 6]); }
      g.fillStyle = '#fff'; g.font = 'bold 34px system-ui'; g.textAlign = 'center'; g.fillText(`Ballenregen! ${Math.ceil(s.rain)}`, W / 2, H * .45);
    }
    kit.countdown(g);
  }

  return { games, adapters: { klimrek, ballenbak }, HINTS, _proj: { proj, unproj, target } };
})();

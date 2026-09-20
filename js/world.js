/* ============================================================
   Catwalk Sterren — het dorp (de wereld)

   Je poppetje loopt over de dorpskaart (assets/village.jpg) naar een
   van de vier huisjes: Modehuis (kleedkamer), Sterrenwinkel, Kleurenhuis
   (kleurenpuzzel) en Duelhuis. Lopen kan met de pijltjes/WASD, met de
   loopknoppen, door op het pad te tikken of door een huisje te kiezen.

   Het loopraster (DOLL_MANIFEST.world) komt uit de padkleur van de kaart;
   de route naar een huisje wordt met BFS over dat raster gezocht.

   World.show(profile, callbacks) / World.hide()
   ============================================================ */

const World = (() => {
  const W = DOLL_MANIFEST.world;
  const GW = W.w, GH = W.h;
  const walk = W.rows.map(r => r.split('').map(c => c === '1'));
  const $ = s => document.querySelector(s);

  const HOUSES = [
    { id: 'kleedkamer', icon: '👗', name: 'Modehuis', sub: 'Opdrachten & kleedkamer' },
    { id: 'winkel',     icon: '🛍️', name: 'Sterrenwinkel', sub: 'Nieuwe spullen kopen' },
    { id: 'puzzel',     icon: '🎨', name: 'Kleurenhuis', sub: 'Kleuratelier' },
    { id: 'duel',       icon: '⚔️', name: 'Duelhuis', sub: 'Samen spelen' },
  ].map(h => Object.assign(h, W.doors[h.id]));

  const cellOf = p => ({ x: Math.floor(p.x / 100 * GW), y: Math.floor(p.y / 100 * GH) });
  const walkable = (gx, gy) => gy >= 0 && gy < GH && gx >= 0 && gx < GW && walk[gy][gx];
  const walkableAt = p => { const c = cellOf(p); return walkable(c.x, c.y); };
  const center = c => ({ x: (c.x + 0.5) / GW * 100, y: (c.y + 0.5) / GH * 100 });
  // dichtstbijzijnde loopbare cel (ringen rondom)
  function nearest(c) {
    if (walkable(c.x, c.y)) return c;
    for (let r = 1; r < 30; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      if (walkable(c.x + dx, c.y + dy)) return { x: c.x + dx, y: c.y + dy };
    }
    return c;
  }
  // kortste route over het raster (breedte-eerst)
  function route(from, to) {
    const a = nearest(cellOf(from)), b = nearest(cellOf(to));
    const key = c => c.y * GW + c.x;
    const prev = new Map([[key(a), null]]); const q = [a];
    while (q.length) {
      const c = q.shift();
      if (c.x === b.x && c.y === b.y) break;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = { x: c.x + dx, y: c.y + dy };
        if (!walkable(n.x, n.y) || prev.has(key(n))) continue;
        prev.set(key(n), c); q.push(n);
      }
    }
    if (!prev.has(key(b))) return [];
    const path = []; for (let c = b; c; c = prev.get(key(c))) path.unshift(center(c));
    // hoekpunten overhouden: tussenliggende cellen op een rechte lijn weglaten
    const out = [];
    for (let i = 0; i < path.length; i++) {
      if (i === 0 || i === path.length - 1) { out.push(path[i]); continue; }
      const p = path[i - 1], c = path[i], n = path[i + 1];
      if (Math.sign(c.x - p.x) !== Math.sign(n.x - c.x) || Math.sign(c.y - p.y) !== Math.sign(n.y - c.y)) out.push(c);
    }
    out.push({ x: to.x, y: to.y });
    return out;
  }
  const dist = (a, b) => Math.hypot(a.x - b.x, (a.y - b.y) * 2 / 3);   // de kaart is 3:2, dus y telt 'korter'

  /* ---------- toestand ---------- */
  let P = null, cb = {}, frame = 0, last = 0;
  let pos = { x: 52, y: 40 }, facing = 1, walking = false, path = [], goal = null, overview = false;
  const keys = new Set();
  let els = {};

  function show(profile, callbacks) {
    P = profile; cb = callbacks || {};
    if (profile.worldPos && walkableAt(profile.worldPos)) pos = { ...profile.worldPos };
    else pos = center(nearest(cellOf({ x: 52, y: 40 })));
    path = []; goal = null; keys.clear();
    build();
    document.body.classList.add('in-world');
    last = performance.now();
    cancelAnimationFrame(frame); frame = requestAnimationFrame(tick);
    window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKeyUp); window.addEventListener('blur', clearKeys);
    layout();
  }
  function hide() {
    cancelAnimationFrame(frame); frame = 0;
    window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp); window.removeEventListener('blur', clearKeys);
    document.body.classList.remove('in-world');
    if (P) { P.worldPos = { x: pos.x, y: pos.y }; if (cb.save) cb.save(); }
  }
  const clearKeys = () => keys.clear();

  function build() {
    const root = $('#world');
    root.innerHTML = `
      <div class="village-viewport" id="village-viewport">
        <div class="village-hud">
          <div><small>CATWALK STERREN</small><strong id="village-region">Het dorp</strong></div>
          <button class="btn ghost sm" id="village-overview" type="button">🗺️ Hele dorp</button>
        </div>
        <div class="village-plane" id="village-plane">
          <img class="village-art" src="assets/village.jpg" alt="Het dorp van Catwalk Sterren met vier huisjes rond een bloemenplein" draggable="false">
          ${HOUSES.map(h => `<button class="village-door" data-house="${h.id}" type="button" style="left:${h.x}%;top:${h.y - 1}%" aria-label="Loop naar het ${h.name}"><span>${h.icon}</span><span>${h.name}<small>${h.sub}</small></span></button>`).join('')}
          <div class="village-avatar" id="village-avatar"><div class="avatar-name">${esc(P.name)}</div><div class="avatar-turn" id="village-turn"><canvas width="400" height="490"></canvas></div></div>
        </div>
        <div class="village-status" id="village-status">Tik op een pad of kies een huisje</div>
      </div>
      <div class="world-bottom">
        <div class="world-controls" aria-label="Loopknoppen">
          ${[['ArrowLeft', '←', 'Links'], ['ArrowUp', '↑', 'Omhoog'], ['ArrowDown', '↓', 'Omlaag'], ['ArrowRight', '→', 'Rechts']].map(([k, ic, l]) => `<button class="walk-key" data-key="${k}" type="button" aria-label="${l}">${ic}</button>`).join('')}
        </div>
        <div class="world-action" id="world-action"><p>Loop naar de deur van een huisje ✨</p></div>
        <span class="keyboard-hint">Pijltjes of WASD om te lopen<br>Enter om naar binnen te gaan</span>
      </div>
      <nav class="village-destinations" aria-label="Kies een huisje">
        ${HOUSES.map(h => `<button class="destination-button" data-house="${h.id}" type="button"><span>${h.icon}</span><span>${h.name}<small>Loop hierheen</small></span></button>`).join('')}
      </nav>`;
    els = { viewport: $('#village-viewport'), plane: $('#village-plane'), avatar: $('#village-avatar'), turn: $('#village-turn'), status: $('#village-status'), action: $('#world-action'), region: $('#village-region') };
    drawDoll();
    root.querySelectorAll('[data-house]').forEach(b => { b.onclick = () => { Sound.play('klik'); goTo(b.dataset.house); if (b.classList.contains('destination-button')) { overview = false; layout(); } }; });
    $('#village-overview').onclick = () => { overview = !overview; $('#village-overview').textContent = overview ? '👣 Verder wandelen' : '🗺️ Hele dorp'; layout(); };
    els.plane.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return;
      const r = els.plane.getBoundingClientRect();
      go({ x: (e.clientX - r.left) / r.width * 100, y: (e.clientY - r.top) / r.height * 100 }, null);
    });
    root.querySelectorAll('.walk-key').forEach(b => {
      const k = b.dataset.key;
      b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture(e.pointerId); path = []; goal = null; keys.add(k); });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, () => keys.delete(k)));
    });
    window.addEventListener('resize', layout);
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function drawDoll() {
    const cv = els.turn.querySelector('canvas'), g = cv.getContext('2d');
    const paint = () => { g.clearRect(0, 0, cv.width, cv.height); g.drawImage(Avatar.compose(P.look, P.outfit), 0, 0); };
    if (Avatar.isReady()) paint(); else { const t = setInterval(() => { if (Avatar.isReady()) { clearInterval(t); paint(); } }, 100); }
  }

  function goTo(id) {
    const h = HOUSES.find(x => x.id === id);
    if (dist(pos, h) < 2.2) { enter(id); return; }
    go(h, id);
  }
  function go(p, id) { keys.clear(); path = route(pos, p); goal = id; if (!path.length) { path = [center(nearest(cellOf(p)))]; } }
  function enter(id) { if (cb.enter) { Sound.play('pop'); cb.enter(id); } }
  const nearby = () => HOUSES.find(h => dist(pos, h) < 3);

  function onKey(e) {
    if (e.target.closest && e.target.closest('input,textarea,select')) return;
    if (!$('#overlay').hidden) return;
    const k = e.key.toLowerCase();
    const map = { arrowleft: 'ArrowLeft', a: 'ArrowLeft', arrowright: 'ArrowRight', d: 'ArrowRight', arrowup: 'ArrowUp', w: 'ArrowUp', arrowdown: 'ArrowDown', s: 'ArrowDown' };
    if (map[k]) { e.preventDefault(); keys.add(map[k]); path = []; goal = null; }
    if ((k === 'enter' || k === 'e') && !e.repeat) { const h = nearby(); if (h) { e.preventDefault(); enter(h.id); } }
  }
  function onKeyUp(e) {
    const k = e.key.toLowerCase();
    const map = { arrowleft: 'ArrowLeft', a: 'ArrowLeft', arrowright: 'ArrowRight', d: 'ArrowRight', arrowup: 'ArrowUp', w: 'ArrowUp', arrowdown: 'ArrowDown', s: 'ArrowDown' };
    if (map[k]) keys.delete(map[k]);
  }

  function tick(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    let next = pos;
    const dx = (keys.has('ArrowRight') ? 1 : 0) - (keys.has('ArrowLeft') ? 1 : 0), dy = (keys.has('ArrowDown') ? 1 : 0) - (keys.has('ArrowUp') ? 1 : 0);
    if (dx || dy) {
      const l = Math.hypot(dx, dy), sp = 11;
      const cand = { x: pos.x + dx / l * dt * sp, y: pos.y + dy / l * dt * sp * 1.5 };
      if (walkableAt(cand)) next = cand;
      else if (walkableAt({ x: cand.x, y: pos.y })) next = { x: cand.x, y: pos.y };
      else if (walkableAt({ x: pos.x, y: cand.y })) next = { x: pos.x, y: cand.y };
    } else if (path.length) {
      const t = path[0], d = dist(pos, t), step = dt * 11;
      if (d <= step) { next = { ...t }; path.shift(); if (!path.length && goal) { const id = goal; goal = null; setTimeout(() => enter(id), 120); } }
      else next = { x: pos.x + (t.x - pos.x) / d * step, y: pos.y + (t.y - pos.y) / d * step };
    }
    const moving = dist(pos, next) > 0.001;
    if (moving) { if (Math.abs(next.x - pos.x) > 0.005) facing = next.x > pos.x ? 1 : -1; pos = next; }
    if (moving !== walking) { walking = moving; els.avatar.classList.toggle('walking', walking); }
    if (moving || !tick.did) {
      els.avatar.style.left = pos.x + '%'; els.avatar.style.top = pos.y + '%';
      els.turn.style.transform = `scaleX(${facing})`;
      layout(true); updateHud(); tick.did = true;
    }
    frame = requestAnimationFrame(tick);
  }
  function updateHud() {
    const h = nearby();
    document.querySelectorAll('.village-door').forEach(b => b.classList.toggle('nearby', !!h && b.dataset.house === h.id));
    els.action.innerHTML = h ? `<button class="btn big" id="world-enter" type="button">${h.icon} Naar binnen · ${h.name} <small>↵</small></button>` : '<p>Loop naar de deur van een huisje ✨</p>';
    if (h) $('#world-enter').onclick = () => enter(h.id);
    els.status.textContent = goal && walking ? `👣 Onderweg naar het ${HOUSES.find(x => x.id === goal).name.toLowerCase()}` : h ? `Je staat bij het ${h.name.toLowerCase()}` : 'Tik op een pad of kies een huisje';
    els.region.textContent = overview ? 'Het hele dorp' : h ? h.name : pos.y < 36 ? 'Bij de huisjes' : pos.y > 62 ? 'Achter in het dorp' : 'Het bloemenplein';
  }
  // camera: de kaart is groter dan het venster en volgt het poppetje; in overzicht past alles in beeld
  function layout(quiet) {
    if (!els.viewport) return;
    const vw = els.viewport.clientWidth, vh = els.viewport.clientHeight;
    const sw = overview ? Math.min(vw, vh * 1.5) : Math.max(vw * 1.9, vh * 1.5 * 1.6), sh = sw / 1.5;
    const cx = sw <= vw ? (vw - sw) / 2 : Math.max(vw - sw, Math.min(0, vw / 2 - pos.x / 100 * sw));
    const cy = sh <= vh ? (vh - sh) / 2 : Math.max(vh - sh, Math.min(0, vh / 2 - pos.y / 100 * sh));
    els.plane.style.width = sw + 'px'; els.plane.style.height = sh + 'px';
    els.plane.style.transform = `translate(${cx}px,${cy}px)`;
    els.viewport.classList.toggle('overview', overview);
    if (!quiet) updateHud();
  }

  // _tick is een testhaakje: hiermee kun je het lopen stap voor stap simuleren zonder requestAnimationFrame
  return { show, hide, HOUSES, _tick: tick };
})();

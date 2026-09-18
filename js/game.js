/* ============================================================
   Catwalk Sterren — spellogica en schermen
   ============================================================ */
(() => {
  const SAVE_KEY = 'catwalk-sterren-v1';
  const $ = s => document.querySelector(s);
  const h = (tag, attrs = {}, html = '') => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) { if (k === 'class') e.className = v; else e.setAttribute(k, v); }
    if (html) e.innerHTML = html;
    return e;
  };
  const rand = arr => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const today = () => new Date().toISOString().slice(0, 10);
  const wait = ms => new Promise(r => setTimeout(r, ms));

  let DB = { profiles: [] };
  let P = null;                                   // actieve speler
  const ui = { tab: 'dress', free: false, temp: null, editMode: false, duel: null };

  const TIPS = {
    thema: 'Kijk naar de stickers bij de opdracht en kies kleding met dezelfde stickers.',
    kleur: 'Kies één of twee kleuren die goed samengaan. Wit, zwart, goud en zilver passen overal bij.',
    compleet: 'Een outfit is compleet met een top én een broek of rok (of een jurk) én schoenen.',
    glamour: 'Is de opdracht chic? Kies glitter en jurken. Sportief of casual? Houd het simpel.',
    accessoires: 'Voeg een hoedje, bril, ketting, tas of iets in je hand toe.',
  };

  /* ---------- opslag ---------- */
  function load() {
    try { const raw = localStorage.getItem(SAVE_KEY); if (raw) { const d = JSON.parse(raw); if (d && Array.isArray(d.profiles)) DB = d; } } catch (e) { /* geen opslag beschikbaar */ }
    DB.profiles.forEach(migrate);
  }
  // oude spelers meenemen naar de nieuwe versie
  function migrate(p) {
    p.look = p.look || {};
    if (!FACE_SHAPES.some(f => f.id === p.look.face)) p.look.face = 'ovaal';
    if (typeof p.look.build !== 'number') p.look.build = 40;
    if (!HAIR_COLORS.some(c => c.id === p.look.hairColor)) p.look.hairColor = 'bruin';
    p.outfit = p.outfit || {};
    delete p.outfit.bg;
    for (const slot of Object.keys(p.outfit)) if (!ITEM_BY_ID[p.outfit[slot]]) delete p.outfit[slot];
    if (!p.outfit.hair) p.outfit.hair = 'hair_lang';
    if (!SETTING_BY_ID[p.freeBg]) p.freeBg = 'kamer';
    p.done = p.done || {};
    p.level = levelFromXp(p.xp || 0);
    if (typeof p.coins !== 'number') p.coins = COINS_START;
    // wie al speelde, houdt alles wat toen open stond
    if (!Array.isArray(p.owned)) p.owned = ITEMS.filter(i => i.lvl <= p.level).map(i => i.id);
    p.owned = p.owned.filter(id => ITEM_BY_ID[id]);
    for (const slot of Object.keys(p.outfit)) if (!p.owned.includes(p.outfit[slot])) p.owned.push(p.outfit[slot]);
    p.puzzle = p.puzzle && p.puzzle.day === today() ? p.puzzle : { day: today(), count: 0 };
    p.duels = p.duels || { played: 0, won: 0 };
  }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(DB)); } catch (e) { /* stil doorgaan */ } }

  function levelFromXp(xp) { let l = 1; while (l < MAX_LEVEL && xp >= xpForLevel(l + 1)) l++; return l; }
  const owned = it => P.owned.includes(it.id);
  const itemsOf = slot => ITEMS.filter(i => i.cat === slot && owned(i)).sort((a, b) => a.lvl - b.lvl || a.name.localeCompare(b.name));
  const shopItems = slot => ITEMS.filter(i => i.lvl <= P.level && !owned(i) && (!slot || i.cat === slot)).sort((a, b) => priceOf(a) - priceOf(b) || a.name.localeCompare(b.name));

  function newProfile(name, look, hairStyle) {
    const p = {
      id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name, look,
      outfit: { hair: hairStyle, top: 'top_tshirt_blauw', bottom: 'bot_jeans', shoes: 'sh_sneakers' },
      freeBg: 'kamer', xp: 0, level: 1, done: {}, shows: 0, stars: 0, themeId: null, created: Date.now(),
    };
    migrate(p);
    return p;
  }

  /* ---------- schermen & hulpjes ---------- */
  function showScreen(id) { document.querySelectorAll('.screen').forEach(s => { s.hidden = s.id !== id; }); document.body.dataset.screen = id; window.scrollTo(0, 0); }
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.timer); toast.timer = setTimeout(() => { t.hidden = true; }, 2400); }
  function openOverlay(html, cls = '') { const ov = $('#overlay'); ov.innerHTML = `<div class="modal ${cls}">${html}</div>`; ov.hidden = false; ov.scrollTop = 0; return ov; }
  function closeOverlay() { const ov = $('#overlay'); ov.hidden = true; ov.innerHTML = ''; }
  const modalLocked = () => !!$('#overlay .jury, #overlay .duel-lock');

  function confetti(container, n = 70) {
    const cols = ['#ff5da2', '#7c5cff', '#ffc531', '#3ddcb0', '#5aaeff', '#ff8c42'];
    const box = h('div', { class: 'confetti', 'aria-hidden': 'true' });
    for (let i = 0; i < n; i++) {
      const p = h('i');
      p.style.cssText = `left:${Math.random() * 100}%;background:${rand(cols)};animation-delay:${(Math.random() * 1.2).toFixed(2)}s;animation-duration:${(2.2 + Math.random() * 1.6).toFixed(2)}s;transform:rotate(${Math.random() * 360}deg);width:${6 + Math.random() * 8}px;height:${8 + Math.random() * 10}px`;
      box.appendChild(p);
    }
    container.appendChild(box);
    setTimeout(() => box.remove(), 4500);
  }
  function countUp(el, to, ms = 700) {
    const start = performance.now();
    const step = now => { const t = clamp((now - start) / ms); el.textContent = (to * t).toFixed(1); if (t < 1) requestAnimationFrame(step); else el.textContent = to.toFixed(1); };
    requestAnimationFrame(step);
  }
  const starsHtml = n => `<div class="stars">${[0, 1, 2].map(i => `<span class="on">${i < n ? '⭐' : '☆'}</span>`).join('')}</div>`;

  /* ---------- startscherm ---------- */
  function renderStart() {
    const box = $('#profiles'); box.innerHTML = '';
    DB.profiles.forEach(p => {
      const card = h('div', { class: 'profile card', role: 'button', tabindex: '0' });
      card.innerHTML = `<div class="pav">${Avatar.render(p.look, p.outfit, { bg: false })}</div><b>${esc(p.name)}</b><small>Level ${p.level} · ⭐ ${p.stars} · 🪙 ${p.coins}</small><span class="del" role="button" title="Speler verwijderen" aria-label="Speler ${esc(p.name)} verwijderen">✕</span>`;
      card.addEventListener('click', e => { if (e.target.classList.contains('del')) { confirmDelete(p); } else startGame(p); });
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startGame(p); } });
      box.appendChild(card);
    });
    const add = h('button', { class: 'profile card new', type: 'button' }, `<div class="plus">+</div><b>Nieuwe speler</b><small>Maak je eigen model</small>`);
    add.addEventListener('click', () => openCreate());
    box.appendChild(add);
    $('#btn-duel').hidden = DB.profiles.length < 2;
  }
  function confirmDelete(p) {
    openOverlay(`<h2 class="h center">Speler verwijderen?</h2><p class="center">Wil je <b>${esc(p.name)}</b> echt verwijderen? Alle sterren, munten en gekochte spullen gaan dan weg.</p><div class="row center"><button class="btn ghost" id="del-no" type="button">Nee, laat maar</button><button class="btn" id="del-yes" type="button">Ja, verwijderen</button></div>`);
    $('#del-no').onclick = closeOverlay;
    $('#del-yes').onclick = () => { DB.profiles = DB.profiles.filter(x => x.id !== p.id); save(); closeOverlay(); renderStart(); };
  }

  /* ---------- model maken / aanpassen ---------- */
  function openCreate(profile) {
    ui.editMode = !!profile;
    ui.temp = profile
      ? { skin: profile.look.skin, eyes: profile.look.eyes, face: profile.look.face, build: profile.look.build, hairColor: profile.look.hairColor, hairStyle: profile.outfit.hair || 'hair_lang', name: profile.name }
      : { skin: 's2', eyes: 'e1', face: 'ovaal', build: 40, hairStyle: 'hair_lang', hairColor: 'bruin', name: '' };
    $('#create-title').textContent = profile ? 'Pas je uiterlijk aan' : 'Maak je model';
    $('#create-done').textContent = profile ? 'Opslaan ✨' : 'Klaar! ✨';
    $('#name-input').value = ui.temp.name;
    $('#build-range').value = ui.temp.build;
    renderCreate();
    showScreen('screen-create');
    if (!profile) setTimeout(() => $('#name-input').focus(), 50);
  }
  function renderCreate(previewOnly = false) {
    const t = ui.temp;
    const styles = ui.editMode ? ITEMS.filter(i => i.cat === 'hair' && owned(i)) : ITEMS.filter(i => i.cat === 'hair' && i.lvl <= 1);
    const lvl = ui.editMode ? P.level : 1;
    const outfit = ui.editMode ? { ...P.outfit, hair: t.hairStyle } : { hair: t.hairStyle, top: 'top_tshirt_blauw', bottom: 'bot_jeans', shoes: 'sh_sneakers' };
    $('#create-preview').innerHTML = Avatar.render(t, outfit, { bg: false });
    if (previewOnly) return;
    swatches($('#skin-swatches'), SKINS.map(s => ({ id: s.id, c: s.c, title: 'Huidskleur' })), t.skin, id => { t.skin = id; renderCreate(); });
    swatches($('#eye-swatches'), EYES.map(e => ({ id: e.id, c: e.c, title: e.name })), t.eyes, id => { t.eyes = id; renderCreate(); });
    const fs = $('#face-shapes'); fs.innerHTML = '';
    FACE_SHAPES.forEach(f => {
      const b = h('button', { class: 'face' + (f.id === t.face ? ' selected' : ''), type: 'button', title: f.name }, Avatar.headThumb({ ...t, face: f.id }) + `<span>${f.name}</span>`);
      b.onclick = () => { Sound.play('pop'); t.face = f.id; renderCreate(); };
      fs.appendChild(b);
    });
    const hs = $('#hair-styles'); hs.innerHTML = '';
    styles.forEach(it => {
      const b = h('button', { class: 'item' + (it.id === t.hairStyle ? ' selected' : ''), type: 'button' }, Avatar.thumb(it, t) + `<span class="name">${it.name}</span>`);
      b.onclick = () => { Sound.play('pop'); t.hairStyle = it.id; renderCreate(); };
      hs.appendChild(b);
    });
    swatches($('#hair-swatches'), HAIR_COLORS.filter(c => c.lvl <= lvl).map(c => ({ id: c.id, c: c.c === 'rainbow' ? HUES.multi.swatch : c.c, title: c.name })), t.hairColor, id => { t.hairColor = id; renderCreate(); });
  }
  function swatches(box, list, sel, onPick) {
    box.innerHTML = '';
    list.forEach(s => {
      const b = h('button', { class: 'swatch' + (s.id === sel ? ' selected' : ''), type: 'button', title: s.title || '', 'aria-label': s.title || '', style: `background:${s.c}` });
      b.onclick = () => { Sound.play('pop'); onPick(s.id); };
      box.appendChild(b);
    });
  }

  /* ---------- kleedkamer ---------- */
  function startGame(p) {
    P = p; ui.free = false; ui.duel = null;
    if (ui.tab === 'bg') ui.tab = 'dress';
    if (!currentTheme()) pickTheme();
    renderAll();
    renderTabs();
    showScreen('screen-game');
  }
  function renderAll() { renderHUD(); renderChallenge(); renderStage(); renderGrid(); }
  function currentTheme() {
    if (ui.duel) return THEME_BY_ID[ui.duel.themeId];
    const t = THEME_BY_ID[P.themeId]; return t && t.lvl <= P.level ? t : null;
  }
  function pickTheme(exclude, maxLevel = P.level) {
    const avail = THEMES.filter(t => t.lvl <= maxLevel && t.id !== exclude);
    const fresh = avail.filter(t => !P.done[t.id]);
    const t = rand(fresh.length ? fresh : (avail.length ? avail : THEMES));
    if (!ui.duel) { P.themeId = t.id; save(); }
    return t;
  }
  // de setting hoort bij de opdracht; alleen bij vrij spelen kies je zelf
  function currentBg() { if (ui.free) return P.freeBg || 'kamer'; const t = currentTheme(); return t ? t.bg : 'kamer'; }
  const outfitForStage = () => ({ ...P.outfit, bg: currentBg() });

  function renderHUD() {
    $('#hud-name').textContent = P.name;
    $('#hud-level').textContent = 'Level ' + P.level;
    $('#hud-stars').textContent = P.stars;
    $('#hud-coins').textContent = P.coins;
    const cur = xpForLevel(P.level), next = P.level < MAX_LEVEL ? xpForLevel(P.level + 1) : null;
    const pct = next ? clamp((P.xp - cur) / (next - cur)) * 100 : 100;
    $('#xp-fill').style.width = pct + '%';
    $('#xp-text').textContent = next ? `Nog ${next - P.xp} XP tot level ${P.level + 1}` : 'Hoogste level bereikt! 🏆';
    $('#btn-shop').textContent = `🛍️ Winkel${shopItems().length ? ` (${shopItems().length})` : ''}`;
  }

  function themeTags(t) {
    const hints = t.wants.map(w => `<span class="tag">${TAGS[w].emoji} ${TAGS[w].label}</span>`).join('');
    const col = t.multiColor ? `<span class="tag col">🌈 zoveel kleuren als je kunt</span>`
      : t.colors ? t.colors.map(c => `<span class="tag col"><i style="background:${HUES[c].swatch}"></i> ${HUES[c].label}</span>`).join('') : '';
    const glam = t.glam >= 2.5 ? '💎 super chic' : t.glam >= 1.5 ? '✨ een beetje glamour' : t.glam >= 1 ? '🙂 gewoon leuk' : '👟 lekker simpel';
    return `<div class="tags">${hints}${col}<span class="tag">${glam}</span></div>`;
  }
  function renderChallenge() {
    const box = $('#challenge');
    if (ui.duel) {
      const t = currentTheme();
      const other = DB.profiles.find(p => p.id === ui.duel.ids[1 - ui.duel.turn]);
      box.innerHTML = `<div class="ch-emoji">${t.emoji}</div><div class="ch-body"><small><span class="duel-banner">⚔️ Duel · beurt van ${esc(P.name)}</span> · 📍 ${SETTING_BY_ID[t.bg].name}</small><b>${t.name}</b><p>${t.desc}</p>${themeTags(t)}</div><div class="ch-actions"><span class="small">Daarna is ${esc(other.name)}</span><button class="btn ghost sm" id="btn-duel-stop" type="button">✖ Duel stoppen</button></div>`;
      $('#btn-duel-stop').onclick = () => { Sound.play('klik'); ui.duel = null; renderStart(); showScreen('screen-start'); };
      $('#btn-jury').textContent = 'Klaar! Naar de jury ✨';
      return;
    }
    if (ui.free) {
      box.innerHTML = `<div class="ch-emoji">🎨</div><div class="ch-body"><small>Vrij spelen</small><b>Kleed je aan zoals jij wilt</b><p>Geen jury vandaag, wel een modeshow! Kies bij Setting zelf waar je staat.</p></div><div class="ch-actions"><button class="btn violet sm" id="btn-free" type="button">🏆 Terug naar opdrachten</button></div>`;
    } else {
      const t = currentTheme() || pickTheme();
      const best = P.done[t.id] ? `beste score ${'⭐'.repeat(P.done[t.id])}` : 'nieuw!';
      box.innerHTML = `<div class="ch-emoji">${t.emoji}</div><div class="ch-body"><small>Opdracht · ${best} · 📍 ${SETTING_BY_ID[t.bg].name}</small><b>${t.name}</b><p>${t.desc}</p>${themeTags(t)}</div><div class="ch-actions"><button class="btn ghost sm" id="btn-other" type="button">🔄 Andere opdracht</button><button class="btn ghost sm" id="btn-free" type="button">🎨 Vrij spelen</button></div>`;
      $('#btn-other').onclick = () => { Sound.play('klik'); pickTheme(t.id); renderChallenge(); renderStage(); };
    }
    $('#btn-free').onclick = () => { Sound.play('klik'); ui.free = !ui.free; if (!ui.free && ui.tab === 'bg') ui.tab = 'dress'; renderChallenge(); renderStage(); renderTabs(); renderGrid(); };
    $('#btn-jury').textContent = ui.free ? '🎉 Modeshow!' : 'Naar de jury! ✨';
  }

  function renderStage() {
    $('#stage').innerHTML = Avatar.render(P.look, outfitForStage());
    $('#hud-avatar').innerHTML = Avatar.render(P.look, P.outfit, { bg: false });
  }

  function renderTabs() {
    const nav = $('#tabs'); nav.innerHTML = '';
    CATEGORIES.filter(c => !c.freeOnly || ui.free).forEach(c => {
      const b = h('button', { class: 'tab' + (c.id === ui.tab ? ' active' : ''), type: 'button', 'aria-pressed': c.id === ui.tab }, `<span class="ti">${c.emoji}</span><span>${c.name}</span>`);
      b.onclick = () => { Sound.play('klik'); ui.tab = c.id; renderTabs(); renderGrid(); };
      nav.appendChild(b);
    });
  }

  function renderGrid() {
    const grid = $('#grid'); grid.innerHTML = '';
    const cat = CATEGORIES.find(c => c.id === ui.tab) || CATEGORIES[2];
    if (cat.id === 'hair') {
      grid.appendChild(section('Kapsel'));
      itemsOf('hair').forEach(it => grid.appendChild(itemCard(it)));
      grid.appendChild(moreCard('hair'));
      grid.appendChild(section('Haarkleur'));
      HAIR_COLORS.filter(c => c.lvl <= P.level).forEach(c => grid.appendChild(colorCard(c)));
      return;
    }
    if (cat.id === 'bg') {
      grid.appendChild(section('Waar sta je?'));
      const ids = [...new Set(THEMES.filter(t => t.lvl <= P.level).map(t => t.bg))];
      ids.map(id => SETTING_BY_ID[id]).forEach(s => {
        const b = h('button', { class: 'item' + (P.freeBg === s.id ? ' selected' : ''), type: 'button', title: s.name }, Avatar.thumb({ cat: 'bg', shape: s.shape }, P.look) + `<span class="name">${s.name}</span>`);
        b.onclick = () => { Sound.play('pop'); P.freeBg = s.id; save(); renderStage(); renderGrid(); };
        grid.appendChild(b);
      });
      return;
    }
    const slots = cat.slots || [cat.id];
    slots.forEach(slot => {
      if (slots.length > 1) grid.appendChild(section(SLOT_NAMES[slot]));
      grid.appendChild(noneCard(slot));
      itemsOf(slot).forEach(it => grid.appendChild(itemCard(it)));
      grid.appendChild(moreCard(slot));
    });
  }
  const section = title => h('div', { class: 'section' }, title);
  function noneCard(slot) {
    const b = h('button', { class: 'item none' + (P.outfit[slot] ? '' : ' selected'), type: 'button' }, `<div class="none-ic">🚫</div><span class="name">Geen</span>`);
    b.onclick = () => { Sound.play('klik'); delete P.outfit[slot]; save(); renderStage(); renderGrid(); };
    return b;
  }
  function moreCard(slot) {
    const n = shopItems(slot).length;
    const b = h('button', { class: 'item more', type: 'button', title: 'Naar de winkel' }, `<div class="none-ic">🛍️</div><span class="name">${n ? `${n} in de winkel` : 'Winkel'}</span>`);
    b.hidden = !n;
    b.onclick = () => { Sound.play('klik'); openShop(slot); };
    return b;
  }
  function itemCard(it) {
    const b = h('button', { class: 'item' + (P.outfit[it.cat] === it.id ? ' selected' : ''), type: 'button', title: it.name });
    b.innerHTML = Avatar.thumb(it, P.look) + `<span class="name">${it.name}</span>`;
    b.onclick = () => { Sound.play('pop'); wear(it); };
    return b;
  }
  function colorCard(c) {
    const b = h('button', { class: 'item color' + (P.look.hairColor === c.id ? ' selected' : ''), type: 'button' },
      `<span class="swatch big" style="background:${c.c === 'rainbow' ? HUES.multi.swatch : c.c}"></span><span class="name">${c.name}</span>`);
    b.onclick = () => { Sound.play('pop'); P.look.hairColor = c.id; save(); renderStage(); renderGrid(); };
    return b;
  }
  function wear(it) {
    const slot = it.cat;
    if (P.outfit[slot] === it.id && slot !== 'hair') delete P.outfit[slot];
    else {
      P.outfit[slot] = it.id;
      if (slot === 'dress') { delete P.outfit.top; delete P.outfit.bottom; }
      if (slot === 'top' || slot === 'bottom') delete P.outfit.dress;
    }
    save(); renderStage(); renderGrid();
  }
  function randomOutfit() {
    const pick = (slot, prob = 1) => { const opts = itemsOf(slot); if (opts.length && Math.random() < prob) P.outfit[slot] = rand(opts).id; else delete P.outfit[slot]; };
    if (Math.random() < 0.45 && itemsOf('dress').length) { pick('dress'); delete P.outfit.top; delete P.outfit.bottom; }
    else { delete P.outfit.dress; pick('top'); pick('bottom'); }
    pick('shoes'); pick('hat', .5); pick('glasses', .3); pick('neck', .45); pick('bag', .3); pick('hand', .35); pick('back', .25); pick('pet', .3);
    pick('mk_eyes', .4); pick('mk_lips', .4); pick('mk_blush', .5); pick('mk_face', .25); pick('hair');
    save(); renderStage(); renderGrid();
  }
  function clearOutfit() { P.outfit = { hair: P.outfit.hair }; save(); renderStage(); renderGrid(); }

  /* ---------- winkel ---------- */
  function openShop(slot = null) {
    const cats = CATEGORIES.filter(c => !c.freeOnly);
    const slotCat = slot ? cats.find(c => (c.slots || [c.id]).includes(slot)) : null;
    let filter = slotCat ? slotCat.id : 'alles';
    const draw = () => {
      const cat = cats.find(c => c.id === filter);
      const list = filter === 'alles' ? shopItems() : (cat.slots || [cat.id]).flatMap(s => shopItems(s));
      openOverlay(`
        <div class="shop-head"><h2 class="h">🛍️ Winkel</h2><div class="hud-stars coins">🪙 <span id="shop-coins">${P.coins}</span></div></div>
        <div class="shop-tabs"><button class="tab${filter === 'alles' ? ' active' : ''}" data-f="alles" type="button">Alles (${shopItems().length})</button>${cats.map(c => { const n = (c.slots || [c.id]).reduce((a, s) => a + shopItems(s).length, 0); return n ? `<button class="tab${filter === c.id ? ' active' : ''}" data-f="${c.id}" type="button"><span class="ti">${c.emoji}</span>${c.name} (${n})</button>` : ''; }).join('')}</div>
        ${list.length ? `<div class="shop-grid">${list.map(it => `<button class="item${P.coins < priceOf(it) ? ' poor' : ''}" data-id="${it.id}" type="button" title="${it.name}">${Avatar.thumb(it, P.look)}<span class="name">${it.name}</span><span class="price">🪙 ${priceOf(it)}</span></button>`).join('')}</div>` : `<div class="shop-empty">Alles gekocht! Speel een opdracht of haal een hoger level voor nieuwe spullen.</div>`}
        <p class="center small">Munten verdien je bij de jury en met de kleurenpuzzel. Kies je kleding zelf en spaar voor wat je écht wilt.</p>
        <div class="row center"><button class="btn ghost" id="shop-close" type="button">Terug naar de kleedkamer</button></div>`, 'shop');
      $('#shop-close').onclick = () => { closeOverlay(); renderAll(); };
      document.querySelectorAll('.shop-tabs .tab').forEach(b => { b.onclick = () => { Sound.play('klik'); filter = b.dataset.f; draw(); }; });
      document.querySelectorAll('.shop-grid .item').forEach(b => { b.onclick = () => buyFlow(ITEM_BY_ID[b.dataset.id], draw); });
    };
    draw();
  }
  function buyFlow(it, back) {
    const price = priceOf(it);
    if (P.coins < price) { Sound.play('fout'); toast(`Nog ${price - P.coins} munten sparen voor ${it.name}. Speel een opdracht of doe de kleurenpuzzel!`); return; }
    Sound.play('klik');
    const rest = P.coins - price;
    // rekenvraagje: hoeveel houd je over?
    const wrongs = new Set(); while (wrongs.size < 2) { const d = rand([-3, -2, -1, 1, 2, 3, 5, 10]); const v = rest + d; if (v >= 0 && v !== rest) wrongs.add(v); }
    const options = shuffle([rest, ...wrongs]);
    openOverlay(`
      <h2 class="h center">${esc(it.name)} kopen?</h2>
      <div class="buy-preview">${Avatar.thumb(it, P.look)}</div>
      <p class="center">Je hebt <b>${P.coins}</b> munten en dit kost <b>${price}</b>. Hoeveel houd je over?</p>
      <div class="sum"><span class="coin">🪙 ${P.coins}</span><span>−</span><span class="coin">🪙 ${price}</span><span>=</span><span class="coin q" id="sum-answer">?</span></div>
      <div class="answers" id="answers">${options.map(v => `<button class="btn violet" data-v="${v}" type="button">${v}</button>`).join('')}</div>
      <p class="center feedback" id="buy-feedback"></p>
      <div class="row center"><button class="btn ghost" id="buy-cancel" type="button">Toch niet</button></div>`);
    $('#buy-cancel').onclick = () => back();
    document.querySelectorAll('#answers .btn').forEach(b => {
      b.onclick = async () => {
        const v = +b.dataset.v, ok = v === rest;
        document.querySelectorAll('#answers .btn').forEach(x => { x.disabled = true; x.classList.add(+x.dataset.v === rest ? 'right' : 'wrong'); });
        $('#sum-answer').textContent = rest;
        Sound.play(ok ? 'ster' : 'fout');
        $('#buy-feedback').textContent = ok ? `Goed gerekend! Je krijgt 2 munten bonus. 🎉` : `Bijna! ${P.coins} − ${price} = ${rest}.`;
        P.coins = rest + (ok ? 2 : 0);
        P.owned.push(it.id);
        save();
        await wait(1300);
        Sound.play('tada');
        toast(`${it.name} is van jou! Je vindt hem in de kast.`);
        back();
      };
    });
  }

  /* ---------- de jury ---------- */
  const wheelDist = (a, b) => { const d = Math.abs(a - b) % 6; return Math.min(d, 6 - d); };
  function evaluate(outfit, theme) {
    const get = s => outfit[s] ? ITEM_BY_ID[outfit[s]] : null;
    const worn = OUTFIT_SLOTS.map(get).filter(Boolean);
    const themed = [...worn, get('pet'), get('mk_face')].filter(Boolean);

    let match = 0, bad = 0;
    themed.forEach(it => { if (it.tags.some(t => theme.wants.includes(t))) match++; else if (it.tags.some(t => theme.avoid.includes(t))) bad++; });
    let thema = themed.length ? clamp((match - bad * 0.7) / themed.length) : 0;
    if (match >= 4) thema = clamp(thema + 0.1);
    if (match <= 1) thema = Math.min(thema, 0.45);

    const hues = worn.map(i => i.hue).filter(Boolean);
    const colored = hues.filter(hh => HUES[hh] && !HUES[hh].neutral && !HUES[hh].multi);
    const distinct = [...new Set(colored)];
    const multiCount = hues.filter(hh => hh === 'multi').length;
    let kleur;
    if (theme.multiColor) {
      kleur = clamp(0.25 + (distinct.length + multiCount * 2) * 0.2);
    } else {
      if (distinct.length === 0) kleur = hues.length ? 0.78 : 0.3;
      else if (distinct.length === 1) kleur = 1;
      else if (distinct.length === 2) { const d = wheelDist(HUES[distinct[0]].wheel, HUES[distinct[1]].wheel); kleur = (d <= 1.3 || d >= 2.5) ? 0.95 : 0.65; }
      else if (distinct.length === 3) kleur = 0.5;
      else kleur = 0.3;
      kleur = clamp(kleur - multiCount * 0.15);
    }
    if (theme.colors) { const hits = hues.filter(hh => theme.colors.includes(hh)).length; kleur = clamp(kleur * 0.65 + clamp(hits / 2) * 0.35); }

    const top = get('top');
    const hasTop = !!outfit.dress || !!top, hasBottom = !!outfit.dress || !!outfit.bottom || !!(top && top.full), hasShoes = !!outfit.shoes;
    const compleet = (hasTop ? 0.35 : 0) + (hasBottom ? 0.35 : 0) + (hasShoes ? 0.3 : 0);

    const avg = worn.length ? worn.reduce((a, i) => a + i.glam, 0) / worn.length : 0;
    const max = Math.max(0, ...worn.map(i => i.glam));
    const glamour = clamp(1 - Math.abs((avg * 0.5 + max * 0.5) - theme.glam) / 3);

    const accessoires = clamp(ACC_SLOTS.filter(s => outfit[s]).length / 4);

    const factors = { thema, kleur, compleet, glamour, accessoires };
    const judges = JUDGES.map(j => {
      let score = 0;
      for (const [f, w] of Object.entries(j.weights)) score += w * factors[f];
      score = Math.round(score * 100) / 10;
      const entries = Object.entries(j.weights).sort((a, b) => b[1] - a[1]);
      let pick = score < 8 ? entries.find(([f]) => factors[f] < 0.45) : null, tier;
      if (pick) tier = 2;
      else { pick = entries.reduce((best, e) => factors[e[0]] > factors[best[0]] ? e : best); tier = factors[pick[0]] >= 0.8 ? 0 : 1; }
      return { judge: j, score, comment: COMMENTS[j.id][pick[0]][tier] };
    });
    const total = Math.round(judges.reduce((a, j) => a + j.score, 0) / judges.length * 10) / 10;
    const stars = total >= 8 ? 3 : total >= 5.8 ? 2 : 1;
    const weakest = Object.entries(factors).sort((a, b) => a[1] - b[1])[0][0];
    return { factors, judges, total, stars, weakest };
  }
  // beloning uitdelen: xp, munten, level-up met cadeautjes; de rest van het level komt in de winkel
  function award(p, res, theme) {
    let xp = XP_PER_STARS[res.stars];
    const first = !p.done[theme.id];
    if (first) xp += XP_FIRST_TIME;
    const coins = COINS_PER_STARS[res.stars];
    const prevLevel = p.level;
    p.xp += xp; p.level = levelFromXp(p.xp); p.coins += coins;
    p.done[theme.id] = Math.max(p.done[theme.id] || 0, res.stars);
    p.shows++; p.stars += res.stars;
    const fresh = ITEMS.filter(i => i.lvl > prevLevel && i.lvl <= p.level);
    const gifts = shuffle(fresh).slice(0, GIFTS_PER_LEVEL * (p.level - prevLevel));
    gifts.forEach(g => p.owned.push(g.id));
    const colors = HAIR_COLORS.filter(c => c.lvl > prevLevel && c.lvl <= p.level);
    const themes = THEMES.filter(t => t.lvl > prevLevel && t.lvl <= p.level);
    save();
    return { xp, coins, first, prevLevel, gifts, shopCount: fresh.length - gifts.length, colors, themes };
  }
  function levelUpHtml(g, p) {
    return `<div class="levelup"><h3>🎊 Level ${p.level}! 🎊</h3>
      ${g.gifts.length ? `<p>Cadeautjes voor jou:</p><div class="unlocks">${g.gifts.map(u => `<div class="unlock">${Avatar.thumb(u, p.look)}<span>${u.name}</span></div>`).join('')}${g.colors.map(c => `<div class="unlock"><span class="swatch big" style="background:${c.c === 'rainbow' ? HUES.multi.swatch : c.c}"></span><span>Haarkleur ${c.name}</span></div>`).join('')}</div>` : ''}
      ${g.shopCount ? `<p class="newtheme">🛍️ En er liggen ${g.shopCount} nieuwe dingen in de winkel!</p>` : ''}
      ${g.themes.length ? `<p class="newtheme">Nieuwe opdracht${g.themes.length > 1 ? 'en' : ''}: ${g.themes.map(t => t.emoji + ' ' + t.name).join(', ')}</p>` : ''}</div>`;
  }

  function goJury() {
    if (ui.duel) return duelTurnDone();
    if (ui.free) return fashionShow();
    const theme = currentTheme() || pickTheme();
    const res = evaluate(P.outfit, theme);
    const gained = award(P, res, theme);
    const ov = openOverlay(`
      <div class="runway"><div class="spot a"></div><div class="spot b"></div><div class="walker">${Avatar.render(P.look, P.outfit, { expr: res.stars === 3 ? 'grin' : 'smile', bg: false })}</div></div>
      <h2 class="h center" id="jury-title">De jury kijkt… 👀</h2>
      <div class="judges">${JUDGES.map(j => `<div class="judge"><div class="j-emoji">${j.emoji}</div><b>${j.name}</b><small>${j.title}</small><div class="score">–</div><p class="comment"></p></div>`).join('')}</div>
      <div class="result" id="result" hidden></div>`, 'jury');
    const cards = [...ov.querySelectorAll('.judge')];
    let t = 1500;
    res.judges.forEach((r, i) => {
      setTimeout(() => { Sound.play('ding'); const c = cards[i]; c.classList.add('in'); countUp(c.querySelector('.score'), r.score); c.querySelector('.comment').textContent = r.comment; }, t);
      t += 1100;
    });
    setTimeout(() => showResult(res, gained, theme), t + 200);
  }
  function showResult(res, g, theme) {
    const title = $('#jury-title'); if (!title) return;
    title.textContent = res.stars === 3 ? 'Fantastisch! 🎉' : res.stars === 2 ? 'Goed gedaan! 👏' : 'Leuk geprobeerd! 💪';
    const r = $('#result'); r.hidden = false;
    const lvlUp = P.level > g.prevLevel;
    r.innerHTML = `
      <div class="stars" aria-label="${res.stars} van 3 sterren">${[0, 1, 2].map(i => `<span>${i < res.stars ? '⭐' : '☆'}</span>`).join('')}</div>
      <div class="total">Gemiddeld <b>${res.total}</b> van de 10</div>
      <div class="xp-gain">+${g.xp} XP · +${g.coins} 🪙${g.first ? ' <small>eerste-keer-bonus!</small>' : ''}</div>
      <div class="xp"><div class="xp-bar"><div id="xp-fill-res"></div></div><small id="xp-text-res"></small></div>
      ${res.stars < 3 ? `<div class="tip">💡 ${TIPS[res.weakest]}</div>` : ''}
      ${lvlUp ? levelUpHtml(g, P) : ''}
      <div class="row center wrap"><button class="btn ghost" id="res-back" type="button">🪞 Kleedkamer</button><button class="btn gold" id="res-shop" type="button">🛍️ Winkel</button><button class="btn big" id="res-next" type="button">Volgende opdracht ➜</button></div>`;
    [...r.querySelectorAll('.stars span')].forEach((s, i) => setTimeout(() => { s.classList.add('on'); if (i < res.stars) Sound.play('ster'); }, 150 + i * 350));
    setTimeout(() => Sound.play(lvlUp ? 'levelup' : res.stars === 3 ? 'tada' : 'ding'), 150 + 3 * 350);
    const cur = xpForLevel(P.level), next = P.level < MAX_LEVEL ? xpForLevel(P.level + 1) : null;
    const pctNow = next ? clamp((P.xp - cur) / (next - cur)) * 100 : 100;
    const pctBefore = lvlUp ? 0 : (next ? clamp((P.xp - g.xp - cur) / (next - cur)) * 100 : 100);
    const fill = $('#xp-fill-res'); fill.style.width = pctBefore + '%';
    $('#xp-text-res').textContent = next ? `Level ${P.level} · nog ${next - P.xp} XP tot level ${P.level + 1}` : 'Hoogste level bereikt! 🏆';
    requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = pctNow + '%'; }));
    if (res.stars === 3 || lvlUp) confetti($('#overlay'));
    r.scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('#res-next').onclick = () => { closeOverlay(); pickTheme(theme.id); renderAll(); };
    $('#res-shop').onclick = () => { renderAll(); openShop(); };
    $('#res-back').onclick = () => { closeOverlay(); renderAll(); };
  }
  function fashionShow() {
    const ov = openOverlay(`
      <div class="runway big"><div class="spot a"></div><div class="spot b"></div><div class="walker">${Avatar.render(P.look, P.outfit, { expr: 'grin', bg: false })}</div></div>
      <h2 class="h center">👏 Wat een show, ${esc(P.name)}! 👏</h2>
      <p class="center">Het publiek juicht en de camera's flitsen!</p>
      <div class="row center"><button class="btn ghost" id="show-photo" type="button">📸 Foto maken</button><button class="btn big" id="show-close" type="button">Dankjewel! 💖</button></div>`, 'show');
    confetti(ov, 90);
    Sound.play('applaus'); setTimeout(() => Sound.play('tada'), 900);
    $('#show-close').onclick = closeOverlay;
    $('#show-photo').onclick = () => { closeOverlay(); makePhoto(); };
  }

  /* ---------- duel: twee spelers, één opdracht ---------- */
  function openDuelSetup() {
    Sound.play('klik');
    const picked = [];
    const draw = () => {
      openOverlay(`
        <h2 class="h center">⚔️ Wie doen er mee?</h2>
        <p class="center">Kies twee spelers. Jullie krijgen dezelfde opdracht en kleden je om de beurt aan. Daarna kijkt de jury naar allebei!</p>
        <div class="pick-players">${DB.profiles.map(p => { const i = picked.indexOf(p.id); return `<div class="profile card${i >= 0 ? ' picked' : ''}" data-id="${p.id}" role="button" tabindex="0">${i >= 0 ? `<span class="badge">Speler ${i + 1}</span>` : ''}<div class="pav">${Avatar.render(p.look, p.outfit, { bg: false })}</div><b>${esc(p.name)}</b><small>Level ${p.level}</small></div>`; }).join('')}</div>
        <div class="row center"><button class="btn ghost" id="duel-cancel" type="button">Terug</button><button class="btn big violet" id="duel-go" type="button" ${picked.length === 2 ? '' : 'disabled'}>Start het duel! ⚔️</button></div>`);
      $('#duel-cancel').onclick = closeOverlay;
      $('#duel-go').onclick = () => { if (picked.length === 2) startDuel(picked[0], picked[1]); };
      document.querySelectorAll('.pick-players .profile').forEach(c => {
        c.onclick = () => { Sound.play('pop'); const id = c.dataset.id; const i = picked.indexOf(id); if (i >= 0) picked.splice(i, 1); else if (picked.length < 2) picked.push(id); draw(); };
      });
    };
    draw();
  }
  function startDuel(idA, idB) {
    const a = DB.profiles.find(p => p.id === idA), b = DB.profiles.find(p => p.id === idB);
    P = a; ui.free = false; if (ui.tab === 'bg') ui.tab = 'dress';
    const maxLevel = Math.min(a.level, b.level);
    ui.duel = { ids: [idA, idB], themeId: null, turn: 0, results: [] };
    ui.duel.themeId = pickTheme(null, maxLevel).id;
    closeOverlay();
    renderAll(); renderTabs();
    showScreen('screen-game');
    const t = currentTheme();
    openOverlay(`<div class="handover"><div class="pav">${Avatar.render(a.look, a.outfit, { bg: false })}</div><h2 class="h">${esc(a.name)} begint!</h2><p>De opdracht is <b>${t.emoji} ${t.name}</b>. ${esc(b.name)} mag even niet kijken. 🙈</p><button class="btn big" id="ho-ok" type="button">Ik ben klaar om te beginnen!</button></div>`, 'duel-lock');
    $('#ho-ok').onclick = closeOverlay;
  }
  function duelTurnDone() {
    const theme = currentTheme();
    const res = evaluate(P.outfit, theme);
    ui.duel.results.push({ id: P.id, res, look: { ...P.look }, outfit: { ...P.outfit } });
    if (ui.duel.turn === 0) {
      ui.duel.turn = 1;
      const b = DB.profiles.find(p => p.id === ui.duel.ids[1]);
      P = b;
      renderAll();
      Sound.play('tada');
      openOverlay(`<div class="handover"><div class="pav">${Avatar.render(b.look, b.outfit, { bg: false })}</div><h2 class="h">Geef de tablet aan ${esc(b.name)}! 🤲</h2><p>Zelfde opdracht: <b>${theme.emoji} ${theme.name}</b>. Kleed je aan en druk op Klaar.</p><button class="btn big" id="ho-ok" type="button">Ik ben ${esc(b.name)}, ik ben er!</button></div>`, 'duel-lock');
      $('#ho-ok').onclick = closeOverlay;
      return;
    }
    duelResult(theme);
  }
  function duelResult(theme) {
    const [ra, rb] = ui.duel.results;
    const pa = DB.profiles.find(p => p.id === ra.id), pb = DB.profiles.find(p => p.id === rb.id);
    const ga = award(pa, ra.res, theme), gb = award(pb, rb.res, theme);
    let winner = null;
    if (ra.res.total > rb.res.total) winner = pa; else if (rb.res.total > ra.res.total) winner = pb;
    if (winner) { winner.stars += DUEL_WIN_BONUS.stars; winner.coins += DUEL_WIN_BONUS.coins; winner.duels.won++; }
    pa.duels.played++; pb.duels.played++;
    save();
    const col = (p, r, g) => `<div class="duel-col${winner === p ? ' winner' : ''}">${winner === p ? '<span class="crown">👑</span>' : ''}<div class="pav">${Avatar.render(r.look, r.outfit, { expr: winner === p || !winner ? 'grin' : 'smile', bg: false })}</div><b>${esc(p.name)}</b><div class="score">${r.res.total}</div>${starsHtml(r.res.stars)}<div class="gain">+${g.xp} XP · +${g.coins} 🪙${winner === p ? ` · winnaar +${DUEL_WIN_BONUS.stars} ⭐ +${DUEL_WIN_BONUS.coins} 🪙` : ''}</div><p class="small">${r.res.judges[1].comment}</p>${p.level > g.prevLevel ? `<p class="newtheme">🎊 Level ${p.level}! ${g.gifts.length} cadeautje${g.gifts.length === 1 ? '' : 's'} in de kast.</p>` : ''}</div>`;
    const ov = openOverlay(`
      <h2 class="h center">${winner ? `🏆 ${esc(winner.name)} wint het duel!` : '🤝 Gelijkspel! Allebei even goed!'}</h2>
      <p class="center">Opdracht: ${theme.emoji} ${theme.name}</p>
      <div class="duel-cols">${col(pa, ra, ga)}${col(pb, rb, gb)}</div>
      <div class="row center wrap"><button class="btn ghost" id="duel-stop" type="button">Stoppen</button><button class="btn big violet" id="duel-again" type="button">🔁 Nog een duel!</button></div>`, 'duel-lock');
    confetti(ov, 90);
    Sound.play('applaus'); setTimeout(() => Sound.play('tada'), 900);
    $('#duel-stop').onclick = () => { closeOverlay(); ui.duel = null; renderStart(); showScreen('screen-start'); };
    $('#duel-again').onclick = () => { closeOverlay(); startDuel(pa.id, pb.id); };
  }

  /* ---------- kleurenpuzzel ---------- */
  const WHEEL = ['rood', 'oranje', 'geel', 'groen', 'blauw', 'paars'];
  const wheelSvg = (askHue, extra = '') => {
    const seg = (i, hue) => { const a0 = (i * 60 - 90 - 30) * Math.PI / 180, a1 = (i * 60 - 90 + 30) * Math.PI / 180; const R = 120, r = 46; const p = (ang, rad) => `${(150 + Math.cos(ang) * rad).toFixed(1)} ${(150 + Math.sin(ang) * rad).toFixed(1)}`; return `<path class="seg${hue === askHue ? ' ask' : ''}" data-hue="${hue}" d="M${p(a0, r)} L${p(a0, R)} A${R} ${R} 0 0 1 ${p(a1, R)} L${p(a1, r)} A${r} ${r} 0 0 0 ${p(a0, r)} Z" fill="${HUES[hue].swatch}" stroke="#fff" stroke-width="3"/>`; };
    return `<svg class="wheel" viewBox="0 0 300 300" aria-hidden="true">${WHEEL.map((hh, i) => seg(i, hh)).join('')}<circle cx="150" cy="150" r="40" fill="var(--surface)"/><text x="150" y="158" text-anchor="middle" font-size="26">🎨</text>${extra}</svg>`;
  };
  function makeQuestions() {
    const qs = [];
    // 1: buurkleur
    { const i = Math.floor(Math.random() * 6); const hue = WHEEL[i]; const good = [WHEEL[(i + 1) % 6], WHEEL[(i + 5) % 6]]; const bad = WHEEL.filter(hh => hh !== hue && !good.includes(hh)); const correct = rand(good); qs.push({ type: 'color', ask: hue, text: `Welke kleur is een <b>buurkleur</b> van ${HUES[hue].label}? Buurkleuren staan naast elkaar op het wiel en passen mooi bij elkaar.`, options: shuffle([correct, ...shuffle(bad).slice(0, 2)]), correct: v => good.includes(v), explain: `${HUES[good[0]].label} en ${HUES[good[1]].label} zijn de buren van ${HUES[hue].label}.` }); }
    // 2: tegenoverliggende kleur
    { const i = Math.floor(Math.random() * 6); const hue = WHEEL[i]; const opp = WHEEL[(i + 3) % 6]; const bad = WHEEL.filter(hh => hh !== hue && hh !== opp); qs.push({ type: 'color', ask: hue, text: `Welke kleur ligt <b>tegenover</b> ${HUES[hue].label} op het wiel? Die twee laten elkaar knallen!`, options: shuffle([opp, ...shuffle(bad).slice(0, 2)]), correct: v => v === opp, explain: `Tegenover ${HUES[hue].label} ligt ${HUES[opp].label}.` }); }
    // 3: welke outfit is rustig?
    { const i = Math.floor(Math.random() * 6); const a = WHEEL[i], b = WHEEL[(i + (Math.random() < .5 ? 1 : 5)) % 6]; const others = WHEEL.filter(hh => hh !== a && hh !== b); const mk = (top, bottom, shoes) => ({ top, bottom, shoes }); const good = mk(a, b, Math.random() < .5 ? a : b); const clash1 = mk(others[0], others[1], others[2]); const clash2 = mk(a, WHEEL[(i + 2) % 6], WHEEL[(i + 4) % 6]); qs.push({ type: 'outfit', text: `Welke outfit heeft <b>kleuren die vriendjes zijn</b>? Kijk goed: rustig of een rommeltje?`, options: shuffle([{ o: good, ok: true }, { o: clash1, ok: false }, { o: clash2, ok: false }]), explain: `${HUES[a].label} en ${HUES[b].label} zijn buren, dat is rustig. Drie kleuren die ver uit elkaar liggen, worden een rommeltje.` }); }
    return qs;
  }
  function outfitPreview(o) {
    const items = { q_top: { cat: 'top', shape: 'tshirt', c: [HUES[o.top].swatch], tags: [] }, q_bot: { cat: 'bottom', shape: 'pants', c: [HUES[o.bottom].swatch, Avatar.dark(HUES[o.bottom].swatch, .2)], tags: [] }, q_sh: { cat: 'shoes', shape: 'sneaker', c: [HUES[o.shoes].swatch, '#fff'], tags: [] } };
    return Avatar.render(P.look, { hair: P.outfit.hair, top: 'q_top', bottom: 'q_bot', shoes: 'q_sh' }, { bg: false, items });
  }
  function openPuzzle() {
    Sound.play('klik');
    if (P.puzzle.day !== today()) P.puzzle = { day: today(), count: 0 };
    const rewarded = P.puzzle.count < PUZZLE_REWARDED_PER_DAY;
    const qs = makeQuestions();
    let idx = 0, right = 0;
    const draw = () => {
      const q = qs[idx];
      const progress = `<div class="progress">${qs.map((x, i) => `<i class="${i < idx ? (x.result ? 'ok' : 'bad') : ''}${i === idx ? ' cur' : ''}"></i>`).join('')}</div>`;
      const body = q.type === 'color'
        ? `${wheelSvg(q.ask)}<div class="question">${q.text}</div><div class="color-options">${q.options.map(v => `<button class="color-opt" data-v="${v}" type="button"><span class="dot" style="background:${HUES[v].swatch}"></span>${HUES[v].label}</button>`).join('')}</div>`
        : `<div class="question">${q.text}</div><div class="outfit-options">${q.options.map((op, i) => `<button class="outfit-opt" data-i="${i}" type="button">${outfitPreview(op.o)}</button>`).join('')}</div>`;
      openOverlay(`<div class="puzzle"><h2 class="h">🎨 Kleurenpuzzel</h2>${progress}${body}<p class="feedback" id="pz-feedback"></p><button class="btn ghost sm" id="pz-close" type="button">Stoppen</button></div>`, 'puzzle-modal');
      $('#pz-close').onclick = closeOverlay;
      const answer = async (ok, markRight) => {
        q.result = ok; if (ok) right++;
        markRight();
        Sound.play(ok ? 'ster' : 'fout');
        $('#pz-feedback').textContent = (ok ? 'Goed zo! ' : 'Bijna! ') + q.explain;
        await wait(1700);
        idx++;
        if (idx < qs.length) draw(); else finish();
      };
      document.querySelectorAll('.color-opt').forEach(b => {
        b.onclick = () => { if (b.disabled) return; answer(q.correct(b.dataset.v), () => document.querySelectorAll('.color-opt').forEach(x => { x.disabled = true; x.classList.add(q.correct(x.dataset.v) ? 'right' : 'wrong'); })); };
      });
      document.querySelectorAll('.outfit-opt').forEach(b => {
        b.onclick = () => { if (b.disabled) return; const op = q.options[+b.dataset.i]; answer(op.ok, () => document.querySelectorAll('.outfit-opt').forEach(x => { x.disabled = true; x.classList.add(q.options[+x.dataset.i].ok ? 'right' : 'wrong'); })); };
      });
    };
    const finish = () => {
      let coins = 0;
      if (rewarded) { coins = right * PUZZLE_COIN_PER_ANSWER + (right === qs.length ? PUZZLE_BONUS_ALL_RIGHT : 0); P.coins += coins; P.puzzle.count++; save(); }
      const left = Math.max(0, PUZZLE_REWARDED_PER_DAY - P.puzzle.count);
      const ov = openOverlay(`<div class="puzzle"><h2 class="h">${right === qs.length ? '🌈 Alles goed!' : right >= 2 ? '👏 Goed bezig!' : '💪 Volgende keer beter!'}</h2><div class="stars">${[0, 1, 2].map(i => `<span class="on">${i < right ? '⭐' : '☆'}</span>`).join('')}</div><p>${right} van de ${qs.length} goed.</p>${coins ? `<div class="xp-gain">+${coins} 🪙</div>` : rewarded ? '' : '<p class="small">Voor vandaag heb je alle puzzelmunten al verdiend. Oefenen mag altijd!</p>'}${rewarded ? `<p class="small">Nog ${left} puzzelronde${left === 1 ? '' : 's'} vandaag die munten opleveren.</p>` : ''}<div class="row center wrap"><button class="btn ghost" id="pz-done" type="button">Terug</button><button class="btn mint" id="pz-again" type="button">🔁 Nog een keer</button></div></div>`);
      if (right === qs.length) confetti(ov, 60);
      Sound.play(right === qs.length ? 'tada' : 'ding');
      $('#pz-done').onclick = () => { closeOverlay(); renderHUD(); };
      $('#pz-again').onclick = () => { closeOverlay(); renderHUD(); openPuzzle(); };
    };
    draw();
  }

  /* ---------- foto ---------- */
  function makePhoto() {
    const svg = Avatar.render(P.look, outfitForStage(), { expr: 'grin' });
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = 900; c.height = 1560;
      const g = c.getContext('2d'); g.drawImage(img, 0, 0, 900, 1560);
      URL.revokeObjectURL(url);
      let data = '';
      try { data = c.toDataURL('image/png'); } catch (e) { data = url; }
      const fname = `catwalk-${P.name.replace(/[^\w-]+/g, '_')}.png`;
      openOverlay(`<h2 class="h center">📸 Jouw foto</h2><div class="photo"><img src="${data}" alt="Foto van het model van ${esc(P.name)}"></div><p class="center small">Op een tablet: houd de foto lang ingedrukt om hem op te slaan.</p><div class="row center"><button class="btn ghost" id="photo-close" type="button">Sluiten</button><a class="btn" id="photo-dl" href="${data}" download="${fname}">⬇️ Opslaan</a></div>`, 'photo-modal');
      $('#photo-close').onclick = closeOverlay;
    };
    img.onerror = () => { URL.revokeObjectURL(url); toast('De foto lukte helaas niet. Probeer het nog eens.'); };
    img.src = url;
  }

  /* ---------- wat komt er op het volgende level? ---------- */
  function showNextLevel() {
    Sound.play('klik');
    if (P.level >= MAX_LEVEL) { openOverlay(`<h2 class="h center">🏆 Hoogste level!</h2><p class="center">Je hebt het hoogste level bereikt. Alles wat nog in de winkel ligt, kun je met munten kopen.</p><div class="row center"><button class="btn" id="nl-close" type="button">Super!</button></div>`); $('#nl-close').onclick = closeOverlay; return; }
    const next = P.level + 1;
    const fresh = ITEMS.filter(i => i.lvl === next);
    const colors = HAIR_COLORS.filter(c => c.lvl === next).length;
    const themes = THEMES.filter(t => t.lvl === next);
    const need = xpForLevel(next) - P.xp;
    openOverlay(`
      <h2 class="h center">🎁 Level ${next}</h2>
      <p class="center">Nog <b>${need} XP</b> te gaan. Dan krijg je <b>${Math.min(GIFTS_PER_LEVEL, fresh.length)} cadeautjes</b> en komen er <b>${Math.max(0, fresh.length - GIFTS_PER_LEVEL)} nieuwe dingen</b> in de winkel${colors ? `, plus ${colors} nieuwe haarkleur${colors > 1 ? 'en' : ''}` : ''}. Wát precies blijft een verrassing!</p>
      ${themes.length ? `<p class="center newtheme">Nieuwe opdracht${themes.length > 1 ? 'en' : ''}: ${themes.map(t => t.emoji + ' ' + t.name).join(', ')}</p>` : ''}
      <div class="row center"><button class="btn" id="nl-close" type="button">Aan de slag! ✨</button></div>`);
    $('#nl-close').onclick = closeOverlay;
  }
  function renderSoundButton() { const b = $('#btn-sound'); b.textContent = Sound.isOn() ? '🔊' : '🔇'; b.title = Sound.isOn() ? 'Geluid uit' : 'Geluid aan'; }

  /* ---------- knoppen ---------- */
  function wire() {
    renderSoundButton();
    $('#btn-sound').onclick = () => { Sound.toggle(); renderSoundButton(); };
    $('#btn-next').onclick = showNextLevel;
    $('#btn-shop').onclick = () => { Sound.play('klik'); openShop(); };
    $('#btn-puzzle').onclick = openPuzzle;
    $('#btn-duel').onclick = openDuelSetup;
    $('#create-done').onclick = () => {
      const name = $('#name-input').value.trim().slice(0, 16) || 'Ster';
      const look = { skin: ui.temp.skin, eyes: ui.temp.eyes, face: ui.temp.face, build: ui.temp.build, hairColor: ui.temp.hairColor };
      if (ui.editMode) { P.name = name; P.look = look; P.outfit.hair = ui.temp.hairStyle; save(); startGame(P); }
      else { const p = newProfile(name, look, ui.temp.hairStyle); DB.profiles.push(p); save(); startGame(p); }
    };
    $('#create-cancel').onclick = () => { if (ui.editMode) startGame(P); else { renderStart(); showScreen('screen-start'); } };
    $('#name-input').addEventListener('keydown', e => { if (e.key === 'Enter') $('#create-done').click(); });
    $('#build-range').addEventListener('input', e => { ui.temp.build = +e.target.value; renderCreate(true); });
    $('#hud-profile').onclick = () => { ui.duel = null; renderStart(); showScreen('screen-start'); };
    $('#btn-look').onclick = () => { if (ui.duel) { toast('Tijdens een duel kun je je uiterlijk niet aanpassen.'); return; } openCreate(P); };
    $('#btn-random').onclick = () => { Sound.play('tada'); randomOutfit(); };
    $('#btn-clear').onclick = () => { Sound.play('klik'); clearOutfit(); };
    $('#btn-photo').onclick = () => { Sound.play('klik'); makePhoto(); };
    $('#btn-jury').onclick = () => { Sound.play('klik'); goJury(); };
    $('#overlay').addEventListener('click', e => { if (e.target.id === 'overlay' && !modalLocked()) closeOverlay(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#overlay').hidden && !modalLocked()) closeOverlay(); });
  }

  /* ---------- start ---------- */
  load();
  wire();
  renderStart();
  showScreen('screen-start');
})();

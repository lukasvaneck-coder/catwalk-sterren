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
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

  let DB = { profiles: [] };
  let P = null;                                   // actieve speler
  const ui = { tab: 'dress', free: false, temp: null, editMode: false };

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
    // oude spelers meenemen naar de nieuwe versie
    DB.profiles.forEach(p => {
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
    });
  }
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(DB)); } catch (e) { /* stil doorgaan */ } }

  function levelFromXp(xp) { let l = 1; while (l < MAX_LEVEL && xp >= xpForLevel(l + 1)) l++; return l; }
  const unlocked = it => it.lvl <= P.level;
  const itemsOf = slot => ITEMS.filter(i => i.cat === slot && unlocked(i)).sort((a, b) => a.lvl - b.lvl || a.name.localeCompare(b.name));

  function newProfile(name, look, hairStyle) {
    return {
      id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name, look,
      outfit: { hair: hairStyle, top: 'top_tshirt_blauw', bottom: 'bot_jeans', shoes: 'sh_sneakers' },
      freeBg: 'kamer', xp: 0, level: 1, done: {}, shows: 0, stars: 0, themeId: null, created: Date.now(),
    };
  }

  /* ---------- schermen & hulpjes ---------- */
  function showScreen(id) { document.querySelectorAll('.screen').forEach(s => { s.hidden = s.id !== id; }); document.body.dataset.screen = id; window.scrollTo(0, 0); }
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.timer); toast.timer = setTimeout(() => { t.hidden = true; }, 2400); }
  function openOverlay(html, cls = '') { const ov = $('#overlay'); ov.innerHTML = `<div class="modal ${cls}">${html}</div>`; ov.hidden = false; return ov; }
  function closeOverlay() { const ov = $('#overlay'); ov.hidden = true; ov.innerHTML = ''; }

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

  /* ---------- startscherm ---------- */
  function renderStart() {
    const box = $('#profiles'); box.innerHTML = '';
    DB.profiles.forEach(p => {
      const card = h('div', { class: 'profile card', role: 'button', tabindex: '0' });
      card.innerHTML = `<div class="pav">${Avatar.render(p.look, p.outfit, { bg: false })}</div><b>${esc(p.name)}</b><small>Level ${p.level} · ⭐ ${p.stars}</small><span class="del" role="button" title="Speler verwijderen" aria-label="Speler ${esc(p.name)} verwijderen">✕</span>`;
      card.addEventListener('click', e => { if (e.target.classList.contains('del')) { confirmDelete(p); } else startGame(p); });
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startGame(p); } });
      box.appendChild(card);
    });
    const add = h('button', { class: 'profile card new', type: 'button' }, `<div class="plus">+</div><b>Nieuwe speler</b><small>Maak je eigen model</small>`);
    add.addEventListener('click', () => openCreate());
    box.appendChild(add);
  }
  function confirmDelete(p) {
    openOverlay(`<h2 class="h center">Speler verwijderen?</h2><p class="center">Wil je <b>${esc(p.name)}</b> echt verwijderen? Alle sterren en vrijgespeelde spullen gaan dan weg.</p><div class="row center"><button class="btn ghost" id="del-no" type="button">Nee, laat maar</button><button class="btn" id="del-yes" type="button">Ja, verwijderen</button></div>`);
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
    ITEMS.filter(i => i.cat === 'hair' && i.lvl <= lvl).forEach(it => {
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
    P = p; ui.free = false;
    if (ui.tab === 'bg') ui.tab = 'dress';
    if (!currentTheme()) pickTheme();
    renderAll();
    renderTabs();
    showScreen('screen-game');
  }
  function renderAll() { renderHUD(); renderChallenge(); renderStage(); renderGrid(); }
  function currentTheme() { const t = THEME_BY_ID[P.themeId]; return t && t.lvl <= P.level ? t : null; }
  function pickTheme(exclude) {
    const avail = THEMES.filter(t => t.lvl <= P.level && t.id !== exclude);
    const fresh = avail.filter(t => !P.done[t.id]);
    const t = rand(fresh.length ? fresh : (avail.length ? avail : THEMES));
    P.themeId = t.id; save();
    return t;
  }
  // de setting hoort bij de opdracht; alleen bij vrij spelen kies je zelf
  function currentBg() { if (ui.free) return P.freeBg || 'kamer'; const t = currentTheme(); return t ? t.bg : 'kamer'; }
  const outfitForStage = () => ({ ...P.outfit, bg: currentBg() });

  function renderHUD() {
    $('#hud-name').textContent = P.name;
    $('#hud-level').textContent = 'Level ' + P.level;
    $('#hud-stars').textContent = P.stars;
    const cur = xpForLevel(P.level), next = P.level < MAX_LEVEL ? xpForLevel(P.level + 1) : null;
    const pct = next ? clamp((P.xp - cur) / (next - cur)) * 100 : 100;
    $('#xp-fill').style.width = pct + '%';
    $('#xp-text').textContent = next ? `Nog ${next - P.xp} XP tot level ${P.level + 1}` : 'Hoogste level bereikt! 🏆';
  }

  function renderChallenge() {
    const box = $('#challenge');
    if (ui.free) {
      box.innerHTML = `<div class="ch-emoji">🎨</div><div class="ch-body"><small>Vrij spelen</small><b>Kleed je aan zoals jij wilt</b><p>Geen jury vandaag, wel een modeshow! Kies bij Setting zelf waar je staat.</p></div><div class="ch-actions"><button class="btn violet sm" id="btn-free" type="button">🏆 Terug naar opdrachten</button></div>`;
    } else {
      const t = currentTheme() || pickTheme();
      const hints = t.wants.map(w => `<span class="tag">${TAGS[w].emoji} ${TAGS[w].label}</span>`).join('');
      const col = t.multiColor ? `<span class="tag col">🌈 zoveel kleuren als je kunt</span>`
        : t.colors ? t.colors.map(c => `<span class="tag col"><i style="background:${HUES[c].swatch}"></i> ${HUES[c].label}</span>`).join('') : '';
      const glam = t.glam >= 2.5 ? '💎 super chic' : t.glam >= 1.5 ? '✨ een beetje glamour' : t.glam >= 1 ? '🙂 gewoon leuk' : '👟 lekker simpel';
      const best = P.done[t.id] ? `beste score ${'⭐'.repeat(P.done[t.id])}` : 'nieuw!';
      box.innerHTML = `<div class="ch-emoji">${t.emoji}</div><div class="ch-body"><small>Opdracht · ${best} · 📍 ${SETTING_BY_ID[t.bg].name}</small><b>${t.name}</b><p>${t.desc}</p><div class="tags">${hints}${col}<span class="tag">${glam}</span></div></div><div class="ch-actions"><button class="btn ghost sm" id="btn-other" type="button">🔄 Andere opdracht</button><button class="btn ghost sm" id="btn-free" type="button">🎨 Vrij spelen</button></div>`;
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
    });
  }
  const section = title => h('div', { class: 'section' }, title);
  function noneCard(slot) {
    const b = h('button', { class: 'item none' + (P.outfit[slot] ? '' : ' selected'), type: 'button' }, `<div class="none-ic">🚫</div><span class="name">Geen</span>`);
    b.onclick = () => { Sound.play('klik'); delete P.outfit[slot]; save(); renderStage(); renderGrid(); };
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

  /* ---------- de jury ---------- */
  const wheelDist = (a, b) => { const d = Math.abs(a - b) % 6; return Math.min(d, 6 - d); };
  function evaluate(outfit, theme) {
    const get = s => outfit[s] ? ITEM_BY_ID[outfit[s]] : null;
    const worn = OUTFIT_SLOTS.map(get).filter(Boolean);
    const themed = [...worn, get('pet'), get('mk_face')].filter(Boolean);

    // Thema: hoeveel van je spullen passen erbij?
    let match = 0, bad = 0;
    themed.forEach(it => { if (it.tags.some(t => theme.wants.includes(t))) match++; else if (it.tags.some(t => theme.avoid.includes(t))) bad++; });
    let thema = themed.length ? clamp((match - bad * 0.7) / themed.length) : 0;
    if (match >= 4) thema = clamp(thema + 0.1);
    if (match <= 1) thema = Math.min(thema, 0.45);

    // Kleuren: gaan ze samen?
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

    // Compleet
    const top = get('top');
    const hasTop = !!outfit.dress || !!top, hasBottom = !!outfit.dress || !!outfit.bottom || !!(top && top.full), hasShoes = !!outfit.shoes;
    const compleet = (hasTop ? 0.35 : 0) + (hasBottom ? 0.35 : 0) + (hasShoes ? 0.3 : 0);

    // Glamour: past de hoeveelheid glans bij de opdracht?
    const avg = worn.length ? worn.reduce((a, i) => a + i.glam, 0) / worn.length : 0;
    const max = Math.max(0, ...worn.map(i => i.glam));
    const glamour = clamp(1 - Math.abs((avg * 0.5 + max * 0.5) - theme.glam) / 3);

    // Accessoires
    const accessoires = clamp(ACC_SLOTS.filter(s => outfit[s]).length / 4);

    const factors = { thema, kleur, compleet, glamour, accessoires };
    const judges = JUDGES.map(j => {
      let score = 0;
      for (const [f, w] of Object.entries(j.weights)) score += w * factors[f];
      score = Math.round(score * 100) / 10;
      // Commentaar: bij een hoog cijfer prijzen we het sterkste punt, anders benoemen we het zwakste
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
  // wat komt er vrij tussen twee levels? (aantallen, de spullen zelf blijven een verrassing)
  function unlockSummary(fromLevel, toLevel) {
    const counts = {};
    ITEMS.filter(i => i.lvl > fromLevel && i.lvl <= toLevel).forEach(i => { const k = i.cat.startsWith('mk_') ? 'makeup' : i.cat; counts[k] = (counts[k] || 0) + 1; });
    const colors = HAIR_COLORS.filter(c => c.lvl > fromLevel && c.lvl <= toLevel).length;
    const themes = THEMES.filter(t => t.lvl > fromLevel && t.lvl <= toLevel);
    const labels = { hair: ['kapsel', 'kapsels', '💇'], top: ['top', 'tops', '👕'], bottom: ['broek of rok', 'broeken & rokken', '👖'], dress: ['jurk of pakje', 'jurken & pakjes', '👗'], shoes: ['paar schoenen', 'paar schoenen', '👟'], hat: ['hoedje', 'hoedjes', '👒'], glasses: ['bril', 'brillen', '🕶️'], neck: ['ketting of sjaal', 'kettingen & sjaals', '📿'], bag: ['tas', 'tassen', '👜'], hand: ['ding voor in je hand', 'dingen voor in je hand', '🎈'], back: ['ding voor op je rug', 'dingen voor op je rug', '🦋'], pet: ['huisdier', 'huisdieren', '🐶'], makeup: ['make-up', 'make-up', '💄'] };
    const parts = Object.entries(counts).map(([k, n]) => ({ n, label: labels[k][n === 1 ? 0 : 1], emoji: labels[k][2] }));
    if (colors) parts.push({ n: colors, label: colors === 1 ? 'haarkleur' : 'haarkleuren', emoji: '🎨' });
    return { parts, themes };
  }
  function award(res, theme) {
    let xp = XP_PER_STARS[res.stars];
    const first = !P.done[theme.id];
    if (first) xp += XP_FIRST_TIME;
    const prevLevel = P.level;
    P.xp += xp; P.level = levelFromXp(P.xp);
    P.done[theme.id] = Math.max(P.done[theme.id] || 0, res.stars);
    P.shows++; P.stars += res.stars;
    save();
    return { xp, first, prevLevel, summary: unlockSummary(prevLevel, P.level) };
  }

  function goJury() {
    if (ui.free) return fashionShow();
    const theme = currentTheme() || pickTheme();
    const res = evaluate(P.outfit, theme);
    const gained = award(res, theme);
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
      <div class="xp-gain">+${g.xp} XP${g.first ? ' <small>eerste-keer-bonus!</small>' : ''}</div>
      <div class="xp"><div class="xp-bar"><div id="xp-fill-res"></div></div><small id="xp-text-res"></small></div>
      ${res.stars < 3 ? `<div class="tip">💡 ${TIPS[res.weakest]}</div>` : ''}
      ${lvlUp ? `<div class="levelup"><h3>🎊 Level ${P.level}! 🎊</h3><p>Er staat iets nieuws in je kast:</p><div class="unlocks">${g.summary.parts.map(u => `<div class="unlock-count"><span class="ic">${u.emoji}</span><b>${u.n}</b><span>${u.label}</span></div>`).join('')}</div>${g.summary.themes.length ? `<p class="newtheme">Nieuwe opdracht${g.summary.themes.length > 1 ? 'en' : ''}: ${g.summary.themes.map(t => t.emoji + ' ' + t.name).join(', ')}</p>` : ''}</div>` : ''}
      <div class="row center wrap"><button class="btn ghost" id="res-back" type="button">🪞 Kleedkamer</button><button class="btn ghost" id="res-again" type="button">🔁 Zelfde opdracht</button><button class="btn big" id="res-next" type="button">Volgende opdracht ➜</button></div>`;
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
    $('#res-again').onclick = () => { closeOverlay(); renderAll(); };
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
    if (P.level >= MAX_LEVEL) { openOverlay(`<h2 class="h center">🏆 Alles vrijgespeeld!</h2><p class="center">Je hebt het hoogste level bereikt. Alle kleding, kapsels en decors zijn van jou.</p><div class="row center"><button class="btn" id="nl-close" type="button">Super!</button></div>`); $('#nl-close').onclick = closeOverlay; return; }
    const next = P.level + 1;
    const s = unlockSummary(P.level, next);
    const need = xpForLevel(next) - P.xp;
    openOverlay(`
      <h2 class="h center">🎁 Level ${next}</h2>
      <p class="center">Nog <b>${need} XP</b> te gaan. Dan komt er dit in je kast (wát precies blijft een verrassing):</p>
      <div class="unlocks">${s.parts.map(u => `<div class="unlock-count"><span class="ic">${u.emoji}</span><b>${u.n}</b><span>${u.label}</span></div>`).join('')}</div>
      ${s.themes.length ? `<p class="center newtheme">Nieuwe opdracht${s.themes.length > 1 ? 'en' : ''}: ${s.themes.map(t => t.emoji + ' ' + t.name).join(', ')}</p>` : ''}
      <div class="row center"><button class="btn" id="nl-close" type="button">Aan de slag! ✨</button></div>`);
    $('#nl-close').onclick = closeOverlay;
  }
  function renderSoundButton() { const b = $('#btn-sound'); b.textContent = Sound.isOn() ? '🔊' : '🔇'; b.title = Sound.isOn() ? 'Geluid uit' : 'Geluid aan'; }

  /* ---------- knoppen ---------- */
  function wire() {
    renderSoundButton();
    $('#btn-sound').onclick = () => { Sound.toggle(); renderSoundButton(); };
    $('#btn-next').onclick = showNextLevel;
    $('#create-done').onclick = () => {
      const name = $('#name-input').value.trim().slice(0, 16) || 'Ster';
      const look = { skin: ui.temp.skin, eyes: ui.temp.eyes, face: ui.temp.face, build: ui.temp.build, hairColor: ui.temp.hairColor };
      if (ui.editMode) { P.name = name; P.look = look; P.outfit.hair = ui.temp.hairStyle; save(); startGame(P); }
      else { const p = newProfile(name, look, ui.temp.hairStyle); DB.profiles.push(p); save(); startGame(p); }
    };
    $('#create-cancel').onclick = () => { if (ui.editMode) startGame(P); else { renderStart(); showScreen('screen-start'); } };
    $('#name-input').addEventListener('keydown', e => { if (e.key === 'Enter') $('#create-done').click(); });
    $('#build-range').addEventListener('input', e => { ui.temp.build = +e.target.value; renderCreate(true); });
    $('#hud-profile').onclick = () => { renderStart(); showScreen('screen-start'); };
    $('#btn-look').onclick = () => openCreate(P);
    $('#btn-random').onclick = () => { Sound.play('tada'); randomOutfit(); };
    $('#btn-clear').onclick = () => { Sound.play('klik'); clearOutfit(); };
    $('#btn-photo').onclick = () => { Sound.play('klik'); makePhoto(); };
    $('#btn-jury').onclick = () => { Sound.play('klik'); goJury(); };
    $('#overlay').addEventListener('click', e => { if (e.target.id === 'overlay' && !$('#overlay .jury')) closeOverlay(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#overlay').hidden && !$('#overlay .jury')) closeOverlay(); });
  }

  /* ---------- start ---------- */
  load();
  wire();
  renderStart();
  showScreen('screen-start');
})();

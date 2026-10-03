/* Het naaiatelier. Een proefontwerp verandert je outfit pas bij Opslaan & aantrekken. */
const Designer = (() => {
  const D = ClothingDesigns;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let profile, callbacks, draft, editingId, activeSticker = -1, dirty = false, returnFocus;
  const choice = (value, label, selected, attr) => `<button type="button" class="design-choice" ${attr}="${esc(value)}" aria-pressed="${selected}">${label}</button>`;
  function show(p, cb, cat = 'top') {
    profile = p; callbacks = cb; returnFocus = document.activeElement;
    draft = D.normalize(p.designDraft || { cat }); editingId = p.designDraft?.editingId || null;
    if (!p.customDesigns.some(i => i.id === editingId)) editingId = null;
    dirty = !!p.designDraft; activeSticker = draft.stickers.length - 1;
    render(); $('#design-back').focus();
  }
  function remember() {
    dirty = true; profile.designDraft = { ...draft, editingId }; callbacks.saveDraft();
    $('#design-status').textContent = 'Probeer alles uit. Sla je ontwerp op als het klaar is.';
  }
  function preview() {
    const it = D.item(draft, 'design_preview', profile.id);
    const outfit = D.outfitWith(profile.outfit, it);
    $('#design-model').innerHTML = Avatar.render(profile.look, outfit, { bg: false, items: { [it.id]: it } });
    $('#design-fabric').innerHTML = Avatar.thumb(it, profile.look);
    $('#design-preview-name').textContent = draft.name;
  }
  function render() {
    const type = D.TYPES.find(t => t.id === draft.cat);
    $('#designer').innerHTML = `
      <header class="design-header"><button class="btn ghost sm" id="design-back" type="button">← Terug</button><div><p class="eyebrow">JOUW EIGEN COLLECTIE</p><h1 class="h">✂️ Kleding maken</h1></div><span class="design-free">Helemaal gratis</span></header>
      <div class="design-layout">
        <aside class="design-preview card" aria-label="Voorbeeld van jouw ontwerp">
          <span class="design-preview-label">${editingId ? 'ONTWERP AANPASSEN' : 'IN HET NAAIATELIER'}</span>
          <div id="design-model"></div><div id="design-fabric" aria-label="Kledingstuk van dichtbij"></div>
          <b id="design-preview-name"></b><p>Jouw idee. Jouw stijl. ✨</p>
        </aside>
        <div class="design-workspace" id="design-workspace">
          <section class="design-panel card"><h2>1. Kies je kledingstuk</h2>
            <div class="design-types">${D.TYPES.map(t => choice(t.id, `${t.emoji} ${t.name}`, t.id === draft.cat, 'data-design-type')).join('')}</div>
            <label class="design-field" for="design-shape">Vorm<select id="design-shape">${type.shapes.map(s => `<option value="${s[0]}" ${s[0] === draft.shape ? 'selected' : ''}>${s[1]}</option>`).join('')}</select></label>
          </section>
          <section class="design-panel card"><h2>2. Geef je stof kleur</h2><div class="design-colors">
            ${[0, 1].map(i => `<div><label class="design-color-label" for="design-color-${i}"><input type="color" id="design-color-${i}" value="${draft.c[i]}"><span>${i ? 'Patroonkleur' : 'Hoofdkleur'}</span></label><div class="design-swatches">${D.PALETTE.map(c => `<button type="button" class="design-swatch" style="--swatch:${c}" data-design-color="${i}" data-color="${c}" aria-label="${i ? 'Patroonkleur' : 'Hoofdkleur'} ${c}" aria-pressed="${draft.c[i] === c}"></button>`).join('')}</div></div>`).join('')}
          </div><div class="design-patterns" aria-label="Stofpatroon">${D.PATTERNS.map(([id, name, icon]) => choice(id, `<span aria-hidden="true">${icon}</span> ${name}`, draft.pattern === id, 'data-pattern')).join('')}</div><p class="design-hint" id="design-color-hint">${draft.pattern === 'rainbow' ? 'Regenboogstof gebruikt alle regenboogkleuren.' : draft.pattern === 'plain' ? 'Kies een patroon om ook je tweede kleur te zien.' : 'Tip: tik op een kleurvakje voor elke kleur die je wilt.'}</p></section>
          <section class="design-panel card"><h2>3. Plak er iets leuks op <small id="design-sticker-count"></small></h2>
            <div class="design-sticker-palette">${D.STICKERS.map(s => `<button class="design-sticker-add" type="button" data-add-sticker="${s.id}" aria-label="Sticker ${s.name} toevoegen" title="${s.name}">${s.emoji}</button>`).join('')}</div>
            <div id="design-sticker-editor"></div>
          </section>
          <section class="design-panel card"><h2>4. Geef je ontwerp een naam</h2><label class="design-field" for="design-name">Naam op het label<input id="design-name" maxlength="32" value="${esc(draft.name)}" autocomplete="off"></label><p class="design-hint">Je ontwerp komt in je eigen kledingkast. Je kunt het dragen bij de jury en op het raceparkours.</p></section>
          <section class="design-panel card"><div class="design-library-heading"><h2>Mijn ontwerpen <small>${profile.customDesigns.length}/${D.LIMIT}</small></h2><button class="btn ghost sm" type="button" id="design-new">＋ Nieuw</button></div><div class="design-library">${profile.customDesigns.length ? profile.customDesigns.map(it => `<button class="design-saved${it.id === editingId ? ' selected' : ''}" type="button" data-edit-design="${it.id}" aria-label="${esc(it.name)} aanpassen">${Avatar.thumb(it, profile.look)}<span>${esc(it.name)}</span><small>✎ Aanpassen</small></button>`).join('') : '<p class="design-hint">Hier komen jouw zelfgemaakte kledingstukken te hangen.</p>'}</div></section>
        </div>
      </div>
      <footer class="design-footer"><p id="design-status" role="status">${editingId ? 'Pas je ontwerp aan, of bewaar een nieuwe versie.' : 'Kies, kleur en versier. Je paspop verandert meteen mee!'}</p><div class="row"><button class="btn ghost sm" id="design-copy" type="button" ${editingId ? '' : 'hidden'}>Bewaar als nieuw</button><button class="btn" id="design-save" type="button">Opslaan & aantrekken ✨</button></div></footer>`;
    $('#design-back').onclick = () => { callbacks.exit(); if (returnFocus?.isConnected) returnFocus.focus(); };
    document.querySelectorAll('[data-design-type]').forEach(b => b.onclick = () => {
      if (draft.cat === b.dataset.designType) return;
      draft = D.normalize({ ...draft, cat: b.dataset.designType, shape: null, name: '' }); remember(); render();
      $(`[data-design-type="${draft.cat}"]`).focus();
    });
    $('#design-shape').onchange = e => {
      const oldName = D.normalize({ cat: draft.cat, shape: draft.shape }).name;
      draft.shape = e.target.value;
      if (draft.name === oldName) { draft.name = D.normalize({ cat: draft.cat, shape: draft.shape }).name; $('#design-name').value = draft.name; }
      remember(); preview();
    };
    $('#design-name').oninput = e => { draft.name = e.target.value; remember(); $('#design-preview-name').textContent = draft.name || 'Mijn ontwerp'; };
    [0, 1].forEach(i => $('#design-color-' + i).oninput = e => setColor(i, e.target.value));
    document.querySelectorAll('[data-design-color]').forEach(b => b.onclick = () => setColor(+b.dataset.designColor, b.dataset.color));
    document.querySelectorAll('[data-pattern]').forEach(b => b.onclick = () => {
      draft.pattern = b.dataset.pattern; remember(); preview();
      document.querySelectorAll('[data-pattern]').forEach(x => x.setAttribute('aria-pressed', x === b));
      $('#design-color-hint').textContent = draft.pattern === 'rainbow' ? 'Regenboogstof gebruikt alle regenboogkleuren.' : draft.pattern === 'plain' ? 'Kies een patroon om ook je tweede kleur te zien.' : 'Tip: tik op een kleurvakje voor elke kleur die je wilt.';
    });
    document.querySelectorAll('[data-add-sticker]').forEach(b => b.onclick = () => {
      if (draft.stickers.length >= D.STICKER_LIMIT) return;
      const offset = draft.stickers.length % 3 * 15;
      draft.stickers.push({ kind: b.dataset.addSticker, x: 35 + offset, y: 40 + offset, size: 22, rotation: 0 });
      activeSticker = draft.stickers.length - 1; remember(); renderStickers(); preview();
      $('#design-sticker-editor [aria-pressed="true"]').focus();
    });
    document.querySelectorAll('[data-edit-design]').forEach(b => b.onclick = () => switchDraft(() => {
      const it = profile.customDesigns.find(i => i.id === b.dataset.editDesign);
      draft = D.normalize(it); editingId = it.id; activeSticker = draft.stickers.length - 1;
    }));
    $('#design-new').onclick = () => switchDraft(() => { draft = D.normalize({ cat: draft.cat }); editingId = null; activeSticker = -1; });
    $('#design-save').onclick = () => commit(false);
    $('#design-copy').onclick = () => commit(true);
    renderStickers(); preview();
  }
  function setColor(index, color) {
    draft.c[index] = color; $('#design-color-' + index).value = color;
    document.querySelectorAll(`[data-design-color="${index}"]`).forEach(b => b.setAttribute('aria-pressed', b.dataset.color === color));
    remember(); preview();
  }
  function renderStickers() {
    const s = draft.stickers[activeSticker];
    $('#design-sticker-count').textContent = `${draft.stickers.length}/${D.STICKER_LIMIT}`;
    document.querySelectorAll('[data-add-sticker]').forEach(b => b.disabled = draft.stickers.length >= D.STICKER_LIMIT);
    const ranges = [['x', 'Links ↔ rechts', 0, 100], ['y', 'Boven ↔ onder', 0, 100], ['size', 'Grootte', 12, 42], ['rotation', 'Draaien', -180, 180]];
    $('#design-sticker-editor').innerHTML = draft.stickers.length ? `<div class="design-sticker-list">${draft.stickers.map((st, i) => choice(i, `${D.STICKERS.find(x => x.id === st.kind).emoji} ${i + 1}`, i === activeSticker, 'data-sticker-index')).join('')}<button class="btn ghost sm" id="design-remove-sticker" type="button">Verwijder sticker</button></div>${s ? `<div class="design-ranges">${ranges.map(([key, label, min, max]) => `<label for="design-sticker-${key}">${label}<output id="design-value-${key}">${s[key]}${key === 'rotation' ? '°' : ''}</output><input type="range" id="design-sticker-${key}" min="${min}" max="${max}" step="1" value="${s[key]}" data-sticker-key="${key}"></label>`).join('')}</div>` : ''}<p class="design-hint">Kies een geplakte sticker en schuif hem op zijn plek. Stickers blijven op de stof${draft.cat === 'shoes' ? ' en verschijnen op beide schoenen' : ''}.</p>` : '<p class="design-hint">Tik op een sticker. Daarna kun je hem verschuiven, draaien en groter maken. Maximaal vijf per kledingstuk.</p>';
    document.querySelectorAll('[data-sticker-index]').forEach(b => b.onclick = () => { activeSticker = +b.dataset.stickerIndex; renderStickers(); $(`[data-sticker-index="${activeSticker}"]`).focus(); });
    document.querySelectorAll('[data-sticker-key]').forEach(input => input.oninput = () => {
      const key = input.dataset.stickerKey; s[key] = +input.value;
      $('#design-value-' + key).textContent = input.value + (key === 'rotation' ? '°' : ''); remember(); preview();
    });
    if ($('#design-remove-sticker')) $('#design-remove-sticker').onclick = () => {
      draft.stickers.splice(activeSticker, 1); activeSticker = draft.stickers.length - 1; remember(); renderStickers(); preview();
      (document.querySelector('#design-sticker-editor [aria-pressed="true"]') || $('[data-add-sticker]')).focus();
    };
  }
  function switchDraft(change) {
    if (dirty && !window.confirm('Je hebt dit ontwerp nog niet in je kast opgeslagen. Wil je een ander ontwerp openen?')) return;
    change(); dirty = false; delete profile.designDraft; callbacks.saveDraft(); render();
    $('#design-workspace').scrollTop = 0; $('#design-shape').focus();
  }
  function commit(copy) {
    draft = D.normalize(draft);
    const result = callbacks.commit(draft, copy ? null : editingId);
    if (result.error) { $('#design-status').textContent = result.error; return; }
    editingId = result.item.id; dirty = false; render();
    $('#design-status').textContent = 'Opgeslagen! Je draagt jouw ontwerp. Je vindt het ook in je kledingkast.';
    $('#design-save').focus(); Sound.play('pop');
  }
  return { show };
})();

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
    DB.settings = { developerMode: DB.settings?.developerMode === true };
    DB.profiles.forEach(migrate);
  }
  // oude spelers meenemen naar de nieuwe versie
  function migrate(p) {
    ClothingDesigns.restore(p);
    p.look = p.look || {};
    Object.assign(p.look,FaceFeatures.normalize(p.look));
    if(p.look.hairParts)p.look.hairParts=HairParts.normalize(p.look.hairParts);
    if(p.look.customHair)p.look.customHair=HairParts.normalize(p.look.customHair);
    p.look.hairCollection=HairParts.collection(p.look);
    if (!FACE_SHAPES.some(f => f.id === p.look.face)) p.look.face = 'ovaal';
    if (typeof p.look.build !== 'number') p.look.build = 40;
    if (!HAIR_COLORS.some(c => c.id === p.look.hairColor)) p.look.hairColor = 'bruin';
    p.outfit = p.outfit || {};
    delete p.outfit.bg;
    // kapsels uit eerdere versies krijgen het kapsel dat er nu het meest op lijkt
    if (HAIR_ALIASES[p.outfit.hair]) p.outfit.hair = HAIR_ALIASES[p.outfit.hair];
    if (Array.isArray(p.owned)) p.owned = p.owned.map(id => HAIR_ALIASES[id] || id);
    for (const slot of Object.keys(p.outfit)) {
      const it = ITEM_BY_ID[p.outfit[slot]];
      if (!it || (it.custom && (it.ownerId !== p.id || it.cat !== slot))) delete p.outfit[slot];
    }
    if (!p.outfit.hair) p.outfit.hair = 'hair_lang';
    if (!SETTING_BY_ID[p.freeBg]) p.freeBg = 'kamer';
    p.done = p.done || {};
    p.level = levelFromXp(p.xp || 0);
    if (typeof p.coins !== 'number') p.coins = COINS_START;
    // wie al speelde, houdt alles wat toen open stond
    if (!Array.isArray(p.owned)) p.owned = ITEMS.filter(i => !i.custom && i.lvl <= p.level).map(i => i.id);
    p.owned = p.owned.filter(id => ITEM_BY_ID[id] && (!ITEM_BY_ID[id].custom || ITEM_BY_ID[id].ownerId === p.id));
    p.owned = [...new Set([...p.owned, ...COMPANION_GIFTS, ...p.customDesigns.map(i => i.id)])];
    for (const slot of Object.keys(p.outfit)) if (!p.owned.includes(p.outfit[slot])) p.owned.push(p.outfit[slot]);
    if (!['mono','buren','tegenover'].includes(p.colorMode)) p.colorMode = null;
    if (!['weather','budget'].includes(p.learningMode)) p.learningMode = null;
    if(p.learningMode==='budget') {
      const task=THEME_BY_ID[p.themeId], run=p.budgetRun;
      if(task?.learning!=='budget') {p.learningMode=null;p.budgetRun=null;}
      else if(!run||run.themeId!==task.id||!Array.isArray(run.purchases)||!Number.isFinite(run.spent)) {
        p.budgetRun=LearningChallenges.startBudget(task);
      }
    }
  }
  function save() { if (P) ClothingDesigns.touch(P); try { localStorage.setItem(SAVE_KEY, JSON.stringify(DB)); return true; } catch (e) { return false; } }

  function levelFromXp(xp) { let l = 1; while (l < MAX_LEVEL && xp >= xpForLevel(l + 1)) l++; return l; }
  const owned = it => (!it.custom || it.ownerId === P.id) && P.owned.includes(it.id);
  const itemsOf = slot => ITEMS.filter(i => i.cat === slot && owned(i)).sort((a, b) => a.lvl - b.lvl || a.name.localeCompare(b.name));
  const shopItems = slot => ITEMS.filter(i => !i.custom && i.lvl <= P.level && !owned(i) && (!slot || i.cat === slot)).sort((a, b) => priceOf(a) - priceOf(b) || a.name.localeCompare(b.name));

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
  function showScreen(id) {
    closeGameDialogs();
    if(document.body.dataset.screen==='screen-fashion-room'&&id!=='screen-fashion-room')FashionRoom.hide();
    if(!['screen-game','screen-designer','screen-create'].includes(id))FashionPreview.pause();
    if (document.body.dataset.screen === 'screen-kitchen' && id !== 'screen-kitchen') Kitchen.hide();
    if (document.body.dataset.screen === 'screen-parkour' && id !== 'screen-parkour') Parkour.hide();
    if (document.body.dataset.screen === 'screen-speeltuin' && id !== 'screen-speeltuin') Speeltuin.hide();
    if (document.body.dataset.screen === 'screen-town-activities' && id !== 'screen-town-activities') TownActivities.hide();
    if (document.body.dataset.screen === 'screen-world' && id !== 'screen-world') World.hide();
    document.querySelectorAll('.screen').forEach(s => { s.hidden = s.id !== id; }); document.body.dataset.screen = id; window.scrollTo(0, 0);
  }
  /* ---------- het dorp: vanuit hier loop je naar de huisjes ---------- */
  function enterWorld(p) {
    P = p; ui.free = false;
    if (ui.tab === 'bg') ui.tab = 'dress';
    showScreen('screen-world');
    World.show(P, {
      save,
      toast,
      reward: (stars,id) => townReward(stars,id),
      enter: id => {
        if (id === 'kleedkamer') openFashionRoom('modehuis');
        else if (id === 'winkel') openFashionRoom('winkel');
        else if (id === 'puzzel') openColorAtelier();
        else if (id === 'atelier') openFashionRoom('atelier');
        else if (id === 'keuken' || id === 'supermarkt') {
          closeOverlay();showScreen('screen-kitchen');
          Kitchen.show(P,id,{save,exit:()=>enterWorld(P)});
        }
        else if (id === 'race') openParkour();
        else if (id === 'speeltuin') openSpeeltuin();
        else if (id === 'leshuis') openLearning();
        else if (id === 'salon') openFashionRoom('salon');
        else if (['disco','balzaal','knuffel','foto'].includes(id)) openTownActivity(id);
      },
    });
  }
  function openParkour(courseId) {
    if (!P) return;
    if(!ParkourRules.courses.some(c=>c.id===courseId)){openFashionRoom('race');return;}
    closeOverlay();
    showScreen('screen-parkour');
    Parkour.show(P, {
      save,
      exit: () => openFashionRoom('race'),
      reward: (stars, courseId) => {
        const gained = award(P, { stars }, { id: `parkour_${courseId}` }, false);
        return { ...gained, extra: P.level > gained.prevLevel ? levelUpHtml(gained, P) : '' };
      },
    },courseId);
  }
  function townReward(stars,id) {
    const gained=award(P,{stars},{id:`town_${id}`},false);
    return {...gained,extra:P.level>gained.prevLevel?levelUpHtml(gained,P):''};
  }
  function openTownActivity(id) {
    closeOverlay();showScreen('screen-town-activities');
    TownActivities.show(P,id,{save,exit:()=>enterWorld(P),reward:townReward,photo:(bg,data)=>makePhoto(bg,data)});
  }
  function openSpeeltuin(selectedGame) {
    if (!P) return;
    if(!['springbaan','trampoline','klimrek','ballenbak'].includes(selectedGame)){openFashionRoom('play');return;}
    closeOverlay();
    showScreen('screen-speeltuin');
    Speeltuin.show(P, {
      save,
      exit: () => openFashionRoom('play'),
      reward: (stars, gameId) => {
        const gained = award(P, { stars }, { id: `speeltuin_${gameId}` }, false);
        return { ...gained, extra: P.level > gained.prevLevel ? levelUpHtml(gained, P) : '' };
      },
    },selectedGame);
  }
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.timer); toast.timer = setTimeout(() => { t.hidden = true; }, 2400); }
  function openFashionRoom(kind){
    ui.fashionRoom=kind;closeOverlay();showScreen('screen-fashion-room');
    FashionRoom.show(P,kind,{action:id=>{
      if(id==='exit'){ui.fashionRoom=null;enterWorld(P);}
      else if(id.startsWith('color_')){
        if(['color_mono','color_buren','color_tegenover'].includes(id))openColorAtelier(id.slice(6));
        else if(!P.colorMode){toast('Kies eerst een kleurenopdracht.');}
        else if(id==='color_closet')startGame(P);
        else {startGame(P);goJury();}
      }
      else if(id.startsWith('shop_')){
        if(id==='shop_fitting')startGame(P);
        else openShop({shop_clothes:'dress',shop_shoes:'shoes',shop_accessories:'ears',shop_beauty:'mk_eyes'}[id]||null);
      }
      else if(id.startsWith('lesson_')){
        if(id==='lesson_weather'||id==='lesson_budget')openLearning(id==='lesson_weather'?'weather':'budget');
        else if(!P.learningMode){toast('Kies eerst een weer- of winkelopdracht.');}
        else if(id==='lesson_closet')startGame(P);
        else {startGame(P);goJury();}
      }
      else if(id.startsWith('play_'))openSpeeltuin(id.slice(5));
      else if(id.startsWith('race_'))openParkour(id.slice(5));
      else if(id==='atelier')openFashionRoom('atelier');
      else if(id==='closet')startGame(P);
      else if(id==='mirror')openCreate(P);
      else if(['haircut','haircolor','haircollection'].includes(id)){
        openCreate(P);
        if(id==='haircut')$('#hair-create').click();
        else {document.querySelector(`[data-salon-tab=${id==='haircolor'?'color':'hair'}]`)?.click();const target=$(id==='haircolor'?'#hair-swatches':'#hair-collection');target.scrollIntoView({block:'center'});const button=target.querySelector('button');if(button)button.focus({preventScroll:true});}
      }
      else if(id==='jury'){startGame(P);goJury();}
      else {openDesigner();if(id==='cooking')$('[data-design-theme="cooking"]').click();if(id==='collection')$('.design-library-heading').scrollIntoView({block:'start'});}
    }});
  }
  function openDesigner(cat) {
    if (!P) return;
    const from = document.body.dataset.screen;
    closeOverlay(); showScreen('screen-designer');
    Designer.show(P, {
      saveDraft: save,
      remove: id => {
        const item=P.customDesigns.find(it=>it.id===id);
        if(!item)return {error:'Dit ontwerp staat niet meer in je collectie.'};
        const previous={customDesigns:P.customDesigns,owned:P.owned,outfit:P.outfit,designDraft:P.designDraft,designUsed:P.designUsed};
        const dadOutfit=P.parkour?.dadOutfit;
        const clean=outfit=>{
          const next={...outfit};
          for(const [slot,value] of Object.entries(next))if(value===id){
            delete next[slot];
            if(slot==='dress'||slot==='top')next.top='top_tshirt_blauw';
            if(slot==='dress'||slot==='bottom')next.bottom='bot_jeans';
            if(slot==='shoes')next.shoes='sh_sneakers';
          }
          return next;
        };
        P.customDesigns=P.customDesigns.filter(it=>it.id!==id);P.owned=P.owned.filter(value=>value!==id);P.outfit=clean(P.outfit);
        if(dadOutfit)P.parkour.dadOutfit=clean(dadOutfit);
        if(P.designDraft?.editingId===id)delete P.designDraft;
        if(!save()){Object.assign(P,previous);if(dadOutfit)P.parkour.dadOutfit=dadOutfit;return {error:'Verwijderen is niet gelukt. Je ontwerp is behouden. Probeer opnieuw.'};}
        ClothingDesigns.unregister(id);return {ok:true};
      },
      exit: () => {
        if(from==='screen-fashion-room')openFashionRoom('atelier');
        else if (from === 'screen-world') enterWorld(P);
        else { renderAll(); renderTabs(); showScreen('screen-game'); }
      },
      commit: (draft, editingId, keepId) => {
        const existing = P.customDesigns.find(it => it.id === editingId);
        // Kast vol? Dan maakt het ontwerp dat het langst niet gedragen is plaats.
        const removed = existing ? null : ClothingDesigns.makeRoom(P, [keepId]);
        if (!existing && !removed && P.customDesigns.length >= ClothingDesigns.LIMIT) return { error: `Je kast heeft al ${ClothingDesigns.LIMIT} eigen ontwerpen. Pas een bestaand ontwerp aan.` };
        const id = existing?.id || `custom_${P.id}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`;
        const it = ClothingDesigns.item(draft, id, P.id);
        const previous = { customDesigns: P.customDesigns, owned: P.owned, outfit: P.outfit, designDraft: P.designDraft, designUsed: P.designUsed };
        const dadOutfit = P.parkour?.dadOutfit;
        P.customDesigns = existing ? P.customDesigns.map(d => d.id === id ? it : d) : [...P.customDesigns.filter(d => d !== removed), it];
        P.owned = [...new Set([...P.owned.filter(i => i !== removed?.id), id])];
        const clean = outfit => Object.fromEntries(Object.entries(outfit).filter(([slot, itemId]) => itemId !== id || slot === it.cat));
        P.outfit = ClothingDesigns.outfitWith(clean(P.outfit), it);
        if (dadOutfit) P.parkour.dadOutfit = clean(dadOutfit);
        delete P.designDraft;
        if (!save()) {
          Object.assign(P, previous); if (dadOutfit) P.parkour.dadOutfit = dadOutfit;
          return { error: 'Opslaan is niet gelukt. Je ontwerp staat nog hier. Maak ruimte in je browser en probeer opnieuw.' };
        }
        ClothingDesigns.register(it);
        if (removed) ClothingDesigns.unregister(removed.id);
        ui.tab = CATEGORIES.find(c => (c.slots || [c.id]).includes(it.cat))?.id || it.cat;
        return { item: it, removed };
      },
    }, ClothingDesigns.TYPES.some(t => t.id === cat) ? cat : 'top');
  }
  function openOverlay(html, cls = '') { closeGameDialogs(); const ov = $('#overlay'); ov.innerHTML = `<div class="modal ${cls}">${html}</div>`; ov.hidden = false; ov.scrollTop = 0; return ov; }
  function closeGameDialogs() { document.querySelectorAll('.game-dialog[open]').forEach(dialog => dialog.close()); }
  function closeOverlay() { const ov = $('#overlay'); ov.hidden = true; ov.innerHTML = ''; }
  const modalLocked = () => !!$('#overlay .jury');

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
      card.addEventListener('click', e => { if (e.target.classList.contains('del')) { confirmDelete(p); } else enterWorld(p); });
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enterWorld(p); } });
      box.appendChild(card);
    });
    const add = h('button', { class: 'profile card new', type: 'button' }, `<div class="plus">+</div><b>Nieuwe speler</b><small>Maak je eigen model</small>`);
    add.addEventListener('click', () => openCreate());
    box.appendChild(add);
  }
  function confirmDelete(p) {
    openOverlay(`<h2 class="h center">Speler verwijderen?</h2><p class="center">Wil je <b>${esc(p.name)}</b> echt verwijderen? Alle sterren, munten en gekochte spullen gaan dan weg.</p><div class="row center"><button class="btn ghost" id="del-no" type="button">Nee, laat maar</button><button class="btn" id="del-yes" type="button">Ja, verwijderen</button></div>`);
    $('#del-no').onclick = closeOverlay;
    $('#del-yes').onclick = () => { DB.profiles = DB.profiles.filter(x => x.id !== p.id); save(); closeOverlay(); renderStart(); };
  }

  /* ---------- model maken / aanpassen ---------- */
  function openCreate(profile) {
    ui.createReturn = document.body.dataset.screen;
    ui.editMode = !!profile;ui.salonPanel='';$('#screen-create').classList.toggle('salon-editor',!!profile);
    ui.temp = profile
      ? { ...FaceFeatures.normalize(profile.look), skin: profile.look.skin, eyes: profile.look.eyes, face: profile.look.face, build: profile.look.build, hairColor: profile.look.hairColor, hairParts: profile.look.hairParts?HairParts.normalize(profile.look.hairParts):null, customHair: profile.look.customHair?HairParts.normalize(profile.look.customHair):null, hairCollection:HairParts.collection(profile.look), activeHairId:profile.look.activeHairId||null, hairStyle: profile.outfit.hair || 'hair_lang', name: profile.name }
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
    if(ui.editMode){
      const screen=$('#screen-create'),options=screen.querySelector('.options');
      let dock=screen.querySelector('.salon-dock');if(!dock){dock=document.createElement('nav');dock.className='salon-dock';dock.setAttribute('aria-label','Uiterlijk aanpassen');dock.innerHTML=[['hair','💇','Kapsels'],['face','🙂','Gezicht'],['color','🎨','Haarkleur'],['name','🏷️','Naam']].map(([id,icon,name])=>`<button type="button" data-salon-tab="${id}" aria-pressed="false"><span>${icon}</span>${name}</button>`).join('');screen.append(dock);const close=document.createElement('button');close.type='button';close.id='salon-panel-close';close.className='btn ghost';close.textContent='✕';close.setAttribute('aria-label','Keuzes sluiten');options.prepend(close);}
      const select=id=>{ui.salonPanel=id;screen.dataset.panel=id;options.classList.toggle('salon-tray-open',!!id);screen.querySelectorAll('.options>.field').forEach((el,i)=>el.classList.toggle('salon-field-active',({name:[0],face:[1,2,3],hair:[4],color:[5]})[id]?.includes(i)||false));dock.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.salonTab===id)));options.scrollTop=0;requestAnimationFrame(()=>FashionPreview.layout('create-preview'));};
      dock.querySelectorAll('button').forEach(b=>b.onclick=()=>select(ui.salonPanel===b.dataset.salonTab?'':b.dataset.salonTab));$('#salon-panel-close').onclick=()=>select('');select(ui.salonPanel||'');
    }
    const styles = ui.editMode ? ITEMS.filter(i => i.cat === 'hair' && owned(i)) : ITEMS.filter(i => i.cat === 'hair' && i.lvl <= 1);
    const lvl = ui.editMode ? P.level : 1;
    const outfit = ui.editMode ? { ...P.outfit, hair: t.hairStyle } : { hair: t.hairStyle, top: 'top_tshirt_blauw', bottom: 'bot_jeans', shoes: 'sh_sneakers' };
    if(ui.editMode)FashionPreview.mount($('#create-preview'),{look:t,outfit});
    else $('#create-preview').innerHTML = Avatar.render(t, outfit, { bg: false });
    if (previewOnly) return;
    swatches($('#skin-swatches'), SKINS.map(s => ({ id: s.id, c: s.c, title: 'Huidskleur' })), t.skin, id => { t.skin = id; renderCreate(); });
    swatches($('#eye-swatches'), EYES.map(e => ({ id: e.id, c: e.c, title: e.name })), t.eyes, id => { t.eyes = id; renderCreate(); });
    $('#hair-custom-status').textContent=t.hairParts?'Voorbeeld: je eigen kapsel. Sla je uiterlijk op om het te dragen.':'';
    $('#hair-own').hidden=!t.customHair;$('#hair-own').onclick=()=>{t.hairParts=HairParts.normalize(t.customHair);renderCreate();};
    t.hairCollection=HairParts.collection(t);
    const editHair=entry=>HairStudio.open({...t,_level:lvl},outfit,(parts,info)=>{
      Object.assign(t,info.look||{});
      if(info.faceOnly){renderCreate();return;}
      const item={id:info.id||'hair_'+crypto.randomUUID(),name:info.name,parts:{...parts}};
      const index=t.hairCollection.findIndex(x=>x.id===item.id);
      if(index<0)t.hairCollection.push(item);else t.hairCollection[index]=item;
      t.hairParts=parts;t.customHair={...parts};t.activeHairId=item.id;renderCreate();
    },entry);
    $('#hair-create').onclick=()=>editHair(null);
    let faceButton=$('#face-create');if(!faceButton){faceButton=document.createElement('button');faceButton.id='face-create';faceButton.className='btn mint';faceButton.textContent='🙂 Mijn gezicht maken';$('#eye-swatches').after(faceButton);}
    faceButton.onclick=()=>HairStudio.open({...t,_level:lvl},outfit,(parts,info)=>{Object.assign(t,info.look);renderCreate();},null,'face');
    let library=$('#hair-collection');
    if(!library){library=document.createElement('div');library.id='hair-collection';$('#hair-styles').before(library);}
    library.replaceChildren();
    const title=document.createElement('h3');title.textContent='Mijn kapsels ('+t.hairCollection.length+')';library.append(title);
    const grid=document.createElement('div');grid.className='hair-collection-grid';library.append(grid);
    for(const entry of t.hairCollection){
      const card=document.createElement('div');card.className='hair-collection-card';
      const wear=document.createElement('button');wear.type='button';wear.className='btn ghost';wear.dataset.hairWear=entry.id;
      const selected=!!t.hairParts&&(t.activeHairId?t.activeHairId===entry.id:JSON.stringify(HairParts.normalize(t.hairParts))===JSON.stringify(entry.parts));
      wear.setAttribute('aria-pressed',selected);
      wear.innerHTML=Avatar.render({...t,hairParts:entry.parts},outfit,{bg:false});
      const label=document.createElement('span');label.textContent=entry.name;wear.append(label);
      wear.onclick=()=>{t.hairParts={...entry.parts};t.customHair={...entry.parts};t.activeHairId=entry.id;renderCreate();};
      const edit=document.createElement('button');edit.type='button';edit.className='btn ghost sm';edit.dataset.hairEdit=entry.id;edit.textContent='✎ Aanpassen';edit.setAttribute('aria-label',entry.name+' aanpassen');edit.onclick=()=>editHair(entry);
      const remove=document.createElement('button');remove.type='button';remove.className='btn ghost sm';remove.dataset.hairDelete=entry.id;remove.textContent='Verwijderen';remove.setAttribute('aria-label',entry.name+' verwijderen');
      remove.onclick=()=>{
        const dialog=document.createElement('dialog');dialog.className='hair-delete-dialog';dialog.setAttribute('aria-labelledby','hair-delete-title');dialog.setAttribute('aria-describedby','hair-delete-message');
        dialog.innerHTML='<h2 id="hair-delete-title">Kapsel verwijderen?</h2><p id="hair-delete-message"></p><p>Je huidige uiterlijk blijft hetzelfde. Sla daarna je uiterlijk op om deze wijziging te bewaren.</p><div class="row"><button type="button" class="btn ghost" data-hair-delete-cancel>Toch houden</button><button type="button" class="btn" data-hair-delete-confirm>Ja, verwijderen</button></div>';
        dialog.querySelector('#hair-delete-message').textContent='Weet je zeker dat je „'+entry.name+'” uit je collectie wilt verwijderen?';
        const close=()=>{dialog.close();dialog.remove();if(remove.isConnected)remove.focus();};
        dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
        dialog.querySelector('[data-hair-delete-cancel]').onclick=close;
        dialog.querySelector('[data-hair-delete-confirm]').onclick=()=>{
          t.hairCollection=t.hairCollection.filter(item=>item.id!==entry.id);
          if(t.activeHairId===entry.id)t.activeHairId=null;
          if(t.customHair&&JSON.stringify(HairParts.normalize(t.customHair))===JSON.stringify(entry.parts))t.customHair=null;
          close();renderCreate();$('#hair-create').focus();
        };
        document.body.append(dialog);dialog.showModal();dialog.querySelector('[data-hair-delete-cancel]').focus();
      };
      card.append(wear,edit,remove);grid.append(card);
    }
    const hs = $('#hair-styles'); hs.innerHTML = '';
    styles.forEach(it => {
      const b = h('button', { class: 'item' + (!t.hairParts && it.id === t.hairStyle ? ' selected' : ''), type: 'button' }, Avatar.thumb(it, { ...t, _hair: it.id }) + `<span class="name">${it.name}</span>`);
      b.onclick = () => { Sound.play('pop'); t.hairStyle = it.id; t.hairParts=null; renderCreate(); };
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
  function renderAll() { renderHUD(); renderChallenge(); renderStage(); renderGrid(); $('#btn-fashion-room').textContent=ui.fashionRoom==='winkel'?'← Sterrenwinkel':P.learningMode?'← Weer & Winkelhuis':P.colorMode?'← Kleurenhuis':'← Modehuis'; }
  // kleurenopdrachten: de gevraagde kleuren worden per keer gekozen
  const WHEEL = ['rood', 'oranje', 'geel', 'groen', 'blauw', 'paars'];
  function ruleColors(rule) {
    const i = Math.floor(Math.random() * 6);
    if (rule === 'mono') return [WHEEL[i]];
    if (rule === 'tegenover') return [WHEEL[i], WHEEL[(i + 3) % 6]];
    return [WHEEL[i], WHEEL[(i + 1) % 6]];
  }
  function effectiveTheme(t, colors) {
    if (!t || !t.rule) return t;
    const cols = colors && colors.length ? colors : ruleColors(t.rule);
    const lab = i => cols[i] ? HUES[cols[i]].label : '';
    return { ...t, colors: cols, desc: t.desc.replace('{a}', lab(0)).replace('{b}', lab(1)) };
  }
  function currentTheme() {
    const t = THEME_BY_ID[P.themeId];
    if (!t || (t.lvl > P.level && !(P.colorMode && t.rule===P.colorMode))) return null;
    if (t.rule && !(P.themeColors && P.themeColors.length)) { P.themeColors = ruleColors(t.rule); save(); }
    return effectiveTheme(t, P.themeColors);
  }
  function pickTheme(exclude, maxLevel = P.level) {
    if (P.learningMode) {
      const available=THEMES.filter(t=>t.learning===P.learningMode&&t.lvl<=maxLevel);
      const choices=available.filter(t=>t.id!==exclude);
      if(available.length){const t=rand(choices.length?choices:available);selectLearningTheme(t);return t;}
      P.learningMode=null;
    }
    if (P.colorMode) {
      const rule=P.colorMode, choices=ColorChallenges.palettes(rule,P.owned,ITEM_BY_ID);
      if (choices.length) {
        const t=THEMES.find(t=>t.rule===rule);
        const alternatives=choices.filter(c=>JSON.stringify(c)!==JSON.stringify(P.themeColors));
        P.themeId=t.id; P.themeColors=rand(alternatives.length?alternatives:choices); save();
        return effectiveTheme(t,P.themeColors);
      }
      P.colorMode=null;
    }
    const avail = THEMES.filter(t => !t.learning && t.lvl <= maxLevel && t.id !== exclude);
    const fresh = avail.filter(t => !P.done[t.id]);
    const t = rand(fresh.length ? fresh : (avail.length ? avail : THEMES));
    P.themeId = t.id; P.themeColors = t.rule ? ruleColors(t.rule) : null; save();
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
    if(t.learning)return `<div class="tags"><span class="tag">${t.learning==='weather'?'🌦️ Passend bij het weer':'🛍️ Slim combineren'}</span><span class="tag">👗 Complete outfit</span></div>`;
    const hints = t.wants.map(w => `<span class="tag">${TAGS[w].emoji} ${TAGS[w].label}</span>`).join('');
    const col = t.multiColor ? `<span class="tag col">🌈 zoveel kleuren als je kunt</span>`
      : t.colors ? t.colors.map(c => `<span class="tag col"><i style="background:${HUES[c].swatch}"></i> ${HUES[c].label}</span>`).join('') : '';
    const glam = t.glam >= 2.5 ? '💎 super chic' : t.glam >= 1.5 ? '✨ een beetje glamour' : t.glam >= 1 ? '🙂 gewoon leuk' : '👟 lekker simpel';
    if (t.rule) return `<div class="tags">${col}<span class="tag">👗 Complete outfit</span></div>`;
    return `<div class="tags">${hints}${col}<span class="tag">${glam}</span></div>`;
  }
  // bij een kleurenopdracht staat het wiel op de kaart in plaats van de emoji
  const themeIcon = t => t.rule ? `<div class="ch-wheel">${wheelSvg(t.colors)}</div>` : `<div class="ch-emoji">${t.emoji}</div>`;
  function colorLesson(t) {
    if(t.learning) {
      return `<details class="color-lesson" open><summary>📝 Dit wil de jury zien</summary><ul class="learning-checks" id="learning-checks">${learningChecks(t)}</ul><p>💡 ${t.lesson}</p>${t.learning==='budget'?budgetSummary(t):''}</details><details class="color-lesson"><summary>🎨 Kleurtip erbij</summary><p>${ColorChallenges.lesson(t)}</p></details>`;
    }
    return '<details class="color-lesson" '+(t.rule?'open':'')+'><summary>🌸 Kleurenlesje van Madame Fleur</summary><p>'+ColorChallenges.lesson(t)+'</p><small>We kijken naar de hoofdkleur van elk kledingstuk. Wit, zwart, grijs, bruin, goud en zilver mogen als neutrale kleuren erbij.</small></details>';
  }
  // Vinkjes verschijnen meteen terwijl je aankleedt, zodat je ziet wat nog mist.
  const learningChecks = t => LearningChallenges.assess(P.outfit,t,ITEM_BY_ID,P.budgetRun).list.map(c=>`<li class="${c.ok?'ok':''}">${c.ok?'✅':'⬜'} ${c.label}</li>`).join('');
  function refreshLearningChecks() {
    const ul=$('#learning-checks'), t=currentTheme();
    if(ul&&t?.learning) ul.innerHTML=learningChecks(t);
  }
  function renderChallenge() {
    const box = $('#challenge');
    const summaryTheme = ui.free ? null : currentTheme() || pickTheme();
    $('#challenge-emoji').textContent = summaryTheme?.emoji || '🎨';
    $('#challenge-title').textContent = summaryTheme?.name || 'Jouw eigen modeshow';
    $('#challenge-mode').textContent = ui.free ? 'Vrij spelen' : 'Jouw opdracht';
    if (ui.free) {
      box.innerHTML = `<div class="ch-emoji">🎨</div><div class="ch-body"><small>Vrij spelen</small><b>Kleed je aan zoals jij wilt</b><p>Geen jury vandaag, wel een modeshow! Kies bij Setting zelf waar je staat.</p></div><div class="ch-actions"><button class="btn violet sm" id="btn-free" type="button">🏆 Terug naar opdrachten</button></div>`;
    } else {
      const t = currentTheme() || pickTheme();
      const best = P.done[t.id] ? `beste score ${'⭐'.repeat(P.done[t.id])}` : 'nieuw!';
      box.innerHTML = `${themeIcon(t)}<div class="ch-body"><small>Opdracht · ${best} · 📍 ${SETTING_BY_ID[t.bg].name}</small><b>${t.name}</b><p>${t.desc}</p>${themeTags(t)}${colorLesson(t)}</div><div class="ch-actions"><button class="btn ghost sm" id="btn-other" type="button">🔄 Andere opdracht</button><button class="btn ghost sm" id="btn-free" type="button">🎨 Vrij spelen</button></div>`;
      if (P.colorMode || P.learningMode) {
        const exit=h('button',{class:'btn ghost sm',type:'button'},'👗 Gewone opdrachten');
        exit.onclick=()=>{P.colorMode=null;P.learningMode=null;P.budgetRun=null;pickTheme();renderAll();};
        box.querySelector('.ch-actions').appendChild(exit);
      }
      $('#btn-other').onclick = () => { Sound.play('klik'); pickTheme(t.id); renderChallenge(); renderStage(); };
    }
    $('#btn-free').onclick = () => { Sound.play('klik'); ui.free = !ui.free; if (!ui.free && ui.tab === 'bg') ui.tab = 'dress'; renderChallenge(); renderStage(); renderTabs(); renderGrid(); };
    $('#btn-jury').textContent = ui.free ? '🎉 Modeshow!' : 'Naar de jury! ✨';
  }

  function renderStage() {
    FashionPreview.mount($('#stage'),{look:P.look,outfit:outfitForStage()});
    $('#hud-avatar').innerHTML = Avatar.render(P.look, P.outfit, { head: true });
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
        const b = h('button', { class: 'item' + (P.freeBg === s.id ? ' selected' : ''), type: 'button', title: s.name }, Avatar.thumb({ cat: 'bg', shape: s.id }, P.look) + `<span class="name">${s.name}</span>`);
        b.onclick = () => { Sound.play('pop'); P.freeBg = s.id; save(); renderStage(); renderGrid(); };
        grid.appendChild(b);
      });
      return;
    }
    const slots = cat.slots || [cat.id];
    const designLink = slot => {
      if (!ClothingDesigns.TYPES.some(t => t.id === slot)) return;
      const create = h('button', { class: 'design-closet-link', type: 'button' }, '✂️ Maak je eigen ' + ({ top: 'top', bottom: 'broek of rok', dress: 'jurk', shoes: 'schoenen of hakjes', hat: 'haarband, kroon of muts', ears: 'oorbellen' }[slot]) + ' <span>＋</span>');
      create.onclick = () => openDesigner(slot); grid.appendChild(create);
    };
    slots.forEach(slot => {
      if (slots.length > 1) grid.appendChild(section(SLOT_NAMES[slot]));
      designLink(slot);
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
    b.innerHTML = Avatar.thumb(it, thumbLook()) + `<span class="name">${it.custom ? '✂️ ' : ''}${esc(it.name)}</span>`;
    b.onclick = () => { Sound.play('pop'); wear(it); };
    return b;
  }
  function colorCard(c) {
    const b = h('button', { class: 'item color' + (P.look.hairColor === c.id ? ' selected' : ''), type: 'button' },
      `<span class="swatch big" style="background:${c.c === 'rainbow' ? HUES.multi.swatch : c.c}"></span><span class="name">${c.name}</span>`);
    b.onclick = () => { Sound.play('pop'); P.look.hairColor = c.id; save(); renderStage(); renderGrid(); };
    return b;
  }
  const thumbLook = () => ({ ...P.look, _hair: P.outfit.hair });
  function wear(it) {
    const slot = it.cat;
    if(slot==='hair')P.look.hairParts=null;
    if (P.outfit[slot] === it.id && slot !== 'hair') delete P.outfit[slot];
    else {
      P.outfit[slot] = it.id;
      if (slot === 'dress') { delete P.outfit.top; delete P.outfit.bottom; }
      if (slot === 'top' || slot === 'bottom') delete P.outfit.dress;
    }
    save(); renderStage(); renderGrid(); refreshLearningChecks();
  }
  function randomOutfit() {
    const pick = (slot, prob = 1) => { const opts = itemsOf(slot); if (opts.length && Math.random() < prob) P.outfit[slot] = rand(opts).id; else delete P.outfit[slot]; };
    if (Math.random() < 0.45 && itemsOf('dress').length) { pick('dress'); delete P.outfit.top; delete P.outfit.bottom; }
    else { delete P.outfit.dress; pick('top'); pick('bottom'); }
    pick('shoes'); pick('hat', .5); pick('glasses', .3); pick('ears', .3); pick('neck', .45); pick('bag', .3); pick('hand', .35); pick('back', .25); pick('pet', .3);
    pick('mk_eyes', .4); pick('mk_lips', .4); pick('mk_blush', .5); pick('mk_face', .25); pick('hair'); P.look.hairParts=null;
    save(); renderStage(); renderGrid(); refreshLearningChecks();
  }
  function clearOutfit() { P.outfit = { hair: P.outfit.hair }; save(); renderStage(); renderGrid(); refreshLearningChecks(); }

  /* ---------- winkel ---------- */
  function selectLearningTheme(t) {
    P.learningMode=t.learning;P.colorMode=null;P.themeId=t.id;P.themeColors=null;
    P.budgetRun=t.learning==='budget'?LearningChallenges.startBudget(t):null;
    save();
  }
  function activeBudget() {
    const t=THEME_BY_ID[P?.themeId];
    return P?.learningMode==='budget'&&t?.learning==='budget'?t:null;
  }
  function budgetSummary(t) {
    const run=P.budgetRun;
    if(!run||run.themeId!==t.id)return '<p>Start de opdracht opnieuw om bij te houden wat je koopt.</p>';
    const things=n=>n===1?'ding':'dingen';
    return `<div class="budget-summary"><b>🐷 Je mag nog ${t.budget-run.spent} van de ${t.budget} munten uitgeven</b><p>🛍️ Gekocht: ${run.purchases.length} van de ${t.maxBuys} nieuwe ${things(t.maxBuys)}</p>${run.purchases.length?`<ul>${run.purchases.map(p=>`<li>${esc(ITEM_BY_ID[p.id]?.name||p.id)}: ${p.price} munten</li>`).join('')}</ul>`:'<p>Je hebt nog niks gekocht. Kleren uit je eigen kast zijn gratis!</p>'}<small>Je betaalt met je eigen munten (je hebt er ${P.coins}). Alles wat je koopt telt mee, ook als je het niet aantrekt.</small></div>`;
  }
  function openLearning(group) {
    if(!['weather','budget'].includes(group)){openFashionRoom('leshuis');return;}
    openOverlay(`<h2 class="h">🌦️ Weer & Winkelhuis</h2><p>Kies een opdracht. Kleed je aan en de jury kijkt of het klopt!</p>${[group].map(group=>`<h3>${group==='weather'?'🌦️ Wat trek je aan bij dit weer?':'🛍️ Slim winkelen met je munten'}</h3><div class="learning-scenarios">${THEMES.filter(t=>t.learning===group).map(t=>`<button type="button" class="btn ghost learning-scenario" data-lesson="${t.id}" ${P.level<t.lvl?'disabled':''}><b>${t.emoji} ${t.name}</b><small>${group==='budget'?`🪙 ${t.budget} munten · ${t.maxBuys} nieuwe ${t.maxBuys===1?'ding':'dingen'}`:`${t.desc}`}</small><small>${P.level<t.lvl?'Vanaf level '+t.lvl:(P.done[t.id]?'Beste: '+'⭐'.repeat(P.done[t.id]):'Nieuw!')}</small></button>`).join('')}</div>`).join('')}<p class="small">Tip: kijk eerst in je eigen kast. Die kleren zijn gratis!</p><button class="btn ghost" id="learning-close">Terug</button>`);
    $('#learning-close').onclick=closeOverlay;
    document.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>{
      const t=THEME_BY_ID[b.dataset.lesson];if(t.lvl>P.level)return;
      // Opnieuw openen van dezelfde lopende opdracht wist de kassabon niet.
      if(P.learningMode!==t.learning||P.themeId!==t.id||(t.learning==='budget'&&!P.budgetRun))selectLearningTheme(t);
      closeOverlay();startGame(P);
    });
  }
  function openShop(slot = null) {
    const cats = CATEGORIES.filter(c => !c.freeOnly);
    const slotCat = slot ? cats.find(c => (c.slots || [c.id]).includes(slot)) : null;
    let filter = slotCat ? slotCat.id : 'alles';
    const draw = () => {
      const cat = cats.find(c => c.id === filter);
      const list = filter === 'alles' ? shopItems() : (cat.slots || [cat.id]).flatMap(s => shopItems(s));
      openOverlay(`
        <div class="shop-head"><h2 class="h">🛍️ Winkel</h2><div class="hud-stars coins">🪙 <span id="shop-coins">${P.coins}</span></div></div>
        ${activeBudget()?budgetSummary(activeBudget()):''}
        <div class="shop-tabs"><button class="tab${filter === 'alles' ? ' active' : ''}" data-f="alles" type="button">Alles (${shopItems().length})</button>${cats.map(c => { const n = (c.slots || [c.id]).reduce((a, s) => a + shopItems(s).length, 0); return n ? `<button class="tab${filter === c.id ? ' active' : ''}" data-f="${c.id}" type="button"><span class="ti">${c.emoji}</span>${c.name} (${n})</button>` : ''; }).join('')}</div>
        ${list.length ? `<div class="shop-grid">${list.map(it => `<button class="item${P.coins < priceOf(it) ? ' poor' : ''}" data-id="${it.id}" type="button" title="${it.name}">${Avatar.thumb(it, thumbLook())}<span class="name">${it.name}</span><span class="price">🪙 ${priceOf(it)}</span></button>`).join('')}</div>` : `<div class="shop-empty">Alles gekocht! Speel een opdracht of haal een hoger level voor nieuwe spullen.</div>`}
        <p class="center small">Munten verdien je bij de jury en met de kleurenopdracht. Kies je kleding zelf en spaar voor wat je écht wilt.</p>
        <div class="row center"><button class="btn ghost" id="shop-close" type="button">${document.body.dataset.screen==='screen-fashion-room'?'Terug naar de winkel':'Terug naar de kleedkamer'}</button></div>`, 'shop');
      $('#shop-close').onclick = () => { closeOverlay(); renderAll(); };
      document.querySelectorAll('.shop-tabs .tab').forEach(b => { b.onclick = () => { Sound.play('klik'); filter = b.dataset.f; draw(); }; });
      document.querySelectorAll('.shop-grid .item').forEach(b => { b.onclick = () => {const item=ITEM_BY_ID[b.dataset.id];if(document.body.dataset.screen==='screen-fashion-room'&&ui.fashionRoom==='winkel'){closeOverlay();FashionRoom.visit('shop_checkout',()=>buyFlow(item,draw));}else buyFlow(item,draw);}; });
    };
    draw();
  }
  function buyFlow(it, back) {
    const price = priceOf(it);
    const budgetTheme=activeBudget();
    if(budgetTheme){const reason=LearningChallenges.purchaseError(budgetTheme,P.budgetRun,price);if(reason){toast(reason);return;}}
    if (P.coins < price) { Sound.play('fout'); toast(`Nog ${price - P.coins} munten sparen voor ${it.name}. Speel een opdracht of doe de kleurenopdracht!`); return; }
    Sound.play('klik');
    const rest = P.coins - price;
    // rekenvraagje: hoeveel houd je over?
    const wrongs = new Set(); while (wrongs.size < 2) { const d = rand([-3, -2, -1, 1, 2, 3, 5, 10]); const v = rest + d; if (v >= 0 && v !== rest) wrongs.add(v); }
    const options = shuffle([rest, ...wrongs]);
    openOverlay(`
      <h2 class="h center">${esc(it.name)} kopen?</h2>
      <div class="buy-preview">${Avatar.thumb(it, thumbLook())}</div>
      <p class="center">Je hebt <b>${P.coins}</b> munten en dit kost <b>${price}</b>. Hoeveel houd je over?</p>
      <div class="sum"><span class="coin">🪙 ${P.coins}</span><span>−</span><span class="coin">🪙 ${price}</span><span>=</span><span class="coin q" id="sum-answer">?</span></div>
      <div class="answers" id="answers">${options.map(v => `<button class="btn violet" data-v="${v}" type="button">${v}</button>`).join('')}</div>
      <p class="center feedback" id="buy-feedback"></p>
      <div class="row center"><button class="btn ghost" id="buy-cancel" type="button">Toch niet</button></div>`);
    $('#buy-cancel').onclick = () => back();
    document.querySelectorAll('#answers .btn').forEach(b => {
      b.onclick = async () => {
        const v = +b.dataset.v, ok = v === rest, purchasePanel=$('#buy-feedback');
        $('#buy-cancel').disabled=true;
        document.querySelectorAll('#answers .btn').forEach(x => { x.disabled = true; x.classList.add(+x.dataset.v === rest ? 'right' : 'wrong'); });
        $('#sum-answer').textContent = rest;
        Sound.play(ok ? 'ster' : 'fout');
        $('#buy-feedback').textContent = ok ? `Goed gerekend! Je krijgt 2 munten bonus. 🎉` : `Bijna! ${P.coins} − ${price} = ${rest}.`;
        P.coins = rest + (ok ? 2 : 0);
        P.owned.push(it.id);
        if(budgetTheme&&P.budgetRun?.themeId===budgetTheme.id){
          P.budgetRun.spent+=price;P.budgetRun.purchases.push({id:it.id,price});
        }
        save();
        await wait(1300);
        if(!purchasePanel.isConnected)return;
        Sound.play('tada');
        toast(`${it.name} is van jou! Je vindt hem in de kast.`);
        back();
      };
    });
  }

  /* ---------- de jury ---------- */
  const wheelDist = (a, b) => { const d = Math.abs(a - b) % 6; return Math.min(d, 6 - d); };
  function evaluate(outfit, theme) {
    if(theme.learning){
      const result=LearningChallenges.assess(outfit,theme,ITEM_BY_ID,P.budgetRun);
      const feedback=result.feedback.length?result.feedback:[theme.learning==='weather'?'Super! Je bent helemaal klaar voor dit weer.':'Super! Mooie outfit en je hebt niet te veel uitgegeven.'];
      return {total:result.total,stars:result.stars,judges:JUDGES.map((judge,i)=>({judge,score:result.total,comment:feedback[i%feedback.length]})),weakest:result.list[0].ok?'thema':'compleet',factors:{thema:result.total/10,kleur:1,compleet:result.list[0].ok?1:0,glamour:1,accessoires:1},colorFeedback:feedback};
    }
    if (theme.rule) {
      const check=ColorChallenges.assess(outfit,theme,ITEM_BY_ID);
      const weights=[.85,.7,.8];
      const judges=JUDGES.map((judge,i)=>({judge,score:Math.min(check.complete < .999 ? 7.9 : 10, Math.round((check.score*weights[i]+check.complete*(1-weights[i]))*100)/10),comment:check.feedback[i%check.feedback.length]}));
      const total=Math.round(judges.reduce((n,j)=>n+j.score,0)/3*10)/10;
      return {judges,total,stars:total>=8?3:total>=5.8?2:1,weakest:check.score<check.complete?'kleur':'compleet',factors:{kleur:check.score,thema:check.score,compleet:check.complete,glamour:1,accessoires:1},colorFeedback:check.feedback};
    }
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
    if (theme.rule) {
      // kleurenopdracht: alleen de gevraagde kleuren tellen, neutrale kleuren mogen altijd
      const hits = colored.filter(hh => theme.colors.includes(hh)).length;
      const missing = theme.colors.filter(c => !colored.includes(c)).length;
      kleur = colored.length ? clamp(0.15 + 0.85 * (hits / colored.length)) : 0.3;
      if (theme.colors.length > 1 && missing === 0) kleur = clamp(kleur + 0.15);
      if (missing) kleur = clamp(kleur - 0.2 * missing);
      thema = kleur;
    } else if (theme.colors) { const hits = hues.filter(hh => theme.colors.includes(hh)).length; kleur = clamp(kleur * 0.65 + clamp(hits / 2) * 0.35); }

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
  function award(p, res, theme, isShow = true) {
    let xp = XP_PER_STARS[res.stars];
    const first = !p.done[theme.id];
    if (first) xp += XP_FIRST_TIME;
    const coins = COINS_PER_STARS[res.stars];
    const prevLevel = p.level;
    p.xp += xp; p.level = levelFromXp(p.xp); p.coins += coins;
    p.done[theme.id] = Math.max(p.done[theme.id] || 0, res.stars);
    if (isShow) p.shows++;
    p.stars += res.stars;
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
      ${g.gifts.length ? `<p>Cadeautjes voor jou:</p><div class="unlocks">${g.gifts.map(u => `<div class="unlock">${Avatar.thumb(u, { ...p.look, _hair: p.outfit.hair })}<span>${u.name}</span></div>`).join('')}${g.colors.map(c => `<div class="unlock"><span class="swatch big" style="background:${c.c === 'rainbow' ? HUES.multi.swatch : c.c}"></span><span>Haarkleur ${c.name}</span></div>`).join('')}</div>` : ''}
      ${g.shopCount ? `<p class="newtheme">🛍️ En er liggen ${g.shopCount} nieuwe dingen in de winkel!</p>` : ''}
      ${g.themes.length ? `<p class="newtheme">Nieuwe opdracht${g.themes.length > 1 ? 'en' : ''}: ${g.themes.map(t => t.emoji + ' ' + t.name).join(', ')}</p>` : ''}</div>`;
  }

  function goJury() {
    if (ui.free) return fashionShow();
    const theme = currentTheme() || pickTheme();
    const res = evaluate(P.outfit, theme);
    const gained = award(P, res, theme);
    const ov = openOverlay(`
      <div class="runway"><div class="spot a"></div><div class="spot b"></div><div class="walker">${Avatar.render(P.look, P.outfit, { expr: res.stars === 3 ? 'grin' : 'smile', bg: false })}</div></div>
      <h2 class="h center" id="jury-title">De jury kijkt… 👀</h2>
      <div class="judges">${JUDGES.map(j => `<div class="judge"><div class="j-emoji">${j.emoji}</div><b>${j.name}</b><small>${j.title}</small><div class="score">–</div><p class="comment"></p></div>`).join('')}</div>
      <div class="result" id="result" hidden></div>`, 'jury');
    const runway=ov.querySelector('.runway');runway.innerHTML='<div id="jury-model-3d"></div>';FashionPreview.mount($('#jury-model-3d'),P,{runway:true});
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
      ${res.stars < 3 && !theme.learning ? `<div class="tip">💡 ${TIPS[res.weakest]}</div>` : ''}
      ${lvlUp ? levelUpHtml(g, P) : ''}
      <div class="tip">🌸 ${theme.lesson || ColorChallenges.lesson(theme)}${res.colorFeedback?'<ul>'+res.colorFeedback.map(f=>'<li>'+esc(f)+'</li>').join('')+'</ul>':''}${theme.learning==='budget'?budgetSummary(theme):''}</div>
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
    const runway=ov.querySelector('.runway');runway.innerHTML='<div id="jury-model-3d"></div>';FashionPreview.mount($('#jury-model-3d'),P,{runway:true});
    confetti(ov, 90);
    Sound.play('applaus'); setTimeout(() => Sound.play('tada'), 900);
    $('#show-close').onclick = closeOverlay;
    $('#show-photo').onclick = () => { closeOverlay(); makePhoto(); };
  }

  /* ---------- bonusvraag van Madame Fleur over jouw eigen outfit ---------- */
  /* ---------- kleurenopdracht ---------- */
  // kleurenwiel; de gemarkeerde kleuren krijgen een rand en springen iets naar buiten
  const wheelSvg = (marks, extra = '') => {
    const marked = Array.isArray(marks) ? marks : (marks ? [marks] : []);
    const seg = (i, hue) => { const a0 = (i * 60 - 90 - 30) * Math.PI / 180, a1 = (i * 60 - 90 + 30) * Math.PI / 180; const R = 120, r = 46; const p = (ang, rad) => `${(150 + Math.cos(ang) * rad).toFixed(1)} ${(150 + Math.sin(ang) * rad).toFixed(1)}`; const on = marked.includes(hue); const mid = (i * 60 - 90) * Math.PI / 180; const tr = on ? ` transform="translate(${(Math.cos(mid) * 8).toFixed(1)} ${(Math.sin(mid) * 8).toFixed(1)})"` : ''; return `<path class="seg${on ? ' ask' : ''}" data-hue="${hue}"${tr} d="M${p(a0, r)} L${p(a0, R)} A${R} ${R} 0 0 1 ${p(a1, R)} L${p(a1, r)} A${r} ${r} 0 0 0 ${p(a0, r)} Z" fill="${HUES[hue].swatch}" stroke="#fff" stroke-width="3" opacity="${marked.length && !on ? .45 : 1}"/>`; };
    return `<svg class="wheel" viewBox="0 0 300 300" aria-hidden="true">${WHEEL.map((hh, i) => seg(i, hh)).join('')}<circle cx="150" cy="150" r="40" fill="var(--surface)"/><text x="150" y="158" text-anchor="middle" font-size="26">🎨</text>${extra}</svg>`;
  };
  function openColorAtelier(selectedRule) {
    if(!['mono','buren','tegenover'].includes(selectedRule)){openFashionRoom('kleurenhuis');return;}
    const modes=[['mono','Eén kleurfamilie'],['buren','Buurkleuren'],['tegenover','Kleuren die knallen']];
    openOverlay('<h2 class="h">🎨 Kleuratelier van de jury</h2><p>Madame Fleur geeft je een kleurdoel. Jij kleedt je eigen model aan en laat de jury kijken!</p><div class="row wrap">'+modes.filter(([rule])=>rule===selectedRule).map(([rule,label])=>'<button class="btn" data-color-rule="'+rule+'" '+(ColorChallenges.palettes(rule,P.owned,ITEM_BY_ID).length?'':'disabled')+'>'+label+'</button>').join('')+'</div><p class="small">Grijze opdrachten worden beschikbaar zodra je passende kleding in je kast hebt. Bij iedere opdracht krijg je een kort kleurenlesje.</p><button class="btn ghost" id="colors-close">Terug</button>');
    $('#colors-close').onclick=closeOverlay;
    document.querySelectorAll('[data-color-rule]').forEach(b=>b.onclick=()=>{
      P.learningMode=null; P.budgetRun=null;const rule=b.dataset.colorRule;if(P.colorMode!==rule||currentTheme()?.rule!==rule){P.colorMode=rule;pickTheme();}closeOverlay();startGame(P);
    });
  }

  /* ---------- foto ---------- */
  function makePhoto(bg = currentBg(), renderedPhoto = null) {
    let data = renderedPhoto || '';
    if(!data)try { data = Avatar.stage(P.look, P.outfit, bg).toDataURL('image/png'); } catch (e) { data = ''; }
    if (!data) { toast('De foto kan alleen opgeslagen worden als het spel via een website draait (niet vanaf een los bestand).'); return; }
    const fname = `catwalk-${P.name.replace(/[^\w-]+/g, '_')}.png`;
    openOverlay(`<h2 class="h center">📸 Jouw foto</h2><div class="photo"><img src="${data}" alt="Foto van het model van ${esc(P.name)}"></div><p class="center small">Op een tablet: houd de foto lang ingedrukt om hem op te slaan.</p><div class="row center"><button class="btn ghost" id="photo-close" type="button">Sluiten</button><a class="btn" id="photo-dl" href="${data}" download="${fname}">⬇️ Opslaan</a></div>`, 'photo-modal');
    $('#photo-close').onclick = closeOverlay;
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

  function unlockEverything() {
    if (DB.settings?.developerMode !== true) return;
    if (!DB.profiles.length) { toast('Maak eerst een speler.'); return; }
    DB.profiles.forEach(p => { p.xp = Math.max(p.xp, xpForLevel(MAX_LEVEL)); p.level = MAX_LEVEL; p.owned = ITEMS.filter(i => !i.custom || i.ownerId === p.id).map(i => i.id); p.coins += 500; });
    save(); renderStart();
    if (P) { renderHUD(); renderGrid(); }
    Sound.play('levelup'); toast('Alle spelers: level 20, alle spullen en 500 munten extra.');
  }
  function openSettings() {
    const enabled=DB.settings?.developerMode === true;
    openOverlay('<h2 class="h">⚙️ Instellingen</h2><label class="developer-switch"><input id="developer-mode" type="checkbox" '+(enabled?'checked':'')+'> <span><b>Developer mode</b><small>Toon testfuncties voor deze browser.</small></span></label><div id="developer-tools" '+(enabled?'':'hidden')+'><p>Alles vrijspelen zet <b>alle spelers</b> op level 20, geeft alle spullen en voegt per speler 500 munten toe. Uitschakelen draait dit niet terug.</p><button class="btn gold" id="btn-test-max" type="button">🧪 Alles vrijspelen</button></div><div class="row center"><button class="btn ghost" id="settings-close" type="button">Sluiten</button></div>');
    $('#developer-mode').onchange=e=>{
      DB.settings={...DB.settings,developerMode:e.target.checked};save();
      $('#developer-tools').hidden=!e.target.checked;
    };
    $('#btn-test-max').onclick=unlockEverything;
    $('#settings-close').onclick=closeOverlay;
  }

  /* ---------- knoppen ---------- */
  function wire() {
    const compact = matchMedia('(max-width: 760px)');
    for (const [buttonId, dialogId] of [['game-menu-toggle','game-menu'],['challenge-toggle','challenge-dialog']]) {
      const button = $('#'+buttonId), dialog = $('#'+dialogId);
      button.onclick = () => { if (compact.matches) { dialog.showModal(); button.setAttribute('aria-expanded','true'); } };
      dialog.addEventListener('close', () => button.setAttribute('aria-expanded','false'));
      dialog.querySelector('[data-close-game-dialog]').onclick = () => dialog.close();
      dialog.addEventListener('click', e => {
        if (e.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) dialog.close();
      });
    }
    $('#game-menu').addEventListener('click', e => { if (e.target.closest('.hud-tools button:not(#btn-sound)')) closeGameDialogs(); }, true);
    $('#challenge-dialog').addEventListener('click', e => { if (e.target.closest('.ch-actions button')) closeGameDialogs(); }, true);
    compact.addEventListener('change', () => { if (!compact.matches) closeGameDialogs(); });
    document.querySelectorAll('[data-settings]').forEach(b=>b.onclick=openSettings);
    $('#btn-learning').onclick=openLearning;
    $('#btn-world-learning').onclick=openLearning;
    $('#btn-fashion-room').onclick=()=>{openFashionRoom(ui.fashionRoom==='winkel'?'winkel':P.learningMode?'leshuis':P.colorMode?'kleurenhuis':'modehuis');};
    $('#btn-world-designer').onclick = () => openDesigner();
    $('#btn-designer').onclick = () => openDesigner();
    $('#btn-world-parkour').onclick = openParkour;
    $('#btn-world-speeltuin').onclick = openSpeeltuin;
    $('#btn-parkour').onclick = openParkour;
    renderSoundButton();
    $('#btn-sound').onclick = () => { Sound.toggle(); renderSoundButton(); };
    $('#btn-next').onclick = showNextLevel;
    $('#btn-shop').onclick = () => { Sound.play('klik'); openFashionRoom('winkel'); };
    $('#btn-puzzle').onclick = openColorAtelier;
    $('#create-done').onclick = () => {
      const name = $('#name-input').value.trim().slice(0, 16) || 'Ster';
      const look = { ...FaceFeatures.normalize(ui.temp), skin: ui.temp.skin, eyes: ui.temp.eyes, face: ui.temp.face, build: ui.temp.build, hairColor: ui.temp.hairColor, hairParts:ui.temp.hairParts?HairParts.normalize(ui.temp.hairParts):null, customHair:ui.temp.customHair?HairParts.normalize(ui.temp.customHair):null, hairCollection:HairParts.collection(ui.temp), activeHairId:ui.temp.activeHairId||null };
      if (ui.editMode) { const previous={name:P.name,look:P.look,hair:P.outfit.hair};P.name = name; P.look = look; P.outfit.hair = ui.temp.hairStyle; if(!save()){P.name=previous.name;P.look=previous.look;P.outfit.hair=previous.hair;toast('Opslaan is niet gelukt. Je wijzigingen staan nog in het voorbeeld.');return;} if(ui.createReturn==='screen-fashion-room')openFashionRoom(ui.fashionRoom||'modehuis');else if(ui.createReturn==='screen-world')enterWorld(P);else startGame(P); }
      else { const p = newProfile(name, look, ui.temp.hairStyle); DB.profiles.push(p); save(); enterWorld(p); }
    };
    $('#create-cancel').onclick = () => { if (ui.editMode) {if(ui.createReturn==='screen-fashion-room')openFashionRoom(ui.fashionRoom||'modehuis');else if(ui.createReturn==='screen-world')enterWorld(P);else startGame(P);} else { renderStart(); showScreen('screen-start'); } };
    $('#name-input').addEventListener('keydown', e => { if (e.key === 'Enter') $('#create-done').click(); });
    $('#build-range').addEventListener('input', e => { ui.temp.build = +e.target.value; renderCreate(true); });
    $('#hud-profile').onclick = () => { renderStart(); showScreen('screen-start'); };
    $('#btn-world').onclick=()=>{Sound.play('klik');enterWorld(P);};
    $('#btn-look').onclick=()=>openCreate(P);
    $('#btn-world-players').onclick = () => { renderStart(); showScreen('screen-start'); };
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

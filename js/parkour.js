/* Parkour: lobby, outfitkeuze, canvas en invoer. Voortgang loopt via game.js. */
const Parkour = (() => {
  const R=ParkourRules, $=s=>document.querySelector(s);
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const seconds=n=>`${n.toFixed(1)} s`;
  let profile, callbacks={}, selected='school', state=null, frame=0, last=0, paused=false, active=false;
  const keys=new Set();let controls=null, canvasObserver=null;
  const dadLook={skin:'s3',eyes:'e1',hairColor:'donker',build:65};
  const slots=[['top','Bovenkleding'],['bottom','Onderkleding'],['dress','Jurk / pak'],['shoes','Schoenen'],['hat','Hoedje'],['neck','Sieraad'],['bag','Tas'],['hand','In de hand'],['back','Op de rug'],['glasses','Bril'],['ears','Oorbellen'],['pet','Huisdier']];
  function show(p, cb, courseId) {
    hide();profile=p;callbacks=cb;active=true;if(R.courses.some(c=>c.id===courseId))selected=courseId;
    profile.parkour=profile.parkour||{records:{}};profile.parkour.records=profile.parkour.records||{};
    profile.parkour.dadOutfit=profile.parkour.dadOutfit||{hair:'hair_kort',top:'top_tshirt_blauw',bottom:'bot_jeans',shoes:'sh_sneakers'};
    window.addEventListener('keydown',keyDown);window.addEventListener('keyup',keyUp);
    window.addEventListener('blur',autoPause);document.addEventListener('visibilitychange',visibility);
    lobby();
  }
  function hide() {
    document.body.classList.remove('in-race');canvasObserver?.disconnect();Parkour3D.dispose();
    active=false;cancelAnimationFrame(frame);frame=0;keys.clear();state=null;controls?.abort();
    window.removeEventListener('keydown',keyDown);window.removeEventListener('keyup',keyUp);
    window.removeEventListener('blur',autoPause);document.removeEventListener('visibilitychange',visibility);
  }
  function timing(c) { return `<span>⭐⭐⭐ ≤ ${c.times[0]} s</span><span>⭐⭐ ≤ ${c.times[1]} s</span><span>⭐ ≤ ${c.times[2]} s</span>`; }
  function scoreHtml(outfit) {
    const s=R.outfitScore(outfit,selected,ITEM_BY_ID);
    return `<strong>Loopsnelheid: +${Math.round(s.bonus)}%</strong><div class="pk-score">${[['top','Boven'],['bottom','Onder'],['shoes','Schoenen'],['accessories','Accessoires']].map(([key,label])=>`<div>${label}<meter min="0" max="10" value="${s.scores[key]}"></meter><b>${s.scores[key].toFixed(1)}/10</b></div>`).join('')}</div>`;
  }
  function outfitForm(outfit, who) {
    return slots.map(([slot,label])=>{
      const items=ITEMS.filter(i=>i.cat===slot&&(profile.owned.includes(i.id)||outfit[slot]===i.id));
      return `<label>${label}<select data-owner="${who}" data-slot="${slot}"><option value="">Geen</option>${items.map(i=>`<option value="${esc(i.id)}" ${outfit[slot]===i.id?'selected':''}>${esc(i.name)}</option>`).join('')}</select></label>`;
    }).join('');
  }
  function lobby() {
    document.body.classList.remove('in-race');canvasObserver?.disconnect();Parkour3D.dispose();
    cancelAnimationFrame(frame);state=null;keys.clear();controls?.abort();
    window.scrollTo(0,0);
    const course=R.courses.find(c=>c.id===selected), root=$('#parkour');
    root.innerHTML=`<div class="pk-heading"><div><p class="eyebrow">CATWALK STERREN · SPORTCLUB</p><h1>Op je plaatsen… klaar… stijl!</h1><p>Kies je baan, trek je snelste outfit aan en verdien sterren.</p></div><button class="btn ghost" id="pk-exit">← Raceclub</button></div>
      <div class="pk-courses">${R.courses.map(c=>{const rec=profile.parkour.records[c.id];return `<button class="pk-course ${selected===c.id?'selected':''}" data-course="${c.id}" aria-pressed="${selected===c.id}"><span class="pk-icon">${c.icon}</span><b>${c.name}</b><small>${rec?`${'⭐'.repeat(rec.stars)} · record ${seconds(rec.best)}`:'Nog geen record'}</small></button>`;}).join('')}</div>
      <div class="pk-lobby"><section class="card pk-brief"><p class="eyebrow">JOUW VOLGENDE RACE</p><h2>${course.icon} ${course.name}</h2><p>${course.desc}</p><div class="pk-times">${timing(course)}</div><p class="pk-note">Na ${course.times[2]} seconden is de tijd op. Je kunt altijd opnieuw proberen. Meer sterren = een hogere beoordeling en meer XP en munten.</p>
      <div id="pk-player-score">${scoreHtml(profile.outfit)}</div><p class="pk-note">Boven 25% · onder 25% · schoenen 35% · accessoires 15%. Een jurk telt voor boven én onder. Je uiterlijk heeft geen invloed.</p>
      <button class="btn big" id="pk-start">🏁 Start de race</button><p class="pk-note">Sleep de stuurknop om te lopen. Tik op Spring om te springen, of steeds op Sprint tegen papa. Met Pauze neem je even rust.</p></section>
      <section class="card pk-wardrobe"><h2>👟 Jouw race-outfit</h2><div class="pk-doll" id="pk-player-doll">${Avatar.render(profile.look,profile.outfit,{bg:false})}</div><div class="pk-selects">${outfitForm(profile.outfit,'player')}</div><p class="pk-note">Je kiest uit je eigen kast. Sneakers lopen sneller dan hakjes; sportkleding helpt en zware accessoires remmen af. Geen accessoires geeft 6/10.</p></section></div>
      ${selected==='dad'?`<section class="card pk-dad"><h2>👨 Kleed papa aan</h2><p>Papa gebruikt dezelfde kledingregels. Geef hem sneakers voor een grotere uitdaging, of hakjes voor een grappige race!</p><div class="pk-doll" id="pk-dad-doll">${Avatar.render(dadLook,profile.parkour.dadOutfit,{bg:false})}</div><div id="pk-dad-score">${scoreHtml(profile.parkour.dadOutfit)}</div><div class="pk-selects">${outfitForm(profile.parkour.dadOutfit,'dad')}</div></section>`:''}`;
    FashionPreview.mount($('#pk-player-doll'),profile);if(selected==='dad')FashionPreview.mount($('#pk-dad-doll'),{look:dadLook,outfit:profile.parkour.dadOutfit});
    $('#pk-exit').onclick=()=>{hide();callbacks.exit();};
    root.querySelectorAll('[data-course]').forEach(b=>b.onclick=()=>{selected=b.dataset.course;lobby();});
    root.querySelectorAll('select').forEach(el=>el.onchange=()=>{
      const who=el.dataset.owner, outfit=who==='dad'?profile.parkour.dadOutfit:profile.outfit;
      if(el.value)outfit[el.dataset.slot]=el.value;else delete outfit[el.dataset.slot];
      if(el.value&&el.dataset.slot==='dress'){delete outfit.top;delete outfit.bottom;}
      if(el.value&&['top','bottom'].includes(el.dataset.slot))delete outfit.dress;
      root.querySelectorAll(`select[data-owner="${who}"]`).forEach(s=>s.value=outfit[s.dataset.slot]||'');
      $(`#pk-${who}-score`).innerHTML=scoreHtml(outfit);
      FashionPreview.mount($(`#pk-${who}-doll`),{look:who==='dad'?dadLook:profile.look,outfit});callbacks.save();
    });
    $('#pk-start').onclick=start;
  }
  function start() {
    if(!Avatar.isReady()){
      const button=$('#pk-start');if(button)button.textContent='Het poppetje laadt nog… probeer zo opnieuw';
      return;
    }
    state=R.create(selected,profile.outfit,profile.parkour.dadOutfit,ITEM_BY_ID);paused=false;keys.clear();
    document.body.classList.add('in-race');
    FashionPreview.pause();
    const runnerProfiles=[profile,...state.npcs.map((n,i)=>({look:selected==='dad'?dadLook:{...profile.look,hairColor:i?'rood':'blond'},outfit:selected==='dad'?profile.parkour.dadOutfit:{hair:i?'hair_staartjes':'hair_staart',top:i?'top_tshirt_rood':'top_tshirt_groen',bottom:'bot_jeans',shoes:'sh_sneakers'}}))];
    $('#parkour').innerHTML=`<div class="pk-race-head"><button class="btn ghost sm" id="pk-back">← Banen</button><b>${state.course.icon} ${state.course.name}</b><button class="btn ghost sm" id="pk-pause">⏸ Pauze</button></div>
      <div class="pk-live"><strong id="pk-clock">0.0 s</strong><span id="pk-live-stars">⭐⭐⭐</span><span id="pk-progress">Klaar voor de start</span><span class="pk-outfit-bonus">Outfit +${Math.round(state.stats.bonus)}%</span></div>
      <div class="pk-times">${timing(state.course)}</div><div class="pk-canvas-wrap"><canvas id="pk-canvas" width="960" height="540" tabindex="0" aria-label="Raceveld. Stuur met de stuurknop en tik op Spring."></canvas><div id="pk-countdown" aria-live="polite"></div><div id="pk-direction"></div><svg id="pk-map" aria-label="Overzicht van de baan"></svg><div id="pk-pause-panel" hidden><h2>Even pauze</h2><p>De klok staat stil.</p><div class="pk-times">${timing(state.course)}</div><button class="btn" id="pk-resume">Verder rennen</button></div></div>
      <p id="pk-message" class="pk-message" role="status">${selected==='dad'?'Tik steeds opnieuw op Sprint!':'Volg de route naar de geblokte finish.'}</p>
      <div class="pk-controls"><div id="pk-stick" class="touch-stick" role="group" aria-label="Stuurknop: sleep om te lopen" ${selected==='dad'?'hidden':''}><span></span></div><div class="pk-arrows" ${selected==='dad'?'hidden':''}><button data-move="up" aria-label="Omhoog">↑</button><button data-move="left" aria-label="Links">←</button><button data-move="down" aria-label="Omlaag">↓</button><button data-move="right" aria-label="Rechts">→</button></div><button class="btn mint" id="pk-jump" ${selected==='dad'?'hidden':''}>Spring ⤴</button><button class="btn" id="pk-sprint" ${selected!=='dad'?'hidden':''}>⚡ Sprint!</button><label id="pk-energy-label" ${selected!=='dad'?'hidden':''}>Sprintmeter <meter id="pk-energy" min="0" max="1" value="0"></meter></label></div><div id="pk-result" role="status"></div>`;
    $('#pk-back').onclick=lobby;$('#pk-pause').onclick=()=>setPaused(!paused);$('#pk-resume').onclick=()=>setPaused(false);
    $('#pk-jump').onclick=()=>{if(!paused)R.jump(state);};$('#pk-sprint').onclick=()=>{if(!paused)R.tap(state);};
    controls=new AbortController();
    TouchControls.stick($('#pk-stick'), keys, controls.signal, ()=>!paused);
    // Een tweede vinger geeft geen click terwijl een looppijl ingedrukt blijft.
    $('#pk-jump').addEventListener('pointerdown',e=>{
      if(e.pointerType==='touch'||e.pointerType==='pen'){e.preventDefault();if(!paused)R.jump(state);}
    },{signal:controls.signal});
    document.querySelectorAll('[data-move]').forEach(b=>{
      b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.move);},{signal:controls.signal});
      for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,()=>keys.delete(b.dataset.move),{signal:controls.signal});
    });
    if(!Parkour3D.mount($('#pk-canvas'),state,runnerProfiles,()=>setPaused(true))){lobby();const message=document.createElement('p');message.setAttribute('role','alert');message.textContent='Het 3D-raceveld kon niet starten. Probeer de race opnieuw.';$('#parkour').prepend(message);return;}
    initMap();
    canvasObserver?.disconnect();
    canvasObserver=new ResizeObserver(()=>{if(state&&$('#pk-canvas')){resizeCanvas();draw();}});
    canvasObserver.observe($('#pk-canvas'));
    resizeCanvas();
    window.scrollTo(0,0);$('#pk-canvas').focus({preventScroll:true});last=performance.now();frame=requestAnimationFrame(tick);
  }
  function setPaused(value) {
    if(!state||state.finished)return;
    if(!value&&Parkour3D.debug().lost){$('#pk-message').textContent='Het 3D-beeld herstelt nog. De race blijft gepauzeerd.';return;}
    paused=value;keys.clear();$('#pk-pause-panel').hidden=!paused;$('#pk-pause').textContent=paused?'▶ Verder':'⏸ Pauze';
    last=performance.now();
  }
  const autoPause=()=>{if(state&&!state.finished)setPaused(true);};
  const visibility=()=>{if(document.hidden)autoPause();};
  const moveKeys={ArrowUp:'up',w:'up',ArrowDown:'down',s:'down',ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right'};
  function keyDown(e) {
    if(!active||!state||state.finished)return;
    const key=e.key.length===1?e.key.toLowerCase():e.key;
    const button=e.target.closest?.('button');
    if(button&&['Enter',' '].includes(key)&&!['pk-sprint','pk-jump'].includes(button.id))return;
    if(moveKeys[key]||[' ','Enter','Escape','p'].includes(key))e.preventDefault();
    if((key==='Escape'||key==='p')&&!e.repeat){setPaused(!paused);return;}
    if(paused)return;
    if(moveKeys[key])keys.add(moveKeys[key]);
    if(key===' '&&!e.repeat)R.jump(state);
    if(key==='Enter'&&!e.repeat&&selected==='dad')R.tap(state);
  }
  function keyUp(e){keys.delete(moveKeys[e.key.length===1?e.key.toLowerCase():e.key]);}
  function tick(now) {
    if(!active||!state)return;
    let dt=Math.min((now-last)/1000,.25);last=now;
    if(!paused){while(dt>0&&!state.finished){const part=Math.min(dt,1/120);R.step(state,part,Object.fromEntries([...keys].map(k=>[k,true])));dt-=part;}}
    draw();updateHud();
    if(state.finished){finish();return;}
    frame=requestAnimationFrame(tick);
  }
  function updateHud() {
    $('#pk-clock').textContent=seconds(state.time);
    $('#pk-live-stars').textContent='⭐'.repeat(R.starsFor(state.time,state.course))||'Tijd op';
    $('#pk-progress').textContent=state.course.id==='tag'?`Vlaggen ${state.checkpoint}/5`: `${Math.min(100,Math.round(state.player.x/state.finish.x*100))}%`;
    $('#pk-energy').value=state.energy;
    const text=state.countdown>0?`Start over ${Math.ceil(state.countdown)}…`:state.freeze>0?`${state.notice} Nog ${Math.ceil(state.freeze)} s.`:state.course.id==='dad'?'Blijf tikken om te sprinten!':state.jump>0?'Hop!':state.course.id==='tag'?(state.checkpoint<5?`Pak vlag ${state.checkpoint+1} en ontwijk je vriendinnen.`:'Alle vlaggen! Nu naar de finish.'):'Sleep de stuurknop. Tik op Spring.';
    if($('#pk-message').textContent!==text)$('#pk-message').textContent=text;
    $('#pk-jump').disabled=paused||state.cooldown>0||state.freeze>0||state.countdown>0;
    $('#pk-sprint').disabled=paused||state.countdown>0;
  }
  function finish() {
    document.body.classList.remove('in-race');
    keys.clear();controls?.abort();$('#pk-pause').disabled=true;
    $('#pk-jump').disabled=true;$('#pk-sprint').disabled=true;
    const stars=state.success?R.starsFor(state.time,state.course):0;
    let reward=null, record=false;
    if(stars) {
      const previous=profile.parkour.records[selected];record=!previous||state.time<previous.best;
      profile.parkour.records[selected]={best:Math.min(previous?.best??Infinity,state.time),stars:Math.max(previous?.stars||0,stars)};
      reward=callbacks.reward(stars,selected);callbacks.save();
    }
    const place=1+state.npcs.filter(n=>n.finished&&n.finished<state.time).length;
    $('#pk-result').innerHTML=`<div class="card pk-finish"><h2>${stars?'⭐'.repeat(stars):'⏱️ Tijd op!'}</h2><h3>${stars?['','Goed gedaan!','Heel goed!','Superprestatie!'][stars]:'Nog een keer proberen?'}</h3><p>${seconds(state.time)} · ${state.hits} keer geraakt${['gym','dad'].includes(selected)&&stars?` · plaats ${place} van ${state.npcs.length+1}`:''}</p>${record?'<b>🎉 Nieuw persoonlijk record!</b>':''}${reward?`<p>+${reward.xp} XP · +${reward.coins} munten · +${stars} sterren</p>${reward.extra||''}`:'<p>Kies sportkleding, bekijk de route en probeer het opnieuw. Deze poging kost geen munten.</p>'}<div class="row wrap"><button class="btn" id="pk-retry">Nog een race</button><button class="btn ghost" id="pk-outfit">Outfit & banen</button></div></div>`;
    $('#pk-retry').onclick=start;$('#pk-outfit').onclick=lobby;
    $('#pk-result').scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  }
  function resizeCanvas(){Parkour3D.resize();}
  function initMap(){
    const map=$('#pk-map');map.hidden=!['gym','tag'].includes(selected);map.style.display=map.hidden?'none':'';
    map.setAttribute('viewBox',`0 0 ${state.course.length} ${state.course.height}`);
    map.innerHTML=`<rect width="100%" height="100%" fill="#fff8e8"/>${state.walls.map(w=>`<rect x="${w.x}" y="${w.y}" width="${w.w}" height="${w.h}" fill="#87a976"/>`).join('')}${state.flags.map((f,i)=>`<circle data-map-flag="${i}" cx="${f.x}" cy="${f.y}" r="20" fill="#bc9bce"/>`).join('')}<circle cx="${state.finish.x}" cy="${state.finish.y}" r="20" fill="#5b5273"/><circle id="pk-map-player" r="22" fill="#ec528d"/>`;
  }
  function draw(){
    Parkour3D.draw(state);
    const count=$('#pk-countdown');count.textContent=state.countdown>0?Math.ceil(state.countdown):'';count.hidden=state.countdown<=0;
    const target=state.flags[state.checkpoint]||state.finish,dx=target.x-state.player.x,dy=target.y-state.player.y;
    $('#pk-direction').textContent=`${Math.abs(dx)>Math.abs(dy)?dx>0?'→':'←':dy>0?'↓':'↑'} ${state.flags[state.checkpoint]?'Volgende vlag':'Finish'} · ${Math.round(Math.hypot(dx,dy)/10)} m`;
    const dot=$('#pk-map-player');if(dot){dot.setAttribute('cx',state.player.x);dot.setAttribute('cy',state.player.y);}
    document.querySelectorAll('[data-map-flag]').forEach(n=>n.setAttribute('fill',+n.dataset.mapFlag<state.checkpoint?'#d9d1df':+n.dataset.mapFlag===state.checkpoint?'#eab73e':'#bc9bce'));
  }
  return {show,hide,debug:()=>({selected,paused,active,state:state?JSON.parse(JSON.stringify(state)):null,view:Parkour3D.debug()})};
})();

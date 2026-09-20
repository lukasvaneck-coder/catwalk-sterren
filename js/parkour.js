/* Parkour: lobby, outfitkeuze, canvas en invoer. Voortgang loopt via game.js. */
const Parkour = (() => {
  const R=ParkourRules, $=s=>document.querySelector(s);
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const seconds=n=>`${n.toFixed(1)} s`;
  let profile, callbacks={}, selected='school', state=null, frame=0, last=0, paused=false, active=false, sprites=[];
  const keys=new Set();let controls=null;
  const dadLook={skin:'s3',eyes:'e1',hairColor:'donker',build:65};
  const slots=[['top','Bovenkleding'],['bottom','Onderkleding'],['dress','Jurk / pak'],['shoes','Schoenen'],['hat','Hoedje'],['neck','Sieraad'],['bag','Tas'],['hand','In de hand'],['back','Op de rug'],['glasses','Bril'],['pet','Huisdier']];
  function show(p, cb) {
    hide();profile=p;callbacks=cb;active=true;
    profile.parkour=profile.parkour||{records:{}};profile.parkour.records=profile.parkour.records||{};
    profile.parkour.dadOutfit=profile.parkour.dadOutfit||{hair:'hair_kort',top:'top_tshirt_blauw',bottom:'bot_jeans',shoes:'sh_sneakers'};
    window.addEventListener('keydown',keyDown);window.addEventListener('keyup',keyUp);
    window.addEventListener('blur',autoPause);document.addEventListener('visibilitychange',visibility);
    lobby();
  }
  function hide() {
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
    cancelAnimationFrame(frame);state=null;keys.clear();controls?.abort();
    window.scrollTo(0,0);
    const course=R.courses.find(c=>c.id===selected), root=$('#parkour');
    root.innerHTML=`<div class="pk-heading"><div><p class="eyebrow">CATWALK STERREN · SPORTCLUB</p><h1>Op je plaatsen… klaar… stijl!</h1><p>Kies je baan, trek je snelste outfit aan en verdien sterren.</p></div><button class="btn ghost" id="pk-exit">🏡 Dorp</button></div>
      <div class="pk-courses">${R.courses.map(c=>{const rec=profile.parkour.records[c.id];return `<button class="pk-course ${selected===c.id?'selected':''}" data-course="${c.id}" aria-pressed="${selected===c.id}"><span class="pk-icon">${c.icon}</span><b>${c.name}</b><small>${rec?`${'⭐'.repeat(rec.stars)} · record ${seconds(rec.best)}`:'Nog geen record'}</small></button>`;}).join('')}</div>
      <div class="pk-lobby"><section class="card pk-brief"><p class="eyebrow">JOUW VOLGENDE RACE</p><h2>${course.icon} ${course.name}</h2><p>${course.desc}</p><div class="pk-times">${timing(course)}</div><p class="pk-note">Na ${course.times[2]} seconden is de tijd op. Je kunt altijd opnieuw proberen. Meer sterren = een hogere beoordeling en meer XP en munten.</p>
      <div id="pk-player-score">${scoreHtml(profile.outfit)}</div><p class="pk-note">Boven 25% · onder 25% · schoenen 35% · accessoires 15%. Een jurk telt voor boven én onder. Je uiterlijk heeft geen invloed.</p>
      <button class="btn big" id="pk-start">🏁 Start de race</button><p class="pk-note">Pijltjes / WASD = lopen · spatie = springen · Enter = sprinten tegen papa · P / Escape = pauze. Ook met schermknoppen.</p></section>
      <section class="card pk-wardrobe"><h2>👟 Jouw race-outfit</h2><div class="pk-doll" id="pk-player-doll">${Avatar.render(profile.look,profile.outfit,{bg:false})}</div><div class="pk-selects">${outfitForm(profile.outfit,'player')}</div><p class="pk-note">Je kiest uit je eigen kast. Sneakers lopen sneller dan hakjes; sportkleding helpt en zware accessoires remmen af. Geen accessoires geeft 6/10.</p></section></div>
      ${selected==='dad'?`<section class="card pk-dad"><h2>👨 Kleed papa aan</h2><p>Papa gebruikt dezelfde kledingregels. Geef hem sneakers voor een grotere uitdaging, of hakjes voor een grappige race!</p><div class="pk-doll" id="pk-dad-doll">${Avatar.render(dadLook,profile.parkour.dadOutfit,{bg:false})}</div><div id="pk-dad-score">${scoreHtml(profile.parkour.dadOutfit)}</div><div class="pk-selects">${outfitForm(profile.parkour.dadOutfit,'dad')}</div></section>`:''}`;
    $('#pk-exit').onclick=()=>{hide();callbacks.exit();};
    root.querySelectorAll('[data-course]').forEach(b=>b.onclick=()=>{selected=b.dataset.course;lobby();});
    root.querySelectorAll('select').forEach(el=>el.onchange=()=>{
      const who=el.dataset.owner, outfit=who==='dad'?profile.parkour.dadOutfit:profile.outfit;
      if(el.value)outfit[el.dataset.slot]=el.value;else delete outfit[el.dataset.slot];
      if(el.value&&el.dataset.slot==='dress'){delete outfit.top;delete outfit.bottom;}
      if(el.value&&['top','bottom'].includes(el.dataset.slot))delete outfit.dress;
      root.querySelectorAll(`select[data-owner="${who}"]`).forEach(s=>s.value=outfit[s.dataset.slot]||'');
      $(`#pk-${who}-score`).innerHTML=scoreHtml(outfit);
      $(`#pk-${who}-doll`).innerHTML=Avatar.render(who==='dad'?dadLook:profile.look,outfit,{bg:false});callbacks.save();
    });
    $('#pk-start').onclick=start;
  }
  function start() {
    if(!Avatar.isReady()){
      const button=$('#pk-start');if(button)button.textContent='Het poppetje laadt nog… probeer zo opnieuw';
      return;
    }
    state=R.create(selected,profile.outfit,profile.parkour.dadOutfit,ITEM_BY_ID);paused=false;keys.clear();
    sprites=[Avatar.compose(profile.look,profile.outfit), ...state.npcs.map((n,i)=>Avatar.compose(selected==='dad'?dadLook:{...profile.look,hairColor:i?'rood':'blond'},selected==='dad'?profile.parkour.dadOutfit:{hair:i?'hair_staartjes':'hair_staart',top:i?'top_tshirt_rood':'top_tshirt_groen',bottom:'bot_jeans',shoes:'sh_sneakers'}))];
    $('#parkour').innerHTML=`<div class="pk-race-head"><button class="btn ghost sm" id="pk-back">← Banen</button><b>${state.course.icon} ${state.course.name}</b><button class="btn ghost sm" id="pk-pause">⏸ Pauze</button></div>
      <div class="pk-live"><strong id="pk-clock">0.0 s</strong><span id="pk-live-stars">⭐⭐⭐</span><span id="pk-progress">Klaar voor de start</span><span>Outfit +${Math.round(state.stats.bonus)}%</span></div>
      <div class="pk-times">${timing(state.course)}</div><div class="pk-canvas-wrap"><canvas id="pk-canvas" width="960" height="540" tabindex="0" aria-label="Raceveld. Gebruik pijltjestoetsen om te lopen en spatie om te springen."></canvas><div id="pk-pause-panel" hidden><h2>Even pauze</h2><p>De klok staat stil.</p><button class="btn" id="pk-resume">Verder rennen</button></div></div>
      <p id="pk-message" class="pk-message" role="status">${selected==='dad'?'Tik steeds opnieuw op Sprint of Enter!':'Volg de route naar de geblokte finish.'}</p>
      <div class="pk-controls"><div class="pk-arrows" ${selected==='dad'?'hidden':''}><button data-move="up" aria-label="Omhoog">↑</button><button data-move="left" aria-label="Links">←</button><button data-move="down" aria-label="Omlaag">↓</button><button data-move="right" aria-label="Rechts">→</button></div><button class="btn mint" id="pk-jump" ${selected==='dad'?'hidden':''}>Spring ⤴ <small>spatie</small></button><button class="btn" id="pk-sprint" ${selected!=='dad'?'hidden':''}>⚡ Sprint! <small>tik / Enter</small></button><label id="pk-energy-label" ${selected!=='dad'?'hidden':''}>Sprintmeter <meter id="pk-energy" min="0" max="1" value="0"></meter></label></div><div id="pk-result" role="status"></div>`;
    $('#pk-back').onclick=lobby;$('#pk-pause').onclick=()=>setPaused(!paused);$('#pk-resume').onclick=()=>setPaused(false);
    $('#pk-jump').onclick=()=>{if(!paused)R.jump(state);};$('#pk-sprint').onclick=()=>{if(!paused)R.tap(state);};
    controls=new AbortController();
    document.querySelectorAll('[data-move]').forEach(b=>{
      b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(b.dataset.move);},{signal:controls.signal});
      for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,()=>keys.delete(b.dataset.move),{signal:controls.signal});
    });
    window.scrollTo(0,0);$('#pk-canvas').focus({preventScroll:true});last=performance.now();frame=requestAnimationFrame(tick);
  }
  function setPaused(value) {
    if(!state||state.finished)return;
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
    const text=state.countdown>0?`Start over ${Math.ceil(state.countdown)}…`:state.freeze>0?`${state.notice} Nog ${Math.ceil(state.freeze)} s.`:state.course.id==='dad'?'Blijf tikken om te sprinten!':state.jump>0?'Hop!':state.course.id==='tag'?(state.checkpoint<5?`Pak vlag ${state.checkpoint+1} en ontwijk je vriendinnen.`:'Alle vlaggen! Nu naar de finish.'):'Spatie of Spring = springen. P = pauze.';
    if($('#pk-message').textContent!==text)$('#pk-message').textContent=text;
    $('#pk-jump').disabled=paused||state.cooldown>0||state.freeze>0||state.countdown>0;
    $('#pk-sprint').disabled=paused||state.countdown>0;
  }
  function finish() {
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
  function draw() {
    const canvas=$('#pk-canvas'), g=canvas.getContext('2d'), s=state;
    const cameraX=Math.max(0,Math.min(s.course.length-960,s.player.x-330));
    const cameraY=Math.max(0,Math.min(s.course.height-540,s.player.y-300));
    g.clearRect(0,0,960,540);g.fillStyle=selected==='rain'?'#a9c7c5':'#b6db95';g.fillRect(0,0,960,540);
    g.save();g.translate(-cameraX,-cameraY);
    // Grass details, trees and houses decorate the edges, leaving the track clear.
    g.font='26px "Segoe UI Emoji",sans-serif';g.textAlign='center';
    for(let x=30;x<s.course.length;x+=150){g.fillText(x%300===30?'🌳':'🌼',x,55);if(selected!=='gym')g.fillText('🌷',x+40,520);}
    if(selected!=='gym'&&selected!=='tag') {
      g.fillStyle=selected==='rain'?'#c2cbd5':'#f3dfb5';g.fillRect(0,120,s.course.length,350);
      g.strokeStyle='#ffffffaa';g.lineWidth=3;g.setLineDash([22,20]);g.beginPath();g.moveTo(0,285);g.lineTo(s.course.length,285);g.stroke();g.setLineDash([]);
      for(let x=160;x<s.course.length-150;x+=400){g.fillStyle='#aa8655';g.font='bold 22px system-ui';g.fillText('→',x,445);}
    }
    if(selected==='gym') {
      g.fillStyle='#f6e3b8';g.fillRect(0,0,s.course.length,s.course.height);
      s.walls.forEach(w=>{g.fillStyle='#527d4e';g.fillRect(w.x+2,w.y+6,w.w-4,w.h-4);g.fillStyle='#75a762';g.fillRect(w.x+2,w.y+2,w.w-4,w.h-10);});
      g.font='bold 15px system-ui';g.fillStyle='#584369';g.fillText('SCHOOL',96,83);g.fillText('GYM',s.finish.x,s.finish.y-55);
    }
    s.obstacles.forEach((o,i)=>{
      if(o.kind==='road'){
        g.fillStyle='#6d7481';g.fillRect(o.x,0,o.w,540);
        g.fillStyle='#ffffff';for(let y=235;y<350;y+=20)g.fillRect(o.x+4,y,o.w-8,10);
        g.font='bold 16px system-ui';g.fillStyle='#6d4355';g.fillText('KIJK UIT',o.x-55,220);
        const car=R.carAt(s,i);g.fillStyle=i?'#c876ae':'#ef9771';g.beginPath();g.roundRect(car.x,car.y,car.w,car.h,16);g.fill();
        g.fillStyle='#c8edff';g.fillRect(car.x+10,car.y+18,car.w-20,25);g.fillStyle='#3d3f52';g.fillRect(car.x-4,car.y+16,6,22);g.fillRect(car.x+car.w-2,car.y+16,6,22);
      } else if(o.kind==='puddle') {
        g.fillStyle='#6daacb';g.beginPath();g.ellipse(o.x+o.w/2,o.y+o.h/2,o.w/2+6,o.h/2,0,0,Math.PI*2);g.fill();
        g.strokeStyle='#c2eaf8';g.lineWidth=3;g.beginPath();g.ellipse(o.x+o.w/2,o.y+o.h/2,o.w/3,o.h/3,0,0,Math.PI*2);g.stroke();
      } else {g.fillStyle='#a47451';g.fillRect(o.x,o.y,10,o.h);g.fillRect(o.x+o.w-10,o.y,10,o.h);g.fillStyle='#eee0bf';g.fillRect(o.x,o.y+10,o.w,17);g.fillRect(o.x,o.y+65,o.w,17);}
    });
    s.flags.forEach((f,i)=>{g.globalAlpha=i<s.checkpoint?.3:1;g.fillStyle=i===s.checkpoint?'#ffce52':'#f7f3ff';g.beginPath();g.arc(f.x,f.y,25,0,Math.PI*2);g.fill();g.fillStyle='#62488b';g.font='bold 22px system-ui';g.fillText(i<s.checkpoint?'✓':String(i+1),f.x,f.y+8);g.globalAlpha=1;});
    const f=s.finish;
    for(let y=-35;y<35;y+=14)for(let x=-14;x<14;x+=14){g.fillStyle=((y+35)/14+(x+14)/14)%2?'#fff':'#665078';g.fillRect(f.x+x,f.y+y,14,14);}
    g.font='bold 16px system-ui';g.fillStyle='#493653';g.fillText('FINISH',f.x,f.y-50);
    const runners=[...s.npcs.map((n,i)=>({p:n,img:sprites[i+1],name:n.name})),{p:s.player,img:sprites[0],name:profile.name,player:true}].sort((a,b)=>a.p.y-b.p.y);
    for(const r of runners) {
      const hop=r.player&&s.jump>0?Math.sin((.8-s.jump)/.8*Math.PI)*40:0;
      g.fillStyle='#40395730';g.beginPath();g.ellipse(r.p.x,r.p.y+1,18,7,0,0,7);g.fill();
      g.save();if(r.player&&s.immune>0)g.globalAlpha=.55+.3*Math.sin(s.time*18);
      g.drawImage(r.img,r.p.x-39,r.p.y-91-hop,78,96);g.restore();
      g.font='bold 13px system-ui';g.textAlign='center';const name=r.name.slice(0,16), w=g.measureText(name).width+14;
      g.fillStyle=r.player?'#7453b9':'#ffffffdf';g.beginPath();g.roundRect(r.p.x-w/2,r.p.y-103-hop,w,20,8);g.fill();g.fillStyle=r.player?'white':'#584566';g.fillText(name,r.p.x,r.p.y-89-hop);
    }
    g.restore();
    if(selected==='rain'){g.strokeStyle='#52789550';g.lineWidth=2;for(let i=0;i<65;i++){const x=(i*73+s.time*35)%960,y=(i*97+s.time*230)%540;g.beginPath();g.moveTo(x,y);g.lineTo(x-6,y+16);g.stroke();}}
    if(s.countdown>0){g.fillStyle='#40305a66';g.fillRect(0,0,960,540);g.fillStyle='white';g.textAlign='center';g.font='bold 80px system-ui';g.fillText(Math.ceil(s.countdown),480,290);}
    // Direction cue remains visible even when the finish is beyond the camera.
    if(s.countdown<=0&&!s.finished){const target=s.flags[s.checkpoint]||s.finish;g.fillStyle='#ffffffed';g.beginPath();g.roundRect(730,14,215,38,16);g.fill();g.fillStyle='#62488b';g.font='bold 15px system-ui';g.textAlign='center';const dx=target.x-s.player.x,dy=target.y-s.player.y;g.fillText(`${Math.abs(dx)>Math.abs(dy)?dx>0?'→':'←':dy>0?'↓':'↑'} ${s.flags[s.checkpoint]?'Volgende vlag':'Naar de finish'} · ${Math.round(Math.hypot(dx,dy)/10)} m`,838,39);}
  }
  return {show,hide};
})();

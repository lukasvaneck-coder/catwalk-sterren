/* Het grote dorp: wandelen, echte deuren, bewoners, parkopdrachten en een volgcamera. */
const World = (() => {
  const R=TownRules, HOUSES=R.HOUSES, $=s=>document.querySelector(s);
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  let P,cb={},pos={...R.START},path=[],goal=null,frame=0,last=0,lastSave=0,active=false,facing=1,els={},painted=false,actionKey='';
  const keys=new Set();
  function show(profile,callbacks){
    if(active)hide();P=profile;cb=callbacks||{};R.migrate(P);pos={...P.town.pos};path=[];goal=null;keys.clear();painted=false;actionKey='';active=true;
    document.body.classList.add('in-world');build();
    window.addEventListener('keydown',onKey);window.addEventListener('keyup',onKeyUp);window.addEventListener('blur',clearKeys);window.addEventListener('resize',layout);window.addEventListener('pagehide',savePosition);
    last=performance.now();layout();updateHud();frame=requestAnimationFrame(tick);
  }
  function hide(){
    active=false;cancelAnimationFrame(frame);frame=0;keys.clear();path=[];goal=null;
    window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',onKeyUp);window.removeEventListener('blur',clearKeys);window.removeEventListener('resize',layout);window.removeEventListener('pagehide',savePosition);
    document.querySelectorAll('.town-dialog[open]').forEach(d=>d.close());document.body.classList.remove('in-world');
    if(P){P.town.pos={...pos};cb.save?.();}
  }
  const clearKeys=()=>keys.clear();
  function savePosition(){if(P){P.town.pos={...pos};cb.save?.();}}
  const blocked=()=>document.hidden||!$('#overlay').hidden||!!document.querySelector('.town-dialog[open]')||$('#world-menu').classList.contains('is-open');
  function build(){
    const menu=$('#world-menu');menu.classList.remove('is-open');$('#world-menu-toggle').setAttribute('aria-expanded','false');
    const setMenu=open=>{menu.classList.toggle('is-open',open);$('#world-menu-toggle').setAttribute('aria-expanded',String(open));if(open)keys.clear();};
    $('#world-menu-toggle').onclick=()=>setMenu(!menu.classList.contains('is-open'));
    menu.onclick=e=>{if(e.target.closest('.world-top button'))setMenu(false);};
    $('#world').innerHTML=`<div class="village-viewport" id="village-viewport">
      <div class="village-hud"><div><small>CATWALK STERREN</small><strong id="village-region">Modeplein</strong></div><div class="town-hud-buttons"><button class="btn ghost sm" id="village-journal" type="button">📖 Dorpsboek</button><button class="btn ghost sm" id="village-overview" type="button">🗺️ Kaart</button></div></div>
      <div class="village-plane" id="village-plane">
        <div class="town-ground">${VillageArt.base()}</div>
        <svg class="town-route" viewBox="0 0 ${R.WIDTH} ${R.HEIGHT}" aria-hidden="true"><polyline id="town-route-line" points=""/></svg>
        ${HOUSES.map(h=>`<div class="town-building" style="left:${h.x-h.w/2}px;top:${h.y-h.h}px;width:${h.w}px;height:${h.h}px;z-index:${Math.round(h.y)}">${VillageArt.building(h)}</div><button class="village-door" data-house="${h.id}" type="button" style="left:${h.x}px;top:${h.y+7}px;z-index:${Math.round(h.y)+2}" aria-label="Loop naar ${h.name}"><span>${h.icon}</span><span>${h.name}<small>${h.sub}</small></span></button>`).join('')}
        ${R.NPCS.map(n=>`<button type="button" class="town-npc" data-npc="${n.id}" style="left:${n.x}px;top:${n.y}px;z-index:${n.y}" aria-label="Praat met ${n.name}"><span class="npc-bubble">!</span><span class="npc-person" style="--npc-color:${n.color}">${n.icon}</span><b>${n.name}</b></button>`).join('')}
        ${R.NODES.map(n=>`<button type="button" class="town-node ${n.kind}" data-node="${n.id}" style="left:${n.x}px;top:${n.y}px;z-index:${n.y}" aria-label="${n.name}"><span>${n.icon}</span></button>`).join('')}
        <div class="village-avatar" id="village-avatar"><div class="avatar-name">${esc(P.name)}</div><div class="avatar-turn" id="village-turn"><canvas width="400" height="490"></canvas></div></div>
      </div><div class="village-status" id="village-status" role="status">Tik op het pad om te wandelen</div>
    </div><div class="world-bottom"><div class="world-controls" aria-label="Loopknoppen">${[['ArrowLeft','←','Links'],['ArrowUp','↑','Omhoog'],['ArrowDown','↓','Omlaag'],['ArrowRight','→','Rechts']].map(([k,icon,name])=>`<button class="walk-key" data-key="${k}" type="button" aria-label="${name}">${icon}</button>`).join('')}</div><div class="world-action" id="world-action"></div><span class="keyboard-hint">Pijltjes / WASD: wandelen<br>Enter: praten of naar binnen</span></div>
    <dialog class="town-dialog" id="town-dialog" aria-labelledby="town-dialog-title"></dialog>`;
    els={viewport:$('#village-viewport'),plane:$('#village-plane'),avatar:$('#village-avatar'),turn:$('#village-turn'),status:$('#village-status'),region:$('#village-region'),action:$('#world-action')};
    document.querySelectorAll('[data-house]').forEach(b=>b.onclick=()=>goTo('house',b.dataset.house));
    document.querySelectorAll('[data-npc]').forEach(b=>b.onclick=()=>goTo('npc',b.dataset.npc));
    document.querySelectorAll('[data-node]').forEach(b=>b.onclick=()=>goTo('node',b.dataset.node));
    $('#village-overview').onclick=openMap;$('#village-journal').onclick=()=>openJournal();
    els.plane.onpointerdown=e=>{if(e.target.closest('button'))return;const r=els.plane.getBoundingClientRect();go({x:(e.clientX-r.left)/r.width*R.WIDTH,y:(e.clientY-r.top)/r.height*R.HEIGHT});};
    document.querySelectorAll('.walk-key').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);cancelRoute();keys.add(b.dataset.key);};['pointerup','pointercancel','lostpointercapture'].forEach(ev=>b.addEventListener(ev,()=>keys.delete(b.dataset.key)));});
    $('#town-dialog').addEventListener('close',()=>keys.clear());refreshNodes();
  }
  function refreshNodes(){
    R.NODES.forEach(n=>{const b=$(`[data-node="${n.id}"]`),done=P.town.collected.includes(n.id);b.classList.toggle('done',done);b.hidden=done&&n.kind==='buttons';b.querySelector('span').textContent=done?'🌸':n.icon;});
    R.NPCS.forEach(n=>{$(`[data-npc="${n.id}"] .npc-bubble`).textContent=P.town.completed.includes(n.quest)?'♥':R.progress(P.town,n.quest).ready?'✓':P.town.accepted.includes(n.quest)?'…':'!';});
  }
  function drawDoll(){if(!Avatar.isReady())return;const c=els.turn.querySelector('canvas'),g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);g.drawImage(Avatar.compose(P.look,P.outfit),0,0);painted=true;}
  const target=(kind,id)=>(kind==='house'?HOUSES:kind==='npc'?R.NPCS:R.NODES).find(x=>x.id===id);
  function goTo(kind,id){const t=target(kind,id);if(!t)return;Sound.play('klik');if(R.dist(pos,t)<72){activate({kind,id});return;}go(t,{kind,id});}
  function cancelRoute(){path=[];goal=null;const line=$('#town-route-line');if(line)line.setAttribute('points','');}
  function go(p,destination=null){keys.clear();path=R.route(pos,p);goal=path.length?destination:null;$('#town-route-line').setAttribute('points',[pos,...path].map(p=>`${p.x},${p.y}`).join(' '));updateHud();}
  function activate(t){
    cancelRoute();if(t.kind==='house'){R.visit(P.town,t.id);P.town.pos={...pos};cb.save?.();Sound.play('pop');cb.enter?.(t.id);}
    else if(t.kind==='npc'){const n=target(t.kind,t.id);openJournal(n.quest);}
    else {const n=target(t.kind,t.id);if(!P.town.accepted.includes(n.kind)){openJournal(n.kind);return;}
      const changed=R.collect(P.town,n.id);cb.save?.();refreshNodes();Sound.play(changed?'ding':'klik');
      cb.toast?.(changed?(n.kind==='garden'?'Je geeft water. De bloemen bloeien weer! 🌸':'Een gouden knoop gevonden! 🧵'):'Deze bloemen staan er al prachtig bij.');
      actionKey='';updateHud();}
  }
  function nearby(){
    const choices=[...HOUSES.map(h=>({...h,kind:'house'})),...R.NPCS.map(n=>({...n,kind:'npc'})),...R.NODES.filter(n=>n.kind==='garden'||!P.town.collected.includes(n.id)).map(n=>({...n,kind:'node'}))];
    return choices.filter(t=>R.dist(pos,t)<76).sort((a,b)=>R.dist(pos,a)-R.dist(pos,b))[0];
  }
  const keyMap={arrowleft:'ArrowLeft',a:'ArrowLeft',arrowright:'ArrowRight',d:'ArrowRight',arrowup:'ArrowUp',w:'ArrowUp',arrowdown:'ArrowDown',s:'ArrowDown'};
  function onKey(e){if(blocked()||e.target.closest?.('input,textarea,select'))return;const k=e.key.toLowerCase();if(keyMap[k]){e.preventDefault();e.target.closest?.('button')?.blur();cancelRoute();keys.add(keyMap[k]);}if((k==='enter'||k==='e')&&!e.repeat&&(!e.target.closest?.('button')||k==='e')){const t=nearby();if(t){e.preventDefault();activate(t);}}}
  function onKeyUp(e){keys.delete(keyMap[e.key.toLowerCase()]);}
  function tick(now){
    if(!active)return;const dt=Math.min(Math.max((now-last)/1000,0),.05);last=now;if(!painted)drawDoll();
    let next={...pos},arrived=null;
    if(!blocked()){
      const dx=Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft')),dy=Number(keys.has('ArrowDown'))-Number(keys.has('ArrowUp'));
      if(dx||dy){const len=Math.hypot(dx,dy),x=pos.x+dx/len*dt*R.SPEED,y=pos.y+dy/len*dt*R.SPEED;
        if(R.walkable(x,y))next={x,y};else if(R.walkable(x,pos.y))next.x=x;else if(R.walkable(pos.x,y))next.y=y;
      }else if(path.length){const t=path[0],d=R.dist(pos,t),step=dt*R.SPEED;if(d<=step){next={...t};path.shift();if(!path.length){arrived=goal;goal=null;$('#town-route-line').setAttribute('points','');}}else next={x:pos.x+(t.x-pos.x)/d*step,y:pos.y+(t.y-pos.y)/d*step};}
    }
    const moving=R.dist(pos,next)>.01;if(moving&&Math.abs(next.x-pos.x)>.01)facing=next.x>pos.x?1:-1;pos=next;
    if(moving){P.town.pos={...pos};if(now-lastSave>5000){lastSave=now;cb.save?.();}}
    els.avatar.classList.toggle('walking',moving);els.avatar.style.left=pos.x+'px';els.avatar.style.top=pos.y+'px';els.avatar.style.zIndex=Math.round(pos.y+4);els.turn.style.transform=`scaleX(${facing})`;
    layout();updateHud();if(arrived)activate(arrived);if(active)frame=requestAnimationFrame(tick);
  }
  function updateHud(){
    const t=nearby(),key=t?`${t.kind}_${t.id}_${P.town.collected.includes(t.id)}`:'none';
    if(key!==actionKey){actionKey=key;const label=t&&(t.kind==='house'?`${t.icon} Naar binnen`:t.kind==='npc'?`💬 Praat met ${t.name}`:t.id.startsWith('garden')?'💧 Bloemen water geven':'🧵 Knoop oprapen');els.action.innerHTML=t?`<button class="btn" id="world-enter" type="button">${label}<small>${t.kind==='house'?t.name:''}</small></button>`:'<p>Wandel, ontdek en ontmoet je buren 🌿</p>';if(t)$('#world-enter').onclick=()=>activate(t);document.querySelectorAll('.village-door').forEach(b=>b.classList.toggle('nearby',t?.id===b.dataset.house));}
    const destination=goal&&target(goal.kind,goal.id);
    const status=destination?`👣 Onderweg naar ${destination.name}`:t?t.name:'Tik op een pad · of kies een plek op de kaart';
    const region=pos.y>1190?(pos.x>1330?'Feestbuurt':'Wandelpark'):pos.x>1370?'Speelbuurt':'Modeplein';
    if(els.status.textContent!==status)els.status.textContent=status;if(els.region.textContent!==region)els.region.textContent=region;
  }
  // De knoppenbalk zweeft over de kaart: de camera telt alleen het zichtbare deel erboven,
  // zodat het poppetje daarin centreert en ook de onderste huizen boven de balk kunnen komen.
  function coveredByBar(){const bar=document.querySelector('#world .world-bottom');if(!bar||!els.viewport)return 0;const v=els.viewport.getBoundingClientRect(),b=bar.getBoundingClientRect();return b.height&&b.top<v.bottom&&b.bottom>v.top?Math.max(0,v.bottom-b.top+8):0;}
  function layout(){if(!active||!els.viewport)return;const vw=els.viewport.clientWidth,vh=els.viewport.clientHeight-coveredByBar(),scale=vw<600?.9:1;
    // voeten op 54% van het zichtbare deel, maar nooit zo hoog dat het hoofd onder de knoppen bovenin verdwijnt
    const feet=Math.min(vh-10,Math.max(vh*.54,(els.avatar?.offsetHeight||140)*scale+44));
    const x=Math.max(vw-R.WIDTH*scale,Math.min(0,vw/2-pos.x*scale)),y=Math.max(vh-R.HEIGHT*scale,Math.min(0,feet-pos.y*scale));
    els.plane.style.width=R.WIDTH+'px';els.plane.style.height=R.HEIGHT+'px';els.plane.style.transform=`translate(${x}px,${y}px) scale(${scale})`;}
  function dialog(title,html){keys.clear();const d=$('#town-dialog');d.innerHTML=`<header><h2 class="h" id="town-dialog-title">${title}</h2><button class="btn ghost sm" id="town-dialog-close" type="button" aria-label="Sluiten">✕</button></header>${html}`;$('#town-dialog-close').onclick=()=>d.close();if(!d.open)d.showModal();return d;}
  function miniMap(){return `<svg viewBox="0 0 ${R.WIDTH} ${R.HEIGHT}" class="town-minimap" aria-label="Plattegrond van het dorp"><rect width="2480" height="1760" rx="80" fill="#b6cd98"/><g fill="none" stroke="#efe0b9" stroke-width="70" stroke-linecap="round">${R.PATHS.map(p=>`<polyline points="${p.map(v=>v.join(',')).join(' ')}"/>`).join('')}</g><ellipse cx="1680" cy="940" rx="172" ry="152" fill="#8abdc5"/>${HOUSES.map((h,i)=>`<g><rect x="${h.x-h.w/2}" y="${h.y-h.h}" width="${h.w}" height="${h.h}" rx="30" fill="${h.color}" stroke="#fff2d1" stroke-width="8"/><text x="${h.x}" y="${h.y-h.h/2+22}" text-anchor="middle" fill="white" font-family="sans-serif" font-size="70" font-weight="bold">${i+1}</text></g>`).join('')}<circle cx="${pos.x}" cy="${pos.y}" r="38" fill="#6744bb" stroke="white" stroke-width="13"/></svg>`;}
  function openMap(){dialog('🗺️ Welkom in het grote dorp',`<p class="town-dialog-intro">Vier buurten, dertien deuren. Kies een plek en je wandelt er vanzelf heen. Het paarse stipje ben jij.</p><div class="town-map-layout">${miniMap()}<nav class="village-destinations" aria-label="Kies een huisje">${HOUSES.map((h,i)=>`<button class="destination-button" data-destination="${h.id}" type="button"><span class="town-map-number">${i+1}</span><span>${h.icon} ${h.name}<small>${h.sub}${P.town.visited.includes(h.id)?' · ✓ bezocht':''}</small></span></button>`).join('')}</nav></div>`);
    document.querySelectorAll('[data-destination]').forEach(b=>b.onclick=()=>{$('#town-dialog').close();goTo('house',b.dataset.destination);});}
  function openJournal(only){
    const quests=only?R.QUESTS.filter(q=>q.id===only):R.QUESTS;
    dialog(only?`💬 ${quests[0].who}`:'📖 Mijn dorpsboek',`<p class="town-dialog-intro">Help je buren en ontdek het dorp op je eigen tempo. Er is geen tijdslimiet.</p><div class="town-quests">${quests.map(q=>{
      const pr=R.progress(P.town,q.id),accepted=P.town.accepted.includes(q.id),done=P.town.completed.includes(q.id);
      return `<article class="town-quest"><h3>${q.icon} ${q.name}</h3><p>${q.desc}</p><div class="town-quest-progress"><progress max="${pr.total}" value="${pr.done}"></progress><b>${pr.done}/${pr.total}</b></div><small>${done?'✓ Bedankt! Je hebt deze buur al geholpen.':`${q.stars} sterren + XP en munten als beloning`}</small><div class="row wrap">${done?'':!accepted?`<button class="btn" data-accept="${q.id}" type="button">Ik help mee!</button>`:pr.ready?`<button class="btn gold" data-claim="${q.id}" type="button">🎁 Beloning ophalen</button>`:`<button class="btn ghost sm" data-guide="${q.id}" type="button">👣 Wijs de weg</button>`}</div></article>`;}).join('')}</div><div id="town-quest-result" role="status"></div>`);
    document.querySelectorAll('[data-accept]').forEach(b=>b.onclick=()=>{R.accept(P.town,b.dataset.accept);cb.save?.();refreshNodes();openJournal(only);Sound.play('ding');});
    document.querySelectorAll('[data-claim]').forEach(b=>b.onclick=()=>{const id=b.dataset.claim,stars=R.claim(P.town,id);if(!stars)return;const gain=cb.reward?.(stars,id);cb.save?.();refreshNodes();openJournal(only);$('#town-quest-result').innerHTML=`<p class="town-earned">${'⭐'.repeat(stars)} Dank je wel! ${gain?`+${gain.xp} XP · +${gain.coins} munten`:''}</p>${gain?.extra||''}`;Sound.play('tada');});
    document.querySelectorAll('[data-guide]').forEach(b=>b.onclick=()=>{const t=R.nextTarget(P.town,b.dataset.guide);if(!t)return;$('#town-dialog').close();goTo(HOUSES.some(h=>h.id===t.id)?'house':R.NPCS.some(n=>n.id===t.id)?'npc':'node',t.id);});
  }
  return {show,hide,HOUSES,_tick:tick,_state:()=>({active,pos:{...pos},path:[...path],goal})};
})();

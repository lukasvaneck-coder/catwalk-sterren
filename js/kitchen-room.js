/* A small overhead kitchen, original artwork, real worktops and persistent food. */
const KitchenRoom=(()=>{
  const R=KitchenRules,$=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const keys=new Set(),keyMap={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'up',w:'up',ArrowDown:'down',s:'down'};
  let P,cb,root,active=false,frame=0,last=0,target=null,path=[],working=null,accum=0,facing=1,moving=false,dash=0,cooldown=0,suspended=false;
  const current=()=>R.recipes.find(r=>r.id===P.kitchen.active?.id);
  function html(p){
    const a=p.kitchen.active,r=R.recipes.find(r=>r.id===a?.id),hand=R.held(p),items=R.allItems(p);
    return `<section class="kr-wrap" aria-label="Onze keuken"><div class="kr-orders">${r?`<div class="kr-order-title"><span>${r.icon}</span><div><small>VANAVOND OP TAFEL</small><b>${r.name}</b></div><em>∞ Geen haast</em></div><div class="kr-tickets">${r.steps.map((s,i)=>`<div class="kr-ticket ${a.done.includes(i)?'done':''}" data-ticket="${i}"><b aria-label="${esc(s[1])}">${a.done.includes(i)?'✓':R.stations[s[0]][0]}</b><span>${R.flows[r.id][i].map(id=>R.itemInfo(r,id).icon).join(' + ')}</span><progress data-task-progress="${i}" max="${R.duration(r,i)}" value="${a.done.includes(i)?R.duration(r,i):a.work[i]||0}"></progress></div>`).join('')}</div>`:'<div class="kr-order-title"><span>🏡</span><b>Wat eten we vanavond?</b><em>∞ Op je eigen tempo</em></div>'}</div><div class="kr-room kr-room-3d" id="kr-room"><div id="kr3d-host"></div><div class="kr-targets">${[...Object.keys(R.stations),'pantry'].map(id=>`<button class="kr-3d-target" data-station="${id}" aria-label="${id==='pantry'?'Voorraad':R.stations[id][1]}"></button>`).join('')}${items.filter(v=>v.at!=='hands').map(v=>`<button class="kr-3d-target kr-item-target" data-pick="${v.id}" data-source="${v.at}" aria-label="Pak ${v.dirty?'vuil bord':esc(R.itemInfo(r,v.id).name)}"></button>`).join('')}</div><div id="kr-avatar" hidden></div></div><div class="kr-bottom"><div class="kr-hands">${hand?`🙌 ${hand.dirty?'🍽️🫧':R.itemInfo(r,hand.id).icon}`:'🙌'}<span id="kr-nearby"></span></div><div class="kr-controls"><div class="kr-dpad">${[['left','←'],['up','↑'],['down','↓'],['right','→']].map(([id,icon])=>`<button data-walk="${id}" aria-label="Loop ${id}">${icon}</button>`).join('')}</div><button class="btn" id="kr-pick" aria-label="Pakken of neerleggen">↕ 🙌</button><button class="btn mint" id="kr-action" aria-label="Werken">🔪</button><button class="btn ghost" id="kr-dash" aria-label="Sprint">💨</button></div><details class="kr-help"><summary>🎮</summary><p>Tik op de vloer om te lopen. Tik op een ingrediënt om het te pakken, of op een werkplek om iets neer te leggen of te bereiden. Met 💨 loop je even sneller. Pannen koken vanzelf.</p></details></div></section>`;
  }
  function capture(){return {target,path:[...path],working,keys:[...keys],facing,dash,cooldown,suspended};}
  function mount(profile,callbacks,resume){unmount();P=profile;cb=callbacks;root=$('#kr-room');if(!root)return;active=true;target=resume?.target||null;path=resume?.path||[];working=resume?.working||null;facing=resume?.facing||1;dash=resume?.dash||0;cooldown=resume?.cooldown||0;(resume?.keys||[]).forEach(k=>keys.add(k));moving=false;accum=0;suspended=resume?.suspended||document.hidden;last=performance.now();
    root.querySelectorAll('[data-station]').forEach(b=>b.onclick=()=>go(b.dataset.station));root.querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>go(b.dataset.source,b.dataset.pick));
    root.onclick=e=>{if(e.target.closest('button'))return;const hit=Kitchen3D.hitTest(e.clientX,e.clientY);if(hit){go(hit.station,matchMedia('(pointer:coarse)').matches||innerWidth<=760?undefined:hit.item);return;}const to=Kitchen3D.floorPoint(e.clientX,e.clientY);if(to&&R.walkable(to.x,to.y)){target=to;path=R.route(P.kitchen.pos,to);working=null;keys.clear();paintTarget();}};
    document.querySelectorAll('[data-walk]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);target=null;path=[];working=null;keys.add(b.dataset.walk);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys.delete(b.dataset.walk);});
    $('#kr-pick').onclick=()=>interact(nearest(),null,'pick');$('#kr-action').onclick=()=>interact(nearest(),null,'work');$('#kr-dash').onclick=sprint;
    window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',pause);window.addEventListener('focus',resumeClock);window.addEventListener('pagehide',pause);document.addEventListener('visibilitychange',visibility);Kitchen3D.attach($('#kr3d-host'),P);paintTarget();paint();frame=requestAnimationFrame(tick);
  }
  function unmount(){Kitchen3D.detach();active=false;cancelAnimationFrame(frame);keys.clear();target=null;path=[];working=null;window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('blur',pause);window.removeEventListener('focus',resumeClock);window.removeEventListener('pagehide',pause);document.removeEventListener('visibilitychange',visibility);}
  function pause(){suspended=true;keys.clear();target=null;path=[];working=null;dash=0;if(active){paintTarget();cb.persist();}}
  function resumeClock(){suspended=false;last=performance.now();}
  function visibility(){if(document.hidden)pause();else resumeClock();}
  function sprint(){if(cooldown<=0){dash=.23;cooldown=.8;}}
  function keydown(e){if(!active||e.target.closest('input,textarea,select')||e.ctrlKey||e.metaKey||e.altKey)return;const key=keyMap[e.key]||keyMap[e.key.toLowerCase()];if(key){e.preventDefault();keys.add(key);target=null;path=[];working=null;}else if(e.key==='Shift'){e.preventDefault();if(!e.repeat)sprint();}else if(['e','E',' ','Enter'].includes(e.key)&&!e.repeat){if(e.key!=='e'&&e.key!=='E'&&e.target.closest('button'))return;e.preventDefault();interact(nearest(),null,e.key===' '?'pick':'work');}}
  function keyup(e){keys.delete(keyMap[e.key]||keyMap[e.key.toLowerCase()]);}
  const distance=v=>Math.hypot(P.kitchen.pos.x-v.x,P.kitchen.pos.y-v.y);
  function nearest(){return Object.keys(R.positions).filter(id=>R.near(P,id)).sort((a,b)=>distance(R.positions[a])-distance(R.positions[b]))[0];}
  function go(station,item){keys.clear();working=null;target={...R.positions[station],station,item};path=R.route(P.kitchen.pos,target);paintTarget();}
  function paintTarget(){}
  function paint(){
    const avatar=$('#kr-avatar');if(!avatar)return;avatar.classList.toggle('working',!!working);
    const station=nearest();$('#kr-action').textContent=working?'⏳':station==='sink'?'🫧':'🔪';$('#kr-action').disabled=!station||!R.ready(P,station)||!!R.held(P);$('#kr-pick').disabled=!station;$('#kr-pick').textContent=R.held(P)?'↓ 🙌':'↑ 🙌';$('#kr-nearby').textContent=station?(R.stations[station]?.[0]||'🧺'):'';
    Kitchen3D.update(P,{moving,working,facing,target});
    const a=P.kitchen.active,r=current();if(a)document.querySelectorAll('[data-task-progress]').forEach(el=>{const i=+el.dataset.taskProgress;el.value=a.done.includes(i)?R.duration(r,i):a.jobs[i]?R.duration(r,i)-a.jobs[i]:a.work[i]||0;});
  }
  function tick(now){if(!active)return;const dt=Math.min((now-last)/1000,.05);last=now;if(document.hidden||suspended||Kitchen3D.debug().contextLost){frame=requestAnimationFrame(tick);return;}dash=Math.max(0,dash-dt);cooldown=Math.max(0,cooldown-dt);
    let dx=Number(keys.has('right'))-Number(keys.has('left')),dy=Number(keys.has('down'))-Number(keys.has('up')),arrived=null;const pos=P.kitchen.pos;if(dx||dy){const direction=Kitchen3D.direction(dx,dy);dx=direction.x;dy=direction.y;}
    if(!dx&&!dy&&path.length){const point=path[0],d=distance(point);if(d<2){pos.x=point.x;pos.y=point.y;path.shift();if(!path.length){arrived=target;target=null;paintTarget();}}else{dx=(point.x-pos.x)/d;dy=(point.y-pos.y)/d;}}
    const len=Math.hypot(dx,dy),speed=Math.min((dash>0?540:215)*dt,path.length?distance(path[0]):Infinity),prev={...pos};
    if(len){working=null;const x=pos.x+dx/len*speed,y=pos.y+dy/len*speed;if(R.segment(pos,{x,y})){pos.x=x;pos.y=y;}else if(R.segment(pos,{x,y:pos.y}))pos.x=x;else if(R.segment(pos,{x:pos.x,y}))pos.y=y;if(dx)facing=dx>0?1:-1;}
    const moved=Math.hypot(pos.x-prev.x,pos.y-prev.y)>.01;if(moving&&!moved)cb.persist();moving=moved;
    accum+=dt;if(accum>=.25){const elapsed=accum;accum=0;if(working||Object.keys(P.kitchen.active?.jobs||{}).length){const result=cb.change(()=>{const cooking=R.advance(P,elapsed),task=working?R.work(P,working,elapsed):false;return ['served','prepared','washed'].includes(task)?task:cooking==='prepared'?'prepared':task||cooking;});if(['prepared','washed','served','cooking'].includes(result)){if(result!=='prepared'||working&&!R.ready(P,working))working=null;cb.update(result==='cooking'?'De pan staat aan. Je kunt ondertussen verder met iets anders.':result==='washed'?'Blinkend schoon! Pak het bord weer op.':result==='served'?'Eet smakelijk! Breng het vuile bord naar de afwas.':'Klaar! Je kunt het eten meenemen.');return;}}}
    paint();if(arrived?.station){const previous=root;interact(arrived.station,arrived.item);if(!active||root!==previous)return;}frame=requestAnimationFrame(tick);
  }
  function interact(station,itemId,mode='auto'){
    working=null;if(!station){cb.notice('Loop eerst naar een werkplek.');return;}let result;
    if(itemId){if(R.held(P)){cb.notice('Je handen zijn vol. Leg eerst iets neer.');return;}result=cb.change(()=>R.pickup(P,station,itemId));}
    else if(R.held(P))result=cb.change(()=>R.putdown(P,station));
    else if(mode!=='pick'&&R.ready(P,station)){working=station;target=null;path=[];keys.clear();return;}
    else if(mode!=='work'){const items=R.allItems(P).filter(v=>v.at===station);if(items.length>1){chooseItem(station,items);return;}if(items[0])result=cb.change(()=>R.pickup(P,station,items[0].id));}
    if(result){Sound.play('pop');cb.update(result==='picked'?'Opgepakt! Breng het naar de juiste werkplek.':'Neergelegd. Je kunt nu werken of andere ingrediënten halen.');}
    else cb.notice('Kijk op de receptkaartjes. Voor opdienen heb je ook een schoon bord nodig. Een kokende pan laat je even staan.');
  }
  function chooseItem(station,items){
    pause();const dialog=document.createElement('dialog');dialog.className='kr-pick-dialog';dialog.setAttribute('aria-label','Kies wat je wilt pakken');
    dialog.innerHTML=`<h2>🙌 Pak iets</h2><div>${items.map(item=>{const info=R.itemInfo(current(),item.id);return `<button class="btn ghost" data-choose="${item.id}" aria-label="Pak ${item.dirty?'vuil bord':esc(info.name)}"><span>${item.dirty?'🍽️🫧':info.icon}</span><small>${esc(info.name)}</small></button>`;}).join('')}</div><button class="btn ghost" data-cancel>Klaar</button>`;
    document.body.appendChild(dialog);dialog.addEventListener('close',()=>{dialog.remove();resumeClock();},{once:true});dialog.querySelector('[data-cancel]').onclick=()=>dialog.close();dialog.querySelectorAll('[data-choose]').forEach(b=>b.onclick=()=>{dialog.close();interact(station,b.dataset.choose);});dialog.showModal();
  }
  return {html,mount,unmount,capture};
})();

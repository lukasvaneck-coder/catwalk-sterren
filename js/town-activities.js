/* Binnenactiviteiten: ritmedans, dansgeheugen, vriendjes verzorgen en fotodecors. */
const TownActivities = (() => {
  const R=TownRules,$=s=>document.querySelector(s),esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const names={disco:'🪩 Sterrenclub',balzaal:'💃 Rozenzaal',knuffel:'🐾 Knuffelhuis',foto:'📸 Fotostudio'};
  const arrows=['←','↑','↓','→'],steps=['Buig','Draai','Stap','Zwaai'];
  let P,cb={},place,state=null,active=false,frame=0,last=0,paused=false,rewarded=false,care=[],photoBg='park',shownCue=-2,soundedBeat=-1;
  function show(profile,id,callbacks){hide();P=profile;cb=callbacks;place=id;R.migrate(P);active=true;state=null;paused=false;care=[];rewarded=false;
    render();window.addEventListener('keydown',keyDown);window.addEventListener('blur',autoPause);document.addEventListener('visibilitychange',visibility);
  }
  function hide(){active=false;cancelAnimationFrame(frame);state=null;window.removeEventListener('keydown',keyDown);window.removeEventListener('blur',autoPause);document.removeEventListener('visibilitychange',visibility);}
  function doll(){
    const bg=place==='foto'?photoBg:place==='knuffel'?'park':place;
    $('#activity-scene').style.backgroundImage=`url("assets/bg/${bg}.jpg")`;
    $('#activity-model').innerHTML=Avatar.render(P.look,P.outfit,{bg:false});
  }
  function render(){
    $('#town-activities').innerHTML=`<header class="activity-header"><button class="btn ghost sm" id="activity-exit" type="button">← Dorp</button><div><p class="eyebrow">EVEN LEKKER BINNEN</p><h1 class="h">${names[place]}</h1></div></header><main class="activity-layout"><div class="activity-scene" id="activity-scene"><div class="activity-room-sign">${place==='disco'?'DE DANSVLOER IS VAN JOU':place==='balzaal'?'EEN FEEST VOOR HET HELE DORP':place==='knuffel'?'ALLE VRIENDJES ZIJN WELKOM':'LAAT JOUW STIJL ZIEN'}</div><div id="activity-model"></div><div id="activity-cue" class="activity-cue" hidden></div></div><section class="activity-panel card" id="activity-panel"></section></main>`;
    const sound=document.createElement('button');sound.type='button';sound.className='btn ghost sm activity-sound';sound.id='activity-sound';
    const soundLabel=()=>{sound.textContent=Sound.isOn()?'🔊':'🔇';sound.setAttribute('aria-label',Sound.isOn()?'Geluid uit':'Geluid aan');};
    soundLabel();sound.onclick=()=>{Sound.toggle();soundLabel();};$('.activity-header').appendChild(sound);
    $('#activity-exit').onclick=()=>cb.exit();doll();if(place==='knuffel')petPanel();else if(place==='foto')photoPanel();else danceLobby();
  }
  function record(){const r=P.town.records[place];return r?`Jouw beste dans: ${'⭐'.repeat(r.stars)} · ${r.score}${place==='disco'?' raak':' punten'}`:'Nog geen dans gespeeld. Probeer het eens!';}
  function danceLobby(){
    $('#activity-panel').innerHTML=`<p class="eyebrow">${place==='disco'?'VOLG HET RITME':'KIJK, ONTHOUD, DANS'}</p><h2>${place==='disco'?'Doe mee met de dans!':'Leer de feestdans'}</h2><p>${place==='disco'?'Kijk naar de pijl. Tik op dezelfde pijl wanneer de cirkel klein wordt en er NU! staat. Twaalf passen, op een rustig ritme.':'Kijk naar de danspassen. Doe ze daarna in dezelfde volgorde na. Iedere ronde komt er een pas bij. Je mag de passen opnieuw bekijken.'}</p><div class="activity-example">${place==='disco'?arrows.join('　'):'🙇　🌀　👣　👋'}</div><p class="small">${record()}</p><button class="btn big" id="activity-start" type="button">${place==='disco'?'🎵 Start de muziek':'💃 Begin de dans'}</button><p class="small">${place==='disco'?'Tik op de pijlen of gebruik de pijltjestoetsen.':'Tik op de danspassen of gebruik de pijltjestoetsen.'} P of Escape pauzeert.</p>`;
    $('#activity-start').onclick=startDance;
  }
  function startDance(){
    state=place==='disco'?R.rhythm(Math.floor(Math.random()*4)):R.memory(Math.floor(Math.random()*4));paused=false;rewarded=false;shownCue=-2;soundedBeat=-1;
    $('#activity-panel').innerHTML=`<div class="activity-game-top"><b id="activity-score">${place==='disco'?'0 / 12 raak':'Ronde 1 / 4'}</b><button class="btn ghost sm" id="activity-pause" type="button">Ⅱ Pauze</button></div><p id="activity-instruction" role="status"></p><div class="activity-pads">${arrows.map((a,i)=>`<button class="activity-pad" data-pad="${i}" type="button" aria-label="${place==='disco'?['Links','Omhoog','Omlaag','Rechts'][i]:steps[i]}"><span>${place==='disco'?a:['🙇','🌀','👣','👋'][i]}</span><small>${place==='disco'?['Links','Omhoog','Omlaag','Rechts'][i]:steps[i]}</small></button>`).join('')}</div><button class="btn ghost sm" id="activity-replay" type="button" ${place==='disco'?'hidden':''}>👀 Laat de passen nog eens zien</button><div id="activity-result" role="status"></div>`;
    $('#activity-pause').onclick=()=>setPaused(!paused);$('#activity-replay').onclick=()=>{if(state.finished)return;state.phase='watch';state.time=0;state.index=0;shownCue=-2;};
    document.querySelectorAll('[data-pad]').forEach(b=>b.onclick=()=>press(+b.dataset.pad));
    $('#activity-cue').hidden=false;last=performance.now();tick(last);
  }
  function press(pad){
    if(!state||state.finished||paused)return;
    let good=false;
    if(place==='disco')good=R.rhythmPress(state,pad);
    else{const result=R.memoryPress(state,pad);good=['ok','round','finish'].includes(result);if(result==='retry'){$('#activity-instruction').textContent='Bijna! Kijk nog een keer en probeer opnieuw.';$('#activity-replay').hidden=false;}if(result==='finish'){$('#activity-score').textContent=`Ronde 4 / 4 · ${state.sequence.length}/${state.sequence.length} passen`;finish();return;}}
    if(good){Sound.play('pop');$('#activity-model').classList.remove('activity-hop');void $('#activity-model').offsetWidth;$('#activity-model').classList.add('activity-hop');}
    updateGame();
  }
  function setPaused(value){if(!state||state.finished)return;paused=value;$('#activity-pause').textContent=paused?'▶ Verder dansen':'Ⅱ Pauze';$('#activity-cue').classList.toggle('paused',paused);if(paused){$('#activity-instruction').textContent='Even pauze. Klik op Verder dansen als je klaar bent.';$('#activity-cue').textContent='Ⅱ';}shownCue=-2;}
  const autoPause=()=>setPaused(true),visibility=()=>{if(document.hidden)autoPause();};
  function keyDown(e){if(!active||e.target.closest?.('input,select,textarea'))return;
    if(['p','P','Escape'].includes(e.key)&&!e.repeat){e.preventDefault();setPaused(!paused);return;}
    const pad=['ArrowLeft','ArrowUp','ArrowDown','ArrowRight'].indexOf(e.key);if(pad<0)return;e.preventDefault();if(!e.repeat)press(pad);
  }
  function tick(now){
    if(!active||!state||state.finished)return;const dt=Math.min(Math.max((now-last)/1000,0),.05);last=now;
    if(!paused&&!document.hidden&&$('#overlay').hidden){state.time+=dt;
      if(place==='disco'){const beat=Math.floor((state.time-state.lead)/state.beat);if(beat>=0&&beat<state.count&&beat!==soundedBeat){soundedBeat=beat;Sound.danceBeat(beat);}}
      if(place==='disco'&&state.time>state.lead+(state.count-1)*state.beat+.6){finish();return;}
      if(place==='balzaal'&&state.phase==='watch'&&state.time>(state.round+3)*.9+.5){state.phase='input';state.index=0;shownCue=-2;}
      updateGame();
    }frame=requestAnimationFrame(tick);
  }
  function updateGame(){
    if(!state||state.finished||paused)return;
    const cue=$('#activity-cue');
    if(place==='disco'){
      const raw=Math.floor((state.time-state.lead+state.beat/2)/state.beat),i=Math.max(0,Math.min(state.count-1,raw));
      const distance=Math.abs(state.time-(state.lead+i*state.beat)),now=distance<=.43&&raw>=0;
      cue.innerHTML=`<span>${arrows[state.notes[i]]}</span><small>${now?'NU!':state.time<state.lead-.5?'Klaar?':'Even wachten…'}</small>`;
      cue.style.setProperty('--beat-scale',String(1+Math.min(distance,1)*.35));cue.classList.toggle('on-beat',now);
      $('#activity-instruction').textContent=state.time<state.lead-.5?'De muziek begint zo…':now?'Tik nu op de juiste pijl!':'Wacht tot de cirkel klein is.';
      $('#activity-score').textContent=`${state.hits} / 12 raak · pas ${Math.min(state.count,Math.max(1,raw+1))}/12`;
    }else{
      const watching=state.phase==='watch',idx=Math.floor(state.time/.9),lit=watching&&idx<state.round+3&&state.time%.9<.68,which=lit?state.sequence[idx]:-1;
      if(which!==shownCue){shownCue=which;document.querySelectorAll('[data-pad]').forEach(b=>b.classList.toggle('lit',+b.dataset.pad===which));cue.innerHTML=lit?`<span>${['🙇','🌀','👣','👋'][which]}</span><small>${steps[which]}</small>`:`<span>${state.phase==='input'?'💃':'👀'}</span><small>${state.phase==='input'?'Jouw beurt':'Kijk goed'}</small>`;if(lit)Sound.play('klik');}
      document.querySelectorAll('[data-pad]').forEach(b=>b.disabled=state.phase!=='input');
      $('#activity-replay').disabled=watching;
      $('#activity-score').textContent=`Ronde ${state.round+1} / 4 · ${state.index}/${state.round+3} passen`;
      $('#activity-instruction').textContent=watching?'Kijk en onthoud de volgorde…':state.phase==='retry'?'Bijna! Bekijk de passen nog eens en probeer opnieuw.':`Jouw beurt! Doe de ${state.round+3} passen na.`;
    }
  }
  function finish(){
    if(rewarded)return;rewarded=true;state.finished=true;cancelAnimationFrame(frame);
    const score=place==='disco'?state.hits:Math.max(1,12-state.errors),stars=place==='disco'?R.danceStars(score):state.errors<=2?3:state.errors<=5?2:1;
    const old=P.town.records[place];P.town.records[place]={score:Math.max(old?.score||0,score),stars:Math.max(old?.stars||0,stars)};
    const gain=stars?cb.reward(stars,place):null;cb.save();
    $('#activity-cue').className='activity-cue';$('#activity-cue').textContent=stars?'✨':'💜';
    document.querySelectorAll('[data-pad]').forEach(b=>b.disabled=true);$('#activity-pause').disabled=true;$('#activity-replay').hidden=true;
    $('#activity-instruction').textContent=stars?'Een applaus voor jouw dans!':'Lekker geoefend! Probeer het nog een keer.';
    $('#activity-result').innerHTML=`<div class="activity-finish"><h2>${stars?'⭐'.repeat(stars):'Goed geprobeerd'}</h2><p>${place==='disco'?`${score} van de 12 passen op het ritme.`:'Je hebt de hele feestdans onthouden!'}</p>${gain?`<p>+${gain.xp} XP · +${gain.coins} munten</p>${gain.extra||''}`:''}<button class="btn" id="activity-again" type="button">Nog een dansje!</button></div>`;
    $('#activity-again').onclick=startDance;Sound.play(stars?'tada':'klik');
  }
  function petPanel(){
    const pets=ITEMS.filter(i=>i.cat==='pet'&&P.owned.includes(i.id)),plush=ITEMS.filter(i=>i.cat==='hand'&&(i.shape.startsWith('plush')||i.shape==='teddy')&&P.owned.includes(i.id));
    if(!pets.some(i=>i.id===P.outfit.pet))P.outfit.pet=pets[0]?.id;
    const select=(id,list,current)=>`<select id="${id}">${list.map(it=>`<option value="${it.id}" ${current===it.id?'selected':''}>${esc(it.name)}</option>`).join('')}</select>`;
    $('#activity-panel').innerHTML=`<p class="eyebrow">KLEINE VRIENDJES, GROOT PLEZIER</p><h2>Wie gaat er mee?</h2><label class="activity-field">Huisdier${select('activity-pet',pets,P.outfit.pet)}</label><label class="activity-field">Knuffel${select('activity-plush',[{id:'',name:'Geen knuffel'},...plush],P.outfit.hand)}</label><p>Verzorg je huisdier. Na drie verschillende lieve dingen krijg je een cadeautje, één keer per huisdier.</p><div class="activity-care">${[['aaien','💗','Aaien'],['water','💧','Water geven'],['spelen','🎾','Samen spelen']].map(([id,icon,name])=>`<button class="btn ghost" data-care="${id}" type="button">${icon} ${name}</button>`).join('')}</div><p id="activity-pet-status" role="status">Je vriendje is blij dat je er bent!</p>`;
    $('#activity-pet').onchange=e=>{P.outfit.pet=e.target.value;care=[];cb.save();petPanel();};
    $('#activity-plush').onchange=e=>{if(e.target.value)P.outfit.hand=e.target.value;else delete P.outfit.hand;cb.save();doll();};
    document.querySelectorAll('[data-care]').forEach(b=>b.onclick=()=>{
      const id=b.dataset.care;if(care.includes(id))return;care.push(id);b.disabled=true;b.textContent+=' ✓';Sound.play('pop');
      $('#activity-pet-status').textContent=`${care.length}/3 · ${id==='aaien'?'Wat een lieve knuffel!':id==='water'?'Heerlijk fris water!':'Je vriendje speelt vrolijk mee!'}`;
      if(care.length===3){if(!P.town.cared.includes(P.outfit.pet)){P.town.cared.push(P.outfit.pet);const gain=cb.reward(1,'pet_'+P.outfit.pet);cb.save();$('#activity-pet-status').innerHTML=`⭐ Bedankt voor je goede zorgen! +${gain.xp} XP · +${gain.coins} munten.${gain.extra||''}`;}else $('#activity-pet-status').textContent='💗 Helemaal blij! Het verzorgingscadeautje voor dit vriendje heb je al gekregen.';}
    });cb.save();doll();
  }
  function photoPanel(){
    $('#activity-panel').innerHTML=`<p class="eyebrow">JOUW EIGEN FOTOSHOOT</p><h2>Kies je decor</h2><p>Neem je outfit, huisdier en knuffel mee op de foto. Je mag zoveel foto’s maken als je wilt.</p><div class="activity-photo-choices">${[['park','🌳','In het park'],['kamer','🛋️','In de studio'],['disco','🪩','Op de dansvloer'],['balzaal','💃','In de balzaal']].map(([id,icon,name])=>`<button type="button" class="btn ghost" data-photo-bg="${id}" aria-pressed="${photoBg===id}">${icon} ${name}</button>`).join('')}</div><button class="btn big" id="activity-photo" type="button">📸 Maak mijn foto</button><p class="small">Je kunt de foto daarna op je apparaat bewaren.</p>`;
    document.querySelectorAll('[data-photo-bg]').forEach(b=>b.onclick=()=>{photoBg=b.dataset.photoBg;document.querySelectorAll('[data-photo-bg]').forEach(x=>x.setAttribute('aria-pressed',x===b));doll();});
    $('#activity-photo').onclick=()=>cb.photo(photoBg);
  }
  return {show,hide,_state:()=>state};
})();

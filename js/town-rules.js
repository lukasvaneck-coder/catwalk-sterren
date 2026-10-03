/* De dorpskaart en voortgang staan los van tekenen en bediening. Coördinaten in wereldpixels. */
const TownRules = (() => {
  const WIDTH = 2480, HEIGHT = 1760, CELL = 32, SPEED = 210, VERSION = 2;
  const HOUSES = [
    { id:'kleedkamer', x:400, y:470, w:250, h:220, icon:'👗', name:'Modehuis', sub:'Aankleden & de jury', color:'#d986b0', zone:'Modeplein' },
    { id:'atelier', x:810, y:450, w:230, h:210, icon:'✂️', name:'Naaiatelier', sub:'Je eigen kleding maken', color:'#ca9976', zone:'Modeplein' },
    { id:'winkel', x:1210, y:450, w:230, h:210, icon:'🛍️', name:'Sterrenwinkel', sub:'Nieuwe spullen uitzoeken', color:'#d8ae60', zone:'Modeplein' },
    { id:'leshuis', x:1610, y:450, w:220, h:210, icon:'🌦️', name:'Wijzerhuis', sub:'Weer & budgetopdrachten', color:'#74a5ba', zone:'Speelbuurt' },
    { id:'race', x:2120, y:520, w:290, h:235, icon:'🏁', name:'Raceclub', sub:'Vijf raceparcoursen', color:'#ce795c', zone:'Speelbuurt' },
    { id:'salon', x:320, y:1000, w:220, h:210, icon:'🪞', name:'Spiegelsalon', sub:'Je uiterlijk aanpassen', color:'#bda1ce', zone:'Modeplein' },
    { id:'puzzel', x:750, y:990, w:240, h:220, icon:'🎨', name:'Kleurenhuis', sub:'Kleuren combineren', color:'#73a68d', zone:'Modeplein' },
    { id:'duel', x:1150, y:960, w:230, h:220, icon:'⚔️', name:'Duelhuis', sub:'Een modeduel met z’n tweeën', color:'#9a8ac3', zone:'Modeplein' },
    { id:'speeltuin', x:2110, y:1070, w:320, h:260, icon:'🛝', name:'Binnenspeeltuin', sub:'Springbaan & trampoline', color:'#63a9ab', zone:'Speelbuurt' },
    { id:'foto', x:420, y:1460, w:230, h:215, icon:'📸', name:'Fotostudio', sub:'Je outfit op de foto', color:'#b594b7', zone:'Wandelpark' },
    { id:'knuffel', x:940, y:1490, w:250, h:210, icon:'🐾', name:'Knuffelhuis', sub:'Vriendjes kiezen & verzorgen', color:'#b8a071', zone:'Wandelpark' },
    { id:'disco', x:1560, y:1450, w:280, h:235, icon:'🪩', name:'Sterrenclub', sub:'Dans op het ritme', color:'#9978b7', zone:'Feestbuurt' },
    { id:'balzaal', x:2150, y:1510, w:350, h:270, icon:'💃', name:'Rozenzaal', sub:'Onthoud de feestelijke dans', color:'#b292b6', zone:'Feestbuurt' },
  ];
  const PATHS = [
    [[180,620],[2280,620]], [[180,620],[180,1110],[1190,1110]],
    [[1300,620],[1420,620],[1420,1120],[2280,1120],[2280,620]],
    [[600,1110],[600,1600],[2280,1600],[2280,1120]], [[1420,1120],[1420,1600]],
    [[180,1110],[180,1600],[600,1600]], [[1420,960],[1920,960],[1920,1120]],
    ...HOUSES.map(h => [[h.x,h.y],[h.x,h.y<650?620:h.y<1150?1110:1600]]),
  ];
  const POND = { x:1680, y:940, rx:172, ry:152 };
  const START = { x:950, y:710 };
  const NPCS = [
    { id:'fleur', x:900, y:635, name:'Fleur', icon:'👩‍🌾', quest:'garden', color:'#efa5a6' },
    { id:'noor', x:1440, y:685, name:'Noor', icon:'👩‍🎨', quest:'ribbons', color:'#bca1df' },
    { id:'bo', x:1050, y:1170, name:'Bo', icon:'🧑‍🦱', quest:'buttons', color:'#9ac5a9' },
  ];
  const NODES = [
    { id:'garden_1', x:570,y:660,kind:'garden',icon:'🌷',name:'Bloembak bij het Modeplein' },
    { id:'garden_2', x:1970,y:1190,kind:'garden',icon:'🌷',name:'Bloembak bij de speeltuin' },
    { id:'garden_3', x:1190,y:1560,kind:'garden',icon:'🌷',name:'Bloembak in het wandelpark' },
    { id:'button_1', x:235,y:570,kind:'buttons',icon:'🧵',name:'Gouden knoop bij de haag' },
    { id:'button_2', x:2310,y:725,kind:'buttons',icon:'🧵',name:'Gouden knoop bij de raceclub' },
    { id:'button_3', x:1520,y:1130,kind:'buttons',icon:'🧵',name:'Gouden knoop bij de vijver' },
    { id:'button_4', x:310,y:1560,kind:'buttons',icon:'🧵',name:'Gouden knoop bij de fotostudio' },
    { id:'button_5', x:1830,y:1660,kind:'buttons',icon:'🧵',name:'Gouden knoop in de feestbuurt' },
  ];
  const QUESTS = [
    { id:'garden', name:'Een dorp vol bloemen', icon:'🌷', who:'Fleur', desc:'Geef de drie bloembakken water. Loop naar een bloembak en pak je gieter!', goals:NODES.filter(n=>n.kind==='garden').map(n=>n.id), stars:2 },
    { id:'ribbons', name:'Lintjes voor het feest', icon:'🎀', who:'Noor', desc:'Breng Noors feestlintjes naar het Naaiatelier, de Sterrenclub en de Rozenzaal. Ga bij elk gebouw naar binnen.', goals:['atelier','disco','balzaal'], stars:2 },
    { id:'buttons', name:'Bo’s verdwenen knopen', icon:'🧵', who:'Bo', desc:'Zoek vijf gouden knopen in de buurten van het dorp. Ze liggen buiten, langs paden en tussen de bloemen.', goals:NODES.filter(n=>n.kind==='buttons').map(n=>n.id), stars:3 },
    { id:'explorer', name:'Mijn dorpspaspoort', icon:'🗺️', who:'Het dorp', desc:'Bezoek alle dertien gebouwen. Iedere eerste stap naar binnen levert een stempel op.', goals:HOUSES.map(h=>h.id), stars:3 },
  ];
  const finite = v => typeof v === 'number' && Number.isFinite(v);
  function walkable(x,y) {
    if (!finite(x)||!finite(y)||x<48||y<100||x>WIDTH-48||y>HEIGHT-48) return false;
    if (HOUSES.some(h=>x>h.x-h.w/2-10&&x<h.x+h.w/2+10&&y>h.y-h.h-15&&y<h.y-15)) return false;
    if (((x-POND.x)/POND.rx)**2+((y-POND.y)/POND.ry)**2<1.08 && Math.abs(y-960)>30) return false;
    if (((x-1050)/95)**2+((y-655)/40)**2<1) return false;
    return true;
  }
  const dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
  const GW = Math.ceil(WIDTH/CELL), GH = Math.ceil(HEIGHT/CELL);
  const point = i => ({x:(i%GW+.5)*CELL,y:(Math.floor(i/GW)+.5)*CELL});
  function nearest(p) {
    let best=Infinity, found=null;
    for(let i=0;i<GW*GH;i++){const c=point(i);if(!walkable(c.x,c.y))continue;const d=(c.x-p.x)**2+(c.y-p.y)**2;if(d<best){best=d;found=i;}}
    return found;
  }
  function route(from,to) {
    if (!finite(from?.x)||!finite(from?.y)||!finite(to?.x)||!finite(to?.y)) return [];
    const a=nearest(from),b=nearest(to);if(a===null||b===null)return [];
    const prev=new Int32Array(GW*GH).fill(-2),queue=[a];prev[a]=-1;
    for(let i=0;i<queue.length&&prev[b]===-2;i++) {
      const c=queue[i],x=c%GW,y=Math.floor(c/GW);
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx=x+dx,ny=y+dy,n=ny*GW+nx;
        if(nx<0||ny<0||nx>=GW||ny>=GH||prev[n]!==-2)continue;
        const p=point(n),mid={x:(p.x+point(c).x)/2,y:(p.y+point(c).y)/2};
        if(!walkable(p.x,p.y)||!walkable(mid.x,mid.y))continue;
        prev[n]=c;queue.push(n);
      }
    }
    if(prev[b]===-2)return [];
    const out=[];for(let c=b;c!==-1;c=prev[c])out.unshift(point(c));
    // Houd bochten en eindpunt; zo beweegt de camera rustig langs de rechte paden.
    const corners=out.filter((p,i)=>!i||i===out.length-1||(p.x-out[i-1].x!==out[i+1].x-p.x)||(p.y-out[i-1].y!==out[i+1].y-p.y));
    if(walkable(to.x,to.y)&&dist(point(b),to)<CELL)corners.push({x:to.x,y:to.y});
    return corners;
  }
  function migrate(p) {
    const old=p.town&&typeof p.town==='object'?p.town:{};
    const valid=(list,ids)=>[...new Set((Array.isArray(list)?list:[]).filter(id=>ids.includes(id)))];
    const records={};for(const id of ['disco','balzaal']){const r=old.records?.[id];if(r&&finite(r.stars)&&finite(r.score))records[id]={stars:Math.floor(Math.max(0,Math.min(3,r.stars))),score:Math.floor(Math.max(0,Math.min(12,r.score)))};}
    p.town={ version:VERSION, visited:valid(old.visited,HOUSES.map(h=>h.id)), accepted:valid(old.accepted,QUESTS.map(q=>q.id)),
      completed:valid(old.completed,QUESTS.map(q=>q.id)), collected:valid(old.collected,NODES.map(n=>n.id)),
      delivered:valid(old.delivered,['atelier','disco','balzaal']), cared:[...new Set((Array.isArray(old.cared)?old.cared:[]).filter(id=>typeof id==='string'))].slice(0,100), records,
      pos:old.version===VERSION&&walkable(old.pos?.x,old.pos?.y)?{x:old.pos.x,y:old.pos.y}:{...START} };
    if(!p.town.accepted.includes('explorer'))p.town.accepted.push('explorer');
    return p.town;
  }
  function progress(t,id) {
    const q=QUESTS.find(q=>q.id===id);if(!q)return {done:0,total:0,ready:false};
    const list=id==='explorer'?t.visited:id==='ribbons'?t.delivered:t.collected;
    const done=q.goals.filter(g=>list.includes(g)).length;
    return {done,total:q.goals.length,ready:done===q.goals.length};
  }
  function accept(t,id){if(!QUESTS.some(q=>q.id===id)||t.accepted.includes(id))return false;t.accepted.push(id);return true;}
  function visit(t,id){if(!HOUSES.some(h=>h.id===id))return false;if(!t.visited.includes(id))t.visited.push(id);if(t.accepted.includes('ribbons')&&['atelier','disco','balzaal'].includes(id)&&!t.delivered.includes(id))t.delivered.push(id);return true;}
  function collect(t,id){const n=NODES.find(n=>n.id===id);if(!n||!t.accepted.includes(n.kind)||t.collected.includes(id))return false;t.collected.push(id);return true;}
  function claim(t,id){if(!t.accepted.includes(id)||t.completed.includes(id)||!progress(t,id).ready)return false;t.completed.push(id);return QUESTS.find(q=>q.id===id).stars;}
  function nextTarget(t,id){const q=QUESTS.find(q=>q.id===id);if(!q)return null;const list=id==='explorer'?t.visited:id==='ribbons'?t.delivered:t.collected;const goal=q.goals.find(g=>!list.includes(g));return HOUSES.find(h=>h.id===goal)||NODES.find(n=>n.id===goal)||NPCS.find(n=>n.quest===id)||null;}
  function rhythm(seed=0){return {kind:'disco',time:0,beat:1.1,lead:2,count:12,notes:Array.from({length:12},(_,i)=>(i*3+Math.floor(i/3)+seed)%4),used:[],hits:0,finished:false};}
  function rhythmPress(s,pad){if(s.finished)return false;const i=Math.round((s.time-s.lead)/s.beat);if(i<0||i>=s.count||s.used.includes(i)||Math.abs(s.time-(s.lead+i*s.beat))>.43)return false;s.used.push(i);if(s.notes[i]===pad){s.hits++;return true;}return false;}
  const danceStars=hits=>hits>=10?3:hits>=6?2:hits>0?1:0;
  function memory(seed=0){return {kind:'balzaal',round:0,index:0,errors:0,phase:'watch',time:0,sequence:Array.from({length:6},(_,i)=>(i*i+3*i+Math.floor(i/2)+seed)%4),finished:false};}
  function memoryPress(s,pad){if(s.finished||s.phase!=='input')return 'wait';if(pad!==s.sequence[s.index]){s.errors++;s.index=0;s.phase='retry';return 'retry';}s.index++;if(s.index===s.round+3){s.round++;s.index=0;if(s.round===4){s.finished=true;return 'finish';}s.phase='watch';s.time=0;return 'round';}return 'ok';}
  return {WIDTH,HEIGHT,CELL,SPEED,VERSION,HOUSES,PATHS,POND,START,NPCS,NODES,QUESTS,walkable,dist,route,migrate,progress,accept,visit,collect,claim,nextTarget,rhythm,rhythmPress,danceStars,memory,memoryPress};
})();

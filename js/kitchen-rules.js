/* Voorraad en recepten: dezelfde regels voor de winkel, keuken en opgeslagen spellen. */
const KitchenRules = (() => {
  const ingredients = {
    potato:['🥔','Aardappel',2], tomato:['🍅','Tomaat',2], dough:['🌾','Deeg',3], cheese:['🧀','Kaas',3],
    pasta:['🍝','Pasta',3], rice:['🍚','Rijst',3], veg:['🥕','Groente',2], spice:['🧂','Kruiden',1],
    milk:['🥛','Melk',2], fruit:['🍓','Fruit',2], cone:['🍦','IJshoorntje',1]
  };
  const stations = {cut:['🔪','Snijplank'],boil:['🍲','Kookplaat'],fry:['🍳','Bakpan'],oven:['♨️','Oven'],mix:['🥣','Mengkom'],ice:['🍨','IJsmachine'],plate:['🍽️','Opdienen'],serve:['🪑','Eettafel']};
  const recipes = [
    {id:'fries',theme:'Snackbar',icon:'🍟',name:'Frietjes met tomatensalade',needs:{potato:2,tomato:1},steps:[['cut','Snijd de aardappels',3],['fry','Bak de frietjes',4],['cut','Snijd de tomaat',3],['plate','Schep alles op de borden',2],['serve','Zet het avondeten op tafel',1]]},
    {id:'pizza',theme:'Italiaans',icon:'🍕',name:'Groentepizza',needs:{dough:1,tomato:1,cheese:1,veg:1},steps:[['cut','Snijd de groenten',3],['mix','Beleg de pizzabodem',3],['oven','Bak de pizza',4],['plate','Verdeel de pizzapunten',2],['serve','Zet de pizza op tafel',1]]},
    {id:'pasta',theme:'Italiaans',icon:'🍝',name:'Pasta met tomatensaus',needs:{pasta:1,tomato:2,cheese:1},steps:[['cut','Snijd de tomaten',3],['boil','Kook de pasta',4],['fry','Maak de tomatensaus',3],['plate','Schep op en strooi kaas',2],['serve','Zet de pasta op tafel',1]]},
    {id:'rice',theme:'Indisch',icon:'🍛',name:'Nasi met groenten',needs:{rice:1,veg:2,spice:1},steps:[['cut','Snijd de groenten',3],['boil','Kook de rijst',4],['fry','Roerbak rijst, groenten en kruiden',4],['plate','Vul de borden',2],['serve','Zet de nasi op tafel',1]]},
    {id:'ice',theme:'IJssalon',icon:'🍦',name:'Fruitijs als toetje',needs:{milk:1,fruit:2,cone:1},steps:[['cut','Snijd het fruit',3],['mix','Meng fruit en melk',3],['ice','Draai het fruitijs',4],['plate','Schep ijs in de hoorntjes',2],['serve','Breng het toetje naar tafel',1]]}
  ];
  // Each ingredient is a tray with the recipe's full quantity. Prepared trays
  // remain on their worktop until the player picks them up and carries them on.
  const flows={
    fries:[['potato'],['step0'],['tomato'],['step1','step2'],['step3']],
    pizza:[['veg'],['dough','tomato','cheese','step0'],['step1'],['step2'],['step3']],
    pasta:[['tomato'],['pasta'],['step0'],['step1','step2','cheese'],['step3']],
    rice:[['veg'],['rice'],['step0','step1','spice'],['step2'],['step3']],
    ice:[['fruit'],['milk','step0'],['step1'],['step2','cone'],['step3']]
  };
  const prepared={fries:['Gesneden aardappels','Gebakken frietjes','Gesneden tomaat','Borden frietjes'],pizza:['Gesneden groenten','Belegde pizza','Gebakken pizza','Pizzapunten op borden'],pasta:['Gesneden tomaten','Gekookte pasta','Tomatensaus','Borden pasta'],rice:['Gesneden groenten','Gekookte rijst','Gebakken nasi','Borden nasi'],ice:['Gesneden fruit','Fruitmengsel','Fruitijs','IJshoorntjes']};

  Object.assign(stations,{rack:['🍽️','Schone borden'],sink:['🫧','Afwas'],counterA:['▱','Aanrecht links'],counterB:['▱','Aanrecht rechts']});
  const positions={cut:{x:240,y:235},boil:{x:390,y:235},fry:{x:540,y:235},oven:{x:690,y:235},mix:{x:240,y:550},ice:{x:390,y:550},plate:{x:540,y:550},serve:{x:800,y:550},pantry:{x:150,y:370},rack:{x:850,y:255},sink:{x:850,y:435},counterA:{x:430,y:285},counterB:{x:570,y:475}};
  const layout={cut:[185,65],boil:[335,65],fry:[485,65],oven:[635,65],mix:[185,580],ice:[335,580],plate:[485,580],serve:[735,580],rack:[890,180],sink:[890,365],counterA:[380,330],counterB:[510,330]};
  const walkable=(x,y)=>Number.isFinite(x)&&Number.isFinite(y)&&x>=140&&x<=870&&y>=205&&y<=565&&!(x>355&&x<655&&y>310&&y<450);
  const near=(p,station)=>positions[station]&&Math.hypot(p.kitchen.pos.x-positions[station].x,p.kitchen.pos.y-positions[station].y)<=60;
  function segment(a,b){const n=Math.ceil(Math.hypot(a.x-b.x,a.y-b.y)/5);for(let i=0;i<=n;i++)if(!walkable(a.x+(b.x-a.x)*i/(n||1),a.y+(b.y-a.y)*i/(n||1)))return false;return true;}
  function route(from,to){
    if(!walkable(from.x,from.y)||!walkable(to.x,to.y))return [];
    const nodes=[from,to,{x:335,y:290},{x:675,y:290},{x:335,y:470},{x:675,y:470}],dist=nodes.map(()=>Infinity),prev=[],seen=new Set();dist[0]=0;
    for(let n=0;n<nodes.length;n++){let u=-1;for(let i=0;i<nodes.length;i++)if(!seen.has(i)&&(u<0||dist[i]<dist[u]))u=i;if(u<0||!Number.isFinite(dist[u]))break;if(u===1)break;seen.add(u);for(let v=0;v<nodes.length;v++)if(v!==u&&segment(nodes[u],nodes[v])){const d=dist[u]+Math.hypot(nodes[u].x-nodes[v].x,nodes[u].y-nodes[v].y);if(d<dist[v]){dist[v]=d;prev[v]=u;}}}
    if(!Number.isFinite(dist[1]))return [];const path=[];for(let i=1;i!==0;i=prev[i])path.unshift({...nodes[i]});return path;
  }
  const heat=new Set(['boil','fry','oven','ice']);
  const duration=(r,i)=>heat.has(r.steps[i][0])?6:r.steps[i][0]==='serve'?.5:2.4;
  const count=n=>Number.isSafeInteger(n)&&n>=0?Math.min(n,9999):0;
  function initialItems(r,done=[]){let items=Object.keys(r.needs).map(id=>({id,at:'pantry'}));for(const i of [...done].sort((a,b)=>a-b)){items=items.filter(v=>!flows[r.id][i].includes(v.id));items.push({id:'step'+i,at:r.steps[i][0]});}return items;}
  function itemInfo(r,id){if(id.startsWith('dish'))return {icon:'🍽️',name:'Bord'};const v=ingredients[id];if(v)return {icon:v[0],name:`${r.needs[id]} × ${v[1]}`};const index=Number(id.slice(4));return {icon:index===r.steps.length-2?'🍽️':({fries:['🥔','🍟','🍅'],pizza:['🥕','🍕','🍕'],pasta:['🍅','🍝','🥫'],rice:['🥕','🍚','🍛'],ice:['🍓','🥣','🍨']}[r.id][index]||r.icon),name:prepared[r.id][index]||r.name};}
  const allItems=p=>[...(p.kitchen.active?.items||[]),...p.kitchen.dishes.filter(v=>v.at!=='meal')];
  const held=p=>allItems(p).find(v=>v.at==='hands');
  function migrate(p){
    const old=p.kitchen&&typeof p.kitchen==='object'?p.kitchen:{},stock={};for(const id of Object.keys(ingredients))stock[id]=count(old.stock?.[id]);
    const r=recipes.find(r=>r.id===old.active?.id);let active=null,hand=false;
    const validAt=(at,fallback,id)=>{if(at==='hands'){if(hand)return fallback;hand=true;}return ['hands','pantry','meal',...Object.keys(stations)].includes(at)&&!(at==='pantry'&&id.startsWith('step'))?at:fallback;};
    if(r){const src=old.active,done=[];const candidates=Array.isArray(src.done)?src.done:Array.from({length:Math.min(count(src.step),r.steps.length-1)},(_,i)=>i);
      for(let i=0;i<r.steps.length-1;i++)if(candidates.includes(i)&&flows[r.id][i].every(id=>!id.startsWith('step')||done.includes(+id.slice(4))))done.push(i);
      active={id:r.id,done,step:0,taps:0,work:{},jobs:{},items:[],plateId:['dish0','dish1'].includes(src.plateId)?src.plateId:null};
      active.items=initialItems(r,done).map(item=>{const saved=Array.isArray(src.items)?src.items.find(v=>v?.id===item.id):null;return {...item,at:validAt(saved?.at,item.at,item.id)};});
      for(let i=0;i<r.steps.length;i++)if(!done.includes(i)){const value=src.work?.[i]??(i===src.step?count(src.taps)/r.steps[i][2]*duration(r,i):0);active.work[i]=Math.max(0,Math.min(duration(r,i)-.01,Number.isFinite(value)?value:0));const job=src.jobs?.[i];if(heat.has(r.steps[i][0])&&Number.isFinite(job)&&flows[r.id][i].every(id=>active.items.some(v=>v.id===id&&v.at===r.steps[i][0])))active.jobs[i]=Math.max(.01,Math.min(duration(r,i),job));}
      if(!Array.isArray(src.items)&&src.taps)active.items.forEach(v=>{if(flows[r.id][src.step]?.includes(v.id))v.at=r.steps[src.step][0];});
      active.step=r.steps.findIndex((_,i)=>!done.includes(i));active.taps=active.work[active.step]||0;
    }
    const dishes=[0,1].map(i=>{const src=old.dishes?.find(v=>v?.id==='dish'+i);return {id:'dish'+i,dirty:!!src?.dirty,at:validAt(src?.at,'rack','dish'+i)};});
    if(active){const r=recipes.find(v=>v.id===active.id),plated=active.done.includes(r.steps.length-2);if(plated){active.plateId=active.plateId||'dish0';const dish=dishes.find(v=>v.id===active.plateId);dish.at='meal';dish.dirty=false;}else{active.plateId=null;dishes.forEach(v=>{if(v.at==='meal')v.at='rack';});}}else dishes.forEach(v=>{if(v.at==='meal')v.at='rack';});
    p.kitchen={stock,active,dishes,wash:Math.max(0,Math.min(2.9,Number(old.wash)||0)),pos:walkable(old.pos?.x,old.pos?.y)?{x:old.pos.x,y:old.pos.y}:{x:280,y:390},served:count(old.served),last:recipes.some(r=>r.id===old.last)?old.last:null};return p.kitchen;
  }
  const missing=(p,r)=>Object.entries(r.needs).filter(([id,n])=>p.kitchen.stock[id]<n).map(([id,n])=>({id,n:n-p.kitchen.stock[id]}));
  const cost=cart=>Object.entries(cart).reduce((sum,[id,n])=>sum+(ingredients[id]?.[2]||0)*n,0);
  function buy(p,cart){const entries=Object.entries(cart);if(!entries.length||entries.some(([id,n])=>!ingredients[id]||!Number.isSafeInteger(n)||n<1||n>99||p.kitchen.stock[id]+n>9999))return false;for(const [id,n] of entries)p.kitchen.stock[id]+=n;return true;}
  function start(p,id){const r=recipes.find(r=>r.id===id);if(!r||p.kitchen.active||missing(p,r).length)return false;for(const [key,n] of Object.entries(r.needs))p.kitchen.stock[key]-=n;p.kitchen.active={id,step:0,taps:0,done:[],work:{},jobs:{},items:initialItems(r),plateId:null};return true;}
  function locked(p,item){const a=p.kitchen.active;return a&&Object.keys(a.jobs).some(i=>flows[a.id][i].includes(item.id));}
  function pickup(p,station,id){if(held(p)||!near(p,station))return false;const item=allItems(p).find(v=>v.id===id&&v.at===station);if(!item||locked(p,item))return false;item.at='hands';return 'picked';}
  function putdown(p,station){const item=held(p);if(!item||!near(p,station)||station==='pantry'&&!ingredients[item.id]||['rack','sink'].includes(station)&&!item.id.startsWith('dish'))return false;item.at=station;return 'dropped';}
  function taskAt(p,station){const a=p.kitchen.active;if(!a)return -1;const r=recipes.find(r=>r.id===a.id);return r.steps.findIndex((s,i)=>s[0]===station&&!a.done.includes(i)&&!a.jobs[i]&&flows[r.id][i].every(id=>a.items.some(v=>v.id===id&&v.at===station))&&(s[0]!=='plate'||p.kitchen.dishes.some(v=>!v.dirty&&v.at==='plate')));}
  const ready=(p,station)=>station==='sink'?p.kitchen.dishes.some(v=>v.dirty&&v.at==='sink'):taskAt(p,station)>=0;
  function finish(p,i){const a=p.kitchen.active,r=recipes.find(r=>r.id===a.id),station=r.steps[i][0];a.items=a.items.filter(v=>!flows[r.id][i].includes(v.id));a.items.push({id:'step'+i,at:station});a.done.push(i);delete a.jobs[i];delete a.work[i];
    if(station==='plate'){const dish=p.kitchen.dishes.find(v=>!v.dirty&&v.at==='plate');dish.at='meal';a.plateId=dish.id;}
    if(station==='serve'){const dish=p.kitchen.dishes.find(v=>v.id===a.plateId);dish.at='serve';dish.dirty=true;p.kitchen.served++;p.kitchen.last=r.id;p.kitchen.active=null;return 'served';}
    a.step=r.steps.findIndex((_,index)=>!a.done.includes(index));a.taps=a.work[a.step]||0;return 'prepared';
  }
  function work(p,station,dt){if(!near(p,station)||held(p)||!Number.isFinite(dt)||dt<=0)return false;dt=Math.min(dt,.5);
    if(station==='sink'){if(!ready(p,station))return false;p.kitchen.wash+=dt;if(p.kitchen.wash>=3){const dish=p.kitchen.dishes.find(v=>v.dirty&&v.at==='sink');dish.dirty=false;p.kitchen.wash=0;return 'washed';}return 'working';}
    const i=taskAt(p,station);if(i<0)return false;const a=p.kitchen.active,r=recipes.find(r=>r.id===a.id);if(heat.has(station)){a.jobs[i]=duration(r,i);return 'cooking';}
    a.work[i]=(a.work[i]||0)+dt;a.taps=a.work[a.step]||0;return a.work[i]+.00001>=duration(r,i)?finish(p,i):'working';
  }
  const act=(p,station)=>work(p,station,.5);
  function advance(p,dt){const a=p.kitchen.active;if(!a||!Number.isFinite(dt)||dt<=0||!Object.keys(a.jobs).length)return false;let result='ticking';for(const key of Object.keys(a.jobs)){a.jobs[key]-=Math.min(dt,.5);if(a.jobs[key]<=0){finish(p,+key);result='prepared';}}return result;}
  return {ingredients,stations,recipes,flows,positions,layout,heat,duration,walkable,segment,route,near,itemInfo,allItems,held,pickup,putdown,ready,taskAt,work,advance,migrate,missing,cost,buy,start,act};
})();
if(typeof module!=='undefined')module.exports=KitchenRules;

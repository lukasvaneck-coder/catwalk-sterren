/* Validated modular hair data, shared by the salon and both avatar renderers. */
const HairParts=(()=>{
 const SIDES=[['none','Geen'],['short','Kort'],['long','Lang'],['wavy','Golvend'],['braid','Vlecht'],['tail','Staartje'],['bun','Knotje']];
 const sections=[{id:'front',name:'Voorkant',options:[['open','Vrij voorhoofd'],['fringe','Rechte pony'],['swept','Schuine lok'],['curls','Krullenpony']]},{id:'left',name:'Linkerkant',options:SIDES},{id:'right',name:'Rechterkant',options:SIDES},{id:'top',name:'Bovenkant',options:[['smooth','Glad'],['bun','Hoge knot'],['buns','Twee knotjes'],['puffs','Afro puffs'],['curls','Krullen']]},{id:'back',name:'Achterkant',options:[['short','Kort'],['long','Lang'],['wavy','Golvend'],['tail','Paardenstaart'],['braid','Vlecht'],['bun','Lage knot']]}];
 const defaults={front:'open',left:'long',right:'long',top:'smooth',back:'long'};
 function normalize(raw={}){return Object.fromEntries(sections.map(s=>[s.id,s.options.some(([id])=>id===raw?.[s.id])?raw[s.id]:defaults[s.id]]));}
 function paint(ctx,look,layer){
  const p=normalize(look.hairParts),color=(HAIR_COLORS.find(c=>c.id===look.hairColor)||HAIR_COLORS[2]).c;
  const blob=(x,y,rx,ry)=>Avatar.blob(ctx,x,y,rx,ry,color==='rainbow'?'#b18bd3':color);
  if(layer==='back'){
   if(p.back==='long')blob(200,178,68,87);
   if(p.back==='wavy')for(let i=0;i<4;i++)blob(200+Math.sin(i*2)*5,137+i*29,68,38);
   if(p.back==='tail')blob(200,207,30,72);
   if(p.back==='braid')for(let i=0;i<6;i++)blob(200+Math.sin(i*2)*3,159+i*20,15-i*.8,16);
   if(p.back==='bun')blob(200,142,35,32);
  }
  if(layer==='cap'){
   const edge=look.hairline==='high'?55:look.hairline==='peak'?81:68;
   ctx.save();ctx.beginPath();ctx.moveTo(125,126);ctx.bezierCurveTo(108,6,290,6,275,126);ctx.bezierCurveTo(256,98,245,58,200,edge);ctx.bezierCurveTo(155,58,145,98,125,126);ctx.closePath();ctx.clip();blob(200,70,82,68);ctx.restore();
   if(p.front==='fringe')for(let i=0;i<5;i++)blob(151+i*24,85,18,20);
   if(p.front==='swept')blob(175,76,48,20);
   if(p.front==='curls')for(let i=0;i<6;i++)blob(144+i*22,82+(i%2)*5,15,15);
   if(p.top==='bun')blob(200,20,26,24);
   if(['buns','puffs'].includes(p.top))for(const x of [135,265])blob(x,39,p.top==='puffs'?32:23,p.top==='puffs'?31:23);
   if(p.top==='curls')for(let i=0;i<9;i++)blob(132+i*17,39-Math.sin(i/8*Math.PI)*15,20,20);
  }
  if(layer==='sides')for(const [key,side] of [['left',-1],['right',1]]){const x=200+side*70,id=p[key];if(id==='short')blob(x,135,15,31);if(id==='long')blob(x,177,17,70);if(id==='wavy')for(let i=0;i<4;i++)blob(x+Math.sin(i*2)*5,130+i*28,18,24);if(id==='braid')for(let i=0;i<6;i++)blob(x+Math.sin(i*2)*4,128+i*19,12-i*.8,13);if(id==='tail')blob(x+side*17,143,23,53);if(id==='bun')blob(x+side*8,104,23,24);}
 }
 function collection(look={}){
  const seen=new Set(),items=[];
  for(const raw of Array.isArray(look.hairCollection)?look.hairCollection:[]){
   if(!raw||typeof raw.id!=='string'||seen.has(raw.id))continue;
   seen.add(raw.id);items.push({id:raw.id,name:String(raw.name||'Mijn kapsel').trim().slice(0,32)||'Mijn kapsel',parts:normalize(raw.parts)});
  }
  if(!Array.isArray(look.hairCollection)&&(look.customHair||look.hairParts))items.push({id:'hair_legacy',name:'Mijn eerste kapsel',parts:normalize(look.customHair||look.hairParts)});
  return items;
 }
 return {sections,defaults,normalize,paint,collection};
})();

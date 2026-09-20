const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),ctx=vm.createContext({localStorage:{setItem(){}}});
for(const file of ['js/data.js','js/color-challenges.js','js/learning-challenges.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
let game=fs.readFileSync(path.join(root,'js/game.js'),'utf8');game=game.slice(0,game.indexOf('  /* ---------- start ---------- */'))+'globalThis.api={evaluate,newProfile,pickTheme,currentTheme,migrate,selectLearningTheme,activeBudget,set:p=>P=p};})();';vm.runInContext(game,ctx);
const {L,items,byId,themes,settings}=vm.runInContext('({L:LearningChallenges,items:ITEMS,byId:ITEM_BY_ID,themes:THEMES,settings:SETTING_BY_ID})',ctx);
const p=ctx.api.newProfile('Test',{skin:'s2',eyes:'e1',hairColor:'bruin'},'hair_lang');ctx.api.set(p);
const weather=themes.filter(t=>t.learning==='weather'), budget=themes.filter(t=>t.learning==='budget');assert.equal(weather.length,5);assert.equal(budget.length,5);
const find=(cat,shapes,lvl=20)=>items.find(i=>i.cat===cat&&shapes.includes(i.shape)&&i.lvl<=lvl)?.id;
for(const t of weather){
  assert(settings[t.bg]);
  const outfit={top:find('top',['sweater'],t.lvl),bottom:find('bottom',['pants'],t.lvl),shoes:find('shoes',['sneaker'],t.lvl)};
  if(t.weather==='sun'){outfit.top=find('top',['tshirt'],t.lvl);outfit.hat=find('hat',['cap','sunhat'],t.lvl);}
  if(t.weather==='snow'){outfit.shoes=find('shoes',['snowboot','boot'],t.lvl);outfit.hat=find('hat',['beanie'],t.lvl);}
  if(t.weather==='rain'){outfit.top=find('top',['raincoat'],t.lvl);outfit.shoes=find('shoes',['rainboot'],t.lvl);}
  assert.equal(L.assess(outfit,t,byId).stars,3,t.id+' moet haalbaar zijn met kleding van dat level');
  assert(L.assess({...outfit,shoes:null},t,byId).stars<3);
  assert.equal(ctx.api.evaluate(outfit,t).stars,3);
}
const wind=weather.find(t=>t.weather==='wind');
const windy={top:find('top',['sweater']),bottom:find('bottom',['pants']),shoes:find('shoes',['sneaker']),hand:find('hand',['umbrella'])};assert(L.assess(windy,wind,byId).stars<3);
for(const t of budget){
  assert(settings[t.bg]);const run=L.startBudget(t);
  const own=items.filter(i=>i.lvl===1), garment=own.find(i=>i.cat==='top'&&i.tags.some(tag=>t.wants.includes(tag)));
  const outfit={top:garment.id,bottom:find('bottom',['pants'],1),shoes:find('shoes',['sneaker'],1)};
  assert.equal(L.assess(outfit,t,byId,run).stars,3,'Hergebruik zonder aankopen mag');
  assert.equal(L.purchaseError(t,run,t.budget),'');assert(L.purchaseError(t,run,t.budget+1));
  run.spent=10;run.purchases.push({id:'test',price:10});assert(L.purchaseError(t,run,t.budget-9));
  run.spent=0;run.purchases=Array.from({length:t.maxBuys},()=>({id:'test',price:0}));assert(L.purchaseError(t,run,1));
}
p.level=20;p.xp=5000;ctx.api.selectLearningTheme(budget[0]);p.budgetRun.spent=13;p.budgetRun.purchases=[{id:'top_tshirt_rood',price:13}];
const restored=JSON.parse(JSON.stringify(p));ctx.api.migrate(restored);assert.equal(restored.budgetRun.spent,13);assert.equal(restored.budgetRun.purchases.length,1);
assert.equal(ctx.api.currentTheme().id,budget[0].id);assert.equal(p.budgetRun.spent,13);
const next=ctx.api.pickTheme(budget[0].id);assert.equal(next.learning,'budget');assert.notEqual(next.id,budget[0].id);assert.equal(p.budgetRun.spent,0);
p.learningMode=null;p.colorMode=null;for(let i=0;i<30;i++)assert(!ctx.api.pickTheme().learning);
console.log('Leeropdrachten OK: 5 weer + 5 budget; alle weerscenario’s haalbaar op hun level; onvolledige en ongeschikte outfits; budgetgrens/aankooplimiet; gratis hergebruik; kassabon na herladen; volgende opdracht; gewone modeshows.');

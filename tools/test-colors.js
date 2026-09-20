const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.join(__dirname,'..'),ctx=vm.createContext({localStorage:{setItem(){}}});
for(const file of ['js/data.js','js/color-challenges.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
let game=fs.readFileSync(path.join(root,'js/game.js'),'utf8');
game=game.slice(0,game.indexOf('  /* ---------- start ---------- */'))+'globalThis.api={evaluate,newProfile,pickTheme,currentTheme,set:p=>P=p};})();';vm.runInContext(game,ctx);
const {C,catalog,items,themes}=vm.runInContext('({C:ColorChallenges,catalog:ITEM_BY_ID,items:ITEMS,themes:THEMES})',ctx);
const mono={...themes.find(t=>t.rule==='mono'),colors:['rood']};
const redTop=items.find(i=>i.cat==='top'&&i.hue==='rood'), blueTop=items.find(i=>i.cat==='top'&&i.hue==='blauw');
const neutralBottom=items.find(i=>i.cat==='bottom'&&i.hue==='zwart'),neutralShoes=items.find(i=>i.cat==='shoes'&&i.hue==='wit');
const good={top:redTop.id,bottom:neutralBottom.id,shoes:neutralShoes.id};
assert.equal(ctx.api.evaluate(good,mono).stars,3);
assert.equal(ctx.api.evaluate({...good,top:blueTop.id},mono).stars,1);
assert(ctx.api.evaluate({...good,shoes:null},mono).stars<3);
const whiteTop=items.find(i=>i.cat==='top'&&i.hue==='wit'), redAccessory=items.find(i=>i.cat==='hat'&&i.hue==='rood');
assert(ctx.api.evaluate({...good,top:whiteTop.id,hat:redAccessory.id},mono).stars<3);
const rainbow=items.find(i=>i.cat==='top'&&i.hue==='multi');assert(ctx.api.evaluate({...good,top:rainbow.id},mono).stars<3);
const pair={...mono,rule:'tegenover',colors:['rood','groen']};
assert(ctx.api.evaluate(good,pair).stars<3);
const greenBottom=items.find(i=>i.cat==='bottom'&&i.hue==='groen');assert.equal(ctx.api.evaluate({...good,bottom:greenBottom.id},pair).stars,3);
assert(C.assess({...good,top:blueTop.id},mono,catalog).feedback.some(t=>t.includes(blueTop.name)));
const starter=ctx.api.newProfile('Test',{skin:'s2',eyes:'e1',hairColor:'bruin'},'hair_lang');ctx.api.set(starter);
for(const rule of ['mono','buren','tegenover']){
  const palettes=C.palettes(rule,starter.owned,catalog);assert(palettes.length>0);
  starter.colorMode=rule;for(let i=0;i<12;i++){const theme=ctx.api.pickTheme();assert.equal(theme.rule,rule);assert(palettes.some(p=>JSON.stringify(p)===JSON.stringify(theme.colors)));assert.equal(ctx.api.currentTheme().rule,rule);assert(C.lesson(theme).length>50);}
}
// Twee kleuren die uitsluitend dezelfde topslot gebruiken zijn samen niet haalbaar.
const limited=[redTop.id,items.find(i=>i.cat==='top'&&i.hue==='groen').id,neutralBottom.id,neutralShoes.id];
assert(!C.palettes('tegenover',limited,catalog).some(p=>p.includes('rood')&&p.includes('groen')));
assert.equal(C.palettes('mono',[],catalog).length,0);
console.log('Kleurtests OK: juiste/verkeerde kleur, neutraal, regenboog, complete outfit, accessoiretruc, twee doelkleuren, gerichte feedback, haalbare starteropdrachten en behoud van kleurmodus.');

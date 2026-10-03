const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const ctx=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/town-rules.js'),'utf8'),ctx);
const R=vm.runInContext('TownRules',ctx);
assert.equal(R.HOUSES.length,13);assert.equal(new Set(R.HOUSES.map(h=>h.id)).size,13);
assert(R.walkable(R.START.x,R.START.y));
const targets=[...R.HOUSES,...R.NPCS,...R.NODES];
for(const to of targets){
  assert(R.walkable(to.x,to.y),`${to.id} has a blocked entrance`);
  const route=R.route(R.START,to);assert(route.length,`No route to ${to.id}`);assert(R.dist(route.at(-1),to)<40,`Route misses ${to.id}`);
  let prev=R.START;for(const p of route){const n=Math.ceil(R.dist(prev,p)/4);for(let i=0;i<=n;i++)assert(R.walkable(prev.x+(p.x-prev.x)*i/n,prev.y+(p.y-prev.y)*i/n),`Route to ${to.id} crosses obstacle near ${JSON.stringify(p)}`);prev=p;}
}
for(const a of R.HOUSES)for(const b of R.HOUSES)assert(R.route(a,b).length,`${a.id} cannot reach ${b.id}`);
assert(!R.walkable(R.POND.x,R.POND.y-90));assert(R.walkable(R.POND.x,960),'Bridge must be passable');
assert(!R.walkable(-100,500));assert(!R.walkable(NaN,500));assert.equal(R.route({},R.START).length,0);
const p={worldPos:{x:51,y:42},coins:55,outfit:{top:'top_tshirt_blauw'}};R.migrate(p);
assert.deepEqual(p.outfit,{top:'top_tshirt_blauw'});assert.equal(p.coins,55);assert.equal(p.town.pos.x,R.START.x);
assert(p.town.accepted.includes('explorer'));assert.equal(R.collect(p.town,'garden_1'),false);
R.accept(p.town,'garden');for(const n of R.NODES.filter(n=>n.kind==='garden')){assert(R.collect(p.town,n.id));assert(!R.collect(p.town,n.id));}
assert(R.progress(p.town,'garden').ready);assert.equal(R.claim(p.town,'garden'),2);assert.equal(R.claim(p.town,'garden'),false);
R.visit(p.town,'disco');R.accept(p.town,'ribbons');assert.equal(R.progress(p.town,'ribbons').done,0);
for(const id of ['atelier','disco','balzaal'])R.visit(p.town,id);assert(R.progress(p.town,'ribbons').ready);
for(const h of R.HOUSES)R.visit(p.town,h.id);assert.equal(R.progress(p.town,'explorer').done,13);assert.equal(R.claim(p.town,'explorer'),3);
const restored=JSON.parse(JSON.stringify(p));R.migrate(restored);assert.equal(R.claim(restored.town,'garden'),false);assert(restored.town.visited.includes('balzaal'));
const b={};R.migrate(b);assert.equal(b.town.visited.length,0);assert.equal(b.town.collected.length,0);
const dance=R.rhythm(1);dance.time=0;assert(!R.rhythmPress(dance,dance.notes[0]));
for(let i=0;i<12;i++){dance.time=dance.lead+i*dance.beat;assert(R.rhythmPress(dance,dance.notes[i]));assert(!R.rhythmPress(dance,dance.notes[i]));}
assert.equal(dance.hits,12);assert.equal(R.danceStars(dance.hits),3);assert.equal(R.danceStars(0),0);
const wrong=R.rhythm();wrong.time=wrong.lead;assert(!R.rhythmPress(wrong,(wrong.notes[0]+1)%4));assert(!R.rhythmPress(wrong,wrong.notes[0]),'Multiple keys must not score the same beat');
const memory=R.memory(2);assert.equal(R.memoryPress(memory,0),'wait');memory.phase='input';assert.equal(R.memoryPress(memory,(memory.sequence[0]+1)%4),'retry');assert.equal(memory.errors,1);
for(let round=0;round<4;round++){memory.phase='input';for(let i=0;i<round+3;i++)R.memoryPress(memory,memory.sequence[i]);}
assert(memory.finished);assert.equal(memory.round,4);assert.equal(R.memoryPress(memory,0),'wait');
console.log('Dorp OK: 13 deuren + 11 buitenplekken bereikbaar, alle onderlinge routes, botsingen/brug, veilige migratie, vier opdrachten, eenmalige beloningen, ritme- en dansgeheugenregels.');

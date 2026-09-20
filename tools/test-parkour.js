const fs=require('node:fs'), vm=require('node:vm'), assert=require('node:assert/strict');
const path=require('node:path'), root=path.join(__dirname,'..');
const ctx=vm.createContext({});
for(const file of ['js/data.js','js/parkour-rules.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
const {R,items}=vm.runInContext('({R:ParkourRules,items:ITEM_BY_ID})',ctx);
const outfit={top:'top_tshirt_blauw',bottom:'bot_jeans',shoes:'sh_sneakers'};
assert(items[outfit.top]&&items[outfit.bottom]&&items[outfit.shoes]);
const make=id=>{const s=R.create(id,outfit,outfit,items);s.countdown=0;return s;};
const advance=(s,t,input={})=>{for(let i=0;i<Math.round(t*120);i++)R.step(s,1/120,input);};
const sneakers=R.outfitScore(outfit,'school',items), heels=R.outfitScore({...outfit,shoes:'sh_pumps_black'},'school',items);
assert(sneakers.speed>heels.speed);
assert(R.outfitScore({...outfit,top:undefined},'school',items).speed<sneakers.speed);
assert(R.outfitScore({...outfit,bottom:undefined},'school',items).speed<sneakers.speed);
const heavy=Object.values(items).find(i=>i.shape==='cape');
assert(R.outfitScore({...outfit,back:heavy.id},'school',items).speed<sneakers.speed);
const dress=Object.values(items).find(i=>i.cat==='dress');
const ds=R.outfitScore({...outfit,dress:dress.id},'gym',items);assert.equal(ds.scores.top,ds.scores.bottom);
for(const course of R.courses){assert.equal(R.starsFor(course.times[0],course),3);assert.equal(R.starsFor(course.times[0]+.01,course),2);assert.equal(R.starsFor(course.times[1]+.01,course),1);assert.equal(R.starsFor(course.times[2]+.01,course),0);}
const count=R.create('school',outfit,outfit,items);advance(count,2,{right:true});assert.equal(count.time,0);assert.equal(count.player.x,80);
const car=make('school');car.time=2;const box=R.carAt(car,0);car.player={x:box.x+30,y:box.y+40};R.jump(car);R.step(car,1/120);assert.equal(car.freeze,5);const pos=car.player.x;advance(car,4.9,{right:true});assert.equal(car.player.x,pos);assert.equal(car.hits,1);advance(car,.2,{right:true});assert(car.player.x>pos);
const wet=make('rain');wet.player={x:435,y:300};R.step(wet,1/120);assert.equal(wet.freeze,2);
const hop=make('rain');hop.player={x:435,y:300};assert(R.jump(hop));assert(!R.jump(hop));advance(hop,.1);assert.equal(hop.hits,0);advance(hop,.72);assert.equal(hop.hits,1);
const maze=make('gym');const start=maze.player.x;advance(maze,1,{left:true});assert(maze.player.x>=77);assert(maze.player.x<start);assert(!maze.walls.some(w=>R.touches(maze.player,w)));
// Drive the shortest legal route through the maze, checking wall collision along the way.
const gym=make('gym');for(const target of R.mazePath().slice(1))for(let i=0;i<200&&!gym.finished;i++){
  const dx=target.x-gym.player.x,dy=target.y-gym.player.y;if(Math.hypot(dx,dy)<2)break;
  R.step(gym,1/120,{right:dx>1,left:dx< -1,down:dy>1,up:dy< -1});
}
assert(gym.success,'Doolhof moet binnen de limiet uit te spelen zijn');
const idle=make('dad'), sprint=make('dad');for(let i=0;i<3600&&!sprint.finished;i++){if(i%30===0)R.tap(sprint);R.step(sprint,1/120);R.step(idle,1/120);}assert(sprint.success);assert(sprint.time<18);assert(sprint.player.x>idle.player.x);
const timeout=make('school');advance(timeout,43);assert(timeout.finished&&!timeout.success);
const tag=make('tag');tag.player={...tag.finish};advance(tag,.1);assert(!tag.finished);tag.player={...tag.flags[0]};advance(tag,.01);assert.equal(tag.checkpoint,1);
const finish=make('school');finish.player={...finish.finish};R.step(finish,1/120);assert(finish.success);const finalTime=finish.time;advance(finish,1,{right:true});assert.equal(finish.time,finalTime);
console.log(`Parkourregels OK: kleding, sterren, countdown, 5s auto, 2s plas, sprong/cooldown, muren, doolhof (${gym.time.toFixed(1)}s), sprint (${sprint.time.toFixed(1)}s), vlaggen, timeout, eenmalige finish.`);

// Finish alle banen met legale besturing; de slechtste limiet moet haalbaar zijn.
function go(s,target,jumping=false) {
  for(let i=0;i<9000&&!s.finished;i++) {
    const dx=target.x-s.player.x,dy=target.y-s.player.y;
    if(Math.hypot(dx,dy)<4)return;
    if(jumping&&s.course.id==='rain'&&s.obstacles.some(o=>o.x-s.player.x<55&&o.x+o.w>s.player.x&&Math.abs(o.y+o.h/2-s.player.y)<100))R.jump(s);
    R.step(s,1/120,{right:dx>2,left:dx< -2,down:dy>2,up:dy< -2});
  }
}
const rain=make('rain');go(rain,rain.finish,true);assert(rain.success,`Regenbaan haalbaar: ${rain.time}`);
const school=make('school');go(school,school.finish);assert(school.success,'Schoolbaan haalbaar inclusief eventuele botsingen');
const grass=make('tag');for(const target of [...grass.flags,grass.finish])go(grass,target);assert(grass.success,'Alle vlaggen en de finish haalbaar');
const dadSlow=R.create('dad',outfit,{...outfit,shoes:'sh_pumps_black'},items);assert(dadSlow.npcs[0].speed<make('dad').npcs[0].speed);
const straight=make('rain'), diagonal=make('rain');advance(straight,.5,{right:true});advance(diagonal,.5,{right:true,down:true});assert(Math.abs(Math.hypot(diagonal.player.x-80,diagonal.player.y-300)-(straight.player.x-80))<.01);
console.log(`Banen haalbaar: school ${school.time.toFixed(1)}s, regen ${rain.time.toFixed(1)}s, tikkertje ${grass.time.toFixed(1)}s.`);

// Gebruik de echte profielmigratie en beloningsfunctie zonder de browser te starten.
let saved='';ctx.localStorage={getItem(){return null;},setItem(key,value){saved=value;}};
let game=fs.readFileSync(path.join(root,'js/game.js'),'utf8');
game=game.slice(0,game.indexOf('  /* ---------- start ---------- */'))+'globalThis.profileTest={newProfile,award,migrate,setProfiles:ps=>DB.profiles=ps};})();';
vm.runInContext(game,ctx);const api=ctx.profileTest;
const p=api.newProfile('Racer',{skin:'s2',eyes:'e1',hairColor:'bruin',build:40},'hair_lang');api.setProfiles([p]);
const result=api.award(p,{stars:3},{id:'parkour_school'},false);
assert.equal(p.shows,0);assert.equal(p.stars,3);assert.equal(p.xp,50);assert.equal(p.coins,55);assert.equal(result.first,true);
const persisted=JSON.parse(saved).profiles[0];assert.equal(persisted.done.parkour_school,3);assert.equal(persisted.shows,0);
const again=api.award(p,{stars:1},{id:'parkour_school'},false);assert.equal(again.first,false);assert.equal(again.xp,15);assert.equal(p.done.parkour_school,3);
api.award(p,{stars:1},{id:'original_fashion_theme'});assert.equal(p.shows,1);
p.parkour={records:{school:{best:19.5,stars:3}},dadOutfit:{...outfit}};api.migrate(p);assert.equal(p.parkour.records.school.best,19.5);
console.log('Opslag en beloningen OK: eerste-racebonus, herhalingen, hoogste sterrenscore, modeshowteller en bestaande profielen.');

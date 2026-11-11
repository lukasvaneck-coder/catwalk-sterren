const assert=require('node:assert/strict'),R=require('../js/kitchen-rules.js');
for(const recipe of R.recipes){
 const p={};R.migrate(p);Object.assign(p.kitchen.stock,recipe.needs);R.start(p,recipe.id);
 // Exercise washing a dirty plate when no clean plate is available.
 if(recipe.id==='pizza')p.kitchen.dishes.forEach(d=>{d.dirty=true;d.at='serve'});
 let actions=0,waits=0;
 while(actions++<180){
  const hint=R.guide(p);assert(hint,recipe.id+' lost guidance');
  if(!hint.station){if(Object.keys(p.kitchen.active?.jobs||{}).length){assert(hint.max>0);R.migrate(p);assert(R.guide(p).max>0);for(let i=0;i<12;i++)R.advance(p,.5);waits++;R.migrate(p);continue;}assert(!p.kitchen.active,'Blocked during '+recipe.id);break;}
  p.kitchen.pos={...R.positions[hint.station]};
  if(hint.item)assert(R.pickup(p,hint.station,hint.item));
  else if(R.held(p))assert(R.putdown(p,hint.station));
  else assert(R.ready(p,hint.station),'Unusable guide '+JSON.stringify(hint));
  if(!R.held(p)&&R.ready(p,hint.station))for(let n=0;n<8;n++){const result=R.work(p,hint.station,.5);if(result!=='working')break;}
 }
 assert(actions<180,'Loop '+recipe.id);assert.equal(p.kitchen.served,1);assert(p.kitchen.dishes.every(d=>!d.dirty));assert(waits>0);
 console.log(recipe.id+': complete meal, heat waiting, serving and washing via guidance');
}

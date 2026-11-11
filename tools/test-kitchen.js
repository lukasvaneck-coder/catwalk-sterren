const assert=require('node:assert/strict'),R=require('../js/kitchen-rules');
const go=(p,s)=>{p.kitchen.pos={...R.positions[s]};};
const carry=(p,id,to)=>{const item=R.allItems(p).find(v=>v.id===id);go(p,item.at);assert(R.pickup(p,item.at,id));go(p,to);assert(R.putdown(p,to));};
const finishWork=(p,s)=>{go(p,s);for(let n=0;n<20&&R.ready(p,s);n++)assert(R.work(p,s,.5));};
for(const r of R.recipes){
  let p={coins:100};R.migrate(p);assert(!R.start(p,r.id));assert(R.buy(p,r.needs));assert.equal(p.coins,100-R.cost(r.needs));assert(R.start(p,r.id));assert(!R.start(p,r.id));
  assert(!R.pickup(p,'pantry',Object.keys(r.needs)[0]),'Cannot pick up at a distance');
  for(let i=0;i<r.steps.length;i++){
    const station=r.steps[i][0];go(p,station);assert(!R.ready(p,station),'Ingredients must be delivered');
    for(const id of R.flows[r.id][i]){const item=R.allItems(p).find(v=>v.id===id);go(p,item.at);assert(R.pickup(p,item.at,id));assert(!R.act(p,station));p=JSON.parse(JSON.stringify(p));R.migrate(p);assert.equal(R.held(p).id,id);go(p,station);assert(R.putdown(p,station));}
    if(station==='plate'){assert(!R.ready(p,station),'Plating needs a clean plate');carry(p,'dish0','plate');}
    finishWork(p,station);
    if(R.heat.has(station)){assert(p.kitchen.active.jobs[i]);assert(!R.pickup(p,station,R.flows[r.id][i][0]),'Cooking ingredients cannot be removed');for(let n=0;n<12;n++)R.advance(p,.5);}
    p=JSON.parse(JSON.stringify(p));R.migrate(p);
  }
  assert.equal(p.kitchen.served,1);assert.equal(p.kitchen.active,null);assert(!R.act(p,'serve'));assert(p.kitchen.dishes[0].dirty);assert.equal(p.kitchen.dishes[0].at,'serve');
  carry(p,'dish0','sink');finishWork(p,'sink');assert(!p.kitchen.dishes[0].dirty);carry(p,'dish0','rack');assert.equal(p.kitchen.dishes.filter(v=>!v.dirty).length,2);
}
const p={coins:100};R.migrate(p);R.buy(p,R.recipes[0].needs);R.start(p,'fries');carry(p,'potato','cut');finishWork(p,'cut');carry(p,'step0','fry');finishWork(p,'fry');assert(p.kitchen.active.jobs[1]);carry(p,'tomato','cut');finishWork(p,'cut');assert(p.kitchen.active.done.includes(2),'Independent tomato prep while fries cook');assert(!p.kitchen.active.done.includes(1));
let saved=JSON.parse(JSON.stringify(p));R.migrate(saved);assert.equal(saved.kitchen.active.jobs[1],p.kitchen.active.jobs[1]);assert(saved.kitchen.active.done.includes(2));for(let i=0;i<12;i++)R.advance(saved,.5);assert(saved.kitchen.active.done.includes(1));
const old={kitchen:{active:{id:'fries',step:2,taps:1}}};R.migrate(old);assert(old.kitchen.active.done.includes(1));assert(old.kitchen.active.items.some(v=>v.id==='step1'));assert.equal(old.kitchen.active.items.find(v=>v.id==='tomato').at,'cut');
for(const a of Object.values(R.positions))for(const b of Object.values(R.positions)){assert(R.walkable(a.x,a.y));const path=R.route(a,b);assert(path.length);let prev=a;for(const to of path){assert(R.segment(prev,to));prev=to;}}
assert(!R.walkable(500,380),'Island is solid');assert(!R.walkable(20,20));
const poor={coins:0};R.migrate(poor);assert(!R.buy(poor,{potato:1}));poor.coins=100;for(const cart of [{},{potato:-1},{potato:1.5},{fake:1},{potato:100}])assert(!R.buy(poor,cart));
console.log('Kitchen OK: all five recipes, carry, automatic cooking, parallel preparation, clean plates, washing/reuse, saved timers/items, old-save migration, all station routes around solid island, purchases.');

async page=>{
 const ctx=await page.context().browser().newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));const check=(v,m)=>{if(!v)throw Error(m)};
 try{await p.goto('http://127.0.0.1:4175');await p.waitForTimeout(400);await p.locator('#profiles .new').tap();await p.locator('#name-input').fill('Zelf koken');await p.locator('#create-done').tap();await p.evaluate(()=>{World.hide();const db=JSON.parse(localStorage.getItem('catwalk-sterren-v1')),p=db.profiles[0],h=TownRules.HOUSES.find(h=>h.id==='keuken');p.town.pos={x:h.x,y:h.y};KitchenRules.migrate(p);Object.assign(p.kitchen.stock,KitchenRules.recipes.find(r=>r.id==='rice').needs);KitchenRules.start(p,'rice');localStorage.setItem('catwalk-sterren-v1',JSON.stringify(db));});await p.reload();await p.locator('#profiles .profile').first().tap();await p.locator('[data-house=keuken]').tap();
 const seen=new Set();let taps=0;
 for(let n=0;n<360;n++){
  const state=await p.evaluate(()=>JSON.parse(localStorage.getItem('catwalk-sterren-v1')).profiles[0].kitchen);if(state.served&&state.dishes.every(d=>!d.dirty))break;
  const button=p.locator('#kr-cut-next'),text=await button.textContent();for(const word of ['koken','bakken','opdienen','tafel','afwassen'])if(text.includes(word)&&!seen.has(word)){seen.add(word);await p.screenshot({path:`test-results/guide-${word}.png`});}
  if(await button.isEnabled()){await button.tap();taps++;}await p.waitForTimeout(250);
 }
 const final=await p.evaluate(()=>JSON.parse(localStorage.getItem('catwalk-sterren-v1')).profiles[0].kitchen);check(final.served===1&&!final.active,'Meal not served');check(final.dishes.every(d=>!d.dirty),'Washing incomplete');check(['koken','bakken','opdienen','tafel','afwassen'].every(w=>seen.has(w)),'Missing guidance '+[...seen]);await p.screenshot({path:'test-results/guide-finished.png'});check(!errors.length,errors.join(';'));return {ok:true,meal:'rice',taps,stages:[...seen],washed:true,errors};
 }catch(e){await p.screenshot({path:'test-results/guide-error.png'});throw e;}finally{await ctx.close();}
}

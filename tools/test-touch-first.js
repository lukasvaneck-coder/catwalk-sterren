// Touch-only smoke test: phone portraits, landscape, gameplay and visible copy.
async page=>{
  const ctx=await page.context().browser().newContext({viewport:{width:375,height:667},isMobile:true,hasTouch:true}),p=await ctx.newPage(),errors=[],checks=[];
  p.on('pageerror',e=>errors.push(e.message));const assert=(v,m)=>{if(!v)throw Error(m);};
  const at=async id=>{await p.evaluate(id=>{World.hide();const db=JSON.parse(localStorage.getItem('catwalk-sterren-v1')),h=TownRules.HOUSES.find(v=>v.id===id);db.profiles[0].town.pos={x:h.x,y:h.y};localStorage.setItem('catwalk-sterren-v1',JSON.stringify(db));},id);await p.reload();await p.locator('#profiles .profile').first().tap();await p.locator(`[data-house="${id}"]`).tap();};
  const noKeys=async()=>assert(!/WASD|spatie|pijltjestoets|Escape|\bEnter\b|\bShift\b/i.test(await p.locator('body').innerText()),'Keyboard instructions visible');
  const fits=async selector=>{const b=await p.locator(selector).boundingBox(),v=p.viewportSize();assert(b&&b.x>=-1&&b.y>=-1&&b.x+b.width<=v.width+1&&b.y+b.height<=v.height+1,`${selector} outside ${v.width} × ${v.height}: ${JSON.stringify(b)}`);};
  try{
    await p.goto(page.url());await p.locator('#profiles .new').tap();await p.locator('#name-input').fill('Aanraaktest');await p.locator('#create-done').tap();await noKeys();assert(!await p.locator('.world-controls').isVisible(),'World arrows still visible');
    await p.locator('#village-overview').tap();await p.locator('#town-dialog-close').tap();checks.push('Town map and touch-first guidance');
    await at('keuken');await p.locator('#kitchen .mobile-drawer-toggle').tap();await p.locator('#food-list').tap();await p.locator('.market-actions summary').click();await p.locator('[data-shelf=produce]').click();await p.locator('.market-dialog').waitFor({timeout:15000});await p.locator('[data-add="potato"]').tap();await p.locator('[data-add="potato"]').tap();await p.locator('[data-add="tomato"]').tap();await p.locator('[data-cancel]').tap();await p.locator('#market-cart').tap();await p.locator('#food-pay').waitFor({timeout:15000});await p.locator('#food-pay').tap();await p.locator('[data-cancel]').tap();await p.locator('#food-home').tap();await p.locator('#kitchen .mobile-drawer-toggle').tap();await p.locator('#food-start').tap();
    for(const [width,height] of [[320,568],[375,667],[412,839],[667,375],[844,390]]){
      await p.setViewportSize({width,height});await p.waitForTimeout(100);await noKeys();assert(!await p.locator('.kr-dpad').isVisible(),'Kitchen arrows visible');
      await fits('#kr3d-host');await fits('#kr-pick');await fits('#kr-action');await fits('#kr-dash');
      assert((await p.locator('#kr3d-host').boundingBox()).height>=120,'3D kitchen too short');assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Kitchen horizontal overflow');
      await p.screenshot({path:`test-results/touch/kitchen-${width}.png`});
    }
    await p.setViewportSize({width:375,height:667});await p.locator('#kr3d-host .camera-overview').tap();await p.locator('[data-station="pantry"]').tap();await p.locator('.kr-pick-dialog').waitFor();await fits('.kr-pick-dialog');await p.locator('[data-choose="potato"]').tap();
    await p.waitForFunction(()=>JSON.parse(localStorage.getItem('catwalk-sterren-v1')).profiles[0].kitchen.active.items.some(v=>v.id==='potato'&&v.at==='hands'));
    await p.locator('#kitchen .mobile-drawer-toggle').tap();await p.locator('.kr-recipe-help summary').tap();await noKeys();await fits('#kitchen .mobile-open');await p.locator('#kitchen .mobile-drawer-close').tap();
    // Finish the meal using only taps, including clean-plate collection.
    const profile=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('catwalk-sterren-v1')).profiles[0]);
    const heldAt=async(id,at)=>p.waitForFunction(({id,at})=>{const k=JSON.parse(localStorage.getItem('catwalk-sterren-v1')).profiles[0].kitchen;return [...(k.active?.items||[]),...k.dishes].some(v=>v.id===id&&v.at===at);},{id,at});
    async function pick(item){
      await p.locator(`[data-station="${item.at}"]`).tap();
      await p.waitForFunction(id=>document.querySelector('.kr-pick-dialog[open]')||(()=>{const k=JSON.parse(localStorage.getItem('catwalk-sterren-v1')).profiles[0].kitchen;return [...(k.active?.items||[]),...k.dishes].some(v=>v.id===id&&v.at==='hands');})(),item.id);
      if(await p.locator('.kr-pick-dialog[open]').count())await p.locator(`[data-choose="${item.id}"]`).tap();
      await heldAt(item.id,'hands');
    }
    for(let n=0;n<55;n++){
      const state=await profile(),a=state.kitchen.active;if(!a)break;
      const plan=await p.evaluate(a=>{const R=KitchenRules,r=R.recipes.find(v=>v.id===a.id),i=r.steps.findIndex((s,i)=>!a.done.includes(i)&&!a.jobs[i]&&R.flows[r.id][i].every(id=>a.items.some(v=>v.id===id)));return i<0?null:{i,station:r.steps[i][0],inputs:R.flows[r.id][i]};},a);
      if(!plan){await p.waitForTimeout(300);continue;}
      const all=[...a.items,...state.kitchen.dishes.filter(v=>v.at!=='meal')],held=all.find(v=>v.at==='hands'),missing=plan.inputs.map(id=>a.items.find(v=>v.id===id)).find(v=>v.at!==plan.station);
      if(held){await p.locator(`[data-station="${plan.station}"]`).tap();await heldAt(held.id,plan.station);}
      else if(missing)await pick(missing);
      else if(plan.station==='plate'&&!state.kitchen.dishes.some(v=>!v.dirty&&v.at==='plate'))await pick(state.kitchen.dishes.find(v=>!v.dirty&&v.at!=='meal'));
      else{await p.locator(`[data-station="${plan.station}"]`).tap();await p.waitForFunction(i=>{const a=JSON.parse(localStorage.getItem('catwalk-sterren-v1')).profiles[0].kitchen.active;return !a||a.done.includes(i)||a.jobs[i];},plan.i);}
    }
    assert((await profile()).kitchen.served===1,'Touch-only meal was not completed');
    await p.locator('#food-exit').tap();checks.push('Kitchen controls fit five sizes, big ingredient chooser, touch help');
    await at('race');await p.locator('#fashion-room .mobile-drawer-toggle').tap();await p.locator('[data-fashion-station=race_school]').tap();await p.locator('#pk-start').waitFor();await noKeys();await p.locator('[data-course="rain"]').tap();await p.locator('#pk-start').tap();await p.locator('#pk-pause').tap();
    for(const [width,height] of [[320,568],[667,375],[844,390]]){await p.setViewportSize({width,height});await noKeys();await fits('#pk-stick');await fits('#pk-jump');await fits('#pk-canvas');await p.screenshot({path:`test-results/touch/race-${width}.png`});}
    await p.locator('#pk-back').tap();await p.locator('#pk-exit').tap();checks.push('Race thumbstick and jump visible in portrait and landscape');
    await p.setViewportSize({width:375,height:667});await at('speeltuin');await p.locator('#fashion-room .mobile-drawer-toggle').tap();await p.locator('[data-fashion-station=play_springbaan]').tap();await p.locator('[data-play=springbaan]').waitFor();await noKeys();
    for(const id of ['springbaan','trampoline','klimrek','ballenbak']){
      const start=p.locator(`[data-play="${id}"]`);if(!await start.count())throw Error('Missing playground start '+id);await start.first().tap();await p.locator('#st-pause').tap();await noKeys();
      for(const [width,height] of [[320,568],[667,375]]){await p.setViewportSize({width,height});await fits('#st-canvas');await fits('#st-pause');if(await p.locator('#st-jump').isVisible())await fits('#st-jump');}
      await p.locator('#st-back').tap();
    }
    checks.push('All playground instructions and mobile layouts');assert(!errors.length,errors.join('\n'));return {checks,errors};
  }catch(e){await p.screenshot({path:'test-results/touch/failure.png',fullPage:true});throw e;}finally{await ctx.close();}
}

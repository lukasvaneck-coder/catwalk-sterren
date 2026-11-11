async page => {
  const context=await page.context().browser().newContext({viewport:{width:1280,height:900}});
  const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  const assert=(ok,msg)=>{if(!ok)throw Error(msg);};
  const state=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('catwalk-sterren-v1')).profiles[0]);
  const enter=async id=>{
    await p.evaluate(id=>{World.hide();const db=JSON.parse(localStorage.getItem('catwalk-sterren-v1'));const h=TownRules.HOUSES.find(h=>h.id===id);db.profiles[0].town.pos={x:h.x,y:h.y};localStorage.setItem('catwalk-sterren-v1',JSON.stringify(db));},id);
    await p.reload();await p.locator('#profiles .profile').first().click();await p.locator(`[data-house="${id}"]`).click();await p.locator('#food-exit').waitFor();
  };
  try{
    await p.goto(page.url());await p.locator('#profiles .new').click();await p.locator('#name-input').fill('Keukentest');await p.locator('#create-done').click();
    await enter('keuken');assert(await p.locator('#food-start').isDisabled(),'Empty pantry must block cooking');
    await p.locator('#food-list').click();await p.locator('.market-actions summary').click();await p.locator('[data-shelf=produce]').click();await p.locator('.market-dialog').waitFor({timeout:15000});await p.locator('[data-add="potato"]').click();await p.locator('[data-add="potato"]').click();await p.locator('[data-add="tomato"]').click();
    const before=await state();await p.locator('[data-cancel]').click();await p.locator('#market-cart').click();await p.locator('#food-pay').waitFor({timeout:15000});await p.locator('#food-pay').click();await p.locator('[data-cancel]').click();assert((await state()).coins===before.coins,'Free checkout preserves coins');
    await p.screenshot({path:'test-results/kitchen-shop.png'});
    await p.locator('#food-home').click();await p.locator('#food-start').click();
    await p.waitForFunction(()=>Avatar.isReady());
    await p.waitForFunction(()=>Kitchen3D.debug().avatarReady);assert(await p.locator('#kr3d-host canvas').count()===1,'Real WebGL canvas exists');assert(await p.evaluate(()=>Kitchen3D.debug().camera==='OrthographicCamera'),'Fixed orthographic 3D camera');assert(await p.locator('.kr-3d-target').allTextContents().then(v=>v.every(t=>!t.trim())),'Workplace labels removed');await p.screenshot({path:'test-results/kitchen-3d-initial.png'});
    const initial=(await state()).kitchen.pos;
    // Hit the actual 3D ingredient, with the accessibility hit targets disabled.
    const ingredient=await p.locator('[data-pick="potato"]').boundingBox();
    await p.locator('.kr-3d-target').evaluateAll(els=>els.forEach(el=>el.style.pointerEvents='none'));
    await p.mouse.click(ingredient.x+ingredient.width/2,ingredient.y+ingredient.height/2);
    await p.waitForFunction(()=>JSON.parse(localStorage.getItem('catwalk-sterren-v1')).profiles[0].kitchen.active.items.some(v=>v.id==='potato'&&v.at==='hands'));
    await p.locator('.kr-3d-target').evaluateAll(els=>els.forEach(el=>el.style.removeProperty('pointer-events')));
    assert(Math.abs((await state()).kitchen.pos.x-initial.x)>100,'Avatar actually walked to pantry');
    await p.screenshot({path:'test-results/kitchen-carry.png'});
    await p.setViewportSize({width:390,height:844});await p.screenshot({path:'test-results/kitchen-mobile-carry.png',fullPage:true});
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Active kitchen fits mobile');
    await p.setViewportSize({width:1280,height:900});
    await p.reload();await p.locator('#profiles .profile').first().click();await p.locator('[data-house="keuken"]').click();await p.locator('#food-exit').waitFor();
    assert((await state()).kitchen.active.items.some(v=>v.id==='potato'&&v.at==='hands'),'Carried item survives reload');
    const signature=()=>p.evaluate(()=>{const k=JSON.parse(localStorage.getItem('catwalk-sterren-v1')).profiles[0].kitchen;return JSON.stringify({a:k.active,d:k.dishes});});
    const changed=async before=>p.waitForFunction(before=>{const k=JSON.parse(localStorage.getItem('catwalk-sterren-v1')).profiles[0].kitchen;return JSON.stringify({a:k.active,d:k.dishes})!==before;},before);
    let beforeSig=await signature();await p.locator('[data-station="cut"]').click();await changed(beforeSig);
    await p.keyboard.press('e');await p.waitForFunction(()=>JSON.parse(localStorage.getItem('catwalk-sterren-v1')).profiles[0].kitchen.active.done.includes(0));
    await p.screenshot({path:'test-results/kitchen-desktop.png'});
    let sawParallel=false,sawCooking=false;
    for(let guard=0;guard<90;guard++){
      const profile=await state(),a=profile.kitchen.active;if(!a)break;
      const plan=await p.evaluate(a=>{const R=KitchenRules,r=R.recipes.find(r=>r.id===a.id);const i=r.steps.findIndex((s,i)=>!a.done.includes(i)&&!a.jobs[i]&&R.flows[r.id][i].every(id=>a.items.some(v=>v.id===id)));return i<0?null:{station:r.steps[i][0],inputs:R.flows[r.id][i]};},a);
      if(Object.keys(a.jobs).length)sawCooking=true;
      if(a.done.includes(2)&&!a.done.includes(1))sawParallel=true;
      if(!plan){await p.waitForTimeout(300);continue;}
      const all=[...a.items,...profile.kitchen.dishes.filter(v=>v.at!=='meal')],held=all.find(v=>v.at==='hands');
      const missing=plan.inputs.map(id=>all.find(v=>v.id===id)).find(v=>v.at!==plan.station);
      const before=await signature();
      if(held)await p.locator(`[data-station="${plan.station}"]`).click();
      else if(missing)await p.locator(`[data-pick="${missing.id}"]`).click();
      else if(plan.station==='plate'&&!profile.kitchen.dishes.some(v=>v.at==='plate'&&!v.dirty))await p.locator('[data-pick="dish0"]').click();
      else await p.locator(`[data-station="${plan.station}"]`).click();
      await changed(before);
      // Let manual work finish; cooking runs in the background while we carry on.
      await p.waitForFunction(()=>!document.querySelector('#kr-avatar.working'),null,{timeout:10000});
    }
    assert((await state()).kitchen.served===1,'Meal served once');assert(sawCooking,'Observed automatic cooking');
    const dishes=(await state()).kitchen.dishes;assert(dishes.some(v=>v.dirty&&v.at==='serve'),'Dirty plate returns to table');
    let sig=await signature();await p.locator('[data-pick="dish0"]').click();await changed(sig);
    sig=await signature();await p.locator('[data-station="sink"]').click();await changed(sig);
    await p.locator('[data-station="sink"]').click();await p.waitForFunction(()=>!JSON.parse(localStorage.getItem('catwalk-sterren-v1')).profiles[0].kitchen.dishes[0].dirty);
    // Island route and keyboard collision are exercised through every transport.
    await p.keyboard.down('ArrowUp');await p.waitForTimeout(800);await p.keyboard.up('ArrowUp');await p.waitForTimeout(100);
    assert(await p.evaluate(()=>{const db=JSON.parse(localStorage.getItem('catwalk-sterren-v1'));const pos=db.profiles[0].kitchen.pos;return KitchenRules.walkable(pos.x,pos.y);}),'Avatar stays on walkable floor');
    await p.setViewportSize({width:390,height:844});
    assert(!await p.locator('.kr-dpad').isVisible(),'Mobile kitchen uses tap-to-walk');
    await p.screenshot({path:'test-results/kitchen-mobile.png',fullPage:true});
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile overflow');
    await p.locator('#food-exit').click();await enter('supermarkt');await p.waitForFunction(()=>Supermarket.debug().avatarReady);assert(await p.locator('#market-3d canvas').isVisible(),'Supermarket door works');
    assert(!errors.length,errors.join('\n'));return 'Browser OK: shopping, own avatar, route finding, carrying after reload, timed preparation, automatic cooking, clean plate requirement, serving, washing, collision, mobile, no JS errors.';
  }catch(e){await p.screenshot({path:'test-results/kitchen-3d-failure.png',fullPage:true});throw e;}finally{await context.close();}
}

async page=>{
 const ctx=await page.context().browser().newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true}),p=await ctx.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 const state=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('catwalk-sterren-v1')).profiles[0]);
 const visit=async id=>{const point=await p.evaluate(id=>Supermarket.screenPoint(id),id);await p.touchscreen.tap(point.x,point.y);await p.locator('.market-dialog').waitFor({timeout:15000});};
 try{
  await p.goto('http://127.0.0.1:4173');await p.locator('#profiles .new').click();await p.locator('#name-input').fill('Winkelen');await p.locator('#create-done').click();
  await p.evaluate(()=>{World.hide();const db=JSON.parse(localStorage.getItem('catwalk-sterren-v1')),h=TownRules.HOUSES.find(h=>h.id==='supermarkt');db.profiles[0].town.pos={x:h.x,y:h.y};db.profiles[0].coins=100;localStorage.setItem('catwalk-sterren-v1',JSON.stringify(db));});
  await p.reload();await p.locator('#profiles .profile').first().click();await p.locator('[data-house="supermarkt"]').click();await p.locator('#market-3d canvas').waitFor();await p.waitForFunction(()=>Supermarket.debug().avatarReady);
  const before=await state();
  for(const [w,h] of [[320,568],[375,812],[412,915],[667,375],[844,390]]){await p.setViewportSize({width:w,height:h});await p.waitForTimeout(200);const fit=await p.locator('#market-3d').evaluate(el=>{const b=el.getBoundingClientRect();return b.width>100&&b.height>100&&b.bottom<=innerHeight;});if(!fit)throw Error('Playfield does not fit '+w);await p.screenshot({path:`test-results/shop-${w}.png`});}
  await p.setViewportSize({width:375,height:812});await p.waitForTimeout(200);
  await visit('produce');await p.locator('[data-add="potato"]').tap();await p.locator('[data-add="potato"]').tap();await p.locator('[data-add="tomato"]').tap();await p.locator('[data-cancel]').tap();
  const unpaid=await state();if(unpaid.coins!==before.coins||(unpaid.kitchen?.stock.potato||0)!==(before.kitchen?.stock.potato||0))throw Error('Unpaid stock changed');
  for(const id of ['dry','cold','bakery']){await visit(id);await p.locator('[data-add]').first().tap();await p.locator('[data-cancel]').tap();}
  await p.locator('#market-cart').tap();await p.locator('#food-pay').waitFor({timeout:15000});await p.locator('#food-pay').tap();
  const paid=await state();if(paid.coins!==86||paid.kitchen.stock.potato!==(before.kitchen?.stock.potato||0)+2)throw Error('Payment incorrect '+paid.coins);if(!await p.locator('#food-pay').isDisabled())throw Error('Double payment possible');await p.locator('[data-cancel]').tap();
  await p.locator('#food-home').tap();await p.locator('#food-start').tap();await p.locator('#kr3d-host canvas').waitFor();await p.locator('#food-shop').tap();await p.locator('#market-3d canvas').waitFor();
  await p.screenshot({path:'test-results/shop-final.png'});if(errors.length)throw Error(errors.join('\n'));return {ok:true,sizes:5,coins:paid.coins,view:await p.evaluate(()=>Supermarket.debug())};
 }catch(e){await p.screenshot({path:'test-results/shop-error.png'});throw Error(e.message+' | '+errors.join(';'));}finally{await ctx.close();}
}

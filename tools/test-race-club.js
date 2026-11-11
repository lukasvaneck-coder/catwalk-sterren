async page=>{
 const ctx=await page.context().browser().newContext({viewport:{width:667,height:375},isMobile:true,hasTouch:true}),p=await ctx.newPage();try{
  await p.goto('http://127.0.0.1:4173');await p.locator('#profiles .new').tap();await p.locator('#name-input').fill('Clubtest');await p.locator('#create-done').tap();await p.locator('#world-menu-toggle').tap();await p.locator('#btn-world-parkour').tap();await p.waitForFunction(()=>FashionRoom.debug().avatar?.ready);
  await p.screenshot({path:'test-results/raceclub-3d-667.png'});
  for(const id of ['tag','rain','dad','gym','school']){const b=p.locator(`[data-fashion-station=race_${id}]`);await b.scrollIntoViewIfNeeded();const box=await b.boundingBox();if(box.x<0||box.x+box.width>667||box.y<0||box.y+box.height>375)throw Error('Start button clipped '+id);await b.tap();await p.waitForFunction(()=>document.body.dataset.screen==='screen-parkour');if(await p.evaluate(()=>Parkour.debug().selected)!==id)throw Error('Wrong gate');await p.locator('#pk-exit').tap();await p.waitForFunction(()=>FashionRoom.debug().avatar?.ready);}
  return {fiveGatesReachable:true,landscapeButtonsVisible:true};
 }finally{await ctx.close();}
}

async page=>{
 const ctx=await page.context().browser().newContext({viewport:{width:667,height:375},isMobile:true,hasTouch:true}),p=await ctx.newPage();try{
  await p.goto('http://127.0.0.1:4173');await p.locator('#profiles .new').tap();await p.locator('#name-input').fill('Speelhal');await p.locator('#create-done').tap();await p.locator('#world-menu-toggle').tap();await p.locator('#btn-world-speeltuin').tap();await p.waitForFunction(()=>FashionRoom.debug().avatar?.ready);
  for(const id of ['springbaan','klimrek','ballenbak','trampoline']){await p.locator(`[data-fashion-station=play_${id}]`).tap();await p.locator(`[data-play=${id}]`).first().waitFor();await p.locator('#st-exit').tap();await p.waitForFunction(()=>FashionRoom.debug().avatar?.ready);}
  await p.screenshot({path:'test-results/playground-hall-landscape.png'});return {fourStationsReachable:true,landscape:true};
 }finally{await ctx.close();}
}

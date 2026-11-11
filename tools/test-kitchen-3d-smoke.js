async page=>{
  const ctx=await page.context().browser().newContext({viewport:{width:1280,height:900}}),p=await ctx.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  try{
    await p.goto(page.url());
    await p.locator('#profiles .new').click();await p.locator('#name-input').fill('3D lokaal');await p.locator('#create-done').click();
    await p.evaluate(()=>{World.hide();const db=JSON.parse(localStorage.getItem('catwalk-sterren-v1'));const h=TownRules.HOUSES.find(v=>v.id==='keuken');db.profiles[0].town.pos={x:h.x,y:h.y};localStorage.setItem('catwalk-sterren-v1',JSON.stringify(db));});
    await p.reload();await p.locator('#profiles .profile').first().click();await p.locator('[data-house="keuken"]').click();await p.locator('#kr3d-host canvas').waitFor();await p.waitForTimeout(1500);
    const result=await p.evaluate(()=>Kitchen3D.debug());
    const available=await p.evaluate(()=>{const gl=document.querySelector('#kr3d-host canvas').getContext('webgl2');window.testContextExtension=gl.getExtension('WEBGL_lose_context');if(window.testContextExtension)window.testContextExtension.loseContext();return !!window.testContextExtension;});
    if(available){await p.waitForFunction(()=>Kitchen3D.debug().contextLost);await p.evaluate(()=>window.testContextExtension.restoreContext());await p.waitForFunction(()=>!Kitchen3D.debug().contextLost);}
await p.screenshot({path:'test-results/kitchen-3d-file.png'});
    if(errors.length)throw Error(errors.join('\n'));
    return result;
  }finally{await ctx.close();}
}

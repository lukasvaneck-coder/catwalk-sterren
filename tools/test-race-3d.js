async page=>{
 const ctx=await page.context().browser().newContext({viewport:{width:375,height:812},hasTouch:true,isMobile:true}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const touch=await ctx.newCDPSession(p);
 const check=(v,m)=>{if(!v)throw Error(m);},screen=id=>p.waitForFunction(id=>document.body.dataset.screen===id,id);
 try{
  await p.goto('http://127.0.0.1:4173');await p.locator('#profiles .new').tap();await p.locator('#name-input').fill('3D racer');await p.locator('#create-done').tap();await p.locator('#world-menu-toggle').tap();await p.locator('#btn-world-parkour').tap();await screen('screen-fashion-room');await p.waitForFunction(()=>FashionRoom.debug().avatar?.ready);check(await p.locator('[data-fashion-station]').count()===5,'Missing start gates');for(const [width,height] of [[320,568],[667,375],[375,812]]){await p.setViewportSize({width,height});await p.screenshot({path:`test-results/raceclub-3d-${width}.png`});check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Club overflow');}await p.screenshot({path:'test-results/raceclub-3d.png'});await p.locator('[data-fashion-station=race_school]').tap();await screen('screen-parkour');
  for(const id of ['school','gym','rain','tag','dad']){
   await p.locator(`[data-course=${id}]`).tap();await p.locator('#pk-start').tap();await p.waitForFunction(()=>Parkour3D.debug().ready&&Parkour3D.debug().actors.every(a=>a.ready));await p.locator('#pk-pause').tap();
   for(const [w,h] of [[320,568],[667,375],[1280,900]]){await p.setViewportSize({width:w,height:h});await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const b=await p.locator(id==='dad'?'#pk-sprint':'#pk-jump').boundingBox();check(b.y>=0&&b.y+b.height<=h,'Controls offscreen '+id+' '+w);check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Overflow '+id);}
   await p.setViewportSize({width:375,height:812});await p.locator('#pk-resume').tap();await p.waitForFunction(()=>Parkour.debug().state.countdown<=0);await p.screenshot({path:`test-results/race-${id}-3d.png`});
   if(id!=='dad'){
    const before=await p.evaluate(()=>Parkour.debug().state.player.x),stick=await p.locator('#pk-stick').boundingBox();const pt={x:stick.x+stick.width*.9,y:stick.y+stick.height*.5,id:21};await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pt]});const jump=await p.locator('#pk-jump').boundingBox();await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[pt,{x:jump.x+jump.width/2,y:jump.y+jump.height/2,id:22}]});await p.waitForFunction(x=>Parkour.debug().state.player.x>x+5,before);check(await p.evaluate(()=>Parkour.debug().state.jump>0),'Jump not active');await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   }
   if(id==='dad'){
    const deadline=Date.now()+35000;while(!await p.evaluate(()=>Parkour.debug().state.finished)&&Date.now()<deadline){await p.locator('#pk-sprint').tap();await p.waitForTimeout(100);}
    check(await p.evaluate(()=>Parkour.debug().state.success),'Sprint did not finish');const record=await p.evaluate(()=>JSON.parse(localStorage.getItem('catwalk-sterren-v1')).profiles[0].parkour.records.dad);check(record&&record.stars>0,'No saved record');await p.locator('#pk-outfit').tap();continue;
   }
   await p.locator('#pk-pause').tap();
   if(id==='school'){
    await p.evaluate(()=>{const c=document.querySelector('#pk-canvas'),gl=c.getContext('webgl2')||c.getContext('webgl');window.raceLoss=gl.getExtension('WEBGL_lose_context');window.raceLoss.loseContext();});await p.waitForFunction(()=>Parkour3D.debug().lost);await p.locator('#pk-resume').tap();check(await p.evaluate(()=>Parkour.debug().paused),'Context loss resumed clock');await p.evaluate(()=>window.raceLoss.restoreContext());await p.waitForFunction(()=>Parkour3D.debug().ready);
   }
   const time=await p.evaluate(()=>Parkour.debug().state.time);await p.evaluate(()=>new Promise(r=>setTimeout(r,150)));check(await p.evaluate(t=>Parkour.debug().state.time===t,time),'Pause clock advanced');await p.locator('#pk-back').tap();check(!await p.evaluate(()=>Parkour3D.debug().ready),'Renderer not disposed');
  }
  await p.locator('#pk-exit').tap();await screen('screen-fashion-room');await p.locator('#fashion-exit').tap();await screen('screen-world');check(!errors.length,errors.join(';'));return {courses:5,clubGates:5,viewports:3,touchMoveAndJump:true,pause:true,contextRestore:true,fullSprintAndRecord:true,exit:true,errors};
 }catch(e){await p.screenshot({path:'test-results/race-3d-error.png'});throw Error(e.message+' '+errors.join(';'));}finally{await ctx.close();}
}

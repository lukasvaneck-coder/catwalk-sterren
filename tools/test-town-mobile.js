// Mobiele binnenactiviteiten: controls blijven bereikbaar naast het vaste voorbeeld.
async page=>{
 const context=await page.context().browser().newContext({viewport:{width:375,height:667},hasTouch:true}),p=await context.newPage(),errors=[],checks=[];
 p.on('pageerror',e=>errors.push(e.message));
 const assert=(ok,message)=>{if(!ok)throw new Error(message);};
 const at=async id=>{await p.evaluate(()=>World.hide());await p.evaluate(id=>{const db=JSON.parse(localStorage.getItem('catwalk-sterren-v1')),h=TownRules.HOUSES.find(h=>h.id===id);db.profiles[0].town.pos={x:h.x,y:h.y};localStorage.setItem('catwalk-sterren-v1',JSON.stringify(db));},id);await p.reload();await p.locator('#profiles .profile').first().tap();await p.locator(`[data-house="${id}"]`).tap();};
 try{
  await p.goto(page.url().split('/').slice(0,3).join('/')+'/');await p.locator('#profiles .new').tap();await p.locator('#name-input').fill('Mobiel dorp');await p.locator('#create-done').tap();
  for(const place of ['disco','balzaal']){
   await at(place);await p.locator('#activity-start').tap();await p.locator('#activity-pause').tap();
   for(const [width,height] of [[320,568],[375,667],[412,839],[667,375]]){
    await p.setViewportSize({width,height});
    for(const pad of await p.locator('[data-pad]').all()){const box=await pad.boundingBox();assert(box.x>=0&&box.x+box.width<=width&&box.y>=0&&box.y+box.height<=height,`${place} pad outside ${width}x${height}`);}
    const model=await p.locator('#activity-scene').boundingBox();assert(model.height>=145&&model.y>=0&&model.y+model.height<=height,'Dance scene hidden');
    assert(await p.evaluate(()=>document.documentElement.scrollWidth===innerWidth),'Activity horizontal overflow');
    await p.screenshot({path:`test-results/town/${place}-mobile-${width}.png`});
   }
   await p.locator('#activity-sound').tap();assert(await p.locator('#activity-sound').getAttribute('aria-label')==='Geluid aan','Sound switch failed');await p.locator('#activity-sound').tap();
   await p.locator('#activity-exit').tap();checks.push(place+' pads, scene, pause and sound at four sizes');
  }
  await p.setViewportSize({width:320,height:568});await at('foto');await p.locator('[data-photo-bg="balzaal"]').tap();await p.locator('#activity-photo').tap();assert(await p.locator('#photo-dl').isVisible(),'Mobile photo unavailable');await p.locator('#photo-close').tap();await p.locator('#activity-exit').tap();
  await at('knuffel');for(const id of ['aaien','water','spelen'])await p.locator(`[data-care="${id}"]`).tap();assert((await p.locator('#activity-pet-status').textContent()).includes('Bedankt'),'Mobile care not completed');await p.screenshot({path:'test-results/town/pets-mobile.png'});
  checks.push('Small-phone photo and pet care flows');assert(!errors.length,errors.join('\n'));return{passed:checks,errors};
 }finally{await context.close();}
}

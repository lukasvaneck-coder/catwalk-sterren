// playwright-cli -s=town run-code --filename=tools/test-town-browser.js
// Eigen context; alle echte spelers blijven intact. Looproutes worden ook geometrisch getest in test-town.js.
async page => {
  const context=await page.context().browser().newContext({viewport:{width:1280,height:800},hasTouch:true});
  const p=await context.newPage(),errors=[],checks=[];await p.bringToFront();
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push(m.text());});
  const assert=(ok,message)=>{if(!ok)throw new Error(message);};
  const profile=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('catwalk-sterren-v1')).profiles[0]);
  const world=()=>p.waitForFunction(()=>document.body.dataset.screen==='screen-world'&&World._state().active);
  const at=async(id,type='house')=>{
    // Avoid pagehide overwriting the intentionally seeded position with the old runtime position.
    await p.evaluate(()=>{World.hide();});
    await p.evaluate(({id,type})=>{const db=JSON.parse(localStorage.getItem('catwalk-sterren-v1'));const t=(type==='house'?TownRules.HOUSES:type==='node'?TownRules.NODES:TownRules.NPCS).find(t=>t.id===id);db.profiles[0].town.pos={x:t.x,y:t.y};localStorage.setItem('catwalk-sterren-v1',JSON.stringify(db));},{id,type});
    await p.reload();await p.locator('#profiles .profile').first().click();await world();await p.locator(`[data-${type}="${id}"]`).click();
  };
  try{
    await p.goto(page.url().split('/').slice(0,3).join('/')+'/');
    await p.locator('#profiles .new').click();await p.locator('#name-input').fill('Dorpsspeeltest');await p.locator('#create-done').click();await world();
    await p.waitForFunction(()=>Avatar.isReady());
    assert(await p.locator('.town-building').count()===13,'There must be thirteen real buildings');
    await p.screenshot({path:'test-results/town/desktop.png'});
    await p.locator('#village-overview').click();assert(await p.locator('[data-destination]').count()===13,'Map is missing destinations');
    await p.screenshot({path:'test-results/town/map.png'});
    await p.locator('[data-destination="kleedkamer"]').click();
    const before=await p.evaluate(()=>World._state().pos);
    await p.waitForFunction(start=>Math.hypot(World._state().pos.x-start.x,World._state().pos.y-start.y)>60,before);
    await p.waitForFunction(()=>document.body.dataset.screen==='screen-game',null,{timeout:15000});
    assert((await profile()).town.visited.includes('kleedkamer'),'Walking through a door did not stamp passport');
    await p.locator('#btn-world').click();await world();
    assert(Math.abs((await p.evaluate(()=>World._state().pos.x))-400)<40,'Returning from building lost location');
    checks.push('Large map, actual walking route, automatic entry, passport and returning to the same door');

    await at('atelier');assert(await p.locator('#design-shape').isVisible(),'Atelier door failed');await p.locator('#design-back').click();await world();
    await at('race');assert(await p.locator('#pk-start').isVisible(),'Race door failed');await p.locator('#pk-exit').click();await world();
    await at('speeltuin');assert(await p.locator('#st-exit').isVisible(),'Playground door failed');await p.locator('#st-exit').click();await world();
    await at('winkel');assert(await p.locator('#shop-close').isVisible(),'Shop door failed');await p.locator('#shop-close').click();
    await at('puzzel');assert(await p.locator('[data-color-rule]').count()===3,'Color house failed');await p.locator('#colors-close').click();
    await at('leshuis');assert(await p.locator('[data-lesson]').count()===10,'Learning house failed');await p.locator('#learning-close').click();
    await at('salon');assert(await p.locator('#create-done').isVisible(),'Salon failed');await p.locator('#create-cancel').click();await world();
    // The existing duel requires two players. Seed a second test profile, then use the real setup UI.
    await p.evaluate(()=>World.hide());
    await p.evaluate(()=>{const db=JSON.parse(localStorage.getItem('catwalk-sterren-v1'));if(db.profiles.length<2)db.profiles.push({...JSON.parse(JSON.stringify(db.profiles[0])),id:'p_second_town',name:'Tweede speeltest',customDesigns:[],town:{}});localStorage.setItem('catwalk-sterren-v1',JSON.stringify(db));});
    await p.reload();await p.locator('#profiles .profile').first().click();await world();
    await at('duel');assert(await p.locator('#duel-go').isVisible(),'Duel house failed');await p.locator('#duel-cancel').click();
    checks.push('Doors for atelier, races, playground, shop, colors, weather/budget, salon and duel');

    await at('foto');await p.locator('[data-photo-bg="disco"]').click();await p.locator('#activity-photo').click();
    assert((await p.locator('#photo-dl').getAttribute('href')).startsWith('data:image/png'),'Photo did not produce a saveable image');
    await p.locator('#photo-close').click();await p.locator('#activity-exit').click();await world();
    await at('knuffel');const coinsBefore=(await profile()).coins;
    for(const id of ['aaien','water','spelen'])await p.locator(`[data-care="${id}"]`).click();
    const cared=await profile();assert(cared.coins>coinsBefore&&cared.town.cared.length===1,'Pet care did not award');
    await p.locator('#activity-exit').click();await world();await at('knuffel');
    for(const id of ['aaien','water','spelen'])await p.locator(`[data-care="${id}"]`).click();
    assert((await profile()).coins===cared.coins,'Same pet awarded twice');await p.locator('#activity-exit').click();
    checks.push('Photo studio, companions and one care reward per pet');

    await at('disco');await p.locator('#activity-start').click();await p.locator('#activity-pause').click();
    const pausedTime=await p.evaluate(()=>TownActivities._state().time);await p.waitForTimeout(220);assert(await p.evaluate(()=>TownActivities._state().time)===pausedTime,'Paused dance kept running');await p.locator('#activity-pause').click();
    for(let i=0;i<12;i++){
      await p.waitForFunction(i=>{const s=TownActivities._state();return s.time>=s.lead+i*s.beat-.18;},i);
      const pad=await p.evaluate(i=>TownActivities._state().notes[i],i);await p.locator(`[data-pad="${pad}"]`).click();
      if(i===3)await p.screenshot({path:'test-results/town/disco.png'});
    }
    await p.waitForSelector('#activity-again');assert((await profile()).town.records.disco.stars===3,'Perfect rhythm did not award 3 stars');
    const finishedCoins=(await profile()).coins;await p.waitForTimeout(200);assert((await profile()).coins===finishedCoins,'Finish awarded more than once');
    await p.locator('#activity-exit').click();await world();
    await at('balzaal');await p.locator('#activity-start').click();
    for(let round=0;round<4;round++){
      await p.waitForFunction(()=>TownActivities._state().phase==='input');
      const sequence=await p.evaluate(()=>TownActivities._state().sequence.slice(0,TownActivities._state().round+3));
      if(round===0)await p.screenshot({path:'test-results/town/ballroom.png'});
      for(const pad of sequence)await p.locator(`[data-pad="${pad}"]`).click();
    }
    assert((await profile()).town.records.balzaal.stars===3,'Ballroom completion failed');await p.locator('#activity-exit').click();await world();
    assert((await profile()).town.visited.length===13,'Not all doors stamped the passport');
    checks.push('Rhythm timing, pause/resume, complete disco and ballroom games, records and exactly one reward');

    await p.locator('#village-journal').click();await p.locator('[data-accept="garden"]').click();await p.locator('#town-dialog-close').click();
    for(const id of ['garden_1','garden_2','garden_3']){await at(id,'node');assert((await profile()).town.collected.includes(id),'Watering did not persist: '+id+' '+JSON.stringify((await profile()).town));}
    await p.locator('#village-journal').click();await p.locator('[data-claim="garden"]').click();
    const claimCoins=(await profile()).coins;assert((await profile()).town.completed.includes('garden'),'Quest claim not saved');
    await p.locator('#town-dialog-close').click();await p.reload();await p.locator('#profiles .profile').first().click();await world();
    await p.locator('#village-journal').click();assert(await p.locator('[data-claim="garden"]').count()===0,'Quest reward available again after reload');
    assert((await profile()).coins===claimCoins,'Quest duplicated coins');await p.screenshot({path:'test-results/town/journal.png'});await p.locator('#town-dialog-close').click();
    checks.push('Outdoor watering, quest progress across reload and one-time quest reward');

    for(const [width,height] of [[320,568],[375,667],[412,839],[667,375]]){
      await p.setViewportSize({width,height});await p.waitForTimeout(50);
      const controls=await p.locator('.world-bottom').boundingBox(),avatar=await p.locator('#village-avatar').boundingBox();
      assert(controls.y>=0&&controls.y+controls.height<=height,'Walking controls outside viewport');
      assert(controls.height<height*.32,'Walking controls cover too much of village');
      assert(avatar.y>30&&avatar.y+avatar.height<controls.y,'Player hidden behind HUD');
      assert(await p.evaluate(()=>document.documentElement.scrollWidth===innerWidth),'Horizontal page overflow');
      await p.screenshot({path:`test-results/town/mobile-${width}.png`});
      await p.locator('#village-overview').tap();assert(await p.locator('[data-destination="balzaal"]').isVisible(),'Last destination inaccessible');await p.locator('#town-dialog-close').tap();
      const before=await p.evaluate(()=>World._state().pos);await p.locator('[data-key="ArrowLeft"]').tap();
      // Real touch taps on map and journal are covered above; keyboard movement verifies world input after closing dialogs.
      await p.keyboard.down('ArrowLeft');await p.waitForTimeout(150);await p.keyboard.up('ArrowLeft');
      assert(await p.evaluate(start=>TownRules.dist(World._state().pos,start)>1,before),'Movement stayed blocked after closing map');
    }
    checks.push('Four mobile/landscape layouts, accessible map, visible avatar and movement after dialogs');
    assert(!errors.length,errors.join('\n'));return {passed:checks,errors};
  }finally{await context.close();}
}

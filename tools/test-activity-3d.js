async page=>{
 const ctx=await page.context().browser().newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const check=(v,m)=>{if(!v)throw Error(m);};
 const profile=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('catwalk-sterren-v1')).profiles[0]);
 async function enter(id){await p.evaluate(id=>{World.hide();const db=JSON.parse(localStorage.getItem('catwalk-sterren-v1')),h=TownRules.HOUSES.find(h=>h.id===id);db.profiles[0].town.pos={x:h.x,y:h.y};db.profiles[0].owned.push('pt_puppy','pt_konijn','pt_moos');db.profiles[0].outfit.pet='pt_puppy';localStorage.setItem('catwalk-sterren-v1',JSON.stringify(db));},id);await p.reload();await p.locator('#profiles .profile').first().tap();await p.locator(`[data-house=${id}]`).tap();await p.waitForFunction(()=>ActivityRoom3D.debug().avatar?.ready);}
 try{
  await p.goto('http://127.0.0.1:4173');await p.locator('#profiles .new').tap();await p.locator('#name-input').fill('Knuffeldanser');await p.locator('#create-done').tap();await enter('knuffel');
  const before=await profile();
  for(const id of ['aaien','water','spelen']){await p.locator(`[data-care=${id}]`).tap();await p.waitForFunction(id=>document.querySelector(`[data-care=${id}]`).disabled,id,{timeout:15000});}
  check((await profile()).town.cared.includes('pt_puppy'),'Care not saved');check((await profile()).stars===before.stars+1,'Care reward missing');await p.screenshot({path:'test-results/knuffel-3d-mobile.png'});
  await p.locator('#activity-pet').selectOption('pt_konijn');await p.waitForFunction(()=>ActivityRoom3D.debug().pet==='pt_konijn');await p.locator('[data-care=aaien]').tap();await p.waitForFunction(()=>ActivityRoom3D.debug().action==='aaien');await p.locator('#activity-pet').selectOption('pt_moos');await p.waitForTimeout(2200);check(!await p.locator('[data-care=aaien]').isDisabled(),'Pet switch leaked care');
  await p.locator('#activity-pet').selectOption('pt_puppy');for(const id of ['aaien','water','spelen']){await p.locator(`[data-care=${id}]`).tap();await p.waitForFunction(id=>document.querySelector(`[data-care=${id}]`).disabled,id,{timeout:15000});}check((await profile()).stars===before.stars+1,'Duplicate pet reward');
  for(const [w,h] of [[320,568],[667,375],[1280,800]]){await p.setViewportSize({width:w,height:h});await p.screenshot({path:`test-results/knuffel-${w}.png`});check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow');}
  await p.locator('#activity-exit').tap();check(!await p.evaluate(()=>ActivityRoom3D.debug().ready),'Renderer leaked');await enter('disco');await p.setViewportSize({width:390,height:844});await p.locator('#activity-start').tap();await p.waitForFunction(()=>TownActivities._state()?.kind==='disco',{},{timeout:12000});
  await p.locator('#activity-pause').tap();let time=await p.evaluate(()=>TownActivities._state().time);await p.waitForTimeout(300);check(await p.evaluate(t=>TownActivities._state().time===t,time),'Pause failed');await p.locator('#activity-pause').tap();
  for(let i=0;i<12;i++){await p.waitForFunction(i=>{const s=TownActivities._state();return s.time>=s.lead+i*s.beat-.1;},i);const note=await p.evaluate(i=>TownActivities._state().notes[i],i);await p.locator(`[data-pad="${note}"]`).tap();if(i===4)await p.screenshot({path:'test-results/disco-3d-mobile.png'});}
  await p.locator('#activity-again').waitFor();check(await p.evaluate(()=>TownActivities._state().hits>=10),'Dance scoring');check((await profile()).town.records.disco.stars===3,'Dance reward/save');
  for(const [w,h] of [[320,568],[667,375],[1280,800]]){await p.setViewportSize({width:w,height:h});await p.screenshot({path:`test-results/disco-${w}.png`});}
  await p.locator('#activity-exit').tap();check(!errors.length,errors.join(';'));return {care:true,noDuplicateReward:true,switchCancelsCare:true,dance:true,pause:true,sizes:3,errors};
 }catch(e){await p.screenshot({path:'test-results/activity-3d-error.png'});throw e;}finally{await ctx.close();}
}

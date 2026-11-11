async page=>{
 const ctx=await page.context().browser().newContext({viewport:{width:375,height:812},hasTouch:true,isMobile:true}),p=await ctx.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));const check=(v,m)=>{if(!v)throw Error(m);},saved=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('catwalk-sterren-v1')).profiles[0]);
 const tool=async id=>{const b=p.locator(`[data-design-panel=${id}]`);if(await b.getAttribute('aria-pressed')!=='true')await b.tap();};
 const atelier=async()=>{await p.locator('#world-menu-toggle').tap();await p.locator('#btn-world-designer').tap();};
 try{
  await p.goto('http://127.0.0.1:4173');await p.locator('#profiles .new').tap();await p.locator('#name-input').fill('Verwijdertest');await p.locator('#create-done').tap();await atelier();
  await tool('name');await p.locator('#design-name').fill('Mijn favoriete top');await p.locator('#design-save').tap();const first=(await saved()).outfit.top;
  await tool('name');await p.locator('#design-copy').tap();const second=(await saved()).outfit.top;
  await tool('library');await p.locator(`[data-delete-design="${first}"]`).tap();check((await p.locator('#design-delete-message').textContent()).includes('Mijn favoriete top'),'Missing name');await p.locator('[data-delete-cancel]').tap();check((await saved()).customDesigns.length===2,'Cancel deleted item');
  await tool('library');await p.locator(`[data-delete-design="${first}"]`).tap();await p.keyboard.press('Escape');check((await saved()).customDesigns.length===2,'Escape deleted item');
  await tool('name');await p.locator('#design-name').fill('Werk in uitvoering');await tool('library');await p.locator(`[data-delete-design="${first}"]`).tap();await p.locator('[data-delete-confirm]').tap();check((await saved()).customDesigns.length===1,'Unworn deletion failed');check(await p.locator('#design-name').inputValue()==='Werk in uitvoering','Unrelated draft lost');
  await tool('library');await p.locator(`[data-delete-design="${second}"]`).tap();check((await p.locator('[data-delete-detail]').textContent()).includes('onopgeslagen'),'Missing dirty draft notice');await p.screenshot({path:'test-results/clothing-delete-mobile.png'});
  await p.evaluate(()=>{window.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('Storage full');};});await p.locator('[data-delete-confirm]').tap();check((await saved()).customDesigns.length===1,'Failed write removed saved item');check(await p.locator('[data-delete-error]').textContent(),'Missing storage error');check(await p.evaluate(id=>!!ITEM_BY_ID[id],second),'Failed write unregistered item');await p.evaluate(()=>Storage.prototype.setItem=window.originalSetItem);
  await p.locator('[data-delete-confirm]').tap();const profile=await saved();check(profile.customDesigns.length===0&&!profile.owned.includes(second),'Deleted item still owned');check(profile.outfit.top==='top_tshirt_blauw','Missing basic top');check(!profile.designDraft,'Deleted draft remained');check(await p.evaluate(id=>!ITEM_BY_ID[id],second),'Deleted item still registered');check(await p.locator('[data-delete-design]').count()===0,'Deleted item in library');
  await p.reload();await p.locator('#profiles .profile').first().tap();await atelier();check(await p.locator('[data-edit-design]').count()===0,'Deleted designs returned');check(!errors.length,errors.join(';'));return {cancel:true,escape:true,unworn:true,wornFallback:true,keepOtherDraft:true,storageFailureRollback:true,reload:true};
 }finally{await ctx.close();}
}

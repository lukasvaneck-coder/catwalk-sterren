async page=>{
 const ctx=await page.context().browser().newContext({viewport:{width:1250,height:1100}}),p=await ctx.newPage();try{await p.goto('http://127.0.0.1:4173');await p.waitForFunction(()=>Avatar.isReady());const result=await p.evaluate(()=>{
  document.body.innerHTML='<main id="race-review" style="display:grid;grid-template-columns:repeat(3,400px);gap:12px"></main>';const stats=[];
  const player={look:{skin:'s3',eyes:'e2',hairColor:'roze',hairParts:HairParts.normalize({top:'buns',left:'braid',right:'tail'}),build:50},outfit:{hair:'hair_lang',top:'top_tshirt_blauw',bottom:'bot_jeans',shoes:'sh_sneakers'}};
  for(const id of ParkourRules.courses.map(c=>c.id)){
   const s=ParkourRules.create(id,player.outfit,player.outfit,ITEM_BY_ID);s.countdown=0;s.time=3;
   if(id==='school')s.player={x:800,y:300};if(id==='rain'){s.player={x:890,y:300};s.jump=.4;}if(id==='tag')s.player={x:480,y:270};if(id==='gym')s.player={x:460,y:480};if(id==='dad'){s.player.x=400;s.npcs[0].x=440;}
   const card=document.createElement('section');card.innerHTML='<h3>'+s.course.name+'</h3>';const canvas=document.createElement('canvas');canvas.style.cssText='width:400px;height:430px';card.append(canvas);document.querySelector('#race-review').append(card);
   if(!Parkour3D.mount(canvas,s,[player,...s.npcs.map(()=>player)],()=>{}))throw Error('Mount failed');Parkour3D.draw(s);const d=Parkour3D.debug();if(!d.actors.every(a=>a.ready))throw Error('Avatar missing');stats.push({id,actors:d.actors.length,drawCalls:d.drawCalls,cars:d.cars.length,flags:d.flagsVisible});const image=document.createElement('img');image.src=canvas.toDataURL();image.style.width='400px';canvas.replaceWith(image);Parkour3D.dispose();
  }return stats;
 });await p.locator('#race-review').screenshot({path:'test-results/race-all-3d-review.png'});return result;}finally{await ctx.close();}
}

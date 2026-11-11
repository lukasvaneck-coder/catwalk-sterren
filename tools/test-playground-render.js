async page=>{
 const ctx=await page.context().browser().newContext({viewport:{width:1230,height:1120}}),p=await ctx.newPage();try{await p.goto('http://127.0.0.1:4173');await p.waitForFunction(()=>Avatar.isReady());const result=await p.evaluate(()=>{
  document.body.innerHTML='<main id="review" style="display:grid;grid-template-columns:repeat(3,400px);gap:10px"></main>';const profile={look:{skin:'s3',eyes:'e2',hairColor:'roze',build:50,hairParts:HairParts.normalize({top:'buns',left:'braid',right:'tail'})},outfit:{hair:'hair_lang',top:'top_tshirt_blauw',bottom:'bot_jeans',shoes:'sh_sneakers'}},out=[];
  for(const id of ['springbaan','trampoline','klimrek','slide','ballenbak']){
   const s=['springbaan','trampoline'].includes(id)?SpeeltuinRules.create(id,17):['klimrek','slide'].includes(id)?KlimrekRules.create(17,'groot'):BallenbakRules.create(17,'mama');s.countdown=0;s.time=3;
   if(id==='springbaan'){s.player.x=900;s.player.h=100;}if(id==='trampoline'){s.player.h=150;s.level=4;}if(id==='slide'){KlimrekRules.startSlide(s,true);s.slide.x=1400;}if(id==='ballenbak'){s.rain=2;BallenbakRules.throwBall(s,.1,.52);}
   const card=document.createElement('section');card.innerHTML='<h3>'+id+'</h3>';const c=document.createElement('canvas');c.style.cssText='width:400px;height:440px';card.append(c);document.querySelector('#review').append(card);if(!Speeltuin3D.mount(c,s,profile,()=>{}))throw Error('Mount failed '+id);Speeltuin3D.draw(s,10000);Speeltuin3D.draw(s,10100);const d=Speeltuin3D.debug();if(!d.avatar.ready)throw Error('Missing avatar');out.push({id,drawCalls:d.drawCalls,phase:d.phase,limbs:d.avatar.limbs});const img=document.createElement('img');img.src=c.toDataURL();img.style.width='400px';c.replaceWith(img);Speeltuin3D.dispose();
  }return out;
 });await p.locator('#review').screenshot({path:'test-results/playground-all-3d-review.png'});return result;}finally{await ctx.close();}
}

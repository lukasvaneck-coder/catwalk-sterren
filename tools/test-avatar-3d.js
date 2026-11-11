async page=>{
 const ctx=await page.context().browser().newContext({viewport:{width:1000,height:700}}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto('http://127.0.0.1:4173');await p.waitForFunction(()=>Avatar.isReady());
  const checks=await p.evaluate(()=>{
   const profile={look:{skin:'s5',eyes:'e3',hairColor:'roze',build:75},outfit:{hair:'hair_staartjes',top:'top_tshirt_blauw',bottom:'bot_jeans',shoes:'sh_sneakers'}},doll=Avatar3D.create(),assert=(ok,msg)=>{if(!ok)throw Error(msg);};
   doll.update(profile,new THREE.Vector3(),{now:1000});const before=JSON.stringify(profile);for(let i=1;i<=15;i++)doll.update(profile,new THREE.Vector3(i*.03,0,0),{moving:true,now:1000+i*16});assert(doll.debug().angle>1,'Did not turn towards motion');assert(doll.debug().limbs.some(v=>Math.abs(v)>.1),'No walking limbs');assert(JSON.stringify(profile)===before,'Rendering mutated saved profile');
   for(let i=0;i<30;i++)doll.update(profile,new THREE.Vector3(.45,0,0),{now:1300+i*16});assert(doll.debug().limbs.every(v=>Math.abs(v)<.01),'Walking did not settle');
   const design=ClothingDesigns.item({cat:'top',shape:'hoodie',c:['#a68bd5','#fff1c9'],pattern:'stars',stickers:[{kind:'bunny',x:50,y:50,size:32,rotation:0}]},'avatar-test','test');ITEM_BY_ID[design.id]=design;profile.outfit.top=design.id;doll.update(profile,new THREE.Vector3(),{now:2000});const revision=doll.debug().revision;design.c[0]='#ff8855';doll.update(profile,new THREE.Vector3(),{now:2020});assert(doll.debug().revision===revision+1,'Editing an equipped design did not rebuild');
   const shapes=new Map();ITEMS.forEach(it=>shapes.set(it.cat+':'+it.shape,it));let count=0;for(const it of shapes.values()){if(it.cat==='bg')continue;const test={look:profile.look,outfit:{hair:'hair_lang',top:'top_tshirt_blauw',bottom:'bot_jeans',shoes:'sh_sneakers',[it.cat]:it.id}};if(it.cat==='dress'){delete test.outfit.top;delete test.outfit.bottom;}doll.update(test,new THREE.Vector3(),{now:2200+count*20});assert(doll.debug().meshes>20,'Missing geometry for '+it.id);count++;}
   // A close-up turntable for front, side and rear inspection, including an own design.
   document.body.innerHTML='<main id="preview" style="display:flex;gap:12px;padding:20px;background:#dce8d6"></main>';
   profile.outfit.hat=ITEMS.find(it=>it.cat==='hat'&&it.shape==='tiara').id;
   for(const yaw of [0,Math.PI/2,Math.PI]){const model=Avatar3D.create();model.update(profile,new THREE.Vector3(),{now:3000});model.root.rotation.y=yaw;const scene=new THREE.Scene();scene.background=new THREE.Color('#dce8d6');scene.add(new THREE.HemisphereLight('#fff4df','#81987b',2.5));const light=new THREE.DirectionalLight('#ffffff',2);light.position.set(-2,4,5);scene.add(light,model.root);const camera=new THREE.OrthographicCamera(-.7,.7,1,-1,.1,20);camera.position.set(0,.8,5);camera.lookAt(0,.8,0);const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(300,500);document.querySelector('#preview').append(renderer.domElement);renderer.render(scene,camera);}
   doll.dispose();return {catalogueShapes:count,turning:true,walking:true,customEdit:true};
  });await p.screenshot({path:'test-results/avatar-3d-turntable.png'});if(errors.length)throw Error(errors.join('\n'));return checks;
 }finally{await ctx.close();}
}

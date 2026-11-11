async page=>{
 const ctx=await page.context().browser().newContext({viewport:{width:1320,height:1250}}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{await p.goto('http://127.0.0.1:4173');await p.waitForFunction(()=>Avatar.isReady());const result=await p.evaluate(()=>{
  document.body.innerHTML='<main id="heads" style="display:grid;grid-template-columns:repeat(5,252px);gap:8px;padding:8px;background:#e2ebdc"></main>';
  const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(248,260);const scene=new THREE.Scene();scene.background=new THREE.Color('#e2ebdc');scene.add(new THREE.HemisphereLight('#fff5e4','#809577',2.2));const light=new THREE.DirectionalLight('#ffffff',2);light.position.set(-2,4,5);scene.add(light);const camera=new THREE.OrthographicCamera(-.39,.39,.41,-.41,.1,10);camera.position.set(0,1.22,4);camera.lookAt(0,1.22,0);
  let faces=0;const lips=ITEMS.find(i=>i.cat==='mk_lips'),blush=ITEMS.find(i=>i.cat==='mk_blush');
  for(const [i,hair] of ITEMS.filter(i=>i.cat==='hair').entries()){
   const profile={look:{skin:SKINS[i%SKINS.length].id,eyes:EYES[i%EYES.length].id,hairColor:['bruin','roze','blond','zwart'][i%4],build:40},outfit:{hair:hair.id,top:'top_tshirt_blauw',bottom:'bot_jeans',shoes:'sh_sneakers',...(i%2?{mk_lips:lips.id,mk_blush:blush.id}:{})}},doll=Avatar3D.create();doll.update(profile,new THREE.Vector3(),{now:1000});scene.add(doll.root);doll.root.updateMatrixWorld(true);
   const surface=doll.root.getObjectByName('face-surface');if(!surface)throw Error('Missing face '+hair.id);const a=surface.geometry.attributes.position;for(let n=0;n<a.count;n++){const x=a.getX(n),y=a.getY(n);if((x/.25)**2+(y/.27)**2<.95){const expected=.23*Math.sqrt(1-(x/.25)**2-(y/.27)**2);if(Math.abs(a.getZ(n)-expected-.0015)>.00001)throw Error('Detached facial surface');}}
   const cap=doll.root.getObjectByName('hair-cap');for(const x of [-.09,.09]){const ray=new THREE.Raycaster(new THREE.Vector3(x,1.225,1),new THREE.Vector3(0,0,-1));const hit=ray.intersectObject(cap)[0];if(hit&&hit.point.z>.21)throw Error('Hair covers eye '+hair.id);}
   const card=document.createElement('section');card.style.cssText='background:#f7f9f2;border-radius:12px;padding:3px;text-align:center;font:14px sans-serif';card.innerHTML='<b>'+hair.name+(i%2?' · make-up':'')+'</b>';const row=document.createElement('div');row.style.display='flex';card.append(row);
   for(const angle of [0,Math.PI/2]){doll.root.rotation.y=angle;renderer.render(scene,camera);const image=document.createElement('img');image.src=renderer.domElement.toDataURL();image.style.width='50%';row.append(image);faces++;}document.querySelector('#heads').append(card);doll.dispose();
  }renderer.dispose();return {views:faces,faceSurface:true,hairClearOfEyes:true};
 });await p.locator('#heads').screenshot({path:'test-results/avatar-heads-review.png'});if(errors.length)throw Error(errors.join('\n'));return result;}finally{await ctx.close();}
}

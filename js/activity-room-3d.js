/* Walkable activity interiors; game rules and rewards stay in TownActivities. */
const ActivityRoom3D=(()=>{
 const T=THREE,step=.25;
 let renderer,scene,camera,avatar,host,status,observer,frame,last=0,profile,callbacks,kind,active=false,lost=false,locked=false,path=[],pending=null,pos={x:0,z:2.5},obstacles=[],stations=[],targets=[],marker,pet,petId,petTail,discoBall,toy,water,action=null,actionTime=0,dance=-1,danceTime=0,paused=false;
 const geometries=[],materials=[],tiles=[];
 let decor='park',photoPose=-1,decorGroups={},photoBackdrop,photoMark;
 const dancingRoom=()=>kind==='disco'||kind==='balzaal';
 function material(color){const m=new T.MeshStandardMaterial({color,roughness:.7});materials.push(m);return m;}
 function mesh(g,geo,color,x=0,y=0,z=0){geometries.push(geo);const m=new T.Mesh(geo,material(color));m.position.set(x,y,z);g.add(m);return m;}
 const box=(g,c,x,y,z,w,h,d)=>mesh(g,new T.BoxGeometry(w,h,d),c,x,y,z);
 const ball=(g,c,x,y,z,r)=>mesh(g,new T.SphereGeometry(r,16,10),c,x,y,z);
 const cylinder=(g,c,x,y,z,r,h)=>mesh(g,new T.CylinderGeometry(r,r,h,24),c,x,y,z);
 function block(x,z,w,d){obstacles.push({x,z,w:w+.5,d:d+.5});}
 function station(id,name,x,z,build){const g=new T.Group();g.userData.station=id;scene.add(g);build(g);targets.push(g);stations.push({id,name,x,z});}
 function petModel(){
  if(petId===profile.outfit.pet)return;petId=profile.outfit.pet;if(pet){pet.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();geometries.splice(geometries.indexOf(o.geometry),1);materials.splice(materials.indexOf(o.material),1);}});pet.removeFromParent();}pet=new T.Group();scene.add(pet);petTail=null;
  const it=ITEM_BY_ID[petId];if(!it){pet.visible=false;return;}const c=it.c[0],accent=it.c[1]||'#fff1d5',s=it.shape;
  const ell=(color,x,y,z,a,b,d)=>{const o=ball(pet,color,x,y,z,1);o.scale.set(a,b,d);return o;};
  const bird=['penguin','parrot','owl','butterfly'].includes(s),horse=['pony','unicorn','dragon'].includes(s),flat=['turtle','hedgehog'].includes(s);
  ell(c,0,flat?.22:.33,0,horse?.22:.25,flat?.16:.3,horse?.4:.27);
  ell(flat?'#c4d99a':c,0,flat?.24:.64,.23,.2,.2,.19);
  ell(accent,0,flat?.2:.55,.39,.12,.09,.045);
  for(const x of [-.085,.085]){ell('#292438',x,flat?.3:.68,.394,.025,.032,.018);}
  if(s==='butterfly'){for(const x of [-.3,.3]){ell(c,x,.5,0,.3,.36,.045);ell(accent,x,.25,0,.22,.2,.045);}}
  else if(bird){for(const side of [-1,1])ell(accent,side*.24,.35,0,.07,.23,.16);const beak=mesh(pet,new T.ConeGeometry(.065,.14,4),'#e9b454',0,.59,.45);beak.rotation.x=Math.PI/2;}
  else if(!flat){for(const side of [-1,1]){if(['kitten','fox'].includes(s))mesh(pet,new T.ConeGeometry(.095,.19,3),c,side*.14,.84,.22);else ell(c,side*.16,s==='rabbit'? .91:.79,.19,s==='puppy'?.08:.075,s==='rabbit'?.24:s==='puppy'?.16:.08,.065);}}
  if(horse){for(const x of [-.13,.13])for(const z of [-.24,.22])ell(c,x,.14,z,.075,.15,.075);for(let i=0;i<5;i++)ell(accent,0,.65-i*.07,.05-i*.06,.08,.1,.08);}
  else for(const x of [-.17,.17])ell(bird?'#e9b454':c,x,.065,.15,.1,.065,.13);
  if(s==='unicorn')mesh(pet,new T.ConeGeometry(.05,.25,10),'#e6c46e',0,.91,.3);
  if(s==='turtle')ell('#587c48',0,.3,-.04,.29,.2,.29);
  if(s==='hedgehog')for(let i=0;i<18;i++){const a=i*2.4;mesh(pet,new T.ConeGeometry(.055,.16,5),'#68513e',Math.sin(a)*.2,.35+(i%3)*.03,Math.cos(a)*.2-.08);}
  if(s==='dragon')for(const side of [-1,1])ell(accent,side*.29,.5,-.08,.23,.18,.045);
  if(!bird&&!flat){petTail=ell(c,0,.35,-.34,.065,.08,s==='otter'||horse?.3:.16);}
  pet.position.set(1,.06,2);
 }
 function roses(g,x,y,z){cylinder(g,'#c7a96d',x,y-.16,z,.15,.27);for(let i=0;i<5;i++){const a=i*2.4;ball(g,'#8caa7d',x+Math.sin(a)*.11,y+.05,z+Math.cos(a)*.1,.1);ball(g,i%2?'#d989a6':'#f2b8c9',x+Math.sin(a)*.15,y+.13+i*.025,z+Math.cos(a)*.13,.09);}}
 function ballroom(){
  station('dance','Feestdans',0,0,g=>{cylinder(g,'#d9adbb',0,.055,0,1.85,.04);const ring=mesh(g,new T.TorusGeometry(1.8,.035,8,64),'#d9bd7e',0,.085,0);ring.rotation.x=Math.PI/2;});
  for(const x of [-2.9,2.9]){cylinder(scene,'#fff0d8',x,1.25,-2.8,.16,2.5);cylinder(scene,'#d2b474',x,.15,-2.8,.24,.16);cylinder(scene,'#d2b474',x,2.48,-2.8,.24,.14);block(x,-2.8,.55,.55);}
  box(scene,'#d4b173',0,1.65,-3.35,2.8,1.65,.12);box(scene,'#c3dde1',0,1.65,-3.27,2.57,1.42,.05);
  for(const x of [-1.7,1.7]){box(scene,'#cf9fb4',x,1.5,-3.1,.65,2.4,.25);box(scene,'#e7c8a1',x,.95,-2.95,.68,.1,.09);}
  station('music','Feestdans beginnen',-2,-1.5,g=>{box(g,'#805a6b',-2.1,.8,-2.6,1.2,1.5,.6);box(g,'#49394b',-2.1,.8,-2.24,1.2,.12,.35);for(let i=0;i<10;i++)box(g,'#fff3df',-2.64+i*.12,.89,-2.16,.105,.035,.3);block(-2.1,-2.6,1.3,.85);});
  for(const x of [-3,3]){box(scene,'#dfb3bf',x,.34,.6,.7,.56,1.8);box(scene,'#c993ab',x+Math.sign(x)*.27,.72,.6,.16,.6,1.8);block(x,.6,.8,1.8);roses(scene,x,.9,2.4);block(x,2.4,.4,.4);}
  cylinder(scene,'#cbaa66',0,2.8,-1,.025,.65);const ring=mesh(scene,new T.TorusGeometry(.58,.04,8,32),'#cbaa66',0,2.5,-1);ring.rotation.x=Math.PI/2;for(let i=0;i<6;i++){const a=i*Math.PI/3;ball(scene,'#fff2cf',Math.cos(a)*.58,2.55,-1+Math.sin(a)*.58,.1);}
 }
 function studio(){
  photoBackdrop=box(scene,'#b9d4bd',0,1.45,-2.5,4.5,2.9,.1);box(scene,'#f4e4d9',0,.055,-.9,4.5,.05,3.2);
  station('photo','Op de foto',0,-.75,g=>{const ring=photoMark=mesh(g,new T.RingGeometry(.3,.34,40),'#d0a36d',0,.09,-.75);ring.rotation.x=-Math.PI/2;});
  station('camera','Camera',0,1.65,g=>{cylinder(g,'#77717e',0,.65,2.5,.045,1.2);for(const dx of [-.35,.35]){const leg=box(g,'#77717e',dx/2,.32,2.5,.04,.65,.04);leg.rotation.z=dx>0?-.5:.5;}box(g,'#665c72',0,1.3,2.5,.6,.4,.3);const lens=cylinder(g,'#302c3f',0,1.3,2.27,.13,.25);lens.rotation.x=Math.PI/2;block(0,2.5,.65,.6);});
  for(const x of [-3,3]){cylinder(scene,'#8e8797',x,.85,.2,.035,1.7);const light=box(scene,'#fff4dc',x,1.85,.2,.75,.7,.12);light.rotation.y=x<0?.6:-.6;cylinder(scene,'#8e8797',x,.06,.2,.3,.08);block(x,.2,.8,.5);}
  for(const id of ['park','kamer','disco','balzaal']){const g=new T.Group();scene.add(g);decorGroups[id]=g;
   if(id==='park'){for(const x of [-1.1,1.1]){cylinder(g,'#bc9974',x,.65,-1.95,.1,1.3);ball(g,'#8eb58d',x,1.6,-1.95,.55);ball(g,'#a2c699',x+.15,1.95,-1.98,.35);roses(g,x,.3,-1.5);}}
   if(id==='kamer'){box(g,'#cfabc4',0,.37,-1.9,2.4,.6,.7);box(g,'#dfbdd2',0,.85,-2.17,2.4,.7,.2);for(const x of [-1.1,1.1])box(g,'#dfbdd2',x,.7,-1.9,.2,.45,.7);}
   if(id==='disco'){for(let x=0;x<4;x++)for(let z=0;z<3;z++)box(g,['#b79cd0','#88c2d0','#e5afc2','#e9c483'][(x+z)%4],-1.35+x*.9,.085,-1.9+z*.9,.86,.02,.86);mesh(g,new T.IcosahedronGeometry(.3,2),'#e7e3ee',0,2.5,-2);}
   if(id==='balzaal'){for(const x of [-1,1]){cylinder(g,'#f7e9cf',x,1.15,-1.8,.13,2.3);roses(g,x,2.3,-1.8);}box(g,'#d8b879',0,2.5,-2,3.6,.12,.12);}
  }
  setDecor(decor);
 }
 function setDecor(id){if(!['park','kamer','disco','balzaal'].includes(id))return;decor=id;for(const [key,g] of Object.entries(decorGroups))g.visible=key===id;if(photoBackdrop)photoBackdrop.material.color.set({park:'#b8d6c2',kamer:'#d8bfd5',disco:'#8c779e',balzaal:'#e6c4ca'}[id]);}
 function setPhotoPose(id){photoPose=[-1,0,3].includes(id)?id:-1;}
 function shoot(){if(!active||lost||locked)return;locked=true;action='photo';actionTime=.8;status.textContent='Even lachen…';}
 function capture(){
  if(!renderer||lost)return null;const shot=new T.OrthographicCamera(-1.1,1.1,1.4666667,-1.4666667,.1,30);shot.position.set(0,1.65,1.7);shot.lookAt(0,1.2,-.75);const oldSize=renderer.getSize(new T.Vector2()),ratio=renderer.getPixelRatio(),visible=marker.visible;marker.visible=false;photoMark.visible=false;
  try{renderer.setPixelRatio(1);renderer.setSize(900,1200,false);renderer.render(scene,shot);return renderer.domElement.toDataURL('image/png');}catch(e){return null;}finally{marker.visible=visible;photoMark.visible=true;renderer.setPixelRatio(ratio);renderer.setSize(oldSize.x,oldSize.y,false);if(typeof MobilePlayfield!=='undefined')MobilePlayfield.frame(camera,avatar.root.position,host);renderer.render(scene,camera);}
 }
 function build(){
  scene=new T.Scene();scene.background=new T.Color(kind==='disco'?'#b4a5d1':kind==='balzaal'?'#ead5dd':'#dce6d9');scene.add(new T.HemisphereLight('#fff4df','#817993',2.4));const sun=new T.DirectionalLight('#fff7ef',2);sun.position.set(-3,8,5);scene.add(sun);
  box(scene,'#b99f8b',0,-.17,0,8.3,.32,7.4);box(scene,kind==='disco'?'#5e526f':'#f3e6ce',0,.01,0,8,.05,7.1);
  box(scene,kind==='disco'?'#79618c':kind==='balzaal'?'#d8b9c5':'#aec3a9',0,1.35,-3.5,8,2.7,.15);box(scene,kind==='disco'?'#9380a6':'#dfd5be',-4,.65,0,.15,1.3,7);
  if(kind==='disco'){
   station('dance','Dansvloer',0,0,g=>{for(let x=0;x<4;x++)for(let z=0;z<4;z++){const m=box(g,['#bf98cd','#93c9cf','#e7b678','#e7a2bd'][(x+z)%4],-1.5+x,.065,-1.5+z,.94,.06,.94);tiles.push(m);}});
   station('dj','Muziek starten',0,-1.6,g=>{box(g,'#b598cc',0,.65,-2.7,2.5,1.2,.65);box(g,'#41384f',0,1.28,-2.7,2.6,.08,.75);for(const x of [-.7,.7]){cylinder(g,'#222031',x,1.34,-2.65,.3,.05);cylinder(g,'#e8bc81',x,1.38,-2.65,.07,.03);}for(let i=0;i<4;i++)box(g,'#f2cc84',-.2+i*.14,1.36,-2.7,.05,.03,.2);block(0,-2.7,2.6,.8);});
   for(const x of [-2.7,2.7]){box(scene,'#3d344c',x,.9,-2.8,.8,1.8,.65);for(const y of [.5,1.2]){const speaker=cylinder(scene,'#211e2d',x,y,-2.44,.25,.06);speaker.rotation.x=Math.PI/2;ball(scene,'#77618a',x,y,-2.37,.11);}block(x,-2.8,.85,.7);}
   cylinder(scene,'#f6d99d',0,2.75,-.8,.025,.5);discoBall=mesh(scene,new T.IcosahedronGeometry(.43,2),'#d4e8ea',0,2.32,-.8);discoBall.material.metalness=.65;discoBall.material.roughness=.22;
   for(let i=0;i<9;i++)ball(scene,['#f4cb83','#dcabdc','#ace0d7'][i%3],-3.4+i*.85,2.35,-3.35,.085);
   for(const x of [-3,3]){box(scene,'#c49ab6',x,.35,.5,.75,.6,2.2);box(scene,'#ad829d',x+Math.sign(x)*.3,.75,.5,.18,.65,2.2);block(x,.5,.8,2.2);}
  }else if(kind==='balzaal'){ballroom();
  }else if(kind==='foto'){studio();
  }else{
   box(scene,'#f8e6c4',-2.4,1.65,-3.35,1.5,1.5,.1);box(scene,'#b7dfe2',-2.4,1.65,-3.27,1.3,1.3,.05);box(scene,'#f8e6c4',-2.4,1.65,-3.2,.07,1.3,.05);
   station('aaien','Aaien',-2,.5,g=>{cylinder(g,'#c497b5',-2,.16,-1,.8,.25);cylinder(g,'#f1c4d3',-2,.3,-1,.64,.08);block(-2,-1,1.6,1.6);});
   station('water','Water geven',1,-1.65,g=>{box(g,'#b0c9c4',1,.07,-2.65,1.5,.08,.8);cylinder(g,'#8cb7cd',1,.22,-2.65,.38,.27);water=cylinder(g,'#a9e4ed',1,.36,-2.65,.31,.018);block(1,-2.65,1.5,.8);});
   station('spelen','Samen spelen',1.5,1,g=>{cylinder(g,'#c7dba4',2.45,.06,1.6,.8,.06);toy=ball(g,'#e6b563',2.45,.22,1.6,.16);for(const x of [2.1,2.8])cylinder(g,'#c69585',x,.7,-.6,.07,1.4);const hoop=mesh(g,new T.TorusGeometry(.43,.06,10,32),'#c5a6d6',2.45,.7,-.6);block(2.45,-.6,.9,.3);});
   box(scene,'#c7a586',0,1,-3.1,1.1,1.8,.45);for(let i=0;i<3;i++){box(scene,'#f3dcb7',0,.35+i*.55,-2.82,1.15,.07,.55);for(const x of [-.3,.3])ball(scene,['#dca1bb','#c4b0db','#c8d599'][i],x,.53+i*.55,-2.8,.16);}block(0,-3,1.2,.6);
   petModel();
  }
  marker=mesh(scene,new T.RingGeometry(.18,.24,32),'#f2d287',0,.1,0);marker.rotation.x=-Math.PI/2;marker.visible=false;avatar=Avatar3D.create();scene.add(avatar.root);
 }
 function walkable(x,z){return (kind!=='foto'||z>=-1.25)&&x>=-3.7&&x<=3.7&&z>=-3.15&&z<=3.1&&!obstacles.some(o=>Math.abs(x-o.x)<o.w/2&&Math.abs(z-o.z)<o.d/2);}
 function route(to){
  const cell=p=>[Math.round(p.x/step),Math.round(p.z/step)],key=([x,z])=>x+','+z,start=cell(pos),end=cell(to),queue=[start],parents=new Map([[key(start),null]]);let found=null;
  for(let n=0;n<queue.length;n++){const a=queue[n];if(key(a)===key(end)){found=a;break;}for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const b=[a[0]+dx,a[1]+dz],k=key(b);if(!parents.has(k)&&walkable(b[0]*step,b[1]*step)){parents.set(k,a);queue.push(b);}}}
  if(!found)return [];const result=[];while(parents.get(key(found))){result.unshift({x:found[0]*step,z:found[1]*step});found=parents.get(key(found));}return result;
 }
 function go(point,id=null){if(locked||lost)return;if(!walkable(point.x,point.z))return;path=route(point);pending=path.length?id:null;marker.position.set(point.x,.18,point.z);marker.visible=!!path.length;status.textContent=id?'Onderweg naar '+stations.find(s=>s.id===id).name.toLowerCase():'Tik op een plek om te lopen';if(!path.length&&Math.hypot(pos.x-point.x,pos.z-point.z)<.4&&id)callbacks.action(id);}
 function pointer(e){if(locked||lost||e.button>0)return;const rect=host.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);
  for(const hit of ray.intersectObjects(targets,true)){let node=hit.object;while(node&&!node.userData.station)node=node.parent;if(node){const s=stations.find(s=>s.id===node.userData.station);go(s,s.id);return;}}
  const p=new T.Vector3();if(ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),0),p))go(p);
 }
 function resize(){if(!host||!renderer)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);const aspect=w/h,half=Math.max(5,5.4/aspect);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();if(typeof MobilePlayfield!=='undefined')MobilePlayfield.fit(camera);}
 function tick(now){if(!active)return;frame=requestAnimationFrame(tick);if(lost||document.hidden){last=now;return;}const dt=Math.min(.05,(now-last)/1000||0);last=now;let moving=false;
  if(!paused&&path.length){const next=path[0],dx=next.x-pos.x,dz=next.z-pos.z,d=Math.hypot(dx,dz),distance=dt*2.8;moving=true;if(d<=distance){pos={...next};path.shift();}else{pos.x+=dx/d*distance;pos.z+=dz/d*distance;}}
  if(!paused){actionTime=Math.max(0,actionTime-dt);danceTime=Math.max(0,danceTime-dt);}
  const dancing=danceTime>0&&!paused,working=actionTime>0&&!paused;
  const appearance=kind==='knuffel'?{...profile,outfit:{...profile.outfit,pet:undefined}}:profile;
  avatar.update(appearance,new T.Vector3(pos.x,dancingRoom()||kind==='foto'?.1:.06,pos.z),{moving,working, dance:kind==='foto'&&locked?photoPose:dancing?dance:-1,now:paused?lastAnimation:now});if(!paused)lastAnimation=now;
  if((dancingRoom()||kind==='foto')&&locked)avatar.root.rotation.y=0;
  if(dancing&&dance===1)avatar.root.rotation.y+= (1-danceTime/.8)*Math.PI*2;
  if(kind==='disco'&&!paused){discoBall.rotation.y+=dt*.25;for(let i=0;i<tiles.length;i++){tiles[i].material.emissive.set(tiles[i].material.color);tiles[i].material.emissiveIntensity=dancing?.15+.12*Math.sin(now*.004+i):.025;}}
  if(kind==='knuffel'){
   petModel();if(pet.visible&&!paused){const target={x:pos.x+.65,z:pos.z+.25};if(working&&action==='water'){target.x=1;target.z=-2.12;}if(working&&action==='aaien'){target.x=-2;target.z=-.3;}if(working&&action==='spelen'){target.x=2.1+Math.sin(actionTime*3)*.4;target.z=1.6;}
    const dx=target.x-pet.position.x,dz=target.z-pet.position.z;pet.position.x+=dx*Math.min(1,dt*4);pet.position.z+=dz*Math.min(1,dt*4);pet.position.y=(working&&action==='aaien'?.35:.06)+(working&&action==='spelen'?Math.abs(Math.sin(actionTime*6))*.13:0);if(Math.hypot(dx,dz)>.04)pet.rotation.y=Math.atan2(dx,dz);if(working&&action==='aaien')pet.rotation.y=0;if(petTail)petTail.rotation.y=Math.sin(now*.012)*.35;toy.position.y=.22+(working&&action==='spelen'?Math.abs(Math.sin(actionTime*6))*.4:0);}
   if(action&&actionTime===0){const done=action;action=null;locked=false;status.textContent='Je vriendje is blij! Tik op een volgende speelplek.';callbacks.care(done);}
  }
  if(kind==='foto'&&action==='photo'&&actionTime===0){action=null;const data=capture();locked=false;status.textContent=data?'Je foto is klaar!':'De foto lukte niet. Probeer opnieuw.';if(data)callbacks.photo(data);}
  if(typeof MobilePlayfield!=='undefined')MobilePlayfield.frame(camera,avatar.root.position,host);renderer.render(scene,camera);
  if(!path.length){marker.visible=false;if(pending){const id=pending;pending=null;callbacks.action(id);}}
 }
 let lastAnimation=0;
 function show(p,room,element,cb){hide();profile=p;kind=room;callbacks=cb;host=element;status=document.querySelector('#activity-walk-status');pos={x:room==='foto'?1:0,z:2.5};decorGroups={};photoBackdrop=null;photoPose=-1;active=true;lost=false;locked=false;paused=false;path=[];pending=null;obstacles=[];stations=[];targets=[];petId=null;action=null;actionTime=0;danceTime=0;tiles.length=0;
  try{renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;host.prepend(renderer.domElement);camera=new T.OrthographicCamera(-6,6,6,-6,.1,100);camera.position.set(9,11,14);camera.lookAt(0,.4,0);build();host.addEventListener('pointerup',pointer);renderer.domElement.addEventListener('webglcontextlost',contextLost);renderer.domElement.addEventListener('webglcontextrestored',contextRestored);observer=new ResizeObserver(resize);observer.observe(host);resize();last=performance.now();frame=requestAnimationFrame(tick);return true;
  }catch(e){status.textContent='Het 3D-beeld kan niet starten. Ga terug naar het dorp en probeer opnieuw.';hide();return false;}
 }
 function contextLost(e){e.preventDefault();lost=true;paused=true;callbacks.pause();status.textContent='Het 3D-beeld herstelt…';}
 function contextRestored(){lost=false;paused=dancingRoom()&&locked;resize();status.textContent='Het beeld is terug. Je kunt weer verder.';}
 function visit(id){const s=stations.find(s=>s.id===id);if(s)go(s,id);}
 function care(id){if(locked||lost)return;action=id;status.textContent=id==='aaien'?'Even lekker aaien…':id==='water'?'Je vriendje drinkt wat water…':'Samen met de bal spelen!';actionTime=2;locked=true;path=[];pending=null;}
 function lock(value){locked=value;if(value){path=[];pending=null;}}
 function setPaused(value){if(lost&&!value)return false;paused=value;return true;}
 function pose(id){if(!paused){dance=id;danceTime=.8;}}
 function hide(){active=false;decorGroups={};photoBackdrop=null;cancelAnimationFrame(frame);observer?.disconnect();host?.removeEventListener('pointerup',pointer);avatar?.dispose();avatar=null;geometries.splice(0).forEach(g=>g.dispose());materials.splice(0).forEach(m=>m.dispose());if(renderer){renderer.domElement.removeEventListener('webglcontextlost',contextLost);renderer.domElement.removeEventListener('webglcontextrestored',contextRestored);renderer.domElement.remove();renderer.dispose();renderer.forceContextLoss();}renderer=null;scene=null;pet=null;}
 function debug(){return {ready:active&&!lost,lost,kind,locked,action,position:{...pos},path:[...path],stations:stations.map(s=>({...s})),avatar:avatar?.debug(),pet:petId,decor,photoPose,drawCalls:renderer?.info.render.calls,project:(x,y,z)=>{const q=new T.Vector3(x,y,z).project(camera),r=host.getBoundingClientRect();return {x:r.x+(q.x+1)*r.width/2,y:r.y+(1-q.y)*r.height/2};}};}
 function cancelCare(){action=null;actionTime=0;locked=false;path=[];pending=null;}
 return {show,hide,visit,care,setDecor,setPhotoPose,shoot,cancelCare,lock,setPaused,pose,debug};
})();

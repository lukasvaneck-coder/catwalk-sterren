/* Three.js view adapter. Rules and saved coordinates remain in KitchenRules.
   Avatar3D supplies the shared articulated dressed character. */
const Kitchen3D=(()=>{
  const T=THREE,R=KitchenRules;
  let renderer,scene,camera,host,profile,observer,avatar,ring,marker,itemGroup,signature='',lost=false;
  const centers={},tops={},bars={},steam={},targets={},materials=new Map();
  const pos=(x,z,y=0)=>new T.Vector3(x/100-5,y,z/100-3.5);
  const mat=color=>{if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.8}));return materials.get(color);};
  function mesh(g,geometry,color,x,y,z){const m=new T.Mesh(geometry,mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
  const box=(g,w,h,d,c,x=0,y=0,z=0)=>mesh(g,new T.BoxGeometry(w,h,d),c,x,y,z);
  const cyl=(g,r,h,c,x=0,y=0,z=0,r2=r)=>mesh(g,new T.CylinderGeometry(r,r2,h,24),c,x,y,z);
  const ball=(g,r,c,x=0,y=0,z=0)=>mesh(g,new T.SphereGeometry(r,16,10),c,x,y,z);
  function torus(g,r,t,c,x,y,z){const m=mesh(g,new T.TorusGeometry(r,t,8,32),c,x,y,z);m.rotation.x=Math.PI/2;return m;}
  function plate(g,x=0,y=0,z=0,dirty=false){cyl(g,.27,.035,dirty?'#bb9265':'#fff7dd',x,y,z);torus(g,.235,.018,'#abcac5',x,y+.022,z);if(dirty){ball(g,.05,'#9c633c',x+.07,y+.03,z);ball(g,.035,'#be7b48',x-.09,y+.03,z+.05);}}
  function pot(g,frying=false){cyl(g,.36,.045,'#263b43',0,.97,0);torus(g,.29,.025,'#dd9152',0,1,0);cyl(g,.27,frying?.09:.28,'#809eaa',0,frying?1.07:1.17,0);cyl(g,.238,.015,'#d6a34b',0,frying?1.12:1.32,0);if(frying)box(g,.4,.06,.09,'#374c57',.4,1.1,0);else{box(g,.18,.07,.09,'#334b56',-.33,1.22,0);box(g,.18,.07,.09,'#334b56',.33,1.22,0);}for(let i=0;i<3;i++)ball(g,.035,'#e6c37c',-.1+i*.1,frying?1.14:1.34,.07);}
  function produce(g,kind,chopped=false){
    if(chopped){for(let i=0;i<5;i++)box(g,.1,.07,.1,kind==='tomato'?'#e56c48':kind==='potato'?'#efca78':'#83a64d',Math.sin(i*2)*.18,.06,Math.cos(i*2)*.18);return;}
    if(kind==='potato'){const m=ball(g,.16,'#d7ae6e',0,.14,0);m.scale.set(1.25,.8,.9);ball(g,.02,'#aa8148',.08,.25,.04);}
    else if(kind==='tomato'||kind==='fruit'){ball(g,.16,kind==='tomato'?'#df624c':'#dc5b79',0,.15,0);for(let i=0;i<4;i++){const leaf=box(g,.15,.025,.045,'#5e8849',0,.3,0);leaf.rotation.y=i*Math.PI/2;}}
    else if(kind==='veg'){const carrot=mesh(g,new T.ConeGeometry(.1,.36,10),'#ee9b45',0,.18,0);carrot.rotation.z=-.5;box(g,.12,.12,.05,'#658e4d',-.1,.35,0);}
    else if(kind==='milk'){box(g,.21,.35,.2,'#f6f1db',0,.18,0);box(g,.22,.08,.21,'#86b9cd',0,.32,0);}
    else if(kind==='cheese'){const wedge=mesh(g,new T.CylinderGeometry(.2,.2,.12,3),'#efc959',0,.08,0);wedge.rotation.y=.4;}
    else if(kind==='spice'){cyl(g,.09,.22,'#e4be8a',0,.13,0);cyl(g,.095,.045,'#7c6752',0,.26,0);}
    else if(kind==='cone'){mesh(g,new T.ConeGeometry(.13,.3,12),'#d0a76c',0,.17,0).rotation.z=Math.PI;ball(g,.15,'#efb2b1',0,.37,0);}
    else if(kind==='dough'){cyl(g,.23,.06,'#edd2a0',0,.05,0);}
    else {box(g,.28,.08,.24,kind==='rice'?'#f3e7be':'#e5c65d',0,.06,0);for(let i=0;i<4;i++)cyl(g,.018,.12,'#fff1c6',-.09+i*.06,.12,0);}
  }
  function food(item,r){const g=new T.Group();if(item.id.startsWith('dish')){plate(g,0,.025,0,item.dirty);return g;}
    if(!item.id.startsWith('step')){produce(g,item.id);return g;}
    const step=+item.id.slice(4),plated=step===r.steps.length-2;
    if(plated)plate(g,0,.02,0);
    const kind=({fries:['potato','fries','tomato','fries'],pizza:['veg','pizza','pizza','pizza'],pasta:['tomato','pasta','sauce','pasta'],rice:['veg','rice','rice','rice'],ice:['fruit','cream','ice','cone']}[r.id]||[])[step];
    if(kind==='pizza'){cyl(g,.24,.045,'#e9bd73',0,.065,0);cyl(g,.21,.025,'#d67548',0,.1,0);for(let i=0;i<5;i++)ball(g,.035,'#a3b55f',Math.sin(i*2)*.15,.12,Math.cos(i*2)*.15);}
    else if(kind==='fries'){for(let i=0;i<6;i++){const f=box(g,.055,.055,.28,'#edbd55',-.12+i*.045,.1,Math.sin(i)*.03);f.rotation.y=(i%2?1:-1)*.25;}}
    else if(kind==='sauce'||kind==='cream'||kind==='ice'){cyl(g,.23,.14,'#8db5b8',0,.08,0);ball(g,.19,kind==='sauce'?'#d87049':'#edb7b3',0,.15,0);}
    else produce(g,kind,step===0);
    return g;
  }
  function counter(id){const g=new T.Group(),[x,z]=R.layout[id],v=pos(x+57,z+52);g.position.copy(v);scene.add(g);g.userData.station=id;centers[id]=v;tops[id]=.98;
    const island=id.startsWith('counter'),table=id==='serve';
    if(table){box(g,1.25,.12,.92,'#b58a57',0,.78,0);for(const xx of [-.48,.48])for(const zz of [-.32,.32])box(g,.09,.74,.09,'#826245',xx,.37,zz);box(g,.34,.025,.9,'#e8d4a1',0,.86,0);plate(g,-.3,.88,0);plate(g,.3,.88,0);tops[id]=.92;
      for(const xx of [-.55,.55]){box(g,.34,.08,.35,'#789b8a',xx,.37,.67);box(g,.34,.45,.07,'#789b8a',xx,.57,.84);for(const zz of [.56,.78])box(g,.05,.36,.05,'#5b7768',xx,.18,zz);}
    }else{box(g,island?1.28:1.1,.78,.92,island?'#bea277':'#87a89a',0,.43,0);box(g,island?1.36:1.18,.12,1.02,island?'#ddbd8a':'#f1e7cf',0,.88,0);box(g,.04,.6,.035,'#698c7b',0,.45,.48);for(const xx of [-.24,.24])box(g,.16,.035,.04,'#e9d7ae',xx,.63,.5);box(g,.95,.06,.8,'#5d7665',0,.06,0);}
    if(id==='cut'){box(g,.78,.045,.6,'#c4935f',0,.98,0);const knife=box(g,.36,.035,.07,'#d9e6e7',.1,1.03,-.06);knife.rotation.y=-.5;box(g,.15,.055,.08,'#475867',.3,1.04,-.16);produce(g,'tomato');g.children.slice(-5).forEach(m=>{m.position.y+=1.02;m.position.x-=.2;});}
    if(id==='boil'||id==='fry')pot(g,id==='fry');
    if(id==='oven'){box(g,.8,.5,.06,'#3f5864',0,.46,.49);box(g,.64,.32,.015,'#253f4f',0,.44,.53);box(g,.5,.04,.03,'#d3e0d9',0,.67,.55);for(const xx of [-.3,.3])cyl(g,.16,.025,'#4a6268',xx,.98,0);}
    if(id==='ice'){box(g,.66,.55,.57,'#b6d6cf',0,1.2,0);box(g,.48,.3,.05,'#5e9299',0,1.25,.31);box(g,.07,.2,.1,'#e9e3c9',0,1.2,.37);box(g,.5,.04,.3,'#719697',0,1,.28);}
    if(id==='mix'){cyl(g,.3,.2,'#9bbfc4',0,1.04,0,.17);cyl(g,.265,.015,'#e2c87c',0,1.15,0);const spoon=box(g,.04,.4,.05,'#976e48',.14,1.3,.02);spoon.rotation.z=-.4;}
    if(id==='plate'){box(g,.7,.025,.64,'#d4c5a0',0,.97,0);for(let i=0;i<3;i++)box(g,.03,.02,.38,'#8faaa7',-.38+i*.06,1,.05);}
    if(id==='rack'){for(let i=0;i<5;i++)plate(g,0,.98+i*.045,0);}
    if(id==='sink'){box(g,.76,.025,.57,'#6b939d',0,.96,0);box(g,.6,.03,.42,'#8fced5',0,.98,0);cyl(g,.035,.42,'#c6d9d6',0,1.15,-.3);const tap=torus(g,.12,.035,'#c6d9d6',0,1.36,-.2);tap.rotation.x=0;for(let i=0;i<3;i++)ball(g,.04,'#e6f7ee',-.16+i*.12,1.02,.04);}
    const bar=new T.Group();bar.position.set(0,1.7,0);const bg=box(bar,.65,.08,.02,'#304953');const fill=box(bar,.6,.045,.025,'#a7ce76');fill.position.z=.02;bar.visible=false;scene.add(bar);bar.position.add(v);bars[id]={group:bar,fill};
    const vapour=new T.Group();for(let i=0;i<3;i++){const s=ball(vapour,.07,'#eef0dc',-.14+i*.14,0,0);s.material=new T.MeshBasicMaterial({color:'#f5f0d8',transparent:true,opacity:.55,depthWrite:false});}scene.add(vapour);vapour.position.copy(v).add(new T.Vector3(0,1.55,0));vapour.visible=false;steam[id]=vapour;
  }
  function makeScene(){scene=new T.Scene();scene.background=new T.Color('#c9ddcf');scene.add(new T.HemisphereLight('#fff4da','#76968c',2.1));const sun=new T.DirectionalLight('#fff2d2',3.2);sun.position.set(-3,10,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:.5,far:30});sun.shadow.bias=-.001;sun.shadow.normalBias=.025;scene.add(sun);
    box(scene,10.6,.28,7.5,'#7f9c87',0,-.17,0);
    for(let parity=0;parity<2;parity++){const tiles=new T.InstancedMesh(new T.BoxGeometry(.5,.035,.5),mat(parity?'#e6dbc0':'#f5ebd4'),140);let n=0;for(let x=0;x<20;x++)for(let z=0;z<14;z++)if((x+z)%2===parity)tiles.setMatrixAt(n++,new T.Matrix4().makeTranslation(-4.75+x*.5,0,-3.25+z*.5));tiles.receiveShadow=true;scene.add(tiles);}
    box(scene,10.6,1.55,.18,'#9ab9a5',0,.65,-3.65);box(scene,.18,.7,7.3,'#9ab9a5',-5.25,.25,0);box(scene,10.6,.12,.23,'#d6e0c4',0,1.45,-3.65);
    // Window, shelves and plants give the home kitchen a recognisable silhouette.
    box(scene,1.5,.95,.09,'#e7e9ca',2.6,.93,-3.51);box(scene,1.28,.75,.06,'#9ed1da',2.6,.93,-3.44);box(scene,.05,.8,.08,'#f4efd7',2.6,.93,-3.38);box(scene,1.32,.05,.08,'#f4efd7',2.6,.93,-3.38);
    for(const x of [-4.7,4.6]){cyl(scene,.22,.28,'#c38d68',x,.16,-3.04);for(let i=0;i<5;i++){const leaf=ball(scene,.17,'#6f9c61',x+Math.sin(i*2)*.16,.48+i*.035,-3.04+Math.cos(i*2)*.12);leaf.scale.set(.6,1.4,.7);}}
    Object.keys(R.stations).forEach(counter);
    const pantry=new T.Group();pantry.position.copy(pos(77,370));scene.add(pantry);pantry.userData.station='pantry';centers.pantry=pantry.position;tops.pantry=.8;
    box(pantry,.8,1.55,.7,'#ae8558',0,.78,0);for(let i=0;i<3;i++){box(pantry,.86,.07,.82,'#dcc08e',0,.25+i*.48,.05);box(pantry,.86,.12,.08,'#8a6849',0,.33+i*.48,.43);}
    avatar=Avatar3D.create();scene.add(avatar.root);
    ring=torus(scene,.24,.025,'#f0bf62',0,.04,0);ring.castShadow=false;
    marker=torus(scene,.18,.025,'#ffffff',0,.04,0);marker.visible=false;
    itemGroup=new T.Group();scene.add(itemGroup);
  }
  function ensure(){if(renderer)return;renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.domElement.setAttribute('aria-label','3D-thuiskeuken met werkplekken en je eigen poppetje');renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;if(host)host.dataset.contextLost='true';});renderer.domElement.addEventListener('webglcontextrestored',()=>{lost=false;if(host)delete host.dataset.contextLost;resize();});camera=new T.OrthographicCamera(-7,7,5,-5,.1,80);camera.position.set(10,13,16);camera.lookAt(0,.3,0);makeScene();}
  function resize(){if(!host||!renderer)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.updateMatrixWorld();const points=[];for(const x of [-5.5,5.5])for(const y of [0,1.65])for(const z of [-3.85,3.9])points.push(new T.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));const minX=Math.min(...points.map(v=>v.x)),maxX=Math.max(...points.map(v=>v.x)),minY=Math.min(...points.map(v=>v.y)),maxY=Math.max(...points.map(v=>v.y));let vw=(maxX-minX)*1.04,vh=(maxY-minY)*1.06;if(vw/vh<w/h)vw=vh*w/h;else vh=vw*h/w;const cx=(minX+maxX)/2,cy=(minY+maxY)/2;Object.assign(camera,{left:cx-vw/2,right:cx+vw/2,top:cy+vh/2,bottom:cy-vh/2});camera.updateProjectionMatrix();if(typeof MobilePlayfield!=='undefined')MobilePlayfield.fit(camera);}
  function attach(el,p){host=el;profile=p;try{ensure();avatar.reset();host.appendChild(renderer.domElement);observer?.disconnect();observer=new ResizeObserver(resize);observer.observe(host);resize();signature='';return true;}catch(e){host.textContent='3D kan hier niet starten. Probeer een browser met WebGL.';host.dataset.error='true';return false;}}
  function detach(){observer?.disconnect();host=null;}
  function project(v){const n=v.clone().project(camera);return {x:(n.x+1)/2,y:(1-n.y)/2};}
  function overlay(selector,v,w=42,h=38){const el=host?.parentElement.querySelector(selector);if(!el)return;const p=project(v);el.style.left=p.x*100+'%';el.style.top=p.y*100+'%';el.style.width=w+'px';el.style.height=h+'px';}
  function refreshItems(){const r=R.recipes.find(v=>v.id===profile.kitchen.active?.id),items=R.allItems(profile),sig=JSON.stringify(items);if(signature===sig)return;signature=sig;
    itemGroup.traverse(o=>{o.geometry?.dispose();});itemGroup.clear();for(const key of Object.keys(targets))delete targets[key];
    const counts={};for(const item of items){const g=food(item,r),at=item.at,i=counts[at]||0;counts[at]=i+1;g.userData.item=item.id;g.userData.source=item.at;
      if(at==='hands'){g.userData.held=true;g.scale.setScalar(.85);}
      else if(at==='pantry')g.position.copy(centers.pantry).add(new T.Vector3(0,.33+i*.42,.42));
      else {const c=centers[at];if(!c)continue;const total=items.filter(v=>v.at===at).length;g.position.copy(c).add(new T.Vector3((i-(total-1)/2)*.35,tops[at]+.13,.18));g.scale.setScalar(.85);}
      itemGroup.add(g);targets[item.id]=g;
    }
  }
  function update(p,state){if(!host||lost||!renderer)return;profile=p;
    refreshItems();const t=performance.now()/1000,v=pos(p.kitchen.pos.x,p.kitchen.pos.y,.04);avatar.update(p,v,{moving:state.moving,working:state.working,carrying:!!R.held(p)});ring.position.copy(v);ring.position.y=.045;marker.visible=!!state.target;if(state.target){marker.position.copy(pos(state.target.x,state.target.y,.04));}
    itemGroup.children.forEach(g=>{if(g.userData.held){g.position.copy(avatar.handPoint());g.rotation.y=avatar.root.rotation.y;}});
    for(const id of Object.keys(centers)){overlay(`[data-station="${id}"]`,centers[id].clone().add(new T.Vector3(0,tops[id]-.6,.42)),Math.max(30,host.clientWidth*.05),Math.max(28,host.clientHeight*.07));}
    for(const [id,g] of Object.entries(targets)){overlay(`[data-pick="${id}"]`,g.position.clone().add(new T.Vector3(0,.2,0)),28,28);}
    const a=p.kitchen.active,r=R.recipes.find(v=>v.id===a?.id);for(const id of Object.keys(bars)){let value=null;const job=a&&Object.keys(a.jobs).find(i=>r.steps[i][0]===id);if(job!==undefined&&job!==null)value=1-a.jobs[job]/R.duration(r,+job);else if(state.working===id){const i=R.taskAt(p,id);value=id==='sink'?p.kitchen.wash/3:i>=0?(a.work[i]||0)/R.duration(r,i):null;}
      bars[id].group.visible=value!==null;if(value!==null){bars[id].group.quaternion.copy(camera.quaternion);bars[id].fill.scale.x=Math.max(.01,value);bars[id].fill.position.x=-(1-value)*.3;}
      steam[id].visible=job!==undefined&&job!==null;steam[id].children.forEach((m,i)=>{m.position.y=((t*.45+i*.2)%1)*.6;m.material.opacity=.5*(1-m.position.y/.6);});
    }
    if(typeof MobilePlayfield!=='undefined')MobilePlayfield.frame(camera,avatar.root.position,host);renderer.render(scene,camera);
  }
  function hitTest(clientX,clientY){if(!host||lost)return null;const b=host.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((clientX-b.left)/b.width*2-1,-(clientY-b.top)/b.height*2+1),camera);for(const hit of ray.intersectObjects(scene.children,true)){for(let o=hit.object;o;o=o.parent){if(o.userData.item&&o.userData.source!=='hands')return {station:o.userData.source,item:o.userData.item};if(o.userData.station)return {station:o.userData.station};}}return null;}
  function floorPoint(clientX,clientY){if(!host||!camera)return null;const b=host.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((clientX-b.left)/b.width*2-1,-(clientY-b.top)/b.height*2+1),camera);const hit=new T.Vector3();if(!ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),0),hit))return null;return {x:(hit.x+5)*100,y:(hit.z+3.5)*100};}
  function direction(dx,dy){const angle=Math.atan2(10,16);return {x:dx*Math.cos(angle)+dy*Math.sin(angle),y:-dx*Math.sin(angle)+dy*Math.cos(angle)};}
  function debug(){return {webgl:!!renderer,contextLost:lost,meshes:scene?.children.length,avatarReady:avatar?.debug().ready,avatar:avatar?.debug(),camera:camera?.type,drawCalls:renderer?.info.render.calls,textures:renderer?.info.memory.textures};}
  return {attach,detach,update,hitTest,floorPoint,direction,debug};
})();

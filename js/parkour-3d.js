/* 3D view of ParkourRules. All collisions, clocks and rewards stay in the rules. */
const Parkour3D=(()=>{
 const T=THREE,S=.01;
 let renderer,scene,camera,canvas,actors=[],cars=[],flags=[],rain,ring,state,lost=false,observer,previous=[],last=0;
 const geometry=new Set(),materials=new Map();
 const mat=c=>{if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c,roughness:.85}));return materials.get(c);};
 function shape(g,geo,c,x,y,z,sx=1,sy=1,sz=1){geometry.add(geo);const m=new T.Mesh(geo,mat(c));m.position.set(x,y,z);m.scale.set(sx,sy,sz);g.add(m);return m;}
 const box=(g,c,x,y,z,w,h,d)=>shape(g,new T.BoxGeometry(w,h,d),c,x,y,z);
 const cyl=(g,c,x,y,z,r,h)=>shape(g,new T.CylinderGeometry(r,r,h,12),c,x,y,z);
 const ball=(g,c,x,y,z,r)=>shape(g,new T.SphereGeometry(r,12,8),c,x,y,z);
 function batchScenery(){
  const groups=new Map();scene.updateMatrixWorld(true);
  for(const mesh of [...scene.children].filter(o=>o.isMesh)){
   if(!groups.has(mesh.material))groups.set(mesh.material,{p:[],n:[]});const out=groups.get(mesh.material),g=mesh.geometry,p=g.attributes.position,n=g.attributes.normal,index=g.index,normal=new T.Matrix3().getNormalMatrix(mesh.matrixWorld),v=new T.Vector3();
   for(let k=0;k<(index?index.count:p.count);k++){const i=index?index.getX(k):k;v.fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld);out.p.push(v.x,v.y,v.z);v.fromBufferAttribute(n,i).applyNormalMatrix(normal);out.n.push(v.x,v.y,v.z);}
   mesh.removeFromParent();geometry.delete(g);g.dispose();
  }
  for(const [material,data] of groups){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(data.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(data.n,3));g.computeBoundingSphere();geometry.add(g);scene.add(new T.Mesh(g,material));}
 }
 function tree(x,z){cyl(scene,'#947557',x,.35,z,.1,.7);ball(scene,'#84af7c',x,.9,z,.42);ball(scene,'#a1c78a',x,1.18,z,.3);}
 function building(x,z,color){box(scene,color,x,.65,z,1.8,1.3,1);box(scene,'#9c7d92',x,1.35,z,2,.18,1.15);box(scene,'#faf0db',x,.45,z+.52,.45,.9,.06);for(const dx of [-.55,.55]){box(scene,'#faf0db',x+dx,.83,z+.53,.4,.45,.06);box(scene,'#9bd0db',x+dx,.83,z+.57,.3,.34,.03);}}
 function car(c){const g=new T.Group();box(g,c,0,.22,0,.72,.34,1.1);box(g,c,0,.48,.05,.62,.3,.57);box(g,'#b9e2ef',0,.5,.35,.53,.19,.025);box(g,'#b9e2ef',0,.5,-.25,.53,.19,.025);for(const x of [-.37,.37])for(const z of [-.34,.34]){const wheel=cyl(g,'#4b4b59',x,.15,z,.14,.09);wheel.rotation.z=Math.PI/2;}for(const x of [-.23,.23])box(g,'#fff4bf',x,.25,.56,.13,.1,.02);scene.add(g);return g;}
 function build(s,profiles){
  state=s;scene=new T.Scene();scene.background=new T.Color(s.course.id==='rain'?'#c1d4d8':'#dcebd1');scene.add(new T.HemisphereLight('#fff5df','#73856d',2.5));const sun=new T.DirectionalLight('#fff',2.1);sun.position.set(-3,9,5);scene.add(sun);
  const length=s.course.length*S,height=s.course.height*S,id=s.course.id;
  box(scene,id==='rain'?'#9eb99b':'#afd18f',length/2,-.09,height/2,length+3,.15,height+3);
  if(id==='gym'){
   box(scene,'#f2dfb6',length/2,.005,height/2,length,.035,height);
   for(const w of s.walls){box(scene,'#749c68',(w.x+w.w/2)*S,.14,(w.y+w.h/2)*S,(w.w-2)*S,.28,(w.h-2)*S);box(scene,'#99bb7c',(w.x+w.w/2)*S,.31,(w.y+w.h/2)*S,(w.w-6)*S,.06,(w.h-6)*S);}
  }else if(id!=='tag'){
   box(scene,id==='rain'?'#c5cbd2':'#efdab7',length/2,.005,2.95,length,.04,3.5);
   for(let x=0;x<length;x+=.65)box(scene,'#faf4dc',x,.031,2.85,.33,.012,.035);
  }
  for(let x=.3;x<length;x+=2.4){tree(x,-.55);if(id!=='gym')tree(x+.8,height+.6);}
  if(id==='school'){building(s.finish.x*S,-.35,'#dca0a1');box(scene,'#c8b88b',s.finish.x*S,1.62,-.35,.7,.4,.7);ball(scene,'#fff4d8',s.finish.x*S,1.65,.02,.17);}
  if(id==='rain')building(s.finish.x*S,-.35,'#e8c98f');
  if(id==='gym')building(s.finish.x*S,height+.75,'#a9b9d8');
  if(id==='dad')for(let x=1;x<length;x+=4){box(scene,'#b3937e',x,.32,.5,1.5,.14,.45);for(const dx of [-.5,.5])box(scene,'#b3937e',x+dx,.15,.5,.1,.3,.3);}
  cars=[];
  s.obstacles.forEach((o,i)=>{
   const x=(o.x+o.w/2)*S,z=(o.y+o.h/2)*S;
   if(o.kind==='road'){
    box(scene,'#747f8c',x,.035,height/2,o.w*S,.03,height+1.2);
    for(let z=2.35;z<3.5;z+=.2)box(scene,'#fff8e8',x,.06,z,(o.w-8)*S,.02,.1);
    cars.push({index:i,mesh:car(i?'#c78fb8':'#e6a06d')});
    for(const side of [-1,1]){cyl(scene,'#5d626b',x+side*.65,.47,2.15,.035,.9);box(scene,'#f3dc8f',x+side*.65,.94,2.15,.25,.27,.07);}
   }else if(o.kind==='puddle'){
    const puddle=cyl(scene,'#76adc9',x,.04,z,1,.025);puddle.scale.set(o.w*S/2,1,o.h*S/2);
    const shine=cyl(scene,'#b5d9e2',x-.09,.056,z-.1,1,.005);shine.scale.set(o.w*S*.25,1,o.h*S*.25);
   }else{
    for(const dz of [-o.h*S/2,o.h*S/2]){box(scene,'#ae8961',x,.26,z+dz,.09,.52,.09);box(scene,'#ae8961',x,.07,z+dz,o.w*S,.1,.12);}
    for(const y of [.21,.43])box(scene,'#f1e2bc',x,y,z,.1,.09,o.h*S);
   }
  });
  flags=s.flags.map((f,i)=>{const g=new T.Group();g.position.set(f.x*S,0,f.y*S);scene.add(g);cyl(g,'#a49070',0,.43,0,.025,.85);const flag=box(g,'#d7c7eb',.14,.74,0,.28,.2,.035);const base=cyl(g,'#e5c378',0,.035,0,.25,.04);return {g,flag,base};});
  const fx=s.finish.x*S,fz=s.finish.y*S;
  for(let x=-.2;x<.2;x+=.1)for(let z=-.35;z<.35;z+=.1)box(scene,(Math.round(x*10)+Math.round(z*10))%2?'#fff9e8':'#6d5e80',fx+x,.04,fz+z,.1,.02,.1);
  for(const z of [fz-.55,fz+.55])cyl(scene,'#a99474',fx,.75,z,.035,1.5);
  box(scene,'#b99bd5',fx,1.47,fz,.08,.18,1.15);
  batchScenery();
  ring=shape(scene,new T.RingGeometry(.19,.25,24),'#986ac4',0,.065,0);ring.rotation.x=-Math.PI/2;
  actors=profiles.map(p=>{const doll=Avatar3D.create();doll.root.scale.setScalar(.65);scene.add(doll.root);return {doll,profile:p};});
  if(id==='rain'){
   const a=new Float32Array(240*3);for(let i=0;i<240;i++){a[i*3]=(i*1.37)%10-5;a[i*3+1]=(i*.23)%5;a[i*3+2]=(i*.79)%8-4;}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(a,3));geometry.add(geo);const m=new T.PointsMaterial({color:'#e4f3fa',size:.035,transparent:true,opacity:.65});materials.set('rain',m);rain=new T.Points(geo,m);scene.add(rain);
  }
 }
 function mount(el,s,profiles,onLost){dispose();canvas=el;lost=false;previous=[];
  try{renderer=new T.WebGLRenderer({canvas:el,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;camera=new T.OrthographicCamera(-5,5,4,-4,.1,80);build(s,profiles);observer=new ResizeObserver(resize);observer.observe(el);resize();const mounted=renderer;
   el.addEventListener('webglcontextlost',e=>{e.preventDefault();if(renderer!==mounted)return;lost=true;onLost();});el.addEventListener('webglcontextrestored',()=>{if(renderer!==mounted)return;lost=false;resize();});return true;
  }catch(e){dispose();return false;}
 }
 function resize(){if(!renderer||!canvas)return;const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);const aspect=w/h,half=Math.max(3,2.6/aspect);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();}
 function draw(s,now=performance.now()){
  if(!renderer||lost)return;state=s;last=now;const x=s.player.x*S,z=s.player.y*S;
  camera.position.set(x,9,z+7);camera.lookAt(x,0,z);
  const runners=[s.player,...s.npcs];actors.forEach((a,i)=>{const p=runners[i],prev=previous[i],moving=!!prev&&Math.hypot(p.x-prev.x,p.y-prev.y)>.001,hop=i===0&&s.jump>0?Math.sin((.8-s.jump)/.8*Math.PI)*.6:0;
   a.doll.update(a.profile,new T.Vector3(p.x*S,.055+hop,p.y*S),{moving,now});a.doll.root.visible=!(i===0&&s.immune>0&&Math.floor(s.time*10)%3===0);previous[i]={x:p.x,y:p.y};
  });ring.position.set(x,.065,z);
  for(const c of cars){const p=ParkourRules.carAt(s,c.index);c.mesh.position.set((p.x+p.w/2)*S,0,(p.y+p.h/2)*S);}
  flags.forEach((f,i)=>{f.g.visible=i>=s.checkpoint;f.flag.material=mat(i===s.checkpoint?'#f0c354':'#bda4d3');});
  if(rain){rain.position.set(x,0,z);const a=rain.geometry.attributes.position;for(let i=0;i<a.count;i++)a.setY(i,5-((s.time*3+i*.23)%5));a.needsUpdate=true;}
  renderer.render(scene,camera);
 }
 function dispose(){observer?.disconnect();actors.forEach(a=>a.doll.dispose());actors=[];geometry.forEach(g=>g.dispose());geometry.clear();materials.forEach(m=>m.dispose());materials.clear();const old=renderer;renderer=null;old?.dispose();old?.forceContextLoss();scene=null;rain=null;state=null;}
 function debug(){return {ready:!!renderer&&!lost,lost,course:state?.course.id,actors:actors.map(a=>a.doll.debug()),cars:cars.map(c=>c.mesh.position.toArray()),flagsVisible:flags.filter(f=>f.g.visible).length,camera:camera?.position.toArray(),drawCalls:renderer?.info.render.calls};}
 return {mount,draw,resize,dispose,debug};
})();

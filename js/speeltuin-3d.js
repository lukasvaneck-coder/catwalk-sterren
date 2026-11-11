/* 3D rendering and screen picking for all playground rule states. */
const Speeltuin3D=(()=>{
 const T=THREE,colors=['#ed99bc','#e7c46c','#89c8b3','#91b8df','#b79ad7','#e8ab7a'];
 let renderer,scene,camera,canvas,observer,profile,state,avatar,people=[],objects=[],stars=[],walls=[],letters=[],pickables=[],poolTarget,parent,held,aimRing,rainBalls=[],phase='',lost=false,aim={x:0,d:.52};
 const geos=new Set(),mats=new Map(),textures=new Set();let flightOrigins=new WeakMap();
 const mat=c=>{if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.8}));return mats.get(c);};
 function mesh(g,geo,color,x=0,y=0,z=0){geos.add(geo);const m=new T.Mesh(geo,mat(color));m.position.set(x,y,z);g.add(m);return m;}
 const box=(g,c,x,y,z,w,h,d)=>mesh(g,new T.BoxGeometry(w,h,d),c,x,y,z);
 const ball=(g,c,x,y,z,r)=>mesh(g,new T.SphereGeometry(r,14,10),c,x,y,z);
 const cyl=(g,c,x,y,z,r,h)=>mesh(g,new T.CylinderGeometry(r,r,h,16),c,x,y,z);
 function star(){const shape=new T.Shape();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?.095:.22;const x=Math.cos(a)*r,y=-Math.sin(a)*r;if(i)shape.lineTo(x,y);else shape.moveTo(x,y);}shape.closePath();return new T.ExtrudeGeometry(shape,{depth:.07,bevelEnabled:false});}
 function makeStar(){return mesh(scene,star(),'#efc659');}
 function doll(p,scale=.55){const d=Avatar3D.create();d.root.scale.setScalar(scale);scene.add(d.root);return {d,p};}
 function clear(){avatar?.d.dispose();people.forEach(a=>a.d.dispose());people=[];geos.forEach(g=>g.dispose());geos.clear();mats.forEach(m=>m.dispose());mats.clear();textures.forEach(t=>t.dispose());textures.clear();objects=[];stars=[];walls=[];letters=[];pickables=[];poolTarget=null;parent=null;held=null;aimRing=null;rainBalls=[];flightOrigins=new WeakMap();}
 function hall(length=12){
  box(scene,'#d8ccb5',length/2,-.12,0,length+3,.2,6);box(scene,'#e8dec9',length/2,.005,0,length+2,.035,5);
  box(scene,'#bfd6cf',length/2,2,-2.5,length+3,4,.15);
  for(let x=0;x<length;x+=3){box(scene,colors[Math.floor(x/3)%6],x,1,-2.38,.3,2,.18);box(scene,'#edf7ed',x+1,2.2,-2.39,1.25,1.35,.12);box(scene,'#a9d0da',x+1,2.2,-2.3,1.06,1.15,.04);}
 }
 function tile(ch,x,y,z){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.fillStyle='#fff5d9';g.fillRect(0,0,128,128);g.fillStyle='#664b83';g.font='bold 92px sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(ch,64,69);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;textures.add(tex);const m=new T.MeshStandardMaterial({map:tex,roughness:1});mats.set('letter'+ch+textures.size,m);const geo=new T.PlaneGeometry(.52,.52);geos.add(geo);const node=new T.Mesh(geo,m);node.position.set(x,y,z);node.rotation.x=-Math.PI/2;scene.add(node);return node;}
 const level=(s,r)=>.25+(s.rows-1-r)*.12;
 function build(s){
  clear();phase=s.game==='klimrek'?(s.slide?'slide':'maze'):s.game;scene=new T.Scene();scene.background=new T.Color('#dcebe3');scene.add(new T.HemisphereLight('#fff5e2','#899a8c',2.5));const sun=new T.DirectionalLight('#fff',2);sun.position.set(-4,7,8);scene.add(sun);
  avatar=doll(profile,s.game==='trampoline'?.75:s.game==='ballenbak'?.8:phase==='maze'?.45:.55);
  if(phase==='springbaan'){
   hall(s.length/100);for(let x=0;x<s.length/100;x+=2)box(scene,colors[Math.floor(x/2)%6],x,.04,0,1.95,.06,1.5);
   objects=s.obstacles.map(o=>{const g=new T.Group();scene.add(g);if(o.kind==='bal')ball(g,'#c291d3',0,o.h/200,0,o.h/200);else if(o.kind==='kegel')mesh(g,new T.ConeGeometry(o.w/200,o.h/100,16),'#e9b368',0,o.h/200,0);else{box(g,o.kind==='toren'?'#94c6b4':'#dd9dbd',0,o.h/200,0,o.w/100,o.h/100,.7);box(g,'#f4dcb2',0,o.h/100+.02,0,o.w/100+.02,.04,.72);}return g;});stars=s.stars.map(makeStar);
   for(const z of [-1,1])cyl(scene,'#af94c4',s.length/100,.85,z,.08,1.7);box(scene,'#e8c777',s.length/100,1.7,0,.12,.22,2.1);
  }else if(phase==='trampoline'){
   hall(7.2);box(scene,'#a7a3af',3.6,.12,0,3.5,.18,2);box(scene,'#9b90bd',3.6,.25,0,3.35,.15,1.9);const bed=box(scene,'#4e626e',3.6,.34,0,3.05,.04,1.55);objects=[bed];for(const x of [1.9,5.3])for(const z of [-.9,.9]){cyl(scene,'#9abbb4',x,.9,z,.045,1.8);ball(scene,'#e4bbcf',x,1.85,z,.1);}
   // Separate mesh for each spawned star, synchronised by identity below.
  }else if(phase==='maze'){
   box(scene,'#d2c5ad',s.cols/2,-.05,s.rows/2,s.cols+.5,.2,s.rows+.5);
   for(let r=0;r<s.rows;r++)for(let c=0;c<s.cols;c++){
    const y=level(s,r),floor=box(scene,colors[r%6],c+.5,y-.08,r+.5,.98,.16,.98);floor.userData.cell={c,r};pickables.push(floor);
    for(const [dir,x,z,w,d] of [['right',c+1,r+.5,.07,1],['down',c+.5,r+1,1,.07]]){const node=box(scene,'#eee2c9',x,y+.14,z,w,.28,d);walls.push({node,c,r,dir});}
    if(c===0)box(scene,'#eee2c9',0,y+.14,r+.5,.07,.28,1);if(r===0)box(scene,'#eee2c9',c+.5,y+.14,0,1,.28,.07);
   }
   for(const x of [0,s.cols])for(const z of [0,s.rows]){cyl(scene,'#b7a0cf',x,1,z,.055,2);ball(scene,'#efd28a',x,2.05,z,.09);}box(scene,'#b7a0cf',s.cols/2,2,0,s.cols,.08,.08);
   letters=s.letters.map(l=>tile(l.ch,l.c+.5,level(s,l.r)+.025,l.r+.5));
   box(scene,'#c799d0',s.exit.c+.5,level(s,0)+.04,.5,.8,.06,.8);cyl(scene,'#f2d483',s.exit.c+.8,level(s,0)+.45,.3,.035,.9);
  }else if(phase==='slide'){
   const sl=s.slide,len=sl.length/100;hall(len);const p=[],ix=[];for(let i=0;i<=sl.length;i+=20){const y=KlimrekRules.height(i,sl.length)/100+.18;for(const z of [-.65,.65])p.push(i/100,y,z);if(i<sl.length){const k=i/20*2;ix.push(k,k+1,k+2,k+1,k+3,k+2);}}
   const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setIndex(ix);geo.computeVertexNormals();mesh(scene,geo,'#e6b6c7');
   for(const z of [-.7,.7]){const pts=[];for(let x=0;x<=sl.length;x+=20)pts.push(new T.Vector3(x/100,KlimrekRules.height(x,sl.length)/100+.28,z));mesh(scene,new T.TubeGeometry(new T.CatmullRomCurve3(pts),Math.ceil(sl.length/20),.07,6,false),'#c096bc');}
   stars=sl.stars.map(makeStar);people=sl.boys.map((b,i)=>doll({look:{skin:['s1','s4','s2'][i%3],eyes:'e2',hairColor:['blond','zwart','rood'][i%3],build:45},outfit:{hair:'hair_kort',top:i%2?'top_tshirt_rood':'top_tshirt_groen',bottom:'bot_jeans',shoes:'sh_sneakers'}},.5));
  }else if(phase==='ballenbak'){
   box(scene,'#c3d7c4',0,-.07,-2.5,9,.14,9);box(scene,'#c9a7c9',0,.12,-2.7,7,.3,6);for(const x of [-3.6,3.6])box(scene,'#a69bc9',x,.4,-2.7,.25,.65,6.3);box(scene,'#a69bc9',0,.4,-5.85,7.4,.65,.25);box(scene,'#dab7c9',0,.24,.4,7.4,.3,.25);
   let seed=731;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};const geo=new T.SphereGeometry(.13,8,6);geos.add(geo);const dummy=new T.Object3D();for(let k=0;k<6;k++){const balls=new T.InstancedMesh(geo,mat(colors[k]),80);for(let i=0;i<80;i++){const n=i*6+k;dummy.position.set(rnd()*6.8-3.4,.25+rnd()*.1,-rnd()*5.9);dummy.updateMatrix();balls.setMatrixAt(i,dummy.matrix);}scene.add(balls);}
   poolTarget=new T.Group();scene.add(poolTarget);box(poolTarget,'#f5d675',0,.08,0,1.04,.16,1.1);for(const x of [-.52,.52])box(poolTarget,'#e7b765',x,.28,0,.08,.4,1.1);for(const z of [-.55,.55])box(poolTarget,'#e7b765',0,.28,z,1.04,.4,.08);
   const mama=s.parent==='mama';parent=doll({look:{skin:mama?'s2':'s3',eyes:'e1',hairColor:mama?'blond':'donker',build:60},outfit:mama?{hair:'hair_lang',top:'top_tshirt_rood',bottom:'bot_jeans'}:profile.parkour?.dadOutfit||{hair:'hair_kort',top:'top_tshirt_blauw',bottom:'bot_jeans'}},.85);people.push(parent);
   rainBalls=Array.from({length:24},(_,i)=>ball(scene,colors[i%6],0,0,0,.13));
   held=ball(scene,'#e4b75e',0,0,0,.13);aimRing=mesh(scene,new T.RingGeometry(.16,.21,24),'#fff1bb');aimRing.rotation.x=-Math.PI/2;
  }
  resize();
 }
 function mount(el,s,p,onLost){dispose();canvas=el;profile=p;state=s;lost=false;aim={x:0,d:.52};try{renderer=new T.WebGLRenderer({canvas:el,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;camera=new T.OrthographicCamera(-4,4,4,-4,.1,150);build(s);observer=new ResizeObserver(resize);observer.observe(el);resize();const current=renderer;el.addEventListener('webglcontextlost',e=>{e.preventDefault();if(renderer!==current)return;lost=true;onLost();});el.addEventListener('webglcontextrestored',()=>{if(renderer!==current)return;lost=false;resize();});return true;}catch(e){dispose();return false;}}
 function resize(){if(!renderer||!canvas)return;const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);const aspect=w/h,minWidth=phase==='maze'?state.cols+1.3:phase==='ballenbak'?8:5.4,half=Math.max(3.1,minWidth/2/aspect);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();}
 function setCamera(x,y,z,dx=0,dy=6,dz=10){camera.position.set(x+dx,y+dy,z+dz);camera.lookAt(x,y,z);}
 function syncStars(list,height){while(stars.length<list.length)stars.push(makeStar());stars.forEach((node,i)=>{const st=list[i];node.visible=!!st&&!st.got;if(st){node.position.set(st.x/100,height(st),0);node.rotation.y=Math.sin(state.time*2)*.3;}});}
 function draw(s,now=performance.now()){
  if(!renderer||lost)return;state=s;const next=s.game==='klimrek'?(s.slide?'slide':'maze'):s.game;if(next!==phase)build(s);
  if(phase==='springbaan'){
   const p=s.player;setCamera(p.x/100+1.4,1.4,0,0,3.5,10);avatar.d.update(profile,new T.Vector3(p.x/100,p.h/100+.08,0),{moving:s.countdown<=0&&!s.finished,now});avatar.d.root.rotation.y=Math.PI/2;avatar.d.root.visible=!(s.immune>0&&Math.floor(s.time*10)%3===0);objects.forEach((g,i)=>{const o=s.obstacles[i];g.position.x=o.x/100;if(o.kind==='bal')g.children[0].rotation.z=-o.x/30;});syncStars(s.stars,st=>st.h/100+.08);
  }else if(phase==='trampoline'){
   const p=s.player;setCamera(3.6,1.9,0,0,2.8,10);objects[0].position.y=.34-(s.dip>0?.09:0);avatar.d.update(profile,new T.Vector3(p.x/100,p.h/100+.37-(s.dip>0?.09:0),0),{now});syncStars(s.stars,st=>st.h/100+.37);
  }else if(phase==='maze'){
   const p=s.player,c=p.fc+(p.c-p.fc)*p.t,r=p.fr+(p.r-p.fr)*p.t;setCamera(s.cols/2,.3,s.rows/2,0,9,7);avatar.d.update(profile,new T.Vector3(c+.5,level(s,r),r+.5),{moving:p.t<1,now});walls.forEach(w=>w.node.visible=!KlimrekRules.isOpen(s,w.c,w.r,w.dir));letters.forEach((node,i)=>node.visible=!s.letters[i].got);
  }else if(phase==='slide'){
   const sl=s.slide,h=x=>KlimrekRules.height(x,sl.length)/100+.2;setCamera(sl.x/100+1.4,h(sl.x)+1,0,0,3.5,10);avatar.d.update(profile,new T.Vector3(sl.x/100,h(sl.x)+sl.z/100,0),{sitting:true,now});avatar.d.root.rotation.y=Math.PI/2;
   people.forEach((a,i)=>{const b=sl.boys[i],fly=b.fly?.t||0;a.d.root.visible=fly<1.2;a.d.update(a.p,new T.Vector3(b.x/100,h(b.x)+Math.sin(Math.min(1,fly)*Math.PI)*1.8,b.fly?b.fly.dir*fly*3:0),{moving:!b.fly,now});a.d.root.rotation.y=-Math.PI/2;});syncStars(sl.stars,st=>h(st.x)+st.z/100+.35);
  }else{
   setCamera(0,.5,-2.2,0,7,9);avatar.d.update(profile,new T.Vector3(0,.03,1.3),{working:s.cooldown>.4,now});avatar.d.root.rotation.y=Math.PI;
   poolTarget.position.set(BallenbakRules.bakX(s)*2.6,.32,-BallenbakRules.BB.bak.d*5);parent.d.update(parent.p,new T.Vector3(BallenbakRules.headX(s)*2.6,-.14,-BallenbakRules.BB.head.d*5),{now});parent.d.root.rotation.z=s.ouch>0?Math.sin(s.ouch*18)*.1:0;
   rainBalls.forEach((b,i)=>{b.visible=s.rain>0;b.position.set((i*1.77)%7-3.5,4-((s.time*3+i*.31)%4),-(i*.73)%5.5);});
   held.visible=BallenbakRules.canThrow(s);held.position.copy(avatar.d.handPoint());aimRing.position.set(aim.x*2.6,.46,-aim.d*5);
   while(objects.length<s.balls.length)objects.push(ball(scene,'#e9bd65',0,0,0,.13));objects.forEach((node,i)=>{const b=s.balls[i];node.visible=!!b;if(b){if(!flightOrigins.has(b))flightOrigins.set(b,avatar.d.handPoint().clone());const origin=flightOrigins.get(b),t=Math.min(1,b.t/b.dur),yEnd=b.d>.8?1.1:.65;node.position.set(origin.x*(1-t)+b.x*2.6*t,origin.y*(1-t)+yEnd*t+Math.sin(t*Math.PI)*2,origin.z*(1-t)-b.d*5*t);}});
  }
  renderer.render(scene,camera);
 }
 function ray(e){const r=canvas.getBoundingClientRect(),q=new T.Raycaster();q.setFromCamera(new T.Vector2((e.clientX-r.x)/r.width*2-1,-(e.clientY-r.y)/r.height*2+1),camera);return q;}
 function aimAt(e){const q=ray(e),p=new T.Vector3();if(parent&&q.intersectObject(parent.d.root,true).length){aim={x:BallenbakRules.headX(state),d:BallenbakRules.BB.head.d};return;}if(poolTarget&&q.intersectObject(poolTarget,true).length){aim={x:BallenbakRules.bakX(state),d:BallenbakRules.BB.bak.d};return;}if(q.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-.45),p)){aim={x:Math.max(-1.6,Math.min(1.6,p.x/2.6)),d:Math.max(0,Math.min(1.7,-p.z/5))};}}
 function press(s){return BallenbakRules.throwBall(s,aim.x,aim.d);}
 function bind(el,signal,getState,isPaused){let start=null;el.addEventListener('pointerdown',e=>{if(isPaused()||lost)return;const s=getState();if(s.game==='klimrek'&&s.phase==='slide'){e.preventDefault();KlimrekRules.press(s);return;}start={x:e.clientX,y:e.clientY,time:performance.now(),lastMove:performance.now()};el.setPointerCapture(e.pointerId);if(s.game==='ballenbak')aimAt(e);},{signal});
  el.addEventListener('pointermove',e=>{if(start&&!isPaused()&&getState().game==='ballenbak'){start.lastMove=performance.now();aimAt(e);}},{signal});
  el.addEventListener('pointerup',e=>{if(!start||isPaused()||lost){start=null;return;}const s=getState();if(s.game==='ballenbak'){aimAt(e);const dy=e.clientY-start.y;if(dy<-25&&performance.now()-start.lastMove<120){const speed=-dy/Math.max(.1,(performance.now()-start.time)/1000);aim.d=Math.min(1.7,aim.d+Math.min(.15,speed/8000));}press(s);}else if(s.phase==='maze'){
    const dx=e.clientX-start.x,dy=e.clientY-start.y;let vx=dx,vy=dy;if(Math.hypot(dx,dy)<18){const hit=ray(e).intersectObjects(pickables)[0];if(!hit){start=null;return;}vx=hit.object.userData.cell.c-s.player.c;vy=hit.object.userData.cell.r-s.player.r;}if(vx||vy)KlimrekRules.queue(s,Math.abs(vx)>Math.abs(vy)?vx>0?'right':'left':vy>0?'down':'up');
   }start=null;},{signal});el.addEventListener('pointercancel',()=>start=null,{signal});
 }
 function dispose(){observer?.disconnect();clear();const old=renderer;renderer=null;old?.dispose();old?.forceContextLoss();scene=null;}
 function project(x,y,z){const v=new T.Vector3(x,y,z).project(camera),r=canvas.getBoundingClientRect();return {x:r.x+(v.x+1)*r.width/2,y:r.y+(1-v.y)*r.height/2};}
 return {mount,draw,resize,dispose,bind,press,project,debug:()=>({ready:!!renderer&&!lost,lost,phase,avatar:avatar?.d.debug(),people:people.map(p=>p.d.debug()),drawCalls:renderer?.info.render.calls,aim:{...aim}})};
})();

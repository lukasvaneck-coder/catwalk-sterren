/* Render adapter for the existing village rules. Coordinates remain world pixels. */
const World3D=(()=>{
  const T=THREE,R=TownRules;
  let renderer,scene,camera,host,observer,avatar,lost=false,ring,marker,routeLine;
  const nodes={},npcs={},anchors=[],houseInstances=[],signs=[],cutaway=new Set(),materials=new Map(),boxGeo=new T.BoxGeometry(1,1,1),ballGeo=new T.SphereGeometry(1,12,8),cylGeo=new T.CylinderGeometry(1,1,1,16);
  const v=(x,y,height=0)=>new T.Vector3(x/100,height,y/100);
  const mat=c=>{if(!materials.has(c))materials.set(c,new T.MeshStandardMaterial({color:c,roughness:.85}));return materials.get(c);};
  function shape(g,geo,color,x,y,z,sx,sy,sz){const m=new T.Mesh(geo,mat(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);g.add(m);return m;}
  const box=(g,w,h,d,c,x=0,y=0,z=0)=>shape(g,boxGeo,c,x,y,z,w,h,d);
  const ball=(g,r,c,x=0,y=0,z=0)=>shape(g,ballGeo,c,x,y,z,r,r,r);
  const cyl=(g,r,h,c,x=0,y=0,z=0)=>shape(g,cylGeo,c,x,y,z,r,h,r);
  function icon(g,text,x,y,z,size=.65){const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#fff5db';ctx.beginPath();ctx.roundRect(6,6,116,116,28);ctx.fill();ctx.font='76px "Segoe UI Emoji",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#765a53';ctx.fillText(text,64,69);const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;const s=new T.Sprite(new T.SpriteMaterial({map,depthWrite:false}));s.position.set(x,y,z);s.scale.set(size,size,1);g.add(s);return s;}
  function building(root,h,i){
    const g=new T.Group(),w=h.w/100,d=(h.h-20)/100,height=1.25+(i%3)*.14;g.position.copy(v(h.x,h.y-20));g.userData.target={kind:'house',id:h.id};root.add(g);
    box(g,w+.12,.15,d+.12,'#c6b89d',0,.08,-d/2);box(g,w,height,d,VillageLandmarks.palettes[h.id][0],0,height/2+.14,-d/2);
    box(g,w+.15,.15,d+.15,'#fff0cf',0,height+.14,-d/2);
    // Two pitched roof planes, sized to stay over the same blocked footprint.
    const roofColor=VillageLandmarks.palettes[h.id][1],pitch=.38,half=w/2+.12;
    const flat=['foto','atelier','race','speeltuin'].includes(h.id);
    if(flat){box(g,w+.16,.16,d+.16,roofColor,0,height+.18,-d/2).userData.roof=true;}else if(h.id==='disco'){const dome=ball(g,1,roofColor,0,height+.12,-d/2);dome.scale.set(w*.55,.55,d*.55);dome.userData.roof=true;}else for(const side of [-1,1]){const roof=box(g,half/Math.cos(pitch),.13,d+.3,roofColor,side*half/2,height+.22+Math.sin(pitch)*half/2,-d/2);roof.rotation.z=-side*pitch;roof.userData.roof=true;}
    box(g,.5,.92,.06,'#fff0cf',0,.59,.035);box(g,.36,.82,.07,'#675a65',0,.56,.08);ball(g,.035,'#e6c567',.12,.55,.13);
    for(const x of [-w*.32,w*.32]){box(g,.48,.53,.06,'#ffefd3',x,.85,.035);box(g,.37,.41,.035,'#91cbd0',x,.85,.08);box(g,.035,.43,.04,'#ffefd3',x,.85,.105);box(g,.4,.035,.04,'#ffefd3',x,.85,.105);box(g,.58,.16,.2,'#bb8b68',x,.5,.1);for(const dx of [-.17,0,.17])ball(g,.08,['#f0b9ba','#f7dc8e','#aece87'][i%3],x+dx,.65,.12);}
    VillageLandmarks.build(g,h,height+(flat?.22:h.id==='disco'?.65:.42),{box,ball,cyl,shape,mat});
    const sign=icon(g,h.icon,0,1.27,.38,.38);signs.push({id:h.id,sign});
    if(['winkel','supermarkt','atelier'].includes(h.id))for(let k=0;k<6;k++){const awning=box(g,w/6,.1,.6,k%2?'#fff3d9':h.color,-w/2+w/12+k*w/6,1.15,.25);awning.rotation.x=.12;}
    if(h.id==='race'){for(let k=0;k<6;k++)box(g,.2,.2,.04,k%2?'#fff5e1':'#444859',-.5+k*.2,1.25,.11);}
    if(h.id==='balzaal'){for(const x of [-w*.43,w*.43]){cyl(g,.14,1.5,'#fff0d6',x,.85,.12);ball(g,.22,'#d8a4c2',x,1.68,.12);}}
    anchors.push({selector:`[data-house="${h.id}"]`,point:v(h.x,h.y,.35)});
  }
  function tree(root,x,z,size=1){const g=new T.Group();g.position.set(x,0,z);root.add(g);cyl(g,.09*size,.75*size,'#9a7859',0,.38*size,0);for(let i=0;i<3;i++)ball(g,(.38-i*.04)*size,(Math.floor(x+z)%4===0?['#dbaecb','#e9c2d7','#cc9dbb']:['#89ac96','#b6ceac','#759d87'])[i],Math.sin(i*3)*.18*size,(.85+i*.2)*size,Math.cos(i*3)*.14*size);}
  // Batch repeated static meshes by shared geometry/material, retaining raycast targets.
  function batch(root){root.updateMatrixWorld(true);const groups=new Map(),remove=[];root.traverse(m=>{if(!m.isMesh)return;const key=m.geometry.uuid+m.material.uuid;if(!groups.has(key))groups.set(key,[]);let owner=m;while(owner&&!owner.userData.target)owner=owner.parent;groups.get(key).push({m,target:owner?.userData.target});remove.push(m);});for(const entries of groups.values()){const first=entries[0].m,mesh=new T.InstancedMesh(first.geometry,first.material,entries.length);mesh.userData.targets=entries.map(e=>e.target);entries.forEach((e,i)=>{mesh.setMatrixAt(i,e.m.matrixWorld);if(e.target?.kind==='house')houseInstances.push({mesh,index:i,id:e.target.id,roof:!!e.m.userData.roof,matrix:e.m.matrixWorld.clone()});});scene.add(mesh);}remove.forEach(m=>m.removeFromParent());}
  function make(){
    renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=T.SRGBColorSpace;renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;});renderer.domElement.addEventListener('webglcontextrestored',()=>{lost=false;resize();});
    scene=new T.Scene();scene.background=new T.Color('#c1d5cd');scene.add(new T.HemisphereLight('#fff4de','#759778',2));const sun=new T.DirectionalLight('#fff2d4',2);sun.position.set(-8,18,10);scene.add(sun);
    camera=new T.OrthographicCamera(-6,6,5,-5,.1,100);
    const root=new T.Group();scene.add(root);box(root,R.WIDTH/100,.2,R.HEIGHT/100,'#b4cda7',R.WIDTH/200,-.13,R.HEIGHT/200);
    for(const [x,z,r,c] of [[7.8,6.2,4.4,'#cdd9b5'],[27,9.2,4.3,'#b5d4c0'],[8,19.2,4.2,'#b7d2b6'],[25,20,4.3,'#d0c5d4']]){const lawn=cyl(root,r,.015,c,x,-.015,z);lawn.scale.z=.67;}
    for(const points of R.PATHS)for(let i=1;i<points.length;i++){const a=v(...points[i-1]),b=v(...points[i]),d=a.distanceTo(b),mid=a.clone().add(b).multiplyScalar(.5);const edging=box(root,1.06,.018,d+1.06,'#d7bfa2',mid.x,-.002,mid.z);edging.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);const road=box(root,.95,.025,d+.95,'#f2e1c9',mid.x,.005,mid.z);road.rotation.y=Math.atan2(b.x-a.x,b.z-a.z);}
    const sx=R.SCALE,pond=cyl(root,1,.04,'#8fc9ce',R.POND.x/100,.025,R.POND.y/100);pond.scale.x=R.POND.rx/100;pond.scale.z=R.POND.ry/100;
    for(let i=0;i<26;i++){const a=i*Math.PI/13;ball(root,.16,'#d4d0ba',R.POND.x/100+Math.cos(a)*R.POND.rx/100*1.05,.04,R.POND.y/100+Math.sin(a)*R.POND.ry/100*1.05);}
    for(let i=0;i<19;i++)box(root,.25,.09,.8,i%2?'#b99c83':'#ddc6a0',R.POND.x/100-2.3+i*.26,.12,R.BRIDGE_Y/100);
    for(const z of [-.46,.46]){box(root,4.95,.055,.06,'#b19170',R.POND.x/100,.47,R.BRIDGE_Y/100+z);for(let i=0;i<6;i++)box(root,.07,.48,.07,'#b19170',R.POND.x/100-2.4+i*.96,.26,R.BRIDGE_Y/100+z);}
    const fx=R.FOUNTAIN.x/100,fz=R.FOUNTAIN.y/100;
    const fountain=cyl(root,.9*sx,.18,'#ddd1c4',fx,.09,fz);fountain.scale.z=.4;cyl(root,.65*sx,.05,'#8ac8cd',fx,.2,fz).scale.z=.5;cyl(root,.12,.7,'#ede1c2',fx,.5,fz);shape(root,VillageLandmarks.star,'#e8c98e',fx,1.05,fz,.3,.3,.3);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;ball(root,.045,'#d1efed',fx+Math.cos(a)*.4,.4+Math.sin(a)*.12,fz+Math.sin(a)*.2);}
    R.HOUSES.forEach((h,i)=>building(root,h,i));
    // Border trees never introduce invisible obstacles into the established routes.
    for(let x=.1;x<R.WIDTH/100;x+=1.15){tree(root,x,.15,.9);tree(root,x,R.HEIGHT/100-.15,.85);}for(let z=1.3;z<R.HEIGHT/100-1;z+=1.2){tree(root,.1,z,.9);tree(root,R.WIDTH/100-.15,z,.9);}
    for(const [x,z] of R.BENCHES.map(b=>[b.x/100,b.y/100])){box(root,.9,.08,.3,'#a9815c',x,.35,z);box(root,.9,.28,.06,'#b9946b',x,.56,z-.15);for(const dx of [-.33,.33])box(root,.06,.32,.25,'#6d8267',x+dx,.18,z);}
    // A planted forecourt per house, with low petals that do not block walking.
    for(const h of R.HOUSES){const x=h.x/100,z=h.y/100;
      cyl(root,.48,.02,'#e4d5ca',x,.025,z+.12);
      for(const side of [-1,1])for(let j=0;j<5;j++){const xx=x+side*(h.w/200+.28),zz=z-.1-j*.28;ball(root,.12,'#8eaf8c',xx,.08,zz);ball(root,.055,j%2?'#e7b2cb':'#f3d99b',xx,.19,zz);}
    }
    // Garland bridges over wide streets; no posts in walking lanes.
    for(const [x,z] of R.GARLANDS){for(const side of [-1,1]){cyl(root,.07,2.5,'#aaa08e',x+side*1.65,1.25,z);ball(root,.14,'#f8db9f',x+side*1.65,2.55,z);}for(let i=0;i<11;i++){const xx=x-1.5+i*.3,yy=2.25-Math.sin(i/10*Math.PI)*.35;ball(root,.055,i%2?'#f8db9f':'#e4b9d3',xx,yy,z);if(i)box(root,.31,.015,.015,'#aaa08e',xx-.15,yy,z);}}
    batch(root);
    const glints=new Float32Array(72*3);for(let i=0;i<72;i++){glints[i*3]=(i*7.31)% (R.WIDTH/100);glints[i*3+1]=.4+(i%7)*.19;glints[i*3+2]=(i*4.73)%(R.HEIGHT/100);}
    const dustGeo=new T.BufferGeometry();dustGeo.setAttribute('position',new T.BufferAttribute(glints,3));const dust=new T.Points(dustGeo,new T.PointsMaterial({color:'#fff0b9',size:.055,transparent:true,opacity:.75,depthWrite:false}));dust.name='magic-dust';scene.add(dust);

    R.NPCS.forEach(n=>{const g=new T.Group();g.position.copy(v(n.x,n.y));g.userData.target={kind:'npc',id:n.id};scene.add(g);cyl(g,.18,.45,n.color,0,.38,0);ball(g,.17,'#e4b391',0,.77,0);ball(g,.18,'#715348',0,.85,-.025);for(const x of [-.09,.09])box(g,.1,.22,.13,'#596f76',x,.11,0);const badge=icon(g,'!',0,1.2,0,.32);npcs[n.id]={g,badge};anchors.push({selector:`[data-npc="${n.id}"]`,point:v(n.x,n.y,.65)});});
    R.NODES.forEach(n=>{const g=new T.Group();g.position.copy(v(n.x,n.y));g.userData.target={kind:'node',id:n.id};scene.add(g);if(n.kind==='garden'){box(g,.55,.25,.35,'#b58963',0,.14,0);for(const x of [-.17,0,.17]){box(g,.025,.3,.025,'#63905c',x,.4,0);ball(g,.09,'#dca8bc',x,.58,0);}}else{cyl(g,.15,.05,'#f5cb6a',0,.12,0);for(const x of [-.045,.045])for(const z of [-.045,.045])cyl(g,.02,.01,'#9b7955',x,.15,z);}nodes[n.id]=g;anchors.push({selector:`[data-node="${n.id}"]`,point:v(n.x,n.y,.3)});});
    avatar=Avatar3D.create();scene.add(avatar.root);
    ring=new T.Mesh(new T.CircleGeometry(.24,24),new T.MeshBasicMaterial({color:'#657d65',transparent:true,opacity:.28,depthWrite:false}));ring.rotation.x=-Math.PI/2;scene.add(ring);
    marker=new T.Mesh(new T.RingGeometry(.18,.25,24),new T.MeshBasicMaterial({color:'#a77ec8',side:T.DoubleSide}));marker.rotation.x=-Math.PI/2;scene.add(marker);
    const routeGeometry=new T.BufferGeometry();routeGeometry.setAttribute('position',new T.BufferAttribute(new Float32Array(12288),3));routeLine=new T.Line(routeGeometry,new T.LineBasicMaterial({color:'#a383bc',transparent:true,opacity:.75}));scene.add(routeLine);
  }
  function resize(){if(!host)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);const aspect=w/h,half=Math.max(4.1,3.8/aspect);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();}
  function attach(el){host=el;if(!renderer)make();host.append(renderer.domElement);avatar.reset();observer=new ResizeObserver(resize);observer.observe(host);resize();anchors.forEach(a=>a.el=document.querySelector(a.selector));}
  function detach(){observer?.disconnect();host=null;anchors.forEach(a=>a.el=null);}
  function update(p,state){if(!host||lost)return;const {pos,moving,path}=state;
    const center=v(pos.x,pos.y,.35);camera.position.copy(center).add(new T.Vector3(7,12,14));camera.lookAt(center);camera.updateMatrixWorld();avatar.update(p,v(pos.x,pos.y,.04),{moving});ring.position.copy(v(pos.x,pos.y,.04));
    for(const n of R.NODES){nodes[n.id].visible=n.kind!=='buttons'||!p.town.collected.includes(n.id);if(n.kind==='garden')nodes[n.id].scale.y=p.town.collected.includes(n.id)?1.25:1;}
    for(const n of R.NPCS){const entry=npcs[n.id],text=p.town.completed.includes(n.quest)?'♥':R.progress(p.town,n.quest).ready?'✓':p.town.accepted.includes(n.quest)?'…':'!';if(entry.text!==text){entry.badge.removeFromParent();entry.badge.material.map.dispose();entry.badge.material.dispose();entry.badge=icon(entry.g,text,0,1.2,0,.32);entry.text=text;}}
    marker.visible=!!path.length;if(path.length){const end=path[path.length-1];marker.position.copy(v(end.x,end.y,.04));}const points=[pos,...path],buffer=routeLine.geometry.attributes.position;points.slice(0,buffer.count).forEach((q,i)=>buffer.setXYZ(i,q.x/100,.06,q.y/100));buffer.needsUpdate=true;routeLine.geometry.setDrawRange(0,Math.min(points.length,buffer.count));routeLine.frustumCulled=false;routeLine.visible=!!path.length;
    const dust=scene.getObjectByName('magic-dust');if(dust) dust.position.y=matchMedia('(prefers-reduced-motion: reduce)').matches?0:Math.sin(performance.now()/1800)*.13;
    revealPlayer(pos);
    anchors.forEach(a=>{const el=a.el;if(!el)return;const point=a.point.clone().project(camera),x=(point.x+1)*host.clientWidth/2,y=(1-point.y)*host.clientHeight/2;el.style.left=x+'px';el.style.top=y+'px';el.style.visibility=x<20||y<65||x>host.clientWidth-20||y>host.clientHeight-80?'hidden':'visible';});renderer.render(scene,camera);
  }
  function revealPlayer(pos){
    const ray=new T.Ray(v(pos.x,pos.y,.5),new T.Vector3(7,12,14).normalize()),next=new Set();
    for(const h of R.HOUSES){const bounds=new T.Box3(v(h.x-h.w/2,h.y-h.h,0),v(h.x+h.w/2,h.y-12,4.2));if(ray.intersectBox(bounds,new T.Vector3()))next.add(h.id);}
    if(next.size===cutaway.size&&[...next].every(id=>cutaway.has(id)))return;
    for(const entry of houseInstances){if(next.has(entry.id)===cutaway.has(entry.id))continue;const matrix=entry.matrix.clone();if(next.has(entry.id)){matrix.elements[1]*=.12;matrix.elements[5]*=.12;matrix.elements[9]*=.12;matrix.elements[13]*=.12;if(entry.roof)matrix.scale(new T.Vector3(0,0,0));}entry.mesh.setMatrixAt(entry.index,matrix);entry.mesh.instanceMatrix.needsUpdate=true;}
    signs.forEach(({id,sign})=>sign.visible=!next.has(id));cutaway.clear();next.forEach(id=>cutaway.add(id));
  }
  function rayAt(x,y){const b=host.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((x-b.left)/b.width*2-1,1-(y-b.top)/b.height*2),camera);return ray;}
  function hitTest(x,y){if(!host||lost)return null;const ray=rayAt(x,y);for(const hit of ray.intersectObjects(scene.children,true)){if(hit.object.userData.targets){const target=hit.object.userData.targets[hit.instanceId];if(target)return target;}for(let o=hit.object;o;o=o.parent)if(o.userData.target&&o.visible)return o.userData.target;}return null;}
  function floorPoint(x,y){if(!host||lost)return null;const point=new T.Vector3();return rayAt(x,y).ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),0),point)?{x:point.x*100,y:point.z*100}:null;}
  function direction(dx,dy){const angle=Math.atan2(7,14);return {x:dx*Math.cos(angle)+dy*Math.sin(angle),y:-dx*Math.sin(angle)+dy*Math.cos(angle)};}
  function project(x,y,height=0){const p=v(x,y,height).project(camera),b=host.getBoundingClientRect();return {x:b.left+(p.x+1)*b.width/2,y:b.top+(1-p.y)*b.height/2};}
  function debug(){return {webgl:!!renderer,avatarReady:avatar?.debug().ready,avatar:avatar?.debug(),contextLost:lost,camera:camera?.type,drawCalls:renderer?.info.render.calls,buildings:R.HOUSES.length};}
  return {attach,detach,update,resize,hitTest,floorPoint,direction,project,debug};
})();

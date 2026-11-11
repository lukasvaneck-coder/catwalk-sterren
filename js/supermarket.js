/* Touch-first shop: navigation and cart transactions stay outside the render graph. */
const Supermarket=(()=>{
  const T=THREE,R=KitchenRules;
  const shelves=[
    {id:'produce',name:'Groente en fruit',x:-3,z:-2,items:['potato','tomato','veg','fruit'],color:'#c59665'},
    {id:'dry',name:'Voorraadschap',x:0,z:-2,items:['pasta','rice','spice'],color:'#e3bb79'},
    {id:'cold',name:'Koeling',x:3,z:-2,items:['milk','cheese'],color:'#a5cbd0'},
    {id:'bakery',name:'Bakkerij',x:-2,z:.6,items:['dough','cone'],color:'#d4a27b'},
    {id:'checkout',name:'Kassa',x:2.7,z:1,items:[],color:'#8fb8a5'}
  ];
  let renderer,scene,camera,avatar,basket,marker,observer,host,profile,cb,frame,last=0,dialog,lost=false;
  let position={x:0,z:2.5},path=[],destination=null;
  const materials=new Map();
  function box(parent,w,h,d,color,x=0,y=0,z=0){if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.85}));const m=new T.Mesh(new T.BoxGeometry(w,h,d),materials.get(color));m.position.set(x,y,z);parent.add(m);return m;}
  function makeScene(){
    renderer=new T.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=T.SRGBColorSpace;
    renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;});renderer.domElement.addEventListener('webglcontextrestored',()=>{lost=false;last=performance.now();});
    scene=new T.Scene();scene.background=new T.Color('#cfe2d7');scene.add(new T.HemisphereLight('#fff6dd','#88a397',2.5));const sun=new T.DirectionalLight('#fff5df',2.5);sun.position.set(-4,10,6);scene.add(sun);
    camera=new T.OrthographicCamera(-6,6,5,-5,.1,60);camera.position.set(9,13,16);camera.lookAt(0,.2,0);
    box(scene,10,.25,7.6,'#91b5a2',0,-.16,0);
    for(let parity=0;parity<2;parity++){const m=new T.InstancedMesh(new T.BoxGeometry(.5,.035,.5),new T.MeshStandardMaterial({color:parity?'#efe3cb':'#fff4dd'}),140);let n=0;for(let x=0;x<20;x++)for(let z=0;z<14;z++)if((x+z)%2===parity)m.setMatrixAt(n++,new T.Matrix4().makeTranslation(-4.75+x*.5,0,-3.25+z*.5));scene.add(m);}
    box(scene,10,1.7,.16,'#94b5a6',0,.8,-3.6);box(scene,.16,.6,7,'#94b5a6',-5,.25,0);
    for(let i=0;i<10;i++)box(scene,1,.3,.5,i%2?'#f6d29c':'#83b19d',-4.5+i,1.85,-3.35);
    shelves.forEach(s=>{
      const g=new T.Group();g.position.set(s.x,0,s.z);g.userData.shelf=s.id;scene.add(g);
      if(s.id==='checkout'){
        box(g,1.7,.8,1,s.color,0,.42,0);box(g,1.8,.1,1.1,'#e8e6cf',0,.87,0);box(g,.85,.03,.65,'#465e58',-.25,.94,0);box(g,.08,.3,.08,'#425c57',.55,1.05,-.2);box(g,.48,.35,.08,'#425c57',.55,1.28,-.2);box(g,.36,.23,.02,'#b4e7c3',.55,1.28,-.15);box(g,.3,.06,.25,'#d9d4b6',.55,.96,.25);
      }else{
        const cold=s.id==='cold';box(g,1.9,1.65,.18,s.color,0,.85,-.4);
        for(const x of [-.93,.93])box(g,.12,1.7,.9,s.color,x,.85,0);
        for(let row=0;row<3;row++){
          const y=.25+row*.5;box(g,1.9,.09,1,cold?'#edf4df':'#d8b98a',0,y,0);box(g,1.9,.12,.06,s.color,0,y+.06,.48);
          for(let col=0;col<5;col++){
            const id=s.items[(row*5+col)%s.items.length],x=-.7+col*.35;
            if(['potato','tomato','fruit','veg'].includes(id)){
              const colors={potato:'#d2a569',tomato:'#e46950',fruit:'#d85f89',veg:'#ed9b48'};
              const m=new T.Mesh(new T.SphereGeometry(.14,10,8),new T.MeshStandardMaterial({color:colors[id]}));m.position.set(x,y+.2,.1);g.add(m);box(g,.08,.09,.04,'#638d53',x,y+.35,.1);
            }else{box(g,.22,.29,.22,{milk:'#f9f6e2',cheese:'#f5d66b',pasta:'#e5b669',rice:'#e8dfba',spice:'#b6ca99',dough:'#e8c895',cone:'#d3a470'}[id],x,y+.2,.1);box(g,.23,.06,.23,cold?'#89baca':'#ae7e59',x,y+.32,.1);}
          }
        }
      }
    });
    avatar=Avatar3D.create();scene.add(avatar.root);
    basket=new T.Group();box(basket,.4,.25,.3,'#d39764',0,.15,0);for(const x of [-.18,.18])box(basket,.035,.25,.035,'#775a43',x,.35,0);box(basket,.4,.035,.035,'#775a43',0,.47,0);scene.add(basket);
    marker=new T.Mesh(new T.RingGeometry(.18,.24,24),new T.MeshBasicMaterial({color:'#e3b75c',side:T.DoubleSide}));marker.rotation.x=-Math.PI/2;scene.add(marker);
  }
  function walkable(x,z){return x>=-4.5&&x<=4.5&&z>=-3&&z<=3.2&&!shelves.some(s=>Math.abs(x-s.x)<1.2&&Math.abs(z-s.z)<.8);}
  function route(end){
    const key=(x,z)=>`${x},${z}`,start=[Math.round(position.x*4),Math.round(position.z*4)],goal=[Math.round(end.x*4),Math.round(end.z*4)];
    if(!walkable(goal[0]/4,goal[1]/4))return [];
    const queue=[start],prev=new Map([[key(...start),null]]);let found=false;
    for(let i=0;i<queue.length;i++){const [x,z]=queue[i];if(x===goal[0]&&z===goal[1]){found=true;break;}for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=z+dz,k=key(a,b);if(!prev.has(k)&&walkable(a/4,b/4)){prev.set(k,[x,z]);queue.push([a,b]);}}}
    if(!found)return [];const points=[];let at=goal;while(at){points.unshift({x:at[0]/4,z:at[1]/4});at=prev.get(key(...at));}return points;
  }
  function go(id){const s=shelves.find(s=>s.id===id);if(!s)return;destination=s;path=route({x:s.x,z:s.z+1.05});}
  function closeDialog(){dialog?.close();dialog?.remove();dialog=null;}
  function openShelf(s){
    if(Math.hypot(position.x-s.x,position.z-(s.z+1.05))>.3)return;
    closeDialog();dialog=document.createElement('dialog');dialog.className='kr-pick-dialog market-dialog';dialog.setAttribute('aria-label',s.name);document.body.append(dialog);paintDialog(s);const current=dialog;current.addEventListener('close',()=>{current.remove();if(dialog===current)dialog=null;});dialog.showModal();
  }
  function paintDialog(s){
    const cart=cb.cart(),count=Object.values(cart).reduce((a,b)=>a+b,0);
    dialog.innerHTML=`<h2>${s.id==='checkout'?'🛒':'🧺'} ${s.name}</h2><p role="status" id="market-feedback">${s.id==='checkout'?'Reken gratis af om je boodschappen thuis klaar te leggen.':'Tik op een product om het in je mandje te leggen.'}</p><div>${s.items.map(id=>{const v=R.ingredients[id];return `<button class="btn ghost" data-add="${id}" ${cart[id]>=99?'disabled':''}><span>${v[0]}</span>${v[1]}<small>In je mandje ${cart[id]||0}${cb.wanted()[id]?` · lijst ${cb.wanted()[id]}`:''}</small></button>`;}).join('')}</div>${s.id==='checkout'?`<ul class="food-cart">${Object.entries(cart).map(([id,n])=>`<li><span>${R.ingredients[id][0]} ${R.ingredients[id][1]} × ${n}</span><button class="btn ghost sm" data-remove="${id}" aria-label="Eén ${R.ingredients[id][1]} terugleggen">−</button></li>`).join('')||'<li>Je mandje is nog leeg.</li>'}</ul><p><b>${count} boodschappen · gratis</b></p><button class="btn" id="food-pay" ${!count?'disabled':''}>🛍️ Gratis afrekenen</button>`:''}<button class="btn mint" data-cancel>Verder winkelen</button>`;
    dialog.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{cb.add(b.dataset.add);paintDialog(s);refresh();});
    dialog.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{cb.remove(b.dataset.remove);paintDialog(s);refresh();});
    dialog.querySelector('#food-pay')?.addEventListener('click',()=>{const ok=cb.pay();paintDialog(s);dialog.querySelector('#market-feedback').textContent=ok?'Betaald! Alles ligt thuis klaar.': 'Betalen is niet gelukt. Je mandje is behouden.';refresh();});
    dialog.querySelector('[data-cancel]').onclick=closeDialog;
  }
  function refresh(){if(!host)return;const cart=cb.cart(),count=Object.values(cart).reduce((a,b)=>a+b,0);document.querySelector('#market-cart').textContent=`🧺 ${count} · Naar de kassa`;document.querySelector('#market-list').textContent=Object.keys(cb.wanted()).length?Object.entries(cb.wanted()).map(([id,n])=>`${R.ingredients[id][0]} ${cart[id]||0}/${n}`).join('  '):'Tik op de vloer om te lopen of op een schap om iets te pakken.';basket.visible=count>0;document.querySelector('.food-header>b').textContent=`🪙 ${profile.coins}`;}
  function resize(){if(!host)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);const aspect=w/h,half=Math.max(4.5,6.1/aspect);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();if(typeof MobilePlayfield!=='undefined')MobilePlayfield.fit(camera);}
  function tap(e){if(dialog||lost)return;const b=host.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-b.left)/b.width*2-1,1-(e.clientY-b.top)/b.height*2),camera);for(const hit of ray.intersectObjects(scene.children,true)){for(let o=hit.object;o;o=o.parent)if(o.userData.shelf){go(o.userData.shelf);return;}}
    const p=new T.Vector3();if(ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),0),p)&&walkable(p.x,p.z)){destination=null;path=route({x:p.x,z:p.z});}}
  function tick(now){if(!host)return;const dt=Math.min(.05,(now-last)/1000||0);last=now;
    if(!document.hidden&&!dialog&&!lost&&path.length){const p=path[0],dx=p.x-position.x,dz=p.z-position.z,d=Math.hypot(dx,dz),step=dt*3.2;if(d<=step){position={...p};path.shift();}else{position.x+=dx/d*step;position.z+=dz/d*step;}if(!path.length&&destination){const s=destination;destination=null;openShelf(s);}}
    avatar.update(profile,new T.Vector3(position.x,.04,position.z),{moving:!!path.length&&!dialog&&!document.hidden&&!lost,carrying:basket.visible,now});basket.position.copy(avatar.handPoint()).add(new T.Vector3(0,-.23,0));basket.rotation.y=avatar.root.rotation.y;marker.visible=!!path.length;if(path.length){const p=path[path.length-1];marker.position.set(p.x,.05,p.z);}if(!lost){if(typeof MobilePlayfield!=='undefined')MobilePlayfield.frame(camera,avatar.root.position,host);renderer.render(scene,camera);}frame=requestAnimationFrame(tick);
  }
  function html(){return `<section class="market-play"><p id="market-list"></p><div id="market-3d" role="group" aria-label="Supermarkt: tik op een schap of op de vloer"></div><div class="market-actions"><button class="btn mint" id="market-cart">🧺 Naar de kassa</button><details><summary aria-label="Kies een schap">🛍️</summary><div>${shelves.map(s=>`<button class="btn ghost" data-shelf="${s.id}">${s.name}</button>`).join('')}</div></details></div></section>`;}
  function mount(p,callbacks){unmount();profile=p;cb=callbacks;host=document.querySelector('#market-3d');if(!renderer)makeScene();avatar.reset();position={x:0,z:2.5};path=[];destination=null;host.append(renderer.domElement);host.addEventListener('click',tap);observer=new ResizeObserver(resize);observer.observe(host);resize();document.querySelector('#market-cart').onclick=()=>go('checkout');document.querySelectorAll('[data-shelf]').forEach(b=>b.onclick=()=>{b.closest('details').open=false;go(b.dataset.shelf);});refresh();last=performance.now();frame=requestAnimationFrame(tick);}
  function unmount(){cancelAnimationFrame(frame);observer?.disconnect();host?.removeEventListener('click',tap);closeDialog();host=null;path=[];destination=null;}
  function debug(){return {webgl:!!renderer,avatarReady:avatar?.debug().ready,avatar:avatar?.debug(),contextLost:lost,position:{...position},moving:!!path.length,camera:camera?.type};}
  function screenPoint(id){const s=shelves.find(s=>s.id===id),v=new T.Vector3(s.x,.9,s.z).project(camera),b=host.getBoundingClientRect();return {x:b.left+(v.x+1)*b.width/2,y:b.top+(1-v.y)*b.height/2};}
  return {html,mount,unmount,debug,screenPoint};
})();

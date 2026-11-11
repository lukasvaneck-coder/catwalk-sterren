/* Reusable 3D fitting mirror; unsaved designs are passed as local item overrides. */
const FashionPreview=(()=>{
 const T=THREE,instances=new Map();
 function mount(host,profile,{items={},runway=false}={}){
  if(!host)return;if(['design-model','create-preview','stage'].includes(host.id))return DesignMirror.mount(host,profile,{items});let v=instances.get(host.id);
  if(!v){
   try{const renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;
    const scene=new T.Scene(),camera=new T.OrthographicCamera(-1,1,1,-1,.1,20);camera.position.set(0,1.05,5);camera.lookAt(0,1.05,0);scene.add(new T.HemisphereLight('#fff4e5','#80758e',2.4));const sun=new T.DirectionalLight('#fff',2);sun.position.set(-3,5,5);scene.add(sun);const avatar=Avatar3D.create();scene.add(avatar.root);
    v={renderer,scene,camera,avatar,angle:.2,frame:0,host,profile,items,runway,lost:false};instances.set(host.id,v);
    renderer.domElement.style.touchAction='none';renderer.domElement.setAttribute('aria-label','3D-paspop. Veeg om te draaien.');renderer.domElement.dataset.ok='true';
    let start=null;renderer.domElement.addEventListener('pointerdown',e=>{start=e.clientX;renderer.domElement.setPointerCapture(e.pointerId);});renderer.domElement.addEventListener('pointermove',e=>{if(start!==null){v.angle+=(e.clientX-start)*.015;start=e.clientX;}});for(const name of ['pointerup','pointercancel','lostpointercapture'])renderer.domElement.addEventListener(name,()=>start=null);
    renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();v.lost=true;});renderer.domElement.addEventListener('webglcontextrestored',()=>{v.lost=false;});
   }catch(e){host.innerHTML=Avatar.render(profile.look,profile.outfit,{bg:false,items});return;}
  }
  v.host=host;v.profile=profile;v.items=items;v.runway=runway;v.observer?.disconnect();cancelAnimationFrame(v.frame);host.replaceChildren(v.renderer.domElement);host.classList.add('fashion-preview');
  const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;v.renderer.setSize(w,h);const aspect=w/h;let half=Math.max(1.18,.65/aspect),cx=0,cy=0;
    if(host.id==='stage'||host.id==='design-model'||host.id==='create-preview'&&document.querySelector('#screen-create.salon-editor')){
      v.camera.position.set(0,.78,5);v.camera.lookAt(0,.78,0);
      const wardrobe=host.id==='stage',salon=host.id==='create-preview',panel=document.querySelector(wardrobe?'#wardrobe-panel':salon?'#screen-create .options':'#design-workspace'),dock=document.querySelector(wardrobe?'#wardrobe-dock':salon?'#screen-create .salon-dock':'.design-dock'),rect=host.getBoundingClientRect(),edge=dock?.getBoundingClientRect().top-rect.top||h-76;
      let left=12,right=w-12,top=62,bottom=edge-10;
      if(panel&&!panel.hidden&&(!salon||panel.classList.contains('salon-tray-open'))){const b=panel.getBoundingClientRect();if(w>h||w>760)right=b.left-rect.left-16;else bottom=b.top-rect.top-10;}
      const usableH=Math.max(100,bottom-top),usableW=Math.max(120,right-left);half=Math.max(.95*h/usableH,.55*h/usableW);
      cx=(1-(left+right)/w)*half*aspect;cy=((top+bottom)/h-1)*half;
    }
    v.camera.left=cx-half*aspect;v.camera.right=cx+half*aspect;v.camera.top=cy+half;v.camera.bottom=cy-half;v.camera.updateProjectionMatrix();};v.resize=resize;v.observer=new ResizeObserver(resize);v.observer.observe(host);resize();
  const loop=now=>{if(!host.isConnected)return;v.frame=requestAnimationFrame(loop);if(!host.getClientRects().length||document.hidden||v.lost)return;
   const bg=v.profile.outfit.bg||null;
   if(v.backgroundId!==bg){
    if(bg){const c=document.createElement('canvas');c.width=480;c.height=720;if(Backgrounds.draw(c.getContext('2d'),bg,480,720)){v.backgroundTexture?.dispose();v.backgroundTexture=new T.CanvasTexture(c);v.backgroundTexture.colorSpace=T.SRGBColorSpace;v.scene.background=v.backgroundTexture;v.backgroundId=bg;}}
    else{v.backgroundTexture?.dispose();v.backgroundTexture=null;v.scene.background=null;v.backgroundId=null;}
   }
   const z=v.runway?Math.sin(now*.0007)*.18:0;v.avatar.update({...v.profile,items:v.items},new T.Vector3(0,0,z),{moving:v.runway,now});v.avatar.root.rotation.y=v.runway?Math.sin(now*.0005)*.45:v.angle;v.renderer.render(v.scene,v.camera);
  };v.frame=requestAnimationFrame(loop);
 }
 function pause(){DesignMirror.pause();for(const v of instances.values()){cancelAnimationFrame(v.frame);v.observer?.disconnect();}}
 function dispose(){pause();DesignMirror.dispose();for(const v of instances.values()){v.avatar.dispose();v.backgroundTexture?.dispose();v.renderer.dispose();v.renderer.forceContextLoss();}instances.clear();}
 return {mount,pause,dispose,layout:id=>{DesignMirror.layout(id);instances.get(id)?.resize?.();},debug:()=>DesignMirror.debug().concat(Array.from(instances,([id,v])=>({id,angle:v.angle,avatar:v.avatar.debug()})))};
})();

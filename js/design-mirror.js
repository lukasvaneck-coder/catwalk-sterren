/* The original illustration is the design source; the world reads the same look/outfit data. */
const DesignMirror=(()=>{
 const views=new Map();
 function mount(host,profile,{items={},head=false}={}){
  let v=views.get(host.id);if(v&&v.host!==host){v.dispose();v=null;}if(v){if(v.canvas.parentElement!==host)host.replaceChildren(v.canvas);v.profile=profile;v.items=items;v.head=head;v.signature='';v.start();v.layout();return v;}
  const canvas=document.createElement('canvas');canvas.dataset.preview='2d';canvas.setAttribute('role','img');canvas.setAttribute('aria-label',head?'Je kapsel in de oorspronkelijke tekenstijl':'Je poppetje in de oorspronkelijke tekenstijl');host.replaceChildren(canvas);host.classList.add('design-mirror');
  v={host,canvas,profile,items,head,signature:'',frame:0,ready:false,bounds:null};views.set(host.id,v);
  const area=()=>{const w=host.clientWidth,h=host.clientHeight,r=host.getBoundingClientRect(),salon=host.id==='create-preview',hair=host.id==='hair-3d',wardrobe=host.id==='stage';const panel=document.querySelector(hair?'.hair-studio .salon-tray':wardrobe?'#wardrobe-panel':salon?'#screen-create .options':'#design-workspace'),dock=document.querySelector(hair?'.hair-studio .salon-dock':wardrobe?'#wardrobe-dock':salon?'#screen-create .salon-dock':'.design-dock');let left=12,right=w-12,top=64,bottom=dock?dock.getBoundingClientRect().top-r.top-10:h-12;
   if(panel&&!panel.hidden&&(!salon||panel.classList.contains('salon-tray-open'))){const b=panel.getBoundingClientRect();if(w>h||w>760)right=b.left-r.left-12;else bottom=b.top-r.top-10;}
   return {w,h,left,right,top,bottom};};
  function draw(){
   if(!Avatar.isReady()||!host.getClientRects().length)return;
   const p=typeof v.profile==='function'?v.profile():v.profile,{w,h,left,right,top,bottom}=area();if(!w||!h)return;
   const signature=JSON.stringify([p.look,p.outfit,v.items,w,h,left,right,top,bottom]);if(signature===v.signature)return;v.signature=signature;
   const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);const g=canvas.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);
   if(host.id==='stage'&&p.outfit.bg)Backgrounds.draw(g,p.outfit.bg,w,h);
   const source=Avatar.compose(p.look,p.outfit,{items:v.items}),pixels=source.getContext('2d').getImageData(0,0,source.width,source.height);let x0=source.width,y0=source.height,x1=0,y1=0;const limit=v.head?Math.min(source.height,Avatar.TOP+250):source.height;
   for(let y=0;y<limit;y++)for(let x=0;x<source.width;x++)if(pixels.data[(y*source.width+x)*4+3]>16){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
   if(x1<=x0||y1<=y0)return;const sw=x1-x0+9,sh=y1-y0+9,scale=Math.min(Math.max(50,right-left)/sw,Math.max(50,bottom-top)/sh),dw=sw*scale,dh=sh*scale,dx=(left+right-dw)/2,dy=(top+bottom-dh)/2;
   g.drawImage(source,x0-4,y0-4,sw,sh,dx,dy,dw,dh);v.bounds={x:dx,y:dy,width:dw,height:dh};v.ready=true;canvas.dataset.ok='true';
  }
  const loop=()=>{v.frame=requestAnimationFrame(loop);if(!document.hidden)draw();};v.start=()=>{cancelAnimationFrame(v.frame);v.frame=requestAnimationFrame(loop);};v.layout=()=>{v.signature='';draw();};v.dispose=()=>{cancelAnimationFrame(v.frame);v.observer.disconnect();views.delete(host.id);};v.observer=new ResizeObserver(v.layout);v.observer.observe(host);v.start();v.layout();return v;
 }
 function pause(){for(const v of views.values())cancelAnimationFrame(v.frame);}
 function dispose(){for(const v of [...views.values()])v.dispose();}
 return {mount,pause,dispose,layout:id=>views.get(id)?.layout(),debug:()=>[...views].map(([id,v])=>({id,mode:'2d',bounds:v.bounds,avatar:{ready:v.ready}}))};
})();

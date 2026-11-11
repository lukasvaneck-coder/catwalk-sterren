// Camera framing follows the player on narrow screens; overview remains one tap away.
const MobilePlayfield=(()=>{
 const media=matchMedia('(max-width:760px), (pointer:coarse), (max-height:500px)');
 const point=new THREE.Vector3(),overviews=new Map();
 function fit(camera){camera.userData.mobileFrame={left:camera.left,right:camera.right,top:camera.top,bottom:camera.bottom};}
 function frame(camera,position,host){
  if(!host||!camera.userData.mobileFrame)return;
  const base=camera.userData.mobileFrame,key=host.id||host.className;host.dataset.overview=String(overviews.get(key)||false);
  if(!host.querySelector('.camera-overview')){
   const b=document.createElement('button');b.type='button';b.className='camera-overview';b.textContent=overviews.get(key)?'🔎':'🔍';b.setAttribute('aria-label',overviews.get(key)?'Volg mijn poppetje':'Hele ruimte bekijken');b.setAttribute('aria-pressed',String(overviews.get(key)||false));
   b.addEventListener('pointerdown',e=>e.stopPropagation());b.addEventListener('pointerup',e=>e.stopPropagation());
   b.onclick=e=>{e.stopPropagation();host.dataset.overview=host.dataset.overview==='true'?'false':'true';const overview=host.dataset.overview==='true';overviews.set(key,overview);b.setAttribute('aria-pressed',String(overview));b.setAttribute('aria-label',overview?'Volg mijn poppetje':'Hele ruimte bekijken');b.textContent=overview?'🔎':'🔍';};host.append(b);
  }
  const zoom=media.matches&&host.dataset.overview!=='true'?(host.clientHeight>host.clientWidth?1.85:1.12):1;
  camera.updateMatrixWorld();point.set(position.x,0,position.z).applyMatrix4(camera.matrixWorldInverse);
  const cx=(base.left+base.right)/2,cy=(base.top+base.bottom)/2,t=zoom===1?0:.85;
  const x=cx+(point.x-cx)*t,y=cy+(point.y-cy)*t;
  const w=(base.right-base.left)/zoom,h=(base.top-base.bottom)/zoom;
  Object.assign(camera,{left:x-w/2,right:x+w/2,top:y+h/2,bottom:y-h/2});camera.updateProjectionMatrix();
 }
 return {fit,frame};
})();
/* Add collapsible touch menus without replacing existing gameplay handlers. */
(()=>{
 const media=matchMedia('(max-width:760px), (pointer:coarse), (max-height:500px)');
 function drawer(panel,label){
  if(!panel||panel.querySelector('.mobile-drawer-close'))return;
  if(panel.dataset.mobileDrawer){panel.parentElement.querySelector(':scope > .mobile-drawer-toggle')?.remove();panel.parentElement.querySelector(':scope > .mobile-drawer-shade')?.remove();}
  panel.dataset.mobileDrawer='true';panel.classList.add('mobile-drawer');
  const toggle=document.createElement('button');toggle.type='button';toggle.className='mobile-drawer-toggle';toggle.textContent=label;toggle.setAttribute('aria-label',panel.id==='fashion-stations'?'Werkplekken':'Keuzes en hulp');toggle.setAttribute('aria-expanded','false');
  const close=document.createElement('button');close.type='button';close.className='btn ghost mobile-drawer-close';close.textContent='✕';close.setAttribute('aria-label','Sluiten');
  const setOpen=value=>{panel.classList.toggle('mobile-open',value);toggle.setAttribute('aria-expanded',String(value));if(value)close.focus();else if(toggle.isConnected)toggle.focus();};
  const shade=document.createElement('button');shade.type='button';shade.className='mobile-drawer-shade';shade.setAttribute('aria-label','Menu sluiten');shade.tabIndex=-1;shade.onclick=()=>setOpen(false);panel.parentElement.append(shade);
  toggle.onclick=()=>setOpen(!panel.classList.contains('mobile-open'));close.onclick=()=>setOpen(false);
  panel.prepend(close);panel.parentElement.append(toggle);
  panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();setOpen(false);}});
  panel.addEventListener('click',e=>{if(e.target.closest('[data-fashion-station],[data-care],#activity-photo'))setOpen(false);});
 }
 function refresh(){
  if(!media.matches)return;
  drawer(document.querySelector('#fashion-stations'),'☰');
  drawer(document.querySelector('#kitchen .food-panel'),'📖');
  const activity=document.querySelector('#town-activities');
  if(activity&&['knuffel','foto'].includes(activity.dataset.place))drawer(activity.querySelector('.activity-panel'),activity.dataset.place==='foto'?'📷':'🐾');
 }
 let queued=false;const observer=new MutationObserver(records=>{if(!records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1)))return;if(!queued){queued=true;queueMicrotask(()=>{queued=false;refresh();});}});
 observer.observe(document.querySelector('#app'),{childList:true,subtree:true});media.addEventListener('change',refresh);refresh();
})();

/* A draft-only salon: apply sends a validated design back to the appearance form. */
const HairStudio=(()=>{
 let dialog,renderer,camera,scene,doll,frame,observer,draft,angle=0;
 function close(){cancelAnimationFrame(frame);observer?.disconnect();doll?.dispose();renderer?.dispose();dialog?.remove();dialog=null;renderer=null;}
 function open(look,outfit,onApply,entry=null){
  close();draft=HairParts.normalize(entry?.parts||look.hairParts||look.customHair);angle=.25;
  dialog=document.createElement('dialog');dialog.className='hair-studio';dialog.setAttribute('aria-label','Ontwerp je kapsel');
  dialog.innerHTML=`<header><div><small>JOUW EIGEN KAPSEL</small><h2>💇 Mix je haar</h2></div><button class="btn ghost" data-close aria-label="Sluiten">✕</button></header><div class="hair-studio-layout"><section><div id="hair-3d" aria-label="Draaibaar voorbeeld van je kapsel"></div><label class="hair-turn">Draai je poppetje<input type="range" min="-180" max="180" value="15" aria-label="Draai je poppetje"></label></section><section class="hair-options">${HairParts.sections.map(s=>`<fieldset><legend>${s.name}</legend><div>${s.options.map(([id,name])=>`<button class="btn ghost" data-part="${s.id}" data-value="${id}" aria-pressed="${draft[s.id]===id}">${name}</button>`).join('')}</div></fieldset>`).join('')}</section></div><footer><p>Links en rechts mogen verschillend zijn. Je haarkleur blijft behouden.</p><button class="btn mint" data-apply>Dit kapsel gebruiken ✨</button></footer>`;
  const field=document.createElement('label');field.className='hair-name';field.textContent='Naam van je kapsel';
  const name=document.createElement('input');name.id='hair-design-name';name.maxLength=32;name.placeholder='Bijvoorbeeld: Mijn feestkapsel';name.value=entry?.name||'';field.append(name);dialog.querySelector('footer').prepend(field);
  const apply=copy=>{const parts=HairParts.normalize(draft),label=name.value.trim()||'Mijn kapsel';close();onApply(parts,{id:copy?null:entry?.id,name:label});};
  dialog.querySelector('[data-apply]').textContent=entry?'Wijzigingen bewaren ✨':'Bewaren in mijn collectie ✨';
  if(entry){const copy=document.createElement('button');copy.className='btn ghost';copy.type='button';copy.dataset.hairCopy='';copy.textContent='Bewaar als nieuw';copy.onclick=()=>apply(true);dialog.querySelector('footer').append(copy);}
  dialog.querySelector('footer p').textContent='Je collectie wordt opgeslagen als je daarna je uiterlijk opslaat.';
  document.body.append(dialog);dialog.showModal();dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.querySelector('[data-close]').onclick=close;dialog.querySelector('[data-apply]').onclick=()=>apply(false);
  const host=dialog.querySelector('#hair-3d');
  try{renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));host.append(renderer.domElement);scene=new THREE.Scene();scene.background=new THREE.Color('#e3eddc');scene.add(new THREE.HemisphereLight('#fff4e5','#85977c',2.4));const sun=new THREE.DirectionalLight('#ffffff',2);sun.position.set(-3,5,5);scene.add(sun);camera=new THREE.OrthographicCamera(-.65,.65,.65,-.65,.1,20);camera.position.set(0,1.15,5);camera.lookAt(0,1.15,0);doll=Avatar3D.create();scene.add(doll.root);
   const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);const half=Math.max(.55,.45/(w/h));camera.left=-half*w/h;camera.right=half*w/h;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();};observer=new ResizeObserver(resize);observer.observe(host);resize();
   const render=()=>{if(!dialog)return;doll.update({look:{...look,hairParts:draft},outfit:{...outfit,hat:null}},new THREE.Vector3());doll.root.rotation.y=angle;renderer.render(scene,camera);frame=requestAnimationFrame(render);};render();
  }catch(e){host.textContent='Het 3D-voorbeeld kan niet starten. Je kunt hieronder wel je kapsel samenstellen.';}
  dialog.querySelectorAll('[data-part]').forEach(b=>b.onclick=()=>{draft[b.dataset.part]=b.dataset.value;dialog.querySelectorAll(`[data-part="${b.dataset.part}"]`).forEach(x=>x.setAttribute('aria-pressed',x===b));});
  dialog.querySelector('input[type=range]').oninput=e=>angle=+e.target.value*Math.PI/180;
 }
 return {open,close};
})();

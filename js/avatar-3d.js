/* Shared articulated 3D doll. Profiles and the 2D wardrobe remain the source of truth. */
const Avatar3D=(()=>{
 const T=THREE,TAU=Math.PI*2;
 function create(){
  const root=new T.Group(),body=new T.Group();root.name='player-3d';root.add(body);
  let signature='',limbs=[],skirt,previous=null,angle=0,phase=0,last=0,ready=false,heldAnchor,head,revision=0,anchors={},attachments=[],rope=null,longSkirt=false,skirtFit=null;
  const ownedMaterials=new Set(),ownedGeometry=new Set(),ownedTextures=new Set();
  function material(color){const m=new T.MeshStandardMaterial({color:color==='rainbow'?'#d8a7e6':color||'#ffffff',roughness:.72});ownedMaterials.add(m);return m;}
  function mesh(parent,geometry,m,x=0,y=0,z=0){ownedGeometry.add(geometry);const o=new T.Mesh(geometry,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function sphere(parent,m,x,y,z,sx,sy=sx,sz=sx){const o=mesh(parent,new T.SphereGeometry(1,16,12),m,x,y,z);o.scale.set(sx,sy,sz);return o;}
  function box(parent,m,x,y,z,w,h,d){return mesh(parent,new T.BoxGeometry(w,h,d),m,x,y,z);}
  function cylinder(parent,m,x,y,z,top,bottom,height,depth=1){const o=mesh(parent,new T.CylinderGeometry(top,bottom,height,24,1,false,Math.PI),m,x,y,z);o.scale.z=depth;return o;}
  function anchor(parent,name,x=0,y=0,z=0){const a=new T.Group();a.name=name;a.position.set(x,y,z);parent.add(a);anchors[name]=a;return a;}
  function attach(parent,object,item){parent.add(object);object.name=item.cat+':'+item.id;attachments.push({item:item.id,slot:item.cat,anchor:parent.name,node:object});return object;}
  function cord(parent,m,points,r=.008){return mesh(parent,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),24,r,6,false),m);}
  const torsoProfile=[[.155,.57],[.17,.64],[.183,.78],[.195,.88],[.193,.91],[.168,.95],[.1,.98]];
  function torsoRadius(y){for(let i=1;i<torsoProfile.length;i++){const a=torsoProfile[i-1],b=torsoProfile[i];if(y<=b[1])return a[0]+(b[0]-a[0])*Math.max(0,(y-a[1])/(b[1]-a[1]));}return .1;}
  function cloth(item){const tex=new T.CanvasTexture(Avatar.fabric(item));tex.colorSpace=T.SRGBColorSpace;ownedTextures.add(tex);const m=material('#ffffff');m.map=tex;return m;}
  function clear(){body.clear();ownedGeometry.forEach(g=>g.dispose());ownedMaterials.forEach(m=>m.dispose());ownedTextures.forEach(t=>t.dispose());ownedGeometry.clear();ownedMaterials.clear();ownedTextures.clear();limbs=[];skirt=null;anchors={};attachments=[];rope=null;longSkirt=false;skirtFit=null;}
  function faceModel(p,eyeColor,hair){
   const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const g=canvas.getContext('2d');
   const X=x=>(x+.21)/.42*512,Y=y=>(.195-y)/.39*512;
   function ellipse(x,y,rx,ry,color){g.fillStyle=color;g.beginPath();g.ellipse(X(x),Y(y),rx/.42*512,ry/.39*512,0,0,TAU);g.fill();}
   FaceFeatures.paint(g,p.look,eyeColor,X,Y,512/.42,512/.39);
   const regions={mk_lips:[-.055,-.085,.11,.055],mk_eyes:[-.16,.11,.32,.1],mk_blush:[-.18,-.035,.36,.07],mk_face:[-.17,.02,.34,.18]};
   for(const [slot,r] of Object.entries(regions)){const item=p.items?.[p.outfit[slot]]||ITEM_BY_ID[p.outfit[slot]];if(!item)continue;const source=Avatar.accessory(item,p.look,hair),pixels=source.getContext('2d').getImageData(0,0,source.width,source.height);let x0=source.width,y0=source.height,x1=0,y1=0;for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++)if(pixels.data[(y*source.width+x)*4+3]>16){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}if(x1>x0&&y1>y0)g.drawImage(source,x0,y0,x1-x0+1,y1-y0+1,X(r[0]),Y(r[1]-.035),r[2]/.42*512,r[3]/.39*512);}
   const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;ownedTextures.add(texture);const m=material('#ffffff');m.map=texture;m.transparent=true;m.depthWrite=false;
   const positions=[],uv=[],indices=[];for(let row=0;row<=32;row++)for(let col=0;col<=32;col++){const x=-.21+col/32*.42,y=.195-row/32*.39,z=.23*Math.sqrt(Math.max(0,1-(x/.25)**2-(y/.27)**2));positions.push(x*FaceFeatures.jaw(p.look.face,y),y,z+.0015);uv.push(col/32,1-row/32);if(row<32&&col<32){const a=row*33+col;indices.push(a,a+33,a+1,a+1,a+33,a+34);}}
   const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();const face=mesh(head,geometry,m);face.name='face-surface';face.castShadow=false;
  }
  function hairModel(shape,color,parts,hairline='rounded'){
   const hair=material(color),vertices=[],indices=[];
   // A raised forehead, lower temples and a full nape instead of a hemispherical fringe.
   for(let row=0;row<=16;row++)for(let col=0;col<=48;col++){const phi=col/48*TAU,front=Math.max(0,Math.cos(phi)),limit=1.92-(1.92-(hairline==='high'?.85:1.02))*Math.pow(front,.45)+(hairline==='peak'?.16*Math.pow(front,16):0),theta=row/16*limit;vertices.push(.267*Math.sin(theta)*Math.sin(phi),.286*Math.cos(theta),.249*Math.sin(theta)*Math.cos(phi)-.015);if(row<16&&col<48){const a=row*49+col;indices.push(a,a+49,a+1,a+1,a+49,a+50);}}
   const capGeometry=new T.BufferGeometry();capGeometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));capGeometry.setIndex(indices);capGeometry.computeVertexNormals();const cap=mesh(head,capGeometry,hair);cap.name='hair-cap';cap.material.side=T.DoubleSide;
   sphere(head,hair,0,-.025,-.17,.225,.235,.105);
   // A thin curved sheet grows from the crown onto the forehead, following the skull.
   function fringe(kind){
    if(!['fringe','swept','curls'].includes(kind))return;
    const positions=[],triangles=[];
    for(let row=0;row<=12;row++)for(let col=0;col<=32;col++){
     const u=col/32,phi=(u-.5)*1.8,end=kind==='swept'?1.28-.35*u:kind==='curls'?1.12:1.24-.035*Math.cos(u*Math.PI*8),theta=.48+(end-.48)*row/12;
     positions.push(.27*Math.sin(theta)*Math.sin(phi),.289*Math.cos(theta),.252*Math.sin(theta)*Math.cos(phi)-.009);
     if(row<12&&col<32){const a=row*33+col;triangles.push(a,a+33,a+1,a+1,a+33,a+34);}
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(triangles);g.computeVertexNormals();mesh(head,g,hair).name='hair-fringe';
    if(kind==='curls')for(let i=0;i<7;i++){const phi=(i/6-.5)*1.7;sphere(head,hair,.27*Math.sin(1.1)*Math.sin(phi),.127,.252*Math.sin(1.1)*Math.cos(phi)-.009,.035,.037,.035);}
   }

   if(parts){
    const p=HairParts.normalize(parts);
    fringe(p.front);
    for(const [key,side] of [['left',-1],['right',1]]){const id=p[key],x=side*.23;
     if(id==='short')sphere(head,hair,x,-.045,-.06,.065,.14,.1);
     if(id==='long')sphere(head,hair,x,-.17,-.085,.075,.29,.12);
     if(id==='wavy')for(let i=0;i<4;i++)sphere(head,hair,x+Math.sin(i*2)*.015,-.05-i*.1,-.085,.078,.12,.11);
     if(id==='braid')for(let i=0;i<6;i++)sphere(head,hair,x+Math.sin(i*2)*.015,-.015-i*.075,-.06,.055-i*.003,.065,.07);
     if(id==='tail')sphere(head,hair,side*.29,-.08,-.09,.10,.23,.11);
     if(id==='bun')sphere(head,hair,side*.27,.1,-.03,.115);
    }
    if(p.top==='bun')sphere(head,hair,0,.29,-.07,.13);
    if(['buns','puffs'].includes(p.top))for(const side of [-1,1])sphere(head,hair,side*.23,.22,-.05,p.top==='puffs'?.16:.12);
    if(p.top==='curls')for(let i=0;i<12;i++){const a=i/12*TAU;sphere(head,hair,Math.sin(a)*.2,.19+Math.cos(a)*.055,Math.cos(a)*.14-.04,.08);}
    if(p.back==='long')sphere(head,hair,0,-.16,-.2,.22,.30,.10);
    if(p.back==='wavy')for(let i=0;i<4;i++)sphere(head,hair,Math.sin(i*2)*.015,-.04-i*.1,-.205,.22,.14,.1);
    if(p.back==='tail')sphere(head,hair,0,-.11,-.31,.11,.25,.12);
    if(p.back==='braid')for(let i=0;i<6;i++)sphere(head,hair,Math.sin(i*2)*.015,-i*.075,-.28,.065-i*.004,.07,.075);
    if(p.back==='bun')sphere(head,hair,0,-.035,-.29,.13);
   }else{
   const long=['lang','lang_pony','golvend','krullen','halfop','vlechten','zijvlecht','kroonvlecht'].includes(shape),bob=['bob','bob_pony'].includes(shape);
   if(long||bob)for(const side of [-1,1]){const length=bob?.19:.29;for(let i=0;i<(shape==='golvend'?3:1);i++)sphere(head,hair,side*(.218+Math.sin(i)*.02),(bob?-.08:-.17)-i*.09,-.085,.075,length/(shape==='golvend'?2:1),.12);}
   if(long)sphere(head,hair,0,-.17,-.2,.22,.32,.09);
   if(['bob_pony','lang_pony','kort'].includes(shape))fringe('fringe');
   if(['staart','zijstaart','staartjes','vlechten','zijvlecht'].includes(shape)){
    const sides=['staartjes','vlechten'].includes(shape)?[-1,1]:[shape.startsWith('zij')?1:0];
    sides.forEach(side=>{const braid=shape.includes('vlecht');for(let i=0;i<(braid?5:2);i++)sphere(head,hair,side*(.27+(braid?Math.sin(i*2)*.025:0)),.07-i*(braid?.085:.15),side?-.08:-.3,braid?.065:.105,braid?.075:.18,.1);});
   }
   if(['knot','opgestoken','spacebuns','afro_puffs','halfop'].includes(shape)){const sides=['spacebuns','afro_puffs'].includes(shape)?[-1,1]:[0];sides.forEach(side=>sphere(head,hair,side*.24,shape==='opgestoken'?0:.25,side?-.04:-.13,.13));}
   if(['krullen','kort_krul','afro','afro_puffs','kroonvlecht'].includes(shape)){for(let i=0;i<18;i++){const a=i/18*TAU,r=shape==='afro'?.28:.24;sphere(head,hair,Math.sin(a)*r,.06+Math.cos(a)*.17,-.05+(i%3-1)*.09,shape==='afro'?.12:.075);}}
   }
   if(color==='rainbow'){let i=0;head.children.filter(m=>m.material===hair).forEach(m=>{m.material=material(['#ef8eae','#edc769','#86bd9b','#80b6d7','#aa93cd'][i++%5]);});}
  }
  // Reuse the catalogue illustration, but mount its volume on a real anatomical anchor.
  function accessoryMesh(item,source,clip=null){
   const ctx=source.getContext('2d'),pixels=ctx.getImageData(0,0,source.width,source.height),W=source.width,H=source.height;
   let minX=W,minY=H,maxX=0,maxY=0;for(let y=0;y<H;y++)for(let x=clip?.[0]||0;x<(clip?.[1]||W);x++)if(pixels.data[(y*W+x)*4+3]>32){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}if(minX>=maxX||minY>=maxY)return null;
   const w=maxX-minX+1,h=maxY-minY+1,c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(source,minX,minY,w,h,0,0,w,h);
   const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;ownedTextures.add(texture);const front=material('#ffffff');front.map=texture;front.transparent=true;front.alphaTest=.12;const edge=material(item.c?.[0]||'#b5a2b6');
   const left=[],right=[];for(let y=minY;y<=maxY;y+=2){let l=maxX,r=minX;for(let x=minX;x<=maxX;x++)if(pixels.data[(y*W+x)*4+3]>32){l=Math.min(l,x);r=Math.max(r,x);}if(l<=r){left.push([l,y]);right.push([r,y]);}}
   if(left.length<2)return null;const shape=new T.Shape(),points=[...left,...right.reverse()],scale=.0035;points.forEach(([x,y],i)=>shape[i?'lineTo':'moveTo']((x-minX-w/2)*scale,(minY+h/2-y)*scale));shape.closePath();
   const depth=['bag','pet','hand'].includes(item.cat)?.06:.012,geometry=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false,steps:1,UVGenerator:{generateTopUV:(g,a,b,c,d)=>[b,c,d].map(i=>new T.Vector2(a[i*3]/(w*scale)+.5,a[i*3+1]/(h*scale)+.5)),generateSideWallUV:()=>[new T.Vector2(),new T.Vector2(1,0),new T.Vector2(1,1),new T.Vector2(0,1)]}});
   ownedGeometry.add(geometry);const o=new T.Mesh(geometry,[front,edge]);o.castShadow=true;o.userData.art={w:w*scale,h:h*scale,depth,minX,minY,wpx:w,hpx:h,scale};
   o.userData.grip=(px,py)=>{let best=Infinity,gx=minX+w/2,gy=minY+h/2;for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++)if(pixels.data[(y*W+x)*4+3]>64){const d=(x-px)**2+(y-py)**2;if(d<best){best=d;gx=x;gy=y;}}return new T.Vector3((gx-minX-w/2)*scale,(minY+h/2-gy)*scale,depth/2);};return o;
  }
  function wrapAccessory(o,width,topY,height,surface){
   const art=o.userData.art,a=o.geometry.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i)/art.w*width,y=topY+(a.getY(i)/art.h-.5)*height,z=a.getZ(i)/art.depth*.008;const point=surface(x,y,z);a.setXYZ(i,...point);}a.needsUpdate=true;o.geometry.computeVertexNormals();
  }
  function accessory(item,p,hair){
   if(item.cat==='hat'&&hatModel(item))return;
   if(item.cat==='apron'){apronModel(item);return;}
   if(item.cat==='waist'){waistModel(item);return;}
   const source=Avatar.accessory(item,p.look,hair);
   if(item.cat==='ears'){
    for(const side of [-1,1]){const o=accessoryMesh(item,source,side<0?[0,200]:[200,400]);if(!o)continue;const art=o.userData.art,scale=Math.min(1,.13/art.h,.095/art.w);o.scale.setScalar(scale);o.position.set(0,-art.h*scale/2,-.004);attach(anchors[side<0?'ear-left':'ear-right'],o,item);sphere(o,material(item.c?.[1]||item.c?.[0]),0,art.h/2,0,.012/scale);}
    return;
   }
   if(item.cat==='hand'&&item.shape==='swimring'){const ring=mesh(anchors.waist,new T.TorusGeometry(.25,.075,12,32),cloth(item));ring.rotation.x=Math.PI/2;ring.name='hand:'+item.id;attachments.push({item:item.id,slot:item.cat,anchor:'waist',node:ring});return;}
   if(item.cat==='hand'&&item.shape==='pompoms'){for(const side of [-1,1]){const o=accessoryMesh(item,source,side<0?[0,200]:[200,400]);if(o){o.position.z=-.03;attach(anchors['hand-'+side],o,item);}}return;}
   if(item.cat==='hand'&&item.shape==='jumprope'){
    const m=material(item.c?.[0]);for(const side of [-1,1]){const grip=cylinder(anchors['hand-'+side],m,0,0,.01,.025,.025,.1);grip.name='rope-handle';}
    rope={material:m,node:null};return;
   }
   const o=accessoryMesh(item,source);if(!o)return;const art=o.userData.art;
   if(item.cat==='glasses'){
    const width=Math.min(.34,art.w),height=Math.min(.14,art.h*width/art.w);
    wrapAccessory(o,width,-.01+height/2,height,(x,y,z)=>[x,y,.23*Math.sqrt(Math.max(.05,1-(x/.25)**2-(y/.27)**2))+.004+z]);attach(head,o,item);
    const m=material(item.c?.[0]);for(const side of [-1,1])cord(head,m,[[side*.14,-.01,.2],[side*.2,-.01,.15],[side*.25,-.035,.02]],.007);return;
   }
   if(item.cat==='neck'){
    const width=Math.min(.33,art.w),height=Math.min(.26,art.h*width/art.w);
    wrapAccessory(o,width,.975,height,(x,y,z)=>{const r=torsoRadius(y),xx=Math.max(-r*.96,Math.min(r*.96,x));return [xx,y,r*.72*Math.sqrt(1-(xx/r)**2)+.004+z];});attach(anchors.chest,o,item);
    cord(body,material(item.c?.[0]),[[-.09,.96,.06],[-.095,.98,-.035],[0,.98,-.085],[.095,.98,-.035],[.09,.96,.06]],.006);return;
   }
   if(item.cat==='bag'&&['backpack','heartbag','starbag','chainbag'].includes(item.shape)){
    const back=item.shape==='backpack',scale=Math.min(1,.32/art.w,.36/art.h);o.scale.setScalar(scale);o.position.set(back?0:.21,back?.78:.65,back?-.135:.08);if(back)o.rotation.y=Math.PI;attach(body,o,item);
    const m=material(item.c?.[1]||item.c?.[0]);if(back)for(const side of [-1,1])cord(body,m,[[side*.11,.76,-.2],[side*.16,.95,-.09],[side*.16,.93,.1],[side*.13,.72,.12],[side*.11,.69,-.17]],.012);
    else cord(body,m,[[.21,.76,.09],[.16,.96,.10],[-.03,.96,-.09],[.18,.69,-.09],[.21,.76,.09]],.009);return;
   }
   if(item.cat==='hand'&&item.shape==='guitar'){
    const scale=Math.min(1,.46/art.h);o.scale.setScalar(scale);o.position.set(.035,.69,.15);attach(anchors.chest,o,item);cord(body,material(item.c?.[1]||'#695343'),[[-.13,.94,.1],[-.06,.9,.17],[.12,.68,.17],[.16,.82,-.08],[-.13,.94,.1]],.009);return;
   }
   if(item.cat==='hand'||item.cat==='bag'){
    const side=item.cat==='bag'?-1:1,grip=o.userData.grip(side<0?104:296,386);const scale=item.shape==='umbrella'?1.55:1;o.scale.setScalar(scale);o.position.copy(grip).multiplyScalar(-scale);attach(anchors['hand-'+side],o,item);return;
   }
   if(item.cat==='back'){
    const scale=Math.min(1,.85/art.w,.9/art.h);o.scale.setScalar(scale);o.position.set(0,['cape','jetpack'].includes(item.shape)?.12-art.h*scale/2:0,-art.depth*scale);attach(anchors.back,o,item);cord(body,material(item.c?.[0]),[[-.09,.97,0],[0,.94,-.12],[.09,.97,0]],.012);return;
   }
   if(item.cat==='hat'){
    const width=Math.min(.5,art.w),height=Math.min(.65,art.h*width/art.w);
    wrapAccessory(o,width,.29,height,(x,y,z)=>[x,y,.25*Math.sqrt(Math.max(.03,1-(x/.28)**2-(y/.31)**2))-.018+z]);attach(head,o,item);return;
   }
   if(item.cat==='pet'){const scale=Math.min(1,.4/art.h);o.scale.setScalar(scale);o.position.set(.48,art.h*scale/2,.12);attach(body,o,item);return;}
   attach(body,o,item);
  }
  function waistModel(item){
   const g=new T.Group();attach(anchors.waist,g,item);const fabric=cloth(item),trim=material(item.c[1]||'#fff1c9');
   const belt=mesh(g,new T.CylinderGeometry(.175,.185,.045,40,1,true),fabric,0,.045,0);belt.scale.z=.74;belt.name='waist-belt';
   const buckle=mesh(g,new T.TorusGeometry(.021,.005,6,16),trim,0,.045,.135);buckle.scale.x=1.3;
   if(item.shape==='beltbag'){
    sphere(g,fabric,.125,-.035,.12,.105,.075,.065).name='hip-pouch';
    cord(g,trim,[[.045,-.012,.163],[.12,-.005,.184],[.203,-.012,.158]],.005);
    sphere(g,trim,.175,-.025,.176,.009,.018,.006);
   }
   if(item.shape==='leash'){
    const clip=mesh(g,new T.TorusGeometry(.018,.004,6,16),trim,.171,-.015,.035);clip.rotation.y=Math.PI/2;
    cord(g,fabric,[[.172,-.02,.035],[.205,-.07,.08],[.224,-.2,.10],[.16,-.255,.105],[.11,-.20,.105],[.14,-.07,.07],[.172,-.02,.035]],.012).name='coiled-leash';
   }
  }
  function shoulderGarment(item,fabric,skin){
   const skinTorso=mesh(body,new T.LatheGeometry(torsoProfile.map(([r,y])=>new T.Vector2(r,y)),32,Math.PI),skin);skinTorso.scale.z=.72;skinTorso.name='bare-shoulder-skin';
   const vertices=[],uv=[],indices=[];
   for(let row=0;row<=16;row++)for(let col=0;col<=48;col++){
    const a=col/48*TAU,x=Math.sin(a),edge=item.shape==='bare_both'?.835:.902+(item.shape==='bare_left'?-1:1)*x*.074,t=row/16,y=.57+t*(edge-.57),r=torsoRadius(y)+.004;
    vertices.push(r*x,y,r*.72*Math.cos(a));uv.push(col/48,(y-.57)/.41);
    if(row<16&&col<48){const k=row*49+col;indices.push(k,k+1,k+49,k+1,k+50,k+49);}
   }
   const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();const garment=mesh(body,geometry,fabric);garment.name='shoulder-garment';fabric.side=T.DoubleSide;
  }
  function apronModel(item){
   const geometry=new T.BufferGeometry(),positions=[],uv=[],indices=[],rows=24,cols=16;
   for(let row=0;row<=rows;row++){const y=.95-row/rows*.57,w=y>.68?.095+(.95-y)*.1:.13+(.68-y)*.26;
    for(let col=0;col<=cols;col++){const x=(col/cols*2-1)*w;let radius=torsoRadius(y),depth=.72;
     if(y<.6){radius=skirtFit?.18+Math.min(1,(.6-y)/skirtFit.h)*(skirtFit.bottom-.18):.205;depth=skirtFit?.8:.72;}
     const z=radius*depth*Math.sqrt(Math.max(.12,1-(x/radius)**2))+.014;
     positions.push(x,y,z);uv.push(col/cols,1-row/rows);if(row<rows&&col<cols){const a=row*(cols+1)+col;indices.push(a,a+cols+1,a+1,a+1,a+cols+1,a+cols+2);}
    }
   }
   geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();const m=cloth(item);m.side=T.DoubleSide;const apron=mesh(anchors.chest,geometry,m);apron.name='apron:'+item.id;
   const trim=material(item.c[1]||'#fff1c9');cord(body,trim,[[-.09,.94,.1],[-.09,.995,0],[0,1,-.09],[.09,.995,0],[.09,.94,.1]],.012);
   cord(body,trim,[[-.17,.65,.03],[-.12,.65,-.11],[0,.65,-.14],[.12,.65,-.11],[.17,.65,.03]],.012);
   for(const side of [-1,1])cord(body,trim,[[0,.65,-.145],[side*.07,.69,-.16],[side*.07,.62,-.16],[0,.65,-.145]],.009);
  }
  function hatModel(item){
   const shape=item.shape,supported=['chefhat','tiara','royal','crown','beanie','beret','cap','helmet','swimcap','sunhat','rainhat','bucket','witchhat','partyhat','hennin','unicorn','bunnyears','catears','hairband','headphones','santa','spacehelmet'];if(!supported.includes(shape))return false;
   const m=cloth(item),accent=material(item.c?.[1]||'#fff1d4'),g=new T.Group();g.name='hat:'+item.id;g.position.y=.22;attach(head,g,item);
   if(shape==='chefhat'){cylinder(g,m,0,.075,0,.25,.245,.13,.9);for(const [x,y,z] of [[-.14,.20,0],[.14,.20,0],[0,.25,-.08],[0,.25,.08]])sphere(g,m,x,y,z,.17,.16,.15);return true;}
   const band=(r=.25)=>{const ring=mesh(g,new T.TorusGeometry(r,.024,8,32),m);ring.rotation.x=Math.PI/2;return ring;};
   if(['tiara','royal','crown'].includes(shape)){band(.22);for(let i=0;i<7;i++){const a=shape==='tiara'?-.95+i*.315:i/7*TAU,x=Math.sin(a)*.22,z=Math.cos(a)*.22;mesh(g,new T.ConeGeometry(.046,.11+(i===3?.05:0),4),m,x,.06,z);sphere(g,accent,x,.13,z,.022);}return true;}
   if(['bunnyears','catears','headphones','hairband'].includes(shape)){const ring=mesh(g,new T.TorusGeometry(.27,.025,8,24,Math.PI),m,0,-.12,0);if(shape==='headphones')for(const x of [-.27,.27])sphere(g,m,x,-.2,0,.055,.09,.09);if(shape==='bunnyears'||shape==='catears')for(const x of [-.16,.16]){const h=shape==='bunnyears'?.25:.12;if(shape==='bunnyears'){sphere(g,m,x,h*.5,0,.06,h,.05);sphere(g,accent,x,h*.5,.045,.025,h*.75,.012);}else mesh(g,new T.ConeGeometry(.08,.19,3),m,x,.08,0);}return true;}
   if(shape==='spacehelmet'){const glass=material('#bce6f5');glass.transparent=true;glass.opacity=.22;glass.depthWrite=false;sphere(g,glass,0,-.2,0,.35,.37,.33);band(.29).position.y=-.43;return true;}
   if(['witchhat','partyhat','hennin','unicorn'].includes(shape)){const horn=shape==='unicorn';if(shape==='witchhat')cylinder(g,m,0,0,0,.37,.37,.035);mesh(g,new T.ConeGeometry(horn?.06:.2,horn?.32:.42,24),m,0,.19,0);sphere(g,accent,0,.41,0,.03);return true;}
   if(shape==='beret'){sphere(g,m,.035,.04,0,.3,.08,.25);cylinder(g,accent,.035,.13,0,.014,.014,.05);return true;}
   const dome=mesh(g,new T.SphereGeometry(.285,24,12,0,TAU,0,Math.PI/2),m,0,-.08,0);dome.scale.y=.65;
   if(['sunhat','rainhat','bucket'].includes(shape))cylinder(g,accent,0,-.08,0,shape==='sunhat'?.4:.34,.35,.025,.9);
   if(shape==='cap')sphere(g,m,0,-.07,.21,.24,.025,.18);
   if(['beanie','santa'].includes(shape)){band(.28).position.y=-.08;sphere(g,accent,0,.15,0,.06);}return true;
  }
  function build(p){
   clear();revision++;const get=slot=>p.items?.[p.outfit?.[slot]]||ITEM_BY_ID[p.outfit?.[slot]],hair=get('hair')||ITEM_BY_ID.hair_lang,top=get('dress')||get('top'),bottom=get('bottom'),shoes=get('shoes');
   const skin=material((SKINS.find(s=>s.id===p.look.skin)||SKINS[1]).c),hairColor=(HAIR_COLORS.find(s=>s.id===p.look.hairColor)||HAIR_COLORS[2]).c,eye=material((EYES.find(s=>s.id===p.look.eyes)||EYES[0]).c),white=material('#fff9ed'),dark=material('#36313b');
   const fabric=cloth(top||{cat:'top',c:['#ffffff']}),sleeveFabric=top?.stickers?.length?cloth({...top,stickers:[]}):fabric,legFabric=cloth(bottom||{cat:'bottom',c:['#f4f4f8']}),shoeFabric=shoes?cloth(shoes):skin;
   const dress=get('dress'),trouserDress=dress&&['jumpsuit','onesie','overall'].includes(dress.shape),skirtItem=dress&&!trouserDress&&dress.shape!=='swimsuit'?dress:!dress&&['skirt','pleated','tutu'].includes(bottom?.shape)?bottom:null;
   const width=.88+Math.max(0,Math.min(100,p.look.build??40))/100*.3;body.scale.set(width,1,1);
   if(top?.shape?.startsWith('bare_'))shoulderGarment(top,fabric,skin);
   else {const torso=mesh(body,new T.LatheGeometry(torsoProfile.map(([r,y])=>new T.Vector2(r,y)),32,Math.PI),fabric);torso.scale.z=.72;torso.name='torso';const torsoUV=torso.geometry.attributes.uv,torsoVertices=torso.geometry.attributes.position;for(let i=0;i<torsoUV.count;i++)torsoUV.setY(i,(torsoVertices.getY(i)-.57)/.41);}
   cylinder(body,skin,0,1.005,0,.075,.085,.12);
   const hipMaterial=trouserDress||dress?.shape==='swimsuit'||top?.full?fabric:legFabric;const hips=mesh(body,new T.LatheGeometry([[.095,.47],[.15,.49],[.177,.53],[.172,.56],[.155,.605]].map(([r,y])=>new T.Vector2(r,y)),32,Math.PI),hipMaterial);hips.scale.z=.70;hips.name='hips';
   if(top?.c?.[1]&&!top.shape?.startsWith('bare_'))cylinder(body,material(top.c[1]),0,.96,0,.09,.11,.035,.85);
   if(['hoodie','puffer','coat','wintercoat','raincoat'].includes(top?.shape)){sphere(body,fabric,0,.95,-.12,.2,.12,.13);if(top.shape==='puffer')for(let i=0;i<3;i++)cylinder(body,fabric,0,.62+i*.1,0,.21,.21,.085,.73);}
   if(['blouse','trackjacket','hoodie','coat','puffer','raincoat'].includes(top?.shape))cord(body,material(top.c?.[1]||'#fff0db'),[[0,.62,.128],[0,.78,.137],[0,.91,.145],[0,.96,.115]],.006);
   if(skirtItem){const long=['ballgown','mermaid'].includes(skirtItem.shape),wide=['ballgown','princess','tutu'].includes(skirtItem.shape),h=long?.58:.34;longSkirt=long;skirtFit={h,bottom:wide?.39:long?.36:.28};skirt=cylinder(body,dress?fabric:legFabric,0,.6-h/2,0,.18,wide?.39:long?.36:.28,h,.8);skirt.name='skirt';}
   for(const side of [-1,1]){
    const leg=anchor(body,'hip-'+side,side*.09,.50,0);limbs.push({group:leg,kind:'leg',side});
    cylinder(leg,skin,0,-.2,0,.072,.06,.4);const pants=trouserDress||!skirtItem&&bottom,short=bottom?.shape==='shorts'||dress?.shape==='swimsuit';sphere(leg,pants?(trouserDress?fabric:legFabric):skin,0,-.005,0,pants?.088:.073,.075,pants?.087:.067).name='hip-joint';if(pants)cylinder(leg,trouserDress?fabric:legFabric,0,short?-.07:-.2,0,.088,bottom?.shape==='wideleg'?.12:.078,short?.16:.39,1);
    const foot=sphere(leg,shoeFabric,0,-.435,.04,.09,.065,.15);foot.name='shoe';if(shoes?.shape==='sneaker'){const trim=material(shoes.c[1]||'#fff8e9');box(leg,trim,0,-.48,.04,.17,.025,.24);for(let i=0;i<3;i++)box(leg,trim,0,-.38,.025+i*.035,.095,.01,.012);}if(shoes&&/boot|monster|bunny/.test(shoes.shape))cylinder(leg,shoeFabric,0,-.34,0,.09,.085,.17);if(shoes&&/heel|pump|strappy/.test(shoes.shape)){box(leg,shoeFabric,0,-.48,-.05,.06,.08,.06);}
    const arm=anchor(body,'shoulder-'+side,side*.189,.90,0);arm.rotation.z=side*.1;limbs.push({group:arm,kind:'arm',side});
    cylinder(arm,skin,0,-.16,0,.055,.045,.31);sphere(arm,skin,0,-.34,0,.055,.065,.05);
    const bare=top?.shape==='bare_both'||top?.shape==='bare_left'&&side===1||top?.shape==='bare_right'&&side===-1;const sleeve=top&&!bare&&!['tank','crop','bikini','swimsuit','sundress'].includes(top.shape);sphere(arm,sleeve?sleeveFabric:skin,0,-.012,0,sleeve?.075:.058,sleeve?.074:.058,sleeve?.073:.056).name='shoulder-joint';anchor(arm,'hand-'+side,0,-.34,.015);if(sleeve){const longSleeve=/sweater|hoodie|jacket|coat|blouse|puffer|turtleneck|onesie/.test(top.shape);cylinder(arm,sleeveFabric,0,longSleeve?-.13:-.065,0,.074,.065,longSleeve?.29:.15);}
   }
   head=anchor(body,'head',0,1.2,0);anchor(head,'ear-left',-.253,-.055,.006);anchor(head,'ear-right',.253,-.055,.006);anchor(body,'chest',0,0,0);anchor(body,'back',0,.85,-.14);anchor(body,'waist',0,.57,0);const skull=mesh(head,new T.SphereGeometry(1,64,48),skin);skull.name='skull';skull.scale.set(.25,.27,.23);const sv=skull.geometry.attributes.position;for(let i=0;i<sv.count;i++)sv.setX(i,sv.getX(i)*FaceFeatures.jaw(p.look.face,sv.getY(i)*.27));sv.needsUpdate=true;skull.geometry.computeVertexNormals();for(const side of [-1,1])sphere(head,skin,side*.244,-.025,-.005,.036,.054,.032);
   faceModel(p,eye.color.getStyle(),hair);
   const nose=FaceFeatures.noseSize(p.look.nose);sphere(head,skin,0,-.08,.213,...nose).name='nose';
   hairModel(hair.shape,hairColor,p.look.hairParts,p.look.hairline);
   for(const [slot,id] of Object.entries(p.outfit||{})){const item=p.items?.[id]||ITEM_BY_ID[id];if(item&&!['hair','top','bottom','dress','shoes','bg','mk_lips','mk_eyes','mk_blush','mk_face'].includes(slot))accessory(item,p,hair);}
   const hs=FaceFeatures.scale(p.look.face);head.scale.set(hs[0],hs[1],1);
   heldAnchor=new T.Object3D();heldAnchor.position.set(0,.69,.36);body.add(heldAnchor);ready=true;
  }
  function update(p,position,{moving=false,working=false,carrying=false,sitting=false,dance=-1,now=performance.now()}={}){
   const key=JSON.stringify([p.look,p.outfit,Object.values(p.outfit||{}).map(id=>p.items?.[id]||ITEM_BY_ID[id])]);if(key!==signature&&Avatar.isReady()){build(p);signature=key;}
   const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
   if(previous){const dx=position.x-previous.x,dz=position.z-previous.z;if(moving&&Math.hypot(dx,dz)>.0001&&Math.hypot(dx,dz)<.5){const target=Math.atan2(dx,dz),diff=Math.atan2(Math.sin(target-angle),Math.cos(target-angle));angle+=diff*Math.min(1,dt*14);}}
   root.position.copy(position);root.rotation.y=angle;previous=position.clone();if(moving)phase+=dt*11;
   body.position.y=0;if(head)head.rotation.x+=((dance===0?.4:0)-head.rotation.x)*Math.min(1,dt*12);
   for(const limb of limbs){const equippedHand=ITEM_BY_ID[p.outfit?.hand];const stride=Math.sin(phase)*(longSkirt?.12:.55)*limb.side,prop=attachments.some(a=>a.anchor==='hand-'+limb.side),target=limb.kind==='leg'?(sitting?-Math.PI/2:moving?stride:0):sitting?-.25:carrying?-.8:working?-.6+Math.sin(now*.014)*.12:equippedHand?.shape==='guitar'?-.45:equippedHand?.shape==='umbrella'&&limb.side===1?-.65:prop?-.12+(moving?-stride*.22:0):moving?-stride*.7:0;const danceTarget=dance<0?target:limb.kind==='arm'?(dance===3?(limb.side===1?-2.5:-.3):dance===0?-.7:Math.sin(now*.012)*.7*limb.side):dance===2?Math.sin(now*.014)*.45*limb.side:0;limb.group.rotation.x+=(danceTarget-limb.group.rotation.x)*Math.min(1,dt*18);}
   // Keep the lowest shoe on the floor while the hips and feet rotate.
   const soleHeights=limbs.filter(l=>l.kind==='leg').map(l=>{const a=l.group.rotation.x;return .5-.435*Math.cos(a)-.04*Math.sin(a)-Math.hypot(.065*Math.cos(a),.15*Math.sin(a));});body.position.y=sitting?-.44:-Math.min(...soleHeights);
   if(rope){body.updateWorldMatrix(true,true);const points=[-1,1].map(side=>body.worldToLocal(anchors['hand-'+side].getWorldPosition(new T.Vector3())));const key=points.map(v=>v.toArray().map(n=>n.toFixed(4)).join(',')).join('|');if(key!==rope.key){rope.key=key;if(rope.node){rope.node.geometry.dispose();ownedGeometry.delete(rope.node.geometry);rope.node.removeFromParent();}const mid=points[0].clone().lerp(points[1],.5);mid.y-=.38;mid.z+=.12;rope.node=cord(body,rope.material,[points[0].toArray(),mid.toArray(),points[1].toArray()],.009);}}
   if(skirt)skirt.rotation.z=moving?Math.sin(phase)*.015:0;
  }
  function handPoint(){root.updateMatrixWorld(true);return heldAnchor?heldAnchor.getWorldPosition(new T.Vector3()):root.position.clone();}
  function reset(){previous=null;last=performance.now();}
  function debug(){let meshes=0;body.traverse(o=>{if(o.isMesh)meshes++;});return {ready,meshes,angle,phase,revision,textures:ownedTextures.size,appearance:signature?JSON.parse(signature).slice(0,2):null,limbs:limbs.map(l=>l.group.rotation.x)};}
  function dispose(){clear();root.removeFromParent();}
  return {root,update,handPoint,reset,debug,dispose};
 }
 return {create};
})();

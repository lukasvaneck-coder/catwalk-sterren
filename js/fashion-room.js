/* Small walkable interiors. Movement and action targets are independent of meshes. */
const FashionRoom=(()=>{
 const T=THREE,step=.25,positions={};
 const roomNames={modehuis:'👗 Modehuis',atelier:'✂️ Naaiatelier',salon:'🪞 Spiegelsalon',race:'🏁 Raceclub',play:'🛝 Binnenspeeltuin',winkel:'🛍️ Sterrenwinkel',leshuis:'🌦️ Weer & Winkelhuis',kleurenhuis:'🎨 Kleurenhuis'};
 const fallbackStations={modehuis:[['closet','Kleding kiezen'],['mirror','Uiterlijk aanpassen'],['jury','Naar de jury'],['atelier','Naar het naaiatelier']],atelier:[['sew','Kleding ontwerpen'],['fabric','Stoffen & patronen'],['cooking','Schort & koksmuts maken'],['collection','Mijn ontwerpen']],salon:[['mirror','Uiterlijk aanpassen'],['haircut','Kapsel maken'],['haircolor','Haarkleur kiezen'],['haircollection','Mijn kapsels']]};
 fallbackStations.race=[['race_school','🏫 Naar school'],['race_gym','🏃 Naar de gym'],['race_dad','👨 Tegen papa'],['race_rain','🌧️ Voor de bui'],['race_tag','🌼 Tikkertje']];
 fallbackStations.play=[['play_springbaan','🧱 Springbaan'],['play_trampoline','🤸 Trampoline'],['play_klimrek','🧗 Klimrek & glijbaan'],['play_ballenbak','🎯 Ballenbak']];
 fallbackStations.winkel=[['shop_clothes','👗 Kledingrekken'],['shop_shoes','👟 Schoenen'],['shop_accessories','👜 Accessoires'],['shop_beauty','💄 Haar & make-up'],['shop_fitting','🪞 Aankleden'],['shop_checkout','🪙 Kassa & assortiment']];
 fallbackStations.leshuis=[['lesson_weather','🌦️ Weeropdrachten'],['lesson_budget','🐷 Slim winkelen'],['lesson_closet','👗 Mijn outfit'],['lesson_jury','⭐ Naar de jury']];
 fallbackStations.kleurenhuis=[['color_mono','🎨 Eén kleurfamilie'],['color_buren','🌈 Buurkleuren'],['color_tegenover','✨ Kleuren die knallen'],['color_closet','👗 Mijn outfit'],['color_jury','⭐ Naar de jury']];
 let pendingAction=null;
 let renderer,scene,camera,avatar,host,observer,frame,last=0,profile,callbacks,kind,active=false,lost=false,path=[],pending=null,pos={x:0,z:2.5},obstacles=[],stations=[],targets=[],marker;
 const geometries=[],materials=[];
 function material(color){const m=new T.MeshStandardMaterial({color,roughness:.78});materials.push(m);return m;}
 function mesh(g,geo,color,x,y,z,sx=1,sy=1,sz=1){geometries.push(geo);const m=new T.Mesh(geo,material(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);g.add(m);return m;}
 const box=(g,c,x,y,z,w,h,d)=>mesh(g,new T.BoxGeometry(w,h,d),c,x,y,z);
 const ball=(g,c,x,y,z,r)=>mesh(g,new T.SphereGeometry(r,12,8),c,x,y,z);
 const cylinder=(g,c,x,y,z,r,h)=>mesh(g,new T.CylinderGeometry(r,r,h,16),c,x,y,z);
 function block(x,z,w,d){obstacles.push({x,z,w:w+.5,d:d+.5});}
 function station(id,name,x,z,build){const g=new T.Group();g.userData.station=id;scene.add(g);build(g);targets.push(g);stations.push({id,name,x,z});}
 function table(g,x,z){box(g,'#d5a87c',x,.88,z,1.8,.15,.9);for(const dx of [-.72,.72])for(const dz of [-.32,.32])box(g,'#f7e7cb',x+dx,.43,z+dz,.11,.86,.11);block(x,z,1.8,.9);}
 function rack(g,x,z){for(const dx of [-.85,.85]){cylinder(g,'#b79768',x+dx,.9,z,.045,1.8);box(g,'#b79768',x+dx,.06,z,.3,.08,.55);}box(g,'#b79768',x,1.78,z,1.8,.07,.07);
  for(let i=0;i<5;i++){const px=x-.64+i*.32,c=['#d886a9','#8db8c7','#b3a1d1','#e6bb6c','#9ab997'][i];box(g,c,px,1.25,z,.28,.65,.17);box(g,c,px,1.48,z,.39,.17,.17);ball(g,'#b79768',px,1.69,z,.045);}block(x,z,1.9,.55);
 }
 function shelf(g,x,z){box(g,'#caac86',x,1,z,1.6,1.9,.5);for(const y of [.4,1,1.6])box(g,'#f5e5c9',x,y,z+.25,1.7,.08,.6);block(x,z,1.75,.8);}
 function mirror(g,x,z){box(g,'#d8ba7a',x,1.25,z,1.15,2.3,.14);box(g,'#b9dce3',x,1.25,z+.1,.95,2.1,.05);box(g,'#f1f8f5',x-.25,1.35,z+.14,.045,1.5,.02).rotation.z=-.2;block(x,z,1.2,.3);}
 function register(g,x,z){box(g,'#d3a8b6',x,.5,z,1.6,1,.75);box(g,'#f7e7cf',x,1.04,z,1.75,.1,.85);box(g,'#9a9bb5',x+.35,1.2,z,.5,.23,.4);box(g,'#a5c9c9',x+.35,1.48,z-.08,.45,.35,.08);for(let i=0;i<6;i++)box(g,'#eee7da',x+.2+(i%3)*.12,1.33,z+.06+Math.floor(i/3)*.09,.075,.02,.06);block(x,z,1.8,.9);}
 function shopRoom(){
  station('shop_clothes','Kledingrekken',-2.5,-.6,g=>{rack(g,-2.5,-1.65);for(let i=0;i<3;i++)box(g,['#d895ac','#a1b9cc','#d7b774'][i],-3.15+i*.32,.95,-1.65,.27,.35,.2);});
  station('shop_shoes','Schoenen',0,-1.6,g=>{shelf(g,0,-2.85);for(let row=0;row<3;row++)for(let i=0;i<3;i++){const x=-.55+i*.55,y=.5+row*.6,c=['#bd8a9f','#94b4ca','#d8b97e'][(row+i)%3];for(const dx of [-.09,.09]){box(g,c,x+dx,y,-2.47,.13,.13,.28);box(g,'#fff1db',x+dx,y-.06,-2.47,.14,.03,.29);}}});
  station('shop_accessories','Accessoires',2.5,-.6,g=>{shelf(g,2.5,-1.9);for(let i=0;i<3;i++){const x=2+i*.5;box(g,['#c59ac0','#a2bab0','#dbb97f'][i],x,.65,-1.58,.32,.4,.2);const handle=mesh(g,new T.TorusGeometry(.1,.025,8,16),'#a4826b',x,.88,-1.58);cylinder(g,'#dfb883',x,1.7,-1.6,.18,.06);ball(g,'#bfa1c9',x,1.79,-1.6,.12);} });
  station('shop_beauty','Haar & make-up',-2.5,.9,g=>{table(g,-2.55,2);for(let i=0;i<3;i++){const x=-3.1+i*.55;ball(g,'#e8c5a2',x,1.3,2,.18);ball(g,['#98704d','#d0a869','#c495ba'][i],x,1.4,1.98,.19);cylinder(g,['#ce7d9c','#b399c6','#d9b477'][i],x,1.07,2.3,.055,.16);}});
  station('shop_fitting','Aankleden',2.5,.55,g=>mirror(g,3.45,.5));
  station('shop_checkout','Kassa & assortiment',1.75,1.5,g=>{register(g,2.3,2.65);box(g,'#e8d1ad',1.9,1.3,2.65,.38,.45,.23);});
 }
 function learningRoom(){
  station('lesson_weather','Weeropdrachten',-2.5,-.5,g=>{
   box(g,'#e5c68c',-2.4,1.5,-2.5,2.3,1.9,.12);box(g,'#b5d7df',-2.4,1.5,-2.4,2.1,1.7,.06);ball(g,'#f1c76a',-2.95,1.9,-2.31,.24);
   for(const dx of [-.22,0,.22])ball(g,'#f3f0e7',-2+dx,1.8,-2.3,.2);for(let i=0;i<3;i++){const drop=ball(g,'#8caecb',-2.22+i*.22,1.33,-2.3,.05);drop.scale.y=1.6;}
   for(let i=0;i<4;i++){const snow=box(g,'#fff9ee',-2.95,1.12,-2.3,.38,.035,.035);snow.rotation.z=i*Math.PI/4;}
   cylinder(g,'#987c69',-3,1,-2.45,.035,1);cylinder(g,'#987c69',-1.8,1,-2.45,.035,1);block(-2.4,-2.5,2.4,.3);
   cylinder(g,'#9b859f',-3.35,.48,-1.3,.025,.8);const umbrella=ball(g,'#a791c2',-3.35,.93,-1.3,.3);umbrella.scale.y=.45;block(-3.35,-1.3,.5,.5);
  });
  station('lesson_budget','Slim winkelen',1.9,-.75,g=>{
   table(g,2,-2);const pig=ball(g,'#e7adba',1.7,1.25,-2,.3);pig.scale.z=.75;ball(g,'#e7adba',1.7,1.25,-1.72,.12);for(const x of [1.56,1.84]){mesh(g,new T.ConeGeometry(.09,.17,3),'#d695ad',x,1.53,-2);ball(g,'#665262',x,1.32,-1.8,.025);}box(g,'#846776',1.7,1.55,-2,.16,.012,.035);
   for(let i=0;i<5;i++)cylinder(g,'#e3c371',2.25,1.02+i*.035,-1.9,.12,.025);box(g,'#a1b5b6',2.6,1.03,-1.9,.35,.08,.45);for(let i=0;i<6;i++)box(g,'#fff3d9',2.52+(i%2)*.13,1.08,-1.95+Math.floor(i/2)*.09,.08,.02,.055);
  });
  station('lesson_closet','Mijn outfit',-2.3,1.05,g=>{rack(g,-2.5,2.15);});
  station('lesson_jury','Naar de jury',2,1.1,g=>{register(g,2.3,2.55);for(const x of [1.9,2.3,2.7]){const star=ball(g,'#e6c579',x,1.23,2.55,.12);box(g,'#fff0d7',x,1.11,2.3,.28,.02,.2);} });
 }
 function colorWheel(g,x,y,z,rule){
  const colors=['#dc727d','#e7a364','#e6c968','#8caf86','#85aecb','#b197c9'];
  cylinder(g,'#b89473',x,y-.55,z,.045,1.1);box(g,'#b89473',x,y-1.05,z,.7,.07,.5);
  for(let i=0;i<6;i++){const lit=rule==='mono'?i===0:rule==='buren'?i===0||i===1:i===0||i===3;const seg=mesh(g,new T.RingGeometry(.19,.58,8,1,i*Math.PI/3,Math.PI/3-.035),lit?colors[i]:'#ded7d0',x,y,z+.03);seg.material.side=T.DoubleSide;}
  ball(g,'#f8edda',x,y,z,.16);block(x,z,1.3,.5);
 }
 function colorsRoom(){
  station('color_mono','Eén kleurfamilie',-2.5,-.5,g=>{colorWheel(g,-2.5,1.45,-1.8,'mono');for(let i=0;i<3;i++){cylinder(g,['#e6a7b5','#d87e95','#aa647f'][i],-3+i*.45,.2,-1.35,.12,.32);box(g,'#f6e9d4',-3+i*.45,.38,-1.35,.21,.035,.21);}});
  station('color_buren','Buurkleuren',0,-1.5,g=>colorWheel(g,0,1.65,-2.85,'buren'));
  station('color_tegenover','Kleuren die knallen',2.5,-.5,g=>{colorWheel(g,2.5,1.45,-1.8,'tegenover');for(const [x,c] of [[2.1,'#dc727d'],[2.9,'#8caf86']]){box(g,c,x,.25,-1.35,.32,.45,.32);ball(g,'#f6e9d4',x,.52,-1.35,.09);}});
  station('color_closet','Mijn outfit',-2.5,1,g=>rack(g,-2.5,2.15));
  station('color_jury','Naar de jury',2.1,1.05,g=>{register(g,2.3,2.6);for(let i=0;i<3;i++){box(g,['#d3a0b5','#9fbfa6','#a3b7d4'][i],1.85+i*.4,1.13,2.4,.3,.03,.2);ball(g,'#e6c779',1.85+i*.4,1.3,2.6,.1);}});
 }
 function build(){
  scene=new T.Scene();scene.background=new T.Color(kind==='race'?'#dbe8df':kind==='atelier'?'#eee1cf':'#e7dfe9');scene.add(new T.HemisphereLight('#fff6df','#8b8590',2.5));const sun=new T.DirectionalLight('#ffffff',2.2);sun.position.set(-3,7,5);scene.add(sun);
  box(scene,'#c6ac92',0,-.17,0,8.3,.32,7.4);box(scene,'#f6ead7',0,.01,0,8,.05,7.1);
  for(let x=-3.8;x<4;x+=.4)box(scene,'#e6d5bd',x,.039,0,.012,.006,7);
  box(scene,kind==='race'?'#9bb9b6':kind==='atelier'?'#abc2b0':'#cba9c2',0,1.35,-3.5,8,2.7,.15);box(scene,'#f7eddb',-4,.65,0,.15,1.3,7);box(scene,'#fff3de',0,.14,-3.38,8,.22,.08);
  // Window, sill and curtains.
  box(scene,'#fff6df',-2.7,1.8,-3.37,1.5,1.45,.12);box(scene,'#b9dfe1',-2.7,1.8,-3.29,1.29,1.22,.06);box(scene,'#fff6df',-2.7,1.8,-3.23,.06,1.22,.04);box(scene,'#fff6df',-2.7,1.8,-3.23,1.29,.06,.04);
  for(const x of [-3.5,-1.9])box(scene,'#f0c9a7',x,1.8,-3.15,.23,1.6,.18);
  box(scene,kind==='race'?'#bed5c4':kind==='atelier'?'#b6c9b3':'#d7b7cf',0,.055,1.5,3.3,.025,2.1);
  for(const x of [-3.4,3.4]){cylinder(scene,'#b98b70',x,.2,2.6,.22,.38);for(let i=0;i<5;i++)ball(scene,'#86a887',x+Math.sin(i*2)*.19,.55+i*.06,2.6+Math.cos(i*2)*.15,.22);block(x,2.6,.45,.45);}
  if(kind==='kleurenhuis'){colorsRoom();
  }else if(kind==='winkel'){shopRoom();
  }else if(kind==='leshuis'){learningRoom();
  }else if(kind==='modehuis'){
   station('closet','Kleding kiezen',-2.6,.2,g=>rack(g,-2.6,-.8));
   station('mirror','Uiterlijk aanpassen',0,-1.7,g=>{box(g,'#e4bd74',0,1.3,-3.13,1.4,2.25,.19);box(g,'#bdd9df',0,1.3,-3.01,1.17,2.01,.05);box(g,'#eef9f6',-.32,1.35,-2.97,.04,1.65,.02).rotation.z=-.2;block(0,-3,1.4,.25);});
   box(scene,'#a17e9b',2.25,.07,-.1,1.55,.12,4.2);box(scene,'#f4dae8',2.25,.14,-.1,1.3,.025,4.1);
   station('jury','Naar de jury',2.25,-1.3,g=>{box(g,'#b88a9f',2.25,.65,-2.8,2.2,.2,.7);for(const x of [1.6,2.25,2.9]){box(g,'#fff0d6',x,.8,-2.7,.33,.07,.22);ball(g,'#e8ca79',x,1,-2.7,.12);}block(2.25,-2.8,2.2,.7);});
   station('atelier','Naar het naaiatelier',-2.5,1.5,g=>{box(g,'#c89aa8',-3.4,.65,1.2,.7,1.3,.45);box(g,'#f7dfb3',-3.4,1.4,1.2,.85,.13,.55);block(-3.4,1.2,.8,.6);});
  }else if(kind==='play'){
   station('play_springbaan','🧱 Springbaan',-2.5,.75,g=>{box(g,'#d7afd0',-2.6,.06,-.95,1.6,.1,2.3);for(let i=0;i<3;i++)box(g,['#e9c576','#9ccbb7','#ac9bd1'][i],-2.6,.22+i*.06,-1.7+i*.7,.9,.35+i*.12,.4);block(-2.6,-.95,1.6,2.3);});
   station('play_trampoline','🤸 Trampoline',.1,-1.2,g=>{cylinder(g,'#b69dc7',0,.3,-2.4,.85,.3);cylinder(g,'#526a73',0,.47,-2.4,.7,.04);for(const x of [-.85,.85])for(const z of [-2.95,-1.85]){cylinder(g,'#90b8b6',x,.9,z,.045,1.8);ball(g,'#f0d287',x,1.83,z,.09);}block(0,-2.4,1.9,1.5);});
   station('play_klimrek','🧗 Klimrek & glijbaan',1.7,-.5,g=>{for(const x of [1.8,3.3])for(const z of [-3,-1.8])cylinder(g,'#a99ccc',x,1,z,.065,2);for(let i=0;i<3;i++)box(g,['#ebbd86','#9bc4b1','#d9afd0'][i],2.55,.4+i*.65,-2.4,1.6,.12,1.4);for(let i=0;i<6;i++)box(g,'#f4d989',1.8,.2+i*.3,-1.7,.5,.08,.08);const slide=box(g,'#d7a5c5',3,.75,-1.05,.65,.1,1.8);slide.rotation.x=-.7;block(2.55,-2.3,1.7,1.5);block(3,-1.1,.7,1.8);});
   station('play_ballenbak','🎯 Ballenbak',1.5,1.1,g=>{box(g,'#c69ec6',2.3,.2,2.2,1.8,.4,1.2);for(let i=0;i<36;i++)ball(g,['#e8bd6f','#9ac4d4','#e6a3c2','#a6c99e'][i%4],1.55+(i%6)*.3,.45,1.75+Math.floor(i/6)*.17,.13);block(2.3,2.2,1.9,1.3);});
  }else if(kind==='race'){
   const starts=[[-2.5,-2.8,-2.5,-1.65],[0,-2.8,0,-1.65],[2.5,-2.8,2.5,-1.65],[-2.5,1.8,-2.5,.7],[2.5,1.8,2.5,.7]],colors=['#c69391','#94b2c3','#ae9bcb','#91b9b4','#b4bf7d'];
   fallbackStations.race.forEach(([id,name],i)=>{const [x,z,ax,az]=starts[i];station(id,name,ax,az,g=>{
    for(const side of [-1,1])box(g,colors[i],x+side*.67,.78,z,.14,1.55,.25);
    box(g,colors[i],x,1.58,z,1.5,.2,.28);box(g,'#e9d4b5',x,.06,z,1.5,.1,.7);
    for(let k=0;k<8;k++)box(g,k%2?'#fbf4e2':'#655d73',x-.63+k*.18,1.59,z+.15,.18,.15,.025);
    if(i===0){box(g,'#e3a897',x,.4,z,.6,.65,.4);box(g,'#9c7d92',x,.76,z,.75,.1,.55);box(g,'#fff0d4',x,.3,z+.22,.18,.4,.04);}
    if(i===1){for(const dx of [-.35,.35])box(g,'#8ca47b',x+dx,.4,z,.22,.7,.35);box(g,'#9eb886',x,.23,z-.12,.6,.35,.16);}
    if(i===2){for(const [dx,h] of [[-.22,.65],[.23,.45]]){cylinder(g,'#b49cd0',x+dx,h/2,z,.12,h);ball(g,'#ecd0ae',x+dx,h+.1,z,.15);}}
    if(i===3){cylinder(g,'#7baecb',x,.15,z,.38,.08);cylinder(g,'#8b8399',x,.5,z,.025,.7);const canopy=ball(g,'#ad96cb',x,.86,z,.38);canopy.scale.y=.45;}
    if(i===4){cylinder(g,'#b0926b',x,.5,z,.025,.9);box(g,'#eac66c',x+.17,.8,z,.35,.25,.04);}
    block(x,z,1.5,.7);
   });});
  }else if(kind==='salon'){
   // The chair, mirror and displays have separate clear approach points.
   station('haircut','Kapsel maken',-2.5,.4,g=>{
    cylinder(g,'#aa96a8',-2.5,.12,-.7,.48,.18);cylinder(g,'#ddd5df',-2.5,.4,-.7,.1,.5);
    box(g,'#bda0d1',-2.5,.7,-.7,.85,.22,.85);box(g,'#bda0d1',-2.5,1.08,-1.07,.85,.8,.16);
    for(const x of [-2.99,-2.01]){box(g,'#f3dfb9',x,.88,-.7,.13,.12,.75);cylinder(g,'#ddd5df',x,.69,-.6,.035,.35);}
    box(g,'#ddd5df',-2.5,.32,-.03,.65,.08,.24);block(-2.5,-.65,1.15,1.2);
    // Side trolley with comb and scissors.
    box(g,'#e4c8cc',-3.45,.7,-1.15,.45,.12,.6);box(g,'#e4c8cc',-3.45,.3,-1.15,.45,.12,.6);
    for(const z of [-1.35,-.95])cylinder(g,'#b49cae',-3.45,.47,z,.035,.8);
    box(g,'#927eb0',-3.45,.79,-1.12,.08,.04,.35);for(let i=0;i<6;i++)box(g,'#927eb0',-3.36,.79,-1.27+i*.05,.15,.03,.02);block(-3.45,-1.15,.5,.65);
   });
   station('mirror','Uiterlijk aanpassen',0,-1.65,g=>{
    box(g,'#e5c692',0,1.7,-3.12,1.55,1.9,.18);box(g,'#bcdde3',0,1.7,-3,1.32,1.65,.05);
    box(g,'#f4fcf8',-.34,1.73,-2.96,.045,1.35,.02).rotation.z=-.22;
    for(const x of [-.85,.85])for(let i=0;i<5;i++)ball(g,'#fff5ce',x,.95+i*.36,-2.99,.08);
    box(g,'#ead5c3',0,.72,-2.85,2.05,.15,.75);for(const x of [-.8,.8])box(g,'#ba9dae',x,.36,-2.85,.1,.72,.5);
    cylinder(g,'#c493b9',-.6,.91,-2.7,.09,.25);cylinder(g,'#f6e5cc',.6,.88,-2.7,.12,.18);block(0,-2.85,2.05,.75);
   });
   station('haircolor','Haarkleur kiezen',2.5,-1.5,g=>{
    box(g,'#c7accb',2.5,1.2,-2.85,1.65,1.65,.55);
    for(let row=0;row<2;row++){box(g,'#f4e2cb',2.5,.8+row*.65,-2.48,1.75,.09,.55);for(let i=0;i<5;i++){const x=1.9+i*.3,z=-2.48,y=.98+row*.65;cylinder(g,['#835d41','#f0d18d','#dd8fbb','#a494cb','#a8c1b3'][i],x,y,z,.09,.28);cylinder(g,'#f9f0df',x,y+.17,z,.055,.09);}}
    block(2.5,-2.8,1.75,.7);
   });
   station('haircollection','Mijn kapsels',2.5,1.3,g=>{
    box(g,'#dfc9b6',2.6,.68,2.35,1.9,.18,.65);for(const x of [1.8,3.4])box(g,'#bba0ba',x,.33,2.35,.12,.65,.5);
    for(let i=0;i<3;i++){const x=1.95+i*.65;cylinder(g,'#f5dfc3',x,.89,2.35,.07,.28);ball(g,'#f5dfc3',x,1.19,2.35,.23);ball(g,['#8f6546','#e3bb6f','#c487b0'][i],x,1.31,2.32,.24);if(i!==1)for(const side of [-1,1])ball(g,i===0?'#8f6546':'#c487b0',x+side*.23,1.06,2.35,.13);else ball(g,'#e3bb6f',x,1.57,2.32,.14);}
    block(2.6,2.35,1.9,.7);
   });
  }else{
   station('sew','Kleding ontwerpen',-2.4,.2,g=>{table(g,-2.4,-.85);box(g,'#d9a1ad',-2.4,1.09,-.85,1,.2,.4);box(g,'#f8e9db',-2.12,1.39,-.85,.25,.5,.34);box(g,'#f8e9db',-2.38,1.61,-.85,.75,.18,.34);box(g,'#66646d',-2.65,1.36,-.85,.025,.4,.025);cylinder(g,'#a18bbd',-2.12,1.78,-.85,.07,.16);box(g,'#88b6b7',-2.65,.98,-.65,.75,.025,.4);});
   station('fabric','Stoffen & patronen',0,-1.6,g=>{box(g,'#d1ac84',0,1.2,-3.13,2.2,2.1,.5);for(let row=0;row<3;row++){box(g,'#f4dfbf',0,.55+row*.55,-2.8,2.2,.07,.6);for(let i=0;i<5;i++){const roll=cylinder(g,['#db9bb0','#8fbec0','#b6a3cf','#e7c474','#9fb99b'][i],-.8+i*.4,.76+row*.55,-2.85,.14,.4);roll.rotation.x=Math.PI/2;}}block(0,-3,2.2,.6);});
   station('cooking','Schort & koksmuts maken',2.45,.1,g=>{cylinder(g,'#a18570',2.5,.08,-.9,.4,.1);cylinder(g,'#a18570',2.5,.7,-.9,.045,1.3);box(g,'#e6b9ab',2.5,1.3,-.9,.5,.65,.3);box(g,'#fff4dc',2.5,1.25,-.71,.36,.6,.05);ball(g,'#ead2b2',2.5,1.86,-.9,.2);for(const dx of [-.14,0,.14])ball(g,'#fff8ed',2.5+dx,2.09,-.9,.16);block(2.5,-.9,.65,.6);});
   station('collection','Mijn ontwerpen',2.45,1.8,g=>rack(g,2.6,2.8));
  }
  station('exit','Terug naar het dorp',0,2.85,g=>{box(g,'#c4a17f',0,.07,3.35,1.2,.08,.3);});
  marker=mesh(scene,new T.RingGeometry(.18,.24,32),'#a785bf',0,.08,0);marker.rotation.x=-Math.PI/2;marker.visible=false;
  avatar=Avatar3D.create();scene.add(avatar.root);
 }
 function walkable(x,z){return x>=-3.7&&x<=3.7&&z>=-3.15&&z<=3.1&&!obstacles.some(o=>Math.abs(x-o.x)<o.w/2&&Math.abs(z-o.z)<o.d/2);}
 function route(to){
  const cell=p=>[Math.round(p.x/step),Math.round(p.z/step)],key=([x,z])=>x+','+z,start=cell(pos),end=cell(to),queue=[start],parents=new Map([[key(start),null]]);let found=null;
  for(let n=0;n<queue.length;n++){const a=queue[n];if(key(a)===key(end)){found=a;break;}for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const b=[a[0]+dx,a[1]+dz],k=key(b);if(!parents.has(k)&&walkable(b[0]*step,b[1]*step)){parents.set(k,a);queue.push(b);}}}
  if(!found)return [];const result=[];while(parents.get(key(found))){result.unshift({x:found[0]*step,z:found[1]*step});found=parents.get(key(found));}return result;
 }
 function go(point,id=null,onArrival=null){if(!walkable(point.x,point.z))return;pendingAction=onArrival;path=route(point);pending=path.length?id:null;marker.position.set(point.x,.18,point.z);marker.visible=!!path.length;document.querySelector('#fashion-status').textContent=id?'Onderweg naar '+stations.find(s=>s.id===id).name.toLowerCase():'Tik op een plek om te lopen';if(!path.length&&Math.hypot(pos.x-point.x,pos.z-point.z)<.4&&id){const action=pendingAction;pendingAction=null;if(action)action();else callbacks.action(id);}}
 function pointer(e){if(lost||e.button>0||!document.querySelector('#overlay').hidden)return;const rect=host.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);
  for(const hit of ray.intersectObjects(targets,true)){let node=hit.object;while(node&&!node.userData.station)node=node.parent;if(node){const s=stations.find(s=>s.id===node.userData.station);go(s,s.id);return;}}
  const p=new T.Vector3();if(ray.ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),0),p))go(p);
 }
 function resize(){if(!host||!renderer)return;const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;renderer.setSize(w,h);const aspect=w/h,half=Math.max(5.3,5.65/aspect);camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();}
 function tick(now){if(!active)return;frame=requestAnimationFrame(tick);if(lost||document.hidden){last=now;return;}const dt=Math.min(.05,(now-last)/1000||0);last=now;let moving=false;
  if(path.length&&document.querySelector('#overlay').hidden){const next=path[0],dx=next.x-pos.x,dz=next.z-pos.z,d=Math.hypot(dx,dz),distance=dt*2.5;moving=true;if(d<=distance){pos={...next};path.shift();}else{pos.x+=dx/d*distance;pos.z+=dz/d*distance;}}
  positions[kind]={...pos};const y=kind==='modehuis'&&Math.abs(pos.x-2.25)<.78&&Math.abs(pos.z+.1)<2.1?.16:.05;avatar.update(profile,new T.Vector3(pos.x,y,pos.z),{moving,now});renderer.render(scene,camera);
  if(!path.length&&document.querySelector('#overlay').hidden){marker.visible=false;if(pending){const id=pending;pending=null;const action=pendingAction;pendingAction=null;document.querySelector('#fashion-status').textContent='Tik op meubels of kies een werkplek';if(action)action();else callbacks.action(id);}}
 }
 function show(p,room,cb){hide();profile=p;kind=room;callbacks=cb;pos=positions[kind]||{x:0,z:2.5};active=true;lost=false;obstacles=[];stations=[];targets=[];path=[];pending=null;pendingAction=null;
  const root=document.querySelector('#fashion-room');root.innerHTML='<header class="fashion-header"><button class="btn ghost" id="fashion-exit">← Dorp</button><h1>'+roomNames[room]+'</h1></header><div id="fashion-view" aria-label="'+roomNames[room]+' in 3D. Tik op de vloer om te lopen."></div><p id="fashion-status" role="status">Tik op de vloer om te lopen, of op een werkplek.</p><nav id="fashion-stations" aria-label="Werkplekken"></nav>';
  host=document.querySelector('#fashion-view');document.querySelector('#fashion-exit').onclick=()=>cb.action('exit');
  try{renderer=new T.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;host.append(renderer.domElement);camera=new T.OrthographicCamera(-6,6,6,-6,.1,100);camera.position.set(10,12,14);camera.lookAt(0,.35,0);build();
   host.addEventListener('pointerup',pointer);const mountedRenderer=renderer;renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();if(renderer!==mountedRenderer)return;lost=true;document.querySelector('#fashion-status').textContent='Het 3D-beeld herstelt… Je kunt de werkplekknoppen gebruiken.';});renderer.domElement.addEventListener('webglcontextrestored',()=>{if(renderer!==mountedRenderer)return;lost=false;resize();});observer=new ResizeObserver(resize);observer.observe(host);resize();last=performance.now();frame=requestAnimationFrame(tick);
  }catch(e){host.textContent='Het 3D-beeld kan niet starten. Gebruik de werkplekknoppen hieronder.';if(!stations.length)stations=fallbackStations[room].map(([id,name])=>({id,name}));lost=true;}
  for(const s of stations.filter(s=>s.id!=='exit')){const b=document.createElement('button');b.className='btn ghost';b.type='button';b.dataset.fashionStation=s.id;b.textContent=s.name;b.onclick=()=>{if(lost){path=[];pending=null;pendingAction=null;callbacks.action(s.id);}else go(s,s.id);};document.querySelector('#fashion-stations').append(b);}
 }
 function hide(){active=false;pendingAction=null;pending=null;path=[];cancelAnimationFrame(frame);observer?.disconnect();host?.removeEventListener('pointerup',pointer);avatar?.dispose();avatar=null;geometries.splice(0).forEach(g=>g.dispose());materials.splice(0).forEach(m=>m.dispose());renderer?.dispose();renderer?.forceContextLoss();renderer=null;scene=null;}
 function debug(){return {kind,active,lost,position:{...pos},path:[...path],stations:stations.map(s=>({...s})),obstacles:[...obstacles],avatar:avatar?.debug(),walkable,project:(x,y,z)=>{const q=new T.Vector3(x,y,z).project(camera),r=host.getBoundingClientRect();return {x:r.x+(q.x+1)*r.width/2,y:r.y+(1-q.y)*r.height/2};}};}
 function visit(id,onArrival){const s=stations.find(s=>s.id===id);if(!active||!s)return;if(lost){path=[];pending=null;pendingAction=null;if(onArrival)onArrival();else callbacks.action(id);}else go(s,id,onArrival);}
 return {show,hide,debug,visit};
})();

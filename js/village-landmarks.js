/* Hand-built storybook landmarks, shared low-poly geometry for mobile instancing. */
const VillageLandmarks=(()=>{
 const T=THREE,cone=new T.ConeGeometry(1,1,12),ring=new T.TorusGeometry(1,.12,6,24);
 const starShape=new T.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.45:1;i?starShape.lineTo(Math.cos(a)*r,Math.sin(a)*r):starShape.moveTo(Math.cos(a)*r,Math.sin(a)*r);}starShape.closePath();
 const star=new T.ExtrudeGeometry(starShape,{depth:.16,bevelEnabled:false});
 const palettes={keuken:['#e7b380','#8baea0'],supermarkt:['#a3c8ad','#e8b967'],kleedkamer:['#e6accb','#a38ac9'],atelier:['#efceb1','#78aaa7'],winkel:['#e8cb80','#8d88bf'],leshuis:['#a8d5dc','#7f9cc6'],race:['#dba28d','#546d83'],salon:['#d1b9e4','#8cbab5'],puzzel:['#c1d6aa','#e8b280'],speeltuin:['#9cd4ce','#d78eae'],foto:['#c5c0d4','#707d98'],knuffel:['#e4c3a3','#9fb77c'],disco:['#a69aca','#6a608f'],balzaal:['#ebc1cc','#b989a9']};
 function build(g,h,y,{box,ball,cyl,shape}){
  const w=h.w/100,z=-(h.h-20)/200,cream='#fff0d5',gold='#e8c67b',ink='#596279',accent=palettes[h.id][1];
  const roof=new T.Group();roof.userData.landmark=true;g.add(roof);
  const badge=(x,yy,zz,size=.3,color=gold)=>shape(roof,star,color,x,yy,zz,size,size,size);
  const hoop=(x,yy,zz,r,color=gold)=>shape(roof,ring,color,x,yy,zz,r,r,r);
  const turret=(x,zz,color=accent)=>{cyl(roof,.23,1.15,cream,x,y+.1,zz);shape(roof,cone,color,x,y+.9,zz,.36,.62,.36);badge(x,y+1.34,zz,.14);};
  if(h.id==='keuken'){
   cyl(roof,.39,.55,cream,0,y+.35,z);for(const x of [-.29,0,.29])ball(roof,.31,'#fff9e9',x,y+.67,z);box(g,.25,.65,.35,'#c98271',w*.35,y+.15,z-.3);for(let i=0;i<3;i++)ball(roof,.09+i*.025,'#e4ddd1',w*.35+i*.08,y+.62+i*.24,z-.3);
  }else if(h.id==='supermarkt'){
   box(roof,1.18,.48,.65,'#bf9167',0,y+.3,z);for(let i=-2;i<=2;i++)box(roof,.045,.5,.7,cream,i*.22,y+.32,z);hoop(0,y+.72,z,.42,cream);for(let i=0;i<5;i++)ball(roof,.16,['#d58187','#b1c57f','#e9bb69'][i%3],-.43+i*.21,y+.64,z+.12);box(g,w+.25,.12,.65,gold,0,1.12,.23);
  }else if(h.id==='kleedkamer'){
   turret(-w*.38,z);turret(w*.38,z);box(roof,.95,.18,.5,gold,0,y+.3,z);for(let i=-1;i<=1;i++){shape(roof,cone,gold,i*.3,y+.65,z,.16,.58,.16);ball(roof,.09,'#e4a4c3',i*.3,y+.97,z);}box(g,w*.7,.035,.72,'#ce83ad',0,.025,.35);
  }else if(h.id==='atelier'){
   cyl(roof,.38,.65,'#ca8eaa',-.48,y+.45,z);for(const dy of [-.36,.36])cyl(roof,.46,.09,gold,-.48,y+.45+dy,z);box(roof,.85,.13,.55,accent,.45,y+.12,z);box(roof,.23,.65,.4,accent,.72,y+.48,z);box(roof,.72,.22,.4,accent,.44,y+.8,z);box(roof,.035,.36,.035,ink,.12,y+.48,z+.06);hoop(.75,y+.72,z+.25,.16,gold);
  }else if(h.id==='winkel'){
   for(let i=-1;i<=1;i++)badge(i*.48,y+.65-Math.abs(i)*.15,z,.36-Math.abs(i)*.06);box(g,w+.18,.12,.55,gold,0,1.16,.15);for(const x of [-w*.3,w*.3]){box(g,.55,.55,.2,accent,x,.62,.15);box(g,.07,.57,.22,gold,x,.62,.15);}
  }else if(h.id==='leshuis'){
   for(let i=0;i<4;i++)ball(roof,.24,'#fff4e4',-.38+i*.24,y+.5,z);ball(roof,.3,gold,.55,y+.75,z-.08);for(let i=0;i<8;i++){const a=i*Math.PI/4;ball(roof,.055,gold,.55+Math.cos(a)*.43,y+.75+Math.sin(a)*.43,z-.08);}for(let i=-1;i<=1;i++)shape(roof,cone,'#84b8d0',i*.22,y+.1,z,.07,.2,.07).rotation.z=Math.PI;
  }else if(h.id==='race'){
   for(const x of [-w*.4,w*.4]){cyl(roof,.045,.9,ink,x,y+.3,z);for(let a=0;a<3;a++)for(let b=0;b<2;b++)box(roof,.15,.15,.035,(a+b)%2?ink:cream,x+a*.15,y+.65-b*.15,z);}
   box(roof,1.1,.18,.5,'#df8b71',0,y+.18,z);box(roof,.5,.25,.4,'#91bbc8',0,y+.37,z);for(const x of [-.35,.35])for(const zz of [-.27,.27])ball(roof,.15,ink,x,y+.12,z+zz);
  }else if(h.id==='salon'){
   hoop(0,y+.55,z,.55,gold).scale.set(.48,.65,.48);ball(roof,1,'#b6dce2',0,y+.55,z).scale.set(.4,.55,.06);badge(.48,y+1,z,.19);box(g,w*.6,.035,.55,'#d9b9dc',0,.03,.25);
  }else if(h.id==='puzzel'){
   ball(roof,1,'#ead3a9',0,y+.42,z).scale.set(.72,.49,.15);for(let i=0;i<6;i++){const a=i*Math.PI/3;ball(roof,.12,['#dc929e','#e8b966','#aac578','#83bdb7','#8da9d6','#bd99cd'][i],Math.cos(a)*.47,y+.42+Math.sin(a)*.3,z+.16);}const brush=box(roof,.12,1.05,.12,ink,.6,y+.55,z+.2);brush.rotation.z=-.45;
  }else if(h.id==='speeltuin'){
   for(const x of [-w*.36,w*.36])turret(x,z,'#d894b6');for(let i=0;i<6;i++)box(roof,.23,.22,.4,i%2?gold:accent,-.6+i*.24,y+.18,z);hoop(0,y+.45,z,.53,'#e7bf70');
  }else if(h.id==='foto'){
   box(roof,1.38,.82,.45,ink,0,y+.48,z);box(roof,.4,.18,.4,cream,-.35,y+.99,z);hoop(.12,y+.48,z+.31,.31,cream);ball(roof,.26,'#96c3d3',.12,y+.48,z+.3);box(roof,.22,.15,.05,gold,-.45,y+.7,z+.26);
  }else if(h.id==='knuffel'){
   ball(roof,.52,'#c89c79',0,y+.45,z);for(const x of [-.38,.38]){ball(roof,.23,'#c89c79',x,y+.83,z);ball(roof,.13,'#e4b6ac',x,y+.84,z+.15);}ball(roof,.23,cream,0,y+.25,z+.4);ball(roof,.08,ink,0,y+.33,z+.59);for(const x of [-.18,.18])ball(roof,.045,ink,x,y+.55,z+.46);
  }else if(h.id==='disco'){
   ball(roof,.53,'#aac8db',0,y+.55,z);for(let i=0;i<16;i++){const a=i*Math.PI/8;box(roof,.12,.12,.07,i%2?cream:'#e5bad9',Math.sin(a)*.52,y+.55+(i%3-1)*.22,z+Math.cos(a)*.52);}for(const x of [-.76,.76]){box(roof,.26,.8,.26,ink,x,y+.4,z);for(const dy of [.2,.55])ball(roof,.11,'#ba9cc9',x,y+dy,z+.13);}
  }else if(h.id==='balzaal'){
   turret(-w*.39,z,'#c693ab');turret(w*.39,z,'#c693ab');hoop(0,y+.55,z,.55,gold);for(let i=0;i<9;i++){const a=i*Math.PI/8;ball(roof,.13,'#dc9fb6',Math.cos(a)*.55,y+.55+Math.sin(a)*.55,z+.1);}badge(0,y+1.35,z,.22);
  }
  roof.traverse(o=>{if(o.isMesh)o.userData.roof=true;});
  // Warm entrance lamps and flower borders stay inside each blocked building plot.
  for(const x of [-w*.43,w*.43]){cyl(g,.025,.5,ink,x,.75,.1);ball(g,.105,'#ffdf9e',x,1.04,.1);box(g,.32,.16,.22,'#b8967c',x,.16,-.12);for(let j=0;j<3;j++)ball(g,.075,['#e6a6c6','#f2d28c','#b7d5b1'][j],x+(j-1)*.09,.3,-.12);}
 }
 return {build,palettes,star};
})();

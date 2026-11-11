/* Validated facial choices shared by profile storage, thumbnails and 3D faces. */
const FaceFeatures=(()=>{
 const sections=[{id:'face',name:'Hoofd',options:FACE_SHAPES.map(f=>[f.id,f.name])},{id:'eyeShape',name:'Oogvorm',options:[['round','Rond'],['almond','Amandel'],['wide','Groot'],['soft','Zacht']]},{id:'nose',name:'Neus',options:[['button','Knopje'],['small','Klein'],['round','Rond'],['long','Lang']]},{id:'mouth',name:'Mond',options:[['smile','Glimlach'],['small','Klein lachje'],['wide','Brede lach'],['open','Open lach']]},{id:'brows',name:'Wenkbrauwen',options:[['soft','Zacht'],['straight','Recht'],['arched','Gebogen'],['bold','Vol']]}];
 const defaults={face:'ovaal',eyeShape:'round',nose:'button',mouth:'smile',brows:'soft',browColor:'auto'};
 function normalize(raw={}){raw=raw||{};const v=Object.fromEntries(sections.map(s=>[s.id,s.options.some(([id])=>id===raw?.[s.id])?raw[s.id]:defaults[s.id]]));v.browColor=raw.browColor==='auto'||HAIR_COLORS.some(c=>c.id===raw.browColor)?raw.browColor:'auto';return v;}
 const scale=face=>({rond:[1.08,.95],smal:[.89,1.06],hart:[1.04,1.02],vierkant:[1.04,.98]})[face]||[1,1];
 const jaw=(face,y)=>face==='hart'?1-.18*Math.max(0,-y/.27):face==='vierkant'?1+.13*Math.max(0,1-Math.abs(y+.13)/.15):1;
 const noseSize=id=>({small:[.017,.021,.019],round:[.033,.028,.029],long:[.021,.044,.035]})[id]||[.025,.031,.025];
 const browColor=look=>{const id=look.browColor==='auto'||!look.browColor?look.hairColor:look.browColor;const c=(HAIR_COLORS.find(c=>c.id===id)||HAIR_COLORS[2]).c;return c==='rainbow'?'#986c99':c;};
 function paint(g,look,eyeColor,X,Y,unitX,unitY,{nose=false}={}){
  const v=normalize(look),ellipse=(x,y,rx,ry,c)=>{g.fillStyle=c;g.beginPath();g.ellipse(X(x),Y(y),rx*unitX,ry*unitY,0,0,Math.PI*2);g.fill();};
  const widths={round:1,almond:1.1,wide:1.12,soft:.96},heights={round:1,almond:.62,wide:1.12,soft:.8},ex=widths[v.eyeShape],ey=heights[v.eyeShape];
  for(const side of [-1,1]){const x=side*.09;ellipse(x,.025,.047*ex,.06*ey,'#fff8ef');ellipse(x,.022,.026*ex,.038*ey,eyeColor);ellipse(x,.02,.012,.025*ey,'#302d36');ellipse(x-.008,.04,.008,.009,'#fff');
   g.strokeStyle=browColor(look);g.lineWidth=(v.brows==='bold'?.009:.0045)*unitX;g.lineCap='round';g.beginPath();g.moveTo(X(x-.035),Y(.105));g.quadraticCurveTo(X(x),Y(v.brows==='straight'?.106:v.brows==='arched'?.14:.12),X(x+.033),Y(.106));g.stroke();}
  const w=v.mouth==='small'?.026:v.mouth==='wide'?.058:.04;
  if(v.mouth==='open'){ellipse(0,-.11,.041,.027,'#754850');ellipse(0,-.119,.022,.009,'#d88b97');}
  else{g.strokeStyle='#a45c65';g.lineWidth=.0045*unitX;g.lineCap='round';g.beginPath();g.moveTo(X(-w),Y(-.105));g.bezierCurveTo(X(-w/2),Y(-.135),X(w/2),Y(-.135),X(w),Y(-.105));g.stroke();}
  if(nose){const n=noseSize(v.nose);ellipse(0,-.045,n[0],n[1],'#b7806655');ellipse(-.004,-.035,n[0]*.48,n[1]*.4,'#fff4d855');}
 }
 return {sections,defaults,normalize,scale,jaw,noseSize,browColor,paint};
})();

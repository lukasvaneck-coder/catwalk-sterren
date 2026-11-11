/* Pointer capture keeps steering active while a second finger jumps. */
const TouchControls=(()=>{
  function stick(el,keys,signal,enabled=()=>true){
    if(!el)return;let pointer=null;const directions=['left','right','up','down'];
    const clear=()=>{directions.forEach(k=>keys.delete(k));el.style.setProperty('--stick-x','0px');el.style.setProperty('--stick-y','0px');pointer=null;};
    function move(e){if(e.pointerId!==pointer)return;e.preventDefault();directions.forEach(k=>keys.delete(k));if(!enabled()){clear();return;}
      const b=el.getBoundingClientRect(),radius=b.width*.32;let x=e.clientX-b.left-b.width/2,y=e.clientY-b.top-b.height/2;const d=Math.hypot(x,y);if(d>radius){x=x/d*radius;y=y/d*radius;}
      el.style.setProperty('--stick-x',x+'px');el.style.setProperty('--stick-y',y+'px');
      if(x>radius*.28)keys.add('right');if(x<-radius*.28)keys.add('left');if(y>radius*.28)keys.add('down');if(y<-radius*.28)keys.add('up');
    }
    el.addEventListener('pointerdown',e=>{if(pointer!==null||!enabled())return;e.preventDefault();pointer=e.pointerId;el.setPointerCapture(pointer);move(e);},{signal});
    el.addEventListener('pointermove',move,{signal});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(type,e=>{if(e.pointerId===pointer)clear();},{signal});
    window.addEventListener('blur',clear,{signal});signal.addEventListener('abort',clear,{once:true});
  }
  return {stick};
})();

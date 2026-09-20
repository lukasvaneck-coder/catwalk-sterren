/* Pure spelregels: ook zonder browser te controleren. Afstanden zijn spelpixels. */
const ParkourRules = (() => {
  const courses = [
    { id: 'school', icon: '🏫', name: 'Te laat voor school!', times: [20, 29, 42], length: 2600, height: 540,
      desc: 'Race naar school. Kijk uit bij de twee oversteekplaatsen! Een botsing met een auto betekent 5 seconden stilstaan. Over auto’s kun je niet springen.' },
    { id: 'gym', icon: '🏃‍♀️', name: 'Samen naar de gym', times: [11, 16, 25], length: 1216, height: 576,
      desc: 'Vind de weg door het doolhof naar de gym. Je vriendinnen rennen ook! Heggen houden je tegen, ook als je springt. Jouw tijd bepaalt je sterren.' },
    { id: 'dad', icon: '👨', name: 'Sneller dan papa', times: [13, 18, 27], length: 2600, height: 540,
      desc: 'Je loopt vanzelf. Druk steeds opnieuw op Sprint of Enter om je sprintmeter te vullen. Ingedrukt houden telt niet. Kleed papa hieronder ook aan!' },
    { id: 'rain', icon: '🌧️', name: 'Voor de bui thuis', times: [21, 30, 44], length: 2800, height: 540,
      desc: 'Ren naar huis! Spring over de plassen en lage hekjes, of loop eromheen. Natte voeten kosten 2 seconden. Spring met spatie of de springknop.' },
    { id: 'tag', icon: '🌼', name: 'Tikkertje op het gras', times: [14, 22, 34], length: 960, height: 540,
      desc: 'Verzamel de vijf vlaggetjes in volgorde en ga naar de finish. Ontwijk de bewegende vriendinnen! Getikt worden kost 2 seconden; tijdens een sprong kunnen ze je niet tikken.' },
  ];
  const maze = [
    '###################',
    '#.....#...........#',
    '#.###.#.#####.###.#',
    '#...#...#...#...#.#',
    '###.#####.#.###.#.#',
    '#...#.....#.....#.#',
    '#.###.#########.#.#',
    '#...............#.#',
    '###################',
  ];
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  function itemScore(item, course, slot) {
    if (!item) return slot === 'accessories' ? 6 : 0;
    const shape = item.shape, tags = item.tags || [];
    if (slot === 'shoes') {
      if (['sneaker'].includes(shape)) return 10;
      if (['pumps','heels','platform'].includes(shape)) return 1;
      if (shape === 'rainboot') return course === 'rain' ? 9 : 5;
      if (['flipflop','bunny','clog'].includes(shape)) return 3;
      return tags.includes('sport') ? 9 : 5;
    }
    if (slot === 'accessories') {
      if (['sweatband','cap'].includes(shape)) return 10;
      if (['backpack'].includes(shape)) return course === 'school' || course === 'gym' ? 9 : 5;
      if (['cape','fairywings','angelwings','jetpack','umbrella','balloons'].includes(shape) || item.cat === 'hand' || item.cat === 'pet') return 1;
      return 6;
    }
    if (tags.includes('regen') && course === 'rain') return 10;
    if (tags.includes('sport') || ['sportshirt','trackjacket','shorts','sportshorts','joggers','legging'].includes(shape)) return 10;
    if (['ballgown','princess','mermaid','puffer'].includes(shape)) return 2;
    if (shape === 'wideleg') return 4;
    if (['casual','school','dans'].some(t => tags.includes(t))) return 7;
    return 5;
  }
  function outfitScore(outfit, course, catalog) {
    const get = slot => catalog[outfit[slot]];
    const accessories = ['hat','glasses','neck','bag','hand','back','pet'].map(get).filter(Boolean);
    const scores = {
      top: itemScore(get('dress') || get('top'), course, 'top'),
      bottom: itemScore(get('dress') || get('bottom'), course, 'bottom'),
      shoes: itemScore(get('shoes'), course, 'shoes'),
      accessories: accessories.length ? accessories.reduce((sum,it) => sum + itemScore(it,course,'accessories'),0) / accessories.length : 6,
    };
    const total = scores.top * .25 + scores.bottom * .25 + scores.shoes * .35 + scores.accessories * .15;
    return { scores, total, bonus: total * 4, speed: 135 * (1 + total * .04) };
  }
  const starsFor = (time, course) => time <= course.times[0] ? 3 : time <= course.times[1] ? 2 : time <= course.times[2] ? 1 : 0;
  const touches = (p, r, radius = 13) => p.x + radius > r.x && p.x - radius < r.x + r.w && p.y + radius > r.y && p.y - radius < r.y + r.h;
  function mazePath() {
    const queue = [[1,1]], prev = new Map([['1,1', null]]);
    for (let i=0;i<queue.length;i++) {
      const [x,y]=queue[i];
      if(x===17&&y===7)break;
      for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]) {
        const nx=x+dx, ny=y+dy, key=`${nx},${ny}`;
        if(maze[ny]?.[nx]!=='.'||prev.has(key))continue;
        prev.set(key,[x,y]);queue.push([nx,ny]);
      }
    }
    const path=[];let p=[17,7];
    if(!prev.has(p.join(',')))throw new Error('Gymfinish is niet bereikbaar');
    while(p){path.unshift({x:(p[0]+.5)*64,y:(p[1]+.5)*64});p=prev.get(p.join(','));}
    return path;
  }
  function create(courseId, outfit, dadOutfit, catalog) {
    const course=courses.find(c=>c.id===courseId);
    if(!course)throw new Error('Onbekend parkour');
    const state={course, time:0, countdown:3, player:{x:80,y:300}, jump:0, cooldown:0, freeze:0, immune:0,
      energy:0, taps:0, hits:0, checkpoint:0, finished:false, success:false, notice:'', noticeTime:0,
      stats:outfitScore(outfit,courseId,catalog), walls:[], obstacles:[], npcs:[], flags:[], finish:{x:course.length-100,y:300}};
    if(courseId==='gym') {
      maze.forEach((row,y)=>[...row].forEach((ch,x)=>{if(ch==='#')state.walls.push({x:x*64,y:y*64,w:64,h:64});}));
      const path=mazePath();state.player={...path[0]};state.finish={...path[path.length-1]};
      state.npcs=[{x:96,y:96,speed:119,path,index:1,name:'Noor'},{x:96,y:96,speed:108,path,index:1,name:'Lina'}];
    }
    if(courseId==='dad') {
      state.player.y=340; state.finish.y=340;
      state.npcs=[{x:80,y:210,speed:outfitScore(dadOutfit,'dad',catalog).speed*.98,name:'Papa'}];
    }
    if(courseId==='school') state.obstacles=[{x:850,y:0,w:90,h:540,kind:'road'},{x:1720,y:0,w:90,h:540,kind:'road'}];
    if(courseId==='rain') {
      for(let i=0;i<8;i++)state.obstacles.push({x:400+i*280,y:i%2?200:265,w:70,h:120,kind:i%3===2?'hurdle':'puddle'});
    }
    if(courseId==='tag') {
      state.player={x:70,y:440};state.flags=[{x:230,y:130},{x:440,y:420},{x:620,y:120},{x:820,y:400},{x:470,y:260}];
      state.finish={x:870,y:100};
      state.npcs=[{x:380,y:230,name:'Noor'},{x:660,y:280,name:'Lina'},{x:720,y:150,name:'Zoë'}];
    }
    return state;
  }
  function carAt(s, i) { return {x:s.obstacles[i].x+9,y:((s.time*165+i*300)%760)-130,w:72,h:110}; }
  function jump(s) { if(!s.finished&&s.countdown<=0&&s.freeze<=0&&s.cooldown<=0&&s.jump<=0&&s.course.id!=='dad'){s.jump=.8;s.cooldown=1.03;return true;}return false; }
  function tap(s) { if(!s.finished&&s.countdown<=0&&s.freeze<=0){s.energy=clamp(s.energy+.15,0,1);s.taps++;} }
  function hit(s, seconds, message) {
    if(s.immune>0||s.freeze>0)return;
    s.freeze=seconds;s.immune=seconds+1.2;s.hits++;s.notice=message;s.noticeTime=seconds;
  }
  function step(s, dt, input={}) {
    if(s.finished)return;
    dt=clamp(dt,0,1/30);
    if(s.countdown>0){s.countdown=Math.max(0,s.countdown-dt);return;}
    s.time+=dt;s.jump=Math.max(0,s.jump-dt);s.cooldown=Math.max(0,s.cooldown-dt);
    s.freeze=Math.max(0,s.freeze-dt);s.immune=Math.max(0,s.immune-dt);s.noticeTime=Math.max(0,s.noticeTime-dt);
    s.energy=Math.max(0,s.energy-dt*.55);
    for(const [i,n] of s.npcs.entries()) {
      if(n.finished)continue;
      if(s.course.id==='tag') {
        n.x=480+Math.sin(s.time*(.8+i*.13)+i*2)*300;
        n.y=270+Math.sin(s.time*(1.1+i*.17)+i)*170;
      } else if(n.path) {
        const target=n.path[n.index], distance=Math.hypot(target.x-n.x,target.y-n.y), move=n.speed*dt;
        if(distance<=move){n.x=target.x;n.y=target.y;if(n.index<n.path.length-1)n.index++;else n.finished=s.time;}
        else {n.x+=(target.x-n.x)/distance*move;n.y+=(target.y-n.y)/distance*move;}
      } else {n.x=Math.min(s.finish.x,n.x+n.speed*dt);if(n.x>=s.finish.x)n.finished=s.time;}
    }
    if(s.freeze<=0) {
      let dx=s.course.id==='dad'?1:(input.right?1:0)-(input.left?1:0);
      let dy=s.course.id==='dad'?0:(input.down?1:0)-(input.up?1:0);
      const norm=Math.hypot(dx,dy)||1, speed=s.stats.speed*(s.course.id==='dad'?.65+s.energy*1.05:1);
      const move=(axis,amount)=>{const before=s.player[axis];s.player[axis]+=amount;if(s.walls.some(w=>touches(s.player,w)))s.player[axis]=before;};
      move('x',dx/norm*speed*dt);move('y',dy/norm*speed*dt);
      s.player.x=clamp(s.player.x,22,s.course.length-22);s.player.y=clamp(s.player.y,55,s.course.height-25);
      if(s.course.id==='school')s.obstacles.forEach((_,i)=>{if(touches(s.player,carAt(s,i)))hit(s,5,'Auto! Wacht 5 seconden en kijk opnieuw.');});
      if(s.course.id==='rain'&&s.jump<=0)s.obstacles.forEach(o=>{if(touches(s.player,o))hit(s,2,o.kind==='puddle'?'Natte voeten! Even uitschudden.':'Oeps, een hekje! Spring eroverheen.');});
      if(s.course.id==='tag') {
        if(s.jump<=0&&s.npcs.some(n=>Math.hypot(s.player.x-n.x,s.player.y-n.y)<29))hit(s,2,'Getikt! Even wachten…');
        const flag=s.flags[s.checkpoint];if(flag&&Math.hypot(s.player.x-flag.x,s.player.y-flag.y)<34)s.checkpoint++;
      }
    }
    const atFinish=s.course.id==='dad'?s.player.x>=s.finish.x:Math.hypot(s.player.x-s.finish.x,s.player.y-s.finish.y)<38;
    if(atFinish&&s.freeze<=0&&s.checkpoint>=s.flags.length){s.finished=true;s.success=true;}
    if(s.time>s.course.times[2]){s.finished=true;s.success=false;}
  }
  return {courses,maze,mazePath,outfitScore,itemScore,starsFor,touches,create,step,jump,tap,carAt};
})();

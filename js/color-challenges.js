const ColorChallenges = (() => {
  const wheel=['rood','oranje','geel','groen','blauw','paars'];
  const slots=['top','bottom','dress','shoes','hat','glasses','neck','bag','hand','back'];
  function palettes(rule, owned, catalog) {
    const items=owned.map(id=>catalog[id]).filter(Boolean);
    const options=rule==='mono'? [...wheel,'roze'].map(c=>[c]):wheel.map((c,i)=>[c,wheel[(i+(rule==='tegenover'?3:1))%6]]);
    return options.filter(colors=>{
      const allowed=i=>colors.includes(i.hue)||HUES[i.hue]?.neutral;
      const garments=items.filter(i=>['top','bottom','dress'].includes(i.cat)&&colors.includes(i.hue));
      if(!garments.length)return false;
      // Zoek een complete outfit die de doelkleuren kan dragen, zonder dubbele slots.
      let masks=new Set([0]);
      for(const slot of slots){
        const choices=items.filter(i=>i.cat===slot&&allowed(i));
        const next=new Set(masks);
        for(const mask of masks)for(const item of choices){
          if(slot==='dress'&&(mask&24))continue;
          if(['top','bottom'].includes(slot)&&(mask&32))continue;
          const color=colors.indexOf(item.hue), bit=color<0?0:1<<color;
          const body=slot==='top'?8:slot==='bottom'?16:slot==='dress'?32:slot==='shoes'?64:0;
          const core=['top','bottom','dress'].includes(slot)&&color>=0?128:0;
          next.add(mask|bit|body|core);
        }
        masks=next;
      }
      return [...masks].some(m=>(m&((1<<colors.length)-1))===((1<<colors.length)-1)&&(m&64)&&(m&128)&&((m&32)||(m&24)===24));
    });
  }
  function lesson(theme) {
    const names=(theme.colors||[]).map(c=>HUES[c].label).join(' en ');
    if(theme.rule==='mono')return `Eén kleur, verschillende tinten: licht en donker ${names} horen bij dezelfde kleurfamilie. Kies minstens één top, broek, rok of jurk in de doelkleur. Neutrale kleuren mogen erbij.`;
    if(theme.rule==='buren')return `${names} staan naast elkaar op het kleurenwiel. Zulke buurkleuren geven een rustige combinatie. Gebruik allebei, met minstens één doelkleur in je bovenkleding, onderkleding of jurk.`;
    if(theme.rule==='tegenover')return `${names} staan tegenover elkaar op het kleurenwiel. Ze maken elkaar opvallender! Gebruik allebei, met minstens één doelkleur in je bovenkleding, onderkleding of jurk.`;
    if(theme.multiColor)return 'Bij deze opdracht mag je veel verschillende kleuren combineren. Herhaal een kleur in bijvoorbeeld je shirt en schoenen om je outfit samenhang te geven.';
    if(names)return `Zoek ${names} in je kast. Licht en donker van dezelfde kleur passen bij elkaar; met wit, zwart of grijs laat je de gevraagde kleuren extra opvallen.`;
    return 'Kies één of twee hoofdkleuren en herhaal die in je outfit. Wit, zwart en grijs geven rust. Kleuren hoeven niet altijd hetzelfde te zijn: je mag experimenteren!';
  }
  function assess(outfit, theme, catalog) {
    const worn=slots.filter(s=>!outfit.dress||!['top','bottom'].includes(s)).map(s=>catalog[outfit[s]]).filter(Boolean);
    const chromatic=worn.filter(i=>!HUES[i.hue]?.neutral);
    const wrong=chromatic.filter(i=>!theme.colors.includes(i.hue));
    const missing=theme.colors.filter(c=>!worn.some(i=>i.hue===c));
    const main=worn.some(i=>['top','bottom','dress'].includes(i.cat)&&theme.colors.includes(i.hue));
    const weight=i=>['top','bottom','dress'].includes(i.cat)?4:i.cat==='shoes'?2:1;
    const sum=chromatic.reduce((n,i)=>n+weight(i),0);
    const purity=sum?1-wrong.reduce((n,i)=>n+weight(i),0)/sum:0;
    let score=purity*(1-missing.length/theme.colors.length);
    if(!main)score=Math.min(score,.3);
    const dress=catalog[outfit.dress], top=catalog[outfit.top], bottom=catalog[outfit.bottom];
    const complete=(dress || top?.full ? .7 : (top ? .35 : 0)+(bottom ? .35 : 0))+(catalog[outfit.shoes] ? .3 : 0);
    const feedback=[];
    if(missing.length)feedback.push(`Nog toevoegen: ${missing.map(c=>HUES[c].label).join(' en ')}.`);
    if(!main)feedback.push('Kies ook een top, broek, rok of jurk in een doelkleur; alleen een accessoire is niet genoeg.');
    if(wrong.length)feedback.push(`Probeer een andere kleur voor: ${wrong.map(i=>i.name).join(', ')}.`);
    if(complete<1)feedback.push('Maak je outfit compleet: boven- en onderkleding (of een jurk) én schoenen.');
    if(!feedback.length)feedback.push('Je draagt alle doelkleuren en je outfit is compleet. Mooi gematcht!');
    return {score,complete,feedback};
  }
  return {palettes,lesson,assess};
})();

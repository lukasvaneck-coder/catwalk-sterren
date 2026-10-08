const LearningChallenges = (() => {
  const long=['pants','joggers','legging','wideleg'];
  const warm=['sweater','turtleneck','hoodie','cardigan','puffer','leather','trackjacket','raincoat'];
  const closed=['sneaker','boot','rainboot','snowboot','pirateboot','spaceboot'];
  function checks(outfit,theme,catalog) {
    const get=s=>catalog[outfit[s]], top=get('dress')||get('top'), bottom=get('bottom'), shoes=get('shoes'), hat=get('hat');
    const shape=(it,list)=>!!it&&list.includes(it.shape);
    const full=!!get('dress')||!!get('top')&&(!!bottom||get('top').full);
    const complete=!!(full&&shoes);
    if(!theme.weather){
      const worn=['top','bottom','dress','shoes','hat','neck','bag','hand'].filter(s=>!get('dress')||!['top','bottom'].includes(s)).map(get).filter(Boolean);
      return [{label:'Een bovenkant met broek of rok (of een jurk) en schoenen',ok:complete},
        {label:'Iets dat past bij de opdracht',ok:worn.some(i=>['top','bottom','dress','shoes'].includes(i.cat)&&i.tags.some(t=>theme.wants.includes(t)))}];
    }
    const list=[{label:'Een bovenkant met broek of rok (of een jurk) en schoenen',ok:complete}];
    if(theme.weather==='sun')return [...list,{label:'Een dun shirtje of een zomerjurk',ok:shape(top,['tshirt','tank','polo','sundress'])||!!top?.tags.includes('zomer')},
      {label:'Sandalen, slippers of sneakers',ok:shape(shoes,['sneaker','sandal','flipflop'])},{label:'Een pet of zonnehoed',ok:shape(hat,['cap','sunhat','bucket'])}];
    list.push({label:theme.weather==='rain'?'Een regenjas of paraplu':'Een warme trui of jas',ok:theme.weather==='rain'?shape(top,['raincoat'])||shape(get('hand'),['umbrella']):shape(top,warm)},
      {label:'Een lange broek',ok:!get('dress')&&shape(bottom,long)},
      {label:theme.weather==='rain'?'Regenlaarzen':theme.weather==='snow'?'Laarzen':'Dichte schoenen',ok:shape(shoes,theme.weather==='rain'?['rainboot']:theme.weather==='snow'?['snowboot','boot']:closed)});
    if(theme.weather==='snow')list.push({label:'Een warme muts',ok:shape(hat,['beanie','santa'])});
    if(theme.weather==='wind')list.push({label:'Geen zonnehoed of paraplu: die waaien weg!',ok:!shape(hat,['sunhat','bucket','partyhat','beret'])&&!shape(get('hand'),['umbrella'])});
    return list;
  }
  function startBudget(theme){return {themeId:theme.id,spent:0,purchases:[]};}
  function purchaseError(theme,run,price){
    if(!run||run.themeId!==theme.id)return 'Start eerst deze budgetopdracht opnieuw.';
    if(run.purchases.length>=theme.maxBuys)return `Je hebt al ${theme.maxBuys} nieuwe ${theme.maxBuys===1?'ding':'dingen'} gekocht. Kies de rest uit je eigen kast.`;
    if(run.spent+price>theme.budget)return `Te duur! Je mag nog maar ${theme.budget-run.spent} munten uitgeven.`;
    return '';
  }
  function assess(outfit,theme,catalog,run){
    const list=checks(outfit,theme,catalog);
    if(theme.learning==='budget')list.push({label:`Niet meer dan ${theme.budget} munten uitgegeven en hoogstens ${theme.maxBuys} ${theme.maxBuys===1?'ding':'dingen'} gekocht`,ok:!!run&&run.themeId===theme.id&&run.spent<=theme.budget&&run.purchases.length<=theme.maxBuys});
    const total=Math.round(10*list.filter(c=>c.ok).length/list.length*10)/10;
    const complete=list[0].ok;
    const stars=complete&&list.every(c=>c.ok)?3:complete&&total>=5.8?2:1;
    return {total,stars,list,feedback:list.filter(c=>!c.ok).map(c=>'Probeer nog: '+c.label+'.')};
  }
  return {checks,startBudget,purchaseError,assess};
})();

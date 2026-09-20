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
      return [{label:'Een complete outfit: boven en onder (of een jurk) en schoenen',ok:complete},
        {label:'Minstens één kledingstuk dat bij het uitje past',ok:worn.some(i=>['top','bottom','dress','shoes'].includes(i.cat)&&i.tags.some(t=>theme.wants.includes(t)))}];
    }
    const list=[{label:'Een complete outfit',ok:complete}];
    if(theme.weather==='sun')return [...list,{label:'Luchtige bovenkleding of een zomerjurk',ok:shape(top,['tshirt','tank','polo','sundress'])||!!top?.tags.includes('zomer')},
      {label:'Lichte schoenen',ok:shape(shoes,['sneaker','sandal','flipflop'])},{label:'Een pet of zonnehoed',ok:shape(hat,['cap','sunhat','bucket'])}];
    list.push({label:theme.weather==='rain'?'Een regenjas of paraplu':'Warme, bedekkende bovenkleding',ok:theme.weather==='rain'?shape(top,['raincoat'])||shape(get('hand'),['umbrella']):shape(top,warm)},
      {label:'Een lange broek',ok:!get('dress')&&shape(bottom,long)},
      {label:theme.weather==='rain'?'Regenlaarzen':theme.weather==='snow'?'Warme of stevige laarzen':'Dichte schoenen',ok:shape(shoes,theme.weather==='rain'?['rainboot']:theme.weather==='snow'?['snowboot','boot']:closed)});
    if(theme.weather==='snow')list.push({label:'Een warme muts',ok:shape(hat,['beanie','santa'])});
    if(theme.weather==='wind')list.push({label:'Geen losse hoed of paraplu in de wind',ok:!shape(hat,['sunhat','bucket','partyhat','beret'])&&!shape(get('hand'),['umbrella'])});
    return list;
  }
  function startBudget(theme){return {themeId:theme.id,spent:0,purchases:[]};}
  function purchaseError(theme,run,price){
    if(!run||run.themeId!==theme.id)return 'Start eerst deze budgetopdracht opnieuw.';
    if(run.purchases.length>=theme.maxBuys)return `Je hebt al ${theme.maxBuys} nieuwe spullen gekocht. Combineer nu met je eigen kast.`;
    if(run.spent+price>theme.budget)return `Dat past niet: je hebt nog ${theme.budget-run.spent} munten opdrachtbudget over.`;
    return '';
  }
  function assess(outfit,theme,catalog,run){
    const list=checks(outfit,theme,catalog);
    if(theme.learning==='budget')list.push({label:`Binnen ${theme.budget} munten en maximaal ${theme.maxBuys} aankopen`,ok:!!run&&run.themeId===theme.id&&run.spent<=theme.budget&&run.purchases.length<=theme.maxBuys});
    const total=Math.round(10*list.filter(c=>c.ok).length/list.length*10)/10;
    const complete=list[0].ok;
    const stars=complete&&list.every(c=>c.ok)?3:complete&&total>=5.8?2:1;
    return {total,stars,list,feedback:list.filter(c=>!c.ok).map(c=>'Probeer nog: '+c.label+'.')};
  }
  return {checks,startBudget,purchaseError,assess};
})();

const Kitchen = (() => {
  const R=KitchenRules;
  let P,cb,place,theme='Snackbar',chosen='fries',cart={},message='',saveFailed=false;
  const $=s=>document.querySelector(s);
  function show(profile,destination,callbacks){P=profile;cb=callbacks;place=destination;R.migrate(P);cart={};wanted={};message='';render();}
  function change(fn){saveFailed=false;const before=JSON.stringify({coins:P.coins,kitchen:P.kitchen});const result=fn();if(!result)return false;if(cb.save()===false){saveFailed=true;Object.assign(P,JSON.parse(before));message='Opslaan lukt niet. Probeer het nog eens; je munten en ingrediënten zijn behouden.';return false;}return result;}
  const recipe=()=>R.recipes.find(r=>r.id===(P.kitchen.active?.id||chosen));
  function render(resume=false){
    const roomState=resume?KitchenRoom.capture():null;KitchenRoom.unmount();Supermarket.unmount();
    const shop=place==='supermarkt';document.body.classList.toggle('in-supermarket',shop);document.body.classList.toggle('in-kitchen-play',!shop&&!!P.kitchen.active);
    $('#kitchen').innerHTML=`<div class="food-shell ${!shop?'in-kitchen':''} ${!shop&&P.kitchen.active?'is-cooking':''}"><header class="food-header"><button class="btn ghost sm" id="food-exit">← Dorp</button><div><small>SAMEN THUIS · OP JE EIGEN TEMPO</small><h1>${shop?'🛒 De buurtsuper':'🏡 Onze thuiskeuken'}</h1></div><b>🪙 ${P.coins}</b></header><nav class="food-tabs"><button class="btn ${shop?'ghost':'mint'}" id="food-home">🍳 Thuis koken</button><button class="btn ${shop?'mint':'ghost'}" id="food-shop">🛒 Boodschappen</button><span>🍽️ ${P.kitchen.served} keer samen gegeten</span></nav><p class="food-message" role="status">${message||'Geen klok, geen haast. Maak iets lekkers voor thuis.'}</p>${shop?shopHTML():homeHTML()}<details class="food-stock"><summary>🧺 Mijn voorraad thuis</summary><div>${Object.entries(R.ingredients).map(([id,v])=>`<span>${v[0]} ${v[1]} <b>× ${P.kitchen.stock[id]}</b></span>`).join('')}</div></details></div>`;
    $('#food-exit').onclick=()=>cb.exit();$('#food-home').onclick=()=>{place='keuken';message='';render();};$('#food-shop').onclick=()=>{place='supermarkt';message='';render();};
    if(shop)bindShop();else bindHome(roomState);
  }
  function homeHTML(){
    const r=recipe(),a=P.kitchen.active,s=a?r.steps[a.step]:null;
    return `<div class="food-layout ${a?'cooking':''}">${KitchenRoom.html(P)}<aside class="food-panel">${a?`<details class="kr-recipe-help"><summary>📖 Kookhulp · ${r.name}</summary><p>Je mag taken tegelijk voorbereiden. Laat de pannen koken terwijl je snijdt of een bord haalt.</p><h3>${s[1]}</h3><ul class="kr-needed">${R.flows[r.id][a.step].map(id=>{const item=a.items.find(v=>v.id===id),info=R.itemInfo(r,id);return `<li>${info.icon} ${info.name}<small>${!item?'Nog bereiden':item.at==='hands'?'In je handen':item.at==='pantry'?'Bij de voorraad':'Op: '+R.stations[item.at][1]}</small></li>`;}).join('')}</ul><p>Haal een schoon bord bij de bordenstapel en zet het bij Opdienen. Na het eten breng je het vuile bord van de eettafel naar de afwas. Alle voortgang blijft bewaard.</p></details>`:`<small>VANAVOND BIJ ONS THUIS</small><h2>Kies je keuken</h2><div class="food-themes">${[...new Set(R.recipes.map(r=>r.theme))].map(t=>`<button class="btn sm ${theme===t?'mint':'ghost'}" data-theme="${t}" aria-pressed="${theme===t}">${t}</button>`).join('')}</div><div class="food-recipes">${R.recipes.filter(r=>r.theme===theme).map(v=>`<button class="food-recipe ${chosen===v.id?'selected':''}" data-recipe="${v.id}" aria-pressed="${chosen===v.id}">${v.icon} ${v.name}</button>`).join('')}</div><h3>${r.icon} ${r.name}</h3><ul class="food-needs">${Object.entries(r.needs).map(([id,n])=>`<li>${R.ingredients[id][0]} ${n} × ${R.ingredients[id][1]} <b>${P.kitchen.stock[id]>=n?'✓':'nog '+(n-P.kitchen.stock[id])+' nodig'}</b></li>`).join('')}</ul><button class="btn" id="food-start" ${R.missing(P,r).length?'disabled':''}>🍳 Ingrediënten pakken & koken</button>${R.missing(P,r).length?'<p>Je hebt nog boodschappen nodig.</p><button class="btn mint" id="food-list">📝 Maak mijn boodschappenlijst</button>':''}${P.kitchen.last?`<div class="food-dinner">🌷 Laatst op tafel: ${R.recipes.find(v=>v.id===P.kitchen.last).name}. Eet smakelijk!</div>`:''}`}</aside></div>`;
  }
  function bindHome(roomState){
    document.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>{theme=b.dataset.theme;chosen=R.recipes.find(r=>r.theme===theme).id;message='';render();});
    document.querySelectorAll('[data-recipe]').forEach(b=>b.onclick=()=>{chosen=b.dataset.recipe;render();});
    $('#food-start')?.addEventListener('click',()=>{if(change(()=>R.start(P,chosen))){message='Pak ingrediënten uit de voorraad en volg de pictogrammen op het recept.';}render();});
    $('#food-list')?.addEventListener('click',()=>{cart=Object.fromEntries(R.missing(P,recipe()).map(v=>[v.id,v.n]));place='supermarkt';message='De ontbrekende ingrediënten staan op je lijst. Zoek ze in de schappen en leg ze in je mandje.';wanted={...cart};cart={};render();});
    KitchenRoom.mount(P,{change,persist:()=>cb.save(),update:text=>{message=text;render(true);},notice:text=>{if(!saveFailed)message=text;saveFailed=false;render(true);}},roomState);
  }
  let wanted={};
  function shopHTML(){return Supermarket.html();}
  function bindShop(){Supermarket.mount(P,{
    cart:()=>cart,wanted:()=>wanted,
    add:id=>{if((cart[id]||0)<99)cart[id]=(cart[id]||0)+1;},
    remove:id=>{if(--cart[id]<=0)delete cart[id];},
    pay:()=>{if(!change(()=>R.buy(P,cart)))return false;cart={};wanted={};message='🛍️ Betaald! Je boodschappen liggen thuis klaar.';document.querySelector('.food-message').textContent=message;document.querySelector('.food-stock>div').innerHTML=Object.entries(R.ingredients).map(([id,v])=>`<span>${v[0]} ${v[1]} <b>× ${P.kitchen.stock[id]}</b></span>`).join('');Sound.play('ding');return true;}
  });}
  function hide(){Supermarket.unmount();document.body.classList.remove('in-kitchen-play','in-supermarket');KitchenRoom.unmount();if(P)cb.save();}
  return {show,hide};
})();

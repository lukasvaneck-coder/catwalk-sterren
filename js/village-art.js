/* Een samenhangende dorpsillustratie. De gebouwen delen hun exacte plaats met het loopraster. */
const VillageArt = (() => {
  const R=TownRules;
  const trees=[[130,250],[580,235],[1000,230],[1420,240],[1830,260],[2350,400],[220,720],[480,760],[900,780],[1350,850],[1870,800],[2340,950],[130,1210],[710,1280],[1140,1320],[1770,1360],[2340,1330],[180,1660],[740,1680],[1260,1700],[2310,1690],[1790,1600]];
  function tree(x,y,s=1) {return `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="15" cy="18" rx="50" ry="18" fill="#547552" opacity=".16"/><path d="M-8 12L-5-60H9L12 12Z" fill="#997b5c"/><path d="M2-10L-24-39M3-20L30-49" stroke="#997b5c" stroke-width="8" stroke-linecap="round"/><ellipse cy="-72" rx="49" ry="45" fill="#71985e"/><circle cx="-26" cy="-60" r="34" fill="#83aa6b"/><circle cx="25" cy="-64" r="36" fill="#8fb775"/><circle cy="-89" r="34" fill="#9bc47e"/><path d="M-22-106Q0-125 23-106" fill="none" stroke="#b5d991" stroke-width="9" stroke-linecap="round"/></g>`;}
  function base() {
    const paths=R.PATHS.map(points=>`<polyline points="${points.map(p=>p.join(',')).join(' ')}"/>`).join('');
    let flowers='';for(let i=0;i<200;i++){const x=80+(i*397)%2320,y=150+(i*283)%1530;if(!R.walkable(x,y))continue;flowers+=`<g transform="translate(${x},${y})"><path d="M0 7V0M0 5L5 2" stroke="#74975f" stroke-width="2"/><circle r="3.6" fill="${['#efcbbb','#f8e8ab','#fcf7e7','#e8c2d4'][i%4]}"/><circle r="1.2" fill="#d7ae58"/></g>`;}
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${R.WIDTH}" height="${R.HEIGHT}" viewBox="0 0 ${R.WIDTH} ${R.HEIGHT}" aria-hidden="true">
      <defs><pattern id="meadow" width="96" height="83" patternUnits="userSpaceOnUse"><rect width="96" height="83" fill="#abc78c"/><path d="M12 30l2-4 3 4M64 67l2-4 3 4" fill="none" stroke="#9dbc7e" stroke-width="1.5"/><circle cx="47" cy="18" r="2" fill="#b6cf98"/></pattern><linearGradient id="water" x2="0" y2="1"><stop stop-color="#8dbcc1"/><stop offset="1" stop-color="#b9d8cc"/></linearGradient></defs>
      <rect width="2480" height="1760" fill="url(#meadow)"/>
      <path d="M20 100Q630 15 1220 95T2460 80M28 1690Q440 1750 980 1720T2430 1710" fill="none" stroke="#8faa75" stroke-width="62" stroke-linecap="round"/>
      <rect x="180" y="230" width="1135" height="465" rx="150" fill="#d4d7a0" opacity=".45"/>
      <ellipse cx="640" cy="1400" rx="525" ry="320" fill="#b4cd97"/>
      <g fill="none" stroke="#8aa46e" stroke-width="92" stroke-linejoin="round" stroke-linecap="round" opacity=".35">${paths}</g>
      <g fill="none" stroke="#e5d4ad" stroke-width="80" stroke-linejoin="round" stroke-linecap="round">${paths}</g>
      <g fill="none" stroke="#efdfbc" stroke-width="64" stroke-linejoin="round" stroke-linecap="round">${paths}</g>
      <g fill="none" stroke="#f9edce" stroke-width="2" stroke-dasharray="3 13" stroke-linecap="round">${paths}</g>
      <ellipse cx="1680" cy="948" rx="190" ry="163" fill="#789666" opacity=".4"/>
      <ellipse cx="1680" cy="940" rx="184" ry="162" fill="#d9d5af"/><ellipse cx="1680" cy="940" rx="172" ry="152" fill="url(#water)"/>
      <path d="M1565 868q50-17 90-3m60 165q35-13 64-3M1545 1000q36-14 63-3m79-154q26-11 51-2" stroke="#e5eee0" stroke-width="5" fill="none" stroke-linecap="round" opacity=".65"/>
      <g transform="translate(1650 882)"><ellipse rx="21" ry="11" fill="#739c75"/><path d="M0 0l15-10" stroke="#9ec192" stroke-width="2"/><circle cx="-3" cy="-4" r="5" fill="#ecc5d6"/></g>
      <g transform="translate(1758 1035)"><ellipse rx="16" ry="9" fill="#80a67e"/><circle cy="-4" r="5" fill="#f2d0d7"/></g>
      <g><rect x="1490" y="928" width="388" height="67" rx="9" fill="#ad8663"/><path d="M1500 934H1866M1500 990H1866" stroke="#ebd4a6" stroke-width="8"/>${Array.from({length:17},(_,i)=>`<path d="M${1504+i*22} 939v43" stroke="#cfad82" stroke-width="2"/>`).join('')}<path d="M1497 930v-24m75 24v-24m75 24v-24m75 24v-24m75 24v-24m75 24v-24M1497 909h375" stroke="#987452" stroke-width="7" stroke-linecap="round"/></g>
      <ellipse cx="1050" cy="661" rx="112" ry="47" fill="#cabd9a"/><ellipse cx="1050" cy="651" rx="99" ry="38" fill="#f3e8cc"/><ellipse cx="1050" cy="651" rx="82" ry="27" fill="#8fbec3"/><path d="M1037 646v-30h26v30" fill="#dbd2b9"/><ellipse cx="1050" cy="614" rx="33" ry="13" fill="#eee4cd"/><ellipse cx="1050" cy="611" rx="26" ry="8" fill="#9bcdd1"/><path d="M1050 610v-35m0 0q-24-14-24 17m24-17q24-14 24 17" fill="none" stroke="#ddf4ed" stroke-width="4" stroke-linecap="round"/>
      ${flowers}${trees.map(([x,y],i)=>tree(x,y,.8+i%3*.15)).join('')}
      ${[[770,655],[1265,690],[1360,1140],[1930,1170],[670,1520],[1760,1630]].map(([x,y])=>`<g transform="translate(${x} ${y})"><path d="M-33 2v18m66-18v18" stroke="#7f826b" stroke-width="6"/><rect x="-40" y="-15" width="80" height="23" rx="5" fill="#c1976c"/><path d="M-35-7h70M-37 2h74" stroke="#e4c9a4" stroke-width="3"/></g>`).join('')}
      <g font-family="Trebuchet MS, sans-serif" font-weight="bold" fill="#667c53" font-size="20" letter-spacing="4" text-anchor="middle"><text x="795" y="175">MODEPLEIN</text><text x="2100" y="200">SPEELBUURT</text><text x="400" y="1190">WANDELPARK</text><text x="1735" y="1190">FEESTBUURT</text></g>
      <g transform="translate(720 1190)"><ellipse rx="88" ry="41" fill="#98b97f"/><path d="M-45 15V-40m90 55V-40M-50-40H50" stroke="#c2a177" stroke-width="8" stroke-linecap="round"/><path d="M-49-45Q0-99 49-45" fill="none" stroke="#759963" stroke-width="24"/><g fill="#f0c9ca"><circle cx="-38" cy="-59" r="8"/><circle cx="-9" cy="-72" r="7"/><circle cx="22" cy="-67" r="8"/><circle cx="43" cy="-48" r="6"/></g></g>
    </svg>`;
  }
  function building(h) {
    const w=h.w,H=h.h,c=h.color,shop=['winkel','atelier','salon','foto'].includes(h.id),hall=['speeltuin','race','disco'].includes(h.id),ball=h.id==='balzaal';
    const windowAt=(x,y,ww=32,hh=42)=>`<rect x="${x}" y="${y}" width="${ww}" height="${hh}" rx="${hall?9:16}" fill="#789ea5" stroke="#fff4dc" stroke-width="6"/><path d="M${x+ww/2} ${y+2}v${hh-4}M${x+3} ${y+hh/2}h${ww-6}" stroke="#ddd4b9" stroke-width="3"/><path d="M${x+5} ${y+hh-7}l${ww-12}-${hh-16}" stroke="#bfdbd3" stroke-width="4" opacity=".6"/>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${H}" width="${w}" height="${H}" aria-hidden="true">
      <ellipse cx="${w/2+8}" cy="${H-13}" rx="${w*.46}" ry="13" fill="#58724b" opacity=".25"/>
      <rect x="22" y="${H*.34}" width="${w-44}" height="${H*.62}" rx="9" fill="#f6e6c8" stroke="#cfbfa4" stroke-width="2"/>
      <path d="M${w-44} ${H*.35}h22v${H*.6}h-22" fill="#dbc7a6"/>
      <rect x="${w*.7}" y="${H*.1}" width="22" height="48" rx="3" fill="#ddc4ae"/><rect x="${w*.7-3}" y="${H*.1}" width="28" height="9" rx="3" fill="#b9927d"/>
      ${hall?`<path d="M7 ${H*.39}L29 40Q${w/2} 5 ${w-29} 40L${w-7} ${H*.39}Z" fill="${c}" stroke="#715e67" stroke-width="2"/>`:`<path d="M8 ${H*.43}L${w/2} 17L${w-8} ${H*.43}Z" fill="${c}" stroke="#856e73" stroke-width="2"/>`}
      <path d="M15 ${H*.43}H${w-15}" stroke="#fff3d9" stroke-width="10" stroke-linecap="round"/>
      <path d="M25 ${H*.38}H${w-25}M45 ${H*.29}H${w-45}" stroke="#ffffff" opacity=".15" stroke-width="4"/>
      ${!hall?`<circle cx="${w/2}" cy="${H*.26}" r="15" fill="#f5eacb"/><circle cx="${w/2}" cy="${H*.26}" r="10" fill="#76989f"/><path d="M${w/2-8} ${H*.26}h16m-8-8v16" stroke="#e2d6b7" stroke-width="2"/>`:''}
      ${windowAt(40,H*.53,ball?45:33,46)}${windowAt(w-(ball?86:73),H*.53,ball?45:33,46)}
      <rect x="${w/2-24}" y="${H-80}" width="48" height="69" rx="21" fill="${c}" stroke="#fff4df" stroke-width="5"/><rect x="${w/2-14}" y="${H-68}" width="28" height="27" rx="12" fill="#b6d2cb"/><circle cx="${w/2+13}" cy="${H-36}" r="3" fill="#e9c770"/>
      <rect x="${w/2-37}" y="${H-16}" width="74" height="10" rx="5" fill="#e8d8b7"/>
      ${shop?`<g><path d="M30 ${H*.49}h${w-60}l7 24H23Z" fill="${c}"/>${Array.from({length:5},(_,i)=>`<path d="M${32+i*(w-64)/5} ${H*.49}h${(w-64)/10}l3 24h-${(w-64)/10+3}Z" fill="#fff1d7"/>`).join('')}<path d="M24 ${H*.49+24}h${w-48}" stroke="#b89981" stroke-width="2"/></g>`:''}
      <g transform="translate(${w/2} ${hall?H*.29:H*.48})"><rect x="-27" y="-18" width="54" height="36" rx="12" fill="#fff7df" stroke="#c9ad86" stroke-width="2"/><text text-anchor="middle" dominant-baseline="central" font-size="24">${h.icon}</text></g>
      ${h.id==='race'?`<path d="M33 65V15m${w-66} 50V15" stroke="#785f5e" stroke-width="4"/><path d="M33 15h34v23H33m${w-66}-23h-34v23h34" fill="#f7f0d8"/><path d="M33 15h11v11H33m22 0h12v12H55m${w-55}-23h11v11h-11m-11 11h11v11h-11" fill="#6c6572"/>`:''}
      ${h.id==='speeltuin'?`<path d="M${w-28} 130q24 8 24 35v27" fill="none" stroke="#dfa471" stroke-width="12"/><circle cx="38" cy="${H-25}" r="13" fill="#e4b578"/><circle cx="55" cy="${H-24}" r="10" fill="#b5c584"/>`:''}
      ${ball?`<path d="M32 125Q${w/2} 180 ${w-32} 125" fill="none" stroke="#8b9072" stroke-width="2"/>${Array.from({length:7},(_,i)=>`<path d="M${48+i*40} ${132+Math.sin(i/6*Math.PI)*24}l12 3-8 15Z" fill="${i%2?'#e4b7b9':'#e5d39c'}"/>`).join('')}`:''}
      <g fill="#83a46b"><ellipse cx="27" cy="${H-24}" rx="19" ry="15"/><ellipse cx="${w-28}" cy="${H-24}" rx="19" ry="15"/></g><g fill="#efc3c1"><circle cx="23" cy="${H-33}" r="4"/><circle cx="33" cy="${H-22}" r="4"/><circle cx="${w-33}" cy="${H-32}" r="4"/><circle cx="${w-21}" cy="${H-23}" r="4"/></g>
    </svg>`;
  }
  return {base,building};
})();

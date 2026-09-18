/* ============================================================
   Catwalk Sterren — speldata
   Alles wat je kunt aanpassen zonder te tekenen: items, thema's,
   jury, levels. Elk item heeft:
     id      unieke naam
     cat     slot (hair, top, bottom, dress, shoes, hat, glasses,
             neck, bag, hand, back, pet, mk_eyes, mk_lips, mk_blush,
             mk_face, bg)
     shape   tekenfunctie in avatar.js
     name    Nederlandse naam
     c       kleuren (hex)
     tags    waar past dit bij (zie TAGS)
     glam    0 = simpel … 3 = super glamour
     hue     kleurfamilie voor de kleurenjury
     lvl     level waarop het vrijkomt
   ============================================================ */

const TAGS = {
  casual:   { label: 'Casual',     emoji: '👕' },
  school:   { label: 'School',     emoji: '🏫' },
  zomer:    { label: 'Zomer',      emoji: '☀️' },
  strand:   { label: 'Strand',     emoji: '🏖️' },
  sport:    { label: 'Sport',      emoji: '⚽' },
  winter:   { label: 'Winter',     emoji: '❄️' },
  warm:     { label: 'Warm',       emoji: '🧣' },
  feest:    { label: 'Feest',      emoji: '🎉' },
  chic:     { label: 'Chic',       emoji: '💎' },
  regen:    { label: 'Regen',      emoji: '🌧️' },
  stoer:    { label: 'Stoer',      emoji: '🎸' },
  muziek:   { label: 'Muziek',     emoji: '🎵' },
  bloemen:  { label: 'Bloemen',    emoji: '🌸' },
  sprookje: { label: 'Sprookje',   emoji: '🦄' },
  eng:      { label: 'Griezelig',  emoji: '🎃' },
  ruimte:   { label: 'Ruimte',     emoji: '🚀' },
  kerst:    { label: 'Kerst',      emoji: '🎄' },
  held:     { label: 'Superheld',  emoji: '🦸' },
  piraat:   { label: 'Piraat',     emoji: '🏴‍☠️' },
  bruiloft: { label: 'Bruiloft',   emoji: '💒' },
};

const HUES = {
  rood:     { label: 'rood',     wheel: 0,    swatch: '#e63946' },
  oranje:   { label: 'oranje',   wheel: 1,    swatch: '#ff8c42' },
  geel:     { label: 'geel',     wheel: 2,    swatch: '#ffd23f' },
  groen:    { label: 'groen',    wheel: 3,    swatch: '#3fbf63' },
  blauw:    { label: 'blauw',    wheel: 4,    swatch: '#3a86ff' },
  paars:    { label: 'paars',    wheel: 5,    swatch: '#8e5bd9' },
  roze:     { label: 'roze',     wheel: 5.6,  swatch: '#ff6fb5' },
  wit:      { label: 'wit',      neutral: true, swatch: '#ffffff' },
  zwart:    { label: 'zwart',    neutral: true, swatch: '#222222' },
  grijs:    { label: 'grijs',    neutral: true, swatch: '#9a9a9a' },
  bruin:    { label: 'bruin',    neutral: true, swatch: '#8b5a2b' },
  goud:     { label: 'goud',     neutral: true, swatch: '#f1c232' },
  zilver:   { label: 'zilver',   neutral: true, swatch: '#c9d1dc' },
  multi:    { label: 'kleurrijk', multi: true, swatch: 'linear-gradient(90deg,#ff5c5c,#ffe94d,#5fe38a,#5aaeff,#c47bff)' },
};

/* ---------- Uiterlijk van het model (altijd vrij) ---------- */
const SKINS = [
  { id: 's1', c: '#fde7d2', shade: '#f2cbb0' },
  { id: 's2', c: '#f6d3b3', shade: '#e6b592' },
  { id: 's3', c: '#e5b08a', shade: '#d0956d' },
  { id: 's4', c: '#c98a5e', shade: '#b07048' },
  { id: 's5', c: '#9c6540', shade: '#84512f' },
  { id: 's6', c: '#6b4429', shade: '#55331c' },
];
const EYES = [
  { id: 'e1', c: '#5b3a1e', name: 'bruin' },
  { id: 'e2', c: '#2f6fbf', name: 'blauw' },
  { id: 'e3', c: '#3f9a55', name: 'groen' },
  { id: 'e4', c: '#7a7f8a', name: 'grijs' },
  { id: 'e5', c: '#b0782f', name: 'amber' },
  { id: 'e6', c: '#7d4fc2', name: 'paars' },
];
const HAIR_COLORS = [
  { id: 'blond',   name: 'Blond',        c: '#f2d27a', lvl: 1 },
  { id: 'bruin',   name: 'Bruin',        c: '#8a5a2b', lvl: 1 },
  { id: 'donker',  name: 'Donkerbruin',  c: '#4a2f1d', lvl: 1 },
  { id: 'zwart',   name: 'Zwart',        c: '#23202a', lvl: 1 },
  { id: 'rood',    name: 'Rood',         c: '#c9562b', lvl: 1 },
  { id: 'roze',    name: 'Roze',         c: '#ff7bc0', lvl: 4 },
  { id: 'blauw',   name: 'Blauw',        c: '#4fa3ff', lvl: 6 },
  { id: 'paars',   name: 'Paars',        c: '#9b6cf0', lvl: 8 },
  { id: 'groen',   name: 'Mintgroen',    c: '#5fd7a8', lvl: 10 },
  { id: 'zilver',  name: 'Zilver',       c: '#d9dee8', lvl: 12 },
  { id: 'regenboog', name: 'Regenboog',  c: 'rainbow', lvl: 15 },
];

/* ---------- Items ---------- */
const ITEMS = [];
function add(cat, list) {
  for (const it of list) {
    ITEMS.push(Object.assign({ cat, tags: [], glam: 0, c: [], lvl: 1 }, it));
  }
}

// Haarstijlen (kleur kies je apart)
add('hair', [
  { id: 'hair_kort',      shape: 'kort',      name: 'Kort & Stoer',       lvl: 1 },
  { id: 'hair_bob',       shape: 'bob',       name: 'Bob',                lvl: 1 },
  { id: 'hair_lang',      shape: 'lang',      name: 'Lang & Glad',        lvl: 1 },
  { id: 'hair_staart',    shape: 'staart',    name: 'Paardenstaart',      lvl: 2 },
  { id: 'hair_staartjes', shape: 'staartjes', name: 'Twee Staartjes',     lvl: 3 },
  { id: 'hair_krullen',   shape: 'krullen',   name: 'Krullenbol',         lvl: 4 },
  { id: 'hair_knot',      shape: 'knot',      name: 'Knotje',             lvl: 5 },
  { id: 'hair_vlechten',  shape: 'vlechten',  name: 'Vlechtjes',          lvl: 6 },
  { id: 'hair_golvend',   shape: 'golvend',   name: 'Lange Golven',       lvl: 7 },
  { id: 'hair_afro',      shape: 'afro',      name: 'Afro',               lvl: 8 },
  { id: 'hair_spacebuns', shape: 'spacebuns', name: 'Space Buns',         lvl: 9 },
  { id: 'hair_hanenkam',  shape: 'hanenkam',  name: 'Hanenkam',           lvl: 11 },
  { id: 'hair_prinses',   shape: 'prinses',   name: 'Prinsessenkrullen',  lvl: 13 },
]);

// Tops
add('top', [
  { id: 'top_tshirt_rood',  shape: 'tshirt',    name: 'Rood T-shirt',        c: ['#e63946'],            tags: ['casual','school','zomer'], hue: 'rood',  lvl: 1 },
  { id: 'top_tshirt_blauw', shape: 'tshirt',    name: 'Blauw T-shirt',       c: ['#3a86ff'],            tags: ['casual','school','zomer','sport'], hue: 'blauw', lvl: 1 },
  { id: 'top_streep',       shape: 'tshirt',    name: 'Gestreept Shirt',     c: ['#ffffff','#2f5fa8'],  pattern: 'stripes', tags: ['casual','school','strand'], hue: 'blauw', lvl: 1 },
  { id: 'top_trui_geel',    shape: 'sweater',   name: 'Gele Trui',           c: ['#ffd23f'],            tags: ['casual','school','warm'], hue: 'geel', lvl: 1 },
  { id: 'top_hemd_roze',    shape: 'tank',      name: 'Roze Hemdje',         c: ['#ff8fcf'],            tags: ['zomer','strand','casual'], hue: 'roze', lvl: 2 },
  { id: 'top_hartjes',      shape: 'tshirt',    name: 'Hartjes Shirt',       c: ['#fff0f6','#ff5da2'],  pattern: 'hearts', tags: ['feest','casual'], glam: 1, hue: 'roze', lvl: 2 },
  { id: 'top_sport',        shape: 'sportshirt',name: 'Sportshirt',          c: ['#2fd1a8','#ffffff'],  tags: ['sport'], hue: 'groen', lvl: 3 },
  { id: 'top_trainings',    shape: 'trackjacket',name: 'Trainingsjack',      c: ['#3a86ff','#ffffff'],  tags: ['sport','casual'], hue: 'blauw', lvl: 3 },
  { id: 'top_coltrui',      shape: 'turtleneck',name: 'Warme Coltrui',       c: ['#c8553d'],            tags: ['winter','warm','casual'], hue: 'rood', lvl: 4 },
  { id: 'top_winterjas',    shape: 'puffer',    name: 'Winterjas',           c: ['#5aa9e6'],            tags: ['winter','warm'], hue: 'blauw', lvl: 4 },
  { id: 'top_blouse_wit',   shape: 'blouse',    name: 'Witte Blouse',        c: ['#ffffff','#d8d8e0'],  tags: ['chic','school'], glam: 1, hue: 'wit', lvl: 5 },
  { id: 'top_galajasje',    shape: 'tuxedo',    name: 'Galajasje',           c: ['#23202a','#ffffff'],  tags: ['chic','feest','bruiloft'], glam: 3, hue: 'zwart', lvl: 5 },
  { id: 'top_regenjas',     shape: 'raincoat',  name: 'Gele Regenjas',       c: ['#ffd23f'],            tags: ['regen'], hue: 'geel', lvl: 6 },
  { id: 'top_leerjack',     shape: 'leather',   name: 'Leren Jack',          c: ['#2b2b33','#9a9aa8'],  tags: ['stoer','muziek'], glam: 2, hue: 'zwart', lvl: 7 },
  { id: 'top_skull',        shape: 'tshirt',    name: 'Schedel Shirt',       c: ['#23202a','#ffffff'],  deco: 'skull', tags: ['stoer','muziek','eng'], glam: 1, hue: 'zwart', lvl: 7 },
  { id: 'top_bloemen',      shape: 'blouse',    name: 'Bloemenblouse',       c: ['#fff6e5','#ff8fab'],  pattern: 'flowers', tags: ['bloemen','zomer','chic'], glam: 1, hue: 'roze', lvl: 8 },
  { id: 'top_elf',          shape: 'tank',      name: 'Elfentopje',          c: ['#5fd7a8','#2d9a6a'],  deco: 'leaves', tags: ['sprookje','zomer'], glam: 1, hue: 'groen', lvl: 9 },
  { id: 'top_skelet',       shape: 'sweater',   name: 'Skelet Shirt',        c: ['#23202a','#ffffff'],  deco: 'skeleton', tags: ['eng','stoer'], glam: 1, hue: 'zwart', lvl: 10 },
  { id: 'top_ruimtepak',    shape: 'spacesuit', name: 'Ruimtepak',           c: ['#d9dee8','#ff8c42'],  tags: ['ruimte','held'], glam: 2, hue: 'zilver', lvl: 11 },
  { id: 'top_kersttrui',    shape: 'sweater',   name: 'Kersttrui',           c: ['#c8102e','#ffffff'],  deco: 'xmas', tags: ['kerst','winter','warm','feest'], glam: 1, hue: 'rood', lvl: 12 },
  { id: 'top_parijs',       shape: 'sweater',   name: 'Parijse Streepjes',   c: ['#ffffff','#23202a'],  pattern: 'stripes', tags: ['chic','casual'], glam: 2, hue: 'zwart', lvl: 13 },
  { id: 'top_regenboogtrui',shape: 'sweater',   name: 'Regenboogtrui',       c: ['#ff5c5c'],            pattern: 'rainbow', tags: ['feest','casual'], glam: 1, hue: 'multi', lvl: 14 },
  { id: 'top_held',         shape: 'hero',      name: 'Superheldenpak',      c: ['#3a86ff','#ffd23f'],  tags: ['held','stoer'], glam: 2, hue: 'blauw', lvl: 15 },
  { id: 'top_piraat',       shape: 'pirateshirt',name: 'Piratenshirt',       c: ['#ffffff','#c8102e'],  tags: ['piraat','stoer'], glam: 1, hue: 'rood', lvl: 16 },
  { id: 'top_glitter',      shape: 'tank',      name: 'Glittertop',          c: ['#8e5bd9','#ffffff'],  pattern: 'glitter', tags: ['muziek','feest','chic'], glam: 3, hue: 'paars', lvl: 17 },
  { id: 'top_vest_wit',     shape: 'tuxedo',    name: 'Wit Galavest',        c: ['#ffffff','#f1c232'],  tags: ['bruiloft','chic','feest'], glam: 3, hue: 'wit', lvl: 18 },
  { id: 'top_goud',         shape: 'blouse',    name: 'Gouden Top',          c: ['#f1c232','#fff3b0'],  pattern: 'glitter', tags: ['chic','feest'], glam: 3, hue: 'goud', lvl: 19 },
]);

// Broeken & rokken
add('bottom', [
  { id: 'bot_jeans',        shape: 'pants',     name: 'Spijkerbroek',        c: ['#3d6db5','#2a4f8a'],  tags: ['casual','school'], hue: 'blauw', lvl: 1 },
  { id: 'bot_rok_rood',     shape: 'skirt',     name: 'Rode Rok',            c: ['#e63946'],            tags: ['casual','feest','school'], hue: 'rood', lvl: 1 },
  { id: 'bot_korte_broek',  shape: 'shorts',    name: 'Korte Broek',         c: ['#c9b48a'],            tags: ['zomer','casual'], hue: 'bruin', lvl: 1 },
  { id: 'bot_strandshort',  shape: 'shorts',    name: 'Strandshort',         c: ['#2fd1a8','#ffffff'],  pattern: 'dots', tags: ['strand','zomer'], hue: 'groen', lvl: 2 },
  { id: 'bot_sport',        shape: 'sportshorts',name: 'Sportbroek',         c: ['#23202a','#2fd1a8'],  tags: ['sport'], hue: 'zwart', lvl: 3 },
  { id: 'bot_legging',      shape: 'legging',   name: 'Zwarte Legging',      c: ['#2b2b33'],            tags: ['sport','casual','stoer'], hue: 'zwart', lvl: 3 },
  { id: 'bot_warm',         shape: 'pants',     name: 'Warme Broek',         c: ['#8b5a2b','#6e4520'],  tags: ['winter','warm','casual'], hue: 'bruin', lvl: 4 },
  { id: 'bot_net',          shape: 'pants',     name: 'Nette Broek',         c: ['#23202a','#111'],     tags: ['chic','bruiloft'], glam: 2, hue: 'zwart', lvl: 5 },
  { id: 'bot_regen',        shape: 'pants',     name: 'Regenbroek',          c: ['#3a86ff','#2a4f8a'],  tags: ['regen'], hue: 'blauw', lvl: 6 },
  { id: 'bot_skinny',       shape: 'legging',   name: 'Stoere Skinny',       c: ['#1c1c22'],            deco: 'rips', tags: ['stoer','muziek'], glam: 1, hue: 'zwart', lvl: 7 },
  { id: 'bot_bloemenrok',   shape: 'skirt',     name: 'Bloemenrok',          c: ['#fff6e5','#ff8fab'],  pattern: 'flowers', tags: ['bloemen','zomer'], glam: 1, hue: 'roze', lvl: 8 },
  { id: 'bot_tutu',         shape: 'tutu',      name: 'Tutu',                c: ['#ff8fcf'],            tags: ['sprookje','feest'], glam: 2, hue: 'roze', lvl: 9 },
  { id: 'bot_spinnenrok',   shape: 'skirt',     name: 'Spinnenwebrok',       c: ['#23202a','#8e5bd9'],  deco: 'web', tags: ['eng'], glam: 1, hue: 'zwart', lvl: 10 },
  { id: 'bot_zilver',       shape: 'legging',   name: 'Zilveren Broek',      c: ['#d9dee8'],            tags: ['ruimte'], glam: 2, hue: 'zilver', lvl: 11 },
  { id: 'bot_kerstrok',     shape: 'skirt',     name: 'Kerstrok',            c: ['#c8102e','#2d9a6a'],  pattern: 'checks', tags: ['kerst','feest'], glam: 1, hue: 'rood', lvl: 12 },
  { id: 'bot_plooirok',     shape: 'pleated',   name: 'Plooirok',            c: ['#2a4f8a','#ffffff'],  tags: ['chic','school'], glam: 1, hue: 'blauw', lvl: 13 },
  { id: 'bot_regenboogrok', shape: 'skirt',     name: 'Regenboogrok',        c: ['#ff5c5c'],            pattern: 'rainbow', tags: ['feest'], glam: 1, hue: 'multi', lvl: 14 },
  { id: 'bot_held',         shape: 'legging',   name: 'Heldenbroek',         c: ['#3a86ff','#ffd23f'],  deco: 'belt', tags: ['held'], glam: 1, hue: 'blauw', lvl: 15 },
  { id: 'bot_piraat',       shape: 'pants',     name: 'Piratenbroek',        c: ['#ffffff','#c8102e'],  pattern: 'stripes', tags: ['piraat'], hue: 'rood', lvl: 16 },
  { id: 'bot_glitter',      shape: 'pants',     name: 'Glitterbroek',        c: ['#8e5bd9','#ffffff'],  pattern: 'glitter', tags: ['muziek','feest'], glam: 3, hue: 'paars', lvl: 17 },
  { id: 'bot_goudrok',      shape: 'pleated',   name: 'Gouden Rok',          c: ['#f1c232','#fff3b0'],  tags: ['chic','feest'], glam: 3, hue: 'goud', lvl: 19 },
]);

// Jurken (jurk = top + broek tegelijk)
add('dress', [
  { id: 'dr_roze',          shape: 'aline',     name: 'Roze Jurkje',         c: ['#ff8fcf'],            tags: ['casual','feest'], glam: 1, hue: 'roze', lvl: 1 },
  { id: 'dr_zomer',         shape: 'sundress',  name: 'Zomerjurkje',         c: ['#ffd23f','#ffffff'],  pattern: 'dots', tags: ['zomer','strand','bloemen'], glam: 1, hue: 'geel', lvl: 2 },
  { id: 'dr_bal',           shape: 'ballgown',  name: 'Baljurk',             c: ['#5aa9e6','#bfe3ff'],  tags: ['chic','feest','sprookje'], glam: 3, hue: 'blauw', lvl: 5 },
  { id: 'dr_bloemen',       shape: 'aline',     name: 'Bloemenjurk',         c: ['#fff6e5','#ff8fab'],  pattern: 'flowers', tags: ['bloemen','zomer','chic'], glam: 2, hue: 'roze', lvl: 8 },
  { id: 'dr_prinses',       shape: 'princess',  name: 'Prinsessenjurk',      c: ['#ff7bc0','#ffffff'],  tags: ['sprookje','chic','feest'], glam: 3, hue: 'roze', lvl: 9 },
  { id: 'dr_heks',          shape: 'witch',     name: 'Heksenjurk',          c: ['#23202a','#8e5bd9'],  tags: ['eng'], glam: 2, hue: 'zwart', lvl: 10 },
  { id: 'dr_sterren',       shape: 'aline',     name: 'Sterrenjurk',         c: ['#1d2b6b','#ffd23f'],  pattern: 'stars', tags: ['ruimte','feest'], glam: 2, hue: 'blauw', lvl: 11 },
  { id: 'dr_kerst',         shape: 'aline',     name: 'Kerstjurk',           c: ['#c8102e','#ffffff'],  deco: 'trim', tags: ['kerst','feest'], glam: 2, hue: 'rood', lvl: 12 },
  { id: 'dr_zwart',         shape: 'sundress',  name: 'Kleine Zwarte Jurk',  c: ['#23202a','#23202a'],  tags: ['chic'], glam: 3, hue: 'zwart', lvl: 13 },
  { id: 'dr_regenboog',     shape: 'aline',     name: 'Regenboogjurk',       c: ['#ff5c5c'],            pattern: 'rainbow', tags: ['feest'], glam: 2, hue: 'multi', lvl: 14 },
  { id: 'dr_zeemeermin',    shape: 'mermaid',   name: 'Zeemeerminjurk',      c: ['#2fd1a8','#1f9d8a'],  pattern: 'scales', tags: ['sprookje','strand','feest'], glam: 3, hue: 'groen', lvl: 16 },
  { id: 'dr_popster',       shape: 'aline',     name: 'Popsterjurk',         c: ['#8e5bd9','#ffffff'],  pattern: 'glitter', tags: ['muziek','feest'], glam: 3, hue: 'paars', lvl: 17 },
  { id: 'dr_trouw',         shape: 'ballgown',  name: 'Trouwjurk',           c: ['#ffffff','#fff3b0'],  pattern: 'glitter', tags: ['bruiloft','chic'], glam: 3, hue: 'wit', lvl: 18 },
  { id: 'dr_goud',          shape: 'ballgown',  name: 'Gouden Galajurk',     c: ['#f1c232','#fff3b0'],  tags: ['chic','feest'], glam: 3, hue: 'goud', lvl: 19 },
]);

// Schoenen
add('shoes', [
  { id: 'sh_sneakers',      shape: 'sneaker',   name: 'Witte Sneakers',      c: ['#ffffff','#3a86ff'],  tags: ['casual','sport','school'], hue: 'wit', lvl: 1 },
  { id: 'sh_laarsjes',      shape: 'boot',      name: 'Bruine Laarsjes',     c: ['#8b5a2b','#5c3a17'],  tags: ['casual','winter','school'], hue: 'bruin', lvl: 1 },
  { id: 'sh_slippers',      shape: 'flipflop',  name: 'Teenslippers',        c: ['#ffd23f','#ff8c42'],  tags: ['strand','zomer'], hue: 'geel', lvl: 2 },
  { id: 'sh_sport',         shape: 'sneaker',   name: 'Sportschoenen',       c: ['#2fd1a8','#23202a'],  tags: ['sport'], hue: 'groen', lvl: 3 },
  { id: 'sh_snowboots',     shape: 'snowboot',  name: 'Snowboots',           c: ['#5aa9e6','#ffffff'],  tags: ['winter','warm'], hue: 'blauw', lvl: 4 },
  { id: 'sh_hakken',        shape: 'heels',     name: 'Glitterhakjes',       c: ['#ff5da2','#ffffff'],  tags: ['chic','feest'], glam: 3, hue: 'roze', lvl: 5 },
  { id: 'sh_net',           shape: 'dress',     name: 'Nette Schoenen',      c: ['#23202a'],            tags: ['chic','school','bruiloft'], glam: 1, hue: 'zwart', lvl: 5 },
  { id: 'sh_regen',         shape: 'rainboot',  name: 'Regenlaarzen',        c: ['#e63946','#ffffff'],  tags: ['regen'], hue: 'rood', lvl: 6 },
  { id: 'sh_boots',         shape: 'boot',      name: 'Stoere Boots',        c: ['#23202a','#9a9aa8'],  tags: ['stoer','muziek'], glam: 1, hue: 'zwart', lvl: 7 },
  { id: 'sh_sandalen',      shape: 'sandal',    name: 'Sandaaltjes',         c: ['#c98a5e','#ff8fab'],  tags: ['zomer','bloemen','strand'], hue: 'bruin', lvl: 8 },
  { id: 'sh_ballet',        shape: 'ballet',    name: 'Balletschoentjes',    c: ['#ffb3d9'],            tags: ['sprookje','feest','chic'], glam: 2, hue: 'roze', lvl: 9 },
  { id: 'sh_monster',       shape: 'monster',   name: 'Monstersloffen',      c: ['#5fd7a8','#ffffff'],  tags: ['eng','casual'], hue: 'groen', lvl: 10 },
  { id: 'sh_ruimte',        shape: 'spaceboot', name: 'Ruimtelaarzen',       c: ['#d9dee8','#ff8c42'],  tags: ['ruimte'], glam: 2, hue: 'zilver', lvl: 11 },
  { id: 'sh_elf',           shape: 'elf',       name: 'Elfenschoentjes',     c: ['#2d9a6a','#ffd23f'],  tags: ['kerst','sprookje'], glam: 1, hue: 'groen', lvl: 12 },
  { id: 'sh_pumps',         shape: 'heels',     name: 'Rode Pumps',          c: ['#e63946','#e63946'],  tags: ['chic'], glam: 3, hue: 'rood', lvl: 13 },
  { id: 'sh_konijn',        shape: 'bunny',     name: 'Konijnensloffen',     c: ['#ffffff','#ffb3d9'],  tags: ['feest','casual'], hue: 'wit', lvl: 14 },
  { id: 'sh_held',          shape: 'rainboot',  name: 'Heldenlaarzen',       c: ['#e63946','#ffd23f'],  tags: ['held'], glam: 1, hue: 'rood', lvl: 15 },
  { id: 'sh_piraat',        shape: 'pirateboot',name: 'Piratenlaarzen',      c: ['#5c3a17','#3b2410'],  tags: ['piraat','stoer'], hue: 'bruin', lvl: 16 },
  { id: 'sh_platform',      shape: 'platform',  name: 'Glitterplatforms',    c: ['#8e5bd9','#ffffff'],  tags: ['muziek','feest'], glam: 3, hue: 'paars', lvl: 17 },
  { id: 'sh_wit_ballet',    shape: 'ballet',    name: 'Witte Ballerina\'s',  c: ['#ffffff'],            tags: ['bruiloft','chic'], glam: 2, hue: 'wit', lvl: 18 },
  { id: 'sh_goud',          shape: 'sandal',    name: 'Gouden Sandalen',     c: ['#f1c232','#f1c232'],  tags: ['chic','feest'], glam: 3, hue: 'goud', lvl: 19 },
]);

// Hoedjes & haarspullen
add('hat', [
  { id: 'hat_strik',        shape: 'bowband',   name: 'Haarband met Strik',  c: ['#ff5da2'],            tags: ['casual','feest','school'], glam: 1, hue: 'roze', lvl: 1 },
  { id: 'hat_zonnehoed',    shape: 'sunhat',    name: 'Zonnehoed',           c: ['#f3d9a4','#ff8fab'],  tags: ['strand','zomer'], hue: 'geel', lvl: 2 },
  { id: 'hat_pet',          shape: 'cap',       name: 'Pet',                 c: ['#e63946'],            tags: ['casual','sport'], hue: 'rood', lvl: 2 },
  { id: 'hat_zweetband',    shape: 'sweatband', name: 'Zweetband',           c: ['#2fd1a8'],            tags: ['sport'], hue: 'groen', lvl: 3 },
  { id: 'hat_muts',         shape: 'beanie',    name: 'Muts met Pompon',     c: ['#e63946','#ffffff'],  tags: ['winter','warm'], hue: 'rood', lvl: 4 },
  { id: 'hat_kattenoren',   shape: 'catears',   name: 'Kattenoortjes',       c: ['#23202a','#ff8fab'],  tags: ['feest','casual'], glam: 1, hue: 'zwart', lvl: 4 },
  { id: 'hat_tiara',        shape: 'tiara',     name: 'Tiara',               c: ['#d9dee8','#ff5da2'],  tags: ['chic','feest','sprookje','bruiloft'], glam: 2, hue: 'zilver', lvl: 5 },
  { id: 'hat_zuidwester',   shape: 'rainhat',   name: 'Zuidwester',          c: ['#ffd23f'],            tags: ['regen'], hue: 'geel', lvl: 6 },
  { id: 'hat_bandana',      shape: 'bandana',   name: 'Bandana',             c: ['#e63946','#ffffff'],  pattern: 'dots', tags: ['stoer','muziek','piraat'], hue: 'rood', lvl: 7 },
  { id: 'hat_bloemenkrans', shape: 'flowercrown',name: 'Bloemenkrans',       c: ['#ff8fab','#ffd23f'],  tags: ['bloemen','zomer','sprookje','bruiloft'], glam: 1, hue: 'roze', lvl: 8 },
  { id: 'hat_kroon',        shape: 'crown',     name: 'Gouden Kroon',        c: ['#f1c232','#e63946'],  tags: ['sprookje','chic'], glam: 3, hue: 'goud', lvl: 9 },
  { id: 'hat_eenhoorn',     shape: 'unicorn',   name: 'Eenhoornhoorn',       c: ['#ffffff','#f1c232'],  tags: ['sprookje','feest'], glam: 2, hue: 'wit', lvl: 9 },
  { id: 'hat_heks',         shape: 'witchhat',  name: 'Heksenhoed',          c: ['#23202a','#8e5bd9'],  tags: ['eng'], glam: 1, hue: 'zwart', lvl: 10 },
  { id: 'hat_helm',         shape: 'spacehelmet',name: 'Ruimtehelm',         c: ['#d9dee8'],            tags: ['ruimte'], glam: 2, hue: 'zilver', lvl: 11 },
  { id: 'hat_kerstmuts',    shape: 'santa',     name: 'Kerstmuts',           c: ['#c8102e','#ffffff'],  tags: ['kerst','winter','feest'], hue: 'rood', lvl: 12 },
  { id: 'hat_baret',        shape: 'beret',     name: 'Baret',               c: ['#23202a'],            tags: ['chic'], glam: 2, hue: 'zwart', lvl: 13 },
  { id: 'hat_feesthoed',    shape: 'partyhat',  name: 'Feesthoed',           c: ['#8e5bd9','#ffd23f'],  pattern: 'stripes', tags: ['feest'], glam: 1, hue: 'multi', lvl: 14 },
  { id: 'hat_piraat',       shape: 'piratehat', name: 'Piratenhoed',         c: ['#23202a','#ffffff'],  tags: ['piraat'], glam: 1, hue: 'zwart', lvl: 16 },
  { id: 'hat_koptelefoon',  shape: 'headphones',name: 'Koptelefoon',         c: ['#ff5da2','#23202a'],  tags: ['muziek','stoer'], glam: 1, hue: 'roze', lvl: 17 },
  { id: 'hat_sluier',       shape: 'veil',      name: 'Bruidssluier',        c: ['#ffffff','#f1c232'],  tags: ['bruiloft','chic'], glam: 3, hue: 'wit', lvl: 18 },
]);

// Brillen & maskers
add('glasses', [
  { id: 'gl_zonnebril',     shape: 'sunglasses',name: 'Zonnebril',           c: ['#23202a'],            tags: ['strand','zomer','stoer'], glam: 1, hue: 'zwart', lvl: 2 },
  { id: 'gl_rond',          shape: 'round',     name: 'Rond Brilletje',      c: ['#8b5a2b'],            tags: ['school','chic'], hue: 'bruin', lvl: 5 },
  { id: 'gl_sterren',       shape: 'stars',     name: 'Sterrenbril',         c: ['#ffd23f'],            tags: ['muziek','feest'], glam: 2, hue: 'geel', lvl: 7 },
  { id: 'gl_hartjes',       shape: 'hearts',    name: 'Hartjesbril',         c: ['#ff5da2'],            tags: ['feest','bloemen','zomer'], glam: 1, hue: 'roze', lvl: 8 },
  { id: 'gl_masker',        shape: 'heromask',  name: 'Heldenmasker',        c: ['#3a86ff'],            tags: ['held'], glam: 1, hue: 'blauw', lvl: 15 },
  { id: 'gl_ooglapje',      shape: 'eyepatch',  name: 'Ooglapje',            c: ['#23202a'],            tags: ['piraat'], hue: 'zwart', lvl: 16 },
]);

// Om de nek
add('neck', [
  { id: 'nk_lei',           shape: 'lei',       name: 'Bloemenslinger',      c: ['#ff8fab','#ffd23f'],  tags: ['strand','zomer','bloemen'], glam: 1, hue: 'roze', lvl: 2 },
  { id: 'nk_medaille',      shape: 'medal',     name: 'Gouden Medaille',     c: ['#3a86ff','#f1c232'],  tags: ['sport'], glam: 1, hue: 'goud', lvl: 3 },
  { id: 'nk_sjaal',         shape: 'scarf',     name: 'Warme Sjaal',         c: ['#e63946'],            tags: ['winter','warm'], hue: 'rood', lvl: 4 },
  { id: 'nk_parels',        shape: 'pearls',    name: 'Parelketting',        c: ['#fff8f0'],            tags: ['chic','feest','bruiloft'], glam: 2, hue: 'wit', lvl: 5 },
  { id: 'nk_vlinderdas',    shape: 'bowtie',    name: 'Vlinderdas',          c: ['#e63946'],            tags: ['chic','feest'], glam: 2, hue: 'rood', lvl: 5 },
  { id: 'nk_spikes',        shape: 'choker',    name: 'Stoere Ketting',      c: ['#23202a','#d9dee8'],  tags: ['stoer','muziek'], glam: 1, hue: 'zwart', lvl: 7 },
  { id: 'nk_hartje',        shape: 'pendant',   name: 'Hartjeshanger',       c: ['#f1c232','#ff5da2'],  tags: ['sprookje','feest','chic'], glam: 2, hue: 'goud', lvl: 9 },
  { id: 'nk_kerstsjaal',    shape: 'scarf',     name: 'Kerstsjaal',          c: ['#2d9a6a','#c8102e'],  pattern: 'stripes', tags: ['kerst','winter'], hue: 'groen', lvl: 12 },
  { id: 'nk_zijden',        shape: 'silkscarf', name: 'Zijden Sjaaltje',     c: ['#ff5da2','#ffd23f'],  pattern: 'dots', tags: ['chic'], glam: 2, hue: 'roze', lvl: 13 },
  { id: 'nk_ster',          shape: 'pendant',   name: 'Sterrenketting',      c: ['#d9dee8','#ffd23f'],  deco: 'star', tags: ['muziek','ruimte','feest'], glam: 2, hue: 'zilver', lvl: 11 },
  { id: 'nk_diamant',       shape: 'diamond',   name: 'Diamanten Ketting',   c: ['#d9dee8','#bfe3ff'],  tags: ['bruiloft','chic'], glam: 3, hue: 'zilver', lvl: 18 },
]);

// Tassen
add('bag', [
  { id: 'bg_rugzak',        shape: 'backpack',  name: 'Rugzak',              c: ['#8e5bd9','#ffd23f'],  tags: ['school','casual','sport'], hue: 'paars', lvl: 1 },
  { id: 'bg_strandtas',     shape: 'tote',      name: 'Strandtas',           c: ['#ffffff','#3a86ff'],  pattern: 'stripes', tags: ['strand','zomer'], hue: 'blauw', lvl: 2 },
  { id: 'bg_handtas',       shape: 'handbag',   name: 'Glitterhandtasje',    c: ['#ff5da2','#f1c232'],  pattern: 'glitter', tags: ['chic','feest'], glam: 2, hue: 'roze', lvl: 5 },
  { id: 'bg_mandje',        shape: 'basket',    name: 'Picknickmandje',      c: ['#c98a5e','#e63946'],  tags: ['bloemen','zomer'], hue: 'bruin', lvl: 8 },
  { id: 'bg_chic',          shape: 'chainbag',  name: 'Chique Tas',          c: ['#23202a','#f1c232'],  tags: ['chic'], glam: 3, hue: 'zwart', lvl: 13 },
  { id: 'bg_sterren',       shape: 'handbag',   name: 'Sterrentas',          c: ['#1d2b6b','#ffd23f'],  pattern: 'stars', tags: ['muziek','feest','ruimte'], glam: 2, hue: 'blauw', lvl: 17 },
]);

// In je hand
add('hand', [
  { id: 'hd_beer',          shape: 'teddy',     name: 'Knuffelbeer',         c: ['#c98a5e'],            tags: ['casual','school'], hue: 'bruin', lvl: 1 },
  { id: 'hd_ijsje',         shape: 'icecream',  name: 'IJsje',               c: ['#ff8fcf','#ffffff'],  tags: ['zomer','strand'], hue: 'roze', lvl: 2 },
  { id: 'hd_strandbal',     shape: 'beachball', name: 'Strandbal',           c: ['#e63946','#3a86ff'],  tags: ['strand','zomer'], hue: 'multi', lvl: 2 },
  { id: 'hd_voetbal',       shape: 'football',  name: 'Voetbal',             c: ['#ffffff'],            tags: ['sport'], hue: 'wit', lvl: 3 },
  { id: 'hd_paraplu',       shape: 'umbrella',  name: 'Paraplu',             c: ['#ff5da2','#ffffff'],  tags: ['regen'], hue: 'roze', lvl: 6 },
  { id: 'hd_gitaar',        shape: 'guitar',    name: 'Gitaar',              c: ['#e63946','#5c3a17'],  tags: ['muziek','stoer'], glam: 2, hue: 'rood', lvl: 7 },
  { id: 'hd_toverstaf',     shape: 'wand',      name: 'Toverstaf',           c: ['#f1c232','#ff5da2'],  tags: ['sprookje'], glam: 2, hue: 'goud', lvl: 9 },
  { id: 'hd_pompoen',       shape: 'pumpkin',   name: 'Pompoenemmertje',     c: ['#ff8c42'],            tags: ['eng'], hue: 'oranje', lvl: 10 },
  { id: 'hd_kijker',        shape: 'telescope', name: 'Sterrenkijker',       c: ['#1d2b6b','#d9dee8'],  tags: ['ruimte'], hue: 'blauw', lvl: 11 },
  { id: 'hd_cadeau',        shape: 'gift',      name: 'Cadeautje',           c: ['#c8102e','#f1c232'],  tags: ['kerst','feest'], hue: 'rood', lvl: 12 },
  { id: 'hd_ballonnen',     shape: 'balloons',  name: 'Ballonnen',           c: ['#ff5da2','#ffd23f','#3a86ff'], tags: ['feest'], glam: 1, hue: 'multi', lvl: 14 },
  { id: 'hd_zwaard',        shape: 'sword',     name: 'Piratenzwaard',       c: ['#d9dee8','#5c3a17'],  tags: ['piraat','stoer'], hue: 'zilver', lvl: 16 },
  { id: 'hd_microfoon',     shape: 'mic',       name: 'Microfoon',           c: ['#23202a','#d9dee8'],  tags: ['muziek','feest'], glam: 2, hue: 'zwart', lvl: 17 },
  { id: 'hd_boeket',        shape: 'bouquet',   name: 'Bruidsboeket',        c: ['#ffffff','#ff8fab'],  tags: ['bruiloft','bloemen'], glam: 2, hue: 'wit', lvl: 18 },
]);

// Op je rug
add('back', [
  { id: 'bk_vleugels',      shape: 'fairywings',name: 'Feeënvleugels',       c: ['#bfe3ff','#ffffff'],  tags: ['sprookje','feest'], glam: 2, hue: 'blauw', lvl: 9 },
  { id: 'bk_vampier',       shape: 'cape',      name: 'Vampiercape',         c: ['#23202a','#c8102e'],  tags: ['eng'], glam: 2, hue: 'zwart', lvl: 10 },
  { id: 'bk_jetpack',       shape: 'jetpack',   name: 'Jetpack',             c: ['#d9dee8','#ff8c42'],  tags: ['ruimte','held'], glam: 2, hue: 'zilver', lvl: 11 },
  { id: 'bk_vlinder',       shape: 'butterfly', name: 'Vlindervleugels',     c: ['#ff5da2','#ffd23f'],  tags: ['feest','bloemen','sprookje'], glam: 2, hue: 'multi', lvl: 14 },
  { id: 'bk_heldencape',    shape: 'cape',      name: 'Heldencape',          c: ['#e63946','#ffd23f'],  tags: ['held'], glam: 2, hue: 'rood', lvl: 15 },
  { id: 'bk_engel',         shape: 'angelwings',name: 'Engelenvleugels',     c: ['#ffffff','#f1c232'],  tags: ['bruiloft','chic','sprookje'], glam: 3, hue: 'wit', lvl: 19 },
]);

// Huisdier
add('pet', [
  { id: 'pt_puppy',         shape: 'puppy',     name: 'Puppy',               c: ['#c98a5e','#ffffff'],  tags: ['casual','sport','school'], hue: 'bruin', lvl: 3 },
  { id: 'pt_poes',          shape: 'kitten',    name: 'Poesje',              c: ['#9a9aa8','#ffffff'],  tags: ['casual','chic'], hue: 'grijs', lvl: 6 },
  { id: 'pt_eenhoorn',      shape: 'unicorn',   name: 'Mini Eenhoorn',       c: ['#ffffff','#ff8fcf'],  tags: ['sprookje','feest'], glam: 2, hue: 'wit', lvl: 9 },
  { id: 'pt_pinguin',       shape: 'penguin',   name: 'Pinguïn',             c: ['#23202a','#ffffff'],  tags: ['winter','kerst'], hue: 'zwart', lvl: 12 },
  { id: 'pt_papegaai',      shape: 'parrot',    name: 'Papegaai',            c: ['#e63946','#3a86ff'],  tags: ['piraat','strand'], hue: 'rood', lvl: 16 },
  { id: 'pt_draak',         shape: 'dragon',    name: 'Draakje',             c: ['#5fd7a8','#ff8c42'],  tags: ['sprookje','stoer'], glam: 2, hue: 'groen', lvl: 20 },
]);

// Make-up
add('mk_eyes', [
  { id: 'me_roze',   shape: 'eyeshadow', name: 'Roze Oogschaduw',   c: ['#ff9ad5'], tags: ['feest','chic'], glam: 1, hue: 'roze',  lvl: 2 },
  { id: 'me_blauw',  shape: 'eyeshadow', name: 'Blauwe Oogschaduw', c: ['#7cc4ff'], tags: ['feest','chic','strand'], glam: 1, hue: 'blauw', lvl: 5 },
  { id: 'me_paars',  shape: 'eyeshadow', name: 'Paarse Oogschaduw', c: ['#b58cff'], tags: ['feest','muziek','eng'], glam: 2, hue: 'paars', lvl: 7 },
  { id: 'me_goud',   shape: 'eyeshadow', name: 'Gouden Oogschaduw', c: ['#f5d16a'], tags: ['chic','feest','bruiloft'], glam: 2, hue: 'goud', lvl: 9 },
  { id: 'me_groen',  shape: 'eyeshadow', name: 'Groene Oogschaduw', c: ['#8fe0a8'], tags: ['eng','sprookje'], glam: 1, hue: 'groen', lvl: 10 },
  { id: 'me_zilver', shape: 'eyeshadow', name: 'Zilveren Oogschaduw', c: ['#dfe6f0'], tags: ['ruimte','chic'], glam: 2, hue: 'zilver', lvl: 11 },
  { id: 'me_glitter',shape: 'eyeshadow', name: 'Glitteroogschaduw', c: ['#ffb3ff'], deco: 'glitter', tags: ['feest','muziek'], glam: 3, hue: 'roze', lvl: 14 },
]);
add('mk_lips', [
  { id: 'ml_roze',  shape: 'lips', name: 'Roze Lippen',   c: ['#ff6fa8'], tags: ['feest','casual'], glam: 1, hue: 'roze',  lvl: 1 },
  { id: 'ml_rood',  shape: 'lips', name: 'Rode Lippen',   c: ['#d62839'], tags: ['chic','feest'], glam: 2, hue: 'rood',  lvl: 5 },
  { id: 'ml_paars', shape: 'lips', name: 'Paarse Lippen', c: ['#8e4bd1'], tags: ['muziek','eng'], glam: 2, hue: 'paars', lvl: 7 },
  { id: 'ml_zwart', shape: 'lips', name: 'Zwarte Lippen', c: ['#2b2233'], tags: ['eng','stoer'], glam: 1, hue: 'zwart', lvl: 10 },
  { id: 'ml_goud',  shape: 'lips', name: 'Gouden Lippen', c: ['#e0b23a'], tags: ['chic','feest'], glam: 3, hue: 'goud',  lvl: 19 },
]);
add('mk_blush', [
  { id: 'mb_roze',   shape: 'blush', name: 'Zachte Blush',  c: ['#ff7aa8'], tags: ['casual','feest','chic'], hue: 'roze',   lvl: 1 },
  { id: 'mb_perzik', shape: 'blush', name: 'Perzikblush',   c: ['#ff9f6e'], tags: ['zomer','strand'], hue: 'oranje', lvl: 4 },
]);
add('mk_face', [
  { id: 'mf_sproeten',  shape: 'freckles',  name: 'Sproetjes',        c: ['#b5754a'], tags: ['casual','zomer'], hue: 'bruin', lvl: 1 },
  { id: 'mf_sterren',   shape: 'facestars', name: 'Sterretjes',       c: ['#ffd23f'], tags: ['feest','muziek','ruimte'], glam: 1, hue: 'geel', lvl: 3 },
  { id: 'mf_snoetje',   shape: 'whiskers',  name: 'Kattensnoetje',    c: ['#23202a'], tags: ['feest','eng'], hue: 'zwart', lvl: 4 },
  { id: 'mf_hartjes',   shape: 'facehearts',name: 'Hartjes',          c: ['#ff5da2'], tags: ['feest','bloemen'], glam: 1, hue: 'roze', lvl: 8 },
  { id: 'mf_bloem',     shape: 'faceflower',name: 'Bloemetje',        c: ['#ff8fab','#ffd23f'], tags: ['bloemen','zomer','sprookje'], glam: 1, hue: 'roze', lvl: 8 },
  { id: 'mf_glitter',   shape: 'faceglitter', name: 'Glitterwangen', c: ['#ffffff'], tags: ['feest','chic','muziek'], glam: 2, hue: 'wit', lvl: 13 },
  { id: 'mf_bliksem',   shape: 'lightning', name: 'Bliksemflits',     c: ['#ffd23f'], tags: ['held','muziek'], glam: 1, hue: 'geel', lvl: 15 },
  { id: 'mf_baard',     shape: 'beard',     name: 'Piratenbaard',     c: ['#4a2f1d'], tags: ['piraat'], hue: 'bruin', lvl: 16 },
]);

// Achtergronden / settings
add('bg', [
  { id: 'bg_kamer',      shape: 'bedroom',    name: 'Slaapkamer',          tags: ['casual','school'], lvl: 1 },
  { id: 'bg_catwalk',    shape: 'catwalk',    name: 'Catwalk',             tags: ['feest','chic','muziek'], lvl: 1 },
  { id: 'bg_strand',     shape: 'beach',      name: 'Strand',              tags: ['strand','zomer'], lvl: 2 },
  { id: 'bg_sportveld',  shape: 'field',      name: 'Sportveld',           tags: ['sport'], lvl: 3 },
  { id: 'bg_sneeuw',     shape: 'snow',       name: 'Sneeuwlandschap',     tags: ['winter','warm'], lvl: 4 },
  { id: 'bg_balzaal',    shape: 'ballroom',   name: 'Balzaal',             tags: ['chic','feest','sprookje','bruiloft'], lvl: 5 },
  { id: 'bg_regen',      shape: 'rainstreet', name: 'Regenachtige Straat', tags: ['regen'], lvl: 6 },
  { id: 'bg_podium',     shape: 'stage',      name: 'Concertpodium',       tags: ['muziek','stoer','feest'], lvl: 7 },
  { id: 'bg_park',       shape: 'park',       name: 'Bloemenpark',         tags: ['bloemen','zomer','casual'], lvl: 8 },
  { id: 'bg_bos',        shape: 'fairyforest',name: 'Sprookjesbos',        tags: ['sprookje'], lvl: 9 },
  { id: 'bg_spookhuis',  shape: 'haunted',    name: 'Spookhuis',           tags: ['eng'], lvl: 10 },
  { id: 'bg_ruimte',     shape: 'space',      name: 'In de Ruimte',        tags: ['ruimte'], lvl: 11 },
  { id: 'bg_kerst',      shape: 'xmas',       name: 'Kerstkamer',          tags: ['kerst','winter','feest'], lvl: 12 },
  { id: 'bg_parijs',     shape: 'paris',      name: 'Parijs',              tags: ['chic'], lvl: 13 },
  { id: 'bg_regenboog',  shape: 'rainbowland',name: 'Regenboogland',       tags: ['feest'], lvl: 14 },
  { id: 'bg_stad',       shape: 'citynight',  name: 'Stad bij Nacht',      tags: ['held','stoer'], lvl: 15 },
  { id: 'bg_schip',      shape: 'pirateship', name: 'Piratenschip',        tags: ['piraat','strand'], lvl: 16 },
  { id: 'bg_tuin',       shape: 'weddinggarden', name: 'Bruiloftstuin',    tags: ['bruiloft','bloemen','chic'], lvl: 18 },
]);

const ITEM_BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]));

/* ---------- Categorieën in de kledingkast ---------- */
const CATEGORIES = [
  { id: 'hair',    name: 'Haar',        emoji: '💇' },
  { id: 'makeup',  name: 'Make-up',     emoji: '💄', slots: ['mk_eyes', 'mk_lips', 'mk_blush', 'mk_face'] },
  { id: 'dress',   name: 'Jurken',      emoji: '👗' },
  { id: 'top',     name: 'Tops',        emoji: '👕' },
  { id: 'bottom',  name: 'Broeken',     emoji: '👖' },
  { id: 'shoes',   name: 'Schoenen',    emoji: '👟' },
  { id: 'hat',     name: 'Hoedjes',     emoji: '👒' },
  { id: 'acc',     name: 'Sieraden',    emoji: '💍', slots: ['glasses', 'neck', 'bag'] },
  { id: 'extra',   name: 'Extra',       emoji: '✨', slots: ['hand', 'back', 'pet'] },
  { id: 'bg',      name: 'Setting',     emoji: '🏝️' },
];
const SLOT_NAMES = {
  hair: 'Haar', top: 'Top', bottom: 'Broek of rok', dress: 'Jurk', shoes: 'Schoenen', hat: 'Hoedje',
  glasses: 'Bril', neck: 'Om de nek', bag: 'Tas', hand: 'In je hand', back: 'Op je rug', pet: 'Huisdier',
  mk_eyes: 'Oogschaduw', mk_lips: 'Lippen', mk_blush: 'Blush', mk_face: 'Gezichtsversiering', bg: 'Setting',
};
// Slots die meetellen als 'kledingstuk' voor thema en kleur
const OUTFIT_SLOTS = ['top', 'bottom', 'dress', 'shoes', 'hat', 'glasses', 'neck', 'bag', 'hand', 'back'];
const ACC_SLOTS = ['hat', 'glasses', 'neck', 'bag', 'hand', 'back', 'pet', 'mk_eyes', 'mk_lips', 'mk_face'];
const ALL_SLOTS = ['hair', 'top', 'bottom', 'dress', 'shoes', 'hat', 'glasses', 'neck', 'bag', 'hand', 'back', 'pet', 'mk_eyes', 'mk_lips', 'mk_blush', 'mk_face', 'bg'];

/* ---------- Opdrachten (thema's) ---------- */
const THEMES = [
  { id: 'school',    lvl: 1,  emoji: '🏫', name: 'Eerste Schooldag',
    desc: 'Morgen begint school! Kies iets lekker gewoon waar je de hele dag in kunt spelen.',
    wants: ['casual', 'school'], avoid: ['chic', 'eng', 'ruimte', 'bruiloft'], glam: 0.5 },
  { id: 'verjaardag', lvl: 1, emoji: '🎂', name: 'Verjaardagsfeest',
    desc: 'Je bent uitgenodigd op een feestje. Hoe vrolijker en kleurrijker, hoe beter!',
    wants: ['feest', 'casual'], avoid: ['eng', 'regen'], glam: 1.5, multiColor: true },
  { id: 'strand',    lvl: 2,  emoji: '🏖️', name: 'Dagje Strand',
    desc: 'Zon, zee en zand! Trek iets luchtigs aan en vergeet je zonnebril niet.',
    wants: ['strand', 'zomer'], avoid: ['winter', 'warm', 'chic', 'kerst'], glam: 0.5 },
  { id: 'sport',     lvl: 3,  emoji: '⚽', name: 'Sportdag',
    desc: 'Rennen, springen, winnen! Alleen sportieve kleding waar je goed in kunt bewegen.',
    wants: ['sport'], avoid: ['chic', 'winter', 'sprookje', 'bruiloft'], glam: 0 },
  { id: 'winter',    lvl: 4,  emoji: '❄️', name: 'Winterwandeling',
    desc: 'Brrr, het sneeuwt! Pak je goed in met warme laagjes, een muts en een sjaal.',
    wants: ['winter', 'warm'], avoid: ['zomer', 'strand'], glam: 0.5 },
  { id: 'gala',      lvl: 5,  emoji: '🎩', name: 'Het Grote Gala',
    desc: 'Rode loper, camera\'s, glitter! De jury wil je allerchicste outfit zien.',
    wants: ['chic', 'feest'], avoid: ['sport', 'casual', 'regen'], glam: 3 },
  { id: 'regen',     lvl: 6,  emoji: '🌧️', name: 'Regenachtige Dag',
    desc: 'Het giet! Blijf droog met een regenjas en laarzen. Geel staat lekker vrolijk.',
    wants: ['regen'], avoid: ['chic', 'strand', 'sprookje'], glam: 0, colors: ['geel'] },
  { id: 'rock',      lvl: 7,  emoji: '🎸', name: 'Rockconcert',
    desc: 'Vanavond sta jij op het podium! Stoer, zwart en met een gitaar erbij.',
    wants: ['stoer', 'muziek'], avoid: ['bloemen', 'sprookje', 'bruiloft'], glam: 2, colors: ['zwart'] },
  { id: 'picknick',  lvl: 8,  emoji: '🌸', name: 'Bloemenpicknick',
    desc: 'Picknicken tussen de bloemen. Zachte kleuren en bloemetjes overal!',
    wants: ['bloemen', 'zomer'], avoid: ['stoer', 'eng', 'winter'], glam: 1, colors: ['roze'] },
  { id: 'sprookje',  lvl: 9,  emoji: '🦄', name: 'Sprookjesbal',
    desc: 'Feeën, prinsessen en eenhoorns komen samen. Kies iets magisch met een kroon of vleugels!',
    wants: ['sprookje', 'chic'], avoid: ['sport', 'regen', 'eng'], glam: 3 },
  { id: 'halloween', lvl: 10, emoji: '🎃', name: 'Griezelfeest',
    desc: 'Hoe enger, hoe beter! Heksen, spoken en skeletten zijn welkom.',
    wants: ['eng'], avoid: ['bloemen', 'strand', 'bruiloft'], glam: 1, colors: ['zwart', 'oranje', 'paars'] },
  { id: 'ruimte',    lvl: 11, emoji: '🚀', name: 'Ruimtereis',
    desc: 'Drie, twee, één, lancering! Zilver, sterren en een helm horen erbij.',
    wants: ['ruimte'], avoid: ['bloemen', 'strand', 'kerst'], glam: 2, colors: ['zilver', 'blauw'] },
  { id: 'kerst',     lvl: 12, emoji: '🎄', name: 'Kerstdiner',
    desc: 'Gezellig kerst vieren! Rood en groen, iets warms en een beetje feest.',
    wants: ['kerst', 'feest'], avoid: ['strand', 'zomer', 'eng'], glam: 2, colors: ['rood', 'groen'] },
  { id: 'parijs',    lvl: 13, emoji: '🗼', name: 'Modeshow Parijs',
    desc: 'Oh là là! De modestad wil stijl zien: chic, netjes en niet te druk.',
    wants: ['chic'], avoid: ['sport', 'eng', 'regen'], glam: 2.5, colors: ['zwart', 'wit', 'rood'] },
  { id: 'carnaval',  lvl: 14, emoji: '🌈', name: 'Regenboogcarnaval',
    desc: 'Alle kleuren tegelijk! Hoe bonter en gekker, hoe hoger de score.',
    wants: ['feest'], avoid: ['chic'], glam: 2, multiColor: true },
  { id: 'held',      lvl: 15, emoji: '🦸', name: 'Superheldendag',
    desc: 'De stad heeft je nodig! Cape, masker en een stoer pak.',
    wants: ['held', 'stoer'], avoid: ['chic', 'bloemen', 'bruiloft'], glam: 1.5 },
  { id: 'piraat',    lvl: 16, emoji: '🏴‍☠️', name: 'Piratenfeest',
    desc: 'Ahoy! Hijs de zeilen met een ooglapje, laarzen en een papegaai.',
    wants: ['piraat', 'stoer'], avoid: ['chic', 'sport', 'kerst'], glam: 1 },
  { id: 'popster',   lvl: 17, emoji: '🎤', name: 'Popsterconcert',
    desc: 'Duizenden fans wachten op jou! Glitter, glamour en een microfoon.',
    wants: ['muziek', 'feest'], avoid: ['school', 'regen', 'winter'], glam: 3 },
  { id: 'bruiloft',  lvl: 18, emoji: '💒', name: 'De Bruiloft',
    desc: 'Het mooiste feest van het jaar. Wit, elegant en helemaal af.',
    wants: ['bruiloft', 'chic'], avoid: ['sport', 'eng', 'stoer'], glam: 3, colors: ['wit'] },
  { id: 'goud',      lvl: 19, emoji: '🏆', name: 'Gouden Sterrengala',
    desc: 'Het allerlaatste gala van het seizoen. Alleen goud is goed genoeg!',
    wants: ['chic', 'feest'], avoid: ['sport', 'casual'], glam: 3, colors: ['goud'] },
];

/* ---------- Jury ---------- */
const JUDGES = [
  { id: 'fleur', name: 'Madame Fleur', emoji: '🌸', title: 'Kleurenkoningin',
    weights: { kleur: 0.4, glamour: 0.3, thema: 0.2, compleet: 0.1 } },
  { id: 'ties',  name: 'Meester Ties',  emoji: '🎩', title: 'Strenge Stylist',
    weights: { thema: 0.45, compleet: 0.25, setting: 0.2, kleur: 0.1 } },
  { id: 'luna',  name: 'DJ Luna',       emoji: '🎧', title: 'Gek op Accessoires',
    weights: { accessoires: 0.35, thema: 0.25, glamour: 0.2, kleur: 0.2 } },
];

// Commentaar per factor: [hoog, midden, laag]
const COMMENTS = {
  fleur: {
    kleur:       ['Wat een prachtige kleurencombinatie, hier word ik blij van!', 'De kleuren passen best goed bij elkaar.', 'Hmm, deze kleuren vechten een beetje met elkaar. Probeer twee kleuren die vriendjes zijn.'],
    glamour:     ['Zóveel glamour, ik zie sterretjes!', 'Net genoeg glans voor deze opdracht.', 'Voor deze opdracht mag het wel wat meer (of minder) glitter zijn.'],
    thema:       ['Je hebt de opdracht helemaal begrepen, bravo!', 'Het past aardig bij het thema.', 'Ik mis het thema een beetje in je outfit.'],
    compleet:    ['Van top tot teen helemaal af!', 'Bijna compleet.', 'Oei, er ontbreekt iets. Schoenen misschien?'],
    accessoires: ['Leuke details!', 'Een accessoire erbij maakt het af.', 'Iets moois om je nek of op je hoofd zou het af maken.'],
    setting:     ['Wat een mooie plek voor deze show!', 'De achtergrond past wel.', 'Kies een setting die bij het thema past.'],
  },
  ties: {
    thema:       ['Precies wat de opdracht vroeg. Uitstekend!', 'Een aantal stukken passen goed bij het thema.', 'Lees de opdracht nog eens goed: dit past er niet helemaal bij.'],
    compleet:    ['Alles zit erop en eraan. Zo hoort het.', 'Bijna compleet, let op de details.', 'Een outfit is pas klaar met schoenen én iets aan je lijf!'],
    setting:     ['De setting maakt het plaatje compleet.', 'De achtergrond kan nog beter passen.', 'Deze achtergrond past niet bij de opdracht.'],
    kleur:       ['Nette, rustige kleuren. Stijlvol.', 'De kleuren kunnen iets rustiger.', 'Te veel kleuren tegelijk, houd het simpel.'],
    glamour:     ['Precies de juiste hoeveelheid glans.', 'Prima.', 'Kijk nog eens of het chic of casual moet zijn.'],
    accessoires: ['Goed gekozen accessoires.', 'Prima.', 'Een klein detail kan het verschil maken.'],
  },
  luna: {
    accessoires: ['WAUW, kijk al die leuke accessoires! Dit vind ik top!', 'Leuk, een paar accessoires! Nog eentje erbij?', 'Waar zijn de accessoires? Een hoedje, bril of tas maakt het feestje compleet!'],
    thema:       ['Helemaal in het thema, super!', 'Ik zie het thema wel een beetje.', 'Probeer meer spullen die bij het thema passen.'],
    glamour:     ['Shine bright! Wat een glamour!', 'Lekker bezig.', 'Meer glitter of juist minder? Kijk goed naar de opdracht.'],
    kleur:       ['Deze kleuren knallen op het podium!', 'Leuke kleuren.', 'De kleuren zijn een beetje een rommeltje.'],
    compleet:    ['Van top tot teen klaar voor de show!', 'Bijna klaar!', 'Je bent iets vergeten aan te trekken!'],
    setting:     ['Te gekke plek!', 'Leuke setting.', 'Kies een setting die past.'],
  },
};

const FACTOR_NAMES = {
  thema: 'Thema', kleur: 'Kleuren', compleet: 'Compleet', glamour: 'Glamour', accessoires: 'Accessoires', setting: 'Setting',
};

/* ---------- Levels ---------- */
const MAX_LEVEL = 20;
function xpForLevel(level) {           // totaal xp nodig om dit level te bereiken
  const n = level - 1;
  return 25 * n + 4 * n * n;
}
const XP_PER_STARS = { 1: 15, 2: 25, 3: 40 };
const XP_FIRST_TIME = 10;

/* ============================================================
   Catwalk Sterren — speldata
   Alles wat je kunt aanpassen zonder te tekenen: items, opdrachten,
   settings, jury, levels. Elk item heeft:
     id      unieke naam
     cat     slot (hair, top, bottom, dress, shoes, hat, glasses,
             neck, bag, hand, back, pet, mk_eyes, mk_lips, mk_blush, mk_face)
     shape   tekenfunctie in avatar.js
     name    Nederlandse naam
     c       kleuren (hex)
     tags    waar past dit bij (zie TAGS)
     glam    0 = simpel … 3 = super glamour
     hue     kleurfamilie voor de kleurenjury
     lvl     level waarop het vrijkomt (vergrendelde spullen zie je niet)
   ============================================================ */

const TAGS = {
  casual:   { label: 'Casual',     emoji: '👕' },
  school:   { label: 'School',     emoji: '🏫' },
  pyjama:   { label: 'Pyjama',     emoji: '🌙' },
  zomer:    { label: 'Zomer',      emoji: '☀️' },
  strand:   { label: 'Strand',     emoji: '🏖️' },
  zwemmen:  { label: 'Zwemmen',    emoji: '🏊' },
  sport:    { label: 'Sport',      emoji: '⚽' },
  paard:    { label: 'Paarden',    emoji: '🐴' },
  dans:     { label: 'Dans',       emoji: '💃' },
  disco:    { label: 'Disco',      emoji: '🪩' },
  winter:   { label: 'Winter',     emoji: '❄️' },
  warm:     { label: 'Warm',       emoji: '🧣' },
  feest:    { label: 'Feest',      emoji: '🎉' },
  chic:     { label: 'Chic',       emoji: '💎' },
  prinses:  { label: 'Prinses',    emoji: '👑' },
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
const FACE_SHAPES = [
  { id: 'ovaal',    name: 'Ovaal' },
  { id: 'rond',     name: 'Rond' },
  { id: 'hart',     name: 'Hartvormig' },
  { id: 'vierkant', name: 'Vierkant' },
  { id: 'smal',     name: 'Smal' },
];
const HAIR_COLORS = [
  { id: 'blond',   name: 'Blond',        c: '#f2d27a', lvl: 1 },
  { id: 'lichtbruin', name: 'Lichtbruin', c: '#b8834a', lvl: 1 },
  { id: 'bruin',   name: 'Bruin',        c: '#8a5a2b', lvl: 1 },
  { id: 'donker',  name: 'Donkerbruin',  c: '#4a2f1d', lvl: 1 },
  { id: 'zwart',   name: 'Zwart',        c: '#23202a', lvl: 1 },
  { id: 'rood',    name: 'Rood',         c: '#c9562b', lvl: 1 },
  { id: 'platina', name: 'Platinablond', c: '#f7ecc8', lvl: 1 },
  { id: 'roze',    name: 'Roze',         c: '#ff7bc0', lvl: 3 },
  { id: 'blauw',   name: 'Blauw',        c: '#4fa3ff', lvl: 5 },
  { id: 'paars',   name: 'Paars',        c: '#9b6cf0', lvl: 7 },
  { id: 'groen',   name: 'Mintgroen',    c: '#5fd7a8', lvl: 9 },
  { id: 'oranje',  name: 'Oranje',       c: '#ff8c42', lvl: 11 },
  { id: 'zilver',  name: 'Zilver',       c: '#d9dee8', lvl: 12 },
  { id: 'regenboog', name: 'Regenboog',  c: 'rainbow', lvl: 15 },
];

/* ---------- Items ---------- */
const ITEMS = [];
function add(cat, list) {
  for (const it of list) ITEMS.push(Object.assign({ cat, tags: [], glam: 0, c: [], lvl: 1 }, it));
}
// snelle helper voor kleurvarianten van dezelfde vorm
function variants(cat, shape, base, list) {
  add(cat, list.map(v => Object.assign({ shape }, base, v)));
}

// Kapsels (kleur kies je apart)
add('hair', [
  { id: 'hair_kort',        shape: 'kort',        name: 'Kort & Stoer',        lvl: 1 },
  { id: 'hair_pixie',       shape: 'pixie',       name: 'Pixie',               lvl: 1 },
  { id: 'hair_bob',         shape: 'bob',         name: 'Bob',                 lvl: 1 },
  { id: 'hair_bob_pony',    shape: 'bob_pony',    name: 'Bob met Pony',        lvl: 1 },
  { id: 'hair_lang',        shape: 'lang',        name: 'Lang & Glad',         lvl: 1 },
  { id: 'hair_lang_pony',   shape: 'lang_pony',   name: 'Lang met Pony',       lvl: 1 },
  { id: 'hair_halflang',    shape: 'halflang',    name: 'Halflang',            lvl: 1 },
  { id: 'hair_staart',      shape: 'staart',      name: 'Paardenstaart',       lvl: 1 },
  { id: 'hair_staartjes',   shape: 'staartjes',   name: 'Twee Staartjes',      lvl: 1 },
  { id: 'hair_kort_krul',   shape: 'kort_krul',   name: 'Korte Krullen',       lvl: 1 },
  { id: 'hair_hoge_staart', shape: 'hoge_staart', name: 'Hoge Staart',         lvl: 2 },
  { id: 'hair_golvend_kort',shape: 'golvend_kort',name: 'Korte Golven',        lvl: 2 },
  { id: 'hair_krullen',     shape: 'krullen',     name: 'Krullenbol',          lvl: 3 },
  { id: 'hair_zijstaart',   shape: 'zijstaart',   name: 'Zijstaart',           lvl: 3 },
  { id: 'hair_vlechten',    shape: 'vlechten',    name: 'Vlechtjes',           lvl: 4 },
  { id: 'hair_knot',        shape: 'knot',        name: 'Knotje',              lvl: 5 },
  { id: 'hair_afro_puffs',  shape: 'afro_puffs',  name: 'Afro Puffs',          lvl: 6 },
  { id: 'hair_golvend',     shape: 'golvend',     name: 'Lange Golven',        lvl: 7 },
  { id: 'hair_afro',        shape: 'afro',        name: 'Afro',                lvl: 8 },
  { id: 'hair_dreads',      shape: 'dreads',      name: 'Dreads',              lvl: 8 },
  { id: 'hair_spacebuns',   shape: 'spacebuns',   name: 'Space Buns',          lvl: 9 },
  { id: 'hair_zijvlecht',   shape: 'zijvlecht',   name: 'Zijvlecht',           lvl: 9 },
  { id: 'hair_krullen_lang',shape: 'krullen_lang',name: 'Lange Krullen',       lvl: 10 },
  { id: 'hair_hanenkam',    shape: 'hanenkam',    name: 'Hanenkam',            lvl: 11 },
  { id: 'hair_opgestoken',  shape: 'opgestoken',  name: 'Opgestoken',          lvl: 12 },
  { id: 'hair_prinses',     shape: 'prinses',     name: 'Prinsessenkrullen',   lvl: 13 },
  { id: 'hair_kroonvlecht', shape: 'kroonvlecht', name: 'Kroonvlecht',         lvl: 14 },
]);

/* ---------- Tops ---------- */
variants('top', 'tshirt', { tags: ['casual', 'school', 'zomer'] }, [
  { id: 'top_tshirt_rood',   name: 'Rood T-shirt',      c: ['#e63946'], hue: 'rood',  lvl: 1 },
  { id: 'top_tshirt_blauw',  name: 'Blauw T-shirt',     c: ['#3a86ff'], hue: 'blauw', lvl: 1, tags: ['casual', 'school', 'zomer', 'sport'] },
  { id: 'top_tshirt_groen',  name: 'Groen T-shirt',     c: ['#3fbf63'], hue: 'groen', lvl: 1 },
  { id: 'top_tshirt_geel',   name: 'Geel T-shirt',      c: ['#ffd23f'], hue: 'geel',  lvl: 1 },
  { id: 'top_tshirt_wit',    name: 'Wit T-shirt',       c: ['#ffffff'], hue: 'wit',   lvl: 1 },
  { id: 'top_tshirt_paars',  name: 'Paars T-shirt',     c: ['#8e5bd9'], hue: 'paars', lvl: 2 },
  { id: 'top_tshirt_oranje', name: 'Oranje T-shirt',    c: ['#ff8c42'], hue: 'oranje', lvl: 3 },
  { id: 'top_streep',        name: 'Gestreept Shirt',   c: ['#ffffff', '#2f5fa8'], pattern: 'stripes', hue: 'blauw', lvl: 1, tags: ['casual', 'school', 'strand'] },
  { id: 'top_streep_rood',   name: 'Rood Streepshirt',  c: ['#ffffff', '#e63946'], pattern: 'stripes', hue: 'rood', lvl: 2, tags: ['casual', 'strand', 'zomer'] },
  { id: 'top_hartjes',       name: 'Hartjes Shirt',     c: ['#fff0f6', '#ff5da2'], pattern: 'hearts', hue: 'roze', glam: 1, lvl: 1, tags: ['feest', 'casual'] },
  { id: 'top_sterren',       name: 'Sterrenshirt',      c: ['#1d2b6b', '#ffd23f'], pattern: 'stars', hue: 'blauw', glam: 1, lvl: 2, tags: ['feest', 'casual', 'pyjama', 'ruimte'] },
  { id: 'top_stippen',       name: 'Stippenshirt',      c: ['#fff', '#3a86ff'], pattern: 'dots', hue: 'blauw', lvl: 2, tags: ['casual', 'feest'] },
  { id: 'top_pyjama_maan',   name: 'Pyjamashirt Maantjes', c: ['#c9d8ff', '#ffd23f'], pattern: 'stars', hue: 'blauw', lvl: 1, tags: ['pyjama'] },
  { id: 'top_skull',         name: 'Schedel Shirt',     c: ['#23202a', '#ffffff'], deco: 'skull', hue: 'zwart', glam: 1, lvl: 7, tags: ['stoer', 'muziek', 'eng'] },
  { id: 'top_bliksem',       name: 'Bliksemshirt',      c: ['#23202a', '#ffd23f'], deco: 'bolt', hue: 'zwart', glam: 1, lvl: 9, tags: ['dans', 'stoer', 'muziek'] },
  { id: 'top_regenboog_t',   name: 'Regenboog T-shirt', c: ['#ff5c5c'], pattern: 'rainbow', hue: 'multi', glam: 1, lvl: 6, tags: ['feest', 'casual', 'disco'] },
]);
variants('top', 'tank', { tags: ['zomer', 'strand', 'casual'] }, [
  { id: 'top_hemd_roze',   name: 'Roze Hemdje',      c: ['#ff8fcf'], hue: 'roze',  lvl: 1 },
  { id: 'top_hemd_wit',    name: 'Wit Hemdje',       c: ['#ffffff'], hue: 'wit',   lvl: 2 },
  { id: 'top_hemd_mint',   name: 'Mint Hemdje',      c: ['#5fd7a8'], hue: 'groen', lvl: 3 },
  { id: 'top_elf',         name: 'Elfentopje',       c: ['#5fd7a8', '#2d9a6a'], deco: 'leaves', hue: 'groen', glam: 1, lvl: 9, tags: ['sprookje', 'zomer'] },
  { id: 'top_glitter',     name: 'Glittertop',       c: ['#8e5bd9', '#ffffff'], pattern: 'glitter', hue: 'paars', glam: 3, lvl: 6, tags: ['muziek', 'feest', 'disco', 'dans'] },
  { id: 'top_glitter_goud',name: 'Gouden Glittertop',c: ['#f1c232', '#fff3b0'], pattern: 'glitter', hue: 'goud', glam: 3, lvl: 14, tags: ['disco', 'feest', 'chic'] },
  { id: 'top_glitter_zilver', name: 'Zilveren Glittertop', c: ['#c9d1dc', '#ffffff'], pattern: 'glitter', hue: 'zilver', glam: 3, lvl: 11, tags: ['disco', 'ruimte', 'feest'] },
]);
variants('top', 'sweater', { tags: ['casual', 'school', 'warm'] }, [
  { id: 'top_trui_geel',    name: 'Gele Trui',         c: ['#ffd23f'], hue: 'geel',  lvl: 1 },
  { id: 'top_trui_roze',    name: 'Roze Trui',         c: ['#ff8fcf'], hue: 'roze',  lvl: 1 },
  { id: 'top_trui_blauw',   name: 'Blauwe Trui',       c: ['#3a86ff'], hue: 'blauw', lvl: 2 },
  { id: 'top_trui_groen',   name: 'Groene Trui',       c: ['#2d9a6a'], hue: 'groen', lvl: 4, tags: ['casual', 'winter', 'warm'] },
  { id: 'top_trui_rood',    name: 'Rode Trui',         c: ['#e63946'], hue: 'rood',  lvl: 4, tags: ['casual', 'winter', 'warm'] },
  { id: 'top_skelet',       name: 'Skelet Shirt',      c: ['#23202a', '#ffffff'], deco: 'skeleton', hue: 'zwart', glam: 1, lvl: 10, tags: ['eng', 'stoer'] },
  { id: 'top_kersttrui',    name: 'Kersttrui',         c: ['#c8102e', '#ffffff'], deco: 'xmas', hue: 'rood', glam: 1, lvl: 12, tags: ['kerst', 'winter', 'warm', 'feest'] },
  { id: 'top_parijs',       name: 'Parijse Streepjes', c: ['#ffffff', '#23202a'], pattern: 'stripes', hue: 'zwart', glam: 2, lvl: 13, tags: ['chic', 'casual'] },
  { id: 'top_regenboogtrui',name: 'Regenboogtrui',     c: ['#ff5c5c'], pattern: 'rainbow', hue: 'multi', glam: 1, lvl: 14, tags: ['feest', 'casual'] },
  { id: 'top_skitrui',      name: 'Noorse Skitrui',    c: ['#2a4f8a', '#ffffff'], deco: 'nordic', hue: 'blauw', glam: 1, lvl: 11, tags: ['winter', 'warm', 'sport'] },
]);
variants('top', 'hoodie', { tags: ['casual', 'school', 'warm'] }, [
  { id: 'top_hoodie_roze',  name: 'Roze Hoodie',       c: ['#ff8fcf', '#ffffff'], hue: 'roze',  lvl: 1 },
  { id: 'top_hoodie_grijs', name: 'Grijze Hoodie',     c: ['#9a9aa8', '#ffffff'], hue: 'grijs', lvl: 2, tags: ['casual', 'school', 'sport', 'dans'] },
  { id: 'top_hoodie_zwart', name: 'Zwarte Hoodie',     c: ['#23202a', '#ff5da2'], hue: 'zwart', lvl: 5, tags: ['casual', 'stoer', 'dans'] },
  { id: 'top_hoodie_oversize', name: 'Oversized Hoodie', c: ['#ffd23f', '#23202a'], hue: 'geel', glam: 1, lvl: 9, tags: ['dans', 'stoer', 'casual'] },
]);
variants('top', 'polo', { tags: ['school', 'casual', 'chic'] }, [
  { id: 'top_polo_wit',   name: 'Witte Polo',   c: ['#ffffff', '#3a86ff'], hue: 'wit',   lvl: 1 },
  { id: 'top_polo_rood',  name: 'Rode Polo',    c: ['#e63946', '#ffffff'], hue: 'rood',  lvl: 3 },
  { id: 'top_polo_rij',   name: 'Rijpolo',      c: ['#2a4f8a', '#ffffff'], hue: 'blauw', lvl: 7, tags: ['paard', 'sport'] },
]);
variants('top', 'cardigan', { tags: ['school', 'casual', 'chic'] }, [
  { id: 'top_vestje_roze',  name: 'Roze Vestje',   c: ['#ff8fcf', '#ffffff'], hue: 'roze',  glam: 1, lvl: 1 },
  { id: 'top_vestje_blauw', name: 'Blauw Vestje',  c: ['#5aa9e6', '#ffffff'], hue: 'blauw', glam: 1, lvl: 4 },
  { id: 'top_vestje_goud',  name: 'Gouden Vestje', c: ['#f1c232', '#ffffff'], hue: 'goud',  glam: 2, lvl: 13 },
]);
add('top', [
  { id: 'top_sport',        shape: 'sportshirt', name: 'Sportshirt',          c: ['#2fd1a8', '#ffffff'], tags: ['sport'], hue: 'groen', lvl: 1 },
  { id: 'top_voetbal',      shape: 'sportshirt', name: 'Voetbalshirt',        c: ['#ff8c42', '#ffffff'], tags: ['sport'], hue: 'oranje', lvl: 3 },
  { id: 'top_hockey',       shape: 'sportshirt', name: 'Hockeyshirt',         c: ['#3a86ff', '#ffd23f'], tags: ['sport'], hue: 'blauw', lvl: 5 },
  { id: 'top_trainings',    shape: 'trackjacket',name: 'Trainingsjack',       c: ['#3a86ff', '#ffffff'], tags: ['sport', 'casual'], hue: 'blauw', lvl: 3 },
  { id: 'top_trainings_roze', shape: 'trackjacket', name: 'Roze Trainingsjack', c: ['#ff5da2', '#ffffff'], tags: ['sport', 'dans', 'casual'], hue: 'roze', lvl: 6 },
  { id: 'top_coltrui',      shape: 'turtleneck', name: 'Warme Coltrui',       c: ['#c8553d'], tags: ['winter', 'warm', 'casual'], hue: 'rood', lvl: 4 },
  { id: 'top_coltrui_zwart',shape: 'turtleneck', name: 'Zwarte Coltrui',      c: ['#23202a'], tags: ['winter', 'chic', 'dans'], glam: 1, hue: 'zwart', lvl: 12 },
  { id: 'top_winterjas',    shape: 'puffer',     name: 'Winterjas',           c: ['#5aa9e6'], tags: ['winter', 'warm'], hue: 'blauw', lvl: 4 },
  { id: 'top_skijas',       shape: 'puffer',     name: 'Skijas',              c: ['#ff5da2'], tags: ['winter', 'warm', 'sport'], hue: 'roze', lvl: 11 },
  { id: 'top_blouse_wit',   shape: 'blouse',     name: 'Witte Blouse',        c: ['#ffffff', '#d8d8e0'], tags: ['chic', 'school', 'paard'], glam: 1, hue: 'wit', lvl: 2 },
  { id: 'top_bloemen',      shape: 'blouse',     name: 'Bloemenblouse',       c: ['#fff6e5', '#ff8fab'], pattern: 'flowers', tags: ['bloemen', 'zomer', 'chic'], glam: 1, hue: 'roze', lvl: 8 },
  { id: 'top_goud',         shape: 'blouse',     name: 'Gouden Top',          c: ['#f1c232', '#fff3b0'], pattern: 'glitter', tags: ['chic', 'feest', 'prinses'], glam: 3, hue: 'goud', lvl: 17 },
  { id: 'top_galajasje',    shape: 'tuxedo',     name: 'Galajasje',           c: ['#23202a', '#ffffff'], tags: ['chic', 'feest', 'bruiloft', 'dans'], glam: 3, hue: 'zwart', lvl: 5 },
  { id: 'top_vest_wit',     shape: 'tuxedo',     name: 'Wit Galavest',        c: ['#ffffff', '#f1c232'], tags: ['bruiloft', 'chic', 'feest'], glam: 3, hue: 'wit', lvl: 18 },
  { id: 'top_rijjasje',     shape: 'tuxedo',     name: 'Rijjasje',            c: ['#2a4f8a', '#ffffff'], tags: ['paard', 'chic', 'sport'], glam: 2, hue: 'blauw', lvl: 7 },
  { id: 'top_regenjas',     shape: 'raincoat',   name: 'Gele Regenjas',       c: ['#ffd23f'], tags: ['regen'], hue: 'geel', lvl: 6 },
  { id: 'top_regenjas_roze',shape: 'raincoat',   name: 'Roze Regenjas',       c: ['#ff5da2'], tags: ['regen'], hue: 'roze', lvl: 6 },
  { id: 'top_leerjack',     shape: 'leather',    name: 'Leren Jack',          c: ['#2b2b33', '#9a9aa8'], tags: ['stoer', 'muziek', 'dans'], glam: 2, hue: 'zwart', lvl: 7 },
  { id: 'top_spijkerjack',  shape: 'leather',    name: 'Spijkerjack',         c: ['#3d6db5', '#c9d1dc'], tags: ['casual', 'stoer', 'dans'], glam: 1, hue: 'blauw', lvl: 9 },
  { id: 'top_ruimtepak',    shape: 'spacesuit',  name: 'Ruimtepak',           c: ['#d9dee8', '#ff8c42'], tags: ['ruimte', 'held'], glam: 2, hue: 'zilver', lvl: 11 },
  { id: 'top_held',         shape: 'hero',       name: 'Superheldenpak',      c: ['#3a86ff', '#ffd23f'], tags: ['held', 'stoer'], glam: 2, hue: 'blauw', lvl: 15 },
  { id: 'top_held_roze',    shape: 'hero',       name: 'Roze Heldenpak',      c: ['#ff5da2', '#ffffff'], tags: ['held', 'stoer'], glam: 2, hue: 'roze', lvl: 15 },
  { id: 'top_piraat',       shape: 'pirateshirt',name: 'Piratenshirt',        c: ['#ffffff', '#c8102e'], tags: ['piraat', 'stoer'], glam: 1, hue: 'rood', lvl: 16 },
  // balletpakjes en turnpakjes (blijven aan met een tutu of rokje)
  { id: 'top_ballet_roze',  shape: 'leotard',    name: 'Roze Balletpakje',    c: ['#ffb3d9'], tags: ['dans', 'sport'], full: true, glam: 1, hue: 'roze', lvl: 1 },
  { id: 'top_ballet_zwart', shape: 'leotard',    name: 'Zwart Balletpakje',   c: ['#23202a'], tags: ['dans', 'sport'], full: true, glam: 1, hue: 'zwart', lvl: 3 },
  { id: 'top_ballet_wit',   shape: 'leotard',    name: 'Wit Balletpakje',     c: ['#ffffff'], tags: ['dans', 'chic'], full: true, glam: 2, hue: 'wit', lvl: 12 },
  { id: 'top_turn_glitter', shape: 'leotard',    name: 'Glitter Turnpakje',   c: ['#8e5bd9', '#ffffff'], pattern: 'glitter', tags: ['sport', 'dans'], full: true, glam: 2, hue: 'paars', lvl: 5 },
  { id: 'top_turn_rood',    shape: 'leotard',    name: 'Rood Turnpakje',      c: ['#e63946', '#ffffff'], tags: ['sport', 'dans'], full: true, glam: 1, hue: 'rood', lvl: 5 },
  { id: 'top_cheer',        shape: 'sportshirt', name: 'Cheerleadertop',      c: ['#e63946', '#ffd23f'], tags: ['sport', 'dans', 'feest'], glam: 1, hue: 'rood', lvl: 14 },
]);

/* ---------- Broeken & rokken ---------- */
variants('bottom', 'pants', { tags: ['casual', 'school'] }, [
  { id: 'bot_jeans',       name: 'Spijkerbroek',      c: ['#3d6db5', '#2a4f8a'], hue: 'blauw', lvl: 1 },
  { id: 'bot_jeans_licht', name: 'Lichte Jeans',      c: ['#7fb2e6', '#5a8ac4'], hue: 'blauw', lvl: 2 },
  { id: 'bot_broek_roze',  name: 'Roze Broek',        c: ['#ff8fcf', '#e06fb0'], hue: 'roze',  lvl: 1 },
  { id: 'bot_broek_wit',   name: 'Witte Broek',       c: ['#ffffff', '#dddde6'], hue: 'wit',   lvl: 3, tags: ['casual', 'chic', 'zomer'] },
  { id: 'bot_warm',        name: 'Warme Broek',       c: ['#8b5a2b', '#6e4520'], hue: 'bruin', lvl: 4, tags: ['winter', 'warm', 'casual'] },
  { id: 'bot_net',         name: 'Nette Broek',       c: ['#23202a', '#111'],    hue: 'zwart', glam: 2, lvl: 5, tags: ['chic', 'bruiloft'] },
  { id: 'bot_regen',       name: 'Regenbroek',        c: ['#3a86ff', '#2a4f8a'], hue: 'blauw', lvl: 6, tags: ['regen'] },
  { id: 'bot_piraat',      name: 'Piratenbroek',      c: ['#ffffff', '#c8102e'], pattern: 'stripes', hue: 'rood', lvl: 16, tags: ['piraat'] },
  { id: 'bot_glitter',     name: 'Glitterbroek',      c: ['#8e5bd9', '#ffffff'], pattern: 'glitter', hue: 'paars', glam: 3, lvl: 10, tags: ['muziek', 'feest', 'disco'] },
  { id: 'bot_pyjama',      name: 'Pyjamabroek',       c: ['#c9d8ff', '#ffd23f'], pattern: 'stars', hue: 'blauw', lvl: 1, tags: ['pyjama'] },
  { id: 'bot_pyjama_hart', name: 'Hartjes Pyjamabroek', c: ['#fff0f6', '#ff5da2'], pattern: 'hearts', hue: 'roze', lvl: 2, tags: ['pyjama'] },
  { id: 'bot_skibroek',    name: 'Skibroek',          c: ['#23202a', '#ff5da2'], hue: 'zwart', lvl: 11, tags: ['winter', 'sport', 'warm'] },
  { id: 'bot_baggy',       name: 'Baggy Broek',       c: ['#9a9aa8', '#6e6e7a'], hue: 'grijs', glam: 1, lvl: 9, tags: ['dans', 'stoer', 'casual'] },
]);
variants('bottom', 'joggers', { tags: ['sport', 'casual', 'dans'] }, [
  { id: 'bot_jogging_grijs', name: 'Joggingbroek',       c: ['#9a9aa8', '#ffffff'], hue: 'grijs', lvl: 1 },
  { id: 'bot_jogging_zwart', name: 'Zwarte Joggingbroek', c: ['#23202a', '#2fd1a8'], hue: 'zwart', lvl: 3 },
  { id: 'bot_jogging_roze',  name: 'Roze Joggingbroek',  c: ['#ff8fcf', '#ffffff'], hue: 'roze', lvl: 6 },
]);
variants('bottom', 'shorts', { tags: ['zomer', 'casual'] }, [
  { id: 'bot_korte_broek',  name: 'Korte Broek',      c: ['#c9b48a'], hue: 'bruin', lvl: 1 },
  { id: 'bot_short_jeans',  name: 'Korte Spijkerbroek', c: ['#3d6db5', '#2a4f8a'], hue: 'blauw', lvl: 2 },
  { id: 'bot_strandshort',  name: 'Strandshort',      c: ['#2fd1a8', '#ffffff'], pattern: 'dots', hue: 'groen', lvl: 2, tags: ['strand', 'zomer', 'zwemmen'] },
  { id: 'bot_zwembroek',    name: 'Zwembroek',        c: ['#3a86ff', '#ffd23f'], pattern: 'stripes', hue: 'blauw', lvl: 2, tags: ['zwemmen', 'strand'] },
  { id: 'bot_zwembroek_haai', name: 'Haaien Zwembroek', c: ['#5aa9e6', '#23202a'], pattern: 'scales', hue: 'blauw', lvl: 4, tags: ['zwemmen', 'strand'] },
]);
variants('bottom', 'sportshorts', { tags: ['sport'] }, [
  { id: 'bot_sport',        name: 'Sportbroek',       c: ['#23202a', '#2fd1a8'], hue: 'zwart', lvl: 1 },
  { id: 'bot_voetbal',      name: 'Voetbalbroekje',   c: ['#ffffff', '#ff8c42'], hue: 'wit', lvl: 3 },
]);
variants('bottom', 'legging', { tags: ['sport', 'casual'] }, [
  { id: 'bot_legging',      name: 'Zwarte Legging',   c: ['#2b2b33'], hue: 'zwart', lvl: 1, tags: ['sport', 'casual', 'dans', 'stoer'] },
  { id: 'bot_legging_roze', name: 'Roze Legging',     c: ['#ff8fcf'], hue: 'roze', lvl: 2, tags: ['sport', 'casual', 'dans'] },
  { id: 'bot_legging_regenboog', name: 'Regenboog Legging', c: ['#ff5c5c'], pattern: 'rainbow', hue: 'multi', lvl: 6, tags: ['dans', 'feest', 'disco'] },
  { id: 'bot_rijbroek',     name: 'Rijbroek',         c: ['#e8dcc4'], hue: 'bruin', lvl: 7, tags: ['paard', 'sport'] },
  { id: 'bot_skinny',       name: 'Stoere Skinny',    c: ['#1c1c22'], deco: 'rips', hue: 'zwart', glam: 1, lvl: 7, tags: ['stoer', 'muziek', 'dans'] },
  { id: 'bot_zilver',       name: 'Zilveren Broek',   c: ['#d9dee8'], hue: 'zilver', glam: 2, lvl: 11, tags: ['ruimte', 'disco'] },
  { id: 'bot_held',         name: 'Heldenbroek',      c: ['#3a86ff', '#ffd23f'], deco: 'belt', hue: 'blauw', glam: 1, lvl: 15, tags: ['held'] },
]);
variants('bottom', 'skirt', { tags: ['casual', 'school'] }, [
  { id: 'bot_rok_rood',     name: 'Rode Rok',         c: ['#e63946'], hue: 'rood', lvl: 1, tags: ['casual', 'feest', 'school'] },
  { id: 'bot_rok_spijker',  name: 'Spijkerrok',       c: ['#3d6db5', '#2a4f8a'], hue: 'blauw', lvl: 1 },
  { id: 'bot_rok_roze',     name: 'Roze Rokje',       c: ['#ff8fcf'], hue: 'roze', lvl: 2, tags: ['casual', 'feest'] },
  { id: 'bot_rok_geel',     name: 'Geel Rokje',       c: ['#ffd23f'], hue: 'geel', lvl: 3, tags: ['zomer', 'casual'] },
  { id: 'bot_bloemenrok',   name: 'Bloemenrok',       c: ['#fff6e5', '#ff8fab'], pattern: 'flowers', hue: 'roze', glam: 1, lvl: 8, tags: ['bloemen', 'zomer'] },
  { id: 'bot_spinnenrok',   name: 'Spinnenwebrok',    c: ['#23202a', '#8e5bd9'], deco: 'web', hue: 'zwart', glam: 1, lvl: 10, tags: ['eng'] },
  { id: 'bot_kerstrok',     name: 'Kerstrok',         c: ['#c8102e', '#2d9a6a'], pattern: 'checks', hue: 'rood', glam: 1, lvl: 12, tags: ['kerst', 'feest'] },
  { id: 'bot_regenboogrok', name: 'Regenboogrok',     c: ['#ff5c5c'], pattern: 'rainbow', hue: 'multi', glam: 1, lvl: 14, tags: ['feest', 'disco'] },
  { id: 'bot_dansrok',      name: 'Glitter Dansrokje', c: ['#ff5da2', '#ffffff'], pattern: 'glitter', hue: 'roze', glam: 2, lvl: 6, tags: ['dans', 'disco', 'feest'] },
]);
variants('bottom', 'pleated', { tags: ['chic', 'school'] }, [
  { id: 'bot_plooirok',     name: 'Plooirok',         c: ['#2a4f8a', '#ffffff'], hue: 'blauw', glam: 1, lvl: 4 },
  { id: 'bot_plooirok_rood',name: 'Rode Plooirok',    c: ['#c8102e', '#ffffff'], hue: 'rood', glam: 1, lvl: 8, tags: ['chic', 'school', 'kerst'] },
  { id: 'bot_cheerrok',     name: 'Cheerleaderrokje', c: ['#e63946', '#ffd23f'], hue: 'rood', glam: 1, lvl: 14, tags: ['sport', 'dans', 'feest'] },
  { id: 'bot_goudrok',      name: 'Gouden Rok',       c: ['#f1c232', '#fff3b0'], hue: 'goud', glam: 3, lvl: 17, tags: ['chic', 'feest', 'prinses'] },
]);
variants('bottom', 'tutu', { tags: ['dans', 'feest'] }, [
  { id: 'bot_tutu',         name: 'Roze Tutu',        c: ['#ff8fcf'], hue: 'roze', glam: 2, lvl: 1, tags: ['dans', 'feest', 'prinses'] },
  { id: 'bot_tutu_wit',     name: 'Witte Tutu',       c: ['#ffffff'], hue: 'wit', glam: 2, lvl: 3 },
  { id: 'bot_tutu_zwart',   name: 'Zwarte Tutu',      c: ['#23202a'], hue: 'zwart', glam: 2, lvl: 12, tags: ['dans', 'chic'] },
  { id: 'bot_tutu_blauw',   name: 'IJsblauwe Tutu',   c: ['#bfe3ff'], hue: 'blauw', glam: 2, lvl: 8, tags: ['dans', 'prinses', 'winter', 'sprookje'] },
]);

/* ---------- Jurken & pakjes (jurk = top + broek tegelijk) ---------- */
add('dress', [
  { id: 'dr_roze',          shape: 'aline',     name: 'Roze Jurkje',         c: ['#ff8fcf'], tags: ['casual', 'feest'], glam: 1, hue: 'roze', lvl: 1 },
  { id: 'dr_blauw',         shape: 'aline',     name: 'Blauw Jurkje',        c: ['#5aa9e6'], tags: ['casual', 'school'], glam: 1, hue: 'blauw', lvl: 1 },
  { id: 'dr_stippen',       shape: 'aline',     name: 'Stippenjurk',         c: ['#e63946', '#ffffff'], pattern: 'dots', tags: ['casual', 'feest'], glam: 1, hue: 'rood', lvl: 2 },
  { id: 'dr_zomer',         shape: 'sundress',  name: 'Zomerjurkje',         c: ['#ffd23f', '#ffffff'], pattern: 'dots', tags: ['zomer', 'strand', 'bloemen'], glam: 1, hue: 'geel', lvl: 1 },
  { id: 'dr_zomer_mint',    shape: 'sundress',  name: 'Mint Zomerjurkje',    c: ['#5fd7a8', '#ffffff'], tags: ['zomer', 'strand', 'casual'], glam: 1, hue: 'groen', lvl: 3 },
  { id: 'dr_overall',       shape: 'overall',   name: 'Tuinbroek',           c: ['#3d6db5', '#ffd23f'], tags: ['casual', 'school'], hue: 'blauw', lvl: 1 },
  { id: 'dr_overall_roze',  shape: 'overall',   name: 'Roze Tuinbroek',      c: ['#ff8fcf', '#ffffff'], tags: ['casual', 'school'], hue: 'roze', lvl: 3 },
  { id: 'dr_onesie_konijn', shape: 'onesie',    name: 'Konijnen-onesie',     c: ['#ffffff', '#ffb3d9'], tags: ['pyjama', 'casual'], hue: 'wit', lvl: 1 },
  { id: 'dr_onesie_eenhoorn', shape: 'onesie',  name: 'Eenhoorn-onesie',     c: ['#e9d3ff', '#ff8fcf'], pattern: 'stars', tags: ['pyjama', 'sprookje'], glam: 1, hue: 'paars', lvl: 4 },
  { id: 'dr_onesie_dino',   shape: 'onesie',    name: 'Dino-onesie',         c: ['#3fbf63', '#ffd23f'], tags: ['pyjama', 'stoer'], hue: 'groen', lvl: 7 },
  { id: 'dr_badpak_roze',   shape: 'swimsuit',  name: 'Roze Badpak',         c: ['#ff5da2', '#ffffff'], pattern: 'dots', tags: ['zwemmen', 'strand', 'zomer'], full: true, hue: 'roze', lvl: 2 },
  { id: 'dr_badpak_blauw',  shape: 'swimsuit',  name: 'Blauw Badpak',        c: ['#3a86ff', '#ffffff'], pattern: 'stripes', tags: ['zwemmen', 'strand', 'sport'], full: true, hue: 'blauw', lvl: 2 },
  { id: 'dr_badpak_regenboog', shape: 'swimsuit', name: 'Regenboog Badpak',  c: ['#ff5c5c'], pattern: 'rainbow', tags: ['zwemmen', 'strand', 'feest'], full: true, glam: 1, hue: 'multi', lvl: 10 },
  { id: 'dr_jumpsuit',      shape: 'jumpsuit',  name: 'Jumpsuit',            c: ['#23202a', '#f1c232'], tags: ['chic', 'dans', 'disco'], glam: 2, hue: 'zwart', lvl: 6 },
  { id: 'dr_jumpsuit_glitter', shape: 'jumpsuit', name: 'Disco Jumpsuit',    c: ['#8e5bd9', '#ffffff'], pattern: 'glitter', tags: ['disco', 'dans', 'feest'], glam: 3, hue: 'paars', lvl: 10 },
  { id: 'dr_bal',           shape: 'ballgown',  name: 'Baljurk',             c: ['#5aa9e6', '#bfe3ff'], tags: ['chic', 'feest', 'sprookje', 'prinses'], glam: 3, hue: 'blauw', lvl: 4 },
  { id: 'dr_bal_roze',      shape: 'ballgown',  name: 'Roze Baljurk',        c: ['#ff8fcf', '#ffffff'], tags: ['chic', 'feest', 'prinses'], glam: 3, hue: 'roze', lvl: 5 },
  { id: 'dr_bal_paars',     shape: 'ballgown',  name: 'Paarse Baljurk',      c: ['#8e5bd9', '#e9d3ff'], tags: ['chic', 'prinses', 'sprookje'], glam: 3, hue: 'paars', lvl: 9 },
  { id: 'dr_bloemen',       shape: 'aline',     name: 'Bloemenjurk',         c: ['#fff6e5', '#ff8fab'], pattern: 'flowers', tags: ['bloemen', 'zomer', 'chic'], glam: 2, hue: 'roze', lvl: 8 },
  { id: 'dr_prinses',       shape: 'princess',  name: 'Prinsessenjurk',      c: ['#ff7bc0', '#ffffff'], tags: ['sprookje', 'chic', 'feest', 'prinses'], glam: 3, hue: 'roze', lvl: 4 },
  { id: 'dr_prinses_geel',  shape: 'princess',  name: 'Gouden Prinsessenjurk', c: ['#ffd23f', '#fff3b0'], tags: ['prinses', 'chic', 'feest'], glam: 3, hue: 'geel', lvl: 13 },
  { id: 'dr_ijsprinses',    shape: 'princess',  name: 'IJsprinsessenjurk',   c: ['#bfe3ff', '#ffffff'], pattern: 'glitter', tags: ['prinses', 'winter', 'sprookje', 'chic'], glam: 3, hue: 'blauw', lvl: 8 },
  { id: 'dr_heks',          shape: 'witch',     name: 'Heksenjurk',          c: ['#23202a', '#8e5bd9'], tags: ['eng'], glam: 2, hue: 'zwart', lvl: 10 },
  { id: 'dr_sterren',       shape: 'aline',     name: 'Sterrenjurk',         c: ['#1d2b6b', '#ffd23f'], pattern: 'stars', tags: ['ruimte', 'feest'], glam: 2, hue: 'blauw', lvl: 11 },
  { id: 'dr_kerst',         shape: 'aline',     name: 'Kerstjurk',           c: ['#c8102e', '#ffffff'], deco: 'trim', tags: ['kerst', 'feest'], glam: 2, hue: 'rood', lvl: 12 },
  { id: 'dr_zwart',         shape: 'sundress',  name: 'Kleine Zwarte Jurk',  c: ['#23202a', '#23202a'], tags: ['chic'], glam: 3, hue: 'zwart', lvl: 13 },
  { id: 'dr_regenboog',     shape: 'aline',     name: 'Regenboogjurk',       c: ['#ff5c5c'], pattern: 'rainbow', tags: ['feest', 'disco'], glam: 2, hue: 'multi', lvl: 14 },
  { id: 'dr_zeemeermin',    shape: 'mermaid',   name: 'Zeemeerminjurk',      c: ['#2fd1a8', '#1f9d8a'], pattern: 'scales', tags: ['sprookje', 'strand', 'feest'], glam: 3, hue: 'groen', lvl: 10 },
  { id: 'dr_zeemeermin_paars', shape: 'mermaid', name: 'Paarse Zeemeerminjurk', c: ['#8e5bd9', '#5a3aa8'], pattern: 'scales', tags: ['sprookje', 'strand', 'chic'], glam: 3, hue: 'paars', lvl: 16 },
  { id: 'dr_popster',       shape: 'aline',     name: 'Popsterjurk',         c: ['#8e5bd9', '#ffffff'], pattern: 'glitter', tags: ['muziek', 'feest', 'disco'], glam: 3, hue: 'paars', lvl: 17 },
  { id: 'dr_balletjurk',    shape: 'aline',     name: 'Balletjurkje',        c: ['#ffb3d9', '#ffffff'], tags: ['dans', 'chic'], glam: 2, hue: 'roze', lvl: 12 },
  { id: 'dr_trouw',         shape: 'ballgown',  name: 'Trouwjurk',           c: ['#ffffff', '#fff3b0'], pattern: 'glitter', tags: ['bruiloft', 'chic'], glam: 3, hue: 'wit', lvl: 18 },
  { id: 'dr_goud',          shape: 'ballgown',  name: 'Gouden Galajurk',     c: ['#f1c232', '#fff3b0'], tags: ['chic', 'feest', 'prinses'], glam: 3, hue: 'goud', lvl: 19 },
]);

/* ---------- Schoenen ---------- */
variants('shoes', 'sneaker', { tags: ['casual', 'sport', 'school'] }, [
  { id: 'sh_sneakers',      name: 'Witte Sneakers',   c: ['#ffffff', '#3a86ff'], hue: 'wit', lvl: 1 },
  { id: 'sh_sneakers_roze', name: 'Roze Sneakers',    c: ['#ff8fcf', '#ffffff'], hue: 'roze', lvl: 1, tags: ['casual', 'sport', 'school', 'dans'] },
  { id: 'sh_sneakers_zwart',name: 'Zwarte Sneakers',  c: ['#23202a', '#ffffff'], hue: 'zwart', lvl: 2, tags: ['casual', 'sport', 'dans', 'stoer'] },
  { id: 'sh_sport',         name: 'Sportschoenen',    c: ['#2fd1a8', '#23202a'], hue: 'groen', lvl: 1, tags: ['sport'] },
  { id: 'sh_voetbal',       name: 'Voetbalschoenen',  c: ['#ff8c42', '#23202a'], hue: 'oranje', lvl: 3, tags: ['sport'] },
  { id: 'sh_hightops',      name: 'Hoge Sneakers',    c: ['#e63946', '#ffffff'], hue: 'rood', lvl: 5, tags: ['casual', 'dans', 'stoer'] },
  { id: 'sh_glittersneakers', name: 'Glittersneakers', c: ['#f1c232', '#ffffff'], hue: 'goud', glam: 2, lvl: 9, tags: ['dans', 'disco', 'feest'] },
  { id: 'sh_regenboogsneakers', name: 'Regenboogsneakers', c: ['#ffffff', '#ff5da2'], hue: 'multi', glam: 1, lvl: 14, tags: ['feest', 'dans', 'casual'] },
]);
variants('shoes', 'boot', { tags: ['casual', 'winter', 'school'] }, [
  { id: 'sh_laarsjes',      name: 'Bruine Laarsjes',  c: ['#8b5a2b', '#5c3a17'], hue: 'bruin', lvl: 1 },
  { id: 'sh_laarsjes_zwart',name: 'Zwarte Laarsjes',  c: ['#23202a', '#444'], hue: 'zwart', lvl: 3, tags: ['casual', 'winter', 'chic'] },
  { id: 'sh_boots',         name: 'Stoere Boots',     c: ['#23202a', '#9a9aa8'], hue: 'zwart', glam: 1, lvl: 7, tags: ['stoer', 'muziek', 'dans'] },
  { id: 'sh_rijlaarzen',    name: 'Rijlaarzen',       c: ['#2b2115', '#2b2115'], hue: 'bruin', lvl: 7, tags: ['paard', 'sport'] },
  { id: 'sh_cowboy',        name: 'Cowboylaarzen',    c: ['#c98a5e', '#8b5a2b'], hue: 'bruin', lvl: 9, tags: ['paard', 'stoer', 'casual'] },
]);
variants('shoes', 'rainboot', { tags: ['regen'] }, [
  { id: 'sh_regen',         name: 'Rode Regenlaarzen', c: ['#e63946', '#ffffff'], hue: 'rood', lvl: 6 },
  { id: 'sh_regen_geel',    name: 'Gele Regenlaarzen', c: ['#ffd23f', '#ffffff'], hue: 'geel', lvl: 6 },
  { id: 'sh_held',          name: 'Heldenlaarzen',    c: ['#e63946', '#ffd23f'], hue: 'rood', glam: 1, lvl: 15, tags: ['held'] },
]);
variants('shoes', 'snowboot', { tags: ['winter', 'warm'] }, [
  { id: 'sh_snowboots',     name: 'Snowboots',        c: ['#5aa9e6', '#ffffff'], hue: 'blauw', lvl: 4 },
  { id: 'sh_skischoenen',   name: 'Skischoenen',      c: ['#ff5da2', '#23202a'], hue: 'roze', lvl: 11, tags: ['winter', 'sport'] },
]);
variants('shoes', 'heels', { tags: ['chic', 'feest'] }, [
  { id: 'sh_hakken',        name: 'Glitterhakjes',    c: ['#ff5da2', '#ffffff'], hue: 'roze', glam: 3, lvl: 5, tags: ['chic', 'feest', 'prinses'] },
  { id: 'sh_pumps',         name: 'Rode Pumps',       c: ['#e63946', '#e63946'], hue: 'rood', glam: 3, lvl: 13 },
  { id: 'sh_hakken_zilver', name: 'Zilveren Hakjes',  c: ['#c9d1dc', '#ffffff'], hue: 'zilver', glam: 3, lvl: 8, tags: ['chic', 'prinses', 'disco'] },
  { id: 'sh_hakken_goud',   name: 'Gouden Hakjes',    c: ['#f1c232', '#ffffff'], hue: 'goud', glam: 3, lvl: 17, tags: ['chic', 'feest', 'prinses'] },
]);
variants('shoes', 'dress', { tags: ['chic', 'school'] }, [
  { id: 'sh_net',           name: 'Nette Schoenen',   c: ['#23202a'], hue: 'zwart', glam: 1, lvl: 1, tags: ['chic', 'school', 'bruiloft'] },
  { id: 'sh_lak_rood',      name: 'Rode Lakschoentjes', c: ['#e63946'], hue: 'rood', glam: 1, lvl: 2, tags: ['chic', 'school', 'feest'] },
  { id: 'sh_loafers',       name: 'Loafers',          c: ['#8b5a2b'], hue: 'bruin', glam: 1, lvl: 4 },
]);
variants('shoes', 'ballet', { tags: ['dans', 'chic'] }, [
  { id: 'sh_ballet',        name: 'Balletschoentjes', c: ['#ffb3d9'], hue: 'roze', glam: 1, lvl: 1, tags: ['dans', 'feest', 'chic', 'prinses'] },
  { id: 'sh_spitzen',       name: 'Spitzen',          c: ['#f6c9b0'], hue: 'roze', glam: 2, lvl: 12, tags: ['dans', 'chic'] },
  { id: 'sh_wit_ballet',    name: 'Witte Ballerina\'s', c: ['#ffffff'], hue: 'wit', glam: 2, lvl: 18, tags: ['bruiloft', 'chic', 'dans'] },
  { id: 'sh_ballet_zwart',  name: 'Zwarte Ballerina\'s', c: ['#23202a'], hue: 'zwart', glam: 1, lvl: 3, tags: ['dans', 'chic', 'school'] },
]);
add('shoes', [
  { id: 'sh_slippers',      shape: 'flipflop',  name: 'Teenslippers',        c: ['#ffd23f', '#ff8c42'], tags: ['strand', 'zomer', 'zwemmen'], hue: 'geel', lvl: 2 },
  { id: 'sh_slippers_roze', shape: 'flipflop',  name: 'Roze Slippers',       c: ['#ff8fcf', '#ffffff'], tags: ['strand', 'zomer', 'zwemmen'], hue: 'roze', lvl: 2 },
  { id: 'sh_klompjes',      shape: 'clog',      name: 'Klompjes',            c: ['#5fd7a8', '#2d9a6a'], tags: ['casual', 'zomer', 'zwemmen', 'strand'], hue: 'groen', lvl: 1 },
  { id: 'sh_klompjes_roze', shape: 'clog',      name: 'Roze Klompjes',       c: ['#ff8fcf', '#e06fb0'], tags: ['casual', 'zomer', 'zwemmen'], hue: 'roze', lvl: 3 },
  { id: 'sh_sandalen',      shape: 'sandal',    name: 'Sandaaltjes',         c: ['#c98a5e', '#ff8fab'], tags: ['zomer', 'bloemen', 'strand'], hue: 'bruin', lvl: 5 },
  { id: 'sh_goud',          shape: 'sandal',    name: 'Gouden Sandalen',     c: ['#f1c232', '#f1c232'], tags: ['chic', 'feest', 'prinses'], glam: 3, hue: 'goud', lvl: 19 },
  { id: 'sh_monster',       shape: 'monster',   name: 'Monstersloffen',      c: ['#5fd7a8', '#ffffff'], tags: ['eng', 'pyjama', 'casual'], hue: 'groen', lvl: 10 },
  { id: 'sh_konijn',        shape: 'bunny',     name: 'Konijnensloffen',     c: ['#ffffff', '#ffb3d9'], tags: ['pyjama', 'casual'], hue: 'wit', lvl: 1 },
  { id: 'sh_ruimte',        shape: 'spaceboot', name: 'Ruimtelaarzen',       c: ['#d9dee8', '#ff8c42'], tags: ['ruimte'], glam: 2, hue: 'zilver', lvl: 11 },
  { id: 'sh_elf',           shape: 'elf',       name: 'Elfenschoentjes',     c: ['#2d9a6a', '#ffd23f'], tags: ['kerst', 'sprookje'], glam: 1, hue: 'groen', lvl: 12 },
  { id: 'sh_piraat',        shape: 'pirateboot',name: 'Piratenlaarzen',      c: ['#5c3a17', '#3b2410'], tags: ['piraat', 'stoer'], hue: 'bruin', lvl: 16 },
  { id: 'sh_platform',      shape: 'platform',  name: 'Glitterplatforms',    c: ['#8e5bd9', '#ffffff'], tags: ['muziek', 'feest', 'disco', 'dans'], glam: 3, hue: 'paars', lvl: 10 },
  { id: 'sh_platform_roze', shape: 'platform',  name: 'Roze Platforms',      c: ['#ff5da2', '#ffffff'], tags: ['disco', 'dans', 'feest'], glam: 3, hue: 'roze', lvl: 6 },
]);

/* ---------- Hoedjes & haarspullen ---------- */
variants('hat', 'bowband', { tags: ['casual', 'feest', 'school'] }, [
  { id: 'hat_strik',        name: 'Haarband met Strik', c: ['#ff5da2'], hue: 'roze', glam: 1, lvl: 1 },
  { id: 'hat_strik_blauw',  name: 'Blauwe Strik',     c: ['#3a86ff'], hue: 'blauw', glam: 1, lvl: 2 },
  { id: 'hat_strik_wit',    name: 'Witte Strik',      c: ['#ffffff'], hue: 'wit', glam: 1, lvl: 3, tags: ['chic', 'dans', 'bruiloft'] },
  { id: 'hat_cheerstrik',   name: 'Cheerleaderstrik', c: ['#e63946'], hue: 'rood', glam: 1, lvl: 14, tags: ['sport', 'dans', 'feest'] },
]);
variants('hat', 'cap', { tags: ['casual', 'sport'] }, [
  { id: 'hat_pet',          name: 'Rode Pet',         c: ['#e63946'], hue: 'rood', lvl: 1 },
  { id: 'hat_pet_blauw',    name: 'Blauwe Pet',       c: ['#3a86ff'], hue: 'blauw', lvl: 2 },
  { id: 'hat_pet_zwart',    name: 'Zwarte Pet',       c: ['#23202a'], hue: 'zwart', lvl: 5, tags: ['casual', 'stoer', 'dans'] },
]);
variants('hat', 'beanie', { tags: ['winter', 'warm'] }, [
  { id: 'hat_muts',         name: 'Muts met Pompon',  c: ['#e63946', '#ffffff'], hue: 'rood', lvl: 4 },
  { id: 'hat_muts_roze',    name: 'Roze Muts',        c: ['#ff8fcf', '#ffffff'], hue: 'roze', lvl: 4 },
  { id: 'hat_muts_blauw',   name: 'Blauwe Skimuts',   c: ['#3a86ff', '#ffd23f'], hue: 'blauw', lvl: 11, tags: ['winter', 'warm', 'sport'] },
]);
variants('hat', 'crown', { tags: ['prinses', 'chic', 'sprookje'] }, [
  { id: 'hat_kroon',        name: 'Gouden Kroon',     c: ['#f1c232', '#e63946'], hue: 'goud', glam: 3, lvl: 4 },
  { id: 'hat_kroon_zilver', name: 'Zilveren Kroon',   c: ['#d9dee8', '#5aa9e6'], hue: 'zilver', glam: 3, lvl: 8, tags: ['prinses', 'winter', 'chic'] },
  { id: 'hat_kroon_roze',   name: 'Roze Kroontje',    c: ['#ff8fcf', '#ffffff'], hue: 'roze', glam: 2, lvl: 13 },
]);
variants('hat', 'tiara', { tags: ['chic', 'feest', 'prinses', 'bruiloft'] }, [
  { id: 'hat_tiara',        name: 'Tiara',            c: ['#d9dee8', '#ff5da2'], hue: 'zilver', glam: 2, lvl: 1 },
  { id: 'hat_tiara_goud',   name: 'Gouden Tiara',     c: ['#f1c232', '#3a86ff'], hue: 'goud', glam: 2, lvl: 5 },
]);
add('hat', [
  { id: 'hat_zonnehoed',    shape: 'sunhat',    name: 'Zonnehoed',           c: ['#f3d9a4', '#ff8fab'], tags: ['strand', 'zomer'], hue: 'geel', lvl: 2 },
  { id: 'hat_bucket',       shape: 'bucket',    name: 'Bucket Hat',          c: ['#5fd7a8', '#2d9a6a'], tags: ['casual', 'zomer', 'strand', 'dans'], hue: 'groen', lvl: 2 },
  { id: 'hat_bucket_roze',  shape: 'bucket',    name: 'Roze Bucket Hat',     c: ['#ff8fcf', '#ff5da2'], tags: ['casual', 'zomer', 'dans'], hue: 'roze', lvl: 6 },
  { id: 'hat_badmuts',      shape: 'swimcap',   name: 'Badmuts',             c: ['#3a86ff'], tags: ['zwemmen'], hue: 'blauw', lvl: 2 },
  { id: 'hat_badmuts_roze', shape: 'swimcap',   name: 'Roze Badmuts',        c: ['#ff5da2'], tags: ['zwemmen'], hue: 'roze', lvl: 4 },
  { id: 'hat_zweetband',    shape: 'sweatband', name: 'Zweetband',           c: ['#2fd1a8'], tags: ['sport', 'dans'], hue: 'groen', lvl: 1 },
  { id: 'hat_kattenoren',   shape: 'catears',   name: 'Kattenoortjes',       c: ['#23202a', '#ff8fab'], tags: ['feest', 'casual', 'pyjama'], glam: 1, hue: 'zwart', lvl: 3 },
  { id: 'hat_konijnenoren', shape: 'bunnyears', name: 'Konijnenoortjes',     c: ['#ffffff', '#ffb3d9'], tags: ['pyjama', 'feest', 'casual'], glam: 1, hue: 'wit', lvl: 1 },
  { id: 'hat_zuidwester',   shape: 'rainhat',   name: 'Zuidwester',          c: ['#ffd23f'], tags: ['regen'], hue: 'geel', lvl: 6 },
  { id: 'hat_bandana',      shape: 'bandana',   name: 'Bandana',             c: ['#e63946', '#ffffff'], pattern: 'dots', tags: ['stoer', 'muziek', 'piraat', 'dans'], hue: 'rood', lvl: 7 },
  { id: 'hat_bloemenkrans', shape: 'flowercrown',name: 'Bloemenkrans',       c: ['#ff8fab', '#ffd23f'], tags: ['bloemen', 'zomer', 'sprookje', 'bruiloft'], glam: 1, hue: 'roze', lvl: 8 },
  { id: 'hat_eenhoorn',     shape: 'unicorn',   name: 'Eenhoornhoorn',       c: ['#ffffff', '#f1c232'], tags: ['sprookje', 'feest', 'prinses'], glam: 2, hue: 'wit', lvl: 9 },
  { id: 'hat_heks',         shape: 'witchhat',  name: 'Heksenhoed',          c: ['#23202a', '#8e5bd9'], tags: ['eng'], glam: 1, hue: 'zwart', lvl: 10 },
  { id: 'hat_helm',         shape: 'spacehelmet',name: 'Ruimtehelm',         c: ['#d9dee8'], tags: ['ruimte'], glam: 2, hue: 'zilver', lvl: 11 },
  { id: 'hat_rijcap',       shape: 'helmet',    name: 'Rijcap',              c: ['#23202a'], tags: ['paard', 'sport'], hue: 'zwart', lvl: 7 },
  { id: 'hat_skihelm',      shape: 'helmet',    name: 'Skihelm',             c: ['#ffffff'], tags: ['winter', 'sport'], hue: 'wit', lvl: 11 },
  { id: 'hat_kerstmuts',    shape: 'santa',     name: 'Kerstmuts',           c: ['#c8102e', '#ffffff'], tags: ['kerst', 'winter', 'feest'], hue: 'rood', lvl: 12 },
  { id: 'hat_baret',        shape: 'beret',     name: 'Baret',               c: ['#23202a'], tags: ['chic'], glam: 2, hue: 'zwart', lvl: 13 },
  { id: 'hat_baret_rood',   shape: 'beret',     name: 'Rode Baret',          c: ['#e63946'], tags: ['chic', 'casual'], glam: 2, hue: 'rood', lvl: 13 },
  { id: 'hat_feesthoed',    shape: 'partyhat',  name: 'Feesthoed',           c: ['#8e5bd9', '#ffd23f'], pattern: 'stripes', tags: ['feest'], glam: 1, hue: 'multi', lvl: 1 },
  { id: 'hat_prinsessenhoed', shape: 'hennin',  name: 'Prinsessenhoed',      c: ['#ff8fcf', '#ffffff'], tags: ['prinses', 'sprookje', 'chic'], glam: 2, hue: 'roze', lvl: 5 },
  { id: 'hat_piraat',       shape: 'piratehat', name: 'Piratenhoed',         c: ['#23202a', '#ffffff'], tags: ['piraat'], glam: 1, hue: 'zwart', lvl: 16 },
  { id: 'hat_koptelefoon',  shape: 'headphones',name: 'Koptelefoon',         c: ['#ff5da2', '#23202a'], tags: ['muziek', 'stoer', 'dans'], glam: 1, hue: 'roze', lvl: 9 },
  { id: 'hat_sluier',       shape: 'veil',      name: 'Bruidssluier',        c: ['#ffffff', '#f1c232'], tags: ['bruiloft', 'chic'], glam: 3, hue: 'wit', lvl: 18 },
]);

/* ---------- Brillen & maskers ---------- */
add('glasses', [
  { id: 'gl_rond',          shape: 'round',     name: 'Rond Brilletje',      c: ['#8b5a2b'], tags: ['school', 'chic'], hue: 'bruin', lvl: 1 },
  { id: 'gl_rond_roze',     shape: 'round',     name: 'Roze Brilletje',      c: ['#ff5da2'], tags: ['school', 'casual'], hue: 'roze', lvl: 3 },
  { id: 'gl_zonnebril',     shape: 'sunglasses',name: 'Zonnebril',           c: ['#23202a'], tags: ['strand', 'zomer', 'stoer'], glam: 1, hue: 'zwart', lvl: 2 },
  { id: 'gl_zonnebril_wit', shape: 'sunglasses',name: 'Witte Zonnebril',     c: ['#ffffff'], tags: ['strand', 'zomer', 'disco'], glam: 1, hue: 'wit', lvl: 6 },
  { id: 'gl_zwembril',      shape: 'goggles',   name: 'Zwembril',            c: ['#3a86ff'], tags: ['zwemmen'], hue: 'blauw', lvl: 2 },
  { id: 'gl_skibril',       shape: 'skigoggles',name: 'Skibril',             c: ['#ff5da2'], tags: ['winter', 'sport'], hue: 'roze', lvl: 11 },
  { id: 'gl_sterren',       shape: 'stars',     name: 'Sterrenbril',         c: ['#ffd23f'], tags: ['muziek', 'feest', 'disco'], glam: 2, hue: 'geel', lvl: 6 },
  { id: 'gl_hartjes',       shape: 'hearts',    name: 'Hartjesbril',         c: ['#ff5da2'], tags: ['feest', 'bloemen', 'zomer'], glam: 1, hue: 'roze', lvl: 8 },
  { id: 'gl_masker',        shape: 'heromask',  name: 'Heldenmasker',        c: ['#3a86ff'], tags: ['held'], glam: 1, hue: 'blauw', lvl: 15 },
  { id: 'gl_ooglapje',      shape: 'eyepatch',  name: 'Ooglapje',            c: ['#23202a'], tags: ['piraat'], hue: 'zwart', lvl: 16 },
]);

/* ---------- Om de nek ---------- */
add('neck', [
  { id: 'nk_hartje',        shape: 'pendant',   name: 'Hartjeshanger',       c: ['#f1c232', '#ff5da2'], tags: ['casual', 'feest', 'chic', 'prinses'], glam: 1, hue: 'goud', lvl: 1 },
  { id: 'nk_ster',          shape: 'pendant',   name: 'Sterrenketting',      c: ['#d9dee8', '#ffd23f'], deco: 'star', tags: ['muziek', 'ruimte', 'feest', 'dans'], glam: 2, hue: 'zilver', lvl: 3 },
  { id: 'nk_lei',           shape: 'lei',       name: 'Bloemenslinger',      c: ['#ff8fab', '#ffd23f'], tags: ['strand', 'zomer', 'bloemen'], glam: 1, hue: 'roze', lvl: 2 },
  { id: 'nk_medaille',      shape: 'medal',     name: 'Gouden Medaille',     c: ['#3a86ff', '#f1c232'], tags: ['sport', 'zwemmen', 'paard'], glam: 1, hue: 'goud', lvl: 1 },
  { id: 'nk_sjaal',         shape: 'scarf',     name: 'Warme Sjaal',         c: ['#e63946'], tags: ['winter', 'warm'], hue: 'rood', lvl: 4 },
  { id: 'nk_sjaal_blauw',   shape: 'scarf',     name: 'Blauwe Sjaal',        c: ['#3a86ff'], tags: ['winter', 'warm', 'sport'], hue: 'blauw', lvl: 4 },
  { id: 'nk_kerstsjaal',    shape: 'scarf',     name: 'Kerstsjaal',          c: ['#2d9a6a', '#c8102e'], pattern: 'stripes', tags: ['kerst', 'winter'], hue: 'groen', lvl: 12 },
  { id: 'nk_parels',        shape: 'pearls',    name: 'Parelketting',        c: ['#fff8f0'], tags: ['chic', 'feest', 'bruiloft', 'prinses'], glam: 2, hue: 'wit', lvl: 4 },
  { id: 'nk_vlinderdas',    shape: 'bowtie',    name: 'Vlinderdas',          c: ['#e63946'], tags: ['chic', 'feest'], glam: 2, hue: 'rood', lvl: 2 },
  { id: 'nk_vlinderdas_zwart', shape: 'bowtie', name: 'Zwarte Vlinderdas',   c: ['#23202a'], tags: ['chic', 'bruiloft', 'dans'], glam: 2, hue: 'zwart', lvl: 5 },
  { id: 'nk_stropdas',      shape: 'tie',       name: 'Stropdas',            c: ['#2a4f8a'], tags: ['chic', 'school', 'paard'], glam: 1, hue: 'blauw', lvl: 3 },
  { id: 'nk_spikes',        shape: 'choker',    name: 'Stoere Ketting',      c: ['#23202a', '#d9dee8'], tags: ['stoer', 'muziek', 'dans'], glam: 1, hue: 'zwart', lvl: 7 },
  { id: 'nk_zijden',        shape: 'silkscarf', name: 'Zijden Sjaaltje',     c: ['#ff5da2', '#ffd23f'], pattern: 'dots', tags: ['chic'], glam: 2, hue: 'roze', lvl: 13 },
  { id: 'nk_bandana',       shape: 'silkscarf', name: 'Bandanasjaaltje',     c: ['#e63946', '#ffffff'], pattern: 'dots', tags: ['casual', 'stoer', 'paard'], hue: 'rood', lvl: 5 },
  { id: 'nk_diamant',       shape: 'diamond',   name: 'Diamanten Ketting',   c: ['#d9dee8', '#bfe3ff'], tags: ['bruiloft', 'chic', 'prinses'], glam: 3, hue: 'zilver', lvl: 16 },
  { id: 'nk_disco',         shape: 'pendant',   name: 'Discobal Hanger',     c: ['#c9d1dc', '#c9d1dc'], deco: 'star', tags: ['disco', 'dans', 'feest'], glam: 2, hue: 'zilver', lvl: 6 },
]);

/* ---------- Tassen ---------- */
add('bag', [
  { id: 'bg_rugzak',        shape: 'backpack',  name: 'Rugzak',              c: ['#8e5bd9', '#ffd23f'], tags: ['school', 'casual', 'sport'], hue: 'paars', lvl: 1 },
  { id: 'bg_rugzak_roze',   shape: 'backpack',  name: 'Roze Rugzak',         c: ['#ff8fcf', '#ffffff'], tags: ['school', 'casual'], hue: 'roze', lvl: 1 },
  { id: 'bg_sporttas',      shape: 'backpack',  name: 'Sporttas',            c: ['#23202a', '#2fd1a8'], tags: ['sport', 'dans', 'zwemmen'], hue: 'zwart', lvl: 3 },
  { id: 'bg_strandtas',     shape: 'tote',      name: 'Strandtas',           c: ['#ffffff', '#3a86ff'], pattern: 'stripes', tags: ['strand', 'zomer', 'zwemmen'], hue: 'blauw', lvl: 2 },
  { id: 'bg_zwemtas',       shape: 'tote',      name: 'Zwemtas',             c: ['#5aa9e6', '#ffffff'], pattern: 'dots', tags: ['zwemmen', 'sport'], hue: 'blauw', lvl: 2 },
  { id: 'bg_handtas',       shape: 'handbag',   name: 'Glitterhandtasje',    c: ['#ff5da2', '#f1c232'], pattern: 'glitter', tags: ['chic', 'feest', 'prinses'], glam: 2, hue: 'roze', lvl: 4 },
  { id: 'bg_handtas_rood',  shape: 'handbag',   name: 'Rood Handtasje',      c: ['#e63946', '#f1c232'], tags: ['chic', 'casual'], glam: 1, hue: 'rood', lvl: 2 },
  { id: 'bg_mandje',        shape: 'basket',    name: 'Picknickmandje',      c: ['#c98a5e', '#e63946'], tags: ['bloemen', 'zomer'], hue: 'bruin', lvl: 8 },
  { id: 'bg_chic',          shape: 'chainbag',  name: 'Chique Tas',          c: ['#23202a', '#f1c232'], tags: ['chic'], glam: 3, hue: 'zwart', lvl: 13 },
  { id: 'bg_sterren',       shape: 'handbag',   name: 'Sterrentas',          c: ['#1d2b6b', '#ffd23f'], pattern: 'stars', tags: ['muziek', 'feest', 'ruimte', 'disco'], glam: 2, hue: 'blauw', lvl: 11 },
]);

/* ---------- In je hand ---------- */
add('hand', [
  { id: 'hd_beer',          shape: 'teddy',     name: 'Knuffelbeer',         c: ['#c98a5e'], tags: ['casual', 'school', 'pyjama'], hue: 'bruin', lvl: 1 },
  { id: 'hd_beer_roze',     shape: 'teddy',     name: 'Roze Knuffel',        c: ['#ff8fcf'], tags: ['pyjama', 'casual', 'feest'], hue: 'roze', lvl: 2 },
  { id: 'hd_ijsje',         shape: 'icecream',  name: 'IJsje',               c: ['#ff8fcf', '#ffffff'], tags: ['zomer', 'strand'], hue: 'roze', lvl: 2 },
  { id: 'hd_strandbal',     shape: 'beachball', name: 'Strandbal',           c: ['#e63946', '#3a86ff'], tags: ['strand', 'zomer', 'zwemmen'], hue: 'multi', lvl: 2 },
  { id: 'hd_zwemband',      shape: 'swimring',  name: 'Zwemband',            c: ['#ff5da2', '#ffffff'], tags: ['zwemmen', 'strand'], hue: 'roze', lvl: 2 },
  { id: 'hd_voetbal',       shape: 'football',  name: 'Voetbal',             c: ['#ffffff'], tags: ['sport'], hue: 'wit', lvl: 1 },
  { id: 'hd_racket',        shape: 'racket',    name: 'Tennisracket',        c: ['#e63946'], tags: ['sport'], hue: 'rood', lvl: 3 },
  { id: 'hd_hockey',        shape: 'hockeystick', name: 'Hockeystick',       c: ['#3a86ff'], tags: ['sport'], hue: 'blauw', lvl: 5 },
  { id: 'hd_springtouw',    shape: 'jumprope',  name: 'Springtouw',          c: ['#ff5da2'], tags: ['sport', 'casual', 'school'], hue: 'roze', lvl: 1 },
  { id: 'hd_pompons',       shape: 'pompoms',   name: 'Pompons',             c: ['#e63946', '#ffd23f'], tags: ['sport', 'dans', 'feest'], glam: 1, hue: 'rood', lvl: 5 },
  { id: 'hd_lint',          shape: 'ribbon',    name: 'Turnlint',            c: ['#ff5da2'], tags: ['sport', 'dans'], glam: 1, hue: 'roze', lvl: 5 },
  { id: 'hd_paraplu',       shape: 'umbrella',  name: 'Paraplu',             c: ['#ff5da2', '#ffffff'], tags: ['regen'], hue: 'roze', lvl: 6 },
  { id: 'hd_gitaar',        shape: 'guitar',    name: 'Gitaar',              c: ['#e63946', '#5c3a17'], tags: ['muziek', 'stoer'], glam: 2, hue: 'rood', lvl: 7 },
  { id: 'hd_toverstaf',     shape: 'wand',      name: 'Toverstaf',           c: ['#f1c232', '#ff5da2'], tags: ['sprookje', 'prinses'], glam: 2, hue: 'goud', lvl: 4 },
  { id: 'hd_pompoen',       shape: 'pumpkin',   name: 'Pompoenemmertje',     c: ['#ff8c42'], tags: ['eng'], hue: 'oranje', lvl: 10 },
  { id: 'hd_kijker',        shape: 'telescope', name: 'Sterrenkijker',       c: ['#1d2b6b', '#d9dee8'], tags: ['ruimte'], hue: 'blauw', lvl: 11 },
  { id: 'hd_cadeau',        shape: 'gift',      name: 'Cadeautje',           c: ['#c8102e', '#f1c232'], tags: ['kerst', 'feest'], hue: 'rood', lvl: 1 },
  { id: 'hd_ballonnen',     shape: 'balloons',  name: 'Ballonnen',           c: ['#ff5da2', '#ffd23f', '#3a86ff'], tags: ['feest'], glam: 1, hue: 'multi', lvl: 1 },
  { id: 'hd_zwaard',        shape: 'sword',     name: 'Piratenzwaard',       c: ['#d9dee8', '#5c3a17'], tags: ['piraat', 'stoer'], hue: 'zilver', lvl: 16 },
  { id: 'hd_microfoon',     shape: 'mic',       name: 'Microfoon',           c: ['#23202a', '#d9dee8'], tags: ['muziek', 'feest', 'disco'], glam: 2, hue: 'zwart', lvl: 9 },
  { id: 'hd_boeket',        shape: 'bouquet',   name: 'Bruidsboeket',        c: ['#ffffff', '#ff8fab'], tags: ['bruiloft', 'bloemen'], glam: 2, hue: 'wit', lvl: 18 },
  { id: 'hd_wortel',        shape: 'carrot',    name: 'Wortel voor het Paard', c: ['#ff8c42', '#3fbf63'], tags: ['paard'], hue: 'oranje', lvl: 7 },
]);

/* ---------- Op je rug ---------- */
add('back', [
  { id: 'bk_vleugels',      shape: 'fairywings',name: 'Feeënvleugels',       c: ['#bfe3ff', '#ffffff'], tags: ['sprookje', 'feest', 'prinses'], glam: 2, hue: 'blauw', lvl: 4 },
  { id: 'bk_vleugels_roze', shape: 'fairywings',name: 'Roze Vleugeltjes',    c: ['#ffb3d9', '#ffffff'], tags: ['sprookje', 'feest', 'prinses', 'dans'], glam: 2, hue: 'roze', lvl: 9 },
  { id: 'bk_vampier',       shape: 'cape',      name: 'Vampiercape',         c: ['#23202a', '#c8102e'], tags: ['eng'], glam: 2, hue: 'zwart', lvl: 10 },
  { id: 'bk_prinsessencape',shape: 'cape',      name: 'Prinsessencape',      c: ['#ff8fcf', '#ffffff'], tags: ['prinses', 'chic', 'sprookje'], glam: 2, hue: 'roze', lvl: 5 },
  { id: 'bk_koningscape',   shape: 'cape',      name: 'Koninklijke Cape',    c: ['#8e5bd9', '#f1c232'], tags: ['prinses', 'chic', 'sprookje'], glam: 3, hue: 'paars', lvl: 13 },
  { id: 'bk_jetpack',       shape: 'jetpack',   name: 'Jetpack',             c: ['#d9dee8', '#ff8c42'], tags: ['ruimte', 'held'], glam: 2, hue: 'zilver', lvl: 11 },
  { id: 'bk_vlinder',       shape: 'butterfly', name: 'Vlindervleugels',     c: ['#ff5da2', '#ffd23f'], tags: ['feest', 'bloemen', 'sprookje'], glam: 2, hue: 'multi', lvl: 14 },
  { id: 'bk_heldencape',    shape: 'cape',      name: 'Heldencape',          c: ['#e63946', '#ffd23f'], tags: ['held'], glam: 2, hue: 'rood', lvl: 15 },
  { id: 'bk_engel',         shape: 'angelwings',name: 'Engelenvleugels',     c: ['#ffffff', '#f1c232'], tags: ['bruiloft', 'chic', 'sprookje'], glam: 3, hue: 'wit', lvl: 19 },
]);

/* ---------- Huisdier ---------- */
add('pet', [
  { id: 'pt_puppy',         shape: 'puppy',     name: 'Puppy',               c: ['#c98a5e', '#ffffff'], tags: ['casual', 'sport', 'school'], hue: 'bruin', lvl: 1 },
  { id: 'pt_puppy_wit',     shape: 'puppy',     name: 'Witte Puppy',         c: ['#ffffff', '#f3d9a4'], tags: ['casual', 'chic'], hue: 'wit', lvl: 4 },
  { id: 'pt_poes',          shape: 'kitten',    name: 'Poesje',              c: ['#9a9aa8', '#ffffff'], tags: ['casual', 'chic', 'pyjama'], hue: 'grijs', lvl: 2 },
  { id: 'pt_poes_oranje',   shape: 'kitten',    name: 'Rode Kater',          c: ['#ff8c42', '#ffffff'], tags: ['casual', 'pyjama'], hue: 'oranje', lvl: 6 },
  { id: 'pt_konijn',        shape: 'rabbit',    name: 'Konijntje',           c: ['#ffffff', '#ffb3d9'], tags: ['casual', 'pyjama', 'bloemen'], hue: 'wit', lvl: 3 },
  { id: 'pt_pony',          shape: 'pony',      name: 'Pony',                c: ['#8b5a2b', '#f3d9a4'], tags: ['paard', 'casual'], hue: 'bruin', lvl: 7 },
  { id: 'pt_eenhoorn',      shape: 'unicorn',   name: 'Mini Eenhoorn',       c: ['#ffffff', '#ff8fcf'], tags: ['sprookje', 'feest', 'prinses'], glam: 2, hue: 'wit', lvl: 8 },
  { id: 'pt_pinguin',       shape: 'penguin',   name: 'Pinguïn',             c: ['#23202a', '#ffffff'], tags: ['winter', 'kerst', 'zwemmen'], hue: 'zwart', lvl: 11 },
  { id: 'pt_papegaai',      shape: 'parrot',    name: 'Papegaai',            c: ['#e63946', '#3a86ff'], tags: ['piraat', 'strand'], hue: 'rood', lvl: 16 },
  { id: 'pt_draak',         shape: 'dragon',    name: 'Draakje',             c: ['#5fd7a8', '#ff8c42'], tags: ['sprookje', 'stoer'], glam: 2, hue: 'groen', lvl: 20 },
]);

/* ---------- Make-up ---------- */
add('mk_eyes', [
  { id: 'me_roze',   shape: 'eyeshadow', name: 'Roze Oogschaduw',   c: ['#ff9ad5'], tags: ['feest', 'chic', 'dans'], glam: 1, hue: 'roze',  lvl: 1 },
  { id: 'me_blauw',  shape: 'eyeshadow', name: 'Blauwe Oogschaduw', c: ['#7cc4ff'], tags: ['feest', 'chic', 'strand', 'prinses'], glam: 1, hue: 'blauw', lvl: 4 },
  { id: 'me_paars',  shape: 'eyeshadow', name: 'Paarse Oogschaduw', c: ['#b58cff'], tags: ['feest', 'muziek', 'eng', 'disco'], glam: 2, hue: 'paars', lvl: 6 },
  { id: 'me_goud',   shape: 'eyeshadow', name: 'Gouden Oogschaduw', c: ['#f5d16a'], tags: ['chic', 'feest', 'bruiloft', 'prinses'], glam: 2, hue: 'goud', lvl: 9 },
  { id: 'me_groen',  shape: 'eyeshadow', name: 'Groene Oogschaduw', c: ['#8fe0a8'], tags: ['eng', 'sprookje'], glam: 1, hue: 'groen', lvl: 10 },
  { id: 'me_zilver', shape: 'eyeshadow', name: 'Zilveren Oogschaduw', c: ['#dfe6f0'], tags: ['ruimte', 'chic', 'winter'], glam: 2, hue: 'zilver', lvl: 8 },
  { id: 'me_glitter',shape: 'eyeshadow', name: 'Glitteroogschaduw', c: ['#ffb3ff'], deco: 'glitter', tags: ['feest', 'muziek', 'disco', 'dans'], glam: 3, hue: 'roze', lvl: 6 },
]);
add('mk_lips', [
  { id: 'ml_roze',  shape: 'lips', name: 'Roze Lippen',   c: ['#ff6fa8'], tags: ['feest', 'casual', 'dans'], glam: 1, hue: 'roze',  lvl: 1 },
  { id: 'ml_rood',  shape: 'lips', name: 'Rode Lippen',   c: ['#d62839'], tags: ['chic', 'feest', 'dans'], glam: 2, hue: 'rood',  lvl: 4 },
  { id: 'ml_paars', shape: 'lips', name: 'Paarse Lippen', c: ['#8e4bd1'], tags: ['muziek', 'eng', 'disco'], glam: 2, hue: 'paars', lvl: 7 },
  { id: 'ml_zwart', shape: 'lips', name: 'Zwarte Lippen', c: ['#2b2233'], tags: ['eng', 'stoer'], glam: 1, hue: 'zwart', lvl: 10 },
  { id: 'ml_goud',  shape: 'lips', name: 'Gouden Lippen', c: ['#e0b23a'], tags: ['chic', 'feest', 'prinses'], glam: 3, hue: 'goud',  lvl: 17 },
]);
add('mk_blush', [
  { id: 'mb_roze',   shape: 'blush', name: 'Zachte Blush',  c: ['#ff7aa8'], tags: ['casual', 'feest', 'chic', 'dans'], hue: 'roze',   lvl: 1 },
  { id: 'mb_perzik', shape: 'blush', name: 'Perzikblush',   c: ['#ff9f6e'], tags: ['zomer', 'strand'], hue: 'oranje', lvl: 3 },
]);
add('mk_face', [
  { id: 'mf_sproeten',  shape: 'freckles',  name: 'Sproetjes',        c: ['#b5754a'], tags: ['casual', 'zomer'], hue: 'bruin', lvl: 1 },
  { id: 'mf_sterren',   shape: 'facestars', name: 'Sterretjes',       c: ['#ffd23f'], tags: ['feest', 'muziek', 'ruimte', 'dans', 'disco'], glam: 1, hue: 'geel', lvl: 2 },
  { id: 'mf_snoetje',   shape: 'whiskers',  name: 'Kattensnoetje',    c: ['#23202a'], tags: ['feest', 'eng', 'pyjama'], hue: 'zwart', lvl: 3 },
  { id: 'mf_hartjes',   shape: 'facehearts',name: 'Hartjes',          c: ['#ff5da2'], tags: ['feest', 'bloemen', 'dans'], glam: 1, hue: 'roze', lvl: 5 },
  { id: 'mf_bloem',     shape: 'faceflower',name: 'Bloemetje',        c: ['#ff8fab', '#ffd23f'], tags: ['bloemen', 'zomer', 'sprookje', 'prinses'], glam: 1, hue: 'roze', lvl: 8 },
  { id: 'mf_glitter',   shape: 'faceglitter', name: 'Glitterwangen', c: ['#ffffff'], tags: ['feest', 'chic', 'muziek', 'disco', 'prinses'], glam: 2, hue: 'wit', lvl: 6 },
  { id: 'mf_bliksem',   shape: 'lightning', name: 'Bliksemflits',     c: ['#ffd23f'], tags: ['held', 'muziek', 'dans'], glam: 1, hue: 'geel', lvl: 9 },
  { id: 'mf_baard',     shape: 'beard',     name: 'Piratenbaard',     c: ['#4a2f1d'], tags: ['piraat'], hue: 'bruin', lvl: 16 },
]);

const ITEM_BY_ID = Object.fromEntries(ITEMS.map(i => [i.id, i]));

/* ---------- Settings (decors) — horen bij een opdracht ---------- */
const SETTINGS = [
  { id: 'kamer',      shape: 'bedroom',       name: 'Slaapkamer' },
  { id: 'feestkamer', shape: 'party',         name: 'Feestkamer' },
  { id: 'catwalk',    shape: 'catwalk',       name: 'Catwalk' },
  { id: 'strand',     shape: 'beach',         name: 'Strand' },
  { id: 'zwembad',    shape: 'pool',          name: 'Zwembad' },
  { id: 'sportveld',  shape: 'field',         name: 'Sportveld' },
  { id: 'turnzaal',   shape: 'gym',           name: 'Turnzaal' },
  { id: 'balletzaal', shape: 'balletstudio',  name: 'Balletzaal' },
  { id: 'disco',      shape: 'disco',         name: 'Discotheek' },
  { id: 'manege',     shape: 'stable',        name: 'Manege' },
  { id: 'sneeuw',     shape: 'snow',          name: 'Sneeuwlandschap' },
  { id: 'ijspaleis',  shape: 'icepalace',     name: 'IJspaleis' },
  { id: 'balzaal',    shape: 'ballroom',      name: 'Balzaal' },
  { id: 'kasteeltuin',shape: 'weddinggarden', name: 'Kasteeltuin' },
  { id: 'regen',      shape: 'rainstreet',    name: 'Regenachtige Straat' },
  { id: 'podium',     shape: 'stage',         name: 'Concertpodium' },
  { id: 'park',       shape: 'park',          name: 'Bloemenpark' },
  { id: 'bos',        shape: 'fairyforest',   name: 'Sprookjesbos' },
  { id: 'spookhuis',  shape: 'haunted',       name: 'Spookhuis' },
  { id: 'ruimte',     shape: 'space',         name: 'In de Ruimte' },
  { id: 'kerst',      shape: 'xmas',          name: 'Kerstkamer' },
  { id: 'parijs',     shape: 'paris',         name: 'Parijs' },
  { id: 'regenboog',  shape: 'rainbowland',   name: 'Regenboogland' },
  { id: 'stad',       shape: 'citynight',     name: 'Stad bij Nacht' },
  { id: 'schip',      shape: 'pirateship',    name: 'Piratenschip' },
];
const SETTING_BY_ID = Object.fromEntries(SETTINGS.map(s => [s.id, s]));

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
  { id: 'bg',      name: 'Setting',     emoji: '🏝️', freeOnly: true },
];
const SLOT_NAMES = {
  hair: 'Haar', top: 'Top', bottom: 'Broek of rok', dress: 'Jurk of pakje', shoes: 'Schoenen', hat: 'Hoedje',
  glasses: 'Bril', neck: 'Om de nek', bag: 'Tas', hand: 'In je hand', back: 'Op je rug', pet: 'Huisdier',
  mk_eyes: 'Oogschaduw', mk_lips: 'Lippen', mk_blush: 'Blush', mk_face: 'Gezichtsversiering', bg: 'Setting',
};
const CAT_EMOJI = { hair: '💇', top: '👕', bottom: '👖', dress: '👗', shoes: '👟', hat: '👒', glasses: '🕶️', neck: '📿', bag: '👜', hand: '🎈', back: '🦋', pet: '🐶', mk_eyes: '💄', mk_lips: '💄', mk_blush: '💄', mk_face: '💄' };
// Slots die meetellen als 'kledingstuk' voor thema en kleur
const OUTFIT_SLOTS = ['top', 'bottom', 'dress', 'shoes', 'hat', 'glasses', 'neck', 'bag', 'hand', 'back'];
const ACC_SLOTS = ['hat', 'glasses', 'neck', 'bag', 'hand', 'back', 'pet', 'mk_eyes', 'mk_lips', 'mk_face'];
const ALL_SLOTS = ['hair', 'top', 'bottom', 'dress', 'shoes', 'hat', 'glasses', 'neck', 'bag', 'hand', 'back', 'pet', 'mk_eyes', 'mk_lips', 'mk_blush', 'mk_face'];

/* ---------- Opdrachten (thema's) — elke opdracht heeft zijn eigen setting ---------- */
const THEMES = [
  { id: 'school',     lvl: 1,  emoji: '🏫', name: 'Eerste Schooldag', bg: 'kamer',
    desc: 'Morgen begint school! Kies iets lekker gewoon waar je de hele dag in kunt spelen.',
    wants: ['casual', 'school'], avoid: ['chic', 'eng', 'ruimte', 'bruiloft', 'zwemmen', 'pyjama'], glam: 0.5 },
  { id: 'verjaardag', lvl: 1,  emoji: '🎂', name: 'Verjaardagsfeest', bg: 'feestkamer',
    desc: 'Je bent uitgenodigd op een feestje. Hoe vrolijker en kleurrijker, hoe beter!',
    wants: ['feest', 'casual'], avoid: ['eng', 'regen', 'zwemmen', 'pyjama'], glam: 1.5, multiColor: true },
  { id: 'pyjama',     lvl: 1,  emoji: '🌙', name: 'Pyjamafeest', bg: 'kamer',
    desc: 'Logeerpartijtje! Trek je lekkerste pyjama of onesie aan en neem een knuffel mee.',
    wants: ['pyjama'], avoid: ['chic', 'sport', 'zwemmen', 'regen'], glam: 0 },
  { id: 'ballet',     lvl: 2,  emoji: '🩰', name: 'Balletles', bg: 'balletzaal',
    desc: 'Op je tenen! Een balletpakje, een tutu en balletschoentjes horen erbij.',
    wants: ['dans'], avoid: ['winter', 'regen', 'eng', 'zwemmen'], glam: 1, colors: ['roze', 'wit'] },
  { id: 'strand',     lvl: 2,  emoji: '🏖️', name: 'Dagje Strand', bg: 'strand',
    desc: 'Zon, zee en zand! Trek iets luchtigs aan en vergeet je zonnebril niet.',
    wants: ['strand', 'zomer'], avoid: ['winter', 'warm', 'chic', 'kerst', 'pyjama'], glam: 0.5 },
  { id: 'zwemles',    lvl: 2,  emoji: '🏊', name: 'Zwemles', bg: 'zwembad',
    desc: 'Duik erin! Badpak of zwembroek, badmuts en zwembril. Wie haalt het diploma?',
    wants: ['zwemmen'], avoid: ['winter', 'warm', 'chic', 'school'], glam: 0 },
  { id: 'sport',      lvl: 3,  emoji: '⚽', name: 'Sportdag', bg: 'sportveld',
    desc: 'Rennen, springen, winnen! Alleen sportieve kleding waar je goed in kunt bewegen.',
    wants: ['sport'], avoid: ['chic', 'winter', 'sprookje', 'bruiloft', 'pyjama'], glam: 0 },
  { id: 'voetbal',    lvl: 3,  emoji: '🥅', name: 'Voetbalwedstrijd', bg: 'sportveld',
    desc: 'De finale! Oranje en wit zijn de clubkleuren. Neem je bal mee.',
    wants: ['sport'], avoid: ['chic', 'prinses', 'dans', 'pyjama'], glam: 0, colors: ['oranje', 'wit'] },
  { id: 'winter',     lvl: 4,  emoji: '❄️', name: 'Winterwandeling', bg: 'sneeuw',
    desc: 'Brrr, het sneeuwt! Pak je goed in met warme laagjes, een muts en een sjaal.',
    wants: ['winter', 'warm'], avoid: ['zomer', 'strand', 'zwemmen'], glam: 0.5 },
  { id: 'thee',       lvl: 4,  emoji: '🫖', name: 'Prinsessenthee', bg: 'kasteeltuin',
    desc: 'Theekransje bij de koningin. Een mooie jurk, een kroontje en iets moois om je nek.',
    wants: ['prinses', 'chic'], avoid: ['sport', 'stoer', 'zwemmen', 'pyjama'], glam: 2 },
  { id: 'gala',       lvl: 5,  emoji: '🎩', name: 'Het Grote Gala', bg: 'balzaal',
    desc: 'Rode loper, camera\'s, glitter! De jury wil je allerchicste outfit zien.',
    wants: ['chic', 'feest'], avoid: ['sport', 'casual', 'regen', 'pyjama'], glam: 3 },
  { id: 'turnen',     lvl: 5,  emoji: '🤸', name: 'Turnwedstrijd', bg: 'turnzaal',
    desc: 'Salto\'s en radslagen! Een turnpakje, iets in je haar en misschien een lint.',
    wants: ['sport', 'dans'], avoid: ['chic', 'winter', 'pyjama', 'prinses'], glam: 1 },
  { id: 'regen',      lvl: 6,  emoji: '🌧️', name: 'Regenachtige Dag', bg: 'regen',
    desc: 'Het giet! Blijf droog met een regenjas en laarzen. Geel staat lekker vrolijk.',
    wants: ['regen'], avoid: ['chic', 'strand', 'sprookje', 'zwemmen'], glam: 0, colors: ['geel'] },
  { id: 'disco',      lvl: 6,  emoji: '🪩', name: 'Discodansfeest', bg: 'disco',
    desc: 'De discobal draait! Glitter, felle kleuren en dansschoenen.',
    wants: ['disco', 'dans'], avoid: ['school', 'regen', 'winter', 'pyjama'], glam: 2, multiColor: true },
  { id: 'rock',       lvl: 7,  emoji: '🎸', name: 'Rockconcert', bg: 'podium',
    desc: 'Vanavond sta jij op het podium! Stoer, zwart en met een gitaar erbij.',
    wants: ['stoer', 'muziek'], avoid: ['bloemen', 'sprookje', 'bruiloft', 'prinses'], glam: 2, colors: ['zwart'] },
  { id: 'paard',      lvl: 7,  emoji: '🐴', name: 'Paardrijles', bg: 'manege',
    desc: 'Naar de manege! Rijbroek, laarzen en een cap. En een wortel voor je pony.',
    wants: ['paard'], avoid: ['chic', 'zwemmen', 'disco', 'pyjama'], glam: 0.5 },
  { id: 'picknick',   lvl: 8,  emoji: '🌸', name: 'Bloemenpicknick', bg: 'park',
    desc: 'Picknicken tussen de bloemen. Zachte kleuren en bloemetjes overal!',
    wants: ['bloemen', 'zomer'], avoid: ['stoer', 'eng', 'winter'], glam: 1, colors: ['roze'] },
  { id: 'ijsprinses', lvl: 8,  emoji: '🧊', name: 'IJsprinses', bg: 'ijspaleis',
    desc: 'Het ijspaleis wacht. Blauw, wit en zilver, met een kroon die glinstert als ijs.',
    wants: ['prinses', 'winter'], avoid: ['zomer', 'strand', 'sport'], glam: 3, colors: ['blauw', 'wit', 'zilver'] },
  { id: 'sprookje',   lvl: 9,  emoji: '🦄', name: 'Sprookjesbal', bg: 'bos',
    desc: 'Feeën, prinsessen en eenhoorns komen samen. Kies iets magisch met een kroon of vleugels!',
    wants: ['sprookje', 'prinses'], avoid: ['sport', 'regen', 'eng'], glam: 3 },
  { id: 'hiphop',     lvl: 9,  emoji: '🎧', name: 'Hiphopclass', bg: 'stad',
    desc: 'Cool en stoer! Een hoodie, baggy broek, sneakers en een pet.',
    wants: ['dans', 'stoer', 'casual'], avoid: ['chic', 'prinses', 'sprookje', 'bruiloft'], glam: 1 },
  { id: 'halloween',  lvl: 10, emoji: '🎃', name: 'Griezelfeest', bg: 'spookhuis',
    desc: 'Hoe enger, hoe beter! Heksen, spoken en skeletten zijn welkom.',
    wants: ['eng'], avoid: ['bloemen', 'strand', 'bruiloft', 'prinses'], glam: 1, colors: ['zwart', 'oranje', 'paars'] },
  { id: 'zeemeermin', lvl: 10, emoji: '🧜', name: 'Zeemeerminnenfeest', bg: 'strand',
    desc: 'Onder de zee! Schubben, zeegroen en blauw, en glinsterende sieraden.',
    wants: ['sprookje', 'strand'], avoid: ['winter', 'school', 'sport'], glam: 3, colors: ['groen', 'blauw'] },
  { id: 'ruimte',     lvl: 11, emoji: '🚀', name: 'Ruimtereis', bg: 'ruimte',
    desc: 'Drie, twee, één, lancering! Zilver, sterren en een helm horen erbij.',
    wants: ['ruimte'], avoid: ['bloemen', 'strand', 'kerst'], glam: 2, colors: ['zilver', 'blauw'] },
  { id: 'ski',        lvl: 11, emoji: '⛷️', name: 'Skivakantie', bg: 'sneeuw',
    desc: 'Op de piste! Skijas, skibroek, helm en skibril. Warm én sportief.',
    wants: ['winter', 'sport'], avoid: ['zomer', 'chic', 'zwemmen', 'strand'], glam: 0.5 },
  { id: 'kerst',      lvl: 12, emoji: '🎄', name: 'Kerstdiner', bg: 'kerst',
    desc: 'Gezellig kerst vieren! Rood en groen, iets warms en een beetje feest.',
    wants: ['kerst', 'feest'], avoid: ['strand', 'zomer', 'eng'], glam: 2, colors: ['rood', 'groen'] },
  { id: 'voorstelling', lvl: 12, emoji: '🎭', name: 'Balletvoorstelling', bg: 'podium',
    desc: 'De grote avond! Een chic balletpakje, spitzen en iets moois in je haar.',
    wants: ['dans', 'chic'], avoid: ['sport', 'casual', 'stoer', 'pyjama'], glam: 3 },
  { id: 'parijs',     lvl: 13, emoji: '🗼', name: 'Modeshow Parijs', bg: 'parijs',
    desc: 'Oh là là! De modestad wil stijl zien: chic, netjes en niet te druk.',
    wants: ['chic'], avoid: ['sport', 'eng', 'regen', 'pyjama'], glam: 2.5, colors: ['zwart', 'wit', 'rood'] },
  { id: 'prinsessenbal', lvl: 13, emoji: '👑', name: 'Prinsessenbal', bg: 'balzaal',
    desc: 'Het bal van het jaar. Een baljurk of galapak, kroon, cape en glimmende schoenen.',
    wants: ['prinses', 'chic'], avoid: ['sport', 'casual', 'stoer', 'zwemmen'], glam: 3 },
  { id: 'carnaval',   lvl: 14, emoji: '🌈', name: 'Regenboogcarnaval', bg: 'regenboog',
    desc: 'Alle kleuren tegelijk! Hoe bonter en gekker, hoe hoger de score.',
    wants: ['feest'], avoid: ['chic'], glam: 2, multiColor: true },
  { id: 'cheer',      lvl: 14, emoji: '📣', name: 'Cheerleaderwedstrijd', bg: 'sportveld',
    desc: 'Give me an S! Rood en geel, een rokje, pompons en een grote strik.',
    wants: ['sport', 'dans', 'feest'], avoid: ['chic', 'winter', 'eng'], glam: 1, colors: ['rood', 'geel'] },
  { id: 'held',       lvl: 15, emoji: '🦸', name: 'Superheldendag', bg: 'stad',
    desc: 'De stad heeft je nodig! Cape, masker en een stoer pak.',
    wants: ['held', 'stoer'], avoid: ['chic', 'bloemen', 'bruiloft', 'pyjama'], glam: 1.5 },
  { id: 'streetdance', lvl: 15, emoji: '🕺', name: 'Streetdance Battle', bg: 'stad',
    desc: 'Battle onder de lantaarns. Stoer, sportief en met een koptelefoon of pet.',
    wants: ['dans', 'stoer'], avoid: ['chic', 'prinses', 'bruiloft', 'pyjama'], glam: 1 },
  { id: 'piraat',     lvl: 16, emoji: '🏴‍☠️', name: 'Piratenfeest', bg: 'schip',
    desc: 'Ahoy! Hijs de zeilen met een ooglapje, laarzen en een papegaai.',
    wants: ['piraat', 'stoer'], avoid: ['chic', 'sport', 'kerst', 'prinses'], glam: 1 },
  { id: 'waterpark',  lvl: 16, emoji: '🌊', name: 'Waterpark', bg: 'zwembad',
    desc: 'Glijbanen en golven! Het vrolijkste badpak, een zwemband en een ijsje.',
    wants: ['zwemmen', 'feest'], avoid: ['winter', 'chic', 'school'], glam: 1, multiColor: true },
  { id: 'popster',    lvl: 17, emoji: '🎤', name: 'Popsterconcert', bg: 'podium',
    desc: 'Duizenden fans wachten op jou! Glitter, glamour en een microfoon.',
    wants: ['muziek', 'feest', 'disco'], avoid: ['school', 'regen', 'winter', 'pyjama'], glam: 3 },
  { id: 'kroning',    lvl: 17, emoji: '🏰', name: 'Koninklijke Kroning', bg: 'balzaal',
    desc: 'Vandaag word jij gekroond. Goud, een cape en de mooiste kroon uit de kast.',
    wants: ['prinses', 'chic'], avoid: ['sport', 'casual', 'stoer'], glam: 3, colors: ['goud'] },
  { id: 'bruiloft',   lvl: 18, emoji: '💒', name: 'De Bruiloft', bg: 'kasteeltuin',
    desc: 'Het mooiste feest van het jaar. Wit, elegant en helemaal af.',
    wants: ['bruiloft', 'chic'], avoid: ['sport', 'eng', 'stoer'], glam: 3, colors: ['wit'] },
  { id: 'dansgala',   lvl: 18, emoji: '💃', name: 'Dansgala', bg: 'disco',
    desc: 'Stijldansen in je mooiste outfit. Chic én lekker om in te draaien.',
    wants: ['dans', 'chic'], avoid: ['sport', 'casual', 'pyjama'], glam: 3 },
  { id: 'goud',       lvl: 19, emoji: '🏆', name: 'Gouden Sterrengala', bg: 'catwalk',
    desc: 'Het allerlaatste gala van het seizoen. Alleen goud is goed genoeg!',
    wants: ['chic', 'feest'], avoid: ['sport', 'casual'], glam: 3, colors: ['goud'] },
  { id: 'finale',     lvl: 20, emoji: '🌟', name: 'Sterrenshow Finale', bg: 'catwalk',
    desc: 'De grote finale. Laat alles zien wat je hebt geleerd: thema, kleur en glamour!',
    wants: ['feest', 'chic', 'muziek'], avoid: ['pyjama', 'regen'], glam: 3 },
];
const THEME_BY_ID = Object.fromEntries(THEMES.map(t => [t.id, t]));

/* ---------- Jury ---------- */
const JUDGES = [
  { id: 'fleur', name: 'Madame Fleur', emoji: '🌸', title: 'Kleurenkoningin',
    weights: { kleur: 0.4, glamour: 0.3, thema: 0.2, compleet: 0.1 } },
  { id: 'ties',  name: 'Meester Ties',  emoji: '🎩', title: 'Strenge Stylist',
    weights: { thema: 0.55, compleet: 0.3, kleur: 0.15 } },
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
  },
  ties: {
    thema:       ['Precies wat de opdracht vroeg. Uitstekend!', 'Een aantal stukken passen goed bij het thema.', 'Lees de opdracht nog eens goed: dit past er niet helemaal bij.'],
    compleet:    ['Alles zit erop en eraan. Zo hoort het.', 'Bijna compleet, let op de details.', 'Een outfit is pas klaar met schoenen én iets aan je lijf!'],
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
  },
};

const FACTOR_NAMES = { thema: 'Thema', kleur: 'Kleuren', compleet: 'Compleet', glamour: 'Glamour', accessoires: 'Accessoires' };

/* ---------- Levels ---------- */
const MAX_LEVEL = 20;
function xpForLevel(level) {           // totaal xp nodig om dit level te bereiken
  const n = level - 1;
  return 25 * n + 4 * n * n;
}
const XP_PER_STARS = { 1: 15, 2: 25, 3: 40 };
const XP_FIRST_TIME = 10;

/* ---------- Munten & winkel ---------- */
const COINS_PER_STARS = { 1: 10, 2: 15, 3: 25 };
const COINS_START = 30;
const GIFTS_PER_LEVEL = 2;             // cadeautjes bij een level-up, de rest komt in de winkel
const DUEL_WIN_BONUS = { stars: 1, coins: 5 };
const PUZZLE_REWARDED_PER_DAY = 5;     // zoveel puzzelrondes per dag leveren munten op
const PUZZLE_COIN_PER_ANSWER = 2;
const PUZZLE_BONUS_ALL_RIGHT = 3;
function priceOf(item) { return 10 + item.lvl * 3 + item.glam * 8; }

/* Eigen kleding: begrensde ontwerpdata en dezelfde catalogus voor kast, jury en races. */
const ClothingDesigns = (() => {
  const LIMIT = 60, STICKER_LIMIT = 5;
  const TYPES = [
    { id: 'top', name: 'Top', emoji: '👕', shapes: [
      ['tshirt', 'T-shirt', ['casual', 'school'], 0], ['sweater', 'Trui', ['casual', 'school', 'winter'], 0],
      ['blouse', 'Blouse', ['school', 'chic'], 1], ['hoodie', 'Vest met capuchon', ['casual', 'sport'], 0],
    ] },
    { id: 'bottom', name: 'Broek / rok', emoji: '👖', shapes: [
      ['pants', 'Lange broek', ['casual', 'school'], 0], ['wideleg', 'Wijde pijpen', ['casual', 'chic'], 1],
      ['shorts', 'Korte broek', ['casual', 'zomer', 'strand'], 0], ['skirt', 'Rok', ['casual', 'school'], 1],
      ['pleated', 'Plooirok', ['school', 'chic'], 1], ['tutu', 'Tutu', ['dans', 'feest'], 2],
    ] },
    { id: 'dress', name: 'Jurk', emoji: '👗', shapes: [
      ['aline', 'A-lijnjurk', ['casual', 'feest'], 1], ['ballgown', 'Baljurk', ['chic', 'prinses', 'feest'], 3],
      ['princess', 'Prinsessenjurk', ['prinses', 'sprookje', 'feest'], 2],
    ] },
    { id: 'shoes', name: 'Schoenen & hakjes', emoji: '👠', shapes: [
      ['sneaker', 'Sneakers', ['casual', 'school', 'sport'], 0], ['boot', 'Laarzen', ['casual', 'winter'], 1],
      ['rainboot', 'Regenlaarzen', ['regen'], 0], ['pumps', 'Hakjes', ['chic', 'feest'], 2],
      ['strappy', 'Hakjes met bandje', ['chic', 'feest', 'dans'], 2], ['bowheels', 'Hakjes met strik', ['feest', 'prinses', 'chic'], 2],
    ] },
    // Hoofdjes en oorbellen zijn klein: geen stickers, en de tweede kleur zit altijd in de details.
    { id: 'hat', name: 'Op je hoofd', emoji: '👑', stickers: false, accent: true, shapes: [
      ['hairband', 'Haarband', ['casual', 'school'], 0], ['bigbow', 'Grote strik', ['feest', 'casual'], 1],
      ['tiara', 'Tiara', ['prinses', 'chic', 'feest'], 2], ['royal', 'Kroon', ['prinses', 'sprookje', 'chic'], 3],
      ['beanie', 'Muts', ['winter', 'warm'], 0], ['beret', 'Baret', ['chic', 'casual'], 1],
      ['catears', 'Kattenoortjes', ['feest', 'casual'], 1], ['bunnyears', 'Konijnenoortjes', ['feest', 'casual'], 1],
    ] },
    { id: 'ears', name: 'Oorbellen', emoji: '💎', stickers: false, accent: true, patterns: ['plain', 'glitter', 'rainbow'], shapes: [
      ['studs', 'Knopjes', ['casual', 'school'], 1], ['hoops', 'Ringen', ['casual', 'disco', 'dans'], 1],
      ['hearts', 'Hartjes', ['feest', 'casual'], 1], ['stars', 'Sterretjes', ['feest', 'ruimte'], 1],
      ['flowers', 'Bloemetjes', ['bloemen', 'zomer'], 1], ['pearls', 'Parels', ['chic', 'bruiloft', 'prinses'], 2],
      ['drops', 'Hangers', ['chic', 'feest'], 2],
    ] },
  ];
  const PATTERNS = [
    ['plain', 'Effen', '○'], ['stripes', 'Strepen', '≋'], ['dots', 'Stippen', '●'], ['hearts', 'Hartjes', '♥'],
    ['stars', 'Sterren', '★'], ['checks', 'Ruitjes', '▦'], ['flowers', 'Bloemen', '✿'],
    ['glitter', 'Glitter', '✧'], ['scales', 'Schubben', '◡'], ['rainbow', 'Regenboog', '🌈'],
  ];
  const STICKERS = [
    { id: 'heart', name: 'Hart', emoji: '💖' }, { id: 'star', name: 'Ster', emoji: '⭐' },
    { id: 'flower', name: 'Bloem', emoji: '🌸' }, { id: 'bunny', name: 'Konijn', emoji: '🐰' },
    { id: 'butterfly', name: 'Vlinder', emoji: '🦋' }, { id: 'rainbow', name: 'Regenboog', emoji: '🌈' },
    { id: 'cherry', name: 'Kersen', emoji: '🍒' }, { id: 'bolt', name: 'Bliksem', emoji: '⚡' },
  ];
  const PALETTE = ['#f4bfd3', '#dd5484', '#e34f52', '#f4a34d', '#f5d568', '#8fc4a3', '#6eb6db', '#a68bd5', '#d7bd98', '#ffffff', '#454052', '#263c76'];
  const number = (v, fallback, min, max) => Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback;
  const color = (v, fallback) => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : fallback;
  function hueOf(hex) {
    const rgb = hex.slice(1).match(/../g).map(v => parseInt(v, 16) / 255);
    const [r, g, b] = rgb, max = Math.max(...rgb), min = Math.min(...rgb), delta = max - min, light = (max + min) / 2;
    if (light > .94) return 'wit';
    if (light < .12) return 'zwart';
    if (delta < .08) return light < .25 ? 'zwart' : 'grijs';
    let hue = max === r ? ((g - b) / delta + 6) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
    hue *= 60;
    if (hue < 15 || hue >= 345) return light > .67 ? 'roze' : 'rood';
    if (hue < 45) return light < .73 && delta < .42 ? 'bruin' : 'oranje';
    if (hue < 70) return 'geel';
    if (hue < 170) return 'groen';
    if (hue < 255) return 'blauw';
    return hue < 310 ? 'paars' : 'roze';
  }
  function normalize(raw = {}) {
    const type = TYPES.find(t => t.id === raw.cat) || TYPES[0];
    const shape = type.shapes.find(s => s[0] === raw.shape) || type.shapes[0];
    const pattern = PATTERNS.some(p => p[0] === raw.pattern) && (!type.patterns || type.patterns.includes(raw.pattern)) ? raw.pattern : 'plain';
    const c = [color(raw.c?.[0], '#a68bd5'), color(raw.c?.[1], '#fff1c9')];
    const stickers = (Array.isArray(raw.stickers) && type.stickers !== false ? raw.stickers : []).filter(s => s && STICKERS.some(x => x.id === s.kind)).slice(0, STICKER_LIMIT).map(s => ({
      kind: s.kind, x: number(s.x, 50, 0, 100), y: number(s.y, 50, 0, 100),
      size: number(s.size, 22, 12, 42), rotation: number(s.rotation, 0, -180, 180),
    }));
    const name = typeof raw.name === 'string' ? raw.name.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 32) : '';
    return { name: name || `Mijn ${shape[1].toLowerCase()}`, cat: type.id, shape: shape[0], c, pattern, stickers };
  }
  function item(raw, id, ownerId) {
    const d = normalize(raw), shape = TYPES.find(t => t.id === d.cat).shapes.find(s => s[0] === d.shape);
    const tags = [...shape[2]];
    if (['glitter', 'rainbow', 'hearts'].includes(d.pattern) || d.stickers.length) tags.push('feest');
    if (d.pattern === 'flowers') tags.push('bloemen');
    if (d.pattern === 'stars') tags.push('ruimte');
    return { ...d, id, ownerId, custom: true, lvl: 1, hue: d.pattern === 'rainbow' ? 'multi' : hueOf(d.c[0]),
      tags: [...new Set(tags)], glam: Math.max(shape[3], d.pattern === 'glitter' ? 2 : 0) };
  }
  function register(it) {
    const index = ITEMS.findIndex(i => i.id === it.id);
    if (index < 0) ITEMS.push(it); else ITEMS[index] = it;
    ITEM_BY_ID[it.id] = it;
  }
  function restore(profile) {
    const seen = new Set(), prefix = `custom_${profile.id}_`;
    profile.customDesigns = (Array.isArray(profile.customDesigns) ? profile.customDesigns : []).filter(d => {
      if (!d || typeof d.id !== 'string' || !d.id.startsWith(prefix) || !/^[a-z0-9_-]+$/i.test(d.id) || seen.has(d.id)) return false;
      seen.add(d.id); return true;
    }).slice(0, LIMIT).map(d => item(d, d.id, profile.id));
    profile.customDesigns.forEach(register);
  }
  function outfitWith(outfit, it) {
    const next = { ...outfit, [it.cat]: it.id };
    if (it.cat === 'dress') { delete next.top; delete next.bottom; }
    if (it.cat === 'top' || it.cat === 'bottom') delete next.dress;
    return next;
  }
  return { LIMIT, STICKER_LIMIT, TYPES, PATTERNS, STICKERS, PALETTE, normalize, hueOf, item, register, restore, outfitWith };
})();

const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict'), path = require('node:path');
const root = path.join(__dirname, '..');
const ctx = vm.createContext({ localStorage: { setItem() {} } });
for (const file of ['data', 'clothing-designs', 'color-challenges', 'learning-challenges', 'parkour-rules']) {
  vm.runInContext(fs.readFileSync(path.join(root, `js/${file}.js`), 'utf8'), ctx);
}
let game = fs.readFileSync(path.join(root, 'js/game.js'), 'utf8');
game = game.slice(0, game.indexOf('  /* ---------- start ---------- */')) + 'globalThis.api={migrate,newProfile,evaluate,shopItems,set:p=>P=p};})();';
vm.runInContext(game, ctx);
const { D, catalog, items, tags, C, R } = vm.runInContext('({D:ClothingDesigns,catalog:ITEM_BY_ID,items:ITEMS,tags:TAGS,C:ColorChallenges,R:ParkourRules})', ctx);
const a = ctx.api.newProfile('A', {}, 'hair_lang');
const b = ctx.api.newProfile('B', {}, 'hair_lang');
assert(a.owned.includes('hd_coco') && a.owned.includes('pt_pip'));
assert.equal(items.length, new Set(items.map(i => i.id)).size);
for (const type of D.TYPES) for (const [shape] of type.shapes) {
  const it = D.item({ cat: type.id, shape, c: ['#e34f52', '#ffffff'], pattern: 'stars' }, `custom_${a.id}_${shape}`, a.id);
  assert(it.tags.every(t => tags[t]), `${shape}: unknown tag`);
  assert.equal(it.hue, 'rood');
}
const shirt = D.item({ cat: 'top', name: '<Mijn sterren>', c: ['#e34f52', '#ffffff'], stickers: [{ kind: 'star', x: 20, y: 30, size: 28, rotation: 45 }] }, `custom_${a.id}_shirt`, a.id);
a.customDesigns = [shirt]; a.outfit = { top: shirt.id, bottom: 'bot_jeans', shoes: 'sh_sneakers' };
ctx.api.migrate(a);
assert(a.owned.includes(shirt.id));
assert.equal(catalog[shirt.id].stickers[0].rotation, 45);
const restored = JSON.parse(JSON.stringify(a)); ctx.api.migrate(restored);
assert.equal(restored.outfit.top, shirt.id);
assert.equal(restored.customDesigns[0].name, '<Mijn sterren>');
assert.equal(restored.customDesigns[0].stickers[0].x, 20);
assert.equal(restored.owned.filter(id => id === shirt.id).length, 1);
ctx.api.set(b);
assert(!ctx.api.shopItems().some(i => i.custom), 'Personal designs must never be for sale');
b.outfit.top = shirt.id; b.owned.push(shirt.id); b.customDesigns = [shirt]; ctx.api.migrate(b);
assert(!b.outfit.top && !b.owned.includes(shirt.id) && !b.customDesigns.length, 'Other players must not inherit designs');
const c = ctx.api.newProfile('C', {}, 'hair_lang'); assert(!c.owned.includes(shirt.id));
const before = items.length; ctx.api.migrate(restored); assert.equal(items.length, before, 'Repeated migration duplicated designs');
const invalid = D.normalize({ cat: 'script', name: '\u0000'.repeat(100), c: ['bad', 'url(evil)'], pattern: 'bad', stickers: Array.from({ length: 12 }, () => ({ kind: 'star', x: Infinity, y: -40, size: 999, rotation: 999 })) });
assert.equal(invalid.cat, 'top'); assert.equal(invalid.c[0], '#a68bd5'); assert.equal(invalid.stickers.length, 5);
assert.equal(invalid.stickers[0].x, 50); assert.equal(invalid.stickers[0].y, 0); assert.equal(invalid.stickers[0].size, 42);
assert.equal(invalid.stickers[0].rotation, 180);
const dress = D.item({ cat: 'dress', pattern: 'rainbow' }, 'design_dress', a.id);
const dressed = D.outfitWith(a.outfit, dress); assert(!dressed.top && !dressed.bottom && dressed.shoes);
assert(!D.outfitWith(dressed, shirt).dress);
ctx.api.set(restored);
const mono = { rule: 'mono', colors: ['rood'] };
const neutralBottom = items.find(i => i.cat === 'bottom' && i.hue === 'zwart');
const neutralShoes = items.find(i => i.cat === 'shoes' && i.hue === 'wit');
assert.equal(C.assess({ top: shirt.id, bottom: neutralBottom.id, shoes: neutralShoes.id }, mono, catalog).score, 1);
assert(Number.isFinite(R.outfitScore(a.outfit, 'school', catalog).speed));
console.log('Ontwerpen OK: migratie, opslag, spelerisolatie, catalogus, begrenzing, jurkwissel, kleurjury en racekleding.');

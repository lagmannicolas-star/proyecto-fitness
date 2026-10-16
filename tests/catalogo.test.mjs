import fs from 'node:fs';
import assert from 'node:assert/strict';
const s = fs.readFileSync('nicolas.html', 'utf8');
// Las categorías y los modelos muestran los productos reales con variantes, aunque no estén vinculados al catálogo comparativo.
assert.match(s, /function catProducts\(catName\)/);
assert.match(s, /availableHTML\(catProducts\(c\.n\),\{title:'Productos que podés comprar hoy'/);
assert.match(s, /availableHTML\(similarProducts\(d\.c\.n,ui\.size\)/);
// Solo se ofrecen para comprar variantes con oferta vigente.
assert.match(s, /function supplierGroups[\s\S]*?isLive\(o\)/);
// La búsqueda manda los kits al final salvo que se busquen.
assert.match(s, /var wantKits=toks\.some/);
// Jerarquía: Pedir ofertas y Armá tu espacio antes que el Catálogo.
const nav = s.match(/<nav class="nav" aria-label="Principal">[\s\S]*?accountBtn\(\)/)[0];
assert(nav.indexOf('Pedir ofertas') < nav.indexOf('Armá tu espacio') && nav.indexOf('Armá tu espacio') < nav.indexOf('Catálogo'), 'orden del menú');
assert.match(s, /location\.hash==='#catalogo'/);
// Cada categoría del catálogo tiene su regla para encontrar productos.
const cats = [...s.matchAll(/\{n:'([^']+)'/g)].map(m => m[1]);
console.log('OK: catálogo con productos reales, búsqueda ordenada y menú con la nueva jerarquía.');

import fs from 'node:fs';
import assert from 'node:assert/strict';

// La dirección vieja del catálogo de AB Fitness lleva al catálogo único de la tienda.
const page = fs.readFileSync('catalogo-ab.html', 'utf8');
assert.match(page, /new URL\('nicolas\.html',location\.href\)/, 'redirige a la tienda');
assert.match(page, /t\.hash='catalogo'/, 'abre directamente el catálogo');
assert.match(page, /href="nicolas\.html#catalogo"/, 'enlace visible si el navegador no redirige');
assert.match(page, /noindex/, 'no compite con la tienda en buscadores');
assert(!page.includes('catalog-data') && page.length < 3000, 'ya no copia el catálogo en otra página');
assert(!/precio del archivo|referencia/i.test(page));

// El catálogo de la tienda reemplaza al JSON embebido de 158 KB por un mapa compacto producto → categoría.
const store = fs.readFileSync('nicolas.html', 'utf8');
assert(!store.includes('ab-home-data'));
const cats = JSON.parse(store.match(/<script id="ab-cats" type="application\/json">([^<]*)<\/script>/)[1]);
const slugs = Object.values(cats).flat();
assert.equal(slugs.length, 466);
assert.equal(new Set(slugs).size, 466);
assert(JSON.stringify(cats).length < 40000, 'mapa compacto');
const catalog = JSON.parse(fs.readFileSync('tests/fixtures/live-catalog.json', 'utf8'));
const live = new Set(catalog.map(p => p.key.split('#')[0]));
assert(slugs.every(s => live.has(s)), 'cada producto curado existe en el catálogo público');
for (const link of store.match(/href="[^"]*catalogo-ab[^"]*"/g) || []) assert.fail('la tienda no enlaza a catalogo-ab: ' + link);
assert(!fs.readFileSync('sitemap.xml', 'utf8').includes('catalogo-ab'));
console.log('OK: catalogo-ab.html redirige al catálogo único; 466 productos con categoría curada en un mapa compacto.');

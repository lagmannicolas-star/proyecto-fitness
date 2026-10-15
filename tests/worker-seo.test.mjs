import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

// Páginas para buscadores servidas por el Worker: títulos, canónico, Open Graph, JSON-LD, 404, sitemap y caché.
// Supabase y los archivos del sitio están simulados con los datos reales de tests/fixtures.
const root = new URL('../', import.meta.url);
const read = p => fs.readFileSync(new URL(p, root), 'utf8');
const html = read('nicolas.html'), catalog = JSON.parse(read('tests/fixtures/live-catalog.json')), snap = JSON.parse(read('tests/fixtures/live-snapshot.json')), mapa = JSON.parse(read('assets/productos/mapa.json'));
const worker = (await import(new URL('worker/index.js', root))).default;
const seo = await import(new URL('worker/seo.js', root));
const texto = await import(new URL('worker/texto.js', root));

let calls = [], reviews = null;
globalThis.fetch = async (url, opts = {}) => {
  url = String(url); calls.push(url);
  assert.equal(opts.headers.apikey, 'sb_publishable_test', 'clave pública');
  if (url.endsWith('/rpc/fitness_public_catalog')) return Response.json(catalog);
  if (url.endsWith('/rpc/fitness_snapshot')) return Response.json(snap);
  if (url.endsWith('/rpc/fitness_reviews_public')) return reviews ? Response.json(reviews) : Response.json({ message: 'Could not find the function' }, { status: 404 });
  return new Response('?', { status: 404 });
};
const env = { SUPABASE_URL: 'https://db.example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
  ASSETS: { fetch: async req => { const p = new URL(req.url).pathname; if (p === '/nicolas') return new Response(html, { headers: { 'Content-Type': 'text/html' } }); if (p === '/assets/productos/mapa.json') return new Response(JSON.stringify(mapa)); return new Response('asset ' + p, { status: p.startsWith('/assets/') || p.endsWith('.html') ? 200 : 404 }); } } };
const get = path => worker.fetch(new Request('https://nexofitt.com.ar' + path), env);
const ld = page => [...page.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
const meta = (page, re) => (re.exec(page) || [])[1];

// ---------- Textos: la misma salida que la tienda ----------
const start = html.indexOf('function norm(s){'), pageCtx = {};
vm.createContext(pageCtx);
vm.runInContext(html.slice(start, html.indexOf('\n', start)) + '\n' + (() => { const p = html.indexOf('function plain(s){'); return html.slice(p, html.indexOf('\n', p)); })() + '\n'
  + html.slice(html.indexOf('var NF_ACR='), html.indexOf('\n/* ---------- Fotos propias')) + '\n' + (() => { const p = html.indexOf('function catSlug(name){'); return html.slice(p, html.indexOf('\n', p)); })(), pageCtx);
let compared = 0;
for (const c of catalog) {
  assert.equal(texto.nfText(c.name), pageCtx.nfText(c.name)); compared++;
  for (const pr of c.properties) { assert.equal(texto.nfProp(pr.value), pageCtx.nfProp(pr.value)); assert.equal(texto.nfProp(pr.name), pageCtx.nfProp(pr.name)); }
  assert.equal(texto.nfCategory(c.category, ''), pageCtx.nfCategory(c.category, ''));
}
for (const o of snap.offers) assert.equal(texto.nfDetail(o.detail, o.model), pageCtx.nfDetail(o.detail, o.model));
for (const n of ['Combos y kits', 'Natación', 'Accesorios de yoga y pilates']) assert.equal(texto.catSlug(n), pageCtx.catSlug(n));

// ---------- Producto ----------
const KIT = 'kit-fuerza-tonificacion-colchoneta-tobillera-3k-mancuerna-3k-4dhms';
let r = await get('/producto/' + KIT), page = await r.text();
assert.equal(r.status, 200); assert.match(r.headers.get('content-type'), /text\/html/);
const title = meta(page, /<title>([^<]*)<\/title>/);
assert(title.startsWith('Kit fuerza &amp; tonificación') && title.endsWith('· Combos y kits · Nexo Fit'), title);
assert.equal(meta(page, /<link rel="canonical" href="([^"]*)">/), 'https://nexofitt.com.ar/producto/' + KIT);
assert.equal(meta(page, /<meta property="og:url" content="([^"]*)">/), 'https://nexofitt.com.ar/producto/' + KIT);
assert.match(meta(page, /<meta property="og:image" content="([^"]*)">/), /^https:\/\/nexofitt\.com\.ar\/assets\/productos\/[\w]+\.webp$/, 'foto propia');
const desc = meta(page, /<meta name="description" content="([^"]*)">/); assert(desc.length > 50 && desc.length <= 170, desc);
assert.match(page, /<meta name="nf-routing" content="paths">/);
assert.match(page, /<meta charset="utf-8"><base href="\/">/, 'base para que assets/… funcione en rutas anidadas');
assert.equal((page.match(/<title>/g) || []).length, 1, 'un solo título');
const [g] = ld(page), product = g['@graph'].find(x => x['@type'] === 'Product'), crumbs = g['@graph'].find(x => x['@type'] === 'BreadcrumbList');
assert.equal(product.name, 'Kit fuerza & tonificación: colchoneta tobillera 3 kg mancuerna 3 kg');
assert(['Offer', 'AggregateOffer'].includes(product.offers['@type'])); assert.equal(product.offers.priceCurrency, 'ARS');
assert.equal(product.offers.availability, 'https://schema.org/InStock'); assert(product.image.length > 1 && product.image.every(u => u.startsWith('https://')));
assert.equal(product.brand.name, 'AB Fitness'); assert(!('aggregateRating' in product), 'sin reseñas no hay puntaje');
assert.deepEqual(crumbs.itemListElement.map(i => i.name), ['Inicio', 'Combos y kits', product.name]);
// Contenido legible sin JavaScript dentro de #app
const app = page.slice(page.indexOf('<div id="app">'), page.indexOf('<div id="toast"'));
assert(app.includes('<h1 class="nf-title">Kit fuerza &amp; tonificación') && app.includes('Vendido por <b>AB Fitness</b>') && app.includes('href="/categoria/combos-y-kits"'));
assert(/href="\/producto\/[^"]+"/.test(app), 'enlaces a otros productos');
// Sin stock
const out = catalog.map(c => c.key.split('#')[0]).find(s => catalog.filter(c => c.key.startsWith(s + '#')).every(c => !snap.offers.some(o => o.sourceKey === c.key && o.stock !== 'none' && o.units !== 0)));
page = await (await get('/producto/' + out)).text();
assert.equal(ld(page)[0]['@graph'][0].offers.availability, 'https://schema.org/OutOfStock');

// ---------- 404 ----------
r = await get('/producto/no-existe-este-producto'); page = await r.text();
assert.equal(r.status, 404); assert.match(page, /<meta name="robots" content="noindex,follow">/); assert(page.includes('No encontramos este producto') && page.includes('href="/categoria/'));
assert.equal((await get('/categoria/no-existe')).status, 404);

// ---------- Categoría, portada y Armá tu espacio ----------
r = await get('/categoria/combos-y-kits'); page = await r.text();
assert.equal(r.status, 200); assert.equal(meta(page, /<title>([^<]*)<\/title>/), 'Combos y kits · Equipamiento deportivo · Nexo Fit');
const col = ld(page)[0]['@graph'][0]; assert.equal(col['@type'], 'CollectionPage'); assert.equal(col.mainEntity.numberOfItems, 44);
assert.equal((page.slice(page.indexOf('<div id="app">'), page.indexOf('<div id="toast"')).match(/class="nf-card/g) || []).length, 44);
page = await (await get('/')).text();
const home = ld(page)[0]['@graph']; assert(home.some(x => x['@type'] === 'Organization'));
assert.equal(home.find(x => x['@type'] === 'WebSite').potentialAction.target.urlTemplate, 'https://nexofitt.com.ar/?q={search_term_string}');
assert.equal(meta(page, /<link rel="canonical" href="([^"]*)">/), 'https://nexofitt.com.ar/');
page = await (await get('/nicolas.html?v=1')).text(); assert.equal(meta(page, /<link rel="canonical" href="([^"]*)">/), 'https://nexofitt.com.ar/', 'una sola dirección para la portada');
page = await (await get('/arma/lista')).text(); assert.match(meta(page, /<title>([^<]*)<\/title>/), /^Armá tu espacio/); assert.equal(meta(page, /<link rel="canonical" href="([^"]*)">/), 'https://nexofitt.com.ar/arma');

// ---------- Sitemap ----------
r = await get('/sitemap.xml'); const xml = await r.text();
assert.match(r.headers.get('content-type'), /xml/); assert(xml.startsWith('<?xml'));
const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const slugs = new Set(catalog.map(c => c.key.split('#')[0]));
assert.equal(locs.filter(l => l.includes('/producto/')).length, slugs.size);
assert(locs.includes('https://nexofitt.com.ar/') && locs.includes('https://nexofitt.com.ar/arma') && locs.includes('https://nexofitt.com.ar/categoria/natacion') && locs.includes('https://nexofitt.com.ar/terminos'));
assert(/<url><loc>https:\/\/nexofitt\.com\.ar\/producto\/[^<]+<\/loc><lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(xml), 'lastmod');
assert.equal(new Set(locs).size, locs.length, 'sin repetidos');
assert.match(read('robots.txt'), /Sitemap: https:\/\/nexofitt\.com\.ar\/sitemap\.xml/);

// ---------- Caché: 10 minutos sin volver a pedir los datos ----------
const before = calls.filter(u => u.includes('fitness_public_catalog')).length;
await get('/producto/' + KIT); await get('/sitemap.xml');
assert.equal(calls.filter(u => u.includes('fitness_public_catalog')).length, before, 'usa la copia en memoria');
assert.equal(before, 1, 'se pidió una sola vez');

// ---------- Reseñas aprobadas → puntaje en JSON-LD ----------
seo.resetCache(); reviews = { reviews: [{ slug: KIT, rating: 5 }, { slug: KIT, rating: 4 }], stats: {} };
page = await (await get('/producto/' + KIT)).text();
assert.deepEqual(ld(page)[0]['@graph'][0].aggregateRating, { '@type': 'AggregateRating', ratingValue: 4.5, reviewCount: 2, bestRating: 5, worstRating: 1 });

// ---------- Si Supabase falla, se sirve la página común (nunca un error) ----------
seo.resetCache(); const saved = globalThis.fetch; globalThis.fetch = async () => new Response('caído', { status: 503 });
r = await get('/producto/' + KIT); assert.equal(r.status, 404, 'sin datos: el archivo del sitio responde como siempre'); assert.equal(await r.text(), 'asset /producto/' + KIT);
globalThis.fetch = saved; seo.resetCache();

// ---------- /api y /fotos siguen igual ----------
r = await get('/api/pagos/estado'); assert.deepEqual(await r.json(), { mercadoPago: false });
assert.equal(await (await get('/proveedores.html')).text(), 'asset /proveedores.html');
const wr = read('wrangler.jsonc'); for (const p of ['"/api/*"', '"/fotos/*"', '"/producto/*"', '"/categoria/*"', '"/sitemap.xml"', '"/"']) assert(wr.includes(p), p);
console.log('OK: Worker para buscadores: ' + compared + ' nombres iguales a la tienda, producto/categoría/portada con título, canónico, Open Graph y JSON-LD, 404, sitemap con ' + locs.length + ' direcciones, caché y /api intacto.');

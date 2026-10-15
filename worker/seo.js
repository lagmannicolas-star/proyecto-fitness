// Páginas que Google puede leer: /producto/<slug>, /categoria/<slug>, /arma, la portada y /sitemap.xml.
// Toma nicolas.html de los archivos del sitio, le pone título, descripción, enlace canónico, Open Graph, JSON-LD
// y un bloque con el contenido ya armado dentro de #app. La tienda arranca encima y toma el control.
// Los datos salen de Supabase con la clave pública (catálogo público y estado público) y se guardan 10 minutos.
import { plain, nfText, nfProp, nfDetail, nfCategory, catSlug } from './texto.js';

export const SITE = 'https://nexofitt.com.ar';
const TTL = 10 * 60 * 1000;
let memo = null;
export function resetCache() { memo = null; }

async function rpc(env, fn) {
  const r = await fetch(String(env.SUPABASE_URL).replace(/\/$/, '') + '/rest/v1/rpc/' + fn, {
    method: 'POST', headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' }, body: '{}',
  });
  if (!r.ok) throw new Error(fn + ' ' + r.status);
  return r.json();
}
async function asset(env, origin, paths) {
  for (const p of paths) {
    const r = await env.ASSETS.fetch(new Request(origin + p));
    if (r.ok) return r.text();
  }
  throw new Error('asset ' + paths[0]);
}
export async function siteData(env, origin) {
  if (memo && Date.now() - memo.at < TTL) return memo;
  const [catalog, snap, html, mapa, reviews] = await Promise.all([
    rpc(env, 'fitness_public_catalog'), rpc(env, 'fitness_snapshot'), asset(env, origin, ['/nicolas', '/nicolas.html']),
    asset(env, origin, ['/assets/productos/mapa.json']).then(JSON.parse).catch(() => ({})),
    rpc(env, 'fitness_reviews_public').catch(() => null),
  ]);
  if (!Array.isArray(catalog) || !snap || !Array.isArray(snap.offers) || !/<div id="app"><\/div>/.test(html)) throw new Error('datos inválidos');
  const m = /<script id="ab-cats" type="application\/json">([^<]*)<\/script>/.exec(html);
  const curated = {};
  try { const cats = JSON.parse(m ? m[1] : '{}'); for (const c of Object.keys(cats)) for (const s of cats[c]) curated[s] = c; } catch (e) { /* sin mapa curado */ }
  memo = { at: Date.now(), html, ...buildProducts(catalog, snap, curated, mapa, reviews) };
  return memo;
}

// Misma agrupación que la tienda: variantes del catálogo público + ofertas publicadas.
export function buildProducts(catalog, snap, curated, mapa, reviews) {
  const vendors = {}; for (const v of snap.vendors || []) vendors[v.id] = v;
  const live = o => o && o.status === 'published' && o.stock !== 'none' && vendors[o.vendorId] && vendors[o.vendorId].status === 'active';
  const byId = {}, byKey = {};
  for (const o of snap.offers || []) { byId[o.id] = o; if (o.sourceKey && (!byKey[o.sourceKey] || (live(o) && !live(byKey[o.sourceKey])))) byKey[o.sourceKey] = o; }
  const bySlug = {}, list = [];
  catalog.forEach((c, i) => {
    if (!c || !c.key) return;
    const key = String(c.key), slug = key.split('#')[0], o = (c.offerId && byId[c.offerId]) || byKey[key] || null, isLive = live(o);
    const units = o ? (o.units == null ? null : Number(o.units)) : (c.units == null ? null : Number(c.units));
    let p = bySlug[slug];
    if (!p) { p = bySlug[slug] = { slug, rawName: c.name, name: nfText(c.name), vendorId: c.vendorId, vendorName: c.vendorName, rawCat: c.category, variants: [], order: i }; list.push(p); }
    p.variants.push({ key, props: (c.properties || []).map(x => ({ name: nfProp(x.name), value: nfProp(x.value) })), price: Number(isLive ? o.price : c.price) || 0, offer: o, available: isLive && units !== 0 && (units == null || units >= (o.minQty || 1)), image: c.image || '', updated: o && o.updated });
  });
  const photo = u => (mapa && mapa[u]) ? SITE + '/' + mapa[u] : u;
  const stats = {};
  if (reviews && Array.isArray(reviews.reviews)) for (const r of reviews.reviews) { if (!r || !(r.rating >= 1 && r.rating <= 5)) continue; const s = stats[r.slug] || (stats[r.slug] = { sum: 0, count: 0 }); s.sum += Number(r.rating); s.count++; }
  for (const p of list) {
    const v = vendors[p.vendorId], any = p.variants.find(x => x.offer);
    p.vendor = v ? v.name : (p.vendorName || '');
    p.vendorObj = v || null;
    p.category = curated[p.slug] || nfCategory(p.rawCat, any && any.offer.category);
    const count = {}; for (const x of p.variants) if (x.image) count[x.image] = (count[x.image] || 0) + 1;
    const imgs = Object.keys(count).sort((a, b) => count[b] - count[a]);
    p.photos = imgs.length ? [imgs[0]] : []; for (const x of p.variants) if (x.image && !p.photos.includes(x.image)) p.photos.push(x.image);
    p.photoUrls = p.photos.map(photo);
    p.available = p.variants.some(x => x.available);
    const pool = p.available ? p.variants.filter(x => x.available) : p.variants, prices = pool.map(x => x.price).filter(n => n > 0);
    p.minPrice = prices.length ? Math.min(...prices) : 0; p.maxPrice = prices.length ? Math.max(...prices) : 0; p.offerCount = pool.length;
    p.detail = ''; for (const x of p.variants) if (x.offer && (p.detail = nfDetail(x.offer.detail, p.name))) break;
    const names = []; for (const x of p.variants) for (const pr of x.props) if (!names.includes(pr.name)) names.push(pr.name);
    p.opts = names.map(n => ({ name: n, values: [...new Set(p.variants.flatMap(x => x.props.filter(pr => pr.name === n).map(pr => pr.value)))] }));
    p.updated = p.variants.map(x => x.updated).filter(Boolean).sort().pop() || '';
    const s = stats[p.slug]; p.rating = s ? { avg: Math.round(s.sum / s.count * 10) / 10, count: s.count } : null;
  }
  const cats = {}; for (const p of list) (cats[p.category] = cats[p.category] || []).push(p);
  const catList = Object.keys(cats).map(n => ({ name: n, slug: catSlug(n), products: cats[n] })).sort((a, b) => b.products.length - a.products.length);
  return { list, bySlug, cats: catList };
}

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => '$ ' + Math.round(Number(n)).toLocaleString('es-AR');
const clip = (s, n) => { s = String(s).replace(/\s+/g, ' ').trim(); return s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…'; };
const ldJson = data => JSON.stringify(data).replace(/</g, '\\u003c');

function inject(html, meta) {
  // Las rutas /producto/… y /categoria/… están anidadas: la base hace que "assets/…" y "proveedores.html" sigan apuntando a la raíz.
  let h = html.replace('<meta charset="utf-8">', '<meta charset="utf-8"><base href="/">');
  const rep = (re, val) => { h = re.test(h) ? h.replace(re, val) : h; };
  rep(/<title>[^<]*<\/title>/, '<title>' + esc(meta.title) + '</title>');
  rep(/<meta name="description" content="[^"]*">/, '<meta name="description" content="' + esc(meta.description) + '">');
  rep(/<link rel="canonical" href="[^"]*">/, '<link rel="canonical" href="' + esc(meta.canonical) + '">');
  rep(/<meta property="og:url" content="[^"]*">/, '<meta property="og:url" content="' + esc(meta.canonical) + '">');
  rep(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="' + esc(meta.title) + '">');
  rep(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="' + esc(meta.description) + '">');
  if (meta.image) rep(/<meta property="og:image" content="[^"]*">/, '<meta property="og:image" content="' + esc(meta.image) + '">');
  if (meta.ogType) rep(/<meta property="og:type" content="[^"]*">/, '<meta property="og:type" content="' + esc(meta.ogType) + '">');
  const extra = '<meta name="nf-routing" content="paths">' + '<meta name="twitter:title" content="' + esc(meta.title) + '"><meta name="twitter:description" content="' + esc(meta.description) + '">'
    + (meta.image ? '<meta name="twitter:image" content="' + esc(meta.image) + '">' : '') + (meta.noindex ? '<meta name="robots" content="noindex,follow">' : '')
    + (meta.ld ? '<script type="application/ld+json" id="nf-ld"' + (meta.slug ? ' data-slug="' + esc(meta.slug) + '"' : '') + '>' + ldJson(meta.ld) + '</script>' : '');
  h = h.replace('</head>', extra + '</head>');
  h = h.replace('<div id="app"></div>', '<div id="app">' + meta.body + '</div>');
  return h;
}

const LOGO = '<span class="logo-frame"><img src="/assets/nexofit-logo.png" alt="Nexo Fit" width="1254" height="1254"></span>';
function shell(inner, crumbs) {
  return '<header class="top"><div class="wrap top-in"><a class="brand" href="/" aria-label="Nexo Fit, ir al inicio">' + LOGO + '</a>'
    + '<form class="hsearch" role="search" action="/" method="get"><label class="sr" for="hq-ssr">Buscar productos</label><input id="hq-ssr" name="q" type="search" placeholder="Buscá mancuernas, colchonetas, 10 kg…"></form>'
    + '<div class="top-sub"><nav class="subnav" aria-label="Principal"><a class="navlink" href="/#catalogo">Catálogo</a><a class="navlink" href="/arma">Armá tu espacio</a></nav></div></div></header>'
    + '<main><div class="wrap page nf-ssr">' + (crumbs ? '<nav class="crumbs nf-crumbs" aria-label="Ruta">' + crumbs + '</nav>' : '') + inner + '</div></main>';
}
const cardHTML = p => '<a class="nf-card' + (p.available ? '' : ' is-out') + '" href="/producto/' + encodeURIComponent(p.slug) + '"><span class="nf-img">' + (p.photoUrls[0] ? '<img src="' + esc(p.photoUrls[0]) + '" alt="" loading="lazy" width="600" height="600">' : '') + '</span><span class="nf-body"><span class="nf-vendor">' + esc(p.vendor) + '</span><span class="nf-name">' + esc(p.name) + '</span><span class="nf-price">' + (p.minPrice ? (p.maxPrice > p.minPrice ? '<small>Desde</small> ' : '') + '<b>' + money(p.minPrice) + '</b>' : 'Consultar precio') + '</span></span></a>';

function productPage(data, p) {
  const url = SITE + '/producto/' + encodeURIComponent(p.slug), cat = data.cats.find(c => c.name === p.category), v = p.vendorObj || {};
  const price = p.minPrice ? (p.maxPrice > p.minPrice ? 'Desde ' : '') + money(p.minPrice) : '';
  const description = clip(p.name + '. ' + (p.detail ? p.detail.replace(/…$/, '') + '. ' : '') + (price ? price + (v.pricesIncludeVat ? ' con IVA' : '') + '. ' : '') + 'Vendido por ' + p.vendor + ' en Nexo Fit: distintas empresas, un solo carrito.', 160);
  const offers = p.offerCount > 1 && p.maxPrice > p.minPrice
    ? { '@type': 'AggregateOffer', priceCurrency: 'ARS', lowPrice: p.minPrice, highPrice: p.maxPrice, offerCount: p.offerCount, availability: 'https://schema.org/' + (p.available ? 'InStock' : 'OutOfStock'), url }
    : { '@type': 'Offer', priceCurrency: 'ARS', price: p.minPrice, availability: 'https://schema.org/' + (p.available ? 'InStock' : 'OutOfStock'), url, seller: { '@type': 'Organization', name: p.vendor } };
  const product = { '@type': 'Product', '@id': url + '#producto', name: p.name, image: p.photoUrls.slice(0, 6), description: p.detail || p.name, category: p.category, brand: { '@type': 'Brand', name: p.vendor }, url, offers };
  if (p.rating) product.aggregateRating = { '@type': 'AggregateRating', ratingValue: p.rating.avg, reviewCount: p.rating.count, bestRating: 5, worstRating: 1 };
  const crumbsLd = { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: p.category, item: SITE + '/categoria/' + catSlug(p.category) }, { '@type': 'ListItem', position: 3, name: p.name, item: url }] };
  const related = (cat ? cat.products : []).filter(x => x !== p && x.available).slice(0, 8);
  const body = shell('<div class="nf-pdp-grid"><div class="nf-gallery"><div class="nf-main">' + (p.photoUrls[0] ? '<img src="' + esc(p.photoUrls[0]) + '" alt="' + esc(p.name) + '" width="900" height="900">' : '') + '</div></div>'
    + '<div class="nf-info"><p class="nf-seller">Vendido por <b>' + esc(p.vendor) + '</b></p><h1 class="nf-title">' + esc(p.name) + '</h1>'
    + (p.rating ? '<p class="nf-rate lg">' + p.rating.avg.toString().replace('.', ',') + ' de 5 · ' + p.rating.count + (p.rating.count === 1 ? ' reseña' : ' reseñas') + '</p>' : '')
    + '<div class="nf-pricebox"><span class="nf-bigprice num">' + esc(price || 'Consultar precio') + '</span>' + (v.pricesIncludeVat ? '<span class="muted small">IVA incluido</span>' : '') + '</div>'
    + '<p class="nf-stock ' + (p.available ? 'ok">Disponible' : 'out">Sin stock') + '</p>'
    + p.opts.map(g => '<p><b>' + esc(g.name) + ':</b> ' + esc(g.values.join(', ')) + '</p>').join('')
    + (p.detail ? '<p class="nf-desc-text">' + esc(p.detail) + '</p>' : '') + '</div></div>'
    + (related.length ? '<section class="nf-related"><h2 class="display">Más de ' + esc(p.category) + '</h2><div class="nf-grid">' + related.map(cardHTML).join('') + '</div></section>' : ''),
    '<a class="linkbtn" href="/">Inicio</a><span aria-hidden="true">›</span><a class="linkbtn" href="/categoria/' + esc(catSlug(p.category)) + '">' + esc(p.category) + '</a>');
  return { title: clip(p.name, 60) + ' · ' + p.category + ' · Nexo Fit', description, canonical: url, image: p.photoUrls[0], ogType: 'product', slug: p.slug, ld: { '@context': 'https://schema.org', '@graph': [product, crumbsLd] }, body };
}
function categoryPage(data, c) {
  const url = SITE + '/categoria/' + c.slug, avail = c.products.filter(p => p.available).length;
  const items = c.products.slice().sort((a, b) => (b.available - a.available) || a.order - b.order);
  const body = shell('<h1 class="display h-page">' + esc(c.name) + '</h1><p class="lead">' + avail + ' productos disponibles de ' + esc(c.name.toLowerCase()) + ' para gimnasios, clubes, colegios y casa. Distintas empresas, un solo carrito.</p><div class="nf-grid">' + items.map(cardHTML).join('') + '</div>',
    '<a class="linkbtn" href="/">Inicio</a><span aria-hidden="true">›</span><span>' + esc(c.name) + '</span>');
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'CollectionPage', name: c.name + ' · Nexo Fit', url, mainEntity: { '@type': 'ItemList', numberOfItems: items.length, itemListElement: items.slice(0, 50).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + '/producto/' + encodeURIComponent(p.slug), name: p.name })) } },
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE + '/' }, { '@type': 'ListItem', position: 2, name: c.name, item: url }] }] };
  return { title: c.name + ' · Equipamiento deportivo · Nexo Fit', description: clip(c.name + ': ' + avail + ' productos disponibles. Compará precios de distintas empresas y comprá todo en un solo carrito en Nexo Fit.', 160), canonical: url, image: items[0] && items[0].photoUrls[0], ld, body };
}
function homePage(data) {
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Organization', '@id': SITE + '/#org', name: 'Nexo Fit', url: SITE + '/', logo: SITE + '/assets/nexofit-logo.png', email: 'lagmannicolas@gmail.com' },
    { '@type': 'WebSite', '@id': SITE + '/#web', name: 'Nexo Fit', url: SITE + '/', inLanguage: 'es-AR', publisher: { '@id': SITE + '/#org' }, potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: SITE + '/?q={search_term_string}' }, 'query-input': 'required name=search_term_string' } }] };
  const body = shell('<h1 class="display">Distintas empresas. Un solo carrito.</h1><p class="lead">Equipamiento deportivo y de fitness de proveedores de todo el país para gimnasios, clubes, colegios y casa.</p>'
    + '<p><a class="btn btn-accent" href="/#catalogo">Ver catálogo</a> <a class="btn btn-outline" href="/arma">Armá tu espacio</a></p>'
    + '<h2 class="display">Categorías</h2><ul class="nf-ssr-cats">' + data.cats.map(c => '<li><a href="/categoria/' + c.slug + '">' + esc(c.name) + '</a> (' + c.products.length + ')</li>').join('') + '</ul>');
  return { title: 'Nexo Fit · Equipamiento deportivo de distintas empresas en un solo carrito', description: 'Compará y comprá equipamiento deportivo y de fitness de distintas empresas en un solo carrito. Para gimnasios, clubes, colegios y casa, con envío a todo el país.', canonical: SITE + '/', ld, body };
}
function armaPage() {
  const body = shell('<h1 class="display h-page">Armá tu espacio</h1><p class="lead">Contanos qué equipás (casa, gimnasio, box, estudio de pilates, club, colegio o consultorio) y cuántas personas entrenan: te damos una lista con productos reales, cantidades y precio total.</p>');
  return { title: 'Armá tu espacio · Lista de equipamiento con precios · Nexo Fit', description: 'Armá la lista de equipamiento para tu casa, gimnasio, box, club o colegio en 3 pasos: productos disponibles, cantidades según las personas y precio total.', canonical: SITE + '/arma', body };
}
function notFound(data, kind) {
  const body = shell('<div class="nf-empty"><h1 class="display h-page">' + (kind === 'categoria' ? 'No encontramos esa categoría' : 'No encontramos este producto') + '</h1><p class="muted">Puede que ya no esté publicado. Buscalo en el catálogo o mirá estas categorías:</p><p><a class="btn btn-accent" href="/#catalogo">Ver catálogo</a></p><ul class="nf-ssr-cats">'
    + data.cats.slice(0, 12).map(c => '<li><a href="/categoria/' + c.slug + '">' + esc(c.name) + '</a></li>').join('') + '</ul></div>');
  return { title: 'No encontrado · Nexo Fit', description: 'La página que buscás no existe o ya no está publicada.', canonical: SITE + '/', noindex: true, body };
}

const STATIC_PAGES = [['/gimnasios', 0.8], ['/clubes', 0.8], ['/colegios', 0.8], ['/proveedores', 0.6], ['/terminos', 0.3], ['/privacidad', 0.3], ['/arrepentimiento', 0.3]];
export function sitemap(data) {
  const today = new Date().toISOString().slice(0, 10), u = (loc, pri, mod) => '<url><loc>' + esc(SITE + loc) + '</loc>' + (mod ? '<lastmod>' + mod + '</lastmod>' : '') + '<priority>' + pri + '</priority></url>';
  const lastAll = data.list.map(p => p.updated).filter(Boolean).sort().pop() || today;
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + [u('/', '1.0', lastAll), u('/arma', '0.8', lastAll)]
      .concat(data.cats.map(c => u('/categoria/' + c.slug, '0.8', c.products.map(p => p.updated).filter(Boolean).sort().pop() || lastAll)))
      .concat(data.list.map(p => u('/producto/' + encodeURIComponent(p.slug), p.available ? '0.7' : '0.4', p.updated || lastAll)))
      .concat(STATIC_PAGES.map(([l, pr]) => u(l, pr))).join('\n') + '\n</urlset>\n';
}

const htmlResponse = (html, status) => new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': status === 200 ? 'public, max-age=300' : 'no-store', 'X-Robots-Tag': status === 404 ? 'noindex' : 'all' } });
export async function seoResponse(request, env, url) {
  const data = await siteData(env, url.origin), path = url.pathname;
  if (path === '/sitemap.xml') return new Response(sitemap(data), { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=600' } });
  let m;
  if ((m = /^\/producto\/([^/]+)\/?$/.exec(path))) {
    let slug; try { slug = decodeURIComponent(m[1]); } catch (e) { slug = m[1]; }
    const p = data.bySlug[slug];
    return p ? htmlResponse(inject(data.html, productPage(data, p)), 200) : htmlResponse(inject(data.html, notFound(data, 'producto')), 404);
  }
  if ((m = /^\/categoria\/([^/]+)\/?$/.exec(path))) {
    const c = data.cats.find(x => x.slug === m[1]);
    return c ? htmlResponse(inject(data.html, categoryPage(data, c)), 200) : htmlResponse(inject(data.html, notFound(data, 'categoria')), 404);
  }
  if (path === '/arma' || path.startsWith('/arma/')) return htmlResponse(inject(data.html, armaPage()), 200);
  return htmlResponse(inject(data.html, homePage(data)), 200);
}
export const SEO_PATHS = /^\/(?:|nicolas|nicolas\.html|sitemap\.xml|arma|arma\/.*|producto\/[^/]+\/?|categoria\/[^/]+\/?)$/;

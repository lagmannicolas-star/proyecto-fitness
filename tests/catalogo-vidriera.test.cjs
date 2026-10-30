// Catálogo de proveedores como vidriera para comparar: el mismo producto de varios proveedores en una tarjeta,
// proveedores anónimos (A, B, C…), precios de referencia, "Pedir oferta" y sin compra directa
// mientras Mercado Pago no esté activo.
const fs = require('fs'), vm = require('vm'), assert = require('assert/strict');
const read = f => fs.readFileSync(f, 'utf8');
const has = (src, re, msg) => assert(re.test(src), msg + ' (' + re + ')');
const js = read('assets/catalogo.js'), html = read('catalogo.html'), pag = read('assets/paginas.js'), home = read('index.html');
const sol = read('assets/solicitud.js'), shop = read('nicolas.html');

// Funciones puras del catálogo (sin DOM).
const ctx = { window: {}, document: undefined };
vm.createContext(ctx);
vm.runInContext(js.replace(/typeof document === 'undefined' \? null : document/, 'null'), ctx);
const C0 = ctx.window.NFCatalogo, plainJ = x => JSON.parse(JSON.stringify(x));
// Copias del contexto vm a objetos de este contexto para comparar con deepEqual.
const C = Object.fromEntries(Object.entries(C0).map(([k, f]) => [k, typeof f === 'function' ? (...a) => plainJ(f(...a)) : f]));

const row = (ref, extra) => Object.assign({ vendorRef: ref, vendorName: 'NOMBRE-' + ref, vendorId: 'id_' + ref, offerId: null, units: null, image: null }, extra);
const rpc = [
  // Mismo producto en 3 proveedores, con nombres y medidas escritos distinto.
  row('r1', { vendorType: 'Fabricante', vendorProvince: 'Córdoba', key: 'mancuerna-hex#5', name: 'Mancuerna hexagonal engomada', category: 'Mancuernas', properties: [{ name: 'Peso', value: '5 kg' }], price: 21000, units: 4, image: 'https://cdn.test/m.webp' }),
  row('r1', { vendorType: 'Fabricante', vendorProvince: 'Córdoba', key: 'mancuerna-hex#10', name: 'Mancuerna hexagonal engomada', category: 'Mancuernas', properties: [{ name: 'Peso', value: '10 kg' }], price: 39000, units: 0 }),
  row('r2', { vendorType: 'Importador', key: 'mh-10', name: 'MANCUERNA HEXAGONAL ENGOMADA.', category: 'mancuerna', properties: [{ name: 'Peso', value: '10kg' }], price: 36500 }),
  row('r3', { vendorType: 'Distribuidor', vendorProvince: 'Santa Fe', key: 'x#1', name: 'Mancuerna Hexagonal  Engomada (unidad)', category: 'Mancuernas', properties: [{ name: 'Peso', value: '10 Kilos' }], price: 41000 }),
  row('r3', { key: 'x#2', name: 'Mancuerna Hexagonal Engomada (unidad)', category: 'Mancuernas', properties: [{ name: 'Peso', value: '5 Kg' }], price: 19900 }),
  // Otro producto (un solo proveedor) y uno parecido que NO es el mismo.
  row('r2', { vendorType: 'Importador', key: 'colch-1', name: 'Colchoneta 1 x 0,50', category: 'Colchonetas', properties: [], price: 9800 }),
  row('r1', { key: 'mancuerna-cromada#5', name: 'Mancuerna cromada', category: 'Mancuernas', properties: [{ name: 'Peso', value: '5 kg' }], price: 25000 })
];
const prods = C.agrupar(rpc);
assert.equal(prods.length, 3, 'reúne el mismo producto de varios proveedores y separa los distintos');
const m = prods[0];
assert.equal(m.name, 'Mancuerna hexagonal engomada', 'primero los que tienen más proveedores');
assert.equal(m.n, 3);
assert.deepEqual(m.suppliers.map(s => s.letter), ['A', 'B', 'C'], 'letras estables por producto');
assert.deepEqual(m.suppliers.map(s => s.trust), ['Fabricante · Córdoba', 'Importador', 'Distribuidor · Santa Fe']);
assert.equal(m.variants.length, 2, 'alinea variantes por valor: 10 kg = 10kg = 10 Kilos');
const v10 = m.variants.find(v => v.vk === '10 kg');
assert.equal(v10.n, 3); assert.equal(v10.min, 36500); assert.equal(v10.max, 41000);
assert.equal(m.min, 19900); assert.equal(m.max, 41000);
assert.equal(C.masBarata(prods.find(p => p.n === 3), '10 kg').label, 'Peso: 10 kg', 'la más barata que coincide con la búsqueda');
assert.equal(C.masBarata(m, '').min, 19900);
assert.equal(C.norm('Mancuerna 10Kgs. (Unidad)'), 'mancuerna 10 kg');
assert.equal(prods.find(p => p.name === 'Mancuerna cromada').n, 1, 'agrupación conservadora');
// Nunca viaja el nombre ni la referencia del proveedor a lo que se pinta.
assert.doesNotMatch(JSON.stringify(prods), /NOMBRE-|id_r|"r[123]"/, 'sin nombre, id ni referencia del proveedor');
assert.equal(C.trust({ vendorProvince: 'Salta' }), 'Proveedor de Salta');
assert.equal(C.trust({ vendorName: 'AB Fitness' }), 'Proveedor de la red', 'sin datos de confianza no se inventa nada');
assert.doesNotMatch(js, /vendorName/, 'el catálogo no lee el nombre del proveedor');
assert.doesNotMatch(js, /data-[a-z-]*="'\s*\+\s*esc\((s|pub)\.ref/, 'la referencia no va a atributos');
// Sin vendorRef (catálogo actual) cada publicación cuenta como un proveedor distinto.
assert.equal(C.agrupar(rpc.map(r => Object.assign({}, r, { vendorRef: undefined, vendorId: undefined })))[0].n, 3);
// Orden y filtros.
assert.deepEqual(C.ordenar(prods, 'precio').map(p => p.name), ['Colchoneta 1 x 0,50', 'Mancuerna hexagonal engomada', 'Mancuerna cromada']);
assert.deepEqual(C.ordenar(prods, 'az').map(p => p.name)[0], 'Colchoneta 1 x 0,50');
assert.equal(C.filtrar(prods, '', '', true).length, 1, 'solo con 2 o más proveedores');
assert.deepEqual(C.filtrar(prods, '10 KG', '').map(p => p.name), ['Mancuerna hexagonal engomada']);
assert.equal(C.filtrar(prods, 'colchoneta', 'Mancuernas').length, 0);
assert.deepEqual(C.categorias(prods), [['Colchonetas', 1], ['Mancuernas', 2]]);
// Mi pedido → solicitud: mismas claves que "Armá tu espacio" (producto, cantidad, detalle) y máximo 25 líneas.
const pre = C.prefill(Array.from({ length: 30 }, (_, i) => ({ key: 'k' + i, producto: 'Mancuerna hexagonal', variante: 'Peso: 5 kg', precio: 21000, cantidad: i ? 3 : 0 })));
assert.equal(pre.items.length, 25);
assert.deepEqual(Object.keys(pre.items[0]).sort(), ['cantidad', 'detalle', 'producto']);
assert.equal(pre.items[0].cantidad, '1', 'cantidad mínima 1');
assert.equal(pre.items[1].detalle, 'Peso: 5 kg · Precio de referencia visto: $ 21.000');
assert.equal(C.lineaSolicitud({ producto: 'M', variante: 'Peso: 10 kg', precio: 36500, precioMax: 41000, proveedores: 3, cantidad: 2 }).detalle, 'Peso: 10 kg · Precios de referencia vistos: $ 36.500 a $ 41.000 (3 proveedores)');
has(pre.detalles, /precios del catálogo son de referencia/, 'aclara referencia');
has(js, /sessionStorage\.setItem\('nf-sol-prefill'/, 'mismo mecanismo que Armá tu espacio');
has(js, /solicitud\.html\?desde=catalogo/, 'abre la solicitud');
has(sol, /q\.get\('desde'\) === 'catalogo'/, 'la solicitud reconoce la lista del catálogo');
has(sol, /localStorage\.removeItem\('nf-cat-pedido'\)/, 'al enviar se vacía "Mi pedido"');

// Página: explicación, comparación, acciones y estado vacío.
has(html, /Precios de referencia de proveedores de la red\. Elegí productos, pedí ofertas y compará en privado: costo total puesto en tu localidad, plazo y garantía\./, 'explicación');
for (const t of ['Precio de referencia', "'Pedir oferta'", 'Pedir oferta a todos', 'Agregar a mi pedido', 'Comparación de proveedores', "Proveedor ' + s.letter", 'Precio más bajo', ' proveedores</span>', 'Comparar (', 'Estamos sumando proveedores.</b> Mientras tanto, pedí ofertas o armá tu espacio.'])
  assert(js.includes(t), 'falta: ' + t);
assert.equal(C.MAX_CMP, 4, 'comparar hasta 4 productos');
for (const id of ['cat-orden', 'cat-solo2', 'cat-comparar', 'cmp-body', 'cat-bar-cmp', 'ficha-alt']) assert(html.includes('id="' + id + '"'), 'falta #' + id);
for (const o of ['Más proveedores', 'Menor precio', 'A–Z', 'Con 2 o más proveedores para comparar']) assert(html.includes(o), 'falta ' + o);
has(html, /\.cmp-scroll\{overflow-x:auto/, 'la tabla de comparación se desliza dentro del cuadro, no la página');
assert(!/carrito|checkout|Comprar/i.test(js + html), 'la vidriera no vende');
for (const x of html.matchAll(/(?:src|href)="([^"#?:]+\.(?:html|js|css))/g)) assert(fs.existsSync(x[1]), 'catalogo.html → ' + x[1]);

// Navegación: el catálogo se ve en el menú, el pie y la portada.
has(pag, /var CATALOGO_VISIBLE = true;/, 'catálogo visible');
has(pag, /\(n \? CART : ''\)/, 'el carrito aparece solo si ya tiene productos');
has(home, /<a class="btn btn-outline" href="catalogo">Mirá el catálogo<\/a>/, 'entrada desde la portada');
has(home, /class="choice choice-alt" href="catalogo" data-catalogo/, 'tarjeta Busco un producto');

// Tienda anterior: compra directa y "Registrar pedido pendiente de pago" solo con MP_ACTIVO.
has(shop, /var MP_ACTIVO=false;/, 'flag');
for (const x of shop.matchAll(/>Registrar pedido pendiente de pago<\/button>/g)) assert(shop.slice(x.index - 80, x.index).includes('MP_ACTIVO?'), 'el pedido pendiente queda detrás de MP_ACTIVO');
for (const a of ['pay-ok', 'cpay-ok']) has(shop, new RegExp("case '" + a + "':[^\\n]*?if\\(!MP_ACTIVO\\) break;"), a + ' bloqueado');
for (const a of ['add-cart', 'buy', 'buy-direct', 'cart-pay']) has(shop, new RegExp("case '" + a + "':[\\s\\S]{0,140}?if\\(!MP_ACTIVO\\)"), a + ' pasa a Pedir oferta');
assert(!/esc\(p\.vendorName\)|vendor:p\.vendorName|\+p\.vendorName\+/.test(shop), 'la tienda no muestra nombres de proveedores del catálogo');
has(shop, /o\.trackingUrl\|\|o\.trackUrl/, 'seguimiento: lee trackingUrl (lo que guarda fitness_save)');
const fns = ['buyBtn', 'vendorTrust'].map(n => shop.match(new RegExp('function ' + n + '\\([\\s\\S]*?\\n?\\}(?=\\n)'))[0]).join('\n');
const sx = { esc: String, MP_ACTIVO: false }; vm.createContext(sx); vm.runInContext(fns, sx);
has(sx.buyBtn('o1', 'btn', 'Agregar'), /data-act="ask-offer"[^>]*>Pedir oferta</, 'sin MP: Pedir oferta');
sx.MP_ACTIVO = true; has(sx.buyBtn('o1', 'btn', 'Agregar'), /data-act="add-cart"[^>]*>Agregar</, 'con MP_ACTIVO vuelve la compra');
assert.equal(sx.vendorTrust({ vendorName: 'AB Fitness', vendorType: 'Importador' }), 'Importador');

console.log('OK: catálogo para comparar (mismo producto entre proveedores anónimos, comparar lado a lado, orden y filtros), Pedir oferta y sin compra directa.');

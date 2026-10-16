import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const read = f => fs.readFileSync(f, 'utf8');
const home = read('index.html'), espacio = read('arma-tu-espacio.html'), sol = read('solicitud.html'), seg = read('mi-solicitud.html');
const buyer = read('nicolas.html'), admin = read('admin.html'), sql = read('supabase/migrations/20261016180000_solicitudes_de_oferta.sql');
const solJs = read('assets/solicitud.js'), espJs = read('assets/espacio.js'), segJs = read('assets/mi-solicitud.js');

// La portada nueva conserva los enlaces de pago, el carrito y las vueltas de Mercado Pago.
const redirect = home.match(/<script>([\s\S]*?)<\/script>/)[1];
const go = (search, hash) => { let dest = null; vm.runInNewContext(redirect, { location: { search, hash, replace: t => { dest = t; } } }); return dest; };
assert.equal(go('?x=1', '#pagar-a'), 'nicolas.html?x=1#pagar-a', 'link de pago');
assert.equal(go('', '#carrito'), 'nicolas.html#carrito', 'carrito');
assert.equal(go('?pago=ok', ''), 'nicolas.html?pago=ok', 'vuelta de Mercado Pago');
assert.equal(go('', ''), null, 'la portada se muestra');
assert.equal(go('?utm_source=instagram&utm_medium=bio', ''), null, 'las campañas ven la portada');
for (const href of ['arma-tu-espacio.html?tipo=gimnasio', 'arma-tu-espacio.html?tipo=club', 'arma-tu-espacio.html?tipo=colegio', 'arma-tu-espacio.html?tipo=casa', 'nicolas.html#catalogo', 'solicitud.html', 'mi-solicitud.html'])
  assert(home.includes('href="' + href + '"'), 'portada enlaza ' + href);

// Los archivos enlazados existen.
for (const [name, html] of [['index.html', home], ['arma-tu-espacio.html', espacio], ['solicitud.html', sol], ['mi-solicitud.html', seg]])
  for (const m of html.matchAll(/(?:src|href)="([^"#?:]+\.(?:html|js|css))/g)) assert(fs.existsSync(m[1]), name + ' → ' + m[1]);

// Armá tu espacio arma la lista y la pasa a la solicitud sin datos personales.
for (const t of ['gimnasio', 'club', 'colegio', 'casa']) assert.match(espJs, new RegExp('\\b' + t + ': \\{'), 'tipo ' + t);
assert.match(espJs, /sessionStorage\.setItem\('nf-sol-prefill'/);
assert.match(espJs, /solicitud\.html\?desde=espacio/);
assert.match(solJs, /sessionStorage\.getItem\('nf-sol-prefill'\)/, 'la solicitud lee la lista');
assert.match(solJs, /var MAX = 25;/);
assert.match(sql, /not between 1 and 25/, 'el servidor acepta las mismas 25 líneas');

// El seguimiento no pone el email en la dirección.
assert.doesNotMatch(solJs, /mi-solicitud\.html\?[^']*email/);
assert.match(segJs, /fitness_solicitud_consulta/);
assert.match(sql, /x\.email=lower\(btrim\(coalesce\(p_email,''\)\)\)/, 'el seguimiento exige el mismo email');

// Puentes desde la tienda.
assert.match(buyer, /carrito:function\(\)\{ return vCart\(\)\+cartToOffersCard\(\); \}/);
assert.match(buyer, /data-nf="cart-offers"/);
assert.match(buyer, /solicitud\.html\?producto='\+encodeURIComponent/);

// Panel del administrador: solo con rol admin, y el texto para proveedores no lleva datos del comprador.
assert.match(admin, /\{id:'solicitudes',label:'Solicitudes'/);
const brief = admin.match(/function requestBrief\(r\)\{([\s\S]*?)\n\}/)[1];
assert.doesNotMatch(brief, /r\.(nombre|email|telefono|empresa|presupuesto)/, 'el pedido para proveedores no expone al comprador');
for (const fn of ['fitness_solicitudes_admin', 'fitness_solicitud_actualizar']) assert.match(sql, new RegExp('function public\\.' + fn + '[\\s\\S]*?role=\'admin\''), fn + ' exige admin');
assert.match(sql, /revoke all on table public\.fitness_solicitudes from public,anon,authenticated/);

console.log('OK: portada, Armá tu espacio, solicitud, seguimiento, puentes y panel de solicitudes.');

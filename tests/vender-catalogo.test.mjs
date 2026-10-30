import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
// Proveedores con catálogo: alta honesta (vidriera, sin cobro online), cuenta en revisión, errores en el formulario y carga por planilla.
const page = fs.readFileSync('proveedores.html', 'utf8');
// Toma una función del archivo: las funciones de primer nivel empiezan en la columna 0 y terminan antes de la siguiente línea de primer nivel.
function fn(name) {
  const i = page.indexOf('\nfunction ' + name + '(');
  assert(i >= 0, 'falta ' + name);
  const rest = page.slice(i + 1), m = rest.slice(1).search(/\n(?=[^\s}])/);
  return rest.slice(0, m + 1);
}
const ctx = vm.createContext({});
vm.runInContext(['cuitOk', 'parseMoney', 'unitWord', 'norm', 'plain', 'vkey', 'keyOf', 'amount', 'safeUrl', 'sheetUnit', 'parseSheet', 'variantOptions', 'esc'].map(fn).join('\n')
  + '\nvar parseNum=parseMoney; function priceCheck(){return null;} function parseTiendaCatalog(){return {kind:"tiendanube"};} var CATALOG=[]; var V={id:"v1"}; function me(){return V;}'
  + '\nvar db={offers:[{id:"o1",vendorId:"v1",category:"Mancuernas",model:"Hexagonal engomada",size:"10 kg",unit:"Unidad",price:15000,units:5}]}; function offer(id){return db.offers.filter(function(o){return o.id===id;})[0];}', ctx);

// CUIT con dígito verificador.
assert.equal(ctx.cuitOk('20-12345678-6'), true);
assert.equal(ctx.cuitOk('30-71234567-1'), true);
assert.equal(ctx.cuitOk('20-12345678-8'), false);
assert.equal(ctx.cuitOk('2012345678'), false);
// Precios con centavos: "15000,50" no puede convertirse en 1500050.
assert.equal(ctx.parseMoney('15000,50'), 15000.5);
assert.equal(ctx.parseMoney('15.000,50'), 15000.5);
assert.equal(ctx.parseMoney('15.000'), 15000);
assert.match(fn('vProduct'), /moneyIn\(e\.price\)/, 'el precio se muestra con centavos');
assert.match(page, /var np=parseMoney\(val\('p-price'\)\)/, 'Precio y stock usa parseMoney');
assert.match(page, /t\.id==='p-price'\)\{ n=parseMoney\(t\.value\)/);
assert.doesNotMatch(page, /digits\(val\('p-price'\)\)|digits\(val\('new-price'\)\)/);
// Gramática de la compra mínima.
assert.equal(ctx.unitWord(1, 'Unidad'), '1 unidad');
assert.equal(ctx.unitWord(2, 'Par'), '2 pares');
assert.doesNotMatch(fn('vProduct'), /ro\('Compra'/, 'la compra mínima no figura como dato que carga el equipo');

// Planilla: filas sin código = productos nuevos; con código = actualización; duplicados y errores por fila.
const csv = 'Código;Categoría;Modelo;Variante;Se vende por;Precio;Unidades;Marca;Detalle;Garantía (meses);Entrega (días hábiles);Compra mínima;Fuente del precio\n'
  + ';Bicicletas fijas;Spinning Pro;Única;Unidad;850.000,50;;;;12;10;1;\n'
  + ';Mancuernas;Hexagonal engomada;10 kg;Unidad;16000;;;;;;;\n'
  + ';Discos;Bumper;20 kg;Par;abc;;;;;;;\n'
  + ';Discos;Bumper;10 kg;Par;9000;;;;3;;;\n'
  + 'o1;Mancuernas;Hexagonal engomada;10 kg;Unidad;15500;7;;;;;;';
const r = ctx.parseSheet(csv);
assert.equal(r.news.length, 1);
assert.deepEqual([r.news[0].category, r.news[0].price, r.news[0].warranty, r.news[0].lead, r.news[0].units], ['Bicicletas fijas', 850000.5, 12, 10, null]);
assert.equal(r.rows.length, 1); assert.equal(r.rows[0].np, 15500); assert.equal(r.rows[0].nu, 7);
assert.equal(r.errors.length, 3);
assert.match(r.errors.join(' '), /ya lo tenés cargado \(código o1\)/);
assert.match(r.errors.join(' '), /mínima legal es 6/);
// La plantilla descargable trae las columnas de la primera carga.
assert.match(page, /var SHEET_HEAD=\['Código','Categoría','Modelo','Variante','Se vende por','Precio','Unidades','Marca','Detalle','Garantía \(meses\)'/);
assert.match(page, /'plantilla-productos-nexofit'/);

// Buscador del producto nuevo.
ctx.list = [{ category: 'Mancuernas', model: 'Hexagonal', size: '10 kg' }, { category: 'Discos', model: 'Bumper', size: '10 kg' }, { category: 'Mancuernas', model: 'Vinílica', size: '2 kg' }];
assert.equal(vm.runInContext('variantOptions(list,"mancuerna 10").n', ctx), 1);
assert.equal(vm.runInContext('variantOptions(list,"Vinilica").n', ctx), 1, 'sin importar tildes');
assert.equal(vm.runInContext('variantOptions(list,"zzz").n', ctx), 0);

// Producto nuevo: garantía legal, envío fijo solo si corresponde, fuente opcional y producto fuera de la lista.
const nf = fn('newOfferForm'), rn = fn('readNewOffer');
assert.match(nf, /num\('warranty','Garantía \(meses\)','6'/);
assert.match(rn, /warranty<6\) errs\.push/);
assert.match(nf, /\(fijo\?num\('amba'/, 'envíos por zona solo con precio fijo');
assert.match(nf, /Fuente oficial del precio <span class="hint">\(opcional\)/);
assert.doesNotMatch(nf, /vigente\.del/);
assert.match(nf, /Mi producto no está en la lista/);
assert.match(rn, /shipAmba:amount\(amba\),shipInt:amount\(interior\)/, 'fitness_validate_offer exige envíos numéricos');

// Alta: términos obligatorios, condiciones visibles, razón social aparte, tipos como en la red, email de confirmación como éxito.
const ap = fn('applyHTML');
assert.match(ap, /id="a-terms" type="checkbox"/);
assert.match(ap, /href="terminos\.html" target="_blank" rel="noopener">Términos y Condiciones/);
assert.match(ap, /id="a-razon"/);
assert.match(ap, /sellConditions\(p\)/);
assert.match(fn('sellConditions'), /Comisión del '\+p\+'% solo sobre los productos y solo cuando se concreta una venta/);
assert.match(fn('sellConditions'), /Facturás vos al comprador/);
assert.match(fn('sellConditions'), /mínimo 6 meses/);
assert.match(page, /var VTYPES=\['Distribuidor','Fabricante','Importador','Comercio'\]/);
assert.match(ap, /class="alert ok" role="status">Te mandamos un email/);
assert.match(ap, /Spam/);
assert.match(page, /ae\.push\(\['a-cuit','Ese CUIT no es válido/);
assert.match(page, /ae\.push\(\['a-terms'/);
assert.doesNotMatch(page, /ui\.formError='Te mandamos un email/);
assert.doesNotMatch(page, /cuando te aprueben/);
assert.match(fn('vLogin'), /<label for="l-user">Email<\/label>/);
// Sin código muerto del alta de demostración.
assert.doesNotMatch(page, /pwHash|ui\.applied/);

// Vidriera: sin promesas de compra directa ni de cobro mientras Mercado Pago no está activo.
const land = fn('vLanding');
assert.doesNotMatch(land, /te compren directo|pago por Mercado Pago\./);
assert.match(land, /Pago online con Mercado Pago: próximamente/);
assert.match(land, /Además recibís los pedidos de tu rubro/);
assert.doesNotMatch(page, /le llega un email al comprador/);
assert.doesNotMatch(page, /Completar y publicar/);
assert.match(page, /else if\(!v\.mp&&mpReady\) warn=/, 'el aviso de conectar Mercado Pago depende de que esté activo');
assert.match(page, /if\(!mpReady&&!v\.mp\) list=list\.filter/);
assert.match(page, /ref\|\|!mpReady\?'':/, 'devolución oculta sin Mercado Pago');
assert.doesNotMatch(fn('mpPreview'), /data-act="mp-test"/);

// Cuenta en revisión: el panel funciona y lo dice.
assert.match(fn('statusBanner'), /Tu cuenta está en revisión\.<\/b>Ya podés cargar tus datos, productos y fotos\. Cuando la aprobemos, tus productos se publican/);
assert.match(fn('vPanel'), /onboardCard\(v,mine\)/);
assert.match(fn('vPanel'), /!sales\.length\?/, 'sin ventas no se muestran cifras de dinero');
assert.match(fn('onboardSteps'), /Datos de tu empresa[\s\S]*primer producto[\s\S]*Fotos/);

// Re-importación de Tiendanube: cuenta lo que se actualiza y lo que se agrega.
assert.match(fn('importPreview'), /actualizan '\+upd\+' variantes que ya tenías/);
assert.doesNotMatch(fn('importPreview'), /sin publicarse ni reemplazar tus ofertas actuales/);

// Celular: tablas como tarjetas y filtros plegados.
assert.match(page, /@media \(max-width:640px\)\{[\s\S]*\.rt thead\{display:none\}/);
assert.match(fn('productsView'), /<table class="rt"/);
assert.match(fn('ordersView'), /<table class="rt"/);
assert.match(fn('productsView'), /data-act="ptab"/);
console.log('OK: vender con catálogo (vidriera, cuenta en revisión, alta y planilla).');

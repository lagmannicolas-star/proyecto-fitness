import fs from 'node:fs';
import assert from 'node:assert/strict';

const buyer=fs.readFileSync('nicolas.html','utf8');
const supplier=fs.readFileSync('proveedores.html','utf8');
const admin=fs.readFileSync('admin.html','utf8');

assert.match(buyer,/function offerSourceReady\(o\)/,'hay una regla de fuente');
assert.match(buyer,/safeUrl\(o\.sourceUrl\)\?'<a class="linkbtn small"/,'solo muestra enlaces seguros');
assert.match(buyer,/&&offerSourceReady\(o\)/,'la fuente forma parte de la disponibilidad');
assert.match(buyer,/Ver fuente oficial/,'el comprador puede abrir la evidencia');
assert.match(buyer,/function offerSourceReady\(o\)\{ return true; \}/,'la fuente es opcional: un producto aprobado no se oculta por no tenerla (decisión del 2/11/2026)');
assert.doesNotMatch(buyer,/Fuente pendiente de completar/,'sin fuente no se muestra aviso al comprador');

assert.match(supplier,/id="new-source"/,'alta exige fuente');
assert.match(supplier,/id="p-source"/,'edición permite mantenerla');
assert.match(supplier,/sourceUrl:source/,'la fuente se guarda en ofertas nuevas');
assert.match(supplier,/cur\.sourceUrl=source/,'la fuente se actualiza');
assert.match(supplier,/Ingresá el enlace https:\/\/ de la fuente oficial/,'rechaza enlaces inválidos');

assert.match(admin,/fld\('o-source','Fuente oficial del precio'/,'el administrador puede revisarla y editarla');
assert.match(admin,/sourceUrl:val\('o-source'\)\.trim\(\)/,'el administrador la guarda');
assert.match(admin,/od\.sourceUrl&&!safeUrl\(od\.sourceUrl\)/,'el administrador valida https solo si carga una fuente');
assert.match(admin,/>Fuente<\/th>/,'la auditoría la muestra en tablas');
assert.match(admin,/>Sin fuente<\/span>/,'las ofertas sin fuente quedan identificadas');

const safe=u=>/^https:\/\/[^\s"'<>]+$/i.test(String(u||'').trim());
assert.equal(safe('https://proveedor.com/producto'),true);
assert.equal(safe('http://proveedor.com/producto'),false);
assert.equal(safe('javascript:alert(1)'),false);
assert.equal(safe(''),false);
console.log('OK: la fuente del precio es opcional en el catálogo y se valida cuando se carga.');

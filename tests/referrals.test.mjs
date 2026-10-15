import fs from 'node:fs';
import assert from 'node:assert/strict';

const buyer=fs.readFileSync('nicolas.html','utf8');
const admin=fs.readFileSync('admin.html','utf8');
const worker=fs.readFileSync('worker/index.js','utf8');

assert.match(buyer,/function normalizeReferral\(v\)/,'normaliza el código');
assert.match(buyer,/replace\(\/\[\^A-Z0-9_-\]\/g,''\)\.slice\(0,24\)/,'limita caracteres y longitud');
assert.match(buyer,/URLSearchParams\(location\.search\).*p\.get\('ref'\)\|\|p\.get\('codigo'\)/s,'acepta ?ref=NICO y ?codigo=NICO');
assert.match(buyer,/id="b-referral"/,'muestra el campo en checkout');
assert.equal((buyer.match(/ui\.ship\.referralCode=normalizeReferral\(val\('b-referral'\)\)/g)||[]).length,2,'guarda el código en checkout simple y carrito');
assert.match(buyer,/Object\.assign\(\{\},ui\.ship,\{name:ui\.buyer,cp:ui\.cp/,'envía el código dentro de ship al reservar');

assert.match(admin,/<th>Código<\/th>/,'muestra el origen en ventas');
assert.match(admin,/Código NICO:.*Comisión atribuida/s,'resume ventas y comisión de NICO');
assert.match(admin,/Código referido/,'incluye el origen al exportar');
assert.match(admin,/orderReferral\(o\).*o\.ship.*referralCode/s,'lee el código guardado en el pedido');

assert.match(worker,/marketplace_fee/,'la comisión sigue cobrándose desde el servidor');
console.log('OK: referido NICO registrado y visible sin alterar el cálculo de comisión.');

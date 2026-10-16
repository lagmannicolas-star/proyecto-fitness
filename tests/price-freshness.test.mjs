import fs from 'node:fs';
import assert from 'node:assert/strict';

const buyer=fs.readFileSync('nicolas.html','utf8');
const supplier=fs.readFileSync('proveedores.html','utf8');
const admin=fs.readFileSync('admin.html','utf8');

assert.match(buyer,/function priceIsFresh\(o\)/,'existe la regla de vigencia');
assert.match(buyer,/age>=0&&age<=30/,'la vigencia máxima es 30 días');
assert.match(buyer,/function isLive\(o\)[\s\S]*&&priceIsFresh\(o\)/,'una oferta vencida no queda comprable');
assert.match(buyer,/var o=offer\(i\.id\), live=o&&isLive\(o\)/,'el carrito vuelve a validar vigencia');

assert.match(supplier,/data-act="price-confirm"/,'el proveedor puede reconfirmar');
assert.match(supplier,/case 'price-confirm':[\s\S]*x\.updated=today\(\)/,'la confirmación renueva la fecha');
assert.match(supplier,/Precio confirmado por 30 días/,'se informa la nueva vigencia');
assert.match(supplier,/published'&&!priceIsStale\(o\).*Link de pago/s,'no hay link de pago para una oferta vencida');
assert.match(supplier,/if\(chP\)\{ o\.price=np; o\.updated=today\(\); \}/,'cambiar precio también renueva vigencia');

assert.match(admin,/function priceIsStale\(o,now\)[\s\S]*!o\|\|!/,'una oferta sin fecha se considera vencida');
assert.match(admin,/Sin confirmar/,'el administrador identifica fechas faltantes');
assert.match(admin,/Precios sin actualizar hace más de 30 días/,'se conserva la alerta operativa');

const isFresh=(updated,today='2026-10-16')=>{
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(updated||''))) return false;
  const age=Math.round((new Date(today+'T12:00:00')-new Date(updated+'T12:00:00'))/864e5);
  return age>=0&&age<=30;
};
assert.equal(isFresh('2026-10-16'),true);
assert.equal(isFresh('2026-09-16'),true);
assert.equal(isFresh('2026-09-15'),false);
assert.equal(isFresh('', '2026-10-16'),true);
assert.equal(isFresh('', '2026-11-16'),false);
assert.equal(isFresh('2026-10-17'),false);

console.log('OK: precios vencidos quedan fuera de compra hasta su reconfirmación.');

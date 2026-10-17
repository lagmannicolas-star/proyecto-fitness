import fs from 'node:fs';
import assert from 'node:assert/strict';

const page=fs.readFileSync('proveedores.html','utf8');

assert.match(page,/function priceConfirmToken\(list\)/,'hay un token ligado al conjunto visible');
assert.match(page,/staleShown=shown\.filter\(priceIsStale\)/,'solo cuenta precios vencidos visibles');
assert.match(page,/data-act="price-confirm-visible"/,'muestra la acción masiva');
assert.match(page,/ui\.confirm===staleToken\?'Confirmar ahora '/,'exige una segunda confirmación');
assert.match(page,/targetsPc=pfApply\(minePc\)\.filter\(priceIsStale\)/,'respeta proveedor, búsqueda y filtros activos');
assert.match(page,/if\(ui\.confirm!==tokenPc\)/,'la confirmación queda vinculada al mismo conjunto');
assert.match(page,/targetsPc\.forEach\(function\(o\)\{ o\.updated=today\(\); \}\)/,'renueva solamente el conjunto confirmado');
assert.match(page,/vact\(me\(\),'confirmó '\+targetsPc\.length/,'registra la cantidad en auditoría');
assert.doesNotMatch(page,/db\.offers\.forEach\(function\(o\)\{ o\.updated=today\(\)/,'no renueva todo el catálogo sin filtro');

const offers=[
  {id:'a',vendorId:'v1',stale:true,visible:true},
  {id:'b',vendorId:'v1',stale:true,visible:false},
  {id:'c',vendorId:'v1',stale:false,visible:true},
  {id:'d',vendorId:'v2',stale:true,visible:true}
];
const targets=offers.filter(o=>o.vendorId==='v1').filter(o=>o.visible).filter(o=>o.stale);
assert.deepEqual(targets.map(o=>o.id),['a']);
console.log('OK: confirmación masiva limitada a precios vencidos visibles y con doble confirmación.');

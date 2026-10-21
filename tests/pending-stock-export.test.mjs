import assert from 'node:assert/strict';
import fs from 'node:fs';

const admin=fs.readFileSync(new URL('../admin.html',import.meta.url),'utf8');
const supplier=fs.readFileSync(new URL('../proveedores.html',import.meta.url),'utf8');

assert.match(supplier,/sku:get\(row,'SKU'\)\.slice\(0,80\)/,'la importación debe conservar el SKU informado');
assert.match(admin,/kind\.indexOf\('stock-pendiente:'\)===0/,'debe existir la exportación de stock pendiente');
assert.match(admin,/!d\.hidden&&d\.price>0&&d\.units===null/,'la exportación debe limitarse a variantes visibles, con precio y sin stock');
assert.match(admin,/\['Proveedor','Producto','Variante','SKU','Precio informado \$','Fuente oficial','Stock confirmado','Observación'\]/,'la planilla debe explicar sus columnas');
assert.match(admin,/d\.price,tiendanubeSource\(pv,d\),'',''/,'stock y observación deben salir vacíos, sin datos inventados');
assert.match(admin,/Descargar '\+pending\.length\+' pendientes de stock/,'el administrador debe mostrar la descarga con la cantidad pendiente');
assert.match(admin,/data-act="xcopy" data-kind="stock-pendiente:/,'el administrador debe permitir copiar los pendientes');

const drafts=[
 {name:'Colchoneta',hidden:false,price:100,units:null},
 {name:'Disco sin precio',hidden:false,price:0,units:null},
 {name:'Producto oculto',hidden:true,price:100,units:null},
 {name:'Con stock cero',hidden:false,price:100,units:0},
 {name:'Con stock',hidden:false,price:100,units:4}
];
const pending=drafts.filter(d=>!d.hidden&&d.price>0&&d.units===null);
assert.deepEqual(pending.map(d=>d.name),['Colchoneta'],'stock cero es un dato confirmado y no debe mezclarse con stock faltante');

console.log('pending-stock-export: ok');

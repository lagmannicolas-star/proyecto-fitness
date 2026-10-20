import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const admin=fs.readFileSync('admin.html','utf8');
const bulk=admin.match(/function bulkPlan\(v,c\)\{[\s\S]*?\n\}\nfunction bulkApply/)[0].replace(/\nfunction bulkApply$/,'');

assert.match(admin,/missingStock:0/,'la auditoría separa stock faltante');
assert.match(admin,/if\(d\.units===null\)/,'una importación sin stock se bloquea');
assert.match(admin,/quedan fuera porque el archivo no confirma stock/,'la revisión explica el bloqueo');
assert.match(admin,/deben confirmarse una por una/,'el administrador recibe una acción concreta');

const offers=[];
const ctx={
  db:{offers},
  tiendanubeSource:()=> 'https://proveedor.example/productos/fuente/',
  safeUrl:u=>u||'',
  draftCategory:()=> 'Fitness',
  today:()=> '2026-10-20'
};
vm.createContext(ctx);
vm.runInContext(bulk,ctx);

const cond={unit:'Unidad',minQty:1,lead:3,warranty:6,shipAmba:0,shipInt:0};
const vendor={id:'v1',name:'Proveedor',catalogDrafts:[
  {key:'sin-stock',name:'Sin stock informado',price:100,units:null,hidden:false,properties:[]},
  {key:'agotado',name:'Agotado',price:200,units:0,hidden:false,properties:[]},
  {key:'disponible',name:'Disponible',price:300,units:5,hidden:false,properties:[]}
]};
let plan=ctx.bulkPlan(vendor,cond);
assert.equal(plan.n.missingStock,1);
assert.equal(plan.n.create,2);
assert.equal(plan.ops.filter(x=>x.kind==='create').map(x=>x.f.stock).join(','),'none,stock');
assert.equal(plan.ops.some(x=>x.f.model==='Sin stock informado'),false);

offers.push({id:'old',vendorId:'v1',sourceKey:'sin-stock',sourceUrl:'https://proveedor.example/productos/fuente/',status:'published'});
plan=ctx.bulkPlan(vendor,cond);
assert.equal(plan.n.missingStock,1);
assert.equal(plan.ops.some(x=>x.kind==='pause'&&x.o.id==='old'),true);
console.log('OK: un CSV sin stock no se convierte en En stock ni se publica masivamente.');

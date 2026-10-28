import fs from 'node:fs';import assert from 'node:assert/strict';
// Fotos de productos cargados a mano desde el catálogo (proveedores sin tienda importada, como Dogo).
const src=fs.readFileSync(new URL('../worker/index.js',import.meta.url),'utf8');
const worker=await import('data:text/javascript,'+encodeURIComponent(src));
const site='https://nexofitt.com.ar',r2=new Map(),images=new Map();
const env={SUPABASE_URL:'https://db.example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',SUPABASE_SERVICE_ROLE_KEY:'sb_secret_test',ASSETS:{fetch:async()=>new Response('asset')},
 FOTOS:{async put(k,v,o){r2.set(k,{v,type:o.httpMetadata.contentType});},async get(k){return null;}}};
const vendor={id:'v_dogo',name:'Dogo',status:'active'};
const offers=[
 {id:'o1',vendorId:'v_dogo',category:'Mancuernas',model:'Hexagonal engomada',size:'5 kg',status:'review'},
 {id:'o2',vendorId:'v_dogo',category:'Mancuernas',model:'Hexagonal engomada',size:'10 kg',status:'published'},
 {id:'o3',vendorId:'v_dogo',category:'Discos',model:'Fundición lisa',size:'Ø30 mm · 5 kg',status:'review'},
 {id:'o4',vendorId:'v_dogo',category:'Discos',model:'Fundición lisa',size:'Ø30 mm · 10 kg',status:'draft'},
 {id:'o5',vendorId:'otro',category:'Discos',model:'Fundición lisa',size:'Ø30 mm · 5 kg',status:'published'}];
const ids={vendor:{role:'vendor',vendorId:'v_dogo'},admin:{role:'admin'}};
globalThis.fetch=async(url,opts={})=>{url=String(url);const b=opts.body&&typeof opts.body==='string'?JSON.parse(opts.body):{};
 if(url.endsWith('/rpc/fitness_snapshot'))return Response.json({_identity:ids[/Bearer (\w+)/.exec(opts.headers.Authorization)[1]],vendors:[vendor],offers});
 if(url.endsWith('/rpc/fitness_images_list'))return Response.json([...images.values()]);
 if(url.endsWith('/rpc/fitness_image_set')){images.set(b.p_image_key,{key:b.p_image_key,path:b.p_path,status:b.p_status});return Response.json({ok:true});}
 if(url.endsWith('/rpc/fitness_image_status')){images.get(b.p_image_key).status=b.p_status;return Response.json({ok:true});}
 return new Response('?',{status:404});};
const call=(who,path,init={})=>worker.default.fetch(new Request(site+path,{...init,headers:{...(init.headers||{}),Authorization:'Bearer '+who}}),env);
let r=await call('vendor','/api/fotos?v=v_dogo');assert.equal(r.status,200);
const d=await r.json();
assert.deepEqual(d.products.map(p=>[p.name,p.variants]),[['Hexagonal engomada · Mancuernas',2],['Fundición lisa · Discos',1]],'agrupa por modelo; ignora borradores y productos ajenos');
const slug=d.products[0].slug;
const fd=new FormData();fd.append('vendorId','v_dogo');fd.append('key',slug);fd.append('file',new Blob([new Uint8Array(10)],{type:'image/jpeg'}),'a.jpg');
r=await call('vendor','/api/fotos/subir',{method:'POST',body:fd});assert.equal(r.status,200);
assert.equal(r2.size,1,'una sola copia en R2');
for(const k of [slug,'o1','o2'])assert.equal(images.get(k).status,'aprobada',k+' queda con foto');
assert(!images.has('o3'),'el otro modelo no se toca');
assert.equal(images.get('o1').path,images.get('o2').path);
r=await call('admin','/api/fotos/estado',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({vendorId:'v_dogo',key:slug,status:'rechazada'})});
assert.equal(r.status,200);for(const k of [slug,'o1','o2'])assert.equal(images.get(k).status,'rechazada','rechazar el modelo rechaza sus variantes');
r=await call('admin','/api/fotos/procesar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({vendorId:'v_dogo'})});
assert.deepEqual((await r.json()).results,[],'los productos cargados a mano no se buscan en una tienda');
for(const f of ['admin.html','proveedores.html'])assert.match(fs.readFileSync(f,'utf8'),/\(db\.offers\|\|\[\]\)\.some\(function\(o\)\{return o\.vendorId===v\.id/,f+': panel de fotos también sin tienda importada');
console.log('OK: fotos para productos cargados a mano (por modelo, a todas sus variantes).');

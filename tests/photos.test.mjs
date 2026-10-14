import fs from 'node:fs';import assert from 'node:assert/strict';
// Fotos de productos en el Worker, con R2, Workers AI, Supabase y la tienda del proveedor simulados.
const src=fs.readFileSync(new URL('../worker/index.js',import.meta.url),'utf8');
const worker=await import('data:text/javascript,'+encodeURIComponent(src));
const site='https://proyecto-fitness.example.workers.dev';
const r2=new Map(),images=new Map();let aiCalls=[];
const env={SUPABASE_URL:'https://db.example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',SUPABASE_SERVICE_ROLE_KEY:'sb_secret_test',ASSETS:{fetch:async()=>new Response('asset')},
 FOTOS:{async put(k,v,o){r2.set(k,{bytes:new Uint8Array(v),type:o.httpMetadata.contentType});},async get(k){const x=r2.get(k);return x?{body:x.bytes,httpMetadata:{contentType:x.type}}:null;}},
 AI:{async run(model,input){aiCalls.push({model,input});return {image:Buffer.from('jpeg-ia').toString('base64')};}}};
const drafts=[
 {key:'kit#[{"name":"Color","value":"Rosa"}]',sourceSlug:'kit',name:'Kit Fuerza',sourceCategory:'Combos',properties:[{name:'Color',value:'Rosa'}],hidden:false,price:100},
 {key:'kit#[{"name":"Color","value":"Negro"}]',sourceSlug:'kit',name:'Kit Fuerza',sourceCategory:'Combos',properties:[{name:'Color',value:'Negro'}],hidden:false,price:100},
 {key:'soga#[]',sourceSlug:'soga',name:'Soga de saltar',sourceCategory:'Accesorios',properties:[],hidden:false,price:50},
 {key:'oculto#[]',sourceSlug:'oculto',name:'Oculto',properties:[],hidden:true,price:1}];
const vendor={id:'ab_fitness',name:'AB Fitness',web:'https://tienda.example',catalogDrafts:drafts};
const identities={admin:{id:'a',role:'admin'},vendor:{id:'v',role:'vendor',vendorId:'ab_fitness'},otro:{id:'o',role:'vendor',vendorId:'otro'},buyer:{id:'b',role:'buyer'}};
const page=`<html><head><meta property="og:image" content="http://cdn.example/stores/1/products/kit-640-0.webp"></head><body><div data-variants="[{&quot;option0&quot;:&quot;Rosa&quot;,&quot;image_url&quot;:&quot;\\/\\/cdn.example\\/stores\\/1\\/products\\/kit-640-0.webp&quot;},{&quot;option0&quot;:&quot;Negro&quot;,&quot;image_url&quot;:&quot;\\/\\/cdn.example\\/stores\\/1\\/products\\/kit-negro.webp&quot;}]"></div></body></html>`;
let fetched=[];
globalThis.fetch=async(url,opts={})=>{url=String(url);fetched.push(url);const body=opts.body&&typeof opts.body==='string'?JSON.parse(opts.body):{};
 if(url.includes('/rpc/fitness_snapshot')){const who=/Bearer (\w+)/.exec(opts.headers.Authorization)[1];return Response.json({_identity:identities[who],vendors:[vendor]});}
 if(url.includes('/rpc/fitness_images_list'))return Response.json([...images.values()]);
 if(url.includes('/rpc/fitness_image_set')){assert.equal(opts.headers.apikey,'sb_secret_test');images.set(body.p_image_key,{key:body.p_image_key,slug:body.p_slug,path:body.p_path,source:body.p_source,status:body.p_status});return Response.json({ok:true});}
 if(url.includes('/rpc/fitness_image_status')){const i=images.get(body.p_image_key);i.status=body.p_status;return Response.json({ok:true});}
 if(url==='https://tienda.example/productos/kit/')return new Response(page,{headers:{'Content-Type':'text/html'}});
 if(url.startsWith('https://tienda.example/productos/'))return new Response('no',{status:404});
 if(url==='https://cdn.example/stores/1/products/kit-1024-1024.webp')return new Response('grande',{headers:{'Content-Type':'image/webp'}});
 if(url==='https://cdn.example/stores/1/products/kit-negro.webp')return new Response('negro',{headers:{'Content-Type':'image/webp'}});
 return new Response('?',{status:404});};
const call=(who,path,init={})=>worker.default.fetch(new Request(site+path,{...init,headers:{...(init.headers||{}),Authorization:'Bearer '+who}}),env);
const post=(who,path,json)=>call(who,path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(json)});

// Lectura de la página de la tienda (Tiendanube): foto principal y fotos por variante.
const info=worker.readShopPage(page,'https://tienda.example/productos/kit/');
assert.equal(info.main,'https://cdn.example/stores/1/products/kit-640-0.webp');
assert.deepEqual(info.variants.map(v=>v.options[0]),['Rosa','Negro']);

// Permisos.
assert.equal((await call('buyer','/api/fotos?v=ab_fitness')).status,403,'un comprador no ve el panel');
assert.equal((await call('otro','/api/fotos?v=ab_fitness')).status,403,'otro proveedor no ve fotos ajenas');
let r=await call('vendor','/api/fotos?v=ab_fitness');assert.equal(r.status,200);
let d=await r.json();assert.deepEqual(d.products.map(p=>p.slug),['kit','soga'],'los ocultos no se listan');assert.equal(d.ai,true);
assert.equal((await post('vendor','/api/fotos/procesar',{vendorId:'ab_fitness'})).status,403,'solo el admin procesa');

// Procesar: foto real de la tienda (más grande), foto propia de la variante Negro e IA para la soga.
r=await post('admin','/api/fotos/procesar',{vendorId:'ab_fitness',limit:4});d=await r.json();
assert.deepEqual(d.results,[{slug:'kit',result:'tienda'},{slug:'soga',result:'ia'}]);assert.equal(d.remaining,0);
assert.equal(images.get('kit').source,'tienda');assert.equal(images.get('kit').status,'aprobada');
assert.equal(images.get('kit#[{"name":"Color","value":"Negro"}]').source,'tienda','la variante con foto propia se guarda aparte');
assert(!images.has('kit#[{"name":"Color","value":"Rosa"}]'),'la variante con la misma foto usa la principal');
assert.equal(images.get('soga').source,'ia');assert.equal(images.get('soga').status,'pendiente','la IA espera aprobación');
assert.equal(aiCalls[0].model,'@cf/black-forest-labs/flux-1-schnell');assert.match(aiCalls[0].input.prompt,/Soga de saltar/);assert.match(aiCalls[0].input.prompt,/white background/);
assert.equal(new TextDecoder().decode(r2.get(images.get('kit').path).bytes),'grande','se guarda la versión grande de la foto');
// Servir la foto guardada.
r=await worker.default.fetch(new Request(site+'/fotos/'+images.get('kit').path),env);assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'image/webp');assert.equal(await r.text(),'grande');
assert.equal((await worker.default.fetch(new Request(site+'/fotos/ab_fitness/x%2F..%2F..%2Fsecreto'),env)).status,404,'no se sale de la carpeta de fotos');

// Aprobar la foto de IA (solo admin) y regenerar.
assert.equal((await post('vendor','/api/fotos/estado',{vendorId:'ab_fitness',key:'soga',status:'aprobada'})).status,403);
assert.equal((await post('admin','/api/fotos/estado',{vendorId:'ab_fitness',key:'soga',status:'aprobada'})).status,200);assert.equal(images.get('soga').status,'aprobada');
const before=images.get('soga').path;assert.equal((await post('admin','/api/fotos/regenerar',{vendorId:'ab_fitness',slug:'soga'})).status,200);
assert.notEqual(images.get('soga').path,before);assert.equal(images.get('soga').status,'pendiente');

// El proveedor sube su propia foto: se publica sin esperar aprobación. Se validan tipo y tamaño.
const form=(type,size)=>{const f=new FormData();f.append('vendorId','ab_fitness');f.append('key','soga');f.append('file',new File([new Uint8Array(size)],'foto',{type}));return f;};
assert.equal((await call('vendor','/api/fotos/subir',{method:'POST',body:form('application/pdf',10)})).status,400);
assert.equal((await call('vendor','/api/fotos/subir',{method:'POST',body:form('image/png',5*1024*1024)})).status,400);
r=await call('vendor','/api/fotos/subir',{method:'POST',body:form('image/png',2048)});assert.equal(r.status,200);
assert.equal(images.get('soga').source,'proveedor');assert.equal(images.get('soga').status,'aprobada');
assert.equal((await call('otro','/api/fotos/subir',{method:'POST',body:form('image/png',10)})).status,403,'no puede subir a otro proveedor');

// Sin R2 configurado, las fotos avisan que no están activas.
assert.equal((await worker.default.fetch(new Request(site+'/api/fotos?v=ab_fitness',{headers:{Authorization:'Bearer admin'}}),{...env,FOTOS:undefined})).status,503);
console.log('OK: fotos de productos: tienda del proveedor (principal y por variante), IA pendiente de aprobación, permisos, subida validada y archivos servidos desde R2.');

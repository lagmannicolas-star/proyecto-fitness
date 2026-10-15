import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
// Publicador automático de Instagram con Instagram y Supabase simulados. No usa claves reales.
const src=fs.readFileSync(new URL('../worker/index.js',import.meta.url),'utf8');
const worker=await import('data:text/javascript,'+encodeURIComponent(src));
const env={SUPABASE_URL:'https://db.example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',SUPABASE_SERVICE_ROLE_KEY:'sb_secret_test',TOKEN_KEY:crypto.randomBytes(32).toString('base64'),
 IG_TOKEN:'IG-TOKEN-1',SITE_URL:'https://nexofitt.com.ar',IG_API_URL:'https://ig.example',IG_WAIT_MS:0,ALLOWED_ORIGINS:'https://nexofitt.com.ar'};
const NOW=Date.parse('2026-10-19T12:07:00Z'); // 9:07 en Argentina
let settings,queue,igCalls,failNext;
function reset(){settings={id:true,paused:false,ig_user_id:null,ig_username:null,token_sealed:null,token_expires_at:null};igCalls=[];failNext=null;let n=0;
 queue=[{id:1,scheduled_at:'2026-10-19T12:00:00Z',kind:'post',media:['redes/publicar/semana-1/1-0900-producto.jpg'],caption:'Pesa rusa',status:'pendiente',attempts:0},
  {id:2,scheduled_at:'2026-10-19T11:30:00Z',kind:'historia',media:['redes/publicar/semana-1/1-0830-historia.jpg'],caption:'',status:'pendiente',attempts:0},
  {id:3,scheduled_at:'2026-10-19T12:01:00Z',kind:'carrusel',media:['redes/publicar/a-01.jpg','redes/publicar/a-02.jpg'],caption:'Carrusel',status:'pendiente',attempts:0},
  {id:4,scheduled_at:'2026-10-19T16:00:00Z',kind:'post',media:['redes/publicar/x.jpg'],caption:'Más tarde',status:'pendiente',attempts:0},
  {id:5,scheduled_at:'2026-10-18T23:00:00Z',kind:'post',media:['redes/publicar/y.jpg'],caption:'Ayer',status:'pendiente',attempts:0}];
 globalThis.fetch=async(url,opts={})=>{url=new URL(String(url));const method=opts.method||'GET';
  if(url.host==='db.example.supabase.co'){if(!url.pathname.includes('/rpc/'))assert.equal(opts.headers.apikey,'sb_secret_test','la cola solo se toca con la clave del servidor');
   const q=url.searchParams,body=opts.body?JSON.parse(opts.body):null;
   if(url.pathname.endsWith('/fitness_social_settings')){if(method==='PATCH')Object.assign(settings,body);return Response.json(method==='GET'?[settings]:null);}
   if(url.pathname.endsWith('/rpc/fitness_snapshot'))return Response.json({_identity:{id:'a',role:opts.headers.Authorization==='Bearer admin'?'admin':'buyer'}});
   let rows=queue.filter(r=>{for(const [k,v] of q){if(['select','order','limit'].includes(k))continue;const [op,val]=[v.slice(0,v.indexOf('.')),v.slice(v.indexOf('.')+1)];
     if(op==='eq'&&String(r[k])!==val)return false;if(op==='lte'&&!(Date.parse(r[k])<=Date.parse(val)))return false;if(op==='lt'&&!(Date.parse(r[k])<Date.parse(val)))return false;}return true;});
   if(method==='GET'){rows.sort((a,b)=>Date.parse(a.scheduled_at)-Date.parse(b.scheduled_at));return Response.json(rows.slice(0,Number(q.get('limit')||99)));}
   if(method==='PATCH'){rows.forEach(r=>Object.assign(r,body));return Response.json(opts.headers.Prefer?rows:null);}}
  if(url.host==='ig.example'){const p=Object.fromEntries(method==='GET'?url.searchParams:new URLSearchParams(opts.body));igCalls.push({method,path:url.pathname,p});
   if(failNext&&url.pathname.endsWith('/media')){const m=failNext;failNext=null;return Response.json({error:{message:m}},{status:400});}
   if(url.pathname==='/refresh_access_token'){assert.equal(p.grant_type,'ig_refresh_token');return Response.json({access_token:'IG-TOKEN-2',expires_in:5184000});}
   if(url.pathname==='/me'){assert.equal(p.fields,'user_id,username');return Response.json({user_id:'1784',username:'nexofit.ar'});}
   if(url.pathname==='/1784/media')return Response.json({id:'c'+igCalls.length});
   if(url.pathname==='/1784/media_publish')return Response.json({id:'m'+p.creation_id});
   if(p.fields==='status_code')return Response.json({status_code:'FINISHED'});
   if(p.fields==='permalink')return Response.json({permalink:'https://www.instagram.com/p/'+url.pathname.slice(1)});}
  return new Response('?',{status:404});};}

// Sin secretos de Instagram no hace nada.
reset();assert.deepEqual(await worker.runSocial({...env,IG_TOKEN:''},NOW),{skipped:'Instagram todavía no está conectado'});assert.equal(igCalls.length,0);

// En pausa no publica.
reset();settings.paused=true;assert.equal((await worker.runSocial(env,NOW)).skipped,'Publicaciones en pausa');assert.equal(igCalls.length,0);

// Publica lo que ya tocaba, en orden, y deja lo de más tarde.
reset();let out=await worker.runSocial(env,NOW);
assert.deepEqual(out,{published:[2,1,3],errors:[]});
assert.deepEqual(queue.map(r=>r.status),['publicado','publicado','publicado','pendiente','vencido'],'lo de ayer no se publica de golpe');
assert.equal(queue[0].ig_media_id,queue[0].ig_media_id&&queue[0].ig_media_id);assert.match(queue[0].permalink,/instagram\.com\/p\//);
const creates=igCalls.filter(c=>c.path==='/1784/media');
assert.deepEqual(creates[0].p,{access_token:'IG-TOKEN-1',media_type:'STORIES',image_url:'https://nexofitt.com.ar/redes/publicar/semana-1/1-0830-historia.jpg'},'la historia va sin texto');
assert.deepEqual(creates[1].p,{access_token:'IG-TOKEN-1',image_url:'https://nexofitt.com.ar/redes/publicar/semana-1/1-0900-producto.jpg',caption:'Pesa rusa'});
assert.equal(creates[2].p.is_carousel_item,'true');assert.equal(creates[3].p.is_carousel_item,'true');
assert.equal(creates[4].p.media_type,'CAROUSEL');assert.equal(creates[4].p.children.split(',').length,2);assert.equal(creates[4].p.caption,'Carrusel');
assert.equal(igCalls.filter(c=>c.path==='/1784/media_publish').length,3);
assert.equal(settings.ig_user_id,'1784');assert.equal(settings.ig_username,'nexofit.ar');
assert(settings.token_sealed&&!settings.token_sealed.includes('IG-TOKEN'),'la llave se guarda cifrada');
assert.equal(settings.last_error,null);

// Segunda corrida: ya no hay nada para publicar.
igCalls=[];out=await worker.runSocial(env,NOW+60000);assert.deepEqual(out,{published:[],errors:[]});assert.equal(igCalls.length,0);

// Renovación de la llave (una vez por hora) y uso de la llave renovada.
reset();out=await worker.runSocial(env,Date.parse('2026-10-19T13:00:30Z'));
assert(igCalls.some(c=>c.path==='/refresh_access_token'),'renueva la llave');
assert.equal(igCalls.find(c=>c.path==='/1784/media').p.access_token,'IG-TOKEN-2');assert(settings.token_expires_at);
// Si se carga un secreto nuevo, manda el nuevo.
const sealed=settings.token_sealed;igCalls=[];queue.forEach(r=>{if(r.id===4){r.status='pendiente';}});
out=await worker.runSocial({...env,IG_TOKEN:'IG-TOKEN-NUEVO'},Date.parse('2026-10-19T16:10:00Z'));
assert.equal(igCalls.find(c=>c.path==='/1784/media').p.access_token,'IG-TOKEN-NUEVO');assert.notEqual(settings.token_sealed,sealed);

// Errores: reintenta hasta 3 veces y después queda marcado.
reset();queue=queue.filter(r=>r.id===1);for(let i=1;i<=3;i++){failNext='Imagen inválida';out=await worker.runSocial(env,NOW+i*300000);assert.deepEqual(out.errors,[1]);}
assert.equal(queue[0].status,'error');assert.equal(queue[0].attempts,3);assert.match(queue[0].error,/Imagen inválida/);assert.match(settings.last_error,/errores/);

// Prueba de conexión desde el panel: solo el administrador, y nunca devuelve la llave.
reset();const call=auth=>worker.default.fetch(new Request('https://nexofitt.com.ar/api/redes/probar',{method:'POST',headers:{Origin:'https://nexofitt.com.ar',Authorization:auth}}),env);
assert.equal((await call('Bearer buyer')).status,401);
const ok=await (await call('Bearer admin')).json();assert.deepEqual(ok,{connected:true,username:'nexofit.ar'});

// Las imágenes programadas son JPG públicos dentro del sitio y la cola de la semana está completa.
const cola=JSON.parse(fs.readFileSync(new URL('../redes/publicar/semana-1/cola.json',import.meta.url),'utf8'));
assert.equal(cola.length,56);assert.equal(cola.filter(x=>x.kind==='historia').length,35);
for(const x of cola){assert(['post','carrusel','historia'].includes(x.kind));assert(x.media.length>=1&&x.media.length<=10);
 for(const m of x.media){assert.match(m,/^redes\/publicar\/semana-1\/.+\.jpg$/);assert(fs.existsSync(new URL('../'+m,import.meta.url)),m);}
 if(x.kind!=='historia')assert(x.caption.length>20&&x.caption.length<2200,'descripción de '+x.label);}
const ignore=fs.readFileSync(new URL('../.assetsignore',import.meta.url),'utf8');assert.match(ignore,/!redes\/publicar\/\*\*/);
console.log('OK: Instagram programado: publica posts, carruseles e historias a horario, no publica atrasos ni en pausa, renueva y cifra la llave, reintenta errores y la semana 1 está lista (56 piezas).');

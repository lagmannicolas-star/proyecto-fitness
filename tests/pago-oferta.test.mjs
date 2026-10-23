import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
// Pago de la oferta elegida ("Pedí ofertas") con Mercado Pago marketplace. Mercado Pago y Supabase simulados.
const src=fs.readFileSync(new URL('../worker/index.js',import.meta.url),'utf8');
const worker=await import('data:text/javascript,'+encodeURIComponent(src));
const site='https://nexofitt.com.ar';
const env={SUPABASE_URL:'https://db.example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',ALLOWED_ORIGINS:site,MP_CLIENT_ID:'123456',ASSETS:{fetch:async()=>new Response('asset')},
 MP_CLIENT_SECRET:'client-secret',MP_WEBHOOK_SECRET:'whsec',SUPABASE_SERVICE_ROLE_KEY:'sb_secret_test',TOKEN_KEY:crypto.randomBytes(32).toString('base64')};
const TOKEN='a'.repeat(64);let calls,red={},datos,payment,reg;
globalThis.fetch=async(url,opts={})=>{url=String(url);calls.push({url,opts});const b=opts.body?JSON.parse(opts.body):{};
 if(url.includes('/rpc/fitness_red_por_token'))return Response.json(b.p_token===TOKEN?{proveedor_id:7,nombre:'Herrero'}:null);
 if(url.includes('/rpc/fitness_mp_red_link')){red[b.p_proveedor]={mp_user_id:b.p_mp_user_id,secret:b.p_secret,expires_at:b.p_expires_at};return Response.json({ok:true});}
 if(url.includes('/rpc/fitness_mp_red_account'))return Response.json(red[b.p_proveedor]||null);
 if(url.includes('/rpc/fitness_sol_pago_datos'))return datos?Response.json(datos):Response.json({message:'Primero elegí una oferta'},{status:400});
 if(url.includes('/rpc/fitness_sol_registrar_pago')){reg=b;return Response.json({found:true,changed:true});}
 if(url.includes('/oauth/token'))return Response.json({access_token:'RED-ACCESS',refresh_token:'RED-REFRESH',user_id:777,expires_in:15552000});
 if(url.includes('/checkout/preferences'))return Response.json({id:'pref-9',init_point:'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref-9'});
 if(url.includes('/v1/payments/'))return Response.json(payment);
 return new Response('?',{status:404});};
const call=(path,init={})=>worker.default.fetch(new Request(site+path,init),env);
const post=(path,body)=>call(path,{method:'POST',headers:{'Content-Type':'application/json',Origin:site},body:JSON.stringify(body)});
calls=[];
// 1) El proveedor de la red conecta Mercado Pago desde su link privado y vuelve a él.
assert.equal((await post('/api/pagos/red/conectar',{token:'b'.repeat(64),returnUrl:site+'/oferta.html'})).status,404,'link ajeno');
assert.equal((await post('/api/pagos/red/conectar',{token:TOKEN,returnUrl:'https://otro.example/x'})).status,400);
let r=await post('/api/pagos/red/conectar',{token:TOKEN,returnUrl:site+'/oferta.html'});assert.equal(r.status,200);
const state=new URL((await r.json()).url).searchParams.get('state');
assert(!state.includes(TOKEN),'el link privado no viaja a la vista en el state');
r=await call('/api/pagos/conectado?code=c1&state='+encodeURIComponent(state));
assert.equal(r.status,302);assert.equal(r.headers.get('location'),site+'/oferta.html?mp=ok#t='+TOKEN);
assert.equal(red[7].mp_user_id,'777');assert(!red[7].secret.includes('RED-ACCESS'),'llave cifrada');
// 2) El comprador paga: cobra la cuenta del proveedor y el 10% de los productos (sin envío) va a Nexo Fit.
datos=null;assert.equal((await post('/api/pagos/oferta',{code:'SOL-ABC123',email:'c@example.test',returnUrl:site+'/mi-solicitud.html'})).status,409,'sin oferta elegida');
datos={code:'SOL-ABC123',oferta_id:13,proveedor_id:7,proveedor:'Herrero Fitness',precio:100000,envio:5000,total:105000,comision:10000,comision_pct:10,mp:true};
calls=[];r=await post('/api/pagos/oferta',{code:'sol-abc123',email:'C@example.test',returnUrl:site+'/mi-solicitud.html'});assert.equal(r.status,200);
const out=await r.json();assert.match(out.url,/mercadopago/);assert(!JSON.stringify(out).includes('RED-ACCESS'));
const q=JSON.parse(calls.find(c=>c.url.includes('fitness_sol_pago_datos')).opts.body);assert.deepEqual(q,{p_code:'SOL-ABC123',p_email:'c@example.test'});
const mp=calls.find(c=>c.url.includes('/checkout/preferences')),pref=JSON.parse(mp.opts.body);
assert.equal(mp.opts.headers.Authorization,'Bearer RED-ACCESS','cobra la cuenta del proveedor');
assert.equal(pref.marketplace_fee,10000);assert.equal(pref.items[0].unit_price,105000);assert.equal(pref.external_reference,'SOL-ABC123');
assert.equal(pref.notification_url,site+'/api/pagos/aviso?r=7');assert.equal(pref.back_urls.success,site+'/mi-solicitud.html?codigo=SOL-ABC123&pago=ok');
datos={...datos,mp:false};assert.equal((await post('/api/pagos/oferta',{code:'SOL-ABC123',email:'c@example.test',returnUrl:site+'/mi-solicitud.html'})).status,409,'proveedor sin MP');
// 3) Aviso firmado: se consulta el pago real con la llave del proveedor y se registra en la solicitud.
payment={id:555,status:'approved',status_detail:'accredited',transaction_amount:105000,currency_id:'ARS',external_reference:'SOL-ABC123',collector_id:777,fee_details:[{type:'application_fee',amount:10000}]};
const ts='1700000000',sig=crypto.createHmac('sha256','whsec').update('id:555;request-id:q;ts:'+ts+';').digest('hex');
const notice=(s,qs='r=7')=>call('/api/pagos/aviso?'+qs+'&data.id=555&type=payment',{method:'POST',headers:{'x-signature':s,'x-request-id':'q','Content-Type':'application/json'},body:'{}'});
reg=null;assert.equal((await notice('ts='+ts+',v1='+'0'.repeat(64))).status,401);assert.equal(reg,null);
assert.equal((await notice('ts='+ts+',v1='+sig)).status,200);
assert.deepEqual(reg,{p_code:'SOL-ABC123',p_proveedor:7,payment:{id:'555',status:'approved',statusDetail:'accredited',amount:105000,currency:'ARS',approvedAt:null,marketplaceFee:10000}});
payment={...payment,collector_id:1};reg=null;await notice('ts='+ts+',v1='+sig);assert.equal(reg,null,'pago de otra cuenta se ignora');
assert.equal((await (await notice('ts='+ts+',v1='+sig,'r=abc')).json()).ignored,true);
// 4) Páginas y textos.
const ms=fs.readFileSync('assets/mi-solicitud.js','utf8'),of=fs.readFileSync('assets/oferta.js','utf8');
assert.match(ms,/\/api\/pagos\/oferta/);assert.match(of,/\/api\/pagos\/red\/conectar/);
assert.match(fs.readFileSync('terminos.html','utf8'),/pagás con Mercado Pago/);
const sql=fs.readFileSync('supabase/migrations/20261023020000_pago_oferta_mercadopago.sql','utf8');
assert.match(sql,/round\(o\.precio_total\*pct\/100,2\)/,'comisión sobre productos, sin envío');
assert.match(sql,/revoke all on table public\.fitness_mp_red from public,anon,authenticated/);
console.log('OK: pago de la oferta elegida con Mercado Pago (proveedor de la red conecta su cuenta, cobro dividido, aviso firmado).');

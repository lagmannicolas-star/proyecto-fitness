import fs from 'node:fs';import assert from 'node:assert/strict';import crypto from 'node:crypto';
// Worker de pagos (Mercado Pago marketplace) con Mercado Pago y Supabase simulados. No usa claves reales.
const src=fs.readFileSync(new URL('../worker/index.js',import.meta.url),'utf8');
const worker=await import('data:text/javascript,'+encodeURIComponent(src));
const site='https://proyecto-fitness.example.workers.dev',pages='https://lagmannicolas-star.github.io',back=pages+'/proyecto-fitness/proveedores.html';
const base={SUPABASE_URL:'https://db.example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',ALLOWED_ORIGINS:pages,MP_CLIENT_ID:'123456',ASSETS:{fetch:async()=>new Response('asset')}};
const env={...base,MP_CLIENT_SECRET:'client-secret',MP_WEBHOOK_SECRET:'whsec',SUPABASE_SERVICE_ROLE_KEY:'sb_secret_test',TOKEN_KEY:crypto.randomBytes(32).toString('base64')};
const future=new Date(Date.now()+20*60000).toISOString();
let snapshot,calls,accounts={},payment,tokenReply;
function mockFetch(){calls=[];globalThis.fetch=async(url,opts={})=>{url=String(url);calls.push({url,opts});const body=opts.body?JSON.parse(opts.body):{};
 if(url.includes('/rpc/fitness_snapshot'))return Response.json(snapshot);
 if(url.includes('/rpc/fitness_mp_link')){accounts[body.p_vendor_id]={vendor_id:body.p_vendor_id,mp_user_id:body.p_mp_user_id,secret:body.p_secret,expires_at:body.p_expires_at};return Response.json({ok:true});}
 if(url.includes('/rpc/fitness_mp_unlink')){delete accounts[body.p_vendor_id];return Response.json({ok:true});}
 if(url.includes('/rpc/fitness_mp_account'))return Response.json(accounts[body.p_vendor_id]||null);
 if(url.includes('/rpc/fitness_register_payment'))return Response.json({found:true,changed:true});
 if(url.includes('/oauth/token'))return Response.json(tokenReply(body));
 if(url.includes('/checkout/preferences'))return Response.json({id:'pref-1',init_point:'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref-1'});
 if(url.includes('/v1/payments/'))return Response.json(payment);
 return new Response('?',{status:404});};}
const call=(path,init={},e=env)=>worker.default.fetch(new Request(site+path,init),e);
const post=(path,body,headers={})=>call(path,{method:'POST',headers:{'Content-Type':'application/json',Origin:pages,...headers},body:JSON.stringify(body)});
mockFetch();
// Sitio: lo que no es /api/ se sirve como archivo. Sin secretos no se ofrece el pago.
assert.equal(await (await call('/nicolas.html')).text(),'asset');
assert.deepEqual(await (await call('/api/pagos/estado',{},base)).json(),{mercadoPago:false});
assert.deepEqual(await (await call('/api/pagos/estado')).json(),{mercadoPago:true});
assert.equal((await call('/api/pagos/conectar',{method:'POST',body:'{}'},base)).status,503);

// 1) El proveedor conecta su cuenta (OAuth).
snapshot={_identity:{id:'b1',role:'buyer',email:'c@example.test'},vendors:[],orders:[]};
assert.equal((await post('/api/pagos/conectar',{returnUrl:back},{Authorization:'Bearer buyer'})).status,401,'un comprador no conecta cuentas');
snapshot={_identity:{id:'u-ab',role:'vendor',vendorId:'v1',email:'ab@example.test'},vendors:[],orders:[]};
assert.equal((await post('/api/pagos/conectar',{returnUrl:'https://otro.example/x'},{Authorization:'Bearer vendor'})).status,400,'regreso a otro sitio');
let r=await post('/api/pagos/conectar',{returnUrl:back+'?x=1#mp'},{Authorization:'Bearer vendor'});assert.equal(r.status,200);
const auth=new URL((await r.json()).url);
assert.equal(auth.origin+auth.pathname,'https://auth.mercadopago.com.ar/authorization');
assert.equal(auth.searchParams.get('client_id'),'123456');assert.equal(auth.searchParams.get('redirect_uri'),site+'/api/pagos/conectado');
const state=auth.searchParams.get('state');
tokenReply=b=>{assert.equal(b.client_secret,'client-secret');assert.equal(b.grant_type,'authorization_code');assert.equal(b.code,'code-1');return {access_token:'VENDOR-ACCESS-1',refresh_token:'VENDOR-REFRESH-1',user_id:555,expires_in:15552000};};
assert.equal((await call('/api/pagos/conectado?code=code-1&state='+state.slice(0,-2)+'xx')).status,400,'enlace alterado');
r=await call('/api/pagos/conectado?code=code-1&state='+encodeURIComponent(state));
assert.equal(r.status,302);assert.equal(r.headers.get('location'),back+'?mp=ok');
assert.equal(accounts.v1.mp_user_id,'555');assert(!accounts.v1.secret.includes('VENDOR-ACCESS-1'),'la llave del proveedor se guarda cifrada');
r=await call('/api/pagos/conectado?error=access_denied&state='+encodeURIComponent(state));assert.equal(r.headers.get('location'),back+'?mp=cancelado');

// 2) El comprador paga: el cobro se crea con la llave del proveedor y separa el 10% de los productos.
snapshot={_identity:{id:'u1',role:'buyer',email:'c@example.test'},vendors:[{id:'v1',name:'AB Fitness'},{id:'v2',name:'Sin MP'}],orders:[
 {id:1,buyerId:'u1',vendorId:'v1',payRef:'ref-aaaaaaaaaaaaaaaa',status:'pending_payment',desc:'Colchonetas: Colchoneta, Rojo',qty:2,subtotal:9000,shipping:3000,commission:900,expiresAt:future},
 {id:2,buyerId:'u1',vendorId:'v1',payRef:'ref-aaaaaaaaaaaaaaaa',status:'pending_payment',desc:'Mancuernas: 2 kg',qty:1,subtotal:1000,shipping:0,commission:100,expiresAt:future},
 {id:3,buyerId:'u1',vendorId:'v2',payRef:'ref-bbbbbbbbbbbbbbbb',status:'pending_payment',desc:'Soga',qty:1,subtotal:500,shipping:0,commission:50,expiresAt:future}]};
calls=[];r=await post('/api/pagos/preferencia',{payRef:'ref-aaaaaaaaaaaaaaaa',returnUrl:pages+'/proyecto-fitness/nicolas.html',marketplace_fee:0},{Authorization:'Bearer user-jwt'});
assert.equal(r.status,200);assert.equal(r.headers.get('access-control-allow-origin'),pages);
const out=await r.json();assert.match(out.url,/mercadopago/);assert.equal(out.fee,1000);
const mp=calls.find(c=>c.url.includes('/checkout/preferences')),pref=JSON.parse(mp.opts.body);
assert.equal(mp.opts.headers.Authorization,'Bearer VENDOR-ACCESS-1','cobra la cuenta del proveedor');
assert.equal(pref.marketplace_fee,1000,'10% de los productos, sin el envío');
assert.deepEqual(pref.items.map(i=>i.unit_price),[12000,1000]);assert.equal(pref.external_reference,'ref-aaaaaaaaaaaaaaaa');
assert.equal(pref.notification_url,site+'/api/pagos/aviso?v=v1');assert.equal(pref.back_urls.success,pages+'/proyecto-fitness/nicolas.html?pago=ok');
assert(!JSON.stringify(out).includes('VENDOR-ACCESS'),'la llave no vuelve al navegador');
assert.equal((await post('/api/pagos/preferencia',{payRef:'ref-bbbbbbbbbbbbbbbb',returnUrl:pages+'/x'},{Authorization:'Bearer u'})).status,409,'proveedor sin Mercado Pago');
assert.equal((await post('/api/pagos/preferencia',{payRef:'ref-aaaaaaaaaaaaaaaa',returnUrl:pages+'/x'})).status,401,'sin sesión');
assert.equal((await post('/api/pagos/preferencia',{payRef:'ref-zzzzzzzzzzzzzzzz',returnUrl:pages+'/x'},{Authorization:'Bearer u'})).status,404,'pedido ajeno');

// 3) Aviso de Mercado Pago: se consulta el pago real con la llave del proveedor y se registra.
payment={id:123,status:'approved',status_detail:'accredited',transaction_amount:13000,currency_id:'ARS',external_reference:'ref-aaaaaaaaaaaaaaaa',collector_id:555,fee_details:[{type:'mercadopago_fee',amount:800},{type:'application_fee',amount:1000}]};
const ts='1700000000',rid='req-1',sig=crypto.createHmac('sha256','whsec').update('id:123;request-id:'+rid+';ts:'+ts+';').digest('hex');
const notice=signature=>call('/api/pagos/aviso?v=v1&data.id=123&type=payment',{method:'POST',headers:{'x-signature':signature,'x-request-id':rid,'Content-Type':'application/json'},body:JSON.stringify({type:'payment',data:{id:'123'}})});
calls=[];assert.equal((await notice('ts='+ts+',v1='+'0'.repeat(64))).status,401);assert.equal(calls.length,0,'firma inválida no consulta nada');
r=await notice('ts='+ts+',v1='+sig);assert.equal(r.status,200);
assert.equal(calls.find(c=>c.url.includes('/v1/payments/123')).opts.headers.Authorization,'Bearer VENDOR-ACCESS-1');
const reg=calls.find(c=>c.url.includes('fitness_register_payment'));assert.equal(reg.opts.headers.apikey,'sb_secret_test');
assert.deepEqual(JSON.parse(reg.opts.body),{pay_ref:'ref-aaaaaaaaaaaaaaaa',p_vendor_id:'v1',payment:{id:'123',status:'approved',statusDetail:'accredited',amount:13000,currency:'ARS',approvedAt:null,marketplaceFee:1000}});
payment={...payment,collector_id:999};calls=[];await notice('ts='+ts+',v1='+sig);assert(!calls.some(c=>c.url.includes('fitness_register_payment')),'pago de otra cuenta se ignora');

// 4) La llave del proveedor se renueva sola antes de vencer.
accounts.v1.expires_at=new Date(Date.now()+5*24*3600e3).toISOString();
tokenReply=b=>{assert.equal(b.grant_type,'refresh_token');assert.equal(b.refresh_token,'VENDOR-REFRESH-1');return {access_token:'VENDOR-ACCESS-2',refresh_token:'VENDOR-REFRESH-2',user_id:555,expires_in:15552000};};
calls=[];r=await post('/api/pagos/preferencia',{payRef:'ref-aaaaaaaaaaaaaaaa',returnUrl:pages+'/x'},{Authorization:'Bearer u'});assert.equal(r.status,200);
assert.equal(calls.find(c=>c.url.includes('/checkout/preferences')).opts.headers.Authorization,'Bearer VENDOR-ACCESS-2');
assert(Date.parse(accounts.v1.expires_at)>Date.now()+100*24*3600e3);

// 5) Desconectar.
snapshot={_identity:{id:'u-ab',role:'vendor',vendorId:'v1'},vendors:[],orders:[]};
assert.equal((await post('/api/pagos/desconectar',{},{Authorization:'Bearer vendor'})).status,200);assert(!accounts.v1);

// Las claves secretas no figuran en el código publicado.
for(const f of ['worker/index.js','wrangler.jsonc','nicolas.html','admin.html','proveedores.html'])assert(!/APP_USR-|TEST-\d|sb_secret_[A-Za-z0-9]|service_role"\s*:/.test(fs.readFileSync(new URL('../'+f,import.meta.url),'utf8')),f+' sin claves');
console.log('OK: Mercado Pago marketplace: conexión del proveedor (cifrada), cobro con su cuenta y 10% de comisión automática, aviso firmado, renovación de llave y desconexión; sin claves en el código.');

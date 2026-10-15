import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM,VirtualConsole} from 'jsdom';

// Comprar como invitado: sesión anónima de Supabase (POST /auth/v1/signup con {}) y después la reserva con ese usuario.
// Si el proyecto no tiene habilitado el ingreso anónimo, se avisa en el checkout y se ofrece crear la cuenta, sin ir y volver al ingreso.
const raw=fs.readFileSync('nicolas.html','utf8'),end=raw.lastIndexOf('})();');
const source=raw.slice(0,end).replace(/var FITNESS_CONFIG=\{[^;]+;/,"var FITNESS_CONFIG={url:'https://fixture.supabase.co',key:'sb_publishable_fixture'};")+'Object.assign(window,{ui});'+raw.slice(end);
const base={commission:10,nextId:100,nextOrder:1,offers:[{id:'o1',vendorId:'v2',status:'published',stock:'stock',model:'Soga de saltar',category:'Accesorios',size:'Única',unit:'Unidad',price:5000,units:20,minQty:1,shipAmba:2500,shipInt:5000,lead:3,warranty:6}],vendors:[{id:'v2',name:'Proveedor Uno',status:'active'}],orders:[],buyers:[],users:[],catalog:[],ad:{on:false,items:[]},contact:{wa:''},clicks:{p:{},v:{},a:{}},traffic:{days:{},q:{},z:{}},images:{},log:[],notifs:[],invoiced:{},prefs:{},_revision:1,_identity:null};
const wait=(ms=100)=>new Promise(r=>setTimeout(r,ms));

function shop(anonymousEnabled){
 const calls=[],errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 let reserved=false;
 const snapFor=auth=>{const s=structuredClone(base);if(auth==='Bearer anon-jwt'){s._identity={id:'g1',role:'buyer',vendorId:null,email:null};if(reserved)s.orders=[{id:7,buyerId:'g1',vendorId:'v2',desc:'Accesorios: Soga de saltar, Única',qty:2,subtotal:10000,shipping:2500,status:'pending_payment',ship:{email:'compras@club.test'},date:'2026-10-15'}];}return s;};
 const dom=new JSDOM(source,{url:'https://fitness.test/nicolas.html#carrito',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){
  w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.localStorage.setItem('cf-cart',JSON.stringify([{id:'o1',qty:2,price:5000}]));
  w.fetch=async(url,opts={})=>{url=String(url);const h=opts.headers||{};calls.push({url,method:opts.method,body:opts.body,apikey:h.apikey,auth:h.Authorization});
   if(url.endsWith('/auth/v1/signup'))return anonymousEnabled?{ok:true,json:async()=>({access_token:'anon-jwt',refresh_token:'r1',expires_at:Date.now()/1000+3600,user:{id:'g1',is_anonymous:true}})}:{ok:false,status:422,json:async()=>({code:'anonymous_provider_disabled',msg:'Anonymous sign-ins are disabled'})};
   if(url.includes('fitness_public_catalog'))return {ok:true,json:async()=>[]};
   return {ok:true,json:async()=>snapFor(h.Authorization)};};
  class XHR{open(m,u){this.u=u;this.h={}}setRequestHeader(k,v){this.h[k]=v}send(body){calls.push({url:this.u,sync:true,body,auth:this.h.Authorization});this.status=200;
   if(this.u.includes('fitness_reserve')){reserved=true;this.responseText=JSON.stringify([{id:7}]);}else this.responseText=JSON.stringify(snapFor(this.h.Authorization));}}
  w.XMLHttpRequest=XHR;}});
 return {dom,calls,errors};
}
async function toCheckout(w){
 const d=w.document;d.querySelector('[data-act="cart-pay"]').click();
 assert.equal(w.ui.route,'checkout');
 for(const [id,v] of Object.entries({'b-name':'Club Atlético','b-email':'compras@club.test','b-phone':'1155556666','b-address':'Av. Siempre Viva 742','b-city':'CABA'}))d.getElementById(id).value=v;
 d.getElementById('checkout').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 await wait(150);
}

// 1) Ingreso anónimo habilitado: se crea la sesión y el pedido se registra con ese usuario.
let s=shop(true);await wait();let w=s.dom.window,d=w.document;
await toCheckout(w);
const signup=s.calls.filter(c=>c.url.endsWith('/auth/v1/signup'));
assert.equal(signup.length,1,'una sola sesión de invitado');
assert.equal(signup[0].body,'{}');assert.equal(signup[0].apikey,'sb_publishable_fixture');assert.equal(signup[0].method,'POST');
assert(s.calls.some(c=>c.url.includes('fitness_snapshot')&&c.auth==='Bearer anon-jwt'),'se recarga el estado con la sesión nueva');
assert.equal(w.ui.route,'checkout');assert(w.ui.pay,'sigue al pago');
d.querySelector('[data-act="cpay-ok"]').click();
const reserve=s.calls.find(c=>c.url.includes('fitness_reserve'));
assert(reserve,'reserva enviada');assert.equal(reserve.auth,'Bearer anon-jwt');
assert.equal(JSON.parse(reserve.body).items[0].id,'o1');
assert.equal(w.ui.route,'done');
assert.equal(JSON.parse(w.localStorage.getItem('cf-cart')).length,0);
assert.equal(s.errors.length,0,s.errors.join('; '));
s.dom.window.close();

// 2) Ingreso anónimo deshabilitado: aviso claro en el checkout, opción de crear la cuenta, sin bucles.
s=shop(false);await wait();w=s.dom.window;d=w.document;
await toCheckout(w);
assert.equal(w.ui.route,'checkout','se queda en el checkout');
assert(!w.ui.pay,'no abre el pago sin usuario');
const box=d.getElementById('guest-err');
assert(box&&box.textContent.includes('Creá tu cuenta'),'mensaje con alternativa');
assert(d.querySelector('[data-act="guest-register"]')&&d.querySelector('[data-act="guest-login"]'));
assert(!s.calls.some(c=>c.url.includes('fitness_reserve')));
assert.equal(d.getElementById('b-name').value,'Club Atlético','los datos cargados se conservan');
d.querySelector('[data-act="guest-register"]').click();
assert.equal(w.ui.route,'ingresar');assert.equal(w.ui.authTab,'register');
assert.equal(d.getElementById('r-email').value,'compras@club.test');
assert(!d.querySelector('[data-act="auth-guest"]'),'no vuelve a ofrecer invitado: sin ida y vuelta');
assert.equal(s.errors.length,0,s.errors.join('; '));
s.dom.window.close();
console.log('OK: compra como invitado con sesión anónima de Supabase; si no está habilitada, aviso en el checkout y alta de cuenta sin bucles.');

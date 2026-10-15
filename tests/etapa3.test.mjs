import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM,VirtualConsole} from 'jsdom';

// Presupuesto formal, direcciones reales (/producto/...) y reseñas verificadas, con los datos reales y la base simulada.
const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const snap=JSON.parse(fs.readFileSync('tests/fixtures/live-snapshot.json','utf8')),cat=fs.readFileSync('tests/fixtures/live-catalog.json','utf8');
const KIT='kit-fuerza-tonificacion-colchoneta-tobillera-3k-mancuerna-3k-4dhms',kitKey=KIT+'#[{"name":"Color","value":"Azul"},{"name":"Cantidad","value":"1"}]';
const kitOffer=snap.offers.find(o=>o.sourceKey===kitKey),soga=snap.offers.find(o=>o.sourceKey.startsWith('soga-para-saltar-mango-antideslizante-eco#'));
const raw=fs.readFileSync('nicolas.html','utf8'),end=raw.lastIndexOf('})();');
const expose='Object.assign(window,{ui,go,offer,cartGroups,quoteEncode,quoteDecode,b64u,unb64u,quoteNumber,quoteCalc,cuitOk,productBySlug,getCart:function(){return cart;},REV:function(){return REVIEWS;}});';
const source=raw.slice(0,end)+expose+raw.slice(end);
const withPaths=source.replace('</head>','<meta name="nf-routing" content="paths"></head>');
function open(path,{store={},snapshot=snap,reviews=null,src=source,calls=[]}={}){
 const S=JSON.stringify(snapshot);
 return new JSDOM(src,{url:'https://fitness.test'+(path||'/nicolas.html'),runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.print=()=>{w.printed=(w.printed||0)+1;};
  for(const [k,v] of Object.entries(store))w.localStorage.setItem(k,v);
  w.fetch=async(u,o={})=>{u=String(u);calls.push({u,body:o.body,auth:(o.headers||{}).Authorization});
   if(u.includes('fitness_public_catalog'))return {ok:true,json:async()=>JSON.parse(cat)};
   if(u.includes('fitness_reviews_public'))return reviews?{ok:true,json:async()=>reviews}:{ok:false,status:404,json:async()=>({message:'Could not find the function public.fitness_reviews_public'})};
   if(u.includes('fitness_reviews_mine'))return reviews?{ok:true,json:async()=>[]}:{ok:false,status:404,json:async()=>({})};
   if(u.includes('fitness_review_submit'))return {ok:true,json:async()=>({ok:true,id:1,status:'pending'})};
   return {ok:true,json:async()=>JSON.parse(S)};};
  class XHR{open(){}setRequestHeader(){}send(){this.status=200;this.responseText=S}}w.XMLHttpRequest=XHR;}});}
const wait=(ms=150)=>new Promise(r=>setTimeout(r,ms));
const submit=(w,f)=>f.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));

// ---------- Presupuesto desde el carrito ----------
let dom=open('/nicolas.html#carrito',{store:{'nf-cp':'1425','cf-cart':JSON.stringify([{id:kitOffer.id,qty:2,price:kitOffer.price},{id:soga.id,qty:3,price:soga.price}])}});await wait();let w=dom.window,d=w.document;
d.querySelector('[data-act="quote-open"]').click();
assert(d.getElementById('f-quote'),'formulario');assert.equal(d.getElementById('q-cp').value,'1425','toma el código postal');
d.getElementById('q-n').value='Colegio San Martín';d.getElementById('q-cuit').value='30-71234567-0';submit(w,d.getElementById('f-quote'));
assert(!d.getElementById('q-err').hidden&&d.getElementById('q-err').textContent.includes('CUIT'),'CUIT inválido');
assert(w.cuitOk('30-71234567-0')===false&&w.cuitOk('30-71234567-1')===true&&w.cuitOk('20-34800962-2')===true&&w.cuitOk('123')===false);
d.getElementById('q-cuit').value='30715862383';d.getElementById('q-e').value='compras@colegio.test';d.getElementById('q-l').value='Palermo';submit(w,d.getElementById('f-quote'));
assert.equal(w.ui.route,'presupuesto');assert.match(w.location.hash,/^#presupuesto\/[A-Za-z0-9_-]+$/);
const code=w.ui.quoteCode,q=w.quoteDecode(code);
assert.equal(q.c.n,'Colegio San Martín');assert.equal(q.c.cuit,'30-71586238-3');
assert.deepEqual(Array.from(q.l,x=>Array.from(x)),[[kitOffer.id,2,kitOffer.price],[soga.id,3,soga.price]]);
const num=w.quoteNumber(q);assert.match(num,/^NF-\d{6}-[0-9A-Z]{4}$/);
assert.equal(num,w.quoteNumber(w.quoteDecode(w.quoteEncode(q))),'mismo contenido, mismo número');
assert.notEqual(num,w.quoteNumber(Object.assign({},q,{d:'2026-01-01'})),'otra fecha, otro número');
assert.equal(num.slice(3,9),q.d.slice(2,4)+q.d.slice(5,7)+q.d.slice(8,10));
// Alteraciones: se rechazan
const json=JSON.parse(w.unb64u(code));json.l[0][2]=1;
assert.equal(w.quoteDecode(w.b64u(JSON.stringify(json))),null,'precio cambiado a mano');
assert.equal(w.quoteDecode(code.slice(0,-3)+'xyz'),null);assert.equal(w.quoteDecode('abc'),null);
// La hoja: cliente, ítems por proveedor, totales iguales al carrito
const doc=d.querySelector('.qdoc');assert(doc.textContent.includes('N° '+num)&&doc.textContent.includes('Colegio San Martín')&&doc.textContent.includes('30-71586238-3'));
assert.equal(doc.querySelectorAll('.q-items tbody tr:not(.q-vh):not(.q-srow)').length,2);
const C=w.cartGroups(w.getCart(),'1425');assert.equal(w.quoteCalc(q,false).total,C.total,'mismo total que el carrito');
assert(doc.querySelector('.q-total').textContent.includes(C.total.toLocaleString('es-AR')));
assert(doc.textContent.includes('A coordinar con el proveedor')&&doc.textContent.includes('Precios con IVA incluido')&&doc.textContent.includes('Válido hasta'));
assert(doc.textContent.includes('compra mínima $ 40.000 cumplida'));
assert(!d.querySelector('.q-banner'),'sin cambios de precio no hay aviso');
d.querySelector('[data-act="q-print"]').click();assert.equal(w.printed,1,'Descargar PDF abre la impresión');
// Cambio de precio: aviso con el total viejo y el nuevo, y actualizar
w.offer(soga.id).price=soga.price+1000;w.go('presupuesto',{quoteCode:code,quote:null});
const ban=d.querySelector('.q-banner');assert(ban,'aviso de precios');
const oldT=w.quoteCalc(q,false).total,newT=w.quoteCalc(q,true).total;assert.equal(newT-oldT,3000);
assert(ban.textContent.includes(oldT.toLocaleString('es-AR'))&&ban.textContent.includes(newT.toLocaleString('es-AR')));
d.querySelector('[data-act="q-update"]').click();
assert.notEqual(w.ui.quoteCode,code);assert.equal(w.quoteDecode(w.ui.quoteCode).l[1][2],soga.price+1000);assert(!d.querySelector('.q-banner'));
// Pasar al carrito
const cartBefore=w.getCart().find(i=>i.id===soga.id).qty;
d.querySelector('[data-act="q-cart"]').click();assert.equal(w.ui.route,'carrito');assert.equal(w.getCart().find(i=>i.id===soga.id).qty,cartBefore+3);
dom.window.close();
// El link reabre el mismo presupuesto, con el mismo número.
dom=open('/nicolas.html#presupuesto/'+code);await wait();w=dom.window;d=w.document;
assert.equal(w.ui.route,'presupuesto');assert(d.querySelector('.qdoc').textContent.includes('N° '+num));
dom.window.close();
dom=open('/nicolas.html#presupuesto/'+code.slice(0,-4)+'AAAA');await wait();d=dom.window.document;
assert(d.querySelector('main').textContent.includes('No pudimos abrir este presupuesto'));dom.window.close();

// ---------- Direcciones reales cuando sirve el Worker ----------
dom=open('/producto/'+KIT,{src:withPaths});await wait();w=dom.window;d=w.document;
assert.equal(w.ui.route,'producto');assert.equal(w.ui.pslug,KIT);assert.equal(w.location.pathname,'/producto/'+KIT);
assert(d.querySelector('.nf-card').getAttribute('href').startsWith('/producto/'),'enlaces con dirección real');
d.querySelector('.nf-related .nf-card').click();assert(w.location.pathname.startsWith('/producto/')&&w.location.pathname!=='/producto/'+KIT);
d.querySelector('.nf-crumbs [data-act="cat-tile"]').click();assert.match(w.location.pathname,/^\/categoria\/[a-z-]+$/);
dom.window.close();
dom=open('/#producto/'+KIT,{src:withPaths});await wait();w=dom.window;
assert.equal(w.location.pathname,'/producto/'+KIT,'los links viejos con # pasan a la dirección real');assert.equal(w.location.hash,'');dom.window.close();
dom=open('/categoria/natacion',{src:withPaths});await wait();w=dom.window;assert.equal(w.ui.route,'home');assert.equal(w.ui.ccat,'Natación');dom.window.close();
dom=open('/arma',{src:withPaths});await wait();w=dom.window;assert.equal(w.ui.route,'arma');assert.equal(w.document.title.startsWith('Armá tu espacio'),true);dom.window.close();
dom=open('/?q=soga',{src:withPaths});await wait();w=dom.window;assert.equal(w.ui.cq,'soga');assert.equal(w.document.getElementById('cat-q').value,'soga');dom.window.close();
// Sin Worker (archivo o GitHub Pages) se siguen usando las direcciones con #
dom=open();await wait();assert(dom.window.document.querySelector('.nf-card').getAttribute('href').startsWith('#producto/'));dom.window.close();

// ---------- Reseñas: sin las funciones en la base, nada se rompe ----------
const calls0=[];dom=open('/nicolas.html#producto/'+KIT,{calls:calls0});await wait(250);w=dom.window;d=w.document;
assert(calls0.some(c=>c.u.includes('fitness_reviews_public')),'se piden');assert.equal(w.REV().state,'off');
assert(!d.getElementById('resenas')&&!d.querySelector('.nf-rate'),'sin reseñas, secciones ocultas');
dom.window.close();
// Con reseñas aprobadas
const reviews={reviews:[{id:1,slug:KIT,vendorId:'ab_fitness',name:'Club A.',rating:5,title:'Excelente',text:'Muy buena calidad, llegó rápido.',createdAt:'2026-10-10T12:00:00Z',reply:'¡Gracias!'},{id:2,slug:KIT,vendorId:'ab_fitness',name:'Comprador verificado',rating:4,title:null,text:'Cumple, la colchoneta es finita.',createdAt:'2026-10-12T12:00:00Z',reply:null}],stats:{}};
dom=open('/nicolas.html#producto/'+KIT,{reviews});await wait(250);w=dom.window;d=w.document;
const sec=d.getElementById('resenas');assert(sec,'sección de reseñas');
const items=sec.querySelectorAll('.nf-rev');assert.equal(items.length,2);assert(items[0].textContent.includes('Cumple'),'las más nuevas primero');
assert(sec.textContent.includes('Compra verificada')&&sec.textContent.includes('Respuesta de AB Fitness')&&sec.textContent.includes('¡Gracias!'));
assert(d.querySelector('.nf-rate.lg').textContent.includes('4,5')&&d.querySelector('.nf-rate.lg').textContent.includes('2 reseñas'));
assert.equal(JSON.parse(d.getElementById('nf-ld').textContent).aggregateRating.ratingValue,4.5);
w.go('home');const cq=d.getElementById('cat-q');cq.value='kit fuerza tonificacion';cq.dispatchEvent(new w.Event('input',{bubbles:true}));
assert(d.querySelector('.nf-card[data-slug="'+KIT+'"] .nf-rate'),'estrellas en la tarjeta');
dom.window.close();
// Calificar desde Mi cuenta
const buyerSnap=structuredClone(snap);buyerSnap._identity={id:'b1',role:'buyer',email:'compras@club.test'};
buyerSnap.buyers=[{id:'b1',name:'Club Norte',email:'compras@club.test',addresses:[],favs:[],logins:[]}];
buyerSnap.orders=[{id:7,buyerId:'b1',vendorId:'ab_fitness',offerId:kitOffer.id,status:'approved',desc:'Mas vendidos: Kit, Color: Azul',qty:1,subtotal:78500,shipping:0,date:'2026-10-10',payRef:'r1'},{id:8,buyerId:'b1',vendorId:'ab_fitness',offerId:soga.id,status:'pending_payment',desc:'Soga',qty:1,subtotal:5000,shipping:0,date:'2026-10-11',payRef:'r2'}];
const calls=[];dom=open('/nicolas.html',{snapshot:buyerSnap,reviews:{reviews:[],stats:{}},calls});await wait(250);w=dom.window;d=w.document;
w.go('cuenta',{accTab:'compras'});
const rates=d.querySelectorAll('[data-act="rate-open"]');assert.equal(rates.length,1,'solo la compra pagada');
rates[0].click();const f=d.getElementById('f-rate');assert(f);
submit(w,f);assert(d.getElementById('rate-err').textContent.includes('estrellas'));
d.getElementById('rate-4').checked=true;d.getElementById('rate-text').value='corta';submit(w,d.getElementById('f-rate'));assert(d.getElementById('rate-err').textContent.includes('10 caracteres'));
assert(d.getElementById('rate-4').checked,'mantiene lo elegido');
d.getElementById('rate-text').value='Muy buen kit, todo llegó bien embalado.';d.getElementById('rate-title').value='Recomendable';submit(w,d.getElementById('f-rate'));await wait(50);
const sent=calls.find(c=>c.u.includes('fitness_review_submit'));assert(sent,'se envía');
assert.deepEqual(JSON.parse(sent.body),{p_order_id:7,p_slug:KIT,p_rating:4,p_title:'Recomendable',p_text:'Muy buen kit, todo llegó bien embalado.'});
assert(d.querySelector('main').textContent.includes('Ya calificaste'));assert(!d.querySelector('[data-act="rate-open"]'));
assert.equal(errors.length,0,errors.join('; '));
dom.window.close();
console.log('OK: presupuesto (número fijo, link, alteraciones, totales del carrito, aviso de precios, PDF y carrito), direcciones /producto y /categoria, y reseñas verificadas (mostrar, calificar y ausencia sin errores).');

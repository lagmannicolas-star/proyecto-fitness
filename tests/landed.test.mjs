import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM,VirtualConsole} from 'jsdom';

// Precio final puesto en tu casa: código postal en todo el sitio, mismas cuentas que el servidor (fitness_reserve),
// progreso hacia la compra mínima y el envío gratis, sugerencias y comparación entre proveedores (con un proveedor de prueba).
const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const snap=JSON.parse(fs.readFileSync('tests/fixtures/live-snapshot.json','utf8')),cat=JSON.parse(fs.readFileSync('tests/fixtures/live-catalog.json','utf8'));
// Proveedor de prueba con envío fijo, envío gratis desde $60.000 y compra mínima de $20.000. Vende dos productos iguales a los de AB Fitness, más baratos.
const KIT='kit-fuerza-tonificacion-colchoneta-tobillera-3k-mancuerna-3k-4dhms',kitKey=KIT+'#[{"name":"Color","value":"Azul"},{"name":"Cantidad","value":"1"}]';
const SOGA='soga-para-saltar-mango-antideslizante-eco';
const abKit=cat.find(c=>c.key===kitKey),abSoga=cat.find(c=>c.key.startsWith(SOGA+'#'));
assert(abKit&&abSoga,'productos de AB en el catálogo');
snap.vendors.push({id:'v_test',name:'Proveedor Test',status:'active',type:'Distribuidor',shipMode:'fijo',freeShipping:{mode:'from',zone:'all',threshold:60000,postalCodes:[]},minOrderAmount:20000,pricesIncludeVat:true});
const mk=(id,src,price,extra)=>{const key='test-'+src.key;snap.offers.push(Object.assign({id,vendorId:'v_test',status:'published',stock:'stock',units:null,minQty:1,price,unit:'Unidad',model:src.name,size:'',category:'Pruebas',lead:3,warranty:12,shipAmba:3000,shipInt:7000,detail:'',volumeTiers:[],sourceKey:key},extra||{}));cat.push({key,name:src.name,image:src.image,price,units:null,offerId:id,category:'',vendorId:'v_test',properties:src.properties,vendorName:'Proveedor Test'});};
mk('vt_kit',abKit,70000);mk('vt_soga',abSoga,4000,{shipAmba:1500,shipInt:2500});
const S=JSON.stringify(snap),C=JSON.stringify(cat);
const raw=fs.readFileSync('nicolas.html','utf8'),end=raw.lastIndexOf('})();');
const source=raw.slice(0,end)+'Object.assign(window,{ui,go,vendorQuote,cartGroups,offer,vendor,gapSuggestions,cartSwaps,productBySlug,getCart:function(){return cart;}});'+raw.slice(end);
function open(hash,store){return new JSDOM(source,{url:'https://fitness.test/nicolas.html'+(hash||''),runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 for(const [k,v] of Object.entries(store||{}))w.localStorage.setItem(k,v);
 w.fetch=async(u)=>({ok:true,json:async()=>JSON.parse(String(u).includes('fitness_public_catalog')?C:S)});
 class XHR{open(){}setRequestHeader(){}send(){this.status=200;this.responseText=S}}w.XMLHttpRequest=XHR;}});}
const wait=(ms=120)=>new Promise(r=>setTimeout(r,ms));
const submit=(w,f)=>f.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));

// Reglas del servidor (fitness_reserve), reescritas acá para comparar: subtotal por proveedor, un envío = el mayor,
// "a coordinar" no suma, envío gratis por zona/umbral, zona AMBA = CP que empieza con 1.
function server(items,cp){
 const z=/^1\d{3}$/.test(cp)?'amba':'interior',by={};
 for(const {o,qty} of items){const v=snap.vendors.find(x=>x.id===o.vendorId),g=by[v.id]??={v,sub:0,ship:0};g.sub+=o.price*qty;g.ship=Math.max(g.ship,v.shipMode==='coordinar'?0:(z==='amba'?o.shipAmba:o.shipInt)||0);}
 let total=0;for(const g of Object.values(by)){const f=g.v.freeShipping||{};if(!(f.zone==='amba'&&!(f.postalCodes||[]).length)&&(f.zone==='all'||f.zone===z)&&(!(f.postalCodes||[]).length||f.postalCodes.includes(cp))&&(f.mode==='always'||(f.mode==='from'&&g.sub>=f.threshold)))g.ship=0;total+=g.sub+g.ship;}
 return total;
}

// ---------- Código postal en todo el sitio ----------
let dom=open();await wait();let w=dom.window,d=w.document;
assert.equal(w.ui.cp,'','no se supone ningún código postal');
assert(d.querySelector('.cpchip').textContent.includes('código postal'));
d.querySelector('.cpchip').click();
const pop=d.getElementById('cp-pop');pop.querySelector('[name="cp"]').value='12';submit(w,pop);
assert.equal(w.ui.cp,'');assert.equal(d.getElementById('cp-pop').querySelector('[name="cp"]').getAttribute('aria-invalid'),'true');
d.getElementById('cp-pop').querySelector('[name="cp"]').value='1425';submit(w,d.getElementById('cp-pop'));
assert.equal(w.ui.cp,'1425');assert.equal(w.localStorage.getItem('nf-cp'),'1425');
assert(d.querySelector('.cpchip').textContent.includes('1425')&&d.querySelector('.cpchip').textContent.includes('AMBA'));
assert(d.querySelector('.nf-card .nf-ship'),'las tarjetas muestran el precio con envío');
dom.window.close();
dom=open('',{'nf-cp':'5000'});await wait();w=dom.window;d=w.document;
assert.equal(w.ui.cp,'5000','se recuerda');assert(d.querySelector('.cpchip').textContent.includes('Interior'));
dom.window.close();

// ---------- Cuentas: iguales al carrito y al servidor ----------
dom=open('',{'nf-cp':'1425'});await wait();w=dom.window;d=w.document;
const vt=w.vendor('v_test'),ab=w.vendor('ab_fitness'),ok=w.offer('vt_kit'),os=w.offer('vt_soga'),abk=w.offer(snap.offers.find(o=>o.sourceKey===kitKey).id);
let q=w.vendorQuote(vt,[{o:os,qty:2}],'1425');assert.equal(q.ship,1500);assert.equal(q.total,9500);assert.equal(q.short,12000,'compra mínima');
q=w.vendorQuote(vt,[{o:os,qty:2}],'5000');assert.equal(q.ship,2500,'interior');
q=w.vendorQuote(vt,[{o:os,qty:5},{o:w.offer('vt_kit'),qty:1}],'1425');assert.equal(q.sub,90000);assert.equal(q.ship,0,'envío gratis desde $60.000');assert.equal(q.total,90000);
q=w.vendorQuote(vt,[{o:os,qty:5}],'1425');assert.equal(q.ship,1500);
q=w.vendorQuote(ab,[{o:abk,qty:1}],'1425');assert(q.coord&&q.ship===0,'AB Fitness: envío a coordinar');
for(const [items,cp] of [[[['vt_soga',2]],'1425'],[[['vt_soga',3],['vt_kit',1]],'5000'],[[['vt_soga',1],[abk.id,1]],'1425'],[[['vt_soga',20]],'8000'],[[['vt_kit',1]],'1000']]){
 const list=items.map(([id,qty])=>({id,qty,price:w.offer(id).price})),G=w.cartGroups(list,cp);
 assert.equal(G.total,server(items.map(([id,qty])=>({o:w.offer(id),qty})),cp),'carrito = servidor '+JSON.stringify(items)+' '+cp);
 for(const g of Array.from(G.groups)){const vq=w.vendorQuote(g.v,Array.from(g.items,x=>({o:x.o,qty:x.i.qty})),cp,g.method);assert.equal(vq.total,g.total);assert.equal(vq.ship,g.ship);}
}

// ---------- Ficha: precio final ----------
const tSlug='test-'+SOGA;
w.go('producto',{pslug:tSlug});
let L=d.querySelector('.nf-landed');assert(L.textContent.includes('$ 1.500')&&L.textContent.includes('Total puesto en tu casa'),L.textContent);
assert.equal(d.getElementById('p-landed').textContent,'$ 5.500');
d.querySelector('[data-act="p-inc"]').click();assert.equal(d.getElementById('p-landed').textContent,'$ 9.500','sigue a la cantidad');
w.go('producto',{pslug:KIT});
L=d.querySelector('.nf-landed');assert(L.textContent.includes('A coordinar con AB Fitness')&&L.textContent.includes('Total sin envío'));
// Mismo producto en dos proveedores: comparación con precio final.
const vs=d.querySelector('.nf-vs');assert(vs,'comparación entre proveedores');
const rows=Array.from(vs.querySelectorAll('.nf-vs-row'));assert.equal(rows.length,2);
assert(rows[0].textContent.includes('Proveedor Test')&&rows[0].classList.contains('best'),'el mejor precio final primero');
rows[0].querySelector('[data-act="open-variant"]').click();assert.equal(w.ui.pslug,'test-'+KIT);
// Sin CP se pide en la ficha
dom.window.close();
dom=open('#producto/'+tSlug);await wait();w=dom.window;d=w.document;
const pf=d.querySelector('form.nf-landed');assert(pf,'pide el código postal en la ficha');
pf.querySelector('[name="cp"]').value='5000';submit(w,pf);assert.equal(w.ui.cp,'5000');assert(d.querySelector('.nf-landed').textContent.includes('$ 2.500'));
dom.window.close();

// ---------- Carrito: progreso, sugerencias y cambio de proveedor ----------
const abSogaOffer=snap.offers.find(o=>o.sourceKey===abSoga.key);
dom=open('#carrito',{'nf-cp':'1425','cf-cart':JSON.stringify([{id:abSogaOffer.id,qty:1,price:abSogaOffer.price},{id:'vt_soga',qty:2,price:4000}])});await wait();w=dom.window;d=w.document;
const groups=Array.from(d.querySelectorAll('.cgroup'));
const abG=groups.find(g=>g.textContent.includes('AB Fitness')),tG=groups.find(g=>g.textContent.includes('Proveedor Test'));
assert(abG.querySelector('.nf-prog').textContent.includes('Te faltan $ '+(40000-abSogaOffer.price).toLocaleString('es-AR')+' para la compra mínima de AB Fitness'));
assert(tG.textContent.includes('Te faltan $ 12.000 para la compra mínima'),'mínimo del proveedor de prueba');
assert(tG.textContent.includes('Te faltan $ 52.000 para el envío gratis'),'progreso hacia el envío gratis');
const sugs=Array.from(abG.querySelectorAll('[data-act="sug-add"]'));assert(sugs.length>=3&&sugs.length<=4,'3 a 4 sugerencias');
const gab=w.cartGroups().groups.find(g=>g.v.id==='ab_fitness'),sg=Array.from(w.gapSuggestions(gab,gab.short,4));
assert(sg.every(c=>c.p.vendorId==='ab_fitness'&&c.v.available&&!w.getCart().some(i=>i.id===c.v.offer.id)));
assert(sg.some(c=>Math.abs(c.v.price-gab.short)/gab.short<0.25),'al menos una cierra la diferencia');
assert(d.querySelector('[data-act="cart-pay"]').disabled);
const before=w.getCart().length;sugs[0].click();assert.equal(w.getCart().length,before+1,'agregar con un toque');
// Cambio de proveedor cuando baja el total.
dom.window.close();
const abKitOffer=snap.offers.find(o=>o.sourceKey===kitKey);
dom=open('#carrito',{'nf-cp':'1425','cf-cart':JSON.stringify([{id:abKitOffer.id,qty:1,price:abKitOffer.price}])});await wait();w=dom.window;d=w.document;
const sw=Array.from(w.cartSwaps());assert.equal(sw.length,1);assert.equal(sw[0].to.id,'vt_kit');assert.equal(sw[0].save,abKitOffer.price-70000);
assert(d.querySelector('.nf-swap').textContent.includes('Proveedor Test'));
d.querySelector('[data-act="swap"]').click();
assert.deepEqual(Array.from(w.getCart(),i=>i.id),['vt_kit']);
assert.equal(errors.length,0,errors.join('; '));
dom.window.close();
// Solo un proveedor (datos reales): no aparece la comparación.
console.log('OK: precio final con código postal: cuentas iguales al carrito y al servidor (envío fijo, gratis desde un monto, a coordinar), progreso de mínimos y envío gratis, sugerencias y comparación entre proveedores.');

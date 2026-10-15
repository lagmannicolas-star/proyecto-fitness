import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM,VirtualConsole} from 'jsdom';

// Carritos guardados con la versión anterior del catálogo (ítems "ab-catalog"): se pasan solos a la oferta publicada
// cuando existe y, si no, quedan aparte como "No disponibles", sin sumarse al pago.
const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const slug='mancuerna-hexagonal-cromada-de-goma-unidad-x-peso',kit='kit-fuerza-total-mancuernas-3-kg-rusa-4-kg-tobilleras-2-kg-colchoneta-150-1ih1t';
const legacy=(i,size,qty,price)=>({kind:'ab-catalog',id:'ab:'+slug+':'+i,sourceSlug:slug,variantIndex:i,vendorName:'AB Fitness',model:'Mancuerna hexagonal cromada de goma - Unidad x peso',category:'Mancuernas',size,price,qty});
const saved=JSON.stringify([{id:'existing',qty:1,price:100},legacy(0,'PESO: 1 KG',6,13000),legacy(2,'PESO: 3 KG',1,null),{kind:'ab-catalog',id:'ab:'+kit+':0',sourceSlug:kit,variantIndex:0,model:'Kit',category:'Combos y kits',size:'Presentación única',price:65000,qty:2}]);
const base={commission:10,nextId:100,nextOrder:1,offers:[],vendors:[],orders:[],buyers:[],users:[],catalog:[],ad:{on:false,items:[]},contact:{wa:''},clicks:{p:{},v:{},a:{}},traffic:{days:{},q:{},z:{}},images:{},log:[],notifs:[],invoiced:{},prefs:{},_revision:1,_identity:null};
const raw=fs.readFileSync('nicolas.html','utf8'),end=raw.lastIndexOf('})();'),source=raw.slice(0,end)+'Object.assign(window,{cartGroups,go,getCart:function(){return cart;}});'+raw.slice(end);
function buyer(cartJson,snap,catalog){return new JSDOM(source,{url:'https://fitness.test/nicolas.html#carrito',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.localStorage.setItem('cf-cart',cartJson);w.localStorage.setItem('nf-cp','1425');w.fetch=async(u)=>({ok:true,json:async()=>structuredClone(String(u).includes('fitness_public_catalog')?(catalog||[]):snap)});class XHR{open(){}setRequestHeader(){}send(){this.status=200;this.responseText=JSON.stringify(snap)}}w.XMLHttpRequest=XHR;}})}
const wait=()=>new Promise(r=>setTimeout(r,100));
const stored=w=>JSON.parse(w.localStorage.getItem('cf-cart'));

// 1) Sin ofertas publicadas: los guardados quedan aparte, sin precio de "referencia" ni compra "pendiente".
let buy=buyer(saved,base);await wait();let b=buy.window.document;
const box=b.querySelector('[aria-label="Productos guardados no disponibles"]');
assert(box,'sección de no disponibles');
assert.equal(b.querySelectorAll('h1').length,1);
assert(box.textContent.includes('Peso: 1 kg'),'variante con texto prolijo');
assert(!/referencia|pendiente de activar|precio del archivo/i.test(b.querySelector('main').textContent));
assert.equal(buy.window.cartGroups().groups.length,1,'la oferta vieja se conserva como no disponible');
assert(b.querySelector('[data-act="cart-pay"]').disabled,'no se puede pagar lo que no está disponible');
b.querySelector('[data-act="cart-del"][data-id="ab:'+slug+':0"]').click();
assert.equal(stored(buy.window).length,3);
b.querySelector('[data-act="cart-clear"]').click();b.querySelector('[data-act="cart-clear"]').click();
assert.equal(stored(buy.window).length,0);
buy.window.close();

// 2) Otro proveedor con la oferta activa: se puede pagar y el formulario no mezcla los guardados.
const active=structuredClone(base);
active.vendors=[{id:'v2',name:'Segundo proveedor',status:'active'}];
active.offers=[{id:'existing',vendorId:'v2',status:'published',stock:'ok',model:'Producto activo',category:'Mancuernas',size:'1 kg',unit:'Unidad',price:100,units:20,minQty:1,shipAmba:25,shipInt:50,lead:2,volume:[]}];
buy=buyer(saved,active);await wait();b=buy.window.document;
assert.equal(buy.window.cartGroups().groups.length,1);
assert.equal(buy.window.cartGroups().groups[0].items[0].o.id,'existing');
assert(!b.querySelector('[data-act="cart-pay"]').disabled);
buy.window.go('checkout',{cartMode:true});
assert(b.body.textContent.includes('Confirmá tu compra'));
assert(!b.querySelector('form#checkout').textContent.includes('AB Fitness'));
buy.window.close();

// 3) Con el catálogo real: cada guardado pasa a su oferta publicada (misma clave de importación), sumando sin duplicar.
const snap=JSON.parse(fs.readFileSync('tests/fixtures/live-snapshot.json','utf8')),cat=JSON.parse(fs.readFileSync('tests/fixtures/live-catalog.json','utf8'));
const key1=slug+'#[{"name":"PESO","value":"1 KG"}]',o1=snap.offers.find(o=>o.sourceKey===key1),ok=snap.offers.find(o=>o.sourceKey===kit+'#[]');
assert(o1&&ok);
buy=buyer(saved,snap,cat);await wait();b=buy.window.document;
const c=buy.window.getCart();
assert(c.some(i=>i.id===o1.id&&i.qty===Math.min(6,o1.units==null?6:o1.units)),'PESO: 1 KG → oferta publicada');
assert(c.some(i=>i.id===ok.id),'Presentación única → oferta sin propiedades');
assert(c.some(i=>i.id==='ab:'+slug+':2'),'sin oferta publicada queda como guardado');
assert(!/referencia|pendiente de activar/i.test(b.querySelector('main').textContent));
assert.equal(errors.length,0,errors.join('; '));
buy.window.close();
console.log('OK: carritos guardados antes: pasan a la oferta publicada, los no disponibles quedan aparte, quitar/vaciar y exclusión del pago.');

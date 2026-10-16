import {JSDOM,VirtualConsole} from 'jsdom';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const fixture={commission:10,nextId:100,nextOrder:1,offers:[],vendors:[],orders:[],buyers:[],users:[],catalog:[],ad:{on:false,items:[]},contact:{wa:'5491100000000'},clicks:{p:{},v:{},a:{}},traffic:{days:{},q:{},z:{}},images:{},log:[],notifs:[],invoiced:{},prefs:{},_revision:1,_identity:null};
const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const raw=fs.readFileSync('nicolas.html','utf8');const end=raw.lastIndexOf('})();');const source=raw.slice(0,end)+'Object.assign(window,{spaces,go,ui,CATALOG,liftKg});'+raw.slice(end);
const dom=new JSDOM(source,{url:'https://fitness.test/nicolas.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.fetch=async()=>({ok:true,json:async()=>structuredClone(fixture)});class XHR{open(){}setRequestHeader(){}send(){this.status=200;this.responseText=JSON.stringify(fixture);}}w.XMLHttpRequest=XHR;}});
await new Promise(r=>setTimeout(r,100));const w=dom.window,d=w.document;
assert.equal(d.querySelector('.brand img').getAttribute('src'),'assets/nexofit-logo.png');
assert.equal(d.querySelectorAll('.space-card').length,w.spaces().length+1,'spaces plus Casa');
assert(d.querySelector('.hero [data-act="arma-start"]'),'hero opens the space builder');
assert(d.querySelector('.nf-arma-band [data-act="arma-start"]'),'builder band on the home');
assert(d.querySelector('.hero h1').textContent.includes('Un solo carrito'));
assert(d.querySelector('.hero [data-act="to-catalog"]'),'primary CTA to the catalog');
assert(d.querySelector('.hero [data-go="buscar"]'),'secondary CTA to the comparison');
assert(!d.body.textContent.includes('Empresa 1'),'no fake demo companies');
assert(d.getElementById('catalogo'),'one catalog section');
assert(!d.getElementById('ab-productos')&&!d.getElementById('productos-proveedores'),'old catalog sections removed');
assert(!/Administrador|Actualizar datos/.test(d.querySelector('footer').textContent),'no admin links in the footer');
assert(d.querySelector('#hsearch #hq'),'header search');
assert(d.querySelector('details #bb'),'bar calculator remains available');
// El comparador nuevo (etapa 4) arma categoría → modelo → medida con la capa de productos; sin catálogo publicado muestra un estado vacío claro.
w.go('buscar');
assert(d.querySelector('.nf-cmp .cmp-steps'),'comparador por pasos');
assert(d.querySelector('.nf-cmp .nf-empty'),'sin productos: estado vacío');
assert(!d.querySelector('.cat-card')&&!d.querySelector('.vchip'),'el comparador viejo ya no se muestra');
assert(!source.includes('var CAT_ART='),'generated illustrations removed');
assert(!d.querySelector('.mv'),'mission/vision removed from main flow');
const catalog=JSON.stringify(w.CATALOG);
let variants=0;
for(const route of ['cat','compare']){w.go(route);assert.equal(w.ui.route,'buscar','la ruta vieja '+route+' abre el comparador');assert(d.querySelector('.nf-cmp'));variants++;}
w.go('home');const start=w.liftKg();d.querySelector('[data-act="plate"]').click();assert(w.liftKg()>start);d.querySelector('[data-act="plate-clear"]').click();assert.equal(w.liftKg(),20);
for(const route of ['buscar','carrito','ingresar','pedido','home']){w.go(route);assert.equal(w.ui.route,route);assert(d.querySelector('main').textContent.trim().length>10);}
assert.equal(JSON.stringify(w.CATALOG),catalog,'catalog unchanged by navigation');
for(const file of ['nicolas.html','admin.html','proveedores.html']){
 const text=fs.readFileSync(file,'utf8');const colors=[...text.matchAll(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi)].map(m=>m[0].toUpperCase());
 assert(colors.every(c=>['#FDFAF5','#10171F','#A5CC21'].includes(c)),file+' uses only brand color literals');
 assert.equal((text.match(/var LOGO=/g)||[]).length,1);
}
assert.equal(errors.length,0,errors.join(';'));
console.log('OK: all '+w.spaces().length+' spaces, comparator steps and '+variants+' legacy routes, calculator, cart, account and order lookup; brand palette only.');dom.window.close();

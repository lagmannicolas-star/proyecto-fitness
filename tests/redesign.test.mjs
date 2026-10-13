import {JSDOM,VirtualConsole} from 'jsdom';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const fixture={commission:10,nextId:100,nextOrder:1,offers:[],vendors:[],orders:[],buyers:[],users:[],catalog:[],ad:{on:false,items:[]},contact:{wa:'5491100000000'},clicks:{p:{},v:{},a:{}},traffic:{days:{},q:{},z:{}},images:{},log:[],notifs:[],invoiced:{},prefs:{},_revision:1,_identity:null};
const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const raw=fs.readFileSync('nicolas.html','utf8');const end=raw.lastIndexOf('})();');const source=raw.slice(0,end)+'Object.assign(window,{spaces,go,ui,CATALOG,liftKg});'+raw.slice(end);
const dom=new JSDOM(source,{url:'https://fitness.test/nicolas.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.fetch=async()=>({ok:true,json:async()=>structuredClone(fixture)});class XHR{open(){}setRequestHeader(){}send(){this.status=200;this.responseText=JSON.stringify(fixture);}}w.XMLHttpRequest=XHR;}});
await new Promise(r=>setTimeout(r,100));const w=dom.window,d=w.document;
assert.equal(d.querySelector('.brand img').getAttribute('src'),'assets/nexofit-logo.png');
assert.equal(d.querySelectorAll('.space-card').length,w.spaces().length);
assert.equal(d.querySelectorAll('.cat-card').length,w.CATALOG.length);
assert.equal(d.querySelectorAll('.space-card img,.space-card svg,.cat-card svg').length,0);
assert.equal(d.querySelectorAll('.cat-card img').length,w.CATALOG.length);
for(const img of d.querySelectorAll('.cat-card img'))assert(fs.existsSync(img.getAttribute('src')),'category photo exists');
assert(d.querySelector('.hero-demo').textContent.includes('3 empresas'));
assert(!source.includes('var CAT_ART='),'generated illustrations removed');
assert(!d.querySelector('.mv'),'mission/vision removed from main flow');
assert(d.querySelector('details #bb'),'bar calculator remains available');
const catalog=JSON.stringify(w.CATALOG);
for(const space of w.spaces()){
 w.go('home');d.querySelector('[data-space="'+space.n+'"]').click();
 assert.equal(w.ui.route,'buscar');assert.equal(w.ui.space,space.n);
 assert.equal(d.querySelector('[data-space="'+space.n+'"]').getAttribute('aria-pressed'),'true');
 assert.equal(d.querySelectorAll('.cat-card').length,w.CATALOG.filter(c=>space.cats.includes(c.n)).length);
 d.querySelector('[data-act="space-clear"]').click();
 assert.equal(d.querySelectorAll('.cat-card').length,w.CATALOG.length);
 assert.equal(d.querySelectorAll('.space-card[aria-pressed="true"]').length,0);
}
let variants=0;
for(const c of w.CATALOG){
 w.go('buscar');d.querySelector('[data-cat="'+c.n+'"]').click();assert.equal(w.ui.route,'cat');assert.equal(w.ui.cat,c.n);
 assert.equal(d.querySelectorAll('.vchip[data-act="variant"]').length,c.m.reduce((n,m)=>n+m[1].length,0));
 assert(d.querySelector('details'),'comparison instructions retained');
 d.querySelector('.vchip[data-act="variant"]').click();assert.equal(w.ui.route,'compare');
 assert.equal(w.ui.model,c.m[0][0]);assert.equal(w.ui.size,c.m[0][1][0]);variants++;
}
w.go('home');const start=w.liftKg();d.querySelector('[data-act="plate"]').click();assert(w.liftKg()>start);d.querySelector('[data-act="plate-clear"]').click();assert.equal(w.liftKg(),20);
for(const route of ['buscar','carrito','ingresar','pedido','home']){w.go(route);assert.equal(w.ui.route,route);assert(d.querySelector('main').textContent.trim().length>10);}
assert.equal(JSON.stringify(w.CATALOG),catalog,'catalog unchanged by navigation');
for(const file of ['nicolas.html','admin.html','proveedores.html']){
 const text=fs.readFileSync(file,'utf8');const colors=[...text.matchAll(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi)].map(m=>m[0].toUpperCase());
 assert(colors.every(c=>['#FDFAF5','#10171F','#A5CC21'].includes(c)),file+' uses only brand color literals');
 assert.equal((text.match(/var LOGO=/g)||[]).length,1);
}
assert.equal(errors.length,0,errors.join(';'));
console.log('OK: all '+w.spaces().length+' spaces, '+variants+' categories, variant routes, clear selections, calculator, cart, account and order lookup; brand palette only.');dom.window.close();

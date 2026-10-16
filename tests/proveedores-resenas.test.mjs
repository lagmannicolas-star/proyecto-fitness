import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM,VirtualConsole} from 'jsdom';

// Respuestas del proveedor a las reseñas publicadas de sus productos (fitness_review_reply), y aviso si la migración no está aplicada.
const base={commission:10,nextId:100,nextOrder:1,offers:[{id:'o1',vendorId:'v1',sourceKey:'pesa-rusa#[]',model:'Pesa rusa 8 kg',category:'Pesas',size:'Única',unit:'Unidad',price:20000,status:'published',stock:'stock',units:5,minQty:1,lead:5,warranty:6}],vendors:[],orders:[],buyers:[],users:[],catalog:[],ad:{on:false,items:[]},contact:{wa:''},clicks:{p:{},v:{},a:{}},traffic:{days:{},q:{},z:{}},images:{},log:[],notifs:[],invoiced:{},prefs:{},_revision:1,_identity:null};
async function panel(reviews){
 const errors=[],calls=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 let current=structuredClone(base),list=reviews?structuredClone(reviews):null;
 const src=fs.readFileSync('proveedores.html','utf8').replace(/var FITNESS_CONFIG=\{[^;]+;/,"var FITNESS_CONFIG={url:'https://fixture.supabase.co',key:'sb_publishable_fixture'};");
 const dom=new JSDOM(src,{url:'https://fitness.test/proveedores.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.alert=t=>errors.push(t);
  w.fetch=async(url,opts={})=>{url=String(url);calls.push({url,body:opts.body});
   if(url.includes('/token?')){current={...structuredClone(base),_identity:{id:'a',role:'vendor',vendorId:'v1',email:'a@example.test'},vendors:[{id:'v1',name:'Proveedor prueba',status:'active',mp:false,user:'a@example.test',logins:[],act:[],notifs:[],views:[]}]};return {ok:true,json:async()=>({access_token:'jwt',refresh_token:'r',expires_at:Date.now()/1000+3600})};}
   if(url.includes('fitness_reviews_public'))return list?{ok:true,json:async()=>({reviews:structuredClone(list),stats:{}})}:{ok:false,status:404,json:async()=>({message:'Could not find the function public.fitness_reviews_public without parameters'})};
   if(url.includes('fitness_review_reply')){const b=JSON.parse(opts.body);if(b.p_reply.length<2)return {ok:false,status:400,json:async()=>({message:'La respuesta debe tener entre 2 y 1000 caracteres'})};list.find(r=>r.id===b.p_id).reply=b.p_reply;return {ok:true,json:async()=>({ok:true})};}
   return {ok:true,json:async()=>structuredClone(current)};};
  class XHR{open(m,u){this.u=u}setRequestHeader(){}send(){this.status=200;this.responseText=JSON.stringify(current)}}w.XMLHttpRequest=XHR;}});
 await new Promise(r=>setTimeout(r,120));
 const d=dom.window.document,login=d.querySelector('[data-go="login"]');if(login)login.click();
 d.getElementById('l-user').value='a@example.test';d.getElementById('l-pass').value='password123';
 d.getElementById('l-user').form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await new Promise(r=>setTimeout(r,120));
 d.querySelector('[data-act="tab"][data-tab="resenas"]').click();
 await new Promise(r=>setTimeout(r,80));
 return {dom,d,calls,errors};
}
const R=[{id:1,slug:'pesa-rusa',vendorId:'v1',name:'Club A.',rating:5,title:'Excelente',text:'Muy buena terminación, llegó rápido.',createdAt:'2026-10-15T10:00:00Z',reply:null},
 {id:2,slug:'pesa-rusa',vendorId:'v1',name:'Laura G.',rating:4,title:null,text:'Buena, el agarre podría ser más grueso.',createdAt:'2026-10-14T10:00:00Z',reply:'¡Gracias por tu compra!',replyAt:'2026-10-15T10:00:00Z'},
 {id:3,slug:'otra',vendorId:'v2',name:'Otro',rating:1,title:null,text:'De otra empresa, no se muestra.',createdAt:'2026-10-14T10:00:00Z'}];
let p=await panel(R),d=p.d,w=p.dom.window;
const app=d.getElementById('app');
assert(app.textContent.includes('Reseñas de tus productos'));assert.equal(d.querySelectorAll('.vr-item').length,2,'solo las de mi empresa');
assert(!app.textContent.includes('De otra empresa'));assert(app.textContent.includes('4,5 de 5 · 2 reseñas'));assert(app.textContent.includes('Pesa rusa 8 kg'),'nombre del producto');
assert(d.querySelector('.vr-reply').textContent.includes('¡Gracias por tu compra!'));
d.querySelector('[data-act="vr-filter"][data-f="sin"]').click();assert.equal(d.querySelectorAll('.vr-item').length,1);
d.querySelector('[data-act="vr-open"][data-id="1"]').click();
const ta=d.getElementById('vr-text-1');assert(ta);assert.equal(d.activeElement,ta,'el foco va a la respuesta');
ta.value='x';ta.form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert(!d.getElementById('vr-err-1').hidden,'valida el largo');
ta.value='¡Gracias, Club A.! Nos alegra que haya llegado bien.';ta.form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
await new Promise(r=>setTimeout(r,60));
assert.deepEqual(JSON.parse(p.calls.find(c=>c.url.includes('fitness_review_reply')).body),{p_id:1,p_reply:'¡Gracias, Club A.! Nos alegra que haya llegado bien.'});
assert(p.calls.find(c=>c.url.includes('fitness_review_reply')),'usa la función de la migración');
d.querySelector('[data-act="vr-filter"][data-f="con"]').click();assert.equal(d.querySelectorAll('.vr-reply').length,2);
assert.equal(p.errors.length,0,p.errors.join('; '));p.dom.window.close();
// Sin la migración: aviso claro, sin errores.
p=await panel(null);
assert(p.d.getElementById('app').textContent.includes('Las reseñas se activan cuando se aplique la migración'));
assert.equal(p.errors.length,0,p.errors.join('; '));p.dom.window.close();
assert(!fs.readFileSync('proveedores.html','utf8').includes('lagmannicolas@gmail.com'),'sin email personal');
console.log('OK: proveedores: reseñas publicadas de sus productos, filtros, responder y editar con validación, y aviso si la migración no está aplicada.');

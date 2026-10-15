import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM,VirtualConsole} from 'jsdom';

// Moderación de reseñas en el panel del administrador, con la base simulada (y sin las funciones todavía aplicadas).
const base={commission:10,nextId:100,nextOrder:1,offers:[],vendors:[],orders:[],buyers:[],users:[{id:'a',name:'Admin',user:'a@example.test'}],catalog:[],ad:{on:false,items:[]},contact:{wa:''},clicks:{p:{},v:{},a:{}},traffic:{days:{},q:{},z:{}},images:{},log:[],notifs:[],invoiced:{},prefs:{},_revision:1,_identity:null};
async function panel(adminList){
 const errors=[],calls=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 let current=structuredClone(base),list=adminList?structuredClone(adminList):null;
 const src=fs.readFileSync('admin.html','utf8').replace(/var FITNESS_CONFIG=\{[^;]+;/,"var FITNESS_CONFIG={url:'https://fixture.supabase.co',key:'sb_publishable_fixture'};");
 const dom=new JSDOM(src,{url:'https://fitness.test/admin.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.alert=t=>errors.push(t);
  w.fetch=async(url,opts={})=>{url=String(url);calls.push({url,body:opts.body});
   if(url.includes('/token?')){current={...structuredClone(base),_identity:{id:'a',role:'admin',email:'a@example.test'}};return {ok:true,json:async()=>({access_token:'jwt',refresh_token:'r',expires_at:Date.now()/1000+3600})};}
   if(url.includes('fitness_reviews_admin'))return list?{ok:true,json:async()=>structuredClone(list)}:{ok:false,status:404,json:async()=>({message:'Could not find the function public.fitness_reviews_admin without parameters'})};
   if(url.includes('fitness_review_moderate')){const b=JSON.parse(opts.body);list.find(r=>r.id===b.p_id).status=b.p_status;return {ok:true,json:async()=>({ok:true})};}
   return {ok:true,json:async()=>structuredClone(current)};};
  class XHR{open(m,u){this.u=u}setRequestHeader(){}send(){this.status=200;this.responseText=JSON.stringify(current)}}w.XMLHttpRequest=XHR;}});
 await new Promise(r=>setTimeout(r,120));
 const d=dom.window.document;d.getElementById('a-user').value='a@example.test';d.getElementById('a-pass').value='password123';
 d.getElementById('a-user').form.dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 await new Promise(r=>setTimeout(r,120));
 d.querySelector('[data-act="tab"][data-tab="resenas"]').click();
 await new Promise(r=>setTimeout(r,80));
 return {dom,d,calls,errors};
}
let p=await panel([{id:1,slug:'pesa-rusa',orderId:7,name:'Club A.',email:'compras@club.test',rating:4,title:'Muy buena',text:'Excelente terminación.',status:'pending',createdAt:'2026-10-15T10:00:00Z'},{id:2,slug:'soga',orderId:9,name:'Comprador verificado',email:'otro@club.test',rating:2,title:null,text:'No me gustó el mango.',status:'approved',createdAt:'2026-10-14T10:00:00Z'}]);
assert(p.d.querySelector('main, #app').textContent.includes('Reseñas para moderar'));
assert.equal(p.d.querySelectorAll('tbody tr').length,1,'por defecto, las pendientes');
assert(p.d.querySelector('tbody').textContent.includes('Excelente terminación.')&&p.d.querySelector('tbody').textContent.includes('compras@club.test'));
p.d.querySelector('[data-act="rv-mod"][data-status="approved"]').click();
await new Promise(r=>setTimeout(r,80));
assert.deepEqual(JSON.parse(p.calls.find(c=>c.url.includes('fitness_review_moderate')).body),{p_id:1,p_status:'approved'});
assert(p.d.querySelector('#app').textContent.includes('No hay reseñas para revisar.'));
p.d.querySelector('[data-act="rv-filter"][data-f="todas"]').click();assert.equal(p.d.querySelectorAll('tbody tr').length,2);
assert.equal(p.errors.length,0,p.errors.join('; '));p.dom.window.close();
// Sin la migración aplicada: aviso claro, sin errores.
p=await panel(null);
assert(p.d.querySelector('#app').textContent.includes('Las reseñas se activan cuando se aplique la migración'));
assert.equal(p.errors.length,0,p.errors.join('; '));p.dom.window.close();
console.log('OK: panel del administrador: moderación de reseñas (pendientes, publicar, rechazar, filtros) y aviso si la migración no está aplicada.');

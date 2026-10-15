import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM,VirtualConsole} from 'jsdom';

// "Armá tu espacio": plantillas contra el catálogo real, cantidades, presupuesto, enlace para compartir y carrito.
const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const snap=fs.readFileSync('tests/fixtures/live-snapshot.json','utf8'),cat=fs.readFileSync('tests/fixtures/live-catalog.json','utf8');
const raw=fs.readFileSync('nicolas.html','utf8'),end=raw.lastIndexOf('})();');
const source=raw.slice(0,end)+'Object.assign(window,{ui,go,ARMA,armaSpace,armaRows,armaCandidates,armaQty,armaGenerate,armaTotal,armaLineTotal,armaRowByKey,armaShareCode,armaFromCode,armaState,offer,isLive,productOfOffer,getCart:function(){return cart;}});'+raw.slice(end);
function open(hash,store){return new JSDOM(source,{url:'https://fitness.test/nicolas.html'+(hash||''),runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
 for(const [k,v] of Object.entries(store||{}))w.localStorage.setItem(k,v);
 w.fetch=async(u)=>({ok:true,json:async()=>JSON.parse(String(u).includes('fitness_public_catalog')?cat:snap)});
 class XHR{open(){}setRequestHeader(){}send(){this.status=200;this.responseText=snap}}w.XMLHttpRequest=XHR;}});}
const wait=(ms=120)=>new Promise(r=>setTimeout(r,ms));

let dom=open();await wait();let w=dom.window,d=w.document;

// ---------- Plantillas contra el catálogo real ----------
assert.deepEqual(Array.from(w.ARMA,s=>s.id),['casa','gym','box','pilates','club','colegio','kine']);
for(const s of w.ARMA){
 for(const r of Array.from(w.armaRows(s,[]))){
  const c=w.armaCandidates(r.slot,r.kg);
  if(r.slot.pri==='e') assert(c.length>0,'imprescindible sin producto disponible: '+s.id+' '+r.label);
  for(const x of Array.from(c)){
   assert(x.v.available&&w.isLive(x.o),'solo productos disponibles');
   assert(!r.slot.cats||r.slot.cats.includes(x.p.category),'de la categoría del renglón: '+r.label+' → '+x.p.name);
   if(r.kg!=null) assert((' '+x.p.name+' '+x.v.props.map(p=>p.value).join(' ')+' ').replace(/,/g,'.').includes(' '+r.kg+' kg'),'peso de la escalera: '+r.label+' → '+x.p.name);
  }
 }
}
// Escaleras de peso: mancuernas en varios pesos, cada una con su producto.
const gym=w.armaGenerate({space:'gym',people:'3-6',budget:'',focus:[]});
const mk=Array.from(gym.lines,l=>l.key).filter(k=>k.startsWith('manc@'));
assert.deepEqual(mk,['manc@5','manc@10','manc@15','manc@20']);
assert.equal(new Set(Array.from(gym.lines,l=>l.key)).size,gym.lines.length,'sin renglones repetidos');
assert(Array.from(gym.lines).every(l=>w.isLive(w.offer(l.o))));

// ---------- Cantidades ----------
assert.equal(w.armaQty({q:{each:4}},12),3);assert.equal(w.armaQty({q:{each:4}},2),1);assert.equal(w.armaQty({q:{fixed:1}},30),1);assert.equal(w.armaQty({q:{each:1}},20),20);
// Pares: un producto que se vende por unidad lleva 2 unidades por par; uno que se vende "el par", 1.
for(const l of Array.from(gym.lines).filter(l=>l.key.startsWith('manc@'))){
 const p=w.productOfOffer(w.offer(l.o)),pair=/ (par|pares)( |$)/i.test(' '+p.name+' ');
 assert.equal(l.q,(pair?1:2)*Math.ceil(6/4),p.name);
}
const col=w.armaGenerate({space:'colegio',people:'13-20',budget:'',focus:[]});
const q=k=>(Array.from(col.lines).find(l=>l.key===k)||{}).q;
assert.equal(q('conos'),2,'un set de conos cada 10 chicos');assert.equal(q('colch'),10,'una colchoneta cada 2');assert.equal(q('pelotas'),5,'una pelota cada 4');assert.equal(q('psico'),1,'cantidad fija');
const casa=w.armaGenerate({space:'casa',people:'1',budget:'',focus:[]});
assert.equal((Array.from(casa.lines).find(l=>l.key==='colch')||{}).q,1);

// ---------- Enfoques ----------
const cardio=w.armaGenerate({space:'casa',people:'2',budget:'',focus:['Cardio']}),ck=Array.from(cardio.lines,l=>l.key);
assert(ck.includes('soga')&&ck.includes('step'),'suma lo del enfoque');assert(!ck.includes('banco')&&!ck.includes('rolo'),'deja afuera lo que no es del enfoque');
assert(ck.some(k=>k.startsWith('manc@'))&&ck.includes('colch'),'los imprescindibles siempre quedan');

// ---------- Presupuesto ----------
const full=w.armaTotal(col.lines),budget=Math.round(full*0.6);
const fit=w.armaGenerate({space:'colegio',people:'13-20',budget:String(budget),focus:[]});
assert(w.armaTotal(fit.lines)<=budget,'entra en el presupuesto');
const pri=k=>w.armaRowByKey(w.armaSpace('colegio'),k).slot.pri;
const kept=Array.from(fit.lines,l=>l.key),dropped=Array.from(col.lines,l=>l.key).filter(k=>!kept.includes(k));
assert(dropped.length>0);
if(dropped.some(k=>pri(k)==='r')) assert(!kept.some(k=>pri(k)==='o'),'se quitan primero los opcionales');
assert(Array.from(col.lines).filter(l=>pri(l.key)==='e').every(l=>kept.includes(l.key)),'los imprescindibles no se quitan');
for(const l of Array.from(fit.lines)){ const r=w.armaRowByKey(w.armaSpace('colegio'),l.key),c=w.armaCandidates(r.slot,r.kg); assert.equal(l.o,c[0].o.id,'con presupuesto se elige lo más económico: '+l.key); }
const tiny=w.armaGenerate({space:'gym',people:'1-2',budget:'1000',focus:[]});
assert(Array.from(tiny.lines).every(l=>w.armaRowByKey(w.armaSpace('gym'),l.key).slot.pri==='e'),'con un presupuesto imposible quedan solo los imprescindibles');

// ---------- Recorrido completo en la página ----------
d.querySelector('.hero [data-act="arma-start"]').click();
assert.equal(w.ui.route,'arma');assert.equal(w.location.hash,'#arma');
assert.equal(d.querySelectorAll('.arma-space').length,7);
assert(d.querySelector('.arma-space img'),'tarjetas con fotos reales');
d.querySelector('[data-act="arma-space"][data-s="colegio"]').click();
assert.equal(w.ui.armaStep,2);assert.equal(w.location.hash,'#arma/paso-2');
d.getElementById('arma-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
assert(!d.getElementById('arma-err').hidden,'pide la cantidad de personas');assert.equal(w.ui.armaStep,2);
d.querySelector('input[name="arma-people"][value="13-20"]').checked=true;
const bi=d.getElementById('arma-budget');bi.value='800000';bi.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(bi.value,'800.000','presupuesto con separador de miles');
d.getElementById('arma-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
assert.equal(w.ui.armaStep,3);assert.equal(w.location.hash,'#arma/lista');
const st=w.armaState();assert.equal(st.space,'colegio');assert.equal(st.budget,'800000');
assert(w.armaTotal(st.lines)<=800000);
assert.equal(d.querySelectorAll('.arma-line').length,st.lines.length);
assert(d.querySelector('.arma-sum').textContent.includes('Presupuesto'));
assert(!/referencia|pendiente de activar/i.test(d.querySelector('main').textContent));
// Guardado en el navegador
assert.equal(JSON.parse(w.localStorage.getItem('nf-arma')).space,'colegio');
// Cantidad
const q0=st.lines[0].q;d.querySelector('[data-act="arma-inc"][data-i="0"]').click();assert.equal(w.armaState().lines[0].q,q0+1);
// Cambiar producto
d.querySelector('[data-act="arma-alt"][data-i="0"]').click();
const alt=d.querySelector('[data-act="arma-pick"][data-i="0"]');
if(alt){ const to=alt.dataset.o;alt.click();assert.equal(w.armaState().lines[0].o,to); }
// Quitar
const n0=w.armaState().lines.length;d.querySelector('[data-act="arma-del"][data-i="1"]').click();assert.equal(w.armaState().lines.length,n0-1);
// Atrás vuelve al paso 2
w.history.back();await wait(60);assert.equal(w.ui.armaStep,2);
w.go('arma',{armaStep:3});

// ---------- Compartir ----------
const lines=Array.from(w.armaState().lines,l=>[l.o,l.q,l.key]);
const code=w.armaShareCode(w.armaState());assert.match(code,/^[A-Za-z0-9_-]+$/);
const back=w.armaFromCode(code);assert.deepEqual(Array.from(back.lines,l=>[l.o,l.q,l.key]),lines);assert.equal(back.space,'colegio');
assert.equal(w.armaFromCode('no-es-valido'),null);assert.equal(w.armaFromCode(code.slice(0,-6)+'AAAAAA'),null);
const forged=btoa(JSON.stringify({v:1,s:'colegio',p:'13-20',b:0,f:[],l:[['oferta-inexistente',2,'x'],[lines[0][0],99999999,'y'],[lines[0][0],3,'z']]})).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
assert.deepEqual(Array.from(w.armaFromCode(forged).lines,l=>l.q),[3],'se descartan ofertas inexistentes y cantidades inválidas');
dom.window.close();
dom=open('#arma/'+code);await wait();w=dom.window;d=w.document;
assert.equal(w.ui.route,'arma');assert.equal(w.ui.armaStep,3);
assert.deepEqual(Array.from(w.armaState().lines,l=>[l.o,l.q,l.key]),lines,'el enlace restaura la lista');
// ---------- Agregar todo al carrito ----------
d.querySelector('.arma-sum [data-act="arma-cart"]').click();
assert.equal(w.ui.route,'carrito');
const c=w.getCart();for(const [o,qty] of lines) assert.equal((c.find(i=>i.id===o)||{}).qty,qty,'en el carrito: '+o);
assert.equal(errors.length,0,errors.join('; '));
dom.window.close();
// Persistencia: al volver, la lista sigue ahí.
dom=open('#arma/lista',{'nf-arma':JSON.stringify({space:'casa',people:'2',budget:'',focus:[],lines:[{key:'colch',o:back.lines[0].o,q:2}]})});await wait();w=dom.window;
assert.equal(w.armaState().space,'casa');assert.equal(w.ui.armaStep,3);
dom.window.close();
console.log('OK: Armá tu espacio: 7 espacios con productos reales, escaleras de peso, cantidades, enfoques, presupuesto, cambiar/quitar, compartir y agregar todo al carrito.');

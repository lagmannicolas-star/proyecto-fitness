import {JSDOM} from 'jsdom';import fs from 'node:fs';import assert from 'node:assert/strict';
const html=fs.readFileSync('oficina.html','utf8'),js=fs.readFileSync('assets/oficina.js','utf8'),sql=fs.readFileSync('supabase/migrations/20261104000000_oficina.sql','utf8');
assert.match(html,/noindex,nofollow/);assert.match(fs.readFileSync('robots.txt','utf8'),/Disallow: \/oficina/);
assert.match(fs.readFileSync('assets/sitio.js','utf8'),/oficina/,'la oficina no se mide');
assert.match(sql,/if not public\.fitness_es_admin\(\) then raise exception 'No autorizado'/,'solo administradores');
assert.match(sql,/revoke all on function public\.fitness_oficina\(\) from public, anon/);
for(const secreto of ['r.email','r.whatsapp','r.cuit,','p.email','p.telefono','token_sealed'])assert(!sql.includes(secreto),'no expone '+secreto);
const ahora='2026-11-04T01:10:00Z';
const prov=(n,mp=false)=>({id:n,nombre:'Prov '+n,tipo:'Fabricante',alta:'2026-11-02T13:00:00Z',rubros:2,comision:10,mp});
const base={red:Array.from({length:24},(_,i)=>prov(i)),pedidos:[{code:'A',status:'descartada',ofertas:0,consultados:3,alta:ahora}],instagram:{conectado:false,hoy:0},avisos:{errores_7d:0},automatismos:[{nombre:'nexofit-avisos',activo:true,estado:'succeeded'}],promo_cargadas:0,exigir_mp:false,foto:{actualizada:'2026-11-04T00:00:00Z',datos:{ventas:{seguimiento_enviados:66,seguimiento_total:264,respondieron:0},tareas:[{nombre:'X',estado:'ok'}],redes:{proximas:[{fecha:'2026-11-04T13:00:00Z',redes:['instagram','tiktok'],titulo:'Reel'}]}}}};
function abrir(preview){const dom=new JSDOM(html.replace('<script src="assets/sitio.js"></script>','').replace('<script src="assets/oficina.js"></script>','').replace(/<link[^>]+>/g,''),{url:'https://nexofitt.com.ar/oficina.html',runScripts:'dangerously',pretendToBeVisual:true});
 if(preview)dom.window.NF_OFICINA_PREVIEW=preview;else{dom.window.fetch=()=>Promise.reject(Error('sin red'));}
 dom.window.eval(js);return dom;}
const dom=abrir({datos:{...base,ahora},mpListo:false}),O=dom.window.NFOficina,doc=dom.window.document;
// Hoy en Buenos Aires todavía es el 3/11 aunque en UTC ya sea el 4.
assert.equal(O.diaBA(ahora),'2026-11-03');
const x=O.leer(base,ahora,false);assert.equal(x.diasLanzamiento,13);assert.equal(x.pedidos.length,0,'los descartados no cuentan');
const lista=O.pendientes(x),titulos=lista.map(p=>p.t);
assert(titulos.includes('Activar Mercado Pago en la página'));assert(titulos.includes('La promo del 5 % no está cargada para todos'));assert(titulos.includes('Conectar la llave de Instagram'));assert(titulos.includes('Conseguir el primer pedido real'));
assert.equal(lista[0].n,'frenada','lo que frena va primero');
assert.equal(O.estadoSala('administracion',x),'frenada');assert.equal(O.estadoSala('direccion',x),'frenada');assert.equal(O.estadoSala('investigacion',x),'nada');
assert.deepEqual([...O.SALAS],['direccion','comercial','redes','marketing','diseno','investigacion','administracion','operaciones']);
// Instagram: el Reel de mañana no cuenta como publicación de hoy.
assert.equal(x.igHoy,0);assert(titulos.includes('Instagram no tiene nada para hoy'));
const conIg=O.leer({...base,instagram:{conectado:true,hoy:2},promo_cargadas:66,red:base.red.map(r=>({...r,mp:true})),pedidos:[{code:'B',status:'con_ofertas',ofertas:3,consultados:9,alta:ahora}]},ahora,true);
assert.deepEqual(O.pendientes(conIg),[],'sin pendientes cuando todo se resolvió');assert.match(O.frase(conIg,[]),/Está todo en orden/);
// Datos de texto siempre escapados.
assert.equal(doc.querySelectorAll('.sala').length,8);
const malo=abrir({datos:{...base,ahora,red:[{...prov(1),nombre:'<img src=x onerror=alert(1)>'}]},mpListo:null});malo.window.document.querySelector('[data-sala="comercial"]').click();assert.equal(malo.window.document.querySelector('#mesa img'),null);assert.match(malo.window.document.querySelector('#mesa').textContent,/<img src=x/);
// Elegir sala cambia la mesa; el filtro no rompe.
doc.querySelector('[data-sala="redes"]').click();assert.match(doc.getElementById('mesa').textContent,/Business Suite/);
doc.querySelector('[data-sala="comercial"]').click();doc.getElementById('sin-mp').click();assert.match(doc.getElementById('mesa').textContent,/Prov 23/);
// Las novedades escapan texto y no aceptan enlaces inseguros.
const nov=O.leer({...base,novedades:[{id:1,espacio:'redes',tipo:'avance',titulo:'<b>x</b>',enlace:'javascript:alert(1)',fecha:ahora}]},ahora,null);const html2=O.mesas.redes(nov,{}).h;assert(!html2.includes('javascript:'));assert(!html2.includes('<b>x</b>'));assert(O.mesas.direccion(nov,{}).h.includes('Redes sociales'),'dirección ve todo');
// Sin sesión pide ingresar.
const sin=abrir();await new Promise(r=>setTimeout(r,30));assert(sin.window.document.getElementById('entrar'),'pide ingreso');
console.log('OK: oficina (permisos, pendientes, estados y dibujo)');
for(const v of [dom,malo,sin])v.window.close();

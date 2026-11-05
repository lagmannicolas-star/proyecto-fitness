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
const espera=()=>new Promise(r=>setTimeout(r,30));
const dom=abrir({datos:{...base,ahora},mpListo:false}),O=dom.window.NFOficina,doc=dom.window.document;await espera();
// Hoy en Buenos Aires todavía es el 3/11 aunque en UTC ya sea el 4.
assert.equal(O.diaBA(ahora),'2026-11-03');
const x=O.leer(base,ahora,false);assert.equal(x.diasLanzamiento,13);assert.equal(x.pedidos.length,0,'los descartados no cuentan');
const lista=O.pendientes(x),titulos=lista.map(p=>p.t);
assert(titulos.includes('Activar Mercado Pago en la página'));assert(titulos.includes('La promo del 5 % no está cargada para todos'));assert(titulos.includes('Conectar Instagram y Facebook con Meta'));assert(titulos.includes('Conseguir el primer pedido real'));
assert.equal(lista[0].n,'frenada','lo que frena va primero');
assert.equal(O.estadoSala('administracion',x),'frenada');assert.equal(O.estadoSala('direccion',x),'frenada');assert.equal(O.estadoSala('investigacion',x),'nada');
assert.deepEqual([...O.SALAS],['direccion','comercial','redes','marketing','diseno','investigacion','administracion','operaciones']);
// Instagram: el Reel de mañana no cuenta como publicación de hoy.
assert.equal(x.igHoy,0);assert(titulos.includes('Instagram no tiene nada para hoy'));
const conIg=O.leer({...base,instagram:{conectado:true,hoy:2},facebook:{conectado:true,hoy:1},cola_total:20,promo_cargadas:66,red:base.red.map(r=>({...r,mp:true})),pedidos:[{code:'B',status:'con_ofertas',ofertas:3,consultados:9,alta:ahora}]},ahora,true);
assert.equal(O.pendientes(conIg).length,0,'sin pendientes cuando todo se resolvió');assert.match(O.frase(conIg,[]),/Está todo en orden/);
// Datos de texto siempre escapados.
assert.equal(doc.querySelectorAll('.sala').length,8);
const malo=abrir({datos:{...base,ahora,red:[{...prov(1),nombre:'<img src=x onerror=alert(1)>'}]},mpListo:null});await espera();malo.window.document.querySelector('[data-sala="comercial"]').click();assert.equal(malo.window.document.querySelector('#mesa img'),null);assert.match(malo.window.document.querySelector('#mesa').textContent,/<img src=x/);
// Elegir sala cambia la mesa; el filtro no rompe.
doc.querySelector('[data-sala="redes"]').click();assert.match(doc.getElementById('mesa').textContent,/Business Suite/);
doc.querySelector('[data-sala="comercial"]').click();doc.getElementById('sin-mp').click();assert.match(doc.getElementById('mesa').textContent,/Prov 23/);
// Las novedades escapan texto y no aceptan enlaces inseguros.
const nov=O.leer({...base,novedades:[{id:1,espacio:'redes',tipo:'avance',titulo:'<b>x</b>',enlace:'javascript:alert(1)',fecha:ahora}]},ahora,null);const html2=O.mesas.redes(nov,{}).h;assert(!html2.includes('javascript:'));assert(!html2.includes('<b>x</b>'));assert(O.mesas.direccion(nov,{}).h.includes('Redes sociales'),'dirección ve todo');
// Sin sesión pide ingresar.
const sin=abrir();await new Promise(r=>setTimeout(r,30));assert(sin.window.document.getElementById('entrar'),'pide ingreso');
// Actividad real: a las 00:30 de Buenos Aires trabaja Investigación; un encargo en curso también enciende la sala.
const noche=O.leer(base,'2026-11-04T03:30:00Z',null);assert.equal(O.actividad(noche).investigacion.trabajando,true);assert.equal(O.actividad(noche).marketing.trabajando,false);assert.equal(O.actividad(noche).marketing.proximo,'03:23');
const curso=O.leer({...base,encargos:[{espacio:'marketing',estado:'en_curso',titulo:'x'}]},'2026-11-04T15:00:00Z',null);assert.equal(O.actividad(curso).marketing.trabajando,true);
// Las pantallas de la oficina 3D muestran datos reales y lo programado en Meta cuenta como contenido cargado.
const conMeta=O.leer({...base,meta:{programados:30,hasta:'2026-11-14T23:00:00Z',hoy:1,proxima:{fecha:'2026-11-05T23:00:00Z',titulo:'Reel'}}},'2026-11-04T15:00:00Z',false);
assert.equal(conMeta.cubierto,30);assert.equal(O.estadoSala('diseno',conMeta),'orden');assert(!O.pendientes(conMeta).some(p=>p.t==='Instagram no tiene nada para hoy'),'lo cargado en Meta cuenta para hoy');
const salasMeta=O.actividad(conMeta);assert.equal(salasMeta.redes.pantalla.cifra,30);assert.equal(salasMeta.comercial.pantalla.cifra,24);assert.equal(salasMeta.administracion.pantalla.cifra,'0 de 24');
const enTurno=O.actividad(O.leer(base,'2026-11-04T13:30:00Z',null));assert.equal(enTurno.redes.trabajando,true);assert.equal(enTurno.redes.tarea,'Control del calendario');assert.equal(enTurno.redes.texto,'Control del calendario');
assert.match(fs.readFileSync('supabase/migrations/20261104030000_oficina_meta.sql','utf8'),/if not public\.fitness_es_admin\(\) then raise exception 'No autorizado'/);
// Lo que sale en un video público nunca muestra cobros, alertas ni mails.
const publicas=JSON.stringify(Object.values(O.actividad(conMeta)).map(e=>e.publica));assert(!/Mercado Pago|Frenad|Contactadas|Comisión/.test(publicas));assert.equal(salasMeta.redes.publica.cifra,15);
const textos=JSON.stringify(['mate','cuenta','recorrida'].flatMap(g=>O.guion(g,conMeta)));assert(!/Mercado Pago|comisi|frenad|mejor/i.test(textos));assert(O.guion('mate',conMeta).at(-1).fin);
// Sin WebGL queda el plano y no se rompe.
assert(!doc.querySelector('.plano').hidden,'sin 3D se ve el plano');
// Lista de lanzamiento y turnos.
assert.equal(O.listaLanzamiento(x).filter(i=>i.ok).length,0);assert.equal(O.proximoTurno('2026-11-04T01:10:00Z').h,'23:12','22:10 en Buenos Aires: el próximo es la lectura de las 23');assert.equal(O.proximoTurno('2026-11-04T12:00:00Z').h,'09:12');
for(const t of O.TURNOS)assert(O.SALAS.includes(t.e)&&/^\d\d:\d\d$/.test(t.h));
assert.match(fs.readFileSync('supabase/migrations/20261104020000_oficina_turnos.sql','utf8'),/if not public\.fitness_es_admin\(\) then raise exception 'No autorizado'; end if;\n insert into public\.fitness_oficina_encargos/,'solo el administrador encarga');
console.log('OK: oficina (permisos, pendientes, estados y dibujo)');
for(const v of [dom,malo,sin])v.window.close();
// El botón Crear contenido abre el estudio y la grabación avisa si no se puede.
assert.match(js,/c\.onclick = abrirEstudio/,'Crear contenido sin conectar');
assert.match(js,/if \(!lienzo\)/,'sin aviso si el navegador no graba');
assert.equal(new Set(O.TURNOS.map(t=>t.h)).size,O.TURNOS.length,'dos turnos a la misma hora');
assert.deepEqual(O.TURNOS.map(t=>t.h),O.TURNOS.map(t=>t.h).slice().sort(),'turnos fuera de orden');
// Los videos nuevos: cierran con palabra clave y solo usan datos públicos.
for(const id of ['madrugada','perro','dia','mate','cuenta','recorrida']){const g=O.guion(id,x);assert(g.length>=5,id);const c=g[g.length-1];assert.equal(c.clave,'EQUIPAR',id);assert(g.every(t=>t.dur>0&&t.t),id);assert(!/cobr[oó]|mail@|@/.test(JSON.stringify(g.filter(t=>t.globo!=='¿Y esos mails?').map(t=>t.t))),id);}

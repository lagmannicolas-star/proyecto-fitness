import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM,VirtualConsole} from 'jsdom';

// Etapa 4: fichas completas (descripción, galería, visor), miniaturas, pares, comparador nuevo, portada con garantías y
// preguntas, estados vacíos y de error, 404, accesibilidad de las opciones y contacto sin email personal. Datos reales.
const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const snap=fs.readFileSync('tests/fixtures/live-snapshot.json','utf8'),cat=fs.readFileSync('tests/fixtures/live-catalog.json','utf8'),mapa=fs.readFileSync('assets/productos/mapa.json','utf8'),textos=fs.readFileSync('assets/productos/textos.json','utf8');
const raw=fs.readFileSync('nicolas.html','utf8'),end=raw.lastIndexOf('})();');
const expose='Object.assign(window,{ui,go,render,productsData,productBySlug,nfDesc,nfPairUse,galleryOf,imgTag,armaStep,cmpIndex,refreshBuyerCatalog,NF_FAQ,getCart:function(){return cart;},TXS:function(){return TX;}});';
const source=raw.slice(0,end)+expose+raw.slice(end);
function open(hash,{store={},down=false,calls=[],empresa=null}={}){
 return new JSDOM(source,{url:'https://fitness.test/nicolas.html'+(hash||''),runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};
  if(empresa) w.NEXOFIT_EMPRESA=empresa;
  for(const [k,v] of Object.entries(store))w.localStorage.setItem(k,v);
  w.fetch=async(u)=>{u=String(u);calls.push(u);if(down&&u.includes('supabase'))throw new TypeError('Failed to fetch');
   const body=u.includes('fitness_public_catalog')?cat:u.includes('mapa.json')?mapa:u.includes('textos.json')?textos:u.includes('/api/pagos/estado')?'{"mercadoPago":false}':u.includes('fitness_reviews')?null:snap;
   return body==null?{ok:false,status:404,json:async()=>({message:'Could not find the function'})}:{ok:true,json:async()=>JSON.parse(body)};};
  class XHR{open(){}setRequestHeader(){}send(){this.status=200;this.responseText=snap}}w.XMLHttpRequest=XHR;}});}
const wait=(ms=150)=>new Promise(r=>setTimeout(r,ms));
const key=(w,el,k,o={})=>el.dispatchEvent(new w.KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true,...o}));

// ---------- 1. Descripción: párrafos, listas, datos técnicos, restos de emojis y textos de relleno ----------
let calls=[],dom=open('',{calls});await wait();let w=dom.window,d=w.document;
const D=(t,n)=>JSON.parse(JSON.stringify(w.nfDesc(t,n||'')));
let r=D('Descripción\n\n– Confeccionada en caño de 25 mm hueco\n\n– Pintura epoxi a horno\n\nMedidas:\n\n– Largo: 125 cm\n\n– Ancho: 12 cm\n\n– Diámetro: 25 mm');
assert.deepEqual(r.blocks,[{t:'ul',items:['Confeccionada en caño de 25 mm hueco','Pintura epoxi a horno']}],'lista real, sin el encabezado de relleno');
assert.deepEqual(r.specs,[['Largo','125 cm'],['Ancho','12 cm'],['Diámetro','25 mm']],'los datos van a la ficha técnica');
r=D('Información adicional\n\nPeso 2 kg\n\nDimensiones 10 × 30 × 25 cm');assert.deepEqual(r.specs,[['Peso','2 kg'],['Dimensiones','10 × 30 × 25 cm']]);assert.equal(r.blocks.length,0);
r=D('Colores disponibles: ? Rosa ? Turquesa ? Negro\nProducto listo para entregar. ? Ideal para clases. ? ¡Entrená fuerte!\n¿Qué incluye el kit?\n• 10 guantes');
assert(!JSON.stringify(r).includes('?')||JSON.stringify(r).includes('¿Qué incluye el kit?'),'sin "?" sueltos');
assert.deepEqual(r.blocks[1],{t:'ul',items:['Rosa','Turquesa','Negro']},'"? A ? B" es una lista');
assert(r.blocks.some(b=>b.t==='h'&&b.text==='¿Qué incluye el kit?'),'pregunta como subtítulo');
assert(!r.blocks.some(b=>b.text&&/listo para entregar/i.test(b.text)),'texto de relleno de la tienda fuera');
r=D('MANCUERNA HEXAGONAL 5 KG\n\n* EL PRECIO CORRESPONDE AL PAR','Mancuernas plásticas hexagonales 5 kg');assert.equal(r.unit,'par');assert.equal(r.blocks.length,0,'el título repetido no se muestra');
r=D('Cuidá tus movimientos. Género: Unisex Material: Algodón Composición: Algodón 70% / Nylon 30% Origen: Importado');
assert.deepEqual(r.specs.map(x=>x[0]),['Género','Material','Composición','Origen']);assert.equal(r.blocks[0].text,'Cuidá tus movimientos.');
r=D('-Cinta de polipropileno de 40mm.\n-54 cm de Largo.\n-Precio por el par');assert.equal(r.unit,'par');assert.deepEqual(r.blocks[0].items,['Cinta de polipropileno de 40 mm.','54 cm de Largo.']);
r=D('Pelotas atóxicas – Selladas y presurizadas – Medida de cada pelota: 9 cm – No se aplasta');assert.equal(r.blocks[0].items.length,4,'lista escrita en una línea');
const all=JSON.parse(textos);let withText=0;for(const [slug,t] of Object.entries(all)){const x=w.nfDesc(t.d,slug);assert(!/(^|[^¿\w])\?(?![^¿]*¿)/.test(JSON.stringify(x.blocks).replace(/¿[^?]*\?/g,'')),slug);if(x.blocks.length||x.specs.length)withText++;assert(x.summary.length<=156,slug);}
assert(withText>=360,'fichas con contenido: '+withText);

// ---------- Carga diferida: la portada no pide textos.json; la ficha sí, una sola vez ----------
assert(!calls.some(u=>u.includes('textos.json')),'la portada no baja las fichas');
assert(d.querySelector('.nf-card img').getAttribute('src').startsWith('assets/productos/s/'),'tarjetas con la miniatura de 420 px');
assert(/assets\/productos\/s\/\w+\.webp 420w, assets\/productos\/\w+\.webp 1000w/.test(d.querySelector('.nf-card img').getAttribute('srcset')),'la grande para pantallas de alta densidad');
assert(d.querySelector('.nf-cat img').getAttribute('src').startsWith('assets/productos/s/')&&d.querySelector('.nf-pick img').getAttribute('src').startsWith('assets/productos/s/'));
// Cadena de respaldo: miniatura → foto grande → original del proveedor.
const im=d.querySelector('.nf-card img'),thumb=im.getAttribute('src'),full=im.getAttribute('data-src1'),orig=im.getAttribute('data-src0');
assert.equal(full,thumb.replace('/s/','/'));assert(/^https:\/\//.test(orig));
w.nfImgErr(im);assert.equal(im.getAttribute('src'),full);assert(!im.hasAttribute('srcset'));w.nfImgErr(im);assert.equal(im.getAttribute('src'),orig);w.nfImgErr(im);assert(im.parentNode.classList.contains('img-x'));

// ---------- 2. Ficha: descripción completa, ficha técnica, galería y visor ----------
w.go('producto',{pslug:'barra-w-de-cano-hueca-con-topes'});await wait(120);
assert.equal(calls.filter(u=>u.includes('textos.json')).length,1);
assert.equal(w.TXS().state,'ok');
let body=d.getElementById('p-desc');assert.deepEqual([...body.querySelectorAll('li')].slice(0,2).map(x=>x.textContent),['Confeccionada en caño de 25 mm hueco','Pintura epoxi a horno']);
const specs=[...d.querySelectorAll('.nf-specs div')].map(x=>x.querySelector('dt').textContent+'='+x.querySelector('dd').textContent);
assert(specs.includes('Largo=125 cm')&&specs.includes('Diámetro=25 mm')&&specs[0]==='Categoría='+w.productBySlug('barra-w-de-cano-hueca-con-topes').category,'ficha técnica unida: '+specs.join(' | '));
w.go('producto',{pslug:'combo-fitready-20-colchonetas-10-mancuernas-recargables-10-bandas-latex-7bujt'});
body=d.getElementById('p-desc');const more=d.querySelector('[data-act="desc-more"]');
assert(body.classList.contains('clamp')&&more&&more.getAttribute('aria-controls')==='p-desc'&&more.getAttribute('aria-expanded')==='false','descripción larga con "Ver más"');
more.click();assert(!body.classList.contains('clamp'));assert.equal(more.getAttribute('aria-expanded'),'true');assert.equal(more.textContent,'Ver menos');
// Producto sin texto: queda el detalle corto de la oferta.
const noText=w.productsData().list.find(p=>!all[p.slug]&&p.detail);if(noText){w.go('producto',{pslug:noText.slug});assert(d.querySelector('#p-desc .nf-desc-text'));}
// Galería: principal primero, sin repetir las fotos de las variantes.
const DISCO='discos-3-kg-acanalado-con-agarre-de-pvc-para-barra-unidad',disco=w.productBySlug(DISCO);
w.go('producto',{pslug:DISCO});
const gal=Array.from(w.galleryOf(disco));assert.equal(gal[0],disco.photos[0]);
const locals=gal.map(g=>JSON.parse(mapa)[g]||g);assert.equal(new Set(locals).size,locals.length,'sin fotos repetidas');assert(gal.length>=5);
assert.equal(d.querySelectorAll('.nf-slide').length,gal.length);assert.equal(d.querySelectorAll('.nf-thumb').length,gal.length);assert.equal(d.querySelectorAll('.nf-dots span').length,gal.length);
assert.equal(d.getElementById('p-track').getAttribute('aria-roledescription'),'carrusel');
d.querySelector('.nf-thumb[data-i="2"]').click();assert.equal(d.querySelector('.nf-thumb[data-i="2"]').getAttribute('aria-pressed'),'true');assert.equal(w.ui.pgi,2);assert.equal(d.querySelectorAll('.nf-dots .on').length,1);
d.querySelector('[data-act="p-gnext"]').click();assert.equal(w.ui.pgi,3);
key(w,d.getElementById('p-track'),'ArrowLeft');assert.equal(w.ui.pgi,2,'flechas en el carrusel');
// La variante elegida vuelve a mostrar su foto.
const v2=disco.variants.find(v=>v.available&&v.image&&v.image!==disco.photos[0]);
if(v2){d.querySelector('[data-act="p-opt"][data-v="'+v2.props[0].value+'"]').click();assert.equal(d.getElementById('p-track').getAttribute('data-i'),String(locals.indexOf(JSON.parse(mapa)[v2.image])),'foto de la variante');}
// Visor: diálogo modal, Esc, flechas, foco atrapado y de vuelta al botón.
w.ui.pgi=null;w.render();const zb=d.querySelector('[data-act="p-zoom"][data-i="1"]');zb.click();
let z=d.querySelector('.nf-zoom');assert(z&&z.getAttribute('role')==='dialog'&&z.getAttribute('aria-modal')==='true');assert(d.documentElement.classList.contains('nf-lock'));
assert.equal(d.getElementById('z-n').textContent,'2');assert.equal(d.activeElement,z.querySelector('.nf-zoom-x'),'el foco entra al visor');
key(w,d.activeElement,'ArrowRight');assert.equal(d.getElementById('z-n').textContent,'3');
const zbtns=[...z.querySelectorAll('button')].filter(b=>!b.disabled);zbtns[zbtns.length-1].focus();key(w,d.activeElement,'Tab');assert.equal(d.activeElement,zbtns[0],'Tab da la vuelta dentro del visor');
key(w,d.activeElement,'Escape');assert(!d.querySelector('.nf-zoom'));assert(!d.documentElement.classList.contains('nf-lock'));
assert.equal(d.activeElement.getAttribute('data-i'),'2','el foco vuelve a la foto que estabas viendo');assert.equal(w.ui.pgi,2);
// Opciones como grupo de radios con flechas.
const rg=d.querySelector('.nf-opt-vals[role="radiogroup"]');assert(rg&&rg.getAttribute('aria-labelledby'));
const radios=[...rg.querySelectorAll('[role="radio"]')],on=radios.find(b=>b.getAttribute('aria-checked')==='true');
assert.equal(radios.filter(b=>b.tabIndex===0).length,1,'una sola opción en el orden del Tab');
const enabled=radios.filter(b=>!b.disabled);if(enabled.length>1){key(w,on,'ArrowRight');const now=d.querySelector('.nf-opt-vals[role="radiogroup"] [aria-checked="true"]');assert.equal(d.activeElement,now,'el foco sigue a la opción elegida');assert.notEqual(now.dataset.v,on.dataset.v,'la flecha elige la siguiente');}

// ---------- 5. Pares: "Llevar el par" y de a dos; el servidor recibe unidades ----------
assert.equal(w.nfPairUse('Discos 3 kg acanalado con agarre de PVC para barra - unidad','Discos','unidad'),'unidad-par');
assert.equal(w.nfPairUse('Mancuernas plásticas hexagonales 4 kg – modelo super – el par','Mancuernas',''),'par');
assert.equal(w.nfPairUse('Barra olímpica 1,20 m','Discos',''),'');assert.equal(w.nfPairUse('Pesa rusa 8 kg','Pesas rusas','unidad'),'');
w.ui.pgi=null;w.go('producto',{pslug:DISCO});const dv=disco.variants.find(v=>v.available);w.ui.psel=Object.fromEntries(dv.props.map(p=>[p.name,p.value]));w.render();
assert(d.querySelector('.nf-pricebox').textContent.includes('Precio por unidad'));
let pb=d.querySelector('[data-act="p-pair"]');assert.equal(pb.textContent,'Llevar el par');pb.click();
assert.equal(d.getElementById('p-qty').value,'2');assert.equal(d.getElementById('p-qty-h').textContent,'1 par (2 u.)');assert.equal(d.querySelector('[data-act="p-pair"]').getAttribute('aria-pressed'),'true');
assert.equal(d.querySelector('[data-act="p-inc"]').getAttribute('aria-label'),'Sumar un par');
d.querySelector('[data-act="p-inc"]').click();assert.equal(d.getElementById('p-qty').value,'4');
assert(d.getElementById('nf-live'),'región de anuncios para lectores de pantalla');
d.getElementById('p-add').click();assert.equal(w.getCart().find(i=>i.id===dv.offer.id).qty,4,'el carrito guarda unidades');
w.go('producto',{pslug:'mancuernas-plasticas-hexagonales-3-kg-modelo-super'});
assert(d.querySelector('.nf-pricebox').textContent.includes('Precio por par')&&!d.querySelector('[data-act="p-pair"]'),'si ya se vende por par, no hay atajo');
assert(d.querySelector('label[for="p-qty"]').textContent==='Pares');
// Armá tu espacio: renglón de pares con producto por unidad → de a 2.
const mh=w.productBySlug('mancuerna-hexagonal-cromada-de-goma-unidad-x-peso');
assert.equal(w.armaStep({slot:{pair:true}},mh),2);assert.equal(w.armaStep({slot:{pair:true}},w.productBySlug('mancuernas-plasticas-hexagonales-3-kg-modelo-super')),1);assert.equal(w.armaStep({slot:{pair:false}},mh),1);

// ---------- 7. Comparador: categoría → modelo → medida, ofertas lado a lado ----------
w.go('buscar');assert(d.querySelector('.cmp-steps [aria-current="step"]').textContent.includes('Categoría'));
const ix=w.cmpIndex();assert.equal(d.querySelectorAll('.cmp-cat').length,ix.order.length);assert(ix.order.length>=30);
d.querySelector('.cmp-cat[data-cat="Mancuernas"]').click();assert.equal(w.ui.cmpCat,'Mancuernas');
const nModels=d.querySelectorAll('.cmp-model').length;assert(nModels>5);
const qi=d.getElementById('cmp-q');qi.value='hexagonal';qi.dispatchEvent(new w.Event('input',{bubbles:true}));
assert(d.querySelectorAll('.cmp-model').length<nModels&&[...d.querySelectorAll('.cmp-model b')].every(b=>/hexagonal/i.test(b.textContent)));
d.querySelector('.cmp-model[data-k="'+ix.cats.Mancuernas.list.find(m=>m.name.startsWith('Mancuerna hexagonal cromada')).key+'"]').click();
const pills=[...d.querySelectorAll('[data-act="cmp-var"]')].map(b=>b.textContent);
assert.deepEqual(pills,pills.slice().sort((a,b)=>parseFloat(a.replace(',','.'))-parseFloat(b.replace(',','.'))),'medidas en orden numérico: '+pills.join(', '));
assert(d.querySelector('.cmp-vars [role="radiogroup"]'));
const col=d.querySelector('.cmp-col');assert(col.querySelector('.cmp-badge'));assert(/Envío/.test(col.textContent)&&/Stock/.test(col.textContent)&&/Entrega/.test(col.textContent)&&/Garantía/.test(col.textContent)&&/Compra mínima/.test(col.textContent));
assert(d.querySelector('.cmp-one'),'aviso de una sola empresa');
d.querySelector('[data-act="cmp-inc"]').click();d.querySelector('[data-act="cmp-inc"]').click();
const addB=d.querySelector('[data-act="cmp-add"]');assert.equal(addB.dataset.q,'3');addB.click();assert.equal(w.getCart().find(i=>i.id===addB.dataset.id).qty,3);
w.history.back();await wait(60);assert.equal(w.ui.cmpModel,null,'atrás vuelve a los modelos');
// Las rutas viejas del comparador siguen andando.
w.ui.cat='Mancuernas';w.ui.cmpCat='';w.go('cat');assert.equal(w.ui.route,'buscar');assert(d.querySelector('.nf-cmp'));
w.go('compare');assert(d.querySelector('.nf-cmp'));

// ---------- 8. Portada: cómo funciona, garantías y preguntas iguales a las páginas legales ----------
w.go('home');
assert.equal(d.querySelectorAll('.nf-how-steps li').length,3);
const trust=d.querySelector('.nf-trust').textContent;assert(/6 meses/.test(trust)&&/10 días/.test(trust)&&/WhatsApp/.test(trust)&&/CUIT/.test(trust));
assert.equal(d.querySelectorAll('.nf-faq-list details').length,6);
const terms=fs.readFileSync('terminos.html','utf8'),arrep=fs.readFileSync('arrepentimiento.html','utf8');
for(const t of ['10 días corridos','garantía legal de 6 meses','Mercado Pago','un pago por cada proveedor','Cada proveedor despacha sus productos','sin costo'])assert((terms+arrep).includes(t)||(terms+arrep).toLowerCase().includes(t.toLowerCase()),'legal: '+t);
const faqText=JSON.stringify(Array.from(w.NF_FAQ,x=>Array.from(x)));for(const t of ['10 días corridos','6 meses','Mercado Pago','un pago por cada uno','Cada proveedor despacha sus productos'])assert(faqText.includes(t),'preguntas: '+t);
// ---------- 10. Contacto: solo WhatsApp mientras no haya email configurado ----------
assert(!d.body.innerHTML.includes('gmail.com'),'sin email personal');assert(d.querySelector('.foot-contact a[href^="https://wa.me/"]'));
assert(!raw.includes('lagmannicolas@gmail.com'),'el código público no tiene el email personal');
dom.window.close();
dom=open('#presupuesto/x',{empresa:{email:'hola@nexofitt.com.ar',whatsapp:'5491100000000'}});await wait();w=dom.window;d=w.document;
assert(d.querySelector('.foot-contact a[href="mailto:hola@nexofitt.com.ar"]'),'con email en assets/empresa.js aparece en el pie');dom.window.close();

// ---------- 9. Estados: sin conexión, 404, carrito vacío, rutas inexistentes ----------
dom=open('',{down:true});await wait(200);w=dom.window;d=w.document;
assert(d.querySelector('.nf-down h1').textContent.includes('No pudimos abrir la tienda'));assert(d.getElementById('nf-retry'));
assert(!/Failed to fetch|TypeError/.test(d.body.textContent),'sin el error técnico en pantalla');dom.window.close();
dom=open('#producto/no-existe-este-producto');await wait();w=dom.window;d=w.document;
assert(d.querySelector('.nf-404 h1').textContent==='No encontramos este producto');assert(d.getElementById('nf404-search')&&d.querySelectorAll('.nf-404-cats .chip').length>0);
d.getElementById('nf404-q').value='soga';d.getElementById('nf404-search').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(w.ui.route,'home');assert.equal(w.ui.cq,'soga');
w.go('carrito');assert(d.querySelector('.nf-empty'));assert.equal(d.querySelectorAll('.nf-related .nf-card').length,4,'carrito vacío con sugerencias');
// Rendimiento: si el catálogo no cambió, la capa de productos no se reconstruye.
const before=w.productsData();await w.refreshBuyerCatalog();assert.equal(w.productsData(),before,'misma capa de productos');
dom.window.close();
assert.equal(errors.length,0,errors.join('; '));
console.log('OK: etapa 4: '+withText+' fichas con descripción completa (listas, ficha técnica, sin "?" sueltos), carga diferida, galería con visor accesible, miniaturas con respaldo, pares, comparador nuevo, garantías y preguntas iguales a las páginas legales, estados vacíos y de error, 404 y contacto sin email personal.');

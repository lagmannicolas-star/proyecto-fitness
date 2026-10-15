import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM,VirtualConsole} from 'jsdom';

// Tienda con los datos reales (fixtures): catálogo único, búsqueda con sinónimos, ficha de producto, carrito y textos.
const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const snap=fs.readFileSync('tests/fixtures/live-snapshot.json','utf8'),cat=fs.readFileSync('tests/fixtures/live-catalog.json','utf8'),mapa=fs.readFileSync('assets/productos/mapa.json','utf8');
const raw=fs.readFileSync('nicolas.html','utf8'),end=raw.lastIndexOf('})();');
const source=raw.slice(0,end)+'Object.assign(window,{ui,go,productsData,productBySlug,nfText,nfDetail,nfSize,searchQuery,catalogList,cartGroups,getCart:function(){return cart;}});'+raw.slice(end);
function open(hash,cartJson){return new JSDOM(source,{url:'https://fitness.test/nicolas.html'+(hash||''),runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};if(cartJson)w.localStorage.setItem('cf-cart',cartJson);
 w.fetch=async(u)=>{u=String(u);const body=u.includes('fitness_public_catalog')?cat:u.includes('mapa.json')?mapa:u.includes('/api/pagos/estado')?'{"mercadoPago":false}':snap;return {ok:true,json:async()=>JSON.parse(body)};};
 class XHR{open(){}setRequestHeader(){}send(){this.status=200;this.responseText=snap}}w.XMLHttpRequest=XHR;}});}
const wait=(ms=120)=>new Promise(r=>setTimeout(r,ms));
const input=(w,el,v)=>{el.value=v;el.dispatchEvent(new w.Event('input',{bubbles:true}));};

// ---------- Textos prolijos (solo para mostrar) ----------
let dom=open();await wait();let w=dom.window,d=w.document;
const T=w.nfText;
assert.equal(T('PESA RUSA CROMADA 10 KG'),'Pesa rusa cromada 10 kg');
assert.equal(T('COLCHONETA GIMNASIA 1*40*3 ALTA DENSIDAD 90 KG CALIDAD'),'Colchoneta gimnasia 1 × 40 × 3 alta densidad 90 kg calidad');
assert.equal(T('Pesas Rusas Kettlebel Pvc 10 kg Funcional - UNIDAD'),'Pesas rusas kettlebell PVC 10 kg funcional – unidad');
assert.equal(T('DISCO OLIMPICO BUMPER GOMA 20K NEGRO -'),'Disco olímpico bumper goma 20 kg negro');
assert.equal(T('Conos rigidos 17 cm x10 unidades - COLORES'),'Conos rígidos 17 cm x10 unidades – colores');
assert.equal(T('Pelota Mani 50'),'Pelota maní 50');
assert.equal(T('cronometro'),'Cronómetro');
assert.equal(T('pasamanos - escalera de braquiacion'),'Pasamanos – escalera de braquiación');
assert.equal(T('isla de natacion aqua GOMA EVA'),'Isla de natación aqua goma EVA');
assert.equal(T('Bloque modulo de goma espuma cubo 30 cm'),'Bloque módulo de goma espuma cubo 30 cm');
assert.equal(T('Cajon De Salto Reforzado 3 Alturas Fitness 30x40x50 Mdf'),'Cajón de salto reforzado 3 alturas fitness 30 × 40 × 50 MDF');
assert.equal(T('Disco de fundición para barra / mancuerna de 30 mm 7.5 kg'),'Disco de fundición para barra / mancuerna de 30 mm 7,5 kg');
assert.equal(T('BANDA CIRCULARES * 3 TELA 8 CM'),'Banda circulares x3 tela 8 cm');
assert.equal(T('PALO HOCKEY 20% CARBONO 37.5 PULGADAS - DRIAL SELFIE 2.0'),'Palo hockey 20% carbono 37,5 pulgadas – Drial Selfie 2.0');
assert.equal(T('PELOTA BASKET STRIKER N5 NARANJA'),'Pelota basket Striker N° 5 naranja');
assert.equal(T('Aro de Basket n°7'),'Aro de basket N° 7');
assert.equal(T('Disco de lanzamiento de acero 750 gs'),'Disco de lanzamiento de acero 750 g');
assert.equal(T('BARRA OLIMPICA 20KG 2,2 MTS'),'Barra olímpica 20 kg 2,2 m');
assert.equal(T('FITNESS PARA ELLA ?'),'Fitness para ella');
assert.equal(T('medias lasrgas de AB FITNESS'),'Medias largas de AB Fitness');
assert.equal(T('PESO'),'Peso');assert.equal(T('1.5 KG'),'1,5 kg');assert.equal(T('XL'),'XL');assert.equal(T('M'),'M');assert.equal(T('10 OZ'),'10 oz');
assert.equal(w.nfDetail('AB FITNESS Todo para el deporte ------------------------------------------------'),'');
assert.equal(w.nfDetail('? COMBO PILATES PRO Llevá tu estudio o gimnasio al siguiente nivel con el Combo '),'COMBO PILATES PRO Llevá tu estudio o gimnasio al siguiente nivel con el…');
assert.equal(w.nfSize('Única'),'');assert.equal(w.nfSize('PESO: 1 KG'),'Peso: 1 kg');
// Los datos que viajan al servidor no se tocan.
const s0=JSON.parse(snap);assert(w.productsData().list.some(p=>p.rawName==='PESA RUSA CROMADA 10 KG'));

// ---------- Capa de productos ----------
const P=w.productsData();
assert.equal(P.list.length,466);
assert.equal(P.list.reduce((n,p)=>n+p.variants.length,0),724);
assert.equal(P.list.filter(p=>p.available).length,417);
const kit=w.productBySlug('kit-fuerza-tonificacion-colchoneta-tobillera-3k-mancuerna-3k-4dhms');
assert.equal(kit.category,'Combos y kits');assert.equal(kit.vendor,'AB Fitness');
assert.deepEqual(kit.opts.map(o=>o.name),['Color','Cantidad']);
assert(kit.photos.length>1&&new Set(kit.photos).size===kit.photos.length,'fotos distintas');
assert(kit.variants.every(v=>v.offer&&v.offer.sourceKey===v.key),'cada variante con su oferta');
assert.equal(P.cats.reduce((n,c)=>n+c.count,0),466);
assert(P.cats.every(c=>c.photo),'cada categoría con foto real');

// ---------- Portada: un solo catálogo ----------
assert(d.getElementById('catalogo'));
assert.equal(d.querySelectorAll('#cat-results .nf-card').length,24);
assert(d.querySelector('#cat-results .nf-count').textContent.includes('417 productos'));
assert(d.querySelectorAll('.hero .nf-pick').length===3,'hero con productos reales');
assert(!/Empresa 1|referencia|precio del archivo|pendiente de activar/i.test(d.querySelector('main').textContent));
assert(d.querySelector('.nf-cat img').getAttribute('src').startsWith('assets/productos/'),'fotos propias');
assert(d.querySelector('.nf-card img').getAttribute('data-src0').startsWith('https://'),'respaldo a la foto original');
assert(d.querySelector('.nf-card img').hasAttribute('onerror'));
d.querySelector('[data-act="cat-more"]').click();
assert.equal(d.querySelectorAll('#cat-results .nf-card').length,48,'Ver más suma 24');
// Solo disponibles
const avail=d.getElementById('cat-avail');avail.checked=false;avail.dispatchEvent(new w.Event('change',{bubbles:true}));
assert(d.querySelector('.nf-count').textContent.includes('466 productos'));
avail.checked=true;avail.dispatchEvent(new w.Event('change',{bubbles:true}));
// Categoría
d.querySelector('.nf-chip[data-cat="Mancuernas"]').click();
assert.equal(w.ui.ccat,'Mancuernas');
const manc=w.catalogList().list;assert(manc.length>0&&manc.every(p=>p.category==='Mancuernas'&&p.available));
assert.equal(d.querySelectorAll('#cat-results .nf-card').length,Math.min(24,manc.length));
// Orden por precio
const sort=d.getElementById('cat-sort');sort.value='precio-asc';sort.dispatchEvent(new w.Event('change',{bubbles:true}));
const pr=w.catalogList().list.map(p=>p.minPrice);assert.deepEqual(pr,[...pr].sort((a,b)=>a-b));
sort.value='destacados';sort.dispatchEvent(new w.Event('change',{bubbles:true}));
d.querySelector('.nf-chip[data-cat=""]').click();

// ---------- Búsqueda: sin tildes, sinónimos y medidas ----------
const q=d.getElementById('cat-q'),names=()=>w.catalogList().list.map(p=>p.name);
input(w,q,'pesa rusa 10 kg');
assert(names().length>0&&names().every(n=>/rusa|kettlebell/i.test(n))&&/10 kg/.test(names()[0])&&/10 kg/.test(names()[1]),names().join('|'));
const ten=names().length;input(w,q,'kettlebell 10kg');assert.equal(names().length,ten,'10kg = 10 kg y kettlebell = pesa rusa');
input(w,q,'rusa');assert(names().length>=20);
input(w,q,'dumbbell');assert(names().length>0&&names().every(n=>/mancuerna/i.test(n)));
input(w,q,'colchon');assert(names().some(n=>/colchoneta/i.test(n)));
input(w,q,'natacion');const nat=names().length;input(w,q,'natación');assert.equal(names().length,nat);assert(nat>=30);
input(w,q,'pileta');assert(names().length>0);
input(w,q,'trx');assert(names().some(n=>/suspensi/i.test(n)));
input(w,q,'fitball');assert(names().some(n=>/esferodinamia/i.test(n)));
input(w,q,'balon medicinal');assert(names().some(n=>/medicine/i.test(n)));
input(w,q,'liga');assert(names().some(n=>/banda/i.test(n)));
input(w,q,'disco');assert(/disco/i.test(names()[0])&&/disco/i.test(names()[5]),'el nombre pesa más que la categoría');
input(w,q,'xyzabc');assert(d.querySelector('#cat-results .nf-empty'));assert(d.querySelectorAll('[data-act="cat-suggest"]').length>3);
d.querySelector('[data-act="cat-suggest"]').click();assert(d.querySelectorAll('#cat-results .nf-card').length>0);
// Buscador del encabezado → catálogo
d.getElementById('hq').value='soga';d.getElementById('hsearch').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
assert.equal(w.ui.cq,'soga');assert.equal(d.getElementById('cat-q').value,'soga');assert(names().slice(0,5).every(n=>/soga|cuerda/i.test(n)),names().join('|'));

// ---------- Categorías y espacios ----------
input(w,q,'');
d.querySelector('.nf-cat[data-cat="Natación"]').click();assert.equal(w.ui.ccat,'Natación');assert(w.catalogList().list.every(p=>p.category==='Natación'));
d.querySelector('[data-act="space-home"]').click();assert(w.ui.cspace);assert.equal(w.ui.ccat,'');
assert(w.catalogList().list.every(p=>['Mancuernas','Discos','Pesas rusas','Colchonetas','Combos y kits','Body pump','Topes para barras','Soportes y racks','Bancos','Accesorios de entrenamiento'].includes(p.category)));
d.querySelector('[data-act="space-off"]').click();assert.equal(w.ui.cspace,null);

// ---------- Ficha de producto ----------
d.querySelector('#cat-results .nf-card').click();await wait(20);
assert.equal(w.ui.route,'producto');assert(w.location.hash.startsWith('#producto/'));
w.go('producto',{pslug:kit.slug});
assert.equal(d.querySelector('h1').textContent,kit.name);
assert(d.querySelector('.nf-crumbs').textContent.includes('Combos y kits'));
assert(d.querySelector('.nf-seller').textContent.includes('Vendido por AB Fitness'));
assert(d.querySelector('[data-act="p-opt"][data-v="Negro"]').disabled,'sin stock en todas sus combinaciones');
assert(d.querySelector('.nf-facts').textContent.includes('A coordinar'),'envío igual que en el carrito');
assert(/40\.000/.test(d.querySelector('.nf-facts').textContent)&&/IVA incluido/.test(d.querySelector('.nf-facts').textContent));
assert(!d.querySelector('main').textContent.includes('Ver en AB Fitness'),'sin enlaces a la tienda del proveedor');
assert(d.querySelectorAll('.nf-related .nf-card').length>0&&d.querySelectorAll('.nf-related .nf-card').length<=8);
assert(d.querySelector('.nf-bar [data-act="p-add"]'),'barra fija para celular');
d.querySelector('[data-act="p-opt"][data-v="Azul"]').click();
assert.equal(w.ui.psel.Color,'Azul');
const sel=kit.variants.find(v=>v.props[0].value==='Azul'&&v.props[1].value===w.ui.psel.Cantidad);
assert(sel.available);assert.equal(d.getElementById('p-price').textContent,'$ '+sel.price.toLocaleString('es-AR'));
d.getElementById('p-add').click();
assert.equal(w.getCart().find(i=>i.id===sel.offer.id).qty,1);
assert.equal(d.getElementById('cart-n').textContent,'1');
assert(d.querySelector('.nf-added'));
d.querySelector('[data-act="p-buy"]').click();
assert.equal(w.ui.route,'carrito');assert.equal(w.getCart().find(i=>i.id===sel.offer.id).qty,2,'comprar ahora suma y va al carrito');
// Compra mínima del proveedor visible y bloqueante.
assert(sel.price*2>=40000?!d.querySelector('.cg-min'):d.querySelector('.cg-min').textContent.includes('40.000'));
assert(!/referencia|pendiente de activar/i.test(d.querySelector('main').textContent));
// Volver atrás
w.history.back();await wait(60);assert.equal(w.ui.route,'producto');
// Ruta vieja de AB → ficha nueva
w.go('ab-product',{abSlug:kit.slug});assert.equal(w.ui.route,'producto');assert.equal(d.querySelector('h1').textContent,kit.name);
dom.window.close();

// Enlace directo a una ficha.
dom=open('#producto/'+kit.slug);await wait();w=dom.window;d=w.document;
assert.equal(w.ui.route,'producto');assert.equal(d.querySelector('h1').textContent,kit.name);
assert(w.document.title.startsWith(kit.name));
dom.window.close();

// Carrito por debajo de la compra mínima: aviso y pago bloqueado.
const cheap=JSON.parse(snap).offers.find(o=>o.stock==='stock'&&o.price<20000&&(o.units==null||o.units>0));
dom=open('#carrito',JSON.stringify([{id:cheap.id,qty:1,price:cheap.price}]));await wait();w=dom.window;d=w.document;
assert(d.querySelector('.cg-min'));assert(d.querySelector('[data-act="cart-pay"]').disabled);
assert(d.querySelector('.ci-name').textContent===w.nfText(cheap.model)||d.querySelector('.ci-name').textContent.length>3);
assert.equal(errors.length,0,errors.join('; '));
dom.window.close();
console.log('OK: tienda con datos reales: 466 productos/724 variantes, catálogo único (filtros, orden, ver más), búsqueda con sinónimos y medidas, ficha con variantes, carrito, compra mínima y textos prolijos.');

// Desde una búsqueda con medida, la ficha abre con esa variante elegida.
dom=open();await wait();w=dom.window;d=w.document;
input(w,d.getElementById('cat-q'),'pesa rusa 10 kg');
const byWeight=[...d.querySelectorAll('#cat-results .nf-card')].find(a=>w.productBySlug(a.dataset.slug).variants.some(v=>v.available&&v.props.some(pr=>pr.value==='10 kg')));
assert(byWeight,'hay un producto con variante de 10 kg');
if(byWeight){byWeight.click();assert(/10 kg/.test(Object.values(w.ui.psel).join(' ')),'variante de 10 kg elegida');}
dom.window.close();
console.log('OK: la búsqueda con medida abre la ficha con esa variante.');

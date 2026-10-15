// Textos para mostrar, compartidos con la tienda (nicolas.html). NO editar a mano por separado:
// tests/worker-seo.test.mjs compara la salida de estas funciones con las de la página sobre todo el catálogo.
function norm(s){ return String(s||'').trim().toLowerCase().replace(/\s+/g,' '); }
function plain(s){ var t=norm(s); try{ t=t.normalize('NFD').replace(/[̀-ͯ]/g,''); }catch(e){} return t; }
var NF_ACR={pvc:'PVC',led:'LED',tpe:'TPE',eva:'EVA',trx:'TRX',mdf:'MDF',mma:'MMA',ez:'EZ',gap:'GAP',cpu:'CPU',nbr:'NBR',abs:'ABS',usb:'USB',xl:'XL',xxl:'XXL',xs:'XS',ab:'AB','n°':'N°'};
var NF_BRANDS={drial:'Drial',ally:'Ally',striker:'Striker',molten:'Molten',quuz:'Quuz',simbra:'Simbra',proyec:'Proyec',forza:'Forza',freeman:'Freeman',theraband:'Theraband',tiraband:'Tiraband',sox:'Sox',bosu:'Bosu',crossfit:'CrossFit',dinasti:'Dinasti',fitready:'FitReady',olimpics:'Olimpics',south:'South',marea:'Marea',fox:'Fox',selfie:'Selfie',leopard:'Leopard',boss:'Boss'};
var NF_FIX={lasrgas:'largas',kettlebel:'kettlebell',kettlebels:'kettlebells',fundicion:'fundición',rigidos:'rígidos',rigido:'rígido',rigida:'rígida',rigidas:'rígidas',plasticas:'plásticas',plastica:'plástica',plasticos:'plásticos',plastico:'plástico',mani:'maní',cronometro:'cronómetro',braquiacion:'braquiación',natacion:'natación',modulo:'módulo',modulos:'módulos',cajon:'cajón',coordinacion:'coordinación',elongacion:'elongación',pentagono:'pentágono',octagono:'octágono',hexagono:'hexágono',olimpica:'olímpica',olimpico:'olímpico',olimpicas:'olímpicas',olimpicos:'olímpicos',rectangulo:'rectángulo',circulo:'círculo',basquet:'básquet',voley:'vóley',volet:'vóley',slalon:'slalom',banderin:'banderín',baston:'bastón',cinturon:'cinturón',sobreezfuerzo:'sobreesfuerzo',economico:'económico',mascara:'máscara',jalon:'jalón',triceps:'tríceps',biceps:'bíceps',acuatica:'acuática',acuaticas:'acuáticas',paracaidad:'paracaídas',paracaidas:'paracaídas',puching:'punching',tension:'tensión',futbol:'fútbol',cesped:'césped',fenolico:'fenólico',acesorios:'accesorios',latex:'látex',elastica:'elástica',elasticas:'elásticas',elastico:'elástico',elasticos:'elásticos',proteccion:'protección',estimulacion:'estimulación',propiocepcion:'propiocepción',acanaladocon:'acanalado con',tunel:'túnel',camion:'camión',musculacion:'musculación',rehabilitacion:'rehabilitación',tonificacion:'tonificación',kinesiologia:'kinesiología',nino:'niño',ninos:'niños',peldanos:'peldaños',cubica:'cúbica',bateria:'batería'};
function nfCaseWord(w,first){
 var m=/^([^0-9A-Za-zÀ-ÖØ-öø-ÿ°]*)(.*?)([^0-9A-Za-zÀ-ÖØ-öø-ÿ°]*)$/.exec(w),pre=m[1],core=m[2],post=m[3];
 if(!core) return w;
 var lw=core.toLowerCase(),out;
 if(/\d/.test(core)&&/[a-zà-ÿ]/i.test(core)) out=core;
 else if(NF_ACR[lw]) out=NF_ACR[lw];
 else if(NF_BRANDS[lw]) out=NF_BRANDS[lw];
 else if(core.length===1&&/[VWX]/.test(core)) out=core;
 else out=NF_FIX.hasOwnProperty(lw)?NF_FIX[lw]:lw;
 if(first) out=out.charAt(0).toUpperCase()+out.slice(1);
 return pre+out+post;
}
/* Nombre prolijo: mayúsculas a oración, unidades (kg, cm, m, ×), siglas y marcas conservadas, errores frecuentes corregidos. */
function nfText(s){
 var t=String(s==null?'':s);
 t=t.replace(/[‍️]/g,'').replace(/(^|\s)\?+(?=\s|$)/g,'$1').replace(/-{3,}|_{3,}|={3,}/g,' ');
 t=t.replace(/(\d)\s*[*xX×]\s*(?=\d)/g,'$1 × ');
 t=t.replace(/([A-Za-zÀ-ÖØ-öø-ÿ])\s*\*\s*(\d+)/g,'$1 x$2').replace(/\s*\*\s*(par|unidad|unidades)\b/gi,' por $1').replace(/\s*\*\s*/g,' ');
 t=t.replace(/\bX(?=\d)/g,'x');
 t=t.replace(/\b(?:nro\.?|n[°º])\s*(\d)/gi,'N° $1').replace(/\bN(\d)\b/g,'N° $1');
 t=t.replace(/(\d)\s*(?:kgs?|kilos?)\b/gi,'$1 kg').replace(/(\d)\s*k\b/gi,'$1 kg').replace(/(\d)\s*(?:gs|grs?)\b/gi,'$1 g');
 t=t.replace(/(\d)\s*cms?\b/gi,'$1 cm').replace(/(\d)\s*mm\b/gi,'$1 mm').replace(/(\d)\s*(?:mts|mt|m)\b/gi,'$1 m').replace(/(\d)\s*oz\b/gi,'$1 oz');
 t=t.replace(/(\d)\.(\d+)(?=\s(?:kg|g|m|cm|mm|oz|pulgadas)\b)/gi,'$1,$2');
 t=t.replace(/\s+-+\s*|\s*-+\s+/g,' – ').replace(/\s*\/\s+|\s+\/\s*/g,' / ');
 t=t.replace(/\s+([.,:;])/g,'$1').replace(/\s{2,}/g,' ').trim().replace(/^[\s–\-·.,:;]+|[\s–\-·.,:;/]+$/g,'');
 var first=true;
 t=t.split(/(\s+|\/)/).map(function(w){ if(!w||/^\s+$/.test(w)||w==='/') return w; var out=nfCaseWord(w,first); first=false; return out; }).join('');
 return t.replace(/\bab fitness\b/gi,'AB Fitness').replace(/\bbody pump\b/gi,'Body Pump').replace(/\bmarca arena\b/gi,'marca Arena').replace(/\bpower (pack|pro)\b/gi,function(m,x){ return 'Power '+x.charAt(0).toUpperCase()+x.slice(1).toLowerCase(); });
}
function nfProp(s){ return nfText(s); }
/* Descripción del proveedor: sin firmas repetidas, separadores ni restos de emojis. El archivo la trae cortada: se corta en la última palabra completa. */
function nfDetail(s,name){
 var raw=String(s||''),t=raw.replace(/[‍️]/g,'').replace(/(^|\s)\?+(?=\s|$)/g,'$1').replace(/[-_=*]{3,}/g,' ');
 t=t.replace(/AB FITNESS\s+Todo para el deporte/gi,' ').replace(/^\s*(Descripci[oó]n|Informaci[oó]n adicional|Caracter[ií]sticas principales|Caracter[ií]sticas|Especificaciones)\s*:?\s*/i,'').replace(/\s{2,}/g,' ').trim();
 var letters=t.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g,''),upper=t.replace(/[^A-ZÀ-ÖØ-Þ]/g,'');
 if(letters.length&&upper.length/letters.length>0.6) t=nfText(t);
 if(raw.length>=78) t=t.replace(/\s+\S*$/,'').replace(/[\s,;:–\-]+$/,'')+'…';
 if(t.replace(/…$/,'').length<16) return '';
 if(name&&plain(t).replace(/[^a-z0-9]/g,'')===plain(name).replace(/[^a-z0-9]/g,'')) return '';
 return t;
}
var NF_GENERIC=['mas vendidos','arma tu gym','otros','fitness para ella','catalogo ab fitness','combos','novedades','ofertas','destacados'];
function nfCategory(raw,offerCat){
 var parts=String(raw||'').replace(/\?/g,'').split(',').map(function(x){ var seg=x.split('>'); return seg[seg.length-1].replace(/\\/g,'').trim(); }).filter(Boolean);
 for(var i=0;i<parts.length;i++){ if(NF_GENERIC.indexOf(plain(parts[i]))<0) return nfText(parts[i]); }
 var oc=String(offerCat||'').replace(/\?/g,'').trim();
 return oc&&NF_GENERIC.indexOf(plain(oc))<0?nfText(oc):'Otros productos';
}
/* Variante legible: "Color: Rosa · Cantidad: 1"; las presentaciones únicas no se muestran. */
function nfSize(s){ var t=String(s||'').trim(); if(!t||/^(única|unica|presentación única)$/i.test(t)) return ''; return t.split(' · ').map(function(x){ var i=x.indexOf(': '); return i>0?nfProp(x.slice(0,i))+': '+nfProp(x.slice(i+2)):nfProp(x); }).join(' · '); }
function catSlug(name){ return plain(name).replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }
export { norm, plain, nfText, nfProp, nfDetail, nfCategory, nfSize, catSlug };

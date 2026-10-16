// Textos para mostrar, compartidos con la tienda (nicolas.html). NO editar a mano:
// se genera con `node scripts/texto-worker.mjs` y tests/worker-seo.test.mjs verifica que esté al día.
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

/* ---------- Descripción completa del proveedor: párrafos, listas y datos técnicos ---------- */
var NF_FIX_TXT={diametro:'diámetro',limite:'límite',oxigeno:'oxígeno',artistica:'artística',metalica:'metálica',metalico:'metálico',metalicas:'metálicas',metalicos:'metálicos',lastimas:'lastimás',podes:'podés',pvc:'PVC'};
/* Unidades y medidas sin tocar mayúsculas (para texto corrido). */
function nfUnits(s){
 var t=String(s==null?'':s);
 t=t.replace(/(\d)\s*[*xX×]\s*(?=\d)/g,'$1 × ');
 t=t.replace(/(\d)\s*(?:kgs?|kilos?)(?![a-zà-ÿ])/gi,'$1 kg').replace(/(\d)\s*k(?![a-zà-ÿ0-9])/gi,'$1 kg').replace(/(\d)\s*(?:gs|grs?)(?![a-zà-ÿ])/gi,'$1 g');
 t=t.replace(/(\d)\s*cms?(?![a-zà-ÿ])/gi,'$1 cm').replace(/(\d)\s*mm(?![a-zà-ÿ])/gi,'$1 mm').replace(/(\d)\s*(?:mts|mt)(?![a-zà-ÿ])\.?/gi,'$1 m').replace(/(\d)\s*oz(?![a-zà-ÿ])/gi,'$1 oz');
 t=t.replace(/(\d)\.(\d+)(?=\s(?:kg|g|m|cm|mm|oz|pulgadas)(?![a-zà-ÿ])|\s×\s)/gi,'$1,$2');
 t=t.replace(/[A-Za-zÀ-ÿ]+/g,function(w){ var lw=w.toLowerCase(),f=NF_FIX.hasOwnProperty(lw)?NF_FIX[lw]:NF_FIX_TXT[lw]; if(!f||w!==lw&&w!==lw.charAt(0).toUpperCase()+lw.slice(1)) return w; return w===lw?f:f.charAt(0).toUpperCase()+f.slice(1); });
 return t.replace(/\s+([:;,])(?=\s|$)/g,'$1').replace(/\s{2,}/g,' ').trim();
}
/* Restos de emojis: un "?" que no cierra un "¿" es un emoji perdido. Se marca con \u0001 para cortar ahí. */
function nfStray(line){
 var out='',open=0,ch;
 for(var i=0;i<line.length;i++){ ch=line.charAt(i);
  if(ch==='¿'){ open++; out+=ch; }
  else if(ch==='?'){ if(open>0){ open--; out+=ch; } else out+='\u0001'; }
  else out+=ch; }
 return out.replace(/[‍️⃣]/g,'');
}
var NF_SPEC_KEYS=['genero','género','abertura','cierre','uso','peso','peso maximo','peso máximo','peso soportado','carga maxima','carga máxima','dimensiones','medidas','medida','tamaño','tamano','largo','ancho','alto','altura','espesor','grosor','diametro','diámetro','diametro del orificio','diámetro del orificio','diametro interno','diámetro interno','material','materiales','relleno','color','colores','talle','talles','capacidad','contenido','origen','marca','modelo','composicion','composición','terminacion','terminación','largo del agarre','agarre','resistencia','presentacion','presentación','cantidad','incluye','espacio discos','tela','tamaño reglamentario','peso reglamentario','circunferencia','numero','número','medida de la funda','medidas plegado','medidas armado'];
var NF_HEADS=/^(descripci[oó]n|informaci[oó]n adicional|caracter[ií]sticas( principales| t[eé]cnicas| del producto)?|especificaciones( t[eé]cnicas)?|detalles?( del producto)?|ficha t[eé]cnica|medidas|beneficios|ventajas|ideal para|uso|usos|recomendaciones|el kit incluye|qu[eé] incluye( el kit| el combo)?|incluye|contenido|de regalo|modo de uso|cuidados|importante|aclaraci[oó]n|nota)\b/i;
var NF_BOILER=/^(ab fitness,? f[aá]brica de productos para el deporte\.?|medidas y especificaciones t[eé]cnicas disponibles bajo consulta\.?|consult[aá] nuestro stock.*|descripci[oó]n|descripcion|informaci[oó]n adicional|ab fitness|todo para el deporte|producto listo para entregar\.?|env[ií]os? a todo el pa[ií]s\.?|stock disponible\.?|consult[aá] (stock|por stock)\.?|hac[eé] tu pedido\.?|compr[aá] (ahora|ya)\.?)$/i;
function nfPairNote(t){
 var p=plain(t).replace(/[.\-–!]+/g,' ').replace(/\s+/g,' ').trim();
 if(/^(el |x |por |precio por |se vende por )?par$/.test(p)) return 'par';
 if(/^(la |x |por |precio por |se vende por )?unidad$/.test(p)) return 'unidad';
 if(/precio (corresponde|es) (al|por) par|precio (por el|del) par|se vende(n)? (de a|por|en) par|precio por par|valor por par/.test(p)) return 'par';
 if(/precio (corresponde|es) (a la|por) unidad|se vende(n)? (por|de a) unidad|precio por unidad|valor por unidad|la unidad\b/.test(p)&&p.length<60) return 'unidad';
 return '';
}
function nfCapsLine(t){ var l=t.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g,''),u=t.replace(/[^A-ZÀ-ÖØ-Þ]/g,''); return l.length>=4&&u.length/l.length>0.7; }
function nfLineText(t){ return nfCapsLine(t)?nfText(t):nfUnits(t).replace(/\bab fitness\b/gi,'AB Fitness'); }
function nfSpecOf(line){
 var m=/^([A-Za-zÁÉÍÓÚáéíóúÑñ][A-Za-zÁÉÍÓÚáéíóúÑñ .()/]{1,30}?)\s*(?::|\s(?=\d))\s*(.{1,90})$/.exec(line);
 if(!m) return null;
 var k=plain(m[1]).replace(/[.()]/g,'').replace(/\s+/g,' ').trim(),v=m[2].trim();
 if(NF_SPEC_KEYS.indexOf(k)<0||!v||v.length>90) return null;
 if(k==='incluye'&&!/\d/.test(v)) return null;
 return [nfText(m[1].replace(/[():]/g,'').trim()),nfLineText(v).replace(/[.;]+$/,'')];
}
function nfSameName(t,name){
 if(!name) return false;
 var a=plain(t).replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(function(x){ return x.length>1; }),b=' '+plain(name).replace(/[^a-z0-9 ]/g,' ')+' ';
 if(!a.length||a.length>12) return false;
 var hit=a.filter(function(x){ return b.indexOf(' '+x.replace(/(es|s)$/,''))>=0; }).length;
 return hit/a.length>=0.6;
}
/* Devuelve {blocks:[{t:'h'|'p'|'ul',text|items}], specs:[[clave,valor]], unit:'par'|'unidad'|'', summary} */
function nfDesc(raw,name){
 var out={blocks:[],specs:[],unit:'',summary:''},seenSpec={},lines=[],pend=null;
 var src=String(raw||'').replace(/\r/g,'').replace(/[-_=*·.]{4,}/g,'\n').replace(/AB FITNESS\s*\n\s*Todo para el deporte/gi,'\n');
 src.split('\n').forEach(function(l0){
  var l=nfStray(l0).replace(/[ \t ]+/g,' ').trim();
  if(!l) { lines.push(''); return; }
  /* "A - B - C": lista escrita en una sola línea. */
  var dl=l.replace(/([.;])\s?-(?=[A-ZÁÉÍÓÚÑ])/g,'$1\u0002').replace(/\s[-–]\s?(?=[A-ZÁÉÍÓÚÑ0-9¿])/g,'\u0002');
  if((dl.match(/\u0002/g)||[]).length>=2){ dl.split('\u0002').forEach(function(x,i){ x=x.trim(); if(x) lines.push((i||!/:$/.test(x)?'• ':'')+x); }); return; }
  /* "• " solo: la viñeta va con la línea siguiente. */
  if(/^[•·\-–*\u0001]+$/.test(l)){ pend='•'; return; }
  if(pend){ l='• '+l; pend=null; }
  var n=(l.match(/\u0001/g)||[]).length,lead;
  if(n>=2&&/^[^\u0001]*:\s*\u0001/.test(l)){ lead=l.slice(0,l.indexOf('\u0001')).trim(); lines.push(lead); l.slice(l.indexOf('\u0001')).split('\u0001').forEach(function(x){ x=x.trim(); if(x) lines.push('• '+x); }); return; }
  if(n>=2&&!/^\u0001/.test(l.replace(/^[^\u0001]{0,3}/,''))){ var segs=l.split('\u0001').map(function(x){ return x.trim(); }).filter(Boolean),sent=segs.filter(function(x){ return /[.!]$/.test(x); }).length;
   if(sent*2>=segs.length){ lines.push(''); segs.forEach(function(x){ lines.push(x); lines.push(''); }); return; }
   segs.forEach(function(x,i){ lines.push((i?'• ':'')+x); }); return; }
  l.split('\u0001').forEach(function(x){ x=x.trim(); if(x) lines.push(x); });
 });
 /* Primera pasada: líneas con su tipo; los datos técnicos dentro de una lista solo salen si la lista es casi toda de datos. */
 var toks=[],gap=false;
 lines.forEach(function(l){
  if(!l){ gap=true; return; }
  var bullet=/^([•·*]|[-–—](?=\s*[\wÀ-ÿ¿¡(]))/.test(l),txt=l.replace(/^[•·*\-–—]+\s*/,'').replace(/\s*[-–—]+$/,'').trim();
  if(!txt||/^[\W_]+$/.test(txt)) return;
  var pu=nfPairNote(txt); if(pu&&txt.length<70){ if(!out.unit) out.unit=pu; return; }
  if(NF_BOILER.test(txt.replace(/[:.!]+$/,'').trim())){ gap=true; return; }
  /* Prefijo en mayúsculas igual al nombre ("VENDA ELASTICA PROYEC Cuidá…"). */
  var cap=/^([A-ZÁÉÍÓÚÑ0-9][A-ZÁÉÍÓÚÑ0-9 .&\/-]{5,})\s+(?=[A-ZÁÉÍÓÚÑ¿¡][a-zà-ÿ])/.exec(txt);
  if(cap&&!toks.length&&nfSameName(cap[1],name)) txt=txt.slice(cap[0].length);
  /* "Género: Unisex Material: Algodón …": datos técnicos escritos de corrido. */
  var re=/([A-ZÁÉÍÓÚ][a-zà-ÿ]+(?: [a-zà-ÿ]+){0,2}):\s/g,m,hits=[];
  while((m=re.exec(txt))){ if(NF_SPEC_KEYS.indexOf(plain(m[1]))>=0) hits.push(m.index); }
  if(hits.length>=3){ var head0=txt.slice(0,hits[0]).trim(); if(head0) toks.push({b:bullet,txt:head0,sp:null,gap:gap});
   hits.forEach(function(h,i){ var seg=txt.slice(h,i+1<hits.length?hits[i+1]:txt.length).trim().replace(/[.,;]+$/,''); var sp=nfSpecOf(seg); toks.push({b:false,txt:seg,sp:sp,gap:false}); }); gap=false; return; }
  toks.push({b:bullet,txt:txt,sp:nfSpecOf(txt),gap:gap}); gap=false;
 });
 for(var i=0;i<toks.length;){
  if(!toks[i].b){ i++; continue; }
  var j=i,n=0; while(j<toks.length&&toks[j].b){ if(toks[j].sp) n++; j++; }
  if(n/(j-i)<0.6) for(var k=i;k<j;k++) toks[k].sp=null;
  i=j;
 }
 var cur=null;
 toks.forEach(function(tk,ti){
  var txt=tk.txt,bullet=tk.b;
  if(!out.blocks.length&&!bullet&&!tk.sp&&nfSameName(txt,name)) return;
  if(tk.sp){ var sk=plain(tk.sp[0]); if(!seenSpec[sk]){ seenSpec[sk]=1; out.specs.push(tk.sp); } return; }
  var head=!bullet&&txt.length<=48&&(/:$/.test(txt)||/^¿[^?]+\?$/.test(txt)||NF_HEADS.test(txt)&&txt.split(' ').length<=5||nfCapsLine(txt)&&txt.split(' ').length<=6&&!/[.!]$/.test(txt));
  if(head){ var h=nfLineText(txt.replace(/[:\-–]+$/,'').trim()); h=h.charAt(0).toUpperCase()+h.slice(1); cur=null;
   if(/^(descripci[oó]n|especificaciones|caracter[ií]sticas|informaci[oó]n adicional|detalles)$/i.test(h)&&!out.blocks.length) return;
   out.blocks.push({t:'h',text:h}); return; }
  var text=nfLineText(txt); text=text.charAt(0).toUpperCase()+text.slice(1);
  if(bullet){ if(!cur||cur.t!=='ul'){ cur={t:'ul',items:[]}; out.blocks.push(cur); } cur.items.push(text); return; }
  if(!tk.gap&&cur&&cur.t==='p'&&!/[.!?:;]$/.test(cur.text)&&cur.text.length<160&&/^[a-zà-ÿ0-9(]/.test(txt)){ cur.text+=' '+txt; return; }
  cur={t:'p',text:text}; out.blocks.push(cur);
 });
 /* Encabezados sin contenido debajo se descartan. */
 out.blocks=out.blocks.filter(function(b,i,a){ return b.t!=='h'||(a[i+1]&&a[i+1].t!=='h'); });
 /* Resumen para buscadores y tarjetas: primeras frases con sentido. */
 var words=[]; out.blocks.some(function(b){ if(b.t==='h') return false; var t=b.t==='ul'?b.items.map(function(x){ return x.replace(/[.;:]+$/,''); }).join(', '):b.text.replace(/[.;:]+$/,''); words.push(t.replace(/[:;]$/,'')); return words.join('. ').length>150; });
 var sum=words.join('. ').replace(/\.\s*\./g,'.').replace(/\s+/g,' ').trim();
 if(sum.length>155){ sum=sum.slice(0,156).replace(/\s+\S*$/,'').replace(/[\s,;:–\-.]+$/,'')+'…'; }
 else if(sum&&!/[.!?…]$/.test(sum)) sum+='.';
 out.summary=sum;
 return out;
}
/* Pares: productos que se venden por unidad pero se usan de a dos (mancuernas, tobilleras, discos). El servidor siempre recibe unidades. */
var NF_PAIR_CATS=['Mancuernas','Tobilleras','Discos'];
function nfPairUse(name,category,unit){
 var n=' '+plain(name).replace(/[^a-z0-9ñ]+/g,' ')+' ';
 if(unit==='par'||/ (par|pares) /.test(n)) return 'par';
 if(/^ (kit|combo|set|pack|barra|barras|soporte|rack|pesa|pesas) /.test(n)||/lanzamiento|equilibrio|frisbee|deslizante|hockey|natacion|ula|hula/.test(n)) return '';
 if(unit==='unidad'&&/ (mancuernas?|tobilleras?|discos?|guantes?|munequeras?) /.test(n)) return 'unidad-par';
 if(NF_PAIR_CATS.indexOf(category)>=0&&/ (mancuernas?|tobilleras?|discos?) /.test(n)) return 'unidad-par';
 return '';
}
/* Preguntas frecuentes: el mismo texto en la portada y en los datos para Google (FAQPage). Coinciden con terminos.html y arrepentimiento.html. */
var NF_FAQ=[
 ['¿Cómo funcionan los envíos?','Cada proveedor despacha sus productos. Antes de pagar te mostramos cómo cobra el envío cada uno: con precio fijo según tu código postal, que se suma al total, o a coordinar, que el proveedor te cotiza después de la compra y le pagás directamente a él. Podés seguir tu pedido desde Mi cuenta.'],
 ['¿Cómo pago?','Pagás con Mercado Pago: tarjeta, dinero en cuenta y los medios que ofrezca. Si tu carrito tiene productos de varios proveedores, hacés un pago por cada uno. Nexo Fit no guarda los datos de tu tarjeta.'],
 ['¿Puedo comprar con factura A?','Sí. En la compra elegí tu condición frente al IVA y cargá el CUIT de tu institución: si sos responsable inscripto, el CUIT es obligatorio. Cada proveedor factura los productos que te vende con esos datos.'],
 ['¿Qué pasa si me arrepiento o el producto falla?','Tenés 10 días corridos para arrepentirte, sin dar explicaciones y sin costo, desde el Botón de arrepentimiento. Los productos nuevos tienen la garantía legal de 6 meses, o la del proveedor si es mayor. Ante cualquier problema, escribinos por WhatsApp y te acompañamos.'],
 ['¿Hay una compra mínima?','Algunos proveedores piden un monto mínimo en sus productos. Se ve en cada producto y en el carrito, que te muestra cuánto te falta. Podés combinar distintos productos del mismo proveedor para llegar.'],
 ['¿Cómo compro a varios proveedores a la vez?','Agregás todo a un solo carrito. El carrito separa los productos por proveedor, con su envío y su compra mínima, y te muestra el precio final con tu código postal. Después hacés un pago por proveedor y cada uno te envía lo suyo.']
];
function catSlug(name){ return plain(name).replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,''); }
export { norm, plain, nfText, nfProp, nfDetail, nfCategory, nfSize, catSlug, nfUnits, nfDesc, nfPairUse, NF_FAQ };

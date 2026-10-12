
(function(){
'use strict';
/* ---------- Catálogo, datos de ejemplo y funciones compartidas por los tres sitios ---------- */
var STORE='comparador-fitness-demo-v8';

/* Catálogo: categoría → modelo → variante. Tomado de "Fitness. Modelos y variantes" (edición 7 de octubre de 2026). */
function L(list,suffix,prefix){ return list.split(';').map(function(x){ return (prefix?prefix+' · ':'')+x.trim()+(suffix?' '+suffix:''); }); }
var CATALOG=[
  {n:'Colchonetas',c:'red',
   intro:'Medidas en centímetros. La medida de base define la familia; el espesor es una variante.',
   clave:'Agrupar 4 y 5 cm bajo 100×50 no significa igualar calidades. Relleno, densidad y tela deben conservarse como atributos de cada oferta. No se mezclan con los mats de yoga.',
   attrs:'Base, espesor, relleno, densidad en kg/m³, tela, cierre, plegado',
   m:[
    ['Gimnasia rectangular 100×50',['100×50×4 cm','100×50×5 cm'],'Un único modelo en el catálogo. Ambas medidas publicadas; no implica que compartan relleno ni proveedor.'],
    ['Gimnasia rectangular 100×40',['100×40×3 cm'],'Presentación con cordura y friselina.'],
    ['Gimnasia rectangular 120×50',['120×50×3 cm'],'Funda lavable con cierre.'],
    ['Compactada 100×50',['100×50×4 cm'],'Construcción compactada, distinta de la línea convencional.'],
    ['Personalizable 100×50',['100×50×4 cm'],'Funda con cierre; espuma publicada de 24 kg/m³. Logo opcional.'],
    ['Plegable tipo libro',['130×50×3 cm'],'Espuma de polietileno. Cara superior bagún o cordura; inferior friselina.']
   ]},
  {n:'Mancuernas',c:'blue',
   intro:'Cada peso corresponde a una mancuerna. Un par de 5 kg significa dos piezas de 5 kg.',
   clave:'Relleno, núcleo y recubrimiento son atributos distintos. “Plástica rellena” y “fundición recubierta en vinilo” no son equivalentes. No se incluyen selectores ajustables cuya escala publicada resulte contradictoria.',
   attrs:'Construcción, forma, recubrimiento, peso por pieza, unidad o par, agarre',
   m:[
    ['Plástica PVC rellena',L('1;2;3;5;6;8;10','kg'),'Peso fijo. No se atribuye una composición de relleno no informada.'],
    ['Plástica rellena Eco',['4 kg'],'Relleno de cemento publicado en esta ficha.'],
    ['Super hexagonal PVC rellena',['7 kg'],'Peso fijo; formato super hexagonal.'],
    ['Hexagonal de fundición',L('1;2;3;4;5;6;7;8;9;10;12;15;18;20;22,5;25;28;30;32','kg'),'Hierro fundido. Se listan pesos observados, sin completar una escala por inferencia.'],
    ['Hexagonal engomada',L('2,5;5;7,5;10;12,5;15;17,5;20;22,5;25;27,5;30','kg'),'Cabezas hexagonales engomadas y agarre cromado.'],
    ['Vinílica de peso fijo',L('1;2;3;4;5','kg'),'Recubrimiento de vinilo; serie MVIN documentada en catálogo.'],
    ['Hexagonal neoprene',L('1;2;3;4;5','kg'),'Recubrimiento de neoprene; no se sustituye por el término vinilo.'],
    ['Circular de poliuretano CPU',L('2,5;5;7,5;10;12,5;15;17,5;20;22,5;25;27,5;30;32,5;35;37,5;40;42,5;45;47,5;50','kg'),'Núcleo de acero y recubrimiento CPU; agarre de 150 mm.']
   ]},
  {n:'Discos',c:'yellow',
   intro:'El diámetro indicado es el orificio central. Pesos por disco, sin sumar pares ni packs.',
   clave:'Ø25, Ø30 y Ø50 mm no son intercambiables. “Engomado” no prueba aptitud para caídas. La denominación comercial “competición” no se presenta como certificación independiente.',
   attrs:'Peso, orificio, diámetro exterior, construcción, recubrimiento, agarres',
   m:[
    ['PVC relleno liso encastrable',L('1;5;10','kg','Ø30 mm'),'Cubierta plástica y relleno publicado. Diseño liso.'],
    ['PVC relleno con agarres',L('1;2,5;5','kg','Ø30 mm'),'Manijas o acanalado; relleno cementicio/metálico según la ficha.'],
    ['PVC relleno con manija',L('1;5','kg','Ø25 mm'),'Familia separada de los discos Ø30 mm.'],
    ['PVC relleno liso',['Ø25 mm · 10 kg'],'Sin manija.'],
    ['Fundición lisa',L('1,25;2,5;5;7,5;10;15;20','kg','Ø30 mm'),'Hierro de fundición sin cubierta plástica.'],
    ['Fundición con agarres',L('1,25;2,5','kg','Ø30 mm'),'Pesos con modelo y diámetro publicados.'],
    ['Fundición olímpica',L('1,25;2,5;10','kg','Ø50 mm'),'Variantes identificadas en catálogo.'],
    ['Engomado con agarres',L('1,25;2,5;5;10;15;20','kg','Ø50 mm'),'Recubrimiento de goma. No se clasifica como bumper.'],
    ['Bumper de caucho virgen',L('5;10;15;20;25','kg','Ø50 mm'),'Diámetro exterior 450 mm; collar de acero inoxidable.'],
    ['Bumper de competición',L('5;10;15;20;25','kg','Orificio 50,4 mm'),'Caucho virgen; inserto central de acero con zinc.']
   ]},
  {n:'Pesas rusas',c:'green',
   intro:'Variantes de peso fijo por pieza; se distinguen cuerpo, recubrimiento y tipo de asa.',
   clave:'“PVC rellena”, “vinílica”, “engomada” y “neoprene” son familias diferentes. Las dimensiones publicadas para un peso no se trasladan a los demás.',
   attrs:'Construcción, recubrimiento, peso, geometría, asa, base',
   m:[
    ['PVC rellena, serie liviana',L('2;3;4;5','kg'),'Ficha con relleno de hormigón y granalla de acero.'],
    ['PVC rellena, serie intermedia',L('6;7;8;9;10;12','kg'),'Pesos documentados en fichas individuales o como piezas de kits. El relleno se conserva según la fuente.'],
    ['PVC rellena, serie pesada',L('14;16','kg'),'No se agregan pesos intermedios por inferencia.'],
    ['Hierro fundido sin recubrimiento elastomérico',L('4;6;8;10;12;14;16;18;20;24;28;32;36;40;44;48;56;68;80;92','kg'),'Cuerpo de fundición con acabado pintado. Opciones publicadas, no garantía de stock.'],
    ['Fundición recubierta en vinilo',L('4;8;12;16;20;24','kg'),'El vinilo es un recubrimiento; no un relleno.'],
    ['Engomada con asa cromada',L('4;6;8;10;12;16;20','kg'),'Cuerpo engomado y agarre cromado.'],
    ['Recubierta en neoprene',L('2;4;6;8;10;12','kg'),'Serie documentada en catálogo del fabricante/importador.'],
    ['Competición de acero',L('4;6;8;10;12;16;20;24;28;32','kg'),'Tamaño constante entre pesos según el fabricante.']
   ]},
  {n:'Barras',c:'white',
   intro:'Largo total en centímetros. El diámetro de carga no debe confundirse con el diámetro de agarre.',
   clave:'El peso propio de una barra se registra por ficha: dos barras del mismo largo pueden pesar distinto. No se asignan capacidad de carga, rodamiento o uso competitivo a partir del nombre “olímpica”.',
   attrs:'Forma, largo, diámetro de carga, peso propio, agarre, cierre, acabado',
   m:[
    ['Recta lisa convencional',L('120;150','cm','Ø30 mm'),'Extremos lisos; retención mediante topes compatibles.'],
    ['Recta roscada convencional',L('120;150;170;180;220','cm','Ø30 mm'),'Variantes publicadas con topes a rosca.'],
    ['EZ / curl roscada',['Ø30 mm · 120 cm'],'Maciza y cromada.'],
    ['W convencional',['Ø30 mm · 120 cm'],'Maciza y cromada; geometría propia.'],
    ['Recta olímpica corta',['Ø50 mm · 120 cm · 8 kg'],'Peso propio específico de esta ficha.'],
    ['Recta olímpica 15 kg',['201 cm · 15 kg'],'Agarre de 25 mm; acabado Cerakote; 4 rodamientos.'],
    ['Recta olímpica 20 kg',['Ø50 mm · 220 cm · 20 kg'],'Peso propio de 20 kg publicado para esta línea.'],
    ['Romana olímpica',['Ø50 mm · 110 cm'],'Hierro macizo, pintura negra mate; separación entre agarres 15 cm.']
   ]},
  {n:'Pelotas de Pilates',c:'iron',
   intro:'Se separan las pelotas pequeñas, las de peso y las de forma especial.',
   clave:'Una pelota de 20 o 25 cm no reemplaza una esferodinamia de 65 cm. Las pelotas con peso se comparan por kg y diámetro; las inflables, por diámetro y construcción.',
   attrs:'Forma, diámetro o largo, peso si corresponde, material, textura, inflado',
   m:[
    ['Pequeña esférica de Pilates',['Ø20 cm','Ø25 cm'],'Pelotas pequeñas; no son esferas grandes para apoyo corporal.'],
    ['Pequeña texturada',['Ø21 cm'],'PVC suave y texturado.'],
    ['Pelota pequeña con peso',['0,5 kg · Ø9 cm','1 kg · Ø12 cm','2 kg · Ø14 cm'],'PVC relleno de arena. Cada peso tiene su diámetro documentado.'],
    ['Tipo maní / peanut',['90×50 cm'],'PVC; forma alargada con centro estrecho.']
   ]},
  {n:'Esferodinamias',c:'red',
   intro:'Diámetros nominales publicados. El diámetro efectivo depende del inflado.',
   clave:'Carga máxima y sistema anti-explosión deben respaldarse para cada variante. No se copian las capacidades de 45, 55 o 65 cm a los otros diámetros ni se usa “anti-burst” sin evidencia específica.',
   attrs:'Diámetro, material, textura, sistema anti-burst, carga publicada, inflador',
   m:[
    ['Esférica convencional',L('35;45;55;65;75;85;95','cm'),'Familia de esferas grandes. Cada diámetro constituye una variante.'],
    ['Esférica con pinches',['75 cm'],'Superficie con pinches; se mantiene separada de la línea lisa/texturada.']
   ]},
  {n:'Medicine balls',c:'blue',
   intro:'El comportamiento de rebote define familias distintas, incluso cuando coinciden los pesos.',
   clave:'La pelota pequeña de Pilates con peso aparece en su propia sección para evitar duplicarla. La aptitud para impactos contra el piso debe corresponder al modelo, no a la palabra “medicine”.',
   attrs:'Peso, rebote, construcción, diámetro, uso de impacto, costura',
   m:[
    ['Medicine ball con pique',L('1;2;3;4;5;6','kg'),'Construcción de goma; rebote declarado.'],
    ['Medicine ball con pique pesada',['8 kg'],'Variante de 8 kg con rebote documentado.'],
    ['Slam ball sin pique',L('3;5;7;10','kg'),'Familia sin rebote; variantes publicadas en el catálogo actual.'],
    ['Wall ball sin pique',L('3;6;9;12;15;18','kg'),'Familia para lanzamientos a pared; no se iguala a una slam ball.']
   ]},
  {n:'Steps',c:'yellow',
   intro:'Medidas largo×ancho×alto, en centímetros. Las bases se registran como accesorios.',
   clave:'La altura de una base no acredita por sí sola todas las alturas combinadas del step. Comparar una plataforma con dos bases exige informar qué incluye cada oferta.',
   attrs:'Largo, ancho, altura, material, superficie, bases incluidas',
   m:[
    ['Step compacto de PVC',['44×34×12 cm'],'Plataforma de altura fija.'],
    ['Mini step',['37×37×10 cm'],'Terminaciones publicadas: normal y engomada.'],
    ['Step rectangular estándar',['75×37×10 cm'],'Superficie normal o antideslizante.'],
    ['Step rectangular largo',['100×40×10 cm'],'Superficie antideslizante.'],
    ['Step de fenólico',['50×30×14 cm'],'Construcción de tablero fenólico.'],
    ['Base elevadora de step',['37×37×5 cm'],'Accesorio; no es un step completo.']
   ]},
  {n:'Mats de yoga',c:'green',
   intro:'Largo y ancho en centímetros; espesor en milímetros.',
   clave:'No se intercambian PVC, TPE, NBR y corcho. Los mats de 4 o 6 mm son distintos de las colchonetas de gimnasia de 4 o 5 cm: conservar siempre la unidad.',
   attrs:'Material, capas, largo, ancho, espesor en mm, textura, correas',
   m:[
    ['PVC convencional',['170×62 cm · 4 mm','170×62 cm · 6 mm'],'Un mismo formato con dos variantes de espesor.'],
    ['PVC reversible',['170×62 cm · 6 mm'],'Modelo de doble cara.'],
    ['TPE bicolor',['180×60 cm · 6 mm'],'Doble cara; peso publicado 0,85 kg.'],
    ['TPE con corcho',['183×61 cm · 5 mm'],'Capa de corcho combinada con TPE.'],
    ['NBR',['180×60 cm · 10 mm'],'Incluye correas según la ficha consultada.']
   ]},
  {n:'Conos y señalizadores',c:'white',
   intro:'La altura, la flexibilidad y las perforaciones definen variantes distintas.',
   clave:'Los sets se diferencian por cantidad, altura y diseño. No se publica “pack” sin indicar cuántas piezas incluye.',
   attrs:'Tipo, altura, diámetro o base, flexibilidad, perforación o ranura, cantidad',
   m:[
    ['Mini cono',['8×8 cm'],'Formato mini publicado.'],
    ['Cono convencional',L('17;20;30','cm de alto'),'Sin atribuir flexibilidad cuando la ficha no la declara.'],
    ['Cono flexible',['18 cm de alto'],'Modelo flexible documentado.'],
    ['Cono perforado',L('20;30;40;50;100','cm de alto'),'Perforaciones para montaje de coordinación; la compatibilidad se verifica por ficha.'],
    ['Cono ranurado',L('20;40','cm de alto'),'Ranura superior; familia separada del perforado.'],
    ['Cono tipo tortuga',['7 cm de alto'],'Perfil bajo.'],
    ['Marcador plano de TPE',['Ø14 cm · espesor 1 mm'],'Señalizador plano, no cono volumétrico.'],
    ['Marcador plano de PVC',['Ø19 cm'],'Material y diámetro publicados.'],
    ['Conos numerados',['30 cm · juego 0 a 9'],'Set de diez posiciones numeradas.'],
    ['Conos con vocales',['30 cm · juego de cinco'],'Set de cinco vocales.']
   ]},
  {n:'Elementos de coordinación',c:'iron',
   intro:'Se organizan por función y geometría, sin mezclar accesorios con conjuntos completos.',
   clave:'En escaleras, registrar flejes y espacios por separado: diez flejes no equivalen a diez espacios. En combos, conservar la cantidad de aros, conos, bases y bastones.',
   attrs:'Formato, largo, altura o diámetro, flejes, espacios, piezas incluidas, montaje',
   m:[
    ['Aro plano',['Ø36 cm'],'Aro para circuitos de coordinación.'],
    ['Aro tubular',['Ø50 cm','Ø60 cm','Ø70 cm','Ø80 cm'],'Un modelo con cuatro variantes de diámetro.'],
    ['Dribbling con resorte',L('100;150','cm de alto'),'Poste de entrenamiento con resorte.'],
    ['Escalera de flejes',['4 m · 10 flejes'],'Largo total y número de travesaños publicados.'],
    ['Escalera / valla 2 en 1',['Valla de 15 cm','Valla de 45 cm'],'Dos versiones convertibles documentadas.'],
    ['Cuadrilátero de coordinación',['150×150 cm · 9 espacios'],'Formato de grilla.'],
    ['Valla curva',L('15;30;40','cm de alto'),'Familia de vallas bajas para circuitos.']
   ]},
  {n:'Tobilleras',c:'red',
   intro:'El peso indicado corresponde a una tobillera, salvo aclaración expresa de la ficha.',
   clave:'Una oferta “par de 2 kg” debe aclarar si son 2 kg por pieza o 2 kg totales. En la plataforma esa ambigüedad bloquea una comparación de precio por kg.',
   attrs:'Peso por pieza, par o unidad, relleno, regulable, cierre, dimensiones, polea',
   m:[
    ['Reforzada de peso fijo',L('0,5;1;1,5;2;3;4;5','kg por pieza'),'La presentación por par contiene dos piezas del peso elegido.'],
    ['Regulable con cierre',['Hasta 2 kg por pieza'],'Relleno de arena; medidas publicadas 40×10 cm.'],
    ['Regulable con cierre y granalla',['Hasta 5 kg por pieza'],'Permite retirar relleno; no se inventan incrementos de regulación.'],
    ['Reforzada con abrojo y broche',['5 kg por pieza'],'Cierre combinado; familia distinta de la regulable.'],
    ['Neoprene de peso fijo',['1 kg por pieza','2 kg por pieza'],'Recubrimiento textil de neoprene; presentación por par.'],
    ['Tobillera para polea',['Sin peso incorporado'],'Sujeción para conexión a cable/polea; no se compara por kg de relleno.']
   ]},
  {n:'Bandas de látex',c:'blue',
   intro:'Medidas geométricas y tensión se registran por separado. Los colores no son una escala universal.',
   clave:'Una resistencia declarada en kg depende de la elongación y del método de medición. No se igualan bandas de distintos proveedores solo por color o por una cifra comercial de resistencia.',
   attrs:'Material, forma, ancho, espesor, perímetro o largo doblado, tensión, agarres',
   m:[
    ['Mini band circular',L('0,2;0,3;0,5;0,7;0,8;0,9;1,0;1,1;1,3','mm','5×25 cm'),'5 cm de ancho; 25 cm doblada / 50 cm de perímetro. Un espesor por variante.'],
    ['Banda plana / tira band',L('0,25;0,4;0,6','mm','120×13 cm'),'No es un aro cerrado.'],
    ['Super band circular larga',L('6;13;21;32;45;65','mm de ancho'),'Perímetro 2000 mm; espesor 4,5 mm. Látex publicado por el proveedor.'],
    ['Tubular con manijas, enfundada',['130 cm · tensión baja','130 cm · tensión media','130 cm · tensión alta','130 cm · tensión extra alta'],'Núcleo de látex recubierto en tela.'],
    ['Tubular con tobilleras',['Tubo 30 cm · tobilleras 40 cm'],'Formato con sujeciones para piernas.']
   ]},
  {n:'Bandas de tela',c:'yellow',
   intro:'Se distinguen las bandas tejidas de los tubos de látex que solamente llevan funda textil.',
   clave:'No se mezclan las medidas de dos líneas aunque compartan la palabra “dominadas”. El peso logístico del kit y las dimensiones del paquete no son la resistencia ni las medidas de la banda.',
   attrs:'Tejido, forma, medida comercial, perímetro confirmado, tensión, sectores, set',
   m:[
    ['Circular corta / hip band',L('10;20;30;45','kg de resistencia','6×67 cm'),'Tiras interiores de silicona en la ficha consultada. No se interpreta 67 cm como largo doblado.'],
    ['Circular larga para dominadas',['Tensión baja','Tensión media','Tensión alta'],'150 cm doblada; 300 cm de circunferencia; ancho 5 cm. Tela elástica tejida.'],
    ['Circular de tela para dominadas, kit',['Liviana','Media','Alta'],'Tres variantes de tensión publicadas; sin atribuir a este kit las medidas de otra línea.'],
    ['Elongadora numerada',['90×4,2 cm'],'Formato con sectores/agarres para elongación y danza.']
   ]}
];
/* Textos de la portada: se editan desde el administrador. */
var CONTENT_DEFAULT={
  heroA:'Todo el equipamiento,', heroB:'comparalo en un solo lugar',
  lead:'Juntamos a los proveedores de productos de gimnasio para que compares precio, envío, entrega y garantía del mismo producto, y compres ahí mismo.',
  misionT:'Que equipar un gimnasio sea simple', misionP:'Reunir a todos los proveedores en un solo lugar y mostrar el mismo producto con su precio final, para que cada gimnasio elija con la información completa.',
  visionT:'El punto de encuentro del equipamiento', visionP:'Ser el lugar donde los gimnasios y clubes de Argentina compran mejor, y donde los buenos proveedores venden más.',
  v1T:'Comparaciones justas', v1P:'Solo se compara la misma variante y la misma presentación.',
  v2T:'El orden no se compra', v2P:'Ningún proveedor paga para aparecer primero.',
  v3T:'Precio final a la vista', v3P:'Con el envío incluido, antes de comprar.',
  bandT:'Tu catálogo puede estar acá', bandP:'Sin abono fijo. Escribinos y te contamos cómo sumarte.'
};
function content(k){ var c=db.content||{}; return (c[k]!=null&&String(c[k]).trim()!=='')?c[k]:CONTENT_DEFAULT[k]; }
var CATALOG_BASE=JSON.parse(JSON.stringify(CATALOG));
/* Espacios de la portada: dónde se usa el equipamiento. Se editan desde el administrador. */
var SPACES_BASE=[
 {a:'gym',n:'Gimnasio de musculación',d:'Peso libre para la sala de fuerza.',cats:['Mancuernas','Discos','Barras','Pesas rusas','Colchonetas']},
 {a:'box',n:'Box de entrenamiento funcional',d:'Circuitos, levantamientos y trabajo con el propio peso.',cats:['Pesas rusas','Discos','Barras','Medicine balls','Bandas de látex','Steps']},
 {a:'pilates',n:'Estudio de pilates y yoga',d:'Trabajo en el suelo, estabilidad y elongación.',cats:['Mats de yoga','Pelotas de Pilates','Esferodinamias','Bandas de tela','Bandas de látex','Colchonetas']},
 {a:'club',n:'Club o escuela deportiva',d:'Entrenamiento en cancha para planteles.',cats:['Conos y señalizadores','Elementos de coordinación','Medicine balls','Tobilleras','Bandas de látex']},
 {a:'school',n:'Colegio o colonia',d:'Educación física y juegos para grupos.',cats:['Conos y señalizadores','Elementos de coordinación','Colchonetas','Steps','Pelotas de Pilates']},
 {a:'kine',n:'Kinesiología y rehabilitación',d:'Cargas livianas y ejercicios guiados.',cats:['Bandas de látex','Bandas de tela','Tobilleras','Esferodinamias','Pelotas de Pilates','Mancuernas']}
];
function spaces(){ return db.spaces||SPACES_BASE; }
function img(key){ return (db.images||{})[key]||''; }
/* Clave de demo: en el sitio real se guarda cifrada en el servidor. */
function pwHash(str){ var h1=0xdeadbeef^7, h2=0x41c6ce57^7; for(var i=0,ch;i<str.length;i++){ ch=str.charCodeAt(i); h1=Math.imul(h1^ch,2654435761); h2=Math.imul(h2^ch,1597334677); } h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909); h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909); return (4294967296*(2097151&h2)+(h1>>>0)).toString(36); }
var DEMO_PW='demo1234';
function catBy(name){ return CATALOG.filter(function(c){ return c.n===name; })[0]; }
function modelBy(cat,name){ var c=catBy(cat); return c?c.m.filter(function(m){ return m[0]===name; })[0]:null; }

function O(id,vendorId,category,model,size,unit,price,stock,minQty,lead,warranty,shipAmba,shipInt,status,detail){
  return {id:id,vendorId:vendorId,category:category,model:model,size:size,unit:unit,price:price,stock:stock,minQty:1,lead:lead,warranty:warranty,shipAmba:shipAmba,shipInt:shipInt,status:status,detail:detail||''};
}
/* Clics de ejemplo para que las estadísticas no arranquen vacías. Los reales se suman al navegar. */
function seedClicks(){
  var P=[['Mancuernas|Hexagonal engomada|10 kg',64,88,41],['Discos|Bumper de caucho virgen|Ø50 mm · 20 kg',31,47,23],['Mancuernas|Plástica PVC rellena|2 kg',22,35,19],
    ['Pesas rusas|Hierro fundido sin recubrimiento elastomérico|16 kg',28,33,15],['Colchonetas|Gimnasia rectangular 100×50|100×50×4 cm',25,29,12],['Barras|Recta olímpica 20 kg|Ø50 mm · 220 cm · 20 kg',15,21,11],
    ['Mats de yoga|PVC convencional|170×62 cm · 6 mm',18,26,9],['Discos|Bumper de competición|Orificio 50,4 mm · 20 kg',9,14,6],['Conos y señalizadores|Cono convencional|20 cm de alto',7,12,5]];
  var V=[['v1',96,131,58],['v2',74,102,49],['v3',51,77,30]], M=['2026-08','2026-09','2026-10'], out={p:{},v:{},a:{}};
  M.forEach(function(m,i){ out.p[m]={}; out.v[m]={}; P.forEach(function(r){ out.p[m][r[0]]=r[i+1]; }); V.forEach(function(r){ out.v[m][r[0]]=r[i+1]; }); });
  return out;
}
function seed(){
  var HE='Hexagonal engomada', BU='Bumper de caucho virgen', HF='Hierro fundido sin recubrimiento elastomérico';
  var d={
    commission:10, nextOrder:1043, nextId:100,
    ad:{on:true,items:[
      {id:'a1',brand:'',text:'Espacio publicitario disponible',url:'',on:true,where:'all'},
      {id:'a2',brand:'',text:'Tu marca puede estar acá',url:'',on:true,where:'all'},
      {id:'a3',brand:'',text:'Consultá por este cartel',url:'',on:true,where:'all'},
      {id:'a4',brand:'',text:'Llegá a gimnasios y clubes',url:'',on:true,where:'all'}]},
    contact:{wa:''}, clicks:seedClicks(), traffic:{demo:true,days:{},q:{},z:{}}, images:{}, log:[], invoiced:{}, notifs:[], prefs:{email:'',price:true,sale:true,refund:true,vendor:true,product:true,late:true,mp:true,data:false,ship:false},
    users:[{id:'u1',name:'Nicolás',user:'nicolas',hash:pwHash(DEMO_PW),last:''},{id:'u2',name:'Lucas',user:'lucas',hash:pwHash(DEMO_PW),last:''}],
    vendors:[
      {id:'v1',name:'Marca A',type:'Fabricante',cuit:'30-00000001-7',contact:'Contacto de Marca A',email:'ventas@marca-a.example',phone:'11 4000-0001',status:'active',mp:true,commission:null,
       razon:'Marca A S.A.',iva:'Responsable inscripto',role:'Gerente comercial',wa:'5491140000001',web:'https://marca-a.example',ig:'@marca.a',address:'Av. de ejemplo 1234',city:'Ciudad de Buenos Aires',prov:'CABA',zones:['amba','pais'],hours:'Lunes a viernes de 9 a 18',about:'Fabricamos mancuernas, discos y pesas rusas desde hace 15 años.',since:'2026-07-20'},
      {id:'v2',name:'Marca B',type:'Distribuidor',cuit:'30-00000002-5',contact:'Contacto de Marca B',email:'hola@marca-b.example',phone:'341 400-0002',status:'active',mp:true,commission:null,
       razon:'Marca B S.R.L.',iva:'Responsable inscripto',role:'Dueña',wa:'5493414000002',web:'',ig:'@marcab.fitness',address:'Calle de ejemplo 567',city:'Rosario',prov:'Santa Fe',zones:['pais'],hours:'Lunes a sábado de 8 a 16',about:'Distribuimos equipamiento de fuerza y funcional para gimnasios.',since:'2026-07-28'},
      {id:'v3',name:'Marca C',type:'Importador',cuit:'',contact:'Contacto de Marca C',email:'info@marca-c.example',phone:'',status:'active',mp:true,commission:null,
       razon:'',iva:'',role:'',wa:'',web:'',ig:'',address:'',city:'Córdoba',prov:'Córdoba',zones:['retiro'],hours:'',about:'',since:'2026-08-05'},
      {id:'v4',name:'Marca D',type:'Distribuidor',cuit:'30-00000004-1',contact:'Contacto de Marca D',email:'altas@marca-d.example',phone:'11 4000-0004',status:'pending',mp:false,commission:null,since:'2026-10-06'}
    ],
    offers:[
      O('o1','v1','Mancuernas',HE,'10 kg','Unidad',58000,'stock',10,5,12,45000,78000,'published'),
      O('o2','v2','Mancuernas',HE,'10 kg','Unidad',61500,'stock',1,3,6,0,52000,'published'),
      O('o3','v3','Mancuernas',HE,'10 kg','Unidad',64900,'order',4,7,24,30000,60000,'published'),
      O('o4','v1','Mancuernas',HE,'15 kg','Unidad',87000,'stock',10,5,12,45000,78000,'published'),
      O('o5','v2','Mancuernas',HE,'15 kg','Unidad',91500,'stock',1,3,6,0,52000,'published'),
      O('o6','v1','Mancuernas','Hexagonal de fundición','10 kg','Unidad',49000,'stock',10,5,12,45000,78000,'published'),
      O('o7','v3','Mancuernas','Hexagonal de fundición','10 kg','Unidad',52500,'stock',4,7,24,30000,60000,'published'),
      O('o29','v1','Mancuernas','Plástica PVC rellena','2 kg','Unidad',6900,'stock',10,5,12,45000,78000,'published'),
      O('o30','v2','Mancuernas','Plástica PVC rellena','2 kg','Unidad',7400,'stock',1,3,6,0,52000,'published'),
      O('o31','v3','Mancuernas','Plástica PVC rellena','2 kg','Unidad',7900,'stock',4,7,24,30000,60000,'published'),
      O('o8','v2','Discos',BU,'Ø50 mm · 20 kg','Unidad',89000,'stock',2,3,6,0,60000,'published'),
      O('o9','v3','Discos',BU,'Ø50 mm · 20 kg','Unidad',94000,'stock',2,7,24,30000,60000,'published'),
      O('o10','v1','Discos',BU,'Ø50 mm · 20 kg','Unidad',92000,'order',4,10,12,45000,78000,'review'),
      O('o11','v3','Barras','Recta olímpica 20 kg','Ø50 mm · 220 cm · 20 kg','Unidad',180000,'stock',1,7,24,30000,60000,'published'),
      O('o12','v1','Barras','Recta olímpica 20 kg','Ø50 mm · 220 cm · 20 kg','Unidad',172000,'stock',2,5,12,45000,78000,'published'),
      O('o13','v1','Pesas rusas',HF,'16 kg','Unidad',45000,'stock',4,5,12,45000,78000,'published'),
      O('o14','v2','Pesas rusas',HF,'16 kg','Unidad',47500,'stock',1,3,6,0,52000,'published'),
      O('o15','v1','Colchonetas','Gimnasia rectangular 100×50','100×50×4 cm','Unidad',18500,'stock',10,5,12,45000,78000,'published','Funda de cordura'),
      O('o16','v2','Colchonetas','Gimnasia rectangular 100×50','100×50×4 cm','Unidad',17900,'stock',5,3,6,0,52000,'published','Funda de bagún'),
      O('o17','v2','Mats de yoga','PVC convencional','170×62 cm · 6 mm','Unidad',14500,'stock',5,3,6,0,52000,'published'),
      O('o18','v3','Mats de yoga','PVC convencional','170×62 cm · 6 mm','Unidad',15900,'stock',2,7,12,30000,60000,'published'),
      O('o19','v1','Medicine balls','Wall ball sin pique','9 kg','Unidad',52000,'stock',2,5,12,45000,78000,'published'),
      O('o20','v3','Medicine balls','Wall ball sin pique','9 kg','Unidad',55000,'order',1,7,24,30000,60000,'published'),
      O('o21','v2','Steps','Step rectangular estándar','75×37×10 cm','Unidad',38000,'stock',2,3,6,0,52000,'published','Superficie antideslizante'),
      O('o22','v1','Steps','Step rectangular estándar','75×37×10 cm','Unidad',36500,'stock',6,5,12,45000,78000,'published','Superficie normal'),
      O('o23','v2','Bandas de látex','Mini band circular','5×25 cm · 0,5 mm','Unidad',2900,'stock',10,3,6,0,52000,'published'),
      O('o24','v3','Bandas de látex','Mini band circular','5×25 cm · 0,5 mm','Unidad',3100,'stock',5,7,12,30000,60000,'published'),
      O('o25','v1','Tobilleras','Reforzada de peso fijo','2 kg por pieza','Par',21000,'stock',4,5,12,45000,78000,'published'),
      O('o26','v2','Tobilleras','Reforzada de peso fijo','2 kg por pieza','Par',22500,'stock',1,3,6,0,52000,'published'),
      O('o27','v3','Esferodinamias','Esférica convencional','65 cm','Unidad',19500,'stock',2,7,12,30000,60000,'published'),
      O('o28','v2','Esferodinamias','Esférica convencional','65 cm','Unidad',20500,'stock',1,3,6,0,52000,'published')
    ],
    orders:[
      {id:1042,date:'2026-10-05',buyer:'Gimnasio de ejemplo',vendorId:'v1',desc:'Mancuernas: Hexagonal engomada, 10 kg',qty:20,subtotal:1160000,shipping:45000,pct:10,commission:116000,status:'approved',shipped:false},
      {id:1041,date:'2026-10-04',buyer:'Club de ejemplo',vendorId:'v2',desc:'Discos: Bumper de caucho virgen, Ø50 mm · 20 kg',qty:10,subtotal:890000,shipping:0,pct:10,commission:89000,status:'approved',shipped:true},
      {id:1040,date:'2026-10-02',buyer:'Box de ejemplo',vendorId:'v3',desc:'Barras: Recta olímpica 20 kg, Ø50 mm · 220 cm · 20 kg',qty:4,subtotal:720000,shipping:30000,pct:10,commission:72000,status:'approved',shipped:true},
      {id:1039,date:'2026-10-01',buyer:'Estudio de ejemplo',vendorId:'v1',desc:'Pesas rusas: Hierro fundido sin recubrimiento elastomérico, 16 kg',qty:12,subtotal:540000,shipping:45000,pct:10,commission:54000,status:'refunded',shipped:false},
      {id:1038,date:'2026-09-25',buyer:'Box de ejemplo',vendorId:'v1',desc:'Pesas rusas: Hierro fundido sin recubrimiento elastomérico, 16 kg',qty:16,subtotal:720000,shipping:45000,pct:10,commission:72000,status:'approved',shipped:false},
      {id:1037,date:'2026-09-18',buyer:'Estudio de ejemplo',vendorId:'v2',desc:'Steps: Step rectangular estándar, 75×37×10 cm',qty:15,subtotal:570000,shipping:0,pct:10,commission:57000,status:'approved',shipped:true},
      {id:1036,date:'2026-09-11',buyer:'Box de ejemplo',vendorId:'v3',desc:'Medicine balls: Wall ball sin pique, 9 kg',qty:8,subtotal:440000,shipping:30000,pct:10,commission:44000,status:'approved',shipped:true},
      {id:1035,date:'2026-09-03',buyer:'Gimnasio de ejemplo',vendorId:'v1',desc:'Mancuernas: Hexagonal engomada, 10 kg',qty:30,subtotal:1740000,shipping:45000,pct:10,commission:174000,status:'approved',shipped:true},
      {id:1034,date:'2026-08-27',buyer:'Estudio de ejemplo',vendorId:'v2',desc:'Mats de yoga: PVC convencional, 170×62 cm · 6 mm',qty:20,subtotal:290000,shipping:0,pct:10,commission:29000,status:'approved',shipped:true},
      {id:1033,date:'2026-08-22',buyer:'Centro de ejemplo',vendorId:'v3',desc:'Esferodinamias: Esférica convencional, 65 cm',qty:10,subtotal:195000,shipping:30000,pct:10,commission:19500,status:'approved',shipped:true},
      {id:1032,date:'2026-08-14',buyer:'Club de ejemplo',vendorId:'v1',desc:'Colchonetas: Gimnasia rectangular 100×50, 100×50×4 cm',qty:30,subtotal:555000,shipping:45000,pct:10,commission:55500,status:'approved',shipped:true},
      {id:1031,date:'2026-08-06',buyer:'Gimnasio de ejemplo',vendorId:'v2',desc:'Mancuernas: Hexagonal engomada, 15 kg',qty:12,subtotal:1098000,shipping:0,pct:10,commission:109800,status:'approved',shipped:true}
    ]
  };
  /* Marca de ejemplo por proveedor: cada oferta lleva su proveedor y su marca. */
  /* Cada proveedor es una marca: la marca de la oferta queda vacía salvo que venda otra. */
  d.offers.forEach(function(o){ o.brand=''; });
  /* Fecha del último cambio de precio: los de Nicolás quedan viejos a propósito, para mostrar la alerta. */
  var upd={v1:'2026-10-01',v2:'2026-09-30',v3:'2026-08-20'};
  d.offers.forEach(function(o){ o.updated=upd[o.vendorId]||'2026-10-01'; });
  /* Plazo de entrega prometido en cada pedido (días hábiles). */
  var lead={v1:5,v2:3,v3:7};
  d.orders.forEach(function(o){ o.lead=lead[o.vendorId]||5; o.lateN=true; o.lateV=true; });
  seedActivity(d); seedShipping(d); seedBuyers(d);
  return d;
}
/* Ingresos al panel y actividad de ejemplo de cada proveedor. */
function seedActivity(d){
  var plan={v1:[26,1],v2:[14,3],v3:[4,18]}, base=new Date('2026-10-08T12:00:00');
  d.vendors.forEach(function(v){
    v.logins=[]; v.act=[];
    var p=plan[v.id]; if(!p) return;
    var r=hrand0('lg'+v.id), t=new Date(base.getTime()-p[1]*864e5);
    for(var i=0;i<p[0];i++){ t.setHours(8+Math.floor(r()*12),Math.floor(r()*60)); v.logins.push(t.toISOString()); t=new Date(t.getTime()-(1+Math.floor(r()*5))*864e5); }
    v.act=[{t:v.logins[0],what:'entró al panel'},{t:addDays0(v.logins[0].slice(0,10),-2)+'T15:20:00',what:'actualizó precios'},{t:(v.since||'2026-08-01')+'T11:00:00',what:'se sumó al sitio'}];
  });
}
function hrand0(str){ var h=2166136261; for(var i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return function(){ h=(h+0x6D2B79F5)|0; var t=h; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
function addDays0(iso,n){ var d=new Date(iso+'T12:00:00'); d.setDate(d.getDate()+n); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
/* Novedades para el administrador: ventas, altas, productos nuevos, devoluciones... Los numeritos salen de acá. */
function notify(kind,tab,text,ref){
  db.notifs=db.notifs||[]; db.nextN=(db.nextN||1);
  db.notifs.unshift({id:db.nextN++,t:new Date().toISOString(),kind:kind,tab:tab,text:text,ref:ref||'',read:false});
  if(db.notifs.length>200) db.notifs.length=200;
}
/* Actividad de cada proveedor, para su ficha. */
/* Datos que carga cada proveedor sobre su empresa. Los ve el administrador en la ficha. */
var VFIELDS=[
  ['Empresa',[['name','Nombre de la marca'],['razon','Razón social'],['cuit','CUIT'],['iva','Condición frente al IVA','sel',['','Responsable inscripto','Monotributo','Exento']],['type','Tipo de proveedor','sel',['Fabricante','Importador','Distribuidor']]]],
  ['Contacto',[['contact','Persona de contacto'],['role','Cargo'],['email','Email','email'],['phone','Teléfono','tel'],['wa','WhatsApp','tel']]],
  ['Dónde está',[['address','Dirección'],['city','Ciudad'],['prov','Provincia'],['hours','Horario de atención']]],
  ['En internet',[['web','Sitio web','url'],['ig','Instagram']]],
  ['Sobre la empresa',[['about','Qué vende y desde cuándo','area']]]
];
var ZONES=[['amba','Envía a AMBA'],['pais','Envía a todo el país'],['retiro','Retiro en depósito']];
function vComplete(v){
  var keys=[]; VFIELDS.forEach(function(g){ g[1].forEach(function(f){ keys.push(f); }); });
  var miss=keys.filter(function(f){ return !String(v[f[0]]||'').trim(); }).map(function(f){ return f[1].toLowerCase(); });
  if(!(v.zones&&v.zones.length)) miss.push('zonas de envío');
  var total=keys.length+1; return {pct:Math.round((total-miss.length)/total*100),miss:miss};
}
/* Novedades de cada proveedor: ventas, aprobaciones, stock... Sus numeritos salen de acá. */
function vnotify(vid,kind,tab,text,ref){
  var v=vendor(vid); if(!v) return; v.notifs=v.notifs||[]; db.nextN=(db.nextN||1);
  v.notifs.unshift({id:db.nextN++,t:new Date().toISOString(),kind:kind,tab:tab,text:text,ref:ref||'',read:false});
  if(v.notifs.length>150) v.notifs.length=150;
}
/* Envíos: datos de entrega de ejemplo y transportistas. */
var CARRIERS=['Andreani','OCA','Correo Argentino','Vía Cargo','Transporte propio','Retiro en depósito','Otro'];
function seedShipping(d){
  var addr={'Gimnasio de ejemplo':['Av. de ejemplo 100','Ciudad de Buenos Aires','CABA','1425'],'Club de ejemplo':['Calle del club 200','La Plata','Buenos Aires','1900'],'Box de ejemplo':['Pasaje de ejemplo 30','Rosario','Santa Fe','2000'],'Estudio de ejemplo':['Calle de ejemplo 450','Córdoba','Córdoba','5000'],'Centro de ejemplo':['Av. del centro 77','Mendoza','Mendoza','5500']};
  d.orders.forEach(function(o,i){
    if(o.ship) return;
    var a=addr[o.buyer]||['Calle de ejemplo 1','Ciudad de Buenos Aires','CABA','1425'];
    o.ship={name:'Compras '+o.buyer,phone:'11 5000-00'+String(10+i),email:'compras@'+plain(o.buyer).replace(/[^a-z]/g,'')+'.example',address:a[0],city:a[1],prov:a[2],cp:a[3],notes:i%3===0?'Recibir de 9 a 13 h':''};
    if(o.shipped&&!o.carrier){ o.carrier=CARRIERS[i%3]; o.tracking=['AND','OCA','CA'][i%3]+'-'+String(48213+i*317); o.shippedAt=addDays0(o.date,2); if(o.date<'2026-09-20'){ o.delivered=true; o.deliveredAt=addDays0(o.date,6); } }
  });
}
/* Cuentas de compradores de ejemplo */
function seedBuyers(d){
  d.buyers=[{id:'b1',name:'Gimnasio de ejemplo',contact:'Área de compras',email:'compras@gimnasiodeejemplo.example',hash:pwHash(DEMO_PW),phone:'11 5000-0010',cuit:'30-00000099-1',iva:'Responsable inscripto',
    addresses:[{id:'ad1',label:'Sede Palermo',address:'Av. de ejemplo 100',city:'Ciudad de Buenos Aires',prov:'CABA',cp:'1425',notes:'Recibir de 9 a 13 h',def:true},{id:'ad2',label:'Sede Belgrano',address:'Calle de ejemplo 2300',city:'Ciudad de Buenos Aires',prov:'CABA',cp:'1428',notes:'',def:false}],
    favs:[{cat:'Mancuernas',model:'Hexagonal engomada',size:'10 kg',unit:'Unidad',price:66000,alert:true,t:'2026-09-20'},{cat:'Discos',model:'Bumper de caucho virgen',size:'Ø50 mm · 20 kg',unit:'Unidad',price:92000,alert:false,t:'2026-09-28'}],
    marketing:true,created:'2026-08-01',logins:['2026-10-05T10:12:00.000Z','2026-09-29T15:40:00.000Z','2026-09-03T09:20:00.000Z','2026-08-20T18:05:00.000Z'],via:'email'}];
  seedBuyers2(d);
}
function seedBuyers2(d){
  if(d.buyers.some(function(b){ return b.id==='b2'; })) return;
  var mk=function(id,name,email,via,created,logins,city,prov,cp,extra){ var b={id:id,name:name,contact:'',email:email,hash:pwHash(DEMO_PW),phone:'',cuit:'',iva:'Consumidor final',addresses:city?[{id:'ad'+id,label:'Principal',address:'Calle de ejemplo 10',city:city,prov:prov,cp:cp,notes:'',def:true}]:[],favs:[],marketing:false,created:created,logins:logins,via:via}; for(var k in extra) b[k]=extra[k]; return b; };
  d.buyers.push(
    mk('b2','Club de ejemplo','compras@clubdeejemplo.example','google','2026-08-12',['2026-10-07T21:10:00.000Z','2026-10-04T12:00:00.000Z','2026-09-18T19:30:00.000Z'],'La Plata','Buenos Aires','1900',{marketing:true,phone:'221 400-0002',iva:'Exento',favs:[{cat:'Conos y señalizadores',model:'Cono convencional',size:'20 cm de alto',unit:'Unidad',price:2500,alert:true,t:'2026-10-01'}]}),
    mk('b3','Box de ejemplo','compras@boxdeejemplo.example','quick','2026-09-11',['2026-09-25T16:45:00.000Z'],'Rosario','Santa Fe','2000',{phone:'341 400-0003',cuit:'30-00000033-3',iva:'Responsable inscripto'}),
    mk('b4','Estudio de ejemplo','compras@estudiodeejemplo.example','email','2026-08-27',['2026-08-27T11:00:00.000Z'],'Córdoba','Córdoba','5000',{marketing:true,iva:'Monotributo'}),
    mk('b5','Gimnasio nuevo de ejemplo','hola@gimnasionuevo.example','google','2026-10-06',['2026-10-06T20:15:00.000Z'],'Mendoza','Mendoza','5500',{marketing:true,favs:[{cat:'Discos',model:'Bumper de caucho virgen',size:'Ø50 mm · 20 kg',unit:'Unidad',price:96000,alert:true,t:'2026-10-06'},{cat:'Barras',model:'Recta olímpica 20 kg',size:'Ø50 mm · 220 cm · 20 kg',unit:'Unidad',price:172000,alert:true,t:'2026-10-06'}]})
  );
}
/* El producto de un pedido viejo, a partir de su descripción. */
function orderOffer(o){
  if(o.offerId&&offer(o.offerId)) return offer(o.offerId);
  var p=String(o.desc).split(': '), cat=p[0], rest=p.slice(1).join(': '), i=rest.lastIndexOf(', '), model=rest.slice(0,i), size=rest.slice(i+2);
  return db.offers.filter(function(x){ return x.vendorId===o.vendorId&&x.category===cat&&x.model===model&&x.size===size; })[0]||null;
}
function shipStage(o){ return o.status==='refunded'?'refunded':(o.delivered?'delivered':(o.shipped?'shipped':'paid')); }
function vact(v,what){ if(!v) return; v.act=v.act||[]; v.act.unshift({t:new Date().toISOString(),what:what}); if(v.act.length>100) v.act.length=100; }
function load(){
  var d=null;
  d=CF.read(STORE);
  if(!d) d=seed();
  if(!d.ad) d.ad={on:true,items:[]};
  if(!d.ad.items&&!d.ad.lines){ var one=((d.ad.advertiser?d.ad.advertiser+': ':'')+(d.ad.text||'')).trim(); d.ad.lines=one?[one]:[]; }
  if(!d.ad.items) d.ad.items=(d.ad.lines||[]).map(function(s,i){ return {id:'a'+i,brand:'',text:s,url:d.ad.url||'',on:true}; });
  if(!d.contact) d.contact={wa:''};
  d.offers.forEach(function(o){ o.minQty=1; if(!o.volumeTiers) o.volumeTiers=[]; if(!o.updated) o.updated='2026-10-01';
    if(o.units===undefined){ var r=hrand0('u'+o.id)(); o.units=o.stock==='order'?null:(o.stock==='none'?0:[6,8,14,30,45,80,120,200][Math.floor(r*8)]); if(o.id==='o1') o.units=7; if(o.id==='o29') o.units=4; o.lowAt=null; } });
  d.orders.forEach(function(o){ if(o.lead==null) o.lead=5; });
  if(!d.clicks) d.clicks={};
  ['p','v','a'].forEach(function(k){ if(!d.clicks[k]) d.clicks[k]={}; });
  if(!d.traffic) d.traffic={demo:true,days:{},q:{},z:{}};
  if(!d.images) d.images={}; if(!d.log) d.log=[]; if(!d.invoiced) d.invoiced={};
  if(!d.notifs){ d.notifs=[]; d.orders.forEach(function(o){ o.lateN=true; }); }
  if(!d.prefs) d.prefs={email:'',sale:true,refund:true,vendor:true,product:true,late:true,mp:true,data:false,ship:false};
  if(!d.vendors.some(function(v){ return v.logins; })) seedActivity(d);
  d.vendors.forEach(function(v){ if(!v.logins) v.logins=[]; if(!v.act) v.act=[]; if(!v.notifs){ v.notifs=[]; d.orders.forEach(function(o){ if(o.vendorId===v.id) o.lateV=true; }); } if(!v.views) v.views=[]; });
  d.vendors.forEach(function(v){
    if(!v.paymentBenefits) v.paymentBenefits={transfer:0,cash:0,installments:[],stackVolume:true};
    if(!v.benefitsPolicy20261008&&(norm(v.name)==='ab fitness'||(v.id==='v1'&&v.name==='Marca A'))){
      if(v.name==='Marca A') v.name='AB Fitness';
      v.paymentBenefits.transfer=10;v.paymentBenefits.cash=10;
      v.freeShipping={mode:'from',zone:'amba',threshold:50000,postalCodes:[]};v.benefitsPolicy20261008=true;
    }
  });
  seedShipping(d);
  if(!d.buyers) seedBuyers(d); else seedBuyers2(d);
  if(!d.users||!d.users.length) d.users=[{id:'u1',name:'Nicolás',user:'nicolas',hash:pwHash(DEMO_PW),last:''},{id:'u2',name:'Lucas',user:'lucas',hash:pwHash(DEMO_PW),last:''}];
  d.vendors.forEach(function(v){ if(v.user==null){ v.user=v.status==='pending'?'':plain(v.name).replace(/[^a-z0-9]/g,''); v.hash=v.user?pwHash(DEMO_PW):''; } });
  CATALOG=d.catalog||JSON.parse(JSON.stringify(CATALOG_BASE));
  ['days','q','z'].forEach(function(k){ if(!d.traffic[k]) d.traffic[k]={}; });
  return d;
}
function save(){ return CF.write(STORE,db); }
function sget(k){ try{ return sessionStorage.getItem(k); }catch(e){ return null; } }
function sset(k,v){ try{ if(v==null) sessionStorage.removeItem(k); else sessionStorage.setItem(k,v); }catch(e){} }

var db=load();
var app=document.getElementById('app');
var toastEl=document.getElementById('toast');
var toastTimer=null;

function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function money(n){ return '$ '+amount(Number(n)).toLocaleString('es-AR',{maximumFractionDigits:2}); }
function fdate(iso){ var p=String(iso).split('-'); return p[2]+'/'+p[1]; }
function today(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function norm(s){ return String(s||'').trim().toLowerCase().replace(/\s+/g,' '); }
function plain(s){ var t=norm(s); try{ t=t.normalize('NFD').replace(/[̀-ͯ]/g,''); }catch(e){} return t; }
function digits(s){ var n=parseInt(String(s==null?'':s).replace(/\D/g,''),10); return isNaN(n)?0:n; }
function val(id){ var el=document.getElementById(id); return el?el.value:''; }
function setText(id,t){ var el=document.getElementById(id); if(el) el.textContent=t; }
function vendor(id){ return db.vendors.filter(function(v){ return v.id===id; })[0]; }
function offer(id){ return db.offers.filter(function(o){ return o.id===id; })[0]; }
function order(id){ return db.orders.filter(function(o){ return o.id===+id; })[0]; }
function pctOf(v){ return (v&&v.commission!=null)?v.commission:db.commission; }
function vkey(cat,model,size){ return [cat,model,size].map(norm).join('|'); }
function keyOf(o){ return vkey(o.category,o.model,o.size)+'|'+norm(o.unit); }
function isLive(o){ var v=vendor(o.vendorId); return o.status==='published'&&o.stock!=='none'&&!!v&&v.status==='active'&&v.mp; }
/* Ofertas publicadas agrupadas por variante del catálogo. */
function liveIndex(){
  var map={};
  db.offers.filter(isLive).forEach(function(o){ var k=vkey(o.category,o.model,o.size); (map[k]=map[k]||[]).push(o); });
  return map;
}
function unitsIn(list){ var seen=[]; list.forEach(function(o){ if(seen.indexOf(o.unit)<0) seen.push(o.unit); }); return seen; }
function mainUnit(list){
  var best=null,n=0;
  unitsIn(list).forEach(function(u){ var c=list.filter(function(o){ return o.unit===u; }).length; if(c>n){ n=c; best=u; } });
  return best;
}
function cpOk(cp){ return /^\d{4}$/.test(String(cp).trim()); }
function zone(cp){ return /^1\d{3}$/.test(String(cp).trim())?'amba':'interior'; }
function zoneName(cp){ return zone(cp)==='amba'?'AMBA':'resto del país'; }

/* Beneficios comerciales: sin mínimo, volumen por producto y envío por proveedor. */
function amount(n){ return Math.round((n+Number.EPSILON)*100)/100; }
function volumePct(o,qty){ return (o.volumeTiers||[]).reduce(function(p,t){ return qty>=t.qty?Math.max(p,t.pct):p; },0); }
function freeShipping(v,sub,cp){
  var f=(v||{}).freeShipping||{};
  return shippingZoneEligible(f,cp)&&(f.mode==='always'||(f.mode==='from'&&sub>=f.threshold));
}
function benefitText(o){
  var v=vendor(o.vendorId), f=(v||{}).freeShipping||{}, a=['Sin mínimo de compra'];
  if((o.volumeTiers||[]).length) a.push('Volumen: '+o.volumeTiers.map(function(t){ return t.pct+'% desde '+t.qty+' '+(o.unit==='Par'?'pares':o.unit==='Kit'?'kits':'unidades'); }).join(' · '));
  if(f.mode==='always'||f.mode==='from') a.push('Envío gratis'+(f.mode==='from'?' desde '+money(f.threshold)+' en productos de este proveedor, después de descuentos':'')+' · '+(f.zone==='amba'?'CABA y alrededores':f.zone==='interior'?'resto del país':'todo el país'));
  return '<p class="note">'+a.join('<br>')+'</p>';
}
function volumeFields(o){
  return '<fieldset style="margin:16px 0"><legend>Descuentos por volumen</legend><p class="note">Opcionales. Se aplica el mayor descuento alcanzado, sin acumular escalas, sobre todo el importe de este producto. Cantidad en la presentación publicada (unidad, par o kit).</p><div class="formgrid">'+[0,1,2].map(function(i){ var t=(o.volumeTiers||[])[i]||{}; return '<div class="field"><label for="vol-q-'+i+'">Escala '+(i+1)+' · desde cantidad</label><input id="vol-q-'+i+'" type="number" min="2" step="1" value="'+(t.qty||'')+'"></div><div class="field"><label for="vol-p-'+i+'">Descuento (%)</label><input id="vol-p-'+i+'" type="number" min="0.01" max="99.99" step="0.01" value="'+(t.pct||'')+'"></div>'; }).join('')+'</div></fieldset>';
}
function readVolume(){
  var tiers=[];
  for(var i=0;i<3;i++){ var q=val('vol-q-'+i).trim(),p=val('vol-p-'+i).trim(); if(!q&&!p) continue;
    var n=Number(q),d=Number(p);
    if(!q||!p||!Number.isInteger(n)||n<2||!Number.isFinite(d)||d<=0||d>=100) throw Error('Cada escala necesita una cantidad entera desde 2 y un descuento mayor a 0 y menor a 100%.');
    if(tiers.some(function(t){ return t.qty===n; })) throw Error('Las cantidades de las escalas no pueden repetirse.');
    tiers.push({qty:n,pct:amount(d)});
  }
  tiers.sort(function(a,b){return a.qty-b.qty;});
  for(var j=1;j<tiers.length;j++) if(tiers[j].pct<=tiers[j-1].pct) throw Error('El descuento debe aumentar al subir la cantidad.');
  return tiers;
}
function promotionForm(v){
  var f=v.freeShipping||{mode:'none',zone:'all',threshold:0};
  function options(list,value){return list.map(function(x){return '<option value="'+x[0]+'"'+(value===x[0]?' selected':'')+'>'+x[1]+'</option>';}).join('');}
  return '<form id="promotion-form" data-vendor="'+esc(v.id)+'" class="card" novalidate style="margin-top:20px"><h2 class="display h-card">Envío gratis y beneficios</h2><div id="promo-err" class="alert bad" hidden role="alert"></div><p class="note">La página no tiene mínimo de compra. El proveedor decide si ofrece envío gratis y asume su costo. Los descuentos por volumen se configuran al editar cada producto.</p><div class="formgrid"><div class="field"><label for="promo-mode">Envío gratis</label><select id="promo-mode">'+options([['none','Sin promoción adicional'],['always','En todas las compras'],['from','Desde un importe']],f.mode)+'</select></div><div class="field"><label for="promo-zone">Zona de la promoción</label><select id="promo-zone">'+options([['all','Todo el país'],['amba','CABA y alrededores'],['interior','Resto del país']],f.zone)+'</select></div><div class="field"><label for="promo-threshold">Importe para envío gratis ($)</label><input id="promo-threshold" type="number" min="0" step="0.01" value="'+(f.threshold||'')+'"><span class="hint">Solo para “Desde un importe”. Suma los productos de este proveedor después de los descuentos, sin incluir envío.</span></div><div class="field"><label for="promo-postal">Códigos postales cubiertos (opcional)</label><input id="promo-postal" type="text" placeholder="1425, 1602, 1636" value="'+esc((f.postalCodes||[]).join(', '))+'"><span class="hint">Para limitar la cobertura exacta, cargá los códigos de 4 dígitos separados por comas. Vacío usa la zona general de la demo; confirmar cobertura con la dirección antes del despacho.</span></div></div>'+paymentFields(v)+'<p class="note">Comisión del sitio: '+pctOf(v)+'% sobre los productos ya descontados. El envío cobrado se acredita al proveedor. Los costos del cobro se calculan aparte en la integración real.</p><button class="btn btn-accent" type="submit">Guardar beneficios</button></form>';
}
function submitPromotion(ev){
  if(ev.target.id!=='promotion-form') return false;
  ev.preventDefault(); var v=vendor(ev.target.getAttribute('data-vendor'));
  if(!v||!me()||(typeof AKEY==='undefined'&&me().id!==v.id)) return true;
  var mode=val('promo-mode'),z=val('promo-zone'),th=Number(val('promo-threshold'));
  if(['none','always','from'].indexOf(mode)<0||['all','amba','interior'].indexOf(z)<0||!Number.isFinite(th)||th<0||(mode==='from'&&th<=0)){
    var b=document.getElementById('promo-err'); b.textContent='Indicá un importe mayor a cero para ofrecer envío gratis desde un monto.'; b.hidden=false; return true;
  }
  var benefits,codes=val('promo-postal').trim()?val('promo-postal').split(',').map(function(x){return x.trim();}):[];
  try{ benefits=readPaymentBenefits();if(mode!=='none'&&z==='amba'&&!codes.length)throw Error('Cargá los códigos postales exactos cubiertos por el envío gratis.');if(codes.some(function(x){return !/^\d{4}$/.test(x);}))throw Error('Los códigos postales deben tener cuatro dígitos, separados por comas.'); }catch(err){var eb=document.getElementById('promo-err');eb.textContent=err.message;eb.hidden=false;return true;}
  v.paymentBenefits=benefits;v.freeShipping={mode:mode,zone:z,threshold:mode==='from'?amount(th):0,postalCodes:codes};
  if(typeof AKEY!=='undefined') logAct('actualizó el envío gratis de '+v.name); else vact(v,'actualizó su beneficio de envío gratis');
  save(); rerender(); toast('Beneficios guardados'); return true;
}

function payBenefits(v){ return (v||{}).paymentBenefits||{transfer:0,cash:0,installments:[],stackVolume:true}; }
function payPct(v,method){var b=payBenefits(v);return method==='transfer'?b.transfer||0:method==='cash'?b.cash||0:0;}
function payLabel(method){return method==='transfer'?'Transferencia':method==='cash'?'Efectivo':method&&method.indexOf('installments-')===0?method.split('-')[1]+' cuotas sin interés':'Tarjeta · un pago';}
function validMethod(v,method){var b=payBenefits(v);return method==='card'||method==='transfer'&&b.transfer>0||method==='cash'&&b.cash>0||method&&method.indexOf('installments-')===0&&(b.installments||[]).indexOf(Number(method.split('-')[1]))>=0;}
function selectedMethod(v){var method=(ui.paymentMethods||{})[(v||{}).id]||'card';return validMethod(v,method)?method:'card';}
function paymentQuote(o,qty,cp,method){
 var v=vendor(o.vendorId),b=payBenefits(v);method=validMethod(v,method)?method:"card";
 return CF.calculate({offer:o,qty:qty,paymentPct:payPct(v,method),stackVolume:b.stackVolume,method:method,shipping:zone(cp)==='amba'?o.shipAmba:o.shipInt,freeShipping:function(sub){return freeShipping(v,sub,cp);}});
}
function paymentFields(v){var b=payBenefits(v);return '<fieldset style="margin:16px 0"><legend>Beneficios por medio de pago</legend><div class="formgrid"><div class="field"><label for="pay-transfer">Descuento por transferencia (%)</label><input id="pay-transfer" type="number" min="0" max="99.99" step="0.01" value="'+(b.transfer||0)+'"></div><div class="field"><label for="pay-cash">Descuento por efectivo (%)</label><input id="pay-cash" type="number" min="0" max="99.99" step="0.01" value="'+(b.cash||0)+'"></div><div class="field"><label for="pay-installments">Cuotas sin interés disponibles</label><input id="pay-installments" type="text" inputmode="numeric" placeholder="Ejemplo: 3, 6" value="'+(b.installments||[]).join(', ')+'"><span class="hint">Dejá vacío si no ofrecés cuotas sin interés. Solo cargá planes habilitados.</span></div></div><label class="check"><input id="pay-stack" type="checkbox"'+(b.stackVolume?' checked':'')+'> Acumula con descuentos por volumen</label><p class="note">Si acumula, el descuento por pago se calcula después del descuento por volumen. Si no acumula, al elegir transferencia o efectivo se aplica solo ese beneficio.</p></fieldset>';}
function readPaymentBenefits(){var t=Number(val('pay-transfer')),c=Number(val('pay-cash')),raw=val('pay-installments').trim(),plans=raw?raw.split(',').map(function(x){return Number(x.trim());}):[];
 if(!Number.isFinite(t)||!Number.isFinite(c)||t<0||c<0||t>=100||c>=100)throw Error('Los descuentos por pago deben estar entre 0 y menos de 100%.');
 if(plans.some(function(n){return !Number.isInteger(n)||n<2||n>24;}))throw Error('Ingresá cuotas enteras entre 2 y 24, separadas por comas.');
 return {transfer:amount(t),cash:amount(c),installments:plans.filter(function(n,i){return plans.indexOf(n)===i;}).sort(function(a,b){return a-b;}),stackVolume:!!document.getElementById('pay-stack').checked};
}
function paymentChoice(v,total){if(!v)return '';var b=payBenefits(v),method=selectedMethod(v),opts=[['card','Tarjeta · un pago']];if(b.transfer)opts.push(['transfer','Transferencia · '+b.transfer+'% de descuento']);if(b.cash)opts.push(['cash','Efectivo · '+b.cash+'% de descuento']);(b.installments||[]).forEach(function(n){opts.push(['installments-'+n,n+' cuotas sin interés']);});
 return '<div class="card sub" style="margin:12px 0"><div class="field"><label for="payment-'+esc(v.id)+'">Cómo pagás a '+esc(v.name)+'</label><select id="payment-'+esc(v.id)+'" data-payment-vendor="'+esc(v.id)+'">'+opts.map(function(x){return '<option value="'+x[0]+'"'+(method===x[0]?' selected':'')+'>'+x[1]+'</option>';}).join('')+'</select></div><p class="note">'+(b.transfer?'Transferencia: '+b.transfer+'% de descuento. ':'')+(b.cash?'Efectivo: '+b.cash+'% de descuento. ':'')+((b.installments||[]).length?'Cuotas sin interés: '+b.installments.join(', ')+'. ':'')+(b.transfer||b.cash?(b.stackVolume?'Acumula con volumen; se calcula sobre los productos ya descontados.':'No acumula con volumen.'):'Sin descuentos adicionales por medio de pago.')+'</p>'+(method.indexOf('installments-')===0?'<p class="note">'+method.split('-')[1]+' cuotas sin interés · total '+money(total)+'. La última cuota ajusta cualquier diferencia de redondeo.</p>':'')+'</div>';
}
function shippingBenefitNote(v,sub,cp){var f=(v||{}).freeShipping||{};if(f.mode!=='always'&&f.mode!=='from')return '<p class="note">Este proveedor no tiene una promoción adicional de envío gratis.</p>';
 var scope=f.zone==='amba'?'CABA y alrededores':f.zone==='interior'?'resto del país':'todo el país';
 var title='Envío gratis '+(f.mode==='from'?'desde '+money(f.threshold)+' en productos después de descuentos, ':'')+'únicamente en '+scope+'.';
 if(!cpOk(cp))return '<p class="note">'+title+' Ingresá el código postal para verificar la cobertura.</p>';
 if(!shippingZoneEligible(f,cp))return '<div class="alert warn small">'+title+' Tu código postal '+esc(cp)+' está fuera de la cobertura del beneficio: el envío no es gratis y se suma al total.</div>';
 if(f.mode==='from'&&sub<f.threshold)return '<p class="note">'+title+' Te faltan '+money(amount(f.threshold-sub))+' en productos para alcanzarlo.</p>';
 return '<div class="alert ok small">Envío gratis aplicado para tu código postal '+esc(cp)+'.</div>';
}
function shippingZoneEligible(f,cp){
 if(!cpOk(cp))return false;var codes=f.postalCodes||[];
 if(f.zone==='amba')return codes.length>0&&codes.indexOf(String(cp).trim())>=0;
 return (f.zone==='all'||f.zone===zone(cp))&&(!codes.length||codes.indexOf(String(cp).trim())>=0);
}

function baseQuote(o,qty,cp){
 return CF.calculate({offer:o,qty:qty,paymentPct:0,shipping:zone(cp)==='amba'?o.shipAmba:o.shipInt,freeShipping:function(sub){return freeShipping(vendor(o.vendorId),sub,cp);}});
}

function quote(o,qty,cp){ return paymentQuote(o,qty,cp,selectedMethod(vendor(o.vendorId))); }
function net(o){ return o.subtotal-o.commission+o.shipping; }
/* Unidades: null = el proveedor no lleva la cuenta. Bajo stock = quedan igual o menos que el aviso. */
function lowOf(o){ var v=vendor(o.vendorId); return o.lowAt!=null?o.lowAt:((v&&v.lowAt!=null)?v.lowAt:10); }
function stockState(o){ if(o.stock==='none'||(o.units!=null&&o.units<=0)) return 'none'; if(o.stock==='order') return 'order'; if(o.units!=null&&o.units<=lowOf(o)) return 'low'; return 'ok'; }
function stockBadge(o){
  var s=stockState(o);
  if(s==='none') return '<span class="st bad">Sin stock</span>';
  if(s==='order') return '<span class="st neu">A pedido</span>';
  if(s==='low') return '<span class="st warn">Bajo stock · quedan '+o.units+'</span>';
  return o.units!=null?'<span class="st ok">'+o.units+(o.units===1?' unidad':' unidades')+'</span>':'<span class="st ok">En stock</span>';
}
/* Precio raro: muy por debajo o por encima de las otras ofertas del mismo producto, o un cambio brusco contra el precio anterior. */
function priceCheck(d,selfId,vendorId,prev){
  if(!(d.price>0)) return null;
  var k=vkey(d.category,d.model,d.size), others=db.offers.filter(function(o){ return o.id!==selfId&&o.vendorId!==vendorId&&o.price>0&&o.status!=='rejected'&&o.unit===d.unit&&vkey(o.category,o.model,o.size)===k; }).map(function(o){ return o.price; }).sort(function(a,b){ return a-b; });
  if(others.length){
    var mid=others.length%2?others[(others.length-1)/2]:(others[others.length/2-1]+others[others.length/2])/2, r=d.price/mid;
    if(r<0.5) return {kind:'low',pct:Math.round((1-r)*100),ref:mid,n:others.length,text:'Es '+Math.round((1-r)*100)+'% más bajo que las otras ofertas de este producto ('+money(mid)+' '+perUnit(d.unit)+').'};
    if(r>1.8) return {kind:'high',pct:Math.round((r-1)*100),ref:mid,n:others.length,text:'Es '+Math.round((r-1)*100)+'% más alto que las otras ofertas de este producto ('+money(mid)+' '+perUnit(d.unit)+').'};
    return null;
  }
  if(prev>0){ var q=d.price/prev;
    if(q<0.4) return {kind:'low',pct:Math.round((1-q)*100),ref:prev,n:0,text:'Es '+Math.round((1-q)*100)+'% menos que el precio que tenía ('+money(prev)+').'};
    if(q>2.5) return {kind:'high',pct:Math.round((q-1)*100),ref:prev,n:0,text:'Es '+Math.round((q-1)*100)+'% más que el precio que tenía ('+money(prev)+').'};
  }
  return null;
}
function priceBadge(o){ var c=priceCheck(o,o.id,o.vendorId); return c?' <span class="st warn" title="'+esc(c.text)+'">Precio raro · '+(c.kind==='low'?'−':'+')+c.pct+'%</span>':''; }
/* Lo que ve el comprador al pagar: el nombre de la cuenta de Mercado Pago del proveedor y el texto del resumen de la tarjeta (hasta 13 letras). */
function mpName(v){ return (v&&(v.mpName||v.name))||''; }
function descriptor(v){ return ('CFIT*'+plain(v?v.name:'').toUpperCase().replace(/[^A-Z0-9]/g,'')).slice(0,13); }
function mpNameOk(v){ return !v.mpName||plain(v.mpName).replace(/[^a-z0-9]/g,'').indexOf(plain(v.name).replace(/[^a-z0-9]/g,''))>=0; }
function stockName(s){ return s==='stock'?'En stock':(s==='order'?'A pedido':'Sin stock'); }
function days(n){ return n+(n===1?' día hábil':' días hábiles'); }
function months(n){ return n+(n===1?' mes':' meses'); }
function units(n){ return n+(n===1?' unidad':' unidades'); }
function perUnit(u){ return 'por '+String(u||'Unidad').toLowerCase(); }
/* Link de pago de un producto: abre el pago de esa oferta en el sitio de compradores. */
function payLink(id){ try{ return new URL('index.html#pagar-'+id,location.href).href; }catch(e){ return 'index.html#pagar-'+id; } }
function safeUrl(u){ u=String(u||'').trim(); return /^https:\/\/[^\s"'<>]+$/i.test(u)?u:''; }
/* Estadísticas: cuenta un clic por mes para artículos (p), proveedores (v) y anuncios (a). */
function track(kind,key){
  if(!key) return;
  if(!db.clicks) db.clicks={p:{},v:{},a:{}};
  var m=today().slice(0,7), k=db.clicks[kind]=db.clicks[kind]||{}, b=k[m]=k[m]||{};
  b[key]=(b[key]||0)+1; save();
}
function sumClicks(kind,month){
  var out={}, src=(db.clicks||{})[kind]||{};
  Object.keys(src).forEach(function(m){ if(month&&m!==month) return; for(var k in src[m]){ out[k]=(out[k]||0)+src[m][k]; } });
  return out;
}
function monthName(ym){ var n=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'], p=String(ym).split('-'); return n[+p[1]-1]+' '+p[0]; }
function toast(msg){
  toastEl.textContent=msg; toastEl.hidden=false;
  clearTimeout(toastTimer); toastTimer=setTimeout(function(){ toastEl.hidden=true; },3200);
}

var LOGO='<svg width="34" height="22" viewBox="0 0 34 22" aria-hidden="true"><rect x="0" y="9" width="34" height="4" rx="2" fill="var(--steel)"/><rect x="5" y="1" width="5" height="20" rx="2" fill="var(--strong-accent)"/><rect x="11" y="4" width="4" height="14" rx="2" fill="var(--strong-fg)"/><rect x="19" y="4" width="4" height="14" rx="2" fill="var(--strong-fg)"/><rect x="24" y="1" width="5" height="20" rx="2" fill="var(--strong-accent)"/></svg>';
/* Enlaces entre los tres sitios: van chicos y al pie, solo para recorrer la demo. */
function demoLinks(cur){
  var items=[['nicolas.html','Compradores','buy'],['proveedores.html','Proveedores','sell'],['admin.html','Administrador','admin']];
  return '<span class="demolinks">Demo, no se cobra nada. Ir a: '+items.filter(function(i){ return i[2]!==cur; }).map(function(i){ return '<a href="'+i[0]+'">'+i[1]+'</a>'; }).join(' · ')+'</span>';
}
var CHAT='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 21l2.1-5.2A8.5 8.5 0 1 1 21 11.5z"/></svg>';
/* Contacto por WhatsApp: el número se carga en el administrador. */
function waUrl(text){ var n=String((db.contact||{}).wa||'').replace(/\D/g,''); return n?'https://wa.me/'+n+(text?'?text='+encodeURIComponent(text):''):''; }
function waCta(label,cls,text){
  var u=waUrl(text);
  return u?'<a class="'+cls+'" href="'+esc(u)+'" target="_blank" rel="noopener">'+CHAT+'<span>'+label+'</span></a>'
          :'<button type="button" class="'+cls+'" data-act="wa-missing">'+CHAT+'<span>'+label+'</span></button>';
}
/* Cartel de publicidad: los mensajes pasan como en un cartel LED. */
function adItems(page){ return ((db.ad||{}).items||[]).filter(function(i){ return i.on&&(i.text||i.brand)&&(!page||!i.where||i.where==='all'||i.where===page); }); }
function adWhere(w){ return w==='home'?'Solo Inicio':(w==='buy'?'Solo Compará y comprá':'Las dos páginas'); }
function adBanner(page){
  var a=db.ad||{}; if(!a.on) return '';
  var items=adItems(page);
  if(!items.length) items=['Espacio publicitario disponible','Tu marca puede estar acá','Consultá por este cartel','Llegá a gimnasios y clubes'].map(function(t){ return {id:'',brand:'',text:t,url:''}; });
  var seq=[], chars=0;
  while(chars<110){ items.forEach(function(i){ seq.push(i); chars+=(i.brand+i.text).length+8; }); }
  var cell=function(i){
    var u=safeUrl(i.url), inner=(i.brand?'<b>'+esc(i.brand)+'</b> ':'')+esc(i.text);
    return u?'<a class="led-msg c'+(items.indexOf(i)%4)+'" href="'+esc(u)+'" target="_blank" rel="noopener sponsored" tabindex="-1" data-ad="'+esc(i.id)+'">'+inner+'</a>':'<span class="led-msg c'+(items.indexOf(i)%4)+'">'+inner+'</span>';
  };
  var run=seq.map(cell).join('');
  var sr=items.map(function(i){ var u=safeUrl(i.url), t=esc((i.brand?i.brand+': ':'')+i.text); return u?'<a href="'+esc(u)+'" target="_blank" rel="noopener sponsored" data-ad="'+esc(i.id)+'">'+t+'</a>':t; }).join('. ');
  return '<aside class="led" aria-label="Publicidad"><div class="wrap led-in"><span class="led-tag">Publicidad</span>'
    +'<div class="led-win"><p class="sr">'+sr+'</p><div class="led-track" aria-hidden="true" style="animation-duration:'+Math.round(chars*0.2)+'s">'+run+run+'</div></div></div></aside>';
}
function tabsHTML(list,cur){
  return '<div class="tabs" role="tablist">'+list.map(function(t){
    return '<button class="tab" role="tab" data-act="tab" data-tab="'+t.id+'" aria-selected="'+(cur===t.id)+'">'+t.label+(t.count?'<span class="count">'+t.count+'</span>':'')+'</button>';
  }).join('')+'</div>';
}
/* Días hábiles (lunes a viernes) entre dos fechas. */
function bizDays(a,b){ var d=new Date(a+'T12:00:00'), t=new Date(b+'T12:00:00'), n=0; while(d<t){ d.setDate(d.getDate()+1); var w=d.getDay(); if(w!==0&&w!==6) n++; } return n; }
function calDays(a,b){ return Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/864e5); }
function lateDays(o){ return (o.status==='approved'&&!o.shipped)?bizDays(o.date,today())-(o.lead==null?5:o.lead):0; }
function orderStatus(o){
  if(o.status==='refunded') return '<span class="st bad">Devuelto</span>';
  var late=lateDays(o); if(late>0) return '<span class="st bad">Demorado · '+late+(late===1?' día hábil':' días hábiles')+'</span>';
  return o.delivered?'<span class="st ok">Entregado</span>':(o.shipped?'<span class="st ok">Enviado'+(o.carrier?' · '+esc(o.carrier):'')+'</span>':'<span class="st warn">Pagado, por enviar</span>');
}
function offerStatus(o){
  var m={published:['ok','Publicado'],review:['warn','En revisión'],paused:['neu','Pausado'],rejected:['bad','Rechazado']}[o.status]||['neu',o.status];
  return '<span class="st '+m[0]+'">'+m[1]+'</span>';
}
function vendorStatus(v){
  var m={active:['ok','Activo'],pending:['warn','Por aprobar'],suspended:['neu','Suspendido'],rejected:['bad','Rechazado']}[v.status]||['neu',v.status];
  return '<span class="st '+m[0]+'">'+m[1]+'</span>';
}
/* ---------- Íconos compartidos ---------- */
var ICONS={
  resumen:'<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  ventas:'<path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6"/><circle cx="10" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/>',
  vendedores:'<path d="M4 11v9h16v-9"/><path d="M3 10l2-6h14l2 6"/><path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M10 20v-5h4v5"/>',
  productos:'<path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11"/>',
  stats:'<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 6-7"/>',
  publicidad:'<path d="M3 10.5v3a1 1 0 0 0 1 1h3l6 4.5v-14l-6 4.5H4a1 1 0 0 0-1 1z"/><path d="M17 8.5a5 5 0 0 1 0 7M19.5 6a8.5 8.5 0 0 1 0 12"/>',
  contenido:'<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
  config:'<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  money:'<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/>',
  pct:'<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
  bag:'<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  refund:'<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  click:'<path d="M6 3l13 7-5.5 1.8L11.5 18z"/><path d="M14 13l5 5"/>',
  tag:'<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.4"/>',
  eye:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  usuarios:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
  users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
  pages:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  exit:'<path d="M14 4h5v16h-5"/><path d="M10 8l-4 4 4 4M6 12h9"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  device:'<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18h2"/>',
  link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  funnel:'<path d="M3 4h18l-7 8.5V18l-4 2v-7.5z"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  alert:'<path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17.5v.5"/>',
  split:'<circle cx="12" cy="12" r="9"/><path d="M12 3v9l6.5 6"/>',
  list:'<path d="M9 6h12M9 12h12M9 18h12M4 6h.5M4 12h.5M4 18h.5"/>',
  none:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4M8.5 8.5l5 5M13.5 8.5l-5 5"/>',
  logout:'<path d="M10 4H5v16h5"/><path d="M14 8l4 4-4 4M18 12H9"/>',
  download:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  image:'<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  catalogo:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8 7h7M8 11h5"/>',
  bell:'<path d="M6 10a6 6 0 0 1 12 0c0 5 2 6.5 2 6.5H4S6 15 6 10z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  truck:'<path d="M2 6h12v10H2zM14 10h4l3 3v3h-7"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/>',
  filter:'<path d="M4 5h16M7 12h10M10 19h4"/>',
  upload:'<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  edit:'<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z"/>',
  check:'<path d="M5 12l5 5 9-10"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'
};
function ico(n,size){ var s=size||20; return '<svg class="ico" width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(ICONS[n]||'')+'</svg>'; }
/* Encabezado de tarjeta: ícono, título, bajada y algo a la derecha. */
function chead(icon,title,sub,right){
  return '<div class="ch"><span class="ic">'+ico(icon)+'</span><div class="ch-t"><h2 class="display h-card">'+title+'</h2>'+(sub?'<p class="muted small">'+sub+'</p>':'')+'</div>'+(right||'')+'</div>';
}


/* Si otro de los sitios cambia los datos en otra pestaña, este se actualiza solo. */
window.addEventListener('storage',function(ev){ if(ev.key===STORE){ db=load(); render(); } });

/* ---------- Métricas web ----------
   El sitio de compradores guarda, por día: visitas, visitantes, páginas vistas, rebote, tiempo,
   hora, dispositivo, de dónde llegó, páginas y pasos de compra. Las búsquedas se guardan por mes.
   Mientras "datos de ejemplo" esté prendido, a lo real se le suma un tráfico de muestra que arranca
   el 1 de agosto y llega hasta la hora actual, para que la demo no se vea vacía. */
var DEMO_START='2026-08-01';
var HW=[1.2,.6,.3,.2,.2,.4,1,2.2,3.6,5.2,6.4,6.6,5.4,4.6,5,5.6,5.8,5.6,5.4,6,6.8,6.2,4.4,2.6];
var WF=[.55,1.12,1.08,1.04,1,.9,.62];
var DAYS=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
var SRC=[['g','Google','var(--plate-blue)'],['i','Instagram','var(--plate-red)'],['w','WhatsApp','var(--plate-green)'],['d','Directo (escribieron la dirección)','var(--ink)'],['f','Facebook','var(--plate-yellow)'],['o','Otros sitios','var(--steel)']];
var DEV=[['m','Celular','var(--accent)'],['d','Computadora','var(--ink)'],['t','Tablet','var(--plate-yellow)']];
var PAGES=[['home','Inicio'],['buscar','Compará y comprá'],['cat','Categorías'],['compare','Comparación de un producto'],['checkout','Pago'],['done','Compra terminada']];
function hrand(str){
  var h=2166136261; for(var i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); }
  return function(){ h=(h+0x6D2B79F5)|0; var t=h; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; };
}
function addDays(iso,n){ var d=new Date(iso+'T12:00:00'); d.setDate(d.getDate()+n); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function emptyDay(){ return {v:0,u:0,nw:0,pv:0,b:0,dur:0,h:[],dev:{},src:{},pg:{},st:{}}; }
function demoDay(iso){
  var now=today(); if(iso<DEMO_START||iso>now) return null;
  var r=hrand('cf'+iso), w=new Date(iso+'T12:00:00').getDay(), i=calDays(DEMO_START,iso);
  var total=(70+i*0.95)*WF[w]*(0.82+r()*0.36), cut=iso===now?new Date().getHours():23;
  var wt=HW.map(function(x,hh){ if(w===6) return x*(hh>=9&&hh<=13?1.6:(hh>=19?0.6:1)); if(w===0) return x*(hh>=17&&hh<=21?1.4:(hh<12?0.7:1)); return x; });
  var sw=wt.reduce(function(a,b){ return a+b; },0), d=emptyDay();
  wt.forEach(function(x,hh){ var n=Math.round(total*x/sw*(0.75+r()*0.5)); d.h[hh]=hh>cut?0:n; });
  var v=d.h.reduce(function(a,b){ return a+b; },0); if(!v) return d;
  d.v=v; d.u=Math.round(v*(0.8+r()*0.06)); d.nw=Math.round(d.u*(0.55+r()*0.1)); d.pv=Math.round(v*(3.1+r()*0.7)); d.b=Math.round(v*(0.33+r()*0.1)); d.dur=Math.round(v*(140+r()*80));
  var m=Math.round(v*(0.64+r()*0.08)), t=Math.round(v*(0.04+r()*0.03)); d.dev={m:m,t:t,d:v-m-t};
  var sh={g:.36,i:.24,w:.14,f:.05,o:.03}, left=v; for(var k in sh){ var n=Math.round(v*sh[k]*(0.8+r()*0.4)); d.src[k]=n; left-=n; } d.src.d=Math.max(0,left);
  var ps={home:.33,buscar:.21,cat:.19,compare:.21,checkout:.04}, pl=d.pv; for(var p in ps){ var q=Math.round(d.pv*ps[p]); d.pg[p]=q; pl-=q; } d.pg.done=Math.max(0,pl);
  d.st={cmp:Math.round(v*(0.42+r()*0.08)),co:Math.round(v*(0.045+r()*0.02))};
  return d;
}
function addInto(a,b){
  if(!b) return a;
  ['v','u','nw','pv','b','dur'].forEach(function(k){ a[k]+=b[k]||0; });
  (b.h||[]).forEach(function(n,hh){ a.h[hh]=(a.h[hh]||0)+(n||0); });
  ['dev','src','pg','st'].forEach(function(g){ var s=b[g]||{}; for(var k in s){ a[g][k]=(a[g][k]||0)+s[k]; } });
  return a;
}
function dayData(iso){ var T=db.traffic||{}, d=addInto(emptyDay(),(T.days||{})[iso]); if(T.demo) addInto(d,demoDay(iso)); return d; }
/* Suma de un período, con la serie diaria y el cruce día de la semana × hora. */
function traffic(from,to){
  var out=emptyDay(); out.days=[]; out.wk=[[],[],[],[],[],[],[]];
  for(var d=from;d<=to;d=addDays(d,1)){
    var x=dayData(d), w=new Date(d+'T12:00:00').getDay();
    addInto(out,x); out.days.push({iso:d,v:x.v,w:w});
    x.h.forEach(function(n,hh){ out.wk[w][hh]=(out.wk[w][hh]||0)+(n||0); });
  }
  out.orders=db.orders.filter(function(o){ return o.date>=from&&o.date<=to; }).length;
  return out;
}
var SEARCH_DEMO={q:{'mancuernas':38,'discos':27,'bumper':22,'barra olimpica':19,'kettlebell':17,'colchoneta':16,'pesas rusas':12,'mancuerna 10 kg':11,'step':9,'mat yoga':8,'banda elastica':6,'conos':4},
  z:{'cinta de correr':14,'bicicleta de spinning':11,'rack':9,'multigimnasio':6,'remo':4,'banco plano':4}};
/* Búsquedas del período: se guardan por mes, así que se toman los meses que toca el período. */
function searches(from,to){
  var T=db.traffic||{}, out={q:{},z:{}}, m=from.slice(0,7), last=to.slice(0,7), now=today();
  while(m<=last){
    ['q','z'].forEach(function(k){ var s=(T[k]||{})[m]||{}; for(var t in s) out[k][t]=(out[k][t]||0)+s[t]; });
    if(T.demo&&m>=DEMO_START.slice(0,7)&&m<=now.slice(0,7)){
      var f=(m===now.slice(0,7)?(+now.slice(8,10))/30:1)*(m==='2026-08'?0.7:1)*(1+(calDays(DEMO_START,m+'-01')/120));
      ['q','z'].forEach(function(k){ var s=SEARCH_DEMO[k]; for(var t in s){ var n=Math.round(s[t]*f); if(n){ out[k][t]=(out[k][t]||0)+n; if(k==='z') out.q[t]=(out.q[t]||0)+n; } } });
    }
    m=nextMonth(m);
  }
  return out;
}
function nextMonth(m){ var p=m.split('-'), y=+p[0], mo=+p[1]+1; if(mo===13){ y++; mo=1; } return y+'-'+String(mo).padStart(2,'0'); }
function lastDay(m){ var p=m.split('-'); return m+'-'+String(new Date(+p[0],+p[1],0).getDate()).padStart(2,'0'); }
/* Período elegido y el anterior del mismo largo, para comparar. */
function statPeriod(){
  var t=today(), r=ui.statRange||'30', from, to, label;
  if(r==='7'||r==='30'){ var n=+r; from=addDays(t,-(n-1)); to=t; label='Últimos '+n+' días'; }
  else { from=r+'-01'; to=lastDay(r); if(to>t) to=t; label=monthName(r)+(to===t&&r===t.slice(0,7)?' · hasta hoy':''); }
  var len=calDays(from,to)+1, pto=addDays(from,-1), pfrom=addDays(from,-len);
  if(r!=='7'&&r!=='30'){ pfrom=prevMonth(r)+'-01'; pto=addDays(pfrom,len-1); if(pto>lastDay(prevMonth(r))) pto=lastDay(prevMonth(r)); }
  return {from:from,to:to,pfrom:pfrom,pto:pto,label:label,len:len};
}
function pctTxt(x,dec){ var v=x*100; return (dec?v.toFixed(dec).replace('.',','):Math.round(v))+'%'; }
function durTxt(s){ s=Math.round(s); var m=Math.floor(s/60), ss=s%60; return m+' min '+String(ss).padStart(2,'0')+' s'; }
function nfmt(n){ return Math.round(n).toLocaleString('es-AR'); }
/* Variación contra el período anterior. good=false cuando subir es malo (rebote). */
function dlt(x,y,good,ref){
  if(!y) return '<span class="s">Sin datos para comparar</span>';
  var p=Math.round((x-y)/y*100), up=p>=0, ok=good===false?!up:up;
  if(p===0) return '<span class="s">Igual que '+ref+'</span>';
  return '<span class="s '+(ok?'up':'down')+'">'+(up?'▲ ':'▼ ')+Math.abs(p)+'% <span class="vs">vs. '+ref+'</span></span>';
}
function kpi(icon,k,v,sub,cls){ return '<div class="tile '+(cls||'')+'"><span class="tile-top"><span class="k">'+k+'</span><span class="ic sm">'+ico(icon,18)+'</span></span><span class="v num">'+v+'</span>'+sub+'</div>'; }
/* Columnas en HTML: se adaptan a cualquier ancho sin achicar el texto. */
function colChart(list,opt){
  var max=Math.max.apply(null,list.map(function(c){ return c.n; }))||1, nice=niceMax(max);
  return '<div class="cchart'+(opt&&opt.cls?' '+opt.cls:'')+'"><div class="cc-y" aria-hidden="true"><span>'+nfmt(nice)+'</span><span>'+nfmt(nice/2)+'</span><span>0</span></div>'
    +'<div class="cc-area"><div class="cc-cols" role="img" aria-label="'+esc(opt.aria)+'">'+list.map(function(c){
      return '<span class="cc-col'+(c.cls?' '+c.cls:'')+'" title="'+esc(c.tip)+'"><i style="height:'+(c.n?Math.max(1.5,c.n/nice*100):0)+'%"></i></span>';
    }).join('')+'</div><div class="cc-x" aria-hidden="true">'+list.map(function(c){ return '<span>'+(c.lab||'')+'</span>'; }).join('')+'</div></div></div>';
}
function niceMax(m){ var p=Math.pow(10,Math.floor(Math.log10(m))), f=m/p; return (f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*p; }
function legendBars(rows,total){
  var max=Math.max.apply(null,rows.map(function(r){ return r.n; }))||1;
  return '<div class="lbars">'+rows.map(function(r){
    return '<div class="lbar"><span class="lb-name">'+(r.color?'<i class="dot" style="background:'+r.color+'"></i>':'')+'<span>'+r.name+'</span></span><span class="lb-n num"><b>'+nfmt(r.n)+'</b>'+(total?' <span class="muted">'+pctTxt(r.n/total)+'</span>':'')+'</span>'
      +'<span class="track"><i style="width:'+Math.max(1,r.n/max*100)+'%;'+(r.color?'background:'+r.color:'')+'"></i></span></div>';
  }).join('')+'</div>';
}
function donut(rows,center,sub){
  var tot=rows.reduce(function(a,r){ return a+r.n; },0)||1, C=2*Math.PI*42, off=0;
  return '<div class="donut"><svg viewBox="0 0 100 100" role="img" aria-label="'+esc(rows.map(function(r){ return r.name+' '+pctTxt(r.n/tot); }).join(', '))+'">'
    +'<circle cx="50" cy="50" r="42" fill="none" stroke="var(--surface-2)" stroke-width="13"/>'
    +rows.map(function(r){ var len=r.n/tot*C, s='<circle cx="50" cy="50" r="42" fill="none" stroke="'+r.color+'" stroke-width="13" stroke-dasharray="'+len.toFixed(2)+' '+(C-len).toFixed(2)+'" stroke-dashoffset="'+(-off).toFixed(2)+'" transform="rotate(-90 50 50)"/>'; off+=len; return s; }).join('')
    +'</svg><span class="donut-c"><b class="num">'+center+'</b><span class="muted small">'+sub+'</span></span></div>';
}
/* Franja de 3 horas seguidas con más visitas. */
function peakWindow(h){ var best=0,at=0; for(var i=0;i<24;i++){ var s=(h[i]||0)+(h[(i+1)%24]||0)+(h[(i+2)%24]||0); if(s>best){ best=s; at=i; } } return {from:at,to:(at+3)%24,n:best}; }
function heatmap(wk){
  var order=[1,2,3,4,5,6,0], max=1;
  order.forEach(function(w){ for(var hh=0;hh<24;hh++) max=Math.max(max,wk[w][hh]||0); });
  var head='<span></span>'+Array.apply(null,Array(24)).map(function(_,hh){ return '<span class="hm-h">'+(hh%3===0?hh:'')+'</span>'; }).join('');
  return '<div class="hm-wrap"><div class="hm" role="img" aria-label="Visitas por día de la semana y hora. Más oscuro, más visitas.">'+head
    +order.map(function(w){ return '<span class="hm-d">'+DAYS[w].slice(0,3)+'</span>'+Array.apply(null,Array(24)).map(function(_,hh){ var n=wk[w][hh]||0, a=n/max; return '<span class="hm-c" style="--a:'+a.toFixed(2)+'" title="'+DAYS[w]+' de '+hh+' a '+(hh+1)+' h: '+nfmt(n)+' visitas"></span>'; }).join(''); }).join('')
    +'</div><div class="hm-key muted small" aria-hidden="true"><span>Menos</span><i style="--a:.08"></i><i style="--a:.3"></i><i style="--a:.55"></i><i style="--a:.8"></i><i style="--a:1"></i><span>Más</span></div></div>';
}
function statsView(){
  var P=statPeriod(), A=traffic(P.from,P.to), B=traffic(P.pfrom,P.pto), S=searches(P.from,P.to);
  var ref=(ui.statRange==='7'||ui.statRange==='30'||!ui.statRange)?'los '+P.len+' días anteriores':monthWord(prevMonth(ui.statRange));
  var ms={}, now=today(); for(var m=DEMO_START.slice(0,7);m<=now.slice(0,7);m=nextMonth(m)) ms[m]=1;
  Object.keys((db.traffic||{}).days||{}).forEach(function(d){ ms[d.slice(0,7)]=1; });
  var mlist=Object.keys(ms).sort().reverse(), cur=ui.statRange||'30';
  var sel='<div class="field period"><label for="st-range">Período</label><select id="st-range"><option value="7"'+(cur==='7'?' selected':'')+'>Últimos 7 días</option><option value="30"'+(cur==='30'?' selected':'')+'>Últimos 30 días</option>'+mlist.map(function(x){ return '<option value="'+x+'"'+(x===cur?' selected':'')+'>'+monthName(x)+'</option>'; }).join('')+'</select></div>';
  var demoNote=(db.traffic||{}).demo?'<p class="note demo-note">'+ico('alert',16)+' Incluye visitas de ejemplo para mostrar cómo se ve. Cuando el sitio salga a la calle se apagan desde Configuración y quedan solo las reales.</p>':'';
  var v=A.v, bv=B.v, conv=v?Math.min(1,A.orders/v):0, bconv=B.v?B.orders/B.v:0;
  var tiles='<div class="tiles kpis">'
    +kpi('eye','Visitas',nfmt(v),dlt(v,bv,true,ref),'main')
    +kpi('users','Visitantes únicos',nfmt(A.u),'<span class="s">'+(A.u?pctTxt(A.nw/A.u)+' entró por primera vez':'Sin visitas')+'</span>')
    +kpi('pages','Páginas por visita',v?(A.pv/v).toFixed(1).replace('.',','):'0',dlt(v?A.pv/v:0,bv?B.pv/bv:0,true,ref))
    +kpi('clock','Tiempo promedio',v?durTxt(A.dur/v):'—',dlt(v?A.dur/v:0,bv?B.dur/bv:0,true,ref))
    +kpi('exit','Rebote',v?pctTxt(A.b/v):'—',dlt(v?A.b/v:0,bv?B.b/bv:0,false,ref).replace('<span class="s','<span title="Visitas que vieron una sola página y se fueron" class="s'))
    +kpi('target','Conversión',v?pctTxt(conv,2):'—','<span class="s">'+A.orders+(A.orders===1?' compra':' compras')+' cada '+nfmt(v)+' visitas</span>')
    +'</div>';
  /* Visitas por día */
  var avg=A.days.length?v/A.days.length:0, best=A.days.reduce(function(b,d){ return d.v>b.v?d:b; },{v:-1});
  var showLab=function(i,n){ var step=n>20?5:(n>10?2:1); return i===0||i===n-1||i%step===0; };
  var daily=colChart(A.days.map(function(d,i){ return {n:d.v,tip:DAYS[d.w]+' '+fdate(d.iso)+': '+nfmt(d.v)+' visitas',lab:showLab(i,A.days.length)?fdate(d.iso):'',cls:(d.w===0||d.w===6?'we':'')+(d.iso===now?' today':'')}; }),{aria:'Visitas por día del período'});
  /* Horarios */
  var pk=peakWindow(A.h), totH=A.h.reduce(function(a,b){ return a+(b||0); },0)||1;
  var hours=colChart(Array.apply(null,Array(24)).map(function(_,hh){ var inPk=(hh-pk.from+24)%24<3; return {n:A.h[hh]||0,tip:hh+' a '+(hh+1)+' h: '+nfmt(A.h[hh]||0)+' visitas',lab:hh%3===0?hh+'h':'',cls:inPk?'peak':''}; }),{aria:'Visitas por hora del día',cls:'hours'});
  var byW=[0,0,0,0,0,0,0]; A.days.forEach(function(d){ byW[d.w]+=d.v; }); var cntW=[0,0,0,0,0,0,0]; A.days.forEach(function(d){ cntW[d.w]++; });
  var bestW=0; for(var w=1;w<7;w++){ if((cntW[w]?byW[w]/cntW[w]:0)>(cntW[bestW]?byW[bestW]/cntW[bestW]:0)) bestW=w; }
  var parts=[['Madrugada',0,6],['Mañana',6,12],['Tarde',12,19],['Noche',19,24]].map(function(p){ var n=0; for(var hh=p[1];hh<p[2];hh++) n+=A.h[hh]||0; return {name:p[0]+' <span class="muted small">'+p[1]+' a '+p[2]+' h</span>',n:n}; });
  /* Dispositivos y orígenes */
  var dev=DEV.map(function(d){ return {name:d[1],n:A.dev[d[0]]||0,color:d[2]}; }), devTop=dev.slice().sort(function(a,b){ return b.n-a.n; })[0];
  var src=SRC.map(function(s){ return {name:s[1],n:A.src[s[0]]||0,color:s[2]}; }).sort(function(a,b){ return b.n-a.n; });
  /* Embudo */
  var steps=[['Entraron al sitio',v],['Abrieron una comparación',A.st.cmp||0],['Empezaron a pagar',A.st.co||0],['Compraron',A.orders]];
  var funnel='<div class="funnel">'+steps.map(function(s,i){ var w2=v?Math.max(2,s[1]/v*100):0, prev=i?steps[i-1][1]:0;
    return (i?'<div class="fn-step muted small">'+ico('funnel',14)+' '+(prev?pctTxt(s[1]/prev,1):'0%')+' sigue</div>':'')
      +'<div class="fn-row"><span class="fn-l"><b>'+s[0]+'</b></span><span class="fn-bar"><i style="width:'+w2+'%"></i></span><b class="num fn-n">'+nfmt(s[1])+'</b></div>'; }).join('')+'</div>';
  /* Búsquedas */
  var qs=Object.keys(S.q).map(function(t){ return {t:t,n:S.q[t],z:!!S.z[t]}; }).sort(function(a,b){ return b.n-a.n; }).slice(0,10);
  var zs=Object.keys(S.z).map(function(t){ return {t:t,n:S.z[t]}; }).sort(function(a,b){ return b.n-a.n; }).slice(0,8);
  var qmax=qs.length?qs[0].n:1, qtot=Object.keys(S.q).reduce(function(a,t){ return a+S.q[t]; },0);
  var qlist=qs.length?'<ol class="rank">'+qs.map(function(r,i){ return '<li><span class="rk num">'+(i+1)+'</span><span class="rk-t"><b>'+esc(r.t)+'</b>'+(r.z?' <span class="st warn">Sin resultados</span>':'')+'<span class="track"><i style="width:'+Math.max(2,r.n/qmax*100)+'%"></i></span></span><b class="num">'+nfmt(r.n)+'</b></li>'; }).join('')+'</ol>':'<div class="empty">Nadie buscó por nombre en este período.</div>';
  var zlist=zs.length?'<ol class="rank miss">'+zs.map(function(r){ return '<li><span class="rk">'+ico('none',18)+'</span><span class="rk-t"><b>'+esc(r.t)+'</b></span><b class="num">'+nfmt(r.n)+'</b></li>'; }).join('')+'</ol>':'<div class="empty">Todo lo que buscaron tuvo resultados.</div>';
  /* Páginas */
  var pg=PAGES.map(function(p){ return {name:p[1],n:A.pg[p[0]]||0}; }).sort(function(a,b){ return b.n-a.n; });
  return '<div class="stat-head">'+sel+'<div class="stat-when"><b>'+P.label+'</b><span class="muted small">'+fdate(P.from)+' al '+fdate(P.to)+' · comparado con '+ref+'</span></div>'+exportBar('visitas')+'</div>'+demoNote
    +tiles
    +'<div class="card">'+chead('calendar','Visitas por día','Promedio <b class="num">'+nfmt(avg)+'</b> por día'+(best.v>0?' · el mejor día fue el '+DAYS[best.w].toLowerCase()+' '+fdate(best.iso)+' con <b class="num">'+nfmt(best.v)+'</b>':''),'<span class="legend small"><i class="sq"></i>Lunes a viernes <i class="sq we"></i>Fin de semana</span>')+daily+'</div>'
    +'<div class="grid2">'
    +'<div class="card">'+chead('clock','Horario de visitas','La franja más fuerte es de <b>'+pk.from+' a '+(pk.to||24)+' h</b>: '+pctTxt(pk.n/totH)+' de las visitas.')+hours+'<div class="mini3">'+parts.map(function(p){ return '<div><span class="muted small">'+p.name+'</span><b class="num">'+pctTxt(p.n/totH)+'</b></div>'; }).join('')+'</div></div>'
    +'<div class="card">'+chead('sun','Día y hora','Cada cuadrito es una hora de un día de la semana. El día con más visitas en promedio es el <b>'+DAYS[bestW].toLowerCase()+'</b>.')+heatmap(A.wk)+'</div>'
    +'</div>'
    +'<div class="grid2">'
    +'<div class="card">'+chead('device','Desde qué entran',devTop&&devTop.n?'La mayoría entra desde '+(devTop.name==='Celular'?'el celular':(devTop.name==='Computadora'?'la computadora':'una tablet'))+'.':'Sin visitas en el período.')+'<div class="donut-row">'+donut(dev,pctTxt((devTop||{n:0}).n/(v||1)),esc((devTop||{name:''}).name))+legendBars(dev,v)+'</div></div>'
    +'<div class="card">'+chead('link','De dónde llegan','Sirve para saber qué publicidad trae gente.')+legendBars(src,v)+'</div>'
    +'</div>'
    +'<div class="card">'+chead('funnel','Del ingreso a la compra','Cuántos avanzan en cada paso. Donde más se caen es donde conviene mejorar.')+funnel+'</div>'
    +'<div class="grid2">'
    +'<div class="card">'+chead('search','Qué buscan',nfmt(qtot)+(qtot===1?' búsqueda':' búsquedas')+' por nombre'+(P.len<28?' en los meses del período':'')+'.')+qlist+'</div>'
    +'<div class="card miss-card">'+chead('none','Buscaron y no encontraron','Productos que piden y nadie vende en el sitio. Son la lista de proveedores para salir a buscar.')+zlist+'</div>'
    +'</div>'
    +'<div class="card">'+chead('pages','Páginas más vistas',nfmt(A.pv)+' páginas vistas en el período.')+legendBars(pg,A.pv)+'</div>'
    +clickCards(P);
}
/* Clics por producto y por marca: se cuentan por mes. */
function clickCards(P){
  var r=ui.statRange||'30', mo=(r==='7'||r==='30')?today().slice(0,7):r, when=monthName(mo);
  var Pc=sumClicks('p',mo), Vc=sumClicks('v',mo), idx=liveIndex();
  var prods=Object.keys(Pc).map(function(k){ var a=k.split('|'); return {cat:a[0],model:a[1],size:a[2],n:Pc[k],offers:(idx[vkey(a[0],a[1],a[2])]||[]).length}; }).sort(function(a,b){ return b.n-a.n; }).slice(0,10);
  var vends=Object.keys(Vc).map(function(id){ var v=vendor(id); return {name:v?v.name:'Proveedor dado de baja',n:Vc[id]}; }).sort(function(a,b){ return b.n-a.n; });
  var pm=prods.length?prods[0].n:1, vm=vends.length?vends[0].n:1, note=(r==='7'||r==='30')?' Se cuentan por mes: acá va '+when.toLowerCase()+'.':'';
  return '<div class="grid2 wide-l">'
    +'<div class="card" id="st-p">'+chead('click','Clics por producto','Las veces que abrieron la comparación de cada uno. Los que no tienen ofertas muestran demanda que hoy nadie cubre.'+note)
    +(prods.length?'<ol class="rank">'+prods.map(function(x,i){ return '<li><span class="rk num">'+(i+1)+'</span><span class="rk-t"><b>'+esc(x.model)+' · '+esc(x.size)+'</b> <span class="muted small">'+esc(x.cat)+(x.offers?' · '+(x.offers===1?'1 oferta':x.offers+' ofertas'):'')+'</span>'+(x.offers?'':' <span class="st warn">Sin ofertas</span>')+'<span class="track"><i style="width:'+Math.max(2,x.n/pm*100)+'%"></i></span></span><b class="num">'+x.n+'</b></li>'; }).join('')+'</ol>':'<div class="empty">Sin clics en '+esc(when.toLowerCase())+'.</div>')+'</div>'
    +'<div class="card" id="st-v">'+chead('tag','Clics por marca','Solapa de la marca, botón Comprar o link de pago.')
    +(vends.length?'<ol class="rank">'+vends.map(function(x,i){ return '<li><span class="rk num">'+(i+1)+'</span><span class="rk-t"><b>'+esc(x.name)+'</b><span class="track"><i style="width:'+Math.max(2,x.n/vm*100)+'%"></i></span></span><b class="num">'+x.n+'</b></li>'; }).join('')+'</ol>':'<div class="empty">Sin clics en '+esc(when.toLowerCase())+'.</div>')+'</div>'
    +'</div>';
}

/* ---------- Usuarios del administrador e historial ---------- */
function me(){ var id=sget(AKEY); return db.users.filter(function(u){ return u.id===id; })[0]||null; }
function logAct(what){
  var u=me(); db.log=db.log||[];
  db.log.unshift({t:new Date().toISOString(),who:u?u.name:'Sistema',what:what});
  if(db.log.length>300) db.log.length=300;
}
function when(iso){ try{ var d=new Date(iso); return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }catch(e){ return ''; } }
function userForm(){
  var u=ui.uForm==='new'?null:db.users.filter(function(x){ return x.id===ui.uForm; })[0]; if(ui.uForm!=='new'&&!u) return '';
  var self=u&&me()&&u.id===me().id;
  return '<form id="uform" class="card sub" novalidate><h3 class="display h-card">'+(u?(self?'Mis datos y mi clave':'Editar a '+esc(u.name)):'Agregar usuario')+'</h3>'
    +'<div id="u-err" class="alert bad" role="alert" hidden></div><div class="formgrid">'
    +fld('u-name','Nombre',inp('u-name',u?u.name:'','type="text" maxlength="30"'))
    +fld('u-user','Usuario',inp('u-user',u?u.user:'','type="text" maxlength="30" autocapitalize="none" autocomplete="off"'),'Sin espacios. Con esto entra al panel.')
    +fld('u-pass',u?'Clave nueva':'Clave',inp('u-pass','','type="password" autocomplete="new-password"'),u?'Dejala vacía para no cambiarla.':'Al menos 6 caracteres.')
    +fld('u-pass2','Repetí la clave',inp('u-pass2','','type="password" autocomplete="new-password"'))
    +'</div><div class="actions"><button class="btn btn-primary" type="submit">'+(u?'Guardar':'Agregar usuario')+'</button><button class="btn btn-outline" type="button" data-act="u-cancel">Cancelar</button></div></form>';
}
function usersCard(){
  var cur=me();
  return '<div class="card">'+chead('users','Usuarios del administrador','Quiénes pueden entrar a este panel. Cada uno con su usuario y su clave.','<button class="btn btn-accent btn-sm" data-act="u-new">Agregar usuario</button>')
    +(ui.uForm?userForm():'')
    +'<div class="tablewrap flat"><table style="min-width:640px"><thead><tr><th>Nombre</th><th>Usuario</th><th>Último ingreso</th><th></th></tr></thead><tbody>'
    +db.users.map(function(u){ var self=cur&&cur.id===u.id;
      return '<tr><td><b>'+esc(u.name)+'</b>'+(self?' <span class="st ok">Sos vos</span>':'')+'</td><td>'+esc(u.user)+'</td><td>'+(u.last?when(u.last):'<span class="muted">Nunca</span>')+'</td>'
        +'<td><div class="actions nw" style="justify-content:flex-end"><button class="btn btn-primary btn-sm" data-act="u-edit" data-id="'+u.id+'">'+(self?'Cambiar mi clave':'Editar')+'</button>'
        +(!self&&db.users.length>1?'<button class="btn '+(ui.confirm==='udel'+u.id?'btn-danger':'btn-outline')+' btn-sm" data-act="u-del" data-id="'+u.id+'">'+(ui.confirm==='udel'+u.id?'Confirmar':'Quitar')+'</button>':'')+'</div></td></tr>'; }).join('')
    +'</tbody></table></div><p class="note">En esta demo las claves se guardan en este navegador. En el sitio real se guardan cifradas en el servidor y se puede recuperar la clave por email.</p></div>';
}
function logCard(){
  var L=db.log||[], n=ui.logAll?L.length:Math.min(L.length,25);
  return '<div class="card">'+chead('list','Historial de cambios','Quién hizo qué y cuándo en el panel.',L.length?exportBar('historial'):'')
    +(L.length?'<ol class="log">'+L.slice(0,n).map(function(e){ return '<li><span class="log-t num">'+when(e.t)+'</span><span class="avatar xs" aria-hidden="true">'+esc((e.who||'?').charAt(0))+'</span><span><b>'+esc(e.who)+'</b> '+esc(e.what)+'</span></li>'; }).join('')+'</ol>'
      +(L.length>25?'<div><button class="btn btn-outline btn-sm" data-act="log-all">'+(ui.logAll?'Ver menos':'Ver los '+L.length+' cambios')+'</button></div>':'')
      :'<div class="empty">Todavía no hay cambios registrados.</div>')+'</div>';
}

/* ---------- Exportar a Excel ---------- */
function exportBar(kind){
  return '<div class="xbar"><button type="button" class="btn btn-outline btn-sm" data-act="xls" data-kind="'+kind+'">'+ico('download',18)+'Descargar Excel</button>'
    +'<button type="button" class="btn btn-outline btn-sm" data-act="xcopy" data-kind="'+kind+'">'+ico('copy',18)+'Copiar</button></div>';
}
function exportData(kind){
  var st=function(o){ return o.status==='refunded'?'Devuelto':(lateDays(o)>0?'Demorado':(o.shipped?'Enviado':'Por enviar')); }, vn=function(id){ var v=vendor(id); return v?v.name:''; };
  if(kind==='ventas') return [['Venta','Fecha','Comprador','Proveedor','Producto','Cantidad','Productos $','Envío $','Total $','Comisión %','Comisión $','Al proveedor $','Estado']].concat(salesRows().map(function(o){ var r=o.status==='refunded'; return [o.id,o.date,o.buyer,vn(o.vendorId),o.desc,o.qty,o.subtotal,o.shipping,o.subtotal+o.shipping,o.pct,r?0:o.commission,r?0:net(o),st(o)]; }));
  if(kind==='comisiones'){ var c=commissionRows(); return [['Mes','Proveedor','CUIT','Ventas','Productos vendidos $','Comisión $','Devoluciones','Factura']].concat(c.rows.map(function(r){ return [monthName(c.m),r.name,r.cuit,r.n,r.sub,r.com,r.ref,r.inv?'Facturada':'A facturar']; })); }
  if(kind==='compradores') return [['Comprador','Cuenta','Email','CUIT','Compras','Unidades','Total comprado $','Primera compra','Última compra','Proveedores']].concat(buyerRows().map(function(b){ return [b.name,b.acc?'Sí':'No',b.acc?b.acc.email:'',b.acc?b.acc.cuit||'':'',b.n,b.units,b.total,b.first,b.last,b.vendors.join(', ')]; }));
  if(kind==='stock') return [['Proveedor','Categoría','Modelo','Variante','Se vende por','Marca','Precio $','Unidades','Stock','Estado','Precio actualizado']].concat(db.offers.filter(function(o){ return o.vendorId===ui.stockVendor; }).map(function(o){ return [vn(o.vendorId),o.category,o.model,o.size,o.unit,o.brand||'',o.price,o.units==null?'':o.units,{none:'Sin stock',low:'Bajo stock',order:'A pedido',ok:'En stock'}[stockState(o)],{published:'Publicado',review:'En revisión',paused:'Pausado',rejected:'Rechazado'}[o.status]||o.status,o.updated||'']; }));
  if(kind==='ranking'){ var by={}; db.orders.filter(function(o){ return o.status==='approved'; }).forEach(function(o){ var r=by[o.desc]=by[o.desc]||{n:0,u:0,a:0}; r.n++; r.u+=o.qty; r.a+=o.subtotal; }); return [['Producto','Ventas','Unidades','Monto $']].concat(Object.keys(by).sort(function(a,b){ return by[b].u-by[a].u; }).map(function(k){ return [k,by[k].n,by[k].u,by[k].a]; })); }
  if(kind==='visitas'){ var P=statPeriod(), out=[['Fecha','Día','Visitas','Visitantes únicos','Páginas vistas','Rebote %','Celular','Computadora','Tablet','Google','Instagram','WhatsApp','Directo','Facebook','Otros']]; for(var d=P.from;d<=P.to;d=addDays(d,1)){ var x=dayData(d); out.push([d,DAYS[new Date(d+'T12:00:00').getDay()],x.v,x.u,x.pv,x.v?Math.round(x.b/x.v*100):0,x.dev.m||0,x.dev.d||0,x.dev.t||0,x.src.g||0,x.src.i||0,x.src.w||0,x.src.d||0,x.src.f||0,x.src.o||0]); } return out; }
  if(kind==='usuarios') return [['Usuario','Email','Teléfono','CUIT','IVA','Ciudad','Registrado','Cómo se registró','Último ingreso','Compras','Total gastado $','Ticket promedio $','Última compra','Favoritos','Acepta ofertas','Estado']].concat(uRows().map(function(r){ var b=r.b, s=r.s; return [b.name,b.email,b.phone||'',b.cuit||'',b.iva||'',s.city,b.created||'',VIA[b.via||'email']||'',s.lastLogin?s.lastLogin.slice(0,10):'',s.purchases,s.spent,Math.round(s.ticket),s.lastBuy,(b.favs||[]).length,b.marketing?'Sí':'No',b.blocked?'Bloqueado':'Activo']; }));
  if(kind==='invitados') return [['Comprador','Email','Teléfono','Dirección','Ciudad','Provincia','Condición IVA','CUIT','Compras','Gastó $','Primera compra','Última compra','Invitado a crear cuenta']].concat(guestRows().map(function(g){ return [g.name,g.email,g.phone,g.address,g.city,g.prov,g.iva,g.cuit,g.n,g.spent,g.first,g.last,g.inv||'']; }));
  if(kind==='historial') return [['Fecha y hora','Quién','Qué hizo']].concat((db.log||[]).map(function(e){ return [when(e.t),e.who,e.what]; }));
  return [];
}
function exportName(kind){ return {ventas:'ventas',comisiones:'comisiones',compradores:'compradores',stock:'stock',ranking:'mas-vendidos',visitas:'visitas',historial:'historial'}[kind]||kind; }
function doExport(kind,copy){
  var rows=exportData(kind); if(rows.length<2){ toast('No hay datos para exportar.'); return; }
  if(copy){
    var tsv=rows.map(function(r){ return r.map(function(c){ return String(c==null?'':c).replace(/[\t\n]/g,' '); }).join('\t'); }).join('\n');
    var ok=function(){ toast('Copiado: pegalo en Excel o en Google Sheets'); }, fail=function(){
      var ta=document.createElement('textarea'); ta.value=tsv; ta.setAttribute('readonly',''); ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select();
      var done=false; try{ done=document.execCommand('copy'); }catch(e){} document.body.removeChild(ta); toast(done?'Copiado: pegalo en Excel o en Google Sheets':'No se pudo copiar desde acá. Probá con Descargar Excel.');
    };
    try{ navigator.clipboard.writeText(tsv).then(ok,fail); }catch(e){ fail(); }
    return;
  }
  var csv='﻿'+rows.map(function(r){ return r.map(function(c){ var s=String(c==null?'':c); return /[;"\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }).join(';'); }).join('\r\n');
  try{
    var url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})), a=document.createElement('a');
    a.href=url; a.download='comparador-'+exportName(kind)+'-'+today()+'.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); },4000);
    toast('Listo: se abre con Excel');
  }catch(e){ toast('Esta vista previa no deja descargar. Usá Copiar, o probalo con el sitio publicado.'); }
}

/* ---------- Ventas: filtros, comisiones a facturar y compradores ---------- */
function salesRows(){
  var fm=ui.salesMonth, fv=ui.salesVendor, fs=ui.salesStatus;
  return db.orders.filter(function(o){
    if(fm&&String(o.date).slice(0,7)!==fm) return false;
    if(fv&&o.vendorId!==fv) return false;
    if(fs==='approved') return o.status==='approved';
    if(fs==='refunded') return o.status==='refunded';
    if(fs==='toship') return o.status==='approved'&&!o.shipped;
    if(fs==='late') return lateDays(o)>0;
    return true;
  });
}
function orderMonths(){ var ms={}; db.orders.forEach(function(o){ ms[String(o.date).slice(0,7)]=1; }); return Object.keys(ms).sort().reverse(); }
function commissionRows(){
  var ms=orderMonths(), m=ms.indexOf(ui.comMonth)>=0?ui.comMonth:(ms[0]||today().slice(0,7)), by={};
  db.orders.filter(function(o){ return String(o.date).slice(0,7)===m; }).forEach(function(o){
    var r=by[o.vendorId]=by[o.vendorId]||{id:o.vendorId,n:0,sub:0,com:0,ref:0};
    if(o.status==='refunded'){ r.ref++; return; }
    r.n++; r.sub+=o.subtotal; r.com+=o.commission;
  });
  var rows=Object.keys(by).map(function(id){ var v=vendor(id), r=by[id]; r.name=v?v.name:'Proveedor dado de baja'; r.cuit=v?v.cuit:''; r.inv=!!db.invoiced[m+'|'+id]; return r; }).sort(function(a,b){ return b.com-a.com; });
  return {m:m,ms:ms,rows:rows};
}
function commissionsView(){
  var c=commissionRows(), T={n:0,sub:0,com:0}, pend=0;
  c.rows.forEach(function(r){ T.n+=r.n; T.sub+=r.sub; T.com+=r.com; if(!r.inv&&r.com) pend+=r.com; });
  return '<div class="card">'+chead('pct','Comisiones a facturar','Mercado Pago ya descontó la comisión en cada pago. A fin de mes le hacés a cada proveedor la factura por lo que se le cobró.',exportBar('comisiones'))
    +'<div class="filters"><div class="field"><label for="com-month">Mes</label><select id="com-month">'+c.ms.map(function(x){ return '<option value="'+x+'"'+(x===c.m?' selected':'')+'>'+monthName(x)+'</option>'; }).join('')+'</select></div></div>'
    +'<p class="sumline">Comisión del mes <b class="num">'+money(T.com)+'</b>'+(pend?' · Falta facturar <b class="num">'+money(pend)+'</b>':(T.com?' · <span class="st ok">Todo facturado</span>':''))+'</p>'
    +(c.rows.length?'<div class="tablewrap flat"><table style="min-width:780px"><thead><tr><th>Proveedor</th><th>CUIT</th><th class="r">Ventas</th><th class="r">Productos vendidos</th><th class="r">Comisión</th><th>Factura</th><th></th></tr></thead><tbody>'
      +c.rows.map(function(r){ return '<tr><td><b>'+esc(r.name)+'</b></td><td class="nw">'+(r.cuit?esc(r.cuit):'<span class="muted">Sin CUIT</span>')+'</td><td class="r num">'+r.n+(r.ref?'<span class="sub">'+r.ref+(r.ref===1?' devuelta':' devueltas')+'</span>':'')+'</td><td class="r num">'+money(r.sub)+'</td><td class="r num"><b>'+money(r.com)+'</b></td>'
        +'<td>'+(r.com?(r.inv?'<span class="st ok">Facturada</span>':'<span class="st warn">A facturar</span>'):'<span class="st neu">Sin comisión</span>')+'</td>'
        +'<td class="r">'+(r.com?'<button class="btn '+(r.inv?'btn-outline':'btn-primary')+' btn-sm" data-act="inv" data-id="'+r.id+'" data-month="'+c.m+'">'+(r.inv?'Deshacer':'Marcar facturada')+'</button>':'')+'</td></tr>'; }).join('')
      +'</tbody><tfoot><tr><td><b>Total</b></td><td></td><td class="r num">'+T.n+'</td><td class="r num">'+money(T.sub)+'</td><td class="r num"><b>'+money(T.com)+'</b></td><td></td><td></td></tr></tfoot></table></div>'
      :'<div class="empty">No hubo ventas en este mes.</div>')
    +'<p class="note">El monto y el tipo de factura conviene confirmarlos con el contador.</p></div>';
}
function buyerRows(){
  var by={};
  db.orders.forEach(function(o){
    var k=norm(o.buyer)||'(sin nombre)', b=by[k]=by[k]||{name:o.buyer||'(sin nombre)',n:0,units:0,total:0,first:o.date,last:o.date,vendors:[],ref:0};
    if(o.status==='refunded'){ b.ref++; return; }
    b.n++; b.units+=o.qty; b.total+=o.subtotal+o.shipping; if(o.date<b.first) b.first=o.date; if(o.date>b.last) b.last=o.date;
    var v=vendor(o.vendorId); if(v&&b.vendors.indexOf(v.name)<0) b.vendors.push(v.name);
  });
  var rows=Object.keys(by).map(function(k){ return by[k]; });
  rows.forEach(function(b){ var em={}; db.orders.forEach(function(o){ if(norm(o.buyer)===norm(b.name)&&o.ship&&o.ship.email) em[norm(o.ship.email)]=1; }); b.acc=(db.buyers||[]).filter(function(x){ return em[norm(x.email)]||norm(x.name)===norm(b.name); })[0]||null; });
  (db.buyers||[]).forEach(function(x){ if(!rows.some(function(r){ return r.acc===x; })) rows.push({name:x.name,n:0,units:0,total:0,first:x.created||'',last:'',vendors:[],ref:0,acc:x}); });
  var q=plain(ui.buyerQ||'');
  return rows.filter(function(b){ return !q||plain(b.name).indexOf(q)>=0; }).sort(function(a,b){ return b.total-a.total; });
}
function buyersView(){
  var rows=buyerRows(), rep=rows.filter(function(b){ return b.n>1; }).length;
  return '<div class="card">'+chead('users','Compradores','Los gimnasios y clubes que compraron en el sitio, del que más compró al que menos.',exportBar('compradores'))
    +'<div class="filters"><div class="field"><label for="buyer-q">Buscar comprador</label><input id="buyer-q" type="search" value="'+esc(ui.buyerQ||'')+'" placeholder="Nombre o razón social"></div></div>'
    +'<p class="sumline"><b>'+rows.length+(rows.length===1?' comprador':' compradores')+'</b>'+(rows.length?' · '+(rep===1?'1 volvió a comprar':rep+' volvieron a comprar')+' · '+rows.filter(function(r){ return r.acc; }).length+' con cuenta':'')+'</p>'
    +(rows.length?'<div class="tablewrap flat"><table style="min-width:860px"><thead><tr><th class="r">#</th><th>Comprador</th><th class="r">Compras</th><th class="r">Unidades</th><th class="r">Total comprado</th><th>Última compra</th><th>Le compró a</th></tr></thead><tbody>'
      +rows.map(function(b,i){ return '<tr><td class="r num">'+(i+1)+'</td><td><b>'+esc(b.name)+'</b>'+(b.acc?' <span class="st ok">Con cuenta</span>':' <span class="st neu">Invitado</span>')+(b.n>1?' <span class="st ok">Volvió a comprar</span>':'')+(b.acc?'<span class="sub">'+esc(b.acc.email)+(b.acc.cuit?' · CUIT '+esc(b.acc.cuit):'')+' · '+(b.acc.addresses||[]).length+((b.acc.addresses||[]).length===1?' dirección':' direcciones')+' · '+(b.acc.favs||[]).length+' favoritos'+(b.acc.logins&&b.acc.logins[0]?' · último ingreso '+fdate(b.acc.logins[0].slice(0,10)):'')+'</span>':'')+(b.ref?'<span class="sub">'+b.ref+(b.ref===1?' devolución':' devoluciones')+'</span>':'')+'</td><td class="r num">'+b.n+'</td><td class="r num">'+b.units+'</td><td class="r num"><b>'+money(b.total)+'</b></td><td class="nw">'+(b.last?fdate(b.last):'—')+'</td><td>'+esc(b.vendors.join(', ')||'—')+'</td></tr>'; }).join('')
      +'</tbody></table></div>':'<div class="empty">No hay compradores con ese nombre.</div>')+'</div>';
}

/* ---------- Catálogo ---------- */
var COLORS=[{v:'red',l:'Rojo'},{v:'blue',l:'Azul'},{v:'yellow',l:'Amarillo'},{v:'green',l:'Verde'},{v:'white',l:'Blanco'},{v:'iron',l:'Gris hierro'}];
function offersOf(cat,model,size){ return db.offers.filter(function(o){ return o.category===cat&&(model==null||o.model===model)&&(size==null||o.size===size); }); }
function saveCatalog(what){ db.catalog=CATALOG; logAct(what); return save(); }
function photoBox(key,label,fallback){
  var u=img(key);
  return '<div class="photo"><div class="photo-prev">'+(u?'<img src="'+esc(u)+'" alt="Foto de '+esc(label)+'">':fallback)+'</div>'
    +'<div class="photo-act"><span class="muted small">'+(u?'Foto propia':'Ilustración de muestra')+'</span>'
    +'<label class="btn btn-outline btn-sm filebtn">'+ico('image',18)+(u?'Cambiar foto':'Subir foto')+'<input type="file" accept="image/*" data-img="'+esc(key)+'" class="sr"></label>'
    +(u?'<button type="button" class="btn btn-outline btn-sm" data-act="img-del" data-key="'+esc(key)+'">Quitar foto</button>':'')+'</div></div>';
}
function catalogView(){
  if(!catBy(ui.catSel)) ui.catSel=ui.catSel==='new'?'new':CATALOG[0].n;
  var list='<div class="catlist" role="list">'+CATALOG.map(function(c){ var n=offersOf(c.n).length;
      return '<button type="button" role="listitem" data-act="cat-sel" data-cat="'+esc(c.n)+'"'+(ui.catSel===c.n?' aria-current="true"':'')+'><span class="cl-dot" style="background:'+(c.c==='iron'?'var(--iron)':'var(--plate-'+(c.c||'green')+')')+'"></span><span class="cl-t"><b>'+esc(c.n)+'</b><span class="muted small">'+c.m.length+' modelos · '+n+(n===1?' oferta':' ofertas')+'</span></span></button>'; }).join('')
    +'<button type="button" class="btn btn-accent" data-act="cat-new">Agregar categoría</button></div>';
  return '<div class="catgrid">'+list+'<div class="catedit">'+(ui.catSel==='new'?catForm(null):catEditor(catBy(ui.catSel)))+'</div></div>'
    +'<div class="card">'+chead('refund','Catálogo original','Si algo quedó mal, podés volver al catálogo con el que arrancó el sitio. Las ofertas de categorías o modelos que ya no existan dejan de mostrarse.')
    +'<div><button class="btn btn-danger" data-act="cat-reset"'+(db.catalog?'':' disabled')+'>'+(ui.confirm==='cat-reset'?'Confirmar: volver al original':'Volver al catálogo original')+'</button></div></div>';
}
function catForm(c){
  var d=c||{n:'',c:'green',intro:'',clave:'',attrs:''};
  return '<form id="catform" class="card" novalidate>'+chead('productos',c?'Datos de la categoría':'Nueva categoría',c?'Lo que ve el comprador arriba de la categoría.':'Después de crearla le agregás los modelos y sus variantes.')
    +'<div id="cat-err" class="alert bad" role="alert" hidden></div><div class="formgrid">'
    +fld('cat-n','Nombre',inp('cat-n',d.n,'type="text" maxlength="40"'))
    +fld('cat-c','Color',sel('cat-c',COLORS,d.c||'green'),'Se usa en la ilustración si no hay foto.')
    +'<div class="field" style="grid-column:1 / -1"><label for="cat-intro">Presentación</label><textarea id="cat-intro" rows="2" maxlength="300">'+esc(d.intro)+'</textarea></div>'
    +'<div class="field" style="grid-column:1 / -1"><label for="cat-clave">Clave para comparar</label><textarea id="cat-clave" rows="2" maxlength="400">'+esc(d.clave)+'</textarea><span class="hint">Qué tiene que coincidir para que dos ofertas se puedan comparar.</span></div>'
    +'<div class="field" style="grid-column:1 / -1"><label for="cat-attrs">Datos a pedirle al proveedor</label><input id="cat-attrs" type="text" maxlength="200" value="'+esc(d.attrs)+'"></div>'
    +'</div><div class="actions"><button class="btn btn-primary" type="submit">'+(c?'Guardar':'Crear categoría')+'</button>'
    +(c?'':'<button class="btn btn-outline" type="button" data-act="cat-sel" data-cat="'+esc(CATALOG[0].n)+'">Cancelar</button>')
    +(c&&!offersOf(c.n).length?'<button class="btn '+(ui.confirm==='catdel'?'btn-danger':'btn-outline')+'" type="button" data-act="cat-del">'+(ui.confirm==='catdel'?'Confirmar: eliminar '+esc(c.n):'Eliminar categoría')+'</button>':'')+'</div>'
    +(c&&offersOf(c.n).length?'<p class="note">Tiene ofertas cargadas: para eliminarla, primero hay que sacar esas ofertas.</p>':'')+'</form>';
}
function catEditor(c){
  return catForm(c)
    +'<div class="card">'+chead('image','Foto de la categoría','Va en la tarjeta de la categoría, en Compará y comprá. Mejor apaisada, con el producto al centro.')+photoBox('cat:'+c.n,c.n,'<span class="ph-ill">'+ico('image',40)+'<span>Ilustración de muestra</span></span>')+'</div>'
    +'<div class="card">'+chead('list','Modelos y variantes','Cada modelo es un producto del catálogo; las variantes son sus medidas o pesos. Solo se comparan ofertas de la misma variante.',' <button class="btn btn-accent btn-sm" data-act="m-new">Agregar modelo</button>')
    +(ui.mEdit==='new'?modelForm(c,null):'')
    +'<div class="models">'+c.m.map(function(m,i){
      if(ui.mEdit===i) return modelForm(c,i);
      var n=offersOf(c.n,m[0]).length;
      return '<div class="mrow"><div class="mrow-t"><b>'+esc(m[0])+'</b><span class="muted small">'+esc(m[2]||'')+'</span><div class="vlist">'+m[1].map(function(v){ var k=offersOf(c.n,m[0],v).length; return '<span class="vtag'+(k?' has':'')+'">'+esc(v)+(k?' · '+k:'')+'</span>'; }).join('')+'</div></div>'
        +'<div class="actions nw"><button class="btn btn-primary btn-sm" data-act="m-edit" data-i="'+i+'">Editar</button>'
        +(n?'':'<button class="btn '+(ui.confirm==='mdel'+i?'btn-danger':'btn-outline')+' btn-sm" data-act="m-del" data-i="'+i+'">'+(ui.confirm==='mdel'+i?'Confirmar':'Eliminar')+'</button>')+'</div></div>';
    }).join('')+'</div><p class="note">El número al lado de cada variante es la cantidad de ofertas cargadas. Las variantes con ofertas no se pueden borrar hasta sacar esas ofertas.</p></div>';
}
function modelForm(c,i){
  var m=i==null?['',[],'']:c.m[i];
  return '<form id="mform" class="card sub" novalidate data-i="'+(i==null?'':i)+'"><h3 class="display h-card">'+(i==null?'Nuevo modelo en '+esc(c.n):'Editar '+esc(m[0]))+'</h3>'
    +'<div id="m-err" class="alert bad" role="alert" hidden></div>'
    +fld('m-name','Nombre del modelo',inp('m-name',m[0],'type="text" maxlength="80"'))
    +'<div class="field"><label for="m-vars">Variantes</label><textarea id="m-vars" rows="4">'+esc(m[1].join('\n'))+'</textarea><span class="hint">Una por renglón. Por ejemplo: 2 kg, 4 kg, 6 kg.</span></div>'
    +'<div class="field"><label for="m-desc">Descripción</label><textarea id="m-desc" rows="2" maxlength="400">'+esc(m[2]||'')+'</textarea></div>'
    +'<div class="actions"><button class="btn btn-primary" type="submit">'+(i==null?'Agregar modelo':'Guardar')+'</button><button class="btn btn-outline" type="button" data-act="m-cancel">Cancelar</button></div></form>';
}

/* ---------- Espacios de la portada ---------- */
function spacesCard(){
  var S=spaces();
  return '<div class="card" id="spaces">'+chead('image','Espacios de la portada','Los lugares donde se usa el equipamiento. Cada espacio lleva a sus categorías.','<button class="btn btn-accent btn-sm" data-act="sp-new">Agregar espacio</button>')
    +'<div class="spgrid">'+S.map(function(s,i){
      if(ui.spEdit===i) return spaceForm(s,i);
      return '<div class="spitem"><div class="sp-img">'+(img('space:'+s.a)?'<img src="'+esc(img('space:'+s.a))+'" alt="">':'<span class="ph-ill">'+ico('image',32)+'<span>Ilustración</span></span>')+'</div>'
        +'<div class="sp-b"><b>'+esc(s.n)+'</b><span class="muted small">'+esc(s.d)+'</span><span class="small accent-t">'+s.cats.map(esc).join(' · ')+'</span></div>'
        +'<div class="actions"><button class="btn btn-primary btn-sm" data-act="sp-edit" data-i="'+i+'">Editar</button>'
        +'<label class="btn btn-outline btn-sm filebtn">'+ico('image',18)+(img('space:'+s.a)?'Cambiar foto':'Subir foto')+'<input type="file" accept="image/*" data-img="space:'+esc(s.a)+'" class="sr"></label>'
        +(img('space:'+s.a)?'<button type="button" class="btn btn-outline btn-sm" data-act="img-del" data-key="space:'+esc(s.a)+'">Quitar foto</button>':'')
        +'<button class="btn '+(ui.confirm==='spdel'+i?'btn-danger':'btn-outline')+' btn-sm" data-act="sp-del" data-i="'+i+'">'+(ui.confirm==='spdel'+i?'Confirmar':'Quitar')+'</button></div></div>';
    }).join('')+(ui.spEdit==='new'?spaceForm(null,'new'):'')+'</div></div>';
}
function spaceForm(s,i){
  var d=s||{n:'',d:'',cats:[]};
  return '<form id="spform" class="spitem editing-card" novalidate data-i="'+i+'"><div id="sp-err" class="alert bad" role="alert" hidden></div>'
    +fld('sp-n','Nombre',inp('sp-n',d.n,'type="text" maxlength="50"'))
    +fld('sp-d','Descripción',inp('sp-d',d.d,'type="text" maxlength="90"'))
    +'<fieldset><legend>Categorías que se muestran</legend><div class="checks">'+CATALOG.map(function(c,k){ return '<label class="check sm"><input type="checkbox" data-spcat="'+esc(c.n)+'"'+(d.cats.indexOf(c.n)>=0?' checked':'')+'> '+esc(c.n)+'</label>'; }).join('')+'</div></fieldset>'
    +'<div class="actions"><button class="btn btn-primary btn-sm" type="submit">Guardar</button><button class="btn btn-outline btn-sm" type="button" data-act="sp-cancel">Cancelar</button></div></form>';
}

/* ---------- Fotos: se achican antes de guardarlas ---------- */
function readImage(file,done){
  if(!file||!/^image\//.test(file.type)){ toast('Elegí un archivo de imagen (JPG o PNG).'); return; }
  var fr=new FileReader();
  fr.onload=function(){
    var im=new Image();
    im.onload=function(){
      var max=1000, w=im.naturalWidth, h=im.naturalHeight, k=Math.min(1,max/Math.max(w,h));
      var cv=document.createElement('canvas'); cv.width=Math.round(w*k); cv.height=Math.round(h*k);
      var cx=cv.getContext('2d'); cx.fillStyle='#0C100D'; cx.fillRect(0,0,cv.width,cv.height); cx.drawImage(im,0,0,cv.width,cv.height);
      var out=''; try{ out=cv.toDataURL('image/jpeg',0.8); }catch(e){}
      if(!out){ toast('No se pudo leer la imagen.'); return; }
      done(out);
    };
    im.onerror=function(){ toast('No se pudo leer la imagen.'); };
    im.src=fr.result;
  };
  fr.readAsDataURL(file);
}

/* ---------- Novedades: los numeritos del menú salen solo de acá ---------- */
var NKIND={user:['usuarios','Usuario'],price:['alert','Precio raro'],sale:['bag','Venta'],refund:['refund','Devolución'],vendor:['vendedores','Alta'],product:['productos','Producto'],late:['alert','Demora'],mp:['money','Mercado Pago'],data:['pages','Datos'],ship:['ventas','Envío']};
var NPREF=[['sale','Ventas nuevas'],['user','Usuarios nuevos'],['price','Precios raros'],['refund','Devoluciones'],['late','Pedidos demorados'],['vendor','Solicitudes de alta de proveedores'],['product','Productos para aprobar'],['mp','Proveedores que conectan o desconectan Mercado Pago'],['data','Proveedores que actualizan sus datos'],['ship','Pedidos enviados']];
function unread(tab){ return (db.notifs||[]).filter(function(n){ return !n.read&&(!tab||n.tab===tab); }).length; }
function markRead(tab){ var ch=false; (db.notifs||[]).forEach(function(n){ if(!n.read&&(!tab||n.tab===tab)){ n.read=true; ch=true; } }); if(ch) save(); }
function ago(iso){
  var t=new Date(iso).getTime(), s=(Date.now()-t)/1000; if(isNaN(s)) return '';
  if(s<60) return 'recién'; if(s<3600) return 'hace '+Math.floor(s/60)+' min'; if(s<86400) return 'hace '+Math.floor(s/3600)+' h';
  var d=Math.floor(s/86400); if(d===1) return 'ayer'; if(d<30) return 'hace '+d+' días';
  return fdate(String(iso).slice(0,10));
}
/* Pedidos que se pasaron del plazo: avisan una sola vez. */
function checkLate(){
  var ch=false;
  db.orders.forEach(function(o){ if(!o.lateN&&lateDays(o)>0){ var v=vendor(o.vendorId); notify('late','ventas','El pedido #'+o.id+' de '+(v?v.name:'un proveedor')+' está demorado: ya pasó el plazo de entrega y no figura enviado.',o.id); o.lateN=true; ch=true; } });
  if(ch) save();
}
function bellPanel(){
  var N=(db.notifs||[]).slice(0,40);
  return '<div class="bellp card" id="bellp"><div class="ch"><span class="ic">'+ico('bell')+'</span><div class="ch-t"><h2 class="display h-card">Novedades</h2><p class="muted small">Lo que pasó en el sitio y tenés que saber.'+(db.prefs&&db.prefs.email?' También te llegan a '+esc(db.prefs.email)+'.':'')+'</p></div>'
    +(unread()?'<button class="btn btn-outline btn-sm" data-act="n-readall">Marcar todo como leído</button>':'')+'<button class="btn btn-outline btn-sm" data-act="bell" aria-label="Cerrar novedades">Cerrar</button></div>'
    +(N.length?'<ol class="nlist">'+N.map(function(n){ var k=NKIND[n.kind]||['bell','Aviso'];
      return '<li class="'+(n.read?'':'new')+'"><button type="button" data-act="n-go" data-id="'+n.id+'"><span class="ic sm k-'+n.kind+'">'+ico(k[0],18)+'</span><span class="n-b"><span class="n-t">'+esc(n.text)+'</span><span class="muted small">'+k[1]+' · '+ago(n.t)+'</span></span>'+(n.read?'':'<span class="n-dot" aria-label="Sin leer"></span>')+'</button></li>'; }).join('')+'</ol>'
      :'<div class="empty">No hay novedades por ahora. Cuando entre una venta, se pida un alta, haya un producto para aprobar o una devolución, aparece acá y como numerito en el menú.</div>')+'</div>';
}
function prefsCard(){
  var P=db.prefs||{};
  return '<form id="prefs" class="card" novalidate style="max-width:720px">'+chead('bell','Avisos','Qué novedades querés recibir. En el panel aparecen todas; las que marques también te llegan por email.')
    +'<div class="field" style="max-width:420px"><label for="pf-email">Email para los avisos</label><input id="pf-email" type="email" value="'+esc(P.email||'')+'" placeholder="tu@email.com"></div>'
    +'<div class="checks">'+NPREF.map(function(p){ return '<label class="check sm"><input type="checkbox" data-pref="'+p[0]+'"'+(P[p[0]]?' checked':'')+'> '+p[1]+'</label>'; }).join('')+'</div>'
    +'<p class="note">En esta demo los avisos se ven en Novedades. Cuando el sitio esté publicado, el servidor manda el email en el momento.</p>'
    +'<div><button class="btn btn-primary" type="submit">Guardar avisos</button></div></form>';
}

/* ---------- Proveedores: lista y ficha ---------- */
function vStats(v){
  var mine=db.orders.filter(function(o){ return o.vendorId===v.id; }), ok=mine.filter(function(o){ return o.status==='approved'; });
  var offs=db.offers.filter(function(o){ return o.vendorId===v.id; }), now=today(), mo=now.slice(0,7);
  var L=v.logins||[];
  return {orders:mine,ok:ok,ref:mine.length-ok.length,sold:ok.reduce(function(a,o){ return a+o.subtotal+o.shipping; },0),com:ok.reduce(function(a,o){ return a+o.commission; },0),
    offs:offs,pub:offs.filter(function(o){ return o.status==='published'; }).length,rev:offs.filter(function(o){ return o.status==='review'; }).length,
    stale:offs.filter(function(o){ return o.status==='published'&&calDays(o.updated||now,now)>30; }).length,nostock:offs.filter(function(o){ return stockState(o)==='none'; }).length,low:offs.filter(function(o){ return stockState(o)==='low'; }).length,odd:offs.filter(function(o){ return o.status!=='rejected'&&priceCheck(o,o.id,o.vendorId); }).length,
    toship:ok.filter(function(o){ return !o.shipped; }).length,late:mine.filter(function(o){ return lateDays(o)>0; }).length,
    logins:L.length,loginsMo:L.filter(function(t){ return t.slice(0,7)===mo; }).length,last:L[0]||'',clicks:(sumClicks('v',mo)[v.id]||0)};
}
function vendorList(){
  return '<div class="section-head" style="margin:0"><p class="note">Las marcas que venden en el sitio. Cada una se lleva el '+(100-db.commission)+'% de sus ventas. Entrá a la ficha para ver todo lo que cargó y cómo le va.</p><button class="btn btn-accent" data-act="v-new">Agregar proveedor</button></div>'
    +(ui.vForm==='new'?vendorForm():'')
    +'<div class="vcards">'+db.vendors.map(function(v){
      var S=vStats(v), cp=vComplete(v), idle=S.last&&calDays(S.last.slice(0,10),today())>14;
      return '<div class="vcard"><div class="vc-h"><span class="avatar lg" aria-hidden="true">'+esc(v.name.charAt(0))+'</span><div class="vc-t"><b>'+esc(v.name)+'</b><span class="muted small">'+esc([v.type,v.city].filter(Boolean).join(' · '))+'</span></div>'+vendorStatus(v)+'</div>'
        +'<div class="vc-stats"><div><span class="muted small">Vendido</span><b class="num">'+money(S.sold)+'</b></div><div><span class="muted small">Ventas</span><b class="num">'+S.ok.length+'</b></div><div><span class="muted small">Productos</span><b class="num">'+S.pub+'</b></div>'
        +'<div><span class="muted small">Ingresos al panel</span><b class="num">'+S.logins+'</b></div></div>'
        +'<div class="vc-meta small"><span>'+ico('clock',16)+(S.last?'Último ingreso '+ago(S.last)+(idle?' <span class="st warn">Hace mucho</span>':''):'Nunca entró al panel')+'</span>'
        +(S.low||S.nostock?'<span>'+ico('productos',16)+(S.low?'<span class="st warn">'+S.low+' con bajo stock</span>':'')+(S.nostock?' <span class="st bad">'+S.nostock+' sin stock</span>':'')+'</span>':'')+'<span>'+ico('pages',16)+'Datos '+cp.pct+'%'+(cp.pct<100?' <span class="st warn">Incompletos</span>':'')+'</span>'
        +'<span>'+ico('money',16)+(v.mp?'Mercado Pago conectado':'<span class="st bad">Sin Mercado Pago</span>')+'</span></div>'
        +'<div class="actions"><button class="btn btn-primary btn-sm" data-act="v-open" data-id="'+v.id+'">Ver ficha</button>'+vActs(v)+'</div></div>';
    }).join('')+'</div>';
}
function vActs(v){
  if(v.status==='pending') return '<button class="btn btn-accent btn-sm" data-act="v-approve" data-id="'+v.id+'">Aprobar</button><button class="btn btn-outline btn-sm" data-act="v-reject" data-id="'+v.id+'">Rechazar</button>';
  if(v.status==='active') return '<button class="btn btn-outline btn-sm" data-act="v-suspend" data-id="'+v.id+'">Suspender</button>';
  return '<button class="btn btn-outline btn-sm" data-act="v-approve" data-id="'+v.id+'">'+(v.status==='suspended'?'Reactivar':'Aprobar')+'</button>';
}
function vendorFile(v){
  var S=vStats(v), cp=vComplete(v), now=today(), idle=S.last&&calDays(S.last.slice(0,10),now)>14;
  /* Ingresos por semana, últimas 10 semanas */
  var weeks=[]; for(var i=9;i>=0;i--){ var to=addDays(now,-i*7), from=addDays(to,-6); weeks.push({from:from,to:to,n:(v.logins||[]).filter(function(t){ var d=t.slice(0,10); return d>=from&&d<=to; }).length}); }
  var wchart=colChart(weeks.map(function(w,k){ return {n:w.n,tip:'Semana del '+fdate(w.from)+' al '+fdate(w.to)+': '+w.n+(w.n===1?' ingreso':' ingresos'),lab:k%3===0||k===9?fdate(w.from):'',cls:k===9?'today':''}; }),{aria:'Ingresos al panel por semana',cls:'small'});
  var field=function(f){ var x=String(v[f[0]]||'').trim(); if(f[0]==='web'&&x) x='<a href="'+esc(safeUrl(x)||'#')+'" target="_blank" rel="noopener">'+esc(x)+'</a>'; else x=x?esc(x):'<span class="muted">Sin cargar</span>'; return '<div><dt>'+f[1]+'</dt><dd>'+x+'</dd></div>'; };
  var zones=(v.zones||[]).map(function(z){ return (ZONES.filter(function(q){ return q[0]===z; })[0]||['',z])[1]; });
  var perf=[
    ['Pedidos por enviar',S.toship,S.toship?'warn':'ok'],
    ['Pedidos demorados ahora',S.late,S.late?'bad':'ok'],
    ['Devoluciones',S.orders.length?S.ref+' de '+S.orders.length+' ('+Math.round(S.ref/S.orders.length*100)+'%)':'0',S.ref?'warn':'ok'],
    ['Precios sin actualizar hace más de 30 días',S.stale,S.stale?'warn':'ok'],
    ['Precios raros',S.odd,S.odd?'warn':'ok'],
    ['Productos con bajo stock',S.low,S.low?'warn':'ok'],
    ['Productos sin stock',S.nostock,S.nostock?'bad':'ok'],
    ['Clics en su marca este mes',S.clicks,'neu'],
    ['Nombre en Mercado Pago',esc(mpName(v))+(mpNameOk(v)?'':' · no coincide'),mpNameOk(v)?(v.mpName?'ok':'neu'):'bad'],
    ['Pago de prueba',v.mpTest?'Hecho el '+fdate(v.mpTest):'Sin hacer',v.mpTest?'ok':'warn'],
    ['Comisión que cobra',pctOf(v)+'%'+(v.commission==null?' (la general)':' (especial)'),'neu']
  ];
  return '<div><button class="linkbtn" data-act="v-back">← Todos los proveedores</button></div>'
    +'<div class="card vfile-h"><div class="vc-h"><span class="avatar xl" aria-hidden="true">'+esc(v.name.charAt(0))+'</span><div class="vc-t"><h2 class="display h-page" style="font-size:2.2rem!important">'+esc(v.name)+'</h2><span class="muted">'+esc([v.razon,v.type,v.city&&v.prov?v.city+', '+v.prov:(v.city||v.prov)].filter(Boolean).join(' · '))+'</span><span class="small muted">'+(v.since?'En el sitio desde el '+fdate(v.since)+' · ':'')+(v.user&&v.hash?'Usuario: '+esc(v.user):'Sin clave para entrar')+'</span></div>'+vendorStatus(v)+'</div>'
    +'<div class="actions"><button class="btn btn-primary btn-sm" data-act="v-edit" data-id="'+v.id+'">Editar datos y clave</button>'+vActs(v)
    +'<button class="btn btn-outline btn-sm" data-act="goto" data-tab="ventas" data-month="" data-status="" data-vendor="'+v.id+'">Ver sus ventas</button>'
    +'<button class="btn btn-outline btn-sm" data-act="stale" data-id="'+v.id+'">Ver su stock</button>'
    +(v.wa?'<a class="btn btn-outline btn-sm" href="https://wa.me/'+esc(digits(v.wa)?String(v.wa).replace(/\D/g,''):'')+'" target="_blank" rel="noopener">'+CHAT+'WhatsApp</a>':'')
    +(v.email?'<a class="btn btn-outline btn-sm" href="mailto:'+esc(v.email)+'">Email</a>':'')+'</div></div>'
    +(ui.vForm===v.id?vendorForm():'')+promotionForm(v)
    +'<div class="tiles kpis">'
    +kpi('money','Vendido',money(S.sold),'<span class="s">'+S.ok.length+(S.ok.length===1?' venta':' ventas')+(S.ref?' · '+S.ref+(S.ref===1?' devuelta':' devueltas'):'')+'</span>','main')
    +kpi('pct','Comisión generada',money(S.com),'<span class="s">Para el sitio, desde que empezó</span>')
    +kpi('productos','Productos publicados',S.pub,'<span class="s">'+S.offs.length+' cargados'+(S.rev?' · '+S.rev+' en revisión':'')+'</span>')
    +kpi('users','Ingresos al panel',S.logins,'<span class="s">'+S.loginsMo+' este mes</span>')
    +kpi('clock','Último ingreso',S.last?ago(S.last):'Nunca','<span class="s'+(idle?' down':'')+'">'+(S.last?(idle?'Hace mucho que no entra':when(S.last)):'Todavía no entró')+'</span>')
    +kpi('pages','Datos completos',cp.pct+'%','<span class="s'+(cp.pct<100?' down':'')+'">'+(cp.pct<100?'Le faltan '+cp.miss.length:'Completos')+'</span>')
    +'</div>'
    +'<div class="grid2">'
    +'<div class="card">'+chead('pages','Datos de la empresa','Lo que cargó el proveedor en su panel.'+(cp.miss.length?' Falta: '+esc(cp.miss.join(', '))+'.':''))
    +'<span class="track"><i style="width:'+cp.pct+'%"></i></span>'
    +VFIELDS.map(function(g){ return '<div class="dl-g"><p class="eyebrow">'+g[0]+'</p><dl class="dl">'+g[1].map(field).join('')+'</dl></div>'; }).join('')
    +'<div class="dl-g"><p class="eyebrow">Envíos</p><p>'+(zones.length?esc(zones.join(' · ')):'<span class="muted">Sin cargar</span>')+'</p></div></div>'
    +'<div class="vcol">'
    +'<div class="card">'+chead('users','Ingresos al panel',S.logins?S.logins+' en total · '+S.loginsMo+' este mes':'Todavía no entró.')+wchart
    +((v.logins||[]).length?'<ol class="log">'+(v.logins||[]).slice(0,6).map(function(t){ return '<li class="two"><span class="log-t num">'+when(t)+'</span><span>'+ago(t)+'</span></li>'; }).join('')+'</ol>':'')+'</div>'
    +'<div class="card">'+chead('target','Cómo le va','Lo que conviene mirar de cada proveedor.')
    +'<ul class="perf">'+perf.map(function(p){ return '<li><span>'+p[0]+'</span><span class="st '+p[2]+'">'+p[1]+'</span></li>'; }).join('')+'</ul></div>'
    +'</div></div>'
    +'<div class="card">'+chead('list','Actividad','Lo último que hizo en el sitio.')
    +((v.act||[]).length?'<ol class="log">'+(v.act||[]).slice(0,12).map(function(e){ return '<li class="two"><span class="log-t num">'+when(e.t)+'</span><span>'+esc(e.what)+'</span></li>'; }).join('')+'</ol>':'<div class="empty">Sin actividad todavía.</div>')+'</div>'
    +'<div class="section-head" style="margin:8px 0 0"><div class="ch"><span class="ic">'+ico('ventas')+'</span><h2 class="display h-card">Últimas ventas</h2></div></div>'+salesTable(S.orders.slice(0,5))
    +'<div class="section-head" style="margin:8px 0 0"><div class="ch"><span class="ic">'+ico('productos')+'</span><h2 class="display h-card">Sus productos</h2></div><button class="btn btn-accent btn-sm" data-act="o-new-for" data-id="'+v.id+'">Agregar producto</button></div>'
    +(S.offs.length?'<div class="tablewrap"><table style="min-width:760px"><thead><tr><th>Modelo</th><th>Variante</th><th class="r">Precio</th><th>Stock</th><th>Estado</th><th>Precio actualizado</th></tr></thead><tbody>'
      +S.offs.map(function(o){ var age=calDays(o.updated||now,now); return '<tr><td><b>'+esc(o.model)+'</b><span class="sub">'+esc(o.category)+'</span></td><td>'+esc(o.size)+'</td><td class="r num">'+money(o.price)+priceBadge(o)+'</td><td class="nw">'+stockBadge(o)+'</td><td>'+offerStatus(o)+'</td><td class="nw">'+(o.updated?fdate(o.updated):'—')+(age>30?' <span class="st warn">Hace '+age+' días</span>':'')+'</td></tr>'; }).join('')+'</tbody></table></div>'
      :'<div class="empty">Todavía no cargó productos.</div>');
}

/* ---------- Usuarios: las cuentas de los compradores ---------- */
var VIA={email:'Email y clave',google:'Google',quick:'Al terminar una compra'};
var U_F=[['all','Todos'],['buyers','Con compras'],['nobuy','Sin compras'],['active','Activos (30 días)'],['idle','Sin entrar hace 60 días'],['mkt','Aceptan ofertas'],['blocked','Bloqueados']];
function uOrders(b){ return db.orders.filter(function(o){ return o.buyerId===b.id||(o.ship&&norm(o.ship.email)===norm(b.email)); }).sort(function(a,c){ return String(c.date).localeCompare(String(a.date))||c.id-a.id; }); }
function uBest(f){ var list=db.offers.filter(function(o){ return isLive(o)&&o.unit===f.unit&&vkey(o.category,o.model,o.size)===vkey(f.cat,f.model,f.size); }); return list.sort(function(a,c){ return a.price-c.price; })[0]||null; }
function uStats(b){
  var O=uOrders(b), ok=O.filter(function(o){ return o.status==='approved'; }), now=today();
  var buys={}; ok.forEach(function(o){ buys[o.payRef||('o'+o.id)]=o.date; });
  var dates=Object.keys(buys).map(function(k){ return buys[k]; }).sort();
  var gaps=[]; for(var i=1;i<dates.length;i++) gaps.push(calDays(dates[i-1],dates[i]));
  var spent=ok.reduce(function(a,o){ return a+o.subtotal+o.shipping; },0), last=b.logins&&b.logins[0]?b.logins[0]:'';
  var drops=(b.favs||[]).filter(function(f){ var x=uBest(f); return f.alert&&x&&x.price<f.price; });
  return {orders:O,ok:ok,purchases:dates.length,spent:spent,ticket:dates.length?spent/dates.length:0,first:dates[0]||'',lastBuy:dates[dates.length-1]||'',
    every:gaps.length?Math.round(gaps.reduce(function(a,g){ return a+g; },0)/gaps.length):0,since:dates.length?calDays(dates[dates.length-1],now):null,
    refunds:O.length-ok.length,lastLogin:last,idle:last?calDays(last.slice(0,10),now):null,drops:drops,city:((b.addresses||[]).filter(function(a){ return a.def; })[0]||(b.addresses||[])[0]||{}).city||''};
}
function uRows(){
  var q=plain(ui.uQ||''), f=ui.uF||'all';
  var rows=(db.buyers||[]).map(function(b){ return {b:b,s:uStats(b)}; }).filter(function(r){
    var b=r.b, s=r.s;
    if(q&&plain([b.name,b.email,b.cuit,b.phone,s.city].join(' ')).indexOf(q)<0) return false;
    if(f==='buyers') return s.purchases>0; if(f==='nobuy') return !s.purchases;
    if(f==='active') return s.idle!=null&&s.idle<=30; if(f==='idle') return s.idle==null||s.idle>60;
    if(f==='mkt') return !!b.marketing; if(f==='blocked') return !!b.blocked;
    return true;
  });
  var by={spent:function(a,c){ return c.s.spent-a.s.spent; },recent:function(a,c){ return String(c.b.created||'').localeCompare(String(a.b.created||'')); },login:function(a,c){ return String(c.s.lastLogin).localeCompare(String(a.s.lastLogin)); },buys:function(a,c){ return c.s.purchases-a.s.purchases||c.s.spent-a.s.spent; }}[ui.uSort||'spent'];
  return rows.sort(by);
}
function usersView(){
  var sel=ui.uSel?(db.buyers||[]).filter(function(b){ return b.id===ui.uSel; })[0]:null;
  if(sel) return userFile(sel);
  var B=db.buyers||[], all=B.map(function(b){ return {b:b,s:uStats(b)}; }), now=today(), mo=now.slice(0,7);
  var newMo=B.filter(function(b){ return String(b.created||'').slice(0,7)===mo; }).length;
  var active=all.filter(function(r){ return r.s.idle!=null&&r.s.idle<=30; }).length, withBuy=all.filter(function(r){ return r.s.purchases>0; }), rep=withBuy.filter(function(r){ return r.s.purchases>1; }).length;
  var uSpent=withBuy.reduce(function(a,r){ return a+r.s.spent; },0), uBuys=withBuy.reduce(function(a,r){ return a+r.s.purchases; },0);
  var okAll=db.orders.filter(function(o){ return o.status==='approved'; }), totAll=okAll.reduce(function(a,o){ return a+o.subtotal+o.shipping; },0);
  var mine={}; withBuy.forEach(function(r){ r.s.ok.forEach(function(o){ mine[o.id]=1; }); });
  var guest=okAll.filter(function(o){ return !mine[o.id]; }), gBuys={}; guest.forEach(function(o){ gBuys[o.payRef||('o'+o.id)]=1; });
  var gTot=guest.reduce(function(a,o){ return a+o.subtotal+o.shipping; },0), gN=Object.keys(gBuys).length;
  var mkt=B.filter(function(b){ return b.marketing; }).length, waiting=all.filter(function(r){ return r.s.drops.length; }).length;
  /* Registros por mes (últimos 6) */
  var months=[]; for(var m=mo,k=0;k<6;k++){ months.unshift(m); m=prevMonth(m); }
  var reg=colChart(months.map(function(m){ var n=B.filter(function(b){ return String(b.created||'').slice(0,7)===m; }).length; return {n:n,tip:monthName(m)+': '+n+(n===1?' registro':' registros'),lab:monthName(m).slice(0,3),cls:m===mo?'today':''}; }),{aria:'Registros por mes',cls:'small'});
  var via=Object.keys(VIA).map(function(k){ return {name:VIA[k],n:B.filter(function(b){ return (b.via||'email')===k; }).length,color:k==='google'?'var(--plate-blue)':(k==='quick'?'var(--plate-yellow)':'var(--ink)')}; });
  var provs={}; B.forEach(function(b){ var p={}; (b.addresses||[]).forEach(function(a){ if(a.prov) p[a.prov]=1; }); Object.keys(p).forEach(function(x){ provs[x]=(provs[x]||0)+1; }); });
  var where=Object.keys(provs).map(function(k){ return {name:esc(k),n:provs[k]}; }).sort(function(a,c){ return c.n-a.n; }).slice(0,6);
  var cats={}; withBuy.forEach(function(r){ r.s.ok.forEach(function(o){ var c=String(o.desc).split(': ')[0]; cats[c]=(cats[c]||0)+o.subtotal; }); });
  var catRows=Object.keys(cats).map(function(k){ return {name:esc(k),n:cats[k]}; }).sort(function(a,c){ return c.n-a.n; }).slice(0,6);
  var rows=uRows(), F=ui.uF||'all';
  var tiles='<div class="tiles eight">'
    +kpi('users','Usuarios registrados',B.length,'<span class="s">'+(newMo?'+'+newMo+' este mes':'Ninguno nuevo este mes')+'</span>','main')
    +kpi('clock','Activos',active,'<span class="s">Entraron en los últimos 30 días</span>')
    +kpi('bag','Con compras',withBuy.length,'<span class="s">'+(B.length?pctTxt(withBuy.length/B.length)+' de los usuarios':'—')+'</span>')
    +kpi('refund','Volvieron a comprar',rep,'<span class="s">'+(withBuy.length?pctTxt(rep/withBuy.length)+' de los que compraron':'—')+'</span>')
    +kpi('money','Vendido a usuarios',money(uSpent),'<span class="s">'+(totAll?pctTxt(uSpent/totAll)+' de todo lo vendido':'—')+'</span>')
    +kpi('target','Ticket promedio',uBuys?money(uSpent/uBuys):'—','<span class="s">'+(gN?'Invitados: '+money(gTot/gN):'Sin compras de invitados')+'</span>')
    +kpi('bell','Aceptan ofertas',mkt,'<span class="s">Base para mandar novedades por email · <button class="linkbtn small" data-act="goto-guests">'+guestRows().length+' compraron sin cuenta</button></span>')
    +kpi('tag','Esperan una baja',waiting,'<span class="s">'+(waiting?'Tienen un favorito que ya bajó de precio':'Sin favoritos con baja')+'</span>')+'</div>';
  return tiles
    +'<div class="grid2">'
    +'<div class="card">'+chead('calendar','Registros por mes','Cuántas cuentas nuevas se crean.')+reg+'</div>'
    +'<div class="card">'+chead('link','Cómo se registran','Si la mayoría se registra al terminar una compra, el mensaje “Guardá tus datos” funciona.')+legendBars(via,B.length)+'</div>'
    +'</div><div class="grid2">'
    +'<div class="card">'+chead('truck','Dónde están','Provincias de sus direcciones de entrega.')+(where.length?legendBars(where):'<div class="empty">Sin direcciones cargadas.</div>')+'</div>'
    +'<div class="card">'+chead('productos','Qué compran','Categorías, según lo comprado por usuarios con cuenta.')+(catRows.length?legendBars(catRows.map(function(r){ return {name:r.name,n:r.n}; })).replace(/<b>(\d[\d.]*)<\/b>/g,function(m0,x){ return '<b>'+money(+String(x).replace(/\./g,''))+'</b>'; }):'<div class="empty">Todavía no hay compras de usuarios.</div>')+'</div>'
    +'</div>'
    +'<div class="card">'+chead('users','Usuarios con cuenta',rows.length+' de '+B.length+'. Tocá un usuario para ver su ficha completa.',exportBar('usuarios'))
    +'<div class="seg" role="group" aria-label="Filtrar usuarios">'+U_F.map(function(x){ return '<button type="button" data-act="u-f" data-f="'+x[0]+'" aria-pressed="'+(F===x[0])+'">'+x[1]+'</button>'; }).join('')+'</div>'
    +'<div class="filters"><div class="field" style="flex:2 1 260px"><label for="u-q">Buscar</label><input id="u-q" type="search" placeholder="Nombre, email, CUIT, teléfono o ciudad" value="'+esc(ui.uQ||'')+'"></div>'
    +'<div class="field"><label for="u-sort">Ordenar por</label><select id="u-sort">'+[['spent','Más gastaron'],['buys','Más compras'],['recent','Registro más reciente'],['login','Último ingreso']].map(function(o){ return '<option value="'+o[0]+'"'+((ui.uSort||'spent')===o[0]?' selected':'')+'>'+o[1]+'</option>'; }).join('')+'</select></div></div>'
    +(rows.length?'<div class="tablewrap flat"><table style="min-width:1060px"><thead><tr><th>Usuario</th><th>Ciudad</th><th>Registrado</th><th>Último ingreso</th><th class="r">Compras</th><th class="r">Gastó</th><th>Última compra</th><th></th></tr></thead><tbody>'
      +rows.map(function(r){ var b=r.b, s=r.s;
        return '<tr><td><div class="ucell"><span class="avatar xs" aria-hidden="true">'+esc((b.name||'?').charAt(0))+'</span><span><b>'+esc(b.name)+'</b><span class="sub">'+esc(b.email)+'</span></span></div>'
          +'<div class="badges">'+(b.blocked?'<span class="st bad">Bloqueado</span>':'')+(String(b.created||'').slice(0,7)===mo?'<span class="st ok">Nuevo</span>':'')+(b.via==='google'?'<span class="st neu">Google</span>':'')+(s.drops.length?'<span class="st warn">Favorito bajó</span>':'')+(b.marketing?'':'<span class="st neu">Sin ofertas</span>')+'</div></td>'
          +'<td>'+esc(s.city||'—')+'</td><td class="nw">'+(b.created?fdate(b.created):'—')+'</td><td class="nw">'+(s.lastLogin?ago(s.lastLogin):'Nunca')+'</td>'
          +'<td class="r num">'+s.purchases+'</td><td class="r num"><b>'+money(s.spent)+'</b></td><td class="nw">'+(s.lastBuy?fdate(s.lastBuy):'—')+'</td>'
          +'<td><button class="btn btn-primary btn-sm" data-act="u-open" data-id="'+b.id+'">Ver ficha</button></td></tr>'; }).join('')+'</tbody></table></div>'
      :'<div class="empty">'+(B.length?'Ningún usuario coincide con el filtro.':'Todavía no hay usuarios registrados.')+'</div>')+'</div>'+guestsCard();
}
function userFile(b){
  var s=uStats(b), now=today(), vs={}, prods={};
  s.ok.forEach(function(o){ var v=vendor(o.vendorId), n=v?v.name:'Proveedor dado de baja'; vs[n]=(vs[n]||0)+o.subtotal; var p=o.desc.split(': ').slice(1).join(': ')||o.desc; prods[p]=(prods[p]||0)+o.qty; });
  var vRows=Object.keys(vs).map(function(k){ return {name:esc(k),n:vs[k]}; }).sort(function(a,c){ return c.n-a.n; });
  var pRows=Object.keys(prods).map(function(k){ return {name:esc(k),n:prods[k]}; }).sort(function(a,c){ return c.n-a.n; }).slice(0,6);
  /* Lo que conviene saber para escribirle */
  var tips=[];
  if(s.every&&s.since!=null&&s.since>s.every*1.3) tips.push(['warn','Suele comprar cada '+s.every+' días y hace '+s.since+' que no compra. Buen momento para escribirle.']);
  if(s.drops.length) tips.push(['ok','Tiene '+(s.drops.length===1?'un favorito que bajó':s.drops.length+' favoritos que bajaron')+' de precio: '+s.drops.map(function(f){ var x=uBest(f); return f.model+' '+f.size+' ('+money(f.price)+' → '+money(x.price)+')'; }).join(', ')+'.']);
  if(!s.purchases) tips.push(['neu','Se registró pero todavía no compró.'+((b.favs||[]).length?' Ya guardó favoritos.':'')]);
  if(s.purchases>1) tips.push(['ok','Es cliente recurrente: '+s.purchases+' compras.']);
  if(b.iva==='Responsable inscripto'&&!b.cuit) tips.push(['warn','Es responsable inscripto pero no cargó el CUIT.']);
  if(s.idle!=null&&s.idle>60) tips.push(['neu','Hace '+s.idle+' días que no entra al sitio.']);
  if(!b.marketing) tips.push(['neu','No aceptó recibir ofertas por email: escribile solo por temas de sus pedidos.']);
  var waNum=String(b.phone||'').replace(/\D/g,''), wa=waNum.length>=10?(waNum.indexOf('54')===0?waNum:'549'+waNum.replace(/^0/,'')):'';
  return '<div><button class="linkbtn" data-act="u-back">← Todos los usuarios</button></div>'
    +'<div class="card vfile-h"><div class="vc-h"><span class="avatar xl" aria-hidden="true">'+esc((b.name||'?').charAt(0))+'</span><div class="vc-t"><h2 class="display h-page" style="font-size:2.2rem!important">'+esc(b.name)+'</h2>'
    +'<span class="muted">'+esc(b.email)+(b.phone?' · '+esc(b.phone):'')+(s.city?' · '+esc(s.city):'')+'</span><span class="small muted">Registrado el '+(b.created?fdate(b.created):'—')+' · '+(VIA[b.via||'email']||'Email')+' · '+(b.marketing?'Acepta ofertas':'No acepta ofertas')+'</span></div>'
    +(b.blocked?'<span class="st bad">Bloqueado</span>':'<span class="st ok">Activo</span>')+'</div>'
    +'<div class="actions"><a class="btn btn-primary btn-sm" href="mailto:'+esc(b.email)+'">Escribir un email</a>'+(wa?'<a class="btn btn-outline btn-sm" href="https://wa.me/'+wa+'" target="_blank" rel="noopener">'+CHAT+'WhatsApp</a>':'')
    +'<button class="btn btn-outline btn-sm" data-act="u-pw" data-id="'+b.id+'">'+(ui.confirm==='upw'+b.id?'Confirmar: crear clave temporal':'Restablecer clave')+'</button>'
    +'<button class="btn btn-outline btn-sm" data-act="u-block" data-id="'+b.id+'">'+(ui.confirm==='ublk'+b.id?(b.blocked?'Confirmar: desbloquear':'Confirmar: bloquear'):(b.blocked?'Desbloquear':'Bloquear'))+'</button>'
    +'<button class="btn '+(ui.confirm==='udl'+b.id?'btn-danger':'btn-outline')+' btn-sm" data-act="u-delacc" data-id="'+b.id+'">'+(ui.confirm==='udl'+b.id?'Confirmar: borrar la cuenta':'Borrar cuenta')+'</button></div>'
    +(ui.tempPw&&ui.tempPw.id===b.id?'<div class="alert ok" role="status">Clave temporal: <b class="mono">'+esc(ui.tempPw.pw)+'</b>. Pasásela por email o WhatsApp; la puede cambiar desde Mi cuenta. No se vuelve a mostrar.</div>':'')+'</div>'
    +'<div class="tiles eight">'
    +kpi('money','Total gastado',money(s.spent),'<span class="s">'+s.ok.length+(s.ok.length===1?' pedido':' pedidos')+(s.refunds?' · '+s.refunds+(s.refunds===1?' devolución':' devoluciones'):'')+'</span>','main')
    +kpi('bag','Compras',s.purchases,'<span class="s">'+(s.purchases>1?'Cliente recurrente':(s.purchases?'Una sola compra':'Todavía no compró'))+'</span>')
    +kpi('target','Ticket promedio',s.purchases?money(s.ticket):'—','<span class="s">Por compra</span>')
    +kpi('calendar','Compra cada',s.every?s.every+' días':'—','<span class="s">'+(s.every?'Promedio entre compras':'Hacen falta 2 compras')+'</span>')
    +kpi('clock','Última compra',s.lastBuy?fdate(s.lastBuy):'—','<span class="s'+(s.every&&s.since>s.every*1.3?' down':'')+'">'+(s.since!=null?'Hace '+s.since+' días':'Sin compras')+'</span>')
    +kpi('bag','Primera compra',s.first?fdate(s.first):'—','<span class="s">'+(s.first?'Cliente desde hace '+calDays(s.first,now)+' días':'—')+'</span>')
    +kpi('users','Ingresos al sitio',(b.logins||[]).length,'<span class="s">'+(s.lastLogin?'Último '+ago(s.lastLogin):'Nunca ingresó')+'</span>')
    +kpi('tag','Favoritos',(b.favs||[]).length,'<span class="s">'+(s.drops.length?s.drops.length+' bajaron de precio':'Ninguno bajó')+'</span>')+'</div>'
    +(tips.length?'<div class="card">'+chead('bell','Lo que conviene saber','Para saber cuándo y cómo escribirle.')+'<ul class="perf">'+tips.map(function(t){ return '<li><span>'+esc(t[1])+'</span><span class="st '+t[0]+'">'+(t[0]==='warn'?'Atención':(t[0]==='ok'?'Oportunidad':'Dato'))+'</span></li>'; }).join('')+'</ul></div>':'')
    +'<div class="grid2">'
    +'<div class="card">'+chead('pages','Datos y facturación','')+'<dl class="dl"><div><dt>Razón social</dt><dd>'+esc(b.name)+'</dd></div><div><dt>Contacto</dt><dd>'+esc(b.contact||'—')+'</dd></div><div><dt>CUIT</dt><dd>'+esc(b.cuit||'—')+'</dd></div><div><dt>Condición de IVA</dt><dd>'+esc(b.iva||'—')+'</dd></div><div><dt>Email</dt><dd>'+esc(b.email)+'</dd></div><div><dt>Teléfono</dt><dd>'+esc(b.phone||'—')+'</dd></div></dl>'
    +'<p class="eyebrow">Direcciones</p>'+((b.addresses||[]).length?'<div class="addrs">'+b.addresses.map(function(a){ return '<div class="addr"><b>'+esc(a.label||'Dirección')+(a.def?' <span class="st ok">Predeterminada</span>':'')+'</b><span>'+esc(a.address)+'</span><span class="muted small">'+esc([a.city,a.prov,a.cp?'CP '+a.cp:''].filter(Boolean).join(', '))+'</span></div>'; }).join('')+'</div>':'<p class="muted">Sin direcciones guardadas.</p>')+'</div>'
    +'<div class="vcol">'
    +'<div class="card">'+chead('productos','Qué compra','Unidades por producto.')+(pRows.length?legendBars(pRows):'<div class="empty">Todavía no compró.</div>')+'</div>'
    +'<div class="card">'+chead('vendedores','A quién le compra','Monto de productos por proveedor.')+(vRows.length?legendBars(vRows).replace(/<b>(\d[\d.]*)<\/b>/g,function(m0,x){ return '<b>'+money(+String(x).replace(/\./g,''))+'</b>'; }):'<div class="empty">Todavía no compró.</div>')+'</div>'
    +'</div></div>'
    +'<div class="card">'+chead('tag','Favoritos y avisos de precio','')+((b.favs||[]).length?'<div class="tablewrap flat"><table style="min-width:720px"><thead><tr><th>Producto</th><th class="r">Cuando lo guardó</th><th class="r">Mejor precio hoy</th><th>Aviso</th></tr></thead><tbody>'
      +b.favs.map(function(f){ var x=uBest(f); return '<tr><td><b>'+esc(f.model)+' · '+esc(f.size)+'</b><span class="sub">'+esc(f.cat)+(f.t?' · guardado el '+fdate(f.t):'')+'</span></td><td class="r num">'+money(f.price)+'</td><td class="r num">'+(x?money(x.price)+(x.price<f.price?' <span class="st ok">−'+Math.round((1-x.price/f.price)*100)+'%</span>':''):'<span class="muted">Sin ofertas</span>')+'</td><td>'+(f.alert?'<span class="st ok">Activo</span>':'<span class="st neu">Apagado</span>')+'</td></tr>'; }).join('')+'</tbody></table></div>':'<div class="empty">No guardó favoritos.</div>')+'</div>'
    +'<div class="section-head" style="margin:8px 0 0"><div class="ch"><span class="ic">'+ico('ventas')+'</span><h2 class="display h-card">Sus pedidos</h2></div></div>'+salesTable(s.orders)
    +'<div class="card">'+chead('clock','Ingresos al sitio',(b.logins||[]).length?(b.logins||[]).length+' en total.':'Todavía no ingresó con su cuenta.')
    +((b.logins||[]).length?'<ol class="log">'+b.logins.slice(0,8).map(function(t){ return '<li class="two"><span class="log-t num">'+when(t)+'</span><span>'+ago(t)+'</span></li>'; }).join('')+'</ol>':'')+'</div>';
}

/* Compradores invitados: compraron sin cuenta. Se agrupan por email con los datos que dejaron al comprar. */
function guestRows(){
  var acc={}; (db.buyers||[]).forEach(function(b){ acc[norm(b.email)]=1; });
  var by={}, list=[];
  db.orders.slice().sort(function(a,c){ return String(c.date).localeCompare(String(a.date)); }).forEach(function(o){
    var s=o.ship||{}, k=norm(s.email||o.buyer); if(!k||acc[k]) return;
    if(!by[k]){ by[k]={key:k,name:o.buyer,email:s.email||'',phone:s.phone||'',city:s.city||'',prov:s.prov||'',address:s.address||'',cuit:(o.billing||{}).cuit||'',iva:(o.billing||{}).iva||'',orders:[],spent:0,last:o.date,first:o.date,buys:{}}; list.push(by[k]); }
    var g=by[k]; g.orders.push(o); if(o.date<g.first) g.first=o.date;
    if(o.status==='approved'){ g.spent+=o.subtotal+o.shipping; g.buys[o.payRef||('o'+o.id)]=1; }
    if(!g.cuit&&o.billing&&o.billing.cuit) g.cuit=o.billing.cuit;
  });
  list.forEach(function(g){ g.n=Object.keys(g.buys).length; g.inv=(db.guestInv||{})[g.key]||''; });
  var q=plain(ui.gQ||'');
  return list.filter(function(g){ return !q||plain([g.name,g.email,g.phone,g.city,g.cuit].join(' ')).indexOf(q)>=0; }).sort(function(a,c){ return c.spent-a.spent; });
}
function guestsCard(){
  var G=guestRows(), tot=G.reduce(function(a,g){ return a+g.spent; },0), rep=G.filter(function(g){ return g.n>1; }).length;
  return '<div class="card" id="guests">'+chead('users','Compraron sin cuenta','Los datos que dejaron al comprar: nombre, email, teléfono, dirección y facturación. Invitalos a crear su cuenta para que vuelvan más fácil.',G.length?exportBar('invitados'):'')
    +'<p class="sumline"><b>'+G.length+(G.length===1?' comprador invitado':' compradores invitados')+'</b>'+(G.length?' · compraron '+money(tot)+' · '+rep+' volvieron a comprar sin cuenta':'')+'</p>'
    +(G.length?'<div class="field" style="max-width:420px"><label for="g-q">Buscar</label><input id="g-q" type="search" placeholder="Nombre, email, teléfono, ciudad o CUIT" value="'+esc(ui.gQ||'')+'"></div>'
      +'<div class="tablewrap flat"><table style="min-width:1000px"><thead><tr><th>Comprador</th><th>Contacto</th><th>Entrega</th><th>Facturación</th><th class="r">Compras</th><th class="r">Gastó</th><th>Última</th><th></th></tr></thead><tbody>'
      +G.map(function(g){ return '<tr><td><b>'+esc(g.name)+'</b>'+(g.n>1?' <span class="st ok">Volvió a comprar</span>':'')+'</td>'
        +'<td>'+esc(g.email||'—')+'<span class="sub">'+esc(g.phone||'Sin teléfono')+'</span></td>'
        +'<td>'+esc(g.city||'—')+'<span class="sub">'+esc([g.address,g.prov].filter(Boolean).join(', '))+'</span></td>'
        +'<td>'+esc(g.iva||'Sin datos')+'<span class="sub">'+(g.cuit?'CUIT '+esc(g.cuit):'Sin CUIT')+'</span></td>'
        +'<td class="r num">'+g.n+'</td><td class="r num"><b>'+money(g.spent)+'</b></td><td class="nw">'+fdate(g.last)+'</td>'
        +'<td><div class="actions nw" style="justify-content:flex-end">'+(g.email?'<a class="btn btn-outline btn-sm" href="mailto:'+esc(g.email)+'">Email</a>':'')
        +(g.inv?'<span class="st ok">Invitado el '+fdate(g.inv)+'</span>':(g.email?'<button class="btn btn-primary btn-sm" data-act="g-invite" data-k="'+esc(g.key)+'">Invitar a crear cuenta</button>':''))+'</div></td></tr>'; }).join('')+'</tbody></table></div>'
      :'<div class="empty">Todos los que compraron tienen cuenta.</div>')+'</div>';
}

/* ---------- Sitio del administrador ---------- */
var AKEY='cf-demo-admin';
var ui={gQ:'',uSel:null,uQ:'',uF:'all',uSort:'spent',tempPw:null,vSel:null,bell:false,seenN:null,tab:'resumen',salesSub:'todas',comMonth:'',buyerQ:'',catSel:'',mEdit:null,spEdit:null,uForm:null,cfgSub:'general',logAll:false,loginErr:'',confirm:null,salesVendor:'',stockVendor:'',prodSub:'ranking',rankBy:'units',statRange:'30',sumMonth:'',salesMonth:'',salesStatus:'',adEdit:null,vForm:null,oForm:null};

function rerender(focusId){
  render();
  if(focusId){ var el=document.getElementById(focusId); if(el){ try{ el.focus(); }catch(e){} } }
}
var TABS=[
  {id:'resumen',label:'Resumen',sub:'Cómo viene el negocio: lo vendido, tu comisión y las visitas.'},
  {id:'ventas',label:'Ventas',sub:'Lo que hay que resolver y todas las ventas del sitio.'},
  {id:'vendedores',label:'Proveedores',sub:'Las marcas que venden en el sitio.'},
  {id:'usuarios',label:'Usuarios',sub:'Las cuentas de los compradores: quiénes son, qué compran y cuándo vuelven.'},
  {id:'productos',label:'Productos',sub:'Los más vendidos, los que esperan aprobación y el stock de cada proveedor.'},
  {id:'catalogo',label:'Catálogo',sub:'Las categorías, modelos y variantes que se comparan, con sus fotos.'},
  {id:'stats',label:'Métricas web',sub:'Quién entra al sitio, cuándo, desde dónde y qué busca.'},
  {id:'publicidad',label:'Cartel LED',sub:'Los mensajes que pasan arriba del sitio de compradores.'},
  {id:'contenido',label:'Contenido',sub:'Los textos y los espacios de la portada.'},
  {id:'config',label:'Configuración',sub:'Comisión, WhatsApp, usuarios e historial de cambios.'}];
function todayLong(){ try{ var t=new Date().toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}); return t.charAt(0).toUpperCase()+t.slice(1); }catch(e){ return fdate(today()); } }
function sidebar(counts){
  return '<aside class="side"><span class="brand side-brand">'+LOGO+'<span>Comparador <em>Admin</em></span></span>'
    +'<nav class="snav" aria-label="Secciones">'+TABS.map(function(t){
      var c=counts[t.id];
      return '<button type="button" data-act="tab" data-tab="'+t.id+'"'+(ui.tab===t.id?' aria-current="page"':'')+'>'+ico(t.id)+'<span>'+t.label+'</span>'+(c?'<span class="count" aria-label="'+c+' pendientes">'+c+'</span>':'')+'</button>';
    }).join('')+'</nav>'
    +'<div class="side-foot"><div class="side-who"><span class="avatar" aria-hidden="true">'+esc((me()||{name:'?'}).name.charAt(0))+'</span><span><b>'+esc((me()||{name:''}).name)+'</b><span class="small">Usuario '+esc((me()||{user:''}).user)+'</span></span></div>'
    +'<button class="btn btn-outline btn-sm" data-act="logout">'+ico('logout',18)+'Salir</button>'+demoLinks('admin')+'</div></aside>';
}
function vLogin(){
  return '<div class="login"><form id="alogin" class="login-card" novalidate><span class="brand">'+LOGO+'<span>Comparador <em>Admin</em></span></span>'
    +'<h1 class="display">Panel del dueño</h1><p class="muted">Ventas, comisiones, proveedores, productos y métricas del sitio, en un solo lugar.</p>'
    +(ui.loginErr?'<div class="alert bad" role="alert">'+esc(ui.loginErr)+'</div>':'')
    +'<div class="field"><label for="a-user">Usuario</label><input id="a-user" type="text" autocomplete="username" autocapitalize="none"></div>'
    +'<div class="field"><label for="a-pass">Clave</label><input id="a-pass" type="password" autocomplete="current-password"></div>'
    +'<button class="btn btn-accent btn-lg" type="submit">Entrar</button>'
    +'<p class="note">Demo: usuario <b>nicolas</b> o <b>lucas</b>, clave <b>'+DEMO_PW+'</b>. Después cada uno la cambia desde Configuración.</p>'+demoLinks('admin')+'</form></div>';
}
function salesTable(rows){
  if(!rows.length) return '<div class="empty">No hay ventas para mostrar.</div>';
  return '<div class="tablewrap"><table style="min-width:1000px"><thead><tr><th>Venta</th><th>Comprador</th><th>Proveedor</th><th>Detalle</th><th class="r">Total</th><th class="r">Tu comisión</th><th class="r">Al proveedor</th><th>Estado</th><th></th></tr></thead><tbody>'
    +rows.map(function(o){
      var v=vendor(o.vendorId), ref=o.status==='refunded', c=ui.confirm==='r'+o.id;
      return '<tr><td><b>#'+o.id+'</b><span class="sub">'+fdate(o.date)+'</span></td><td>'+esc(o.buyer)+'</td><td>'+esc(v?v.name:'')+'</td><td>'+esc(o.desc)+' × '+o.qty+'</td>'
        +'<td class="r num">'+money(o.subtotal+o.shipping)+'</td><td class="r num"><b>'+(ref?'—':money(o.commission))+'</b><span class="sub">'+(ref?'':o.pct+'%')+'</span></td><td class="r num">'+(ref?'—':money(net(o)))+'</td><td>'+orderStatus(o)+'</td>'
        +'<td><div class="actions nw">'+(!ref&&!o.shipped?'<button class="btn btn-primary btn-sm" data-act="ship" data-id="'+o.id+'">Marcar enviado</button>':'')+'</div></td></tr>';
    }).join('')+'</tbody></table></div>';
}
/* Reparto de la comisión del sitio entre los socios. La proporción no se muestra en pantalla. */
var PARTNERS=[['Nicolás',70],['Lucas',30]];
function partners(ok){
  var total=ok.reduce(function(a,o){ return a+o.commission; },0); if(!total) return '';
  var left=total, rows=PARTNERS.map(function(p,i){ var amt=i===PARTNERS.length-1?left:Math.round(total*p[1]/100); left-=amt; return {name:p[0],amt:amt}; });
  var max=Math.max.apply(null,rows.map(function(r){ return r.amt; }))||1;
  return '<div class="card">'+chead('split','Tu comisión','Lo que le toca a cada uno de las ventas aprobadas, desde el inicio.')+'<div class="hbars">'
    +rows.map(function(r){ return '<div class="hbar"><span><b>'+esc(r.name)+'</b></span>'+bar(r.amt/max*100,r.name+': '+money(r.amt))+'<b class="num">'+money(r.amt)+'</b></div>'; }).join('')
    +'</div></div>';
}
function waCard(){
  var n=(db.contact||{}).wa||'';
  return '<form id="waform" class="card" novalidate style="max-width:520px"><h2 class="display h-card">WhatsApp de contacto</h2>'
    +'<p class="note">Es el número al que escriben los proveedores desde el botón “Contactate por WhatsApp” del sitio.</p>'
    +'<div id="wa-err" class="alert bad" role="alert" hidden></div>'
    +'<div class="field"><label for="wa-num">Número con código de país</label><input id="wa-num" type="tel" inputmode="numeric" placeholder="Ej.: 5491122334455" value="'+esc(n)+'"><span class="hint">Solo números, sin espacios ni signos. Dejalo vacío si todavía no lo tenés.</span></div>'
    +'<div><button class="btn btn-primary" type="submit">Guardar</button></div></form>';
}
/* Formularios del administrador */
function fld(id,label,input,hint){ return '<div class="field"><label for="'+id+'">'+label+'</label>'+input+(hint?'<span class="hint">'+hint+'</span>':'')+'</div>'; }
function inp(id,v,attrs){ return '<input id="'+id+'" '+(attrs||'type="text"')+' value="'+esc(v==null?'':v)+'">'; }
function sel(id,opts,cur){ return '<select id="'+id+'">'+opts.map(function(o){ var v=o.v!=null?o.v:o, l=o.l||o; return '<option value="'+esc(v)+'"'+(String(v)===String(cur)?' selected':'')+'>'+esc(l)+'</option>'; }).join('')+'</select>'; }
function optModels(cat,cur){ var c=catBy(cat)||CATALOG[0]; return c.m.map(function(m){ return '<option'+(m[0]===cur?' selected':'')+'>'+esc(m[0])+'</option>'; }).join(''); }
function optSizes(cat,model,cur){ var c=catBy(cat)||CATALOG[0], m=modelBy(c.n,model)||c.m[0]; return m[1].map(function(x){ return '<option'+(x===cur?' selected':'')+'>'+esc(x)+'</option>'; }).join(''); }
function showErr(id,msg,focusId){ var b=document.getElementById(id); if(b){ b.textContent=msg; b.hidden=false; } var f=focusId&&document.getElementById(focusId); if(f) f.focus(); }

/* Proveedores: alta y edición */
function vendorForm(){
  var v=ui.vForm==='new'?null:vendor(ui.vForm); if(ui.vForm!=='new'&&!v) return '';
  var d=v||{name:'',type:'Fabricante',status:'active',zones:[]};
  var sales=v?db.orders.filter(function(o){ return o.vendorId===v.id; }).length:0, nOff=v?db.offers.filter(function(o){ return o.vendorId===v.id; }).length:0;
  return '<form id="vform" class="card" novalidate><h2 class="display h-card">'+(v?'Editar '+esc(v.name):'Agregar proveedor')+'</h2>'
    +'<p class="note">'+(v?'Normalmente estos datos los carga el proveedor desde su panel, en “Mis datos”. Acá podés corregirlos.':'Cargá lo básico; el resto lo completa el proveedor desde su panel.')+'</p>'
    +'<div id="v-err" class="alert bad" role="alert" hidden></div>'
    +VFIELDS.map(function(g){ return '<fieldset><legend>'+g[0]+'</legend><div class="formgrid">'+g[1].map(function(f){
      var id='v-'+f[0], cur=d[f[0]]||'';
      if(f[2]==='sel') return fld(id,f[1],sel(id,f[3].map(function(o){ return {v:o,l:o||'Sin elegir'}; }),cur||f[3][0]));
      if(f[2]==='area') return '<div class="field" style="grid-column:1 / -1"><label for="'+id+'">'+f[1]+'</label><textarea id="'+id+'" rows="2" maxlength="400">'+esc(cur)+'</textarea></div>';
      return fld(id,f[1],inp(id,cur,'type="'+(f[2]||'text')+'" maxlength="'+(f[0]==='name'?40:120)+'"'));
    }).join('')+'</div></fieldset>'; }).join('')
    +'<fieldset><legend>Envíos</legend><div class="checks">'+ZONES.map(function(z){ return '<label class="check sm"><input type="checkbox" data-vzone="'+z[0]+'"'+((d.zones||[]).indexOf(z[0])>=0?' checked':'')+'> '+z[1]+'</label>'; }).join('')+'</div></fieldset>'
    +'<fieldset><legend>Acceso a su panel</legend><div class="formgrid">'
    +(v?'':fld('v-status','Estado',sel('v-status',[{v:'active',l:'Activo'},{v:'pending',l:'Por aprobar'}],'active')))
    +fld('v-user','Usuario',inp('v-user',v?v.user:'','type="text" maxlength="40" autocapitalize="none" autocomplete="off"'),'Puede ser su email.')
    +fld('v-pass',v&&v.hash?'Clave nueva':'Clave',inp('v-pass','','type="password" autocomplete="new-password"'),v&&v.hash?'Dejala vacía para no cambiarla. Si se olvidó la suya, poné una nueva y pasásela.':'Al menos 6 caracteres. Se la pasás al proveedor.')
    +'</div></fieldset>'
    +'<p class="note">'+(v?(v.mp?'Mercado Pago conectado.':'Mercado Pago sin conectar: lo conecta el proveedor desde su panel. Hasta entonces sus productos no aparecen en el sitio.'):'El proveedor conecta su Mercado Pago desde su panel. Hasta entonces sus productos no aparecen en el sitio.')+'</p>'
    +'<div class="actions"><button class="btn btn-primary" type="submit">'+(v?'Guardar cambios':'Agregar proveedor')+'</button><button class="btn btn-outline" type="button" data-act="v-cancel">Cancelar</button>'
    +(v&&!sales?'<button class="btn btn-danger" type="button" data-act="v-del" data-id="'+v.id+'">'+(ui.confirm==='vdel'+v.id?'Confirmar: eliminar '+esc(v.name)+(nOff?' y sus '+nOff+' productos':''):'Eliminar proveedor')+'</button>':'')+'</div>'
    +(v&&sales?'<p class="note">Tiene '+sales+(sales===1?' venta registrada':' ventas registradas')+': no se puede eliminar, pero sí suspender.</p>':'')
    +'</form>';
}
/* Productos: alta y edición en nombre de un proveedor */
function offerForm(){
  var e=ui.oForm==='new'?null:offer(ui.oForm); if(ui.oForm!=='new'&&!e) return '';
  var v=vendor(e?e.vendorId:ui.stockVendor); if(!v) return '';
  var d=e||{category:CATALOG[0].n,model:CATALOG[0].m[0][0],size:CATALOG[0].m[0][1][0],unit:'Unidad',brand:'',detail:'',price:0,stock:'stock',minQty:1,lead:5,warranty:12,shipAmba:0,shipInt:0,status:'published'};
  var fmt=function(n){ return n?Math.round(n).toLocaleString('es-AR'):''; };
  return '<form id="oform" class="card" novalidate><h2 class="display h-card">'+(e?'Editar producto de ':'Agregar producto a ')+esc(v.name)+'</h2>'
    +'<div id="o-err" class="alert bad" role="alert" hidden></div>'
    +'<div class="formgrid">'
    +fld('o-cat','Categoría',sel('o-cat',CATALOG.map(function(c){ return c.n; }),d.category))
    +fld('o-model','Modelo','<select id="o-model">'+optModels(d.category,d.model)+'</select>')
    +fld('o-size','Variante','<select id="o-size">'+optSizes(d.category,d.model,d.size)+'</select>')
    +fld('o-unit','Se vende por',sel('o-unit',['Unidad','Par','Kit'],d.unit))
    +fld('o-price','Precio con IVA ($)',inp('o-price',fmt(d.price),'type="text" inputmode="numeric"'))
    +fld('o-stock','Stock',sel('o-stock',[{v:'stock',l:'En stock'},{v:'order',l:'A pedido'},{v:'none',l:'Sin stock'}],d.stock))
    +fld('o-units','Unidades disponibles',inp('o-units',d.units==null?'':d.units,'type="number" min="0" placeholder="Sin contar"'),'Vacío = no se lleva la cuenta.')
    +fld('o-low','Aviso de bajo stock',inp('o-low',d.lowAt==null?'':d.lowAt,'type="number" min="0" placeholder="'+(v.lowAt!=null?v.lowAt:10)+'"'),'Vacío = el aviso general del proveedor.')
    +'<div class="field"><span class="lab">Compra</span><p>Sin mínimo · desde una presentación</p></div>'
    +fld('o-lead','Entrega (días hábiles)',inp('o-lead',d.lead,'type="number" min="0"'))
    +fld('o-warr','Garantía (meses)',inp('o-warr',d.warranty,'type="number" min="0"'))
    +fld('o-amba','Envío AMBA ($)',inp('o-amba',fmt(d.shipAmba)||'0','type="text" inputmode="numeric"'),'0 = sin cargo')
    +fld('o-int','Envío resto del país ($)',inp('o-int',fmt(d.shipInt)||'0','type="text" inputmode="numeric"'),'0 = sin cargo')
    +fld('o-status','Estado',sel('o-status',[{v:'published',l:'Publicado'},{v:'review',l:'En revisión'},{v:'paused',l:'Pausado'}],d.status==='rejected'?'review':d.status))
    +fld('o-brand','Marca (si es otra)',inp('o-brand',d.brand,'type="text" maxlength="40"'))
    +fld('o-detail','Detalle',inp('o-detail',d.detail,'type="text" maxlength="80"'))
    +'</div>'
    +volumeFields(d)+'<div class="actions"><button class="btn btn-primary" type="submit">'+(e?'Guardar cambios':'Agregar producto')+'</button><button class="btn btn-outline" type="button" data-act="o-cancel">Cancelar</button></div>'
    +'</form>';
}
/* Textos de la portada */
var CONTENT_FIELDS=[
  ['Portada',[['heroA','Título (parte blanca)'],['heroB','Título (parte verde)'],['lead','Bajada',1]]],
  ['Misión',[['misionT','Título'],['misionP','Texto',1]]],
  ['Visión',[['visionT','Título'],['visionP','Texto',1]]],
  ['Valores',[['v1T','Valor 1'],['v1P','Texto del valor 1'],['v2T','Valor 2'],['v2P','Texto del valor 2'],['v3T','Valor 3'],['v3P','Texto del valor 3']]],
  ['Franja para proveedores',[['bandT','Título'],['bandP','Texto',1]]]
];
function contentForm(){
  return '<form id="cform" class="card" novalidate style="max-width:880px"><div><h2 class="display h-card">Textos de la portada</h2><p class="note">Lo que escribas acá aparece en la página de inicio. Si dejás un campo vacío, vuelve el texto original.</p></div>'
    +CONTENT_FIELDS.map(function(g){
      return '<fieldset><legend>'+g[0]+'</legend><div class="formgrid">'+g[1].map(function(f){
        var v=(db.content||{})[f[0]], val=v!=null&&String(v).trim()!==''?v:CONTENT_DEFAULT[f[0]];
        return f[2]?'<div class="field" style="grid-column:1 / -1"><label for="ct-'+f[0]+'">'+f[1]+'</label><textarea id="ct-'+f[0]+'" rows="3">'+esc(val)+'</textarea></div>':fld('ct-'+f[0],f[1],inp('ct-'+f[0],val,'type="text" maxlength="90"'));
      }).join('')+'</div></fieldset>';
    }).join('')
    +'<div class="actions"><button class="btn btn-primary" type="submit">Guardar textos</button><button class="btn btn-outline" type="button" data-act="c-reset">'+(ui.confirm==='c-reset'?'Confirmar: volver a los originales':'Volver a los textos originales')+'</button><a class="btn btn-outline" href="index.html">Ver la portada</a></div></form>';
}
function stockByVendor(){
  var vs=db.vendors.filter(function(v){ return v.status==='active'||v.status==='suspended'; }); if(!vs.length) return '';
  if(!vs.some(function(v){ return v.id===ui.stockVendor; })) ui.stockVendor=vs[0].id;
  var of=function(id){ return db.offers.filter(function(o){ return o.vendorId===id; }); }, list=of(ui.stockVendor);
  return '<div class="section-head" style="margin:16px 0 0"><h2 class="display h-card">Stock por proveedor</h2><button class="btn btn-accent" data-act="o-new">Agregar producto a '+esc(vendor(ui.stockVendor).name)+'</button></div>'+(ui.oForm?offerForm():'')
    +'<div class="seg" role="group" aria-label="Proveedor">'+vs.map(function(v){ return '<button type="button" data-act="stock-v" data-id="'+v.id+'" aria-pressed="'+(v.id===ui.stockVendor)+'">'+esc(v.name)+' · '+of(v.id).length+'</button>'; }).join('')+'</div>'
    +(list.length?'<div class="tablewrap"><table style="min-width:1100px"><thead><tr><th>Modelo</th><th>Variante</th><th>Marca</th><th class="r">Precio</th><th>Precio actualizado</th><th>Stock</th><th>Estado</th><th></th></tr></thead><tbody>'
      +list.map(function(o){ var age=calDays(o.updated||today(),today()); return '<tr><td><b>'+esc(o.model)+'</b><span class="sub">'+esc(o.category)+' · '+perUnit(o.unit)+'</span></td><td>'+esc(o.size)+'</td><td>'+esc(o.brand||'—')+'</td><td class="r num">'+money(o.price)+priceBadge(o)+'</td><td class="nw">'+(o.updated?fdate(o.updated):'—')+(age>30?' <span class="st warn">Hace '+age+' días</span>':'')+'</td><td class="nw">'+stockBadge(o)+'</td><td>'+offerStatus(o)+'</td>'
        +'<td><div class="actions nw" style="justify-content:flex-end"><button class="btn btn-primary btn-sm" data-act="o-edit" data-id="'+o.id+'">Editar</button>'
        +(o.status==='published'?'<button class="btn btn-outline btn-sm" data-act="o-pause" data-id="'+o.id+'">Pausar</button>':(o.status==='paused'?'<button class="btn btn-outline btn-sm" data-act="o-pause" data-id="'+o.id+'">Publicar</button>':''))
        +'<button class="btn '+(ui.confirm==='odel'+o.id?'btn-danger':'btn-outline')+' btn-sm" data-act="o-del" data-id="'+o.id+'">'+(ui.confirm==='odel'+o.id?'Confirmar':'Eliminar')+'</button></div></td></tr>'; }).join('')
      +'</tbody></table></div>':'<div class="empty">Este proveedor todavía no cargó productos.</div>');
}
function bar(pct,tip){ return '<span class="track" title="'+esc(tip)+'"><i style="width:'+Math.max(1,Math.round(pct))+'%"></i></span>'; }
function monthly(ok){
  var by={};
  ok.forEach(function(o){ var m=String(o.date).slice(0,7), r=by[m]=by[m]||{n:0,total:0,com:0}; r.n++; r.total+=o.subtotal+o.shipping; r.com+=o.commission; });
  var ms=Object.keys(by).sort().reverse(); if(!ms.length) return '';
  var max=Math.max.apply(null,ms.map(function(m){ return by[m].total; }))||1, T={n:0,total:0,com:0};
  ms.forEach(function(m){ T.n+=by[m].n; T.total+=by[m].total; T.com+=by[m].com; });
  var asc=ms.slice().reverse(), mmax=niceMax(max);
  var chart='<div class="mchart" role="img" aria-label="Vendido por mes">'+asc.map(function(m){ var r=by[m]; return '<div class="mc-col" title="'+esc(monthName(m)+': '+money(r.total)+' vendidos, '+money(r.com)+' de comisión')+'"><span class="mc-v num">'+money(r.total)+'</span><span class="mc-bar"><i style="height:'+Math.max(2,r.total/mmax*100)+'%"><em style="height:'+Math.max(1,r.com/r.total*100)+'%"></em></i></span><b>'+monthName(m).split(' ')[0]+'</b><span class="muted small num">Comisión '+money(r.com)+'</span></div>'; }).join('')+'</div>';
  return '<div class="card">'+chead('stats','Mes a mes','Cuánto se vendió en el sitio y cuánto te quedó de comisión. Solo cuenta ventas aprobadas.','<span class="legend small"><i class="sq"></i>Vendido <i class="sq acc"></i>Tu comisión</span>')+chart
    +'<div class="tablewrap flat"><table class="monthly" style="min-width:760px"><thead><tr><th>Mes</th><th class="r">Ventas</th><th>Vendido en total</th><th class="r">Tu comisión</th><th class="r">A proveedores</th></tr></thead><tbody>'
    +ms.map(function(m){ var r=by[m]; return '<tr><td><b>'+monthName(m)+'</b></td><td class="r num">'+r.n+'</td><td><div class="cellbar"><b class="num">'+money(r.total)+'</b>'+bar(r.total/max*100,monthName(m)+': '+money(r.total)+' vendidos')+'</div></td><td class="r num"><b>'+money(r.com)+'</b></td><td class="r num">'+money(r.total-r.com)+'</td></tr>'; }).join('')
    +'</tbody><tfoot><tr><td><b>Total</b></td><td class="r num">'+T.n+'</td><td><b class="num">'+money(T.total)+'</b></td><td class="r num"><b>'+money(T.com)+'</b></td><td class="r num">'+money(T.total-T.com)+'</td></tr></tfoot></table></div></div>';
}
function ranking(ok){
  var by={};
  ok.forEach(function(o){ var r=by[o.desc]=by[o.desc]||{desc:o.desc,n:0,units:0,amount:0}; r.n++; r.units+=o.qty; r.amount+=o.subtotal; });
  var rows=Object.keys(by).map(function(k){ return by[k]; }), f=ui.rankBy==='amount'?'amount':'units';
  rows.sort(function(a,b){ return b[f]-a[f]||b.amount-a.amount; });
  if(!rows.length) return '<div class="empty">Todavía no hay ventas aprobadas para armar el ranking.</div>';
  var max=rows[0][f]||1;
  return '<div class="section-head" style="margin:8px 0 0"><div><h2 class="display h-card">Productos más vendidos</h2><p class="muted">Según las ventas aprobadas en el sitio.</p></div>'
    +'<div class="seg" role="group" aria-label="Ordenar ranking"><button type="button" data-act="rank-by" data-by="units" aria-pressed="'+(f==='units')+'">Por unidades</button><button type="button" data-act="rank-by" data-by="amount" aria-pressed="'+(f==='amount')+'">Por monto</button></div></div>'
    +'<div class="tablewrap"><table style="min-width:820px"><thead><tr><th class="r">Puesto</th><th>Producto</th><th>'+(f==='units'?'Unidades vendidas':'Monto vendido')+'</th><th class="r">'+(f==='units'?'Monto':'Unidades')+'</th><th class="r">Ventas</th></tr></thead><tbody>'
    +rows.map(function(r,i){
      var p=r.desc.split(': '), main=f==='units'?r.units+'':money(r.amount), other=f==='units'?money(r.amount):r.units+'';
      return '<tr><td class="r num"><b>'+(i+1)+'</b></td><td><b>'+esc(p.slice(1).join(': ')||r.desc)+'</b><span class="sub">'+esc(p[0])+'</span></td><td><div class="cellbar"><b class="num">'+main+'</b>'+bar(r[f]/max*100,r.desc+': '+r.units+' unidades, '+money(r.amount))+'</div></td><td class="r num">'+other+'</td><td class="r num">'+r.n+'</td></tr>';
    }).join('')+'</tbody></table></div>';
}
/* Cuadrito del resumen: un botón que lleva al detalle del dato. */
function tile(cls,k,v,sub,tab,month,status,go,anchor,icon){
  return '<button type="button" class="tile tile-link '+cls+'" data-act="goto" data-tab="'+tab+'" data-month="'+month+'" data-status="'+status+'"'+(anchor?' data-anchor="'+anchor+'"':'')+'>'
    +'<span class="tile-top"><span class="k">'+k+'</span><span class="ic sm">'+ico(icon||'stats',18)+'</span></span><span class="v num">'+v+'</span>'+sub+'<span class="go">'+go+' →</span></button>';
}
/* Resumen del mes: plata del período, comparada con el mismo tramo del mes anterior. */
function prevMonth(m){ var p=m.split('-'), y=+p[0], mo=+p[1]-1; if(mo===0){ y--; mo=12; } return y+'-'+String(mo).padStart(2,'0'); }
function monthWord(m){ return monthName(m).split(' ')[0].toLowerCase(); }
function summary(){
  var now=today(), cur=now.slice(0,7), ms={}; ms[cur]=1;
  db.orders.forEach(function(o){ ms[String(o.date).slice(0,7)]=1; });
  var list=Object.keys(ms).sort().reverse(), m=list.indexOf(ui.sumMonth)>=0?ui.sumMonth:cur, pm=prevMonth(m);
  var partial=m===cur, cut=partial?+now.slice(8,10):31, mo=function(o,x){ return String(o.date).slice(0,7)===x; };
  var A=db.orders.filter(function(o){ return o.status==='approved'&&mo(o,m); });
  var B=db.orders.filter(function(o){ return o.status==='approved'&&mo(o,pm)&&+String(o.date).slice(8,10)<=cut; });
  var R=db.orders.filter(function(o){ return o.status==='refunded'&&mo(o,m); });
  var S=function(arr,f){ return arr.reduce(function(s,o){ return s+f(o); },0); }, T=function(o){ return o.subtotal+o.shipping; }, C=function(o){ return o.commission; };
  var tot=S(A,T), com=S(A,C), btot=S(B,T), bcom=S(B,C);
  var ref=partial?'que del 1 al '+cut+' de '+monthWord(pm):'que en '+monthWord(pm);
  var clicks=function(kind,label){ var c=sumClicks(kind,m), out={total:0,top:'',topN:0}; for(var k in c){ out.total+=c[k]; if(c[k]>out.topN){ out.topN=c[k]; out.top=label(k); } } return out; };
  var V=clicks('v',function(id){ var v=vendor(id); return v?v.name:'Proveedor dado de baja'; }), P=clicks('p',function(k){ var a=k.split('|'); return a[1]+' '+a[2]; });
  var delta=function(x,y){
    if(!y) return '<span class="s">'+(x?'Sin ventas para comparar '+(partial?'en el mismo tramo de ':'en ')+monthWord(pm):'Sin ventas todavía')+'</span>';
    var p=Math.round((x-y)/y*100);
    return '<span class="s '+(p>=0?'up':'down')+'">'+(p>=0?'▲ ':'▼ ')+Math.abs(p)+'% '+(p>=0?'más ':'menos ')+ref+'</span>';
  };
  var tv=traffic(m+'-01',partial?now:lastDay(m)), pvT=traffic(pm+'-01',partial?addDays(pm+'-01',cut-1):lastDay(pm));
  if(pvT.days.length&&pvT.days[pvT.days.length-1].iso>lastDay(pm)) pvT=traffic(pm+'-01',lastDay(pm));
  var conv=tv.v?Math.min(1,tv.orders/tv.v):0;
  return '<div class="sum-head"><div><p class="eyebrow">'+monthName(m)+(partial?' · hasta hoy':'')+'</p>'
    +(partial?'<p class="muted small">Cada número se compara con los mismos días del mes anterior, para que el mes en curso no parezca peor de lo que es.</p>':'<p class="muted small">Comparado con '+monthWord(pm)+' completo.</p>')+'</div>'
    +'<div class="field period"><label for="sum-month">Mes</label><select id="sum-month">'+list.map(function(x){ return '<option value="'+x+'"'+(x===m?' selected':'')+'>'+monthName(x)+'</option>'; }).join('')+'</select></div></div>'
    +'<div class="tiles eight">'
    +tile('main','Tu comisión',money(com),delta(com,bcom),'ventas',m,'approved','Ver la comisión de cada venta','','pct')
    +tile('','Vendido',money(tot),delta(tot,btot),'ventas',m,'approved','Ver las ventas','','money')
    +tile('','Ventas',A.length,'<span class="s">'+(A.length?'Ticket promedio '+money(tot/A.length):'Todavía no hay ventas este mes')+'</span>','ventas',m,'approved','Ver las ventas','','bag')
    +tile('','Devoluciones',R.length,'<span class="s">'+(R.length?'Comisión perdida '+money(S(R,C)):'Ninguna en el mes')+'</span>','ventas',m,'refunded','Ver las devoluciones','','refund')
    +tile('','Visitas al sitio',nfmt(tv.v),dlt(tv.v,pvT.v,true,partial?'el mismo tramo de '+monthWord(pm):monthWord(pm)),'stats',m,'','Ver métricas web','','eye')
    +tile('','Conversión',tv.v?pctTxt(conv,2):'—','<span class="s">'+tv.orders+(tv.orders===1?' compra':' compras')+' de '+nfmt(tv.v)+' visitas</span>','stats',m,'','Ver el embudo de compra','','target')
    +tile('','Clics en marcas',V.total,'<span class="s">'+(V.top?'Más clics: '+esc(V.top)+' ('+V.topN+')':'Sin clics en el mes')+'</span>','stats',m,'','Ver clics por marca','st-v','tag')
    +tile('','Clics en productos',P.total,'<span class="s">'+(P.top?'Más buscado: '+esc(P.top)+' ('+P.topN+')':'Sin clics en el mes')+'</span>','stats',m,'','Ver clics por producto','st-p','click')
    +'</div>';
}
/* Lo que hay que resolver: primero lo urgente, después lo pendiente, al final lo que está en orden. */
function alerts(){
  var now=today(), rows=[], vn=function(id){ var v=vendor(id); return v?v.name:'Proveedor'; };
  var late=db.orders.filter(function(o){ return lateDays(o)>0; }).sort(function(a,b){ return lateDays(b)-lateDays(a); });
  rows.push({lvl:late.length?'bad':'ok',t:'Pedidos demorados',n:late.length,
    d:late.length?late.slice(0,3).map(function(o){ var x=lateDays(o); return '#'+o.id+' de '+esc(vn(o.vendorId))+': '+x+(x===1?' día hábil':' días hábiles')+' de atraso'; }).join(' · ')+(late.length>3?' · y '+(late.length-3)+' más':''):'Todos los pedidos pagados están dentro del plazo de entrega.',
    act:late.length?'<button class="btn btn-outline btn-sm" data-act="goto" data-tab="ventas" data-month="" data-status="late">Ver demorados</button>':''});
  var pv=db.vendors.filter(function(v){ return v.status==='pending'; });
  rows.push({lvl:pv.length?'warn':'ok',t:'Proveedores por aprobar',n:pv.length,d:pv.length?pv.map(function(v){ return esc(v.name); }).join(' · '):'No hay solicitudes nuevas.',act:pv.length?'<button class="btn btn-outline btn-sm" data-act="tab" data-tab="vendedores">Revisar</button>':''});
  var po=db.offers.filter(function(o){ return o.status==='review'; });
  rows.push({lvl:po.length?'warn':'ok',t:'Productos por revisar',n:po.length,d:po.length?po.slice(0,3).map(function(o){ return esc(o.model)+' de '+esc(vn(o.vendorId)); }).join(' · '):'No hay productos esperando revisión.',act:po.length?'<button class="btn btn-outline btn-sm" data-act="tab" data-tab="productos" data-sub="aprobar">Revisar</button>':''});
  var mp=db.vendors.filter(function(v){ return v.status==='active'&&!v.mp; });
  rows.push({lvl:mp.length?'bad':'ok',t:'Mercado Pago desconectado',n:mp.length,d:mp.length?mp.map(function(v){ return esc(v.name); }).join(' · ')+'. Sus productos no aparecen y no pueden vender.':'Todos los proveedores activos pueden cobrar.',act:mp.length?'<button class="btn btn-outline btn-sm" data-act="tab" data-tab="vendedores">Ver proveedores</button>':''});
  var old=db.offers.filter(function(o){ return o.status==='published'&&calDays(o.updated||now,now)>30; }), byV={};
  old.forEach(function(o){ byV[o.vendorId]=(byV[o.vendorId]||0)+1; });
  rows.push({lvl:old.length?'warn':'ok',t:'Precios sin actualizar hace más de 30 días',n:old.length,
    d:old.length?Object.keys(byV).map(function(id){ return esc(vn(id))+': '+byV[id]+(byV[id]===1?' producto':' productos'); }).join(' · ')+'. Conviene pedirles que confirmen precio y stock.':'Todos los precios publicados están al día.',
    act:old.length?'<button class="btn btn-outline btn-sm" data-act="stale" data-id="'+Object.keys(byV)[0]+'">Ver stock</button>':''});
  var rank={bad:0,warn:1,ok:2}, lab={bad:'Urgente',warn:'Pendiente',ok:'En orden'}, open=rows.filter(function(r){ return r.lvl!=='ok'; }).length;
  rows.sort(function(a,b){ return rank[a.lvl]-rank[b.lvl]; });
  return '<div class="card">'+chead('alert','Para resolver',open?(open===1?'Hay 1 tema que necesita atención.':'Hay '+open+' temas que necesitan atención.'):'No hay nada pendiente.')
    +'<div class="alerts">'+rows.map(function(r){
      return '<div class="al '+r.lvl+'"><span class="st '+r.lvl+'">'+lab[r.lvl]+'</span><div class="al-b"><b>'+r.t+(r.n?' · '+r.n:'')+'</b><span class="muted small">'+r.d+'</span></div>'+(r.act||'')+'</div>';
    }).join('')+'</div></div>';
}
function adEditRow(i){
  return '<tr class="editing"><td><label class="sr" for="ae-brand">Marca</label><input id="ae-brand" class="cell-in" type="text" maxlength="30" placeholder="Marca" value="'+esc(i.brand)+'"></td>'
    +'<td><label class="sr" for="ae-text">Mensaje</label><input id="ae-text" class="cell-in" type="text" maxlength="80" value="'+esc(i.text)+'"></td>'
    +'<td><label class="sr" for="ae-url">Enlace</label><input id="ae-url" class="cell-in" type="url" placeholder="https://" value="'+esc(i.url)+'"></td>'
    +'<td colspan="3"><span class="muted small">Escribí y guardá. El cartel se actualiza al instante.</span></td>'
    +'<td><div class="actions nw" style="justify-content:flex-end"><button class="btn btn-accent btn-sm" data-act="ad-save" data-id="'+i.id+'">Guardar</button><button class="btn btn-outline btn-sm" data-act="ad-cancel">Cancelar</button></div></td></tr>';
}
function vAdmin(){
  var ok=db.orders.filter(function(o){ return o.status==='approved'; });
  var sum=function(f){ return ok.reduce(function(a,o){ return a+f(o); },0); };
  var pendV=db.vendors.filter(function(v){ return v.status==='pending'; }).length;
  var pendO=db.offers.filter(function(o){ return o.status==='review'; }).length;
  if(!TABS.some(function(t){ return t.id===ui.tab; })) ui.tab='resumen';
  checkLate();
  var body='';
  if(ui.tab==='resumen'){
    body=summary()
      +monthly(ok)
      +partners(ok);
  } else if(ui.tab==='ventas'){
    var subsV=[['todas','Todas las ventas'],['comisiones','Comisiones a facturar'],['compradores','Compradores']];
    body='<div class="seg" role="group" aria-label="Vista de ventas">'+subsV.map(function(x){ return '<button type="button" data-act="sales-sub" data-sub="'+x[0]+'" aria-pressed="'+(ui.salesSub===x[0])+'">'+x[1]+'</button>'; }).join('')+'</div>';
    if(ui.salesSub==='comisiones') body+=commissionsView();
    else if(ui.salesSub==='compradores') body+=buyersView();
    else {
      var mlist=orderMonths(); if(mlist.indexOf(ui.salesMonth)<0) ui.salesMonth='';
      var fm=ui.salesMonth, fv=ui.salesVendor, fs=ui.salesStatus;
      var stt={'':'Todos los estados',approved:'Aprobadas',toship:'Pagadas, por enviar',late:'Demoradas',refunded:'Devueltas'};
      var rows=salesRows(), okr=rows.filter(function(o){ return o.status==='approved'; });
      var tt=okr.reduce(function(s2,o){ return s2+o.subtotal+o.shipping; },0), tc=okr.reduce(function(s2,o){ return s2+o.commission; },0);
      body+=alerts()
        +'<div class="section-head" style="margin:8px 0 0"><div class="ch"><span class="ic">'+ico('ventas')+'</span><h2 class="display h-card">Todas las ventas</h2></div>'+exportBar('ventas')+'</div>'
        +'<div class="filters">'
        +'<div class="field"><label for="s-month">Mes</label><select id="s-month"><option value="">Todos los meses</option>'+mlist.map(function(x){ return '<option value="'+x+'"'+(x===fm?' selected':'')+'>'+monthName(x)+'</option>'; }).join('')+'</select></div>'
        +'<div class="field"><label for="s-vendor">Proveedor</label><select id="s-vendor"><option value="">Todos</option>'+db.vendors.filter(function(v){ return v.status!=='pending'&&v.status!=='rejected'; }).map(function(v){ return '<option value="'+v.id+'"'+(v.id===fv?' selected':'')+'>'+esc(v.name)+'</option>'; }).join('')+'</select></div>'
        +'<div class="field"><label for="s-status">Estado</label><select id="s-status">'+Object.keys(stt).map(function(k){ return '<option value="'+k+'"'+(k===fs?' selected':'')+'>'+stt[k]+'</option>'; }).join('')+'</select></div>'
        +'</div>'
        +'<p class="sumline"><b>'+rows.length+(rows.length===1?' venta':' ventas')+'</b>'+(okr.length?' · Vendido <b class="num">'+money(tt)+'</b> · Tu comisión <b class="num">'+money(tc)+'</b>':'')+(okr.length!==rows.length&&okr.length?' <span class="muted">(los montos cuentan solo las aprobadas)</span>':'')+'</p>'
        +salesTable(rows);
    }
  } else if(ui.tab==='usuarios'){
    body=usersView();
  } else if(ui.tab==='vendedores'){
    var sv=ui.vSel?vendor(ui.vSel):null; if(!sv) ui.vSel=null;
    body=sv?vendorFile(sv):vendorList()+'<div class="card">'+chead('pct','Comisión por proveedor','Si dejás el campo vacío, se aplica la general ('+db.commission+'%).')
      +'<div class="list">'+db.vendors.filter(function(v){ return v.status!=='rejected'; }).map(function(v){ return '<div><div class="who2"><b>'+esc(v.name)+'</b></div><div class="pctbox"><label class="small muted" for="vc-'+v.id+'">Comisión %</label><input id="vc-'+v.id+'" data-vc="'+v.id+'" type="number" min="0" max="100" placeholder="'+db.commission+'" value="'+(v.commission==null?'':v.commission)+'"></div></div>'; }).join('')+'</div></div>';
  } else if(ui.tab==='productos'){
    var q=db.offers.filter(function(o){ return o.status==='review'; });
    var subs=[['ranking','Más vendidos'],['aprobar','Por aprobar'+(q.length?' · '+q.length:'')],['stock','Stock por proveedor']];
    if(!subs.some(function(s){ return s[0]===ui.prodSub; })) ui.prodSub='ranking';
    body='<div class="seg" role="group" aria-label="Vista de productos">'+subs.map(function(s){ return '<button type="button" data-act="prod-sub" data-sub="'+s[0]+'" aria-pressed="'+(ui.prodSub===s[0])+'">'+s[1]+'</button>'; }).join('')+'</div>';
    if(ui.prodSub==='ranking') body+='<div class="xrow">'+exportBar('ranking')+'</div>'+ranking(ok);
    else if(ui.prodSub==='stock') body+=stockByVendor()+(db.offers.some(function(o){ return o.vendorId===ui.stockVendor; })?'<div class="xrow">'+exportBar('stock')+'</div>':'');
    else body+='<p class="note">Los productos los cargás vos desde “Stock por proveedor”. Acá llegan los que tienen que pasar por revisión, por ejemplo cuando un proveedor confirmó un precio raro.</p>'
      +(q.length?'<div class="tablewrap"><table style="min-width:860px"><thead><tr><th>Modelo</th><th>Proveedor</th><th>Variante</th><th class="r">Precio</th><th>Entrega</th><th>Garantía</th><th></th></tr></thead><tbody>'
      +q.map(function(o){ var v=vendor(o.vendorId); return '<tr><td><b>'+esc(o.model)+'</b><span class="sub">'+esc(o.category)+' · '+perUnit(o.unit)+(o.brand?' · Marca: '+esc(o.brand):'')+(o.detail?' · '+esc(o.detail):'')+'</span></td><td>'+esc(v?v.name:'')+'</td><td>'+esc(o.size)+'</td><td class="r num">'+money(o.price)+priceBadge(o)+(priceCheck(o,o.id,o.vendorId)?'<span class="sub">'+esc(priceCheck(o,o.id,o.vendorId).text)+'</span>':'')+'</td><td>'+days(o.lead)+'</td><td>'+months(o.warranty)+'</td>'
        +'<td><div class="actions nw" style="justify-content:flex-end"><button class="btn btn-accent btn-sm" data-act="o-approve" data-id="'+o.id+'">Aprobar</button><button class="btn btn-outline btn-sm" data-act="o-reject" data-id="'+o.id+'">Rechazar</button></div></td></tr>'; }).join('')
      +'</tbody></table></div>':'<div class="empty">No hay productos esperando revisión.</div>');
  } else if(ui.tab==='stats'){
    body=statsView();
  } else if(ui.tab==='catalogo'){
    body=catalogView();
  } else if(ui.tab==='contenido'){
    body=contentForm()+spacesCard();
  } else if(ui.tab==='publicidad'){
    var ad=db.ad, items=ad.items||[], adc=sumClicks('a','');
    body='<div class="card"><div class="section-head" style="margin:0"><div><h2 class="display h-card">Cartel LED</h2><p class="note">Va arriba de todo en el sitio de compradores. Cada marca tiene su mensaje y, si querés, su enlace. Los mensajes activos pasan uno detrás del otro.</p></div>'
      +'<label class="check"><input id="ad-on" type="checkbox"'+(ad.on?' checked':'')+'> Cartel encendido</label></div>'
      +(items.length?'<div class="tablewrap"><table style="min-width:820px"><thead><tr><th>Marca</th><th>Mensaje</th><th>Enlace</th><th>Dónde</th><th class="r">Clics</th><th>Estado</th><th></th></tr></thead><tbody>'
        +items.map(function(i){ if(ui.adEdit===i.id) return adEditRow(i); return '<tr><td><b>'+esc(i.brand||'Sin marca')+'</b></td><td>'+esc(i.text)+'</td><td>'+(i.url?esc(i.url):'<span class="muted">Sin enlace</span>')+'</td><td><select class="wsel" data-where="'+i.id+'" aria-label="Dónde se muestra '+esc(i.brand||i.text)+'">'+['all','home','buy'].map(function(w){ return '<option value="'+w+'"'+((i.where||'all')===w?' selected':'')+'>'+adWhere(w)+'</option>'; }).join('')+'</select></td><td class="r num">'+(i.url?(adc[i.id]||0):'—')+'</td><td>'+(i.on?'<span class="st ok">En el cartel</span>':'<span class="st neu">Pausado</span>')+'</td>'
          +'<td><div class="actions nw" style="justify-content:flex-end"><button class="btn btn-primary btn-sm" data-act="ad-edit" data-id="'+i.id+'">Editar</button><button class="btn btn-outline btn-sm" data-act="ad-toggle" data-id="'+i.id+'">'+(i.on?'Pausar':'Activar')+'</button><button class="btn btn-outline btn-sm" data-act="ad-del" data-id="'+i.id+'">Quitar</button></div></td></tr>'; }).join('')
        +'</tbody></table></div>':'<div class="empty">Todavía no hay marcas en el cartel. Mientras tanto se muestra como espacio disponible.</div>')
      +'</div>'
      +'<form id="adform" class="card" novalidate style="max-width:720px"><h2 class="display h-card">Agregar una marca</h2>'
      +'<div id="ad-err" class="alert bad" role="alert" hidden></div>'
      +'<div class="formgrid"><div class="field"><label for="ad-brand">Marca</label><input id="ad-brand" type="text" maxlength="30"></div>'
      +'<div class="field" style="grid-column:span 2"><label for="ad-text">Mensaje</label><input id="ad-text" type="text" maxlength="80"><span class="hint">Hasta 80 caracteres.</span></div></div>'
      +'<div class="field" style="max-width:320px"><label for="ad-where">Dónde se muestra</label><select id="ad-where"><option value="all">Las dos páginas</option><option value="home">Solo Inicio</option><option value="buy">Solo Compará y comprá</option></select></div>'
      +'<div class="field"><label for="ad-url">Enlace (opcional)</label><input id="ad-url" type="url" placeholder="https://"><span class="hint">Tiene que empezar con https://. Con enlace, se cuentan los clics.</span></div>'
      +'<div><button class="btn btn-primary" type="submit">Agregar al cartel</button></div></form>'
      +'<div style="display:flex;flex-direction:column;gap:8px"><h2 class="display h-card">Así se ve en Inicio</h2>'+(adBanner('home')||'<p class="muted">El cartel está apagado.</p>')+'</div>'
      +'<div style="display:flex;flex-direction:column;gap:8px"><h2 class="display h-card">Así se ve en Compará y comprá</h2>'+(adBanner('buy')||'<p class="muted">El cartel está apagado.</p>')+'</div>';
  } else {
    var subsC=[['general','General'],['usuarios','Usuarios y claves'],['historial','Historial de cambios']];
    body='<div class="seg" role="group" aria-label="Configuración">'+subsC.map(function(x){ return '<button type="button" data-act="cfg-sub" data-sub="'+x[0]+'" aria-pressed="'+(ui.cfgSub===x[0])+'">'+x[1]+'</button>'; }).join('')+'</div>';
    if(ui.cfgSub==='usuarios') body+=usersCard();
    else if(ui.cfgSub==='historial') body+=logCard();
    else body+='<div class="split"><form id="config" class="card main" novalidate style="max-width:520px">'+chead('pct','Comisión general','')
      +'<div class="field" style="max-width:200px"><label for="g-pct">Porcentaje por venta</label><input id="g-pct" type="number" min="0" max="100" value="'+db.commission+'"></div>'
      +'<p class="note">Se calcula sobre los productos, sin el envío, y se descuenta sola en cada pago. Las ventas ya hechas no cambian.</p>'
      +'<div><button class="btn btn-primary" type="submit">Guardar</button></div></form>'
      +'<div class="card side">'+chead('refund','Datos de la demo','Vuelve a los proveedores, productos y ventas de ejemplo.')
      +'<div><button class="btn btn-danger" data-act="reset">'+(ui.confirm==='reset'?'Confirmar: borrar mis cambios':'Reiniciar la demo')+'</button></div>'
      +'<label class="check"><input id="demo-traffic" type="checkbox"'+((db.traffic||{}).demo?' checked':'')+'> Mostrar visitas de ejemplo en Métricas web</label><p class="note">Apagalo cuando el sitio esté publicado: quedan solo las visitas reales.</p></div></div>'+prefsCard()+waCard();
  }
  var T=TABS.filter(function(t){ return t.id===ui.tab; })[0];
  var cnt={}; TABS.forEach(function(t){ cnt[t.id]=unread(t.id); }); var all=unread();
  return '<div class="adm">'+sidebar(cnt)
    +'<main class="adm-main"><header class="adm-top"><div class="adm-top-row"><div><p class="eyebrow">'+todayLong()+'</p><h1 class="display h-page">'+T.label+'</h1><p class="muted">'+T.sub+'</p></div>'
    +'<button type="button" class="bell'+(all?' on':'')+'" data-act="bell" aria-expanded="'+ui.bell+'" aria-label="Novedades'+(all?', '+all+' sin leer':'')+'">'+ico('bell',22)+'<span>Novedades</span>'+(all?'<span class="count">'+all+'</span>':'')+'</button></div>'
    +(ui.bell?bellPanel():'')+'</header>'
    +'<div class="adm-body">'+body+'</div></main></div>';
}
function render(){
  var N=db.notifs||[], top=N.length?N[0].id:0;
  if(me()&&ui.seenN!=null&&top>ui.seenN){ var fresh=N.filter(function(n){ return n.id>ui.seenN; }); setTimeout(function(){ toast(fresh.length===1?fresh[0].text:'Tenés '+fresh.length+' novedades nuevas'); },50); }
  ui.seenN=top;
  app.innerHTML=me()?vAdmin():vLogin();
  var nav=app.querySelector('.snav'), cur=nav&&nav.querySelector('[aria-current]');
  if(cur&&nav.scrollWidth>nav.clientWidth) nav.scrollLeft=Math.max(0,cur.offsetLeft-nav.clientWidth/2+cur.offsetWidth/2);
  var cl=app.querySelector('.catlist'), cc=cl&&cl.querySelector('[aria-current]');
  if(cc&&cl.scrollHeight>cl.clientHeight&&(cc.offsetTop<cl.scrollTop||cc.offsetTop+cc.offsetHeight>cl.scrollTop+cl.clientHeight)) cl.scrollTop=cc.offsetTop-cl.clientHeight/2;
}
document.addEventListener('click',function(ev){
  var t=ev.target.closest?ev.target.closest('[data-act]'):null;
  if(!t||t.disabled) return;
  var a=t.getAttribute('data-act'), id=t.dataset.id, x;
  if(['refund','reset','v-del','o-del','c-reset','cat-del','cat-reset','m-del','sp-del','u-del','u-pw','u-block','u-delacc'].indexOf(a)<0) ui.confirm=null;
  switch(a){
    case 'logout': sset(AKEY,null); ui.loginErr=''; rerender(); toast('Saliste del administrador'); break;
    case 'xls': doExport(t.dataset.kind,false); break;
    case 'u-open': ui.uSel=id; ui.tempPw=null; rerender(); try{ window.scrollTo(0,0); }catch(e){} break;
    case 'u-back': ui.uSel=null; ui.tempPw=null; rerender(); try{ window.scrollTo(0,0); }catch(e){} break;
    case 'u-f': ui.uF=t.dataset.f; rerender(); break;
    case 'goto-guests': x=document.getElementById('guests'); if(x){ try{ x.scrollIntoView({block:'start'}); x.classList.add('hit'); }catch(e){} } break;
    case 'g-invite': db.guestInv=db.guestInv||{}; db.guestInv[t.dataset.k]=today(); logAct('invitó a crear su cuenta a '+t.dataset.k); save(); rerender(); toast('Invitación registrada. En el sitio real le llega un email con un link para crear su cuenta con sus datos ya cargados.'); break;
    case 'u-pw': x=(db.buyers||[]).filter(function(b){ return b.id===id; })[0]; if(!x) break;
      if(ui.confirm!=='upw'+id){ ui.confirm='upw'+id; rerender(); break; }
      var tp='cf'+String(Math.floor(1000+Math.random()*9000)); x.hash=pwHash(tp); ui.tempPw={id:id,pw:tp}; ui.confirm=null; logAct('restableció la clave del usuario '+x.name); save(); rerender(); toast('Clave temporal creada'); break;
    case 'u-block': x=(db.buyers||[]).filter(function(b){ return b.id===id; })[0]; if(!x) break;
      if(ui.confirm!=='ublk'+id){ ui.confirm='ublk'+id; rerender(); break; }
      x.blocked=!x.blocked; ui.confirm=null; logAct((x.blocked?'bloqueó':'desbloqueó')+' al usuario '+x.name); save(); rerender(); toast(x.blocked?x.name+' ya no puede entrar a su cuenta':x.name+' puede volver a entrar'); break;
    case 'u-delacc': x=(db.buyers||[]).filter(function(b){ return b.id===id; })[0]; if(!x) break;
      if(ui.confirm!=='udl'+id){ ui.confirm='udl'+id; rerender(); break; }
      db.buyers=db.buyers.filter(function(b){ return b.id!==id; }); db.orders.forEach(function(o){ if(o.buyerId===id) o.buyerId=''; }); ui.confirm=null; ui.uSel=null; logAct('borró la cuenta del usuario '+x.name); save(); rerender(); toast('Cuenta borrada. Sus pedidos quedan registrados.'); break;
    case 'v-open': ui.vSel=id; ui.vForm=null; rerender(); try{ window.scrollTo(0,0); }catch(e){} break;
    case 'v-back': ui.vSel=null; ui.vForm=null; rerender(); try{ window.scrollTo(0,0); }catch(e){} break;
    case 'bell': ui.bell=!ui.bell; rerender(); break;
    case 'n-readall': markRead(); rerender(); break;
    case 'n-go': x=(db.notifs||[]).filter(function(n){ return n.id===+id; })[0]; if(!x) break; x.read=true; save(); ui.bell=false; ui.tab=x.tab;
      if(x.tab==='ventas'){ ui.salesSub='todas'; ui.salesMonth=''; ui.salesVendor=''; ui.salesStatus=x.kind==='late'?'late':(x.kind==='refund'?'refunded':''); }
      if(x.tab==='vendedores'){ ui.vSel=vendor(x.ref)?x.ref:null; }
      if(x.tab==='productos'){ ui.prodSub='aprobar'; }
      rerender(); try{ window.scrollTo(0,0); }catch(e){} break;
    case 'xcopy': doExport(t.dataset.kind,true); break;
    case 'sales-sub': ui.salesSub=t.dataset.sub; rerender(); break;
    case 'cfg-sub': ui.cfgSub=t.dataset.sub; ui.uForm=null; rerender(); break;
    case 'inv': var ik=t.dataset.month+'|'+id; x=vendor(id); if(db.invoiced[ik]) delete db.invoiced[ik]; else db.invoiced[ik]=today(); logAct((db.invoiced[ik]?'marcó como facturada':'desmarcó la factura de')+' la comisión de '+(x?x.name:'un proveedor')+' de '+monthName(t.dataset.month).toLowerCase()); save(); rerender(); toast(db.invoiced[ik]?'Marcada como facturada':'Vuelve a quedar a facturar'); break;
    case 'log-all': ui.logAll=!ui.logAll; rerender(); break;
    case 'u-new': ui.uForm='new'; rerender('u-name'); break;
    case 'u-edit': ui.uForm=id; rerender(me()&&me().id===id?'u-pass':'u-name'); break;
    case 'u-cancel': ui.uForm=null; rerender(); break;
    case 'u-del':
      if(ui.confirm!=='udel'+id){ ui.confirm='udel'+id; rerender(); break; }
      x=db.users.filter(function(u){ return u.id===id; })[0]; if(!x||(me()&&me().id===id)||db.users.length<2) break;
      db.users=db.users.filter(function(u){ return u.id!==id; }); ui.confirm=null; logAct('quitó al usuario '+x.name); save(); rerender(); toast(x.name+' ya no puede entrar'); break;
    case 'cat-sel': ui.catSel=t.dataset.cat; ui.mEdit=null; rerender(); try{ if(innerWidth<900){ var ce=document.querySelector('.catedit'); if(ce) ce.scrollIntoView({block:'start'}); } }catch(e){} break;
    case 'cat-new': ui.catSel='new'; ui.mEdit=null; rerender('cat-n'); break;
    case 'cat-del':
      if(ui.confirm!=='catdel'){ ui.confirm='catdel'; rerender(); break; }
      x=catBy(ui.catSel); if(!x||offersOf(x.n).length) break;
      CATALOG.splice(CATALOG.indexOf(x),1); delete db.images['cat:'+x.n]; if(db.spaces) db.spaces.forEach(function(sp){ sp.cats=sp.cats.filter(function(c){ return c!==x.n; }); });
      ui.confirm=null; ui.catSel=''; saveCatalog('eliminó la categoría '+x.n); rerender(); toast('Categoría eliminada'); break;
    case 'cat-reset':
      if(ui.confirm!=='cat-reset'){ ui.confirm='cat-reset'; rerender(); break; }
      delete db.catalog; CATALOG=JSON.parse(JSON.stringify(CATALOG_BASE)); ui.confirm=null; ui.catSel=''; logAct('volvió al catálogo original'); save(); rerender(); toast('Volvió el catálogo original'); break;
    case 'm-new': ui.mEdit='new'; rerender('m-name'); break;
    case 'm-edit': ui.mEdit=+t.dataset.i; rerender('m-name'); break;
    case 'm-cancel': ui.mEdit=null; rerender(); break;
    case 'm-del':
      var mi=+t.dataset.i; if(ui.confirm!=='mdel'+mi){ ui.confirm='mdel'+mi; rerender(); break; }
      x=catBy(ui.catSel); if(!x||!x.m[mi]||offersOf(x.n,x.m[mi][0]).length) break;
      var mn=x.m[mi][0]; x.m.splice(mi,1); ui.confirm=null; saveCatalog('eliminó el modelo '+mn+' de '+x.n); rerender(); toast('Modelo eliminado'); break;
    case 'sp-new': ui.spEdit='new'; rerender('sp-n'); break;
    case 'sp-edit': ui.spEdit=+t.dataset.i; rerender('sp-n'); break;
    case 'sp-cancel': ui.spEdit=null; rerender(); break;
    case 'sp-del':
      var si=+t.dataset.i; if(ui.confirm!=='spdel'+si){ ui.confirm='spdel'+si; rerender(); break; }
      db.spaces=JSON.parse(JSON.stringify(spaces())); x=db.spaces.splice(si,1)[0]; if(x) delete db.images['space:'+x.a];
      ui.confirm=null; logAct('quitó el espacio '+(x?x.n:'')); save(); rerender(); toast('Espacio quitado'); break;
    case 'img-del': delete db.images[t.dataset.key]; logAct('quitó la foto de '+t.dataset.key.split(':').slice(1).join(':')); save(); rerender(); toast('Foto quitada: vuelve la ilustración'); break;
    case 'tab': ui.tab=t.dataset.tab; ui.bell=false; markRead(ui.tab); if(ui.tab==='vendedores'&&!t.dataset.keep){ ui.vSel=null; ui.vForm=null; } if(ui.tab==='ventas'){ ui.salesMonth=''; ui.salesStatus=''; ui.salesVendor=''; } if(t.dataset.sub) ui.prodSub=t.dataset.sub; rerender(); try{ window.scrollTo(0,0); }catch(e){} break;
    case 'refund':
      if(ui.confirm!=='r'+id){ ui.confirm='r'+id; rerender(); }
      else { x=order(id); if(x){ x.status='refunded'; } ui.confirm=null; save(); rerender(); toast('Devolución registrada'); }
      break;
    case 'v-approve': x=vendor(id); if(x){ x.status='active'; logAct('aprobó/reactivó a '+x.name); vnotify(x.id,'account','resumen','Tu cuenta está activa: ya podés publicar y vender.'); save(); rerender(); toast(x.name+' quedó activo'); } break;
    case 'v-reject': x=vendor(id); if(x){ x.status='rejected'; logAct('rechazó la solicitud de '+x.name); save(); rerender(); toast('Solicitud rechazada'); } break;
    case 'v-suspend': x=vendor(id); if(x){ x.status='suspended'; logAct('suspendió a '+x.name); vnotify(x.id,'account','resumen','Tu cuenta fue suspendida: tus productos no se muestran. Escribinos para resolverlo.'); save(); rerender(); toast(x.name+' quedó suspendido'); } break;
    case 'o-approve': x=offer(id); if(x){ x.status='published'; logAct('aprobó '+x.model+' '+x.size+' de '+((vendor(x.vendorId)||{}).name||'')); vnotify(x.vendorId,'product','productos','Aprobamos '+x.model+' '+x.size+': ya se muestra en la comparación.',x.id); save(); rerender(); toast('Producto publicado'); } break;
    case 'o-reject': x=offer(id); if(x){ x.status='rejected'; logAct('rechazó '+x.model+' '+x.size+' de '+((vendor(x.vendorId)||{}).name||'')); vnotify(x.vendorId,'product','productos','No aprobamos '+x.model+' '+x.size+'. Revisá que el modelo y la variante sean los correctos y volvé a enviarlo.',x.id); save(); rerender(); toast('Producto rechazado'); } break;
    case 'stock-v': ui.stockVendor=id; ui.oForm=null; rerender(); break;
    case 'o-new-for': ui.tab='productos'; ui.prodSub='stock'; ui.stockVendor=id; ui.oForm='new'; rerender('o-cat'); try{ var of2=document.getElementById('oform'); if(of2) of2.scrollIntoView({block:'start'}); }catch(e){} break;
    case 'stale': ui.tab='productos'; ui.prodSub='stock'; ui.stockVendor=id; rerender(); try{ window.scrollTo(0,0); }catch(e){} break;
    case 'prod-sub': ui.prodSub=t.dataset.sub; rerender(); break;
    case 'rank-by': ui.rankBy=t.dataset.by; rerender(); break;
    case 'goto':
      ui.tab=t.dataset.tab; markRead(ui.tab); ui.salesVendor=t.dataset.vendor||''; ui.salesStatus=t.dataset.status||''; if(ui.tab==='ventas') ui.salesSub='todas';
      if(t.hasAttribute('data-month')){ ui.salesMonth=t.dataset.month; if(ui.tab==='stats') ui.statRange=t.dataset.month||'30'; }
      rerender();
      x=t.dataset.anchor?document.getElementById(t.dataset.anchor):null;
      try{ if(x){ x.scrollIntoView({block:'start'}); x.classList.add('hit'); } else window.scrollTo(0,0); }catch(e){}
      break;
    case 'ad-edit': ui.adEdit=id; rerender('ae-text'); break;
    case 'ad-cancel': ui.adEdit=null; rerender(); break;
    case 'ad-save':
      x=db.ad.items.filter(function(i){ return i.id===id; })[0]; if(!x) break;
      var nb=val('ae-brand').trim().slice(0,30), nt=val('ae-text').trim().slice(0,80), nu=val('ae-url').trim();
      if(!nb&&!nt){ toast('Escribí la marca o el mensaje.'); document.getElementById('ae-text').focus(); break; }
      if(nu&&!safeUrl(nu)){ toast('El enlace tiene que empezar con https:// y no llevar espacios.'); document.getElementById('ae-url').focus(); break; }
      x.brand=nb; x.text=nt; x.url=nu; ui.adEdit=null; logAct('editó un mensaje del cartel LED'); save(); rerender(); toast('Mensaje actualizado');
      break;
    case 'v-new': ui.vForm='new'; rerender('v-name'); break;
    case 'v-edit': ui.vForm=id; rerender('v-name'); x=document.getElementById('vform'); if(x){ try{ x.scrollIntoView({block:'start'}); }catch(e){} } break;
    case 'v-cancel': ui.vForm=null; rerender(); break;
    case 'v-del':
      if(ui.confirm!=='vdel'+id){ ui.confirm='vdel'+id; rerender(); break; }
      x=vendor(id); db.offers=db.offers.filter(function(o){ return o.vendorId!==id; }); db.vendors=db.vendors.filter(function(v){ return v.id!==id; });
      ui.confirm=null; ui.vForm=null; logAct('eliminó el proveedor '+(x?x.name:'')); save(); rerender(); toast((x?x.name:'Proveedor')+' eliminado'); break;
    case 'o-new': ui.oForm='new'; rerender('o-cat'); break;
    case 'o-edit': ui.oForm=id; rerender('o-price'); x=document.getElementById('oform'); if(x){ try{ x.scrollIntoView({block:'start'}); }catch(e){} } break;
    case 'o-cancel': ui.oForm=null; rerender(); break;
    case 'o-pause': x=offer(id); if(x){ x.status=x.status==='published'?'paused':'published'; logAct((x.status==='paused'?'pausó ':'publicó ')+x.model+' '+x.size); save(); rerender(); toast(x.status==='paused'?'Producto pausado':'Producto publicado'); } break;
    case 'o-del':
      if(ui.confirm!=='odel'+id){ ui.confirm='odel'+id; rerender(); break; }
      x=offer(id); if(x) logAct('eliminó '+x.model+' '+x.size+' de '+((vendor(x.vendorId)||{}).name||'')); db.offers=db.offers.filter(function(o){ return o.id!==id; }); ui.confirm=null; if(ui.oForm===id) ui.oForm=null; save(); rerender(); toast('Producto eliminado'); break;
    case 'ship': x=order(id); if(x){ x.shipped=true; logAct('marcó enviado el pedido #'+x.id); save(); rerender(); toast('Pedido #'+x.id+' marcado como enviado'); } break;
    case 'c-reset':
      if(ui.confirm!=='c-reset'){ ui.confirm='c-reset'; rerender(); break; }
      db.content={}; ui.confirm=null; logAct('volvió a los textos originales de la portada'); save(); rerender(); toast('Volvieron los textos originales'); break;
    case 'ad-toggle': x=db.ad.items.filter(function(i){ return i.id===id; })[0]; if(x){ x.on=!x.on; logAct((x.on?'activó':'pausó')+' un mensaje del cartel LED'); save(); rerender(); toast(x.on?'Mensaje activado':'Mensaje pausado'); } break;
    case 'ad-del': logAct('quitó un mensaje del cartel LED'); db.ad.items=db.ad.items.filter(function(i){ return i.id!==id; }); save(); rerender(); toast('Mensaje quitado del cartel'); break;
    case 'reset':
      if(ui.confirm!=='reset'){ ui.confirm='reset'; rerender(); }
      else { var keepU=db.users, keepL=db.log; db=seed(); db.users=keepU; db.log=keepL; CATALOG=JSON.parse(JSON.stringify(CATALOG_BASE)); logAct('reinició la demo'); save(); ui.confirm=null; rerender(); toast('Demo reiniciada'); }
      break;
  }
});
document.addEventListener('input',function(ev){
  var t=ev.target;
  if(t.id==='g-q'){ ui.gQ=t.value; var gp=t.selectionStart; rerender('g-q'); var gq=document.getElementById('g-q'); if(gq){ try{ gq.setSelectionRange(gp,gp); }catch(e){} } return; }
  if(t.id==='u-q'){ ui.uQ=t.value; var up=t.selectionStart; rerender('u-q'); var uq=document.getElementById('u-q'); if(uq){ try{ uq.setSelectionRange(up,up); }catch(e){} } return; }
  if(t.id==='buyer-q'){ ui.buyerQ=t.value; var pos=t.selectionStart; rerender('buyer-q'); var e2=document.getElementById('buyer-q'); if(e2){ try{ e2.setSelectionRange(pos,pos); }catch(e){} } }
});
document.addEventListener('submit',function(ev){
  ev.preventDefault();
  if(submitPromotion(ev)) return;
  if(ev.target.id==='alogin'){
    db=load();
    var un=norm(val('a-user')), pw=val('a-pass'), u=db.users.filter(function(x){ return x.user===un; })[0];
    if(!un||!pw){ ui.loginErr='Escribí tu usuario y tu clave.'; }
    else if(!u||u.hash!==pwHash(pw)){ ui.loginErr='El usuario o la clave no coinciden.'; }
    else { ui.loginErr=''; sset(AKEY,u.id); u.last=new Date().toISOString(); logAct('entró al panel'); save(); ui.tab='resumen'; rerender(); toast('Hola, '+u.name); return; }
    var typed=val('a-user'); rerender(); var ue=document.getElementById('a-user'); if(ue) ue.value=typed; var fe=document.getElementById(un?'a-pass':'a-user'); if(fe) fe.focus();
    return;
  }
  if(ev.target.id==='uform'){
    var eu=ui.uForm==='new'?null:db.users.filter(function(x){ return x.id===ui.uForm; })[0];
    var nm=val('u-name').trim().slice(0,30), us=norm(val('u-user')).replace(/\s/g,''), p1=val('u-pass'), p2=val('u-pass2');
    if(!nm) return showErr('u-err','Falta el nombre.','u-name');
    if(!us) return showErr('u-err','Falta el usuario.','u-user');
    if(db.users.some(function(x){ return x!==eu&&x.user===us; })) return showErr('u-err','Ese usuario ya existe.','u-user');
    if((!eu||p1)&&p1.length<6) return showErr('u-err','La clave tiene que tener al menos 6 caracteres.','u-pass');
    if(p1!==p2) return showErr('u-err','Las dos claves no coinciden.','u-pass2');
    if(eu){ eu.name=nm; eu.user=us; if(p1) eu.hash=pwHash(p1); logAct((me()&&me().id===eu.id?'cambió sus datos':'editó al usuario '+nm)+(p1?' y la clave':'')); toast(p1?'Clave cambiada':'Datos guardados'); }
    else { db.users.push({id:'u'+(db.nextId++),name:nm,user:us,hash:pwHash(p1),last:''}); logAct('agregó al usuario '+nm); toast(nm+' ya puede entrar'); }
    ui.uForm=null; save(); rerender(); return;
  }
  if(ev.target.id==='catform'){
    var cc0=ui.catSel==='new'?null:catBy(ui.catSel), cn=val('cat-n').trim().replace(/\s+/g,' ').slice(0,40);
    if(!cn) return showErr('cat-err','Falta el nombre de la categoría.','cat-n');
    if(CATALOG.some(function(c){ return c!==cc0&&norm(c.n)===norm(cn); })) return showErr('cat-err','Ya hay una categoría con ese nombre.','cat-n');
    var cd={c:val('cat-c'),intro:val('cat-intro').trim(),clave:val('cat-clave').trim(),attrs:val('cat-attrs').trim()};
    if(cc0){
      var old=cc0.n;
      if(old!==cn){
        db.offers.forEach(function(o){ if(o.category===old) o.category=cn; });
        if(db.images['cat:'+old]){ db.images['cat:'+cn]=db.images['cat:'+old]; delete db.images['cat:'+old]; }
        db.spaces=JSON.parse(JSON.stringify(spaces())); db.spaces.forEach(function(sp){ sp.cats=sp.cats.map(function(c){ return c===old?cn:c; }); });
      }
      cc0.n=cn; for(var ck in cd) cc0[ck]=cd[ck]; ui.catSel=cn; saveCatalog('editó la categoría '+cn+(old!==cn?' (antes '+old+')':'')); toast('Categoría guardada');
    } else {
      cd.n=cn; cd.m=[]; CATALOG.push(cd); ui.catSel=cn; ui.mEdit='new'; saveCatalog('creó la categoría '+cn); toast('Categoría creada: agregale los modelos');
    }
    rerender(ui.mEdit==='new'?'m-name':null); return;
  }
  if(ev.target.id==='mform'){
    var mc=catBy(ui.catSel); if(!mc) return;
    var idx=ui.mEdit==='new'?null:ui.mEdit, mm=idx==null?null:mc.m[idx];
    var mnm=val('m-name').trim().replace(/\s+/g,' ').slice(0,80), vars=[], mdesc=val('m-desc').trim().slice(0,400);
    val('m-vars').split('\n').forEach(function(x){ x=x.trim().replace(/\s+/g,' '); if(x&&vars.indexOf(x)<0) vars.push(x); });
    if(!mnm) return showErr('m-err','Falta el nombre del modelo.','m-name');
    if(mc.m.some(function(x){ return x!==mm&&norm(x[0])===norm(mnm); })) return showErr('m-err','Ya hay un modelo con ese nombre en esta categoría.','m-name');
    if(!vars.length) return showErr('m-err','Agregá al menos una variante.','m-vars');
    if(mm){
      var gone=mm[1].filter(function(v){ return vars.indexOf(v)<0&&offersOf(mc.n,mm[0],v).length; });
      if(gone.length) return showErr('m-err','No se puede sacar “'+gone.join('”, “')+'”: tiene ofertas cargadas. Primero hay que cambiar o sacar esas ofertas.','m-vars');
      if(mm[0]!==mnm) db.offers.forEach(function(o){ if(o.category===mc.n&&o.model===mm[0]) o.model=mnm; });
      var was=mm[0]; mm[0]=mnm; mm[1]=vars; mm[2]=mdesc; saveCatalog('editó el modelo '+mnm+(was!==mnm?' (antes '+was+')':'')+' en '+mc.n); toast('Modelo guardado');
    } else { mc.m.push([mnm,vars,mdesc]); saveCatalog('agregó el modelo '+mnm+' a '+mc.n); toast('Modelo agregado'); }
    ui.mEdit=null; rerender(); return;
  }
  if(ev.target.id==='spform'){
    var si2=ev.target.getAttribute('data-i'), sn=val('sp-n').trim().slice(0,50), sd=val('sp-d').trim().slice(0,90);
    var cats=[].slice.call(document.querySelectorAll('[data-spcat]')).filter(function(c){ return c.checked; }).map(function(c){ return c.getAttribute('data-spcat'); });
    if(!sn) return showErr('sp-err','Falta el nombre del espacio.','sp-n');
    if(!cats.length) return showErr('sp-err','Elegí al menos una categoría.');
    db.spaces=JSON.parse(JSON.stringify(spaces()));
    if(si2==='new') db.spaces.push({a:'s'+(db.nextId++),n:sn,d:sd,cats:cats}); else { var sp=db.spaces[+si2]; sp.n=sn; sp.d=sd; sp.cats=cats; }
    ui.spEdit=null; logAct((si2==='new'?'agregó':'editó')+' el espacio '+sn); save(); rerender(); toast('Espacio guardado'); return;
  }
  if(ev.target.id==='vform'){
    var editing=ui.vForm!=='new', cur=editing?vendor(ui.vForm):null;
    var name=val('v-name').trim().slice(0,40), cuit=val('v-cuit').replace(/\D/g,''), email=val('v-email').trim();
    if(!name){ showErr('v-err','Falta el nombre de la marca.','v-name'); return; }
    if(db.vendors.some(function(v){ return v!==cur&&norm(v.name)===norm(name); })){ showErr('v-err','Ya hay un proveedor con ese nombre.','v-name'); return; }
    if(cuit&&cuit.length!==11){ showErr('v-err','El CUIT tiene que tener 11 dígitos, o dejalo vacío.','v-cuit'); return; }
    if(email&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ showErr('v-err','Revisá el email: no parece válido.','v-email'); return; }
    var vuser=norm(val('v-user')).replace(/\s/g,''), vpass=val('v-pass');
    if(vuser&&db.vendors.some(function(v){ return v!==cur&&norm(v.user)===vuser; })){ showErr('v-err','Ese usuario ya lo usa otro proveedor.','v-user'); return; }
    if(vpass&&vpass.length<6){ showErr('v-err','La clave tiene que tener al menos 6 caracteres.','v-pass'); return; }
    if(vpass&&!vuser){ showErr('v-err','Poné un usuario para esa clave.','v-user'); return; }
    var data={};
    VFIELDS.forEach(function(g){ g[1].forEach(function(f){ data[f[0]]=val('v-'+f[0]).trim(); }); });
    data.name=name; data.cuit=cuit?cuit.slice(0,2)+'-'+cuit.slice(2,10)+'-'+cuit.slice(10):'';
    data.zones=[].slice.call(document.querySelectorAll('[data-vzone]')).filter(function(c){ return c.checked; }).map(function(c){ return c.getAttribute('data-vzone'); });
    data.user=vuser; if(vpass) data.hash=pwHash(vpass);
    if(cur){ for(var k in data) cur[k]=data[k]; logAct('editó el proveedor '+name+(vpass?' y le cambió la clave':'')); vact(cur,'el administrador editó sus datos'+(vpass?' y su clave':'')); toast('Cambios guardados'); }
    else { data.id='v'+(db.nextId++); data.status=val('v-status')||'active'; data.mp=false; data.commission=null; data.since=today(); data.logins=[]; data.act=[{t:new Date().toISOString(),what:'lo dio de alta el administrador'}]; if(!data.hash) data.hash=''; db.vendors.push(data); logAct('agregó el proveedor '+name); toast(name+' agregado'); }
    ui.vForm=null; save(); rerender();
    return;
  }
  if(ev.target.id==='prefs'){
    var pe=val('pf-email').trim();
    if(pe&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(pe)){ toast('Revisá el email: no parece válido.'); document.getElementById('pf-email').focus(); return; }
    var P={email:pe}; [].slice.call(document.querySelectorAll('[data-pref]')).forEach(function(c){ P[c.getAttribute('data-pref')]=c.checked; });
    db.prefs=P; logAct('cambió los avisos'); save(); rerender(); toast('Avisos guardados'); return;
  }
  if(ev.target.id==='oform'){
    var oe=ui.oForm==='new'?null:offer(ui.oForm);
    var od={category:val('o-cat'),model:val('o-model'),size:val('o-size'),unit:val('o-unit'),brand:val('o-brand').trim().slice(0,40),detail:val('o-detail').trim().slice(0,80),
      price:digits(val('o-price')),stock:val('o-stock'),minQty:1,lead:digits(val('o-lead')),warranty:digits(val('o-warr')),
      shipAmba:digits(val('o-amba')),shipInt:digits(val('o-int')),status:val('o-status'),updated:today(),
      units:val('o-units').trim()===''?null:digits(val('o-units')),lowAt:val('o-low').trim()===''?null:digits(val('o-low'))};
    try{ od.volumeTiers=readVolume(); }catch(err){ showErr('o-err',err.message,'vol-q-0'); return; }
    if(od.units===0&&od.stock==='stock') od.stock='none'; else if(od.units>0&&od.stock==='none') od.stock='stock';
    var mm=modelBy(od.category,od.model);
    if(!mm||mm[1].indexOf(od.size)<0){ showErr('o-err','Elegí el modelo y la variante del catálogo.','o-model'); return; }
    if(od.price<=0){ showErr('o-err','El precio tiene que ser mayor a cero.','o-price'); return; }
    if(oe){ for(var k2 in od) oe[k2]=od[k2]; logAct('editó '+od.model+' '+od.size+' de '+((vendor(oe.vendorId)||{}).name||'')); toast('Producto actualizado'); }
    else { od.id='o'+(db.nextId++); od.vendorId=ui.stockVendor; db.offers.push(od); logAct('agregó '+od.model+' '+od.size+' a '+((vendor(ui.stockVendor)||{}).name||'')); vnotify(ui.stockVendor,'product','productos','Sumamos '+od.model+' '+od.size+' a tu catálogo a '+money(od.price)+'. Revisá que el precio y el stock estén bien.',od.id); toast('Producto agregado'); }
    ui.oForm=null; save(); rerender();
    return;
  }
  if(ev.target.id==='cform'){
    var cc={};
    CONTENT_FIELDS.forEach(function(g){ g[1].forEach(function(f){ var v=val('ct-'+f[0]).trim(); if(v&&v!==CONTENT_DEFAULT[f[0]]) cc[f[0]]=v.slice(0,f[2]?400:90); }); });
    db.content=cc; logAct('editó los textos de la portada'); save(); rerender(); toast('Textos guardados');
    return;
  }
  if(ev.target.id==='waform'){
    var num=val('wa-num').replace(/\D/g,'');
    if(num&&(num.length<10||num.length>15)){ var wb=document.getElementById('wa-err'); wb.textContent='El número tiene que tener entre 10 y 15 dígitos, con el código de país.'; wb.hidden=false; document.getElementById('wa-num').focus(); return; }
    db.contact={wa:num}; logAct('cambió el WhatsApp de contacto'); save(); rerender(); toast(num?'WhatsApp guardado':'WhatsApp sin número');
    return;
  }
  if(ev.target.id==='adform'){
    var brand=val('ad-brand').trim().slice(0,30), text=val('ad-text').trim().slice(0,80), url=val('ad-url').trim();
    var aerr=(!brand&&!text)?'Escribí la marca o el mensaje.':((url&&!safeUrl(url))?'El enlace tiene que empezar con https:// y no llevar espacios.':((db.ad.items||[]).length>=8?'El cartel admite hasta 8 mensajes. Quitá uno para agregar otro.':''));
    if(aerr){ var box=document.getElementById('ad-err'); box.textContent=aerr; box.hidden=false; document.getElementById((!brand&&!text)?'ad-brand':'ad-url').focus(); return; }
    db.ad.items=(db.ad.items||[]).concat([{id:'a'+(db.nextId++),brand:brand,text:text,url:url,on:true,where:val('ad-where')||'all'}]);
    logAct('agregó un mensaje al cartel LED'); save(); rerender(); toast('Mensaje agregado al cartel');
  } else if(ev.target.id==='config'){ var p=Math.min(100,Math.max(0,digits(val('g-pct')))); logAct('cambió la comisión general de '+db.commission+'% a '+p+'%'); db.commission=p; save(); rerender(); toast('Comisión general: '+p+'%'); }
});
document.addEventListener('change',function(ev){
  var t=ev.target;
  if(t.id==='o-cat'||t.id==='o-model'){
    var ms=document.getElementById('o-model'), ss=document.getElementById('o-size');
    if(t.id==='o-cat') ms.innerHTML=optModels(t.value,null);
    ss.innerHTML=optSizes(val('o-cat'),ms.value,null);
    return;
  }
  if(t.id==='s-vendor'){ ui.salesVendor=t.value; rerender(t.id); }
  else if(t.id==='s-month'){ ui.salesMonth=t.value; rerender(t.id); }
  else if(t.id==='s-status'){ ui.salesStatus=t.value; rerender(t.id); }
  else if(t.id==='sum-month'){ ui.sumMonth=t.value; rerender(t.id); }
  else if(t.id==='u-sort'){ ui.uSort=t.value; rerender(t.id); }
  else if(t.id==='com-month'){ ui.comMonth=t.value; rerender(t.id); }
  else if(t.dataset&&t.dataset.img){
    var key=t.dataset.img, f=t.files&&t.files[0];
    readImage(f,function(data){
      var prev=db.images[key]; db.images[key]=data;
      if(!save()){ if(prev) db.images[key]=prev; else delete db.images[key]; toast('No entra más espacio para fotos en esta demo. Quitá alguna o usá una más chica.'); return; }
      logAct('subió una foto para '+key.split(':').slice(1).join(':')); save(); rerender(); toast('Foto guardada: ya se ve en el sitio');
    });
  }
  else if(t.id==='st-range'){ ui.statRange=t.value; rerender(t.id); }
  else if(t.id==='demo-traffic'){ db.traffic.demo=t.checked; logAct((t.checked?'prendió':'apagó')+' las visitas de ejemplo'); save(); rerender(t.id); toast(t.checked?'Se muestran visitas de ejemplo':'Solo visitas reales'); }
  else if(t.dataset&&t.dataset.where){ var it=(db.ad.items||[]).filter(function(i){ return i.id===t.dataset.where; })[0]; if(it){ it.where=t.value; logAct('cambió dónde se muestra un mensaje del cartel'); save(); rerender(); toast('Ahora se muestra en: '+adWhere(it.where).toLowerCase()); } }
  else if(t.id==='ad-on'){ db.ad.on=t.checked; logAct((t.checked?'prendió':'apagó')+' el cartel LED'); save(); rerender(t.id); toast(db.ad.on?'Cartel encendido':'Cartel apagado'); }
  else if(t.dataset&&t.dataset.vc){
    var v=vendor(t.dataset.vc); if(!v) return;
    v.commission=t.value===''?null:Math.min(100,Math.max(0,digits(t.value))); logAct('cambió la comisión de '+v.name+' a '+pctOf(v)+'%'); vnotify(v.id,'account','mp','Tu comisión ahora es del '+pctOf(v)+'% de los productos. Se aplica a las próximas ventas.');
    save(); rerender(t.id); toast('Comisión de '+v.name+': '+pctOf(v)+'%');
  }
});
render();
})();

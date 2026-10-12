
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
      v.paymentBenefits.single=0;
      v.freeShipping={mode:'from',zone:'amba',threshold:50000,postalCodes:[]};v.benefitsPolicy20261008=true;
    }
  });
  d.vendors.forEach(function(v){
    var old=v.paymentBenefits||{};
    v.paymentBenefits={single:Number(old.single)||0,transfer:Number(old.transfer)||0,cash:Number(old.cash)||0,installments:old.installments||[],stackVolume:old.stackVolume!==false};
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
  return '<form id="promotion-form" data-vendor="'+esc(v.id)+'" class="card" novalidate style="margin-top:20px"><h2 class="display h-card">Envío gratis y beneficios</h2><div id="promo-err" class="alert bad" hidden role="alert"></div><p class="note">La página no tiene mínimo de compra. El proveedor decide si ofrece envío gratis y asume su costo. Los descuentos por volumen se configuran al editar cada producto.</p><div class="formgrid"><div class="field"><label for="promo-mode">¿Ofrecés envío gratis?</label><select id="promo-mode">'+options([['none','No ofrezco envío gratis'],['always','Sí, sin importe mínimo'],['from','Sí, desde un importe']],f.mode)+'</select></div><div class="field"><label for="promo-zone">¿Dónde ofrecés envío gratis?</label><select id="promo-zone"'+(f.mode==='none'?' disabled':'')+'>'+options([['all','Todo el país'],['amba','Solo CABA y alrededores']],f.zone)+'</select></div><div class="field"><label for="promo-threshold">Importe para envío gratis ($)</label><input id="promo-threshold"'+(f.mode==='from'?'':' disabled')+' type="number" min="0" step="0.01" value="'+(f.threshold||'')+'"><span class="hint">Solo para “Sí, desde un importe”. Suma los productos de este proveedor después de los descuentos, sin incluir envío.</span></div><div class="field"><label for="promo-postal">Códigos postales cubiertos</label><input id="promo-postal"'+(f.mode!=='none'&&f.zone==='amba'?'':' disabled')+' type="text" placeholder="1425, 1602, 1636" value="'+esc((f.postalCodes||[]).join(', '))+'"><span class="hint">Para limitar la cobertura exacta, cargá los códigos de 4 dígitos separados por comas. Obligatorios para la promoción en CABA y alrededores. Sin cobertura exacta cargada, no se aplica el beneficio.</span></div></div>'+paymentFields(v)+'<p class="note">Comisión del sitio: '+pctOf(v)+'% sobre los productos ya descontados. El envío cobrado se acredita al proveedor. Los costos del cobro se calculan aparte en la integración real.</p><button class="btn btn-accent" type="submit">Guardar beneficios</button></form>';
}
function submitPromotion(ev){
  if(ev.target.id!=='promotion-form') return false;
  ev.preventDefault(); var v=vendor(ev.target.getAttribute('data-vendor'));
  if(!v||!me()||(typeof AKEY==='undefined'&&me().id!==v.id)) return true;
  var mode=val('promo-mode'),z=val('promo-zone'),th=mode==='from'?Number(val('promo-threshold')):0;
  if(['none','always','from'].indexOf(mode)<0||['all','amba','interior'].indexOf(z)<0||!Number.isFinite(th)||th<0||(mode==='from'&&th<=0)){
    var b=document.getElementById('promo-err'); b.textContent='Indicá un importe mayor a cero para ofrecer envío gratis desde un monto.'; b.hidden=false; return true;
  }
  var benefits,codes=mode!=='none'&&z==='amba'&&val('promo-postal').trim()?val('promo-postal').split(',').map(function(x){return x.trim();}):[];
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
 if(f.zone==='amba'&&zone(cp)==='amba'&&!(f.postalCodes||[]).length)return '<div class="alert warn small">'+title+' La cobertura de este código postal está pendiente de confirmación. El envío gratis no se aplica hasta que el proveedor cargue la zona exacta.</div>';
 if(!shippingZoneEligible(f,cp))return '<div class="alert warn small">'+title+' Tu código postal '+esc(cp)+' está fuera de la cobertura del beneficio: el envío no es gratis y se suma al total.</div>';
 if(f.mode==='from'&&sub<f.threshold)return '<p class="note">'+title+' Te faltan '+money(amount(f.threshold-sub))+' en productos para alcanzarlo.</p>';
 return '<div class="alert ok small">Envío gratis aplicado para tu código postal '+esc(cp)+'.</div>';
}
function shippingZoneEligible(f,cp){
 if(!cpOk(cp))return false;
 var codes=f.postalCodes||[];
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

/* ---------- Novedades del proveedor ---------- */
var VNK={sale:['bag','Venta'],stock:['productos','Stock'],product:['productos','Producto'],account:['vendedores','Cuenta'],late:['alert','Demora'],price:['alert','Precio']};
function vUnread(v,tab){ return (v.notifs||[]).filter(function(n){ return !n.read&&(!tab||n.tab===tab); }).length; }
function vMarkRead(v,tab){ var ch=false; (v.notifs||[]).forEach(function(n){ if(!n.read&&(!tab||n.tab===tab)){ n.read=true; ch=true; } }); if(ch) save(); }
function agoV(iso){ var s=(Date.now()-new Date(iso).getTime())/1000; if(isNaN(s)) return ''; if(s<60) return 'recién'; if(s<3600) return 'hace '+Math.floor(s/60)+' min'; if(s<86400) return 'hace '+Math.floor(s/3600)+' h'; var d=Math.floor(s/86400); return d===1?'ayer':(d<30?'hace '+d+' días':fdate(String(iso).slice(0,10))); }
function checkLateV(v){
  var ch=false;
  db.orders.forEach(function(o){ if(o.vendorId===v.id&&!o.lateV&&lateDays(o)>0){ vnotify(v.id,'late','ventas','El pedido #'+o.id+' está demorado: ya pasó tu plazo de entrega. Cargá el envío o avisale al comprador.',o.id); o.lateV=true; ch=true; } });
  if(ch) save();
}
function vBell(v){
  var N=(v.notifs||[]).slice(0,40);
  return '<div class="bellp card"><div class="ch"><span class="ic">'+ico('bell')+'</span><div class="ch-t"><h2 class="display h-card">Novedades</h2><p class="muted small">Ventas nuevas, aprobaciones, stock y demoras.'+(v.email?' En el sitio real también te llegan a '+esc(v.email)+'.':'')+'</p></div>'
    +(vUnread(v)?'<button class="btn btn-outline btn-sm" data-act="vn-readall">Marcar todo como leído</button>':'')+'<button class="btn btn-outline btn-sm" data-act="vbell">Cerrar</button></div>'
    +(N.length?'<ol class="nlist">'+N.map(function(n){ var k=VNK[n.kind]||['bell','Aviso'];
      return '<li class="'+(n.read?'':'new')+'"><button type="button" data-act="vn-go" data-id="'+n.id+'"><span class="ic sm k-'+n.kind+'">'+ico(k[0],18)+'</span><span class="n-b"><span class="n-t">'+esc(n.text)+'</span><span class="muted small">'+k[1]+' · '+agoV(n.t)+'</span></span>'+(n.read?'':'<span class="n-dot" aria-label="Sin leer"></span>')+'</button></li>'; }).join('')+'</ol>'
      :'<div class="empty">Todavía no hay novedades. Cuando vendas, te aprueben un producto o te quede poco stock, aparece acá.</div>')+'</div>';
}

/* ---------- Envíos ---------- */
var SALE_F=[['all','Todas'],['paid','Por preparar'],['shipped','Enviadas'],['delivered','Entregadas'],['refunded','Devueltas']];
function ordersView(v,sales){
  var f=ui.sf||'all', cnt=function(k){ return k==='all'?sales.length:sales.filter(function(o){ return shipStage(o)===k; }).length; };
  var rows=f==='all'?sales:sales.filter(function(o){ return shipStage(o)===f; });
  return '<div class="seg" role="group" aria-label="Filtrar ventas">'+SALE_F.map(function(x){ var n=cnt(x[0]); return '<button type="button" data-act="sale-f" data-f="'+x[0]+'" aria-pressed="'+(f===x[0])+'">'+x[1]+' · '+n+'</button>'; }).join('')+'</div>'
    +(rows.length?'<div class="tablewrap"><table style="min-width:980px"><thead><tr><th>Venta</th><th>Comprador</th><th>Detalle</th><th class="r">Total</th><th class="r">Recibís</th><th>Estado</th><th></th></tr></thead><tbody>'
    +rows.map(function(o){
      var ref=o.status==='refunded', open=ui.orderOpen===o.id, st=shipStage(o);
      return '<tr'+(open?' class="editing"':'')+'><td><b>#'+o.id+'</b><span class="sub">'+fdate(o.date)+'</span></td><td>'+esc(o.buyer)+'<span class="sub">'+esc((o.ship||{}).city||'')+'</span></td><td>'+esc(o.desc.split(': ').slice(1).join(': ')||o.desc)+' × '+o.qty+'</td>'
        +'<td class="r num">'+money(o.subtotal+o.shipping)+'</td><td class="r num"><b>'+(ref?'—':money(net(o)))+'</b></td><td>'+orderStatus(o)+(o.tracking?'<span class="sub mono">'+esc(o.tracking)+'</span>':'')+'</td>'
        +'<td><div class="actions nw" style="justify-content:flex-end"><button class="btn '+(st==='paid'&&!open?'btn-primary':'btn-outline')+' btn-sm" data-act="order-open" data-id="'+o.id+'" aria-expanded="'+open+'">'+(open?'Cerrar':(st==='paid'?'Cargar envío':'Ver pedido'))+'</button></div></td></tr>'
        +(open?'<tr class="detail"><td colspan="7">'+orderDetail(o)+'</td></tr>':'');
    }).join('')+'</tbody></table></div>':'<div class="empty">No hay ventas en este estado.</div>');
}
function orderDetail(o){
  var s=o.ship||{}, st=shipStage(o), ref=st==='refunded';
  var addr=[s.address,s.city,s.prov,s.cp?'CP '+s.cp:''].filter(Boolean).join(', ');
  var copy=[s.name||o.buyer,addr,s.phone?'Tel. '+s.phone:'',s.notes].filter(Boolean).join(' · ');
  return '<div class="odet"><div class="odet-col"><p class="eyebrow">Entrega</p><dl class="dl">'
    +'<div><dt>Recibe</dt><dd>'+esc(s.name||o.buyer)+'</dd></div><div><dt>Teléfono</dt><dd>'+esc(s.phone||'—')+'</dd></div><div><dt>Email</dt><dd>'+esc(s.email||'—')+'</dd></div>'
    +'<div style="grid-column:1 / -1"><dt>Dirección</dt><dd>'+esc(addr||'—')+'</dd></div>'+(s.notes?'<div style="grid-column:1 / -1"><dt>Indicaciones</dt><dd>'+esc(s.notes)+'</dd></div>':'')+'</dl>'
    +'<div class="actions"><button class="btn btn-outline btn-sm" data-act="copy-addr" data-text="'+esc(copy)+'">'+ico('copy',18)+'Copiar datos para la etiqueta</button></div></div>'
    +'<div class="odet-col"><p class="eyebrow">Envío</p>'
    +(ref?'<p class="muted">Pedido devuelto.</p>'
      :(st==='paid'?'<form id="shipform" data-id="'+o.id+'" class="shipform" novalidate><div id="sh-err" class="alert bad" role="alert" hidden></div><div class="formgrid">'
        +'<div class="field"><label for="sh-car">Transporte</label><select id="sh-car">'+CARRIERS.map(function(c){ return '<option>'+esc(c)+'</option>'; }).join('')+'</select></div>'
        +'<div class="field"><label for="sh-num">Número de seguimiento</label><input id="sh-num" type="text" maxlength="40" autocomplete="off"><span class="hint">No hace falta si es retiro o transporte propio.</span></div>'
        +'<div class="field" style="grid-column:1 / -1"><label for="sh-url">Link de seguimiento (opcional)</label><input id="sh-url" type="url" placeholder="https://"></div></div>'
        +'<div class="actions"><button class="btn btn-primary" type="submit">'+ico('truck',18)+'Marcar como enviado</button></div>'
        +'<p class="note">Al marcarlo, le llega un email al comprador con el transporte y el número para seguirlo.</p></form>'
      :'<div class="rows"><div><span class="muted">Transporte</span><b>'+esc(o.carrier||'—')+'</b></div><div><span class="muted">Seguimiento</span><b class="mono">'+esc(o.tracking||'—')+'</b></div><div><span class="muted">Enviado</span><b>'+(o.shippedAt?fdate(o.shippedAt):'—')+'</b></div>'+(o.delivered?'<div><span class="muted">Entregado</span><b>'+(o.deliveredAt?fdate(o.deliveredAt):'Sí')+'</b></div>':'')+'</div>'
        +(o.delivered?'':'<div class="actions"><button class="btn btn-primary btn-sm" data-act="deliver" data-id="'+o.id+'">'+ico('check',18)+'Marcar como entregado</button></div>')))
    +(ref?'':'<div class="actions" style="margin-top:8px"><button class="btn '+(ui.confirm==='r'+o.id?'btn-danger':'btn-outline')+' btn-sm" data-act="refund" data-id="'+o.id+'">'+(ui.confirm==='r'+o.id?'Confirmar devolución':'Registrar devolución')+'</button></div>')
    +'</div></div>';
}

/* ---------- Productos: filtros, edición en masa y planilla ---------- */
var PF_DEF={q:'',cat:'',st:'',stock:'',sort:'name'};
var QUICK=[['all','Todos',{}],['low','Bajo stock',{stock:'low'}],['none','Sin stock',{stock:'none'}],['review','En revisión',{st:'review'}]];
function pfActive(){ var f=ui.pf; return f.q||f.cat||f.st||f.stock||f.sort!=='name'; }
function pfApply(list){
  var f=ui.pf, q=plain(f.q);
  var out=list.filter(function(o){
    if(q&&plain([o.category,o.model,o.size,o.brand,o.detail].join(' ')).indexOf(q)<0) return false;
    if(f.cat&&o.category!==f.cat) return false;
    if(f.st&&o.status!==f.st) return false;
    if(f.stock){ var s=stockState(o); if(f.stock==='with'?(s!=='ok'&&s!=='low'):s!==f.stock) return false; }
    return true;
  });
  var by={name:function(a,b){ return (a.model+a.size).localeCompare(b.model+b.size,'es'); },pup:function(a,b){ return a.price-b.price; },pdown:function(a,b){ return b.price-a.price; },
    uup:function(a,b){ return (a.units==null?1e9:a.units)-(b.units==null?1e9:b.units); },upd:function(a,b){ return String(a.updated||'').localeCompare(String(b.updated||'')); }}[f.sort]||null;
  return by?out.sort(by):out;
}
function sameF(a,b){ return ['q','cat','st','stock','sort'].every(function(k){ return String(a[k]||'')===String(b[k]||PF_DEF[k]||''); }); }
function filterBar(v,mine){
  var cats=[]; mine.forEach(function(o){ if(cats.indexOf(o.category)<0) cats.push(o.category); }); cats.sort();
  var f=ui.pf, s=function(id,opts,cur,lab){ return '<div class="field"><label for="'+id+'">'+lab+'</label><select id="'+id+'" data-pf="'+id.slice(3)+'">'+opts.map(function(o){ return '<option value="'+esc(o[0])+'"'+(o[0]===cur?' selected':'')+'>'+esc(o[1])+'</option>'; }).join('')+'</select></div>'; };
  var chips=QUICK.map(function(x){ var fx={}; for(var k in PF_DEF) fx[k]=PF_DEF[k]; for(var k2 in x[2]) fx[k2]=x[2][k2];
      return '<button type="button" class="chipbtn" data-act="pf-quick" data-q="'+x[0]+'" aria-pressed="'+sameF(f,fx)+'">'+x[1]+'</button>'; }).join('')
    +(v.views||[]).map(function(w,i){ return '<span class="chipbtn saved'+(sameF(f,w.f)?' on':'')+'"><button type="button" data-act="pf-view" data-i="'+i+'">'+ico('filter',16)+esc(w.name)+'</button><button type="button" class="x" data-act="pf-del" data-i="'+i+'" aria-label="Borrar el filtro '+esc(w.name)+'">×</button></span>'; }).join('');
  return '<div class="filterbox"><div class="chips2" role="group" aria-label="Filtros rápidos y guardados">'+chips+'</div>'
    +'<div class="filters fl5"><div class="field grow"><label for="pf-q">Buscar</label><input id="pf-q" type="search" placeholder="Modelo, variante, marca…" value="'+esc(f.q)+'"></div>'
    +s('pf-cat',[['','Todas']].concat(cats.map(function(c){ return [c,c]; })),f.cat,'Categoría')
    +s('pf-st',[['','Todos'],['published','Publicado'],['review','En revisión'],['paused','Pausado'],['rejected','Rechazado']],f.st,'Estado')
    +s('pf-stock',[['','Todos'],['with','Con stock'],['low','Bajo stock'],['none','Sin stock'],['order','A pedido']],f.stock,'Stock')
    +s('pf-sort',[['name','Nombre'],['pup','Precio: menor a mayor'],['pdown','Precio: mayor a menor'],['uup','Menos unidades primero'],['upd','Precio más viejo primero']],f.sort,'Ordenar por')+'</div>'
    +(ui.saveView?'<form id="viewform" class="inline-save" novalidate><label for="vw-name">Nombre del filtro</label><input id="vw-name" type="text" maxlength="24" placeholder="Por ejemplo: Mancuernas sin stock"><button class="btn btn-primary btn-sm" type="submit">Guardar</button><button class="btn btn-outline btn-sm" type="button" data-act="pf-save-cancel">Cancelar</button></form>'
      :(pfActive()?'<div class="actions"><button class="btn btn-outline btn-sm" data-act="pf-save">'+ico('filter',18)+'Guardar este filtro</button><button class="btn btn-outline btn-sm" data-act="pf-clear">Limpiar</button></div>':''))
    +'</div>';
}
function productsView(v,mine,low,out){
  var shown=pfApply(mine);
  var head='<div class="section-head" style="margin:0"><p class="note">Desde acá cambiás precios y stock. Para sumar un producto nuevo o cambiar sus datos, escribinos y lo cargamos.</p><div class="actions">'
    +'<button class="btn btn-outline" data-act="sheet" aria-expanded="'+!!ui.sheet+'">'+ico('upload',18)+'Planilla</button>'
    +'<button class="btn '+(ui.bulk?'btn-primary':'btn-outline')+'" data-act="bulk">'+ico('edit',18)+(ui.bulk?'Salir de la edición':'Editar precios y stock')+'</button>'
    +waCta('Pedir un producto nuevo','btn btn-accent','Hola, soy '+v.name+' y quiero sumar un producto nuevo al sitio')+'</div></div>';
  var lowdef='<div class="field lowdef"><label for="low-def">Avisarme con bajo stock cuando queden</label><div class="inline"><input id="low-def" type="number" min="0" inputmode="numeric" value="'+(v.lowAt!=null?v.lowAt:10)+'"><span>unidades o menos</span></div></div>';
  var table;
  if(!mine.length) table='<div class="empty">Todavía no tenés productos publicados. Pasanos tu catálogo y lo cargamos.</div>';
  else if(!shown.length) table='<div class="empty">Ningún producto coincide con el filtro. <button class="linkbtn" data-act="pf-clear">Ver todos</button></div>';
  else if(ui.bulk) table=bulkTable(shown);
  else table='<p class="muted small">Mostrando '+shown.length+' de '+mine.length+'. Las unidades se descuentan solas con cada venta; si llegan a cero, el producto deja de mostrarse hasta que repongas.</p>'
    +'<div class="tablewrap"><table style="min-width:860px"><thead><tr><th>Producto</th><th class="r">Precio</th><th>Unidades y stock</th><th>Estado</th><th></th></tr></thead><tbody>'
    +shown.map(function(o){
      return '<tr><td><b>'+esc(o.model)+'</b> · '+esc(o.size)+'<span class="sub">'+esc(o.category)+' · '+perUnit(o.unit)+' · entrega '+days(o.lead)+(o.brand?' · Marca: '+esc(o.brand):'')+(o.detail?' · '+esc(o.detail):'')+'</span></td><td class="r num">'+money(o.price)+(priceBadge(o)?'<span class="sub">'+priceBadge(o)+'</span>':'')+'</td><td><div class="ustack"><label class="sr" for="un-'+o.id+'">Unidades de '+esc(o.model+' '+o.size)+'</label><input class="cell-in units" id="un-'+o.id+'" data-units="'+o.id+'" type="number" min="0" inputmode="numeric" placeholder="—" value="'+(o.units==null?'':o.units)+'">'+stockBadge(o)+'</div></td><td>'+offerStatus(o)+'</td>'
        +'<td><div class="actions nw" style="justify-content:flex-end"><button class="btn btn-outline btn-sm" data-act="prod-edit" data-id="'+o.id+'">Precio y stock</button>'+(o.status==='published'?'<button class="btn btn-primary btn-sm" data-act="paylink" data-id="'+o.id+'">Link de pago</button>':'')+'</div></td></tr>';
    }).join('')+'</tbody></table></div>';
  return head+linkBox()+(ui.sheet?sheetPanel(v,mine):'')+filterBar(v,mine)+'<div class="stockbar">'+lowdef+'</div>'+table;
}
function bulkTable(list){
  var vals=ui.bulkVals||{}, odd=ui.bulkOdd||[];
  return '<form id="bulkform" class="card" novalidate>'
    +'<div class="ch"><span class="ic">'+ico('edit')+'</span><div class="ch-t"><h2 class="display h-card">Editar precios y stock</h2><p class="muted small">Cambiá lo que quieras y guardá todo junto. Se editan los '+list.length+' productos que estás viendo con el filtro.</p></div></div>'
    +'<div class="pctbar"><label for="bulk-pct">Aumentar o bajar todos los precios</label><div class="inline"><input id="bulk-pct" type="text" inputmode="decimal" placeholder="Ej.: 8 o -5"><span>%</span><button type="button" class="btn btn-outline btn-sm" data-act="bulk-pct">Aplicar a la lista</button></div><span class="hint">Cambia los precios de abajo; todavía no se guarda.</span></div>'
    +(odd.length?'<div class="alert warnbox" role="alert"><b>Revisá estos precios</b>'+odd.map(function(x){ return '<span>• '+esc(x.name)+': '+money(x.price)+'. '+esc(x.text)+'</span>'; }).join('')
      +'<label class="check"><input id="bulk-ok" type="checkbox"> Sí, estos precios están bien</label><span class="small">Los que confirmes pasan por revisión antes de mostrarse.</span></div>':'')
    +'<div class="tablewrap flat"><table style="min-width:760px"><thead><tr><th>Producto</th><th class="r">Precio actual</th><th>Precio nuevo</th><th>Unidades</th></tr></thead><tbody>'
    +list.map(function(o){ var val0=vals[o.id]||{}, p=val0.p!=null?val0.p:o.price, u=val0.u!==undefined?val0.u:o.units, isOdd=odd.some(function(x){ return x.id===o.id; });
      return '<tr'+(isOdd?' class="oddrow"':'')+'><td><b>'+esc(o.model)+'</b> · '+esc(o.size)+'<span class="sub">'+esc(o.category)+' · '+perUnit(o.unit)+'</span></td><td class="r num">'+money(o.price)+'</td>'
        +'<td><label class="sr" for="bp-'+o.id+'">Precio nuevo de '+esc(o.model+' '+o.size)+'</label><input class="cell-in" id="bp-'+o.id+'" data-bp="'+o.id+'" type="text" inputmode="numeric" value="'+Math.round(p).toLocaleString('es-AR')+'"></td>'
        +'<td><label class="sr" for="bu-'+o.id+'">Unidades de '+esc(o.model+' '+o.size)+'</label><input class="cell-in units" id="bu-'+o.id+'" data-bu="'+o.id+'" type="number" min="0" inputmode="numeric" placeholder="—" value="'+(u==null?'':u)+'"></td></tr>'; }).join('')
    +'</tbody></table></div><div class="actions"><button class="btn btn-primary" type="submit">Guardar todos los cambios</button><button class="btn btn-outline" type="button" data-act="bulk">Cancelar</button></div></form>';
}
/* Planilla: se baja, se edita en Excel y se vuelve a subir. */
var SHEET_HEAD=['Código','Categoría','Modelo','Variante','Se vende por','Precio','Unidades'];
function sheetRows(mine){ return [SHEET_HEAD].concat(mine.map(function(o){ return [o.id,o.category,o.model,o.size,o.unit,o.price,o.units==null?'':o.units]; })); }
function sheetPanel(v,mine){
  var I=ui.imp;
  return '<div class="card">'+'<div class="ch"><span class="ic">'+ico('upload')+'</span><div class="ch-t"><h2 class="display h-card">Actualizar con una planilla</h2><p class="muted small">1) Bajá la planilla con todos tus productos. 2) Cambiá precios y unidades en Excel. 3) Subila o pegá las filas acá. Antes de guardar te mostramos qué cambia.</p></div></div>'
    +'<div class="actions"><button class="btn btn-outline btn-sm" data-act="sheet-dl">'+ico('download',18)+'Descargar planilla</button><button class="btn btn-outline btn-sm" data-act="sheet-copy">'+ico('copy',18)+'Copiar para pegar en Excel</button>'
    +'<label class="btn btn-outline btn-sm filebtn">'+ico('upload',18)+'Subir planilla<input id="sheet-file" type="file" accept=".csv,.txt,.tsv,text/csv,text/plain" class="sr"></label></div>'
    +'<div class="field"><label for="sheet-paste">O pegá acá las filas copiadas de Excel</label><textarea id="sheet-paste" rows="4" placeholder="Código	Categoría	Modelo	Variante	Se vende por	Precio	Unidades"></textarea><span class="hint">No cambies la columna Código: es la que identifica cada producto. Unidades vacía = no cambia; un guion (-) = dejar de contar.</span></div>'
    +'<div class="actions"><button class="btn btn-primary btn-sm" data-act="sheet-read">Revisar cambios</button></div>'
    +(I?importPreview(I):'')+'</div>';
}
function parseNum(s){ return CF.parseNumber(s); }
function parseSheet(text){
  var lines=String(text||'').replace(/^﻿/,'').split(/\r?\n/).filter(function(l){ return l.trim(); }); if(!lines.length) return {rows:[],errors:['La planilla está vacía.']};
  var sep=lines[0].indexOf('\t')>=0?'\t':(lines[0].split(';').length>=lines[0].split(',').length?';':',');
  var split=function(l){ var out=[],cur='',q=false; for(var i=0;i<l.length;i++){ var c=l[i]; if(c==='"'){ if(q&&l[i+1]==='"'){ cur+='"'; i++; } else q=!q; } else if(c===sep&&!q){ out.push(cur); cur=''; } else cur+=c; } out.push(cur); return out.map(function(x){ return x.trim(); }); };
  var head=split(lines[0]).map(plain), ic=head.findIndex(function(h){ return h.indexOf('codigo')===0; }), ip=head.indexOf('precio'), iu=head.indexOf('unidades'), start=1;
  if(ic<0){ ic=0; ip=5; iu=6; start=0; }
  var rows=[], errors=[], me0=me();
  lines.slice(start).forEach(function(l,k){
    var c=split(l), id=c[ic], o=offer(id), n=k+start+1;
    if(!o||o.vendorId!==me0.id){ errors.push('Fila '+n+': no encontramos el código “'+(id||'')+'” entre tus productos.'); return; }
    var p=ip>=0?parseNum(c[ip]):null, ur=iu>=0?String(c[iu]==null?'':c[iu]).trim():'', u;
    if(p!=null&&(isNaN(p)||p<=0)){ errors.push('Fila '+n+' ('+o.model+' '+o.size+'): el precio “'+c[ip]+'” no es válido.'); return; }
    if(ur==='') u=undefined; else if(ur==='-') u=null; else { u=parseNum(ur); if(!Number.isInteger(u)||u<0){ errors.push('Fila '+n+' ('+o.model+' '+o.size+'): las unidades “'+ur+'” no son válidas.'); return; } }
    var np=p==null?o.price:p, ch=np!==o.price||(u!==undefined&&u!==o.units);
    if(ch) rows.push({id:o.id,name:o.model+' '+o.size,op:o.price,np:np,ou:o.units,nu:u===undefined?o.units:u,odd:np!==o.price?priceCheck({category:o.category,model:o.model,size:o.size,unit:o.unit,price:np},o.id,o.vendorId,o.price):null});
  });
  return {rows:rows,errors:errors};
}
function importPreview(I){
  var odd=I.rows.filter(function(r){ return r.odd; });
  return '<div class="imp">'+(I.errors.length?'<div class="alert bad" role="alert">'+I.errors.slice(0,8).map(esc).join('<br>')+(I.errors.length>8?'<br>Y '+(I.errors.length-8)+' más.':'')+'</div>':'')
    +(I.rows.length?'<p class="sumline"><b>'+I.rows.length+(I.rows.length===1?' producto cambia':' productos cambian')+'</b></p><div class="tablewrap flat"><table style="min-width:640px"><thead><tr><th>Producto</th><th class="r">Precio</th><th class="r">Unidades</th></tr></thead><tbody>'
      +I.rows.map(function(r){ return '<tr'+(r.odd?' class="oddrow"':'')+'><td><b>'+esc(r.name)+'</b>'+(r.odd?'<span class="sub">'+esc(r.odd.text)+'</span>':'')+'</td><td class="r num">'+(r.np!==r.op?'<s class="muted">'+money(r.op)+'</s> → <b>'+money(r.np)+'</b>':money(r.op))+'</td><td class="r num">'+(r.nu!==r.ou?'<s class="muted">'+(r.ou==null?'—':r.ou)+'</s> → <b>'+(r.nu==null?'sin contar':r.nu)+'</b>':(r.ou==null?'—':r.ou))+'</td></tr>'; }).join('')+'</tbody></table></div>'
      +(odd.length?'<label class="check"><input id="imp-ok" type="checkbox"> Revisé los '+odd.length+' precios marcados y están bien</label>':'')
      +'<div class="actions"><button class="btn btn-primary" data-act="imp-apply">Aplicar '+I.rows.length+(I.rows.length===1?' cambio':' cambios')+'</button><button class="btn btn-outline" data-act="imp-cancel">Descartar</button></div>'
      :(I.errors.length?'':'<div class="empty">La planilla no tiene cambios.</div>'))+'</div>';
}
/* Guarda un precio y unas unidades nuevas; si el precio es raro, vuelve a revisión y avisa. */
function applyPU(o,np,nu,odd){
  var v=me(), chP=np!==o.price;
  if(chP){ o.price=np; o.updated=today(); }
  if(nu!==undefined){ o.units=nu; if(nu===0&&o.stock==='stock') o.stock='none'; else if(nu>0&&o.stock==='none') o.stock='stock'; }
  if(odd&&chP){ if(o.status==='published') o.status='review'; notify('price','productos','Precio raro: '+v.name+' puso '+o.model+' '+o.size+' a '+money(np)+'. '+odd.text+' Lo confirmó como correcto; revisalo antes de aprobar.',o.id); }
}

/* ---------- Mis números: visitas, precio contra la competencia y liquidación ---------- */
function vMonths(v){ var ms={}; ms[today().slice(0,7)]=1; db.orders.forEach(function(o){ if(o.vendorId===v.id) ms[String(o.date).slice(0,7)]=1; }); Object.keys((db.clicks||{}).v||{}).forEach(function(m){ ms[m]=1; }); return Object.keys(ms).sort().reverse(); }
function numbersView(v){
  var ms=vMonths(v), m=ms.indexOf(ui.nMonth)>=0?ui.nMonth:ms[0], P=sumClicks('p',m), brand=(sumClicks('v',m)[v.id]||0);
  var mine=db.offers.filter(function(o){ return o.vendorId===v.id; }), keys={};
  mine.forEach(function(o){ keys[vkey(o.category,o.model,o.size)]={o:o,n:0,sales:0}; });
  Object.keys(P).forEach(function(k){ var a=k.split('|'), kk=vkey(a[0],a[1],a[2]); if(keys[kk]) keys[kk].n+=P[k]; });
  var sales=db.orders.filter(function(o){ return o.vendorId===v.id&&String(o.date).slice(0,7)===m; }), ok=sales.filter(function(o){ return o.status==='approved'; });
  ok.forEach(function(o){ mine.forEach(function(x){ if(o.desc.indexOf(x.model)>=0&&o.desc.indexOf(x.size)>=0){ var kk=vkey(x.category,x.model,x.size); if(keys[kk]) keys[kk].sales+=o.qty; } }); });
  var views=Object.keys(keys).reduce(function(a,k){ return a+keys[k].n; },0), sold=ok.reduce(function(a,o){ return a+o.subtotal+o.shipping; },0);
  var top=Object.keys(keys).map(function(k){ return keys[k]; }).filter(function(r){ return r.n; }).sort(function(a,b){ return b.n-a.n; }).slice(0,8), tmax=top.length?top[0].n:1;
  /* Precio contra la competencia */
  var comp=mine.filter(function(o){ return o.status==='published'; }).map(function(o){
    var all=db.offers.filter(function(x){ return isLive(x)&&x.unit===o.unit&&vkey(x.category,x.model,x.size)===vkey(o.category,o.model,o.size); }).concat(isLive(o)?[]:[o]);
    if(all.indexOf(o)<0) all.push(o);
    all.sort(function(a,b){ return a.price-b.price; });
    var pos=all.indexOf(o)+1, best=all[0].price, others=all.length-1;
    return {o:o,pos:pos,n:all.length,best:best,diff:best?Math.round((o.price-best)/best*100):0,others:others};
  }).sort(function(a,b){ return b.diff-a.diff; });
  var tile=function(k,val,sub,cls){ return '<div class="tile '+(cls||'')+'"><span class="k">'+k+'</span><span class="v num">'+val+'</span><span class="s">'+sub+'</span></div>'; };
  return '<div class="section-head" style="margin:0"><div class="field" style="min-width:220px"><label for="n-month">Mes</label><select id="n-month">'+ms.map(function(x){ return '<option value="'+x+'"'+(x===m?' selected':'')+'>'+monthName(x)+'</option>'; }).join('')+'</select></div>'
    +'<p class="note">Las visitas son las veces que alguien abrió la comparación de un producto que vos vendés.</p></div>'
    +'<div class="tiles">'+tile('Visitas a tus productos',views,'Comparaciones abiertas')+tile('Clics en tu marca',brand,'Solapa, botón Comprar o link de pago')+tile('Ventas',ok.length,money(sold),'main')
    +tile('Conversión',brand?(ok.length/brand*100).toFixed(1).replace('.',',')+'%':'—','Ventas cada 100 clics en tu marca')+'</div>'
    +'<div class="card">'+chead('target','Tu precio contra la competencia','Así quedás en la comparación hoy. El orden lo define el precio final para el comprador.')
    +(comp.length?'<div class="tablewrap flat"><table style="min-width:720px"><thead><tr><th>Producto</th><th class="r">Tu precio</th><th class="r">El más barato</th><th>Posición</th><th></th></tr></thead><tbody>'
      +comp.map(function(r){ var o=r.o, tag=!r.others?'<span class="st neu">Sos el único</span>':(r.pos===1?'<span class="st ok">Sos el más barato</span>':(r.diff<1?'<span class="st warn">Apenas más caro: '+money(o.price-r.best)+'</span>':'<span class="st warn">'+r.diff+'% más caro que el más barato</span>'));
        return '<tr><td><b>'+esc(o.model)+'</b> · '+esc(o.size)+'<span class="sub">'+esc(o.category)+' · '+perUnit(o.unit)+'</span></td><td class="r num">'+money(o.price)+'</td><td class="r num">'+(r.others?money(r.best):'—')+'</td><td class="nw">'+(r.others?r.pos+'° de '+r.n:'—')+'</td><td>'+tag+'</td></tr>'; }).join('')+'</tbody></table></div>'
      :'<div class="empty">Todavía no tenés productos publicados.</div>')+'</div>'
    +'<div class="card">'+chead('click','Tus productos más vistos','En '+monthName(m).toLowerCase()+'. Si un producto se mira mucho y se vende poco, revisá el precio o el envío.')
    +(top.length?'<ol class="rank">'+top.map(function(r,i){ return '<li><span class="rk num">'+(i+1)+'</span><span class="rk-t"><b>'+esc(r.o.model)+' · '+esc(r.o.size)+'</b> <span class="muted small">'+(r.sales?r.sales+' unidades vendidas':'Sin ventas en el mes')+'</span><span class="track"><i style="width:'+Math.max(2,r.n/tmax*100)+'%"></i></span></span><b class="num">'+r.n+'</b></li>'; }).join('')+'</ol>'
      :'<div class="empty">Sin visitas registradas en este mes.</div>')+'</div>'
    +settlementCard(v);
}
function settlementRows(v){
  var by={};
  db.orders.filter(function(o){ return o.vendorId===v.id; }).forEach(function(o){
    var m=String(o.date).slice(0,7), r=by[m]=by[m]||{m:m,n:0,sub:0,ship:0,com:0,ref:0,refAmt:0};
    if(o.status==='refunded'){ r.ref++; r.refAmt+=o.subtotal+o.shipping; return; }
    r.n++; r.sub+=o.subtotal; r.ship+=o.shipping; r.com+=o.commission;
  });
  return Object.keys(by).sort().reverse().map(function(k){ var r=by[k]; r.net=r.sub+r.ship-r.com; return r; });
}
function settlementCard(v){
  var R=settlementRows(v), T={n:0,sub:0,ship:0,com:0,net:0};
  R.forEach(function(r){ T.n+=r.n; T.sub+=r.sub; T.ship+=r.ship; T.com+=r.com; T.net+=r.net; });
  return '<div class="card">'+chead('money','Liquidación por mes','Lo que vendiste y lo que te quedó después de la comisión del sitio. Mercado Pago descuenta además su tarifa según el plazo de cobro que elegiste.',R.length?'<div class="xbar"><button type="button" class="btn btn-outline btn-sm" data-act="liq-dl">'+ico('download',18)+'Descargar Excel</button><button type="button" class="btn btn-outline btn-sm" data-act="liq-copy">'+ico('copy',18)+'Copiar</button></div>':'')
    +(R.length?'<div class="tablewrap flat"><table style="min-width:820px"><thead><tr><th>Mes</th><th class="r">Ventas</th><th class="r">Productos</th><th class="r">Envíos</th><th class="r">Comisión del sitio</th><th class="r">Te quedó</th><th class="r">Devoluciones</th></tr></thead><tbody>'
      +R.map(function(r){ return '<tr><td><b>'+monthName(r.m)+'</b></td><td class="r num">'+r.n+'</td><td class="r num">'+money(r.sub)+'</td><td class="r num">'+money(r.ship)+'</td><td class="r num">'+money(r.com)+'</td><td class="r num"><b>'+money(r.net)+'</b></td><td class="r num">'+(r.ref?r.ref+' · '+money(r.refAmt):'—')+'</td></tr>'; }).join('')
      +'</tbody><tfoot><tr><td><b>Total</b></td><td class="r num">'+T.n+'</td><td class="r num">'+money(T.sub)+'</td><td class="r num">'+money(T.ship)+'</td><td class="r num">'+money(T.com)+'</td><td class="r num"><b>'+money(T.net)+'</b></td><td></td></tr></tfoot></table></div>'
      :'<div class="empty">Todavía no tenés ventas.</div>')+'</div>';
}
/* Descargar y copiar tablas */
function rowsToCSV(rows){ return '﻿'+rows.map(function(r){ return r.map(function(c){ var s=String(c==null?'':c); return /[;"\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }).join(';'); }).join('\r\n'); }
function downloadRows(rows,name){
  try{ var url=URL.createObjectURL(new Blob([rowsToCSV(rows)],{type:'text/csv;charset=utf-8'})), a=document.createElement('a'); a.href=url; a.download=name+'-'+today()+'.csv'; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(function(){ URL.revokeObjectURL(url); },4000); toast('Listo: se abre con Excel'); }
  catch(e){ toast('Esta vista previa no deja descargar. Usá Copiar, o probalo con el sitio publicado.'); }
}
function copyRows(rows,msg){
  var tsv=rows.map(function(r){ return r.map(function(c){ return String(c==null?'':c).replace(/[\t\n]/g,' '); }).join('\t'); }).join('\n');
  copyText(tsv,msg||'Copiado: pegalo en Excel o en Google Sheets');
}
function copyText(txt,msg){
  var ok=function(){ toast(msg); }, fail=function(){ var ta=document.createElement('textarea'); ta.value=txt; ta.setAttribute('readonly',''); ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta); ta.select(); var d=false; try{ d=document.execCommand('copy'); }catch(e){} document.body.removeChild(ta); toast(d?msg:'No se pudo copiar desde acá.'); };
  try{ navigator.clipboard.writeText(txt).then(ok,fail); }catch(e){ fail(); }
}

/* ---------- Sitio de proveedores ---------- */
var SKEY='cf-demo-vendor';
var ui={pf:JSON.parse(JSON.stringify(PF_DEF)),bulk:false,sheet:false,imp:null,bulkVals:null,bulkOdd:null,saveView:false,sf:'all',orderOpen:null,nMonth:'',vbell:false,seenN:null,route:'landing',tab:'resumen',editId:null,linkId:null,confirm:null,vendorId:sget(SKEY),formError:'',applied:false,sim:1000000};
if(ui.vendorId&&vendor(ui.vendorId)) ui.route='panel'; else ui.vendorId=null;

function go(route,patch){
  if(patch){ for(var k in patch){ ui[k]=patch[k]; } }
  ui.route=route; ui.formError='';
  render();
  try{ window.scrollTo(0,0); }catch(e){}
}
function rerender(focusId){
  render();
  if(focusId){ var el=document.getElementById(focusId); if(el){ try{ el.focus(); }catch(e){} } }
}
function me(){ var v=ui.vendorId?vendor(ui.vendorId):null; return v&&v.status==='active'?v:null; }
function header(){
  var v=me(), r=ui.route;
  var right=v
    ? '<span class="who">'+esc(v.name)+'</span><button class="navlink" data-go="panel"'+(r==='panel'||r==='product'?' aria-current="page"':'')+'>Mi panel</button><button class="btn btn-outline btn-sm" data-act="logout">Salir</button>'
    : '<button class="btn btn-outline btn-sm" data-go="login">Ingresar</button>';
  return '<header class="top"><div class="wrap top-in">'
    +'<button class="brand" data-go="landing" aria-label="Comparador Fitness para proveedores, ir al inicio">'+LOGO+'<span>Comparador <em>Proveedores</em></span></button>'
    +'<nav class="nav" aria-label="Principal"><button class="navlink" data-go="landing"'+(r==='landing'?' aria-current="page"':'')+'>Cómo funciona</button>'+right+'</nav></div></header>';
}
function footer(){
  return '<footer class="foot"><div class="wrap foot-in"><span>Comparador Fitness · Sitio de proveedores. Pagar comisión no mejora la posición en los resultados.</span>'+demoLinks('sell')+'</div></footer>';
}

/* Presentación y alta */
function simHTML(){
  var p=db.commission, n=ui.sim;
  return '<div class="card strong main"><h2 class="display" style="font-size:1.9rem">Cuánto recibís por cada venta</h2>'
    +'<div class="field"><label for="sim-range">Mové el monto de la venta</label><input id="sim-range" type="range" min="100000" max="5000000" step="50000" value="'+n+'"></div>'
    +'<div><div class="muted small">Venta en productos</div><div id="sim-total" class="bigfig num">'+money(n)+'</div></div>'
    +'<div class="bar90" aria-hidden="true"><i class="a" style="flex:'+(100-p)+'"></i><i class="b" style="flex:'+p+'"></i></div>'
    +'<div style="display:flex;flex-wrap:wrap;gap:16px 48px"><div><div class="small accent" style="font-weight:600">Vos recibís · '+(100-p)+'%</div><div id="sim-net" class="bigfig num">'+money(n*(100-p)/100)+'</div></div>'
    +'<div><div class="small muted" style="font-weight:600">Comisión del sitio · '+p+'%</div><div id="sim-com" class="bigfig num">'+money(n*p/100)+'</div></div></div>'
    +'<p class="muted small">El reparto es automático en cada pago. Mercado Pago cobra aparte su costo por procesar el cobro.</p></div>';
}
function vLanding(){
  var p=db.commission;
  var done=ui.applied?'<div class="alert ok" role="status">Recibimos tu solicitud. Queda pendiente hasta que el administrador la apruebe.</div>':'';
  return '<section class="dark hero"><div class="wrap hero-in">'
    +'<p class="eyebrow">Para fabricantes, importadores y distribuidores</p>'
    +'<h1 class="display">Vendé a gimnasios y clubes. <em>Pagás solo cuando vendés.</em></h1>'
    +'<p class="lead">Nosotros cargamos tu catálogo, los compradores te comparan con otros proveedores y te compran desde el sitio. Vos mantenés al día precios y stock.</p>'
    +'<div class="chips"><span class="chip">Sin abono fijo</span><span class="chip">Comisión del '+p+'% por venta</span><span class="chip">Cobrás en tu Mercado Pago</span></div>'
    +'<div class="actions"><a class="btn btn-accent btn-lg" href="#alta">Quiero participar</a><button class="btn btn-outline btn-lg" data-go="login">Ya tengo cuenta</button></div>'
    +'</div></section>'
    +'<section class="section"><div class="wrap"><div class="section-head"><h2 class="display">Cómo funciona</h2></div><div class="steps">'
    +'<div class="step"><h3>Pedís el alta</h3><p class="muted">Completás tus datos y los revisamos antes de publicar.</p></div>'
    +'<div class="step"><h3>Conectás tu Mercado Pago</h3><p class="muted">Autorizás tu cuenta una sola vez. Ahí recibís cada venta.</p></div>'
    +'<div class="step"><h3>Cargamos tu catálogo</h3><p class="muted">Nos pasás tus productos y los publicamos con modelo, medida, envío y garantía. Vos actualizás precios y stock.</p></div>'
    +'<div class="step"><h3>Recibís pedidos pagos</h3><p class="muted">El comprador paga en el sitio y te llega el pedido.</p></div>'
    +'</div></div></section>'
    +'<section class="section" style="padding-top:0"><div class="wrap split">'+simHTML()
    +'<div class="card side"><h2 class="display h-card">Reglas claras</h2>'
    +'<div><b>El orden no se compra</b><p class="muted">Pagar comisión no mejora tu posición.</p></div>'
    +'<div><b>Se compara lo mismo con lo mismo</b><p class="muted">Misma variante y misma presentación.</p></div>'
    +'<div><b>Comisión solo sobre ventas pagadas</b><p class="muted">Si no hay venta en el sitio, no hay cargo.</p></div></div>'
    +'</div></section>'
    +'<section class="section" style="padding-top:0" id="alta"><div class="wrap"><form id="apply" class="card" novalidate style="max-width:760px">'
    +'<h2 class="display" style="font-size:1.9rem">Quiero participar</h2>'+done
    +(ui.formError?'<div class="alert bad" role="alert">'+esc(ui.formError)+'</div>':'')
    +'<div class="formgrid">'
    +'<div class="field"><label for="a-name">Razón social</label><input id="a-name" type="text" autocomplete="organization"></div>'
    +'<div class="field"><label for="a-cuit">CUIT</label><input id="a-cuit" type="text" inputmode="numeric" placeholder="11 dígitos"></div>'
    +'<div class="field"><label for="a-type">Tipo de proveedor</label><select id="a-type"><option>Fabricante</option><option>Importador</option><option>Distribuidor</option></select></div>'
    +'<div class="field"><label for="a-contact">Nombre de contacto</label><input id="a-contact" type="text" autocomplete="name"></div>'
    +'<div class="field"><label for="a-email">Email</label><input id="a-email" type="email" autocomplete="email"></div>'
    +'<div class="field"><label for="a-phone">Teléfono</label><input id="a-phone" type="tel" autocomplete="tel"></div>'
    +'<div class="field"><label for="a-pass">Elegí una clave</label><input id="a-pass" type="password" autocomplete="new-password"><span class="hint">Al menos 6 caracteres. Entrás con tu email y esta clave cuando te aprueben.</span></div>'
    +'</div><div><button class="btn btn-primary btn-lg" type="submit">Enviar solicitud</button></div></form></div></section>';
}
function vLogin(){
  return '<div class="wrap page" style="max-width:560px"><h1 class="display h-page">Ingresar</h1>'
    +'<form id="slogin" class="card" novalidate><p class="muted">Tus productos, tus ventas y tu Mercado Pago.</p>'
    +(ui.formError?'<div class="alert bad" role="alert">'+esc(ui.formError)+'</div>':'')
    +'<div class="field"><label for="l-user">Usuario o email</label><input id="l-user" type="text" autocomplete="username" autocapitalize="none"></div>'
    +'<div class="field"><label for="l-pass">Clave</label><input id="l-pass" type="password" autocomplete="current-password"></div>'
    +'<div><button class="btn btn-accent btn-lg" type="submit">Entrar a mi panel</button></div>'
    +'<p class="note">Demo: usuario <b>marcaa</b>, <b>marcab</b> o <b>marcac</b>, clave <b>'+DEMO_PW+'</b>. ¿Te olvidaste la clave? Pedile al administrador que te la cambie.</p></form>'
    +'<p class="note">¿Todavía no vendés acá? <button class="linkbtn" data-go="landing">Pedí el alta</button></p></div>';
}

/* Panel del vendedor */
function salesTable(sales){
  if(!sales.length) return '<div class="empty">Todavía no tenés ventas.</div>';
  return '<div class="tablewrap"><table style="min-width:1080px"><thead><tr><th>Venta</th><th>Comprador</th><th>Detalle</th><th class="r">Productos</th><th class="r">Envío</th><th class="r">Comisión</th><th class="r">Recibís</th><th>Estado</th><th></th></tr></thead><tbody>'
    +sales.map(function(o){
      var ref=o.status==='refunded';
      return '<tr><td><b>#'+o.id+'</b><span class="sub">'+fdate(o.date)+'</span></td><td>'+esc(o.buyer)+'</td><td>'+esc(o.desc)+' × '+o.qty+'</td><td class="r num">'+money(o.subtotal)+'</td><td class="r num">'+(o.shipping?money(o.shipping):'Sin cargo')+'</td>'
        +'<td class="r num">'+(ref?'—':money(o.commission))+'</td><td class="r num"><b>'+(ref?'—':money(net(o)))+'</b></td><td>'+orderStatus(o)+'</td>'
        +'<td><div class="actions nw"><button class="btn '+(!ref&&!o.shipped?'btn-primary':'btn-outline')+' btn-sm" data-act="order-go" data-id="'+o.id+'">'+(!ref&&!o.shipped?'Cargar envío':'Ver pedido')+'</button></div></td></tr>';
    }).join('')+'</tbody></table></div>';
}
function linkBox(){
  var o=ui.linkId?offer(ui.linkId):null; if(!o||o.vendorId!==ui.vendorId||o.status!=='published') return '';
  return '<div class="card"><div><b>Link de pago</b><p class="muted">'+esc(o.model)+' · '+esc(o.size)+' · '+money(o.price)+' '+perUnit(o.unit)+'</p></div>'
    +'<div class="linkrow"><input id="pay-link" type="text" readonly aria-label="Link de pago" value="'+esc(payLink(o.id))+'"><button class="btn btn-primary" data-act="copy-link">Copiar</button><button class="btn btn-outline" data-act="close-link">Cerrar</button></div>'
    +'<p class="note">Quien abra este link llega directo al pago de este producto en el sitio, con la comisión incluida.</p></div>';
}
function dataForm(v,cp){
  return '<form id="dform" class="card" novalidate style="max-width:900px"><div><h2 class="display h-card">Datos de tu empresa</h2><p class="muted">Le llegan al equipo del sitio. Con los datos completos te contactamos más rápido y los compradores confían más.</p></div>'
    +'<div class="complete"><div class="complete-top"><b>Datos completos: '+cp.pct+'%</b>'+(cp.miss.length?'<span class="muted small">Falta: '+esc(cp.miss.join(', '))+'</span>':'<span class="st ok">Completo</span>')+'</div><span class="track"><i style="width:'+cp.pct+'%"></i></span></div>'
    +'<div id="d-err" class="alert bad" role="alert" hidden></div>'
    +VFIELDS.map(function(g){ return '<fieldset><legend>'+g[0]+'</legend><div class="formgrid">'+g[1].map(function(f){
      var id='d-'+f[0], cur=v[f[0]]||'';
      if(f[2]==='sel') return '<div class="field"><label for="'+id+'">'+f[1]+'</label><select id="'+id+'">'+f[3].map(function(o){ return '<option value="'+esc(o)+'"'+(o===cur?' selected':'')+'>'+(o||'Elegí una opción')+'</option>'; }).join('')+'</select></div>';
      if(f[2]==='area') return '<div class="field" style="grid-column:1 / -1"><label for="'+id+'">'+f[1]+'</label><textarea id="'+id+'" rows="3" maxlength="400">'+esc(cur)+'</textarea></div>';
      return '<div class="field"><label for="'+id+'">'+f[1]+'</label><input id="'+id+'" type="'+(f[2]||'text')+'" value="'+esc(cur)+'"'+(f[0]==='name'?' maxlength="40"':' maxlength="120"')+'></div>';
    }).join('')+'</div></fieldset>'; }).join('')
    +'<fieldset><legend>Envíos</legend><p class="note">Zonas donde realizás envíos, con o sin cargo. Abajo podés elegir si ofrecés envío gratis, su cobertura y el importe necesario.</p><div class="checks">'+ZONES.map(function(z){ return '<label class="check"><input type="checkbox" data-zone="'+z[0]+'"'+((v.zones||[]).indexOf(z[0])>=0?' checked':'')+'> '+z[1]+'</label>'; }).join('')+'</div></fieldset>'
    +'<div><button class="btn btn-primary" type="submit">Guardar mis datos</button></div></form>'+promotionForm(v);
}
/* Cómo ve el comprador al proveedor cuando paga, y pago de prueba. */
function mpPreview(v){
  var ok=mpNameOk(v), ex=db.offers.filter(function(o){ return o.vendorId===v.id&&o.status==='published'; })[0];
  return '<div class="card" style="max-width:860px"><div><h2 class="display h-card">Así te ve el comprador cuando paga</h2><p class="muted">El pago entra directo en tu cuenta, así que en Mercado Pago el comprador ve el nombre de tu cuenta. Conviene que sea el mismo nombre de marca que usás en el sitio, para que no desconfíe.</p></div>'
    +'<div class="field" style="max-width:460px"><label for="mp-name">Nombre que figura en tu cuenta de Mercado Pago</label><input id="mp-name" type="text" maxlength="60" value="'+esc(v.mpName||'')+'" placeholder="'+esc(v.name)+'"><span class="hint">Lo ves en Mercado Pago, en Tu perfil → Datos de tu negocio.</span></div>'
    +(ok?'':'<div class="alert warnbox" role="status"><b>El nombre no coincide con tu marca</b><span>En el sitio sos “'+esc(v.name)+'” y en Mercado Pago figura “'+esc(v.mpName)+'”. Cambialo en Mercado Pago o avisanos para que figure igual en los dos lados.</span></div>')
    +'<div class="mp-prev"><div class="mp-screen" aria-label="Vista previa de la pantalla de pago"><span class="muted small">Pantalla de pago</span><span>Le pagás a</span><b>'+esc(mpName(v))+'</b>'
    +'<span class="muted small">'+esc(ex?ex.model+' '+ex.size+' × 1':'Tu producto')+'</span><b class="num">'+money(ex?ex.price:0)+'</b></div>'
    +'<div class="mp-card"><span class="muted small">Resumen de la tarjeta del comprador</span><b class="mono">'+esc(descriptor(v))+'</b><span class="small">Hasta 13 letras: el sitio y tu marca, para que reconozca el cargo y no lo desconozca.</span></div></div>'
    +'<div class="mp-test"><div><b>Pago de prueba</b><p class="muted small">'+(v.mpTest?'Último pago de prueba aprobado el '+fdate(v.mpTest)+'.':'Hacé uno antes de empezar a vender, para ver que todo llegue bien.')+' En el sitio real se hace con una cuenta de prueba de Mercado Pago y no se cobra nada.</p></div>'
    +'<button class="btn '+(v.mpTest?'btn-outline':'btn-primary')+'" data-act="mp-test"'+(v.mp?'':' disabled')+'>'+(v.mpTest?'Hacer otro pago de prueba':'Hacer un pago de prueba')+'</button></div>'
    +(v.mp?'':'<p class="note">Primero conectá tu Mercado Pago.</p>')+'</div>';
}
function vPanel(){
  var v=me(), mine=db.offers.filter(function(o){ return o.vendorId===v.id; }), sales=db.orders.filter(function(o){ return o.vendorId===v.id; });
  var ok=sales.filter(function(o){ return o.status==='approved'; });
  var sum=function(f){ return ok.reduce(function(a,o){ return a+f(o); },0); };
  var toShip=ok.filter(function(o){ return !o.shipped; }).length;
  var cp=vComplete(v), low=mine.filter(function(o){ return stockState(o)==='low'; }), out=mine.filter(function(o){ return stockState(o)==='none'&&o.status!=='rejected'; });
  checkLateV(v);
  var list=[{id:'resumen',label:'Resumen'},{id:'productos',label:'Mis productos'},{id:'ventas',label:'Mis ventas'},{id:'numeros',label:'Mis números'},{id:'datos',label:'Mis datos'},{id:'mp',label:'Mercado Pago'},{id:'promociones',label:'Beneficios'}];
  list.forEach(function(t){ t.count=vUnread(v,t.id); });
  if(!list[4].count&&cp.pct<100) list[4].count='!';
  if(!list.some(function(t){ return t.id===ui.tab; })) ui.tab='resumen';
  var warn=(low.length||out.length)&&ui.tab!=='productos'?'<div class="alert">'+(low.length?'Tenés '+low.length+(low.length===1?' producto con bajo stock':' productos con bajo stock'):'')+(low.length&&out.length?' y ':'')+(out.length?(low.length?'':'Tenés ')+out.length+' sin stock':'')+'. <button class="linkbtn" data-act="stock-filter" data-f="'+(low.length?'low':'none')+'">Ver y reponer</button></div>':'';
  if(v.status==='suspended') warn='<div class="alert bad">Tu cuenta está suspendida. Tus productos no se muestran en el sitio.</div>';
  else if(!v.mp) warn='<div class="alert">Conectá tu Mercado Pago para que tus productos aparezcan en la comparación. <button class="linkbtn" data-act="tab" data-tab="mp">Conectar ahora</button></div>';
  var body='';
  if(ui.tab==='resumen'){
    body='<div class="tiles">'
      +'<div class="tile"><span class="k">Ventas aprobadas</span><span class="v num">'+money(sum(function(o){ return o.subtotal+o.shipping; }))+'</span><span class="s">'+(ok.length===1?'1 venta':ok.length+' ventas')+'</span></div>'
      +'<div class="tile main"><span class="k">Recibiste</span><span class="v num">'+money(sum(net))+'</span><span class="s">Antes del costo de Mercado Pago</span></div>'
      +'<div class="tile"><span class="k">Comisión del sitio</span><span class="v num">'+money(sum(function(o){ return o.commission; }))+'</span><span class="s">'+pctOf(v)+'% de los productos</span></div>'
      +'<div class="tile"><span class="k">Por enviar</span><span class="v num">'+toShip+'</span><span class="s">'+(toShip?'<button class="linkbtn" data-act="tab" data-tab="ventas">Ver pedidos</button>':'Estás al día')+'</span></div>'
      +'<div class="tile'+(low.length?' warnt':'')+'"><span class="k">Bajo stock</span><span class="v num">'+low.length+'</span><span class="s">'+(low.length||out.length?'<button class="linkbtn" data-act="stock-filter" data-f="'+(low.length?'low':'none')+'">Ver productos</button>'+(out.length?' · '+out.length+' sin stock':''):'Todo con stock')+'</span></div></div>'
      +'<div class="section-head" style="margin:8px 0 0"><h2 class="display h-card">Últimas ventas</h2></div>'+salesTable(sales.slice(0,5));
  } else if(ui.tab==='productos'){
    body=productsView(v,mine,low,out);
  } else if(ui.tab==='ventas'){
    body=ordersView(v,sales);
  } else if(ui.tab==='numeros'){
    body=numbersView(v);
  } else if(ui.tab==='datos'){
    body=dataForm(v,cp);
  } else if(ui.tab==='promociones'){
    body=promotionForm(v);
  } else {
    body='<div class="card" style="max-width:640px"><h2 class="display h-card">Mercado Pago</h2>'
      +(v.mp?'<div class="alert ok">Cuenta conectada. Cada venta se acredita en tu Mercado Pago.</div>':'<div class="alert">Todavía no conectaste tu cuenta.</div>')
      +'<div class="rows"><div><span class="muted">Recibís</span><b>'+(100-pctOf(v))+'% de los productos + el envío</b></div><div><span class="muted">Comisión del sitio</span><b>'+pctOf(v)+'% de los productos</b></div></div>'
      +'<p class="note">En el sitio real este botón te lleva a Mercado Pago para autorizar tu cuenta una sola vez. Acá es una simulación.</p>'
      +'<div><button class="btn '+(v.mp?'btn-outline':'btn-accent')+'" data-act="mp-toggle">'+(v.mp?'Desconectar cuenta':'Conectar Mercado Pago')+'</button></div></div>'
      +mpPreview(v);
  }
  var all=vUnread(v);
  return '<div class="wrap page"><div class="adm-top-row"><h1 class="display h-page">'+esc(v.name)+'</h1><button type="button" class="bell'+(all?' on':'')+'" data-act="vbell" aria-expanded="'+ui.vbell+'" aria-label="Novedades'+(all?', '+all+' sin leer':'')+'">'+ico('bell',22)+'<span>Novedades</span>'+(all?'<span class="count">'+all+'</span>':'')+'</button></div>'
    +(ui.vbell?vBell(v):'')+warn+tabsHTML(list,ui.tab)+body+'</div>';
}
function modelOpts(cat,cur){ var c=catBy(cat)||CATALOG[0]; return c.m.map(function(m){ return '<option'+(m[0]===cur?' selected':'')+'>'+esc(m[0])+'</option>'; }).join(''); }
function sizeOpts(cat,model,cur){ var c=catBy(cat)||CATALOG[0], m=modelBy(c.n,model)||c.m[0]; return m[1].map(function(x){ return '<option'+(x===cur?' selected':'')+'>'+esc(x)+'</option>'; }).join(''); }
function modelInfo(cat,model){
  var c=catBy(cat)||CATALOG[0], m=modelBy(c.n,model)||c.m[0];
  return '<b>'+esc(m[0])+'</b><p>'+esc(m[2])+'</p><p class="muted small">Datos que conviene aclarar en el detalle: '+esc(c.attrs.toLowerCase())+'.</p>';
}
/* Aviso de precio raro mientras se carga el producto. */
function formDraft(){ var e=offer(ui.editId); return e?{category:e.category,model:e.model,size:e.size,unit:e.unit,price:digits(val('p-price'))}:null; }
function priceWarn(d){
  var e=ui.editId?offer(ui.editId):null; d=d||(e?{category:e.category,model:e.model,size:e.size,unit:e.unit,price:e.price}:null); if(!d) return '';
  var c=priceCheck(d,e?e.id:null,ui.vendorId,e&&e.price!==d.price?e.price:0); if(!c) return '';
  return '<div class="alert warnbox" role="status"><b>'+ico0()+' ¿Está bien este precio?</b><span>'+esc(c.text)+' Revisá que no sobre ni falte un cero.</span>'
    +'<label class="check"><input id="p-okprice" type="checkbox"> Sí, el precio está bien</label><span class="small">Si lo confirmás, el producto pasa por revisión antes de mostrarse.</span></div>';
}
function ico0(){ return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-3px"><path d="M12 3l10 18H2z"/><path d="M12 10v4M12 17.5v.5"/></svg>'; }
function refreshWarn(){ var w=document.getElementById('p-warn'); if(!w) return; var was=document.getElementById('p-okprice'), ok=was&&was.checked; w.innerHTML=priceWarn(formDraft()); var now=document.getElementById('p-okprice'); if(now&&ok) now.checked=true; }
/* El proveedor solo cambia precio y stock. El resto del producto lo carga el administrador. */
function vProduct(){
  var v=me(), e=ui.editId?offer(ui.editId):null;
  if(!e||e.vendorId!==v.id) return '<div class="wrap page"><div class="empty">No encontramos ese producto.</div><div><button class="btn btn-primary" data-act="back-products">Volver a mis productos</button></div></div>';
  var pct=pctOf(v), fmt=function(n){ return Math.round(n).toLocaleString('es-AR'); };
  var ro=function(k,x){ return '<div><dt>'+k+'</dt><dd>'+x+'</dd></div>'; };
  return '<div class="wrap page"><nav class="crumbs" aria-label="Ruta"><button class="linkbtn" data-act="back-products">Volver a mis productos</button></nav>'
    +'<h1 class="display h-page">Precio y stock</h1>'
    +'<div class="split"><form id="pform" class="card main" novalidate>'
    +'<div><b>'+esc(e.model)+' · '+esc(e.size)+'</b><p class="muted">'+esc(e.category)+' · '+perUnit(e.unit)+(e.brand?' · Marca: '+esc(e.brand):'')+(e.detail?' · '+esc(e.detail):'')+'</p>'+offerStatus(e)+'</div>'
    +'<div id="p-err" class="alert bad" role="alert" hidden></div>'
    +'<fieldset><legend>Precio</legend><div class="formgrid">'
    +'<div class="field"><label for="p-price">Precio con IVA ($)</label><input id="p-price" type="text" inputmode="numeric" value="'+(e.price?fmt(e.price):'')+'"></div>'
    +'<div id="p-warn" class="pwarn" aria-live="polite" style="grid-column:1 / -1">'+priceWarn()+'</div></div></fieldset>'
    +'<fieldset><legend>Stock</legend><div class="formgrid">'
    +'<div class="field"><label for="p-stock">Disponibilidad</label><select id="p-stock">'+[['stock','En stock'],['order','A pedido'],['none','Sin stock']].map(function(o){ return '<option value="'+o[0]+'"'+(o[0]===e.stock?' selected':'')+'>'+o[1]+'</option>'; }).join('')+'</select></div>'
    +'<div class="field"><label for="p-units">Unidades disponibles</label><input id="p-units" type="number" min="0" inputmode="numeric" placeholder="Sin contar" value="'+(e.units==null?'':e.units)+'"><span class="hint">Se descuentan solas con cada venta. Vacío = no llevás la cuenta.</span></div>'
    +'<div class="field"><label for="p-low">Aviso de bajo stock</label><input id="p-low" type="number" min="0" inputmode="numeric" placeholder="'+(v.lowAt!=null?v.lowAt:10)+'" value="'+(e.lowAt==null?'':e.lowAt)+'"><span class="hint">Te avisamos cuando queden esta cantidad o menos. Vacío = tu aviso general.</span></div>'
    +'</div></fieldset>'
    +volumeFields(e)+'<div class="card sub"><p class="eyebrow">Lo carga el equipo del sitio</p><dl class="dl">'
    +ro('Compra', 'Sin mínimo · desde un '+(e.unit==='Par'?'par':e.unit==='Kit'?'kit':'producto'))+ro('Entrega',days(e.lead))+ro('Garantía',months(e.warranty))+ro('Envío AMBA',e.shipAmba?money(e.shipAmba):'Sin cargo')+ro('Envío resto del país',e.shipInt?money(e.shipInt):'Sin cargo')+'</dl>'
    +'<p class="note">Para cambiar estos datos, el modelo o la variante, escribinos y lo actualizamos.</p>'+waCta('Pedir un cambio','btn btn-outline btn-sm','Hola, soy '+v.name+' y quiero cambiar datos de '+e.model+' '+e.size)+'</div>'
    +'<div class="actions"><button class="btn btn-accent btn-lg" type="submit">Guardar cambios</button><button class="btn btn-outline btn-lg" type="button" data-act="back-products">Cancelar</button></div></form>'
    +'<aside class="card strong side"><h2 class="display h-card">Lo que recibís por venta</h2>'
    +'<div class="rows num"><div><span class="muted">Precio publicado</span><span id="pv-price">'+money(e.price)+'</span></div><div><span class="muted">Comisión del sitio · '+pct+'%</span><span id="pv-com">'+money(e.price*pct/100)+'</span></div><div class="total"><span>Recibís</span><span id="pv-net" class="accent">'+money(e.price*(100-pct)/100)+'</span></div></div>'
    +'<p class="muted small">Mercado Pago cobra aparte su costo por procesar el cobro.</p></aside></div></div>';
}

var VIEWS={landing:vLanding,login:vLogin,panel:vPanel,product:vProduct};
function render(){
  if((ui.route==='panel'||ui.route==='product')&&!me()) ui.route='login';
  var mv=me(), N=mv?(mv.notifs||[]):[], top=N.length?N[0].id:0;
  if(mv&&ui.seenN!=null&&top>ui.seenN){ var fresh=N.filter(function(n){ return n.id>ui.seenN; }); setTimeout(function(){ toast(fresh.length===1?fresh[0].text:'Tenés '+fresh.length+' novedades nuevas'); },50); }
  ui.seenN=mv?top:null;
  if(!VIEWS[ui.route]) ui.route='landing';
  app.innerHTML=header()+'<main>'+VIEWS[ui.route]()+'</main>'+footer();
}
document.addEventListener('click',function(ev){
  var t=ev.target.closest?ev.target.closest('[data-go],[data-act]'):null;
  if(!t||t.disabled) return;
  if(t.hasAttribute('data-go')){ var r=t.getAttribute('data-go'); go(r,r==='landing'?{applied:false}:(r==='panel'?{tab:'resumen'}:null)); return; }
  var a=t.getAttribute('data-act'), id=t.dataset.id, x;
  if(a!=='refund') ui.confirm=null;
  switch(a){
    case 'tab': ui.tab=t.dataset.tab; ui.vbell=false; vMarkRead(me(),ui.tab); rerender(); break;
    case 'vbell': ui.vbell=!ui.vbell; rerender(); break;
    case 'vn-readall': vMarkRead(me()); rerender(); break;
    case 'vn-go': x=(me().notifs||[]).filter(function(n){ return n.id===+id; })[0]; if(!x) break; x.read=true; save(); ui.vbell=false; ui.tab=x.tab;
      if(x.tab==='ventas'){ ui.sf='all'; ui.orderOpen=order(x.ref)?+x.ref:null; }
      if(x.tab==='productos'&&x.kind==='stock'){ ui.pf=JSON.parse(JSON.stringify(PF_DEF)); }
      if(ui.route!=='panel') go('panel'); else { rerender(); try{ window.scrollTo(0,0); }catch(e){} } break;
    case 'sale-f': ui.sf=t.dataset.f; ui.orderOpen=null; rerender(); break;
    case 'order-open': ui.orderOpen=ui.orderOpen===+id?null:+id; rerender(); break;
    case 'order-go': ui.tab='ventas'; ui.sf='all'; ui.orderOpen=+id; vMarkRead(me(),'ventas'); rerender(); x=document.querySelector('tr.detail'); if(x){ try{ x.scrollIntoView({block:'center'}); }catch(e){} } break;
    case 'copy-addr': copyText(t.dataset.text,'Datos de entrega copiados'); break;
    case 'deliver': x=order(id); if(x&&x.vendorId===ui.vendorId){ x.delivered=true; x.deliveredAt=today(); vact(me(),'marcó entregado el pedido #'+x.id); save(); rerender(); toast('Pedido #'+x.id+' entregado'); } break;
    case 'pf-quick': var qd=QUICK.filter(function(q){ return q[0]===t.dataset.q; })[0]; ui.pf=JSON.parse(JSON.stringify(PF_DEF)); for(var qk in qd[2]) ui.pf[qk]=qd[2][qk]; ui.bulkVals=null; ui.bulkOdd=null; rerender(); break;
    case 'pf-view': x=(me().views||[])[+t.dataset.i]; if(x){ ui.pf=JSON.parse(JSON.stringify(x.f)); ui.bulkVals=null; ui.bulkOdd=null; rerender(); } break;
    case 'pf-del': x=me(); var gone=(x.views||[]).splice(+t.dataset.i,1)[0]; save(); rerender(); if(gone) toast('Filtro “'+gone.name+'” borrado'); break;
    case 'pf-save': ui.saveView=true; rerender('vw-name'); break;
    case 'pf-save-cancel': ui.saveView=false; rerender(); break;
    case 'pf-clear': ui.pf=JSON.parse(JSON.stringify(PF_DEF)); ui.saveView=false; rerender(); break;
    case 'sheet': ui.sheet=!ui.sheet; ui.imp=null; rerender(); break;
    case 'bulk': ui.bulk=!ui.bulk; ui.bulkVals=null; ui.bulkOdd=null; rerender(); break;
    case 'bulk-pct':
      var pc=parseFloat(String(val('bulk-pct')).replace(',','.')); if(isNaN(pc)||pc<=-90||pc>500){ toast('Escribí un porcentaje, por ejemplo 8 o -5.'); document.getElementById('bulk-pct').focus(); break; }
      [].slice.call(document.querySelectorAll('[data-bp]')).forEach(function(inp2){ var o2=offer(inp2.getAttribute('data-bp')); if(o2) inp2.value=Math.round(o2.price*(1+pc/100)).toLocaleString('es-AR'); });
      toast('Precios '+(pc>=0?'aumentados ':'bajados ')+Math.abs(pc)+'% en la lista. Revisalos y guardá.'); break;
    case 'sheet-dl': downloadRows(sheetRows(db.offers.filter(function(o){ return o.vendorId===ui.vendorId; })),'mis-productos'); break;
    case 'sheet-copy': copyRows(sheetRows(db.offers.filter(function(o){ return o.vendorId===ui.vendorId; })),'Planilla copiada: pegala en Excel, cambiá precios y unidades, y volvé a pegarla acá'); break;
    case 'sheet-read': var txt=val('sheet-paste'); if(!txt.trim()){ toast('Pegá las filas o subí la planilla.'); document.getElementById('sheet-paste').focus(); break; } ui.imp=parseSheet(txt); rerender(); break;
    case 'imp-cancel': ui.imp=null; rerender(); break;
    case 'imp-apply':
      var I=ui.imp; if(!I) break; var needOk=I.rows.some(function(r){ return r.odd; }), okc=document.getElementById('imp-ok');
      if(needOk&&!(okc&&okc.checked)){ toast('Hay precios raros: revisalos y marcá que están bien.'); if(okc) okc.focus(); break; }
      I.rows.forEach(function(r){ var o3=offer(r.id); if(o3) applyPU(o3,r.np,r.nu,r.odd); });
      vact(me(),'actualizó '+I.rows.length+' productos con una planilla'); ui.imp=null; ui.sheet=false; save(); rerender(); toast(I.rows.length+(I.rows.length===1?' producto actualizado':' productos actualizados')+(needOk?'. Los precios raros pasan por revisión.':'')); break;
    case 'liq-dl': case 'liq-copy':
      var LR=[['Mes','Ventas','Productos $','Envíos $','Comisión del sitio $','Te quedó $','Devoluciones','Monto devuelto $']].concat(settlementRows(me()).map(function(r){ return [monthName(r.m),r.n,r.sub,r.ship,r.com,r.net,r.ref,r.refAmt]; }));
      if(a==='liq-dl') downloadRows(LR,'liquidacion'); else copyRows(LR); break;
    case 'logout': ui.vendorId=null; sset(SKEY,null); go('landing',{applied:false}); toast('Saliste de tu panel'); break;
    case 'mp-toggle': x=me(); x.mp=!x.mp; notify('mp','vendedores',x.name+(x.mp?' conectó su Mercado Pago: ya puede vender':' desconectó su Mercado Pago: sus productos dejaron de mostrarse'),x.id); vact(x,x.mp?'conectó Mercado Pago':'desconectó Mercado Pago'); save(); rerender(); toast(x.mp?'Mercado Pago conectado':'Mercado Pago desconectado'); break;
    case 'mp-test': x=me(); if(!x.mp) break; x.mpTest=today(); vact(x,'hizo un pago de prueba'); save(); rerender(); toast('Pago de prueba aprobado: la plata llegaría a '+mpName(x)); break;
    case 'stock-filter': ui.pf=JSON.parse(JSON.stringify(PF_DEF)); if(t.dataset.f!=='all') ui.pf.stock=t.dataset.f; ui.bulk=false; if(ui.tab!=='productos'||ui.route!=='panel') go('panel',{tab:'productos'}); else rerender(); break;
    case 'paylink': ui.linkId=id; rerender('pay-link'); x=document.getElementById('pay-link'); if(x){ try{ x.select(); x.scrollIntoView({block:'center'}); }catch(e){} } break;
    case 'close-link': ui.linkId=null; rerender(); break;
    case 'copy-link':
      x=document.getElementById('pay-link'); if(!x) break;
      try{ navigator.clipboard.writeText(x.value).then(function(){ toast('Link copiado'); },function(){ x.focus(); x.select(); toast('Seleccioná el link y copialo'); }); }
      catch(e){ x.focus(); x.select(); toast('Seleccioná el link y copialo'); }
      break;
    case 'prod-edit': go('product',{editId:id}); break;
    case 'back-products': go('panel',{tab:'productos'}); break;
    case 'wa-missing': toast('Todavía falta cargar el WhatsApp del sitio. Escribinos por email.'); break;
    case 'refund':
      if(ui.confirm!=='r'+id){ ui.confirm='r'+id; rerender(); break; }
      x=order(id); if(x&&x.vendorId===ui.vendorId){ x.status='refunded'; notify('refund','ventas',me().name+' registró la devolución del pedido #'+x.id+' ('+money(x.subtotal+x.shipping)+'). Se anula la comisión de '+money(x.commission)+'.',x.id); vact(me(),'registró la devolución de #'+x.id); } ui.confirm=null; save(); rerender(); toast('Devolución registrada. La comisión de esa venta se anula.'); break;
    case 'ship': x=order(id); if(x&&x.vendorId===ui.vendorId&&x.status==='approved'){ x.shipped=true; x.shippedAt=today(); notify('ship','ventas',me().name+' marcó como enviado el pedido #'+x.id,x.id); vact(me(),'envió el pedido #'+x.id); save(); rerender(); toast('Pedido #'+x.id+' marcado como enviado'); } break;
  }
});
document.addEventListener('submit',function(ev){
  var f=ev.target; ev.preventDefault();
  if(submitPromotion(ev)) return;
  if(f.id==='shipform'){
    var so=order(f.getAttribute('data-id')), car=val('sh-car'), num=val('sh-num').trim().slice(0,40), tu=val('sh-url').trim();
    if(!so||so.vendorId!==ui.vendorId) return;
    var needNum=['Andreani','OCA','Correo Argentino','Vía Cargo'].indexOf(car)>=0;
    if(needNum&&!num){ var se=document.getElementById('sh-err'); se.textContent='Escribí el número de seguimiento de '+car+'.'; se.hidden=false; document.getElementById('sh-num').focus(); return; }
    if(tu&&!safeUrl(tu)){ var se2=document.getElementById('sh-err'); se2.textContent='El link tiene que empezar con https://'; se2.hidden=false; document.getElementById('sh-url').focus(); return; }
    so.shipped=true; so.shippedAt=today(); so.carrier=car; so.tracking=num; so.trackUrl=tu;
    notify('ship','ventas',me().name+' envió el pedido #'+so.id+' por '+car+(num?' ('+num+')':''),so.id); vact(me(),'envió el pedido #'+so.id+' por '+car);
    save(); rerender(); toast('Pedido #'+so.id+' enviado. Le avisamos al comprador'+(so.ship&&so.ship.email?' a '+so.ship.email:'')+' con el seguimiento.'); return;
  }
  if(f.id==='viewform'){
    var vn=val('vw-name').trim().slice(0,24); if(!vn){ toast('Ponele un nombre al filtro.'); document.getElementById('vw-name').focus(); return; }
    var mv2=me(); mv2.views=mv2.views||[]; if(mv2.views.length>=8){ toast('Podés guardar hasta 8 filtros. Borrá alguno.'); return; }
    mv2.views.push({name:vn,f:JSON.parse(JSON.stringify(ui.pf))}); ui.saveView=false; save(); rerender(); toast('Filtro “'+vn+'” guardado'); return;
  }
  if(f.id==='bulkform'){
    var vals={}, odd=[], errs=[];
    [].slice.call(document.querySelectorAll('[data-bp]')).forEach(function(inp3){
      var id3=inp3.getAttribute('data-bp'), o4=offer(id3); if(!o4) return;
      var np=parseNum(inp3.value), ur=val('bu-'+id3).trim(), nu=ur===''?null:parseNum(ur);
      if(np==null||isNaN(np)||np<=0){ errs.push(o4.model+' '+o4.size); return; }
      if(nu!=null&&(isNaN(nu)||nu<0)) nu=o4.units;
      vals[id3]={p:np,u:nu};
      if(np!==o4.price){ var c4=priceCheck({category:o4.category,model:o4.model,size:o4.size,unit:o4.unit,price:np},o4.id,o4.vendorId,o4.price); if(c4) odd.push({id:id3,name:o4.model+' '+o4.size,price:np,text:c4.text,c:c4}); }
    });
    if(errs.length){ toast('Revisá el precio de: '+errs.slice(0,3).join(', ')+(errs.length>3?'…':'')); return; }
    var bok=document.getElementById('bulk-ok');
    if(odd.length&&!(bok&&bok.checked&&ui.bulkOdd&&ui.bulkOdd.length===odd.length)){ ui.bulkVals=vals; ui.bulkOdd=odd; rerender('bulk-ok'); toast('Hay precios que parecen raros: revisalos.'); return; }
    var nP=0,nU=0;
    Object.keys(vals).forEach(function(id5){ var o5=offer(id5), r5=vals[id5], oc=odd.filter(function(x){ return x.id===id5; })[0]; if(r5.p!==o5.price) nP++; if(r5.u!==o5.units) nU++; if(r5.p!==o5.price||r5.u!==o5.units) applyPU(o5,r5.p,r5.u,oc?oc.c:null); });
    if(nP||nU) vact(me(),'editó en masa: '+nP+' precios y '+nU+' stocks');
    ui.bulk=false; ui.bulkVals=null; ui.bulkOdd=null; save(); rerender(); toast(nP||nU?'Listo: '+nP+(nP===1?' precio':' precios')+' y '+nU+(nU===1?' stock actualizados':' stocks actualizados')+(odd.length?'. Los precios raros pasan por revisión.':''):'No había cambios'); return;
  }
  if(f.id==='slogin'){
    db=load();
    var typed=val('l-user'), u=norm(typed), pw=val('l-pass'), v=db.vendors.filter(function(x){ return u&&(norm(x.user)===u||norm(x.email)===u); })[0];
    var lerr=!u||!pw?'Escribí tu usuario y tu clave.':(!v||!v.hash||v.hash!==pwHash(pw)?'El usuario o la clave no coinciden.':(v.status==='pending'?'Tu solicitud todavía está pendiente de aprobación.':(v.status==='rejected'?'Tu solicitud no fue aprobada. Escribinos para más información.':(v.status!=='active'?'Tu cuenta está suspendida. Escribinos para resolverlo.':''))));
    if(lerr){ ui.formError=lerr; render(); var lu=document.getElementById('l-user'); if(lu){ lu.value=typed; } var le=document.getElementById(!u?'l-user':'l-pass'); if(le) le.focus(); return; }
    v.logins=v.logins||[]; v.logins.unshift(new Date().toISOString()); if(v.logins.length>300) v.logins.length=300; vact(v,'entró al panel'); save();
    ui.formError=''; ui.vendorId=v.id; sset(SKEY,v.id); go('panel',{tab:'resumen'}); toast('Hola, '+v.name);
    return;
  }
  if(f.id==='apply'){
    var name=val('a-name').trim(), cuit=String(val('a-cuit')).replace(/\D/g,''), email=val('a-email').trim();
    var keep={name:name,cuit:val('a-cuit'),contact:val('a-contact'),email:email,phone:val('a-phone'),type:val('a-type')};
    var pass=val('a-pass'), dup=db.vendors.some(function(v){ return norm(v.email)===norm(email)||norm(v.user)===norm(email); });
    var err=!name?'Falta la razón social.':(cuit.length!==11?'El CUIT tiene que tener 11 dígitos.':(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)?'Revisá el email: no parece válido.':(dup?'Ya hay una cuenta con ese email.':(pass.length<6?'La clave tiene que tener al menos 6 caracteres.':''))));
    if(err){
      ui.formError=err; ui.applied=false; render();
      ['name','cuit','contact','email','phone','type'].forEach(function(k){ var el=document.getElementById('a-'+k); if(el) el.value=keep[k]; });
      var fe=document.getElementById(!name?'a-name':(cuit.length!==11?'a-cuit':(pass.length<6&&!dup&&/@/.test(email)?'a-pass':'a-email'))); if(fe) fe.focus();
      return;
    }
    db.vendors.push({id:'v'+(db.nextId++),name:name,type:keep.type,cuit:cuit.slice(0,2)+'-'+cuit.slice(2,10)+'-'+cuit.slice(10),contact:keep.contact.trim(),email:email,phone:keep.phone.trim(),status:'pending',mp:false,commission:null,user:norm(email),hash:pwHash(pass),since:today(),logins:[],act:[{t:new Date().toISOString(),what:'pidió el alta'}]});
    notify('vendor','vendedores','Nueva solicitud de alta: '+name+' ('+keep.type+'). Revisala y aprobala para que pueda vender.',db.vendors[db.vendors.length-1].id);
    save(); ui.formError=''; ui.applied=true; render(); toast('Solicitud enviada');
    var fm=document.getElementById('alta'); if(fm&&fm.scrollIntoView){ try{ fm.scrollIntoView({block:'start'}); }catch(e){} }
  } else if(f.id==='dform'){
    var v=me(), ch=[], em=val('d-email').trim(), nm=val('d-name').trim().slice(0,40);
    if(!nm){ var eb=document.getElementById('d-err'); eb.textContent='Falta el nombre de la marca.'; eb.hidden=false; document.getElementById('d-name').focus(); return; }
    if(em&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)){ var eb2=document.getElementById('d-err'); eb2.textContent='Revisá el email: no parece válido.'; eb2.hidden=false; document.getElementById('d-email').focus(); return; }
    VFIELDS.forEach(function(g){ g[1].forEach(function(fl){ var nv=val('d-'+fl[0]).trim(); if(fl[0]==='name') nv=nm; if(nv!==String(v[fl[0]]||'')){ ch.push(fl[1].toLowerCase()); v[fl[0]]=nv; } }); });
    var zs=[].slice.call(document.querySelectorAll('[data-zone]')).filter(function(c){ return c.checked; }).map(function(c){ return c.getAttribute('data-zone'); });
    if(zs.join()!==(v.zones||[]).join()){ ch.push('zonas de envío'); v.zones=zs; }
    if(ch.length){ notify('data','vendedores',v.name+' actualizó sus datos: '+ch.join(', '),v.id); vact(v,'actualizó sus datos ('+ch.join(', ')+')'); }
    save(); rerender(); toast(ch.length?'Datos guardados':'No había cambios');
  } else if(f.id==='pform'){
    var cur=offer(ui.editId); if(!cur||cur.vendorId!==ui.vendorId) return;
    var np=digits(val('p-price')), st=val('p-stock'), ut=val('p-units').trim(), lt=val('p-low').trim();
    if(np<=0){ var box=document.getElementById('p-err'); box.textContent='El precio tiene que ser mayor a cero.'; box.hidden=false; document.getElementById('p-price').focus(); return; }
    var d={category:cur.category,model:cur.model,size:cur.size,unit:cur.unit,price:np};
    var odd=np!==cur.price?priceCheck(d,cur.id,ui.vendorId,cur.price):null, okp=document.getElementById('p-okprice');
    if(odd&&!(okp&&okp.checked)){
      refreshWarn(); var b2=document.getElementById('p-err'); if(b2){ b2.textContent='El precio parece raro. Revisalo o confirmá que está bien.'; b2.hidden=false; }
      var ok2=document.getElementById('p-okprice'); if(ok2){ try{ ok2.scrollIntoView({block:'center'}); }catch(e){} ok2.focus(); }
      return;
    }
    var tiers; try{ tiers=readVolume(); }catch(err){ var eb=document.getElementById('p-err'); eb.textContent=err.message; eb.hidden=false; return; }
    cur.volumeTiers=tiers;
    var nu=ut===''?null:digits(ut), was=cur.price;
    cur.stock=st; cur.lowAt=lt===''?null:digits(lt);
    applyPU(cur,np,nu,odd);
    vact(me(),'actualizó '+cur.model+' '+cur.size+(np!==was?': precio '+money(was)+' → '+money(np):'')+' · stock '+stockName(cur.stock)+(cur.units!=null?' ('+cur.units+')':''));
    save(); go('panel',{tab:'productos'}); toast(odd?'Guardado. Como el precio es muy distinto, pasa por revisión antes de mostrarse.':'Cambios guardados');
  }
});
document.addEventListener('change',function(ev){
  var t=ev.target, x;
  if(t.id==='promo-mode'||t.id==='promo-zone'){var active=val('promo-mode')!=='none';document.getElementById('promo-zone').disabled=!active;document.getElementById('promo-threshold').disabled=val('promo-mode')!=='from';document.getElementById('promo-postal').disabled=!active||val('promo-zone')!=='amba';return;}
  if(t.dataset&&t.dataset.units){
    x=offer(t.dataset.units); if(!x||x.vendorId!==ui.vendorId) return;
    var was=x.units; x.units=t.value.trim()===''?null:digits(t.value);
    if(x.units===0&&x.stock==='stock') x.stock='none'; else if(x.units>0&&x.stock==='none') x.stock='stock';
    if(was!==x.units) vact(me(),(x.units==null?'dejó de contar unidades de ':'cargó '+x.units+' unidades de ')+x.model+' '+x.size);
    save(); rerender(t.id); toast(x.units==null?'Sin cuenta de unidades':(stockState(x)==='none'?'Sin stock: deja de mostrarse hasta que repongas':(stockState(x)==='low'?'Guardado. Quedan pocas: bajo stock':'Stock actualizado')));
    return;
  }
  if(t.dataset&&t.dataset.pf){ ui.pf[t.dataset.pf]=t.value; ui.bulkVals=null; ui.bulkOdd=null; rerender(t.id); return; }
  if(t.id==='n-month'){ ui.nMonth=t.value; rerender(t.id); return; }
  if(t.id==='sheet-file'){ var fl=t.files&&t.files[0]; if(!fl) return; var fr=new FileReader(); fr.onload=function(){ ui.imp=parseSheet(String(fr.result||'')); rerender(); }; fr.onerror=function(){ toast('No se pudo leer el archivo.'); }; fr.readAsText(fl,'utf-8'); return; }
  if(t.id==='mp-name'){ x=me(); var nn=t.value.trim().slice(0,60); if(nn!==(x.mpName||'')){ x.mpName=nn; vact(x,'cargó el nombre de su cuenta de Mercado Pago: '+(nn||'(vacío)')); if(!mpNameOk(x)) notify('mp','vendedores','El nombre de Mercado Pago de '+x.name+' no coincide con su marca: figura “'+nn+'”',x.id); save(); rerender(t.id); toast(mpNameOk(x)?'Guardado':'Guardado. Ojo: no coincide con tu marca'); } return; }
  if(t.id==='low-def'){ x=me(); x.lowAt=t.value.trim()===''?null:digits(t.value); save(); rerender(t.id); toast('Te avisamos cuando queden '+(x.lowAt!=null?x.lowAt:10)+' unidades o menos'); return; }
  if(t.id==='p-size'||t.id==='p-unit'){ refreshWarn(); return; }
  if(t.id!=='p-cat'&&t.id!=='p-model') return;
  var ms=document.getElementById('p-model'), ss=document.getElementById('p-size');
  if(t.id==='p-cat') ms.innerHTML=modelOpts(t.value,null);
  ss.innerHTML=sizeOpts(val('p-cat'),ms.value,null);
  document.getElementById('p-info').innerHTML=modelInfo(val('p-cat'),ms.value);
  refreshWarn();
});
document.addEventListener('input',function(ev){
  var t=ev.target, n, p;
  if(t.id==='pf-q'){ ui.pf.q=t.value; var pos=t.selectionStart; rerender('pf-q'); var q2=document.getElementById('pf-q'); if(q2){ try{ q2.setSelectionRange(pos,pos); }catch(e){} } return; }
  if(t.id==='sim-range'){ n=digits(t.value); ui.sim=n; p=db.commission; setText('sim-total',money(n)); setText('sim-net',money(n*(100-p)/100)); setText('sim-com',money(n*p/100)); }
  else if(t.id==='p-price'){ n=digits(t.value); p=pctOf(me()); setText('pv-price',money(n)); setText('pv-com',money(n*p/100)); setText('pv-net',money(n*(100-p)/100)); refreshWarn(); }
});
render();
})();

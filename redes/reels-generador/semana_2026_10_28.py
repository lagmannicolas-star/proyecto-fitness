"""Guiones semana 28/10 al 03/11/2026: 7 Reels (IG + TikTok) y 14 TikToks.
Cambio respecto a la semana anterior: más formato "¿Entra o no entra?" (planta con medidas, el que más rindió)
y más llamados a comentar una palabra (el "Comentá EQUIPAR" fue el reel con más comentarios); menos humor/POV."""
from engine import RED, GREEN, LIME, GREY, CARD

NOTA = "Medidas de ejemplo"
END_T = dict(type="end", dur=2.4, text="Seguinos para más")

# ---------------------------------------------------------------- REELS (25-35 s, 10 h, IG + TikTok)
BASE_10x6 = [("Rack", 0.4, 0.4, 2.0, 2.0), ("Rack", 2.8, 0.4, 2.0, 2.0), ("Banco", 5.4, 0.6, 1.2, 2.0), ("Banco", 7.0, 0.6, 1.2, 2.0),
             ("Cinta", 0.4, 4.4, 2.2, 1.0), ("Cinta", 3.0, 4.4, 2.2, 1.0), ("Mancuernas", 5.8, 4.6, 3.8, 0.9)]

REELS = [
 dict(slug="entra-sala-10x6", date="2026-10-28T10:30:00", folder="semana-2/3-miercoles-28-oct", seed=2801,
  title="¿Entra tu sala de musculación en 10 × 6?",
  scenes=[
   dict(type="title", dur=2.8, kicker="DUEÑOS DE GIMNASIO", text="Compraste todo para tu sala... y no entra", size=100, hl=["no entra"]),
   dict(type="plan", dur=6, text="Sala de 10 × 6 m", size=96, hl=["10 × 6 m"], room=(10, 6), items=[it + (0.8 + i * 0.4,) for i, it in enumerate(BASE_10x6)], verdict="¿ENTRA?", vt=4.2, note=NOTA),
   dict(type="plan", dur=5, text="¿Y si le sumás 4 bicis?", size=96, hl=["4 bicis?"], room=(10, 6),
        items=[it + (0.0,) for it in BASE_10x6] + [("Bici", 0.6 + j * 1.4, 2.75, 1.0, 1.3, 0.8 + j * 0.3, RED) for j in range(4)], verdict="NO QUEDA PASO", vcolor=RED, vt=2.6, note=NOTA),
   dict(type="title", dur=3.6, text="Probalo antes de comprar", size=104, hl=["antes de comprar"], sub="En Armá tu espacio cargás tus medidas y lo ves en 3D, a escala"),
   dict(type="steps", dur=5, text="Y con esa lista:", size=96, items=["Pedís ofertas a varios proveedores", "Comparás el costo total", "Elegís la que te conviene"], gap=0.9),
   dict(type="cta", dur=4.5, word="ENTRA", sub="y te mandamos el link", comment=("gym_del_barrio", "ENTRA")),
   dict(type="end", dur=3, text="Guardalo antes de comprar"),
  ],
  caption="Compraste todo para tu sala… ¿y entra? 📐\n\nAntes de comprar, cargá las medidas de tu lugar en Armá tu espacio y mirá en 3D, a escala, cómo queda el equipamiento. Con esa lista pedís ofertas a varios proveedores y comparás el costo total.\n\n👉 Comentá ENTRA y te mandamos el link.\n\n#gimnasio #dueñodegimnasio #saladeMusculacion #equipamientofitness #fitnessargentina #nexofit".replace("saladeMusculacion", "musculacion")),

 dict(slug="lista-colegio-por-nivel", date="2026-10-29T10:30:00", folder="semana-2/4-jueves-29-oct", seed=2902,
  title="La lista de material de educación física, nivel por nivel",
  scenes=[
   dict(type="title", dur=3, kicker="PROFES DE EDUCACIÓN FÍSICA", text="La lista de material para la escuela, nivel por nivel", size=94, hl=["nivel por nivel"]),
   dict(type="chips", dur=4.5, text="Nivel inicial", size=100, items=["AROS", "CONOS", "COLCHONETAS", "PELOTAS BLANDAS"], big=True, isize=80, step=180, gap=0.3),
   dict(type="chips", dur=4.5, text="Primaria", size=100, items=["SOGAS", "VALLAS BAJAS", "PELOTAS", "CHALECOS"], big=True, isize=80, step=180, gap=0.3),
   dict(type="chips", dur=4.5, text="Secundaria", size=100, items=["RED DE VÓLEY", "PELOTAS DE HANDBALL", "COLCHONETAS", "CRONÓMETRO"], big=True, isize=72, step=180, gap=0.3),
   dict(type="title", dur=3.5, text="¿No sabés cuántos de cada uno?", size=100, hl=["cuántos"], sub="Armá tu espacio te sugiere la lista con cantidades"),
   dict(type="steps", dur=5, text="Y con esa lista:", size=96, items=["Pedís ofertas a varios proveedores", "Comparás todo en el mismo formato", "Lo presentás en la escuela"], gap=0.9),
   dict(type="cta", dur=4, pre="¿Qué le sumarías?", word="COMENTÁ", sub="y completamos la lista entre todos"),
   dict(type="end", dur=3, text="Guardalo para la próxima compra de la escuela"),
  ],
  caption="La lista de material de educación física, nivel por nivel 🏫\n\n🟢 Inicial: aros, conos, colchonetas, pelotas blandas\n🟢 Primaria: sogas, vallas bajas, pelotas, chalecos\n🟢 Secundaria: red de vóley, pelotas de handball, colchonetas, cronómetro\n\n¿Qué le sumarías? Completemos la lista en los comentarios 👇\n\nCon Armá tu espacio te sugerimos cantidades y pedís ofertas a varios proveedores, todas en el mismo formato.\n\n#educacionfisica #profedeeducacionfisica #escuelas #colegios #equipamientodeportivo #nexofit"),

 dict(slug="abrir-estudio-4-cosas", date="2026-10-30T10:30:00", folder="semana-2/5-viernes-30-oct", seed=3003,
  title="Vas a abrir tu estudio: 4 cosas para definir antes de comprar",
  scenes=[
   dict(type="title", dur=3, kicker="ENTRENADORES", text="¿Vas a abrir tu estudio? Definí esto antes de comprar", size=96, hl=["antes de comprar"]),
   dict(type="number", dur=3.2, n="1", ncolor=GREEN, text="Cuántos metros tenés de verdad", hl=["de verdad"], sub="Medí largo y ancho, y mirá dónde están las columnas."),
   dict(type="number", dur=3.2, n="2", ncolor=GREEN, text="Qué clases vas a dar", hl=["clases"], sub="Funcional, pilates, musculación..."),
   dict(type="number", dur=3.2, n="3", ncolor=GREEN, text="Cuántos alumnos por turno", hl=["por turno"], sub="Eso define cuántas unidades de cada cosa."),
   dict(type="number", dur=3.2, n="4", ncolor=GREEN, text="Cuánto podés invertir hoy", hl=["hoy"], sub="Y qué es lo primero que comprás."),
   dict(type="grid", dur=5, text="Con eso, en Armá tu espacio:", size=80, badge="LISTA + 3D", items=["Medidas", "Tipo", "Lista", "3D", "Pedido", "Ofertas", "Elegís", "Listo"], bottom="Cargás tus medidas y ves en 3D cómo entra todo", bt=3.0),
   dict(type="cta", dur=4.2, word="ESTUDIO", sub="y te mandamos el link", comment=("profe_funcional", "ESTUDIO")),
   dict(type="end", dur=3, text="Guardalo para cuando abras"),
  ],
  caption="¿Vas a abrir tu propio estudio? Antes de comprar, definí esto 👇\n\n1️⃣ Cuántos metros tenés de verdad\n2️⃣ Qué clases vas a dar\n3️⃣ Cuántos alumnos por turno\n4️⃣ Cuánto podés invertir hoy\n\nCon eso, en Armá tu espacio cargás tus medidas, ves en 3D cómo entra todo y pedís ofertas por la lista.\n\n👉 Comentá ESTUDIO y te mandamos el link.\n\n#entrenadorpersonal #estudiodeentrenamiento #entrenamientofuncional #equipamientofitness #nexofit"),

 dict(slug="comision-club-pregunta", date="2026-10-31T10:30:00", folder="semana-2/6-sabado-31-oct", seed=3104,
  title="Lo que la comisión del club va a preguntar antes de aprobar la compra",
  scenes=[
   dict(type="title", dur=3, kicker="CLUBES", text="Las 3 preguntas que la comisión te va a hacer antes de aprobar la compra", size=88, hl=["la comisión"]),
   dict(type="number", dur=4, n="1", ncolor=LIME, text="¿Cuánto sale todo, con envío?", hl=["con envío?"], fix="Costo total puesto en el club", fixt=1.9),
   dict(type="number", dur=4, n="2", ncolor=LIME, text="¿Por qué ese y no otro?", hl=["no otro?"], fix="Una recomendación con el motivo", fixt=1.9),
   dict(type="number", dur=4, n="3", ncolor=LIME, text="¿Cuándo llega y qué garantía tiene?", hl=["garantía"], fix="Plazo y garantía en cada oferta", fixt=1.9),
   dict(type="title", dur=3.5, text="Con Nexo Fit llegás a la reunión con todo eso", size=96, bg="green", sub="Y con el cuadro comparativo listo para presentar"),
   dict(type="logo", dur=3, pre="Pedí ofertas en", sub="Gratis para el club que pide"),
   dict(type="cta", dur=4.5, pre="Etiquetá", word="AL TESORERO", sub="de tu club"),
   dict(type="end", dur=3, text="Guardalo para la próxima reunión"),
  ],
  caption="Las 3 preguntas que la comisión del club te va a hacer antes de aprobar la compra 🏟️\n\n1️⃣ ¿Cuánto sale todo, con envío?\n2️⃣ ¿Por qué ese y no otro?\n3️⃣ ¿Cuándo llega y qué garantía tiene?\n\nEn Nexo Fit pedís ofertas, las ves comparadas con costo total, plazo y garantía, y te llevás el cuadro comparativo para presentar.\n\n👉 Etiquetá al tesorero de tu club.\n\n#clubes #clubdebarrio #comisiondirectiva #equipamientodeportivo #nexofit"),

 dict(slug="oferta-clara-proveedor", date="2026-11-01T10:00:00", folder="semana-2/7-domingo-1-nov", seed=111,
  title="Proveedor: 4 cosas que tu oferta tiene que decir",
  scenes=[
   dict(type="title", dur=3, kicker="PROVEEDORES", text="Tu oferta puede perder aunque tengas el mejor precio", size=96, hl=["mejor precio"]),
   dict(type="number", dur=3.8, n="1", text="El envío no está claro", hl=["envío"], fix="Poné el costo total, con envío", fixt=1.9),
   dict(type="number", dur=3.8, n="2", text="No decís cuándo entregás", hl=["cuándo"], fix="Un plazo que puedas cumplir", fixt=1.9),
   dict(type="number", dur=3.8, n="3", text="La garantía no figura", hl=["garantía"], fix="Garantía por escrito", fixt=1.9),
   dict(type="number", dur=3.8, n="4", text="No dice hasta cuándo vale", hl=["hasta cuándo"], fix="Poné la validez de la oferta", fixt=1.9),
   dict(type="title", dur=3.6, text="En Nexo Fit cada oferta trae esos datos", size=96, bg="green", sub="Precio, envío, plazo, cuotas, garantía y validez, en el mismo formato"),
   dict(type="cta", dur=4.2, word="PROVEEDOR", ksize=150, sub="y te contamos cómo sumarte", comment=("equipos_fitness", "PROVEEDOR")),
   dict(type="end", dur=3, text="Guardalo para tu próxima oferta"),
  ],
  caption="Proveedor: tu oferta puede perder aunque tengas el mejor precio 👀\n\nRevisá que diga:\n✅ Costo total, con envío\n✅ Plazo de entrega que puedas cumplir\n✅ Garantía por escrito\n✅ Hasta cuándo vale\n\nEn Nexo Fit cada oferta trae precio, envío, plazo, cuotas, garantía y validez, en el mismo formato.\n\n👉 Comentá PROVEEDOR y te contamos cómo sumarte.\n\n#proveedoresfitness #equipamientofitness #fitnessargentina #mayorista #nexofit"),

 dict(slug="presupuesto-6-datos", date="2026-11-02T10:00:00", folder="semana-3/1-lunes-2-nov", seed=212,
  title="Si tu presupuesto no dice esto, pedí otro",
  scenes=[
   dict(type="title", dur=2.8, kicker="DUEÑOS DE GIMNASIO", text="Si tu presupuesto no dice esto, pedí otro", size=104, hl=["pedí otro"]),
   dict(type="checklist", dur=7.4, text="Tiene que decir:", size=96, items=["Precio total", "Costo de envío", "Plazo de entrega", "Cuotas", "Garantía", "Hasta cuándo vale"], gap=0.8, start=0.6),
   dict(type="chat", dur=5, text="Lo que a veces te llega:", size=84, msgs=[("them", "Te paso el precio. El envío se consulta", 0.4), ("them", "La entrega es a convenir", 1.4), ("them", "Cualquier cosa avisame", 2.4)], punch="¿Y la garantía?", pt=3.3, pcolor=RED),
   dict(type="title", dur=3.6, text="En Nexo Fit todas las ofertas traen esos datos", size=96, bg="green", sub="En el mismo formato, para comparar de una"),
   dict(type="cta", dur=4.5, word="EQUIPAR", sub="y te mandamos el link", comment=("gym_zona_sur", "EQUIPAR")),
   dict(type="end", dur=3, text="Guardalo para tu próximo presupuesto"),
  ],
  caption="Si tu presupuesto no dice esto, pedí otro 📋\n\n✅ Precio total\n✅ Costo de envío\n✅ Plazo de entrega\n✅ Cuotas\n✅ Garantía\n✅ Hasta cuándo vale\n\nEn Nexo Fit todas las ofertas traen esos datos en el mismo formato, así comparás de una.\n\n👉 Comentá EQUIPAR y te mandamos el link. Guardalo para tu próximo presupuesto 📌\n\n#gimnasio #dueñodegimnasio #presupuesto #equipamientofitness #fitnessargentina #nexofit"),

 dict(slug="kit-aire-libre-15", date="2026-11-03T10:00:00", folder="semana-3/2-martes-3-nov", seed=313,
  title="Clases al aire libre para 15 alumnos: el kit",
  scenes=[
   dict(type="title", dur=3, kicker="ENTRENADORES", text="¿Das clases en la plaza? El kit para 15 alumnos", size=96, hl=["15 alumnos"]),
   dict(type="checklist", dur=7, text="Lo básico:", size=96, items=["Conos y platos", "Escalera de agilidad", "Bandas elásticas", "Colchonetas livianas", "Bolso para llevar todo"], gap=0.9),
   dict(type="title", dur=3.5, text="¿Cuántos de cada uno?", size=104, hl=["Cuántos"], sub="Armá tu lista con cantidades y pedí ofertas por el kit completo"),
   dict(type="steps", dur=5, text="En Nexo Fit:", size=96, items=["Publicás tu lista", "Te ofertan varios proveedores", "Comparás y elegís"], gap=0.9),
   dict(type="cta", dur=4.2, word="KIT", sub="y te mandamos el link", comment=("entrena_en_la_plaza", "KIT")),
   dict(type="end", dur=3, text="Guardalo para tu próxima clase"),
  ],
  caption="¿Das clases al aire libre? El kit básico para 15 alumnos 🌳\n\n✅ Conos y platos\n✅ Escalera de agilidad\n✅ Bandas elásticas\n✅ Colchonetas livianas\n✅ Bolso para llevar todo\n\nArmá la lista con cantidades y pedí ofertas por el kit completo en Nexo Fit.\n\n👉 Comentá KIT y te mandamos el link. ¿Qué le sumarías?\n\n#entrenadorpersonal #entrenamientoalairelibre #entrenamientofuncional #equipamientofitness #nexofit"),
]

# ---------------------------------------------------------------- TIKTOKS (13-20 s, 12 h y 18 h)
H_GYM = "#gimnasio #dueñodegimnasio #equipamientofitness #fitnessargentina #nexofit"
H_ENT = "#entrenadorpersonal #entrenamientofuncional #equipamientofitness #fitnessargentina #nexofit"
H_COL = "#educacionfisica #profedeeducacionfisica #escuelas #equipamientodeportivo #nexofit"
H_CLUB = "#clubes #clubdebarrio #equipamientodeportivo #fitnessargentina #nexofit"
H_PROV = "#proveedoresfitness #equipamientofitness #mayorista #fitnessargentina #nexofit"

def probalo(dur=3.0):
    return dict(type="title", dur=dur, text="Probalo con tus medidas, en 3D", size=100, bg="green", sub="Armá tu espacio, en Nexo Fit")

BICIS = [("Bici", 0.5 + c * 1.4, 0.45 + r * 1.2, 0.7, 1.0, 0.8 + (r * 4 + c) * 0.22) for r in range(3) for c in range(4)]
REFORMERS = [("Reformer", 0.5 + c * 3.3, 0.6 + r * 1.6, 2.4, 0.7, 0.9 + (r * 2 + c) * 0.45) for r in range(2) for c in range(2)]
BOX = [("Rack", 0.4, 0.4, 2.4, 1.2), ("Remos", 3.2, 0.4, 2.4, 1.0), ("Kettlebells", 6.0, 0.4, 1.6, 1.0),
       ("Colchonetas", 0.4, 2.2, 4.0, 2.4), ("Cajones", 4.8, 2.3, 1.6, 1.0), ("Barras", 4.8, 3.8, 2.8, 0.8)]

T = [
 dict(slug="entran-12-bicis", date="2026-10-28T12:00:00", seed=2812, title="¿Entran 12 bicis de spinning en 6 × 4?",
  scenes=[dict(type="title", dur=2.4, kicker="¿ENTRA O NO ENTRA?", text="12 bicis de spinning en una sala de 6 × 4", size=96, hl=["6 × 4"]),
          dict(type="plan", dur=6, text="¿Y el profe? ¿Y el paso?", size=90, hl=["paso?"], room=(6, 4), items=BICIS, verdict="¿ENTRAN?", vt=3.9, note=NOTA),
          dict(type="cta", dur=3.8, pre="¿Vos qué decís?", word="SÍ o NO", sub="Comentalo"),
          probalo(), END_T],
  caption="¿Entran 12 bicis de spinning en una sala de 6 × 4? 🚴 Comentá SÍ o NO. Después probalo con tus medidas en 3D en Armá tu espacio 📐 " + H_GYM),

 dict(slug="que-miras-primero", date="2026-10-28T18:00:00", seed=2818, title="¿Qué mirás primero en un presupuesto?",
  scenes=[dict(type="title", dur=2.4, text="Comparás presupuestos: ¿qué mirás primero?", size=100, hl=["primero?"]),
          dict(type="chips", dur=3.6, text="Elegí uno:", size=96, items=["PRECIO", "ENVÍO", "PLAZO", "GARANTÍA"], big=True, isize=96, step=190, gap=0.3),
          dict(type="cta", dur=3.6, pre="Comentá", word="EL TUYO", sub="y contanos por qué"),
          dict(type="title", dur=3.2, text="En Nexo Fit la recomendación sale de lo que vos priorizás", size=88, hl=["vos priorizás"]),
          END_T],
  caption="Comparás presupuestos: ¿qué mirás primero? Precio, envío, plazo o garantía 👇 En Nexo Fit la recomendación sale de lo que vos priorizás. " + H_GYM),

 dict(slug="lo-primero-que-se-rompe", date="2026-10-29T12:00:00", seed=2912, title="¿Qué se rompe primero en el gimnasio de la escuela?",
  scenes=[dict(type="title", dur=2.6, kicker="PROFES", text="¿Qué es lo primero que se rompe en el gimnasio de la escuela?", size=90, hl=["se rompe"]),
          dict(type="chips", dur=3.6, text="¿Cuál?", size=100, items=["PELOTAS", "COLCHONETAS", "REDES", "AROS"], big=True, isize=96, step=190, gap=0.3),
          dict(type="cta", dur=3.6, pre="Contanos", word="COMENTÁ", sub="y armamos el ranking"),
          dict(type="title", dur=2.8, text="Cuando toque reponer, pedí ofertas en Nexo Fit", size=92, hl=["Nexo Fit"]),
          END_T],
  caption="Profe: ¿qué es lo primero que se rompe en el gimnasio de la escuela? 🏐 Comentá y armamos el ranking. " + H_COL),

 dict(slug="aviso-pedido-proveedor", date="2026-10-29T18:00:00", seed=2918, title="Proveedor: así te enterás de un pedido",
  scenes=[dict(type="title", dur=2.4, kicker="PROVEEDORES", text="Así te enterás de un pedido en Nexo Fit", size=100, hl=["pedido"]),
          dict(type="notifs", dur=5, text="Te llega por mail:", size=90, items=[("Pedido nuevo", "Con tu link privado para ofertar"), ("Eligieron tu oferta", "El comprador eligió la tuya"), ("Tu oferta vence en 2 días", "Te avisamos antes")], gap=0.8),
          dict(type="title", dur=2.4, text="Sin salir a buscar clientes", size=110, hl=["buscar clientes"]),
          dict(type="cta", dur=3.8, word="PROVEEDOR", ksize=150, sub="y te contamos cómo sumarte"),
          dict(type="end", dur=2.4, text="Compartilo con alguien que venda equipamiento", icon="none")],
  caption="Proveedor: así te enterás de un pedido en Nexo Fit 📩 Pedido nuevo con link privado, aviso si eligen tu oferta y antes de que venza. Comentá PROVEEDOR. " + H_PROV),

 dict(slug="cajon-madera-espuma", date="2026-10-30T12:00:00", seed=3012, title="Cajón pliométrico: ¿madera o espuma?",
  scenes=[dict(type="title", dur=2.4, kicker="ENTRENADORES", text="Cajón pliométrico: ¿madera o espuma?", size=104, hl=["madera", "espuma?"]),
          dict(type="chips", dur=3.2, text="¿Cuál usás en tus clases?", size=88, items=["MADERA", "ESPUMA"], big=True, isize=130, step=260, gap=0.4, y=820),
          dict(type="cta", dur=3.8, pre="Comentá", word="MADERA o ESPUMA", sub="y contanos por qué"),
          dict(type="title", dur=2.8, text="Cuando lo tengas decidido, pedí ofertas en Nexo Fit", size=90, hl=["Nexo Fit"]),
          END_T],
  caption="Cajón pliométrico: ¿madera o espuma? 📦 Comentá cuál usás y por qué. " + H_ENT),

 dict(slug="entran-4-reformers", date="2026-10-30T18:00:00", seed=3018, title="¿Entran 4 reformers en 7 × 5?",
  scenes=[dict(type="title", dur=2.4, kicker="¿ENTRA O NO ENTRA?", text="4 reformers en un estudio de 7 × 5", size=100, hl=["7 × 5"]),
          dict(type="plan", dur=5.6, text="¿Y queda lugar para moverse?", size=88, hl=["moverse?"], room=(7, 5), items=REFORMERS, verdict="¿ENTRAN?", vt=3.4, note=NOTA),
          dict(type="cta", dur=3.8, pre="¿Vos qué decís?", word="SÍ o NO", sub="Comentalo"),
          probalo(), END_T],
  caption="¿Entran 4 reformers en un estudio de 7 × 5? 🧘 Comentá SÍ o NO. Después probalo con tus medidas en 3D en Armá tu espacio 📐 #pilates #estudiodepilates #reformer #equipamientofitness #nexofit"),

 dict(slug="cuando-renovaron", date="2026-10-31T12:00:00", seed=3112, title="Club: ¿cuándo renovaron la sala por última vez?",
  scenes=[dict(type="title", dur=2.6, kicker="CLUBES", text="¿Cuándo renovaron la sala del club por última vez?", size=94, hl=["por última vez?"]),
          dict(type="chips", dur=3.8, text="Sé sincero:", size=96, items=["ESTE AÑO", "HACE 2 O 3 AÑOS", "HACE MÁS DE 5", "NUNCA"], big=True, isize=80, step=180, gap=0.3),
          dict(type="cta", dur=3.6, pre="Comentá", word="LA VERDAD", sub="nadie te juzga"),
          dict(type="title", dur=2.8, text="Cuando toque, pedí ofertas para toda la sala en Nexo Fit", size=88, hl=["toda la sala"]),
          END_T],
  caption="¿Cuándo renovaron la sala del club por última vez? 🏟️ Comentá la verdad 👇 " + H_CLUB),

 dict(slug="senales-renovar-sala", date="2026-10-31T18:00:00", seed=3118, title="3 señales de que tu sala pide renovación",
  scenes=[dict(type="title", dur=2.4, text="3 señales de que tu sala pide renovación", size=104, hl=["renovación"]),
          dict(type="number", dur=3, n="1", text="Hay fila para usar la misma máquina", hl=["fila"]),
          dict(type="number", dur=3, n="2", text="Equipos que nadie usa ocupando lugar", hl=["nadie usa"]),
          dict(type="number", dur=3, n="3", text="Lo que se rompe queda roto", hl=["queda roto"]),
          dict(type="cta", dur=3.6, pre="¿Cuál te pasa?", word="1, 2 o 3", ksize=170, sub="Comentalo"),
          END_T],
  caption="3 señales de que tu sala pide renovación 🔧 ¿Cuál te pasa? Comentá 1, 2 o 3. " + H_GYM),

 dict(slug="lo-llevas-vos", date="2026-11-01T12:00:00", seed=112, title="Entrenador: ¿el equipo lo llevás vos?",
  scenes=[dict(type="title", dur=2.6, kicker="ENTRENADORES", text="El equipo para la clase: ¿lo llevás vos o lo pone el alumno?", size=88, hl=["lo llevás vos"]),
          dict(type="chips", dur=3.6, text="¿Cómo lo hacés?", size=96, items=["LO LLEVO YO", "LO PONE EL ALUMNO", "MITAD Y MITAD"], big=True, isize=84, step=200, gap=0.35),
          dict(type="cta", dur=3.6, pre="Contanos", word="COMENTÁ", sub="¿cómo lo resolvés vos?"),
          dict(type="title", dur=3, text="Si lo llevás vos, armá tu kit y pedí ofertas en Nexo Fit", size=88, hl=["Nexo Fit"]),
          END_T],
  caption="Entrenador: el equipo para la clase, ¿lo llevás vos o lo pone el alumno? 🎒 Contanos cómo lo resolvés 👇 " + H_ENT),

 dict(slug="cuanto-cuesta-pedir", date="2026-11-01T18:00:00", seed=118, title="¿Cuánto cuesta pedir ofertas en Nexo Fit?",
  scenes=[dict(type="title", dur=2.4, text="¿Cuánto cuesta pedir ofertas en Nexo Fit?", size=104, hl=["¿Cuánto cuesta"]),
          dict(type="title", dur=2, text="Nada.", size=230, heavy=True, bg="green", y=760),
          dict(type="steps", dur=4.4, text="Pedís gratis:", size=96, items=["Publicás qué necesitás", "Te ofertan los proveedores", "Elegís solo si te conviene"], gap=0.8),
          dict(type="cta", dur=3.6, word="EQUIPAR", sub="y te mandamos el link"),
          END_T],
  caption="¿Cuánto cuesta pedir ofertas en Nexo Fit? Nada 💚 Publicás qué necesitás, te ofertan los proveedores y elegís solo si te conviene. Comentá EQUIPAR. " + H_GYM),

 dict(slug="nuevo-o-usado", date="2026-11-02T12:00:00", seed=212 + 1000, title="¿Equipos nuevos o usados para tu gimnasio?",
  scenes=[dict(type="title", dur=2.4, text="Para tu gimnasio: ¿equipos nuevos o usados?", size=104, hl=["nuevos", "usados?"]),
          dict(type="chips", dur=3, text="¿Qué elegís?", size=96, items=["NUEVOS", "USADOS"], big=True, isize=130, step=260, gap=0.4, y=820),
          dict(type="cta", dur=3.6, pre="Comentá", word="NUEVO o USADO", sub="y contanos por qué"),
          dict(type="title", dur=3, text="Si vas por nuevos, pedí ofertas a varios proveedores", size=90, hl=["varios proveedores"]),
          END_T],
  caption="Para tu gimnasio: ¿equipos nuevos o usados? 🤔 Comentá y contanos por qué. " + H_GYM),

 dict(slug="sin-ver-nombres", date="2026-11-02T18:00:00", seed=218 + 1000, title="Proveedor: acá gana la oferta, no el nombre",
  scenes=[dict(type="title", dur=2.6, kicker="PROVEEDORES", text="Acá no gana el que tiene más seguidores", size=104, hl=["más seguidores"]),
          dict(type="title", dur=3.2, text="El comprador compara las ofertas sin ver los nombres", size=92, hl=["sin ver los nombres"], sub="Los ve recién cuando elige"),
          dict(type="cards", dur=4.6, text="Gana la oferta", size=96, hl=["la oferta"], items=[("Oferta A", "$1.850.000", "Envío incluido · Entrega 10 días"), ("Oferta B", "$1.720.000", "Envío aparte · Entrega 25 días"), ("Oferta C", "$1.900.000", "Envío incluido · Garantía 2 años")], best=0, selt=2.6, note="Precios de ejemplo"),
          dict(type="cta", dur=3.6, word="PROVEEDOR", ksize=150, sub="y te contamos cómo sumarte"),
          dict(type="end", dur=2.4, text="Compartilo con alguien que venda equipamiento", icon="none")],
  caption="Proveedor: en Nexo Fit el comprador compara las ofertas sin ver los nombres hasta elegir. Gana la oferta 💪 Comentá PROVEEDOR. " + H_PROV),

 dict(slug="entra-box-8x5", date="2026-11-03T12:00:00", seed=312 + 1000, title="¿Entra un box para 12 alumnos en 8 × 5?",
  scenes=[dict(type="title", dur=2.4, kicker="¿ENTRA O NO ENTRA?", text="Un box de funcional para 12 alumnos en 8 × 5", size=96, hl=["8 × 5"]),
          dict(type="plan", dur=5.6, text="¿Entrenan 12 a la vez?", size=92, hl=["12 a la vez?"], room=(8, 5), items=BOX, verdict="¿ENTRAN?", vt=3.6, note=NOTA),
          dict(type="cta", dur=3.8, pre="¿Vos qué decís?", word="SÍ o NO", sub="Comentalo"),
          probalo(), END_T],
  caption="¿Entra un box de funcional para 12 alumnos en 8 × 5? 🏋️ Comentá SÍ o NO. Después probalo con tus medidas en 3D en Armá tu espacio 📐 #entrenamientofuncional #boxfuncional #entrenadorpersonal #equipamientofitness #nexofit"),

 dict(slug="que-compras-primero", date="2026-11-03T18:00:00", seed=318 + 1000, title="Equipás de cero: ¿qué comprás primero?",
  scenes=[dict(type="title", dur=2.4, text="Equipás tu gimnasio de cero: ¿qué comprás primero?", size=96, hl=["primero?"]),
          dict(type="chips", dur=3.6, text="Elegí uno:", size=96, items=["RACK", "CINTAS", "BICIS", "MANCUERNAS"], big=True, isize=96, step=190, gap=0.3),
          dict(type="cta", dur=3.6, pre="Comentá", word="LO PRIMERO", sub="y armamos la lista entre todos"),
          dict(type="title", dur=3, text="Después pedí ofertas por la lista completa", size=92, hl=["lista completa"]),
          END_T],
  caption="Equipás tu gimnasio de cero: ¿qué comprás primero? 🏋️ Comentá y armamos la lista entre todos 👇 " + H_GYM),
]

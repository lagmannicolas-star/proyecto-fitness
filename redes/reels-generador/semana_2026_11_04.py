"""Guiones semana 04/11 al 10/11/2026: 7 Reels (IG + TikTok, 10 h) y 14 TikToks (12 h y 18 h).
Cambio respecto a la semana anterior: el reel que más rindió (por lejos) fue la demo de Armá tu espacio en 3D,
y en TikTok el "¿Entra o no entra?". Por eso: más 3D (nueva escena "iso"), más plantas con medidas y quiz de
"¿cuántos entran?"; menos encuestas genéricas y listas sueltas."""
from engine import RED, GREEN, LIME, GREY, CARD

NOTA = "Medidas de ejemplo"
END_T = dict(type="end", dur=2.4, text="Seguinos para más")
END_SHARE = dict(type="end", dur=2.4, text="Compartilo con alguien que venda equipamiento", icon="none")

H_GYM = "#gimnasio #dueñodegimnasio #equipamientofitness #fitnessargentina #nexofit"
H_ENT = "#entrenadorpersonal #entrenamientofuncional #equipamientofitness #fitnessargentina #nexofit"
H_COL = "#educacionfisica #profedeeducacionfisica #escuelas #equipamientodeportivo #nexofit"
H_CLUB = "#clubes #clubdebarrio #equipamientodeportivo #fitnessargentina #nexofit"
H_PROV = "#proveedoresfitness #equipamientofitness #mayorista #fitnessargentina #nexofit"

def probalo(dur=3.0):
    return dict(type="title", dur=dur, text="Probalo con tus medidas, en 3D", size=100, bg="green", sub="Armá tu espacio, en Nexo Fit")

# ---------------------------------------------------------------- layouts (metros: label, x, y, ancho, largo[, alto 3D])
GYM_14x9 = [("Rack", 0.5, 0.5, 2.0, 1.6, 2.3), ("", 3.0, 0.5, 2.0, 1.6, 2.3),
            ("Banco", 6.0, 0.6, 0.6, 1.4, 0.5), ("", 7.2, 0.6, 0.6, 1.4, 0.5), ("", 8.4, 0.6, 0.6, 1.4, 0.5), ("", 9.6, 0.6, 0.6, 1.4, 0.5),
            ("Mancuernas", 11.0, 0.5, 2.5, 0.8, 1.0),
            ("Colchonetas", 0.6, 4.6, 5.6, 3.6, 0.1), ("Cajones", 7.4, 4.8, 2.2, 1.0, 0.6), ("Pesas rusas", 10.4, 4.8, 3.0, 0.8, 0.4),
            ("", 7.4, 7.2, 2.4, 0.6, 1.2)]

CLUB_12x8 = [("Rack", 0.4, 0.4, 2.0, 1.6, 2.3), ("", 2.8, 0.4, 2.0, 1.6, 2.3), ("", 5.2, 0.4, 2.0, 1.6, 2.3),
             ("Discos", 7.8, 0.4, 1.2, 0.8, 1.2), ("Mancuernas", 9.4, 0.4, 2.2, 0.8, 1.0),
             ("Banco", 0.6, 3.0, 0.6, 1.4, 0.5), ("", 1.8, 3.0, 0.6, 1.4, 0.5), ("", 3.0, 3.0, 0.6, 1.4, 0.5), ("", 4.2, 3.0, 0.6, 1.4, 0.5),
             ("Funcional", 6.0, 3.0, 5.6, 2.4, 0.1),
             ("Bici", 0.6, 6.2, 0.6, 1.2, 1.1), ("", 1.8, 6.2, 0.6, 1.2, 1.1), ("", 3.0, 6.2, 0.6, 1.2, 1.1), ("", 4.2, 6.2, 0.6, 1.2, 1.1)]

COLCH_30 = [("", 0.6 + c * 1.5, 0.8 + r * 1.2, 1.0, 0.5, 0.75 + (r * 6 + c) * 0.07) for r in range(5) for c in range(6)]

EST_A = [("Remo", 0.3, 0.3, 2.2, 0.6), ("Bici", 2.9, 0.3, 0.6, 1.2), ("Bici", 3.9, 0.3, 0.6, 1.2), ("Cajones", 5.0, 0.3, 0.7, 1.4),
         ("Pesas rusas", 5.0, 2.2, 0.7, 2.4), ("Colchonetas", 0.3, 3.9, 3.8, 0.8), ("Soga", 0.3, 1.6, 0.7, 2.0)]
EST_B = [("Colchonetas", 0.4, 0.4, 2.0, 2.0), ("Cajones", 2.9, 0.4, 1.0, 1.0), ("Pesas rusas", 4.4, 0.4, 1.2, 1.0),
         ("Remo", 2.9, 1.8, 2.2, 0.6), ("Bici", 0.5, 3.1, 0.6, 1.2), ("Bici", 1.5, 3.1, 0.6, 1.2), ("Soga", 3.0, 3.4, 2.5, 0.8)]
EST_C = [("Mat", 0.4 + c * 1.4, 0.4 + r * 1.3, 1.0, 0.5) for r in range(2) for c in range(4)] + \
        [("Cajones", 0.4, 3.2, 1.6, 0.8), ("Pesas rusas", 2.3, 3.2, 1.6, 0.8), ("Remo", 4.2, 3.0, 1.4, 1.2)]

GYM_15x10 = [("Cinta", 0.4 + c * 1.2, 0.4, 0.8, 2.0, 1.4) for c in range(4)] + [("Bici", 5.4 + c * 1.0, 0.4, 0.6, 1.2, 1.1) for c in range(3)] + \
            [("Rack", 9.0, 0.4, 2.0, 1.6, 2.3), ("Rack", 11.6, 0.4, 2.0, 1.6, 2.3), ("Multi", 0.6, 4.0, 3.0, 2.0, 2.2),
             ("Banco", 9.2, 3.4, 0.6, 1.4, 0.5), ("Banco", 10.6, 3.4, 0.6, 1.4, 0.5), ("Mancuernas", 12.0, 3.6, 2.5, 0.8, 1.0),
             ("Funcional", 4.6, 4.2, 4.0, 3.0, 0.1), ("Remo", 0.6, 7.4, 2.2, 0.6, 0.6), ("Remo", 0.6, 8.6, 2.2, 0.6, 0.6)]
GYM_11x7_LLENO = [("Cinta", 0.3 + c * 1.0, 0.3, 0.8, 2.0, 1.4) for c in range(4)] + [("Bici", 4.4 + c * 0.8, 0.3, 0.6, 1.2, 1.1) for c in range(3)] + \
                 [("Rack", 7.0, 0.3, 2.0, 1.6, 2.3), ("Rack", 8.8, 0.4, 2.0, 1.6, 2.3, 0.8, RED), ("Multi", 0.4, 2.8, 3.0, 2.0, 2.2),
                  ("Banco", 7.2, 2.4, 0.6, 1.4, 0.5), ("Banco", 8.2, 2.4, 0.6, 1.4, 0.5, 0.8, RED), ("Mancuernas", 8.2, 4.2, 2.5, 0.8, 1.0),
                  ("Funcional", 3.8, 2.6, 3.2, 2.6, 0.1), ("Remo", 0.4, 5.4, 2.2, 0.6, 0.6, 0.8, RED), ("Remo", 3.0, 5.6, 2.2, 0.6, 0.6, 0.8, RED)]
GYM_11x7_OK = [("Cinta", 0.4 + c * 1.2, 0.4, 0.8, 2.0) for c in range(3)] + [("Bici", 4.2 + c * 1.0, 0.4, 0.6, 1.2) for c in range(2)] + \
              [("Rack", 7.0, 0.4, 2.0, 1.6), ("Multi", 0.6, 3.6, 3.0, 2.0), ("Banco", 7.4, 2.9, 0.6, 1.4),
               ("Mancuernas", 8.0, 5.6, 2.5, 0.8), ("Funcional", 4.2, 3.0, 2.6, 3.4), ("Remo", 8.2, 3.6, 2.2, 0.6)]

DEPO_8x6 = [("Rack", 0.4, 0.4, 2.0, 1.6, 2.3), ("Rack", 2.8, 0.4, 2.0, 1.6, 2.3), ("Mancuernas", 5.4, 0.4, 2.2, 0.8, 1.0),
            ("Banco", 0.6, 2.8, 0.6, 1.4, 0.5), ("", 1.8, 2.8, 0.6, 1.4, 0.5), ("Colchonetas", 3.4, 2.6, 4.2, 1.8, 0.1),
            ("Bici", 0.6, 4.6, 0.6, 1.2, 1.1), ("", 1.6, 4.6, 0.6, 1.2, 1.1), ("", 2.6, 4.6, 0.6, 1.2, 1.1), ("Cajones", 5.6, 4.9, 1.8, 0.8, 0.6)]

# ---------------------------------------------------------------- REELS (25-35 s, 10 h, IG + TikTok)
REELS = [
 dict(slug="gimnasio-3d-antes-de-comprar", date="2026-11-04T10:00:00", folder="semana-3/3-miercoles-4-nov", seed=4101,
  title="Mirá tu gimnasio en 3D antes de comprar",
  scenes=[
   dict(type="title", dur=2.8, kicker="DUEÑOS DE GIMNASIO", text="Mirá tu gimnasio en 3D antes de gastar un peso", size=100, hl=["en 3D"]),
   dict(type="steps", dur=4.6, text="En Armá tu espacio:", size=96, items=["Elegís Gimnasio", "Ponés cuántos entrenan a la vez", "Te sugiere la lista con cantidades"], gap=0.8),
   dict(type="checklist", dur=5, text="Para 20 personas, musculación y funcional:", size=80, items=["4 bancos regulables", "3 barras olímpicas", "2 racks de sentadillas", "20 pesas rusas", "20 colchonetas"], gap=0.6, start=0.6),
   dict(type="iso", dur=6, text="Cargás tus medidas: 14 × 9", size=92, hl=["14 × 9"], room=(14, 9), items=GYM_14x9, verdict="ENTRA TODO", vt=4.2, note=NOTA),
   dict(type="title", dur=3.4, text="Movés cada pieza, la girás y ves cuánto piso queda libre", size=92, hl=["piso queda libre"], sub="A escala real"),
   dict(type="steps", dur=4.6, text="Y con esa lista:", size=96, items=["Pedís ofertas por todo junto", "Te ofertan varios proveedores", "Elegís la que te conviene"], gap=0.8),
   dict(type="cta", dur=4.2, word="3D", sub="y te mandamos el link", comment=("gym_del_centro", "3D")),
   dict(type="end", dur=3, text="Guardalo para cuando equipes"),
  ],
  caption="Mirá tu gimnasio en 3D antes de gastar un peso 👀\n\nEn Armá tu espacio elegís Gimnasio, ponés cuántos entrenan a la vez y te sugiere la lista con cantidades. Cargás las medidas de tu lugar, movés cada pieza, la girás y ves cuánto piso queda libre, a escala real.\n\nCon esa lista pedís ofertas a varios proveedores y elegís la que te conviene.\n\n👉 Comentá 3D y te mandamos el link.\n\n#gimnasio #dueñodegimnasio #abrirungimnasio #equipamientofitness #fitnessargentina #nexofit"),

 dict(slug="pretemporada-sala-club", date="2026-11-05T10:00:00", folder="semana-3/4-jueves-5-nov", seed=4202,
  title="Pretemporada: ¿entra la sala de pesas del club en 12 × 8?",
  scenes=[
   dict(type="title", dur=3, kicker="CLUBES", text="Pretemporada: ¿entra la sala de pesas del club en 12 × 8?", size=94, hl=["12 × 8?"]),
   dict(type="plan", dur=6, text="3 racks, 4 bancos, 4 bicis y zona funcional", size=80, room=(12, 8), items=[it[:5] + (0.7 + i * 0.25,) for i, it in enumerate(CLUB_12x8)], verdict="¿ENTRA?", vt=4.4, note=NOTA),
   dict(type="iso", dur=5.4, text="Así se ve en 3D", size=96, hl=["en 3D"], room=(12, 8), items=[it + (0.6 + i * 0.12,) for i, it in enumerate(CLUB_12x8)], verdict="ENTRA Y QUEDA PASO", vt=3.4, note=NOTA),
   dict(type="title", dur=3.4, text="Probalo con las medidas reales del club", size=96, hl=["medidas reales"], sub="En Armá tu espacio lo ves en 3D, a escala, antes de comprar"),
   dict(type="steps", dur=5, text="Después:", size=96, items=["Pedís ofertas por la lista", "Comparás costo total, plazo y garantía", "Bajás el cuadro comparativo para la comisión"], gap=0.9),
   dict(type="cta", dur=4.2, pre="Mandáselo", word="AL PROFE", sub="que arma la pretemporada del club"),
   dict(type="end", dur=3, text="Guardalo para la pretemporada"),
  ],
  caption="Pretemporada: ¿entra la sala de pesas del club en 12 × 8? 🏟️\n\n3 racks, 4 bancos, 4 bicis y una zona funcional. En Armá tu espacio cargás las medidas reales y lo ves en 3D, a escala, antes de comprar.\n\nDespués pedís ofertas por la lista, comparás costo total, plazo y garantía, y bajás el cuadro comparativo para la comisión.\n\n👉 Mandáselo al profe que arma la pretemporada.\n\n#clubes #clubdebarrio #pretemporada #preparacionfisica #equipamientodeportivo #nexofit"),

 dict(slug="colchonetas-sum-escuela", date="2026-11-06T10:00:00", folder="semana-3/5-viernes-6-nov", seed=4303,
  title="¿Entran 30 colchonetas en el SUM de la escuela?",
  scenes=[
   dict(type="title", dur=3, kicker="PROFES DE EDUCACIÓN FÍSICA", text="¿Entran 30 colchonetas en el SUM de la escuela?", size=100, hl=["30 colchonetas"]),
   dict(type="plan", dur=5.4, text="Un SUM de 10 × 7", size=100, hl=["10 × 7"], room=(10, 7), items=COLCH_30, verdict="¿ENTRAN 30?", vt=3.6, note=NOTA),
   dict(type="plan", dur=3.6, text="Sí, y con paso entre filas", size=90, hl=["paso entre filas"], room=(10, 7), items=[it[:5] + (0.0,) for it in COLCH_30], verdict="ENTRAN", vt=0.8, note=NOTA),
   dict(type="chips", dur=4, text="Para la clase, sumá:", size=96, items=["CONOS", "AROS", "PELOTAS", "SOGAS"], big=True, isize=88, step=185, gap=0.3),
   dict(type="steps", dur=5, text="En Nexo Fit:", size=96, items=["Armás la lista con cantidades", "Te ofertan varios proveedores", "Bajás el cuadro comparativo para el expediente"], gap=0.9),
   dict(type="cta", dur=4.2, word="ESCUELA", sub="y te mandamos el link", comment=("profe_ana_edfisica", "ESCUELA")),
   dict(type="end", dur=3, text="Compartilo con el equipo de educación física"),
  ],
  caption="¿Entran 30 colchonetas en el SUM de la escuela? 🏫\n\nEn un SUM de 10 × 7, con colchonetas de 1 × 0,50: entran, y con paso entre filas. Probalo con las medidas de tu escuela en Armá tu espacio.\n\nArmás la lista con cantidades, te ofertan varios proveedores y bajás el cuadro comparativo para el expediente de compra.\n\n👉 Comentá ESCUELA y te mandamos el link.\n\n#educacionfisica #profedeeducacionfisica #escuelas #colegios #equipamientodeportivo #nexofit"),

 dict(slug="estudio-6x5-3-armados", date="2026-11-07T10:00:00", folder="semana-3/6-sabado-7-nov", seed=4404,
  title="Tu estudio de funcional en 6 × 5: ¿cuál de estos 3 armados elegís?",
  scenes=[
   dict(type="title", dur=3, kicker="ENTRENADORES", text="Mismo estudio de 6 × 5, mismo equipo. ¿Cuál armado elegís?", size=92, hl=["¿Cuál armado"]),
   dict(type="plan", dur=4.4, text="Armado 1: todo contra las paredes", size=84, hl=["Armado 1:"], room=(6, 5), items=EST_A, verdict="1", vt=2.8, note=NOTA),
   dict(type="plan", dur=4.4, text="Armado 2: por zonas", size=84, hl=["Armado 2:"], room=(6, 5), items=EST_B, verdict="2", vt=2.8, note=NOTA),
   dict(type="plan", dur=4.4, text="Armado 3: colchonetas en filas", size=84, hl=["Armado 3:"], room=(6, 5), items=EST_C, verdict="3", vt=2.8, note=NOTA),
   dict(type="cta", dur=4.2, pre="¿Cuál elegís?", word="1, 2 o 3", ksize=170, sub="Comentalo y contanos por qué"),
   dict(type="title", dur=3.6, text="Probá los tuyos: arrastrás cada pieza y la girás 90°", size=92, bg="green", sub="Armá tu espacio, en Nexo Fit"),
   dict(type="end", dur=3, text="Guardalo para cuando armes tu estudio"),
  ],
  caption="Mismo estudio de 6 × 5, mismo equipo, 3 armados distintos 🏋️\n\n1️⃣ Todo contra las paredes\n2️⃣ Por zonas\n3️⃣ Colchonetas en filas\n\n¿Cuál elegís? Comentá 1, 2 o 3 y contanos por qué 👇\n\nProbá los tuyos en Armá tu espacio: cargás tus medidas, arrastrás cada pieza y la girás 90°.\n\n#entrenadorpersonal #estudiodeentrenamiento #entrenamientofuncional #equipamientofitness #nexofit"),

 dict(slug="proveedor-pedido-con-lista", date="2026-11-08T10:00:00", folder="semana-3/7-domingo-8-nov", seed=4505,
  title="Proveedor: así te llega un pedido con lista y cantidades",
  scenes=[
   dict(type="title", dur=3, kicker="PROVEEDORES", text="Te llega el pedido con la lista y las cantidades. Vos ofertás.", size=92, hl=["Vos ofertás."]),
   dict(type="checklist", dur=5.4, text="Un pedido de ejemplo:", size=92, items=["Pesas rusas × 20", "Colchonetas × 20", "Bancos regulables × 4", "Barras olímpicas × 3", "Racks de sentadillas × 2"], gap=0.6, start=0.6),
   dict(type="title", dur=3.6, text="Cargás tu oferta en un solo formato", size=100, hl=["un solo formato"], sub="Precio, envío, plazo, cuotas y garantía"),
   dict(type="cards", dur=5, text="El comprador compara sin ver nombres", size=86, hl=["sin ver nombres"], items=[("Oferta A", "$2.300.000", "Envío aparte · Entrega 20 días"), ("Oferta B", "$2.450.000", "Envío incluido · Entrega 7 días"), ("Oferta C", "$2.380.000", "Envío incluido · Entrega 30 días")], best=1, selt=2.8, note="Precios de ejemplo"),
   dict(type="title", dur=3, text="Sin salir a buscar clientes: el pedido te llega por mail", size=92, bg="green"),
   dict(type="cta", dur=4.2, word="PROVEEDOR", ksize=150, sub="y te contamos cómo sumarte", comment=("equipamiento_sur", "PROVEEDOR")),
   dict(type="end", dur=3, text="Compartilo con alguien que venda equipamiento", icon="none"),
  ],
  caption="Proveedor: así te llega un pedido en Nexo Fit 📩\n\nCon la lista y las cantidades ya armadas. Cargás tu oferta en un solo formato (precio, envío, plazo, cuotas y garantía) y el comprador compara sin ver nombres hasta elegir.\n\nSin salir a buscar clientes: el pedido te llega por mail con tu link privado.\n\n👉 Comentá PROVEEDOR y te contamos cómo sumarte.\n\n#proveedoresfitness #equipamientofitness #mayorista #distribuidor #fitnessargentina #nexofit"),

 dict(slug="mudanza-local-mas-chico", date="2026-11-09T10:00:00", folder="semana-4/1-lunes-9-nov", seed=4606,
  title="Te mudás a un local más chico: ¿qué entra?",
  scenes=[
   dict(type="title", dur=3, kicker="DUEÑOS DE GIMNASIO", text="Te mudás a un local más chico. ¿Qué se viene con vos?", size=96, hl=["más chico"]),
   dict(type="iso", dur=4.8, text="Hoy: 15 × 10", size=100, hl=["15 × 10"], room=(15, 10), items=[it + (0.6 + i * 0.12,) for i, it in enumerate(GYM_15x10)], note=NOTA),
   dict(type="iso", dur=5, text="Local nuevo: 11 × 7", size=100, hl=["11 × 7"], room=(11, 7), items=[it if len(it) > 6 else it + (0.6 + i * 0.12,) for i, it in enumerate(GYM_11x7_LLENO)], verdict="NO ENTRA TODO", vcolor=RED, vt=3.2, note=NOTA),
   dict(type="plan", dur=5, text="Sacás un rack, una cinta y los remos", size=86, room=(11, 7), items=[it + (0.6 + i * 0.15,) for i, it in enumerate(GYM_11x7_OK)], verdict="ASÍ SÍ", vt=3.2, note=NOTA),
   dict(type="title", dur=3.4, text="Probá cada versión en 3D antes de mudarte", size=96, hl=["antes de mudarte"], sub="Armá tu espacio, en Nexo Fit"),
   dict(type="cta", dur=4.4, pre="¿Qué sacarías vos?", word="COMENTÁ", sub="cardio, máquinas o peso libre"),
   dict(type="end", dur=3, text="Guardalo si estás por mudarte"),
  ],
  caption="Te mudás a un local más chico: ¿qué se viene con vos? 📦\n\nDe 15 × 10 a 11 × 7 no entra todo. Antes de mudarte, probá cada versión en 3D con las medidas reales en Armá tu espacio: movés, girás y sacás piezas hasta que quede paso.\n\n👉 ¿Qué sacarías primero: cardio, máquinas o peso libre? Comentalo 👇\n\n#gimnasio #dueñodegimnasio #mudanza #equipamientofitness #fitnessargentina #nexofit"),

 dict(slug="deposito-gimnasio-club", date="2026-11-10T10:00:00", folder="semana-4/2-martes-10-nov", seed=4707,
  title="Club: ¿y si el salón que usan de depósito fuera el gimnasio?",
  scenes=[
   dict(type="title", dur=3, kicker="CLUBES", text="Ese salón del club que usan de depósito...", size=100, hl=["de depósito"]),
   dict(type="title", dur=2.4, text="¿Y si fuera el gimnasio?", size=130, heavy=True, bg="green"),
   dict(type="plan", dur=5, text="Salón de 8 × 6", size=96, hl=["8 × 6"], room=(8, 6), items=[it[:5] + (0.7 + i * 0.3,) for i, it in enumerate(DEPO_8x6)], verdict="¿ENTRA?", vt=3.8, note=NOTA),
   dict(type="iso", dur=5, text="Así se ve en 3D", size=96, hl=["en 3D"], room=(8, 6), items=[it + (0.6 + i * 0.15,) for i, it in enumerate(DEPO_8x6)], verdict="ENTRA", vt=3.2, note=NOTA),
   dict(type="steps", dur=5, text="Para llevarlo a la comisión:", size=88, items=["Armás la lista en Armá tu espacio", "Pedís ofertas a varios proveedores", "Bajás el cuadro comparativo"], gap=0.9),
   dict(type="cta", dur=4.2, pre="Mandáselo", word="A LA COMISIÓN", sub="de tu club"),
   dict(type="end", dur=3, text="Guardalo para la próxima reunión"),
  ],
  caption="Ese salón del club que usan de depósito… ¿y si fuera el gimnasio? 🏟️\n\nEn Armá tu espacio cargás las medidas, ves en 3D cómo entra el equipamiento y armás la lista. Pedís ofertas a varios proveedores y bajás el cuadro comparativo para llevar a la comisión.\n\n👉 Mandáselo a la comisión de tu club.\n\n#clubes #clubdebarrio #comisiondirectiva #gimnasio #equipamientodeportivo #nexofit"),
]

# ---------------------------------------------------------------- TIKTOKS (13-20 s, 12 h y 18 h)
CINTAS = [("Cinta", 0.3 + c * 1.3, 0.3, 0.8, 2.0, 0.8 + c * 0.2) for c in range(6)] + [("Elíptico", 0.6 + c * 1.9, 2.4, 0.7, 1.4, 2.0 + c * 0.25) for c in range(4)]
PILATES = [("Mat", 0.4 + c * 2.4, 0.3 + r * 0.75, 1.8, 0.6, 0.8 + (r * 2 + c) * 0.2) for r in range(5) for c in range(2)]
VESTUARIO = [("Rack", 0.3, 0.3, 2.0, 1.6), ("Banco", 2.8, 0.4, 0.6, 1.4), ("Banco", 3.8, 0.4, 0.6, 1.4), ("Mancuernas", 3.2, 4.0, 2.5, 0.8),
             ("Bici", 0.4, 2.7, 0.6, 1.2), ("Bici", 1.4, 2.7, 0.6, 1.2), ("Colchonetas", 2.8, 2.3, 2.8, 1.2)]
HOME = [("Colchoneta", 0.3, 0.3, 1.8, 0.6, 0.05), ("Banco", 0.4, 1.4, 0.6, 1.3, 0.5), ("Mancuernas", 2.0, 1.4, 0.7, 0.5, 0.8), ("Pesa rusa", 2.2, 2.3, 0.4, 0.4, 0.3)]
GIRO_MAL = [("Rack", 0.3, 0.3, 2.0, 1.6), ("Banco", 2.8, 1.4, 1.4, 0.6, 1.4, RED), ("Mancuernas", 3.2, 0.3, 2.5, 0.8), ("Colchonetas", 0.3, 2.6, 2.2, 1.1)]
GIRO_OK = [("Rack", 0.3, 0.3, 2.0, 1.6, 0.0), ("Banco", 2.8, 1.4, 0.6, 1.4, 0.4), ("Mancuernas", 3.2, 0.3, 2.5, 0.8, 0.0), ("Colchonetas", 0.3, 2.6, 2.2, 1.1, 0.0)]
BICIS_15 = [("Profe", 3.0, 0.2, 1.0, 1.0, 0.8, LIME)] + [("Bici", 0.6 + c * 1.3, 1.6 + r * 1.15, 0.6, 1.0, 1.0 + (r * 5 + c) * 0.15, GREEN) for r in range(3) for c in range(5)]
PESO_LIBRE = [("Rack", 0.3, 0.3, 2.0, 1.6, 2.3), ("Banco", 2.7, 0.5, 0.6, 1.4, 0.5), ("Discos", 3.9, 0.4, 0.8, 0.8, 1.2),
              ("Banco", 3.6, 2.0, 0.6, 1.4, 0.5), ("Mancuernas", 0.3, 3.0, 2.4, 0.7, 1.0)]
CIRCUITO = [(lab, 0.4 + (i % 4) * 1.4, 0.5 if i < 4 else 2.5, 1.0, 1.0, 0.9 + i * 0.3) for i, lab in enumerate(["Remo", "Cajón", "Pesas", "Soga", "Bandas", "Bici", "Mat", "Balón"])]

T = [
 dict(slug="cintas-y-elipticos-8x4", date="2026-11-04T12:00:00", seed=4112, title="¿Entran 6 cintas y 4 elípticos en 8 × 4?",
  scenes=[dict(type="title", dur=2.4, kicker="¿ENTRA O NO ENTRA?", text="6 cintas y 4 elípticos en una sala de 8 × 4", size=96, hl=["8 × 4"]),
          dict(type="plan", dur=5.6, text="¿Y el paso para circular?", size=88, hl=["paso"], room=(8, 4), items=CINTAS, verdict="¿ENTRAN?", vt=3.6, note=NOTA),
          dict(type="cta", dur=3.6, pre="¿Vos qué decís?", word="SÍ o NO", sub="Comentalo"),
          probalo(), END_T],
  caption="¿Entran 6 cintas y 4 elípticos en una sala de 8 × 4? 🏃 Comentá SÍ o NO. Después probalo con tus medidas en 3D en Armá tu espacio 📐 #gimnasio #dueñodegimnasio #cardio #equipamientofitness #nexofit"),

 dict(slug="pelotas-clase-30", date="2026-11-04T18:00:00", seed=4118, title="Clase de 30 chicos: ¿cuántas pelotas necesitás?",
  scenes=[dict(type="title", dur=2.4, kicker="PROFES", text="Clase de 30 chicos: ¿cuántas pelotas necesitás?", size=96, hl=["cuántas pelotas"]),
          dict(type="chips", dur=3.4, text="¿Cómo lo hacés vos?", size=92, items=["UNA POR CHICO", "UNA CADA DOS", "UNA POR GRUPO"], big=True, isize=84, step=200, gap=0.35),
          dict(type="cta", dur=3.6, pre="Contanos", word="COMENTÁ", sub="y vemos qué hace cada profe"),
          dict(type="title", dur=2.8, text="Cuando lo tengas claro, pedí ofertas por la lista en Nexo Fit", size=86, hl=["Nexo Fit"]),
          END_T],
  caption="Profe: clase de 30 chicos, ¿cuántas pelotas necesitás? ⚽ ¿Una por chico, una cada dos o una por grupo? Comentá cómo lo hacés 👇 " + H_COL),

 dict(slug="pilates-mat-5x4", date="2026-11-05T12:00:00", seed=4212, title="¿Entran 10 alumnas de pilates mat en 5 × 4?",
  scenes=[dict(type="title", dur=2.4, kicker="¿ENTRA O NO ENTRA?", text="Pilates mat para 10 en un estudio de 5 × 4", size=96, hl=["5 × 4"]),
          dict(type="plan", dur=5.6, text="Mats de 1,80 × 0,60", size=88, hl=["1,80 × 0,60"], room=(5, 4), items=PILATES, verdict="¿ENTRAN 10?", vt=3.6, note=NOTA),
          dict(type="cta", dur=3.6, pre="¿Vos qué decís?", word="SÍ o NO", sub="Comentalo"),
          probalo(), END_T],
  caption="¿Entra una clase de pilates mat para 10 en un estudio de 5 × 4? 🧘 Comentá SÍ o NO. Después probalo con tus medidas en 3D en Armá tu espacio 📐 #pilates #pilatesmat #entrenadorpersonal #equipamientofitness #nexofit"),

 dict(slug="asi-ve-tu-oferta", date="2026-11-05T18:00:00", seed=4218, title="Proveedor: así ve tu oferta el comprador",
  scenes=[dict(type="title", dur=2.4, kicker="PROVEEDORES", text="Así ve tu oferta el comprador en Nexo Fit", size=100, hl=["tu oferta"]),
          dict(type="cards", dur=4.8, text="Todas en el mismo formato", size=92, hl=["mismo formato"], items=[("Oferta A", "$980.000", "Envío incluido · Entrega 10 días"), ("Oferta B", "$910.000", "Envío aparte · Entrega 30 días"), ("Oferta C", "$1.020.000", "Envío incluido · Garantía 1 año")], best=0, selt=2.8, note="Precios de ejemplo"),
          dict(type="title", dur=2.8, text="Y recibe una recomendación según lo que más le importa", size=88, hl=["lo que más le importa"]),
          dict(type="cta", dur=3.6, word="PROVEEDOR", ksize=150, sub="y te contamos cómo sumarte"),
          END_SHARE],
  caption="Proveedor: así ve tu oferta el comprador en Nexo Fit 👀 Todas en el mismo formato y con una recomendación según lo que más le importa: precio, envío, plazo o garantía. Comentá PROVEEDOR. " + H_PROV),

 dict(slug="rack-pared-o-medio", date="2026-11-06T12:00:00", seed=4312, title="¿El rack va contra la pared o en el medio?",
  scenes=[dict(type="title", dur=2.4, text="¿El rack va contra la pared o en el medio de la sala?", size=96, hl=["pared", "en el medio"]),
          dict(type="chips", dur=3, text="¿Dónde lo ponés?", size=92, items=["PARED", "MEDIO"], big=True, isize=130, step=260, gap=0.4, y=820),
          dict(type="cta", dur=3.6, pre="Comentá", word="PARED o MEDIO", sub="y contanos por qué"),
          dict(type="title", dur=3, text="Probá las dos en 3D con tus medidas", size=96, bg="green", sub="Armá tu espacio, en Nexo Fit"),
          END_T],
  caption="¿El rack va contra la pared o en el medio de la sala? 🏋️ Comentá PARED o MEDIO y contanos por qué 👇 Después probá las dos en 3D en Armá tu espacio. " + H_GYM),

 dict(slug="vestuario-viejo-6x5", date="2026-11-06T18:00:00", seed=4318, title="Club: ¿entra una sala de pesas en el vestuario viejo?",
  scenes=[dict(type="title", dur=2.4, kicker="CLUBES", text="¿Entra una sala de pesas en el vestuario viejo del club?", size=92, hl=["vestuario viejo"]),
          dict(type="plan", dur=5.6, text="Vestuario de 6 × 5", size=96, hl=["6 × 5"], room=(6, 5), items=VESTUARIO, verdict="¿ENTRA?", vt=3.6, note=NOTA),
          dict(type="cta", dur=3.6, pre="¿Vos qué decís?", word="SÍ o NO", sub="Comentalo"),
          probalo(), END_T],
  caption="¿Entra una sala de pesas en el vestuario viejo del club? 🏟️ 6 × 5: comentá SÍ o NO. Después probalo con las medidas del club en Armá tu espacio 📐 " + H_CLUB),

 dict(slug="home-gym-alumno-3x3", date="2026-11-07T12:00:00", seed=4412, title="Entrenador: ¿entra el home gym de tu alumno en 3 × 3?",
  scenes=[dict(type="title", dur=2.4, kicker="ENTRENADORES", text="¿Entra el home gym de tu alumno en 3 × 3?", size=100, hl=["3 × 3?"]),
          dict(type="iso", dur=5.4, text="Banco, mancuernas, pesa rusa y colchoneta", size=80, room=(3, 3), items=HOME, lsize=30, maxh=780, top=760, verdict="¿ENTRA?", vt=3.4, note=NOTA),
          dict(type="cta", dur=3.6, pre="¿Vos qué decís?", word="SÍ o NO", sub="Comentalo"),
          dict(type="title", dur=3, text="En Armá tu espacio elegís Mi casa y lo ves en 3D", size=90, bg="green", sub="Mandale el link a tu alumno"),
          END_T],
  caption="Entrenador: ¿entra el home gym de tu alumno en 3 × 3? 🏠 Comentá SÍ o NO. En Armá tu espacio elegís Mi casa, cargás las medidas y lo ves en 3D. " + H_ENT),

 dict(slug="girar-90-paso-libre", date="2026-11-07T18:00:00", seed=4418, title="Girás una pieza 90° y te queda el paso libre",
  scenes=[dict(type="title", dur=2.4, text="Girás una pieza 90° y te cambia la sala", size=104, hl=["90°"]),
          dict(type="plan", dur=3.6, text="Así, el banco tapa el paso", size=90, hl=["tapa el paso"], room=(6, 4), items=GIRO_MAL, verdict="SIN PASO", vcolor=RED, vt=2.0, note=NOTA),
          dict(type="plan", dur=3.6, text="Girado 90°", size=100, hl=["90°"], room=(6, 4), items=GIRO_OK, verdict="PASO LIBRE", vt=1.4, note=NOTA),
          dict(type="cta", dur=3.6, word="3D", sub="y te mandamos el link para probarlo"),
          END_T],
  caption="Girás una pieza 90° y te cambia la sala 🔄 En Armá tu espacio arrastrás cada pieza y la girás con un botón, a escala real. Comentá 3D y te mandamos el link. " + H_GYM),

 dict(slug="si-te-aprueban-manana", date="2026-11-08T12:00:00", seed=4512, title="Profe: si mañana te aprueban la compra, ¿qué pedís?",
  scenes=[dict(type="title", dur=2.4, kicker="PROFES", text="Si mañana te aprueban la compra, ¿qué pedís primero?", size=94, hl=["primero?"]),
          dict(type="chips", dur=3.6, text="Elegí uno:", size=96, items=["COLCHONETAS", "PELOTAS", "AROS Y CONOS", "RED DE VÓLEY"], big=True, isize=84, step=185, gap=0.3),
          dict(type="cta", dur=3.6, pre="Comentá", word="LO PRIMERO", sub="y armamos la lista entre todos"),
          dict(type="title", dur=2.8, text="Después pedís ofertas por la lista en Nexo Fit", size=92, hl=["Nexo Fit"]),
          END_T],
  caption="Profe: si mañana te aprueban la compra, ¿qué pedís primero? 🏐 Comentá y armamos la lista entre todos 👇 " + H_COL),

 dict(slug="cuantas-bicis-7x5", date="2026-11-08T18:00:00", seed=4518, title="¿Cuántas bicis de spinning entran en 7 × 5?",
  scenes=[dict(type="title", dur=2.4, text="¿Cuántas bicis de spinning entran en 7 × 5?", size=100, hl=["Cuántas"]),
          dict(type="chips", dur=3, text="Arriesgá:", size=96, items=["10", "15", "20"], big=True, isize=120, step=230, gap=0.35),
          dict(type="plan", dur=5.6, text="En este armado:", size=96, room=(7, 5), items=BICIS_15, verdict="15, CON LUGAR PARA EL PROFE", vsize=56, vt=3.6, note=NOTA),
          dict(type="cta", dur=3.4, pre="¿Le sacarías una fila?", word="COMENTÁ", sub="¿cuántas pondrías vos?"),
          END_T],
  caption="¿Cuántas bicis de spinning entran en 7 × 5? 🚴 En este armado de ejemplo, 15 con lugar para el profe. ¿Cuántas pondrías vos? Comentalo 👇 Probalo con tus medidas en Armá tu espacio. #spinning #gimnasio #dueñodegimnasio #equipamientofitness #nexofit"),

 dict(slug="que-te-piden-mas", date="2026-11-09T12:00:00", seed=4612, title="Proveedor: ¿qué es lo que más te piden?",
  scenes=[dict(type="title", dur=2.4, kicker="PROVEEDORES", text="¿Qué es lo que más te piden los gimnasios?", size=100, hl=["más te piden"]),
          dict(type="chips", dur=3.6, text="Elegí uno:", size=96, items=["MANCUERNAS", "DISCOS", "COLCHONETAS", "MÁQUINAS"], big=True, isize=88, step=185, gap=0.3),
          dict(type="cta", dur=3.6, pre="Contanos", word="COMENTÁ", sub="¿qué te piden a vos?"),
          dict(type="title", dur=2.8, text="En Nexo Fit te llegan pedidos con lista y cantidades", size=88, hl=["lista y cantidades"]),
          END_SHARE],
  caption="Proveedor: ¿qué es lo que más te piden los gimnasios? 🏋️ Comentá 👇 En Nexo Fit te llegan pedidos con lista y cantidades, y ofertás desde tu link privado. " + H_PROV),

 dict(slug="deporte-presupuesto-club", date="2026-11-09T18:00:00", seed=4618, title="Club: ¿qué deporte se lleva el presupuesto de material?",
  scenes=[dict(type="title", dur=2.4, kicker="CLUBES", text="En tu club, ¿qué deporte se lleva el presupuesto de material?", size=90, hl=["el presupuesto"]),
          dict(type="chips", dur=3.6, text="Sé sincero:", size=96, items=["FÚTBOL", "HOCKEY", "BÁSQUET", "VÓLEY"], big=True, isize=96, step=190, gap=0.3),
          dict(type="cta", dur=3.6, pre="Comentá", word="TU DEPORTE", sub="nadie se entera"),
          dict(type="title", dur=2.8, text="Cuando toque comprar, pedí ofertas por todo junto en Nexo Fit", size=86, hl=["todo junto"]),
          END_T],
  caption="En tu club, ¿qué deporte se lleva el presupuesto de material? 😅 Comentá el tuyo 👇 " + H_CLUB),

 dict(slug="peso-libre-5x4", date="2026-11-10T12:00:00", seed=4712, title="¿Entra una zona de peso libre en 5 × 4?",
  scenes=[dict(type="title", dur=2.4, kicker="¿ENTRA O NO ENTRA?", text="Una zona de peso libre en 5 × 4", size=100, hl=["5 × 4"]),
          dict(type="iso", dur=5.6, text="Rack, 2 bancos, discos y mancuernas", size=84, room=(5, 4), items=PESO_LIBRE, verdict="¿ENTRA?", vt=3.6, note=NOTA),
          dict(type="cta", dur=3.6, pre="¿Vos qué decís?", word="SÍ o NO", sub="Comentalo"),
          probalo(), END_T],
  caption="¿Entra una zona de peso libre en 5 × 4? 🏋️ Rack, 2 bancos, discos y mancuernas. Comentá SÍ o NO y después probalo en 3D en Armá tu espacio 📐 #pesolibre #gimnasio #dueñodegimnasio #equipamientofitness #nexofit"),

 dict(slug="circuito-8-estaciones", date="2026-11-10T18:00:00", seed=4718, title="Circuito de 8 estaciones en 6 × 4: ¿te alcanza?",
  scenes=[dict(type="title", dur=2.4, kicker="ENTRENADORES", text="Circuito de 8 estaciones en 6 × 4: ¿te alcanza?", size=96, hl=["¿te alcanza?"]),
          dict(type="plan", dur=5.6, text="Una estación por alumno", size=92, hl=["por alumno"], room=(6, 4), items=CIRCUITO, verdict="¿TE ALCANZA?", vt=3.8, note=NOTA),
          dict(type="cta", dur=3.6, pre="¿Qué estación cambiarías?", word="COMENTÁ", sub="y armamos el circuito entre todos"),
          probalo(), END_T],
  caption="Circuito de 8 estaciones en 6 × 4: ¿te alcanza? 🔁 ¿Qué estación cambiarías? Comentalo 👇 Probalo con tus medidas en Armá tu espacio. " + H_ENT),
]

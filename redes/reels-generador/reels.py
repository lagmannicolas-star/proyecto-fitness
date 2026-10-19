from engine import RED, GREEN, LIME, GREY

TAGS = "#gimnasio #equipamientofitness #fitnessargentina #nexofit"

REELS = [
 dict(slug="3-errores", date="2026-10-22T10:00:00", folder="4-jueves-22-oct",
  title="3 errores al equipar tu gimnasio",
  hook="Este error te cuesta plata cada vez que equipás tu gimnasio",
  scenes=[
   dict(type="title", dur=3, text="3 errores que te hacen pagar de más al equipar tu gimnasio", size=96, hl=["pagar", "de más"], kicker="DUEÑOS DE GIMNASIO"),
   dict(type="number", dur=5, n="1", text="Comprarle todo al primero que te contesta", hl=["primero"], sub="Sin comparar, nunca sabés si el precio era bueno.", fix="Pedí varias ofertas y compará", fixt=2.8),
   dict(type="number", dur=5, n="2", text="Comprar máquinas antes de pensar el espacio", hl=["pensar el espacio"], sub="Después no entran, o nadie las usa.", fix="Primero armá tu espacio, después comprá", fixt=2.8),
   dict(type="number", dur=5, n="3", text="Mirar solo el precio", hl=["solo el precio"], sub="Entrega, garantía y repuestos también cuentan.", fix="Compará la oferta completa", fixt=2.8),
   dict(type="logo", dur=3.5, pre="Por eso existe", sub="Pedís ofertas, comparás y elegís en un solo lugar"),
   dict(type="cta", dur=4.5, pre="¿Cuál cometiste?", word="1, 2 o 3", ksize=170, sub="Contanos en los comentarios", comment=("gym_centro", "El 1, sin dudas")),
   dict(type="end", dur=3.5, text="Guardalo para tu próxima compra"),
  ],
  caption="3 errores que te hacen pagar de más al equipar tu gimnasio 👇\n\n1️⃣ Comprarle todo al primero que te contesta\n2️⃣ Comprar máquinas antes de pensar el espacio\n3️⃣ Mirar solo el precio\n\nEn Nexo Fit pedís ofertas a varios proveedores, comparás y elegís la que más te conviene.\n\n¿Cuál cometiste? Comentá 1, 2 o 3 👇\n\n#gimnasio #dueñodegimnasio #equipamientofitness #fitnessargentina #nexofit"),

 dict(slug="pov-presupuesto", date="2026-10-23T10:00:00", folder="5-viernes-23-oct",
  title="POV: pedís presupuesto para tu gimnasio",
  scenes=[
   dict(type="title", dur=2.6, text="POV: tenés un gimnasio y necesitás un presupuesto", size=96, hl=["POV:"]),
   dict(type="chat", dur=6, text="Lunes", size=90, msgs=[("me", "Hola! Precio de 5 bicis de spinning?", 0.5, "Visto"), ("me", "Hola??", 2.0, "Visto"), ("me", "Sigue en pie lo de las bicis?", 3.4, "Visto")], punch="3 días después...", pt=4.6, pcolor=GREY),
   dict(type="chat", dur=5.5, text="Jueves", size=90, msgs=[("them", "Hola, te paso la lista de precios", 0.4), ("them", "📎 lista_precios_2024_FINAL_v3.pdf (48 páginas)".replace("📎 ", ""), 1.4), ("them", "Los precios pueden variar", 2.4)], punch="😵", punch_unused=True, pt=99),
   dict(type="title", dur=2.5, text="Mientras tanto, en Nexo Fit...", size=100, bg="green"),
   dict(type="notifs", dur=4.5, text="Publicás lo que necesitás y los proveedores te escriben a vos", size=76, hl=["te escriben a vos"], items=[("Nueva oferta", "5 bicis de spinning · Proveedor A"), ("Nueva oferta", "5 bicis de spinning · Proveedor B"), ("Nueva oferta", "5 bicis de spinning · Proveedor C")], gap=0.6),
   dict(type="cta", dur=4.5, pre="Etiquetá a alguien", word="QUE TENGA", ksize=150, sub="un gimnasio y sufra esto 😅".replace(" 😅", "")),
   dict(type="end", dur=3, text="Que los proveedores te busquen a vos"),
  ],
  caption="POV: pedís presupuesto para tu gimnasio 😅\n\nLunes: visto.\nJueves: una lista de precios de 48 páginas.\n\nEn Nexo Fit publicás lo que necesitás y los proveedores te mandan sus ofertas. Vos solo comparás y elegís.\n\n👉 Etiquetá a alguien que tenga un gimnasio.\n\n#gimnasio #dueñodegimnasio #humorgym #equipamientofitness #nexofit"),

 dict(slug="colegios", date="2026-10-24T10:00:00", folder="6-sabado-24-oct",
  title="Profe de educación física: esto es para vos",
  scenes=[
   dict(type="title", dur=3, kicker="PROFES Y COLEGIOS", text="¿Te dieron presupuesto para el gimnasio del colegio?", size=92, hl=["presupuesto"]),
   dict(type="title", dur=3, text="Y ahora no sabés por dónde empezar", size=96, sub="Qué comprar, cuánto, a quién...", hl=["por dónde empezar"]),
   dict(type="grid", dur=5.5, text="Con Armá tu espacio lo resolvés", size=80, badge="Armá tu espacio", items=["Colchon.", "Conos", "Pelotas", "Aros", "Vallas", "Sogas", "Bancos", "Redes"], bottom="Elegís el espacio y ves qué necesitás"),
   dict(type="steps", dur=6, text="Después:", size=96, items=["Pedís ofertas a varios proveedores", "Comparás precio, entrega y garantía", "Elegís y lo presentás en el colegio"], gap=1.1),
   dict(type="logo", dur=3.2, pre="Todo en", sub="Pensado para colegios, clubes y gimnasios"),
   dict(type="cta", dur=4.5, pre="Mandáselo al", word="DIRECTIVO", ksize=150, sub="de tu escuela 📩".replace(" 📩", "")),
   dict(type="end", dur=3, text="Guardalo para cuando te toque equipar"),
  ],
  caption="Profe de educación física: esto es para vos 🏫\n\n¿Te dieron presupuesto para el gimnasio del colegio y no sabés por dónde empezar?\n\nCon Armá tu espacio ves qué necesitás, pedís ofertas a varios proveedores y elegís la mejor para presentar en tu escuela.\n\n📩 Mandáselo al directivo de tu colegio.\n\n#educacionfisica #profedeeducacionfisica #colegios #escuelas #equipamientodeportivo #nexofit"),

 dict(slug="clubes-antes-despues", date="2026-10-25T10:00:00", folder="7-domingo-25-oct",
  title="Así equipa un club hoy vs con Nexo Fit",
  scenes=[
   dict(type="title", dur=3, kicker="CLUBES", text="Así se equipa la sala de un club hoy...", size=96, hl=["hoy"]),
   dict(type="split", dur=8.5, text="y así con Nexo Fit", size=90, hl=["Nexo Fit"], left_title="ANTES", left=["Llamar a 10 proveedores", "Esperar respuestas", "Presupuestos imposibles de comparar", "Decidir a ciegas"], right_title="AHORA", right=["Un solo pedido", "Las ofertas llegan solas", "Todo comparado en un lugar", "Elegís lo que conviene"]),
   dict(type="cards", dur=5, text="La comisión del club decide con todo a la vista", size=76, hl=["todo a la vista"], items=[("Proveedor A", "$8.900.000", "Entrega 20 días · Garantía 1 año"), ("Proveedor B", "$8.250.000", "Entrega 10 días · Garantía 2 años"), ("Proveedor C", "$9.400.000", "Entrega 15 días · Garantía 1 año")], selt=2.8, note="Precios de ejemplo"),
   dict(type="cta", dur=4.5, pre="Compartilo con", word="LA COMISIÓN", ksize=125, sub="de tu club"),
   dict(type="end", dur=3, text="Guardalo para la próxima renovación"),
  ],
  caption="Así se equipa la sala de un club hoy… y así con Nexo Fit 🏟️\n\n❌ Llamar a 10 proveedores y esperar\n✅ Un solo pedido y las ofertas llegan solas\n\nLa comisión decide con todo comparado: precio, entrega y garantía.\n\n👉 Compartilo con la comisión de tu club.\n\n#clubes #clubdebarrio #saladeMusculacion #equipamientofitness #fitnessargentina #nexofit".replace("saladeMusculacion", "saladeentrenamiento")),

 dict(slug="profes-funcional", date="2026-10-26T10:00:00", folder="semana-2/1-lunes-26-oct",
  title="5 cosas para arrancar tu espacio de funcional",
  scenes=[
   dict(type="title", dur=3, kicker="PROFES", text="5 cosas que necesitás para arrancar tu espacio de funcional", size=90, hl=["5 cosas"]),
   dict(type="checklist", dur=7, text="Lo básico:", size=96, items=["Kettlebells", "Bandas elásticas", "Colchonetas", "Cajón pliométrico", "Soga de batalla"], gap=0.9),
   dict(type="title", dur=3.5, text="¿Y dónde lo comprás sin pagar de más?", size=96, hl=["sin pagar de más"]),
   dict(type="steps", dur=5.5, text="En Nexo Fit:", size=96, items=["Publicás tu lista", "Te llegan ofertas", "Comparás y elegís"], gap=0.9),
   dict(type="cta", dur=4.5, pre="¿Qué le sumarías?", word="COMENTÁ", ksize=160, sub="Armemos la lista completa entre todos"),
   dict(type="end", dur=3, text="Guardalo para armar tu espacio"),
  ],
  caption="5 cosas que necesitás para arrancar tu espacio de funcional 💪\n\n✅ Kettlebells\n✅ Bandas elásticas\n✅ Colchonetas\n✅ Cajón pliométrico\n✅ Soga de batalla\n\nPublicás tu lista en Nexo Fit, te llegan ofertas de varios proveedores y elegís la que más te conviene.\n\n¿Qué le sumarías? 👇\n\n#entrenadorpersonal #entrenamientofuncional #profedefuncional #crossfitargentina #equipamientofitness #nexofit"),

 dict(slug="proveedores", date="2026-10-27T10:00:00", folder="semana-2/2-martes-27-oct",
  title="¿Vendés equipamiento fitness?",
  scenes=[
   dict(type="title", dur=3, kicker="PROVEEDORES", text="¿Vendés equipamiento fitness?", size=110, hl=["equipamiento fitness?"]),
   dict(type="title", dur=3.2, text="Dejá de salir a buscar clientes uno por uno", size=96, hl=["uno por uno"]),
   dict(type="chips", dur=4.5, text="En Nexo Fit te llegan pedidos de:", size=84, items=["GIMNASIOS", "CLUBES", "COLEGIOS", "PROFES"], big=True, isize=96, step=190),
   dict(type="steps", dur=6, text="Cómo funciona:", size=96, items=["Ves lo que necesitan", "Mandás tu oferta", "Si te eligen, vendés"], gap=1.0),
   dict(type="logo", dur=3, pre="Sumate a", sub="Tu catálogo frente a quienes están por comprar"),
   dict(type="cta", dur=4.5, word="PROVEEDOR", ksize=150, sub="y te contamos cómo sumarte", comment=("fitness_equipos", "PROVEEDOR")),
   dict(type="end", dur=3, text="Compartilo con alguien que venda equipamiento", icon="none"),
  ],
  caption="¿Vendés equipamiento fitness? 🏋️\n\nEn Nexo Fit te llegan pedidos de gimnasios, clubes, colegios y profes. Ves lo que necesitan, mandás tu oferta y, si te eligen, vendés.\n\n👉 Comentá PROVEEDOR y te contamos cómo sumarte.\n\n#proveedoresfitness #equipamientofitness #fitnessargentina #mayorista #nexofit"),
]

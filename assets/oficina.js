/* Oficina Nexo Fit: lee el estado del negocio con la sesión de administrador y lo dibuja como un plano. */
(function (w, d) {
  'use strict';
  var CFG = { url: 'https://ecdaxdqvdwplhovcmnxr.supabase.co', key: 'sb_publishable_QnPox0ljM1hZ_l4VFiqeYg_K_9KR65-' };
  var STORAGE = 'fitness-auth:' + CFG.url;
  var ZONA = 'America/Argentina/Buenos_Aires';
  var INICIO = '2026-11-02', CIERRE = '2026-11-13', LANZAMIENTO = '2026-11-16';
  var FOTO_VIEJA_HORAS = 26;
  var ESTADOS = { orden: 'En orden', atencion: 'Atención', frenada: 'Frenada', nada: 'Sin encargo' };
  var SALAS = ['direccion', 'comercial', 'redes', 'marketing', 'diseno', 'investigacion', 'administracion', 'operaciones'];
  var NOMBRES = { direccion: 'Dirección', comercial: 'Comercial', redes: 'Redes sociales', marketing: 'Marketing', diseno: 'Diseño y video', investigacion: 'Investigación', administracion: 'Administración', operaciones: 'Operaciones' };
  var PROMO_DESDE = '2026-11-03';
  var COLA_MINIMA = 14;
  /* Turnos diarios (hora de Buenos Aires). Cada uno es una tarea programada: si se cambia una, se cambia acá. */
  var TURNOS = [
    { h: '00:23', e: 'investigacion', t: 'Radar de mercado y compradores' },
    { h: '03:23', e: 'marketing', t: 'Análisis de contenido y campañas' },
    { h: '05:23', e: 'diseno', t: 'Producción de piezas para Meta' },
    { h: '07:23', e: 'direccion', t: 'Prioridades del día' },
    { h: '09:23', e: 'operaciones', t: 'Control técnico de la mañana' },
    { h: '10:23', e: 'redes', t: 'Control del calendario' },
    { h: '10:53', e: 'comercial', t: 'Respuestas de la mañana' },
    { h: '14:23', e: 'investigacion', t: 'Segundo radar y oportunidades' },
    { h: '15:43', e: 'comercial', t: 'Seguimiento comercial' },
    { h: '16:23', e: 'diseno', t: 'Segunda producción de piezas' },
    { h: '17:23', e: 'administracion', t: 'Cobros y comisiones' },
    { h: '18:23', e: 'marketing', t: 'Lectura de la tarde' },
    { h: '18:53', e: 'redes', t: 'Control de la tarde' },
    { h: '20:23', e: 'direccion', t: 'Cierre del día' },
    { h: '21:23', e: 'operaciones', t: 'Control técnico' }
  ];
  /* Lectura general de datos: cada dos horas, a y 12 de las horas impares. */
  for (var hLectura = 1; hLectura < 24; hLectura += 2) TURNOS.push({ h: (hLectura < 10 ? '0' : '') + hLectura + ':12', e: 'operaciones', t: hLectura === 19 ? 'Lectura general y reportes' : 'Lectura general de la oficina' });
  TURNOS.sort(function (a, b) { return a.h < b.h ? -1 : a.h > b.h ? 1 : 0; });

  /* ---------- Fechas y formato ---------- */
  function diaBA(fecha) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(fecha));
  }
  function diasEntre(a, b) { return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 864e5); }
  function partes(v) {
    var o = {};
    new Intl.DateTimeFormat('es-AR', { timeZone: ZONA, weekday: 'short', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
      .formatToParts(new Date(v)).forEach(function (p) { o[p.type] = p.value; });
    return o;
  }
  function fechaCorta(v) { if (!v) return '—'; var p = partes(v); return p.day + '/' + p.month; }
  function fechaHora(v) {
    if (!v) return '—';
    var p = partes(v);
    return p.weekday.replace('.', '') + ' ' + p.day + '/' + p.month + ', ' + p.hour + ':' + p.minute;
  }
  function hace(v, ahora) {
    var min = Math.max(0, Math.round((new Date(ahora) - new Date(v)) / 6e4));
    if (min < 2) return 'recién';
    if (min < 60) return 'hace ' + min + ' min';
    var h = Math.round(min / 60);
    if (h < 48) return 'hace ' + h + ' h';
    return 'hace ' + Math.round(h / 24) + ' días';
  }
  function plata(n) { return '$ ' + Number(n || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 }); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }

  /* ---------- Lectura del negocio ---------- */
  function leer(d0, ahora, mpListo) {
    var hoy = diaBA(ahora), foto = (d0.foto && d0.foto.datos) || {};
    var vieja = !d0.foto || (new Date(ahora) - new Date(d0.foto.actualizada)) / 36e5 > FOTO_VIEJA_HORAS;
    var red = d0.red || [];
    var pedidos = (d0.pedidos || []).filter(function (p) { return p.status !== 'descartada'; });
    var pagados = pedidos.filter(function (p) { return p.pago_estado === 'approved' || p.pago_estado === 'aprobado' || p.pago_estado === 'pagado'; });
    var proximas = ((foto.redes && foto.redes.proximas) || []).filter(function (p) { return new Date(p.fecha) >= new Date(ahora); });
    var igHoy = ((foto.redes && foto.redes.proximas) || []).filter(function (p) {
      return diaBA(p.fecha) === hoy && (p.redes || []).indexOf('instagram') >= 0;
    }).length + ((d0.instagram && d0.instagram.hoy) || 0) + ((d0.meta && d0.meta.hoy) || 0);
    var meta = d0.meta || {}, colaFin = d0.cola_hasta || null;
    return {
      hoy: hoy, ahora: ahora, foto: foto, fotoVieja: vieja, mpListo: mpListo,
      diasLanzamiento: diasEntre(hoy, LANZAMIENTO), diasCierre: diasEntre(hoy, CIERRE),
      red: red, conMp: red.filter(function (r) { return r.mp; }).length,
      nuevos7: red.filter(function (r) { return diasEntre(diaBA(r.alta), hoy) < 7; }).length,
      conPromo: red.filter(function (r) { return diaBA(r.alta) >= PROMO_DESDE && r.comision === 5; }).length,
      pedidos: pedidos, pagados: pagados,
      conOfertas: pedidos.filter(function (p) { return p.ofertas > 0; }).length,
      vendido: pagados.reduce(function (s, p) { return s + Number(p.pago_monto || 0); }, 0),
      comision: pagados.reduce(function (s, p) { return s + Number(p.pago_comision || 0); }, 0),
      ig: d0.instagram || {}, igHoy: igHoy, proximas: proximas, fb: d0.facebook || {},
      cola: d0.cola || [], colaTotal: d0.cola_total || 0, colaHasta: colaFin, meta: meta,
      cubierto: (d0.cola_total || 0) + (meta.programados || 0),
      cubiertoHasta: [colaFin, meta.hasta].filter(Boolean).sort(function (a, b) { return new Date(b) - new Date(a); })[0] || null,
      encargos: d0.encargos || [], metricas: d0.metricas || {}, ofertas: d0.ofertas_total || 0,
      promoCargadas: d0.promo_cargadas || 0, novedades: d0.novedades || [], avisos: d0.avisos || {}, automatismos: d0.automatismos || [], exigirMp: !!d0.exigir_mp,
      ventas: foto.ventas || null, tareas: foto.tareas || null
    };
  }

  function tareasCaidas(x) {
    return (x.tareas || []).filter(function (t) { return t.estado === 'fallo'; }).length +
      x.automatismos.filter(function (a) { return !a.activo || a.estado === 'failed'; }).length;
  }

  function estadoSala(id, x) {
    if (id === 'direccion') return pendientes(x).some(function (p) { return p.n === 'frenada'; }) ? 'frenada' : pendientes(x).length ? 'atencion' : 'orden';
    if (id === 'comercial') {
      if (x.ventas && x.ventas.seguimiento_enviados > x.promoCargadas) return 'frenada';
      return (x.pedidos.length && x.red.length >= 20) ? 'orden' : 'atencion';
    }
    if (id === 'administracion') {
      if (x.mpListo === false || (x.red.length && x.conMp === 0)) return 'frenada';
      return x.conMp < x.red.length / 2 ? 'atencion' : 'orden';
    }
    if (id === 'redes') {
      if (!x.ig.conectado && !x.igHoy) return 'frenada';
      return (!x.ig.conectado || !x.fb.conectado || !x.igHoy) ? 'atencion' : 'orden';
    }
    if (id === 'operaciones') {
      if (tareasCaidas(x)) return 'frenada';
      return (x.fotoVieja || x.avisos.errores_7d) ? 'atencion' : 'orden';
    }
    if (id === 'diseno') return x.cubierto >= COLA_MINIMA ? 'orden' : 'atencion';
    return (novedadesDe(x, id).length || encargosDe(x, id).length) ? 'orden' : 'nada';
  }

  function encargosDe(x, id) { return x.encargos.filter(function (e) { return e.espacio === id && e.estado !== 'descartado'; }); }
  function turnosDe(id) { return TURNOS.filter(function (t) { return t.e === id; }); }
  function horaBA(ahora) {
    var p = partes(ahora);
    return (p.hour === '24' ? '00' : p.hour) + ':' + p.minute;
  }
  function proximoTurno(ahora) {
    var h = horaBA(ahora), n = TURNOS.filter(function (t) { return t.h > h; })[0];
    return n || TURNOS[0];
  }

  /* Qué está pasando en cada sala. Trabaja si está dentro de su turno o tiene un encargo en curso. */
  var VENTANA_TURNO = 20;
  function aMinutos(h) { var p = h.split(':'); return Number(p[0]) * 60 + Number(p[1]); }
  function actividad(x) {
    var ahora = aMinutos(horaBA(x.ahora)), o = {};
    SALAS.forEach(function (id) {
      var turnos = turnosDe(id), enTurno = turnos.some(function (t) { var d = ahora - aMinutos(t.h); return d >= 0 && d < VENTANA_TURNO; });
      var enCurso = x.encargos.some(function (e) { return e.espacio === id && e.estado === 'en_curso'; });
      var prox = turnos.filter(function (t) { return aMinutos(t.h) > ahora; })[0] || turnos[0];
      var u = x.novedades.filter(function (n) { return n.espacio === id; })[0];
      var trabajando = enTurno || enCurso;
      var turnoAhora = turnos.filter(function (t) { var d = ahora - aMinutos(t.h); return d >= 0 && d < VENTANA_TURNO; })[0];
      var encargoAhora = x.encargos.filter(function (e) { return e.espacio === id && e.estado === 'en_curso'; })[0];
      var tarea = turnoAhora ? turnoAhora.t : encargoAhora ? encargoAhora.titulo : null;
      o[id] = { publica: pantallaPublica(id, x), nombre: NOMBRES[id], estado: estadoSala(id, x), trabajando: trabajando, proximo: prox ? prox.h : null, proximoT: prox ? prox.t : null,
        ultima: u || null, tarea: tarea, pantalla: pantallaSala(id, x), texto: trabajando ? (tarea || 'Trabajando ahora') : prox ? 'Próximo turno ' + prox.h : 'Sin turno' };
    });
    return o;
  }

  /* Lo que muestra la pantalla de pared de cada sala: siempre sale de los datos, nunca de un ejemplo. */
  function pantallaSala(id, x) {
    var v = x.ventas || {}, r = x.foto.redes || {}, pend = pendientes(x), l = listaLanzamiento(x);
    var proximaMeta = x.meta.proxima ? fechaHora(x.meta.proxima.fecha) : null;
    if (id === 'direccion') return { cifra: Math.max(0, x.diasLanzamiento), unidad: 'días para lanzar', nota: pend[0] ? 'Primero: ' + pend[0].t : 'Nada pendiente',
      filas: [['Lista lista', l.filter(function (i) { return i.ok; }).length + ' de ' + l.length], ['Pendientes', pend.length], ['Frenados', pend.filter(function (p) { return p.n === 'frenada'; }).length], ['Cierre promo', Math.max(0, x.diasCierre) + ' días']] };
    if (id === 'comercial') return { cifra: x.red.length, unidad: 'proveedores', nota: 'Pedidos reales: ' + x.pedidos.length + ', con ofertas: ' + x.conOfertas,
      filas: [['Nuevos 7 días', x.nuevos7], ['Contactadas', v.prospectos || 0], ['Respondieron', v.respondieron || 0], ['Ofertas', x.ofertas]] };
    if (id === 'administracion') return { cifra: x.conMp + ' de ' + x.red.length, unidad: 'con Mercado Pago', nota: x.mpListo === false ? 'Falta activar Mercado Pago en la página' : x.mpListo ? 'Mercado Pago activo' : '',
      filas: [['Vendido', plata(x.vendido)], ['Comisión', plata(x.comision)], ['Pagados', x.pagados.length], ['Exigir MP', x.exigirMp ? 'Sí' : 'No']] };
    if (id === 'redes') return { cifra: x.meta.programados || 0, unidad: 'programadas en Meta', nota: x.meta.proxima ? 'Próxima: ' + x.meta.proxima.titulo : 'Sin próxima publicación cargada',
      filas: [['Próxima', proximaMeta ? proximaMeta.replace(/^\S+ /, '') : '—'], ['Hoy', x.igHoy], ['Seguidores', r.seguidores_ig == null ? '—' : r.seguidores_ig], ['Fallidas 7 d', r.fallidas_7d == null ? '—' : r.fallidas_7d]] };
    if (id === 'marketing') return { cifra: x.promoCargadas, unidad: 'empresas con la promo', nota: 'El 5 % vale hasta el 13/11',
      filas: [['Sumadas con 5 %', x.conPromo], ['Días de promo', Math.max(0, x.diasCierre)], ['Alcance diario', r.alcance_ig_7d == null ? '—' : r.alcance_ig_7d]] };
    if (id === 'diseno') { var dv = x.foto.diseno || {}; return { cifra: x.cubierto, unidad: 'piezas cargadas', nota: x.cubiertoHasta ? 'Contenido hasta el ' + fechaCorta(x.cubiertoHasta) : 'Sin contenido cargado',
      filas: [['Cubierto hasta', x.cubiertoHasta ? fechaCorta(x.cubiertoHasta) : '—'], ['En Meta', x.meta.programados || 0], ['Última tanda', dv.videos_semana == null ? '—' : dv.videos_semana]] }; }
    if (id === 'investigacion') { var inf = novedadesDe(x, id).filter(function (i) { return i.tipo === 'reporte'; }); return { cifra: inf.length, unidad: 'informes', nota: inf[0] ? inf[0].titulo : 'El primer informe sale en el turno de las 00:23',
      filas: [['Último', inf[0] ? fechaCorta(inf[0].fecha) : '—'], ['Encargos', encargosDe(x, id).length]] }; }
    var ok = (x.tareas || []).filter(function (t) { return t.estado === 'ok'; }).length;
    return { cifra: x.tareas ? ok + ' de ' + x.tareas.length : x.automatismos.length, unidad: x.tareas ? 'tareas funcionando' : 'procesos de la base', nota: tareasCaidas(x) ? 'Hay tareas caídas' : 'Sin tareas caídas',
      filas: [['Avisos 7 días', x.avisos.enviados_7d || 0], ['Avisos fallidos', x.avisos.errores_7d || 0], ['Procesos', x.automatismos.length]] };
  }
  /* Lo que se puede ver en un video: nunca cobros, mails ni nada frenado. */
  function pantallaPublica(id, x) {
    if (id === 'comercial') return { cifra: x.red.length, unidad: 'proveedores en la red', filas: [] };
    if (id === 'redes') return { cifra: reelsProgramados(x), unidad: 'Reels programados', filas: [] };
    if (id === 'direccion') return { cifra: Math.max(0, x.diasLanzamiento), unidad: 'días para lanzar', filas: [] };
    if (id === 'operaciones') return { cifra: '24 h', unidad: 'funcionando', filas: [] };
    var nTurnos = TURNOS.filter(function (t) { return t.e === id; }).length || 1;
    return { cifra: nTurnos, unidad: nTurnos === 1 ? 'turno por día' : 'turnos por día', filas: [] };
  }
  function reelsProgramados(x) { return Math.ceil((x.meta.programados || 0) / 2); }
  /* Guiones del modo video: hablan solo de lo que se puede mostrar. */
  var TOMAS = {
    jefe: { p: [35.6, 0.9, 9.4], alto: 2.9, az: 0.26, el: 0.66 }, comercial: { p: [12.6, 0.8, 3.7], alto: 4, az: -0.22, el: 0.74 }, redes: { p: [4.6, 0.9, 11.3], alto: 3.9, az: 0.24, el: 0.74 },
    diseno: { p: [22, 0.9, 11], alto: 3.9, az: -0.2, el: 0.74 }, investigacion: { p: [28.6, 0.9, 11.7], alto: 3.9, az: 0.22, el: 0.74 }, operaciones: { p: [23.9, 0.9, 18.6], alto: 3.9, az: -0.2, el: 0.74 },
    cocina: { p: [15.5, 0.7, 19.2], alto: 3.8, az: 0.2, el: 0.74 }, terraza: { p: [35.4, 0.8, 16.6], alto: 3.7, az: 0.32, el: 0.7 }, todo: { p: [20.5, 0, 11], alto: 19, az: 0.1, el: 0.98 }
  };
  function toma(k, dur, t, extra) { return Object.assign({}, TOMAS[k], { dur: dur, t: t }, extra || {}); }
  var GUIONES = {
    mate: { n: 'Mientras tomo mate', d: 'Vos con el mate y la oficina trabajando.' },
    cuenta: { n: 'Cuenta regresiva', d: 'Los días que faltan para lanzar, sala por sala.' },
    recorrida: { n: 'Recorrida por la oficina', d: 'Entrá y mirá qué hace cada sala.' }
  };
  function guion(id, x) {
    var dias = Math.max(0, x.diasLanzamiento), turnos = TURNOS.length, fin = dias > 0 ? 'Faltan ' + dias + (dias === 1 ? ' día' : ' días') + ' para lanzar' : 'Ya estamos en vivo';
    var cierre = toma('todo', 2.8, fin, { fin: true });
    if (id === 'cuenta') return [toma('jefe', 3.2, dias > 0 ? 'Faltan ' + dias + (dias === 1 ? ' día' : ' días') : 'Llegó el día', { s: 'y la oficina no para', globo: 'Todos a sus puestos' }),
      toma('comercial', 2.6, 'proveedores en la red', { cifra: x.red.length }), toma('diseno', 2.6, 'Videos en producción'), toma('redes', 2.6, 'Reels programados', { cifra: reelsProgramados(x) }), toma('operaciones', 2.6, 'turnos por día', { cifra: turnos }), cierre];
    if (id === 'recorrida') return [toma('todo', 2.8, 'Esta es la oficina de Nexo Fit', { s: 'y funciona las 24 horas' }), toma('comercial', 2.5, 'Comercial', { s: 'sigue a los proveedores' }), toma('redes', 2.5, 'Redes', { s: 'publica todos los días' }), toma('diseno', 2.5, 'Diseño', { s: 'arma los videos' }), toma('investigacion', 2.5, 'Investigación', { s: 'mira el mercado' }), toma('cocina', 2.2, 'La cocina', { s: 'nunca falta' }), toma('terraza', 2.4, 'Y la parrilla', { s: 'para los viernes' }), toma('jefe', 3, 'Acá estoy yo', { s: 'con el mate', globo: '¿Cómo venimos?' }), cierre];
    return [toma('jefe', 3.8, 'Mientras tomo mate', { s: 'mi oficina trabaja', globo: '¿Cómo vienen los proveedores?' }), toma('comercial', 2.6, 'proveedores en la red', { cifra: x.red.length }), toma('redes', 2.6, 'Reels programados', { cifra: reelsProgramados(x) }), toma('diseno', 2.4, 'Diseño arma los videos'), toma('operaciones', 2.6, 'turnos por día', { cifra: turnos, s: 'las 24 horas' }), toma('terraza', 2.2, 'Y yo sigo con el mate'), cierre];
  }
  function proximosTurnos(ahora, n) {
    var h = horaBA(ahora), despues = TURNOS.filter(function (t) { return t.h > h; }), antes = TURNOS.filter(function (t) { return t.h <= h; });
    return despues.concat(antes).slice(0, n).map(function (t) { return { h: t.h, sala: NOMBRES[t.e], t: t.t }; });
  }
  function faltaPara(h, ahora) {
    var d = aMinutos(h) - aMinutos(horaBA(ahora));
    if (d <= 0) d += 1440;
    return d < 60 ? d + ' min' : Math.floor(d / 60) + ' h' + (d % 60 ? ' ' + (d % 60) + ' min' : '');
  }
  function info3d(x) {
    var h = horaBA(x.ahora);
    var abiertos = x.encargos.filter(function (e) { return e.estado === 'pendiente' || e.estado === 'en_curso'; }).map(function (e) { return NOMBRES[e.espacio] + ': ' + e.titulo; });
    var aviso = pendientes(x).slice(0, 4).map(function (p) { return p.t; }), reportes = {};
    SALAS.forEach(function (id) { var u = novedadesDe(x, id)[0]; reportes[id] = NOMBRES[id] + ': ' + (u ? u.titulo : 'sin novedades'); });
    var fecha = new Date(new Date(x.ahora).getTime() - 3 * 3600000);
    return { hora: h, minutos: aMinutos(h), dias: Math.max(0, x.diasLanzamiento), turnos: proximosTurnos(x.ahora, 4), frases: abiertos.concat(aviso), reportes: reportes,
      asado: fecha.getUTCDay() === 5 && fecha.getUTCHours() >= 12 && fecha.getUTCHours() < 15 };
  }

  /* Lista de lanzamiento: lo que tiene que estar listo el 16/11. */
  function listaLanzamiento(x) {
    var mitad = x.red.length ? x.conMp >= Math.ceil(x.red.length / 2) : false;
    return [
      { t: 'Mercado Pago activo en la página', ok: x.mpListo === true, dudoso: x.mpListo === null },
      { t: 'Al menos la mitad de los proveedores con Mercado Pago', ok: mitad },
      { t: 'Regla de exigir Mercado Pago prendida', ok: x.exigirMp },
      { t: 'Instagram conectado', ok: !!x.ig.conectado },
      { t: 'Facebook conectado', ok: !!x.fb.conectado },
      { t: 'Dos semanas de contenido cargado', ok: x.cubierto >= COLA_MINIMA },
      { t: 'Promo cargada para todas las empresas con mail', ok: !x.ventas || x.ventas.seguimiento_enviados <= x.promoCargadas },
      { t: 'Primer pedido real', ok: x.pedidos.length > 0 },
      { t: 'Primera oferta real', ok: x.ofertas > 0 }
    ];
  }

  function novedadesDe(x, id) {
    return x.novedades.filter(function (n) { return id === 'direccion' || n.espacio === id; });
  }

  /* Lo que Nicolás tiene que resolver, de lo que frena más a lo que frena menos. Sale de los datos: se va solo al resolverse. */
  function pendientes(x) {
    var p = [];
    var falta = x.diasLanzamiento > 0 ? 'Faltan ' + plural(x.diasLanzamiento, 'día', 'días') + ' para lanzar.' : '';
    if (x.mpListo === false) p.push({ n: 'frenada', sala: 'administracion', t: 'Activar Mercado Pago en la página',
      d: 'La conexión todavía no está configurada: ningún proveedor puede vincular su cuenta ni un comprador puede pagar. ' + falta });
    else if (x.red.length && x.conMp === 0) p.push({ n: 'frenada', sala: 'administracion', t: 'Ningún proveedor conectó Mercado Pago',
      d: 'Decidiste que sin Mercado Pago no se arranca, y hoy son 0 de ' + x.red.length + '. ' + falta });
    if (x.ventas && x.ventas.seguimiento_enviados > x.promoCargadas) p.push({ n: 'frenada', sala: 'comercial', t: 'La promo del 5 % no está cargada para todos',
      d: 'Se les ofreció a ' + x.ventas.seguimiento_enviados + ' empresas y figuran ' + x.promoCargadas + ' en la lista que aplica el descuento. La próxima lectura de la oficina debería completarla.' });
    if (!x.ig.conectado || !x.fb.conectado) p.push({ n: x.ig.conectado ? 'atencion' : 'frenada', sala: 'redes', t: x.ig.conectado ? 'Conectar Facebook' : 'Conectar Instagram y Facebook con Meta',
      d: 'Con una sola llave de Meta se publica todo lo que está en cola. Son unos 20 minutos desde la compu.', a: 'admin.html', at: 'Abrir el panel' });
    if (!x.igHoy) p.push({ n: 'atencion', sala: 'redes', t: 'Instagram no tiene nada para hoy',
      d: 'No hay publicaciones programadas para hoy en el publicador ni en Metricool. Lo que cargues a mano en Business Suite no se ve desde acá.' });
    var abiertos = x.encargos.filter(function (e) { return e.origen === 'oficina' && e.espacio === 'direccion' && e.estado === 'pendiente'; });
    abiertos.slice(0, 3).forEach(function (e) { p.push({ n: 'atencion', sala: 'direccion', t: e.titulo, d: e.detalle || 'La oficina necesita tu decisión.' }); });
    if (!x.pedidos.length) p.push({ n: 'atencion', sala: 'comercial', t: 'Conseguir el primer pedido real',
      d: 'Hablá con un gimnasio que esté por equipar y cargá el pedido con él. Las pruebas y los pedidos descartados no cuentan.' });
    if (x.ventas && x.ventas.respondieron) p.push({ n: 'atencion', sala: 'comercial', t: plural(x.ventas.respondieron, 'respuesta', 'respuestas') + ' de proveedores para mirar',
      d: 'Esas conversaciones las seguís vos.' });
    if (x.conMp > 0 && !x.exigirMp && x.diasLanzamiento <= 3) p.push({ n: 'atencion', sala: 'administracion', t: 'Exigir Mercado Pago para ofertar',
      d: 'Esa regla sigue apagada. Prendela desde la red de proveedores cuando estén listos.', a: 'admin.html', at: 'Abrir el panel' });
    if (tareasCaidas(x)) p.push({ n: 'frenada', sala: 'operaciones', t: 'Una tarea automática falló', d: 'Entrá a Operaciones para ver cuál.' });
    if (x.fotoVieja) p.push({ n: 'atencion', sala: 'operaciones', t: 'Redes, mails y tareas están desactualizados',
      d: x.foto && Object.keys(x.foto).length ? 'La última lectura tiene más de un día. Revisá la tarea que actualiza la oficina.' : 'Todavía no hay una lectura guardada de esos datos.' });
    return p.sort(function (a, b) { return (a.n === 'frenada' ? 0 : 1) - (b.n === 'frenada' ? 0 : 1); });
  }

  function frase(x, lista) {
    var frenadas = lista.filter(function (p) { return p.n === 'frenada'; }).length;
    var tiempo = x.diasLanzamiento > 1 ? 'Faltan ' + x.diasLanzamiento + ' días para lanzar' :
      x.diasLanzamiento === 1 ? 'Mañana lanzamos' : x.diasLanzamiento === 0 ? 'Hoy lanzamos' :
        'Lanzamos hace ' + plural(-x.diasLanzamiento, 'día', 'días');
    if (frenadas) return tiempo + ' y ' + (frenadas === 1 ? 'hay una cosa frenada.' : 'hay ' + frenadas + ' cosas frenadas.');
    if (lista.length) return tiempo + '. Nada frenado, ' + plural(lista.length, 'pendiente', 'pendientes') + '.';
    return tiempo + '. Está todo en orden.';
  }

  function resumenSala(id, x) {
    var n = NOMBRES[id], ult = novedadesDe(x, id)[0];
    if (id === 'direccion') { var l = pendientes(x); return { n: n, c: Math.max(0, x.diasLanzamiento), de: ' días', t: plural(l.length, 'decisión pendiente', 'decisiones pendientes') }; }
    if (id === 'comercial') return { n: n, c: x.red.length, de: ' proveedores', t: plural(x.pedidos.length, 'pedido real', 'pedidos reales') + ', ' + (x.ventas ? plural(x.ventas.respondieron || 0, 'respuesta', 'respuestas') + ' al lanzamiento' : 'sin lectura de mails') };
    if (id === 'redes') return { n: n, c: x.cubierto, de: ' cargadas', t: 'Meta ' + (x.ig.conectado && x.fb.conectado ? 'conectado' : 'sin conectar') + ', ' + x.igHoy + ' hoy en Instagram' };
    if (id === 'marketing') return { n: n, c: x.promoCargadas, de: '', t: 'empresas con la promo, ' + x.conPromo + ' ya sumadas' };
    if (id === 'diseno') return { n: n, c: x.cubiertoHasta ? fechaCorta(x.cubiertoHasta) : '—', de: '', t: x.cubiertoHasta ? 'contenido cubierto hasta esa fecha' : 'Sin contenido cargado' };
    if (id === 'investigacion') return { n: n, c: novedadesDe(x, id).filter(function (i) { return i.tipo === 'reporte'; }).length, de: ' informes', t: ult ? ult.titulo : 'Primer turno a las 00:23' };
    if (id === 'administracion') return { n: n, c: x.conMp, de: ' de ' + x.red.length, t: 'con Mercado Pago' + (x.mpListo === false ? ', sin activar en la página' : '') };
    var ok = (x.tareas || []).filter(function (t) { return t.estado === 'ok'; }).length;
    return { n: n, c: x.tareas ? ok : x.automatismos.length, de: x.tareas ? ' de ' + x.tareas.length : '', t: x.tareas ? 'tareas funcionando' : 'procesos de la base' };
  }

  /* ---------- Dibujo ---------- */
  var MUEBLES = {
    direccion: '<svg class="mueble" width="104" height="70" viewBox="0 0 104 70" aria-hidden="true"><rect x="16" y="14" width="72" height="42" rx="20"/><circle cx="34" cy="6" r="5"/><circle cx="70" cy="6" r="5"/><circle cx="34" cy="64" r="5"/><circle cx="70" cy="64" r="5"/><circle cx="7" cy="35" r="5"/><circle cx="97" cy="35" r="5"/></svg>',
    comercial: '<svg class="mueble" width="230" height="92" viewBox="0 0 230 92" aria-hidden="true"><path d="M1 40h170a18 18 0 0 1 18 18v33"/><path d="M1 56h154a18 18 0 0 1 18 18v17"/><circle cx="60" cy="20" r="11"/><circle cx="105" cy="20" r="11"/><rect x="200" y="8" width="28" height="44" rx="3"/></svg>',
    redes: '<svg class="mueble" width="64" height="64" viewBox="0 0 74 74" aria-hidden="true"><circle cx="37" cy="37" r="35"/><circle cx="37" cy="37" r="24"/><path d="M37 37l30-30"/></svg>',
    diseno: '<svg class="mueble" width="70" height="52" viewBox="0 0 70 52" aria-hidden="true"><rect x="1" y="1" width="68" height="50"/><path d="M1 37l20-16 15 12 12-9 21 15"/></svg>',
    investigacion: '<svg class="mueble" width="54" height="45" viewBox="0 0 72 60" aria-hidden="true"><path d="M1 12h70M1 36h70M1 59h70"/><path d="M8 12V2h7v10M18 12V2h6v10M29 12V4h7v8M12 36V26h7v10M24 36V24h6v12M40 36V26h7v10M9 59V48h7v11M20 59V46h6v13"/></svg>',
    administracion: '<svg class="mueble" width="96" height="74" viewBox="0 0 96 74" aria-hidden="true"><rect x="1" y="1" width="74" height="72"/><circle cx="38" cy="37" r="17"/><path d="M38 20v34M21 37h34"/><rect x="82" y="16" width="13" height="42"/></svg>',
    operaciones: '<svg class="mueble" width="130" height="86" viewBox="0 0 130 86" aria-hidden="true"><rect x="1" y="1" width="36" height="84"/><rect x="47" y="1" width="36" height="84"/><rect x="93" y="1" width="36" height="84"/><path d="M1 22h36M1 43h36M1 64h36M47 22h36M47 43h36M47 64h36M93 22h36M93 43h36M93 64h36"/></svg>'
  };

  function dibujarCota(x) {
    var total = diasEntre(INICIO, LANZAMIENTO);
    var pos = function (dia) { return Math.max(0, Math.min(100, diasEntre(INICIO, dia) / total * 100)); };
    return '<div class="cota" role="img" aria-label="Quedan ' + Math.max(0, x.diasCierre) + ' días para el cierre de la promoción y ' + Math.max(0, x.diasLanzamiento) + ' para el lanzamiento">'
      + '<div class="cota-linea"></div><div class="cota-hecho" style="width:' + pos(x.hoy) + '%"></div>'
      + (x.diasLanzamiento >= 0 ? '<span class="cota-hoy" style="left:' + pos(x.hoy) + '%">Hoy</span>' : '')
      + '<div class="hito inicio" style="left:0"><span><b>Promo</b>desde 2/11</span></div>'
      + '<div class="hito medio" style="left:' + pos(CIERRE) + '%"><span><b>Cierre de promo</b>vie 13/11</span></div>'
      + '<div class="hito fin" style="left:100%"><span><b>Lanzamiento</b>lun 16/11</span></div></div>';
  }

  function dibujarTurnos(x) {
    var aMin = function (h) { var p = h.split(':'); return Number(p[0]) * 60 + Number(p[1]); };
    var ahora = aMin(horaBA(x.ahora)), n = proximoTurno(x.ahora), act = actividad(x);
    var ahoraTrabajan = SALAS.filter(function (id) { return act[id].trabajando; }).map(function (id) { return NOMBRES[id]; });
    return '<section class="turnos" id="turnos" aria-label="Turnos de la oficina"><div class="turnos-tope"><h2>La oficina en 24 horas</h2><p>' + (ahoraTrabajan.length ? 'Trabajando ahora: ' + esc(ahoraTrabajan.join(', ')) + '. ' : 'Entre turnos. ') + 'Próximo: ' + esc(n.h) + ', ' + esc(NOMBRES[n.e]) + '.</p></div>'
      + '<div class="reloj" role="img" aria-label="' + TURNOS.length + ' turnos repartidos en el día"><i class="ahora" style="left:' + (ahora / 14.4).toFixed(2) + '%"></i>'
      + TURNOS.map(function (t) { return '<button type="button" class="pip" data-ir="' + t.e + '" style="left:' + (aMin(t.h) / 14.4).toFixed(2) + '%" title="' + esc(t.h + ', ' + NOMBRES[t.e] + ': ' + t.t) + '" aria-label="' + esc(t.h + ', ' + NOMBRES[t.e]) + '"></button>'; }).join('')
      + '</div><div class="horas"><span>0</span><span>6</span><span>12</span><span>18</span><span>24</span></div></section>';
  }

  function dibujarSala(id, i, x, elegida) {
    var r = resumenSala(id, x), est = estadoSala(id, x);
    return '<button type="button" class="sala s-' + id + '" data-sala="' + id + '" data-estado="' + est + '" style="--i:' + i + '" aria-pressed="' + (elegida === id) + '">'
      + '<h2>' + esc(r.n) + '</h2><span class="cifra num">' + esc(r.c) + (r.de ? '<small>' + esc(r.de) + '</small>' : '') + '</span>'
      + '<span class="dato">' + esc(r.t) + '</span><span class="estado"><i class="marca ' + est + '"></i>' + ESTADOS[est] + '</span>'
      + (MUEBLES[id] || '') + '</button>';
  }

  function dibujarPendientes(lista) {
    var h = '<aside class="pendientes" aria-label="Lo que te toca"><h2>Lo que te toca</h2><p>Se van solos cuando se resuelven.</p>';
    if (!lista.length) return h + '<p class="vacio">No tenés nada pendiente. Buen momento para salir a vender.</p></aside>';
    return h + '<ol>' + lista.map(function (p) {
      return '<li data-n="' + p.n + '"><h3>' + esc(p.t) + '</h3><p>' + esc(p.d) + '</p>'
        + (p.a ? '<a href="' + esc(p.a) + '">' + esc(p.at) + '</a>' : '<a href="#mesa" data-ir="' + p.sala + '">Ver el espacio</a>') + '</li>';
    }).join('') + '</ol></aside>';
  }

  function medidas(items) {
    return '<div class="medidas">' + items.map(function (m) { return '<div><b class="num">' + esc(m[0]) + '</b><span>' + esc(m[1]) + '</span></div>'; }).join('') + '</div>';
  }
  function tabla(cols, filas) {
    return '<div class="tabla"><table><thead><tr>' + cols.map(function (c) { return '<th' + (c.n ? ' class="n"' : '') + ' scope="col">' + esc(c.t) + '</th>'; }).join('') + '</tr></thead><tbody>'
      + filas.map(function (f) { return '<tr>' + f.map(function (v, i) { return '<td' + (cols[i].n ? ' class="n num"' : '') + '>' + v + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  function siNo(v, si, no) { return v ? '<span class="si">' + si + '</span>' : '<span class="no">' + no + '</span>'; }

  var PROCESOS = { 'nexofit-avisos': 'Envío de avisos', 'nexofit-instagram': 'Publicador de Instagram', 'fitness-release-expired': 'Liberar reservas vencidas' };
  var ESTADO_PEDIDO = { nueva: 'Nuevo', abierta: 'Abierto', con_ofertas: 'Con ofertas', elegida: 'Oferta elegida', pagada: 'Pagado', vencida: 'Vencido' };
  function feed(x, id) {
    var l = novedadesDe(x, id);
    if (!l.length) return '';
    return '<h3>Lo último</h3><ol class="feed">' + l.slice(0, id === 'direccion' ? 14 : 8).map(function (n) {
      var seguro = /^https:\/\//.test(n.enlace || '');
      return '<li data-t="' + esc(n.tipo) + '"><time>' + esc(fechaHora(n.fecha)) + '</time><span><span class="etiqueta">' + esc(id === 'direccion' ? NOMBRES[n.espacio] : TIPOS[n.tipo]) + '</span><b>' + esc(n.titulo) + '</b></span>'
        + (n.detalle ? (n.detalle.length > 240 ? '<details><summary>Leer completo</summary><p>' + esc(n.detalle) + '</p></details>' : '<p>' + esc(n.detalle) + '</p>') : '') + (seguro ? '<a href="' + esc(n.enlace) + '" target="_blank" rel="noopener">Abrir</a>' : '') + '</li>';
    }).join('') + '</ol>';
  }
  var TIPOS = { avance: 'Avance', reporte: 'Reporte', alerta: 'Alerta' };

  function linea(serie) {
    var W = 150, H = 44, P = 5, v = serie.map(function (p) { return Number(p[1]); });
    var min = Math.min.apply(null, v), max = Math.max.apply(null, v), rango = max - min || 1;
    var px = function (i) { return v.length > 1 ? P + i * (W - 2 * P) / (v.length - 1) : W / 2; };
    var py = function (y) { return max === min ? H / 2 : H - P - (y - min) / rango * (H - 2 * P); };
    var d = v.map(function (y, i) { return (i ? 'L' : 'M') + px(i).toFixed(1) + ' ' + py(y).toFixed(1); }).join('');
    var u = v.length - 1;
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Evolución en ' + v.length + ' días">'
      + '<path d="' + d + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="' + px(u).toFixed(1) + '" cy="' + py(v[u]).toFixed(1) + '" r="4"/>'
      + serie.map(function (p, i) { return '<rect x="' + (px(i) - 8).toFixed(1) + '" y="0" width="16" height="' + H + '" fill="transparent"><title>' + esc(p[0]) + ': ' + esc(p[1]) + '</title></rect>'; }).join('') + '</svg>';
  }
  function tendencias(x, lista) {
    var h = lista.filter(function (l) { return (x.metricas[l[0]] || []).length; }).map(function (l) {
      var s = x.metricas[l[0]], u = s[s.length - 1][1], p = s.length > 1 ? s[0][1] : null, dif = p == null ? null : Number(u) - Number(p);
      return '<div class="tend"><span>' + esc(l[1]) + '</span><b class="num">' + esc(Number(u).toLocaleString('es-AR')) + '</b>' + linea(s) + '<small>' + (dif == null ? 'Primer dato de hoy' : (dif > 0 ? '+' : '') + dif + ' desde ' + fechaCorta(s[0][0] + 'T15:00:00Z')) + '</small></div>';
    }).join('');
    return h ? '<h3>Cómo viene</h3><div class="tendencias">' + h + '</div>' : '';
  }
  function embudo(x) {
    var v = x.ventas || {}, pasos = [['Empresas contactadas', v.prospectos || 0], ['Respondieron', v.respondieron_total || 0], ['En la red', x.red.length], ['Con Mercado Pago', x.conMp]];
    var cmp = [['Pedidos reales', x.pedidos.length], ['Con ofertas', x.conOfertas], ['Pagados', x.pagados.length]];
    var fila = function (l, tope) { return l.map(function (p) { return '<li><span>' + esc(p[0]) + '</span><i style="width:' + (tope ? Math.max(p[1] ? 1.5 : 0, p[1] / tope * 100) : 0).toFixed(1) + '%"></i><b class="num">' + p[1] + '</b></li>'; }).join(''); };
    return '<div class="embudos"><div><h3>Camino del proveedor</h3><ul class="embudo">' + fila(pasos, Math.max(pasos[0][1], 1)) + '</ul></div><div><h3>Camino del comprador</h3><ul class="embudo">' + fila(cmp, Math.max(x.pedidos.length, 1)) + '</ul></div></div>';
  }
  function checklist(x) {
    var l = listaLanzamiento(x), ok = l.filter(function (i) { return i.ok; }).length;
    return '<h3>Lista de lanzamiento: ' + ok + ' de ' + l.length + '</h3><ul class="lista">' + l.map(function (i) {
      return '<li data-ok="' + (i.ok ? 'si' : i.dudoso ? 'dudoso' : 'no') + '"><i></i>' + esc(i.t) + (i.dudoso ? ' (se comprueba en tu página)' : '') + '</li>';
    }).join('') + '</ul>';
  }
  function colaMeta(x) {
    var tipos = { post: 'Post', carrusel: 'Carrusel', historia: 'Historia', reel: 'Reel' };
    return x.cola.length ? '<h3>Cola de Meta: ' + x.colaTotal + ' piezas</h3>' + tabla([{ t: 'Cuándo' }, { t: 'Red' }, { t: 'Formato' }, { t: 'Qué' }],
      x.cola.slice(0, 16).map(function (q) { return [fechaHora(q.fecha), q.red === 'facebook' ? 'Facebook' : 'Instagram', esc(tipos[q.tipo] || q.tipo), esc(q.titulo)]; }))
      : '<p class="sin-datos">La cola de Meta está vacía.</p>';
  }
  function turnosMesa(id) {
    var l = turnosDe(id);
    return l.length ? '<p class="turno">Turno diario: ' + l.map(function (t) { return esc(t.h) + ', ' + esc(t.t.toLowerCase()); }).join('. ') + '.</p>' : '';
  }
  function pizarra(x, id) {
    var l = encargosDe(x, id), ETQ = { pendiente: 'Pendiente', en_curso: 'En curso', hecho: 'Hecho' };
    return '<h3>Encargos de este espacio</h3>'
      + (w.NF_OFICINA_PREVIEW ? '' : '<form class="encargo" data-espacio="' + id + '"><input aria-label="Qué le pedís a ' + esc(NOMBRES[id]) + '" placeholder="¿Qué le pedís a ' + esc(NOMBRES[id]) + '?" maxlength="200" required><button class="chip" type="submit">Encargar</button></form>')
      + (l.length ? '<ol class="feed">' + l.slice(0, 8).map(function (e) {
        return '<li><time>' + esc(ETQ[e.estado] || e.estado) + '</time><span><b>' + esc(e.titulo) + '</b></span>' + (e.resultado ? (e.resultado.length > 240 ? '<details><summary>Ver resultado</summary><p>' + esc(e.resultado) + '</p></details>' : '<p>' + esc(e.resultado) + '</p>') : e.detalle ? '<p>' + esc(e.detalle) + '</p>' : '') + '</li>';
      }).join('') + '</ol>' : '<p class="nota">Todavía no hay encargos. Lo que pidas acá lo toma el próximo turno.</p>');
  }

  function tablaProveedores(x, ui) {
    var q = (ui.q || '').toLowerCase();
    var lista = x.red.filter(function (r) { return (!ui.sinMp || !r.mp) && (!q || String(r.nombre).toLowerCase().indexOf(q) >= 0); });
    return '<h3>Proveedores</h3><div class="filtros"><input type="search" id="buscar" aria-label="Buscar proveedor" placeholder="Buscar proveedor" value="' + esc(ui.q || '') + '">'
      + '<button type="button" class="chip" id="sin-mp" aria-pressed="' + !!ui.sinMp + '">Sin Mercado Pago</button></div>'
      + (lista.length ? tabla([{ t: 'Empresa' }, { t: 'Tipo' }, { t: 'Alta' }, { t: 'Rubros', n: 1 }, { t: 'Comisión', n: 1 }, { t: 'Mercado Pago' }],
        lista.map(function (r) { return [esc(r.nombre), esc(r.tipo || '—'), fechaCorta(r.alta), r.rubros, r.comision + ' %', siNo(r.mp, 'Conectado', 'Sin conectar')]; }))
        : '<p class="sin-datos">Ningún proveedor coincide con ese filtro.</p>');
  }
  function tablaPedidos(x) {
    return '<h3>Pedidos</h3>' + (x.pedidos.length ? tabla([{ t: 'Pedido' }, { t: 'Comprador' }, { t: 'Lugar' }, { t: 'Fecha' }, { t: 'Ofertas', n: 1 }, { t: 'Estado' }],
      x.pedidos.map(function (p) { return [esc(p.code), esc(p.empresa || p.tipo), esc(p.localidad || p.provincia || '—'), fechaCorta(p.alta), p.ofertas + ' de ' + p.consultados, esc(ESTADO_PEDIDO[p.status] || p.status)]; }))
      : '<p class="sin-datos">Todavía no entró ningún pedido real. Las pruebas, demostraciones y descartados no cuentan.</p>');
  }

  var mesas = {
    direccion: function (x) {
      return { t: 'Dirección', s: 'El estado general y lo último de todos los espacios.',
        h: medidas([[Math.max(0, x.diasLanzamiento), 'días para lanzar'], [Math.max(0, x.diasCierre), 'días para cerrar la promo'], [x.red.length, 'proveedores'], [x.pedidos.length, 'pedidos reales']])
          + checklist(x) + tendencias(x, [['proveedores', 'Proveedores'], ['con_mp', 'Con Mercado Pago'], ['pedidos', 'Pedidos reales'], ['seguidores_ig', 'Seguidores de Instagram']])
          + (feed(x, 'direccion') || '<p class="sin-datos">Los avances y reportes de cada espacio van a aparecer acá.</p>') + pizarra(x, 'direccion') };
    },
    comercial: function (x, ui) {
      var v = x.ventas || {};
      return { t: 'Comercial', s: 'Proveedores, compradores y mails.',
        h: medidas([[x.red.length, 'proveedores activos'], [x.nuevos7, 'nuevos en 7 días'], [x.pedidos.length, 'pedidos reales'], [(v.seguimiento_enviados || 0) + ' de ' + (v.seguimiento_total || 0), 'mails de lanzamiento'], [v.respondieron || 0, 'respondieron al lanzamiento'], [v.prospectos || 0, 'empresas contactadas'], [v.bajas || 0, 'bajas'], [v.rebotes || 0, 'rebotes']])
          + embudo(x) + tendencias(x, [['proveedores', 'Proveedores'], ['con_mp', 'Con Mercado Pago']]) + pizarra(x, 'comercial') + feed(x, 'comercial') + ((v.respuestas || []).length ? '<h3>Respuestas para seguir</h3>' + tabla([{ t: 'Empresa' }, { t: 'Qué dijo' }], v.respuestas.map(function (r) { return [esc(r.empresa), esc(r.linea)]; })) : '')
          + tablaPedidos(x) + tablaProveedores(x, ui) };
    },
    redes: function (x) {
      var r = x.foto.redes || {};
      return { t: 'Redes sociales', s: 'Lo que está por salir y cómo viene el publicador.',
        h: medidas([[x.meta.programados || 0, 'programadas en Business Suite'], [x.igHoy, 'en Instagram hoy'], [x.fb.hoy || 0, 'en Facebook hoy'], [x.ig.conectado ? 'Conectado' : 'Sin conectar', 'Instagram por Meta'], [x.fb.conectado ? (x.fb.pagina || 'Conectado') : 'Sin conectar', 'Facebook'], [r.seguidores_ig == null ? '—' : r.seguidores_ig, 'seguidores en Instagram'], [r.fallidas_7d == null ? '—' : r.fallidas_7d, 'fallidas en 7 días']])
          + tendencias(x, [['seguidores_ig', 'Seguidores de Instagram'], ['alcance_ig', 'Alcance diario'], ['publicadas_meta', 'Publicadas por Meta']]) + colaMeta(x) + pizarra(x, 'redes') + feed(x, 'redes') + proximas(x) + '<p class="nota">Metricool queda solo para TikTok, 1 por día. Lo que cargues a mano en Business Suite aparece acá cuando se registra en la cola.' + (x.ig.ultimo_error ? ' Último error del publicador: ' + esc(x.ig.ultimo_error) : '') + '</p>' };
    },
    marketing: function (x) {
      var r = x.foto.redes || {};
      return { t: 'Marketing', s: 'Promoción de lanzamiento, alcance y campañas.',
        h: medidas([[x.promoCargadas, 'empresas con la promo'], [x.conPromo, 'nuevas sumadas con 5 %'], [r.alcance_ig_7d == null ? '—' : r.alcance_ig_7d, 'alcance diario promedio de Instagram']])
          + '<p class="nota">El 5 % es solo para empresas nuevas que recibieron la promo y se suman antes del 13/11. Las que ya estaban en la red no cambian.</p>'
          + tendencias(x, [['promo', 'Empresas con promo'], ['alcance_ig', 'Alcance diario']]) + pizarra(x, 'marketing') + (feed(x, 'marketing') || '<p class="sin-datos">Todavía no hay reportes de campañas.</p>') };
    },
    diseno: function (x) {
      var dv = x.foto.diseno || {};
      return { t: 'Diseño y video', s: 'Piezas en producción y publicaciones en cola.',
        h: medidas([[x.meta.programados || 0, 'programadas en Business Suite'], [x.colaTotal, 'en cola del publicador'], [x.cubiertoHasta ? fechaCorta(x.cubiertoHasta) : '—', 'cubierto hasta'], [dv.videos_semana == null ? '—' : dv.videos_semana, 'videos de la última tanda']])
          + pizarra(x, 'diseno') + (feed(x, 'diseno') || '<p class="sin-datos">Todavía no hay novedades de producción.</p>') + colaMeta(x) };
    },
    investigacion: function (x) {
      return { t: 'Investigación', s: 'Informes de mercado, competencia y compradores.',
        h: pizarra(x, 'investigacion') + (feed(x, 'investigacion') || '<p class="sin-datos">El primer radar de mercado y compradores sale en el turno de las 00:23.</p>') };
    },
    administracion: function (x) {
      var mp = x.mpListo === true ? 'Activo' : x.mpListo === false ? 'Sin activar' : 'Sin dato';
      return { t: 'Administración', s: 'Cobros con Mercado Pago y comisiones.',
        h: medidas([[mp, 'Mercado Pago en la página'], [x.conMp + ' de ' + x.red.length, 'proveedores conectados'], [plata(x.vendido), 'vendido'], [plata(x.comision), 'comisión cobrada']])
          + '<p class="nota">Exigir Mercado Pago para ofertar: ' + (x.exigirMp ? 'prendido' : 'apagado') + '.</p>' + tendencias(x, [['con_mp', 'Con Mercado Pago']]) + pizarra(x, 'administracion') + feed(x, 'administracion') };
    },
    operaciones: function (x) {
      var filas = (x.tareas || []).map(function (t) {
        return [esc(t.nombre), esc(t.cada || '—'), t.ultima ? fechaHora(t.ultima) : '—', t.estado === 'ok' || t.estado === 'fallo' ? siNo(t.estado === 'ok', 'Funciona', 'Falló') : '<span class="neutro">Sin dato</span>'];
      }).concat(x.automatismos.map(function (a) {
        var ok = a.activo && a.estado !== 'failed';
        var sinLlave = a.nombre === 'nexofit-instagram' && !x.ig.conectado && ok;
        return [esc(PROCESOS[a.nombre] || a.nombre), 'Cada pocos minutos', a.ultima ? fechaHora(a.ultima) : '—', sinLlave ? '<span class="no">Sin llave</span>' : siNo(ok, 'Funciona', 'Falló')];
      }));
      return { t: 'Operaciones', s: 'Lo que corre solo todos los días.',
        h: medidas([[x.avisos.enviados_7d || 0, 'avisos enviados en 7 días'], [x.avisos.errores_7d || 0, 'avisos fallidos en 7 días']])
          + pizarra(x, 'operaciones') + feed(x, 'operaciones') + '<h3>Tareas y procesos</h3>' + tabla([{ t: 'Proceso' }, { t: 'Cada cuánto' }, { t: 'Última vez' }, { t: 'Estado' }], filas)
          + '<p class="nota">' + (x.tareas ? 'Tareas leídas ' + hace(w.__nfFoto || x.ahora, x.ahora) + '.' : 'Las tareas programadas aparecen con la primera lectura.') + '</p>' };
    }
  };
  function proximas(x) {
    return x.proximas.length ? '<h3>Próximas publicaciones</h3>' + tabla([{ t: 'Cuándo' }, { t: 'Dónde' }, { t: 'Qué' }],
      x.proximas.slice(0, 8).map(function (p) { return [fechaHora(p.fecha), esc((p.redes || []).map(function (n) { return n === 'instagram' ? 'Instagram' : n === 'tiktok' ? 'TikTok' : n; }).join(' y ')), esc(p.titulo)]; }))
      : '<p class="sin-datos">No hay publicaciones próximas en Metricool.</p>';
  }

  var QUE_HACE = { direccion: 'Ordena prioridades y junta lo que hacen las demás salas.', comercial: 'Sigue proveedores, compradores y mails.', redes: 'Controla el calendario de Instagram, Facebook y TikTok.', marketing: 'Analiza contenido, promo y campañas.', diseno: 'Produce los videos y las piezas para publicar.', investigacion: 'Mira mercado, competencia y compradores.', administracion: 'Controla cobros y comisiones.', operaciones: 'Cuida que todo lo automático funcione.' };
  var ui = { sala: null, foco: null, q: '', sinMp: false, vista: '3d' }, datos = null, mpListo = null, raiz = null, mundo3d = null, cargando3d = false;

  function pintarMesa() {
    var cont = d.getElementById('mesa');
    if (!cont) return;
    var m = mesas[ui.sala](datos, ui);
    cont.innerHTML = '<div class="mesa-tope"><h2>' + esc(m.t) + '</h2><p>' + esc(m.s) + '</p></div>' + turnosMesa(ui.sala) + m.h;
    var fe = cont.querySelector('.encargo');
    if (fe) fe.onsubmit = function (ev) {
      ev.preventDefault();
      var inp = fe.querySelector('input'), bot = fe.querySelector('button');
      bot.disabled = true; bot.textContent = 'Encargando…';
      sesionVigente().then(function (s) { return pedir('/rest/v1/rpc/fitness_oficina_encargar', { p_espacio: fe.dataset.espacio, p_titulo: inp.value }, s && s.access_token); })
        .then(function () { return cargar(); })
        .catch(function () { bot.disabled = false; bot.textContent = 'Encargar'; inp.setCustomValidity('No se pudo guardar. Probá de nuevo.'); inp.reportValidity(); });
    };
    var b = d.getElementById('buscar');
    if (b) b.oninput = function () { ui.q = b.value; pintarMesa(); var n = d.getElementById('buscar'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
    var c = d.getElementById('sin-mp');
    if (c) c.onclick = function () { ui.sinMp = !ui.sinMp; pintarMesa(); };
    raiz.querySelectorAll('.sala').forEach(function (s) { s.setAttribute('aria-pressed', String(s.dataset.sala === ui.sala)); });
  }

  function atarSaltos() {
    raiz.querySelectorAll('[data-ir]').forEach(function (a) {
      a.onclick = function (ev) { ev.preventDefault(); elegirSala(a.dataset.ir, true); };
    });
  }
  function enfocarSala(id) {
    if (id !== 'jefe') { ui.sala = id; pintarMesa(); }
    ui.foco = id; pintarFicha(); refrescar3d();
    if (mundo3d) mundo3d.enfocar(id);
  }
  function salirDeSala() {
    ui.foco = null; pintarFicha();
    if (mundo3d) mundo3d.enfocar(null);
  }
  function pintarFicha() {
    var f = d.getElementById('ficha');
    if (!f) return;
    var abierta = !!ui.foco && ui.vista === '3d', caja = raiz.querySelector('.escenario');
    if (caja) caja.classList.toggle('con-ficha', abierta);
    if (!abierta) { f.hidden = true; return; }
    if (ui.foco === 'jefe') { fichaJefe(f); return; }
    var id = ui.foco, a = actividad(datos)[id], p = a.pantalla, ult = novedadesDe(datos, id)[0], abiertos = encargosDe(datos, id).filter(function (e) { return e.estado !== 'hecho'; }).length;
    f.hidden = false; f.dataset.estado = a.estado;
    f.innerHTML = '<button type="button" class="ficha-cerrar" id="ficha-cerrar">Ver toda la oficina</button><h2>' + esc(a.nombre) + '</h2><p class="ficha-hace">' + esc(QUE_HACE[id]) + '</p>'
      + '<p class="ficha-estado"><i class="marca ' + a.estado + '"></i>' + esc(ESTADOS[a.estado]) + '</p>'
      + '<p class="ficha-ahora">' + (a.trabajando ? '<b>Trabajando ahora</b>' + esc(a.tarea || '') : a.proximo ? '<b>Próximo turno ' + esc(a.proximo) + ', en ' + esc(faltaPara(a.proximo, datos.ahora)) + '</b>' + esc(a.proximoT || '') : 'Sin turno diario') + '</p>'
      + '<div class="ficha-cifra"><b class="num">' + esc(p.cifra) + '</b><span>' + esc(p.unidad) + '</span></div>'
      + '<dl>' + p.filas.map(function (c) { return '<div><dt>' + esc(c[0]) + '</dt><dd class="num">' + esc(c[1]) + '</dd></div>'; }).join('') + '<div><dt>Encargos abiertos</dt><dd class="num">' + abiertos + '</dd></div></dl>'
      + (ult ? '<p class="ficha-ultimo"><b>Lo último, ' + esc(hace(ult.fecha, datos.ahora)) + '</b>' + esc(ult.titulo) + '</p>' : '')
      + '<button type="button" class="boton fuerte" id="ficha-detalle">Abrir todo el detalle</button>';
    d.getElementById('ficha-cerrar').onclick = salirDeSala;
    d.getElementById('ficha-detalle').onclick = function () { d.getElementById('mesa').scrollIntoView({ block: 'start' }); };
  }
  function fichaJefe(f) {
    var x = datos, lista = pendientes(x).slice(0, 3), abiertos = x.encargos.filter(function (e) { return e.estado === 'pendiente' || e.estado === 'en_curso'; }).slice(0, 4);
    f.hidden = false; f.dataset.estado = 'orden';
    f.innerHTML = '<button type="button" class="ficha-cerrar" id="ficha-cerrar">Ver toda la oficina</button><h2>Sala del jefe</h2><p class="ficha-hace">Desde acá le das indicaciones a cada sala. El próximo turno las toma.</p>'
      + '<form class="indicacion" id="indicacion"><label for="ind-sala">Para</label><select id="ind-sala">' + SALAS.map(function (s) { return '<option value="' + s + '"' + (s === ui.indicar ? ' selected' : '') + '>' + esc(NOMBRES[s]) + '</option>'; }).join('') + '</select>'
      + '<label for="ind-texto">Indicación</label><input id="ind-texto" maxlength="200" required placeholder="¿Qué necesitás?"><button class="boton fuerte" type="submit">Dar la indicación</button><p class="ficha-error" id="ind-error" hidden></p></form>'
      + '<div class="ficha-lista"><h3>Lo que te toca</h3>' + (lista.length ? '<ul>' + lista.map(function (p) { return '<li>' + esc(p.t) + '</li>'; }).join('') + '</ul>' : '<p>Nada por ahora.</p>') + '</div>'
      + '<div class="ficha-lista"><h3>Indicaciones abiertas</h3>' + (abiertos.length ? '<ul>' + abiertos.map(function (e) { return '<li>' + esc(NOMBRES[e.espacio]) + ': ' + esc(e.titulo) + '</li>'; }).join('') + '</ul>' : '<p>No hay indicaciones abiertas.</p>') + '</div>';
    d.getElementById('ficha-cerrar').onclick = salirDeSala;
    var form = d.getElementById('indicacion'), sala = d.getElementById('ind-sala'), txt = d.getElementById('ind-texto'), err = d.getElementById('ind-error');
    sala.onchange = function () { ui.indicar = sala.value; };
    form.onsubmit = function (ev) {
      ev.preventDefault();
      var boton = form.querySelector('button'), texto = txt.value.trim(), destino = sala.value;
      if (!texto) return;
      boton.disabled = true; boton.textContent = 'Enviando…'; err.hidden = true;
      var hecho = function () { if (mundo3d) mundo3d.ordenar(destino, NOMBRES[destino] + ': ' + texto); txt.value = ''; boton.disabled = false; boton.textContent = 'Dar la indicación'; };
      if (w.NF_OFICINA_PREVIEW) { hecho(); return; }
      sesionVigente().then(function (s) { return pedir('/rest/v1/rpc/fitness_oficina_encargar', { p_espacio: destino, p_titulo: texto }, s && s.access_token); })
        .then(function () { hecho(); return cargar(); })
        .catch(function () { boton.disabled = false; boton.textContent = 'Dar la indicación'; err.textContent = 'No se guardó la indicación. Probá de nuevo.'; err.hidden = false; });
    };
  }
  var ESPERA_3D = 'La oficina 3D todavía está cargando. Esperá unos segundos y probá de nuevo.', SIN_GRABADOR = 'Este navegador no puede grabar video. Probá en Chrome de escritorio.';
  /* Estudio: elige el guion, graba la oficina en vertical y deja el video listo para bajar. */
  function abrirEstudio() {
    var c = d.getElementById('estudio');
    if (!c) return;
    if (ui.foco) salirDeSala();
    if (ui.vista !== '3d') { ui.vista = '3d'; mostrarVista(); arrancar3d(); }
    c.hidden = false;
    c.innerHTML = '<h2>Crear contenido</h2><p>Grabá la oficina en vertical para Reels y TikTok. Solo muestra datos públicos: nada de cobros, mails ni alertas.</p>'
      + '<div class="guiones" role="radiogroup" aria-label="Guion">' + Object.keys(GUIONES).map(function (k, i) { return '<label><input type="radio" name="guion" value="' + k + '"' + (i ? '' : ' checked') + '><span><b>' + esc(GUIONES[k].n) + '</b>' + esc(GUIONES[k].d) + '</span></label>'; }).join('') + '</div>'
      + '<div class="estudio-botones"><button type="button" class="boton fuerte" id="est-video">Grabar video</button><button type="button" class="boton" id="est-foto">Sacar foto</button><button type="button" class="boton" id="est-cerrar">Cerrar</button></div>';
    var elegido = function () { return c.querySelector('[name=guion]:checked').value; };
    d.getElementById('est-cerrar').onclick = function () { c.hidden = true; };
    var aviso = function (t) { c.querySelector('p').textContent = t; };
    d.getElementById('est-foto').onclick = function () { if (!mundo3d) { aviso(ESPERA_3D); return; } mundo3d.foto({ tomas: guion(elegido(), datos), fin: function (b) { bajar(b, 'nexo-fit-oficina.png'); } }); };
    d.getElementById('est-video').onclick = function () {
      if (!mundo3d) { aviso(ESPERA_3D); return; }
      if (!w.MediaRecorder) { aviso(SIN_GRABADOR); return; }
      var id = elegido(), tomas = guion(id, datos);
      c.innerHTML = '<h2>Grabando</h2><p>Dejá esta pestaña abierta hasta que termine.</p><div class="estudio-previa" id="est-previa"></div><div class="barra"><i id="est-barra"></i></div>';
      var lienzo = mundo3d.grabar({ tomas: tomas,
        avance: function (k) { var b = d.getElementById('est-barra'); if (b) b.style.width = (k * 100).toFixed(1) + '%'; },
        fin: function (blob, tipo) {
          if (!blob || !blob.size) { abrirEstudio(); aviso('No se pudo grabar el video. Probá de nuevo con esta pestaña a la vista.'); return; }
          var ext = /mp4/.test(tipo) ? 'mp4' : 'webm', url = URL.createObjectURL(blob);
          c.innerHTML = '<h2>Video listo</h2>' + (ext === 'webm' ? '<p>Este navegador grabó en WebM. Instagram pide MP4: actualizá Chrome para grabar en MP4.</p>' : '<p>Le falta la música: sumala al subirlo a Instagram o TikTok.</p>')
            + '<video class="estudio-previa" controls playsinline src="' + url + '"></video><div class="estudio-botones"><a class="boton fuerte" href="' + url + '" download="nexo-fit-' + id + '.' + ext + '">Descargar video</a><button type="button" class="boton" id="est-otra">Grabar otro</button></div>';
          d.getElementById('est-otra').onclick = abrirEstudio;
        } });
      if (!lienzo) { abrirEstudio(); aviso(SIN_GRABADOR); return; }
      d.getElementById('est-previa').appendChild(lienzo);
    };
  }
  function bajar(blob, nombre) {
    var a = d.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre; d.body.appendChild(a); a.click(); a.remove();
  }
  function pintarHud(x) {
    var r = d.getElementById('hud-reloj'), n = proximoTurno(x.ahora), h = horaBA(x.ahora);
    if (r) r.innerHTML = '<b class="num">' + esc(h) + '</b><span>Buenos Aires</span><span>Próximo turno: ' + esc(NOMBRES[n.e]) + ' en ' + esc(faltaPara(n.h, x.ahora)) + '</span>';
  }
  var noticiaI = 0;
  function pintarNoticia() {
    var el = d.getElementById('noticia');
    if (!el || !datos) return;
    var l = datos.novedades.slice(0, 6);
    if (!l.length) { el.textContent = 'Las novedades de cada sala van a aparecer acá.'; return; }
    var n = l[noticiaI % l.length];
    el.textContent = NOMBRES[n.espacio] + ', ' + hace(n.fecha, datos.ahora) + ': ' + n.titulo;
  }
  function elegirSala(id, bajar) {
    ui.sala = id; pintarMesa(); refrescar3d();
    if (bajar || w.innerWidth < 980) d.getElementById('mesa').scrollIntoView({ block: 'start' });
  }
  function atarVista() {
    var a = d.getElementById('ver-3d'), b = d.getElementById('ver-plano'), c = d.getElementById('ver-estudio');
    if (!a) return;
    if (!hay3d()) { a.hidden = true; b.hidden = true; c.hidden = true; }
    c.onclick = abrirEstudio;
    a.onclick = function () { ui.vista = '3d'; mostrarVista(); arrancar3d(); };
    b.onclick = function () { ui.vista = 'plano'; mostrarVista(); };
  }
  function mostrarVista() {
    var es = ui.vista === '3d', e = d.getElementById('escena'), p = raiz.querySelector('.plano'), hud = raiz.querySelector('.hud-3d');
    if (e) e.hidden = !es;
    if (hud) hud.hidden = !es;
    pintarFicha();
    if (p) p.hidden = es;
    d.getElementById('ver-3d').setAttribute('aria-pressed', String(es));
    d.getElementById('ver-plano').setAttribute('aria-pressed', String(!es));
  }
  function hay3d() {
    if (!w.WebGLRenderingContext || (w.NF_OFICINA_PREVIEW && !w.NF_OFICINA_PREVIEW.con3d)) return false;
    try { var c = d.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
  }
  function refrescar3d() {
    if (!mundo3d || !datos) return;
    var e = actividad(datos);
    e.jefe = { nombre: 'Sala del jefe', estado: 'orden', trabajando: true, texto: 'Nicolás' };
    mundo3d.actualizar(e, ui.sala, info3d(datos));
  }
  function arrancar3d() {
    var e = d.getElementById('escena');
    if (ui.vista !== '3d') return;
    if (!hay3d()) { ui.vista = 'plano'; mostrarVista(); return; }
    if (mundo3d) { mundo3d.montar(e); refrescar3d(); return; }
    if (cargando3d) return;
    cargando3d = true;
    var fuente = d.currentScript || d.querySelector('script[src*="oficina.js"]'), base = (w.NF_OFICINA_PREVIEW && w.NF_OFICINA_PREVIEW.base) || fuente.src.replace(/oficina\.js.*$/, '');
    Promise.all([import(base + 'vendor/three/three.module.min.js'), import(base + 'vendor/three/OrbitControls.js'), import(base + 'oficina3d.js')]).then(function (m) {
      mundo3d = m[2].crear(m[0], m[1].OrbitControls, d.getElementById('escena'), { elegir: enfocarSala, salir: salirDeSala });
      w.__nfMundo = mundo3d;
      w.__nfGuion = function (id) { return guion(id, datos); };
      refrescar3d();
    }).catch(function () { ui.vista = 'plano'; mostrarVista(); var a = d.getElementById('ver-3d'); if (a) a.hidden = true; }).then(function () { cargando3d = false; });
  }

  /* Cada minuto actualiza lo vivo sin tocar lo que se está leyendo o escribiendo en la mesa. */
  function pintarVivo(d0, ahora) {
    w.__nfFoto = d0.foto && d0.foto.actualizada;
    var antes = datos;
    datos = leer(d0, ahora, mpListo);
    if (mundo3d && antes) {
      if (datos.red.length > antes.red.length || datos.pedidos.length > antes.pedidos.length) mundo3d.festejar('comercial');
      if (datos.pagados.length > antes.pagados.length) mundo3d.festejar('administracion');
    }
    pintarHud(datos); pintarNoticia(); if (!d.activeElement || d.activeElement.id !== 'ind-texto') pintarFicha();
    var lista = pendientes(datos), h = raiz.querySelector('.hora'), f = raiz.querySelector('.frase h1'), t = d.getElementById('turnos'), p = raiz.querySelector('.pendientes');
    if (h) h.textContent = 'Actualizada ' + fechaHora(ahora);
    if (f) f.textContent = frase(datos, lista);
    if (t) t.outerHTML = dibujarTurnos(datos);
    if (p) p.outerHTML = dibujarPendientes(lista);
    raiz.querySelectorAll('.sala').forEach(function (b) { b.dataset.estado = estadoSala(b.dataset.sala, datos); });
    atarSaltos();
    refrescar3d();
  }

  function pintar(d0, ahora) {
    w.__nfFoto = d0.foto && d0.foto.actualizada;
    datos = leer(d0, ahora, mpListo);
    var lista = pendientes(datos);
    ui.sala = ui.sala || (lista[0] ? lista[0].sala : 'direccion');
    raiz.innerHTML = '<div class="marco"><header class="tope"><img src="assets/icon-192.png" alt=""><b>Oficina Nexo Fit</b>'
      + '<span class="hora">' + (w.NF_OFICINA_PREVIEW ? 'Vista previa con datos de ' : 'Actualizada ') + esc(fechaHora(ahora)) + '</span>'
      + (w.NF_OFICINA_PREVIEW ? '' : '<button type="button" class="boton" id="actualizar">Actualizar</button><a class="boton" href="admin.html">Ir al panel</a>')
      + '</header><section class="frase"><h1>' + esc(frase(datos, lista)) + '</h1></section>'
      + '<div class="vista"><div class="escenario"><div class="vista-tope"><button type="button" class="chip-o" id="ver-3d" aria-pressed="' + (ui.vista === '3d') + '">Oficina 3D</button><button type="button" class="chip-o" id="ver-plano" aria-pressed="' + (ui.vista !== '3d') + '">Plano</button><button type="button" class="chip-o" id="ver-estudio">Crear contenido</button></div>'
      + '<div class="escena3d" id="escena"' + (ui.vista === '3d' ? '' : ' hidden') + '></div>'
      + '<div class="hud-3d"' + (ui.vista === '3d' ? '' : ' hidden') + '><div class="hud-reloj" id="hud-reloj"></div><ul class="hud-leyenda" aria-label="Qué significan las luces"><li><i class="marca orden"></i>En orden</li><li><i class="marca atencion"></i>Atención</li><li><i class="marca frenada"></i>Frenada</li></ul><p class="noticia" id="noticia"></p></div>'
      + '<aside class="ficha" id="ficha" aria-label="Sala elegida" hidden></aside><div class="estudio" id="estudio" hidden></div></div>'
      + '<div class="plano" role="group" aria-label="Plano de la oficina: elegí un espacio"' + (ui.vista === '3d' ? ' hidden' : '') + '>'
      + SALAS.map(function (id, i) { return dibujarSala(id, i, datos, ui.sala); }).join('')
      + '<i class="puerta v p1"></i><i class="puerta v p2"></i><i class="puerta h p3"></i><i class="puerta v p4"></i><div class="entrada"><span>Entrada</span></div></div>'
      + '<p class="aclaracion">Las personas son una representación. Pantallas, luces, turnos, hora del día y novedades son reales y se actualizan cada minuto. Tocá una sala para entrar.</p></div>'
      + '<div class="trabajo"><div class="trabajo-izq">' + dibujarCota(datos) + dibujarTurnos(datos) + '</div>' + dibujarPendientes(lista) + '</div><section class="mesa" id="mesa" aria-live="polite"></section>'
      + '<footer class="pie">Pedidos, proveedores y caja se leen en vivo. Redes, mails, tareas, avances y reportes llegan con cada turno.</footer></div>';
    pintarMesa();
    atarVista();
    pintarHud(datos); pintarNoticia(); pintarFicha();
    arrancar3d();
    raiz.querySelectorAll('[data-sala]').forEach(function (b) {
      b.onclick = function () { ui.sala = b.dataset.sala; pintarMesa(); refrescar3d(); if (w.innerWidth < 980) d.getElementById('mesa').scrollIntoView({ block: 'start' }); };
    });
    atarSaltos();
    var act = d.getElementById('actualizar');
    if (act) act.onclick = function () { act.disabled = true; act.textContent = 'Actualizando…'; cargar(); };
  }

  /* ---------- Sesión: la misma del panel de administración ---------- */
  function sesion() { try { return JSON.parse(w.sessionStorage.getItem(STORAGE) || 'null'); } catch (e) { return null; } }
  function guardar(s) { try { if (s) w.sessionStorage.setItem(STORAGE, JSON.stringify(s)); else w.sessionStorage.removeItem(STORAGE); } catch (e) { /* queda sin sesión guardada */ } }
  function pedir(ruta, cuerpo, token) {
    var h = { apikey: CFG.key, 'Content-Type': 'application/json' };
    if (token) h.Authorization = 'Bearer ' + token;
    return w.fetch(CFG.url + ruta, { method: 'POST', headers: h, body: JSON.stringify(cuerpo || {}) }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) { var e = Error(j.message || j.msg || j.error_description || 'No se pudo leer la oficina.'); e.status = r.status; throw e; }
        return j;
      });
    });
  }
  function sesionVigente() {
    var s = sesion();
    if (!s) return Promise.resolve(null);
    if (!s.expires_at || s.expires_at > Date.now() / 1000 + 30) return Promise.resolve(s);
    return pedir('/auth/v1/token?grant_type=refresh_token', { refresh_token: s.refresh_token }).then(function (n) { guardar(n); return n; }).catch(function () { guardar(null); return null; });
  }
  function pintarIngreso(msg) {
    raiz.innerHTML = '<div class="ingreso"><form id="entrar"><h1>Oficina Nexo Fit</h1><p>Entrá con tu cuenta de administrador.</p>'
      + '<label for="o-mail">Email</label><input id="o-mail" type="email" autocomplete="username" required>'
      + '<label for="o-clave">Clave</label><input id="o-clave" type="password" autocomplete="current-password" required>'
      + '<button class="boton fuerte" type="submit">Entrar a la oficina</button>' + (msg ? '<p class="error" role="alert">' + esc(msg) + '</p>' : '') + '</form></div>';
    d.getElementById('entrar').onsubmit = function (ev) {
      ev.preventDefault();
      var btn = ev.target.querySelector('button');
      btn.disabled = true;
      pedir('/auth/v1/token?grant_type=password', { email: d.getElementById('o-mail').value.trim(), password: d.getElementById('o-clave').value })
        .then(function (s) { guardar(s); cargar(); })
        .catch(function (e) { pintarIngreso(e.status === 400 ? 'El email o la clave no coinciden.' : 'No se pudo entrar. Revisá la conexión y probá de nuevo.'); });
    };
  }
  function pintarFalla(msg) {
    raiz.innerHTML = '<div class="ingreso"><form id="reintentar"><h1>La oficina no abrió</h1><p>' + esc(msg) + '</p><button class="boton fuerte" type="submit">Probar de nuevo</button></form></div>';
    d.getElementById('reintentar').onsubmit = function (ev) { ev.preventDefault(); cargar(); };
  }
  function leerMeta(token) { return pedir('/rest/v1/rpc/fitness_oficina_meta', {}, token).catch(function () { return null; }); }
  function cargar() {
    return sesionVigente().then(function (s) {
      if (!s) return pintarIngreso();
      var estadoMp = w.fetch('/api/pagos/estado').then(function (r) { return r.json(); }).then(function (j) { return !!j.mercadoPago; }).catch(function () { return null; });
      return Promise.all([pedir('/rest/v1/rpc/fitness_oficina', {}, s.access_token), estadoMp, leerMeta(s.access_token)]).then(function (r) {
        mpListo = r[1]; r[0].meta = r[2];
        pintar(r[0], r[0].ahora || new Date().toISOString());
      }).catch(function (e) {
        if (e.status === 401) { guardar(null); return pintarIngreso('Tu sesión venció. Entrá de nuevo.'); }
        if (/No autorizado/.test(e.message)) { guardar(null); return pintarIngreso('Esta cuenta no tiene acceso a la oficina.'); }
        pintarFalla('No se pudieron leer los datos. Revisá la conexión.');
      });
    });
  }

  w.NFOficina = { actividad: actividad, listaLanzamiento: listaLanzamiento, proximoTurno: proximoTurno, TURNOS: TURNOS, leer: leer, pendientes: pendientes, estadoSala: estadoSala, guion: guion, frase: frase, diaBA: diaBA, mesas: mesas, SALAS: SALAS };
  function iniciar() {
    raiz = d.getElementById('oficina');
    if (!raiz) return;
    d.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && ui.foco) salirDeSala(); });
    if (!(w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches)) w.setInterval(function () { if (!d.hidden) { noticiaI++; pintarNoticia(); } }, 8000);
    if (w.NF_OFICINA_PREVIEW) { mpListo = w.NF_OFICINA_PREVIEW.mpListo; pintar(w.NF_OFICINA_PREVIEW.datos, w.NF_OFICINA_PREVIEW.datos.ahora); return; }
    cargar();
    w.setInterval(function () {
      if (d.hidden || !d.getElementById('actualizar')) return;
      sesionVigente().then(function (s) { return s ? Promise.all([pedir('/rest/v1/rpc/fitness_oficina', {}, s.access_token), leerMeta(s.access_token)]) : null; }).then(function (r) { if (r) { r[0].meta = r[1]; pintarVivo(r[0], r[0].ahora); } }).catch(function () { /* el próximo minuto reintenta */ });
    }, 60 * 1000);
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})(window, document);

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
    }).length + ((d0.instagram && d0.instagram.hoy) || 0);
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
      ig: d0.instagram || {}, igHoy: igHoy, proximas: proximas,
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
      return (!x.ig.conectado || !x.igHoy) ? 'atencion' : 'orden';
    }
    if (id === 'operaciones') {
      if (tareasCaidas(x)) return 'frenada';
      return (x.fotoVieja || x.avisos.errores_7d) ? 'atencion' : 'orden';
    }
    return novedadesDe(x, id).length ? 'orden' : 'nada';
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
    if (!x.ig.conectado) p.push({ n: x.igHoy ? 'atencion' : 'frenada', sala: 'redes', t: 'Conectar la llave de Instagram',
      d: 'Sin la llave, el publicador de la página no puede publicar. Son unos 15 minutos desde la compu.', a: 'admin.html', at: 'Abrir el panel' });
    if (!x.igHoy) p.push({ n: 'atencion', sala: 'redes', t: 'Instagram no tiene nada para hoy',
      d: 'No hay publicaciones programadas para hoy en el publicador ni en Metricool. Revisá también Business Suite: desde acá no se ve.' });
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
    if (id === 'redes') return { n: n, c: x.igHoy, de: ' hoy', t: 'en Instagram' + (x.ig.conectado ? '' : ', publicador sin conectar') };
    if (id === 'marketing') return { n: n, c: x.promoCargadas, de: '', t: 'empresas con la promo, ' + x.conPromo + ' ya sumadas' };
    if (id === 'diseno') return { n: n, c: x.proximas.length, de: ' en cola', t: ult ? ult.titulo : 'Piezas por publicar' };
    if (id === 'investigacion') return { n: n, c: novedadesDe(x, id).filter(function (i) { return i.tipo === 'reporte'; }).length, de: ' informes', t: ult ? ult.titulo : 'Esperando su primer encargo' };
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
        + (n.detalle ? '<p>' + esc(n.detalle) + '</p>' : '') + (seguro ? '<a href="' + esc(n.enlace) + '" target="_blank" rel="noopener">Abrir</a>' : '') + '</li>';
    }).join('') + '</ol>';
  }
  var TIPOS = { avance: 'Avance', reporte: 'Reporte', alerta: 'Alerta' };

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
          + (feed(x, 'direccion') || '<p class="sin-datos">Los avances y reportes de cada espacio van a aparecer acá.</p>') };
    },
    comercial: function (x, ui) {
      var v = x.ventas || {};
      return { t: 'Comercial', s: 'Proveedores, compradores y mails.',
        h: medidas([[x.red.length, 'proveedores activos'], [x.nuevos7, 'nuevos en 7 días'], [x.pedidos.length, 'pedidos reales'], [(v.seguimiento_enviados || 0) + ' de ' + (v.seguimiento_total || 0), 'mails de lanzamiento'], [v.respondieron || 0, 'respondieron al lanzamiento'], [v.prospectos || 0, 'empresas contactadas'], [v.bajas || 0, 'bajas'], [v.rebotes || 0, 'rebotes']])
          + feed(x, 'comercial') + ((v.respuestas || []).length ? '<h3>Respuestas para seguir</h3>' + tabla([{ t: 'Empresa' }, { t: 'Qué dijo' }], v.respuestas.map(function (r) { return [esc(r.empresa), esc(r.linea)]; })) : '')
          + tablaPedidos(x) + tablaProveedores(x, ui) };
    },
    redes: function (x) {
      var r = x.foto.redes || {};
      return { t: 'Redes sociales', s: 'Lo que está por salir y cómo viene el publicador.',
        h: medidas([[x.igHoy, 'en Instagram hoy'], [x.ig.conectado ? 'Conectado' : 'Sin conectar', 'publicador de la página'], [r.seguidores_ig == null ? '—' : r.seguidores_ig, 'seguidores en Instagram'], [r.fallidas_7d == null ? '—' : r.fallidas_7d, 'fallidas en 7 días']])
          + feed(x, 'redes') + proximas(x) + '<p class="nota">Lo programado a mano en Meta Business Suite no se ve desde acá.' + (x.ig.ultimo_error ? ' Último error del publicador: ' + esc(x.ig.ultimo_error) : '') + '</p>' };
    },
    marketing: function (x) {
      var r = x.foto.redes || {};
      return { t: 'Marketing', s: 'Promoción de lanzamiento, alcance y campañas.',
        h: medidas([[x.promoCargadas, 'empresas con la promo'], [x.conPromo, 'nuevas sumadas con 5 %'], [r.alcance_ig_7d == null ? '—' : r.alcance_ig_7d, 'alcance diario promedio de Instagram']])
          + '<p class="nota">El 5 % es solo para empresas nuevas que recibieron la promo y se suman antes del 13/11. Las que ya estaban en la red no cambian.</p>'
          + (feed(x, 'marketing') || '<p class="sin-datos">Todavía no hay reportes de campañas.</p>') };
    },
    diseno: function (x) {
      var dv = x.foto.diseno || {};
      return { t: 'Diseño y video', s: 'Piezas en producción y publicaciones en cola.',
        h: medidas([[x.proximas.length, 'publicaciones en cola'], [dv.videos_semana == null ? '—' : dv.videos_semana, 'videos de la última tanda']])
          + (feed(x, 'diseno') || '<p class="sin-datos">Todavía no hay novedades de producción.</p>') + proximas(x) };
    },
    investigacion: function (x) {
      return { t: 'Investigación', s: 'Informes de mercado, competencia y compradores.',
        h: feed(x, 'investigacion') || '<p class="sin-datos">Este espacio todavía no tiene encargos. Cuando pidas un estudio, el informe va a quedar acá.</p>' };
    },
    administracion: function (x) {
      var mp = x.mpListo === true ? 'Activo' : x.mpListo === false ? 'Sin activar' : 'Sin dato';
      return { t: 'Administración', s: 'Cobros con Mercado Pago y comisiones.',
        h: medidas([[mp, 'Mercado Pago en la página'], [x.conMp + ' de ' + x.red.length, 'proveedores conectados'], [plata(x.vendido), 'vendido'], [plata(x.comision), 'comisión cobrada']])
          + '<p class="nota">Exigir Mercado Pago para ofertar: ' + (x.exigirMp ? 'prendido' : 'apagado') + '.</p>' + feed(x, 'administracion') };
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
          + feed(x, 'operaciones') + '<h3>Tareas y procesos</h3>' + tabla([{ t: 'Proceso' }, { t: 'Cada cuánto' }, { t: 'Última vez' }, { t: 'Estado' }], filas)
          + '<p class="nota">' + (x.tareas ? 'Tareas leídas ' + hace(w.__nfFoto || x.ahora, x.ahora) + '.' : 'Las tareas programadas aparecen con la primera lectura.') + '</p>' };
    }
  };
  function proximas(x) {
    return x.proximas.length ? '<h3>Próximas publicaciones</h3>' + tabla([{ t: 'Cuándo' }, { t: 'Dónde' }, { t: 'Qué' }],
      x.proximas.slice(0, 8).map(function (p) { return [fechaHora(p.fecha), esc((p.redes || []).map(function (n) { return n === 'instagram' ? 'Instagram' : n === 'tiktok' ? 'TikTok' : n; }).join(' y ')), esc(p.titulo)]; }))
      : '<p class="sin-datos">No hay publicaciones próximas en Metricool.</p>';
  }

  var ui = { sala: null, q: '', sinMp: false }, datos = null, mpListo = null, raiz = null;

  function pintarMesa() {
    var cont = d.getElementById('mesa');
    if (!cont) return;
    var m = mesas[ui.sala](datos, ui);
    cont.innerHTML = '<div class="mesa-tope"><h2>' + esc(m.t) + '</h2><p>' + esc(m.s) + '</p></div>' + m.h;
    var b = d.getElementById('buscar');
    if (b) b.oninput = function () { ui.q = b.value; pintarMesa(); var n = d.getElementById('buscar'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
    var c = d.getElementById('sin-mp');
    if (c) c.onclick = function () { ui.sinMp = !ui.sinMp; pintarMesa(); };
    raiz.querySelectorAll('.sala').forEach(function (s) { s.setAttribute('aria-pressed', String(s.dataset.sala === ui.sala)); });
  }

  function pintar(d0, ahora) {
    w.__nfFoto = d0.foto && d0.foto.actualizada;
    datos = leer(d0, ahora, mpListo);
    var lista = pendientes(datos);
    ui.sala = ui.sala || (lista[0] ? lista[0].sala : 'direccion');
    raiz.innerHTML = '<div class="marco"><header class="tope"><img src="assets/icon-192.png" alt=""><b>Oficina Nexo Fit</b>'
      + '<span class="hora">' + (w.NF_OFICINA_PREVIEW ? 'Vista previa con datos de ' : 'Actualizada ') + esc(fechaHora(ahora)) + '</span>'
      + (w.NF_OFICINA_PREVIEW ? '' : '<button type="button" class="boton" id="actualizar">Actualizar</button><a class="boton" href="admin.html">Ir al panel</a>')
      + '</header><section class="frase"><h1>' + esc(frase(datos, lista)) + '</h1></section>' + dibujarCota(datos)
      + '<div class="trabajo"><div class="plano" role="group" aria-label="Plano de la oficina: elegí un espacio">'
      + SALAS.map(function (id, i) { return dibujarSala(id, i, datos, ui.sala); }).join('')
      + '<i class="puerta v p1"></i><i class="puerta v p2"></i><i class="puerta h p3"></i><i class="puerta v p4"></i><div class="entrada"><span>Entrada</span></div></div>'
      + dibujarPendientes(lista) + '</div><section class="mesa" id="mesa" aria-live="polite"></section>'
      + '<footer class="pie">Pedidos, proveedores y caja se leen en vivo. Redes, mails, tareas, avances y reportes llegan con cada lectura programada.</footer></div>';
    pintarMesa();
    raiz.querySelectorAll('[data-sala]').forEach(function (b) {
      b.onclick = function () { ui.sala = b.dataset.sala; pintarMesa(); if (w.innerWidth < 980) d.getElementById('mesa').scrollIntoView({ block: 'start' }); };
    });
    raiz.querySelectorAll('[data-ir]').forEach(function (a) {
      a.onclick = function (ev) { ev.preventDefault(); ui.sala = a.dataset.ir; pintarMesa(); d.getElementById('mesa').scrollIntoView({ block: 'start' }); };
    });
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
  function cargar() {
    return sesionVigente().then(function (s) {
      if (!s) return pintarIngreso();
      var estadoMp = w.fetch('/api/pagos/estado').then(function (r) { return r.json(); }).then(function (j) { return !!j.mercadoPago; }).catch(function () { return null; });
      return Promise.all([pedir('/rest/v1/rpc/fitness_oficina', {}, s.access_token), estadoMp]).then(function (r) {
        mpListo = r[1];
        pintar(r[0], r[0].ahora || new Date().toISOString());
      }).catch(function (e) {
        if (e.status === 401) { guardar(null); return pintarIngreso('Tu sesión venció. Entrá de nuevo.'); }
        if (/No autorizado/.test(e.message)) { guardar(null); return pintarIngreso('Esta cuenta no tiene acceso a la oficina.'); }
        pintarFalla('No se pudieron leer los datos. Revisá la conexión.');
      });
    });
  }

  w.NFOficina = { leer: leer, pendientes: pendientes, estadoSala: estadoSala, frase: frase, diaBA: diaBA, mesas: mesas, SALAS: SALAS };
  function iniciar() {
    raiz = d.getElementById('oficina');
    if (!raiz) return;
    if (w.NF_OFICINA_PREVIEW) { mpListo = w.NF_OFICINA_PREVIEW.mpListo; pintar(w.NF_OFICINA_PREVIEW.datos, w.NF_OFICINA_PREVIEW.datos.ahora); return; }
    cargar();
    w.setInterval(function () { if (!d.hidden && d.getElementById('actualizar')) cargar(); }, 5 * 60 * 1000);
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})(window, document);

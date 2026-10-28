/* Seguimiento de una solicitud de ofertas: el comprador ve la etapa con su número y su email. */
(function (w, d) {
  'use strict';
  var DB = { url: 'https://ecdaxdqvdwplhovcmnxr.supabase.co', key: 'sb_publishable_QnPox0ljM1hZ_l4VFiqeYg_K_9KR65-' };
  var E = w.NEXOFIT_EMPRESA || {};
  var $ = function (id) { return d.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var fecha = function (iso) { try { return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };
  var PASOS = [
    ['nueva', 'Recibida', 'Ya se la enviamos a los proveedores de nuestra red.'],
    ['enviada', 'Consultando proveedores', 'Los proveedores que pueden cumplirlo están preparando su oferta.'],
    ['con_ofertas', 'Ofertas listas', 'Compará las ofertas abajo y elegí la que más te convenga.'],
    ['elegida', 'Oferta elegida', 'Pagá con Mercado Pago para confirmar la compra.'],
    ['pagada', 'Pagada', 'El proveedor te contacta para coordinar la entrega y te envía la factura.'],
    ['cerrada', 'Compra cerrada', '¡Gracias por comprar en Nexo Fit!']
  ];
  var money = function (n) { return '$ ' + Number(n).toLocaleString('es-AR', { maximumFractionDigits: 2 }); };
  // Las ofertas valen 24 horas: se muestra día y hora (Argentina).
  var dia = function (iso) { try { return new Date(iso).toLocaleString('es-AR', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }) + ' h'; } catch (e) { return iso; } };
  var foto = function (path) { return '/fotos/' + String(path).split('/').map(encodeURIComponent).join('/'); };
  function venceHTML(o) {
    if (o.elegida) return '';
    if (o.vencida) return '<p class="of-vence">Venció el ' + esc(dia(o.validaHasta)) + '. Si te interesa, escribinos y le pedimos al proveedor que la renueve.</p>';
    var h = (new Date(o.validaHasta) - Date.now()) / 36e5;
    return '<p class="of-vence' + (h < 6 ? ' pronto' : '') + '">' + (h < 6 ? 'Vence pronto: ' : 'Vale ') + 'hasta el ' + esc(dia(o.validaHasta)) + ' (las ofertas valen 24 horas).</p>';
  }
  function thumbsHTML(o) {
    var f = o.fotos || [];
    if (!f.length) return '';
    return '<div class="of-thumbs" role="list" aria-label="Fotos de la Oferta ' + esc(o.letra) + '">' + f.map(function (p, i) {
      return '<a role="listitem" href="' + esc(foto(p)) + '" target="_blank" rel="noopener" data-foto="' + i + '" data-of="' + o.id + '"><img src="' + esc(foto(p)) + '" alt="Foto ' + (i + 1) + ' de la Oferta ' + esc(o.letra) + '" loading="lazy"></a>';
    }).join('') + '</div>';
  }
  // Visor de fotos a pantalla completa (con flechas y Escape).
  function verFotos(lista, i, letra) {
    var box = d.createElement('div'), prev = d.activeElement;
    box.className = 'foto-visor'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'Fotos de la Oferta ' + letra);
    function pinta() {
      box.innerHTML = '<div class="fv-bar"><b>Oferta ' + esc(letra) + ' · foto ' + (i + 1) + ' de ' + lista.length + '</b><button type="button" data-fv="x">Cerrar</button></div>'
        + '<img src="' + esc(foto(lista[i])) + '" alt="Foto ' + (i + 1) + ' de la Oferta ' + esc(letra) + '">'
        + (lista.length > 1 ? '<div class="fv-nav"><button type="button" data-fv="-1">Anterior</button><button type="button" data-fv="1">Siguiente</button></div>' : '<div></div>');
    }
    function cerrar() { d.removeEventListener('keydown', tecla); box.remove(); if (prev && prev.focus) prev.focus(); }
    function mover(k) { i = (i + k + lista.length) % lista.length; pinta(); var b = box.querySelector('[data-fv="' + k + '"]'); if (b) b.focus(); }
    function tecla(e) { if (e.key === 'Escape') cerrar(); else if (e.key === 'ArrowRight') mover(1); else if (e.key === 'ArrowLeft') mover(-1); }
    box.addEventListener('click', function (e) { var b = e.target.closest('[data-fv]'); if (b) { var v = b.getAttribute('data-fv'); v === 'x' ? cerrar() : mover(Number(v)); } else if (e.target === box) cerrar(); });
    d.addEventListener('keydown', tecla);
    pinta(); d.body.appendChild(box); box.querySelector('[data-fv="x"]').focus();
  }
  var actual = { code: '', email: '' }, confirmar = null, ultimo = null;
  var form = $('buscar');
  if (!form) return;

  var q = new URLSearchParams(w.location.search);
  if (q.get('codigo')) $('codigo').value = q.get('codigo').toUpperCase().slice(0, 12);
  try {
    var ult = JSON.parse(w.sessionStorage.getItem('nf-sol-ultima') || 'null');
    if (ult && (!$('codigo').value || ult.code === $('codigo').value)) { $('codigo').value = ult.code; $('email').value = ult.email; }
  } catch (e) { /* sin almacenamiento */ }

  var pagoQS = q.get('pago');
  function render(s) {
    var pago = s.pago || {};
    var etapa = s.status === 'elegida' && pago.estado === 'aprobado' ? 'pagada' : s.status;
    var idx = PASOS.map(function (p) { return p[0]; }).indexOf(etapa);
    var html = '<div class="card seg-card"><div class="seg-head"><div><p class="eyebrow">Solicitud</p><p class="code">' + esc(s.code) + '</p></div>'
      + '<p class="muted small">Creada el ' + esc(fecha(s.createdAt)) + '<br>' + esc(s.productos) + (s.productos === 1 ? ' producto' : ' productos') + ' · entrega en ' + esc(s.localidad) + '</p></div>';
    if (s.status === 'descartada') {
      html += '<p class="alert">Esta solicitud quedó sin efecto. Si fue un error o querés retomarla, escribinos.</p>';
    } else if (s.status === 'vencida') {
      html += '<p class="alert">Esta solicitud venció porque pasaron 30 días sin movimiento. Si todavía necesitás el equipamiento, hacé una nueva y la retomamos.</p><div class="actions"><a class="btn btn-accent" href="solicitud.html">Hacer una nueva solicitud</a></div>';
    } else {
      html += '<ol class="timeline">' + PASOS.map(function (p, i) {
        var cls = i < idx ? 'done' : i === idx ? 'now' : '';
        var extra = '';
        if (p[0] === 'enviada' && s.proveedores > 0 && i <= idx) extra = ' <b>' + s.proveedores + (s.proveedores === 1 ? ' proveedor consultado.' : ' proveedores consultados.') + '</b>';
        var nOf = (s.ofertas || []).length;
        if (p[0] === 'con_ofertas' && nOf > 0 && i <= idx) extra = ' <b>' + nOf + (nOf === 1 ? ' oferta recibida.' : ' ofertas recibidas.') + '</b>';
        return '<li class="' + cls + '"' + (i === idx ? ' aria-current="step"' : '') + '><span class="dot" aria-hidden="true"></span><div><b>' + esc(p[1]) + '</b>'
          + (i === idx ? ' <span class="pill">Ahora</span>' : '') + '<p class="muted small">' + esc(p[2]) + extra + '</p></div></li>';
      }).join('') + '</ol>';
    }
    if (s.nota) html += '<p class="note"><b>Mensaje de Nexo Fit:</b> ' + esc(s.nota) + '</p>';
    if (pagoQS && pago.estado !== 'aprobado') {
      html += pagoQS === 'ok' || pagoQS === 'pendiente'
        ? '<p class="alert">Mercado Pago está procesando tu pago. Apenas se acredite, esta página y tu email lo confirman.</p>'
        : '<p class="alert">El pago no se completó. Podés intentarlo de nuevo con otro medio de pago.</p>';
    }
    html += ofertasHTML(s);
    if (Array.isArray(s.items) && s.items.length) {
      html += '<details class="seg-items"><summary>Ver lo que pediste</summary><ul>' + s.items.map(function (it) {
        return '<li>' + esc(it.cantidad) + ' × ' + esc(it.producto) + (it.detalle ? ' <span class="muted">(' + esc(it.detalle) + ')</span>' : '') + '</li>';
      }).join('') + '</ul></details>';
    }
    html += '<p class="muted small">Última actualización: ' + esc(fecha(s.updatedAt)) + '</p>';
    if (E.whatsapp) html += '<div class="actions"><a class="btn btn-dark" target="_blank" rel="noopener" href="https://wa.me/' + esc(E.whatsapp) + '?text=' + encodeURIComponent('Hola, quiero consultar por mi solicitud ' + s.code + ' en Nexo Fit.') + '">Consultar por WhatsApp</a></div>';
    html += '</div>';
    var box = $('resultado'), primera = box.hidden;
    box.innerHTML = html; box.hidden = false; if (primera) box.focus();
  }

  // Comparación de ofertas: sin nombres hasta elegir, con la recomendación explicada.
  function ofertasHTML(s) {
    var ofs = s.ofertas || [];
    if (!ofs.length) return '';
    var R = w.nfRecomendar ? w.nfRecomendar(ofs, s.prioridad, s.plazo) : { mejor: null, motivo: '', marcas: {} };
    var elegida = ofs.filter(function (o) { return o.elegida; })[0];
    var puedeElegir = s.status === 'con_ofertas';
    var orden = ofs.slice().sort(function (a, b) {
      if (R.mejor) { if (a.id === R.mejor.id) return -1; if (b.id === R.mejor.id) return 1; }
      return (a.vencida - b.vencida) || (a.total - b.total);
    });
    var h = '<section class="cmp-of" aria-labelledby="cmp-t"><h2 id="cmp-t">' + (elegida ? 'Tu elección' : 'Compará las ofertas') + '</h2>';
    if (elegida) {
      var pg = s.pago || {}, quien = elegida.proveedor ? esc(elegida.proveedor) : 'el proveedor';
      h += '<div class="alert ok"><b>Elegiste la Oferta ' + esc(elegida.letra) + (elegida.proveedor ? ' de ' + esc(elegida.proveedor) : '') + '</b> por ' + money(elegida.total) + '.</div>';
      if (pg.estado === 'aprobado') {
        h += '<div class="alert ok"><b>Pago acreditado</b>' + (pg.monto ? ' por ' + money(pg.monto) : '') + '. ' + quien + ' te va a contactar para coordinar la entrega y te envía la factura.</div>';
      } else if (pg.estado === 'devuelto') {
        h += '<div class="alert">Mercado Pago informa este pago como devuelto. Si fue un error, escribinos.</div>';
      } else if (pg.disponible) {
        h += '<div class="pay-box"><p>Pagás <b>' + money(elegida.total) + '</b> con Mercado Pago (tarjeta, débito, dinero en cuenta o efectivo). El pago va directo a ' + quien + ' y la compra queda confirmada cuando se acredita.</p>'
          + '<div class="actions"><button class="btn btn-accent btn-big" type="button" data-pagar="1">Pagar con Mercado Pago</button></div>'
          + (elegida.cuotas ? '<p class="muted small">Las ' + esc(elegida.cuotas) + ' cuotas sin interés de la oferta se eligen dentro de Mercado Pago, si el proveedor las tiene habilitadas.</p>' : '') + '</div>';
      } else {
        h += '<p class="muted small">' + quien + ' está activando su cobro con Mercado Pago. Te avisamos por email apenas puedas pagar desde esta página. Todavía no se te cobró nada.</p>';
      }
    } else if (R.mejor && ofs.length > 1) {
      h += '<div class="reco"><p class="eyebrow">Recomendación de Nexo Fit</p><p><b>Oferta ' + esc(R.mejor.letra) + '.</b> ' + esc(R.motivo) + '</p>'
        + '<p class="muted small">La calculamos con las prioridades que marcaste. Es una ayuda: la decisión es tuya.</p></div>';
    } else if (R.mejor) {
      h += '<p class="muted small">' + esc(R.motivo) + ' Te avisamos si llegan más ofertas.</p>';
    }
    h += '<div class="actions"><button class="btn btn-outline" type="button" data-cuadro="1">Descargar cuadro comparativo (PDF)</button></div>'
      + '<p class="muted small">Sirve para adjuntar al expediente de compra: muestra todas las ofertas en el mismo formato y por qué se recomienda una.</p>';
    h += '<p class="muted small">Los nombres de los proveedores se muestran cuando elegís. Así cada uno ofrece su mejor condición sin copiar a los demás.</p><div class="of-list">';
    h += orden.map(function (o) {
      var marcas = (R.marcas[o.id] || []), esMejor = R.mejor && o.id === R.mejor.id && !elegida;
      var cls = 'of-card' + (esMejor ? ' best' : '') + (o.elegida ? ' chosen' : '') + (o.vencida ? ' old' : '');
      var row = function (k, v) { return '<div><dt>' + k + '</dt><dd>' + v + '</dd></div>'; };
      var btn = '';
      if (puedeElegir && !o.vencida) {
        btn = confirmar === o.id
          ? '<div class="confirm"><p>¿Elegís la <b>Oferta ' + esc(o.letra) + '</b> por <b>' + money(o.total) + '</b>? Después de elegir pagás con Mercado Pago desde esta página. Elegir no te cobra nada todavía.</p><div class="actions"><button class="btn btn-accent" type="button" data-elegir="' + o.id + '" data-ok="1">Sí, elegir esta oferta</button><button class="btn btn-outline" type="button" data-cancelar="1">Volver</button></div></div>'
          : '<button class="btn ' + (esMejor ? 'btn-accent' : 'btn-outline') + '" type="button" data-elegir="' + o.id + '">Elegir esta oferta</button>';
      }
      return '<article class="' + cls + '"><div class="of-h"><b>Oferta ' + esc(o.letra) + '</b>' + (esMejor ? '<span class="pill">Recomendada</span>' : '') + (o.elegida ? '<span class="pill">Elegida</span>' : '') + '</div>'
        + '<p class="of-tot">' + money(o.total) + '<span class="muted small"> costo total</span></p>'
        + (marcas.length ? '<p class="tags">' + marcas.map(function (m) { return '<span class="tag' + (/después|parte|Vencida/.test(m) ? ' warn' : '') + '">' + esc(m) + '</span>'; }).join('') + '</p>' : '')
        + '<dl class="of-dl">' + row('Productos', money(o.precio)) + row('Envío', Number(o.envio) ? money(o.envio) : 'Incluido') + row('Entrega', o.plazo + (o.plazo === 1 ? ' día hábil' : ' días hábiles'))
        + row('Cuotas', o.cuotas ? o.cuotas + ' sin interés' : 'No') + row('Garantía', o.garantia ? o.garantia + (o.garantia === 1 ? ' mes' : ' meses') : 'Sin garantía') + '</dl>'
        + thumbsHTML(o) + venceHTML(o)
        + (o.notas ? '<p class="small"><b>Notas del proveedor:</b> ' + esc(o.notas) + '</p>' : '') + btn + '</article>';
    }).join('');
    return h + '</div></section>';
  }

  // Cuadro comparativo para imprimir o guardar en PDF (expedientes de compra de colegios, clubes y municipios).
  var PRIO = { equilibrio: 'Mejor equilibrio', precio: 'Menor costo total', rapidez: 'Entrega más rápida', financiacion: 'Financiación', calidad: 'Calidad y garantía' };
  var PLAZO = { urgente: 'Lo antes posible', '7': 'Hasta 7 días', '15': 'Hasta 15 días', '30': 'Hasta 30 días', flexible: 'Sin apuro' };
  function cuadroHTML(s) {
    var ofs = (s.ofertas || []).slice().sort(function (a, b) { return a.letra < b.letra ? -1 : 1; });
    var R = w.nfRecomendar ? w.nfRecomendar(s.ofertas || [], s.prioridad, s.plazo) : { mejor: null, motivo: '' };
    var elegida = ofs.filter(function (o) { return o.elegida; })[0];
    var hoy = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
    var td = function (v) { return '<td>' + v + '</td>'; };
    return '<header class="cq-h"><div><p class="cq-brand">NEXO FIT</p><h1>Cuadro comparativo de ofertas</h1></div><div class="cq-meta"><b>' + esc(s.code) + '</b><br>Emitido el ' + esc(hoy) + '</div></header>'
      + '<p><b>Entrega en:</b> ' + esc(s.localidad) + (s.plazo ? ' · <b>Plazo pedido:</b> ' + esc(PLAZO[s.plazo] || s.plazo) : '') + ' · <b>Prioridad del comprador:</b> ' + esc(PRIO[s.prioridad] || s.prioridad || '-') + '</p>'
      + '<h2>Lo que se pidió</h2><table class="cq-t"><thead><tr><th>Cantidad</th><th>Producto</th><th>Detalle</th></tr></thead><tbody>'
      + (s.items || []).map(function (it) { return '<tr>' + td(esc(it.cantidad)) + td(esc(it.producto)) + td(esc(it.detalle || '')) + '</tr>'; }).join('') + '</tbody></table>'
      + '<h2>Ofertas recibidas (' + ofs.length + ')</h2><table class="cq-t"><thead><tr><th>Oferta</th><th>Productos</th><th>Envío</th><th>Costo total</th><th>Entrega</th><th>Cuotas</th><th>Garantía</th><th>Cumple</th><th>Vale hasta</th></tr></thead><tbody>'
      + ofs.map(function (o) {
        var tag = (R.mejor && o.id === R.mejor.id ? ' · Recomendada' : '') + (o.elegida ? ' · Elegida' : '') + (o.vencida ? ' · Vencida' : '');
        return '<tr' + (R.mejor && o.id === R.mejor.id ? ' class="cq-best"' : '') + '>' + td('<b>' + esc(o.letra) + '</b>' + (o.elegida && o.proveedor ? '<br>' + esc(o.proveedor) : '') + '<span class="cq-tag">' + esc(tag.replace(/^ · /, '')) + '</span>')
          + td(money(o.precio)) + td(Number(o.envio) ? money(o.envio) : 'Incluido') + td('<b>' + money(o.total) + '</b>') + td(o.plazo + ' días hábiles')
          + td(o.cuotas ? o.cuotas + ' sin interés' : 'No') + td(o.garantia ? o.garantia + ' meses' : 'No') + td(o.cumple === 'parcial' ? 'Parcial' : 'Total') + td(esc(dia(o.validaHasta))) + '</tr>'
          + (o.notas ? '<tr class="cq-n"><td></td><td colspan="8">Notas de la oferta ' + esc(o.letra) + ': ' + esc(o.notas) + '</td></tr>' : '');
      }).join('') + '</tbody></table>'
      + (elegida ? '<p class="cq-box"><b>Oferta elegida: ' + esc(elegida.letra) + (elegida.proveedor ? ' (' + esc(elegida.proveedor) + ')' : '') + '</b> por ' + money(elegida.total) + '.</p>' : '')
      + (R.mejor && ofs.length > 1 ? '<p class="cq-box"><b>Recomendación de Nexo Fit: Oferta ' + esc(R.mejor.letra) + '.</b> ' + esc(R.motivo) + '</p>' : '')
      + '<p class="cq-foot">Las ofertas se presentaron en forma privada e independiente a través de Nexo Fit: ningún proveedor conoció las condiciones de los demás. Los importes son finales, con IVA y envío a la localidad indicada, según lo declarado por cada proveedor. '
      + 'Los nombres de los proveedores se informan al elegir una oferta. Podés verificar este cuadro en nexofitt.com.ar/mi-solicitud.html con el número ' + esc(s.code) + '.</p>';
  }
  function imprimirCuadro() {
    var box = d.getElementById('cuadro-print');
    if (!box) { box = d.createElement('div'); box.id = 'cuadro-print'; box.className = 'cuadro-print'; d.body.appendChild(box); }
    box.innerHTML = cuadroHTML(ultimo);
    var titulo = d.title; d.title = 'Cuadro comparativo ' + ultimo.code + ' - Nexo Fit';
    d.body.classList.add('imprimiendo');
    var fin = function () { d.body.classList.remove('imprimiendo'); d.title = titulo; w.removeEventListener('afterprint', fin); };
    w.addEventListener('afterprint', fin);
    if (w.nfTrack) w.nfTrack('cuadro', { name: ultimo.code });
    w.print();
    setTimeout(fin, 1500);
  }

  $('resultado').addEventListener('click', function (ev) {
    if (ev.target.closest('[data-cuadro]')) { if (ultimo) imprimirCuadro(); return; }
    var fa = ev.target.closest('[data-foto]');
    if (fa && ultimo) {
      var of = (ultimo.ofertas || []).filter(function (o) { return String(o.id) === fa.getAttribute('data-of'); })[0];
      if (of) { ev.preventDefault(); verFotos(of.fotos, Number(fa.getAttribute('data-foto')), of.letra); }
      return;
    }
    var pb = ev.target.closest('[data-pagar]');
    if (pb) {
      if (pb.disabled) return;
      pb.disabled = true; pb.textContent = 'Abriendo Mercado Pago…';
      fetch('/api/pagos/oferta', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: actual.code, email: actual.email, returnUrl: w.location.origin + w.location.pathname }) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.url) throw new Error(j.error || 'No pudimos abrir Mercado Pago. Probá de nuevo en unos minutos.'); return j; }); })
        .then(function (j) { if (w.nfTrack) w.nfTrack('InitiateCheckout', { name: 'pago oferta ' + actual.code }); w.location.href = j.url; })
        .catch(function (e) { var err = $('seg-error'); err.textContent = e && e.message && !/fetch|network/i.test(e.message) ? e.message : 'No pudimos conectarnos. Revisá tu conexión e intentá de nuevo.'; err.hidden = false; pb.disabled = false; pb.textContent = 'Pagar con Mercado Pago'; });
      return;
    }
    var c = ev.target.closest('[data-cancelar]');
    if (c) { confirmar = null; render(ultimo); return; }
    var b = ev.target.closest('[data-elegir]');
    if (!b || b.disabled) return;
    var id = Number(b.getAttribute('data-elegir'));
    if (!b.getAttribute('data-ok')) { confirmar = id; render(ultimo); var k = $('resultado').querySelector('[data-ok]'); if (k) k.focus(); return; }
    b.disabled = true; b.textContent = 'Guardando…';
    fetch(DB.url + '/rest/v1/rpc/fitness_oferta_elegir', { method: 'POST', headers: { apikey: DB.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_code: actual.code, p_email: actual.email, p_oferta: id }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.message || 'No pudimos registrar tu elección.'); return j; }); })
      .then(function () { confirmar = null; if (w.nfTrack) w.nfTrack('Purchase', { name: 'oferta elegida ' + actual.code }); buscar(); })
      .catch(function (e) { var err = $('seg-error'); err.textContent = e.message; err.hidden = false; b.disabled = false; b.textContent = 'Sí, elegir esta oferta'; });
  });

  var busy = false;
  form.addEventListener('submit', function (ev) { ev.preventDefault(); buscar(); });
  function buscar() {
    if (busy) return;
    var err = $('seg-error'); err.hidden = true;
    var code = $('codigo').value.trim().toUpperCase(), email = $('email').value.trim();
    if (!/^SOL-[A-Z0-9]{4,8}$/.test(code)) { err.textContent = 'Revisá el número: tiene la forma SOL- seguido de letras y números.'; err.hidden = false; $('codigo').focus(); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err.textContent = 'Escribí el email con el que hiciste la solicitud.'; err.hidden = false; $('email').focus(); return; }
    busy = true; $('ver').disabled = true; $('ver').textContent = 'Buscando…';
    fetch(DB.url + '/rest/v1/rpc/fitness_solicitud_consulta', { method: 'POST', headers: { apikey: DB.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_code: code, p_email: email }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok || !res.j || !res.j.code) throw new Error((res.j && res.j.message) || 'No pudimos consultar la solicitud.');
        try { w.sessionStorage.setItem('nf-sol-ultima', JSON.stringify({ code: code, email: email })); } catch (e) { /* sin almacenamiento */ }
        actual = { code: code, email: email }; ultimo = res.j;
        render(res.j);
      })
      .catch(function (e) {
        err.textContent = e && e.message && !/fetch|network/i.test(e.message) ? e.message : 'No pudimos conectarnos. Revisá tu conexión e intentá de nuevo.';
        err.hidden = false; $('resultado').hidden = true;
      })
      .then(function () { busy = false; $('ver').disabled = false; $('ver').textContent = 'Ver estado'; });
  }
  if ($('codigo').value && $('email').value) buscar();
})(window, document);

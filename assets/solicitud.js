/* "Conseguí la mejor oferta": formulario de solicitud. Guarda en Supabase (fitness_crear_solicitud)
   y, si no se puede, ofrece enviar el resumen por WhatsApp para no perder el pedido. */
(function (w, d) {
  'use strict';
  var DB = { url: 'https://ecdaxdqvdwplhovcmnxr.supabase.co', key: 'sb_publishable_QnPox0ljM1hZ_l4VFiqeYg_K_9KR65-' };
  var E = w.NEXOFIT_EMPRESA || {};
  var MAX = 25;
  var PROVINCIAS = ['Buenos Aires', 'Ciudad de Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'];
  var TIPOS = { gimnasios: 'gimnasio', gimnasio: 'gimnasio', clubes: 'club', club: 'club', colegios: 'colegio', colegio: 'colegio', entrenador: 'entrenador' };
  var PRIO = { equilibrio: 'Mejor equilibrio', precio: 'Menor costo total', rapidez: 'Entrega más rápida', financiacion: 'Financiación', calidad: 'Calidad y garantía' };
  var PLAZO = { urgente: 'Lo antes posible', '7': 'Hasta 7 días', '15': 'Hasta 15 días', '30': 'Hasta 30 días', flexible: 'Sin apuro' };

  var form = d.getElementById('sol'), items = d.getElementById('items'), err = d.getElementById('sol-error');
  if (!form) return;
  var $ = function (id) { return d.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  $('provincia').innerHTML = PROVINCIAS.map(function (p) { return '<option>' + esc(p) + '</option>'; }).join('');

  // Datos que llegan por enlace: ?tipo=gimnasios&producto=colchonetas&cantidad=100
  var q = new URLSearchParams(w.location.search);
  if (TIPOS[q.get('tipo')]) $('tipo').value = TIPOS[q.get('tipo')];

  var n = 0;
  function addItem(prod, cant) {
    if (items.children.length >= MAX) return;
    n += 1;
    var div = d.createElement('div');
    div.className = 'item';
    div.innerHTML = '<p class="item-h">Producto</p>'
      + '<div><label for="p' + n + '">¿Qué producto?</label><input id="p' + n + '" data-k="producto" required maxlength="120" placeholder="Ej.: colchonetas" value="' + esc(prod || '') + '"></div>'
      + '<div><label for="c' + n + '">Cantidad</label><input id="c' + n + '" data-k="cantidad" required inputmode="numeric" maxlength="6" placeholder="100" value="' + esc(cant || '') + '"></div>'
      + '<div class="full"><label for="d' + n + '">Medida, peso o modelo <span class="muted">(opcional)</span></label><input id="d' + n + '" data-k="detalle" maxlength="300" placeholder="Ej.: 1 × 0,50 m, uso profesional"></div>';
    items.appendChild(div);
    renumber();
    return div;
  }
  function renumber() {
    var list = [].slice.call(items.children), many = list.length > 1;
    list.forEach(function (it, i) {
      it.querySelector('.item-h').textContent = many ? 'Producto ' + (i + 1) : 'Producto';
      var x = it.querySelector('.item-x');
      if (many && !x) { x = d.createElement('button'); x.type = 'button'; x.className = 'item-x'; x.textContent = '×'; it.appendChild(x); }
      if (!many && x) x.remove();
      if (x) x.setAttribute('aria-label', 'Quitar producto ' + (i + 1));
    });
    $('add-item').hidden = list.length >= MAX;
  }
  // Lista que llega armada desde "Armá tu espacio" o desde el carrito.
  var pre = null;
  if (q.get('desde')) {
    try { pre = JSON.parse(w.sessionStorage.getItem('nf-sol-prefill') || 'null'); } catch (e) { pre = null; }
  }
  if (pre && Array.isArray(pre.items) && pre.items.length) {
    pre.items.slice(0, MAX).forEach(function (it) {
      var row = addItem(String(it.producto || '').slice(0, 120), String(it.cantidad || '').replace(/\D/g, '').slice(0, 6));
      var det = row && row.querySelector('[data-k=detalle]');
      if (det && it.detalle) det.value = String(it.detalle).slice(0, 300);
    });
    if (pre.detalles) $('detalles').value = String(pre.detalles).slice(0, 1500);
    if (pre.tipo && $('tipo').querySelector('option[value="' + pre.tipo + '"]')) $('tipo').value = pre.tipo;
    var aviso = d.getElementById('prefill-aviso');
    if (aviso) { aviso.hidden = false; aviso.textContent = 'Cargamos tu lista de ' + pre.items.length + (pre.items.length === 1 ? ' producto' : ' productos') + '. Revisala y completá los datos de entrega.'; }
  } else {
    addItem(q.get('producto'), (q.get('cantidad') || '').replace(/\D/g, ''));
  }
  $('add-item').addEventListener('click', function () { var it = addItem(); if (it) it.querySelector('input').focus(); });
  items.addEventListener('click', function (ev) {
    var x = ev.target.closest('.item-x');
    if (!x) return;
    x.closest('.item').remove(); renumber();
    var first = items.querySelector('input'); if (first) first.focus();
  });

  function collect() {
    var its = [].slice.call(items.children).map(function (it) {
      var o = {};
      [].slice.call(it.querySelectorAll('[data-k]')).forEach(function (i) { o[i.getAttribute('data-k')] = i.value.trim(); });
      return o;
    }).filter(function (o) { return o.producto || o.cantidad || o.detalle; });
    return {
      items: its,
      detalles: $('detalles').value.trim(),
      localidad: $('localidad').value.trim(),
      provincia: $('provincia').value,
      plazo: $('plazo').value,
      factura: $('factura').value,
      pagos: [].slice.call(form.querySelectorAll('[name=pagos]:checked')).map(function (i) { return i.value; }),
      presupuesto: $('presupuesto').value.replace(/\D/g, ''),
      prioridad: (form.querySelector('[name=prioridad]:checked') || {}).value || 'equilibrio',
      tipo: $('tipo').value,
      nombre: $('nombre').value.trim(),
      empresa: $('empresa').value.trim(),
      email: $('email').value.trim(),
      telefono: $('telefono').value.trim(),
      origen: w.nfUtm ? w.nfUtm() : null
    };
  }

  // Devuelve [mensaje, campo] del primer problema, o null.
  function check(s) {
    if (!s.items.length) return ['Cargá al menos un producto.', items.querySelector('input')];
    for (var i = 0; i < s.items.length; i++) {
      var row = items.children[i];
      if ((s.items[i].producto || '').length < 2) return ['Escribí qué producto necesitás.', row && row.querySelector('[data-k=producto]')];
      if (!/^\d{1,6}$/.test(s.items[i].cantidad) || +s.items[i].cantidad < 1) return ['Escribí una cantidad válida (solo números).', row && row.querySelector('[data-k=cantidad]')];
    }
    if (s.localidad.length < 2) return ['Indicá la localidad de entrega.', $('localidad')];
    if (s.nombre.length < 2) return ['Escribí tu nombre.', $('nombre')];
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.email)) return ['Escribí un email válido.', $('email')];
    var tel = s.telefono.replace(/\D/g, '');
    if (tel.length < 8 || tel.length > 15) return ['Escribí un WhatsApp válido, con código de área.', $('telefono')];
    if (!$('acepto').checked) return ['Para pedir ofertas tenés que aceptar que compartamos la solicitud con proveedores.', $('acepto')];
    return null;
  }

  function resumen(s, code) {
    var l = ['Hola, quiero pedir ofertas en Nexo Fit' + (code ? ' (solicitud ' + code + ')' : '') + ':'];
    s.items.forEach(function (it) { l.push('• ' + it.cantidad + ' × ' + it.producto + (it.detalle ? ' (' + it.detalle + ')' : '')); });
    l.push('Entrega: ' + s.localidad + ', ' + s.provincia + ' · ' + PLAZO[s.plazo]);
    l.push('Factura: ' + (s.factura === 'no' ? 'remito / comprobante' : s.factura) + ' · Prioridad: ' + PRIO[s.prioridad]);
    if (s.detalles) l.push('Detalles: ' + s.detalles);
    l.push(s.nombre + (s.empresa ? ' · ' + s.empresa : ''));
    return l.join('\n');
  }
  function waLink(text) { return E.whatsapp ? 'https://wa.me/' + E.whatsapp + '?text=' + encodeURIComponent(text) : ''; }

  function showError(msg, field, s) {
    err.innerHTML = esc(msg);
    if (s && E.whatsapp) err.innerHTML += ' <a href="' + esc(waLink(resumen(s))) + '" target="_blank" rel="noopener">Enviarla por WhatsApp</a>';
    err.hidden = false;
    if (field) { field.focus(); if (field.setAttribute) field.setAttribute('aria-invalid', 'true'); }
  }
  form.addEventListener('input', function (ev) { ev.target.removeAttribute && ev.target.removeAttribute('aria-invalid'); });

  var sending = false;
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (sending) return;
    err.hidden = true;
    if ($('web').value) return; // relleno automático de robots
    var s = collect(), bad = check(s);
    if (bad) { showError(bad[0], bad[1]); return; }
    sending = true;
    var btn = $('enviar'); btn.disabled = true; btn.textContent = 'Enviando…';
    var body = JSON.stringify({ details: s });
    fetch(DB.url + '/rest/v1/rpc/fitness_crear_solicitud', { method: 'POST', headers: { apikey: DB.key, 'Content-Type': 'application/json' }, body: body })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok || !res.j || !res.j.code) throw new Error((res.j && res.j.message) || 'No pudimos guardar la solicitud.');
        if (w.nfTrack) w.nfTrack('Lead', { name: 'solicitud de ofertas' });
        $('ok-code').textContent = res.j.code;
        var seg = $('ok-track'); if (seg) seg.href = 'mi-solicitud.html?codigo=' + encodeURIComponent(res.j.code);
        try {
          w.sessionStorage.removeItem('nf-sol-prefill');
          w.sessionStorage.setItem('nf-sol-ultima', JSON.stringify({ code: res.j.code, email: s.email }));
        } catch (e) { /* sin almacenamiento */ }
        var wa = $('ok-wa'), link = waLink(resumen(s, res.j.code));
        if (link) wa.href = link; else wa.hidden = true;
        form.hidden = true;
        var ok = $('ok'); ok.hidden = false; ok.focus();
        w.scrollTo(0, ok.getBoundingClientRect().top + w.pageYOffset - 20);
      })
      .catch(function (e) {
        var msg = e && e.message && !/fetch|network/i.test(e.message) ? e.message : 'No pudimos enviar la solicitud. Revisá tu conexión e intentá de nuevo.';
        showError(/[.!?]$/.test(msg) ? msg : msg + '.', null, s);
      })
      .then(function () { sending = false; btn.disabled = false; btn.textContent = 'Pedir ofertas'; });
  });
})(window, document);

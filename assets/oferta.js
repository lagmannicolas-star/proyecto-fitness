/* Pedido de oferta para proveedores: el link privado (oferta.html#t=<token>) muestra el pedido sin datos del comprador
   y permite cargar o corregir una oferta mientras la solicitud siga abierta. */
(function (w, d) {
  'use strict';
  var DB = { url: 'https://ecdaxdqvdwplhovcmnxr.supabase.co', key: 'sb_publishable_QnPox0ljM1hZ_l4VFiqeYg_K_9KR65-' };
  var $ = function (id) { return d.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var money = function (n) { return '$ ' + Number(n).toLocaleString('es-AR', { maximumFractionDigits: 2 }); };
  var PLAZO = { urgente: 'Lo antes posible', '7': 'Hasta 7 días', '15': 'Hasta 15 días', '30': 'Hasta 30 días', flexible: 'Sin apuro' };
  var PRIO = { equilibrio: 'Mejor equilibrio', precio: 'Menor costo total', rapidez: 'Entrega más rápida', financiacion: 'Financiación', calidad: 'Calidad y garantía' };
  var PAGO = { transferencia: 'Transferencia', mercadopago: 'Mercado Pago', tarjeta: 'Tarjeta en cuotas', efectivo: 'Efectivo', cuenta_corriente: 'Cuenta corriente' };
  var TIPO = { gimnasio: 'Gimnasio', club: 'Club', colegio: 'Colegio', entrenador: 'Entrenador', particular: 'Particular', otro: 'Otro' };

  // Acepta 950000, 950.000, 950.000,50 o 950000.50.
  function parseMoney(s) {
    s = String(s == null ? '' : s).trim().replace(/[$\s]/g, '');
    if (!s) return null;
    if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
    else if (/^\d+,\d{1,2}$/.test(s)) s = s.replace(',', '.');
    else if (!/^\d+(\.\d{1,2})?$/.test(s)) return NaN;
    var n = Number(s); return Number.isFinite(n) ? n : NaN;
  }
  function iso(dt) { return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0'); }
  function rpc(fn, args) {
    return fetch(DB.url + '/rest/v1/rpc/' + fn, { method: 'POST', headers: { apikey: DB.key, 'Content-Type': 'application/json' }, body: JSON.stringify(args) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.message || 'No pudimos completar la acción.'); return j; }); });
  }

  var token = (new URLSearchParams((w.location.hash || '').slice(1)).get('t') || '').toLowerCase();
  var mpQS = new URLSearchParams(w.location.search).get('mp');
  var err = $('of-error'), form = $('of-form');
  function fail(msg) { err.textContent = msg; err.hidden = false; }
  if (!/^[0-9a-f]{64}$/.test(token)) { $('of-titulo').textContent = 'Pedido de oferta'; fail('El link está incompleto. Abrilo tal cual te lo enviamos por email o WhatsApp, o pedinos uno nuevo.'); return; }

  var hoy = new Date(), max = new Date(); max.setDate(max.getDate() + 90);
  var def = new Date(); def.setDate(def.getDate() + 15);
  $('valida').min = iso(hoy); $('valida').max = iso(max); $('valida').value = iso(def);

  function totalPreview() {
    var p = parseMoney($('precio').value), e = $('envio-incl').checked ? 0 : (parseMoney($('envio').value) || 0);
    $('of-total').innerHTML = p > 0 && e >= 0 ? 'Costo total para el comprador: <b>' + money(p + e) + '</b>' + (e ? ' (incluye ' + money(e) + ' de envío)' : ' con envío incluido') : 'Completá el precio para ver el costo total que va a comparar el comprador.';
  }
  ['precio', 'envio'].forEach(function (id) { $(id).addEventListener('input', totalPreview); });
  $('envio-incl').addEventListener('change', function () { $('envio').disabled = this.checked; if (this.checked) $('envio').value = ''; totalPreview(); });

  function render(o) {
    if (o.comision != null && $('of-comision')) $('of-comision').textContent = String(Number(o.comision)).replace('.', ',');
    $('of-titulo').textContent = 'Pedido ' + o.code + ' para ' + o.proveedor;
    d.title = 'Pedido ' + o.code + ' · Nexo Fit';
    $('of-items').innerHTML = (o.items || []).map(function (it) {
      return '<li><b>' + esc(it.cantidad) + ' ×</b> ' + esc(it.producto) + (it.detalle ? '<span class="muted small"> · ' + esc(it.detalle) + '</span>' : '') + '</li>';
    }).join('');
    var dato = function (k, v) { return v ? '<div><dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd></div>' : ''; };
    $('of-datos').innerHTML = dato('Entrega en', o.localidad + ', ' + o.provincia) + dato('Lo necesita', PLAZO[o.plazo] || o.plazo)
      + dato('Factura', o.factura === 'no' ? 'No necesita' : 'Factura ' + o.factura) + dato('Puede pagar con', (o.pagos || []).map(function (p) { return PAGO[p] || p; }).join(', ') || 'A convenir')
      + dato('Le importa más', PRIO[o.prioridad] || o.prioridad) + dato('Tipo de cliente', TIPO[o.tipo] || o.tipo);
    $('of-detalles').textContent = o.detalles || '';
    $('of-dest').textContent = o.localidad;
    var dias = { urgente: 'Pidió lo antes posible.', '7': 'Lo necesita en hasta 7 días.', '15': 'Lo necesita en hasta 15 días.', '30': 'Lo necesita en hasta 30 días.', flexible: 'No tiene apuro.' }[o.plazo] || '';
    $('plazo-hint').textContent = dias;

    var of = o.oferta, est = $('of-estado');
    if (of) {
      $('precio').value = String(of.precio_total).replace('.', ',');
      if (Number(of.envio) === 0) { $('envio-incl').checked = true; $('envio').disabled = true; } else $('envio').value = String(of.envio).replace('.', ',');
      $('plazo').value = of.plazo_dias; $('cuotas').value = String(of.cuotas); $('garantia').value = of.garantia_meses;
      if (of.valida_hasta >= iso(hoy)) $('valida').value = of.valida_hasta;
      var r = form.querySelector('[name=cumple][value="' + of.cumple + '"]'); if (r) r.checked = true;
      $('notas').value = of.notas || '';
      $('of-enviar').textContent = 'Actualizar oferta';
    }
    var mpMsg = { ok: '<div class="alert ok"><b>Mercado Pago quedó conectado.</b> Los pagos de tus ventas en Nexo Fit llegan a esa cuenta.</div>', error: '<div class="alert">No pudimos conectar Mercado Pago. Probá de nuevo o escribinos.</div>', cancelado: '<div class="alert">Cancelaste la conexión con Mercado Pago.</div>' }[mpQS] || '';
    var conectar = '<div class="actions"><button class="btn btn-accent" type="button" data-mp="1">Conectar Mercado Pago</button></div>';
    if (o.elegida) {
      var pagoTxt = o.pago === 'aprobado' ? '<div class="alert ok"><b>El comprador ya pagó.</b> Te mandamos por email sus datos para coordinar la entrega y la factura.</div>'
        : o.pago === 'devuelto' ? '<div class="alert">Mercado Pago informa el pago como devuelto. No entregues hasta que lo revisemos juntos.</div>'
        : o.mp ? '<p>Tu Mercado Pago está conectado: el comprador ya puede pagar. Cuando se acredite te avisamos por email con sus datos para la entrega.</p>'
        : '<p><b>Para cobrar, conectá tu cuenta de Mercado Pago.</b> El comprador paga desde Nexo Fit y el dinero llega a tu cuenta, menos la comisión del ' + esc(String(Number(o.comision)).replace('.', ',')) + '% sobre los productos (el envío no paga comisión). Mercado Pago aplica además su propio cargo.</p>' + conectar;
      est.innerHTML = mpMsg + '<div class="alert ok"><b>¡El comprador eligió tu oferta!</b></div>' + pagoTxt;
      form.hidden = true;
    } else if (!o.abierta) {
      est.innerHTML = '<div class="alert">' + (o.estado === 'vencida' ? 'Esta solicitud venció y ya no recibe ofertas.' : of ? 'El comprador ya decidió y esta solicitud no recibe más ofertas. ¡Gracias por participar!' : 'Esta solicitud ya no recibe ofertas.') + '</div>';
      form.hidden = true;
    } else if (of) {
      est.innerHTML = mpMsg + '<div class="alert ok">Ya enviaste tu oferta. Podés corregirla mientras el comprador no haya decidido.</div>'
        + (o.mp ? '' : '<p class="muted small">Si el comprador te elige, cobrás con Mercado Pago. Podés conectar tu cuenta ahora para que pueda pagarte en el acto.</p>' + conectar);
    } else if (mpMsg) {
      est.innerHTML = mpMsg;
    }
    $('of-body').hidden = false;
    totalPreview();
  }

  $('of-estado').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-mp]');
    if (!b || b.disabled) return;
    b.disabled = true; b.textContent = 'Abriendo Mercado Pago…';
    fetch('/api/pagos/red/conectar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: token, returnUrl: w.location.origin + w.location.pathname }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.url) throw new Error(j.error || 'No pudimos abrir Mercado Pago.'); return j; }); })
      .then(function (j) { w.location.href = j.url; })
      .catch(function (e) { fail(e && e.message && !/fetch|network/i.test(e.message) ? e.message : 'No pudimos conectarnos. Revisá tu conexión e intentá de nuevo.'); b.disabled = false; b.textContent = 'Conectar Mercado Pago'; });
  });

  rpc('fitness_invitacion_ver', { p_token: token }).then(render).catch(function (e) {
    $('of-titulo').textContent = 'Pedido de oferta';
    fail(e && e.message && !/fetch|network/i.test(e.message) ? e.message : 'No pudimos cargar el pedido. Revisá tu conexión e intentá de nuevo.');
  });

  var busy = false;
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (busy) return;
    err.hidden = true;
    var precio = parseMoney($('precio').value), envio = $('envio-incl').checked ? 0 : parseMoney($('envio').value);
    var plazo = parseInt($('plazo').value, 10), gar = parseInt($('garantia').value || '0', 10);
    var cumple = (form.querySelector('[name=cumple]:checked') || {}).value || 'total', notas = $('notas').value.trim();
    var bad = !(precio > 0) ? ['Escribí el precio total del pedido.', 'precio']
      : envio != null && !(envio >= 0) ? ['Revisá el costo de envío (solo números).', 'envio']
      : !(plazo >= 1 && plazo <= 180) ? ['Indicá el plazo de entrega en días hábiles (1 a 180).', 'plazo']
      : !(gar >= 0 && gar <= 120) ? ['Revisá la garantía (0 a 120 meses).', 'garantia']
      : !$('valida').value ? ['Indicá hasta cuándo vale la oferta.', 'valida']
      : cumple === 'parcial' && notas.length < 5 ? ['Contá en las notas qué parte del pedido no cubrís.', 'notas']
      : /\d{10,}/.test(notas.replace(/[\s().-]/g, '')) || /@|https?:\/\/|www\./i.test(notas) ? ['Sacá de las notas los teléfonos, emails o links: el contacto se comparte cuando el comprador elige.', 'notas'] : null;
    if (bad) { fail(bad[0]); $(bad[1]).focus(); return; }
    busy = true; var btn = $('of-enviar'), label = btn.textContent; btn.disabled = true; btn.textContent = 'Enviando…';
    rpc('fitness_oferta_enviar', { p_token: token, p: { precio_total: String(precio), envio: String(envio || 0), plazo_dias: String(plazo), cuotas: $('cuotas').value, garantia_meses: String(gar), valida_hasta: $('valida').value, cumple: cumple, notas: notas } })
      .then(function () { return rpc('fitness_invitacion_ver', { p_token: token }); })
      .then(function (o) { render(o); $('of-estado').innerHTML = '<div class="alert ok"><b>¡Oferta enviada!</b> El comprador ya puede verla y compararla. Podés corregirla desde este mismo link mientras no haya decidido.</div>'; $('of-estado').scrollIntoView({ block: 'center' }); })
      .catch(function (e) { fail(e && e.message && !/fetch|network/i.test(e.message) ? e.message : 'No pudimos enviar la oferta. Revisá tu conexión e intentá de nuevo.'); btn.textContent = label; })
      .then(function () { busy = false; btn.disabled = false; });
  });
})(window, document);

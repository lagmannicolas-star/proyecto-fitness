/* Seguimiento de una solicitud de ofertas: el comprador ve la etapa con su número y su email. */
(function (w, d) {
  'use strict';
  var DB = { url: 'https://ecdaxdqvdwplhovcmnxr.supabase.co', key: 'sb_publishable_QnPox0ljM1hZ_l4VFiqeYg_K_9KR65-' };
  var E = w.NEXOFIT_EMPRESA || {};
  var $ = function (id) { return d.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var fecha = function (iso) { try { return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };
  var PASOS = [
    ['nueva', 'Recibida', 'Revisamos tu pedido y elegimos a qué proveedores consultar.'],
    ['enviada', 'Consultando proveedores', 'Los proveedores que pueden cumplirlo están preparando su oferta.'],
    ['con_ofertas', 'Ofertas listas', 'Comparamos las ofertas y te las enviamos con nuestra recomendación.'],
    ['cerrada', 'Compra cerrada', 'Elegiste una oferta. ¡Gracias por comprar en Nexo Fit!']
  ];
  var form = $('buscar');
  if (!form) return;

  var q = new URLSearchParams(w.location.search);
  if (q.get('codigo')) $('codigo').value = q.get('codigo').toUpperCase().slice(0, 12);
  try {
    var ult = JSON.parse(w.sessionStorage.getItem('nf-sol-ultima') || 'null');
    if (ult && (!$('codigo').value || ult.code === $('codigo').value)) { $('codigo').value = ult.code; $('email').value = ult.email; }
  } catch (e) { /* sin almacenamiento */ }

  function render(s) {
    var idx = PASOS.map(function (p) { return p[0]; }).indexOf(s.status);
    var html = '<div class="card seg-card"><div class="seg-head"><div><p class="eyebrow">Solicitud</p><p class="code">' + esc(s.code) + '</p></div>'
      + '<p class="muted small">Creada el ' + esc(fecha(s.createdAt)) + '<br>' + esc(s.productos) + (s.productos === 1 ? ' producto' : ' productos') + ' · entrega en ' + esc(s.localidad) + '</p></div>';
    if (s.status === 'descartada') {
      html += '<p class="alert">Esta solicitud quedó sin efecto. Si fue un error o querés retomarla, escribinos.</p>';
    } else {
      html += '<ol class="timeline">' + PASOS.map(function (p, i) {
        var cls = i < idx ? 'done' : i === idx ? 'now' : '';
        var extra = '';
        if (p[0] === 'enviada' && s.proveedores > 0 && i <= idx) extra = ' <b>' + s.proveedores + (s.proveedores === 1 ? ' proveedor consultado.' : ' proveedores consultados.') + '</b>';
        if (p[0] === 'con_ofertas' && s.ofertas > 0 && i <= idx) extra = ' <b>' + s.ofertas + (s.ofertas === 1 ? ' oferta recibida.' : ' ofertas recibidas.') + '</b>';
        return '<li class="' + cls + '"' + (i === idx ? ' aria-current="step"' : '') + '><span class="dot" aria-hidden="true"></span><div><b>' + esc(p[1]) + '</b>'
          + (i === idx ? ' <span class="pill">Ahora</span>' : '') + '<p class="muted small">' + esc(p[2]) + extra + '</p></div></li>';
      }).join('') + '</ol>';
    }
    if (s.nota) html += '<p class="note"><b>Mensaje de Nexo Fit:</b> ' + esc(s.nota) + '</p>';
    if (Array.isArray(s.items) && s.items.length) {
      html += '<details class="seg-items"><summary>Ver lo que pediste</summary><ul>' + s.items.map(function (it) {
        return '<li>' + esc(it.cantidad) + ' × ' + esc(it.producto) + (it.detalle ? ' <span class="muted">(' + esc(it.detalle) + ')</span>' : '') + '</li>';
      }).join('') + '</ul></details>';
    }
    html += '<p class="muted small">Última actualización: ' + esc(fecha(s.updatedAt)) + '</p>';
    if (E.whatsapp) html += '<div class="actions"><a class="btn btn-dark" target="_blank" rel="noopener" href="https://wa.me/' + esc(E.whatsapp) + '?text=' + encodeURIComponent('Hola, quiero consultar por mi solicitud ' + s.code + ' en Nexo Fit.') + '">Consultar por WhatsApp</a></div>';
    html += '</div>';
    var box = $('resultado');
    box.innerHTML = html; box.hidden = false; box.focus();
  }

  var busy = false;
  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
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
        render(res.j);
      })
      .catch(function (e) {
        err.textContent = e && e.message && !/fetch|network/i.test(e.message) ? e.message : 'No pudimos conectarnos. Revisá tu conexión e intentá de nuevo.';
        err.hidden = false; $('resultado').hidden = true;
      })
      .then(function () { busy = false; $('ver').disabled = false; $('ver').textContent = 'Ver estado'; });
  });
  if ($('codigo').value && $('email').value) form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit'));
})(window, document);

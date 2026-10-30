/* Encabezado, pie con enlaces legales, datos del titular y WhatsApp para las páginas institucionales. */
(function (w, d) {
  'use strict';
  var E = w.NEXOFIT_EMPRESA || {};
  var LOGO = '<a href="index.html" aria-label="Nexo Fit, ir al inicio"><span class="logo-frame"><img src="assets/nexofit-logo.png" alt="Nexo Fit" width="1254" height="1254"></span></a>';
  // Catálogo de proveedores (vidriera con precios de referencia y "Pedir oferta"): visible en el menú,
  // el pie y los bloques marcados con data-catalogo. Poner false para volver a ocultarlo.
  var CATALOGO_VISIBLE = true;
  var top = d.getElementById('top');
  var n = 0; try { n = (JSON.parse(w.localStorage.getItem('cf-cart') || '[]') || []).length; } catch (e) {}
  var CART = '<a class="top-cart" href="nicolas.html#carrito" aria-label="Carrito' + (n ? ', ' + n + (n === 1 ? ' producto' : ' productos') : '') + '"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2l2.4 11h11.2L21 7H6.2"/><circle cx="9.5" cy="19.5" r="1.5"/><circle cx="17.5" cy="19.5" r="1.5"/></svg><span class="cart-l">Carrito</span>' + (n ? '<span class="cart-n">' + n + '</span>' : '') + '</a>';
  if (top) top.innerHTML = '<div class="wrap top-in">' + LOGO + '<nav class="nav" aria-label="Secciones"><a href="solicitud.html" title="Ya sé qué necesito">Pedir ofertas</a><a href="arma-tu-espacio.html" title="No sé por dónde empezar">Armá tu espacio</a>' + (CATALOGO_VISIBLE ? '<a href="catalogo" title="Precios de referencia">Catálogo</a>' : '') + '<a href="proveedores.html" title="Sumate como proveedor">Vendé</a></nav>' + (n ? CART : '') + '</div>';
  var foot = d.getElementById('foot');
  if (foot) {
    var who = [E.razonSocial, E.cuit && 'CUIT ' + E.cuit, E.domicilio].filter(Boolean).join(' · ');
    foot.innerHTML = '<div class="wrap foot-in"><span>Nexo Fit' + (who ? ' · ' + esc(who) : '') + '</span><nav aria-label="Información legal">'
      + (CATALOGO_VISIBLE ? '<a href="catalogo">Catálogo de proveedores</a>' : '') + '<a href="mi-solicitud.html">Seguir mi solicitud</a>'
      + '<a href="terminos.html">Términos y condiciones</a><a href="privacidad.html">Privacidad</a>'
      + '<a class="arrepentimiento" href="arrepentimiento.html">Botón de arrepentimiento</a>'
      + '<a href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario" target="_blank" rel="noopener">Defensa de las y los consumidores</a>'
      + '<a href="proveedores.html">Vendé en Nexo Fit</a>'
      + '<a href="https://www.instagram.com/nexofitt.arg/" target="_blank" rel="noopener">Instagram</a><a href="https://www.tiktok.com/@nexofitt.arg" target="_blank" rel="noopener">TikTok</a>'
      + (E.email ? '<a href="mailto:' + esc(E.email) + '">' + esc(E.email) + '</a>' : '')
      + (E.dataFiscalUrl ? '<a href="' + esc(E.dataFiscalUrl) + '" target="_blank" rel="noopener">Data fiscal</a>' : '') + '</nav></div>';
  }
  if (CATALOGO_VISIBLE) [].slice.call(d.querySelectorAll('[data-catalogo]')).forEach(function (el) { el.hidden = false; });
  // Datos del titular en el texto legal: solo se muestran si están completos.
  [].slice.call(d.querySelectorAll('[data-empresa]')).forEach(function (el) {
    var v = E[el.getAttribute('data-empresa')];
    if (v) el.textContent = v; else { var box = el.closest('[data-si-empresa]'); if (box) box.hidden = true; }
  });
  if (E.whatsapp && !d.querySelector('.wa-fab')) {
    var a = d.createElement('a');
    a.className = 'wa-fab'; a.target = '_blank'; a.rel = 'noopener';
    a.href = 'https://wa.me/' + E.whatsapp + '?text=' + encodeURIComponent('Hola, vengo de nexofitt.com.ar y quiero hacer una consulta.');
    a.textContent = 'WhatsApp';
    a.addEventListener('click', function () { if (w.nfTrack) w.nfTrack('Lead', { name: 'whatsapp' }); });
    d.body.appendChild(a);
  }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
})(window, document);

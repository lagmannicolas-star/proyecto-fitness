/* Encabezado, pie con enlaces legales, datos del titular y WhatsApp para las páginas institucionales. */
(function (w, d) {
  'use strict';
  var E = w.NEXOFIT_EMPRESA || {};
  var LOGO = '<a href="nicolas.html" aria-label="Nexo Fit, ir a la tienda"><span class="logo-frame"><img src="assets/nexofit-logo.png" alt="Nexo Fit" width="1254" height="1254"></span></a>';
  var top = d.getElementById('top');
  if (top) top.innerHTML = '<div class="wrap top-in">' + LOGO + '<nav class="nav" aria-label="Secciones"><a href="nicolas.html">Tienda</a><a href="gimnasios.html">Gimnasios</a><a href="clubes.html">Clubes</a><a href="colegios.html">Colegios</a><a href="nicolas.html#carrito">Carrito</a></nav></div>';
  var foot = d.getElementById('foot');
  if (foot) {
    var who = [E.razonSocial, E.cuit && 'CUIT ' + E.cuit, E.domicilio].filter(Boolean).join(' · ');
    foot.innerHTML = '<div class="wrap foot-in"><span>Nexo Fit' + (who ? ' · ' + esc(who) : '') + '</span><nav aria-label="Información legal">'
      + '<a href="terminos.html">Términos y condiciones</a><a href="privacidad.html">Privacidad</a>'
      + '<a class="arrepentimiento" href="arrepentimiento.html">Botón de arrepentimiento</a>'
      + '<a href="https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario" target="_blank" rel="noopener">Defensa de las y los consumidores</a>'
      + '<a href="proveedores.html">Vendé en Nexo Fit</a>'
      + (E.dataFiscalUrl ? '<a href="' + esc(E.dataFiscalUrl) + '" target="_blank" rel="noopener">Data fiscal</a>' : '') + '</nav></div>';
  }
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

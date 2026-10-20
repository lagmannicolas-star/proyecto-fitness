/* Nexo Fit: dirección oficial, etiquetas de campaña y medición (Google Analytics y píxel de Meta). */
(function (w, d) {
  'use strict';
  var SITIO = 'https://nexofitt.com.ar';
  // Códigos de medición. Vacíos = no se carga nada de terceros. Completar para activar.
  var GA4_ID = 'G-2EWW1D70MR';          // Google Analytics 4, por ejemplo 'G-XXXXXXXXXX'
  var META_PIXEL_ID = '';   // Píxel de Meta (Facebook / Instagram), solo números

  // El panel de administración y las páginas privadas de ofertas no se miden.
  if (/\/(admin|oferta)(\.html)?$/.test(w.location.pathname)) { GA4_ID = ''; META_PIXEL_ID = ''; }

  // Una sola dirección para Google, los anuncios y los compradores.
  var host = w.location.hostname;
  if (/github\.io$/.test(host) || host === 'www.nexofitt.com.ar') {
    w.location.replace(SITIO + w.location.pathname.replace(/^\/proyecto-fitness(?=\/|$)/, '') + w.location.search + w.location.hash);
    return;
  }

  // Etiquetas de campaña (utm): se guarda la primera de la visita y viaja con el pedido.
  try {
    var q = new URLSearchParams(w.location.search), u = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'].forEach(function (k) {
      if (q.get(k)) u[k] = q.get(k).slice(0, 120);
    });
    if (Object.keys(u).length && !w.sessionStorage.getItem('nf-utm')) {
      u.landing = w.location.pathname;
      w.sessionStorage.setItem('nf-utm', JSON.stringify(u));
    }
  } catch (e) { /* almacenamiento bloqueado: se sigue sin etiquetas */ }
  w.nfUtm = function () { try { return JSON.parse(w.sessionStorage.getItem('nf-utm') || 'null'); } catch (e) { return null; } };

  function script(src) { var s = d.createElement('script'); s.async = true; s.src = src; d.head.appendChild(s); }
  if (GA4_ID) {
    w.dataLayer = w.dataLayer || [];
    w.gtag = function () { w.dataLayer.push(arguments); };
    w.gtag('js', new Date());
    w.gtag('config', GA4_ID);
    script('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4_ID));
  }
  if (META_PIXEL_ID) {
    var f = w.fbq = function () { f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments); };
    if (!w._fbq) w._fbq = f;
    f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
    script('https://connect.facebook.net/en_US/fbevents.js');
    w.fbq('init', META_PIXEL_ID);
    w.fbq('track', 'PageView');
  }

  // Eventos de compra con nombres de Meta; se traducen a los de Google Analytics.
  var GA = { ViewContent: 'view_item', AddToCart: 'add_to_cart', InitiateCheckout: 'begin_checkout', Purchase: 'purchase', Lead: 'generate_lead', Search: 'search' };
  w.nfTrack = function (event, p) {
    p = p || {};
    try {
      if (w.gtag) w.gtag('event', GA[event] || event, { currency: 'ARS', value: p.value, search_term: p.search, item_name: p.name });
      if (w.fbq) w.fbq('track', event, { currency: 'ARS', value: p.value, content_name: p.name, search_string: p.search });
    } catch (e) { /* la medición nunca frena una compra */ }
  };
})(window, document);

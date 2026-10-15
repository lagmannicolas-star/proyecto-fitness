/* Páginas por tipo de cliente (gimnasios, clubes, colegios): textos y productos destacados con stock. */
(function (w, d) {
  'use strict';
  var DB = { url: 'https://ecdaxdqvdwplhovcmnxr.supabase.co', key: 'sb_publishable_QnPox0ljM1hZ_l4VFiqeYg_K_9KR65-' };
  var SEG = {
    gimnasios: { palabras: ['mancuerna', 'disco', 'barra', 'rusa', 'kettlebell', 'colchoneta', 'banda', 'step', 'soga', 'kit', 'combo'],
      wa: 'Hola, tengo un gimnasio y quiero un presupuesto en Nexo Fit.' },
    clubes: { palabras: ['cono', 'aro', 'escalera', 'valla', 'pelota', 'hockey', 'futbol', 'basket', 'voley', 'chaleco', 'arco', 'red'],
      wa: 'Hola, quiero equipar un club y necesito un presupuesto en Nexo Fit.' },
    colegios: { palabras: ['aro', 'hula', 'cono', 'pelota', 'colchoneta', 'soga', 'escolar', 'voley', 'basket', 'red'],
      wa: 'Hola, quiero equipar un colegio para educación física y necesito un presupuesto en Nexo Fit.' }
  };
  var seg = SEG[d.body.getAttribute('data-segmento')] || SEG.gimnasios;
  var E = w.NEXOFIT_EMPRESA || {};
  [].slice.call(d.querySelectorAll('[data-wa-presupuesto]')).forEach(function (a) {
    if (!E.whatsapp) { a.hidden = true; return; }
    a.href = 'https://wa.me/' + E.whatsapp + '?text=' + encodeURIComponent(seg.wa);
    a.addEventListener('click', function () { if (w.nfTrack) w.nfTrack('Lead', { name: 'presupuesto ' + d.body.getAttribute('data-segmento') }); });
  });
  var norm = function (s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var money = function (n) { return '$ ' + Number(n).toLocaleString('es-AR', { maximumFractionDigits: 2 }); };
  var box = d.getElementById('destacados'), status = d.getElementById('destacados-estado');
  function cartAdd(p) {
    try {
      var list = JSON.parse(localStorage.getItem('cf-cart') || '[]'), it = list.filter(function (x) { return x.id === p.offerId; })[0];
      if (it) it.qty += 1; else list.push({ id: p.offerId, qty: 1, price: p.price });
      localStorage.setItem('cf-cart', JSON.stringify(list));
      if (w.nfTrack) w.nfTrack('AddToCart', { value: p.price, name: p.name });
      status.textContent = 'Agregaste ' + p.name + '. Tenés ' + list.length + (list.length === 1 ? ' producto' : ' productos') + ' en el carrito.';
    } catch (e) { status.textContent = 'No pudimos guardar el carrito en este navegador.'; }
  }
  if (!box || typeof fetch !== 'function') return;
  fetch(DB.url + '/rest/v1/rpc/fitness_public_catalog', { method: 'POST', headers: { apikey: DB.key, 'Content-Type': 'application/json' }, body: '{}' })
    .then(function (r) { return r.ok ? r.json() : []; })
    .then(function (list) {
      if (!Array.isArray(list)) list = [];
      // Un producto por modelo, con stock, foto y precio; primero los que coinciden con más palabras del segmento.
      var seen = {}, picks = [];
      list.forEach(function (p) {
        if (!p.offerId || !p.image) return;
        var slug = String(p.key).split('#')[0];
        if (seen[slug]) return;
        var text = norm(p.name + ' ' + p.category), score = seg.palabras.filter(function (k) { return text.indexOf(k) >= 0; }).length;
        if (!score) return;
        seen[slug] = true; picks.push({ p: p, score: score });
      });
      picks.sort(function (a, b) { return b.score - a.score; });
      picks = picks.slice(0, 12).map(function (x) { return x.p; });
      if (!picks.length) { status.textContent = 'Mirá todos los productos en la tienda.'; return; }
      box.innerHTML = picks.map(function (p, i) {
        var props = (p.properties || []).map(function (x) { return x.name + ': ' + x.value; }).join(' · ');
        var src = /^https:\/\//.test(p.image) ? p.image : '/fotos/' + p.image;
        return '<article class="product"><div class="pimg"><img src="' + esc(src) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async"></div><span class="small muted">' + esc(p.vendorName) + '</span><b>' + esc(p.name) + '</b>' + (props ? '<span class="small">' + esc(props) + '</span>' : '') + '<span class="price">' + money(p.price) + '</span><button class="btn btn-accent" type="button" data-add="' + i + '">Agregar al carrito</button></article>';
      }).join('');
      box.addEventListener('click', function (ev) { var b = ev.target.closest('[data-add]'); if (b) cartAdd(picks[Number(b.getAttribute('data-add'))]); });
      status.textContent = '';
    }).catch(function () { status.textContent = 'Mirá todos los productos en la tienda.'; });
})(window, document);

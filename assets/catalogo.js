/* Catálogo de proveedores (vidriera): productos aprobados de proveedores activos con precio de referencia.
   El centro es comparar: el mismo producto de distintos proveedores se reúne en una sola tarjeta
   ("3 proveedores · desde $X") y la ficha muestra cada publicación como Proveedor A, B, C…
   No se compra acá: el comprador arma "Mi pedido" y lo pasa a solicitud.html con el mismo mecanismo que
   "Armá tu espacio" (sessionStorage 'nf-sol-prefill' + ?desde=catalogo).
   Los nombres de los proveedores no se muestran ni se guardan en la página: el comprador los ve recién al
   elegir una oferta (anti-salteo). Del proveedor solo se usan tipo y provincia, si el catálogo los trae.
   La referencia interna del proveedor (vendorRef) se usa solo para agrupar y nunca llega al HTML. */
(function (w, d) {
  'use strict';
  var DB = { url: 'https://ecdaxdqvdwplhovcmnxr.supabase.co', key: 'sb_publishable_QnPox0ljM1hZ_l4VFiqeYg_K_9KR65-' };
  var MAX = 25;            // mismas líneas que acepta la solicitud
  var PAGINA = 24;
  var MAX_CMP = 4;         // productos para comparar lado a lado
  var KEY = 'nf-cat-pedido';
  var LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function plain(s) { return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  // Normalización conservadora para reconocer el mismo producto: sin acentos ni signos, unidades escritas igual.
  var RUIDO = /\b(unidad(es)?|unid|oferta|promo|nuevo|nueva|original|x ?unidad|c ?u)\b/g;
  function norm(s) {
    return plain(s)
      .replace(/[×✕]/g, ' x ')
      .replace(/(\d),(\d)/g, '$1.$2')
      .replace(/(\d)\s*(kgs?|kilos?|kilogramos?|cm|mm|mts?|m|lts?|l|lbs?)\b/g, '$1 $2')
      .replace(/\b(kgs|kilos?|kilogramos?)\b/g, 'kg')
      .replace(/[^a-z0-9.]+/g, ' ')
      .replace(/(^|\s)\.+|\.+(\s|$)/g, ' ')
      .replace(RUIDO, ' ')
      .replace(/\s+/g, ' ').trim();
  }
  function normCat(s) { return norm(s).split(' ').map(function (x) { return x.length > 3 ? x.replace(/e?s$/, '') : x; }).join(' '); }
  function money(n) { return typeof n === 'number' && n > 0 ? '$ ' + Math.round(n).toLocaleString('es-AR') : ''; }
  function rango(min, max) { var m = function (n) { return money(n).replace(' ', '\u00a0'); }; return !min ? 'A consultar' : (max > min ? m(min) + ' a ' + m(max) : m(min)); }
  function varLabel(p) { return (p.properties || []).filter(function (x) { return x && x.value; }).map(function (x) { return (x.name ? x.name + ': ' : '') + x.value; }).join(' · '); }
  function varKey(p) { return (p.properties || []).filter(function (x) { return x && x.value; }).map(function (x) { return norm(x.value); }).sort().join(' / '); }
  // Datos de confianza sin identificar al proveedor.
  function trust(p) {
    var tipo = String(p.vendorType || '').trim(), prov = String(p.vendorProvince || '').trim();
    if (tipo && prov) return tipo + ' · ' + prov;
    if (tipo) return tipo;
    if (prov) return 'Proveedor de ' + prov;
    return 'Proveedor de la red';
  }
  function photo(path) { return !path ? '' : (/^https:\/\//.test(path) ? path : '/fotos/' + path); }
  function precio(n) { return typeof n === 'number' && n > 0 ? n : null; }
  function minmax(list) { var x = list.filter(Boolean); return x.length ? [Math.min.apply(null, x), Math.max.apply(null, x)] : [null, null]; }

  /* Agrupa las filas del catálogo en productos comparables:
     producto = categoría + marca/modelo (si vienen) + nombre normalizados;
     dentro, una publicación por proveedor y variantes alineadas por sus valores (Peso: 10 kg = 10 kg). */
  function agrupar(list) {
    var by = {}, out = [];
    (Array.isArray(list) ? list : []).forEach(function (p) {
      if (!p || !p.name) return;
      var slug = String(p.key || p.name).split('#')[0];
      var ref = String(p.vendorRef || p.vendorId || ('pub:' + slug));
      var pk = [normCat(p.category), norm(p.brand), norm(p.model), norm(p.name)].join('|');
      var x = by[pk];
      if (!x) { x = by[pk] = { key: pk, name: String(p.name), category: String(p.category || '').trim(), image: '', pubs: {}, vars: {}, varOrder: [] }; out.push(x); }
      if (!x.image && p.image) { x.image = photo(p.image); x.name = String(p.name); }
      var pub = x.pubs[ref];
      if (!pub) pub = x.pubs[ref] = { ref: ref, trust: trust(p), image: '', variants: [] };
      if (!pub.image && p.image) pub.image = photo(p.image);
      var vk = varKey(p), lbl = varLabel(p);
      pub.variants.push({ vk: vk, label: lbl, price: precio(p.price), units: p.units == null ? null : +p.units });
      if (!x.vars[vk]) { x.vars[vk] = { vk: vk, label: lbl, prices: [] }; x.varOrder.push(vk); }
    });
    out.forEach(function (x, i) {
      // Letras estables por producto: orden por referencia interna, que no se muestra.
      var refs = Object.keys(x.pubs).sort();
      x.suppliers = refs.map(function (r, j) {
        var pub = x.pubs[r], mm = minmax(pub.variants.map(function (v) { return v.price; }));
        return { letter: LETRAS[j] || String(j + 1), trust: pub.trust, image: pub.image, variants: pub.variants, min: mm[0], max: mm[1] };
      });
      delete x.pubs;
      x.id = 'p' + i;
      x.n = x.suppliers.length;
      x.variants = x.varOrder.map(function (vk) {
        var v = x.vars[vk], offers = [];
        x.suppliers.forEach(function (s) { s.variants.forEach(function (sv) { if (sv.vk === vk) offers.push({ letter: s.letter, price: sv.price, units: sv.units }); }); });
        var mm = minmax(offers.map(function (o) { return o.price; }));
        return { vk: vk, label: v.label, labelNorm: norm(v.label), offers: offers, min: mm[0], max: mm[1], n: offers.length };
      });
      delete x.vars; delete x.varOrder;
      var mm = minmax(x.variants.map(function (v) { return v.min; }).concat(x.variants.map(function (v) { return v.max; })));
      x.min = mm[0]; x.max = mm[1];
      x.text = plain(x.name + ' ' + x.category + ' ' + x.variants.map(function (v) { return v.label; }).join(' '));
      x.trust = x.n === 1 ? x.suppliers[0].trust : '';
    });
    return ordenar(out, 'proveedores');
  }
  function ordenar(prods, modo) {
    var byName = function (a, b) { return a.name.localeCompare(b.name, 'es'); };
    var cmp = modo === 'precio' ? function (a, b) { return (a.min || Infinity) - (b.min || Infinity) || byName(a, b); }
      : modo === 'az' ? byName
      : function (a, b) { return b.n - a.n || (b.image ? 1 : 0) - (a.image ? 1 : 0) || byName(a, b); };
    return prods.slice().sort(cmp);
  }
  function filtrar(prods, q, cat, soloComparables) {
    var toks = plain(q).split(/\s+/).filter(Boolean);
    return prods.filter(function (p) { return (!cat || p.category === cat) && (!soloComparables || p.n > 1) && toks.every(function (t) { return p.text.indexOf(t) >= 0; }); });
  }
  // Variante más barata que coincide con la búsqueda (si la búsqueda nombra una medida o un peso).
  function masBarata(p, q) {
    var base = norm(p.name + ' ' + p.category).split(' ');
    var toks = norm(q).split(' ').filter(function (t) { return t && base.indexOf(t) < 0; });
    var pool = p.variants.filter(function (v) { return v.min; });
    var hit = pool.filter(function (v) { var w2 = v.labelNorm.split(' '); return toks.length && toks.every(function (t) { return w2.indexOf(t) >= 0; }); });
    if (hit.length) pool = hit;
    return pool.sort(function (a, b) { return a.min - b.min; })[0] || null;
  }
  function categorias(prods) {
    var n = {};
    prods.forEach(function (p) { if (p.category) n[p.category] = (n[p.category] || 0) + 1; });
    return Object.keys(n).sort(function (a, b) { return a.localeCompare(b, 'es'); }).map(function (c) { return [c, n[c]]; });
  }
  // Línea de la solicitud: producto, cantidad y detalle (variante y precios de referencia vistos).
  function lineaSolicitud(it) {
    var ref = !it.precio ? '' : (it.precioMax > it.precio ? 'Precios de referencia vistos: ' + money(it.precio) + ' a ' + money(it.precioMax) + (it.proveedores > 1 ? ' (' + it.proveedores + ' proveedores)' : '') : 'Precio de referencia visto: ' + money(it.precio));
    var det = [it.variante, ref].filter(Boolean).join(' · ');
    return { producto: String(it.producto || '').slice(0, 120), cantidad: String(Math.max(1, Math.min(999999, Math.round(+it.cantidad || 1)))), detalle: det.slice(0, 300) };
  }
  function prefill(pedido) {
    return {
      items: pedido.slice(0, MAX).map(lineaSolicitud),
      detalles: 'Productos elegidos en el catálogo de Nexo Fit. Los precios del catálogo son de referencia.'
    };
  }
  var API = { agrupar: agrupar, ordenar: ordenar, filtrar: filtrar, masBarata: masBarata, categorias: categorias, trust: trust, norm: norm, prefill: prefill, lineaSolicitud: lineaSolicitud, money: money, MAX: MAX, MAX_CMP: MAX_CMP };
  w.NFCatalogo = API;
  if (!d || !d.getElementById('cat-app')) return;

  var $ = function (id) { return d.getElementById(id); };
  var st = { prods: [], q: '', cat: '', orden: 'proveedores', solo2: false, shown: PAGINA, pedido: leer(), cmp: [], abierto: null };

  function leer() { try { var x = JSON.parse(w.localStorage.getItem(KEY) || '[]'); return Array.isArray(x) ? x.filter(function (i) { return i && i.producto; }).slice(0, MAX) : []; } catch (e) { return []; } }
  function guardar() { try { w.localStorage.setItem(KEY, JSON.stringify(st.pedido)); } catch (e) { /* queda en memoria */ } }
  function prodById(id) { return st.prods.filter(function (x) { return x.id === id; })[0]; }
  function itemKey(p, v) { return p.key + '#' + v.vk; }

  function cargar() {
    $('cat-estado').innerHTML = '<p class="muted" role="status">Cargando productos…</p>';
    $('cat-grid').innerHTML = ''; $('cat-mas').hidden = true; $('cat-filtros').hidden = true;
    fetch(DB.url + '/rest/v1/rpc/fitness_public_catalog', { method: 'POST', headers: { apikey: DB.key, 'Content-Type': 'application/json' }, body: '{}' })
      .then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); })
      .then(function (list) { if (!Array.isArray(list)) throw new Error('formato'); st.prods = agrupar(list); pintarFiltros(); pintar(); })
      .catch(function () {
        $('cat-estado').innerHTML = '<div class="cat-vacio"><p><b>No pudimos cargar el catálogo.</b> Revisá tu conexión y probá de nuevo.</p><div class="actions"><button class="btn btn-dark" type="button" id="cat-reintentar">Probar de nuevo</button><a class="btn btn-outline" href="solicitud.html">Pedir ofertas</a></div></div>';
        $('cat-reintentar').addEventListener('click', cargar);
      });
  }

  function pintarFiltros() {
    if (!st.prods.length) return;
    $('cat-filtros').hidden = false;
    $('cat-cat').innerHTML = '<option value="">Todas las categorías</option>' + categorias(st.prods).map(function (c) {
      return '<option value="' + esc(c[0]) + '"' + (c[0] === st.cat ? ' selected' : '') + '>' + esc(c[0]) + ' (' + c[1] + ')</option>';
    }).join('');
    var comparables = st.prods.filter(function (p) { return p.n > 1; }).length;
    $('cat-solo2-n').textContent = comparables ? ' (' + comparables + ')' : '';
  }

  function pintar() {
    var est = $('cat-estado'), grid = $('cat-grid');
    if (!st.prods.length) {
      est.innerHTML = '<div class="cat-vacio"><p><b>Estamos sumando proveedores.</b> Mientras tanto, pedí ofertas o armá tu espacio.</p><div class="actions"><a class="btn btn-accent" href="solicitud.html">Pedir ofertas</a><a class="btn btn-outline" href="arma-tu-espacio.html">Armá tu espacio</a></div></div>';
      grid.innerHTML = ''; $('cat-mas').hidden = true; return;
    }
    var list = ordenar(filtrar(st.prods, st.q, st.cat, st.solo2), st.orden);
    est.innerHTML = '<p class="small muted" role="status">' + (list.length === 1 ? '1 producto' : list.length + ' productos') + (st.cat ? ' en ' + esc(st.cat) : '') + (st.solo2 ? ' con 2 o más proveedores' : '') + '</p>'
      + (!list.length ? '<div class="cat-vacio"><p><b>No encontramos productos' + (st.q ? ' con “' + esc(st.q) + '”' : '') + '.</b> Probá con otra palabra o pedí ofertas igual: se lo consultamos a los proveedores de la red.</p><div class="actions"><a class="btn btn-accent" href="solicitud.html' + (st.q ? '?producto=' + encodeURIComponent(st.q.slice(0, 120)) : '') + '">Pedir ofertas' + (st.q ? ' por “' + esc(st.q) + '”' : '') + '</a></div></div>' : '');
    grid.innerHTML = list.slice(0, st.shown).map(tarjeta).join('');
    var resto = list.length - st.shown;
    $('cat-mas').hidden = resto <= 0;
    $('cat-mas').textContent = 'Ver más productos (' + Math.max(0, resto) + ')';
  }

  function enPedido(p) { return st.pedido.filter(function (i) { return p.variants.some(function (v) { return i.key === itemKey(p, v); }); }).length; }
  function tarjeta(p) {
    var ya = enPedido(p), mb = masBarata(p, st.q), sel = st.cmp.indexOf(p.id) >= 0, lleno = st.cmp.length >= MAX_CMP && !sel;
    var var1 = p.variants.length === 1 ? p.variants[0].label : '';
    return '<article class="cat-card' + (p.n > 1 ? ' multi' : '') + '" data-id="' + p.id + '">'
      + '<div class="cat-img">' + (p.image ? '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async">' : '<span aria-hidden="true">' + esc((p.category || p.name).slice(0, 1)) + '</span>') + '</div>'
      + '<div class="cat-body">'
      + '<div class="cat-tags">' + (p.category ? '<span class="cat-tag">' + esc(p.category) + '</span>' : '') + (p.n > 1 ? '<span class="cat-tag cat-n">' + p.n + ' proveedores</span>' : '') + '</div>'
      + '<h3>' + esc(p.name) + '</h3>'
      + '<p class="small muted cat-trust">' + (p.n > 1 ? 'Mismo producto en ' + p.n + ' proveedores de la red' : esc(p.trust)) + (p.variants.length > 1 ? ' · ' + p.variants.length + ' variantes' : (var1 ? ' · ' + esc(var1) : '')) + '</p>'
      + '<p class="cat-precio"><span class="small muted">Precio de referencia' + (p.max > p.min ? ', desde' : '') + '</span><b>' + (p.min ? money(mb && mb.min || p.min) : 'A consultar') + '</b>'
      + (mb && p.variants.length > 1 && mb.label ? '<span class="small muted">' + esc(mb.label) + '</span>' : '')
      + (p.n > 1 && p.max > p.min ? '<span class="small cat-rango">Entre proveedores: ' + rango(p.min, p.max) + '</span>' : '') + '</p>'
      + (p.n > 1 ? '<button class="linkbtn" type="button" data-act="ver">Comparar ' + p.n + ' proveedores&nbsp;→</button>' : '')
      + '<div class="cat-acts"><button class="btn btn-accent" type="button" data-act="pedir">' + (p.n > 1 ? 'Pedir oferta a todos' : 'Pedir oferta') + '</button>'
      + '<button class="btn btn-outline" type="button" data-act="agregar">' + (ya ? 'En tu pedido ✓' : 'Agregar a mi pedido') + '</button></div>'
      + '<label class="cat-cmp"><input type="checkbox" data-cmp' + (sel ? ' checked' : '') + (lleno ? ' disabled' : '') + '> Comparar' + (lleno ? ' <span class="small muted">(máximo ' + MAX_CMP + ')</span>' : '') + '</label>'
      + '</div></article>';
  }

  // Ficha: comparación entre proveedores (anónimos) y cantidades por variante.
  function abrirFicha(p, modo) {
    st.abierto = { p: p, modo: modo };
    var multi = p.n > 1, sups = p.suppliers.slice().sort(function (a, b) { return (a.min || Infinity) - (b.min || Infinity); });
    var low = sups[0] && sups[0].min;
    var comp = !multi ? '' : '<section class="cmp-sup" aria-labelledby="cmp-sup-t"><h3 id="cmp-sup-t">Comparación de proveedores</h3><p class="small muted">Ordenados por precio de referencia. Los nombres se conocen al elegir una oferta.</p><ol class="sup-list">'
      + sups.map(function (s) {
        var best = s.min && s.min === low;
        return '<li class="sup' + (best ? ' best' : '') + '">' + (s.image ? '<img src="' + esc(s.image) + '" alt="" loading="lazy">' : '<span class="sup-ph" aria-hidden="true">' + s.letter + '</span>')
          + '<div class="sup-b"><p class="sup-h"><b>Proveedor ' + s.letter + '</b>' + (best ? '<span class="pill-low">Precio más bajo</span>' : '') + '</p><p class="small muted">' + esc(s.trust) + '</p>'
          + '<ul class="sup-vars">' + s.variants.slice().sort(function (a, b) { return (a.price || Infinity) - (b.price || Infinity); }).map(function (v) {
            var vg = p.variants.filter(function (x) { return x.vk === v.vk; })[0], lowV = vg && vg.n > 1 && v.price && v.price === vg.min;
            return '<li><span>' + esc(v.label || 'Presentación única') + '</span><b class="' + (lowV ? 'low' : '') + '">' + (v.price ? money(v.price) : 'A consultar') + '</b>' + (v.units === 0 ? '<span class="small muted">Sin stock por ahora</span>' : (v.units > 0 ? '<span class="small muted">Con stock</span>' : '')) + '</li>';
          }).join('') + '</ul></div></li>';
      }).join('') + '</ol></section>';
    $('ficha-body').innerHTML = '<div class="ficha-top">' + (p.image ? '<div class="ficha-img"><img src="' + esc(p.image) + '" alt="' + esc(p.name) + '"></div>' : '')
      + '<div><p class="eyebrow">' + esc(p.category || 'Catálogo') + '</p><h2 id="ficha-t">' + esc(p.name) + '</h2><p class="small muted">' + (multi ? p.n + ' proveedores de la red · precios de referencia ' + (p.min ? 'de ' + rango(p.min, p.max) : 'a consultar') : esc(p.trust)) + '</p></div></div>'
      + '<p class="note small">Precio de referencia. El precio final llega en la oferta privada, con envío a tu localidad, cuotas y factura.' + (multi ? ' Tu pedido llega a los proveedores de la red de este rubro y cada uno te ofrece en privado.' : '') + '</p>'
      + comp
      + '<fieldset class="ficha-vars"><legend>' + (p.variants.length > 1 ? 'Elegí variantes y cantidades' : 'Cantidad') + '</legend>'
      + p.variants.map(function (v, i) {
        var prev = st.pedido.filter(function (it) { return it.key === itemKey(p, v); })[0];
        var val = prev ? prev.cantidad : (i === 0 ? 1 : 0);
        var info = v.min ? (multi && v.n > 1 ? rango(v.min, v.max) + ' · en ' + v.n + ' proveedores' : money(v.min) + ' de referencia') : 'Precio a consultar';
        var sinStock = v.offers.every(function (o) { return o.units === 0; });
        return '<div class="ficha-var"><label for="fv' + i + '"><span>' + esc(v.label || 'Presentación única') + '</span><span class="small muted">' + info + (sinStock ? ' · sin stock por ahora' : '') + '</span></label>'
          + '<input id="fv' + i + '" type="number" inputmode="numeric" min="0" max="999999" step="1" value="' + val + '" data-i="' + i + '" aria-label="Cantidad de ' + esc(p.name + (v.label ? ' ' + v.label : '')) + '"></div>';
      }).join('') + '</fieldset>'
      + '<p id="ficha-error" class="alert" role="alert" hidden></p>';
    var pedirTxt = multi ? 'Pedir oferta a todos' : 'Pedir oferta';
    $('ficha-ok').textContent = modo === 'agregar' ? 'Agregar a mi pedido' : pedirTxt;
    $('ficha-alt').textContent = modo === 'agregar' ? pedirTxt : 'Agregar a mi pedido';
    abrir($('cat-ficha'));
    var first = $('cat-ficha').querySelector(modo === 'ver' ? '.dlg-x' : 'input'); if (first) try { first.focus(); if (first.select) first.select(); } catch (e) {}
  }
  function aplicarFicha() {
    var a = st.abierto; if (!a) return false;
    var p = a.p, err = $('ficha-error'), sel = [];
    [].slice.call($('ficha-body').querySelectorAll('input[data-i]')).forEach(function (inp) {
      var q = Math.min(999999, Math.max(0, Math.round(+String(inp.value).replace(/\D/g, '') || 0)));
      sel.push({ v: p.variants[+inp.getAttribute('data-i')], q: q });
    });
    if (!sel.some(function (s) { return s.q > 0; })) { err.textContent = 'Poné una cantidad en al menos una variante.'; err.hidden = false; return false; }
    var next = st.pedido.filter(function (it) { return !p.variants.some(function (v) { return it.key === itemKey(p, v); }); });
    sel.forEach(function (s) { if (s.q > 0) next.push({ key: itemKey(p, s.v), producto: p.name, variante: s.v.label, precio: s.v.min, precioMax: s.v.max, proveedores: s.v.n, cantidad: s.q }); });
    if (next.length > MAX) { err.textContent = 'Tu pedido puede tener hasta ' + MAX + ' productos. Quitá alguno para sumar este.'; err.hidden = false; return false; }
    st.pedido = next; guardar(); pintarBarra(); pintar();
    return true;
  }
  function pedirOfertas() {
    if (!st.pedido.length) return;
    try { w.sessionStorage.setItem('nf-sol-prefill', JSON.stringify(prefill(st.pedido))); }
    catch (e) { w.location.href = 'solicitud.html?producto=' + encodeURIComponent(st.pedido[0].producto.slice(0, 120)) + '&cantidad=' + encodeURIComponent(st.pedido[0].cantidad); return; }
    if (w.nfTrack) w.nfTrack('Lead', { name: 'catalogo pedir oferta' });
    w.location.href = 'solicitud.html?desde=catalogo';
  }

  function pintarBarra() {
    var n = st.pedido.length, c = st.cmp.length, bar = $('cat-bar');
    bar.hidden = !n && !c; d.body.classList.toggle('con-pedido', !!(n || c));
    $('cat-bar-ped').hidden = !n; $('cat-bar-cmp').hidden = !c;
    $('cat-bar-n').textContent = n === 1 ? '1 producto' : n + ' productos';
    $('cat-bar-cmp').textContent = 'Comparar (' + c + ')';
    $('pedido-list').innerHTML = !n ? '<p class="muted">Tu pedido está vacío.</p>' : st.pedido.map(function (it, i) {
      var ref = it.precio ? (it.precioMax > it.precio ? money(it.precio) + ' a ' + money(it.precioMax) : money(it.precio)) + ' de referencia' : '';
      return '<li class="ped-row"><div><b>' + esc(it.producto) + '</b><span class="small muted">' + esc([it.variante, ref].filter(Boolean).join(' · ')) + '</span></div>'
        + '<label class="sr" for="pq' + i + '">Cantidad</label><input id="pq' + i + '" type="number" inputmode="numeric" min="1" max="999999" step="1" value="' + esc(it.cantidad) + '" data-pq="' + i + '">'
        + '<button type="button" class="kit-x" data-px="' + i + '" aria-label="Quitar ' + esc(it.producto) + '">×</button></li>';
    }).join('');
    $('pedido-enviar').disabled = !n;
    $('pedido-enviar').textContent = n ? 'Pedir ofertas por ' + (n === 1 ? '1 producto' : n + ' productos') : 'Pedir ofertas';
  }

  // Comparar lado a lado: hasta 4 productos (por ejemplo, dos cintas de correr de proveedores distintos).
  function pintarComparar() {
    var ps = st.cmp.map(prodById).filter(Boolean);
    var row = function (th, f) { return '<tr><th scope="row">' + th + '</th>' + ps.map(function (p) { return '<td>' + f(p) + '</td>'; }).join('') + '</tr>'; };
    $('cmp-body').innerHTML = !ps.length ? '<p class="muted">Marcá “Comparar” en hasta ' + MAX_CMP + ' productos.</p>'
      : '<div class="cmp-scroll" tabindex="0" aria-label="Tabla de comparación, deslizá para ver más"><table class="cmp-t" style="--cols:' + ps.length + '"><thead><tr><th scope="col"><span class="sr">Dato</span></th>' + ps.map(function (p) {
        return '<th scope="col">' + (p.image ? '<img src="' + esc(p.image) + '" alt="">' : '<span class="cmp-ph" aria-hidden="true">' + esc((p.category || p.name).slice(0, 1)) + '</span>') + '<b>' + esc(p.name) + '</b></th>';
      }).join('') + '</tr></thead><tbody>'
      + row('Categoría', function (p) { return esc(p.category || '—'); })
      + row('Precio de referencia', function (p) { return '<b>' + rango(p.min, p.max) + '</b>'; })
      + row('Proveedores', function (p) { return p.n > 1 ? p.n + ' proveedores' : '1 · ' + esc(p.trust); })
      + row('Variantes', function (p) {
        var vs = p.variants.slice(0, 6).map(function (v) { return '<li>' + esc(v.label || 'Presentación única') + (v.min ? ' <span class="muted">' + money(v.min) + (v.max > v.min ? '+' : '') + '</span>' : '') + '</li>'; }).join('');
        return '<ul class="cmp-vars">' + vs + (p.variants.length > 6 ? '<li class="muted">y ' + (p.variants.length - 6) + ' más</li>' : '') + '</ul>';
      })
      + row('<span class="sr">Acciones</span>', function (p) { return '<div class="cmp-acts"><button class="btn btn-accent" type="button" data-cmp-pedir="' + p.id + '">' + (p.n > 1 ? 'Pedir oferta a todos' : 'Pedir oferta') + '</button><button class="linkbtn" type="button" data-cmp-quitar="' + p.id + '">Quitar</button></div>'; })
      + '</tbody></table></div>';
  }
  function toggleCmp(id, on) {
    var i = st.cmp.indexOf(id);
    if (on && i < 0 && st.cmp.length < MAX_CMP) st.cmp.push(id);
    if (!on && i >= 0) st.cmp.splice(i, 1);
    pintarBarra(); pintar();
  }

  function abrir(dlg) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
  function cerrar(dlg) { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }

  // Eventos
  var t;
  $('cat-q').addEventListener('input', function (ev) { clearTimeout(t); t = setTimeout(function () { st.q = ev.target.value.trim(); st.shown = PAGINA; pintar(); }, 150); });
  $('cat-cat').addEventListener('change', function (ev) { st.cat = ev.target.value; st.shown = PAGINA; pintar(); });
  $('cat-orden').addEventListener('change', function (ev) { st.orden = ev.target.value; pintar(); });
  $('cat-solo2').addEventListener('change', function (ev) { st.solo2 = ev.target.checked; st.shown = PAGINA; pintar(); });
  $('cat-mas').addEventListener('click', function () { st.shown += PAGINA; pintar(); });
  $('cat-grid').addEventListener('change', function (ev) {
    if (!ev.target.hasAttribute('data-cmp')) return;
    toggleCmp(ev.target.closest('.cat-card').getAttribute('data-id'), ev.target.checked);
  });
  $('cat-grid').addEventListener('click', function (ev) {
    var b = ev.target.closest('button[data-act]'); if (!b) return;
    var p = prodById(b.closest('.cat-card').getAttribute('data-id'));
    if (p) abrirFicha(p, b.getAttribute('data-act'));
  });
  function confirmar(pedir) {
    if (!aplicarFicha()) return;
    cerrar($('cat-ficha'));
    if (pedir) pedirOfertas();
  }
  $('ficha-ok').addEventListener('click', function () { confirmar(!(st.abierto && st.abierto.modo === 'agregar')); });
  $('ficha-alt').addEventListener('click', function () { confirmar(!!(st.abierto && st.abierto.modo === 'agregar')); });
  $('ficha-cerrar').addEventListener('click', function () { cerrar($('cat-ficha')); });
  $('cat-bar-ver').addEventListener('click', function () { pintarBarra(); abrir($('cat-pedido')); });
  $('cat-bar-cmp').addEventListener('click', function () { pintarComparar(); abrir($('cat-comparar')); });
  $('cmp-cerrar').addEventListener('click', function () { cerrar($('cat-comparar')); });
  $('cmp-body').addEventListener('click', function (ev) {
    var q = ev.target.closest('[data-cmp-quitar]'), pd = ev.target.closest('[data-cmp-pedir]');
    if (q) { toggleCmp(q.getAttribute('data-cmp-quitar'), false); pintarComparar(); if (!st.cmp.length) cerrar($('cat-comparar')); }
    if (pd) { var p = prodById(pd.getAttribute('data-cmp-pedir')); cerrar($('cat-comparar')); if (p) abrirFicha(p, 'pedir'); }
  });
  $('pedido-cerrar').addEventListener('click', function () { cerrar($('cat-pedido')); });
  $('pedido-enviar').addEventListener('click', pedirOfertas);
  $('pedido-list').addEventListener('click', function (ev) {
    var x = ev.target.closest('[data-px]'); if (!x) return;
    st.pedido.splice(+x.getAttribute('data-px'), 1); guardar(); pintarBarra(); pintar();
    if (!st.pedido.length) cerrar($('cat-pedido'));
  });
  $('pedido-list').addEventListener('change', function (ev) {
    var i = ev.target.getAttribute('data-pq'); if (i == null) return;
    var q = Math.min(999999, Math.max(1, Math.round(+String(ev.target.value).replace(/\D/g, '') || 1)));
    st.pedido[+i].cantidad = q; ev.target.value = q; guardar();
  });
  [$('cat-ficha'), $('cat-pedido'), $('cat-comparar')].forEach(function (dlg) {
    dlg.addEventListener('click', function (ev) { if (ev.target === dlg) cerrar(dlg); });
  });

  pintarBarra();
  cargar();
})(window, typeof document === 'undefined' ? null : document);

/* Armá tu espacio en 3D: dibuja el ambiente con sus medidas y ubica cada producto de la lista a escala real.
   Se carga solo cuando la sección se acerca a la pantalla. Escucha el evento "nf-kit" que emite espacio.js. */
(function (w, d) {
  'use strict';
  var box = d.getElementById('e3d');
  if (!box) return;
  var $ = function (id) { return d.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  // Medidas sugeridas del ambiente según el tipo de espacio (largo × ancho, en metros).
  var SALA = { gimnasio: [14, 9], club: [16, 10], colegio: [18, 10], casa: [4, 3] };
  var last = null, user = {}, three = null, loading = false;

  // ---------- Catálogo 3D: qué figura usa cada producto y cuántas unidades dibuja ----------
  // f: figura · w,dp: huella en metros (ancho × profundidad) · c: espacio libre alrededor para usarlo · n(q): cuántas figuras · tag: etiqueta
  var REGLAS = [
    [/rack|jaula/i, { f: 'rack', w: 1.4, dp: 1.5, c: 0.9, n: function (q) { return q; }, tag: 'Rack' }],
    [/banco/i, { f: 'banco', w: 0.6, dp: 1.3, c: 0.7, n: function (q) { return q; }, tag: 'Banco' }],
    [/barra ol[ií]mpica|barras ol[ií]mpicas|barra con discos/i, { f: 'barras', w: 0.6, dp: 0.6, c: 0.3, n: function (q) { return Math.ceil(q / 6); }, tag: 'Soporte de barras' }],
    [/disco/i, { f: 'discos', w: 0.7, dp: 0.7, c: 0.4, n: function (q) { return q >= 40 ? Math.ceil(q / 150) : 1; }, tag: 'Árbol de discos' }],
    [/mancuernero/i, { skip: true }],
    [/mancuerna/i, { f: 'mancuernero', w: 1.6, dp: 0.6, c: 0.8, n: function (q, it) { return /juego/i.test(it.p) ? q : Math.max(1, Math.ceil(q / 10)); }, tag: 'Mancuernero' }],
    [/pesa rusa|pesas rusas|kettlebell/i, { f: 'rusas', w: 1.2, dp: 0.5, c: 0.6, n: function (q) { return Math.max(1, Math.ceil(q / 12)); }, tag: 'Estante de pesas rusas' }],
    [/caj[oó]n/i, { f: 'cajones', w: 0.75, dp: 0.6, c: 0.4, n: function (q) { return Math.max(1, Math.ceil(q / 3)); }, tag: 'Cajones de salto' }],
    [/colchoneta/i, { f: 'colchonetas', w: 1, dp: 0.5, c: 0.3, n: function (q) { return Math.max(1, Math.ceil(q / 15)); }, tag: 'Pila de colchonetas' }],
    [/mat/i, { f: 'mat', w: 0.6, dp: 1.8, c: 0.5, n: function (q) { return Math.min(q, 30); }, tag: 'Mat' }],
    [/step/i, { f: 'steps', w: 0.9, dp: 0.35, c: 0.3, n: function (q) { return Math.max(1, Math.ceil(q / 8)); }, tag: 'Steps' }],
    [/pelotas de pilates|esferodinamia/i, { f: 'pilates', w: 0.7, dp: 0.7, c: 0.2, n: function (q) { return Math.max(1, Math.ceil(q / 4)); }, tag: 'Pelotas de pilates' }],
    [/arco/i, { f: 'arco', w: 3, dp: 1.2, c: 1, n: function (q) { return Math.min(q, 4); }, tag: 'Arco' }],
    [/red de v[oó]ley/i, { f: 'voley', w: 9.5, dp: 0.4, c: 1.5, n: function (q) { return Math.min(q, 2); }, tag: 'Red de vóley' }],
    [/jirafa|aro de b[aá]squet|tablero/i, { f: 'basquet', w: 1.8, dp: 2.2, c: 1, n: function (q) { return Math.min(q, 4); }, tag: 'Jirafa de básquet' }],
    [/ping ?pong|tenis de mesa/i, { f: 'pingpong', w: 2.74, dp: 1.53, c: 1.5, n: function (q) { return Math.min(q, 4); }, tag: 'Mesa de ping pong' }],
    [/suspensi[oó]n/i, { f: 'accesorio', w: 0.6, dp: 0.6, c: 0.3, n: function () { return 1; }, tag: 'Bandas de suspensión' }]
  ];
  // Lo chico (pelotas, conos, bandas, sogas, pecheras…) va en estanterías de accesorios: una cada 3 productos.
  function regla(it) {
    for (var i = 0; i < REGLAS.length; i++) if (REGLAS[i][0].test(it.p)) return REGLAS[i][1];
    return { acc: true };
  }

  function piezas(kit) {
    var out = [], acc = [], tieneMancuernas = kit.some(function (it) { return /mancuerna/i.test(it.p) && !/mancuernero/i.test(it.p); });
    kit.forEach(function (it) {
      var r = regla(it);
      if (r.skip) { if (!tieneMancuernas) out.push({ f: 'mancuernero', w: 1.6, dp: 0.6, c: 0.8, tag: 'Mancuernero', item: it.p }); return; }
      if (r.acc) { acc.push(it.p); return; }
      var n = Math.max(1, r.n(it.q || 1, it));
      for (var k = 0; k < n; k++) out.push({ f: r.f, w: r.w, dp: r.dp, c: r.c, tag: r.tag, item: it.p });
    });
    for (var j = 0; j < acc.length; j += 3) out.push({ f: 'estante', w: 1.8, dp: 0.5, c: 0.6, tag: 'Estantería de accesorios', item: acc.slice(j, j + 3).join(', ') });
    return out.slice(0, 120);
  }

  // ---------- Acomodo automático: lo que se guarda va contra las paredes, el resto en filas con pasillo ----------
  var PARED = { estante: 1, rusas: 1, mancuernero: 1, discos: 1, barras: 1, colchonetas: 1, steps: 1, cajones: 1, pilates: 1, accesorio: 1 };
  function acomodar(ps, L, A) {
    var pared = ps.filter(function (p) { return PARED[p.f]; }), centro = ps.filter(function (p) { return !PARED[p.f]; });
    var m = 0.15, x = m, fuera = 0;
    // Pared del fondo (z = 0) y después pared izquierda (x = 0).
    var lado = 0, z = m;
    pared.forEach(function (p) {
      if (lado === 0) {
        if (x + p.w > L - m) { lado = 1; z = 1.0; }
        else { p.x = x + p.w / 2; p.z = m + p.dp / 2; p.rot = 0; x += p.w + 0.15; return; }
      }
      if (lado === 1) {
        if (z + p.w > A - m) { p.fuera = true; fuera++; return; }
        p.x = m + p.dp / 2; p.z = z + p.w / 2; p.rot = Math.PI / 2; z += p.w + 0.15;
      }
    });
    // Filas en el resto del espacio, dejando 1 m de pasillo contra las paredes ocupadas.
    var x0 = (pared.some(function (p) { return p.rot; }) ? 1.6 : 0.8), z0 = (pared.length ? 1.5 : 0.8);
    var cx = x0, cz = z0, fila = 0;
    centro.sort(function (a, b) { return b.w * b.dp - a.w * a.dp; });
    centro.forEach(function (p) {
      var fw = p.w + p.c * 2, fd = p.dp + p.c * 2;
      if (cx + fw > L - 0.3) { cx = x0; cz += fila; fila = 0; }
      if (cz + fd > A - 0.3) { p.fuera = true; fuera++; return; }
      p.x = cx + fw / 2; p.z = cz + fd / 2; p.rot = 0;
      cx += fw; fila = Math.max(fila, fd);
    });
    // Lo que no entra queda afuera del ambiente, marcado en rojo.
    var ox = 0;
    ps.forEach(function (p) { if (p.fuera) { p.x = ox + p.w / 2; p.z = A + 1.5 + p.dp / 2; p.rot = 0; ox += p.w + 0.3; } });
    return fuera;
  }

  // ---------- Interfaz ----------
  function medidas() {
    var t = (last && last.tipo) || 'gimnasio', base = user[t] || SALA[t] || [10, 8];
    return { L: base[0], A: base[1], tipo: t };
  }
  function syncInputs() {
    var m = medidas();
    $('e3d-largo').value = m.L; $('e3d-ancho').value = m.A;
  }
  function stats(ps, fuera, L, A) {
    var dentro = ps.filter(function (p) { return !p.fuera; });
    var uso = dentro.reduce(function (s, p) { return s + (p.w + p.c * 2) * (p.dp + p.c * 2); }, 0), tot = L * A;
    var pct = Math.min(100, Math.round(uso / tot * 100));
    var h = '<div class="e3d-kpi"><b>' + (Math.round(tot * 10) / 10).toString().replace('.', ',') + ' m²</b><span>superficie</span></div>'
      + '<div class="e3d-kpi"><b>' + pct + '%</b><span>ocupado con zona de uso</span></div>'
      + '<div class="e3d-kpi"><b>' + dentro.length + '</b><span>piezas ubicadas</span></div>';
    $('e3d-stats').innerHTML = h;
    var a = $('e3d-alerta');
    if (fuera) { a.className = 'alert'; a.textContent = fuera + (fuera === 1 ? ' pieza no entra' : ' piezas no entran') + ' en ' + L + ' × ' + A + ' m: quedaron afuera, en rojo. Agrandá el ambiente o quitá algo de la lista.'; a.hidden = false; }
    else if (pct > 80) { a.className = 'alert'; a.textContent = 'Entra todo, pero queda justo: más del 80% del piso está ocupado. Conviene dejar más lugar para circular.'; a.hidden = false; }
    else { a.className = 'alert ok'; a.textContent = 'Entra todo y queda ' + (100 - pct) + '% del piso libre para circular y entrenar.'; a.hidden = false; }
  }

  function dibujar() {
    if (!last) return;
    var m = medidas(), ps = piezas(last.kit || []), fuera = acomodar(ps, m.L, m.A);
    stats(ps, fuera, m.L, m.A);
    if (three) three.escena(ps, m.L, m.A);
  }

  w.addEventListener('nf-kit', function (ev) {
    var prev = last && last.tipo;
    last = ev.detail;
    if (prev !== last.tipo) syncInputs();
    dibujar();
  });
  ['e3d-largo', 'e3d-ancho'].forEach(function (id) {
    $(id).addEventListener('change', function () {
      var L = Math.min(60, Math.max(2, parseFloat(String($('e3d-largo').value).replace(',', '.')) || 2));
      var A = Math.min(40, Math.max(2, parseFloat(String($('e3d-ancho').value).replace(',', '.')) || 2));
      user[medidas().tipo] = [L, A]; syncInputs(); dibujar();
    });
  });
  $('e3d-pedir').addEventListener('click', function () { var b = $('pedir'); if (b) b.click(); });

  // ---------- Motor 3D (se carga al acercarse) ----------
  function cargar() {
    if (three || loading) return;
    loading = true;
    $('e3d-cargando').hidden = false;
    Promise.all([import('./vendor/three/three.module.min.js'), import('./vendor/three/OrbitControls.js')]).then(function (mods) {
      three = motor(mods[0], mods[1].OrbitControls);
      $('e3d-cargando').hidden = true;
      dibujar();
    }).catch(function () {
      $('e3d-cargando').textContent = 'No pudimos cargar la vista 3D en este navegador. La lista y el cálculo de espacio siguen funcionando.';
    });
  }
  if ('IntersectionObserver' in w) {
    new IntersectionObserver(function (es, o) { if (es.some(function (e) { return e.isIntersecting; })) { o.disconnect(); cargar(); } }, { rootMargin: '400px' }).observe(box);
  } else cargar();

  function motor(T, Orbit) {
    var stage = $('e3d-stage'), canvas = $('e3d-canvas');
    var r = new T.WebGLRenderer({ canvas: canvas, antialias: true, preserveDrawingBuffer: true });
    r.setPixelRatio(Math.min(2, w.devicePixelRatio || 1));
    r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
    var sc = new T.Scene(); sc.background = new T.Color(0xF4F1EA);
    var cam = new T.PerspectiveCamera(45, 1, 0.1, 400);
    var ctl = new Orbit(cam, canvas); ctl.enableDamping = true; ctl.maxPolarAngle = Math.PI / 2.05; ctl.minDistance = 2;
    sc.add(new T.HemisphereLight(0xffffff, 0xd9d3c6, 1.1));
    var sol = new T.DirectionalLight(0xffffff, 1.6); sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048); sc.add(sol); sc.add(sol.target);
    var room = new T.Group(), cosas = new T.Group(); sc.add(room); sc.add(cosas);

    var C = { negro: 0x10171F, gris: 0x3A4450, metal: 0x9AA3AC, lima: 0xA5CC21, crema: 0xEDE7DA, madera: 0xC89B63, rojo: 0xD9483B, azul: 0x2F6FB0, goma: 0x23282E };
    var mats = {};
    function mat(c, o) { var k = c + '-' + (o || 1); if (!mats[k]) mats[k] = new T.MeshStandardMaterial({ color: c, roughness: 0.7, metalness: c === C.metal ? 0.6 : 0.05, transparent: o < 1, opacity: o || 1 }); return mats[k]; }
    function caja(g, w_, h, d_, x, y, z, c) { var m = new T.Mesh(new T.BoxGeometry(w_, h, d_), mat(c)); m.position.set(x, y + h / 2, z); m.castShadow = m.receiveShadow = true; g.add(m); return m; }
    function cil(g, rad, h, x, y, z, c, eje) { var m = new T.Mesh(new T.CylinderGeometry(rad, rad, h, 20), mat(c)); m.position.set(x, y, z); if (eje === 'x') m.rotation.z = Math.PI / 2; if (eje === 'z') m.rotation.x = Math.PI / 2; m.castShadow = true; g.add(m); return m; }
    function esfera(g, rad, x, y, z, c) { var m = new T.Mesh(new T.SphereGeometry(rad, 18, 14), mat(c)); m.position.set(x, y + rad, z); m.castShadow = true; g.add(m); return m; }

    // Figuras genéricas a escala real (metros). Cada una se arma centrada en su huella.
    var FIG = {
      rack: function (g) { [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]].forEach(function (p) { caja(g, 0.07, 2.3, 0.07, p[0], 0, p[1], C.negro); }); caja(g, 1.27, 0.07, 0.07, 0, 2.23, -0.6, C.negro); caja(g, 1.27, 0.07, 0.07, 0, 2.23, 0.6, C.negro); caja(g, 0.07, 0.07, 1.27, -0.6, 2.23, 0, C.negro); caja(g, 0.07, 0.07, 1.27, 0.6, 2.23, 0, C.negro); cil(g, 0.016, 2.2, 0, 1.4, -0.66, C.metal, 'x'); [-0.95, 0.95].forEach(function (x) { cil(g, 0.22, 0.04, x, 1.4, -0.66, C.goma, 'x'); }); caja(g, 0.1, 0.08, 0.1, -0.6, 1.33, -0.68, C.lima); caja(g, 0.1, 0.08, 0.1, 0.6, 1.33, -0.68, C.lima); },
      banco: function (g) { caja(g, 0.06, 0.4, 0.06, 0, 0, -0.5, C.negro); caja(g, 0.06, 0.4, 0.06, 0, 0, 0.45, C.negro); caja(g, 0.5, 0.05, 0.05, 0, 0, -0.5, C.negro); caja(g, 0.5, 0.05, 0.05, 0, 0, 0.45, C.negro); caja(g, 0.28, 0.08, 0.55, 0, 0.42, 0.25, C.gris); var resp = caja(g, 0.28, 0.08, 0.7, 0, 0.42, -0.35, C.gris); resp.rotation.x = -0.35; resp.position.y += 0.12; caja(g, 0.3, 0.02, 0.5, 0, 0.5, 0.25, C.lima).visible = false; },
      barras: function (g) { caja(g, 0.5, 0.08, 0.5, 0, 0, 0, C.negro); for (var i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2; cil(g, 0.015, 2.2, Math.cos(a) * 0.15, 1.1, Math.sin(a) * 0.15, C.metal); } },
      discos: function (g) { caja(g, 0.6, 0.06, 0.6, 0, 0, 0, C.negro); cil(g, 0.03, 1.2, 0, 0.6, 0, C.negro); [0.3, 0.65, 1.0].forEach(function (y, i) { [-1, 1].forEach(function (s) { cil(g, 0.02, 0.25, s * 0.13, y, 0, C.negro, 'x'); cil(g, 0.225 - i * 0.04, 0.12, s * 0.2, y, 0, i === 0 ? C.goma : C.gris, 'x'); }); }); },
      mancuernero: function (g) { [-0.75, 0.75].forEach(function (x) { caja(g, 0.06, 0.8, 0.5, x, 0, 0, C.negro); }); caja(g, 1.56, 0.04, 0.22, 0, 0.42, -0.12, C.negro); caja(g, 1.56, 0.04, 0.22, 0, 0.72, 0.1, C.negro); for (var i = 0; i < 6; i++) { cil(g, 0.06, 0.28, -0.6 + i * 0.24, 0.5, -0.12, C.gris, 'z'); cil(g, 0.045, 0.24, -0.6 + i * 0.24, 0.8, 0.1, C.gris, 'z'); } },
      rusas: function (g) { [-0.58, 0.58].forEach(function (x) { caja(g, 0.05, 0.6, 0.45, x, 0, 0, C.negro); }); caja(g, 1.2, 0.04, 0.45, 0, 0.18, 0, C.negro); caja(g, 1.2, 0.04, 0.45, 0, 0.56, 0, C.negro); for (var i = 0; i < 6; i++) { esfera(g, 0.09 + (i % 3) * 0.012, -0.45 + i * 0.18, 0.22, 0, C.negro); esfera(g, 0.08, -0.45 + i * 0.18, 0.6, 0, i % 2 ? C.lima : C.negro); } },
      cajones: function (g) { caja(g, 0.75, 0.6, 0.6, 0, 0, 0, C.madera); caja(g, 0.75, 0.5, 0.6, 0, 0.6, 0, C.madera); caja(g, 0.75, 0.4, 0.6, 0, 1.1, 0, C.madera); },
      colchonetas: function (g) { for (var i = 0; i < 10; i++) caja(g, 1, 0.035, 0.5, 0, i * 0.036, 0, i % 2 ? C.azul : C.negro); },
      mat: function (g) { caja(g, 0.6, 0.008, 1.8, 0, 0, 0, C.lima); },
      steps: function (g) { for (var i = 0; i < 4; i++) caja(g, 0.9, 0.15, 0.35, 0, i * 0.15, 0, i % 2 ? C.gris : C.negro); },
      pilates: function (g) { [[-0.17, -0.17], [0.17, 0.17], [-0.17, 0.17], [0.17, -0.17]].forEach(function (p, i) { esfera(g, 0.16, p[0], 0, p[1], i % 2 ? C.lima : C.azul); }); },
      arco: function (g) { cil(g, 0.04, 2, -1.5, 1, 0, 0xffffff); cil(g, 0.04, 2, 1.5, 1, 0, 0xffffff); cil(g, 0.04, 3.04, 0, 2, 0, 0xffffff, 'x'); var red = new T.Mesh(new T.BoxGeometry(3, 2, 1.1), mat(0xffffff, 0.15)); red.position.set(0, 1, -0.55); g.add(red); },
      voley: function (g) { cil(g, 0.05, 2.43, -4.75, 1.215, 0, C.negro); cil(g, 0.05, 2.43, 4.75, 1.215, 0, C.negro); var red = new T.Mesh(new T.BoxGeometry(9.5, 1, 0.02), mat(0xffffff, 0.35)); red.position.set(0, 1.93, 0); g.add(red); },
      basquet: function (g) { caja(g, 1, 0.2, 1.4, 0, 0, 0.4, C.negro); cil(g, 0.08, 3, 0, 1.6, 0.4, C.negro); caja(g, 1.8, 1.05, 0.05, 0, 2.9, -0.7, 0xffffff); var aro = new T.Mesh(new T.TorusGeometry(0.23, 0.02, 8, 24), mat(0xE8742A)); aro.rotation.x = Math.PI / 2; aro.position.set(0, 3.05, -0.98); g.add(aro); },
      pingpong: function (g) { caja(g, 2.74, 0.03, 1.525, 0, 0.73, 0, 0x1F5D3A); [[-1.2, -0.6], [1.2, -0.6], [-1.2, 0.6], [1.2, 0.6]].forEach(function (p) { caja(g, 0.06, 0.73, 0.06, p[0], 0, p[1], C.negro); }); caja(g, 0.02, 0.15, 1.7, 0, 0.76, 0, 0xffffff); },
      estante: function (g) { [-0.88, 0.88].forEach(function (x) { caja(g, 0.04, 1.8, 0.45, x, 0, 0, C.negro); }); [0.05, 0.6, 1.15, 1.7].forEach(function (y) { caja(g, 1.76, 0.03, 0.45, 0, y, 0, C.negro); }); [[0.08, C.lima], [0.63, C.azul], [1.18, C.rojo]].forEach(function (f) { for (var i = 0; i < 4; i++) caja(g, 0.32, 0.3, 0.35, -0.6 + i * 0.4, f[0], 0, f[1]); }); },
      accesorio: function (g) { caja(g, 0.5, 0.5, 0.5, 0, 0, 0, C.gris); }
    };

    var piezasMesh = [], sel = null;
    function escena(ps, L, A) {
      while (room.children.length) room.remove(room.children[0]);
      while (cosas.children.length) cosas.remove(cosas.children[0]);
      piezasMesh = []; sel = null; panel();
      var piso = new T.Mesh(new T.PlaneGeometry(L, A), new T.MeshStandardMaterial({ color: 0xE3DCCD, roughness: 0.95 }));
      piso.rotation.x = -Math.PI / 2; piso.position.set(L / 2, 0, A / 2); piso.receiveShadow = true; piso.name = 'piso'; room.add(piso);
      var grid = new T.GridHelper(Math.max(L, A), Math.max(L, A), 0xC9C1AF, 0xD6CFBF); grid.position.set(Math.max(L, A) / 2, 0.002, Math.max(L, A) / 2);
      grid.material.clippingPlanes = []; room.add(grid); grid.scale.set(1, 1, 1);
      // Recorta la grilla al ambiente escalándola por eje.
      grid.scale.set(L / Math.max(L, A), 1, A / Math.max(L, A)); grid.position.set(L / 2, 0.002, A / 2);
      var alto = 2.8, pm = mat(0xF7F4EE, 0.55);
      [[L / 2, 0, L, 0.08], [0, A / 2, 0.08, A]].forEach(function (p) { var m = new T.Mesh(new T.BoxGeometry(p[2], alto, p[3]), pm); m.position.set(p[0], alto / 2, p[1]); m.receiveShadow = true; room.add(m); });
      [[L / 2, A, L, 0.05], [L, A / 2, 0.05, A]].forEach(function (p) { var m = new T.Mesh(new T.BoxGeometry(p[2], 0.12, p[3]), mat(0xCFC7B6)); m.position.set(p[0], 0.06, p[1]); room.add(m); });
      ps.forEach(function (p) {
        var g = new T.Group(); (FIG[p.f] || FIG.accesorio)(g);
        if (p.fuera) g.traverse(function (o) { if (o.isMesh) { o.material = mat(C.rojo, 0.75); } });
        g.position.set(p.x, 0, p.z); g.rotation.y = p.rot || 0; g.userData = p; cosas.add(g); piezasMesh.push(g);
      });
      sol.position.set(L * 0.2, Math.max(L, A) * 1.2, A * 1.4); sol.target.position.set(L / 2, 0, A / 2);
      var s = Math.max(L, A); sol.shadow.camera.left = -s; sol.shadow.camera.right = s; sol.shadow.camera.top = s; sol.shadow.camera.bottom = -s; sol.shadow.camera.far = s * 4; sol.shadow.camera.updateProjectionMatrix();
      medidasRoom = { L: L, A: A };
      ctl.target.set(L / 2, 0, A / 2); vista(vistaActual);
    }
    var medidasRoom = { L: 10, A: 8 }, vistaActual = '3d';
    function vista(v) {
      vistaActual = v; var L = medidasRoom.L || 10, A = medidasRoom.A || 8, s = Math.max(L, A);
      // Encuadra el ambiente completo según la forma del recuadro (en el celular es más alto que ancho).
      var R = Math.sqrt(L * L + A * A + 7.84) / 2, vf = cam.fov * Math.PI / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * cam.aspect);
      var dist = R / Math.sin(Math.min(vf, hf) / 2) * (v === 'planta' ? 0.9 : 0.95);
      var dir = v === 'planta' ? new T.Vector3(0, 1, 0.0001) : new T.Vector3(0.5, 0.78, 1.05).normalize();
      cam.position.set(L / 2 + dir.x * dist, 0.6 + dir.y * dist, A / 2 + dir.z * dist);
      ctl.maxDistance = dist * 2.2; ctl.target.set(L / 2, 0.6, A / 2); ctl.update();
      [].forEach.call(d.querySelectorAll('[data-e3d-vista]'), function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-e3d-vista') === v); });
    }
    function tam() { var wd = stage.clientWidth || 1, h = stage.clientHeight || 1; r.setSize(wd, h, false); cam.aspect = wd / h; cam.updateProjectionMatrix(); }
    w.addEventListener('resize', tam); tam();
    if (w.ResizeObserver) new ResizeObserver(function () { var a = cam.aspect; tam(); if (Math.abs(a - cam.aspect) > 0.01) vista(vistaActual); }).observe(stage);
    (function loop() { ctl.update(); r.render(sc, cam); w.requestAnimationFrame(loop); })();

    // Seleccionar, arrastrar y girar piezas.
    var ray = new T.Raycaster(), ptr = new T.Vector2(), plano = new T.Plane(new T.Vector3(0, 1, 0), 0), hit = new T.Vector3(), drag = null, off = new T.Vector3();
    function pick(ev) { var b = canvas.getBoundingClientRect(); ptr.x = (ev.clientX - b.left) / b.width * 2 - 1; ptr.y = -(ev.clientY - b.top) / b.height * 2 + 1; ray.setFromCamera(ptr, cam); }
    function raiz(o) { while (o && o.parent !== cosas) o = o.parent; return o; }
    function marcar(g, on) { if (!g) return; g.traverse(function (o) { if (o.isMesh && !g.userData.fuera) { if (on) { o.userData.m0 = o.material; o.material = o.material.clone(); o.material.emissive = new T.Color(C.lima); o.material.emissiveIntensity = 0.35; } else if (o.userData.m0) { o.material = o.userData.m0; } } }); }
    function panel() {
      var p = $('e3d-sel');
      if (!sel) { p.hidden = true; return; }
      var u = sel.userData;
      p.hidden = false;
      $('e3d-sel-t').textContent = u.tag + (u.fuera ? ' (no entra)' : '');
      $('e3d-sel-d').textContent = u.item + ' · ' + String(u.w).replace('.', ',') + ' × ' + String(u.dp).replace('.', ',') + ' m';
    }
    canvas.addEventListener('pointerdown', function (ev) {
      pick(ev);
      var hs = ray.intersectObjects(cosas.children, true);
      var g = hs.length ? raiz(hs[0].object) : null;
      if (sel !== g) { marcar(sel, false); sel = g; marcar(sel, true); panel(); }
      if (g) { drag = g; ctl.enabled = false; canvas.setPointerCapture(ev.pointerId); if (ray.ray.intersectPlane(plano, hit)) off.set(g.position.x - hit.x, 0, g.position.z - hit.z); }
    });
    canvas.addEventListener('pointermove', function (ev) {
      if (!drag) return; pick(ev);
      if (ray.ray.intersectPlane(plano, hit)) {
        var u = drag.userData, L = medidasRoom.L, A = medidasRoom.A;
        var x = hit.x + off.x, z = hit.z + off.z;
        drag.position.x = Math.max(-2, Math.min(L + 2, x)); drag.position.z = Math.max(-2, Math.min(A + 4, z));
        u.x = drag.position.x; u.z = drag.position.z;
      }
    });
    function soltar() { drag = null; ctl.enabled = true; }
    canvas.addEventListener('pointerup', soltar); canvas.addEventListener('pointercancel', soltar);
    $('e3d-girar').addEventListener('click', function () { if (sel) { sel.rotation.y += Math.PI / 2; sel.userData.rot = sel.rotation.y; } });
    [].forEach.call(d.querySelectorAll('[data-e3d-vista]'), function (b) { b.addEventListener('click', function () { vista(b.getAttribute('data-e3d-vista')); }); });
    $('e3d-reset').addEventListener('click', function () { dibujar(); });
    return { escena: escena };
  }
})(window, document);

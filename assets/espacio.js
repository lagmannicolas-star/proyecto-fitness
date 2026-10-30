/* Armá tu espacio: arma una lista sugerida según el tipo de espacio, el uso, las personas y el nivel.
   La lista se edita y se envía como solicitud de ofertas (solicitud.html lee nf-sol-prefill). */
(function (w, d) {
  'use strict';
  var MAX = 25;
  var C = Math.ceil;
  var r10 = function (n) { return Math.max(10, C(n / 10) * 10); };

  // Cada regla devuelve [producto, cantidad, detalle]. Si un producto aparece en dos usos se toma la cantidad mayor.
  var TIPOS = {
    gimnasio: {
      n: 'Gimnasio', personas: ['Personas entrenando al mismo tiempo', 20],
      usosT: '¿Qué tipo de entrenamiento?', def: ['musculacion', 'funcional'],
      usos: {
        musculacion: ['Musculación', function (n, full) {
          var barras = C(n / 8), l = [
            ['Mancuernas (juego de pares)', n <= 15 ? 1 : 2, 'De 2,5 a 25 kg'],
            ['Mancuernero', n <= 15 ? 1 : 2, 'Para el juego de mancuernas'],
            ['Banco regulable', C(n / 5), ''],
            ['Barra olímpica', barras, '2,20 m, 20 kg'],
            ['Discos olímpicos', Math.max(100, r10(n * 10)), 'Kilos en total, de 2,5 a 20 kg'],
            ['Rack o jaula de sentadillas', C(n / 12), '']];
          if (full) l.push(['Topes para barra (pares)', barras, ''], ['Barra curva', 1, ''], ['Soporte para discos', C(n / 15), '']);
          return l;
        }],
        funcional: ['Funcional', function (n, full) {
          var l = [
            ['Pesas rusas', n, 'Combinadas de 4 a 16 kg'],
            ['Cajones de salto', C(n / 3), ''],
            ['Colchonetas', n, '1 × 0,50 m'],
            ['Bandas elásticas', n, 'Distintas resistencias'],
            ['Sogas para saltar', n, ''],
            ['Corebags o medicine balls', C(n / 2), 'De 5 a 15 kg'],
            ['Escaleras de coordinación', C(n / 6), ''],
            ['Conos', r10(n), '']];
          if (full) l.push(['Bandas de suspensión', C(n / 2), ''], ['Discos bumper', Math.max(60, r10(n * 6)), 'Kilos en total']);
          return l;
        }],
        crossfit: ['CrossFit', function (n, full) {
          var barras = C(n / 2), l = [
            ['Rig de CrossFit', C(n / 10), 'Estructura con barras de dominadas y soportes para barra'],
            ['Barra olímpica', barras, '20 kg (hombre) y 15 kg (mujer)'],
            ['Discos bumper', Math.max(100, r10(n * 15)), 'Kilos en total, de 5 a 25 kg'],
            ['Topes para barra (pares)', barras, ''],
            ['Pesas rusas', C(n / 2), 'Combinadas de 8 a 24 kg'],
            ['Cajones de salto', C(n / 2), 'De 50, 60 y 75 cm'],
            ['Wall balls', C(n / 2), 'De 6 a 9 kg'],
            ['Sogas para saltar', n, 'Speed rope'],
            ['Remo ergómetro', C(n / 8), ''],
            ['Air bike', C(n / 8), '']];
          if (full) l.push(['Anillas de gimnasia (pares)', C(n / 5), ''], ['Mancuernas hexagonales (pares)', C(n / 4), 'De 10 a 25 kg'], ['Paralelas bajas (paralettes)', C(n / 5), ''], ['Piso de caucho para box', r10(n * 4), 'm² · placas de 15 a 20 mm']);
          return l;
        }],
        grupales: ['Clases grupales', function (n, full) {
          var l = [
            ['Colchonetas', n, '1 × 0,50 m'],
            ['Steps', n, ''],
            ['Mancuernas de PVC (pares)', n, 'De 1 a 3 kg'],
            ['Bandas elásticas', n, '']];
          if (full) l.push(['Sets de body pump', n, 'Barra + discos'], ['Pelotas de pilates', n, '65 cm'], ['Tobilleras (pares)', n, '1 a 2 kg']);
          return l;
        }],
        cesped: ['Pista de césped (trineo)', function (n, full) {
          var l = [
            ['Césped sintético para pista', 30, 'm² · pista de 15 × 2 m para trineo y arrastres. Ajustá a tu medida'],
            ['Trineo de arrastre', C(n / 10), ''],
            ['Arnés o cinta de arrastre', C(n / 10), '']];
          if (full) l.push(['Colocación del césped', 1, 'Pegado al piso, con cinta de unión']);
          return l;
        }]
      }
    },
    club: {
      n: 'Club', personas: ['Jugadores por entrenamiento', 20],
      usosT: '¿Qué disciplinas?', def: ['futbol'],
      base: function (n, full) {
        var l = [
          ['Conos', r10(n), 'Tipo tortuga, para circuitos'],
          ['Escaleras de coordinación', C(n / 8), ''],
          ['Vallas de salto', C(n / 3), 'Regulables'],
          ['Aros de coordinación', r10(n / 2), ''],
          ['Pecheras', n, 'En 2 colores']];
        if (full) l.push(['Bandas elásticas', n, ''], ['Cronómetro', 1, ''], ['Bolso portapelotas', 1, '']);
        return l;
      },
      usos: {
        futbol: ['Fútbol', function (n, full) { var l = [['Pelotas de fútbol', C(n / 2), 'Número 5']]; if (full) l.push(['Arcos de entrenamiento', 2, 'Portátiles']); return l; }],
        hockey: ['Hockey', function (n, full) { var l = [['Bochas de hockey', n, '']]; if (full) l.push(['Palos de hockey', C(n / 4), 'Para préstamo']); return l; }],
        basquet: ['Básquet', function (n) { return [['Pelotas de básquet', C(n / 2), 'Número 7']]; }],
        voley: ['Vóley', function (n) { return [['Pelotas de vóley', C(n / 2), ''], ['Red de vóley', 1, '']]; }],
        atletismo: ['Atletismo', function (n, full) { var l = [['Vallas de atletismo', C(n / 2), ''], ['Cronómetro', 1, '']]; if (full) l.push(['Medicine balls', C(n / 3), '2 a 5 kg']); return l; }],
        natacion: ['Natación / pileta', function (n, full) {
          var l = [
            ['Tablas de natación', n, ''],
            ['Pullboys', n, ''],
            ['Sumergibles (sets)', C(n / 5), 'Para juegos en el fondo'],
            ['Gorras de natación', n, '']];
          if (full) l.push(['Andariveles', 1, 'Indicar largo de la pileta y cantidad de carriles'], ['Manoplas (pares)', n, ''], ['Flota flota', n, ''], ['Cronómetro', 1, '']);
          return l;
        }],
        // Césped sintético: las cantidades salen de la medida típica de cada cancha y se ajustan en la lista.
        canchaFutbol: ['Cancha de fútbol sintético', function (n, full) {
          var l = [
            ['Césped sintético para cancha', 600, 'm² · fútbol 5, cancha de unos 30 × 18 m con bordes. Ajustá a tu medida'],
            ['Relleno de caucho y arena', 1, 'Para todo el césped: el proveedor calcula los kilos'],
            ['Arcos de fútbol 5', 2, '3 × 2 m'],
            ['Redes para arcos', 2, '']];
          if (full) l.push(['Red perimetral', 1, 'Indicar los metros de perímetro y la altura'], ['Colocación del césped', 1, 'Instalación con base y demarcación']);
          return l;
        }],
        canchaHockey: ['Cancha de hockey sintético', function (n, full) {
          var l = [
            ['Césped sintético para hockey', 6000, 'm² · cancha de 91,4 × 55 m con márgenes. De agua o de arena: indicalo. Ajustá a tu medida'],
            ['Arcos de hockey', 2, 'Reglamentarios'],
            ['Redes para arcos', 2, '']];
          if (full) l.push(['Relleno de arena', 1, 'Si el césped es de arena: el proveedor calcula los kilos'], ['Colocación del césped', 1, 'Instalación con base y demarcación']);
          return l;
        }],
        canchaPadel: ['Césped para pádel', function (n, full) {
          var l = [
            ['Césped sintético para pádel', 200, 'm² · una cancha de 20 × 10 m'],
            ['Arena sílice para relleno', 1, 'Para todo el césped: el proveedor calcula los kilos']];
          if (full) l.push(['Red de pádel', 1, ''], ['Colocación del césped', 1, 'Instalación y demarcación']);
          return l;
        }]
      },
      // Si solo se eligen estas disciplinas no se suma el material de cancha (conos, vallas, pecheras).
      sinBase: ['natacion', 'canchaFutbol', 'canchaHockey', 'canchaPadel']
    },
    colegio: {
      n: 'Colegio', personas: ['Alumnos por clase', 25],
      usosT: '¿Qué niveles?', def: ['primaria'],
      base: function (n, full) {
        var l = [
          ['Colchonetas', C(n / 2), '1 × 0,50 m'],
          ['Aros', n, ''],
          ['Conos', r10(n), ''],
          ['Sogas para saltar', n, ''],
          ['Pecheras', n, 'En 2 colores'],
          ['Pelotas multideporte', C(n / 2), '']];
        if (full) l.push(['Vallas de salto', C(n / 3), 'Regulables'], ['Cronómetro', 2, ''], ['Bolso portapelotas', 2, '']);
        return l;
      },
      usos: {
        inicial: ['Inicial', function (n) { return [['Kit de psicomotricidad', 1, 'Bloques, túnel y aros'], ['Pelotas blandas', n, '']]; }],
        primaria: ['Primaria', function (n) { return [['Escaleras de coordinación', 2, ''], ['Pelotas de fútbol', C(n / 3), 'Número 4']]; }],
        secundaria: ['Secundaria', function (n) { return [['Pelotas de vóley', C(n / 3), ''], ['Red de vóley', 1, ''], ['Pelotas de básquet', C(n / 3), '']]; }]
      }
    },
    casa: {
      n: 'Mi casa', personas: ['Personas que van a entrenar', 1],
      usosT: '¿Qué te gustaría hacer?', def: ['fuerza'],
      usos: {
        fuerza: ['Fuerza', function (n, full) {
          var l = [['Mancuernas (juego de pares)', 1, 'Regulables o de 2,5 a 10 kg'], ['Pesa rusa', 1, '8 a 12 kg'], ['Colchonetas', n, ''], ['Bandas elásticas (set)', 1, '']];
          if (full) l.push(['Banco regulable', 1, ''], ['Barra con discos', 1, 'Kit hogareño']);
          return l;
        }],
        funcional: ['Funcional y cardio', function (n, full) {
          var l = [['Pesa rusa', 1, '8 a 12 kg'], ['Sogas para saltar', n, ''], ['Colchonetas', n, ''], ['Bandas elásticas (set)', 1, '']];
          if (full) l.push(['Banda de suspensión', 1, ''], ['Step', 1, '']);
          return l;
        }],
        yoga: ['Yoga y pilates', function (n, full) {
          var l = [['Mats de yoga', n, ''], ['Pelotas de pilates', n, '65 cm'], ['Bandas elásticas (set)', 1, '']];
          if (full) l.push(['Aros de pilates', n, ''], ['Bloques de yoga', n * 2, '']);
          return l;
        }]
      }
    }
  };

  var $ = function (id) { return d.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var form = $('cfg');
  if (!form) return;

  var q = new URLSearchParams(w.location.search);
  var alias = { gimnasios: 'gimnasio', clubes: 'club', colegios: 'colegio', hogar: 'casa' };
  var st = { tipo: TIPOS[q.get('tipo')] ? q.get('tipo') : (alias[q.get('tipo')] || 'gimnasio'), usos: {}, personas: {}, nivel: 'basico', kit: [], extras: [] };
  Object.keys(TIPOS).forEach(function (k) { st.usos[k] = TIPOS[k].def.slice(); st.personas[k] = null; }); // la cantidad la escribe el cliente

  $('tipos').innerHTML = Object.keys(TIPOS).map(function (k) {
    return '<label class="opt"><input type="radio" name="tipo" value="' + k + '"' + (k === st.tipo ? ' checked' : '') + '><span><b>' + esc(TIPOS[k].n) + '</b></span></label>';
  }).join('');

  function renderDetalle() {
    var T = TIPOS[st.tipo], p = T.personas;
    $('detalle-tipo').innerHTML = '<div role="group" aria-labelledby="usos-t"><span class="lbl" id="usos-t">' + esc(T.usosT) + '</span><div class="chips">'
      + Object.keys(T.usos).map(function (k) {
        return '<label class="chip"><input type="checkbox" name="uso" value="' + k + '"' + (st.usos[st.tipo].indexOf(k) >= 0 ? ' checked' : '') + '> ' + esc(T.usos[k][0]) + '</label>';
      }).join('') + '</div></div>';
    var r = $('personas');
    $('personas-lbl').textContent = p[0];
    r.value = st.personas[st.tipo] || ''; r.placeholder = 'Ej.: ' + p[1];
  }

  function build() {
    var T = TIPOS[st.tipo], n = st.personas[st.tipo], full = st.nivel === 'completo', map = {}, order = [];
    var add = function (row) {
      var k = row[0];
      if (!map[k]) { map[k] = { p: row[0], q: row[1], d: row[2] }; order.push(k); }
      else if (row[1] > map[k].q) { map[k].q = row[1]; if (row[2]) map[k].d = row[2]; }
    };
    if (!n) { st.kit = st.extras.slice(); render(); return; } // sin cantidad no hay lista sugerida
    var elegidos = st.usos[st.tipo], sinBase = T.sinBase || [];
    var soloSinBase = elegidos.length > 0 && elegidos.every(function (u) { return sinBase.indexOf(u) >= 0; });
    if (T.base && !soloSinBase) T.base(n, full).forEach(add);
    st.usos[st.tipo].forEach(function (u) { if (T.usos[u]) T.usos[u][1](n, full).forEach(add); });
    st.kit = order.map(function (k) { return map[k]; }).concat(st.extras);
    render();
  }

  function render() {
    var T = TIPOS[st.tipo], usos = st.usos[st.tipo].map(function (u) { return T.usos[u] && T.usos[u][0]; }).filter(Boolean);
    var n = st.personas[st.tipo];
    $('lista-resumen').textContent = T.n + (usos.length ? ' · ' + usos.join(', ') : '') + (n ? ' · ' + n + ' ' + (n === 1 ? 'persona' : 'personas') : '') + ' · ' + st.kit.length + ' productos';
    $('kit').innerHTML = st.kit.length ? st.kit.map(function (it, i) {
      return '<li class="kit-row"><div class="kit-name"><b>' + esc(it.p) + '</b>' + (it.d ? '<span class="muted small">' + esc(it.d) + '</span>' : '') + '</div>'
        + '<label class="kit-qty"><span class="sr">Cantidad de ' + esc(it.p) + '</span><input type="number" inputmode="numeric" min="1" max="999999" data-i="' + i + '" value="' + it.q + '"></label>'
        + '<button type="button" class="kit-x" data-x="' + i + '" aria-label="Quitar ' + esc(it.p) + '">×</button></li>';
    }).join('') : '<li class="muted">' + (n ? 'Elegí al menos una opción para ver la lista.' : 'Escribí cuántas personas para ver la lista sugerida.') + '</li>';
    $('extra-add').disabled = st.kit.length >= MAX;
    avisar3d();
  }
  // La vista 3D (espacio3d.js) se entera de cada cambio de la lista.
  function avisar3d() {
    try { w.dispatchEvent(new CustomEvent('nf-kit', { detail: { tipo: st.tipo, personas: st.personas[st.tipo], kit: st.kit.map(function (it) { return { p: it.p, q: it.q }; }) } })); } catch (e) { /* navegador sin CustomEvent */ }
  }

  form.addEventListener('change', function (ev) {
    var t = ev.target;
    if (t.name === 'tipo') { st.tipo = t.value; renderDetalle(); }
    else if (t.name === 'uso') st.usos[st.tipo] = [].slice.call(form.querySelectorAll('[name=uso]:checked')).map(function (x) { return x.value; });
    else if (t.name === 'nivel') st.nivel = t.value;
    build();
  });
  // El cliente escribe la cantidad, sin topes por tipo de espacio: con ese número se arma la lista.
  $('personas').addEventListener('input', function () {
    var v = parseInt(this.value, 10);
    st.personas[st.tipo] = v >= 1 ? Math.min(v, 9999) : null;
    build();
  });
  $('kit').addEventListener('input', function (ev) {
    var i = ev.target.getAttribute('data-i');
    if (i == null) return;
    var v = parseInt(ev.target.value, 10);
    if (v > 0) { st.kit[+i].q = v; avisar3d(); }
  });
  $('kit').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-x]');
    if (!b) return;
    var it = st.kit.splice(+b.getAttribute('data-x'), 1)[0];
    st.extras = st.extras.filter(function (e) { return e !== it; });
    render();
  });
  function addExtra() {
    var v = $('extra').value.trim();
    if (v.length < 2 || st.kit.length >= MAX) return;
    var it = { p: v.slice(0, 120), q: 1, d: '' };
    st.extras.push(it); st.kit.push(it);
    $('extra').value = '';
    render();
    var inputs = $('kit').querySelectorAll('input'); if (inputs.length) inputs[inputs.length - 1].focus();
  }
  $('extra-add').addEventListener('click', addExtra);
  $('extra').addEventListener('keydown', function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); addExtra(); } });

  $('pedir').addEventListener('click', function () {
    var err = $('kit-error');
    err.hidden = true;
    if (!st.personas[st.tipo]) { err.textContent = 'Escribí cuántas personas van a entrenar.'; err.hidden = false; $('personas').focus(); return; }
    var items = st.kit.filter(function (it) { return it.q > 0; }).slice(0, MAX).map(function (it) {
      return { producto: it.p, cantidad: String(Math.min(999999, Math.round(it.q))), detalle: it.d || '' };
    });
    if (!items.length) { err.textContent = 'La lista está vacía. Elegí una opción o agregá un producto.'; err.hidden = false; return; }
    var T = TIPOS[st.tipo];
    var tipoSol = { gimnasio: 'gimnasio', club: 'club', colegio: 'colegio', casa: 'particular' }[st.tipo];
    var resumen = 'Lista armada con "Armá tu espacio": ' + $('lista-resumen').textContent.replace(/ · \d+ productos$/, '') + ', nivel ' + (st.nivel === 'completo' ? 'completo' : 'esencial') + '.';
    try { w.sessionStorage.setItem('nf-sol-prefill', JSON.stringify({ items: items, detalles: resumen, tipo: tipoSol })); }
    catch (e) { err.textContent = 'Tu navegador no permite guardar la lista. Probá desde otro navegador o cargala a mano.'; err.hidden = false; return; }
    if (w.nfTrack) w.nfTrack('Lead', { name: 'arma tu espacio ' + T.n });
    w.location.href = 'solicitud.html?desde=espacio';
  });

  renderDetalle();
  build();
})(window, document);

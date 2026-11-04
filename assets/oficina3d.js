/* Oficina Nexo Fit en 3D. El edificio es fijo; lo que cambia sale de los datos reales: pantallas, luces, turnos y hora de Buenos Aires.
   Las personas son una representación. Todo lo estático se funde en una sola malla para que ande fluido también en celulares. */
var C = {
  lima: 0xA5CC21, ambar: 0xF4B73F, rojo: 0xFF6A5C, gris: 0x8996A3, tinta: 0x10171F,
  muro: 0x5C7167, muroCl: 0x6C8276, tope: 0x24312C, marco: 0x141B18, metal: 0x77838A, acero: 0x4A555B, negro: 0x101416,
  madera: 0x8A6242, maderaOsc: 0x4B3424, maderaCl: 0xB48B5E, tela: 0x34463E, blanco: 0xE8ECE4, goma: 0x1B2120, verde: 0x3F7D3A, verdeOsc: 0x2B5A33, maceta: 0xB9B3A4
};
var LUZ = { orden: C.lima, atencion: C.ambar, frenada: C.rojo, nada: C.gris };
var ANCHO = 32, FONDO = 22, TOTAL = 41;
var DEF = {
  direccion: { x: 0, z: 0, w: 9, d: 6.5, piso: 'madera', puerta: [6.6, 6.5], mural: [3, 1.05, 0.09, 3.3, 1.75], a: 0xA5CC21 },
  comercial: { x: 9, z: 0, w: 12, d: 6.5, piso: 'alfombra', puerta: [15, 6.5], mural: [13.6, 1.05, 0.09, 3.3, 1.75], a: 0xF4B73F },
  administracion: { x: 21, z: 0, w: 11, d: 6.5, piso: 'madera', puerta: [23.5, 6.5], mural: [26.4, 1.05, 0.09, 3.3, 1.75], a: 0x7FC99B },
  redes: { x: 0, z: 8.5, w: 7.5, d: 6, piso: 'alfombra', puerta: [3.8, 14.5], mural: [3.2, 0.62, 8.59, 2.6, 1.32], a: 0xE58FB5 },
  marketing: { x: 7.5, z: 8.5, w: 7.5, d: 6, piso: 'alfombra', puerta: [11.2, 14.5], mural: [11.2, 0.62, 8.59, 2.6, 1.32], a: 0xF08A4B },
  diseno: { x: 17, z: 8.5, w: 7.5, d: 6, piso: 'madera', puerta: [20.7, 14.5], mural: [19.3, 0.62, 8.59, 2.6, 1.32], a: 0xA48BE0 },
  investigacion: { x: 24.5, z: 8.5, w: 7.5, d: 6, piso: 'madera', puerta: [28.2, 14.5], mural: [27.6, 0.62, 8.59, 2.6, 1.32], a: 0x7FB8D9 },
  operaciones: { x: 21, z: 16.5, w: 11, d: 5.5, piso: 'goma', puerta: [24, 16.5], mural: [28.4, 0.62, 16.59, 2.6, 1.32], a: 0x6FD0C4 },
  jefe: { x: 32, z: 0, w: 9, d: 14, piso: 'madera', puerta: [32, 7.5], mural: [34.7, 1.05, 0.09, 3.6, 1.75], a: 0xA5CC21 }
};
var ROPA = [0xA5CC21, 0xE8ECE4, 0xF4B73F, 0x5E93B5, 0xC47BA6, 0x7D9A6C, 0x38474F, 0xD9734A];
var PIEL = [0xE8BE9B, 0xC68F66, 0x8D5A3C, 0xF0D2B6];
var PELO = [0x2A1D14, 0x4A3222, 0x15120F, 0x7A5A3A, 0x8E8E8E];
var COCINA = [16.4, 18.6];
var CORTO = { redes: 'Redes', diseno: 'Diseño', administracion: 'Admin', investigacion: 'Investig.' };

function suave(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
/* 0 de noche, 1 de día, según los minutos del día en Buenos Aires. */
export function luzDelDia(min) { return suave(360, 480, min) * (1 - suave(1110, 1230, min)); }

export function crear(THREE, Orbit, cont, opciones) {
  var quieto = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var chico = window.innerWidth < 760;
  var tactil = !!(window.matchMedia && matchMedia('(hover: none)').matches);
  var renderer = new THREE.WebGLRenderer({ antialias: !chico, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, chico ? 1.6 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false; // el edificio no se mueve: la sombra se recalcula solo cuando cambia la luz del día
  var escena = new THREE.Scene();
  var camara = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 240);
  camara.position.set(5.5, 44, 33);
  var cielo = new THREE.HemisphereLight(0xffffff, 0x2A3A30, 1.4);
  escena.add(cielo);
  var sol = new THREE.DirectionalLight(0xFFF3DE, 2);
  sol.position.set(-14, 34, 16);
  sol.castShadow = true;
  sol.shadow.mapSize.set(chico ? 1024 : 2048, chico ? 1024 : 2048);
  sol.shadow.bias = -0.0006;
  Object.assign(sol.shadow.camera, { left: -30, right: 30, top: 26, bottom: -26, near: 1, far: 100 });
  escena.add(sol);

  var mundo = new THREE.Group();
  mundo.position.set(-TOTAL / 2, 0, -FONDO / 2);
  escena.add(mundo);

  /* ---------- Fundido de piezas estáticas ---------- */
  var BASE = {
    caja: new THREE.BoxGeometry(1, 1, 1).toNonIndexed(), cil: new THREE.CylinderGeometry(0.5, 0.5, 1, 14).toNonIndexed(),
    cono: new THREE.ConeGeometry(0.5, 1, 9).toNonIndexed(), esf: new THREE.SphereGeometry(0.5, 12, 9).toNonIndexed(),
    toro: new THREE.TorusGeometry(0.5, 0.09, 8, 24).toNonIndexed(), plano: new THREE.PlaneGeometry(1, 1).toNonIndexed()
  };
  var nuevoLote = function () { return { pos: [], nor: [], col: [] }; };
  var lote = nuevoLote(), M = new THREE.Matrix4(), v3 = new THREE.Vector3(), n3 = new THREE.Vector3(), col = new THREE.Color(), nm = new THREE.Matrix3();
  function poner(geo, local, color) {
    var m = new THREE.Matrix4().multiplyMatrices(M, local), p = geo.attributes.position, n = geo.attributes.normal;
    nm.getNormalMatrix(m); col.setHex(color);
    for (var i = 0; i < p.count; i++) {
      v3.fromBufferAttribute(p, i).applyMatrix4(m); lote.pos.push(v3.x, v3.y, v3.z);
      n3.fromBufferAttribute(n, i).applyMatrix3(nm).normalize(); lote.nor.push(n3.x, n3.y, n3.z);
      lote.col.push(col.r, col.g, col.b);
    }
  }
  function matriz(x, y, z, sx, sy, sz, ry, rx, rz) {
    return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)), new THREE.Vector3(sx, sy, sz));
  }
  /* y es la base de la pieza: apilar muebles queda más simple. */
  function caja(w, h, d, x, y, z, color, ry) { poner(BASE.caja, matriz(x, y + h / 2, z, w, h, d, ry), color); }
  function cil(diam, h, x, y, z, color) { poner(BASE.cil, matriz(x, y + h / 2, z, diam, h, diam), color); }
  function acostado(diam, largo, x, y, z, color, ry) { poner(BASE.cil, matriz(x, y, z, diam, largo, diam, ry || 0, 0, Math.PI / 2), color); }
  function esf(diam, x, y, z, color, sy) { poner(BASE.esf, matriz(x, y, z, diam, diam * (sy || 1), diam), color); }
  function cono(diam, h, x, y, z, color) { poner(BASE.cono, matriz(x, y + h / 2, z, diam, h, diam), color); }
  function toro(diam, x, y, z, color, ry) { poner(BASE.toro, matriz(x, y, z, diam, diam, diam, ry || 0), color); }
  function en(x, z, rot, fn) {
    var antes = M.clone();
    M = M.clone().multiply(new THREE.Matrix4().makeTranslation(x, 0, z)).multiply(new THREE.Matrix4().makeRotationY(rot || 0));
    fn();
    M = antes;
  }
  function fundir(l, material, sombra) {
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(l.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(l.nor, 3));
    if (l.col.length) g.setAttribute('color', new THREE.Float32BufferAttribute(l.col, 3));
    var o = new THREE.Mesh(g, material);
    if (sombra) { o.castShadow = true; o.receiveShadow = true; }
    return o;
  }
  function conLote(fn) { var antes = lote, am = M; lote = nuevoLote(); M = new THREE.Matrix4(); fn(); var l = lote; lote = antes; M = am; return l; }
  var mCuerpos = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, metalness: 0.04 });

  /* ---------- Texturas hechas a mano ---------- */
  function lienzo(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function textura(c, repetir) {
    var t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    if (repetir) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }
  var semilla = 7;
  function azar() { semilla = (semilla * 16807) % 2147483647; return semilla / 2147483647; }
  function pisoMadera() {
    var c = lienzo(512, 512), g = c.getContext('2d');
    for (var y = 0; y < 8; y++) for (var x = -1; x < 4; x++) {
      var o = azar() * 26 - 13;
      g.fillStyle = 'rgb(' + (116 + o) + ',' + (82 + o * 0.8) + ',' + (55 + o * 0.6) + ')';
      var ax = x * 170 + (y % 2) * 85;
      g.fillRect(ax, y * 64, 170, 64);
      g.strokeStyle = 'rgba(40,24,14,.5)'; g.lineWidth = 2; g.strokeRect(ax, y * 64, 170, 64);
      g.strokeStyle = 'rgba(40,24,14,.12)'; g.lineWidth = 1;
      for (var v = 0; v < 4; v++) { g.beginPath(); var vy = y * 64 + 8 + azar() * 50; g.moveTo(ax, vy); g.bezierCurveTo(ax + 50, vy + 6, ax + 110, vy - 6, ax + 170, vy); g.stroke(); }
    }
    return textura(c, true);
  }
  function pisoAlfombra() {
    var c = lienzo(256, 256), g = c.getContext('2d');
    g.fillStyle = '#46595A'; g.fillRect(0, 0, 256, 256);
    for (var i = 0; i < 5000; i++) { g.fillStyle = 'rgba(' + (azar() > 0.5 ? '255,255,255' : '0,0,0') + ',.05)'; g.fillRect(azar() * 256, azar() * 256, 2, 2); }
    g.strokeStyle = 'rgba(0,0,0,.28)'; g.lineWidth = 2; g.strokeRect(0, 0, 256, 256);
    return textura(c, true);
  }
  function pisoGoma() {
    var c = lienzo(256, 256), g = c.getContext('2d');
    g.fillStyle = '#343E40'; g.fillRect(0, 0, 256, 256);
    for (var i = 0; i < 2400; i++) { g.fillStyle = ['#3C474A', '#2D3638', '#A5CC21'][azar() > 0.985 ? 2 : azar() > 0.5 ? 0 : 1]; g.fillRect(azar() * 256, azar() * 256, 2, 2); }
    return textura(c, true);
  }
  function pisoCalcareo() {
    var c = lienzo(256, 256), g = c.getContext('2d');
    g.fillStyle = '#596661'; g.fillRect(0, 0, 256, 256);
    for (var i = 0; i < 900; i++) { g.fillStyle = ['#6E7C76', '#47524E', '#7C8A82'][Math.floor(azar() * 3)]; g.beginPath(); g.arc(azar() * 256, azar() * 256, azar() * 3 + 1, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 2; g.strokeRect(0, 0, 256, 256);
    return textura(c, true);
  }
  var TEX = { madera: pisoMadera(), alfombra: pisoAlfombra(), goma: pisoGoma(), calcareo: pisoCalcareo() };
  var MP = {};
  Object.keys(TEX).forEach(function (k) { MP[k] = new THREE.MeshStandardMaterial({ map: TEX[k], roughness: k === 'madera' ? 0.62 : 0.92 }); });
  function piso(tipo, x, z, w, d, sala) {
    var escala = tipo === 'madera' ? 3.6 : 2;
    var g = new THREE.PlaneGeometry(w, d), uv = g.attributes.uv;
    for (var i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w + x) / escala, (uv.getY(i) * d + z) / escala);
    var o = new THREE.Mesh(g, MP[tipo]);
    o.rotation.x = -Math.PI / 2; o.position.set(x + w / 2, 0.01, z + d / 2); o.receiveShadow = true; o.userData.sala = sala || null;
    mundo.add(o);
    return o;
  }

  /* ---------- Muros, vidrios y ventanas ---------- */
  var mVidrio = new THREE.MeshStandardMaterial({ color: 0x9FD8C8, transparent: true, opacity: 0.16, roughness: 0.08, metalness: 0.1, depthWrite: false });
  var mVentana = new THREE.MeshBasicMaterial({ color: 0xBFE3F2, vertexColors: false });
  var loteVidrio = nuevoLote(), loteVentana = nuevoLote();
  function vidrio(x1, z1, x2, z2, y0, y1) {
    var horiz = z1 === z2, largo = horiz ? x2 - x1 : z2 - z1, antes = lote;
    lote = loteVidrio;
    caja(horiz ? largo : 0.04, y1 - y0, horiz ? 0.04 : largo, (x1 + x2) / 2, y0, (z1 + z2) / 2, 0xffffff);
    lote = antes;
    caja(horiz ? largo : 0.05, 0.05, horiz ? 0.05 : largo, (x1 + x2) / 2, y1, (z1 + z2) / 2, C.marco);
  }
  /* Tramo de muro con huecos de puerta. Si lleva vidrio, sube liviano y deja ver la sala de atrás. */
  function muroZ(z, x0, x1, puertas, alto, tapa) {
    var a = x0;
    puertas.concat([x1 + 0.65]).forEach(function (p) {
      var b = p - 0.65;
      if (b > a) {
        caja(b - a, alto, 0.14, (a + b) / 2, 0, z, C.muro);
        caja(b - a, 0.03, 0.15, (a + b) / 2, alto, z, C.tope);
        if (tapa) vidrio(a, z, b, z, alto + 0.03, tapa);
      }
      a = p + 0.65;
    });
    puertas.forEach(function (p) {
      if (!tapa && alto < 1.5) return;
      var y = tapa || alto;
      caja(0.08, y, 0.2, p - 0.65, 0, z, C.marco); caja(0.08, y, 0.2, p + 0.65, 0, z, C.marco); caja(1.38, 0.08, 0.2, p, y - 0.08, z, C.marco);
    });
  }
  function muroX(x, z0, z1, alto, tapa) {
    caja(0.14, alto, z1 - z0, x, 0, (z0 + z1) / 2, C.muro);
    caja(0.15, 0.03, z1 - z0, x, alto, (z0 + z1) / 2, C.tope);
    if (tapa) vidrio(x, z0, x, z1, alto + 0.03, tapa);
  }
  function ventanal(fijo, a0, a1, enZ) {
    for (var a = a0; a < a1 - 0.5; a += 2.6) {
      var ancho = Math.min(2.2, a1 - a), antes = lote;
      lote = loteVentana;
      if (enZ) caja(ancho, 1.2, 0.03, a + ancho / 2, 1.42, fijo, 0xffffff); else caja(0.03, 1.2, ancho, fijo, 1.42, a + ancho / 2, 0xffffff);
      lote = antes;
      if (enZ) { caja(ancho + 0.1, 0.06, 0.1, a + ancho / 2, 1.38, fijo + 0.02, C.marco); caja(ancho + 0.1, 0.06, 0.1, a + ancho / 2, 2.62, fijo + 0.02, C.marco); }
      else { caja(0.1, 0.06, ancho + 0.1, fijo + 0.02, 1.38, a + ancho / 2, C.marco); caja(0.1, 0.06, ancho + 0.1, fijo + 0.02, 2.62, a + ancho / 2, C.marco); }
    }
  }

  /* ---------- Muebles ---------- */
  function silla(x, z, rot, color) {
    en(x, z, rot, function () {
      caja(0.46, 0.08, 0.46, 0, 0.42, 0, color || C.negro);
      caja(0.46, 0.5, 0.07, 0, 0.52, 0.22, color || C.negro);
      cil(0.06, 0.34, 0, 0.08, 0, C.acero);
      caja(0.52, 0.04, 0.07, 0, 0.05, 0, C.acero, 0.6); caja(0.52, 0.04, 0.07, 0, 0.05, 0, C.acero, 2.1);
    });
  }
  function escritorio(x, z, sala, i, ancho, conPersona) {
    var w = ancho || 1.6;
    en(x, z, 0, function () {
      caja(w, 0.07, 0.78, 0, 0.71, 0, C.maderaCl);
      caja(0.06, 0.71, 0.66, -w / 2 + 0.06, 0, 0, C.acero); caja(0.06, 0.71, 0.66, w / 2 - 0.06, 0, 0, C.acero);
      caja(0.34, 0.5, 0.56, w / 2 - 0.26, 0.1, 0.02, C.tela);
      caja(0.62, 0.015, 0.2, 0, 0.78, 0.14, C.negro); caja(0.1, 0.015, 0.15, 0.42, 0.78, 0.15, C.negro);
      cil(0.09, 0.1, -w / 2 + 0.2, 0.78, 0.18, [C.blanco, C.lima, C.ambar][i % 3]);
      caja(0.26, 0.02, 0.2, -w / 2 + 0.26, 0.78, -0.12, C.blanco, 0.2);
      caja(0.08, 0.2, 0.05, 0, 0.78, -0.24, C.negro); caja(0.3, 0.02, 0.2, 0, 0.78, -0.24, C.negro);
      caja(0.86, 0.5, 0.04, 0, 0.94, -0.26, C.negro);
      var o = new THREE.Mesh(BASE.plano, sala.mPantalla);
      o.applyMatrix4(new THREE.Matrix4().multiplyMatrices(M, matriz(0, 1.19, -0.235, 0.8, 0.44, 1)));
      mundo.add(o);
      silla(0, 0.62, 0, C.negro);
      if (conPersona !== false) sala.personas.push(sentado(sala.n * 3 + i, M));
    });
  }
  function planta(x, z, tipo, alto) {
    var h = alto || 1;
    en(x, z, 0, function () {
      cil(0.42, 0.34, 0, 0, 0, C.maceta); cil(0.38, 0.02, 0, 0.34, 0, 0x2B1E14);
      if (tipo === 'palma') { cil(0.08, 0.7 * h, 0, 0.34, 0, C.maderaOsc); for (var i = 0; i < 7; i++) { var a = i * 0.9; poner(BASE.esf, matriz(Math.sin(a) * 0.3, 1 * h + (i % 2) * 0.1, Math.cos(a) * 0.3, 0.26, 0.09, 0.74, a, 0.5), i % 2 ? C.verde : C.verdeOsc); } }
      else if (tipo === 'alta') { cil(0.06, 0.5 * h, 0, 0.34, 0, C.maderaOsc); esf(0.62, 0, 0.98 * h, 0, C.verde); esf(0.44, 0.14, 1.24 * h, 0.08, C.verdeOsc); esf(0.34, -0.14, 1.12 * h, -0.1, 0x4E8F45); }
      else for (var j = 0; j < 8; j++) { var b = j * 0.8; poner(BASE.cono, matriz(Math.sin(b) * 0.13, 0.62, Math.cos(b) * 0.13, 0.12, 0.64 + (j % 3) * 0.1, 0.05, b, Math.cos(b) * 0.28, -Math.sin(b) * 0.28), j % 2 ? C.verde : C.verdeOsc); }
    });
  }
  function alfombra(x, z, w, d, color, borde) { caja(w, 0.02, d, x, 0.012, z, borde || C.tinta); caja(w - 0.18, 0.024, d - 0.18, x, 0.012, z, color); }
  function libros(x, y, z, largo, enZ) {
    var p = 0, colores = [C.lima, C.ambar, 0x5E93B5, 0xC47BA6, C.blanco, 0xD9734A, 0x7FC99B, 0x38474F];
    while (p < largo - 0.1) {
      var a = 0.06 + azar() * 0.05, h = 0.26 + azar() * 0.14, c = colores[Math.floor(azar() * colores.length)];
      if (azar() > 0.14) { if (enZ) caja(0.2, h, a, x, y, z + p, c); else caja(a, h, 0.2, x + p, y, z, c); }
      p += a + 0.01;
    }
  }
  function biblioteca(x, z, ancho, enZ) {
    if (enZ) {
      caja(0.34, 2.05, ancho, x, 0, z + ancho / 2, C.maderaOsc); caja(0.34, 0.05, ancho, x, 2.05, z + ancho / 2, C.maderaOsc);
      for (var i = 0; i < 4; i++) { caja(0.36, 0.04, ancho, x, 0.12 + i * 0.47, z + ancho / 2, C.maderaCl); libros(x, 0.16 + i * 0.47, z + 0.08, ancho - 0.1, true); }
    } else {
      caja(ancho, 2.05, 0.34, x + ancho / 2, 0, z, C.maderaOsc);
      for (var j = 0; j < 4; j++) { caja(ancho, 0.04, 0.36, x + ancho / 2, 0.12 + j * 0.47, z, C.maderaCl); libros(x + 0.08, 0.16 + j * 0.47, z + 0.12, ancho - 0.1, false); }
    }
  }
  function sillon(x, z, rot, ancho, color) {
    en(x, z, rot, function () {
      caja(ancho, 0.28, 0.76, 0, 0.1, 0, color); caja(ancho, 0.46, 0.18, 0, 0.32, 0.32, color);
      caja(0.16, 0.34, 0.76, -ancho / 2, 0.1, 0, color); caja(0.16, 0.34, 0.76, ancho / 2, 0.1, 0, color);
      for (var i = 0; i < 2; i++) caja(ancho / 2 - 0.1, 0.1, 0.56, (i - 0.5) * (ancho / 2), 0.38, -0.04, C.blanco === color ? C.tela : color);
    });
  }
  function mesaRedonda(x, z, diam, alto, color) { cil(diam, 0.05, x, alto, z, color || C.maderaCl); cil(0.08, alto, x, 0, z, C.acero); cil(diam * 0.5, 0.03, x, 0, z, C.acero); }
  function archivo(x, z, cajones, rot) {
    en(x, z, rot, function () {
      caja(0.54, cajones * 0.34, 0.56, 0, 0, 0, C.acero);
      for (var i = 0; i < cajones; i++) { caja(0.48, 0.28, 0.02, 0, 0.03 + i * 0.34, 0.285, C.metal); caja(0.14, 0.03, 0.03, 0, 0.17 + i * 0.34, 0.3, C.negro); }
    });
  }
  function pizarra(x, y, z, w, h, rot, notas) {
    en(x, z, rot, function () {
      caja(w + 0.08, h + 0.08, 0.05, 0, y - 0.04, 0, C.marco); caja(w, h, 0.02, 0, y, 0.03, C.blanco);
      (notas || []).forEach(function (n) { caja(0.2, 0.2, 0.01, -w / 2 + 0.2 + n[0] * (w - 0.4), y + 0.12 + n[1] * (h - 0.4), 0.05, n[2]); });
    });
  }
  function cuadro(x, y, z, w, h, rot, a, b) {
    en(x, z, rot, function () {
      caja(w + 0.06, h + 0.06, 0.04, 0, y - 0.03, 0, C.marco); caja(w, h, 0.02, 0, y, 0.025, a);
      poner(BASE.esf, matriz(0.1 * w, y + h * 0.55, 0.04, w * 0.5, h * 0.5, 0.01), b); caja(w * 0.7, h * 0.12, 0.01, -0.1 * w, y + h * 0.18, 0.04, b);
    });
  }
  function papelera(x, z) { cil(0.24, 0.3, x, 0, z, C.acero); }

  /* Gimnasio de muestra: el rubro de Nexo Fit está en la propia oficina. */
  function mancuernero(x, z, ancho) {
    en(x, z, 0, function () {
      caja(ancho, 0.04, 0.34, 0, 0.32, 0, C.acero); caja(ancho, 0.04, 0.34, 0, 0.66, -0.06, C.acero);
      caja(0.05, 0.86, 0.5, -ancho / 2, 0, 0, C.negro); caja(0.05, 0.86, 0.5, ancho / 2, 0, 0, C.negro);
      for (var f = 0; f < 2; f++) for (var i = 0; i < Math.floor(ancho / 0.3); i++) {
        var px = -ancho / 2 + 0.2 + i * 0.3, py = 0.42 + f * 0.34, pz = -f * 0.06;
        acostado(0.03, 0.2, px, py, pz, C.metal, Math.PI / 2);
        cil(0.13, 0.06, px, py - 0.03, pz - 0.1, C.negro); cil(0.13, 0.06, px, py - 0.03, pz + 0.1, C.negro);
      }
    });
  }
  function pesasRusas(x, z) {
    [[0, 0.2], [0.34, 0.26], [0.72, 0.3]].forEach(function (k, i) {
      esf(k[1], x + k[0], k[1] * 0.45, z, i === 2 ? C.lima : C.negro); toro(k[1] * 0.7, x + k[0], k[1] * 0.98, z, C.negro);
    });
  }
  function rackPotencia(x, z) {
    en(x, z, 0, function () {
      [[-0.65, -0.5], [0.65, -0.5], [-0.65, 0.5], [0.65, 0.5]].forEach(function (p) { caja(0.08, 1.9, 0.08, p[0], 0, p[1], C.negro); });
      caja(1.38, 0.07, 0.08, 0, 1.86, -0.5, C.negro); caja(1.38, 0.07, 0.08, 0, 1.86, 0.5, C.negro); caja(0.08, 0.07, 1, -0.65, 1.86, 0, C.negro); caja(0.08, 0.07, 1, 0.65, 1.86, 0, C.negro);
      acostado(0.04, 1.86, 0, 1.2, 0.1, C.metal);
      [-0.84, -0.78, 0.78, 0.84].forEach(function (d, i) { poner(BASE.cil, matriz(d, 1.2, 0.1, i === 0 || i === 3 ? 0.36 : 0.46, 0.05, i === 0 || i === 3 ? 0.36 : 0.46, 0, 0, Math.PI / 2), i === 0 || i === 3 ? C.lima : C.negro); });
    });
  }
  function banco(x, z, rot) {
    en(x, z, rot, function () { caja(0.34, 0.09, 1.1, 0, 0.4, 0, C.negro); caja(0.1, 0.4, 0.1, 0, 0, -0.42, C.acero); caja(0.1, 0.4, 0.1, 0, 0, 0.42, C.acero); caja(0.52, 0.05, 0.1, 0, 0, -0.42, C.acero); caja(0.52, 0.05, 0.1, 0, 0, 0.42, C.acero); });
  }
  function cinta(x, z, rot) {
    en(x, z, rot, function () {
      caja(0.74, 0.14, 1.7, 0, 0.04, 0, C.negro); caja(0.54, 0.02, 1.5, 0, 0.18, 0, 0x2E3436);
      caja(0.06, 1.02, 0.06, -0.33, 0.1, -0.7, C.acero); caja(0.06, 1.02, 0.06, 0.33, 0.1, -0.7, C.acero);
      caja(0.74, 0.2, 0.26, 0, 1.1, -0.7, C.negro); caja(0.34, 0.14, 0.02, 0, 1.15, -0.56, C.lima);
    });
  }
  function bici(x, z, rot) {
    en(x, z, rot, function () {
      caja(0.46, 0.06, 0.9, 0, 0, 0, C.negro); caja(0.1, 0.56, 0.1, 0, 0.06, 0.12, C.acero); caja(0.08, 0.84, 0.08, 0, 0.06, -0.26, C.acero);
      caja(0.24, 0.07, 0.3, 0, 0.62, 0.14, C.negro); caja(0.44, 0.05, 0.08, 0, 0.9, -0.28, C.acero);
      poner(BASE.cil, matriz(0, 0.3, -0.34, 0.52, 0.09, 0.52, 0, 0, Math.PI / 2), C.lima);
    });
  }
  function colchonetas(x, z) {
    [0, 1, 2, 3].forEach(function (i) { caja(1.1, 0.07, 0.54, x, 0.02 + i * 0.08, z, i % 2 ? C.lima : C.negro); });
  }
  /* Equipo propio de cada sala. */
  function aroLuz(x, z, sala) {
    caja(0.04, 1.3, 0.04, x, 0, z, C.acero); caja(0.56, 0.03, 0.05, x, 0.02, z, C.acero, 0.5); caja(0.56, 0.03, 0.05, x, 0.02, z, C.acero, 2);
    caja(0.13, 0.22, 0.015, x, 1.56, z + 0.02, C.negro);
    var o = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.035, 10, 34), sala.mFoco);
    o.position.set(x, 1.56, z); mundo.add(o);
  }
  function camaraVideo(x, z, ry) {
    [0, 2.1, 4.2].forEach(function (a) { poner(BASE.caja, matriz(x + Math.sin(a) * 0.17, 0.5, z + Math.cos(a) * 0.17, 0.03, 1, 0.03, 0, Math.cos(a) * 0.34, -Math.sin(a) * 0.34), C.negro); });
    en(x, z, ry || 0, function () { caja(0.28, 0.2, 0.42, 0, 1, 0, C.negro); acostado(0.14, 0.18, 0, 1.1, -0.28, C.acero, Math.PI / 2); });
  }
  function softbox(x, z, ry, sala) {
    caja(0.04, 1.55, 0.04, x, 0, z, C.acero); caja(0.52, 0.03, 0.05, x, 0.02, z, C.acero); caja(0.05, 0.03, 0.52, x, 0.02, z, C.acero);
    en(x, z, ry, function () {
      caja(0.8, 0.56, 0.18, 0, 1.5, 0, C.negro);
      var o = new THREE.Mesh(BASE.plano, sala.mFoco);
      o.applyMatrix4(new THREE.Matrix4().multiplyMatrices(M, matriz(0, 1.78, 0.095, 0.72, 0.48, 1)));
      mundo.add(o);
    });
  }
  function cajaFuerte(x, z) {
    caja(0.86, 1.1, 0.72, x, 0, z, 0x262E30); caja(0.72, 0.96, 0.02, x, 0.07, z + 0.37, 0x394348);
    poner(BASE.cil, matriz(x + 0.12, 0.62, z + 0.39, 0.18, 0.04, 0.18, 0, Math.PI / 2), C.metal); caja(0.04, 0.2, 0.03, x - 0.22, 0.52, z + 0.39, C.metal);
  }
  function impresora(x, z) { caja(0.64, 0.5, 0.5, x, 0, z, C.acero); caja(0.6, 0.26, 0.46, x, 0.5, z, C.blanco); caja(0.4, 0.02, 0.2, x, 0.76, z + 0.14, C.blanco); }
  function globo(x, z) { cil(0.26, 0.04, x, 0.78, z, C.maderaOsc); cil(0.03, 0.14, x, 0.82, z, C.metal); esf(0.34, x, 1.1, z, 0x4C8DAE); esf(0.18, x + 0.09, 1.16, z + 0.09, C.verde); }
  function pilaPapeles(x, y, z) { [0, 1, 2, 3, 4].forEach(function (i) { caja(0.36, 0.05, 0.26, x, y + i * 0.05, z, i % 2 ? C.blanco : 0xD9DDD0, i * 0.07); }); }
  function rollUp(x, z) { caja(0.76, 1.7, 0.02, x, 0.08, z, C.lima); caja(0.7, 0.34, 0.03, x, 1.2, z, C.tinta); caja(0.5, 0.1, 0.03, x, 0.7, z, C.tinta); caja(0.84, 0.08, 0.24, x, 0, z, C.negro); }

  /* ---------- Personas ---------- */
  function tronco(i, conPiernas) {
    var ropa = ROPA[i % ROPA.length], piel = PIEL[(i * 3 + 1) % PIEL.length], pelo = PELO[(i * 2 + 1) % PELO.length], pant = i % 3 === 0 ? 0x263340 : i % 3 === 1 ? 0x38322B : 0x1E2528;
    return fundir(conLote(function () {
      poner(BASE.esf, matriz(0, 0.64, 0, 0.42, 0.56, 0.3), ropa); poner(BASE.cil, matriz(0, 0.5, 0, 0.36, 0.3, 0.26), ropa);
      if (conPiernas) { poner(BASE.cil, matriz(0, 0.38, 0, 0.34, 0.1, 0.24), pant); }
      else { caja(0.14, 0.13, 0.5, -0.1, 0.42, -0.22, pant); caja(0.14, 0.13, 0.5, 0.1, 0.42, -0.22, pant); caja(0.12, 0.42, 0.13, -0.1, 0.02, -0.42, pant); caja(0.12, 0.42, 0.13, 0.1, 0.02, -0.42, pant); }
    }), mCuerpos);
  }
  function cabeza(i) {
    var piel = PIEL[(i * 3 + 1) % PIEL.length], pelo = PELO[(i * 2 + 1) % PELO.length];
    var o = fundir(conLote(function () {
      esf(0.32, 0, 0, 0, piel); poner(BASE.esf, matriz(0, 0.05, 0.03, 0.34, 0.28, 0.33), pelo);
      if (i % 4 === 1) poner(BASE.esf, matriz(0, -0.08, 0.15, 0.3, 0.3, 0.14), pelo);
      if (i % 5 === 2) { toro(0.36, 0, 0.1, 0, C.negro, Math.PI / 2); }
    }), mCuerpos);
    o.position.y = 1.08;
    return o;
  }
  var gBrazo = {}, gPierna = {};
  function brazo(i, x) {
    var ropa = ROPA[i % ROPA.length], piel = PIEL[(i * 3 + 1) % PIEL.length], k = ropa + '-' + piel;
    if (!gBrazo[k]) gBrazo[k] = fundir(conLote(function () { poner(BASE.cil, matriz(0, -0.14, 0, 0.1, 0.3, 0.1), ropa); poner(BASE.cil, matriz(0, -0.36, 0, 0.08, 0.2, 0.08), piel); }), mCuerpos).geometry;
    var o = new THREE.Mesh(gBrazo[k], mCuerpos);
    o.position.set(x, 0.82, 0);
    return o;
  }
  function pierna(i, x) {
    var pant = i % 3 === 0 ? 0x263340 : i % 3 === 1 ? 0x38322B : 0x1E2528;
    if (!gPierna[pant]) gPierna[pant] = fundir(conLote(function () { poner(BASE.cil, matriz(0, -0.19, 0, 0.14, 0.4, 0.14), pant); caja(0.14, 0.05, 0.22, 0, -0.42, -0.04, C.blanco); }), mCuerpos).geometry;
    var o = new THREE.Mesh(gPierna[pant], mCuerpos);
    o.position.set(x, 0.42, 0);
    return o;
  }
  function sentado(i, matrizMundo) {
    var g = new THREE.Group();
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(matrizMundo, new THREE.Matrix4().makeTranslation(0, 0.08, 0.62)));
    var bi = brazo(i, -0.25), bd = brazo(i, 0.25), c = cabeza(i);
    g.add(tronco(i, false)); g.add(bi); g.add(bd); g.add(c);
    bi.rotation.x = bd.rotation.x = 1.2;
    mundo.add(g);
    return { g: g, bi: bi, bd: bd, cabeza: c, fase: i * 1.7 };
  }
  var gSombra = new THREE.CircleGeometry(0.3, 18), mSombra = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false });
  function caminante(i) {
    var g = new THREE.Group(), bi = brazo(i, -0.25), bd = brazo(i, 0.25), pi = pierna(i, -0.1), pd = pierna(i, 0.1), c = cabeza(i), s = new THREE.Mesh(gSombra, mSombra);
    s.rotation.x = -Math.PI / 2; s.position.y = 0.02;
    g.add(tronco(i, true)); g.add(bi); g.add(bd); g.add(pi); g.add(pd); g.add(c); g.add(s);
    mundo.add(g);
    return { g: g, bi: bi, bd: bd, pi: pi, pd: pd, cabeza: c };
  }

  /* ---------- Pantallas con datos reales ---------- */
  var FUENTE = "'Barlow Condensed','Arial Narrow',sans-serif", TEXTO = "Barlow,system-ui,sans-serif";
  function hexa(n) { return '#' + ('000000' + n.toString(16)).slice(-6); }
  function recorte(g, t, ancho) {
    t = String(t == null ? '' : t);
    if (g.measureText(t).width <= ancho) return t;
    while (t.length > 1 && g.measureText(t + '…').width > ancho) t = t.slice(0, -1);
    return t + '…';
  }
  function mural(x, y, z, w, h, px, py) {
    caja(w + 0.12, h + 0.12, 0.07, x, y - 0.06, z, C.negro);
    var c = lienzo(px || 640, py || Math.round(640 * h / w)), t = textura(c);
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    var o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, toneMapped: false }));
    o.position.set(x, y + h / 2, z + 0.042);
    mundo.add(o);
    return { c: c, g: c.getContext('2d'), t: t };
  }
  function pintarMural(s, e) {
    var m = s.mural, g = m.g, W = m.c.width, H = m.c.height, p = (publico ? e.publica : e.pantalla) || {}, luz = hexa(publico ? C.lima : (LUZ[e.estado] || C.gris));
    g.fillStyle = '#0B1311'; g.fillRect(0, 0, W, H);
    g.fillStyle = luz; g.fillRect(0, 0, W, 10);
    g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    g.fillStyle = '#E8ECE4'; g.font = '600 46px ' + FUENTE; g.fillText(e.nombre, 28, 66);
    g.textAlign = 'right'; g.fillStyle = e.trabajando ? hexa(C.lima) : '#9FB0A8'; g.font = '500 26px ' + TEXTO;
    g.fillText(publico ? 'En turno' : e.trabajando ? 'Trabajando' : e.proximo ? 'Turno ' + e.proximo : '', W - 28, 62);
    g.textAlign = 'left'; g.fillStyle = luz;
    var cifra = String(p.cifra == null ? '—' : p.cifra), tam = 138;
    g.font = '700 ' + tam + 'px ' + FUENTE;
    while (tam > 60 && g.measureText(cifra).width > 278) { tam -= 6; g.font = '700 ' + tam + 'px ' + FUENTE; }
    g.fillText(cifra, 28, 188);
    g.fillStyle = '#C5D0C8'; g.font = '500 26px ' + TEXTO; g.fillText(recorte(g, p.unidad || '', 270), 28, 228);
    var filas = (p.filas || []).slice(0, 4), yf = 112;
    g.font = '500 25px ' + TEXTO;
    filas.forEach(function (f) {
      g.textAlign = 'left'; g.fillStyle = '#9FB0A8'; g.fillText(recorte(g, f[0], 200), 322, yf);
      g.textAlign = 'right'; g.fillStyle = '#E8ECE4'; g.font = '600 28px ' + TEXTO; g.fillText(recorte(g, f[1], 104), W - 28, yf);
      g.font = '500 25px ' + TEXTO; yf += 40;
    });
    if (p.nota) { g.textAlign = 'left'; g.fillStyle = '#9FB0A8'; g.font = '500 23px ' + TEXTO; g.fillText(recorte(g, p.nota, W - 56), 28, H - 22); }
    m.t.needsUpdate = true;
  }
  function pintarMando(m, estados) {
    var g = m.g, W = m.c.width, H = m.c.height, ids = Object.keys(estados).filter(function (k) { return k !== 'jefe'; });
    g.fillStyle = '#0B1311'; g.fillRect(0, 0, W, H);
    g.fillStyle = hexa(C.lima); g.fillRect(0, 0, W, 10);
    g.textAlign = 'left'; g.fillStyle = '#E8ECE4'; g.font = '600 46px ' + FUENTE; g.fillText('Sala de mando', 28, 66);
    ids.forEach(function (id, i) {
      var e = estados[id], x = 28 + (i % 2) * 296, y = 118 + Math.floor(i / 2) * 50, c = publico ? C.lima : (LUZ[e.estado] || C.gris);
      g.fillStyle = hexa(c); g.beginPath(); g.arc(x + 9, y - 9, 9, 0, 7); g.fill();
      g.fillStyle = '#E8ECE4'; g.font = '500 28px ' + TEXTO; g.fillText(recorte(g, e.nombre, 250), x + 30, y);
    });
    m.t.needsUpdate = true;
  }
  function pintarCartel(m, info) {
    var g = m.g, W = m.c.width, H = m.c.height;
    g.fillStyle = '#0B1311'; g.fillRect(0, 0, W, H);
    g.fillStyle = hexa(C.lima); g.textAlign = 'left'; g.font = '700 118px ' + FUENTE; g.fillText('Nexo Fit', 34, 118);
    g.fillStyle = '#E8ECE4'; g.font = '500 34px ' + TEXTO; g.fillText(info.lema || 'Lanzamiento lunes 16/11', 36, 172);
    g.textAlign = 'right'; g.fillStyle = '#E8ECE4'; g.font = '700 124px ' + FUENTE; g.fillText(String(info.dias), W - 34, 118);
    g.fillStyle = '#9FB0A8'; g.font = '500 30px ' + TEXTO; g.fillText(info.dias === 1 ? 'día para lanzar' : 'días para lanzar', W - 36, 172);
    m.t.needsUpdate = true;
  }
  function pintarTablero(m, info) {
    var g = m.g, W = m.c.width, H = m.c.height, y = 112;
    g.fillStyle = '#0B1311'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#E8ECE4'; g.textAlign = 'left'; g.font = '600 48px ' + FUENTE; g.fillText('Próximos turnos', 28, 62);
    g.textAlign = 'right'; g.fillStyle = hexa(C.lima); g.font = '600 52px ' + FUENTE; g.fillText(info.hora || '', W - 28, 62);
    (info.turnos || []).slice(0, 4).forEach(function (t, i) {
      g.textAlign = 'left'; g.fillStyle = i ? '#9FB0A8' : hexa(C.lima); g.font = '600 40px ' + FUENTE; g.fillText(t.h, 28, y + 8);
      g.fillStyle = '#E8ECE4'; g.font = '500 28px ' + TEXTO; g.fillText(recorte(g, t.sala, 210), 138, y + 6);
      g.fillStyle = '#9FB0A8'; g.font = '400 24px ' + TEXTO; g.fillText(recorte(g, t.t, W - 382), 356, y + 5);
      y += 46;
    });
    m.t.needsUpdate = true;
  }

  /* ---------- Salas ---------- */
  var salas = {}, tiempo = 0, ultimo = 0, elegida = null, foco = null, sobre = null;
  function pantallita(color) {
    var c = lienzo(128, 96), g = c.getContext('2d');
    g.fillStyle = '#0D1714'; g.fillRect(0, 0, 128, 96);
    for (var i = 0; i < 12; i++) { g.fillStyle = hexa(i % 4 === 0 ? C.blanco : color); g.globalAlpha = 0.45 + (i % 3) * 0.2; g.fillRect(8 + (i % 3) * 8, 5 + i * 7.6, 34 + (i * 37) % 76, 3.4); }
    g.globalAlpha = 1;
    var t = textura(c, true);
    return new THREE.MeshBasicMaterial({ map: t, color: 0x777777, toneMapped: false });
  }
  var texPozo = (function () {
    var c = lienzo(256, 256), g = c.getContext('2d'), r = g.createRadialGradient(128, 128, 8, 128, 128, 128);
    r.addColorStop(0, 'rgba(255,255,255,.9)'); r.addColorStop(0.55, 'rgba(255,255,255,.34)'); r.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = r; g.fillRect(0, 0, 256, 256);
    return textura(c);
  })();
  function pozoLuz(x, z, w, d, color) {
    var m = new THREE.MeshBasicMaterial({ map: texPozo, color: color, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    var o = new THREE.Mesh(BASE.plano, m);
    o.rotation.x = -Math.PI / 2; o.scale.set(w * 1.05, d * 1.05, 1); o.position.set(x, 0.05, z);
    mundo.add(o);
    return m;
  }
  function zocalo(s) {
    var m = new THREE.MeshBasicMaterial({ color: C.gris, toneMapped: false });
    var l = conLote(function () {
      var i = 0.12, a = 0.05;
      caja(s.w - i * 2, a, 0.05, s.x + s.w / 2, 0.02, s.z + i, 0xffffff); caja(0.05, a, s.d - i * 2, s.x + i, 0.02, s.z + s.d / 2, 0xffffff); caja(0.05, a, s.d - i * 2, s.x + s.w - i, 0.02, s.z + s.d / 2, 0xffffff);
      var p = s.puerta[0];
      if (s.puerta[1] === s.z + s.d) { caja(p - 0.7 - s.x - i, a, 0.05, (s.x + i + p - 0.7) / 2, 0.02, s.z + s.d - i, 0xffffff); caja(s.x + s.w - i - p - 0.7, a, 0.05, (s.x + s.w - i + p + 0.7) / 2, 0.02, s.z + s.d - i, 0xffffff); }
      else caja(s.w - i * 2, a, 0.05, s.x + s.w / 2, 0.02, s.z + s.d - i, 0xffffff);
    });
    l.col = [];
    mundo.add(fundir(l, m));
    return m;
  }

  Object.keys(DEF).forEach(function (id, n) {
    var s = DEF[id];
    var sala = { id: id, n: n, def: s, personas: [], activa: false, color: new THREE.Color(C.gris), objeto: piso(s.piso, s.x, s.z, s.w, s.d, id),
      mPantalla: pantallita(s.a), mFoco: new THREE.MeshBasicMaterial({ color: 0xFFF6E0, toneMapped: false }), mural: null, pozo: pozoLuz(s.x + s.w / 2, s.z + s.d / 2, s.w, s.d, 0xFFE3B0), zocalo: zocalo(s), leds: [] };
    salas[id] = sala;
    var a = s.mural;
    sala.mural = mural(a[0], a[1], a[2], a[3], a[4], 640, 320);
  });

  /* Dirección */
  (function (s) {
    alfombra(3.4, 3.7, 4.6, 3.2, 0x2F4A2C, C.lima);
    escritorio(3, 3.3, s, 0, 2.2);
    caja(0.42, 0.04, 0.3, 3.8, 0.78, 3.28, C.negro);
    cuadro(8.92, 1, 3.4, 1.3, 0.9, -Math.PI / 2, 0x20302A, C.lima);
    mesaRedonda(6.9, 2.6, 1.6, 0.72, C.maderaOsc);
    [[0, 1], [1.57, 1], [3.14, 1], [4.71, 1]].forEach(function (p) { silla(6.9 + Math.sin(p[0]) * 1.02, 2.6 + Math.cos(p[0]) * 1.02, p[0], C.negro); });
    pilaPapeles(6.7, 0.77, 2.5);
    biblioteca(5.6, 0.32, 3.1, false);
    sillon(1.3, 5.7, 0, 2, 0x2B3D35);
    mesaRedonda(2.9, 5.5, 0.7, 0.36, C.maderaCl);
    planta(0.5, 0.6, 'palma', 1.2); planta(8.4, 5.9, 'alta', 1.25); planta(0.5, 3.6, 'baja');
    pilaPapeles(2.9, 0.41, 5.5);
  })(salas.direccion);

  /* Comercial */
  (function (s) {
    [[11.2, 2.9], [13.9, 2.9], [11.2, 5.1], [13.9, 5.1]].forEach(function (p, i) { escritorio(p[0], p[1], s, i); });
    mancuernero(18.6, 0.5, 3.6); pesasRusas(16.6, 0.5);
    rackPotencia(19.4, 3); banco(17.3, 3.6, 0.3); colchonetas(17.2, 5.7);
    rollUp(20.3, 5.3);
    planta(9.5, 0.6, 'alta', 1.15); planta(9.5, 5.9, 'palma'); archivo(16.2, 3, 3, -Math.PI / 2);
  })(salas.comercial);

  /* Administración */
  (function (s) {
    [[23.4, 3.1], [26.2, 3.1], [23.4, 5.2], [26.2, 5.2]].forEach(function (p, i) { escritorio(p[0], p[1], s, i, 1.6, i < 3); });
    cajaFuerte(31.2, 0.65);
    archivo(29.4, 0.45, 4); archivo(30, 0.45, 4); archivo(28.8, 0.45, 3);
    impresora(31.3, 3); pilaPapeles(31.3, 0.8, 3);
    caja(1.5, 0.74, 0.6, 29.8, 0, 4.9, C.maderaOsc); pilaPapeles(29.5, 0.74, 4.9); pilaPapeles(30.2, 0.74, 4.9); cil(0.2, 0.2, 29.9, 0.74, 4.8, C.acero);
    planta(21.6, 0.6, 'alta'); planta(31.4, 5.9, 'baja'); papelera(28.2, 3.4);
  })(salas.administracion);

  /* Redes sociales */
  (function (s) {
    [[1.7, 11.3], [4.3, 11.3]].forEach(function (p, i) { escritorio(p[0], p[1], s, i); });
    [[1.7, 13.2]].forEach(function (p) { escritorio(p[0], p[1], s, 2); });
    alfombra(5.8, 11.3, 2.6, 2.1, 0x5A3347, 0xE58FB5);
    aroLuz(6.5, 10.1, s);
    sillon(6.1, 11.7, Math.PI, 1.6, 0x4B3040);
    caja(0.9, 1.6, 0.04, 4.4, 0.3, 13.7, 0xE58FB5);
    caja(0.72, 0.26, 0.05, 4.4, 1.26, 13.7, C.negro);
    planta(0.5, 8.98, 'baja'); planta(7, 13.9, 'palma', 0.9);
  })(salas.redes);

  /* Marketing */
  (function (s) {
    [[9.5, 11.3], [12.1, 11.3]].forEach(function (p, i) { escritorio(p[0], p[1], s, i); });
    en(7.6, 11.5, Math.PI / 2, function () { pizarra(0, 0.72, 0, 3.4, 1.15, 0, [[0.05, 0.75, C.ambar], [0.22, 0.75, C.lima], [0.05, 0.4, 0xE58FB5], [0.4, 0.75, C.ambar], [0.4, 0.4, C.lima], [0.6, 0.75, 0x5E93B5], [0.8, 0.75, C.lima], [0.8, 0.4, C.ambar], [0.6, 0.1, 0xE58FB5]]); });
    mesaRedonda(12.9, 13.2, 1.3, 0.72, C.maderaCl);
    silla(11.9, 13.2, 1.57, C.negro); silla(13.9, 13.2, -1.57, C.negro);
    pilaPapeles(12.9, 0.77, 13.2); rollUp(14.5, 9.2);
    planta(8, 13.9, 'alta'); planta(14.5, 13.9, 'baja');
  })(salas.marketing);

  /* Diseño y video */
  (function (s) {
    [[18.8, 11.5], [21, 11.5]].forEach(function (p, i) { escritorio(p[0], p[1], s, i, 1.8); });
    caja(2.6, 2, 0.05, 23, 0, 8.72, 0x2DA84A);
    caja(2.6, 0.02, 2.6, 23, 0.03, 9.95, 0x2DA84A);
    camaraVideo(23, 12.6, 0);
    softbox(21.6, 10, 2.5, s); softbox(24.1, 12, -0.5, s);
    caja(1.8, 0.74, 0.6, 18.3, 0, 13.7, C.maderaOsc); pilaPapeles(17.9, 0.74, 13.7); cil(0.3, 0.05, 18.8, 0.74, 13.7, C.negro);
    [0xA5CC21, 0xF4B73F, 0xFF6A5C, 0xA48BE0, 0x7FB8D9].forEach(function (c, i) { caja(0.2, 0.3, 0.015, 18.6 + i * 0.26, 1.3, 8.6, c); });
    planta(17.5, 9, 'baja');
  })(salas.diseno);

  /* Investigación */
  (function (s) {
    [[26.2, 11.3], [28.8, 11.3]].forEach(function (p, i) { escritorio(p[0], p[1], s, i); });
    biblioteca(31.74, 8.85, 3.1, true); biblioteca(31.74, 12, 2.1, true);
    en(24.6, 12.6, Math.PI / 2, function () {
      caja(2.7, 1.2, 0.05, 0, 0.7, 0, 0x8E6A44);
      [[-1, 1.5, C.blanco], [-0.4, 1.2, C.ambar], [0.3, 1.45, C.blanco], [0.9, 1.05, C.lima], [-0.7, 0.95, 0x5E93B5], [0.2, 0.9, C.blanco]].forEach(function (n) { caja(0.32, 0.26, 0.02, n[0], n[1], 0.04, n[2], 0.06); });
    });
    mesaRedonda(27.4, 13.3, 1.2, 0.72, C.maderaCl); pilaPapeles(27.2, 0.77, 13.2); globo(27.7, 13.4);
    silla(28.5, 13.3, -1.57, C.negro); silla(26.3, 13.3, 1.57, C.negro);
    planta(25, 9, 'alta'); pilaPapeles(31, 0, 14);
  })(salas.investigacion);

  /* Operaciones: racks reales del escenario, con luces que siguen el estado de la sala. */
  (function (s) {
    var a = conLote(function () {}), b = conLote(function () {});
    for (var r = 0; r < 4; r++) {
      var x = 21.8 + r * 1;
      caja(0.86, 1.86, 0.84, x, 0, 17.2, C.negro);
      caja(0.76, 1.72, 0.02, x, 0.07, 17.63, 0x1A2124);
      for (var f = 0; f < 8; f++) caja(0.66, 0.1, 0.01, x, 0.14 + f * 0.2, 17.645, 0x2C353A);
    }
    var antes = lote;
    [a, b].forEach(function (l, k) {
      lote = l;
      for (var r = 0; r < 4; r++) for (var f = 0; f < 8; f++) for (var e = 0; e < 3; e++) if ((r * 7 + f * 3 + e * 5 + k) % 2 === 0) caja(0.05, 0.035, 0.01, 21.8 + r - 0.25 + e * 0.1, 0.17 + f * 0.2, 17.655, 0xffffff);
    });
    lote = antes;
    a.col = []; b.col = [];
    s.mLedA = new THREE.MeshBasicMaterial({ color: C.lima, toneMapped: false }); s.mLedB = new THREE.MeshBasicMaterial({ color: C.lima, toneMapped: false });
    mundo.add(fundir(a, s.mLedA)); mundo.add(fundir(b, s.mLedB));
    caja(4, 0.08, 0.3, 23.3, 1.96, 17.2, C.acero);
    [[27.4, 19.9], [30, 19.9]].forEach(function (p, i) { escritorio(p[0], p[1], s, i); });
    escritorio(23, 20.2, s, 2);
    caja(0.9, 0.9, 0.5, 31.3, 0, 17, 0x262E30); caja(0.2, 0.08, 0.02, 31.3, 0.7, 17.26, C.lima);
    archivo(25.9, 17.1, 3); planta(31.5, 21.4, 'baja'); planta(21.5, 21.4, 'alta');
  })(salas.operaciones);

  /* Sala del jefe: mesa de mando, rincón del mate y terraza con parrilla. */
  var holo = new THREE.Group(), bloques = {}, gBloque = new THREE.BoxGeometry(1, 1, 1);
  (function (s) {
    alfombra(36.5, 9, 6.4, 5.2, 0x24382C, C.lima);
    /* Escritorio grande en L con dos pantallas */
    caja(3.2, 0.08, 0.95, 36.5, 0.72, 3.5, C.maderaOsc); caja(1, 0.08, 1.6, 38.6, 0.72, 3.8, C.maderaOsc);
    caja(3, 0.72, 0.1, 36.5, 0, 3.05, C.maderaOsc); caja(0.1, 0.72, 0.9, 35, 0, 3.5, C.maderaOsc); caja(0.8, 0.72, 0.1, 38.6, 0, 4.5, C.maderaOsc);
    [[35.9], [37.1]].forEach(function (a) {
      en(a[0], 3.3, 0, function () { caja(0.08, 0.2, 0.05, 0, 0.8, 0, C.negro); caja(1, 0.56, 0.04, 0, 0.96, 0, C.negro); var o = new THREE.Mesh(BASE.plano, s.mPantalla); o.applyMatrix4(new THREE.Matrix4().multiplyMatrices(M, matriz(0, 1.24, 0.024, 0.94, 0.5, 1))); mundo.add(o); });
    });
    caja(0.62, 0.015, 0.2, 36.5, 0.8, 3.75, C.negro); pilaPapeles(38.6, 0.8, 3.6);
    silla(36.5, 4.5, 0, 0x263340);
    /* Rincón del mate */
    sillon(39.6, 11.2, -Math.PI / 2, 2.2, 0x2F4A36);
    mesaRedonda(38.2, 11.2, 0.86, 0.42, C.maderaCl);
    en(38.1, 11.2, 0, function () {
      cil(0.2, 0.52, 0, 0.47, 0, 0x2F6B3C); cil(0.16, 0.08, 0, 0.99, 0, C.metal); caja(0.05, 0.16, 0.12, 0.13, 0.7, 0, C.negro);
      esf(0.2, 0.3, 0.57, 0.1, 0x5A3A22); cil(0.17, 0.02, 0.3, 0.66, 0.1, C.metal); cil(0.14, 0.015, 0.3, 0.67, 0.1, 0x6E8B3D);
      cil(0.2, 0.26, -0.26, 0.47, 0.14, C.blanco); cil(0.13, 0.03, -0.26, 0.73, 0.14, C.maderaOsc);
    });
    biblioteca(40.66, 0.6, 2.4, true);
    pizarra(33.9, 1, 13.9, 2.4, 1.1, Math.PI, [[0.1, 0.7, C.lima], [0.4, 0.7, C.lima], [0.7, 0.7, C.ambar], [0.1, 0.3, C.ambar], [0.4, 0.3, C.lima]]);
    cuadro(38.9, 0.9, 0.1, 1.3, 1.1, 0, 0x20302A, C.lima);
    planta(32.6, 0.7, 'palma', 1.3); planta(40.4, 13.4, 'alta', 1.25); planta(32.6, 13.4, 'baja');
    caja(1, 0.08, 0.7, 34, 0.02, 11.6, 0x6E4E36); caja(0.84, 0.1, 0.54, 34, 0.08, 11.6, 0x9B7450);
    /* Mesa de mando */
    cil(2.3, 0.12, 36.5, 0.86, 9.1, C.negro); cil(1.05, 0.86, 36.5, 0, 9.1, C.acero); cil(2.42, 0.03, 36.5, 0.84, 9.1, C.lima);
    /* Terraza */
    caja(1.5, 0.95, 0.75, 33.6, 0, 15, 0x8A4B35); caja(1.3, 0.05, 0.56, 33.6, 0.95, 15, C.negro); caja(1.5, 1.3, 0.08, 33.6, 0.95, 14.66, 0x8A4B35); caja(0.4, 0.6, 0.4, 33.6, 2.2 - 0.1, 14.66, 0x8A4B35);
    for (var i = 0; i < 9; i++) caja(0.04, 0.025, 0.52, 33 + i * 0.15, 1.02, 15, C.metal);
    caja(0.26, 0.05, 0.18, 33.3, 1.05, 15, 0x6A2F1E); caja(0.3, 0.05, 0.16, 33.8, 1.05, 15.1, 0x7A3A23); caja(0.2, 0.05, 0.14, 34, 1.05, 14.86, 0x6A2F1E);
    caja(2.9, 0.08, 1, 37.5, 0.72, 18.2, C.maderaCl); caja(0.08, 0.72, 0.8, 36.3, 0, 18.2, C.maderaOsc); caja(0.08, 0.72, 0.8, 38.7, 0, 18.2, C.maderaOsc);
    caja(2.8, 0.06, 0.34, 37.5, 0.44, 17.2, C.maderaOsc); caja(2.8, 0.06, 0.34, 37.5, 0.44, 19.2, C.maderaOsc);
    cil(0.07, 2.3, 40, 0, 20.6, C.acero); poner(BASE.cono, matriz(40, 2.5, 20.6, 2.6, 0.6, 2.6), 0xA5CC21);
    planta(32.6, 21.3, 'palma', 1.2); planta(40.5, 15, 'alta'); planta(36.4, 21.4, 'baja');
    for (var f = 0; f < 15; f++) esf(0.09, 33 + f * 0.56, 2.05 + Math.sin(f * 0.42) * -0.14 , 14.2, 0xFFE3B0);
    /* Maqueta flotante: una pieza por sala, con el color real de su estado */
    holo.position.set(36.5, 1.3, 9.1);
    Object.keys(DEF).forEach(function (id) {
      if (id === 'jefe') return;
      var d = DEF[id], e = 0.08, m = new THREE.MeshBasicMaterial({ color: C.gris, transparent: true, opacity: 0.86, toneMapped: false });
      var o = new THREE.Mesh(gBloque, m);
      o.scale.set(d.w * e * 0.92, 0.14, d.d * e * 0.92);
      o.position.set((d.x + d.w / 2 - 16) * e, 0.1, (d.z + d.d / 2 - 11) * e);
      holo.add(o); bloques[id] = o;
    });
    mundo.add(holo);
    var haz = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1, 28, 1, true), new THREE.MeshBasicMaterial({ color: C.lima, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    haz.rotation.x = Math.PI; haz.position.set(36.5, 1.46, 9.1);
    mundo.add(haz);
  })(salas.jefe);

  /* Recepción y muestra de equipamiento, donde se entra a la oficina. */
  piso('calcareo', 0, 6.5, ANCHO, 2);
  piso('calcareo', ANCHO, 14, TOTAL - ANCHO, FONDO - 14);
  piso('calcareo', 15, 8.5, 2, 6);
  piso('calcareo', 0, 14.5, ANCHO, 2);
  piso('madera', 0, 16.5, 7, 5.5);
  piso('goma', 7, 16.5, 4, 5.5);
  piso('alfombra', 11, 16.5, 10, 5.5);
  var cartel = mural(3.5, 0.72, 16.6, 5.4, 1.24, 900, 207);
  var tablero = mural(17.7, 0.68, 16.6, 3.5, 1.3, 760, 282);
  (function () {
    caja(3.4, 1, 0.74, 3.6, 0, 18.6, C.maderaOsc); caja(3.56, 0.06, 0.9, 3.6, 1, 18.6, C.maderaCl); caja(3.2, 0.12, 0.02, 3.6, 0.5, 19, C.lima);
    caja(0.5, 0.3, 0.04, 3, 1.06, 18.5, C.negro); pilaPapeles(4.4, 1.06, 18.6);
    alfombra(3.6, 20.8, 3.4, 1.4, C.tinta, C.lima);
    sillon(0.9, 21, 0, 1.4, 0x2B3D35);
    planta(0.5, 17, 'palma', 1.2); planta(6.5, 21.4, 'alta', 1.15); planta(6.6, 17, 'baja');
    cinta(8, 18, 0); bici(9.1, 18, 0); rackPotencia(9.8, 20.4); banco(7.8, 20.4, 0.2); mancuernero(9, 16.95, 3); pesasRusas(7.5, 21.5);
  })();

  /* Cocina: acá van las personas cuando su sala no tiene turno. */
  (function () {
    caja(4.4, 0.86, 0.6, 13.4, 0, 16.95, C.maderaOsc); caja(4.5, 0.05, 0.66, 13.4, 0.86, 16.95, C.blanco);
    caja(0.52, 0.5, 0.4, 12, 0.91, 16.92, C.acero); caja(0.3, 0.14, 0.03, 12, 1.1, 17.13, C.negro); cil(0.1, 0.1, 12, 0.91, 17.03, C.blanco);
    [12.7, 12.9, 13.1].forEach(function (x) { cil(0.09, 0.1, x, 0.91, 17, C.blanco); });
    caja(0.72, 1.86, 0.66, 15.2, 0, 17, C.metal); caja(0.03, 0.5, 0.03, 14.92, 1, 17.34, C.acero); caja(0.03, 0.5, 0.03, 14.92, 0.3, 17.34, C.acero);
    [[13, 19.4], [15.2, 20.8], [18.6, 19.6]].forEach(function (p, i) {
      mesaRedonda(p[0], p[1], 1, 0.72, i % 2 ? C.maderaCl : C.blanco);
      [0, 2.1, 4.2].forEach(function (a) { caja(0.34, 0.05, 0.34, p[0] + Math.sin(a + i) * 0.74, 0.44, p[1] + Math.cos(a + i) * 0.74, C.lima); cil(0.05, 0.44, p[0] + Math.sin(a + i) * 0.74, 0, p[1] + Math.cos(a + i) * 0.74, C.acero); });
      cil(0.08, 0.1, p[0] + 0.18, 0.77, p[1], C.blanco);
    });
    planta(11.6, 21.4, 'palma'); planta(20.5, 21.4, 'alta', 1.1); planta(20.4, 18.6, 'baja');
  })();

  /* Exterior */
  caja(TOTAL + 2.4, 0.6, FONDO + 3.6, TOTAL / 2, -0.62, FONDO / 2 + 0.6, 0x16201C);
  caja(TOTAL + 2.4, 0.02, 1.6, TOTAL / 2, -0.02, FONDO + 0.9, 0x5A625D);
  [1.5, 9, 13, 18, 23, 28, 30.5, 34, 38.5].forEach(function (x, i) {
    caja(i % 2 ? 2.4 : 1.8, 0.34, 0.5, x, 0, FONDO + 1.3, C.verdeOsc);
  });

  /* Muros: el fondo y la izquierda son altos y con ventanas; adelante quedan bajos y de vidrio para ver adentro. */
  caja(TOTAL + 0.14, 3, 0.14, TOTAL / 2, 0, 0, C.muroCl);
  caja(0.14, 3, FONDO, 0, 0, FONDO / 2, C.muroCl);
  ventanal(0.08, 5.2, 9, true); ventanal(0.08, 9.3, 12, true); ventanal(0.08, 15.6, 21, true); ventanal(0.08, 21.3, 25, true); ventanal(0.08, 28.3, 32, true); ventanal(0.08, 37, 41, true);
  ventanal(0.08, 0.3, 6.3, false); ventanal(0.08, 8.7, 14.4, false); ventanal(0.08, 16.8, 21.8, false);
  muroZ(6.5, 0, 32, [6.6, 15, 23.5], 0.95, 2);
  muroZ(8.5, 0, 15, [], 2.1); muroZ(8.5, 17, 32, [], 2.1);
  muroZ(14.5, 0, 15, [3.8, 11.2], 0.45, 1.7); muroZ(14.5, 17, 32, [20.7, 28.2], 0.45, 1.7);
  muroZ(16.5, 0, 32, [9, 16, 24], 2.1);
  muroZ(FONDO, 0, ANCHO, [5.5], 0.3);
  muroX(9, 0, 6.5, 0.95, 2); muroX(21, 0, 6.5, 0.95, 2);
  muroX(7.5, 8.5, 14.5, 0.95, 1.9); muroX(24.5, 8.5, 14.5, 0.95, 1.9);
  muroX(15, 8.5, 14.5, 1.1); muroX(17, 8.5, 14.5, 1.1);
  muroX(11, 16.5, 22, 0.8, 1.7); muroX(21, 16.5, 22, 0.8, 1.7);
  muroX(ANCHO, 0, 6.5, 0.95, 2); muroX(ANCHO, 8.5, 14.5, 0.95, 2); muroX(ANCHO, 16.5, FONDO, 0.8, 1.7);
  muroZ(14, ANCHO, TOTAL, [37.5], 0.45, 2);
  muroX(TOTAL, 0, 14, 0.4, 2); muroX(TOTAL, 14, FONDO, 0.3, 1);
  muroZ(FONDO, ANCHO, TOTAL, [], 0.3, 1);

  /* Detalles de pared */
  cuadro(9.9, 1.1, 0.1, 0.9, 1.1, 0, 0x20302A, C.ambar);
  cuadro(4.9, 0.9, 8.6, 1.1, 0.8, 0, 0x3A2030, 0xE58FB5); cuadro(6.4, 0.9, 8.6, 0.8, 0.8, 0, 0x20302A, C.lima);
  cuadro(8.3, 0.9, 8.6, 0.8, 0.8, 0, 0x332416, 0xF08A4B); cuadro(14, 0.9, 8.6, 0.9, 0.8, 0, 0x20302A, C.ambar);
  cuadro(25.3, 0.9, 8.6, 0.8, 0.8, 0, 0x1B2B38, 0x7FB8D9); cuadro(30.2, 0.9, 8.6, 1.1, 0.8, 0, 0x20302A, 0x7FB8D9);
  pizarra(23.2, 1, 0.1, 1.5, 1.1, 0, [[0.1, 0.7, C.lima], [0.5, 0.7, C.ambar], [0.8, 0.4, 0x7FC99B]]);
  mundo.add(fundir(lote, mCuerpos, true));
  var oVidrio = fundir(loteVidrio, mVidrio); loteVidrio.col = []; mundo.add(oVidrio);
  loteVentana.col = []; mundo.add(fundir(loteVentana, mVentana));

  /* ---------- Personas que caminan: una por sala, entre su puesto y la cocina ---------- */
  function ruta(s) {
    var d = s.puerta, fuera = d[1] + (d[1] === 16.5 ? -1 : 1), p = [];
    p.push([d[0], d[1] + (d[1] === 16.5 ? 1 : -1)]); p.push(d); p.push([d[0], fuera]);
    if (fuera === 7.5) p.push([16, 7.5]);
    else p.push([16, fuera]);
    if (fuera === 7.5) p.push([16, 15.5]);
    p.push([16, 16.5]); p.push(COCINA);
    return p;
  }
  var gente = Object.keys(salas).filter(function (id) { return id !== 'jefe'; }).map(function (id, i) {
    var s = salas[id], c = caminante(i + 30), r = ruta(s.def), inicio = i % 2 ? r.length - 1 : 0;
    c.ruta = r; c.pos = inicio; c.dir = i % 2 ? -1 : 1; c.espera = 1 + i * 2.3; c.s = s; c.apoyo = (i % 4) * 0.62 - 0.93; c.lado = (i % 3) * 0.6 - 0.6;
    c.g.position.set(r[inicio][0] + (inicio ? c.apoyo : 0), 0.02, r[inicio][1] + (inicio ? c.lado : 0));
    return c;
  });
  function mover(c, dt) {
    var mueve = false;
    if (c.espera > 0) {
      c.espera -= dt;
    } else {
      var n = c.pos + c.dir;
      if (n < 0 || n >= c.ruta.length) {
        c.dir = -c.dir;
        c.espera = c.dir > 0 ? (c.s.activa ? 40 : 6 + Math.random() * 16) : 8 + Math.random() * 14;
      } else {
        var t = c.ruta[n], fin = n === c.ruta.length - 1, ax = fin ? t[0] + c.apoyo : t[0], az = fin ? t[1] + c.lado : t[1], dx = ax - c.g.position.x, dz = az - c.g.position.z, dist = Math.hypot(dx, dz), paso = 1.25 * dt;
        if (dist <= paso) { c.g.position.x = ax; c.g.position.z = az; c.pos = n; }
        else { c.g.position.x += dx / dist * paso; c.g.position.z += dz / dist * paso; c.g.rotation.y = Math.atan2(-dx, -dz); mueve = true; }
      }
    }
    var f = mueve ? Math.sin(tiempo * 8 + c.apoyo) * 0.55 : 0;
    c.pi.rotation.x = f; c.pd.rotation.x = -f; c.bi.rotation.x = -f * 0.7; c.bd.rotation.x = f * 0.7;
  }

  /* ---------- Nicolás, el mensajero, el perro y la aspiradora ---------- */
  var mPelo = 0x2A1D14, mPiel = 0xE3B58F, mRemera = 0x16191B, mJean = 0x2C3F5C;
  function armarJefe() {
    var g = new THREE.Group();
    g.add(fundir(conLote(function () {
      poner(BASE.esf, matriz(0, 0.66, 0, 0.44, 0.58, 0.32), mRemera); poner(BASE.cil, matriz(0, 0.5, 0, 0.38, 0.3, 0.28), mJean);
      caja(0.1, 0.1, 0.01, 0.1, 0.78, -0.155, C.lima);
      poner(BASE.cil, matriz(-0.3, 0.68, 0.04, 0.2, 0.56, 0.2, 0, 0.16), 0x2F6B3C); poner(BASE.cil, matriz(-0.3, 1, 0, 0.16, 0.09, 0.16, 0, 0.16), C.metal);
    }), mCuerpos));
    var bd = new THREE.Group(), bi = new THREE.Group();
    bd.position.set(0.25, 0.86, 0); bi.position.set(-0.25, 0.86, 0);
    var geoB = function (conMate) { return fundir(conLote(function () {
      poner(BASE.cil, matriz(0, -0.14, 0, 0.11, 0.3, 0.11), mRemera); poner(BASE.cil, matriz(0, -0.36, 0, 0.08, 0.2, 0.08), mPiel);
      if (conMate) { esf(0.19, 0, -0.5, -0.06, 0x5A3A22); cil(0.16, 0.02, 0, -0.42, -0.06, C.metal); cil(0.13, 0.015, 0, -0.405, -0.06, 0x6E8B3D); poner(BASE.cil, matriz(0.02, -0.3, -0.08, 0.016, 0.28, 0.016, 0, 0.28, -0.1), C.metal); }
    }), mCuerpos); };
    bd.add(geoB(true)); bi.add(geoB(false));
    var c = fundir(conLote(function () { esf(0.34, 0, 0, 0, mPiel); poner(BASE.esf, matriz(0, 0.06, 0.03, 0.36, 0.28, 0.34), mPelo); }), mCuerpos);
    c.position.y = 1.12;
    var pi = pierna(0, -0.1), pd = pierna(0, 0.1);
    pi.material = pd.material = mCuerpos;
    var pj = fundir(conLote(function () { poner(BASE.cil, matriz(0, -0.19, 0, 0.15, 0.4, 0.15), mJean); caja(0.15, 0.05, 0.24, 0, -0.42, -0.04, C.lima); }), mCuerpos).geometry;
    pi.geometry = pj; pd.geometry = pj;
    var so = new THREE.Mesh(gSombra, mSombra); so.rotation.x = -Math.PI / 2; so.position.y = 0.02;
    g.add(bd); g.add(bi); g.add(c); g.add(pi); g.add(pd); g.add(so);
    g.scale.setScalar(1.06);
    mundo.add(g);
    return { g: g, bd: bd, bi: bi, cabeza: c, pi: pi, pd: pd };
  }
  var nico = armarJefe(), PUESTO = [34.7, 9.1];
  function alPuesto() { nico.paso = 0; nico.g.position.set(PUESTO[0], 0.02, PUESTO[1]); nico.g.rotation.y = -Math.PI / 2; }
  alPuesto();
  var PASEO = [
    { p: PUESTO, mira: -Math.PI / 2, t: 11, apunta: true },
    { p: [34.7, 6.4] }, { p: [39.6, 6.4] }, { p: [39.8, 2.8], mira: 0.9, t: 5 }, { p: [39.6, 6.4] }, { p: [34.7, 6.4] },
    { p: PUESTO, mira: -Math.PI / 2, t: 10, apunta: true },
    { p: [34.4, 12.4], mira: 2.2, t: 6 }
  ];
  nico.paso = 0; nico.espera = 6;
  function moverJefe(dt) {
    var q = PASEO[nico.paso], mueve = false, pos = nico.g.position, apunta = false;
    if (nico.quieto) { q = PASEO[0]; }
    if (nico.espera > 0) { nico.espera -= dt; apunta = !!q.apunta; if (q.mira != null) nico.g.rotation.y += (q.mira - nico.g.rotation.y) * Math.min(1, dt * 5); }
    else {
      var n = PASEO[(nico.paso + 1) % PASEO.length], dx = n.p[0] - pos.x, dz = n.p[1] - pos.z, dist = Math.hypot(dx, dz), pasoV = 1.05 * dt;
      if (dist <= pasoV) { pos.x = n.p[0]; pos.z = n.p[1]; nico.paso = (nico.paso + 1) % PASEO.length; nico.espera = n.t || 0; }
      else { pos.x += dx / dist * pasoV; pos.z += dz / dist * pasoV; nico.g.rotation.y = Math.atan2(-dx, -dz); mueve = true; }
    }
    var f = mueve ? Math.sin(tiempo * 7.5) * 0.5 : 0, ciclo = tiempo % 7, toma = !mueve && ciclo < 1.9, k = toma ? Math.min(1, Math.min(ciclo, 1.9 - ciclo) * 3) : 0;
    nico.pi.rotation.x = f; nico.pd.rotation.x = -f;
    nico.bd.rotation.x = mueve ? -f * 0.5 + 0.5 : 0.75 + k * 1.72;
    nico.bd.rotation.z = -0.1 - k * 0.32;
    nico.bi.rotation.x = apunta ? 1.35 + Math.sin(tiempo * 4) * 0.2 : -f * 0.6 + 0.08;
    nico.cabeza.rotation.x = -k * 0.28 + (apunta ? 0.08 : 0);
    nico.cabeza.rotation.y = apunta ? Math.sin(tiempo * 0.9) * 0.3 : 0;
  }
  /* Lleva cada indicación a su sala y vuelve con el último reporte. */
  var mensajero = caminante(52);
  (function () {
    var carpeta = new THREE.Mesh(BASE.caja, new THREE.MeshBasicMaterial({ color: C.lima, toneMapped: false }));
    carpeta.scale.set(0.05, 0.34, 0.26); carpeta.position.set(0.32, 0.5, 0); mensajero.g.add(carpeta);
  })();
  var INICIO_M = [36.5, 10.7];
  mensajero.g.position.set(INICIO_M[0], 0.02, INICIO_M[1]);
  var cola = [], orden = 0, ids = Object.keys(DEF).filter(function (k) { return k !== 'jefe'; });
  function rutaMensajero(id) {
    var d = DEF[id], p = d.puerta, fuera = p[1] + (p[1] === 16.5 ? -1 : 1), r = [[33.6, 10.4], [33.6, 7.5]];
    if (fuera === 7.5) r.push([p[0], 7.5]); else { r.push([16, 7.5]); r.push([16, 15.5]); r.push([p[0], 15.5]); }
    r.push(p); r.push([p[0], p[1] + (p[1] === 16.5 ? 1.1 : -1.1)]);
    return r;
  }
  function mandar(id, texto) {
    mensajero.ruta = rutaMensajero(id); mensajero.pos = -1; mensajero.dir = 1; mensajero.destino = id; mensajero.texto = texto || null; mensajero.espera = 0.5;
  }
  mensajero.espera = 12; mensajero.pos = -1; mensajero.dir = 1; mensajero.ruta = null;
  function moverMensajero(dt) {
    var c = mensajero, mueve = false;
    if (c.espera > 0) c.espera -= dt;
    else if (!c.ruta) { mandar(ids[orden++ % ids.length]); }
    else {
      var n = c.pos + c.dir, t = n < 0 ? INICIO_M : c.ruta[n];
      if (n >= c.ruta.length) { c.dir = -1; c.espera = 4; c.vuelve = true; c.pos = c.ruta.length; }
      else if (n < -1) { c.ruta = null; c.vuelve = false; c.espera = 9; c.g.rotation.y = 0; c.reporta = c.destino; setTimeoutSimple(function () { c.reporta = null; }, 8); }
      else {
        var dx = t[0] - c.g.position.x, dz = t[1] - c.g.position.z, dist = Math.hypot(dx, dz), v = 1.9 * dt;
        if (dist <= v) { c.g.position.x = t[0]; c.g.position.z = t[1]; c.pos = n; }
        else { c.g.position.x += dx / dist * v; c.g.position.z += dz / dist * v; c.g.rotation.y = Math.atan2(-dx, -dz); mueve = true; }
      }
    }
    var f = mueve ? Math.sin(tiempo * 11) * 0.6 : 0;
    c.pi.rotation.x = f; c.pd.rotation.x = -f; c.bi.rotation.x = -f * 0.7; c.bd.rotation.x = 0.4;
  }
  var relojes = [];
  function setTimeoutSimple(fn, seg) { relojes.push({ t: tiempo + seg, fn: fn }); }
  /* Perro de la oficina: sigue a Nicolás a su ritmo. */
  var perro = (function () {
    var g = new THREE.Group(), col = 0xB5824F;
    g.add(fundir(conLote(function () {
      poner(BASE.esf, matriz(0, 0.3, 0, 0.3, 0.3, 0.62), col); esf(0.27, 0, 0.5, -0.32, col); poner(BASE.esf, matriz(0, 0.46, -0.47, 0.13, 0.11, 0.2), 0xD6B083); esf(0.05, 0, 0.47, -0.57, C.negro);
      poner(BASE.esf, matriz(-0.12, 0.6, -0.3, 0.09, 0.17, 0.07), 0x7A5230); poner(BASE.esf, matriz(0.12, 0.6, -0.3, 0.09, 0.17, 0.07), 0x7A5230);
      [[-0.09, -0.2], [0.09, -0.2], [-0.09, 0.2], [0.09, 0.2]].forEach(function (p) { caja(0.07, 0.2, 0.07, p[0], 0, p[1], col); });
      toro(0.2, 0, 0.42, -0.2, C.lima, Math.PI / 2);
    }), mCuerpos));
    var cola = fundir(conLote(function () { poner(BASE.cil, matriz(0, 0.1, 0, 0.05, 0.24, 0.05, 0, -0.5), col); }), mCuerpos);
    cola.position.set(0, 0.36, 0.3); g.add(cola);
    g.position.set(35.2, 0.02, 8.2);
    mundo.add(g);
    return { g: g, cola: cola };
  })();
  function moverPerro(dt) {
    var dx = nico.g.position.x + 0.9 - perro.g.position.x, dz = nico.g.position.z + 0.5 - perro.g.position.z, d = Math.hypot(dx, dz);
    if (d > 0.5) { perro.g.position.x += dx / d * Math.min(d, 1.1 * dt); perro.g.position.z += dz / d * Math.min(d, 1.1 * dt); perro.g.rotation.y = Math.atan2(-dx, -dz); }
    perro.cola.rotation.y = Math.sin(tiempo * (d > 0.5 ? 16 : 7)) * 0.6;
  }
  var robot = fundir(conLote(function () { cil(0.5, 0.1, 0, 0, 0, 0x22282B); cil(0.28, 0.02, 0, 0.1, 0, C.acero); caja(0.12, 0.02, 0.05, 0, 0.11, -0.16, C.lima); }), mCuerpos);
  robot.position.set(4, 0.02, 7.9); mundo.add(robot);
  var robotDir = 1;
  function moverRobot(dt) {
    robot.position.x += robotDir * 0.5 * dt;
    if (robot.position.x > 30) { robotDir = -1; robot.rotation.y = Math.PI / 2; }
    if (robot.position.x < 1) { robotDir = 1; robot.rotation.y = -Math.PI / 2; }
  }
  /* Partículas: humo de la parrilla y festejo cuando entra algo real. */
  function nube(n, color, tam) {
    var g = new THREE.BufferGeometry(), a = new THREE.Float32BufferAttribute(new Float32Array(n * 3), 3);
    g.setAttribute('position', a);
    var o = new THREE.Points(g, new THREE.PointsMaterial({ color: color || 0xffffff, size: tam, sizeAttenuation: false, transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false, vertexColors: !color }));
    o.frustumCulled = false; o.visible = false; mundo.add(o);
    return o;
  }
  var humo = nube(24, 0xD4D8D2, chico ? 9 : 15), hv = [];
  humo.material.opacity = 0.32;
  for (var hi = 0; hi < 24; hi++) { hv.push(hi / 24); }
  var confeti = nube(260, null, chico ? 4 : 6), cv = [], confetiFin = 0;
  (function () {
    var cols = new Float32Array(780), pal = [new THREE.Color(C.lima), new THREE.Color(C.ambar), new THREE.Color(0xffffff), new THREE.Color(0x7FB8D9)];
    for (var i = 0; i < 260; i++) { pal[i % 4].toArray(cols, i * 3); cv.push([0, 0, 0]); }
    confeti.geometry.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  })();
  function festejar(id) {
    var d = DEF[id] || DEF.jefe, p = confeti.geometry.attributes.position;
    for (var i = 0; i < 260; i++) {
      p.setXYZ(i, d.x + d.w / 2 + (Math.random() - 0.5) * 1.6, 2.4, d.z + d.d / 2 + (Math.random() - 0.5) * 1.6);
      var a = Math.random() * 6.3, r = 1 + Math.random() * 3.2;
      cv[i] = [Math.cos(a) * r, 2.5 + Math.random() * 4, Math.sin(a) * r];
    }
    confeti.visible = true; confetiFin = tiempo + 3.4;
  }
  var asado = false;
  function moverParticulas(dt) {
    humo.visible = asado;
    if (asado) {
      var p = humo.geometry.attributes.position;
      hv.forEach(function (v, i) {
        hv[i] = (v + dt * 0.28) % 1;
        p.setXYZ(i, 33.6 + Math.sin(hv[i] * 7 + i) * (0.1 + hv[i] * 0.3), 1.1 + hv[i] * 2.3, 14.8 + Math.cos(hv[i] * 5 + i) * 0.15);
      });
      p.needsUpdate = true;
    }
    if (confeti.visible) {
      var q = confeti.geometry.attributes.position;
      for (var i = 0; i < 260; i++) {
        cv[i][1] -= 6.5 * dt;
        var y = q.getY(i) + cv[i][1] * dt;
        q.setXYZ(i, q.getX(i) + cv[i][0] * dt, Math.max(0.04, y), q.getZ(i) + cv[i][2] * dt);
      }
      q.needsUpdate = true;
      if (tiempo > confetiFin) confeti.visible = false;
    }
  }

  /* ---------- Cámara ---------- */
  var controles = new Orbit(camara, renderer.domElement);
  controles.enablePan = false;
  controles.enableZoom = !tactil;
  controles.enableRotate = !tactil;
  controles.minZoom = 0.9; controles.maxZoom = 5;
  controles.minPolarAngle = 0.5; controles.maxPolarAngle = 0.98;
  controles.minAzimuthAngle = -0.4; controles.maxAzimuthAngle = 0.7;
  controles.enableDamping = true;
  renderer.domElement.style.touchAction = 'pan-y';

  var v = new THREE.Vector3(), grab = null;
  var capa = document.createElement('div');
  capa.className = 'rotulos';
  var etiquetas = {};
  Object.keys(DEF).forEach(function (id) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'rotulo'; b.dataset.sala3d = id;
    b.onclick = function () { opciones.elegir(id); };
    b.onmouseenter = function () { sobre = id; }; b.onmouseleave = function () { if (sobre === id) sobre = null; };
    capa.appendChild(b); etiquetas[id] = b;
  });

  var globoJ = document.createElement('div'), globoM = document.createElement('div');
  globoJ.className = 'globo globo-jefe'; globoM.className = 'globo globo-mensajero'; globoJ.hidden = globoM.hidden = true;
  capa.appendChild(globoJ); capa.appendChild(globoM);
  var frases = [], reportes = {}, fraseI = 0, fraseCambio = 0, fraseFija = null;
  function ponerGlobo(el, grupo, alto, texto) {
    if (!texto || (chico && !foco)) { el.hidden = true; return; }
    v.copy(grupo.position).setY(alto).add(mundo.position).project(camara);
    var w = cont.clientWidth, h = cont.clientHeight, x = (v.x + 1) / 2 * w, y = (1 - v.y) / 2 * h;
    if (x < 20 || x > w || y < 20 || y > h) { el.hidden = true; return; }
    if (el.textContent !== texto) el.textContent = texto;
    el.hidden = false;
    el.style.transform = 'translate(-50%,-100%) translate(' + x.toFixed(0) + 'px,' + (y - 8).toFixed(0) + 'px)';
  }
  function globos() {
    if (grab) return;
    if (tiempo > fraseCambio) { fraseCambio = tiempo + 7; fraseI++; if (fraseFija && tiempo > fraseFija.hasta) fraseFija = null; }
    var q = PASEO[nico.paso], t = fraseFija ? fraseFija.t : (nico.espera > 0 && q.apunta && frases.length ? frases[fraseI % frases.length] : null);
    ponerGlobo(globoJ, nico.g, 1.6, t);
    ponerGlobo(globoM, mensajero.g, 1.55, mensajero.reporta ? reportes[mensajero.reporta] : null);
  }

  var dest = { t: new THREE.Vector3(), z: 1, activo: false }, casa = new THREE.Vector3(), ancla = new THREE.Vector3();
  function medir() {
    if (grab) return;
    var w = cont.clientWidth || 800, h = cont.clientHeight || 520, a = w / h, p = new THREE.Vector3();
    var offset = camara.position.clone().sub(controles.target), t0 = new THREE.Vector3(0, 0.2, 0);
    camara.position.copy(t0).add(offset); camara.lookAt(t0); camara.updateMatrixWorld();
    var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    [-0.8, TOTAL + 0.8].forEach(function (x) { [-0.4, FONDO + 1.8].forEach(function (z) { [-0.6, 3.1].forEach(function (y) {
      p.set(x, y, z).add(mundo.position).applyMatrix4(camara.matrixWorldInverse);
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }); }); });
    var mitad = Math.max((maxY - minY) / 2, (maxX - minX) / 2 / a) * 1.02;
    var cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    camara.left = -mitad * a; camara.right = mitad * a; camara.top = mitad; camara.bottom = -mitad;
    camara.updateProjectionMatrix();
    var der = new THREE.Vector3().setFromMatrixColumn(camara.matrixWorld, 0), arr = new THREE.Vector3().setFromMatrixColumn(camara.matrixWorld, 1);
    casa.copy(t0).addScaledVector(der, cx).addScaledVector(arr, cy);
    controles.target.copy(foco ? controles.target : casa);
    camara.position.copy(controles.target).add(offset);
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px';
    if (foco) irA(foco, true); else if (!dest.activo) { camara.zoom = 1; camara.updateProjectionMatrix(); }
  }
  /* Encuadra una sala y deja lugar para la ficha, que en pantallas anchas va a la derecha. */
  function irA(id, inmediato) {
    if (!id) { dest.t.copy(casa); dest.z = 1; dest.activo = true; return; }
    var s = DEF[id], p = new THREE.Vector3(), w = cont.clientWidth, h = cont.clientHeight;
    camara.updateMatrixWorld();
    var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    [s.x, s.x + s.w].forEach(function (x) { [s.z, s.z + s.d].forEach(function (z) { [0, 2.2].forEach(function (y) {
      p.set(x, y, z).add(mundo.position).applyMatrix4(camara.matrixWorldInverse);
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }); }); });
    var panel = w >= 980 ? 372 : 0, usable = (w - panel) / w;
    var z = Math.min(controles.maxZoom, Math.min((camara.right - camara.left) * usable * 0.9 / (maxX - minX), (camara.top - camara.bottom) * 0.82 / (maxY - minY)));
    var der = new THREE.Vector3().setFromMatrixColumn(camara.matrixWorld, 0), arr = new THREE.Vector3().setFromMatrixColumn(camara.matrixWorld, 1);
    var unidad = (camara.right - camara.left) / z / w;
    p.set(s.x + s.w / 2, 0.9, s.z + s.d / 2).add(mundo.position);
    dest.t.copy(p).addScaledVector(der, panel / 2 * unidad).addScaledVector(arr, 0.02 * h * unidad);
    dest.z = z; dest.activo = true;
    if (inmediato) acercar(1);
  }
  function acercar(k) {
    ancla.copy(controles.target).lerp(dest.t, k).sub(controles.target);
    controles.target.add(ancla); camara.position.add(ancla);
    camara.zoom += (dest.z - camara.zoom) * k;
    camara.updateProjectionMatrix();
    if (controles.target.distanceTo(dest.t) < 0.01 && Math.abs(camara.zoom - dest.z) < 0.004) dest.activo = false;
  }

  var rc = new THREE.Raycaster(), m2 = new THREE.Vector2();
  function ubicar() {
    var w = cont.clientWidth, h = cont.clientHeight;
    Object.keys(etiquetas).forEach(function (id) {
      var s = DEF[id], b = etiquetas[id];
      v.set(s.x + s.w / 2, 1.1, s.z + s.d - 0.5).add(mundo.position).project(camara);
      var x = (v.x + 1) / 2 * w, y = (1 - v.y) / 2 * h;
      b.classList.toggle('lejos', foco === id || x < 0 || x > w || y < 0 || y > h);
      b.style.transform = 'translate(-50%,-50%) translate(' + x.toFixed(0) + 'px,' + y.toFixed(0) + 'px)';
    });
  }
  function salaEn(ev) {
    var r = renderer.domElement.getBoundingClientRect();
    m2.set((ev.clientX - r.left) / r.width * 2 - 1, -(ev.clientY - r.top) / r.height * 2 + 1);
    rc.setFromCamera(m2, camara);
    var go = rc.intersectObjects(Object.keys(salas).map(function (k) { return salas[k].objeto; }))[0];
    return go ? go.object.userData.sala : null;
  }
  var bajo = null;
  renderer.domElement.addEventListener('pointerdown', function (ev) { bajo = [ev.clientX, ev.clientY]; });
  renderer.domElement.addEventListener('click', function (ev) {
    if (bajo && Math.hypot(ev.clientX - bajo[0], ev.clientY - bajo[1]) > 7) return;
    var id = salaEn(ev);
    if (id) opciones.elegir(id); else if (foco) opciones.salir();
  });
  if (!tactil) renderer.domElement.addEventListener('pointermove', function (ev) {
    if (ev.buttons) return;
    sobre = salaEn(ev);
    renderer.domElement.style.cursor = sobre ? 'pointer' : 'grab';
  });

  /* ---------- Luz del día real de Buenos Aires ---------- */
  var cNoche = new THREE.Color(0x0A1311), cDia = new THREE.Color(0x24382E), vNoche = new THREE.Color(0x12203A), vDia = new THREE.Color(0xBFE3F2), vOcaso = new THREE.Color(0xF2A65E), tmp = new THREE.Color();
  var dia = -1, nivelNoche = 0.5;
  function aplicarLuz(min) {
    var d = luzDelDia(min);
    if (Math.abs(d - dia) < 0.01) return;
    dia = d;
    nivelNoche = 1 - d;
    tmp.copy(cNoche).lerp(cDia, d); renderer.setClearColor(tmp);
    cielo.intensity = 1.3 + d * 0.75; cielo.color.setHex(d > 0.5 ? 0xffffff : 0xB7C8E8);
    sol.intensity = 0.45 + d * 2.1; sol.color.setHex(d > 0.5 ? 0xFFF3DE : 0x9DB6E6);
    var o = Math.sin(d * Math.PI);
    mVentana.color.copy(vNoche).lerp(vDia, d).lerp(vOcaso, o * 0.55);
    renderer.shadowMap.needsUpdate = true;
  }

  function animarSala(s, dt) {
    var t = tiempo, a = s.activa;
    s.personas.forEach(function (p) {
      var f = a ? Math.sin(t * 14 + p.fase) : Math.sin(t * 1.1 + p.fase) * 0.2;
      p.bi.rotation.x = 1.2 + f * 0.13; p.bd.rotation.x = 1.2 - f * 0.13;
      p.cabeza.rotation.y = a ? Math.sin(t * 0.8 + p.fase) * 0.22 : Math.sin(t * 0.3 + p.fase) * 0.55;
      p.cabeza.rotation.x = a ? 0.1 : 0.02;
    });
    s.mPantalla.color.setScalar(a ? 1 : 0.42);
    if (a && !quieto) s.mPantalla.map.offset.y = (s.mPantalla.map.offset.y + dt * 0.35) % 1;
    s.zocalo.color.copy(s.color);
    if (a) s.zocalo.color.multiplyScalar(0.72 + Math.sin(t * 3) * 0.28);
    var base = 0.06 + nivelNoche * 0.3;
    var meta = base + (a ? 0.2 : 0) + (elegida === s.id ? 0.05 : 0) + (sobre === s.id ? 0.14 : 0);
    s.pozo.opacity += (meta - s.pozo.opacity) * Math.min(1, dt * 8);
    s.mFoco.color.setScalar(a ? 1 : 0.5);
    if (s.mLedA) { var on = Math.sin(t * (a ? 8 : 2)) > 0; s.mLedA.color.copy(s.color).multiplyScalar(on ? 1 : 0.2); s.mLedB.color.copy(s.color).multiplyScalar(on ? 0.2 : 1); }
  }

  var parado = false;
  function vuelta(ahora) {
    if (parado) return;
    requestAnimationFrame(vuelta);
    if (document.hidden || !cont.offsetParent) return;
    var dt = Math.min(0.05, (ahora - ultimo) / 1000 || 0.016); ultimo = ahora;
    if (grab && grab.manual) return;
    paso(dt);
    if (grab) { cuadroVideo(grab.t); grab.t += dt; if (grab.t >= grab.dur) terminarVideo(); return; }
    if (dest.activo) acercar(quieto ? 1 : 1 - Math.pow(0.0025, dt));
    controles.update();
    ubicar();
    globos();
    renderer.render(escena, camara);
  }
  function paso(dt) {
    if (!quieto || grab) {
      tiempo += dt;
      gente.forEach(function (c) { mover(c, dt); });
      moverJefe(dt); moverMensajero(dt); moverPerro(dt); moverRobot(dt); moverParticulas(dt);
      holo.rotation.y += dt * 0.35; holo.position.y = 1.3 + Math.sin(tiempo * 1.4) * 0.03;
      relojes = relojes.filter(function (r) { if (tiempo >= r.t) { r.fn(); return false; } return true; });
    }
    Object.keys(salas).forEach(function (k) { animarSala(salas[k], dt); });
  }

  /* ---------- Modo video: recorre la oficina en vertical y arma un Reel solo con datos públicos ---------- */
  var VW = 1080, VH = 1920;
  function lista(fn) { return Math.max(0, Math.min(1, fn)); }
  function camaraToma(a, b, k, lt) {
    var e = k * k * (3 - 2 * k), mez = function (x, y) { return x + (y - x) * e; };
    var t = [mez(a.p[0], b.p[0]), mez(a.p[1], b.p[1]), mez(a.p[2], b.p[2])];
    var alto = mez(a.alto, b.alto) * (1 - 0.05 * lt) + Math.sin(e * Math.PI) * 2.4, az = mez(a.az, b.az) + lt * 0.08, el = mez(a.el, b.el);
    var obj = new THREE.Vector3(t[0], t[1], t[2]).add(mundo.position);
    camara.position.set(obj.x + Math.sin(az) * Math.cos(el) * 70, obj.y + Math.sin(el) * 70, obj.z + Math.cos(az) * Math.cos(el) * 70);
    camara.up.set(0, 1, 0); camara.lookAt(obj);
    camara.zoom = 1; camara.left = -alto * VW / VH; camara.right = alto * VW / VH; camara.top = alto; camara.bottom = -alto;
    camara.updateProjectionMatrix();
  }
  function renglones(g, t, ancho) {
    var o = [], l = '';
    String(t || '').split(' ').forEach(function (p) { var n = l ? l + ' ' + p : p; if (g.measureText(n).width > ancho && l) { o.push(l); l = p; } else l = n; });
    if (l) o.push(l);
    return o;
  }
  function dibujarTextos(g, tm, lt, seg) {
    var ap = lista(seg / 0.28), sale = lista((tm.dur - seg) / 0.2), a = ap * sale, y = 1190 + (1 - ap) * 34;
    g.save();
    if (tm.fin) {
      g.fillStyle = 'rgba(10,19,17,' + (0.9 * lista(seg / 0.5)).toFixed(3) + ')'; g.fillRect(0, 0, VW, VH);
      g.globalAlpha = lista(seg / 0.5);
      g.fillStyle = hexa(C.lima); g.font = '700 190px ' + FUENTE; g.fillText('Nexo Fit', 76, 880);
      g.fillStyle = '#EAF1E4'; g.font = '600 86px ' + FUENTE; renglones(g, tm.t, 900).forEach(function (l, i) { g.fillText(l, 80, 1000 + i * 96); });
      g.fillStyle = hexa(C.lima); g.font = '600 64px ' + FUENTE; g.fillText('nexofitt.com.ar', 80, 1220);
      g.restore(); return;
    }
    var d = g.createLinearGradient(0, 960, 0, 1760);
    d.addColorStop(0, 'rgba(8,15,13,0)'); d.addColorStop(0.24, 'rgba(8,15,13,.84)'); d.addColorStop(0.72, 'rgba(8,15,13,.84)'); d.addColorStop(1, 'rgba(8,15,13,0)');
    g.fillStyle = d; g.fillRect(0, 960, VW, 800);
    g.globalAlpha = a;
    if (tm.cifra != null) { g.fillStyle = hexa(C.lima); g.font = '700 230px ' + FUENTE; g.fillText(String(tm.cifra), 72, y + 110); y += 196; }
    g.fillStyle = '#FFFFFF'; g.font = '700 ' + (tm.cifra != null ? 88 : 112) + 'px ' + FUENTE;
    renglones(g, tm.t, 880).forEach(function (l) { g.fillText(l, 76, y + 40); y += tm.cifra != null ? 94 : 118; });
    if (tm.s) { g.fillStyle = hexa(C.lima); g.font = '600 72px ' + FUENTE; renglones(g, tm.s, 880).forEach(function (l) { g.fillText(l, 78, y + 36); y += 82; }); }
    g.restore();
    if (tm.globo && lt > 0.12) {
      v.copy(nico.g.position).setY(1.62).add(mundo.position).project(camara);
      var x = (v.x + 1) / 2 * VW, yy = (1 - v.y) / 2 * VH;
      g.save(); g.font = '500 46px ' + TEXTO; g.textAlign = 'left';
      var ls = renglones(g, tm.globo, 560), an = Math.min(640, Math.max.apply(null, ls.map(function (l) { return g.measureText(l).width; })) + 56), al = ls.length * 58 + 34;
      var bx = Math.max(60, Math.min(VW - an - 60, x - an / 2)), by = yy - al - 34;
      g.fillStyle = 'rgba(9,15,13,.94)'; g.strokeStyle = hexa(C.lima); g.lineWidth = 5;
      g.beginPath(); g.roundRect(bx, by, an, al, 22); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(x - 20, by + al - 2); g.lineTo(x, by + al + 28); g.lineTo(x + 20, by + al - 2); g.closePath(); g.fill();
      g.fillStyle = '#EAF1E4'; ls.forEach(function (l, i) { g.fillText(l, bx + 28, by + 58 + i * 58); });
      g.restore();
    }
  }
  function cuadroVideo(t) {
    var acu = 0, i = 0, l = grab.tomas;
    while (i < l.length - 1 && t >= acu + l[i].dur) { acu += l[i].dur; i++; }
    var tm = l[i], prev = l[Math.max(0, i - 1)], seg = t - acu, lt = seg / tm.dur;
    camaraToma(i ? prev : tm, tm, lista(seg / 0.75), lt);
    renderer.render(escena, camara);
    var g = grab.g;
    g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    g.drawImage(renderer.domElement, 0, 0, VW, VH);
    g.fillStyle = 'rgba(9,15,13,.72)'; g.beginPath(); g.roundRect(64, 236, 246, 84, 14); g.fill();
    g.fillStyle = hexa(C.lima); g.font = '700 62px ' + FUENTE; g.fillText('Nexo Fit', 88, 298);
    dibujarTextos(g, tm, lt, seg);
    if (grab.avance) grab.avance(t / grab.dur);
  }
  function prepararVideo(op) {
    var c = lienzo(VW, VH);
    grab = { t: 0, tomas: op.tomas, dur: op.tomas.reduce(function (a, b) { return a + b.dur; }, 0), c: c, g: c.getContext('2d'), manual: !!op.manual, avance: op.avance, fin: op.fin,
      guardado: { pos: camara.position.clone(), tgt: controles.target.clone(), zoom: camara.zoom, up: camara.up.clone() } };
    controles.enabled = false; capa.style.visibility = 'hidden';
    publico = true; repintar();
    salasColor(true);
    fraseFija = null; asado = true;
    alPuesto(); nico.espera = 60; tiempo = 5.4; /* a los dos segundos toma el mate */
    renderer.setPixelRatio(1); renderer.setSize(VW, VH, false);
    return grab;
  }
  function salasColor(pub) {
    Object.keys(salas).forEach(function (k) {
      var s = salas[k];
      if (pub) { s.colorReal = s.color.getHex(); s.color.setHex(C.lima); if (bloques[k]) bloques[k].material.color.setHex(C.lima); }
      else if (s.colorReal != null) { s.color.setHex(s.colorReal); if (bloques[k]) bloques[k].material.color.setHex(s.colorReal); }
    });
  }
  function terminarVideo() {
    var g = grab; grab = null;
    publico = false; salasColor(false); repintar();
    capa.style.visibility = '';
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, chico ? 1.6 : 2));
    camara.position.copy(g.guardado.pos); controles.target.copy(g.guardado.tgt); camara.up.copy(g.guardado.up); camara.zoom = g.guardado.zoom;
    controles.enabled = true; nico.espera = 2;
    medir();
    if (ultimoDato) asado = !!(ultimoDato.info && ultimoDato.info.asado);
    if (g.rec && g.rec.state === 'recording') g.rec.stop(); else if (g.fin) g.fin(null);
  }
  function grabarVideo(op) {
    if (grab) return;
    var g = prepararVideo(op), tipo = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'].filter(function (t) { return window.MediaRecorder && MediaRecorder.isTypeSupported(t); })[0];
    cuadroVideo(0);
    var trozos = [], rec = new MediaRecorder(g.c.captureStream(30), { mimeType: tipo, videoBitsPerSecond: 9000000 });
    rec.ondataavailable = function (e) { if (e.data && e.data.size) trozos.push(e.data); };
    rec.onstop = function () { if (op.fin) op.fin(new Blob(trozos, { type: tipo }), tipo); };
    g.rec = rec; rec.start(500);
    return g.c;
  }
  function sacarFoto(op) {
    if (grab) return;
    var g = prepararVideo({ tomas: op.tomas, manual: true });
    paso(0.016); cuadroVideo(op.tomas[0].dur * 0.6);
    g.c.toBlob(function (b) { terminarVideo(); op.fin(b); }, 'image/png');
  }

  var fuentesListas = false, ultimoDato = null, publico = false;
  function repintar() {
    if (!ultimoDato) return;
    var e = ultimoDato.estados, info = ultimoDato.info || {};
    Object.keys(e).forEach(function (id) { if (id === 'jefe') return; if (salas[id]) pintarMural(salas[id], e[id]); });
    pintarMando(salas.jefe.mural, e);
    pintarCartel(cartel, info); pintarTablero(tablero, info);
  }
  if (document.fonts && document.fonts.load) {
    Promise.all(['600 46px "Barlow Condensed"', '700 118px "Barlow Condensed"', '500 26px Barlow', '600 28px Barlow'].map(function (f) { return document.fonts.load(f, 'Nexo Fit 0123'); }))
      .catch(function () {}).then(function () { fuentesListas = true; repintar(); });
  }

  var api = {
    montar: function (nuevo) {
      cont = nuevo;
      cont.appendChild(renderer.domElement);
      cont.appendChild(capa);
      medir();
    },
    enfocar: function (id) { foco = id || null; irA(foco); },
    /* Nicolás dice la indicación y el mensajero la lleva a la sala. */
    ordenar: function (id, texto) { fraseFija = { t: texto, hasta: tiempo + 9 }; fraseCambio = tiempo + 9; alPuesto(); nico.espera = 9; mensajero.g.position.set(INICIO_M[0], 0.02, INICIO_M[1]); mandar(id, texto); },
    festejar: festejar,
    grabar: grabarVideo, foto: sacarFoto,
    /* Armado cuadro por cuadro: da un video parejo aunque la máquina sea lenta. */
    videoPreparar: function (tomas) { prepararVideo({ tomas: tomas, manual: true }); return grab.dur; },
    videoCuadro: function (t, dt) { paso(dt); cuadroVideo(t); return grab.c.toDataURL('image/jpeg', 0.93); },
    /* Para pruebas y vistas previas: saltea la animación. */
    fijar: function (id) { foco = id || null; if (foco) irA(foco, true); else { irA(null); acercar(1); } },
    actualizar: function (estados, sala, info) {
      elegida = sala;
      ultimoDato = { estados: estados, info: info };
      Object.keys(estados).forEach(function (id) {
        var e = estados[id], s = salas[id], b = etiquetas[id];
        if (!s) return;
        s.activa = !!e.trabajando;
        s.color.setHex(LUZ[e.estado] || C.gris);
        if (bloques[id]) bloques[id].material.color.setHex(LUZ[e.estado] || C.gris);
        b.dataset.estado = e.estado;
        b.classList.toggle('trabajando', !!e.trabajando);
        b.setAttribute('aria-pressed', String(sala === id));
        b.setAttribute('aria-label', e.nombre + ': ' + e.texto);
        b.textContent = '';
        var n = document.createElement('b'), t = document.createElement('span');
        n.textContent = (chico && CORTO[id]) || e.nombre; t.textContent = e.texto;
        b.appendChild(n); b.appendChild(t);
      });
      if (info && info.minutos != null) aplicarLuz(info.minutos);
      if (info) { frases = info.frases || []; reportes = info.reportes || {}; asado = !!info.asado; }
      repintar();
    }
  };
  window.addEventListener('resize', medir);
  if (window.ResizeObserver) new ResizeObserver(medir).observe(cont);
  aplicarLuz(720);
  api.montar(cont);
  requestAnimationFrame(vuelta);
  return api;
}

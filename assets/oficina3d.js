/* Oficina Nexo Fit en 3D: cada sector es una sala. Las personas representan el estado real que llega de la oficina. */
var C = { piso: 0x1E2A37, base: 0x10171F, muro: 0xFDFAF5, mesa: 0x34475A, oscuro: 0x0B1117, lima: 0xA5CC21, ambar: 0xF4B73F, rojo: 0xFF6A5C, gris: 0x8996A3 };
var LUZ = { orden: C.lima, atencion: C.ambar, frenada: C.rojo, nada: C.gris };
var SALAS = {
  direccion: { x: 0, z: 0, w: 8, d: 5, puestos: [[4, 2.6, Math.PI]], extra: 'mesa' },
  comercial: { x: 8, z: 0, w: 16, d: 5, puestos: [[11, 3.2, Math.PI], [15, 3.2, Math.PI], [19, 3.2, Math.PI]], extra: 'mostrador' },
  redes: { x: 0, z: 5, w: 6, d: 5, puestos: [[1.8, 8.2, Math.PI], [4.2, 8.2, Math.PI]], extra: 'aro' },
  marketing: { x: 6, z: 5, w: 6, d: 5, puestos: [[7.8, 8.2, Math.PI], [10.2, 8.2, Math.PI]], extra: 'pizarra' },
  diseno: { x: 12, z: 5, w: 6, d: 5, puestos: [[13.8, 8.2, Math.PI], [16.2, 8.2, Math.PI]], extra: 'pantalla' },
  investigacion: { x: 18, z: 5, w: 6, d: 5, puestos: [[19.8, 8.2, Math.PI], [22.2, 8.2, Math.PI]], extra: 'estantes' },
  administracion: { x: 0, z: 10, w: 12, d: 5, puestos: [[3, 13.2, Math.PI], [7, 13.2, Math.PI]], extra: 'caja' },
  operaciones: { x: 12, z: 10, w: 12, d: 5, puestos: [[15, 13.2, Math.PI], [18, 13.2, Math.PI]], extra: 'racks' }
};
var ROPA = [0xA5CC21, 0xFDFAF5, 0xF4B73F, 0x7FB2C9, 0xD9A6C9, 0x9CB380];
var PIEL = [0xE8BE9B, 0xC68F66, 0x8D5A3C, 0xF0D2B6];

export function crear(THREE, Orbit, cont, opciones) {
  var quieto = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(C.base);
  renderer.shadowMap.enabled = window.innerWidth > 700;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  var escena = new THREE.Scene();
  var camara = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 200);
  camara.position.set(9, 28, 24);
  escena.add(new THREE.HemisphereLight(0xffffff, 0x223344, 1.5));
  var sol = new THREE.DirectionalLight(0xffffff, 1.9);
  sol.position.set(10, 26, 12);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -18, right: 18, top: 14, bottom: -14, near: 1, far: 60 });
  escena.add(sol);

  var mundo = new THREE.Group();
  mundo.position.set(-12, 0, -7.5);
  escena.add(mundo);

  function mat(color, extra) { return new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.75, metalness: 0.05 }, extra || {})); }
  function caja(w, h, d, x, y, z, m, padre) {
    var o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true;
    (padre || mundo).add(o);
    return o;
  }
  var mMuro = mat(C.muro), mMesa = mat(C.mesa), mOscuro = mat(C.oscuro), mGris = mat(C.gris);

  caja(25, 0.4, 16, 12, -0.25, 7.5, mat(C.oscuro));

  var salas = {}, tiempo = 0, ultimo = 0, elegida = null;

  function muro(x1, z1, x2, z2, alto) {
    var largo = Math.hypot(x2 - x1, z2 - z1), horiz = z1 === z2;
    caja(horiz ? largo : 0.14, alto, horiz ? 0.14 : largo, (x1 + x2) / 2, alto / 2, (z1 + z2) / 2, mMuro);
  }

  function persona(i, x, z, giro, padre) {
    var g = new THREE.Group();
    g.position.set(x, 0, z); g.rotation.y = giro;
    var ropa = mat(ROPA[i % ROPA.length]), piel = mat(PIEL[(i * 3 + 1) % PIEL.length]);
    var torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.34, 4, 10), ropa);
    torso.position.y = 0.72; torso.castShadow = true; g.add(torso);
    var cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), piel);
    cabeza.position.y = 1.16; cabeza.castShadow = true; g.add(cabeza);
    var pelo = new THREE.Mesh(new THREE.SphereGeometry(0.175, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), mat([0x2A1D14, 0x4A3222, 0x111111, 0x7A5A3A][i % 4]));
    pelo.position.y = 1.18; g.add(pelo);
    var bi = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.3, 3, 8), ropa), bd = bi.clone();
    bi.position.set(-0.2, 0.74, 0.14); bd.position.set(0.2, 0.74, 0.14);
    bi.rotation.x = bd.rotation.x = -1.2;
    g.add(bi); g.add(bd);
    padre.add(g);
    return { g: g, bi: bi, bd: bd, cabeza: cabeza, fase: i * 1.7 };
  }

  function puesto(i, p, sala) {
    var x = p[0], z = p[1];
    caja(1.5, 0.08, 0.7, x, 0.72, z - 0.55, mMesa);
    caja(0.08, 0.7, 0.6, x - 0.68, 0.36, z - 0.55, mMesa);
    caja(0.08, 0.7, 0.6, x + 0.68, 0.36, z - 0.55, mMesa);
    var pant = mat(0x111820, { emissive: C.lima, emissiveIntensity: 0.2 });
    caja(0.72, 0.42, 0.04, x, 1.06, z - 0.78, mOscuro);
    var brillo = caja(0.64, 0.34, 0.02, x, 1.06, z - 0.75, pant);
    brillo.castShadow = false;
    caja(0.46, 0.08, 0.46, x, 0.42, z + 0.05, mOscuro);
    caja(0.46, 0.5, 0.06, x, 0.72, z + 0.3, mOscuro);
    var yo = persona(i, x, z - 0.02, p[2], mundo);
    sala.pantallas.push(pant); sala.personas.push(yo);
  }

  function muebles(id, s, sala) {
    var cx = s.x + s.w / 2;
    if (s.extra === 'mesa') {
      var tabla = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.08, 28), mMesa);
      tabla.position.set(s.x + 1.6, 0.72, s.z + 3.5); tabla.scale.z = 0.7; tabla.castShadow = true; mundo.add(tabla);
      caja(0.2, 0.7, 0.2, s.x + 1.6, 0.36, s.z + 3.5, mMesa);
    }
    if (s.extra === 'mostrador') caja(10, 0.9, 0.5, cx, 0.45, s.z + 0.8, mMesa);
    if (s.extra === 'aro') {
      var aro = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.05, 10, 32), mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.9 }));
      aro.position.set(s.x + 1, 1.5, s.z + 0.5); mundo.add(aro);
      caja(0.05, 1.1, 0.05, s.x + 1, 0.55, s.z + 0.5, mGris);
    }
    if (s.extra === 'pizarra') { caja(3, 1.1, 0.06, cx, 1.2, s.z + 0.15, mMuro); caja(2.6, 0.08, 0.02, cx, 1.35, s.z + 0.2, mat(C.lima)); caja(1.7, 0.08, 0.02, cx - 0.4, 1.15, s.z + 0.2, mat(C.ambar)); }
    if (s.extra === 'pantalla') { var p = mat(0x111820, { emissive: C.lima, emissiveIntensity: 0.3 }); caja(3, 1.2, 0.08, cx, 1.25, s.z + 0.2, p); sala.pantallas.push(p); }
    if (s.extra === 'estantes') for (var e = 0; e < 3; e++) caja(4, 0.08, 0.5, cx, 0.6 + e * 0.5, s.z + 0.45, mMesa);
    if (s.extra === 'caja') { caja(1.1, 1.2, 0.9, s.x + 10.4, 0.6, s.z + 1, mOscuro); caja(0.3, 0.3, 0.04, s.x + 10.4, 0.7, s.z + 1.47, mGris); }
    if (s.extra === 'racks') for (var r = 0; r < 3; r++) {
      caja(1.1, 1.8, 0.8, s.x + 8 + r * 1.3, 0.9, s.z + 1, mOscuro);
      var led = mat(0x000000, { emissive: C.lima, emissiveIntensity: 1 });
      caja(0.8, 0.06, 0.02, s.x + 8 + r * 1.3, 1.3, s.z + 1.41, led).castShadow = false;
      caja(0.8, 0.06, 0.02, s.x + 8 + r * 1.3, 0.9, s.z + 1.41, led).castShadow = false;
      sala.leds.push(led);
    }
  }

  Object.keys(SALAS).forEach(function (id, n) {
    var s = SALAS[id];
    var mPiso = mat(C.piso, { emissive: C.gris, emissiveIntensity: 0.05 });
    var piso = new THREE.Mesh(new THREE.BoxGeometry(s.w - 0.08, 0.1, s.d - 0.08), mPiso);
    piso.position.set(s.x + s.w / 2, -0.05, s.z + s.d / 2); piso.receiveShadow = true; piso.userData.sala = id;
    mundo.add(piso);
    var sala = { id: id, def: s, piso: mPiso, pantallas: [], personas: [], leds: [], activa: false, color: new THREE.Color(C.gris), caminante: null, objeto: piso };
    salas[id] = sala;
    muebles(id, s, sala);
    s.puestos.forEach(function (p, i) { puesto(n * 3 + i, p, sala); });
    sala.caminante = persona(n + 20, s.x + 1, s.z + 2, 0, mundo);
    sala.caminante.g.visible = false;
  });

  // Muros: los del fondo altos, los del frente bajos para ver adentro, con huecos de puerta.
  muro(0, 0, 24, 0, 1.9); muro(0, 0, 0, 15, 1.9);
  muro(8, 0, 8, 1.4, 1.2); muro(8, 2.6, 8, 5, 1.2);
  muro(0, 5, 2, 5, 1.2); muro(3.2, 5, 14, 5, 1.2); muro(15.2, 5, 24, 5, 1.2);
  muro(6, 5, 6, 6.6, 1); muro(6, 7.8, 6, 10, 1); muro(12, 5, 12, 6.6, 1); muro(12, 7.8, 12, 10, 1); muro(18, 5, 18, 6.6, 1); muro(18, 7.8, 18, 10, 1);
  muro(0, 10, 4, 10, 1); muro(5.2, 10, 19, 10, 1); muro(20.2, 10, 24, 10, 1);
  muro(12, 10, 12, 11.6, 0.8); muro(12, 12.8, 12, 15, 0.8);
  muro(24, 0, 24, 15, 0.35); muro(0, 15, 3, 15, 0.35); muro(4.6, 15, 24, 15, 0.35);

  var controles = new Orbit(camara, renderer.domElement);
  controles.target.set(0, 0.2, 0);
  controles.enablePan = false;
  controles.enableZoom = window.innerWidth > 700;
  controles.minZoom = 0.8; controles.maxZoom = 2.6;
  controles.minPolarAngle = 0.55; controles.maxPolarAngle = 1.05;
  controles.minAzimuthAngle = -0.5; controles.maxAzimuthAngle = 1.1;
  controles.enableDamping = true;
  renderer.domElement.style.touchAction = 'pan-y';

  var capa = document.createElement('div');
  capa.className = 'etiquetas';
  var etiquetas = {};
  Object.keys(SALAS).forEach(function (id) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'etiqueta'; b.dataset.sala3d = id;
    b.onclick = function () { opciones.elegir(id); };
    capa.appendChild(b); etiquetas[id] = b;
  });

  // Encuadra todo el local según el tamaño de la pantalla, en vez de usar una medida fija.
  function medir() {
    var w = cont.clientWidth || 800, h = cont.clientHeight || 520, a = w / h, p = new THREE.Vector3();
    var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    camara.lookAt(0, 0.2, 0); camara.updateMatrixWorld();
    [0, 24].forEach(function (x) { [0, 15].forEach(function (z) { [0, 2.9].forEach(function (y) {
      p.set(x, y, z).add(mundo.position).applyMatrix4(camara.matrixWorldInverse);
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x); minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }); }); });
    var mitad = Math.max((maxY - minY) / 2, (maxX - minX) / 2 / a) * 1.06, cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    camara.left = cx - mitad * a; camara.right = cx + mitad * a; camara.top = cy + mitad; camara.bottom = cy - mitad;
    camara.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px';
  }

  var v = new THREE.Vector3(), rc = new THREE.Raycaster(), m2 = new THREE.Vector2();
  function ubicar() {
    var w = cont.clientWidth, h = cont.clientHeight;
    Object.keys(etiquetas).forEach(function (id) {
      var s = SALAS[id];
      v.set(s.x + s.w / 2, 2.1, s.z + s.d / 2).add(mundo.position).project(camara);
      etiquetas[id].style.transform = 'translate(-50%,-100%) translate(' + ((v.x + 1) / 2 * w).toFixed(0) + 'px,' + ((1 - v.y) / 2 * h).toFixed(0) + 'px)';
    });
  }

  renderer.domElement.addEventListener('click', function (ev) {
    var r = renderer.domElement.getBoundingClientRect();
    m2.set((ev.clientX - r.left) / r.width * 2 - 1, -(ev.clientY - r.top) / r.height * 2 + 1);
    rc.setFromCamera(m2, camara);
    var go = rc.intersectObjects(Object.keys(salas).map(function (k) { return salas[k].objeto; }))[0];
    if (go) opciones.elegir(go.object.userData.sala);
  });

  function animarSala(s, dt) {
    var t = tiempo;
    s.personas.forEach(function (p) {
      var f = s.activa ? Math.sin(t * 13 + p.fase) : 0;
      p.bi.rotation.x = -1.2 + f * 0.14; p.bd.rotation.x = -1.2 - f * 0.14;
      p.cabeza.rotation.y = s.activa ? Math.sin(t * 0.8 + p.fase) * 0.3 : 0.4;
      p.cabeza.position.y = 1.16 + (s.activa ? Math.sin(t * 2 + p.fase) * 0.012 : 0);
    });
    s.pantallas.forEach(function (m, i) {
      m.emissive.copy(s.color);
      m.emissiveIntensity = s.activa ? 0.65 + Math.sin(t * 9 + i * 2) * 0.22 : 0.16;
    });
    s.leds.forEach(function (m, i) { m.emissiveIntensity = s.activa ? (Math.sin(t * 7 + i) > 0 ? 1.6 : 0.2) : 0.5; });
    s.piso.emissive.copy(s.color);
    s.piso.emissiveIntensity = (elegida === s.id ? 0.34 : 0.13) + (s.activa ? 0.09 + Math.sin(t * 2) * 0.05 : 0);
    var c = s.caminante, d = s.def;
    c.g.visible = s.activa;
    if (s.activa) {
      var u = (Math.sin(t * 0.42 + c.fase) + 1) / 2, x = d.x + 0.9 + u * (d.w - 1.8), z = d.z + d.d - 0.65;
      c.g.rotation.y = Math.cos(t * 0.42 + c.fase) > 0 ? Math.PI / 2 : -Math.PI / 2;
      c.g.position.set(x, Math.abs(Math.sin(t * 7)) * 0.05, z);
      c.bi.rotation.x = Math.sin(t * 7) * 0.5; c.bd.rotation.x = -Math.sin(t * 7) * 0.5;
    }
  }

  var parado = false, cuadro = 0;
  function vuelta(ahora) {
    if (parado) return;
    cuadro = requestAnimationFrame(vuelta);
    if (document.hidden || !cont.offsetParent) return;
    var dt = Math.min(0.05, (ahora - ultimo) / 1000 || 0.016); ultimo = ahora;
    if (!quieto) tiempo += dt;
    Object.keys(salas).forEach(function (k) { animarSala(salas[k], dt); });
    controles.update();
    ubicar();
    renderer.render(escena, camara);
  }

  var api = {
    montar: function (nuevo) {
      cont = nuevo;
      cont.appendChild(renderer.domElement);
      cont.appendChild(capa);
      medir();
    },
    actualizar: function (estados, sala) {
      elegida = sala;
      Object.keys(estados).forEach(function (id) {
        var e = estados[id], s = salas[id], b = etiquetas[id];
        if (!s) return;
        s.activa = !!e.trabajando;
        s.color.setHex(LUZ[e.estado] || C.gris);
        b.dataset.estado = e.estado;
        b.classList.toggle('trabajando', !!e.trabajando);
        b.setAttribute('aria-pressed', String(sala === id));
        b.setAttribute('aria-label', e.nombre + ': ' + e.texto);
        b.textContent = '';
        var n = document.createElement('b'), t = document.createElement('span');
        n.textContent = e.nombre; t.textContent = e.texto;
        b.appendChild(n); b.appendChild(t);
      });
    }
  };
  window.addEventListener('resize', medir);
  if (window.ResizeObserver) new ResizeObserver(medir).observe(cont);
  api.montar(cont);
  cuadro = requestAnimationFrame(vuelta);
  return api;
}

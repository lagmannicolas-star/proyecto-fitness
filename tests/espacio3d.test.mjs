import fs from 'node:fs';
import assert from 'node:assert/strict';

const html = fs.readFileSync('arma-tu-espacio.html', 'utf8');
const js = fs.readFileSync('assets/espacio3d.js', 'utf8');
const esp = fs.readFileSync('assets/espacio.js', 'utf8');

// La sección 3D está en Armá tu espacio, con medidas, vistas y el botón para pedir ofertas.
for (const id of ['e3d', 'e3d-largo', 'e3d-ancho', 'e3d-stats', 'e3d-alerta', 'e3d-canvas', 'e3d-reset', 'e3d-girar', 'e3d-pedir'])
  assert.match(html, new RegExp(`id="${id}"`), id);
assert.match(html, /data-e3d-vista="3d"/); assert.match(html, /data-e3d-vista="planta"/);
assert.ok(html.indexOf('assets/espacio3d.js') < html.indexOf('assets/espacio.js'), 'el 3D escucha antes de que se arme la lista');

// La lista avisa al 3D cada vez que cambia.
assert.match(esp, /new CustomEvent\('nf-kit'/);
assert.match(js, /addEventListener\('nf-kit'/);

// three.js va dentro del sitio (sin CDN) y se carga solo cuando la sección se ve.
assert.ok(fs.existsSync('assets/vendor/three/three.module.min.js'));
assert.match(fs.readFileSync('assets/vendor/three/OrbitControls.js', 'utf8'), /from '\.\/three\.module\.min\.js'/);
assert.match(js, /IntersectionObserver/);
assert.doesNotMatch(js, /https?:\/\/(cdn|unpkg)/);

// Medidas por defecto para cada tipo de espacio, y aviso cuando algo no entra.
for (const t of ['gimnasio', 'club', 'colegio', 'casa']) assert.match(js, new RegExp(t + ':\\s*\\['));
assert.match(js, /no entra/);
console.log('OK: planificador 3D en Armá tu espacio.');

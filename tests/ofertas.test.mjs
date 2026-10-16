import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const recomendar = require('../assets/recomendar.js');

// Ejemplo del documento: A llega en 48 h con envío y garantía, B es la más barata, C da cuotas.
const of = [
  { id: 1, letra: 'A', total: 950000, envio: 0, plazo: 2, cuotas: 0, garantia: 12, cumple: 'total' },
  { id: 2, letra: 'B', total: 920000, envio: 20000, plazo: 10, cuotas: 0, garantia: 6, cumple: 'total' },
  { id: 3, letra: 'C', total: 1080000, envio: 0, plazo: 5, cuotas: 6, garantia: 6, cumple: 'total' }];
assert.equal(recomendar(of, 'equilibrio', '15').mejor.letra, 'A', 'equilibrio: gana la que mejor resuelve');
assert.equal(recomendar(of, 'precio', '15').mejor.letra, 'B', 'menor costo: gana la más barata');
assert.equal(recomendar(of, 'rapidez', '15').mejor.letra, 'A');
assert.equal(recomendar(of, 'financiacion', '15').mejor.letra, 'C', 'financiación: gana la de cuotas');
assert.match(recomendar(of, 'equilibrio', '15').motivo, /Cuesta 3% más que la Oferta B .*llega 8 días hábiles antes/);
assert.equal(recomendar(of.map(o => o.id === 1 ? { ...o, vencida: true } : o), 'equilibrio', '15').mejor.letra !== 'A', true, 'una oferta vencida nunca se recomienda');
assert.equal(recomendar([{ ...of[0], vencida: true }], 'precio', '15').mejor, null);
assert(recomendar(of, 'equilibrio', 'urgente').marcas[2].includes('Llega después de lo que pediste'));
const parcial = recomendar([{ ...of[0], cumple: 'parcial' }, { ...of[1], total: 960000 }], 'equilibrio', '15');
assert(parcial.marcas[1].includes('Cubre una parte'));

// El proveedor entra con un token en el #, que no viaja al servidor ni en el Referer.
const ofertaHtml = fs.readFileSync('oferta.html', 'utf8'), ofertaJs = fs.readFileSync('assets/oferta.js', 'utf8');
assert.match(ofertaHtml, /name="robots" content="noindex, nofollow"/);
assert.match(ofertaHtml, /name="referrer" content="no-referrer"/);
assert.match(ofertaJs, /location\.hash/);
assert.match(ofertaJs, /\/\@\|https\?:/, 'las notas no aceptan emails ni links');

// La base nunca le da al proveedor los datos del comprador, y los nombres de proveedores no se ven hasta elegir.
const sql = fs.readFileSync('supabase/migrations/20261016200000_ofertas_de_proveedores.sql', 'utf8');
const ver = sql.match(/function public\.fitness_invitacion_ver[\s\S]*?end \$\$;/)[0];
assert.doesNotMatch(ver.split('return')[1], /s\.(nombre|email|telefono|empresa|presupuesto)/);
assert.match(sql, /'proveedor',case when o\.id=s\.oferta_elegida then o\.nombre end/);
assert.match(sql, /valida_hasta < current_date then raise exception 'Esa oferta venció/);
assert.match(sql, /now\(\)-interval '30 days' then 'vencida'/);
for (const fn of ['fitness_red_admin', 'fitness_red_guardar', 'fitness_invitar']) assert.match(sql, new RegExp('function public\\.' + fn + '[\\s\\S]*?fitness_es_admin\\(\\)'), fn + ' exige admin');
assert.match(sql, /revoke all on table public\.fitness_red_proveedores, public\.fitness_invitaciones, public\.fitness_ofertas_solicitud from public,anon,authenticated/);
assert.match(fs.readFileSync('mi-solicitud.html', 'utf8'), /assets\/recomendar\.js/);
console.log('OK: recomendación, oferta del proveedor, privacidad y vencimientos.');

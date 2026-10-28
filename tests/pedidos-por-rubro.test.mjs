import fs from 'node:fs';
import assert from 'node:assert/strict';
// Los pedidos de ofertas llegan solo a los proveedores del rubro; sin rubro reconocible, a toda la red.
const sql = fs.readFileSync('supabase/migrations/20261028140000_pedidos_por_rubro.sql', 'utf8');
const fn = name => sql.slice(sql.indexOf('function public.' + name + '('), sql.indexOf('end $$', sql.indexOf('function public.' + name + '(')));

assert.match(fn('fitness_sol_rubros'), /if cardinality\(r\)=0 then return null; end if;/, 'un producto sin rubro manda el pedido a toda la red');
assert.match(fn('fitness_invitar_toda_la_red'), /r\.es_prueba = coalesce\(v_prueba,false\)/, 'un pedido real nunca llega a proveedores de prueba');
assert.match(fn('fitness_invitar_toda_la_red'), /v_rubros is null or cardinality\(r\.rubros\)=0 or r\.rubros && v_rubros/);
assert.match(fn('fitness_red_activo_trg'), /s\.es_prueba = new\.es_prueba/);
assert.match(fn('fitness_red_activo_trg'), /new\.rubros && public\.fitness_sol_rubros\(s\.items\)/, 'al activarse, solo recibe los pedidos abiertos de su rubro');
assert.match(fn('fitness_red_desde_catalogo'), /lower\(trim\(r\.email\)\)=mail\) or \(wa<>'' and r\.whatsapp=wa\)/, 'no duplica proveedores con otro nombre');
assert.match(sql, /p\[aá\]del/, 'pádel cuenta como deportes');
assert.doesNotMatch(sql, /grant[^;]*fitness_sol_rubros/);

// Contacto del sitio: todo a la casilla de Nexo Fit.
for (const f of ['assets/empresa.js', 'admin.html', 'nicolas.html', 'proveedores.html']) {
  const t = fs.readFileSync(f, 'utf8');
  assert.doesNotMatch(t, /lagmannicolas@gmail\.com/, f + ' no usa el mail personal');
}
assert.match(fs.readFileSync('assets/empresa.js', 'utf8'), /email: 'nicolas\.nexofitt@gmail\.com'/);
console.log('pedidos por rubro ok');

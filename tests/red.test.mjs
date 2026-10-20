import fs from 'node:fs';
import assert from 'node:assert/strict';

const prov = fs.readFileSync('proveedores.html', 'utf8'), admin = fs.readFileSync('admin.html', 'utf8');
const sql = fs.readFileSync('supabase/migrations/20261017140000_red_postulaciones.sql', 'utf8');

// La portada de proveedores ofrece sumarse a la red sin catálogo, y el catálogo como segunda opción.
assert.match(prov, /href="#red">Quiero recibir pedidos/);
assert.match(prov, /id="red"><div class="wrap">'\+redJoinHTML\(\)/);
assert.match(prov, /fitness_red_postular/);
assert.match(prov, /id="r-web"/, 'campo trampa para robots');

// Los rubros del formulario son los mismos que entiende la base y el panel.
const rub = s => [...s.matchAll(/\['([a-z]+)','[^']+'(?:,\/)?/g)].map(m => m[1]);
const rubProv = rub(prov.match(/var RED_RUBROS=(\[.*?\]);/)[1]);
const rubAdmin = rub(admin.match(/var RUBROS=(.*)/)[1]);
const rubSql = sql.match(/where x in \(([^)]*)\)/)[1].match(/'([a-z]+)'/g).map(x => x.slice(1, -1));
assert.deepEqual(rubProv, rubSql); assert.deepEqual(rubAdmin, rubSql);

// La postulación entra pausada, avisa al administrador y no revela si la empresa ya estaba.
assert.match(sql, /v_rubros,v_zonas,false,'web'/, 'entra pausado');
assert.match(sql, /fitness_aviso_encolar\('proveedor_nuevo'/);
assert.match(sql, /if exists\(select 1 from public\.fitness_red_proveedores where whatsapp=v_wa or email=v_email\) then\s+return jsonb_build_object\('ok',true\)/);
assert.match(sql, /grant execute on function public\.fitness_red_postular\(jsonb\) to anon,authenticated/);
assert.doesNotMatch(sql, /grant[^;]*fitness_red_admin[^;]*anon/);

// El panel muestra la postulación y permite activarla.
assert.match(admin, /data-act="red-activar"/);
assert.match(admin, /Nuevo · se sumó desde la web/);
console.log('OK: red de proveedores con alta desde la web.');

// La comisión del 10% está informada donde el proveedor decide.
{
  const ter = fs.readFileSync('terminos.html', 'utf8'), of = fs.readFileSync('oferta.html', 'utf8');
  assert.match(ter, /comisión del 10% sobre el precio de los productos, sin contar el envío/);
  assert.match(of, /el <span id=\"of-comision\">10<\/span>% del precio de los productos \(el envío no paga comisión\)/);
  // La comisión del link sale de la base: cada proveedor de la red puede tener la suya.
  assert.match(fs.readFileSync('assets/oferta.js', 'utf8'), /o\.comision/);
  assert.match(prov, /Comisión del '\+p\+'% solo si vendés/);
}

// Para actualizar solo el stock no se pide la fuente oficial del precio (sí cuando cambia el precio).
{
  const prov2 = fs.readFileSync('proveedores.html', 'utf8');
  assert.match(prov2, /if\(np!==cur\.price&&!safeUrl\(source\)\)/);
  assert.match(prov2, /if\(source\)cur\.sourceUrl=source;/);
  console.log('OK: stock sin fuente de precio.');
}

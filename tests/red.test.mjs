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
const sqlRub = fs.readFileSync('supabase/migrations/20261030140000_rubro_crossfit.sql', 'utf8');
const rubSql = sqlRub.match(/where x in \(([^)]*)\)/)[1].match(/'([a-z]+)'/g).map(x => x.slice(1, -1));
assert.deepEqual(rubProv, rubSql); assert.deepEqual(rubAdmin, rubSql);
assert.ok(rubSql.includes('cesped'), 'rubro césped sintético');
for (const m of sqlRub.matchAll(/where x in \(([^)]*)\)/g)) assert.deepEqual(m[1].match(/'([a-z]+)'/g).map(x => x.slice(1, -1)), rubSql);
assert.match(sqlRub, /\('cesped','c\[eé\]sped\|pasto sint'\)/);
assert.ok(rubSql.includes('crossfit'), 'rubro CrossFit');
assert.match(sqlRub, /\('crossfit','crossfit\|cross fit\|/);
assert.match(sqlRub, /\('funcional','[^']*wall \?ball/, 'lo de CrossFit también llega a funcional');

// La postulación entra pausada, avisa al administrador y no revela si la empresa ya estaba.
assert.match(sql, /v_rubros,v_zonas,false,'web'/, 'entra pausado');
assert.match(sql, /fitness_aviso_encolar\('proveedor_nuevo'/);
assert.match(sql, /if exists\(select 1 from public\.fitness_red_proveedores where whatsapp=v_wa or email=v_email\) then\s+return jsonb_build_object\('ok',true\)/);
assert.match(sql, /grant execute on function public\.fitness_red_postular\(jsonb\) to anon,authenticated/);
assert.doesNotMatch(sql, /grant[^;]*fitness_red_admin[^;]*anon/);

// El panel muestra la postulación y permite activarla.
assert.match(admin, /data-act="red-activar"/);
assert.match(admin, /Nuevo · se sumó desde la web/);
// La pestaña Proveedores muestra también a los que se sumaron a la red sin catálogo.
assert.match(admin, /vendorList\(\)\+redVendorCards\(\)/);
assert.match(admin, /act==='red-ver'\)\{ui\.tab='solicitudes';ui\.reqView='red'/);
// WhatsApp argentino: +54 9 fijo y normalización a 549 + 10 dígitos.
const waSrc = prov.match(/function waAR\(t\)\{[\s\S]*?return d\.length===10\?'549'\+d:''; \}/)[0];
const waAR = new Function(waSrc + '; return waAR;')();
for (const [inp, out] of [['11 2345 6789','5491123456789'],['011 15 2345-6789','5491123456789'],['+54 9 11 2345 6789','5491123456789'],['0351 15 123 4567','5493511234567'],['3537 15 442888','5493537442888'],['+54 353 7442888','5493537442888'],['12345','']]) assert.equal(waAR(inp), out, inp);
assert.match(prov, /waField\('r-wa','WhatsApp'\)/);
assert.match(prov, /whatsapp:waAR\(val\('r-wa'\)\)/);
assert.match(prov, /<span class="wa-pre" aria-hidden="true">\+54 9<\/span>/);
// El alta con catálogo viaja con la cuenta: no se pierde si confirman el email en otro dispositivo.
assert.match(prov, /FC\.signup\(details\.email,val\('a-pass'\),details\.name,details\)/);
assert.match(prov, /meta\.vendor_alta=vendorAlta/);
const alta = fs.readFileSync('supabase/migrations/20261021200000_alta_pendiente_y_whatsapp_ar.sql', 'utf8');
assert.match(alta, /create trigger fitness_zz_alta_pendiente after insert or update of email_confirmed_at on auth\.users/);
assert.match(alta, /create trigger fitness_red_wa before insert or update of whatsapp on public\.fitness_red_proveedores/);
// Cada pedido sale a toda la red activa y los proveedores con catálogo lo ven en su panel.
const toda = fs.readFileSync('supabase/migrations/20261021220000_pedido_a_toda_la_red.sql', 'utf8');
assert.match(toda, /create trigger fitness_zz_invitar_red after insert on public\.fitness_solicitudes/);
assert.match(toda, /from public\.fitness_red_proveedores r where r\.activo\s+on conflict/);
assert.match(toda, /grant execute on function public\.fitness_mis_pedidos\(\) to authenticated/);
assert.match(prov, /\{id:'pedidos',label:'Pedidos para cotizar \(de compradores de tu rubro\)'\}/);
assert.match(prov, /rpc\/fitness_mis_pedidos/);
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

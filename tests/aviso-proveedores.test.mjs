import fs from 'node:fs';
import assert from 'node:assert/strict';
const sql = fs.readFileSync('supabase/migrations/20261022220000_aviso_pedido_a_proveedores.sql', 'utf8');
const fn = sql.match(/function public\.fitness_avisar_invitaciones[\s\S]*?end \$\$;/)[0];
// Solo con Resend configurado y dominio propio (el remitente de prueba solo entrega al dueño de la cuenta).
assert.match(fn, /fitness_aviso_secreto\('nexofit_resend_key'\) is null or c\.email_from ilike '%@resend\.dev%'/);
// Un aviso por invitación, solo a proveedores activos con pedidos abiertos.
assert.match(fn, /i\.avisado_at is null and r\.activo and s\.status in \('nueva','enviada','con_ofertas'\)/);
assert.match(fn, /update public\.fitness_invitaciones set avisado_at=now\(\)/);
// Lleva el link privado y nunca datos del comprador.
assert.match(fn, /\/oferta\.html#t='\|\|x\.token/);
for (const campo of ['s.nombre', 's.email', 's.telefono', 's.empresa', 's.presupuesto']) assert.ok(!fn.includes(campo), 'no expone ' + campo);
assert.match(fn, /public\.fitness_html\(x\.nombre\)/);
// Si falla, la cola sigue enviando el resto de los avisos.
const run = sql.match(/procedure public\.fitness_avisos_run[\s\S]*?end \$\$;/)[0];
assert.match(run, /perform public\.fitness_avisar_invitaciones\(\);\s+exception when others then\s+raise warning/);
assert.match(sql, /revoke all on function public\.fitness_avisar_invitaciones\(\) from public, anon, authenticated/);
console.log('OK: aviso automático por email a cada proveedor invitado.');

// Ciclo completo: confirmación de oferta, ganador, no elegidos, cierre sin elegir y reply_to al admin.
const ciclo = fs.readFileSync('supabase/migrations/20261022233000_avisos_ciclo_completo.sql', 'utf8');
const mail = ciclo.match(/function public\.fitness_aviso_mail[\s\S]*?end \$\$;/)[0];
assert.match(mail, /email_from ilike '%@resend\.dev%' then return/, 'sin dominio propio no se escribe a terceros');
for (const t of ['oferta_recibida_proveedor', 'oferta_corregida_proveedor', 'oferta_ganadora', 'oferta_no_elegida', 'pedido_cerrado_proveedor']) assert.match(ciclo, new RegExp("'" + t + "'"), t);
assert.match(ciclo, /new\.status in \('cerrada','descartada'\) and old\.status in \('nueva','enviada','con_ofertas'\) and new\.oferta_elegida is null/);
assert.match(ciclo, /jsonb_build_object\('reply_to',c\.admin_email\)/);
// Los avisos a proveedores nunca llevan datos de contacto del comprador.
for (const fn of ['fitness_aviso_tr_solicitud', 'fitness_aviso_tr_oferta']) {
  const body = ciclo.match(new RegExp('function public\\.' + fn + '[\\s\\S]*?end \\$\\$;'))[0];
  for (const call of body.match(/fitness_aviso_mail\([\s\S]*?\)\);/g)) for (const campo of ['new.telefono', 'new.email', 's.email', 's.telefono', 'new.nombre||']) assert.ok(!call.includes(campo), fn + ' no expone ' + campo);
  assert.match(body, /exception when others then\s+raise warning/);
}
const admin2 = fs.readFileSync('admin.html', 'utf8');
assert.match(admin2, /oferta_ganadora:'Oferta elegida \(proveedor\)'/);
console.log('OK: ciclo completo de avisos a proveedores.');

// Recordatorios: idempotentes (marcas), sin tocar updated_at y con fecha de Argentina.
const rec = fs.readFileSync('supabase/migrations/20261023000000_avisos_recordatorios.sql', 'utf8');
const fr = rec.match(/function public\.fitness_avisos_recordatorios[\s\S]*?end \$\$;/)[0];
for (const m of ['aviso_ofertas_at=now()', 'recordado_at=now()', 'aviso_vence_at=now()', 'vencida_avisada_at=now()']) assert.ok(fr.includes(m), m);
assert.ok(!/updated_at\s*=/.test(fr), 'los recordatorios no mueven el vencimiento');
assert.match(rec, /perform public\.fitness_avisos_recordatorios\(\);\s+exception when others then\s+raise warning/);
const tz = fs.readFileSync('supabase/migrations/20261023001000_ofertas_fecha_argentina.sql', 'utf8');
for (const f of ['fitness_avisos_recordatorios', 'fitness_oferta_elegir', 'fitness_oferta_enviar']) assert.match(tz, new RegExp(f + "\\([^)]*\\) set timezone to 'America/Argentina/Buenos_Aires'"));
console.log('OK: recordatorios a comprador y proveedores.');

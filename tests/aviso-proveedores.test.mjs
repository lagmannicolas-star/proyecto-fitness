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

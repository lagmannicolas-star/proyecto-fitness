import fs from 'node:fs';
import assert from 'node:assert/strict';
const sql = fs.readFileSync('supabase/migrations/20261016220000_avisos.sql', 'utf8');
const admin = fs.readFileSync('admin.html', 'utf8');
// Las llaves viven en Vault y nunca se devuelven al panel.
assert.match(sql, /vault\.create_secret\(v_rk,'nexofit_resend_key'/);
assert.match(sql, /vault\.create_secret\(v_ck,'nexofit_callmebot_key'/);
const panel = sql.match(/function public\.fitness_avisos_admin[\s\S]*?end \$\$;/)[0];
assert.match(panel, /'resend',public\.fitness_aviso_secreto\('nexofit_resend_key'\) is not null/, 'el panel solo sabe si hay llave');
// Un aviso que falla nunca frena una solicitud ni una oferta.
for (const fn of ['fitness_aviso_tr_solicitud', 'fitness_aviso_tr_oferta']) assert.match(sql.match(new RegExp('function public\\.' + fn + '[\\s\\S]*?end \\$\\$;'))[0], /exception when others then\s+raise warning/);
// Con el remitente de prueba de Resend no se escribe a compradores.
assert.match(sql, /c\.email_from not ilike '%@resend\.dev%'/);
// Los textos del comprador se escapan en el HTML del email.
assert.match(sql, /public\.fitness_html\(new\.nombre\)/);
// Solo el administrador configura y prueba.
for (const fn of ['fitness_avisos_admin', 'fitness_avisos_guardar', 'fitness_avisos_probar', 'fitness_aviso_reintentar']) assert.match(sql, new RegExp('function public\\.' + fn + '[\\s\\S]*?fitness_es_admin\\(\\)'), fn);
assert.match(sql, /revoke all on table public\.fitness_avisos_config, public\.fitness_avisos from public,anon,authenticated/);
assert.match(sql, /cron\.schedule\('nexofit-avisos','\* \* \* \* \*'/);
assert.match(admin, /data-v="avisos"/);
assert.match(admin, /type="password" autocomplete="off" placeholder="re_…"/);
// Términos y privacidad explican el nuevo circuito.
assert.match(fs.readFileSync('terminos.html', 'utf8'), /Pedí ofertas y Armá tu espacio/);
assert.match(fs.readFileSync('privacidad.html', 'utf8'), /No ven tu nombre, email, WhatsApp, empresa ni presupuesto/);
console.log('OK: avisos por email y WhatsApp, llaves cifradas, términos y privacidad.');

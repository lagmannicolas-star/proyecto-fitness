import fs from 'node:fs';
import assert from 'node:assert/strict';
// Que comprador y proveedor no se salteen a Nexo Fit.
const sql = fs.readFileSync('supabase/migrations/20261030160000_anti_salteo.sql', 'utf8');
const fn = name => { const i = sql.indexOf('function public.' + name + '('); return sql.slice(i, sql.indexOf('end $$', i)); };
const ofJs = fs.readFileSync('assets/oferta.js', 'utf8'), miJs = fs.readFileSync('assets/mi-solicitud.js', 'utf8'), admin = fs.readFileSync('admin.html', 'utf8');

// 1) Notas sin datos de contacto: la base las rechaza y el formulario avisa con el mismo criterio.
assert.match(fn('fitness_oferta_enviar'), /if public\.fitness_tiene_contacto\(p->>'notas'\) then raise exception/);
assert.match(fn('fitness_solicitud_consulta'), /'notas',case when o\.id is distinct from s\.oferta_elegida and public\.fitness_tiene_contacto\(o\.notas\) then null/, 'notas viejas con contacto, ocultas hasta elegir');
assert.match(sql, /revoke all on function public\.fitness_tiene_contacto\(text\) from public, anon, authenticated/);
const tiene = new Function(ofJs.match(/function tieneContacto\(t\) \{[\s\S]*?\n  \}/)[0] + '; return tieneContacto;')();
for (const t of ['Llamame al 11 2345 6789', 'Cel 0351 15 123-4567', '+54 9 11 2345-6789', '1123456789', 'ventas@empresa.com', 'ventas arroba empresa.com.ar',
  'www.misitio.com.ar', 'misitio.com.ar', 'seguinos @fitnesstore', 'escribinos por whatsapp', 'consultas por wsp']) assert.ok(tiene(t), 'detecta: ' + t);
for (const t of ['Mancuernas de 10 12 15 20 25 kg', 'Precio con IVA $ 12.500.000', 'Medidas 120x60x75 cm', 'Entrega en 15 días, garantía 12 meses',
  'Discos de 1,25 2,5 5 10 15 20 25 kg, barra 2,20 m', 'Código 4005-1234', 'Incluye instalación y flete a Córdoba']) assert.ok(!tiene(t), 'no confunde: ' + t);
assert.match(ofJs, /tieneContacto\(notas\) \?/);

// 2) Confianza sin nombre en cada oferta.
const con = fn('fitness_solicitud_consulta');
assert.match(con, /'confianza',jsonb_build_object\('tipo',o\.tipo,'localidad',o\.prov_localidad,'cuitVerificado',o\.cuit_verificado and o\.cuit is not null/);
assert.match(con, /v\.pago_estado='aprobado' and not v\.es_prueba/, 'ventas concretadas: solo pagadas y reales');
assert.match(con, /'proveedor',case when o\.id=s\.oferta_elegida then o\.nombre end/, 'el nombre sigue oculto hasta elegir');
assert.match(miJs, /function confianzaHTML\(o\)/); assert.match(miJs, /CUIT verificado por Nexo Fit/);
assert.match(fn('fitness_red_guardar'), /cuit_verificado=case when p \? 'cuit_verificado'/);
assert.match(admin, /data-red="cuit_verificado"/);

// 3) Oferta elegida sin pagar a las 24 h: recordatorio único, nunca en pedidos de prueba.
const rec = fn('fitness_avisos_recordatorios');
assert.match(rec, /s\.status='elegida' and s\.recordatorio_pago_at is null and not s\.es_prueba/);
assert.match(rec, /s\.elegida_at < now\(\)-interval '24 hours'/);
assert.match(rec, /'pago_pendiente_comprador'/); assert.match(rec, /'pago_pendiente_proveedor'/); assert.match(rec, /fitness_aviso_encolar\('pago_pendiente'/);
assert.match(rec, /update public\.fitness_solicitudes set recordatorio_pago_at=now\(\)/);
for (const k of ['1) Comprador', '2) Proveedor', '3) Proveedor', '4) Pedido vencido']) assert.ok(rec.includes(k), 'conserva ' + k);

// 4) Mercado Pago obligatorio para ofertar: listo pero apagado por defecto, y el panel lo puede prender.
assert.match(sql, /add column if not exists exigir_mp boolean not null default false/);
assert.match(fn('fitness_oferta_enviar'), /c\.exigir_mp[\s\S]*not s\.es_prueba and not public\.fitness_mp_red_conectado\(i\.proveedor_id\)/);
assert.match(fn('fitness_invitacion_ver'), /'exigeMp'/);
assert.match(ofJs, /o\.exigeMp && !o\.mp && !of/);
assert.match(fn('fitness_red_config'), /if not public\.fitness_es_admin\(\) then raise exception/);
assert.match(sql, /revoke all on function public\.fitness_red_config\(jsonb\) from public, anon/);
assert.match(admin, /data-act="red-exigir-mp"/);
console.log('OK: anti salteo (notas sin contacto, confianza sin nombre, recordatorio de pago y Mercado Pago obligatorio).');

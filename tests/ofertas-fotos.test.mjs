import fs from 'node:fs';
import assert from 'node:assert/strict';
// Fotos en las ofertas de la red y validez de 24 horas. Supabase y R2 simulados.
const src = fs.readFileSync(new URL('../worker/index.js', import.meta.url), 'utf8');
const worker = await import('data:text/javascript,' + encodeURIComponent(src));
const site = 'https://nexofitt.com.ar', TOKEN = 'c'.repeat(64);
const r2 = new Map();
const FOTOS = {
  put: async (k, v, o) => { r2.set(k, { v, type: o.httpMetadata.contentType }); },
  get: async k => r2.has(k) ? { body: r2.get(k).v, httpMetadata: { contentType: r2.get(k).type } } : null,
  delete: async k => { r2.delete(k); },
};
const env = { SUPABASE_URL: 'https://db.example.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test', SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_test', ALLOWED_ORIGINS: site, FOTOS, ASSETS: { fetch: async () => new Response('asset') } };
let fotos = [], abierta = true, calls = [];
globalThis.fetch = async (url, opts = {}) => {
  url = String(url); const b = opts.body ? JSON.parse(opts.body) : {}; calls.push({ url, b, opts });
  assert.equal(opts.headers.apikey, 'sb_secret_test', 'las fotos de ofertas se registran con la llave del servidor');
  if (url.endsWith('/rpc/fitness_oferta_foto_lugar')) {
    if (b.p_token !== TOKEN) return Response.json({ message: 'El link no es válido o fue reemplazado' }, { status: 400 });
    if (!abierta) return Response.json({ message: 'Esta solicitud ya no recibe ofertas' }, { status: 400 });
    if (fotos.length >= 5) return Response.json({ message: 'Ya cargaste 5 fotos. Borrá una para subir otra' }, { status: 400 });
    return Response.json({ invitacion: 42, fotos: fotos.length });
  }
  if (url.endsWith('/rpc/fitness_oferta_foto_agregar')) { fotos.push(b.p_path); return Response.json({ ok: true, fotos }); }
  if (url.endsWith('/rpc/fitness_oferta_foto_quitar')) {
    if (!fotos.includes(b.p_path)) return Response.json({ message: 'Esa foto no existe' }, { status: 400 });
    fotos = fotos.filter(p => p !== b.p_path); return Response.json({ ok: true, fotos });
  }
  return new Response('?', { status: 404 });
};
const call = (path, init = {}) => worker.default.fetch(new Request(site + path, init), env);
const subir = (token, type = 'image/jpeg', size = 1000) => {
  const fd = new FormData(); fd.append('token', token); fd.append('file', new Blob([new Uint8Array(size)], { type }), 'f.jpg');
  return call('/api/ofertas/fotos', { method: 'POST', body: fd, headers: { Origin: site } });
};

// Link ajeno o archivo inválido: no se guarda nada en R2.
assert.equal((await subir('d'.repeat(64))).status, 400);
assert.equal((await subir('no-token')).status, 400);
assert.equal((await subir(TOKEN, 'application/pdf')).status, 400, 'solo imágenes');
assert.equal((await subir(TOKEN, 'image/jpeg', 4 * 1024 * 1024 + 1)).status, 400, 'máximo 4 MB');
assert.equal(r2.size, 0);

// Sube 5 fotos en la carpeta de su invitación (el token nunca aparece en la ruta pública); la sexta se rechaza.
for (let i = 0; i < 5; i++) { const r = await subir(TOKEN); assert.equal(r.status, 200); }
assert.equal(fotos.length, 5); assert.equal(r2.size, 5);
for (const p of fotos) { assert.match(p, /^ofertas\/i42\/[a-z0-9]+\.jpg$/); assert(!p.includes(TOKEN)); }
let r = await subir(TOKEN); assert.equal(r.status, 400); assert.match((await r.json()).error, /5 fotos/);
assert.equal(r2.size, 5, 'la sexta no se guarda');

// Se sirven como cualquier foto del sitio.
r = await call('/fotos/' + fotos[0]); assert.equal(r.status, 200); assert.equal(r.headers.get('Content-Type'), 'image/jpeg');

// Borrar: solo rutas de fotos de ofertas, y desaparece también de R2.
const p0 = fotos[0];
assert.equal((await call('/api/ofertas/fotos/borrar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: TOKEN, path: 'ab/otro/archivo.jpg' }) })).status, 400);
r = await call('/api/ofertas/fotos/borrar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: TOKEN, path: p0 }) });
assert.equal(r.status, 200); assert.equal((await r.json()).fotos.length, 4); assert(!r2.has(p0));

// Si la base rechaza el registro, la foto no queda huérfana en R2.
abierta = false; r = await subir(TOKEN); assert.equal(r.status, 400); assert.equal(r2.size, 4);
console.log('OK: fotos de ofertas (subida, límite de 5, permisos, borrado y archivos en R2).');

// Base: 24 horas, fotos visibles para el comprador y pedidos de prueba aislados de la red real.
const sql = fs.readFileSync(new URL('../supabase/migrations/20261028120000_ofertas_24h_fotos_y_pruebas.sql', import.meta.url), 'utf8');
const fn = name => sql.match(new RegExp('function public\\.' + name + '\\([\\s\\S]*?\\n(end )?\\$\\$;'))[0];
assert.match(fn('fitness_oferta_enviar'), /v_vence timestamptz := now\(\)\+interval '24 hours'/);
assert.doesNotMatch(fn('fitness_oferta_enviar'), /p->>'valida_hasta'/, 'el proveedor ya no elige la fecha');
assert.match(fn('fitness_oferta_renovar'), /vence_at=v_vence/);
assert.match(fn('fitness_oferta_elegir'), /o\.vence_at < now\(\) then raise exception/);
assert.doesNotMatch(fn('fitness_sol_pago_datos'), /vence|valida/, 'una oferta elegida a tiempo se puede pagar');
assert.match(fn('fitness_solicitud_consulta'), /'fotos',public\.fitness_oferta_fotos\(o\.invitacion_id\)/);
assert.doesNotMatch(fn('fitness_invitacion_ver').split('return')[1], /s\.(nombre|email|telefono|empresa|presupuesto)/);
assert.match(fn('fitness_invitar_toda_la_red'), /r\.es_prueba = coalesce\(v_prueba,false\)/, 'un pedido real nunca llega a proveedores de prueba y viceversa');
assert.match(fn('fitness_red_activo_trg'), /s\.es_prueba = new\.es_prueba/);
assert.match(fn('fitness_red_resumen'), /activo and not es_prueba/);
assert.match(sql, /grant execute on function public\.fitness_oferta_foto_lugar\(text\), public\.fitness_oferta_foto_agregar\(text,text\), public\.fitness_oferta_foto_quitar\(text,text\) to service_role/);
assert.match(sql, /revoke all on function public\.fitness_oferta_fotos\(bigint\), public\.fitness_oferta_foto_lugar\(text\)/);
const ofertaJs = fs.readFileSync(new URL('../assets/oferta.js', import.meta.url), 'utf8');
assert.doesNotMatch(ofertaJs, /valida_hasta/);
assert.match(ofertaJs, /fitness_oferta_renovar/);
console.log('OK: ofertas válidas 24 horas, renovación, fotos para el comprador y pedidos de prueba aislados.');

import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
// Lanzamiento de "Vender con catálogo" como vidriera: nada se publica sin aprobación del administrador.
const sql = fs.readFileSync('supabase/migrations/20261031100000_catalogo_lanzamiento.sql', 'utf8');
const admin = fs.readFileSync('admin.html', 'utf8');
const fn = name => { const i = sql.indexOf('function public.' + name + '('); assert.ok(i >= 0, 'falta ' + name); const j = sql.indexOf('\n$$;', i), k = sql.indexOf('end $$;', i); return sql.slice(i, Math.min(...[j, k].filter(x => x > 0))); };

for (const f of ['fitness_red_postular', 'fitness_red_ids_proveedor', 'fitness_red_pausar_suspendidos_trg', 'fitness_alta_proveedor', 'fitness_save', 'fitness_snapshot', 'fitness_public_catalog', 'fitness_foto_set', 'fitness_import_catalog', 'fitness_red_desde_catalogo', 'fitness_fotos_por_revisar', 'fitness_fotos_revisar', 'fitness_proveedor_aprobar']) {
  assert.match(fn(f), /security definer set search_path=''/, f + ' con security definer y search_path vacío');
}
assert.match(sql, /^begin;/m); assert.match(sql, /^commit;/m);

// A) Alta por aprobar, CUIT con dígito verificador y aviso al administrador.
const alta = fn('fitness_alta_proveedor');
assert.match(alta, /'status','pending'/); assert.doesNotMatch(alta, /'status','active'/);
assert.match(alta, /if not public\.fitness_cuit_valido\(details->>'cuit'\) then raise exception 'Revisá el CUIT/);
assert.match(alta, /fitness_aviso_encolar\('proveedor_nuevo',null,/);
assert.match(alta, /raise exception 'Para sumarte tenés que aceptar los Términos y las condiciones para vender'/);
assert.match(alta, /jsonb_build_object\('terms',now\(\)\)/, 'la fecha de aceptación la pone el servidor');
assert.match(alta, /jsonb_build_object\('razon',left\(btrim\(details->>'razon'\),160\)\)/);
assert.doesNotMatch(sql, /Ya está activo/);
assert.match(alta, /role=case when role='admin' then 'admin' else 'vendor' end/, 'el pendiente entra a su panel');
assert.match(fn('fitness_save'), /role=case when v->>'status' in \('active','pending'\) then 'vendor' else 'buyer' end/, 'guardar como admin no le saca el panel al pendiente');
assert.match(fn('fitness_save'), /raise exception 'Solo el administrador puede publicar'/, 'el resto de fitness_save se conserva');
assert.match(fn('fitness_alta_pendiente_trg'), /No se pudo completar el alta/);
assert.match(sql, /revoke all on function public\.fitness_alta_proveedor\(uuid,jsonb\) from public, anon, authenticated/);

// Mismo algoritmo que la base (pesos tomados del SQL).
const w = fn('fitness_cuit_valido').match(/array\[([\d,]+)\]/)[1].split(',').map(Number);
assert.deepEqual(w, [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]);
const cuitOk = c => { const d = String(c).replace(/\D/g, ''); if (d.length !== 11) return false; let s = 0; for (let i = 0; i < 10; i++) s += +d[i] * w[i]; let r = 11 - (s % 11); if (r === 11) r = 0; if (r === 10) return false; return r === +d[10]; };
assert.ok(cuitOk('20-12345678-6')); assert.ok(!cuitOk('20-12345678-5')); assert.ok(!cuitOk('2012345678'));
assert.match(fn('fitness_cuit_valido'), /elsif r=10 then return false/);

// B) Red: entra pausado, también el pendiente.
const red = fn('fitness_red_desde_catalogo');
assert.match(red, /not in \('active','pending'\)/);
assert.match(red, /array\['todo'\], false, 'web'/); assert.match(red, /Queda pausado hasta que lo apruebes/);
const apr = fn('fitness_proveedor_aprobar');
assert.match(apr, /r\.id in \(select public\.fitness_red_ids_proveedor\(v\)\)/, 'misma regla para activar y pausar');
const pausa = fn('fitness_red_pausar_suspendidos_trg');
assert.match(pausa, /not in \('suspended','rejected'\)/); assert.match(pausa, /set activo=false/);
assert.match(pausa, /id in \(select public\.fitness_red_ids_proveedor\(v\)\)/);
assert.match(sql, /create trigger fitness_red_pausar_suspendidos after update of data on public\.fitness_state/);
const post = fn('fitness_red_postular');
assert.match(post, /if v_cuit is not null and not public\.fitness_cuit_valido\(v_cuit\) then raise exception 'Revisá el CUIT/);
assert.match(post, /'crossfit'/); assert.match(post, /'cesped'/);
assert.match(sql, /grant execute on function public\.fitness_red_postular\(jsonb\) to anon, authenticated/);
assert.match(apr, /if not public\.fitness_es_admin\(\) then raise exception/);
assert.match(apr, /jsonb_build_object\('status','active'\)/); assert.match(apr, /update public\.fitness_red_proveedores r set activo=true/);

// C) Catálogo público: importados solo con oferta publicada por sourceKey; manuales solo publicados.
const cat = fn('fitness_public_catalog');
assert.match(cat, /\n join lateral \(select o2 as po from .*\n   where o2->>'vendorId'=v->>'id' and o2->>'sourceKey'=d->>'key' and o2->>'status'='published' limit 1\) pub on true/, 'importado solo con oferta publicada');
assert.match(cat, /d->'ausenteEnUltimaImportacion' is distinct from 'true'::jsonb/);
assert.match(cat, /and o->>'status'='published'\n/); assert.doesNotMatch(cat, /'review'/);
assert.equal((cat.match(/v->>'status'='active'/g) || []).length, 2, 'solo proveedores activos');
assert.doesNotMatch(cat, /'vendorId',|'vendorName'|v->>'name'/, 'no revela al proveedor');
assert.equal((cat.match(/'vendorRef',md5\(\(v->>'id'\)\|\|'nexofit-vidriera'\),'vendorType',nullif\(v->>'type',''\),'vendorProvince',nullif\(v->>'prov',''\)/g) || []).length, 2);
assert.match(cat, /'brand',coalesce\(nullif\(po->>'brand',''\),nullif\(d->>'brand',''\)\),'model',coalesce\(nullif\(po->>'model',''\),d->>'name'\)/);
assert.match(cat, /'brand',nullif\(o->>'brand',''\),'model',o->>'model'/);
assert.match(cat, /order by item->>'category',item->>'name',item->>'key'/);
assert.equal((cat.match(/i\.status='aprobada'/g) || []).length, 2, 'solo fotos aprobadas');
assert.match(sql, /grant execute on function public\.fitness_public_catalog\(\) to anon, authenticated/);

// D) Fotos del proveedor pendientes; revisión del administrador.
assert.match(fn('fitness_foto_set'), /case when public\.fitness_es_admin\(\) then 'aprobada' else 'pendiente' end/);
assert.match(fn('fitness_fotos_por_revisar'), /where i\.status='pendiente'/);
assert.match(fn('fitness_fotos_revisar'), /p_status not in \('aprobada','rechazada'\)/);
for (const f of ['fitness_fotos_por_revisar', 'fitness_fotos_revisar']) assert.match(fn(f), /if not public\.fitness_es_admin\(\) then raise exception/);
assert.match(sql, /revoke all on function public\.fitness_fotos_por_revisar\(\) from public, anon/);
assert.match(sql, /grant execute on function public\.fitness_fotos_por_revisar\(\), public\.fitness_fotos_revisar\(text,text,text\), public\.fitness_proveedor_aprobar\(text\) to authenticated/);
assert.doesNotMatch(sql, /fitness_oferta_foto|fitness_ofertas_fotos/, 'no toca las fotos de ofertas de la red');

// E) Pedidos sin pago confirmado: sin datos personales para el proveedor.
const snap = fn('fitness_snapshot');
assert.match(snap, /p\.role='vendor' and o->>'vendorId'=p\.vendor_id and o->>'buyerId' is distinct from p\.id::text and o->>'status' is distinct from 'approved'/);
assert.match(snap, /o-'buyer'-'buyerId'-'buyerName'-'buyerEmail'-'buyerPhone'-'email'-'phone'-'contact'-'cuit'/);
assert.match(snap, /'ship',public\.fitness_pick\(coalesce\(o->'ship','\{\}'::jsonb\),array\['city','prov','province','cp','zone'\]\),'buyerHidden',true/);
const pickOtros = snap.match(/else public\.fitness_pick\(v,array\[([^\]]*)\]\)/)[1];
for (const k of ['wa', 'phone', 'email', 'web', 'ig', 'address', 'contact', 'cuit', 'razon']) assert.ok(!pickOtros.includes("'" + k + "'"), 'sin ' + k + ' para visitantes y compradores');
for (const k of ['name', 'status', 'mp', 'freeShipping', 'shipMode', 'minOrderAmount', 'paymentBenefits', 'zones']) assert.ok(pickOtros.includes("'" + k + "'"), 'conserva ' + k);
assert.match(snap, /case when v->>'id'=p\.vendor_id then public\.fitness_clean\(v\)/, 'el proveedor ve todo lo suyo');
assert.match(snap, /if p\.role='admin' then[\s\S]*return \(s-'users'-'buyers'\)/, 'el administrador ve todo');

// F) Reimportar combina por clave.
const imp = fn('fitness_import_catalog');
assert.match(imp, /\(coalesce\(old,'\{\}'::jsonb\)-campos-'ausenteEnUltimaImportacion'\)\|\|public\.fitness_pick\(x,campos\)/);
assert.match(imp, /jsonb_build_object\('ausenteEnUltimaImportacion',true\)/);
assert.match(imp, /<> all\(seen\)/);
assert.match(sql, /grant execute on function public\.fitness_import_catalog\(text,jsonb\) to authenticated/);

// G) Administrador: proveedores nuevos, aprobación con la red, fotos e importados.
assert.match(admin, /pending:\['warn','Nuevo · espera aprobación'\]/);
assert.match(admin, /adminRpc\('fitness_proveedor_aprobar',\{p_vendor_id:vid\}\)/);
assert.match(admin, /adminRpc\('fitness_fotos_por_revisar'\)/);
assert.match(admin, /adminRpc\('fitness_fotos_revisar',\{p_vendor_id:t\.dataset\.v,p_path:t\.dataset\.path,p_status:t\.dataset\.s\}\)/);
assert.match(admin, /<h2 class="display h-card">Fotos para revisar<\/h2>/);
assert.match(admin, /\+'<\/div>'\+fotosRevisar\(\);/);
assert.match(admin, /\['pendientes','Para revisar \('\+pend\+'\)'\]/);
assert.match(admin, /No vino en la última importación/);
assert.match(admin, /quedó suspendido: no se muestra ni recibe pedidos de la red/);
const bulk = admin.match(/function bulkPlan\(v,c\)\{[\s\S]*?\n\}\nfunction bulkApply/)[0].replace(/\nfunction bulkApply$/, '');
const offers = [{ id: 'o9', vendorId: 'v1', sourceKey: 'viejo', status: 'published' }];
const ctx = { db: { offers }, tiendanubeSource: () => 'https://p.example/productos/x/', safeUrl: u => u || '', draftCategory: () => 'Fitness', today: () => '2026-10-31' };
vm.createContext(ctx); vm.runInContext(bulk, ctx);
const plan = ctx.bulkPlan({ id: 'v1', name: 'P', catalogDrafts: [
  { key: 'viejo', name: 'Ya no está', price: 100, units: 3, hidden: false, properties: [], ausenteEnUltimaImportacion: true },
  { key: 'nuevo', name: 'Disponible', price: 200, units: 3, hidden: false, properties: [] }] }, { unit: 'Unidad', minQty: 1, lead: 3, warranty: 6, shipAmba: 0, shipInt: 0 });
assert.equal(plan.n.create, 1); assert.equal(plan.n.pause, 1, 'lo que no vino en el archivo se pausa, no se republica');
console.log('OK: catálogo como vidriera (alta por aprobar, CUIT, red pausada, catálogo público, fotos, datos del comprador y reimportación).');

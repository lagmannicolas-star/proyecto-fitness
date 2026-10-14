// Worker "proyecto-fitness": publica el sitio y cobra con Mercado Pago en modo marketplace (pago dividido).
// Cada proveedor conecta su cuenta una vez (OAuth). En cada cobro Mercado Pago acredita la venta al proveedor
// y separa automáticamente la comisión del sitio (marketplace_fee) hacia la cuenta dueña de la aplicación.
//
// Las claves NO van en este archivo. Se cargan como secretos del Worker:
//   MP_CLIENT_SECRET           Client Secret de la aplicación de Mercado Pago
//   MP_WEBHOOK_SECRET          Clave secreta de las notificaciones (Webhooks) de Mercado Pago
//   SUPABASE_SERVICE_ROLE_KEY  Clave secret/service_role de Supabase (guardar conexiones y confirmar pagos)
//   TOKEN_KEY                  32 bytes al azar en base64: cifra las llaves de los proveedores y firma los enlaces
// Valores públicos en wrangler.jsonc: MP_CLIENT_ID, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, ALLOWED_ORIGINS.

const MP_API = 'https://api.mercadopago.com';
const MP_AUTH = 'https://auth.mercadopago.com.ar/authorization';
const enc = new TextEncoder(), dec = new TextDecoder();
// MP_API_URL y MP_AUTH_URL solo se usan para pruebas locales con un Mercado Pago simulado.
const mpApi = env => env.MP_API_URL || MP_API;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    try {
      return await api(request, env, url);
    } catch (e) {
      console.error('api error', e && e.stack || e);
      return json({ error: 'Error interno. Probá de nuevo en unos minutos.' }, 500, cors(request, env));
    }
  },
};

async function api(request, env, url) {
  const headers = cors(request, env);
  const route = request.method + ' ' + url.pathname;
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (route === 'GET /api/pagos/estado') return json({ mercadoPago: configured(env) }, 200, headers);
  if (!configured(env)) return json({ error: 'Mercado Pago todavía no está configurado.' }, 503, headers);
  if (route === 'POST /api/pagos/conectar') return connectStart(request, env, headers);
  if (route === 'GET /api/pagos/conectado') return connectFinish(request, env, url);
  if (route === 'POST /api/pagos/desconectar') return disconnect(request, env, headers);
  if (route === 'POST /api/pagos/preferencia') return createPreference(request, env, headers);
  if (route === 'POST /api/pagos/aviso') return paymentNotice(request, env, url);
  return json({ error: 'No encontrado' }, 404, headers);
}

export function configured(env) {
  return !!(env.MP_CLIENT_ID && env.MP_CLIENT_SECRET && env.MP_WEBHOOK_SECRET && env.TOKEN_KEY &&
    env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_URL && env.SUPABASE_PUBLISHABLE_KEY);
}

function allowedOrigins(request, env) {
  const list = String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  list.push(new URL(request.url).origin);
  return list;
}

function cors(request, env) {
  const origin = request.headers.get('Origin');
  const h = { Vary: 'Origin' };
  if (origin && allowedOrigins(request, env).includes(origin)) {
    h['Access-Control-Allow-Origin'] = origin;
    h['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    h['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
  }
  return h;
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), { status, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
}

const round2 = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const b64 = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = s => Uint8Array.from(atob(String(s).replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

// ---------- Supabase ----------
async function rpc(env, fn, args, auth) {
  const key = auth.service ? env.SUPABASE_SERVICE_ROLE_KEY : env.SUPABASE_PUBLISHABLE_KEY;
  const headers = { apikey: key, 'Content-Type': 'application/json' };
  if (auth.user) headers.Authorization = 'Bearer ' + auth.user;
  // Las claves service_role antiguas son JWT y también van como Authorization; las nuevas sb_secret_ solo en apikey.
  else if (auth.service && key.startsWith('eyJ')) headers.Authorization = 'Bearer ' + key;
  const r = await fetch(env.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/rpc/' + fn, { method: 'POST', headers, body: JSON.stringify(args) });
  let data = null;
  try { data = await r.json(); } catch (e) { /* respuesta vacía */ }
  return { ok: r.ok, status: r.status, data };
}

// Identifica a quien llama con su sesión de Supabase (nunca con datos que mande el navegador).
async function whoAmI(request, env) {
  const m = /^Bearer\s+(\S+)$/.exec(request.headers.get('Authorization') || '');
  if (!m || m[1] === 'null') return null;
  const snap = await rpc(env, 'fitness_snapshot', {}, { user: m[1] });
  if (!snap.ok || !snap.data || !snap.data._identity) return null;
  return { identity: snap.data._identity, snapshot: snap.data };
}

// ---------- Cifrado de llaves y firma de enlaces ----------
async function keys(env) {
  const raw = unb64(env.TOKEN_KEY);
  if (raw.length !== 32) throw Error('TOKEN_KEY debe tener 32 bytes en base64');
  return {
    aes: await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']),
    mac: await crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']),
  };
}
async function seal(env, data) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const out = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, (await keys(env)).aes, enc.encode(JSON.stringify(data)));
  return b64(iv) + '.' + b64(new Uint8Array(out));
}
async function unseal(env, text) {
  const [iv, data] = String(text).split('.');
  return JSON.parse(dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, (await keys(env)).aes, unb64(data))));
}
async function sign(env, data) {
  const body = b64(enc.encode(JSON.stringify(data)));
  return body + '.' + b64(new Uint8Array(await crypto.subtle.sign('HMAC', (await keys(env)).mac, enc.encode(body))));
}
async function verify(env, token) {
  const [body, mac] = String(token || '').split('.');
  if (!body || !mac) return null;
  const ok = await crypto.subtle.verify('HMAC', (await keys(env)).mac, unb64(mac), enc.encode(body)).catch(() => false);
  if (!ok) return null;
  const data = JSON.parse(dec.decode(unb64(body)));
  return data.exp > Date.now() ? data : null;
}

function checkReturn(request, env, raw) {
  let u;
  try { u = new URL(String(raw || '')); } catch (e) { return null; }
  if (!allowedOrigins(request, env).includes(u.origin)) return null;
  u.search = ''; u.hash = '';
  return u.href;
}

// ---------- Conexión de la cuenta del proveedor (OAuth) ----------
async function connectStart(request, env, headers) {
  const me = await whoAmI(request, env);
  if (!me || !me.identity.vendorId) return json({ error: 'Ingresá con tu cuenta de proveedor.' }, 401, headers);
  const body = await request.json().catch(() => ({}));
  const back = checkReturn(request, env, body.returnUrl);
  if (!back) return json({ error: 'Dirección de regreso no permitida.' }, 400, headers);
  const state = await sign(env, { v: me.identity.vendorId, r: back, exp: Date.now() + 15 * 60 * 1000 });
  const auth = new URL(env.MP_AUTH_URL || MP_AUTH);
  auth.search = new URLSearchParams({ client_id: env.MP_CLIENT_ID, response_type: 'code', platform_id: 'mp', state, redirect_uri: new URL(request.url).origin + '/api/pagos/conectado' }).toString();
  return json({ url: auth.href }, 200, headers);
}

async function connectFinish(request, env, url) {
  const state = await verify(env, url.searchParams.get('state'));
  if (!state) return new Response('El enlace para conectar Mercado Pago venció. Volvé a intentarlo desde tu panel.', { status: 400 });
  const back = s => Response.redirect(state.r + '?mp=' + s, 302);
  const code = url.searchParams.get('code');
  if (!code) return back('cancelado');
  const r = await fetch(mpApi(env) + '/oauth/token', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: env.MP_CLIENT_ID, client_secret: env.MP_CLIENT_SECRET, grant_type: 'authorization_code', code, redirect_uri: url.origin + '/api/pagos/conectado' }),
  });
  const t = await r.json().catch(() => ({}));
  if (!r.ok || !t.access_token || !t.user_id) { console.error('oauth token', r.status, JSON.stringify(t).slice(0, 300)); return back('error'); }
  const saved = await storeAccount(env, state.v, t);
  if (!saved) return back('error');
  return back('ok');
}

async function storeAccount(env, vendorId, t) {
  const secret = await seal(env, { access_token: t.access_token, refresh_token: t.refresh_token });
  const expires = new Date(Date.now() + (Number(t.expires_in) || 15552000) * 1000).toISOString();
  const r = await rpc(env, 'fitness_mp_link', { p_vendor_id: vendorId, p_mp_user_id: String(t.user_id), p_secret: secret, p_expires_at: expires }, { service: true });
  if (!r.ok) console.error('supabase mp link', r.status, JSON.stringify(r.data).slice(0, 300));
  return r.ok;
}

async function disconnect(request, env, headers) {
  const me = await whoAmI(request, env);
  if (!me || !me.identity.vendorId) return json({ error: 'Ingresá con tu cuenta de proveedor.' }, 401, headers);
  const r = await rpc(env, 'fitness_mp_unlink', { p_vendor_id: me.identity.vendorId }, { service: true });
  return r.ok ? json({ ok: true }, 200, headers) : json({ error: 'No se pudo desconectar.' }, 500, headers);
}

// Devuelve la llave vigente del proveedor; la renueva si vence en menos de 30 días.
async function vendorAccount(env, vendorId) {
  const r = await rpc(env, 'fitness_mp_account', { p_vendor_id: vendorId }, { service: true });
  if (!r.ok || !r.data || !r.data.secret) return null;
  const tokens = await unseal(env, r.data.secret);
  const account = { userId: String(r.data.mp_user_id), token: tokens.access_token };
  if (Date.parse(r.data.expires_at) - Date.now() < 30 * 24 * 3600 * 1000 && tokens.refresh_token) {
    const f = await fetch(mpApi(env) + '/oauth/token', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: env.MP_CLIENT_ID, client_secret: env.MP_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: tokens.refresh_token }),
    });
    const t = await f.json().catch(() => ({}));
    if (f.ok && t.access_token) { await storeAccount(env, vendorId, { ...t, user_id: t.user_id || account.userId }); account.token = t.access_token; }
    else console.error('oauth refresh', f.status);
  }
  return account;
}

// ---------- Cobro ----------
// El total y la comisión salen de la base de datos (pedido reservado), nunca de lo que mande el navegador.
async function createPreference(request, env, headers) {
  const me = await whoAmI(request, env);
  if (!me) return json({ error: 'Ingresá a tu cuenta para pagar.' }, 401, headers);
  const body = await request.json().catch(() => ({}));
  const payRef = String(body.payRef || '');
  if (!/^[A-Za-z0-9-]{16,100}$/.test(payRef)) return json({ error: 'Referencia de pago inválida.' }, 400, headers);
  const back = checkReturn(request, env, body.returnUrl);
  if (!back) return json({ error: 'Dirección de regreso no permitida.' }, 400, headers);
  const orders = (me.snapshot.orders || []).filter(o => o.payRef === payRef && String(o.buyerId) === String(me.identity.id));
  if (!orders.length) return json({ error: 'No encontramos ese pedido.' }, 404, headers);
  if (orders.some(o => o.status !== 'pending_payment')) return json({ error: 'Este pedido ya no está pendiente de pago.' }, 409, headers);
  const vendorId = orders[0].vendorId;
  if (orders.some(o => o.vendorId !== vendorId)) return json({ error: 'Cada pago corresponde a un solo proveedor.' }, 400, headers);
  const expires = Math.min(...orders.map(o => Date.parse(o.expiresAt) || 0));
  if (!expires || expires < Date.now() + 60 * 1000) return json({ error: 'La reserva venció. Volvé a armar el carrito.' }, 409, headers);
  const account = await vendorAccount(env, vendorId);
  if (!account) return json({ error: 'Este proveedor todavía no conectó su Mercado Pago. Tu pedido quedó reservado 30 minutos.' }, 409, headers);

  const vendor = (me.snapshot.vendors || []).find(v => v.id === vendorId) || { name: 'Proveedor' };
  const fee = round2(orders.reduce((sum, o) => sum + Number(o.commission || 0), 0));
  const items = orders.map(o => ({
    id: String(o.id),
    title: (String(o.desc || 'Producto') + ' × ' + o.qty + (o.shipping ? ' (incluye envío)' : '')).slice(0, 250),
    description: 'Proveedor: ' + vendor.name,
    quantity: 1,
    unit_price: round2(Number(o.subtotal) + Number(o.shipping || 0)),
    currency_id: 'ARS',
  }));
  const self = new URL(request.url).origin;
  const preference = {
    items,
    marketplace_fee: fee,
    external_reference: payRef,
    payer: me.identity.email ? { email: me.identity.email } : undefined,
    notification_url: self + '/api/pagos/aviso?v=' + encodeURIComponent(vendorId),
    back_urls: { success: back + '?pago=ok', pending: back + '?pago=pendiente', failure: back + '?pago=error' },
    auto_return: 'approved',
    expires: true,
    expiration_date_to: new Date(expires).toISOString(),
    statement_descriptor: ('CFIT*' + String(vendor.name).normalize('NFD').replace(/[^A-Za-z0-9]/g, '').toUpperCase()).slice(0, 13),
    metadata: { pay_ref: payRef, vendor_id: vendorId },
  };
  // Se crea con la llave del proveedor: la venta se acredita en su cuenta y marketplace_fee va a la cuenta del sitio.
  const r = await fetch(mpApi(env) + '/checkout/preferences', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + account.token, 'Content-Type': 'application/json', 'X-Idempotency-Key': payRef },
    body: JSON.stringify(preference),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !(data.init_point || data.sandbox_init_point)) {
    console.error('mercadopago preference', r.status, JSON.stringify(data).slice(0, 500));
    return json({ error: 'Mercado Pago no pudo crear el cobro. Tu pedido sigue reservado 30 minutos.' }, 502, headers);
  }
  return json({ url: data.init_point || data.sandbox_init_point, preferenceId: data.id, fee }, 200, headers);
}

// Verifica la firma de Mercado Pago (cabecera x-signature) según su documentación de Webhooks.
export async function validSignature(secret, signature, requestId, dataId) {
  const parts = Object.fromEntries(String(signature || '').split(',').map(p => p.split('=').map(s => s.trim())).filter(p => p.length === 2));
  if (!parts.ts || !parts.v1 || !dataId) return false;
  const id = /^[a-z0-9]+$/i.test(dataId) ? String(dataId).toLowerCase() : String(dataId);
  const manifest = 'id:' + id + ';' + (requestId ? 'request-id:' + requestId + ';' : '') + 'ts:' + parts.ts + ';';
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const hex = [...new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(manifest)))].map(b => b.toString(16).padStart(2, '0')).join('');
  if (hex.length !== parts.v1.length) return false;
  let diff = 0;
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ parts.v1.charCodeAt(i);
  return diff === 0;
}

// Aviso de Mercado Pago. Nunca se confía en el contenido del aviso: se consulta el pago real en Mercado Pago
// con la llave del proveedor y solo eso se registra.
async function paymentNotice(request, env, url) {
  const body = await request.json().catch(() => ({}));
  const type = url.searchParams.get('type') || url.searchParams.get('topic') || body.type;
  const dataId = String(url.searchParams.get('data.id') || url.searchParams.get('id') || (body.data && body.data.id) || '');
  const vendorId = url.searchParams.get('v');
  if (type !== 'payment' || !dataId || !vendorId) return json({ ok: true, ignored: true }, 200, {});
  const signature = request.headers.get('x-signature');
  if (signature && !(await validSignature(env.MP_WEBHOOK_SECRET, signature, request.headers.get('x-request-id'), dataId))) {
    return json({ error: 'Firma inválida' }, 401, {});
  }
  const account = await vendorAccount(env, vendorId);
  if (!account) return json({ ok: true, ignored: true }, 200, {});
  const r = await fetch(mpApi(env) + '/v1/payments/' + encodeURIComponent(dataId), { headers: { Authorization: 'Bearer ' + account.token } });
  if (!r.ok) { console.error('mercadopago payment', r.status); return json({ error: 'No se pudo consultar el pago' }, 502, {}); }
  const p = await r.json();
  if (p.collector_id != null && String(p.collector_id) !== account.userId) return json({ ok: true, ignored: true }, 200, {});
  const fee = (p.fee_details || []).filter(f => f.type === 'application_fee').reduce((s, f) => s + Number(f.amount || 0), 0);
  const saved = await rpc(env, 'fitness_register_payment', {
    pay_ref: String(p.external_reference || ''),
    p_vendor_id: vendorId,
    payment: { id: String(p.id), status: p.status, statusDetail: p.status_detail, amount: p.transaction_amount, currency: p.currency_id, approvedAt: p.date_approved || null, marketplaceFee: round2(fee) },
  }, { service: true });
  if (!saved.ok) {
    console.error('supabase register payment', saved.status, JSON.stringify(saved.data).slice(0, 300));
    return json({ error: 'No se pudo registrar el pago' }, 500, {});
  }
  return json({ ok: true }, 200, {});
}

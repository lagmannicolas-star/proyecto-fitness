-- Pago de la oferta elegida con Mercado Pago (pago dividido / marketplace).
-- Cada proveedor de la red conecta su cuenta de Mercado Pago desde su link privado (cuando lo eligen o antes).
-- El comprador paga desde su solicitud: Mercado Pago le acredita la venta al proveedor y separa la comisión
-- del sitio (su % sobre los productos, sin el envío) hacia la cuenta de Nexo Fit.
-- Las llaves del proveedor las cifra el Worker; acá solo se guardan cifradas y sin acceso para visitantes.
begin;

create table if not exists public.fitness_mp_red(
 proveedor_id bigint primary key references public.fitness_red_proveedores(id) on delete cascade,
 mp_user_id text not null,
 secret text not null,
 expires_at timestamptz not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.fitness_mp_red enable row level security;
revoke all on table public.fitness_mp_red from public,anon,authenticated;
grant select,insert,update,delete on table public.fitness_mp_red to service_role;

alter table public.fitness_solicitudes add column if not exists pago_estado text check (pago_estado in ('pendiente','aprobado','rechazado','devuelto'));
alter table public.fitness_solicitudes add column if not exists pago_id text;
alter table public.fitness_solicitudes add column if not exists pago_monto numeric(14,2);
alter table public.fitness_solicitudes add column if not exists pago_comision numeric(14,2);
alter table public.fitness_solicitudes add column if not exists pago_at timestamptz;
alter table public.fitness_solicitudes add column if not exists pago_alerta text;

create or replace function public.fitness_mp_red_conectado(p_proveedor bigint) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.fitness_mp_red where proveedor_id=p_proveedor)
$$;

-- Comisión vigente del proveedor de la red (la suya, o la general del sitio, o 10%).
create or replace function public.fitness_red_comision_pct(p_proveedor bigint) returns numeric
language sql stable security definer set search_path='' as $$
 select coalesce((select comision from public.fitness_red_proveedores where id=p_proveedor),
  (select (data->>'commission')::numeric from public.fitness_state where id=true), 10)
$$;

-- El Worker identifica al proveedor por su link privado (sin datos del comprador).
create or replace function public.fitness_red_por_token(p_token text) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('proveedor_id',i.proveedor_id,'nombre',r.nombre)
 from public.fitness_invitaciones i join public.fitness_red_proveedores r on r.id=i.proveedor_id
 where i.token=lower(coalesce(p_token,'')) and coalesce(p_token,'') ~* '^[0-9a-f]{64}$'
$$;

create or replace function public.fitness_mp_red_account(p_proveedor bigint) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object('mp_user_id',a.mp_user_id,'secret',a.secret,'expires_at',a.expires_at) from public.fitness_mp_red a where a.proveedor_id=p_proveedor
$$;

create or replace function public.fitness_mp_red_link(p_proveedor bigint, p_mp_user_id text, p_secret text, p_expires_at timestamptz) returns jsonb
language plpgsql security definer set search_path='' as $$
declare nuevo boolean; x record; site text;
begin
 if not exists(select 1 from public.fitness_red_proveedores where id=p_proveedor) then raise exception 'Proveedor inexistente'; end if;
 if exists(select 1 from public.fitness_mp_red where mp_user_id=p_mp_user_id and proveedor_id<>p_proveedor) then raise exception 'Esa cuenta de Mercado Pago ya está conectada a otro proveedor'; end if;
 nuevo := not exists(select 1 from public.fitness_mp_red where proveedor_id=p_proveedor);
 insert into public.fitness_mp_red(proveedor_id,mp_user_id,secret,expires_at) values(p_proveedor,p_mp_user_id,p_secret,p_expires_at)
  on conflict(proveedor_id) do update set mp_user_id=excluded.mp_user_id,secret=excluded.secret,expires_at=excluded.expires_at,updated_at=now();
 if nuevo then
  -- Si ya lo eligieron y falta el pago, el comprador se entera de que ya puede pagar.
  select site_url into site from public.fitness_avisos_config where id;
  for x in select s.code, s.nombre, s.email, r.nombre prov from public.fitness_solicitudes s
   join public.fitness_ofertas_solicitud o on o.id=s.oferta_elegida join public.fitness_invitaciones i on i.id=o.invitacion_id
   join public.fitness_red_proveedores r on r.id=i.proveedor_id
   where i.proveedor_id=p_proveedor and s.status='elegida' and coalesce(s.pago_estado,'') not in ('aprobado','devuelto') loop
   perform public.fitness_aviso_encolar('pago_disponible',x.code,'Ya se puede pagar '||x.code,
    x.prov||' conectó su Mercado Pago: el comprador de '||x.code||' ya puede pagar desde su solicitud.',
    x.email,'Ya podés pagar tu compra · '||x.code,
    'Hola '||x.nombre||', '||x.prov||' ya puede recibir tu pago. Pagá con Mercado Pago desde tu solicitud: '||site||'/mi-solicitud.html?codigo='||x.code,
    public.fitness_aviso_email_html('Ya podés pagar tu compra',
     '<p style="line-height:1.5">Hola '||public.fitness_html(x.nombre)||', <b>'||public.fitness_html(x.prov)||'</b> ya puede recibir tu pago para la solicitud <b>'||x.code||'</b>.</p>'
     ||'<p style="line-height:1.5">Pagá con Mercado Pago desde tu solicitud. Vas a necesitar tu número de solicitud y este email.</p>',
     'Pagar mi compra',site||'/mi-solicitud.html?codigo='||x.code));
  end loop;
 end if;
 return jsonb_build_object('ok',true);
end $$;

create or replace function public.fitness_mp_red_unlink(p_proveedor bigint) returns jsonb
language sql security definer set search_path='' as $$
 delete from public.fitness_mp_red where proveedor_id=p_proveedor returning jsonb_build_object('ok',true)
$$;

-- Datos del cobro de una solicitud (solo para el Worker). El monto y la comisión salen siempre de la base.
create or replace function public.fitness_sol_pago_datos(p_code text, p_email text) returns jsonb
language plpgsql stable security definer set search_path='' set timezone='America/Argentina/Buenos_Aires' as $$
declare s public.fitness_solicitudes; o public.fitness_ofertas_solicitud; r public.fitness_red_proveedores; pct numeric;
begin
 select * into s from public.fitness_solicitudes x where x.code=upper(btrim(coalesce(p_code,''))) and x.email=lower(btrim(coalesce(p_email,'')));
 if not found then raise exception 'No encontramos una solicitud con ese número y ese email'; end if;
 if s.status<>'elegida' or s.oferta_elegida is null then raise exception 'Primero elegí una oferta'; end if;
 if s.pago_estado in ('aprobado','devuelto') then raise exception 'Esta compra ya tiene un pago registrado'; end if;
 select * into o from public.fitness_ofertas_solicitud where id=s.oferta_elegida;
 select r2.* into r from public.fitness_red_proveedores r2 join public.fitness_invitaciones i on i.proveedor_id=r2.id where i.id=o.invitacion_id;
 if o.valida_hasta < current_date then raise exception 'La oferta elegida venció el %. Escribinos y le pedimos al proveedor que la renueve', to_char(o.valida_hasta,'DD/MM'); end if;
 pct := public.fitness_red_comision_pct(r.id);
 return jsonb_build_object('code',s.code,'email',s.email,'oferta_id',o.id,'proveedor_id',r.id,'proveedor',r.nombre,
  'precio',o.precio_total,'envio',o.envio,'total',o.precio_total+o.envio,'comision_pct',pct,
  'comision',round(o.precio_total*pct/100,2),'mp',public.fitness_mp_red_conectado(r.id));
end $$;

-- Registra el pago consultado en Mercado Pago (solo el Worker). Idempotente.
create or replace function public.fitness_sol_registrar_pago(p_code text, p_proveedor bigint, payment jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s public.fitness_solicitudes; o public.fitness_ofertas_solicitud; prov bigint; st text; nuevo text; alerta text; total numeric;
begin
 select * into s from public.fitness_solicitudes where code=upper(btrim(coalesce(p_code,''))) for update;
 if not found or s.oferta_elegida is null then return jsonb_build_object('found',false); end if;
 select * into o from public.fitness_ofertas_solicitud where id=s.oferta_elegida;
 select i.proveedor_id into prov from public.fitness_invitaciones i where i.id=o.invitacion_id;
 if prov is distinct from p_proveedor then return jsonb_build_object('found',false); end if;
 st := payment->>'status'; total := o.precio_total+o.envio;
 nuevo := case when st='approved' then 'aprobado' when st in ('refunded','charged_back') then 'devuelto'
               when st in ('rejected','cancelled') then 'rechazado' else 'pendiente' end;
 -- Un pago rechazado o pendiente nunca pisa uno aprobado (pueden convivir varios intentos).
 if s.pago_estado='aprobado' and nuevo in ('rechazado','pendiente') then return jsonb_build_object('found',true,'changed',false); end if;
 if s.pago_estado='aprobado' and nuevo='aprobado' and s.pago_id is distinct from (payment->>'id') then
  update public.fitness_solicitudes set pago_alerta='Se recibió un segundo pago ('||(payment->>'id')||'): revisar y devolver' where code=s.code;
  return jsonb_build_object('found',true,'changed',true);
 end if;
 if s.pago_estado is not distinct from nuevo and s.pago_id is not distinct from (payment->>'id') then return jsonb_build_object('found',true,'changed',false); end if;
 if nuevo='aprobado' and ((payment->>'currency') is distinct from 'ARS' or coalesce((payment->>'amount')::numeric,0) < total-0.01) then
  alerta := 'El monto cobrado no coincide con la oferta: revisar antes de entregar';
 end if;
 update public.fitness_solicitudes set pago_estado=nuevo, pago_id=payment->>'id', pago_monto=(payment->>'amount')::numeric,
  pago_comision=nullif(payment->>'marketplaceFee','')::numeric, pago_at=case when nuevo='aprobado' then now() else pago_at end,
  pago_alerta=coalesce(alerta,pago_alerta) where code=s.code;
 return jsonb_build_object('found',true,'changed',true);
end $$;

-- Avisos del pago: al admin, al comprador y al proveedor (que recién ahí recibe los datos para entregar).
create or replace function public.fitness_aviso_tr_pago() returns trigger
language plpgsql security definer set search_path='' as $$
declare site text; prov text; pmail text; ptel text; tok text; o public.fitness_ofertas_solicitud; neto numeric;
begin
 if new.pago_estado is not distinct from old.pago_estado or new.pago_estado not in ('aprobado','devuelto') then return new; end if;
 begin
  select site_url into site from public.fitness_avisos_config where id;
  select * into o from public.fitness_ofertas_solicitud where id=new.oferta_elegida;
  select r.nombre, r.email, r.whatsapp, i.token into prov, pmail, ptel, tok from public.fitness_invitaciones i join public.fitness_red_proveedores r on r.id=i.proveedor_id where i.id=o.invitacion_id;
  neto := coalesce(new.pago_monto,o.precio_total+o.envio)-coalesce(new.pago_comision,0);
  if new.pago_estado='aprobado' then
   perform public.fitness_aviso_encolar('pago_aprobado',new.code,'Pago acreditado: '||new.code,
    new.nombre||' pagó '||public.fitness_pesos(new.pago_monto)||' a '||coalesce(prov,'el proveedor')||' por Mercado Pago (comisión Nexo Fit: '||public.fitness_pesos(coalesce(new.pago_comision,0))||').'||chr(10)
     ||'Comprador: '||new.nombre||' · '||new.telefono||' · '||new.email||chr(10)||'Proveedor: '||coalesce(prov,'')||coalesce(' · WhatsApp '||ptel,'')||chr(10)
     ||coalesce(new.pago_alerta||chr(10),'')||'Al proveedor ya le pasamos los datos para entregar. Cuando se entregue, marcala como Cerrada.',
    new.email,'Recibimos tu pago · '||new.code,
    'Hola '||new.nombre||', Mercado Pago acreditó tu pago de '||public.fitness_pesos(new.pago_monto)||' a '||coalesce(prov,'el proveedor')||' por tu solicitud '||new.code||'. El proveedor te va a contactar para coordinar la entrega en '||new.localidad||' y te envía la factura.',
    public.fitness_aviso_email_html('Recibimos tu pago',
     '<p style="line-height:1.5">Hola '||public.fitness_html(new.nombre)||', Mercado Pago acreditó tu pago de <b>'||public.fitness_pesos(new.pago_monto)||'</b> a <b>'||public.fitness_html(coalesce(prov,'el proveedor'))||'</b> por tu solicitud <b>'||new.code||'</b>.</p>'
     ||'<p style="line-height:1.5">El proveedor te va a contactar para coordinar la entrega en '||public.fitness_html(new.localidad)||' y te envía la factura. Si algo no sale como acordamos, respondé este email y te ayudamos.</p>',
     'Ver mi compra',site||'/mi-solicitud.html?codigo='||new.code));
   perform public.fitness_aviso_mail('pago_aprobado_proveedor',new.code,pmail,
    'Les pagaron el pedido '||new.code||': coordinen la entrega',
    'Hola, equipo de '||coalesce(prov,'')||'. El comprador del pedido '||new.code||' pagó '||public.fitness_pesos(new.pago_monto)||' por Mercado Pago. A su cuenta de Mercado Pago llegan '||public.fitness_pesos(neto)
     ||' (se descuenta la comisión de Nexo Fit de '||public.fitness_pesos(coalesce(new.pago_comision,0))||'; Mercado Pago aplica además su propio cargo).'||chr(10)
     ||'Datos para la entrega y la factura:'||chr(10)||'• '||new.nombre||coalesce(' ('||nullif(new.empresa,'')||')','')||chr(10)||'• WhatsApp: '||new.telefono||chr(10)||'• Email: '||new.email||chr(10)
     ||'• Entrega en: '||new.localidad||', '||new.provincia||chr(10)||'• Factura: '||case when new.factura='no' then 'no necesita' else new.factura end||chr(10)
     ||'Contáctenlo para coordinar la entrega en el plazo de su oferta ('||o.plazo_dias||' días hábiles) y envíenle la factura. Su oferta: '||site||'/oferta.html#t='||tok,
    public.fitness_aviso_email_html('Les pagaron: coordinen la entrega',
     '<p style="line-height:1.5">Hola, equipo de '||public.fitness_html(coalesce(prov,''))||'. El comprador del pedido <b>'||new.code||'</b> pagó <b>'||public.fitness_pesos(new.pago_monto)||'</b> por Mercado Pago. A su cuenta llegan <b>'||public.fitness_pesos(neto)
     ||'</b> (se descuenta la comisión de Nexo Fit de '||public.fitness_pesos(coalesce(new.pago_comision,0))||'; Mercado Pago aplica además su propio cargo).</p>'
     ||'<p style="line-height:1.5"><b>Datos para la entrega y la factura</b><br>'||public.fitness_html(new.nombre)||coalesce(' ('||public.fitness_html(nullif(new.empresa,''))||')','')||'<br>WhatsApp: '||public.fitness_html(new.telefono)
     ||'<br>Email: '||public.fitness_html(new.email)||'<br>Entrega en: '||public.fitness_html(new.localidad||', '||new.provincia)||'<br>Factura: '||case when new.factura='no' then 'no necesita' else new.factura end||'</p>'
     ||'<p style="line-height:1.5">Contáctenlo para coordinar la entrega en el plazo de su oferta ('||o.plazo_dias||' días hábiles) y envíenle la factura.</p>',
     'Ver mi oferta',site||'/oferta.html#t='||tok));
  else
   perform public.fitness_aviso_encolar('pago_devuelto',new.code,'Pago devuelto: '||new.code,
    'Mercado Pago informa el pago de '||new.code||' como devuelto o desconocido por el comprador. Revisá con '||coalesce(prov,'el proveedor')||' antes de entregar.',
    null,null,null,null);
   perform public.fitness_aviso_mail('pago_devuelto_proveedor',new.code,pmail,
    'Atención: pago devuelto en el pedido '||new.code,
    'Hola, equipo de '||coalesce(prov,'')||'. Mercado Pago informa el pago del pedido '||new.code||' como devuelto o desconocido por el comprador. Si todavía no entregaron, esperen a que lo revisemos juntos. Respondan este email ante cualquier duda.',
    public.fitness_aviso_email_html('Pago devuelto en el pedido '||new.code,
     '<p style="line-height:1.5">Hola, equipo de '||public.fitness_html(coalesce(prov,''))||'. Mercado Pago informa el pago del pedido <b>'||new.code||'</b> como devuelto o desconocido por el comprador.</p>'
     ||'<p style="line-height:1.5">Si todavía no entregaron, esperen a que lo revisemos juntos. Respondan este email ante cualquier duda.</p>',
     'Ir a Nexo Fit',site));
  end if;
 exception when others then
  raise warning 'Aviso de pago no encolado (%): %', new.code, sqlerrm;
 end;
 return new;
end $$;
create or replace trigger fitness_aviso_pago after update of pago_estado on public.fitness_solicitudes
 for each row execute function public.fitness_aviso_tr_pago();

-- Al elegir: el comprador paga desde su solicitud; el proveedor elegido conecta Mercado Pago si todavía no lo hizo.
create or replace function public.fitness_aviso_tr_solicitud() returns trigger
language plpgsql security definer set search_path='' as $$
declare site text; n int; link text; it jsonb; lista text := ''; prov text; tot numeric; ptel text; x record; o public.fitness_ofertas_solicitud; olink text; mp boolean; pid bigint;
begin
 begin
  select site_url into site from public.fitness_avisos_config where id;
  link := site||'/mi-solicitud.html?codigo='||new.code;
  if tg_op='INSERT' then
   n := jsonb_array_length(new.items);
   for it in select * from jsonb_array_elements(new.items) loop lista := lista||'• '||(it->>'cantidad')||' × '||(it->>'producto')||chr(10); end loop;
   perform public.fitness_aviso_encolar('solicitud_nueva',new.code,
    'Nueva solicitud '||new.code,
    n||(case when n=1 then ' producto' else ' productos' end)||' para '||new.tipo||' en '||new.localidad||', '||new.provincia||'.'||chr(10)||lista
     ||'Ya les llega por email a todos los proveedores activos de la red. Si querés reforzar, mandales el link por WhatsApp desde Solicitudes en el panel.',
    new.email,'Recibimos tu solicitud '||new.code,
    'Hola '||new.nombre||', recibimos tu pedido de ofertas '||new.code||'. Ya se lo enviamos a los proveedores de nuestra red. Cuando lleguen las ofertas te avisamos y las vas a ver comparadas en '||link,
    public.fitness_aviso_email_html('Recibimos tu solicitud '||new.code,
     '<p style="line-height:1.5">Hola '||public.fitness_html(new.nombre)||', ya les enviamos tu pedido a los proveedores de nuestra red:</p><p style="white-space:pre-line;line-height:1.5">'||public.fitness_html(lista)||'</p>'
     ||'<p style="line-height:1.5">Cuando lleguen las ofertas te avisamos por este medio y las vas a ver comparadas, con nuestra recomendación. Pedir ofertas no te compromete a comprar.</p>'
     ||'<p style="line-height:1.5">Tu número de solicitud es <b>'||new.code||'</b>. Guardalo junto con este email para entrar a verla.</p>',
     'Seguir mi solicitud',link));
  elsif tg_op='UPDATE' and new.status='elegida' and old.status is distinct from 'elegida' then
   select r.nombre, o2.precio_total+o2.envio, r.whatsapp, r.id into prov, tot, ptel, pid
   from public.fitness_ofertas_solicitud o2 join public.fitness_invitaciones i on i.id=o2.invitacion_id join public.fitness_red_proveedores r on r.id=i.proveedor_id
   where o2.id=new.oferta_elegida;
   mp := public.fitness_mp_red_conectado(pid);
   perform public.fitness_aviso_encolar('oferta_elegida',new.code,
    'Eligieron una oferta: '||new.code,
    new.nombre||' eligió la oferta de '||coalesce(prov,'un proveedor')||' por '||public.fitness_pesos(tot)||'.'||chr(10)
     ||'Comprador: '||new.nombre||' · '||new.telefono||' · '||new.email||chr(10)||'Proveedor: '||coalesce(prov,'')||coalesce(' · WhatsApp '||ptel,'')||chr(10)
     ||case when mp then 'El proveedor ya tiene Mercado Pago conectado: el comprador puede pagar desde su solicitud.'
            else 'El proveedor todavía no conectó Mercado Pago: ya le pedimos por email que lo haga. Si tarda, escribile.' end,
    new.email,'Elegiste tu oferta · '||new.code,
    'Elegiste la oferta de '||coalesce(prov,'un proveedor')||' por '||public.fitness_pesos(tot)||'. '
     ||case when mp then 'Ya podés pagar con Mercado Pago desde tu solicitud: '||link else 'En cuanto el proveedor active su cobro con Mercado Pago te avisamos para que pagues desde tu solicitud.' end,
    public.fitness_aviso_email_html('Elegiste tu oferta',
     '<p style="line-height:1.5">Elegiste la oferta de <b>'||public.fitness_html(coalesce(prov,'un proveedor'))||'</b> por <b>'||public.fitness_pesos(tot)||'</b> para tu solicitud '||new.code||'.</p>'
     ||case when mp then '<p style="line-height:1.5">Ya podés pagar con Mercado Pago desde tu solicitud. La compra queda confirmada cuando Mercado Pago acredita el pago.</p>'
            else '<p style="line-height:1.5">En cuanto el proveedor active su cobro con Mercado Pago te avisamos para que pagues desde tu solicitud. Todavía no se te cobró nada.</p>' end,
     case when mp then 'Pagar mi compra' else 'Ver mi solicitud' end,link));
   for x in select r.nombre, r.email, i.token, oo.id oid from public.fitness_ofertas_solicitud oo
    join public.fitness_invitaciones i on i.id=oo.invitacion_id join public.fitness_red_proveedores r on r.id=i.proveedor_id
    where i.solicitud_code=new.code loop
    olink := site||'/oferta.html#t='||x.token;
    if x.oid=new.oferta_elegida then
     select * into o from public.fitness_ofertas_solicitud where id=x.oid;
     perform public.fitness_aviso_mail('oferta_ganadora',new.code,x.email,
      'Eligieron su oferta · '||new.code,
      'Hola, equipo de '||x.nombre||'. El comprador del pedido '||new.code||' ('||new.localidad||', '||new.provincia||') eligió su oferta: '||public.fitness_oferta_resumen(o)||'.'||chr(10)
       ||case when mp then 'El comprador paga con Mercado Pago y el dinero llega a su cuenta, menos la comisión de Nexo Fit. Cuando se acredite les pasamos los datos para coordinar la entrega y la factura.'
              else 'Para cobrar, conecten su cuenta de Mercado Pago desde su link privado (un minuto): el comprador paga ahí y el dinero llega a su cuenta, menos la comisión de Nexo Fit. Cuando se acredite les pasamos los datos para la entrega y la factura.' end||chr(10)
       ||'Mantengan el precio, el stock y las condiciones de la oferta. Su link privado: '||olink,
      public.fitness_aviso_email_html('Eligieron su oferta',
       '<p style="line-height:1.5">Hola, equipo de '||public.fitness_html(x.nombre)||'. El comprador del pedido <b>'||new.code||'</b> ('||public.fitness_html(new.localidad||', '||new.provincia)||') eligió su oferta:</p>'
       ||'<p style="line-height:1.5"><b>'||public.fitness_html(public.fitness_oferta_resumen(o))||'</b></p>'
       ||case when mp then '<p style="line-height:1.5">El comprador paga con Mercado Pago y el dinero llega a su cuenta, menos la comisión de Nexo Fit. Cuando se acredite les pasamos los datos para coordinar la entrega y la factura.</p>'
              else '<p style="line-height:1.5"><b>Para cobrar, conecten su cuenta de Mercado Pago</b> desde su link privado (lleva un minuto). El comprador paga ahí y el dinero llega a su cuenta, menos la comisión de Nexo Fit. Cuando se acredite les pasamos los datos para la entrega y la factura.</p>' end
       ||'<p style="line-height:1.5">Mantengan el precio, el stock y las condiciones de la oferta.</p>',
       case when mp then 'Ver mi oferta' else 'Conectar Mercado Pago' end,olink));
    else
     perform public.fitness_aviso_mail('oferta_no_elegida',new.code,x.email,
      'El comprador eligió otra oferta · '||new.code,
      'Hola, equipo de '||x.nombre||'. Para el pedido '||new.code||' ('||new.localidad||', '||new.provincia||') el comprador eligió otra oferta. Gracias por ofertar: les vamos a seguir enviando los pedidos de su rubro.',
      public.fitness_aviso_email_html('El comprador eligió otra oferta',
       '<p style="line-height:1.5">Hola, equipo de '||public.fitness_html(x.nombre)||'. Para el pedido <b>'||new.code||'</b> ('||public.fitness_html(new.localidad||', '||new.provincia)||') el comprador eligió otra oferta.</p>'
       ||'<p style="line-height:1.5">Gracias por ofertar: les vamos a seguir enviando los pedidos de su rubro.</p>',
       'Ver mi oferta',olink));
    end if;
   end loop;
  elsif tg_op='UPDATE' and new.status in ('cerrada','descartada') and old.status in ('nueva','enviada','con_ofertas') and new.oferta_elegida is null then
   for x in select r.nombre, r.email from public.fitness_ofertas_solicitud oo
    join public.fitness_invitaciones i on i.id=oo.invitacion_id join public.fitness_red_proveedores r on r.id=i.proveedor_id
    where i.solicitud_code=new.code loop
    perform public.fitness_aviso_mail('pedido_cerrado_proveedor',new.code,x.email,
     'Pedido cerrado sin elegir oferta · '||new.code,
     'Hola, equipo de '||x.nombre||'. El pedido '||new.code||' ('||new.localidad||', '||new.provincia||') se cerró sin que el comprador eligiera una oferta. Gracias por ofertar: les vamos a seguir enviando los pedidos de su rubro.',
     public.fitness_aviso_email_html('Pedido cerrado sin elegir oferta',
      '<p style="line-height:1.5">Hola, equipo de '||public.fitness_html(x.nombre)||'. El pedido <b>'||new.code||'</b> ('||public.fitness_html(new.localidad||', '||new.provincia)||') se cerró sin que el comprador eligiera una oferta.</p>'
      ||'<p style="line-height:1.5">Gracias por ofertar: les vamos a seguir enviando los pedidos de su rubro.</p>',
      'Ir a Nexo Fit',site));
   end loop;
  end if;
 exception when others then
  raise warning 'Aviso no encolado (%): %', new.code, sqlerrm;
 end;
 return new;
end $$;

-- El comprador ve el estado del pago y si ya puede pagar; el proveedor, si conectó Mercado Pago.
create or replace function public.fitness_solicitud_consulta(p_code text, p_email text) returns jsonb
language plpgsql stable security definer set search_path='' set timezone='America/Argentina/Buenos_Aires' as $$
declare s public.fitness_solicitudes; v_estado text; pid bigint;
begin
 select * into s from public.fitness_solicitudes x where x.code=upper(btrim(coalesce(p_code,''))) and x.email=lower(btrim(coalesce(p_email,'')));
 if not found then raise exception 'No encontramos una solicitud con ese número y ese email'; end if;
 v_estado := public.fitness_sol_estado(s.status,s.updated_at);
 select i.proveedor_id into pid from public.fitness_ofertas_solicitud o join public.fitness_invitaciones i on i.id=o.invitacion_id where o.id=s.oferta_elegida;
 return jsonb_build_object('code',s.code,'status',v_estado,'createdAt',s.created_at,'updatedAt',s.updated_at,
  'productos',jsonb_array_length(s.items),'items',s.items,'localidad',s.localidad,'plazo',s.plazo,'prioridad',s.prioridad,
  'proveedores',s.proveedores_consultados,'nota',s.nota_publica,
  'pago',jsonb_build_object('estado',s.pago_estado,'monto',s.pago_monto,'fecha',s.pago_at,
    'disponible', s.status='elegida' and coalesce(s.pago_estado,'') not in ('aprobado','devuelto') and pid is not null and public.fitness_mp_red_conectado(pid)),
  'ofertas',(select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'letra',chr(64+o.n::int),'precio',o.precio_total,'envio',o.envio,
     'total',o.precio_total+o.envio,'plazo',o.plazo_dias,'cuotas',o.cuotas,'garantia',o.garantia_meses,'validaHasta',o.valida_hasta,
     'vencida',o.valida_hasta<current_date,'cumple',o.cumple,'notas',o.notas,'elegida',coalesce(o.id=s.oferta_elegida,false),
     'proveedor',case when o.id=s.oferta_elegida then o.nombre end) order by o.n),'[]')
   from (select oo.*, r.nombre, row_number() over (order by oo.created_at, oo.id) as n
     from public.fitness_ofertas_solicitud oo join public.fitness_invitaciones i on i.id=oo.invitacion_id
     join public.fitness_red_proveedores r on r.id=i.proveedor_id where i.solicitud_code=s.code) o));
end $$;

create or replace function public.fitness_invitacion_ver(p_token text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare i public.fitness_invitaciones; s public.fitness_solicitudes; r public.fitness_red_proveedores; eleg boolean;
begin
 if coalesce(p_token,'') !~ '^[0-9a-f]{64}$' then raise exception 'El link no es válido'; end if;
 select * into i from public.fitness_invitaciones where token=p_token;
 if not found then raise exception 'El link no es válido o fue reemplazado'; end if;
 select * into s from public.fitness_solicitudes where code=i.solicitud_code;
 select * into r from public.fitness_red_proveedores where id=i.proveedor_id;
 if i.visto_at is null then update public.fitness_invitaciones set visto_at=now() where id=i.id; end if;
 eleg := s.oferta_elegida is not null and s.oferta_elegida=(select o.id from public.fitness_ofertas_solicitud o where o.invitacion_id=i.id);
 -- Sin nombre, email, teléfono, empresa ni presupuesto del comprador (esos datos le llegan por email cuando paga).
 return jsonb_build_object('code',s.code,'proveedor',r.nombre,'estado',public.fitness_sol_estado(s.status,s.updated_at),
  'abierta', public.fitness_sol_estado(s.status,s.updated_at) in ('nueva','enviada','con_ofertas'),
  'tipo',s.tipo,'items',s.items,'detalles',s.detalles,'localidad',s.localidad,'provincia',s.provincia,'plazo',s.plazo,
  'factura',s.factura,'pagos',s.pagos,'prioridad',s.prioridad,'creada',s.created_at,
  'elegida', eleg, 'mp', public.fitness_mp_red_conectado(r.id),
  'pago', case when eleg then s.pago_estado end,
  'comision',public.fitness_red_comision_pct(r.id),
  'oferta',(select to_jsonb(o) - 'invitacion_id' - 'aviso_vence_at' from public.fitness_ofertas_solicitud o where o.invitacion_id=i.id));
end $$;

revoke all on function public.fitness_mp_red_conectado(bigint), public.fitness_red_comision_pct(bigint), public.fitness_red_por_token(text),
 public.fitness_mp_red_account(bigint), public.fitness_mp_red_link(bigint,text,text,timestamptz), public.fitness_mp_red_unlink(bigint),
 public.fitness_sol_pago_datos(text,text), public.fitness_sol_registrar_pago(text,bigint,jsonb), public.fitness_aviso_tr_pago(),
 public.fitness_aviso_tr_solicitud() from public, anon, authenticated;
grant execute on function public.fitness_red_por_token(text), public.fitness_mp_red_account(bigint), public.fitness_mp_red_link(bigint,text,text,timestamptz),
 public.fitness_mp_red_unlink(bigint), public.fitness_sol_pago_datos(text,text), public.fitness_sol_registrar_pago(text,bigint,jsonb) to service_role;
commit;

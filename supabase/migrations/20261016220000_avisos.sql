begin;
-- Avisos de "Pedí ofertas" por email (Resend) y WhatsApp (CallMeBot), enviados desde la base cada minuto.
-- Las llaves las pega el administrador en el panel y se guardan cifradas en Supabase Vault.
-- Los avisos se encolan con triggers que nunca frenan una solicitud ni una oferta, aunque fallen.

create table if not exists public.fitness_avisos_config(
 id boolean primary key default true check (id),
 admin_email text check (length(admin_email)<=160),
 admin_whatsapp text check (length(admin_whatsapp)<=20),
 email_from text not null default 'Nexo Fit <onboarding@resend.dev>' check (length(email_from)<=160),
 comprador_email boolean not null default true,
 site_url text not null default 'https://nexofitt.com.ar',
 updated_at timestamptz not null default now()
);
insert into public.fitness_avisos_config(id) values(true) on conflict do nothing;

create table if not exists public.fitness_avisos(
 id bigserial primary key,
 tipo text not null,
 canal text not null check (canal in ('email','whatsapp')),
 destino text not null,
 asunto text,
 texto text not null,
 html text,
 solicitud_code text,
 estado text not null default 'pendiente' check (estado in ('pendiente','enviado','error')),
 intentos int not null default 0,
 error text,
 created_at timestamptz not null default now(),
 sent_at timestamptz
);
create index if not exists fitness_avisos_pend_idx on public.fitness_avisos(estado, created_at);

alter table public.fitness_avisos_config enable row level security;
alter table public.fitness_avisos enable row level security;
revoke all on table public.fitness_avisos_config, public.fitness_avisos from public,anon,authenticated;
grant all on table public.fitness_avisos_config, public.fitness_avisos to service_role;

create or replace function public.fitness_aviso_secreto(p_name text) returns text
language sql stable security definer set search_path='' as $$
 select decrypted_secret from vault.decrypted_secrets where name=p_name limit 1
$$;

create or replace function public.fitness_pesos(n numeric) returns text
language sql immutable set search_path='' as $$
 select '$ '||translate(to_char(round(coalesce(n,0)),'FM999,999,999,999'),',','.')
$$;

create or replace function public.fitness_html(p text) returns text
language sql immutable set search_path='' as $$
 select replace(replace(replace(replace(replace(coalesce(p,''),'&','&amp;'),'<','&lt;'),'>','&gt;'),'"','&quot;'),'''','&#39;')
$$;

-- Plantilla de email: título, párrafos (ya escapados) y un botón.
create or replace function public.fitness_aviso_email_html(p_titulo text, p_cuerpo text, p_boton text, p_url text) returns text
language sql immutable set search_path='' as $$
 select '<div style="font-family:Arial,sans-serif;background:#FDFAF5;padding:24px;color:#10171F">'
  ||'<div style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #E4E1DA;border-radius:14px;padding:24px">'
  ||'<p style="margin:0 0 6px;font-size:12px;font-weight:bold;letter-spacing:2px;color:#5E7A0E">NEXO FIT</p>'
  ||'<h1 style="margin:0 0 14px;font-size:22px;line-height:1.25">'||public.fitness_html(p_titulo)||'</h1>'
  ||p_cuerpo
  ||case when p_url is not null then '<p style="margin:22px 0 6px"><a href="'||public.fitness_html(p_url)||'" style="background:#A5CC21;color:#10171F;padding:12px 18px;border-radius:8px;font-weight:bold;text-decoration:none;display:inline-block">'||public.fitness_html(p_boton)||'</a></p>' else '' end
  ||'<p style="margin:22px 0 0;font-size:12px;color:#6A727B">Nexo Fit · Compará, elegí, entrená · nexofitt.com.ar</p></div></div>'
$$;

-- Encola avisos para el administrador (email y WhatsApp) y, si corresponde, un email para el comprador.
create or replace function public.fitness_aviso_encolar(p_tipo text, p_code text, p_admin_asunto text, p_admin_texto text,
 p_comprador text, p_comp_asunto text, p_comp_texto text, p_comp_html text) returns void
language plpgsql security definer set search_path='' as $$
declare c public.fitness_avisos_config; has_mail boolean; has_wa boolean;
begin
 select * into c from public.fitness_avisos_config where id;
 has_mail := public.fitness_aviso_secreto('nexofit_resend_key') is not null;
 has_wa := public.fitness_aviso_secreto('nexofit_callmebot_key') is not null;
 if p_admin_texto is not null and has_mail and c.admin_email is not null then
  insert into public.fitness_avisos(tipo,canal,destino,asunto,texto,html,solicitud_code)
  values(p_tipo,'email',c.admin_email,p_admin_asunto,p_admin_texto,
   public.fitness_aviso_email_html(p_admin_asunto,'<p style="white-space:pre-line;line-height:1.5">'||public.fitness_html(p_admin_texto)||'</p>','Abrir el panel',c.site_url||'/admin.html'),p_code);
 end if;
 if p_admin_texto is not null and has_wa and c.admin_whatsapp is not null then
  insert into public.fitness_avisos(tipo,canal,destino,asunto,texto,solicitud_code)
  values(p_tipo,'whatsapp',c.admin_whatsapp,p_admin_asunto,'*'||p_admin_asunto||'*'||chr(10)||p_admin_texto,p_code);
 end if;
 -- Con el remitente de prueba de Resend solo se puede escribir al dueño de la cuenta: a compradores, recién con el dominio verificado.
 if p_comprador is not null and p_comp_texto is not null and has_mail and c.comprador_email and c.email_from not ilike '%@resend.dev%' then
  insert into public.fitness_avisos(tipo,canal,destino,asunto,texto,html,solicitud_code)
  values(p_tipo||'_comprador','email',p_comprador,p_comp_asunto,p_comp_texto,p_comp_html,p_code);
 end if;
end $$;

-- ---------- Triggers: nunca bloquean la operación principal ----------
create or replace function public.fitness_aviso_tr_solicitud() returns trigger
language plpgsql security definer set search_path='' as $$
declare site text; n int; link text; it jsonb; lista text := ''; prov text; tot numeric; ptel text;
begin
 begin
  select site_url into site from public.fitness_avisos_config where id;
  link := site||'/mi-solicitud.html?codigo='||new.code;
  if tg_op='INSERT' then
   n := jsonb_array_length(new.items);
   for it in select * from jsonb_array_elements(new.items) loop lista := lista||'• '||(it->>'cantidad')||' × '||(it->>'producto')||chr(10); end loop;
   perform public.fitness_aviso_encolar('solicitud_nueva',new.code,
    'Nueva solicitud '||new.code,
    n||(case when n=1 then ' producto' else ' productos' end)||' para '||new.tipo||' en '||new.localidad||', '||new.provincia||'.'||chr(10)||lista||'Invitá proveedores desde Solicitudes en el panel.',
    new.email,'Recibimos tu solicitud '||new.code,
    'Hola '||new.nombre||', recibimos tu pedido de ofertas '||new.code||'. Ya estamos eligiendo a qué proveedores consultar. Cuando lleguen las ofertas te avisamos y las vas a ver comparadas en '||link,
    public.fitness_aviso_email_html('Recibimos tu solicitud '||new.code,
     '<p style="line-height:1.5">Hola '||public.fitness_html(new.nombre)||', ya estamos eligiendo a qué proveedores consultar para tu pedido:</p><p style="white-space:pre-line;line-height:1.5">'||public.fitness_html(lista)||'</p>'
     ||'<p style="line-height:1.5">Cuando lleguen las ofertas te avisamos por este medio y las vas a ver comparadas, con nuestra recomendación. Pedir ofertas no te compromete a comprar.</p>'
     ||'<p style="line-height:1.5">Tu número de solicitud es <b>'||new.code||'</b>. Guardalo junto con este email para entrar a verla.</p>',
     'Seguir mi solicitud',link));
  elsif tg_op='UPDATE' and new.status='elegida' and old.status is distinct from 'elegida' then
   select r.nombre, o.precio_total+o.envio, r.whatsapp into prov, tot, ptel
   from public.fitness_ofertas_solicitud o join public.fitness_invitaciones i on i.id=o.invitacion_id join public.fitness_red_proveedores r on r.id=i.proveedor_id
   where o.id=new.oferta_elegida;
   perform public.fitness_aviso_encolar('oferta_elegida',new.code,
    'Eligieron una oferta: '||new.code,
    new.nombre||' eligió la oferta de '||coalesce(prov,'un proveedor')||' por '||public.fitness_pesos(tot)||'.'||chr(10)
     ||'Comprador: '||new.nombre||' · '||new.telefono||' · '||new.email||chr(10)||'Proveedor: '||coalesce(prov,'')||coalesce(' · WhatsApp '||ptel,'')||chr(10)
     ||'Coordiná pago y entrega y después marcala como Cerrada.',
    new.email,'Elegiste tu oferta · '||new.code,
    'Elegiste la oferta de '||coalesce(prov,'un proveedor')||' por '||public.fitness_pesos(tot)||'. Te vamos a contactar para coordinar el pago y la entrega.',
    public.fitness_aviso_email_html('Elegiste tu oferta',
     '<p style="line-height:1.5">Elegiste la oferta de <b>'||public.fitness_html(coalesce(prov,'un proveedor'))||'</b> por <b>'||public.fitness_pesos(tot)||'</b> para tu solicitud '||new.code||'.</p>'
     ||'<p style="line-height:1.5">Te vamos a contactar para coordinar el pago y la entrega. Todavía no se te cobró nada.</p>',
     'Ver mi solicitud',link));
  end if;
 exception when others then
  raise warning 'Aviso no encolado (%): %', new.code, sqlerrm;
 end;
 return new;
end $$;

create or replace function public.fitness_aviso_tr_oferta() returns trigger
language plpgsql security definer set search_path='' as $$
declare s public.fitness_solicitudes; prov text; site text; n int; link text;
begin
 begin
  select x.* into s from public.fitness_solicitudes x join public.fitness_invitaciones i on i.solicitud_code=x.code where i.id=new.invitacion_id;
  select r.nombre into prov from public.fitness_invitaciones i join public.fitness_red_proveedores r on r.id=i.proveedor_id where i.id=new.invitacion_id;
  select site_url into site from public.fitness_avisos_config where id;
  select count(*) into n from public.fitness_ofertas_solicitud o join public.fitness_invitaciones i on i.id=o.invitacion_id where i.solicitud_code=s.code;
  link := site||'/mi-solicitud.html?codigo='||s.code;
  perform public.fitness_aviso_encolar(case when tg_op='INSERT' then 'oferta_nueva' else 'oferta_corregida' end, s.code,
   case when tg_op='INSERT' then 'Nueva oferta para '||s.code else 'Oferta corregida en '||s.code end,
   prov||': '||public.fitness_pesos(new.precio_total+new.envio)||' · '||new.plazo_dias||' días hábiles'
    ||case when new.cuotas>0 then ' · '||new.cuotas||' cuotas' else '' end||case when new.cumple='parcial' then ' · PARCIAL' else '' end
    ||chr(10)||'Ofertas recibidas: '||n||'.',
   -- Al comprador solo se le avisa con la primera oferta, para no llenarle la casilla.
   case when tg_op='INSERT' and n=1 then s.email end,
   'Ya tenés ofertas para tu solicitud '||s.code,
   'Llegó la primera oferta para tu solicitud '||s.code||'. Entrá a verla comparada en '||link||'. Si llegan más, aparecen en la misma página.',
   public.fitness_aviso_email_html('Ya tenés ofertas para tu solicitud',
    '<p style="line-height:1.5">Llegó la primera oferta para tu solicitud <b>'||s.code||'</b>. Entrá a verla: si llegan más, aparecen en la misma página, comparadas y con nuestra recomendación.</p>'
    ||'<p style="line-height:1.5">Vas a necesitar tu número de solicitud y este email.</p>',
    'Ver las ofertas',link));
 exception when others then
  raise warning 'Aviso de oferta no encolado: %', sqlerrm;
 end;
 return new;
end $$;

create or replace trigger fitness_aviso_solicitud after insert or update of status on public.fitness_solicitudes
 for each row execute function public.fitness_aviso_tr_solicitud();
create or replace trigger fitness_aviso_oferta after insert or update of precio_total,envio,plazo_dias,cuotas,garantia_meses,cumple on public.fitness_ofertas_solicitud
 for each row execute function public.fitness_aviso_tr_oferta();

-- ---------- Envío ----------
create or replace function public.fitness_aviso_enviar(p_id bigint) returns text
language plpgsql security definer set search_path='' as $$
declare a public.fitness_avisos; c public.fitness_avisos_config; k text; r extensions.http_response; d jsonb; err text;
begin
 select * into a from public.fitness_avisos where id=p_id for update;
 if not found or a.estado='enviado' then return 'ok'; end if;
 select * into c from public.fitness_avisos_config where id;
 perform extensions.http_set_curlopt('CURLOPT_TIMEOUT','20');
 begin
  if a.canal='email' then
   k := public.fitness_aviso_secreto('nexofit_resend_key');
   if k is null then raise exception 'Falta la llave de Resend'; end if;
   r := extensions.http(('POST','https://api.resend.com/emails',
     array[extensions.http_header('Authorization','Bearer '||k)],'application/json',
     jsonb_build_object('from',c.email_from,'to',jsonb_build_array(a.destino),'subject',a.asunto,'text',a.texto,'html',a.html)::text)::extensions.http_request);
   begin d := r.content::jsonb; exception when others then d := null; end;
   if r.status >= 400 then raise exception 'Resend: %', coalesce(d->>'message', 'error '||r.status); end if;
  else
   k := public.fitness_aviso_secreto('nexofit_callmebot_key');
   if k is null then raise exception 'Falta la llave de CallMeBot'; end if;
   r := extensions.http_get('https://api.callmebot.com/whatsapp.php?phone='||extensions.urlencode('+'||a.destino)
     ||'&text='||extensions.urlencode(left(a.texto,1500))||'&apikey='||extensions.urlencode(k));
   if r.status >= 400 or r.content ilike '%apikey is invalid%' or r.content ilike '%error%' then
    raise exception 'CallMeBot: %', left(regexp_replace(coalesce(r.content,'error '||r.status),'<[^>]*>','','g'),200);
   end if;
  end if;
  update public.fitness_avisos set estado='enviado', sent_at=now(), intentos=intentos+1, error=null where id=a.id;
  return 'ok';
 exception when others then
  err := left(sqlerrm,300);
  update public.fitness_avisos set intentos=intentos+1, error=err, estado=case when intentos+1>=5 then 'error' else 'pendiente' end where id=a.id;
  return err;
 end;
end $$;

-- Corre cada minuto. Guarda después de cada aviso, así una falla no repite los que ya salieron.
create or replace procedure public.fitness_avisos_run() language plpgsql as $$
declare v_id bigint;
begin
 if not pg_try_advisory_lock(271828182) then return; end if;
 for v_id in select id from public.fitness_avisos where estado='pendiente' and created_at > now()-interval '2 days' order by id limit 20 loop
  perform public.fitness_aviso_enviar(v_id);
  commit;
 end loop;
 perform pg_advisory_unlock(271828182);
end $$;

-- ---------- Panel del administrador ----------
create or replace function public.fitness_avisos_admin() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare c public.fitness_avisos_config;
begin
 if not public.fitness_es_admin() then raise exception 'No autorizado'; end if;
 select * into c from public.fitness_avisos_config where id;
 return jsonb_build_object('admin_email',c.admin_email,'admin_whatsapp',c.admin_whatsapp,'email_from',c.email_from,'comprador_email',c.comprador_email,
  'resend',public.fitness_aviso_secreto('nexofit_resend_key') is not null,'callmebot',public.fitness_aviso_secreto('nexofit_callmebot_key') is not null,
  'avisos',(select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'tipo',a.tipo,'canal',a.canal,'destino',a.destino,'asunto',a.asunto,'estado',a.estado,
    'error',a.error,'intentos',a.intentos,'creado',a.created_at,'enviado',a.sent_at) order by a.id desc),'[]')
   from (select * from public.fitness_avisos order by id desc limit 30) a));
end $$;

create or replace function public.fitness_avisos_guardar(p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_mail text := nullif(lower(btrim(coalesce(p->>'admin_email',''))),'');
 v_wa text := nullif(regexp_replace(coalesce(p->>'admin_whatsapp',''),'[^0-9]','','g'),'');
 v_from text := nullif(btrim(coalesce(p->>'email_from','')),'');
 v_rk text := btrim(coalesce(p->>'resend_key','')); v_ck text := btrim(coalesce(p->>'callmebot_key','')); sid uuid;
begin
 if not public.fitness_es_admin() then raise exception 'No autorizado'; end if;
 if v_mail is not null and v_mail !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Revisá el email para avisos'; end if;
 if v_wa is not null and length(v_wa) not between 10 and 15 then raise exception 'Escribí el WhatsApp con código de país y área, por ejemplo 5491112345678'; end if;
 if v_from is not null and v_from !~ '<[^@\s>]+@[^@\s>]+\.[^@\s>]+>$' and v_from !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'El remitente tiene que ser un email, por ejemplo: Nexo Fit <avisos@nexofitt.com.ar>'; end if;
 if v_rk <> '' then
  if v_rk !~ '^re_[A-Za-z0-9_]{10,}$' then raise exception 'La llave de Resend empieza con re_. Copiala completa.'; end if;
  select id into sid from vault.secrets where name='nexofit_resend_key';
  if sid is null then perform vault.create_secret(v_rk,'nexofit_resend_key','Llave de Resend para avisos de Nexo Fit'); else perform vault.update_secret(sid,v_rk); end if;
 end if;
 if v_ck <> '' then
  if v_ck !~ '^[A-Za-z0-9]{4,40}$' then raise exception 'La llave de CallMeBot son solo letras y números. Copiala tal cual te llegó.'; end if;
  select id into sid from vault.secrets where name='nexofit_callmebot_key';
  if sid is null then perform vault.create_secret(v_ck,'nexofit_callmebot_key','Llave de CallMeBot para avisos de Nexo Fit'); else perform vault.update_secret(sid,v_ck); end if;
 end if;
 update public.fitness_avisos_config set admin_email=v_mail, admin_whatsapp=v_wa, email_from=coalesce(v_from,email_from),
  comprador_email=coalesce((p->>'comprador_email')::boolean,comprador_email), updated_at=now() where id;
 return public.fitness_avisos_admin();
end $$;

-- Manda un aviso de prueba por cada canal configurado y devuelve el resultado al instante.
create or replace function public.fitness_avisos_probar() returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_id bigint; res jsonb := '[]';
begin
 if not public.fitness_es_admin() then raise exception 'No autorizado'; end if;
 perform public.fitness_aviso_encolar('prueba',null,'Prueba de avisos de Nexo Fit','Si te llegó este mensaje, los avisos funcionan. Vas a recibir uno igual con cada solicitud nueva, cada oferta y cada elección.',null,null,null,null);
 for v_id in select id from public.fitness_avisos where tipo='prueba' and estado='pendiente' and created_at > now()-interval '1 minute' order by id loop
  res := res || jsonb_build_object('id',v_id,'resultado',public.fitness_aviso_enviar(v_id));
 end loop;
 if jsonb_array_length(res)=0 then raise exception 'Primero cargá el email o el WhatsApp de avisos y su llave.'; end if;
 return jsonb_build_object('pruebas',res,'panel',public.fitness_avisos_admin());
end $$;

create or replace function public.fitness_aviso_reintentar(p_id bigint) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not public.fitness_es_admin() then raise exception 'No autorizado'; end if;
 update public.fitness_avisos set estado='pendiente', intentos=0, created_at=now() where id=p_id and estado<>'enviado';
 return jsonb_build_object('resultado',public.fitness_aviso_enviar(p_id));
end $$;

revoke all on function public.fitness_aviso_secreto(text), public.fitness_aviso_encolar(text,text,text,text,text,text,text,text),
 public.fitness_aviso_tr_solicitud(), public.fitness_aviso_tr_oferta(), public.fitness_aviso_enviar(bigint),
 public.fitness_html(text), public.fitness_pesos(numeric), public.fitness_aviso_email_html(text,text,text,text) from public,anon,authenticated;
revoke all on procedure public.fitness_avisos_run() from public,anon,authenticated;
revoke all on function public.fitness_avisos_admin(), public.fitness_avisos_guardar(jsonb), public.fitness_avisos_probar(), public.fitness_aviso_reintentar(bigint) from public,anon;
grant execute on function public.fitness_avisos_admin(), public.fitness_avisos_guardar(jsonb), public.fitness_avisos_probar(), public.fitness_aviso_reintentar(bigint) to authenticated;

select cron.schedule('nexofit-avisos','* * * * *','call public.fitness_avisos_run()');
commit;

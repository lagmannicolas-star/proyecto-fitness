-- 1) Cada oferta vale 24 horas desde que el proveedor la envía (o la renueva). Ya no elige una fecha.
--    Una vez que el comprador la elige, queda firme: el vencimiento ya no frena el pago.
-- 2) Fotos en las ofertas: hasta 5 por oferta, guardadas en R2 por el Worker. El comprador las ve al comparar.
-- 3) Pedidos de prueba: una solicitud marcada como prueba solo llega a los proveedores de prueba,
--    y los proveedores de prueba nunca reciben pedidos reales ni cuentan en la red pública.
begin;

-- ---------- 24 horas ----------
alter table public.fitness_ofertas_solicitud add column if not exists vence_at timestamptz;
update public.fitness_ofertas_solicitud
 set vence_at = least(now()+interval '24 hours', ((valida_hasta+1)::timestamp at time zone 'America/Argentina/Buenos_Aires'))
 where vence_at is null;
alter table public.fitness_ofertas_solicitud alter column vence_at set default now()+interval '24 hours';
alter table public.fitness_ofertas_solicitud alter column vence_at set not null;

-- ---------- Fotos ----------
create table if not exists public.fitness_ofertas_fotos(
 id bigserial primary key,
 invitacion_id bigint not null references public.fitness_invitaciones(id) on delete cascade,
 path text not null unique check (path ~ '^ofertas/[A-Za-z0-9_/.-]+$' and position('..' in path)=0),
 created_at timestamptz not null default now()
);
create index if not exists fitness_ofertas_fotos_inv_idx on public.fitness_ofertas_fotos(invitacion_id);
alter table public.fitness_ofertas_fotos enable row level security;
revoke all on table public.fitness_ofertas_fotos from public,anon,authenticated;
grant select,insert,update,delete on table public.fitness_ofertas_fotos to service_role;

create or replace function public.fitness_oferta_fotos(p_invitacion bigint) returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(f.path order by f.id),'[]'::jsonb) from public.fitness_ofertas_fotos f where f.invitacion_id=p_invitacion
$$;

-- El Worker pregunta si el link puede sumar una foto (y en qué carpeta) antes de guardarla en R2.
create or replace function public.fitness_oferta_foto_lugar(p_token text) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare i public.fitness_invitaciones; s public.fitness_solicitudes; n int;
begin
 if coalesce(p_token,'') !~ '^[0-9a-f]{64}$' then raise exception 'El link no es válido'; end if;
 select * into i from public.fitness_invitaciones where token=p_token;
 if not found then raise exception 'El link no es válido o fue reemplazado'; end if;
 select * into s from public.fitness_solicitudes where code=i.solicitud_code;
 if public.fitness_sol_estado(s.status,s.updated_at) not in ('nueva','enviada','con_ofertas') then raise exception 'Esta solicitud ya no recibe ofertas'; end if;
 select count(*) into n from public.fitness_ofertas_fotos where invitacion_id=i.id;
 if n >= 5 then raise exception 'Ya cargaste 5 fotos. Borrá una para subir otra'; end if;
 return jsonb_build_object('invitacion',i.id,'fotos',n);
end $$;

create or replace function public.fitness_oferta_foto_agregar(p_token text, p_path text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare i public.fitness_invitaciones; n int;
begin
 select * into i from public.fitness_invitaciones where token=p_token and p_token ~ '^[0-9a-f]{64}$' for update;
 if not found then raise exception 'El link no es válido'; end if;
 if p_path !~ ('^ofertas/i'||i.id||'/[A-Za-z0-9_-]+\.(jpg|png|webp)$') then raise exception 'Foto inválida'; end if;
 select count(*) into n from public.fitness_ofertas_fotos where invitacion_id=i.id;
 if n >= 5 then raise exception 'Ya cargaste 5 fotos. Borrá una para subir otra'; end if;
 insert into public.fitness_ofertas_fotos(invitacion_id,path) values(i.id,p_path);
 return jsonb_build_object('ok',true,'fotos',public.fitness_oferta_fotos(i.id));
end $$;

create or replace function public.fitness_oferta_foto_quitar(p_token text, p_path text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare i public.fitness_invitaciones; s public.fitness_solicitudes;
begin
 select * into i from public.fitness_invitaciones where token=p_token and p_token ~ '^[0-9a-f]{64}$';
 if not found then raise exception 'El link no es válido'; end if;
 select * into s from public.fitness_solicitudes where code=i.solicitud_code;
 if public.fitness_sol_estado(s.status,s.updated_at) not in ('nueva','enviada','con_ofertas') then raise exception 'Esta solicitud ya no recibe cambios'; end if;
 delete from public.fitness_ofertas_fotos where invitacion_id=i.id and path=p_path;
 if not found then raise exception 'Esa foto no existe'; end if;
 return jsonb_build_object('ok',true,'fotos',public.fitness_oferta_fotos(i.id));
end $$;

-- ---------- Proveedor: enviar, renovar y ver ----------
create or replace function public.fitness_oferta_enviar(p_token text, p jsonb) returns jsonb
language plpgsql security definer set search_path='' set timezone='America/Argentina/Buenos_Aires' as $$
declare i public.fitness_invitaciones; s public.fitness_solicitudes; n int; v_vence timestamptz := now()+interval '24 hours';
begin
 if coalesce(p_token,'') !~ '^[0-9a-f]{64}$' then raise exception 'El link no es válido'; end if;
 select * into i from public.fitness_invitaciones where token=p_token;
 if not found then raise exception 'El link no es válido o fue reemplazado'; end if;
 select * into s from public.fitness_solicitudes where code=i.solicitud_code for update;
 if public.fitness_sol_estado(s.status,s.updated_at) not in ('nueva','enviada','con_ofertas') then raise exception 'Esta solicitud ya no recibe ofertas'; end if;
 if coalesce(p->>'precio_total','') !~ '^[0-9]{1,11}(\.[0-9]{1,2})?$' or (p->>'precio_total')::numeric<=0 then raise exception 'Escribí el precio total'; end if;
 if coalesce(p->>'envio','0') !~ '^[0-9]{1,11}(\.[0-9]{1,2})?$' then raise exception 'Revisá el costo de envío'; end if;
 if coalesce(p->>'plazo_dias','') !~ '^[0-9]{1,3}$' or (p->>'plazo_dias')::int not between 1 and 180 then raise exception 'Indicá el plazo de entrega en días hábiles (1 a 180)'; end if;
 if coalesce(p->>'cuotas','0') !~ '^[0-9]{1,2}$' or (p->>'cuotas')::int>24 then raise exception 'Revisá las cuotas (0 a 24)'; end if;
 if coalesce(p->>'garantia_meses','0') !~ '^[0-9]{1,3}$' or (p->>'garantia_meses')::int>120 then raise exception 'Revisá la garantía (0 a 120 meses)'; end if;
 if coalesce(p->>'cumple','total') not in ('total','parcial') then raise exception 'Indicá si cumple todo el pedido'; end if;
 if length(coalesce(p->>'notas',''))>600 then raise exception 'Las notas son demasiado largas'; end if;
 if coalesce(p->>'cumple','total')='parcial' and length(btrim(coalesce(p->>'notas','')))<5 then raise exception 'Contá en las notas qué parte del pedido no cubrís'; end if;
 insert into public.fitness_ofertas_solicitud(invitacion_id,precio_total,envio,plazo_dias,cuotas,garantia_meses,valida_hasta,vence_at,cumple,notas)
 values(i.id,(p->>'precio_total')::numeric,coalesce(nullif(p->>'envio',''),'0')::numeric,(p->>'plazo_dias')::int,coalesce(nullif(p->>'cuotas',''),'0')::int,
  coalesce(nullif(p->>'garantia_meses',''),'0')::int,v_vence::date,v_vence,coalesce(p->>'cumple','total'),nullif(btrim(coalesce(p->>'notas','')),''))
 on conflict (invitacion_id) do update set precio_total=excluded.precio_total,envio=excluded.envio,plazo_dias=excluded.plazo_dias,cuotas=excluded.cuotas,
  garantia_meses=excluded.garantia_meses,valida_hasta=excluded.valida_hasta,vence_at=excluded.vence_at,aviso_vence_at=null,
  cumple=excluded.cumple,notas=excluded.notas,updated_at=now();
 select count(*) into n from public.fitness_ofertas_solicitud o join public.fitness_invitaciones x on x.id=o.invitacion_id where x.solicitud_code=s.code;
 update public.fitness_solicitudes set status='con_ofertas', ofertas_recibidas=least(99,n), updated_at=now() where code=s.code;
 return jsonb_build_object('ok',true,'ofertas',n,'vence',v_vence);
end $$;

-- Renueva la misma oferta por 24 horas más, sin cambiar condiciones (no genera avisos de "oferta corregida").
create or replace function public.fitness_oferta_renovar(p_token text) returns jsonb
language plpgsql security definer set search_path='' set timezone='America/Argentina/Buenos_Aires' as $$
declare i public.fitness_invitaciones; s public.fitness_solicitudes; v_vence timestamptz := now()+interval '24 hours';
begin
 if coalesce(p_token,'') !~ '^[0-9a-f]{64}$' then raise exception 'El link no es válido'; end if;
 select * into i from public.fitness_invitaciones where token=p_token;
 if not found then raise exception 'El link no es válido o fue reemplazado'; end if;
 select * into s from public.fitness_solicitudes where code=i.solicitud_code for update;
 if public.fitness_sol_estado(s.status,s.updated_at) not in ('nueva','enviada','con_ofertas') then raise exception 'Esta solicitud ya no recibe ofertas'; end if;
 update public.fitness_ofertas_solicitud set vence_at=v_vence, valida_hasta=v_vence::date, aviso_vence_at=null, updated_at=now() where invitacion_id=i.id;
 if not found then raise exception 'Todavía no enviaste una oferta para este pedido'; end if;
 update public.fitness_solicitudes set updated_at=now() where code=s.code;
 return jsonb_build_object('ok',true,'vence',v_vence);
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
  'prueba', s.es_prueba,
  'fotos', public.fitness_oferta_fotos(i.id),
  'oferta',(select to_jsonb(o) - 'invitacion_id' - 'aviso_vence_at' || jsonb_build_object('vencida', o.vence_at < now())
    from public.fitness_ofertas_solicitud o where o.invitacion_id=i.id));
end $$;

-- ---------- Comprador ----------
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
  'proveedores',s.proveedores_consultados,'nota',s.nota_publica,'prueba',s.es_prueba,
  'pago',jsonb_build_object('estado',s.pago_estado,'monto',s.pago_monto,'fecha',s.pago_at,
    'disponible', s.status='elegida' and coalesce(s.pago_estado,'') not in ('aprobado','devuelto') and pid is not null and public.fitness_mp_red_conectado(pid)),
  'ofertas',(select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'letra',chr(64+o.n::int),'precio',o.precio_total,'envio',o.envio,
     'total',o.precio_total+o.envio,'plazo',o.plazo_dias,'cuotas',o.cuotas,'garantia',o.garantia_meses,'validaHasta',o.vence_at,
     'vencida',o.vence_at<now() and o.id is distinct from s.oferta_elegida,'cumple',o.cumple,'notas',o.notas,'elegida',coalesce(o.id=s.oferta_elegida,false),
     'fotos',public.fitness_oferta_fotos(o.invitacion_id),
     'proveedor',case when o.id=s.oferta_elegida then o.nombre end) order by o.n),'[]')
   from (select oo.*, r.nombre, row_number() over (order by oo.created_at, oo.id) as n
     from public.fitness_ofertas_solicitud oo join public.fitness_invitaciones i on i.id=oo.invitacion_id
     join public.fitness_red_proveedores r on r.id=i.proveedor_id where i.solicitud_code=s.code) o));
end $$;

create or replace function public.fitness_oferta_elegir(p_code text, p_email text, p_oferta bigint) returns jsonb
language plpgsql security definer set search_path='' set timezone='America/Argentina/Buenos_Aires' as $$
declare s public.fitness_solicitudes; o public.fitness_ofertas_solicitud; v_nombre text;
begin
 select * into s from public.fitness_solicitudes x where x.code=upper(btrim(coalesce(p_code,''))) and x.email=lower(btrim(coalesce(p_email,''))) for update;
 if not found then raise exception 'No encontramos una solicitud con ese número y ese email'; end if;
 if public.fitness_sol_estado(s.status,s.updated_at) <> 'con_ofertas' then raise exception 'Esta solicitud ya no permite elegir una oferta'; end if;
 select oo.* into o from public.fitness_ofertas_solicitud oo join public.fitness_invitaciones i on i.id=oo.invitacion_id
  where oo.id=p_oferta and i.solicitud_code=s.code;
 if not found then raise exception 'La oferta no corresponde a esta solicitud'; end if;
 if o.vence_at < now() then raise exception 'Esa oferta venció (las ofertas valen 24 horas). Elegí otra o escribinos y le pedimos al proveedor que la renueve'; end if;
 select r.nombre into v_nombre from public.fitness_invitaciones i join public.fitness_red_proveedores r on r.id=i.proveedor_id where i.id=o.invitacion_id;
 update public.fitness_solicitudes set status='elegida', oferta_elegida=o.id, elegida_at=now(), updated_at=now() where code=s.code;
 return jsonb_build_object('ok',true,'proveedor',v_nombre,'total',o.precio_total+o.envio);
end $$;

-- Una oferta elegida a tiempo queda firme: el comprador puede pagarla aunque ya hayan pasado las 24 horas.
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
 pct := public.fitness_red_comision_pct(r.id);
 return jsonb_build_object('code',s.code,'email',s.email,'oferta_id',o.id,'proveedor_id',r.id,'proveedor',r.nombre,
  'precio',o.precio_total,'envio',o.envio,'total',o.precio_total+o.envio,'comision_pct',pct,
  'comision',round(o.precio_total*pct/100,2),'mp',public.fitness_mp_red_conectado(r.id));
end $$;

create or replace function public.fitness_oferta_resumen(o public.fitness_ofertas_solicitud) returns text
language sql stable set search_path='' set timezone='America/Argentina/Buenos_Aires' as $$
 select public.fitness_pesos(o.precio_total+o.envio)||' puesto en destino · '||o.plazo_dias||' días hábiles · '
  ||case when o.cuotas>0 then o.cuotas||' cuotas' else 'sin cuotas' end||' · garantía '||o.garantia_meses||' meses · válida 24 h (hasta el '
  ||to_char(o.vence_at,'DD/MM HH24:MI')||')'||case when o.cumple='parcial' then ' · cubre parte del pedido' else '' end
$$;

-- ---------- Pedidos de prueba ----------
alter table public.fitness_solicitudes add column if not exists es_prueba boolean not null default false;
alter table public.fitness_red_proveedores add column if not exists es_prueba boolean not null default false;

create or replace function public.fitness_invitar_toda_la_red(p_code text) returns integer
language plpgsql security definer set search_path='' as $$
declare n integer; v_prueba boolean;
begin
 select es_prueba into v_prueba from public.fitness_solicitudes where code=p_code;
 insert into public.fitness_invitaciones(solicitud_code,proveedor_id,token)
 select p_code, r.id, replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','')
 from public.fitness_red_proveedores r where r.activo and r.es_prueba = coalesce(v_prueba,false)
 on conflict (solicitud_code,proveedor_id) do nothing;
 get diagnostics n = row_count;
 update public.fitness_solicitudes set
  proveedores_consultados = least(99,(select count(*) from public.fitness_invitaciones i where i.solicitud_code=p_code)),
  updated_at = now()
 where code=p_code;
 return n;
end $$;

create or replace function public.fitness_red_activo_trg() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.activo and (tg_op='INSERT' or not coalesce(old.activo,false)) then
  begin
   insert into public.fitness_invitaciones(solicitud_code,proveedor_id,token)
   select s.code, new.id, replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','')
   from public.fitness_solicitudes s where s.status in ('nueva','enviada','con_ofertas') and s.es_prueba = new.es_prueba
   on conflict (solicitud_code,proveedor_id) do nothing;
   update public.fitness_solicitudes s set proveedores_consultados=least(99,(select count(*) from public.fitness_invitaciones i where i.solicitud_code=s.code))
   where s.status in ('nueva','enviada','con_ofertas');
  exception when others then raise warning 'red activo: %', sqlerrm;
  end;
 end if;
 return new;
end $$;

create or replace function public.fitness_red_resumen() returns json
language sql stable security definer set search_path to 'public' as $$
  select json_build_object(
    'proveedores', (select count(*) from public.fitness_red_proveedores where activo and not es_prueba),
    'rubros', (select count(distinct r) from public.fitness_red_proveedores p, unnest(p.rubros) r where p.activo and not p.es_prueba)
  );
$$;

-- Admin: suma las fotos de cada oferta.
create or replace function public.fitness_solicitudes_admin() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.fitness_es_admin() then raise exception 'No autorizado'; end if;
 return (select coalesce(jsonb_agg(to_jsonb(s) || jsonb_build_object(
   'estado', public.fitness_sol_estado(s.status,s.updated_at),
   'invitaciones', coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'proveedorId',r.id,'proveedor',r.nombre,'whatsapp',r.whatsapp,'token',i.token,
      'creada',i.created_at,'visto',i.visto_at,'fotos',public.fitness_oferta_fotos(i.id),
      'oferta',(select to_jsonb(o) from public.fitness_ofertas_solicitud o where o.invitacion_id=i.id)) order by i.created_at)
     from public.fitness_invitaciones i join public.fitness_red_proveedores r on r.id=i.proveedor_id where i.solicitud_code=s.code),'[]'))
  order by s.created_at desc),'[]') from public.fitness_solicitudes s);
end $$;

create or replace function public.fitness_avisos_recordatorios() returns integer
language plpgsql security definer set search_path='' set timezone='America/Argentina/Buenos_Aires' as $$
declare c public.fitness_avisos_config; x record; n integer := 0; site text; lista text; it jsonb; link text;
begin
 select * into c from public.fitness_avisos_config where id;
 if public.fitness_aviso_secreto('nexofit_resend_key') is null or c.email_from ilike '%@resend.dev%' then return 0; end if;
 site := c.site_url;

 -- 1) Comprador: resumen de ofertas nuevas.
 if c.comprador_email then
  for x in
   select s.code, s.nombre, s.email, s.aviso_ofertas_n, (select count(*) from public.fitness_ofertas_solicitud o join public.fitness_invitaciones i on i.id=o.invitacion_id where i.solicitud_code=s.code) total
   from public.fitness_solicitudes s
   where s.status='con_ofertas' and public.fitness_sol_estado(s.status,s.updated_at)='con_ofertas'
     and coalesce(s.aviso_ofertas_at, s.created_at) < now()-interval '20 hours'
   for update of s skip locked
  loop
   continue when x.total <= x.aviso_ofertas_n;
   link := site||'/mi-solicitud.html?codigo='||x.code;
   perform public.fitness_aviso_mail('ofertas_nuevas_comprador',x.code,x.email,
    'Ya tenés '||x.total||' ofertas para tu solicitud '||x.code,
    'Hola '||x.nombre||', ya tenés '||x.total||' ofertas para tu solicitud '||x.code||'. Entrá a verlas comparadas, con nuestra recomendación, en '||link||'. Pedir ofertas no te compromete a comprar.',
    public.fitness_aviso_email_html('Ya tenés '||x.total||' ofertas',
     '<p style="line-height:1.5">Hola '||public.fitness_html(x.nombre)||', ya tenés <b>'||x.total||' ofertas</b> para tu solicitud <b>'||x.code||'</b>.</p>'
     ||'<p style="line-height:1.5">Entrá a verlas comparadas, con nuestra recomendación. Tené en cuenta que cada oferta vale 24 horas desde que el proveedor la envía. Pedir ofertas no te compromete a comprar.</p>',
     'Ver las ofertas',link));
   update public.fitness_solicitudes set aviso_ofertas_n=x.total, aviso_ofertas_at=now() where code=x.code;
   n := n+1;
  end loop;
 end if;

 -- 2) Proveedor: recordatorio único si no ofertó.
 for x in
  select i.id, i.token, r.nombre, r.email, s.code, s.items, s.localidad, s.provincia
  from public.fitness_invitaciones i
  join public.fitness_red_proveedores r on r.id=i.proveedor_id
  join public.fitness_solicitudes s on s.code=i.solicitud_code
  where i.avisado_at < now()-interval '36 hours' and i.recordado_at is null and r.activo
    and s.status in ('nueva','enviada','con_ofertas') and public.fitness_sol_estado(s.status,s.updated_at) in ('nueva','enviada','con_ofertas')
    and s.created_at > now()-interval '10 days'
    and not exists (select 1 from public.fitness_ofertas_solicitud o where o.invitacion_id=i.id)
  order by i.id limit 50 for update of i skip locked
 loop
  lista := '';
  for it in select * from jsonb_array_elements(coalesce(x.items,'[]'::jsonb)) loop
   lista := lista||'• '||coalesce(it->>'cantidad','')||' × '||coalesce(it->>'producto','')||chr(10);
  end loop;
  link := site||'/oferta.html#t='||x.token;
  perform public.fitness_aviso_mail('recordatorio_proveedor',x.code,x.email,
   'Sigue abierto: pedido de ofertas '||x.code||' · '||coalesce(x.localidad,'')||', '||coalesce(x.provincia,''),
   'Hola, equipo de '||x.nombre||'. El pedido '||x.code||' ('||coalesce(x.localidad,'')||', '||coalesce(x.provincia,'')||') sigue abierto y todavía no recibió su oferta:'||chr(10)||lista
    ||'Si les interesa, carguen su oferta desde su link privado: '||link||chr(10)||'Si no les interesa, no hace falta responder.',
   public.fitness_aviso_email_html('El pedido '||x.code||' sigue abierto',
    '<p style="line-height:1.5">Hola, equipo de '||public.fitness_html(x.nombre)||'. El pedido <b>'||x.code||'</b> ('||public.fitness_html(coalesce(x.localidad,'')||', '||coalesce(x.provincia,''))||') sigue abierto y todavía no recibió su oferta:</p>'
    ||'<p style="white-space:pre-line;line-height:1.5">'||public.fitness_html(lista)||'</p>'
    ||'<p style="line-height:1.5">Si les interesa, carguen su oferta desde su link privado. Si no, no hace falta responder.</p>',
    'Ver el pedido y ofertar',link));
  update public.fitness_invitaciones set recordado_at=now() where id=x.id;
  n := n+1;
 end loop;

 -- 3) Proveedor: a su oferta (válida 24 h) le quedan menos de 6 horas y el pedido sigue abierto.
 for x in
  select o.id, o.vence_at, i.token, r.nombre, r.email, s.code
  from public.fitness_ofertas_solicitud o
  join public.fitness_invitaciones i on i.id=o.invitacion_id
  join public.fitness_red_proveedores r on r.id=i.proveedor_id
  join public.fitness_solicitudes s on s.code=i.solicitud_code
  where o.aviso_vence_at is null and o.vence_at between now() and now()+interval '6 hours'
    and s.status in ('nueva','enviada','con_ofertas') and public.fitness_sol_estado(s.status,s.updated_at) in ('nueva','enviada','con_ofertas')
  order by o.id limit 50 for update of o skip locked
 loop
  link := site||'/oferta.html#t='||x.token;
  perform public.fitness_aviso_mail('oferta_por_vencer',x.code,x.email,
   'Su oferta para '||x.code||' vence hoy a las '||to_char(x.vence_at,'HH24:MI'),
   'Hola, equipo de '||x.nombre||'. Su oferta para el pedido '||x.code||' vence el '||to_char(x.vence_at,'DD/MM')||' a las '||to_char(x.vence_at,'HH24:MI')||' (las ofertas valen 24 horas) y el comprador todavía no eligió. Si quieren seguir participando, renuévenla por 24 horas más desde su link privado: '||link,
   public.fitness_aviso_email_html('Su oferta vence a las '||to_char(x.vence_at,'HH24:MI'),
    '<p style="line-height:1.5">Hola, equipo de '||public.fitness_html(x.nombre)||'. Su oferta para el pedido <b>'||x.code||'</b> vence el <b>'||to_char(x.vence_at,'DD/MM')||' a las '||to_char(x.vence_at,'HH24:MI')||'</b> y el comprador todavía no eligió.</p>'
    ||'<p style="line-height:1.5">Las ofertas valen 24 horas. Si quieren seguir participando, renuévenla con un clic (o ajústenla) desde su link privado. Una oferta vencida no se puede elegir.</p>',
    'Renovar mi oferta',link));
  update public.fitness_ofertas_solicitud set aviso_vence_at=now() where id=x.id;
  n := n+1;
 end loop;

 -- 4) Pedido vencido: al comprador y a los que ofertaron.
 for x in
  select s.code, s.nombre, s.email, s.localidad, s.provincia from public.fitness_solicitudes s
  where s.vencida_avisada_at is null and public.fitness_sol_estado(s.status,s.updated_at)='vencida'
    and s.updated_at > now()-interval '45 days'
  for update of s skip locked
 loop
  if c.comprador_email then
   perform public.fitness_aviso_mail('solicitud_vencida_comprador',x.code,x.email,
    'Tu solicitud '||x.code||' venció',
    'Hola '||x.nombre||', tu solicitud '||x.code||' pasó 30 días sin movimiento y venció. Si todavía necesitás el equipamiento, podés pedir ofertas de nuevo en '||site||'/solicitud.html',
    public.fitness_aviso_email_html('Tu solicitud '||x.code||' venció',
     '<p style="line-height:1.5">Hola '||public.fitness_html(x.nombre)||', tu solicitud <b>'||x.code||'</b> pasó 30 días sin movimiento y venció.</p>'
     ||'<p style="line-height:1.5">Si todavía necesitás el equipamiento, podés pedir ofertas de nuevo: lleva un par de minutos.</p>',
     'Pedir ofertas de nuevo',site||'/solicitud.html'));
  end if;
  perform public.fitness_aviso_mail('pedido_cerrado_proveedor',x.code,r.email,
    'Pedido cerrado sin elegir oferta · '||x.code,
    'Hola, equipo de '||r.nombre||'. El pedido '||x.code||' ('||x.localidad||', '||x.provincia||') venció sin que el comprador eligiera una oferta. Gracias por ofertar: les vamos a seguir enviando los pedidos de su rubro.',
    public.fitness_aviso_email_html('Pedido cerrado sin elegir oferta',
     '<p style="line-height:1.5">Hola, equipo de '||public.fitness_html(r.nombre)||'. El pedido <b>'||x.code||'</b> ('||public.fitness_html(x.localidad||', '||x.provincia)||') venció sin que el comprador eligiera una oferta.</p>'
     ||'<p style="line-height:1.5">Gracias por ofertar: les vamos a seguir enviando los pedidos de su rubro.</p>',
     'Ir a Nexo Fit',site))
  from public.fitness_ofertas_solicitud o join public.fitness_invitaciones i on i.id=o.invitacion_id join public.fitness_red_proveedores r on r.id=i.proveedor_id
  where i.solicitud_code=x.code;
  update public.fitness_solicitudes set vencida_avisada_at=now() where code=x.code;
  n := n+1;
 end loop;
 return n;
end $$;

revoke all on function public.fitness_oferta_fotos(bigint), public.fitness_oferta_foto_lugar(text), public.fitness_oferta_foto_agregar(text,text),
 public.fitness_oferta_foto_quitar(text,text), public.fitness_avisos_recordatorios() from public, anon, authenticated;
grant execute on function public.fitness_oferta_foto_lugar(text), public.fitness_oferta_foto_agregar(text,text), public.fitness_oferta_foto_quitar(text,text) to service_role;
revoke all on function public.fitness_oferta_renovar(text) from public;
grant execute on function public.fitness_oferta_renovar(text) to anon, authenticated;
commit;

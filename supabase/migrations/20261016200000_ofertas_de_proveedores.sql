begin;
-- Fase 2 de "Pedí ofertas": red de proveedores, invitaciones con link privado, ofertas estructuradas,
-- comparación para el comprador, elección de oferta y vencimientos.

-- La solicitud suma la etapa "elegida" (el comprador eligió una oferta y falta coordinar pago y entrega).
alter table public.fitness_solicitudes drop constraint if exists fitness_solicitudes_status_check;
alter table public.fitness_solicitudes add constraint fitness_solicitudes_status_check
 check (status in ('nueva','enviada','con_ofertas','elegida','cerrada','descartada'));
alter table public.fitness_solicitudes add column if not exists oferta_elegida bigint;
alter table public.fitness_solicitudes add column if not exists elegida_at timestamptz;

-- Red de proveedores que reciben pedidos (tengan o no catálogo cargado en el sitio).
create table if not exists public.fitness_red_proveedores(
 id bigserial primary key,
 nombre text not null check (length(nombre) between 2 and 120),
 contacto text check (length(contacto)<=120),
 whatsapp text check (length(whatsapp)<=30),
 email text check (length(email)<=160),
 rubros text[] not null default '{}',
 zonas text[] not null default '{todo}',
 activo boolean not null default true,
 notas text check (length(notas)<=500),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

-- Una invitación por proveedor y solicitud. El token es el acceso privado del proveedor a ese pedido.
create table if not exists public.fitness_invitaciones(
 id bigserial primary key,
 solicitud_code text not null references public.fitness_solicitudes(code) on delete cascade,
 proveedor_id bigint not null references public.fitness_red_proveedores(id),
 token text not null unique,
 created_at timestamptz not null default now(),
 visto_at timestamptz,
 unique(solicitud_code,proveedor_id)
);
create index if not exists fitness_invitaciones_sol_idx on public.fitness_invitaciones(solicitud_code);

-- Una oferta por invitación; el proveedor puede corregirla mientras la solicitud siga abierta.
create table if not exists public.fitness_ofertas_solicitud(
 id bigserial primary key,
 invitacion_id bigint not null unique references public.fitness_invitaciones(id) on delete cascade,
 precio_total numeric(14,2) not null check (precio_total>0),
 envio numeric(14,2) not null default 0 check (envio>=0),
 plazo_dias int not null check (plazo_dias between 1 and 180),
 cuotas int not null default 0 check (cuotas between 0 and 24),
 garantia_meses int not null default 0 check (garantia_meses between 0 and 120),
 valida_hasta date not null,
 cumple text not null default 'total' check (cumple in ('total','parcial')),
 notas text check (length(notas)<=600),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

alter table public.fitness_red_proveedores enable row level security;
alter table public.fitness_invitaciones enable row level security;
alter table public.fitness_ofertas_solicitud enable row level security;
revoke all on table public.fitness_red_proveedores, public.fitness_invitaciones, public.fitness_ofertas_solicitud from public,anon,authenticated;
grant all on table public.fitness_red_proveedores, public.fitness_invitaciones, public.fitness_ofertas_solicitud to service_role;

-- Una solicitud abierta sin movimiento por 30 días se considera vencida.
create or replace function public.fitness_sol_estado(p_status text, p_updated timestamptz) returns text
language sql stable set search_path='' as $$
 select case when p_status in ('nueva','enviada','con_ofertas') and p_updated < now()-interval '30 days' then 'vencida' else p_status end
$$;

create or replace function public.fitness_es_admin() returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.fitness_profiles p where p.id=auth.uid() and p.role='admin' and not p.blocked)
$$;

-- ---------- Administrador ----------
create or replace function public.fitness_red_admin() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.fitness_es_admin() then raise exception 'No autorizado'; end if;
 return (select coalesce(jsonb_agg(to_jsonb(r) order by r.activo desc, r.nombre),'[]') from public.fitness_red_proveedores r);
end $$;

create or replace function public.fitness_red_guardar(p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 v_id bigint := nullif(p->>'id','')::bigint;
 v_nombre text := btrim(coalesce(p->>'nombre',''));
 v_rubros text[]; v_zonas text[];
begin
 if not public.fitness_es_admin() then raise exception 'No autorizado'; end if;
 if length(v_nombre) not between 2 and 120 then raise exception 'Escribí el nombre del proveedor'; end if;
 if coalesce(p->>'whatsapp','')<>'' and length(regexp_replace(p->>'whatsapp','[^0-9]','','g')) not between 8 and 15 then raise exception 'Revisá el WhatsApp'; end if;
 select coalesce(array_agg(distinct x),'{}') into v_rubros from jsonb_array_elements_text(coalesce(p->'rubros','[]')) x
  where x in ('musculacion','funcional','colchonetas','deportes','entrenamiento','atletismo','escolar','boxeo','natacion','rehabilitacion');
 select coalesce(array_agg(distinct btrim(x)),'{}') into v_zonas from jsonb_array_elements_text(coalesce(p->'zonas','[]')) x where length(btrim(x)) between 2 and 40;
 if cardinality(v_zonas)=0 then v_zonas := '{todo}'; end if;
 if v_id is null then
  insert into public.fitness_red_proveedores(nombre,contacto,whatsapp,email,rubros,zonas,activo,notas)
  values(v_nombre,nullif(btrim(coalesce(p->>'contacto','')),''),nullif(regexp_replace(coalesce(p->>'whatsapp',''),'[^0-9]','','g'),''),
   nullif(lower(btrim(coalesce(p->>'email',''))),''),v_rubros,v_zonas,coalesce((p->>'activo')::boolean,true),nullif(btrim(coalesce(p->>'notas','')),''))
  returning id into v_id;
 else
  update public.fitness_red_proveedores set nombre=v_nombre,contacto=nullif(btrim(coalesce(p->>'contacto','')),''),
   whatsapp=nullif(regexp_replace(coalesce(p->>'whatsapp',''),'[^0-9]','','g'),''),email=nullif(lower(btrim(coalesce(p->>'email',''))),''),
   rubros=v_rubros,zonas=v_zonas,activo=coalesce((p->>'activo')::boolean,true),notas=nullif(btrim(coalesce(p->>'notas','')),''),updated_at=now()
  where id=v_id;
  if not found then raise exception 'Proveedor inexistente'; end if;
 end if;
 return jsonb_build_object('id',v_id);
end $$;

-- Invita proveedores de la red a una solicitud. Devuelve los links (tokens) para mandar por WhatsApp.
create or replace function public.fitness_invitar(p_code text, p_ids bigint[]) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s public.fitness_solicitudes;
begin
 if not public.fitness_es_admin() then raise exception 'No autorizado'; end if;
 select * into s from public.fitness_solicitudes where code=p_code for update;
 if not found then raise exception 'Solicitud inexistente'; end if;
 if s.status in ('elegida','cerrada','descartada') then raise exception 'La solicitud ya no está abierta'; end if;
 if coalesce(cardinality(p_ids),0) = 0 or cardinality(p_ids) > 20 then raise exception 'Elegí entre 1 y 20 proveedores'; end if;
 insert into public.fitness_invitaciones(solicitud_code,proveedor_id,token)
 select p_code, r.id, replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','')
 from public.fitness_red_proveedores r where r.id = any(p_ids) and r.activo
 on conflict (solicitud_code,proveedor_id) do nothing;
 update public.fitness_solicitudes set
  status = case when status='nueva' then 'enviada' else status end,
  proveedores_consultados = least(99,(select count(*) from public.fitness_invitaciones i where i.solicitud_code=p_code)),
  updated_at = now()
 where code=p_code;
 return (select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'proveedor',r.nombre,'whatsapp',r.whatsapp,'token',i.token) order by r.nombre),'[]')
  from public.fitness_invitaciones i join public.fitness_red_proveedores r on r.id=i.proveedor_id where i.solicitud_code=p_code);
end $$;

-- Lista de solicitudes con sus invitaciones y ofertas (reemplaza la versión anterior).
create or replace function public.fitness_solicitudes_admin() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.fitness_es_admin() then raise exception 'No autorizado'; end if;
 return (select coalesce(jsonb_agg(to_jsonb(s) || jsonb_build_object(
   'estado', public.fitness_sol_estado(s.status,s.updated_at),
   'invitaciones', coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'proveedorId',r.id,'proveedor',r.nombre,'whatsapp',r.whatsapp,'token',i.token,
      'creada',i.created_at,'visto',i.visto_at,'oferta',(select to_jsonb(o) from public.fitness_ofertas_solicitud o where o.invitacion_id=i.id)) order by i.created_at)
     from public.fitness_invitaciones i join public.fitness_red_proveedores r on r.id=i.proveedor_id where i.solicitud_code=s.code),'[]'))
  order by s.created_at desc),'[]') from public.fitness_solicitudes s);
end $$;

create or replace function public.fitness_solicitud_actualizar(p_code text, p_status text, p_proveedores int, p_ofertas int, p_nota text) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not public.fitness_es_admin() then raise exception 'No autorizado'; end if;
 if p_status not in ('nueva','enviada','con_ofertas','elegida','cerrada','descartada') then raise exception 'Estado inválido'; end if;
 if coalesce(p_proveedores,0) not between 0 and 99 or coalesce(p_ofertas,0) not between 0 and 99 then raise exception 'Revisá las cantidades'; end if;
 if length(coalesce(p_nota,''))>500 then raise exception 'La nota es demasiado larga'; end if;
 update public.fitness_solicitudes set status=p_status,proveedores_consultados=coalesce(p_proveedores,0),ofertas_recibidas=coalesce(p_ofertas,0),
  nota_publica=nullif(btrim(coalesce(p_nota,'')),''),updated_at=now() where code=p_code;
 if not found then raise exception 'Solicitud inexistente'; end if;
 return jsonb_build_object('ok',true);
end $$;

-- ---------- Proveedor invitado (con su link privado) ----------
create or replace function public.fitness_invitacion_ver(p_token text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare i public.fitness_invitaciones; s public.fitness_solicitudes; r public.fitness_red_proveedores;
begin
 if coalesce(p_token,'') !~ '^[0-9a-f]{64}$' then raise exception 'El link no es válido'; end if;
 select * into i from public.fitness_invitaciones where token=p_token;
 if not found then raise exception 'El link no es válido o fue reemplazado'; end if;
 select * into s from public.fitness_solicitudes where code=i.solicitud_code;
 select * into r from public.fitness_red_proveedores where id=i.proveedor_id;
 if i.visto_at is null then update public.fitness_invitaciones set visto_at=now() where id=i.id; end if;
 -- Sin nombre, email, teléfono, empresa ni presupuesto del comprador.
 return jsonb_build_object('code',s.code,'proveedor',r.nombre,'estado',public.fitness_sol_estado(s.status,s.updated_at),
  'abierta', public.fitness_sol_estado(s.status,s.updated_at) in ('nueva','enviada','con_ofertas'),
  'tipo',s.tipo,'items',s.items,'detalles',s.detalles,'localidad',s.localidad,'provincia',s.provincia,'plazo',s.plazo,
  'factura',s.factura,'pagos',s.pagos,'prioridad',s.prioridad,'creada',s.created_at,
  'elegida', s.oferta_elegida is not null and s.oferta_elegida=(select o.id from public.fitness_ofertas_solicitud o where o.invitacion_id=i.id),
  'oferta',(select to_jsonb(o) - 'invitacion_id' from public.fitness_ofertas_solicitud o where o.invitacion_id=i.id));
end $$;

create or replace function public.fitness_oferta_enviar(p_token text, p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare i public.fitness_invitaciones; s public.fitness_solicitudes; v_hasta date; n int;
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
 begin v_hasta := (p->>'valida_hasta')::date; exception when others then raise exception 'Indicá hasta cuándo vale la oferta'; end;
 if v_hasta is null or v_hasta < current_date or v_hasta > current_date + 90 then raise exception 'La oferta tiene que valer desde hoy y hasta 90 días'; end if;
 if coalesce(p->>'cumple','total') not in ('total','parcial') then raise exception 'Indicá si cumple todo el pedido'; end if;
 if length(coalesce(p->>'notas',''))>600 then raise exception 'Las notas son demasiado largas'; end if;
 if coalesce(p->>'cumple','total')='parcial' and length(btrim(coalesce(p->>'notas','')))<5 then raise exception 'Contá en las notas qué parte del pedido no cubrís'; end if;
 insert into public.fitness_ofertas_solicitud(invitacion_id,precio_total,envio,plazo_dias,cuotas,garantia_meses,valida_hasta,cumple,notas)
 values(i.id,(p->>'precio_total')::numeric,coalesce(nullif(p->>'envio',''),'0')::numeric,(p->>'plazo_dias')::int,coalesce(nullif(p->>'cuotas',''),'0')::int,
  coalesce(nullif(p->>'garantia_meses',''),'0')::int,v_hasta,coalesce(p->>'cumple','total'),nullif(btrim(coalesce(p->>'notas','')),''))
 on conflict (invitacion_id) do update set precio_total=excluded.precio_total,envio=excluded.envio,plazo_dias=excluded.plazo_dias,cuotas=excluded.cuotas,
  garantia_meses=excluded.garantia_meses,valida_hasta=excluded.valida_hasta,cumple=excluded.cumple,notas=excluded.notas,updated_at=now();
 select count(*) into n from public.fitness_ofertas_solicitud o join public.fitness_invitaciones x on x.id=o.invitacion_id where x.solicitud_code=s.code;
 update public.fitness_solicitudes set status='con_ofertas', ofertas_recibidas=least(99,n), updated_at=now() where code=s.code;
 return jsonb_build_object('ok',true,'ofertas',n);
end $$;

-- ---------- Comprador ----------
-- Seguimiento con ofertas comparables. Los proveedores aparecen como "Oferta A, B, C" hasta que el comprador elige.
create or replace function public.fitness_solicitud_consulta(p_code text, p_email text) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare s public.fitness_solicitudes; v_estado text;
begin
 select * into s from public.fitness_solicitudes x where x.code=upper(btrim(coalesce(p_code,''))) and x.email=lower(btrim(coalesce(p_email,'')));
 if not found then raise exception 'No encontramos una solicitud con ese número y ese email'; end if;
 v_estado := public.fitness_sol_estado(s.status,s.updated_at);
 return jsonb_build_object('code',s.code,'status',v_estado,'createdAt',s.created_at,'updatedAt',s.updated_at,
  'productos',jsonb_array_length(s.items),'items',s.items,'localidad',s.localidad,'plazo',s.plazo,'prioridad',s.prioridad,
  'proveedores',s.proveedores_consultados,'nota',s.nota_publica,
  'ofertas',(select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'letra',chr(64+o.n::int),'precio',o.precio_total,'envio',o.envio,
     'total',o.precio_total+o.envio,'plazo',o.plazo_dias,'cuotas',o.cuotas,'garantia',o.garantia_meses,'validaHasta',o.valida_hasta,
     'vencida',o.valida_hasta<current_date,'cumple',o.cumple,'notas',o.notas,'elegida',coalesce(o.id=s.oferta_elegida,false),
     'proveedor',case when o.id=s.oferta_elegida then o.nombre end) order by o.n),'[]')
   from (select oo.*, r.nombre, row_number() over (order by oo.created_at, oo.id) as n
     from public.fitness_ofertas_solicitud oo join public.fitness_invitaciones i on i.id=oo.invitacion_id
     join public.fitness_red_proveedores r on r.id=i.proveedor_id where i.solicitud_code=s.code) o));
end $$;

create or replace function public.fitness_oferta_elegir(p_code text, p_email text, p_oferta bigint) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s public.fitness_solicitudes; o public.fitness_ofertas_solicitud; v_nombre text;
begin
 select * into s from public.fitness_solicitudes x where x.code=upper(btrim(coalesce(p_code,''))) and x.email=lower(btrim(coalesce(p_email,''))) for update;
 if not found then raise exception 'No encontramos una solicitud con ese número y ese email'; end if;
 if public.fitness_sol_estado(s.status,s.updated_at) <> 'con_ofertas' then raise exception 'Esta solicitud ya no permite elegir una oferta'; end if;
 select oo.* into o from public.fitness_ofertas_solicitud oo join public.fitness_invitaciones i on i.id=oo.invitacion_id
  where oo.id=p_oferta and i.solicitud_code=s.code;
 if not found then raise exception 'La oferta no corresponde a esta solicitud'; end if;
 if o.valida_hasta < current_date then raise exception 'Esa oferta venció. Elegí otra o escribinos para renovarla'; end if;
 select r.nombre into v_nombre from public.fitness_invitaciones i join public.fitness_red_proveedores r on r.id=i.proveedor_id where i.id=o.invitacion_id;
 update public.fitness_solicitudes set status='elegida', oferta_elegida=o.id, elegida_at=now(), updated_at=now() where code=s.code;
 return jsonb_build_object('ok',true,'proveedor',v_nombre,'total',o.precio_total+o.envio);
end $$;

revoke all on function public.fitness_sol_estado(text,timestamptz) from public,anon,authenticated;
revoke all on function public.fitness_es_admin() from public,anon;
revoke all on function public.fitness_red_admin(), public.fitness_red_guardar(jsonb), public.fitness_invitar(text,bigint[]) from public,anon;
revoke all on function public.fitness_invitacion_ver(text), public.fitness_oferta_enviar(text,jsonb), public.fitness_oferta_elegir(text,text,bigint) from public;
grant execute on function public.fitness_es_admin() to authenticated;
grant execute on function public.fitness_red_admin(), public.fitness_red_guardar(jsonb), public.fitness_invitar(text,bigint[]) to authenticated;
grant execute on function public.fitness_invitacion_ver(text), public.fitness_oferta_enviar(text,jsonb), public.fitness_oferta_elegir(text,text,bigint) to anon,authenticated;
grant execute on function public.fitness_solicitudes_admin(), public.fitness_solicitud_actualizar(text,text,int,int,text) to authenticated;
grant execute on function public.fitness_solicitud_consulta(text,text) to anon,authenticated;
commit;

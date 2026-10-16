begin;
-- "Conseguí la mejor oferta": el comprador publica una necesidad concreta y Nexo Fit la reenvía a proveedores aptos.
-- Cualquiera puede crear una solicitud y recibe un código. Solo el administrador puede verlas y cambiar su estado.
create table if not exists public.fitness_solicitudes(
 code text primary key,
 created_at timestamptz not null default now(),
 tipo text not null check (tipo in ('gimnasio','club','colegio','entrenador','particular','otro')),
 nombre text not null,
 empresa text,
 email text not null,
 telefono text not null,
 items jsonb not null,
 detalles text,
 localidad text not null,
 provincia text not null,
 plazo text not null check (plazo in ('urgente','7','15','30','flexible')),
 factura text not null check (factura in ('A','B','C','no')),
 pagos text[] not null default '{}',
 prioridad text not null check (prioridad in ('precio','rapidez','financiacion','calidad','equilibrio')),
 presupuesto numeric,
 origen jsonb,
 status text not null default 'nueva' check (status in ('nueva','enviada','con_ofertas','cerrada','descartada')),
 proveedores_consultados int not null default 0 check (proveedores_consultados between 0 and 99),
 ofertas_recibidas int not null default 0 check (ofertas_recibidas between 0 and 99),
 nota_publica text check (length(nota_publica)<=500),
 updated_at timestamptz not null default now()
);
create index if not exists fitness_solicitudes_email_idx on public.fitness_solicitudes(email,created_at desc);
create index if not exists fitness_solicitudes_created_idx on public.fitness_solicitudes(created_at desc);
alter table public.fitness_solicitudes enable row level security;
revoke all on table public.fitness_solicitudes from public,anon,authenticated;
grant select,insert,update on table public.fitness_solicitudes to service_role;

create or replace function public.fitness_crear_solicitud(details jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 c text;
 n text:=btrim(coalesce(details->>'nombre',''));
 e text:=lower(btrim(coalesce(details->>'email','')));
 t text:=btrim(coalesce(details->>'telefono',''));
 loc text:=btrim(coalesce(details->>'localidad',''));
 prov text:=btrim(coalesce(details->>'provincia',''));
 its jsonb:=coalesce(details->'items','[]'::jsonb);
 it jsonb;
 pg text[];
 pres numeric;
begin
 if jsonb_typeof(its)<>'array' or jsonb_array_length(its) not between 1 and 25 then raise exception 'Cargá entre 1 y 25 productos'; end if;
 for it in select * from jsonb_array_elements(its) loop
  if length(btrim(coalesce(it->>'producto',''))) not between 2 and 120 then raise exception 'Escribí qué producto necesitás'; end if;
  if coalesce(it->>'cantidad','') !~ '^[0-9]{1,6}$' or (it->>'cantidad')::int<1 then raise exception 'Revisá las cantidades'; end if;
  if length(coalesce(it->>'detalle',''))>300 then raise exception 'El detalle de un producto es demasiado largo'; end if;
 end loop;
 if length(n) not between 2 and 120 then raise exception 'Escribí tu nombre'; end if;
 if e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(e)>160 then raise exception 'Escribí un email válido'; end if;
 if length(regexp_replace(t,'[^0-9]','','g')) not between 8 and 15 then raise exception 'Escribí un WhatsApp válido'; end if;
 if length(loc) not between 2 and 80 or length(prov) not between 2 and 60 then raise exception 'Indicá localidad y provincia de entrega'; end if;
 if length(coalesce(details->>'detalles',''))>1500 or length(coalesce(details->>'empresa',''))>120 then raise exception 'El texto es demasiado largo'; end if;
 select coalesce(array_agg(x),'{}') into pg from jsonb_array_elements_text(coalesce(details->'pagos','[]'::jsonb)) x
  where x in ('transferencia','tarjeta','mercadopago','efectivo','cuenta_corriente');
 if coalesce(details->>'presupuesto','')<>'' then
  if details->>'presupuesto' !~ '^[0-9]{1,12}$' then raise exception 'Revisá el presupuesto aproximado'; end if;
  pres:=(details->>'presupuesto')::numeric;
 end if;
 if (select count(*) from public.fitness_solicitudes s where s.email=e and s.created_at>now()-interval '1 day')>=5 then
  raise exception 'Ya recibimos varias solicitudes con este email hoy. Te vamos a contactar.';
 end if;
 -- Freno ante envíos masivos automáticos.
 if (select count(*) from public.fitness_solicitudes s where s.created_at>now()-interval '1 hour')>=100 then
  raise exception 'Estamos recibiendo muchas solicitudes. Probá de nuevo en un rato o escribinos por WhatsApp.';
 end if;
 -- Se guardan solo los campos conocidos de cada producto, ya recortados.
 select jsonb_agg(jsonb_build_object('producto',btrim(x->>'producto'),'cantidad',x->>'cantidad','detalle',btrim(coalesce(x->>'detalle',''))) order by o)
  into its from jsonb_array_elements(its) with ordinality as a(x,o);
 loop
  c:='SOL-'||upper(substr(md5(random()::text||clock_timestamp()::text||e),1,6));
  exit when not exists(select 1 from public.fitness_solicitudes s where s.code=c);
 end loop;
 insert into public.fitness_solicitudes(code,tipo,nombre,empresa,email,telefono,items,detalles,localidad,provincia,plazo,factura,pagos,prioridad,presupuesto,origen)
 values(c,details->>'tipo',n,nullif(btrim(coalesce(details->>'empresa','')),''),e,t,its,
  nullif(btrim(coalesce(details->>'detalles','')),''),loc,prov,details->>'plazo',details->>'factura',pg,details->>'prioridad',pres,
  case when jsonb_typeof(details->'origen')='object' and length((details->'origen')::text)<=1500 then details->'origen' end);
 return jsonb_build_object('code',c,'createdAt',now());
exception when check_violation or not_null_violation then
 raise exception 'Revisá los datos de la solicitud';
end $$;

create or replace function public.fitness_solicitudes_admin() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not exists(select 1 from public.fitness_profiles p where p.id=auth.uid() and p.role='admin' and not p.blocked) then raise exception 'No autorizado'; end if;
 return (select coalesce(jsonb_agg(to_jsonb(s) order by s.created_at desc),'[]') from public.fitness_solicitudes s);
end $$;

create or replace function public.fitness_solicitud_actualizar(p_code text, p_status text, p_proveedores int, p_ofertas int, p_nota text) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.fitness_profiles p where p.id=auth.uid() and p.role='admin' and not p.blocked) then raise exception 'No autorizado'; end if;
 if p_status not in ('nueva','enviada','con_ofertas','cerrada','descartada') then raise exception 'Estado inválido'; end if;
 if coalesce(p_proveedores,0) not between 0 and 99 or coalesce(p_ofertas,0) not between 0 and 99 then raise exception 'Revisá las cantidades'; end if;
 if length(coalesce(p_nota,''))>500 then raise exception 'La nota es demasiado larga'; end if;
 update public.fitness_solicitudes set status=p_status,proveedores_consultados=coalesce(p_proveedores,0),ofertas_recibidas=coalesce(p_ofertas,0),
  nota_publica=nullif(btrim(coalesce(p_nota,'')),''),updated_at=now() where code=p_code;
 if not found then raise exception 'Solicitud inexistente'; end if;
 return jsonb_build_object('ok',true);
end $$;

-- Seguimiento para el comprador: con el código y el mismo email de la solicitud ve la etapa, nunca los datos de otros.
create or replace function public.fitness_solicitud_consulta(p_code text, p_email text) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare s public.fitness_solicitudes;
begin
 select * into s from public.fitness_solicitudes x where x.code=upper(btrim(coalesce(p_code,''))) and x.email=lower(btrim(coalesce(p_email,'')));
 if not found then raise exception 'No encontramos una solicitud con ese número y ese email'; end if;
 return jsonb_build_object('code',s.code,'status',s.status,'createdAt',s.created_at,'updatedAt',s.updated_at,
  'productos',jsonb_array_length(s.items),'items',s.items,'localidad',s.localidad,'proveedores',s.proveedores_consultados,
  'ofertas',s.ofertas_recibidas,'nota',s.nota_publica);
end $$;

revoke all on function public.fitness_crear_solicitud(jsonb) from public;
revoke all on function public.fitness_solicitudes_admin() from public,anon;
revoke all on function public.fitness_solicitud_actualizar(text,text,int,int,text) from public,anon;
revoke all on function public.fitness_solicitud_consulta(text,text) from public;
grant execute on function public.fitness_crear_solicitud(jsonb) to anon,authenticated;
grant execute on function public.fitness_solicitudes_admin() to authenticated;
grant execute on function public.fitness_solicitud_actualizar(text,text,int,int,text) to authenticated;
grant execute on function public.fitness_solicitud_consulta(text,text) to anon,authenticated;
commit;

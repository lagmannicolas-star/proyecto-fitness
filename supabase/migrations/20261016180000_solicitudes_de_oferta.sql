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
 updated_at timestamptz not null default now()
);
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
 if jsonb_typeof(its)<>'array' or jsonb_array_length(its) not between 1 and 15 then raise exception 'Cargá entre 1 y 15 productos'; end if;
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
 c:='SOL-'||upper(substr(md5(random()::text||clock_timestamp()::text||e),1,6));
 insert into public.fitness_solicitudes(code,tipo,nombre,empresa,email,telefono,items,detalles,localidad,provincia,plazo,factura,pagos,prioridad,presupuesto,origen)
 values(c,details->>'tipo',n,nullif(btrim(coalesce(details->>'empresa','')),''),e,t,its,
  nullif(btrim(coalesce(details->>'detalles','')),''),loc,prov,details->>'plazo',details->>'factura',pg,details->>'prioridad',pres,
  case when jsonb_typeof(details->'origen')='object' then details->'origen' end);
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

create or replace function public.fitness_solicitud_estado(p_code text, p_status text) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.fitness_profiles p where p.id=auth.uid() and p.role='admin' and not p.blocked) then raise exception 'No autorizado'; end if;
 if p_status not in ('nueva','enviada','con_ofertas','cerrada','descartada') then raise exception 'Estado inválido'; end if;
 update public.fitness_solicitudes set status=p_status,updated_at=now() where code=p_code;
 if not found then raise exception 'Solicitud inexistente'; end if;
 return jsonb_build_object('ok',true);
end $$;

revoke all on function public.fitness_crear_solicitud(jsonb) from public;
revoke all on function public.fitness_solicitudes_admin() from public,anon;
revoke all on function public.fitness_solicitud_estado(text,text) from public,anon;
grant execute on function public.fitness_crear_solicitud(jsonb) to anon,authenticated;
grant execute on function public.fitness_solicitudes_admin() to authenticated;
grant execute on function public.fitness_solicitud_estado(text,text) to authenticated;
commit;

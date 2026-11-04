-- Promoción de lanzamiento: 5 % solo para empresas nuevas que recibieron la promo y se suman entre el 3/11 y el 13/11/2026.
-- Las que ya estaban en la red no cambian. La lista la completa la tarea que actualiza la oficina.
create table if not exists public.fitness_promo_lanzamiento (
 email text primary key,
 enviado_at timestamptz not null default now()
);
alter table public.fitness_promo_lanzamiento enable row level security;

create or replace function public.fitness_red_comision_pct(p_proveedor bigint) returns numeric
language sql stable security definer set search_path='' as $$
 select coalesce(
  (select comision from public.fitness_red_proveedores where id=p_proveedor),
  (select 5::numeric from public.fitness_red_proveedores r
    where r.id=p_proveedor and not coalesce(r.es_prueba,false)
      and r.created_at >= timestamptz '2026-11-03 00:00:00-03'
      and r.created_at <  timestamptz '2026-11-14 00:00:00-03'
      and now() < timestamptz '2027-01-01 00:00:00-03'
      and exists (select 1 from public.fitness_promo_lanzamiento p
        where p.email = lower(btrim(r.email))
           or (split_part(p.email,'@',2) = split_part(lower(btrim(r.email)),'@',2)
               and split_part(p.email,'@',2) not in ('gmail.com','hotmail.com','hotmail.com.ar','yahoo.com','yahoo.com.ar','outlook.com','outlook.com.ar','live.com','live.com.ar','icloud.com')))),
  (select (data->>'commission')::numeric from public.fitness_state where id=true), 10)
$$;

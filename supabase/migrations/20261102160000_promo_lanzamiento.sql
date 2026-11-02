-- Promoción de lanzamiento (decidida por Nicolás el 2/11/2026):
-- los proveedores que se suman a la red entre el 2/11 y el viernes 13/11/2026 (hora de Buenos Aires)
-- pagan 5 % de comisión sobre los productos, en vez del 10 %, en todas las ventas hasta el 31/12/2026.
-- Una comisión cargada a mano para un proveedor (columna comision) siempre tiene prioridad.
create or replace function public.fitness_red_comision_pct(p_proveedor bigint) returns numeric
language sql stable security definer set search_path='' as $$
 select coalesce(
  (select comision from public.fitness_red_proveedores where id=p_proveedor),
  -- Promoción de lanzamiento: alta entre el 2/11 y el 13/11/2026 → 5 % hasta el 31/12/2026.
  (select 5::numeric from public.fitness_red_proveedores
    where id=p_proveedor and not coalesce(es_prueba,false)
      and created_at >= timestamptz '2026-11-02 00:00:00-03'
      and created_at <  timestamptz '2026-11-14 00:00:00-03'
      and now() < timestamptz '2027-01-01 00:00:00-03'),
  (select (data->>'commission')::numeric from public.fitness_state where id=true), 10)
$$;

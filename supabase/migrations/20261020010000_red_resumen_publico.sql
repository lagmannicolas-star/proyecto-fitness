-- Resumen público de la red de proveedores para la portada.
-- Solo devuelve totales (sin nombres ni datos de contacto).
create or replace function public.fitness_red_resumen()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'proveedores', (select count(*) from public.fitness_red_proveedores where activo),
    'rubros', (select count(distinct r) from public.fitness_red_proveedores p, unnest(p.rubros) r where p.activo)
  );
$$;

revoke all on function public.fitness_red_resumen() from public;
grant execute on function public.fitness_red_resumen() to anon, authenticated;

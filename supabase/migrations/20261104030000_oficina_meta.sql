-- Publicaciones cargadas a mano en Meta Business Suite: la oficina las cuenta sin que el publicador las vuelva a sacar.
create or replace function public.fitness_oficina_meta()
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare hoy date := (now() at time zone 'America/Argentina/Buenos_Aires')::date; r jsonb;
begin
 if not public.fitness_es_admin() then raise exception 'No autorizado'; end if;
 select jsonb_build_object(
  'programados', count(*),
  'hasta', max(q.scheduled_at),
  'hoy', count(*) filter (where q.red = 'instagram' and (q.scheduled_at at time zone 'America/Argentina/Buenos_Aires')::date = hoy),
  'proxima', (select jsonb_build_object('fecha', p.scheduled_at, 'titulo', regexp_replace(p.label, ' · Facebook$', ''))
     from public.fitness_social_queue p
     where p.status = 'pausado' and p.error like 'Programado a mano%' and p.scheduled_at > now()
     order by p.scheduled_at limit 1))
 into r from public.fitness_social_queue q
 where q.status = 'pausado' and q.error like 'Programado a mano%' and q.scheduled_at > now();
 return r;
end $$;
revoke all on function public.fitness_oficina_meta() from public, anon;
grant execute on function public.fitness_oficina_meta() to authenticated;

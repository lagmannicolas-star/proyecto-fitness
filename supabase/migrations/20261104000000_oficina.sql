-- Oficina Nexo Fit: el estado del negocio en una sola lectura, solo para administradores.
-- No expone emails, teléfonos, CUIT, llaves ni tokens.
-- fitness_oficina_foto guarda lo que no vive en esta base (redes, mails y tareas programadas).
-- La escribe una tarea programada; RLS sin políticas: nadie la lee ni la escribe desde la web.
create table if not exists public.fitness_oficina_foto (
 id boolean primary key default true check (id),
 datos jsonb not null default '{}'::jsonb,
 updated_at timestamptz not null default now()
);
alter table public.fitness_oficina_foto enable row level security;

-- Novedades y reportes de cada espacio. Las escriben las tareas programadas; el panel solo las lee.
create table if not exists public.fitness_oficina_novedades (
 id bigint generated always as identity primary key,
 espacio text not null check (espacio in ('direccion','comercial','redes','marketing','diseno','investigacion','administracion','operaciones')),
 tipo text not null default 'avance' check (tipo in ('avance','reporte','alerta')),
 titulo text not null,
 detalle text,
 enlace text,
 created_at timestamptz not null default now()
);
create index if not exists fitness_oficina_novedades_fecha on public.fitness_oficina_novedades (created_at desc);
alter table public.fitness_oficina_novedades enable row level security;

create or replace function public.fitness_oficina() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare s public.fitness_social_settings; f public.fitness_oficina_foto;
begin
 if not public.fitness_es_admin() then raise exception 'No autorizado'; end if;
 select * into s from public.fitness_social_settings where id;
 select * into f from public.fitness_oficina_foto where id;
 return jsonb_build_object(
  'ahora',now(),
  'red',(select coalesce(jsonb_agg(jsonb_build_object(
     'id',r.id,'nombre',r.nombre,'tipo',r.tipo,'localidad',r.localidad,'alta',r.created_at,
     'rubros',coalesce(array_length(r.rubros,1),0),'zonas',coalesce(array_length(r.zonas,1),0),
     'mp',public.fitness_mp_red_conectado(r.id),'comision',public.fitness_red_comision_pct(r.id),
     'cuit_ok',coalesce(r.cuit_verificado,false)) order by r.created_at desc),'[]'::jsonb)
    from public.fitness_red_proveedores r where r.activo and not coalesce(r.es_prueba,false)),
  'pedidos',(select coalesce(jsonb_agg(jsonb_build_object(
     'code',p.code,'alta',p.created_at,'tipo',p.tipo,'empresa',coalesce(nullif(p.empresa,''),p.nombre),
     'localidad',p.localidad,'provincia',p.provincia,'status',p.status,'ofertas',coalesce(p.ofertas_recibidas,0),
     'consultados',coalesce(p.proveedores_consultados,0),'pago_estado',p.pago_estado,
     'pago_monto',p.pago_monto,'pago_comision',p.pago_comision) order by p.created_at desc),'[]'::jsonb)
    from public.fitness_solicitudes p where not coalesce(p.es_prueba,false)),
  'instagram',jsonb_build_object(
    'conectado',public.fitness_social_token() is not null,
    'usuario',s.ig_username,'pausado',s.paused,'ultima_revision',s.last_run_at,
    'ultimo_error',s.last_error,'vence',s.token_expires_at,
    'pendientes',(select count(*) from public.fitness_social_queue q where q.status='pendiente'),
    'proxima',(select min(q.scheduled_at) from public.fitness_social_queue q where q.status='pendiente'),
    'hoy',(select count(*) from public.fitness_social_queue q where q.status='pendiente'
       and (q.scheduled_at at time zone 'America/Argentina/Buenos_Aires')::date=(now() at time zone 'America/Argentina/Buenos_Aires')::date),
    'publicadas',(select count(*) from public.fitness_social_queue q where q.status='publicado'),
    'ultima_publicada',(select max(q.published_at) from public.fitness_social_queue q where q.status='publicado'),
    'errores',(select count(*) from public.fitness_social_queue q where q.status='error')),
  'avisos',jsonb_build_object(
    'enviados_7d',(select count(*) from public.fitness_avisos a where a.estado='enviado' and a.created_at>now()-interval '7 days'),
    'errores_7d',(select count(*) from public.fitness_avisos a where a.estado='error' and a.created_at>now()-interval '7 days'),
    'ultimo_error',(select a.error from public.fitness_avisos a where a.estado='error' order by a.id desc limit 1),
    'ultimo_error_at',(select a.created_at from public.fitness_avisos a where a.estado='error' order by a.id desc limit 1)),
  'automatismos',(select coalesce(jsonb_agg(jsonb_build_object(
     'nombre',j.jobname,'activo',j.active,'estado',u.status,'ultima',u.start_time) order by j.jobname),'[]'::jsonb)
    from cron.job j left join lateral (select d.status,d.start_time from cron.job_run_details d
      where d.jobid=j.jobid order by d.runid desc limit 1) u on true),
  'promo_cargadas',(select count(*) from public.fitness_promo_lanzamiento),
  'novedades',(select coalesce(jsonb_agg(jsonb_build_object('id',n.id,'espacio',n.espacio,'tipo',n.tipo,'titulo',n.titulo,
     'detalle',n.detalle,'enlace',n.enlace,'fecha',n.created_at) order by n.id desc),'[]'::jsonb)
    from (select * from public.fitness_oficina_novedades order by id desc limit 120) n),
  'exigir_mp',coalesce((select c.exigir_mp from public.fitness_avisos_config c where c.id),false),
  'foto',case when f.id is null then null else jsonb_build_object('datos',f.datos,'actualizada',f.updated_at) end
 );
end $$;
revoke all on function public.fitness_oficina() from public, anon;
grant execute on function public.fitness_oficina() to authenticated;

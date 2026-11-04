-- Oficina que trabaja por turnos: encargos por espacio, historia de métricas y cola de Meta.
create table if not exists public.fitness_oficina_encargos (
 id bigint generated always as identity primary key,
 espacio text not null check (espacio in ('direccion','comercial','redes','marketing','diseno','investigacion','administracion','operaciones')),
 titulo text not null check (length(titulo) between 3 and 200),
 detalle text check (length(detalle)<=2000),
 estado text not null default 'pendiente' check (estado in ('pendiente','en_curso','hecho','descartado')),
 origen text not null default 'nicolas' check (origen in ('nicolas','oficina')),
 resultado text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists fitness_oficina_encargos_abiertos on public.fitness_oficina_encargos (espacio, estado);
alter table public.fitness_oficina_encargos enable row level security;

create table if not exists public.fitness_oficina_metricas (
 fecha date not null,
 clave text not null,
 valor numeric not null,
 primary key (fecha, clave)
);
alter table public.fitness_oficina_metricas enable row level security;

-- Foto diaria de lo que vive en la base. Las métricas de redes las suma la tarea de lectura.
create or replace function public.fitness_oficina_medir() returns void language plpgsql security definer set search_path='' as $$
declare hoy date:=(now() at time zone 'America/Argentina/Buenos_Aires')::date;
begin
 insert into public.fitness_oficina_metricas(fecha,clave,valor) values
  (hoy,'proveedores',(select count(*) from public.fitness_red_proveedores r where r.activo and not coalesce(r.es_prueba,false))),
  (hoy,'con_mp',(select count(*) from public.fitness_red_proveedores r where r.activo and not coalesce(r.es_prueba,false) and public.fitness_mp_red_conectado(r.id))),
  (hoy,'pedidos',(select count(*) from public.fitness_solicitudes p where not coalesce(p.es_prueba,false) and p.status<>'descartada')),
  (hoy,'promo',(select count(*) from public.fitness_promo_lanzamiento)),
  (hoy,'cola_meta',(select count(*) from public.fitness_social_queue q where q.status='pendiente')),
  (hoy,'publicadas_meta',(select count(*) from public.fitness_social_queue q where q.status='publicado'))
 on conflict (fecha,clave) do update set valor=excluded.valor;
end $$;
revoke all on function public.fitness_oficina_medir() from public, anon, authenticated;
select public.fitness_oficina_medir();
select cron.schedule('nexofit-oficina-medir','17 * * * *','select public.fitness_oficina_medir()');

-- Nicolás le pide algo a un espacio. El próximo turno de ese espacio lo toma.
create or replace function public.fitness_oficina_encargar(p_espacio text, p_titulo text, p_detalle text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare i bigint;
begin
 if not public.fitness_es_admin() then raise exception 'No autorizado'; end if;
 insert into public.fitness_oficina_encargos(espacio,titulo,detalle) values (p_espacio,btrim(p_titulo),nullif(btrim(coalesce(p_detalle,'')),'')) returning id into i;
 return jsonb_build_object('id',i);
end $$;
create or replace function public.fitness_oficina_encargo_quitar(p_id bigint) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not public.fitness_es_admin() then raise exception 'No autorizado'; end if;
 update public.fitness_oficina_encargos set estado='descartado',updated_at=now() where id=p_id and estado in ('pendiente','en_curso');
end $$;
revoke all on function public.fitness_oficina_encargar(text,text,text), public.fitness_oficina_encargo_quitar(bigint) from public, anon;
grant execute on function public.fitness_oficina_encargar(text,text,text), public.fitness_oficina_encargo_quitar(bigint) to authenticated;

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
    'hoy',(select count(*) from public.fitness_social_queue q where q.status='pendiente' and q.red='instagram'
       and (q.scheduled_at at time zone 'America/Argentina/Buenos_Aires')::date=(now() at time zone 'America/Argentina/Buenos_Aires')::date),
    'publicadas',(select count(*) from public.fitness_social_queue q where q.status='publicado'),
    'ultima_publicada',(select max(q.published_at) from public.fitness_social_queue q where q.status='publicado'),
    'errores',(select count(*) from public.fitness_social_queue q where q.status='error')),
  'facebook',jsonb_build_object('conectado',s.fb_page_id is not null,'pagina',s.fb_page_name,
    'hoy',(select count(*) from public.fitness_social_queue q where q.status='pendiente' and q.red='facebook'
       and (q.scheduled_at at time zone 'America/Argentina/Buenos_Aires')::date=(now() at time zone 'America/Argentina/Buenos_Aires')::date)),
  'cola',(select coalesce(jsonb_agg(jsonb_build_object('fecha',q.scheduled_at,'red',q.red,'tipo',coalesce(q.formato,q.kind),'titulo',q.label) order by q.scheduled_at),'[]'::jsonb)
    from (select * from public.fitness_social_queue where status='pendiente' and scheduled_at>now()-interval '3 hours' order by scheduled_at limit 60) q),
  'cola_total',(select count(*) from public.fitness_social_queue q where q.status='pendiente'),
  'cola_hasta',(select max(q.scheduled_at) from public.fitness_social_queue q where q.status='pendiente'),
  'encargos',(select coalesce(jsonb_agg(jsonb_build_object('id',e.id,'espacio',e.espacio,'titulo',e.titulo,'detalle',e.detalle,'estado',e.estado,'origen',e.origen,
     'resultado',e.resultado,'fecha',e.created_at) order by e.id desc),'[]'::jsonb)
    from (select * from public.fitness_oficina_encargos order by (estado in ('hecho','descartado')), id desc limit 80) e),
  'metricas',(select coalesce(jsonb_object_agg(m.clave,m.serie),'{}'::jsonb) from (
     select clave,jsonb_agg(jsonb_build_array(fecha,valor) order by fecha) serie from public.fitness_oficina_metricas
     where fecha>(now() at time zone 'America/Argentina/Buenos_Aires')::date-45 group by clave) m),
  'ofertas_total',(select count(*) from public.fitness_ofertas_solicitud o join public.fitness_invitaciones i on i.id=o.invitacion_id join public.fitness_solicitudes p on p.code=i.solicitud_code where not coalesce(p.es_prueba,false)),
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

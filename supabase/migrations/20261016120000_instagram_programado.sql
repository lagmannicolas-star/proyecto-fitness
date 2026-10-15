-- Publicaciones programadas de Instagram: el Worker las publica solo, a la hora indicada.
create table if not exists public.fitness_social_queue (
  id bigserial primary key,
  scheduled_at timestamptz not null,
  kind text not null check (kind in ('post','carrusel','historia')),
  media jsonb not null check (jsonb_typeof(media)='array' and jsonb_array_length(media) between 1 and 10),
  caption text not null default '',
  label text not null default '',
  status text not null default 'pendiente' check (status in ('pendiente','publicando','publicado','error','vencido','pausado')),
  attempts integer not null default 0,
  ig_media_id text,
  permalink text,
  error text,
  published_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists fitness_social_queue_unique on public.fitness_social_queue (scheduled_at, label);
create index if not exists fitness_social_queue_due on public.fitness_social_queue (status, scheduled_at);
alter table public.fitness_social_queue enable row level security;

-- Una sola fila: cuenta de Instagram y llave renovada (cifrada por el Worker). Nadie la lee desde el navegador.
create table if not exists public.fitness_social_settings (
  id boolean primary key default true check (id),
  paused boolean not null default false,
  ig_user_id text,
  ig_username text,
  token_sealed text,
  token_expires_at timestamptz,
  last_run_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now()
);
insert into public.fitness_social_settings (id) values (true) on conflict do nothing;
alter table public.fitness_social_settings enable row level security;

revoke all on public.fitness_social_queue, public.fitness_social_settings from anon, authenticated;

-- Panel de administración: ver la cola y el estado (sin la llave).
create or replace function public.fitness_social_admin() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.fitness_profiles where id=auth.uid() and role='admin' and not blocked) then raise exception 'No autorizado'; end if;
 return jsonb_build_object(
  'settings',(select jsonb_build_object('paused',paused,'username',ig_username,'connected',token_sealed is not null,'tokenExpiresAt',token_expires_at,'lastRunAt',last_run_at,'lastError',last_error) from public.fitness_social_settings where id),
  'queue',coalesce((select jsonb_agg(to_jsonb(q)-'media'||jsonb_build_object('media',q.media) order by q.scheduled_at) from public.fitness_social_queue q where q.scheduled_at>now()-interval '3 days' or q.status in ('error','pendiente')),'[]'));
end $$;

create or replace function public.fitness_social_pause(p_paused boolean) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.fitness_profiles where id=auth.uid() and role='admin' and not blocked) then raise exception 'No autorizado'; end if;
 update public.fitness_social_settings set paused=p_paused,updated_at=now() where id;
 return jsonb_build_object('paused',p_paused);
end $$;

create or replace function public.fitness_social_retry(p_id bigint) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.fitness_profiles where id=auth.uid() and role='admin' and not blocked) then raise exception 'No autorizado'; end if;
 update public.fitness_social_queue set status='pendiente',attempts=0,error=null,scheduled_at=greatest(scheduled_at,now()) where id=p_id and status in ('error','vencido','pausado');
 return jsonb_build_object('ok',found);
end $$;

revoke all on function public.fitness_social_admin(), public.fitness_social_pause(boolean), public.fitness_social_retry(bigint) from public, anon;
grant execute on function public.fitness_social_admin(), public.fitness_social_pause(boolean), public.fitness_social_retry(bigint) to authenticated;

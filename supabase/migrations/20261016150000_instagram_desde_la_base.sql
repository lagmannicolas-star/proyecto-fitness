-- Instagram programado, publicado desde la base de datos (pg_cron + http), sin secretos en Cloudflare.
-- La llave de Instagram la pega el administrador en el panel y se guarda cifrada en Supabase Vault.
alter table public.fitness_social_settings add column if not exists api_base text not null default 'https://graph.instagram.com';
alter table public.fitness_social_settings add column if not exists site_url text not null default 'https://nexofitt.com.ar';

create or replace function public.fitness_social_is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.fitness_profiles where id=auth.uid() and role='admin' and not blocked)
$$;

create or replace function public.fitness_social_token() returns text language sql stable security definer set search_path='' as $$
 select decrypted_secret from vault.decrypted_secrets where name='nexofit_ig_token' limit 1
$$;

-- Llamada a la API de Instagram. Devuelve el JSON o lanza el error que informa Instagram.
create or replace function public.fitness_social_ig(p_method text, p_path text, p_params jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u text; r extensions.http_response; d jsonb;
begin
 select rtrim(api_base,'/')||'/'||p_path into u from public.fitness_social_settings where id;
 perform extensions.http_set_curlopt('CURLOPT_TIMEOUT','30');
 if p_method='GET' then r:=extensions.http_get(u,p_params); else r:=extensions.http_post(u,p_params); end if;
 begin d:=r.content::jsonb; exception when others then d:=null; end;
 if r.status>=400 or d is null or d ? 'error' then
  raise exception 'Instagram: %',coalesce(d->'error'->>'message','error '||r.status);
 end if;
 return d;
end $$;

create or replace function public.fitness_social_wait(p_id text, p_token text) returns void language plpgsql security definer set search_path='' as $$
declare st text;
begin
 for i in 1..10 loop
  st:=coalesce(public.fitness_social_ig('GET',p_id,jsonb_build_object('fields','status_code','access_token',p_token))->>'status_code','FINISHED');
  if st in ('FINISHED','PUBLISHED') then return; end if;
  if st in ('ERROR','EXPIRED') then raise exception 'Instagram no pudo procesar la imagen (%)',st; end if;
  perform pg_sleep(3);
 end loop;
 raise exception 'Instagram tardó demasiado en procesar la imagen';
end $$;

-- Publica una pieza. Nunca lanza error: devuelve el resultado para guardarlo.
create or replace function public.fitness_social_publish(p_item public.fitness_social_queue) returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.fitness_social_settings; tok text; urls text[]; children text[]:='{}'; m text; creation text; pub jsonb; perm text; base jsonb;
begin
 select * into s from public.fitness_social_settings where id;
 tok:=public.fitness_social_token();
 select array_agg(case when v ~ '^https://' then v else rtrim(s.site_url,'/')||'/'||ltrim(v,'/') end order by o) into urls from jsonb_array_elements_text(p_item.media) with ordinality t(v,o);
 if urls is null then raise exception 'La publicación no tiene imágenes'; end if;
 base:=jsonb_build_object('access_token',tok);
 if p_item.kind='carrusel' then
  foreach m in array urls loop
   children:=children||(public.fitness_social_ig('POST',s.ig_user_id||'/media',base||jsonb_build_object('image_url',m,'is_carousel_item','true'))->>'id');
  end loop;
  foreach m in array children loop perform public.fitness_social_wait(m,tok); end loop;
  creation:=public.fitness_social_ig('POST',s.ig_user_id||'/media',base||jsonb_build_object('media_type','CAROUSEL','children',array_to_string(children,','),'caption',p_item.caption))->>'id';
 elsif p_item.kind='historia' then
  creation:=public.fitness_social_ig('POST',s.ig_user_id||'/media',base||jsonb_build_object('media_type','STORIES','image_url',urls[1]))->>'id';
 else
  creation:=public.fitness_social_ig('POST',s.ig_user_id||'/media',base||jsonb_build_object('image_url',urls[1],'caption',p_item.caption))->>'id';
 end if;
 perform public.fitness_social_wait(creation,tok);
 pub:=public.fitness_social_ig('POST',s.ig_user_id||'/media_publish',base||jsonb_build_object('creation_id',creation));
 begin perm:=public.fitness_social_ig('GET',pub->>'id',base||jsonb_build_object('fields','permalink'))->>'permalink'; exception when others then perm:=null; end;
 return jsonb_build_object('ok',true,'id',pub->>'id','permalink',perm);
exception when others then
 return jsonb_build_object('ok',false,'error',left(sqlerrm,500));
end $$;

-- Un paso: toma la próxima pieza que ya tocaba y la publica.
create or replace function public.fitness_social_step() returns jsonb language plpgsql security definer set search_path='' as $$
declare it public.fitness_social_queue; r jsonb;
begin
 select * into it from public.fitness_social_queue where status='pendiente' and scheduled_at<=now() order by scheduled_at limit 1 for update skip locked;
 if it.id is null then return jsonb_build_object('done',true); end if;
 update public.fitness_social_queue set status='publicando',attempts=attempts+1 where id=it.id;
 r:=public.fitness_social_publish(it);
 if (r->>'ok')::boolean then
  update public.fitness_social_queue set status='publicado',ig_media_id=r->>'id',permalink=r->>'permalink',published_at=now(),error=null where id=it.id;
 else
  update public.fitness_social_queue set status=case when it.attempts+1>=3 then 'error' else 'pendiente' end,error=r->>'error' where id=it.id;
 end if;
 return jsonb_build_object('done',false,'id',it.id)||r;
end $$;

-- Antes de publicar: marca lo muy atrasado y renueva la llave cuando falta poco para que venza (una vez por hora).
create or replace function public.fitness_social_prepare() returns text language plpgsql security definer set search_path='' as $$
declare s public.fitness_social_settings; tok text; r jsonb; sid uuid;
begin
 select * into s from public.fitness_social_settings where id;
 tok:=public.fitness_social_token();
 if tok is null then return 'sin conectar'; end if;
 if s.paused then update public.fitness_social_settings set last_run_at=now() where id; return 'pausa'; end if;
 update public.fitness_social_queue set status='vencido',error='No se publicó a tiempo (más de 3 horas de atraso)' where status='pendiente' and scheduled_at<now()-interval '3 hours';
 if (s.token_expires_at is null or s.token_expires_at<now()+interval '15 days') and extract(minute from now())<5 then
  begin
   r:=public.fitness_social_ig('GET','refresh_access_token',jsonb_build_object('grant_type','ig_refresh_token','access_token',tok));
   if r ? 'access_token' then
    select id into sid from vault.secrets where name='nexofit_ig_token';
    perform vault.update_secret(sid,r->>'access_token');
    update public.fitness_social_settings set token_expires_at=now()+make_interval(secs=>coalesce((r->>'expires_in')::int,5184000)) where id;
   end if;
  exception when others then null; -- una llave de menos de 24 horas todavía no se puede renovar
  end;
 end if;
 return 'ok';
end $$;

-- Lo que corre cada 5 minutos. Guarda después de cada pieza, así una falla no repite publicaciones.
-- Sin SECURITY DEFINER: un procedimiento así no puede hacer COMMIT. Lo ejecuta pg_cron como postgres.
create or replace procedure public.fitness_social_run() language plpgsql as $$
declare st text; r jsonb; errs int:=0;
begin
 if not pg_try_advisory_lock(4815162342) then return; end if;
 st:=public.fitness_social_prepare();
 commit;
 if st='ok' then
  for i in 1..3 loop
   r:=public.fitness_social_step();
   commit;
   exit when (r->>'done')::boolean;
   if not (r->>'ok')::boolean then errs:=errs+1; end if;
  end loop;
  update public.fitness_social_settings set last_run_at=now(),last_error=case when errs>0 then 'Hubo errores al publicar. Revisá la lista.' else null end where id;
  commit;
 end if;
 perform pg_advisory_unlock(4815162342);
end $$;

-- Panel: el administrador pega la llave. Se valida con Instagram y se guarda cifrada.
create or replace function public.fitness_social_set_token(p_token text) returns jsonb language plpgsql security definer set search_path='' as $$
declare me jsonb; sid uuid; tok text:=btrim(coalesce(p_token,''));
begin
 if not public.fitness_social_is_admin() then raise exception 'No autorizado'; end if;
 if length(tok)<20 or tok ~ '\s' then raise exception 'La llave no parece válida. Copiala completa desde Meta.'; end if;
 begin me:=public.fitness_social_ig('GET','me',jsonb_build_object('fields','user_id,username','access_token',tok));
 exception when others then raise exception 'Instagram no aceptó la llave: %',replace(sqlerrm,'Instagram: ',''); end;
 select id into sid from vault.secrets where name='nexofit_ig_token';
 if sid is null then perform vault.create_secret(tok,'nexofit_ig_token','Llave de Instagram de Nexo Fit');
 else perform vault.update_secret(sid,tok); end if;
 update public.fitness_social_settings set ig_user_id=coalesce(me->>'user_id',me->>'id'),ig_username=me->>'username',token_sealed='vault',token_expires_at=null,last_error=null,updated_at=now() where id;
 return jsonb_build_object('connected',true,'username',me->>'username');
end $$;

create or replace function public.fitness_social_test() returns jsonb language plpgsql security definer set search_path='' as $$
declare me jsonb; tok text;
begin
 if not public.fitness_social_is_admin() then raise exception 'No autorizado'; end if;
 tok:=public.fitness_social_token();
 if tok is null then return jsonb_build_object('connected',false,'error','Todavía no cargaste la llave de Instagram.'); end if;
 me:=public.fitness_social_ig('GET','me',jsonb_build_object('fields','user_id,username','access_token',tok));
 update public.fitness_social_settings set ig_username=me->>'username' where id;
 return jsonb_build_object('connected',true,'username',me->>'username');
exception when others then return jsonb_build_object('connected',false,'error',sqlerrm);
end $$;

revoke all on function public.fitness_social_token(), public.fitness_social_ig(text,text,jsonb), public.fitness_social_wait(text,text),
 public.fitness_social_publish(public.fitness_social_queue), public.fitness_social_step(), public.fitness_social_prepare(), public.fitness_social_is_admin() from public, anon, authenticated;
revoke all on procedure public.fitness_social_run() from public, anon, authenticated;
revoke all on function public.fitness_social_set_token(text), public.fitness_social_test() from public, anon;
grant execute on function public.fitness_social_set_token(text), public.fitness_social_test() to authenticated;

select cron.schedule('nexofit-instagram','*/5 * * * *','call public.fitness_social_run()');

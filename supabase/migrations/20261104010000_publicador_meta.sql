-- Publicador de Meta: una sola llave para Instagram y Facebook, vinculada a la cuenta de Business Suite.
-- Suma Facebook y Reels a la cola. La llave de Instagram anterior sigue funcionando solo para Instagram.
-- Solo agrega: red y formato son columnas nuevas. En Facebook, la etiqueta lleva " · Facebook" para no chocar con la de Instagram.
alter table public.fitness_social_queue add column if not exists red text not null default 'instagram' check (red in ('instagram','facebook'));
alter table public.fitness_social_queue add column if not exists formato text check (formato in ('reel'));
alter table public.fitness_social_settings add column if not exists fb_page_id text;
alter table public.fitness_social_settings add column if not exists fb_page_name text;

create or replace function public.fitness_social_ig(p_method text, p_path text, p_params jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare u text; r extensions.http_response; d jsonb;
begin
 if p_path ~ '^https://graph\.(facebook|instagram)\.com/' then u:=p_path;
 else select rtrim(api_base,'/')||'/'||p_path into u from public.fitness_social_settings where id; end if;
 perform extensions.http_set_curlopt('CURLOPT_TIMEOUT','60');
 if p_method='GET' then r:=extensions.http_get(u,p_params); else r:=extensions.http_post(u,p_params); end if;
 begin d:=r.content::jsonb; exception when others then d:=null; end;
 if r.status>=400 or d is null or d ? 'error' then
  raise exception 'Meta: %',coalesce(d->'error'->>'message','error '||r.status);
 end if;
 return d;
end $$;

create or replace function public.fitness_social_esperar(p_id text, p_token text, p_intentos integer default 10) returns void language plpgsql security definer set search_path='' as $$
declare st text;
begin
 for i in 1..p_intentos loop
  st:=coalesce(public.fitness_social_ig('GET',p_id,jsonb_build_object('fields','status_code','access_token',p_token))->>'status_code','FINISHED');
  if st in ('FINISHED','PUBLISHED') then return; end if;
  if st in ('ERROR','EXPIRED') then raise exception 'Meta no pudo procesar el archivo (%)',st; end if;
  perform pg_sleep(3);
 end loop;
 raise exception 'Meta tardó demasiado en procesar el archivo';
end $$;

create or replace function public.fitness_social_publish(p_item public.fitness_social_queue) returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.fitness_social_settings; tok text; urls text[]; children text[]:='{}'; m text; creation text; pub jsonb; perm text; base jsonb; idp text; foto text;
begin
 select * into s from public.fitness_social_settings where id;
 tok:=public.fitness_social_token();
 select array_agg(case when v ~ '^https://' then v else rtrim(s.site_url,'/')||'/'||ltrim(v,'/') end order by o) into urls from jsonb_array_elements_text(p_item.media) with ordinality t(v,o);
 if urls is null then raise exception 'La publicación no tiene archivos'; end if;
 base:=jsonb_build_object('access_token',tok);
 if p_item.red='facebook' then
  if s.fb_page_id is null then raise exception 'Facebook no está conectado'; end if;
  if p_item.formato='reel' then
   pub:=public.fitness_social_ig('POST',s.fb_page_id||'/videos',base||jsonb_build_object('file_url',urls[1],'description',p_item.caption,'title',left(p_item.label,100)));
  elsif p_item.kind='historia' then
   foto:=public.fitness_social_ig('POST',s.fb_page_id||'/photos',base||jsonb_build_object('url',urls[1],'published','false'))->>'id';
   pub:=public.fitness_social_ig('POST',s.fb_page_id||'/photo_stories',base||jsonb_build_object('photo_id',foto));
  elsif p_item.kind='carrusel' then
   foreach m in array urls loop
    foto:=public.fitness_social_ig('POST',s.fb_page_id||'/photos',base||jsonb_build_object('url',m,'published','false'))->>'id';
    children:=children||jsonb_build_object('media_fbid',foto)::text;
   end loop;
   pub:=public.fitness_social_ig('POST',s.fb_page_id||'/feed',base||jsonb_build_object('message',p_item.caption,'attached_media','['||array_to_string(children,',')||']'));
  else
   pub:=public.fitness_social_ig('POST',s.fb_page_id||'/photos',base||jsonb_build_object('url',urls[1],'caption',p_item.caption));
  end if;
  idp:=coalesce(pub->>'post_id',pub->>'id');
  begin perm:=public.fitness_social_ig('GET',idp,base||jsonb_build_object('fields','permalink_url'))->>'permalink_url'; exception when others then perm:=null; end;
  return jsonb_build_object('ok',true,'id',idp,'permalink',perm);
 end if;
 if s.ig_user_id is null then raise exception 'Instagram no está conectado'; end if;
 if p_item.kind='carrusel' then
  foreach m in array urls loop
   children:=children||(public.fitness_social_ig('POST',s.ig_user_id||'/media',base||jsonb_build_object('image_url',m,'is_carousel_item','true'))->>'id');
  end loop;
  foreach m in array children loop perform public.fitness_social_esperar(m,tok); end loop;
  creation:=public.fitness_social_ig('POST',s.ig_user_id||'/media',base||jsonb_build_object('media_type','CAROUSEL','children',array_to_string(children,','),'caption',p_item.caption))->>'id';
 elsif p_item.kind='historia' then
  creation:=public.fitness_social_ig('POST',s.ig_user_id||'/media',base||jsonb_build_object('media_type','STORIES','image_url',urls[1]))->>'id';
 elsif p_item.formato='reel' then
  creation:=public.fitness_social_ig('POST',s.ig_user_id||'/media',base||jsonb_build_object('media_type','REELS','video_url',urls[1],'caption',p_item.caption,'share_to_feed','true'))->>'id';
 else
  creation:=public.fitness_social_ig('POST',s.ig_user_id||'/media',base||jsonb_build_object('image_url',urls[1],'caption',p_item.caption))->>'id';
 end if;
 perform public.fitness_social_esperar(creation,tok,case when p_item.formato='reel' then 40 else 10 end);
 pub:=public.fitness_social_ig('POST',s.ig_user_id||'/media_publish',base||jsonb_build_object('creation_id',creation));
 begin perm:=public.fitness_social_ig('GET',pub->>'id',base||jsonb_build_object('fields','permalink'))->>'permalink'; exception when others then perm:=null; end;
 return jsonb_build_object('ok',true,'id',pub->>'id','permalink',perm);
exception when others then
 return jsonb_build_object('ok',false,'error',left(sqlerrm,500));
end $$;

-- La renovación automática aplica solo a la llave de Instagram: la de una página de Meta no vence.
create or replace function public.fitness_social_prepare() returns text language plpgsql security definer set search_path='' as $$
declare s public.fitness_social_settings; tok text; r jsonb; sid uuid;
begin
 select * into s from public.fitness_social_settings where id;
 tok:=public.fitness_social_token();
 if tok is null then return 'sin conectar'; end if;
 if s.paused then update public.fitness_social_settings set last_run_at=now() where id; return 'pausa'; end if;
 update public.fitness_social_queue set status='vencido',error='No se publicó a tiempo (más de 3 horas de atraso)' where status='pendiente' and scheduled_at<now()-interval '3 hours';
 if s.api_base like '%graph.instagram.com%' and (s.token_expires_at is null or s.token_expires_at<now()+interval '15 days') and extract(minute from now())<5 then
  begin
   r:=public.fitness_social_ig('GET','refresh_access_token',jsonb_build_object('grant_type','ig_refresh_token','access_token',tok));
   if r ? 'access_token' then
    select id into sid from vault.secrets where name='nexofit_ig_token';
    perform vault.update_secret(sid,r->>'access_token');
    update public.fitness_social_settings set token_expires_at=now()+make_interval(secs=>coalesce((r->>'expires_in')::int,5184000)) where id;
   end if;
  exception when others then null;
  end;
 end if;
 return 'ok';
end $$;

create or replace function public.fitness_social_step() returns jsonb language plpgsql security definer set search_path='' as $$
declare it public.fitness_social_queue; r jsonb;
begin
 select q.* into it from public.fitness_social_queue q, public.fitness_social_settings s
  where s.id and q.status='pendiente' and q.scheduled_at<=now() and (q.red='instagram' or s.fb_page_id is not null)
  order by q.scheduled_at limit 1 for update of q skip locked;
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

-- Acepta la llave de Meta (de usuario o de página) o, como antes, la de Instagram.
create or replace function public.fitness_social_set_token(p_token text) returns jsonb language plpgsql security definer set search_path='' as $$
declare fb constant text:='https://graph.facebook.com/v23.0'; me jsonb; cuentas jsonb; pag jsonb; sid uuid; tok text:=btrim(coalesce(p_token,'')); guardar text;
begin
 if not public.fitness_social_is_admin() then raise exception 'No autorizado'; end if;
 if length(tok)<20 or tok ~ '\s' then raise exception 'La llave no parece válida. Copiala completa desde Meta.'; end if;
 if tok !~ '^IG' then
  begin cuentas:=public.fitness_social_ig('GET',fb||'/me/accounts',jsonb_build_object('fields','id,name,access_token,instagram_business_account{id,username}','limit','50','access_token',tok));
  exception when others then cuentas:=null; end;
  if cuentas is not null and jsonb_typeof(cuentas->'data')='array' and jsonb_array_length(cuentas->'data')>0 then
   select e into pag from jsonb_array_elements(cuentas->'data') e order by (e->>'name' ilike '%nexo%') desc, (e ? 'instagram_business_account') desc limit 1;
  else
   begin me:=public.fitness_social_ig('GET',fb||'/me',jsonb_build_object('fields','id,name,instagram_business_account{id,username}','access_token',tok));
    if me ? 'instagram_business_account' then pag:=me||jsonb_build_object('access_token',tok); end if;
   exception when others then pag:=null; end;
  end if;
  if pag is null then raise exception 'Meta no aceptó la llave o no ve ninguna página. Revisá los permisos y probá de nuevo.'; end if;
  if not pag ? 'instagram_business_account' then raise exception 'La página % no tiene Instagram vinculado. Vinculalo en Business Suite y probá de nuevo.',pag->>'name'; end if;
  guardar:=pag->>'access_token';
  update public.fitness_social_settings set api_base=fb,fb_page_id=pag->>'id',fb_page_name=pag->>'name',ig_user_id=pag->'instagram_business_account'->>'id',ig_username=pag->'instagram_business_account'->>'username',token_sealed='vault',token_expires_at=null,last_error=null,updated_at=now() where id;
 else
  begin me:=public.fitness_social_ig('GET','https://graph.instagram.com/me',jsonb_build_object('fields','user_id,username','access_token',tok));
  exception when others then raise exception 'Instagram no aceptó la llave: %',replace(sqlerrm,'Meta: ',''); end;
  guardar:=tok;
  update public.fitness_social_settings set api_base='https://graph.instagram.com',fb_page_id=null,fb_page_name=null,ig_user_id=coalesce(me->>'user_id',me->>'id'),ig_username=me->>'username',token_sealed='vault',token_expires_at=null,last_error=null,updated_at=now() where id;
 end if;
 select id into sid from vault.secrets where name='nexofit_ig_token';
 if sid is null then perform vault.create_secret(guardar,'nexofit_ig_token','Llave de Meta de Nexo Fit');
 else perform vault.update_secret(sid,guardar); end if;
 return (select jsonb_build_object('connected',true,'username',ig_username,'page',fb_page_name) from public.fitness_social_settings where id);
end $$;

create or replace function public.fitness_social_test() returns jsonb language plpgsql security definer set search_path='' as $$
declare me jsonb; tok text; s public.fitness_social_settings;
begin
 if not public.fitness_social_is_admin() then raise exception 'No autorizado'; end if;
 tok:=public.fitness_social_token();
 select * into s from public.fitness_social_settings where id;
 if tok is null then return jsonb_build_object('connected',false,'error','Todavía no cargaste la llave de Meta.'); end if;
 if s.fb_page_id is not null then
  me:=public.fitness_social_ig('GET',s.fb_page_id,jsonb_build_object('fields','id,name','access_token',tok));
  me:=public.fitness_social_ig('GET',s.ig_user_id,jsonb_build_object('fields','username','access_token',tok));
 else
  me:=public.fitness_social_ig('GET','me',jsonb_build_object('fields','user_id,username','access_token',tok));
 end if;
 update public.fitness_social_settings set ig_username=me->>'username' where id;
 return jsonb_build_object('connected',true,'username',me->>'username','page',s.fb_page_name);
exception when others then return jsonb_build_object('connected',false,'error',sqlerrm);
end $$;

create or replace function public.fitness_social_admin() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.fitness_profiles where id=auth.uid() and role='admin' and not blocked) then raise exception 'No autorizado'; end if;
 return jsonb_build_object(
  'settings',(select jsonb_build_object('paused',paused,'username',ig_username,'page',fb_page_name,'connected',token_sealed is not null,'tokenExpiresAt',token_expires_at,'lastRunAt',last_run_at,'lastError',last_error) from public.fitness_social_settings where id),
  'queue',coalesce((select jsonb_agg(to_jsonb(q)-'media'||jsonb_build_object('media',q.media) order by q.scheduled_at) from public.fitness_social_queue q where q.scheduled_at>now()-interval '3 days' or q.status in ('error','pendiente')),'[]'));
end $$;

revoke all on function public.fitness_social_ig(text,text,jsonb), public.fitness_social_esperar(text,text,integer),
 public.fitness_social_publish(public.fitness_social_queue), public.fitness_social_step(), public.fitness_social_prepare() from public, anon, authenticated;
revoke all on function public.fitness_social_set_token(text), public.fitness_social_test(), public.fitness_social_admin() from public, anon;
grant execute on function public.fitness_social_set_token(text), public.fitness_social_test(), public.fitness_social_admin() to authenticated;

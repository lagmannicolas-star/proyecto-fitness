-- Avisos al celular del administrador por notificación push (ntfy.sh), sin cuentas ni llaves.
-- El administrador instala la app ntfy y se suscribe a un tema privado (nombre aleatorio).
-- Por privacidad, la notificación nunca lleva emails ni teléfonos: solo el resumen y el enlace al panel.
begin;

alter table public.fitness_avisos_config add column if not exists push_topic text check (push_topic ~ '^[A-Za-z0-9_-]{12,64}$');
alter table public.fitness_avisos drop constraint if exists fitness_avisos_canal_check;
alter table public.fitness_avisos add constraint fitness_avisos_canal_check check (canal in ('email','whatsapp','push'));

create or replace function public.fitness_aviso_encolar(p_tipo text, p_code text, p_admin_asunto text, p_admin_texto text,
 p_comprador text, p_comp_asunto text, p_comp_texto text, p_comp_html text) returns void
language plpgsql security definer set search_path='' as $$
declare c public.fitness_avisos_config; has_mail boolean; has_wa boolean; corto text;
begin
 select * into c from public.fitness_avisos_config where id;
 has_mail := public.fitness_aviso_secreto('nexofit_resend_key') is not null;
 has_wa := public.fitness_aviso_secreto('nexofit_callmebot_key') is not null;
 if p_admin_texto is not null and has_mail and c.admin_email is not null then
  insert into public.fitness_avisos(tipo,canal,destino,asunto,texto,html,solicitud_code)
  values(p_tipo,'email',c.admin_email,p_admin_asunto,p_admin_texto,
   public.fitness_aviso_email_html(p_admin_asunto,'<p style="white-space:pre-line;line-height:1.5">'||public.fitness_html(p_admin_texto)||'</p>','Abrir el panel',c.site_url||'/admin.html'),p_code);
 end if;
 if p_admin_texto is not null and has_wa and c.admin_whatsapp is not null then
  insert into public.fitness_avisos(tipo,canal,destino,asunto,texto,solicitud_code)
  values(p_tipo,'whatsapp',c.admin_whatsapp,p_admin_asunto,'*'||p_admin_asunto||'*'||chr(10)||p_admin_texto,p_code);
 end if;
 if p_admin_texto is not null and c.push_topic is not null then
  -- Sin datos de contacto: se quitan las líneas con emails, teléfonos o datos del comprador.
  select string_agg(l, chr(10)) into corto from regexp_split_to_table(p_admin_texto, chr(10)) l
   where l !~* '(@|whatsapp|tel[eé]fono|comprador:|contacto:|cuit)' and btrim(l)<>'';
  insert into public.fitness_avisos(tipo,canal,destino,asunto,texto,solicitud_code)
  values(p_tipo,'push',c.push_topic,p_admin_asunto,left(coalesce(corto,'Abrí el panel para ver el detalle.'),900),p_code);
 end if;
 if p_comprador is not null and p_comp_texto is not null and has_mail and c.comprador_email and c.email_from not ilike '%@resend.dev%' then
  insert into public.fitness_avisos(tipo,canal,destino,asunto,texto,html,solicitud_code)
  values(p_tipo||'_comprador','email',p_comprador,p_comp_asunto,p_comp_texto,p_comp_html,p_code);
 end if;
end $$;

create or replace function public.fitness_aviso_enviar(p_id bigint) returns text
language plpgsql security definer set search_path='' as $$
declare a public.fitness_avisos; c public.fitness_avisos_config; k text; r extensions.http_response; d jsonb; err text;
begin
 select * into a from public.fitness_avisos where id=p_id for update;
 if not found or a.estado='enviado' then return 'ok'; end if;
 select * into c from public.fitness_avisos_config where id;
 perform extensions.http_set_curlopt('CURLOPT_TIMEOUT','20');
 begin
  if a.canal='email' then
   k := public.fitness_aviso_secreto('nexofit_resend_key');
   if k is null then raise exception 'Falta la llave de Resend'; end if;
   r := extensions.http(('POST','https://api.resend.com/emails',
     array[extensions.http_header('Authorization','Bearer '||k)],'application/json',
     jsonb_build_object('from',c.email_from,'to',jsonb_build_array(a.destino),'subject',a.asunto,'text',a.texto,'html',a.html)::text)::extensions.http_request);
   begin d := r.content::jsonb; exception when others then d := null; end;
   if r.status >= 400 then raise exception 'Resend: %', coalesce(d->>'message', 'error '||r.status); end if;
  elsif a.canal='push' then
   r := extensions.http(('POST','https://ntfy.sh/',array[]::extensions.http_header[],'application/json',
     jsonb_build_object('topic',a.destino,'title',coalesce(a.asunto,'Nexo Fit'),'message',a.texto,
       'click',c.site_url||'/admin.html','tags',jsonb_build_array('bell'),
       'priority',case when a.tipo in ('solicitud_nueva','oferta_elegida') then 4 else 3 end)::text)::extensions.http_request);
   if r.status >= 400 then raise exception 'ntfy: error %', r.status; end if;
  else
   k := public.fitness_aviso_secreto('nexofit_callmebot_key');
   if k is null then raise exception 'Falta la llave de CallMeBot'; end if;
   r := extensions.http_get('https://api.callmebot.com/whatsapp.php?phone='||extensions.urlencode('+'||a.destino)
     ||'&text='||extensions.urlencode(left(a.texto,1500))||'&apikey='||extensions.urlencode(k));
   if r.status >= 400 or r.content ilike '%apikey is invalid%' or r.content ilike '%error%' then
    raise exception 'CallMeBot: %', left(regexp_replace(coalesce(r.content,'error '||r.status),'<[^>]*>','','g'),200);
   end if;
  end if;
  update public.fitness_avisos set estado='enviado', sent_at=now(), intentos=intentos+1, error=null where id=a.id;
  return 'ok';
 exception when others then
  err := left(sqlerrm,300);
  update public.fitness_avisos set intentos=intentos+1, error=err, estado=case when intentos+1>=5 then 'error' else 'pendiente' end where id=a.id;
  return err;
 end;
end $$;

revoke all on function public.fitness_aviso_encolar(text,text,text,text,text,text,text,text), public.fitness_aviso_enviar(bigint) from public,anon,authenticated;
commit;

-- El panel de avisos muestra si el canal de celular (ntfy) está activo.
create or replace function public.fitness_avisos_admin() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare c public.fitness_avisos_config;
begin
 if not public.fitness_es_admin() then raise exception 'No autorizado'; end if;
 select * into c from public.fitness_avisos_config where id;
 return jsonb_build_object('admin_email',c.admin_email,'admin_whatsapp',c.admin_whatsapp,'email_from',c.email_from,'comprador_email',c.comprador_email,
  'resend',public.fitness_aviso_secreto('nexofit_resend_key') is not null,'callmebot',public.fitness_aviso_secreto('nexofit_callmebot_key') is not null,
  'push',c.push_topic is not null,
  'avisos',(select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'tipo',a.tipo,'canal',a.canal,'destino',case when a.canal='push' then 'Tu celular' else a.destino end,'asunto',a.asunto,'estado',a.estado,
    'error',a.error,'intentos',a.intentos,'creado',a.created_at,'enviado',a.sent_at) order by a.id desc),'[]')
   from (select * from public.fitness_avisos order by id desc limit 30) a));
end $$;

-- Recordatorios automáticos de "Pedí ofertas" (corren con la cola de avisos, cada minuto, y son idempotentes):
-- 1) Comprador: si llegaron ofertas nuevas después de la primera, un resumen como máximo cada 20 horas.
-- 2) Proveedor: si a las 36 horas del aviso no ofertó y el pedido sigue abierto, un único recordatorio.
-- 3) Proveedor: dos días antes de que venza su oferta (pedido abierto, sin elegir), aviso para extenderla.
-- 4) Pedido vencido (30 días sin movimiento): aviso al comprador y a los que ofertaron.
-- Ninguno toca updated_at de la solicitud (eso movería el vencimiento). Solo salen con email activo y dominio propio.
begin;

alter table public.fitness_solicitudes add column if not exists aviso_ofertas_n int not null default 1;
alter table public.fitness_solicitudes add column if not exists aviso_ofertas_at timestamptz;
alter table public.fitness_solicitudes add column if not exists vencida_avisada_at timestamptz;
alter table public.fitness_invitaciones add column if not exists recordado_at timestamptz;
alter table public.fitness_ofertas_solicitud add column if not exists aviso_vence_at timestamptz;

create or replace function public.fitness_avisos_recordatorios() returns integer
language plpgsql security definer set search_path='' as $$
declare c public.fitness_avisos_config; x record; n integer := 0; site text; lista text; it jsonb; link text;
begin
 select * into c from public.fitness_avisos_config where id;
 if public.fitness_aviso_secreto('nexofit_resend_key') is null or c.email_from ilike '%@resend.dev%' then return 0; end if;
 site := c.site_url;

 -- 1) Comprador: resumen de ofertas nuevas.
 if c.comprador_email then
  for x in
   select s.code, s.nombre, s.email, s.aviso_ofertas_n, (select count(*) from public.fitness_ofertas_solicitud o join public.fitness_invitaciones i on i.id=o.invitacion_id where i.solicitud_code=s.code) total
   from public.fitness_solicitudes s
   where s.status='con_ofertas' and public.fitness_sol_estado(s.status,s.updated_at)='con_ofertas'
     and coalesce(s.aviso_ofertas_at, s.created_at) < now()-interval '20 hours'
   for update of s skip locked
  loop
   continue when x.total <= x.aviso_ofertas_n;
   link := site||'/mi-solicitud.html?codigo='||x.code;
   perform public.fitness_aviso_mail('ofertas_nuevas_comprador',x.code,x.email,
    'Ya tenés '||x.total||' ofertas para tu solicitud '||x.code,
    'Hola '||x.nombre||', ya tenés '||x.total||' ofertas para tu solicitud '||x.code||'. Entrá a verlas comparadas, con nuestra recomendación, en '||link||'. Pedir ofertas no te compromete a comprar.',
    public.fitness_aviso_email_html('Ya tenés '||x.total||' ofertas',
     '<p style="line-height:1.5">Hola '||public.fitness_html(x.nombre)||', ya tenés <b>'||x.total||' ofertas</b> para tu solicitud <b>'||x.code||'</b>.</p>'
     ||'<p style="line-height:1.5">Entrá a verlas comparadas, con nuestra recomendación. Tené en cuenta que cada oferta vale hasta la fecha que puso el proveedor. Pedir ofertas no te compromete a comprar.</p>',
     'Ver las ofertas',link));
   update public.fitness_solicitudes set aviso_ofertas_n=x.total, aviso_ofertas_at=now() where code=x.code;
   n := n+1;
  end loop;
 end if;

 -- 2) Proveedor: recordatorio único si no ofertó.
 for x in
  select i.id, i.token, r.nombre, r.email, s.code, s.items, s.localidad, s.provincia
  from public.fitness_invitaciones i
  join public.fitness_red_proveedores r on r.id=i.proveedor_id
  join public.fitness_solicitudes s on s.code=i.solicitud_code
  where i.avisado_at < now()-interval '36 hours' and i.recordado_at is null and r.activo
    and s.status in ('nueva','enviada','con_ofertas') and public.fitness_sol_estado(s.status,s.updated_at) in ('nueva','enviada','con_ofertas')
    and s.created_at > now()-interval '10 days'
    and not exists (select 1 from public.fitness_ofertas_solicitud o where o.invitacion_id=i.id)
  order by i.id limit 50 for update of i skip locked
 loop
  lista := '';
  for it in select * from jsonb_array_elements(coalesce(x.items,'[]'::jsonb)) loop
   lista := lista||'• '||coalesce(it->>'cantidad','')||' × '||coalesce(it->>'producto','')||chr(10);
  end loop;
  link := site||'/oferta.html#t='||x.token;
  perform public.fitness_aviso_mail('recordatorio_proveedor',x.code,x.email,
   'Sigue abierto: pedido de ofertas '||x.code||' · '||coalesce(x.localidad,'')||', '||coalesce(x.provincia,''),
   'Hola, equipo de '||x.nombre||'. El pedido '||x.code||' ('||coalesce(x.localidad,'')||', '||coalesce(x.provincia,'')||') sigue abierto y todavía no recibió su oferta:'||chr(10)||lista
    ||'Si les interesa, carguen su oferta desde su link privado: '||link||chr(10)||'Si no les interesa, no hace falta responder.',
   public.fitness_aviso_email_html('El pedido '||x.code||' sigue abierto',
    '<p style="line-height:1.5">Hola, equipo de '||public.fitness_html(x.nombre)||'. El pedido <b>'||x.code||'</b> ('||public.fitness_html(coalesce(x.localidad,'')||', '||coalesce(x.provincia,''))||') sigue abierto y todavía no recibió su oferta:</p>'
    ||'<p style="white-space:pre-line;line-height:1.5">'||public.fitness_html(lista)||'</p>'
    ||'<p style="line-height:1.5">Si les interesa, carguen su oferta desde su link privado. Si no, no hace falta responder.</p>',
    'Ver el pedido y ofertar',link));
  update public.fitness_invitaciones set recordado_at=now() where id=x.id;
  n := n+1;
 end loop;

 -- 3) Proveedor: su oferta vence en 2 días y el pedido sigue abierto.
 for x in
  select o.id, o.valida_hasta, i.token, r.nombre, r.email, s.code
  from public.fitness_ofertas_solicitud o
  join public.fitness_invitaciones i on i.id=o.invitacion_id
  join public.fitness_red_proveedores r on r.id=i.proveedor_id
  join public.fitness_solicitudes s on s.code=i.solicitud_code
  where o.aviso_vence_at is null and o.valida_hasta between current_date and current_date+2
    and s.status in ('nueva','enviada','con_ofertas') and public.fitness_sol_estado(s.status,s.updated_at) in ('nueva','enviada','con_ofertas')
  order by o.id limit 50 for update of o skip locked
 loop
  link := site||'/oferta.html#t='||x.token;
  perform public.fitness_aviso_mail('oferta_por_vencer',x.code,x.email,
   'Su oferta para '||x.code||' vence el '||to_char(x.valida_hasta,'DD/MM'),
   'Hola, equipo de '||x.nombre||'. Su oferta para el pedido '||x.code||' vale hasta el '||to_char(x.valida_hasta,'DD/MM/YYYY')||' y el comprador todavía no eligió. Si quieren seguir participando, extiendan la validez (o ajusten la oferta) desde su link privado: '||link,
   public.fitness_aviso_email_html('Su oferta vence el '||to_char(x.valida_hasta,'DD/MM'),
    '<p style="line-height:1.5">Hola, equipo de '||public.fitness_html(x.nombre)||'. Su oferta para el pedido <b>'||x.code||'</b> vale hasta el <b>'||to_char(x.valida_hasta,'DD/MM/YYYY')||'</b> y el comprador todavía no eligió.</p>'
    ||'<p style="line-height:1.5">Si quieren seguir participando, extiendan la validez (o ajusten la oferta) desde su link privado. Una oferta vencida no se puede elegir.</p>',
    'Extender mi oferta',link));
  update public.fitness_ofertas_solicitud set aviso_vence_at=now() where id=x.id;
  n := n+1;
 end loop;

 -- 4) Pedido vencido: al comprador y a los que ofertaron.
 for x in
  select s.code, s.nombre, s.email, s.localidad, s.provincia from public.fitness_solicitudes s
  where s.vencida_avisada_at is null and public.fitness_sol_estado(s.status,s.updated_at)='vencida'
    and s.updated_at > now()-interval '45 days'
  for update of s skip locked
 loop
  if c.comprador_email then
   perform public.fitness_aviso_mail('solicitud_vencida_comprador',x.code,x.email,
    'Tu solicitud '||x.code||' venció',
    'Hola '||x.nombre||', tu solicitud '||x.code||' pasó 30 días sin movimiento y venció. Si todavía necesitás el equipamiento, podés pedir ofertas de nuevo en '||site||'/solicitud.html',
    public.fitness_aviso_email_html('Tu solicitud '||x.code||' venció',
     '<p style="line-height:1.5">Hola '||public.fitness_html(x.nombre)||', tu solicitud <b>'||x.code||'</b> pasó 30 días sin movimiento y venció.</p>'
     ||'<p style="line-height:1.5">Si todavía necesitás el equipamiento, podés pedir ofertas de nuevo: lleva un par de minutos.</p>',
     'Pedir ofertas de nuevo',site||'/solicitud.html'));
  end if;
  perform public.fitness_aviso_mail('pedido_cerrado_proveedor',x.code,r.email,
    'Pedido cerrado sin elegir oferta · '||x.code,
    'Hola, equipo de '||r.nombre||'. El pedido '||x.code||' ('||x.localidad||', '||x.provincia||') venció sin que el comprador eligiera una oferta. Gracias por ofertar: les vamos a seguir enviando los pedidos de su rubro.',
    public.fitness_aviso_email_html('Pedido cerrado sin elegir oferta',
     '<p style="line-height:1.5">Hola, equipo de '||public.fitness_html(r.nombre)||'. El pedido <b>'||x.code||'</b> ('||public.fitness_html(x.localidad||', '||x.provincia)||') venció sin que el comprador eligiera una oferta.</p>'
     ||'<p style="line-height:1.5">Gracias por ofertar: les vamos a seguir enviando los pedidos de su rubro.</p>',
     'Ir a Nexo Fit',site))
  from public.fitness_ofertas_solicitud o join public.fitness_invitaciones i on i.id=o.invitacion_id join public.fitness_red_proveedores r on r.id=i.proveedor_id
  where i.solicitud_code=x.code;
  update public.fitness_solicitudes set vencida_avisada_at=now() where code=x.code;
  n := n+1;
 end loop;
 return n;
end $$;

-- La cola de avisos suma los recordatorios; si algo falla, igual envía el resto.
create or replace procedure public.fitness_avisos_run()
language plpgsql as $$
declare v_id bigint;
begin
 if not pg_try_advisory_lock(271828182) then return; end if;
 begin
  perform public.fitness_avisar_invitaciones();
 exception when others then
  raise warning 'avisos a proveedores: %', sqlerrm;
 end;
 begin
  perform public.fitness_avisos_recordatorios();
 exception when others then
  raise warning 'recordatorios: %', sqlerrm;
 end;
 commit;
 for v_id in select id from public.fitness_avisos where estado='pendiente' and created_at > now()-interval '2 days' order by id limit 20 loop
  perform public.fitness_aviso_enviar(v_id);
  commit;
 end loop;
 perform pg_advisory_unlock(271828182);
end $$;

revoke all on function public.fitness_avisos_recordatorios() from public, anon, authenticated;
commit;

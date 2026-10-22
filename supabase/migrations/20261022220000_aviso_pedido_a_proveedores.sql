-- Cada proveedor de la red recibe solo un email cuando le llega un pedido de ofertas, con su link privado.
-- Se envía desde la base (cola de avisos, cada minuto) recién cuando Resend tiene llave y remitente con dominio propio:
-- con el remitente de prueba (@resend.dev) Resend solo entrega al dueño de la cuenta.
-- Las invitaciones sin aviso (avisado_at vacío) de pedidos abiertos se avisan en cuanto el email queda activo.
-- El email nunca lleva datos del comprador: solo productos, tipo de espacio, localidad y plazo.
begin;

alter table public.fitness_invitaciones add column if not exists avisado_at timestamptz;

create or replace function public.fitness_avisar_invitaciones() returns integer
language plpgsql security definer set search_path='' as $$
declare c public.fitness_avisos_config; x record; lista text; it jsonb; link text; n integer := 0; asunto text; pz text;
begin
 select * into c from public.fitness_avisos_config where id;
 if public.fitness_aviso_secreto('nexofit_resend_key') is null or c.email_from ilike '%@resend.dev%' then return 0; end if;
 for x in
  select i.id, i.token, r.nombre, btrim(r.email) email, s.code, s.tipo, s.items, s.localidad, s.provincia, s.plazo
  from public.fitness_invitaciones i
  join public.fitness_red_proveedores r on r.id=i.proveedor_id
  join public.fitness_solicitudes s on s.code=i.solicitud_code
  where i.avisado_at is null and r.activo and s.status in ('nueva','enviada','con_ofertas')
    and s.created_at > now()-interval '30 days'
    and btrim(coalesce(r.email,'')) ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  order by i.id limit 50 for update of i skip locked
 loop
  lista := '';
  for it in select * from jsonb_array_elements(coalesce(x.items,'[]'::jsonb)) loop
   lista := lista||'• '||coalesce(it->>'cantidad','')||' × '||coalesce(it->>'producto','')||chr(10);
  end loop;
  link := c.site_url||'/oferta.html#t='||x.token;
  pz := case x.plazo when 'urgente' then 'lo antes posible' when '7' then 'hasta 7 días' when '15' then 'hasta 15 días'
   when '30' then 'hasta 30 días' when 'flexible' then 'sin apuro' else x.plazo end;
  asunto := 'Nuevo pedido de ofertas '||x.code||' · '||coalesce(x.localidad,'')||', '||coalesce(x.provincia,'');
  insert into public.fitness_avisos(tipo,canal,destino,asunto,texto,html,solicitud_code)
  values('pedido_proveedor','email',x.email,asunto,
   'Hola, equipo de '||x.nombre||'. Entró un pedido de ofertas en Nexo Fit para '||coalesce(x.tipo,'un espacio')||' en '||coalesce(x.localidad,'')||', '||coalesce(x.provincia,'')||coalesce(' (lo necesita: '||pz||')','')||':'||chr(10)
    ||lista||'Vean el pedido y carguen su oferta (precio, envío, plazo, cuotas, garantía y validez) desde este link privado: '||link||chr(10)
    ||'Ningún competidor ve sus precios y el comprador no ve nombres hasta elegir. Si no les interesa, no hace falta responder.',
   public.fitness_aviso_email_html('Nuevo pedido de ofertas '||x.code,
    '<p style="line-height:1.5">Hola, equipo de '||public.fitness_html(x.nombre)||'. Entró un pedido de ofertas para <b>'||public.fitness_html(coalesce(x.tipo,'un espacio'))||'</b> en <b>'
     ||public.fitness_html(coalesce(x.localidad,'')||', '||coalesce(x.provincia,''))||'</b>'||coalesce(' (lo necesita: '||public.fitness_html(pz)||')','')||':</p>'
     ||'<p style="white-space:pre-line;line-height:1.5">'||public.fitness_html(lista)||'</p>'
     ||'<p style="line-height:1.5">Carguen su oferta (precio, envío, plazo, cuotas, garantía y validez) desde su link privado. Ningún competidor ve sus precios y el comprador no ve nombres hasta elegir. Si no les interesa, no hace falta responder.</p>',
    'Ver el pedido y ofertar',link),
   x.code);
  update public.fitness_invitaciones set avisado_at=now() where id=x.id;
  n := n+1;
 end loop;
 return n;
end $$;

-- La cola de avisos primero suma los emails a proveedores pendientes; si eso falla, igual envía el resto.
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
 commit;
 for v_id in select id from public.fitness_avisos where estado='pendiente' and created_at > now()-interval '2 days' order by id limit 20 loop
  perform public.fitness_aviso_enviar(v_id);
  commit;
 end loop;
 perform pg_advisory_unlock(271828182);
end $$;

revoke all on function public.fitness_avisar_invitaciones() from public, anon, authenticated;
commit;

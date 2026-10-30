-- Que el comprador y el proveedor no se salteen a Nexo Fit:
-- 1) Las notas de una oferta no pueden tener teléfonos, mails, webs ni redes (y si una vieja los tiene, el comprador no las ve hasta elegir).
-- 2) Cada oferta anónima muestra datos de confianza sin el nombre: tipo de empresa, localidad, CUIT verificado y ventas concretadas en Nexo Fit.
-- 3) Oferta elegida y sin pagar a las 24 h: recordatorio al comprador, al proveedor y aviso al administrador.
-- 4) Mercado Pago obligatorio para ofertar: queda listo pero apagado (fitness_avisos_config.exigir_mp) hasta que Mercado Pago esté configurado.
begin;

alter table public.fitness_red_proveedores add column if not exists cuit_verificado boolean not null default false;
alter table public.fitness_avisos_config add column if not exists exigir_mp boolean not null default false;
alter table public.fitness_solicitudes add column if not exists recordatorio_pago_at timestamptz;

create or replace function public.fitness_tiene_contacto(t text) returns boolean language sql immutable set search_path='' as $$
 select coalesce(t,'') <> '' and (
  lower(t) ~ '[a-z0-9._%+-]+ ?(@|\(at\)|\[at\]| arroba ) ?[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}'
  or lower(t) ~ '(https?://|www\.|\m[a-z0-9-]+\.(com|net|org|ar|shop|store|site|online|info)\M)'
  or lower(t) ~ '(^|[^a-z0-9.])@[a-z0-9_.]{3,}'
  or lower(t) ~ '\m(whats ?app|whatsap|wasap|watsap|wsp|wpp|instagram|facebook|tik ?tok|telegram|celular|tel[eé]fono|ll[aá]mame|ll[aá]manos)\M'
  or t ~ '(?<![$\d.,])(\+?54[ -]?)?(9[ -]?)?\(?0?\d{2,4}\)?[ -]?(15[ -]?)?\d{3,4}[ -]?\d{4}(?![\d.,])'
 )
$$;
revoke all on function public.fitness_tiene_contacto(text) from public, anon, authenticated;

create or replace function public.fitness_oferta_enviar(p_token text, p jsonb) returns jsonb
language plpgsql security definer set search_path='' set timezone='America/Argentina/Buenos_Aires' as $$
declare i public.fitness_invitaciones; s public.fitness_solicitudes; n int; v_vence timestamptz := now()+interval '24 hours';
begin
 if coalesce(p_token,'') !~ '^[0-9a-f]{64}$' then raise exception 'El link no es válido'; end if;
 select * into i from public.fitness_invitaciones where token=p_token;
 if not found then raise exception 'El link no es válido o fue reemplazado'; end if;
 select * into s from public.fitness_solicitudes where code=i.solicitud_code for update;
 if public.fitness_sol_estado(s.status,s.updated_at) not in ('nueva','enviada','con_ofertas') then raise exception 'Esta solicitud ya no recibe ofertas'; end if;
 if coalesce(p->>'precio_total','') !~ '^[0-9]{1,11}(\.[0-9]{1,2})?$' or (p->>'precio_total')::numeric<=0 then raise exception 'Escribí el precio total'; end if;
 if coalesce(p->>'envio','0') !~ '^[0-9]{1,11}(\.[0-9]{1,2})?$' then raise exception 'Revisá el costo de envío'; end if;
 if coalesce(p->>'plazo_dias','') !~ '^[0-9]{1,3}$' or (p->>'plazo_dias')::int not between 1 and 180 then raise exception 'Indicá el plazo de entrega en días hábiles (1 a 180)'; end if;
 if coalesce(p->>'cuotas','0') !~ '^[0-9]{1,2}$' or (p->>'cuotas')::int>24 then raise exception 'Revisá las cuotas (0 a 24)'; end if;
 if coalesce(p->>'garantia_meses','0') !~ '^[0-9]{1,3}$' or (p->>'garantia_meses')::int>120 then raise exception 'Revisá la garantía (0 a 120 meses)'; end if;
 if coalesce(p->>'cumple','total') not in ('total','parcial') then raise exception 'Indicá si cumple todo el pedido'; end if;
 if length(coalesce(p->>'notas',''))>600 then raise exception 'Las notas son demasiado largas'; end if;
 if public.fitness_tiene_contacto(p->>'notas') then raise exception 'Sacá de las notas los teléfonos, mails, webs o redes: los datos de contacto se comparten cuando el comprador paga la compra por Nexo Fit. Si escribiste un precio, ponelo con puntos (ej. 1.250.000)'; end if;
 if coalesce((select c.exigir_mp from public.fitness_avisos_config c where c.id),false) and not s.es_prueba and not public.fitness_mp_red_conectado(i.proveedor_id) then
  raise exception 'Para ofertar, primero conectá tu cuenta de Mercado Pago con el botón de esta página: así el comprador te puede pagar por Nexo Fit apenas te elige'; end if;
 if coalesce(p->>'cumple','total')='parcial' and length(btrim(coalesce(p->>'notas','')))<5 then raise exception 'Contá en las notas qué parte del pedido no cubrís'; end if;
 insert into public.fitness_ofertas_solicitud(invitacion_id,precio_total,envio,plazo_dias,cuotas,garantia_meses,valida_hasta,vence_at,cumple,notas)
 values(i.id,(p->>'precio_total')::numeric,coalesce(nullif(p->>'envio',''),'0')::numeric,(p->>'plazo_dias')::int,coalesce(nullif(p->>'cuotas',''),'0')::int,
  coalesce(nullif(p->>'garantia_meses',''),'0')::int,v_vence::date,v_vence,coalesce(p->>'cumple','total'),nullif(btrim(coalesce(p->>'notas','')),''))
 on conflict (invitacion_id) do update set precio_total=excluded.precio_total,envio=excluded.envio,plazo_dias=excluded.plazo_dias,cuotas=excluded.cuotas,
  garantia_meses=excluded.garantia_meses,valida_hasta=excluded.valida_hasta,vence_at=excluded.vence_at,aviso_vence_at=null,
  cumple=excluded.cumple,notas=excluded.notas,updated_at=now();
 select count(*) into n from public.fitness_ofertas_solicitud o join public.fitness_invitaciones x on x.id=o.invitacion_id where x.solicitud_code=s.code;
 update public.fitness_solicitudes set status='con_ofertas', ofertas_recibidas=least(99,n), updated_at=now() where code=s.code;
 return jsonb_build_object('ok',true,'ofertas',n,'vence',v_vence);
end $$;

create or replace function public.fitness_invitacion_ver(p_token text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare i public.fitness_invitaciones; s public.fitness_solicitudes; r public.fitness_red_proveedores; eleg boolean;
begin
 if coalesce(p_token,'') !~ '^[0-9a-f]{64}$' then raise exception 'El link no es válido'; end if;
 select * into i from public.fitness_invitaciones where token=p_token;
 if not found then raise exception 'El link no es válido o fue reemplazado'; end if;
 select * into s from public.fitness_solicitudes where code=i.solicitud_code;
 select * into r from public.fitness_red_proveedores where id=i.proveedor_id;
 if i.visto_at is null then update public.fitness_invitaciones set visto_at=now() where id=i.id; end if;
 eleg := s.oferta_elegida is not null and s.oferta_elegida=(select o.id from public.fitness_ofertas_solicitud o where o.invitacion_id=i.id);
 -- Sin nombre, email, teléfono, empresa ni presupuesto del comprador (esos datos le llegan por email cuando paga).
 return jsonb_build_object('code',s.code,'proveedor',r.nombre,'estado',public.fitness_sol_estado(s.status,s.updated_at),
  'abierta', public.fitness_sol_estado(s.status,s.updated_at) in ('nueva','enviada','con_ofertas'),
  'tipo',s.tipo,'items',s.items,'detalles',s.detalles,'localidad',s.localidad,'provincia',s.provincia,'plazo',s.plazo,
  'factura',s.factura,'pagos',s.pagos,'prioridad',s.prioridad,'creada',s.created_at,
  'elegida', eleg, 'mp', public.fitness_mp_red_conectado(r.id),
  'exigeMp', coalesce((select c.exigir_mp from public.fitness_avisos_config c where c.id),false) and not s.es_prueba,
  'pago', case when eleg then s.pago_estado end,
  'comision',public.fitness_red_comision_pct(r.id),
  'prueba', s.es_prueba,
  'fotos', public.fitness_oferta_fotos(i.id),
  'oferta',(select to_jsonb(o) - 'invitacion_id' - 'aviso_vence_at' || jsonb_build_object('vencida', o.vence_at < now())
    from public.fitness_ofertas_solicitud o where o.invitacion_id=i.id));
end $$;

create or replace function public.fitness_solicitud_consulta(p_code text, p_email text) returns jsonb
language plpgsql stable security definer set search_path='' set timezone='America/Argentina/Buenos_Aires' as $$
declare s public.fitness_solicitudes; v_estado text; pid bigint;
begin
 select * into s from public.fitness_solicitudes x where x.code=upper(btrim(coalesce(p_code,''))) and x.email=lower(btrim(coalesce(p_email,'')));
 if not found then raise exception 'No encontramos una solicitud con ese número y ese email'; end if;
 v_estado := public.fitness_sol_estado(s.status,s.updated_at);
 select i.proveedor_id into pid from public.fitness_ofertas_solicitud o join public.fitness_invitaciones i on i.id=o.invitacion_id where o.id=s.oferta_elegida;
 return jsonb_build_object('code',s.code,'status',v_estado,'createdAt',s.created_at,'updatedAt',s.updated_at,
  'productos',jsonb_array_length(s.items),'items',s.items,'localidad',s.localidad,'plazo',s.plazo,'prioridad',s.prioridad,
  'proveedores',s.proveedores_consultados,'nota',s.nota_publica,'prueba',s.es_prueba,
  'pago',jsonb_build_object('estado',s.pago_estado,'monto',s.pago_monto,'fecha',s.pago_at,
    'disponible', s.status='elegida' and coalesce(s.pago_estado,'') not in ('aprobado','devuelto') and pid is not null and public.fitness_mp_red_conectado(pid)),
  'ofertas',(select coalesce(jsonb_agg(jsonb_build_object('id',o.id,'letra',chr(64+o.n::int),'precio',o.precio_total,'envio',o.envio,
     'total',o.precio_total+o.envio,'plazo',o.plazo_dias,'cuotas',o.cuotas,'garantia',o.garantia_meses,'validaHasta',o.vence_at,
     'vencida',o.vence_at<now() and o.id is distinct from s.oferta_elegida,'cumple',o.cumple,
     'notas',case when o.id is distinct from s.oferta_elegida and public.fitness_tiene_contacto(o.notas) then null else o.notas end,
     'notasOcultas',o.id is distinct from s.oferta_elegida and public.fitness_tiene_contacto(o.notas),
     'confianza',jsonb_build_object('tipo',o.tipo,'localidad',o.prov_localidad,'cuitVerificado',o.cuit_verificado and o.cuit is not null,
       'ventas',(select count(*) from public.fitness_solicitudes v join public.fitness_ofertas_solicitud vo on vo.id=v.oferta_elegida join public.fitness_invitaciones vi on vi.id=vo.invitacion_id
         where vi.proveedor_id=o.proveedor_id and v.pago_estado='aprobado' and not v.es_prueba)),'elegida',coalesce(o.id=s.oferta_elegida,false),
     'fotos',public.fitness_oferta_fotos(o.invitacion_id),
     'proveedor',case when o.id=s.oferta_elegida then o.nombre end) order by o.n),'[]')
   from (select oo.*, r.nombre, r.tipo, r.localidad prov_localidad, r.cuit, r.cuit_verificado, i.proveedor_id, row_number() over (order by oo.created_at, oo.id) as n
     from public.fitness_ofertas_solicitud oo join public.fitness_invitaciones i on i.id=oo.invitacion_id
     join public.fitness_red_proveedores r on r.id=i.proveedor_id where i.solicitud_code=s.code) o));
end $$;

create or replace function public.fitness_red_guardar(p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 v_com numeric := case when p ? 'comision' and nullif(p->>'comision','') is not null then (p->>'comision')::numeric end;
 v_id bigint := nullif(p->>'id','')::bigint;
 v_nombre text := btrim(coalesce(p->>'nombre',''));
 v_rubros text[]; v_zonas text[];
begin
 if not public.fitness_es_admin() then raise exception 'No autorizado'; end if;
 if length(v_nombre) not between 2 and 120 then raise exception 'Escribí el nombre del proveedor'; end if;
 if coalesce(p->>'whatsapp','')<>'' and length(regexp_replace(p->>'whatsapp','[^0-9]','','g')) not between 8 and 15 then raise exception 'Revisá el WhatsApp'; end if;
 select coalesce(array_agg(distinct x),'{}') into v_rubros from jsonb_array_elements_text(coalesce(p->'rubros','[]')) x
  where x in ('musculacion','funcional','crossfit','colchonetas','deportes','entrenamiento','atletismo','escolar','boxeo','natacion','rehabilitacion','cesped');
 select coalesce(array_agg(distinct btrim(x)),'{}') into v_zonas from jsonb_array_elements_text(coalesce(p->'zonas','[]')) x where length(btrim(x)) between 2 and 40;
 if cardinality(v_zonas)=0 then v_zonas := '{todo}'; end if;
 if v_com is not null and (v_com<0 or v_com>100) then raise exception 'La comisión va de 0 a 100'; end if;
 if v_id is null then
  insert into public.fitness_red_proveedores(nombre,contacto,whatsapp,email,rubros,zonas,activo,notas,comision,cuit_verificado)
  values(v_nombre,nullif(btrim(coalesce(p->>'contacto','')),''),nullif(regexp_replace(coalesce(p->>'whatsapp',''),'[^0-9]','','g'),''),
   nullif(lower(btrim(coalesce(p->>'email',''))),''),v_rubros,v_zonas,coalesce((p->>'activo')::boolean,true),nullif(btrim(coalesce(p->>'notas','')),''),v_com,coalesce((p->>'cuit_verificado')::boolean,false))
  returning id into v_id;
 else
  update public.fitness_red_proveedores set nombre=v_nombre,contacto=nullif(btrim(coalesce(p->>'contacto','')),''),
   whatsapp=nullif(regexp_replace(coalesce(p->>'whatsapp',''),'[^0-9]','','g'),''),email=nullif(lower(btrim(coalesce(p->>'email',''))),''),
   rubros=v_rubros,zonas=v_zonas,activo=coalesce((p->>'activo')::boolean,true),notas=nullif(btrim(coalesce(p->>'notas','')),''),
   cuit_verificado=case when p ? 'cuit_verificado' then coalesce((p->>'cuit_verificado')::boolean,false) else cuit_verificado end,
   comision=case when p ? 'comision' then v_com else comision end,updated_at=now()
  where id=v_id;
  if not found then raise exception 'Proveedor inexistente'; end if;
 end if;
 return jsonb_build_object('id',v_id);
end $$;

create or replace function public.fitness_avisos_recordatorios() returns integer
language plpgsql security definer set search_path='' set timezone='America/Argentina/Buenos_Aires' as $$
declare c public.fitness_avisos_config; x record; n integer := 0; site text; lista text; it jsonb; link text; puede boolean;
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
     ||'<p style="line-height:1.5">Entrá a verlas comparadas, con nuestra recomendación. Tené en cuenta que cada oferta vale 24 horas desde que el proveedor la envía. Pedir ofertas no te compromete a comprar.</p>',
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

 -- 3) Proveedor: a su oferta (válida 24 h) le quedan menos de 6 horas y el pedido sigue abierto.
 for x in
  select o.id, o.vence_at, i.token, r.nombre, r.email, s.code
  from public.fitness_ofertas_solicitud o
  join public.fitness_invitaciones i on i.id=o.invitacion_id
  join public.fitness_red_proveedores r on r.id=i.proveedor_id
  join public.fitness_solicitudes s on s.code=i.solicitud_code
  where o.aviso_vence_at is null and o.vence_at between now() and now()+interval '6 hours'
    and s.status in ('nueva','enviada','con_ofertas') and public.fitness_sol_estado(s.status,s.updated_at) in ('nueva','enviada','con_ofertas')
  order by o.id limit 50 for update of o skip locked
 loop
  link := site||'/oferta.html#t='||x.token;
  perform public.fitness_aviso_mail('oferta_por_vencer',x.code,x.email,
   'Su oferta para '||x.code||' vence hoy a las '||to_char(x.vence_at,'HH24:MI'),
   'Hola, equipo de '||x.nombre||'. Su oferta para el pedido '||x.code||' vence el '||to_char(x.vence_at,'DD/MM')||' a las '||to_char(x.vence_at,'HH24:MI')||' (las ofertas valen 24 horas) y el comprador todavía no eligió. Si quieren seguir participando, renuévenla por 24 horas más desde su link privado: '||link,
   public.fitness_aviso_email_html('Su oferta vence a las '||to_char(x.vence_at,'HH24:MI'),
    '<p style="line-height:1.5">Hola, equipo de '||public.fitness_html(x.nombre)||'. Su oferta para el pedido <b>'||x.code||'</b> vence el <b>'||to_char(x.vence_at,'DD/MM')||' a las '||to_char(x.vence_at,'HH24:MI')||'</b> y el comprador todavía no eligió.</p>'
    ||'<p style="line-height:1.5">Las ofertas valen 24 horas. Si quieren seguir participando, renuévenla con un clic (o ajústenla) desde su link privado. Una oferta vencida no se puede elegir.</p>',
    'Renovar mi oferta',link));
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
 -- 5) Oferta elegida y sin pagar a las 24 h: un solo recordatorio al comprador (si ya puede pagar), al proveedor y al administrador.
 for x in
  select s.code, s.nombre, s.email, r.nombre prov, r.email prov_email, i.token, i.proveedor_id, o.precio_total+o.envio total
  from public.fitness_solicitudes s
  join public.fitness_ofertas_solicitud o on o.id=s.oferta_elegida
  join public.fitness_invitaciones i on i.id=o.invitacion_id
  join public.fitness_red_proveedores r on r.id=i.proveedor_id
  where s.status='elegida' and s.recordatorio_pago_at is null and not s.es_prueba
    and s.elegida_at < now()-interval '24 hours' and s.elegida_at > now()-interval '10 days'
    and coalesce(s.pago_estado,'') not in ('aprobado','devuelto')
  order by s.elegida_at limit 50 for update of s skip locked
 loop
  puede := public.fitness_mp_red_conectado(x.proveedor_id);
  link := site||'/mi-solicitud.html?codigo='||x.code;
  if c.comprador_email and puede then
   perform public.fitness_aviso_mail('pago_pendiente_comprador',x.code,x.email,
    'Tu compra '||x.code||' está esperando el pago',
    'Hola '||x.nombre||', elegiste la oferta de '||x.prov||' para tu solicitud '||x.code||' y todavía no la pagaste. La compra se confirma cuando pagás desde Nexo Fit con Mercado Pago: así queda registrada, con las condiciones que elegiste (precio, cuotas, plazo y garantía), y si algo sale mal te ayudamos a resolverlo. Pagala en '||link,
    public.fitness_aviso_email_html('Tu compra está esperando el pago',
     '<p style="line-height:1.5">Hola '||public.fitness_html(x.nombre)||', elegiste la oferta de <b>'||public.fitness_html(x.prov)||'</b> para tu solicitud <b>'||x.code||'</b> y todavía no la pagaste.</p>'
     ||'<p style="line-height:1.5">La compra se confirma cuando pagás desde Nexo Fit con Mercado Pago. Así queda registrada con las condiciones que elegiste (precio, cuotas, plazo y garantía), y si algo sale mal te ayudamos a resolverlo.</p>',
     'Pagar mi compra',link));
  end if;
  perform public.fitness_aviso_mail('pago_pendiente_proveedor',x.code,x.prov_email,
   'El comprador de '||x.code||' todavía no pagó',
   case when puede then
    'Hola, equipo de '||x.prov||'. El comprador eligió su oferta para el pedido '||x.code||' hace más de un día y todavía no pagó. Le recordamos que lo haga desde Nexo Fit. Si los contacta por otro medio, pídanle que pague desde su solicitud: así la venta queda registrada y protegida. Los términos de la red los comprometen a no cerrar por fuera las ventas de pedidos de Nexo Fit.'
   else
    'Hola, equipo de '||x.prov||'. El comprador eligió su oferta para el pedido '||x.code||' y no puede pagar porque su cuenta de Mercado Pago no está conectada. Conéctenla desde su link privado para cobrar: '||site||'/oferta.html#t='||x.token
   end,
   public.fitness_aviso_email_html(case when puede then 'El comprador todavía no pagó' else 'Conecten Mercado Pago para cobrar' end,
    case when puede then
     '<p style="line-height:1.5">Hola, equipo de '||public.fitness_html(x.prov)||'. El comprador eligió su oferta para el pedido <b>'||x.code||'</b> hace más de un día y todavía no pagó. Le recordamos que lo haga desde Nexo Fit.</p>'
     ||'<p style="line-height:1.5">Si los contacta por otro medio, pídanle que pague desde su solicitud: así la venta queda registrada y protegida. Los términos de la red los comprometen a no cerrar por fuera las ventas de pedidos de Nexo Fit.</p>'
    else
     '<p style="line-height:1.5">Hola, equipo de '||public.fitness_html(x.prov)||'. El comprador eligió su oferta para el pedido <b>'||x.code||'</b> y <b>no puede pagar</b> porque su cuenta de Mercado Pago no está conectada.</p>'
     ||'<p style="line-height:1.5">Conéctenla desde su link privado para cobrar.</p>'
    end,
    case when puede then 'Ver el pedido' else 'Conectar Mercado Pago' end, site||'/oferta.html#t='||x.token));
  perform public.fitness_aviso_encolar('pago_pendiente',x.code,'Oferta elegida sin pagar · '||x.code,
   'El comprador de '||x.code||' eligió la oferta de '||x.prov||' ('||to_char(x.total,'FM999G999G999')||') hace más de 24 h y no pagó.'
   ||case when puede then ' Ya le recordamos a los dos.' else ' El proveedor no conectó Mercado Pago: le pedimos que lo conecte.' end
   ||' Conviene llamarlos para que la venta no se cierre por fuera.',null,null,null,null);
  update public.fitness_solicitudes set recordatorio_pago_at=now() where code=x.code;
  n := n+1;
 end loop;
 return n;
end $$;

-- Panel: ver y cambiar si se exige Mercado Pago para ofertar, con cuántos proveedores activos ya lo conectaron.
create or replace function public.fitness_red_config(p jsonb default null) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not public.fitness_es_admin() then raise exception 'No autorizado'; end if;
 if p ? 'exigir_mp' then
  update public.fitness_avisos_config set exigir_mp=coalesce((p->>'exigir_mp')::boolean,false), updated_at=now() where id;
 end if;
 return jsonb_build_object('exigir_mp',(select c.exigir_mp from public.fitness_avisos_config c where c.id),
  'activos',(select count(*) from public.fitness_red_proveedores r where r.activo and not r.es_prueba),
  'mp',(select count(*) from public.fitness_red_proveedores r where r.activo and not r.es_prueba and public.fitness_mp_red_conectado(r.id)));
end $$;
revoke all on function public.fitness_red_config(jsonb) from public, anon;
grant execute on function public.fitness_red_config(jsonb) to authenticated;

commit;

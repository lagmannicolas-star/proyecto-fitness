-- Ciclo completo de avisos de "Pedí ofertas":
-- * El proveedor recibe confirmación cuando carga o corrige su oferta.
-- * Cuando el comprador elige: al ganador le llega "Eligieron su oferta" y a los demás que ofertaron, que se eligió otra.
-- * Si el pedido se cierra o se descarta sin elegir, se les avisa a los que ofertaron.
-- * Las respuestas a cualquier email de Nexo Fit le llegan al administrador (reply_to).
-- * Textos al comprador y al admin al día: el pedido ya sale solo a toda la red por email.
-- Los emails a proveedores y compradores solo salen con Resend activo y remitente con dominio propio.
begin;

-- Encola un email a un tercero (proveedor o comprador) solo si el envío está activo y la dirección es válida.
create or replace function public.fitness_aviso_mail(p_tipo text, p_code text, p_destino text, p_asunto text, p_texto text, p_html text) returns void
language plpgsql security definer set search_path='' as $$
declare c public.fitness_avisos_config;
begin
 select * into c from public.fitness_avisos_config where id;
 if public.fitness_aviso_secreto('nexofit_resend_key') is null or c.email_from ilike '%@resend.dev%' then return; end if;
 if btrim(coalesce(p_destino,'')) !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return; end if;
 insert into public.fitness_avisos(tipo,canal,destino,asunto,texto,html,solicitud_code)
 values(p_tipo,'email',btrim(p_destino),p_asunto,p_texto,p_html,p_code);
end $$;

-- Resumen de una oferta en una línea (para textos de email).
create or replace function public.fitness_oferta_resumen(o public.fitness_ofertas_solicitud) returns text
language sql stable set search_path='' as $$
 select public.fitness_pesos(o.precio_total+o.envio)||' puesto en destino · '||o.plazo_dias||' días hábiles · '
  ||case when o.cuotas>0 then o.cuotas||' cuotas' else 'sin cuotas' end||' · garantía '||o.garantia_meses||' meses · válida hasta '
  ||to_char(o.valida_hasta,'DD/MM/YYYY')||case when o.cumple='parcial' then ' · cubre parte del pedido' else '' end
$$;

create or replace function public.fitness_aviso_tr_solicitud() returns trigger
language plpgsql security definer set search_path='' as $$
declare site text; n int; link text; it jsonb; lista text := ''; prov text; tot numeric; ptel text; x record; o public.fitness_ofertas_solicitud; olink text;
begin
 begin
  select site_url into site from public.fitness_avisos_config where id;
  link := site||'/mi-solicitud.html?codigo='||new.code;
  if tg_op='INSERT' then
   n := jsonb_array_length(new.items);
   for it in select * from jsonb_array_elements(new.items) loop lista := lista||'• '||(it->>'cantidad')||' × '||(it->>'producto')||chr(10); end loop;
   perform public.fitness_aviso_encolar('solicitud_nueva',new.code,
    'Nueva solicitud '||new.code,
    n||(case when n=1 then ' producto' else ' productos' end)||' para '||new.tipo||' en '||new.localidad||', '||new.provincia||'.'||chr(10)||lista
     ||'Ya les llega por email a todos los proveedores activos de la red. Si querés reforzar, mandales el link por WhatsApp desde Solicitudes en el panel.',
    new.email,'Recibimos tu solicitud '||new.code,
    'Hola '||new.nombre||', recibimos tu pedido de ofertas '||new.code||'. Ya se lo enviamos a los proveedores de nuestra red. Cuando lleguen las ofertas te avisamos y las vas a ver comparadas en '||link,
    public.fitness_aviso_email_html('Recibimos tu solicitud '||new.code,
     '<p style="line-height:1.5">Hola '||public.fitness_html(new.nombre)||', ya les enviamos tu pedido a los proveedores de nuestra red:</p><p style="white-space:pre-line;line-height:1.5">'||public.fitness_html(lista)||'</p>'
     ||'<p style="line-height:1.5">Cuando lleguen las ofertas te avisamos por este medio y las vas a ver comparadas, con nuestra recomendación. Pedir ofertas no te compromete a comprar.</p>'
     ||'<p style="line-height:1.5">Tu número de solicitud es <b>'||new.code||'</b>. Guardalo junto con este email para entrar a verla.</p>',
     'Seguir mi solicitud',link));
  elsif tg_op='UPDATE' and new.status='elegida' and old.status is distinct from 'elegida' then
   select r.nombre, o2.precio_total+o2.envio, r.whatsapp into prov, tot, ptel
   from public.fitness_ofertas_solicitud o2 join public.fitness_invitaciones i on i.id=o2.invitacion_id join public.fitness_red_proveedores r on r.id=i.proveedor_id
   where o2.id=new.oferta_elegida;
   perform public.fitness_aviso_encolar('oferta_elegida',new.code,
    'Eligieron una oferta: '||new.code,
    new.nombre||' eligió la oferta de '||coalesce(prov,'un proveedor')||' por '||public.fitness_pesos(tot)||'.'||chr(10)
     ||'Comprador: '||new.nombre||' · '||new.telefono||' · '||new.email||chr(10)||'Proveedor: '||coalesce(prov,'')||coalesce(' · WhatsApp '||ptel,'')||chr(10)
     ||'Al proveedor ya le avisamos por email que fue elegido. Coordiná pago y entrega y después marcala como Cerrada.',
    new.email,'Elegiste tu oferta · '||new.code,
    'Elegiste la oferta de '||coalesce(prov,'un proveedor')||' por '||public.fitness_pesos(tot)||'. Te vamos a contactar para coordinar el pago y la entrega.',
    public.fitness_aviso_email_html('Elegiste tu oferta',
     '<p style="line-height:1.5">Elegiste la oferta de <b>'||public.fitness_html(coalesce(prov,'un proveedor'))||'</b> por <b>'||public.fitness_pesos(tot)||'</b> para tu solicitud '||new.code||'.</p>'
     ||'<p style="line-height:1.5">Te vamos a contactar para coordinar el pago y la entrega. Todavía no se te cobró nada.</p>',
     'Ver mi solicitud',link));
   -- Proveedores que ofertaron: al elegido, que ganó; a los demás, que se eligió otra oferta.
   for x in select r.nombre, r.email, i.token, oo.id oid from public.fitness_ofertas_solicitud oo
    join public.fitness_invitaciones i on i.id=oo.invitacion_id join public.fitness_red_proveedores r on r.id=i.proveedor_id
    where i.solicitud_code=new.code loop
    olink := site||'/oferta.html#t='||x.token;
    if x.oid=new.oferta_elegida then
     select * into o from public.fitness_ofertas_solicitud where id=x.oid;
     perform public.fitness_aviso_mail('oferta_ganadora',new.code,x.email,
      'Eligieron su oferta · '||new.code,
      'Hola, equipo de '||x.nombre||'. El comprador del pedido '||new.code||' ('||new.localidad||', '||new.provincia||') eligió su oferta: '||public.fitness_oferta_resumen(o)||'.'||chr(10)
       ||'En breve los contactamos desde Nexo Fit para coordinar el pago, la factura y la entrega. Mantengan el precio, el stock y las condiciones de la oferta mientras coordinamos.'||chr(10)
       ||'Pueden ver la oferta en su link privado: '||olink,
      public.fitness_aviso_email_html('Eligieron su oferta',
       '<p style="line-height:1.5">Hola, equipo de '||public.fitness_html(x.nombre)||'. El comprador del pedido <b>'||new.code||'</b> ('||public.fitness_html(new.localidad||', '||new.provincia)||') eligió su oferta:</p>'
       ||'<p style="line-height:1.5"><b>'||public.fitness_html(public.fitness_oferta_resumen(o))||'</b></p>'
       ||'<p style="line-height:1.5">En breve los contactamos desde Nexo Fit para coordinar el pago, la factura y la entrega. Mantengan el precio, el stock y las condiciones de la oferta mientras coordinamos.</p>',
       'Ver mi oferta',olink));
    else
     perform public.fitness_aviso_mail('oferta_no_elegida',new.code,x.email,
      'El comprador eligió otra oferta · '||new.code,
      'Hola, equipo de '||x.nombre||'. Para el pedido '||new.code||' ('||new.localidad||', '||new.provincia||') el comprador eligió otra oferta. Gracias por ofertar: les vamos a seguir enviando los pedidos de su rubro.',
      public.fitness_aviso_email_html('El comprador eligió otra oferta',
       '<p style="line-height:1.5">Hola, equipo de '||public.fitness_html(x.nombre)||'. Para el pedido <b>'||new.code||'</b> ('||public.fitness_html(new.localidad||', '||new.provincia)||') el comprador eligió otra oferta.</p>'
       ||'<p style="line-height:1.5">Gracias por ofertar: les vamos a seguir enviando los pedidos de su rubro.</p>',
       'Ver mi oferta',olink));
    end if;
   end loop;
  elsif tg_op='UPDATE' and new.status in ('cerrada','descartada') and old.status in ('nueva','enviada','con_ofertas') and new.oferta_elegida is null then
   -- Se cerró sin elegir: se les avisa a los que ofertaron.
   for x in select r.nombre, r.email from public.fitness_ofertas_solicitud oo
    join public.fitness_invitaciones i on i.id=oo.invitacion_id join public.fitness_red_proveedores r on r.id=i.proveedor_id
    where i.solicitud_code=new.code loop
    perform public.fitness_aviso_mail('pedido_cerrado_proveedor',new.code,x.email,
     'Pedido cerrado sin elegir oferta · '||new.code,
     'Hola, equipo de '||x.nombre||'. El pedido '||new.code||' ('||new.localidad||', '||new.provincia||') se cerró sin que el comprador eligiera una oferta. Gracias por ofertar: les vamos a seguir enviando los pedidos de su rubro.',
     public.fitness_aviso_email_html('Pedido cerrado sin elegir oferta',
      '<p style="line-height:1.5">Hola, equipo de '||public.fitness_html(x.nombre)||'. El pedido <b>'||new.code||'</b> ('||public.fitness_html(new.localidad||', '||new.provincia)||') se cerró sin que el comprador eligiera una oferta.</p>'
      ||'<p style="line-height:1.5">Gracias por ofertar: les vamos a seguir enviando los pedidos de su rubro.</p>',
      'Ir a Nexo Fit',site));
   end loop;
  end if;
 exception when others then
  raise warning 'Aviso no encolado (%): %', new.code, sqlerrm;
 end;
 return new;
end $$;

create or replace function public.fitness_aviso_tr_oferta() returns trigger
language plpgsql security definer set search_path='' as $$
declare s public.fitness_solicitudes; prov text; pmail text; tok text; site text; n int; link text; olink text;
begin
 begin
  select x.* into s from public.fitness_solicitudes x join public.fitness_invitaciones i on i.solicitud_code=x.code where i.id=new.invitacion_id;
  select r.nombre, r.email, i.token into prov, pmail, tok from public.fitness_invitaciones i join public.fitness_red_proveedores r on r.id=i.proveedor_id where i.id=new.invitacion_id;
  select site_url into site from public.fitness_avisos_config where id;
  select count(*) into n from public.fitness_ofertas_solicitud o join public.fitness_invitaciones i on i.id=o.invitacion_id where i.solicitud_code=s.code;
  link := site||'/mi-solicitud.html?codigo='||s.code;
  olink := site||'/oferta.html#t='||tok;
  perform public.fitness_aviso_encolar(case when tg_op='INSERT' then 'oferta_nueva' else 'oferta_corregida' end, s.code,
   case when tg_op='INSERT' then 'Nueva oferta para '||s.code else 'Oferta corregida en '||s.code end,
   prov||': '||public.fitness_pesos(new.precio_total+new.envio)||' · '||new.plazo_dias||' días hábiles'
    ||case when new.cuotas>0 then ' · '||new.cuotas||' cuotas' else '' end||case when new.cumple='parcial' then ' · PARCIAL' else '' end
    ||chr(10)||'Ofertas recibidas: '||n||'.',
   case when tg_op='INSERT' and n=1 then s.email end,
   'Ya tenés ofertas para tu solicitud '||s.code,
   'Llegó la primera oferta para tu solicitud '||s.code||'. Entrá a verla comparada en '||link||'. Si llegan más, aparecen en la misma página.',
   public.fitness_aviso_email_html('Ya tenés ofertas para tu solicitud',
    '<p style="line-height:1.5">Llegó la primera oferta para tu solicitud <b>'||s.code||'</b>. Entrá a verla: si llegan más, aparecen en la misma página, comparadas y con nuestra recomendación.</p>'
    ||'<p style="line-height:1.5">Vas a necesitar tu número de solicitud y este email.</p>',
    'Ver las ofertas',link));
  -- Confirmación al proveedor de que su oferta quedó cargada (o corregida).
  perform public.fitness_aviso_mail(case when tg_op='INSERT' then 'oferta_recibida_proveedor' else 'oferta_corregida_proveedor' end, s.code, pmail,
   case when tg_op='INSERT' then 'Recibimos su oferta · '||s.code else 'Su oferta quedó corregida · '||s.code end,
   'Hola, equipo de '||prov||'. '||case when tg_op='INSERT' then 'Recibimos' else 'Quedó corregida' end||' su oferta para el pedido '||s.code||': '||public.fitness_oferta_resumen(new)||'.'||chr(10)
    ||'El comprador la ve comparada, sin su nombre hasta elegir. Si el comprador elige su oferta, les avisamos por este medio. Mientras el pedido siga abierto pueden corregirla desde su link privado: '||olink,
   public.fitness_aviso_email_html(case when tg_op='INSERT' then 'Recibimos su oferta' else 'Quedó corregida su oferta' end,
    '<p style="line-height:1.5">Hola, equipo de '||public.fitness_html(prov)||'. '||case when tg_op='INSERT' then 'Recibimos' else 'Quedó corregida' end||' su oferta para el pedido <b>'||s.code||'</b>:</p>'
    ||'<p style="line-height:1.5"><b>'||public.fitness_html(public.fitness_oferta_resumen(new))||'</b></p>'
    ||'<p style="line-height:1.5">El comprador la ve comparada, sin su nombre hasta elegir. Si elige su oferta, les avisamos por este medio. Mientras el pedido siga abierto pueden corregirla desde su link privado.</p>',
    'Ver o corregir mi oferta',olink));
 exception when others then
  raise warning 'Aviso de oferta no encolado: %', sqlerrm;
 end;
 return new;
end $$;

-- Las respuestas a los emails de Nexo Fit van al email del administrador.
create or replace function public.fitness_aviso_enviar(p_id bigint) returns text
language plpgsql security definer set search_path='' as $$
declare a public.fitness_avisos; c public.fitness_avisos_config; k text; r extensions.http_response; d jsonb; err text; body jsonb;
begin
 select * into a from public.fitness_avisos where id=p_id for update;
 if not found or a.estado='enviado' then return 'ok'; end if;
 select * into c from public.fitness_avisos_config where id;
 perform extensions.http_set_curlopt('CURLOPT_TIMEOUT','20');
 begin
  if a.canal='email' then
   k := public.fitness_aviso_secreto('nexofit_resend_key');
   if k is null then raise exception 'Falta la llave de Resend'; end if;
   body := jsonb_build_object('from',c.email_from,'to',jsonb_build_array(a.destino),'subject',a.asunto,'text',a.texto,'html',a.html);
   if c.admin_email is not null and lower(c.admin_email)<>lower(a.destino) then body := body||jsonb_build_object('reply_to',c.admin_email); end if;
   r := extensions.http(('POST','https://api.resend.com/emails',
     array[extensions.http_header('Authorization','Bearer '||k)],'application/json',body::text)::extensions.http_request);
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

revoke all on function public.fitness_aviso_mail(text,text,text,text,text,text), public.fitness_oferta_resumen(public.fitness_ofertas_solicitud),
 public.fitness_aviso_tr_solicitud(), public.fitness_aviso_tr_oferta(), public.fitness_aviso_enviar(bigint) from public, anon, authenticated;
commit;

-- Lanzamiento de "Vender con catálogo" como vidriera, con aprobación del administrador.
-- 1) Alta de proveedor con catálogo: queda 'pending' (por aprobar). Puede entrar a su panel, cargar productos,
--    importar su catálogo y subir fotos, pero nada suyo se publica ni recibe pedidos de la red hasta que el
--    administrador lo aprueba. CUIT con dígito verificador validado en el servidor. Aviso al administrador.
-- 2) Red: el proveedor de catálogo entra pausado (activo=false). Al aprobarlo, fitness_proveedor_aprobar lo activa.
-- 3) Catálogo público: productos cargados a mano solo si están publicados ('published'); productos importados solo
--    si el administrador los publicó (hay una oferta publicada enlazada por sourceKey, como hacen "Completar y
--    publicar" y "Publicar todo el catálogo"). Solo proveedores activos. Fotos: solo 'aprobada'.
-- 4) Fotos que sube el proveedor: quedan 'pendiente' hasta que el administrador las aprueba. Las del administrador
--    (incluidas las que se toman de la tienda del proveedor) se publican directo.
-- 5) Pedidos sin pago confirmado: el proveedor no ve los datos personales del comprador (sí ciudad, provincia y CP).
-- 6) Reimportar el catálogo combina por clave: actualiza, agrega y marca las que faltan; no pisa lo del administrador.
begin;

-- CUIT argentino: 11 dígitos y dígito verificador (módulo 11, pesos 5 4 3 2 7 6 5 4 3 2).
create or replace function public.fitness_cuit_valido(c text) returns boolean
language plpgsql immutable set search_path='' as $$
declare d text := regexp_replace(coalesce(c,''),'[^0-9]','','g'); w int[] := array[5,4,3,2,7,6,5,4,3,2]; s int := 0; r int;
begin
 if length(d)<>11 then return false; end if;
 for i in 1..10 loop s := s + substr(d,i,1)::int * w[i]; end loop;
 r := 11 - (s % 11);
 if r=11 then r := 0; elsif r=10 then return false; end if;
 return r = substr(d,11,1)::int;
end $$;

-- Alta del proveedor con catálogo (desde la definición vigente): queda por aprobar.
create or replace function public.fitness_alta_proveedor(uid uuid, details jsonb) returns text
language plpgsql security definer set search_path='' as $$
declare p public.fitness_profiles; s jsonb; vid text; d jsonb; wa text;
begin
 select * into p from public.fitness_profiles where id=uid;
 if p.id is null or p.blocked then raise exception 'Confirmá tu email e iniciá sesión antes de solicitar el alta'; end if;
 if p.vendor_id is not null then raise exception 'Ya tenés una solicitud registrada'; end if;
 if length(coalesce(details->>'name',''))<2 or length(regexp_replace(coalesce(details->>'cuit',''),'[^0-9]','','g'))<>11 then raise exception 'Revisá la razón social y el CUIT'; end if;
 if not public.fitness_cuit_valido(details->>'cuit') then raise exception 'Revisá el CUIT: el último número no coincide. Copialo de tu constancia de AFIP (ej. 20-12345678-6)'; end if;
 -- Términos: el formulario manda la aceptación; la fecha que vale es la del servidor.
 if coalesce(details->'terms','null'::jsonb) in ('null'::jsonb,'false'::jsonb,'""'::jsonb,'0'::jsonb,'"false"'::jsonb) then
  raise exception 'Para sumarte tenés que aceptar los Términos y las condiciones para vender';
 end if;
 wa := public.fitness_wa_ar(coalesce(nullif(details->>'wa',''),details->>'phone'));
 d := public.fitness_pick(details,array['name','type','cuit','contact','phone'])||jsonb_build_object('terms',now());
 if nullif(btrim(coalesce(details->>'razon','')),'') is not null then d := d||jsonb_build_object('razon',left(btrim(details->>'razon'),160)); end if;
 if wa is not null then d := d||jsonb_build_object('phone',wa,'wa',wa); end if;
 select data into s from public.fitness_state where id=true for update;
 vid:='v_'||p.id::text;
 s:=jsonb_set(s,'{vendors}',(s->'vendors')||jsonb_build_array(d||jsonb_build_object('id',vid,'email',p.email,'user',p.email,'status','pending','alta','web','pendingSince',now(),'shipMode','coordinar','mp',false,'commission',null,'since',current_date,'logins','[]'::jsonb,'act','[]'::jsonb,'notifs','[]'::jsonb)));
 -- Rol 'vendor' aunque esté por aprobar: así entra a su panel. Lo público depende de status='active'.
 update public.fitness_profiles set vendor_id=vid,role=case when role='admin' then 'admin' else 'vendor' end where id=p.id;
 update public.fitness_state set data=s,revision=revision+1 where id=true;
 begin
  perform public.fitness_aviso_encolar('proveedor_nuevo',null,'Proveedor con catálogo para aprobar: '||(details->>'name'),
   (details->>'name')||coalesce(' ('||nullif(details->>'type','')||')','')||chr(10)||'Contacto: '||coalesce(nullif(details->>'contact',''),'-')
   ||coalesce(' · WhatsApp +'||wa,'')||' · '||p.email||chr(10)||'CUIT: '||regexp_replace(details->>'cuit','[^0-9]','','g')||chr(10)||chr(10)
   ||'Está por aprobar: puede cargar productos y fotos, pero no se publica nada ni recibe pedidos de la red hasta que lo apruebes en Proveedores.',null,null,null,null);
 exception when others then raise warning 'fitness_alta_proveedor aviso: %', sqlerrm;
 end;
 return vid;
end $$;

-- Alta que se completa al confirmar el email: mismo flujo, textos al día y aviso si el alta no se pudo completar.
create or replace function public.fitness_alta_pendiente_trg() returns trigger
language plpgsql security definer set search_path='' as $$
declare det jsonb := new.raw_user_meta_data->'vendor_alta'; wa text; err text;
begin
 if det is null or jsonb_typeof(det)<>'object' then return new; end if;
 begin
  if tg_op='INSERT' and new.email_confirmed_at is null then
   wa := public.fitness_wa_ar(coalesce(nullif(det->>'wa',''),det->>'phone'));
   perform public.fitness_aviso_encolar('proveedor_nuevo',null,'Proveedor empezó el alta: '||coalesce(det->>'name','(sin nombre)'),
    coalesce(det->>'name','')||coalesce(' ('||nullif(det->>'type','')||')','')||chr(10)||'Contacto: '||coalesce(nullif(det->>'contact',''),'-')
    ||coalesce(' · WhatsApp +'||wa,'')||' · '||coalesce(new.email,'')||chr(10)||chr(10)
    ||'Falta que confirme el email. Cuando lo confirme, aparece en Proveedores como "por aprobar".',null,null,null,null);
  end if;
  if new.email_confirmed_at is not null
     and exists(select 1 from public.fitness_profiles where id=new.id and vendor_id is null and not blocked) then
   perform public.fitness_alta_proveedor(new.id, det);
  end if;
 exception when others then
  err := sqlerrm;
  raise warning 'alta pendiente %: %', new.email, err; -- nunca frena el registro ni la confirmación
  begin
   perform public.fitness_aviso_encolar('proveedor_nuevo',null,'No se pudo completar el alta: '||coalesce(det->>'name','(sin nombre)'),
    coalesce(det->>'name','')||' · '||coalesce(new.email,'')||chr(10)||'Motivo: '||err||chr(10)||chr(10)
    ||'Confirmó el email pero el alta no se creó. Escribile para que la complete desde Vender con catálogo.',null,null,null,null);
  exception when others then null;
  end;
 end;
 return new;
end $$;

-- Guardado del estado (desde la definición vigente). Único cambio: el proveedor por aprobar ('pending')
-- conserva el rol 'vendor' para entrar a su panel; suspendido o rechazado pasa a 'buyer' como antes.
create or replace function public.fitness_save(payload jsonb, expected_revision bigint) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s jsonb; r bigint; p public.fitness_profiles; x jsonb; old jsonb; result jsonb; fields text[];
begin
 select * into p from public.fitness_profiles where id=auth.uid();
 if p.id is null or p.blocked then raise exception 'Necesitás iniciar sesión'; end if;
 select data,revision into s,r from public.fitness_state where id=true for update;
 if r<>expected_revision then raise exception 'Otro usuario actualizó los datos. Recargá la página antes de guardar.'; end if;
 if p.role='admin' then
  -- Ventas e identidades se mantienen por sus RPC; no se puede simular un cobro con un JSON.
  s:=s||public.fitness_pick(payload,array['commission','vendors','offers','buyers','ad','contact','images','catalog','spaces','content','prefs','invoiced','notifs','log','nextId']);
  s:=jsonb_set(s,'{buyers}',(select coalesce(jsonb_agg(public.fitness_clean(b)),'[]') from jsonb_array_elements(s->'buyers') b));
  update public.fitness_profiles fp set name=coalesce(b->>'name',fp.name) from jsonb_array_elements(s->'buyers') b where fp.id::text=b->>'id';
  s:=jsonb_set(s,'{vendors}',(select coalesce(jsonb_agg(public.fitness_clean(v)),'[]') from jsonb_array_elements(s->'vendors') v));
  update public.fitness_profiles fp set role=case when v->>'status' in ('active','pending') then 'vendor' else 'buyer' end from jsonb_array_elements(s->'vendors') v where fp.vendor_id=v->>'id' and fp.role<>'admin';
 elsif p.role='vendor' then
  fields:=array['name','type','cuit','contact','email','phone','razon','iva','role','wa','web','ig','address','city','prov','zones','hours','about','paymentBenefits','freeShipping','shipMode','act','logins','views','notifs','lowAt'];
  select value into x from jsonb_array_elements(payload->'vendors') where value->>'id'=p.vendor_id;
  if x is null then raise exception 'Proveedor no encontrado'; end if;
  s:=jsonb_set(s,'{vendors}',(select jsonb_agg(case when v->>'id'=p.vendor_id then v||public.fitness_pick(x,fields) else v end) from jsonb_array_elements(s->'vendors') v));
  result:='[]';
  for x in select value from jsonb_array_elements(s->'offers') loop
   if x->>'vendorId'<>p.vendor_id then result:=result||jsonb_build_array(x); end if;
  end loop;
  for x in select value from jsonb_array_elements(payload->'offers') where value->>'vendorId'=p.vendor_id loop
   select value into old from jsonb_array_elements(s->'offers') where value->>'id'=x->>'id';
   if old is not null and old->>'vendorId'<>p.vendor_id then raise exception 'Producto de otro proveedor'; end if;
   if old is null or public.fitness_pick(x,array['price','category','model','size','unit','detail','brand']) is distinct from public.fitness_pick(old,array['price','category','model','size','unit','detail','brand']) then x:=jsonb_set(x,'{status}','"review"');
   elsif old->>'status'<>'published' and x->>'status'='published' then raise exception 'Solo el administrador puede publicar'; end if;
   result:=result||jsonb_build_array(public.fitness_clean(x));
  end loop;
  -- Un producto con pedidos no se elimina; el proveedor lo puede pausar.
  if exists(select 1 from jsonb_array_elements(s->'offers') o where o->>'vendorId'=p.vendor_id and not exists(select 1 from jsonb_array_elements(result) z where z->>'id'=o->>'id') and exists(select 1 from jsonb_array_elements(s->'orders') z where z->>'offerId'=o->>'id')) then raise exception 'Pausá el producto: tiene pedidos asociados'; end if;
  s:=jsonb_set(s,'{offers}',result);
  -- Datos de despacho solamente para órdenes cuyo pago fue confirmado en el servidor.
  result:='[]';
  for old in select value from jsonb_array_elements(s->'orders') loop
   select value into x from jsonb_array_elements(payload->'orders') where value->>'id'=old->>'id';
   if x is not null and old->>'vendorId'=p.vendor_id and old->>'status'='approved' then old:=old||public.fitness_pick(x,array['shipped','shippedAt','carrier','tracking','trackingUrl','delivered','deliveredAt']); end if;
   result:=result||jsonb_build_array(old);
  end loop;
  s:=jsonb_set(s,'{orders}',result);
 else
  select value into x from jsonb_array_elements(payload->'buyers') where value->>'id'=p.id::text;
  if x is null then raise exception 'Cuenta no encontrada'; end if;
  x:=public.fitness_pick(x,array['name','contact','phone','cuit','iva','addresses','favs','marketing','logins'])||jsonb_build_object('id',p.id,'email',p.email,'via','email');
  update public.fitness_profiles set name=coalesce(x->>'name',name) where id=p.id;
  s:=jsonb_set(s,'{buyers}',(select coalesce(jsonb_agg(b),'[]') from jsonb_array_elements(s->'buyers') b where b->>'id'<>p.id::text)||jsonb_build_array(x));
 end if;
 if coalesce((s->>'commission')::numeric,-1)<0 or (s->>'commission')::numeric>=100 then raise exception 'Comisión inválida'; end if;
 if jsonb_array_length(s->'offers')<>(select count(distinct o->>'id') from jsonb_array_elements(s->'offers') o) then raise exception 'ID de producto duplicado'; end if;
 for x in select value from jsonb_array_elements(s->'offers') loop perform public.fitness_validate_offer(x); if not exists(select 1 from jsonb_array_elements(s->'vendors') v where v->>'id'=x->>'vendorId') then raise exception 'Proveedor inexistente';end if; end loop;
 for x in select value from jsonb_array_elements(s->'vendors') loop
  if coalesce(x->>'shipMode','fijo') not in ('fijo','coordinar') then raise exception 'Modo de envío inválido'; end if;
  if coalesce((x->'paymentBenefits'->>'transfer')::numeric,0)<0 or coalesce((x->'paymentBenefits'->>'transfer')::numeric,0)>=100 or coalesce((x->'paymentBenefits'->>'cash')::numeric,0)<0 or coalesce((x->'paymentBenefits'->>'cash')::numeric,0)>=100 then raise exception 'Descuento por pago inválido'; end if;
  if exists(select 1 from jsonb_array_elements(coalesce(x->'paymentBenefits'->'installments','[]')) n where (n#>>'{}')::numeric<>trunc((n#>>'{}')::numeric) or (n#>>'{}')::integer not between 2 and 24) then raise exception 'Cuotas inválidas'; end if;
 end loop;
 update public.fitness_state set data=s,revision=r+1 where id=true;
 return public.fitness_snapshot();
end $$;

-- Proveedores por aprobar que ya tienen cuenta: conservan el acceso a su panel.
update public.fitness_profiles fp set role='vendor'
 from public.fitness_state s cross join lateral jsonb_array_elements(coalesce(s.data->'vendors','[]'::jsonb)) v
 where s.id=true and fp.vendor_id=v->>'id' and v->>'status'='pending' and fp.role='buyer';

-- Estado para cada usuario (desde la definición vigente). Cambios:
-- a) En los pedidos sin pago confirmado ('approved') el proveedor no recibe nombre, email, teléfono ni dirección del
--    comprador; sí ciudad, provincia y CP para estimar el envío. Marca 'buyerHidden':true.
-- b) Visitantes, compradores y otros proveedores ya no reciben WhatsApp, web ni Instagram de los proveedores
--    (email, teléfono, dirección, contacto, CUIT y razón social ya no se enviaban).
-- El administrador y el propio proveedor ven todo; el comprador ve sus pedidos completos.
create or replace function public.fitness_snapshot() returns jsonb
language plpgsql security definer set search_path='' as $$
declare s jsonb; r bigint; p public.fitness_profiles; vs jsonb; os jsonb; bs jsonb; us jsonb;
begin
 select data,revision into s,r from public.fitness_state where id=true;
 select * into p from public.fitness_profiles where id=auth.uid();
 if p.blocked then raise exception 'Cuenta suspendida'; end if;
 if p.role='admin' then
  select coalesce(jsonb_agg(jsonb_build_object('id',id::text,'name',name,'user',email,'last','','role',role,'blocked',blocked)),'[]') into us from public.fitness_profiles where role='admin';
  select coalesce(jsonb_agg(coalesce((select b from jsonb_array_elements(s->'buyers') b where b->>'id'=fp.id::text),'{}'::jsonb)||jsonb_build_object('id',fp.id,'email',fp.email,'name',fp.name,'blocked',fp.blocked,'role',fp.role,'addresses',coalesce((select b->'addresses' from jsonb_array_elements(s->'buyers') b where b->>'id'=fp.id::text),'[]'::jsonb),'favs',coalesce((select b->'favs' from jsonb_array_elements(s->'buyers') b where b->>'id'=fp.id::text),'[]'::jsonb),'logins',coalesce((select b->'logins' from jsonb_array_elements(s->'buyers') b where b->>'id'=fp.id::text),'[]'::jsonb),'via','email')),'[]') into bs from public.fitness_profiles fp;
  return (s-'users'-'buyers')||jsonb_build_object('buyers',bs,'users',us,'_revision',r,'_identity',jsonb_build_object('id',p.id,'role',p.role,'vendorId',p.vendor_id,'email',p.email));
 end if;
 select coalesce(jsonb_agg(case when v->>'id'=p.vendor_id then public.fitness_clean(v) else public.fitness_pick(v,array['id','name','type','status','mp','commission','about','city','prov','hours','zones','paymentBenefits','freeShipping','shipMode','minOrderAmount','pricesIncludeVat']) end),'[]') into vs from jsonb_array_elements(s->'vendors') v where v->>'status'='active' or v->>'id'=p.vendor_id;
 select coalesce(jsonb_agg(case
   when p.role='vendor' and o->>'vendorId'=p.vendor_id and o->>'buyerId' is distinct from p.id::text and o->>'status' is distinct from 'approved'
   then (o-'buyer'-'buyerId'-'buyerName'-'buyerEmail'-'buyerPhone'-'email'-'phone'-'contact'-'cuit')
     ||jsonb_build_object('ship',public.fitness_pick(coalesce(o->'ship','{}'::jsonb),array['city','prov','province','cp','zone']),'buyerHidden',true)
   else o end),'[]') into os from jsonb_array_elements(s->'orders') o where (p.role='vendor' and o->>'vendorId'=p.vendor_id) or o->>'buyerId'=p.id::text;
 select coalesce(jsonb_agg(public.fitness_clean(b)),'[]') into bs from jsonb_array_elements(s->'buyers') b where b->>'id'=p.id::text;
 if p.id is not null and jsonb_array_length(bs)=0 then bs:=jsonb_build_array(jsonb_build_object('id',p.id,'name',p.name,'email',p.email,'addresses','[]'::jsonb,'favs','[]'::jsonb,'logins','[]'::jsonb,'phone','','contact','','cuit','','iva','Consumidor final','via','email')); end if;
 return public.fitness_pick(s,array['commission','nextId','catalog','spaces','content','images','ad','contact'])||jsonb_build_object(
  'vendors',vs,'offers',(select coalesce(jsonb_agg(o),'[]') from jsonb_array_elements(s->'offers') o where (p.role='vendor' and o->>'vendorId'=p.vendor_id) or (o->>'status'='published' and exists(select 1 from jsonb_array_elements(vs) v where v->>'id'=o->>'vendorId' and v->>'status'='active'))),
  'orders',os,'buyers',bs,'users','[]'::jsonb,'notifs','[]'::jsonb,'log','[]'::jsonb,'invoiced','{}'::jsonb,'prefs','{}'::jsonb,'clicks','{"p":{},"v":{},"a":{}}'::jsonb,'traffic','{"days":{},"q":{},"z":{}}'::jsonb,
  '_revision',r,'_identity',case when p.id is null then 'null'::jsonb else jsonb_build_object('id',p.id,'role',p.role,'vendorId',p.vendor_id,'email',p.email) end);
end $$;

-- Catálogo público (desde la definición vigente).
-- Importados: solo los que el administrador publicó (oferta 'published' del mismo proveedor con sourceKey = clave
-- del borrador) y que vinieron en la última importación. Cargados a mano: solo 'published' (antes también 'review').
-- Sin identidad del proveedor: en lugar de vendorId/vendorName va vendorRef (md5 del id con una sal fija, sirve para
-- agrupar sin revelar quién es), vendorType y vendorProvince. brand y model permiten comparar el mismo producto
-- entre proveedores. Orden por categoría, nombre y clave.
create or replace function public.fitness_public_catalog() returns jsonb
language sql stable security definer set search_path='' as $$
 with imported as (select jsonb_build_object(
  'vendorRef',md5((v->>'id')||'nexofit-vidriera'),'vendorType',nullif(v->>'type',''),'vendorProvince',nullif(v->>'prov',''),
  'key',d->>'key','name',d->>'name','category',d->>'sourceCategory',
  'brand',coalesce(nullif(po->>'brand',''),nullif(d->>'brand','')),'model',coalesce(nullif(po->>'model',''),d->>'name'),
  'properties',d->'properties','price',d->'price','units',d->'units',
  'offerId',(select o->>'id' from jsonb_array_elements(coalesce(s.data->'offers','[]'::jsonb)) o
    where o->>'vendorId'=v->>'id' and o->>'sourceKey'=d->>'key'
    and o->>'status'='published' and o->>'stock'<>'none'
    and (o->'units'='null'::jsonb or (o->>'units')::numeric>0)
    limit 1),
  'image',img.path
  ) as item
 from public.fitness_state s
 cross join lateral jsonb_array_elements(coalesce(s.data->'vendors','[]'::jsonb)) v
 cross join lateral jsonb_array_elements(coalesce(v->'catalogDrafts','[]'::jsonb)) d
 join lateral (select o2 as po from jsonb_array_elements(coalesce(s.data->'offers','[]'::jsonb)) o2
   where o2->>'vendorId'=v->>'id' and o2->>'sourceKey'=d->>'key' and o2->>'status'='published' limit 1) pub on true
 left join lateral (select i.path from public.fitness_product_images i
   where i.vendor_id=v->>'id' and i.status='aprobada'
   and (i.image_key=d->>'key' or i.image_key=coalesce(d->>'sourceSlug',split_part(d->>'key','#',1)))
   order by (i.image_key=d->>'key') desc limit 1) img on true
 where s.id=true and v->>'status'='active'
 and d->'hidden'='false'::jsonb and jsonb_typeof(d->'price')='number'
 and length(coalesce(d->>'name',''))>0
 and d->'ausenteEnUltimaImportacion' is distinct from 'true'::jsonb),
 manual as (select jsonb_build_object(
   'vendorRef',md5((v->>'id')||'nexofit-vidriera'),'vendorType',nullif(v->>'type',''),'vendorProvince',nullif(v->>'prov',''),'key',o->>'id',
   'name',o->>'model','category',o->>'category','brand',nullif(o->>'brand',''),'model',o->>'model',
   'properties',jsonb_build_array(jsonb_build_object('name','Variante','value',o->>'size')),
   'price',o->'price','units',o->'units',
   'offerId',case when o->>'status'='published' and o->>'stock'<>'none'
     and (o->'units'='null'::jsonb or (o->>'units')::numeric>0)
     then o->>'id' else null end,
   'image',img.path) as item
  from public.fitness_state s
  cross join lateral jsonb_array_elements(coalesce(s.data->'vendors','[]'::jsonb)) v
  cross join lateral jsonb_array_elements(coalesce(s.data->'offers','[]'::jsonb)) o
  left join lateral (select i.path from public.fitness_product_images i
    where i.vendor_id=v->>'id' and i.status='aprobada' and i.image_key=o->>'id' limit 1) img on true
  where s.id=true and v->>'status'='active' and o->>'vendorId'=v->>'id'
  and o->>'status'='published'
  and not exists(select 1 from jsonb_array_elements(coalesce(v->'catalogDrafts','[]'::jsonb)) d
    where d->>'key'=o->>'sourceKey'))
 select coalesce(jsonb_agg(item order by item->>'category',item->>'name',item->>'key'),'[]'::jsonb)
 from (select item from imported union all select item from manual) catalog;
$$;

-- Fotos (desde la definición vigente): las del proveedor quedan pendientes; las del administrador, publicadas.
create or replace function public.fitness_foto_set(p_vendor_id text, p_image_key text, p_slug text, p_path text, p_source text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare v_pref text := lower(regexp_replace(p_vendor_id,'[^A-Za-z0-9-]+','-','g'));
begin
 if not public.fitness_foto_puede(p_vendor_id) then raise exception 'No autorizado'; end if;
 if p_source not in ('tienda','proveedor') then raise exception 'Origen inválido'; end if;
 if length(coalesce(p_image_key,'')) not between 1 and 300 or length(coalesce(p_slug,'')) not between 1 and 200 then raise exception 'Producto inválido'; end if;
 -- Solo archivos de la carpeta de ese proveedor en R2.
 if position('..' in p_path)>0 or p_path !~ '^[a-z0-9-]+/[a-z0-9-]+/(tienda|proveedor)-[a-z0-9]+\.(jpg|png|webp)$'
    or split_part(p_path,'/',1) <> left(regexp_replace(regexp_replace(v_pref,'^-+|-+$','','g'),'^$','producto'),80) then
  raise exception 'Foto inválida';
 end if;
 return public.fitness_image_set(p_vendor_id,p_image_key,p_slug,p_path,p_source,
  case when public.fitness_es_admin() then 'aprobada' else 'pendiente' end);
end $$;

-- Fotos para revisar (todas las de proveedores, agrupadas por archivo: una foto de un modelo vale para sus variantes).
create or replace function public.fitness_fotos_por_revisar() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare res jsonb;
begin
 if not public.fitness_es_admin() then raise exception 'Solo el administrador puede hacer esto'; end if;
 select coalesce(jsonb_agg(f order by f->>'updatedAt'),'[]') into res from (
  select jsonb_build_object('vendorId',i.vendor_id,
   'vendorName',coalesce((select v->>'name' from public.fitness_state s cross join lateral jsonb_array_elements(coalesce(s.data->'vendors','[]'::jsonb)) v where s.id=true and v->>'id'=i.vendor_id limit 1),i.vendor_id),
   'path',i.path,'slug',min(i.slug),'source',min(i.source),'keys',jsonb_agg(i.image_key order by i.image_key),'updatedAt',max(i.updated_at)) f
  from public.fitness_product_images i where i.status='pendiente'
  group by i.vendor_id,i.path order by max(i.updated_at) limit 300) x;
 return res;
end $$;

create or replace function public.fitness_fotos_revisar(p_vendor_id text, p_path text, p_status text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 if not public.fitness_es_admin() then raise exception 'Solo el administrador puede hacer esto'; end if;
 if p_status not in ('aprobada','rechazada') then raise exception 'Estado inválido'; end if;
 update public.fitness_product_images set status=p_status,updated_at=now() where vendor_id=p_vendor_id and path=p_path;
 get diagnostics n = row_count;
 if n=0 then raise exception 'Foto inexistente'; end if;
 update public.fitness_state set revision=revision+1 where id=true;
 return jsonb_build_object('ok',true,'fotos',n);
end $$;

-- Reimportar combina por clave (desde la definición vigente): actualiza los campos del archivo, agrega las nuevas,
-- conserva lo que agregó el administrador en cada borrador y marca las que no vinieron con ausenteEnUltimaImportacion.
-- Las ofertas enlazadas por sourceKey no se tocan.
create or replace function public.fitness_import_catalog(vendor_id text, items jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare p public.fitness_profiles; s jsonb; v jsonb; x jsonb; drafts jsonb := '[]'; updated jsonb; seen text[] := '{}'; prev jsonb; old jsonb;
 campos text[] := array['key','name','sourceSlug','sourceCategory','properties','basePrice','promoPrice','price','units','hidden','description','brand','kind'];
begin
 select * into p from public.fitness_profiles where id=auth.uid();
 if p.id is null or p.blocked or (p.role<>'admin' and (p.role<>'vendor' or p.vendor_id is distinct from fitness_import_catalog.vendor_id)) then raise exception 'No autorizado'; end if;
 if jsonb_typeof(items) is distinct from 'array' or jsonb_array_length(items)<1 or jsonb_array_length(items)>5000 then raise exception 'Catálogo inválido'; end if;
 select data into s from public.fitness_state where id=true for update;
 select a into v from jsonb_array_elements(s->'vendors') a where a->>'id'=fitness_import_catalog.vendor_id;
 if v is null then raise exception 'Proveedor inexistente'; end if;
 select coalesce(jsonb_object_agg(a->>'key',a),'{}') into prev from jsonb_array_elements(coalesce(v->'catalogDrafts','[]'::jsonb)) a where a->>'key' is not null;
 for x in select a from jsonb_array_elements(items) a loop
  if jsonb_typeof(x)<>'object' or coalesce(length(x->>'key'),0) not between 1 and 1500 or coalesce(length(x->>'name'),0) not between 1 and 500 or (x->>'key')=any(seen) then raise exception 'Producto inválido o duplicado'; end if;
  if jsonb_typeof(x->'basePrice') is distinct from 'number' or (x->>'basePrice')::numeric<0 or jsonb_typeof(x->'price') is distinct from 'number' or (x->>'price')::numeric<0 then raise exception 'Precio inválido'; end if;
  if x->'promoPrice'<>'null'::jsonb and (jsonb_typeof(x->'promoPrice') is distinct from 'number' or (x->>'promoPrice')::numeric<0) then raise exception 'Promoción inválida'; end if;
  if x->'units' is distinct from 'null'::jsonb and (jsonb_typeof(x->'units') is distinct from 'number' or (x->>'units')::numeric<0 or (x->>'units')::numeric<>trunc((x->>'units')::numeric)) then raise exception 'Stock inválido'; end if;
  if jsonb_typeof(x->'hidden') is distinct from 'boolean' or jsonb_typeof(x->'properties') is distinct from 'array' or jsonb_array_length(x->'properties')>3 then raise exception 'Variante inválida'; end if;
  seen:=array_append(seen,x->>'key');
  old:=prev->(x->>'key');
  -- Lo del archivo se reemplaza entero; lo demás del borrador (marcas del administrador) se conserva.
  drafts:=drafts||jsonb_build_array((coalesce(old,'{}'::jsonb)-campos-'ausenteEnUltimaImportacion')||public.fitness_pick(x,campos));
 end loop;
 select drafts||coalesce(jsonb_agg(a||jsonb_build_object('ausenteEnUltimaImportacion',true)),'[]'::jsonb) into drafts
  from jsonb_array_elements(coalesce(v->'catalogDrafts','[]'::jsonb)) a where (a->>'key') is not null and (a->>'key') <> all(seen);
 if v->'catalogDrafts' is not distinct from drafts then return public.fitness_snapshot(); end if;
 v:=v||jsonb_build_object('catalogDrafts',drafts,'catalogImportedAt',clock_timestamp());
 select jsonb_agg(case when a->>'id'=fitness_import_catalog.vendor_id then v else a end) into updated from jsonb_array_elements(s->'vendors') a;
 update public.fitness_state set data=jsonb_set(s,'{vendors}',updated),revision=revision+1 where id=true;
 return public.fitness_snapshot();
end $$;

-- Red desde el catálogo (desde la definición vigente): también el proveedor por aprobar, pero entra pausado.
create or replace function public.fitness_red_desde_catalogo(s jsonb) returns integer
language plpgsql security definer set search_path='' as $$
declare v jsonb; n integer:=0; wa text; txt text; com numeric; mail text;
begin
 for v in select value from jsonb_array_elements(coalesce(s->'vendors','[]')) loop
  continue when coalesce(v->>'status','') not in ('active','pending') or coalesce(trim(v->>'name'),'')='';
  continue when exists(select 1 from public.fitness_red_proveedores r where lower(trim(r.nombre))=lower(trim(v->>'name')));
  wa:=regexp_replace(coalesce(v->>'wa',''),'\D','','g');
  if wa<>'' and wa !~ '^54' then wa:='549'||regexp_replace(wa,'^0',''); elsif wa ~ '^54' and wa !~ '^549' then wa:='549'||substr(wa,3); end if;
  mail:=nullif(left(lower(trim(coalesce(v->>'email',''))),160),'');
  -- Mismo proveedor con otro nombre (ej. "GOOD PADEL" y "GOOD PÁDEL"): no se duplica.
  continue when exists(select 1 from public.fitness_red_proveedores r where (mail is not null and lower(trim(r.email))=mail) or (wa<>'' and r.whatsapp=wa));
  select string_agg(coalesce(o->>'model','')||' '||coalesce(o->>'category',''),' ') into txt from jsonb_array_elements(coalesce(s->'offers','[]')) o where o->>'vendorId'=v->>'id';
  txt:=coalesce(v->>'about','')||' '||coalesce(v->>'name','')||' '||coalesce(txt,'');
  com:=case when coalesce(v->>'commission','') ~ '^[0-9]+(\.[0-9]+)?$' then (v->>'commission')::numeric end;
  insert into public.fitness_red_proveedores(nombre,contacto,whatsapp,email,rubros,zonas,activo,origen,cuit,tipo,localidad,comision,notas)
  values (left(trim(v->>'name'),120), nullif(left(coalesce(v->>'contact',''),120),''), nullif(left(wa,30),''), mail,
   public.fitness_red_rubros(txt), array['todo'], false, 'web', nullif(left(regexp_replace(coalesce(v->>'cuit',''),'\D','','g'),13),''), nullif(left(coalesce(v->>'type',''),40),''),
   nullif(left(concat_ws(', ',nullif(v->>'city',''),nullif(v->>'prov','')),80),''), case when com between 0 and 100 then com end,
   'Se registró con Vender con catálogo. Queda pausado hasta que lo apruebes en Proveedores. Revisá rubros y zonas.');
  n:=n+1;
 end loop;
 return n;
end $$;

-- Fichas de la red que corresponden a un proveedor del catálogo: mismo nombre, email o WhatsApp.
create or replace function public.fitness_red_ids_proveedor(v jsonb) returns setof bigint
language sql stable security definer set search_path='' as $$
 select r.id from public.fitness_red_proveedores r
 where lower(trim(r.nombre))=lower(trim(coalesce(v->>'name','')))
  or (nullif(lower(trim(coalesce(v->>'email',''))),'') is not null and lower(trim(r.email))=lower(trim(v->>'email')))
  or (public.fitness_wa_ar(v->>'wa') is not null and r.whatsapp=public.fitness_wa_ar(v->>'wa'))
$$;

-- Aprobar un proveedor: queda activo en el catálogo y su ficha de la red pasa a recibir pedidos.
create or replace function public.fitness_proveedor_aprobar(p_vendor_id text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s jsonb; v jsonb; n integer;
begin
 if not public.fitness_es_admin() then raise exception 'Solo el administrador puede hacer esto'; end if;
 select data into s from public.fitness_state where id=true for update;
 select a into v from jsonb_array_elements(coalesce(s->'vendors','[]'::jsonb)) a where a->>'id'=p_vendor_id;
 if v is null then raise exception 'Proveedor inexistente'; end if;
 if coalesce(v->>'status','')<>'active' then
  v:=v||jsonb_build_object('status','active');
  s:=jsonb_set(s,'{vendors}',(select jsonb_agg(case when a->>'id'=p_vendor_id then v else a end) from jsonb_array_elements(s->'vendors') a));
  update public.fitness_state set data=s,revision=revision+1 where id=true; -- el disparador lo suma a la red si falta
 else
  perform public.fitness_red_desde_catalogo(s);
 end if;
 update public.fitness_profiles set role='vendor' where vendor_id=p_vendor_id and role<>'admin';
 update public.fitness_red_proveedores r set activo=true,updated_at=now()
  where not r.activo and r.id in (select public.fitness_red_ids_proveedor(v));
 get diagnostics n = row_count;
 return jsonb_build_object('ok',true,'red',n);
end $$;

-- Suspender o rechazar un proveedor (desde el administrador o por cualquier guardado del estado) pausa su ficha de
-- la red: deja de recibir pedidos. Se vuelve a activar al aprobarlo/reactivarlo (fitness_proveedor_aprobar).
create or replace function public.fitness_red_pausar_suspendidos_trg() returns trigger
language plpgsql security definer set search_path='' as $$
declare v jsonb; antes text;
begin
 begin
  for v in select value from jsonb_array_elements(coalesce(new.data->'vendors','[]'::jsonb)) loop
   continue when coalesce(v->>'status','') not in ('suspended','rejected');
   antes := null;
   select a->>'status' into antes from jsonb_array_elements(coalesce(old.data->'vendors','[]'::jsonb)) a where a->>'id'=v->>'id' limit 1;
   continue when antes is not distinct from v->>'status';
   update public.fitness_red_proveedores set activo=false,updated_at=now()
    where activo and id in (select public.fitness_red_ids_proveedor(v));
  end loop;
 exception when others then
  raise warning 'red pausar suspendidos: %', sqlerrm; -- nunca frena el guardado del estado
 end;
 return new;
end $$;
drop trigger if exists fitness_red_pausar_suspendidos on public.fitness_state;
create trigger fitness_red_pausar_suspendidos after update of data on public.fitness_state
 for each row execute function public.fitness_red_pausar_suspendidos_trg();

-- Postulación a la red (desde la definición vigente, 20261030140000_rubro_crossfit.sql): el CUIT, si se carga,
-- tiene que tener el dígito verificador correcto.
create or replace function public.fitness_red_postular(p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 v_nombre text := btrim(coalesce(p->>'nombre',''));
 v_contacto text := btrim(coalesce(p->>'contacto',''));
 v_wa text := public.fitness_wa_ar(p->>'whatsapp');
 v_email text := lower(btrim(coalesce(p->>'email','')));
 v_cuit text := nullif(regexp_replace(coalesce(p->>'cuit',''),'[^0-9]','','g'),'');
 v_tipo text := nullif(btrim(coalesce(p->>'tipo','')),'');
 v_loc text := nullif(btrim(coalesce(p->>'localidad','')),'');
 v_rubros text[]; v_zonas text[]; v_id bigint; v_lista text;
begin
 if coalesce(p->>'web','')<>'' then return jsonb_build_object('ok',true); end if;
 if length(v_nombre) not between 2 and 120 then raise exception 'Escribí el nombre de tu empresa'; end if;
 if length(v_contacto) not between 2 and 120 then raise exception 'Escribí el nombre de la persona de contacto'; end if;
 if coalesce(v_wa,'') !~ '^549[0-9]{10}$' then raise exception 'Revisá el WhatsApp: código de área y número, 10 dígitos (ej. 11 2345 6789)'; end if;
 if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email)>160 then raise exception 'Revisá el email'; end if;
 if v_cuit is not null and length(v_cuit)<>11 then raise exception 'El CUIT tiene 11 dígitos'; end if;
 if v_cuit is not null and not public.fitness_cuit_valido(v_cuit) then raise exception 'Revisá el CUIT: el último número no coincide. Copialo de tu constancia de AFIP (ej. 20-12345678-6)'; end if;
 if v_tipo is not null and v_tipo not in ('Fabricante','Importador','Distribuidor','Comercio') then v_tipo := null; end if;
 if v_loc is not null and length(v_loc)>80 then raise exception 'Revisá la localidad'; end if;
 select coalesce(array_agg(distinct x),'{}') into v_rubros from jsonb_array_elements_text(coalesce(p->'rubros','[]')) x
  where x in ('musculacion','funcional','crossfit','colchonetas','deportes','entrenamiento','atletismo','escolar','boxeo','natacion','rehabilitacion','cesped');
 if cardinality(v_rubros)=0 then raise exception 'Marcá al menos un rubro'; end if;
 select coalesce(array_agg(distinct btrim(x)),'{}') into v_zonas from jsonb_array_elements_text(coalesce(p->'zonas','[]')) x where length(btrim(x)) between 2 and 40;
 if cardinality(v_zonas)=0 or cardinality(v_zonas)>24 then v_zonas := '{todo}'; end if;
 if (select count(*) from public.fitness_red_proveedores where origen='web' and created_at>now()-interval '1 hour')>=20 then
  raise exception 'Recibimos muchas postulaciones. Probá de nuevo en un rato';
 end if;
 if exists(select 1 from public.fitness_red_proveedores where whatsapp=v_wa or email=v_email) then
  return jsonb_build_object('ok',true);
 end if;
 insert into public.fitness_red_proveedores(nombre,contacto,whatsapp,email,rubros,zonas,activo,origen,cuit,tipo,localidad)
 values(v_nombre,v_contacto,v_wa,v_email,v_rubros,v_zonas,false,'web',v_cuit,v_tipo,v_loc)
 returning id into v_id;
 begin
  select string_agg(x,', ') into v_lista from unnest(v_rubros) x;
  perform public.fitness_aviso_encolar('proveedor_nuevo',null,'Nuevo proveedor para la red: '||v_nombre,
   v_nombre||coalesce(' ('||v_tipo||')','')||chr(10)||'Contacto: '||v_contacto||' · WhatsApp +'||v_wa||' · '||v_email||chr(10)
   ||'Rubros: '||coalesce(v_lista,'-')||chr(10)||'Entrega en: '||array_to_string(v_zonas,', ')||chr(10)||chr(10)
   ||'Está pausado hasta que lo actives en el panel: Solicitudes → Red de proveedores.',null,null,null,null);
 exception when others then raise warning 'fitness_red_postular aviso: %', sqlerrm;
 end;
 return jsonb_build_object('ok',true);
end $$;

revoke all on function public.fitness_cuit_valido(text) from public;
grant execute on function public.fitness_cuit_valido(text) to anon, authenticated;
revoke all on function public.fitness_alta_proveedor(uuid,jsonb) from public, anon, authenticated;
revoke all on function public.fitness_alta_pendiente_trg() from public, anon, authenticated;
revoke all on function public.fitness_red_ids_proveedor(jsonb) from public, anon, authenticated;
revoke all on function public.fitness_red_pausar_suspendidos_trg() from public, anon, authenticated;
revoke all on function public.fitness_red_postular(jsonb) from public;
grant execute on function public.fitness_red_postular(jsonb) to anon, authenticated;
revoke all on function public.fitness_red_desde_catalogo(jsonb) from public, anon, authenticated;
revoke all on function public.fitness_public_catalog() from public;
grant execute on function public.fitness_public_catalog() to anon, authenticated;
revoke all on function public.fitness_foto_set(text,text,text,text,text) from public, anon;
grant execute on function public.fitness_foto_set(text,text,text,text,text) to authenticated;
revoke all on function public.fitness_import_catalog(text,jsonb) from public, anon;
grant execute on function public.fitness_import_catalog(text,jsonb) to authenticated;
revoke all on function public.fitness_fotos_por_revisar() from public, anon;
revoke all on function public.fitness_fotos_revisar(text,text,text) from public, anon;
revoke all on function public.fitness_proveedor_aprobar(text) from public, anon;
grant execute on function public.fitness_fotos_por_revisar(), public.fitness_fotos_revisar(text,text,text), public.fitness_proveedor_aprobar(text) to authenticated;
-- fitness_save y fitness_snapshot conservan sus permisos (create or replace no los cambia).
commit;

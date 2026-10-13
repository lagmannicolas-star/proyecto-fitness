-- AB Fitness: ficha comercial. No crea credenciales ni confirma correos.
begin;
do $$
declare s jsonb; v jsonb; vid text; info jsonb;
begin
 select data into s from public.fitness_state where id=true for update;
 select x into v from jsonb_array_elements(s->'vendors') x where lower(x->>'email')='abfitness.ventas@gmail.com' limit 1;
 vid:=coalesce(v->>'id','ab_fitness');
 info:=jsonb_build_object('name','AB Fitness','razon','ABADI SEBASTIAN','cuit','20348009622','email','abfitness.ventas@gmail.com','user','abfitness.ventas@gmail.com','web','https://abfitnessmayorista.com.ar','type','Fabricante','minOrderAmount',40000,'pricesIncludeVat',true,'freeShipping',jsonb_build_object('mode','from','zone','amba','threshold',50000,'postalCodes',jsonb_build_array()),'about','Equipamiento deportivo. Precios con IVA incluido. Compra mínima $40.000. Envío gratis desde $50.000 a CABA y alrededores, sujeto a cobertura confirmada.');
 if v is null then
  v:=info||jsonb_build_object('id',vid,'status','active','mp',false,'commission',null,'since',current_date,'logins','[]'::jsonb,'act','[]'::jsonb,'notifs','[]'::jsonb);
  s:=jsonb_set(s,'{vendors}',(s->'vendors')||jsonb_build_array(v));
 else
  s:=jsonb_set(s,'{vendors}',(select jsonb_agg(case when x->>'id'=vid then x||info else x end) from jsonb_array_elements(s->'vendors') x));
 end if;
 update public.fitness_state set data=s,revision=revision+1 where id=true;
 update public.fitness_profiles p set vendor_id=vid,role=case when p.role='admin' then 'admin' else 'vendor' end from auth.users u where u.id=p.id and lower(u.email)='abfitness.ventas@gmail.com' and u.email_confirmed_at is not null and p.vendor_id is null and not p.blocked;
end $$;
create or replace function public.fitness_link_registered_vendor() returns trigger language plpgsql security definer set search_path='' as $$
declare vid text;
begin
 if new.email_confirmed_at is null then return new; end if;
 select x->>'id' into vid from public.fitness_state s cross join lateral jsonb_array_elements(s.data->'vendors') x where s.id=true and lower(x->>'email')=lower(new.email) and x->>'status'='active' limit 1;
 if vid is not null then
  update public.fitness_profiles set vendor_id=vid,role=case when role='admin' then 'admin' else 'vendor' end where id=new.id and vendor_id is null and not blocked;
 end if;
 return new;
end $$;
drop trigger if exists fitness_z_link_registered_vendor on auth.users;
-- Se ejecuta después del trigger que crea o actualiza el perfil.
create trigger fitness_z_link_registered_vendor after insert or update of email,email_confirmed_at on auth.users for each row execute function public.fitness_link_registered_vendor();
revoke all on function public.fitness_link_registered_vendor() from public,anon,authenticated;

create or replace function public.fitness_snapshot() returns jsonb language plpgsql security definer set search_path='' as $$
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
 select coalesce(jsonb_agg(case when v->>'id'=p.vendor_id then public.fitness_clean(v) else public.fitness_pick(v,array['id','name','type','status','mp','commission','about','city','prov','wa','web','ig','hours','zones','paymentBenefits','freeShipping','minOrderAmount','pricesIncludeVat']) end),'[]') into vs from jsonb_array_elements(s->'vendors') v where v->>'status'='active' or v->>'id'=p.vendor_id;
 select coalesce(jsonb_agg(o),'[]') into os from jsonb_array_elements(s->'orders') o where (p.role='vendor' and o->>'vendorId'=p.vendor_id) or o->>'buyerId'=p.id::text;
 select coalesce(jsonb_agg(public.fitness_clean(b)),'[]') into bs from jsonb_array_elements(s->'buyers') b where b->>'id'=p.id::text;
 if p.id is not null and jsonb_array_length(bs)=0 then bs:=jsonb_build_array(jsonb_build_object('id',p.id,'name',p.name,'email',p.email,'addresses','[]'::jsonb,'favs','[]'::jsonb,'logins','[]'::jsonb,'phone','','contact','','cuit','','iva','Consumidor final','via','email')); end if;
 return public.fitness_pick(s,array['commission','nextId','catalog','spaces','content','images','ad','contact'])||jsonb_build_object(
  'vendors',vs,'offers',(select coalesce(jsonb_agg(o),'[]') from jsonb_array_elements(s->'offers') o where (p.role='vendor' and o->>'vendorId'=p.vendor_id) or (o->>'status'='published' and exists(select 1 from jsonb_array_elements(vs) v where v->>'id'=o->>'vendorId' and v->>'status'='active'))),
  'orders',os,'buyers',bs,'users','[]'::jsonb,'notifs','[]'::jsonb,'log','[]'::jsonb,'invoiced','{}'::jsonb,'prefs','{}'::jsonb,'clicks','{"p":{},"v":{},"a":{}}'::jsonb,'traffic','{"days":{},"q":{},"z":{}}'::jsonb,
  '_revision',r,'_identity',case when p.id is null then 'null'::jsonb else jsonb_build_object('id',p.id,'role',p.role,'vendorId',p.vendor_id,'email',p.email) end);
end $$;
create or replace function public.fitness_reserve(items jsonb, ship jsonb, request_key text) returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.fitness_profiles; s jsonb; x jsonb; o jsonb; v jsonb; b jsonb; f jsonb; method text; cp text; z text; qty integer; pct numeric; base numeric; vol numeric; sub numeric; pd numeric; ds numeric; sh numeric; rows jsonb:='[]'; item_row jsonb; vid text; ord jsonb; result jsonb:='[]'; n integer; group_sub numeric; group_ship numeric; first_one boolean;
begin
 select * into p from public.fitness_profiles where id=auth.uid();
 if p.id is null or p.blocked then raise exception 'Ingresá a tu cuenta para registrar un pedido'; end if;
 if length(request_key)<16 or length(request_key)>100 then raise exception 'Identificador de pedido inválido'; end if;
 select data into s from public.fitness_state where id=true for update;
 -- La misma clave devuelve el resultado original, aunque la primera respuesta se pierda.
 select coalesce(jsonb_agg(value),'[]') into result from jsonb_array_elements(s->'orders') where value->>'requestKey'=request_key and value->>'buyerId'=p.id::text;
 if jsonb_array_length(result)>0 then return result; end if;
 result:='[]';s:=public.fitness_release_expired(s);
 if jsonb_typeof(items)<>'array' or jsonb_array_length(items)<1 or jsonb_array_length(items)>100 then raise exception 'Carrito inválido'; end if;
 if (select count(distinct value->>'id') from jsonb_array_elements(items))<>jsonb_array_length(items) then raise exception 'Producto repetido en el pedido'; end if;
 cp:=ship->>'cp';if cp is null or cp !~ '^[0-9]{4}$' or length(coalesce(ship->>'address',''))<3 or length(coalesce(ship->>'city',''))<2 or length(coalesce(ship->>'name',''))<2 then raise exception 'Completá nombre, dirección, ciudad y código postal'; end if;
 z:=case when cp like '1___' then 'amba' else 'interior' end;
 for x in select value from jsonb_array_elements(items) loop
  if coalesce(x->>'qty','') !~ '^[1-9][0-9]{0,5}$' then raise exception 'Cantidad inválida'; end if;qty:=(x->>'qty')::integer;
  select value into o from jsonb_array_elements(s->'offers') where value->>'id'=x->>'id';
  select value into v from jsonb_array_elements(s->'vendors') where value->>'id'=o->>'vendorId';
  if o is null or v is null or o->>'status'<>'published' or v->>'status'<>'active' or o->>'stock'='none' then raise exception 'Producto no disponible'; end if;
  if qty<coalesce((o->>'minQty')::integer,1) or (o->'units'<>'null'::jsonb and qty>(o->>'units')::integer) then raise exception 'Stock o mínimo de compra no disponible'; end if;
  if (x->>'expectedPrice')::numeric is distinct from (o->>'price')::numeric then raise exception 'El precio cambió. Recargá el carrito.'; end if;
  method:=coalesce(x->>'method','card');b:=coalesce(v->'paymentBenefits','{}');
  if method not in ('card','transfer','cash') and not (method ~ '^installments-[0-9]+$' and coalesce(b->'installments','[]') @> jsonb_build_array(split_part(method,'-',2)::integer)) then raise exception 'Medio de pago no habilitado'; end if;
  pd:=case method when 'transfer' then coalesce((b->>'transfer')::numeric,0) when 'cash' then coalesce((b->>'cash')::numeric,0) else 0 end;
  if method in ('transfer','cash') and pd<=0 then raise exception 'Medio de pago no habilitado'; end if;
  select coalesce(max((t->>'pct')::numeric),0) into pct from jsonb_array_elements(coalesce(o->'volumeTiers','[]')) t where qty>=(t->>'qty')::integer;
  if pd>0 and not coalesce((b->>'stackVolume')::boolean,true) then pct:=0; end if;
  base:=round((o->>'price')::numeric*qty,2);vol:=round(base*pct/100,2);sub:=base-vol;ds:=round(sub*pd/100,2);sub:=sub-ds;
  sh:=coalesce((o->>case when z='amba' then 'shipAmba' else 'shipInt' end)::numeric,0);
  rows:=rows||jsonb_build_array(jsonb_build_object('offer',o,'vendor',v,'qty',qty,'subtotal',sub,'baseSubtotal',base,'discount',vol,'discountPct',pct,'paymentDiscount',ds,'paymentPct',pd,'paymentMethod',method,'baseShipping',sh));
 end loop;
 -- Evita que un mismo proveedor reciba medios de pago contradictorios en un carrito.
 if exists(select 1 from jsonb_array_elements(rows) t group by t->'vendor'->>'id' having count(distinct t->>'paymentMethod')>1) then raise exception 'Elegí un único medio de pago por proveedor'; end if;
 n:=coalesce((s->>'nextOrder')::integer,1);
 for vid in select distinct value->'vendor'->>'id' from jsonb_array_elements(rows) loop
  select sum((value->>'subtotal')::numeric),max((value->>'baseShipping')::numeric) into group_sub,group_ship from jsonb_array_elements(rows) where value->'vendor'->>'id'=vid;
  select value->'vendor' into v from jsonb_array_elements(rows) where value->'vendor'->>'id'=vid limit 1;f:=coalesce(v->'freeShipping','{}');
  if not (f->>'zone'='amba' and jsonb_array_length(coalesce(f->'postalCodes','[]'))=0) and (f->>'zone'='all' or f->>'zone'=z) and (jsonb_array_length(coalesce(f->'postalCodes','[]'))=0 or f->'postalCodes' @> jsonb_build_array(cp)) and (f->>'mode'='always' or (f->>'mode'='from' and group_sub>=(f->>'threshold')::numeric)) then group_ship:=0; end if;
  if group_sub<coalesce((v->>'minOrderAmount')::numeric,0) then raise exception 'La compra mínima de % es $% en productos, sin envío',v->>'name',v->>'minOrderAmount'; end if;
  first_one:=true;
  for item_row in select value from jsonb_array_elements(rows) where value->'vendor'->>'id'=vid loop
   o:=item_row->'offer';qty:=(item_row->>'qty')::integer;
   ord:=public.fitness_pick(item_row,array['qty','subtotal','baseSubtotal','discount','discountPct','paymentDiscount','paymentPct','paymentMethod'])||jsonb_build_object('id',n,'date',current_date,'buyer',ship->>'name','buyerId',p.id,'vendorId',vid,'offerId',o->>'id','desc',(o->>'category')||': '||(o->>'model')||', '||(o->>'size'),'ship',ship||jsonb_build_object('email',p.email),'lead',o->'lead','shipping',case when first_one then group_ship else 0 end,'pct',coalesce((v->>'commission')::numeric,(s->>'commission')::numeric),'commission',round((item_row->>'subtotal')::numeric*coalesce((v->>'commission')::numeric,(s->>'commission')::numeric)/100,2),'status','pending_payment','shipped',false,'requestKey',request_key,'payRef',request_key,'expiresAt',now()+interval '30 minutes');
   result:=result||jsonb_build_array(ord);n:=n+1;first_one:=false;
   s:=jsonb_set(s,'{offers}',(select jsonb_agg(case when z0->>'id'=o->>'id' and z0->'units'<>'null'::jsonb then z0||jsonb_build_object('units',(z0->>'units')::integer-qty,'stock',case when (z0->>'units')::integer-qty=0 then 'none' else z0->>'stock' end) else z0 end) from jsonb_array_elements(s->'offers') z0));
  end loop;
 end loop;
 s:=s||jsonb_build_object('orders',result||(s->'orders'),'nextOrder',n);
 update public.fitness_state set data=s,revision=revision+1 where id=true;
 return result;
end $$;
commit;

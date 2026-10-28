-- Cada pedido de ofertas llega solo a los proveedores del rubro de lo que se pide.
-- 1) El rubro de cada producto sale de su nombre y detalle (fitness_red_rubros, ahora con más palabras de musculación y pádel).
-- 2) Si algún producto del pedido no encaja en ningún rubro, el pedido llega a toda la red (para no perder ofertas).
-- 3) Los proveedores sin rubros cargados reciben todos los pedidos hasta que se les carguen.
-- 4) Un proveedor que se registra en el catálogo no se duplica en la red si ya está con el mismo email o WhatsApp.
begin;

create or replace function public.fitness_red_rubros(txt text) returns text[] language sql immutable set search_path='' as $$
 select coalesce(array_agg(r order by r),'{}') from (values
  ('musculacion','mancuern|disco|barra|banco|rack|jaula|pesa|prensa|\mhack|sill[oó]n|polea|cu[aá]driceps|femoral|smith|multiestaci|multigym'),
  ('funcional','rusa|kettlebell|caj[oó]n|banda|corebag|medicine|soga|suspensi|step|bumper|funcional'),
  ('colchonetas','colchonet|\mmats?\M|yoga|pilates|bloque'),
  ('deportes','pelota|red de|arco|palo|bocha|hockey|f[uú]tbol|b[aá]squet|v[oó]ley|p[aá]del|paleta|raqueta|tenis'),
  ('entrenamiento','cono|escalera|valla|\maros?\M|pechera|cron[oó]metro'),
  ('atletismo','atletismo|taco|jabalina|bala de'),
  ('escolar','psicomotric|blanda|escolar|t[uú]nel|jard[ií]n'),
  ('boxeo','guante|boxeo|venda|bolsa de|artes marciales'),
  ('natacion','nataci|antiparra|tabla de nado|pileta'),
  ('rehabilitacion','rehabilit|tobillera|protecci|kinesi'),
  ('cesped','c[eé]sped|pasto sint')
 ) as t(r,pat) where lower(coalesce(txt,'')) ~ pat
$$;

-- Rubros de un pedido. null = algún producto no tiene rubro reconocible: va a toda la red.
create or replace function public.fitness_sol_rubros(p_items jsonb) returns text[]
language plpgsql immutable set search_path='' as $$
declare it jsonb; r text[]; acc text[] := '{}';
begin
 for it in select * from jsonb_array_elements(coalesce(p_items,'[]'::jsonb)) loop
  r := public.fitness_red_rubros(coalesce(it->>'producto','')||' '||coalesce(it->>'detalle',''));
  if cardinality(r)=0 then return null; end if;
  acc := acc || r;
 end loop;
 if cardinality(acc)=0 then return null; end if;
 return (select array_agg(distinct x order by x) from unnest(acc) x);
end $$;

create or replace function public.fitness_invitar_toda_la_red(p_code text) returns integer
language plpgsql security definer set search_path='' as $$
declare n integer; v_prueba boolean; v_rubros text[];
begin
 select es_prueba, public.fitness_sol_rubros(items) into v_prueba, v_rubros from public.fitness_solicitudes where code=p_code;
 insert into public.fitness_invitaciones(solicitud_code,proveedor_id,token)
 select p_code, r.id, replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','')
 from public.fitness_red_proveedores r where r.activo and r.es_prueba = coalesce(v_prueba,false)
  and (v_rubros is null or cardinality(r.rubros)=0 or r.rubros && v_rubros)
 on conflict (solicitud_code,proveedor_id) do nothing;
 get diagnostics n = row_count;
 update public.fitness_solicitudes set
  proveedores_consultados = least(99,(select count(*) from public.fitness_invitaciones i where i.solicitud_code=p_code)),
  updated_at = now()
 where code=p_code;
 return n;
end $$;

create or replace function public.fitness_red_activo_trg() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.activo and (tg_op='INSERT' or not coalesce(old.activo,false)) then
  begin
   insert into public.fitness_invitaciones(solicitud_code,proveedor_id,token)
   select s.code, new.id, replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','')
   from public.fitness_solicitudes s where s.status in ('nueva','enviada','con_ofertas') and s.es_prueba = new.es_prueba
    and (cardinality(new.rubros)=0 or public.fitness_sol_rubros(s.items) is null or new.rubros && public.fitness_sol_rubros(s.items))
   on conflict (solicitud_code,proveedor_id) do nothing;
   update public.fitness_solicitudes s set proveedores_consultados=least(99,(select count(*) from public.fitness_invitaciones i where i.solicitud_code=s.code))
   where s.status in ('nueva','enviada','con_ofertas');
  exception when others then raise warning 'red activo: %', sqlerrm;
  end;
 end if;
 return new;
end $$;

create or replace function public.fitness_red_desde_catalogo(s jsonb) returns integer
language plpgsql security definer set search_path='' as $$
declare v jsonb; n integer:=0; wa text; txt text; com numeric; mail text;
begin
 for v in select value from jsonb_array_elements(coalesce(s->'vendors','[]')) loop
  continue when coalesce(v->>'status','')<>'active' or coalesce(trim(v->>'name'),'')='';
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
   public.fitness_red_rubros(txt), array['todo'], true, 'web', nullif(left(regexp_replace(coalesce(v->>'cuit',''),'\D','','g'),13),''), nullif(left(coalesce(v->>'type',''),40),''),
   nullif(left(concat_ws(', ',nullif(v->>'city',''),nullif(v->>'prov','')),80),''), case when com between 0 and 100 then com end,
   'Se registró como proveedor del catálogo y entró solo a la red. Revisá rubros y zonas.');
  n:=n+1;
 end loop;
 return n;
end $$;

revoke all on function public.fitness_sol_rubros(jsonb) from public, anon, authenticated;
commit;

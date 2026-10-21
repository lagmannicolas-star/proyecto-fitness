-- Todo proveedor activo del catálogo (registrado en /proveedores) entra también a la red de "Pedí ofertas".
-- Antes eran dos listas separadas y quien se registraba en el catálogo no aparecía en la red.
-- Rubros: se deducen de lo que vende (descripción y productos cargados); el admin los puede corregir.

create or replace function public.fitness_red_rubros(txt text) returns text[] language sql immutable set search_path='' as $$
 select coalesce(array_agg(r order by r),'{}') from (values
  ('musculacion','mancuern|disco|barra|banco|rack|jaula|pesa'),
  ('funcional','rusa|kettlebell|caj[oó]n|banda|corebag|medicine|soga|suspensi|step|bumper|funcional'),
  ('colchonetas','colchonet|\mmats?\M|yoga|pilates|bloque'),
  ('deportes','pelota|red de|arco|palo|bocha|hockey|f[uú]tbol|b[aá]squet|v[oó]ley'),
  ('entrenamiento','cono|escalera|valla|\maros?\M|pechera|cron[oó]metro'),
  ('atletismo','atletismo|taco|jabalina|bala de'),
  ('escolar','psicomotric|blanda|escolar|t[uú]nel|jard[ií]n'),
  ('boxeo','guante|boxeo|venda|bolsa de|artes marciales'),
  ('natacion','nataci|antiparra|tabla de nado|pileta'),
  ('rehabilitacion','rehabilit|tobillera|protecci|kinesi')
 ) as t(r,pat) where lower(coalesce(txt,'')) ~ pat
$$;

create or replace function public.fitness_red_desde_catalogo(s jsonb) returns integer language plpgsql security definer set search_path='' as $$
declare v jsonb; n integer:=0; wa text; txt text; com numeric;
begin
 for v in select value from jsonb_array_elements(coalesce(s->'vendors','[]')) loop
  continue when coalesce(v->>'status','')<>'active' or coalesce(trim(v->>'name'),'')='';
  continue when exists(select 1 from public.fitness_red_proveedores r where lower(trim(r.nombre))=lower(trim(v->>'name')));
  wa:=regexp_replace(coalesce(v->>'wa',''),'\D','','g');
  if wa<>'' and wa !~ '^54' then wa:='549'||regexp_replace(wa,'^0',''); elsif wa ~ '^54' and wa !~ '^549' then wa:='549'||substr(wa,3); end if;
  select string_agg(coalesce(o->>'model','')||' '||coalesce(o->>'category',''),' ') into txt from jsonb_array_elements(coalesce(s->'offers','[]')) o where o->>'vendorId'=v->>'id';
  txt:=coalesce(v->>'about','')||' '||coalesce(v->>'name','')||' '||coalesce(txt,'');
  com:=case when coalesce(v->>'commission','') ~ '^[0-9]+(\.[0-9]+)?$' then (v->>'commission')::numeric end;
  insert into public.fitness_red_proveedores(nombre,contacto,whatsapp,email,rubros,zonas,activo,origen,cuit,tipo,localidad,comision,notas)
  values (left(trim(v->>'name'),120), nullif(left(coalesce(v->>'contact',''),120),''), nullif(left(wa,30),''), nullif(left(lower(coalesce(v->>'email','')),160),''),
   public.fitness_red_rubros(txt), array['todo'], true, 'web', nullif(left(regexp_replace(coalesce(v->>'cuit',''),'\D','','g'),13),''), nullif(left(coalesce(v->>'type',''),40),''),
   nullif(left(concat_ws(', ',nullif(v->>'city',''),nullif(v->>'prov','')),80),''), case when com between 0 and 100 then com end,
   'Se registró como proveedor del catálogo y entró solo a la red. Revisá rubros y zonas.');
  n:=n+1;
 end loop;
 return n;
end $$;

create or replace function public.fitness_red_desde_catalogo_trg() returns trigger language plpgsql security definer set search_path='' as $$
begin
 begin
  perform public.fitness_red_desde_catalogo(new.data);
 exception when others then
  raise warning 'red desde catálogo: %', sqlerrm; -- nunca frena el guardado del estado
 end;
 return new;
end $$;

drop trigger if exists fitness_red_desde_catalogo on public.fitness_state;
create trigger fitness_red_desde_catalogo after insert or update of data on public.fitness_state
 for each row execute function public.fitness_red_desde_catalogo_trg();

revoke all on function public.fitness_red_desde_catalogo(jsonb) from public, anon, authenticated;
revoke all on function public.fitness_red_rubros(text) from public, anon, authenticated;
revoke all on function public.fitness_red_desde_catalogo_trg() from public, anon, authenticated;

-- Pone al día los proveedores que ya estaban registrados.
select public.fitness_red_desde_catalogo((select data from public.fitness_state where id=true)) as sumados;

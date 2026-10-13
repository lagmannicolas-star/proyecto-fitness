begin;
create or replace function public.fitness_import_catalog(vendor_id text, items jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare p public.fitness_profiles; s jsonb; v jsonb; x jsonb; drafts jsonb := '[]'; updated jsonb; seen text[] := '{}';
begin
 select * into p from public.fitness_profiles where id=auth.uid();
 if p.id is null or p.blocked or (p.role<>'admin' and (p.role<>'vendor' or p.vendor_id is distinct from fitness_import_catalog.vendor_id)) then raise exception 'No autorizado'; end if;
 if jsonb_typeof(items) is distinct from 'array' or jsonb_array_length(items)<1 or jsonb_array_length(items)>5000 then raise exception 'Catálogo inválido'; end if;
 select data into s from public.fitness_state where id=true for update;
 select a into v from jsonb_array_elements(s->'vendors') a where a->>'id'=fitness_import_catalog.vendor_id;
 if v is null then raise exception 'Proveedor inexistente'; end if;
 for x in select a from jsonb_array_elements(items) a loop
  if jsonb_typeof(x)<>'object' or coalesce(length(x->>'key'),0) not between 1 and 1500 or coalesce(length(x->>'name'),0) not between 1 and 500 or (x->>'key')=any(seen) then raise exception 'Producto inválido o duplicado'; end if;
  if jsonb_typeof(x->'basePrice') is distinct from 'number' or (x->>'basePrice')::numeric<0 or jsonb_typeof(x->'price') is distinct from 'number' or (x->>'price')::numeric<0 then raise exception 'Precio inválido'; end if;
  if x->'promoPrice'<>'null'::jsonb and (jsonb_typeof(x->'promoPrice') is distinct from 'number' or (x->>'promoPrice')::numeric<0) then raise exception 'Promoción inválida'; end if;
  if x->'units' is distinct from 'null'::jsonb and (jsonb_typeof(x->'units') is distinct from 'number' or (x->>'units')::numeric<0 or (x->>'units')::numeric<>trunc((x->>'units')::numeric)) then raise exception 'Stock inválido'; end if;
  if jsonb_typeof(x->'hidden') is distinct from 'boolean' or jsonb_typeof(x->'properties') is distinct from 'array' or jsonb_array_length(x->'properties')>3 then raise exception 'Variante inválida'; end if;
  seen:=array_append(seen,x->>'key');
  drafts:=drafts||jsonb_build_array(public.fitness_pick(x,array['key','name','sourceSlug','sourceCategory','properties','basePrice','promoPrice','price','units','hidden','description','brand','kind']));
 end loop;
 if v->'catalogDrafts' is not distinct from drafts then return public.fitness_snapshot(); end if;
 v:=v||jsonb_build_object('catalogDrafts',drafts,'catalogImportedAt',clock_timestamp());
 select jsonb_agg(case when a->>'id'=fitness_import_catalog.vendor_id then v else a end) into updated from jsonb_array_elements(s->'vendors') a;
 update public.fitness_state set data=jsonb_set(s,'{vendors}',updated),revision=revision+1 where id=true;
 return public.fitness_snapshot();
end $$;
revoke all on function public.fitness_import_catalog(text,jsonb) from public,anon;
grant execute on function public.fitness_import_catalog(text,jsonb) to authenticated;
commit;

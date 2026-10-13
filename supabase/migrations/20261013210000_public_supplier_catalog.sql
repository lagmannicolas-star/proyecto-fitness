begin;
-- Public storefront projection. Never return supplier-private contact, costs,
-- credentials, descriptions, rejected/paused offers, or hidden source products.
create or replace function public.fitness_public_catalog() returns jsonb
language sql stable security definer set search_path='' as $$
 with imported as (select jsonb_build_object(
  'vendorId',v->>'id','vendorName',v->>'name',
  'key',d->>'key','name',d->>'name','category',d->>'sourceCategory',
  'properties',d->'properties','price',d->'price','units',d->'units',
  'offerId',(select o->>'id' from jsonb_array_elements(coalesce(s.data->'offers','[]'::jsonb)) o
    where o->>'vendorId'=v->>'id' and o->>'sourceKey'=d->>'key'
    and o->>'status'='published' and o->>'stock'<>'none'
    and (o->'units'='null'::jsonb or (o->>'units')::numeric>0)
    limit 1)
  ) as item
 from public.fitness_state s
 cross join lateral jsonb_array_elements(coalesce(s.data->'vendors','[]'::jsonb)) v
 cross join lateral jsonb_array_elements(coalesce(v->'catalogDrafts','[]'::jsonb)) d
 where s.id=true and v->>'status'='active'
 and d->'hidden'='false'::jsonb and jsonb_typeof(d->'price')='number'
 and length(coalesce(d->>'name',''))>0),
 manual as (select jsonb_build_object(
   'vendorId',v->>'id','vendorName',v->>'name','key',o->>'id',
   'name',o->>'model','category',o->>'category',
   'properties',jsonb_build_array(jsonb_build_object('name','Variante','value',o->>'size')),
   'price',o->'price','units',o->'units',
   'offerId',case when o->>'status'='published' and o->>'stock'<>'none'
     and (o->'units'='null'::jsonb or (o->>'units')::numeric>0)
     then o->>'id' else null end) as item
  from public.fitness_state s
  cross join lateral jsonb_array_elements(coalesce(s.data->'vendors','[]'::jsonb)) v
  cross join lateral jsonb_array_elements(coalesce(s.data->'offers','[]'::jsonb)) o
  where s.id=true and v->>'status'='active' and o->>'vendorId'=v->>'id'
  and o->>'status' in ('review','published')
  and not exists(select 1 from jsonb_array_elements(coalesce(v->'catalogDrafts','[]'::jsonb)) d
    where d->>'key'=o->>'sourceKey'))
 select coalesce(jsonb_agg(item order by item->>'vendorName',item->>'name',item->>'key'),'[]'::jsonb)
 from (select item from imported union all select item from manual) catalog;
$$;
revoke all on function public.fitness_public_catalog() from public;
grant execute on function public.fitness_public_catalog() to anon, authenticated;
commit;

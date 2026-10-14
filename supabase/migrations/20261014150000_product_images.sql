begin;
-- Fotos de productos. El archivo vive en Cloudflare R2; acá se guarda de dónde salió y si está aprobada.
-- source: 'tienda' (foto real de la tienda del proveedor), 'proveedor' (subida por el proveedor o el admin), 'ia' (generada).
-- image_key: el identificador del producto (slug) o de una variante puntual (clave de importación).
create table if not exists public.fitness_product_images(
 vendor_id text not null,
 image_key text not null,
 slug text not null,
 path text not null,
 source text not null check (source in ('tienda','proveedor','ia')),
 status text not null check (status in ('aprobada','pendiente','rechazada')),
 updated_at timestamptz not null default now(),
 primary key(vendor_id,image_key)
);
alter table public.fitness_product_images enable row level security;
revoke all on table public.fitness_product_images from public,anon,authenticated;
grant select,insert,update,delete on table public.fitness_product_images to service_role;

create or replace function public.fitness_images_list(p_vendor_id text) returns jsonb
language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('key',image_key,'slug',slug,'path',path,'source',source,'status',status,'updatedAt',updated_at) order by slug,image_key),'[]')
 from public.fitness_product_images where vendor_id=p_vendor_id;
$$;

create or replace function public.fitness_image_set(p_vendor_id text, p_image_key text, p_slug text, p_path text, p_source text, p_status text) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 insert into public.fitness_product_images(vendor_id,image_key,slug,path,source,status,updated_at) values(p_vendor_id,p_image_key,p_slug,p_path,p_source,p_status,now())
  on conflict(vendor_id,image_key) do update set slug=excluded.slug,path=excluded.path,source=excluded.source,status=excluded.status,updated_at=now();
 -- Avisa a las páginas abiertas que el catálogo cambió.
 update public.fitness_state set revision=revision+1 where id=true;
 return jsonb_build_object('ok',true);
end $$;

create or replace function public.fitness_image_status(p_vendor_id text, p_image_key text, p_status text) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if p_status not in ('aprobada','pendiente','rechazada') then raise exception 'Estado inválido'; end if;
 update public.fitness_product_images set status=p_status,updated_at=now() where vendor_id=p_vendor_id and image_key=p_image_key;
 if not found then raise exception 'Foto inexistente'; end if;
 update public.fitness_state set revision=revision+1 where id=true;
 return jsonb_build_object('ok',true);
end $$;

-- Catálogo público con la foto aprobada: primero la de la variante, si no la del producto.
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
    limit 1),
  'image',img.path,'imageAi',img.source='ia'
  ) as item
 from public.fitness_state s
 cross join lateral jsonb_array_elements(coalesce(s.data->'vendors','[]'::jsonb)) v
 cross join lateral jsonb_array_elements(coalesce(v->'catalogDrafts','[]'::jsonb)) d
 left join lateral (select i.path,i.source from public.fitness_product_images i
   where i.vendor_id=v->>'id' and i.status='aprobada'
   and (i.image_key=d->>'key' or i.image_key=coalesce(d->>'sourceSlug',split_part(d->>'key','#',1)))
   order by (i.image_key=d->>'key') desc limit 1) img on true
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
     then o->>'id' else null end,
   'image',img.path,'imageAi',img.source='ia') as item
  from public.fitness_state s
  cross join lateral jsonb_array_elements(coalesce(s.data->'vendors','[]'::jsonb)) v
  cross join lateral jsonb_array_elements(coalesce(s.data->'offers','[]'::jsonb)) o
  left join lateral (select i.path,i.source from public.fitness_product_images i
    where i.vendor_id=v->>'id' and i.status='aprobada' and i.image_key=o->>'id' limit 1) img on true
  where s.id=true and v->>'status'='active' and o->>'vendorId'=v->>'id'
  and o->>'status' in ('review','published')
  and not exists(select 1 from jsonb_array_elements(coalesce(v->'catalogDrafts','[]'::jsonb)) d
    where d->>'key'=o->>'sourceKey'))
 select coalesce(jsonb_agg(item order by item->>'vendorName',item->>'name',item->>'key'),'[]'::jsonb)
 from (select item from imported union all select item from manual) catalog;
$$;
revoke all on function public.fitness_public_catalog() from public;
grant execute on function public.fitness_public_catalog() to anon, authenticated;

revoke all on function public.fitness_images_list(text) from public,anon,authenticated;
revoke all on function public.fitness_image_set(text,text,text,text,text,text) from public,anon,authenticated;
revoke all on function public.fitness_image_status(text,text,text) from public,anon,authenticated;
grant execute on function public.fitness_images_list(text) to service_role;
grant execute on function public.fitness_image_set(text,text,text,text,text,text) to service_role;
grant execute on function public.fitness_image_status(text,text,text) to service_role;
commit;

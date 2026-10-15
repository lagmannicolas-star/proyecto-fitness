begin;
-- Reseñas verificadas: solo puede calificar quien compró y pagó el producto (pedido "approved" en fitness_state).
-- Una reseña por comprador y producto. Se publican después de la moderación del administrador.
-- El público solo lee reseñas aprobadas (RLS + columnas sin datos personales). Todo pasa por funciones security definer.
create table if not exists public.fitness_reviews(
 id bigint generated always as identity primary key,
 product_slug text not null check (length(product_slug) between 1 and 300),
 vendor_id text not null,
 order_id bigint not null,
 buyer_id uuid not null references auth.users(id) on delete cascade,
 buyer_name text not null default 'Comprador verificado',
 rating smallint not null check (rating between 1 and 5),
 title text check (title is null or length(title) <= 80),
 body text not null check (length(body) between 10 and 1000),
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 vendor_reply text check (vendor_reply is null or length(vendor_reply) between 2 and 1000),
 replied_at timestamptz,
 moderated_at timestamptz,
 created_at timestamptz not null default now(),
 unique (buyer_id, product_slug)
);
create index if not exists fitness_reviews_slug_approved on public.fitness_reviews(product_slug, created_at desc) where status='approved';
alter table public.fitness_reviews enable row level security;
revoke all on table public.fitness_reviews from public, anon, authenticated;
drop policy if exists fitness_reviews_read_approved on public.fitness_reviews;
create policy fitness_reviews_read_approved on public.fitness_reviews for select to anon, authenticated using (status='approved');
-- Lectura pública solo de columnas sin datos personales (no buyer_id ni order_id).
grant select (id, product_slug, vendor_id, buyer_name, rating, title, body, status, vendor_reply, replied_at, created_at) on table public.fitness_reviews to anon, authenticated;
grant select, insert, update, delete on table public.fitness_reviews to service_role;

-- Nombre público: nombre de pila + inicial del apellido ("Club A."), nunca el email.
create or replace function public.fitness_review_name(n text) returns text language sql immutable set search_path='' as $$
 select case when btrim(coalesce(n,''))='' or position('@' in n)>0 then 'Comprador verificado'
  else left(split_part(btrim(n),' ',1),30)||case when split_part(btrim(n),' ',2)<>'' then ' '||upper(left(split_part(btrim(n),' ',2),1))||'.' else '' end end
$$;

create or replace function public.fitness_review_submit(p_order_id bigint, p_slug text, p_rating integer, p_title text, p_text text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare p public.fitness_profiles; s jsonb; o jsonb; off jsonb; t text:=nullif(btrim(coalesce(p_title,'')),''); b text:=btrim(coalesce(p_text,'')); rid bigint;
begin
 select * into p from public.fitness_profiles where id=auth.uid();
 if p.id is null or p.blocked then raise exception 'Ingresá a tu cuenta para calificar'; end if;
 if p_rating is null or p_rating not between 1 and 5 then raise exception 'Elegí de 1 a 5 estrellas'; end if;
 if length(b) not between 10 and 1000 then raise exception 'Contanos tu experiencia en al menos 10 caracteres (máximo 1000)'; end if;
 if length(coalesce(t,''))>80 then raise exception 'El título puede tener hasta 80 caracteres'; end if;
 if length(coalesce(p_slug,'')) not between 1 and 300 then raise exception 'Producto inválido'; end if;
 select data into s from public.fitness_state where id=true;
 -- La compra tiene que ser de quien califica y estar pagada.
 select value into o from jsonb_array_elements(coalesce(s->'orders','[]')) where value->>'id'=p_order_id::text and value->>'buyerId'=p.id::text and value->>'status'='approved' limit 1;
 if o is null then raise exception 'Solo podés calificar productos de compras pagadas'; end if;
 select value into off from jsonb_array_elements(coalesce(s->'offers','[]')) where value->>'id'=o->>'offerId' limit 1;
 if off is null or split_part(coalesce(off->>'sourceKey',''),'#',1)<>p_slug then raise exception 'Ese producto no está en esa compra'; end if;
 if exists(select 1 from public.fitness_reviews r where r.buyer_id=p.id and r.product_slug=p_slug) then raise exception 'Ya calificaste este producto'; end if;
 insert into public.fitness_reviews(product_slug,vendor_id,order_id,buyer_id,buyer_name,rating,title,body)
  values(p_slug,o->>'vendorId',p_order_id,p.id,public.fitness_review_name(p.name),p_rating,t,b) returning id into rid;
 return jsonb_build_object('ok',true,'id',rid,'status','pending');
end $$;

-- Reseñas aprobadas y promedio por producto. Sin datos personales.
create or replace function public.fitness_reviews_public() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 return jsonb_build_object(
  'reviews',(select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'slug',r.product_slug,'vendorId',r.vendor_id,'name',r.buyer_name,'rating',r.rating,'title',r.title,'text',r.body,'createdAt',r.created_at,'reply',r.vendor_reply,'replyAt',r.replied_at) order by r.created_at desc),'[]')
   from (select * from public.fitness_reviews where status='approved' order by created_at desc limit 5000) r),
  'stats',(select coalesce(jsonb_object_agg(x.product_slug,jsonb_build_object('avg',x.avg,'count',x.n)),'{}')
   from (select product_slug, round(avg(rating)::numeric,2) avg, count(*) n from public.fitness_reviews where status='approved' group by product_slug) x));
end $$;

-- Lo que ya calificó quien llama (para no ofrecer "Calificar" dos veces).
create or replace function public.fitness_reviews_mine() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null then return '[]'::jsonb; end if;
 return (select coalesce(jsonb_agg(jsonb_build_object('slug',r.product_slug,'orderId',r.order_id,'status',r.status,'rating',r.rating)),'[]') from public.fitness_reviews r where r.buyer_id=auth.uid());
end $$;

-- Moderación: solo administradores.
create or replace function public.fitness_reviews_admin() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not exists(select 1 from public.fitness_profiles p where p.id=auth.uid() and p.role='admin' and not p.blocked) then raise exception 'No autorizado'; end if;
 return (select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'slug',r.product_slug,'vendorId',r.vendor_id,'orderId',r.order_id,'name',r.buyer_name,'email',u.email,'rating',r.rating,'title',r.title,'text',r.body,'status',r.status,'reply',r.vendor_reply,'createdAt',r.created_at) order by (r.status='pending') desc, r.created_at desc),'[]')
  from public.fitness_reviews r left join public.fitness_profiles u on u.id=r.buyer_id);
end $$;

create or replace function public.fitness_review_moderate(p_id bigint, p_status text) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.fitness_profiles p where p.id=auth.uid() and p.role='admin' and not p.blocked) then raise exception 'No autorizado'; end if;
 if p_status not in ('pending','approved','rejected') then raise exception 'Estado inválido'; end if;
 update public.fitness_reviews set status=p_status, moderated_at=now() where id=p_id;
 if not found then raise exception 'Reseña inexistente'; end if;
 return jsonb_build_object('ok',true);
end $$;

-- Respuesta del proveedor: solo el proveedor de esa venta, sobre reseñas aprobadas.
create or replace function public.fitness_review_reply(p_id bigint, p_reply text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare p public.fitness_profiles; t text:=btrim(coalesce(p_reply,''));
begin
 select * into p from public.fitness_profiles where id=auth.uid();
 if p.id is null or p.blocked or p.vendor_id is null then raise exception 'No autorizado'; end if;
 if length(t) not between 2 and 1000 then raise exception 'La respuesta debe tener entre 2 y 1000 caracteres'; end if;
 update public.fitness_reviews set vendor_reply=t, replied_at=now() where id=p_id and vendor_id=p.vendor_id and status='approved';
 if not found then raise exception 'No podés responder esta reseña'; end if;
 return jsonb_build_object('ok',true);
end $$;

revoke all on function public.fitness_review_name(text) from public, anon, authenticated;
revoke all on function public.fitness_review_submit(bigint,text,integer,text,text) from public, anon;
revoke all on function public.fitness_reviews_public() from public;
revoke all on function public.fitness_reviews_mine() from public, anon;
revoke all on function public.fitness_reviews_admin() from public, anon;
revoke all on function public.fitness_review_moderate(bigint,text) from public, anon;
revoke all on function public.fitness_review_reply(bigint,text) from public, anon;
grant execute on function public.fitness_review_submit(bigint,text,integer,text,text) to authenticated;
grant execute on function public.fitness_reviews_public() to anon, authenticated;
grant execute on function public.fitness_reviews_mine() to authenticated;
grant execute on function public.fitness_reviews_admin() to authenticated;
grant execute on function public.fitness_review_moderate(bigint,text) to authenticated;
grant execute on function public.fitness_review_reply(bigint,text) to authenticated;
commit;

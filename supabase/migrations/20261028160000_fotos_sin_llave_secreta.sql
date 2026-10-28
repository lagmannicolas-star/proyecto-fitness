-- Fotos sin la llave secreta en el Worker: el Worker guarda el archivo en R2 y registra la foto con la sesión
-- de quien la sube. La base verifica el permiso: el administrador, o el proveedor dueño de esos productos.
-- Las fotos de ofertas de la red se registran con el link privado (token) del proveedor, que ya se valida acá.
begin;

create or replace function public.fitness_foto_puede(p_vendor_id text) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.fitness_profiles p where p.id=auth.uid() and not p.blocked
   and (p.role='admin' or p.vendor_id=p_vendor_id))
$$;

create or replace function public.fitness_foto_lista(p_vendor_id text) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.fitness_foto_puede(p_vendor_id) then raise exception 'No autorizado'; end if;
 return public.fitness_images_list(p_vendor_id);
end $$;

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
 return public.fitness_image_set(p_vendor_id,p_image_key,p_slug,p_path,p_source,'aprobada');
end $$;

create or replace function public.fitness_foto_estado(p_vendor_id text, p_image_key text, p_status text) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not public.fitness_es_admin() then raise exception 'Solo el administrador puede hacer esto'; end if;
 return public.fitness_image_status(p_vendor_id,p_image_key,p_status);
end $$;

revoke all on function public.fitness_foto_puede(text), public.fitness_foto_lista(text), public.fitness_foto_set(text,text,text,text,text),
 public.fitness_foto_estado(text,text,text) from public, anon;
grant execute on function public.fitness_foto_lista(text), public.fitness_foto_set(text,text,text,text,text), public.fitness_foto_estado(text,text,text) to authenticated;

-- Fotos de ofertas: cada función valida el link privado del proveedor.
grant execute on function public.fitness_oferta_foto_lugar(text), public.fitness_oferta_foto_agregar(text,text), public.fitness_oferta_foto_quitar(text,text) to anon, authenticated;
commit;

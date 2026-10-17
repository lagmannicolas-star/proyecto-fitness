-- Los proveedores se postulan solos a la red de "Pedí ofertas" (sin catálogo ni cuenta).
-- Entran pausados: el administrador revisa y activa. Se avisa al administrador por email/WhatsApp.
begin;

alter table public.fitness_red_proveedores
 add column if not exists origen text not null default 'admin',
 add column if not exists cuit text,
 add column if not exists tipo text,
 add column if not exists localidad text;
do $$ begin
 alter table public.fitness_red_proveedores add constraint fitness_red_origen_chk check (origen in ('admin','web'));
exception when duplicate_object then null; end $$;
do $$ begin
 alter table public.fitness_red_proveedores add constraint fitness_red_extra_chk check (length(cuit)<=13 and length(tipo)<=40 and length(localidad)<=80);
exception when duplicate_object then null; end $$;
create index if not exists fitness_red_pend_idx on public.fitness_red_proveedores(origen, activo, created_at);

create or replace function public.fitness_red_postular(p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 v_nombre text := btrim(coalesce(p->>'nombre',''));
 v_contacto text := btrim(coalesce(p->>'contacto',''));
 v_wa text := regexp_replace(coalesce(p->>'whatsapp',''),'[^0-9]','','g');
 v_email text := lower(btrim(coalesce(p->>'email','')));
 v_cuit text := nullif(regexp_replace(coalesce(p->>'cuit',''),'[^0-9]','','g'),'');
 v_tipo text := nullif(btrim(coalesce(p->>'tipo','')),'');
 v_loc text := nullif(btrim(coalesce(p->>'localidad','')),'');
 v_rubros text[]; v_zonas text[]; v_id bigint; v_lista text;
begin
 if coalesce(p->>'web','')<>'' then return jsonb_build_object('ok',true); end if; -- campo trampa para robots
 if length(v_nombre) not between 2 and 120 then raise exception 'Escribí el nombre de tu empresa'; end if;
 if length(v_contacto) not between 2 and 120 then raise exception 'Escribí el nombre de la persona de contacto'; end if;
 if length(v_wa) not between 8 and 15 then raise exception 'Revisá el WhatsApp: con código de área, sin 0 ni 15'; end if;
 if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email)>160 then raise exception 'Revisá el email'; end if;
 if v_cuit is not null and length(v_cuit)<>11 then raise exception 'El CUIT tiene 11 dígitos'; end if;
 if v_tipo is not null and v_tipo not in ('Fabricante','Importador','Distribuidor','Comercio') then v_tipo := null; end if;
 if v_loc is not null and length(v_loc)>80 then raise exception 'Revisá la localidad'; end if;
 select coalesce(array_agg(distinct x),'{}') into v_rubros from jsonb_array_elements_text(coalesce(p->'rubros','[]')) x
  where x in ('musculacion','funcional','colchonetas','deportes','entrenamiento','atletismo','escolar','boxeo','natacion','rehabilitacion');
 if cardinality(v_rubros)=0 then raise exception 'Marcá al menos un rubro'; end if;
 select coalesce(array_agg(distinct btrim(x)),'{}') into v_zonas from jsonb_array_elements_text(coalesce(p->'zonas','[]')) x where length(btrim(x)) between 2 and 40;
 if cardinality(v_zonas)=0 or cardinality(v_zonas)>24 then v_zonas := '{todo}'; end if;

 -- Límites: evita duplicados y abusos sin revelar si la empresa ya estaba cargada.
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
   v_nombre||coalesce(' ('||v_tipo||')','')||chr(10)||'Contacto: '||v_contacto||' · WhatsApp '||v_wa||' · '||v_email||chr(10)
   ||'Rubros: '||coalesce(v_lista,'-')||chr(10)||'Entrega en: '||array_to_string(v_zonas,', ')||chr(10)||chr(10)
   ||'Está pausado hasta que lo actives en el panel: Solicitudes → Red de proveedores.',null,null,null,null);
 exception when others then raise warning 'fitness_red_postular aviso: %', sqlerrm;
 end;
 return jsonb_build_object('ok',true);
end $$;

-- El panel muestra primero las postulaciones pendientes.
create or replace function public.fitness_red_admin() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not public.fitness_es_admin() then raise exception 'No autorizado'; end if;
 return (select coalesce(jsonb_agg(to_jsonb(r) order by (r.origen='web' and not r.activo) desc, r.activo desc, r.nombre),'[]') from public.fitness_red_proveedores r);
end $$;

revoke all on function public.fitness_red_postular(jsonb) from public;
grant execute on function public.fitness_red_postular(jsonb) to anon,authenticated;
commit;

-- Nuevo rubro de la red: césped sintético (canchas de fútbol, hockey y pádel, y pistas para gimnasio).
-- Lo pueden marcar los proveedores al sumarse, el administrador en el panel y lo detecta el alta desde el catálogo.
begin;

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
  ('rehabilitacion','rehabilit|tobillera|protecci|kinesi'),
  ('cesped','c[eé]sped|pasto sint')
 ) as t(r,pat) where lower(coalesce(txt,'')) ~ pat
$$;

create or replace function public.fitness_red_guardar(p jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 v_com numeric := case when p ? 'comision' and nullif(p->>'comision','') is not null then (p->>'comision')::numeric end;
 v_id bigint := nullif(p->>'id','')::bigint;
 v_nombre text := btrim(coalesce(p->>'nombre',''));
 v_rubros text[]; v_zonas text[];
begin
 if not public.fitness_es_admin() then raise exception 'No autorizado'; end if;
 if length(v_nombre) not between 2 and 120 then raise exception 'Escribí el nombre del proveedor'; end if;
 if coalesce(p->>'whatsapp','')<>'' and length(regexp_replace(p->>'whatsapp','[^0-9]','','g')) not between 8 and 15 then raise exception 'Revisá el WhatsApp'; end if;
 select coalesce(array_agg(distinct x),'{}') into v_rubros from jsonb_array_elements_text(coalesce(p->'rubros','[]')) x
  where x in ('musculacion','funcional','colchonetas','deportes','entrenamiento','atletismo','escolar','boxeo','natacion','rehabilitacion','cesped');
 select coalesce(array_agg(distinct btrim(x)),'{}') into v_zonas from jsonb_array_elements_text(coalesce(p->'zonas','[]')) x where length(btrim(x)) between 2 and 40;
 if cardinality(v_zonas)=0 then v_zonas := '{todo}'; end if;
 if v_com is not null and (v_com<0 or v_com>100) then raise exception 'La comisión va de 0 a 100'; end if;
 if v_id is null then
  insert into public.fitness_red_proveedores(nombre,contacto,whatsapp,email,rubros,zonas,activo,notas,comision)
  values(v_nombre,nullif(btrim(coalesce(p->>'contacto','')),''),nullif(regexp_replace(coalesce(p->>'whatsapp',''),'[^0-9]','','g'),''),
   nullif(lower(btrim(coalesce(p->>'email',''))),''),v_rubros,v_zonas,coalesce((p->>'activo')::boolean,true),nullif(btrim(coalesce(p->>'notas','')),''),v_com)
  returning id into v_id;
 else
  update public.fitness_red_proveedores set nombre=v_nombre,contacto=nullif(btrim(coalesce(p->>'contacto','')),''),
   whatsapp=nullif(regexp_replace(coalesce(p->>'whatsapp',''),'[^0-9]','','g'),''),email=nullif(lower(btrim(coalesce(p->>'email',''))),''),
   rubros=v_rubros,zonas=v_zonas,activo=coalesce((p->>'activo')::boolean,true),notas=nullif(btrim(coalesce(p->>'notas','')),''),
   comision=case when p ? 'comision' then v_com else comision end,updated_at=now()
  where id=v_id;
  if not found then raise exception 'Proveedor inexistente'; end if;
 end if;
 return jsonb_build_object('id',v_id);
end $$;

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
 if v_tipo is not null and v_tipo not in ('Fabricante','Importador','Distribuidor','Comercio') then v_tipo := null; end if;
 if v_loc is not null and length(v_loc)>80 then raise exception 'Revisá la localidad'; end if;
 select coalesce(array_agg(distinct x),'{}') into v_rubros from jsonb_array_elements_text(coalesce(p->'rubros','[]')) x
  where x in ('musculacion','funcional','colchonetas','deportes','entrenamiento','atletismo','escolar','boxeo','natacion','rehabilitacion','cesped');
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

-- Césped Sintéticos Cuyo se sumó con rubro genérico: pasa a recibir los pedidos de césped.
update public.fitness_red_proveedores set rubros=(select array_agg(distinct x) from unnest(rubros||array['cesped']) x), updated_at=now()
 where email='cespedsinteticoscuyo@gmail.com' and not ('cesped'=any(rubros));

commit;

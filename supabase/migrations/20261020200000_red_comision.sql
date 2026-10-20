-- Comisión por proveedor de la red de "Pedí ofertas" (vacía = la general del sitio).
begin;
alter table public.fitness_red_proveedores add column if not exists comision numeric(5,2);
do $$ begin
 alter table public.fitness_red_proveedores add constraint fitness_red_comision_chk check (comision is null or comision between 0 and 100);
exception when duplicate_object then null; end $$;

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
  where x in ('musculacion','funcional','colchonetas','deportes','entrenamiento','atletismo','escolar','boxeo','natacion','rehabilitacion');
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

-- Cambio rápido desde el panel (Proveedores → Comisión por proveedor).
create or replace function public.fitness_red_comision(p_id bigint, p_pct numeric) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not public.fitness_es_admin() then raise exception 'No autorizado'; end if;
 if p_pct is not null and (p_pct<0 or p_pct>100) then raise exception 'La comisión va de 0 a 100'; end if;
 update public.fitness_red_proveedores set comision=p_pct,updated_at=now() where id=p_id;
 if not found then raise exception 'Proveedor inexistente'; end if;
 return jsonb_build_object('id',p_id,'comision',p_pct);
end $$;
revoke all on function public.fitness_red_comision(bigint,numeric) from public;
grant execute on function public.fitness_red_comision(bigint,numeric) to authenticated;

-- El link privado de oferta muestra la comisión que le corresponde a ese proveedor.
create or replace function public.fitness_invitacion_ver(p_token text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare i public.fitness_invitaciones; s public.fitness_solicitudes; r public.fitness_red_proveedores;
begin
 if coalesce(p_token,'') !~ '^[0-9a-f]{64}$' then raise exception 'El link no es válido'; end if;
 select * into i from public.fitness_invitaciones where token=p_token;
 if not found then raise exception 'El link no es válido o fue reemplazado'; end if;
 select * into s from public.fitness_solicitudes where code=i.solicitud_code;
 select * into r from public.fitness_red_proveedores where id=i.proveedor_id;
 if i.visto_at is null then update public.fitness_invitaciones set visto_at=now() where id=i.id; end if;
 -- Sin nombre, email, teléfono, empresa ni presupuesto del comprador.
 return jsonb_build_object('code',s.code,'proveedor',r.nombre,'estado',public.fitness_sol_estado(s.status,s.updated_at),
  'abierta', public.fitness_sol_estado(s.status,s.updated_at) in ('nueva','enviada','con_ofertas'),
  'tipo',s.tipo,'items',s.items,'detalles',s.detalles,'localidad',s.localidad,'provincia',s.provincia,'plazo',s.plazo,
  'factura',s.factura,'pagos',s.pagos,'prioridad',s.prioridad,'creada',s.created_at,
  'elegida', s.oferta_elegida is not null and s.oferta_elegida=(select o.id from public.fitness_ofertas_solicitud o where o.invitacion_id=i.id),
  'comision',coalesce(r.comision,(select (data->>'commission')::numeric from public.fitness_state where id=true),10),
  'oferta',(select to_jsonb(o) - 'invitacion_id' from public.fitness_ofertas_solicitud o where o.invitacion_id=i.id));
end $$;

update public.fitness_red_proveedores set comision=5 where nombre ilike 'GWORL%';
commit;

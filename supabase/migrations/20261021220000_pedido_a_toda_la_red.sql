-- Cada pedido de ofertas llega a TODA la red activa (incluidos los proveedores con catálogo).
-- 1) Al crearse una solicitud se genera la invitación (link privado) para cada proveedor activo de la red.
--    El admin les manda el link por WhatsApp desde Solicitudes (botón por proveedor).
-- 2) Los proveedores con cuenta (catálogo) ven además esos pedidos en su panel, con el botón para ofertar.
begin;

create or replace function public.fitness_invitar_toda_la_red(p_code text) returns integer
language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 insert into public.fitness_invitaciones(solicitud_code,proveedor_id,token)
 select p_code, r.id, replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','')
 from public.fitness_red_proveedores r where r.activo
 on conflict (solicitud_code,proveedor_id) do nothing;
 get diagnostics n = row_count;
 update public.fitness_solicitudes set
  proveedores_consultados = least(99,(select count(*) from public.fitness_invitaciones i where i.solicitud_code=p_code)),
  updated_at = now()
 where code=p_code;
 return n;
end $$;

create or replace function public.fitness_invitar_red_trg() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 begin
  perform public.fitness_invitar_toda_la_red(new.code);
 exception when others then
  raise warning 'invitar a la red (%): %', new.code, sqlerrm; -- nunca frena la solicitud
 end;
 return new;
end $$;

drop trigger if exists fitness_zz_invitar_red on public.fitness_solicitudes;
create trigger fitness_zz_invitar_red after insert on public.fitness_solicitudes
 for each row execute function public.fitness_invitar_red_trg();

-- Un proveedor que se activa en la red recibe también los pedidos que siguen abiertos.
create or replace function public.fitness_red_activo_trg() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.activo and (tg_op='INSERT' or not coalesce(old.activo,false)) then
  begin
   insert into public.fitness_invitaciones(solicitud_code,proveedor_id,token)
   select s.code, new.id, replace(gen_random_uuid()::text||gen_random_uuid()::text,'-','')
   from public.fitness_solicitudes s where s.status in ('nueva','enviada','con_ofertas')
   on conflict (solicitud_code,proveedor_id) do nothing;
   update public.fitness_solicitudes s set proveedores_consultados=least(99,(select count(*) from public.fitness_invitaciones i where i.solicitud_code=s.code))
   where s.status in ('nueva','enviada','con_ofertas');
  exception when others then raise warning 'red activo: %', sqlerrm;
  end;
 end if;
 return new;
end $$;
drop trigger if exists fitness_zz_red_activo on public.fitness_red_proveedores;
create trigger fitness_zz_red_activo after insert or update of activo on public.fitness_red_proveedores
 for each row execute function public.fitness_red_activo_trg();

-- Panel del proveedor con catálogo: pedidos abiertos a los que está invitado.
create or replace function public.fitness_mis_pedidos() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare pr public.fitness_profiles; vname text;
begin
 select * into pr from public.fitness_profiles where id=auth.uid();
 if pr.id is null or pr.vendor_id is null or pr.blocked then return '[]'::jsonb; end if;
 select v->>'name' into vname from public.fitness_state s, jsonb_array_elements(s.data->'vendors') v where s.id=true and v->>'id'=pr.vendor_id;
 return (select coalesce(jsonb_agg(jsonb_build_object(
   'code',s.code,'tipo',s.tipo,'localidad',s.localidad,'provincia',s.provincia,'plazo',s.plazo,'items',s.items,
   'creada',s.created_at,'token',i.token,'ofertada',exists(select 1 from public.fitness_ofertas_solicitud o where o.invitacion_id=i.id))
   order by s.created_at desc),'[]'::jsonb)
  from public.fitness_invitaciones i
  join public.fitness_red_proveedores r on r.id=i.proveedor_id
  join public.fitness_solicitudes s on s.code=i.solicitud_code
  where s.status in ('nueva','enviada','con_ofertas')
    and (lower(r.email)=lower(pr.email) or lower(btrim(r.nombre))=lower(btrim(coalesce(vname,'')))));
end $$;

revoke all on function public.fitness_invitar_toda_la_red(text) from public, anon, authenticated;
revoke all on function public.fitness_invitar_red_trg() from public, anon, authenticated;
revoke all on function public.fitness_red_activo_trg() from public, anon, authenticated;
revoke all on function public.fitness_mis_pedidos() from public, anon;
grant execute on function public.fitness_mis_pedidos() to authenticated;

-- El aviso al admin ya no dice "invitá proveedores": la solicitud sale sola a toda la red.
do $do$ declare d text := pg_get_functiondef('public.fitness_aviso_tr_solicitud()'::regprocedure);
begin
 if position('Invitá proveedores desde Solicitudes en el panel.' in d)>0 then
  execute replace(d,'Invitá proveedores desde Solicitudes en el panel.','Ya quedó enviada a toda la red: mandales el link por WhatsApp desde Solicitudes en el panel.');
 end if;
end $do$;
commit;

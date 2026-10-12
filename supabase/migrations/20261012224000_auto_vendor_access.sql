-- Alta automática de proveedores. Cada cuenta conserva sus permisos propios.
create or replace function public.fitness_apply_vendor(details jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare p public.fitness_profiles; s jsonb; vid text;
begin
 select * into p from public.fitness_profiles where id=auth.uid();
 if p.id is null or p.blocked then raise exception 'Confirmá tu email e iniciá sesión antes de solicitar el alta'; end if;
 if p.vendor_id is not null then raise exception 'Ya tenés una solicitud registrada'; end if;
 if length(coalesce(details->>'name',''))<2 or length(regexp_replace(coalesce(details->>'cuit',''),'[^0-9]','','g'))<>11 then raise exception 'Revisá la razón social y el CUIT'; end if;
 select data into s from public.fitness_state where id=true for update;
 vid:='v_'||p.id::text;
 s:=jsonb_set(s,'{vendors}',(s->'vendors')||jsonb_build_array(public.fitness_pick(details,array['name','type','cuit','contact','phone'])||jsonb_build_object('id',vid,'email',p.email,'user',p.email,'status','active','mp',false,'commission',null,'since',current_date,'logins','[]'::jsonb,'act','[]'::jsonb,'notifs','[]'::jsonb)));
 update public.fitness_profiles set vendor_id=vid,role=case when role='admin' then 'admin' else 'vendor' end where id=p.id;
 update public.fitness_state set data=s,revision=revision+1 where id=true;
 return public.fitness_snapshot();
end $$;
revoke all on function public.fitness_apply_vendor(jsonb) from public,anon;
grant execute on function public.fitness_apply_vendor(jsonb) to authenticated;
-- Activar solicitudes existentes; no cambia la revisión de productos.
update public.fitness_state set data=jsonb_set(data,'{vendors}',
 (select coalesce(jsonb_agg(case when v->>'status'='pending' then jsonb_set(v,'{status}','"active"') else v end),'[]') from jsonb_array_elements(data->'vendors') v)),revision=revision+1 where id=true;
update public.fitness_profiles p set role='vendor'
where p.role='buyer' and p.vendor_id is not null and exists(
 select 1 from public.fitness_state s,jsonb_array_elements(s.data->'vendors') v
 where v->>'id'=p.vendor_id and v->>'status'='active');

begin;
-- Mercado Pago marketplace: cada proveedor conecta su cuenta y cada cobro separa la comisión del sitio.
-- Las llaves de los proveedores se guardan cifradas por el Worker (la clave de cifrado vive solo en Cloudflare)
-- y en una tabla aparte, sin acceso para visitantes ni usuarios: solo el Worker con la clave service_role.
create table if not exists public.fitness_mp_accounts(
 vendor_id text primary key,
 mp_user_id text not null,
 secret text not null,
 expires_at timestamptz not null,
 updated_at timestamptz not null default now()
);
alter table public.fitness_mp_accounts enable row level security;
revoke all on table public.fitness_mp_accounts from public,anon,authenticated;
grant select,insert,update,delete on table public.fitness_mp_accounts to service_role;

-- La marca "Mercado Pago conectado" de cada proveedor sale siempre de la tabla de conexiones,
-- aunque alguien guarde datos viejos desde el panel.
create or replace function public.fitness_mp_flags() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if jsonb_typeof(new.data->'vendors')='array' then
  new.data:=jsonb_set(new.data,'{vendors}',(select coalesce(jsonb_agg(case when a.vendor_id is not null
    then v||jsonb_build_object('mp',true,'mpUserId',a.mp_user_id,'mpLinkedAt',a.updated_at)
    else (v-'mpUserId'-'mpLinkedAt')||jsonb_build_object('mp',false) end order by n),'[]')
   from jsonb_array_elements(new.data->'vendors') with ordinality as x(v,n)
   left join public.fitness_mp_accounts a on a.vendor_id=v->>'id'));
 end if;
 return new;
end $$;
drop trigger if exists fitness_mp_flags on public.fitness_state;
create trigger fitness_mp_flags before insert or update on public.fitness_state for each row execute function public.fitness_mp_flags();

create or replace function public.fitness_mp_link(p_vendor_id text, p_mp_user_id text, p_secret text, p_expires_at timestamptz) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s jsonb;
begin
 select data into s from public.fitness_state where id=true for update;
 if not exists(select 1 from jsonb_array_elements(s->'vendors') v where v->>'id'=p_vendor_id) then raise exception 'Proveedor inexistente'; end if;
 if exists(select 1 from public.fitness_mp_accounts where mp_user_id=p_mp_user_id and vendor_id<>p_vendor_id) then raise exception 'Esa cuenta de Mercado Pago ya está conectada a otro proveedor'; end if;
 insert into public.fitness_mp_accounts(vendor_id,mp_user_id,secret,expires_at,updated_at) values(p_vendor_id,p_mp_user_id,p_secret,p_expires_at,now())
  on conflict(vendor_id) do update set mp_user_id=excluded.mp_user_id,secret=excluded.secret,expires_at=excluded.expires_at,updated_at=now();
 update public.fitness_state set revision=revision+1 where id=true;
 return jsonb_build_object('ok',true);
end $$;

create or replace function public.fitness_mp_unlink(p_vendor_id text) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 perform 1 from public.fitness_state where id=true for update;
 delete from public.fitness_mp_accounts where vendor_id=p_vendor_id;
 update public.fitness_state set revision=revision+1 where id=true;
 return jsonb_build_object('ok',true);
end $$;

create or replace function public.fitness_mp_account(p_vendor_id text) returns jsonb
language sql stable security definer set search_path='' as $$
 select to_jsonb(a)-'updated_at' from public.fitness_mp_accounts a where a.vendor_id=p_vendor_id;
$$;

-- Registra el resultado de un pago consultado en Mercado Pago. Solo acepta pedidos del proveedor dueño del cobro.
create or replace function public.fitness_register_payment(pay_ref text, p_vendor_id text, payment jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s jsonb; os jsonb; total numeric; st text; pid text; issue text; o jsonb; result jsonb:='[]';
begin
 if coalesce(pay_ref,'')='' or coalesce(payment->>'id','')='' then return jsonb_build_object('found',false); end if;
 select data into s from public.fitness_state where id=true for update;
 select coalesce(jsonb_agg(value),'[]') into os from jsonb_array_elements(s->'orders') where value->>'payRef'=pay_ref and value->>'vendorId'=p_vendor_id;
 if jsonb_array_length(os)=0 then return jsonb_build_object('found',false); end if;
 st:=payment->>'status'; pid:=payment->>'id';
 -- El mismo aviso puede llegar varias veces: si no cambió nada, no se toca la base.
 if not exists(select 1 from jsonb_array_elements(os) x where x->>'mpPaymentId' is distinct from pid or x->>'mpStatus' is distinct from st) then
  return jsonb_build_object('found',true,'changed',false);
 end if;
 select sum((x->>'subtotal')::numeric+coalesce((x->>'shipping')::numeric,0)) into total from jsonb_array_elements(os) x;
 for o in select value from jsonb_array_elements(s->'orders') loop
  if o->>'payRef'=pay_ref and o->>'vendorId'=p_vendor_id then
   issue:=null;
   if st='approved' then
    if (payment->>'currency') is distinct from 'ARS' or coalesce((payment->>'amount')::numeric,0)<total-0.01 then
     issue:='El monto cobrado no coincide con el pedido: revisar antes de enviar';
    elsif o->>'status'='pending_payment' then
     o:=o||jsonb_build_object('status','approved','paidAt',now());
    elsif o->>'status' in ('expired','cancelled') then
     issue:='Pago acreditado después de vencer la reserva: confirmar stock o devolver el dinero';
    elsif o->>'status'='approved' and o->>'mpPaymentId' is distinct from pid then
     issue:='Se recibió un segundo pago para este pedido: revisar y devolver';
    end if;
   elsif st in ('refunded','charged_back') and o->>'status'='approved' then
    o:=o||jsonb_build_object('status','refunded');
   end if;
   o:=o||jsonb_build_object('mpPaymentId',pid,'mpStatus',st,'mpStatusDetail',payment->>'statusDetail','mpMarketplaceFee',payment->'marketplaceFee','mpUpdatedAt',now());
   if issue is not null then o:=o||jsonb_build_object('paymentIssue',issue); end if;
  end if;
  result:=result||jsonb_build_array(o);
 end loop;
 update public.fitness_state set data=jsonb_set(s,'{orders}',result),revision=revision+1 where id=true;
 return jsonb_build_object('found',true,'changed',true);
end $$;

revoke all on function public.fitness_mp_flags() from public,anon,authenticated;
revoke all on function public.fitness_mp_link(text,text,text,timestamptz) from public,anon,authenticated;
revoke all on function public.fitness_mp_unlink(text) from public,anon,authenticated;
revoke all on function public.fitness_mp_account(text) from public,anon,authenticated;
revoke all on function public.fitness_register_payment(text,text,jsonb) from public,anon,authenticated;
grant execute on function public.fitness_mp_link(text,text,text,timestamptz) to service_role;
grant execute on function public.fitness_mp_unlink(text) to service_role;
grant execute on function public.fitness_mp_account(text) to service_role;
grant execute on function public.fitness_register_payment(text,text,jsonb) to service_role;
commit;

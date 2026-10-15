begin;
-- Botón de arrepentimiento (Resolución 424/2020): cualquier comprador puede pedir la revocación de su compra
-- y recibe un código de seguimiento. Solo el administrador puede ver y gestionar los pedidos.
create table if not exists public.fitness_withdrawals(
 code text primary key,
 created_at timestamptz not null default now(),
 name text not null,
 email text not null,
 phone text,
 order_ref text not null,
 details text,
 status text not null default 'nueva' check (status in ('nueva','en_gestion','resuelta')),
 updated_at timestamptz not null default now()
);
alter table public.fitness_withdrawals enable row level security;
revoke all on table public.fitness_withdrawals from public,anon,authenticated;
grant select,insert,update on table public.fitness_withdrawals to service_role;

create or replace function public.fitness_request_withdrawal(details jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare c text; n text:=btrim(coalesce(details->>'name','')); e text:=lower(btrim(coalesce(details->>'email',''))); o text:=btrim(coalesce(details->>'order',''));
begin
 if length(n) not between 2 and 120 then raise exception 'Escribí tu nombre completo'; end if;
 if e !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(e)>160 then raise exception 'Escribí un email válido'; end if;
 if length(o) not between 1 and 40 then raise exception 'Escribí el número de compra'; end if;
 if length(coalesce(details->>'details',''))>1000 or length(coalesce(details->>'phone',''))>40 then raise exception 'El texto es demasiado largo'; end if;
 if (select count(*) from public.fitness_withdrawals w where w.email=e and w.created_at>now()-interval '1 day')>=5 then raise exception 'Ya registramos varios pedidos con este email hoy. Te vamos a contactar.'; end if;
 c:='ARR-'||upper(substr(md5(random()::text||clock_timestamp()::text||e),1,8));
 insert into public.fitness_withdrawals(code,name,email,phone,order_ref,details) values(c,n,e,nullif(btrim(coalesce(details->>'phone','')),''),o,nullif(btrim(coalesce(details->>'details','')),''));
 return jsonb_build_object('code',c,'createdAt',now());
end $$;

create or replace function public.fitness_withdrawals_admin() returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if not exists(select 1 from public.fitness_profiles p where p.id=auth.uid() and p.role='admin' and not p.blocked) then raise exception 'No autorizado'; end if;
 return (select coalesce(jsonb_agg(to_jsonb(w) order by w.created_at desc),'[]') from public.fitness_withdrawals w);
end $$;

create or replace function public.fitness_withdrawal_status(p_code text, p_status text) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.fitness_profiles p where p.id=auth.uid() and p.role='admin' and not p.blocked) then raise exception 'No autorizado'; end if;
 if p_status not in ('nueva','en_gestion','resuelta') then raise exception 'Estado inválido'; end if;
 update public.fitness_withdrawals set status=p_status,updated_at=now() where code=p_code;
 if not found then raise exception 'Pedido inexistente'; end if;
 return jsonb_build_object('ok',true);
end $$;

revoke all on function public.fitness_request_withdrawal(jsonb) from public;
revoke all on function public.fitness_withdrawals_admin() from public,anon;
revoke all on function public.fitness_withdrawal_status(text,text) from public,anon;
grant execute on function public.fitness_request_withdrawal(jsonb) to anon,authenticated;
grant execute on function public.fitness_withdrawals_admin() to authenticated;
grant execute on function public.fitness_withdrawal_status(text,text) to authenticated;
commit;

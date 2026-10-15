-- Envío "a coordinar": el proveedor cotiza el envío después de la compra.
-- Con shipMode='coordinar' el pago en Nexo Fit cubre solo los productos y la orden queda marcada con shipQuote=true.
do $$
declare d text; n text;
begin
 -- Reserva: sin costo de envío en el pago y orden marcada para cotizar.
 d:=pg_get_functiondef('public.fitness_reserve(jsonb,jsonb,text)'::regprocedure);
 n:=replace(d,$a$sh:=coalesce((o->>case when z='amba' then 'shipAmba' else 'shipInt' end)::numeric,0);$a$,
  $a$sh:=case when v->>'shipMode'='coordinar' then 0 else coalesce((o->>case when z='amba' then 'shipAmba' else 'shipInt' end)::numeric,0) end;$a$);
 n:=replace(n,$a$'status','pending_payment','shipped',false,$a$,$a$'shipQuote',coalesce(v->>'shipMode','')='coordinar','status','pending_payment','shipped',false,$a$);
 if n=d or position('shipQuote' in n)=0 then raise exception 'fitness_reserve no tiene el formato esperado'; end if;
 execute n;
 -- Datos públicos del proveedor: incluir el modo de envío.
 d:=pg_get_functiondef('public.fitness_snapshot()'::regprocedure);
 n:=replace(d,$a$'freeShipping','minOrderAmount','pricesIncludeVat']$a$,$a$'freeShipping','shipMode','minOrderAmount','pricesIncludeVat']$a$);
 if n=d then raise exception 'fitness_snapshot no tiene el formato esperado'; end if;
 execute n;
 -- El proveedor puede elegir su modo de envío; solo se aceptan los dos valores conocidos.
 d:=pg_get_functiondef('public.fitness_save(jsonb,bigint)'::regprocedure);
 n:=replace(d,$a$'paymentBenefits','freeShipping','act'$a$,$a$'paymentBenefits','freeShipping','shipMode','act'$a$);
 n:=replace(n,$a$ for x in select value from jsonb_array_elements(s->'vendors') loop$a$,
  $a$ for x in select value from jsonb_array_elements(s->'vendors') loop
  if coalesce(x->>'shipMode','fijo') not in ('fijo','coordinar') then raise exception 'Modo de envío inválido'; end if;$a$);
 if n=d or position('Modo de envío inválido' in n)=0 then raise exception 'fitness_save no tiene el formato esperado'; end if;
 execute n;
end $$;

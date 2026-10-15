-- Casos de la migración de reseñas. Se corren como los roles reales (anon/authenticated) con auth.uid() simulado.
\set QUIET on
create or replace function public.t_expect_error(q text, msg text) returns void language plpgsql as $$
begin
 begin execute q; exception when others then
  if position(msg in sqlerrm)=0 then raise exception 'Error inesperado para %: % (se esperaba %)', q, sqlerrm, msg; end if; return;
 end;
 raise exception 'Se esperaba un error para %', q;
end $$;
grant execute on function public.t_expect_error(text,text) to anon,authenticated;

insert into auth.users values ('11111111-1111-1111-1111-111111111111','compradora@club.test'),('22222222-2222-2222-2222-222222222222','otro@club.test'),('33333333-3333-3333-3333-333333333333','admin@nexofit.test'),('44444444-4444-4444-4444-444444444444','ventas@ab.test'),('55555555-5555-5555-5555-555555555555','ventas@otro.test');
insert into public.fitness_profiles(id,email,name,role,vendor_id) values
 ('11111111-1111-1111-1111-111111111111','compradora@club.test','Club Atlético Norte','buyer',null),
 ('22222222-2222-2222-2222-222222222222','otro@club.test','','buyer',null),
 ('33333333-3333-3333-3333-333333333333','admin@nexofit.test','Admin','admin',null),
 ('44444444-4444-4444-4444-444444444444','ventas@ab.test','AB','vendor','ab_fitness'),
 ('55555555-5555-5555-5555-555555555555','ventas@otro.test','Otro','vendor','otro');
insert into public.fitness_state(id,data) values (true,'{"offers":[{"id":"o1","vendorId":"ab_fitness","sourceKey":"pesa-rusa#[]"},{"id":"o2","vendorId":"ab_fitness","sourceKey":"soga#[{\"name\":\"Color\",\"value\":\"Rojo\"}]"}],
 "orders":[{"id":7,"buyerId":"11111111-1111-1111-1111-111111111111","vendorId":"ab_fitness","offerId":"o1","status":"approved"},
           {"id":8,"buyerId":"11111111-1111-1111-1111-111111111111","vendorId":"ab_fitness","offerId":"o2","status":"pending_payment"},
           {"id":9,"buyerId":"22222222-2222-2222-2222-222222222222","vendorId":"ab_fitness","offerId":"o2","status":"approved"}]}');

-- Sin sesión no se califica, y anon no ve la tabla completa.
set role anon;
select public.t_expect_error($$select public.fitness_review_submit(7,'pesa-rusa',5,'','Excelente producto, llegó rápido.')$$,'permission denied');
select public.t_expect_error($$select buyer_id from public.fitness_reviews$$,'permission denied');
reset role;

set role authenticated;
set request.jwt.claim.sub='11111111-1111-1111-1111-111111111111';
select public.t_expect_error($$select public.fitness_review_submit(7,'pesa-rusa',6,'','Excelente producto, llegó rápido.')$$,'Elegí de 1 a 5');
select public.t_expect_error($$select public.fitness_review_submit(7,'pesa-rusa',5,'','Corto')$$,'al menos 10');
select public.t_expect_error($$select public.fitness_review_submit(8,'soga',5,'','Todavía no la pagué pero opino.')$$,'compras pagadas');
select public.t_expect_error($$select public.fitness_review_submit(9,'soga',5,'','Esta compra es de otra persona.')$$,'compras pagadas');
select public.t_expect_error($$select public.fitness_review_submit(7,'soga',5,'','No estaba en esa compra.')$$,'no está en esa compra');
select public.fitness_review_submit(7,'pesa-rusa',4,'Muy buena','Excelente terminación, llegó en 4 días.');
select public.t_expect_error($$select public.fitness_review_submit(7,'pesa-rusa',5,'','Quiero calificar otra vez.')$$,'Ya calificaste');
select public.t_expect_error($$select public.fitness_reviews_admin()$$,'No autorizado');
select public.t_expect_error($$select public.fitness_review_moderate(1,'approved')$$,'No autorizado');
do $$ begin if jsonb_array_length(public.fitness_reviews_mine())<>1 then raise exception 'mine'; end if; end $$;
-- Pendiente: no se publica.
do $$ begin if jsonb_array_length(public.fitness_reviews_public()->'reviews')<>0 then raise exception 'pendiente publicada'; end if; end $$;
reset role;

set role authenticated;
set request.jwt.claim.sub='22222222-2222-2222-2222-222222222222';
select public.fitness_review_submit(9,'soga',2,null,'No me gustó el mango, se resbala.');
reset role;

-- El administrador modera.
set role authenticated;
set request.jwt.claim.sub='33333333-3333-3333-3333-333333333333';
do $$ declare a jsonb:=public.fitness_reviews_admin(); begin
 if jsonb_array_length(a)<>2 or a->0->>'status'<>'pending' or a->0->>'email' is null then raise exception 'admin %',a; end if; end $$;
select public.fitness_review_moderate(r.id,'approved') from public.fitness_reviews r where false;
reset role;
-- (la tabla no es legible completa por authenticated: se modera con los ids que devuelve fitness_reviews_admin)
set role authenticated;
set request.jwt.claim.sub='33333333-3333-3333-3333-333333333333';
do $$ declare a jsonb:=public.fitness_reviews_admin(); x jsonb; begin
 for x in select * from jsonb_array_elements(a) loop
  perform public.fitness_review_moderate((x->>'id')::bigint, case when x->>'slug'='pesa-rusa' then 'approved' else 'rejected' end);
 end loop; end $$;
select public.t_expect_error($$select public.fitness_review_moderate(1,'publicada')$$,'Estado inválido');
reset role;

-- Lectura pública: solo aprobadas, sin datos personales, con promedio.
set role anon;
do $$ declare p jsonb:=public.fitness_reviews_public(); begin
 if jsonb_array_length(p->'reviews')<>1 then raise exception 'publicas %',p; end if;
 if p->'reviews'->0->>'name'<>'Club A.' then raise exception 'nombre %',p->'reviews'->0->>'name'; end if;
 if (p->'reviews'->0) ? 'buyerId' or (p->'reviews'->0) ? 'email' then raise exception 'datos personales'; end if;
 if (p->'stats'->'pesa-rusa'->>'count')::int<>1 or (p->'stats'->'pesa-rusa'->>'avg')::numeric<>4 then raise exception 'stats %',p->'stats'; end if;
 if (select count(*) from public.fitness_reviews)<>1 then raise exception 'RLS: anon ve reseñas no aprobadas'; end if;
end $$;
reset role;

-- Respuesta del proveedor: solo el de esa venta y sobre reseñas aprobadas.
set role authenticated;
set request.jwt.claim.sub='55555555-5555-5555-5555-555555555555';
select public.t_expect_error($$select public.fitness_review_reply((select (public.fitness_reviews_public()->'reviews'->0->>'id')::bigint),'Gracias!')$$,'No podés responder');
set request.jwt.claim.sub='11111111-1111-1111-1111-111111111111';
select public.t_expect_error($$select public.fitness_review_reply(1,'Hola')$$,'No autorizado');
set request.jwt.claim.sub='44444444-4444-4444-4444-444444444444';
select public.fitness_review_reply((public.fitness_reviews_public()->'reviews'->0->>'id')::bigint,'¡Gracias por tu compra!');
do $$ begin if public.fitness_reviews_public()->'reviews'->0->>'reply'<>'¡Gracias por tu compra!' then raise exception 'respuesta'; end if; end $$;
reset role;
select 'casos ok';

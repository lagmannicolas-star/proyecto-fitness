-- Nexo Fit despacha a todo el país con costo según destino: el envío es "a coordinar" por defecto.
-- 1) Los proveedores que se dan de alta solos quedan con shipMode='coordinar'.
-- 2) Los proveedores existentes sin modo elegido pasan a 'coordinar' (nadie lo había elegido como "fijo").
do $$
declare d text; n text;
begin
 d := pg_get_functiondef('public.fitness_alta_proveedor(uuid,jsonb)'::regprocedure);
 n := replace(d, $a$'status','active','mp',false,$a$, $a$'status','active','shipMode','coordinar','mp',false,$a$);
 if n = d then raise exception 'fitness_alta_proveedor no tiene el formato esperado'; end if;
 execute n;
end $$;

update public.fitness_state s
 set data = jsonb_set(s.data, '{vendors}', (select jsonb_agg(case when v ? 'shipMode' then v else v || '{"shipMode":"coordinar"}'::jsonb end order by ord)
   from jsonb_array_elements(s.data->'vendors') with ordinality e(v,ord))),
     revision = s.revision + 1
 where s.id and exists (select 1 from jsonb_array_elements(s.data->'vendors') v where not v ? 'shipMode');

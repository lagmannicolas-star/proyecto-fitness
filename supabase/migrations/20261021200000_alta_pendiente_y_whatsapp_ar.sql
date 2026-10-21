-- 1) WhatsApp siempre argentino: se guarda como 549 + código de área + número (13 dígitos).
--    Acepta lo que escriba la persona (con 0, con 15, con +54, con espacios) y lo normaliza.
-- 2) Alta "Vender con catálogo" que se perdía: si el proveedor confirmaba el email en otra pestaña
--    o en el celular, los datos de la empresa quedaban solo en el navegador original y nunca se
--    creaba el proveedor. Ahora los datos viajan con la cuenta (metadata del registro) y el alta
--    se completa sola en el servidor al confirmar el email. Además se avisa al administrador
--    apenas empieza el alta, aunque todavía no haya confirmado.
begin;

create or replace function public.fitness_wa_ar(t text) returns text
language plpgsql immutable set search_path='' as $$
declare d text := regexp_replace(coalesce(t,''),'[^0-9]','','g');
begin
 if d='' then return null; end if;
 d := regexp_replace(d,'^00','');
 if d ~ '^549[0-9]{10}$' then return d; end if;
 if d ~ '^54' then d := substr(d,3); end if;
 if d ~ '^9[0-9]{10}$' then d := substr(d,2); end if;
 d := regexp_replace(d,'^0','');
 if length(d)=12 then -- trae el 15 después del código de área
  if d ~ '^1115' then d := '11'||substr(d,5);
  elsif substr(d,4,2)='15' then d := substr(d,1,3)||substr(d,6);
  elsif substr(d,5,2)='15' then d := substr(d,1,4)||substr(d,7);
  elsif substr(d,3,2)='15' then d := substr(d,1,2)||substr(d,5);
  end if;
 end if;
 if length(d)=10 then return '549'||d; end if;
 return d;
end $$;

create or replace function public.fitness_red_wa_trg() returns trigger language plpgsql set search_path='' as $$
begin new.whatsapp := public.fitness_wa_ar(new.whatsapp); return new; end $$;
drop trigger if exists fitness_red_wa on public.fitness_red_proveedores;
create trigger fitness_red_wa before insert or update of whatsapp on public.fitness_red_proveedores
 for each row execute function public.fitness_red_wa_trg();
update public.fitness_red_proveedores set whatsapp=whatsapp where whatsapp is not null;

-- Postulación a la red: valida un celular argentino completo.
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
 if coalesce(p->>'web','')<>'' then return jsonb_build_object('ok',true); end if; -- campo trampa para robots
 if length(v_nombre) not between 2 and 120 then raise exception 'Escribí el nombre de tu empresa'; end if;
 if length(v_contacto) not between 2 and 120 then raise exception 'Escribí el nombre de la persona de contacto'; end if;
 if coalesce(v_wa,'') !~ '^549[0-9]{10}$' then raise exception 'Revisá el WhatsApp: código de área y número, 10 dígitos (ej. 11 2345 6789)'; end if;
 if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or length(v_email)>160 then raise exception 'Revisá el email'; end if;
 if v_cuit is not null and length(v_cuit)<>11 then raise exception 'El CUIT tiene 11 dígitos'; end if;
 if v_tipo is not null and v_tipo not in ('Fabricante','Importador','Distribuidor','Comercio') then v_tipo := null; end if;
 if v_loc is not null and length(v_loc)>80 then raise exception 'Revisá la localidad'; end if;
 select coalesce(array_agg(distinct x),'{}') into v_rubros from jsonb_array_elements_text(coalesce(p->'rubros','[]')) x
  where x in ('musculacion','funcional','colchonetas','deportes','entrenamiento','atletismo','escolar','boxeo','natacion','rehabilitacion');
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

-- Crea el proveedor de catálogo para una cuenta (lógica común del alta).
create or replace function public.fitness_alta_proveedor(uid uuid, details jsonb) returns text
language plpgsql security definer set search_path='' as $$
declare p public.fitness_profiles; s jsonb; vid text; d jsonb; wa text;
begin
 select * into p from public.fitness_profiles where id=uid;
 if p.id is null or p.blocked then raise exception 'Confirmá tu email e iniciá sesión antes de solicitar el alta'; end if;
 if p.vendor_id is not null then raise exception 'Ya tenés una solicitud registrada'; end if;
 if length(coalesce(details->>'name',''))<2 or length(regexp_replace(coalesce(details->>'cuit',''),'[^0-9]','','g'))<>11 then raise exception 'Revisá la razón social y el CUIT'; end if;
 wa := public.fitness_wa_ar(coalesce(nullif(details->>'wa',''),details->>'phone'));
 d := public.fitness_pick(details,array['name','type','cuit','contact','phone']);
 if wa is not null then d := d||jsonb_build_object('phone',wa,'wa',wa); end if;
 select data into s from public.fitness_state where id=true for update;
 vid:='v_'||p.id::text;
 s:=jsonb_set(s,'{vendors}',(s->'vendors')||jsonb_build_array(d||jsonb_build_object('id',vid,'email',p.email,'user',p.email,'status','active','mp',false,'commission',null,'since',current_date,'logins','[]'::jsonb,'act','[]'::jsonb,'notifs','[]'::jsonb)));
 update public.fitness_profiles set vendor_id=vid,role=case when role='admin' then 'admin' else 'vendor' end where id=p.id;
 update public.fitness_state set data=s,revision=revision+1 where id=true;
 begin
  perform public.fitness_aviso_encolar('proveedor_nuevo',null,'Nuevo proveedor con catálogo: '||(details->>'name'),
   (details->>'name')||coalesce(' ('||nullif(details->>'type','')||')','')||chr(10)||'Contacto: '||coalesce(nullif(details->>'contact',''),'-')
   ||coalesce(' · WhatsApp +'||wa,'')||' · '||p.email||chr(10)||chr(10)||'Ya está activo en la pestaña Proveedores.',null,null,null,null);
 exception when others then raise warning 'fitness_alta_proveedor aviso: %', sqlerrm;
 end;
 return vid;
end $$;

create or replace function public.fitness_apply_vendor(details jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
 perform public.fitness_alta_proveedor(auth.uid(), details);
 return public.fitness_snapshot();
end $$;

-- Al registrarse con datos de empresa: avisa al admin; al confirmar el email: completa el alta sola.
create or replace function public.fitness_alta_pendiente_trg() returns trigger
language plpgsql security definer set search_path='' as $$
declare det jsonb := new.raw_user_meta_data->'vendor_alta'; wa text;
begin
 if det is null or jsonb_typeof(det)<>'object' then return new; end if;
 begin
  if tg_op='INSERT' and new.email_confirmed_at is null then
   wa := public.fitness_wa_ar(coalesce(nullif(det->>'wa',''),det->>'phone'));
   perform public.fitness_aviso_encolar('proveedor_nuevo',null,'Proveedor empezó el alta: '||coalesce(det->>'name','(sin nombre)'),
    coalesce(det->>'name','')||coalesce(' ('||nullif(det->>'type','')||')','')||chr(10)||'Contacto: '||coalesce(nullif(det->>'contact',''),'-')
    ||coalesce(' · WhatsApp +'||wa,'')||' · '||coalesce(new.email,'')||chr(10)||chr(10)
    ||'Falta que confirme el email. Cuando lo confirme, queda activo solo en la pestaña Proveedores.',null,null,null,null);
  end if;
  if new.email_confirmed_at is not null
     and exists(select 1 from public.fitness_profiles where id=new.id and vendor_id is null and not blocked) then
   perform public.fitness_alta_proveedor(new.id, det);
  end if;
 exception when others then
  raise warning 'alta pendiente %: %', new.email, sqlerrm; -- nunca frena el registro ni la confirmación
 end;
 return new;
end $$;

drop trigger if exists fitness_zz_alta_pendiente on auth.users;
create trigger fitness_zz_alta_pendiente after insert or update of email_confirmed_at on auth.users
 for each row execute function public.fitness_alta_pendiente_trg();

revoke all on function public.fitness_alta_proveedor(uuid,jsonb) from public, anon, authenticated;
revoke all on function public.fitness_alta_pendiente_trg() from public, anon, authenticated;
revoke all on function public.fitness_red_wa_trg() from public, anon, authenticated;
revoke all on function public.fitness_apply_vendor(jsonb) from public, anon;
grant execute on function public.fitness_apply_vendor(jsonb) to authenticated;
grant execute on function public.fitness_wa_ar(text) to anon, authenticated;
commit;

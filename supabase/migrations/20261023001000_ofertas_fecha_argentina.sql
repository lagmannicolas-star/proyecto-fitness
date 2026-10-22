-- "Hoy" para ofertas y recordatorios es el día en Argentina, no en UTC: entre las 21 y las 24 h
-- una oferta válida "hasta hoy" se tomaba como vencida y no se podía cargar con fecha de hoy.
begin;
alter function public.fitness_avisos_recordatorios() set timezone to 'America/Argentina/Buenos_Aires';
alter function public.fitness_oferta_elegir(text,text,bigint) set timezone to 'America/Argentina/Buenos_Aires';
alter function public.fitness_oferta_enviar(text,jsonb) set timezone to 'America/Argentina/Buenos_Aires';
alter function public.fitness_solicitud_consulta(text,text) set timezone to 'America/Argentina/Buenos_Aires';
commit;

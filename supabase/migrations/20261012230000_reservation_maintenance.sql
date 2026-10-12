-- Ejecuta el vencimiento aun cuando no haya visitantes ni nuevos pedidos.
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule(
  'fitness-release-expired',
  '* * * * *',
  'select public.fitness_maintenance();'
);

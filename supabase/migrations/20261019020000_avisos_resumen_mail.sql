-- Marca qué avisos ya se incluyeron en el resumen por mail que manda la tarea programada cada hora.
alter table public.fitness_avisos add column if not exists mail_resumen_at timestamptz;
update public.fitness_avisos set mail_resumen_at=now() where canal='push' and mail_resumen_at is null;

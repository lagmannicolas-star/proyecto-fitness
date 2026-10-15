#!/usr/bin/env bash
# Prueba la migración de reseñas en un Postgres local descartable (nunca en la base real).
# Uso: tests/sql/resenas.sh   (necesita initdb/postgres 16; si corre como root usa el usuario pgtest)
set -euo pipefail
BIN=${PGBIN:-/usr/lib/postgresql/16/bin}
DIR=$(mktemp -d); ROOT=$(cd "$(dirname "$0")/../.." && pwd); PORT=${PGPORT_TEST:-54329}
run(){ if [ "$(id -u)" = 0 ]; then su pgtest -s /bin/bash -c "$*"; else bash -c "$*"; fi; }
chmod 777 "$DIR"
run "$BIN/initdb -D $DIR/db -A trust -U postgres >/dev/null"
run "$BIN/pg_ctl -D $DIR/db -o '-p $PORT -k $DIR' -l $DIR/log start >/dev/null"
trap 'run "$BIN/pg_ctl -D $DIR/db stop -m immediate >/dev/null" || true; rm -rf "$DIR"' EXIT
sleep 1
PSQL="$BIN/psql -h $DIR -p $PORT -U postgres -v ON_ERROR_STOP=1 -q -X"
cp "$ROOT/supabase/migrations/20261017120000_resenas.sql" "$DIR/m.sql"; cp "$ROOT/tests/sql/resenas_casos.sql" "$DIR/c.sql"; chmod 644 "$DIR"/*.sql
# Lo mínimo de Supabase: esquema auth, auth.uid(), roles y las tablas existentes que usa la migración.
run "$PSQL" <<'SQL'
create role anon nologin; create role authenticated nologin; create role service_role nologin;
create schema auth; grant usage on schema auth to anon,authenticated,service_role;
create table auth.users(id uuid primary key, email text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant execute on function auth.uid() to anon,authenticated;
create table public.fitness_profiles(id uuid primary key references auth.users(id), email text, name text, role text not null default 'buyer', vendor_id text, blocked boolean not null default false);
create table public.fitness_state(id boolean primary key default true, data jsonb not null, revision bigint not null default 1);
grant usage on schema public to anon,authenticated,service_role;
SQL
run "$PSQL -f $DIR/m.sql"
run "$PSQL -f $DIR/m.sql"   # se puede aplicar dos veces
run "$PSQL -f $DIR/c.sql" >/dev/null
echo "OK: migración de reseñas en Postgres local: permisos, compra verificada, una por producto, moderación, respuestas y lectura pública."

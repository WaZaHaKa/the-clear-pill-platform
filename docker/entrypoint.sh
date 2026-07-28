#!/usr/bin/env sh
set -eu

secret_file="/run/secrets/postgres_password"
if [ ! -r "$secret_file" ]; then
  echo '{"level":"error","event":"missing_postgres_secret","path":"/run/secrets/postgres_password"}' >&2
  exit 1
fi

encoded_password="$(node -e 'const fs=require("fs"); process.stdout.write(encodeURIComponent(fs.readFileSync(process.argv[1],"utf8").trim()))' "$secret_file")"
export DATABASE_URL="postgresql://${POSTGRES_USER:-clear_pill}:${encoded_password}@${POSTGRES_HOST:-db}:${POSTGRES_PORT:-5432}/${POSTGRES_DB:-clear_pill}?schema=public"

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  echo '{"level":"info","event":"database_migration_start"}'
  npm run db:migrate
  echo '{"level":"info","event":"database_migration_complete"}'
fi

if [ "${SEED_DEMO_DATA:-false}" = "true" ]; then
  echo '{"level":"info","event":"demo_seed_start"}'
  npm run db:seed
  echo '{"level":"info","event":"demo_seed_complete"}'
fi

exec "$@"

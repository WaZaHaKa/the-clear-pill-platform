#!/usr/bin/env sh
set -eu

secret_file="/run/secrets/postgres_password"
if [ ! -r "$secret_file" ]; then
  echo '{"level":"error","event":"missing_postgres_secret","path":"/run/secrets/postgres_password"}' >&2
  exit 1
fi

encoded_password="$(node -e 'const fs=require("fs"); process.stdout.write(encodeURIComponent(fs.readFileSync(process.argv[1],"utf8").trim()))' "$secret_file")"
export DATABASE_URL="postgresql://${POSTGRES_USER:-clear_pill}:${encoded_password}@${POSTGRES_HOST:-db}:${POSTGRES_PORT:-5432}/${POSTGRES_DB:-clear_pill}?schema=public"
exec "$@"

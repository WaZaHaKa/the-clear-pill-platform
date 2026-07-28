# Controlled Staging Deployment

## 1. Read-only inventory

Before changing anything, record:

- existing Docker projects, networks, ports and bind mounts;
- host Nginx server names and upstream ports;
- certificate lineages and renewal hooks;
- existing Porkbun credential path and ownership;
- current DNS records for `theclearpill.online`;
- disk, memory and backup capacity.

Do not run broad cleanup commands.

## 2. Prepare the isolated project

```bash
cp .env.example .env
mkdir -p secrets
umask 077
openssl rand -base64 36 > secrets/postgres_password.txt
docker compose config
```

The web port defaults to `127.0.0.1:3070`. Change it only if the inventory shows a conflict.

## 3. Build and start

```bash
docker compose build
docker compose up -d db web worker
docker compose ps
docker compose logs --tail=200 web worker
# Optional idempotent manual rerun:
docker compose exec web /usr/local/bin/clear-pill-with-db npm run db:seed
curl -fsS http://127.0.0.1:3070/api/health
```

## 4. Verify through an SSH tunnel first

From the operator machine:

```bash
ssh -L 3070:127.0.0.1:3070 <server-alias>
```

Review `/today` and `/plan` before touching DNS or Nginx.

## 5. Protected staging edge

Only after local verification:

- create an explicit `staging` DNS record in Porkbun;
- issue or reuse the wildcard certificate through the existing Porkbun DNS-01 automation;
- create a new Nginx file rather than editing unrelated server blocks;
- protect staging with authentication or an IP allowlist;
- run `nginx -t` before reload;
- verify rollback by removing only the new file and record.

## 6. Data safety

Before real use, add a scheduled logical PostgreSQL backup, encrypted off-host copy, retention policy and restore test. A backup that has not been restored is not yet proven.

# The Clear Pill — Planning-First Starter v0.1

This repository begins the implementation with the product's core behavior rather than a generic dashboard:

**five-year vision → yearly/quarterly/monthly/weekly plans → objective-linked work items → deterministic daily missions → completion evidence and reflection.**

The first deployment target is an isolated Docker Compose stack on the existing Hetzner server. It binds the web app to `127.0.0.1:3070`, does not expose PostgreSQL, does not alter the host reverse proxy, and does not touch other Docker projects.

## What is implemented

- PostgreSQL planning data model with full strategic lineage.
- Deterministic, explainable mission ranking and capacity selection.
- Idempotent daily generation runs with an audit snapshot.
- Background worker that generates missions at each workspace's configured local time.
- Hebrew-first calm UI for **Today** and **Plan**.
- Docker Compose deployment using file-mounted secrets.
- Porkbun read-only API verification helper and safe domain/TLS deployment notes.
- CREFX execution contract for mission-generation auditability.

## Start locally or on an isolated staging host

```bash
cp .env.example .env
mkdir -p secrets
umask 077
openssl rand -base64 36 > secrets/postgres_password.txt

docker compose build
docker compose up -d db web worker
# With SEED_DEMO_DATA=true, the idempotent pilot seed runs during web startup.
# Manual rerun: docker compose exec web /usr/local/bin/clear-pill-with-db npm run db:seed
curl -fsS http://127.0.0.1:3070/api/health
```

Open `http://127.0.0.1:3070` through an SSH tunnel, or add a protected staging-only Nginx route after reviewing `infra/nginx/theclearpill.online.conf.example`.

## Safety boundary

This starter intentionally does **not**:

- transfer the domain away from Porkbun;
- change Porkbun nameservers;
- modify DNS records automatically;
- overwrite the host Nginx configuration;
- expose a public unauthenticated production interface;
- copy Porkbun API keys into the app's environment or repository;
- introduce K3s onto a server already hosting production Docker workloads.

See `docs/IMPLEMENTATION_BASELINE.md` and `CODEX_ITERATION_01.md` for the next controlled implementation run.

## Validation status

Static checks and dependency-free planning smoke tests are recorded in `VALIDATION_REPORT.md`. Docker, Prisma, Next.js build, and live-server checks remain intentionally assigned to the controlled Hetzner execution in `CODEX_ITERATION_01.md`.

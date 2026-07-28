# Codex Execution Prompt — The Clear Pill Iteration 01

## Context

You are implementing the first working vertical slice of **The Clear Pill** on an existing Hetzner server that already hosts unrelated Docker workloads and a host-level Nginx/Certbot edge.

The supplied repository is a planning-first starter. Its product spine is:

`five-year plan → annual/quarter/month/week plan → objective → work item → daily mission → evidence/reflection`

The domain `theclearpill.online` is registered at Porkbun and must remain there. Porkbun also remains authoritative DNS for now. API credentials already exist on the server. Do not migrate DNS, transfer the domain, expose credentials, or create another competing certificate automation system.

## Role

Act as a conservative senior platform engineer and product engineer. Optimize for a correct, observable, reversible pilot rather than architecture theater.

## Non-negotiable server safety

- Start with read-only inventory.
- Do not use broad Docker, Git, package, firewall or filesystem cleanup commands.
- Do not stop, restart, recreate or inspect secrets from unrelated containers.
- Do not modify unrelated Nginx files, certificate lineages, timers, systemd units, SSH, databases or networks.
- Do not print Porkbun, database or other secret values.
- Do not copy Porkbun keys into the repository or application containers.
- Do not install K3s on this shared server in this iteration.
- Do not make public DNS writes or Nginx changes before the loopback pilot passes.
- Do not use `DEMO_MODE=true` on an unprotected public hostname.
- All mutations must be narrowly scoped to this project and have a rollback command.

## Explicit task

Audit, correct, test and deploy the supplied starter as an isolated loopback-only staging pilot. Implement the planning loop end to end and prove that daily missions are derived from approved long-range plans.

### A. Read-only inventory and decision record

Collect and save a redacted report containing:

1. OS, CPU, memory and free disk.
2. Docker and Docker Compose versions.
3. Existing Compose project names, container names, published ports and networks — metadata only, no secret inspection.
4. List of listening TCP ports relevant to selecting the app port.
5. Existing host Nginx server names and upstream loopback ports.
6. Existing Certbot lineages, renewal configs and hook filenames, with credential values redacted.
7. Whether the existing Porkbun integration supports `theclearpill.online`; use the supplied read-only checker or an equivalent read-only call.
8. Current DNS records for `theclearpill.online`, read-only.

Save this as `artifacts/iteration-01-inventory.md`. Do not proceed with a conflicting port. Prefer `127.0.0.1:3070`; if occupied, choose the first available port through 3099 and update `.env` plus documentation.

### B. Repository verification and repairs

1. Validate all JSON, TypeScript, Prisma and Compose files.
2. Run dependency install with a lockfile and pin the resolved versions.
3. Run Prisma format and validation.
4. Review the migration against the Prisma schema; regenerate a clean migration if there is any mismatch.
5. Run type checks and unit tests.
6. Fix all build/runtime errors; do not suppress errors with unsafe casts unless documented.
7. Add tests for:
   - strategic/high-impact selection;
   - capacity limit;
   - mission-count limit;
   - blocked/unavailable exclusion;
   - overdue boost;
   - deterministic tie-breaking;
   - low-energy penalty;
   - idempotent repeated generation;
   - five-year/annual/objective lineage in persisted missions.

### C. Planning behavior

The first slice must support:

1. An active five-year plan.
2. An active annual plan linked to it.
3. Objectives linked to the annual plan.
4. Work items linked to objectives and assigned to a pilot user.
5. A daily check-in with capacity and energy, plus workspace defaults.
6. Deterministic selection of at most three feasible missions.
7. A human-readable reason and score breakdown for every selection.
8. Stored input/output snapshots and algorithm version.
9. Idempotency for repeated generation of the same user/date/version.
10. Status events for start, completion, skip and reschedule.
11. Completion evidence or a reason where appropriate.
12. No silent mutation of approved plans by AI.

If a work item is larger than today's capacity, do not select it. Surface it as needing breakdown. Do not overload the day simply to fill the mission count.

### D. UX acceptance

Keep the interface Hebrew-first, calm and focus-oriented:

- `/today` answers only: what matters now, why, how long, and what was completed.
- One primary mission and no more than two support missions.
- `/plan` visibly connects five-year and annual planning to objectives and work.
- Persistent drafts and richer planning forms may be deferred, but the current UI must be keyboard usable and responsive.
- No autoplay, decorative motion, noisy dashboard widgets or hidden mission rationale.
- Respect reduced-motion preferences.

### E. Isolated deployment

1. Create the project secret file with owner-only permissions; never commit it.
2. Run `docker compose config` and save redacted output.
3. Build images.
4. Start only this project's `db`, `web` and `worker` services.
5. Apply migration and seed idempotently.
6. Verify all services and health checks.
7. Verify web is bound only to loopback.
8. Verify PostgreSQL has no published host port.
9. Prove the worker creates no duplicate generation run or mission on repeated polls.
10. Access the UI through an SSH tunnel before any edge changes.

Do not create the public Nginx route or DNS record in this iteration unless the operator explicitly authorizes that separate step after reviewing the loopback result.

### F. Operational evidence

Create:

- `artifacts/iteration-01-inventory.md`
- `artifacts/iteration-01-test-report.md`
- `artifacts/iteration-01-deployment-report.md`
- `artifacts/iteration-01-rollback.md`
- `artifacts/iteration-01-open-risks.md`

Include commands, exit codes, relevant redacted output, image/container names, port, migration status, test totals, health response, and exact rollback steps.

## Required validation commands

Adapt only where necessary and record the actual commands used:

```bash
npm install
npm run db:generate
npx prisma format --schema packages/db/prisma/schema.prisma
npx prisma validate --schema packages/db/prisma/schema.prisma
npm run typecheck
npm test
docker compose config
docker compose build
docker compose up -d db web worker
docker compose exec web /usr/local/bin/clear-pill-with-db npm run db:seed
docker compose ps
curl -fsS http://127.0.0.1:${WEB_PORT:-3070}/api/health
```

Also call the generation endpoint twice for the same date and prove that the result and database cardinality remain stable.

## Completion format

Return a concise execution report with:

1. **Implemented**
2. **Validated**
3. **Deployment state**
4. **Exact local URL / SSH-tunnel command**
5. **Files changed**
6. **Rollback**
7. **Open risks and the single next iteration**

Do not claim success without command evidence. If something is blocked, leave the stack in the safest working state and document the exact blocker rather than making unrelated infrastructure changes.

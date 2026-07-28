# Validation Report — The Clear Pill Planning-First Starter v0.1

**Generated:** 2026-07-28T16:21:48Z  
**Validation environment:** Node.js 22.16.0, npm 10.9.2, TypeScript 5.8.3, Python 3, Linux container.

## Passed in this environment

- Parsed all **9 JSON** configuration/package files successfully.
- Parsed `compose.yaml` successfully and asserted:
  - `db`, `web`, and `worker` services exist;
  - web defaults to a loopback-only bind;
  - PostgreSQL has no published host port;
  - the database network is marked internal.
- Passed shell syntax checks for both database secret wrapper scripts.
- Compiled the read-only Porkbun helper with Python and proved its non-allowlisted-domain guard exits with code `2`.
- Transpiled **14 TypeScript/TSX implementation files** without syntax diagnostics.
- Strict-compiled the dependency-free planning core.
- Passed **9 planning smoke assertions** covering:
  1. strategic/high-impact ordering;
  2. daily capacity enforcement;
  3. blocked-work exclusion;
  4. overdue-work boost;
  5. deterministic tie-breaking and repeatability;
  6. mission-count enforcement;
  7. future-availability deferral;
  8. oversized-work deferral;
  9. low-energy-day penalty.
- Searched the starter for likely credential material. No real credentials or generated secret files are included.

## Deliberately not claimed as completed here

This execution environment does not provide Docker and the repository dependencies were not installed. Therefore the following still must be run on the controlled Hetzner pilot host before deployment is called successful:

- dependency resolution and lockfile creation;
- Prisma format, schema validation, client generation, and migration deployment;
- full workspace type-check and Vitest run;
- Next.js production build;
- Docker Compose configuration/build/start and health checks;
- live PostgreSQL persistence/idempotency verification;
- read-only Porkbun API verification using the server's existing credential files;
- Nginx/Certbot inventory and any later protected staging edge configuration.

`CODEX_ITERATION_01.md` defines the exact conservative execution and evidence requirements for those host-dependent checks.

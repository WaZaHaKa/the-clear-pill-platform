# Security Baseline

- Bind the pilot app to `127.0.0.1`, not a public interface.
- Keep PostgreSQL on the internal Compose network with no host port.
- Store PostgreSQL password in a Compose-mounted file secret.
- Do not pass Porkbun keys into application containers.
- Do not store credentials in `.env`, Git, logs, screenshots or generated reports.
- Reuse the server's existing root-owned ACME/Porkbun credential file when possible.
- Do not enable `DEMO_MODE` on a public unprotected hostname.
- Add authentication, tenant authorization, CSRF review, rate limiting and security headers before production exposure.
- Back up PostgreSQL and perform a restore rehearsal before entering real customer data.
- Log identifiers and event summaries, never secrets or full sensitive message bodies.

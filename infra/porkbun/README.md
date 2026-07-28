# Porkbun DNS boundary

Porkbun remains registrar and authoritative DNS. Do not change nameservers or transfer the domain.

## First action: read-only verification

Use the existing root-owned credential files on the server; do not copy them into this repository.

```bash
python3 infra/porkbun/porkbun_readonly_check.py \
  --domain theclearpill.online \
  --api-key-file /path/to/existing/api-key-file \
  --secret-api-key-file /path/to/existing/secret-key-file
```

The helper only calls `ping` and `dns/retrieve`; it has no write path.

## Staging record plan

Begin with an explicit record rather than a broad wildcard:

```text
staging.theclearpill.online  A  <Hetzner IPv4>
```

Only add `app`, `api`, `hooks`, apex or wildcard records when their corresponding services are ready. This prevents unrelated or mistyped subdomains from reaching the shared server.

## Credential rules

- Prefer a dedicated Porkbun API key restricted to the Hetzner source IP and relevant domain when the account supports those restrictions.
- Keep files owner-readable only.
- Never log request headers or credential values.
- Do not mount Porkbun credentials into the web, worker or database containers.
- Reuse the existing ACME automation rather than introducing a second certificate client without a migration reason.

# TLS with Porkbun DNS-01

The wildcard certificate can remain fully automated while Porkbun stays authoritative DNS. Wildcards require DNS validation, so the existing Certbot/Porkbun authentication and cleanup hooks should be inventoried and reused.

## Desired certificate lineage

```text
theclearpill.online
*.theclearpill.online
```

## Controlled procedure

1. Inspect existing Certbot version, lineages, renewal configuration and hook paths.
2. Confirm the current Porkbun hook adds and removes only the requested `_acme-challenge` TXT records.
3. Confirm credentials are read from the existing root-owned file and are never echoed.
4. Run staging or dry-run validation before issuance/renewal.
5. Validate the certificate files and `nginx -t` before reload.
6. Add a deploy hook that reloads Nginx only after a successful configuration test.
7. Record issuance, expiry, renewal timer and rollback steps.

Do not replace working host certificate automation with an application container. DNS/TLS remains an edge responsibility.

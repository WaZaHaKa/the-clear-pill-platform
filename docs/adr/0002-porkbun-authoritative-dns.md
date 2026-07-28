# ADR-0002: Keep Porkbun as registrar and authoritative DNS

**Status:** Accepted

`theclearpill.online` remains at Porkbun. Existing API access on Hetzner will be reused for read-only inventory, DNS-01 certificate automation and narrowly scoped record changes.

No Cloud DNS migration is part of the current implementation. Credentials remain infrastructure secrets and are not mounted into the SaaS application.

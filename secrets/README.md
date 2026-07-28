# Local and server secrets

Create a password file before starting the stack:

```bash
mkdir -p secrets
umask 077
openssl rand -base64 36 > secrets/postgres_password.txt
```

Never commit this directory's secret files. Porkbun credentials are deliberately **not** consumed by the application stack. Reuse the server's existing root-owned Porkbun/ACME credential location instead of copying keys into this repository.

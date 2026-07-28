#!/usr/bin/env python3
"""Read-only Porkbun API verification for one explicitly named domain.

This helper never creates, edits, or deletes DNS records. It verifies API
connectivity and retrieves the current zone so an operator can plan changes.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

BASE_URL = "https://api.porkbun.com/api/json/v3"


def read_secret(explicit_path: str | None, env_name: str) -> str:
    if explicit_path:
        value = Path(explicit_path).read_text(encoding="utf-8").strip()
    else:
        value = os.environ.get(env_name, "").strip()
    if not value:
        raise ValueError(f"Missing {env_name}; pass its file path or set the environment variable")
    return value


def post_json(path: str, api_key: str, secret_key: str) -> dict[str, Any]:
    request = urllib.request.Request(
        f"{BASE_URL}/{path.lstrip('/')}",
        data=b"{}",
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-API-Key": api_key,
            "X-Secret-API-Key": secret_key,
            "User-Agent": "the-clear-pill-porkbun-readonly-check/0.1",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", "replace")
        raise RuntimeError(f"Porkbun API returned HTTP {error.code}: {body[:500]}") from error
    except urllib.error.URLError as error:
        raise RuntimeError(f"Porkbun API connection failed: {error.reason}") from error


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--domain", required=True, help="Exact domain to inspect")
    parser.add_argument("--api-key-file")
    parser.add_argument("--secret-api-key-file")
    parser.add_argument(
        "--expected-domain",
        default="theclearpill.online",
        help="Safety allowlist; must exactly match --domain",
    )
    args = parser.parse_args()

    domain = args.domain.strip().lower().rstrip(".")
    expected = args.expected_domain.strip().lower().rstrip(".")
    if domain != expected:
        print(
            json.dumps(
                {
                    "status": "refused",
                    "reason": "domain_not_allowlisted",
                    "domain": domain,
                    "expectedDomain": expected,
                }
            ),
            file=sys.stderr,
        )
        return 2

    try:
        api_key = read_secret(args.api_key_file, "PORKBUN_API_KEY")
        secret_key = read_secret(args.secret_api_key_file, "PORKBUN_SECRET_API_KEY")
        ping = post_json("ping", api_key, secret_key)
        zone = post_json(f"dns/retrieve/{domain}", api_key, secret_key)
    except (OSError, ValueError, RuntimeError, json.JSONDecodeError) as error:
        print(json.dumps({"status": "error", "error": str(error)}), file=sys.stderr)
        return 1

    records = zone.get("records", [])
    safe_records = [
        {
            "id": record.get("id"),
            "type": record.get("type"),
            "name": record.get("name"),
            "content": record.get("content"),
            "ttl": record.get("ttl"),
            "prio": record.get("prio"),
        }
        for record in records
    ]
    print(
        json.dumps(
            {
                "status": "ok",
                "domain": domain,
                "apiStatus": ping.get("status"),
                "recordCount": len(safe_records),
                "records": safe_records,
            },
            indent=2,
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

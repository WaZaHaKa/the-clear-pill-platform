#!/usr/bin/env bash
# Deploy/bootstrap The Clear Pill on the shared wzhk Hetzner server.
# Run as the normal deploy user, not root.
set -Eeuo pipefail
IFS=$'\n\t'
umask 077

REPO_SLUG="${REPO_SLUG:-WaZaHaKa/the-clear-pill-platform}"
REPO_URL="${REPO_URL:-https://github.com/${REPO_SLUG}.git}"
APP_BASE="${APP_BASE:-/opt/apps/theclearpill}"
REPO_DIR="${REPO_DIR:-${APP_BASE}/the-clear-pill-platform}"
SOURCE_BRANCH="${SOURCE_BRANCH:-main}"
CODEX_BRANCH="${CODEX_BRANCH:-codex/iteration-01}"
START_CODEX="${START_CODEX:-1}"
START_REMOTE_DAEMON="${START_REMOTE_DAEMON:-1}"
RUN_IN_FOREGROUND="${RUN_IN_FOREGROUND:-0}"
STATE_DIR="${STATE_DIR:-${HOME}/.local/state/the-clear-pill-platform/codex}"

usage() {
  cat <<'EOF'
Usage: deploy-the-clear-pill-platform.sh [options]

Options:
  --repo-dir PATH       Override /opt/apps/theclearpill/the-clear-pill-platform
  --branch NAME         Git source branch (default: main)
  --codex-branch NAME   Working branch for Codex (default: codex/iteration-01)
  --no-start            Prepare repo/Codex but do not launch the initial Codex run
  --no-remote-daemon    Do not call `codex remote-control start`
  --foreground          Run the initial Codex execution in this terminal
  -h, --help            Show this help

Environment overrides use the same uppercase names shown near the top of the script.
EOF
}

while (($#)); do
  case "$1" in
    --repo-dir)
      [[ $# -ge 2 ]] || { echo "Missing value for --repo-dir" >&2; exit 2; }
      REPO_DIR="$2"; shift 2 ;;
    --branch)
      [[ $# -ge 2 ]] || { echo "Missing value for --branch" >&2; exit 2; }
      SOURCE_BRANCH="$2"; shift 2 ;;
    --codex-branch)
      [[ $# -ge 2 ]] || { echo "Missing value for --codex-branch" >&2; exit 2; }
      CODEX_BRANCH="$2"; shift 2 ;;
    --no-start)
      START_CODEX=0; shift ;;
    --no-remote-daemon)
      START_REMOTE_DAEMON=0; shift ;;
    --foreground)
      RUN_IN_FOREGROUND=1; shift ;;
    -h|--help)
      usage; exit 0 ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 2 ;;
  esac
done

log()  { printf '\n==> %s\n' "$*"; }
warn() { printf '\nWARNING: %s\n' "$*" >&2; }
die()  { printf '\nERROR: %s\n' "$*" >&2; exit 1; }

on_error() {
  local exit_code=$?
  printf '\nERROR: bootstrap failed at line %s (exit %s).\n' "${BASH_LINENO[0]:-unknown}" "$exit_code" >&2
  exit "$exit_code"
}
trap on_error ERR

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "Required command '$1' is missing. This script does not alter system packages on the shared server."
}

if [[ ${EUID} -eq 0 ]]; then
  die "Run this script as the normal deploy user, not as root."
fi

require_command git
require_command curl
require_command python3
require_command docker

docker compose version >/dev/null 2>&1 || die "Docker Compose v2 is not available to user '$USER'."

group_name="$(id -gn)"
repo_parent="$(dirname "$REPO_DIR")"

ensure_repository_directory() {
  if [[ -d "$REPO_DIR/.git" ]]; then
    return
  fi

  if [[ -e "$REPO_DIR" && ! -d "$REPO_DIR" ]]; then
    die "$REPO_DIR exists but is not a directory."
  fi

  if [[ -d "$REPO_DIR" ]] && [[ -n "$(find "$REPO_DIR" -mindepth 1 -maxdepth 1 -print -quit 2>/dev/null)" ]]; then
    die "$REPO_DIR exists, is non-empty, and is not a Git repository."
  fi

  if [[ -d "$repo_parent" && -w "$repo_parent" ]]; then
    mkdir -p "$REPO_DIR"
    return
  fi

  if command -v sudo >/dev/null 2>&1; then
    log "Creating the narrowly scoped application directory with sudo"
    sudo install -d -o "$USER" -g "$group_name" -m 0750 "$REPO_DIR"
    return
  fi

  die "Cannot create $REPO_DIR. Create it for user '$USER' and rerun the script."
}

ensure_repository_directory

normalize_remote_url() {
  local value="${1%/}"
  value="${value%.git}"
  case "$value" in
    git@github.com:*) value="https://github.com/${value#git@github.com:}"; printf '%s\n' "${value,,}" ;;
    ssh://git@github.com/*) value="https://github.com/${value#ssh://git@github.com/}"; printf '%s\n' "${value,,}" ;;
    https://github.com/*) printf '%s\n' "${value,,}" ;;
    *) printf '%s\n' "$value" ;;
  esac
}

if [[ ! -d "$REPO_DIR/.git" ]]; then
  log "Cloning $REPO_SLUG into $REPO_DIR"
  git clone --origin origin --branch "$SOURCE_BRANCH" --single-branch "$REPO_URL" "$REPO_DIR"
else
  log "Verifying and updating the existing clone"
  origin_url="$(git -C "$REPO_DIR" remote get-url origin)"
  normalized_origin="$(normalize_remote_url "$origin_url")"
  normalized_expected="$(normalize_remote_url "$REPO_URL")"
  [[ "$normalized_origin" == "$normalized_expected" ]] || \
    die "Unexpected origin '$origin_url'; expected $REPO_URL."

  git -C "$REPO_DIR" diff --quiet
  git -C "$REPO_DIR" diff --cached --quiet
  if [[ -n "$(git -C "$REPO_DIR" status --porcelain=v1 --untracked-files=all)" ]]; then
    die "The existing repository is dirty. Review or commit its changes before rerunning this bootstrap."
  fi

  git -C "$REPO_DIR" fetch --prune origin
  git -C "$REPO_DIR" switch "$SOURCE_BRANCH"
  git -C "$REPO_DIR" pull --ff-only origin "$SOURCE_BRANCH"
fi

for required in CODEX_ITERATION_01.md compose.yaml package.json Dockerfile; do
  [[ -f "$REPO_DIR/$required" ]] || die "Required repository file is missing: $required"
done

log "Preparing the isolated Codex working branch"
if git -C "$REPO_DIR" show-ref --verify --quiet "refs/heads/$CODEX_BRANCH"; then
  git -C "$REPO_DIR" switch "$CODEX_BRANCH"
else
  git -C "$REPO_DIR" switch -c "$CODEX_BRANCH"
fi

install_codex() {
  export PATH="$HOME/.local/bin:$HOME/.codex/bin:$PATH"

  if ! command -v codex >/dev/null 2>&1; then
    log "Installing the current Codex CLI with OpenAI's official installer"
    curl -fsSL https://chatgpt.com/codex/install.sh | CODEX_NON_INTERACTIVE=1 CODEX_INSTALL_DIR="$HOME/.local/bin" sh
    hash -r
  fi

  local discovered=""
  discovered="$(command -v codex 2>/dev/null || true)"

  if [[ -z "$discovered" ]]; then
    local candidate
    for candidate in "$HOME/.local/bin/codex" "$HOME/.codex/bin/codex"; do
      if [[ -x "$candidate" ]]; then
        discovered="$candidate"
        break
      fi
    done
  fi

  if [[ -z "$discovered" ]]; then
    discovered="$(find "$HOME" -maxdepth 5 -type f -name codex -perm -u+x -print -quit 2>/dev/null || true)"
  fi

  [[ -n "$discovered" ]] || die "Codex installation completed but the executable could not be located."

  mkdir -p "$HOME/.local/bin"
  local real_codex
  real_codex="$(readlink -f "$discovered")"
  if [[ "$real_codex" != "$(readlink -f "$HOME/.local/bin/codex" 2>/dev/null || true)" ]]; then
    ln -sfn "$real_codex" "$HOME/.local/bin/codex"
  fi

  export PATH="$HOME/.local/bin:$PATH"
  CODEX_BIN="$HOME/.local/bin/codex"
  [[ -x "$CODEX_BIN" ]] || die "Codex is not executable at $CODEX_BIN."
}

add_codex_path_marker() {
  local shell_file="$1"
  mkdir -p "$(dirname "$shell_file")"
  touch "$shell_file"
  if ! grep -Fq '# >>> the-clear-pill-codex-path >>>' "$shell_file"; then
    cat >>"$shell_file" <<'EOF'

# >>> the-clear-pill-codex-path >>>
case ":$PATH:" in
  *":$HOME/.local/bin:"*) ;;
  *) export PATH="$HOME/.local/bin:$PATH" ;;
esac
# <<< the-clear-pill-codex-path <<<
EOF
  fi
}

install_codex
add_codex_path_marker "$HOME/.profile"
add_codex_path_marker "$HOME/.bashrc"
if [[ -f "$HOME/.bash_profile" ]]; then
  add_codex_path_marker "$HOME/.bash_profile"
elif [[ -f "$HOME/.bash_login" ]]; then
  add_codex_path_marker "$HOME/.bash_login"
fi
if [[ "${SHELL:-}" == */zsh ]]; then
  add_codex_path_marker "$HOME/.zprofile"
fi

log "Codex CLI: $($CODEX_BIN --version)"

if ! "$CODEX_BIN" login status >/dev/null 2>&1; then
  log "Codex authentication is required once"
  if [[ -n "${CODEX_ACCESS_TOKEN:-}" ]]; then
    printf '%s' "$CODEX_ACCESS_TOKEN" | "$CODEX_BIN" login --with-access-token
  elif [[ -n "${OPENAI_API_KEY:-}" ]]; then
    printf '%s' "$OPENAI_API_KEY" | "$CODEX_BIN" login --with-api-key
  else
    cat <<'EOF'
Codex will now show a device-login URL and one-time code.
Open that URL on your Windows PC, sign in with the same ChatGPT account/workspace,
and enter the code. The script resumes automatically after authentication.
EOF
    "$CODEX_BIN" login --device-auth
  fi
fi
"$CODEX_BIN" login status

mkdir -p "$HOME/.codex"
chmod 0700 "$HOME/.codex"
USER_CODEX_CONFIG="$HOME/.codex/config.toml"

log "Trusting only this repository in the user-level Codex configuration"
python3 - "$USER_CODEX_CONFIG" "$REPO_DIR" <<'PY'
from __future__ import annotations

import os
import re
import stat
import sys
import tempfile
import tomllib
from pathlib import Path

config_path = Path(sys.argv[1])
repo_path = sys.argv[2]
text = config_path.read_text(encoding="utf-8") if config_path.exists() else ""
if text.strip():
    try:
        tomllib.loads(text)
    except Exception as exc:
        raise SystemExit(f"Existing Codex config is invalid; refusing to modify it: {exc}")

escaped = repo_path.replace("\\", "\\\\").replace('"', '\\"')
header = f'[projects."{escaped}"]'
managed_start = "# >>> the-clear-pill-managed-project-trust >>>"
managed_end = "# <<< the-clear-pill-managed-project-trust <<<"

text = re.sub(
    rf"(?ms)^\s*{re.escape(managed_start)}\n.*?^\s*{re.escape(managed_end)}\s*\n?",
    "",
    text,
)

header_match = re.search(rf"(?m)^{re.escape(header)}\s*$", text)
if header_match:
    block_start = header_match.end()
    next_header = re.search(r"(?m)^\s*\[", text[block_start:])
    block_end = block_start + (next_header.start() if next_header else len(text[block_start:]))
    block = text[block_start:block_end]
    if re.search(r"(?m)^\s*trust_level\s*=", block):
        block = re.sub(
            r'(?m)^\s*trust_level\s*=\s*[^\n]+$',
            'trust_level = "trusted"',
            block,
            count=1,
        )
    else:
        block = '\ntrust_level = "trusted"' + block
    text = text[:block_start] + block + text[block_end:]
else:
    if text and not text.endswith("\n"):
        text += "\n"
    text += (
        f"\n{managed_start}\n"
        f"{header}\n"
        'trust_level = "trusted"\n'
        f"{managed_end}\n"
    )

try:
    tomllib.loads(text)
except Exception as exc:
    raise SystemExit(f"Generated Codex config is invalid; original file was not replaced: {exc}")

config_path.parent.mkdir(parents=True, exist_ok=True)
fd, tmp_name = tempfile.mkstemp(prefix="config.toml.", dir=config_path.parent)
try:
    with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as handle:
        handle.write(text)
    os.chmod(tmp_name, stat.S_IRUSR | stat.S_IWUSR)
    os.replace(tmp_name, config_path)
finally:
    if os.path.exists(tmp_name):
        os.unlink(tmp_name)
PY
chmod 0600 "$USER_CODEX_CONFIG"

log "Writing project-local Codex auto-review and sandbox policy"
mkdir -p "$REPO_DIR/.codex"
cat >"$REPO_DIR/.codex/config.toml" <<EOF
approval_policy = "on-request"
approvals_reviewer = "auto_review"
sandbox_mode = "workspace-write"
allow_login_shell = false
web_search = "cached"

[sandbox_workspace_write]
network_access = true
writable_roots = ["$REPO_DIR"]

[shell_environment_policy]
inherit = "all"
exclude = [
  "*KEY*",
  "*TOKEN*",
  "*SECRET*",
  "*PASSWORD*",
  "*CREDENTIAL*",
  "AWS_*",
  "AZURE_*",
  "GCP_*",
  "GOOGLE_*",
  "PORKBUN_*"
]

[auto_review]
policy = """
This is a shared production Hetzner server. Approve only actions that are narrowly
required to implement and validate The Clear Pill repository at $REPO_DIR.

Allow read-only host inventory; edits inside this repository; dependency installs
inside the repository; loopback curl checks; and Docker Compose commands explicitly
scoped to this repository and Compose project.

Deny sudo or privilege escalation; package-manager changes; firewall, SSH, systemd,
Nginx, Certbot, DNS, or Porkbun mutations; secret discovery or printing; public
listeners; broad filesystem or Git cleanup; Docker system prune; and any command
that stops, removes, restarts, recreates, inspects secrets from, or otherwise changes
unrelated containers, networks, volumes, databases, repositories, or services.

Deny pushes, force-pushes, merges into main, or public exposure unless the operator
explicitly requests that separate action after reviewing the loopback pilot.
When scope is ambiguous, deny and require a safer repository-scoped alternative.
"""
EOF
chmod 0600 "$REPO_DIR/.codex/config.toml"
python3 - "$REPO_DIR/.codex/config.toml" <<'PY_TOML'
import sys
import tomllib
from pathlib import Path

with Path(sys.argv[1]).open("rb") as handle:
    tomllib.load(handle)
PY_TOML

exclude_file="$REPO_DIR/.git/info/exclude"
touch "$exclude_file"
grep -Fxq '.codex/' "$exclude_file" || printf '%s\n' '.codex/' >>"$exclude_file"

mkdir -p "$STATE_DIR"
chmod 0700 "$STATE_DIR"

cat >"$HOME/.local/bin/the-clear-pill-codex" <<EOF
#!/usr/bin/env bash
set -Eeuo pipefail
exec "$CODEX_BIN" \
  --cd "$REPO_DIR" \
  --sandbox workspace-write \
  --ask-for-approval on-request \
  --strict-config \
  --config 'approvals_reviewer="auto_review"' \
  "\$@"
EOF
chmod 0750 "$HOME/.local/bin/the-clear-pill-codex"

if [[ "$START_REMOTE_DAEMON" == "1" ]]; then
  log "Starting Codex remote-control support without opening a public listener"
  if command -v timeout >/dev/null 2>&1; then
    remote_start=(timeout 30s "$CODEX_BIN" remote-control start)
  else
    remote_start=("$CODEX_BIN" remote-control start)
  fi
  if "${remote_start[@]}" >/dev/null 2>&1; then
    log "Codex remote-control daemon is ready"
  else
    warn "The remote-control daemon did not start. This is non-fatal: the Windows ChatGPT/Codex app can still start the remote app server over SSH."
  fi
fi

RUNNER="$STATE_DIR/run-iteration-01.sh"
PID_FILE="$STATE_DIR/iteration-01.pid"
LATEST_LOG_LINK="$STATE_DIR/latest.log"
STATUS_FILE="$STATE_DIR/iteration-01.status"

cat >"$RUNNER" <<EOF
#!/usr/bin/env bash
set -Eeuo pipefail
cd "$REPO_DIR"
printf 'running %s\n' "\$(date -Is)" >"$STATUS_FILE"
set +e
{
  cat <<'PREAMBLE'
Execute CODEX_ITERATION_01.md completely on the current codex/iteration-01 branch.
Do not push, merge into main, change public DNS/Nginx, or touch unrelated workloads.
Keep all changes, evidence, and rollback instructions repository-scoped. Commit only
when validation is successful enough to make the commit honest; otherwise leave a
clear report and the safest working state.

PREAMBLE
  cat "$REPO_DIR/CODEX_ITERATION_01.md"
} | "$CODEX_BIN" exec \
      --cd "$REPO_DIR" \
      --sandbox workspace-write \
      --strict-config \
      --config 'approval_policy="on-request"' \
      --config 'approvals_reviewer="auto_review"' \
      --config 'sandbox_workspace_write.network_access=true' \
      -
rc=\$?
set -e
if [[ \$rc -eq 0 ]]; then
  printf 'completed %s exit=0\n' "\$(date -Is)" >"$STATUS_FILE"
else
  printf 'failed %s exit=%s\n' "\$(date -Is)" "\$rc" >"$STATUS_FILE"
fi
exit \$rc
EOF
chmod 0750 "$RUNNER"

start_initial_codex_run() {
  if [[ -f "$PID_FILE" ]]; then
    old_pid="$(cat "$PID_FILE" 2>/dev/null || true)"
    if [[ "$old_pid" =~ ^[0-9]+$ ]] && kill -0 "$old_pid" 2>/dev/null; then
      warn "An Iteration 01 Codex run is already active as PID $old_pid; not starting a duplicate."
      return
    fi
  fi

  local timestamp log_file pid
  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  log_file="$STATE_DIR/iteration-01-${timestamp}.log"
  ln -sfn "$log_file" "$LATEST_LOG_LINK"

  if [[ "$RUN_IN_FOREGROUND" == "1" ]]; then
    log "Starting Codex Iteration 01 in the foreground"
    "$RUNNER" 2>&1 | tee "$log_file"
    return
  fi

  log "Starting Codex Iteration 01 in the background"
  nohup "$RUNNER" >"$log_file" 2>&1 </dev/null &
  pid=$!
  printf '%s\n' "$pid" >"$PID_FILE"
  sleep 1
  if ! kill -0 "$pid" 2>/dev/null; then
    warn "The Codex process exited immediately. Inspect $log_file"
  fi

  printf 'Codex PID: %s\n' "$pid"
  printf 'Codex log: %s\n' "$log_file"
  printf 'Monitor: tail -f %q\n' "$LATEST_LOG_LINK"
}

if [[ "$START_CODEX" == "1" ]]; then
  start_initial_codex_run
else
  warn "Initial Codex execution was not started (--no-start)."
fi

cat <<EOF

Bootstrap complete.

Repository:
  $REPO_DIR

Codex working branch:
  $CODEX_BRANCH

Codex status:
  cat $STATUS_FILE

Codex log:
  tail -f $LATEST_LOG_LINK

Loopback pilot tunnel after Codex reports a healthy deployment:
  ssh -L 3070:127.0.0.1:3070 wzhk

Windows ChatGPT/Codex app:
  Settings -> Connections -> SSH -> add/enable host 'wzhk'
  Remote project folder: $REPO_DIR

The app uses SSH to start/manage its remote Codex app server. No Codex TCP or
WebSocket port was exposed publicly by this script.
EOF

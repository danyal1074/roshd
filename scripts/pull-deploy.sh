#!/usr/bin/env bash
# Optional pull-based deploy for when GitHub-hosted runners cannot open SSH
# to the VPS. A systemd timer (scripts/systemd/roshd-pull-deploy.timer) runs
# this every few minutes. It fetches origin/main and starts
# deploy-on-existing-server.sh only when that commit is not already checked out.
#
# Proxy, if the server cannot reach GitHub directly, belongs in
# /etc/roshd/deploy.env (root-owned, mode 640). That file is not in git.
set -euo pipefail

unset CDPATH

log() {
  local line
  line="[$(date -Is)] $*"
  printf '%s\n' "$line"
  if [ -n "${LOG_FILE:-}" ]; then
    printf '%s\n' "$line" >> "$LOG_FILE" || true
  fi
}

load_deploy_env() {
  local env_file="/etc/roshd/deploy.env"
  if [ ! -e "$env_file" ]; then
    return 0
  fi
  if [ ! -f "$env_file" ]; then
    echo "❌ ${env_file} is not a regular file." >&2
    exit 1
  fi
  local mode owner group_digit other_digit
  mode="$(stat -c '%a' "$env_file")"
  owner="$(stat -c '%u' "$env_file")"
  if [ "$owner" != "0" ]; then
    echo "❌ ${env_file} must be owned by root (it is sourced by the shell)." >&2
    exit 1
  fi
  group_digit=$(( (10#$mode / 10) % 10 ))
  other_digit=$(( 10#$mode % 10 ))
  if (( (group_digit & 2) != 0 || (other_digit & 2) != 0 )); then
    echo "❌ ${env_file} must not be writable by group or others." >&2
    exit 1
  fi
  if [ ! -r "$env_file" ]; then
    echo "❌ ${env_file} برای کاربر $(id -un) خواندنی نیست. مالکیت root:deploy و مجوز 640 بگذارید." >&2
    exit 1
  fi
  set -a
  # shellcheck disable=SC1090
  . "$env_file"
  set +a
}

install_dir="${INSTALL_DIR:-/var/www/roshd}"
branch="${DEPLOY_BRANCH:-main}"
load_deploy_env
INSTALL_DIR="$install_dir"
BRANCH="$branch"
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:${PATH:-}"
export GIT_TERMINAL_PROMPT=0

LOG_FILE="${ROSHD_PULL_LOG:-${INSTALL_DIR}/logs/pull-deploy.log}"
if [ -d "$INSTALL_DIR" ] && mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null; then
  touch "$LOG_FILE" || LOG_FILE=""
else
  LOG_FILE=""
fi

if [ ! -d "${INSTALL_DIR}/.git" ]; then
  log "ERROR: ${INSTALL_DIR} is not a git checkout. Clone the repository once, then enable the timer."
  exit 1
fi

cd "$INSTALL_DIR"

log "Fetching origin/${BRANCH}"
if ! git fetch --prune origin "$BRANCH"; then
  log "ERROR: git fetch failed. If GitHub is blocked from this server, set https_proxy in /etc/roshd/deploy.env and keep the origin URL on https://github.com/."
  exit 1
fi

local_sha="$(git rev-parse HEAD)"
remote_sha="$(git rev-parse "origin/${BRANCH}")"
if [ "$local_sha" = "$remote_sha" ]; then
  log "No change at ${remote_sha}. Skipping deploy."
  exit 0
fi

log "Change detected ${local_sha} -> ${remote_sha}. Running deploy-on-existing-server.sh"
deploy_ok=0
if [ -n "$LOG_FILE" ]; then
  bash "${INSTALL_DIR}/deploy-on-existing-server.sh" 2>&1 | tee -a "$LOG_FILE" || deploy_ok=$?
else
  bash "${INSTALL_DIR}/deploy-on-existing-server.sh" || deploy_ok=$?
fi
if [ "$deploy_ok" -ne 0 ]; then
  log "ERROR: deploy-on-existing-server.sh failed with status ${deploy_ok}."
  exit "$deploy_ok"
fi
log "Deploy finished at ${remote_sha}."

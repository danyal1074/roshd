#!/usr/bin/env bash
# Open an SSH session from a GitHub-hosted runner and run deploy-on-existing-server.sh.
# Every connection detail comes from the environment. GitHub Actions maps them from
# repository secrets (SSH_HOST, SSH_PORT, SSH_USER, SSH_PRIVATE_KEY, SSH_KNOWN_HOSTS).
# The remote script exits non-zero when /api/health does not succeed, which fails the job.
set -euo pipefail

require_secret() {
  local name="$1"
  if [ -z "${!name:-}" ]; then
    echo "::error::GitHub Actions secret ${name} is empty. Add it under Settings, Secrets and variables, Actions."
    exit 1
  fi
}

require_secret SSH_HOST
require_secret SSH_USER
require_secret SSH_PRIVATE_KEY

port="${SSH_PORT:-22}"
if [ -z "$port" ]; then
  port=22
fi
if [[ ! "$port" =~ ^[0-9]{1,5}$ ]] || [ "$port" -lt 1 ] || [ "$port" -gt 65535 ]; then
  echo "::error::SSH_PORT must be a TCP port from 1 to 65535."
  exit 1
fi
if [[ ! "$SSH_USER" =~ ^[a-z_][a-z0-9_-]{0,31}$ ]]; then
  echo "::error::SSH_USER must be a Linux username (letters, digits, underscore, hyphen)."
  exit 1
fi
if [[ ! "$SSH_HOST" =~ ^[A-Za-z0-9.:-]{1,253}$ ]]; then
  echo "::error::SSH_HOST must be a hostname or IP address, with no spaces."
  exit 1
fi

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
script="${root}/deploy-on-existing-server.sh"
if [ ! -f "$script" ]; then
  echo "::error::Missing ${script}"
  exit 1
fi

umask 077
ssh_dir="$(mktemp -d "${RUNNER_TEMP:-/tmp}/roshd-ssh.XXXXXX")"
trap 'rm -rf "$ssh_dir"' EXIT
keyfile="${ssh_dir}/id"
known="${ssh_dir}/known_hosts"

printf '%s\n' "$SSH_PRIVATE_KEY" | tr -d '\r' > "$keyfile"
chmod 600 "$keyfile"
if ! grep -q 'PRIVATE KEY' "$keyfile"; then
  echo "::error::SSH_PRIVATE_KEY does not look like a private key (missing the PRIVATE KEY header)."
  exit 1
fi

ssh_opts=(
  -i "$keyfile"
  -o IdentitiesOnly=yes
  -o BatchMode=yes
  -o PreferredAuthentications=publickey
  -o PasswordAuthentication=no
  -o KbdInteractiveAuthentication=no
  -o ConnectTimeout=25
  -o ServerAliveInterval=30
  -o ServerAliveCountMax=40
  -p "$port"
)

if [ -n "${SSH_KNOWN_HOSTS:-}" ]; then
  printf '%s\n' "$SSH_KNOWN_HOSTS" | tr -d '\r' > "$known"
  chmod 644 "$known"
  ssh_opts+=(-o StrictHostKeyChecking=yes -o UserKnownHostsFile="$known")
else
  echo "::warning::SSH_KNOWN_HOSTS is empty. This job accepts a new host key once (accept-new) and cannot notice a later key change, because the runner disk is thrown away. Add the SSH_KNOWN_HOSTS secret (output of ssh-keyscan)."
  : > "$known"
  chmod 644 "$known"
  ssh_opts+=(-o StrictHostKeyChecking=accept-new -o UserKnownHostsFile="$known")
fi

# Bracket IPv6 literals so OpenSSH parses them as a host, not a port separator.
case "$SSH_HOST" in
  *:*) dest="${SSH_USER}@[${SSH_HOST}]" ;;
  *) dest="${SSH_USER}@${SSH_HOST}" ;;
esac

# The deploy user's login shell only has to parse this fixed command (bash or dash).
# The inner bash reads the deploy script from stdin into a private file before git,
# npm, or pm2 can consume that stdin. A non-zero health check still fails the job.
remote_cmd=$(cat <<'EOF'
bash -c 'set -euo pipefail; f=$(mktemp /tmp/roshd-deploy.XXXXXX); trap "rm -f \"$f\"" EXIT; cat > "$f"; chmod 700 "$f"; bash "$f"'
EOF
)

echo "Connecting as ${SSH_USER} to ${SSH_HOST} port ${port} and running deploy-on-existing-server.sh"
# shellcheck disable=SC2029
ssh "${ssh_opts[@]}" "$dest" "$remote_cmd" < "$script"

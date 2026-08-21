#!/bin/bash
set -euo pipefail

# Everything this script writes is node state, including the server private key — owner-only.
umask 077

# AmneziaWG server init. The interface configuration is rendered by @vancloak/infrastructure
# from the endpoint desired state and arrives as a read-only bind mount
# (CONFIGURATION_SOURCE_FILE). Nothing is generated here: keys, obfuscation and peers all
# come from the application database.
#
# Idempotent: the configuration is copied into the state volume once. On later starts the
# volume already carries the peers written by apply-peers.sh, so the source is only used to
# verify that the deployment still matches what the node is running.

: "${STATE_DIRECTORY:?}" "${INTERFACE:?}" "${CONFIGURATION_FILE:?}" \
  "${CONFIGURATION_SOURCE_FILE:?}" "${SERVER_PUBLIC_KEY_FILE:?}" "${SERVER_PUBLIC_KEY:?}"

# Egress interface for NAT. This MASQUERADE runs INSIDE the container, so it must be the
# container's own default-route interface (eth0 on a docker bridge) — NOT the host's interface.
# Detect it at runtime so it's correct regardless of how the host names its NICs.
EGRESS_DEVICE="${EGRESS_DEVICE:-$(ip route show default | awk '/default/ {print $5; exit}')}"
EGRESS_DEVICE="${EGRESS_DEVICE:-eth0}"

mkdir -p "${STATE_DIRECTORY}"

# The settings of the [Interface] section from stdin, one "key=value" per line, sorted.
interface_settings() {
  awk -F' *= *' '
    /^\[Peer\]/ { exit }
    /^\[Interface\]/ { next }
    /^[[:space:]]*(#|$)/ { next }
    { print $1 "=" $2 }
  ' | sort
}

# The deployed configuration with the same egress-device substitution the install branch
# applies, so PostUp/PostDown compare against the state config instead of the placeholder.
substituted_configuration_source() {
  sed "s/__EGRESS_DEVICE__/${EGRESS_DEVICE}/g" "${CONFIGURATION_SOURCE_FILE}"
}

if [[ ! -f "${CONFIGURATION_FILE}" ]]; then
  # Written to a temp file and moved into place: the configuration file only ever exists
  # complete, so a partially written config can never pass the verify branch below.
  echo "[init] installing ${CONFIGURATION_FILE} from the deployed configuration"
  substituted_configuration_source > "${CONFIGURATION_FILE}.tmp"
  mv "${CONFIGURATION_FILE}.tmp" "${CONFIGURATION_FILE}"

  # The public key is derivable from the private one in the configuration, but keeping it as
  # a file means the node can be inspected without reading the secret out of the config.
  printf '%s' "${SERVER_PUBLIC_KEY}" > "${SERVER_PUBLIC_KEY_FILE}"
  echo "[init] server public key: ${SERVER_PUBLIC_KEY}"
else
  echo "[init] existing config found — verifying state matches the deployment"

  # The state volume is written once and peers are appended to it, so a deployment that
  # changes the port, the server key, the obfuscation or the firewall rules silently
  # diverges from the live state. Refuse to start instead: a loud failed deploy beats a
  # half-broken node. The difference is computed in awk itself: diff's output format is not
  # the same between GNU and busybox, so the comparison must not depend on it. Lines are
  # counted, not just collected — a line repeated in one config and single in the other is
  # a divergence too. Only the names of the diverging settings are reported. The section
  # holds the server private key, so printing values here would put it in the deploy log.
  DIVERGED=$(awk '
    FILENAME == ARGV[1] { state[$0]++; next }
    { deployed[$0]++ }
    END {
      for (line in state) if (state[line] != deployed[line]) { split(line, part, "="); keys[part[1]] = 1 }
      for (line in deployed) if (!(line in state)) { split(line, part, "="); keys[part[1]] = 1 }
      for (key in keys) names = names key " "
      print names
    }
  ' <(interface_settings < "${CONFIGURATION_FILE}") \
    <(substituted_configuration_source | interface_settings))

  if [[ -n "${DIVERGED}" ]]; then
    echo "[verify] state does not match the deployment for: ${DIVERGED}; refusing to start" >&2
    exit 1
  fi

  CONFIGURED_SERVER_PUBLIC_KEY=$(cat "${SERVER_PUBLIC_KEY_FILE}" 2>/dev/null || true)
  if [[ "${CONFIGURED_SERVER_PUBLIC_KEY}" != "${SERVER_PUBLIC_KEY}" ]]; then
    echo "[verify] state has server public key ${CONFIGURED_SERVER_PUBLIC_KEY:-<missing>}, deployment expects ${SERVER_PUBLIC_KEY}; refusing to start" >&2
    exit 1
  fi
fi

echo "[up] bringing up ${INTERFACE}"
awg-quick up "${CONFIGURATION_FILE}"
awg show

term() { echo "[down] stopping ${INTERFACE}"; awg-quick down "${CONFIGURATION_FILE}" || true; exit 0; }
trap term SIGTERM SIGINT
sleep infinity &
wait $!

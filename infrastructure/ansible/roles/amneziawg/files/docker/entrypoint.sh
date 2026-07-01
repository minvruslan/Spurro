#!/bin/bash
set -euo pipefail

# AmneziaWG server init. Idempotent: if wg0.conf exists, only bring the interface up.
# Server keys, PSK and obfuscation are generated ONCE and persisted to the state volume.

# Must be in sync with:
# infrastructure/src/common/constants/docker/DOCKER_CONTAINER_WITH_AMNEZIAWG.ts
STATE_DIR="/opt/amnezia/awg"
WG_CONF="${STATE_DIR}/wg0.conf"
SERVER_PRIV="${STATE_DIR}/server_private.key"
SERVER_PUB="${STATE_DIR}/server_public.key"
PSK="${STATE_DIR}/psk.key"
OBF_ENV="${STATE_DIR}/obf.env"
MIMICRY_PRESET="/usr/local/share/quic-mimicry.preset"

# Fallback defaults; the app passes real values via env.
# Must be in sync with:
# shared/src/common/constants/amneziawg/AMNEZIAWG_SERVER_ADDRESS.ts
# shared/src/common/constants/amneziawg/AMNEZIAWG_DEFAULT_PORT.ts
WG_ADDRESS="${WG_ADDRESS:-10.8.1.1/24}"
WG_PORT="${WG_PORT:-51820}"

# Egress interface for NAT. This MASQUERADE runs INSIDE the container, so it must be the
# container's own default-route interface (eth0 on a docker bridge) — NOT the host's iface.
# Detect it at runtime so it's correct regardless of how the host names its NICs.
WG_DEVICE="${WG_DEVICE:-$(ip route show default | awk '/default/ {print $5; exit}')}"
WG_DEVICE="${WG_DEVICE:-eth0}"

mkdir -p "${STATE_DIR}"

rand_u32() { od -An -N4 -tu4 /dev/urandom | tr -d ' '; }

if [[ ! -f "${WG_CONF}" ]]; then
  echo "[init] generating server keys"
  awg genkey | tee "${SERVER_PRIV}" | awg pubkey > "${SERVER_PUB}"
  awg genpsk > "${PSK}"
  chmod 600 "${SERVER_PRIV}" "${PSK}"

  # Obfuscation: fixed profile from the mimicry preset (Jc/Jmin/Jmax, S1-S4, H1-H4, I1-I5).
  # obf.env is the preset verbatim so every client inherits the exact same profile.
  cp "${MIMICRY_PRESET}" "${OBF_ENV}"
  chmod 600 "${OBF_ENV}"
  OBF_BLOCK=$(cat "${MIMICRY_PRESET}")

  # Automatic per-node obfuscation (disabled — using the fixed preset above). To restore
  # random generation, re-enable this block AND write obf.env with WG keys (Jc, not JC).
  # JC=$(( (RANDOM % 9) + 4 ))
  # JMIN=$(( (RANDOM % 193) + 64 ))    # 64..256
  # JMAX=$(( (RANDOM % 513) + 512 ))   # 512..1024
  # S1=$(( RANDOM % 65 ))
  # S2=$(( RANDOM % 65 ))
  # while [[ $(( S1 + 56 )) -eq "${S2}" ]]; do S2=$(( RANDOM % 65 )); done
  # S3=$(( RANDOM % 65 ))
  # S4=$(( RANDOM % 33 ))
  # HBAND=1073741822
  # rand_h_range() {
  #   local start=$(( 5 + $1 * HBAND ))
  #   local lo=$(( start + ($(rand_u32) % (HBAND / 2)) ))
  #   local hi=$(( lo + 1 + ($(rand_u32) % (HBAND / 2)) ))
  #   echo "${lo}-${hi}"
  # }
  # H1=$(rand_h_range 0); H2=$(rand_h_range 1); H3=$(rand_h_range 2); H4=$(rand_h_range 3)

  echo "[init] writing ${WG_CONF}"
  cat > "${WG_CONF}" <<EOF
[Interface]
PrivateKey = $(cat "${SERVER_PRIV}")
Address = ${WG_ADDRESS}
ListenPort = ${WG_PORT}

${OBF_BLOCK}

# NAT: client traffic egresses under the server IP
PostUp = iptables -t nat -A POSTROUTING -o ${WG_DEVICE} -j MASQUERADE
PostDown = iptables -t nat -D POSTROUTING -o ${WG_DEVICE} -j MASQUERADE

# peer isolation: clients can't reach each other
PostUp = iptables -A FORWARD -i %i -o %i -j DROP
PostDown = iptables -D FORWARD -i %i -o %i -j DROP

# block tunnel -> hoster internal networks
PostUp = iptables -A FORWARD -i %i -d 10.0.0.0/8 -j DROP
PostUp = iptables -A FORWARD -i %i -d 172.16.0.0/12 -j DROP
PostUp = iptables -A FORWARD -i %i -d 192.168.0.0/16 -j DROP
PostDown = iptables -D FORWARD -i %i -d 10.0.0.0/8 -j DROP
PostDown = iptables -D FORWARD -i %i -d 172.16.0.0/12 -j DROP
PostDown = iptables -D FORWARD -i %i -d 192.168.0.0/16 -j DROP
EOF
  chmod 600 "${WG_CONF}"
  echo "[init] server public key: $(cat "${SERVER_PUB}")"
else
  echo "[init] existing config found — skipping generation"
fi

echo "[up] bringing up wg0"
awg-quick up "${WG_CONF}"
awg show

term() { echo "[down] stopping wg0"; awg-quick down "${WG_CONF}" || true; exit 0; }
trap term SIGTERM SIGINT
sleep infinity &
wait $!

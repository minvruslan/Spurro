#!/bin/sh
set -eu

# Create a new AmneziaWG peer. Reads the client IP from stdin, generates the client
# keypair + preshared key, registers the peer in the running interface and persists
# it to the configuration file under a lock, then prints the generated material back
# on stdout for @spurro/infrastructure to assemble the client configuration.
# File layout and interface come from the image ENV (Dockerfile).

IP=$(cat)

PRIVATE_KEY=$(awg genkey)
PUBLIC_KEY=$(printf '%s' "$PRIVATE_KEY" | awg pubkey)
SERVER_PUBLIC_KEY=$(cat "$SERVER_PUBLIC_KEY_FILE")
PRESHARED_KEY=$(awg genpsk)
OBFUSCATION=$(cat "$OBFUSCATION_FILE")

exec 9>"${CONFIGURATION_FILE}.lock"
flock -x 9

awg show "$INTERFACE" allowed-ips | grep -qFw "$IP/32" && { echo "[amneziawg2] client IP $IP already assigned" >&2; exit 1; }

printf '%s' "$PRESHARED_KEY" | awg set "$INTERFACE" peer "$PUBLIC_KEY" preshared-key /dev/stdin allowed-ips "$IP/32"
printf '\n[Peer]\nPublicKey = %s\nPresharedKey = %s\nAllowedIPs = %s/32\n' "$PUBLIC_KEY" "$PRESHARED_KEY" "$IP" | tee -a "$CONFIGURATION_FILE" >/dev/null
printf 'PRIVATE_KEY=%s\nPUBLIC_KEY=%s\nSERVER_PUBLIC_KEY=%s\nPRESHARED_KEY=%s\nOBFUSCATION_BEGIN\n%s\nOBFUSCATION_END\n' "$PRIVATE_KEY" "$PUBLIC_KEY" "$SERVER_PUBLIC_KEY" "$PRESHARED_KEY" "$OBFUSCATION"

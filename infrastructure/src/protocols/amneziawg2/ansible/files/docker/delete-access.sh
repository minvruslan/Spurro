#!/bin/sh
set -eu

# Delete an AmneziaWG peer. Reads the client public key from stdin, removes the peer
# from the running interface and drops its [Peer] block from the configuration file
# under a lock. File layout and interface come from the image ENV (Dockerfile).

KEY=$(cat)

exec 9>"${CONFIGURATION_FILE}.lock"
flock -x 9

awg set "$INTERFACE" peer "$KEY" remove

awk -v key="$KEY" '
  function flush() { if (buf != "") { if (!drop) printf "%s", buf; buf=""; drop=0 } }
  /^\[Peer\]/ { flush(); buf=$0 ORS; next }
  /^\[Interface\]/ { flush(); print; next }
  { if (buf != "") { buf = buf $0 ORS; if ($1=="PublicKey" && $3==key) drop=1 } else print }
  END { flush() }
' "$CONFIGURATION_FILE" > "$CONFIGURATION_FILE.tmp"
mv "$CONFIGURATION_FILE.tmp" "$CONFIGURATION_FILE"

#!/bin/sh
set -eu

# Delete one or more AmneziaWG peers. Reads client public keys from stdin, one per line.
# Removes each peer from the running interface and drops its [Peer] block from the
# configuration file, all under a single lock. File layout and interface come from
# the image ENV (Dockerfile).

KEYS_FILE=$(mktemp)
trap 'rm -f "$KEYS_FILE"' EXIT
cat > "$KEYS_FILE"
[ -s "$KEYS_FILE" ] || exit 0

exec 9>"${CONFIGURATION_FILE}.lock"
flock -x 9

while IFS= read -r KEY || [ -n "$KEY" ]; do
  [ -n "$KEY" ] || continue
  awg set "$INTERFACE" peer "$KEY" remove
done < "$KEYS_FILE"

awk '
  NR==FNR { if ($0 != "") drop_key[$0]=1; next }
  function flush() { if (buf != "") { if (!drop) printf "%s", buf; buf=""; drop=0 } }
  /^\[Peer\]/ { flush(); buf=$0 ORS; next }
  /^\[Interface\]/ { flush(); print; next }
  { if (buf != "") { buf = buf $0 ORS; if ($1=="PublicKey" && ($3 in drop_key)) drop=1 } else print }
  END { flush() }
' "$KEYS_FILE" "$CONFIGURATION_FILE" > "$CONFIGURATION_FILE.tmp"
mv "$CONFIGURATION_FILE.tmp" "$CONFIGURATION_FILE"

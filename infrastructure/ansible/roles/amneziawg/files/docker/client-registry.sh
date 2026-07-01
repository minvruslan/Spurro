#!/bin/sh
# Human-readable client registry on the node: lets you SSH in and inspect issued
# configs without the app DB. Source of truth stays the app DB; this is a mirror.
# Updated atomically (flock); names are embedded safely via `jq --arg`.
set -eu

# Must be in sync with:
# infrastructure/src/common/constants/docker/DOCKER_CONTAINER_WITH_AMNEZIAWG.ts
DIR=/opt/amnezia/awg
FILE="$DIR/clients.json"
action="${1:-}"

exec 9>"$DIR/clients.lock"
flock 9

[ -f "$FILE" ] || printf '[]' > "$FILE"

case "$action" in
  add)
    name="${2:-}"; pub="${3:-}"; ip="${4:-}"
    ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    jq --arg n "$name" --arg p "$pub" --arg i "$ip" --arg t "$ts" \
      '[.[] | select(.publicKey != $p)] + [{name: $n, publicKey: $p, clientIp: $i, createdAt: $t}]' \
      "$FILE" > "$FILE.tmp"
    mv "$FILE.tmp" "$FILE"
    ;;
  remove)
    pub="${2:-}"
    jq --arg p "$pub" '[.[] | select(.publicKey != $p)]' "$FILE" > "$FILE.tmp"
    mv "$FILE.tmp" "$FILE"
    ;;
  *)
    echo "usage: client-registry.sh add <name> <pub> <ip> | remove <pub>" >&2
    exit 1
    ;;
esac

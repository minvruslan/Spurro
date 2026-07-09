#!/bin/sh
set -eu

# Print the peer -> allowed-ips table of the running interface for @spurro/infrastructure
# to resolve a client public key by IP. Interface comes from the image ENV (Dockerfile).

awg show "$INTERFACE" allowed-ips

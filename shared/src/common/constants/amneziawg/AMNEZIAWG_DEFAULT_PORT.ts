// Default AmneziaWG UDP port. The per-server port is stored on the DB endpoint row.
// Must be in sync with:
// infrastructure/ansible/roles/amneziawg/defaults/main.yml
// infrastructure/ansible/roles/amneziawg/files/docker/entrypoint.sh
export const AMNEZIAWG_DEFAULT_PORT = 51820

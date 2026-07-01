// In-tunnel /24 subnet prefix. Server takes .1, clients .2–.254.
// Must be in sync with:
// infrastructure/ansible/roles/amneziawg/defaults/main.yml
// infrastructure/ansible/roles/amneziawg/files/docker/entrypoint.sh
export const AMNEZIAWG_SUBNET_PREFIX = "10.8.1"

import { AMNEZIAWG_SUBNET_PREFIX } from "./AMNEZIAWG_SUBNET_PREFIX"

// Server's in-tunnel gateway address.
// Must be in sync with:
// infrastructure/ansible/roles/amneziawg/defaults/main.yml
// infrastructure/ansible/roles/amneziawg/files/docker/entrypoint.sh
export const AMNEZIAWG_SERVER_ADDRESS = `${AMNEZIAWG_SUBNET_PREFIX}.1/24`

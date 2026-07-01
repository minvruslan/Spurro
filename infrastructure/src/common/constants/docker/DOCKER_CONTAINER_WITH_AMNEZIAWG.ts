// AmneziaWG VPN container on the node. The main node reaches into it over SSH.
// Must be in sync with:
// infrastructure/ansible/roles/amneziawg/templates/docker-compose.yml.j2
// infrastructure/ansible/roles/amneziawg/files/docker/entrypoint.sh
// infrastructure/ansible/roles/amneziawg/files/docker/client-registry.sh
// infrastructure/ansible/roles/amneziawg/files/docker/Dockerfile
export const DOCKER_CONTAINER_WITH_AMNEZIAWG = {
  name: "amneziawg",
  stateDir: "/opt/amnezia/awg",
  interface: "wg0",
}

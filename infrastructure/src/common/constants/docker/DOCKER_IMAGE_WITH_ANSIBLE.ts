// Main-node image with ansible and ssh. Runs playbooks and reaches nodes over SSH.
// Must be in sync with:
// docker-compose.yml
export const DOCKER_IMAGE_WITH_ANSIBLE = {
  name: "spurro/ansible:local",
}

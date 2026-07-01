// Ephemeral ansible container. The infrastructure/ansible tree is mounted at mountDir; playbook paths are relative to the tree root.
// Must be in sync with:
// infrastructure/ansible/playbooks/provision-server.yml
export const DOCKER_CONTAINER_WITH_ANSIBLE = {
  mountDir: "/ansible",
  playbooksDir: "playbooks",
  provisionServerPlaybookFile: "provision-server.yml",
}

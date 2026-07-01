// Upper bounds so a hung or unreachable node can't pin a resource forever (a worker slot for
// provisioning, or an in-flight HTTP request for peer management). Set generously — well above the
// slowest legitimate run — so we never abort a real operation, which would otherwise surface as a
// dropped HTTP response to the user or a false "provisioning failed".

// Full VPS bootstrap: install Docker, build the AmneziaWG image, bring the container up.
export const ANSIBLE_PLAYBOOK_TIMEOUT_MS = 30 * 60 * 1000

// A single SSH command against an already-provisioned node (add/remove peer).
export const SSH_COMMAND_TIMEOUT_MS = 5 * 60 * 1000

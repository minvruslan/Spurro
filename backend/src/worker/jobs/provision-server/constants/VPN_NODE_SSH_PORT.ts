// SSH port that hardened nodes listen on after provisioning moves sshd off the default 22.
// Pinned into server.data.contract on first provisioning; already-provisioned nodes keep their value.
export const VPN_NODE_SSH_PORT = 13013

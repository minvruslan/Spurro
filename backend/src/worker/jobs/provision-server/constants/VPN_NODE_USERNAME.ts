// Unprivileged service user on nodes: owns the deploy files and runs docker compose.
// Pinned into server.data.contract on first provisioning; already-provisioned nodes keep their value.
export const VPN_NODE_USERNAME = "spurro"

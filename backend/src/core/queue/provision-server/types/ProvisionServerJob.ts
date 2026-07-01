// Only the server id travels through Redis — never SSH credentials. The worker loads ip / port /
// ssh from the app DB by id (see findServer).
export type ProvisionServerJob = {
  serverId: string
}

import type { Server } from "@spurro/api-contract"

export async function getServers(): Promise<Server[]> {
  return useApiClient().servers.getServers()
}

import type { Server } from "@vancloak/api-contract"

export async function getServers(): Promise<Server[]> {
  return useApiClient().servers.getServers()
}

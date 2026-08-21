import type { Server } from "@vancloak/api-contract"

export async function getServer(id: string): Promise<Server> {
  return useApiClient().servers.getServer({ id })
}

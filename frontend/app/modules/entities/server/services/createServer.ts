import type { Server, UpsertServer } from "@vancloak/api-contract"

export async function createServer(payload: UpsertServer): Promise<Server> {
  return useApiClient().servers.createServer(payload)
}

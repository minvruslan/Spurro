import type { Server, UpsertServer } from "@spurro/api-contract"

export async function createServer(payload: UpsertServer): Promise<Server> {
  return useApiClient().servers.createServer(payload)
}

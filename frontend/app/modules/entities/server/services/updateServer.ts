import type { Server, UpsertServer } from "@spurro/api-contract"

export async function updateServer(id: string, payload: UpsertServer): Promise<Server> {
  return useApiClient().servers.updateServer({ id, ...payload })
}

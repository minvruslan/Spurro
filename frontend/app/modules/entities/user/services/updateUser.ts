import type { User, UpsertUser } from "@spurro/api-contract"

export async function updateUser(id: string, payload: UpsertUser): Promise<User> {
  return useApiClient().users.updateUser({ id, ...payload })
}

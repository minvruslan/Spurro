import type { User, UpsertUser } from "@spurro/api-contract"

export async function createUser(payload: UpsertUser): Promise<User> {
  return useApiClient().users.createUser(payload)
}

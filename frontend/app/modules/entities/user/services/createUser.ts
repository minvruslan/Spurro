import type { User, UpsertUser } from "@vancloak/api-contract"

export async function createUser(payload: UpsertUser): Promise<User> {
  return useApiClient().users.createUser(payload)
}

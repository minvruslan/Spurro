import type { User } from "@spurro/api-contract"

export async function getUser(id: string): Promise<User> {
  return useApiClient().users.getUser({ id })
}

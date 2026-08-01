import type { User } from "@spurro/api-contract"

export async function getUsers(): Promise<User[]> {
  return useApiClient().users.getUsers()
}

import type { User } from "@vancloak/api-contract"

export async function getUsers(): Promise<User[]> {
  return useApiClient().users.getUsers()
}

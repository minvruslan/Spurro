import type { Endpoint } from "@spurro/api-contract"

export async function getEndpoints(): Promise<Endpoint[]> {
  return useApiClient().endpoints.getEndpoints()
}

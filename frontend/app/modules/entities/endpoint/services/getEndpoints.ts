import type { Endpoint } from "@vancloak/api-contract"

export async function getEndpoints(): Promise<Endpoint[]> {
  return useApiClient().endpoints.getEndpoints()
}

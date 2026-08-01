import type { Protocol } from "@spurro/api-contract"

export async function getProtocols(): Promise<Protocol[]> {
  return useApiClient().protocols.getProtocols()
}

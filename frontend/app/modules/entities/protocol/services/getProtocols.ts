import type { Protocol } from "@vancloak/api-contract"

export async function getProtocols(): Promise<Protocol[]> {
  return useApiClient().protocols.getProtocols()
}

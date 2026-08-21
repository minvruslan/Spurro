import type { ConfigLimit } from "@vancloak/api-contract"

export async function getConfigLimits(): Promise<ConfigLimit[]> {
  return useApiClient().configLimits.getUserConfigLimits()
}

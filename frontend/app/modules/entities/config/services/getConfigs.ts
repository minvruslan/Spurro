import type { Config } from "@vancloak/api-contract"

export async function getConfigs(): Promise<Config[]> {
  return useApiClient().configs.getUserConfigs()
}

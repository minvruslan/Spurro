import type { Config } from "@spurro/api-contract"

export async function getConfigs(): Promise<Config[]> {
  return useApiClient().configs.getUserConfigs()
}

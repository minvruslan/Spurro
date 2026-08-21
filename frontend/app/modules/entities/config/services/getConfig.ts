import type { Config } from "@vancloak/api-contract"

export async function getConfig(id: string): Promise<Config> {
  return useApiClient().configs.getUserConfig({ id })
}

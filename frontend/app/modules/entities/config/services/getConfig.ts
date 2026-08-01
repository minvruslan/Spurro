import type { Config } from "@spurro/api-contract"

export async function getConfig(id: string): Promise<Config> {
  return useApiClient().configs.getUserConfig({ id })
}

import type { Config, UpdateConfig } from "@spurro/api-contract"

export async function updateConfig(id: string, payload: UpdateConfig): Promise<Config> {
  return useApiClient().configs.updateUserConfig({ id, ...payload })
}

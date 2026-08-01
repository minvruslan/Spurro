import type { Config, UpsertConfig } from "@spurro/api-contract"

export async function createConfig(payload: UpsertConfig): Promise<Config> {
  return useApiClient().configs.createUserConfig(payload)
}

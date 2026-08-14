import type { z } from "zod"
import type { Config, UpsertConfigSchema } from "@spurro/api-contract"

export async function createConfig(payload: z.input<typeof UpsertConfigSchema>): Promise<Config> {
  return useApiClient().configs.createUserConfig(payload)
}

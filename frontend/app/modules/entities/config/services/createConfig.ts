import type { z } from "zod"
import type { UpsertConfigSchema } from "@vancloak/api-contract"
import type { CreatedConfig } from "../types/CreatedConfig"

export async function createConfig(
  payload: z.input<typeof UpsertConfigSchema>,
): Promise<CreatedConfig> {
  return useApiClient().configs.createUserConfig(payload)
}

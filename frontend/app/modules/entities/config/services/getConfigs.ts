import type { Config } from "@spurro/shared"
import { ConfigSchema } from "@spurro/shared"
import { z } from "zod"
import { useApi } from "@/modules/common/services"

const ResponseSchema = z.object({ data: z.array(ConfigSchema) })

export async function getConfigs(): Promise<Config[]> {
  const api = useApi()
  const response = await api("/api/configs")
  return ResponseSchema.parse(response).data
}

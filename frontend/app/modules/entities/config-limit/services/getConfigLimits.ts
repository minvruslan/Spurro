import type { ConfigLimit } from "@spurro/shared"
import { ConfigLimitSchema } from "@spurro/shared"
import { z } from "zod"
import { useApi } from "@/modules/common/services"

const ResponseSchema = z.object({ data: z.array(ConfigLimitSchema) })

export async function getConfigLimits(): Promise<ConfigLimit[]> {
  const api = useApi()
  const response = await api("/api/config-limits")
  return ResponseSchema.parse(response).data
}

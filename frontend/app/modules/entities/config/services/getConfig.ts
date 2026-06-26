import type { Config } from "@spurro/shared"
import { ConfigSchema } from "@spurro/shared"
import { z } from "zod"
import { useApi } from "@/modules/common/services"

const ResponseSchema = z.object({ data: ConfigSchema })

export async function getConfig(id: string): Promise<Config> {
  const api = useApi()
  const response = await api(`/api/configs/${id}`)
  return ResponseSchema.parse(response).data
}

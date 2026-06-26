import type { Config, UpdateConfig } from "@spurro/shared"
import { ConfigSchema } from "@spurro/shared"
import { z } from "zod"
import { useApi } from "@/modules/common/services"

const ResponseSchema = z.object({ data: ConfigSchema })

export async function updateConfig(id: string, payload: UpdateConfig): Promise<Config> {
  const api = useApi()
  const response = await api(`/api/configs/${id}`, {
    method: "PUT",
    body: payload,
  })
  return ResponseSchema.parse(response).data
}

import type { Config, UpsertConfig } from "@spurro/shared"
import { ConfigSchema } from "@spurro/shared"
import { z } from "zod"
import { useApi } from "@/modules/common/services"

const ResponseSchema = z.object({ data: ConfigSchema })

export async function createConfig(payload: UpsertConfig): Promise<Config> {
  const api = useApi()
  const response = await api("/api/configs", {
    method: "POST",
    body: payload,
  })
  return ResponseSchema.parse(response).data
}

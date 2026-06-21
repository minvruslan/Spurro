import type { ProtocolType } from "@spurro/shared"
import { ProtocolTypeSchema } from "@spurro/shared"
import { z } from "zod"
import { useApi } from "@/modules/shared/services"

const ResponseSchema = z.object({ data: z.array(ProtocolTypeSchema) })

export async function getProtocolTypes(): Promise<ProtocolType[]> {
  const api = useApi()
  const response = await api("/api/protocol-types")
  return ResponseSchema.parse(response).data
}

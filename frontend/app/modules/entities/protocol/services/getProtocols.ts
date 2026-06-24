import type { Protocol } from "@spurro/shared"
import { ProtocolSchema } from "@spurro/shared"
import { z } from "zod"
import { useApi } from "@/modules/common/services"

const ResponseSchema = z.object({ data: z.array(ProtocolSchema) })

export async function getProtocols(): Promise<Protocol[]> {
  const api = useApi()
  const response = await api("/api/protocols")
  return ResponseSchema.parse(response).data
}

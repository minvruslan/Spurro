import type { Endpoint } from "@spurro/shared"
import { EndpointSchema } from "@spurro/shared"
import { z } from "zod"
import { useApi } from "@/modules/common/services"

const ResponseSchema = z.object({ data: z.array(EndpointSchema) })

export async function getEndpoints(): Promise<Endpoint[]> {
  const api = useApi()
  const response = await api("/api/endpoints")
  return ResponseSchema.parse(response).data
}

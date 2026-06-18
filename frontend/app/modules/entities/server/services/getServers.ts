import type { Server } from "@spurro/shared"
import { ServerSchema } from "@spurro/shared"
import { z } from "zod"
import { useApi } from "@/modules/shared/services"

const ResponseSchema = z.object({ data: z.array(ServerSchema) })

export async function getServers(): Promise<Server[]> {
  const api = useApi()
  const response = await api("/api/servers")
  return ResponseSchema.parse(response).data
}

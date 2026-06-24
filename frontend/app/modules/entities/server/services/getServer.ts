import type { Server } from "@spurro/shared"
import { ServerSchema } from "@spurro/shared"
import { z } from "zod"
import { useApi } from "@/modules/common/services"

const ResponseSchema = z.object({ data: ServerSchema })

export async function getServer(id: string): Promise<Server> {
  const api = useApi()
  const response = await api(`/api/servers/${id}`)
  return ResponseSchema.parse(response).data
}

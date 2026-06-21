import type { Server, UpsertServer } from "@spurro/shared"
import { ServerSchema } from "@spurro/shared"
import { z } from "zod"
import { useApi } from "@/modules/shared/services"

const ResponseSchema = z.object({ data: ServerSchema })

export async function updateServer(id: string, payload: UpsertServer): Promise<Server> {
  const api = useApi()
  const response = await api(`/api/servers/${id}`, {
    method: "PUT",
    body: payload,
  })
  return ResponseSchema.parse(response).data
}
